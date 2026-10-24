// Le mode 2 joueurs (CLAUDE.md « Le mode 2 joueurs (écran partagé) »), en calcul pur : deux voitures pilotées par des
// joueurs dans une course normale (le même code de course, d'IA et de physique : simulation.js, course.js, depart.js),
// les touches de chaque joueur lues par leur place sur le clavier (e.code : W A S D = Z Q S D en AZERTY ; les flèches),
// la grille tirée au sort avec les deux joueurs côte à côte, 3 ou 5 tours, 0, 3 ou 5 IA, jamais plus de DEUX_VOITURES_MAX
// voitures. Un mode à part de la carrière : il ne touche ni au championnat, ni à l'argent, ni aux records. Les réglages
// sont DEUX_* (donnees.js), les touches TOUCHES_DEUX.
//
//   DEUX_JOUEURS.cibles(enfoncees, j)   → { gaz, frein, direction } du joueur j (1 ou 2) depuis l'ensemble des e.code enfoncés
//   DEUX_JOUEURS.remise(enfoncees, j)   → la touche « retour en piste » du joueur j est enfoncée
//   DEUX_JOUEURS.creer(circuit, nbIA, nbTours, graine, carte)   → la course (creerCourseIA) avec deux humains (p.joueur = 1, 2)
//   DEUX_JOUEURS.placerGrille(e)        → la grille tirée au sort (graine de la course), les deux joueurs côte à côte
//   DEUX_JOUEURS.finie(e)               → les deux joueurs sont arrivés (ou tout le monde)
const DEUX_JOUEURS = (function () {
  const R = REGLAGES;

  const appui = (enfoncees, codes) => codes.some(c => enfoncees.has(c));

  // les commandes d'un joueur depuis les touches enfoncées (un Set de e.code) ; l'autre joueur n'y voit rien
  function cibles(enfoncees, j) {
    const T = R.TOUCHES_DEUX[j];
    return { gaz: appui(enfoncees, T.gaz) ? 1 : 0, frein: appui(enfoncees, T.frein) ? 1 : 0, direction: (appui(enfoncees, T.droite) ? 1 : 0) - (appui(enfoncees, T.gauche) ? 1 : 0) };
  }

  function remise(enfoncees, j) {
    return appui(enfoncees, R.TOUCHES_DEUX[j].remise);
  }

  // le nombre d'IA permis (DEUX_IA_CHOIX), jamais plus de DEUX_VOITURES_MAX − 2 ; le nombre de tours permis (DEUX_TOURS_CHOIX)
  function nbIAValide(n) {
    const c = R.DEUX_IA_CHOIX.includes(n) ? n : R.DEUX_IA_CHOIX[0];
    return Math.min(c, R.DEUX_VOITURES_MAX - 2);
  }
  function nbToursValide(n) {
    return R.DEUX_TOURS_CHOIX.includes(n) ? n : R.DEUX_TOURS_CHOIX[0];
  }

  // la course : creerCourseIA avec nbIA + 1 voitures IA et le joueur 2 en dernier (humain), puis la dernière IA devient
  // le joueur 1 : deux humains, p.joueur = 1 et 2 ; carte : null tant qu'elle se calcule (donnerCarte plus tard)
  function creer(circuit, nbIA, nbTours, graine, carte) {
    const n = nbIAValide(nbIA);
    const e = creerCourseIA(circuit, n + 1, nbToursValide(nbTours), graine, carte, true);
    const j1 = e.pilotes[n], j2 = e.pilotes[n + 1];
    j1.humain = true; j1.pilote = null; j1.rythme = null; j1.joueur = 1;
    j2.joueur = 2;
    j1.qualif = null; j2.qualif = null;
    e.deux = true;
    if (e.carte) placerGrille(e);
    return e;
  }

  // la grille tirée au sort (graine + GRAINE_GRILLE_DEUX), tous mélangés, puis les deux joueurs mis côte à côte : la place
  // du joueur 1 est tirée, le joueur 2 juste à côté (la place suivante, dans l'autre file) ; chaque voiture est posée à sa place
  function placerGrille(e) {
    if (!e.pilotes.every(p => p.v.u === 0)) return false;   // quelqu'un a bougé : trop tard
    const c = e.circuit, P = e.pilotes, n = P.length;
    ALEATOIRE.semer(e.graine + R.GRAINE_GRILLE_DEUX);
    const ia = P.filter(p => !p.humain);
    for (let i = ia.length - 1; i > 0; i--) { const k = Math.floor(hasard() * (i + 1)); [ia[i], ia[k]] = [ia[k], ia[i]]; }
    const place1 = Math.floor(hasard() * (n - 1));   // 0 … n−2 : la place du joueur 1, le joueur 2 à place1 + 1
    ALEATOIRE.semer();
    const ordre = [];
    let i = 0;
    for (let k = 0; k < n; k++) {
      if (k === place1) ordre.push(P.find(p => p.joueur === 1));
      else if (k === place1 + 1) ordre.push(P.find(p => p.joueur === 2));
      else ordre.push(ia[i++]);
    }
    const places = placesGrille(c, n);
    ordre.forEach((p, k) => {
      placerSurPiste(p.v, c, places[k].s, places[k].d);
      p.depart = places[k].s - c.longueur;
      if (p.pilote) p.pilote.grille = p.v.piste.d;
    });
    e.devant.clear();
    e.grille = ordre.map(p => ({ numero: p.numero, qualif: null }));
    return true;
  }

  // les deux joueurs sont arrivés (ou toutes les voitures)
  function finie(e) {
    return e.pilotes.filter(p => p.humain).every(p => p.arrivee !== null);
  }

  // les joueurs de la course, dans l'ordre 1, 2
  function joueurs(e) {
    return [1, 2].map(j => e.pilotes.find(p => p.joueur === j));
  }

  // --- les réglages du mode (l'écran avant la course, tour 25b ordre 3), gardés dans la sauvegarde unique à part de la carrière
  // (SAUVEGARDE.deux) : { joueurs: [{ nom, couleur, casque }, …] (joueur 1, joueur 2), circuit, tours, ia, niveau, courses (le
  // nombre de courses lancées : la graine de la suivante), rivalite: { noms: [a, b], score: [x, y] } ou null }
  const couleurValide = c => R.DEUX_COULEURS_CHOIX.includes(c);
  const casqueValide = c => !!c && typeof c === 'object' && R.CASQUE_MOTIFS.includes(c.motif) && Array.isArray(c.couleurs) && c.couleurs.length === 3 && c.couleurs.every(x => Number.isInteger(x) && x >= 0 && x <= 0xffffff);
  const nomPropre = n => typeof n === 'string' ? n.trim().slice(0, R.NOM_LONGUEUR_MAX) : '';

  // des réglages complets à partir de ce qui est sauvegardé (null, abîmé ou d'une ancienne version : chaque champ manquant
  // ou faux prend sa valeur par défaut) ; ne change pas l'objet donné
  function completer(r) {
    const d = r && typeof r === 'object' ? r : {};
    const js = Array.isArray(d.joueurs) ? d.joueurs : [];
    const joueurs = [0, 1].map(i => {
      const j = js[i] && typeof js[i] === 'object' ? js[i] : {};
      return { nom: nomPropre(j.nom), couleur: couleurValide(j.couleur) ? j.couleur : R.DEUX_COULEURS[i], casque: casqueValide(j.casque) ? { motif: j.casque.motif, couleurs: j.casque.couleurs.slice() } : { motif: R.DEUX_CASQUES[i].motif, couleurs: R.DEUX_CASQUES[i].couleurs.slice() } };
    });
    if (joueurs[0].couleur === joueurs[1].couleur) joueurs[1].couleur = R.DEUX_COULEURS_CHOIX.find(c => c !== joueurs[0].couleur);
    const riv = d.rivalite && Array.isArray(d.rivalite.noms) && d.rivalite.noms.length === 2 && Array.isArray(d.rivalite.score) && d.rivalite.score.length === 2 && d.rivalite.score.every(x => Number.isInteger(x) && x >= 0)
      ? { noms: d.rivalite.noms.map(String), score: d.rivalite.score.slice() } : null;
    return {
      joueurs,
      circuit: Object.prototype.hasOwnProperty.call(CIRCUITS, d.circuit) ? d.circuit : 'test',
      tours: R.DEUX_TOURS_CHOIX.includes(d.tours) ? d.tours : R.DEUX_TOURS_CHOIX[0],
      ia: R.DEUX_IA_CHOIX.includes(d.ia) ? nbIAValide(d.ia) : nbIAValide(R.DEUX_IA_DEFAUT),
      niveau: Object.prototype.hasOwnProperty.call(R.NIVEAUX, d.niveau) ? d.niveau : R.DEUX_NIVEAU,
      courses: Number.isInteger(d.courses) && d.courses >= 0 ? d.courses : 0,
      rivalite: riv,
    };
  }

  // les choix de l'écran vérifiés : un nom vide prend le nom par défaut (defauts : [« Joueur 1 », « Joueur 2 »] de textes.js) ;
  // deux noms pareils (sans compter majuscules et espaces) ou deux couleurs pareilles sont refusés ; le reste est complété
  // → { ok, erreurs: ['nom', 'couleur'], reglages }
  function valider(choix, defauts) {
    const r = completer(choix);
    r.joueurs.forEach((j, i) => { if (!j.nom) j.nom = nomPropre(defauts[i]); });
    const erreurs = [];
    if (r.joueurs[0].nom.toLowerCase() === r.joueurs[1].nom.toLowerCase()) erreurs.push('nom');
    const c = choix && Array.isArray(choix.joueurs) ? choix.joueurs.map(j => j && j.couleur) : [];
    if (c.length === 2 && c[0] === c[1]) erreurs.push('couleur');
    return { ok: erreurs.length === 0, erreurs, reglages: r };
  }

  // le score de la rivalité pour ces deux noms (dans l'ordre joueur 1, joueur 2) : [0, 0] si les noms ont changé (le score
  // suit les deux noms, même si les joueurs ont échangé leur place)
  function scoreRivalite(riv, noms) {
    if (!riv) return [0, 0];
    if (riv.noms[0] === noms[0] && riv.noms[1] === noms[1]) return riv.score.slice();
    if (riv.noms[0] === noms[1] && riv.noms[1] === noms[0]) return [riv.score[1], riv.score[0]];
    return [0, 0];
  }

  // la rivalité après une course : gagnant = 0 (le joueur 1 a fini devant), 1 (le joueur 2), null (personne) ; remise à 0 si un
  // nom a changé ; un nouvel objet { noms, score }
  function ajouterRivalite(riv, noms, gagnant) {
    const score = scoreRivalite(riv, noms);
    if (gagnant === 0 || gagnant === 1) score[gagnant]++;
    return { noms: noms.slice(), score };
  }

  // qui a fini devant au classement final (classementFinal, pénalités comprises) : 0 (joueur 1), 1 (joueur 2), null si aucun
  function gagnant(e, final) {
    const [p1, p2] = joueurs(e), k1 = e.pilotes.indexOf(p1), k2 = e.pilotes.indexOf(p2);
    const a = final.find(x => x.k === k1), b = final.find(x => x.k === k2);
    if (!a && !b) return null;
    if (!b) return 0;
    if (!a) return 1;
    return a.place < b.place ? 0 : 1;
  }

  return { cibles, remise, nbIAValide, nbToursValide, creer, placerGrille, finie, joueurs, completer, valider, scoreRivalite, ajouterRivalite, gagnant };
})();
