// La physique des voitures, en calcul pur (sans Three.js). Le joueur et les IA utilisent exactement ce code.
// Modèle « vélo » : un essieu avant qui braque, un essieu arrière, des pneus qui glissent au-delà de leur adhérence.
// Repère de la voiture : u = vitesse vers l'avant, v = vitesse vers la droite, r = vitesse de lacet (> 0 = vers la droite).
// Le cap est l'angle de l'avant dans le plan (x, z) : avant = (cos cap, sin cap), droite = (-sin cap, cos cap).

// circuit : null = un terrain plat sans fin (pour les tests)
function creerVoiture(circuit, s = 0, d = 0) {
  const v = {
    x: 0, z: 0, cap: 0, u: 0, v: 0, r: 0,
    gaz: 0, frein: 0, direction: 0,   // les commandes appliquées (0–1, 0–1, -1…1)
    braquage: 0,                      // l'angle des roues avant (rad), pour l'affichage
    rotationRoues: 0,                 // rad, pour l'affichage
    avant: { x: 0, z: 0, cap: 0 },    // l'état au début du pas, pour l'interpolation de l'affichage
    piste: null,                      // le dernier positionSurPiste
    surHerbe: false, contactsBarriere: 0,
  };
  if (circuit) placerSurPiste(v, circuit, s, d);
  memoriserAvant(v);
  return v;
}

// la voiture à l'arrêt, au point s de la piste, à l'écart d, dans le sens de la course
function placerSurPiste(v, circuit, s, d = 0) {
  const i = Math.round(((s % circuit.longueur) + circuit.longueur) % circuit.longueur / circuit.pas) % circuit.nb;
  v.x = circuit.x[i] + circuit.nx[i] * d;
  v.z = circuit.z[i] + circuit.nz[i] * d;
  v.cap = Math.atan2(circuit.tz[i], circuit.tx[i]);
  v.u = v.v = v.r = 0;
  v.gaz = v.frein = v.direction = v.braquage = 0;
  v.piste = positionSurPiste(circuit, v.x, v.z, i);
  v.surHerbe = false;
  memoriserAvant(v);
}

// Espace : au point le plus proche, au centre, dans le bon sens, à l'arrêt
function remettreSurPiste(v, circuit) {
  const p = positionSurPiste(circuit, v.x, v.z, v.piste ? v.piste.indice : null);
  placerSurPiste(v, circuit, p.s, 0);
}

function memoriserAvant(v) {
  v.avant.x = v.x; v.avant.z = v.z; v.avant.cap = v.cap;
}

// ce que l'affichage dessine : entre l'état d'avant le pas et l'état d'après, alpha dans [0, 1]
function etatAffiche(v, alpha) {
  let dc = v.cap - v.avant.cap;
  dc = Math.atan2(Math.sin(dc), Math.cos(dc));   // le plus court chemin entre deux angles
  return { x: v.avant.x + (v.x - v.avant.x) * alpha, z: v.avant.z + (v.z - v.avant.z) * alpha, cap: v.avant.cap + dc * alpha };
}

// les commandes au clavier : elles rejoignent les cibles progressivement (cibles : { gaz, frein, direction })
function lisserCommandes(v, cibles, dt) {
  const R = REGLAGES;
  const vers = (actuel, cible, vitesse) => actuel < cible ? Math.min(cible, actuel + vitesse * dt) : Math.max(cible, actuel - vitesse * dt);
  v.gaz = vers(v.gaz, cibles.gaz, R.RAMPE_GAZ);
  v.frein = vers(v.frein, cibles.frein, R.RAMPE_FREIN);
  // la direction revient au centre plus vite qu'elle ne braque
  const retour = cibles.direction === 0 || (v.direction !== 0 && Math.sign(cibles.direction) !== Math.sign(v.direction));
  v.direction = vers(v.direction, cibles.direction, retour ? R.RETOUR_DIRECTION : R.RAMPE_DIRECTION);
}

// commandes directes (le robot, les IA) : sans rampe
function appliquerCommandes(v, c) {
  v.gaz = Math.max(0, Math.min(1, c.gaz));
  v.frein = Math.max(0, Math.min(1, c.frein));
  v.direction = Math.max(-1, Math.min(1, c.direction));
}

function braquageMax(u) {
  return REGLAGES.BRAQUAGE_MAX / (1 + Math.abs(u) / REGLAGES.BRAQUAGE_VITESSE);
}

// la charge totale sur les pneus (N) : le poids plus l'appui aérodynamique
function charge(u) {
  return REGLAGES.MASSE * REGLAGES.GRAVITE + REGLAGES.APPUI * u * u;
}

