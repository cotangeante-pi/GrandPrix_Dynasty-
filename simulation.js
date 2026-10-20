// Une course entre IA, en calcul pur (sans Three.js) : la grille, toutes les voitures, leurs contacts.
// Chaque IA ne voit que la piste, sa voiture, et les voitures dans son champ de vision (voituresVues).
// Sert aux tests (simulerCourse, sans affichage) et à la page (?ia=N : creerCourseIA, puis pasCourseIA à chaque pas).

// la carte de chaque circuit (ia.js), calculée une seule fois
const CARTES = new WeakMap();
function carteDe(circuit) {
  if (!CARTES.has(circuit)) CARTES.set(circuit, carteDepuis(circuit, calculerTrajectoire(circuit)));
  return CARTES.get(circuit);
}

// les places de la grille, de la pole à la dernière : { s, d }, deux files décalées derrière la ligne
function placesGrille(circuit, nb) {
  const R = REGLAGES, places = [];
  for (let k = 0; k < nb; k++) places.push({ s: circuit.longueur - R.DEPART_RECUL - k * R.GRILLE_ESPACEMENT, d: (k % 2 === 0 ? -1 : 1) * R.GRILLE_ECART });
  return places;
}

// ce que le pilote de v voit : les voitures dans son cône de vision devant (IA_VISION_ANGLE, IA_VISION_DISTANCE),
// juste devant dans son couloir (IA_VISION_COULOIR), et à côté de lui (IA_VISION_COTE, ses rétroviseurs).
// Pour chacune : où elle est sur la piste (s, d) et sa vitesse le long de la piste. Rien de ce qu'il ne verrait pas.
function voituresVues(v, voitures) {
  const R = REGLAGES, c = Math.cos(v.cap), s = Math.sin(v.cap), tanAngle = Math.tan(R.IA_VISION_ANGLE), vues = [];
  for (const w of voitures) {
    if (w === v || !w.piste) continue;
    const dx = w.x - v.x, dz = w.z - v.z, avant = c * dx + s * dz, cote = Math.abs(-s * dx + c * dz);
    const aCote = Math.abs(avant) <= R.IA_VISION_COTE[0] && cote <= R.IA_VISION_COTE[1];
    const devant = avant > 0 && Math.hypot(dx, dz) <= R.IA_VISION_DISTANCE && (cote <= avant * tanAngle || cote <= R.IA_VISION_COULOIR);
    if (!aCote && !devant) continue;
    const cw = Math.cos(w.cap), sw = Math.sin(w.cap);
    const vx = cw * w.u - sw * w.v, vz = sw * w.u + cw * w.v;
    vues.push({ s: w.piste.s, d: w.piste.d, vitesse: vx * w.piste.nz - vz * w.piste.nx });   // la tangente : (nz, -nx)
  }
  return vues;
}

// une course entre nb IA : chacune a sa voiture, sa course (course.js), son rythme et son pilote (sa façon de
// piloter), tirés avec la graine. carte : celle du circuit ; la page la passe à null tant qu'elle se calcule en
// fond (les IA attendent sur la grille), puis appelle donnerCarte.
// avecJoueur : une voiture de plus, celle du joueur, à la dernière place de la grille (humain: true) ; elle a la même
// physique, les IA la voient et la touchent comme les autres ; c'est la page qui la conduit (pasCourseIA)
function creerCourseIA(circuit, nb, nbTours, graine, carte = carteDe(circuit), avecJoueur = false) {
  const R = REGLAGES;
  ALEATOIRE.semer(graine);
  const pilotes = placesGrille(circuit, nb + (avecJoueur ? 1 : 0)).map((place, k) => {
    const v = creerVoiture(circuit, place.s, place.d);
    const humain = k === nb;
    return {
      numero: k + 1, v, course: creerCourse(circuit, nbTours), humain,
      rythme: humain ? null : R.IA_RYTHME[0] + hasard() * (R.IA_RYTHME[1] - R.IA_RYTHME[0]),
      pilote: null, herbe: 0, arrivee: null, place: null,
    };
  });
  ALEATOIRE.semer();
  const e = { circuit, carte: null, graine, nbTours, pilotes, temps: 0, arrives: 0 };
  if (carte) donnerCarte(e, carte);
  return e;
}

