// Une course entre IA, en calcul pur (sans Three.js) : la grille, toutes les voitures, leurs contacts.
// Chaque IA ne voit que la piste, sa voiture, et les voitures dans son champ de vision (voituresVues).
// Sert aux tests (simulerCourse, sans affichage) et à la page (?ia=N : creerCourseIA, puis pasCourseIA à chaque pas).

// la carte de chaque circuit (ia.js), calculée une seule fois
const CARTES = new WeakMap();
function carteDe(circuit) {
  // (une carte par marge : le niveau de difficulté peut avoir la sienne, margeCarte ; au niveau normal, une seule, comme avant)
  if (!CARTES.has(circuit) || CARTES.get(circuit).margeCarte !== margeCarte()) CARTES.set(circuit, carteDepuis(circuit, calculerTrajectoire(circuit)));
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
// circuit (facultatif) : au croisement (le pont de Suzuko, branchesOpposees), une voiture sur l'autre passage n'est pas vue
function voituresVues(v, voitures, circuit) {
  const R = REGLAGES, c = Math.cos(v.cap), s = Math.sin(v.cap), tanAngle = Math.tan(R.IA_VISION_ANGLE), vues = [];
  for (const w of voitures) {
    if (w === v || !w.piste) continue;
    // (la voie des stands, étape 7 : une voiture de l'autre côté du muret n'est pas sur sa route ; 0 sans PNEUS_ACTIFS : rien ne change)
    if (v.campStands && w.campStands && v.campStands !== w.campStands) continue;
    if (circuit && circuit.croisement && v.piste && branchesOpposees(circuit, v.piste.s, w.piste.s)) continue;
    const dx = w.x - v.x, dz = w.z - v.z;
    if (dx * dx + dz * dz > R.IA_VISION_DISTANCE * R.IA_VISION_DISTANCE) continue;   // trop loin pour être vue
    const avant = c * dx + s * dz, cote = Math.abs(-s * dx + c * dz);
    const aCote = Math.abs(avant) <= R.IA_VISION_COTE[0] && cote <= R.IA_VISION_COTE[1];
    const devant = avant > 0 && Math.hypot(dx, dz) <= R.IA_VISION_DISTANCE && (cote <= avant * tanAngle || cote <= R.IA_VISION_COULOIR);
    if (!aCote && !devant) continue;
    const cw = Math.cos(w.cap), sw = Math.sin(w.cap);
    const vx = cw * w.u - sw * w.v, vz = sw * w.u + cw * w.v;
    // id : la voiture elle-même, pour la reconnaître d'un instant à l'autre (comme un pilote reconnaît une voiture)
    vues.push({ id: w, s: w.piste.s, d: w.piste.d, vitesse: vx * w.piste.nz - vz * w.piste.nx });   // la tangente : (nz, -nx)
  }
  return vues;
}

// la précision du niveau (NIVEAUX[…].precision, tour 33) : ce qui manque à x pour arriver à 1 (le rythme, le freinage du style) est
// multiplié par elle ; l'ordre entre pilotes est gardé. Sans précision (le niveau normal), x tel quel, au bit près
function precis(x) {
  const p = niveau().precision;
  return p === undefined ? x : 1 - (1 - x) * p;
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
    if (humain) v.joueur = true; else v.ia = true;   // (v.ia : la voiture vivante ne la touche qu'avec VIVANTE_IA, physique.js)   // la voiture du joueur (ce que tout pilote sait : qui est qui) ; le rival de l'interview la vise (ia.js)
    if (R.PNEUS_ACTIFS && !humain) { v.pneus = creerPneus(); v.changeurs = R.STAND_CHANGEURS_IA; }   // les pneus des IA (étape 7) ; ceux du joueur, c'est la page (principal.js)
    return {
      numero: k + 1, v, course: creerCourse(circuit, nbTours), humain,
      depart: place.s - circuit.longueur,   // m : sa place sur la grille, derrière la ligne (pour savoir qui est devant)
      rythme: humain ? null : Math.min(1, precis(R.IA_RYTHME[0] + hasard() * (R.IA_RYTHME[1] - R.IA_RYTHME[0])) + niveau().rythme),
      pilote: null, herbe: 0, herbeErreur: 0, chocsVus: 0, chocsErreur: new Set(), arrivee: null, place: null,
      passages: [],   // le temps de course (e.temps) où il a passé chaque CLASSEMENT_PAS m depuis la grille (classementCourse)
    };
  });
  ALEATOIRE.semer();
  const e = { circuit, carte: null, graine, nbTours, pilotes, temps: 0, arrives: 0, depassements: [], devant: new Map(), grille: null,
    origine: Math.min(...pilotes.map(p => p.depart)), go: null };   // origine : la place la plus reculée ; go : le temps du GO
  if (carte) donnerCarte(e, carte);
  return e;
}

