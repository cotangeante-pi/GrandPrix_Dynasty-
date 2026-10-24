// Les sponsors (CLAUDE.md « Le championnat et les saisons » : « le joueur choisit et il est choisi, avec des objectifs »),
// en calcul pur (ni Three.js ni page) : au début d'une saison, 2 à 4 offres de sponsors inventés (REGLAGES.SPONSORS, noms
// dans textes.js) selon la note du joueur (saisons.js), chacune avec un montant par saison et des objectifs à primes ; le
// joueur en choisit un (SPONSORS_MAX) ; les objectifs sont suivis après chaque Grand Prix (suivre), les primes créditées une
// seule fois par ARGENT.crediter ; l'objectif spécial du Grand Prix à domicile (pilote.js : la course de cœur) quand il existe.
// Tout dans ch.sponsor (la sauvegarde unique) ; tous les réglages dans donnees.js (SPONSORS, SPONSOR_*, GRAINE_SPONSORS).
const SPONSORS = (function () {
  const R = REGLAGES;
  const joueur = ch => ch.pilotes.find(p => p.humain);

  function completer(ch) {
    if (ch.sponsor === undefined) ch.sponsor = null;
    return ch;
  }

  // le joueur doit-il choisir un sponsor (aucun, ou celui d'une saison passée) ?
  const aChoisir = ch => !ch.sponsor || ch.sponsor.saison !== ch.saison;

  // un circuit du calendrier pour un objectif « dans les 5 premiers à … » (tiré, jamais le premier Grand Prix)
  function circuitObjectif(ch) {
    const c = ch.calendrier;
    return c[Math.min(c.length - 1, 1 + Math.floor(hasard() * Math.max(1, c.length - 1)))].circuit;
  }

  // les offres de la saison, tirées avec la graine : les sponsors dont l'exigence ≤ la note du joueur, mélangés, entre
  // SPONSORS_OFFRES[0] et [1] offres (les plus petits complètent s'il en manque) ; chaque offre : { cle, montant, exigence,
  // objectifs: [{ type, n, prime, circuit }] } plus l'objectif du Grand Prix à domicile si le joueur a une course de cœur
  function offres(ch) {
    ALEATOIRE.semer(ch.graine + R.GRAINE_SPONSORS + ch.saison * 31);
    // la note du joueur à la fin de la saison précédente (ch.saisons, saisons.js) ; à la première saison, celle d'aujourd'hui (tous à 0)
    const derniere = ch.saisons && ch.saisons.length ? ch.saisons[ch.saisons.length - 1] : null;
    const reputation = typeof INTERVIEW !== 'undefined' ? INTERVIEW.effetSponsors(ch) : 0;   // la jauge des sponsors de l'interview : ±INTERVIEW_EFFET_SPONSORS au plus
    const note = (derniere && typeof derniere.note === 'number' ? derniere.note : SAISONS.note(ch)) + reputation, [mini, maxi] = R.SPONSORS_OFFRES;
    const possibles = R.SPONSORS.filter(s => s.exigence <= note + 1e-12).slice();
    for (let i = possibles.length - 1; i > 0; i--) { const j = Math.floor(hasard() * (i + 1)); [possibles[i], possibles[j]] = [possibles[j], possibles[i]]; }
    let choix = possibles.slice(0, maxi);
    if (choix.length < mini) for (const s of R.SPONSORS.slice().sort((a, b) => a.exigence - b.exigence)) { if (choix.length >= mini) break; if (!choix.includes(s)) choix.push(s); }
    const j = joueur(ch), coeur = typeof j.coeur === 'string' ? j.coeur : null;
    const resultat = choix.map(s => {
      const objectifs = s.objectifs.map(o => Object.assign({}, o, o.type === 'top5Circuit' ? { circuit: circuitObjectif(ch) } : {}));
      if (coeur) objectifs.push({ type: 'domicile', n: 1, prime: Math.min(R.SPONSOR_DOMICILE_PRIME, R.SPONSOR_DOMICILE_PLAFOND), circuit: coeur });
      return { cle: s.cle, montant: Math.round(s.montant * (1 + reputation)), exigence: s.exigence, objectifs };
    }).sort((a, b) => b.montant - a.montant);
    ALEATOIRE.semer();
    return resultat;
  }

  // le joueur choisit l'offre cle (une seule par saison : SPONSORS_MAX) ; le montant de la saison est crédité tout de suite
  function choisir(ch, cle) {
    completer(ch);
    if (!aChoisir(ch) || R.SPONSORS_MAX < 1) return false;
    const o = offres(ch).find(x => x.cle === cle);
    if (!o) return false;
    ch.sponsor = { cle: o.cle, saison: ch.saison, montant: o.montant, objectifs: o.objectifs.map(x => Object.assign({}, x, { progres: 0, fait: false })) };
    ARGENT.crediter(ch, o.montant, 'sponsor:' + o.cle);
    return true;
  }

  // le contexte d'un Grand Prix pour les objectifs : après son enregistrement (suivre : le circuit du dernier résultat, le duel
  // enregistré, les points déjà comptés) ou avant (primesPour : le circuit du prochain Grand Prix, le duel et les points lus
  // dans les lignes)
  function contexte(ch, lignes, enregistre) {
    const j = joueur(ch), lj = lignes.find(l => l.k === j.id);
    if (enregistre) {
      const n = ch.resultats.length - 1, duel = ch.resultats[n] && ch.resultats[n].duel;
      return { lj, circuit: ch.calendrier[n] ? ch.calendrier[n].circuit : null, duelGagne: !!duel && duel.course === 0, points: j.stats.points };
    }
    const c = CHAMPIONNAT.coequipierDe(ch), lc = c ? lignes.find(l => l.k === c.id) : null;
    return { lj, circuit: ch.calendrier[ch.prochain] ? ch.calendrier[ch.prochain].circuit : null,
      duelGagne: !!(lj && lc) && CHAMPIONNAT.gagnantDuel(lj, lc).course === 0, points: j.stats.points + (lj ? CHAMPIONNAT.pointsPour(lj.place) : 0) };
  }

  // ce qu'un Grand Prix apporte à un objectif : { progres, fait }, sans rien changer
  function avancement(ch, lignes, o, enregistre = true) {
    const { lj, circuit, duelGagne, points } = contexte(ch, lignes, enregistre), place = lj ? lj.place : 99;
    let progres = o.progres;
    if (o.type === 'podiums') progres += place <= 3 ? 1 : 0;
    else if (o.type === 'points') progres = points;
    else if (o.type === 'duel') progres += duelGagne ? 1 : 0;
    else if (o.type === 'victoire') progres += place === 1 ? 1 : 0;
    else if (o.type === 'sansPenalite') progres += lj && lj.classe !== false && (lj.penalites || 0) === 0 ? 1 : 0;
    else if (o.type === 'top5Circuit') progres += circuit === o.circuit && place <= 5 ? 1 : 0;
    else if (o.type === 'domicile') progres += circuit === o.circuit && place <= 3 ? 1 : 0;
    return { progres, fait: progres >= o.n };
  }

  // après un Grand Prix enregistré (CHAMPIONNAT.finirGrandPrix) : les objectifs avancent, les primes des objectifs atteints
  // sont créditées une seule fois ; renvoie les primes de ce Grand Prix [{ type, prime }]
  function suivre(ch, lignes) {
    completer(ch);
    const s = ch.sponsor, primes = [];
    if (!s || s.saison !== ch.saison) return primes;
    for (const o of s.objectifs) {
      if (o.fait) continue;
      const a = avancement(ch, lignes, o, true);
      o.progres = a.progres;
      if (a.fait) { o.fait = true; ARGENT.crediter(ch, o.prime, 'objectif:' + o.type); primes.push({ type: o.type, prime: o.prime }); }
    }
    return primes;
  }

  // les primes que ce classement final apporterait (l'écran des résultats, avant « Continuer », le Grand Prix pas encore
  // enregistré) : sans rien changer
  function primesPour(ch, lignes) {
    const s = ch.sponsor;
    if (!s || s.saison !== ch.saison) return 0;
    let total = 0;
    for (const o of s.objectifs) { if (!o.fait && avancement(ch, lignes, o, false).fait) total += o.prime; }
    return total;
  }

  return { completer, aChoisir, offres, choisir, suivre, primesPour, avancement };
})();
