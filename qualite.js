// La qualité de l'image (étape 10 ; tour 40 les trois crans ; tour 49a l'Auto continu, CLAUDE.md « L'Auto qui tient 58 images/s »).
// Elle ne change que le dessin, jamais la physique ni les IA. Le calcul est pur (testé sans écran, tests/test.html).
// - « haute », « moyenne », « basse » : un réglage fixe (QUALITE_CRANS ; haute = l'image d'avant).
// - « auto » (par défaut) : un niveau de 0 (le plus beau) à QUALITE_PAS.length (le plus simple), un petit pas à la fois, du moins
//   visible au plus visible (QUALITE_PAS : les voitures lointaines, la densité du décor, sa distance de dessin, les effets, le
//   rétroviseur, les pixels). Sous QUALITE_IPS_MIN images/s (moyenne sur QUALITE_MOYENNE s), on simplifie d'un pas toutes les QUALITE_PAS_DESCENTE s
//   au plus, jusqu'à revenir à QUALITE_IPS_VISEE ou plus. Le détail revient d'un pas toutes les QUALITE_PAS_RETOUR s au plus, et
//   seulement si le temps de calcul d'une image est sous QUALITE_MARGE du temps permis (QUALITE_TEMPS_PERMIS) ; un pas rendu qui
//   refait passer sous QUALITE_IPS_VISEE est repris aussitôt, et ce niveau n'est plus rendu avant QUALITE_BLOCAGE s (doublé à
//   chaque échec). Pendant les feux, rien ne se juge ni ne change. Jamais simplifié : la piste, les vibreurs, les repères, la
//   trajectoire conseillée, la voiture du joueur (scene3d.js).
const QUALITE = (function () {
  const R = REGLAGES;
  const REGLES = ['auto', 'haute', 'moyenne', 'basse'];
  const CRAN = { haute: 0, moyenne: 1, basse: 2 };

  // le plus beau : l'image d'avant (les réglages de toujours de donnees.js)
  function plusBeau() {
    return { pixelRatio: R.PIXEL_RATIO_MAX, detail: R.DECOR_DETAIL_LOIN, rien: R.DECOR_RIEN_LOIN, voitureLoin: R.VOITURE_LOIN,
      voituresDetaillees: R.VOITURES_DETAILLEES_MAX, densite: 1, effets: 1, retro: true };
  }
  // les niveaux de l'Auto : [plus beau, après le pas 1, …] ; dpr : les pixels par pixel CSS de l'écran (un pas qui ne change rien
  // à l'écran, comme 1,5 → 1,35 sur un écran à 1 pixel par pixel CSS, est sauté : il ferait perdre une demi-seconde pour rien)
  function niveaux(dpr) {
    const d = dpr > 0 ? dpr : Infinity, vu = r => JSON.stringify(Object.assign({}, r, { pixelRatio: Math.min(d, r.pixelRatio) }));
    const liste = [plusBeau()];
    for (const p of R.QUALITE_PAS) {
      const r = Object.assign({}, liste[liste.length - 1], p);
      if (vu(r) !== vu(liste[liste.length - 1])) liste.push(r);
    }
    return liste;
  }

  function vider(q) { q.images = 0; q.somme = 0; q.travail = 0; q.mesure = 0; }
  // options : { niveau (gardé dans la sauvegarde), dpr }
  function creer(regle, options) {
    const o = options || {}, r = REGLES.includes(regle) ? regle : 'auto', liste = niveaux(o.dpr);
    const n = Math.max(0, Math.min(liste.length - 1, Math.round(Number(o.niveau) || 0)));
    const q = { regle: r, niveaux: liste, niveau: r === 'auto' ? n : 0, niveauAuto: n, descente: false, essai: null, depuis: 0, temps: 0, bloque: {}, echecs: {} };
    vider(q);
    return q;
  }
  const max = q => q.niveaux.length - 1;
  function changer(q, n) { q.niveau = q.niveauAuto = n; q.depuis = 0; vider(q); return n; }

  // une image de dt secondes ; feux : les feux de départ sont allumés ; travail : le temps de calcul de l'image (s ; sans lui, le
  // détail ne revient jamais) ; renvoie le nouveau niveau s'il change, sinon null
  function observer(q, dt, feux, travail) {
    if (q.regle !== 'auto' || !(dt > 0)) return null;
    // (pendant les feux rien ne change ; une image très longue — chargement, onglet — ne compte pas ; mais QUALITE_LONGUES_SUITE images très
    // longues DE SUITE ne sont plus un accident : c'est un appareil très lent (moins de 4 images/s), elles comptent comme les autres. 0 = comme avant)
    if (feux) { q.longues = 0; vider(q); return null; }
    if (dt > R.QUALITE_DT_MAX) {
      q.longues = (q.longues || 0) + 1;
      if (!(R.QUALITE_LONGUES_SUITE > 0 && q.longues >= R.QUALITE_LONGUES_SUITE)) { vider(q); return null; }
    } else q.longues = 0;
    q.temps += dt; q.depuis += dt;
    // la fenêtre : les images depuis le dernier changement, au plus les QUALITE_MOYENNE dernières secondes (en moyenne : on retire la part de trop)
    q.images++; q.somme += dt;
    if (travail >= 0) { q.travail += travail; q.mesure++; }
    if (q.somme > R.QUALITE_MOYENNE) { const k = R.QUALITE_MOYENNE / q.somme; q.images *= k; q.travail *= k; q.mesure *= k; q.somme = R.QUALITE_MOYENNE; }
    const ips = q.images / q.somme, juge = q.somme >= R.QUALITE_PAS_DESCENTE - 1e-9, plein = q.somme >= R.QUALITE_MOYENNE - 1e-9;
    // un pas rendu qui fait repasser sous la visée : repris aussitôt, et ce niveau attend (de plus en plus longtemps)
    if (q.essai !== null) {
      if (juge && ips < R.QUALITE_IPS_VISEE) {
        const e = q.essai; q.essai = null; q.echecs[e] = (q.echecs[e] || 0) + 1;
        let duree = R.QUALITE_BLOCAGE; for (let k = 1; k < q.echecs[e]; k++) duree *= 2;
        q.bloque[e] = q.temps + duree;
        return changer(q, Math.min(max(q), e + 1));
      }
      if (q.depuis >= R.QUALITE_PAS_RETOUR) q.essai = null;
    }
    // les simplifications : elles commencent sous QUALITE_IPS_MIN (une seconde entière), et continuent jusqu'à la visée
    if (!q.descente && plein && ips < R.QUALITE_IPS_MIN) q.descente = true;
    if (q.descente) {
      if (!juge) return null;
      if (ips >= R.QUALITE_IPS_VISEE) { q.descente = false; return null; }
      if (q.niveau < max(q) && (plein || q.depuis >= R.QUALITE_PAS_DESCENTE)) { q.essai = null; return changer(q, q.niveau + 1); }
      return null;
    }
    // le retour du détail : lent, et seulement avec de la marge sur le temps de calcul
    if (q.essai === null && q.niveau > 0 && q.depuis >= R.QUALITE_PAS_RETOUR && plein && ips >= R.QUALITE_IPS_VISEE && q.mesure > 0
      && q.travail / q.mesure < R.QUALITE_MARGE * R.QUALITE_TEMPS_PERMIS && !(q.bloque[q.niveau - 1] > q.temps)) {
      const n = q.niveau - 1; changer(q, n); q.essai = n; return n;
    }
    return null;
  }

  // ce que le dessin doit faire (scene3d.js) : null = l'image d'avant ; sinon { pixelRatio, detail, rien, voitureLoin, voituresDetaillees, densite, effets, retro }
  function reglages(q) {
    if (q.regle === 'auto') return q.niveau > 0 ? Object.assign({}, q.niveaux[q.niveau]) : null;
    const c = CRAN[q.regle];
    return c ? Object.assign(plusBeau(), R.QUALITE_CRANS[c]) : null;
  }
  // l'Auto est au plus simple (le menu le dit : « Qualité : auto (au plus simple) »)
  const auPlusSimple = q => q.regle === 'auto' && q.niveau === max(q) && max(q) > 0;

  // le réglage du menu : auto (on repart du dernier niveau de l'Auto), haute, moyenne, basse
  function regler(q, regle) {
    q.regle = REGLES.includes(regle) ? regle : 'auto';
    q.niveau = q.regle === 'auto' ? q.niveauAuto : 0;
    q.descente = false; q.essai = null; q.depuis = 0; vider(q);
    return q.niveau;
  }
  function suivante(regle) { return REGLES[(REGLES.indexOf(regle) + 1) % REGLES.length]; }

  return { creer, observer, reglages, regler, suivante, auPlusSimple, plusBeau, niveaux, REGLES };
})();
