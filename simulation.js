// Une course entre IA, en calcul pur (sans Three.js) : la grille, toutes les voitures, leurs contacts.
// Chaque IA ne voit que la piste, sa voiture, et la voiture la plus proche devant elle (voitureDevant).
// Sert aux tests (simulerCourse, sans affichage) et à la page (?ia=N : creerCourseIA, puis pasCourseIA à chaque pas).

// la trajectoire de chaque circuit, calculée une seule fois
const TRAJECTOIRES = new WeakMap();
function trajectoireDe(circuit) {
  if (!TRAJECTOIRES.has(circuit)) TRAJECTOIRES.set(circuit, calculerTrajectoire(circuit));
  return TRAJECTOIRES.get(circuit);
}

// les places de la grille, de la pole à la dernière : { s, d }, deux files décalées derrière la ligne
function placesGrille(circuit, nb) {
  const R = REGLAGES, places = [];
  for (let k = 0; k < nb; k++) places.push({ s: circuit.longueur - R.DEPART_RECUL - k * R.GRILLE_ESPACEMENT, d: (k % 2 === 0 ? -1 : 1) * R.GRILLE_ECART });
  return places;
}

// ce que le pilote de v voit devant lui : la voiture la plus proche dans son cône de vision (IA_VISION_ANGLE,
// IA_VISION_DISTANCE) ou dans son couloir (IA_VISION_COULOIR), avec sa distance (de centre à centre) et sa vitesse dans le sens de v ; null s'il n'y en a pas
function voitureDevant(v, voitures) {
  const R = REGLAGES, c = Math.cos(v.cap), s = Math.sin(v.cap), tanAngle = Math.tan(R.IA_VISION_ANGLE);
  let meilleure = null, dMin = R.IA_VISION_DISTANCE;
  for (const w of voitures) {
    if (w === v) continue;
    const dx = w.x - v.x, dz = w.z - v.z, avant = c * dx + s * dz, cote = -s * dx + c * dz;
    // dans le cône, ou juste devant dans son couloir (une voiture presque à côté qui se rabat sur sa trajectoire)
    if (avant <= 0 || (Math.abs(cote) > avant * tanAngle && Math.abs(cote) > R.IA_VISION_COULOIR)) continue;
    const d = Math.hypot(dx, dz);
    if (d < dMin) { dMin = d; meilleure = w; }
  }
  if (!meilleure) return null;
  const cw = Math.cos(meilleure.cap), sw = Math.sin(meilleure.cap);
  const vx = cw * meilleure.u - sw * meilleure.v, vz = sw * meilleure.u + cw * meilleure.v;
  return { distance: dMin, vitesse: vx * c + vz * s };
}

// une course entre nb IA : chacune a sa voiture, sa course (course.js) et son rythme, tiré avec la graine
function creerCourseIA(circuit, nb, nbTours, graine) {
  const R = REGLAGES;
  ALEATOIRE.semer(graine);
  const trajectoire = trajectoireDe(circuit);
  const pilotes = placesGrille(circuit, nb).map((place, k) => {
    const v = creerVoiture(circuit, place.s, place.d);
    return {
      numero: k + 1, v, course: creerCourse(circuit, nbTours),
      rythme: R.IA_RYTHME[0] + hasard() * (R.IA_RYTHME[1] - R.IA_RYTHME[0]),
      herbe: 0, arrivee: null, place: null,
    };
  });
  ALEATOIRE.semer();
  return { circuit, trajectoire, pilotes, temps: 0, arrives: 0 };
}

const COMMANDES_AUCUNE = { gaz: 0, frein: 0, direction: 0 };

// un pas de physique pour toutes les voitures encore en course. Ce que chaque IA voit est pris avant que
// quiconque bouge : l'ordre des voitures ne change rien. Une voiture arrivée quitte la piste.
function pasCourseIA(e, dt) {
  const enCourse = e.pilotes.filter(p => p.arrivee === null);
  const voitures = enCourse.map(p => p.v);
  const commandes = enCourse.map(p => courseAutorise(p.course)
    ? piloteIA(p.v, e.circuit, e.trajectoire, voitureDevant(p.v, voitures), p.rythme) : COMMANDES_AUCUNE);
  enCourse.forEach((p, k) => { appliquerCommandes(p.v, commandes[k]); pasVoiture(p.v, e.circuit, dt); });
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
