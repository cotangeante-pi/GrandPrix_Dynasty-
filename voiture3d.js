// La F1 en 3D, faite par le code avec peu de triangles. Toutes les voitures ont ce modèle, avec la couleur de leur écurie.
// Repère du modèle : x vers l'avant, y vers le haut, z vers la droite (comme la voiture de physique.js).
// Pour 20 voitures, chaque voiture coûte peu d'appels de dessin : toutes les pièces fixes sont fusionnées en une seule
// géométrie (les couleurs sont portées par les sommets), le casque est à part (caché en vue cockpit), et chaque
// roue est une géométrie (pneu et jante fusionnés) qui tourne seule. Total : 6 appels par voiture.
// La voiture du joueur a des détails en plus (aileron, suspensions, rétroviseurs, volant), dans la même géométrie du corps.
const VOITURE3D = (function () {
  const R = REGLAGES;
  const NOIR = 0x18191c, CARBONE = 0x2a2c31, COULEUR_CASQUE = 0xf2c230, JANTE = 0xb8bcc4, MIROIR = 0xc9d4de, ECRAN = 0x3fd0ff;   // (COULEUR_CASQUE : le casque d'avant l'atlas ; CASQUE est le module casque.js)
  let materiauSommets = null, materiauCasque = null;   // partagés par toutes les voitures
  // l'atlas des casques (casque.js) : une case par casque dessinée une fois dans un canvas, UNE texture et UN matériau pour
  // toutes les têtes ; chaque tête a sa case par ses UV. Sans atlas (pages sans pilotes), le casque jaune d'avant
  let atlas = null;   // { canvas, ctx, texture, materiau, casques, colonnes, lignes, t }
  function dessinerCase(i, casque) {
    const x = (i % atlas.colonnes) * atlas.t, y = Math.floor(i / atlas.colonnes) * atlas.t, t = atlas.t;
    CASQUE.dessiner(atlas.ctx, x, y, t, casque);
    // la visière, sombre, devant (le milieu de la case fait face à l'avant de la voiture sur la sphère de Three.js)
    atlas.ctx.fillStyle = 'rgba(20, 22, 28, 0.9)';
    atlas.ctx.fillRect(x + t * 0.3, y + t * 0.36, t * 0.4, t * 0.2);
  }

  // les casques des voitures de la page, dans l'ordre des voitures (le même indice que celui passé à creer)
  function preparerCasques(casques) {
    const n = Math.max(1, casques.length), colonnes = Math.ceil(Math.sqrt(n)), lignes = Math.ceil(n / colonnes), t = R.CASQUE_ATLAS_CASE;
    const canvas = document.createElement('canvas');
    canvas.width = colonnes * t; canvas.height = lignes * t;
    const texture = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace !== undefined) texture.colorSpace = THREE.SRGBColorSpace;
    atlas = { canvas, ctx: canvas.getContext('2d'), texture, materiau: new THREE.MeshLambertMaterial({ map: texture }), casques: casques.slice(), colonnes, lignes, t };
    casques.forEach((c, i) => dessinerCase(i, c));
    texture.needsUpdate = true;
  }

  // le casque i a changé (l'éditeur) : sa case est redessinée, la texture renvoyée
  function majCasque(i, casque) {
    if (!atlas || i < 0 || i >= atlas.casques.length) return;
    atlas.casques[i] = casque;
    dessinerCase(i, casque);
    atlas.texture.needsUpdate = true;
  }

  // la sphère d'une tête, ses UV ramenés dans la case i de l'atlas (le haut de la case = le sommet du casque)
  function geometrieTete(i, rayon, segments) {
    const g = new THREE.SphereGeometry(rayon, segments[0], segments[1]);
    if (!atlas) return g;
    const uv = g.attributes.uv, col = i % atlas.colonnes, lig = Math.floor(i / atlas.colonnes);
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (col + uv.getX(k)) / atlas.colonnes, (atlas.lignes - lig - 1 + uv.getY(k)) / atlas.lignes);
    uv.needsUpdate = true;
    return g;
  }

  // l'aperçu du casque i qui tourne dans l'éditeur : un petit rendu à part sur le canvas donné (la même texture)
  let apercu = null;
  function apercuCasque(canvas, i) {
    if (!atlas) return;
    if (!apercu) {
      const rendu = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, R.PIXEL_RATIO_MAX));
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
      camera.position.set(0, 0.6, 3.2); camera.lookAt(0, 0, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.9));
      const soleil = new THREE.DirectionalLight(0xffffff, 0.8); soleil.position.set(2, 3, 2); scene.add(soleil);
      apercu = { rendu, scene, camera, tete: null, angle: 0 };
    }
    if (apercu.tete) { apercu.scene.remove(apercu.tete); apercu.tete.geometry.dispose(); }
    apercu.tete = new THREE.Mesh(geometrieTete(i, 1, [32, 20]), atlas.materiau);
    apercu.scene.add(apercu.tete);
  }
  function tournerApercu(dt) {
    if (!apercu || !apercu.tete) return;
    apercu.angle += R.CASQUE_APERCU_VITESSE * dt;
    apercu.tete.rotation.y = apercu.angle;
    apercu.rendu.render(apercu.scene, apercu.camera);
  }

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

  // la voiture vue de loin (scene3d.js) : la coque, les pontons, les ailerons et quatre roues en boîtes, d'une seule pièce ; la
  // coque est blanche, la couleur de l'écurie vient de l'instance (toutes les voitures lointaines en un seul appel de dessin)
  function formeLointaine() {
    const p = paquet(), B = 0xffffff, xa = R.CG_AVANT, xr = R.CG_AVANT - R.EMPATTEMENT;
    boite(p, 2.6, 0.5, 0.8, B, 0.1, 0.45, 0); boite(p, 1.7, 0.26, 0.36, B, 2.2, 0.33, 0); boite(p, 1.8, 0.42, 0.55, B, -1.3, 0.62, 0);
    boite(p, 1.7, 0.4, 0.45, B, -0.4, 0.38, 0.62); boite(p, 1.7, 0.4, 0.45, B, -0.4, 0.38, -0.62);
    boite(p, 0.5, 0.05, 1.95, CARBONE, 3.0, 0.14, 0); boite(p, 0.45, 0.06, 1.0, CARBONE, -2.45, 0.98, 0); boite(p, 0.12, 0.45, 0.06, CARBONE, -2.3, 0.62, 0);
    for (const [x, z, r] of [[xa, 0.85, 0.33], [xa, -0.85, 0.33], [xr, 0.8, 0.35], [xr, -0.8, 0.35]]) boite(p, 2 * r, 2 * r, 0.38, NOIR, x, r, z);
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
  // casque (facultatif) : l'indice de la case de la voiture dans l'atlas des casques (preparerCasques)
  function creer(couleur, detaille, materiaux, casque) {
    if (!materiauSommets) {
      materiauSommets = new THREE.MeshLambertMaterial({ vertexColors: true });
      materiauCasque = new THREE.MeshLambertMaterial({ color: COULEUR_CASQUE });
    }
    const matCorps = materiaux ? materiaux.corps : materiauSommets, matCasque = materiaux ? materiaux.casque : (atlas ? atlas.materiau : materiauCasque);
    const groupe = new THREE.Group();
    const corps = new THREE.Mesh(geometrieCorps(couleur, detaille), matCorps);
    groupe.add(corps);
    const tete = new THREE.Mesh(materiaux ? new THREE.SphereGeometry(0.17, 10, 8) : geometrieTete(casque === undefined ? 0 : casque, 0.17, [10, 8]), matCasque);
    tete.position.set(0.2, 0.85, 0);
    groupe.add(tete);
    // les roues : l'avant à CG_AVANT devant le centre, l'arrière à l'empattement derrière
    const xa = R.CG_AVANT, xr = R.CG_AVANT - R.EMPATTEMENT;
    const roues = [
      roue(0.33, 0.36, xa, 0.85, true, matCorps), roue(0.33, 0.36, xa, -0.85, true, matCorps),
      roue(0.35, 0.42, xr, 0.8, false, matCorps), roue(0.35, 0.42, xr, -0.8, false, matCorps),
    ];
    for (const r of roues) groupe.add(r.pivot);
    // une vraie voiture (pas le fantôme) peut être dessinée de loin en forme simple (scene3d.js : formeLointaine, toutes en un appel)
    if (!materiaux) groupe.userData.lointaine = { couleur: new THREE.Color(couleur) };
    return { groupe, roues, tete, corps, couleur, detaille: !!detaille };
  }

  // le fantôme du meilleur tour (fantome.js) : la même voiture légère, toute d'une couleur neutre et légèrement transparente,
  // avec ses propres matériaux (ceux des voitures sont partagés et opaques) ; 6 appels de dessin de plus quand il est visible.
  // Il n'écrit pas dans le tampon de profondeur : la vraie voiture reste visible à travers lui
  function creerFantome(couleur, opacite) {
    const options = { transparent: true, opacity: opacite, depthWrite: false };
    // une seule couleur pour tout (les couleurs des sommets sont ignorées : ni carbone ni pneus noirs), c'est ce qui le distingue d'une vraie voiture
    const materiaux = { corps: new THREE.MeshLambertMaterial(Object.assign({ color: couleur }, options)), casque: new THREE.MeshLambertMaterial(Object.assign({ color: couleur }, options)) };
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
    // (le pont de Suzuko : la voiture suit la hauteur de la route de son échantillon, SCENE3D.relief ; ailleurs, 0)
    const rel = typeof SCENE3D !== 'undefined' ? SCENE3D.relief : null;
    modele.groupe.position.set(etat.x, rel && v && v.piste ? rel[v.piste.indice] : 0, etat.z);
    modele.groupe.rotation.y = -etat.cap;   // rotation.y > 0 tourne +x vers -z ; notre cap > 0 tourne vers +z
    for (const r of modele.roues) {
      if (r.avant) r.pivot.rotation.y = -v.braquage;
      r.tourne.rotation.z = -v.rotationRoues;
    }
  }

  // le volant en vue cockpit (CLAUDE.md « Le casque du pilote ») : une jante, un moyeu, un petit écran (rapport et vitesse, dessinés
  // dans un canvas) et les deux gants aux couleurs et au motif du casque du joueur ; matériaux sans lumière, dessinés par-dessus tout
  // (le volant est accroché à la caméra, devant l'œil : il ne rentre jamais dans la carrosserie) ; 5 appels de dessin
  function creerVolant(casque) {
    const R = REGLAGES, r = R.VOLANT_RAYON, groupe = new THREE.Group(), volant = new THREE.Group();
    const sur = m => { m.depthTest = false; m.depthWrite = false; return m; };
    const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.renderOrder = 20; o.frustumCulled = false; return o; };
    const noir = sur(new THREE.MeshBasicMaterial({ color: R.VOLANT_COULEUR }));
    const jante = mesh(new THREE.TorusGeometry(r, r * 0.11, 8, 32), noir);
    const moyeu = mesh(new THREE.BoxGeometry(r * 1.5, r * 0.62, r * 0.12), noir);
    // le petit écran : le rapport et la vitesse (boite.js), redessinés quand ils changent
    const toile = document.createElement('canvas'); toile.width = 128; toile.height = 64;
    const texte2d = toile.getContext('2d'), tex = new THREE.CanvasTexture(toile);
    if (THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    const ecran = mesh(new THREE.PlaneGeometry(r * 1.2, r * 0.5), sur(new THREE.MeshBasicMaterial({ map: tex })));
    ecran.position.z = r * 0.07;
    // les gants : deux blocs sur la jante, à 3 h et 9 h, une seule géométrie, la texture du casque (son motif et ses couleurs)
    const tg = document.createElement('canvas'); tg.width = tg.height = 64;
    CASQUE.dessiner(tg.getContext('2d'), 0, 0, 64, casque);
    const texGant = new THREE.CanvasTexture(tg);
    if (THREE.SRGBColorSpace !== undefined) texGant.colorSpace = THREE.SRGBColorSpace;
    const gGant = new THREE.BoxGeometry(r * 0.42, r * 0.62, r * 0.3), mGant = sur(new THREE.MeshBasicMaterial({ map: texGant }));
    const gauche = mesh(gGant, mGant), droit = mesh(gGant, mGant);
    gauche.position.set(-r, -r * 0.08, r * 0.05); droit.position.set(r, -r * 0.08, r * 0.05);
    volant.add(jante, moyeu, ecran, gauche, droit);
    groupe.add(volant);
    let dernier = '';
    function majEcran(rapport, kmh) {
      const k = rapport + ':' + kmh;
      if (k === dernier) return;
      dernier = k;
      texte2d.fillStyle = '#' + R.VOLANT_ECRAN.toString(16).padStart(6, '0'); texte2d.fillRect(0, 0, 128, 64);
      texte2d.fillStyle = '#7dff9a'; texte2d.textBaseline = 'middle';
      texte2d.font = 'bold 40px monospace'; texte2d.textAlign = 'left'; texte2d.fillText(String(rapport), 10, 34);
      texte2d.font = 'bold 30px monospace'; texte2d.textAlign = 'right'; texte2d.fillText(String(kmh), 120, 34);
      tex.needsUpdate = true;
    }
    function majGants(c) {
      const ctx = tg.getContext('2d'); ctx.clearRect(0, 0, 64, 64); CASQUE.dessiner(ctx, 0, 0, 64, c); texGant.needsUpdate = true;
    }
    return { groupe, volant, majEcran, majGants, get texte() { return dernier; } };
  }

  // la pose du volant devant la caméra (champ vertical fov, degrés) et son angle ; calcul pur : { y, z, angle, haut } (haut : le plus
  // haut point du volant, en part de la demi-hauteur de l'image, < 0 = sous le milieu) ; braquage > 0 (à droite) → angle < 0 (sens horaire)
  function poseVolant(fov, braquage) {
    const R = REGLAGES, d = R.VOLANT_DISTANCE, r = R.VOLANT_RAYON, bas = d * Math.tan(fov * Math.PI / 360);
    let y = -bas + r * R.VOLANT_DEPASSE;
    const plafond = -bas * R.VOLANT_MARGE_HAUT - r * 1.2;   // (la jante tourne : son plus haut point est à r au plus, les gants un peu plus)
    if (y > plafond) y = plafond;
    return { y, z: -d, angle: -braquage * R.VOLANT_FACTEUR, haut: (y + r * 1.2) / bas };
  }

  return { creerVolant, poseVolant, creer, creerFantome, formeLointaine, placer, majHalo, triangles, appels, preparerCasques, majCasque, apercuCasque, tournerApercu, get atlas() { return atlas; } };
})();
