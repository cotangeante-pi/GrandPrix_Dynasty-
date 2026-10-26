// La « photo » de la une du journal (CLAUDE.md « La une du journal »), dessinée par le code au moment de l'afficher, en canvas 2D :
// le podium du Grand Prix (les trois voitures aux couleurs de leur écurie, les casques de leurs pilotes) ou la voiture du joueur
// seule. Elle lit la description de JOURNAL.photo (calcul pur) ; aucun hasard, aucune image enregistrée : la même description
// redonne exactement la même image (l'album la redessine).
const PHOTO = (function () {
  const css = c => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6);

  // une F1 de profil, l'avant à droite : (x, y) = le sol sous la voiture, t = sa longueur ; nez long et bas avec l'aileron avant,
  // cockpit bas d'où le casque dépasse à peine, prise d'air, aileron arrière haut, deux roues visibles à l'échelle
  function voiture(ctx, x, y, t, couleur, casque) {
    const rw = t * 0.07, X = f => x + t * f, Y = f => y - rw * f, c = css(couleur);
    // le casque d'abord : le corps le cache à moitié (il est assis dans le cockpit)
    const r = rw * 0.52, cx = X(0.555), cy = Y(2.08);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.clip();
    if (casque && typeof CASQUE !== 'undefined' && CASQUE.valide(casque)) CASQUE.dessiner(ctx, cx - r, cy - r, 2 * r, casque);
    else { ctx.fillStyle = '#d9dce3'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
    ctx.fillStyle = 'rgba(20, 22, 28, 0.85)'; ctx.fillRect(cx - r * 0.1, cy - r * 0.35, r * 1.2, r * 0.45);   // la visière, vers l'avant
    ctx.restore();
    // le corps : le fond plat, le nez long qui descend, le cockpit, la prise d'air au-dessus du pilote, le capot qui descend vers l'arrière
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(X(0.05), Y(0.75)); ctx.lineTo(X(0.86), Y(0.75)); ctx.lineTo(X(1.0), Y(0.8)); ctx.lineTo(X(0.99), Y(1.05));
    ctx.lineTo(X(0.68), Y(1.6)); ctx.lineTo(X(0.61), Y(1.95)); ctx.lineTo(X(0.5), Y(1.95)); ctx.lineTo(X(0.45), Y(2.6)); ctx.lineTo(X(0.39), Y(2.6));
    ctx.lineTo(X(0.13), Y(1.75)); ctx.lineTo(X(0.05), Y(1.6));
    ctx.closePath(); ctx.fill();
    // le ponton (un peu plus sombre), sous le capot
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath(); ctx.moveTo(X(0.27), Y(0.8)); ctx.lineTo(X(0.62), Y(0.8)); ctx.lineTo(X(0.58), Y(1.45)); ctx.lineTo(X(0.3), Y(1.35)); ctx.closePath(); ctx.fill();
    // l'aileron arrière : une dérive, le support et le plan en haut ; l'aileron avant : un plan fin devant la roue, et sa dérive
    ctx.fillStyle = c;
    ctx.fillRect(X(0.0), Y(3.15), t * 0.1, rw * 0.32);
    ctx.fillStyle = '#1d2026';
    ctx.fillRect(X(0.0), Y(3.2), t * 0.012, rw * 1.6);   // la dérive arrière
    ctx.fillRect(X(0.06), Y(2.85), t * 0.012, rw * 1.2);  // le support
    ctx.fillStyle = c;
    ctx.fillRect(X(0.86), Y(0.42), t * 0.15, rw * 0.18);
    ctx.fillStyle = '#1d2026';
    ctx.fillRect(X(0.995), Y(0.75), t * 0.01, rw * 0.6);   // la dérive avant
    // les roues : pneu noir, jante grise
    for (const [rx, rr] of [[0.2, 1.05], [0.75, 0.95]]) {
      ctx.fillStyle = '#16181d'; ctx.beginPath(); ctx.arc(X(rx), y - rw * rr, rw * rr, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#7d828c'; ctx.beginPath(); ctx.arc(X(rx), y - rw * rr, rw * rr * 0.45, 0, 2 * Math.PI); ctx.fill();
    }
  }

  // d : JOURNAL.photo(une, ch) = { type: 'podium' | 'voiture', voitures: [{ couleur, casque, place }] } ; l, h : la taille en pixels
  function dessiner(ctx, l, h, d) {
    // un contexte remis à neuf : le même dessin, qu'il soit le premier sur ce canvas ou non (l'album redessine sur le même canvas)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'start'; ctx.lineWidth = 1;
    ctx.clearRect(0, 0, l, h);
    dessinerPhoto(ctx, l, h, d);
    ctx.restore();
  }

  function dessinerPhoto(ctx, l, h, d) {
    // le fond : le ciel et la piste, en dégradés (une « photo » prise au bord de la piste)
    const ciel = ctx.createLinearGradient(0, 0, 0, h);
    ciel.addColorStop(0, '#9cb8d6'); ciel.addColorStop(0.62, '#d9e2ea'); ciel.addColorStop(0.62, '#4a4f58'); ciel.addColorStop(1, '#2c3038');
    ctx.fillStyle = ciel; ctx.fillRect(0, 0, l, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 8; i++) ctx.fillRect(i * l / 8 + l / 32, h * 0.8, l / 16, h * 0.015);   // les lignes de la piste
    if (!d || !d.voitures || !d.voitures.length) return;
    if (d.type === 'podium') {
      // les marches : 2e à gauche, 1er au milieu plus haut, 3e à droite ; chaque voiture sur la sienne
      const largeur = l * 0.3, hauteurs = [0.24, 0.16, 0.1], ordre = [1, 0, 2], sol = h * 0.86;
      ordre.forEach((i, col) => {
        const v = d.voitures[i];
        if (!v) return;
        const x = l * 0.05 + col * largeur, haut = h * hauteurs[i];
        ctx.fillStyle = '#eceef2'; ctx.fillRect(x, sol - haut, largeur * 0.96, haut);
        ctx.fillStyle = ['#d4af37', '#c0c4cc', '#cd7f32'][i]; ctx.fillRect(x, sol - haut * 0.62, largeur * 0.96, haut * 0.25);
        ctx.fillStyle = '#2c3038'; ctx.font = `800 ${Math.round(haut * 0.32)}px system-ui, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), x + largeur * 0.48, sol - haut * 0.12);
        voiture(ctx, x + largeur * 0.06, sol - haut, largeur * 0.84, v.couleur, v.casque);
      });
    } else {
      const v = d.voitures[0];
      voiture(ctx, l * 0.1, h * 0.84, l * 0.8, v.couleur, v.casque);
    }
  }

  // la « photo stylisée » d'un pilote (la fiche du rival) : son casque en grand, sa voiture aux couleurs de son écurie dessous ;
  // v = { couleur, casque }
  function portrait(ctx, l, h, v) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const fond = ctx.createLinearGradient(0, 0, 0, h);
    fond.addColorStop(0, css(v.couleur)); fond.addColorStop(0.55, '#20242c'); fond.addColorStop(1, '#16181d');
    ctx.fillStyle = fond; ctx.fillRect(0, 0, l, h);
    const r = l * 0.3, cx = l / 2, cy = h * 0.34;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.clip();
    if (v.casque && typeof CASQUE !== 'undefined' && CASQUE.valide(v.casque)) CASQUE.dessiner(ctx, cx - r, cy - r, 2 * r, v.casque);
    else { ctx.fillStyle = '#d9dce3'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
    ctx.fillStyle = 'rgba(20, 22, 28, 0.85)'; ctx.fillRect(cx - r * 0.75, cy - r * 0.25, r * 1.5, r * 0.42);   // la visière
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
    voiture(ctx, l * 0.06, h * 0.93, l * 0.88, v.couleur, v.casque);
    ctx.restore();
  }

  return { dessiner, portrait };
})();
