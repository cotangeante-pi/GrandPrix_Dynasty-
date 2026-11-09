// Les touches de chaque joueur, à deux (le propriétaire, 2026-11-02, après l'essai : « 2 joueurs il faudrait montrer les touches »), en calcul pur :
// le nom de chaque touche (TOUCHES_DEUX, par e.code) selon la disposition du clavier quand le navigateur la donne
// (navigator.keyboard.getLayoutMap : Z Q S D en AZERTY, W A S D en QWERTY), sinon les deux ; la carte d'un joueur ; et le rappel
// pendant les feux et les premières secondes, qui s'efface quand le joueur a utilisé chaque commande, ou DEUX_RAPPEL_DUREE s après
// l'extinction des feux. Rien ici ne touche à la physique : seulement ce qui est affiché.
const TOUCHES_DEUX_ECRAN = (function () {
  const R = REGLAGES;
  const FIXES = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
  const NOMMEES = { Enter: 'tch_entree', NumpadEnter: 'tch_entree', ShiftRight: 'tch_majDroite', ShiftLeft: 'tch_majGauche', Escape: 'tch_echap', Space: 'tch_espace',
    Tab: 'tch_tab', Backspace: 'tch_retourArriere', ControlLeft: 'tch_ctrl', ControlRight: 'tch_ctrl', AltLeft: 'tch_alt', AltRight: 'tch_alt', CapsLock: 'tch_verrMaj' };
  // (tour 51j) les signes : le nom QWERTY et le nom AZERTY de la même place (sans la disposition, les deux, comme les lettres) ; le pavé numérique
  const PONCTUATION = { Semicolon: [';', 'M'], Comma: [',', ';'], Period: ['.', ':'], Slash: ['/', '!'], Quote: ["'", 'ù'], BracketLeft: ['[', '^'], BracketRight: [']', '$'],
    Minus: ['-', ')'], Equal: ['=', '='], Backquote: ['`', '²'], Backslash: ['\\', '*'], IntlBackslash: ['\\', '<'] };
  const PAVE = { NumpadAdd: '+', NumpadSubtract: '-', NumpadMultiply: '*', NumpadDivide: '/', NumpadDecimal: '.' };
  // en AZERTY, les lettres qui ne sont pas à la même place qu'en QWERTY (celles de TOUCHES_DEUX)
  const AZERTY = { W: 'Z', A: 'Q', Q: 'A', Z: 'W' };
  const ACTIONS = ['gaz', 'frein', 'gauche', 'droite'];

  // le nom d'une touche : dispo = la disposition du clavier (une Map de e.code → caractère) ou null (inconnue : les deux noms)
  function nom(code, dispo) {
    if (FIXES[code]) return FIXES[code];
    if (NOMMEES[code]) return texte(NOMMEES[code]);
    let m = /^Digit([0-9])$/.exec(code);
    if (m) return m[1];
    m = /^Numpad([0-9])$/.exec(code);
    if (m || PAVE[code]) return texte('tch_num') + ' ' + (m ? m[1] : PAVE[code]);
    if (dispo && typeof dispo.get === 'function') { const l = dispo.get(code); if (typeof l === 'string' && l.length === 1 && l.trim()) return l.toUpperCase(); }
    const deux = (qw, az) => (az === qw ? qw : LANGUE === 'fr' ? az + '/' + qw : qw + '/' + az);   // (le clavier le plus courant d'abord)
    m = /^Key([A-Z])$/.exec(code);
    if (m) return deux(m[1], AZERTY[m[1]] || m[1]);
    if (PONCTUATION[code]) return deux(PONCTUATION[code][0], PONCTUATION[code][1]);
    return code;   // (F1, Home… : lisibles tels quels)
  }

  // la carte du joueur j : le nom de chaque commande
  function carte(j, dispo) {
    const T = R.TOUCHES_DEUX[j], c = {};
    for (const a of ACTIONS) c[a] = nom(T[a][0], dispo);
    c.remise = T.remise.map(x => nom(x, dispo)).join(texte('tch_ou'));
    return c;
  }

  // le rappel : vues[j][action] = la commande a servi ; t = le temps depuis l'extinction des feux
  function creerRappel() { return { t: 0, vues: { 1: {}, 2: {} } }; }
  // cibles = { 1: {gaz, frein, direction}, 2: … } (le clavier et la manette ensemble) ; feuxAllumes : le rappel reste
  function pasRappel(r, cibles, feuxAllumes, dt) {
    if (!feuxAllumes) r.t += dt;
    for (const j of [1, 2]) {
      const c = cibles[j], v = r.vues[j];
      if (!c) continue;
      if (c.gaz > 0) v.gaz = true;
      if (c.frein > 0) v.frein = true;
      if (c.direction < 0) v.gauche = true;
      if (c.direction > 0) v.droite = true;
    }
    return r;
  }
  // le rappel du joueur j est-il encore à l'écran
  const visible = (r, j) => !!r && r.t < R.DEUX_RAPPEL_DUREE && !ACTIONS.every(a => r.vues[j][a]);

  return { nom, carte, creerRappel, pasRappel, visible, ACTIONS };
})();
