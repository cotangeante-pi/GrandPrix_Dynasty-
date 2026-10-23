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
    contactsVoiture: 0,               // les contacts avec une autre voiture (un frottement qui dure compte pour un)
    chocMax: 0,                       // la plus forte vitesse de choc contre une voiture (m/s, vitesse relative)
    chocs: [],                        // pour chaque contact, la plus forte vitesse de rapprochement (m/s)…
    lieuxChocs: [],                   // … et où il a commencé sur la piste (s, en m ; null sans circuit)
    touche: new Set(),                // les voitures touchées au dernier pas
    pneus: null,                      // les pneus du joueur (pneus.js, ?pneus=1 : principal.js), null sinon…
    adherence: 1,                     // … et leur facteur sur l'adhérence (facteurAdherence) ; 1 = rien ne change
    aspiration: 0,                    // 0 à 1 : dans le sillage d'une voiture (aspirationVoitures), la traînée baisse
    facteurDepart: 1,                 // le départ (depart.js, course.js) : un facteur sur la force du moteur juste après le lancement ; 1 = rien
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
  // la direction revient au centre vite ; elle braque vite jusqu'au palier, puis lentement jusqu'au bout
  const retour = cibles.direction === 0 || (v.direction !== 0 && Math.sign(cibles.direction) !== Math.sign(v.direction));
  if (retour) v.direction = vers(v.direction, cibles.direction, R.RETOUR_DIRECTION);
  else {
    const sens = Math.sign(cibles.direction), cible = Math.abs(cibles.direction);
    let a = Math.abs(v.direction), reste = dt;
    // le temps du pas passe d'abord dans la montée rapide, le reste dans la montée lente
    if (a < R.DIRECTION_PALIER) {
      const jusquAuPalier = (Math.min(R.DIRECTION_PALIER, cible) - a) / R.RAMPE_DIRECTION_RAPIDE;
      const t = Math.min(reste, Math.max(0, jusquAuPalier));
      a += t * R.RAMPE_DIRECTION_RAPIDE;
      reste -= t;
    }
    if (a >= R.DIRECTION_PALIER - 1e-12) a += reste * R.RAMPE_DIRECTION_LENTE;
    v.direction = sens * Math.min(cible, a);
  }
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
  const mu = R.ADHERENCE * (v.adherence || 1) * (herbe ? R.ADHERENCE_HERBE : 1);   // × 1 sans pneus : le même nombre au bit près
  const fz = charge(v.u);
  const fzAvant = fz * b / R.EMPATTEMENT, fzArriere = fz * a / R.EMPATTEMENT;
  const delta = v.direction * braquageMax(v.u);
  v.braquage = delta;

  // la force vers l'avant : moteur, frein, traînée, roulement, herbe
  let fx = 0;
  const avance = v.u > 0.01;
  if (v.gaz > 0) fx += v.gaz * Math.min(R.FORCE_MOTEUR_MAX, R.PUISSANCE / Math.max(v.u, 1)) * (herbe ? R.GAZ_HERBE : 1) * (v.facteurDepart || 1);   // × 1 sans départ : le même nombre au bit près
  // le frein à l'arrêt devient la marche arrière (si on n'accélère pas)
  if (v.frein > 0 && v.u <= 0.5 && v.gaz === 0 && v.u > -R.MARCHE_ARRIERE_MAX) fx -= v.frein * R.FORCE_MARCHE_ARRIERE;
  const resistance = R.TRAINEE * (1 - R.ASPIRATION_MAX * v.aspiration) * v.u * v.u + R.ROULEMENT + (herbe ? R.FROTTEMENT_HERBE * Math.abs(v.u) + R.FROTTEMENT_HERBE_CARRE * v.u * v.u : 0)
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
    const fyArriere = plafond(-R.RIGIDITE_PNEU * fzArriere * alphaArriere, mu * R.ADHERENCE_ARRIERE * fzArriere);

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
    // l'aide de stabilité (arcade) : la rotation rejoint celle que demande le volant, plafonnée par l'adhérence,
    // et la glissade de côté s'amortit. Lâcher la direction remet la voiture droite, sans tête-à-queue.
    const rMax = mu * fz / (m * Math.abs(v.u));
    const rVoulue = Math.max(-rMax, Math.min(rMax, v.u * Math.tan(delta) / R.EMPATTEMENT));
    v.r += (rVoulue - v.r) * (1 - Math.exp(-R.STABILITE_LACET * dt));
    v.v *= Math.exp(-R.ANTI_DERIVE * dt);
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

// L'aspiration : derrière une voiture, dans son sillage (à moins de ASPIRATION_DISTANCE devant, à moins de
// ASPIRATION_LARGEUR de son axe), l'air est déjà poussé : la traînée baisse, d'autant plus qu'on est près.
// À appeler avant le pas des voitures ; v.aspiration va de 0 (air libre) à 1 (collé derrière).
function aspirationVoitures(voitures) {
  const R = REGLAGES;
  for (const v of voitures) {
    const c = Math.cos(v.cap), s = Math.sin(v.cap);
    let a = 0;
    for (const w of voitures) {
      if (w === v) continue;
      const dx = w.x - v.x, dz = w.z - v.z, avant = c * dx + s * dz, cote = Math.abs(-s * dx + c * dz);
      if (avant > R.LONGUEUR_VOITURE && avant < R.ASPIRATION_DISTANCE && cote < R.ASPIRATION_LARGEUR) a = Math.max(a, 1 - avant / R.ASPIRATION_DISTANCE);
    }
    v.aspiration = a;
  }
}

