// L'IA des adversaires, en calcul pur (sans Three.js).
// Une fois par circuit : la carte (la trajectoire idéale, la vitesse possible en chaque point, les virages).
// Puis, à chaque pas : piloterIA choisit sa ligne en roulant et donne les mêmes commandes qu'un joueur,
// { gaz, frein, direction }. Elle ne voit que la piste, sa voiture et les voitures dans son champ de vision,
// et roule avec exactement la même physique (physique.js).

// la vitesse de pointe de la voiture : là où le moteur ne fait plus que compenser la traînée et le roulement
function vitesseDePointe() {
  // l'accélération baisse quand la vitesse monte : on cherche par dichotomie où elle s'annule
  let bas = 1, haut = 200;
  for (let k = 0; k < 40; k++) { const m = (bas + haut) / 2; if (accelerationPossible(m) > 0) bas = m; else haut = m; }
  return bas;
}

// l'accélération à plein gaz à la vitesse u (m/s²), avec les chiffres de la physique
function accelerationPossible(u) {
  const R = REGLAGES;
  return (Math.min(R.FORCE_MOTEUR_MAX, R.PUISSANCE / Math.max(u, 1)) - R.TRAINEE * u * u - R.ROULEMENT) / R.MASSE;
}

// la décélération au frein à fond à la vitesse u (m/s²) : les freins (avec l'appui), la traînée et le roulement
function freinagePossible(u) {
  const R = REGLAGES;
  return (R.ADHERENCE_FREIN * charge(u) + R.TRAINEE * u * u + R.ROULEMENT) / R.MASSE;
}

// la vitesse où le braquage suffit encore pour une courbure k : atan(EMPATTEMENT |k|) ≤ marge × braquageMax(u)
function vitesseBraquage(k) {
  const R = REGLAGES, besoin = Math.atan(R.EMPATTEMENT * Math.abs(k));
  if (besoin < 1e-9) return Infinity;
  // au moins la vitesse où la voiture tourne sans glisser : un virage trop serré pour le braquage se passe au pas
  return Math.max(R.VITESSE_CINEMATIQUE, R.BRAQUAGE_VITESSE * (R.IA_MARGE_BRAQUAGE * R.BRAQUAGE_MAX / besoin - 1));
}

// la courbure signée (> 0 = à droite) du cercle qui passe par a, b, c
function courbureTroisPoints(ax, az, bx, bz, cx, cz) {
  const abx = bx - ax, abz = bz - az, acx = cx - ax, acz = cz - az, bcx = cx - bx, bcz = cz - bz;
  const produit = Math.hypot(abx, abz) * Math.hypot(acx, acz) * Math.hypot(bcx, bcz);
  return produit < 1e-12 ? 0 : 2 * (abx * acz - abz * acx) / produit;
}

// la trajectoire idéale d'un circuit, d'un coup (les tests) : voir etapesTrajectoire
function calculerTrajectoire(circuit) {
  const etapes = etapesTrajectoire(circuit);
  let r = etapes.next();
  while (!r.done) r = etapes.next();
  return r.value;
}

