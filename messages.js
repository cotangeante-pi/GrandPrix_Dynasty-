// Les messages de course (CLAUDE.md « L'interface » : « Rossi : meilleur tour », « pénalité 5 s »), en calcul pur (ni Three.js
// ni page) : les faits viennent du moteur, lus et jamais écrits (le meilleur tour de chaque course, les pénalités, l'arrêt au
// stand en cours) ; ils entrent dans une file, et l'écran en montre un à la fois pendant MESSAGES_DUREE secondes.
//
//   MESSAGES.creer()                       → l'état { file, vu, actuel, debut }
//   MESSAGES.observer(m, voitures)         → voitures = [{ k, meilleurTour, penalites, auxStands }] : les faits nouveaux entrent dans la file
//   MESSAGES.afficher(m, t)                → le message à montrer à l'instant t (s), ou null ; { type, k, temps | s }
const MESSAGES = (function () {
  const R = REGLAGES;

  function creer() {
    return { file: [], vu: { meilleur: null, penalites: [], stands: [] }, actuel: null, debut: 0 };
  }

  function pousser(m, msg) {
    m.file.push(msg);
    while (m.file.length > R.MESSAGES_FILE_MAX) m.file.shift();   // les plus vieux partent : on ne montre pas un fait vieux de 20 s
  }

  function observer(m, voitures) {
    // le meilleur tour de la course : un nouveau temps plus petit que tous ceux d'avant
    let meilleur = null;
    for (const v of voitures) if (typeof v.meilleurTour === 'number' && (meilleur === null || v.meilleurTour < meilleur.meilleurTour)) meilleur = v;
    if (meilleur && (m.vu.meilleur === null || meilleur.meilleurTour < m.vu.meilleur)) {
      m.vu.meilleur = meilleur.meilleurTour;
      pousser(m, { type: 'meilleurTour', k: meilleur.k, temps: meilleur.meilleurTour });
    }
    for (const v of voitures) {
      const avant = m.vu.penalites[v.k] || 0;
      if (v.penalites > avant) pousser(m, { type: 'penalite', k: v.k, s: v.penalites - avant });
      m.vu.penalites[v.k] = v.penalites;
      if (v.auxStands && !m.vu.stands[v.k]) pousser(m, { type: 'stands', k: v.k });
      m.vu.stands[v.k] = !!v.auxStands;
    }
    return m;
  }

  // la météo (meteo3d.js, l'état de meteo.js) : « La pluie arrive » quand la pluie passe MESSAGES_PLUIE_SEUIL, « La piste sèche » quand
  // l'eau d'une piste mouillée redescend sous MESSAGES_SECHE_SEUIL ; e : { pluie, eau } ou null (rien)
  function observerMeteo(m, e) {
    if (!e) return m;
    const vu = m.vu.meteo || (m.vu.meteo = { pluie: false, mouillee: false });
    const pleut = e.pluie > R.MESSAGES_PLUIE_SEUIL;
    if (pleut && !vu.pluie) pousser(m, { type: 'pluieArrive' });
    vu.pluie = pleut;
    if (e.eau >= R.MESSAGES_SECHE_SEUIL * 2) vu.mouillee = true;
    if (vu.mouillee && e.eau < R.MESSAGES_SECHE_SEUIL && !pleut) { pousser(m, { type: 'pisteSeche' }); vu.mouillee = false; }
    return m;
  }

  function afficher(m, t) {
    if (m.actuel && t - m.debut < R.MESSAGES_DUREE) return m.actuel;
    m.actuel = m.file.length ? m.file.shift() : null;
    m.debut = t;
    return m.actuel;
  }

  return { creer, observer, observerMeteo, afficher };
})();
