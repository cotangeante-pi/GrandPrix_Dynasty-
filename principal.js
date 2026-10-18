// Le démarrage : il branche la physique et l'affichage sur la boucle.
// Étape 0 : la seule « physique » est un cube qui tourne.
const DEMO = { angleCube: 0 };

function pasDemo(pas) {
  DEMO.angleCube = (DEMO.angleCube + REGLAGES.VITESSE_CUBE * pas) % (2 * Math.PI);
}

// ?debug=1 : le nombre d'images par seconde dans un coin
function brancherDebug() {
  const boite = document.getElementById('ips');
  boite.classList.remove('cache');
  let images = 0, temps = 0;
  BOUCLE.surAffichage((alpha, dt) => {
    images++;
    temps += dt;
    if (temps >= REGLAGES.DEBUG_PERIODE_IPS) {
      boite.textContent = Math.round(images / temps) + ' i/s';
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

  SCENE3D.init(document.getElementById('scene3d'));
  BOUCLE.surPhysique(pasDemo);
  BOUCLE.surAffichage(() => SCENE3D.dessiner(DEMO));
  if (new URLSearchParams(location.search).get('debug') === '1') brancherDebug();
  BOUCLE.demarrer();
}

// la page de test charge ce fichier sans scène : elle ne démarre pas le jeu
if (document.getElementById('scene3d')) demarrerJeu();
