// Le réglage de l'aileron (CLAUDE.md « Le réglage de l'aileron », étape 8), en calcul pur (ni Three.js ni page) : un seul
// curseur de AILERON_CRANS crans ; le cran du milieu = la voiture d'aujourd'hui (les deux facteurs valent 1, au bit près) ;
// plus haut = plus d'adhérence ET plus de traînée, plus bas = l'inverse : un ÉCHANGE, jamais un bonus, hors du plafond du garage.
// Les facteurs sont posés sur l'état de la voiture (v.aileronAdherence, v.aileronTrainee) et lus par physique.js, le même code
// pour le joueur et les IA. Le cran du joueur est gardé par circuit (ch.ailerons, dans la sauvegarde unique) ; les IA
// choisissent le leur avant chaque Grand Prix selon le circuit (la part de virages lents et de lignes droites) et leur
// caractère, avec hasard() et la graine. Réglages : AILERON_* (donnees.js).
const AILERON = (function () {
  const R = REGLAGES;
  const milieu = () => Math.floor(R.AILERON_CRANS / 2);
  const borner = c => Math.max(0, Math.min(R.AILERON_CRANS - 1, Math.round(c)));

  // les deux facteurs d'un cran (0 = le plus bas) : 1 + écart au milieu × effet par cran (au milieu : 1 exactement)
  function facteurs(cran) {
    const d = borner(cran) - milieu();
    return { adherence: 1 + d * R.AILERON_ADHERENCE_PAR_CRAN, trainee: 1 + d * R.AILERON_TRAINEE_PAR_CRAN };
  }

  // pose les facteurs sur la voiture v (cran null ou absent : le milieu)
  function appliquer(v, cran) {
    const f = facteurs(cran === null || cran === undefined ? milieu() : cran);
    v.aileronAdherence = f.adherence;
    v.aileronTrainee = f.trainee;
    return v;
  }

  // le cran du joueur sur un circuit (gardé par circuit ; jamais réglé : le milieu) ; une ancienne sauvegarde n'a rien : le milieu
  function cranDe(ch, circuit) {
    const c = ch && ch.ailerons ? ch.ailerons[circuit] : undefined;
    return Number.isInteger(c) && c >= 0 && c < R.AILERON_CRANS ? c : milieu();
  }

  function regler(ch, circuit, cran) {
    if (!ch.ailerons || typeof ch.ailerons !== 'object') ch.ailerons = {};
    ch.ailerons[circuit] = borner(cran);
    return ch.ailerons[circuit];
  }

  function completer(ch) {
    if (!ch.ailerons || typeof ch.ailerons !== 'object') ch.ailerons = {};
    return ch;
  }

  // ce que montre l'écran : deux barres de 0 à 1, « virages » (l'adhérence) et « vitesse » (la vitesse de pointe, qui baisse
  // comme la racine de la traînée), le milieu à 0,5
  function barres(cran) {
    const n = R.AILERON_CRANS - 1, x = borner(cran) / n;
    return { virages: x, vitesse: 1 - x };
  }

  // le profil d'un circuit (construireCircuit), en part du TEMPS d'un tour (ce qui compte pour l'aileron) : chaque échantillon roulé
  // à sa vitesse limite (l'adhérence, la vitesse de pointe ; comme la carte des IA, sans l'accélération) ; « lents » : là où la
  // vitesse limite est sous AILERON_VIRAGE_LENT × la pointe ; « droites » : là où rien ne limite que la pointe. Ce qu'un pilote sait de la piste
  function profil(circuit) {
    const pointe = vitesseDePointe();
    let total = 0, lents = 0, droites = 0;
    for (let i = 0; i < circuit.nb; i++) {
      const v = Math.min(pointe, vitesseVirage(circuit.courbure[i])), dt = circuit.pas / v;
      total += dt;
      if (v < R.AILERON_VIRAGE_LENT * pointe) lents += dt;
      else if (v >= pointe) droites += dt;
    }
    return { lents: lents / total, droites: droites / total };
  }

  // le cran d'une IA : le circuit (plus de virages lents qu'un circuit mixte, AILERON_IA_REFERENCE → plus haut, plus de lignes droites → plus bas), son caractère (agressif en
  // attaque → plus bas, pour doubler en ligne droite ; régulier → plus haut) et une part de hasard() (le flux de hasard en cours)
  function choisirIA(caractere, prof) {
    const c = caractere || {};
    const x = milieu()
      + (prof.lents - prof.droites - R.AILERON_IA_REFERENCE) * R.AILERON_IA_CIRCUIT
      + ((c.regularite === undefined ? 0.5 : c.regularite) - 0.5) * R.AILERON_IA_REGULARITE
      - ((c.agressivite === undefined ? 0.5 : c.agressivite) - 0.5) * R.AILERON_IA_AGRESSIVITE
      + (hasard() - 0.5) * R.AILERON_IA_HASARD;
    // (au plus AILERON_IA_ECART crans du milieu : les IA ont toutes la même vitesse de pointe de base, un écart trop grand en ligne
    // droite change trop les courses entre elles ; mesuré avec courses.html?ailerons=1)
    return borner(Math.max(milieu() - R.AILERON_IA_ECART, Math.min(milieu() + R.AILERON_IA_ECART, x)));
  }

  // les crans des IA d'un Grand Prix du championnat (la graine du championnat, la saison et le Grand Prix) : [k] = cran (le
  // joueur : null)
  function cransIA(ch, circuit) {
    const prof = profil(circuit), crans = [];
    ALEATOIRE.semer((ch.graine || 0) + R.GRAINE_AILERON + ch.saison * 1000 + ch.prochain);
    for (const p of ch.pilotes) crans.push(p.humain ? null : choisirIA(p.caractere, prof));
    ALEATOIRE.semer();
    return crans;
  }

  return { milieu, facteurs, appliquer, cranDe, regler, completer, barres, profil, choisirIA, cransIA };
})();
