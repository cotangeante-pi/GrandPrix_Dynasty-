// Le tournoi chrono entre copains (CLAUDE.md « Le tournoi chrono entre copains »), en calcul pur, sans écran : de 2 à
// TOURNOI_JOUEURS_MAX joueurs sur un seul ordinateur, chacun son tour, un tour chronométré (celui des qualifications :
// qualification.js) par joueur et par manche. Deux formules : ⚡ Éclair (une manche, le meilleur temps gagne) et 🏆 Tournoi
// (TOURNOI_MANCHES manches sur des circuits choisis ou tirés au sort, des points par place : TOURNOI_POINTS ; égalité de points :
// le meilleur temps sur une manche). Un virage coupé ajoute ses secondes au temps (la règle de course.js) ; « abandonner » = pas de
// temps (dernier de la manche, aucun point). L'ordre de passage : l'inscription à la première manche, puis l'inverse du
// classement général (le leader en dernier). Le fantôme du leader : le meilleur temps du moment dans la manche, pénalités
// comprises (jamais gardé après le tournoi : il n'est pas dans cet état). Un mode à part de la carrière.
//
//   TOURNOI.valider(joueurs, defauts)      → { ok, erreurs: ['nombre', 'prenom'], joueurs } (prénoms nettoyés, casques complétés)
//   TOURNOI.creer(joueurs, formule, circuits) → l'état du tournoi (joueurs déjà validés ; circuits : un par manche)
//   TOURNOI.tirerCircuits(noms, n, graine)  → n circuits tirés au sort (sans répétition tant qu'il y en a assez)
//   TOURNOI.ordre(t, m)                     → l'ordre de passage de la manche m (indices des joueurs)
//   TOURNOI.joueurActuel(t)                 → l'indice du joueur qui passe, ou null (manche ou tournoi fini)
//   TOURNOI.enregistrer(t, j, r)            → note le passage du joueur j dans la manche en cours : r = { tour, penalites } ou { abandon: true }
//   TOURNOI.classementManche(t, m)          → [{ j, temps, place, points }] (temps null : pas de temps, en dernier)
//   TOURNOI.classementGeneral(t)            → [{ j, points, meilleur, place }]
//   TOURNOI.leader(t, m)                    → le joueur au meilleur temps du moment dans la manche m (son fantôme), ou null
//   TOURNOI.mancheFinie(t, m), TOURNOI.fini(t), TOURNOI.mancheSuivante(t)
//   TOURNOI.pubPermise(t, moment)           → 'entreJoueurs' : jamais ; 'entreManches' : seulement en 🏆 ; 'fin' : oui
//   TOURNOI.podium(t)                       → les trois premiers du classement final
const TOURNOI = (function () {
  const R = REGLAGES;
  const casqueValide = c => !!c && typeof c === 'object' && R.CASQUE_MOTIFS.includes(c.motif) && Array.isArray(c.couleurs) && c.couleurs.length === 3 && c.couleurs.every(x => Number.isInteger(x) && x >= 0 && x <= 0xffffff);
  const prenomPropre = n => typeof n === 'string' ? n.trim().slice(0, R.NOM_LONGUEUR_MAX) : '';

  // le casque par défaut du joueur i (TOURNOI_CASQUES, en boucle)
  function casqueDefaut(i) {
    const c = R.TOURNOI_CASQUES[i % R.TOURNOI_CASQUES.length];
    return { motif: c.motif, couleurs: c.couleurs.slice() };
  }

  // la liste des joueurs vérifiée : de TOURNOI_JOUEURS_MIN à TOURNOI_JOUEURS_MAX ; un prénom vide prend le nom par défaut
  // (defauts(i) : « Joueur 3 ») ; deux prénoms pareils (sans compter majuscules et espaces) refusés
  function valider(joueurs, defauts) {
    const liste = Array.isArray(joueurs) ? joueurs : [];
    const js = liste.map((x, i) => {
      const j = x && typeof x === 'object' ? x : {};
      return { prenom: prenomPropre(j.prenom) || prenomPropre(defauts(i)), casque: casqueValide(j.casque) ? { motif: j.casque.motif, couleurs: j.casque.couleurs.slice() } : casqueDefaut(i) };
    });
    const erreurs = [];
    if (js.length < R.TOURNOI_JOUEURS_MIN || js.length > R.TOURNOI_JOUEURS_MAX) erreurs.push('nombre');
    const vus = new Set();
    for (const j of js) { const k = j.prenom.toLowerCase(); if (vus.has(k)) { erreurs.push('prenom'); break; } vus.add(k); }
    return { ok: erreurs.length === 0, erreurs, joueurs: js };
  }

  // n circuits tirés au sort avec la graine (sans répétition tant qu'il y en a assez ; sinon on recommence la liste mélangée)
  function tirerCircuits(noms, n, graine) {
    ALEATOIRE.semer(graine + R.GRAINE_TOURNOI);
    const res = [];
    while (res.length < n) {
      const l = noms.slice();
      for (let i = l.length - 1; i > 0; i--) { const k = Math.floor(hasard() * (i + 1)); [l[i], l[k]] = [l[k], l[i]]; }
      // jamais deux fois de suite le même circuit d'une liste à l'autre (s'il y en a plus d'un)
      if (res.length && l.length > 1 && l[0] === res[res.length - 1]) l.push(l.shift());
      res.push(...l);
    }
    ALEATOIRE.semer();
    return res.slice(0, n);
  }

  function creer(joueurs, formule, circuits) {
    const f = formule === 'tournoi' ? 'tournoi' : 'eclair';
    const nb = f === 'tournoi' ? R.TOURNOI_MANCHES : 1;
    return { formule: f, joueurs: joueurs.map(j => ({ prenom: j.prenom, casque: j.casque })), circuits: circuits.slice(0, nb), manche: 0, passages: [...Array(nb)].map(() => []) };
  }

  const nbManches = t => t.passages.length;

  // le temps d'un passage (le tour + ses pénalités), null pour un abandon
  const tempsDe = p => p.abandon ? null : p.tour + p.penalites;

  // le classement d'une manche : par temps (pénalités comprises), les « pas de temps » en dernier (dans leur ordre de passage) ;
  // à temps égal, celui qui l'a fait le premier devant ; les points selon la place (aucun sans temps)
  function classementManche(t, m) {
    const P = t.passages[m] || [];
    const l = P.map((p, i) => ({ j: p.j, temps: tempsDe(p), i, penalites: p.abandon ? 0 : p.penalites }));
    l.sort((a, b) => (a.temps === null) - (b.temps === null) || (a.temps === null ? 0 : a.temps - b.temps) || a.i - b.i);
    return l.map((x, k) => ({ j: x.j, temps: x.temps, penalites: x.penalites, place: k + 1, points: x.temps === null ? 0 : (R.TOURNOI_POINTS[k] || 0) }));
  }

  // le classement général : les points des manches jouées (une manche commencée compte ce qui est fait), égalité → le meilleur
  // temps sur une manche (le plus petit, quel que soit le circuit), puis l'ordre d'inscription
  function classementGeneral(t) {
    const pts = t.joueurs.map(() => 0), meilleur = t.joueurs.map(() => null);
    for (let m = 0; m < nbManches(t); m++) for (const x of classementManche(t, m)) {
      pts[x.j] += x.points;
      if (x.temps !== null && (meilleur[x.j] === null || x.temps < meilleur[x.j])) meilleur[x.j] = x.temps;
    }
    const l = t.joueurs.map((j, k) => ({ j: k, points: pts[k], meilleur: meilleur[k] }));
    if (t.formule === 'eclair') {   // ⚡ Éclair : le meilleur temps gagne (les « pas de temps » en dernier)
      const c = classementManche(t, 0), rang = new Map(c.map(x => [x.j, x.place]));
      l.sort((a, b) => (rang.has(a.j) ? rang.get(a.j) : 1e9) - (rang.has(b.j) ? rang.get(b.j) : 1e9) || a.j - b.j);
    } else l.sort((a, b) => b.points - a.points || (a.meilleur === null) - (b.meilleur === null) || (a.meilleur === null ? 0 : a.meilleur - b.meilleur) || a.j - b.j);
    return l.map((x, k) => ({ ...x, place: k + 1 }));
  }

  // l'ordre de passage : l'inscription à la première manche ; ensuite l'inverse du classement général des manches d'avant
  function ordre(t, m) {
    if (m === 0) return t.joueurs.map((j, k) => k);
    const avant = { ...t, passages: t.passages.slice(0, m) };
    return classementGeneral(avant).map(x => x.j).reverse();
  }

  function mancheFinie(t, m) {
    return (t.passages[m] || []).length >= t.joueurs.length;
  }

  function fini(t) {
    return mancheFinie(t, nbManches(t) - 1);
  }

  function joueurActuel(t) {
    if (mancheFinie(t, t.manche)) return null;
    return ordre(t, t.manche)[t.passages[t.manche].length];
  }

  // note le passage du joueur j (il doit être celui qui passe) : r = { tour, penalites } (s) ou { abandon: true } ; renvoie true
  function enregistrer(t, j, r) {
    if (joueurActuel(t) !== j) return false;
    const p = r && r.abandon ? { j, abandon: true, tour: null, penalites: 0 } : { j, abandon: false, tour: r.tour, penalites: r.penalites || 0 };
    if (!p.abandon && !(typeof p.tour === 'number' && p.tour > 0)) return false;
    t.passages[t.manche].push(p);
    return true;
  }

  // la manche suivante, une fois celle-ci finie (false si c'était la dernière)
  function mancheSuivante(t) {
    if (!mancheFinie(t, t.manche) || t.manche + 1 >= nbManches(t)) return false;
    t.manche++;
    return true;
  }

  // le leader du moment de la manche m (le meilleur temps pénalités comprises, même d'un tour coupé) : son fantôme roule avec le
  // joueur suivant ; null s'il n'y a encore aucun temps (le premier joueur roule seul)
  function leader(t, m) {
    const c = classementManche(t, m);
    return c.length && c[0].temps !== null ? c[0].j : null;
  }

  // Poki : une pub entre deux manches du 🏆 Tournoi et à la fin ; jamais entre deux joueurs d'une même manche
  function pubPermise(t, moment) {
    if (moment === 'fin') return true;
    if (moment === 'entreManches') return t.formule === 'tournoi';
    return false;
  }

  function podium(t) {
    return classementGeneral(t).slice(0, 3);
  }

  return { valider, creer, tirerCircuits, ordre, joueurActuel, enregistrer, classementManche, classementGeneral, leader, mancheFinie, fini, mancheSuivante, pubPermise, podium, casqueDefaut, tempsDe, nbManches };
})();
