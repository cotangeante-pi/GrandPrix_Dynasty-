// Le décor du circuit (étape 10, CLAUDE.md « Le monde 3D ») : tribunes et leur public, public debout, stands (bâtiment et un garage
// par écurie), arbres (deux formes), panneaux, piles de pneus. Tout est fait par le code.
// - DECOR.placer(circuit, description) : le placement, en calcul pur (sans Three.js, testé dans tests/test.html). La description est
//   une liste { type, s, longueur, cote, distance, … } (DECORS dans donnees.js) ; rien ne tombe sur la piste (DECOR_MARGE au-delà du
//   bord), ni dans la voie des stands, ni sur le podium, ni sur un poste de caméra télé (le décor ne cache pas ce qu'ils filment).
// - DECOR.construire(circuit, description) : un InstancedMesh par type et par niveau de détail (un appel de dessin chacun, quel que
//   soit le nombre d'objets) ; DECOR.majDetail(decor, positions des caméras) range le public et les arbres en « proche » (détaillé),
//   « loin » (simple) ou rien, selon la distance à la caméra la plus proche.
// Le décor a son propre hasard (tirage) : il ne tire jamais dans hasard(), la course ne change pas.
const DECOR = (function () {
  const R = REGLAGES;
  const TYPES = ['tribune', 'public', 'stands', 'arbres', 'panneaux', 'pneus'];

  // un petit générateur à lui (congruences, 32 bits)
  function tirage(graine) {
    let e = (graine >>> 0) || 1;
    return () => { e = (Math.imul(e, 1664525) + 1013904223) >>> 0; return e / 4294967296; };
  }

  // le repère au point s de la piste, à l'écart d (d > 0 = à droite) ; a : le long de la piste, b : en s'éloignant de la piste
  // (du côté cote), choisis pour que (a, haut, b) soit direct (sinon les objets du côté gauche seraient retournés en miroir)
  function repere(c, s, d, cote) {
    const L = c.longueur, i = Math.round((((s % L) + L) % L) / c.pas) % c.nb;
    return { x: c.x[i] + c.nx[i] * d, z: c.z[i] + c.nz[i] * d, ax: c.tx[i] * cote, az: c.tz[i] * cote, bx: c.nx[i] * cote, bz: c.nz[i] * cote };
  }
  // un point du repère local (le long, hauteur, au loin) → un objet placé
  function poser(r, l, h, p, extra) {
    return Object.assign({ x: r.x + r.ax * l + r.bx * p, y: h, z: r.z + r.az * l + r.bz * p, ax: r.ax, az: r.az, bx: r.bx, bz: r.bz, e: 1 }, extra);
  }

  // les postes des caméras télé : la même règle que camera.js (TELE_ESPACEMENT, de part et d'autre, TELE_RECUL derrière la barrière)
  function postesTele(c) {
    const n = Math.max(1, Math.round(c.longueur / R.TELE_ESPACEMENT)), postes = [];
    for (let k = 0; k < n; k++) {
      const i = Math.round(k * c.nb / n) % c.nb, d = (k % 2 ? 1 : -1) * (c.largeur / 2 + R.DISTANCE_BARRIERE + R.TELE_RECUL);
      postes.push({ x: c.x[i] + c.nx[i] * d, z: c.z[i] + c.nz[i] * d });
    }
    return postes;
  }
  // le podium (podium3d.js : en face de la ligne, à PODIUM_DISTANCE du bord gauche) : un cercle qui le contient, ses marches et sa caméra
  function zonePodium(c) {
    const d = -(c.largeur / 2 + R.PODIUM_DISTANCE + R.PODIUM_PROFONDEUR / 2);
    return { x: c.x[0] + c.nx[0] * d, z: c.z[0] + c.nz[0] * d, rayon: R.DECOR_PODIUM_RAYON };
  }

  // la place est-elle libre ? un cercle (cx, cz, rayon) : loin de la piste (de tout le tracé, pas seulement du point s), hors de la
  // voie des stands, du podium et des postes télé
  function verificateur(c) {
    const demi = c.largeur / 2, eviter = postesTele(c).map(p => ({ x: p.x, z: p.z, rayon: R.DECOR_MARGE_TELE })).concat([zonePodium(c)]);
    // les échantillons rangés dans une grille de cases de G m : on ne regarde que les 9 cases autour (un objet plus loin que G de
    // tout échantillon est libre, puisque demi + DECOR_MARGE + son rayon < G)
    const G = R.DECOR_CASE, cases = new Map(), cle = (i, j) => i * 100003 + j;
    for (let i = 0; i < c.nb; i++) {
      const k = cle(Math.floor(c.x[i] / G), Math.floor(c.z[i] / G));
      if (!cases.has(k)) cases.set(k, []);
      cases.get(k).push(i);
    }
    return function libre(cx, cz, rayon) {
      if (demi + R.DECOR_MARGE + rayon >= G) return false;   // (un objet trop grand pour la grille : refusé, jamais posé sans vérification)
      let dmin = Infinity, imin = -1;
      const gi = Math.floor(cx / G), gj = Math.floor(cz / G);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const l = cases.get(cle(gi + a, gj + b));
        if (l) for (const i of l) { const dx = cx - c.x[i], dz = cz - c.z[i], d2 = dx * dx + dz * dz; if (d2 < dmin) { dmin = d2; imin = i; } }
      }
      if (imin >= 0 && Math.sqrt(dmin) - rayon < demi + R.DECOR_MARGE) return false;
      if (imin < 0) { for (const q of eviter) if (Math.hypot(cx - q.x, cz - q.z) < q.rayon + rayon) return false; return true; }
      const d = (cx - c.x[imin]) * c.nx[imin] + (cz - c.z[imin]) * c.nz[imin];
      const zs = typeof zoneStands === 'function' ? zoneStands(c, c.s[imin], d) : null;
      if (zs && d * zs.cote > 0 && d * zs.cote - rayon < zs.dExt + R.DECOR_MARGE_STANDS) return false;
      for (const q of eviter) if (Math.hypot(cx - q.x, cz - q.z) < q.rayon + rayon) return false;
      return true;
    };
  }

  // le placement : { tribune, public, batiment, garage, arbreA, arbreB, panneau, pneus } (listes d'objets { x, y, z, ax, az, bx, bz, e,
  // couleur, cx, cz, rayon }), et ce qui a été refusé (une place qui n'était pas libre)
  function placer(c, description, graine) {
    const objets = { tribune: [], public: [], batiment: [], garage: [], arbreA: [], arbreB: [], panneau: [], pneus: [] };
    const libre = verificateur(c), rnd = tirage(graine === undefined ? R.DECOR_GRAINE : graine);
    const couleurPublic = couleursPublic(rnd);
    let refus = 0, inconnus = 0;
    // range un objet si sa place est libre (le centre de son emprise : (lc, pc) dans son repère, son rayon)
    const ranger = (liste, r, l, h, p, lc, pc, rayon, extra) => {
      const o = poser(r, l, h, p, extra);
      o.cx = r.x + r.ax * lc + r.bx * pc; o.cz = r.z + r.az * lc + r.bz * pc; o.rayon = rayon;
      if (!libre(o.cx, o.cz, rayon)) { refus++; return null; }
      liste.push(o);
      return o;
    };
    const modules = (e, pas, f) => {
      const n = Math.max(1, Math.round(e.longueur / pas)), l = e.longueur / n;
      for (let k = 0; k < n; k++) f(e.s + (k + 0.5) * l, l, k, n);
    };
    for (const e of description) {
      const cote = e.cote < 0 ? -1 : 1, d = cote * e.distance;
      if (e.type === 'tribune') {
        const rangs = e.rangs || R.TRIBUNE_RANGS, prof = rangs * R.TRIBUNE_MARCHE[0];
        modules(e, R.TRIBUNE_MODULE, s => {
          const r = repere(c, s, d, cote);
          if (!ranger(objets.tribune, r, 0, 0, 0, 0, prof / 2, Math.hypot(R.TRIBUNE_MODULE / 2, prof / 2))) return;
          // son public, assis sur les marches (une place sur DECOR_PUBLIC_REMPLI occupée)
          const n = Math.round(R.TRIBUNE_MODULE / R.PUBLIC_PAS);
          for (let g = 0; g < rangs; g++)
            for (let k = 0; k < n; k++) {
              if (rnd() > R.DECOR_PUBLIC_REMPLI) continue;
              objets.public.push(poser(r, -R.TRIBUNE_MODULE / 2 + (k + 0.5) * R.TRIBUNE_MODULE / n, (g + 1) * R.TRIBUNE_MARCHE[1], (g + 0.5) * R.TRIBUNE_MARCHE[0], { couleur: couleurPublic() }));
            }
        });
      } else if (e.type === 'public') {
        // le public debout dans l'herbe, en quelques rangs, un peu en désordre
        const rangs = e.rangs || R.PUBLIC_RANGS;
        modules(e, R.PUBLIC_PAS, s => {
          const r = repere(c, s, d, cote);
          for (let g = 0; g < rangs; g++)
            ranger(objets.public, r, (rnd() - 0.5) * R.PUBLIC_PAS * 0.6, 0, g * R.PUBLIC_RANG + rnd() * 0.3, 0, g * R.PUBLIC_RANG, 0.5, { couleur: couleurPublic() });
        });
      } else if (e.type === 'stands') {
        // le bâtiment, en modules qui suivent la piste ; les garages sur sa façade, un par écurie, à ses couleurs, répartis sur la longueur
        modules(e, R.STANDS_MODULE, s => {
          const r = repere(c, s, d, cote);
          ranger(objets.batiment, r, 0, 0, 0, 0, R.STANDS_PROFONDEUR / 2, Math.hypot(R.STANDS_MODULE / 2, R.STANDS_PROFONDEUR / 2));
        });
        const [e0, e1] = e.ecuries || [0, R.ECURIES.length];   // les écuries de ce bâtiment (deux bâtiments de part et d'autre du podium : 5 et 5)
        for (let k = e0; k < e1; k++) {
          const r = repere(c, e.s + (k - e0 + 0.5) * e.longueur / (e1 - e0), d, cote);
          ranger(objets.garage, r, 0, 0, 0, 0, 0, R.STANDS_GARAGE / 2, { couleur: R.ECURIES[k].couleur });
        }
      } else if (e.type === 'arbres') {
        for (let k = 0; k < e.nombre; k++) {
          const s = e.s + rnd() * e.longueur, p = rnd() * (e.profondeur || 0), r = repere(c, s, d, cote), taille = R.ARBRE_TAILLE[0] + rnd() * (R.ARBRE_TAILLE[1] - R.ARBRE_TAILLE[0]);
          ranger(rnd() < 0.5 ? objets.arbreA : objets.arbreB, r, 0, 0, p, 0, p, R.ARBRE_RAYON * taille, { e: taille });
        }
      } else if (e.type === 'panneaux') {
        let n = 0;
        modules(e, R.PANNEAU_PAS, s => {
          const r = repere(c, s, d, cote);
          ranger(objets.panneau, r, 0, 0, 0, 0, 0, R.PANNEAU_LONGUEUR / 2, { couleur: R.DECOR_COULEURS_PANNEAUX[n++ % R.DECOR_COULEURS_PANNEAUX.length] });
        });
      } else if (e.type === 'pneus') {
        let n = 0;
        modules(e, R.PNEUS_PILE_PAS, s => {
          const r = repere(c, s, d, cote);
          ranger(objets.pneus, r, 0, 0, R.PNEUS_PILE_RAYON, 0, R.PNEUS_PILE_RAYON, R.PNEUS_PILE_RAYON, { couleur: n++ % R.PNEUS_PILE_REPERE ? R.DECOR_COULEUR_PNEU : R.DECOR_COULEUR_PNEU_REPERE });
        });
      } else inconnus++;
    }
    return { objets, refus, inconnus };
  }

  // les couleurs du public : celles de decor-public.js (le public à domicile, Codeur 3) quand il existe ; sinon les couleurs des écuries
  // et quelques couleurs de vêtements (DECOR_COULEURS_PUBLIC)
  function couleursPublic(rnd) {
    const palette = R.ECURIES.map(e => e.couleur).concat(R.DECOR_COULEURS_PUBLIC);
    return () => palette[Math.floor(rnd() * palette.length)];
  }

  // --- la construction en Three.js (seulement dans la page)

  // une boîte dans le repère local (x le long, y en haut, z au loin), ajoutée à pos / col (36 sommets, 12 triangles, tournés vers l'extérieur)
  function boite(pos, col, x0, x1, y0, y1, z0, z1, couleur) {
    const C = new THREE.Color(couleur);
    const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]];
    for (const f of faces) for (const k of [f[0], f[1], f[2], f[0], f[2], f[3]]) { pos.push(...v[k]); col.push(C.r, C.g, C.b); }
  }
  // un prisme vertical à n côtés (un tronc, un pneu), de rayon r0 en bas à r1 en haut ; avecHaut : le couvercle
  function prisme(pos, col, n, r0, r1, y0, y1, couleur, avecHaut, z) {
    const C = new THREE.Color(couleur), zc = z || 0;
    const pt = (k, r, y) => [Math.cos(2 * Math.PI * k / n) * r, y, zc + Math.sin(2 * Math.PI * k / n) * r];
    const tri = (...ps) => { for (const p of ps) { pos.push(...p); col.push(C.r, C.g, C.b); } };
    for (let k = 0; k < n; k++) {
      const a0 = pt(k, r0, y0), a1 = pt(k + 1, r0, y0), b0 = pt(k, r1, y1), b1 = pt(k + 1, r1, y1);
      if (r1 > 0) tri(a0, b1, a1, a0, b0, b1); else tri(a0, b0, a1);
      if (avecHaut && r1 > 0) tri([0, y1, zc], b1, b0);
    }
  }
  function geometrie(pos, col) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }
  const fabriquer = f => { const pos = [], col = []; f(pos, col); return geometrie(pos, col); };

  // les formes de chaque brique (dans leur repère local)
  function formes() {
    const C = R.DECOR_COULEURS, M = R.TRIBUNE_MODULE, [pm, hm] = R.TRIBUNE_MARCHE;
    return {
      tribune: rangs => fabriquer((p, c) => {
        for (let g = 0; g < rangs; g++) boite(p, c, -M / 2, M / 2, 0, (g + 1) * hm, g * pm, (g + 1) * pm, g % 2 ? C.gradinA : C.gradinB);
        const haut = rangs * hm + R.TRIBUNE_TOIT, prof = rangs * pm;
        boite(p, c, -M / 2, M / 2, 0, haut, prof, prof + 0.3, C.mur);                                // le mur du fond
        boite(p, c, -M / 2, M / 2, haut, haut + 0.3, -1, prof + 0.3, C.toit);                         // le toit, un peu en avant
      }),
      personne: fabriquer((p, c) => { boite(p, c, -0.22, 0.22, 0, 0.75, -0.14, 0.14, 0xffffff); boite(p, c, -0.13, 0.13, 0.78, 1.04, -0.13, 0.13, C.tete); }),
      personneLoin: fabriquer((p, c) => {   // une simple plaque (2 triangles, des deux côtés), tournée vers la piste
        const C2 = new THREE.Color(0xffffff);
        for (const q of [[-0.25, 0], [0.25, 0], [0.25, 1], [-0.25, 0], [0.25, 1], [-0.25, 1]]) { p.push(q[0], q[1], 0); c.push(C2.r, C2.g, C2.b); }
      }),
      batiment: fabriquer((p, c) => {
        const L = R.STANDS_MODULE, P = R.STANDS_PROFONDEUR, H = R.STANDS_HAUTEUR;
        boite(p, c, -L / 2, L / 2, 0, H, 0.2, P, C.batiment);
        boite(p, c, -L / 2, L / 2, H * 0.55, H * 0.8, -0.05, 0.2, C.vitres);                          // la bande vitrée de l'étage
        boite(p, c, -L / 2, L / 2, H, H + 0.4, -1.5, P, C.toit);                                       // l'auvent
      }),
      garage: fabriquer((p, c) => { boite(p, c, -R.STANDS_GARAGE / 2, R.STANDS_GARAGE / 2, 0, R.STANDS_GARAGE_HAUTEUR, -0.1, 0.15, 0xffffff); }),
      arbreA: fabriquer((p, c) => { prisme(p, c, 6, 0.3, 0.25, 0, 2.5, C.tronc, false); prisme(p, c, 8, 2.6, 0, 1.8, 9, C.sapin, false); }),
      arbreB: fabriquer((p, c) => { prisme(p, c, 6, 0.35, 0.3, 0, 3, C.tronc, false); prisme(p, c, 8, 1.6, 3, 2.5, 4.5, C.feuillu, true); prisme(p, c, 8, 3, 1.2, 4.5, 7.5, C.feuillu, true); }),
      arbreLoin: fabriquer((p, c) => { prisme(p, c, 4, 2.6, 0, 0, 8.5, C.sapin, false); }),
      panneau: fabriquer((p, c) => { boite(p, c, -R.PANNEAU_LONGUEUR / 2, R.PANNEAU_LONGUEUR / 2, 0.2, 0.2 + R.PANNEAU_HAUTEUR, 0, 0.15, 0xffffff); }),
      pneus: fabriquer((p, c) => {
        const r = R.PNEUS_PILE_RAYON, h = R.PNEUS_PILE_HAUTEUR;
        for (let k = 0; k < R.PNEUS_PILE_NOMBRE; k++) prisme(p, c, 6, r, r, k * h, (k + 1) * h, k % 2 ? 0xffffff : 0xdddddd, k === R.PNEUS_PILE_NOMBRE - 1);
      }),
    };
  }

  // la matrice d'un objet placé (colonnes : a × e, haut × e, b × e, position), écrite dans tableau à la place k
  function ecrireMatrice(tableau, k, o) {
    const e = o.e, m = k * 16;
    tableau[m] = o.ax * e; tableau[m + 1] = 0; tableau[m + 2] = o.az * e; tableau[m + 3] = 0;
    tableau[m + 4] = 0; tableau[m + 5] = e; tableau[m + 6] = 0; tableau[m + 7] = 0;
    tableau[m + 8] = o.bx * e; tableau[m + 9] = 0; tableau[m + 10] = o.bz * e; tableau[m + 11] = 0;
    tableau[m + 12] = o.x; tableau[m + 13] = o.y; tableau[m + 14] = o.z; tableau[m + 15] = 1;
  }

  function instances(geo, liste, nom, options) {
    const mat = new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true }, options));
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, liste.length));
    m.name = 'decor-' + nom;
    m.frustumCulled = false;   // (la sphère englobante d'un InstancedMesh est celle d'un seul objet : il serait coupé à tort)
    const C = new THREE.Color();
    liste.forEach((o, k) => { ecrireMatrice(m.instanceMatrix.array, k, o); if (o.couleur !== undefined) m.setColorAt(k, C.set(o.couleur)); });
    if (liste.some(o => o.couleur !== undefined)) { for (let k = liste.length; k < m.count; k++) m.setColorAt(k, C.set(0xffffff)); m.instanceColor.needsUpdate = true; }
    m.count = liste.length;
    m.visible = liste.length > 0;
    m.instanceMatrix.needsUpdate = true;
    return m;
  }

  // un groupe à niveaux de détail : les objets (de une ou plusieurs formes proches) et une forme lointaine commune
  function groupeDetail(listes, geosProches, geoLoin, nom, couleurs, optionsLoin) {
    const tous = [];
    listes.forEach((l, f) => l.forEach(o => tous.push({ o, f })));
    const proches = geosProches.map((g, f) => instances(g, listes[f], nom + '-proche-' + f));
    const loin = geoLoin ? instances(geoLoin, tous.map(t => t.o), nom + '-loin', optionsLoin) : null;   // (sans forme lointaine : rien au-delà de DECOR_DETAIL_LOIN)
    if (couleurs) {   // (les mêmes couleurs de près et de loin : l'instanceColor existe dès la construction)
      for (const p of proches) if (!p.instanceColor) p.setColorAt(0, new THREE.Color(0xffffff));
    }
    const mats = new Float32Array(tous.length * 16);
    tous.forEach((t, k) => ecrireMatrice(mats, k, t.o));
    const cols = new Float32Array(tous.length * 3), C = new THREE.Color();
    tous.forEach((t, k) => { C.set(t.o.couleur === undefined ? 0xffffff : t.o.couleur); cols[3 * k] = C.r; cols[3 * k + 1] = C.g; cols[3 * k + 2] = C.b; });
    return { tous, proches, loin, mats, cols, couleurs: !!couleurs, dernier: null, nbProches: 0, nbLoin: 0 };
  }

  function construire(c, description) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const { objets, refus } = placer(c, description);
    const F = formes(), groupe = new THREE.Group();
    groupe.name = 'decor';
    const rangs = R.TRIBUNE_RANGS;
    const fixes = [
      instances(F.tribune(rangs), objets.tribune, 'tribune'),
      instances(F.batiment, objets.batiment, 'batiment'),
      instances(F.garage, objets.garage, 'garage'),
      instances(F.panneau, objets.panneau, 'panneau'),
    ];
    const publicG = groupeDetail([objets.public], [F.personne], F.personneLoin, 'public', true, { side: THREE.DoubleSide });
    const arbres = groupeDetail([objets.arbreA, objets.arbreB], [F.arbreA, F.arbreB], F.arbreLoin, 'arbres', false);
    const pneus = groupeDetail([objets.pneus], [F.pneus], null, 'pneus', true);   // les piles de pneus : de près seulement (de loin, on ne les voit pas)
    for (const m of fixes) groupe.add(m);
    for (const g of [publicG, arbres, pneus]) { for (const m of g.proches) groupe.add(m); if (g.loin) groupe.add(g.loin); }
    const decor = { groupe, objets, refus, detail: [publicG, arbres, pneus], ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 };
    decor.triangles = 0;
    groupe.traverse(o => { if (o.isInstancedMesh) decor.triangles += o.geometry.attributes.position.count / 3 * o.count; });
    return decor;
  }

  // range chaque objet à niveaux de détail : proche (< DECOR_DETAIL_LOIN de la caméra la plus proche), loin (< DECOR_RIEN_LOIN), ou rien ;
  // refait seulement quand une caméra a bougé de DECOR_MAJ_DEPLACEMENT m
  function majDetail(decor, cameras) {
    if (!decor) return;
    for (const g of decor.detail) {
      const bouge = !g.dernier || g.dernier.length !== cameras.length || cameras.some((p, k) => Math.hypot(p.x - g.dernier[k].x, p.y - g.dernier[k].y, p.z - g.dernier[k].z) > R.DECOR_MAJ_DEPLACEMENT);
      if (!bouge) continue;
      g.dernier = cameras.map(p => ({ x: p.x, y: p.y, z: p.z }));
      const proche2 = R.DECOR_DETAIL_LOIN * R.DECOR_DETAIL_LOIN, rien2 = R.DECOR_RIEN_LOIN * R.DECOR_RIEN_LOIN;
      const n = g.proches.map(() => 0);
      let nl = 0;
      const ma = g.proches.map(m => m.instanceMatrix.array), la = g.loin ? g.loin.instanceMatrix.array : null;
      for (let k = 0; k < g.tous.length; k++) {
        const o = g.tous[k].o;
        let d2 = Infinity;
        for (const p of cameras) { const dx = o.x - p.x, dy = o.y - p.y, dz = o.z - p.z, q = dx * dx + dy * dy + dz * dz; if (q < d2) d2 = q; }
        if (d2 >= rien2 || (!g.loin && d2 >= proche2)) continue;
        const f = g.tous[k].f;
        const prochesM = d2 < proche2, cible = prochesM ? ma[f] : la, j = prochesM ? n[f]++ : nl++;
        for (let q = 0; q < 16; q++) cible[j * 16 + q] = g.mats[k * 16 + q];
        if (g.couleurs) {
          const ca = (prochesM ? g.proches[f] : g.loin).instanceColor.array;
          ca[j * 3] = g.cols[k * 3]; ca[j * 3 + 1] = g.cols[k * 3 + 1]; ca[j * 3 + 2] = g.cols[k * 3 + 2];
        }
      }
      g.proches.forEach((m, f) => { m.count = n[f]; m.visible = n[f] > 0; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      if (g.loin) { g.loin.count = nl; g.loin.visible = nl > 0; g.loin.instanceMatrix.needsUpdate = true; if (g.loin.instanceColor) g.loin.instanceColor.needsUpdate = true; }
      g.nbProches = n.reduce((a, b) => a + b, 0); g.nbLoin = nl;
    }
  }

  return { TYPES, placer, construire, majDetail, postesTele, zonePodium, verificateur, tirage };
})();
