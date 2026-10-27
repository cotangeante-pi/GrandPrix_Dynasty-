// L'affichage 3D (Three.js). Il lit l'état du jeu et le dessine ; il ne change jamais l'état.
const SCENE3D = (function () {
  const R = REGLAGES;
  let rendu = null, scene = null, camera = null, conteneur = null;
  // le mode 2 joueurs (écran partagé, CLAUDE.md) : la même scène dessinée deux fois par image, en haut avec camera (joueur 1),
  // en bas avec camera2 (joueur 2), par setViewport / setScissor ; partage : le mode est actif
  let camera2 = null, partage = false;
  let infoCircuit = null;   // { triangles, msConstruction }
  let trianglesDessines = 0, appelsDessin = 0;
  let decor = null;   // le décor du circuit (étape 10, decor.js), ou null

  // gp (facultatif) : { championnat, circuit } du Grand Prix (le public du décor, decor-public.js)
  function init(element, circuit, gp) {
    conteneur = element;
    try {
      rendu = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      return false;   // pas de WebGL : le jeu le dira plus tard à l'écran
    }
    // un écran Retina a 4 fois plus de pixels : on plafonne (réglage), c'est là que partent les images par seconde
    rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, R.PIXEL_RATIO_MAX));
    conteneur.appendChild(rendu.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(R.COULEUR_CIEL);
    scene.fog = new THREE.Fog(R.COULEUR_CIEL, R.BROUILLARD[0], R.BROUILLARD[1]);

    camera = new THREE.PerspectiveCamera(55, 1, 0.5, R.CAMERA_LOIN);
    camera2 = new THREE.PerspectiveCamera(55, 1, 0.5, R.CAMERA_LOIN);
    rendu.info.autoReset = false;   // les compteurs (triangles, appels) couvrent l'image entière, même dessinée en deux moitiés

    scene.add(new THREE.HemisphereLight(0xffffff, R.COULEUR_SOL, 0.6));
    const soleil = new THREE.DirectionalLight(0xffffff, 0.9);
    soleil.position.set(300, 600, 200);
    scene.add(soleil);

    const t0 = performance.now();
    const groupe = construireCircuit3D(circuit);
    scene.add(groupe);
    infoCircuit = { triangles: compterTriangles(groupe), msConstruction: performance.now() - t0 };

    // le décor (étape 10, decor.js) : DECORS[le circuit], s'il existe (tribunes, public, stands, arbres, panneaux, pneus)
    const cle = typeof CIRCUITS !== 'undefined' ? Object.keys(CIRCUITS).find(k => CIRCUITS[k].nom === circuit.nom) : undefined;
    if (R.DECOR_ACTIF && typeof DECOR !== 'undefined' && typeof DECORS !== 'undefined' && cle && DECORS[cle]) {
      decor = DECOR.construire(circuit, DECORS[cle], gp || { championnat: null, circuit: cle });
      scene.add(decor.groupe);
    }

    redimensionner();
    window.addEventListener('resize', redimensionner);
    return true;
  }

  // --- la géométrie du circuit, tirée des échantillons

  // un ruban qui suit la piste entre les écarts d1 et d2 (d > 0 = à droite), à la hauteur y ; garder(i) choisit les morceaux
  // couleur(i) : la couleur du morceau i → i+1 (facultatif)
  function ruban(c, d1, d2, y, garder, couleur) {
    const pos = [], col = [];
    const coin = (i, d) => [c.x[i] + c.nx[i] * d, y, c.z[i] + c.nz[i] * d];
    for (let i = 0; i < c.nb; i++) {
      if (garder && !garder(i)) continue;
      const k = (i + 1) % c.nb;
      const a1 = coin(i, d1), a2 = coin(i, d2), b1 = coin(k, d1), b2 = coin(k, d2);
      // deux triangles, tournés vers le haut
      pos.push(...a1, ...a2, ...b1, ...b1, ...a2, ...b2);
      if (couleur) { const cc = new THREE.Color(couleur(i)); for (let v = 0; v < 6; v++) col.push(cc.r, cc.g, cc.b); }
    }
    return geometrie(pos, col);
  }

  // un mur vertical qui suit la piste à l'écart d ; garder(i) choisit les morceaux (facultatif)
  function mur(c, d, hauteur, garder) {
    const pos = [];
    for (let i = 0; i < c.nb; i++) {
      if (garder && !garder(i)) continue;
      const k = (i + 1) % c.nb;
      const ax = c.x[i] + c.nx[i] * d, az = c.z[i] + c.nz[i] * d, bx = c.x[k] + c.nx[k] * d, bz = c.z[k] + c.nz[k] * d;
      pos.push(ax, 0, az, ax, hauteur, az, bx, 0, bz, bx, 0, bz, ax, hauteur, az, bx, hauteur, bz);
    }
    return geometrie(pos);
  }

  // un rectangle en travers de la piste à l'échantillon i : de d1 à d2, de -avant à +apres le long de la piste
  function travers(c, i, d1, d2, avant, apres, y, pos, col, couleur) {
    const p = (d, l) => [c.x[i] + c.nx[i] * d + c.tx[i] * l, y, c.z[i] + c.nz[i] * d + c.tz[i] * l];
    const a1 = p(d1, -avant), a2 = p(d2, -avant), b1 = p(d1, apres), b2 = p(d2, apres);
    pos.push(...a1, ...a2, ...b1, ...b1, ...a2, ...b2);
    const cc = new THREE.Color(couleur);
    for (let v = 0; v < 6; v++) col.push(cc.r, cc.g, cc.b);
  }

  function geometrie(pos, col) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (col && col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }

  function maillage(g, couleur, options) {
    const m = new THREE.MeshLambertMaterial(Object.assign(couleur === null ? { vertexColors: true } : { color: couleur }, options));
    return new THREE.Mesh(g, m);
  }

  function construireCircuit3D(c) {
    const groupe = new THREE.Group();
    const demi = c.largeur / 2;

    // l'herbe, centrée sur le circuit
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < c.nb; i++) { xmin = Math.min(xmin, c.x[i]); xmax = Math.max(xmax, c.x[i]); zmin = Math.min(zmin, c.z[i]); zmax = Math.max(zmax, c.z[i]); }
    // l'herbe est repoussée dans le tampon de profondeur (polygonOffset) : à 2 cm sous la route, elle gagnait parfois le combat de
    // profondeur et la route disparaissait sous les voitures (vu au tour 25b, selon la taille de l'image et la caméra)
    const sol = maillage(new THREE.PlaneGeometry(R.TAILLE_SOL, R.TAILLE_SOL), R.COULEUR_SOL, { polygonOffset: true, polygonOffsetFactor: R.SOL_RECUL_PROFONDEUR, polygonOffsetUnits: R.SOL_RECUL_PROFONDEUR });
    sol.rotation.x = -Math.PI / 2;
    sol.position.set((xmin + xmax) / 2, 0, (zmin + zmax) / 2);
    groupe.add(sol);

    // la route et ses bords (de petites hauteurs différentes : pas de clignotement entre deux surfaces)
    groupe.add(maillage(ruban(c, -demi, demi, 0.02), R.COULEUR_ROUTE));
    groupe.add(maillage(ruban(c, -demi, -demi + R.LARGEUR_BORD, 0.03), R.COULEUR_BORD));
    groupe.add(maillage(ruban(c, demi - R.LARGEUR_BORD, demi, 0.03), R.COULEUR_BORD));

    // les vibreurs, seulement dans les virages, des deux côtés
    const virage = i => Math.abs(c.courbure[i]) > R.SEUIL_COURBURE_VIBREUR;
    const bande = i => Math.floor(c.s[i] / R.LONGUEUR_BANDE_VIBREUR) % 2 ? R.COULEUR_VIBREUR_A : R.COULEUR_VIBREUR_B;
    groupe.add(maillage(ruban(c, -demi - R.LARGEUR_VIBREUR, -demi, 0.04, virage, bande), null));
    groupe.add(maillage(ruban(c, demi, demi + R.LARGEUR_VIBREUR, 0.04, virage, bande), null));

    // les barrières
    const dB = demi + R.DISTANCE_BARRIERE;
    const matBarriere = { side: THREE.DoubleSide };
    groupe.add(maillage(mur(c, -dB, R.HAUTEUR_BARRIERE), R.COULEUR_BARRIERE, matBarriere));
    groupe.add(maillage(mur(c, dB, R.HAUTEUR_BARRIERE), R.COULEUR_BARRIERE, matBarriere));

    // la voie des stands (étape 7, circuit.stands) : une bande de route au-delà du muret, et le muret hors des rampes
    if (c.stands) {
      const st = c.stands, z = i => zoneStands(c, c.s[i], st.cote * (st.dMur + 1));
      const dansVoie = i => z(i) !== null, muret = i => { const q = z(i); return q !== null && !q.rampe; };
      // (de gauche à droite : sinon, côté gauche, les triangles regardent vers le bas et la bande n'est pas dessinée)
      groupe.add(maillage(ruban(c, Math.min(st.cote * st.dMur, st.cote * st.dExt), Math.max(st.cote * st.dMur, st.cote * st.dExt), 0.02, dansVoie), R.COULEUR_STANDS));
      groupe.add(maillage(mur(c, st.cote * st.dMur, R.HAUTEUR_MUR_STANDS, muret), R.COULEUR_MUR_STANDS, matBarriere));
    }

    // la ligne d'arrivée en damier, et un trait de couleur au début des secteurs 2 et 3
    const pos = [], col = [];
    const caseL = c.largeur / R.CASES_DAMIER, caseP = R.PROFONDEUR_DAMIER / 2;
    for (let k = 0; k < R.CASES_DAMIER; k++)
      for (let rang = 0; rang < 2; rang++)
        travers(c, 0, -demi + k * caseL, -demi + (k + 1) * caseL, rang ? 0 : caseP, rang ? caseP : 0, 0.05, pos, col, (k + rang) % 2 ? 0x111111 : 0xffffff);
    for (const n of [2, 3]) {
      const i = Math.round(c.secteurs[n - 1] / c.pas) % c.nb;
      travers(c, i, -demi, demi, R.LARGEUR_REPERE_SECTEUR / 2, R.LARGEUR_REPERE_SECTEUR / 2, 0.05, pos, col, R.COULEURS_SECTEURS[n - 1]);
    }
    groupe.add(maillage(geometrie(pos, col), null));
    return groupe;
  }

  function compterTriangles(groupe) {
    let n = 0;
    groupe.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry;
      n += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    return n;
  }

  function redimensionner() {
    if (!rendu) return;
    const l = conteneur.clientWidth || 1, h = conteneur.clientHeight || 1;
    rendu.setSize(l, h, false);
    camera.aspect = !partage ? l / h : cote() ? (l / 2) / h : l / (h / 2);   // l'écran partagé : chaque moitié a sa propre proportion (côte à côte ou haut / bas)
    camera.updateProjectionMatrix();
    camera2.aspect = camera.aspect;
    camera2.updateProjectionMatrix();
  }

  // l'écran partagé côte à côte (DEUX_PARTAGE 'cote' : le joueur 1 à gauche, le joueur 2 à droite) ou haut / bas ('haut')
  const cote = () => R.DEUX_PARTAGE !== 'haut';
  // l'écran partagé : allumé ou éteint
  function partager(oui) {
    partage = !!oui;
    if (rendu) { rendu.setScissorTest(partage); if (!partage) { const l = conteneur.clientWidth || 1, h = conteneur.clientHeight || 1; rendu.setViewport(0, 0, l, h); rendu.setScissor(0, 0, l, h); } }
    redimensionner();
  }

  // renvoie le nombre de triangles dessinés
  function dessiner() {
    if (!rendu) return 0;
    rendu.info.reset();
    if (decor) DECOR.majDetail(decor, partage ? [camera.position, camera2.position] : [camera.position]);   // le public et les arbres : proches, loin ou rien
    if (partage) {
      // UN rendu, UNE scène, deux zones : le joueur 1 en haut, le joueur 2 en bas (la zone est en pixels CSS, Three.js applique le pixel ratio)
      const l = conteneur.clientWidth || 1, h = conteneur.clientHeight || 1;
      if (cote()) {   // le joueur 1 à gauche, le joueur 2 à droite
        const demi = Math.floor(l / 2);
        rendu.setViewport(0, 0, demi, h); rendu.setScissor(0, 0, demi, h);
        rendu.render(scene, camera);
        rendu.setViewport(l - demi, 0, demi, h); rendu.setScissor(l - demi, 0, demi, h);
        rendu.render(scene, camera2);
      } else {
        const demi = Math.floor(h / 2);
        rendu.setViewport(0, h - demi, l, demi); rendu.setScissor(0, h - demi, l, demi);
        rendu.render(scene, camera);
        rendu.setViewport(0, 0, l, demi); rendu.setScissor(0, 0, l, demi);
        rendu.render(scene, camera2);
      }
    } else rendu.render(scene, camera);
    trianglesDessines = rendu.info.render.triangles;
    appelsDessin = rendu.info.render.calls;
    return trianglesDessines;
  }

  // un objet de plus dans la scène (une voiture)
  function ajouter(objet) {
    if (scene) scene.add(objet);
  }

  return {
    // un objet accroché à la caméra (le volant en vue cockpit) : la caméra entre dans la scène pour que ses enfants soient dessinés
    accrocher(objet) { camera.add(objet); if (!camera.parent) scene.add(camera); },
    init, dessiner, ajouter, partager,
    get actif() { return rendu !== null; },
    get camera() { return camera; },
    get camera2() { return camera2; },
    get canvas() { return rendu ? rendu.domElement : null; },   // (tests : lire les pixels juste après dessiner)
    get partage() { return partage; },
    get infoCircuit() { return infoCircuit; },
    get decor() { return decor; },   // (tests : le décor placé, ses maillages, ses niveaux de détail)
    get trianglesDessines() { return trianglesDessines; },
    get appelsDessin() { return appelsDessin; },
    get nbObjets() { let n = 0; if (scene) scene.traverse(o => { if (o.isMesh || o.isInstancedMesh || o.isPoints || o.isLine) n++; }); return n; },   // (tests : le résumé n'ajoute rien à la scène)
  };
})();
