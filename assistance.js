// Les aides au pilotage du joueur (tour 41, décision du Chef, réversible), comme dans les jeux de F1. Elles corrigent seulement
// les cibles { gaz, frein, direction } du joueur, avant la physique : la physique et les IA ne changent pas, et toutes coupées,
// la course est celle d'avant au bit près (l'objet des cibles est rendu tel quel). Calcul pur, testé sans écran.
// - freinage assisté : trop vite pour ce qui arrive (les virages de la trajectoire de la carte, ou à défaut du milieu de la
//   piste, avec l'adhérence du moment), la voiture freine d'elle-même, au freinage possible avec une marge ; le joueur peut toujours freiner plus.
//   Et l'anti-blocage : en braquant, le frein reste sous le seuil du blocage du jeu (sensations.js). La physique, elle, ne bloque
//   jamais les roues : plafonner le frein n'évite donc aucune sortie à lui seul, c'est le freinage avant le virage qui le fait.
// - antipatinage : en virage, au bout de l'adhérence, les gaz sont limités avant que la voiture ne glisse vers l'extérieur.
// - direction assistée (débutant seulement) : un léger retour vers la trajectoire de la carte.
const ASSISTANCE = (function () {
  const R = REGLAGES;
  const AIDES = ['freinage', 'antipatinage', 'direction'];

  // les aides de départ selon le niveau : toutes en débutant, aucune au-dessus ; reglage (sauvegardé) : { freinage, antipatinage,
  // direction } ou null (pas encore choisi) ; la direction assistée n'existe qu'en débutant
  function reglees(reglage, niveau) {
    const debutant = niveau === 'debutant', r = {};
    for (const a of AIDES) r[a] = reglage && typeof reglage[a] === 'boolean' ? reglage[a] : debutant;
    if (!debutant) r.direction = false;
    return r;
  }
  const aucune = r => !r || AIDES.every(a => !r[a]);

  // l'adhérence de la voiture, comme la physique la lit (× 1 sans météo, pneus, garage ni aileron)
  const adherence = v => (v.adhMeteo || 1) * (v.adherence || 1) * (v.aero || 1) * (v.aileronAdherence || 1) * (v.surHerbe ? R.ADHERENCE_HERBE : 1);

  // la vitesse qu'il ne faut pas dépasser ici pour passer ce qui arrive (m/s) : la vitesse de virage de la physique (vitesseVirage,
  // avec l'adhérence de la voiture : pluie, pneus) sur la plus serrée des courbures, celle du milieu de la piste ou celle de la
  // trajectoire de la carte (le débutant ne prend pas forcément la bonne ligne), à ASSIST_MARGE près, et le freinage possible à
  // ASSIST_FREIN_PART près
  function vitesseSure(v, circuit, carte) {
    const p = v.piste, nb = circuit.nb, n = Math.ceil(R.ASSIST_REGARD / circuit.pas), mu = adherence(v);
    const a = R.ASSIST_FREIN_PART * freinagePossible(Math.max(0, v.u)) * (v.adhMeteo || 1) * (v.freins || 1);
    const kt = carte && carte.trajectoire ? carte.trajectoire.courbure : null, kc = circuit.courbure;
    let sure = Infinity;
    for (let j = 1; j <= n; j++) {
      const i = (p.indice + j) % nb, k = kt ? Math.max(Math.abs(kt[i]), Math.abs(kc[i])) : kc[i], lim = vitesseVirage(k, R.ADHERENCE * mu) * R.ASSIST_MARGE;
      if (lim === Infinity) continue;
      sure = Math.min(sure, Math.sqrt(lim * lim + 2 * a * j * circuit.pas));
    }
    return sure;
  }

  // les cibles corrigées ; c : celles du joueur ; v : sa voiture ; ctx : { circuit, carte } ; r : reglees(...) ou null
  function appliquer(c, v, ctx, r) {
    if (aucune(r) || !v || !ctx || !ctx.circuit || !v.piste || v.dansStands || v.u < R.ASSIST_VITESSE_MIN) return c;
    let gaz = c.gaz, frein = c.frein, direction = c.direction;
    if (r.freinage) {
      const trop = v.u - vitesseSure(v, ctx.circuit, ctx.carte);
      if (trop > 0) { frein = Math.max(frein, Math.min(1, trop / R.ASSIST_FREIN_PENTE)); gaz = 0; }
      // l'anti-blocage : en braquant, la pression au frein reste sous le seuil du blocage (SENSATIONS_BLOCAGE_FREIN : ni fumée ni
      // crissement) ; la marge du freinage assisté (ASSIST_FREIN_PART) compte déjà avec ce frein plus doux
      if (frein >= R.SENSATIONS_BLOCAGE_FREIN && Math.abs(direction) > R.ASSIST_ABS_BRAQUAGE && v.u > R.SENSATIONS_BLOCAGE_VITESSE) frein = R.SENSATIONS_BLOCAGE_FREIN * R.ASSIST_ABS_PART;
    }
    if (r.antipatinage && gaz > 0) {
      const limite = R.ADHERENCE * adherence(v) * charge(v.u) / R.MASSE, lat = Math.abs(v.u * v.r);
      const part = limite > 0 ? lat / limite : 0, [s0, s1] = R.ASSIST_ANTIPATINAGE;
      if (part > s0) gaz = Math.min(gaz, Math.max(0, (s1 - part) / (s1 - s0)));
    }
    if (r.direction && ctx.carte && ctx.carte.trajectoire) {
      const T = ctx.carte.trajectoire, i = (v.piste.indice + Math.round(R.ASSIST_DIRECTION_VISEE / ctx.circuit.pas)) % ctx.circuit.nb;
      const ecart = T.ecart[i] - v.piste.d, k = R.ASSIST_DIRECTION;
      direction = Math.max(-1, Math.min(1, direction + Math.max(-k[1], Math.min(k[1], k[0] * ecart))));
    }
    return gaz === c.gaz && frein === c.frein && direction === c.direction ? c : { gaz, frein, direction };
  }

  return { appliquer, reglees, vitesseSure, AIDES };
})();
