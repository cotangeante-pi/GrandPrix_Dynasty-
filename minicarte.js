// La minicarte (CLAUDE.md « L'interface », en course) : le tracé entier du circuit en petit, vu de dessus (le nord, −z, en
// haut), toutes les voitures en points de leur couleur, le joueur mis en valeur, la voie des stands quand les pneus sont
// actifs. Un canvas 2D (comme radar.js), pas Three.js ; le tracé est dessiné une seule fois dans un canvas à part, chaque
// image ne pose que les points. Elle lit l'état, elle ne le change jamais.
//
//   MINICARTE.init(canvas)
//   MINICARTE.preparer(circuit)            → l'échelle et le tracé (une fois par circuit)
//   MINICARTE.dessiner(voitures, moi)      → voitures : [{ x, z, couleur }] ; moi : l'indice du joueur (null : aucun)
//   MINICARTE.versCarte(x, z) / versMonde(px, py) → le passage du monde (m) à la carte (pixels CSS), et retour
//   MINICARTE.points                       → les points posés à la dernière image (tests)
const MINICARTE = (function () {
  const R = REGLAGES;
  let canvas = null, ctx = null, l = 0, h = 0, fond = null, echelle = 1, x0 = 0, z0 = 0, ox = 0, oy = 0, circuitPrepare = null;
  let points = [];

  function init(el) {
    canvas = el;
    const ratio = window.devicePixelRatio || 1;
    l = el.clientWidth || el.width; h = el.clientHeight || el.height;
    el.width = Math.round(l * ratio); el.height = Math.round(h * ratio);
    ctx = el.getContext('2d');
    ctx.scale(ratio, ratio);
  }

  const versCarte = (x, z) => [ox + (x - x0) * echelle, oy + (z - z0) * echelle];
  const versMonde = (px, py) => [x0 + (px - ox) / echelle, z0 + (py - oy) / echelle];

  function preparer(c) {
    if (!ctx || circuitPrepare === c) return;
    circuitPrepare = c;
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < c.nb; i++) { xmin = Math.min(xmin, c.x[i]); xmax = Math.max(xmax, c.x[i]); zmin = Math.min(zmin, c.z[i]); zmax = Math.max(zmax, c.z[i]); }
    const marge = R.MINICARTE_MARGE;
    echelle = Math.min((l - 2 * marge) / Math.max(1, xmax - xmin), (h - 2 * marge) / Math.max(1, zmax - zmin));
    x0 = (xmin + xmax) / 2; z0 = (zmin + zmax) / 2; ox = l / 2; oy = h / 2;
    // le tracé, une fois, dans un canvas à part (à la même résolution que la carte)
    const ratio = window.devicePixelRatio || 1;
    fond = document.createElement('canvas');
    fond.width = canvas.width; fond.height = canvas.height;
    const f = fond.getContext('2d');
    f.scale(ratio, ratio);
    f.fillStyle = 'rgba(11, 15, 23, 0.6)';
    f.beginPath(); f.roundRect ? f.roundRect(0, 0, l, h, 8) : f.rect(0, 0, l, h); f.fill();
    f.lineJoin = 'round'; f.lineCap = 'round';
    const trace = (couleur, epaisseur, debut, fin, decalage) => {
      f.strokeStyle = couleur; f.lineWidth = epaisseur; f.beginPath();
      for (let n = debut; n <= fin; n++) {
        const i = ((n % c.nb) + c.nb) % c.nb, j = (i + 1) % c.nb;
        let tx = c.x[j] - c.x[i], tz = c.z[j] - c.z[i];
        const t = Math.hypot(tx, tz) || 1; tx /= t; tz /= t;
        const p = versCarte(c.x[i] - tz * decalage, c.z[i] + tx * decalage);
        if (n === debut) f.moveTo(p[0], p[1]); else f.lineTo(p[0], p[1]);
      }
      f.stroke();
    };
    trace('#c8ccd4', R.MINICARTE_TRAIT, 0, c.nb, 0);
    // la voie des stands (étape 7), seulement avec les pneus : un trait fin, du côté du muret
    const st = c.stands;
    if (R.PNEUS_ACTIFS && st) {
      const a = Math.round(st.entree / c.pas), b = Math.round(st.sortie / c.pas), fin = b >= a ? b : b + c.nb;
      trace('#f2c230', 1.5, a, fin, st.cote * (st.dMur + st.dExt) / 2);
    }
    // la ligne de départ
    const d = versCarte(c.x[0], c.z[0]);
    f.fillStyle = '#ffffff'; f.fillRect(d[0] - 2, d[1] - 2, 4, 4);
  }

  function dessiner(voitures, moi) {
    if (!ctx || !fond) return;
    ctx.clearRect(0, 0, l, h);
    ctx.drawImage(fond, 0, 0, l, h);
    points = voitures.map((v, k) => { const p = versCarte(v.x, v.z); return { k, x: p[0], y: p[1] }; });
    for (const p of points) {
      if (p.k === moi) continue;
      ctx.fillStyle = '#' + voitures[p.k].couleur.toString(16).padStart(6, '0');
      ctx.beginPath(); ctx.arc(p.x, p.y, R.MINICARTE_POINT, 0, 2 * Math.PI); ctx.fill();
    }
    const j = points.find(p => p.k === moi);   // le joueur par-dessus, plus gros, cerclé de blanc
    if (j) {
      ctx.fillStyle = '#' + voitures[j.k].couleur.toString(16).padStart(6, '0');
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(j.x, j.y, R.MINICARTE_POINT + 2, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }
  }

  return { init, preparer, dessiner, versCarte, versMonde, get points() { return points; }, get pret() { return !!fond; } };
})();
