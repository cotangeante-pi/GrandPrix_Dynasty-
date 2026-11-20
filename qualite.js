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

  // --- (tour 60, Codeur 3) l'Auto FINE (QUALITE_FINE ; faux = tout ce qui précède, au bit près). Deux axes au lieu d'un :
  // - le CONTENU : les niveaux de QUALITE_PAS_FIN (voitures lointaines, densité, distance, effets, ciel, rétroviseur…), comme avant ;
  // - les PIXELS : QUALITE_RESOLUTIONS, à petits pas (0,1), à part. Au-dessus de QUALITE_RES_DOUCE (un écran dense), une baisse se voit
  //   à peine ; en dessous, elle se voit beaucoup.
  // Selon ce qui coûte VRAIMENT : si la carte graphique limite (son temps mesuré par EXT_disjoint_timer_query quand le navigateur le
  // donne, sinon déduit : le calcul de l'image prend moins de QUALITE_PART_CALCUL de sa durée), on baisse d'abord les pixels « doux »
  // (invisibles), puis le contenu, puis les pixels sous 1 ; si c'est le calcul qui limite, les pixels ne servent à rien : le contenu
  // d'abord. Le détail revient dans l'ordre inverse du plus visible : les pixels sous 1, puis le contenu, puis les pixels doux, et
  // seulement si l'image (calcul ET carte graphique) a de la marge. Les règles d'avant restent : sous 55, un pas toutes les 0,5 s
  // jusqu'à 58 ; le retour lent (3 s) ; un pas rendu qui fait rechuter est repris aussitôt et attend (QUALITE_BLOCAGE, doublé) ;
  // rien pendant les feux. Et le DÉPART : la première fois, un petit essai de dessin au chargement (scene3d.js essaiDessin) choisit le
  // niveau de départ (QUALITE.depart) au lieu de commencer au plus beau.
  const fine = () => !!R.QUALITE_FINE;
  function plusBeauFin() { return Object.assign(plusBeau(), R.QUALITE_PLUS_BEAU_FIN || {}); }
  // les niveaux du contenu (sans pixels : pixelRatio reste celui du plus beau, les pixels sont l'autre axe)
  function niveauxFin() {
    const liste = [plusBeauFin()];
    for (const p of R.QUALITE_PAS_FIN) {
      const r = Object.assign({}, liste[liste.length - 1], p);
      if (JSON.stringify(r) !== JSON.stringify(liste[liste.length - 1])) liste.push(r);
    }
    return liste;
  }
  // les pixels par pixel CSS qui changent vraiment l'écran (sur un écran à 1 pixel par pixel CSS, 1,5 → 1,1 ne change rien)
  function resolutions(dpr) {
    const d = dpr > 0 ? dpr : Infinity, liste = [];
    for (const p of R.QUALITE_RESOLUTIONS) if (!liste.length || Math.min(d, p) !== Math.min(d, liste[liste.length - 1])) liste.push(p);
    return liste;
  }
  function creerFin(r, o) {
    const liste = niveauxFin(), res = resolutions(o.dpr);
    const borne = (x, m) => Math.max(0, Math.min(m, Math.round(Number(x) || 0)));
    const n = borne(o.niveau, liste.length - 1), k = borne(o.res, res.length - 1);
    let douce = 0; const d = o.dpr > 0 ? o.dpr : Infinity;
    for (let i = 0; i < res.length; i++) if (Math.min(d, res[i]) >= R.QUALITE_RES_DOUCE - 1e-9) douce = i;
    const q = { regle: r, fine: true, niveaux: liste, resolutions: res, douce, niveau: r === 'auto' ? n : 0, niveauAuto: n, res: r === 'auto' ? k : 0, resAuto: k,
      descente: false, essai: null, depuis: 0, temps: 0, bloque: {}, echecs: {}, gpu: 0, gpuN: 0 };
    vider(q);
    return q;
  }
  function changerFin(q, n, k) { q.niveau = q.niveauAuto = n; q.res = q.resAuto = k; q.depuis = 0; vider(q); q.gpu = 0; q.gpuN = 0; return n; }
  // qui limite ? vrai = la carte graphique
  function limiteGpu(q) {
    const calcul = q.mesure > 0 ? q.travail / q.mesure : 0;
    if (q.gpuN > 0) return q.gpu / q.gpuN > calcul;
    return q.mesure > 0 && q.images > 0 && calcul < R.QUALITE_PART_CALCUL * (q.somme / q.images);
  }
  // le pas suivant vers le plus simple, ou null ; gpu : la carte graphique limite
  function plusSimple(q, n, k, gpu) {
    if (gpu && k < q.douce) return [n, k + 1];
    if (n < q.niveaux.length - 1) return [n + 1, k];
    if (k < q.resolutions.length - 1) return [n, k + 1];
    return null;
  }
  // le pas suivant vers le plus beau (le plus visible d'abord), ou null
  function plusDetaille(q) {
    if (q.res > q.douce) return [q.niveau, q.res - 1];
    if (q.niveau > 0) return [q.niveau - 1, q.res];
    if (q.res > 0) return [q.niveau, q.res - 1];
    return null;
  }
  function observerFin(q, dt, feux, travail, gpu) {
    if (q.regle !== 'auto' || !(dt > 0)) return null;
    const viderTout = () => { vider(q); q.gpu = 0; q.gpuN = 0; };
    if (feux) { q.longues = 0; viderTout(); return null; }
    if (dt > R.QUALITE_DT_MAX) {
      q.longues = (q.longues || 0) + 1;
      if (!(R.QUALITE_LONGUES_SUITE > 0 && q.longues >= R.QUALITE_LONGUES_SUITE)) { viderTout(); return null; }
    } else q.longues = 0;
    q.temps += dt; q.depuis += dt;
    q.images++; q.somme += dt;
    if (travail >= 0) { q.travail += travail; q.mesure++; }
    if (gpu > 0) { q.gpu += gpu; q.gpuN++; }
    if (q.somme > R.QUALITE_MOYENNE) { const f = R.QUALITE_MOYENNE / q.somme; q.images *= f; q.travail *= f; q.mesure *= f; q.gpu *= f; q.gpuN *= f; q.somme = R.QUALITE_MOYENNE; }
    const ips = q.images / q.somme, juge = q.somme >= R.QUALITE_PAS_DESCENTE - 1e-9, plein = q.somme >= R.QUALITE_MOYENNE - 1e-9;
    const cle = (n, k) => n + '/' + k;
    if (q.essai !== null) {
      if (juge && ips < R.QUALITE_IPS_VISEE) {
        const e = q.essai, c = cle(e.n, e.k); q.essai = null; q.echecs[c] = (q.echecs[c] || 0) + 1;
        let duree = R.QUALITE_BLOCAGE; for (let i = 1; i < q.echecs[c]; i++) duree *= 2;
        q.bloque[c] = q.temps + duree;
        return changerFin(q, e.avant[0], e.avant[1]);
      }
      if (q.depuis >= R.QUALITE_PAS_RETOUR) q.essai = null;
    }
    if (!q.descente && plein && ips < R.QUALITE_IPS_MIN) q.descente = true;
    if (q.descente) {
      if (!juge) return null;
      if (ips >= R.QUALITE_IPS_VISEE) { q.descente = false; return null; }
      const s = plusSimple(q, q.niveau, q.res, limiteGpu(q));
      if (s && (plein || q.depuis >= R.QUALITE_PAS_DESCENTE)) { q.essai = null; return changerFin(q, s[0], s[1]); }
      return null;
    }
    // la marge : le calcul ET la carte graphique (quand on la connaît) sous QUALITE_MARGE du temps permis
    const cout = Math.max(q.mesure > 0 ? q.travail / q.mesure : Infinity, q.gpuN > 0 ? q.gpu / q.gpuN : 0);
    const s = q.essai === null && q.depuis >= R.QUALITE_PAS_RETOUR && plein && ips >= R.QUALITE_IPS_VISEE && q.mesure > 0 && cout < R.QUALITE_MARGE * R.QUALITE_TEMPS_PERMIS ? plusDetaille(q) : null;
    if (s && !(q.bloque[cle(s[0], s[1])] > q.temps)) {
      const avant = [q.niveau, q.res]; changerFin(q, s[0], s[1]); q.essai = { n: s[0], k: s[1], avant }; return s[0];
    }
    return null;
  }
  // le départ mesuré : ms = le temps d'une image au plus beau (dessin attendu jusqu'au bout, scene3d.js essaiDessin) ; on suit l'ordre
  // de la descente (comme si la carte graphique limitait) avec un modèle prudent : les pixels coûtent selon leur nombre, tout le
  // contenu retire QUALITE_DEPART_CONTENU du coût ; le premier niveau sous QUALITE_DEPART_BUDGET du temps permis. Vrai s'il a changé.
  function depart(q, ms) {
    if (!q || !q.fine || q.regle !== 'auto' || !(ms > 0)) return false;
    const budget = R.QUALITE_DEPART_BUDGET * R.QUALITE_TEMPS_PERMIS * 1000, p0 = q.resolutions[0], nM = q.niveaux.length - 1;
    const cout = (n, k) => { const f = q.resolutions[k] / p0; return ms * f * f * (1 - R.QUALITE_DEPART_CONTENU * (nM > 0 ? n / nM : 0)); };
    let n = q.niveau, k = q.res;
    while (cout(n, k) > budget) { const s = plusSimple(q, n, k, true); if (!s) break; n = s[0]; k = s[1]; }
    if (n === q.niveau && k === q.res) return false;
    changerFin(q, n, k);
    return true;
  }

  const ancien = { creer, observer, reglages, regler, auPlusSimple, plusBeau };
  return {
    creer(regle, options) { const o = options || {}, r = REGLES.includes(regle) ? regle : 'auto'; return fine() ? creerFin(r, o) : ancien.creer(regle, o); },
    observer(q, dt, feux, travail, gpu) { return q && q.fine ? observerFin(q, dt, feux, travail, gpu) : ancien.observer(q, dt, feux, travail); },
    reglages(q) {
      if (!q || !q.fine) return ancien.reglages(q);
      if (q.regle === 'auto') return q.niveau > 0 || q.res > 0 ? Object.assign({}, q.niveaux[q.niveau], { pixelRatio: q.resolutions[q.res] }) : null;
      const c = CRAN[q.regle];
      return c ? Object.assign(plusBeauFin(), R.QUALITE_CRANS[c]) : null;
    },
    regler(q, regle) {
      if (!q || !q.fine) return ancien.regler(q, regle);
      q.regle = REGLES.includes(regle) ? regle : 'auto';
      q.niveau = q.regle === 'auto' ? q.niveauAuto : 0; q.res = q.regle === 'auto' ? q.resAuto : 0;
      q.descente = false; q.essai = null; q.depuis = 0; vider(q); q.gpu = 0; q.gpuN = 0;
      return q.niveau;
    },
    auPlusSimple(q) { return q && q.fine ? q.regle === 'auto' && q.niveau === max(q) && q.res === q.resolutions.length - 1 && (max(q) > 0 || q.res > 0) : ancien.auPlusSimple(q); },
    plusBeau() { return fine() ? plusBeauFin() : ancien.plusBeau(); },
    niveaux(dpr) { return fine() ? niveauxFin() : niveaux(dpr); },
    resolutions, depart, suivante, REGLES,
  };
})();
