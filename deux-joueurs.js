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

  return { cibles, remise, nbIAValide, nbToursValide, creer, placerGrille, finie, joueurs };
})();
