// L'affichage 3D (Three.js). Il lit l'état du jeu et le dessine ; il ne change jamais l'état.
const SCENE3D = (function () {
  let rendu = null, scene = null, camera = null, cube = null, conteneur = null;

  function init(element) {
    conteneur = element;
    try {
      rendu = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      return false;   // pas de WebGL : le jeu le dira plus tard à l'écran
    }
    rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    conteneur.appendChild(rendu.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(REGLAGES.COULEUR_CIEL);
    scene.fog = new THREE.Fog(REGLAGES.COULEUR_CIEL, 40, 120);

    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    camera.position.set(4, 3, 6);
    camera.lookAt(0, 0.8, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, REGLAGES.COULEUR_SOL, 0.6));
    const soleil = new THREE.DirectionalLight(0xffffff, 0.9);
    soleil.position.set(5, 10, 4);
    scene.add(soleil);

    const sol = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: REGLAGES.COULEUR_SOL }));
    sol.rotation.x = -Math.PI / 2;
    scene.add(sol);

    cube = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), new THREE.MeshLambertMaterial({ color: REGLAGES.COULEUR_CUBE }));
    cube.position.y = 1.2;
    scene.add(cube);

    redimensionner();
    window.addEventListener('resize', redimensionner);
    return true;
  }

  function redimensionner() {
    if (!rendu) return;
    const l = conteneur.clientWidth || 1, h = conteneur.clientHeight || 1;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
  }

  // etat : l'état de la démo (angle du cube), tenu par la physique
  function dessiner(etat) {
    if (!rendu) return 0;
    cube.rotation.y = etat.angleCube;
    rendu.render(scene, camera);
    return rendu.info.render.triangles;
  }

  return { init, dessiner, get actif() { return rendu !== null; } };
})();
