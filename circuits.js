// Les circuits en calcul pur (sans Three.js) : la courbe, ses échantillons, et où est un point sur la piste.
// Repère : x et z au sol, y vers le haut. La normale n = (-tz, tx) pointe à DROITE du pilote ; d > 0 = à droite.

// Catmull-Rom centripète (formule de Barry et Goldman) entre p1 et p2, u dans [0, 1]
function pointCatmullRom(p0, p1, p2, p3, u) {
  const noeud = (a, b) => Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])) || 1e-6;
  const t0 = 0, t1 = t0 + noeud(p0, p1), t2 = t1 + noeud(p1, p2), t3 = t2 + noeud(p2, p3);
  const t = t1 + u * (t2 - t1);
  const mel = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
  const a1 = mel(p0, p1, t0, t1), a2 = mel(p1, p2, t1, t2), a3 = mel(p2, p3, t2, t3);
  const b1 = mel(a1, a2, t0, t2), b2 = mel(a2, a3, t1, t3);
  return mel(b1, b2, t1, t2);
}

// la courbe fermée, découpée finement : [{ seg, u, x, z, s }] (s = distance depuis le premier point)
function courbeFine(points) {
  const n = points.length, fine = [];
  let s = 0, avant = null;
  for (let seg = 0; seg < n; seg++) {
    const p0 = points[(seg - 1 + n) % n], p1 = points[seg], p2 = points[(seg + 1) % n], p3 = points[(seg + 2) % n];
    const morceaux = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / REGLAGES.PAS_SPLINE_FIN));
    for (let k = 0; k < morceaux; k++) {
      const u = k / morceaux, p = pointCatmullRom(p0, p1, p2, p3, u);
      if (avant) s += Math.hypot(p[0] - avant[0], p[1] - avant[1]);
      fine.push({ seg, u, x: p[0], z: p[1], s });
      avant = p;
    }
  }
  // le bout qui referme la boucle
  s += Math.hypot(points[0][0] - avant[0], points[0][1] - avant[1]);
  fine.push({ seg: n, u: 0, x: points[0][0], z: points[0][1], s });
  return fine;
}

// un circuit décrit par morceaux → { points (tous les PAS_POINTS_MORCEAUX m, la ligne au premier), morceaux, fermeture }
// morceaux : [{ type, debut, fin, angles }] en mètres le long de la géométrie exacte ; fermeture : l'écart entre la fin et le départ
function pointsDepuisMorceaux(def) {
  let [x, z, cap] = def.depart;
  const points = [], morceaux = [];
  let s = 0;
  const pasMax = REGLAGES.PAS_POINTS_MORCEAUX;
  for (const m of def.morceaux) {
    // un morceau = une suite de droites et d'arcs : [longueur, courbure]
    const arcs = m[0] === 'droite' ? [[m[1], 0]]
      : m[0] === 'virage' ? [[m[1] * Math.abs(m[2]) * Math.PI / 180, Math.sign(m[2]) / m[1]]]
      : [m[2], -2 * m[2], m[2]].map(a => [m[1] * Math.abs(a) * Math.PI / 180, Math.sign(a) / m[1]]);
    const debut = s;
    for (const [longueur, k] of arcs) {
      const nb = Math.max(1, Math.ceil(longueur / pasMax)), ds = longueur / nb;
      for (let i = 0; i < nb; i++) {
        points.push([x, z]);
        // pas exact sur l'arc (corde), pour que l'erreur ne s'accumule pas
        if (k === 0) { x += Math.cos(cap) * ds; z += Math.sin(cap) * ds; }
        else {
          const r = 1 / k, cap2 = cap + k * ds;
          // le centre est à droite (k > 0) ou à gauche : n = (-sin cap, cos cap)
          x += r * (Math.sin(cap2) - Math.sin(cap)); z += r * (Math.cos(cap) - Math.cos(cap2));
          cap = cap2;
        }
      }
      s += longueur;
    }
    morceaux.push({ type: m[0], debut, fin: s, angles: m[0] === 'droite' ? [] : arcs.map(a => Math.sign(a[1])) });
  }
  return { points, morceaux, longueur: s, fermeture: Math.hypot(x - def.depart[0], z - def.depart[1]) };
}

