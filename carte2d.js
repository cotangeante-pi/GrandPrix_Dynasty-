// La carte d'un circuit vue d'en haut, en canvas 2D (comme radar.js, pas Three.js), pour l'écran de l'aileron (Codeur 3) : le
// tracé (depuis les échantillons de circuits.js), la ligne de départ, le sens de la course (une flèche), le nom et la longueur.
// Elle ne fait que dessiner : aucun conseil, aucun chiffre sur les réglages.
const CARTE2D = (function () {
  // ctx : le contexte 2D ; circuit : construireCircuit(...) ; l, h : la taille en pixels ; nom, longueur : les deux lignes de texte
  // (déjà en mots). Renvoie le nombre de points tracés
  function dessiner(ctx, circuit, l, h, nom, longueur) {
    const marge = 16, bas = 34;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < circuit.nb; i++) { x0 = Math.min(x0, circuit.x[i]); x1 = Math.max(x1, circuit.x[i]); z0 = Math.min(z0, circuit.z[i]); z1 = Math.max(z1, circuit.z[i]); }
    const e = Math.min((l - 2 * marge) / Math.max(1, x1 - x0), (h - 2 * marge - bas) / Math.max(1, z1 - z0));
    const ox = (l - (x1 - x0) * e) / 2, oz = marge + (h - 2 * marge - bas - (z1 - z0) * e) / 2;
    const px = i => ox + (circuit.x[i] - x0) * e, pz = i => oz + (circuit.z[i] - z0) * e;
    ctx.clearRect(0, 0, l, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(0, 0, l, h);
    // la piste : un trait large et sombre, puis un trait fin clair au milieu
    ctx.lineJoin = 'round';
    for (const [largeur, couleur] of [[Math.max(4, circuit.largeur * e), '#2b3140'], [2, '#e9ebf0']]) {
      ctx.beginPath();
      for (let i = 0; i <= circuit.nb; i++) { const k = i % circuit.nb; if (i === 0) ctx.moveTo(px(k), pz(k)); else ctx.lineTo(px(k), pz(k)); }
      ctx.lineWidth = largeur; ctx.strokeStyle = couleur; ctx.stroke();
    }
    // la ligne de départ : en travers de la piste, au premier échantillon
    const nx = circuit.nx[0], nz = circuit.nz[0], d = Math.max(7, circuit.largeur * e);
    ctx.beginPath(); ctx.moveTo(px(0) - nx * d, pz(0) - nz * d); ctx.lineTo(px(0) + nx * d, pz(0) + nz * d);
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffd666'; ctx.stroke();
    // le sens de la course : une flèche un peu après la ligne
    const a = Math.min(circuit.nb - 1, Math.round(circuit.nb * 0.06)), b = Math.min(circuit.nb - 1, a + 3);
    const ang = Math.atan2(pz(b) - pz(a), px(b) - px(a)), t = 9;
    ctx.beginPath();
    ctx.moveTo(px(b) + Math.cos(ang) * t, pz(b) + Math.sin(ang) * t);
    ctx.lineTo(px(b) + Math.cos(ang + 2.5) * t, pz(b) + Math.sin(ang + 2.5) * t);
    ctx.lineTo(px(b) + Math.cos(ang - 2.5) * t, pz(b) + Math.sin(ang - 2.5) * t);
    ctx.closePath(); ctx.fillStyle = '#ffd666'; ctx.fill();
    // le nom et la longueur
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ctx.font = '700 15px system-ui, sans-serif'; ctx.fillText(nom, l / 2, h - 18);
    ctx.font = '600 12px system-ui, sans-serif'; ctx.fillText(longueur, l / 2, h - 4);
    return circuit.nb;
  }

  return { dessiner };
})();
