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
    return completer({ graine, saison: 1, prochain: 0, calendrier, ecuries, pilotes, resultats: [], duel: null, album: [] });
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
    const duel = enregistrerDuel(ch, lignes);
    ch.resultats.push({ grandPrix: ch.prochain + 1, ordre: lignes.map(l => l.k), duel });
    ch.prochain++;
    return ch;
  }

  // --- le duel contre le coéquipier (CLAUDE.md « Le duel contre le coéquipier ») : les scores sont des paires
  // [joueur, coéquipier] ; duel.saison et duel.coequipier disent à quoi s'applique le score de la saison (il repart
  // de 0 à une nouvelle saison ou avec un nouveau coéquipier) ; duel.carriere : le total contre chaque coéquipier (k)
  function joueurDe(ch) {
    return ch.pilotes.find(p => p.humain);
  }

  // le coéquipier : l'autre pilote de l'écurie du joueur
  function coequipierDe(ch) {
    const j = joueurDe(ch);
    return ch.pilotes.find(p => p.ecurie === j.ecurie && !p.humain) || null;
  }

  // qui gagne le duel d'un Grand Prix : 0 = le joueur, 1 = le coéquipier, null = personne. Lignes { place, grille,
  // classe } (classe absent : classé). Qualifs : la meilleure place sur la grille ; course : la meilleure place au
  // classement final (pénalités comprises) ; un pilote non classé perd le point de la course (les deux : personne)
  function gagnantDuel(lj, lc) {
    const classeJ = lj.classe !== false, classeC = lc.classe !== false;
    return {
      qualif: lj.grille === lc.grille ? null : lj.grille < lc.grille ? 0 : 1,
      course: classeJ && classeC ? (lj.place < lc.place ? 0 : 1) : classeJ ? 0 : classeC ? 1 : null,
    };
  }

  // le duel de ch, mis à la saison et au coéquipier en cours (créé s'il manque : une ancienne sauvegarde)
  function duelDe(ch) {
    const c = coequipierDe(ch);
    if (!ch.duel) {
      ch.duel = { saison: ch.saison, coequipier: c ? c.id : null, qualifs: [0, 0], courses: [0, 0], carriere: {} };
      // une sauvegarde d'avant le duel : les courses déjà jouées se retrouvent dans l'ordre d'arrivée (le non classé
      // y est après tous les classés) ; les qualifs n'étaient pas gardées
      const j = joueurDe(ch);
      for (const r of ch.resultats || []) {
        if (!c || r.duel !== undefined) continue;
        const pj = r.ordre.indexOf(j.id), pc = r.ordre.indexOf(c.id);
        if (pj < 0 || pc < 0) continue;
        compter(ch.duel, c.id, { qualif: null, course: pj < pc ? 0 : 1 });
      }
    }
    const d = ch.duel;
    if (d.saison !== ch.saison || d.coequipier !== (c ? c.id : null)) {
      d.saison = ch.saison;
      d.coequipier = c ? c.id : null;
      d.qualifs = [0, 0];
      d.courses = [0, 0];
    }
    return d;
  }

  // ajoute le résultat g d'un Grand Prix au score de la saison et au total de carrière contre le coéquipier k
  function compter(d, k, g) {
    const c = d.carriere[k] || (d.carriere[k] = { qualifs: [0, 0], courses: [0, 0] });
    if (g.qualif !== null) { d.qualifs[g.qualif]++; c.qualifs[g.qualif]++; }
    if (g.course !== null) { d.courses[g.course]++; c.courses[g.course]++; }
  }

  // le duel d'un Grand Prix fini (enregistrerCourse) ; renvoie { coequipier, qualif, course } (null : pas de duel)
  function enregistrerDuel(ch, lignes) {
    const d = duelDe(ch), j = joueurDe(ch);
    const lj = lignes.find(l => l.k === j.id), lc = lignes.find(l => l.k === d.coequipier);
    if (d.coequipier === null || !lj || !lc) return null;
    const g = gagnantDuel(lj, lc);
    compter(d, d.coequipier, g);
    return { coequipier: d.coequipier, qualif: g.qualif, course: g.course };
  }

  // le score de la saison pour l'écran : { k (le coéquipier), nom, qualifs, courses, total } (paires [joueur, coéquipier]),
  // ou null sans coéquipier ; carriere : le total de carrière contre lui
  function scoreDuel(ch) {
    const d = duelDe(ch);
    if (d.coequipier === null) return null;
    const c = d.carriere[d.coequipier] || { qualifs: [0, 0], courses: [0, 0] };
    return {
      k: d.coequipier, nom: ch.pilotes[d.coequipier].nom, qualifs: d.qualifs.slice(), courses: d.courses.slice(),
      total: [d.qualifs[0] + d.courses[0], d.qualifs[1] + d.courses[1]],
      carriere: { qualifs: c.qualifs.slice(), courses: c.courses.slice() },
    };
  }

  // une sauvegarde d'une ancienne version : ce qui manque est ajouté (sauvegarde.js, migrer)
  function completer(ch) {
    if (ch.pilotes) duelDe(ch);   // (une sauvegarde de test peut n'avoir que des pilotes)
    if (!ch.album) ch.album = [];   // l'album des unes du journal (journal.js) : vide dans une sauvegarde d'avant
    return ch;
  }

  // la course finie, puis la sauvegarde (après chaque course)
  function finirGrandPrix(ch, lignes) {
    enregistrerCourse(ch, lignes);
    if (typeof JOURNAL !== 'undefined') JOURNAL.ranger(ch, JOURNAL.composer(ch, lignes));   // la une du journal (journal.js), dans l'album du championnat
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

  // les lignes d'une course de la page (simulation.js : classementFinal, pénalités comprises ; ligne : la place au passage
  // de la ligne, pour la une du journal) ; la voiture k de la course est le pilote k du championnat
  function lignesDepuisCourse(e) {
    return classementFinal(e).map(x => ({ k: x.k, place: x.place, grille: x.grille, ligne: x.ligne, penalites: x.penalites, meilleurTour: e.pilotes[x.k].course.meilleurTour, classe: x.temps !== null }));
  }

  // les lignes d'une course simulée (simulerCourse) : la même règle que classementFinal (temps total, pénalités
  // comprises, pour les arrivés ; puis les autres dans leur ordre)
  function lignesDepuisSimulation(r) {
    const V = r.voitures, k = v => v.numero - 1;
    const ordre = V.filter(v => v.fini).sort((a, b) => a.temps - b.temps || a.place - b.place).concat(V.filter(v => !v.fini));
    const grille = r.grille ? r.grille.map(g => g.numero) : V.map(v => v.numero);
    return ordre.map((v, i) => ({ k: k(v), place: i + 1, grille: grille.indexOf(v.numero) + 1, meilleurTour: v.meilleurTour, classe: !!v.fini }));
  }

  return { creer, pointsPour, enregistrerCourse, finirGrandPrix, classementPilotes, classementEcuries, lignesDepuisCourse, lignesDepuisSimulation, appliquerNiveaux, simulerGrandPrix,
    coequipierDe, gagnantDuel, scoreDuel, completer };
})();
