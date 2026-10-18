// Le démarrage : il branche la physique et l'affichage sur la boucle.
// Étape 2 : la voiture du joueur roule sur le circuit de test.
const PARAMETRES = new URLSearchParams(location.search);

// l'état du jeu, lisible par les tests
const JEU = {
  joueur: null,         // la voiture (physique.js)
  modele: null,         // son modèle 3D
  alpha: 0,             // l'alpha de la dernière image
  cibles: { gaz: 0, frein: 0, direction: 0 },   // ce que demandent les touches
  remettre: false,      // Espace : traité au prochain pas de physique
};

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
    enfoncees.add(e.code);
    majCibles();
  });
  window.addEventListener('keyup', e => { enfoncees.delete(e.code); majCibles(); });
  window.addEventListener('blur', () => { enfoncees.clear(); majCibles(); });
  // une touche lâchée pendant que l'onglet est caché n'envoie jamais son keyup : on remet tout à zéro
  document.addEventListener('visibilitychange', () => { enfoncees.clear(); majCibles(); });
}

function pasJoueur(pas) {
  const v = JEU.joueur;
  if (JEU.remettre) { remettreSurPiste(v, CIRCUIT_TEST); JEU.remettre = false; }
  lisserCommandes(v, CAMERA.conduite ? JEU.cibles : { gaz: 0, frein: 0, direction: 0 }, pas);
  pasVoiture(v, CIRCUIT_TEST, pas);
}

// l'affichage provisoire : la vitesse et « hors piste »
function majTableau() {
  const v = JEU.joueur;
  document.getElementById('vitesse').textContent = Math.round(Math.abs(v.u) * 3.6);
  document.getElementById('rapport').textContent = rapportPourVitesse(v.u);
  document.getElementById('horsPiste').classList.toggle('cache', !v.surHerbe);
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

  if (!SCENE3D.init(document.getElementById('scene3d'), CIRCUIT_TEST)) return;
  CAMERA.init(SCENE3D.camera, CIRCUIT_TEST, PARAMETRES.get('camera'));
  JEU.joueur = creerVoiture(CIRCUIT_TEST, 0);
  JEU.modele = VOITURE3D.creer(REGLAGES.COULEUR_JOUEUR);
  SCENE3D.ajouter(JEU.modele.groupe);
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
    const etat = etatAffiche(JEU.joueur, alpha);
    VOITURE3D.placer(JEU.modele, etat, JEU.joueur);
    JEU.modele.tete.visible = CAMERA.mode !== 'cockpit';   // en vue cockpit, l'œil est dans le casque
    CAMERA.maj(dt, etat, JEU.joueur);
    majTableau();
    SON.maj(JEU.joueur);
    SCENE3D.dessiner();
  });
  if (PARAMETRES.get('debug') === '1') brancherDebug();
  BOUCLE.demarrer();
}

// la page de test charge ce fichier sans scène : elle ne démarre pas le jeu
if (document.getElementById('scene3d')) demarrerJeu();
