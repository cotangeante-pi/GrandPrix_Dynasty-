// La boucle du jeu : la physique avance par pas fixes (REGLAGES.PAS_PHYSIQUE), l'affichage suit requestAnimationFrame.
// Les deux sont séparés : la même seconde de jeu donne le même nombre de pas, quelle que soit la cadence de l'écran.
const BOUCLE = (function () {
  const PAS = REGLAGES.PAS_PHYSIQUE;
  const EPSILON = 1e-9;   // les sommes de flottants (30 × 1/30) tombent parfois un poil sous 1 : on ne perd pas un pas pour ça

  const physiques = [];   // f(pas) appelées à chaque pas de physique
  const affichages = [];  // f(alpha, dt) appelées à chaque image ; alpha = fraction du pas suivant déjà écoulée
  let accumulateur = 0;
  let nbPas = 0;
  let enMarche = false;   // demandé par le jeu
  let cache = document.hidden;   // l'onglet est caché
  let idImage = null;
  let derniereImage = null;

  function surPhysique(f) { physiques.push(f); }
  function surAffichage(f) { affichages.push(f); }

  function unPas() {
    for (const f of physiques) f(PAS);
    nbPas++;
  }

  // avance la physique de dt secondes de temps réel ; renvoie le nombre de pas faits
  function avancer(dt) {
    accumulateur += dt;
    let n = 0;
    while (accumulateur >= PAS - EPSILON && n < REGLAGES.PAS_MAX_PAR_IMAGE) {
      unPas();
      accumulateur -= PAS;
      n++;
    }
    // plafond atteint : le retard est abandonné, sinon chaque image aurait encore plus de pas à rattraper
    if (accumulateur >= PAS) accumulateur = 0;
    if (accumulateur < 0) accumulateur = 0;
    return n;
  }

  // la physique seule, sans affichage, aussi vite que possible (simulations d'IA, tests)
  function simuler(secondes) {
    const n = Math.round(secondes / PAS);
    for (let i = 0; i < n; i++) unPas();
    return n;
  }

  function image(temps) {
    idImage = null;
    if (!enMarche || cache) return;
    const dt = derniereImage === null ? 0 : (temps - derniereImage) / 1000;
    derniereImage = temps;
    avancer(dt);
    const alpha = accumulateur / PAS;
    for (const f of affichages) f(alpha, dt);
    idImage = requestAnimationFrame(image);
  }

  function relancer() {
    if (enMarche && !cache && idImage === null) {
      derniereImage = null;   // le temps passé à l'arrêt ne compte pas
      idImage = requestAnimationFrame(image);
    }
  }

  function couper() {
    if (idImage !== null) cancelAnimationFrame(idImage);
    idImage = null;
    accumulateur = 0;
  }

  function demarrer() { enMarche = true; relancer(); }
  function arreter() { enMarche = false; couper(); }

  // onglet caché : plus rien ne tourne ; revenu : on repart sans rattraper le temps perdu
  function changerVisibilite(estCache) {
    cache = estCache;
    if (cache) couper(); else relancer();
  }
  document.addEventListener('visibilitychange', () => changerVisibilite(document.hidden));

  return {
    surPhysique, surAffichage, avancer, simuler, demarrer, arreter, changerVisibilite,
    get nbPas() { return nbPas; },
    get tourne() { return idImage !== null; },
  };
})();
