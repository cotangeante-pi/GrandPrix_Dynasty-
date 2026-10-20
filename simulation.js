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
    const dx = w.x - v.x, dz = w.z - v.z;
    if (dx * dx + dz * dz > R.IA_VISION_DISTANCE * R.IA_VISION_DISTANCE) continue;   // trop loin pour être vue
    const avant = c * dx + s * dz, cote = Math.abs(-s * dx + c * dz);
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
      depart: place.s - circuit.longueur,   // m : sa place sur la grille, derrière la ligne (pour savoir qui est devant)
      rythme: humain ? null : R.IA_RYTHME[0] + hasard() * (R.IA_RYTHME[1] - R.IA_RYTHME[0]),
      pilote: null, herbe: 0, arrivee: null, place: null,
    };
  });
  ALEATOIRE.semer();
  const e = { circuit, carte: null, graine, nbTours, pilotes, temps: 0, arrives: 0, grille: null, depassements: [], devant: new Map() };
  if (carte) donnerCarte(e, carte);
  return e;
}

// la carte est prête : chaque IA reçoit son pilote, sa façon de piloter tirée avec la graine ; avant, la
// qualification range la grille (si les IA n'ont pas encore bougé)
function donnerCarte(e, carte) {
  const R = REGLAGES;
  e.carte = carte;
  if (e.pilotes.every(p => p.humain || p.v.u === 0)) qualifier(e);
  ALEATOIRE.semer(e.graine + R.GRAINE_STYLES);
  e.pilotes.forEach((p, k) => {
    if (p.humain) return;
    p.pilote = creerPilote(carte, p.rythme, tirerStyle(carte, e.nbTours + 2), R.IA_PERIODE_DECISION * k / e.pilotes.length);
    p.pilote.grille = p.v.piste.d;   // il part dans sa file
  });
  ALEATOIRE.semer();
}

const COMMANDES_AUCUNE = { gaz: 0, frein: 0, direction: 0 };

// la qualification, simplifiée (on ne simule pas le tour) : le temps de chaque IA est son meilleur tour estimé
// (tourEstime) × un peu de hasard (IA_QUALIF_HASARD, tiré avec la graine). La grille suit ces temps ; le joueur
// reste dernier. e.grille : [{ numero, qualif }] dans l'ordre de la grille.
function qualifier(e) {
  const R = REGLAGES, c = e.circuit;
  ALEATOIRE.semer(e.graine + R.GRAINE_QUALIF);
  for (const p of e.pilotes) p.qualif = p.humain ? null : tourEstime(e.carte, p.rythme) * (1 + R.IA_QUALIF_HASARD * (2 * hasard() - 1));
  ALEATOIRE.semer();
  const ordre = e.pilotes.filter(p => !p.humain).sort((a, b) => a.qualif - b.qualif).concat(e.pilotes.filter(p => p.humain));
  const places = placesGrille(c, ordre.length);
  ordre.forEach((p, k) => {
    placerSurPiste(p.v, c, places[k].s, places[k].d);
    p.depart = places[k].s - c.longueur;
  });
  e.devant.clear();
  e.grille = ordre.map(p => ({ numero: p.numero, qualif: p.qualif }));
}

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
  compterDepassements(e, enCourse);
  // arrivés au même pas : le plus avancé d'abord
  arrives.sort((a, b) => b.course.progression - a.course.progression);
  for (const p of arrives) p.place = ++e.arrives;
}

// l'endroit d'un point de la piste, pour ranger les dépassements : « freinage » (entre le point de freinage d'un virage
// et son sommet), « sortie » (jusqu'à IA_VIRAGE_LARGEUR après le sommet), sinon « autre »
function endroitSur(carte, s) {
  if (!carte) return 'autre';
  const c = carte.circuit;
  for (const x of carte.virages) {
    if (ecartLeLong(c, s - x.freinage) >= 0 && ecartLeLong(c, s - x.s) <= 0) return 'freinage';
    const apres = ecartLeLong(c, s - x.s);
    if (apres > 0 && apres <= REGLAGES.IA_VIRAGE_LARGEUR) return 'sortie';
  }
  return 'autre';
}

// les dépassements : pour chaque paire de voitures en course, qui est devant (avec une marge de SIMULATION_MARGE_DEVANT,
// pour ne pas compter deux voitures côte à côte qui s'échangent sans cesse) ; quand ça change, c'est un dépassement
function compterDepassements(e, enCourse) {
  const R = REGLAGES, distance = p => p.depart + p.course.progression;
  for (let i = 0; i < enCourse.length; i++) for (let j = i + 1; j < enCourse.length; j++) {
    const a = enCourse[i], b = enCourse[j], cle = a.numero * 1000 + b.numero, ecart = distance(a) - distance(b);
    const maintenant = ecart > R.SIMULATION_MARGE_DEVANT ? 1 : ecart < -R.SIMULATION_MARGE_DEVANT ? -1 : 0;
    const avant = e.devant.get(cle);
    if (maintenant === 0) continue;
    if (avant !== undefined && avant !== maintenant) {
      const qui = maintenant > 0 ? a : b, sur = maintenant > 0 ? b : a;
      e.depassements.push({ temps: e.temps, tour: qui.course.tours.length + 1, s: qui.v.piste.s, endroit: endroitSur(e.carte, qui.v.piste.s), qui: qui.numero, sur: sur.numero });
    }
    e.devant.set(cle, maintenant);
  }
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
    grille: e.grille,
    depassements: e.depassements,
    voitures: e.pilotes.map(p => ({
      numero: p.numero, rythme: p.rythme, place: p.place, fini: p.arrivee !== null,
      temps: p.arrivee !== null ? tempsTotal(p.course) : null, meilleurTour: p.course.meilleurTour,
      contactsVoiture: p.v.contactsVoiture, chocMax: p.v.chocMax, chocs: p.v.chocs.slice(), lieuxChocs: p.v.lieuxChocs.slice(),
      contactsBarriere: p.v.contactsBarriere, herbe: p.herbe, coupes: Math.round(p.course.penalites / REGLAGES.PENALITE_COUPE),
    })),
  };
}
