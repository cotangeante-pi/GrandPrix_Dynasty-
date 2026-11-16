// La course en ligne dans la page (tour 56, T7) : relie le client réseau (reseau.js), le cœur du lockstep (enligne.js) et la page de course
// (principal.js). Tout est derrière REGLAGES.EN_LIGNE (donnees.js) : la page ne le touche que si l'adresse a ?enlignecourse=hote ou
// ?enlignecourse=<CODE> (les essais et le développement ; les écrans de salle de T5 appelleront ENLIGNE_PAGE.lancer(client, depart)).
//
// Le déroulement : la page s'ouvre sur le circuit de l'adresse (le circuit ne change pas sans recharger la page : CLAUDE.md « Les batailles
// en ligne ») ; l'hôte crée la salle, les autres la rejoignent par son code ; quand il y a assez de joueurs (?joueurs=N, 2 par défaut) l'hôte
// lance ; au message « depart », chaque page construit la même course (EN_LIGNE.demarrer), puis à chaque pas de physique : ses commandes
// partent, celles des autres arrivent, la course n'avance que si tout le monde est là. La caméra, le tableau, le podium et les résultats sont
// ceux d'une course contre les IA : la page voit une course à plusieurs dont le joueur est le sien.
//
// Les écrans de salle (enligne-ecran.js, T5) tournent dans cette même page propre : ?enlignecourse=menu (le menu « En ligne », depuis le titre ou le paddock),
// et ?enlignecourse=reprise (la page rechargée sur le circuit que l'hôte a choisi : elle se rattache à la même salle avec le jeton gardé dans
// sessionStorage, RESEAU.session). Le circuit d'une page est fixé au chargement : quand l'hôte choisit un autre circuit en salle, chaque page qui n'a pas
// le bon se recharge ; le relais garde la place (EN_LIGNE_GRACE s) et ne lance que quand tous ont annoncé le bon circuit (message « charge »).
// En BroadcastChannel, la page de l'hôte est le relais : elle ne se recharge pas (l'hôte n'y propose que le circuit de sa page).
//
// Les paramètres de l'adresse : enlignecourse=menu|reprise|hote|CODE, canal=<nom du BroadcastChannel>, joueurs=N (l'hôte attend N joueurs), tours=N, ia=N,
// nom=<l'id d'une couleur : bleu, rouge…>, robot=1 (le robot d'essai conduit), transport=diffusion|websocket|memoire.
const ENLIGNE_PAGE = (function () {
  const R = REGLAGES;
  const etat = { actif: false, client: null, role: null, partie: null, depart: null, tampon: [], joueurs: [], code: null, erreur: null, statut: '', attendus: 2, lance: false, termine: false, noms: new Map(), attenteDepuis: null, fond: null, fondT: 0, sortie: null };

  function zone() { return document.getElementById('enligneInfo'); }
  function dire(msg) {
    etat.statut = msg || '';
    const z = zone();
    if (!z) return;
    z.textContent = etat.statut;
    z.classList.toggle('cache', !etat.statut);
  }

  // JEU.enligne est posé tôt dans demarrerJeu : la page sait qu'elle ne fait pas une course seule (pas de voiture, de carte ni d'écran de choix de plus)
  function preparer(param, parametres) {
    etat.actif = true; etat.role = param === 'hote' ? 'hote' : param === 'menu' || param === 'reprise' ? param : 'invite'; etat.code = etat.role === 'invite' ? String(param).toUpperCase() : null;
    etat.ecrans = etat.role === 'menu' || etat.role === 'reprise';   // les écrans de salle (T5) conduisent ; sinon, l'entrée directe des essais
    etat.attendus = Math.max(2, Math.min(R.EN_LIGNE_JOUEURS_MAX, Math.floor(Number(parametres.get('joueurs'))) || 2));
    etat.tours = Math.max(1, Math.floor(Number(parametres.get('tours'))) || 1);
    etat.nbIA = Math.max(0, Math.floor(Number(parametres.get('ia'))) || 0);
    etat.nom = parametres.get('nom') || (etat.role === 'hote' ? 'bleu' : 'rouge');   // (D1 : l'id d'une couleur)
    etat.canal = parametres.get('canal') || undefined;
    etat.transport = parametres.get('transport') || (R.EN_LIGNE_URL ? 'websocket' : 'diffusion');
    if (etat.ecrans) {
      // l'hôte voit d'abord le circuit de cette page ; en BroadcastChannel (sa page est le relais, elle ne peut pas se recharger) il n'a que celui-là
      const choix = { circuit: NOM_CIRCUIT };
      if (parametres.has('tours')) choix.tours = etat.tours;
      if (parametres.has('ia')) choix.nbIA = etat.nbIA;
      R.EN_LIGNE_REGLAGES_DEFAUT = Object.assign({}, R.EN_LIGNE_REGLAGES_DEFAUT, choix);
      if (etat.transport === 'diffusion') R.EN_LIGNE_CIRCUITS_CHOIX = [NOM_CIRCUIT];
      if (typeof ENLIGNE_ECRAN !== 'undefined') ENLIGNE_ECRAN.fabrique = fabrique;
    }
    return etat;
  }

  // la page est prête (scène, caméra) : on ouvre la connexion
  function ouvrir() {
    if (etat.role === 'menu') { ENLIGNE_ECRAN.ouvrir(); return null; }
    if (etat.role === 'reprise') {
      const sess = RESEAU.session.lire();
      if (!sess) { location.href = location.pathname; return null; }
      ENLIGNE_ECRAN.reprendre(sess);
      return null;
    }
    dire(texte('enl_connexion'));
    preparerCircuit({ circuit: NOM_CIRCUIT });
    const c = RESEAU.client({ transport: etat.transport, canal: etat.canal, ping: true, circuit: NOM_CIRCUIT });
    brancher(c);
    c.ouvrir().then(() => {
      if (etat.role === 'hote') c.creer(etat.nom); else c.rejoindre(etat.code, etat.nom);
    }, () => dire(texte('enl_erreur_reseau')));
    return c;
  }

  // les écrans de salle (T5) donnent un client déjà dans la salle et le message « depart » : la course part de là
  function lancer(client, depart) {
    etat.actif = true;
    brancher(client);
    recevoirDepart(depart);
  }

  // la connexion est perdue pour de bon (reseau.js : « perdu » ne passe pas par le gestionnaire général) : le message, puis le retour au début
  function surPerdu() { if (!etat.termine && !etat.sortie && (etat.partie || !etat.ecrans)) { dire(texte('enl_perdu')); sortirApres('perdu'); } }

  // (T57) {t:'erreur'} du relais (le « lancer » refusé…) : dans la salle, ou sur le message de la page
  function erreurRelais(raison) {
    if (!raison || raison === 'ecouteur' || etat.termine) return;
    if (etat.ecrans && typeof ENLIGNE_ECRAN !== 'undefined' && ENLIGNE_ECRAN.erreur) { ENLIGNE_ECRAN.erreur(raison); return; }
    const t = texte('enligneErreur_' + String(raison).replace(/-/g, '_'));
    if (t && t.indexOf('enligneErreur_') !== 0) annoncer(t);
  }

  function brancher(c) {
    etat.client = c;
    if (c.sur) c.sur('perdu', surPerdu);
    if (c.sur) c.sur('erreur', d => erreurRelais(d && d.raison));
    window.__enligne = etat;   // (les tests lisent le code de la salle et l'état de la partie)
    c.sur(m => {
      switch (m.t) {
        case 'salle': etat.code = m.code; if (!etat.ecrans) majSalle(); break;
        case 'joueurs': etat.joueurs = m.liste; for (const j of m.liste) etat.noms.set(j.id, j.nom); if (!etat.ecrans) { majSalle(); essayerLancer(); } break;
        case 'refus': if (!etat.ecrans) dire(texte('enl_refus_' + m.raison) || m.raison); break;
        case 'reglages': if (etat.ecrans) { verifierCircuit(m.reglages); preparerCircuit(m.reglages); } break;
        case 'retour': retourALaSalle(); break;
        case 'depart': recevoirDepart(m); break;
        case 'cmd': case 'controle': case 'parti':
          if (etat.partie) etat.partie.recevoir(m); else etat.tampon.push(m);
          if (m.t === 'parti' && etat.depart && !etat.termine) annoncer(texte('enl_parti').replace('{nom}', nomAffiche(etat.noms.get(m.id) || ('#' + m.id))));   // (T8) la voiture roule sur sa dernière commande puis s'arrête (enligne.js)
          break;
        case 'coupure': if (!etat.termine && !etat.ecrans) dire(texte('enl_coupure')); break;
        default:
      }
    });
  }

  // le circuit de la course et sa carte, calculés avec nos Math d'avance (une à deux secondes) : dans la salle, dès que l'hôte a choisi (ou ici, pour l'entrée directe)
  function preparerCircuit(reglages) {
    if (!reglages || reglages.circuit !== NOM_CIRCUIT || etat.partie) return;
    try { EN_LIGNE.preparerCircuit(reglages.circuit); } catch (e) { etat.erreur = 'circuit'; }
  }
  // l'hôte a dit « retour » : la salle se rouvre (les « prêt » repartent à faux) ; la course d'avant est finie
  function retourALaSalle() {
    if (etat.partie) { etat.partie.terminer(); }
    etat.partie = null; etat.depart = null; etat.tampon = []; etat.lance = false; etat.erreur = null;
    if (etat.ecrans && typeof ENLIGNE_ECRAN !== 'undefined' && ENLIGNE_ECRAN.retourSalle) ENLIGNE_ECRAN.retourSalle();
    else if (!etat.ecrans) { dire(''); if (JEU.ecran === 'podium' || JEU.ecran === 'resultats') location.href = location.pathname; }
  }

  // --- le circuit et le rechargement ---
  // l'hôte a choisi un circuit que cette page n'a pas : on garde la session (code, nom, jeton) et on recharge la page sur ce circuit
  function verifierCircuit(reglages) {
    const c = etat.client;
    if (!c || etat.depart || !reglages || typeof reglages.circuit !== 'string' || reglages.circuit === NOM_CIRCUIT || !Object.prototype.hasOwnProperty.call(CIRCUITS, reglages.circuit)) return;
    if (etat.transport === 'diffusion' && c.estHote()) return;   // la page de l'hôte est le relais : elle ne se recharge pas
    rechargerPour(reglages.circuit);
  }
  function rechargerPour(circuit) {
    const c = etat.client;
    if (!c || !c.code || !c.jeton) return false;
    RESEAU.session.ecrire(c, { circuit });
    const p = new URLSearchParams({ enlignecourse: 'reprise', circuit });
    for (const k of ['canal', 'transport', 'lang', 'robot', 'tours', 'ia']) if (PARAMETRES.get(k)) p.set(k, PARAMETRES.get(k));
    location.href = location.pathname + '?' + p.toString();   // (jamais c.fermer() : un « quitter » ferait perdre la place ; la connexion tombe, la grâce la garde)
    return true;
  }

  // le transport que les écrans de salle utilisent (enligne-ecran.js : { envoyer(msg), sur(f), fermer() }) : le client réseau, ouvert à la première
  // demande (les messages envoyés avant l'ouverture attendent) ; un client qui annonce le circuit de la page à chaque arrivée en salle
  function fabrique() {
    const c = RESEAU.client({ transport: etat.transport, canal: etat.canal, ping: true, circuit: NOM_CIRCUIT });
    const file = [], ecouteurs = [];
    let ouvert = false;
    brancher(c);
    c.ouvrir().then(() => { ouvert = true; for (const m of file.splice(0)) c.envoyer(m); }, () => { for (const f of ecouteurs) f({ t: 'coupure' }); });
    return {
      client: c,
      envoyer: m => { if (ouvert) c.envoyer(m); else file.push(m); },
      sur: f => { ecouteurs.push(f); c.sur(f); },
      fermer: () => c.fermer(),
    };
  }

  // ---- les incidents (tour 56, T8)
  // le nom d'un joueur à l'écran : le fil porte l'id d'une couleur (« rouge », « rouge-2 », D1) ; chaque client l'affiche dans sa langue
  function nomAffiche(nom) {
    const m = /^([a-z]+)(?:-(\d+))?$/.exec(String(nom || ''));
    const couleur = m && typeof TEXTES !== 'undefined' && TEXTES[LANGUE] ? TEXTES[LANGUE]['enligneCouleur_' + m[1]] : null;
    return couleur ? texte('enligneNom').replace('{c}', couleur) + (m[2] ? ' ' + m[2] : '') : String(nom);
  }
  // un message court en cours de course (un joueur parti…) : il s'efface seul
  function annoncer(msg) {
    dire(msg);
    clearTimeout(etat.annonceT);
    etat.annonceT = setTimeout(() => { if (etat.statut === msg && !etat.sortie) dire(''); }, 4000);
  }
  // le message d'un incident qui finit la course pour moi, puis le retour (à la salle, ou au début si la connexion est perdue)
  function sortirApres(raison) {
    if (etat.sortie) return;
    etat.sortie = raison;
    const ms = REGLAGES.EN_LIGNE_RETOUR_MS;
    setTimeout(() => { if (raison === 'perdu') { etat.termine = true; location.href = location.pathname; } else retourSalle(); }, ms);
  }
  // onglet caché : requestAnimationFrame est coupé, donc la boucle du jeu ne tourne plus et les autres joueurs nous attendraient ; un minuteur
  // fait avancer la course (mes commandes : neutres, personne ne conduit un onglet caché) au rythme du temps réel.
  // (T57) Chrome ralentit setInterval d'un onglet caché (1 par seconde, puis 1 par minute) mais pas celui d'un Worker dédié : le « tic » vient
  // d'un Worker (écrit en texte, pas de fichier de plus) ; sans Worker (ou refusé par le navigateur), repli sur setInterval.
  function ticFond(ms, f) {
    try {
      if (REGLAGES.EN_LIGNE_FOND_WORKER && typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && window.URL && URL.createObjectURL) {
        const url = URL.createObjectURL(new Blob(['var t=setInterval(function(){postMessage(0)},' + (ms | 0) + ');onmessage=function(){clearInterval(t);close()}'], { type: 'text/javascript' }));
        const w = new Worker(url);
        URL.revokeObjectURL(url);
        let vu = false;
        w.onmessage = () => { vu = true; f(); };
        w.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); if (!vu && etat.fond && etat.fond.w === w) { etat.fond = { i: setInterval(f, ms) }; } try { w.terminate(); } catch (e2) { } };
        return { w };
      }
    } catch (e) { }
    return { i: setInterval(f, ms) };
  }
  function arreterFond() {
    const f = etat.fond;
    etat.fond = null;
    if (!f) return;
    if (f.w) { try { f.w.postMessage(0); f.w.terminate(); } catch (e) { } }
    if (f.i) clearInterval(f.i);
  }
  function passerFond() {
    const t = performance.now(), pas = Math.min(REGLAGES.EN_LIGNE_FOND_PAS_MAX, Math.floor((t - etat.fondT) / 1000 / REGLAGES.PAS_PHYSIQUE));
    if (pas <= 0) return;
    etat.fondT += pas * REGLAGES.PAS_PHYSIQUE * 1000;
    const p = etat.partie;
    for (let i = 0; i < pas && p && JEU.ecran === 'course' && !etat.sortie; i++) {
      p.local = { gaz: 0, frein: 0, direction: 0, remise: false };
      if (!p.avancer(1)) break;   // (on attend un autre : le prochain passage réessaie)
    }
    surveillerAttente();
  }
  function cacher(cache) {
    const ms = REGLAGES.EN_LIGNE_FOND_MS;
    if (!cache) { arreterFond(); return; }
    if (!ms || etat.fond !== null || !etat.partie) return;
    etat.fondT = performance.now();   // (l'horloge de la page, jamais dans la simulation)
    etat.fond = ticFond(ms, passerFond);
  }
  document.addEventListener('visibilitychange', () => cacher(document.hidden));
  // attendre les commandes d'un autre : « On attend … » après un moment, abandon après un long moment (connexion trop lente)
  function surveillerAttente() {
    const p = etat.partie;
    if (!p || etat.sortie) return;
    if (p.attente === null) {
      if (etat.attenteDepuis !== null) { etat.attenteDepuis = null; if (!etat.annonceT || etat.statut === etat.msgAttente) dire(''); }
      return;
    }
    const maintenant = performance.now();
    if (etat.attenteDepuis === null) etat.attenteDepuis = maintenant;
    const duree = maintenant - etat.attenteDepuis;
    if (REGLAGES.EN_LIGNE_ATTENTE_MAX_MS && duree >= REGLAGES.EN_LIGNE_ATTENTE_MAX_MS) { dire(texte('enl_trop_lent')); sortirApres('lent'); return; }
    if (duree >= REGLAGES.EN_LIGNE_ATTENTE_ANNONCE_MS) {
      etat.msgAttente = texte('enl_lent').replace('{noms}', p.attente.map(id => nomAffiche(etat.noms.get(id) || ('#' + id))).join(', '));
      if (etat.statut !== etat.msgAttente) dire(etat.msgAttente);
    }
  }

  // Échap (ou ⏸) pendant la course en ligne : pas de pause (les autres attendraient) ; deux fois de suite en 3 s = quitter la course
  function echap() {
    if (!etat.partie || etat.termine || etat.sortie) return;
    const t = performance.now();
    if (etat.echapT && t - etat.echapT < 3000) { quitter(); return; }
    etat.echapT = t;
    annoncer(texte('enl_quitter'));
  }
  function quitter() {
    etat.termine = true; etat.sortie = 'quitte';
    const c = etat.client;
    try { if (etat.partie && etat.partie.vider) etat.partie.vider(); } catch (err) { /* rien */ }   // (mes dernières commandes partent avant « quitter » : les autres ont le même dernier pas)
    try { if (c && c.quitter) c.quitter(); } catch (err) { /* rien */ }
    location.href = location.pathname;
  }

  function majSalle() {
    if (etat.depart) return;
    const n = etat.joueurs.length;
    dire(texte('enl_salle').replace('{code}', etat.code || '').replace('{n}', n).replace('{max}', etat.attendus));
  }

  // l'hôte lance dès qu'il y a assez de joueurs
  function essayerLancer() {
    const c = etat.client;
    if (etat.role !== 'hote' || etat.lance || !c || !c.estHote() || etat.joueurs.length < etat.attendus) return;
    etat.lance = true;
    c.lancer({ circuit: NOM_CIRCUIT, tours: etat.tours, meteo: 'sec', nbIA: etat.nbIA });
  }

  function recevoirDepart(m) {
    if (etat.depart) return;
    if (m.reglages.circuit !== NOM_CIRCUIT) { dire(texte('enl_circuit')); return; }
    etat.depart = m;
    if (!etat.ecrans) dire(texte('enl_demarrage'));
  }

  // à chaque image : la course démarre dès que le départ est arrivé et que la carte des IA est prête
  function image() {
    if (!etat.actif) return;
    if (etat.depart && !etat.partie) demarrerCourse();
    const p = etat.partie;
    if (p && p.desynchro && !etat.erreur) { etat.erreur = 'desynchro'; p.terminer(); dire(texte('enl_desynchro')); sortirApres('desynchro'); }   // (T8) message clair, puis retour à la salle
    // la course est finie (podium, résultats, salle) : nos Math reviennent (les fonctions de la page ne sont plus remplacées)
    if (p && JEU.ecran !== 'course' && JEU.ecran !== 'pause') p.terminer();
    surveillerAttente();
  }

  // sortir de la course : `retour` (la salle se rouvre pour tous) SEULEMENT une fois la course finie pour tous (partie.fin, au podium) ; avant,
  // c'est `quitter` (sinon l'hôte qui abandonne rouvrirait la salle et bloquerait les autres, relecture T11 n° 19) ; les Math du navigateur sont rendus.
  // Avec les écrans de salle, la salle se rouvre dans la même page ; sans (l'entrée directe des essais), on quitte la page.
  function retourSalle() {
    const c = etat.client, p = etat.partie;
    const finie = !!p && p.fin !== null && p.fin !== undefined && (JEU.ecran === 'podium' || JEU.ecran === 'resultats');
    try { if (p && p.terminer) p.terminer(); } catch (err) { /* rien */ }
    try { if (c) { if (finie) { if (c.estHote() && c.depart) c.retour(); } else if (c.quitter) c.quitter(); } } catch (err) { /* rien */ }
    if (etat.ecrans && typeof ENLIGNE_ECRAN !== 'undefined' && ENLIGNE_ECRAN.retourSalle) {
      etat.partie = null; etat.depart = null; etat.tampon = []; etat.lance = false; etat.termine = false; etat.sortie = null;
      if (c && !c.estHote()) c.depart = null;   // (l'invité n'attend plus la course d'avant ; le « retour » de l'hôte rouvre la salle pour de bon)
      ENLIGNE_ECRAN.retourSalle(c);
      return;
    }
    etat.termine = true;
    location.href = location.pathname;
  }

  const COULEURS_HUMAINS = () => R.DEUX_COULEURS_CHOIX;

  function demarrerCourse() {
    const c = etat.client, d = etat.depart;
    // le cœur construit lui-même le circuit et sa carte avec nos Math (identiques sur tous les navigateurs : relecture T11, point 5) ; la page garde CIRCUIT pour le dessin
    const partie = EN_LIGNE.demarrer(d, c.moi, msg => c.envoyer(msg), {});
    etat.partie = partie;
    const e = partie.e, P = e.pilotes;
    JEU.plateau = e;
    if (!JEU.carte) JEU.carte = e.carte;   // (le « Préparation… » de la page et le reste lisent JEU.carte : celle du cœur)
    JEU.contre = true;
    JEU.ia = P.indexOf(partie.moi);   // la voiture du joueur (comme « contre les IA » : la caméra, le tableau et la minicarte la suivent)
    // les voitures : les IA aux couleurs des IA, les joueurs aux leurs (dans l'ordre de la salle : la même chose chez tous)
    const nbIA = d.reglages.nbIA, humains = COULEURS_HUMAINS();
    JEU.couleurs = P.map((p, k) => k < nbIA ? R.COULEURS_IA[k % R.COULEURS_IA.length] : humains[(k - nbIA) % humains.length]);
    VOITURE3D.preparerCasques(P.map(() => CASQUE.neutre()));
    VOITURE3D.preparerLivrees(P.map((p, k) => k < nbIA ? LIVREE.pourVoiture(JEU.couleurs[k], LIVREE.ecurie(k), p.numero)
      : LIVREE.pourVoiture(JEU.couleurs[k], LIVREE.creer(R.LIVREE_DEUX[(k - nbIA) % R.LIVREE_DEUX.length], R.DEUX_COULEURS_CHOIX[(k - nbIA + 1) % humains.length]), p.numero)));
    for (const m of JEU.modeles) m.groupe.visible = false;   // les voitures d'une course d'avant (retour à la salle, puis une autre course)
    JEU.modeles = [];
    JEU.couleurs.forEach((couleur, k) => JEU.modeles.push(VOITURE3D.creer(couleur, k === JEU.ia, undefined, k, k)));
    for (const m of JEU.modeles) SCENE3D.ajouter(m.groupe);
    if (JEU.modele) JEU.modele.groupe.visible = false;   // la voiture « seul en piste » du chargement
    suivre(JEU.ia);
    SCENE3D.colorerRepereStand(JEU.couleurs[JEU.ia]);
    finirAttente();
    JEU.apresArrivee = 0; JEU.arretApres = null; JEU.signal = null; JEU.final = null;
    JEU.enregistreur = creerEnregistrement();
    JEU.departRecord = false;
    PODIUM3D.cacher();
    JEU.ecran = 'course';
    INTERFACE.montrer('course');
    dire('');
    for (const m of etat.tampon) partie.recevoir(m);
    etat.tampon = [];
  }

  // un pas de physique (BOUCLE.surPhysique : pasJoueur de principal.js) : mes commandes partent, la course avance si tout le monde est là
  function pas() {
    const p = etat.partie;
    if (!p || JEU.ecran !== 'course' || etat.sortie) return;   // (au podium, la course ne bouge plus ; la pause n'existe pas en ligne : les autres nous attendraient)
    const moi = p.moi, cmd = JEU.robot ? commandeRobot(moi) : JEU.cibles;
    p.local = { gaz: cmd.gaz, frein: cmd.frein, direction: cmd.direction, remise: !!JEU.remettre };
    JEU.remettre = false;
    if (p.avancer(1)) enregistrerPas();
  }

  // le robot d'essai (?robot=1) : gaz tenu à l'extinction des feux, ensuite la ligne du milieu
  function commandeRobot(moi) {
    const c = moi.course;
    if (courseAutorise(c)) return piloteRobot(moi.v, CIRCUIT);
    const d = c.depart;
    return { gaz: d && d.extinction !== null ? 1 : 0, frein: 0, direction: 0 };
  }

  // le podium : au pas où la course est finie POUR TOUS (partie.fin, décidé par le cœur : le même pas chez tous les clients : tout le monde a fini, ou
  // ARRIVEE_ATTENTE_MAX s après le dernier humain arrivé) ; la partie n'avance plus ensuite
  function podiumPret() {
    const p = etat.partie;
    return !!p && p.fin !== null && p.fin !== undefined;
  }


  // le classement final et ses empreintes, pour les tests (le même chez tous les clients)
  function resume() {
    const p = etat.partie;
    if (!p) return null;
    return { n: p.n, empreinte: p.empreinte(), arrivees: p.e.pilotes.map(q => q.arrivee), final: JEU.final ? JEU.final.map(x => [x.k, x.place, x.total]) : null, desynchro: p.desynchro, ecran: JEU.ecran };
  }

  return { etat, preparer, ouvrir, lancer, image, pas, podiumPret, retourSalle, resume, dire, fabrique, rechargerPour, verifierCircuit, surPerdu, erreurRelais, echap, quitter, cacher, surveillerAttente, sortirApres };
})();
