// La qualité de l'image (étape 10, tour 40) : trois crans (0 haute, 1 moyenne, 2 basse) qui ne changent que le dessin
// (pixels par pixel CSS, distance de détail et de dessin du décor), jamais la physique ni les IA. En « auto » (par défaut),
// si la moyenne passe sous QUALITE_IPS_MIN images par seconde pendant QUALITE_FENETRE s, on baisse d'un cran ; jamais
// pendant les feux (le départ ne doit pas sauter), puis on attend une nouvelle fenêtre entière avant de juger encore.
// Menu pause : « Qualité : auto / haute / basse », sauvegardé. Le calcul est pur (testé sans écran).
const QUALITE = (function () {
  const R = REGLAGES;
  const REGLES = ['auto', 'haute', 'basse'];

  function creer(regle) {
    const r = REGLES.includes(regle) ? regle : 'auto';
    return { regle: r, cran: r === 'basse' ? 2 : 0, images: [], somme: 0 };
  }

  // une image de dt secondes ; feux : les feux de départ sont allumés ; renvoie le nouveau cran s'il change, sinon null
  function observer(q, dt, feux) {
    if (q.regle !== 'auto' || !(dt > 0)) return null;
    if (feux) { q.images.length = 0; q.somme = 0; return null; }   // (pendant les feux, rien ne se juge ni ne change)
    q.images.push(dt); q.somme += dt;
    while (q.images.length > 1 && q.somme - q.images[0] >= R.QUALITE_FENETRE) q.somme -= q.images.shift();
    if (q.somme < R.QUALITE_FENETRE) return null;   // (pas encore une fenêtre entière)
    const ips = q.images.length / q.somme;
    if (ips >= R.QUALITE_IPS_MIN || q.cran >= R.QUALITE_CRANS.length - 1) return null;
    q.cran++; q.images.length = 0; q.somme = 0;
    return q.cran;
  }

  // le réglage du menu : auto (on repart du cran haut), haute, basse
  function regler(q, regle) {
    q.regle = REGLES.includes(regle) ? regle : 'auto';
    q.cran = q.regle === 'basse' ? 2 : 0;
    q.images.length = 0; q.somme = 0;
    return q.cran;
  }
  function suivante(regle) { return REGLES[(REGLES.indexOf(regle) + 1) % REGLES.length]; }

  // ce que veut dire un cran pour le dessin : { pixelRatio, detail, rien } (QUALITE_CRANS ; le cran 0 = les réglages d'avant)
  function cran(n) { return R.QUALITE_CRANS[Math.max(0, Math.min(R.QUALITE_CRANS.length - 1, n))]; }

  return { creer, observer, regler, suivante, cran, REGLES };
})();
