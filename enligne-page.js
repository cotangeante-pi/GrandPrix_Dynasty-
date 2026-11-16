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
  const etat = { actif: false, client: null, role: null, partie: null, depart: null, tampon: [], joueurs: [], code: null, erreur: null, statut: '', attendus: 2, lance: false, termine: false };

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

  function brancher(c) {
    etat.client = c;
    window.__enligne = etat;   // (les tests lisent le code de la salle et l'état de la partie)
    c.sur(m => {
      switch (m.t) {
        case 'salle': etat.code = m.code; if (!etat.ecrans) majSalle(); break;
        case 'joueurs': etat.joueurs = m.liste; if (!etat.ecrans) { majSalle(); essayerLancer(); } break;
        case 'refus': if (!etat.ecrans) dire(texte('enl_refus_' + m.raison) || m.raison); break;
        case 'reglages': if (etat.ecrans) { verifierCircuit(m.reglages); preparerCircuit(m.reglages); } break;
        case 'retour': retourALaSalle(); break;
        case 'depart': recevoirDepart(m); break;
        case 'cmd': case 'controle': case 'parti':
          if (etat.partie) etat.partie.recevoir(m); else etat.tampon.push(m);
          break;
        case 'coupure': if (!etat.termine && !etat.ecrans) dire(texte('enl_coupure')); break;
        case 'perdu': if (!etat.ecrans) dire(texte('enl_coupure')); break;
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
    if (p && p.desynchro && !etat.erreur) { etat.erreur = 'desynchro'; p.terminer(); dire(texte('enl_desynchro')); }
    // la course est finie (podium, résultats, salle) : nos Math reviennent (les fonctions de la page ne sont plus remplacées)
    if (p && JEU.ecran !== 'course' && JEU.ecran !== 'pause') p.terminer();
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
    if (!p || JEU.ecran !== 'course') return;   // (au podium, la course ne bouge plus ; la pause n'existe pas en ligne : T8)
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

  // le bouton des résultats : de retour à la salle. L'hôte le dit à tous (« retour » : les prêts repartent à faux, la salle accepte de nouveau) ; les autres
  // y vont tout de suite et attendent. Sans écrans de salle (l'entrée directe des essais), on quitte la page.
  function retourSalle() {
    const c = etat.client;
    if (etat.partie) etat.partie.terminer();
    if (c && c.depart && c.estHote()) c.retour();
    if (etat.ecrans && typeof ENLIGNE_ECRAN !== 'undefined' && ENLIGNE_ECRAN.retourSalle) {
      etat.partie = null; etat.depart = null; etat.tampon = []; etat.lance = false;
      if (c && !c.estHote()) c.depart = null;   // (l'invité n'attend plus la course d'avant ; le « retour » de l'hôte rouvre la salle pour de bon)
      ENLIGNE_ECRAN.retourSalle();
      return;
    }
    etat.termine = true;
    location.href = location.pathname;
  }

  // le classement final et ses empreintes, pour les tests (le même chez tous les clients)
  function resume() {
    const p = etat.partie;
    if (!p) return null;
    return { n: p.n, empreinte: p.empreinte(), arrivees: p.e.pilotes.map(q => q.arrivee), final: JEU.final ? JEU.final.map(x => [x.k, x.place, x.total]) : null, desynchro: p.desynchro, ecran: JEU.ecran };
  }

  return { etat, preparer, ouvrir, lancer, image, pas, podiumPret, retourSalle, resume, dire, fabrique, rechargerPour, verifierCircuit };
})();
