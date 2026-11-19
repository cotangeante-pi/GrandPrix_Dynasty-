// La route réaliste (tour 60, Codeur 2 ; REALISME_ROUTE dans donnees.js, FAUX = la route d'avant au pixel près). Elle ne change que le
// dessin, jamais la course. Le principe (le même que les voitures, voiture3d.js) : tout est calculé UNE fois au chargement, puis dessiné
// par des shaders bon marché en une passe, sans objet de plus :
// - une petite texture faite par le code (ROUTE_GRAIN_TAILLE², 64 Ko) : le grain de l'asphalte (rouge), des taches douces (vert), des
//   stries (bleu) ; répétée sur la route, l'herbe et les bas-côtés ;
// - la ligne idéale (lissage élastique de la ligne du milieu, calcul pur, sans rapport avec les IA) et les freinages (la vitesse de passage
//   estimée des virages, puis la décélération en remontant la piste), rangés dans un attribut des sommets de la route : la trajectoire
//   plus sombre (la gomme), les traces de freinage avant les virages, les bords plus clairs (poussière) ;
// - les bas-côtés (dans le maillage de la route : aucun appel de dessin de plus) : l'herbe usée et la terre près du bord, les bacs à gravier à l'extérieur des virages serrés,
//   fondus dans l'herbe du sol, qui a le même grain (même calcul, mêmes coordonnées du monde : aucune couture) ;
// - la pluie (meteo3d.js) : la route plus sombre et qui reflète le ciel (Fresnel), la trajectoire plus sèche dans le shader ;
// - l'Auto (qualite.js, pas « reflets ») : le détail coupé par un uniform (aucun shader refait).
const ROUTE3D = (function () {
  const R = REGLAGES;
  let grain = null;
  const U = {};   // les uniformes partagés par la route, l'herbe et les bas-côtés

  // --- calcul pur (testé sans écran) ---
  // la ligne idéale : chaque point va vers le milieu de ses voisins (à k échantillons), borné à la piste moins ROUTE_LIGNE_MARGE ; du plus
  // large au plus fin (ROUTE_LIGNE_PASSES) ; renvoie l'écart d (m, > 0 = à droite) à chaque échantillon
  function ligneIdeale(c) {
    const n = c.nb, lim = Math.max(0, c.largeur / 2 - R.ROUTE_LIGNE_MARGE);
    let d = new Float64Array(n), e = new Float64Array(n);
    for (const [k, passes] of R.ROUTE_LIGNE_PASSES) for (let p = 0; p < passes; p++) {
      for (let i = 0; i < n; i++) {
        const a = (i - k + n) % n, b = (i + k) % n;
        const mx = (c.x[a] + c.nx[a] * d[a] + c.x[b] + c.nx[b] * d[b]) / 2, mz = (c.z[a] + c.nz[a] * d[a] + c.z[b] + c.nz[b] * d[b]) / 2;
        const v = (mx - c.x[i]) * c.nx[i] + (mz - c.z[i]) * c.nz[i];
        e[i] = v < -lim ? -lim : v > lim ? lim : v;
      }
      const t = d; d = e; e = t;
    }
    return d;
  }

  // les freinages : 0 (rien) à 1 (traces pleines) à chaque échantillon ; la vitesse de passage sur la ligne (adhérence latérale), puis en
  // remontant la piste, la vitesse qu'on peut avoir avant un virage en freinant (ROUTE_FREIN[3] m/s²) ; l'écart est le freinage
  function freinages(c, ligne) {
    const n = c.nb, vmax = new Float64Array(n), v = new Float64Array(n), f = new Float32Array(n), D = R.ROUTE_FREIN[3], plein = R.ROUTE_FREIN[4];
    const px = i => c.x[i] + c.nx[i] * ligne[i], pz = i => c.z[i] + c.nz[i] * ligne[i];
    let imin = 0;
    for (let i = 0; i < n; i++) {
      const a = (i - 3 + n) % n, b = (i + 3) % n;
      const ax = px(i) - px(a), az = pz(i) - pz(a), bx = px(b) - px(i), bz = pz(b) - pz(i);
      let ang = Math.atan2(bz, bx) - Math.atan2(az, ax);
      if (ang > Math.PI) ang -= 2 * Math.PI; if (ang < -Math.PI) ang += 2 * Math.PI;
      const k = Math.abs(ang) / Math.max(0.5, (Math.hypot(ax, az) + Math.hypot(bx, bz)) / 2);
      vmax[i] = Math.min(R.ROUTE_VITESSE_MAX, Math.sqrt(R.ROUTE_ADHERENCE_LAT / Math.max(k, 1e-6)));
      if (vmax[i] < vmax[imin]) imin = i;
    }
    // (deux tours en remontant, depuis le virage le plus lent : la boucle se referme)
    v[imin] = vmax[imin];
    for (let t = 1; t < 2 * n; t++) {
      const i = ((imin - t) % n + n) % n, k = (i + 1) % n;
      v[i] = Math.min(vmax[i], Math.sqrt(v[k] * v[k] + 2 * D * c.pas));
    }
    for (let i = 0; i < n; i++) { const x = (vmax[i] - v[i]) / plein; f[i] = x <= 0 ? 0 : x >= 1 ? 1 : x; }
    return f;
  }

  // les bacs à gravier : à chaque échantillon, la part de gravier (0 à 1) et son côté (-1 gauche, 1 droite : l'extérieur du virage) ; la
  // courbure moyenne sur ±12 échantillons, puis le bac s'étend un peu après la sortie (12 échantillons)
  function graviers(c) {
    const n = c.nb, ks = new Float64Array(n), g = new Float32Array(n), cote = new Int8Array(n), seuil = R.GRAVIER[1];
    for (let i = 0; i < n; i++) { let s = 0; for (let j = -12; j <= 12; j++) s += c.courbure[(i + j + n) % n]; ks[i] = s / 25; }
    for (let i = 0; i < n; i++) {
      let best = 0, signe = 1;
      for (let j = 0; j <= 12; j++) { const k = ks[(i - j + n) % n], x = (Math.abs(k) - seuil) / seuil; if (x > best) { best = x; signe = k > 0 ? -1 : 1; } }
      g[i] = best >= 1 ? 1 : best; cote[i] = signe;
    }
    return { g, cote };
  }

  // la petite texture : rouge le grain fin (bruit répétable sur deux échelles et un peu de bruit blanc), vert des taches douces, bleu des
  // stries (étirées le long de la piste) ; un hasard à elle (un hachage), jamais hasard()
  function texture() {
    if (grain) return grain;
    const T = R.ROUTE_GRAIN_TAILLE, cv = document.createElement('canvas'); cv.width = cv.height = T;
    const x = cv.getContext('2d'), img = x.createImageData(T, T), d = img.data;
    const h = (i, j, s) => { let k = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; k = (k ^ (k >>> 13)) * 1274126177 | 0; return ((k ^ (k >>> 16)) >>> 0) / 4294967296; };
    // un bruit de valeur répétable : une grille de g × g cases sur la texture
    const bruit = (i, j, g, s) => {
      const fx = i * g / T, fy = j * g / T, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const lis = t => t * t * (3 - 2 * t), a = h(x0 % g, y0 % g, s), b = h((x0 + 1) % g, y0 % g, s), c = h(x0 % g, (y0 + 1) % g, s), e = h((x0 + 1) % g, (y0 + 1) % g, s);
      const u = lis(tx), v = lis(ty);
      return (a + (b - a) * u) * (1 - v) + (c + (e - c) * u) * v;
    };
    for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
      const r = 0.45 * bruit(i, j, 32, 1) + 0.25 * bruit(i, j, 64, 2) + 0.3 * h(i, j, 3);
      const g = 0.6 * bruit(i, j, 4, 4) + 0.3 * bruit(i, j, 8, 5) + 0.1 * bruit(i, j, 16, 6);
      const b = 0.55 * h(i, 0, 7) + 0.45 * bruit(i, j, 8, 8);   // (une valeur par colonne : des stries le long de y, comme les rainures d'une trace de pneu)
      const o = 4 * (j * T + i); d[o] = Math.round(255 * r); d[o + 1] = Math.round(255 * g); d[o + 2] = Math.round(255 * b); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    grain = new THREE.CanvasTexture(cv);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.anisotropy = R.ROUTE_GRAIN_ANISOTROPIE;   // (Three.js le borne à ce que la carte graphique permet)   // (une donnée, pas une couleur : pas de conversion sRGB)
    return grain;
  }

  // --- les shaders (des ajouts au Lambert de Three.js : la lumière, le brouillard, la nuit restent ceux de la scène) ---
  const HERBE_GLSL = `
uniform sampler2D uGrain;
uniform vec4 uHerbe;
varying vec2 vMonde;
float herbe( vec2 p ) {
  return 1.0 + ( texture2D( uGrain, p / uHerbe.x ).g - 0.5 ) * uHerbe.z + ( texture2D( uGrain, p / uHerbe.y ).r - 0.5 ) * uHerbe.w;
}`;
  function uniformes() {
    if (U.uGrain) return U;
    const c = (n) => new THREE.Color(n);
    Object.assign(U, {
      uGrain: { value: texture() }, uDetail: { value: 1 },
      uHerbe: { value: new THREE.Vector4(R.HERBE_REPETE[0], R.HERBE_REPETE[1], R.HERBE_FORCE[0], R.HERBE_FORCE[1]) },
      uRep: { value: new THREE.Vector2(R.ROUTE_GRAIN_REPETE[0], R.ROUTE_GRAIN_REPETE[1]) }, uForce: { value: new THREE.Vector2(R.ROUTE_GRAIN_FORCE[0], R.ROUTE_GRAIN_FORCE[1]) },
      uGomme: { value: new THREE.Vector3(...R.ROUTE_GOMME) }, uFrein: { value: new THREE.Vector3(...R.ROUTE_FREIN.slice(0, 3)) }, uBord: { value: new THREE.Vector3(R.ROUTE_BORD_SALE[0], R.ROUTE_BORD_SALE[1], 0) },
      uEau: { value: new THREE.Vector2(0, 0) }, uCiel: { value: c(R.COULEUR_CIEL) }, uMouille: { value: new THREE.Vector3(...R.ROUTE_MOUILLEE) },
      uSol: { value: c(R.COULEUR_SOL) }, uTerre: { value: c(R.BAS_COTE_TERRE) }, uGravier: { value: c(R.GRAVIER[2]) }, uBas: { value: new THREE.Vector2(R.BAS_COTE[1], 0) },
    });
    return U;
  }
  // un Lambert et ses ajouts : sorte 'route' (la route et les bas-côtés) ou 'herbe'
  function materiau(sorte, options) {
    const m = new THREE.MeshLambertMaterial(options || {});
    const u = uniformes();
    m.onBeforeCompile = sh => {
      for (const k in u) sh.uniforms[k] = u[k];
      const attr = sorte === 'herbe' ? '' : 'attribute vec4 aRoute;\nvarying vec4 vRoute;\n';
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vMonde;\n' + attr)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMonde = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;' + (attr ? '\n  vRoute = aRoute;' : ''));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + HERBE_GLSL + `
uniform float uDetail;
uniform vec2 uRep, uForce, uEau, uBas;
uniform vec3 uGomme, uFrein, uBord, uCiel, uMouille, uSol, uTerre, uGravier;
` + (attr ? 'varying vec4 vRoute;\n' : ''))
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + (sorte === 'route' ? ROUTE_GLSL + BAS_GLSL : '  diffuseColor.rgb *= herbe( vMonde );'))
        .replace('#include <envmap_fragment>', sorte === 'route' ? PLUIE_GLSL : '');
    };
    m.customProgramCacheKey = () => 'gpd-route-' + sorte;
    m.userData.realiste = sorte;
    return m;
  }
  // la route : vRoute = (d, s ramené dans la période des taches, d de la ligne idéale, freinage) ; uBord.z = la demi-largeur de la piste
  // (les bas-côtés sont dans le même maillage, un seul appel de dessin : leurs sommets ont vRoute.w < 0, voir BAS_GLSL)
  const ROUTE_GLSL = `
  float dl = 0.0, gTache = 0.5;
  bool estRoute = vRoute.w >= 0.0;
  if ( estRoute ) {
  float gFin = texture2D( uGrain, vRoute.xy / uRep.x ).r;
  gTache = texture2D( uGrain, vRoute.xy / uRep.y ).g;
  dl = abs( vRoute.x - vRoute.z );
  float gomme = 1.0 - smoothstep( uGomme.x, uGomme.y, dl );
  float kRoute = 1.0 + ( gFin - 0.5 ) * uForce.x;
  if ( uDetail > 0.5 ) {
    float trace = vRoute.w * ( 1.0 - smoothstep( uFrein.y * 0.4, uFrein.y, abs( dl - uFrein.x ) ) );
    trace *= smoothstep( 0.3, 0.7, texture2D( uGrain, vec2( vRoute.x * 0.5, vRoute.y * 0.1 ) ).b );
    float bord = smoothstep( uBord.z - uBord.x, uBord.z, abs( vRoute.x ) ) * ( 1.0 - gomme );
    kRoute *= ( 1.0 + ( gTache - 0.5 ) * uForce.y ) * ( 1.0 - uFrein.z * trace ) * ( 1.0 + uBord.y * bord );
  }
  kRoute *= 1.0 - uGomme.z * gomme;
  diffuseColor.rgb *= kRoute;
  } else {`;
  // la pluie, après la lumière : plus sombre, et le ciel reflété (fort en rasant) ; la trajectoire plus sèche (uEau.y)
  const PLUIE_GLSL = `
  if ( uEau.x > 0.0 && estRoute ) {
    float w = clamp( mix( uEau.y, uEau.x, smoothstep( 0.8, 2.2, dl ) ) * ( 0.75 + 0.5 * gTache ), 0.0, 1.0 );
    vec3 vue = normalize( vViewPosition );
    float f = 1.0 - clamp( dot( vue, normal ), 0.0, 1.0 ), f2 = f * f;
    outgoingLight = mix( outgoingLight * ( 1.0 - uMouille.x * w ), uCiel, w * mix( uMouille.y, uMouille.z, f2 * f ) );
  }`;
  // les bas-côtés : vRoute = (m depuis le bord, s ramené, part de gravier, -largeur) ; au bord extérieur, exactement l'herbe du sol
  const BAS_GLSL = `
  float tBas = clamp( vRoute.x / max( - vRoute.w, 0.01 ), 0.0, 1.0 );
  float bFin = texture2D( uGrain, vMonde / uRep.x ).r, bTache = texture2D( uGrain, vMonde / 9.0 ).g;
  float bb = ( bTache - 0.5 ) * 1.6 + ( bFin - 0.5 ) * 0.5;
  vec3 solIci = uSol * herbe( vMonde );
  float usure = 1.0 - smoothstep( 0.0, uBas.x, vRoute.x + bb * 0.9 );
  vec3 cBas = mix( solIci, uTerre * ( 0.85 + 0.3 * bFin ), usure * 0.85 );
  float gv = vRoute.z * ( 1.0 - smoothstep( 0.62, 0.9, tBas + bb * 0.12 ) );
  cBas = mix( cBas, uGravier * ( 0.8 + 0.4 * bFin ), clamp( gv * 1.4, 0.0, 1.0 ) );
  diffuseColor.rgb = mix( cBas, solIci, smoothstep( 0.86, 1.0, tBas ) );
  }`;

  // --- la géométrie ---
  // haut(i) : la hauteur de la route à l'échantillon i (le pont) ; lieu : le lieu du circuit (son sol, son ciel) ou null
  function construire(c, haut, couleurSol, lieu) {
    const u = uniformes(), demi = c.largeur / 2, P = R.ROUTE_GRAIN_REPETE[1], L = c.longueur;
    u.uBord.value.z = demi;
    u.uSol.value.set(couleurSol);
    // la terre des bas-côtés : sur un sol d'herbe, la terre ; sur un sol de ville (gris), le même sol un peu plus sombre (pas de terre jaune en ville)
    const sol = new THREE.Color(couleurSol), vert = sol.g - Math.max(sol.r, sol.b) > R.BAS_COTE_VERT ? 1 : 0;
    u.uTerre.value.set(R.BAS_COTE_TERRE).lerp(sol.clone().multiplyScalar(0.8), 1 - vert);
    u.uCiel.value.set(lieu ? lieu.ciel.horizon : R.COULEUR_CIEL);
    const ligne = ligneIdeale(c), frein = freinages(c, ligne), gr = graviers(c);
    // la route : un ruban de -demi à demi, deux triangles par échantillon (comme avant)
    const pos = [], att = [];
    const sDe = (i, base, fin) => (fin ? L : c.s[i]) - base;
    for (let i = 0; i < c.nb; i++) {
      const k = (i + 1) % c.nb, base = Math.floor(c.s[i] / P) * P;
      const coin = (j, d) => [c.x[j] + c.nx[j] * d, 0.02 + haut(j), c.z[j] + c.nz[j] * d];
      const at = (j, d) => [d, sDe(j, base, j === 0 && k === 0), ligne[j], frein[j]];
      pos.push(...coin(i, -demi), ...coin(i, demi), ...coin(k, -demi), ...coin(k, -demi), ...coin(i, demi), ...coin(k, demi));
      att.push(...at(i, -demi), ...at(i, demi), ...at(k, -demi), ...at(k, -demi), ...at(i, demi), ...at(k, demi));
    }
    // les bas-côtés : des deux côtés, du bord à BAS_COTE[0] m (GRAVIER[0] à l'extérieur des virages), jamais dans la voie des stands
    const pb = pos, ab = att, st = c.stands;   // (dans le même maillage que la route : un seul appel de dessin)
    for (const cote of [-1, 1]) for (let i = 0; i < c.nb; i += R.BAS_COTE_PAS) {
      const k = Math.min(i + R.BAS_COTE_PAS, c.nb) % c.nb, base = Math.floor(c.s[i] / P) * P;
      const largeur = j => {
        let w = R.BAS_COTE[0], g = gr.cote[j] === cote ? gr.g[j] : 0;
        w += (R.GRAVIER[0] - R.BAS_COTE[0]) * g;
        if (st && st.cote === cote && typeof zoneStands === 'function' && zoneStands(c, c.s[j], cote * (st.dMur + 1)) !== null) { w = Math.min(w, R.STAND_MUR - 0.15); g = 0; }
        return [w, g];
      };
      const [wi, gi] = largeur(i), [wk, gk] = largeur(k);
      const p = (j, d, w, g, e) => ({ v: [c.x[j] + c.nx[j] * cote * d, 0.01 + haut(j), c.z[j] + c.nz[j] * cote * d], a: [e, sDe(j, base, j === 0 && k === 0), g, -w] });
      const a1 = p(i, demi, wi, gi, 0), a2 = p(i, demi + wi, wi, gi, wi), b1 = p(k, demi, wk, gk, 0), b2 = p(k, demi + wk, wk, gk, wk);
      // (tournés vers le haut : l'ordre des sommets dépend du côté)
      const tri = cote > 0 ? [a1, a2, b1, b1, a2, b2] : [a2, a1, b2, b2, a1, b1];
      for (const q of tri) { pb.push(...q.v); ab.push(...q.a); }
    }
    // (ils sont 1 cm sous la route et ne la touchent pas ; l'herbe du sol est repoussée dans le tampon de profondeur, SOL_RECUL_PROFONDEUR)
    const route = new THREE.Mesh(geometrie(pos, att), materiau('route', { color: R.COULEUR_ROUTE }));
    route.name = 'route';
    return { route, ligne, frein, graviers: gr };
  }
  function geometrie(pos, att) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aRoute', new THREE.Float32BufferAttribute(att, 4));
    g.computeVertexNormals();
    return g;
  }

  // la pluie (meteo3d.js) : eau sur la piste, eau sur la trajectoire (plus sèche), la couleur du ciel reflété (le brouillard du moment)
  function mouiller(eau, eauLigne, ciel) {
    if (!U.uEau) return;
    U.uEau.value.set(eau > 0 ? eau : 0, eau > 0 ? Math.min(eau, eauLigne === undefined ? eau : eauLigne) : 0);
    if (ciel) U.uCiel.value.copy(ciel);
  }
  // l'Auto : le détail de la route (taches, traces, bords) coupé ou rendu
  function detail(oui) { if (U.uDetail) U.uDetail.value = oui === false ? 0 : 1; }

  return { get uniformes() { return U; }, ligneIdeale, freinages, graviers, texture, materiau, construire, mouiller, detail, get eau() { return U.uEau ? U.uEau.value.x : 0; } };
})();
