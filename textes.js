// Tous les textes du jeu : en anglais par défaut, en français si le navigateur est en français.
const TEXTES = {
  en: {
    nomDuJeu: 'Grand Prix Dynasty',
    kmh: 'km/h',
    horsPiste: 'OFF TRACK',
    aideConduite: '↑ ↓ ← → drive · C camera · Space back on track · M sound · Esc pause',
    son: 'Sound on / off (M)',
    choixTitre: 'Choose your race',
    tresCourte: 'Very short', moyenne: 'Medium', longue: 'Long', essaiLibre: 'Free practice',
    tours: 'laps', toursSansFin: 'endless laps',
    record: 'Record',
    tour: 'Lap', meilleurTour: 'Best lap', tourPrecedent: 'Previous lap', chrono: 'Time', secteur: 'S',
    go: 'GO',
    penalite: '+{s} s ✂ corner cut',
    fauxDepart: '+{s} s false start',
    attenteArrivee: 'Finished — waiting for the other drivers',
    passerPodium: 'Skip to the podium (Enter)',
    pause: 'Pause', reprendre: 'Resume', recommencer: 'Restart',
    fin: 'Finish', tempsTotal: 'Total time', penalites: 'Penalties', nouveauRecord: 'New record!',
    rejouer: 'Race again', changerLongueur: 'Change length',
    reglagesTitre: 'Tuning',
    reglagesCopier: 'Copy the changed values',
    reglagesRienChange: '(nothing changed)',
    virgule: '.',                 // le séparateur décimal des écarts du classement (+0.8 s)
    tourRetard: 'lap',
    toursRetard: 'laps',
    podium: 'Podium',
    voirResultats: 'Results',
    resultats: 'Race results',
    colonnesResultats: ['Pos', 'No', 'Time', 'Penalty', 'Gap', 'Grid'],
    enCourse: 'running',
    qualifTitre: 'Qualifying: one timed lap', qualifTour: 'Do my lap', qualifPasser: 'Skip (start last)', qualifCourse: 'Start the race',
    qualifExplication: 'Alone on track, flying lap. A corner cut voids the lap.',
    qualifResultat: 'P{p} / {n} — {t}', qualifPole: 'Pole position!', qualifEcart: '+{s} s off pole',
    qualifInvalide: 'Lap voided (corner cut): starting last', qualifPasse: 'Qualifying skipped: starting last',
    grandPrix: 'Grand Prix', classementPilotes: 'Drivers', classementEcuries: 'Teams', courseSuivante: 'Next race', continuer: 'Continue',
    pointsGagnes: 'You scored {n} points', pts: 'pts', finChampionnat: 'Season over',
    preparation: 'Preparing the race…',
    // les textes en dur relevés par l'audit (rapports/audit-textes.md, 2026-10-22)
    nomJoueur: 'You',                 // le nom du joueur tant qu'il n'en a pas choisi un (création du pilote, étape 6)
    pilote: 'Driver {n}', ecurie: 'Team {n}',   // les rivaux et les écuries tant qu'ils n'ont pas de nom inventé
    numero: 'No. {n}',
    circuit_test: 'Test track', circuit_technique: 'Technical',   // les circuits d'essai (clé : circuit_ + son nom dans CIRCUITS)
    titreGrandPrix: 'Grand Prix {i} / {n} — {circuit}',
    placeCourse: 'P{p} / {n}',
    secondes: '{s} s',
    // le fantôme du meilleur tour (fantome.js)
    fantomeRecord: 'New record! {s} s faster', fantomeEcart: '+{s} s off your record',
    fantomeOui: 'Ghost: shown', fantomeNon: 'Ghost: hidden',
    // le départ parfait (depart.js)
    departAide: 'Hold ↑ to keep the needle in the green · lights out: release, then press ↑',
    departParfait: 'Perfect start!', departBon: 'Good start', departPatinage: 'Wheelspin!', departCale: 'Stalled!', departFaux: 'False start!',
    departRecord: 'reaction record!',
  },
  fr: {
    nomDuJeu: 'Grand Prix Dynasty',
    kmh: 'km/h',
    horsPiste: 'HORS PISTE',
    aideConduite: '↑ ↓ ← → conduire · C caméra · Espace retour en piste · M son · Échap pause',
    son: 'Son oui / non (M)',
    choixTitre: 'Choisis ta course',
    tresCourte: 'Très courte', moyenne: 'Moyenne', longue: 'Longue', essaiLibre: 'Essai libre',
    tours: 'tours', toursSansFin: 'tours sans fin',
    record: 'Record',
    tour: 'Tour', meilleurTour: 'Meilleur tour', tourPrecedent: 'Tour précédent', chrono: 'Temps', secteur: 'S',
    go: 'GO',
    penalite: '+{s} s ✂ virage coupé',
    fauxDepart: '+{s} s faux départ',
    attenteArrivee: 'Arrivée — en attendant les autres pilotes',
    passerPodium: 'Passer au podium (Entrée)',
    pause: 'Pause', reprendre: 'Reprendre', recommencer: 'Recommencer',
    fin: 'Arrivée', tempsTotal: 'Temps total', penalites: 'Pénalités', nouveauRecord: 'Nouveau record !',
    rejouer: 'Rejouer', changerLongueur: 'Changer de longueur',
    reglagesTitre: 'Réglages',
    reglagesCopier: 'Copier les valeurs changées',
    reglagesRienChange: '(rien n’a changé)',
    virgule: ',',
    tourRetard: 'tour',
    toursRetard: 'tours',
    podium: 'Podium',
    voirResultats: 'Résultats',
    resultats: 'Résultats de la course',
    colonnesResultats: ['Pos', 'N°', 'Temps', 'Pénalité', 'Écart', 'Grille'],
    enCourse: 'en course',
    qualifTitre: 'Qualification : un tour chronométré', qualifTour: 'Faire mon tour', qualifPasser: 'Passer (départ dernier)', qualifCourse: 'Départ de la course',
    qualifExplication: 'Seul sur la piste, tour lancé. Un virage coupé annule le tour.',
    qualifResultat: 'P{p} / {n} — {t}', qualifPole: 'Pole position !', qualifEcart: '+{s} s de la pole',
    qualifInvalide: 'Tour annulé (virage coupé) : départ dernier', qualifPasse: 'Qualification passée : départ dernier',
    grandPrix: 'Grand Prix', classementPilotes: 'Pilotes', classementEcuries: 'Écuries', courseSuivante: 'Course suivante', continuer: 'Continuer',
    pointsGagnes: 'Tu marques {n} points', pts: 'pts', finChampionnat: 'Saison terminée',
    preparation: 'Préparation de la course…',
    nomJoueur: 'Toi',
    pilote: 'Pilote {n}', ecurie: 'Écurie {n}',
    numero: 'n°{n}',
    circuit_test: 'Circuit d’essai', circuit_technique: 'Technique',
    titreGrandPrix: 'Grand Prix {i} / {n} — {circuit}',
    placeCourse: 'P{p} / {n}',
    secondes: '{s} s',
    fantomeRecord: 'Nouveau record ! {s} s de mieux', fantomeEcart: '+{s} s du record',
    fantomeOui: 'Fantôme : affiché', fantomeNon: 'Fantôme : masqué',
    departAide: 'Tiens ↑ pour garder l’aiguille dans le vert · feux éteints : lâche, puis réappuie ↑',
    departParfait: 'Départ parfait !', departBon: 'Bon départ', departPatinage: 'Patinage !', departCale: 'Calé !', departFaux: 'Faux départ !',
    departRecord: 'record de réaction !',
  },
};

// ?lang=en ou ?lang=fr force la langue (tests)
const LANGUE = (function () {
  const demandee = new URLSearchParams(location.search).get('lang');
  if (demandee && TEXTES[demandee]) return demandee;
  return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
})();

function texte(cle) {
  return TEXTES[LANGUE][cle] !== undefined ? TEXTES[LANGUE][cle] : TEXTES.en[cle];
}
