// Le dessin de la météo (CLAUDE.md « La météo », Codeur 2) : il lit l'état calculé par meteo.js (Codeur 1) et ne change rien au jeu.
// Le contrat : METEO.etat(course) → { pluie: 0..1 (ce qui tombe), eau: 0..1 (la piste), ciel: 0..1 (la couverture) } ;
// METEO.prevision(ch, gp) → { type: 'sec' | 'nuageux' | 'risque' | 'pluie', risque: 0..100 }.
// - la pluie : des traits qui tombent autour de la caméra (un seul appel de dessin) ;
// - les gerbes derrière les voitures (un seul appel), selon leur vitesse et l'eau ;
// - la piste mouillée : plus sombre et brillante ;
// - le ciel couvert : le fond, le brouillard, la coupole du lieu et la lumière baissent vers le gris ;
// - les gouttes en vue cockpit, l'icône météo et le niveau d'eau près des pneus (l'interface HTML).
// Au sec (pluie, eau et ciel à 0), rien n'est dessiné et rien ne change : pas un pixel.
// Sans meteo.js (ou sans état), rien non plus. Les tests posent window.METEO_TEST (une fausse météo, jamais dans le jeu).
const METEO3D = (function () {
  const R = REGLAGES;
  let m = null;   // { scene, pluie, gouttes (positions), gerbes, route, routeSec, routeMouillee, base: { fond, brouillard, coupole, ambiance, soleil } }
  let dernier = null;

  function source() {
    if (typeof window !== 'undefined' && window.METEO_TEST) return window.METEO_TEST;
    return typeof METEO !== 'undefined' && METEO && typeof METEO.etat === 'function' ? METEO : null;
  }
  const borne = x => Math.max(0, Math.min(1, Number(x) || 0));
  // l'état de la météo de cette course, borné ; null sans météo
  function etat(course) {
    const M = source();
    if (!M || !course) return null;
    const e = M.etat(course);
    if (!e) return null;
    const eau = borne(e.eau);
    return { pluie: borne(e.pluie), eau, eauTrajectoire: e.eauTrajectoire === undefined ? eau : Math.min(eau, borne(e.eauTrajectoire)), ciel: borne(e.ciel) };
  }
  function prevision(ch, gp) {
    const M = source();
    return M && typeof M.prevision === 'function' ? M.prevision(ch, gp) : null;
  }
  // (un ciel à peine voilé, sous CIEL_VOILE, sans pluie ni eau : c'est le sec, rien ne change)
  const sec = e => !e || (e.pluie <= 0 && e.eau <= 0 && e.ciel <= R.CIEL_VOILE);

  // la trajectoire plus sèche (eauTrajectoire < eau) : une bande sur la ligne idéale (la carte des IA : trajectoire.ecart), faite à la
  // première pluie, moins mouillée que le reste de la route ; un appel de dessin, seulement sur piste mouillée
  function faireLigne(c, traj) {
    const pos = [], L = R.LIGNE_SECHE_LARGEUR / 2, y = R.LIGNE_SECHE_HAUTEUR;
    for (let i = 0; i < c.nb; i++) {
      const k = (i + 1) % c.nb, a = traj.ecart[i], b = traj.ecart[k];
      const p = (j, d) => [c.x[j] + c.nx[j] * d, y, c.z[j] + c.nz[j] * d];
      pos.push(...p(i, a - L), ...p(i, a + L), ...p(k, b - L), ...p(k, b - L), ...p(i, a + L), ...p(k, b + L));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const ligne = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: R.COULEUR_ROUTE, specular: 0x000000, shininess: R.ROUTE_MOUILLEE_BRILLANCE, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    ligne.name = 'meteo-ligne'; ligne.visible = false;
    return ligne;
  }

  // monde : ce que scene3d.js a construit et que la météo assombrit (la route, la coupole du ciel, les deux lumières)
  function init(scene, monde) {
    const N = R.PLUIE_GOUTTES, pos = new Float32Array(N * 6), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pluie = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: R.PLUIE_COULEUR, transparent: true, opacity: R.PLUIE_OPACITE, depthWrite: false }));
    pluie.name = 'meteo-pluie'; pluie.frustumCulled = false; pluie.visible = false;
    scene.add(pluie);
    // les gouttes : leur place autour de la caméra (x, y, z dans la boîte PLUIE_BOITE), tirées une fois (un hasard à elles, pas hasard())
    const [B, H] = R.PLUIE_BOITE, rnd = DECOR.tirage(R.DECOR_GRAINE + 7), gouttes = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) { gouttes[3 * k] = (rnd() * 2 - 1) * B; gouttes[3 * k + 1] = rnd() * H; gouttes[3 * k + 2] = (rnd() * 2 - 1) * B; }
    const gerbes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: R.GERBE_COULEUR, transparent: true, opacity: R.GERBE_OPACITE, depthWrite: false }), R.VOITURES_LOINTAINES_MAX);
    gerbes.name = 'meteo-gerbes'; gerbes.frustumCulled = false; gerbes.visible = false; gerbes.count = 0;
    scene.add(gerbes);
    const route = monde.route;
    m = {
      scene, pluie, gouttes, gerbes, route, routeSec: route ? route.material : null, routeMouillee: null, monde,
      base: { fond: scene.background ? scene.background.clone() : null, brouillard: scene.fog ? scene.fog.color.clone() : null,
        coupole: monde.coupole ? monde.coupole.material.color.clone() : null, ambiance: monde.ambiance ? monde.ambiance.intensity : 0, soleil: monde.soleil ? monde.soleil.intensity : 0 },
    };
    dernier = null;
  }

  // une image : e (etat ou null), camera (la caméra principale), voitures [{ x, z, cap, u }], dt (s), cockpit (vue cockpit)
  // circuit, trajectoire (facultatifs) : pour la ligne plus sèche
  function maj(e, camera, voitures, dt, cockpit, circuit, trajectoire) {
    if (!m) return;
    const rien = sec(e);
    if (rien && dernier === 'sec') { interfaceMeteo(e, false); return; }
    if (rien) { remettre(); dernier = 'sec'; interfaceMeteo(e, false); return; }
    dernier = 'meteo';
    // le ciel couvert
    // (le gris du ciel couvert garde la clarté du lieu : la nuit, un ciel couvert reste sombre)
    const c = e.ciel * R.CIEL_COUVERT_PART, gris = new THREE.Color(R.CIEL_COUVERT);
    if (m.base.fond) { const f = m.base.fond, l = 0.299 * f.r + 0.587 * f.g + 0.114 * f.b; gris.multiplyScalar(Math.min(1, R.CIEL_COUVERT_CLARTE * l + 0.08)); }
    if (m.base.fond) m.scene.background.copy(m.base.fond).lerp(gris, c);
    if (m.base.brouillard) m.scene.fog.color.copy(m.base.brouillard).lerp(gris, c);
    if (m.base.coupole) m.monde.coupole.material.color.copy(m.base.coupole).lerp(new THREE.Color(R.CIEL_COUVERT_COUPOLE), c);
    if (m.monde.ambiance) m.monde.ambiance.intensity = m.base.ambiance * (1 - R.CIEL_COUVERT_AMBIANCE * e.ciel);
    if (m.monde.soleil) m.monde.soleil.intensity = m.base.soleil * (1 - R.CIEL_COUVERT_SOLEIL * e.ciel);
    // la piste mouillée : plus sombre et brillante (un matériau à reflets, fait à la première goutte)
    if (m.route) {
      if (e.eau > 0) {
        if (!m.routeMouillee) m.routeMouillee = new THREE.MeshPhongMaterial({ color: R.COULEUR_ROUTE, specular: 0x000000, shininess: R.ROUTE_MOUILLEE_BRILLANCE });
        m.routeMouillee.color.set(R.COULEUR_ROUTE).lerp(new THREE.Color(R.COULEUR_ROUTE_MOUILLEE), e.eau);
        m.routeMouillee.specular.setScalar(R.ROUTE_MOUILLEE_REFLET * e.eau);
        m.route.material = m.routeMouillee;
      } else m.route.material = m.routeSec;
    }
    // la trajectoire plus sèche que le reste de la route
    const ecartLigne = e.eau - e.eauTrajectoire;
    if (ecartLigne > R.LIGNE_SECHE_ECART && circuit && trajectoire && !m.ligne) { m.ligne = faireLigne(circuit, trajectoire); m.scene.add(m.ligne); }
    if (m.ligne) {
      m.ligne.visible = ecartLigne > R.LIGNE_SECHE_ECART;
      if (m.ligne.visible) { m.ligne.material.color.set(R.COULEUR_ROUTE).lerp(new THREE.Color(R.COULEUR_ROUTE_MOUILLEE), e.eauTrajectoire); m.ligne.material.specular.setScalar(R.ROUTE_MOUILLEE_REFLET * e.eauTrajectoire); }
    }
    // la pluie qui tombe autour de la caméra
    const n = Math.round(R.PLUIE_GOUTTES * e.pluie);
    m.pluie.visible = n > 0;
    if (n > 0) {
      const [B, H] = R.PLUIE_BOITE, g = m.gouttes, p = m.pluie.geometry.attributes.position.array, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
      const chute = R.PLUIE_VITESSE * Math.min(dt, 0.1), L = R.PLUIE_LONGUEUR, vent = R.PLUIE_VENT;
      const ramener = (x, o) => o + ((((x - o + B) % (2 * B)) + 2 * B) % (2 * B)) - B;
      for (let k = 0; k < n; k++) {
        g[3 * k + 1] -= chute; if (g[3 * k + 1] < 0) g[3 * k + 1] += H;
        const x = ramener(g[3 * k] + cx, cx), z = ramener(g[3 * k + 2] + cz, cz), y = cy - H / 2 + g[3 * k + 1];
        p.set([x, y, z, x + vent, y - L, z], 6 * k);
      }
      m.pluie.geometry.setDrawRange(0, 2 * n);
      m.pluie.geometry.attributes.position.needsUpdate = true;
    }
    // les gerbes : derrière chaque voiture qui roule, plus grandes avec la vitesse et l'eau
    let k = 0;
    const gb = m.gerbes, mat = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), po = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
    if (e.eau > 0) for (const v of voitures || []) {
      if (!v || k >= gb.instanceMatrix.count) break;
      const u = Math.abs(v.u || 0);
      if (u < R.GERBE_VITESSE_MIN || Math.hypot(v.x - camera.position.x, v.z - camera.position.z) < R.GERBE_CAMERA_MIN) continue;   // (pas la gerbe qui passerait devant l'objectif)
      const t = Math.min(1, u / R.GERBE_VITESSE_PLEINE) * e.eau, fx = Math.cos(v.cap), fz = Math.sin(v.cap);
      po.set(v.x - fx * R.GERBE_RECUL, R.GERBE_HAUTEUR * t, v.z - fz * R.GERBE_RECUL);
      q.setFromAxisAngle(haut, -v.cap);
      sc.set(R.GERBE_TAILLE[0] * t, R.GERBE_TAILLE[1] * t, R.GERBE_TAILLE[2] * t);
      gb.setMatrixAt(k++, mat.compose(po, q, sc));
    }
    gb.count = k; gb.visible = k > 0; gb.instanceMatrix.needsUpdate = true;
    interfaceMeteo(e, cockpit);
  }

  // au sec : tout redevient exactement comme avant (les couleurs et les lumières de départ, le matériau de la route)
  function remettre() {
    if (m.base.fond) m.scene.background.copy(m.base.fond);
    if (m.base.brouillard) m.scene.fog.color.copy(m.base.brouillard);
    if (m.base.coupole) m.monde.coupole.material.color.copy(m.base.coupole);
    if (m.monde.ambiance) m.monde.ambiance.intensity = m.base.ambiance;
    if (m.monde.soleil) m.monde.soleil.intensity = m.base.soleil;
    if (m.route) m.route.material = m.routeSec;
    m.pluie.visible = false; m.gerbes.visible = false; m.gerbes.count = 0;
    if (m.ligne) m.ligne.visible = false;
  }

  // l'interface : l'icône et le niveau d'eau (près des pneus), les gouttes en vue cockpit ; cachées au sec
  function interfaceMeteo(e, cockpit) {
    if (typeof document === 'undefined') return;
    const hud = document.getElementById('meteoHud'), gouttes = document.getElementById('gouttes');
    const montre = !sec(e);
    if (hud) {
      hud.classList.toggle('cache', !montre);
      if (montre) {
        const icone = e.pluie > R.METEO_ICONE_PLUIE ? '🌧' : e.ciel > R.METEO_ICONE_NUAGES ? '☁' : '🌤';
        document.getElementById('meteoIcone').textContent = icone;
        document.getElementById('meteoEau').textContent = texte('meteoEau').replace('{p}', Math.round(e.eau * 100));
        document.getElementById('meteoPlein').style.width = Math.round(e.eau * 100) + '%';
      }
    }
    if (gouttes) { const oui = montre && cockpit && e.pluie > 0; gouttes.classList.toggle('cache', !oui); if (oui) gouttes.style.opacity = String(Math.min(1, e.pluie * R.GOUTTES_OPACITE)); }
  }

  // la prévision au paddock : « Météo prévue : risque de pluie (40 %) » ; null sans prévision
  function textePrevision(p) {
    if (!p || !p.type) return null;
    const t = texte('meteo_' + p.type);
    return texte('meteoPrevue').replace('{temps}', p.type === 'risque' ? t.replace('{p}', Math.round(p.risque || 0)) : t);
  }

  return { etat, prevision, init, maj, textePrevision, get actif() { return !!m; }, get pluie() { return m ? m.pluie : null; }, get gerbes() { return m ? m.gerbes : null; }, get routeMateriau() { return m && m.route ? m.route.material.type : null; }, get ligne() { return m ? m.ligne || null : null; } };
})();
