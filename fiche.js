// La fiche d'un rival (CLAUDE.md « L'interface » : caractère, saison, historique, duels contre le joueur), en calcul pur
// (ni Three.js ni page) : les mots du caractère d'après ses nombres (seuils FICHE_SEUILS, donnees.js), sa saison, son
// historique (statistiques de carrière, meilleur classement dans ch.saisons), ses duels contre le joueur (devant / derrière
// en course, cumulés dans ch.rivaux par suivre après chaque Grand Prix ; son score comme coéquipier dans ch.duel.carriere).
const FICHE = (function () {
  const R = REGLAGES;
  const joueur = ch => ch.pilotes.find(p => p.humain);

  // les compteurs de duels contre le joueur d'une sauvegarde d'avant : recomptés sur les résultats de la saison en cours
  function completer(ch) {
    if (!ch.rivaux || typeof ch.rivaux !== 'object') {
      ch.rivaux = {};
      const j = joueur(ch);
      for (const r of ch.resultats || []) compterOrdre(ch, j, r.ordre);
    }
    return ch;
  }

  function compterOrdre(ch, j, ordre) {
    const pj = ordre.indexOf(j.id);
    if (pj < 0) return;
    ordre.forEach((k, i) => {
      if (k === j.id) return;
      const c = ch.rivaux[k] || (ch.rivaux[k] = [0, 0]);
      c[i < pj ? 0 : 1]++;   // [devant le joueur, derrière le joueur]
    });
  }

  // après un Grand Prix enregistré (CHAMPIONNAT.finirGrandPrix) : chaque rival devant ou derrière le joueur
  function suivre(ch, lignes) {
    completer(ch);
    compterOrdre(ch, joueur(ch), lignes.map(l => l.k));
    return ch.rivaux;
  }

  // les mots du caractère d'un pilote (clés de textes.js : caractere_<mot>) : rapide (facteur de rythme), régulier (petite
  // variation d'un tour à l'autre), agressif, fautif ; sinon « posé » ; le joueur : aucun
  function mots(p) {
    if (!p || p.humain || !p.caractere) return [];
    const S = R.FICHE_SEUILS, m = [];
    if ((p.rythme || 1) >= S.rapide) m.push('rapide');
    if (p.caractere.regularite <= S.regulier) m.push('regulier');
    if (p.caractere.agressivite >= S.agressif) m.push('agressif');
    if (p.caractere.erreurs >= S.fautif) m.push('fautif');
    return m.length ? m : ['pose'];
  }

  // la fiche : { pilote, mots, saison: { place, points, courses, victoires, podiums }, historique: { saisons, titres,
  // victoires, podiums, poles, meilleur }, duels: { devant, derriere, coequipier: [a, b] ou null } }
  function fiche(ch, k) {
    completer(ch);
    const p = ch.pilotes[k], cp = CHAMPIONNAT.classementPilotes(ch);
    const saison = {
      place: cp.findIndex(x => x.k === k) + 1, points: p.stats.points, courses: p.places.length,
      victoires: p.places.filter(x => x === 1).length, podiums: p.places.filter(x => x <= 3).length,
    };
    let meilleur = saison.courses ? saison.place : null;
    for (const s of ch.saisons || []) { const i = s.classement.findIndex(c => c[0] === k); if (i >= 0 && (meilleur === null || i + 1 < meilleur)) meilleur = i + 1; }
    const historique = { saisons: (p.stats.saisons || 0) + (saison.courses ? 1 : 0), titres: p.stats.titres || 0, victoires: p.stats.victoires, podiums: p.stats.podiums, poles: p.stats.poles, meilleur };
    const d = ch.rivaux[k] || [0, 0], c = ch.duel && ch.duel.carriere && ch.duel.carriere[k];
    const duels = { devant: d[0], derriere: d[1], coequipier: c ? [c.qualifs[0] + c.courses[0], c.qualifs[1] + c.courses[1]] : null };
    // la rivalité posée par l'interview (interview.js) : la dernière phrase dite sur lui, où et quand, les courses qui restent
    const rv = p.rivalite ? { courses: p.rivalite.courses, cle: p.rivalite.cle, variante: p.rivalite.variante, params: p.rivalite.params, circuit: p.rivalite.circuit, saison: p.rivalite.saison } : null;
    return { pilote: p, mots: mots(p), saison, historique, duels, rivalite: rv };
  }

  return { completer, suivre, mots, fiche };
})();
