// Le démarrage : il branche la physique et l'affichage sur la boucle.
// La voiture du joueur roule sur le circuit de test, ou sur celui de ?circuit=… (un nom de CIRCUITS, donnees.js).
const PARAMETRES = new URLSearchParams(location.search);
const NOM_CIRCUIT = Object.prototype.hasOwnProperty.call(CIRCUITS, PARAMETRES.get('circuit')) ? PARAMETRES.get('circuit') : 'test';
const CIRCUIT = NOM_CIRCUIT === 'test' ? CIRCUIT_TEST : construireCircuit(CIRCUITS[NOM_CIRCUIT]);

// l'état du jeu, lisible par les tests
const JEU = {
  joueur: null,         // la voiture (physique.js)
  modele: null,         // son modèle 3D
  alpha: 0,             // l'alpha de la dernière image
  cibles: { gaz: 0, frein: 0, direction: 0 },   // ce que demandent les touches
  remettre: false,      // Espace : traité au prochain pas de physique
  course: null,         // la course en cours (course.js), ou null
  ecran: 'choix',       // choix, course, pause, fin, survol (les caméras ?camera=… sans course)
  robot: false,         // ?robot=1 : le robot d'essai conduit la voiture du joueur (tests, démonstration)
  ia: 0,                // ?ia=1 : l'IA conduit la voiture du joueur ; ?ia=N (N ≥ 2) : une course de N IA (simulation.js)
  plateau: null,        // avec ?ia=N : la course entre IA (creerCourseIA) ; JEU.joueur et JEU.course sont ceux de la voiture suivie
  modeles: [],          // avec ?ia=N : le modèle 3D de chaque IA
  suivie: 0,            // avec ?ia=N : la voiture que suit la caméra (Tab : la suivante)
  trajectoire: null,    // la trajectoire idéale de l'IA sur ce circuit (ia.js), calculée seulement avec ?ia=1, en fond
  calculTrajectoire: null,   // le suivi de ce calcul (calculerEnFond)
  pas: 0,               // le nombre de pas de physique faits (pour vérifier la pause)
  apresArrivee: 0,      // s depuis l'arrivée
  arretApres: null,     // s entre l'arrivée et l'arrêt de la voiture
  signal: null,         // le dernier signal de course joué (3, 2, 1, go)
};

// les caméras de survol n'ont pas de course
const SURVOL = ['auto', 'libre', 'dessus', 'virage', 'vitrine'];

// ?ia=N : la caméra, le tableau et le bandeau de course suivent la voiture k
function suivre(k) {
  JEU.suivie = k;
  const p = JEU.plateau.pilotes[k];
  JEU.joueur = p.v;
  JEU.course = p.course;
  JEU.modele = JEU.modeles[k];
}

// Tab : la voiture suivante encore en course
function suivreSuivante() {
  const pilotes = JEU.plateau.pilotes;
  for (let i = 1; i <= pilotes.length; i++) {
    const k = (JEU.suivie + i) % pilotes.length;
    if (pilotes[k].arrivee === null) { suivre(k); return; }
  }
}

function lancerCourse(nbTours) {
  if (JEU.ia >= 2) {
    JEU.plateau = creerCourseIA(CIRCUIT, JEU.ia, nbTours, Number(PARAMETRES.get('graine')) || 1, JEU.trajectoire);
    suivre(0);
  } else {
    JEU.course = creerCourse(CIRCUIT, nbTours);
    placerAuDepart(JEU.joueur, CIRCUIT);
  }
  JEU.apresArrivee = 0;
  JEU.arretApres = null;
  JEU.signal = null;
  JEU.ecran = 'course';
  INTERFACE.montrer('course');
}

function pause(oui) {
  if (oui && JEU.ecran === 'course') { JEU.ecran = 'pause'; INTERFACE.montrer('pause'); }
  else if (!oui && JEU.ecran === 'pause') { JEU.ecran = 'course'; INTERFACE.montrer('course'); }
}

function allerAuChoix() {
  JEU.course = null;
  JEU.ecran = 'choix';
  placerAuDepart(JEU.joueur, CIRCUIT);
  INTERFACE.preparerChoix(lancerCourse, NOM_CIRCUIT);
  INTERFACE.montrer('choix');
}