// la trajectoire idéale d'un circuit : un écart latéral par échantillon de la piste, puis la vitesse conseillée.
// C'est un générateur : il s'arrête (yield) après chaque passe, pour que la page puisse découper le calcul sur
// plusieurs images sans se bloquer. Le calcul est exactement le même, découpé ou d'un coup.
// À la fin : { ecart, x, z, courbure, ds, vitesse, vitesseLimite } (des tableaux de circuit.nb valeurs)
function* etapesTrajectoire(circuit) {
  const R = REGLAGES, n = circuit.nb, cx = circuit.x, cz = circuit.z, nx = circuit.nx, nz = circuit.nz;
  const limite = circuit.largeur / 2 - R.IA_MARGE_BORD;
  const ecart = new Float64Array(n), x = new Float64Array(n), z = new Float64Array(n);
  for (let i = 0; i < n; i++) { x[i] = cx[i]; z[i] = cz[i]; }

  // le lissage : chaque point glisse en travers de la piste, sans sortir des bords, jusqu'à ce que la courbure
  // de la trajectoire en ce point soit la moyenne de celles de ses voisins (à ±k échantillons). La courbure varie
  // alors doucement : la trajectoire part de l'extérieur, touche la corde, ressort à l'extérieur, en arcs aussi
  // larges que la piste le permet. D'abord avec des voisins lointains (la forme d'ensemble), puis proches (les détails).
  const placer = (i, e) => { ecart[i] = e; x[i] = cx[i] + nx[i] * e; z[i] = cz[i] + nz[i] * e; };
  const DELTA = 0.01;   // m : le petit déplacement qui mesure comment la courbure change quand le point glisse
  for (const [k, passes] of R.IA_LISSAGE_PASSES) {
    for (let p = 0; p < passes; p++) {
      for (let i = 0; i < n; i++) {
        const a = (i - k + n) % n, b = (i + k) % n, a2 = (i - 2 * k + 2 * n) % n, b2 = (i + 2 * k) % n;
        const voulue = (courbureTroisPoints(x[a2], z[a2], x[a], z[a], x[i], z[i]) + courbureTroisPoints(x[i], z[i], x[b], z[b], x[b2], z[b2])) / 2;
        const ici = courbureTroisPoints(x[a], z[a], x[i], z[i], x[b], z[b]);
        const decale = courbureTroisPoints(x[a], z[a], x[i] + nx[i] * DELTA, z[i] + nz[i] * DELTA, x[b], z[b]);
        const pente = (decale - ici) / DELTA;
        if (Math.abs(pente) < 1e-12) continue;
        placer(i, Math.max(-limite, Math.min(limite, ecart[i] + R.IA_LISSAGE_FORCE * (voulue - ici) / pente)));
      }
      yield;
    }
  }

  // l'aplatissement : le lissage laisse un pic de courbure au point de corde (la courbure monte puis redescend en
  // ligne droite). Chaque point glisse ensuite pour rendre plus petite la somme, sur les trois courbures qu'il touche,
  // de u² + u^IA_PLATEAU_PUISSANCE, où u = courbure / pic du virage (la plus forte à ±IA_PLATEAU_FENETRE) :
  // u² garde la trajectoire lisse partout, u^puissance écrase le pic, qui s'étale en un arc presque rond.
  // Le point emmène ses voisins jusqu'à ±k en chapeau (pas de vagues entre les points). Les courbures changent
  // presque en ligne droite quand il glisse : le déplacement est un pas de Newton.
  const P = R.IA_PLATEAU_PUISSANCE, W = R.IA_PLATEAU_FENETRE;
  const kA = new Float64Array(3), kB = new Float64Array(3), absolu = new Float64Array(n), pic = new Float64Array(n);
  const glisser = (i, k, c) => {
    for (let m = 1 - k; m < k; m++) {
      const j = (i + m + n) % n;
      placer(j, Math.max(-limite, Math.min(limite, ecart[j] + c * (1 - Math.abs(m) / k))));
    }
  };
  for (const [k, passes] of R.IA_PLATEAU_PASSES) {
    const courbureEn = j => {
      const a = (j - k + n) % n, b = (j + k) % n;
      return courbureTroisPoints(x[a], z[a], x[j], z[j], x[b], z[b]);
    };
    for (let p = 0; p < passes; p++) {
      // le pic de chaque virage, autour de chaque point
      for (let j = 0; j < n; j++) absolu[j] = Math.abs(courbureEn(j));
      for (let j = 0; j < n; j++) {
        let m = 1e-4;
        for (let d = -W; d <= W; d++) m = Math.max(m, absolu[(j + d + n) % n]);
        pic[j] = m;
      }
      for (let i = 0; i < n; i++) {
        const voisins = [(i - k + n) % n, i, (i + k) % n], e0 = ecart[i];
        for (let m = 0; m < 3; m++) kA[m] = courbureEn(voisins[m]);
        placer(i, e0 + DELTA);
        for (let m = 0; m < 3; m++) kB[m] = (courbureEn(voisins[m]) - kA[m]) / DELTA;
        placer(i, e0);
        let d1 = 0, d2 = 0;
        for (let m = 0; m < 3; m++) {
          const q = pic[voisins[m]], u = kA[m] / q, b = kB[m] / q;
          d1 += (2 * u + P * Math.pow(Math.abs(u), P - 1) * Math.sign(u)) * b;
          d2 += (2 + P * (P - 1) * Math.pow(Math.abs(u), P - 2)) * b * b;
        }
        if (d2 > 1e-30) glisser(i, k, -d1 / d2);
      }
      yield;
    }
  }

  // la courbure de la trajectoire, et la longueur de chaque morceau
  const h = R.IA_COURBURE_DEMI_BASE, courbure = new Float64Array(n), ds = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = (i - h + n) % n, b = (i + h) % n, j = (i + 1) % n;
    courbure[i] = courbureTroisPoints(x[a], z[a], x[i], z[i], x[b], z[b]);
    ds[i] = Math.hypot(x[j] - x[i], z[j] - z[i]);
  }

  // la vitesse limite en chaque point : l'adhérence, le braquage, la vitesse de pointe
  const pointe = vitesseDePointe();
  const vitesseLimite = new Float64Array(n), vitesse = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    vitesseLimite[i] = Math.min(pointe, vitesseVirage(courbure[i]) * R.IA_MARGE_VIRAGE, vitesseBraquage(courbure[i]));
    vitesse[i] = vitesseLimite[i];
  }
  // passe arrière : avant un virage, on doit pouvoir freiner jusqu'à sa vitesse (deux tours : la boucle se referme)
  for (let t = 2 * n - 1; t >= 0; t--) {
    const i = t % n, j = (i + 1) % n;
    vitesse[i] = Math.min(vitesse[i], Math.sqrt(vitesse[j] * vitesse[j] + 2 * R.IA_MARGE_FREIN * freinagePossible(vitesse[j]) * ds[i]));
  }
  // passe avant : en sortie de virage, on ne peut pas accélérer plus vite que le moteur
  for (let t = 0; t < 2 * n; t++) {
    const i = t % n, j = (i + 1) % n;
    vitesse[j] = Math.min(vitesse[j], Math.sqrt(Math.max(0, vitesse[i] * vitesse[i] + 2 * accelerationPossible(vitesse[i]) * ds[i])));
  }
  return { ecart, x, z, courbure, ds, vitesse, vitesseLimite };
}

