// Le radar (en bas à gauche) : la piste proche vue de dessus, centrée sur la voiture suivie et tournée avec elle (son
// avant vers le haut), sur RADAR_RAYON mètres ; les autres voitures en points de leur couleur, elle en flèche au centre.
// Un canvas 2D, pas Three.js. Il lit l'état, il ne le change jamais.
const RADAR = (function () {
  let canvas = null, ctx = null, taille = 0;
  const etat = { points: 0 };   // le nombre de voitures dessinées à la dernière image (pour les tests)

  function init(el) {
    canvas = el;
    const ratio = window.devicePixelRatio || 1;
    taille = el.clientWidth || el.width;
    el.width = Math.round(taille * ratio);
    el.height = Math.round(taille * ratio);
    ctx = el.getContext('2d');
    ctx.scale(ratio, ratio);
  }

  // centre : la voiture suivie { x, z, cap } ; autres : [{ x, z, couleur }] (couleur en nombre, 0xrrggbb)
  function dessiner(circuit, centre, autres) {
    if (!ctx) return;
    const R = REGLAGES, demi = taille / 2, k = (demi - 6) / R.RADAR_RAYON;
    const c = Math.cos(centre.cap), s = Math.sin(centre.cap);
    // devant lui = vers le haut ; à sa droite (d > 0 sur la piste) = vers la droite
    const ecran = (x, z) => {
      const dx = x - centre.x, dz = z - centre.z;
      return [demi + (-s * dx + c * dz) * k, demi - (c * dx + s * dz) * k];
    };
    ctx.clearRect(0, 0, taille, taille);
    ctx.save();
    ctx.beginPath();
    ctx.arc(demi, demi, demi - 1, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(11, 15, 23, 0.6)';
    ctx.fill();
    ctx.clip();
    // la piste : les échantillons proches, en un trait gris de sa largeur
    const loin = (R.RADAR_RAYON + circuit.largeur) ** 2;
    ctx.beginPath();
    let dedans = false;
    for (let i = 0; i <= circuit.nb; i++) {
      const j = i % circuit.nb, dx = circuit.x[j] - centre.x, dz = circuit.z[j] - centre.z;
      if (dx * dx + dz * dz > loin) { dedans = false; continue; }
      const [px, py] = ecran(circuit.x[j], circuit.z[j]);
      if (dedans) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      dedans = true;
    }
    ctx.lineWidth = Math.max(3, circuit.largeur * k);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(160, 166, 178, 0.75)';
    ctx.stroke();
    // les autres voitures
    etat.points = 0;
    for (const a of autres) {
      const [px, py] = ecran(a.x, a.z);
      if ((px - demi) ** 2 + (py - demi) ** 2 > demi * demi) continue;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#' + a.couleur.toString(16).padStart(6, '0');
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.stroke();
      etat.points++;
    }
    // elle, au centre, en flèche vers le haut
    ctx.beginPath();
    ctx.moveTo(demi, demi - 8);
    ctx.lineTo(demi + 5, demi + 6);
    ctx.lineTo(demi, demi + 3);
    ctx.lineTo(demi - 5, demi + 6);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  return { init, dessiner, etat };
})();
