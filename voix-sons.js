// Les voix enregistrées du commentateur (tour 51c ; CLAUDE.md « De vraies voix enregistrées »). Pour chaque fait qui a des sons
// (le départ, un dépassement, une bataille côte à côte, une erreur, la victoire), le jeu joue une des prises (jamais la même deux fois de
// suite, par fait) ; la voix de synthèse (voix.js) ne dit plus que ce qui n'a pas de son ; le bandeau texte reste.
// - PROVISOIRE ET RÉVERSIBLE : le propriétaire n'a pas encore choisi sa voix. Éteint par défaut (VOIX_SONS faux) : le jeu est alors
//   exactement comme avant. ?voixsons=1 ou « Voix enregistrées : oui » dans ⚙ Réglages (sauvegardé : option 'voixsons') l'allument
//   (?voixsons=1 écrit l'option, ?voixsons=0 l'éteint : le réglage tient quand le jeu se recharge entre deux écrans, tour 51h).
// - Les sons (sons/voix/<langue>-<fait>-<n>.m4a, environ 13 Ko chacun) ne se chargent qu'APRÈS la course de découverte (« En piste en
//   10 secondes » ne doit pas ralentir), seulement dans la langue du jeu, et seulement quand l'AudioContext existe (le premier geste) ;
//   ils passent par la famille « commentateur » de son.js (son coupé, M, pub, onglet caché : muet comme le reste). En file:// (index.html
//   ouvert directement), Chrome refuse le XHR d'un fichier : la prise est alors un élément <audio> (rattraper), joué au volume du commentateur.
// - Un son qui manque ou qui ne se décode pas : le texte reste (et la voix de synthèse parle), aucune erreur.
// - Ne touche jamais à la course : son propre hasard (ALEATOIRE.suite), aucun tirage dans hasard().
// VOIXSONS.jouer(type) : vrai si un son a été lancé ; VOIXSONS.taire() ; VOIXSONS.regler(oui) / VOIXSONS.active ;
// VOIXSONS.charger() ; VOIXSONS.cleDe(type) ; VOIXSONS.etat()
const VOIXSONS = (function () {
  const R = REGLAGES;
  // le fait du commentateur (commentaire.js) → le groupe de sons
  // (tour 55, T10) la liste complète des exclamations (tests/voix/liste.json) : 16 groupes, 2 ou 3 phrases chacun, une prise gardée par phrase
  // (tour 55, T22) « remontée » est un fait du commentateur (commentaire.js) : 3 prises
  const GROUPE = { depart: 'depart', depassement: 'depassement', depassementTete: 'depassementTete', depassementJoueur: 'depassement',
    coteACote: 'bataille', erreur: 'erreur', glissade: 'glissade', contact: 'contact', arret: 'arret', stands: 'stands', pluie: 'pluie',
    meilleurTour: 'meilleurTour', dernierTour: 'dernierTour', arrivee: 'arrivee', podium: 'podium', joueurArrivee: 'joueurArrivee', penalite: 'penalite', remontee: 'remontee' };
  const PRISES_DE = { depart: 3, depassement: 3, depassementTete: 2, bataille: 3, erreur: 3, glissade: 2, contact: 2, arret: 2, stands: 2, pluie: 2,
    meilleurTour: 3, dernierTour: 2, arrivee: 3, podium: 2, joueurArrivee: 2, penalite: 2, remontee: 3 };
  const CLES = Object.keys(PRISES_DE);
  const PRISES = 3;   // au plus trois prises par groupe et par langue
  const DOSSIER = 'sons/voix/';
  const url = (l, cle, n) => DOSSIER + l + '-' + cle + '-' + n + '.m4a';
  // ?voixsons=1 (ou =0) vaut le réglage « Voix enregistrées » : il est ÉCRIT dans la sauvegarde (tour 51h : le jeu se recharge entre deux
  // écrans sans garder ce paramètre, et les voix s'éteignaient au premier rechargement ; la synthèse reprenait)
  const DEMANDE = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('voixsons') : null;
  let active = DEMANDE === '1' || DEMANDE === '0' ? DEMANDE === '1'
    : (typeof SAUVEGARDE !== 'undefined' ? SAUVEGARDE.option('voixsons', R.VOIX_SONS) === true : R.VOIX_SONS === true);
  if ((DEMANDE === '1' || DEMANDE === '0') && typeof SAUVEGARDE !== 'undefined') { try { SAUVEGARDE.ecrireOption('voixsons', active); } catch (e) { /* rien */ } }
  const tampons = {};       // { fr: { depart: [AudioBuffer…] } } ce qui est décodé
  const demandes = {};      // la langue → vrai quand son chargement est lancé
  const dernier = {};       // le groupe → la dernière prise jouée
  let rnd = null, courant = null, joues = 0, essai = null;
  const langue = () => (typeof LANGUE !== 'undefined' ? LANGUE : 'en');
  const sortie = () => {
    if (essai) return essai;
    const c = typeof SON !== 'undefined' ? SON.contexte : null;
    return c && c.ctx && c.sortie ? c : null;
  };
  const sonPermis = () => essai ? (essai.permis ? !!essai.permis() : true) : typeof SON === 'undefined' || (SON.actif && !SON.coupe);
  // (tour 55) les sons ne sont que dans les langues de VOIX_SONS_LANGUES (le français) : en anglais, la synthèse parle comme avant
  const langueAvecSons = l => !Array.isArray(R.VOIX_SONS_LANGUES) || R.VOIX_SONS_LANGUES.includes(l);
  const cleDe = type => GROUPE[type] || null;

  // le chargement d'une langue (une fois) : chaque fichier à son tour, sans bruit en cas d'échec
  function charger() {
    const s = sortie(), l = langue();
    if (!active || !s || demandes[l] || !langueAvecSons(l) || (typeof JEU !== 'undefined' && JEU.decouverte)) return false;
    demandes[l] = true;
    tampons[l] = tampons[l] || {};
    for (const cle of CLES) for (let n = 1; n <= PRISES_DE[cle]; n++) {
      try {
        const x = new XMLHttpRequest();
        x.open('GET', url(l, cle, n)); x.responseType = 'arraybuffer';
        x.onload = () => {
          if (!(x.status === 200 || (x.status === 0 && x.response && x.response.byteLength))) return rattraper(l, cle, n);
          const ok = b => { (tampons[l][cle] = tampons[l][cle] || []).push(b); };
          try { const p = s.ctx.decodeAudioData(x.response, ok, () => { /* un son illisible : le texte reste */ }); if (p && p.catch) p.catch(() => {}); } catch (e) { /* rien */ }
        };
        x.onerror = () => rattraper(l, cle, n);   // (un son manquant : le texte reste ; en file://, le XHR est refusé : l'élément <audio>)
        x.send();
      } catch (e) { /* rien */ }
    }
    return true;
  }

  // le XHR refusé (index.html ouvert directement en file:// : Chrome refuse les XHR d'un fichier vers un autre, tour 51h) : la même prise
  // par un élément <audio>, qui lui a le droit ; il est joué hors de Web Audio, au volume du commentateur, seulement si le son est permis
  function rattraper(l, cle, n) {
    if (typeof Audio === 'undefined' || typeof location === 'undefined' || location.protocol !== 'file:') return;
    try {
      const a = new Audio(url(l, cle, n));
      a.preload = 'auto';
      a.addEventListener('canplaythrough', () => { const t = (tampons[l][cle] = tampons[l][cle] || []); if (!t.includes(a)) t.push(a); }, { once: true });
      a.addEventListener('error', () => { /* un son manquant : le texte reste */ });
      a.load();
    } catch (e) { /* rien */ }
  }
  const volumeCommentateur = () => (typeof SON !== 'undefined' && SON.volumes && typeof SON.volumes.commentateur === 'number') ? SON.volumes.commentateur : 1;

  // une prise du groupe, jamais la même deux fois de suite ; null s'il n'y en a pas
  function choisir(cle, l) {
    const liste = (tampons[l || langue()] || {})[cle];
    if (!liste || !liste.length) return null;
    if (!rnd) rnd = ALEATOIRE.suite((R.GRAINE_COMMENTAIRE + 777) >>> 0);
    let i = Math.floor(rnd() * liste.length);
    if (liste.length > 1 && dernier[cle] === liste[i]) i = (i + 1) % liste.length;
    dernier[cle] = liste[i];
    return liste[i];
  }

  function taire() { if (courant) { try { if (courant.pause) courant.pause(); else courant.stop(); } catch (e) { /* rien */ } courant = null; } }

  // le fait (type du commentaire) → un son joué ; vrai seulement si un son est parti (sinon la synthèse parle)
  function jouer(type) {
    const cle = cleDe(type), s = sortie();
    if (!active || !cle || !s || !langueAvecSons(langue()) || !sonPermis() || (typeof document !== 'undefined' && document.hidden)) return false;
    const b = choisir(cle);
    if (!b) return false;
    try {
      taire();
      if (b.play) {   // (l'élément <audio> du rattrapage en file://)
        b.volume = Math.max(0, Math.min(1, R.VOIX_SONS_VOLUME * volumeCommentateur()));
        b.currentTime = 0;
        b.onended = () => { if (courant === b) courant = null; };
        const p = b.play(); if (p && p.catch) p.catch(() => {});
        courant = b; joues++;
        return true;
      }
      const src = s.ctx.createBufferSource(), g = s.ctx.createGain();
      src.buffer = b; g.gain.value = R.VOIX_SONS_VOLUME;
      src.connect(g); g.connect(s.sortie);
      src.onended = () => { if (courant === src) courant = null; };
      src.start(0);
      courant = src; joues++;
      return true;
    } catch (e) { courant = null; return false; }
  }

  function regler(oui) {
    active = !!oui;
    if (typeof SAUVEGARDE !== 'undefined') SAUVEGARDE.ecrireOption('voixsons', active);
    if (!active) taire(); else charger();
    return active;
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) taire(); });

  return { jouer, taire, charger, regler, cleDe, CLES, PRISES, PRISES_DE, url,
    get active() { return active; }, get disponible() { return langueAvecSons(langue()); },   // (tour 55, revue : disponible = cette langue a des sons) get joues() { return joues; }, get enCours() { return !!courant; },
    etat: () => Object.fromEntries(Object.entries(tampons).map(([l, d]) => [l, Object.fromEntries(Object.entries(d).map(([c, a]) => [c, a.length]))])),
    // pour les tests seulement : une sortie et des tampons faux
    _essai(sortieFausse, l, groupes, oui) { essai = sortieFausse; if (l) tampons[l] = groupes; if (oui !== undefined) active = !!oui; for (const k of Object.keys(dernier)) delete dernier[k]; joues = 0; courant = null; } };
})();