// la carte est prête : chaque IA reçoit son pilote, sa façon de piloter tirée avec la graine ; puis la qualification
// range la grille (si les IA n'ont pas encore bougé)
function donnerCarte(e, carte) {
  const R = REGLAGES;
  e.carte = carte;
  if (e.pilotes.every(p => p.humain || p.v.u === 0)) qualifier(e);
  ALEATOIRE.semer(e.graine + R.GRAINE_STYLES);
  e.pilotes.forEach((p, k) => {
    if (p.humain) return;
    const style = tirerStyle(carte, e.nbTours + 2), n = niveau();
    // le niveau de difficulté change aussi sa façon de piloter (tour 33, ordre B : la voiture et la physique restent les mêmes) ; au niveau
    // normal, rien (× 1, + 0, les réglages globaux) : les courses d'avant au bit près. Un pilote de haut niveau utilise plus la largeur de
    // la piste (corde × n.corde, marge au bord + n.marge, jamais plus près que n.bordMin, la carte reste la même pour tous), va plus près de la limite d'adhérence
    // (n.limite, noterLigne) et ne se laisse pas piéger au freinage par la ligne qui reste à l'extérieur (n.penaliteFrein)
    if (n.corde !== undefined) style.corde *= n.corde;
    if (n.precision !== undefined) {   // … et plus précis : son freinage plus près du sien, son point de corde et ses variations d'un tour à l'autre plus petits
      style.frein = precis(style.frein); style.apex *= n.precision;
      for (let i = 0; i < style.variations.length; i++) style.variations[i] *= n.precision;
    }
    if (n.marge !== undefined) style.margeBord = Math.max(n.bordMin === undefined ? R.IA_MARGE_BORD_MIN : n.bordMin, style.margeBord + n.marge);
    p.pilote = creerPilote(carte, p.rythme, style, R.IA_PERIODE_DECISION * k / e.pilotes.length);
    if (n.limite !== undefined) p.pilote.limite = n.limite;
    if (n.bordMin !== undefined) p.pilote.bordMin = n.bordMin;
    if (n.penaliteFrein !== undefined) p.pilote.penaliteFrein = n.penaliteFrein;
    p.pilote.grille = p.v.piste.d;   // il part dans sa file
    p.pilote.rivalite = !!(e.rivalites && e.rivalites[k]);   // le rival du joueur (l'interview d'après course)
    // la disposition promise en discussion (discussion.js, Codeur 3 ; e.dispositions, championnat.js) : laisser passer le joueur, ou bloquer
    // un pilote ; pour ce Grand Prix seulement. id : la voiture visée (ia.js : cederDisposition, defendreDisposition). Sans elle, rien
    const d = e.dispositions && e.dispositions[k], vise = d ? (d.type === 'laisser' ? e.pilotes.find(q => q.humain) : e.pilotes[d.cible]) : null;
    if (d && vise && vise !== p) p.pilote.disposition = { type: d.type, id: vise.v };
  });
  // ses techniques selon le virage (ia.js, techniquesPilote), avec leur propre graine : les tirages d'avant ne bougent pas
  // (× la technique du niveau, NIVEAUX[…].technique : débutant 0,1, normal 0,28, expert 0,7, légende 1 ; 0 ou absente : aucune technique, la
  // course d'avant au bit près. Tour 37 : en normal, sur 90 courses, chocs > 5 m/s 10 sans, 11 avec ; herbe 2815 sans, 3129 avec : du bruit)
  const nt = niveau().technique || 0;
  if (R.IA_TECHNIQUES_ACTIVES && nt > 0) {
    ALEATOIRE.semer(e.graine + R.GRAINE_TECHNIQUE);
    for (const p of e.pilotes) if (!p.humain) { const [a, b] = R.IA_STYLE_TECHNIQUE; p.pilote.style.technique = (a + hasard() * (b - a)) * nt; techniquesPilote(carte, p.pilote.style); }
    ALEATOIRE.semer();
  }
  // le caractère de chaque IA, avec sa propre graine (les styles ne changent pas)
  ALEATOIRE.semer(e.graine + R.GRAINE_CARACTERE);
  for (const p of e.pilotes) if (!p.humain) {
    p.pilote.caractere = appliquerNiveau(tirerCaractere(e.nbTours + 2));
    p.pilote.erreurs = tirerErreurs(carte, p.pilote.caractere, e.nbTours + 1);
  }
  // la gestion des pneus (étape 7), avec sa propre graine : les tirages ci-dessus ne bougent pas
  ALEATOIRE.semer(e.graine + R.GRAINE_PNEUS);
  for (const p of e.pilotes) if (!p.humain) p.pilote.caractere.gestionPneus = Math.max(0, Math.min(1, tirerGestionPneus() + (niveau().gestionPneus || 0)));
  ALEATOIRE.semer();
  // les consignes d'équipe : son refus éventuel de laisser passer le joueur, avec sa propre graine
  ALEATOIRE.semer(e.graine + R.GRAINE_CONSIGNES);
  for (const p of e.pilotes) if (!p.humain) { const [a, b] = R.IA_CARACTERE.consigneRefus; p.pilote.caractere.consigneRefus = a + hasard() * (b - a); }
  ALEATOIRE.semer();
  strategieStands(e);
}

// --- les consignes d'équipe (CLAUDE.md « Le duel contre le coéquipier », Codeur 1) ---
// e.ecuries[k] : l'écurie du pilote k (la page la pose depuis le championnat) ; sans elle, deux par écurie dans l'ordre (0-1, 2-3…)
function ecurieDe(e, k) {
  return e.ecuries ? e.ecuries[k] : Math.floor(k / 2);
}

