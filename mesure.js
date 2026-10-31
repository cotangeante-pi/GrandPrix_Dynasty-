// La mesure des images par seconde (étape 10, tour 45), pour le propriétaire sur son Mac, en un clic. Rien ne tourne sans la demander :
// - ?ips=1 : un petit compteur discret (en bas à droite), la moyenne et la pire image de la dernière seconde ;
// - « Mesurer » (dans ?reglages=1, ou ?mesure=1) : 30 s d'une course de démonstration à 20 voitures sur le circuit choisi, la caméra de
//   course derrière la voiture suivie, puis la moyenne, le 1 % le plus lent, les appels de dessin, la qualité, et « Copier ».
// Le calcul (stats) est pur ; la page ne fait que noter la durée de chaque image. La physique ne voit rien de tout ça.
const MESURE = (function () {
  const R = REGLAGES;

  // durees : la durée de chaque image (s) ; { images, ips (moyenne), pire (l'image la plus lente, en i/s), unPourcent (le 1 % le plus
  // lent : la durée qui n'est dépassée que par 1 % des images, en i/s) }
  function stats(durees) {
    const d = durees.filter(x => x > 0);
    if (!d.length) return { images: 0, ips: 0, pire: 0, unPourcent: 0 };
    const somme = d.reduce((a, b) => a + b, 0), triees = d.slice().sort((a, b) => b - a);
    const lente = triees[Math.min(triees.length - 1, Math.floor(triees.length * 0.01))];
    return { images: d.length, ips: d.length / somme, pire: 1 / triees[0], unPourcent: 1 / lente };
  }

  // le texte à copier : une ligne par mesure, en français ou en anglais (textes.js : mesure_*)
  function texteResultat(r) {
    const n = x => (Math.round(x * 10) / 10).toFixed(1).replace('.', texte('virgule'));
    return texte('mesure_resultat').replace('{jeu}', texte('nomDuJeu')).replace('{circuit}', r.circuit).replace('{ips}', n(r.ips)).replace('{un}', n(r.unPourcent)).replace('{pire}', n(r.pire))
      .replace('{appels}', String(r.appels)).replace('{appelsMax}', String(r.appelsMax)).replace('{triangles}', String(r.triangles)).replace('{qualite}', r.qualite)
      .replace('{taille}', r.taille).replace('{images}', String(r.images)).replace('{duree}', String(r.duree));
  }

  // --- le compteur (?ips=1)
  function compteur() {
    const boite = document.createElement('div');
    boite.id = 'compteurIps';
    document.body.appendChild(boite);
    let durees = [], temps = 0;
    BOUCLE.surAffichage((alpha, dt) => {
      durees.push(dt); temps += dt;
      if (temps < 1) return;
      const s = stats(durees);
      boite.textContent = texte('mesure_compteur').replace('{ips}', String(Math.round(s.ips))).replace('{pire}', String(Math.round(s.pire)));
      durees = []; temps = 0;
    });
  }

  // --- la mesure (?mesure=1) : la course de démonstration attend ses feux, puis on note MESURE_DUREE s d'images
  function mesurer(circuit) {
    const panneau = document.createElement('div');
    panneau.id = 'mesurePanneau';
    panneau.innerHTML = '<p id="mesureEtat"></p><pre id="mesureSortie" class="cache"></pre><button id="mesureCopier" class="cache" tabindex="-1"></button>';
    document.body.appendChild(panneau);
    const etat = panneau.querySelector('#mesureEtat'), sortie = panneau.querySelector('#mesureSortie'), copier = panneau.querySelector('#mesureCopier');
    copier.textContent = texte('mesure_copier');
    etat.textContent = texte('mesure_attente');
    let durees = null, appels = [], triangles = 0, t = 0, fini = false;
    BOUCLE.surAffichage((alpha, dt) => {
      if (fini) return;
      const roule = JEU.ecran === 'course' && JEU.course && JEU.course.etat === 'course';
      if (!durees) { if (roule) { durees = []; etat.textContent = texte('mesure_encours').replace('{s}', String(R.MESURE_DUREE)); } return; }
      durees.push(dt); appels.push(SCENE3D.appelsDessin); triangles = Math.max(triangles, SCENE3D.trianglesDessines); t += dt;
      if (t < R.MESURE_DUREE) return;
      fini = true;
      const s = stats(durees), c = SCENE3D.canvas;
      const q = JEU.qualite ? JEU.qualite.regle + ' ' + JEU.qualite.cran + '/2, ' + SCENE3D.pixelRatio + ' px/px' : '?';   // (le réglage, le cran : 0 haute, 2 basse)
      window.__mesure = Object.assign(s, { circuit, appels: Math.round(appels.reduce((a, b) => a + b, 0) / appels.length), appelsMax: Math.max(...appels), triangles,
        qualite: q, taille: (c ? c.width + '×' + c.height : '?') + ' px', duree: R.MESURE_DUREE });
      sortie.textContent = texteResultat(window.__mesure);
      etat.textContent = texte('mesure_fini');
      sortie.classList.remove('cache'); copier.classList.remove('cache');
    });
    copier.addEventListener('mousedown', e => e.preventDefault());
    copier.addEventListener('click', () => {
      const txt = sortie.textContent;
      const secours = () => { const z = document.createElement('textarea'); z.value = txt; document.body.appendChild(z); z.select(); try { document.execCommand('copy'); } catch (e) { /* le texte reste affiché */ } z.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => { copier.textContent = texte('mesure_copie'); }, () => { secours(); copier.textContent = texte('mesure_copie'); });
      else { secours(); copier.textContent = texte('mesure_copie'); }
    });
  }

  // l'adresse de la mesure : le même circuit, 20 voitures, une course d'un tour
  function adresse(circuit) {
    return location.pathname + '?ia=20&course=1&mesure=1&circuit=' + encodeURIComponent(circuit) + (PARAMETRES.get('lang') ? '&lang=' + PARAMETRES.get('lang') : '');
  }
  // le bouton « Mesurer » dans le panneau ?reglages=1 (s'il est là)
  function boutonReglages(circuit) {
    const p = document.getElementById('reglages');
    if (!p) return;
    const b = document.createElement('button');
    b.id = 'boutonMesurer'; b.tabIndex = -1; b.textContent = texte('mesure_bouton');
    b.addEventListener('click', () => { location.href = adresse(circuit); });
    p.appendChild(b);
  }

  return { stats, texteResultat, compteur, mesurer, adresse, boutonReglages };
})();
