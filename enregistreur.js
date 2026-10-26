// L'enregistreur de course, en calcul pur (sans Three.js, sans écran) : pour le résumé vidéo (étape 13) et, plus tard,
// le fantôme du meilleur tour (même code). Les réglages sont dans REGLAGES_ENREGISTREUR (enregistreur-donnees.js).
//
//   const enr = creerEnregistreur(nbVoitures, { joueur: k });   // joueur : facultatif, l'indice de la voiture du joueur
//   enr.depart(t);                                              // facultatif : l'instant du GO (sinon le début)
//   enr.enregistrer(t, voitures, classement);                   // à CHAQUE pas de physique, toujours le même tableau
//   enr.arrivee(t, k);                                          // facultatif : la voiture k passe la ligne d'arrivée
//   enr.arret(t, k, duree);                                     // facultatif : la voiture k repart de son arrêt au stand à t, après duree s
//   enr.lire(t)                  → [{ x, z, cap, vitesse, place, horsPiste }] pour chaque voiture, interpolé
//   enr.momentsForts()           → [{ type, temps, debut, fin, importance, qui, sur, ... }] triés par début
//   enr.resume(dureeMax)         → [{ debut, fin, moments }] : les plages à rejouer, triées, au total ≤ dureeMax
//   enr.octets()                 → la mémoire prise par les tableaux typés
//   enr.temps(i)                 → l'instant de l'image i (lire(enr.temps(i)) redonne exactement cette image : le fantôme)
//
// Une voiture : { x, z, cap } et, si on les a, la vitesse (vitesse, ou u comme dans physique.js) et un indicateur de
// sortie de piste (surHerbe comme dans physique.js, ou horsPiste, ou ecartPiste : les mètres hors de la piste, > 0 = dehors).
// Le classement : un tableau dans l'ordre de course, de numéros de voiture (k) ou d'objets { k } (classementCourse).
// Une voiture qui n'est plus en course (arrivée) reste dans le tableau : les indices ne doivent jamais changer.