// un pas de physique de dt secondes, avec les commandes déjà dans v.gaz, v.frein, v.direction
function pasVoiture(v, circuit, dt) {
  const R = REGLAGES, m = R.MASSE, a = R.CG_AVANT, b = R.EMPATTEMENT - R.CG_AVANT;
  memoriserAvant(v);

  const herbe = v.surHerbe;
  const mu = R.ADHERENCE * (herbe ? R.ADHERENCE_HERBE : 1);
  const fz = charge(v.u);
  const fzAvant = fz * b / R.EMPATTEMENT, fzArriere = fz * a / R.EMPATTEMENT;
  const delta = v.direction * braquageMax(v.u);
  v.braquage = delta;

  // la force vers l'avant : moteur, frein, traînée, roulement, herbe
  let fx = 0;
  const avance = v.u > 0.01;
  if (v.gaz > 0) fx += v.gaz * Math.min(R.FORCE_MOTEUR_MAX, R.PUISSANCE / Math.max(v.u, 1));
  // le frein à l'arrêt devient la marche arrière (si on n'accélère pas)
  if (v.frein > 0 && v.u <= 0.5 && v.gaz === 0 && v.u > -R.MARCHE_ARRIERE_MAX) fx -= v.frein * R.FORCE_MARCHE_ARRIERE;
  const resistance = R.TRAINEE * v.u * v.u + R.ROULEMENT + (herbe ? R.FROTTEMENT_HERBE * Math.abs(v.u) : 0)
    + (avance ? v.frein * R.ADHERENCE_FREIN * (herbe ? R.ADHERENCE_HERBE : 1) * fz : 0);

  if (Math.abs(v.u) < R.VITESSE_CINEMATIQUE) {
    // presque à l'arrêt : la voiture roule sans glisser
    const uAvant = v.u;
    v.u += (fx - Math.sign(v.u) * resistance) / m * dt;
    // les résistances arrêtent la voiture, elles ne la font pas repartir dans l'autre sens
    if (uAvant > 0 && v.u < 0) v.u = 0;
    if (uAvant < 0 && v.u > 0 && v.gaz === 0) v.u = 0;
    if (v.u < -R.MARCHE_ARRIERE_MAX) v.u = -R.MARCHE_ARRIERE_MAX;
    v.v = 0;
    v.r = v.u * Math.tan(delta) / R.EMPATTEMENT;
  } else {
    // les pneus : la force latérale suit l'angle de glissement, plafonnée par l'adhérence
    const alphaAvant = Math.atan2(v.v + a * v.r, Math.abs(v.u)) - delta;
    const alphaArriere = Math.atan2(v.v - b * v.r, Math.abs(v.u));
    const plafond = (f, max) => Math.max(-max, Math.min(max, f));
    const fyAvant = plafond(-R.RIGIDITE_PNEU * fzAvant * alphaAvant, mu * fzAvant);
    const fyArriere = plafond(-R.RIGIDITE_PNEU * fzArriere * alphaArriere, mu * fzArriere);

    const sensU = Math.sign(v.u);
    const du = (fx - sensU * resistance - fyAvant * Math.sin(delta)) / m + v.v * v.r;
    const dv = (fyAvant * Math.cos(delta) + fyArriere) / m - v.u * v.r;
    const dr = (a * fyAvant * Math.cos(delta) - b * fyArriere) / R.INERTIE_LACET;
    const uAvant = v.u;
    v.u += du * dt;
    // le frein arrête la voiture, il ne la fait pas reculer
    if (uAvant > 0 && v.u < 0) v.u = 0;
    v.v += dv * dt;
    v.r += dr * dt;
  }

  // la position, avec les vitesses nouvelles (Euler semi-implicite : stable)
  const c = Math.cos(v.cap), s = Math.sin(v.cap);
  v.x += (c * v.u - s * v.v) * dt;
  v.z += (s * v.u + c * v.v) * dt;
  v.cap += v.r * dt;
  v.rotationRoues = (v.rotationRoues + v.u * dt / R.RAYON_ROUE) % (2 * Math.PI);

  if (circuit) contactPiste(v, circuit);
}

// où est la voiture sur la piste : l'herbe, et les barrières qu'on ne traverse jamais
function contactPiste(v, circuit) {
  const R = REGLAGES;
  let p = positionSurPiste(circuit, v.x, v.z, v.piste ? v.piste.indice : null);
  const limite = circuit.largeur / 2 + R.DISTANCE_BARRIERE - R.DEMI_LARGEUR_VOITURE;
  if (Math.abs(p.d) > limite) {
    const cote = Math.sign(p.d);
    // on ramène la voiture contre la barrière
    const recul = cote * limite - p.d;
    v.x += p.nx * recul;
    v.z += p.nz * recul;
    // la vitesse dans le monde, séparée en « vers la barrière » et « le long »
    const c = Math.cos(v.cap), s = Math.sin(v.cap);
    let wx = c * v.u - s * v.v, wz = s * v.u + c * v.v;
    const wn = wx * p.nx + wz * p.nz;
    if (wn * cote > 0) {
      wx -= p.nx * wn * (1 + R.REBOND_BARRIERE);
      wz -= p.nz * wn * (1 + R.REBOND_BARRIERE);
    }
    const wn2 = wx * p.nx + wz * p.nz;
    const tx = wx - p.nx * wn2, tz = wz - p.nz * wn2;
    wx = p.nx * wn2 + tx * (1 - R.FROTTEMENT_BARRIERE);
    wz = p.nz * wn2 + tz * (1 - R.FROTTEMENT_BARRIERE);
    v.u = c * wx + s * wz;
    v.v = -s * wx + c * wz;
    v.r *= 0.5;
    v.contactsBarriere++;
    p = positionSurPiste(circuit, v.x, v.z, p.indice);
  }
  v.piste = p;
  v.surHerbe = Math.abs(p.d) > circuit.largeur / 2 + R.MARGE_HERBE;
}

// la vitesse limite dans un virage de courbure k (m/s), avec l'appui : v² |k| = mu (g + APPUI v² / m)
function vitesseVirage(k, mu = REGLAGES.ADHERENCE) {
  const R = REGLAGES, ka = Math.abs(k), aero = mu * R.APPUI / R.MASSE;
  return ka <= aero ? Infinity : Math.sqrt(mu * R.GRAVITE / (ka - aero));
}
