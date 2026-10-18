// Le démarrage : il branche la physique et l'affichage sur la boucle.
// Étape 1 : le circuit de test, survolé par la caméra (?camera=libre, dessus ou virage ; auto par défaut).
const PARAMETRES = new URLSearchParams(location.search);

// ?debug=1 : les images par seconde et les triangles dessinés, dans un coin
function brancherDebug() {
  const boite = document.getElementById('ips');
  boite.classList.remove('cache');
  let images = 0, temps = 0;
  BOUCLE.surAffichage((alpha, dt) => {
    images++;
    temps += dt;
    if (temps >= REGLAGES.DEBUG_PERIODE_IPS) {
      boite.textContent = Math.round(images / temps) + ' i/s · ' + SCENE3D.trianglesDessines + ' triangles';
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

  if (!SCENE3D.init(document.getElementById('scene3d'), CIRCUIT_TEST)) return;
  CAMERA.init(SCENE3D.camera, CIRCUIT_TEST, PARAMETRES.get('camera'));
  BOUCLE.surAffichage((alpha, dt) => {
    CAMERA.maj(dt);
    SCENE3D.dessiner();
  });
  if (PARAMETRES.get('debug') === '1') brancherDebug();
  BOUCLE.demarrer();
}

// la page de test charge ce fichier sans scène : elle ne démarre pas le jeu
if (document.getElementById('scene3d')) demarrerJeu();