// la vitesse pour rester derrière une voiture plus lente : devant = { distance, vitesse } (distance entre les deux
// voitures, le long de la piste, en m). Assez lente pour pouvoir freiner jusqu'à sa vitesse avant d'être à
// IA_DISTANCE_MIN d'elle, et qui revient doucement à IA_DISTANCE_SUIVI derrière elle.
function vitesseDerriere(devant) {
  const R = REGLAGES, vd = Math.max(0, devant.vitesse);
  const marge = Math.max(0, devant.distance - R.IA_DISTANCE_MIN);
  const freinable = Math.sqrt(vd * vd + 2 * R.IA_MARGE_FREIN * freinagePossible(vd) * marge);
  return Math.max(0, Math.min(freinable, vd + R.IA_GAIN_DISTANCE * (devant.distance - R.IA_DISTANCE_SUIVI)));
}

// ---------------------------------------------------------------------------------------------------------------
// LE PILOTE QUI CHOISIT SA LIGNE
// La carte d'un circuit, c'est ce qu'un pilote sait de la piste avant de rouler : la trajectoire idéale (où passer
// quand on est seul, à quelle vitesse) et où sont les virages. Ce n'est pas la ligne suivie. Toutes les
// IA_PERIODE_DECISION secondes, chaque pilote construit quelques lignes possibles sur les IA_HORIZON mètres devant
// lui, qui partent de là où il est (sa position, son cap) : sa ligne rapide (la carte, à sa façon : point de corde
// tôt ou tard, marge au bord, et un peu différente à chaque tour), plus à l'intérieur, plus à l'extérieur, garder
// sa ligne, à gauche ou à droite de la voiture devant. Il note chacune (le temps qu'elle donne, d'après la
// physique, plus des pénalités : bords, voitures qu'il voit, freinage impossible) et suit la meilleure.

// la carte : { circuit, trajectoire, virages: [{ s, sens }] } (le sommet de chaque virage, sens > 0 = à droite)
function carteDepuis(circuit, trajectoire) {
  const R = REGLAGES, n = circuit.nb, k = trajectoire.courbure, virages = [];
  const fenetre = Math.round(R.IA_VIRAGE_ECART / circuit.pas);
  for (let i = 0; i < n; i++) {
    const a = Math.abs(k[i]);
    if (a < R.IA_VIRAGE_COURBURE) continue;
    let sommet = true;
    for (let d = -fenetre; d <= fenetre && sommet; d++) {
      const voisin = Math.abs(k[(i + d + n) % n]);
      if (d < 0 ? voisin >= a : d > 0 && voisin > a) sommet = false;
    }
    if (sommet) virages.push({ s: circuit.s[i], sens: Math.sign(k[i]) });
  }
  return { circuit, trajectoire, virages, pointe: vitesseDePointe() };
}

// le meilleur tour d'un pilote seul, estimé sans le simuler : la vitesse de la carte, à son rythme dans les virages
// (la vitesse de pointe reste celle de la voiture)
function tourEstime(carte, rythme) {
  const tr = carte.trajectoire;
  let t = 0;
  for (let i = 0; i < tr.vitesse.length; i++) {
    const v = tr.vitesse[i];
    t += tr.ds[i] / (v < carte.pointe * 0.999 ? rythme * v : v);
  }
  return t;
}

