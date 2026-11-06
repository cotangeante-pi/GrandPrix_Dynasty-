// L'arrière-plan du paddock et des menus (tour 49a-2, CLAUDE.md « Le nouveau paddock ») : derrière les menus de la carrière, la voiture
// du joueur, avec sa livrée, garée devant le garage de son écurie (decor.js : un garage par écurie, sur la façade des stands), la caméra
// qui tourne lentement autour, quelques mécaniciens aux couleurs de l'écurie, et le décor du circuit de la page (le prochain Grand Prix).
// Dans la scène principale (scene3d.js), aucune autre voiture : rien ne roule derrière les menus. La pose et la caméra sont du calcul
// pur (testé sans écran) ; seul creer / maj touchent à Three.js.
const STAND3D = (function () {
  const R = REGLAGES;

  // la place de la voiture : { x, z, cap, ou } ; ou = 'arret' (la zone d'arrêt du joueur dans la voie des stands, celle de son écurie,
  // marquée au sol à ses couleurs), 'garage' (sans voie des stands : devant le garage de l'écurie, le nez vers la piste ; sur certains
  // tracés, le décor n'a pas la place de tous les garages), 'ligne' (ni l'un ni l'autre)
  function pose(circuit, objets, ecurie) {
    const c = circuit, za = typeof zoneArretStands === 'function' ? zoneArretStands(c) : null;
    const g = !za && objets && objets.garage ? objets.garage.find(o => o.ecurie === ecurie) : null;
    if (g) return { x: g.x - g.bx * R.STAND3D_DEVANT, z: g.z - g.bz * R.STAND3D_DEVANT, cap: Math.atan2(-g.bz, -g.bx), ou: 'garage' };
    const L = c.longueur, s = za ? za.s : 0, d = za ? (za.d1 + za.d2) / 2 : 0, i = Math.round((((s % L) + L) % L) / c.pas) % c.nb;
    return { x: c.x[i] + c.nx[i] * d, z: c.z[i] + c.nz[i] * d, cap: Math.atan2(c.tz[i], c.tx[i]), ou: za ? 'arret' : 'ligne' };
  }

  // la caméra au temps t (s) : elle tourne autour de la voiture, STAND3D_RAYON m, à STAND3D_HAUTEUR, STAND3D_VITESSE rad/s ; elle vise la voiture
  function camera(p, t) {
    const a = p.cap + R.STAND3D_DEPART + t * R.STAND3D_VITESSE;
    return { x: p.x + Math.cos(a) * R.STAND3D_RAYON, y: R.STAND3D_HAUTEUR, z: p.z + Math.sin(a) * R.STAND3D_RAYON, vx: p.x, vy: R.STAND3D_VISEE_Y, vz: p.z };
  }

  // les mécaniciens : STAND3D_MECANICIENS = [[devant, à droite, regard en radians], …] autour de la voiture → { x, z, cap } chacun
  function mecaniciens(p) {
    const fx = Math.cos(p.cap), fz = Math.sin(p.cap), dx = -fz, dz = fx;   // (devant, à droite : d > 0 à droite du pilote)
    return R.STAND3D_MECANICIENS.map(([a, d, r]) => ({ x: p.x + fx * a + dx * d, z: p.z + fz * a + dz * d, cap: p.cap + r }));
  }

  // --- le dessin : les mécaniciens (les jambes sombres, le buste aux couleurs de l'écurie, le casque : trois InstancedMesh, trois appels de dessin)
  function creer() {
    const n = R.STAND3D_MECANICIENS.length, groupe = new THREE.Group(), T = R.STAND3D_TAILLE, jambes = T * 0.47, buste = T * 0.38;
    const bas = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, jambes, 0.34).translate(0, jambes / 2, 0), new THREE.MeshLambertMaterial({ color: R.STAND3D_PANTALON }), n);
    const corps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, buste, 0.46).translate(0, jambes + buste / 2, 0), new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
    const tetes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 10, 8).translate(0, T - 0.13, 0), new THREE.MeshLambertMaterial({ color: R.STAND3D_CASQUE }), n);
    bas.name = 'stand-jambes'; corps.name = 'stand-mecaniciens'; tetes.name = 'stand-tetes';
    groupe.add(bas, corps, tetes); groupe.name = 'stand'; groupe.visible = false;
    return { groupe, bas, corps, tetes, couleur: null };
  }
  const m4 = typeof THREE !== 'undefined' ? new THREE.Matrix4() : null, q4 = typeof THREE !== 'undefined' ? new THREE.Quaternion() : null;
  const haut = typeof THREE !== 'undefined' ? new THREE.Vector3(0, 1, 0) : null, un = typeof THREE !== 'undefined' ? new THREE.Vector3(1, 1, 1) : null;
  function maj(st, p, couleur) {
    mecaniciens(p).forEach((m, k) => {
      q4.setFromAxisAngle(haut, -m.cap);
      m4.compose(new THREE.Vector3(m.x, 0, m.z), q4, un);
      st.bas.setMatrixAt(k, m4); st.corps.setMatrixAt(k, m4); st.tetes.setMatrixAt(k, m4);
    });
    st.bas.instanceMatrix.needsUpdate = true; st.corps.instanceMatrix.needsUpdate = true; st.tetes.instanceMatrix.needsUpdate = true;
    if (st.couleur !== couleur) { st.couleur = couleur; st.corps.material.color.set(couleur); }
  }

  return { pose, camera, mecaniciens, creer, maj };
})();
