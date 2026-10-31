// Le robot d'essai : un pilote automatique naïf, qui prouve que la physique permet de faire un tour.
// Ce n'est PAS encore l'IA (étape 4) : il suit la ligne du milieu et freine selon la courbure devant lui.
// Il donne les mêmes commandes qu'un joueur : { gaz, frein, direction }.

// vitesseCible (facultatif) : il roule à cette vitesse sans regarder les virages (tests de tenue en virage)
function piloteRobot(v, circuit, vitesseCible) {
  const R = REGLAGES;
  const p = v.piste || positionSurPiste(circuit, v.x, v.z);

  // aux stands (étape 7, tests : v.versStands, posé par la page de test) : il suit la voie, s'arrête et ressort
  const st = v.versStands ? standsRobot(v, circuit, p) : null;
  // la direction : il vise un point de la ligne du milieu un peu plus loin (« poursuite pure »)
  const visee = Math.max(R.ROBOT_VISEE_MIN, v.u * R.ROBOT_VISEE_TEMPS);
  const iv = Math.round((p.s + visee) / circuit.pas) % circuit.nb;
  let dx = circuit.x[iv] - v.x, dz = circuit.z[iv] - v.z;
  if (st) { const q = [0, 0]; pointPiste(circuit, p.s + visee, st.d, q); dx = q[0] - v.x; dz = q[1] - v.z; }
  const c = Math.cos(v.cap), s = Math.sin(v.cap);
  const devant = c * dx + s * dz, droite = -s * dx + c * dz;
  const angle = Math.atan2(droite, devant);
  const braquageVoulu = Math.atan(2 * R.EMPATTEMENT * Math.sin(angle) / Math.hypot(dx, dz));
  const direction = braquageVoulu / braquageMax(v.u);

  // la vitesse : la plus petite des vitesses permises par les virages devant, en comptant le freinage
  let cible = vitesseCible;
  if (cible === undefined) {
    cible = Infinity;
    const i0 = p.indice, n = Math.ceil(R.ROBOT_REGARD / circuit.pas);
    for (let k = 0; k < n; k++) {
      const i = (i0 + k) % circuit.nb;
      const vMax = vitesseVirage(circuit.courbure[i], R.ADHERENCE * (v.adhMeteo || 1) * (v.aero || 1) * (v.aileronAdherence || 1) * (v.typePneus === 'drift' ? (v.adhDrift || 1) : 1)) * R.ROBOT_MARGE_VIRAGE;   // × 1 sans garage : pareil
      if (vMax === Infinity) continue;
      const distance = k * circuit.pas;
      cible = Math.min(cible, Math.sqrt(vMax * vMax + 2 * R.ROBOT_DECELERATION * (v.freins || 1) * distance));   // de meilleurs freins (garage) : il freine plus tard
    }
  }
  if (st) cible = Math.min(cible, st.vitesse);
  if (v.leverLePied) cible = Math.min(cible, v.leverLePied);   // (tests : il lève le pied, pour laisser passer son coéquipier : une consigne d'équipe)
  const ecart = cible - v.u;
  return {
    gaz: ecart > 0 ? Math.min(1, ecart / 2) : 0,
    frein: ecart < -1 ? Math.min(1, -ecart / 5) : 0,
    direction: Math.max(-1, Math.min(1, direction)),
  };
}

// le robot aux stands (étape 7) : l'écart visé et la vitesse permise là où il est. Avant l'entrée, il se range du côté de la
// voie ; dans la voie, au milieu, à STAND_VITESSE_VISEE ; tant que l'arrêt n'est pas fait, il ralentit jusqu'à la place d'arrêt ;
// après la sortie (et son arrêt fait), il oublie les stands (v.versStands = false)
function standsRobot(v, circuit, p) {
  const R = REGLAGES, st = circuit.stands;
  if (!st) { v.versStands = false; return null; }
  const L = circuit.longueur, depuis = ((p.s - st.entree) % L + L + L / 2) % L - L / 2, fait = !!(v.pneus && v.pneus.arrets > 0);
  if (fait && depuis > st.longueur + R.STAND_RAMPE) { v.versStands = false; return null; }
  const bord = st.cote * (circuit.largeur / 2 - R.STAND_BORD), voie = st.cote * (st.dMur + R.STAND_LARGEUR / 2);
  const dans = depuis >= 0 && depuis <= st.longueur;
  if (dans && depuis >= R.STAND_RAMPE && !v.dansStands) return null;   // le long de la voie, côté piste (derrière le muret) : il fait d'abord un tour
  const d = !dans ? bord : depuis < R.STAND_RAMPE - 10 ? bord + (voie - bord) * depuis / (R.STAND_RAMPE - 10)
    : depuis > st.longueur - R.STAND_RAMPE + 5 ? voie + (bord - voie) * (depuis - st.longueur + R.STAND_RAMPE - 5) / (R.STAND_RAMPE - 5) : voie;
  const vs = R.STAND_VITESSE_VISEE;
  let vitesse = depuis < 0 ? Math.sqrt(vs * vs - 2 * R.STAND_DECEL * depuis) : dans ? vs : Infinity;
  if (!fait && depuis <= st.longueur) {
    const devant = ((st.arret - p.s) % L + L + L / 2) % L - L / 2, va = R.STAND_VITESSE_APPROCHE;
    if (devant > -R.STAND_ARRET_DEMI) vitesse = Math.min(vitesse, Math.sqrt(va * va + 2 * R.STAND_DECEL_ARRET * Math.max(0, devant)));
  }
  return { d, vitesse };
}
