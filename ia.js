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

// le type de chaque virage de la carte (tour 33, CLAUDE.md « Des techniques de pilote selon le virage ») : ce qu'un pilote voit de la piste.
// Autour de son sommet, la partie qui tourne (|courbure| > IA_TECHNIQUES.courbure) : sa longueur, son angle, son rayon le plus serré ; puis la
// droite qui suit. type : 'enchainement' (le virage suivant, de l'autre côté, arrive à moins de IA_TECHNIQUES.enchainement m : un S, une
// chicane), 'rapide' (rayon de piste au-delà de IA_TECHNIQUES.rayonRapide), 'avantDroite' (une droite d'au moins IA_TECHNIQUES.droite m après lui), 'court' (épingle, ou court), 'long', sinon 'moyen'
function typerVirages(circuit, virages) {
  const R = REGLAGES, T = R.IA_TECHNIQUES, n = circuit.nb, L = circuit.longueur, k = circuit.courbure, pas = circuit.pas, P = Math.round(T.portee / pas);
  for (const x of virages) {
    const i0 = Math.round(x.s / pas) % n;
    let a = 0, b = 0, angle = 0, kMax = 0;
    while (a < P && Math.abs(k[(i0 - a - 1 + n) % n]) > T.courbure) a++;
    while (b < P && Math.abs(k[(i0 + b + 1) % n]) > T.courbure) b++;
    for (let i = -a; i <= b; i++) { const ki = k[(i0 + i + n) % n]; angle += ki * pas; kMax = Math.max(kMax, Math.abs(ki)); }
    let d = 0, i = i0 + b;
    while (d < L && Math.abs(k[(i + 1) % n]) < R.IA_DROITE_COURBURE) { i++; d += pas; }
    x.longueurVirage = (a + b) * pas; x.angle = Math.abs(angle); x.rayonMin = kMax > 0 ? 1 / kMax : Infinity; x.droiteApres = d;
  }
  virages.forEach((x, j) => {
    const suivant = virages[(j + 1) % virages.length], ecart = ((suivant.s - x.s) % L + L) % L;
    x.type = x.rayonMin > T.rayonRapide ? 'rapide'   // (un virage rapide, presque à fond : la carte telle quelle)
      : suivant !== x && suivant.sens !== x.sens && ecart < T.enchainement ? 'enchainement'
      : x.droiteApres >= T.droite ? 'avantDroite'
      : x.rayonMin < T.rayonEpingle || x.longueurVirage < T.longueurCourt ? 'court'
      : x.longueurVirage >= T.longueurLong ? 'long' : 'moyen';
  });
}

// ses techniques selon le virage (pilote.style.techApex, techCote : un nombre par virage de la carte) : pour chaque type, IA_TECHNIQUES[type]
// donne le point de corde (m, > 0 = plus tard : sortir large, soigner la sortie) et la place (m vers l'intérieur, < 0 = vers l'extérieur),
// × son goût pour la technique (style.technique, tiré à part : GRAINE_TECHNIQUE). Ce ne sont que des décalages de sa ligne rapide : il
// choisit toujours sa ligne (deciderLigne), sa vitesse vient de la forme de sa ligne (noterLigne), pas de rail
function techniquesPilote(carte, style) {
  const T = REGLAGES.IA_TECHNIQUES, nv = carte.virages.length;
  style.techApex = new Float64Array(nv); style.techCote = new Float64Array(nv);
  carte.virages.forEach((x, j) => {
    const t = T.types[x.type];
    if (!t) return;
    style.techApex[j] = t.apex * style.technique;
    style.techCote[j] = t.interieur * x.sens * style.technique;   // (sens > 0 : virage à droite, l'intérieur est à d > 0)
  });
  return style;
}

// la marge au bord de la carte : IA_MARGE_BORD, ou celle du niveau de difficulté en cours (NIVEAUX[…].margeCarte, tour 33 : les IA d'un
// haut niveau ont une carte qui passe plus près du bord ; la voiture et la physique restent les mêmes). Au niveau normal, IA_MARGE_BORD
function margeCarte() {
  const R = REGLAGES, n = R.NIVEAUX[R.NIVEAU];
  return n && n.margeCarte !== undefined ? n.margeCarte : R.IA_MARGE_BORD;
}

// la trajectoire idéale d'un circuit, d'un coup (les tests) : voir etapesTrajectoire
function calculerTrajectoire(circuit) {
  const etapes = etapesTrajectoire(circuit);
  let r = etapes.next();
  while (!r.done) r = etapes.next();
  return r.value;
}

// x^n pour n entier ≥ 0, par multiplications seulement : le même résultat au bit près sur toute machine
// (Math.pow, lui, change d'arrondi entre Chrome macOS et Chrome Linux ; voir l'aplatissement ci-dessous)
function puissanceEntiere(x, n) {
  let r = 1;
  for (let k = 0; k < n; k++) r *= x;
  return r;
}

