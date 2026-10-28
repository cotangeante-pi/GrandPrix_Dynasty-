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
  const TYPES = ['tribune', 'public', 'stands', 'arbres', 'panneaux', 'pneus', 'immeubles', 'facades', 'eau', 'port', 'champs', 'collines', 'dunes', 'grandeRoue', 'hotel', 'projecteurs', 'banderoles'];

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
    if (typeof REGIE !== 'undefined') return REGIE.postes(c);   // (la réalisation télé : les vraies caméras)
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
    // travers (facultatif) : la demi-largeur de l'objet en travers de la piste (un long bâtiment qui la longe), au lieu de son rayon,
    // pour la piste et la voie des stands
    return function libre(cx, cz, rayon, travers) {
      if (travers === undefined) travers = rayon;
      if (demi + R.DECOR_MARGE + rayon >= G) return false;   // (un objet trop grand pour la grille : refusé, jamais posé sans vérification)
      let dmin = Infinity, imin = -1;
      const gi = Math.floor(cx / G), gj = Math.floor(cz / G);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const l = cases.get(cle(gi + a, gj + b));
        if (l) for (const i of l) { const dx = cx - c.x[i], dz = cz - c.z[i], d2 = dx * dx + dz * dz; if (d2 < dmin) { dmin = d2; imin = i; } }
      }
      if (imin >= 0 && Math.sqrt(dmin) - travers < demi + R.DECOR_MARGE) return false;
      if (imin < 0) { for (const q of eviter) if (Math.hypot(cx - q.x, cz - q.z) < q.rayon + rayon) return false; return true; }
      const d = (cx - c.x[imin]) * c.nx[imin] + (cz - c.z[imin]) * c.nz[imin];
      const zs = typeof zoneStands === 'function' ? zoneStands(c, c.s[imin], d) : null;
      if (zs && d * zs.cote > 0 && d * zs.cote - travers < zs.dExt + R.DECOR_MARGE_STANDS) return false;
      for (const q of eviter) if (Math.hypot(cx - q.x, cz - q.z) < q.rayon + rayon) return false;
      return true;
    };
  }

  // le placement : { tribune, public, batiment, garage, arbreA, arbreB, panneau, pneus } (listes d'objets { x, y, z, ax, az, bx, bz, e,
  // couleur, cx, cz, rayon }), et ce qui a été refusé (une place qui n'était pas libre)
  // couleursDe(n) (facultatif) : les couleurs des n spectateurs (decor-public.js : le public à domicile), à la place des siennes
  function placer(c, description, graine, couleursDe) {
    const objets = { tribune: [], public: [], batiment: [], garage: [], arbreA: [], arbreB: [], panneau: [], pneus: [], immeuble: [], eau: [], bateau: [], champ: [], colline: [], grandeRoue: [], hotel: [], projecteur: [], banderole: [] };
    const libre = verificateur(c), rnd = tirage(graine === undefined ? R.DECOR_GRAINE : graine);
    const couleurPublic = couleursPublic(rnd);
    // la taille d'un spectateur, en vrais mètres (la forme fait 1 m de haut : l'échelle de l'objet est sa hauteur)
    const taille = h => h + (2 * rnd() - 1) * R.PUBLIC_HAUTEUR_ECART;
    let refus = 0, inconnus = 0, entree = 0;
    // les emprises déjà prises (tribunes, bâtiments, eau…), rangées dans une grille de DECOR_CASE m : deux objets de deux lignes
    // différentes de la description ne se recouvrent pas (ceux d'une même ligne, oui : les modules d'une tribune se touchent)
    const prises = new Map(), G = R.DECOR_CASE, cleP = (i, j) => i * 100003 + j;
    const occupe = (o) => { const k = cleP(Math.floor(o.cx / G), Math.floor(o.cz / G)); if (!prises.has(k)) prises.set(k, []); prises.get(k).push(o); };
    const recouvre = (cx, cz, rayon) => {
      const gi = Math.floor(cx / G), gj = Math.floor(cz / G), n = Math.ceil((rayon + R.DECOR_EMPRISE_MAX) / G);
      for (let a = -n; a <= n; a++) for (let b = -n; b <= n; b++) {
        const l = prises.get(cleP(gi + a, gj + b));
        if (l) for (const q of l) if (q.entree !== entree && Math.hypot(cx - q.cx, cz - q.cz) < rayon + q.rayon) return true;
      }
      return false;
    };
    // range un objet si sa place est libre (le centre de son emprise : (lc, pc) dans son repère, son rayon) ; solide : il prend sa place
    // (les objets suivants ne la recouvrent pas) ; sinon il vérifie seulement qu'il ne tombe pas sur un objet solide ; solide = 'barriere' :
    // un objet contre la barrière (panneau, pneus, banderole, mât), devant les tribunes : seulement loin de la piste
    const ranger = (liste, r, l, h, p, lc, pc, rayon, extra, solide) => {
      const o = poser(r, l, h, p, extra);
      o.cx = r.x + r.ax * lc + r.bx * pc; o.cz = r.z + r.az * lc + r.bz * pc; o.rayon = rayon; o.entree = entree;
      if (!libre(o.cx, o.cz, rayon, extra && extra.travers !== undefined ? extra.travers : undefined) || (solide !== 'barriere' && recouvre(o.cx, o.cz, rayon))) { refus++; return null; }
      liste.push(o);
      if (solide === true) occupe(o);
      return o;
    };
    const entre = (a) => a[0] + rnd() * (a[1] - a[0]);
    const nombreSurface = (e, surface, max) => Math.min(max, Math.round(e.longueur * (e.profondeur || 0) * (e.densite === undefined ? 1 : e.densite) / surface));
    const modules = (e, pas, f) => {
      const n = Math.max(1, Math.round(e.longueur / pas)), l = e.longueur / n;
      for (let k = 0; k < n; k++) f(e.s + (k + 0.5) * l, l, k, n);
    };
    for (const e of description) {
      entree++;
      const cote = e.cote < 0 ? -1 : 1, d = cote * e.distance;
      if (e.type === 'tribune') {
        // (echelle : la tribune plus haute et plus profonde, ou moins, selon le lieu ; les marches et le public suivent, pas les gens)
        const rangs = e.rangs || R.TRIBUNE_RANGS, f = e.echelle || 1, prof = rangs * R.TRIBUNE_MARCHE[0] * f;
        modules(e, R.TRIBUNE_MODULE, s => {
          const r = repere(c, s, d, cote);
          if (!ranger(objets.tribune, r, 0, 0, 0, 0, prof / 2, Math.hypot(R.TRIBUNE_MODULE / 2, prof / 2), f === 1 ? undefined : { ex: 1, ey: f, ez: f }, true)) return;
          // son public, assis sur les marches (une place sur DECOR_PUBLIC_REMPLI occupée)
          const n = Math.round(R.TRIBUNE_MODULE / R.PUBLIC_PAS);
          for (let g = 0; g < rangs; g++)
            for (let k = 0; k < n; k++) {
              if (rnd() > R.DECOR_PUBLIC_REMPLI) continue;
              objets.public.push(poser(r, -R.TRIBUNE_MODULE / 2 + (k + 0.5) * R.TRIBUNE_MODULE / n, (g + 1) * R.TRIBUNE_MARCHE[1] * f, (g + 0.5) * R.TRIBUNE_MARCHE[0] * f, { couleur: couleurPublic(), e: taille(R.PUBLIC_HAUTEUR_ASSIS) }));
            }
        });
      } else if (e.type === 'public') {
        // le public debout dans l'herbe, en quelques rangs, un peu en désordre
        const rangs = e.rangs || R.PUBLIC_RANGS;
        modules(e, R.PUBLIC_PAS, s => {
          const r = repere(c, s, d, cote);
          for (let g = 0; g < rangs; g++)
            ranger(objets.public, r, (rnd() - 0.5) * R.PUBLIC_PAS * 0.6, 0, g * R.PUBLIC_RANG + rnd() * 0.3, 0, g * R.PUBLIC_RANG, 0.5, { couleur: couleurPublic(), e: taille(R.PUBLIC_HAUTEUR_DEBOUT) });
        });
      } else if (e.type === 'stands') {
        // le bâtiment, en modules qui suivent la piste ; les garages sur sa façade, un par écurie, à ses couleurs, répartis sur la longueur
        // (hauteur, profondeur : celles de la description, sinon STANDS_HAUTEUR, STANDS_PROFONDEUR ; la forme est mise à l'échelle)
        const P = e.profondeur || R.STANDS_PROFONDEUR, H = e.hauteur || R.STANDS_HAUTEUR;
        modules(e, R.STANDS_MODULE, s => {
          const r = repere(c, s, d, cote);
          ranger(objets.batiment, r, 0, 0, 0, 0, P / 2, Math.hypot(R.STANDS_MODULE / 2, P / 2), { ex: 1, ey: H / R.STANDS_HAUTEUR, ez: P / R.STANDS_PROFONDEUR, travers: P / 2 }, true);
        });
        const [e0, e1] = e.ecuries || [0, R.ECURIES.length];   // les écuries de ce bâtiment (deux bâtiments de part et d'autre du podium : 5 et 5)
        const modulesIci = objets.batiment.filter(o => o.entree === entree);
        for (let k = e0; k < e1; k++) {
          const r = repere(c, e.s + (k - e0 + 0.5) * e.longueur / (e1 - e0), d, cote);
          if (!modulesIci.some(o => Math.hypot(o.x - r.x, o.z - r.z) < R.STANDS_MODULE * 0.6)) { refus++; continue; }   // (seulement sur la façade du bâtiment)
          ranger(objets.garage, r, 0, 0, 0, 0, 0, R.STANDS_GARAGE / 2, { couleur: R.ECURIES[k].couleur, travers: 0.3 });
        }
      } else if (e.type === 'arbres') {
        // nombre : donné, ou tiré de la surface (longueur × profondeur × densite / ARBRE_SURFACE) ; forme 'A' : des sapins seulement
        const nombre = e.nombre !== undefined ? e.nombre : nombreSurface(e, R.ARBRE_SURFACE, R.ARBRES_ZONE_MAX);
        for (let k = 0; k < nombre; k++) {
          const s = e.s + rnd() * e.longueur, p = rnd() * (e.profondeur || 0), r = repere(c, s, d, cote), taille = R.ARBRE_TAILLE[0] + rnd() * (R.ARBRE_TAILLE[1] - R.ARBRE_TAILLE[0]);
          const forme = e.forme === 'A' ? 0 : e.forme === 'B' ? 1 : rnd() < 0.5 ? 0 : 1;
          ranger(forme === 0 ? objets.arbreA : objets.arbreB, r, 0, 0, p, 0, p, R.ARBRE_RAYON * taille, { e: taille });
        }
      } else if (e.type === 'immeubles' || e.type === 'facades') {
        // des immeubles (des boîtes, une couleur chacun), en rangs au loin ; les façades : un seul rang continu, tout contre les rails
        const facade = e.type === 'facades', dens = e.densite === undefined ? 1 : e.densite;
        const hauteurs = e.hauteur || (facade ? R.FACADE_HAUTEUR : R.IMMEUBLE_HAUTEUR), couleurs = facade ? R.FACADE_COULEURS : R.IMMEUBLE_COULEURS;
        const rangs = facade ? 1 : Math.max(1, Math.floor((e.profondeur || R.IMMEUBLE_RANG) / R.IMMEUBLE_RANG));
        for (let s = e.s; s < e.s + e.longueur;) {
          const w = entre(facade ? R.FACADE_LARGEUR : R.IMMEUBLE_LARGEUR);
          for (let g = 0; g < rangs; g++) {
            const garde = rnd() <= dens, prof = entre(facade ? R.FACADE_PROFONDEUR : R.IMMEUBLE_PROFONDEUR), h = entre(hauteurs) + g * R.IMMEUBLE_RANG * (e.pente || 0), teinte = couleurs[Math.floor(rnd() * couleurs.length)];
            if (!garde) continue;
            const p = g * R.IMMEUBLE_RANG, r = repere(c, s + w / 2, d, cote);
            ranger(objets.immeuble, r, 0, 0, p, 0, p + prof / 2, Math.hypot(w / 2, prof / 2), { ex: w * R.IMMEUBLE_JOINT, ey: h, ez: prof, couleur: teinte }, true);
          }
          s += w;
        }
      } else if (e.type === 'eau' || e.type === 'port') {
        // l'eau : des dalles plates de EAU_CASE m ; le port : et des bateaux sur les premiers rangs, amarrés de travers ou le long du quai
        const T = R.EAU_CASE, rangs = Math.max(1, Math.round((e.profondeur || T) / T)), dens = e.densite === undefined ? 1 : e.densite;
        modules(e, T, s => {
          const r = repere(c, s, d, cote);
          for (let g = 0; g < rangs; g++) {
            const p = g * T, dalle = ranger(objets.eau, r, 0, R.EAU_HAUTEUR, p, 0, p + T / 2, T * 0.72, { ex: T * 1.04, ey: 1, ez: T * 1.04 }, true);
            if (!dalle || e.type !== 'port' || p >= R.PORT_BANDE || rnd() > dens * R.PORT_DENSITE) continue;
            const L = entre(R.BATEAU_LONGUEUR), travers = rnd() < R.BATEAU_TRAVERS, x = r.x + r.bx * (p + T / 2), z = r.z + r.bz * (p + T / 2);
            const o = travers ? { x, y: R.EAU_HAUTEUR, z, ax: r.bx, az: r.bz, bx: -r.ax, bz: -r.az } : { x, y: R.EAU_HAUTEUR, z, ax: r.ax, az: r.az, bx: r.bx, bz: r.bz };
            objets.bateau.push(Object.assign(o, { e: L, cx: x, cz: z, rayon: L / 2, entree, couleur: R.BATEAU_COULEURS[Math.floor(rnd() * R.BATEAU_COULEURS.length)] }));
          }
        });
      } else if (e.type === 'champs') {
        const T = R.CHAMP_CASE, rangs = Math.max(1, Math.round((e.profondeur || T) / T));
        modules(e, T, s => {
          const r = repere(c, s, d, cote);
          for (let g = 0; g < rangs; g++) ranger(objets.champ, r, 0, R.CHAMP_HAUTEUR, g * T, 0, g * T + T / 2, T * 0.72, { ex: T * 0.97, ey: 1, ez: T * 0.97, couleur: R.CHAMP_COULEURS[Math.floor(rnd() * R.CHAMP_COULEURS.length)] });
        });
      } else if (e.type === 'collines' || e.type === 'dunes') {
        const dune = e.type === 'dunes', n = nombreSurface(e, dune ? R.DUNE_SURFACE : R.COLLINE_SURFACE, R.COLLINES_ZONE_MAX);
        for (let k = 0; k < n; k++) {
          const rayon = entre(dune ? R.DUNE_RAYON : R.COLLINE_RAYON), s = e.s + rnd() * e.longueur, p = rayon + rnd() * Math.max(0, (e.profondeur || 0) - 2 * rayon), h = rayon * entre(dune ? R.DUNE_PENTE : R.COLLINE_PENTE);
          ranger(objets.colline, repere(c, s, d, cote), 0, 0, p, 0, p, rayon, { ex: rayon, ey: h, ez: rayon, couleur: dune ? R.DECOR_COULEURS.dune : R.DECOR_COULEURS.colline }, true);
        }
      } else if (e.type === 'grandeRoue' || e.type === 'hotel') {
        // un seul grand objet, au milieu de la zone (s'il y a la place)
        // (l'hôtel est long et étroit, posé le long de la piste : sa demi-largeur en travers, HOTEL_TRAVERS, compte pour la piste)
        const roue = e.type === 'grandeRoue', rayon = roue ? R.GRANDE_ROUE_EMPRISE : R.HOTEL_EMPRISE, travers = roue ? rayon : R.HOTEL_TRAVERS;
        const p = roue ? Math.min((e.profondeur || 0) / 2, rayon + R.DECOR_MARGE) : R.DECOR_MARGE_HOTEL, pc = roue ? p : p + travers;
        ranger(roue ? objets.grandeRoue : objets.hotel, repere(c, e.s + e.longueur / 2, d, cote), 0, 0, p, 0, pc, rayon, { travers }, true);
      } else if (e.type === 'projecteurs') {
        // les mâts d'éclairage de la course de nuit, des deux côtés, derrière la barrière
        modules(e, R.PROJECTEUR_PAS, (s, l, k) => {
          const r = repere(c, s, d * (k % 2 ? -1 : 1), k % 2 ? -cote : cote);
          ranger(objets.projecteur, r, 0, 0, 0, 0, 0, 1, undefined, 'barriere');
        });
      } else if (e.type === 'banderoles') {
        // les banderoles du Grand Prix à domicile (decor-public.js) : e.textes [{ texte, fond, lettres }], le long de la barrière
        (e.textes || []).forEach((b, k) => {
          const r = repere(c, e.s + k * R.BANDEROLE_PAS, d, cote);
          ranger(objets.banderole, r, 0, R.BANDEROLE_HAUTEUR, 0, 0, 0, R.BANDEROLE_LONGUEUR / 2, { indice: k, texte: b.texte, fond: b.fond, lettres: b.lettres }, 'barriere');
        });
      } else if (e.type === 'panneaux') {
        let n = 0;
        modules(e, R.PANNEAU_PAS, s => {
          const r = repere(c, s, d, cote);
          ranger(objets.panneau, r, 0, 0, 0, 0, 0, R.PANNEAU_LONGUEUR / 2, { couleur: R.DECOR_COULEURS_PANNEAUX[n++ % R.DECOR_COULEURS_PANNEAUX.length] }, 'barriere');
        });
      } else if (e.type === 'pneus') {
        let n = 0;
        modules(e, R.PNEUS_PILE_PAS, s => {
          const r = repere(c, s, d, cote);
          ranger(objets.pneus, r, 0, 0, R.PNEUS_PILE_RAYON, 0, R.PNEUS_PILE_RAYON, R.PNEUS_PILE_RAYON, { couleur: n++ % R.PNEUS_PILE_REPERE ? R.DECOR_COULEUR_PNEU : R.DECOR_COULEUR_PNEU_REPERE }, 'barriere');
        });
      } else inconnus++;
    }
    if (couleursDe) {
      const tir = couleursDe(objets.public.length);
      if (tir && tir.couleurs && tir.couleurs.length === objets.public.length) objets.public.forEach((o, k) => { o.couleur = tir.couleurs[k]; });
    }
    return { objets, refus, inconnus };
  }

  // la description d'un décor de decors-officiels.js (Codeur 3), en lignes pour placer : la tribune principale, les tribunes des
  // virages célèbres (avec des piles de pneus devant leur virage), le public debout, les stands, les zones de paysage, le paysage au
  // loin (horizon), les mâts d'éclairage la nuit, les panneaux le long de la ligne droite des stands, et les façades contre les rails
  // là où DECOR_FACADES le demande (Monoco) ; banderoles : celles de decor-public.js (le Grand Prix à domicile), ou rien
  function descriptionOfficielle(c, d, nom, banderoles) {
    const P = DECOR_PUBLIC.placer(c, d), liste = [], debut = o => o.s - o.longueur / 2, loin = o => Math.abs(o.d0), prof = o => Math.abs(o.d1) - Math.abs(o.d0);
    const barriere = c.largeur / 2 + R.DISTANCE_BARRIERE;
    const pneusDevant = o => ({ type: 'pneus', s: debut(o), longueur: Math.min(o.longueur, R.PNEUS_VIRAGE_LONGUEUR), cote: o.cote, distance: barriere - R.PNEUS_PILE_RAYON * 2 - 0.05 });
    // la hauteur des tribunes : leur profondeur dans decors-officiels.js (par rapport à TRIBUNE_PROFONDEUR_REF) × celle du lieu
    const echelle = o => Math.max(R.TRIBUNE_ECHELLE[0], Math.min(R.TRIBUNE_ECHELLE[1], prof(o) / R.TRIBUNE_PROFONDEUR_REF * (R.TRIBUNE_ECHELLE_LIEU[nom] || 1)));
    if (P.principale) liste.push({ type: 'tribune', s: debut(P.principale), longueur: P.principale.longueur, cote: P.principale.cote, distance: loin(P.principale), echelle: echelle(P.principale) });
    for (const o of P.tribunes) { liste.push({ type: 'tribune', s: debut(o), longueur: o.longueur, cote: o.cote, distance: loin(o), echelle: echelle(o) }); liste.push(pneusDevant(o)); }
    // une voie des stands courte (Montréol) : le bâtiment longe toute la voie, rampes comprises, pas seulement entre elles
    if (P.stands && c.stands && P.stands.longueur < R.STANDS_LONGUEUR_MIN) { P.stands.longueur = c.stands.longueur; P.stands.s = (c.stands.entree + c.stands.longueur / 2) % c.longueur; }
    for (const o of P.public) liste.push({ type: 'public', s: debut(o), longueur: o.longueur, cote: o.cote, distance: loin(o), rangs: Math.max(1, Math.min(R.PUBLIC_RANGS_MAX, Math.floor(prof(o) / R.PUBLIC_RANG))) });
    if (P.stands) liste.push({ type: 'stands', s: debut(P.stands), longueur: P.stands.longueur, cote: P.stands.cote, distance: loin(P.stands), profondeur: prof(P.stands), hauteur: P.stands.hauteur });
    for (const cote of [1, -1]) liste.push({ type: 'panneaux', s: -R.PANNEAUX_LIGNE, longueur: 2 * R.PANNEAUX_LIGNE, cote, distance: barriere + 0.3 });
    if (banderoles && banderoles.length) {
      const cote = P.principale ? P.principale.cote : 1;
      liste.push({ type: 'banderoles', s: -R.BANDEROLE_PAS * (banderoles.length - 1) / 2, longueur: 0, cote, distance: barriere + 0.4, textes: banderoles });
    }
    if (R.DECOR_FACADES[nom])
      for (const z of P.zones) if (z.type === 'immeubles') liste.push({ type: 'facades', s: debut(z), longueur: z.longueur, cote: z.cote, distance: barriere + R.FACADE_RETRAIT });
    const TYPE = { immeubles: 'immeubles', arbres: 'arbres', sapins: 'arbres', champs: 'champs', collines: 'collines', dunes: 'dunes', port: 'port', lac: 'eau', eau: 'eau', grandeRoue: 'grandeRoue', hotel: 'hotel' };
    for (const z of P.zones) {
      const e = { type: TYPE[z.type] || z.type, s: debut(z), longueur: z.longueur, cote: z.cote, distance: loin(z), profondeur: prof(z), densite: z.densite };
      if (z.type === 'sapins') e.forme = 'A';
      if (z.type === 'immeubles' && d.horizon === 'colline') e.pente = R.IMMEUBLE_PENTE_COLLINE;   // la ville en gradins (Monoco)
      liste.push(e);
    }
    if (d.lumiere && d.lumiere.projecteurs) liste.push({ type: 'projecteurs', s: 0, longueur: c.longueur, cote: 1, distance: barriere + R.PROJECTEUR_RECUL });
    return liste;
  }

  // le paysage au loin (horizon de decors-officiels.js : 'colline', 'ville', 'gratteCiel') : un anneau d'objets autour du circuit, à
  // HORIZON_RECUL m au-delà de son rayon (des collines, ou des immeubles), tiré avec le hasard du décor ; en objets placés, sans vérification
  // (ils sont loin de tout)
  function horizon(c, type, rnd) {
    if (!type) return { colline: [], immeuble: [] };
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < c.nb; i++) { xmin = Math.min(xmin, c.x[i]); xmax = Math.max(xmax, c.x[i]); zmin = Math.min(zmin, c.z[i]); zmax = Math.max(zmax, c.z[i]); }
    const cx = (xmin + xmax) / 2, cz = (zmin + zmax) / 2, rayon = Math.hypot(xmax - xmin, zmax - zmin) / 2 + R.HORIZON_RECUL, res = { colline: [], immeuble: [] };
    const entre = a => a[0] + rnd() * (a[1] - a[0]);
    for (let k = 0; k < R.HORIZON_NOMBRE; k++) {
      const a = 2 * Math.PI * (k + rnd() * 0.5) / R.HORIZON_NOMBRE, rr = rayon + rnd() * R.HORIZON_PROFONDEUR;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, ax = -Math.sin(a), az = Math.cos(a), bx = Math.cos(a), bz = Math.sin(a);
      if (type === 'colline') { const r = entre(R.HORIZON_COLLINE_RAYON); res.colline.push({ x, y: 0, z, ax, az, bx, bz, e: 1, ex: r, ey: r * entre(R.COLLINE_PENTE), ez: r, couleur: R.DECOR_COULEURS.colline }); }
      else {
        const h = entre(type === 'gratteCiel' ? R.HORIZON_TOURS : R.HORIZON_VILLE), w = entre(R.IMMEUBLE_LARGEUR) * 1.5;
        res.immeuble.push({ x, y: 0, z, ax, az, bx, bz, e: 1, ex: w, ey: h, ez: w, couleur: R.IMMEUBLE_COULEURS[Math.floor(rnd() * R.IMMEUBLE_COULEURS.length)] });
      }
    }
    return res;
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
  const fabriquer = (f, apres) => { const pos = [], col = []; f(pos, col); const g = geometrie(pos, col); if (apres) apres(g); return g; };

  // les fenêtres allumées (la nuit, et plus doucement au crépuscule et au couchant) : une couleur émissive sur les sommets marqués
  // lumiere = 1, par le matériau lui-même (pas une lumière par fenêtre, pas d'appel de dessin en plus)
  function allumerFenetres(materiau, couleur, force) {
    if (!force) return;
    const f = new THREE.Color(couleur).multiplyScalar(force);
    materiau.onBeforeCompile = sh => {
      sh.uniforms.fenetres = { value: f };
      sh.vertexShader = 'attribute float lumiere;\nvarying float vLumiere;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLumiere = lumiere;');
      sh.fragmentShader = 'uniform vec3 fenetres;\nvarying float vLumiere;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vLumiere * fenetres;');
    };
    materiau.customProgramCacheKey = () => 'fenetres';
  }
  // la force de la nuit d'un lieu : 1 la nuit, NUIT_SOIR au crépuscule et au couchant, 0 le jour
  const nuitDe = lieu => !lieu ? 0 : lieu.ciel.heure === 'nuit' ? 1 : lieu.ciel.heure === 'crepuscule' || lieu.ciel.heure === 'couchant' ? R.NUIT_SOIR : 0;

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
      // une personne de 1 m de haut (l'objet est mis à la taille du spectateur par son échelle) : le corps, puis la tête
      personne: fabriquer((p, c) => { boite(p, c, -0.13, 0.13, 0, 0.8, -0.08, 0.08, 0xffffff); boite(p, c, -0.07, 0.07, 0.83, 1, -0.07, 0.07, C.tete); }),
      personneLoin: fabriquer((p, c) => {   // une simple plaque (2 triangles, des deux côtés), tournée vers la piste
        const C2 = new THREE.Color(0xffffff);
        for (const q of [[-0.14, 0], [0.14, 0], [0.14, 1], [-0.14, 0], [0.14, 1], [-0.14, 1]]) { p.push(q[0], q[1], 0); c.push(C2.r, C2.g, C2.b); }
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
      // un immeuble de 1 m de côté (mis à l'échelle par son instance) : les murs, des bandes de fenêtres, le toit plus sombre
      immeuble: fabriquer((p, c) => {
        boite(p, c, -0.5, 0.5, 0, 1, 0, 1, 0xffffff);
        for (let k = 0; k < R.IMMEUBLE_BANDES; k++) { const y = (k + 0.6) / (R.IMMEUBLE_BANDES + 0.4); boite(p, c, -0.46, 0.46, y, y + 0.35 / (R.IMMEUBLE_BANDES + 0.4), -0.01, 1.01, C.fenetres); }
        boite(p, c, -0.5, 0.5, 1, 1.02, 0, 1, C.toitImmeuble);
      }, g => {   // (l'attribut lumiere : 1 sur les fenêtres, allumées la nuit par le matériau)
        const n = g.attributes.position.count, l = new Float32Array(n);
        for (let k = 36; k < 36 + 36 * R.IMMEUBLE_BANDES; k++) l[k] = 1;
        g.setAttribute('lumiere', new THREE.BufferAttribute(l, 1));
      }),
      // une dalle d'eau (1 m de côté, de 0 à 1 au loin), un champ, pareil
      dalle: fabriquer((p, c) => { const C2 = new THREE.Color(0xffffff); for (const q of [[-0.5, 0], [-0.5, 1], [0.5, 1], [-0.5, 0], [0.5, 1], [0.5, 0]]) { p.push(q[0], 0, q[1]); c.push(C2.r, C2.g, C2.b); } }),
      // un bateau de 1 m de long (mis à sa longueur par son instance) : la coque, le pont, la cabine
      bateau: fabriquer((p, c) => {
        boite(p, c, -0.5, 0.42, -0.02, 0.08, -0.13, 0.13, 0xffffff);
        boite(p, c, -0.46, 0.38, 0.08, 0.09, -0.12, 0.12, C.pont); boite(p, c, -0.3, 0.1, 0.09, 0.17, -0.09, 0.09, C.cabine); boite(p, c, -0.22, 0.02, 0.17, 0.22, -0.07, 0.07, C.cabine);
      }),
      // une colline (un cône bas à 10 côtés, de 1 m de rayon et de haut)
      colline: fabriquer((p, c) => { prisme(p, c, 10, 1, 0, 0, 1, 0xffffff, false); }),
      // la grande roue (Yas Marino… ou ailleurs) : la roue, ses rayons, ses cabines et ses deux pieds
      grandeRoue: fabriquer((p, c) => {
        const r = R.GRANDE_ROUE_RAYON, h = r + 4, n = 24;
        for (let k = 0; k < n; k++) {
          const a = 2 * Math.PI * k / n, x = Math.cos(a) * r, y = h + Math.sin(a) * r;
          boite(p, c, x - 1.2, x + 1.2, y - 1.2, y + 1.2, -0.3, 0.3, C.roue);
          boite(p, c, x - 0.9, x + 0.9, y - 2.6, y - 1.0, -1, 1, C.cabineRoue);
          for (let q = 1; q < 4; q++) { const t = q / 4; boite(p, c, x * t - 0.2, x * t + 0.2, h + (y - h) * t - 0.2, h + (y - h) * t + 0.2, -0.15, 0.15, C.roue); }
        }
        for (const sx of [-1, 1]) for (let q = 0; q < 6; q++) { const t = q / 6; boite(p, c, sx * (r * 0.45) * (1 - t) - 0.5, sx * (r * 0.45) * (1 - t) + 0.5, t * h, (t + 1 / 6) * h, -1.5 + t, 1.5 - t, C.roue); }
      }),
      // l'hôtel au-dessus de la piste (Yas Marino) : deux tours basses et la grande résille du toit
      hotel: fabriquer((p, c) => {
        const L = R.HOTEL_LONGUEUR;
        boite(p, c, -L / 2, -L / 2 + L * 0.42, 0, 22, 0, 22, C.batiment); boite(p, c, L / 2 - L * 0.42, L / 2, 0, 22, 0, 22, C.batiment);
        for (let k = 0; k < 14; k++) { const x = -L / 2 + (k + 0.5) * L / 14, y = 26 + 4 * Math.sin(k / 13 * Math.PI); boite(p, c, x - L / 30, x + L / 30, 22, y, -2, 24, k % 2 ? C.resille : C.vitres); }
      }),
      // un mât d'éclairage (la nuit) : le mât, la rampe ; la tête allumée est un autre maillage (sans ombre ni lumière, toujours claire)
      mat: fabriquer((p, c) => { boite(p, c, -0.25, 0.25, 0, R.PROJECTEUR_HAUTEUR, -0.25, 0.25, C.mur); boite(p, c, -2.2, 2.2, R.PROJECTEUR_HAUTEUR - 0.2, R.PROJECTEUR_HAUTEUR + 0.2, -0.6, 0.2, C.mur); }),
      lampe: fabriquer((p, c) => { boite(p, c, -2, 2, R.PROJECTEUR_HAUTEUR + 0.2, R.PROJECTEUR_HAUTEUR + 1.1, -0.9, -0.5, 0xffffff); }),
      // un poste de caméra de télé, 1 m de haut (mis à la hauteur du poste par son instance) : le mât, la plateforme, la caméra
      camera: fabriquer((p, c) => {
        boite(p, c, -0.12, 0.12, 0, 0.96, -0.12, 0.12, C.mur);
        boite(p, c, -0.6, 0.6, 0.96, 0.975, -0.6, 0.6, C.mur);
        boite(p, c, -0.25, 0.25, 0.975, 1.03, -0.4, 0.4, 0x1c1f24);
      }),
      pneus: fabriquer((p, c) => {
        const r = R.PNEUS_PILE_RAYON, h = R.PNEUS_PILE_HAUTEUR;
        for (let k = 0; k < R.PNEUS_PILE_NOMBRE; k++) prisme(p, c, 6, r, r, k * h, (k + 1) * h, k % 2 ? 0xffffff : 0xdddddd, k === R.PNEUS_PILE_NOMBRE - 1);
      }),
    };
  }

  // la matrice d'un objet placé (colonnes : a × e, haut × e, b × e, position), écrite dans tableau à la place k
  // (ex, ey, ez : une échelle différente le long, en hauteur et au loin, sinon e partout)
  function ecrireMatrice(tableau, k, o) {
    const ex = o.ex === undefined ? o.e : o.ex, ey = o.ey === undefined ? o.e : o.ey, ez = o.ez === undefined ? o.e : o.ez, m = k * 16;
    tableau[m] = o.ax * ex; tableau[m + 1] = 0; tableau[m + 2] = o.az * ex; tableau[m + 3] = 0;
    tableau[m + 4] = 0; tableau[m + 5] = ey; tableau[m + 6] = 0; tableau[m + 7] = 0;
    tableau[m + 8] = o.bx * ez; tableau[m + 9] = 0; tableau[m + 10] = o.bz * ez; tableau[m + 11] = 0;
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

  // gp (facultatif) : { championnat, circuit } du Grand Prix, pour le public de decor-public.js (DECOR_PUBLIC.pourGrandPrix : les
  // couleurs des écuries, et au Grand Prix à domicile celles du pays du joueur) ; sans decor-public.js, les couleurs de placer
  // lieu (facultatif) : un décor de decors-officiels.js (le ciel, les nuages, le paysage au loin) ; sans lui, le ciel de la page
  function construire(c, description, gp, lieu) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const couleursDe = typeof DECOR_PUBLIC !== 'undefined' ? n => DECOR_PUBLIC.pourGrandPrix(gp ? gp.championnat : null, gp ? gp.circuit : null, n) : null;
    const { objets, refus } = placer(c, description, undefined, couleursDe);
    if (lieu) {   // le paysage au loin : de plus des collines ou des immeubles
      const h = horizon(c, lieu.horizon, tirage(R.DECOR_GRAINE + 1));
      objets.colline.push(...h.colline); objets.immeuble.push(...h.immeuble);
    }
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
    const C = R.DECOR_COULEURS;
    const immeubles = instances(F.immeuble, objets.immeuble, 'immeuble');
    allumerFenetres(immeubles.material, R.FENETRES_NUIT, nuitDe(lieu));
    fixes.push(
      immeubles,
      instances(F.dalle, objets.eau, 'eau', { vertexColors: false, color: lieu && lieu.eau ? lieu.eau : C.eau }),
      instances(F.bateau, objets.bateau, 'bateau'),
      instances(F.dalle, objets.champ, 'champ'),
      instances(F.colline, objets.colline, 'colline', { flatShading: true }),
      instances(F.grandeRoue, objets.grandeRoue, 'grandeRoue'),
      instances(F.hotel, objets.hotel, 'hotel'),
      instances(F.mat, objets.projecteur, 'mat'));
    // les têtes des mâts : allumées (un matériau sans lumière, qui ne prend pas le brouillard)
    const lampes = instances(F.lampe, objets.projecteur, 'lampe');
    lampes.material = new THREE.MeshBasicMaterial({ color: C.lampe, fog: false });
    fixes.push(lampes);
    // les caméras de la télé (regie.js) : un mât et sa caméra à chaque poste, tous en un appel de dessin
    if (typeof REGIE !== 'undefined') {
      const cams = REGIE.postes(c).map(q => ({ x: q.x, y: 0, z: q.z, ax: 1, az: 0, bx: 0, bz: 1, e: 1, ey: q.y }));
      fixes.push(instances(F.camera, cams, 'cameras-tele'));
    }
    const banderoles = construireBanderoles(objets.banderole);
    if (banderoles) fixes.push(banderoles);
    if (lieu) for (const m of ciel(c, lieu)) fixes.push(m);
    for (const m of fixes) groupe.add(m);
    for (const g of [publicG, arbres, pneus]) { for (const m of g.proches) groupe.add(m); if (g.loin) groupe.add(g.loin); }
    const decor = { groupe, objets, refus, detail: [publicG, arbres, pneus], lieu: lieu || null, ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 };
    decor.triangles = 0;
    groupe.traverse(o => { if (o.isInstancedMesh) decor.triangles += o.geometry.attributes.position.count / 3 * o.count; });
    return decor;
  }

  // le ciel d'un lieu : une grande coupole (dégradé de ciel.haut en haut à ciel.horizon à l'horizon, sans brouillard) et des nuages
  // (ciel.nuages de 0 à 1 : jusqu'à NUAGES_MAX), centrés sur le circuit ; deux appels de dessin au plus
  function ciel(c, lieu) {
    const res = [], haut = new THREE.Color(lieu.ciel.haut), bas = new THREE.Color(lieu.ciel.horizon);
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < c.nb; i++) { xmin = Math.min(xmin, c.x[i]); xmax = Math.max(xmax, c.x[i]); zmin = Math.min(zmin, c.z[i]); zmax = Math.max(zmax, c.z[i]); }
    const cx = (xmin + xmax) / 2, cz = (zmin + zmax) / 2;
    const g = new THREE.SphereGeometry(R.CIEL_RAYON, 24, 12), pos = g.attributes.position, col = [];
    for (let k = 0; k < pos.count; k++) { const t = Math.max(0, pos.getY(k) / R.CIEL_RAYON), q = Math.sqrt(t); const m = bas.clone().lerp(haut, q); col.push(m.r, m.g, m.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const coupole = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    coupole.position.set(cx, 0, cz); coupole.name = 'decor-ciel'; coupole.renderOrder = -1; coupole.frustumCulled = false;
    res.push(coupole);
    const n = Math.round((lieu.ciel.nuages || 0) * R.NUAGES_MAX);
    if (n > 0) {
      const rnd = tirage(R.DECOR_GRAINE + 2), nuages = [];
      for (let k = 0; k < n; k++) {
        const a = rnd() * 2 * Math.PI, r = rnd() * R.NUAGES_ETENDUE, l = 120 + rnd() * 260;
        nuages.push({ x: cx + Math.cos(a) * r, y: R.NUAGES_HAUTEUR[0] + rnd() * (R.NUAGES_HAUTEUR[1] - R.NUAGES_HAUTEUR[0]), z: cz + Math.sin(a) * r, ax: 1, az: 0, bx: 0, bz: 1, e: 1, ex: l, ey: l * 0.18, ez: l * 0.55 });
      }
      // (sans lumière : ni le sol ni le ciel ne les teintent ; blancs, gris par temps couvert, sombres la nuit et plus chauds au couchant)
      const h = lieu.ciel.heure, couleur = new THREE.Color(h === 'nuageux' || h === 'brume' ? C_NUAGE_GRIS : 0xffffff).multiplyScalar(1 - (1 - R.NUAGES_NUIT) * nuitDe(lieu));
      const m = instances(new THREE.IcosahedronGeometry(1, 1), nuages, 'nuages', { vertexColors: false, fog: false, transparent: true, opacity: R.NUAGES_OPACITE });
      m.material = new THREE.MeshBasicMaterial({ color: couleur, fog: false, transparent: true, opacity: R.NUAGES_OPACITE });
      res.push(m);
    }
    return res;
  }
  const C_NUAGE_GRIS = 0xd8dde3;

  // les banderoles du Grand Prix à domicile : leurs textes dessinés une fois dans une texture (une ligne par banderole), des plaques
  // tournées vers la piste, un seul maillage (un appel de dessin) ; null s'il n'y en a pas
  function construireBanderoles(liste) {
    if (!liste.length || typeof document === 'undefined') return null;
    const H = 64, W = 512, toile = document.createElement('canvas');
    toile.width = W; toile.height = H * liste.length;
    const ctx = toile.getContext('2d');
    liste.forEach((b, k) => {
      ctx.fillStyle = '#' + new THREE.Color(b.fond).getHexString(); ctx.fillRect(0, k * H, W, H);
      ctx.fillStyle = '#' + new THREE.Color(b.lettres).getHexString(); ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.texte, W / 2, k * H + H / 2, W - 20);
    });
    const tex = new THREE.CanvasTexture(toile);
    const pos = [], uv = [], L = R.BANDEROLE_LONGUEUR / 2, Hb = R.BANDEROLE_HAUTEUR_PLAQUE;
    liste.forEach((b, k) => {
      // (la plaque regarde la piste : vers −b ; de gauche à droite vue de la piste, x va de +a à −a... on suit a, la face vers −b)
      const p = (l, h) => [b.x + b.ax * l, b.y + h, b.z + b.az * l];
      const v0 = 1 - (k + 1) / liste.length, v1 = 1 - k / liste.length;
      const A = p(-L, 0), B = p(L, 0), Cc = p(L, Hb), D = p(-L, Hb);
      pos.push(...A, ...Cc, ...B, ...A, ...D, ...Cc);
      uv.push(1, v0, 0, v1, 0, v0, 1, v0, 1, v1, 0, v1);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    m.name = 'decor-banderoles'; m.frustumCulled = false;
    return m;
  }

  // le décor d'un circuit : { description, lieu } ; le circuit test : DECORS.test (sans lieu) ; un circuit officiel : son décor de
  // decors-officiels.js (avec son lieu, et les banderoles si c'est le Grand Prix à domicile du joueur) ; null sinon
  function pour(c, nom, gp) {
    if (typeof DECORS !== 'undefined' && DECORS[nom]) return { description: DECORS[nom], lieu: null };
    if (typeof DECORS_OFFICIELS === 'undefined' || !DECORS_OFFICIELS[nom] || typeof DECOR_PUBLIC === 'undefined') return null;
    const d = DECORS_OFFICIELS[nom], pub = DECOR_PUBLIC.pourGrandPrix(gp ? gp.championnat : null, nom, 0);
    return { description: descriptionOfficielle(c, d, nom, pub.banderoles), lieu: d };
  }

  // le relief du pont (Suzuko, le seul croisement : croisement = [s1, s2] dans circuits-officiels-a.js) : la hauteur de la route à
  // chaque échantillon, PONT_HAUTEUR m sur PONT_PLAT m de part et d'autre de s1 (le passage du dessus), puis une rampe en cosinus sur
  // PONT_RAMPE m ; 0 ailleurs (le second passage, s2, passe dessous) ; null sans croisement. Seulement l'affichage : la physique reste plate
  function relief(c, croisement) {
    if (!croisement) return null;
    const r = new Float32Array(c.nb), L = c.longueur, s1 = croisement[0];
    for (let i = 0; i < c.nb; i++) {
      const ds = Math.abs(((c.s[i] - s1) % L + L * 1.5) % L - L / 2);
      r[i] = ds <= R.PONT_PLAT ? R.PONT_HAUTEUR : ds < R.PONT_PLAT + R.PONT_RAMPE ? R.PONT_HAUTEUR * (0.5 + 0.5 * Math.cos(Math.PI * (ds - R.PONT_PLAT) / R.PONT_RAMPE)) : 0;
    }
    return r;
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
      // (seulement ce qui sert est envoyé à la carte graphique : updateRange, pas tout le tableau à chaque tri)
      const envoyer = (m, k) => { m.count = k; m.visible = k > 0; m.instanceMatrix.updateRange.offset = 0; m.instanceMatrix.updateRange.count = k * 16; m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) { m.instanceColor.updateRange.offset = 0; m.instanceColor.updateRange.count = k * 3; m.instanceColor.needsUpdate = true; } };
      g.proches.forEach((m, f) => envoyer(m, n[f]));
      if (g.loin) envoyer(g.loin, nl);
      g.nbProches = n.reduce((a, b) => a + b, 0); g.nbLoin = nl;
    }
  }

  return { nuitDe, TYPES, placer, construire, majDetail, postesTele, zonePodium, verificateur, tirage, pour, descriptionOfficielle, relief };
})();
