// La F1 en 3D, faite par le code avec peu de triangles. Toutes les voitures ont ce modèle, avec la couleur de leur écurie.
// Repère du modèle : x vers l'avant, y vers le haut, z vers la droite (comme la voiture de physique.js).
// Pour 20 voitures, chaque voiture coûte peu d'appels de dessin : toutes les pièces fixes sont fusionnées en une seule
// géométrie (les couleurs sont portées par les sommets), le casque est à part (caché en vue cockpit), et chaque
// roue est une géométrie (pneu et jante fusionnés) qui tourne seule. Total : 6 appels par voiture.
// La voiture du joueur a des détails en plus (aileron, suspensions, rétroviseurs, volant), dans la même géométrie du corps.
const VOITURE3D = (function () {
  const R = REGLAGES;
  const NOIR = 0x18191c, CARBONE = 0x2a2c31, CASQUE = 0xf2c230, JANTE = 0xb8bcc4, MIROIR = 0xc9d4de, ECRAN = 0x3fd0ff;
  let materiauSommets = null, materiauCasque = null;   // partagés par toutes les voitures

  // un paquet de pièces à fusionner : positions, normales, couleurs
  function paquet() {
    return { pos: [], nor: [], col: [] };
  }

  // ajoute une géométrie Three.js (déjà placée) au paquet, avec une couleur
  function ajouter(p, g, couleur) {
    const n = g.index ? g.toNonIndexed() : g;
    const c = new THREE.Color(couleur);
    p.pos.push(...n.attributes.position.array);
    p.nor.push(...n.attributes.normal.array);
    for (let i = 0; i < n.attributes.position.count; i++) p.col.push(c.r, c.g, c.b);
    if (n !== g) n.dispose();
    g.dispose();
  }

  function boite(p, l, h, pr, couleur, x, y, z, rotZ, rotX, rotY) {
    const g = new THREE.BoxGeometry(l, h, pr);
    if (rotZ) g.rotateZ(rotZ);
    if (rotX) g.rotateX(rotX);
    if (rotY) g.rotateY(rotY);
    g.translate(x, y, z);
    ajouter(p, g, couleur);
  }

  function geometrie(p) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
    return g;
  }

  // un bras fin d'un point à un autre (suspensions, tiges) : une boîte allongée, tournée dans la bonne direction
  function bras(p, a, b, epaisseur, couleur) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const g = new THREE.BoxGeometry(epaisseur, epaisseur, Math.hypot(dx, dy, dz));
    g.lookAt(new THREE.Vector3(dx, dy, dz));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    ajouter(p, g, couleur);
  }

  // les détails de la voiture du joueur (surtout pour la vue cockpit), fusionnés avec le reste : aucun appel de dessin en plus
  function details(p, couleur) {
    const xa = R.CG_AVANT, xr = R.CG_AVANT - R.EMPATTEMENT;
    // l'aileron avant : deux volets étagés au-dessus du plan principal, et les deux supports sous le nez
    boite(p, 0.22, 0.03, 1.75, couleur, 2.82, 0.21, 0, 0.25);
    boite(p, 0.16, 0.025, 1.6, CARBONE, 2.66, 0.28, 0, 0.45);
    for (const c of [1, -1]) boite(p, 0.3, 0.14, 0.03, CARBONE, 2.95, 0.24, c * 0.12, 0.3);
    // les suspensions : à chaque roue, un triangle en haut, un en bas et la tige de poussée
    for (const [x, h] of [[xa, 0.33], [xr, 0.35]]) {
      for (const c of [1, -1]) {
        const roue = c * (x === xa ? 0.68 : 0.62);
        for (const [y, dy] of [[h + 0.13, 0.1], [h - 0.1, 0.06]]) {
          bras(p, [x + 0.28, y + dy, c * 0.22], [x, y, roue], 0.03, CARBONE);
          bras(p, [x - 0.28, y + dy, c * 0.22], [x, y, roue], 0.03, CARBONE);
        }
        bras(p, [x, h - 0.08, roue - c * 0.04], [x + (x === xa ? -0.15 : 0.15), 0.62, c * 0.18], 0.035, CARBONE);
      }
    }
    // les rétroviseurs : un bras, le boîtier aux couleurs de l'écurie et le miroir clair vers l'arrière
    for (const c of [1, -1]) {
      bras(p, [0.95, 0.68, c * 0.34], [0.9, 0.8, c * 0.52], 0.025, CARBONE);
      boite(p, 0.07, 0.07, 0.17, couleur, 0.9, 0.82, c * 0.55);
      boite(p, 0.01, 0.055, 0.15, MIROIR, 0.86, 0.82, c * 0.55);
    }
    // le volant et son petit écran
    boite(p, 0.04, 0.16, 0.28, NOIR, 0.55, 0.8, 0);
    boite(p, 0.01, 0.06, 0.1, ECRAN, 0.525, 0.82, 0);
    // la caméra embarquée sur la prise d'air, les bouches des pontons, le volet mobile de l'aileron arrière
    boite(p, 0.14, 0.06, 0.22, NOIR, -0.3, 1.2, 0);
    for (const c of [1, -1]) boite(p, 0.03, 0.26, 0.3, NOIR, 0.46, 0.4, c * 0.62);
    boite(p, 0.2, 0.04, 0.98, couleur, -2.68, 1.05, 0, 0.5);
    // le diffuseur : quelques ailettes sous l'arrière
    for (const z of [-0.45, -0.15, 0.15, 0.45]) boite(p, 0.45, 0.16, 0.025, CARBONE, -2.3, 0.2, z, -0.3);
  }

  // toutes les pièces fixes de la voiture, en une seule géométrie ; detaille : la voiture du joueur
  function geometrieCorps(couleur, detaille) {
    const p = paquet();
    // la coque, le nez, le capot moteur et la prise d'air au-dessus du pilote
    boite(p, 2.6, 0.5, 0.8, couleur, 0.1, 0.45, 0);
    boite(p, 1.7, 0.26, 0.36, couleur, 2.2, 0.33, 0, -0.08);
    boite(p, 1.8, 0.42, 0.55, couleur, -1.3, 0.62, 0);
    boite(p, 0.5, 0.35, 0.3, couleur, -0.35, 1.0, 0);
    // les pontons
    boite(p, 1.7, 0.4, 0.45, couleur, -0.4, 0.38, 0.62);
    boite(p, 1.7, 0.4, 0.45, couleur, -0.4, 0.38, -0.62);
    // le fond plat
    boite(p, 3.6, 0.05, 1.5, CARBONE, -0.4, 0.12, 0);
    // l'aileron avant et ses dérives
    boite(p, 0.5, 0.05, 1.95, CARBONE, 3.0, 0.14, 0);
    boite(p, 0.55, 0.22, 0.04, CARBONE, 3.0, 0.22, 0.97);
    boite(p, 0.55, 0.22, 0.04, CARBONE, 3.0, 0.22, -0.97);
    // l'aileron arrière, ses dérives et son support
    boite(p, 0.45, 0.06, 1.0, CARBONE, -2.45, 0.98, 0);
    boite(p, 0.4, 0.06, 1.0, couleur, -2.4, 0.84, 0);
    boite(p, 0.6, 0.65, 0.04, CARBONE, -2.4, 0.75, 0.52);
    boite(p, 0.6, 0.65, 0.04, CARBONE, -2.4, 0.75, -0.52);
    boite(p, 0.12, 0.45, 0.06, CARBONE, -2.3, 0.62, 0);
    // le halo (un arceau devant et au-dessus de la tête, posé sur un pilier) ; même orientation qu'au tour 3
    const [hx, hr] = R.HALO;
    const halo = new THREE.TorusGeometry(hr, R.HALO_EPAISSEUR, 6, 14, Math.PI);
    halo.rotateZ(-Math.PI / 2);
    halo.rotateX(-Math.PI / 2);
    halo.translate(hx, 1.02, 0);
    ajouter(p, halo, CARBONE);
    boite(p, 0.04, 0.3, 0.035, CARBONE, hx + hr + 0.01, 0.86, 0);
    // les bras de suspension, de la coque aux roues
    boite(p, 0.08, 0.04, 1.5, CARBONE, R.CG_AVANT, 0.36, 0);
    boite(p, 0.08, 0.04, 1.4, CARBONE, R.CG_AVANT - R.EMPATTEMENT, 0.4, 0);
    if (detaille) details(p, couleur);
    return geometrie(p);
  }

  // une roue : le pneu et un rayon de jante clair (on voit la roue tourner), fusionnés
  function geometrieRoue(rayon, largeur) {
    const p = paquet();
    const pneu = new THREE.CylinderGeometry(rayon, rayon, largeur, 14);
    pneu.rotateX(Math.PI / 2);
    ajouter(p, pneu, NOIR);
    boite(p, rayon * 1.3, rayon * 0.25, largeur + 0.02, JANTE, 0, 0, 0);
    return geometrie(p);
  }

  // une roue dans deux groupes : le pivot (braquage) et la roue qui tourne sur son axe
  function roue(rayon, largeur, x, z, avant, materiau = materiauSommets) {
    const pivot = new THREE.Group();
    pivot.position.set(x, rayon, z);
    const tourne = new THREE.Mesh(geometrieRoue(rayon, largeur), materiau);
    pivot.add(tourne);
    return { pivot, tourne, avant };
  }

  // couleur : la couleur de l'écurie ; detaille : la voiture du joueur, avec plus de détails (les autres restent légères) ;
  // materiaux (facultatif, le fantôme) : { corps, casque } à la place des matériaux partagés ;
  // renvoie { groupe, roues, tete, corps, couleur, detaille }
  function creer(couleur, detaille, materiaux) {
    if (!materiauSommets) {
      materiauSommets = new THREE.MeshLambertMaterial({ vertexColors: true });
      materiauCasque = new THREE.MeshLambertMaterial({ color: CASQUE });
    }
    const matCorps = materiaux ? materiaux.corps : materiauSommets, matCasque = materiaux ? materiaux.casque : materiauCasque;
    const groupe = new THREE.Group();
    const corps = new THREE.Mesh(geometrieCorps(couleur, detaille), matCorps);
    groupe.add(corps);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), matCasque);
    tete.position.set(0.2, 0.85, 0);
    groupe.add(tete);
    // les roues : l'avant à CG_AVANT devant le centre, l'arrière à l'empattement derrière
    const xa = R.CG_AVANT, xr = R.CG_AVANT - R.EMPATTEMENT;
    const roues = [
      roue(0.33, 0.36, xa, 0.85, true, matCorps), roue(0.33, 0.36, xa, -0.85, true, matCorps),
      roue(0.35, 0.42, xr, 0.8, false, matCorps), roue(0.35, 0.42, xr, -0.8, false, matCorps),
    ];
    for (const r of roues) groupe.add(r.pivot);
    return { groupe, roues, tete, corps, couleur, detaille: !!detaille };
  }

  // le fantôme du meilleur tour (fantome.js) : la même voiture légère, d'une couleur neutre et légèrement transparente,
  // avec ses propres matériaux (ceux des voitures sont partagés et opaques) ; 6 appels de dessin de plus quand il est visible.
  // Il n'écrit pas dans le tampon de profondeur : la vraie voiture reste visible à travers lui
  function creerFantome(couleur, opacite) {
    const options = { transparent: true, opacity: opacite, depthWrite: false };
    const materiaux = { corps: new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true }, options)), casque: new THREE.MeshLambertMaterial(Object.assign({ color: couleur }, options)) };
    const m = creer(couleur, false, materiaux);
    m.groupe.visible = false;
    return m;
  }

  // le panneau de réglage change l'épaisseur du halo : on refait la géométrie du corps
  function majHalo(modele) {
    modele.corps.geometry.dispose();
    modele.corps.geometry = geometrieCorps(modele.couleur, modele.detaille);
  }

  // les triangles d'une voiture
  function triangles(modele) {
    let n = 0;
    modele.groupe.traverse(o => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    return n;
  }

  // les appels de dessin d'une voiture (un maillage visible = un appel)
  function appels(modele) {
    let n = 0;
    modele.groupe.traverse(o => { if (o.isMesh && o.visible) n++; });
    return n;
  }

  // place le modèle à l'état affiché (x, z, cap) ; v : la voiture de physique.js (braquage et roues)
  function placer(modele, etat, v) {
    modele.groupe.position.set(etat.x, 0, etat.z);
    modele.groupe.rotation.y = -etat.cap;   // rotation.y > 0 tourne +x vers -z ; notre cap > 0 tourne vers +z
    for (const r of modele.roues) {
      if (r.avant) r.pivot.rotation.y = -v.braquage;
      r.tourne.rotation.z = -v.rotationRoues;
    }
  }

  return { creer, creerFantome, placer, majHalo, triangles, appels };
})();
