// La foule et l'ambiance (tour 55, T2 ; CLAUDE.md « La foule et l'ambiance »). Des sons faits par le code (Web Audio, comme son.js),
// aucun fichier, aucun son tiré d'une vidéo : une CLAMEUR (du bruit filtré dont le volume monte puis redescend) au départ, à un
// dépassement et à l'arrivée, et une RUMEUR de fond qui monte quand la voiture du joueur passe devant les tribunes (la ligne droite
// des stands, au départ et à l'arrivée de chaque tour) et redescend en s'en éloignant.
// - Tout passe par la famille « ambiance » de son.js (son curseur dans ⚙ Réglages et le menu pause, M, la pub, l'onglet caché).
// - Muet en pause (taire), quand le son est coupé, quand l'onglet est caché ; rien avant le premier geste (pas de contexte).
// - Réglage AMBIANCE_ACTIF (donnees.js) ; « Foule : oui / non » dans ⚙ Réglages (option sauvegardée 'foule'). À faux : le jeu d'avant.
// - Ne touche jamais à la course : son propre bruit (ALEATOIRE.suite), aucun tirage dans hasard().
// FOULE.evenement(type) : 'depart', 'depassement', 'arrivee' ; vrai si une clameur est partie. FOULE.maj(v, enCourse) : à chaque image.
// FOULE.proximite(v, n) : 0 à 1 (calcul pur) ; FOULE.taire() ; FOULE.regler(oui) / FOULE.active.
const FOULE = (function () {
  const R = REGLAGES;
  const DEMANDE = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('foule') : null;
  let active = DEMANDE === '1' || DEMANDE === '0' ? DEMANDE === '1'
    : (typeof SAUVEGARDE !== 'undefined' ? SAUVEGARDE.option('foule', R.AMBIANCE_ACTIF) !== false && R.AMBIANCE_ACTIF !== false : R.AMBIANCE_ACTIF !== false);
  let essai = null, ctx = null, bus = null, rumeur = null, tampon = null, lancees = 0, derniere = -1e9, enCours = 0;
  const journal = [];   // les clameurs lancées (pour les tests)

  const sortie = () => {
    if (essai) return essai;
    const c = typeof SON !== 'undefined' ? SON.ambiance : null;
    return c && c.ctx && c.sortie ? c : null;
  };
  const sonPermis = () => essai ? (essai.permis ? !!essai.permis() : true) : typeof SON === 'undefined' || (SON.actif && !SON.coupe);

  // 0 à 1 : près de la ligne de départ et d'arrivée (là où sont les tribunes), de plus en plus loin → 0 (calcul pur)
  function proximite(v, nPoints) {   // (nPoints : seulement pour les tests ; sinon le circuit en cours)
    const n = nPoints || (typeof CIRCUIT !== 'undefined' && CIRCUIT && CIRCUIT.courbure ? CIRCUIT.courbure.length : 0);
    if (!v || !v.piste || !n) return 0;
    const f = Math.min(v.piste.indice, n - v.piste.indice) / n;   // la part du tour qui sépare de la ligne (0 à 0,5)
    return Math.max(0, Math.min(1, 1 - f / R.FOULE_ZONE));
  }

  // un bruit d'une seconde fait d'avance avec le hasard à part de la foule : le même à chaque lancement
  function bruitFoule(c) {
    if (tampon && tampon.c === c) return tampon.b;
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0), r = ALEATOIRE.suite((R.GRAINE_COMMENTAIRE + 555) >>> 0);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    tampon = { c, b };
    return b;
  }
  function construire(s) {
    if (bus && ctx === s.ctx) return;
    ctx = s.ctx;
    bus = ctx.createGain(); bus.gain.value = 1; bus.connect(s.sortie);
    const src = ctx.createBufferSource(); src.buffer = bruitFoule(ctx); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = R.FOULE_RUMEUR_FREQUENCE; f.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(bus); src.start();
    rumeur = { gain: g };
  }

  function rendreBus() { try { bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setValueAtTime(1, ctx.currentTime); } catch (e) { /* rien */ } }

  // une clameur : deux bandes de bruit (le gros de la voix de la foule, puis les cris aigus) dont le volume monte, tient, redescend
  function evenement(type) {
    const p = R.FOULE_CLAMEURS[type], s = sortie();
    if (!p || !active || !s || !sonPermis() || (typeof document !== 'undefined' && document.hidden)) return false;
    const t = s.ctx.currentTime;
    if (t - derniere < R.FOULE_PAUSE_MIN || enCours >= R.FOULE_CLAMEURS_MAX) return false;   // jamais une pile de clameurs
    try {
      construire(s);
      const [duree, volume, montee] = p;
      for (const [freq, q, part] of R.FOULE_BANDES) {
        const src = ctx.createBufferSource(); src.buffer = bruitFoule(ctx); src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(volume * part, t + montee);
        g.gain.setValueAtTime(volume * part, t + Math.max(montee, duree * 0.35));
        g.gain.linearRampToValueAtTime(0.0001, t + duree);   // (une descente droite : la foule s'éteint doucement, pas d'un coup)
        src.connect(f); f.connect(g); g.connect(bus);
        src.start(t); src.stop(t + duree + 0.05);
        enCours++;
        src.onended = () => { enCours = Math.max(0, enCours - 1); };
      }
      derniere = t; lancees++; journal.push(type);
      rendreBus();
      return true;
    } catch (e) { return false; }
  }

  // à chaque image : la rumeur suit la proximité des tribunes ; hors course (pause, podium), elle se tait
  let nTest = 0;   // (tests : le nombre de points du circuit)
  function maj(v, enCourse) {
    const s = sortie();
    if (!active || !s) return;
    if (!bus) { if (!enCourse || !sonPermis()) return; try { construire(s); } catch (e) { return; } }
    if (enCourse) rendreBus();
    const cible = enCourse && sonPermis() ? R.FOULE_RUMEUR_VOLUME * proximite(v, nTest) : 0;
    try { rumeur.gain.gain.setTargetAtTime(cible, ctx.currentTime, 0.4); } catch (e) { /* rien */ }
  }

  function taire() {
    if (!bus) return;
    try { rumeur.gain.gain.cancelScheduledValues(ctx.currentTime); rumeur.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1); bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setTargetAtTime(0, ctx.currentTime, 0.1); } catch (e) { /* rien */ }
    enCours = 0;
  }
  function regler(oui) {
    active = !!oui;
    if (typeof SAUVEGARDE !== 'undefined') SAUVEGARDE.ecrireOption('foule', active);
    if (!active) taire();
    return active;
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) taire(); });

  return { evenement, maj, taire, regler, proximite,
    get active() { return active; }, get lancees() { return lancees; }, get journal() { return journal.slice(); },
    // pour les tests seulement : une sortie fausse { ctx, sortie, permis }
    _essai(fausse, oui, n) { nTest = n || 0; essai = fausse; ctx = null; bus = null; rumeur = null; tampon = null; lancees = 0; derniere = -1e9; enCours = 0; journal.length = 0; if (oui !== undefined) active = !!oui; },
  };
})();
