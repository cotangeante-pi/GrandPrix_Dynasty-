// L'argent (CLAUDE.md « L'argent et les améliorations », étape 8), en calcul pur (ni Three.js ni page) : les gains d'un
// Grand Prix (la place, le meilleur tour, les places gagnées depuis la grille, le bonus du duel contre le coéquipier),
// plafonnés par course ; le solde et l'historique des gains vivent dans le championnat (ch.argent), donc dans la
// sauvegarde unique. Les objectifs de sponsors viendront à l'étape 9. Tous les montants sont dans donnees.js (ARGENT_…,
// DUEL_BONUS) ; les textes des montants dans textes.js (milliers, montant).
const ARGENT = (function () {
  const R = REGLAGES;

  // l'argent d'un championnat qui n'en a pas encore (ancienne sauvegarde) : solde 0, aucun gain
  // historique : compact, une entrée par Grand Prix [grandPrix, total, place, meilleurTour, placesGagnees, duel] (des montants),
  // ou [0, montant, raison] pour un crédit à part (crediter : l'argent de départ de la course de découverte, un sponsor…)
  function completer(ch) {
    if (!ch.argent || typeof ch.argent !== 'object') ch.argent = { solde: 0, historique: [] };
    if (typeof ch.argent.solde !== 'number') ch.argent.solde = 0;
    if (!Array.isArray(ch.argent.historique)) ch.argent.historique = [];
    return ch.argent;
  }

  // les gains du joueur pour un Grand Prix fini : lignes = le classement final (championnat.js, lignesDepuisCourse :
  // { k, place, grille, meilleurTour, classe }). Renvoie { place, meilleurTour, placesGagnees, duel, brut, total, plafonne,
  // nbPlacesGagnees } (des montants ; total = brut plafonné à ARGENT_PLAFOND_COURSE), ou null si le joueur n'est pas classé
  function gains(ch, lignes) {
    const j = ch.pilotes.find(p => p.humain), lj = lignes.find(l => l.k === j.id);
    if (!lj) return null;
    const place = R.ARGENT_PLACE[lj.place - 1] || 0;
    let meilleur = null;
    for (const l of lignes) if (l.meilleurTour !== null && l.meilleurTour !== undefined && (meilleur === null || l.meilleurTour < meilleur.meilleurTour)) meilleur = l;
    const meilleurTour = meilleur && meilleur.k === j.id ? R.ARGENT_MEILLEUR_TOUR : 0;
    const nbPlacesGagnees = Math.max(0, (lj.grille || lj.place) - lj.place);   // jamais négatif : perdre des places ne coûte rien
    const placesGagnees = nbPlacesGagnees * R.ARGENT_PLACE_GAGNEE;
    // le bonus du duel : le joueur finit devant son coéquipier (la règle du duel : classement final, non classé = perdu)
    const c = CHAMPIONNAT.coequipierDe(ch), lc = c ? lignes.find(l => l.k === c.id) : null;
    const duel = lc && CHAMPIONNAT.gagnantDuel(lj, lc).course === 0 ? R.DUEL_BONUS : 0;
    const brut = place + meilleurTour + placesGagnees + duel;
    const total = Math.min(brut, R.ARGENT_PLAFOND_COURSE);
    return { place, meilleurTour, placesGagnees, duel, brut, total, plafonne: brut > total, nbPlacesGagnees };
  }

  // le Grand Prix qui vient d'être enregistré (CHAMPIONNAT.enregistrerCourse, ch.resultats) rapporte ses gains au solde
  function encaisser(ch, lignes) {
    const a = completer(ch), g = gains(ch, lignes);
    if (!g) return null;
    a.solde += g.total;
    a.historique.push([ch.resultats.length, g.total, g.place, g.meilleurTour, g.placesGagnees, g.duel]);
    return g;
  }

  // un crédit à part (l'argent de départ de la course de découverte, plus tard un sponsor) ; raison : un mot court, gardé
  function crediter(ch, montant, raison) {
    const a = completer(ch);
    if (!(montant > 0)) return a.solde;
    a.solde += montant;
    a.historique.push([0, montant, String(raison || '')]);
    return a.solde;
  }

  // un achat (le garage) : refusé s'il manque de l'argent ; jamais de dette
  function debiter(ch, montant) {
    const a = completer(ch);
    if (!(montant >= 0) || a.solde < montant) return false;
    a.solde -= montant;
    return true;
  }

  const solde = ch => completer(ch).solde;

  // un montant en texte, dans la langue du jeu : « 12 500 € » / « €12,500 » (texte('milliers'), texte('montant'))
  function formater(n) {
    const entier = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, texte('milliers'));
    return texte('montant').replace('{n}', (n < 0 ? '−' : '') + entier);
  }

  return { completer, gains, encaisser, crediter, debiter, solde, formater };
})();
