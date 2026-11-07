// L'écran des réglages de la voiture (tour 50b ; le calcul est dans reglages-voiture.js) : depuis le garage (page « Mon équipe » du
// paddock), avant le Grand Prix. Quatre curseurs (équilibre des freins, boîte, suspensions, pression des pneus), chacun avec ses deux bouts
// et une ligne qui dit ce qu'il change au cran choisi ; « Réglage conseillé » remet tout au milieu. L'écran ne fait qu'afficher : les
// changements passent par les fonctions données à preparer (principal.js), qui règlent et sauvegardent. Textes : rv_* (textes.js).
const MES_REGLAGES = (function () {
  const $ = id => document.getElementById(id);
  let rappels = null;

  // construit les quatre lignes (une fois)
  function construire() {
    const liste = $('rvListe');
    if (liste.childElementCount) return;
    for (const nom of REGLAGES_VOITURE.NOMS) {
      const ligne = document.createElement('div');
      ligne.className = 'rvLigne';
      ligne.dataset.reglage = nom;
      const titre = document.createElement('span'); titre.className = 'rvNom'; titre.id = 'rvNom_' + nom;
      const bas = document.createElement('span'); bas.className = 'rvBout'; bas.id = 'rvBas_' + nom;
      const curseur = document.createElement('input');
      curseur.type = 'range'; curseur.min = 0; curseur.max = REGLAGES.RV_CRANS - 1; curseur.step = 1; curseur.id = 'rvCurseur_' + nom; curseur.tabIndex = -1;
      curseur.addEventListener('input', () => { if (rappels) rappels.changer(nom, Number(curseur.value)); });
      const haut = document.createElement('span'); haut.className = 'rvBout'; haut.id = 'rvHaut_' + nom;
      const effet = document.createElement('p'); effet.className = 'rvEffet'; effet.id = 'rvEffet_' + nom;
      ligne.append(titre, bas, curseur, haut, effet);
      liste.appendChild(ligne);
    }
  }

  // nom = le nom du circuit ; r = le réglage du joueur sur ce circuit (REGLAGES_VOITURE.de)
  function remplir(nom, r) {
    construire();
    $('rvTitre').textContent = texte('rvTitre').replace('{circuit}', nom);
    $('boutonRvConseille').textContent = texte('rvConseille');
    $('boutonRvRetour').textContent = texte('garageRetour');
    for (const n of REGLAGES_VOITURE.NOMS) {
      $('rvNom_' + n).textContent = texte('rv_' + n);
      $('rvBas_' + n).textContent = texte('rv_' + n + '_bas');
      $('rvHaut_' + n).textContent = texte('rv_' + n + '_haut');
    }
    maj(r);
  }

  // les curseurs et les lignes d'effet ; le bouton « Réglage conseillé » est grisé quand on y est déjà
  function maj(r) {
    const x = REGLAGES_VOITURE.normaliser(r), m = REGLAGES_VOITURE.milieu();
    for (const n of REGLAGES_VOITURE.NOMS) {
      $('rvCurseur_' + n).value = x[n];
      $('rvEffet_' + n).textContent = x[n] === m ? texte('rvEquilibre') : texte('rv_' + n + '_effet_' + (x[n] > m ? 'haut' : 'bas'));
      $('rvEffet_' + n).classList.toggle('rvRegle', x[n] !== m);
    }
    $('boutonRvConseille').disabled = REGLAGES_VOITURE.estConseille(x);
  }

  // ouvrir : le bouton du garage ; changer(nom, cran) ; conseille() ; retour()
  function preparer(ouvrir, changer, conseille, retour) {
    rappels = { changer };
    $('boutonReglagesVoiture').textContent = texte('reglagesVoiture');
    for (const [id, f] of [['boutonReglagesVoiture', ouvrir], ['boutonRvConseille', conseille], ['boutonRvRetour', retour]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  return { remplir, maj, preparer };
})();
