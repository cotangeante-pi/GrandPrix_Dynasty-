// Le son (Web Audio), entièrement synthétisé : le moteur, le crissement des pneus, les chocs. Aucun fichier.
// Rien ne joue avant le premier geste du joueur (règle des navigateurs et de Poki). M ou 🔊 coupe et remet le son.
// Les sensations de conduite (tour 37, sensations.js) : le passage des rapports, les vibreurs et l'herbe, le blocage des
// roues, le souffle de l'aspiration, la voiture d'à côté (Doppler), la pluie sur la carrosserie ; « Effets de conduite »
// (menu pause) les coupe. Tout se calcule dans mixage (pur, testé sans écouter) ; maj ne fait que l'appliquer.
const SON = (function () {
  const R = REGLAGES;
  let ctx = null;              // l'AudioContext, créé au premier geste
  let muet = false, cache = document.hidden;
  let general = null, moteur = null, pneus = null, sens = null;
  let contactsVus = 0;
  const memo = { rapport: null };   // le rapport de l'image d'avant (le passage d'un rapport)
  let coupureJusque = -1;           // la coupure du passage en cours (temps de l'AudioContext)

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
    construireSensations();
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
  let bruitCommun = null;
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
    pneus = { gain, filtre };
  }

  // une source qui tourne en boucle (bruit ou oscillateur) → un filtre → un volume à 0 ; renvoie { source, filtre, gain }
  function voie(source, type, frequence) {
    const filtre = ctx.createBiquadFilter();
    filtre.type = type;
    filtre.frequency.value = frequence;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filtre).connect(gain).connect(general);
    source.start();
    return { source, filtre, gain };
  }
  function bruitEnBoucle() {
    const s = ctx.createBufferSource();
    if (!bruitCommun) bruitCommun = bruit();
    s.buffer = bruitCommun;
    s.loop = true;
    return s;
  }
  function oscillateur(type) { const o = ctx.createOscillator(); o.type = type; return o; }

  // les sensations : le vibreur (un carré grave qui suit les bandes), l'herbe (un bruit sourd), l'aspiration (un souffle),
  // la voiture d'à côté (une scie filtrée), la pluie (un bruit aigu)
  function construireSensations() {
    sens = {
      vibreur: voie(oscillateur('square'), 'lowpass', 420),
      herbe: voie(bruitEnBoucle(), 'lowpass', 280),
      aspiration: voie(bruitEnBoucle(), 'lowpass', 900),
      voisin: voie(oscillateur('sawtooth'), 'lowpass', 1400),
      pluie: voie(bruitEnBoucle(), 'highpass', 3500),
    };
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

  // tout ce que le son joue pour la voiture du joueur v (calcul pur, testé sans écouter) : parametres, plus les sensations.
  // f : ses faits (SENSATIONS.faits) ; monde : { voisins: [voitures], pluie: 0 à 1 } ; memo : { rapport } (mis à jour)
  // Effets de conduite coupés : seulement le moteur et la dérive d'avant (le reste à 0, aucun passage).
  function mixage(v, f, monde, memo) {
    const p = parametres(v), oui = typeof SENSATIONS === 'undefined' || SENSATIONS.actif;
    const avant = memo.rapport;
    memo.rapport = p.rapport;
    p.passage = oui && avant !== null && p.rapport !== avant ? (p.rapport > avant ? 'monte' : 'descend') : null;
    p.frequencePneus = R.SON_PNEUS_FREQUENCE;
    const blocage = oui ? f.blocage * R.SON_VOLUME_BLOCAGE : 0;
    if (blocage > p.volumePneus) { p.volumePneus = blocage; p.frequencePneus = R.SON_BLOCAGE_FREQUENCE; }
    const u = Math.abs(v.u), [f0, f1] = R.SON_VIBREUR_FREQUENCE;
    p.volumeVibreur = oui ? R.SON_VOLUME_VIBREUR * f.vibreur : 0;
    p.frequenceVibreur = Math.max(f0, Math.min(f1, 4 * u / R.LONGUEUR_BANDE_VIBREUR));
    p.volumeHerbe = oui ? R.SON_VOLUME_HERBE * f.herbe * Math.min(1, u / 30) : 0;
    p.volumeAspiration = oui ? R.SON_VOLUME_ASPIRATION * (v.aspiration || 0) * Math.min(1, u / 50) : 0;
    p.volumePluie = oui && monde ? R.SON_VOLUME_PLUIE * Math.max(0, Math.min(1, monde.pluie || 0)) : 0;
    // la voiture la plus proche : son moteur, plus fort de près, plus aigu quand elle approche (Doppler)
    p.volumeVoisin = 0; p.frequenceVoisin = 0; p.voisin = null;
    if (oui && monde && monde.voisins) {
      let w = null, dmin = R.SON_VOISIN_DISTANCE;
      for (const q of monde.voisins) { if (!q || q === v) continue; const d = Math.hypot(q.x - v.x, q.z - v.z); if (d < dmin) { dmin = d; w = q; } }
      if (w) {
        const proche = 1 - dmin / R.SON_VOISIN_DISTANCE, nx = dmin > 0.01 ? (w.x - v.x) / dmin : 0, nz = dmin > 0.01 ? (w.z - v.z) / dmin : 0;
        const vers = v.u * (Math.cos(v.cap) * nx + Math.sin(v.cap) * nz), vient = w.u * (Math.cos(w.cap) * nx + Math.sin(w.cap) * nz);
        p.doppler = Math.max(0.7, Math.min(1.4, (R.SON_VITESSE_SON + vers) / (R.SON_VITESSE_SON + vient)));
        p.volumeVoisin = R.SON_VOLUME_VOISIN * proche * proche;
        p.frequenceVoisin = regimeMoteur(w.u) / 60 * R.SON_EXPLOSIONS_PAR_TOUR * p.doppler;
        p.voisin = w;
      }
    }
    return p;
  }

  // à chaque image : le son suit la voiture du joueur ; monde (facultatif) : { voisins, pluie }
  function maj(v, monde) {
    const f = typeof SENSATIONS !== 'undefined' ? SENSATIONS.de(v) : null;
    const p = mixage(v, f || { vibreur: 0, herbe: 0, glisse: 0, blocage: 0, contact: 0, choc: 0, vitesse: 0 }, monde, memo);
    if (!ctx) { contactsVus = v.contactsBarriere; return; }
    const t = ctx.currentTime, lissage = R.SON_LISSAGE;
    moteur.note.frequency.setTargetAtTime(p.frequence, t, lissage);
    moteur.octave.frequency.setTargetAtTime(p.frequence * 2, t, lissage);
    moteur.filtre.frequency.setTargetAtTime(p.filtre, t, lissage);
    // le passage d'un rapport vers le haut : une coupure franche, puis le moteur reprend (et la note tombe avec le régime)
    if (p.passage === 'monte') {
      moteur.gain.gain.cancelScheduledValues(t);
      moteur.gain.gain.setTargetAtTime(p.volumeMoteur * R.SON_PASSAGE_CHUTE, t, 0.006);
      moteur.gain.gain.setTargetAtTime(p.volumeMoteur, t + R.SON_PASSAGE_DUREE, 0.02);
      coupureJusque = t + R.SON_PASSAGE_DUREE + 0.04;
    }
    if (t > coupureJusque) moteur.gain.gain.setTargetAtTime(p.volumeMoteur, t, lissage);
    pneus.gain.gain.setTargetAtTime(p.volumePneus, t, lissage);
    pneus.filtre.frequency.setTargetAtTime(p.frequencePneus, t, lissage);
    sens.vibreur.source.frequency.setTargetAtTime(p.frequenceVibreur, t, lissage);
    sens.vibreur.gain.gain.setTargetAtTime(p.volumeVibreur, t, lissage);
    sens.herbe.gain.gain.setTargetAtTime(p.volumeHerbe, t, lissage);
    sens.aspiration.gain.gain.setTargetAtTime(p.volumeAspiration, t, 0.15);
    sens.pluie.gain.gain.setTargetAtTime(p.volumePluie, t, 0.5);
    if (p.frequenceVoisin > 0) sens.voisin.source.frequency.setTargetAtTime(p.frequenceVoisin, t, 0.05);
    sens.voisin.gain.gain.setTargetAtTime(p.volumeVoisin, t, 0.08);
    if (v.contactsBarriere > contactsVus) choc(Math.min(1, 0.3 + Math.hypot(v.u, v.v) / 40));
    contactsVus = v.contactsBarriere;
  }

  // un signal de course (compte, go, arrivee) : des notes courtes. Chaque demande est notée (pour les tests),
  // mais rien ne joue avant le premier geste ni quand le son est coupé.
  const historique = [];
  function signal(type) {
    historique.push(type);
    if (!ctx || muet) return;
    const [notes, duree] = R.SON_SIGNAUX[type];
    let t = ctx.currentTime;
    for (const f of notes) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(R.SON_VOLUME_SIGNAL, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duree);
      o.connect(g).connect(general);
      o.start(t);
      o.stop(t + duree + 0.02);
      t += duree;
    }
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
    maj, basculer, parametres, mixage, signal, historique,
    get actif() { return ctx !== null; },
    get muet() { return muet; },
    get etatContexte() { return ctx ? ctx.state : 'aucun'; },
  };
})();
