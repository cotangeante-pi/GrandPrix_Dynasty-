// La une du journal (CLAUDE.md « La une du journal »), en calcul pur (ni Three.js ni page) : après chaque Grand Prix,
// le grand titre (le fait le plus marquant pour le joueur, par priorité), un petit texte, 2 ou 3 brèves sur les rivaux
// et le haut du classement. Une une est rangée dans l'album en forme COMPACTE : le fait, la variante tirée, ses
// paramètres (des indices de pilotes et d'écuries, le nom du circuit dans CIRCUITS, des nombres ; jamais un texte ni un
// nom : les noms viennent du championnat au moment de l'afficher) ; rendre() la remet en phrases, dans la langue du jeu.
// Les textes sont dans textes.js (uneTitre_<fait> et uneTexte_<fait> : une liste de variantes ; breve<Quoi> : idem ;
// journalNom) ; les réglages dans donnees.js (JOURNAL_…).
const JOURNAL = (function () {
  const R = REGLAGES;

  // les points de chaque pilote au Grand Prix n (0 = le premier), lus dans son ordre d'arrivée
  function pointsAu(ch, n) {
    const pts = ch.pilotes.map(() => 0);
    ch.resultats[n].ordre.forEach((k, i) => { pts[k] = CHAMPIONNAT.pointsPour(i + 1); });
    return pts;
  }

  // les places au classement (1 = premier) de chaque pilote, ou de chaque écurie, avec des points donnés
  function rangs(points) {
    const ordre = points.map((p, k) => k).sort((a, b) => points[b] - points[a] || a - b);
    const r = [];
    ordre.forEach((k, i) => { r[k] = i + 1; });
    return r;
  }

  // les faits du Grand Prix qui vient d'être enregistré (CHAMPIONNAT.enregistrerCourse) ; lignes : son classement final
  // ({ k, place, grille, ligne (place au passage de la ligne, si connue), penalites (s, si connues), meilleurTour }).
  // Renvoie { fait: paramètres } pour chaque fait vrai ; pilote, coequipier : l'indice du pilote ; ecurie : l'indice
  // de l'écurie ; circuit : son nom dans CIRCUITS
  function faits(ch, lignes) {
    const n = ch.resultats.length - 1, circuit = ch.calendrier[n] ? ch.calendrier[n].circuit : 'test';
    const j = ch.pilotes.find(p => p.humain), lj = lignes.find(l => l.k === j.id);
    const f = {};
    const place = lj ? lj.place : ch.resultats[n].ordre.indexOf(j.id) + 1;
    const base = { pilote: j.id, ecurie: j.ecurie, circuit, place };
    // le classement des pilotes, avant et après ce Grand Prix
    const apres = ch.pilotes.map(p => p.stats.points), gpPts = pointsAu(ch, n), avant = apres.map((p, k) => p - gpPts[k]);
    const rApres = rangs(apres), leader = rApres.indexOf(1), second = rApres.indexOf(2);
    // la saison finie : le champion
    if (ch.prochain >= ch.calendrier.length && leader === j.id) f.titreChampion = { pilote: j.id, ecurie: j.ecurie, points: apres[leader] };
    const s = j.stats, avantPlaces = j.places.slice(0, -1);
    if (place === 1) f[s.victoires === 1 ? 'premiereVictoire' : 'victoire'] = Object.assign({ n: s.victoires }, base);
    else if (place <= 3) f[s.podiums === 1 ? 'premierPodium' : 'podium'] = base;
    // le meilleur résultat de sa carrière (il faut une course d'avant pour comparer)
    if (avantPlaces.length && place < Math.min(...avantPlaces)) f.record = Object.assign({ ancien: Math.min(...avantPlaces) }, base);
    // le duel contre le coéquipier, gagné ou perdu nettement (l'écart de la saison) à ce Grand Prix
    const duel = ch.resultats[n].duel, score = CHAMPIONNAT.scoreDuel(ch);
    if (duel && score && duel.course !== null) {
      const ecart = score.total[0] - score.total[1], p = { pilote: j.id, coequipier: score.k, a: score.total[0], b: score.total[1], circuit };
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
      f.leader = { pilote: leader, ecurie: ch.pilotes[leader].ecurie, ecart: ecartApres, circuit };
    // toujours vrai : le vainqueur de la course
    const v = ch.resultats[n].ordre[0];
    f.vainqueur = { pilote: v, ecurie: ch.pilotes[v].ecurie, circuit };
    return f;
  }

  // les brèves possibles, sur les rivaux (jamais sur le joueur, jamais d'information cachée de course), dans cet
  // ordre : un rival en grande forme (des podiums sur les derniers Grands Prix), l'écurie qui gagne le plus de places
  // au classement, le vainqueur (ou le meilleur rival de la course, si le joueur a gagné), le meilleur tour, la pole,
  // le leader du championnat (ou son poursuivant, si le joueur mène). Il y en a toujours au moins deux
  function breves(ch, lignes) {
    const n = ch.resultats.length - 1, circuit = ch.calendrier[n] ? ch.calendrier[n].circuit : 'test';
    const ecurie = k => ch.pilotes[k].ecurie, humain = k => ch.pilotes[k].humain, b = [];
    const forme = ch.pilotes.filter(p => !p.humain).map(p => ({ p, n: p.places.slice(-R.JOURNAL_FORME_COURSES).filter(x => x <= 3).length }))
      .filter(x => x.n >= R.JOURNAL_FORME_PODIUMS).sort((a, b) => b.n - a.n || a.p.id - b.p.id)[0];
    if (forme) b.push(['breveForme', { pilote: forme.p.id, ecurie: forme.p.ecurie, n: forme.n }]);
    // un pilote âgé, proche de la retraite (saisons.js : AGE_RETRAITE), le plus vieux
    const vieux = ch.pilotes.filter(p => !p.humain && typeof p.age === 'number' && p.age >= R.AGE_RETRAITE - 1).sort((a, b) => b.age - a.age || a.id - b.id)[0];
    if (vieux) b.push(['breveRetraite', { pilote: vieux.id, age: vieux.age }]);
    const gpPts = pointsAu(ch, n), ptsEcuries = ch.ecuries.map(e => e.points);
    const avantEcuries = ptsEcuries.map((x, id) => x - ch.pilotes.filter(p => p.ecurie === id).reduce((a, p) => a + gpPts[p.id], 0));
    const rA = rangs(avantEcuries), rB = rangs(ptsEcuries), joueur = ch.pilotes.find(p => p.humain).ecurie;
    const monte = ch.ecuries.map(e => ({ e, gain: rA[e.id] - rB[e.id] })).filter(x => x.gain > 0 && x.e.id !== joueur).sort((a, b) => b.gain - a.gain || a.e.id - b.e.id)[0];
    if (monte) b.push(['breveEcurie', { ecurie: monte.e.id, rang: rB[monte.e.id], gain: monte.gain }]);
    const ordre = ch.resultats[n].ordre;
    if (!humain(ordre[0])) b.push(['breveVainqueur', { pilote: ordre[0], ecurie: ecurie(ordre[0]), circuit }]);
    else { const r = ordre.findIndex(k => !humain(k)); b.push(['breveRival', { pilote: ordre[r], ecurie: ecurie(ordre[r]), place: r + 1, circuit }]); }
    let mt = null;
    for (const l of lignes) if (l.meilleurTour !== null && l.meilleurTour !== undefined && (!mt || l.meilleurTour < mt.meilleurTour)) mt = l;
    if (mt && !humain(mt.k)) b.push(['breveMeilleurTour', { pilote: mt.k, temps: Math.round(mt.meilleurTour * 1000) / 1000 }]);
    const pole = lignes.find(l => l.grille === 1);
    if (pole && !humain(pole.k)) b.push(['brevePole', { pilote: pole.k, circuit }]);
    const cp = CHAMPIONNAT.classementPilotes(ch);
    if (!humain(cp[0].k)) b.push(['breveLeader', { pilote: cp[0].k, points: cp[0].points }]);
    else b.push(['breveChasseur', { pilote: cp[1].k, ecart: cp[0].points - cp[1].points }]);
    return b;
  }

  // le nombre de variantes d'une clé de texte (le même dans les deux langues, vérifié par tests/textes.html)
  const nbVariantes = cle => TEXTES.en[cle].length;

  // une variante tirée par hasard() ; jamais la variante « eviter » (le titre de la une d'avant, pour le même fait)
  function variante(cle, eviter) {
    const nb = nbVariantes(cle);
    let v = Math.floor(hasard() * nb);
    if (eviter !== null && eviter !== undefined && v === eviter && nb > 1) v = (v + 1) % nb;
    return v;
  }

  // la une du Grand Prix qui vient d'être enregistré (avant de la ranger dans l'album), compacte :
  // g : le numéro du Grand Prix ; f : le fait du grand titre ; p : ses paramètres ; t, c : la variante du titre et du
  // petit texte ; b : les brèves [cle, variante, paramètres] ; h : le haut du classement [[k, points, place]]
  function composer(ch, lignes) {
    const n = ch.resultats.length - 1, F = faits(ch, lignes);
    const fait = R.JOURNAL_PRIORITES.find(cle => F[cle]) || 'vainqueur';
    const avant = ch.album && ch.album.length ? ch.album[ch.album.length - 1] : null;
    ALEATOIRE.semer(ch.graine + R.JOURNAL_GRAINE + n * 7919);
    const une = {
      g: n + 1, f: fait, p: F[fait],
      t: variante('uneTitre_' + fait, avant && avant.f === fait ? avant.t : null),
      c: variante('uneTexte_' + fait, avant && avant.f === fait ? avant.c : null),
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

  // le nom affiché d'un pilote et d'une écurie, quand l'affichage n'en donne pas (tests) : la même règle que
  // interface.js (le sien, sinon le nom par défaut de textes.js) ; le circuit : son texte, sinon son nom dans CIRCUITS
  const NOMS = {
    pilote: p => p.nom || (p.humain ? texte('nomJoueur') : texte('pilote').replace('{n}', p.numero)),
    ecurie: e => e.nom || texte('ecurie').replace('{n}', e.id + 1),
  };
  const nomCircuit = nom => texte('circuit_' + nom) || (CIRCUITS[nom] ? CIRCUITS[nom].nom : nom);

  // un paramètre en texte, selon sa clé : un pilote ou une écurie par son nom, le circuit, un temps « 1:02,345 »,
  // un nombre avec la virgule de la langue
  function enTexte(cle, x, ch, noms) {
    if (cle === 'pilote' || cle === 'coequipier') return noms.pilote(ch.pilotes[x]);
    if (cle === 'ecurie') return noms.ecurie(ch.ecuries[x]);
    if (cle === 'circuit') return nomCircuit(x);
    if (cle === 'temps') { const m = Math.floor(x / 60), s = x - m * 60; return (m + ':' + (s < 10 ? '0' : '') + s.toFixed(3)).replace('.', texte('virgule')); }
    return String(x).replace('.', texte('virgule'));
  }

  // remplace {cle} par p[cle], en texte
  function remplir(t, p, ch, noms) {
    return t.replace(/\{(\w+)\}/g, (m, cle) => p[cle] !== undefined ? enTexte(cle, p[cle], ch, noms) : m);
  }

  // la une en phrases, dans la langue du jeu : { nom (du journal), grandPrix, circuit, titre, texte, breves, classement
  // [{ place, k, nom, points, moi }] } ; ch : le championnat (les noms) ; noms : { pilote(p), ecurie(e) } de l'affichage
  function rendre(une, ch, noms) {
    noms = noms || NOMS;
    const phrase = (cle, v, p) => remplir(texte(cle)[v], p, ch, noms);
    const gp = ch.calendrier[une.g - 1];
    return {
      nom: texte('journalNom'), grandPrix: une.g, circuit: nomCircuit(gp ? gp.circuit : 'test'),
      titre: phrase('uneTitre_' + une.f, une.t, une.p), texte: phrase('uneTexte_' + une.f, une.c, une.p),
      breves: une.b.map(([cle, v, p]) => phrase(cle, v, p)),
      classement: une.h.map(([k, points, place]) => ({ place, k, nom: noms.pilote(ch.pilotes[k]), points, moi: ch.pilotes[k].humain })),
    };
  }

  // les clés de texte que le journal demande (tests : toutes dans les deux langues, avec des variantes)
  const BREVES = ['breveForme', 'breveRetraite', 'breveEcurie', 'breveVainqueur', 'breveRival', 'breveMeilleurTour', 'brevePole', 'breveLeader', 'breveChasseur'];
  function cles() {
    return ['journalNom'].concat(R.JOURNAL_PRIORITES.flatMap(f => ['uneTitre_' + f, 'uneTexte_' + f]), BREVES);
  }

  return { faits, breves, composer, ranger, rendre, remplir, cles, nbVariantes };
})();