// les bips du compte à rebours (3, 2, 1) et le GO, joués une fois chacun
function signauxCourse(c) {
  if (!c || JEU.ecran !== 'course') return;
  const s = c.etat === 'compte' ? String(Math.ceil(c.compte)) : (c.etat === 'attente' || c.etat === 'course' ? 'go' : null);
  if (s && s !== JEU.signal) {
    JEU.signal = s;
    SON.signal(s === 'go' ? 'go' : 'compte');
  }
}

// la course est finie : le record, puis l'écran de fin
function finDeCourse() {
  const c = JEU.course;
  // une course entre IA ne bat pas les records du joueur
  const nouveau = JEU.plateau ? false : SAUVEGARDE.proposerRecord(c.nbTours, c.meilleurTour, NOM_CIRCUIT);
  INTERFACE.remplirFin(c, nouveau);
  SON.signal('arrivee');
  JEU.ecran = 'fin';
  INTERFACE.montrer('fin');
}

// les touches de conduite, par leur place (e.code) : ZQSD en AZERTY = WASD en QWERTY
const TOUCHES = {
  gaz: ['ArrowUp', 'KeyW'], frein: ['ArrowDown', 'KeyS'], gauche: ['ArrowLeft', 'KeyA'], droite: ['ArrowRight', 'KeyD'],
};
const enfoncees = new Set();

function majCibles() {
  const appui = liste => liste.some(c => enfoncees.has(c));
  JEU.cibles.gaz = appui(TOUCHES.gaz) ? 1 : 0;
  JEU.cibles.frein = appui(TOUCHES.frein) ? 1 : 0;
  JEU.cibles.direction = (appui(TOUCHES.droite) ? 1 : 0) - (appui(TOUCHES.gauche) ? 1 : 0);
}

function brancherClavier() {
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyC' && !e.repeat) CAMERA.suivante();
    if (e.code === 'Space' && !e.repeat) JEU.remettre = true;
    if (e.code === 'Escape' && !e.repeat) pause(JEU.ecran === 'course');
    if (e.code === 'Tab') { e.preventDefault(); if (JEU.plateau && !e.repeat) suivreSuivante(); }
    enfoncees.add(e.code);
    majCibles();
  });
  window.addEventListener('keyup', e => { enfoncees.delete(e.code); majCibles(); });
  window.addEventListener('blur', () => { enfoncees.clear(); majCibles(); });
  // une touche lâchée pendant que l'onglet est caché n'envoie jamais son keyup : on remet tout à zéro
  document.addEventListener('visibilitychange', () => { enfoncees.clear(); majCibles(); });
}

const AUCUNE = { gaz: 0, frein: 0, direction: 0 };

function pasJoueur(pas) {
  if (JEU.ecran === 'pause') return;   // la pause arrête la physique
  JEU.pas++;
  // ?ia=N : toutes les IA, leurs contacts, leurs courses (la voiture suivie comprise)
  if (JEU.plateau) {
    JEU.remettre = false;
    if (JEU.ecran === 'course') pasCourseIA(JEU.plateau, pas);
    return;
  }
  const v = JEU.joueur, c = JEU.course;
  // on conduit en survol, en essai, et en course une fois le GO donné (pas pendant le compte à rebours ni après l'arrivée)
  const permis = JEU.ecran === 'survol' ? CAMERA.conduite : (JEU.ecran === 'course' && c && courseAutorise(c));
  if (JEU.remettre) { if (permis) remettreSurPiste(v, CIRCUIT); JEU.remettre = false; }
  if (c && c.etat === 'finie') {
    // après l'arrivée : les commandes sont coupées et la voiture freine seule jusqu'à l'arrêt
    appliquerCommandes(v, { gaz: 0, frein: v.u > REGLAGES.ARRET_APRES_ARRIVEE ? 1 : 0, direction: 0 });
    JEU.apresArrivee += pas;
    if (v.u === 0 && JEU.arretApres === null) JEU.arretApres = JEU.apresArrivee;
  } else if (JEU.ia && permis) appliquerCommandes(v, JEU.trajectoire ? piloteIA(v, CIRCUIT, JEU.trajectoire) : AUCUNE);   // tant que la trajectoire se calcule, elle attend
  else if (JEU.robot && permis) appliquerCommandes(v, piloteRobot(v, CIRCUIT));
  else lisserCommandes(v, permis ? JEU.cibles : AUCUNE, pas);
  pasVoiture(v, CIRCUIT, pas);
  if (c && JEU.ecran === 'course') majCourse(c, v, pas);
}

