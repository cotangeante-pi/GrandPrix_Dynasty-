// Les drapeaux (CLAUDE.md « Les drapeaux », tour 55, T7), en calcul pur (ni Three.js ni page) : il lit la course (simulation.js : e), ne
// tire jamais dans hasard() (la course reste la même au bit près quand rien ne se passe), et ne change que ce qu'il dit : le facteur de
// vitesse des IA (pilote.drapeau, lu par ia.js), le plafond de vitesse du joueur sous VSC, les pénalités des dépassements interdits.
// - drapeau jaune : une voiture arrêtée ou sortie sur l'herbe et lente (un « incident ») ; sa zone va de DRAPEAUX_JAUNE_AVANT m avant elle à
//   DRAPEAUX_JAUNE_APRES m après ; dans la zone, les IA lèvent le pied (× DRAPEAUX_JAUNE_FACTEUR) et n'attaquent pas ; un dépassement
//   dans la zone (jamais d'une voiture à l'arrêt) coûte DRAPEAUX_PENALITE s, une fois par drapeau et par pilote (les IA aussi) ;
// - drapeau bleu : un retardataire (un tour de retard) qui a le meneur dans ses rétroviseurs à moins de DRAPEAUX_BLEU_DISTANCE m laisse
//   passer (le « laisser » des consignes d'équipe, ia.js) ; le joueur retardataire voit le drapeau, sans pénalité ;
// - voiture de sécurité virtuelle (VSC) : une IA arrêtée depuis DRAPEAUX_VSC_ARRET s la déclenche ; tout le monde ralentit (× DRAPEAUX_VSC_FACTEUR,
//   les écarts restent ceux d'avant), le joueur est limité à DRAPEAUX_VSC_LIMITE_JOUEUR m/s (gaz coupé au-dessus), pas de dépassement ;
//   elle dure entre DRAPEAUX_VSC_DUREE[0] et [1] s, au plus DRAPEAUX_VSC_MAX fois par course, DRAPEAUX_VSC_PAUSE s d'écart ; drapeau vert ensuite.
// DRAPEAUX_ACTIFS faux (ou e.sansDrapeaux : la découverte, le tutoriel, le mode à deux) : la course d'avant, au bit près.
const DRAPEAUX = (function () {
  const R = REGLAGES;

  function creer() {
    return { t: -Infinity, id: 0, incidents: new Map(), zones: [], vsc: null, vscFin: -Infinity, nbVsc: 0, bleus: new Map(), evenements: [], dep: 0, punis: new Set(), joueur: null, bleuDit: new Map() };
  }
  const actif = e => !!R.DRAPEAUX_ACTIFS && !!e && !e.sansDrapeaux && e.go !== null && !!e.pilotes && e.pilotes.length >= 2 && !!e.circuit;

  // la voiture est-elle dans les stands (ou en route) : jamais un incident
  const auStand = p => !!(p.v.dansStands || p.v.campStands || p.course.arretEnCours || (p.pilote && p.pilote.stand) || (p.v.piste && p.v.piste.stands));

  // la zone jaune contient-elle cette position s (m le long de la piste) ?
  function dansZone(c, z, s) {
    const g = ecartLeLong(c, s - z.s);
    return g >= -R.DRAPEAUX_JAUNE_AVANT && g <= R.DRAPEAUX_JAUNE_APRES;
  }

  // tout rendre aux IA (le réglage coupé en route, la course finie)
  function liberer(e) {
    for (const p of e.pilotes) if (p.pilote) { p.pilote.drapeau = null; if (p.pilote.laisserBleu) { p.pilote.laisser = null; p.pilote.laisserBleu = false; } }
    e.drapeaux = null;
  }

  function pas(e, dt) {
    if (!actif(e)) { if (e && e.drapeaux) liberer(e); return; }
    const d = e.drapeaux || (e.drapeaux = creer());
    if (e.temps - d.t < R.DRAPEAUX_PERIODE - 1e-9) return;   // l'analyse tous les DRAPEAUX_PERIODE s ; ce qui est posé reste posé entre deux
    d.t = e.temps;
    analyser(e, d);
  }

  function analyser(e, d) {
    const c = e.circuit, P = e.pilotes, t = e.temps, depuisGo = t - e.go;
    // 1) les incidents : une voiture lente, arrêtée ou sortie, hors des stands, assez longtemps ; elle s'efface après DRAPEAUX_INCIDENT_FIN s de roulage
    for (const p of P) {
      const v = p.v, i = d.incidents.get(p.numero);
      const lent = p.arrivee === null && v.piste && p.course.etat === 'course' && !auStand(p) && depuisGo > R.DRAPEAUX_DEBUT
        && (Math.abs(v.u) < R.DRAPEAUX_ARRET_VITESSE || (v.surHerbe && Math.abs(v.u) < R.DRAPEAUX_HERBE_VITESSE));
      if (lent) {
        const x = i || { numero: p.numero, id: ++d.id, depuis: t, dernier: t, actif: false, stoppeDepuis: null, s: 0 };
        x.dernier = t; x.s = v.piste.s;
        if (Math.abs(v.u) < R.DRAPEAUX_ARRET_VITESSE) { if (x.stoppeDepuis === null) x.stoppeDepuis = t; } else x.stoppeDepuis = null;
        if (!x.actif && t - x.depuis >= R.DRAPEAUX_INCIDENT_DUREE) { x.actif = true; if (R.DRAPEAUX_JAUNE) d.evenements.push({ type: 'jaune', temps: t, numero: p.numero, id: x.id }); }
        if (!i) d.incidents.set(p.numero, x);
      } else if (i && (p.arrivee !== null || t - i.dernier >= R.DRAPEAUX_INCIDENT_FIN)) d.incidents.delete(p.numero);
    }
    d.zones = R.DRAPEAUX_JAUNE ? [...d.incidents.values()].filter(x => x.actif) : [];
    // 2) la VSC : une IA arrêtée depuis DRAPEAUX_VSC_ARRET s (jamais le joueur, jamais à l'arrivée) ; elle finit quand plus rien n'est arrêté, ou au plus tard
    const premierFini = P.some(p => p.arrivee !== null);
    const arretee = [...d.incidents.values()].filter(x => x.actif && x.stoppeDepuis !== null && !P[x.numero - 1].humain);
    if (R.DRAPEAUX_VSC && !d.vsc && !premierFini && d.nbVsc < R.DRAPEAUX_VSC_MAX && t - d.vscFin >= R.DRAPEAUX_VSC_PAUSE && depuisGo > R.DRAPEAUX_DEBUT
      && arretee.some(x => t - x.stoppeDepuis >= R.DRAPEAUX_VSC_ARRET) && !dernierTour(e)) {
      d.vsc = { debut: t, id: ++d.id }; d.nbVsc++;
      d.evenements.push({ type: 'vsc', temps: t, id: d.vsc.id });
    } else if (d.vsc && t - d.vsc.debut >= R.DRAPEAUX_VSC_DUREE[0] && (!arretee.length || t - d.vsc.debut >= R.DRAPEAUX_VSC_DUREE[1] || premierFini)) {
      d.vsc = null; d.vscFin = t;
      d.evenements.push({ type: 'vert', temps: t });
    } else if (d.vsc && premierFini) { d.vsc = null; d.vscFin = t; d.evenements.push({ type: 'vert', temps: t }); }
    // 3) les drapeaux bleus : un retardataire d'un tour a le meneur derrière lui, tout près
    d.bleus.clear();
    if (R.DRAPEAUX_BLEU) for (const p of P) {
      if (p.arrivee !== null || !p.v.piste || p.course.etat !== 'course' || auStand(p) || d.incidents.has(p.numero)) continue;
      let meilleur = null, gMin = R.DRAPEAUX_BLEU_DISTANCE;
      for (const q of P) {
        if (q === p || q.arrivee !== null || !q.v.piste || q.course.etat !== 'course' || auStand(q)) continue;
        const g = ecartLeLong(c, p.v.piste.s - q.v.piste.s);   // le meneur est g m derrière lui sur la piste…
        if (!(g > 0 && g <= gMin)) continue;
        if (distanceCourse(q) - distanceCourse(p) + g < c.longueur - 1) continue;   // … et il a un tour de plus que lui (sa distance + g ≥ la sienne + un tour)
        gMin = g; meilleur = q;
      }
      if (meilleur) d.bleus.set(p.numero, meilleur.numero);
    }
    // 4) ce que les IA en font
    for (const p of P) {
      if (!p.pilote) continue;
      const k = p.numero, bleu = d.bleus.get(k);
      // le bleu : « laisser » (la consigne d'équipe, ia.js) ; une consigne en cours n'est jamais écrasée
      if (bleu !== undefined && !p.humain) { if (!p.pilote.laisser || p.pilote.laisserBleu) { p.pilote.laisser = { id: P[bleu - 1].v }; p.pilote.laisserBleu = true; } }
      else if (p.pilote.laisserBleu) { p.pilote.laisser = null; p.pilote.laisserBleu = false; }
      if (p.humain) continue;
      let facteur = 1, interdit = false;
      if (p.arrivee === null && p.v.piste && !d.incidents.has(k)) {
        if (d.vsc) { facteur = R.DRAPEAUX_VSC_FACTEUR; interdit = true; }
        else for (const z of d.zones) if (z.numero !== k && dansZone(c, z, p.v.piste.s)) { facteur = R.DRAPEAUX_JAUNE_FACTEUR; interdit = true; break; }
      }
      p.pilote.drapeau = facteur < 1 || interdit ? { facteur, interdit } : null;
    }
    // 5) les dépassements interdits (les drapeaux jaunes et la VSC) : une pénalité, une seule par pilote et par drapeau
    for (; d.dep < e.depassements.length; d.dep++) {
      const x = e.depassements[d.dep];
      if (x.stand) continue;
      const qui = P[x.qui - 1], sur = P[x.sur - 1];
      if (!qui || !sur || d.incidents.has(x.sur) || d.incidents.has(x.qui) || (qui.arrivee !== null)) continue;
      let cle = null;
      if (d.vsc) cle = qui.numero + ':v' + d.vsc.id;
      else for (const z of d.zones) if (z.numero !== x.qui && z.numero !== x.sur && dansZone(c, z, x.s)) { cle = qui.numero + ':j' + z.id; break; }
      if (cle === null || d.punis.has(cle)) continue;
      d.punis.add(cle);
      qui.course.penalites += R.DRAPEAUX_PENALITE;
      d.evenements.push({ type: 'infraction', temps: t, numero: qui.numero, s: R.DRAPEAUX_PENALITE, vsc: !!d.vsc });
    }
    // 6) ce que voit le joueur (le bandeau) : la VSC, sinon le jaune de sa zone, sinon le bleu, sinon le vert qui suit la VSC
    const h = P.find(p => p.humain);
    let j = null;
    if (h && h.arrivee === null && h.v.piste) {
      if (d.vsc) j = { type: 'vsc', limite: R.DRAPEAUX_VSC_LIMITE_JOUEUR };
      else if (d.zones.some(z => z.numero !== h.numero && dansZone(c, z, h.v.piste.s))) j = { type: 'jaune' };
      else if (d.bleus.has(h.numero)) { j = { type: 'bleu', qui: d.bleus.get(h.numero) }; }
      else if (t - d.vscFin < R.DRAPEAUX_VERT_DUREE) j = { type: 'vert' };
      if (j && j.type === 'bleu' && !(t - (d.bleuDit.get(j.qui) === undefined ? -Infinity : d.bleuDit.get(j.qui)) < R.DRAPEAUX_BLEU_REPETITION)) { d.bleuDit.set(j.qui, t); d.evenements.push({ type: 'bleu', temps: t, numero: j.qui }); }
    }
    d.joueur = j;
  }

  // le leader est-il dans son dernier tour (pas de nouvelle VSC)
  function dernierTour(e) {
    let tete = null;
    for (const p of e.pilotes) if (p.arrivee === null && (tete === null || distanceCourse(p) > distanceCourse(tete))) tete = p;
    return !!tete && e.nbTours > 1 && tete.course.tours.length + 1 >= e.nbTours;
  }

  // le plafond de vitesse du joueur sous VSC (après ses commandes, avant la physique) : le gaz coupé au-dessus de la limite, un peu de frein bien au-dessus
  function limiter(e, p) {
    const d = e && e.drapeaux;
    if (!d || !d.vsc || !actif(e) || !p || !p.v) return;
    const v = p.v;
    let lim = R.DRAPEAUX_VSC_LIMITE_JOUEUR;
    // (revue du tour 55) le plafond suit la voiture qui roule devant lui (même file, moins de DRAPEAUX_VSC_SUIVI m, pas une voiture arrêtée) :
    // il ne la rattrape pas, donc ne la dépasse pas par mégarde ; une voiture arrêtée, elle, ne limite rien (il doit pouvoir la contourner)
    if (R.DRAPEAUX_VSC_SUIVI > 0 && v.piste) for (const q of e.pilotes) {
      if (q === p || q.arrivee !== null || !q.v.piste || Math.abs(q.v.u) < R.DRAPEAUX_ARRET_VITESSE * 3) continue;
      const g = ecartLeLong(e.circuit, q.v.piste.s - v.piste.s);
      if (g > 0 && g < R.DRAPEAUX_VSC_SUIVI && Math.abs(q.v.piste.d - v.piste.d) < 3) lim = Math.min(lim, q.v.u + Math.max(0, g - 10) * 0.5);
    }
    if (v.u > lim) { v.gaz = 0; if (v.u > lim * R.DRAPEAUX_VSC_FREIN_SEUIL) v.frein = Math.max(v.frein, R.DRAPEAUX_VSC_FREIN); }
  }

  // ce que le bandeau doit dire au joueur : { type: 'jaune' | 'bleu' | 'vsc' | 'vert', limite?, qui? } ou null
  function etatJoueur(e) { return e && e.drapeaux && actif(e) ? e.drapeaux.joueur : null; }

  return { creer, actif, pas, limiter, etatJoueur, liberer, dansZone };
})();
