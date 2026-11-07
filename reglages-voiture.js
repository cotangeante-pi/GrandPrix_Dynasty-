// Les réglages de la voiture (CLAUDE.md « La personnalisation », liste approuvée par le propriétaire le 2026-11-06 ; tour 50b), en calcul
// pur (ni Three.js ni page), sur le modèle de l'aileron (aileron.js). Quatre curseurs de RV_CRANS crans, chacun un ÉCHANGE, jamais un bonus
// (hors du plafond du garage) :
//   freins      : l'équilibre des freins ; vers l'avant (cran haut) : freinage plus fort depuis les grandes vitesses, moins fort à basse vitesse,
//                 roues avant qui bloquent au freinage en virage ; vers l'arrière : l'inverse
//   boite       : courte (cran haut) : plus de force à basse vitesse (accélération), moins en haut (vitesse de pointe) ; longue : l'inverse
//   suspensions : dures (cran haut) : plus d'adhérence dans les virages rapides, moins dans les lents ; souples : l'inverse
//   pression    : haute (cran haut) : moins d'adhérence, moins de frottement (traînée et roulement) et moins d'usure ; basse : l'inverse
// Le cran du milieu de chacun = le « Réglage conseillé » = la voiture d'aujourd'hui au bit près : appliquer() n'y pose AUCUN champ (physique.js
// lit « || 1 » et ne touche à rien). Les effets sont lus par physique.js (rvFrein, rvBlocage, rvBoite, rvSuspension, rvAdherence,
// rvRoulement), pneus.js (rvUsure), robot.js et ia.js (ce que le pilote sait de sa voiture) : le même code pour le joueur et les IA.
// Le réglage du joueur est gardé par circuit (ch.reglagesVoiture, dans la sauvegarde unique ; rien = le conseillé) ; les IA règlent leur
// voiture avant chaque Grand Prix selon le circuit (AILERON.profil), leur caractère et hasard(), avec leur propre graine.
// Réglages : RV_* (donnees.js).
const REGLAGES_VOITURE = (function () {
  const R = REGLAGES;
  const NOMS = ['freins', 'boite', 'suspensions', 'pression'];
  const milieu = () => Math.floor(R.RV_CRANS / 2);
  const borner = c => Math.max(0, Math.min(R.RV_CRANS - 1, Math.round(Number(c) || 0)));
  const valide = c => Number.isInteger(c) && c >= 0 && c < R.RV_CRANS;

  // le réglage conseillé : tous les curseurs au milieu
  function conseille() {
    const r = {};
    for (const n of NOMS) r[n] = milieu();
    return r;
  }

  // un réglage complet et valide à partir de n'importe quoi (une vieille sauvegarde, un réglage partiel) : ce qui manque est au milieu
  function normaliser(r) {
    const o = conseille();
    if (r && typeof r === 'object') for (const n of NOMS) if (valide(r[n])) o[n] = r[n];
    return o;
  }

  const estConseille = r => NOMS.every(n => normaliser(r)[n] === milieu());

  // les effets d'un réglage, en facteurs (1 = rien) et en écarts (0 = rien)
  function effets(r) {
    const x = normaliser(r), d = n => x[n] - milieu();
    return {
      frein: d('freins') * R.RV_FREINS_FORCE, blocage: d('freins') * R.RV_FREINS_BLOCAGE,
      boite: d('boite') * R.RV_BOITE,
      suspension: d('suspensions') * R.RV_SUSPENSION,
      adherence: 1 - d('pression') * R.RV_PRESSION_ADHERENCE, roulement: 1 - d('pression') * R.RV_PRESSION_ROULEMENT, usure: 1 - d('pression') * R.RV_PRESSION_USURE,
    };
  }

  const CHAMPS = ['rvFrein', 'rvBlocage', 'rvBoite', 'rvSuspension', 'rvAdherence', 'rvRoulement', 'rvUsure'];

  // pose le réglage r sur la voiture v (null, absent ou le conseillé : les champs sont enlevés, la voiture d'aujourd'hui au bit près)
  function appliquer(v, r) {
    for (const c of CHAMPS) delete v[c];
    if (!r || estConseille(r)) return v;
    const e = effets(r), x = normaliser(r), poser = (champ, val, neutre) => { if (val !== neutre) v[champ] = val; };
    poser('rvFrein', e.frein, 0); poser('rvBlocage', e.blocage, 0);
    poser('rvBoite', e.boite, 0);
    poser('rvSuspension', e.suspension, 0);
    poser('rvAdherence', e.adherence, 1); poser('rvRoulement', e.roulement, 1); poser('rvUsure', e.usure, 1);
    v.reglageVoiture = x;
    return v;
  }

  // le réglage du joueur sur un circuit (jamais réglé, ou une vieille sauvegarde : le conseillé)
  function de(ch, circuit) {
    return normaliser(ch && ch.reglagesVoiture && typeof ch.reglagesVoiture === 'object' ? ch.reglagesVoiture[circuit] : null);
  }

  function completer(ch) {
    if (!ch.reglagesVoiture || typeof ch.reglagesVoiture !== 'object') ch.reglagesVoiture = {};
    return ch;
  }

  // change un curseur du joueur sur un circuit ; renvoie le réglage complet
  function regler(ch, circuit, nom, cran) {
    completer(ch);
    if (!NOMS.includes(nom)) return de(ch, circuit);
    const r = de(ch, circuit);
    r[nom] = borner(cran);
    ch.reglagesVoiture[circuit] = r;
    return r;
  }

  // « Réglage conseillé » : tout au milieu (le circuit n'a plus de réglage à lui)
  function remettre(ch, circuit) {
    completer(ch);
    delete ch.reglagesVoiture[circuit];
    return de(ch, circuit);
  }

  // ce que montre l'écran : deux barres de 0 à 1 par curseur (ce qu'on gagne d'un côté, ce qu'on gagne de l'autre ; le milieu à 0,5)
  function barres(nom, cran) {
    const x = borner(cran) / (R.RV_CRANS - 1);
    return { haut: x, bas: 1 - x };
  }

  // le cran d'une IA pour un réglage : le circuit (prof = AILERON.profil), son caractère et une part de hasard() (le flux en cours)
  function choisirIA(nom, caractere, prof) {
    const c = caractere || {};
    const x = milieu()
      + (prof.lents - prof.droites - R.AILERON_IA_REFERENCE) * R.RV_IA_CIRCUIT[nom]
      + ((c.agressivite === undefined ? 0.5 : c.agressivite) - 0.5) * R.RV_IA_AGRESSIVITE[nom]
      + (hasard() - 0.5) * R.RV_IA_HASARD;
    return borner(Math.max(milieu() - R.RV_IA_ECART, Math.min(milieu() + R.RV_IA_ECART, x)));
  }

  // le réglage complet d'une IA (les quatre curseurs, dans l'ordre de NOMS)
  function reglageIA(caractere, prof) {
    const r = {};
    for (const n of NOMS) r[n] = choisirIA(n, caractere, prof);
    return r;
  }

  // les réglages des IA d'un Grand Prix du championnat (la graine du championnat, la saison et le Grand Prix ; à part des autres tirages) :
  // [k] = réglage (le joueur : null)
  function reglagesIA(ch, circuit) {
    const prof = AILERON.profil(circuit), liste = [];
    ALEATOIRE.semer((ch.graine || 0) + R.GRAINE_REGLAGES_VOITURE + ch.saison * 1000 + ch.prochain);
    for (const p of ch.pilotes) liste.push(p.humain ? null : reglageIA(p.caractere, prof));
    ALEATOIRE.semer();
    return liste;
  }

  return { NOMS, milieu, conseille, normaliser, estConseille, effets, appliquer, de, completer, regler, remettre, barres, choisirIA, reglageIA, reglagesIA };
})();
