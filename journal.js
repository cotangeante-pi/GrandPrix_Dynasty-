// La une du journal (CLAUDE.md « La une du journal »), en calcul pur (ni Three.js ni page) : après chaque Grand Prix,
// le grand titre (le fait le plus marquant pour le joueur, par priorité), un petit texte, 2 ou 3 brèves sur les rivaux
// et le haut du classement. Une une est rangée dans l'album en forme compacte (clés de texte, variantes et paramètres,
// jamais le texte lui-même) ; rendre() la remet en phrases, dans la langue du jeu.
// Les textes sont dans textes.js (une clé par fait, une liste de variantes) ; les réglages dans donnees.js (JOURNAL_…).
const JOURNAL = (function () {
  const R = REGLAGES;

  // les points de chaque pilote au Grand Prix n (0 = le premier), lus dans son ordre d'arrivée
  function pointsAu(ch, n) {
    const pts = ch.pilotes.map(() => 0);
    ch.resultats[n].ordre.forEach((k, i) => { pts[k] = CHAMPIONNAT.pointsPour(i + 1); });
    return pts;
  }

  // le nom du circuit du Grand Prix n (CIRCUITS, donnees.js)
  function nomCircuit(ch, n) {
    const gp = ch.calendrier[n], c = gp && CIRCUITS[gp.circuit];
    return c ? c.nom : gp ? gp.circuit : '';
  }

  // les places au classement (1 = premier) de chaque pilote, ou de chaque écurie, avec des points donnés
  function rangs(points) {
    const ordre = points.map((p, k) => k).sort((a, b) => points[b] - points[a] || a - b);
    const r = [];
    ordre.forEach((k, i) => { r[k] = i + 1; });
    return r;
  }

  // les faits du Grand Prix qui vient d'être enregistré (CHAMPIONNAT.enregistrerCourse) ; lignes : son classement final
  // ({ k, place, grille, ligne (place au passage de la ligne), penalites, meilleurTour }). Renvoie { cle: paramètres }
  // pour chaque fait vrai, avec les noms déjà dedans (une une ne change pas si un pilote change d'écurie plus tard)
  function faits(ch, lignes) {
    const n = ch.resultats.length - 1, circuit = nomCircuit(ch, n);
    const j = ch.pilotes.find(p => p.humain), lj = lignes.find(l => l.k === j.id);
    const nomEcurie = k => ch.ecuries[ch.pilotes[k].ecurie].nom;
    const f = {};
    const place = lj ? lj.place : ch.resultats[n].ordre.indexOf(j.id) + 1;
    const base = { pilote: j.nom, ecurie: nomEcurie(j.id), circuit, place };
    // le classement des pilotes, avant et après ce Grand Prix
    const apres = ch.pilotes.map(p => p.stats.points), gpPts = pointsAu(ch, n), avant = apres.map((p, k) => p - gpPts[k]);
    const rApres = rangs(apres), leader = rApres.indexOf(1), second = rApres.indexOf(2);
    // la saison finie : le champion
    if (ch.prochain >= ch.calendrier.length && leader === j.id) f.titreChampion = { pilote: j.nom, ecurie: base.ecurie, points: apres[leader] };
    const s = j.stats, avantPlaces = j.places.slice(0, -1);
    if (place === 1) f[s.victoires === 1 ? 'premiereVictoire' : 'victoire'] = Object.assign({ n: s.victoires }, base);
    else if (place <= 3) f[s.podiums === 1 ? 'premierPodium' : 'podium'] = base;
    // le meilleur résultat de sa carrière (il faut une course d'avant pour comparer)
    if (avantPlaces.length && place < Math.min(...avantPlaces)) f.record = base;
    // le duel contre le coéquipier, gagné ou perdu nettement (l'écart de la saison) à ce Grand Prix
    const duel = ch.resultats[n].duel, score = CHAMPIONNAT.scoreDuel(ch);
    if (duel && score && duel.course !== null) {
      const ecart = score.total[0] - score.total[1], p = { pilote: j.nom, coequipier: score.nom, a: score.total[0], b: score.total[1] };
      if (duel.course === 0 && ecart >= R.JOURNAL_DUEL_NET) f.duelGagne = p;
      if (duel.course === 1 && -ecart >= R.JOURNAL_DUEL_NET) f.duelPerdu = p;
    }
    // une pénalité qui lui coûte au moins une place (passé la ligne devant, classé derrière)
    if (lj && lj.penalites > 0 && lj.ligne && lj.ligne < lj.place) f.penalite = Object.assign({ ligne: lj.ligne, secondes: lj.penalites }, base);
    // une série de Grands Prix sans point
    const serie = R.JOURNAL_SERIE, dernieres = j.places.slice(-serie);
    if (dernieres.length === serie && dernieres.every(x => CHAMPIONNAT.pointsPour(x) === 0)) f.serie = Object.assign({ n: serie }, base);
    // le leader du championnat (un autre que le joueur) s'envole : son avance est grande, et elle a grandi
    const ecartApres = apres[leader] - apres[second], ecartAvant = avant[leader] - Math.max(...avant.filter((x, k) => k !== leader));
    if (leader !== j.id && ecartApres >= R.JOURNAL_ECART_LEADER && ecartApres > ecartAvant)
      f.leader = { pilote: ch.pilotes[leader].nom, ecurie: nomEcurie(leader), ecart: ecartApres, circuit };
    // toujours vrai : le vainqueur de la course
    const v = ch.resultats[n].ordre[0];
    f.vainqueur = { pilote: ch.pilotes[v].nom, ecurie: nomEcurie(v), circuit };
    return f;
  }

  // les brèves possibles, sur les rivaux (jamais sur le joueur, jamais d'information cachée de course) : un rival en grande
  // forme (des podiums sur les derniers Grands Prix), l'écurie qui gagne le plus de places au classement, le vainqueur, le
  // meilleur tour, la pole ; dans cet ordre
  function breves(ch, lignes) {
    const n = ch.resultats.length - 1, circuit = nomCircuit(ch, n);
    const nomEcurie = k => ch.ecuries[ch.pilotes[k].ecurie].nom, b = [];
    const forme = ch.pilotes.filter(p => !p.humain).map(p => ({ p, n: p.places.slice(-R.JOURNAL_FORME_COURSES).filter(x => x <= 3).length }))
      .filter(x => x.n >= R.JOURNAL_FORME_PODIUMS).sort((a, b) => b.n - a.n || a.p.id - b.p.id)[0];
    if (forme) b.push(['breveForme', { pilote: forme.p.nom, ecurie: nomEcurie(forme.p.id), n: forme.n }]);
    const gpPts = pointsAu(ch, n), ptsEcuries = ch.ecuries.map(e => e.points);
    const avantEcuries = ptsEcuries.map((x, id) => x - ch.pilotes.filter(p => p.ecurie === id).reduce((a, p) => a + gpPts[p.id], 0));
    const rA = rangs(avantEcuries), rB = rangs(ptsEcuries), joueur = ch.pilotes.find(p => p.humain).ecurie;
    const monte = ch.ecuries.map(e => ({ e, gain: rA[e.id] - rB[e.id] })).filter(x => x.gain > 0 && x.e.id !== joueur).sort((a, b) => b.gain - a.gain || a.e.id - b.e.id)[0];
    if (monte) b.push(['breveEcurie', { ecurie: monte.e.nom, rang: rB[monte.e.id], gain: monte.gain }]);
    const ordre = ch.resultats[n].ordre, humain = k => ch.pilotes[k].humain;
    if (!humain(ordre[0])) b.push(['breveVainqueur', { pilote: ch.pilotes[ordre[0]].nom, ecurie: nomEcurie(ordre[0]), circuit }]);
    let mt = null;
    for (const l of lignes) if (l.meilleurTour !== null && l.meilleurTour !== undefined && (!mt || l.meilleurTour < mt.meilleurTour)) mt = l;
    if (mt && !humain(mt.k)) b.push(['breveMeilleurTour', { pilote: ch.pilotes[mt.k].nom, temps: Math.round(mt.meilleurTour * 1000) / 1000 }]);
    const pole = lignes.find(l => l.grille === 1);
    if (pole && !humain(pole.k)) b.push(['brevePole', { pilote: ch.pilotes[pole.k].nom, circuit }]);
    const leader = CHAMPIONNAT.classementPilotes(ch)[0];
    if (!humain(leader.k)) b.push(['breveLeader', { pilote: ch.pilotes[leader.k].nom, points: leader.points }]);
    return b;
  }

  // la variante d'une clé de texte, tirée par hasard() ; jamais la même que « eviter » (le titre de la une d'avant)
  function variante(cle, eviter) {
    const nb = TEXTES.en[cle].length;
    let v = Math.floor(hasard() * nb);
    if (eviter && eviter[0] === cle && eviter[1] === v) v = (v + 1) % nb;
    return v;
  }

  // la une du Grand Prix qui vient d'être enregistré (avant de la ranger dans l'album) : compacte, des listes
  // [cle, variante, paramètres]. t : le titre, c : le petit texte, b : les brèves, h : le haut du classement [[k, points]]
  function composer(ch, lignes) {
    const n = ch.resultats.length - 1, f = faits(ch, lignes);
    const fait = R.JOURNAL_PRIORITES.find(cle => f[cle]) || 'vainqueur';
    const avant = ch.album && ch.album.length ? ch.album[ch.album.length - 1].t : null;
    ALEATOIRE.semer(ch.graine + R.JOURNAL_GRAINE + n * 7919);
    const titre = 'uneTitre_' + fait, chapo = 'uneTexte_' + fait;
    const une = {
      g: n + 1,
      t: [titre, variante(titre, avant), f[fait]],
      c: [chapo, variante(chapo), f[fait]],
      b: breves(ch, lignes).slice(0, R.JOURNAL_BREVES_MAX).map(([cle, p]) => [cle, variante(cle), p]),
      h: CHAMPIONNAT.classementPilotes(ch).map((x, i) => [x.k, x.points, i + 1]).filter(([k, , place]) => place <= R.JOURNAL_CLASSEMENT || ch.pilotes[k].humain),
    };
    ALEATOIRE.semer();
    return une;
  }

  // l'album : chaque une, dans l'ordre (dans le championnat, donc dans la sauvegarde unique)
  function ranger(ch, une) {
    if (!ch.album) ch.album = [];
    ch.album.push(une);
    return une;
  }

  // un paramètre en texte : un temps « 1:02.345 », un nombre avec la virgule de la langue
  function enTexte(cle, x) {
    if (typeof x !== 'number') return String(x);
    if (cle === 'temps') { const m = Math.floor(x / 60), s = x - m * 60; return (m + ':' + (s < 10 ? '0' : '') + s.toFixed(3)).replace('.', texte('virgule')); }
    return String(x).replace('.', texte('virgule'));
  }

  // remplace {cle} par p[cle]
  function remplir(t, p) {
    return t.replace(/\{(\w+)\}/g, (m, cle) => p[cle] !== undefined ? enTexte(cle, p[cle]) : m);
  }
  const phrase = ([cle, v, p]) => remplir(texte(cle)[v], p);

  // la une en phrases, dans la langue du jeu : { nom (du journal), grandPrix, titre, texte, breves, classement
  // [{ place, k, nom, points, moi }] } ; ch : le championnat (les noms du classement)
  function rendre(une, ch) {
    return {
      nom: texte('journalNom'), grandPrix: une.g, titre: phrase(une.t), texte: phrase(une.c), breves: une.b.map(phrase),
      classement: une.h.map(([k, points, place]) => ({ place, k, nom: ch.pilotes[k].nom, points, moi: ch.pilotes[k].humain })),
    };
  }

  return { faits, breves, composer, ranger, rendre, remplir };
})();
