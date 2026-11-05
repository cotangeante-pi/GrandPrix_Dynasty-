// L'écran « Ma voiture » (tour 48c), à la manière de l'éditeur du casque : la livrée (livree.js : motif, couleur secondaire ; la couleur
// principale seulement là où elle est libre), le numéro en gros, la célébration (celebration.js) ; la voiture tourne en 3D (voiture3d.js,
// apercuVoiture). Un motif ou une célébration pas encore permis est grisé avec ce qu'il faut pour l'avoir. principal.js l'ouvre et
// garde les choix ; cet écran ne fait que remplir et lire ses champs.
const MA_VOITURE = (function () {
  const $ = id => document.getElementById(id);
  const hex = x => '#' + x.toString(16).padStart(6, '0');
  let libre = false;

  // e = { livree, couleur1 (la couleur principale affichée), numero, libre, possedes (motifs de livrée obtenus), celebration,
  //       debloquees (célébrations débloquées), possedees (célébrations obtenues à la boutique) }
  function remplir(e) {
    libre = !!e.libre;
    const l = LIVREE.valide(e.livree) ? e.livree : LIVREE.defaut();
    $('livreeTitre').textContent = texte('livreeTitre');
    $('livreeMotifTexte').textContent = texte('livreeMotif');
    $('livreeCouleur2Texte').textContent = texte('livreeCouleur2');
    $('livreeCouleur1Texte').textContent = texte('livreeCouleur1');
    $('livreeCelebrationTexte').textContent = texte('celebrationTexte');
    $('livreeNote').textContent = texte(libre ? 'livreeNoteLibre' : 'livreeNote').replace('{n}', e.numero === null || e.numero === undefined ? '' : e.numero);
    $('boutonLivreeValider').textContent = texte('livreeValider');
    $('boutonLivreeRetour').textContent = texte('livreeRetour');
    const motif = $('livreeMotif');
    motif.textContent = '';
    for (const m of LIVREE.tousLesMotifs()) {
      const o = document.createElement('option'), ok = LIVREE.permis(m, e.possedes);
      o.value = m; o.disabled = !ok;
      o.textContent = texte('livree_' + m) + (ok ? '' : ' — ' + texte('skinVerrou').replace('{c}', texte('skinBoutique')));
      motif.append(o);
    }
    motif.value = LIVREE.permis(l.motif, e.possedes) ? l.motif : REGLAGES.LIVREE_DEFAUT.motif;
    $('livreeC2').value = hex(l.couleur2);
    $('livreeC1Ligne').classList.toggle('cache', !libre);
    $('livreeC1').value = hex(l.couleur1 !== undefined ? l.couleur1 : e.couleur1 || 0);
    const cel = $('livreeCelebration');
    cel.textContent = '';
    for (const c of CELEBRATION.toutes()) {
      const o = document.createElement('option'), ok = CELEBRATION.permis(c, e.debloquees, e.possedees);
      o.value = c; o.disabled = !ok;
      o.textContent = texte('celebration_' + c) + (ok ? '' : ' — ' + texte('skinVerrou').replace('{c}', CELEBRATION.condition(c)));
      cel.append(o);
    }
    cel.value = CELEBRATION.permis(e.celebration, e.debloquees, e.possedees) ? e.celebration : REGLAGES.CELEBRATION_DEFAUT;
  }

  function lire() {
    const c1 = libre ? parseInt($('livreeC1').value.slice(1), 16) : undefined;
    return { livree: LIVREE.creer($('livreeMotif').value, parseInt($('livreeC2').value.slice(1), 16), c1), celebration: $('livreeCelebration').value };
  }

  // changement(choix) à chaque changement (l'aperçu 3D suit), valider(choix), retour()
  function preparer(changement, valider, retour) {
    for (const id of ['livreeMotif', 'livreeC2', 'livreeC1', 'livreeCelebration']) {
      $(id).addEventListener('input', () => changement(lire()));
      $(id).addEventListener('change', () => changement(lire()));
    }
    for (const [id, f] of [['boutonLivreeValider', () => valider(lire())], ['boutonLivreeRetour', retour]]) {
      $(id).addEventListener('mousedown', ev => ev.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  return { remplir, lire, preparer };
})();
