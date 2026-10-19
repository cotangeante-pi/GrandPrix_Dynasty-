// L'IA des adversaires, en calcul pur (sans Three.js).
// Une fois par circuit : la trajectoire idéale (extérieur–corde–extérieur) et la vitesse conseillée en chaque point.
// Puis, à chaque pas : piloteIA donne les mêmes commandes qu'un joueur, { gaz, frein, direction }.
// Elle ne voit que la piste et sa propre voiture, et roule avec exactement la même physique (physique.js).

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

// la vitesse conseillée au point s de la piste (interpolée entre deux échantillons)
function vitesseConseillee(circuit, trajectoire, s) {
  const n = circuit.nb, f = (((s % circuit.longueur) + circuit.longueur) % circuit.longueur) / circuit.pas;
  const i = Math.floor(f) % n, j = (i + 1) % n, a = f - Math.floor(f);
  return trajectoire.vitesse[i] * (1 - a) + trajectoire.vitesse[j] * a;
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

// le pilote : il vise un point de sa trajectoire devant lui (« poursuite pure ») et suit la vitesse conseillée.
// devant (facultatif) : { distance, vitesse } de la voiture qui la précède, ce qu'un pilote voit ; elle reste derrière.
function piloteIA(v, circuit, trajectoire, devant) {
  const R = REGLAGES;
  const p = v.piste || positionSurPiste(circuit, v.x, v.z);
  const u = Math.max(0, v.u);

  // la direction
  const visee = Math.max(R.IA_VISEE_MIN, u * R.IA_VISEE_TEMPS);
  const iv = Math.round((p.s + visee) / circuit.pas) % circuit.nb;
  const dx = trajectoire.x[iv] - v.x, dz = trajectoire.z[iv] - v.z;
  const c = Math.cos(v.cap), s = Math.sin(v.cap);
  const angle = Math.atan2(-s * dx + c * dz, c * dx + s * dz);
  const courbureVoulue = 2 * Math.sin(angle) / Math.hypot(dx, dz);
  const braquageVoulu = Math.atan(R.EMPATTEMENT * courbureVoulue);
  const direction = braquageVoulu / braquageMax(v.u);

  // la vitesse : celle qu'on conseille un peu plus loin, là où la voiture sera dans IA_ANTICIPATION secondes
  let cible = vitesseConseillee(circuit, trajectoire, p.s + u * R.IA_ANTICIPATION);
  // loin de sa trajectoire (ou dans l'herbe), le virage qu'elle demande pour la rejoindre peut être plus serré que
  // celui de la trajectoire : elle ralentit jusqu'à pouvoir le prendre
  const ip = Math.round(p.s / circuit.pas) % circuit.nb;
  if (v.surHerbe || Math.abs(p.d - trajectoire.ecart[ip]) > R.IA_ECART_RATTRAPAGE) {
    const mu = R.ADHERENCE * (v.surHerbe ? R.ADHERENCE_HERBE : 1);
    cible = Math.min(cible, Math.max(R.VITESSE_CINEMATIQUE, Math.min(vitesseVirage(courbureVoulue, mu) * R.IA_MARGE_VIRAGE, vitesseBraquage(courbureVoulue))));
  }
  if (devant) cible = Math.min(cible, vitesseDerriere(devant));
  const ecartVitesse = cible - v.u;
  return {
    gaz: ecartVitesse > 0 ? Math.min(1, ecartVitesse * R.IA_GAIN_GAZ) : 0,
    frein: ecartVitesse < 0 ? Math.min(1, -ecartVitesse * R.IA_GAIN_FREIN) : 0,
    direction: Math.max(-1, Math.min(1, direction)),
  };
}
