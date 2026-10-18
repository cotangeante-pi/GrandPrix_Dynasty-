// Tous les textes du jeu : en anglais par défaut, en français si le navigateur est en français.
const TEXTES = {
  en: {
    nomDuJeu: 'Grand Prix Dynasty',
    kmh: 'km/h',
    horsPiste: 'OFF TRACK',
    aideConduite: '↑ ↓ ← → drive · C camera · Space back on track · M sound',
    son: 'Sound on / off (M)',
    reglagesTitre: 'Tuning',
    reglagesCopier: 'Copy the changed values',
    reglagesRienChange: '(nothing changed)',
  },
  fr: {
    nomDuJeu: 'Grand Prix Dynasty',
    kmh: 'km/h',
    horsPiste: 'HORS PISTE',
    aideConduite: '↑ ↓ ← → conduire · C caméra · Espace retour en piste · M son',
    son: 'Son oui / non (M)',
    reglagesTitre: 'Réglages',
    reglagesCopier: 'Copier les valeurs changées',
    reglagesRienChange: '(rien n’a changé)',
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
