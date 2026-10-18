// ?reglages=1 : le panneau du pilote d'essai. Des curseurs qui changent REGLAGES tout de suite, en roulant,
// et un bouton « copier » qui donne les valeurs changées, prêtes à recopier dans donnees.js.
// C'est un outil de réglage, pas une partie du jeu : sans ?reglages=1, le panneau n'existe pas.
const PANNEAU_REGLAGES = (function () {
  // [clé de REGLAGES, indice dans un tableau ou null, min, max, pas]
  const CURSEURS = [
    ['ADHERENCE', null, 0.8, 3, 0.05],
    ['APPUI', null, 0, 3, 0.05],
    ['BRAQUAGE_MAX', null, 0.1, 0.6, 0.01],
    ['BRAQUAGE_VITESSE', null, 5, 80, 1],
    ['DIRECTION_PALIER', null, 0.1, 1, 0.05],
    ['RAMPE_DIRECTION_RAPIDE', null, 0.5, 10, 0.1],
    ['RAMPE_DIRECTION_LENTE', null, 0.1, 5, 0.05],
    ['RETOUR_DIRECTION', null, 0.5, 15, 0.1],
    ['ADHERENCE_FREIN', null, 0.5, 3, 0.05],
    ['ADHERENCE_ARRIERE', null, 0.8, 2, 0.05],
    ['STABILITE_LACET', null, 0, 15, 0.5],
    ['ANTI_DERIVE', null, 0, 10, 0.5],
    ['ADHERENCE_HERBE', null, 0.3, 1, 0.05],
    ['FROTTEMENT_HERBE_CARRE', null, 0, 30, 0.5],
    ['GAZ_HERBE', null, 0.1, 1, 0.05],
    ['PUISSANCE', null, 300000, 1200000, 10000],
    ['CAMERA_DERRIERE', 0, 3, 15, 0.1],
    ['CAMERA_DERRIERE', 1, 0.8, 6, 0.1],
    ['CAMERA_RECUL_VITESSE', null, 0, 3, 0.1],
    ['CAMERA_SUIVI_CAP', null, 1, 20, 0.5],
    ['CAMERA_CHAMP', 1, 0, 20, 1],
    ['HALO_EPAISSEUR', null, 0.01, 0.08, 0.005],
  ];
  const depart = {};   // les valeurs de donnees.js, pour savoir ce qui a changé
  let surChangement = null;

  const lire = (cle, i) => i === null ? REGLAGES[cle] : REGLAGES[cle][i];
  function ecrire(cle, i, valeur) {
    if (i === null) REGLAGES[cle] = valeur; else REGLAGES[cle][i] = valeur;
    if (surChangement) surChangement(cle);
  }

  // le texte à recopier dans donnees.js : seulement les réglages changés
  function texteCopie() {
    const lignes = [];
    for (const cle of Object.keys(depart)) {
      const avant = JSON.stringify(depart[cle]), maintenant = JSON.stringify(REGLAGES[cle]);
      if (avant !== maintenant) lignes.push(`  ${cle}: ${maintenant.replace(/,/g, ', ')},`);
    }
    return lignes.join('\n');
  }

  function copier(sortie) {
    const t = texteCopie() || texte('reglagesRienChange');
    sortie.textContent = t;
    // le presse-papiers moderne, sinon l'ancienne méthode (une page en file:// n'a pas toujours le premier)
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(() => copieAncienne(t));
    else copieAncienne(t);
  }

  function copieAncienne(t) {
    const zone = document.createElement('textarea');
    zone.value = t;
    document.body.appendChild(zone);
    zone.select();
    try { document.execCommand('copy'); } catch (e) { /* le texte reste affiché dans le panneau */ }
    zone.remove();
  }

  // quand : appelée avec la clé changée (pour refaire le halo, par exemple)
  function creer(quand) {
    surChangement = quand;
    for (const [cle] of CURSEURS) depart[cle] = JSON.parse(JSON.stringify(REGLAGES[cle]));
    const panneau = document.createElement('div');
    panneau.id = 'reglages';
    const titre = document.createElement('h2');
    titre.textContent = texte('reglagesTitre');
    panneau.appendChild(titre);
    for (const [cle, i, min, max, pas] of CURSEURS) {
      const ligne = document.createElement('label');
      const nom = document.createElement('span');
      nom.textContent = cle + (i === null ? '' : `[${i}]`);
      const curseur = document.createElement('input');
      Object.assign(curseur, { type: 'range', min, max, step: pas, value: lire(cle, i) });
      curseur.dataset.cle = cle + (i === null ? '' : `.${i}`);
      const valeur = document.createElement('output');
      valeur.textContent = lire(cle, i);
      curseur.addEventListener('input', () => { ecrire(cle, i, Number(curseur.value)); valeur.textContent = curseur.value; });
      // sans le focus, les flèches reviennent à la conduite
      curseur.addEventListener('change', () => curseur.blur());
      ligne.append(nom, curseur, valeur);
      panneau.appendChild(ligne);
    }
    const bouton = document.createElement('button');
    bouton.textContent = texte('reglagesCopier');
    bouton.tabIndex = -1;
    const sortie = document.createElement('pre');
    bouton.addEventListener('click', () => { copier(sortie); bouton.blur(); });
    panneau.append(bouton, sortie);
    document.body.appendChild(panneau);
  }

  return { creer, texteCopie };
})();