// un écart de s ramené dans ]-L/2, L/2]
function ecartLeLong(circuit, ds) {
  const L = circuit.longueur;
  ds = ((ds % L) + L) % L;
  return ds > L / 2 ? ds - L : ds;
}

// une valeur d'un tableau par échantillon de piste, au point s (interpolée)
function valeurEn(circuit, tableau, s) {
  const n = circuit.nb, f = (((s % circuit.longueur) + circuit.longueur) % circuit.longueur) / circuit.pas;
  const i = Math.floor(f) % n, j = (i + 1) % n, a = f - Math.floor(f);
  return tableau[i] * (1 - a) + tableau[j] * a;
}

// le point de la piste à s, à l'écart e (dans sortie[0], sortie[1]) ; rend le cap de la piste en s
function pointPiste(circuit, s, e, sortie) {
  const n = circuit.nb, f = (((s % circuit.longueur) + circuit.longueur) % circuit.longueur) / circuit.pas;
  const i = Math.floor(f) % n, j = (i + 1) % n, a = f - Math.floor(f), b = 1 - a;
  const nx = circuit.nx[i] * b + circuit.nx[j] * a, nz = circuit.nz[i] * b + circuit.nz[j] * a;
  sortie[0] = circuit.x[i] * b + circuit.x[j] * a + nx * e;
  sortie[1] = circuit.z[i] * b + circuit.z[j] * a + nz * e;
  return Math.atan2(-nx, nz);   // n = (-tz, tx) : la tangente est (nz, -nx)
}

// la façon de piloter d'un pilote, tirée avec hasard() (le seul hasard du jeu ; l'appelant choisit la graine) :
// point de corde (m, < 0 = tôt), corde (m de largeur de piste qu'il n'utilise pas près des virages), marge au bord (m), marge de freinage,
// et pour chaque tour et chaque virage une
// petite variation du point de corde et de la place sur la piste. nbTours : combien de tours tirer d'avance.
function tirerStyle(carte, nbTours) {
  const R = REGLAGES, entre = ([a, b]) => a + hasard() * (b - a);
  const style = { apex: entre(R.IA_STYLE_APEX), corde: entre(R.IA_STYLE_CORDE), margeBord: entre(R.IA_STYLE_MARGE_BORD), frein: entre(R.IA_STYLE_FREIN), tours: nbTours, variations: new Float64Array(nbTours * carte.virages.length * 2) };
  for (let i = 0; i < style.variations.length; i += 2) {
    style.variations[i] = (2 * hasard() - 1) * R.IA_VARIATION_APEX;
    style.variations[i + 1] = (2 * hasard() - 1) * R.IA_VARIATION_COTE;
  }
  return style;
}

// le pilote neutre : la carte telle quelle, sans variation (les essais d'une IA seule)
function styleNeutre() {
  return { apex: 0, corde: 0, margeBord: REGLAGES.IA_MARGE_BORD, frein: 1, tours: 1, variations: null };
}

// un pilote : sa carte, son rythme (part de la vitesse possible qu'il vise), son style, la ligne qu'il suit.
// decalage (s) : quand il prend sa première décision (pour que 20 pilotes ne décident pas tous au même pas)
function creerPilote(carte, rythme = 1, style = styleNeutre(), decalage = 0) {
  const N = Math.round(REGLAGES.IA_HORIZON / REGLAGES.IA_LIGNE_PAS) + 1;
  return {
    carte, rythme, style, attente: decalage, tour: 0, sAvant: null, choix: null, decisions: 0,
    grille: null,    // au départ : sa place sur la grille (d) ; il garde sa file sur les premiers mètres (IA_DEPART)
    parcouru: 0,     // m roulés depuis le départ
    ligne: null,   // { s0, e, v } : l'écart et la vitesse visée tous les IA_LIGNE_PAS m à partir de s0
    // les tableaux de travail (pas d'objets créés à chaque décision)
    tampons: { rapide: new Float64Array(N + 1), cible: new Float64Array(N + 1), e: new Float64Array(N), x: new Float64Array(N), z: new Float64Array(N), k: new Float64Array(N), vb: new Float64Array(N), meilleurE: new Float64Array(N), meilleurV: new Float64Array(N) },
  };
}

