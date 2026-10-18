// La F1 en 3D, faite par le code avec peu de triangles. Toutes les voitures ont ce modèle, avec la couleur de leur écurie.
// Repère du modèle : x vers l'avant, y vers le haut, z vers la droite (comme la voiture de physique.js).
// Pour 20 voitures, chaque voiture coûte peu d'appels de dessin : toutes les pièces fixes sont fusionnées en une seule
// géométrie (les couleurs sont portées par les sommets), le casque est à part (caché en vue cockpit), et chaque
// roue est une géométrie (pneu et jante fusionnés) qui tourne seule. Total : 6 appels par voiture.
const VOITURE3D = (function () {
  const R = REGLAGES;
  const NOIR = 0x18191c, CARBONE = 0x2a2c31, CASQUE = 0xf2c230, JANTE = 0xb8bcc4;
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

  function boite(p, l, h, pr, couleur, x, y, z, rotZ) {
    const g = new THREE.BoxGeometry(l, h, pr);
    if (rotZ) g.rotateZ(rotZ);
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

  // toutes les pièces fixes de la voiture, en une seule géométrie
  function geometrieCorps(couleur) {
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
    const halo = new THREE.TorusGeometry(0.34, R.HALO_EPAISSEUR, 6, 14, Math.PI);
    halo.rotateZ(-Math.PI / 2);
    halo.rotateX(-Math.PI / 2);
    halo.translate(0.25, 1.02, 0);
    ajouter(p, halo, CARBONE);
    boite(p, 0.04, 0.3, 0.035, CARBONE, 0.6, 0.86, 0);
    // les bras de suspension, de la coque aux roues
    boite(p, 0.08, 0.04, 1.5, CARBONE, R.CG_AVANT, 0.36, 0);
    boite(p, 0.08, 0.04, 1.4, CARBONE, R.CG_AVANT - R.EMPATTEMENT, 0.4, 0);
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
  function roue(rayon, largeur, x, z, avant) {
    const pivot = new THREE.Group();
    pivot.position.set(x, rayon, z);
    const tourne = new THREE.Mesh(geometrieRoue(rayon, largeur), materiauSommets);
    pivot.add(tourne);
    return { pivot, tourne, avant };
  }

  // couleur : la couleur de l'écurie ; renvoie { groupe, roues, tete, corps, couleur }
  function creer(couleur) {
    if (!materiauSommets) {
      materiauSommets = new THREE.MeshLambertMaterial({ vertexColors: true });
      materiauCasque = new THREE.MeshLambertMaterial({ color: CASQUE });
    }
    const groupe = new THREE.Group();
    const corps = new THREE.Mesh(geometrieCorps(couleur), materiauSommets);
    groupe.add(corps);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), materiauCasque);
    tete.position.set(0.2, 0.85, 0);
    groupe.add(tete);
    // les roues : l'avant à CG_AVANT devant le centre, l'arrière à l'empattement derrière
    const xa = R.CG_AVANT, xr = R.CG_AVANT - R.EMPATTEMENT;
    const roues = [
      roue(0.33, 0.36, xa, 0.85, true), roue(0.33, 0.36, xa, -0.85, true),
      roue(0.35, 0.42, xr, 0.8, false), roue(0.35, 0.42, xr, -0.8, false),
    ];
    for (const r of roues) groupe.add(r.pivot);
    return { groupe, roues, tete, corps, couleur };
  }

  // le panneau de réglage change l'épaisseur du halo : on refait la géométrie du corps
  function majHalo(modele) {
    modele.corps.geometry.dispose();
    modele.corps.geometry = geometrieCorps(modele.couleur);
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

  return { creer, placer, majHalo, triangles, appels };
})();
