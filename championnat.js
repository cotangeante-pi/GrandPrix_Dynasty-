// Le championnat, en calcul pur (ni Three.js ni page) : les 10 écuries et les 20 pilotes fixes (le joueur compris),
// le calendrier des Grands Prix, les points, les classements pilotes et écuries, et les statistiques de carrière.
// Tous les réglages (points, écuries, noms, calendrier) sont dans donnees.js. La sauvegarde passe par sauvegarde.js.
const CHAMPIONNAT = (function () {
  const R = REGLAGES;

  function statsVierges() {
    return { courses: 0, victoires: 0, podiums: 0, poles: 0, meilleursTours: 0, points: 0 };
  }

  // un nouveau championnat : chaque écurie aligne deux pilotes (le joueur est le 2e de l'écurie ECURIE_JOUEUR) ; chaque
  // pilote IA reçoit son caractère (ia.js), tiré une fois pour toutes avec la graine du championnat
  function creer(graine) {
    const ecuries = R.ECURIES.map((e, i) => ({ id: i, nom: e.nom || null, niveau: e.niveau, couleur: e.couleur, points: 0 }));   // nom null : texte('ecurie') + numéro (interface.js)
    const pilotes = [];
    ALEATOIRE.semer(graine + R.GRAINE_CHAMPIONNAT);
    for (const e of ecuries) {
      for (let j = 0; j < 2; j++) {
        const humain = e.id === R.ECURIE_JOUEUR && j === 1;
        const c = humain ? null : tirerCaractere(1);
        pilotes.push({
          id: pilotes.length, nom: (humain ? R.NOM_JOUEUR : R.NOMS_PILOTES[pilotes.length]) || null, numero: pilotes.length + 1,   // nom null : le nom par défaut de textes.js (interface.js)
          ecurie: e.id, humain,
          caractere: c && { regularite: c.regularite, agressivite: c.agressivite, erreurs: c.erreurs },
          places: [],   // sa place à chaque Grand Prix (pour départager les égalités)
          stats: statsVierges(),
        });
      }
    }
    ALEATOIRE.semer();
    const calendrier = [];
    for (let i = 0; i < R.NB_GRANDS_PRIX; i++) calendrier.push({ numero: i + 1, circuit: R.CALENDRIER_CIRCUITS[i % R.CALENDRIER_CIRCUITS.length] });
    return { graine, saison: 1, prochain: 0, calendrier, ecuries, pilotes, resultats: [] };
  }

  function pointsPour(place) {
    return R.POINTS[place - 1] || 0;
  }

  // a passe-t-il devant b à points égaux ? plus de victoires, puis plus de 2es places, etc. ; enfin le plus petit id
  function departager(placesA, placesB, idA, idB) {
    for (let p = 1; p <= R.ECURIES.length * 2; p++) {
      const na = placesA.filter(x => x === p).length, nb = placesB.filter(x => x === p).length;
      if (na !== nb) return nb - na;
    }
    return idA - idB;
  }

  // une course finie : lignes = le classement final, dans l'ordre, [{ k (le pilote dans ch.pilotes), place, grille,
  // meilleurTour (s, ou null) }]. Points, places, statistiques ; puis le Grand Prix suivant
  function enregistrerCourse(ch, lignes) {
    let meilleur = null;
    for (const l of lignes) if (l.meilleurTour !== null && (meilleur === null || l.meilleurTour < meilleur.meilleurTour)) meilleur = l;
    for (const l of lignes) {
      const p = ch.pilotes[l.k], s = p.stats, pts = pointsPour(l.place);
      p.places.push(l.place);
      s.courses++;
      s.points += pts;
      if (l.place === 1) s.victoires++;
      if (l.place <= 3) s.podiums++;
      if (l.grille === 1) s.poles++;
      if (l === meilleur) s.meilleursTours++;
      ch.ecuries[p.ecurie].points += pts;
    }
    ch.resultats.push({ grandPrix: ch.prochain + 1, ordre: lignes.map(l => l.k) });
    ch.prochain++;
    return ch;
  }

  // la course finie, puis la sauvegarde (après chaque course)
  function finirGrandPrix(ch, lignes) {
    enregistrerCourse(ch, lignes);
    SAUVEGARDE.ecrireChampionnat(ch);
    return ch;
  }

  // le classement des pilotes : [{ k, points }] du premier au dernier
  function classementPilotes(ch) {
    return ch.pilotes.map(p => p.id)
      .sort((a, b) => ch.pilotes[b].stats.points - ch.pilotes[a].stats.points || departager(ch.pilotes[a].places, ch.pilotes[b].places, a, b))
      .map(k => ({ k, points: ch.pilotes[k].stats.points }));
  }

  // le classement des écuries : [{ id, points }] ; à points égaux, les meilleures places de leurs deux pilotes
  function classementEcuries(ch) {
    const places = id => ch.pilotes.filter(p => p.ecurie === id).flatMap(p => p.places);
    return ch.ecuries.map(e => e.id)
      .sort((a, b) => ch.ecuries[b].points - ch.ecuries[a].points || departager(places(a), places(b), a, b))
      .map(id => ({ id, points: ch.ecuries[id].points }));
  }

  // le niveau de l'écurie agit sur le rythme de chaque IA de la course e (la voiture k = le pilote k) : rythme × niveau.
  // À faire AVANT donnerCarte (le pilote et la qualification lisent le rythme). Le joueur garde sa voiture (FACTEUR_VOITURE_JOUEUR)
  function appliquerNiveaux(ch, e) {
    e.pilotes.forEach((p, k) => {
      const pilote = ch.pilotes[k];
      if (!pilote || p.humain || p.rythmeBase !== undefined) return;
      p.rythmeBase = p.rythme;
      p.rythme = p.rythme * ch.ecuries[pilote.ecurie].niveau;
    });
    return e;
  }

  // un Grand Prix simulé sans affichage (tests) : les 19 IA du championnat avec leur niveau d'écurie, et la voiture
  // du joueur conduite par le robot d'essai (immobile sur la grille, elle bloquerait les IA qui finissent leur tour) ;
  // renvoie la course (lignesDepuisCourse pour l'enregistrer)
  function simulerGrandPrix(ch, circuit, nbTours, graine) {
    const R = REGLAGES, nb = ch.pilotes.length - 1;
    const e = creerCourseIA(circuit, nb, nbTours, graine, null, true);
    appliquerNiveaux(ch, e);
    donnerCarte(e, carteDe(circuit));
    const robot = (p, dt) => appliquerCommandes(p.v, courseAutorise(p.course) ? piloteRobot(p.v, circuit) : COMMANDES_AUCUNE);
    const pasMax = Math.round(nbTours * R.SIMULATION_TEMPS_MAX / R.PAS_PHYSIQUE);
    for (let k = 0; k < pasMax && e.pilotes.some(p => p.arrivee === null); k++) pasCourseIA(e, R.PAS_PHYSIQUE, robot);
    return e;
  }

  // les lignes d'une course de la page (simulation.js : classementFinal, pénalités comprises) ; la voiture k de la
  // course est le pilote k du championnat
  function lignesDepuisCourse(e) {
    return classementFinal(e).map(x => ({ k: x.k, place: x.place, grille: x.grille, meilleurTour: e.pilotes[x.k].course.meilleurTour }));
  }

  // les lignes d'une course simulée (simulerCourse) : la même règle que classementFinal (temps total, pénalités
  // comprises, pour les arrivés ; puis les autres dans leur ordre)
  function lignesDepuisSimulation(r) {
    const V = r.voitures, k = v => v.numero - 1;
    const ordre = V.filter(v => v.fini).sort((a, b) => a.temps - b.temps || a.place - b.place).concat(V.filter(v => !v.fini));
    const grille = r.grille ? r.grille.map(g => g.numero) : V.map(v => v.numero);
    return ordre.map((v, i) => ({ k: k(v), place: i + 1, grille: grille.indexOf(v.numero) + 1, meilleurTour: v.meilleurTour }));
  }

  return { creer, pointsPour, enregistrerCourse, finirGrandPrix, classementPilotes, classementEcuries, lignesDepuisCourse, lignesDepuisSimulation, appliquerNiveaux, simulerGrandPrix };
})();