// son rythme récent : la moyenne de ses CONSIGNE_TOURS derniers tours (s), null s'il n'en a pas assez fait (celui de devant) ; celui de
// derrière est comparé par son meilleur tour, une fois qu'il en a fait autant
function rythmeRecent(p) {
  const t = p.course.tours, n = REGLAGES.CONSIGNE_TOURS;
  if (t.length < n) return null;
  let s = 0;
  for (let i = t.length - n; i < t.length; i++) s += t[i].temps;
  return s / n;
}

// toutes les CONSIGNE_PERIODE s : une consigne au plus par course (e.consigne : { devant, derriere (indices), numero (celui qui doit
// passer), debut, joueur (le joueur est devant), refus, resultat : null | 'suivie' | 'ignoree' | 'refusee' }). Entre deux IA, celle de
// devant laisse passer (pilote.laisser, ia.js) ; le coéquipier du joueur (le joueur derrière) laisse passer sauf si son caractère le fait
// refuser ; si le joueur est devant, sa course porte la consigne (le message, interface.js) et c'est à lui de laisser passer.
function majConsignes(e) {
  const R = REGLAGES, P = e.pilotes;
  if (e.consigne) { suivreConsigne(e, e.consigne); return; }
  if (e.go === null) return;
  if (e.consigneVue !== undefined && e.temps - e.consigneVue < R.CONSIGNE_PERIODE) return;
  e.consigneVue = e.temps;
  for (let a = 0; a < P.length; a++) for (let b = 0; b < P.length; b++) {
    const dev = P[a], der = P[b];
    if (a === b || ecurieDe(e, a) !== ecurieDe(e, b) || dev.arrivee !== null || der.arrivee !== null || (dev.humain && der.humain)) continue;
    // (pas pendant un arrêt au stand, une erreur ou une attaque : la consigne attend un moment calme)
    if ([dev, der].some(q => q.v.dansStands || (q.pilote && (q.pilote.stand || q.pilote.enErreur || q.pilote.attaque)))) continue;
    const ecart = distanceCourse(dev) - distanceCourse(der);
    if (ecart <= 0 || ecart > R.CONSIGNE_DISTANCE || dev.course.tours.length + 1 >= dev.course.nbTours) continue;
    // (celui de derrière : son meilleur tour de la course ; bloqué derrière l'autre, ses derniers tours sont ceux de l'autre)
    // (et ses derniers tours pas plus lents que ceux de l'autre, à CONSIGNE_RECENT près : un meilleur tour ancien ne suffit pas, il doit
    // être vraiment collé à lui maintenant)
    const rd = rythmeRecent(dev), recent = rythmeRecent(der), rr = recent === null ? null : der.course.meilleurTour;
    if (rd === null || rr === null || rd - rr < R.CONSIGNE_RYTHME || recent > rd + R.CONSIGNE_RECENT) continue;
    const db = distanceCourse(der);
    if (P.some(q => q !== dev && q !== der && q.arrivee === null && distanceCourse(q) > db - R.CONSIGNE_DERRIERE && distanceCourse(q) < db + ecart)) continue;
    const refus = !dev.humain && der.humain && !!(dev.pilote && dev.pilote.caractere && dev.pilote.caractere.consigneRefus >= R.CONSIGNE_REFUS_SEUIL);
    e.consigne = { devant: a, derriere: b, numero: der.numero, debut: e.temps, joueur: !!dev.humain, refus, resultat: null };
    if (!dev.humain && !refus && dev.pilote) dev.pilote.laisser = { id: der.v };
    if (!der.humain && der.pilote) der.pilote.passer = { id: dev.v };   // (il sait qu'on le laisse passer : il passe comme une voiture lente)
    if (dev.humain) dev.course.consigne = e.consigne;
    if (der.humain) der.course.consigne = e.consigne;
    return;
  }
}

// la consigne en cours : passée (celui de derrière est devant) → suivie ; sinon, au bout de CONSIGNE_DELAI s → ignorée (ou refusée)
function suivreConsigne(e, c) {
  if (c.resultat) return;
  const dev = e.pilotes[c.devant], der = e.pilotes[c.derriere];
  if (c.refus) c.resultat = 'refusee';   // le coéquipier du joueur refuse : c'est dit tout de suite
  else if (distanceCourse(der) > distanceCourse(dev) + REGLAGES.LONGUEUR_VOITURE) c.resultat = 'suivie';
  else if (e.temps - c.debut > (dev.humain ? REGLAGES.CONSIGNE_DELAI : REGLAGES.CONSIGNE_DELAI_IA) || dev.arrivee !== null || der.arrivee !== null) c.resultat = c.refus ? 'refusee' : 'ignoree';
  if (c.resultat) { c.fin = e.temps; c.finCourse = dev.course.temps; if (dev.pilote) dev.pilote.laisser = null; if (der.pilote) der.pilote.passer = null; }
}

