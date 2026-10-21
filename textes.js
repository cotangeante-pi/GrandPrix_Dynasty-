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
    pause: 'Pause', reprendre: 'Resume', recommencer: 'Restart',
    fin: 'Finish', tempsTotal: 'Total time', penalites: 'Penalties', nouveauRecord: 'New record!',
    rejouer: 'Race again', changerLongueur: 'Change length',
    reglagesTitre: 'Tuning',
    reglagesCopier: 'Copy the changed values',
    reglagesRienChange: '(nothing changed)',
    virgule: '.',                 // le séparateur décimal des écarts du classement (+0.8 s)
    tourRetard: 'lap',
    toursRetard: 'laps',
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
    pause: 'Pause', reprendre: 'Reprendre', recommencer: 'Recommencer',
    fin: 'Arrivée', tempsTotal: 'Temps total', penalites: 'Pénalités', nouveauRecord: 'Nouveau record !',
    rejouer: 'Rejouer', changerLongueur: 'Changer de longueur',
    reglagesTitre: 'Réglages',
    reglagesCopier: 'Copier les valeurs changées',
    reglagesRienChange: '(rien n’a changé)',
    virgule: ',',
    tourRetard: 'tour',
    toursRetard: 'tours',
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
