// Le courrier des pilotes (Codeur 3, étape 12b, CLAUDE.md « Les discussions avec les pilotes et les écuries ») : calcul pur, sans
// écran. Après chaque Grand Prix, les pilotes t'écrivent d'eux-mêmes quand quelque chose a changé : un contact, un dépassement, une
// rivalité, ton coéquipier après le duel, un rival qui te demande la pareille promise, une menace restée sans suite, un ami qui te
// félicite… Une quinzaine de sujets, chacun avec sa condition (lue dans le championnat, jamais inventée) et son urgence ; les plus
// urgents passent d'abord, au plus COURRIER_PAR_GP messages par Grand Prix, et un même sujet ne revient pas chez le même pilote avant
// COURRIER_OUBLI Grands Prix (la mémoire des sujets). Ouvrir un message ouvre la discussion avec son auteur (discussion.js).
const COURRIER_PILOTES = (function () {
  const R = REGLAGES;
  const joueur = ch => ch.pilotes.find(p => p.humain);

  function completer(ch) {
    if (!ch.courrier || typeof ch.courrier !== 'object') ch.courrier = { messages: [], vus: {} };
    if (!Array.isArray(ch.courrier.messages)) ch.courrier.messages = [];
    if (!ch.courrier.vus || typeof ch.courrier.vus !== 'object') ch.courrier.vus = {};
    return ch.courrier;
  }
  const indice = ch => (ch.saison - 1) * R.NB_GRANDS_PRIX + ch.resultats.length;   // un compteur de Grands Prix sur toute la carrière

  // --- les sujets : { cle, urgence, auteurs(ch, f) → [k…] } ; f = les faits du Grand Prix qui vient de finir
  const SUJETS = [
    // un contact avec toi : il est furieux (fougueux) ou il veut en parler
    { cle: 'contact', urgence: 10, auteurs: (ch, f) => f.contact !== null ? [f.contact] : [] },
    // une promesse que tu lui as faite : il te demande la pareille (ta réponse, dans la discussion, la tient ou la trahit)
    { cle: 'promesse', urgence: 9, auteurs: ch => ch.pilotes.filter(p => p.memoire && p.memoire.promesse && p.memoire.promesse.etat === 'ouverte'
      && (p.memoire.promesse.saison < ch.saison || p.memoire.promesse.gp < ch.resultats.length) && !(p.memoire.demande && p.memoire.demande.type === 'tenir')).map(p => p.id) },
    // une rivalité toute neuve (l'interview ou une discussion) : il te prévient
    { cle: 'rivalite', urgence: 8, auteurs: ch => ch.pilotes.filter(p => p.rivalite && p.rivalite.saison === ch.saison && p.rivalite.gp >= ch.resultats.length - 1).map(p => p.id) },
    // ton coéquipier, quand le duel penche nettement d'un côté
    { cle: 'duelPerdu', urgence: 7, auteurs: (ch, f) => f.duel && f.duel.coequipier !== null && f.duel.ecart <= -R.COURRIER_DUEL_NET ? [f.duel.coequipier] : [] },
    { cle: 'duelGagne', urgence: 6, auteurs: (ch, f) => f.duel && f.duel.coequipier !== null && f.duel.ecart >= R.COURRIER_DUEL_NET ? [f.duel.coequipier] : [] },
    // tu l'as dépassé et il ne l'a pas digéré (fougueux) ou il salue la manœuvre
    { cle: 'depasse', urgence: 5, auteurs: (ch, f) => f.depasse !== null ? [f.depasse] : [] },
    // une menace restée sans suite (DISCUSSION.apresGrandPrix lui a fait perdre du crédit) : il se moque
    { cle: 'menaceVide', urgence: 5, auteurs: ch => ch.pilotes.filter(p => p.memoire && p.memoire.credit < 0 && p.memoire.creditVu !== p.memoire.credit).map(p => p.id) },
    // ta victoire ou ton podium : un pilote qui t'aime bien te félicite
    { cle: 'bravo', urgence: 4, auteurs: (ch, f) => f.place && f.place <= 3 ? amis(ch).slice(0, 1) : [] },
    // ton Grand Prix à domicile arrive au prochain : un ami t'encourage
    { cle: 'domicile', urgence: 4, auteurs: ch => { const j = joueur(ch), gp = ch.calendrier[ch.resultats.length]; return gp && j.coeur && gp.circuit === j.coeur ? amis(ch).slice(0, 1) : []; } },
    // une série sans point : ton coéquipier, s'il t'aime bien, te remonte le moral
    { cle: 'courage', urgence: 3, auteurs: (ch, f) => { const c = CHAMPIONNAT.coequipierDe(ch); return f.serie && c && (c.memoire ? c.memoire.relation : 0) >= 0 ? [c.id] : []; } },
    // une relation tendue, et tu as fini devant lui : il est jaloux
    { cle: 'jaloux', urgence: 3, auteurs: (ch, f) => ch.pilotes.filter(p => !p.humain && p.memoire && p.memoire.relation <= -R.DISCUSSION_ENNEMI && f.ordre.indexOf(p.id) > f.ordre.indexOf(joueur(ch).id)).map(p => p.id).slice(0, 1) },
    // un rival en tête du championnat te nargue (jamais un ami)
    { cle: 'leader', urgence: 2, auteurs: ch => { const cl = CHAMPIONNAT.classementPilotes(ch), k = cl[0] && cl[0].k, p = ch.pilotes[k]; return p && !p.humain && ch.resultats.length >= R.COURRIER_LEADER_DES && !(p.memoire && p.memoire.relation >= R.DISCUSSION_AMI) ? [k] : []; } },
    // un vieux pilote proche de la retraite : un mot, une fois
    { cle: 'vieux', urgence: 1, auteurs: ch => ch.pilotes.filter(p => !p.humain && typeof p.age === 'number' && p.age >= R.COURRIER_AGE_VIEUX && p.memoire && p.memoire.relation >= 0).map(p => p.id).slice(0, 1) },
    // le premier Grand Prix de la saison : ton coéquipier se présente
    { cle: 'bienvenue', urgence: 1, auteurs: ch => { const c = CHAMPIONNAT.coequipierDe(ch); return ch.resultats.length === 1 && c ? [c.id] : []; } },
  ];
  const amis = ch => ch.pilotes.filter(p => !p.humain && p.memoire && p.memoire.relation >= R.DISCUSSION_AMI).sort((a, b) => b.memoire.relation - a.memoire.relation).map(p => p.id);

  // les faits du Grand Prix qui vient de finir : ta place, l'ordre, le contact et le dépassement (l'interview), le duel, une série
  function faitsDu(ch) {
    const r = ch.resultats[ch.resultats.length - 1], j = joueur(ch);
    const d = ch.interview && ch.interview.derniere, fg = d && d.saison === ch.saison && d.gp === ch.resultats.length && d.faitsGP ? d.faitsGP : {};
    const sd = CHAMPIONNAT.scoreDuel(ch);
    const places = j.places.slice(-R.INTERVIEW_SERIE);
    return { ordre: r ? r.ordre : [], place: r ? r.ordre.indexOf(j.id) + 1 : null, contact: fg.contact === undefined ? null : fg.contact, depasse: fg.depasse === undefined ? null : fg.depasse,
      duel: sd ? { coequipier: sd.k, ecart: sd.total[0] - sd.total[1] } : null,
      serie: places.length === R.INTERVIEW_SERIE && places.every(x => CHAMPIONNAT.pointsPour(x) === 0) };
  }

  // après chaque Grand Prix enregistré : les sujets qui se posent, du plus urgent au moins urgent, sans redite, COURRIER_PAR_GP au plus
  function apresGrandPrix(ch) {
    const c = completer(ch), f = faitsDu(ch), n = indice(ch), nouveaux = [];
    for (const s of SUJETS) {
      for (const k of s.auteurs(ch, f)) {
        const p = ch.pilotes[k];
        if (!p || p.humain || nouveaux.some(m => m.k === k)) continue;
        const vu = c.vus[s.cle + ':' + k];
        if (vu !== undefined && n - vu < R.COURRIER_OUBLI) continue;
        nouveaux.push({ k, sujet: s.cle, urgence: s.urgence });
      }
    }
    nouveaux.sort((a, b) => b.urgence - a.urgence);
    for (const m of nouveaux.slice(0, R.COURRIER_PAR_GP)) {
      const p = ch.pilotes[m.k], fougueux = (p.caractere ? p.caractere.agressivite : 0.5) >= R.DISCUSSION_FOUGUEUX;
      const ton = ['contact', 'depasse'].includes(m.sujet) ? (fougueux ? '_colere' : '_calme') : '';
      c.messages.push({ k: m.k, sujet: m.sujet, cle: 'courrier_' + m.sujet + ton, saison: ch.saison, gp: ch.resultats.length, lu: false });
      c.vus[m.sujet + ':' + m.k] = n;
      if (m.sujet === 'promesse' && typeof DISCUSSION !== 'undefined') DISCUSSION.demanderPromesse(ch, m.k);
      if (m.sujet === 'menaceVide' && p.memoire) p.memoire.creditVu = p.memoire.credit;
    }
    if (c.messages.length > R.COURRIER_MAX) c.messages.splice(0, c.messages.length - R.COURRIER_MAX);
    return nouveaux.slice(0, R.COURRIER_PAR_GP).map(m => m.sujet);
  }

  const nonLus = ch => (ch.courrier && Array.isArray(ch.courrier.messages) ? ch.courrier.messages.filter(m => !m.lu).length : 0);
  // le texte d'un message : sa clé (courrier_<sujet>[_ton]) avec le nom du joueur, de l'auteur et le circuit du Grand Prix
  function texteDe(ch, m, noms) {
    const p = ch.pilotes[m.k], gp = ch.calendrier[m.gp - 1], prochain = ch.calendrier[m.gp];
    const v = { nom: noms.pilote(joueur(ch)), lui: noms.pilote(p), circuit: gp ? texte('circuit_' + gp.circuit) || gp.circuit : '', prochain: prochain ? texte('circuit_' + prochain.circuit) || prochain.circuit : '' };
    const t = texte(m.cle);
    const phrase = (Array.isArray(t) ? t[(m.k + m.gp) % t.length] : t || '').replace(/\{(\w+)\}/g, (x, c) => v[c] !== undefined ? v[c] : x);
    return typeof elider === 'function' ? elider(phrase) : phrase;
  }
  function lire(ch, i) { const m = ch.courrier && ch.courrier.messages[i]; if (m) m.lu = true; return m || null; }

  return { completer, apresGrandPrix, nonLus, texteDe, lire, faitsDu, SUJETS: SUJETS.map(s => s.cle) };
})();