// après la course, si la consigne visait le joueur (le joueur devant) : la suivre fait monter la confiance de l'écurie (la jauge
// « écurie » de l'interview, ch.reputation.ecurie = ch.confiance), l'ignorer la fait baisser, de CONSIGNE_CONFIANCE, entre 0 et 100.
// Un point du duel n'est jamais rendu (le duel lit le classement final, rien d'autre). Rend le pas appliqué.
function appliquerConsigne(ch, consigne) {
  if (!ch || !consigne || !consigne.joueur || !consigne.resultat) return 0;
  const pas = consigne.resultat === 'suivie' ? REGLAGES.CONSIGNE_CONFIANCE : -REGLAGES.CONSIGNE_CONFIANCE;
  if (!ch.reputation) ch.reputation = { public: 50, ecurie: typeof ch.confiance === 'number' ? ch.confiance : 50, sponsors: 50 };
  ch.reputation.ecurie = Math.max(0, Math.min(100, ch.reputation.ecurie + pas));
  ch.confiance = ch.reputation.ecurie;
  return pas;
}

// les rivaux du joueur (l'interview d'après course, CLAUDE.md « Les rivaux se souviennent ») : rivalites[k] vrai si le pilote k de la
// course a une rivalité en cours (ch.pilotes[k].rivalite) ; son pilote IA la reçoit (pilote.rivalite, ia.js : un peu plus agressif
// contre le joueur seulement). À appeler avant ou après la carte.
function poserRivalites(e, rivalites) {
  e.rivalites = rivalites ? rivalites.slice() : null;
  e.pilotes.forEach((p, k) => { if (p.pilote) p.pilote.rivalite = !!(e.rivalites && e.rivalites[k]); });
  return e;
}

// la météo d'une course (meteo.js, étape 12) : le plan tiré avant (METEO.plan) ; chaque voiture part avec le pneu que la piste demande
// (les IA selon leur prudence ; le joueur : le sien s'il l'a choisi, v.typePneus, sinon le meilleur pour la piste du départ)
function poserMeteo(e, plan) {
  e.meteo = METEO.creer(plan);
  for (const p of e.pilotes) {
    if (p.humain) { p.v.typePneus = p.v.typePneus || METEO.meilleurPneu(e.meteo.eau); continue; }
    p.v.typePneus = METEO.choisir(e.meteo.eau, e.meteo.pluie, 1 - (p.pilote && p.pilote.caractere ? p.pilote.caractere.agressivite : 0.5));
  }
  return e;
}

// à chaque pas, avec la météo : la pluie et l'eau avancent (le même ciel pour tous) ; sous chaque voiture, l'eau (moins sur la
// trajectoire quand elle sèche), le facteur d'adhérence de ses pneus et leur usure ; le joueur prend à son arrêt les pneus qu'il a
// choisis, ou ceux que la piste demande
function pasMeteo(e, enCourse, dt) {
  const R = REGLAGES, m = METEO.pas(e.meteo, dt), carte = e.carte;
  for (const p of enCourse) {
    const v = p.v, s = v.piste ? v.piste.s : 0;
    const surLigne = !!(carte && v.piste && Math.abs(v.piste.d - valeurEn(e.circuit, carte.trajectoire.ecart, s)) < R.METEO_LIGNE);
    v.eau = METEO.eauEn(m, surLigne);
    v.eauTrajectoire = METEO.eauEn(m, true); v.eauHors = METEO.eauEn(m, false);   // (ce que voit le pilote : l'eau sur la trajectoire et hors d'elle ; ia.js, IA_PLUIE_LIGNE)
    v.adhMeteo = METEO.adherence(v.typePneus, v.eau);
    v.usureMeteo = METEO.usure(v.typePneus, v.eau);
    if (p.humain && !v.choixPneus) { v.pneusProchain = METEO.choisir(m.eau, m.pluie, 0.5); if (v.pneusProchain === 'slick' && v.typePneus === 'drift') v.pneusProchain = 'drift'; }   // (en drift sur le sec, l'équipe lui remet le drift)
    if (p.humain) p.course.pneusProchain = v.pneusProchain;   // (affiché pendant l'arrêt : interface.js)
    if (p.humain && m.message && p.course.meteoMessage === undefined) p.course.meteoMessage = { cle: m.message, temps: p.course.temps };   // « La pluie arrive » (interface.js)
  }
}

// l'arrêt au stand des IA (étape 7) : en course de 12 et 18 tours (arretObligatoire), chaque IA choisit le tour de son arrêt,
// avec sa propre graine (GRAINE_STANDS) : la moitié de la course, plus tard pour qui ménage ses pneus (gestionPneus), un peu de
// hasard ; entre STAND_TOUR_MIN et nbTours − 2 (jamais au dernier tour) ; deux pilotes de la même écurie (deux par écurie, dans
// l'ordre de la course) à deux tours d'écart au moins (jamais au même tour). pilote.standTour, null sans arrêt.
function strategieStands(e) {
  const R = REGLAGES;
  if (!R.PNEUS_ACTIFS || !e.circuit.stands || !arretObligatoire(e.nbTours)) return;
  const max = e.nbTours - 2;
  ALEATOIRE.semer(e.graine + R.GRAINE_STANDS);
  e.pilotes.forEach((p, k) => {
    if (p.humain || !p.pilote) return;
    const part = R.STAND_PART + R.STAND_PART_GESTION * (p.pilote.caractere.gestionPneus - 0.5) + R.STAND_PART_HASARD * (2 * hasard() - 1);
    let tour = Math.max(R.STAND_TOUR_MIN, Math.min(max, Math.round(e.nbTours * part)));
    const equipier = k % 2 === 1 ? e.pilotes[k - 1] : null;
    // (à deux tours au moins de son équipier : une voiture qui s'arrête juste après la ligne le fait au tour suivant)
    const te = equipier && equipier.pilote ? equipier.pilote.standTour : null;
    if (te && Math.abs(tour - te) < 2) tour = te + 2 <= max ? te + 2 : te - 2 >= R.STAND_TOUR_MIN ? te - 2 : tour;
    p.pilote.standTour = tour;
  });
  ALEATOIRE.semer();
}

