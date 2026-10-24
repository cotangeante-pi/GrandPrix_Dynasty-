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
    if (confettis) confettis.visible = false;   // (la cérémonie du champion seulement)
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
    if (confettis) confettis.visible = false;
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

  // --- la cérémonie du champion (Codeur 3) : le champion SEUL sur la plus haute marche, et des confettis faits par le code :
  // UN objet THREE.Points (une géométrie, un matériau) = un seul appel de dessin, quel que soit leur nombre. Leur chute est
  // un simple calcul de positions dans le tableau de la géométrie ; un petit générateur à lui (jamais hasard() : la graine
  // du jeu ne bouge pas pour un décor)
  let confettis = null, chute = null, phase = null;
  function creerConfettis() {
    const N = R.CEREMONIE_CONFETTIS, [lx, hy, pz] = R.CEREMONIE_CONFETTI_ZONE, [v0, v1] = R.CEREMONIE_CONFETTI_VITESSE;
    let graine = 12345;
    const alea = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
    const pos = new Float32Array(N * 3), coul = new Float32Array(N * 3), c = new THREE.Color();
    chute = new Float32Array(N); phase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (alea() - 0.5) * lx; pos[i * 3 + 1] = alea() * hy; pos[i * 3 + 2] = (alea() - 0.5) * pz;
      c.setHex(R.CEREMONIE_COULEURS[i % R.CEREMONIE_COULEURS.length]);
      coul[i * 3] = c.r; coul[i * 3 + 1] = c.g; coul[i * 3 + 2] = c.b;
      chute[i] = v0 + alea() * (v1 - v0); phase[i] = alea() * 6.283;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(coul, 3));
    confettis = new THREE.Points(geo, new THREE.PointsMaterial({ size: R.CEREMONIE_CONFETTI_TAILLE, vertexColors: true }));
    confettis.frustumCulled = false;   // ils bougent : pas de boîte englobante à recalculer
    confettis.visible = false;
    groupe.add(confettis);
  }

  // modele : celui du champion, seul sur la marche du 1er ; les confettis tombent
  function ceremonie(modele) {
    montrer([modele]);
    if (!confettis) creerConfettis();
    confettis.visible = true;
  }

  // les confettis tombent (dt : s) ; arrivés au sol, ils repartent d'en haut
  function majConfettis(dt) {
    if (!confettis || !confettis.visible) return;
    const p = confettis.geometry.attributes.position, a = p.array, hy = R.CEREMONIE_CONFETTI_ZONE[1], b = R.CEREMONIE_CONFETTI_BALANCE;
    for (let i = 0; i < chute.length; i++) {
      phase[i] += dt * 2;
      a[i * 3] += Math.cos(phase[i]) * b * dt;
      a[i * 3 + 1] -= chute[i] * dt;
      if (a[i * 3 + 1] < 0) a[i * 3 + 1] += hy;
    }
    p.needsUpdate = true;
  }

  return { init, montrer, cacher, camera, ceremonie, majConfettis, get confettis() { return confettis; } };
})();
