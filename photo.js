// La « photo » de la une du journal (CLAUDE.md « La une du journal »), dessinée par le code au moment de l'afficher, en canvas 2D :
// le podium du Grand Prix (les trois voitures aux couleurs de leur écurie, les casques de leurs pilotes) ou la voiture du joueur
// seule. Elle lit la description de JOURNAL.photo (calcul pur) ; aucun hasard, aucune image enregistrée : la même description
// redonne exactement la même image (l'album la redessine).
const PHOTO = (function () {
  const css = c => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6);

  // une F1 de profil, l'avant à droite : (x, y) = le bas des roues, t = la longueur ; le casque au-dessus du cockpit
  function voiture(ctx, x, y, t, couleur, casque) {
    const h = t * 0.16;
    ctx.fillStyle = css(couleur);
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.9); ctx.lineTo(x + t * 0.12, y - h * 1.6); ctx.lineTo(x + t * 0.42, y - h * 1.5);
    ctx.lineTo(x + t * 0.55, y - h * 2.2); ctx.lineTo(x + t * 0.68, y - h * 1.5); ctx.lineTo(x + t, y - h * 0.9); ctx.lineTo(x + t, y - h * 0.4); ctx.lineTo(x, y - h * 0.4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(couleur); ctx.fillRect(x - t * 0.02, y - h * 2.6, t * 0.1, h * 0.35);   // l'aileron arrière
    ctx.fillRect(x + t * 0.9, y - h * 0.75, t * 0.12, h * 0.25);                             // l'aileron avant
    ctx.fillStyle = '#16181d';
    for (const rx of [0.2, 0.82]) { ctx.beginPath(); ctx.arc(x + t * rx, y - h * 0.45, h * 0.62, 0, 2 * Math.PI); ctx.fill(); }
    // le casque : le dessin de casque.js dans un rond, avec la visière
    const r = h * 0.5, cx = x + t * 0.53, cy = y - h * 2.15;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.clip();
    if (casque && typeof CASQUE !== 'undefined' && CASQUE.valide(casque)) CASQUE.dessiner(ctx, cx - r, cy - r, 2 * r, casque);
    else { ctx.fillStyle = '#d9dce3'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
    ctx.fillStyle = 'rgba(20, 22, 28, 0.85)'; ctx.fillRect(cx - r * 0.2, cy - r * 0.25, r * 1.2, r * 0.45);
    ctx.restore();
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
        voiture(ctx, x + largeur * 0.08, sol - haut, largeur * 0.8, v.couleur, v.casque);
      });
    } else {
      const v = d.voitures[0];
      voiture(ctx, l * 0.2, h * 0.86, l * 0.6, v.couleur, v.casque);
    }
  }

  return { dessiner };
})();
