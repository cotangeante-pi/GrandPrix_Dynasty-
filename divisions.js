// Les divisions (CLAUDE.md « Les divisions (4, 3, 2, 1) », tour 49d), en calcul pur : la division du joueur dans sa carrière
// (ch.division, sauvegardée avec le championnat), ce qu'elle change (le niveau des IA, la force de toutes les voitures) et la montée
// en fin de saison. Règles et chiffres dans donnees.js (DIVISIONS, DIVISION_*), réversibles.
// - DIVISIONS.de(ch) : la division (1 à 4) ; une sauvegarde d'avant : DIVISION_VIEILLE (completer)
// - DIVISIONS.appliquer(division) : REGLAGES.NIVEAU et la physique de toutes les voitures pour cette division (à faire au chargement de
//   la page, avant la carte des IA et la course) ; DIVISIONS.retablir() : les réglages de base
// - DIVISIONS.facteur(ch, cle), DIVISIONS.echelle(x, ch, cle) : l'argent (gains, sponsors) et les prix du garage selon la division
// - DIVISIONS.finSaison(ch, entree, placeJoueur) : la montée (une fois par saison, saisons.js : terminerSaison) ; renvoie la nouvelle
//   division si le joueur monte, sinon null
// (tour 50d) chaque division a son PLATEAU (10 écuries, 20 pilotes) ; ch.pilotes et ch.ecuries restent le plateau où court le joueur
// (ch.plateau = sa division) : tout le reste du jeu (championnat, journal, fiches, contrats, transferts) le lit comme avant.
// - ch.plateaux[d] : les plateaux des autres divisions (créés à la montée, avec la graine : creerPlateau) ; un plateau quitté y est
//   gardé avec les noms de son dernier jour (noms), ses saisons (saisons [première, dernière]), ses compteurs (rivaux, duelCarriere,
//   patrons, courrier) ; ch.parcours : [[première saison, division]] (une vieille sauvegarde : son plateau unique depuis la saison 1)
// - enAttente(ch) : le joueur est monté (finSaison) mais court encore sur l'ancien plateau (la fin de saison, les contrats) ;
//   vueContrats(ch) : le championnat vu depuis le plateau d'en haut (les offres, l'écran des contrats)
// - changerPlateau(ch, ecurie) : à la saison suivante (saisons.js : nouvelleSaison), le joueur passe sur le plateau d'en haut dans
//   l'écurie signée ; les rivaux classés dans les DIVISION_MONTEE_PLACE premiers montent avec lui, les plus faibles d'en haut descendent
// - vueSaison(ch, s) : le championnat tel qu'il était pendant la saison s (l'album des unes, l'historique)
const DIVISIONS = (function () {
  const R = REGLAGES;
  const BASE = { NIVEAU: R.NIVEAU, PUISSANCE: R.PUISSANCE, FORCE_MOTEUR_MAX: R.FORCE_MOTEUR_MAX, ADHERENCE: R.ADHERENCE };

  function completer(ch) {
    if (ch && ![1, 2, 3, 4].includes(ch.division)) ch.division = R.DIVISION_VIEILLE;
    if (ch && ch.pilotes) {   // (tour 50d) une sauvegarde d'avant les plateaux : son plateau unique est celui de sa division
      if (![1, 2, 3, 4].includes(ch.plateau)) ch.plateau = ch.division;
      if (!ch.plateaux || typeof ch.plateaux !== 'object') ch.plateaux = {};
      if (!Array.isArray(ch.parcours)) ch.parcours = [[1, ch.plateau]];
    }
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
    if (R.DIVISION_PLATEAUX && ch.pilotes) preparer(ch, ch.division);   // (tour 50d) le plateau d'en haut existe dès la montée (les offres)
    else if (ch.pilotes) ch.plateau = ch.division;   // (plateaux coupés : le même plateau monte, comme au tour 49d)
    return ch.division;
  }

  // --- (tour 50d) les plateaux ---
  const PLACES = [1, 2, 3, 4];
  // tous les numéros pris, sur tous les plateaux (deux pilotes n'ont jamais le même numéro, même dans deux divisions)
  function numerosPris(ch) {
    const pris = new Set((ch.pilotes || []).map(p => p.numero));
    for (const d of Object.keys(ch.plateaux || {})) for (const p of ch.plateaux[d].pilotes || []) pris.add(p.numero);
    return pris;
  }

  // un plateau neuf pour la division d, tiré avec la graine du championnat (le même à chaque fois) : les 10 écuries de ECURIES (mêmes
  // niveaux, mêmes couleurs ; leur numéro continue ceux des divisions d'en dessous : la D4 a 1 à 10, la D3 11 à 20…), 20 pilotes IA
  // sans nom (le nom par défaut, « Pilote N », comme les pilotes d'aujourd'hui), chacun un numéro libre, un caractère, un âge, un casque
  function creerPlateau(ch, d) {
    const pris = numerosPris(ch), ecuries = R.ECURIES.map((e, i) => ({ id: i, nom: null, numero: (4 - d) * R.ECURIES.length + i + 1, niveau: e.niveau, couleur: e.couleur, points: 0, titres: 0 }));
    const pilotes = [];
    ALEATOIRE.semer((ch.graine || 0) + R.GRAINE_PLATEAUX + 101 * d);
    for (const e of ecuries) for (let j = 0; j < 2; j++) {
      let numero = 2 + Math.floor(hasard() * 97);
      while (pris.has(numero)) numero = numero % 99 + 1;
      pris.add(numero);
      const c = tirerCaractere(1);
      pilotes.push({ id: pilotes.length, nom: null, numero, ecurie: e.id, humain: false, caractere: { regularite: c.regularite, agressivite: c.agressivite, erreurs: c.erreurs },
        places: [], stats: { courses: 0, victoires: 0, podiums: 0, poles: 0, meilleursTours: 0, points: 0, titres: 0, saisons: 0 },
        age: R.AGE_DEPART[0] + Math.floor(hasard() * (R.AGE_DEPART[1] - R.AGE_DEPART[0] + 1)), rythme: 1 });
    }
    ALEATOIRE.semer();
    // les casques : tous différents de ceux déjà en piste (casque.js ne remplit que ceux qui manquent)
    if (typeof CASQUE !== 'undefined') CASQUE.completer({ graine: (ch.graine || 0) + 101 * d, pilotes: (ch.pilotes || []).map(p => ({ casque: p.casque || null })).concat(pilotes) });   // (des copies : ceux d'en bas ne changent pas)
    return { ecuries, pilotes };
  }
  function preparer(ch, d) {
    completer(ch);
    if (!ch.plateaux[d] && d !== ch.plateau) ch.plateaux[d] = creerPlateau(ch, d);
    return ch.plateaux[d];
  }

  // le joueur est monté et court encore (fin de saison, contrats) sur le plateau d'en bas
  function enAttente(ch) {
    return !!(R.DIVISIONS_ACTIVES && R.DIVISION_PLATEAUX && ch && ch.pilotes && PLACES.includes(ch.plateau) && ch.division !== ch.plateau);
  }
  // le championnat vu depuis le plateau où le joueur courra (les offres de contrat, leur écran) ; ch lui-même hors montée
  function vueContrats(ch) {
    if (!enAttente(ch)) return ch;
    const P = preparer(ch, ch.division);
    if (!P.patrons) P.patrons = {};
    return Object.assign({}, ch, { pilotes: P.pilotes, ecuries: P.ecuries, patrons: P.patrons, vueDivision: ch.division });
  }

  function echanger(A, ka, B, kb) {
    const pa = A.pilotes[ka], pb = B.pilotes[kb], ea = pa.ecurie, eb = pb.ecurie;
    A.pilotes[ka] = pb; pb.id = ka; pb.ecurie = ea;
    B.pilotes[kb] = pa; pa.id = kb; pa.ecurie = eb;
  }

  // deux places d'un même plateau échangées (chacun garde son écurie) ; ses compteurs par indice suivent
  function permuter(P, a, b) {
    [P.pilotes[a], P.pilotes[b]] = [P.pilotes[b], P.pilotes[a]];
    P.pilotes[a].id = a; P.pilotes[b].id = b;
    for (const o of [P.rivaux, P.duelCarriere]) if (o) { const x = o[a], y = o[b]; delete o[a]; delete o[b]; if (y !== undefined) o[a] = y; if (x !== undefined) o[b] = x; }
  }

  // la saison suivante commence sur le plateau d'en haut (saisons.js : nouvelleSaison, après l'évolution des rivaux d'en bas) ; ecurie :
  // celle signée (vueContrats), sinon la plus faible
  function changerPlateau(ch, ecurie) {
    if (!enAttente(ch)) return false;
    const d0 = ch.plateau, d1 = ch.division, P = preparer(ch, d1);
    const A = { pilotes: ch.pilotes, ecuries: ch.ecuries }, j = ch.pilotes.find(p => p.humain);
    const debut = ch.parcours.length ? ch.parcours[ch.parcours.length - 1][0] : 1;
    // les noms du dernier jour (l'album et l'historique de ces saisons les relisent : vueSaison)
    const noms = ch.pilotes.map(p => [p.nom, p.numero, p.humain ? 1 : 0, p.ecurie, p.casque || null]);
    // qui monte avec le joueur : les rivaux classés dans les DIVISION_MONTEE_PLACE premiers de la saison close (pas un retraité de cette
    // fin de saison : sa place est déjà prise par un nouveau)
    const close = (ch.saisons || []).filter(s => s.saison === ch.saison)[0];
    const partis = new Set((ch.retraites || []).filter(r => r.saison === ch.saison && r.division === undefined).map(r => r.id));
    const montent = R.DIVISION_MONTEE_RIVAUX && close ? close.classement.slice(0, R.DIVISION_MONTEE_PLACE).map(c => c[0]).filter(k => ch.pilotes[k] && !ch.pilotes[k].humain && !partis.has(k)) : [];
    // la place du joueur en haut : le pilote qui part de l'écurie signée (celui qui n'est pas son coéquipier : saisons.js, coequipierDans)
    const e1 = typeof ecurie === 'number' && P.ecuries[ecurie] ? ecurie : P.ecuries.map(e => e.id).sort((a, b) => P.ecuries[a].niveau - P.ecuries[b].niveau || b - a)[0];
    const deux = P.pilotes.filter(p => p.ecurie === e1).sort((a, b) => b.stats.points - a.stats.points || a.id - b.id), partant = deux[deux.length - 1];
    // ceux qui descendent à la place des rivaux qui montent : les plus faibles d'en haut (rythme × niveau de l'écurie), jamais le partant
    const faibles = P.pilotes.filter(p => p !== partant).sort((a, b) => (a.rythme || 1) * P.ecuries[a.ecurie].niveau - (b.rythme || 1) * P.ecuries[b.ecurie].niveau || b.id - a.id);
    const vers = {};   // ancien indice → nouvel indice, pour ceux qui montent
    const kj = j.id, dernier = P.pilotes.length - 1;
    echanger(A, kj, P, partant.id);
    // le joueur reste la DERNIÈRE voiture (simulation.js : creerCourseIA, la voiture k = le pilote k, l'humain est la dernière)
    if (j.id !== dernier) permuter(P, j.id, dernier);
    vers[kj] = j.id;
    montent.forEach((k, i) => { vers[k] = faibles[i].id; echanger(A, k, P, faibles[i].id); });
    // les compteurs par pilote (fiche : ch.rivaux ; le duel : ch.duel.carriere) : ceux des pilotes qui montent les suivent, le reste
    // reste avec le plateau d'en bas
    const suivre = (obj, reste) => { const neuf = Object.assign({}, reste || {}); for (const k of Object.keys(obj || {})) if (vers[k] !== undefined) { neuf[vers[k]] = obj[k]; delete obj[k]; } return neuf; };
    const rivaux = suivre(ch.rivaux, P.rivaux), carriere = suivre(ch.duel && ch.duel.carriere, P.duelCarriere);
    for (const r of ch.retraites || []) if (r.division === undefined) r.division = d0;   // les retraités d'en bas, à leur plateau
    ch.plateaux[d0] = { pilotes: A.pilotes, ecuries: A.ecuries, noms, saisons: [debut, ch.saison], rivaux: ch.rivaux || {}, duelCarriere: (ch.duel && ch.duel.carriere) || {}, patrons: ch.patrons || {}, courrier: ch.courrier || null };
    delete ch.plateaux[d1];
    ch.pilotes = P.pilotes; ch.ecuries = P.ecuries; ch.patrons = P.patrons || {}; ch.rivaux = rivaux;
    ch.courrier = P.courrier || undefined;
    if (ch.duel) ch.duel.carriere = carriere;
    ch.plateau = d1;
    ch.parcours.push([ch.saison + 1, d1]);
    return true;
  }

  // le championnat tel qu'il était pendant la saison s : sur un plateau quitté, ses noms du dernier jour, ses écuries, ses retraités ;
  // sinon ch (ses retraités d'ailleurs mis de côté)
  function vueSaison(ch, s) {
    if (!ch || !ch.plateaux) return ch;
    for (const d of Object.keys(ch.plateaux)) {
      const A = ch.plateaux[d];
      if (!A.noms || !A.saisons || s < A.saisons[0] || s > A.saisons[1]) continue;
      const pilotes = A.noms.map((x, k) => ({ id: k, nom: x[0], numero: x[1], humain: !!x[2], ecurie: x[3], casque: x[4], stats: {}, places: [] }));
      return Object.assign({}, ch, { pilotes, ecuries: A.ecuries, retraites: (ch.retraites || []).filter(r => r.division === Number(d)) });
    }
    if (!(ch.retraites || []).some(r => r.division !== undefined && r.division !== ch.plateau)) return ch;
    return Object.assign({}, ch, { retraites: ch.retraites.filter(r => r.division === undefined || r.division === ch.plateau) });
  }
  // la saison s a-t-elle été courue sur le plateau d'aujourd'hui ? (les indices de pilotes de son historique valent pour ch.pilotes)
  function saisonIci(ch, s) {
    const P = ch && ch.parcours;
    return !Array.isArray(P) || !P.length || s >= P[P.length - 1][0];
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

  return { completer, de, regles, appliquer, retablir, finSaison, facteur, echelle, BASE, creerPlateau, preparer, enAttente, vueContrats, changerPlateau, vueSaison, saisonIci, numerosPris };
})();
