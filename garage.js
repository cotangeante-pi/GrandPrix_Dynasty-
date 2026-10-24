// Le garage (CLAUDE.md « L'argent et les améliorations », étape 8), en calcul pur (ni Three.js ni page) : 4 améliorations
// (REGLAGES.GARAGE : changeurs de roues, moteur, aéro, freins) de GARAGE_NIVEAUX niveaux chacune, achetées avec l'argent
// (argent.js). Les niveaux SUIVENT LE JOUEUR (ch.garage, dans le championnat, donc dans la sauvegarde unique : ils restent
// à lui s'il change d'écurie). La règle d'or : la qualité de la voiture (moteur + aéro + freins) vaut au plus GARAGE_PLAFOND
// (+7 %) au total ; les facteurs sont posés sur la voiture du joueur (appliquer) et lus par physique.js comme les pneus
// (× 1 = rien ne change). Les changeurs de roues n'ont pas d'effet avant l'étape 7 (l'arrêt au stand) : seul le niveau est gardé.
const GARAGE = (function () {
  const R = REGLAGES;
  const NOMS = ['roues', 'moteur', 'aero', 'freins'];
  const QUALITE = ['moteur', 'aero', 'freins'];   // ce qui compte dans le plafond

  // le garage d'un championnat qui n'en a pas encore (ancienne sauvegarde) : tout au niveau 0
  function completer(ch) {
    if (!ch.garage || typeof ch.garage !== 'object') ch.garage = {};
    for (const n of NOMS) if (!Number.isInteger(ch.garage[n]) || ch.garage[n] < 0) ch.garage[n] = 0;
    for (const n of NOMS) if (ch.garage[n] > R.GARAGE_NIVEAUX) ch.garage[n] = R.GARAGE_NIVEAUX;
    return ch.garage;
  }

  // le prix du prochain niveau d'une amélioration (null au niveau maximum)
  function prix(ch, nom) {
    const g = completer(ch), niveau = g[nom];
    if (!R.GARAGE[nom] || niveau >= R.GARAGE_NIVEAUX) return null;
    return R.GARAGE[nom].prix[niveau];
  }

  // pourquoi on ne peut pas acheter : 'max' (niveau maximum), 'argent' (pas assez), ou null si on peut
  function refus(ch, nom) {
    const p = prix(ch, nom);
    if (p === null) return 'max';
    if (ARGENT.solde(ch) < p) return 'argent';
    return null;
  }

  // acheter le niveau suivant : { ok, raison, prix, niveau } ; jamais de dette
  function acheter(ch, nom) {
    const r = refus(ch, nom), p = prix(ch, nom);
    if (r) return { ok: false, raison: r, prix: p, niveau: completer(ch)[nom] };
    if (!ARGENT.debiter(ch, p)) return { ok: false, raison: 'argent', prix: p, niveau: ch.garage[nom] };
    ch.garage[nom]++;
    return { ok: true, raison: null, prix: p, niveau: ch.garage[nom] };
  }

  // la part de chaque amélioration de qualité (niveau × effet), ramenée au plafond si la somme le dépassait
  function parts(g) {
    const p = {};
    let somme = 0;
    for (const n of QUALITE) { p[n] = (g[n] || 0) * R.GARAGE[n].effet; somme += p[n]; }
    if (somme > R.GARAGE_PLAFOND) for (const n of QUALITE) p[n] *= R.GARAGE_PLAFOND / somme;
    return p;
  }

  // le bonus total de la voiture (0 à GARAGE_PLAFOND)
  function bonus(g) {
    const p = parts(g);
    return Math.min(R.GARAGE_PLAFOND, p.moteur + p.aero + p.freins);
  }

  // les facteurs lus par physique.js : { moteur, aero, freins }, 1 = rien ne change
  function facteurs(g) {
    const p = parts(g);
    return { moteur: 1 + p.moteur, aero: 1 + p.aero, freins: 1 + p.freins };
  }

  // pose les facteurs sur une voiture (physique.js) : les améliorations × le niveau de l'écurie du joueur (la qualité de la F1
  // appartient à l'écurie ; le même nombre que appliquerNiveaux pour les IA ; coupé par NIVEAU_JOUEUR_ACTIF) ; sans garage
  // (null) et sans niveau (hors championnat, course de découverte) : 1 partout
  function appliquer(v, g, niveau) {
    const f = g ? facteurs(g) : { moteur: 1, aero: 1, freins: 1 };
    const n = R.NIVEAU_JOUEUR_ACTIF && typeof niveau === 'number' && niveau > 0 ? niveau : 1;
    v.moteur = f.moteur * n; v.aero = f.aero * n; v.freins = f.freins * n;
    return { moteur: v.moteur, aero: v.aero, freins: v.freins, niveau: n };
  }

  return { NOMS, QUALITE, completer, prix, refus, acheter, parts, bonus, facteurs, appliquer };
})();
