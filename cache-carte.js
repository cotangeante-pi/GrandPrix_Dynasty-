// Le cache de la carte des IA (CLAUDE.md « En piste en 10 secondes ») : la trajectoire idéale d'un circuit (ia.js,
// etapesTrajectoire) est déterministe depuis le tour 22, mais elle coûte plusieurs secondes de calcul au lancement, et les
// feux l'attendent. On la garde dans la sauvegarde unique, compacte : ses deux résultats coûteux, ecart et vitesse, en
// Float64 encodés en base64 (les octets exacts : aucune perte) ; x, z, courbure, ds et vitesseLimite se recalculent avec
// les mêmes formules qu'etapesTrajectoire, donc les mêmes nombres au bit près (un test le prouve). Une clé de validité
// (l'empreinte des réglages IA_* et de la physique qui entre dans la vitesse, et des points du circuit) invalide le cache
// dès qu'un réglage ou un tracé change. Calcul pur, sans écran.
//
//   const cache = CACHE_CARTE.encoder(nom, CIRCUITS[nom], trajectoire);   // après le calcul : à sauvegarder (SAUVEGARDE.ecrireCarte)
//   const t = CACHE_CARTE.decoder(cache, nom, CIRCUITS[nom], circuit);    // au lancement : la trajectoire, ou null (absent, abîmé, clé périmée)
//   CACHE_CARTE.taille(cache)                                             → les octets dans la sauvegarde (JSON)
const CACHE_CARTE = (function () {
  const VERSION = 1;   // change quand la forme du cache change
  // les réglages hors IA_* qui entrent dans la trajectoire (l'échantillonnage du circuit, la physique de la vitesse limite)
  const AUTRES_REGLAGES = ['PAS_ECHANTILLON', 'PAS_SPLINE_FIN', 'PAS_POINTS_MORCEAUX', 'MASSE', 'GRAVITE', 'APPUI', 'ADHERENCE', 'ADHERENCE_FREIN',
    'TRAINEE', 'ROULEMENT', 'PUISSANCE', 'FORCE_MOTEUR_MAX', 'BRAQUAGE_MAX', 'BRAQUAGE_VITESSE', 'EMPATTEMENT', 'RAYON_ROUE'];

  // une empreinte entière d'un texte (FNV-1a 32 bits, en entiers : la même sur toute machine), en texte
  function empreinte(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(16) + '-' + s.length;
  }

  // la clé de validité d'un circuit : la version, son nom, ses points (definition : CIRCUITS[nom]) et les réglages
  function cle(nom, definition) {
    const R = REGLAGES, parts = [String(VERSION), nom, JSON.stringify(definition)];
    for (const k of Object.keys(R).sort()) if (/^IA_/.test(k) || AUTRES_REGLAGES.includes(k)) parts.push(k + '=' + JSON.stringify(R[k]));
    if (margeCarte() !== R.IA_MARGE_BORD) parts.push('MARGE_CARTE=' + margeCarte());   // (le niveau de difficulté a sa carte, ia.js ; au niveau normal, la clé d'avant)
    return empreinte(parts.join('|'));
  }

  // Float64Array → base64 des octets exacts, et retour (null si la taille ne colle pas)
  function versBase64(a) {
    const o = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    let s = '';
    for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode.apply(null, o.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function depuisBase64(b, n) {
    try {
      const s = atob(b);
      if (s.length !== n * 8) return null;
      const o = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i);
      return new Float64Array(o.buffer);
    } catch (e) { return null; }
  }

  // le cache compact d'une trajectoire calculée
  function encoder(nom, definition, t) {
    return { cle: cle(nom, definition), nb: t.ecart.length, ecart: versBase64(t.ecart), vitesse: versBase64(t.vitesse) };
  }

  // la trajectoire depuis le cache ; x, z, courbure, ds, vitesseLimite : les formules d'etapesTrajectoire (ia.js)
  function decoder(cache, nom, definition, circuit) {
    if (!cache || typeof cache !== 'object' || cache.cle !== cle(nom, definition) || cache.nb !== circuit.nb) return null;
    const ecart = depuisBase64(cache.ecart, cache.nb), vitesse = depuisBase64(cache.vitesse, cache.nb);
    if (!ecart || !vitesse) return null;
    const R = REGLAGES, n = circuit.nb, cx = circuit.x, cz = circuit.z, nx = circuit.nx, nz = circuit.nz;
    const x = new Float64Array(n), z = new Float64Array(n);
    for (let i = 0; i < n; i++) { x[i] = cx[i] + nx[i] * ecart[i]; z[i] = cz[i] + nz[i] * ecart[i]; }
    const h = R.IA_COURBURE_DEMI_BASE, courbure = new Float64Array(n), ds = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i - h + n) % n, b = (i + h) % n, j = (i + 1) % n;
      courbure[i] = courbureTroisPoints(x[a], z[a], x[i], z[i], x[b], z[b]);
      ds[i] = Math.hypot(x[j] - x[i], z[j] - z[i]);
    }
    const pointe = vitesseDePointe(), vitesseLimite = new Float64Array(n);
    for (let i = 0; i < n; i++) vitesseLimite[i] = Math.min(pointe, vitesseVirage(courbure[i]) * R.IA_MARGE_VIRAGE, vitesseBraquage(courbure[i]));
    return { ecart, x, z, courbure, ds, vitesse, vitesseLimite };
  }

  function taille(cache) {
    return JSON.stringify(cache).length;
  }

  return { cle, encoder, decoder, taille, empreinte };
})();
