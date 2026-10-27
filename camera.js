// Les caméras. Elles ne touchent qu'à la caméra Three.js, jamais à l'état du jeu.
// Course (C passe de l'une à l'autre) : derriere (par défaut), cockpit, tele.
// Survol (?camera=…) : auto (fait le tour en hauteur), libre (souris et clavier), dessus, virage, vitrine (la voiture de près).
const CAMERA = (function () {
  const R = REGLAGES;
  const COURSE = ['derriere', 'cockpit', 'tele'];
  let cam = null, mode = 'derriere', circuit = null;
  let centre = null, demiTaille = 0, angle = 0;
  const libre = { x: 0, y: 0, z: 0, lacet: 0, tangage: 0 };
  const suiviDerriere = { cap: null, hauteur: 0 };
  const suiviSecond = { cap: null, hauteur: 0 };   // l'écran partagé : le suivi « derrière » de la seconde caméra (joueur 2)
  let postesTele = [];
  let regie = null, tempsTele = 0, planTele = null;   // la régie télé (regie.js) et son dernier plan
  const touches = new Set();

  function init(camera, c, modeDemande) {
    cam = camera;
    circuit = c;
    mode = ['auto', 'libre', 'dessus', 'virage', 'vitrine', 'cockpit', 'tele'].includes(modeDemande) ? modeDemande : 'derriere';
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < c.nb; i++) { xmin = Math.min(xmin, c.x[i]); xmax = Math.max(xmax, c.x[i]); zmin = Math.min(zmin, c.z[i]); zmax = Math.max(zmax, c.z[i]); }
    centre = { x: (xmin + xmax) / 2, z: (zmin + zmax) / 2, l: xmax - xmin, p: zmax - zmin };
    demiTaille = Math.max(xmax - xmin, zmax - zmin) / 2;

    // les caméras télé : au bord de la piste, derrière la barrière, un côté puis l'autre
    postesTele = [];
    const n = Math.max(1, Math.round(c.longueur / R.TELE_ESPACEMENT));
    for (let k = 0; k < n; k++) {
      const i = Math.round(k * c.nb / n) % c.nb, cote = k % 2 ? 1 : -1;
      const d = cote * (c.largeur / 2 + R.DISTANCE_BARRIERE + R.TELE_RECUL);
      postesTele.push({ x: c.x[i] + c.nx[i] * d, z: c.z[i] + c.nz[i] * d });
    }
    // la réalisation télé (regie.js) : les vraies caméras du décor, l'hélicoptère, et la régie qui choisit le plan ; les obstacles
    // sont les boîtes du décor (scene3d.js l'a déjà construit) ; sans regie.js, les anciens postes ci-dessus
    regie = typeof REGIE !== 'undefined' ? REGIE.creer(c, REGIE.postes(c), typeof SCENE3D !== 'undefined' && SCENE3D.decor ? REGIE.obstacles(SCENE3D.decor.objets) : []) : null;
    tempsTele = 0;

    if (mode === 'dessus') placerDessus();
    if (mode === 'virage') placerVirage();
    if (mode === 'libre') {
      // on part d'en haut, au-dessus du bord du circuit, en regardant le centre
      Object.assign(libre, { x: centre.x, y: R.CAMERA_AUTO_HAUTEUR / 2, z: centre.z + demiTaille, lacet: 0, tangage: -0.5 });
      brancherCommandes();
    }
  }

  // C : la caméra de course suivante
  function suivante() {
    if (!COURSE.includes(mode)) return mode;
    mode = COURSE[(COURSE.indexOf(mode) + 1) % COURSE.length];
    suiviDerriere.cap = null;
    return mode;
  }

  // une caméra de course imposée (la vue télé après l'arrivée du joueur, puis celle d'avant)
  function forcer(m) {
    if (COURSE.includes(m)) { mode = m; suiviDerriere.cap = null; }
  }

  function regler(champ, pres) {
    if (cam.fov !== champ || cam.near !== pres) { cam.fov = champ; cam.near = pres; cam.updateProjectionMatrix(); }
  }

  // la grille vue d'en haut, avant les feux (CLAUDE.md « L'interface ») : voitures = [{ x, z, cap }] ; a de 0 à 1 (le temps du survol) ;
  // la caméra passe au-dessus de la grille, de la tête à la queue, en regardant vers le bas, les voitures pointées vers le haut de
  // l'image ; calcul pur : { x, y, z, vise, haut } (haut : la direction du haut de l'image)
  function poseGrille(voitures, a) {
    const n = voitures.length, fx = Math.cos(voitures[0].cap), fz = Math.sin(voitures[0].cap);
    let cx = 0, cz = 0;
    for (const v of voitures) { cx += v.x / n; cz += v.z / n; }
    let avant = 0, arriere = 0;
    for (const v of voitures) { const s = (v.x - cx) * fx + (v.z - cz) * fz; avant = Math.max(avant, s); arriere = Math.min(arriere, s); }
    const s = avant + (arriere - avant) * Math.max(0, Math.min(1, a));
    const x = cx + fx * s, z = cz + fz * s;
    return { x: x - fx * R.GRILLE_RECUL, y: R.GRILLE_HAUTEUR, z: z - fz * R.GRILLE_RECUL, vise: { x: x + fx * R.GRILLE_VISEE, y: 0, z: z + fz * R.GRILLE_VISEE }, haut: { x: fx, z: fz } };
  }

  // applique la pose de la grille à la caméra de course
  function grille(voitures, a) {
    const p = poseGrille(voitures, a);
    regler(R.GRILLE_CHAMP, 0.5);
    cam.up.set(p.haut.x, 0, p.haut.z);
    cam.position.set(p.x, p.y, p.z);
    cam.lookAt(p.vise.x, p.vise.y, p.vise.z);
    cam.up.set(0, 1, 0);
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
  function placerVirage() {
    const c = circuit;
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

  // derrière la voiture, à distance fixe : seul l'angle autour de la voiture suit le cap avec un léger retard
  // (on sent les virages), et la hauteur est un peu lissée. Un ressort sur la position traînerait derrière la voiture
  // d'autant plus qu'elle va vite.
  // suivi : { cap, hauteur } lissés ; renvoie la position de la caméra et le point visé (calcul pur, testé)
  function poseDerriere(etat, u, suivi, dt) {
    const [recul, haut] = R.CAMERA_DERRIERE;
    if (suivi.cap === null) { suivi.cap = etat.cap; suivi.hauteur = haut; }
    const ecart = Math.atan2(Math.sin(etat.cap - suivi.cap), Math.cos(etat.cap - suivi.cap));
    suivi.cap += ecart * (1 - Math.exp(-R.CAMERA_SUIVI_CAP * dt));
    suivi.hauteur += (haut - suivi.hauteur) * (1 - Math.exp(-R.CAMERA_SUIVI_HAUTEUR * dt));
    const vitesse = Math.min(1, Math.max(0, u) / 90);
    const d = recul + R.CAMERA_RECUL_VITESSE * vitesse;
    const fx = Math.cos(suivi.cap), fz = Math.sin(suivi.cap);
    return {
      x: etat.x - fx * d, y: suivi.hauteur, z: etat.z - fz * d,
      vise: { x: etat.x + Math.cos(etat.cap) * 4, y: 1, z: etat.z + Math.sin(etat.cap) * 4 },
      champ: (champBase === null ? R.CAMERA_CHAMP[0] : champBase) + R.CAMERA_CHAMP[1] * vitesse,
    };
  }
  // le champ de vision de base derrière la voiture : null = CAMERA_CHAMP[0] ; l'écran partagé côte à côte le change (DEUX_FOV_COTE)
  let champBase = null;
  function reglerChampBase(c) { champBase = typeof c === 'number' ? c : null; }

  // la caméra embarquée : devant le halo (ni pilier ni arceau dans l'image), au-dessus du pilote, elle regarde la piste
  // par-dessus le nez ; renvoie la position et le point visé (calcul pur, testé)
  function poseCockpit(etat) {
    const [av, haut] = R.CAMERA_COCKPIT;
    const fx = Math.cos(etat.cap), fz = Math.sin(etat.cap);
    return {
      x: etat.x + fx * av, y: haut, z: etat.z + fz * av,
      vise: { x: etat.x + fx * 30, y: haut - R.CAMERA_COCKPIT_VISEE, z: etat.z + fz * 30 },
    };
  }

  // la hauteur de la route sous la voiture (le pont de Suzuko : SCENE3D.relief ; 0 ailleurs) : la caméra monte avec elle
  function hauteurRoute(v) {
    const rel = typeof SCENE3D !== 'undefined' ? SCENE3D.relief : null;
    return rel && v && v.piste ? rel[v.piste.indice] : 0;
  }

  function suivreDerriere(etat, v, dt) {
    const p = poseDerriere(etat, v.u, suiviDerriere, dt), h = hauteurRoute(v);
    p.y += h; p.vise.y += h;
    regler(p.champ, 0.5);
    cam.up.set(0, 1, 0);
    cam.position.set(p.x, p.y, p.z);
    cam.lookAt(p.vise.x, p.vise.y, p.vise.z);
  }

  // l'écran partagé (mode 2 joueurs) : la seconde caméra c, toujours derrière sa voiture (etat, v), avec son propre suivi
  function majSeconde(dt, c, etat, v) {
    dt = Math.min(dt, 0.1);
    const p = poseDerriere(etat, v.u, suiviSecond, dt), h = hauteurRoute(v);
    p.y += h; p.vise.y += h;
    if (c.fov !== p.champ || c.near !== 0.5) { c.fov = p.champ; c.near = 0.5; c.updateProjectionMatrix(); }
    c.up.set(0, 1, 0);
    c.position.set(p.x, p.y, p.z);
    c.lookAt(p.vise.x, p.vise.y, p.vise.z);
  }

  // dt : le temps de l'image (la caméra suit l'affichage, pas la physique) ; etat : la voiture affichée ; v : la voiture
  function maj(dt, etat, v) {
    dt = Math.min(dt, 0.1);
    if (mode === 'derriere') suivreDerriere(etat, v, dt);
    else if (mode === 'cockpit') {
      const p = poseCockpit(etat), h = hauteurRoute(v);
      p.y += h; p.vise.y += h;
      regler(R.CAMERA_COCKPIT_CHAMP, 0.05);
      cam.up.set(0, 1, 0);
      cam.position.set(p.x, p.y, p.z);
      cam.lookAt(p.vise.x, p.vise.y, p.vise.z);
    } else if (mode === 'tele' && regie) {
      // la régie : la caméra qui voit la voiture (un poste fixe qui tourne et zoome, ou l'hélicoptère), coupée franchement
      tempsTele += dt;
      const h = hauteurRoute(v), p = REGIE.choisir(regie, tempsTele, { x: etat.x, z: etat.z, cap: etat.cap, u: v ? v.u : 0, s: v && v.piste ? v.piste.s : null, d: v && v.piste ? v.piste.d : 0 });
      planTele = p;
      cam.fov = p.champ; cam.updateProjectionMatrix();   // (une coupe : pas de zoom glissé d'un plan à l'autre)
      cam.up.set(0, 1, 0);
      cam.position.set(p.x, p.y, p.z);
      cam.lookAt(etat.x, R.TELE_VISEE + h, etat.z);
    } else if (mode === 'tele') {
      // le poste le plus proche de la voiture la suit, en zoomant
      let p = postesTele[0], dmin = Infinity;
      for (const q of postesTele) { const d = Math.hypot(q.x - etat.x, q.z - etat.z); if (d < dmin) { dmin = d; p = q; } }
      const distance = Math.hypot(dmin, R.TELE_HAUTEUR);
      regler(Math.max(6, Math.min(50, 2 * Math.atan(R.TELE_CADRAGE / 2 / distance) * 180 / Math.PI)), 0.5);
      cam.up.set(0, 1, 0);
      cam.position.set(p.x, R.TELE_HAUTEUR, p.z);
      cam.lookAt(etat.x, 0.6 + hauteurRoute(v), etat.z);
    } else if (mode === 'vitrine') {
      // trois quarts avant, de près
      const f = { x: Math.cos(etat.cap), z: Math.sin(etat.cap) }, d = { x: -f.z, z: f.x };
      regler(40, 0.1);
      cam.position.set(etat.x + f.x * 6 + d.x * 5, 2.2, etat.z + f.z * 6 + d.z * 5);
      cam.lookAt(etat.x, 0.5, etat.z);
    } else if (mode === 'auto') {
      angle += R.CAMERA_AUTO_VITESSE * dt;
      const rayon = demiTaille * R.CAMERA_AUTO_RECUL;
      cam.position.set(centre.x + Math.cos(angle) * rayon, R.CAMERA_AUTO_HAUTEUR, centre.z + Math.sin(angle) * rayon);
      cam.lookAt(centre.x, 0, centre.z);
    } else if (mode === 'libre') {
      const avant = (touches.has('ArrowUp') || touches.has('KeyW') ? 1 : 0) - (touches.has('ArrowDown') || touches.has('KeyS') ? 1 : 0);
      const cote = (touches.has('ArrowRight') || touches.has('KeyD') ? 1 : 0) - (touches.has('ArrowLeft') || touches.has('KeyA') ? 1 : 0);
      const vit = Math.max(R.CAMERA_LIBRE_VITESSE_MIN, R.CAMERA_LIBRE_VITESSE * libre.y) * dt;
      const s = Math.sin(libre.lacet), c = Math.cos(libre.lacet);
      libre.x += (-s * avant + c * cote) * vit;
      libre.z += (-c * avant - s * cote) * vit;
      cam.position.set(libre.x, libre.y, libre.z);
      cam.rotation.order = 'YXZ';
      cam.rotation.set(libre.tangage, libre.lacet, 0);
    }
  }

  return {
    init, maj, majSeconde, suivante, forcer, poseDerriere, poseCockpit, reglerChampBase, poseGrille, grille,
    get mode() { return mode; },
    get regie() { return regie; },   // (tests : les postes, le plan)
    get planTele() { return planTele; },
    get conduite() { return mode !== 'libre'; },   // en caméra libre, les flèches déplacent la caméra, pas la voiture
    get position() { return cam ? { x: cam.position.x, y: cam.position.y, z: cam.position.z } : null; },
  };
})();
