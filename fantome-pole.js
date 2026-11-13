// Le fantôme du poleman (tour 55, T6 ; CLAUDE.md « Le fantôme du meilleur tour », « Plus tard »). En qualification, au lieu de son propre
// record, le joueur peut rejouer contre le tour du pilote IA en pole. On SIMULE ce tour (une seule IA, seule sur la piste, parfaitement
// régulière : sans caractère ni erreur), parti de la même place que le joueur (QUALIF_LANCEMENT m avant la ligne, à l'arrêt), avec le rythme
// et la façon de piloter du poleman. T11 : un tour d'élan, puis le tour chronométré lancé (FANTOME_POLE_LANCE) ; la voiture ne sait pas faire le temps
// estimé de la grille (~16 % de plus, même à rythme + 20 %), donc le tour simulé est étiré à ce temps (FANTOME_POLE_ETIRER, écart à la pole 0). Calcul pur (aucun dessin), déterministe (aucun
// hasard : les IA sont déjà tirées), une seule fois par plateau, seulement quand le joueur choisit ce fantôme. FANTOME_POLEMAN faux = rien.
//   FANTOME_POLE.tour(e)   → le fantôme compact (comme fantome.js, FANTOME.charger) ou null (réglage faux, carte pas prête, pas d'IA en pole)
const FANTOME_POLE = (function () {
  const R = REGLAGES;
  function tour(e) {
    if (!R.FANTOME_POLEMAN || !e || !e.carte || !e.grille || !e.grille.length) return null;
    const pole = e.pilotes[e.grille[0].numero - 1];
    if (!pole || pole.humain || !pole.pilote || !(pole.qualif > 0)) return null;
    // une course neuve d'une seule IA (donnerCarte la range et lui tire un pilote ; on le remplace par celui du poleman, sans erreur)
    const m = creerCourseIA(e.circuit, 1, R.FANTOME_POLE_LANCE ? 3 : 1, e.graine + R.GRAINE_FANTOME_POLE, e.carte);
    const p = m.pilotes[0], src = pole.pilote;
    p.rythme = pole.rythme;
    p.pilote = creerPilote(e.carte, pole.forme === undefined ? pole.rythme : pole.rythme * pole.forme, src.style, 0);
    for (const k of ['limite', 'bordMin', 'penaliteFrein']) if (src[k] !== undefined) p.pilote[k] = src[k];
    p.course.compte = 0;
    const q = QUALIFICATION.creer(e.circuit, p.v);   // la voiture au départ lancé du joueur
    p.pilote.grille = p.v.piste.d;
    // FANTOME_POLE_LANCE (T11) : un tour d'élan, puis le tour chronométré (le vrai tour lancé d'un poleman, qui passe la ligne à pleine vitesse) ;
    // faux : le tour part de l'arrêt, 250 m avant la ligne (T6, 8 s plus lent que la pole)
    const lance = !!R.FANTOME_POLE_LANCE;
    if (lance) q.course = creerCourse(e.circuit, 2);
    const f = FANTOME.commencer(), dt = R.PAS_PHYSIQUE, max = Math.round(R.FANTOME_POLE_DUREE_MAX / dt);
    let tour = null;   // le tour chronométré : { debut (la progression à la ligne), temps, coupe, penalites }
    for (let k = 0; k < max && !q.fini; k++) {
      pasCourseIA(m, dt);
      const avant = q.fini, c = q.course, nAvant = c.tours.length;
      const fini = QUALIFICATION.pas(q, p.v, dt);
      if (!lance) {
        if (q.lance && !avant) FANTOME.noter(f, fini ? q.temps : QUALIFICATION.chrono(q), p.v, fini ? q.fin : QUALIFICATION.distance(q));
      } else if (c.tours.length === 1 && nAvant === 0) {
        tour = { debut: c.progression, penalites: c.penalites };
        FANTOME.noter(f, 0, p.v, 0);   // le tour d'élan est fini : le tour chronométré commence ici
      } else if (tour && !avant) {
        const t = fini ? c.tours[1].temps : c.temps - c.debutTour, s = c.progression - tour.debut;
        FANTOME.noter(f, t, p.v, s);
        if (fini) { q.temps = c.tours[1].temps; q.valide = !c.tours[1].coupe; q.fin = s; }
      }
    }
    if (!q.fini || !q.valide || !(q.temps > 0)) return null;
    const c = FANTOME.compacter(f, q.temps, q.fin);
    c.pole = { lance, numero: pole.numero, simule: Math.round(q.temps * 1000) / 1000, grille: Math.round(pole.qualif * 1000) / 1000 };
    // FANTOME_POLE_ETIRER : même parcours, mais la durée du temps de qualification de la grille (le tour simulé, lancé ou non, dure plus que l'estimation
    // de la grille : environ 16 % sur le technique) ; faux : le tour simulé tel quel, atteignable
    if (R.FANTOME_POLE_ETIRER) { c.pas = c.pas * (pole.qualif / q.temps); c.temps = c.pole.grille; }
    return c;
  }
  return { tour };
})();
