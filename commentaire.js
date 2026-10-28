// Le commentateur (CLAUDE.md « Le commentateur ») : en calcul pur, il lit seulement la course (simulation.js : e) et choisit ses
// phrases ; l'affichage est le bandeau télé des messages de course (messages.js, principal.js).
// - COMMENTAIRE.creer(graine) : un commentaire pour une course ; son hasard est une suite à lui (ALEATOIRE.suite) : il ne tire
//   jamais dans hasard(), la course est la même au bit près avec ou sans lui ;
// - COMMENTAIRE.observer(c, e, options) : les faits nouveaux de la course entrent dans la file (départ, dépassements, côte à côte,
//   erreurs, contacts, pénalités, stands, meilleur tour, pluie, dernier tour, arrivée, la place du joueur) ; options : { joueur (son
//   indice, ou −1), pluie (0..1, meteo3d.js), circuit (le nom affiché) } ;
// - COMMENTAIRE.afficher(c, t, attendre) : au plus une phrase toutes les COMMENTAIRE_INTERVALLE s, la plus prioritaire
//   (COMMENTAIRE_PRIORITES), rien si attendre (le joueur au début d'un virage serré) ; une phrase trop vieille est oubliée ;
// - COMMENTAIRE.phrase(item, nom) : le texte (textes.js : com_<type>, plusieurs variantes, jamais la même deux fois de suite).
// COMMENTAIRE_MODE : 'tout', 'joueur' (seulement les faits du joueur, et l'arrivée) ou 'non' (coupé).
const COMMENTAIRE = (function () {
  const R = REGLAGES;

  function creer(graine) {
    return { rnd: ALEATOIRE.suite(((graine | 0) + R.GRAINE_COMMENTAIRE) >>> 0), file: [], vu: null, dernier: -Infinity, derniereCle: null, joueurVu: -Infinity, cotes: new Map(), contacts: new Map() };
  }

  // un fait dans la file (selon le mode) ; joueur : le fait concerne le joueur (il passe devant les autres de COMMENTAIRE_BONUS_JOUEUR)
  function pousser(c, t, type, params, joueur) {
    const mode = R.COMMENTAIRE_MODE;
    if (mode === 'non' || (mode === 'joueur' && !joueur && type !== 'arrivee')) return;
    c.file.push({ type, t, params: params || {}, joueur: !!joueur, prio: (R.COMMENTAIRE_PRIORITES[type] || 0) + (joueur ? R.COMMENTAIRE_BONUS_JOUEUR : 0) });
    if (c.file.length > R.COMMENTAIRE_FILE_MAX) { c.file.sort((a, b) => b.prio - a.prio || a.t - b.t); c.file.length = R.COMMENTAIRE_FILE_MAX; }
  }

  // ce que la course montre maintenant (lu, jamais changé)
  function lire(e) {
    const ordre = typeof classementCourse === 'function' ? classementCourse(e) : e.pilotes.map((p, k) => ({ k, place: k + 1, ecart: null }));
    const place = new Map(ordre.map(o => [o.k, o]));
    return {
      ordre, place,
      pilotes: e.pilotes.map(p => ({ tour: p.course.tours.length + 1, arrivee: p.arrivee, penalites: p.course.penalites || 0, stand: !!p.course.arretEnCours,
        meilleur: p.course.meilleurTour, erreur: !!((p.pilote && p.pilote.enErreur) || p.v.surHerbe), contacts: p.v.contactsVoiture || 0,
        s: p.v.piste ? p.v.piste.s : null, d: p.v.piste ? p.v.piste.d : null, x: p.v.x, z: p.v.z })),
      depassements: e.depassements ? e.depassements.length : 0,
    };
  }

  function observer(c, e, options) {
    if (R.COMMENTAIRE_MODE === 'non' || !e) return c;
    const o = options || {}, j = o.joueur === undefined ? -1 : o.joueur, t = e.temps, n = lire(e), v = c.vu;
    const estJ = k => k === j, haut = k => { const q = n.place.get(k); return q && q.place <= R.COMMENTAIRE_PLACE_MAX; };
    const prm = (k, x) => Object.assign({ qui: k, place: n.place.get(k) ? n.place.get(k).place : null, circuit: o.circuit || '', lieu: o.lieu || '' }, x);
    if (!v) { c.vu = Object.assign(n, { depart: false, meilleur: null, dernierTour: false, vainqueur: false, pluie: false, joueurArrive: false, podium: false, arrets: [] }); return c; }
    // le départ
    if (!v.depart && e.go !== null) { v.depart = true; pousser(c, t, 'depart', prm(n.ordre[0].k), false); }
    // les dépassements (enregistrés par la course : qui, sur, numéros = indice + 1)
    for (let i = v.depassements; i < n.depassements; i++) {
      const d = e.depassements[i], qui = d.qui - 1, sur = d.sur - 1, pl = n.place.get(qui) ? n.place.get(qui).place : null;
      const type = pl === 1 ? 'depassementTete' : estJ(qui) || estJ(sur) ? 'depassementJoueur' : 'depassement';
      if (type === 'depassement' && !haut(qui)) continue;
      pousser(c, t, type, prm(qui, { sur }), estJ(qui) || estJ(sur));
    }
    n.pilotes.forEach((p, k) => {
      const a = v.pilotes[k];
      if (!a) return;
      if (p.erreur && !a.erreur && (haut(k) || estJ(k)) && p.arrivee === null) pousser(c, t, 'erreur', prm(k), estJ(k));
      if (p.penalites > a.penalites) pousser(c, t, 'penalite', prm(k, { s: p.penalites - a.penalites }), estJ(k));
      if (p.stand && !a.stand) pousser(c, t, 'stands', prm(k), estJ(k));
    });
    // une voiture arrêtée en piste (sous COMMENTAIRE_ARRET_VITESSE pendant COMMENTAIRE_ARRET_DUREE s, hors des stands, pas arrivée) :
    // une fois par arrêt
    if (e.go !== null) e.pilotes.forEach((p, k) => {
      const lente = p.arrivee === null && Math.abs(p.v.u) < R.COMMENTAIRE_ARRET_VITESSE && !p.v.dansStands && !p.course.arretEnCours && t - e.go > R.COMMENTAIRE_ARRET_DUREE;
      if (!lente) { v.arrets[k] = null; return; }
      if (v.arrets[k] === undefined || v.arrets[k] === null) v.arrets[k] = t;
      else if (v.arrets[k] !== true && t - v.arrets[k] >= R.COMMENTAIRE_ARRET_DUREE) { v.arrets[k] = true; if (haut(k) || estJ(k)) pousser(c, t, 'arret', prm(k), estJ(k)); }
    });
    // les contacts : deux voitures qui se touchent au même pas, les plus proches l'une de l'autre ; une fois par paire et par
    // COMMENTAIRE_REPETITION s
    const touches = n.pilotes.map((p, k) => k).filter(k => v.pilotes[k] && n.pilotes[k].contacts > v.pilotes[k].contacts);
    for (const a of touches) {
      let b = -1, dm = Infinity;
      for (const q of touches) if (q !== a) { const dd = Math.hypot(n.pilotes[a].x - n.pilotes[q].x, n.pilotes[a].z - n.pilotes[q].z); if (dd < dm) { dm = dd; b = q; } }
      if (b < 0 || a > b || dm > R.COMMENTAIRE_CONTACT_DISTANCE) continue;
      const cle = a + '-' + b;
      if (t - (c.contacts.get(cle) || -Infinity) < R.COMMENTAIRE_REPETITION) continue;
      c.contacts.set(cle, t);
      if (haut(a) || haut(b) || estJ(a) || estJ(b)) pousser(c, t, 'contact', prm(a, { sur: b }), estJ(a) || estJ(b));
    }
    // côte à côte : deux voitures qui se suivent au classement, à moins de COMMENTAIRE_COTE[0] m le long et à plus de [1] m en travers,
    // pendant COMMENTAIRE_COTE[2] s
    for (let i = 1; i < n.ordre.length && i < R.COMMENTAIRE_PLACE_MAX; i++) {
      const A = n.ordre[i - 1].k, B = n.ordre[i].k, pa = n.pilotes[A], pb = n.pilotes[B], cle = A + '-' + B;
      const cote = pa.s !== null && pb.s !== null && pa.arrivee === null && pb.arrivee === null && Math.abs(ecartLe(e, pa.s - pb.s)) < R.COMMENTAIRE_COTE[0] && Math.abs(pa.d - pb.d) > R.COMMENTAIRE_COTE[1];
      const etat = c.cotes.get(cle) || { depuis: null, dit: -Infinity };
      if (!cote) etat.depuis = null;
      else if (etat.depuis === null) etat.depuis = t;
      else if (t - etat.depuis >= R.COMMENTAIRE_COTE[2] && t - etat.dit > R.COMMENTAIRE_REPETITION) { etat.dit = t; pousser(c, t, 'coteACote', prm(B, { sur: A }), estJ(A) || estJ(B)); }
      c.cotes.set(cle, etat);
    }
    // le meilleur tour de la course
    let best = null, kb = -1;
    n.pilotes.forEach((p, k) => { if (p.meilleur !== null && p.meilleur !== undefined && (best === null || p.meilleur < best)) { best = p.meilleur; kb = k; } });
    if (best !== null && (v.meilleur === null || best < v.meilleur)) { if (v.meilleur !== null) pousser(c, t, 'meilleurTour', prm(kb, { temps: best }), estJ(kb)); v.meilleur = best; }
    // la pluie qui arrive
    const pleut = (o.pluie || 0) > R.MESSAGES_PLUIE_SEUIL;
    if (pleut && !v.pluie) pousser(c, t, 'pluie', prm(n.ordre[0].k), false);
    v.pluie = pleut;
    // le dernier tour du leader, l'arrivée du vainqueur et celle du joueur
    const tete = n.ordre[0].k;
    if (!v.dernierTour && e.nbTours > 1 && n.pilotes[tete].tour === e.nbTours && n.pilotes[tete].arrivee === null) { v.dernierTour = true; pousser(c, t, 'dernierTour', prm(tete), estJ(tete)); }
    if (!v.vainqueur && n.pilotes[tete].arrivee !== null) { v.vainqueur = true; pousser(c, t, 'arrivee', prm(tete), estJ(tete)); }
    // le podium, quand il est sûr (podiumConnu : pénalités comprises, aucune voiture encore en course ne peut y entrer)
    if (!v.podium && typeof podiumConnu === 'function' && podiumConnu(e) && typeof classementFinal === 'function') {
      v.podium = true;
      const f = classementFinal(e);
      if (f.length >= 3) pousser(c, t, 'podium', prm(f[0].k, { sur: f[1].k, trois: f[2].k }), estJ(f[0].k) || estJ(f[1].k) || estJ(f[2].k));
    }
    if (j >= 0 && !v.joueurArrive && n.pilotes[j] && n.pilotes[j].arrivee !== null && !estJ(tete)) { v.joueurArrive = true; pousser(c, t, 'joueurArrivee', prm(j), true); }
    // la place du joueur, de temps en temps (COMMENTAIRE_JOUEUR_PERIODE) : l'écart avec la voiture devant, ou son avance en tête
    if (j >= 0 && e.go !== null && n.pilotes[j] && n.pilotes[j].arrivee === null && t - c.joueurVu >= R.COMMENTAIRE_JOUEUR_PERIODE && n.place.get(j)) {
      c.joueurVu = t;
      const q = n.place.get(j);
      if (q.place === 1 && n.ordre[1] && n.ordre[1].ecart !== null) pousser(c, t, 'joueurTete', prm(j, { ecart: n.ordre[1].ecart }), true);
      else if (q.place > 1 && q.ecart !== null) pousser(c, t, 'joueurPlace', prm(j, { ecart: q.ecart }), true);
    }
    // ce qu'on garde pour la prochaine fois
    for (const k of ['ordre', 'place', 'pilotes', 'depassements']) v[k] = n[k];
    return c;
  }
  // un écart le long de la piste ramené entre −L/2 et L/2
  function ecartLe(e, ds) { const L = e.circuit.longueur; return ((ds + L / 2) % L + L) % L - L / 2; }

  // la phrase à dire maintenant, ou null : l'intervalle, l'attente (virage serré), les faits trop vieux oubliés, le plus prioritaire
  function afficher(c, t, attendre) {
    if (R.COMMENTAIRE_MODE === 'non' || attendre || t - c.dernier < R.COMMENTAIRE_INTERVALLE) return null;
    c.file = c.file.filter(x => t - x.t <= R.COMMENTAIRE_PEREMPTION);
    if (!c.file.length) return null;
    let i = 0;
    for (let k = 1; k < c.file.length; k++) if (c.file[k].prio > c.file[i].prio || (c.file[k].prio === c.file[i].prio && c.file[k].t < c.file[i].t)) i = k;
    const item = c.file.splice(i, 1)[0];
    // la variante : tirée par le hasard du commentaire, jamais la même phrase deux fois de suite
    const variantes = texte('com_' + item.type), nb = Array.isArray(variantes) ? variantes.length : 1;
    let v = Math.floor(c.rnd() * nb);
    if (nb > 1 && c.derniereCle === item.type + ':' + v) v = (v + 1) % nb;
    item.variante = v;
    c.derniereCle = item.type + ':' + v;
    c.dernier = t;
    return item;
  }

  // le texte d'une phrase : nom(k) donne le nom d'une voiture (l'affichage) ; les temps et écarts avec la virgule de la langue
  function phrase(item, nom, formatTemps) {
    const variantes = texte('com_' + item.type), p = item.params;
    let s = Array.isArray(variantes) ? variantes[item.variante || 0] : variantes;
    const nombre = x => (Math.round(x * 10) / 10).toFixed(1).replace('.', texte('virgule'));
    return s.replace('{qui}', nom(p.qui)).replace('{sur}', p.sur === undefined ? '' : nom(p.sur)).replace('{trois}', p.trois === undefined ? '' : nom(p.trois)).replace('{lieu}', p.lieu || '').replace('{place}', p.place === null || p.place === undefined ? '' : String(p.place))
      .replace('{circuit}', p.circuit || '').replace('{ecart}', p.ecart === undefined ? '' : nombre(p.ecart)).replace('{s}', p.s === undefined ? '' : String(p.s).replace('.', texte('virgule')))
      .replace('{temps}', p.temps === undefined ? '' : formatTemps ? formatTemps(p.temps) : String(p.temps));
  }

  return { creer, observer, afficher, phrase, pousser };
})();
