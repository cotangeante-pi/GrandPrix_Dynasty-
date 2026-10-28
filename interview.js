// L'interview d'après course (CLAUDE.md « L'interview d'après course »), en calcul pur (ni Three.js ni page) : après chaque
// Grand Prix, au plus une question, choisie parmi les faits de la course par priorité (INTERVIEW_PRIORITES), avec plusieurs
// formulations tirées avec la graine (jamais la même deux fois de suite) ; trois réponses avec un ton (provocant, calme,
// malin) ou « pas de commentaire » (sans effet) ; la réputation (trois jauges 0–100 : public, écurie, sponsors ; ch.reputation)
// bouge d'un petit pas (INTERVIEW_EFFETS, plafonné par INTERVIEW_PAS) ; l'écurie est la confiance de saisons.js
// (ch.confiance) ; les sponsors pèsent sur sponsors.js ; une réponse provocante contre un rival nommé pose une rivalité sur
// lui (ch.pilotes[k].rivalite : courses restantes et la phrase ; son pilotage est l'affaire de ia.js), une calme l'apaise.
// Tous les textes dans textes.js (interview_<fait>_q : les formulations ; interview_<fait>_<ton> : les réponses).
const INTERVIEW = (function () {
  const R = REGLAGES;
  const joueur = ch => ch.pilotes.find(p => p.humain);
  const TONS = ['provocant', 'calme', 'malin'];
  const JAUGES = ['public', 'ecurie', 'sponsors'];
  const borne = x => Math.max(0, Math.min(100, x));

  // la réputation et l'interview d'un championnat qui n'en a pas (ancienne sauvegarde) : les jauges à 50, aucune question posée
  function completer(ch) {
    if (!ch.reputation || typeof ch.reputation !== 'object') ch.reputation = {};
    for (const j of JAUGES) if (typeof ch.reputation[j] !== 'number') ch.reputation[j] = R.REPUTATION_DEPART; else ch.reputation[j] = borne(ch.reputation[j]);
    if (!ch.interview || typeof ch.interview !== 'object') ch.interview = { derniere: null, variantes: {} };
    if (ch.interview.derniere === undefined) ch.interview.derniere = null;
    if (!ch.interview.variantes) ch.interview.variantes = {};
    ch.confiance = ch.reputation.ecurie;   // la confiance de l'écurie (saisons.js, les contrats) est la jauge « écurie »
    return ch;
  }

  // les faits d'un classement final (lignes de lignesDepuisCourse, AVANT l'enregistrement du Grand Prix) : { fait: paramètres }.
  // rival : l'indice d'un pilote nommé ; le gros contact : le moteur garde la plus forte vitesse de choc de chaque voiture
  // (v.chocMax), pas la paire : le rival nommé est celui qui a le plus gros choc de la course, quand le joueur en a eu un aussi
  function faits(ch, lignes) {
    const j = joueur(ch), lj = lignes.find(l => l.k === j.id);
    const circuit = ch.calendrier[ch.prochain] ? ch.calendrier[ch.prochain].circuit : 'test';
    if (!lj) return { moyen: { pilote: j.id, place: 0, circuit } };
    const f = {}, place = lj.place, base = { pilote: j.id, place, circuit };
    // le Grand Prix à domicile (CLAUDE.md « Le Grand Prix à domicile ») : la course de cœur du joueur (pilote.js : j.coeur) ; ses propres
    // questions, prioritaires sur les faits ordinaires (INTERVIEW_PRIORITES)
    if (j.coeur && circuit === j.coeur) f[place <= R.DOMICILE_FETE_PLACE ? 'domicileFete' : 'domicileDecu'] = base;
    if (place === 1) f.victoire = base;
    else if (place <= 3) f.podium = base;
    if ((lj.chocMax || 0) >= R.INTERVIEW_CHOC) {
      const autre = lignes.filter(l => l.k !== j.id && (l.chocMax || 0) >= R.INTERVIEW_CHOC).sort((a, b) => b.chocMax - a.chocMax)[0];
      if (autre) f.contact = { pilote: j.id, rival: autre.k, circuit };
    }
    const gagnees = (lj.grille || place) - place;
    if (gagnees >= R.INTERVIEW_DEPASSEMENT_PLACES) {
      const derriere = lignes.find(l => l.place === place + 1 && !ch.pilotes[l.k].humain);
      if (derriere) f.depassement = { pilote: j.id, rival: derriere.k, n: gagnees, place, circuit };   // (place : « … pour la P{place} », la question l'utilise)
    }
    if (lj.penalites > 0) f.penalite = Object.assign({ secondes: lj.penalites }, base);
    const c = CHAMPIONNAT.coequipierDe(ch), lc = c ? lignes.find(l => l.k === c.id) : null;
    if (lc) {   // le duel contre le coéquipier, quand l'écart de la saison (cette course comprise) est net
      const g = CHAMPIONNAT.gagnantDuel(lj, lc).course, sc = CHAMPIONNAT.scoreDuel(ch);
      const a = (sc ? sc.total[0] : 0) + (g === 0 ? 1 : 0), b = (sc ? sc.total[1] : 0) + (g === 1 ? 1 : 0);
      if (g === 0 && a - b >= R.INTERVIEW_DUEL_NET) f.duelGagne = { pilote: j.id, rival: c.id, circuit };
      else if (g === 1 && b - a >= R.INTERVIEW_DUEL_NET) f.duelPerdu = { pilote: j.id, rival: c.id, circuit };
    }
    const avant = j.places.slice(-(R.INTERVIEW_SERIE - 1));
    if (avant.length === R.INTERVIEW_SERIE - 1 && avant.every(x => CHAMPIONNAT.pointsPour(x) === 0) && CHAMPIONNAT.pointsPour(place) === 0) f.serie = Object.assign({ n: R.INTERVIEW_SERIE }, base);
    f.moyen = base;
    return f;
  }

  // la question du Grand Prix qui vient de finir : { gp, fait, variante, params, rival, reponses: [{ ton, cle }] } ; la variante
  // (formulation) tirée avec la graine, jamais la même que la dernière fois pour ce fait
  function question(ch, lignes) {
    completer(ch);
    const F = faits(ch, lignes), fait = R.INTERVIEW_PRIORITES.find(k => F[k]) || 'moyen', params = F[fait];
    const nb = TEXTES.en['interview_' + fait + '_q'].length, eviter = ch.interview.variantes[fait];
    ALEATOIRE.semer(ch.graine + R.GRAINE_INTERVIEW + ch.saison * 1000 + ch.prochain * 13);
    let variante = Math.floor(hasard() * nb);
    if (eviter !== undefined && variante === eviter && nb > 1) variante = (variante + 1) % nb;
    ALEATOIRE.semer();
    // (les discussions, discussion.js : qui t'a touché et qui tu as dépassé à cette course, gardés avec la réponse)
    const faitsGP = { contact: F.contact ? F.contact.rival : null, depasse: F.depassement ? F.depassement.rival : null };
    return { gp: ch.prochain + 1, saison: ch.saison, fait, variante, params, rival: params.rival !== undefined ? params.rival : null, faitsGP,
      reponses: TONS.map(ton => ({ ton, cle: 'interview_' + fait + '_' + ton })) };
  }

  // la ligne d'effet de l'écran : { cle, params } ; « pas de commentaire » : null
  function ligneEffet(q, ton) {
    if (!ton) return null;
    const rival = q.rival !== null && q.rival !== undefined;
    if (ton === 'provocant') return { cle: rival ? 'effetProvocantRival' : 'effetProvocant', params: { rival: q.rival } };
    if (ton === 'calme') return { cle: rival ? 'effetCalmeRival' : 'effetCalme', params: { rival: q.rival } };
    return { cle: 'effetMalin', params: {} };
  }

  // la réponse du joueur : ton = 'provocant' | 'calme' | 'malin', ou null (pas de commentaire : rien ne change). Les jauges
  // bougent selon INTERVIEW_EFFETS (chaque pas plafonné à ±INTERVIEW_PAS, les jauges entre 0 et 100), la confiance de
  // l'écurie suit, la rivalité est posée (provocant) ou apaisée (calme) sur le rival nommé ; la question est notée
  // (ch.interview.derniere : le journal y lit la phrase). Renvoie { effets: { jauge: pas }, rivalite: 'nouvelle' | 'apaisee' | null, ligne }
  function repondre(ch, q, ton) {
    completer(ch);
    const effets = {};
    let rivalite = null;
    if (ton && TONS.includes(ton)) {
      const E = R.INTERVIEW_EFFETS[ton] || {};
      for (const j of JAUGES) {
        if (!E[j]) continue;
        const pas = Math.max(-R.INTERVIEW_PAS, Math.min(R.INTERVIEW_PAS, E[j]));
        const avant = ch.reputation[j];
        ch.reputation[j] = borne(avant + pas);
        effets[j] = ch.reputation[j] - avant;
      }
      ch.confiance = ch.reputation.ecurie;
      const k = q.rival;
      if (k !== null && k !== undefined && ch.pilotes[k] && !ch.pilotes[k].humain) {
        if (ton === 'provocant') {
          ch.pilotes[k].rivalite = { courses: R.INTERVIEW_RIVALITE_COURSES, gp: q.gp, saison: q.saison, cle: 'interview_' + q.fait + '_provocant', params: q.params,
            circuit: ch.calendrier[q.gp - 1] ? ch.calendrier[q.gp - 1].circuit : null };
          rivalite = 'nouvelle';
        } else if (ton === 'calme' && ch.pilotes[k].rivalite) { delete ch.pilotes[k].rivalite; rivalite = 'apaisee'; }
      }
    } else ton = null;
    ch.interview.derniere = { gp: q.gp, saison: q.saison, fait: q.fait, ton, rival: q.rival, variante: q.variante, params: q.params, faitsGP: q.faitsGP || null };
    ch.interview.variantes[q.fait] = q.variante;
    return { effets, rivalite, ligne: ligneEffet(q, ton) };
  }

  // après chaque Grand Prix enregistré (CHAMPIONNAT.finirGrandPrix) : les rivalités s'usent d'une course (celle posée à ce
  // Grand Prix ne compte pas encore) et s'éteignent à 0
  function suivre(ch) {
    for (const p of ch.pilotes) {
      if (!p.rivalite) continue;
      if (p.rivalite.saison === ch.saison && p.rivalite.gp >= ch.resultats.length) continue;
      p.rivalite.courses--;
      if (p.rivalite.courses <= 0) delete p.rivalite;
    }
    return ch;
  }

  // la part des sponsors qui vient de la réputation (sponsors.js) : de −INTERVIEW_EFFET_SPONSORS à +INTERVIEW_EFFET_SPONSORS
  function effetSponsors(ch) {
    const s = ch.reputation && typeof ch.reputation.sponsors === 'number' ? ch.reputation.sponsors : R.REPUTATION_DEPART;
    return Math.max(-R.INTERVIEW_EFFET_SPONSORS, Math.min(R.INTERVIEW_EFFET_SPONSORS, (s - 50) / 50 * R.INTERVIEW_EFFET_SPONSORS));
  }

  // une phrase de l'interview dans la langue du jeu : la clé (un tableau de formulations : la variante, sinon le texte), ses
  // paramètres remplacés (pilote, rival, coequipier : le nom du pilote ; circuit : son nom ; le reste tel quel) ;
  // noms : { pilote(p) } de l'affichage, sinon la règle de textes.js (comme journal.js)
  function phrase(cle, variante, params, ch, noms) {
    const nomPilote = noms && noms.pilote ? noms.pilote : (p => p.nom || (p.humain ? texte('nomJoueur') : texte('pilote').replace('{n}', p.numero)));
    let t = texte(cle);
    if (Array.isArray(t)) t = t[Math.min(variante || 0, t.length - 1)];
    return elider(String(t).replace(/\{(\w+)\}/g, (m, k) => {
      const x = params ? params[k] : undefined;
      if (x === undefined || x === null) return m;
      if (k === 'pilote' || k === 'rival' || k === 'coequipier') return nomPilote(ch.pilotes[x]);
      if (k === 'circuit') return texte('circuit_' + x) || (CIRCUITS[x] ? CIRCUITS[x].nom : x);
      return String(x);
    }));   // (« d’Alex » : textes.js, elider)
  }

  // les clés de texte que l'interview demande (tests : toutes dans les deux langues)
  function cles() {
    const c = ['interviewTitre', 'interviewJournaliste', 'interviewPasCommentaire', 'tonProvocant', 'tonCalme', 'tonMalin', 'effetProvocant', 'effetProvocantRival', 'effetCalme', 'effetCalmeRival', 'effetMalin',
      'reputationPublic', 'reputationEcurie', 'reputationSponsors', 'ficheRivalite'];
    for (const f of R.INTERVIEW_PRIORITES) { c.push('interview_' + f + '_q'); for (const t of TONS) c.push('interview_' + f + '_' + t); }
    return c;
  }

  return { TONS, JAUGES, completer, faits, question, repondre, suivre, ligneEffet, effetSponsors, phrase, cles };
})();
