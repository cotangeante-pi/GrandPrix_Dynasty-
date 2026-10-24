// Une course seule, en calcul pur : le compte à rebours, le chrono, les tours, les secteurs, le virage coupé.
// Le départ parfait (depart.js) est armé avec les feux et avancé ici à chaque pas (pasDepart).
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

// les feux de départ, à la place du 3-2-1-GO : un feu de plus chaque seconde, puis tous éteints après un délai tiré
// avec la graine, le même pour toutes les voitures. Chaque IA part avec un petit temps de réaction ; le joueur peut
// partir trop tôt (faux départ, pénalité). pilotes : [{ course, humain }]
function armerFeux(pilotes, graine) {
  const R = REGLAGES;
  ALEATOIRE.semer(graine + R.GRAINE_FEUX);
  const delai = R.FEUX_DELAI[0] + hasard() * (R.FEUX_DELAI[1] - R.FEUX_DELAI[0]);
  for (const p of pilotes) {
    const c = p.course;
    c.feux = { delai, total: R.FEUX_NB * R.FEUX_INTERVALLE + delai };
    c.compte = c.feux.total;
    // le départ parfait (depart.js) : le joueur dose son régime et lance lui-même ; une IA tire trois nombres avec la graine,
    // convertis en régime et réaction selon son caractère (tirerIA : son caractère peut arriver après l'armement, avec la
    // carte, donc on recalcule à l'extinction) ; sa réaction est dans les bornes humaines FEUX_REACTION_IA
    c.depart = DEPART.creer(p.humain);
    c.depart.source = p;
    if (!p.humain) { c.depart.tirage = [hasard(), hasard(), hasard()]; c.depart.prevu = DEPART.tirerIA(c.depart.tirage, caractereDe(p)); }
    c.reaction = p.humain ? 0 : c.depart.prevu.reaction;
    c.surveille = !!p.humain;   // le faux départ par la vitesse (rouler avant l'extinction) n'est surveillé que pour le joueur
  }
  ALEATOIRE.semer();
}

// le caractère d'un pilote de la course ({ regularite, erreurs }), ou null tant qu'il n'a pas son pilote IA (la carte)
function caractereDe(p) {
  return p && p.pilote && p.pilote.caractere ? p.pilote.caractere : null;
}

// le départ (depart.js) à chaque pas : le temps et le régime ; à l'extinction, une IA convertit son tirage avec son caractère
// (connu maintenant) ; un faux départ (anticipation) prend la pénalité, une seule fois ; l'effet sur le moteur est écrit
// dans la voiture (physique.js : facteurDepart, 1 = rien)
function pasDepart(c, v, dt, eteint) {
  const d = c.depart;
  if (!d) return;
  if (eteint && d.extinction === null && !d.humain) { d.prevu = DEPART.tirerIA(d.tirage, caractereDe(d.source)); c.reaction = d.prevu.reaction; }
  DEPART.pas(d, dt, eteint);
  penaliserFauxDepart(c);
  v.facteurDepart = DEPART.facteur(d);
}

// un faux départ (depart.js : anticipation) prend la pénalité de 5 s, une seule fois
function penaliserFauxDepart(c) {
  if (c.depart && c.depart.resultat === 'faux' && !c.fauxDepart) { c.fauxDepart = true; c.penalites += REGLAGES.PENALITE_FAUX_DEPART; }
}

// le nombre de feux allumés (0 avant le premier, et une fois éteints)
function feuxAllumes(c) {
  if (!c.feux || c.etat !== 'compte' || c.compte <= 0) return 0;
  return Math.min(REGLAGES.FEUX_NB, Math.floor((c.feux.total - c.compte) / REGLAGES.FEUX_INTERVALLE + 1e-9));
}

// le joueur peut-il appuyer ? Avec les feux, oui même avant l'extinction : c'est là qu'on fait un faux départ
function commandesPermises(c) {
  return courseAutorise(c) || (!!c.feux && c.etat === 'compte');
}

function tempsTotal(c) {
  return c.tours.reduce((a, t) => a + t.temps, 0) + c.penalites;
}

// à chaque pas de physique, après pasVoiture
function majCourse(c, v, dt) {
  const R = REGLAGES, L = c.circuit.longueur;
  if (c.etat === 'compte') {
    // le faux départ : rouler avant l'extinction des feux, une seule pénalité
    if (c.surveille && !c.fauxDepart && c.compte > 0 && Math.abs(v.u) > R.FAUX_DEPART_VITESSE) {
      c.fauxDepart = true;
      c.penalites += R.PENALITE_FAUX_DEPART;
    }
    c.compte -= dt;
    pasDepart(c, v, dt, c.compte <= 0);
    // une IA attend encore son temps de réaction après l'extinction : c'est son lancement (depart.js)
    if (c.compte <= -(c.reaction || 0)) { c.compte = 0; c.etat = 'attente'; if (c.depart && !c.depart.humain) { DEPART.lancer(c.depart, c.depart.prevu.resultat, c.depart.prevu.reaction); penaliserFauxDepart(c); } }
    c.sAvant = v.piste.s; c.xAvant = v.x; c.zAvant = v.z;
    return;
  }
  pasDepart(c, v, dt, true);
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
