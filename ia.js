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
    grille: null,    // au départ : sa place sur la grille (d) ; il garde sa file sur les premiers mètres (IA_DEPART)
    parcouru: 0,     // m roulés depuis le départ
    retenue: 0,      // s : depuis combien de temps une voiture devant le retient…
    retenuePar: null,  // … et laquelle (le repère de voituresVues)
    attaque: null,   // { id, etat: preparer | decaler | plonger, virage, cote, duree } quand il attaque
    cede: null,      // { id, duree } : la voiture à côté de lui à qui il cède le virage
    repos: 0,        // s avant de pouvoir réattaquer après une attaque abandonnée
    attaques: 0, reussies: 0,
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
  const pointe = pilote.carte.pointe, rythme = rythmeDuTour(pilote), dehors = c.largeur / 2 + R.MARGE_HERBE, bord = c.largeur / 2 - R.IA_MARGE_BORD_MIN;
  let penalite = 0;
  for (let i = 0; i < N; i++) {
    const mu = R.ADHERENCE * (Math.abs(e[i]) > dehors ? R.ADHERENCE_HERBE : 1);
    // le rythme (le talent) joue dans les virages ; la vitesse de pointe est celle de la voiture
    vb[i] = Math.min(pointe, rythme * Math.min(vitesseVirage(k[i], mu) * R.IA_MARGE_VIRAGE, vitesseBraquage(k[i])));
    if (Math.abs(e[i]) > bord) penalite += R.IA_PENALITE_BORD * (Math.abs(e[i]) - bord) * pas;
    // pendant un dépassement (il attaque, ou une voiture est à côté de lui), passer dans l'herbe coûte très cher
    if (pilote.depassement && Math.abs(e[i]) > dehors) penalite += R.IA_PENALITE_HERBE;
  }
  // au bout de la ligne, la carte dit à quelle vitesse il faut arriver (les virages d'après)
  const fin = valeurEn(c, pilote.carte.trajectoire.vitesse, s0 + (N - 1) * pas);
  vb[N - 1] = Math.min(vb[N - 1], fin < pointe * 0.999 ? rythme * fin : fin);
  // son freinage : la marge habituelle, son style et son rythme (un pilote plus rapide freine plus près de la limite) ;
  // en attaque, il ose le freinage complet. Son rythme moyen, pas celui du tour : un freinage qui change d'un tour à
  // l'autre surprend celui qui le suit (tour 16 : 9 chocs au lieu de 6 sur les 30 courses)
  const frein = R.IA_MARGE_FREIN * pilote.rythme * (pilote.attaque && pilote.attaque.etat !== 'preparer' ? R.IA_ATTAQUE_FREIN : pilote.style.frein);
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
    const suivante = Math.max(descend, Math.min(monte, vb[i + 1]));
    // les voitures qu'il voit : où seront-elles quand il passera ici ? Elles gardent leur vitesse et leur place
    // prévue (dPrevu). Une ligne qui en touche une est très chère. (Rester derrière une voiture plus lente, c'est la
    // vitesse de piloterIA qui s'en charge ; la passer, c'est l'attaque, une décision à part.)
    if (temps < R.IA_PREDICTION) for (const w of voisines) {
      const sPrevu = w.s + w.vitesse * temps;
      if (Math.abs(e[i + 1] - dPrevu(pilote.carte, w, sPrevu, s0)) >= ecartSur(v.u)) continue;
      const ecart = ecartLeLong(c, sPrevu - (s0 + (i + 1) * pas));
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
  // en attaque (décalé ou en train de plonger) : une seule ligne, à côté de la voiture attaquée, jusqu'après le
  // sommet du virage ; sinon, ses lignes habituelles
  const a = pilote.attaque, enAttaque = a && a.etat !== 'preparer';
  const essais = enAttaque ? [['attaque', a.cote]] : [['rapide', 0], ['continuer', 0]];
  pilote.depassement = !!enAttaque;
  // les lignes de rechange (intérieur, extérieur, garder sa place), seulement sans voiture tout près de lui : à côté
  // d'une autre, il ne fait pas d'écart imprévu, il garde sa ligne (et la priorité règle le reste)
  const entoure = vues.some(w => Math.abs(ecartLeLong(c, w.s - s0)) < R.LONGUEUR_VOITURE + R.IA_MARGE_LONG && Math.abs(w.d - e0) < R.IA_REFLEXE_COTE);
  if (entoure && !enAttaque) essais.length = 1;
  if (!enAttaque && !entoure && sens) essais.push(['interieur', sens], ['exterieur', -sens]);
  const finAttaque = enAttaque ? ((carte.virages[a.virage].s + R.IA_ATTAQUE_APRES_SOMMET - s0) % L + L) % L : 0;
  // la priorité, avec les voitures à côté de lui ou dans ses rétroviseurs à moins d'une longueur, jusqu'à la sortie
  // du prochain virage : il ne se décale pas vers elles (au mieux jusqu'à l'écart sûr) ; et si l'une est à hauteur
  // (au moins un tiers de longueur), il lui laisse une largeur de voiture, quitte à s'écarter
  const places = [], prochain = carte.virages.reduce((m, x) => Math.min(m, ((x.s - s0) % L + L) % L), Infinity);
  const sur = ecartSur(v.u);
  for (const w of vues) {
    const g = ecartLeLong(c, w.s - s0);
    if (g < -R.LONGUEUR_VOITURE || g > R.LONGUEUR_VOITURE * (1 - R.IA_HAUTEUR_LAISSER)) continue;
    const cote = Math.sign(w.d - e0) || 1, aHauteur = g >= -R.LONGUEUR_VOITURE * (1 - R.IA_HAUTEUR_LAISSER);
    const laisse = w.d - cote * Math.max(aHauteur ? R.LARGEUR_VOITURE + R.IA_ESPACE_LAISSE : sur, ecartCoteACote(carte, s0));
    // la borne : sa place actuelle s'il est déjà plus près que ça (il ne s'approche pas), sinon l'écart voulu
    const borne = aHauteur ? laisse : (cote > 0 ? Math.max(e0, laisse) : Math.min(e0, laisse));
    places.push({ cote, borne, jusque: prochain + R.IA_VIRAGE_LARGEUR });
    // coincé : sa ligne rapide empiète de plus de IA_CEDER_ECART sur la place à laisser, avant la sortie du virage ;
    // deux voitures ne passent pas de front : il cède (piloterIA le fait ralentir derrière elle)
    if (aHauteur) for (let i = 0; i <= N && i * pas <= prochain + R.IA_VIRAGE_LARGEUR; i++) {
      if ((borne - t.rapide[i]) * cote < -R.IA_CEDER_ECART) { pilote.cede = { id: w.id, duree: 0 }; break; }
    }
    pilote.depassement = true;
  }
  // les voitures qui comptent pour noter ses lignes : devant lui, à côté, ou juste derrière (dans ses rétroviseurs :
  // il ne se rabat pas sur elles) ; celle qui arrive de plus loin derrière doit faire attention, pas lui
  // Une voiture déjà devant lui, dans sa file, ne compte pas : derrière elle, c'est sa vitesse qui le garde à distance
  // (piloterIA) ; la note ne doit pas le pousser sur une autre ligne pour l'éviter
  const voisines = vues.filter(w => { const g = ecartLeLong(c, w.s - s0); return g > -R.IA_VISION_COTE[0] && !(g > R.LONGUEUR_VOITURE && Math.abs(w.d - e0) < ecartSur(v.u)); });
  let meilleure = Infinity, choix = null;
  for (const [type, cote] of essais) {
    const cible = t.cible;
    for (let i = 0; i <= N; i++) {
      const s = i * pas, r = t.rapide[i];
      let val = r;
      if (type === 'continuer') { const m = Math.max(0, Math.min(1, (s - R.IA_CONTINUER[0]) / (R.IA_CONTINUER[1] - R.IA_CONTINUER[0]))); val = e0 * (1 - m) + r * m; }
      else if (type === 'interieur' || type === 'exterieur') val = r + cote * R.IA_DECALAGE_CANDIDAT;
      else if (type === 'attaque') {
        // à côté de la voiture attaquée, côté a.cote, jusqu'après le sommet du virage, puis retour à sa ligne
        const m = s <= finAttaque ? 1 : Math.max(0, 1 - (s - finAttaque) / R.IA_DEPASSEMENT_RAMPE);
        // elle est tout près : elle garde sa place (et la laisse dès qu'il sera à hauteur)
        val = r * (1 - m) + (a.vue.d + a.cote * sur) * m;
        // pas la place de rester à l'écart sûr d'elle (le bord) : il renonce à cette attaque
        if (m === 1 && Math.abs(val) > limite) a.impossible = true;
      }
      for (const q of places) if (s <= q.jusque) val = q.cote > 0 ? Math.min(val, q.borne) : Math.max(val, q.borne);
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
    if (note < meilleure) { meilleure = note; choix = type; t.meilleurE.set(t.e); t.meilleurV.set(t.vb); }
  }
  if (!pilote.ligne) pilote.ligne = { s0: 0, e: new Float64Array(N), v: new Float64Array(N) };
  pilote.ligne.s0 = s0;
  pilote.ligne.e.set(t.meilleurE);
  pilote.ligne.v.set(t.meilleurV);
  pilote.choix = choix;
  pilote.decisions++;
}

// le prochain point de freinage devant s : { j (le virage), distance } ou null
function prochainFreinage(carte, s) {
  const L = carte.circuit.longueur;
  let mieux = null;
  carte.virages.forEach((x, j) => { const d = ((x.freinage - s) % L + L) % L; if (!mieux || d < mieux.distance) mieux = { j, distance: d }; });
  return mieux;
}

function finirAttaque(pilote, reussie, pourquoi) {
  if (pilote.journal) pilote.journal.push(pourquoi);
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
  if (!a) {
    if (R.IA_DEPASSEMENT && pilote.repos <= 0 && pilote.retenue >= R.IA_ATTENTE_ATTAQUE && pilote.retenuePar !== null) {
      pilote.attaque = { id: pilote.retenuePar, etat: 'preparer', virage: null, cote: 0, vue: null, duree: 0, impossible: false };
      pilote.attaques++;
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
    // tout près, ou en train de fondre sur elle au freinage (il voudrait aller nettement plus vite qu'elle)
    const ligne = pilote.ligne, r = ligne ? ((p.s - ligne.s0) % c.longueur + c.longueur) % c.longueur : 0;
    const fond = ligne && valeurLigne(ligne.v, r) - w.vitesse > R.IA_RAPPROCHEMENT;
    if (f && (g < R.IA_DECALAGE_ECART || fond) && f.distance < Math.max(R.IA_DECALAGE_DISTANCE, Math.max(0, v.u) * R.IA_DECALAGE_TEMPS)) {
      a.duree = 0;   // la durée maximale compte à partir du décalage
      // côté intérieur du virage, s'il y a la place ; sinon l'extérieur ; sinon il attend le virage suivant
      // seulement dans une zone de freinage après une vraie ligne droite, jamais dans un enchaînement
      if (carte.virages[f.j].droite < R.IA_DROITE_ATTAQUE) return;
      const sens = carte.virages[f.j].sens;
      const cote = Math.abs(w.d + sens * ecart) <= limite ? sens : Math.abs(w.d - sens * ecart) <= limite ? -sens : 0;
      if (cote) { a.etat = 'decaler'; a.virage = f.j; a.cote = cote; }
    }
  } else if (a.etat === 'decaler' && carte.virages[a.virage].lent) {
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
  // (sauf celle qu'il attaque, une fois décalé à côté d'elle)
  const libre = valeurLigne(ligne.v, r + u * R.IA_ANTICIPATION), a = pilote.attaque;
  let cible = libre, retenuPar = null;
  for (const w of vues) {
    const g = ecartLeLong(c, w.s - p.s);
    if (g <= 0 || (a && a.etat !== 'preparer' && w.id === a.id)) continue;
    // sur sa ligne, ou tout près de son axe (une voiture qui se rabat devant lui) : il reste derrière
    const surSaLigne = Math.abs(valeurLigne(ligne.e, r + g) - w.d) < ecartSur(v.u);
    // hors attaque, on reste à la file : une voiture devant lui, assez près, il la suit, même s'il sort mieux du virage
    // (la seule façon de la passer, c'est l'attaque)
    const aLaFile = g < R.IA_FILE_DISTANCE && Math.abs(w.d - p.d) < R.IA_FILE_COTE;
    if (!surSaLigne && !aLaFile && Math.abs(w.d - p.d) >= R.IA_VISION_COULOIR) continue;
    // en préparant son attaque, il se colle dans le sillage de la voiture attaquée (s'il est bien derrière elle, pas en biais)
    const sillage = a && w.id === a.id && Math.abs(w.d - p.d) < R.ASPIRATION_LARGEUR;
    const derriere = vitesseDerriere({ distance: g, vitesse: w.vitesse }, sillage ? R.IA_DISTANCE_ATTAQUE : R.IA_DISTANCE_SUIVI);
    if (derriere < cible) { cible = derriere; retenuPar = w.id; }
  }
  // retenu : il voudrait aller nettement plus vite que la voiture devant ne le laisse
  if (retenuPar !== null && libre - cible > R.IA_RETENUE_ECART) { pilote.retenue += dt; pilote.retenuePar = retenuPar; }
  else pilote.retenue = Math.max(0, pilote.retenue - dt);
  // le réflexe : il ne braque pas vers une voiture qui est à côté de lui, trop près ; s'il est un peu en retrait, il lui cède
  let dir = direction;
  for (const w of vues) {
    // la zone s'allonge devant lui quand il arrive vite sur elle (il doit avoir le temps de céder)
    const g = ecartLeLong(c, w.s - p.s), cote = w.d - p.d;
    const portee = R.LONGUEUR_VOITURE + R.IA_MARGE_LONG + (g > 0 ? Math.max(0, v.u - w.vitesse) * R.IA_REFLEXE_TEMPS : 0);
    if (g > portee || g < -(R.LONGUEUR_VOITURE + R.IA_MARGE_LONG) || Math.abs(cote) > R.IA_REFLEXE_COTE) continue;
    if (Math.sign(dir) === Math.sign(cote)) dir = 0;
    if (g > 0) cible = Math.min(cible, w.vitesse - (pilote.cede && pilote.cede.id === w.id ? R.IA_CEDER_FORT : R.IA_CEDER));
  }
  const ecartVitesse = cible - v.u;
  return {
    gaz: ecartVitesse > 0 ? Math.min(1, ecartVitesse * R.IA_GAIN_GAZ) : 0,
    frein: ecartVitesse < 0 ? Math.min(1, -ecartVitesse * R.IA_GAIN_FREIN) : 0,
    direction: Math.max(-1, Math.min(1, dir)),
  };
}