// l'affichage provisoire : la vitesse et « hors piste »
function majTableau() {
  const v = JEU.joueur;
  document.getElementById('vitesse').textContent = Math.round(Math.abs(v.u) * 3.6);
  document.getElementById('rapport').textContent = rapportPourVitesse(v.u);
  const roule = JEU.ecran === 'course' || JEU.ecran === 'survol';
  document.getElementById('horsPiste').classList.toggle('cache', !(v.surHerbe && roule));
}

// les mesures pour régler la conduite : la dérive (l'angle entre l'avant et la trajectoire), les g latéraux,
// et les triangles et appels de dessin d'une voiture
function mesuresConduite() {
  const v = JEU.joueur;
  const derive = Math.abs(v.u) > 1 ? Math.atan2(v.v, Math.abs(v.u)) * 180 / Math.PI : 0;
  const gLateraux = v.u * v.r / REGLAGES.GRAVITE;   // l'accélération vers le centre du virage, en g
  return 'dérive ' + derive.toFixed(1) + '° · ' + Math.abs(gLateraux).toFixed(2) + ' g · voiture ' + VOITURE3D.triangles(JEU.modele) + ' triangles, ' + VOITURE3D.appels(JEU.modele) + ' appels';
}

// ?debug=1 : les images par seconde et les triangles dessinés, dans un coin
function brancherDebug() {
  const boite = document.getElementById('ips');
  boite.classList.remove('cache');
  let images = 0, temps = 0;
  BOUCLE.surAffichage((alpha, dt) => {
    images++;
    temps += dt;
    if (temps >= REGLAGES.DEBUG_PERIODE_IPS) {
      boite.textContent = Math.round(images / temps) + ' i/s · ' + SCENE3D.trianglesDessines + ' triangles · ' + SCENE3D.appelsDessin + ' appels\n' + mesuresConduite();
      images = 0;
      temps = 0;
    }
  });
}

// un calcul long (un générateur, voir etapesTrajectoire) découpé en tranches d'environ CALCUL_TRANCHE_MS,
// entre lesquelles la page dessine et répond : elle n'est jamais bloquée. fini(résultat) à la fin.
// Renvoie son suivi : { tranches, plusLongue (ms), debut, fin } (pour les tests et ?debug=1).
function calculerEnFond(etapes, fini) {
  const suivi = { tranches: 0, plusLongue: 0, debut: performance.now(), fin: null };
  const tranche = () => {
    const debut = performance.now();
    let r;
    do r = etapes.next(); while (!r.done && performance.now() - debut < REGLAGES.CALCUL_TRANCHE_MS);
    suivi.tranches++;
    suivi.plusLongue = Math.max(suivi.plusLongue, performance.now() - debut);
    if (r.done) { suivi.fin = performance.now(); fini(r.value); }
    else setTimeout(tranche, 0);
  };
  setTimeout(tranche, 0);
  return suivi;
}

