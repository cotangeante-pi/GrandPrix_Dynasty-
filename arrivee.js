// Après l'arrivée du joueur (course contre les IA), en calcul pur : la voiture que la caméra télé suit en attendant
// les autres, et le moment où le podium peut venir (toutes les voitures arrivées, ou ARRIVEE_ATTENTE_MAX secondes).
const ARRIVEE = (function () {
  const R = REGLAGES;

  // e : la course à plusieurs (simulation.js) ; attente : les secondes de course depuis l'arrivée du joueur
  function podiumPret(e, attente) {
    return e.pilotes.every(p => p.arrivee !== null) || attente >= R.ARRIVEE_ATTENTE_MAX;
  }

  // la voiture à suivre (son indice dans e.pilotes, ou null s'il n'y en a plus) : on garde celle qu'on suit tant
  // qu'elle n'a pas passé la ligne ; sinon, la bagarre (deux voitures à moins d'ARRIVEE_BAGARRE m) la plus proche de
  // l'arrivée, et faute de bagarre, la voiture la plus proche de l'arrivée
  function voitureTele(e, actuelle) {
    const P = e.pilotes;
    if (actuelle !== null && P[actuelle] && P[actuelle].arrivee === null) return actuelle;
    const enCourse = P.map((p, k) => k).filter(k => P[k].arrivee === null)
      .sort((a, b) => distanceCourse(P[b]) - distanceCourse(P[a]));
    if (!enCourse.length) return null;
    for (let i = 0; i + 1 < enCourse.length; i++) {
      if (distanceCourse(P[enCourse[i]]) - distanceCourse(P[enCourse[i + 1]]) < R.ARRIVEE_BAGARRE) return enCourse[i];
    }
    return enCourse[0];
  }

  // « passer » la vue télé (CLAUDE.md « La course ») : le reste de la course est vraiment joué, en accéléré. Une image fait jusqu'à
  // nbPas pas de physique (unPas : le même pas que celui de la boucle, rien d'autre), sans dépasser msMax millisecondes (l'horloge
  // maintenant(), relue tous les ARRIVEE_PAS_CONTROLE pas), et s'arrête dès que le podium est prêt (podiumPret, depuis l'arrivée
  // « arrivee », en secondes de course) : les places et les temps sont ceux qu'on aurait eus en regardant. → { pas, pret }
  // suivi (en accéléré, CLAUDE.md « La course ») : { prog, t } la distance de chaque voiture et l'instant (s de course) où elle a avancé
  // pour la dernière fois ; le podium est prêt quand chaque voiture est arrivée ou bloquée (ARRIVEE_BLOQUEE) ; sans suivi : podiumPret
  function accelerer(e, unPas, nbPas, msMax, arrivee, maintenant, suivi) {
    const t0 = maintenant(), pret = () => suivi ? podiumPretAccelere(e, suivi) : podiumPret(e, e.temps - arrivee);
    let n = 0;
    while (n < nbPas && !pret()) {
      unPas();
      n++;
      if (suivi) suivreBloquees(e, suivi);
      if (n % R.ARRIVEE_PAS_CONTROLE === 0 && maintenant() - t0 >= msMax) break;
    }
    return { pas: n, pret: pret() };
  }

  // le suivi des voitures bloquées : une voiture qui avance de plus de ARRIVEE_BLOQUEE_DISTANCE m repart de l'instant présent
  function creerSuivi(e) {
    const suivi = { prog: [], t: [] };
    suivreBloquees(e, suivi);
    return suivi;
  }
  function suivreBloquees(e, suivi) {
    e.pilotes.forEach((p, k) => {
      const d = distanceCourse(p);
      if (suivi.prog[k] === undefined || d > suivi.prog[k] + R.ARRIVEE_BLOQUEE_DISTANCE) { suivi.prog[k] = d; suivi.t[k] = e.temps; }
    });
  }
  // en accéléré : toutes les voitures arrivées, sauf celles bloquées depuis ARRIVEE_BLOQUEE s de course
  function podiumPretAccelere(e, suivi) {
    return e.pilotes.every((p, k) => p.arrivee !== null || e.temps - suivi.t[k] >= R.ARRIVEE_BLOQUEE);
  }

  // les voitures encore en course (pour l'affichage « ⏩ »)
  function restantes(e) {
    return e.pilotes.filter(p => p.arrivee === null).length;
  }

  return { podiumPret, voitureTele, accelerer, restantes, creerSuivi, podiumPretAccelere };
})();