// la trajectoire idéale d'un circuit : un écart latéral par échantillon de la piste, puis la vitesse conseillée.
// C'est un générateur : il s'arrête (yield) après chaque passe, pour que la page puisse découper le calcul sur
// plusieurs images sans se bloquer. Le calcul est exactement le même, découpé ou d'un coup.
// À la fin : { ecart, x, z, courbure, ds, vitesse, vitesseLimite } (des tableaux de circuit.nb valeurs)
function* etapesTrajectoire(circuit) {
  const R = REGLAGES, n = circuit.nb, cx = circuit.x, cz = circuit.z, nx = circuit.nx, nz = circuit.nz;
  const limite = circuit.largeur / 2 - margeCarte();
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
  // Jamais Math.pow ici : Chrome ne l'arrondit pas pareil sur macOS et sur Linux (tour 22 : Σ|u|⁷ différait à la
  // 13e décimale, et toute la trajectoire avec), alors qu'une multiplication IEEE est la même sur toute machine.
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
          const uP2 = puissanceEntiere(Math.abs(u), P - 2), uP1 = uP2 * Math.abs(u);   // |u|^(P-2) et |u|^(P-1)
          d1 += (2 * u + P * uP1 * Math.sign(u)) * b;
          d2 += (2 + P * (P - 1) * uP2) * b * b;
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
// IA_DISTANCE_MIN d'elle, et qui revient doucement à IA_DISTANCE_SUIVI derrière elle (ou à suivi, en attaque).
function vitesseDerriere(devant, suivi = REGLAGES.IA_DISTANCE_SUIVI) {
  const R = REGLAGES, vd = Math.max(0, devant.vitesse);
  const marge = Math.max(0, devant.distance - R.IA_DISTANCE_MIN);
  const freinable = Math.sqrt(vd * vd + 2 * R.IA_MARGE_FREIN * freinagePossible(vd) * marge);
  // il se rapproche doucement près d'elle (IA_GAIN_DISTANCE), franchement de loin (IA_GAIN_DISTANCE_LOIN, au-delà de
  // deux fois la distance de suivi) : loin derrière, une voiture qui freine ne doit pas le faire freiner trop tôt
  const ecart = devant.distance - suivi, loin = Math.max(0, devant.distance - 2 * suivi);
  return Math.max(0, Math.min(freinable, vd + R.IA_GAIN_DISTANCE * (ecart - loin) + R.IA_GAIN_DISTANCE_LOIN * loin));
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
    if (sommet) virages.push({ s: circuit.s[i], sens: Math.sign(k[i]), freinage: pointDeFreinage(circuit, trajectoire, i, fenetre) });
  }
  // la ligne droite avant chaque point de freinage (on remonte tant que la piste est presque droite)
  for (const x of virages) {
    let j = Math.round(x.freinage / circuit.pas) % n, longueur = 0;
    while (longueur < circuit.longueur && Math.abs(circuit.courbure[(j - 1 + n) % n]) < R.IA_DROITE_COURBURE) { j = (j - 1 + n) % n; longueur += circuit.pas; }
    x.droite = longueur;
    // virage lent : la carte y passe sous IA_VITESSE_VIRAGE_LENT
    let vMin = Infinity;
    for (let d = -fenetre; d <= fenetre; d++) vMin = Math.min(vMin, trajectoire.vitesse[(Math.round(x.s / circuit.pas) + d + n) % n]);
    x.lent = vMin < R.IA_VITESSE_VIRAGE_LENT;
  }
  typerVirages(circuit, virages);
  return { circuit, trajectoire, virages, pointe: vitesseDePointe(), margeCarte: margeCarte() };   // (margeCarte : celle de sa trajectoire, ligneRapide)
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

// le point de freinage d'un virage (sommet à l'échantillon i) : là où la vitesse possible commence à baisser avant
// le virage. On part de la vitesse la plus basse près du sommet et on remonte tant que la vitesse monte.
function pointDeFreinage(circuit, trajectoire, i, fenetre) {
  const n = circuit.nb, vit = trajectoire.vitesse;
  let j = i;
  for (let d = -fenetre; d <= fenetre; d++) if (vit[(i + d + n) % n] < vit[j]) j = (i + d + n) % n;
  for (let k = 0; k < n && vit[(j - 1 + n) % n] > vit[j]; k++) j = (j - 1 + n) % n;
  return circuit.s[j];
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

// le caractère d'un pilote (CLAUDE.md, étape 4d), tiré avec hasard() entre les bornes de IA_CARACTERE : sa
// régularité (d'un tour à l'autre, il perd jusqu'à cette part de son rythme), son agressivité (0 à 1) et son taux d'erreurs
// (erreurs par course de 5 tours). tours : pour chaque tour, le facteur de rythme de ce tour.
function tirerCaractere(nbTours) {
  const C = REGLAGES.IA_CARACTERE, entre = ([a, b]) => a + hasard() * (b - a);
  const caractere = { regularite: entre(C.regularite), agressivite: entre(C.agressivite), erreurs: entre(C.erreurs), tours: new Float64Array(nbTours) };
  // jamais au-delà de son rythme (au-delà, il dépasserait la limite d'adhérence de la carte) : un tour, il perd entre
  // 0 et deux fois sa régularité (± sa régularité autour de sa moyenne)
  for (let t = 0; t < nbTours; t++) caractere.tours[t] = 1 - 2 * caractere.regularite * hasard();
  return caractere;
}

// sa gestion des pneus (étape 7, pneus.js), tirée à part (GRAINE_PNEUS) pour ne pas décaler les autres tirages
function tirerGestionPneus() {
  const [a, b] = REGLAGES.IA_CARACTERE.gestionPneus;
  return a + hasard() * (b - a);
}

// ses erreurs, tirées d'avance avec hasard() : à chaque tour, avec une probabilité « taux d'erreurs / IA_ERREUR_TOURS »,
// une erreur à un virage tiré au hasard, d'un type tiré au hasard (IA_ERREUR_TYPES). On tire toujours les trois
// nombres de chaque tour, pour que la suite du hasard ne dépende pas du taux.
function tirerErreurs(carte, caractere, nbTours) {
  const R = REGLAGES, liste = [];
  for (let t = 0; t < nbTours; t++) {
    const h = hasard(), j = Math.floor(hasard() * carte.virages.length), k = Math.floor(hasard() * R.IA_ERREUR_TYPES.length);
    if (h < caractere.erreurs / R.IA_ERREUR_TOURS) liste.push({ tour: t, virage: j, type: R.IA_ERREUR_TYPES[k], faite: false });
  }
  return liste;
}

// une erreur prévue à ce tour, à ce virage, se déclenche à son endroit : au point de freinage (freinage trop tard,
// blocage de roues) ou un peu avant le sommet (sortie large) ; jamais avec une voiture à côté ou derrière lui à moins
// de IA_DISTANCE_ERREUR : il l'évite (elle ne se fera pas). Pendant l'erreur, seulement de mauvaises commandes.
function majErreur(pilote, v, vues, dt) {
  const R = REGLAGES, carte = pilote.carte, c = carte.circuit, p = v.piste;
  pilote.horloge += dt;
  if (pilote.erreur && pilote.horloge > pilote.erreur.fin) pilote.erreur = null;
  pilote.enErreur = pilote.erreur !== null || pilote.horloge < pilote.finSuiteErreur;
  if (pilote.erreur || !pilote.erreurs) return;
  if (pilote.stand) return;   // en route vers les stands (étape 7) : pas d'erreur prévue (elles sont aux virages)
  for (const x of pilote.erreurs) {
    if (x.faite || x.tour !== pilote.tour) continue;
    const vir = carte.virages[x.virage], ou = x.type === 'large' ? vir.s - R.IA_ERREUR_AVANT_SOMMET : vir.freinage;
    const d = ecartLeLong(c, p.s - ou);
    if (d < 0 || d > R.IA_ERREUR_FENETRE) continue;
    x.faite = true;
    // … ni, pour un freinage raté (freinage, blocage), avec une voiture devant lui à moins de IA_ERREUR_TEMPS_DEVANT s
    // de route : il lui rentrerait dedans (tour 18 : un blocage à 2350 m, choc à 18 m/s 96 m plus loin)
    const devant = x.type === 'large' ? 0 : Math.max(R.IA_DISTANCE_ERREUR, Math.max(0, v.u) * R.IA_ERREUR_TEMPS_DEVANT);
    const proche = vues.some(w => { const g = ecartLeLong(c, w.s - p.s); return (g > -R.IA_DISTANCE_ERREUR && g < R.LONGUEUR_VOITURE) || (g >= 0 && g < devant); });
    if (proche) { x.evitee = true; continue; }
    const duree = R.IA_ERREUR_DUREES[x.type];
    pilote.erreur = { type: x.type, fin: pilote.horloge + duree };
    pilote.finSuiteErreur = pilote.horloge + duree + R.IA_ERREUR_SUITE;
    pilote.erreursFaites.push({ type: x.type, tour: x.tour, s: p.s });
    pilote.enErreur = true;
    if (pilote.attaque) finirAttaque(pilote, false, 'erreur');   // une erreur met fin à son attaque
    return;
  }
}

// le rythme qu'il vise dans ce tour : le sien, moins ce que lui coûte sa régularité dans ce tour
function rythmeDuTour(pilote) {
  const c = pilote.caractere;
  return pilote.rythme * (c ? c.tours[pilote.tour % c.tours.length] : 1);
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
    caractere: null, // son caractère (tirerCaractere) ; null = un pilote parfaitement régulier, sans erreur
    erreurs: null,   // ses erreurs prévues (tirerErreurs) ; erreur : celle en cours { type, fin } ; enErreur : pendant et juste après
    erreur: null, enErreur: false, finSuiteErreur: -1, horloge: 0, erreursFaites: [],
    grille: null,    // au départ : sa place sur la grille (d) ; il garde sa file sur les premiers mètres (IA_DEPART)
    parcouru: 0,     // m roulés depuis le départ
    retenue: 0,      // s : depuis combien de temps une voiture devant le retient…
    retenuePar: null,  // … et laquelle (le repère de voituresVues)
    attaque: null,   // { id, etat: preparer | decaler | plonger, virage, cote, duree } quand il attaque
    cede: null,      // { id, duree } : la voiture à côté de lui à qui il cède le virage
    lentesVues: new Map(),   // voiture vue devant lui → { lente, arret } : depuis combien de secondes elle roule sous IA_LENTE_PART de la carte, sous IA_ARRET_VITESSE (estLente)
    repos: 0,        // s avant de pouvoir réattaquer après une attaque abandonnée
    attaques: 0, reussies: 0,
    parCible: new Map(),   // voiture → { attaques, reussies } (compterCible)
    vitessesVues: new Map(),   // voiture vue devant lui → sa vitesse au pas d'avant (freinsVus)
    rivalite: false,       // le rival du joueur (l'interview d'après course, simulation.js poserRivalites) : plus agressif contre lui seulement
    defenses: 0, defenseVirage: null,   // ses défenses contre le joueur (defendreContreJoueur)
    ligne: null,   // { s0, e, v } : l'écart et la vitesse visée tous les IA_LIGNE_PAS m à partir de s0
    // les tableaux de travail (pas d'objets créés à chaque décision)
    tampons: { plafond: new Float64Array(N), rapide: new Float64Array(N + 1), cible: new Float64Array(N + 1), e: new Float64Array(N), x: new Float64Array(N), z: new Float64Array(N), k: new Float64Array(N), vb: new Float64Array(N), meilleurE: new Float64Array(N), meilleurV: new Float64Array(N) },
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
    sCarte -= (st.apex + var0 + (st.techApex ? st.techApex[j] : 0)) * bosse;
    cote += (var1 + (st.techCote ? st.techCote[j] : 0)) * bosse;   // (ses techniques selon le virage : techniquesPilote ; aucune pour le pilote neutre)
    corde = Math.max(corde, st.corde * bosse);
  }
  const limite = c.largeur / 2 - st.margeBord;
  const echelle = limite / (c.largeur / 2 - (carte.margeCarte === undefined ? R.IA_MARGE_BORD : carte.margeCarte));
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

// une voiture vue qui roule très en dessous de la vitesse de la carte à son endroit (IA_LENTE_PART), ou arrêtée :
// on la contourne par la ligne « éviter » dès qu'il y a la place, n'importe où sur le circuit (décision du propriétaire, tour 22 :
// « ils sont censés doubler ») ; la file et l'attaque sont pour une voiture qui roule à peu près au même rythme
// Tour 25 : arrêtée ou presque (IA_ARRET_VITESSE), ou lente depuis plus de IA_LENTE_DUREE (pilote.lentesVues, tenu à jour par
// piloterIA d'un pas à l'autre) : une voiture en erreur qui se remet n'est pas contournée, une voiture bloquée l'est toujours.
// Et pas plus rapide que lui (de plus de IA_LENTE_PLUS_RAPIDE) : une voiture qui repart devant lui n'est pas un obstacle.
function estLente(pilote, v, w) {
  const R = REGLAGES;
  // (pas pendant le lancement du départ : tout le monde est lent, personne n'est à contourner)
  if (pilote.parcouru < R.IA_DEPART_LANCEMENT) return false;
  // (une voiture qui entre aux stands ou en sort, étape 7 : elle ralentit ou rejoint la piste au ralenti, ça se voit ; on la contourne tout de suite)
  if (w.id && (w.id.manoeuvreStands || w.id.rampeStands) && w.vitesse < v.u) return true;
  // (une voiture qui fait une erreur devant lui — elle bloque ses roues, elle part large, ça se voit — et qui roule moins vite que lui : il
  // en profite tout de suite, comme d'une voiture lente ; sans ça, il restait à la file derrière elle pendant qu'elle se remettait)
  if (R.IA_PROFITER_ERREUR && w.id && w.id.enErreur && w.vitesse < v.u) return true;
  // (une consigne d'équipe : son coéquipier devant lui le laisse passer ; il le passe comme une voiture lente, sans attendre l'attaque)
  if (pilote.passer && w.id === pilote.passer.id && w.vitesse < v.u + R.IA_LENTE_PLUS_RAPIDE) return true;
  const vue = pilote.lentesVues.get(w.id);
  if (!vue) return false;
  // (des durées : le peloton du départ roule groupé sous la vitesse de la carte pendant ~3 s, un bouchon à l'épingle descend
  // sous IA_ARRET_VITESSE une seconde ; ni l'un ni l'autre n'est une voiture bloquée, qui, elle, le reste)
  if (vue.arret >= R.IA_ARRET_DUREE) return true;
  return w.vitesse < v.u + R.IA_LENTE_PLUS_RAPIDE && vue.lente >= R.IA_LENTE_DUREE;
}

// sous IA_LENTE_PART de la vitesse de la carte à son endroit
function sousLaCarte(carte, w) {
  return w.vitesse < REGLAGES.IA_LENTE_PART * valeurEn(carte.circuit, carte.trajectoire.vitesse, w.s);
}

// l'écart sûr entre deux voitures côte à côte (de centre à centre) : une largeur de voiture et IA_MARGE_LAT
function ecartSur(u) {
  return REGLAGES.LARGEUR_VOITURE + REGLAGES.IA_MARGE_LAT;
}

// côte à côte dans un virage rapide (la piste tourne et la carte y passe à plus de IA_VITESSE_RAPIDE), l'écart à
// laisser est plus grand (IA_MARGE_LAT_RAPIDE) : la moindre glissade compte
function ecartCoteACote(carte, s) {
  const R = REGLAGES, c = carte.circuit;
  const rapide = Math.abs(valeurEn(c, c.courbure, s)) > R.IA_DROITE_COURBURE && valeurEn(c, carte.trajectoire.vitesse, s) > R.IA_VITESSE_RAPIDE;
  return R.LARGEUR_VOITURE + (rapide ? R.IA_MARGE_LAT_RAPIDE : R.IA_MARGE_LAT);
}

// où sera de côté (d) une voiture vue w, quand elle sera en s : elle garde son écart à la ligne idéale de la carte.
// (Un pilote s'attend à ce que les autres suivent la trajectoire, pas une ligne droite.)
// Tout près de lui (à moins de IA_PREVISION_PROCHE m de lui le long de la piste, sPilote), elle garde sa place.
function dPrevu(carte, w, s, sPilote) {
  if (Math.abs(ecartLeLong(carte.circuit, w.s - sPilote)) < REGLAGES.IA_PREVISION_PROCHE) return w.d;
  if (w.ecartCarte === undefined) w.ecartCarte = valeurEn(carte.circuit, carte.trajectoire.ecart, w.s);
  return w.d + valeurEn(carte.circuit, carte.trajectoire.ecart, s) - w.ecartCarte;
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
  // (aileron, Codeur 3 : sa vitesse de pointe avec la traînée de son aileron ; ÷ 1 au cran du milieu)
  const pointe = pilote.carte.pointe / racineCubique(v.aileronTrainee || 1), rythme = rythmeDuTour(pilote), dehors = c.largeur / 2 + R.MARGE_HERBE, bord = c.largeur / 2 - (pilote.bordMin === undefined ? R.IA_MARGE_BORD_MIN : pilote.bordMin);   // (le niveau : pilote.bordMin)
  // (la limite qu'il ose, pilote.limite : le niveau de difficulté, NIVEAUX[…].limite ; la voiture accroche un peu plus que vitesseVirage
  // ne le dit, l'arrière accroche plus que l'avant : un pilote de haut niveau va la chercher ; × 1 au niveau normal, au bit près)
  const lim = pilote.limite || 1;
  let penalite = 0, danger = false;   // danger : la ligne passe trop près du bord, dans l'herbe ou sur une voiture
  for (let i = 0; i < N; i++) {
    // (ses pneus usés : il connaît son adhérence réelle, v.adherence ; × 1 sans pneus, le même nombre au bit près)
    // (aileron, Codeur 3 : il connaît aussi l'adhérence de son aileron, v.aileronAdherence ; × 1 au cran du milieu)
    const mu = R.ADHERENCE * (v.adhMeteo || 1) * (v.adherence || 1) * (v.aileronAdherence || 1) * (Math.abs(e[i]) > dehors && type !== 'stands' ? R.ADHERENCE_HERBE : 1);   // (la voie des stands n'est pas de l'herbe)
    // le rythme (le talent) joue dans les virages ; la vitesse de pointe est celle de la voiture
    // (virage serré, sous IA_RAYON_SERRE m de rayon de piste : la courbure mesurée sur ±IA_LIGNE_DEMI_BASE points (±8 m) lisse le coin
    // d'une épingle et la sous-estime ; il prend aussi celle des points voisins (±IA_LIGNE_PAS m), la plus forte des deux : sinon il y
    // arrivait trop vite et sortait large, dans l'herbe ; tracés officiels : Monoco, Suzuko, Montréol, Yas Marino)
    let kv = Math.abs(k[i]);
    if (i > 0 && i < N - 1 && Math.abs(valeurEn(c, c.courbure, s0 + i * pas)) > 1 / R.IA_RAYON_SERRE) kv = Math.max(kv, Math.abs(courbureTroisPoints(x[i - 1], z[i - 1], x[i], z[i], x[i + 1], z[i + 1])));
    vb[i] = Math.min(pointe, rythme * Math.min(vitesseVirage(kv, mu) * R.IA_MARGE_VIRAGE * lim, vitesseBraquage(kv)));
    if (type === 'stands') { vb[i] = Math.min(vb[i], t.plafond[i]); continue; }   // (la limite de la voie et l'arrêt ; ni bord ni herbe)
    if (Math.abs(e[i]) > bord) { penalite += R.IA_PENALITE_BORD * (Math.abs(e[i]) - bord) * pas; danger = true; }
    // pendant un dépassement (il attaque, ou une voiture est à côté de lui), passer dans l'herbe coûte très cher
    if (pilote.depassement && Math.abs(e[i]) > dehors) { penalite += R.IA_PENALITE_HERBE; danger = true; }
  }
  // au bout de la ligne, la carte dit à quelle vitesse il faut arriver (les virages d'après)
  // (la carte suppose des pneus neufs : avec moins d'adhérence, la vitesse des virages d'après baisse comme √adhérence ; √1 = 1 au bit près)
  const fin = valeurEn(c, pilote.carte.trajectoire.vitesse, s0 + (N - 1) * pas) * Math.sqrt(v.adherence || 1) * Math.sqrt(v.aileronAdherence || 1) * Math.sqrt(v.adhMeteo || 1);   // (météo : √1 = 1 au sec)   // (aileron, Codeur 3 : √1 = 1)
  vb[N - 1] = Math.min(vb[N - 1], fin < pointe * 0.999 ? Math.min(pointe, rythme * fin * lim) : fin);
  // son freinage : la marge habituelle, son style et son rythme (un pilote plus rapide freine plus près de la limite) ;
  // en attaque, il ose le freinage complet. Son rythme moyen, pas celui du tour : un freinage qui change d'un tour à
  // l'autre surprend celui qui le suit (tour 16 : 9 chocs au lieu de 6 sur les 30 courses)
  const frein = R.IA_MARGE_FREIN * pilote.rythme * (pilote.attaque && (pilote.attaque.etat !== 'preparer' || pilote.attaque.proche) ? R.IA_ATTAQUE_FREIN : pilote.style.frein) * (v.adhMeteo || 1);   // (sur le mouillé, il freine plus tôt : × l'adhérence de la météo, 1 au sec)
  for (let i = N - 2; i >= 0; i--) {
    const ds = Math.hypot(x[i + 1] - x[i], z[i + 1] - z[i]);
    vb[i] = Math.min(vb[i], Math.sqrt(vb[i + 1] * vb[i + 1] + 2 * frein * freinagePossible(vb[i + 1]) * ds));
  }
  const u = Math.max(0, v.u);
  if (u > vb[0]) penalite += R.IA_PENALITE_FREIN * (pilote.penaliteFrein === undefined ? 1 : pilote.penaliteFrein) * (u - vb[0]);   // (le niveau : pilote.penaliteFrein)
  // le temps, en partant de sa vitesse : il accélère au plus comme le moteur, freine au plus comme les freins
  let temps = 0, vitesse = u;
  const touchees = new Set();
  for (let i = 0; i < N - 1; i++) {
    const ds = Math.hypot(x[i + 1] - x[i], z[i + 1] - z[i]);
    const monte = Math.sqrt(vitesse * vitesse + 2 * Math.max(0, accelerationPossible(vitesse)) * ds);
    const descend = Math.sqrt(Math.max(0, vitesse * vitesse - 2 * freinagePossible(vitesse) * ds));
    const suivante = Math.max(descend, Math.min(monte, vb[i + 1]));
    // les voitures qu'il voit : où seront-elles quand il passera ici ? Elles gardent leur vitesse et leur place
    // prévue (dPrevu). Une ligne qui en touche une est très chère. (Rester derrière une voiture plus lente, c'est la
    // vitesse de piloterIA qui s'en charge ; la passer, c'est l'attaque, une décision à part.)
    // (une voiture lente ou arrêtée : sur toute la ligne, pas seulement IA_PREDICTION s : elle sera encore là)
    for (const w of voisines) {
      if (!w.lente && temps >= R.IA_PREDICTION) continue;
      const sPrevu = w.s + w.vitesse * temps;
      if (Math.abs(e[i + 1] - dPrevu(pilote.carte, w, sPrevu, s0)) >= (w.lente ? R.IA_LENTE_CONTACT : ecartSur(v.u))) continue;   // (une voiture lente : plus large, hors du réflexe)
      const ecart = ecartLeLong(c, sPrevu - (s0 + (i + 1) * pas));
      if (!touchees.has(w) && Math.abs(ecart) < R.LONGUEUR_VOITURE + R.IA_MARGE_LONG) {
        penalite += w.lente ? R.IA_PENALITE_LENTE : R.IA_PENALITE_VOITURE;   // (une voiture arrêtée : on ne passe pas à travers)
        danger = true;
        touchees.add(w);
      }
    }
    temps += 2 * ds / Math.max(0.5, vitesse + suivante);
    vitesse = suivante;
  }
  // au bout de la ligne, ce qu'il lui manque de vitesse se paiera plus loin
  penalite += R.IA_PENALITE_SORTIE * Math.max(0, vb[N - 1] - vitesse);
  // une ligne choisie se garde : une autre doit lui faire gagner plus de IA_GAIN_CHANGEMENT, sauf si la sienne
  // l'envoie sur une voiture, au bord ou dans l'herbe
  if (type === pilote.choix && !danger) penalite -= R.IA_GAIN_CHANGEMENT;
  return temps + penalite;
}

// la décision : les lignes possibles depuis là où il est, la meilleure devient sa ligne
function deciderLigne(pilote, v, vues) {
  const R = REGLAGES, carte = pilote.carte, c = carte.circuit, L = c.longueur, pas = R.IA_LIGNE_PAS, t = pilote.tampons, N = t.e.length;
  const s0 = v.piste.s;
  // la nouvelle ligne part de sa ligne d'avant, là où il en est (pas de saut) ; s'il en est loin (poussé, sorti,
  // ou au départ), elle part de la voiture : sa place sur la piste et la direction où elle pointe (de/ds)
  let e0, pente0;
  // (r signé : poussé en arrière de quelques centimètres, il est « avant » le début de sa ligne, pas au bout d'un tour)
  const ancienne = pilote.ligne, r = ancienne ? ecartLeLong(c, s0 - ancienne.s0) : Infinity;
  if (r >= 0 && r < R.IA_HORIZON / 2 && Math.abs(valeurLigne(ancienne.e, r) - v.piste.d) < R.IA_ECART_REPLANIF) {
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
  const limite = c.largeur / 2 - (pilote.bordMin === undefined ? R.IA_MARGE_BORD_MIN : pilote.bordMin);   // (le niveau : pilote.bordMin, comme noterLigne)
  const transition = Math.max(R.IA_TRANSITION_MIN, Math.min(R.IA_HORIZON / 2, Math.max(0, v.u) * R.IA_TRANSITION_TEMPS));
  const iT = Math.max(2, Math.min(N - 2, Math.round(transition / pas)));
  const sens = sensProchainVirage(carte, s0);
  // en attaque (décalé ou en train de plonger) : une seule ligne, à côté de la voiture attaquée, jusqu'après le
  // sommet du virage ; sinon, ses lignes habituelles
  const a = pilote.attaque, enAttaque = a && a.etat !== 'preparer';
  // (en route vers les stands, étape 7 : une seule ligne, celle de la voie : cibleStands)
  const stand = pilote.stand || null;
  const essais = stand ? [['stands', 0]] : enAttaque ? [['attaque', a.cote]] : [['rapide', 0], ['continuer', 0]];
  // une consigne d'équipe (simulation.js, majConsignes) : dans une ligne droite, il s'écarte de la ligne, du côté opposé à son
  // coéquipier (ou du côté où il est déjà), à CONSIGNE_BORD m du bord : une seule ligne, « s'écarter » (bornée et prioritaire comme les autres)
  const laisserCote = !stand && !enAttaque && pilote.laisser ? coteLaisser(pilote, v, vues, s0) : 0;
  if (laisserCote) essais.splice(0, essais.length, ['ecarter', laisserCote]);
  if (pilote.rivalite && !stand && !enAttaque) defendreContreJoueur(pilote, v, vues, s0);
  if (pilote.disposition && pilote.disposition.type === 'bloquer' && !stand && !enAttaque) defendreDisposition(pilote, v, vues, s0);   // (la disposition « bloquer X »)
  if (stand) stand.ceder = cederSortieStands(pilote, v, vues, s0);   // à la sortie des stands, il laisse passer ceux qui arrivent   // le rival du joueur couvre l'intérieur (interview)
  pilote.depassement = !!enAttaque;
  // les voitures lentes ou arrêtées qu'il voit (estLente), et les plus proches devant lui (IA_LENTE_NB) : il les contourne
  const lentes = [];
  // (seulement devant lui : derrière, une voiture lente qui remonte compte comme une autre, c'est à elle de faire attention)
  for (const w of vues) { const g = ecartLeLong(c, w.s - s0); w.lente = g > 0 && estLente(pilote, v, w); if (w.lente && g <= R.IA_HORIZON) lentes.push({ w, g }); }
  lentes.sort((a, b) => a.g - b.g); lentes.length = Math.min(lentes.length, R.IA_LENTE_NB);
  // les lignes de rechange (intérieur, extérieur, garder sa place), seulement sans voiture tout près de lui : à côté
  // d'une autre, il ne fait pas d'écart imprévu, il garde sa ligne (et la priorité règle le reste)
  // (une voiture lente devant lui ne l'entoure pas : c'est justement elle qu'il contourne)
  const entoure = vues.some(w => { const g = ecartLeLong(c, w.s - s0); return !(w.lente && g > 0) && Math.abs(g) < R.LONGUEUR_VOITURE + R.IA_MARGE_LONG && Math.abs(w.d - e0) < R.IA_REFLEXE_COTE; });
  if (entoure && !enAttaque) essais.length = 1;
  // (seul, sans aucune voiture en vue, il n'en a pas besoin : sur 200 m, elles semblent parfois meilleures et lui
  // coûtent jusqu'à 0,8 s au tour)
  // (IA_RECHANGE_DISTANCE, duel-court : seulement si une voiture est à moins de ça de lui le long de la piste ; une voiture vue à 100 m ne
  // demande pas de ligne de rechange, et ces lignes lui coûtaient du temps à suivre de loin ; 0 : dès qu'il en voit une, comme avant)
  const rechange = R.IA_RECHANGE_DISTANCE ? vues.some(w => Math.abs(ecartLeLong(c, w.s - s0)) < R.IA_RECHANGE_DISTANCE) : vues.length;
  if (!stand && !laisserCote && !enAttaque && !entoure && sens && rechange) essais.push(['interieur', sens], ['exterieur', -sens]);
  // une voiture lente devant : les deux lignes qui la contournent, d'un côté ou de l'autre, à IA_LENTE_ECART d'elle
  if (!stand && !laisserCote && !enAttaque) for (const l of lentes) essais.push(['eviter', 1, l], ['eviter', -1, l]);
  const finAttaque = enAttaque ? ((carte.virages[a.virage].s + R.IA_ATTAQUE_APRES_SOMMET - s0) % L + L) % L : 0;
  // la priorité, avec les voitures à côté de lui ou dans ses rétroviseurs à moins d'une longueur, jusqu'à la sortie
  // du prochain virage : il ne se décale pas vers elles (au mieux jusqu'à l'écart sûr) ; et si l'une est à hauteur
  // (au moins un tiers de longueur), il lui laisse une largeur de voiture, quitte à s'écarter
  const places = [], prochain = carte.virages.reduce((m, x) => Math.min(m, ((x.s - s0) % L + L) % L), Infinity);
  const sur = ecartSur(v.u);
  for (const w of vues) {
    const g = ecartLeLong(c, w.s - s0);
    if (g < -R.LONGUEUR_VOITURE || g > R.LONGUEUR_VOITURE * (1 - R.IA_HAUTEUR_LAISSER)) continue;
    // (la disposition « laisser » : il laisse la place au joueur dès un plus petit chevauchement, IA_HAUTEUR_LAISSER × (1 − DISPOSITION_LAISSER))
    const hauteur = pilote.disposition && pilote.disposition.type === 'laisser' && w.id === pilote.disposition.id ? R.IA_HAUTEUR_LAISSER * (1 - Math.min(R.DISPOSITION_LAISSER, R.DISPOSITION_PLAFOND)) : R.IA_HAUTEUR_LAISSER;
    const cote = Math.sign(w.d - e0) || 1, aHauteur = g >= -R.LONGUEUR_VOITURE * (1 - hauteur);
    // (le rival du joueur, à côté de lui : moins de place, IA_ESPACE_LAISSE × (1 − décalage) ; jamais moins que l'écart sûr)
    const espace = pilote.rivalite && w.id && w.id.joueur ? R.IA_ESPACE_LAISSE * (1 - decalageRivalite()) : R.IA_ESPACE_LAISSE;
    const laisse = w.d - cote * Math.max(aHauteur ? R.LARGEUR_VOITURE + espace : sur, ecartCoteACote(carte, s0));
    // la borne : sa place actuelle s'il est déjà plus près que ça (il ne s'approche pas), sinon l'écart voulu
    const borne = aHauteur ? laisse : (cote > 0 ? Math.max(e0, laisse) : Math.min(e0, laisse));
    places.push({ cote, borne, jusque: prochain + R.IA_VIRAGE_LARGEUR });
    // coincé : sa ligne rapide empiète de plus de IA_CEDER_ECART sur la place à laisser, avant la sortie du virage ;
    // deux voitures ne passent pas de front : il cède (piloterIA le fait ralentir derrière elle)
    if (aHauteur && !w.lente) for (let i = 0; i <= N && i * pas <= prochain + R.IA_VIRAGE_LARGEUR; i++) {
      if ((borne - t.rapide[i]) * cote < -R.IA_CEDER_ECART) { pilote.cede = { id: w.id, duree: 0 }; break; }
    }
    pilote.depassement = true;
  }
  // les voitures qui comptent pour noter ses lignes : devant lui, à côté, ou juste derrière (dans ses rétroviseurs :
  // il ne se rabat pas sur elles) ; celle qui arrive de plus loin derrière doit faire attention, pas lui
  // Une voiture déjà devant lui, dans sa file, ne compte pas : derrière elle, c'est sa vitesse qui le garde à distance
  // (piloterIA) ; la note ne doit pas le pousser sur une autre ligne pour l'éviter
  // (une voiture lente compte toujours : sa ligne doit la contourner)
  const voisines = vues.filter(w => { const g = ecartLeLong(c, w.s - s0); return g > -R.IA_VISION_COTE[0] && !(!w.lente && g > R.LONGUEUR_VOITURE && Math.abs(w.d - e0) < ecartSur(v.u)); });
  let meilleure = Infinity, choix = null;
  for (const [type, cote, l] of essais) {
    const cible = t.cible, lente = l ? l.w : null, gLente = l ? l.g : 0;
    let penteLigne = pente0;
    for (let i = 0; i <= N; i++) {
      const s = i * pas, r = t.rapide[i];
      let val = r;
      if (type === 'continuer') { const m = Math.max(0, Math.min(1, (s - R.IA_CONTINUER[0]) / (R.IA_CONTINUER[1] - R.IA_CONTINUER[0]))); val = e0 * (1 - m) + r * m; }
      else if (type === 'interieur' || type === 'exterieur') val = r + cote * R.IA_DECALAGE_CANDIDAT;
      else if (type === 'ecarter') { const m = Math.min(1, s / R.CONSIGNE_RAMPE); val = r * (1 - m) + cote * (c.largeur / 2 - R.CONSIGNE_BORD) * m; }
      else if (type === 'eviter') {
        // à IA_LENTE_ECART de la voiture lente, côté cote : il s'y porte sur IA_LENTE_AVANT m (plus, vite : ce qu'il fait en
        // IA_LENTE_TEMPS), reste à côté jusqu'à IA_LENTE_APRES m derrière elle, puis revient sur sa ligne (IA_DEPASSEMENT_RAMPE)
        // (tout près d'elle, à l'arrêt derrière : la ligne part de là où il est et s'écarte tout de suite, sans la transition
        // habituelle, sinon elle passe encore sur elle et il ne repart jamais)
        // L'écart est atteint une longueur de voiture et IA_MARGE_LONG avant elle (là où une ligne commence à la « toucher ») ;
        // tout près d'elle, la rampe va de sa place à elle (jamais une marche au départ : la transition repasserait sur elle)
        const marge = R.LONGUEUR_VOITURE + R.IA_MARGE_LONG, avant = Math.max(R.IA_LENTE_AVANT, Math.max(0, v.u) * R.IA_LENTE_TEMPS);
        const finRampe = Math.max(gLente - marge, Math.min(gLente, marge));
        const debut = Math.max(0, finRampe - avant), fin = gLente + R.IA_LENTE_APRES, base = debut > 0 ? r : e0;
        const m = s < debut ? 0 : s < finRampe ? (s - debut) / (finRampe - debut) : s < fin ? 1 : Math.max(0, 1 - (s - fin) / R.IA_DEPASSEMENT_RAMPE);
        val = base * (1 - m) + (lente.d + cote * R.IA_LENTE_ECART) * m;
        // (la ligne part de sa place : elle prend tout de suite la pente de la rampe, pas celle de sa voiture ; à l'arrêt, il
        // braque sur place, sinon la transition ramenait la ligne sur la voiture)
        if (debut === 0 && i === 1) penteLigne = (val - e0) / pas;
      }
      else if (type === 'attaque') {
        // à côté de la voiture attaquée, côté a.cote, jusqu'après le sommet du virage, puis retour à sa ligne
        const m = s <= finAttaque ? 1 : Math.max(0, 1 - (s - finAttaque) / R.IA_DEPASSEMENT_RAMPE);
        // elle est tout près : elle garde sa place (et la laisse dès qu'il sera à hauteur)
        // (IA_ATTAQUE_LIGNE_PREVUE, duel-court : à côté de là où elle SERA, sa place prévue le long du virage, dPrevu ; 0 : à côté de sa
        // place d'aujourd'hui, la même tout le virage : une ligne droite à travers l'épingle, qui le faisait freiner jusqu'à 25 m/s)
        const versStands = a.vue.id && (a.vue.id.manoeuvreStands || a.vue.id.rampeStands);   // (elle va aux stands : elle quitte la ligne de la carte, ça se voit)
        const dVue = R.IA_ATTAQUE_LIGNE_PREVUE && !versStands ? dPrevu(carte, a.vue, s0 + s, s0) : a.vue.d;
        val = r * (1 - m) + (dVue + a.cote * sur) * m;
        // pas la place de rester à l'écart sûr d'elle (le bord) : il renonce à cette attaque
        if (m === 1 && Math.abs(val) > limite) a.impossible = true;
      }
      if (type === 'stands') { cible[i] = cibleStands(pilote, s0 + s, r, t.plafond, i); continue; }   // (la voie est hors de la piste : ni borne ni priorité)
      for (const q of places) if (s <= q.jusque) val = q.cote > 0 ? Math.min(val, q.borne) : Math.max(val, q.borne);
      cible[i] = Math.max(-limite, Math.min(limite, val));
    }
    // la transition : de là où il est (écart e0, pente0) jusqu'à la cible, sans saut. L'écart à la cible
    // s'éteint doucement (Hermite) : la forme de la cible est gardée, même dans un enchaînement de virages
    const ecart0 = e0 - cible[0], pente = penteLigne - (cible[1] - cible[0]) / pas, longueur = iT * pas;
    for (let i = 0; i < N; i++) {
      if (i >= iT) { t.e[i] = cible[i]; continue; }
      const a = i / iT, a2 = a * a, a3 = a2 * a;
      t.e[i] = cible[i] + (2 * a3 - 3 * a2 + 1) * ecart0 + (a3 - 2 * a2 + a) * longueur * pente;
    }
    // (le nom d'une ligne « éviter » dit son côté : la prime d'une ligne gardée ne passe pas d'un côté à l'autre)
    const nom = type === 'eviter' ? (cote > 0 ? 'eviter+' : 'eviter-') + (l === lentes[0] ? '' : '2') : type;
    const note = noterLigne(pilote, v, voisines, s0, t, nom);
    if (note < meilleure) { meilleure = note; choix = nom; t.meilleurE.set(t.e); t.meilleurV.set(t.vb); }
  }
  if (!pilote.ligne) pilote.ligne = { s0: 0, e: new Float64Array(N), v: new Float64Array(N) };
  pilote.ligne.s0 = s0;
  pilote.ligne.e.set(t.meilleurE);
  pilote.ligne.v.set(t.meilleurV);
  pilote.choix = choix;
  pilote.decisions++;
}

// la ligne vers les stands (étape 7) au point s de la piste (r : sa ligne rapide là) : avant l'entrée, il se range à STAND_BORD m
// du bord, côté voie (entre STAND_RANGER[0] et [1] m avant) ; dans la rampe d'entrée, il passe au milieu de la voie, au-delà du
// muret ; dans la rampe de sortie, il revient au bord de la piste, puis il rejoint sa ligne avant la fin de STAND_REJOINDRE.
// plafond[i] : la vitesse permise là : freiner jusqu'à STAND_VITESSE_VISEE avant l'entrée (STAND_DECEL), la garder dans la voie,
// et, tant que l'arrêt n'est pas fait, ralentir jusqu'à STAND_VITESSE_APPROCHE à la place d'arrêt (STAND_DECEL_ARRET)
function cibleStands(pilote, s, r, plafond, i) {
  const R = REGLAGES, c = pilote.carte.circuit, st = c.stands, depuis = ecartLeLong(c, s - st.entree);
  const bord = st.cote * (c.largeur / 2 - R.STAND_BORD), voie = st.cote * (st.dMur + R.STAND_LARGEUR / 2);
  const lisse = (x, a, b) => { const m = Math.max(0, Math.min(1, (x - a) / (b - a))); return m * m * (3 - 2 * m); };
  let e;
  // (il ne se range que dans la ligne droite avant l'entrée : jamais dans le virage d'avant, quand l'entrée suit de près la ligne)
  const droite = droiteAvantStands(c);
  if (depuis < 0) e = r + (bord - r) * lisse(depuis, -Math.min(R.STAND_RANGER[0], droite), -Math.min(R.STAND_RANGER[1], droite / 4));
  else if (depuis <= st.longueur) e = bord + (voie - bord) * lisse(depuis, 0, R.STAND_RAMPE - 10) * (pilote.stand.ceder ? 1 : 1 - lisse(depuis, st.longueur - R.STAND_RAMPE + 5, st.longueur));
  else e = bord + (r - bord) * lisse(depuis, st.longueur + R.STAND_REJOINDRE / 4, st.longueur + R.STAND_REJOINDRE);
  if (i < plafond.length) {
    const vs = R.STAND_VITESSE_VISEE;
    let vmax = depuis < 0 ? Math.sqrt(vs * vs - 2 * R.STAND_DECEL * depuis) : depuis <= st.longueur ? vs : Infinity;
    if (!pilote.stand.arrete && depuis <= st.longueur) {
      const devant = ecartLeLong(c, st.arret - s), va = R.STAND_VITESSE_APPROCHE;   // > 0 : sa place d'arrêt est devant
      if (devant > -R.STAND_ARRET_DEMI) vmax = Math.min(vmax, Math.sqrt(va * va + 2 * R.STAND_DECEL_ARRET * Math.max(0, devant)));
    }
    plafond[i] = vmax;
  }
  return e;
}

// hors de tout virage de la carte : ni entre son point de freinage et son sommet, ni dans sa sortie (IA_VIRAGE_LARGEUR après le sommet)
function horsVirage(carte, s) {
  const c = carte.circuit;
  for (const x of carte.virages) {
    if (ecartLeLong(c, s - x.freinage) >= -REGLAGES.IA_VIRAGE_LARGEUR && ecartLeLong(c, s - x.s) <= REGLAGES.IA_VIRAGE_LARGEUR) return false;
  }
  return true;
}

// une consigne d'équipe : de quel côté s'écarter (1 à droite, -1 à gauche), ou 0 si la piste n'est pas droite sur CONSIGNE_DROITE m devant lui
// (il ne s'écarte que dans une ligne droite) ; le côté opposé à son coéquipier s'il le voit, sinon celui où il est déjà
function coteLaisser(pilote, v, vues, s0) {
  const R = REGLAGES, c = pilote.carte.circuit;
  for (let x = 0; x <= R.CONSIGNE_DROITE; x += 10) if (Math.abs(valeurEn(c, c.courbure, s0 + x)) >= R.IA_DROITE_COURBURE) return 0;
  const w = vues.find(x => x.id === pilote.laisser.id);
  const d = v.piste.d, ref = w ? w.d : 0;
  return d - ref >= 0 ? 1 : -1;
}

// la longueur de ligne droite juste avant l'entrée de la voie des stands (m), calculée une fois par circuit (gardée dans circuit.stands)
function droiteAvantStands(c) {
  const st = c.stands;
  if (st.droiteAvant === undefined) {
    let i = Math.round(st.entree / c.pas) % c.nb, l = 0;
    while (l < c.longueur && Math.abs(c.courbure[(i - 1 + c.nb) % c.nb]) < REGLAGES.IA_DROITE_COURBURE) { i = (i - 1 + c.nb) % c.nb; l += c.pas; }
    st.droiteAvant = l;
  }
  return st.droiteAvant;
}

// à la sortie des stands (son arrêt fait, dans la rampe de sortie ou juste avant) : une voiture de la piste arrive derrière lui, plus
// vite, du côté de la voie (à moins de STAND_CEDER_COTE m du bord où il rejoindrait) : il reste dans la voie et attend qu'elle passe
// (comme la ligne blanche de la sortie des stands)
function cederSortieStands(pilote, v, vues, s0) {
  const R = REGLAGES, c = pilote.carte.circuit, st = c.stands, depuis = ecartLeLong(c, s0 - st.entree);
  if (!pilote.stand.arrete || depuis < st.longueur - R.STAND_RAMPE - R.STAND_CEDER_AVANT || depuis > st.longueur) return false;
  const bord = st.cote * (c.largeur / 2 - R.STAND_BORD);
  return vues.some(w => { const g = ecartLeLong(c, w.s - s0); return g > -R.STAND_CEDER_DISTANCE && g < R.LONGUEUR_VOITURE && w.vitesse > v.u + R.STAND_CEDER_VITESSE && Math.abs(w.d - bord) < R.STAND_CEDER_COTE && w.id && w.id.campStands !== 2; });
}

// le prochain point de freinage devant s : { j (le virage), distance } ou null
function prochainFreinage(carte, s) {
  const L = carte.circuit.longueur;
  let mieux = null;
  carte.virages.forEach((x, j) => { const d = ((x.freinage - s) % L + L) % L; if (!mieux || d < mieux.distance) mieux = { j, distance: d }; });
  return mieux;
}

// son agressivité (0 à 1 ; 0,5 sans caractère) ; contre (facultatif) : la voiture visée. Contre le joueur (v.joueur), un rival de
// l'interview (pilote.rivalite) est plus agressif de decalageRivalite() ; contre les autres, rien ne change
function agressivite(pilote, contre) {
  const base = pilote.caractere ? pilote.caractere.agressivite : 0.5;
  return pilote.rivalite && contre && contre.joueur ? Math.min(1, base + decalageRivalite()) : base;
}

// le décalage de ses réglages quand il est le rival du joueur (l'interview d'après course) : INTERVIEW_RIVALITE_DECALAGE, plafonné
function decalageRivalite() {
  return Math.max(0, Math.min(REGLAGES.INTERVIEW_RIVALITE_DECALAGE, REGLAGES.INTERVIEW_RIVALITE_PLAFOND));
}

// ses attaques et ses réussites contre chaque voiture (pilote.parCible : voiture → { attaques, reussies }), pour les mesures
function compterCible(pilote, id, champ) {
  if (!id) return;
  const x = pilote.parCible.get(id) || { attaques: 0, reussies: 0 };
  x[champ]++;
  pilote.parCible.set(id, x);
}

// la défense du rival (l'interview) contre le joueur : le joueur est dans ses rétroviseurs (à moins de INTERVIEW_RIVALITE_DISTANCE m
// derrière, ou à côté sans être encore devant) avant le freinage d'un virage : sa ligne rapide se décale vers l'intérieur de ce virage
// (INTERVIEW_RIVALITE_DEFENSE × le décalage), jusqu'au sommet, puis revient. Rien sans rivalité, ni sans le joueur derrière lui.
function defendreContreJoueur(pilote, v, vues, s0) {
  const R = REGLAGES, carte = pilote.carte, c = carte.circuit, L = c.longueur, pas = R.IA_LIGNE_PAS, t = pilote.tampons;
  const joueur = vues.find(w => w.id && w.id.joueur);
  if (!joueur) return;
  // (derrière lui ou en train de se décaler à côté, pas encore devant)
  const g = ecartLeLong(c, joueur.s - s0);
  if (g > R.LONGUEUR_VOITURE / 2 || g < -R.INTERVIEW_RIVALITE_DISTANCE) return;
  const f = prochainFreinage(carte, s0);
  if (!f || f.distance > R.IA_HORIZON) return;
  const vir = carte.virages[f.j];
  const decalage = R.INTERVIEW_RIVALITE_DEFENSE * decalageRivalite(), sommet = ((vir.s - s0) % L + L) % L;
  for (let i = 0; i < t.rapide.length; i++) {
    const s = i * pas, m = s <= sommet ? Math.min(1, s / R.INTERVIEW_RIVALITE_RAMPE) : Math.max(0, 1 - (s - sommet) / R.IA_DEPASSEMENT_RAMPE);
    t.rapide[i] += vir.sens * decalage * m;
  }
  if (pilote.defenseVirage !== f.j) { pilote.defenseVirage = f.j; pilote.defenses++; }
}

// la disposition « bloquer X » (discussion.js) : comme le rival du joueur (defendreContreJoueur), il couvre l'intérieur du prochain virage
// quand X le suit de près, de DISPOSITION_DEFENSE m (jamais plus que DISPOSITION_PLAFOND × INTERVIEW_RIVALITE_DEFENSE) ; sa ligne seulement
function defendreDisposition(pilote, v, vues, s0) {
  const R = REGLAGES, carte = pilote.carte, c = carte.circuit, L = c.longueur, pas = R.IA_LIGNE_PAS, t = pilote.tampons;
  const x = vues.find(w => w.id === pilote.disposition.id);
  if (!x) return;
  const g = ecartLeLong(c, x.s - s0);
  if (g > R.LONGUEUR_VOITURE / 2 || g < -R.INTERVIEW_RIVALITE_DISTANCE) return;
  const f = prochainFreinage(carte, s0);
  if (!f || f.distance > R.IA_HORIZON) return;
  const vir = carte.virages[f.j], decalage = Math.min(R.DISPOSITION_DEFENSE, R.DISPOSITION_PLAFOND * R.INTERVIEW_RIVALITE_DEFENSE), sommet = ((vir.s - s0) % L + L) % L;
  for (let i = 0; i < t.rapide.length; i++) {
    const s = i * pas, m = s <= sommet ? Math.min(1, s / R.INTERVIEW_RIVALITE_RAMPE) : Math.max(0, 1 - (s - sommet) / R.IA_DEPASSEMENT_RAMPE);
    t.rapide[i] += vir.sens * decalage * m;
  }
  if (pilote.defenseVirage !== f.j) { pilote.defenseVirage = f.j; pilote.defenses++; }
}

function finirAttaque(pilote, reussie, pourquoi) {
  if (pilote.journal) pilote.journal.push(pourquoi);
  if (reussie && pilote.attaque) compterCible(pilote, pilote.attaque.id, 'reussies');
  if (reussie) pilote.reussies++;
  else pilote.repos = REGLAGES.IA_ATTAQUE_REPOS;
  pilote.attaque = null;
  pilote.retenue = 0;
}

// l'attaque, en étapes : retenu depuis IA_ATTENTE_ATTAQUE s par une voiture, il se prépare dans son sillage ;
// avant le point de freinage du virage suivant, il se décale à côté d'elle, côté intérieur (s'il y a la place) ;
// il freine plus tard ; à l'entrée du virage, s'il n'est pas au moins à moitié à hauteur, il abandonne et revient derrière
function majAttaque(pilote, v, vues, dt) {
  const R = REGLAGES, carte = pilote.carte, c = carte.circuit, p = v.piste, a = pilote.attaque;
  pilote.repos = Math.max(0, pilote.repos - dt);
  if (pilote.stand) return;   // en route vers les stands (étape 7) : il n'attaque pas
  if (pilote.passer) { if (pilote.attaque) finirAttaque(pilote, false, 'consigne'); return; }   // une consigne d'équipe : on le laisse passer, il n'attaque pas
  if (!a) {
    // plus agressif : il attaque plus tôt (après moins de temps retenu)
    if (R.IA_DEPASSEMENT && pilote.repos <= 0 && pilote.retenue >= R.IA_ATTENTE_ATTAQUE * (1.5 - agressivite(pilote, pilote.retenuePar)) && pilote.retenuePar !== null) {
      pilote.attaque = { id: pilote.retenuePar, etat: 'preparer', virage: null, cote: 0, vue: null, duree: 0, impossible: false };
      pilote.attaques++;
      compterCible(pilote, pilote.retenuePar, 'attaques');
    }
    return;
  }
  const w = vues.find(x => x.id === a.id);
  a.duree += dt;
  if (!w || a.duree > (a.etat === 'preparer' ? R.IA_PREPARER_DUREE_MAX : R.IA_ATTAQUE_DUREE_MAX)) return finirAttaque(pilote, false, (w ? 'trop long ' : 'perdue de vue ') + a.etat);
  a.vue = w;
  if (a.impossible) return finirAttaque(pilote, false, 'pas la place');
  const g = ecartLeLong(c, w.s - p.s);
  if (g < -(R.LONGUEUR_VOITURE + R.IA_MARGE_LONG)) return finirAttaque(pilote, true, 'passé');   // il est passé
  const limite = c.largeur / 2 - R.IA_MARGE_BORD_MIN, ecart = ecartSur(v.u);
  if (a.etat === 'preparer') {
    if (g > R.IA_ATTAQUE_ECART_TEMPS * Math.max(v.u, R.IA_VISEE_MIN)) return finirAttaque(pilote, false, 'échappée g ' + g.toFixed(1) + ' u ' + v.u.toFixed(0));   // elle s'est échappée
    const f = prochainFreinage(carte, p.s);
    a.proche = !!R.IA_PREPARER_FREINE_TARD && g < R.IA_DECALAGE_ECART && pilote.parcouru > R.IA_PREPARER_APRES;   // (duel-2 : tout près d'elle, il ose déjà le freinage de l'attaque, noterLigne)
    // tout près, ou en train de fondre sur elle au freinage (il voudrait aller nettement plus vite qu'elle)
    const ligne = pilote.ligne, r = ligne ? ((p.s - ligne.s0) % c.longueur + c.longueur) % c.longueur : 0;
    const fond = ligne && valeurLigne(ligne.v, r) - w.vitesse > R.IA_RAPPROCHEMENT;
    if (f && (g < R.IA_DECALAGE_ECART || fond) && f.distance < Math.max(R.IA_DECALAGE_DISTANCE, Math.max(0, v.u) * R.IA_DECALAGE_TEMPS)) {
      a.duree = 0;   // la durée maximale compte à partir du décalage
      // côté intérieur du virage, s'il y a la place ; sinon l'extérieur ; sinon il attend le virage suivant
      // seulement dans une zone de freinage après une vraie ligne droite, jamais dans un enchaînement
      // (plus agressif : une droite un peu plus courte lui suffit)
      if (carte.virages[f.j].droite < R.IA_DROITE_ATTAQUE * (1 - R.IA_AGRESSIVITE_DROITE * agressivite(pilote, a.id))) return;
      const sens = carte.virages[f.j].sens;
      const cote = Math.abs(w.d + sens * ecart) <= limite ? sens : Math.abs(w.d - sens * ecart) <= limite ? -sens : 0;
      if (cote) { a.etat = 'decaler'; a.virage = f.j; a.cote = cote; }
    }
  } else if (a.etat === 'decaler' && carte.virages[a.virage].lent && !R.IA_LENT_COTE_A_COTE) {   // (IA_LENT_COTE_A_COTE : comme un virage rapide, l'entrée côte à côte)
    // virage lent : jamais à deux de front ; au point de freinage (celui de la carte), il a le nez devant (son centre
    // au moins IA_NEZ_DEVANT longueur devant le sien), sinon il abandonne avant de freiner : elle garde le virage
    if (ecartLeLong(c, carte.virages[a.virage].freinage - p.s) <= 0) {
      if (g <= -R.LONGUEUR_VOITURE * R.IA_NEZ_DEVANT) a.etat = 'plonger';
      else return finirAttaque(pilote, false, 'pas devant au freinage (virage lent) g ' + g.toFixed(1));
    }
  } else if (a.etat === 'decaler') {
    // à l'entrée du virage (IA_ATTAQUE_CONTROLE m avant son sommet) : au moins à moitié à hauteur, il plonge ;
    // sinon il abandonne et revient derrière
    if (ecartLeLong(c, carte.virages[a.virage].s - R.IA_ATTAQUE_CONTROLE - p.s) <= 0) {
      if (g <= R.LONGUEUR_VOITURE * R.IA_ATTAQUE_HAUTEUR) a.etat = 'plonger';
      else return finirAttaque(pilote, false, 'pas à hauteur g ' + g.toFixed(1) + ' u ' + v.u.toFixed(0) + ' / ' + w.vitesse.toFixed(0) + ' d ' + p.d.toFixed(1) + ' / ' + w.d.toFixed(1));
    }
  } else if (ecartLeLong(c, carte.virages[a.virage].s + R.IA_ATTAQUE_APRES_SOMMET - p.s) < 0 && g > 0) {
    return finirAttaque(pilote, false, 'sorti sans passer g ' + g.toFixed(1));   // sorti du virage sans être passé
  }
}

// la voiture vue w n'a pas le même réglage d'aileron que la sienne (aileron.js : v.aileronAdherence, v.aileronTrainee ; 1 = le milieu)
function autreAileron(v, w) {
  // (et des pneus plus ou moins usés, étape 7 : elle n'a pas la même adhérence, elle ne freine pas pareil)
  return !!w && ((w.aileronAdherence || 1) !== (v.aileronAdherence || 1) || (w.aileronTrainee || 1) !== (v.aileronTrainee || 1) || (w.adherence || 1) !== (v.adherence || 1));
}

// la décélération (m/s²) d'une voiture vue devant lui, d'un pas à l'autre (pilote.vitessesVues : voiture → sa vitesse au pas d'avant) ;
// 0 si elle ne ralentit pas ou s'il la voit pour la première fois
function freinsVus(pilote, w, dt) {
  const avant = pilote.vitessesVues.get(w.id);
  pilote.vitessesVues.set(w.id, w.vitesse);
  return avant === undefined || dt <= 0 ? 0 : Math.max(0, (avant - w.vitesse) / dt);
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
  // il cède à une voiture tant qu'elle est à côté de lui ; ensuite, il l'oublie
  if (pilote.cede) {
    const w = vues.find(x => x.id === pilote.cede.id);
    pilote.cede.duree += dt;
    if (!w || Math.abs(ecartLeLong(c, w.s - p.s)) > R.LONGUEUR_VOITURE + R.IA_MARGE_LONG || pilote.cede.duree > R.IA_CEDER_DUREE_MAX) pilote.cede = null;
  }
  // ses tours (pour la variation d'un tour à l'autre) : la ligne passée en avançant, ou en reculant
  if (pilote.sAvant !== null && pilote.sAvant - p.s > L / 2) pilote.tour++;
  if (pilote.sAvant !== null && p.s - pilote.sAvant > L / 2) pilote.tour = Math.max(0, pilote.tour - 1);
  if (pilote.sAvant !== null) pilote.parcouru += Math.max(0, ecartLeLong(c, p.s - pilote.sAvant));
  pilote.sAvant = p.s;
  pilote.attente -= dt;
  majAttaque(pilote, v, vues, dt);
  majErreur(pilote, v, vues, dt);
  // les voitures lentes devant lui, d'un pas à l'autre : depuis combien de temps chacune roule sous IA_LENTE_PART de la carte,
  // et sous IA_ARRET_VITESSE (arrêtée ou presque)
  for (const w of vues) {
    const devant = ecartLeLong(c, w.s - p.s) > 0, lente = devant && sousLaCarte(pilote.carte, w), arret = devant && w.vitesse < R.IA_ARRET_VITESSE;
    if (!lente && !arret) { pilote.lentesVues.delete(w.id); continue; }
    const vue = pilote.lentesVues.get(w.id) || { lente: 0, arret: 0 };
    vue.lente = lente ? vue.lente + dt : 0; vue.arret = arret ? vue.arret + dt : 0;
    pilote.lentesVues.set(w.id, vue);
  }
  for (const id of pilote.lentesVues.keys()) if (!vues.some(w => w.id === id)) pilote.lentesVues.delete(id);
  for (const id of pilote.vitessesVues.keys()) if (!vues.some(w => w.id === id)) pilote.vitessesVues.delete(id);   // (freinsVus : seulement d'un pas à l'autre)
  // (IA_FREIN_VU_TOUS, duel-court : il voit freiner toute voiture devant lui, pas seulement celle qui n'a pas son aileron ; 0 : comme avant)
  for (const w of vues) w.freine = R.IA_FREIN_VU_TOUS || autreAileron(v, w.id) ? freinsVus(pilote, w, dt) : 0;   // (aileron : sa décélération, vue à chaque pas)
  // (r signé : reculé de quelques centimètres, il refait sa ligne au lieu de lire le bout de l'ancienne)
  let r = pilote.ligne ? ecartLeLong(c, p.s - pilote.ligne.s0) : Infinity;
  if (!pilote.ligne || pilote.attente <= 0 || r < 0 || r > R.IA_HORIZON / 2) {
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
  // (sauf celle qu'il attaque, une fois décalé à côté d'elle)
  const libre = valeurLigne(ligne.v, r + u * R.IA_ANTICIPATION), a = pilote.attaque;
  let cible = libre, retenuPar = null;
  for (const w of vues) {
    const g = ecartLeLong(c, w.s - p.s);
    if (g <= 0 || (a && a.etat !== 'preparer' && w.id === a.id)) continue;
    // sur sa ligne, ou tout près de son axe (une voiture qui se rabat devant lui) : il reste derrière
    // (une voiture lente ou arrêtée : ni la file ni le couloir ; il la contourne, et seule une ligne qui passe sur elle le
    // retient. Au pas (sous IA_LENTE_VITESSE_FROLE), il la frôle s'il le faut, à IA_LENTE_SUR : sinon, à l'arrêt derrière elle,
    // sa ligne ne peut plus s'en écarter et il ne repart jamais. Plus vite, une voiture lente devant lui, de côté à moins de
    // l'écart sûr et à moins de IA_LENTE_PROCHE, le retient aussi, quoi que dise sa ligne : il n'est pas encore à côté.)
    const lente = estLente(pilote, v, w), froler = lente && v.u < R.IA_LENTE_VITESSE_FROLE;
    const surSaLigne = Math.abs(valeurLigne(ligne.e, r + g) - w.d) < (froler ? R.IA_LENTE_SUR : ecartSur(v.u));
    const dessus = lente && !froler && g < R.IA_LENTE_PROCHE && Math.abs(w.d - p.d) < ecartSur(v.u);
    // hors attaque, on reste à la file : une voiture devant lui, assez près, il la suit, même s'il sort mieux du virage
    // (la seule façon de la passer, c'est l'attaque)
    const aLaFile = g < R.IA_FILE_DISTANCE && Math.abs(w.d - p.d) < R.IA_FILE_COTE;
    if (lente ? !surSaLigne && !dessus : !surSaLigne && !aLaFile && Math.abs(w.d - p.d) >= R.IA_VISION_COULOIR) continue;
    // en préparant son attaque, il se colle dans le sillage de la voiture attaquée (s'il est bien derrière elle, pas en biais)
    const sillage = a && w.id === a.id && Math.abs(w.d - p.d) < R.ASPIRATION_LARGEUR;
    // au départ (sur la grille, dans sa file), la voiture devant lui est à GRILLE_ESPACEMENT × 2 m : s'il voulait
    // s'en tenir à IA_DISTANCE_SUIVI, il attendrait qu'elle parte, et les rangées partiraient l'une après l'autre (le
    // joueur, derrière, leur rentrait dedans) : tout le monde part en même temps, et pendant le lancement (ses
    // IA_DEPART_LANCEMENT premiers mètres), il la suit à IA_DISTANCE_MIN ; ensuite, la distance habituelle revient
    // (duel-2, IA_PREPARER_LIBRE : en préparant son attaque, il n'est plus retenu à IA_DISTANCE_ATTAQUE derrière la voiture visée, seulement à
    // IA_DISTANCE_MIN ; et tant qu'elle ne freine pas, il freine sur sa propre ligne : tour 33, l'attaquant décrochait, 52 % du temps en virage
    // sans plein gaz, et freinait 22 m derrière elle avant elle)
    const libreAttaque = R.IA_PREPARER_LIBRE && a && a.etat === 'preparer' && w.id === a.id && pilote.parcouru > R.IA_PREPARER_APRES;   // (pas dans le premier virage : tout le monde y est serré)
    const suivi = libreAttaque ? R.IA_DISTANCE_MIN : sillage ? R.IA_DISTANCE_ATTAQUE : pilote.parcouru < R.IA_DEPART_LANCEMENT ? R.IA_DISTANCE_MIN : R.IA_DISTANCE_SUIVI;
    // (aileron, Codeur 1 : derrière une voiture qui n'a pas le même aileron que lui — ça se voit —, elle ne freine pas aux mêmes
    // endroits ni pareil : quand elle freine (sa vitesse qui baisse, ses feux), il prévoit qu'elle ralentira encore pendant IA_FREIN_PREVU s ;
    // sinon il freinait trop tard. Même aileron (et sans aileron) : rien ne change, au bit près)
    const ralentit = w.freine || 0;
    // (elle ne freine pas : sur sa propre ligne, il n'est retenu que s'il arrive à IA_DISTANCE_MIN d'elle)
    // (qu'elle freine, il le voit : sa vitesse baisse d'un pas à l'autre ; a.vueAvant, sa vitesse au pas d'avant)
    const freineVue = libreAttaque && a.vueAvant !== undefined && w.vitesse < a.vueAvant - R.IA_FREIN_VU * dt;
    const decelVue = freineVue ? (a.vueAvant - w.vitesse) / dt : 0;
    if (libreAttaque) a.vueAvant = w.vitesse;
    if (libreAttaque && !freineVue && !(ralentit > 0) && g > R.IA_DISTANCE_MIN + R.LONGUEUR_VOITURE) continue;
    // (elle freine : il reprend la distance de l'attaque et prévoit sa décélération vue, comme derrière un autre aileron)
    const freinPrevu = Math.max(ralentit, decelVue), suiviEff = freineVue && R.IA_PREPARER_FREIN ? R.IA_DISTANCE_ATTAQUE : suivi;
    // (IA_SUIVI_CARTE, duel-court : une voiture qui roule au moins à la vitesse de la carte là où elle est (elle prend son virage normalement,
    // sous IA_SUIVI_CARTE × la carte) ne le retient pas plus que ce virage ne le retiendra lui-même : il la suit comme si elle allait à la vitesse
    // de la carte en ce point ; sans ça, il freinait sur sa vitesse d'aujourd'hui, 60 m avant d'y être, et perdait 0,4 s au tour sur le technique)
    let vVue = freinPrevu > 0 ? Math.max(0, w.vitesse - freinPrevu * R.IA_FREIN_PREVU) : w.vitesse;
    if (R.IA_SUIVI_CARTE && g > R.IA_SUIVI_CARTE_LOIN) { const vc = valeurEn(c, pilote.carte.trajectoire.vitesse, w.s) * rythmeDuTour(pilote); if (w.vitesse >= R.IA_SUIVI_CARTE * vc) vVue = Math.max(vVue, vc); }
    const derriere = vitesseDerriere({ distance: g, vitesse: vVue }, suiviEff);
    if (derriere < cible) { cible = derriere; retenuPar = w.id; }
  }
  // retenu : il voudrait aller nettement plus vite que la voiture devant ne le laisse
  // (plus agressif : il se sent retenu avec moins d'avance de vitesse)
  if (retenuPar !== null && libre - cible > R.IA_RETENUE_ECART * (1.5 - agressivite(pilote, retenuPar))) { pilote.retenue += dt; pilote.retenuePar = retenuPar; }
  else pilote.retenue = Math.max(0, pilote.retenue - dt);
  // le réflexe : il ne braque pas vers une voiture qui est à côté de lui, trop près ; s'il est un peu en retrait, il lui cède
  let dir = direction;
  for (const w of vues) {
    // la zone s'allonge devant lui quand il arrive vite sur elle (il doit avoir le temps de céder)
    const g = ecartLeLong(c, w.s - p.s), cote = w.d - p.d;
    const portee = R.LONGUEUR_VOITURE + R.IA_MARGE_LONG + (g > 0 ? Math.max(0, v.u - w.vitesse) * R.IA_REFLEXE_TEMPS : 0);
    if (g > portee || g < -(R.LONGUEUR_VOITURE + R.IA_MARGE_LONG) || Math.abs(cote) > R.IA_REFLEXE_COTE) continue;
    // (pas pour une voiture nettement devant lui, dans un virage serré qu'elle prend à l'intérieur : il ne braquait plus, et sortait
    // large dans l'herbe derrière elle ; tracés officiels, Montréol, Suzuko. Pour elle, c'est la vitesse qui le retient, juste après)
    if (Math.sign(dir) === Math.sign(cote) && g < R.LONGUEUR_VOITURE + R.IA_MARGE_LONG) dir = 0;
    // (devant lui, une voiture lente que sa ligne contourne ne le freine pas : sinon il s'arrêterait à côté d'une voiture arrêtée)
    if (g > 0 && estLente(pilote, v, w) && Math.abs(valeurLigne(ligne.e, r + g) - w.d) >= R.IA_LENTE_SUR) continue;
    if (g > 0) cible = Math.min(cible, w.vitesse - (pilote.cede && pilote.cede.id === w.id ? R.IA_CEDER_FORT : R.IA_CEDER));
  }
  // une consigne d'équipe (simulation.js, majConsignes) : il laisse passer son coéquipier, dans une ligne droite seulement, en restant
  // sur sa ligne : il roule CONSIGNE_RALENTI m/s sous la vitesse de l'autre tant que l'autre est derrière lui, à moins de CONSIGNE_DISTANCE m
  if (pilote.laisser && (Math.abs(valeurEn(c, c.courbure, p.s)) < R.IA_DROITE_COURBURE || horsVirage(pilote.carte, p.s))) {   // (dans une droite, ou une courbe rapide hors des zones de freinage)
    const w = vues.find(x => x.id === pilote.laisser.id), g = w ? ecartLeLong(c, w.s - p.s) : 0;
    if (w && g < 0 && g > -R.CONSIGNE_DISTANCE) cible = Math.min(cible, Math.max(0, w.vitesse - R.CONSIGNE_RALENTI));
    // (pas encore dans ses rétroviseurs : l'écurie le lui a dit par radio, il lève le pied dans la droite pour qu'il revienne)
    else if (!w) cible = Math.min(cible, Math.max(0, libre * (1 - R.CONSIGNE_LEVER)));   // (franchement : derrière, l'autre ne va pas toujours plus vite que lui en ligne droite)
  }
  // une erreur en cours : de mauvaises commandes, rien d'autre (même physique)
  const er = pilote.erreur ? pilote.erreur.type : null;
  if (er === 'freinage') cible *= 1 + R.IA_ERREUR_FREINAGE;   // il freine trop tard : il vise trop vite
  if (er === 'large') dir *= R.IA_ERREUR_LARGE;              // il ne braque pas assez : il sort large
  // juste après (IA_ERREUR_SUITE), il se remet : il roule à IA_ERREUR_RECUPERATION de sa vitesse visée, c'est là
  // qu'une erreur coûte du temps (seule, l'erreur ne coûtait presque rien : à l'épingle, l'herbe raccourcit même le chemin)
  if (!pilote.erreur && pilote.enErreur) cible *= R.IA_ERREUR_RECUPERATION;
  // pendant une erreur et IA_ERREUR_SUITE s après, il cède la place : toute voiture à côté de lui, même un peu en
  // retrait, passe d'abord (il ralentit sous sa vitesse)
  if (pilote.enErreur) for (const w of vues) {
    const g = ecartLeLong(c, w.s - p.s);
    if (g > -2 * R.LONGUEUR_VOITURE && g < R.LONGUEUR_VOITURE + R.IA_MARGE_LONG && Math.abs(w.d - p.d) < R.IA_REFLEXE_COTE)
      cible = Math.min(cible, w.vitesse - R.IA_CEDER_FORT);
  }
  const ecartVitesse = cible - v.u;
  let frein = ecartVitesse < 0 ? Math.min(1, -ecartVitesse * R.IA_GAIN_FREIN) : 0;
  if (er === 'blocage') frein = Math.min(frein, R.IA_ERREUR_BLOCAGE);   // roues bloquées : il freine moins, plus longtemps
  return {
    gaz: ecartVitesse > 0 ? Math.min(1, ecartVitesse * R.IA_GAIN_GAZ) : 0,
    frein,
    direction: Math.max(-1, Math.min(1, dir)),
  };
}