// def : { nom, largeur, secteurs, points ou morceaux } (voir CIRCUITS dans donnees.js)
function construireCircuit(def, pas = REGLAGES.PAS_ECHANTILLON) {
  const decrit = def.morceaux ? pointsDepuisMorceaux(def) : null;
  const pts = decrit ? decrit.points : def.points, n = pts.length;
  const fine = courbeFine(pts);
  const longueurFine = fine[fine.length - 1].s;
  const nb = Math.round(longueurFine / pas);

  // des échantillons à distance régulière le long de la courbe, chacun recalculé sur la spline
  const x = new Float64Array(nb), z = new Float64Array(nb);
  let j = 0;
  for (let i = 0; i < nb; i++) {
    const cible = (i * longueurFine) / nb;
    while (fine[j + 1].s < cible) j++;
    const a = fine[j], b = fine[j + 1];
    const f = (cible - a.s) / (b.s - a.s || 1);
    const seg = a.seg, u = a.u + f * ((b.seg === seg ? b.u : 1) - a.u);
    const p = pointCatmullRom(pts[(seg - 1 + n) % n], pts[seg % n], pts[(seg + 1) % n], pts[(seg + 2) % n], u);
    x[i] = p[0]; z[i] = p[1];
  }

  // la distance depuis la ligne, la tangente, la normale et la courbure (signée : > 0 = virage à droite)
  const s = new Float64Array(nb), tx = new Float64Array(nb), tz = new Float64Array(nb);
  const nx = new Float64Array(nb), nz = new Float64Array(nb), courbure = new Float64Array(nb);
  let longueur = 0;
  for (let i = 0; i < nb; i++) {
    s[i] = longueur;
    const k = (i + 1) % nb;
    longueur += Math.hypot(x[k] - x[i], z[k] - z[i]);
  }
  for (let i = 0; i < nb; i++) {
    const a = (i - 1 + nb) % nb, b = (i + 1) % nb;
    const dx = x[b] - x[a], dz = z[b] - z[a], l = Math.hypot(dx, dz);
    tx[i] = dx / l; tz[i] = dz / l;
    nx[i] = -tz[i]; nz[i] = tx[i];
  }
  for (let i = 0; i < nb; i++) {
    const a = (i - 1 + nb) % nb, b = (i + 1) % nb;
    let angle = Math.atan2(tz[b], tx[b]) - Math.atan2(tz[a], tx[a]);
    if (angle > Math.PI) angle -= 2 * Math.PI;
    if (angle < -Math.PI) angle += 2 * Math.PI;
    const ds = (s[b] - s[a] + longueur) % longueur;
    courbure[i] = angle / ds;
  }

  return {
    nom: def.nom, largeur: def.largeur, nb, x, z, s, tx, tz, nx, nz, courbure, longueur,
    pas: longueur / nb,
    secteurs: def.secteurs.map(f => f * longueur),   // en mètres depuis la ligne
    // les morceaux, ramenés à la longueur de la spline ; fermeture : l'écart de la description par morceaux (m)
    morceaux: decrit ? decrit.morceaux.map(m => Object.assign({}, m, { debut: m.debut * longueur / decrit.longueur, fin: m.fin * longueur / decrit.longueur })) : [],
    fermeture: decrit ? decrit.fermeture : 0,
  };
}

function secteurDe(circuit, s) {
  const sec = circuit.secteurs;
  return s >= sec[2] ? 3 : s >= sec[1] ? 2 : 1;
}

// l'échantillon le plus proche de (px, pz) entre les indices debut et fin (fin non compris, les indices bouclent)
// renvoie l'indice ; la distance au carré reste dans plusProche.d2 (pas d'objet créé : 20 voitures × 120 appels par seconde)
function plusProche(circuit, px, pz, debut, fin) {
  const nb = circuit.nb, x = circuit.x, z = circuit.z;
  let meilleur = -1, d2min = Infinity;
  let i = ((debut % nb) + nb) % nb;
  for (let k = debut; k < fin; k++) {
    const dx = x[i] - px, dz = z[i] - pz, d2 = dx * dx + dz * dz;
    if (d2 < d2min) { d2min = d2; meilleur = i; }
    if (++i === nb) i = 0;
  }
  plusProche.d2 = d2min;
  return meilleur;
}

// où est (px, pz) sur la piste : { s, d, surPiste, secteur, indice, nx, nz } (nx, nz : la normale du morceau, vers la droite)
// indiceDepart (facultatif) : l'indice rendu au pas d'avant, pour ne chercher qu'autour
function positionSurPiste(circuit, px, pz, indiceDepart) {
  const nb = circuit.nb, F = REGLAGES.FENETRE_RECHERCHE;
  let i = -1;
  if (indiceDepart !== undefined && indiceDepart !== null) {
    i = plusProche(circuit, px, pz, indiceDepart - F, indiceDepart + F + 1);
    let ecartIndice = Math.abs(i - indiceDepart);
    if (ecartIndice > nb / 2) ecartIndice = nb - ecartIndice;
    const loin = plusProche.d2 > (circuit.largeur * REGLAGES.ECART_RECHERCHE_COMPLETE) ** 2;
    if (ecartIndice >= F || loin) i = -1;   // au bord de la fenêtre ou loin de la piste : on n'est pas sûr
  }
  if (i < 0) i = plusProche(circuit, px, pz, 0, nb);

  // on projette sur le morceau de courbe d'avant ou d'après l'échantillon, et on garde le plus proche des deux
  const x = circuit.x, z = circuit.z;
  let d2min = Infinity, sMeilleur = 0, dMeilleur = 0, nxM = 0, nzM = 0;
  for (let cote = 0; cote < 2; cote++) {
    const a = cote === 0 ? (i - 1 + nb) % nb : i, b = cote === 0 ? i : (i + 1) % nb;
    const sx = x[b] - x[a], sz = z[b] - z[a], l2 = sx * sx + sz * sz;
    const ax = px - x[a], az = pz - z[a];
    const f = Math.min(1, Math.max(0, (ax * sx + az * sz) / l2));
    const ex = ax - f * sx, ez = az - f * sz, d2 = ex * ex + ez * ez;
    if (d2 < d2min) {
      const l = Math.sqrt(l2);
      d2min = d2;
      sMeilleur = circuit.s[a] + f * l;
      dMeilleur = (az * sx - ax * sz) / l;
      nxM = -sz / l; nzM = sx / l;
    }
  }
  const s = sMeilleur % circuit.longueur;
  return { s, d: dMeilleur, surPiste: Math.abs(dMeilleur) <= circuit.largeur / 2, secteur: secteurDe(circuit, s), indice: i, nx: nxM, nz: nzM };
}

const CIRCUIT_TEST = construireCircuit(CIRCUITS.test);
