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
    // la relève : le premier Grand Prix de l'héritier (« Le fils de Rossi débarque ») ; parent = l'indice de la génération d'avant
    const D = ch.dynastie, G = D && D.generations ? D.generations.length : 0;
    if (G && D.lien && n === 0 && ch.carriere && ch.saison === ch.carriere.debut) f['releve_' + D.lien] = Object.assign({ parent: G - 1 }, base);
    // le Grand Prix à domicile : ses titres à lui, prioritaires sur les faits ordinaires, jamais sur le titre de champion (JOURNAL_PRIORITES)
    if (j.coeur && circuit === j.coeur) f[place <= R.DOMICILE_FETE_PLACE ? 'domicileFete' : 'domicileDecu'] = base;
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
    // la phrase de l'interview (interview.js) : la réponse provocante contre un pilote nommé, donnée à ce Grand Prix
    const itw = ch.interview && ch.interview.derniere;
    if (itw && itw.ton === 'provocant' && itw.rival !== null && itw.rival !== undefined && itw.gp === n + 1 && itw.saison === ch.saison)
      f.interview = { pilote: j.id, rival: itw.rival, circuit };
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
    // une rumeur de transfert, dans la seconde moitié de la saison (JOURNAL_RUMEUR_DES_GP) : vraie (une intention de transfert de
    // saisons.js : le pilote vers l'écurie de l'autre) ou fausse (un pilote et une écurie au hasard, JOURNAL_RUMEUR_FAUSSE) ; la
    // première rumeur de la saison est toujours vraie (jamais toutes fausses) ; rien de caché sur la prochaine course
    const T = ch.transferts && ch.transferts.saison === ch.saison ? ch.transferts.liste : [];
    if (n + 1 >= R.JOURNAL_RUMEUR_DES_GP && T.length) {
      const premiere = n + 1 === R.JOURNAL_RUMEUR_DES_GP, fausse = !premiere && hasard() < R.JOURNAL_RUMEUR_FAUSSE;
      const ia = ch.pilotes.filter(p => !p.humain && !T.some(x => x.includes(p.id)));
      let r = null;
      if (fausse && ia.length) {
        const p = ia[Math.floor(hasard() * ia.length)], autres = ch.ecuries.filter(e => e.id !== p.ecurie);
        r = { pilote: p.id, ecurie: autres[Math.floor(hasard() * autres.length)].id, vraie: 0 };
      } else {
        const x = T[Math.floor(hasard() * T.length)], sens = hasard() < 0.5 ? 0 : 1;
        r = { pilote: x[sens], ecurie: ch.pilotes[x[1 - sens]].ecurie, vraie: 1 };
      }
      b.unshift(['breveRumeur', r]);
    }
    // la relève : un ancien rival de la génération d'avant, devenu consultant, parle du leader (un nom, aucune information de course)
    const consultants = typeof SAISONS !== 'undefined' ? SAISONS.anciensDuParent(ch, 'consultant') : [];
    if (consultants.length) { const lead = CHAMPIONNAT.classementPilotes(ch)[0].k; b.unshift(['breveConsultant', { consultant: consultants[n % consultants.length].i, pilote: lead }]); }
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
      s: ch.saison, g: n + 1, f: fait, p: F[fait],
      t: variante('uneTitre_' + fait, avant && avant.f === fait ? avant.t : null),
      c: variante('uneTexte_' + fait, avant && avant.f === fait ? avant.c : null),
      b: breves(ch, lignes).slice(0, R.JOURNAL_BREVES_MAX).map(([cle, p]) => [cle, variante(cle), p]),
      h: CHAMPIONNAT.classementPilotes(ch).map((x, i) => [x.k, x.points, i + 1]).filter(([k, , place]) => place <= R.JOURNAL_CLASSEMENT || ch.pilotes[k].humain),
      // de quoi redessiner la photo (jamais une image) : les trois premiers (indices de pilotes), leurs écuries ce jour-là, celle du joueur
      ph: ch.resultats[n].ordre.slice(0, 3), pe: ch.resultats[n].ordre.slice(0, 3).map(k => ch.pilotes[k].ecurie), je: ch.pilotes.find(p => p.humain).ecurie,
    };
    ALEATOIRE.semer();
    if (fait === 'titreChampion') une.t = 0;   // la une spéciale du champion : toujours « CHAMPION ! … » (la variante est tirée quand même : le reste du tirage ne bouge pas)
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
    if (cle === 'pilote' || cle === 'coequipier' || cle === 'rival') return noms.pilote(ch.pilotes[x]);
    if (cle === 'ecurie') return noms.ecurie(ch.ecuries[x]);
    if (cle === 'consultant') { const r = (ch.retraites || [])[x]; return noms.pilote(r ? { nom: r.nom, numero: r.numero, humain: false } : { nom: null, numero: 0, humain: false }); }   // un ancien rival retraité
    if (cle === 'parent') {   // la génération d'avant (la relève), par son nom
      const g = ch.dynastie && ch.dynastie.generations ? ch.dynastie.generations[x] : null;
      return noms.pilote(g ? { nom: g.nom, numero: g.numero, humain: true } : { nom: null, numero: 0, humain: true });
    }
    if (cle === 'circuit') return nomCircuit(x);
    if (cle === 'temps') { const m = Math.floor(x / 60), s = x - m * 60; return (m + ':' + (s < 10 ? '0' : '') + s.toFixed(3)).replace('.', texte('virgule')); }
    return String(x).replace('.', texte('virgule'));
  }

  // remplace {cle} par p[cle], en texte
  function remplir(t, p, ch, noms) {
    return elider(t.replace(/\{(\w+)\}/g, (m, cle) => p[cle] !== undefined ? enTexte(cle, p[cle], ch, noms) : m));   // (« d’Alex » : textes.js, elider)
  }

  // la une en phrases, dans la langue du jeu : { nom (du journal), grandPrix, circuit, titre, texte, breves, classement
  // [{ place, k, nom, points, moi }] } ; ch : le championnat (les noms) ; noms : { pilote(p), ecurie(e) } de l'affichage
  function rendre(une, ch, noms) {
    noms = noms || NOMS;
    const phrase = (cle, v, p) => remplir(texte(cle)[v], p, ch, noms);
    const gp = ch.calendrier[une.g - 1];
    return {
      nom: texte('journalNom'), grandPrix: une.g, saison: une.s, fait: une.f, speciale: une.f === 'titreChampion', photo: photo(une, ch), circuit: nomCircuit(gp ? gp.circuit : 'test'),
      titre: phrase('uneTitre_' + une.f, une.t, une.p), texte: phrase('uneTexte_' + une.f, une.c, une.p),
      breves: une.b.map(([cle, v, p]) => phrase(cle, v, p)),
      classement: une.h.map(([k, points, place]) => ({ place, k, nom: noms.pilote(ch.pilotes[k]), points, moi: ch.pilotes[k].humain })),
    };
  }

  // --- l'album des unes (tour 28c) : feuilleté depuis le paddock, saison par saison, chaque une redessinée À L'IDENTIQUE
  // une sauvegarde d'avant (unes sans saison) : la saison de chaque une se retrouve en remontant l'album depuis la fin (la
  // dernière est de la saison en cours ; quand le numéro du Grand Prix ne descend plus, c'est la saison d'avant)
  function completer(ch) {
    const A = ch.album || [];
    if (!A.length || A.every(u => typeof u.s === 'number')) return ch;
    let s = ch.saison || 1;
    for (let i = A.length - 1; i >= 0; i--) {
      if (i < A.length - 1 && A[i].g >= A[i + 1].g) s = Math.max(1, s - 1);
      if (typeof A[i].s !== 'number') A[i].s = s;
      else s = A[i].s;
    }
    return ch;
  }

  // les noms tels qu'ils étaient pendant la saison s : un pilote IA parti à la retraite à la fin d'une saison ≥ s y courait
  // encore (son résumé compact dans ch.retraites : nom, numéro) ; le joueur d'une génération d'avant (la relève :
  // ch.dynastie.generations, nom et numéro) ; sinon le pilote d'aujourd'hui. Les noms passent par l'affichage (noms.pilote)
  function nomsAu(ch, s, noms) {
    noms = noms || NOMS;
    const ancien = p => {
      if (p.humain) {
        const g = ch.dynastie && (ch.dynastie.generations || []).find(x => typeof x.fin === 'number' && s <= x.fin && s >= (x.debut || 1));
        return g ? { nom: g.nom, numero: g.numero, humain: true } : null;
      }
      const r = (ch.retraites || []).find(x => x.id === p.id && typeof x.saison === 'number' && x.saison >= s);
      return r ? { nom: r.nom, numero: r.numero, humain: false } : null;
    };
    return { pilote: p => { const a = ancien(p); return noms.pilote(a ? Object.assign({}, p, a) : p); }, ecurie: noms.ecurie };
  }

  // --- la photo de la une (tour 31) : ce que la photo montre, en calcul pur (photo.js la dessine) : le podium du Grand Prix (les trois
  // voitures aux couleurs de leur écurie de ce jour-là, leurs casques de cette saison) ou, pour un fait du joueur, sa voiture seule.
  // Rien d'image dans la sauvegarde : seulement les indices rangés dans la une (ph, pe, je)
  const FAITS_VOITURE = ['domicileDecu', 'record', 'duelGagne', 'duelPerdu', 'interview', 'penalite', 'serie', 'releve_fils', 'releve_fille', 'releve_protege', 'releve_protegee'];
  function casqueAu(ch, s, k) {
    const p = ch.pilotes[k];
    if (!p) return null;
    if (p.humain) {
      const g = ch.dynastie && (ch.dynastie.generations || []).find(x => typeof x.fin === 'number' && s <= x.fin && s >= (x.debut || 1));
      return (g && g.casque) || p.casque || null;
    }
    const r = (ch.retraites || []).find(x => x.id === k && typeof x.saison === 'number' && x.saison >= s);
    return r ? (r.casque || null) : (p.casque || null);
  }
  function photo(une, ch) {
    const s = typeof une.s === 'number' ? une.s : ch.saison, j = ch.pilotes.find(p => p.humain);
    const voiture = (k, e, place) => ({ k, place, couleur: (ch.ecuries[e] || ch.ecuries[0]).couleur, casque: casqueAu(ch, s, k) });
    if (!Array.isArray(une.ph) || FAITS_VOITURE.includes(une.f)) return { type: 'voiture', voitures: [voiture(j.id, typeof une.je === 'number' ? une.je : j.ecurie, null)] };
    return { type: 'podium', voitures: une.ph.map((k, i) => voiture(k, une.pe[i], i + 1)) };
  }

  // la une n° i de l'album, en phrases, avec les noms de sa saison (= la une du jour même)
  function rendreAlbum(ch, i, noms) {
    const u = ch.album[i];
    return u ? rendre(u, ch, nomsAu(ch, u.s, noms)) : null;
  }

  // les saisons de l'album : [{ saison, debut (indice de sa première une), n (son nombre d'unes) }], dans l'ordre
  function saisonsAlbum(ch) {
    const r = [];
    (ch.album || []).forEach((u, i) => {
      const d = r[r.length - 1];
      if (d && d.saison === u.s) d.n++;
      else r.push({ saison: u.s, debut: i, n: 1 });
    });
    return r;
  }

  // les clés de texte que le journal demande (tests : toutes dans les deux langues, avec des variantes)
  const BREVES = ['breveForme', 'breveRetraite', 'breveEcurie', 'breveVainqueur', 'breveRival', 'breveMeilleurTour', 'brevePole', 'breveLeader', 'breveChasseur', 'breveRumeur', 'breveConsultant'];
  function cles() {
    return ['journalNom'].concat(R.JOURNAL_PRIORITES.flatMap(f => ['uneTitre_' + f, 'uneTexte_' + f]), BREVES);
  }

  return { faits, breves, composer, ranger, rendre, remplir, cles, nbVariantes, completer, nomsAu, rendreAlbum, saisonsAlbum, photo };
})();
