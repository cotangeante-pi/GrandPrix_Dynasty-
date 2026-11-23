// Les batailles en ligne : le cœur du « lockstep », en calcul pur (ni Three.js, ni réseau, ni page). Tout est derrière REGLAGES.EN_LIGNE
// (donnees.js, faux par défaut) : tant que rien n'appelle ce fichier, le jeu est celui d'avant. Voir rapports/en-ligne-conception.md.
//
// Le principe : chaque client simule TOUTE la course (la même que le mode 2 joueurs : simulation.js, course.js, depart.js, ia.js), avec la même
// graine, au bit près ; seules les COMMANDES de chaque joueur voyagent. Un pas de physique n'avance que quand les commandes de tous les
// joueurs pour ce pas sont là. Une commande prise au pas n agit au pas n + délai (EN_LIGNE_DELAI) : le temps de voyager. Toutes les
// EN_LIGNE_CONTROLE pas, une empreinte de l'état est comparée : si elle diffère, les clients ne voient plus la même course (désynchro).
//
// L'interface (tout est synchrone, rien ne lit l'horloge) :
//   EN_LIGNE.actif()                          → REGLAGES.EN_LIGNE
//   EN_LIGNE.version()                        → { v, h } : la version du calcul (champ « version » de creer / rejoindre ; h = empreinte des réglages)
//   EN_LIGNE.reglagesValides(r, nbJoueurs)    → les réglages de l'hôte { circuit, tours, meteo, nbIA } corrigés (les mêmes sur tous les clients)
//   EN_LIGNE.demarrer(depart, moi, envoyer, options)   → la partie, depuis le message {t:'depart', reglages, graine, ordre} ; moi = mon id ;
//                                              envoyer(msg) = ce qu'on envoie au serveur (les messages du client : cmd, controle) ; options : { carte, circuit, delai }
//   partie.local = { gaz, frein, direction, remise }   ← la page y met les commandes du joueur (à tout moment : lues quand elles sont prises)
//   partie.recevoir(msg)                      ← les messages du serveur : cmd, controle, parti (les autres sont ignorés)
//   partie.avancer(max)                       → le nombre de pas faits (0 si on attend quelqu'un, ou si la partie est arrêtée) ; la page l'appelle
//                                              dans la boucle (BOUCLE.surPhysique : 1 pas à chaque appel, ou plus pour rattraper)
//   partie.quitter(id)                        ← le serveur dit « parti » : le joueur est remplacé par des commandes neutres après sa dernière commande
//   partie.e                                  la course (comme DEUX_JOUEURS.creer) ; partie.pilotes : Map id → pilote (p.v = la voiture) ; partie.moi : mon pilote
//   partie.n                                  le prochain pas à faire (= le nombre de pas faits) ; partie.attente : les ids qu'on attend (null : personne)
//   partie.desynchro                          null, ou { n, de, miens, siens } : l'empreinte de `de` au pas n n'est pas la nôtre (la partie s'arrête)
//   partie.finie()                            tous les humains encore là sont arrivés (ou toutes les voitures)
//   partie.fin                                null, ou le pas où la course en ligne est finie POUR TOUS (la même chose chez tous les clients, car décidé à un pas
//                                              précis : tout le monde a fini, ou ARRIVEE_ATTENTE_MAX s après le dernier humain arrivé) ; la partie n'avance plus après
//   partie.empreinte()                        l'empreinte de l'état maintenant (un entier de 32 bits)
//   EN_LIGNE.coder(c) / EN_LIGNE.decoder(x)   une commande { gaz, frein, direction, remise } ↔ un entier (14 bits) ; c'est l'entier qui voyage
//   EN_LIGNE.banc(ids, options)               un faux réseau en mémoire (latences réglables) qui relie plusieurs parties : pour les tests
//
// Le protocole (fixé par le Chef, tour 56) : client→serveur {t:'cmd', n, c} (n : le PREMIER pas du paquet, c : un tableau d'entiers, un par pas,
// ou un seul entier), {t:'controle', n, h} ; serveur→client {t:'cmd', de, n, c}, {t:'controle', de, n, h}, {t:'parti', id}.
const EN_LIGNE = (function () {
  const R = REGLAGES;
  const PAS = R.PAS_PHYSIQUE;
  // le format des commandes (le protocole, pas un réglage de jeu) : gaz et frein sur 4 bits (0 à 15 = 0 à 1), la direction sur 5 bits
  // (0 à 30 = -1 à 1, 15 = tout droit), la remise en piste sur 1 bit (un niveau : « la touche est tenue »)
  const Q = 15;
  const CODE_MAX = (1 << 14) - 1;
  const LISTE_MAX = 128;   // commandes au plus dans un message « cmd » reçu (un paquet fait EN_LIGNE_PAQUET pas, jamais plus que le délai)
  const NEUTRE = { gaz: 0, frein: 0, direction: 0, remise: false };
  const AUCUNE = { gaz: 0, frein: 0, direction: 0 }, FREIN_SEUL = { gaz: 0, frein: 1, direction: 0 };
  const CODE_NEUTRE = (Q << 8);

  const actif = () => !!R.EN_LIGNE;
  const adresseAutorisee = () => R.EN_LIGNE_ADRESSE !== false || !!R.EN_LIGNE;   // (tour 59) une adresse (?enligne=1, ?enlignecourse=…) peut-elle ouvrir le jeu en ligne ? (principal.js) ; EN_LIGNE vrai : le jeu est ouvert, les adresses des écrans (?enlignecourse=menu) doivent marcher

  // --- les commandes, en entiers
  const nombre = x => (typeof x === 'number' && x === x) ? x : 0;
  const borner = (x, a, b) => x < a ? a : x > b ? b : x;
  function coder(c) {
    c = c || NEUTRE;
    const g = Math.round(borner(nombre(c.gaz), 0, 1) * Q), f = Math.round(borner(nombre(c.frein), 0, 1) * Q), d = Math.round(borner(nombre(c.direction), -1, 1) * Q) + Q;
    return g | (f << 4) | (d << 8) | (c.remise ? 1 << 13 : 0);
  }
  // un entier venu du réseau : valide (entier de 0 à 2^14 - 1) ou non (null) ; un champ trop grand est ramené à sa borne
  function codeValide(x) { return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= CODE_MAX; }
  function decoder(x) {
    if (!codeValide(x)) x = CODE_NEUTRE;
    return { gaz: (x & 15) / Q, frein: ((x >> 4) & 15) / Q, direction: borner(((x >> 8) & 31) - Q, -Q, Q) / Q, remise: ((x >> 13) & 1) === 1 };
  }

  // --- l'empreinte de l'état : FNV-1a sur les bits exacts des nombres (un seul bit de différence change l'empreinte)
  const tampon = new Float64Array(1), mots = new Uint32Array(tampon.buffer);
  function melanger(h, x) { h ^= x; return Math.imul(h, 16777619) >>> 0; }
  function melangerNombre(h, x) {
    tampon[0] = x;
    return melanger(melanger(h, mots[0]), mots[1]);
  }
  function melangerTexte(h, s) { for (let i = 0; i < s.length; i++) h = melanger(h, s.charCodeAt(i)); return melanger(h, 0xff); }
  // un objet de nombres, de booléens, de textes et de tableaux de nombres (les clés triées : l'ordre d'insertion ne compte pas) ; les Set, les
  // Map, les fonctions et les objets au-delà de `profondeur` ne comptent pas
  function melangerObjet(h, o, profondeur) {
    for (const k of Object.keys(o).sort()) {
      const x = o[k], t = typeof x;
      if (t === 'number') h = melangerNombre(melangerTexte(h, k), x);
      else if (t === 'boolean') h = melanger(melangerTexte(h, k), x ? 1 : 2);
      else if (t === 'string') h = melangerTexte(melangerTexte(h, k), x);
      else if (x === null) h = melanger(melangerTexte(h, k), 3);
      else if (Array.isArray(x)) { h = melanger(melangerTexte(h, k), x.length); if (x.length && typeof x[0] === 'number') for (const y of x) h = melangerNombre(h, y); }
      else if (t === 'object' && profondeur > 0 && !(x instanceof Set) && !(x instanceof Map)) h = melangerObjet(melangerTexte(h, k), x, profondeur - 1);
    }
    return h;
  }
  const PROFONDEUR_VOITURE = 2;   // v.piste, v.pneus, v.avant : des objets de nombres
  function empreinte(e) {
    let h = 2166136261;
    h = melangerNombre(h, e.temps);
    h = melanger(h, e.arrives);
    for (const p of e.pilotes) {
      h = melangerObjet(h, p.v, PROFONDEUR_VOITURE);
      const c = p.course;
      h = melangerNombre(h, c.progression); h = melangerNombre(h, c.temps); h = melangerNombre(h, c.penalites); h = melangerTexte(h, c.etat);
      h = melanger(h, c.tours.length);
      h = melanger(h, p.arrivee === null ? (p.abandon ? 2 : 0) : 1);
      if (p.arrivee !== null) h = melangerNombre(h, p.arrivee);
    }
    return h >>> 0;
  }

  // --- des fonctions Math à nous (EN_LIGNE_MATHS). La spécification ne dit pas le dernier bit de sin, cos, tan, atan, atan2, exp, hypot : Chrome,
  // Safari (iPhone) et Firefox peuvent différer d'un bit, et une course lockstep diverge alors en quelques secondes. Ici, seulement + - * / et
  // sqrt (exacts selon IEEE 754), floor et round : le même résultat au bit près sur tous les navigateurs. Précision de l'ordre de 1e-15.
  const maths = (function () {
    const PI = Math.PI, PIO2 = PI / 2;
    const PIO2_1 = 1.57079632673412561417e+00, PIO2_1T = 6.07710050650619224932e-11;   // π/2 en deux morceaux (fdlibm) : k × PIO2_1 est exact
    const DEUX_SUR_PI = 0.6366197723675814;
    const LN2_HI = 6.93147180369123816490e-01, LN2_LO = 1.90821492927058770002e-10, LOG2E = 1.4426950408889634;
    const S3 = Math.sqrt(3), TAN15 = 0.2679491924311227, PIO6 = PI / 6;
    const SIN_C = [], COS_C = [];   // (-1)^i / (2i+1)! et (-1)^i / (2i)!, calculés par divisions
    { let f = 1; for (let i = 0; i < 14; i++) { if (i > 0) f /= (2 * i) * (2 * i + 1); SIN_C.push(i % 2 ? -f : f); }
      f = 1; for (let i = 0; i < 14; i++) { if (i > 0) f /= (2 * i - 1) * (2 * i); COS_C.push(i % 2 ? -f : f); } }
    const sinPetit = r => { const u = r * r; let p = SIN_C[13]; for (let i = 12; i >= 0; i--) p = SIN_C[i] + u * p; return r * p; };
    const cosPetit = r => { const u = r * r; let p = COS_C[13]; for (let i = 12; i >= 0; i--) p = COS_C[i] + u * p; return p; };
    function reduire(x) { const k = Math.floor(x * DEUX_SUR_PI + 0.5); return { r: (x - k * PIO2_1) - k * PIO2_1T, q: ((k % 4) + 4) % 4 }; }
    function sin(x) {
      if (x !== x || x === Infinity || x === -Infinity) return NaN;
      const { r, q } = reduire(x);
      return q === 0 ? sinPetit(r) : q === 1 ? cosPetit(r) : q === 2 ? -sinPetit(r) : -cosPetit(r);
    }
    function cos(x) {
      if (x !== x || x === Infinity || x === -Infinity) return NaN;
      const { r, q } = reduire(x);
      return q === 0 ? cosPetit(r) : q === 1 ? -sinPetit(r) : q === 2 ? -cosPetit(r) : sinPetit(r);
    }
    const tan = x => sin(x) / cos(x);
    const ATAN_C = []; for (let i = 0; i < 18; i++) ATAN_C.push((i % 2 ? -1 : 1) / (2 * i + 1));
    function atanPetit(t) { const u = t * t; let p = ATAN_C[17]; for (let i = 16; i >= 0; i--) p = ATAN_C[i] + u * p; return t * p; }
    function atanPositif(x) {   // x ≥ 0
      if (x > 1) return PIO2 - atanPositif(1 / x);
      if (x > TAN15) return PIO6 + atanPetit((x * S3 - 1) / (S3 + x));
      return atanPetit(x);
    }
    function atan(x) { if (x !== x) return NaN; return x < 0 ? -atanPositif(-x) : atanPositif(x); }
    function atan2(y, x) {
      if (y !== y || x !== x) return NaN;
      if (x === 0) {
        if (y > 0) return PIO2;
        if (y < 0) return -PIO2;
        return (1 / x < 0) ? ((1 / y < 0) ? -PI : PI) : y;   // (±0, ±0)
      }
      if (x > 0) return atan(y / x);
      const a = atan(y / x);
      return (y > 0 || (y === 0 && 1 / y > 0)) ? a + PI : a - PI;
    }
    const fenetre = new Float64Array(1), motsF = new Uint32Array(fenetre.buffer);
    function deuxPuissance(k) { motsF[0] = 0; motsF[1] = ((k + 1023) << 20) >>> 0; return fenetre[0]; }   // 2^k exact, -1022 ≤ k ≤ 1023
    function exp(x) {
      if (x !== x) return NaN;
      if (x > 709.78) return Infinity;
      if (x < -745.2) return 0;
      const k = Math.floor(x * LOG2E + 0.5), r = (x - k * LN2_HI) - k * LN2_LO;
      let p = 1; for (let n = 18; n >= 1; n--) p = 1 + p * r / n;
      const k1 = Math.floor(k / 2), k2 = k - k1;
      return p * deuxPuissance(k1) * deuxPuissance(k2);
    }
    function hypot() {
      let s = 0, nan = false;
      for (let i = 0; i < arguments.length; i++) { const a = +arguments[i]; if (a === Infinity || a === -Infinity) return Infinity; if (a !== a) nan = true; s += a * a; }
      return nan ? NaN : Math.sqrt(s);
    }
    // l'échange : pendant une course en ligne, Math.sin… sont les siennes (comptés : plusieurs parties, un seul retour)
    const noms = ['sin', 'cos', 'tan', 'atan', 'atan2', 'exp', 'hypot'], siennes = { sin, cos, tan, atan, atan2, exp, hypot };
    const origine = {}; let actives = 0;
    function activer() { if (actives++ === 0) for (const n of noms) { origine[n] = Math[n]; Math[n] = siennes[n]; } return actives; }
    function desactiver() { if (actives > 0 && --actives === 0) for (const n of noms) Math[n] = origine[n]; return actives; }
    return Object.assign({ activer, desactiver, actives: () => actives }, siennes);
  })();

  // --- la version du calcul : EN_LIGNE_VERSION (à monter à la main) et l'empreinte de tous les réglages (une valeur qui change = un autre jeu)
  // (tour 59) les réglages qui ne changent pas la course (R.EN_LIGNE_HORS_EMPREINTE : le commentateur) ne comptent pas ; `neuf` refait le calcul (les tests)
  let versionCache = null;
  function version(neuf) {
    if (neuf || !versionCache) {
      const sansEnLigne = {}, horsEmpreinte = Array.isArray(R.EN_LIGNE_HORS_EMPREINTE) ? R.EN_LIGNE_HORS_EMPREINTE : [];
      for (const k of Object.keys(R).sort()) if (!k.startsWith('EN_LIGNE') && !horsEmpreinte.includes(k)) sansEnLigne[k] = R[k];
      versionCache = { v: R.EN_LIGNE_VERSION, h: melangerTexte(2166136261, JSON.stringify(sansEnLigne)) >>> 0 };
    }
    return { v: versionCache.v, h: versionCache.h };
  }

  // --- les réglages de l'hôte, corrigés : les mêmes sur tous les clients (le serveur les relaie tels quels)
  function reglagesValides(r, nbJoueurs) {
    r = r && typeof r === 'object' ? r : {};
    const nbJ = Math.max(1, Math.min(R.EN_LIGNE_JOUEURS_MAX, Number.isInteger(nbJoueurs) ? nbJoueurs : 1));
    const circuit = typeof r.circuit === 'string' && Object.prototype.hasOwnProperty.call(CIRCUITS, r.circuit) ? r.circuit : 'test';
    const tours = Number.isInteger(r.tours) && r.tours >= 1 && r.tours <= R.EN_LIGNE_TOURS_MAX ? r.tours : R.EN_LIGNE_TOURS_DEFAUT;
    const meteo = R.EN_LIGNE_METEOS.includes(r.meteo) ? r.meteo : R.EN_LIGNE_METEOS[0];
    const iaMax = Math.max(0, Math.min(R.EN_LIGNE_IA_MAX, R.EN_LIGNE_VOITURES_MAX - nbJ));
    const nbIA = Number.isInteger(r.nbIA) && r.nbIA >= 0 ? Math.min(r.nbIA, iaMax) : 0;
    const sortie = { circuit, tours, meteo, nbIA };
    if (Number.isInteger(r.delai) && r.delai >= 1 && r.delai <= 120) sortie.delai = r.delai;   // facultatif : l'hôte peut imposer le délai d'entrée (le même pour tous)
    return sortie;
  }

  // --- la course : le circuit, la carte, la météo
  // (avec nos maths : un circuit construit exprès avec elles, jamais celui du navigateur : sa géométrie est calculée avec sin, cos, atan2)
  const circuits = new Map();
  function circuitDe(nom) {
    const cle = nom + (maths.actives() ? '#maths' : '');
    if (!circuits.has(cle)) circuits.set(cle, nom === 'test' && !maths.actives() ? CIRCUIT_TEST : construireCircuit(CIRCUITS[nom]));
    return circuits.get(cle);
  }

  // le circuit et sa carte d'avance, avec nos maths (EN_LIGNE_MATHS) : ils prennent une à deux secondes ; la page peut les préparer dès que l'hôte
  // a choisi le circuit (la salle d'attente), puis demarrer() les retrouve (même objet) sans attendre. → { circuit, carte }
  function preparerCircuit(nom) {
    const noms = Object.prototype.hasOwnProperty.call(CIRCUITS, nom) ? nom : 'test';
    const avant = R.NIVEAU, pose = !!R.EN_LIGNE_MATHS;
    R.NIVEAU = R.EN_LIGNE_NIVEAU;
    if (pose) maths.activer();
    try { const circuit = circuitDe(noms); return { circuit, carte: carteDe(circuit) }; }
    finally { if (pose) maths.desactiver(); R.NIVEAU = avant; }
  }

  // le plan de météo, comme planMeteo de principal.js mais sans l'adresse de la page : la même sur tous les clients
  function planMeteo(choix, nomCircuit, graine, nbTours, circuit) {
    const duree = Math.max(1, nbTours) * circuit.longueur / R.METEO_VITESSE_MOYENNE;
    if (choix === 'sec') return { prevision: { type: 'sec', pourcent: 0 }, debut: 0, change: null };
    if (choix === 'nuageux') return { prevision: { type: 'nuageux', pourcent: 20 }, debut: 0, change: null };   // (les écrans : couvert, sans pluie)
    if (choix === 'pluie') return { prevision: { type: 'pluie', pourcent: 100 }, debut: 0.8, change: null };
    if (choix === 'averse') return { prevision: { type: 'risque', pourcent: 100 }, debut: 0, change: { t: duree / 3, pluie: 0.8 } };
    if (choix === 'eclaircie') return { prevision: { type: 'pluie', pourcent: 100 }, debut: 0.8, change: { t: duree / 3, pluie: 0 } };
    return METEO.plan(nomCircuit, graine, duree);
  }

  // la grille tirée au sort (la graine de la course + GRAINE_GRILLE_LIGNE) : tous les joueurs et les IA mélangés
  function placerGrille(e, graine) {
    const c = e.circuit, P = e.pilotes, n = P.length;
    ALEATOIRE.semer(graine + R.GRAINE_GRILLE_LIGNE);
    const ordre = P.slice();
    for (let i = n - 1; i > 0; i--) { const k = Math.floor(hasard() * (i + 1)); [ordre[i], ordre[k]] = [ordre[k], ordre[i]]; }
    ALEATOIRE.semer();
    const places = placesGrille(c, n);
    ordre.forEach((p, k) => {
      placerSurPiste(p.v, c, places[k].s, places[k].d);
      p.depart = places[k].s - c.longueur;
      if (p.pilote) p.pilote.grille = p.v.piste.d;
    });
    e.devant.clear();
    e.grille = ordre.map(p => ({ numero: p.numero, qualif: null }));
  }

  // la course de N joueurs (les N dernières voitures, dans l'ordre de `ordre`) et nbIA IA, comme DEUX_JOUEURS.creer mais pour N : la
  // même graine donne la même course partout. Le niveau des IA est celui de EN_LIGNE_NIVEAU, quel que soit celui de la carrière du client.
  // → { e, humains : [pilote…] } (humains[i] : le joueur ordre[i])
  function creerCourseEnLigne(reglages, graine, nbHumains, options) {
    const o = options || {};
    const niveauAvant = R.NIVEAU;
    R.NIVEAU = R.EN_LIGNE_NIVEAU;
    try {
      const circuit = o.circuit || circuitDe(reglages.circuit);
      const carte = o.carte || carteDe(circuit);
      // nbIA + nbHumains voitures : creerCourseIA en fait nb + 1 (la dernière est humaine), les autres joueurs sont les dernières IA
      const e = creerCourseIA(circuit, reglages.nbIA + nbHumains - 1, reglages.tours, graine, carte, true);
      e.sansDrapeaux = true;   // les drapeaux (un seul joueur à la fois dans drapeaux.js) : pas en ligne pour l'instant
      e.enLigne = true;
      const humains = e.pilotes.slice(reglages.nbIA);
      humains.forEach((p, i) => {
        const v = p.v;
        p.humain = true; p.pilote = null; p.rythme = null; p.qualif = null; p.joueur = i + 1;
        delete v.ia; v.joueur = true;
        if (R.PNEUS_ACTIFS) { v.pneus = creerPneus(); delete v.changeurs; v.adherence = 1; } else v.pneus = null;
      });
      placerGrille(e, graine);
      if (R.METEO_ACTIVE) poserMeteo(e, planMeteo(reglages.meteo, reglages.circuit, graine, reglages.tours, circuit));
      armerFeux(e.pilotes, graine);
      return { e, humains };
    } finally {
      R.NIVEAU = niveauAvant;
    }
  }

  // --- la conduite d'un joueur humain à un pas, depuis sa commande décodée (comme conduireJoueur de principal.js, sans la page : ni
  // touches, ni aides au pilotage, ni choix des pneus à l'arrêt pour l'instant)
  function conduire(e, p, c, dt) {
    const front = c.remise && !p.remisePrec;   // « retour en piste » : l'appui (le passage de lâchée à tenue), une fois
    p.remisePrec = c.remise;
    if (front && courseAutorise(p.course)) remettreSurPiste(p.v, e.circuit);
    let cibles = c;
    const d = p.course.depart;
    if (d && d.lance === null) {
      DEPART.commande(d, c.gaz > 0, p.course.compte, false);
      if (d.lance === null) cibles = AUCUNE;
    }
    lisserCommandes(p.v, commandesPermises(p.course) ? cibles : p.course.etat === 'finie' ? FREIN_SEUL : AUCUNE, dt);
    if (p.v.pneus) { pasPneus(p.v.pneus, p.v, dt, REGLAGES_PNEUS.GESTION_MOYENNE); p.v.adherence = facteurAdherence(p.v.pneus.usure); }
  }

  // --- le délai d'entrée choisi au départ (tour 61) : le plus petit qui tient pour tous. rtts : les temps d'aller-retour (ms) mesurés de chaque joueur
  // avec le relais ; une commande de A passe par le relais avant d'arriver chez B (la moitié de l'aller-retour de chacun), donc le trajet à tenir est la
  // moyenne des deux plus lents ; on le compte en pas de physique, plus la marge, entre EN_LIGNE_DELAI et EN_LIGNE_DELAI_MAX. Aucune mesure : EN_LIGNE_DELAI.
  // C'est la même règle que serveur/relais.py (_delai) ; le résultat voyage dans le message de départ (reglages.delai) : le même chez tous les clients.
  function delaiPour(rtts) {
    const l = (Array.isArray(rtts) ? rtts : []).filter(x => typeof x === 'number' && x >= 0 && x < Infinity).sort((a, b) => b - a);
    if (!l.length) return R.EN_LIGNE_DELAI;
    const trajet = l.length > 1 ? (l[0] + l[1]) / 2 : l[0];
    return Math.max(R.EN_LIGNE_DELAI, Math.min(R.EN_LIGNE_DELAI_MAX, Math.ceil(trajet / (R.PAS_PHYSIQUE * 1000)) + R.EN_LIGNE_DELAI_MARGE));
  }

  // --- l'AFFICHAGE d'une course en ligne (tour 61) : rien de ce qui suit n'entre dans la simulation (jamais d'écriture dans la course)
  // une copie profonde d'une voiture (nombres, tableaux, objets simples) : la prédiction joue sur la copie
  function copier(x) {
    if (x === null || typeof x !== 'object') return x;
    if (ArrayBuffer.isView(x)) return x.slice();
    if (Array.isArray(x)) return x.map(copier);
    if (x instanceof Map || x instanceof Set) return x;   // (pas d'écriture : la copie les partage)
    const o = {};
    for (const k of Object.keys(x)) o[k] = copier(x[k]);
    return o;
  }

  // le lisseur : garde la position de chaque voiture après chacun des derniers pas (noter), et donne une position à un instant d'affichage `d` (en pas,
  // fractionnaire) qui suit l'instant visé en douceur : après une attente, une rafale de pas ne fait pas sauter les voitures, l'affichage rattrape au plus
  // à double vitesse ; il ne recule jamais ni ne dépasse le dernier pas connu ; trop en retard (EN_LIGNE_LISSAGE_MAX pas) : il saute.
  function creerLisseur(taille) {
    const T = Math.max(8, Math.floor(taille || 64));
    const anneau = new Array(T).fill(null);
    let dernier = -1, d = null;
    const lisseur = {
      get dernier() { return dernier; },
      get instant() { return d; },
      // les positions [{x, z, cap}…] de toutes les voitures après s pas (appelé à chaque pas, dans l'ordre)
      noter(s, positions) {
        if (s <= dernier) { lisseur.vider(); }
        anneau[s % T] = { s, p: positions.map(q => ({ x: q.x, z: q.z, cap: q.cap })) };
        dernier = s;
      },
      vider() { anneau.fill(null); dernier = -1; d = null; },
      // une image : dtPas = le temps de l'image en pas de physique ; alpha = la fraction du pas suivant déjà écoulée (boucle.js)
      avancer(dtPas, alpha, direct) {
        if (dernier < 0) return null;
        const a = alpha > 0 ? (alpha < 1 ? alpha : 1) : 0;
        const cible = Math.min(dernier, dernier - 1 + a);   // ce que l'affichage d'avant aurait montré
        if (d === null || direct || cible - d > R.EN_LIGNE_LISSAGE_MAX) d = Math.max(0, cible);   // direct : sans lissage (EN_LIGNE_LISSAGE faux)
        else if (cible > d) {
          const ecart = cible - d;
          d = Math.min(dernier, d + Math.max(0, dtPas) * (1 + Math.min(1, ecart * 0.25)), Math.max(cible, d));   // jusqu'à ×2, sans dépasser la cible
        }
        return d;
      },
      // la voiture k à l'instant d : entre deux pas notés (le plus ancien gardé si l'instant est plus vieux que la mémoire)
      lire(k) {
        if (d === null || dernier < 0) return null;
        let i = Math.floor(d); const f = d - i;
        const a = anneau[i % T], b = anneau[(i + 1) % T];
        const A = a && a.s === i ? a.p[k] : null, B = b && b.s === i + 1 ? b.p[k] : null;
        if (A && B) {
          let dc = B.cap - A.cap;
          dc = Math.atan2(Math.sin(dc), Math.cos(dc));
          return { x: A.x + (B.x - A.x) * f, z: A.z + (B.z - A.z) * f, cap: A.cap + dc * f };
        }
        const X = A || B || (anneau[dernier % T] && anneau[dernier % T].p[k]);
        return X ? { x: X.x, z: X.z, cap: X.cap } : null;
      },
    };
    return lisseur;
  }

  // --- l'instantané (tour 61) : l'état ENTIER de la course (les voitures, les IA avec leurs choix en cours, la météo, les feux…), sérialisé, pour qu'un client
  // qui ne voit plus la même course (désynchro) reparte de celui de l'hôte, au bit près (les nombres JSON se relisent exactement).
  // Ce qui est immuable (le circuit et la carte des IA, très gros : 800 ko) n'est pas copié : un renvoi par chemin (« $x ») vers l'objet que le client a déjà.
  // L'arbre : nombre, texte, booléen, null tels quels ; un tableau = un tableau ; un objet = un objet (clés triées) ; les cas spéciaux ont une clé en « $ » :
  // $n (NaN, ±infini, -0), $u (undefined), $r (un objet déjà vu : son numéro, dans l'ordre où l'arbre est parcouru), $x (un renvoi vers le circuit ou la carte),
  // $m (Map : [[clé, valeur]…] dans l'ordre), $s (Set), $f (tableau typé). L'application se fait SUR PLACE : les objets du client (les pilotes de la partie,
  // les voitures, leurs tableaux) gardent leur identité, seul leur contenu est réécrit.
  const instantane = (function () {
    const TYPES = { Float64Array, Float32Array, Int32Array, Uint32Array, Int16Array, Uint16Array, Int8Array, Uint8Array };
    const special = x => ({ $n: x !== x ? 'N' : x === Infinity ? 'I' : x === -Infinity ? '-I' : 'Z' });
    const nombre = x => (x === x && x !== Infinity && x !== -Infinity && !(x === 0 && 1 / x < 0)) ? x : special(x);
    const lireNombre = z => z === 'N' ? NaN : z === 'I' ? Infinity : z === '-I' ? -Infinity : -0;
    const simple = o => !Array.isArray(o) && !(o instanceof Map) && !(o instanceof Set) && !ArrayBuffer.isView(o);
    // objet immuable → son chemin (« c/…/clé » depuis le circuit, « k/… » depuis la carte) ; les clés triées : le même ordre chez tous
    function externes(e) {
      const m = new Map();
      const marcher = (o, chemin) => {
        if (o === null || typeof o !== 'object' || m.has(o)) return;
        m.set(o, chemin);
        if (o instanceof Map || o instanceof Set || ArrayBuffer.isView(o)) return;
        for (const k of Object.keys(o).sort()) if (k.indexOf('/') < 0) marcher(o[k], chemin + '/' + k);
      };
      marcher(e.circuit, 'c'); marcher(e.carte, 'k');
      return m;
    }
    function resoudre(e, chemin) {
      const seg = String(chemin).split('/');
      let o = seg[0] === 'c' ? e.circuit : seg[0] === 'k' ? e.carte : undefined;
      for (let i = 1; i < seg.length && o !== undefined && o !== null; i++) o = o[seg[i]];
      if (o === undefined || o === null || typeof o !== 'object') throw new Error('instantané : renvoi introuvable ' + chemin);
      return o;
    }
    // l'ordre où l'on parcourt les clés d'un objet (le même à l'encodage et au décodage) : les clés triées, les Map et les Set EN DERNIER : les objets qu'ils
    // renvoient sont alors déjà vus (renvoi « $r ») et gardent leur identité chez le client au lieu d'être refaits
    const contenant = x => x instanceof Map || x instanceof Set;
    const contenantArbre = d => d !== null && typeof d === 'object' && (d.$m !== undefined || d.$s !== undefined);
    const cles = (o, est) => Object.keys(o).sort().sort((a, b) => (est(o[a]) ? 1 : 0) - (est(o[b]) ? 1 : 0));   // (le tri est stable)
    // l'arbre de l'état de la course e (ext : externes(e))
    function encoder(e, ext) {
      const ids = new Map();
      function enc(x) {
        const t = typeof x;
        if (t === 'number') return nombre(x);
        if (t === 'string' || t === 'boolean' || x === null) return x;
        if (t !== 'object') return { $u: 1 };
        const c = ext.get(x); if (c !== undefined) return { $x: c };
        const r = ids.get(x); if (r !== undefined) return { $r: r };
        ids.set(x, ids.size);
        if (Array.isArray(x)) { const a = new Array(x.length); for (let i = 0; i < x.length; i++) a[i] = enc(x[i]); return a; }
        if (x instanceof Map) { const m = []; for (const [k, v] of x) { const ek = enc(k); m.push([ek, enc(v)]); } return { $m: m }; }
        if (x instanceof Set) { const m = []; for (const k of x) m.push(enc(k)); return { $s: m }; }
        if (ArrayBuffer.isView(x)) return { $f: Array.from(x, nombre), t: x.constructor.name };
        const o = {};
        for (const k of cles(x, contenant)) {
          const y = x[k];
          if (y === undefined || typeof y === 'function' || typeof y === 'symbol') continue;
          if (k.charCodeAt(0) === 36) throw new Error('instantané : clé en $ (' + k + ')');
          o[k] = enc(y);
        }
        return o;
      }
      return enc(e);
    }
    // réécrit e (sur place) d'après l'arbre ; renvoie e. Lève une erreur si l'arbre n'est pas le bon : e est alors à moitié écrit (l'appelant abandonne)
    function appliquer(e, arbre, ext) {
      const tab = [];
      function dec(ex, d) {
        if (d === null || typeof d !== 'object') return d;
        if (Array.isArray(d)) {
          const a = Array.isArray(ex) ? ex : []; tab.push(a);
          a.length = d.length;
          for (let i = 0; i < d.length; i++) a[i] = dec(a[i], d[i]);
          return a;
        }
        if (d.$r !== undefined) { const o = tab[d.$r]; if (o === undefined) throw new Error('instantané : renvoi inconnu'); return o; }
        if (d.$x !== undefined) return resoudre(e, d.$x);
        if (d.$u !== undefined) return undefined;
        if (d.$n !== undefined) return lireNombre(d.$n);
        if (d.$m !== undefined) {
          const m = ex instanceof Map ? ex : new Map(), avant = new Map(m); tab.push(m); m.clear();
          for (const [k, v] of d.$m) { const kk = dec(undefined, k); m.set(kk, dec(avant.get(kk), v)); }
          return m;
        }
        if (d.$s !== undefined) { const m = ex instanceof Set ? ex : new Set(); tab.push(m); m.clear(); for (const k of d.$s) m.add(dec(undefined, k)); return m; }
        if (d.$f !== undefined) {
          const T = TYPES[d.t]; if (!T) throw new Error('instantané : type ' + d.t);
          const a = ex instanceof T && ex.length === d.$f.length ? ex : new T(d.$f.length); tab.push(a);
          for (let i = 0; i < d.$f.length; i++) { const x = d.$f[i]; a[i] = typeof x === 'number' ? x : lireNombre(x && x.$n); }
          return a;
        }
        const o = ex !== null && typeof ex === 'object' && simple(ex) ? ex : {}; tab.push(o);
        for (const k of cles(d, contenantArbre)) o[k] = dec(o[k], d[k]);
        for (const k of Object.keys(o)) if (!Object.prototype.hasOwnProperty.call(d, k)) delete o[k];
        return o;
      }
      dec(e, arbre);
      return e;
    }
    return { externes, encoder, appliquer };
  })();

  // --- la partie
  function creerPartie(o) {
    const ordre = o.ordre.slice();
    const mathsOn = !!R.EN_LIGNE_MATHS && o.maths !== false;
    if (mathsOn) maths.activer();
    try {
    const reglages = reglagesValides(o.reglages, ordre.length);
    const delai = Math.max(1, Math.floor(o.delai || reglages.delai || R.EN_LIGNE_DELAI));
    const taillePaquet = Math.max(1, Math.min(delai, Math.floor(o.paquet || R.EN_LIGNE_PAQUET)));   // jamais plus que le délai : sinon un paquet attendrait un pas qui n'arrive pas
    const periode = Math.max(1, Math.floor(o.controle || R.EN_LIGNE_CONTROLE));
    const pasMax = o.pasMax > 0 ? o.pasMax : Infinity;   // (les tests) on s'arrête à ce pas
    const { e, humains } = creerCourseEnLigne(reglages, o.graine, ordre.length, o);
    const pilotes = new Map(ordre.map((id, i) => [id, humains[i]]));
    const moi = o.moi;
    if (!pilotes.has(moi)) throw new Error('enligne : moi (' + moi + ') n\'est pas dans l\'ordre');
    const envoyer = typeof o.envoyer === 'function' ? o.envoyer : () => {};

    let n = 0;
    const codes = new Map(ordre.map(id => [id, new Map()]));   // id → (pas → entier) : les commandes connues (celles d'avant le délai sont neutres, sans être gardées)
    const sortis = new Map();                                  // id → son dernier pas avec une commande (après : neutre)
    const miens = new Map(), siens = new Map();               // pas → empreinte à nous ; pas → (id → empreinte)
    let paquet = { n: delai, c: [] };                          // les commandes à nous pas encore envoyées
    let desynchro = null;
    let finPas = null;
    let attente = null;
    let pasAttendus = 0;                                       // de suite, sans pouvoir avancer (pour le délai adaptatif, le « le joueur ne répond plus »)
    // (tour 61) la reprise après une désynchro : l'hôte (o.hote) fait foi ; un invité qui ne voit plus la course de l'hôte lui demande un instantané de l'état
    // et repart de lui ; il ne joue plus pendant qu'il l'attend (ses commandes déjà prises restent valables : les autres n'attendent que celles qui manquent)
    const hote = o.hote;
    const reprisePermise = (o.reprise !== undefined ? !!o.reprise : !!R.EN_LIGNE_REPRISE) && hote !== undefined && codes.has(hote);
    let incoherent = null;     // la désynchro avec l'hôte en cours de réparation : { n, de, miens, siens }
    let attenteEtat = false;   // j'ai demandé l'instantané : je ne joue plus en l'attendant
    let reprises = 0;          // instantanés appliqués
    let restaurations = 0;
    let envoisEtat = 0;        // (l'hôte) instantanés envoyés
    let assemblage = null;     // (un invité) l'instantané qui arrive par pièces : { n, h, k, pieces, vues }
    let prochain = delai;      // le prochain pas dont ma commande doit être prise (n + délai quand tout va bien ; plus loin après un retour en arrière)
    let controleEnvoye = -1;   // le dernier pas dont l'empreinte est partie (jamais deux fois, jamais en arrière : le relais l'exige)
    let ext = null;            // les objets immuables de la course (circuit, carte) : leurs chemins, pour l'instantané

    const partie = {
      e, pilotes, moi: pilotes.get(moi), idMoi: moi, ordre, delai, reglages, graine: o.graine,
      local: Object.assign({}, NEUTRE),
      get n() { return n; },
      get attente() { return attente; },
      get desynchro() { return desynchro; },
      get fin() { return finPas; },
      get pasAttendus() { return pasAttendus; },
      get reprise() { return attenteEtat && incoherent ? { n: incoherent.n, de: incoherent.de } : null; },   // je répare : { n, de } ; sinon null
      get reprises() { return reprises; },
      get restaurations() { return restaurations; },   // le nombre d'instantanés appliqués (l'affichage repart de zéro quand il change)
      sortis,
    };

    // la commande entière (entier) du joueur id au pas k ; undefined : pas encore arrivée
    function codeDe(id, k) {
      if (k < delai) return CODE_NEUTRE;
      const c = codes.get(id).get(k);
      if (c !== undefined) return c;
      if (sortis.has(id) && k > sortis.get(id)) return CODE_NEUTRE;   // parti : neutre après sa dernière commande
      return undefined;
    }

    function vider() {
      if (!paquet.c.length) return;
      envoyer({ t: 'cmd', n: paquet.n, c: paquet.c });
      paquet = { n: paquet.n + paquet.c.length, c: [] };
    }

    function comparer(pas) {
      if (desynchro || incoherent || !miens.has(pas) || !siens.has(pas)) return;
      for (const [de, h] of siens.get(pas)) {
        if (h === miens.get(pas)) continue;
        const d = { n: pas, de, miens: miens.get(pas), siens: h };
        if (!reprisePermise) { desynchro = d; return; }
        if (de !== hote || moi === hote) continue;   // l'hôte fait foi : un invité qui diffère d'un autre invité lui laisse le soin de demander ; l'hôte ne se répare pas
        if (reprises >= R.EN_LIGNE_REPRISE_MAX) { desynchro = d; return; }
        incoherent = d; attenteEtat = true;
        envoyer({ t: 'reprise', n: pas });
        return;
      }
    }

    // mes commandes jusqu'au pas k compris : celles qui ne sont pas encore prises le sont maintenant (une seule en temps normal), et partent par paquets
    function prendreMesCommandes(k) {
      while (prochain <= k) {
        const code = coder(partie.local);
        codes.get(moi).set(prochain, code);
        paquet.c.push(code);
        prochain++;
        if (paquet.c.length >= taillePaquet) vider();
      }
    }

    // un pas, si les commandes de tous sont là ; sinon false (et attente dit qui)
    function unPas() {
      if (desynchro || attenteEtat || n >= pasMax || finPas !== null) return false;
      const manque = [];
      for (const id of ordre) if (codeDe(id, n) === undefined) manque.push(id);
      if (manque.length) { attente = manque; pasAttendus++; return false; }
      attente = null; pasAttendus = 0;
      // un joueur parti ABANDONNE au premier pas qui suit sa dernière commande : retiré de la piste (plus de collision, plus vu des IA, du radar ni
      // dessiné), classé après tout le monde (non classé). Le pas est le même chez tous : on ne peut pas passer le pas dernier + 1 sans savoir
      // qu'il est parti (codeDe attend sa commande ou « parti »), et le serveur envoie « parti » après sa dernière commande. Arrivé avant : il reste arrivé.
      for (const [id, dernier] of sortis) { const q = pilotes.get(id); if (n > dernier && q.arrivee === null && !q.abandon) { q.abandon = true; q.abandonPas = n; q.abandonTemps = e.temps; } }
      const cmds = new Map();
      for (const id of ordre) cmds.set(pilotes.get(id), decoder(codeDe(id, n)));
      pasCourseIA(e, PAS, (p, dt) => conduire(e, p, cmds.get(p), dt));
      // ma commande, prise maintenant, agira au pas n + délai (après une reprise qui m'a fait avancer, toutes celles qui manquent jusque-là)
      prendreMesCommandes(n + delai);
      n++;
      // (relecture T11, 2e passe) la fin de la course est décidée à un pas précis : si chaque page décidait « podium » à son image, l'une s'arrêterait
      // quelques pas avant l'autre (jusqu'à 12 pas par image, autant que le délai) et la plus lente attendrait pour toujours les commandes de l'autre.
      // Un joueur parti ne compte comme tel qu'une fois son pas dernier + 1 joué (il faut alors savoir qu'il est parti : la même chose chez tous)
      if (finPas === null) {
        const encore = ordre.filter(id => !(sortis.has(id) && n > sortis.get(id) + 1)).map(id => pilotes.get(id));
        if (e.pilotes.every(q => q.arrivee !== null || q.abandon) || !encore.length) finPas = n;
        else if (encore.every(q => q.arrivee !== null) && e.temps - Math.max(...encore.map(q => q.arrivee)) >= R.ARRIVEE_ATTENTE_MAX) finPas = n;
      }
      // le ménage : les commandes d'il y a longtemps ne servent plus
      for (const m of codes.values()) m.delete(n - 2);
      if (n % periode === 0) {
        const h = empreinte(e);
        miens.set(n, h);
        if (n > controleEnvoye) { controleEnvoye = n; envoyer({ t: 'controle', n, h: String(h) }); }   // (décision D5 : h est une chaîne ; le relais refuse un nombre, et coupe qui en envoie trop) ; (tour 61) jamais deux fois le même pas : après un retour en arrière, on rejoue sans renvoyer
        comparer(n);
        for (const k of [...miens.keys()]) if (k <= n - 10 * periode) { miens.delete(k); siens.delete(k); }
      }
      return true;
    }

    partie.avancer = function (max) {
      let fait = 0;
      const m = max === undefined ? 1 : max;
      while (fait < m && unPas()) fait++;
      if (fait < m) vider();   // on attend : ce qui est prêt part tout de suite (jamais un paquet qui reste bloqué)
      return fait;
    };

    partie.recevoir = function (msg) {
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'cmd') {
        if (msg.de === moi || !codes.has(msg.de) || !Number.isInteger(msg.n) || msg.n < 0) return;
        const liste = Array.isArray(msg.c) ? msg.c : [msg.c];
        if (liste.length > LISTE_MAX) return;
        const mes = codes.get(msg.de);
        // (relecture T11) jamais de commande trop en avance : un joueur ne peut pas avoir fait plus de `delai` pas de plus que nous (il lui faut nos
        // commandes), donc rien ne dépasse n + 2 délais ; au-delà, un client abîmé ou tricheur remplirait notre mémoire de pas lointains
        const horizon = n + 2 * delai + 8;
        liste.forEach((x, i) => { const k = msg.n + i; if (k >= delai && k >= n - 1 && k <= horizon && !mes.has(k)) mes.set(k, codeValide(x) ? x : CODE_NEUTRE); });
      } else if (msg.t === 'controle') {
        if (msg.de === moi || !codes.has(msg.de) || !Number.isInteger(msg.n)) return;
        // l'empreinte arrive en chaîne décimale (D5) ; un entier de 32 bits est aussi accepté (le faux réseau des tests)
        const h = typeof msg.h === 'string' ? (/^[0-9]{1,10}$/.test(msg.h) ? Number(msg.h) : -1) : msg.h;
        if (!Number.isInteger(h) || h < 0 || h > 4294967295) return;
        if (msg.n % periode !== 0 || msg.n > n + 2 * delai + 8 || msg.n < n - 10 * periode) return;   // (relecture T11) un contrôle trop loin ne sert à rien et remplirait la mémoire
        if (!siens.has(msg.n)) siens.set(msg.n, new Map());
        siens.get(msg.n).set(msg.de, h);
        comparer(msg.n);
      } else if (msg.t === 'parti') {
        partie.quitter(msg.id);
      } else if (msg.t === 'reprise') {
        // (tour 61, l'hôte) un invité ne voit plus ma course : je lui envoie l'état de la mienne, là où elle en est
        if (reprisePermise && moi === hote && msg.de !== moi && codes.has(msg.de) && Number.isInteger(msg.n) && msg.n >= 0) partie.envoyerEtat();
      } else if (msg.t === 'etat') {
        // (tour 61, un invité qui a demandé la reprise) une pièce de l'instantané de l'hôte, et seulement de lui
        if (reprisePermise && attenteEtat && moi !== hote && msg.de === hote) recevoirPiece(msg);
      }
    };

    // --- la reprise (tour 61)
    // l'hôte : l'état de la course maintenant, découpé en pièces (EN_LIGNE_ETAT_PIECE caractères : un message ne dépasse jamais EN_LIGNE_TAILLE_MAX, même si chaque
    // caractère était échappé), avec les commandes que je connais pour les pas à venir (celles des autres arrivent de leur côté ; ce sont des faits, pas des états).
    // → le nombre de pièces envoyées (0 : rien envoyé : course finie, trop gros, trop de reprises déjà)
    partie.etatTexte = function () {
      if (!ext) ext = instantane.externes(e);
      const c = {};
      for (const id of ordre) c[String(id)] = [...codes.get(id)].filter(([k]) => k >= n).sort((a, b) => a[0] - b[0]);
      return JSON.stringify({ n, c, e: instantane.encoder(e, ext) });
    };
    partie.envoyerEtat = function () {
      if (finPas !== null || desynchro || envoisEtat >= 3 * R.EN_LIGNE_REPRISE_MAX * Math.max(1, ordre.length - 1)) return 0;
      let texte;
      try { texte = partie.etatTexte(); } catch (err) { return 0; }
      const P = Math.max(100, Math.floor(R.EN_LIGNE_ETAT_PIECE)), k = Math.ceil(texte.length / P);
      if (texte.length > R.EN_LIGNE_ETAT_MAX || k > R.EN_LIGNE_ETAT_PIECES_MAX) return 0;
      const h = melangerTexte(2166136261, texte) >>> 0;
      envoisEtat++;
      for (let i = 0; i < k; i++) envoyer({ t: 'etat', n, i, k, h, d: texte.slice(i * P, (i + 1) * P) });
      vider();
      return k;
    };
    // l'invité : les pièces arrivent dans le désordre permis ; l'instantané n'est appliqué que complet et d'empreinte juste
    function recevoirPiece(m) {
      const P = Math.max(100, Math.floor(R.EN_LIGNE_ETAT_PIECE));
      if (!Number.isInteger(m.n) || m.n < 0 || !Number.isInteger(m.k) || m.k < 1 || m.k > R.EN_LIGNE_ETAT_PIECES_MAX || !Number.isInteger(m.i) || m.i < 0 || m.i >= m.k
        || !Number.isInteger(m.h) || m.h < 0 || m.h > 4294967295 || typeof m.d !== 'string' || m.d.length > P) return;
      if (!assemblage || assemblage.n !== m.n || assemblage.h !== m.h || assemblage.k !== m.k) assemblage = { n: m.n, h: m.h, k: m.k, pieces: new Array(m.k), vues: 0 };
      if (assemblage.pieces[m.i] !== undefined) return;
      assemblage.pieces[m.i] = m.d; assemblage.vues++;
      if (assemblage.vues < assemblage.k) return;
      const texte = assemblage.pieces.join(''), h = assemblage.h;
      assemblage = null;
      if (texte.length > R.EN_LIGNE_ETAT_MAX || (melangerTexte(2166136261, texte) >>> 0) !== h) return;   // abîmé : on attend un autre (ou l'abandon de la page)
      appliquerEtat(texte);
    }
    function appliquerEtat(texte) {
      let obj;
      try { obj = JSON.parse(texte); } catch (err) { return; }
      if (!obj || typeof obj !== 'object' || !Number.isInteger(obj.n) || obj.n < 0 || obj.n > 1e9 || !obj.e || typeof obj.e !== 'object') return;
      try {
        if (!ext) ext = instantane.externes(e);
        instantane.appliquer(e, obj.e, ext);
      } catch (err) {
        desynchro = incoherent || { n: obj.n, de: hote, miens: 0, siens: 0 };   // l'état est à moitié écrit : la reprise a échoué pour de bon
        attenteEtat = false; incoherent = null;
        return;
      }
      n = obj.n;
      // les commandes : celles de l'hôte pour les pas à venir (des faits : on garde les nôtres si on les a déjà), le ménage des anciennes
      for (const id of ordre) {
        const m = codes.get(id), liste = obj.c && obj.c[String(id)];
        if (Array.isArray(liste)) for (const kx of liste) if (Array.isArray(kx) && Number.isInteger(kx[0]) && kx[0] >= n && kx[0] >= delai && kx[0] <= n + 2 * delai + 8 && codeValide(kx[1]) && !m.has(kx[0])) m.set(kx[0], kx[1]);
        for (const k of [...m.keys()]) if (k < n - 1) m.delete(k);
      }
      prendreMesCommandes(n + delai - 1);   // si j'étais en retard sur l'hôte : mes commandes jusqu'au pas où je repars (les autres les attendent)
      miens.clear();
      for (const k of [...siens.keys()]) if (k <= n) siens.delete(k);
      attente = null; pasAttendus = 0; finPas = null;
      incoherent = null; attenteEtat = false;
      reprises++; restaurations++;
      vider();
    }
    // la page n'a pas reçu l'instantané à temps : la désynchro arrête la partie, comme sans reprise
    partie.abandonnerReprise = function () {
      if (!attenteEtat) return false;
      desynchro = incoherent; incoherent = null; attenteEtat = false;
      return true;
    };

    // le joueur id est parti : ses commandes arrivées sont les dernières, ensuite elles sont neutres (la même chose pour tous : le serveur
    // transmet ses commandes dans l'ordre, puis « parti »)
    partie.quitter = function (id) {
      if (!codes.has(id) || id === moi || sortis.has(id)) return;
      let dernier = delai - 1;
      for (const k of codes.get(id).keys()) if (k > dernier) dernier = k;
      sortis.set(id, dernier);
    };

    // tous les humains encore là sont arrivés (ou toutes les voitures)
    partie.finie = function () {
      const encore = ordre.filter(id => !sortis.has(id)).map(id => pilotes.get(id));
      return encore.length ? encore.every(p => p.arrivee !== null) : e.pilotes.every(p => p.arrivee !== null || p.abandon);
    };
    // (tour 61) la prédiction d'AFFICHAGE : où serait ma voiture dans `pas` pas (au plus le délai, EN_LIGNE_PREDICTION par défaut) avec les commandes que
    // j'ai déjà prises (elles agiront dans les pas qui viennent) : la voiture du joueur local est dessinée là, la direction répond tout de suite à l'œil.
    // Jouée sur une COPIE de ma voiture (physique d'une voiture seule : ni choc ni pneus), jamais dans la course : aucune empreinte ne change.
    // → { x, z, cap }, ou null (feux, arrivée, abandon, désynchro : on dessine la simulation)
    partie.prediction = function (pas) {
      const p = partie.moi, k = Math.max(0, Math.min(delai, Math.floor(pas === undefined ? R.EN_LIGNE_PREDICTION : pas)));
      if (!k || !p || p.arrivee !== null || p.abandon || desynchro || finPas !== null || !courseAutorise(p.course)) return null;
      const v = copier(p.v), mes = codes.get(moi);
      for (let i = 0; i < k; i++) {
        const x = mes.get(n + i);
        lisserCommandes(v, decoder(x === undefined ? coder(partie.local) : x), PAS);
        pasVoiture(v, e.circuit, PAS);
      }
      return { x: v.x, z: v.z, cap: v.cap };
    };
    partie.empreinte = () => empreinte(e);
    partie.vider = vider;
    // la course est finie (ou quittée) : les fonctions Math du navigateur reviennent ; à appeler une fois
    let termine = false;
    partie.terminer = function () { if (!termine) { termine = true; if (mathsOn) maths.desactiver(); } };
    return partie;
    } catch (err) {
      if (mathsOn) maths.desactiver();
      throw err;
    }
  }

  // la partie depuis le message « depart » du serveur : { reglages, graine, ordre : [ids] }
  function demarrer(depart, moi, envoyer, options) {
    const o = options || {};
    return creerPartie({ reglages: depart.reglages, graine: depart.graine, ordre: depart.ordre, moi, envoyer, carte: o.carte, circuit: o.circuit, delai: o.delai, paquet: o.paquet, controle: o.controle, pasMax: o.pasMax, hote: o.hote, reprise: o.reprise });
  }

  // --- un faux réseau en mémoire : le serveur relais d'un seul cran, pour les tests. Chaque message d'un joueur arrive chez les autres après
  // latence(de, vers, tick) ticks (au moins 0 ; l'ordre d'un lien à l'autre est gardé). À chaque tick : les messages arrivent, puis chaque partie
  // fait un pas si elle peut. options : { reglages, graine, carte, circuit, delai, paquet, controle, latence, local(id, pas) → commande }
  function banc(ids, options) {
    const o = options || {};
    const depart = { reglages: o.reglages, graine: o.graine, ordre: ids.slice() };
    const parties = new Map(), file = [], dernierArrivee = new Map();
    let tick = 0, seq = 0;
    function poster(de, vers, msg) {
      const lat = o.latence ? Math.max(0, Math.round(o.latence(de, vers, tick))) : 0;
      const lien = de + '>' + vers;
      const arrivee = Math.max(tick + lat, dernierArrivee.get(lien) || 0);
      dernierArrivee.set(lien, arrivee);
      file.push({ t: arrivee, seq: seq++, vers, msg });
    }
    for (const id of ids) {
      const partie = demarrer(depart, id, msg => {
        for (const autre of ids) if (autre !== id && parties.has(autre)) poster(id, autre, Object.assign({}, msg, { de: id }));
      }, { carte: o.carte, circuit: o.circuit, delai: o.delai, paquet: o.paquet, controle: o.controle, pasMax: o.pasMax, hote: o.hote !== undefined ? o.hote : ids[0], reprise: o.reprise });
      parties.set(id, partie);
    }
    const partis = new Set();
    const banc = {
      parties, depart,
      get tick() { return tick; },
      // un tick : les messages arrivés, puis un pas (au plus) par partie
      avancer(pasParTick) {
        tick++;
        file.sort((a, b) => a.t - b.t || a.seq - b.seq);
        while (file.length && file[0].t <= tick) {
          const m = file.shift();
          if (!partis.has(m.vers)) parties.get(m.vers).recevoir(m.msg);
        }
        for (const [id, p] of parties) {
          if (partis.has(id)) continue;
          if (o.local) p.local = o.local(id, p.n);
          p.avancer(pasParTick || 1);
        }
      },
      // jusqu'à ce que toutes les parties encore là aient fait n pas (échoue au bout de maxTicks)
      jusqua(n, maxTicks) {
        const max = maxTicks || n * 20 + 1000;
        for (let k = 0; k < max; k++) {
          if ([...parties].every(([id, p]) => partis.has(id) || p.n >= n || p.desynchro)) return tick;
          banc.avancer();
        }
        throw new Error('enligne : le banc n\'a pas atteint le pas ' + n + ' en ' + max + ' ticks (pas : ' + [...parties].map(([id, p]) => id + '=' + p.n).join(' ') + ')');
      },
      // le joueur id part : ses messages déjà postés arrivent avant « parti » (le même lien)
      partir(id) {
        partis.add(id);
        for (const autre of ids) if (autre !== id && !partis.has(autre)) poster(id, autre, { t: 'parti', id });
      },
      // la course est finie : les Math du navigateur reviennent
      fin() { for (const p of parties.values()) p.terminer(); },
      partis,
    };
    return banc;
  }

  return { actif, adresseAutorisee, version, delaiPour, instantane, creerLisseur, reglagesValides, coder, decoder, codeValide, empreinte, demarrer, creerPartie, creerCourseEnLigne, conduire, planMeteo, circuitDe, preparerCircuit, maths, banc, CODE_NEUTRE, NEUTRE };
})();
