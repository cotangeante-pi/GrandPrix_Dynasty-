// Les divisions (CLAUDE.md « Les divisions (4, 3, 2, 1) », tour 49d), en calcul pur : la division du joueur dans sa carrière
// (ch.division, sauvegardée avec le championnat), ce qu'elle change (le niveau des IA, la force de toutes les voitures) et la montée
// en fin de saison. Règles et chiffres dans donnees.js (DIVISIONS, DIVISION_*), réversibles.
// - DIVISIONS.de(ch) : la division (1 à 4) ; une sauvegarde d'avant : DIVISION_VIEILLE (completer)
// - DIVISIONS.appliquer(division) : REGLAGES.NIVEAU et la physique de toutes les voitures pour cette division (à faire au chargement de
//   la page, avant la carte des IA et la course) ; DIVISIONS.retablir() : les réglages de base
// - DIVISIONS.facteur(ch, cle), DIVISIONS.echelle(x, ch, cle) : l'argent (gains, sponsors) et les prix du garage selon la division
// - DIVISIONS.finSaison(ch, entree, placeJoueur) : la montée (une fois par saison, saisons.js : terminerSaison) ; renvoie la nouvelle
//   division si le joueur monte, sinon null
const DIVISIONS = (function () {
  const R = REGLAGES;
  const BASE = { NIVEAU: R.NIVEAU, PUISSANCE: R.PUISSANCE, FORCE_MOTEUR_MAX: R.FORCE_MOTEUR_MAX, ADHERENCE: R.ADHERENCE };

  function completer(ch) {
    if (ch && ![1, 2, 3, 4].includes(ch.division)) ch.division = R.DIVISION_VIEILLE;
    return ch;
  }
  function de(ch) { return completer(ch).division; }
  function regles(division) { return R.DIVISIONS[division] || R.DIVISIONS[R.DIVISION_VIEILLE]; }

  function retablir() {
    R.NIVEAU = BASE.NIVEAU; R.PUISSANCE = BASE.PUISSANCE; R.FORCE_MOTEUR_MAX = BASE.FORCE_MOTEUR_MAX; R.ADHERENCE = BASE.ADHERENCE;
  }
  // (× 1 en division 3 : les mêmes nombres au bit près que sans division)
  function appliquer(division) {
    retablir();
    if (!R.DIVISIONS_ACTIVES) return null;
    const d = regles(division);
    R.NIVEAU = d.niveau;
    if (d.puissance !== 1) { R.PUISSANCE = BASE.PUISSANCE * d.puissance; R.FORCE_MOTEUR_MAX = BASE.FORCE_MOTEUR_MAX * d.puissance; }
    if (d.adherence !== 1) R.ADHERENCE = BASE.ADHERENCE * d.adherence;
    return d;
  }

  // la saison close : la division de la saison dans son historique (entree.division) ; dans les DIVISION_MONTEE_PLACE premiers, on
  // monte d'une division (entree.montee = la nouvelle) ; on ne descend jamais (DIVISION_DESCENTE false)
  function finSaison(ch, entree, placeJoueur) {
    const d = de(ch);
    if (entree) entree.division = d;
    if (!R.DIVISIONS_ACTIVES || d <= 1 || !(placeJoueur >= 1 && placeJoueur <= R.DIVISION_MONTEE_PLACE)) return null;
    ch.division = d - 1;
    if (entree) entree.montee = ch.division;
    return ch.division;
  }

  // (tour 49d-2) l'argent grandit avec la division : facteur(ch, 'argent' | 'garage') ; echelle(x, ch, cle) : x × le facteur, arrondi à
  // 100 € (x tel quel quand le facteur vaut 1 : la division 3, une sauvegarde d'avant, ou les divisions coupées)
  function facteur(ch, cle) {
    if (!R.DIVISIONS_ACTIVES || !ch) return 1;
    const f = regles(de(ch))[cle];
    return typeof f === 'number' && f > 0 ? f : 1;
  }
  function echelle(x, ch, cle) {
    const f = facteur(ch, cle);
    return f === 1 || typeof x !== 'number' ? x : Math.round(x * f / 100) * 100;
  }

  return { completer, de, regles, appliquer, retablir, finSaison, facteur, echelle, BASE };
})();