// Les contacts entre voitures, après le pas de chacune. Chaque voiture est un rectangle LONGUEUR_VOITURE ×
// LARGEUR_VOITURE. Deux rectangles qui se chevauchent sont écartés (moitié chacun, le long de l'axe où ils se
// chevauchent le moins), et, s'ils se rapprochaient, ils échangent de la vitesse le long de cet axe : un choc
// mou (REBOND_VOITURE), mêmes masses, la quantité de mouvement est conservée. Une voiture fait moins de 0,8 m par
// pas même à 90 m/s d'écart, bien moins que sa longueur : elle ne peut pas en traverser une autre.
// circuit (facultatif) : les voitures poussées sont replacées sur la piste (herbe, barrières)
function contactsVoitures(voitures, circuit) {
  const R = REGLAGES, hl = R.LONGUEUR_VOITURE / 2, hw = R.LARGEUR_VOITURE / 2;
  const portee2 = (2 * Math.hypot(hl, hw)) ** 2;
  const avant = voitures.map(w => w.touche);
  for (const w of voitures) w.touche = new Set();
  for (let i = 0; i < voitures.length; i++) {
    for (let j = i + 1; j < voitures.length; j++) {
      const a = voitures[i], b = voitures[j];
      const dx = b.x - a.x, dz = b.z - a.z;
      if (dx * dx + dz * dz > portee2) continue;
      // les 4 axes des deux rectangles : on cherche celui où ils se chevauchent le moins
      const ca = Math.cos(a.cap), sa = Math.sin(a.cap), cb = Math.cos(b.cap), sb = Math.sin(b.cap);
      const axes = [[ca, sa], [-sa, ca], [cb, sb], [-sb, cb]];
      let profondeur = Infinity, nx = 0, nz = 0;
      for (const [ax, az] of axes) {
        // la demi-taille de chaque rectangle sur cet axe
        const ra = hl * Math.abs(ca * ax + sa * az) + hw * Math.abs(-sa * ax + ca * az);
        const rb = hl * Math.abs(cb * ax + sb * az) + hw * Math.abs(-sb * ax + cb * az);
        const centre = dx * ax + dz * az;
        const p = ra + rb - Math.abs(centre);
        if (p <= 0) { profondeur = 0; break; }   // un axe qui les sépare : pas de contact
        if (p < profondeur) { profondeur = p; const sg = centre < 0 ? -1 : 1; nx = ax * sg; nz = az * sg; }
      }
      if (profondeur <= 0) continue;
      // n va de a vers b : on les écarte, moitié chacun
      a.x -= nx * profondeur / 2; a.z -= nz * profondeur / 2;
      b.x += nx * profondeur / 2; b.z += nz * profondeur / 2;
      // les vitesses dans le monde
      const wax = ca * a.u - sa * a.v, waz = sa * a.u + ca * a.v;
      const wbx = cb * b.u - sb * b.v, wbz = sb * b.u + cb * b.v;
      const rapproche = (wax - wbx) * nx + (waz - wbz) * nz;   // > 0 : a va vers b
      if (rapproche > 0) {
        const choc = rapproche * (1 + R.REBOND_VOITURE) / 2;   // mêmes masses
        const nwax = wax - nx * choc, nwaz = waz - nz * choc, nwbx = wbx + nx * choc, nwbz = wbz + nz * choc;
        a.u = ca * nwax + sa * nwaz; a.v = -sa * nwax + ca * nwaz;
        b.u = cb * nwbx + sb * nwbz; b.v = -sb * nwbx + cb * nwbz;
      }
      // un nouveau contact (elles ne se touchaient pas au pas d'avant), ou le même qui continue
      const nouveau = !avant[i].has(b);
      a.touche.add(b); b.touche.add(a);
      for (const w of [a, b]) {
        if (nouveau) { w.contactsVoiture++; w.chocs.push(0); w.lieuxChocs.push(w.piste ? w.piste.s : null); }
        const vitesseChoc = Math.max(0, rapproche);
        w.chocs[w.chocs.length - 1] = Math.max(w.chocs[w.chocs.length - 1], vitesseChoc);
        w.chocMax = Math.max(w.chocMax, vitesseChoc);
      }
      if (circuit) { contactPiste(a, circuit); contactPiste(b, circuit); }
    }
  }
}

// la vitesse limite dans un virage de courbure k (m/s), avec l'appui : v² |k| = mu (g + APPUI v² / m)
function vitesseVirage(k, mu = REGLAGES.ADHERENCE) {
  const R = REGLAGES, ka = Math.abs(k), aero = mu * R.APPUI / R.MASSE;
  return ka <= aero ? Infinity : Math.sqrt(mu * R.GRAVITE / (ka - aero));
}
