// Les effets de conduite dessinés (tour 37) : la fumée des roues qui bloquent et de l'herbe, les étincelles des contacts.
// Ils suivent les faits de sensations.js (lus dans l'état des voitures, jamais écrits). Chaque effet est un seul
// InstancedMesh (un appel de dessin, aucun quand il est vide). Leur petit hasard a sa propre graine : il ne touche pas
// au hasard de la course. La simulation des particules est pure (testée sans écran) ; seul dessiner touche à Three.js.
const EFFETS3D = (function () {
  const R = REGLAGES;
  let scene = null, fumees = null, etincelles = null, etat = null;

  // l'état des effets : deux réserves de particules (les plus vieilles cèdent la place) et un tirage à graine
  function creer() {
    return { fumee: [], etincelle: [], graine: 12345, temps: 0 };
  }
  function tirer(e) {   // un nombre de 0 à 1 (Park et Miller : des produits exacts en double, le même tirage partout)
    e.graine = (e.graine * 16807) % 2147483647;
    return (e.graine - 1) / 2147483646;
  }
  function pousser(liste, max, p) { if (liste.length >= max) liste.shift(); liste.push(p); }

  // une voiture v (affichée à etat x, z, cap) avec ses faits f, pendant dt : ses fumées et ses étincelles
  function emettre(e, v, pos, f, dt) {
    const c = Math.cos(pos.cap), s = Math.sin(pos.cap), u = Math.abs(v.u);
    // la fumée : les roues avant qui bloquent ; la poussière : les quatre roues dans l'herbe
    for (const [force, avant, poussiere] of [[f.blocage > 0.5 ? f.blocage : 0, true, false], [f.herbe * Math.min(1, u / 25), false, true]]) {
      if (force <= 0) continue;
      let n = R.FUMEE_PAR_SECONDE * force * dt;
      while (n > 0) {
        if (n < 1 && tirer(e) > n) break;
        n -= 1;
        const cote = tirer(e) < 0.5 ? -1 : 1, recul = avant ? 1.6 : (tirer(e) < 0.5 ? 1.6 : -1.4);
        const vie = R.FUMEE_VIE[0] + (R.FUMEE_VIE[1] - R.FUMEE_VIE[0]) * tirer(e);
        pousser(e.fumee, R.FUMEE_MAX, {
          x: pos.x + c * recul - s * cote * R.SENSATIONS_DEMI_VOIE, y: 0.25, z: pos.z + s * recul + c * cote * R.SENSATIONS_DEMI_VOIE,
          vx: c * u * 0.25 + (tirer(e) - 0.5), vy: 0.6 + tirer(e) * 0.6, vz: s * u * 0.25 + (tirer(e) - 0.5),
          age: 0, vie, poussiere,
        });
      }
    }
    // les étincelles : une gerbe au contact (une voiture ou la barrière)
    const coup = Math.max(f.contact, f.choc);
    if (coup > 0) {
      const n = Math.round(R.ETINCELLES_PAR_CONTACT * (0.5 + 0.5 * coup));
      for (let k = 0; k < n; k++) {
        const a = tirer(e) * 2 * Math.PI, vit = 3 + 6 * tirer(e);
        pousser(e.etincelle, R.ETINCELLES_MAX, {
          x: pos.x, y: 0.35, z: pos.z,
          vx: c * u * 0.6 + Math.cos(a) * vit, vy: 1.5 + 3 * tirer(e), vz: s * u * 0.6 + Math.sin(a) * vit,
          age: 0, vie: R.ETINCELLE_VIE * (0.6 + 0.4 * tirer(e)),
        });
      }
    }
  }

  // le temps passe : les particules bougent (la fumée ralentit et monte, les étincelles retombent) et meurent
  function avancer(e, dt) {
    e.temps += dt;
    const freine = Math.exp(-2 * dt);
    for (const p of e.fumee) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx *= freine; p.vz *= freine; }
    for (const p of e.etincelle) { p.age += dt; p.x += p.vx * dt; p.y = Math.max(0.02, p.y + p.vy * dt); p.z += p.vz * dt; p.vy -= 9.81 * dt; }
    e.fumee = e.fumee.filter(p => p.age < p.vie);
    e.etincelle = e.etincelle.filter(p => p.age < p.vie);
  }

  // une image : chaque voiture proche de la caméra émet selon ses faits (SENSATIONS.de), puis tout avance.
  // voitures : [{ v, pos }] (pos : la voiture affichée) ; camera : { x, z } ou null
  function simuler(e, voitures, camera, dt) {
    if (SENSATIONS.actif) for (const { v, pos } of voitures) {
      if (camera && Math.hypot(pos.x - camera.x, pos.z - camera.z) > R.FUMEE_DISTANCE) continue;
      emettre(e, v, pos, SENSATIONS.de(v), dt);
    } else { e.fumee.length = 0; e.etincelle.length = 0; }
    avancer(e, dt);
  }

  // --- le dessin (Three.js) : deux InstancedMesh, cachés quand ils sont vides (aucun appel de dessin)
  function init(sc) {
    scene = sc;
    etat = creer();
    const m = (geo, couleur, opacite, nb, nom) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: opacite < 1, opacity: opacite, depthWrite: opacite >= 1 });
      const im = new THREE.InstancedMesh(geo, mat, nb);
      im.name = nom; im.frustumCulled = false; im.count = 0; im.visible = false;
      im.setColorAt(0, new THREE.Color(couleur));
      scene.add(im);
      return im;
    };
    fumees = m(new THREE.IcosahedronGeometry(0.5, 0), R.COULEUR_FUMEE, 0.35, R.FUMEE_MAX, 'effets-fumee');
    etincelles = m(new THREE.BoxGeometry(0.12, 0.12, 0.12), R.COULEUR_ETINCELLE, 1, R.ETINCELLES_MAX, 'effets-etincelles');
  }
  const matrice = typeof THREE !== 'undefined' ? new THREE.Matrix4() : null, cFumee = typeof THREE !== 'undefined' ? new THREE.Color() : null;
  function remplir(im, liste, taille, couleur) {
    let n = 0;
    for (const p of liste) {
      const k = taille(p);
      matrice.makeScale(k, k, k); matrice.setPosition(p.x, p.y, p.z);
      im.setMatrixAt(n, matrice);
      if (couleur) im.setColorAt(n, couleur(p));
      n++;
    }
    im.count = n; im.visible = n > 0;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  // à chaque image (principal.js, avant de dessiner)
  function maj(voitures, camera, dt) {
    if (!scene) return;
    simuler(etat, voitures, camera, Math.min(dt, 0.1));
    // la bouffée grossit puis s'efface en rétrécissant ; la poussière est couleur de terre
    remplir(fumees, etat.fumee, p => { const a = p.age / p.vie; return (0.5 + 2.2 * a) * (a < 0.75 ? 1 : (1 - a) * 4); },
      p => cFumee.setHex(p.poussiere ? R.COULEUR_POUSSIERE : R.COULEUR_FUMEE));
    remplir(etincelles, etat.etincelle, p => 1 - 0.6 * p.age / p.vie, p => cFumee.setHex(R.COULEUR_ETINCELLE));
  }

  return {
    creer, emettre, avancer, simuler, init, maj,
    get etat() { return etat; },
    get fumees() { return fumees; },
    get etincelles() { return etincelles; },
  };
})();