// la ligne rapide du pilote au point s (s compté depuis le début de son tour en cours, il peut dépasser L) :
// la carte, avec son point de corde et sa marge au bord, et la variation de ce tour pour chaque virage.
// proches (facultatif) : les numéros des seuls virages qui peuvent compter (les autres sont trop loin)
function ligneRapide(pilote, s, proches) {
  const R = REGLAGES, carte = pilote.carte, c = carte.circuit, st = pilote.style;
  const tour = (pilote.tour + Math.floor(s / c.longueur)) % st.tours, nv = carte.virages.length;
  let sCarte = s, cote = 0, corde = 0;
  const nb = proches ? proches.length : nv;
  for (let q = 0; q < nb; q++) {
    const j = proches ? proches[q] : q;
    const x = ecartLeLong(c, s - carte.virages[j].s) / R.IA_VIRAGE_LARGEUR;
    if (Math.abs(x) >= 1) continue;
    const bosse = (1 - x * x) * (1 - x * x);
    const var0 = st.variations ? st.variations[(tour * nv + j) * 2] : 0, var1 = st.variations ? st.variations[(tour * nv + j) * 2 + 1] : 0;
    sCarte -= (st.apex + var0) * bosse;
    cote += var1 * bosse;
    corde = Math.max(corde, st.corde * bosse);
  }
  const limite = c.largeur / 2 - st.margeBord;
  const echelle = limite / (c.largeur / 2 - R.IA_MARGE_BORD);
  // la corde : près des virages, il utilise moins la largeur de la piste (sa ligne se rapproche du milieu)
  let e = valeurEn(c, carte.trajectoire.ecart, sCarte) * echelle;
  e -= Math.sign(e) * Math.min(Math.abs(e), corde);
  return Math.max(-limite, Math.min(limite, e + cote));
}

// le sens du prochain virage dans les IA_HORIZON m devant s (0 s'il n'y en a pas)
function sensProchainVirage(carte, s) {
  let mieux = Infinity, sens = 0;
  for (const v of carte.virages) {
    const d = ((v.s - s) % carte.circuit.longueur + carte.circuit.longueur) % carte.circuit.longueur;
    if (d < REGLAGES.IA_HORIZON && d < mieux) { mieux = d; sens = v.sens; }
  }
  return sens;
}

// la note d'une ligne (e[0..N-1], tous les IA_LIGNE_PAS m depuis s0) : son temps (s) plus les pénalités.
// Remplit t.vb : la vitesse visée en chaque point (la plus haute dont on peut encore freiner pour la suite).
// voisines : les voitures vues qui comptent (devant, à côté, juste derrière : voir deciderLigne)
function noterLigne(pilote, v, voisines, s0, t, type) {
  const R = REGLAGES, c = pilote.carte.circuit, pas = R.IA_LIGNE_PAS, e = t.e, x = t.x, z = t.z, k = t.k, vb = t.vb, N = e.length;
  const p = [0, 0];
  for (let i = 0; i < N; i++) { pointPiste(c, s0 + i * pas, e[i], p); x[i] = p[0]; z[i] = p[1]; }
  const h = R.IA_LIGNE_DEMI_BASE;
  for (let i = h; i < N - h; i++) k[i] = courbureTroisPoints(x[i - h], z[i - h], x[i], z[i], x[i + h], z[i + h]);
  for (let i = 0; i < h; i++) { k[i] = k[h]; k[N - 1 - i] = k[N - 1 - h]; }
  const pointe = pilote.carte.pointe, dehors = c.largeur / 2 + R.MARGE_HERBE, bord = c.largeur / 2 - R.IA_MARGE_BORD_MIN;
  let penalite = 0;
  for (let i = 0; i < N; i++) {
    const mu = R.ADHERENCE * (Math.abs(e[i]) > dehors ? R.ADHERENCE_HERBE : 1);
    // le rythme (le talent) joue dans les virages ; la vitesse de pointe est celle de la voiture
    vb[i] = Math.min(pointe, pilote.rythme * Math.min(vitesseVirage(k[i], mu) * R.IA_MARGE_VIRAGE, vitesseBraquage(k[i])));
    if (Math.abs(e[i]) > bord) penalite += R.IA_PENALITE_BORD * (Math.abs(e[i]) - bord) * pas;
  }
  // au bout de la ligne, la carte dit à quelle vitesse il faut arriver (les virages d'après)
  const fin = valeurEn(c, pilote.carte.trajectoire.vitesse, s0 + (N - 1) * pas);
  vb[N - 1] = Math.min(vb[N - 1], fin < pointe * 0.999 ? pilote.rythme * fin : fin);
  const frein = R.IA_MARGE_FREIN * pilote.style.frein;
  for (let i = N - 2; i >= 0; i--) {
    const ds = Math.hypot(x[i + 1] - x[i], z[i + 1] - z[i]);
    vb[i] = Math.min(vb[i], Math.sqrt(vb[i + 1] * vb[i + 1] + 2 * frein * freinagePossible(vb[i + 1]) * ds));
  }
  const u = Math.max(0, v.u);
  if (u > vb[0]) penalite += R.IA_PENALITE_FREIN * (u - vb[0]);
  // le temps, en partant de sa vitesse : il accélère au plus comme le moteur, freine au plus comme les freins
  let temps = 0, vitesse = u;
  const touchees = new Set();
  for (let i = 0; i < N - 1; i++) {
    const ds = Math.hypot(x[i + 1] - x[i], z[i + 1] - z[i]);
    const monte = Math.sqrt(vitesse * vitesse + 2 * Math.max(0, accelerationPossible(vitesse)) * ds);
    const descend = Math.sqrt(Math.max(0, vitesse * vitesse - 2 * freinagePossible(vitesse) * ds));
    let suivante = Math.max(descend, Math.min(monte, vb[i + 1]));
    // les voitures qu'il voit : où seront-elles quand il passera ici ? (elles gardent leur vitesse et leur place)
    // Sur une ligne qui passe derrière l'une d'elles, il est bloqué à sa vitesse ; s'il la touche, c'est très cher
    if (temps < R.IA_PREDICTION) for (const w of voisines) {
      if (Math.abs(e[i + 1] - w.d) >= R.LARGEUR_VOITURE + R.IA_MARGE_LAT) continue;
      const ecart = ecartLeLong(c, w.s + w.vitesse * temps - (s0 + (i + 1) * pas));
      if (ecart > 0 && ecart < R.IA_DISTANCE_SUIVI) suivante = Math.max(descend, Math.min(suivante, w.vitesse));
      if (!touchees.has(w) && Math.abs(ecart) < R.LONGUEUR_VOITURE + R.IA_MARGE_LONG) {
        penalite += R.IA_PENALITE_VOITURE;
        touchees.add(w);
      }
    }
    temps += 2 * ds / Math.max(0.5, vitesse + suivante);
    vitesse = suivante;
  }
  // au bout de la ligne, ce qu'il lui manque de vitesse se paiera plus loin
  penalite += R.IA_PENALITE_SORTIE * Math.max(0, vb[N - 1] - vitesse);
  if (pilote.choix !== null && type !== pilote.choix) penalite += R.IA_PENALITE_CHANGEMENT;
  return temps + penalite;
}

