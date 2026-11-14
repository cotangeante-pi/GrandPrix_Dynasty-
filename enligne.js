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
      h = melanger(h, p.arrivee === null ? 0 : 1);
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
  let versionCache = null;
  function version() {
    if (!versionCache) {
      const sansEnLigne = {};
      for (const k of Object.keys(R).sort()) if (!k.startsWith('EN_LIGNE')) sansEnLigne[k] = R[k];
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

    const partie = {
      e, pilotes, moi: pilotes.get(moi), idMoi: moi, ordre, delai, reglages, graine: o.graine,
      local: Object.assign({}, NEUTRE),
      get n() { return n; },
      get attente() { return attente; },
      get desynchro() { return desynchro; },
      get fin() { return finPas; },
      get pasAttendus() { return pasAttendus; },
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
      if (desynchro || !miens.has(pas) || !siens.has(pas)) return;
      for (const [de, h] of siens.get(pas)) {
        if (h !== miens.get(pas)) { desynchro = { n: pas, de, miens: miens.get(pas), siens: h }; return; }
      }
    }

    // un pas, si les commandes de tous sont là ; sinon false (et attente dit qui)
    function unPas() {
      if (desynchro || n >= pasMax || finPas !== null) return false;
      const manque = [];
      for (const id of ordre) if (codeDe(id, n) === undefined) manque.push(id);
      if (manque.length) { attente = manque; pasAttendus++; return false; }
      attente = null; pasAttendus = 0;
      const cmds = new Map();
      for (const id of ordre) cmds.set(pilotes.get(id), decoder(codeDe(id, n)));
      pasCourseIA(e, PAS, (p, dt) => conduire(e, p, cmds.get(p), dt));
      // ma commande, prise maintenant, agira au pas n + délai
      const code = coder(partie.local);
      codes.get(moi).set(n + delai, code);
      paquet.c.push(code);
      if (paquet.c.length >= taillePaquet) vider();
      n++;
      // (relecture T11, 2e passe) la fin de la course est décidée à un pas précis : si chaque page décidait « podium » à son image, l'une s'arrêterait
      // quelques pas avant l'autre (jusqu'à 12 pas par image, autant que le délai) et la plus lente attendrait pour toujours les commandes de l'autre.
      // Un joueur parti ne compte comme tel qu'une fois son pas dernier + 1 joué (il faut alors savoir qu'il est parti : la même chose chez tous)
      if (finPas === null) {
        const encore = ordre.filter(id => !(sortis.has(id) && n > sortis.get(id) + 1)).map(id => pilotes.get(id));
        if (e.pilotes.every(q => q.arrivee !== null) || !encore.length) finPas = n;
        else if (encore.every(q => q.arrivee !== null) && e.temps - Math.max(...encore.map(q => q.arrivee)) >= R.ARRIVEE_ATTENTE_MAX) finPas = n;
      }
      // le ménage : les commandes d'il y a longtemps ne servent plus
      for (const m of codes.values()) m.delete(n - 2);
      if (n % periode === 0) {
        const h = empreinte(e);
        miens.set(n, h);
        envoyer({ t: 'controle', n, h });
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
        if (msg.de === moi || !codes.has(msg.de) || !Number.isInteger(msg.n) || !Number.isInteger(msg.h) || msg.h < 0 || msg.h > 4294967295) return;
        if (msg.n % periode !== 0 || msg.n > n + 2 * delai + 8 || msg.n < n - 10 * periode) return;   // (relecture T11) un contrôle trop loin ne sert à rien et remplirait la mémoire
        if (!siens.has(msg.n)) siens.set(msg.n, new Map());
        siens.get(msg.n).set(msg.de, msg.h);
        comparer(msg.n);
      } else if (msg.t === 'parti') {
        partie.quitter(msg.id);
      }
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
      return encore.length ? encore.every(p => p.arrivee !== null) : e.pilotes.every(p => p.arrivee !== null);
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
    return creerPartie({ reglages: depart.reglages, graine: depart.graine, ordre: depart.ordre, moi, envoyer, carte: o.carte, circuit: o.circuit, delai: o.delai, paquet: o.paquet, controle: o.controle, pasMax: o.pasMax });
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
      }, { carte: o.carte, circuit: o.circuit, delai: o.delai, paquet: o.paquet, controle: o.controle, pasMax: o.pasMax });
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

  return { actif, version, reglagesValides, coder, decoder, codeValide, empreinte, demarrer, creerPartie, creerCourseEnLigne, conduire, planMeteo, circuitDe, preparerCircuit, maths, banc, CODE_NEUTRE, NEUTRE };
})();
