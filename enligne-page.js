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
// Les paramètres de l'adresse : enlignecourse=hote|CODE, canal=<nom du BroadcastChannel>, joueurs=N (l'hôte attend N joueurs), tours=N, ia=N,
// nom=<nom permis>, robot=1 (le robot d'essai conduit), transport=diffusion|websocket|memoire.
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
    etat.actif = true; etat.role = param === 'hote' ? 'hote' : 'invite'; etat.code = param === 'hote' ? null : String(param).toUpperCase();
    etat.attendus = Math.max(2, Math.min(R.EN_LIGNE_JOUEURS_MAX, Math.floor(Number(parametres.get('joueurs'))) || 2));
    etat.tours = Math.max(1, Math.floor(Number(parametres.get('tours'))) || 1);
    etat.nbIA = Math.max(0, Math.floor(Number(parametres.get('ia'))) || 0);
    etat.nom = parametres.get('nom') || (etat.role === 'hote' ? 'Pilote 1' : 'Pilote 2');
    etat.canal = parametres.get('canal') || undefined;
    etat.transport = parametres.get('transport') || (R.EN_LIGNE_URL ? 'websocket' : 'diffusion');
    return etat;
  }

  // la page est prête (scène, caméra) : on ouvre la connexion
  function ouvrir() {
    dire(texte('enl_connexion'));
    const c = RESEAU.client({ transport: etat.transport, canal: etat.canal, ping: true });
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
  function surPerdu() { if (!etat.termine && !etat.sortie) { dire(texte('enl_perdu')); sortirApres('perdu'); } }

  function brancher(c) {
    etat.client = c;
    if (c.sur) c.sur('perdu', surPerdu);
    window.__enligne = etat;   // (les tests lisent le code de la salle et l'état de la partie)
    c.sur(m => {
      switch (m.t) {
        case 'salle': etat.code = m.code; majSalle(); break;
        case 'joueurs': etat.joueurs = m.liste; for (const j of m.liste) etat.noms.set(j.id, j.nom); majSalle(); essayerLancer(); break;
        case 'refus': dire(texte('enl_refus_' + m.raison) || m.raison); break;
        case 'depart': recevoirDepart(m); break;
        case 'cmd': case 'controle': case 'parti':
          if (etat.partie) etat.partie.recevoir(m); else etat.tampon.push(m);
          if (m.t === 'parti' && etat.depart && !etat.termine) annoncer(texte('enl_parti').replace('{nom}', etat.noms.get(m.id) || ('#' + m.id)));   // (T8) la voiture roule sur sa dernière commande puis s'arrête (enligne.js)
          break;
        case 'coupure': if (!etat.termine) dire(texte('enl_coupure')); break;
        default:
      }
    });
  }

  // ---- les incidents (tour 56, T8)
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
  // fait avancer la course (mes commandes : neutres, personne ne conduit un onglet caché) au rythme du temps réel
  function cacher(cache) {
    const ms = REGLAGES.EN_LIGNE_FOND_MS;
    if (!cache) { if (etat.fond !== null) { clearInterval(etat.fond); etat.fond = null; } return; }
    if (!ms || etat.fond !== null || !etat.partie) return;
    etat.fondT = performance.now();   // (l'horloge de la page, jamais dans la simulation)
    etat.fond = setInterval(() => {
      const t = performance.now(), pas = Math.min(REGLAGES.EN_LIGNE_FOND_PAS_MAX, Math.floor((t - etat.fondT) / 1000 / REGLAGES.PAS_PHYSIQUE));
      if (pas <= 0) return;
      etat.fondT += pas * REGLAGES.PAS_PHYSIQUE * 1000;
      const p = etat.partie;
      for (let i = 0; i < pas && p && JEU.ecran === 'course' && !etat.sortie; i++) {
        p.local = { gaz: 0, frein: 0, direction: 0, remise: false };
        if (!p.avancer(1)) break;   // (on attend un autre : le prochain passage réessaie)
      }
      surveillerAttente();
    }, ms);
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
      etat.msgAttente = texte('enl_lent').replace('{noms}', p.attente.map(id => etat.noms.get(id) || ('#' + id)).join(', '));
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
    dire(texte('enl_demarrage'));
  }

  // à chaque image : la course démarre dès que le départ est arrivé et que la carte des IA est prête
  function image() {
    if (!etat.actif) return;
    if (etat.depart && !etat.partie && JEU.carte) demarrerCourse();
    const p = etat.partie;
    if (p && p.desynchro && !etat.erreur) { etat.erreur = 'desynchro'; dire(texte('enl_desynchro')); sortirApres('desynchro'); }   // (T8) message clair, puis retour à la salle
    surveillerAttente();
  }

  const COULEURS_HUMAINS = () => R.DEUX_COULEURS_CHOIX;

  function demarrerCourse() {
    const c = etat.client, d = etat.depart;
    const partie = EN_LIGNE.demarrer(d, c.moi, msg => c.envoyer(msg), { carte: JEU.carte, circuit: CIRCUIT });
    etat.partie = partie;
    const e = partie.e, P = e.pilotes;
    JEU.plateau = e;
    JEU.contre = true;
    JEU.ia = P.indexOf(partie.moi);   // la voiture du joueur (comme « contre les IA » : la caméra, le tableau et la minicarte la suivent)
    // les voitures : les IA aux couleurs des IA, les joueurs aux leurs (dans l'ordre de la salle : la même chose chez tous)
    const nbIA = d.reglages.nbIA, humains = COULEURS_HUMAINS();
    JEU.couleurs = P.map((p, k) => k < nbIA ? R.COULEURS_IA[k % R.COULEURS_IA.length] : humains[(k - nbIA) % humains.length]);
    VOITURE3D.preparerCasques(P.map(() => CASQUE.neutre()));
    VOITURE3D.preparerLivrees(P.map((p, k) => k < nbIA ? LIVREE.pourVoiture(JEU.couleurs[k], LIVREE.ecurie(k), p.numero)
      : LIVREE.pourVoiture(JEU.couleurs[k], LIVREE.creer(R.LIVREE_DEUX[(k - nbIA) % R.LIVREE_DEUX.length], R.DEUX_COULEURS_CHOIX[(k - nbIA + 1) % humains.length]), p.numero)));
    JEU.modeles = [];
    JEU.couleurs.forEach((couleur, k) => JEU.modeles.push(VOITURE3D.creer(couleur, k === JEU.ia, undefined, k, k)));
    for (const m of JEU.modeles) SCENE3D.ajouter(m.groupe);
    if (JEU.modele) JEU.modele.groupe.visible = false;   // la voiture « seul en piste » du chargement
    suivre(JEU.ia);
    SCENE3D.colorerRepereStand(JEU.couleurs[JEU.ia]);
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

  // le podium : les voitures qui roulent encore sont attendues autant que dans une course contre les IA, mais le moment doit être le même pour tous :
  // toutes arrivées, ou ARRIVEE_ATTENTE_MAX s de course après l'arrivée du dernier joueur encore là (e.temps et les arrivées sont ceux de la simulation)
  function podiumPret(e) {
    const p = etat.partie;
    if (e.pilotes.every(q => q.arrivee !== null)) return true;
    const encore = p.ordre.filter(id => !p.sortis.has(id)).map(id => p.pilotes.get(id));
    if (!encore.length || !encore.every(q => q.arrivee !== null)) return false;
    return e.temps - Math.max(...encore.map(q => q.arrivee)) >= R.ARRIVEE_ATTENTE_MAX;
  }

  // les résultats : de retour à la salle (T5/T8 ; pour l'instant on quitte proprement)
  function retourSalle() {
    const c = etat.client;
    etat.termine = true;
    if (c) { if (c.estHote() && c.depart) c.retour(); }
    if (typeof ENLIGNE_ECRANS !== 'undefined' && ENLIGNE_ECRANS.retourSalle) ENLIGNE_ECRANS.retourSalle(c); else location.href = location.pathname;
  }

  // le classement final et ses empreintes, pour les tests (le même chez tous les clients)
  function resume() {
    const p = etat.partie;
    if (!p) return null;
    return { n: p.n, empreinte: p.empreinte(), arrivees: p.e.pilotes.map(q => q.arrivee), final: JEU.final ? JEU.final.map(x => [x.k, x.place, x.total]) : null, desynchro: p.desynchro, ecran: JEU.ecran };
  }

  return { etat, preparer, ouvrir, lancer, image, pas, podiumPret, retourSalle, resume, dire, surPerdu, echap, quitter, cacher, surveillerAttente, sortirApres };
})();