function creerEnregistreur(nbVoitures, options = {}) {
  const R = Object.assign({}, REGLAGES_ENREGISTREUR, options.reglages || {});
  const N = nbVoitures, pasImage = 1 / R.IMAGES_PAR_SECONDE, parBloc = R.IMAGES_PAR_BLOC;
  const joueur = options.joueur === undefined ? null : options.joueur;

  // --- la mémoire : des blocs de parBloc images, pris au fur et à mesure (jamais recopiés)
  // par image : le temps (Float64) ; par voiture et par image : x, z (Float32), cap, vitesse (Int16), place, état (Uint8)
  const blocs = [];
  let nbImages = 0;
  function nouveauBloc() {
    const n = parBloc * N;
    blocs.push({ temps: new Float64Array(parBloc), x: new Float32Array(n), z: new Float32Array(n),
      cap: new Int16Array(n), vitesse: new Int16Array(n), place: new Uint8Array(n), etat: new Uint8Array(n) });
  }
  const ETAT_HORS_PISTE = 1;

  // --- ce qu'on suit d'un pas à l'autre
  let tDebut = null, tGo = null, prochaine = 0, nImagesPrevues = 0;
  const arrivees = [];                        // { temps, k } dans l'ordre de passage
  const arrets = [];                          // les arrêts au stand : { temps (le départ du stand), k, duree }
  const placeAvant = new Int16Array(N).fill(-1);
  let classementVu = false;
  const enAttente = [];                       // les dépassements pas encore confirmés : { qui, sur, temps, placeQui }
  const depassements = [];
  const sorties = [];
  // les sorties : par voiture, l'épisode hors piste en cours, ou la fenêtre des vitesses (sans indicateur)
  const sortie = Array.from({ length: N }, () => ({ dehors: false, debut: 0, vEntree: 0, vMin: 0, tMin: 0, dernierDehors: 0, derniere: -Infinity }));
  const derniereVitesse = new Float64Array(N), dernierX = new Float64Array(N), dernierZ = new Float64Array(N);
  let tDernier = null;

  function normaliser(a) { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; }
  function horsPiste(v) {
    if (v.surHerbe !== undefined) return v.surHerbe ? 1 : 0;
    if (v.horsPiste !== undefined) return v.horsPiste ? 1 : 0;
    if (typeof v.ecartPiste === 'number') return v.ecartPiste > 0 ? 1 : 0;
    return -1;   // pas d'indicateur : on regardera la décélération
  }

  // la vitesse d'une voiture : celle qu'elle donne, sinon tirée de son déplacement depuis le dernier appel
  function vitesseDe(v, k, t) {
    if (typeof v.vitesse === 'number') return v.vitesse;
    if (typeof v.u === 'number') return v.u;
    if (tDernier === null || t <= tDernier) return derniereVitesse[k];
    return Math.hypot(v.x - dernierX[k], v.z - dernierZ[k]) / (t - tDernier);
  }

  function lireClassement(classement) {
    if (!classement) return null;
    const places = new Int16Array(N).fill(-1);
    classement.forEach((c, i) => { const k = typeof c === 'number' ? c : c.k; if (k >= 0 && k < N) places[k] = i + 1; });
    return places;
  }

  // --- les dépassements : une paire dont l'ordre s'inverse ; confirmé s'il tient DEPASSEMENT_TENU secondes
  function suivreClassement(t, places) {
    if (classementVu) {
      let change = false;
      for (let k = 0; k < N; k++) if (places[k] !== placeAvant[k]) { change = true; break; }
      if (change) for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        if (a === b || places[a] < 1 || places[b] < 1 || placeAvant[a] < 1 || placeAvant[b] < 1) continue;
        if (placeAvant[a] > placeAvant[b] && places[a] < places[b]) {
          // a passe devant b : si le dépassement inverse attendait encore, les deux s'annulent (côte à côte)
          const i = enAttente.findIndex(d => d.qui === b && d.sur === a);
          if (i >= 0) enAttente.splice(i, 1);
          else enAttente.push({ qui: a, sur: b, temps: t, placeQui: places[a] });
        }
      }
    }
    for (let i = enAttente.length - 1; i >= 0; i--) {
      const d = enAttente[i];
      if (t - d.temps >= R.DEPASSEMENT_TENU) { depassements.push(d); enAttente.splice(i, 1); }
    }
    placeAvant.set(places);
    classementVu = true;
  }

  // --- les sorties de piste
  function suivreSortie(t, k, dehors, vitesse) {
    const s = sortie[k];
    if (dehors === -1) return;
    if (dehors) {
      if (!s.dehors) { s.dehors = true; s.debut = t; s.vEntree = derniereVitesse[k]; s.vMin = vitesse; s.tMin = t; }
      if (vitesse < s.vMin) { s.vMin = vitesse; s.tMin = t; }
      s.dernierDehors = t;
    } else if (s.dehors && t - s.dernierDehors >= R.SORTIE_RETOUR) finirSortie(k);
  }
  function finirSortie(k) {
    const s = sortie[k];
    s.dehors = false;
    const perte = s.vEntree - s.vMin;
    if (perte >= R.SORTIE_PERTE_MIN) sorties.push({ k, temps: s.debut, finSortie: Math.max(s.tMin, s.dernierDehors), perte });
  }
  // sans indicateur : une décélération plus forte qu'un freinage, mesurée sur les images enregistrées
  function sortieParDeceleration(k, img) {
    const recul = Math.max(1, Math.round(R.SORTIE_FENETRE * R.IMAGES_PAR_SECONDE));
    if (img - recul < 0) return;
    const t = tempsImage(img), t0 = tempsImage(img - recul), v = vitesseImage(img, k), v0 = vitesseImage(img - recul, k);
    const s = sortie[k];
    if ((v0 - v) / (t - t0) >= R.SORTIE_DECELERATION && t - s.derniere >= R.SORTIE_ESPACEMENT) {
      s.derniere = t;
      sorties.push({ k, temps: t0, finSortie: t, perte: v0 - v });
    }
  }

  // --- l'écriture d'une image
  function ecrireImage(t, voitures, places) {
    if (nbImages === blocs.length * parBloc) nouveauBloc();
    const b = blocs[Math.floor(nbImages / parBloc)], i = nbImages % parBloc, o = i * N;
    b.temps[i] = t;
    for (let k = 0; k < N; k++) {
      const v = voitures[k];
      b.x[o + k] = v.x; b.z[o + k] = v.z;
      b.cap[o + k] = Math.round(normaliser(v.cap) / R.CAP_PAS);
      b.vitesse[o + k] = Math.max(-32767, Math.min(32767, Math.round(derniereVitesse[k] / R.VITESSE_PAS)));
      b.place[o + k] = places && places[k] > 0 ? Math.min(255, places[k]) : (placeAvant[k] > 0 ? Math.min(255, placeAvant[k]) : 0);
      b.etat[o + k] = horsPiste(v) === 1 ? ETAT_HORS_PISTE : 0;
    }
    nbImages++;
  }

  function enregistrer(t, voitures, classement) {
    if (tDebut === null) { tDebut = t; prochaine = t; nImagesPrevues = 0; }
    const places = lireClassement(classement);
    for (let k = 0; k < N; k++) {
      const v = voitures[k], vit = vitesseDe(v, k, t);
      suivreSortie(t, k, horsPiste(v), vit);
      derniereVitesse[k] = vit; dernierX[k] = v.x; dernierZ[k] = v.z;
    }
    tDernier = t;
    if (places) suivreClassement(t, places);
    // une image tous les 1/IMAGES_PAR_SECONDE (compté depuis le début : pas de dérive)
    if (t >= prochaine - 1e-9) {
      ecrireImage(t, voitures, places);
      for (let k = 0; k < N; k++) if (horsPiste(voitures[k]) === -1) sortieParDeceleration(k, nbImages - 1);
      nImagesPrevues++;
      prochaine = tDebut + nImagesPrevues * pasImage;
      if (prochaine <= t) { nImagesPrevues = Math.floor((t - tDebut) / pasImage) + 1; prochaine = tDebut + nImagesPrevues * pasImage; }
    }
  }

  // --- la lecture
  function tempsImage(i) { return blocs[Math.floor(i / parBloc)].temps[i % parBloc]; }
  function champ(nom, i, k) { return blocs[Math.floor(i / parBloc)][nom][(i % parBloc) * N + k]; }
  function vitesseImage(i, k) { return champ('vitesse', i, k) * R.VITESSE_PAS; }
  function capImage(i, k) { return champ('cap', i, k) * R.CAP_PAS; }

  // l'image juste avant t (ou à t) : recherche par dichotomie
  function imageAvant(t) {
    let a = 0, b = nbImages - 1;
    if (t <= tempsImage(0)) return 0;
    if (t >= tempsImage(b)) return b;
    while (b - a > 1) { const m = (a + b) >> 1; if (tempsImage(m) <= t) a = m; else b = m; }
    return a;
  }

  // la dérivée de x ou z à l'image i (en m par seconde), multipliée par h : sur 5 images régulières, la formule
  // à 5 points (erreur en h⁴) ; sinon la parabole par 3 images (aussi aux bouts)
  function pente(c, i, k, h) {
    if (h <= 0) return 0;
    if (i >= 2 && i + 2 < nbImages) {
      const tm2 = tempsImage(i - 2), tm1 = tempsImage(i - 1), t0 = tempsImage(i), tp1 = tempsImage(i + 1), tp2 = tempsImage(i + 2);
      const e = (tp2 - tm2) / 4;
      if (Math.abs(tm1 - tm2 - e) < 0.01 * e && Math.abs(t0 - tm1 - e) < 0.01 * e && Math.abs(tp1 - t0 - e) < 0.01 * e && Math.abs(tp2 - tp1 - e) < 0.01 * e)
        return (-champ(c, i + 2, k) + 8 * champ(c, i + 1, k) - 8 * champ(c, i - 1, k) + champ(c, i - 2, k)) / (12 * e) * h;
    }
    if (nbImages < 2) return 0;
    if (nbImages === 2) return (champ(c, 1, k) - champ(c, 0, k)) / (tempsImage(1) - tempsImage(0)) * h;
    // la parabole par trois images (i et ses voisines, ou les trois premières / dernières aux bouts), dérivée en i
    const j0 = Math.max(0, Math.min(i - 1, nbImages - 3)), ti = tempsImage(i);
    let d = 0;
    for (let j = j0; j < j0 + 3; j++) {
      const tj = tempsImage(j);
      let somme = 0, bas = 1;
      for (let m = j0; m < j0 + 3; m++) if (m !== j) {
        bas *= tj - tempsImage(m);
        let produit = 1;
        for (let l = j0; l < j0 + 3; l++) if (l !== j && l !== m) produit *= ti - tempsImage(l);
        somme += produit;
      }
      d += champ(c, j, k) * somme / bas;
    }
    return d * h;
  }

  // Hermite cubique (avec les vrais temps) pour x et z : passe par les images et suit les courbes (l'interpolation
  // en ligne droite couperait les virages de plusieurs centimètres à 10 images par seconde) ; le cap en ligne droite,
  // par le plus court chemin entre les deux angles
  function lire(t, sortieLue) {
    const res = sortieLue || Array.from({ length: N }, () => ({ x: 0, z: 0, cap: 0, vitesse: 0, place: 0, horsPiste: false }));
    if (nbImages === 0) return res;
    const i1 = imageAvant(t), i2 = Math.min(i1 + 1, nbImages - 1);
    const t1 = tempsImage(i1), t2 = tempsImage(i2);
    const h = t2 - t1, a = h > 0 ? Math.max(0, Math.min(1, (t - t1) / h)) : 0;
    const a2 = a * a, a3 = a2 * a;
    const h00 = 2 * a3 - 3 * a2 + 1, h10 = a3 - 2 * a2 + a, h01 = -2 * a3 + 3 * a2, h11 = a3 - a2;
    for (let k = 0; k < N; k++) {
      const r = res[k];
      for (const c of ['x', 'z']) {
        const p1 = champ(c, i1, k), p2 = champ(c, i2, k);
        // les pentes en chaque image, ramenées à l'intervalle [t1, t2]
        const m1 = pente(c, i1, k, h), m2 = pente(c, i2, k, h);
        r[c] = h00 * p1 + h10 * m1 + h01 * p2 + h11 * m2;
      }
      const c1 = capImage(i1, k), c2 = capImage(i2, k);
      r.cap = normaliser(c1 + normaliser(c2 - c1) * a);
      r.vitesse = vitesseImage(i1, k) + (vitesseImage(i2, k) - vitesseImage(i1, k)) * a;
      const ip = a < 0.5 ? i1 : i2;
      r.place = champ('place', ip, k);
      r.horsPiste = champ('etat', ip, k) === ETAT_HORS_PISTE;
    }
    return res;
  }

  // --- les moments forts
  function momentsForts() {
    if (nbImages === 0) return [];
    const debut = tempsImage(0), fin = tempsImage(nbImages - 1);
    const borner = m => { m.debut = Math.max(debut, m.debut); m.fin = Math.min(fin, m.fin); return m; };
    const L = [];
    const go = tGo === null ? debut : tGo;
    L.push(borner({ type: 'depart', temps: go, debut: go - R.DEPART_AVANT, fin: go + R.DEPART_APRES, importance: R.IMPORTANCE_DEPART }));
    // les dépassements confirmés (ceux encore en attente à la fin comptent s'ils tiennent jusqu'au bout)
    const tous = depassements.concat(enAttente.filter(d => fin - d.temps >= R.DEPASSEMENT_TENU));
    for (const d of tous) {
      let imp = R.IMPORTANCE_DEPASSEMENT + R.IMPORTANCE_PAR_PLACE * Math.max(0, N - d.placeQui);
      if (d.placeQui === 1) imp += R.IMPORTANCE_TETE;
      if (joueur !== null && (d.qui === joueur || d.sur === joueur)) imp += R.IMPORTANCE_JOUEUR;
      L.push(borner({ type: 'depassement', temps: d.temps, debut: d.temps - R.DEPASSEMENT_AVANT, fin: d.temps + R.DEPASSEMENT_APRES,
        importance: imp, qui: d.qui, sur: d.sur, place: d.placeQui }));
    }
    // les sorties : celles finies, et celles encore en cours à la fin
    const toutes = sorties.slice();
    for (let k = 0; k < N; k++) { const s = sortie[k];
      if (s.dehors && s.vEntree - s.vMin >= R.SORTIE_PERTE_MIN) toutes.push({ k, temps: s.debut, finSortie: Math.max(s.tMin, s.dernierDehors), perte: s.vEntree - s.vMin }); }
    for (const s of toutes) {
      let imp = R.IMPORTANCE_SORTIE + R.IMPORTANCE_PAR_MS_PERDU * s.perte;
      if (joueur !== null && s.k === joueur) imp += R.IMPORTANCE_JOUEUR;
      const d = s.temps - R.SORTIE_AVANT;
      L.push(borner({ type: 'sortie', temps: s.temps, debut: d, fin: Math.min(s.finSortie + R.SORTIE_APRES, d + R.SORTIE_DUREE_MAX),
        importance: imp, qui: s.k, perte: s.perte }));
    }
    // les arrêts au stand : de l'arrivée dans la zone d'arrêt (temps − duree) au départ du stand
    for (const a of arrets) {
      let imp = R.IMPORTANCE_ARRET;
      if (joueur !== null && a.k === joueur) imp += R.IMPORTANCE_JOUEUR;
      L.push(borner({ type: 'arret', temps: a.temps - a.duree, debut: a.temps - a.duree - R.ARRET_AVANT, fin: a.temps + R.ARRET_APRES, importance: imp, qui: a.k, duree: a.duree }));
    }
    // l'arrivée du vainqueur (sinon la fin de l'enregistrement)
    const a = arrivees.length ? arrivees[0] : { temps: fin, k: null };
    L.push(borner({ type: 'arrivee', temps: a.temps, debut: a.temps - R.ARRIVEE_AVANT, fin: a.temps + R.ARRIVEE_APRES,
      importance: R.IMPORTANCE_ARRIVEE, qui: a.k }));
    return L.filter(m => m.fin > m.debut).sort((p, q) => p.debut - q.debut || p.temps - q.temps);
  }

  // la durée totale d'une liste d'intervalles qui peuvent se chevaucher, et leur union
  function unir(moments) {
    const tries = moments.slice().sort((p, q) => p.debut - q.debut), plages = [];
    for (const m of tries) {
      const der = plages[plages.length - 1];
      if (der && m.debut <= der.fin) { der.fin = Math.max(der.fin, m.fin); der.moments.push(m); }
      else plages.push({ debut: m.debut, fin: m.fin, moments: [m] });
    }
    return plages;
  }
  const dureePlages = plages => plages.reduce((s, p) => s + p.fin - p.debut, 0);

  // les meilleurs moments d'abord (à importance égale, le plus tôt), tant que l'union tient dans dureeMax
  function resume(dureeMax) {
    const candidats = momentsForts().sort((p, q) => q.importance - p.importance || p.temps - q.temps);
    let choisis = [];
    for (const m of candidats) {
      const essai = choisis.concat([m]);
      if (dureePlages(unir(essai)) <= dureeMax + 1e-9) choisis = essai;
    }
    return unir(choisis);
  }

  function octets() {
    let n = 0;
    for (const b of blocs) for (const c in b) n += b[c].byteLength;
    return n;
  }

  return {
    enregistrer, lire, momentsForts, resume, octets, dureePlages,
    depart(t) { tGo = t; },
    arrivee(t, k) { if (!arrivees.some(a => a.k === k)) arrivees.push({ temps: t, k }); },
    arret(t, k, duree) { arrets.push({ temps: t, k, duree }); },
    temps(i) { return tempsImage(i); },
    get nbImages() { return nbImages; },
    get debut() { return nbImages ? tempsImage(0) : null; },
    get fin() { return nbImages ? tempsImage(nbImages - 1) : null; },
  };
}
