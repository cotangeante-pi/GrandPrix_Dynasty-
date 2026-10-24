// Le casque du pilote (CLAUDE.md « Le casque du pilote »), en calcul pur : un motif (CASQUE_MOTIFS, donnees.js) et trois
// couleurs (CASQUE_PALETTE). Les 19 rivaux reçoivent le leur une fois pour toutes, tiré avec la graine du championnat (deux
// pilotes n'ont jamais le même) ; le joueur porte le casque neutre tant qu'il n'en a pas choisi un. Le casque est sauvegardé
// avec chaque pilote du championnat ; une ancienne sauvegarde sans casques en reçoit un pour chacun (completer).
// Le dessin d'un casque (dessiner) sert à l'atlas des casques 3D (voiture3d.js) et à l'icône 2D (icone) de la tour,
// des résultats et du championnat : une seule description, un seul dessin. Ni volant ni déblocages pour l'instant.
const CASQUE = (function () {
  const R = REGLAGES;

  function creer(motif, couleurs) {
    return { motif, couleurs: couleurs.slice(0, 3) };
  }

  // le casque neutre (le joueur avant la création, les voitures sans pilote)
  function neutre() {
    return creer(R.CASQUE_NEUTRE.motif, R.CASQUE_NEUTRE.couleurs);
  }

  // la clé d'un casque : deux casques de même clé sont le même casque
  function cle(c) {
    return c.motif + ':' + c.couleurs.map(x => x.toString(16)).join(',');
  }

  // un casque valide ? (motif connu, trois couleurs entières)
  function valide(c) {
    return !!c && typeof c === 'object' && R.CASQUE_MOTIFS.includes(c.motif) && Array.isArray(c.couleurs) && c.couleurs.length === 3 && c.couleurs.every(x => Number.isInteger(x) && x >= 0 && x <= 0xffffff);
  }

  // un casque tiré avec hasard() (l'appelant choisit la graine), jamais une des clés déjà prises ; la première couleur
  // et la deuxième sont toujours différentes (le motif se voit)
  function tirer(prises) {
    const M = R.CASQUE_MOTIFS, P = R.CASQUE_PALETTE;
    for (let essai = 0; essai < R.CASQUE_ESSAIS_MAX; essai++) {
      const motif = M[Math.floor(hasard() * M.length)];
      const c1 = P[Math.floor(hasard() * P.length)];
      let c2 = P[Math.floor(hasard() * P.length)];
      if (c2 === c1) c2 = P[(P.indexOf(c1) + 1) % P.length];
      const c3 = P[Math.floor(hasard() * P.length)];
      const c = creer(motif, [c1, c2, c3]), k = cle(c);
      if (!prises.has(k)) { prises.add(k); return c; }
    }
    return null;   // (impossible en pratique : 6 motifs × 12³ couleurs)
  }

  // chaque pilote du championnat a son casque : les rivaux sans casque en tirent un (graine du championnat + GRAINE_CASQUES,
  // déterministe), tous différents ; le joueur sans casque prend le neutre. Renvoie le nombre de casques donnés
  function completer(ch) {
    if (!ch || !Array.isArray(ch.pilotes)) return 0;
    const prises = new Set();
    for (const p of ch.pilotes) if (valide(p.casque)) prises.add(cle(p.casque));
    let donnes = 0;
    ALEATOIRE.semer((ch.graine || 0) + R.GRAINE_CASQUES);
    for (const p of ch.pilotes) {
      if (valide(p.casque)) continue;
      p.casque = p.humain ? neutre() : tirer(prises);
      donnes++;
    }
    ALEATOIRE.semer();
    return donnes;
  }

  // deux pilotes du championnat ont-ils le même casque ? (test ; le joueur peut choisir celui d'un rival : seulement les rivaux)
  function doublons(ch) {
    const vues = new Map(), d = [];
    for (const p of ch.pilotes) { if (p.humain || !valide(p.casque)) continue; const k = cle(p.casque); if (vues.has(k)) d.push([vues.get(k), p.id]); vues.set(k, p.id); }
    return d;
  }

  const css = x => '#' + x.toString(16).padStart(6, '0');

  // le dessin d'un casque dans le carré (x, y, taille) d'un contexte canvas 2D : le fond (couleur 1), le motif (couleur 2),
  // l'accent (couleur 3). Le même dessin sert à l'atlas (plaqué autour de la sphère : la largeur fait le tour, le haut
  // est le sommet) et à l'icône 2D
  function dessiner(ctx, x, y, t, casque) {
    const [c1, c2, c3] = casque.couleurs.map(css), m = casque.motif;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, t, t); ctx.clip();
    ctx.fillStyle = c1; ctx.fillRect(x, y, t, t);
    ctx.fillStyle = c2;
    if (m === 'bandes') {
      ctx.fillRect(x, y + t * 0.30, t, t * 0.12);
      ctx.fillRect(x, y + t * 0.58, t, t * 0.12);
      ctx.fillStyle = c3; ctx.fillRect(x, y + t * 0.46, t, t * 0.06);
    } else if (m === 'etoile') {
      for (const cx of [x + t * 0.25, x + t * 0.75]) etoile(ctx, cx, y + t * 0.5, t * 0.22, t * 0.09);
      ctx.fillStyle = c3; ctx.fillRect(x, y + t * 0.86, t, t * 0.14);
    } else if (m === 'flammes') {
      ctx.beginPath(); ctx.moveTo(x, y + t);
      for (let i = 0; i <= 8; i++) { const fx = x + t * i / 8; ctx.lineTo(fx, y + t * (i % 2 ? 0.35 : 0.7)); }
      ctx.lineTo(x + t, y + t); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c3; ctx.beginPath(); ctx.moveTo(x, y + t);
      for (let i = 0; i <= 8; i++) { const fx = x + t * i / 8; ctx.lineTo(fx, y + t * (i % 2 ? 0.62 : 0.85)); }
      ctx.lineTo(x + t, y + t); ctx.closePath(); ctx.fill();
    } else if (m === 'damier') {
      const n = 6, c = t / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2) ctx.fillRect(x + i * c, y + j * c, c + 0.5, c + 0.5);
      ctx.fillStyle = c3; ctx.fillRect(x, y + t * 0.47, t, t * 0.06);
    } else if (m === 'eclair') {
      ctx.beginPath(); ctx.moveTo(x, y + t * 0.30);
      for (let i = 0; i <= 6; i++) ctx.lineTo(x + t * i / 6, y + t * (i % 2 ? 0.55 : 0.30));
      ctx.lineTo(x + t, y + t * 0.48); for (let i = 6; i >= 0; i--) ctx.lineTo(x + t * i / 6, y + t * (i % 2 ? 0.73 : 0.48));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = c3; ctx.fillRect(x, y + t * 0.88, t, t * 0.12);
    } else {   // uni : le fond, un simple liseré de la troisième couleur
      ctx.fillStyle = c3; ctx.fillRect(x, y + t * 0.9, t, t * 0.1);
    }
    ctx.restore();
  }

  function etoile(ctx, cx, cy, re, ri) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : re; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  }

  // l'icône 2D (un canvas rond de « taille » pixels) : le même dessin, dans un cercle avec une visière sombre
  function icone(casque, taille) {
    const c = document.createElement('canvas');
    c.width = c.height = taille;
    c.className = 'casqueIcone';
    const ctx = c.getContext('2d');
    ctx.beginPath(); ctx.arc(taille / 2, taille / 2, taille / 2, 0, 2 * Math.PI); ctx.clip();
    dessiner(ctx, 0, 0, taille, casque);
    ctx.fillStyle = 'rgba(20, 22, 28, 0.85)';
    ctx.fillRect(taille * 0.15, taille * 0.42, taille * 0.7, taille * 0.24);   // la visière
    return c;
  }

  return { creer, neutre, cle, valide, tirer, completer, doublons, dessiner, icone };
})();
