// La manette (Gamepad API, tour 38, décision du Chef du 2026-10-28) : reconnue toute seule, sans écran de plus.
// Gâchette droite = gaz, gauche = frein, stick gauche = direction (en analogique, avec une zone morte) ; A = retour en
// piste, Y = caméra, Start = pause ; dans les menus, le stick ou la croix choisit un bouton, A le valide, B revient.
// Les commandes vont dans les mêmes cibles { gaz, frein, direction } que le clavier : la physique ne change pas.
// Tout ce qui se calcule est pur (testé sans manette) ; seul lireManettes touche à navigator.getGamepads.
const MANETTE = (function () {
  const R = REGLAGES;
  // la disposition « standard » du W3C (Xbox, PlayStation, la plupart des manettes USB)
  const B = { a: 0, b: 1, x: 2, y: 3, gachetteG: 6, gachetteD: 7, select: 8, start: 9, haut: 12, bas: 13, gauche: 14, droite: 15 };

  // la zone morte : en dessous, 0 ; au-dessus, la course qui reste remise de 0 à 1 (pas de saut au bord de la zone)
  function zoneMorte(x, z) {
    const a = Math.abs(x);
    if (!(a > z)) return 0;
    return Math.sign(x) * Math.min(1, (a - z) / (1 - z));
  }
  const valeur = b => !b ? 0 : typeof b === 'number' ? b : (b.value || (b.pressed ? 1 : 0));
  const appui = b => valeur(b) > R.MANETTE_SEUIL_BOUTON;

  // ce que dit une manette (un objet Gamepad, ou sa copie de test) : les cibles de conduite et les boutons enfoncés
  function lire(pad) {
    if (!pad || !pad.connected && pad.connected !== undefined) return null;
    const bt = pad.buttons || [], ax = pad.axes || [];
    const boutons = {};
    for (const nom in B) boutons[nom] = appui(bt[B[nom]]);
    return {
      gaz: zoneMorte(valeur(bt[B.gachetteD]), R.MANETTE_ZONE_GACHETTE),
      frein: zoneMorte(valeur(bt[B.gachetteG]), R.MANETTE_ZONE_GACHETTE),
      direction: zoneMorte(ax[0] || 0, R.MANETTE_ZONE_STICK),
      stickY: zoneMorte(ax[1] || 0, R.MANETTE_ZONE_STICK),
      boutons,
    };
  }

  // le clavier et la manette ensemble : le plus fort des deux pour le gaz et le frein, la somme bornée pour la direction
  // (sans manette, les cibles du clavier telles quelles, au bit près)
  function fusionner(clavier, m) {
    if (!m) return clavier;
    return {
      gaz: Math.max(clavier.gaz, m.gaz),
      frein: Math.max(clavier.frein, m.frein),
      direction: Math.max(-1, Math.min(1, clavier.direction + m.direction)),
    };
  }

  // les boutons qui viennent d'être enfoncés (un appui = une fois) : avant, apres = lire(...).boutons
  function fronts(avant, apres) {
    const f = [];
    if (!apres) return f;
    for (const nom in apres) if (apres[nom] && !(avant && avant[nom])) f.push(nom);
    return f;
  }

  // la direction des menus (croix ou stick), avec répétition quand on la tient : etat { sens, tenu } ; renvoie
  // 'haut' | 'bas' | 'gauche' | 'droite' au moment où il faut bouger, sinon null
  function sensMenu(etat, m, dt) {
    let sens = null;
    if (m) {
      const b = m.boutons, sx = m.direction, sy = m.stickY, s = R.MANETTE_SEUIL_MENU;
      if (b.haut || sy < -s) sens = 'haut';
      else if (b.bas || sy > s) sens = 'bas';
      else if (b.gauche || sx < -s) sens = 'gauche';
      else if (b.droite || sx > s) sens = 'droite';
    }
    if (sens !== etat.sens) { etat.sens = sens; etat.tenu = 0; return sens; }
    if (sens === null) return null;
    const avant = etat.tenu;
    etat.tenu += dt;
    const [d0, d1] = R.MANETTE_REPETITION;
    if (avant < d0) return etat.tenu >= d0 ? sens : null;
    return Math.floor((etat.tenu - d0) / d1) > Math.floor((avant - d0) / d1) ? sens : null;
  }

  // le bouton voisin dans un sens : boites = [{ x, y, l, h }] (les rectangles des boutons), i = le choisi (ou -1) ;
  // le plus proche dans ce sens, d'abord parmi ceux qui lui font face (même rangée ou même colonne), sinon l'écart de
  // travers (entre les bords) comptant quatre fois ; rien dans ce sens : on reste
  function voisin(boites, i, sens) {
    if (!boites.length) return -1;
    if (i < 0 || i >= boites.length) return 0;
    const c = q => ({ x: q.x + q.l / 2, y: q.y + q.h / 2 }), qi = boites[i], o = c(qi);
    const [ax, ay] = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] }[sens];
    const ecart = (a0, a1, b0, b1) => Math.max(0, b0 - a1, a0 - b1);
    let meilleur = i, note = Infinity;
    boites.forEach((q, k) => {
      if (k === i) return;
      const p = c(q), avance = (p.x - o.x) * ax + (p.y - o.y) * ay;
      if (avance <= 1) return;
      const travers = ax !== 0 ? ecart(qi.y, qi.y + qi.h, q.y, q.y + q.h) : ecart(qi.x, qi.x + qi.l, q.x, q.x + q.l);
      const n = (travers > 0 ? 1e6 : 0) + avance + 4 * travers;
      if (n < note) { note = n; meilleur = k; }
    });
    return meilleur;
  }

  // --- la page : les manettes branchées, dans l'ordre (la 1re pour le joueur 1, la 2e pour le joueur 2)
  function lireManettes() {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav || typeof nav.getGamepads !== 'function') return [];
    let liste;
    try { liste = nav.getGamepads() || []; } catch (e) { return []; }
    const r = [];
    for (const p of liste) { const m = lire(p); if (m) r.push(m); }
    return r;
  }

  return { lire, fusionner, fronts, sensMenu, voisin, zoneMorte, lireManettes, BOUTONS: B };
})();