// la décision : les lignes possibles depuis là où il est, la meilleure devient sa ligne
function deciderLigne(pilote, v, vues) {
  const R = REGLAGES, carte = pilote.carte, c = carte.circuit, L = c.longueur, pas = R.IA_LIGNE_PAS, t = pilote.tampons, N = t.e.length;
  const s0 = v.piste.s;
  // la nouvelle ligne part de sa ligne d'avant, là où il en est (pas de saut) ; s'il en est loin (poussé, sorti,
  // ou au départ), elle part de la voiture : sa place sur la piste et la direction où elle pointe (de/ds)
  let e0, pente0;
  const ancienne = pilote.ligne, r = ancienne ? ((s0 - ancienne.s0) % L + L) % L : Infinity;
  if (r < R.IA_HORIZON / 2 && Math.abs(valeurLigne(ancienne.e, r) - v.piste.d) < R.IA_ECART_REPLANIF) {
    e0 = valeurLigne(ancienne.e, r);
    pente0 = (valeurLigne(ancienne.e, r + pas) - valeurLigne(ancienne.e, r - pas)) / (2 * pas);
  } else {
    let psi = v.cap - pointPiste(c, s0, 0, [0, 0]);
    psi = Math.atan2(Math.sin(psi), Math.cos(psi));
    e0 = v.piste.d;
    pente0 = Math.max(-1, Math.min(1, Math.tan(psi)));
  }
  // sa ligne rapide sur l'horizon (s compté depuis le début de son tour)
  // les seuls virages assez près de l'horizon pour changer sa ligne rapide
  const proches = [];
  carte.virages.forEach((x, j) => { const d = ((x.s - s0) % L + L) % L; if (d <= R.IA_HORIZON + pas + R.IA_VIRAGE_LARGEUR || d >= L - R.IA_VIRAGE_LARGEUR) proches.push(j); });
  for (let i = 0; i <= N; i++) {
    t.rapide[i] = ligneRapide(pilote, s0 + i * pas, proches);
    // au départ, il garde sa file, puis la quitte doucement pour sa ligne
    if (pilote.grille !== null) {
      const m = Math.max(0, Math.min(1, (pilote.parcouru + i * pas - R.IA_DEPART[0]) / (R.IA_DEPART[1] - R.IA_DEPART[0])));
      t.rapide[i] = pilote.grille * (1 - m) + t.rapide[i] * m;
    }
  }
  const limite = c.largeur / 2 - R.IA_MARGE_BORD_MIN;
  const transition = Math.max(R.IA_TRANSITION_MIN, Math.min(R.IA_HORIZON / 2, Math.max(0, v.u) * R.IA_TRANSITION_TEMPS));
  const iT = Math.max(2, Math.min(N - 2, Math.round(transition / pas)));
  const sens = sensProchainVirage(carte, s0);
  // la voiture devant lui, dans sa ligne ou presque : on peut passer à sa gauche ou à sa droite
  let devant = null;
  for (const w of vues) {
    const g = ecartLeLong(c, w.s - s0);
    if (g > 0 && g < R.IA_DEPASSEMENT_PORTEE && (!devant || g < devant.g)) devant = { g, w };
  }
  const essais = [['rapide', 0], ['continuer', 0]];
  if (sens) essais.push(['interieur', sens], ['exterieur', -sens]);
  if (devant && R.IA_DEPASSEMENT) essais.push(['gauche', -1], ['droite', 1]);
  // les voitures qui comptent pour noter ses lignes : devant lui, à côté, ou juste derrière (dans ses rétroviseurs :
  // il ne se rabat pas sur elles) ; celle qui arrive de plus loin derrière doit faire attention, pas lui
  const voisines = vues.filter(w => ecartLeLong(c, w.s - s0) > -R.IA_VISION_COTE[0]);
  let meilleure = Infinity, choix = null;
  for (const [type, cote] of essais) {
    const cible = t.cible;
    for (let i = 0; i <= N; i++) {
      const s = i * pas, r = t.rapide[i];
      let val = r;
      if (type === 'continuer') { const m = Math.max(0, Math.min(1, (s - R.IA_CONTINUER[0]) / (R.IA_CONTINUER[1] - R.IA_CONTINUER[0]))); val = e0 * (1 - m) + r * m; }
      else if (type === 'interieur' || type === 'exterieur') val = r + cote * R.IA_DECALAGE_CANDIDAT;
      else if (type === 'gauche' || type === 'droite') {
        // à côté de la voiture devant, d'un peu avant elle à un peu après, puis retour à sa ligne
        const debut = devant.g - R.IA_DEPASSEMENT_AVANT, fin = devant.g + devant.w.vitesse * R.IA_DEPASSEMENT_TEMPS + R.IA_DEPASSEMENT_APRES;
        const m = s < debut ? Math.max(0, 1 - (debut - s) / R.IA_DEPASSEMENT_RAMPE) : s > fin ? Math.max(0, 1 - (s - fin) / R.IA_DEPASSEMENT_RAMPE) : 1;
        val = r * (1 - m) + (devant.w.d + cote * (R.LARGEUR_VOITURE + R.IA_ECART_DEPASSEMENT)) * m;
      }
      cible[i] = Math.max(-limite, Math.min(limite, val));
    }
    // la transition : de là où il est (écart e0, pente0) jusqu'à la cible, sans saut. L'écart à la cible
    // s'éteint doucement (Hermite) : la forme de la cible est gardée, même dans un enchaînement de virages
    const ecart0 = e0 - cible[0], pente = pente0 - (cible[1] - cible[0]) / pas, longueur = iT * pas;
    for (let i = 0; i < N; i++) {
      if (i >= iT) { t.e[i] = cible[i]; continue; }
      const a = i / iT, a2 = a * a, a3 = a2 * a;
      t.e[i] = cible[i] + (2 * a3 - 3 * a2 + 1) * ecart0 + (a3 - 2 * a2 + a) * longueur * pente;
    }
    const note = noterLigne(pilote, v, voisines, s0, t, type);
    if (pilote.journal && devant && devant.g < 40) pilote.journal.push([s0.toFixed(0), devant.g.toFixed(1), type, note.toFixed(3)].join(' '));
    if (note < meilleure) { meilleure = note; choix = type; t.meilleurE.set(t.e); t.meilleurV.set(t.vb); }
  }
  if (!pilote.ligne) pilote.ligne = { s0: 0, e: new Float64Array(N), v: new Float64Array(N) };
  pilote.ligne.s0 = s0;
  pilote.ligne.e.set(t.meilleurE);
  pilote.ligne.v.set(t.meilleurV);
  pilote.choix = choix;
  pilote.decisions++;
}

