// La célébration choisie par le joueur (CLAUDE.md « La personnalisation », tour 48c) : jouée à l'arrivée quand il gagne, et sur le
// podium quand il est premier. Le calcul pur (la liste, ce qui est permis, les déblocages par les exploits de carrière, le choix
// gardé avec le pilote du championnat : ch.pilotes[k].celebration) et l'animation 3D (CELEBRATION.jouer), qui ne fait que décaler
// le dessin de la voiture et poser quelques objets au-dessus : la physique, les temps et les places ne la voient jamais.
const CELEBRATION = (function () {
  const R = REGLAGES;

  function skins() {
    return (R.SKINS || []).filter(s => s.type === 'celebration').map(s => s.motif);
  }
  // toutes les célébrations : celles de départ, celles à débloquer, celles de la boutique
  function toutes() {
    return R.CELEBRATIONS.concat(Object.keys(R.CELEBRATION_DEBLOCAGES), skins());
  }
  function valide(c) {
    return typeof c === 'string' && toutes().includes(c);
  }
  // permise ? celles de départ toujours ; les autres si elles sont débloquées (debloquees) ou obtenues à la boutique (possedees)
  function permis(c, debloquees, possedees) {
    return R.CELEBRATIONS.includes(c) || (debloquees || []).includes(c) || (possedees || []).includes(c);
  }
  // les célébrations gagnées par les exploits de la carrière en cours (les mêmes faits que les motifs de casque)
  function conditionsRemplies(ch) {
    const f = CASQUE.faits(ch);
    return Object.keys(R.CELEBRATION_DEBLOCAGES).filter(c => f[R.CELEBRATION_DEBLOCAGES[c]]);
  }
  // ce qu'il faut pour une célébration pas encore permise, en mots
  function condition(c) {
    if (R.CELEBRATION_DEBLOCAGES[c]) return texte('deblocage_' + R.CELEBRATION_DEBLOCAGES[c]).replace('{n}', R.CASQUE_PODIUMS_DEBLOCAGE);
    return texte('skinBoutique');
  }
  // la célébration du pilote (sinon celle par défaut)
  function de(p) {
    return p && valide(p.celebration) ? p.celebration : R.CELEBRATION_DEFAUT;
  }
  // le joueur sans célébration (une ancienne sauvegarde) : celle par défaut ; renvoie le nombre donné
  function completer(ch) {
    if (!ch || !Array.isArray(ch.pilotes)) return 0;
    let n = 0;
    for (const p of ch.pilotes) if (p && p.humain && !valide(p.celebration)) { p.celebration = R.CELEBRATION_DEFAUT; n++; }
    return n;
  }

  // le décalage du dessin de la voiture à l'instant t (s) de la célébration nom : { rot (rad autour de la verticale), y (m), tangage (rad) }
  // (calcul pur : testé sans 3D ; toutes les célébrations reviennent à 0 au bout de chaque période)
  function decalage(nom, t) {
    const T = R.CELEBRATION_DUREE, f = ((t % T) + T) % T / T, s = Math.sin(f * Math.PI);
    if (nom === 'donuts') return { rot: f * 4 * Math.PI, y: 0, tangage: 0 };
    if (nom === 'toupie') return { rot: f * 6 * Math.PI, y: 0.6 * s, tangage: 0 };
    if (nom === 'saut') { const b = Math.abs(Math.sin(f * 3 * Math.PI)); return { rot: 0, y: 0.7 * b, tangage: -0.12 * b }; }
    return { rot: 0, y: 0, tangage: 0 };
  }

  // --- la 3D : les objets de la célébration (poing, drapeau, confettis, feu d'artifice, trophée), faits une fois par le code, posés sur
  // la voiture qui célèbre ; quelques appels de dessin, seulement pendant la célébration
  let objets = null, enCours = null;   // enCours : { modele, nom, t, rot, y, tangage, appliques }
  function creerObjets() {
    const g = new THREE.Group(), mat = c => new THREE.MeshLambertMaterial({ color: c });
    // le poing levé : un bras et un gant au-dessus du cockpit
    const poing = new THREE.Group();
    const bras = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.55, 0.09), mat(0xdfe3ea)); bras.position.y = 0.27; poing.add(bras);
    const gant = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), mat(0x222222)); gant.position.y = 0.6; poing.add(gant);
    poing.position.set(0.25, 0.85, 0.12);
    // le drapeau : un mât et une toile aux couleurs du pays (canvas)
    const drapeau = new THREE.Group();
    const place = (o, x, y, z) => { o.position.set(x, y, z); return o; };
    drapeau.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), mat(0xcccccc)), 0, 0.8, 0));
    const toile = document.createElement('canvas'); toile.width = 96; toile.height = 64;
    const texDrapeau = new THREE.CanvasTexture(toile);
    if (THREE.SRGBColorSpace !== undefined) texDrapeau.colorSpace = THREE.SRGBColorSpace;
    const tissu = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6, 8, 1), new THREE.MeshLambertMaterial({ map: texDrapeau, side: THREE.DoubleSide }));
    tissu.position.set(0, 1.3, 0.45); tissu.rotation.y = Math.PI / 2; drapeau.add(tissu);
    drapeau.position.set(0.2, 0.85, 0);
    // les confettis et le feu d'artifice : un nuage de points chacun (un appel de dessin), un petit tirage à lui (jamais hasard())
    const nuage = (n, taille) => {
      let s = 3; const alea = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), dir = new Float32Array(n * 3), c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        c.setHex(R.CEREMONIE_COULEURS[i % R.CEREMONIE_COULEURS.length]); col.set([c.r, c.g, c.b], i * 3);
        const a = alea() * 2 * Math.PI, b = alea() * Math.PI - Math.PI / 2;
        dir.set([Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)], i * 3);
        pos.set([(alea() - 0.5) * 6, alea() * 5, (alea() - 0.5) * 6], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: taille, vertexColors: true }));
      pts.frustumCulled = false; pts.userData.dir = dir; pts.userData.depart = pos.slice();
      return pts;
    };
    const confettis = nuage(300, 0.12), feux = nuage(360, 0.2);
    // le trophée : une coupe dorée qui tourne au-dessus de la voiture
    const trophee = new THREE.Group(), or = mat(0xd4af37);
    trophee.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.12, 0.45, 12), or), 0, 0.45, 0));
    trophee.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6), or), 0, 0.12, 0));
    trophee.add(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.35), or));
    trophee.position.set(0, 1.6, 0);
    g.add(poing, drapeau, confettis, feux, trophee);
    objets = { g, poing, drapeau, tissu, toile, texDrapeau, confettis, feux, trophee, pays: null };
  }

  function peindreDrapeau(pays) {
    if (objets.pays === pays) return;
    objets.pays = pays;
    const f = R.PAYS_COULEURS[pays] || R.PAYS_COULEURS.fr, ctx = objets.toile.getContext('2d'), h = 64 / f.length;
    f.forEach((c, i) => { ctx.fillStyle = '#' + c.toString(16).padStart(6, '0'); ctx.fillRect(0, i * h, 96, h + 1); });
    objets.texDrapeau.needsUpdate = true;
  }

  // la voiture modele commence (ou continue) la célébration nom ; pays : le drapeau ; rien si c'est déjà elle
  function commencer(modele, nom, pays) {
    if (typeof THREE === 'undefined' || !modele) return;
    if (enCours && enCours.modele === modele && enCours.nom === nom) return;
    arreter();
    if (!objets) creerObjets();
    peindreDrapeau(pays || 'fr');
    for (const k of ['poing', 'drapeau', 'confettis', 'feux', 'trophee']) objets[k].visible = false;
    const vus = { poing: ['poing'], drapeau: ['drapeau'], confettis: ['confettis'], feux: ['feux'], trophee: ['trophee'] }[nom] || [];
    for (const k of vus) objets[k].visible = true;
    modele.groupe.add(objets.g);
    enCours = { modele, nom, t: 0, appliques: null };
  }

  // chaque image : l'animation avance de dt ; le décalage d'avant est retiré (sauf si la voiture vient d'être replacée) puis le nouveau posé
  function maj(dt) {
    if (!enCours) return;
    const e = enCours, g = e.modele.groupe;
    e.t += dt;
    if (e.appliques) {   // (placer a pu remettre la voiture à sa place depuis : on ne retire que ce qui est encore là)
      if (g.rotation.y === e.appliques.rotFin) g.rotation.y -= e.appliques.rot;
      if (g.position.y === e.appliques.yFin) g.position.y -= e.appliques.y;
      if (g.rotation.z === e.appliques.tangageFin) g.rotation.z -= e.appliques.tangage;
    }
    const d = decalage(e.nom, e.t);
    g.rotation.y += d.rot; g.position.y += d.y; g.rotation.z += d.tangage;
    e.appliques = { rot: d.rot, y: d.y, tangage: d.tangage, rotFin: g.rotation.y, yFin: g.position.y, tangageFin: g.rotation.z };
    const T = R.CELEBRATION_DUREE, f = (e.t % T) / T;
    if (e.nom === 'poing') objets.poing.rotation.z = 0.35 * Math.sin(e.t * 9);
    if (e.nom === 'drapeau') { objets.drapeau.rotation.y = 0.4 * Math.sin(e.t * 2); const p = objets.tissu.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.08 * Math.sin(p.getX(i) * 6 + e.t * 8) * (p.getX(i) + 0.45)); p.needsUpdate = true; }
    if (e.nom === 'trophee') objets.trophee.rotation.y = e.t * 2;
    for (const k of ['confettis', 'feux']) {
      if (e.nom !== k) continue;
      const pts = objets[k], p = pts.geometry.attributes.position, a = p.array, dir = pts.userData.dir, dep = pts.userData.depart;
      for (let i = 0; i < p.count; i++) {
        if (k === 'confettis') { a[i * 3 + 1] = dep[i * 3 + 1] + 4 - ((e.t * 1.5 + dep[i * 3 + 1]) % 5); a[i * 3] = dep[i * 3] + 0.3 * Math.sin(e.t * 2 + i); a[i * 3 + 2] = dep[i * 3 + 2]; }
        else { const r = 4 * f; a[i * 3] = dir[i * 3] * r; a[i * 3 + 1] = 7 + dir[i * 3 + 1] * r - 2 * f * f; a[i * 3 + 2] = dir[i * 3 + 2] * r; }
      }
      p.needsUpdate = true;
    }
  }

  // la célébration s'arrête : la voiture retrouve sa place, les objets partent
  function arreter() {
    if (!enCours) return;
    const e = enCours, g = e.modele.groupe;
    if (e.appliques) {
      if (g.rotation.y === e.appliques.rotFin) g.rotation.y -= e.appliques.rot;
      if (g.position.y === e.appliques.yFin) g.position.y -= e.appliques.y;
      if (g.rotation.z === e.appliques.tangageFin) g.rotation.z -= e.appliques.tangage;
    }
    if (objets) g.remove(objets.g);
    enCours = null;
  }

  return { toutes, skins, valide, permis, conditionsRemplies, condition, de, completer, decalage, commencer, maj, arreter, get enCours() { return enCours; } };
})();
