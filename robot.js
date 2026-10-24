// Le robot d'essai : un pilote automatique naïf, qui prouve que la physique permet de faire un tour.
// Ce n'est PAS encore l'IA (étape 4) : il suit la ligne du milieu et freine selon la courbure devant lui.
// Il donne les mêmes commandes qu'un joueur : { gaz, frein, direction }.

// vitesseCible (facultatif) : il roule à cette vitesse sans regarder les virages (tests de tenue en virage)
function piloteRobot(v, circuit, vitesseCible) {
  const R = REGLAGES;
  const p = v.piste || positionSurPiste(circuit, v.x, v.z);

  // la direction : il vise un point de la ligne du milieu un peu plus loin (« poursuite pure »)
  const visee = Math.max(R.ROBOT_VISEE_MIN, v.u * R.ROBOT_VISEE_TEMPS);
  const iv = Math.round((p.s + visee) / circuit.pas) % circuit.nb;
  const dx = circuit.x[iv] - v.x, dz = circuit.z[iv] - v.z;
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
      const vMax = vitesseVirage(circuit.courbure[i], R.ADHERENCE * (v.aero || 1) * (v.aileronAdherence || 1)) * R.ROBOT_MARGE_VIRAGE;   // × 1 sans garage : pareil
      if (vMax === Infinity) continue;
      const distance = k * circuit.pas;
      cible = Math.min(cible, Math.sqrt(vMax * vMax + 2 * R.ROBOT_DECELERATION * (v.freins || 1) * distance));   // de meilleurs freins (garage) : il freine plus tard
    }
  }
  const ecart = cible - v.u;
  return {
    gaz: ecart > 0 ? Math.min(1, ecart / 2) : 0,
    frein: ecart < -1 ? Math.min(1, -ecart / 5) : 0,
    direction: Math.max(-1, Math.min(1, direction)),
  };
}
