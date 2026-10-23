// Le départ parfait (étape 5, CLAUDE.md « Le départ parfait »), en calcul pur, sans écran.
// Pendant les feux, la voiture est tenue sur place : la touche d'accélérateur fait monter le régime de départ (0 à 1,
// ce n'est pas le régime de boite.js) quand on la tient, et il redescend quand on la lâche ; il faut le garder dans la
// zone verte. À l'extinction des feux, on lâche puis on réappuie : c'est le lancement. Le résultat dépend du régime à cet
// instant et du temps de réaction : parfait (la voiture normale, jamais un bonus), bon, patinage, calé, ou faux départ
// (appui dans l'anticipation : la pénalité de 5 s de course.js). L'effet est un facteur sur la force du moteur pendant un
// court moment, lu par physique.js (v.facteurDepart : 1 = rien). Les IA ont la même règle : leur régime et leur réaction
// sont tirés avec la graine selon leur caractère (course.js, armerFeux) et passent par le même resultat(). Réglages :
// DEPART_* et FEUX_REACTION_IA (donnees.js).
//
//   const d = DEPART.creer(humain);                  // un départ par voiture, armé avec les feux (course.js)
//   DEPART.pas(d, dt, eteint);                       // à chaque pas de physique (course.js, majCourse) : le temps, le régime
//   DEPART.commande(d, appui, compte);               // le joueur : la touche d'accélérateur (vrai = tenue), compte = s avant l'extinction (< 0 après)
//   DEPART.lancer(d, resultat, reaction);            // le lancement (le joueur par commande, l'IA et le robot par course.js)
//   DEPART.facteur(d)                                → le facteur sur la force du moteur en ce moment (1 = la voiture normale)
//   DEPART.resultat(regime, reaction)                → 'parfait' | 'bon' | 'patinage' | 'cale'
//   DEPART.tirerIA(tirage, caractere)                → { regime, reaction, resultat } d'une IA, depuis trois nombres de hasard() et son caractère
const DEPART = (function () {
  const R = REGLAGES;

  function creer(humain) {
    return {
      humain: !!humain,
      regime: 0,          // 0 à 1 : la position de l'aiguille sur la jauge de départ
      appui: false,       // la touche d'accélérateur est tenue
      t: 0,               // s depuis l'armement des feux
      extinction: null,   // t de l'extinction des feux (null tant qu'ils sont allumés)
      lance: null,        // t du lancement (null tant que la voiture est tenue)
      resultat: null,     // 'parfait', 'bon', 'patinage', 'cale', 'faux'
      reaction: null,     // s entre l'extinction et le lancement (négatif : avant l'extinction)
      fin: 0,             // t où l'effet sur le moteur s'arrête
      facteurEffet: 1,    // le facteur sur la force du moteur jusqu'à fin
      tirage: null,       // IA : trois nombres de hasard() tirés avec la graine (course.js), convertis à l'extinction (tirerIA)
      prevu: null,        // IA : son départ prévu { regime, reaction, resultat }, calculé à l'extinction avec son caractère
    };
  }

  // à chaque pas : le temps avance ; tant que la voiture est tenue, le régime monte (touche tenue) ou descend
  function pas(d, dt, eteint) {
    d.t += dt;
    if (eteint && d.extinction === null) d.extinction = d.t;
    if (d.lance !== null) return;
    if (d.appui) d.regime = Math.min(1, d.regime + R.DEPART_MONTEE * dt);
    else d.regime = Math.max(0, d.regime - R.DEPART_DESCENTE * dt);
  }

  // le résultat d'un lancement : le régime dans le vert (DEPART_VERT), juste au bord (DEPART_BORD), trop haut, trop bas ;
  // la réaction rapide (≤ DEPART_REACTION_PARFAITE) ou moyenne
  function resultat(regime, reaction) {
    const [bas, haut] = R.DEPART_VERT, bord = R.DEPART_BORD;
    if (regime > haut + bord) return 'patinage';
    if (regime < bas - bord) return 'cale';
    if (regime > haut || regime < bas) return 'bon';
    return reaction <= R.DEPART_REACTION_PARFAITE ? 'parfait' : 'bon';
  }

  // l'effet d'un résultat sur le moteur : [facteur sur la force, durée en s] ; parfait et faux : la voiture normale
  function effet(res) {
    return res === 'bon' ? R.DEPART_BON : res === 'patinage' ? R.DEPART_PATINAGE : res === 'cale' ? R.DEPART_CALE : [1, 0];
  }

  // le lancement : la voiture part, avec l'effet du résultat sur son moteur
  function lancer(d, res, reaction) {
    if (d.lance !== null) return;
    const [facteur, duree] = effet(res);
    d.lance = d.t; d.resultat = res; d.reaction = reaction; d.facteurEffet = facteur; d.fin = d.t + duree;
  }

  // le joueur : l'état de sa touche d'accélérateur à ce pas ; compte = secondes avant l'extinction des feux (négatif après).
  // Une pression (la touche passe de lâchée à tenue) est le lancement si les feux sont éteints, ou un faux départ si elle
  // vient dans l'anticipation (DEPART_ANTICIPATION avant l'extinction, ou moins que ça après) ; plus tôt, elle règle le régime
  function commande(d, appui, compte) {
    if (d.lance !== null) return;
    const pression = appui && !d.appui;
    d.appui = appui;
    if (!pression) return;
    if (d.extinction === null) { if (compte <= R.DEPART_ANTICIPATION) lancer(d, 'faux', -compte); return; }
    const reaction = d.t - d.extinction;
    lancer(d, reaction < R.DEPART_ANTICIPATION ? 'faux' : resultat(d.regime, reaction), reaction);
  }

  // le facteur sur la force du moteur en ce moment : 1 = la voiture normale (avant le lancement, après l'effet, départ parfait)
  function facteur(d) {
    return d.lance !== null && d.t < d.fin ? d.facteurEffet : 1;
  }

  // le départ d'une IA, avec la même règle : tirage = trois nombres de hasard() (tirés avec la graine dans armerFeux) ;
  // caractere = { regularite, erreurs } (null : un pilote moyen). La réaction est dans les bornes humaines (DEPART_IA_REACTION),
  // plus courte et plus stable pour un pilote régulier ; le régime sort du vert avec une probabilité qui monte avec le taux
  // d'erreurs (DEPART_IA_RATE) ; un faux départ est rare (DEPART_IA_FAUX) : une anticipation, réaction sous le seuil.
  // La réaction est dans les bornes humaines FEUX_REACTION_IA
  function tirerIA(tirage, caractere) {
    const [u1, u2, u3] = tirage, C = R.IA_CARACTERE;
    const part = (x, [a, b]) => Math.max(0, Math.min(1, (x - a) / (b - a)));
    const irregularite = caractere ? part(caractere.regularite, C.regularite) : 0.5;
    const fautes = caractere ? part(caractere.erreurs, C.erreurs) : 0.5;
    const [rMin, rMax] = R.FEUX_REACTION_IA;
    if (u3 < R.DEPART_IA_FAUX) return { regime: (R.DEPART_VERT[0] + R.DEPART_VERT[1]) / 2, reaction: u1 * R.DEPART_ANTICIPATION, resultat: 'faux' };
    const reaction = rMin + u1 * (rMax - rMin) * (R.DEPART_IA_REACTION_BASE + (1 - R.DEPART_IA_REACTION_BASE) * irregularite);
    const [bas, haut] = R.DEPART_VERT, pRate = R.DEPART_IA_RATE[0] + (R.DEPART_IA_RATE[1] - R.DEPART_IA_RATE[0]) * fautes;
    let regime;
    if (u2 < pRate) {
      // raté : trop haut (patinage) deux fois sur trois, trop bas (calé) sinon, au-delà du bord
      const q = u2 / pRate;
      regime = q < 2 / 3 ? haut + R.DEPART_BORD + (q / (2 / 3)) * (1 - haut - R.DEPART_BORD) : bas - R.DEPART_BORD - ((q - 2 / 3) / (1 / 3)) * (bas - R.DEPART_BORD);
    } else regime = bas + (u2 - pRate) / (1 - pRate) * (haut - bas);
    regime = Math.max(0, Math.min(1, regime));
    return { regime, reaction, resultat: resultat(regime, reaction) };
  }

  return { creer, pas, resultat, effet, lancer, commande, facteur, tirerIA };
})();
