// Le son (Web Audio), entièrement synthétisé : le moteur, le crissement des pneus, les chocs. Aucun fichier.
// Rien ne joue avant le premier geste du joueur (règle des navigateurs et de Poki). M ou 🔊 coupe et remet le son.
const SON = (function () {
  const R = REGLAGES;
  let ctx = null;              // l'AudioContext, créé au premier geste
  let muet = false, cache = document.hidden;
  let general = null, moteur = null, pneus = null;
  let contactsVus = 0;

  // le premier geste crée l'AudioContext (il faut un geste pour qu'un navigateur accepte de jouer)
  function premierGeste() {
    if (ctx) return;
    const Contexte = window.AudioContext || window.webkitAudioContext;
    if (!Contexte) return;
    ctx = new Contexte();
    general = ctx.createGain();
    general.connect(ctx.destination);
    construireMoteur();
    construirePneus();
    appliquerVolume();
  }

  // le moteur : deux oscillateurs (la note et son octave) dans un filtre passe-bas
  function construireMoteur() {
    const filtre = ctx.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = R.SON_FILTRE_MOTEUR[0];
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const note = ctx.createOscillator(), octave = ctx.createOscillator();
    note.type = 'sawtooth';
    octave.type = 'square';
    const gainOctave = ctx.createGain();
    gainOctave.gain.value = 0.3;
    note.connect(filtre);
    octave.connect(gainOctave).connect(filtre);
    filtre.connect(gain).connect(general);
    note.start();
    octave.start();
    moteur = { note, octave, filtre, gain };
  }

  // un bruit blanc d'une seconde, en boucle
  function bruit() {
    const tampon = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = tampon.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;   // le son n'est pas l'état du jeu : pas besoin de hasard() avec graine
    return tampon;
  }

  // les pneus : du bruit filtré autour de 2,5 kHz
  function construirePneus() {
    const source = ctx.createBufferSource();
    source.buffer = bruit();
    source.loop = true;
    const filtre = ctx.createBiquadFilter();
    filtre.type = 'bandpass';
    filtre.frequency.value = R.SON_PNEUS_FREQUENCE;
    filtre.Q.value = 3;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filtre).connect(gain).connect(general);
    source.start();
    pneus = { gain };
  }

  // un choc : un coup de bruit grave qui s'éteint vite
  function choc(force) {
    if (!ctx || muet) return;
    const source = ctx.createBufferSource();
    source.buffer = bruit();
    const filtre = ctx.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = 600;
    const gain = ctx.createGain(), t = ctx.currentTime;
    gain.gain.setValueAtTime(R.SON_VOLUME_CHOC * force, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + R.SON_CHOC_DUREE);
    source.connect(filtre).connect(gain).connect(general);
    source.start(t);
    source.stop(t + R.SON_CHOC_DUREE + 0.05);
  }

  function appliquerVolume() {
    if (!ctx) return;
    general.gain.value = muet ? 0 : R.SON_VOLUME;
    if (muet || cache) ctx.suspend(); else ctx.resume();
  }

  // ce que le son doit jouer pour une voiture (calcul pur, testé sans écouter)
  function parametres(v) {
    const regime = regimeMoteur(v.u);
    const derive = Math.abs(v.u) > 1 ? Math.abs(Math.atan2(v.v, Math.abs(v.u))) : 0;
    return {
      regime,
      rapport: rapportPourVitesse(v.u),
      frequence: regime / 60 * R.SON_EXPLOSIONS_PAR_TOUR,
      volumeMoteur: R.SON_MOTEUR_PIED_LEVE + (1 - R.SON_MOTEUR_PIED_LEVE) * v.gaz,
      filtre: R.SON_FILTRE_MOTEUR[0] + (R.SON_FILTRE_MOTEUR[1] - R.SON_FILTRE_MOTEUR[0]) * v.gaz,
      volumePneus: derive > R.SON_DERIVE_CRISSEMENT ? Math.min(1, (derive - R.SON_DERIVE_CRISSEMENT) * 8) * R.SON_VOLUME_PNEUS : 0,
    };
  }

  // à chaque image : le son suit la voiture du joueur
  function maj(v) {
    if (!ctx) { contactsVus = v.contactsBarriere; return; }
    const p = parametres(v), t = ctx.currentTime, lissage = R.SON_LISSAGE;
    moteur.note.frequency.setTargetAtTime(p.frequence, t, lissage);
    moteur.octave.frequency.setTargetAtTime(p.frequence * 2, t, lissage);
    moteur.filtre.frequency.setTargetAtTime(p.filtre, t, lissage);
    moteur.gain.gain.setTargetAtTime(p.volumeMoteur, t, lissage);
    pneus.gain.gain.setTargetAtTime(p.volumePneus, t, lissage);
    if (v.contactsBarriere > contactsVus) choc(Math.min(1, 0.3 + Math.hypot(v.u, v.v) / 40));
    contactsVus = v.contactsBarriere;
  }

  function basculer() {
    muet = !muet;
    appliquerVolume();
    return muet;
  }

  // les gestes qui comptent pour le navigateur : une touche, un clic
  window.addEventListener('keydown', premierGeste);
  window.addEventListener('pointerdown', premierGeste);
  document.addEventListener('visibilitychange', () => { cache = document.hidden; appliquerVolume(); });

  return {
    maj, basculer, parametres,
    get actif() { return ctx !== null; },
    get muet() { return muet; },
    get etatContexte() { return ctx ? ctx.state : 'aucun'; },
  };
})();
