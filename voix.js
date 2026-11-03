// La voix du commentateur (tour 45c, le propriétaire 2026-11-02 : « une voix doit se faire entendre ») : la synthèse vocale du navigateur
// (speechSynthesis, aucun fichier de son), dans la langue du jeu (une voix française ou anglaise de l'ordinateur). Le bandeau texte
// reste affiché. Une phrase ne coupe jamais la précédente : celle qui arrive pendant qu'il parle attend (une seule en attente : une
// importante prend la place d'une ordinaire, jamais l'inverse). Le volume suit le réglage du son (le volume du commentateur, son.js),
// sous le moteur (VOIX_VOLUME) ; rien avant le premier geste ni son coupé (Poki), rien quand l'onglet est caché. Sans voix, ou si le
// navigateur ne le permet pas : rien, sans erreur. La voix ne lit jamais la course : elle ne touche à rien (ni hasard ni physique).
// - VOIX.dire(texte, important) ; VOIX.taire() ; VOIX.regler(oui) / VOIX.active (sauvegardé : option 'voix') ; VOIX.disponible()
const VOIX = (function () {
  const R = REGLAGES;
  const synthe = () => (typeof window !== 'undefined' && window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function') ? window.speechSynthesis : null;
  let active = typeof SAUVEGARDE !== 'undefined' ? SAUVEGARDE.option('voix', true) !== false : true;
  let enAttente = null, parle = false, voix = null, dites = 0;
  function choisirVoix() {
    const s = synthe(); if (!s) return null;
    try {
      const l = (typeof LANGUE !== 'undefined' ? LANGUE : 'en'), toutes = s.getVoices() || [];
      const bonnes = toutes.filter(v => v.lang && v.lang.toLowerCase().startsWith(l));
      return bonnes.find(v => v.default) || bonnes.find(v => v.localService) || bonnes[0] || null;
    } catch (e) { return null; }
  }
  function disponible() { if (!synthe()) return false; if (!voix) voix = choisirVoix(); return !!voix; }
  const sonPermis = () => typeof SON === 'undefined' || (SON.actif && !SON.coupe);
  function volume() { const f = typeof SON !== 'undefined' && SON.volumes && typeof SON.volumes.commentateur === 'number' ? SON.volumes.commentateur : 1; return Math.max(0, Math.min(1, f * R.VOIX_VOLUME)); }
  function parler(t) {
    const s = synthe();
    try {
      const u = new window.SpeechSynthesisUtterance(t);
      u.voice = voix; u.lang = voix.lang; u.volume = volume(); u.rate = R.VOIX_DEBIT;
      u.onend = u.onerror = () => { parle = false; const a = enAttente; enAttente = null; if (a && active && sonPermis()) parler(a.texte); };
      parle = true; dites++;
      s.speak(u);
    } catch (e) { parle = false; }
  }
  // une phrase (le texte du bandeau, sans le nom du commentateur) ; important : elle passe devant celle qui attend
  function dire(t, important) {
    if (!active || !t || !sonPermis() || !disponible()) return false;
    if (parle) { if (!enAttente || important || !enAttente.important) enAttente = { texte: t, important: !!important }; return true; }
    parler(t);
    return true;
  }
  function taire() { enAttente = null; parle = false; const s = synthe(); if (s) try { s.cancel(); } catch (e) { /* rien */ } }
  function regler(oui) { active = !!oui; if (typeof SAUVEGARDE !== 'undefined') SAUVEGARDE.ecrireOption('voix', active); if (!active) taire(); return active; }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) taire(); });
  const s0 = synthe();
  if (s0) try { s0.addEventListener('voiceschanged', () => { voix = choisirVoix(); }); } catch (e) { /* rien */ }
  return { dire, taire, regler, disponible, get active() { return active; }, get parle() { return parle; }, get dites() { return dites; }, get enAttente() { return enAttente; } };
})();
