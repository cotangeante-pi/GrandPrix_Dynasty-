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
  // (tour 53f) les réglages du joueur (Réglages du paddock et pause, sauvegardés) : le cran de sensibilité (0 doux, 1 normal, 2 vif) et le sens retourné
  const G = { cran: 1, inverse: false };
  const DEG = 180 / Math.PI;

  // --- le calcul pur
  // l'angle du volant à partir de beta (°) : sin(beta) est la part de la gravité le long du grand côté du téléphone, la seule qui
  // change quand on tourne le téléphone tenu couché comme un volant (qu'il soit dressé devant soi ou presque à plat) ; replié dans
  // −90..90 (l'écran vers le bas donne le même volant)
  function angle(beta) {
    if (typeof beta !== 'number' || !isFinite(beta)) return null;
    return Math.round(Math.asin(Math.max(-1, Math.min(1, Math.sin(beta / DEG)))) * DEG * 1e6) / 1e6;   // (arrondi au millionième : 40 reste 40)
  }
  // (tour 56, T15) le volant du téléphone tenu DEBOUT (le jeu est tourné) : on tourne le téléphone dans son plan, comme un vrai volant ;
  // la gravité mesurée a pour composantes gx = −cos(beta)·sin(gamma) (le petit côté) et gy = sin(beta) (le grand côté) : l'angle de roulis,
  // dans le sens des aiguilles d'une montre (le haut du téléphone part vers la droite) positif, braque à droite
  function angleDebout(beta, gamma) {
    if (typeof beta !== 'number' || typeof gamma !== 'number' || !isFinite(beta) || !isFinite(gamma)) return null;
    const gx = Math.cos(beta / DEG) * Math.sin(gamma / DEG), gy = Math.sin(beta / DEG);
    if (gx * gx + gy * gy < 1e-6) return null;   // (téléphone à plat : pas d'angle)
    return Math.round(Math.atan2(gx, gy) * DEG * 1e6) / 1e6;
  }
  // le braquage (−1..1) : l'écart au neutre, une zone morte au milieu (sans saut à son bord), VOLANT_PLEIN ° = à fond ;
  // sens = +1 ou −1 selon le côté où le téléphone est couché (landscape-primary ou secondary), VOLANT_INVERSE le retourne
  function braquage(a, neutre, sens) {
    if (a === null || neutre === null) return 0;
    let e = a - neutre;
    if (e > 180) e -= 360; else if (e < -180) e += 360;
    const z = R.VOLANT_ZONE_MORTE, p = R.VOLANT_PLEIN * (R.VOLANT_SENSIBILITE && R.VOLANT_SENSIBILITE[G.cran] !== undefined ? R.VOLANT_SENSIBILITE[G.cran] : 1), m = Math.abs(e);
    if (!(m > z)) return 0;
    const d = Math.sign(e) * Math.min(1, (m - z) / (p - z));
    return d * (sens || 1) * (R.VOLANT_INVERSE !== G.inverse ? -1 : 1);
  }
  // le léger lissage, en temps (pas en images : un téléphone lent suit quand même) : l'angle rejoint la mesure en VOLANT_LISSAGE s
  function lisser(avant, a, dt) {
    if (a === null) return avant;
    if (avant === null) return a;
    const k = R.VOLANT_LISSAGE > 0 ? Math.min(1, (dt || 0) / R.VOLANT_LISSAGE) : 1;
    return avant + (a - avant) * k;
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
  // (tour 56, le propriétaire 2026-11-13 : « le message tourner le téléphone apparaît un peu souvent ») : debout seulement si nettement
  // plus haut que large (PORTRAIT_MARGE : pas un écran presque carré, ni un instant de rotation où le navigateur rend des tailles à moitié
  // changées) ; PORTRAIT_MARGE 1 = la règle d'avant (h > l)
  const portrait = (l, h) => h > l * (REGLAGES.PORTRAIT_MARGE || 1);

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
  const V = { tourne: false, pauseDebout: false, deboutDepuis: null, mode: 'aucun', neutre: null, brut: null, lisse: null, attente: 0, grille: false, permission: null, choix: 'volant', conduite: false, ecoute: false };
  // mode : 'aucun' (pas branché), 'attente' (on écoute, rien reçu), 'volant' (le capteur parle), 'boutons' (pas de capteur, ou refusé)
  let rappels = {};

  const $ = id => document.getElementById(id);
  const sens = () => sensEcran(typeof screen !== 'undefined' && screen.orientation ? screen.orientation.type : undefined, typeof window !== 'undefined' ? window.orientation : undefined);

  function surOrientation(e) {
    const a = V.tourne ? angleDebout(e.beta, e.gamma) : angle(e.beta);
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

  // le premier geste : le plein écran puis le verrou en paysage ; tout dans des try / promesses ignorées (le refus ne se voit jamais : iPhone Safari,
  // l'iframe de Poki ; on garde alors le message « Tourne ton téléphone »)
  let geste = false;
  function premierGeste() {
    if (geste) return;
    geste = true;
    for (const ev of ['pointerup', 'touchend', 'click']) document.removeEventListener(ev, premierGeste, true);
    const verrouiller = () => { try { const o = screen.orientation; if (o && o.lock) { const p = o.lock('landscape'); if (p && p.catch) p.catch(() => {}); } } catch (err) { /* rien */ } };
    try {
      const el = document.documentElement;
      if (el && el.requestFullscreen) { const p = el.requestFullscreen(); if (p && p.then) p.then(verrouiller, verrouiller); else verrouiller(); } else verrouiller();
    } catch (err) { verrouiller(); }
  }

  // (tour 53f) les réglages du volant : des gros boutons (≥ 40 px), dans la pause et dans les Réglages du paddock, sur écran tactile seulement ;
  // les choix sont gardés par f.ecrire(nom, valeur) (la sauvegarde) et relus par f.lire() au démarrage
  const reglageBoutons = [];
  function sauver(nom, valeur) { if (rappels.ecrire) rappels.ecrire(nom, valeur); }
  function textesReglages() {
    for (const [b, cle] of reglageBoutons) {
      if (cle === 'sens') b.textContent = texte('tac_sens').replace('{v}', texte('tac_sens' + G.cran));
      else if (cle === 'inverse') b.textContent = texte(G.inverse ? 'tac_inverse_oui' : 'tac_inverse_non');
      else if (cle === 'choix') b.textContent = texte(V.choix === 'volant' ? 'tac_choix_volant' : 'tac_choix_boutons');
      else if (cle === 'recentrer') b.textContent = texte('tac_recentrer');
    }
    const ti = $('reglagesVolantTitre'); if (ti) ti.textContent = texte('tac_titreVolant');
  }
  const actions = {
    sens: () => { G.cran = (G.cran + 1) % 3; sauver('volant_sensibilite', G.cran); },
    inverse: () => { G.inverse = !G.inverse; sauver('volant_inverse', G.inverse); },
    choix: () => { V.choix = V.choix === 'volant' ? 'boutons' : 'volant'; sauver('volant_choix', V.choix); },
    recentrer: () => recentrer(),
  };
  function construireReglages(parent, prefixe, cles) {
    if (!parent) return;
    for (const cle of cles) {
      const b = document.createElement('button'); b.className = 'petit tactileReglage'; b.id = prefixe + '_' + cle; b.tabIndex = -1;
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => { actions[cle](); textesReglages(); rafraichir(); });
      parent.appendChild(b); reglageBoutons.push([b, cle]);
    }
  }

  // f : { pause(), remettre(), lire(), ecrire() } ; les textes et les boutons de la page
  function brancher(f) {
    rappels = f || {};
    if (!estPresent() || typeof document === 'undefined') return false;
    if (rappels.lire) { const d = rappels.lire() || {}; if ([0, 1, 2].includes(d.sensibilite)) G.cran = d.sensibilite; G.inverse = d.inverse === true; if (d.choix === 'volant' || d.choix === 'boutons') V.choix = d.choix; }
    document.body.classList.add('tactile'); document.body.classList.toggle('commentaireSansTexte', !R.COMMENTAIRE_TEXTE_TACTILE);   // (tour 55 : pas de bandeau texte du commentateur au doigt)   // (style.css : la vitesse et les pneus s'écartent des boutons, l'aide du clavier se cache)
    for (const [id, nom] of [['tactileGaz', 'gaz'], ['tactileFrein', 'frein'], ['tactileGauche', 'gauche'], ['tactileDroite', 'droite']]) { E[nom] = $(id); if (E[nom]) brancherBouton(E[nom], nom); }
    E.gaz.textContent = texte('tac_gaz'); E.frein.textContent = texte('tac_frein');
    for (const [id, nom] of [['tactilePause', 'pause'], ['tactileRemise', 'remettre'], ['tactileCamera', 'camera']]) {   // (tour 56, T14 : la caméra, comme la touche C)
      const el = $(id); if (!el) continue;
      el.addEventListener('pointerdown', e => e.preventDefault());
      el.addEventListener('click', () => { if (rappels[nom]) rappels[nom](); });
    }
    const cam = $('tactileCamera'); if (cam) { cam.title = texte('tac_camera'); cam.setAttribute('aria-label', texte('tac_camera')); }
    const act = $('tactileActiver');
    if (act) { act.textContent = texte('tac_activer'); act.addEventListener('mousedown', e => e.preventDefault()); act.addEventListener('click', activer); }
    const po = $('tactilePortrait'); if (po) po.textContent = texte('tac_portrait');
    for (const [id, g] of [['boutonVolantPause', () => { actions.choix(); rafraichir(); }], ['boutonRecentrerPause', recentrer]]) {
      const b = $(id); if (!b) continue;
      b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', g);
    }
    const pt = $('pauseTactile'), pg = document.querySelector('#reglagesVolant .pageBoutons');
    construireReglages(pt, 'pauseTactile', ['sens', 'inverse']); construireReglages(pg, 'reglagesVolant', ['sens', 'inverse', 'choix', 'recentrer']);
    if (R.TACTILE_PAYSAGE) for (const ev of ['pointerup', 'touchend', 'click']) document.addEventListener(ev, premierGeste, true);   // (le plein écran demande un vrai geste : au premier appui lâché)
    window.addEventListener('blur', toutLacher);
    document.addEventListener('visibilitychange', toutLacher);
    window.addEventListener('resize', rafraichir);
    window.addEventListener('orientationchange', relireApresRotation);
    try { if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', relireApresRotation); } catch (err) { /* rien */ }
    if (window.visualViewport) window.visualViewport.addEventListener('resize', rafraichir);
    if (!permissionADemander()) activer();   // (Android, Chromebook : pas d'autorisation à demander, on écoute tout de suite)
    rafraichir();
    return true;
  }

  // (tour 56, T14) le choix des pneus pendant l'arrêt au stand, au doigt : une rangée de boutons (un par pneu), à la place de ← → ; types = la liste
  // des pneus permis, ou null hors de l'arrêt (la rangée se cache) ; courant = le pneu qui sera monté ; le doigt appelle rappels.pneu(type)
  const P = { cle: '' };
  function pneus(types, courant) {
    const el = $('tactilePneus');
    if (!el) return;
    document.body.classList.toggle('tactileStand', !!(types && types.length));   // (la vitesse et les pneus du HUD s'effacent pendant l'arrêt : la voiture est tenue)
    if (!types || !types.length) { if (P.cle) { P.cle = ''; el.classList.add('cache'); } return; }
    const cle = types.join() + LANGUE;
    if (cle !== P.cle) {
      P.cle = cle; el.textContent = '';
      for (const type of types) {
        const b = document.createElement('div'); b.className = 'tactilePneu'; b.dataset.pneu = type; b.textContent = texte('pneu_' + type);
        b.addEventListener('pointerdown', e => { e.preventDefault(); if (rappels.pneu) rappels.pneu(type); });
        b.addEventListener('contextmenu', e => e.preventDefault());
        el.appendChild(b);
      }
      el.classList.remove('cache');
    }
    for (const b of el.children) b.classList.toggle('choisi', b.dataset.pneu === courant);
  }

  // la position neutre reprise : le joueur tient son téléphone comme il veut
  function recentrer() { if (V.brut !== null) { V.neutre = V.brut; V.lisse = V.brut; } rafraichir(); }
  // le volant conduit-il (plutôt que les boutons ◀ ▶) ?
  const volantActif = () => V.mode === 'volant' && V.choix === 'volant';
  // (tour 56) debout « pour de bon » : depuis PORTRAIT_DELAI s au moins (un volant tourné fort fait parfois pivoter l'écran un instant :
  // ni message ni pause pour ça) ; couché, tout de suite ; PORTRAIT_DELAI 0 = comme avant
  // (tour 56, le propriétaire : « il me réaffiche ce message même si mon téléphone est couché ») : après une rotation, certains
  // navigateurs (iPhone surtout) envoient « resize » avant d'avoir changé innerWidth / innerHeight, et plus rien ensuite : le message
  // restait. Maintenant : (1) l'angle du téléphone (window.orientation), quand le navigateur le donne, l'emporte : couché à ±90°, jamais debout ; (2) on
  // relit après chaque rotation (à 150, 500 et 1000 ms) ; (3) tant que le message est affiché, on relit toutes les 400 ms.
  let minuteurDebout = null, relecture = null;
  function angleCouche() {
    // (window.orientation : donné par les navigateurs des téléphones, iPhone et Android, pas par ceux des ordinateurs ; screen.orientation,
    // lui, répond aussi sur un ordinateur, où il suit l'écran et non la fenêtre : on ne s'y fie pas)
    return typeof window.orientation === 'number' && Math.abs(window.orientation) === 90;
  }
  function relireApresRotation() { for (const ms of [150, 500, 1000]) setTimeout(rafraichir, ms); }
  function suivreMessage(visible) {
    if (visible && relecture === null) relecture = setInterval(rafraichir, 400);
    if (!visible && relecture !== null) { clearInterval(relecture); relecture = null; }
  }
  function deboutStable() {
    if (!portrait(window.innerWidth, window.innerHeight) || (REGLAGES.PORTRAIT_ANGLE && angleCouche())) { V.deboutDepuis = null; return false; }
    const maintenant = performance.now(), delai = (REGLAGES.PORTRAIT_DELAI || 0) * 1000;
    if (V.deboutDepuis === null) V.deboutDepuis = maintenant;
    if (maintenant - V.deboutDepuis >= delai) return true;
    if (minuteurDebout === null) minuteurDebout = setTimeout(() => { minuteurDebout = null; rafraichir(); }, delai - (maintenant - V.deboutDepuis) + 20);
    return false;
  }

  // (tour 56, T15) téléphone debout pour de bon (deboutStable) et PORTRAIT_TOURNER : html.tourne et la taille du jeu (--jw × --jh : la fenêtre,
  // largeur et hauteur échangées) ; couché de nouveau, tout redevient comme avant. Le volant change d'axe : le neutre est repris à la mesure suivante.
  function appliquerTourne() {
    if (typeof document === 'undefined') return;
    const racine = document.documentElement, voulu = !!R.PORTRAIT_TOURNER && deboutStable();
    if (voulu) { racine.style.setProperty('--jw', window.innerHeight + 'px'); racine.style.setProperty('--jh', window.innerWidth + 'px'); }
    if (voulu === V.tourne) return;
    V.tourne = voulu;
    racine.classList.toggle('tourne', voulu);
    if (!voulu) { racine.style.removeProperty('--jw'); racine.style.removeProperty('--jh'); }
    V.brut = null; V.neutre = null; V.lisse = null;
    // (la mise en page change : les éléments qui lisent leur taille la relisent)
    try { window.dispatchEvent(new Event('resize')); } catch (err) { /* rien */ }
  }
  // la taille du JEU (celle qu'il voit : tournée, largeur et hauteur échangées) et les doigts / la souris ramenés dans le jeu
  const tailleJeu = () => V.tourne ? { l: window.innerHeight, h: window.innerWidth } : { l: window.innerWidth, h: window.innerHeight };
  // un écart (dx, dy) en pixels de la fenêtre -> le même écart dans le jeu (tourné de 90° dans le sens inverse des aiguilles : x_jeu = −dy, y_jeu = dx)
  // le rectangle d'un élément DANS le jeu (getBoundingClientRect donne l'espace de la fenêtre : tourné, il faut le ramener) :
  // fenêtre (X, Y) = (y_jeu, largeur_jeu − x_jeu), donc x_jeu = largeur_jeu − Y et y_jeu = X
  function rectJeu(el) {
    const r = el.getBoundingClientRect();
    if (!V.tourne) return r;
    const lj = window.innerHeight, left = lj - r.bottom, top = r.left;
    return { left, top, right: lj - r.top, bottom: r.right, x: left, y: top, width: r.height, height: r.width };
  }
  const ecartJeu = (dx, dy) => V.tourne ? { x: -dy, y: dx } : { x: dx, y: dy };

  function rafraichir() {
    if (!E.gaz) return;
    const t = $('tactile'), conduite = V.conduite;
    if (t) t.classList.toggle('cache', !conduite);
    document.body.classList.toggle('tactileFreinG', !!R.TACTILE_FREIN_GAUCHE && volantActif());   // (2026-11-12 : FREIN au pouce gauche quand le volant conduit ; avec ◀ ▶ il reste à côté de GAZ)
    document.body.classList.toggle('tactileBoutons', conduite && !volantActif());   // (tour 53d : style.css, le radar et l'aide ◀ ▶ s'écartent des vrais boutons)
    for (const n of ['gauche', 'droite']) if (E[n]) E[n].classList.toggle('cache', volantActif());
    const act = $('tactileActiver');
    // (tour 53e) iPhone : « 🎮 Activer le volant » sur la grille, pendant les feux (R.TACTILE_IPHONE_GRILLE) ; faux : sur l'écran titre, comme avant
    if (act) act.classList.toggle('cache', !permissionADemander() || V.permission !== null || (R.TACTILE_IPHONE_GRILLE ? !V.grille : conduite));
    const po = $('tactilePortrait');
    appliquerTourne();
    if (po) { const debout = deboutStable(); po.classList.toggle('cache', !debout || !!R.PORTRAIT_TOURNER); suivreMessage(debout); }   // (la relecture toutes les 400 ms tant que debout : le jeu tourné ou le message ne restent pas collés)
    const bv = $('boutonVolantPause'), br = $('boutonRecentrerPause'), ligne = $('pauseTactile');
    if (ligne) ligne.classList.toggle('cache', V.mode !== 'volant');   // (la rangée entière : sans volant, la pause garde sa hauteur d'avant)
    if (bv) { bv.classList.toggle('cache', V.mode !== 'volant'); bv.textContent = texte(V.choix === 'volant' ? 'tac_mode_volant' : 'tac_mode_boutons'); }
    if (br) { br.classList.toggle('cache', !volantActif()); br.textContent = texte('tac_recentrer'); }
    textesReglages();
  }

  // à chaque image : conduite = la voiture est au joueur (course, survol, tour de qualification) ; dt en s
  function maj(conduite, dt, grille) {
    if (!E.gaz) return;
    if (!!grille !== V.grille) { V.grille = !!grille; rafraichir(); }   // (tour 53e : la grille avec les feux allumés)
    if (conduite && !V.conduite) { if (V.brut !== null) { V.neutre = V.brut; V.lisse = V.brut; } toutLacher(); }   // le neutre pris au départ
    if (conduite !== V.conduite) { V.conduite = conduite; rafraichir(); }
    // téléphone debout pendant la conduite : la course se met en pause (une fois) ; couché de nouveau, elle reprend seulement par « Reprendre »
    const debout = deboutStable() && !R.PORTRAIT_TOURNER;   // (le jeu tourné ne se met pas en pause : il s'affiche, voir appliquerTourne)
    if (deboutStable() && !V.deboutVu) rafraichir();   // (le message suit la pause dans la même image)
    V.deboutVu = deboutStable();
    appliquerTourne();
    if (debout && conduite && !V.pauseDebout) { V.pauseDebout = true; if (rappels.pause) rappels.pause(); }
    if (!debout) V.pauseDebout = false;
    if (V.mode === 'attente') { V.attente += dt || 0; if (V.attente >= R.VOLANT_ATTENTE) { V.mode = 'boutons'; rafraichir(); } }   // pas de capteur : ◀ ▶
    V.lisse = lisser(V.lisse, V.brut, dt || 0);
  }
  // les cibles du tactile (le plus fort rejoint celles du clavier) ; null sans écran tactile
  function cibles() {
    if (!E.gaz) return null;
    const direction = volantActif() ? braquage(V.lisse, V.neutre, V.tourne ? 1 : sens()) : (tenus.droite.size ? 1 : 0) - (tenus.gauche.size ? 1 : 0);
    return { gaz: tenus.gaz.size ? 1 : 0, frein: tenus.frein.size ? 1 : 0, direction };
  }

  return { angle, braquage, lisser, sensEcran, fusionner, portrait, estPresent, tailleJeu, ecartJeu, rectJeu, brancher, maj, cibles, pneus, recentrer, activer, etat: V, reglages: G };
})();
