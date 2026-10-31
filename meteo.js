// La météo (étape 12, CLAUDE.md « La météo »), en calcul pur (ni Three.js ni page). La même météo pour tous, les mêmes effets
// pour le joueur et les IA. Réglages : METEO_* dans donnees.js.
// - la prévision et le plan d'une course : tirés avec la graine du Grand Prix, selon le lieu (METEO_LIEUX) ; le plan dit la pluie au
//   départ et, peut-être, un changement à un moment tiré d'avance (une averse qui arrive, la pluie qui s'arrête) ;
// - le niveau d'eau de la piste (0 à 1) : il monte sous la pluie, baisse sans elle ; sur la trajectoire (là où les voitures passent),
//   la piste sèche plus vite ;
// - l'adhérence de chaque pneu (slick, intermédiaire, pluie) selon l'eau, et son usure (un pneu de pluie sur le sec s'use vite).
// Ce que la page et le dessin (Codeur 2) lisent : e.meteo = { plan, pluie (0 à 1, en cours), eau (0 à 1), seche (0 à 1 : la
// trajectoire plus sèche), message } ; chaque voiture : v.eau (l'eau sous elle), v.adhMeteo (le facteur d'adhérence, 1 au sec).
const METEO = (function () {
  const R = REGLAGES;
  const TYPES = ['slick', 'drift', 'inter', 'pluie'];   // (drift : le pneu sec de la voiture vivante, choisi par le joueur seulement)

  // le plan d'une course : { prevision: { type, pourcent }, debut (pluie au départ, 0 à 1), change: { t (s de course), pluie } | null }
  // tiré avec la graine du Grand Prix (+ GRAINE_METEO) ; duree : la durée estimée de la course (s). Un lieu sans réglage : toujours sec.
  function plan(nomCircuit, graine, duree) {
    const lieu = R.METEO_LIEUX[nomCircuit] || null;
    if (!lieu) return { prevision: { type: 'sec', pourcent: 0 }, debut: 0, change: null };
    ALEATOIRE.semer(graine + R.GRAINE_METEO);
    const h1 = hasard(), h2 = hasard(), h3 = hasard(), h4 = hasard();
    ALEATOIRE.semer();
    const pleut = h1 < lieu.pluie;                       // il pleut au départ
    const bascule = h2 < lieu.change;                   // un changement pendant la course (averse ou éclaircie)
    const intensite = lieu.intensite[0] + h3 * (lieu.intensite[1] - lieu.intensite[0]);
    const debut = pleut ? intensite : 0;
    const change = bascule ? { t: duree * (R.METEO_CHANGE_PART[0] + h4 * (R.METEO_CHANGE_PART[1] - R.METEO_CHANGE_PART[0])), pluie: pleut ? 0 : intensite } : null;
    // la prévision : ce qu'on sait avant (la chance qu'il pleuve à un moment de la course), jamais le moment exact
    const risque = pleut ? 100 : Math.round(100 * Math.min(1, lieu.pluie + (1 - lieu.pluie) * lieu.change));   // (il pleut déjà : 100 %)
    const type = pleut ? 'pluie' : risque >= R.METEO_RISQUE ? 'risque' : risque > 0 ? 'nuageux' : 'sec';
    return { prevision: { type, pourcent: risque }, debut, change };
  }

  // l'état de la course au départ
  function creer(p) {
    return { plan: p, pluie: p.debut, eau: p.debut > 0 ? R.METEO_EAU_DEPART : 0, seche: 0, message: null, temps: 0 };
  }

  // un pas de dt secondes : la pluie du plan (le changement à son heure), l'eau qui monte ou baisse, la trajectoire qui sèche plus vite
  function pas(m, dt) {
    m.temps += dt;
    const ch = m.plan.change;
    if (ch && !m.changeFait && m.temps >= ch.t) { m.changeFait = true; m.message = ch.pluie > 0 ? 'pluieArrive' : 'pisteSeche'; m.pluie = ch.pluie; }
    if (m.pluie > 0) { m.eau = Math.min(1, m.eau + m.pluie * R.METEO_MONTEE * dt); m.seche = Math.max(0, m.seche - R.METEO_SECHE_LIGNE * 4 * dt); }
    else { m.eau = Math.max(0, m.eau - R.METEO_BAISSE * dt); m.seche = Math.min(1, m.seche + R.METEO_SECHE_LIGNE * dt); }
    return m;
  }

  // l'eau sous une voiture : moins sur la trajectoire (à moins de METEO_LIGNE m de la ligne idéale de la carte) quand elle sèche
  function eauEn(m, surLigne) {
    if (!m || m.eau <= 0) return 0;
    return surLigne ? m.eau * (1 - R.METEO_LIGNE_SECHE * m.seche) : m.eau;
  }

  // une valeur par morceaux sur l'eau : t = [à 0, à 0,5, à 1]
  function entre(t, eau) {
    const x = Math.max(0, Math.min(1, eau));
    return x <= 0.5 ? t[0] + (t[1] - t[0]) * x * 2 : t[1] + (t[2] - t[1]) * (x - 0.5) * 2;
  }

  // le facteur d'adhérence d'un pneu selon l'eau (1 exactement pour un slick sur le sec : la physique d'aujourd'hui au bit près)
  function adherence(type, eau) {
    if (((type || 'slick') === 'slick' || type === 'drift') && eau <= 0) return 1;   // (le drift sur le sec : son effet est dans la physique, adherenceDrift)
    return entre(R.METEO_PNEUS[type || 'slick'].adherence, eau);
  }

  // le facteur d'usure d'un pneu selon l'eau (1 pour un slick ; un pneu de pluie sur le sec s'use vite)
  function usure(type, eau) {
    if ((type || 'slick') === 'slick' || type === 'drift') return 1;   // (l'usure du drift : pneus.js, USURE_DRIFT)
    return entre(R.METEO_PNEUS[type].usure, eau);
  }

  // le meilleur pneu pour une eau donnée (celui qui adhère le plus)
  function meilleurPneu(eau) {
    let mieux = 'slick';
    for (const t of TYPES) if (t !== 'drift' && adherence(t, eau) > adherence(mieux, eau)) mieux = t;   // (le drift : jamais conseillé, le joueur le choisit)
    return mieux;
  }

  // le choix d'une IA (ou le conseil au joueur), avec la même information que le joueur : l'eau qu'elle voit maintenant et la pluie
  // qui tombe (pas l'avenir) ; prudence (0 à 1, de son caractère) : un prudent passe aux pneus de pluie plus tôt et les garde plus longtemps
  function choisir(eauVue, pluieEnCours, prudence) {
    const p = Math.max(0, Math.min(1, prudence === undefined ? 0.5 : prudence));
    // il regarde un peu devant : sous la pluie, l'eau va monter ; sans elle, elle va baisser (ce qu'on voit, pas une prévision exacte)
    const attendue = Math.max(0, Math.min(1, eauVue + (pluieEnCours > 0 ? 1 : -1) * R.METEO_ANTICIPE * (0.5 + p)));
    return meilleurPneu(attendue);
  }

  // --- le contrat avec le dessin (Codeur 2) ---
  // l'état du ciel d'une course (e, le plateau de simulation.js, ou son e.meteo) : { pluie (0 à 1, ce qui tombe), eau (0 à 1, la piste),
  // ciel (0 à 1, la couverture nuageuse : la pluie, sinon ce que la prévision annonçait) } ; sans météo : tout à 0
  const CIEL = { sec: 0.1, nuageux: 0.45, risque: 0.65, pluie: 0.9 };
  function etat(course) {
    const m = course && course.meteo !== undefined ? course.meteo : course;
    if (!m || !m.plan) return { pluie: 0, eau: 0, ciel: 0 };
    const base = CIEL[m.plan.prevision.type] || 0;
    return { pluie: m.pluie, eau: m.eau, eauTrajectoire: eauEn(m, true), ciel: m.pluie > 0 ? Math.max(base, 0.8 + 0.2 * m.pluie) : base };   // (eauTrajectoire : l'eau sur la ligne idéale, plus sèche après la pluie)
  }

  // la graine météo du Grand Prix gp (0 = le premier) d'un championnat : la même pour la prévision au paddock et pour la course
  function graineGP(ch, gp) {
    return (ch.graine || 1) * 1000 + (ch.saison || 1) * 100 + gp;
  }

  // la prévision du Grand Prix gp (0 = le premier) d'un championnat : { type: 'sec' | 'nuageux' | 'risque' | 'pluie', risque: 0 à 100 }
  function prevision(ch, gp) {
    const g = ch && ch.calendrier && ch.calendrier[gp];
    if (!g) return { type: 'sec', risque: 0 };
    const p = plan(g.circuit, graineGP(ch, gp), 1).prevision;
    return { type: p.type, risque: p.pourcent };
  }

  return { TYPES, plan, creer, pas, eauEn, adherence, usure, meilleurPneu, choisir, etat, graineGP, prevision };
})();