// une valeur de la ligne à la distance r (m) de son départ
function valeurLigne(tableau, r) {
  const f = Math.max(0, Math.min(tableau.length - 1, r / REGLAGES.IA_LIGNE_PAS)), i = Math.min(tableau.length - 2, Math.floor(f)), a = f - i;
  return tableau[i] * (1 - a) + tableau[i + 1] * a;
}

// à chaque pas : le pilote décide (de temps en temps), puis suit sa ligne. vues : les voitures qu'il voit
// ([{ s, d, vitesse }], où elles sont sur la piste et leur vitesse le long de la piste). Rend { gaz, frein, direction }.
function piloterIA(pilote, v, vues, dt) {
  const R = REGLAGES, c = pilote.carte.circuit, L = c.longueur, p = v.piste || positionSurPiste(c, v.x, v.z);
  if (!v.piste) v.piste = p;
  // ses tours (pour la variation d'un tour à l'autre) : la ligne passée en avançant, ou en reculant
  if (pilote.sAvant !== null && pilote.sAvant - p.s > L / 2) pilote.tour++;
  if (pilote.sAvant !== null && p.s - pilote.sAvant > L / 2) pilote.tour = Math.max(0, pilote.tour - 1);
  if (pilote.sAvant !== null) pilote.parcouru += Math.max(0, ecartLeLong(c, p.s - pilote.sAvant));
  pilote.sAvant = p.s;
  pilote.attente -= dt;
  let r = pilote.ligne ? ((p.s - pilote.ligne.s0) % L + L) % L : Infinity;
  if (!pilote.ligne || pilote.attente <= 0 || r > R.IA_HORIZON / 2) {
    deciderLigne(pilote, v, vues);
    pilote.attente = R.IA_PERIODE_DECISION;
    r = 0;
  }
  const ligne = pilote.ligne, u = Math.max(0, v.u);

  // la direction : il vise un point de sa ligne devant lui (« poursuite pure »), par rapport à la direction où la
  // voiture va vraiment (son cap plus sa glissade : une voiture qui glisse vers l'extérieur braque un peu plus)
  const visee = Math.max(R.IA_VISEE_MIN, u * R.IA_VISEE_TEMPS), q = [0, 0];
  pointPiste(c, ligne.s0 + r + visee, valeurLigne(ligne.e, r + visee), q);
  const va = v.cap + (u > R.VITESSE_CINEMATIQUE ? Math.atan2(v.v, u) : 0);
  const dx = q[0] - v.x, dz = q[1] - v.z, cc = Math.cos(va), ss = Math.sin(va);
  const angle = Math.atan2(-ss * dx + cc * dz, cc * dx + ss * dz);
  const direction = Math.atan(R.EMPATTEMENT * 2 * Math.sin(angle) / Math.hypot(dx, dz)) / braquageMax(v.u);

  // la vitesse : celle de sa ligne un peu plus loin ; et derrière une voiture qui est sur sa ligne, il reste derrière
  let cible = valeurLigne(ligne.v, r + u * R.IA_ANTICIPATION);
  for (const w of vues) {
    const g = ecartLeLong(c, w.s - p.s);
    if (g <= 0) continue;
    // sur sa ligne, ou tout près de son axe (une voiture qui se rabat devant lui) : il reste derrière
    const surSaLigne = Math.abs(valeurLigne(ligne.e, r + g) - w.d) < R.LARGEUR_VOITURE + R.IA_MARGE_LAT;
    if (surSaLigne || Math.abs(w.d - p.d) < R.IA_VISION_COULOIR) cible = Math.min(cible, vitesseDerriere({ distance: g, vitesse: w.vitesse }));
  }
  // le réflexe : il ne braque pas vers une voiture qui est à côté de lui, trop près ; s'il est un peu en retrait, il lui cède
  let dir = direction;
  for (const w of vues) {
    const g = ecartLeLong(c, w.s - p.s), cote = w.d - p.d;
    if (Math.abs(g) > R.LONGUEUR_VOITURE + R.IA_MARGE_LONG || Math.abs(cote) > R.IA_REFLEXE_COTE) continue;
    if (Math.sign(dir) === Math.sign(cote)) dir = 0;
    if (g > 0) cible = Math.min(cible, w.vitesse - R.IA_CEDER);
  }
  const ecartVitesse = cible - v.u;
  return {
    gaz: ecartVitesse > 0 ? Math.min(1, ecartVitesse * R.IA_GAIN_GAZ) : 0,
    frein: ecartVitesse < 0 ? Math.min(1, -ecartVitesse * R.IA_GAIN_FREIN) : 0,
    direction: Math.max(-1, Math.min(1, dir)),
  };
}
