// La qualification du joueur (étape 5), en calcul pur : un tour lancé, seul sur la piste, chronométré de la ligne à
// la ligne (course.js fait le reste) ; un virage coupé l'invalide. Puis la grille avec tous les temps : ceux des IA
// (simplifiés, simulation.js : qualifier) et celui du joueur ; tour passé ou invalide = dernier.
const QUALIFICATION = (function () {
  const R = REGLAGES;

  // le tour du joueur : sa voiture v est posée QUALIF_LANCEMENT m avant la ligne, à l'arrêt ; le chrono part à la ligne
  function creer(circuit, v) {
    const course = creerCourse(circuit, 1);
    placerSurPiste(v, circuit, circuit.longueur - R.QUALIF_LANCEMENT, 0);
    // progressionLigne : la progression (course.js) au passage de la ligne ; fin : la distance depuis la ligne à l'arrivée (fantôme)
    return { circuit, course, lance: false, fini: false, valide: false, temps: null, progressionLigne: 0, fin: null };
  }

  // à chaque pas de physique, après pasVoiture ; renvoie true quand le tour est fini
  function pas(q, v, dt) {
    const c = q.course;
    majCourse(c, v, dt);
    // la ligne passée une première fois : le tour lancé commence là (le chrono de course.js partait au premier mouvement)
    if (!q.lance && c.etape === 0) { q.lance = true; c.debutTour = c.temps; c.secteursTour = []; c.coupeTour = false; q.progressionLigne = c.progression; q.penalitesLigne = c.penalites; }
    if (c.etat === 'finie' && !q.fini) {
      q.fini = true;
      const t = c.tours[0];
      q.valide = !t.coupe;
      q.temps = q.valide ? t.temps : null;
      q.fin = c.progression - q.progressionLigne;
      // le tournoi chrono (tournoi.js) : le temps du tour même coupé, et les pénalités du tour lancé (course.js : PENALITE_COUPE par virage coupé)
      q.tour = t.temps;
      q.penalites = c.penalites - (q.penalitesLigne || 0);
    }
    return q.fini;
  }

  // pendant le tour lancé (fantome.js) : la distance depuis la ligne (m) et le chrono du tour (s)
  function distance(q) { return q.course.progression - q.progressionLigne; }
  function chrono(q) { return q.course.temps - q.course.debutTour; }

  // la grille avec le temps du joueur (null : tour passé ou invalide, il part dernier) ; e : la course à plusieurs,
  // dont les IA ont déjà leur temps (qualifier). Chaque voiture est posée à sa place ; renvoie la place du joueur (1 = pole)
  function grille(e, tempsJoueur) {
    const c = e.circuit;
    for (const p of e.pilotes) if (p.humain) p.qualif = tempsJoueur;
    const ordre = e.pilotes.slice().sort((a, b) => (a.qualif === null) - (b.qualif === null) || a.qualif - b.qualif);
    const places = placesGrille(c, ordre.length);
    ordre.forEach((p, k) => {
      placerSurPiste(p.v, c, places[k].s, places[k].d);
      p.depart = places[k].s - c.longueur;
      if (p.pilote) p.pilote.grille = p.v.piste.d;   // l'IA part dans sa nouvelle file
    });
    e.devant.clear();
    e.grille = ordre.map(p => ({ numero: p.numero, qualif: p.qualif }));
    return ordre.findIndex(p => p.humain) + 1;
  }

  // l'écart du joueur à la pole (s), null s'il n'a pas de temps
  function ecartPole(e) {
    const moi = e.grille.find(g => e.pilotes[g.numero - 1].humain);
    return moi && moi.qualif !== null ? moi.qualif - e.grille[0].qualif : null;
  }

  return { creer, pas, grille, ecartPole, distance, chrono };
})();
