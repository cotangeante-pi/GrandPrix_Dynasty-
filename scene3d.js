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
  let relief = null;  // la hauteur de la route à chaque échantillon (le pont de Suzuko, decor.js), ou null : tout est à plat
  const haut = i => relief ? relief[i] : 0;
  // les voitures lointaines (étape 10) : au-delà de VOITURE_LOIN m de la caméra (à champ égal), une voiture est dessinée en forme simple,
  // toutes ensemble en un seul InstancedMesh ; { maillage, voitures } (les groupes des voitures ajoutées), créé à la première voiture
  let flotte = null, nbLointaines = 0;

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

    const ambiance = new THREE.HemisphereLight(0xffffff, R.COULEUR_SOL, 0.6);
    scene.add(ambiance);
    const soleil = new THREE.DirectionalLight(0xffffff, 0.9);
    soleil.position.set(300, 600, 200);
    scene.add(soleil);

    // le décor (étape 10, decor.js) : DECORS.test, ou celui du circuit officiel (decors-officiels.js) avec son lieu (ciel, lumière,
    // brouillard, sol) ; gp.circuit : le nom du circuit (sinon, retrouvé dans CIRCUITS par son nom affiché)
    const cle = gp && gp.circuit ? gp.circuit : typeof CIRCUITS !== 'undefined' ? Object.keys(CIRCUITS).find(k => CIRCUITS[k].nom === circuit.nom) : undefined;
    const choix = R.DECOR_ACTIF && typeof DECOR !== 'undefined' && cle ? DECOR.pour(circuit, cle, gp) : null;
    const lieu = choix ? choix.lieu : null;
    if (lieu) {
      // la lumière du lieu : l'ambiance (ciel au-dessus, sol en dessous), le soleil (sa couleur, sa force, sa hauteur en degrés) ;
      // la nuit, les projecteurs éclairent la piste (une lumière blanche de plus, LIEU_PROJECTEURS) ; le brouillard et le fond
      const L = lieu.lumiere, h = (L.hauteur || 45) * Math.PI / 180;
      // la nuit (et plus doucement le soir, DECOR.nuitDe) : l'ambiance baisse, les projecteurs éclairent moins fort que le jour, et un
      // brouillard sombre et court (NUIT_BROUILLARD) fait que seuls la piste et ses abords sont clairs ; les mâts restent allumés
      const nuit = DECOR.nuitDe(lieu);
      ambiance.color.set(L.ambiance); ambiance.groundColor.set(lieu.sol);
      ambiance.intensity = R.LIEU_AMBIANCE + (R.NUIT_AMBIANCE - R.LIEU_AMBIANCE) * nuit;
      soleil.color.set(L.soleil); soleil.intensity = L.intensite;
      soleil.position.set(Math.cos(h) * 700, Math.sin(h) * 700, Math.cos(h) * 300);
      if (L.projecteurs) scene.add(new THREE.HemisphereLight(0xfff4e0, lieu.sol, R.LIEU_PROJECTEURS + (R.NUIT_PROJECTEURS - R.LIEU_PROJECTEURS) * nuit));
      scene.background = new THREE.Color(lieu.ciel.horizon);
      const b = lieu.brouillard, debut = b.debut + (R.NUIT_BROUILLARD[0] - b.debut) * nuit, fin = b.fin + (R.NUIT_BROUILLARD[1] - b.fin) * nuit;
      scene.fog = new THREE.Fog(b.couleur, debut, fin);
    }

    // le pont : le relief du croisement (CIRCUITS[nom].croisement), avant la géométrie de la route
    relief = R.PONT_ACTIF && typeof DECOR !== 'undefined' && cle && typeof CIRCUITS !== 'undefined' && CIRCUITS[cle] && CIRCUITS[cle].croisement ? DECOR.relief(circuit, CIRCUITS[cle].croisement) : null;
    const t0 = performance.now();
    const groupe = construireCircuit3D(circuit, lieu ? lieu.sol : R.COULEUR_SOL);
    scene.add(groupe);
    infoCircuit = { triangles: compterTriangles(groupe), msConstruction: performance.now() - t0 };

    if (choix) {
      decor = DECOR.construire(circuit, choix.description, gp || { championnat: null, circuit: cle }, lieu);
      scene.add(decor.groupe);
    }

    // la météo (meteo3d.js) : ce qu'elle assombrit sous la pluie (la route, la coupole du ciel du lieu, les deux lumières)
    if (typeof METEO3D !== 'undefined') {
      let route = null, coupole = null;
      scene.traverse(o => { if (o.name === 'route') route = o; if (o.name === 'decor-ciel') coupole = o; });
      METEO3D.init(scene, { route, coupole, ambiance, soleil });
    }
    // les effets de conduite (effets3d.js, tour 37) : la fumée et les étincelles, un appel de dessin chacun (aucun s'ils sont vides)
    if (typeof EFFETS3D !== 'undefined') EFFETS3D.init(scene);
    // la trajectoire conseillée (conseil.js, tour 39) : un ruban sur la piste devant le joueur, un appel de dessin
    if (typeof CONSEIL !== 'undefined') CONSEIL.init(scene);

    redimensionner();
    window.addEventListener('resize', redimensionner);
    return true;
  }

  // --- la géométrie du circuit, tirée des échantillons

  // un ruban qui suit la piste entre les écarts d1 et d2 (d > 0 = à droite), à la hauteur y ; garder(i) choisit les morceaux
  // couleur(i) : la couleur du morceau i → i+1 (facultatif)
  function ruban(c, d1, d2, y, garder, couleur) {
    const pos = [], col = [];
    const coin = (i, d) => [c.x[i] + c.nx[i] * d, y + haut(i), c.z[i] + c.nz[i] * d];
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
      const ha = haut(i), hb = haut(k);
      pos.push(ax, ha, az, ax, ha + hauteur, az, bx, hb, bz, bx, hb, bz, ax, ha + hauteur, az, bx, hb + hauteur, bz);
    }
    return geometrie(pos);
  }

  // un rectangle en travers de la piste à l'échantillon i : de d1 à d2, de -avant à +apres le long de la piste
  function travers(c, i, d1, d2, avant, apres, y, pos, col, couleur) {
    const p = (d, l) => [c.x[i] + c.nx[i] * d + c.tx[i] * l, y + haut(i), c.z[i] + c.nz[i] * d + c.tz[i] * l];
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

  function construireCircuit3D(c, couleurSol) {
    const groupe = new THREE.Group();
    const demi = c.largeur / 2;

    // l'herbe, centrée sur le circuit
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < c.nb; i++) { xmin = Math.min(xmin, c.x[i]); xmax = Math.max(xmax, c.x[i]); zmin = Math.min(zmin, c.z[i]); zmax = Math.max(zmax, c.z[i]); }
    // l'herbe est repoussée dans le tampon de profondeur (polygonOffset) : à 2 cm sous la route, elle gagnait parfois le combat de
    // profondeur et la route disparaissait sous les voitures (vu au tour 25b, selon la taille de l'image et la caméra)
    // (assez grand pour le circuit et son paysage au loin : decor.js pose l'horizon jusqu'à HORIZON_RECUL + HORIZON_PROFONDEUR au-delà)
    const taille = Math.max(R.TAILLE_SOL, Math.hypot(xmax - xmin, zmax - zmin) + 2 * (R.HORIZON_RECUL + R.HORIZON_PROFONDEUR + 200));
    const sol = maillage(new THREE.PlaneGeometry(taille, taille), couleurSol === undefined ? R.COULEUR_SOL : couleurSol, { polygonOffset: true, polygonOffsetFactor: R.SOL_RECUL_PROFONDEUR, polygonOffsetUnits: R.SOL_RECUL_PROFONDEUR });
    sol.rotation.x = -Math.PI / 2;
    sol.position.set((xmin + xmax) / 2, 0, (zmin + zmax) / 2);
    groupe.add(sol);

    // la route et ses bords (de petites hauteurs différentes : pas de clignotement entre deux surfaces)
    const route = maillage(ruban(c, -demi, demi, 0.02), R.COULEUR_ROUTE);
    route.name = 'route';   // (meteo3d.js la mouille : plus sombre et brillante)
    groupe.add(route);
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
    if (relief) groupe.add(construirePont(c));
    return groupe;
  }

  // le pont (étape 10) : là où la route monte, le terre-plein jusqu'aux barrières (à la hauteur de la route), ses flancs jusqu'au sol,
  // et au-dessus du second passage (PONT_OUVERTURE m de part et d'autre de s1) le tablier : sa face du dessous, ses flancs, et les deux
  // culées en travers ; une seule géométrie, des deux côtés
  function construirePont(c) {
    const pos = [], col = [], dB = c.largeur / 2 + R.DISTANCE_BARRIERE, L = c.longueur;
    const s1 = CIRCUITS[Object.keys(CIRCUITS).find(k => CIRCUITS[k].croisement && CIRCUITS[k].nom === c.nom)].croisement[0];
    const ouvert = i => Math.abs(((c.s[i] - s1) % L + L * 1.5) % L - L / 2) <= R.PONT_OUVERTURE;
    const pt = (i, d, y) => [c.x[i] + c.nx[i] * d, y, c.z[i] + c.nz[i] * d];
    const quad = (a, b, cc, d, couleur) => { pos.push(...a, ...b, ...cc, ...a, ...cc, ...d); const C = new THREE.Color(couleur); for (let v = 0; v < 6; v++) col.push(C.r, C.g, C.b); };
    for (let i = 0; i < c.nb; i++) {
      const k = (i + 1) % c.nb, hi = haut(i), hk = haut(k);
      if (hi <= 0.01 && hk <= 0.01) continue;
      // le terre-plein (un peu sous la route), de barrière à barrière
      quad(pt(i, -dB, hi - 0.01), pt(i, dB, hi - 0.01), pt(k, dB, hk - 0.01), pt(k, -dB, hk - 0.01), R.COULEUR_TERRE_PLEIN);
      for (const d of [-dB, dB]) {
        if (ouvert(i)) quad(pt(i, d, hi - R.PONT_EPAISSEUR), pt(i, d, hi), pt(k, d, hk), pt(k, d, hk - R.PONT_EPAISSEUR), R.COULEUR_PONT);   // le flanc du tablier
        else quad(pt(i, d, 0), pt(i, d, hi), pt(k, d, hk), pt(k, d, 0), R.COULEUR_TALUS);                                                   // le flanc du talus
      }
      if (ouvert(i)) quad(pt(i, -dB, hi - R.PONT_EPAISSEUR), pt(k, -dB, hk - R.PONT_EPAISSEUR), pt(k, dB, hk - R.PONT_EPAISSEUR), pt(i, dB, hi - R.PONT_EPAISSEUR), R.COULEUR_PONT);   // le dessous
      if (ouvert(i) !== ouvert(k)) { const j = ouvert(i) ? k : i, h = haut(j); quad(pt(j, -dB, 0), pt(j, -dB, h), pt(j, dB, h), pt(j, dB, 0), R.COULEUR_PONT); }   // une culée
    }
    const m = maillage(geometrie(pos, col), null, { side: THREE.DoubleSide });
    m.name = 'pont';
    return m;
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
    const cachees = lointaines();
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
    for (const g of cachees) g.visible = true;   // (les voitures lointaines retrouvent leur état : le jeu ne voit pas la différence)
    trianglesDessines = rendu.info.render.triangles;
    appelsDessin = rendu.info.render.calls;
    return trianglesDessines;
  }

  // un objet de plus dans la scène (une voiture)
  function ajouter(objet) {
    if (!scene) return;
    scene.add(objet);
    if (objet.userData && objet.userData.lointaine && typeof VOITURE3D !== 'undefined') {
      if (!flotte) {
        const m = new THREE.InstancedMesh(VOITURE3D.formeLointaine(), new THREE.MeshLambertMaterial({ vertexColors: true }), R.VOITURES_LOINTAINES_MAX);
        m.name = 'voitures-lointaines'; m.frustumCulled = false; m.count = 0; m.visible = false;
        m.setColorAt(0, new THREE.Color(0xffffff));
        scene.add(m);
        flotte = { maillage: m, voitures: [] };
      }
      flotte.voitures.push(objet);
    }
  }

  // avant de dessiner : les voitures loin de toutes les caméras passent dans le maillage des voitures lointaines (et leur groupe est caché
  // le temps du dessin) ; renvoie les groupes cachés
  function lointaines() {
    const cachees = [];
    if (!flotte) return cachees;
    const cams = partage ? [camera, camera2] : [camera], seuil = R.VOITURE_LOIN * R.VOITURE_LOIN_CHAMP / camera.fov, s2 = seuil * seuil, m = flotte.maillage;
    let n = 0;
    // (au plus VOITURES_DETAILLEES_MAX voitures détaillées, les plus proches : sur la grille vue de la télé, toutes sont « proches »)
    const vues = [];
    for (const g of flotte.voitures) {
      if (!g.visible || !g.parent) continue;
      let d2 = Infinity;
      for (const c of cams) { const dx = g.position.x - c.position.x, dy = g.position.y - c.position.y, dz = g.position.z - c.position.z; d2 = Math.min(d2, dx * dx + dy * dy + dz * dz); }
      vues.push({ g, d2 });
    }
    vues.sort((a, b) => a.d2 - b.d2);
    for (let k = 0; k < vues.length; k++) {
      const { g, d2 } = vues[k];
      if ((d2 < s2 && k < R.VOITURES_DETAILLEES_MAX) || n >= R.VOITURES_LOINTAINES_MAX) continue;
      g.updateMatrix();
      g.matrix.toArray(m.instanceMatrix.array, n * 16);
      m.setColorAt(n, g.userData.lointaine.couleur);
      g.visible = false;
      cachees.push(g);
      n++;
    }
    m.count = n; m.visible = n > 0; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
    nbLointaines = n;
    return cachees;
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
    get decor() { return decor; },
    get relief() { return relief; },   // (la hauteur de la route à chaque échantillon, ou null : voiture3d.js et camera.js la suivent)
    get nbLointaines() { return nbLointaines; },   // (tests : les voitures dessinées en forme simple à la dernière image)   // (tests : le décor placé, ses maillages, ses niveaux de détail)
    get trianglesDessines() { return trianglesDessines; },
    get appelsDessin() { return appelsDessin; },
    get nbObjets() { let n = 0; if (scene) scene.traverse(o => { if (o.isMesh || o.isInstancedMesh || o.isPoints || o.isLine) n++; }); return n; },   // (tests : le résumé n'ajoute rien à la scène)
  };
})();
