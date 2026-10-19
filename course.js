// Une course seule, en calcul pur : le compte à rebours, le chrono, les tours, les secteurs, le virage coupé.
// Un tour ne compte que si la voiture a passé les secteurs 1 → 2 → 3 dans l'ordre, puis la ligne en avançant.

// nbTours : 5, 12, 18… ; 0 = essai libre (des tours sans fin)
function creerCourse(circuit, nbTours) {
  return {
    circuit, nbTours,
    etat: 'compte',          // compte (3-2-1) → attente (GO, le chrono attend le premier mouvement) → course → finie
    compte: REGLAGES.COMPTE_A_REBOURS,
    temps: 0,                // le chrono, depuis le premier mouvement
    debutTour: 0,
    secteursTour: [],        // les temps de secteur du tour en cours
    etape: -1,               // -1 : avant la première ligne ; 0 : secteur 1 ; 2 : secteur 2 vu ; 3 : secteur 3 vu
    coupeTour: false,
    tours: [],               // [{ temps, secteurs: [t1, t2, t3], coupe }]
    meilleurTour: null,      // le meilleur tour sans virage coupé
    meilleursSecteurs: [null, null, null],
    penalites: 0,            // secondes
    sAvant: null,
    sortie: null,            // une sortie de piste en cours : { progression, roule }
    progression: 0,          // la distance avancée le long de la piste, sans revenir à 0 à chaque tour
    xAvant: 0, zAvant: 0,
  };
}

// la voiture à sa place de départ : arrêtée, juste derrière la ligne
function placerAuDepart(v, circuit) {
  placerSurPiste(v, circuit, circuit.longueur - REGLAGES.DEPART_RECUL, 0);
}

// les commandes sont-elles permises ? (pas pendant le compte à rebours, ni après l'arrivée)
function courseAutorise(c) {
  return c.etat === 'attente' || c.etat === 'course';
}

function tempsTotal(c) {
  return c.tours.reduce((a, t) => a + t.temps, 0) + c.penalites;
}

// à chaque pas de physique, après pasVoiture
function majCourse(c, v, dt) {
  const R = REGLAGES, L = c.circuit.longueur;
  if (c.etat === 'compte') {
    c.compte -= dt;
    if (c.compte <= 0) { c.compte = 0; c.etat = 'attente'; }
    c.sAvant = v.piste.s; c.xAvant = v.x; c.zAvant = v.z;
    return;
  }
  if (c.etat === 'attente') {
    if (Math.abs(v.u) < 0.05) { c.sAvant = v.piste.s; c.xAvant = v.x; c.zAvant = v.z; return; }
    c.etat = 'course';
  }
  if (c.etat !== 'course') return;

  c.temps += dt;
  const s = v.piste.s;
  let ds = s - c.sAvant;
  if (ds < -L / 2) ds += L;      // passé la ligne en avançant
  if (ds > L / 2) ds -= L;       // passé la ligne en reculant
  const avance = s < c.sAvant && c.sAvant - s > L / 2;
  c.progression += ds;
  const roule = Math.hypot(v.x - c.xAvant, v.z - c.zAvant);
  c.sAvant = s; c.xAvant = v.x; c.zAvant = v.z;

  // le virage coupé : pendant une sortie, on compare l'avance le long de la piste et la distance roulée
  const dehors = Math.abs(v.piste.d) > c.circuit.largeur / 2 + R.MARGE_COUPE;
  if (dehors) {
    if (!c.sortie) c.sortie = { progression: c.progression - ds, roule: 0 };
    c.sortie.roule += roule;
  } else if (c.sortie) {
    const gagne = c.progression - c.sortie.progression;
    if (gagne > c.sortie.roule + R.SEUIL_COUPE) {
      c.penalites += R.PENALITE_COUPE;
      c.coupeTour = true;
      c.derniereCoupe = c.temps;
    }
    c.sortie = null;
  }

  // les secteurs, dans l'ordre
  const sec = v.piste.secteur;
  if (c.etape === 0 && sec === 2) { c.secteursTour[0] = c.temps - c.debutTour; c.etape = 2; }
  else if (c.etape === 2 && sec === 3) { c.secteursTour[1] = c.temps - c.debutTour - c.secteursTour[0]; c.etape = 3; }

  if (avance) {
    if (c.etape === -1) c.etape = 0;   // la ligne de départ : le premier tour a commencé au premier mouvement
    else if (c.etape === 3) finirTour(c);
    // passer la ligne sans avoir fait le tour (ou après avoir reculé) ne compte pas
  }
}

function finirTour(c) {
  const temps = c.temps - c.debutTour;
  const secteurs = [c.secteursTour[0], c.secteursTour[1], temps - c.secteursTour[0] - c.secteursTour[1]];
  const tour = { temps, secteurs, coupe: c.coupeTour };
  c.tours.push(tour);
  if (!tour.coupe) {
    if (c.meilleurTour === null || temps < c.meilleurTour) c.meilleurTour = temps;
    for (let i = 0; i < 3; i++) if (c.meilleursSecteurs[i] === null || secteurs[i] < c.meilleursSecteurs[i]) c.meilleursSecteurs[i] = secteurs[i];
  }
  c.debutTour = c.temps;
  c.secteursTour = [];
  c.etape = 0;
  c.coupeTour = false;
  if (c.nbTours > 0 && c.tours.length >= c.nbTours) c.etat = 'finie';
}

// la couleur d'un secteur : violet = meilleur secteur de la course, vert = mieux qu'au tour d'avant, jaune = plus lent
function couleurSecteur(c, i, temps, tourAvant) {
  const meilleur = c.meilleursSecteurs[i];
  if (meilleur === null || temps <= meilleur) return 'violet';
  if (tourAvant && temps < tourAvant.secteurs[i]) return 'vert';
  return 'jaune';
}
