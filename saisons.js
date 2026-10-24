// Les saisons (CLAUDE.md « Le championnat et les saisons », « La carrière du joueur », « Le duel » étape 9), en calcul pur
// (ni Three.js ni page) : la fin de saison (le champion, les titres, l'historique compact), le duel de la saison, les contrats
// (la note du joueur, les offres des écuries, la signature), les rivaux qui évoluent (âge, rythme, retraites, arrivées,
// transferts, écuries qui montent ou baissent), la saison suivante et la retraite du joueur. Tout dans le championnat
// (ch), donc dans la sauvegarde unique ; tous les réglages dans donnees.js (SAISONS_MAX, CONTRAT_*, AGE_*, RYTHME_*,
// TRANSFERTS_PAR_SAISON, NIVEAU_*). Le hasard passe par hasard() avec la graine du championnat et la saison.
const SAISONS = (function () {
  const R = REGLAGES;
  const joueur = ch => ch.pilotes.find(p => p.humain);

  // la saison est-elle finie (tous les Grands Prix du calendrier enregistrés) ?
  const finie = ch => ch.prochain >= ch.calendrier.length;

  // ce qui manque à un championnat d'avant les saisons (ancienne sauvegarde) : l'historique des saisons, les retraités,
  // les contrats signés, le champ enFinDeSaison, la retraite ; par pilote : âge, rythme, titres, saisons (championnat.js
  // donne âge et rythme aux pilotes qui n'en ont pas)
  function completer(ch) {
    if (!Array.isArray(ch.saisons)) ch.saisons = [];
    if (!Array.isArray(ch.retraites)) ch.retraites = [];
    if (!Array.isArray(ch.contrats)) ch.contrats = [];
    if (typeof ch.enFinDeSaison !== 'boolean') ch.enFinDeSaison = false;
    if (ch.retraite === undefined) ch.retraite = null;
    if (typeof ch.confiance !== 'number') ch.confiance = R.CONFIANCE_DEPART;   // la confiance de l'écurie (les consignes d'équipe viendront)
    for (const e of ch.ecuries || []) if (typeof e.titres !== 'number') e.titres = 0;
    return ch;
  }

  // le bilan de la saison en cours : les classements, le champion, le duel, la place du joueur
  function bilan(ch) {
    const cp = CHAMPIONNAT.classementPilotes(ch), ce = CHAMPIONNAT.classementEcuries(ch), j = joueur(ch);
    return {
      saison: ch.saison, pilotes: cp, ecuries: ce, champion: cp[0].k, championEcurie: ce[0].id,
      joueurPlace: cp.findIndex(x => x.k === j.id) + 1, joueurPoints: j.stats.points, duel: CHAMPIONNAT.scoreDuel(ch),
    };
  }

  // la saison finie est close une seule fois : le champion, les titres et les saisons courues dans les statistiques, l'historique
  // compact (classement final [k, points], champion, duel) ; puis le championnat attend le contrat (enFinDeSaison). Renvoie le bilan
  function terminerSaison(ch) {
    completer(ch);
    if (!finie(ch)) return null;
    const b = bilan(ch);
    if (ch.saisons.some(s => s.saison === ch.saison)) return b;   // déjà close (la page a été rechargée)
    ch.pilotes[b.champion].stats.titres = (ch.pilotes[b.champion].stats.titres || 0) + 1;
    ch.ecuries[b.championEcurie].titres++;
    for (const p of ch.pilotes) p.stats.saisons = (p.stats.saisons || 0) + 1;
    ch.saisons.push({
      saison: ch.saison, champion: b.champion, championEcurie: b.championEcurie, joueur: b.joueurPlace, ecurie: joueur(ch).ecurie, note: Math.round(note(ch) * 1000) / 1000,   // la note du joueur (les sponsors de la saison suivante la lisent)
      classement: b.pilotes.map(x => [x.k, x.points]), ecuries: b.ecuries.map(x => [x.id, x.points]),
      duel: b.duel ? [b.duel.k, b.duel.qualifs[0], b.duel.qualifs[1], b.duel.courses[0], b.duel.courses[1]] : null,
    });
    ch.enFinDeSaison = true;
    // la retraite par l'âge : après SAISONS_MAX saisons, la carrière s'arrête (pas de contrat)
    if (ch.saison >= R.SAISONS_MAX) prendreRetraite(ch, 'age');
    return b;
  }

  // --- les contrats ---
  // la note du joueur, de 0 à 1 : son classement (la part de pilotes derrière lui), son duel contre le coéquipier (poids
  // CONTRAT_POIDS_DUEL : de 0 s'il a tout perdu à 1 s'il a tout gagné), la confiance de l'écurie (poids CONTRAT_POIDS_CONFIANCE)
  function note(ch) {
    const b = bilan(ch), n = ch.pilotes.length;
    const classement = (n - b.joueurPlace) / (n - 1);
    const d = b.duel, total = d ? d.total[0] + d.total[1] : 0;
    const duel = total ? d.total[0] / total : 0.5;
    const confiance = ((ch.confiance === undefined ? R.CONFIANCE_DEPART : ch.confiance) - R.CONFIANCE_DEPART) / 100;
    const x = classement * (1 - R.CONTRAT_POIDS_DUEL - R.CONTRAT_POIDS_CONFIANCE) + duel * R.CONTRAT_POIDS_DUEL + (0.5 + confiance) * R.CONTRAT_POIDS_CONFIANCE;
    return Math.max(0, Math.min(1, x));
  }

  // ce que chaque écurie exige (0 à CONTRAT_EXIGENCE_MAX) : la meilleure exige le plus, la plus faible accepte toujours (0)
  function exigences(ch) {
    const ordre = ch.ecuries.map(e => e.id).sort((a, b) => ch.ecuries[b].niveau - ch.ecuries[a].niveau || a - b);
    const ex = {};
    ordre.forEach((id, i) => { ex[id] = R.CONTRAT_EXIGENCE_MAX * (1 - i / (ordre.length - 1)); });
    return ex;
  }

  // le pilote qui resterait le coéquipier du joueur dans l'écurie e : celui des deux qui a le plus de points (l'autre part)
  function coequipierDans(ch, id) {
    const j = joueur(ch), autres = ch.pilotes.filter(p => p.ecurie === id && !p.humain);
    if (id === j.ecurie) return autres[0] || null;
    return autres.slice().sort((a, b) => b.stats.points - a.stats.points || a.id - b.id)[0] || null;
  }

  // les offres, de la meilleure écurie à la moins bonne : [{ ecurie, niveau, coequipier (k), actuelle, exigence }] ; l'écurie
  // actuelle propose de garder le joueur si sa note le permet ; la plus faible accepte toujours : il y a toujours une offre
  function offres(ch) {
    const n = note(ch), ex = exigences(ch), j = joueur(ch);
    return ch.ecuries.filter(e => ex[e.id] <= n + 1e-12)
      .sort((a, b) => b.niveau - a.niveau || a.id - b.id)
      .map(e => ({ ecurie: e.id, niveau: e.niveau, coequipier: coequipierDans(ch, e.id) ? coequipierDans(ch, e.id).id : null, actuelle: e.id === j.ecurie, exigence: ex[e.id] }));
  }

  // le rang d'une écurie par son niveau (0 = la meilleure), pour un mot sur elle (textes : fort, moyen, faible)
  function rangEcurie(ch, id) {
    return ch.ecuries.map(e => e.id).sort((a, b) => ch.ecuries[b].niveau - ch.ecuries[a].niveau || a - b).indexOf(id);
  }

  // le joueur signe : s'il change d'écurie, il prend la place du pilote le moins bien classé de la nouvelle, qui va dans
  // son ancienne écurie ; ses améliorations (ch.garage) et son argent restent à lui ; la couleur suit l'écurie. Puis la
  // saison suivante. Renvoie false si l'écurie n'a pas fait d'offre
  function signer(ch, id) {
    if (!ch.enFinDeSaison || ch.retraite) return false;
    if (!offres(ch).some(o => o.ecurie === id)) return false;
    const j = joueur(ch);
    if (id !== j.ecurie) {
      const partant = ch.pilotes.filter(p => p.ecurie === id && !p.humain).sort((a, b) => a.stats.points - b.stats.points || b.id - a.id)[0];
      partant.ecurie = j.ecurie;
      j.ecurie = id;
    }
    ch.contrats.push([ch.saison + 1, id]);
    nouvelleSaison(ch);
    return true;
  }

  // la retraite : anticipée (le joueur choisit, entre deux saisons) ou par l'âge (SAISONS_MAX) ; le bilan simple pour l'écran
  // (le vrai bilan est l'étape 14)
  function prendreRetraite(ch, raison) {
    const j = joueur(ch);
    ch.retraite = { raison, saison: ch.saison, saisons: j.stats.saisons || ch.saison, victoires: j.stats.victoires, podiums: j.stats.podiums, titres: j.stats.titres || 0 };
    return ch.retraite;
  }

  // --- les rivaux qui évoluent, entre deux saisons (avec la graine) ---
  function evoluer(ch) {
    ALEATOIRE.semer(ch.graine + R.GRAINE_SAISONS + ch.saison * 101);
    const j = joueur(ch), numerosPris = new Set(ch.pilotes.map(p => p.numero));
    // l'âge, le rythme (les jeunes progressent, les anciens baissent), la retraite
    for (const p of ch.pilotes) {
      if (p.humain) continue;
      p.age++;
      if (p.age <= R.AGE_JEUNE) p.rythme += R.RYTHME_PROGRESSION * (0.5 + hasard());
      else if (p.age >= R.AGE_DECLIN) p.rythme -= R.RYTHME_DECLIN * (0.5 + hasard());
      p.rythme = Math.round(Math.max(R.RYTHME_MIN, Math.min(R.RYTHME_MAX, p.rythme)) * 10000) / 10000;
      const part = p.age >= R.AGE_RETRAITE_MAX || (p.age >= R.AGE_RETRAITE && hasard() < R.RETRAITE_PROBABILITE);
      if (!part) continue;
      // le retraité garde un résumé compact ; un nouveau pilote prend sa place (même écurie, même case), jeune, sans nom
      ch.retraites.push({ nom: p.nom, numero: p.numero, age: p.age, saison: ch.saison, courses: p.stats.courses, victoires: p.stats.victoires, podiums: p.stats.podiums, titres: p.stats.titres || 0, duel: ch.duel && ch.duel.carriere[p.id] ? ch.duel.carriere[p.id] : null });
      numerosPris.delete(p.numero);
      let numero = 2 + Math.floor(hasard() * 97);
      while (numerosPris.has(numero)) numero = numero % 99 + 1;
      numerosPris.add(numero);
      const c = tirerCaractere(1);
      p.nom = null; p.numero = numero; p.age = R.AGE_ARRIVEE[0] + Math.floor(hasard() * (R.AGE_ARRIVEE[1] - R.AGE_ARRIVEE[0] + 1));
      p.rythme = Math.round((R.RYTHME_ARRIVEE[0] + hasard() * (R.RYTHME_ARRIVEE[1] - R.RYTHME_ARRIVEE[0])) * 10000) / 10000;
      p.caractere = { regularite: c.regularite, agressivite: c.agressivite, erreurs: c.erreurs };
      p.stats = { courses: 0, victoires: 0, podiums: 0, poles: 0, meilleursTours: 0, points: 0, titres: 0, saisons: 0 };
      p.places = [];
      if (ch.duel && ch.duel.carriere[p.id]) delete ch.duel.carriere[p.id];   // le nouveau n'a pas de passé contre le joueur
    }
    // quelques transferts : deux pilotes IA d'écuries différentes échangent leur place (jamais le joueur)
    const ia = ch.pilotes.filter(p => !p.humain);
    for (let t = 0; t < R.TRANSFERTS_PAR_SAISON; t++) {
      const a = ia[Math.floor(hasard() * ia.length)], b = ia[Math.floor(hasard() * ia.length)];
      if (a.ecurie === b.ecurie) continue;
      [a.ecurie, b.ecurie] = [b.ecurie, a.ecurie];
    }
    // les écuries montent ou baissent selon leur classement : les NIVEAU_MONTENT premières +, les dernières −, dans les bornes
    const ce = CHAMPIONNAT.classementEcuries(ch);
    ce.forEach((x, i) => {
      const e = ch.ecuries[x.id];
      if (i < R.NIVEAU_MONTENT) e.niveau += R.NIVEAU_EVOLUTION;
      else if (i >= ce.length - R.NIVEAU_MONTENT) e.niveau -= R.NIVEAU_EVOLUTION;
      e.niveau = Math.round(Math.max(R.NIVEAU_MIN, Math.min(R.NIVEAU_MAX, e.niveau)) * 10000) / 10000;
    });
    ALEATOIRE.semer();
    return ch;
  }

  // la saison suivante : les rivaux évoluent, les points repartent de 0, le calendrier est reconstruit, le score du duel
  // repart de 0 (championnat.js : duelDe), l'historique de la saison est déjà compact (terminerSaison)
  function nouvelleSaison(ch) {
    evoluer(ch);
    ch.saison++;
    ch.prochain = 0;
    ch.resultats = [];
    for (const p of ch.pilotes) { p.stats.points = 0; p.places = []; }
    for (const e of ch.ecuries) e.points = 0;
    ch.calendrier = [];
    for (let i = 0; i < R.NB_GRANDS_PRIX; i++) ch.calendrier.push({ numero: i + 1, circuit: R.CALENDRIER_CIRCUITS[i % R.CALENDRIER_CIRCUITS.length] });
    ch.enFinDeSaison = false;
    CHAMPIONNAT.completer(ch);   // le duel repart de 0 pour la nouvelle saison (et le nouveau coéquipier)
    return ch;
  }

  // des Grands Prix joués d'avance sans physique (tests, ?gp=N) : un ordre d'arrivée tiré avec la graine, pondéré par le
  // rythme des pilotes et le niveau des écuries (le joueur au milieu) ; chacun passe par finirGrandPrix sans sauvegarde
  function avancer(ch, nb) {
    for (let g = 0; g < nb && !finie(ch); g++) {
      ALEATOIRE.semer(ch.graine + R.GRAINE_SAISONS + 7 + ch.saison * 1000 + ch.prochain);
      const force = ch.pilotes.map(p => (p.humain ? 0.985 : (p.rythme || 1) * ch.ecuries[p.ecurie].niveau) + hasard() * 0.04);
      const ordre = ch.pilotes.map(p => p.id).sort((a, b) => force[b] - force[a]);
      const grille = ch.pilotes.map(p => p.id).sort((a, b) => force[b] + (hasard() - 0.5) * 0.02 - force[a]);
      const lignes = ordre.map((k, i) => ({ k, place: i + 1, grille: grille.indexOf(k) + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i * 0.1 + hasard(), classe: true }));
      ALEATOIRE.semer();
      CHAMPIONNAT.enregistrerCourse(ch, lignes);
      if (typeof JOURNAL !== 'undefined') JOURNAL.ranger(ch, JOURNAL.composer(ch, lignes));
      if (typeof ARGENT !== 'undefined') ARGENT.encaisser(ch, lignes);
      if (typeof SPONSORS !== 'undefined') SPONSORS.suivre(ch, lignes);
    }
    return ch;
  }

  return { finie, completer, bilan, terminerSaison, note, exigences, offres, rangEcurie, coequipierDans, signer, prendreRetraite, evoluer, nouvelleSaison, avancer };
})();
