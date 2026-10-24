// La course de découverte du premier lancement (CLAUDE.md « En piste en 10 secondes »), en calcul pur : les pilotes du
// monde qui y courent, la place du joueur au milieu de la grille, et la prime d'argent de départ selon sa place.
// L'enchaînement des écrans (titre → grille → podium → « Prêt pour ta carrière ? ») est dans principal.js.
// Réglages : DECOUVERTE_* (donnees.js).
const DECOUVERTE = (function () {
  const R = REGLAGES;

  // les pilotes IA du monde (championnat.js) qui courent la découverte : DECOUVERTE_PILOTES, jamais le joueur,
  // au plus DECOUVERTE_IA ; pour chacun, son indice dans ch.pilotes et la couleur de son écurie
  function pilotes(ch) {
    const ids = R.DECOUVERTE_PILOTES.filter(id => ch.pilotes[id] && !ch.pilotes[id].humain).slice(0, R.DECOUVERTE_IA);
    return ids.map(id => ({ id, couleur: ch.ecuries[ch.pilotes[id].ecurie].couleur }));
  }

  // le temps de qualification qui met le joueur au milieu de la grille : la médiane des temps des IA (avec un nombre
  // pair d'IA, entre les deux du milieu : autant de voitures devant que derrière)
  function tempsMilieu(tempsIA) {
    const t = tempsIA.filter(x => typeof x === 'number').sort((a, b) => a - b);
    if (t.length === 0) return null;
    const m = t.length >> 1;
    return t.length % 2 ? t[m] + 1e-6 : (t[m - 1] + t[m]) / 2;
  }

  // la prime de la découverte selon la place (1 = vainqueur) : DECOUVERTE_ARGENT, plafonnée par DECOUVERTE_ARGENT_MAX ;
  // au-delà de la liste, ou sans place, 0
  function prime(place) {
    if (typeof place !== 'number' || place < 1) return 0;
    const a = R.DECOUVERTE_ARGENT[place - 1];
    return typeof a === 'number' ? Math.min(a, R.DECOUVERTE_ARGENT_MAX) : 0;
  }

  return { pilotes, tempsMilieu, prime };
})();