// la carte est prête : chaque IA reçoit son pilote, sa façon de piloter tirée avec la graine
function donnerCarte(e, carte) {
  const R = REGLAGES;
  e.carte = carte;
  ALEATOIRE.semer(e.graine + R.GRAINE_STYLES);
  e.pilotes.forEach((p, k) => {
    if (p.humain) return;
    p.pilote = creerPilote(carte, p.rythme, tirerStyle(carte, e.nbTours + 2), R.IA_PERIODE_DECISION * k / e.pilotes.length);
    p.pilote.grille = p.v.piste.d;   // il part dans sa file
  });
  ALEATOIRE.semer();
}

const COMMANDES_AUCUNE = { gaz: 0, frein: 0, direction: 0 };

// un pas de physique pour toutes les voitures encore en course. Ce que chaque IA voit est pris avant que
// quiconque bouge : l'ordre des voitures ne change rien. Une voiture arrivée quitte la piste.
// conduireJoueur(p, dt) (facultatif) : met les commandes de la voiture du joueur (sinon, elle ne bouge pas)
function pasCourseIA(e, dt, conduireJoueur) {
  const enCourse = e.pilotes.filter(p => p.arrivee === null);
  const voitures = enCourse.map(p => p.v);
  const commandes = enCourse.map(p => !p.humain && courseAutorise(p.course) && p.pilote
    ? piloterIA(p.pilote, p.v, voituresVues(p.v, voitures), dt) : COMMANDES_AUCUNE);
  aspirationVoitures(voitures);
  enCourse.forEach((p, k) => {
    if (p.humain && conduireJoueur) conduireJoueur(p, dt);
    else appliquerCommandes(p.v, commandes[k]);
    pasVoiture(p.v, e.circuit, dt);
  });
  contactsVoitures(voitures, e.circuit);
  e.temps += dt;
  const arrives = [];
  for (const p of enCourse) {
    majCourse(p.course, p.v, dt);
    if (p.v.surHerbe) p.herbe++;
    if (p.course.etat === 'finie') { p.arrivee = e.temps; arrives.push(p); }
  }
  // arrivés au même pas : le plus avancé d'abord
  arrives.sort((a, b) => b.course.progression - a.course.progression);
  for (const p of arrives) p.place = ++e.arrives;
}

// une course entière, sans affichage. Rend pour chaque voiture (dans l'ordre de la grille) : place, temps,
// meilleur tour, rythme, contacts voiture (et le plus fort choc), contacts barrière, pas dans l'herbe, virages coupés
function simulerCourse(circuit, nbVoitures, nbTours, graine) {
  const t0 = performance.now();
  const e = creerCourseIA(circuit, nbVoitures, nbTours, graine);
  const pasMax = Math.round(nbTours * REGLAGES.SIMULATION_TEMPS_MAX / REGLAGES.PAS_PHYSIQUE);
  for (let k = 0; k < pasMax && e.arrives < nbVoitures; k++) pasCourseIA(e, REGLAGES.PAS_PHYSIQUE);
  return {
    dureeMs: performance.now() - t0,
    voitures: e.pilotes.map(p => ({
      numero: p.numero, rythme: p.rythme, place: p.place, fini: p.arrivee !== null,
      temps: p.arrivee !== null ? tempsTotal(p.course) : null, meilleurTour: p.course.meilleurTour,
      contactsVoiture: p.v.contactsVoiture, chocMax: p.v.chocMax, chocs: p.v.chocs.slice(),
      contactsBarriere: p.v.contactsBarriere, herbe: p.herbe, coupes: Math.round(p.course.penalites / REGLAGES.PENALITE_COUPE),
    })),
  };
}