// à chaque pas, pour une IA qui doit s'arrêter : à son tour (et jamais au dernier), à STAND_APPROCHE m de l'entrée de la voie,
// elle passe en mode « stands » (pilote.stand : ia.js suit la voie, s'arrête dans la zone, ressort) ; le mode finit
// STAND_REJOINDRE m après la sortie. Sans arrêt fait (elle a manqué la zone), elle réessaie au tour suivant.
function majStandsIA(p, e) {
  const R = REGLAGES, pi = p.pilote, v = p.v, c = e.circuit, st = c.stands;
  if (!pi || !v.pneus || !v.piste) return;
  // la météo (meteo.js) : le pneu qu'il veut pour ce qu'il voit de la piste (l'eau, la pluie qui tombe ; jamais l'avenir), selon sa prudence
  const veut = e.meteo ? METEO.choisir(e.meteo.eau, e.meteo.pluie, 1 - (pi.caractere ? pi.caractere.agressivite : 0.5)) : null;
  const changer = !!veut && veut !== (v.typePneus || 'slick');
  if (!pi.standTour && !changer && !pi.stand) return;
  const depuis = ecartLeLong(c, v.piste.s - st.entree);
  if (pi.stand) {
    pi.stand.arrete = v.pneus.arrets > pi.stand.arretsAvant;
    if (depuis >= 0 && depuis <= st.longueur) pi.stand.dedans = true;
    if (pi.stand.dedans && depuis > st.longueur + R.STAND_REJOINDRE) pi.stand = null;
    // elle ralentit pour entrer, ou rejoint la piste au ralenti : les autres la voient faire (ia.js, estLente : on la contourne)
    v.manoeuvreStands = !!pi.stand && ((depuis > -Math.min(R.STAND_RANGER[0], droiteAvantStands(c)) && depuis < R.STAND_RAMPE) || (pi.stand.arrete && depuis > st.longueur - R.STAND_RAMPE));
    return;
  }
  if ((v.pneus.arrets > 0 && !changer) || p.course.etat !== 'course') return;
  if (depuis < -R.STAND_APPROCHE || depuis > 0) return;
  // (le tour où il arrivera à l'entrée : si l'entrée est juste après la ligne, il passera la ligne avant elle, c'est le tour suivant ;
  // sinon, il commencerait à freiner après la ligne, trop tard : tracés officiels, entrée à 20 m de la ligne)
  const tour = p.course.tours.length + 1 + (v.piste.s > st.entree && p.course.etape === 3 ? 1 : 0);
  if ((!changer && tour < pi.standTour) || tour >= p.course.nbTours) return;
  // (pour changer de pneus, pas deux arrêts de suite : au moins METEO_ARRET_TOURS tours après le précédent)
  if (changer && v.pneus.arrets > 0 && tour - (p.course.arrets && p.course.arrets.length ? p.course.arrets[p.course.arrets.length - 1].tour : 0) < R.METEO_ARRET_TOURS) return;
  pi.stand = { arrete: false, dedans: false, arretsAvant: v.pneus.arrets };
  if (veut) v.pneusProchain = veut;   // (les pneus qu'il prendra à l'arrêt : course.js, pasArretStand)
  if (pi.attaque) finirAttaque(pi, false, 'stands');
}

const COMMANDES_AUCUNE = { gaz: 0, frein: 0, direction: 0 };

