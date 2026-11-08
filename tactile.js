// Le téléphone (tactile.js, tour 51k, CLAUDE.md « Le téléphone : le volant », décision du propriétaire du 2026-11-03) : sur un écran
// tactile seulement, deux gros boutons à demi transparents en bas à droite, FREIN et GAZ (le pouce droit), et l'on tourne en inclinant
// le téléphone comme un volant (DeviceOrientationEvent) ; les boutons ◀ ▶ de secours en bas à gauche quand le volant ne marche pas
// (pas de capteur, autorisation refusée, ou le choix du joueur dans la pause). Les commandes rejoignent les mêmes cibles
// { gaz, frein, direction } que le clavier et la manette (le plus fort des trois) : la physique ne change pas. Sur un écran sans
// tactile, ou TACTILE_ACTIF faux, rien ne s'affiche et rien ne bouge (le clavier seul, au bit près).
//
// Tout ce qui se calcule est pur (testé sans écran) : angle, braquage, lisser, fusionner, portrait ; la page est dans brancher / maj.
const TACTILE = (function () {
  const R = REGLAGES;
  const DEG = 180 / Math.PI;

  // --- le calcul pur
  // l'angle du volant à partir de beta (°) : sin(beta) est la part de la gravité le long du grand côté du téléphone, la seule qui
  // change quand on tourne le téléphone tenu couché comme un volant (qu'il soit dressé devant soi ou presque à plat) ; replié dans
  // −90..90 (l'écran vers le bas donne le même volant)
  function angle(beta) {
    if (typeof beta !== 'number' || !isFinite(beta)) return null;
    return Math.round(Math.asin(Math.max(-1, Math.min(1, Math.sin(beta / DEG)))) * DEG * 1e6) / 1e6;   // (arrondi au millionième : 40 reste 40)
  }
  // le braquage (−1..1) : l'écart au neutre, une zone morte au milieu (sans saut à son bord), VOLANT_PLEIN ° = à fond ;
  // sens = +1 ou −1 selon le côté où le téléphone est couché (landscape-primary ou secondary), VOLANT_INVERSE le retourne
  function braquage(a, neutre, sens) {
    if (a === null || neutre === null) return 0;
    let e = a - neutre;
    if (e > 180) e -= 360; else if (e < -180) e += 360;
    const z = R.VOLANT_ZONE_MORTE, p = R.VOLANT_PLEIN, m = Math.abs(e);
    if (!(m > z)) return 0;
    const d = Math.sign(e) * Math.min(1, (m - z) / (p - z));
    return d * (sens || 1) * (R.VOLANT_INVERSE ? -1 : 1);
  }
  // le léger lissage : la part VOLANT_LISSAGE du nouvel angle à chaque image
  function lisser(avant, a) {
    if (a === null) return avant;
    if (avant === null) return a;
    return avant + (a - avant) * R.VOLANT_LISSAGE;
  }
  // le sens du volant selon le côté où le téléphone est couché : −1 en landscape-secondary (le haut du téléphone à droite)
  function sensEcran(type, orientation) {
    if (type === 'landscape-secondary') return -1;
    if (type === undefined && orientation === -90) return -1;
    return 1;
  }
  // le clavier (et la manette) et le tactile ensemble : le plus fort pour le gaz et le frein, la somme bornée pour la direction
  function fusionner(c, t) {
    if (!t) return c;
    return { gaz: Math.max(c.gaz, t.gaz), frein: Math.max(c.frein, t.frein), direction: Math.max(-1, Math.min(1, c.direction + t.direction)) };
  }
  const portrait = (l, h) => h > l;

  // --- la page
  let present = null;   // un écran tactile ? (calculé une fois)
  function estPresent() {
    if (present === null) {
      const nav = typeof navigator !== 'undefined' ? navigator : {};
      present = !!R.TACTILE_ACTIF && (nav.maxTouchPoints > 0 || (typeof window !== 'undefined' && 'ontouchstart' in window));
    }
    return present;
  }

  const E = {};   // les éléments
  const tenus = { gaz: new Set(), frein: new Set(), gauche: new Set(), droite: new Set() };   // les doigts posés sur chaque bouton
  const V = { mode: 'aucun', neutre: null, brut: null, lisse: null, attente: 0, permission: null, choix: 'volant', conduite: false, ecoute: false };
  // mode : 'aucun' (pas branché), 'attente' (on écoute, rien reçu), 'volant' (le capteur parle), 'boutons' (pas de capteur, ou refusé)
  let rappels = {};

  const $ = id => document.getElementById(id);
  const sens = () => sensEcran(typeof screen !== 'undefined' && screen.orientation ? screen.orientation.type : undefined, typeof window !== 'undefined' ? window.orientation : undefined);

  function surOrientation(e) {
    const a = angle(e.beta);
    if (a === null) return;
    V.brut = a;
    if (V.neutre === null) V.neutre = a;   // la position neutre : la première mesure (puis reprise au départ de la conduite, et « Recentrer »)
    if (V.mode !== 'volant') { V.mode = 'volant'; rafraichir(); }
  }
  function ecouter() {
    if (V.ecoute || typeof window === 'undefined') return;
    V.ecoute = true; V.mode = 'attente'; V.attente = 0;
    window.addEventListener('deviceorientation', surOrientation);
  }
  // iPhone : l'autorisation se demande après un toucher (« 🎮 Activer le volant »)
  function activer() {
    const D = typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : null;
    if (D && typeof D.requestPermission === 'function') {
      V.permission = 'demande';
      let p;
      try { p = D.requestPermission(); } catch (err) { p = Promise.resolve('denied'); }
      Promise.resolve(p).then(r => { V.permission = r === 'granted' ? 'accordee' : 'refusee'; if (r === 'granted') ecouter(); else V.mode = 'boutons'; rafraichir(); },
        () => { V.permission = 'refusee'; V.mode = 'boutons'; rafraichir(); });
    } else { V.permission = 'accordee'; ecouter(); }
    rafraichir();
  }
  const permissionADemander = () => typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';

  // les boutons tenus : chaque doigt (pointerId) est compté sur son bouton, lâché au pointerup / pointercancel ; plusieurs doigts à la fois
  function brancherBouton(el, nom) {
    el.addEventListener('pointerdown', e => { e.preventDefault(); tenus[nom].add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch (err) { /* rien */ } el.classList.add('tenu'); });
    const lacher = e => { tenus[nom].delete(e.pointerId); if (!tenus[nom].size) el.classList.remove('tenu'); };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, lacher);
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  function toutLacher() { for (const n in tenus) { tenus[n].clear(); if (E[n]) E[n].classList.remove('tenu'); } }

  // f : { pause(), remettre(), } ; les textes et les boutons de la page
  function brancher(f) {
    rappels = f || {};
    if (!estPresent() || typeof document === 'undefined') return false;
    for (const [id, nom] of [['tactileGaz', 'gaz'], ['tactileFrein', 'frein'], ['tactileGauche', 'gauche'], ['tactileDroite', 'droite']]) { E[nom] = $(id); if (E[nom]) brancherBouton(E[nom], nom); }
    E.gaz.textContent = texte('tac_gaz'); E.frein.textContent = texte('tac_frein');
    for (const [id, nom] of [['tactilePause', 'pause'], ['tactileRemise', 'remise']]) {
      const el = $(id); if (!el) continue;
      el.addEventListener('pointerdown', e => e.preventDefault());
      el.addEventListener('click', () => { if (rappels[nom === 'pause' ? 'pause' : 'remettre']) rappels[nom === 'pause' ? 'pause' : 'remettre'](); });
    }
    const act = $('tactileActiver');
    if (act) { act.textContent = texte('tac_activer'); act.addEventListener('mousedown', e => e.preventDefault()); act.addEventListener('click', activer); }
    const po = $('tactilePortrait'); if (po) po.textContent = texte('tac_portrait');
    for (const [id, g] of [['boutonVolantPause', () => { V.choix = V.choix === 'volant' ? 'boutons' : 'volant'; rafraichir(); }], ['boutonRecentrerPause', recentrer]]) {
      const b = $(id); if (!b) continue;
      b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', g);
    }
    window.addEventListener('blur', toutLacher);
    document.addEventListener('visibilitychange', toutLacher);
    window.addEventListener('resize', rafraichir);
    if (!permissionADemander()) activer();   // (Android, Chromebook : pas d'autorisation à demander, on écoute tout de suite)
    rafraichir();
    return true;
  }

  // la position neutre reprise : le joueur tient son téléphone comme il veut
  function recentrer() { if (V.brut !== null) { V.neutre = V.brut; V.lisse = V.brut; } rafraichir(); }
  // le volant conduit-il (plutôt que les boutons ◀ ▶) ?
  const volantActif = () => V.mode === 'volant' && V.choix === 'volant';

  function rafraichir() {
    if (!E.gaz) return;
    const t = $('tactile'), conduite = V.conduite;
    if (t) t.classList.toggle('cache', !conduite);
    for (const n of ['gauche', 'droite']) if (E[n]) E[n].classList.toggle('cache', volantActif());
    const act = $('tactileActiver');
    if (act) act.classList.toggle('cache', conduite || !permissionADemander() || V.permission !== null);
    const po = $('tactilePortrait');
    if (po) po.classList.toggle('cache', !portrait(window.innerWidth, window.innerHeight));
    const bv = $('boutonVolantPause'), br = $('boutonRecentrerPause');
    if (bv) { bv.classList.toggle('cache', V.mode !== 'volant'); bv.textContent = texte(V.choix === 'volant' ? 'tac_mode_volant' : 'tac_mode_boutons'); }
    if (br) { br.classList.toggle('cache', !volantActif()); br.textContent = texte('tac_recentrer'); }
  }

  // à chaque image : conduite = la voiture est au joueur (course, survol, tour de qualification) ; dt en s
  function maj(conduite, dt) {
    if (!E.gaz) return;
    if (conduite && !V.conduite) { if (V.brut !== null) { V.neutre = V.brut; V.lisse = V.brut; } toutLacher(); }   // le neutre pris au départ
    if (conduite !== V.conduite) { V.conduite = conduite; rafraichir(); }
    if (V.mode === 'attente') { V.attente += dt || 0; if (V.attente >= R.VOLANT_ATTENTE) { V.mode = 'boutons'; rafraichir(); } }   // pas de capteur : ◀ ▶
    V.lisse = lisser(V.lisse, V.brut);
  }
  // les cibles du tactile (le plus fort rejoint celles du clavier) ; null sans écran tactile
  function cibles() {
    if (!E.gaz) return null;
    const direction = volantActif() ? braquage(V.lisse, V.neutre, sens()) : (tenus.droite.size ? 1 : 0) - (tenus.gauche.size ? 1 : 0);
    return { gaz: tenus.gaz.size ? 1 : 0, frein: tenus.frein.size ? 1 : 0, direction };
  }

  return { angle, braquage, lisser, sensEcran, fusionner, portrait, estPresent, brancher, maj, cibles, recentrer, activer, etat: V };
})();
