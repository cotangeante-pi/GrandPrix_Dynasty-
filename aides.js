// Les aides au premier usage (CLAUDE.md « Les aides au premier usage (le tutoriel) », étape 11b, Codeur 4), en calcul pur, sans écran.
// Pas de tutoriel au début : une bulle courte la première fois qu'on rencontre chaque système, au moment où il sert, une seule fois.
// - LISTE : les aides, dans l'ordre de priorité ; chacune a sa condition (quand), lue dans l'état du jeu sans rien y changer, et
//   ce qui la ferme d'elle-même (faite : l'action est faite) ; genre 'course' = seulement en ligne droite ou à l'arrêt (jamais dans
//   un virage ni pendant un freinage), genre 'menu' = sur un écran entre les courses ;
// - situation(jeu, circuit, meteo) : ce que les conditions lisent, tiré de l'état du jeu (JEU de principal.js) ;
// - creer(vues), pas(e, s, dt), fermer(e), revoir(e) : la bulle de l'instant ; les aides vues sont gardées à la racine de la sauvegarde
//   (sauvegarde.js : aides, ecrireAides), elles survivent à une nouvelle carrière ; « Revoir les aides » les remet toutes.
// Tous les textes sont dans textes.js (aide_<id>), l'affichage dans interface.js (AIDES_ECRAN).
const AIDES = (function () {
  const R = REGLAGES;
  // une course où les aides de course ont leur place : ni à deux (l'écran est coupé), ni au tournoi chrono (le fantôme y est celui du
  // leader), ni après l'arrivée du joueur ; pendant le premier tour de la découverte, ses propres aides (↑ ← → ↓) restent seules
  const enCourse = s => s.ecran === 'course' && !s.deux && !s.tournoi && !s.attente && !s.aidesDecouverte;
  const LISTE = [
    // les premiers feux : la jauge du départ (la voiture est tenue sur place, donc « à l'arrêt ») ; fermée à l'extinction. Pas dans la
    // course de découverte, qui a déjà ses aides et la ligne d'aide de la jauge : elle vient à la première course de la carrière
    { id: 'depart', genre: 'course', quand: s => enCourse(s) && s.feux && s.compte && !s.decouverte, faite: s => !s.compte },
    // la première qualification : l'écran du choix (faire son tour ou passer)
    { id: 'qualif', genre: 'menu', quand: s => s.ecran === 'qualif' && s.qualif === 'choix' && !s.tournoi, faite: () => false },
    // le fantôme : pendant le premier tour de qualification qui en a un (en ligne droite)
    { id: 'fantome', genre: 'course', quand: s => s.ecran === 'qualif' && s.qualif === 'tour' && s.fantome && !s.tournoi && !s.deux, faite: () => false },
    // le premier arrêt obligatoire : pendant le tour où il est conseillé (et après, tant qu'il n'est pas fait) ; fermée dans la voie
    { id: 'stand', genre: 'course', quand: s => enCourse(s) && s.etat === 'course' && !!s.arretConseille && !s.arretFait && s.tour + 1 >= s.arretConseille, faite: s => s.dansStands || s.arretFait },
    // la première pluie : passer aux pneus pluie au prochain arrêt ; fermée dans la voie des stands
    { id: 'pluie', genre: 'course', quand: s => enCourse(s) && s.etat === 'course' && s.eau >= R.AIDES_PLUIE_EAU, faite: s => s.dansStands },
    // la première consigne d'équipe qui vise le joueur, tant qu'il n'a pas répondu
    { id: 'consigne', genre: 'course', quand: s => enCourse(s) && s.consigne, faite: s => !s.consigne },
    // les écrans entre les courses : le garage, l'aileron, le duel au paddock, les contrats, l'interview
    { id: 'garage', genre: 'menu', quand: s => s.ecran === 'garage', faite: () => false },
    { id: 'aileron', genre: 'menu', quand: s => s.ecran === 'aileron', faite: () => false },
    { id: 'duel', genre: 'menu', quand: s => s.ecran === 'championnat' && s.coequipier && !s.choixAides, faite: () => false },   // (le choix des aides ouvert par-dessus : sa bulle à lui)
    { id: 'contrats', genre: 'menu', quand: s => s.ecran === 'contrats', faite: () => false },
    { id: 'interview', genre: 'menu', quand: s => s.ecran === 'interview', faite: () => false },
    // (tour 37g, Codeur 3) la voiture « vivante » des niveaux expert et légende : la première course, en ligne droite (l'arrière peut
    // glisser si l'on freine en braquant : freiner droit, puis tourner)
    { id: 'vivante', genre: 'course', quand: s => enCourse(s) && s.etat === 'course' && s.niveauDur, faite: () => false },
    // (tour 37g) la première fois qu'on ouvre le choix des aides au pilotage (interface.js, ouvrirAides) : ce que fait chaque aide, le bonus
    { id: 'choixAides', genre: 'menu', quand: s => s.choixAides, faite: () => false },
  ];
  const PAR_ID = {};
  for (const a of LISTE) PAR_ID[a.id] = a;

  // la plus forte courbure (1/m) de la piste, de la voiture à AIDES_DROITE_DEVANT mètres devant (0 sans circuit ou sans position)
  function courbureDevant(c, v) {
    if (!c || !c.courbure || !v || !v.piste || typeof v.piste.indice !== 'number') return 0;
    const n = Math.ceil(R.AIDES_DROITE_DEVANT / c.pas);
    let pire = 0;
    for (let k = 0; k <= n; k++) pire = Math.max(pire, Math.abs(c.courbure[(v.piste.indice + k) % c.nb]));
    return pire;
  }

  // ce que les conditions lisent, tiré de l'état du jeu sans rien y changer ; meteo : { pluie, eau } (METEO3D.etat) ou null
  function situation(J, circuit, meteo) {
    const c = J.course, q = J.qualif;
    const tourQualif = J.ecran === 'qualif' && !!q && q.etat === 'tour';
    const v = tourQualif && q.v ? q.v : J.joueur;
    return {
      ecran: J.ecran,
      deux: !!J.deux, tournoi: !!J.tournoi, decouverte: !!J.decouverte, attente: !!J.attente,
      aidesDecouverte: !!(J.decouverte && c && c.tours && c.tours.length < 1 && c.etat !== 'compte'),
      feux: !!(c && c.feux), compte: !!(c && c.etat === 'compte'), etat: c ? c.etat : null,
      qualif: q ? q.etat : null,
      fantome: !!(J.fantome && J.fantome.rejeu && J.fantome.visible !== false),
      arretConseille: c && c.arretConseille ? c.arretConseille : null,
      arretFait: !!(c && ((c.arrets && c.arrets.length) || c.arretEnCours)),
      tour: c && c.tours ? c.tours.length : 0,
      dansStands: !!(v && v.dansStands),
      consigne: !!(c && c.consigne && c.consigne.joueur && !c.consigne.resultat),
      eau: meteo ? Math.max(meteo.eau || 0, meteo.pluie || 0) : 0,
      coequipier: !!J.championnat,
      vitesse: v ? Math.abs(v.u) : 0, frein: v ? v.frein || 0 : 0, direction: v ? v.direction || 0 : 0,
      courbure: courbureDevant(circuit, v),
      niveauDur: R.NIVEAU === 'expert' || R.NIVEAU === 'legende', choixAides: !!J.choixAides,
    };
  }

  // la voiture est à l'arrêt, ou en ligne droite (la piste reste droite devant elle) sans freiner ni tourner le volant
  function libre(s) {
    if (s.vitesse <= R.AIDES_ARRET_VITESSE) return true;
    return s.frein <= R.AIDES_FREIN_MAX && Math.abs(s.direction) <= R.AIDES_DIRECTION_MAX && s.courbure <= R.AIDES_COURBURE_MAX;
  }

  // vues : les identifiants déjà vus (la sauvegarde) ; actuelle : l'aide de la bulle (ou null) ; montree : depuis combien de temps
  // elle est affichée (s, sans compter les moments où elle est cachée par un virage)
  function creer(vues) {
    return { vues: new Set((vues || []).filter(id => PAR_ID[id])), actuelle: null, montree: 0 };
  }

  // une image : renvoie { aide (l'aide à afficher, ou null), vue (l'aide qui vient d'être vue, à sauvegarder, ou null) }
  function pas(e, s, dt) {
    if (!R.AIDES_ACTIVES) { e.actuelle = null; e.montree = 0; return { aide: null, vue: null }; }
    let vue = null;
    if (e.actuelle) {
      const a = PAR_ID[e.actuelle];
      const finie = a.faite(s) || !a.quand(s) || (a.genre === 'course' && e.montree >= R.AIDES_DUREE_COURSE);
      if (finie) {
        // l'action est faite, ou le moment est passé : vue si elle a été lue un peu (sinon elle reviendra la prochaine fois)
        if (e.montree >= R.AIDES_VUE_APRES || a.faite(s)) { e.vues.add(a.id); vue = a.id; }
        e.actuelle = null; e.montree = 0;
      } else if (a.genre === 'course' && !libre(s)) return { aide: null, vue: null };   // un virage ou un freinage : cachée, elle attend
      else { e.montree += dt; return { aide: a.id, vue: null }; }
    }
    for (const a of LISTE) {
      if (e.vues.has(a.id) || !a.quand(s) || a.faite(s)) continue;
      if (a.genre === 'course' && !libre(s)) continue;
      e.actuelle = a.id; e.montree = 0;
      return { aide: a.id, vue };
    }
    return { aide: null, vue };
  }

  // un clic sur la bulle : l'aide est vue ; renvoie son identifiant (ou null)
  function fermer(e) {
    const id = e.actuelle;
    if (id) e.vues.add(id);
    e.actuelle = null; e.montree = 0;
    return id;
  }

  // « Revoir les aides » : plus aucune n'est vue
  function revoir(e) {
    e.vues.clear(); e.actuelle = null; e.montree = 0;
  }

  return { LISTE, PAR_ID, situation, courbureDevant, libre, creer, pas, fermer, revoir };
})();