// la qualification, simplifiée (on ne simule pas le tour) : le temps de chaque IA est son meilleur tour estimé
// (tourEstime) × un peu de hasard (IA_QUALIF_HASARD, tiré avec la graine). La grille suit ces temps ; le joueur
// reste dernier. e.grille : [{ numero, qualif }] dans l'ordre de la grille.
function qualifier(e) {
  const R = REGLAGES, c = e.circuit;
  // son niveau en qualifications (CLAUDE.md « Les IA des adversaires », tour 33) : un trait de son caractère, tiré avec sa propre graine
  // (les autres tirages ne bougent pas), le même à tous les niveaux de difficulté : > 0, il se qualifie moins bien que son rythme de course
  ALEATOIRE.semer(e.graine + R.GRAINE_QUALIF_TRAIT);
  const [qa, qb] = R.IA_CARACTERE.qualif;
  for (const p of e.pilotes) p.qualifTrait = p.humain ? null : qa + hasard() * (qb - qa);
  ALEATOIRE.semer(e.graine + R.GRAINE_QUALIF);
  for (const p of e.pilotes) p.qualif = p.humain ? null : tourEstime(e.carte, p.rythme) * (1 + p.qualifTrait) * (1 + R.IA_QUALIF_HASARD * (2 * hasard() - 1));
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
  const R = REGLAGES;
  const enCourse = e.pilotes.filter(p => p.arrivee === null);
  const voitures = enCourse.map(p => p.v);
  if (e.meteo) pasMeteo(e, enCourse, dt);   // la météo (étape 12) ; sans e.meteo (le sec d'avant) : rien ne change
  if (R.PNEUS_ACTIFS && e.circuit.stands) for (const p of enCourse) if (!p.humain) majStandsIA(p, e);   // l'arrêt au stand des IA (étape 7)
  const commandes = enCourse.map(p => !p.humain && courseAutorise(p.course) && p.pilote
    ? piloterIA(p.pilote, p.v, vuesAvecArriere(p, voituresVues(p.v, voitures, e.circuit), enCourse, e.circuit), dt) : COMMANDES_AUCUNE);
  aspirationVoitures(voitures, e.circuit);
  enCourse.forEach((p, k) => {
    if (p.humain && conduireJoueur) conduireJoueur(p, dt);
    else appliquerCommandes(p.v, commandes[k]);
    pasVoiture(p.v, e.circuit, dt);
    // ses pneus s'usent (pneus.js), selon sa gestion des pneus ; son adhérence baisse, la physique et ses lignes la lisent
    if (!p.humain && p.v.pneus) {
      pasPneus(p.v.pneus, p.v, dt, p.pilote && p.pilote.caractere ? p.pilote.caractere.gestionPneus : undefined);
      p.v.adherence = facteurAdherence(p.v.pneus.usure);
    }
  });
  contactsVoitures(voitures, e.circuit);
  e.temps += dt;
  const arrives = [];
  for (const p of enCourse) {
    majCourse(p.course, p.v, dt);
    if (e.go === null && p.course.etat !== 'compte') e.go = e.temps;
    noterPassages(e, p, dt);
    // l'herbe et les chocs pendant une erreur (et juste après) sont comptés à part
    const enErreur = p.pilote && p.pilote.enErreur;
    if (p.v.surHerbe) { if (enErreur) p.herbeErreur++; else p.herbe++; }
    p.v.enErreur = !!enErreur;   // (ce que les autres voient : elle fait une erreur ; ia.js, estLente)
    while (p.chocsVus < p.v.chocs.length) { if (enErreur) p.chocsErreur.add(p.chocsVus); p.chocsVus++; }
    if (p.course.etat === 'finie') { p.arrivee = e.temps; arrives.push(p); }
  }
  compterDepassements(e, enCourse);
  if (R.CONSIGNES_ACTIVES) majConsignes(e);   // les consignes d'équipe (au plus une par course)
  // arrivés au même pas : le plus avancé d'abord
  arrives.sort((a, b) => b.course.progression - a.course.progression);
  for (const p of arrives) p.place = ++e.arrives;
}

// sa distance depuis la ligne de départ (négative sur la grille, derrière la ligne), tours compris
function distanceCourse(p) {
  return p.depart + p.course.progression;
}

// le niveau de difficulté en cours (REGLAGES.NIVEAU, voir NIVEAUX)
function niveau() {
  return REGLAGES.NIVEAUX[REGLAGES.NIVEAU] || REGLAGES.NIVEAUX.normal;
}

// le niveau appliqué à un caractère tiré (tirerCaractere) : les écarts entre pilotes sont gardés
function appliquerNiveau(c) {
  const n = niveau();
  c.erreurs *= n.erreurs;
  c.agressivite = Math.max(0, Math.min(1, c.agressivite + n.agressivite));
  c.regularite *= n.regularite;
  for (let t = 0; t < c.tours.length; t++) c.tours[t] = 1 - (1 - c.tours[t]) * n.regularite;
  return c;
}

// chaque fois qu'il passe un nouveau point tous les CLASSEMENT_PAS m (comptés depuis e.origine), le temps exact où il y
// est passé (au prorata dans ce pas) ; un point qu'il avait déjà dépassé sur la grille : -Infinity (avant le départ).
// parti : le temps où il a quitté sa place sur la grille
function noterPassages(e, p, dt) {
  const pas = REGLAGES.CLASSEMENT_PAS, d = distanceCourse(p), avant = p.distanceAvant === undefined ? p.depart : p.distanceAvant;
  const quand = x => e.temps - dt * (d - x) / Math.max(1e-9, d - avant);
  if (p.parti === undefined && d > p.depart) p.parti = quand(p.depart);
  for (let m = p.passages.length; e.origine + m * pas <= d; m++) {
    const x = e.origine + m * pas;
    p.passages.push(x <= p.depart ? -Infinity : quand(x));
  }
  p.distanceAvant = d;
}

// le temps où p est passé à cette distance (entre deux points notés : au prorata) ; -Infinity si c'était avant le départ
function passageA(e, p, distance) {
  if (distance <= p.depart) return -Infinity;
  const pas = REGLAGES.CLASSEMENT_PAS, i = Math.floor((distance - e.origine) / pas);
  if (i < 0 || i + 1 >= p.passages.length) return e.temps;
  let t0 = p.passages[i], d0 = e.origine + i * pas;
  if (t0 === -Infinity) { t0 = p.parti === undefined ? e.temps : p.parti; d0 = p.depart; }   // il partait de sa place
  return t0 + (distance - d0) / (e.origine + (i + 1) * pas - d0) * (p.passages[i + 1] - t0);
}

