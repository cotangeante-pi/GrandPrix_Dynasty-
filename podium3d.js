// Le podium en 3D, fait par le code (trois blocs, rien à charger) : 2e à gauche, 1er au milieu plus haut, 3e à droite,
// à côté de la ligne de départ. Il ne change jamais l'état du jeu : il place les modèles des trois premiers et la caméra.
const PODIUM3D = (function () {
  const R = REGLAGES;
  let groupe = null, centre = null, cap = 0;
  // les marches, de gauche à droite (vues de face) : la place qu'elles portent
  const MARCHES = [2, 1, 3];

  function init(circuit) {
    // sa place : en face de la ligne, à PODIUM_DISTANCE m du bord gauche de la piste, tourné vers elle
    const d = -(circuit.largeur / 2 + R.PODIUM_DISTANCE);
    centre = { x: circuit.x[0] + circuit.nx[0] * d, z: circuit.z[0] + circuit.nz[0] * d };
    cap = Math.atan2(circuit.nz[0], circuit.nx[0]);   // son avant : vers la piste (+normale, d > 0)
    groupe = new THREE.Group();
    groupe.visible = false;
    const blanc = new THREE.MeshLambertMaterial({ color: R.PODIUM_COULEUR });
    const sol = new THREE.Mesh(new THREE.BoxGeometry(R.PODIUM_LARGEUR * 3 + 8, 0.2, R.PODIUM_PROFONDEUR + 8), new THREE.MeshLambertMaterial({ color: R.PODIUM_COULEUR_SOL }));
    sol.position.y = 0.1;
    groupe.add(sol);
    MARCHES.forEach((place, i) => {
      const h = R.PODIUM_HAUTEURS[place - 1], x = (i - 1) * R.PODIUM_LARGEUR;
      const bloc = new THREE.Mesh(new THREE.BoxGeometry(R.PODIUM_LARGEUR, h, R.PODIUM_PROFONDEUR), blanc);
      bloc.position.set(x, h / 2, 0);
      groupe.add(bloc);
      // une bande de la couleur de la place (or, argent, bronze) sur le devant
      const bande = new THREE.Mesh(new THREE.BoxGeometry(R.PODIUM_LARGEUR, h * 0.35, 0.1), new THREE.MeshLambertMaterial({ color: R.PODIUM_COULEURS[place - 1] }));
      bande.position.set(x, h * 0.5, R.PODIUM_PROFONDEUR / 2 + 0.05);
      groupe.add(bande);
    });
    groupe.position.set(centre.x, 0, centre.z);
    // l'avant du podium (+z local) regarde la piste : rotation.y = θ envoie +z local sur (sin θ, cos θ) = (cos cap, sin cap)
    groupe.rotation.y = Math.PI / 2 - cap;
    SCENE3D.ajouter(groupe);
  }

  // un point du podium (xl : vers la droite vu de face, zl : vers l'avant) dans le monde
  function versMonde(xl, zl) {
    const fx = Math.cos(cap), fz = Math.sin(cap);   // l'avant
    const dx = fz, dz = -fx;                        // la droite de celui qui le regarde de face (= +x local)
    return { x: centre.x + fx * zl + dx * xl, z: centre.z + fz * zl + dz * xl };
  }

  // modeles : ceux des trois premiers, dans l'ordre (1er, 2e, 3e) ; ils se placent sur leurs marches, de profil
  function montrer(modeles) {
    groupe.visible = true;
    const immobile = { braquage: 0, rotationRoues: 0 };
    MARCHES.forEach((place, i) => {
      const m = modeles[place - 1];
      if (!m) return;
      const p = versMonde((i - 1) * R.PODIUM_LARGEUR, 0);
      VOITURE3D.placer(m, { x: p.x, z: p.z, cap: cap + Math.PI / 2 }, immobile);
      m.groupe.position.y = R.PODIUM_HAUTEURS[place - 1];
      m.groupe.visible = true;
    });
  }

  function cacher() {
    if (groupe) groupe.visible = false;
  }

  // la caméra tourne doucement devant le podium (t : secondes depuis le début du podium)
  function camera(cam, t) {
    const a = Math.sin(t * R.PODIUM_ROTATION) * 0.9;   // de part et d'autre de l'avant, sans passer derrière
    const [distance, hauteur] = R.PODIUM_CAMERA;
    const fx = Math.cos(cap + a), fz = Math.sin(cap + a);
    cam.up.set(0, 1, 0);
    cam.position.set(centre.x + fx * distance, hauteur, centre.z + fz * distance);
    cam.lookAt(centre.x, R.PODIUM_HAUTEURS[0] * 0.8, centre.z);
  }

  return { init, montrer, cacher, camera };
})();