function demarrerJeu() {
  // un jeu, pas une page : ni menu contextuel, ni défilement par les touches ou la molette
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
  });
  document.getElementById('unite').textContent = texte('kmh');
  document.getElementById('horsPiste').textContent = texte('horsPiste');
  document.getElementById('aide').textContent = texte('aideConduite');

  if (!SCENE3D.init(document.getElementById('scene3d'), CIRCUIT)) return;
  CAMERA.init(SCENE3D.camera, CIRCUIT, PARAMETRES.get('camera'));
  JEU.joueur = creerVoiture(CIRCUIT, 0);
  JEU.robot = PARAMETRES.get('robot') === '1';
  JEU.ia = Math.max(0, Math.min(REGLAGES.IA_PAGE_MAX, Math.floor(Number(PARAMETRES.get('ia'))) || 0));
  if (JEU.ia) JEU.calculTrajectoire = calculerEnFond(etapesTrajectoire(CIRCUIT), t => {
    JEU.trajectoire = t;
    if (JEU.plateau) JEU.plateau.trajectoire = t;
  });
  // ?ia=N : un modèle par IA, chacune sa couleur ; sinon, la voiture du joueur
  const couleurs = REGLAGES.COULEURS_IA;
  for (let k = 0; k < (JEU.ia >= 2 ? JEU.ia : 0); k++) {
    JEU.modeles.push(VOITURE3D.creer(couleurs[k % couleurs.length]));
    SCENE3D.ajouter(JEU.modeles[k].groupe);
  }
  if (JEU.ia < 2) {
    JEU.modele = VOITURE3D.creer(REGLAGES.COULEUR_JOUEUR);
    SCENE3D.ajouter(JEU.modele.groupe);
  } else JEU.modele = JEU.modeles[0];   // avant la course (écran de choix), la première IA attend sur la ligne
  INTERFACE.preparerPause(() => pause(false), () => lancerCourse(JEU.course.nbTours));
  INTERFACE.preparerFin(() => lancerCourse(JEU.course.nbTours), allerAuChoix);
  // ?course=5, 12, 18 ou 0 (essai libre) lance directement une course (tests, développement)
  const demandee = PARAMETRES.get('course');
  if (SURVOL.includes(PARAMETRES.get('camera'))) { JEU.ecran = 'survol'; INTERFACE.montrer('survol'); }
  else if (demandee !== null && !isNaN(Number(demandee))) lancerCourse(Number(demandee));
  else allerAuChoix();
  brancherClavier();
  const boutonSon = document.getElementById('boutonSon');
  boutonSon.title = texte('son');
  const majBoutonSon = () => { boutonSon.textContent = SON.muet ? '🔇' : '🔊'; };
  // pas de focus sur le bouton : Espace ne doit pas le cliquer
  boutonSon.addEventListener('mousedown', e => e.preventDefault());
  boutonSon.addEventListener('click', () => { SON.basculer(); majBoutonSon(); });
  window.addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) { SON.basculer(); majBoutonSon(); } });
  if (PARAMETRES.get('reglages') === '1') PANNEAU_REGLAGES.creer(cle => { if (cle === 'HALO_EPAISSEUR') VOITURE3D.majHalo(JEU.modele); });

  BOUCLE.surPhysique(pasJoueur);
  BOUCLE.surAffichage((alpha, dt) => {
    JEU.alpha = alpha;
    // ?ia=N : chaque IA à sa place ; une IA arrivée quitte la piste (elle n'est plus dessinée)
    if (JEU.plateau) JEU.plateau.pilotes.forEach((p, k) => {
      const m = JEU.modeles[k];
      m.groupe.visible = p.arrivee === null || k === JEU.suivie;
      if (m !== JEU.modele) { VOITURE3D.placer(m, etatAffiche(p.v, alpha), p.v); m.tete.visible = true; }
    });
    const etat = etatAffiche(JEU.joueur, alpha);
    VOITURE3D.placer(JEU.modele, etat, JEU.joueur);
    JEU.modele.tete.visible = CAMERA.mode !== 'cockpit';   // en vue cockpit, l'œil est dans le casque
    CAMERA.maj(dt, etat, JEU.joueur);
    majTableau();
    INTERFACE.majCourse(JEU.course, JEU.ecran);
    signauxCourse(JEU.course);
    if (JEU.ecran === 'course' && JEU.course && JEU.course.etat === 'finie') finDeCourse();
    SON.maj(JEU.joueur);
    SCENE3D.dessiner();
  });
  if (PARAMETRES.get('debug') === '1') brancherDebug();
  BOUCLE.demarrer();
}

// la page de test charge ce fichier sans scène : elle ne démarre pas le jeu
if (document.getElementById('scene3d')) demarrerJeu();