// le classement en direct (la tour de classement) : celui de la PISTE, sans les pénalités (décision du propriétaire : « si t'as
// une minute de pénalité et que t'es 2e pendant la course, c'est 2e » ; elles ne comptent qu'au classement final,
// classementFinal). Les arrivés dans leur ordre de passage de la ligne, puis les autres du plus avancé au moins avancé
// (tours finis, puis distance dans le tour). Pour chacun, dans l'ordre : { k (sa place dans e.pilotes), place, ecart,
// tours, penalites (affichées seulement) } ; ecart : les secondes depuis que celui de devant est passé là où il est
// (null pour le premier et pour une voiture qui n'a pas encore passé la ligne) ; tours : ses tours de retard sur lui
function classementCourse(e) {
  const P = e.pilotes, rang = p => p.place === null ? Infinity : p.place;
  const ordre = P.map((p, k) => k).sort((a, b) => {
    const A = P[a], B = P[b];
    if (A.place !== null || B.place !== null) return rang(A) - rang(B);
    return distanceCourse(B) - distanceCourse(A);
  });
  return ordre.map((k, i) => {
    const p = P[k];
    const stand = !!((p.v && p.v.dansStands) || p.course.arretEnCours);   // dans la voie des stands (étape 7) : « STAND » dans la tour
    if (i === 0) return { k, place: 1, ecart: null, tours: 0, penalites: p.course.penalites, stand };
    const q = P[ordre[i - 1]];
    const passe = p.arrivee !== null || (e.go !== null && distanceCourse(p) > 0);   // il a passé la ligne au moins une fois
    let ecart = null;
    if (passe) ecart = p.arrivee !== null ? p.arrivee - q.arrivee : e.temps - Math.max(e.go, passageA(e, q, distanceCourse(p)));
    const tours = Math.max(0, Math.floor((distanceCourse(q) - distanceCourse(p)) / e.circuit.longueur));
    return { k, place: i + 1, ecart: ecart === null ? null : Math.max(0, ecart), tours, penalites: p.course.penalites, stand };
  });
}

// le classement final (podium, résultats) : temps de course (du GO à l'arrivée) + pénalités (virage coupé), la même
// règle pour toutes les voitures, joueur et IA. Une voiture qui passe la ligne 3e avec +5 s peut finir 4e. Les arrivés
// d'abord, du plus petit total au plus grand ; puis ceux qui ne sont pas encore arrivés, dans l'ordre de course.
// Pour chacun, dans l'ordre : { k, place, ligne (sa place au passage de la ligne, null s'il n'est pas arrivé),
// temps (sans les pénalités) et total (avec), null s'il n'est pas arrivé, penalites, ecart (au vainqueur, null),
// grille (sa place au départ) }
function classementFinal(e) {
  const P = e.pilotes, go = e.go === null ? 0 : e.go;
  const total = p => p.arrivee - go + p.course.penalites;
  const arrives = P.map((p, k) => k).filter(k => P[k].arrivee !== null)
    .sort((a, b) => total(P[a]) - total(P[b]) || P[a].place - P[b].place);
  const suite = classementCourse(e).map(x => x.k).filter(k => P[k].arrivee === null);
  const grille = P.map((p, k) => k).sort((a, b) => P[b].depart - P[a].depart);
  const premier = arrives.length ? total(P[arrives[0]]) : null;
  return arrives.concat(suite).map((k, i) => {
    const p = P[k], arrive = p.arrivee !== null;
    return {
      k, place: i + 1, ligne: arrive ? p.place : null, temps: arrive ? p.arrivee - go : null, total: arrive ? total(p) : null,
      penalites: p.course.penalites, ecart: arrive ? total(p) - premier : null, grille: grille.indexOf(k) + 1,
      arrets: (p.course.arrets || []).map(a => a.tour),   // les tours de ses arrêts au stand (étape 7), [] sans arrêt
    };
  });
}

// les trois premiers du classement final sont-ils connus ? Il faut qu'ils soient arrivés, et qu'aucune voiture encore
// en course ne puisse plus faire mieux que le 3e (au mieux, elle arriverait maintenant, sans pénalité)
function podiumConnu(e) {
  const n = Math.min(3, e.pilotes.length), f = classementFinal(e).slice(0, n);
  if (f.some(x => x.total === null)) return false;
  if (e.pilotes.every(p => p.arrivee !== null)) return true;
  return e.temps - e.go > f[n - 1].total;
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
  const R = REGLAGES, distance = distanceCourse;
  for (let i = 0; i < enCourse.length; i++) for (let j = i + 1; j < enCourse.length; j++) {
    const a = enCourse[i], b = enCourse[j], cle = a.numero * 1000 + b.numero, ecart = distance(a) - distance(b);
    const maintenant = ecart > R.SIMULATION_MARGE_DEVANT ? 1 : ecart < -R.SIMULATION_MARGE_DEVANT ? -1 : 0;
    const avant = e.devant.get(cle);
    if (maintenant === 0) continue;
    if (avant !== undefined && avant !== maintenant) {
      const qui = maintenant > 0 ? a : b, sur = maintenant > 0 ? b : a;
      // (stand : l'une des deux est dans la voie des stands ou en route vers elle : un dépassement du cycle des arrêts, pas en piste)
      const auStand = [qui, sur].some(p => (p.pilote && p.pilote.stand) || (p.v.piste && p.v.piste.stands) || p.v.campStands);
      e.depassements.push({ temps: e.temps, tour: qui.course.tours.length + 1, s: qui.v.piste.s, endroit: endroitSur(e.carte, qui.v.piste.s), qui: qui.numero, sur: sur.numero, stand: auStand });
    }
    e.devant.set(cle, maintenant);
  }
}

