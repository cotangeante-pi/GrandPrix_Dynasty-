// Les caméras de survol du circuit (étape 1). Elles ne touchent qu'à la caméra Three.js, jamais à l'état du jeu.
// Modes (?camera=…) : auto (par défaut, fait le tour en hauteur), libre (souris et clavier), dessus, virage.
const CAMERA = (function () {
  const R = REGLAGES;
  let cam = null, mode = 'auto';
  let centre = null, demiTaille = 0, angle = 0;
  const libre = { x: 0, y: 0, z: 0, lacet: 0, tangage: 0 };
  const touches = new Set();

  function init(camera, circuit, modeDemande) {
    cam = camera;
    mode = ['libre', 'dessus', 'virage'].includes(modeDemande) ? modeDemande : 'auto';
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < circuit.nb; i++) { xmin = Math.min(xmin, circuit.x[i]); xmax = Math.max(xmax, circuit.x[i]); zmin = Math.min(zmin, circuit.z[i]); zmax = Math.max(zmax, circuit.z[i]); }
    centre = { x: (xmin + xmax) / 2, z: (zmin + zmax) / 2, l: xmax - xmin, p: zmax - zmin };
    demiTaille = Math.max(xmax - xmin, zmax - zmin) / 2;

    if (mode === 'dessus') placerDessus();
    if (mode === 'virage') placerVirage(circuit);
    if (mode === 'libre') {
      // on part d'en haut, au-dessus du bord du circuit, en regardant le centre
      Object.assign(libre, { x: centre.x, y: R.CAMERA_AUTO_HAUTEUR / 2, z: centre.z + demiTaille, lacet: 0, tangage: -0.5 });
      brancherCommandes();
    }
    maj(0);
  }

  // tout le circuit dans l'image, vu d'en haut (le nord, -z, en haut de l'écran)
  function placerDessus() {
    const demiFov = THREE.MathUtils.degToRad(cam.fov / 2);
    const h = 1.15 * Math.max(centre.p / 2, centre.l / 2 / cam.aspect) / Math.tan(demiFov);
    cam.up.set(0, 0, -1);
    cam.position.set(centre.x, h, centre.z);
    cam.lookAt(centre.x, 0, centre.z);
  }

  // au ras de la piste, un peu avant le virage le plus serré, en regardant son milieu
  function placerVirage(c) {
    let iv = 0;
    for (let i = 0; i < c.nb; i++) if (Math.abs(c.courbure[i]) > Math.abs(c.courbure[iv])) iv = i;
    const recul = Math.round(35 / c.pas), ia = (iv - recul + c.nb) % c.nb;
    cam.position.set(c.x[ia], R.CAMERA_VIRAGE_HAUTEUR, c.z[ia]);
    cam.lookAt(c.x[iv], 0, c.z[iv]);
  }

  function brancherCommandes() {
    const codes = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    // e.code suit la place de la touche : KeyW est le Z d'un clavier AZERTY, KeyA son Q
    window.addEventListener('keydown', e => { if (codes.includes(e.code)) touches.add(e.code); });
    window.addEventListener('keyup', e => touches.delete(e.code));
    window.addEventListener('blur', () => touches.clear());
    let glisse = null;
    window.addEventListener('pointerdown', e => { glisse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('pointerup', () => { glisse = null; });
    window.addEventListener('pointermove', e => {
      if (!glisse) return;
      libre.lacet -= (e.clientX - glisse.x) * R.CAMERA_LIBRE_SOURIS;
      libre.tangage = Math.max(-1.5, Math.min(1.5, libre.tangage - (e.clientY - glisse.y) * R.CAMERA_LIBRE_SOURIS));
      glisse = { x: e.clientX, y: e.clientY };
    });
    // la molette avance ou recule dans la direction du regard
    window.addEventListener('wheel', e => {
      const pas = -e.deltaY * R.CAMERA_LIBRE_MOLETTE * libre.y;
      const cp = Math.cos(libre.tangage);
      libre.x += -Math.sin(libre.lacet) * cp * pas;
      libre.z += -Math.cos(libre.lacet) * cp * pas;
      libre.y = Math.max(R.CAMERA_LIBRE_HAUTEUR[0], Math.min(R.CAMERA_LIBRE_HAUTEUR[1], libre.y + Math.sin(libre.tangage) * pas));
    });
  }

  // dt : le temps de l'image, en secondes (la caméra suit l'affichage, pas la physique)
  function maj(dt) {
    dt = Math.min(dt, 0.1);
    if (mode === 'auto') {
      angle += R.CAMERA_AUTO_VITESSE * dt;
      const rayon = demiTaille * R.CAMERA_AUTO_RECUL;
      cam.position.set(centre.x + Math.cos(angle) * rayon, R.CAMERA_AUTO_HAUTEUR, centre.z + Math.sin(angle) * rayon);
      cam.lookAt(centre.x, 0, centre.z);
    } else if (mode === 'libre') {
      const avant = (touches.has('ArrowUp') || touches.has('KeyW') ? 1 : 0) - (touches.has('ArrowDown') || touches.has('KeyS') ? 1 : 0);
      const cote = (touches.has('ArrowRight') || touches.has('KeyD') ? 1 : 0) - (touches.has('ArrowLeft') || touches.has('KeyA') ? 1 : 0);
      const v = Math.max(R.CAMERA_LIBRE_VITESSE_MIN, R.CAMERA_LIBRE_VITESSE * libre.y) * dt;
      const s = Math.sin(libre.lacet), c = Math.cos(libre.lacet);
      libre.x += (-s * avant + c * cote) * v;
      libre.z += (-c * avant - s * cote) * v;
      cam.position.set(libre.x, libre.y, libre.z);
      cam.rotation.order = 'YXZ';
      cam.rotation.set(libre.tangage, libre.lacet, 0);
    }
  }

  return {
    init, maj,
    get mode() { return mode; },
    get position() { return cam ? { x: cam.position.x, y: cam.position.y, z: cam.position.z } : null; },
  };
})();