// la vue arrière du rival du joueur (IA_RIVAL_VUE_ARRIERE, duel-court) : il voit aussi le joueur derrière lui jusqu'à cette distance le long de
// la piste (pas seulement à IA_VISION_COTE[0] dans ses rétroviseurs), pour se défendre dès qu'il le voit arriver ; 0 : ce qu'il voyait avant
function vuesAvecArriere(p, vues, enCourse, circuit) {
  const R = REGLAGES;
  if (!R.IA_RIVAL_VUE_ARRIERE || !p.pilote || !p.pilote.rivalite || !p.v.piste) return vues;
  const j = enCourse.find(q => q.humain || q.v.joueur);
  if (!j || !j.v.piste || vues.some(w => w.id === j.v)) return vues;
  const g = ecartLeLong(circuit, j.v.piste.s - p.v.piste.s);
  if (g >= 0 || g < -R.IA_RIVAL_VUE_ARRIERE) return vues;
  const w = j.v, cw = Math.cos(w.cap), sw = Math.sin(w.cap), vx = cw * w.u - sw * w.v, vz = sw * w.u + cw * w.v;
  return vues.concat([{ id: w, s: w.piste.s, d: w.piste.d, vitesse: vx * w.piste.nz - vz * w.piste.nx }]);
}

// une course entière, sans affichage. Rend pour chaque voiture (dans l'ordre de la grille) : place, temps,
// meilleur tour, rythme, contacts voiture (et le plus fort choc), contacts barrière, pas dans l'herbe, virages coupés
function simulerCourse(circuit, nbVoitures, nbTours, graine) {
  const t0 = performance.now();
  const e = creerCourseIA(circuit, nbVoitures, nbTours, graine);
  if (REGLAGES.SIMULATION_FEUX) armerFeux(e.pilotes, graine);   // (les feux et le départ de chacun, comme dans la page : un départ raté se paie)
  const pasMax = Math.round(nbTours * REGLAGES.SIMULATION_TEMPS_MAX / REGLAGES.PAS_PHYSIQUE);
  for (let k = 0; k < pasMax && e.arrives < nbVoitures; k++) pasCourseIA(e, REGLAGES.PAS_PHYSIQUE);
  return {
    dureeMs: performance.now() - t0,
    depassements: e.depassements,
    grille: e.grille,
    final: classementFinal(e).map(x => e.pilotes[x.k].numero),
    consigne: e.consigne || null,   // la consigne d'équipe de la course (majConsignes), null sans consigne   // les numéros dans l'ordre du classement final (pénalités comprises)
    voitures: e.pilotes.map(p => ({
      numero: p.numero, rythme: p.rythme, place: p.place, fini: p.arrivee !== null,
      temps: p.arrivee !== null ? tempsTotal(p.course) : null, meilleurTour: p.course.meilleurTour,
      contactsVoiture: p.v.contactsVoiture, chocMax: p.v.chocMax, chocs: p.v.chocs.slice(), lieuxChocs: p.v.lieuxChocs.slice(),
      contactsBarriere: p.v.contactsBarriere, herbe: p.herbe, coupes: Math.round((p.course.penalites - (p.course.penaliteSansArret || 0) - (p.course.penalitesStands || 0)) / REGLAGES.PENALITE_COUPE),
      attaques: p.pilote ? p.pilote.attaques : 0, attaquesReussies: p.pilote ? p.pilote.reussies : 0,
      parCible: p.pilote ? [...p.pilote.parCible].map(([id, x]) => ({ numero: (e.pilotes.find(q => q.v === id) || {}).numero, attaques: x.attaques, reussies: x.reussies })) : [],
      defenses: p.pilote ? p.pilote.defenses : 0, rivalite: !!(p.pilote && p.pilote.rivalite),
      erreurs: p.pilote ? p.pilote.erreursFaites.slice() : [], erreursEvitees: p.pilote && p.pilote.erreurs ? p.pilote.erreurs.filter(x => x.evitee).length : 0,
      herbeErreur: p.herbeErreur, chocsErreur: p.v.chocs.filter((c, i) => p.chocsErreur.has(i)),
      caractere: p.pilote && p.pilote.caractere ? { regularite: p.pilote.caractere.regularite, agressivite: p.pilote.caractere.agressivite, erreurs: p.pilote.caractere.erreurs, gestionPneus: p.pilote.caractere.gestionPneus } : null,
      usure: p.v.pneus ? p.v.pneus.usure : null, arrets: p.v.pneus ? p.v.pneus.arrets : 0,
      // l'arrêt au stand (étape 7) : les tours des arrêts, le tour prévu, la pénalité sans arrêt, celle de vitesse dans la voie, le muret
      toursArrets: (p.course.arrets || []).map(a => a.tour), standTour: p.pilote ? p.pilote.standTour || null : null,
      penaliteSansArret: p.course.penaliteSansArret || 0, penalitesStands: p.course.penalitesStands || 0, contactsMurStands: p.v.contactsMurStands,
      total: p.arrivee !== null ? p.arrivee - (e.go || 0) + p.course.penalites : null,
    })),
  };
}
