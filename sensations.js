// Les sensations de conduite (tour 37) : ce que la voiture vit à cet instant, lu dans son état, pour le son (son.js),
// la caméra (camera.js) et les effets dessinés (effets3d.js). Rien ici ne touche à la physique : on lit la voiture, on ne
// l'écrit jamais (un test le prouve au bit près). Tout se coupe dans le menu pause (« Effets de conduite », sauvegardé).
// Calculs purs, testés sans écran ni son.
const SENSATIONS = (function () {
  const R = REGLAGES;
  let actif = true;
  const memos = new WeakMap();   // par voiture : les contacts déjà vus (un fait n'arrive qu'une fois)
  const derniers = new WeakMap();   // par voiture : ses faits de l'image en cours (observer) et le numéro de cette image
  let image = 0;
  const RIEN = Object.freeze({ vibreur: 0, herbe: 0, glisse: 0, blocage: 0, contact: 0, choc: 0, vitesse: 0, arriere: 0, patinage: 0 });

  // les faits d'une voiture : vibreur (0 à 1, une roue sur le vibreur d'un virage), herbe (0 ou 1), glisse (0 à 1, la
  // dérive), blocage (0 à 1, les roues avant au bord du blocage : gros freinage, plus encore en braquant), contact (la
  // force d'un nouveau contact avec une voiture, 0 sinon), choc (la force d'un nouveau choc contre la barrière, 0 sinon) ;
  // arriere (0 à 1, l'arrière qui glisse) et patinage (0 à 1, les roues arrière qui patinent : la voiture vivante).
  // memo : { voiture, barriere } les contacts déjà comptés ; mis à jour.
  function faits(v, circuit, memo) {
    const nouveauxV = v.contactsVoiture - memo.voiture, nouveauxB = v.contactsBarriere - memo.barriere;
    memo.voiture = v.contactsVoiture; memo.barriere = v.contactsBarriere;
    if (!actif) return RIEN;
    const u = Math.abs(v.u), f = { vibreur: 0, herbe: 0, glisse: 0, blocage: 0, contact: 0, choc: 0, vitesse: u, arriere: 0, patinage: 0 };
    if (circuit && v.piste && !v.piste.stands && !v.dansStands && u > R.SENSATIONS_VITESSE_MIN) {
      const demi = circuit.largeur / 2, d = Math.abs(v.piste.d), k = Math.abs(circuit.courbure[v.piste.indice]);
      // (les vibreurs sont seulement dans les virages, des deux côtés : scene3d.js, la même règle)
      if (k > R.SEUIL_COURBURE_VIBREUR) {
        const dedans = Math.min(d + R.SENSATIONS_DEMI_VOIE, demi + R.LARGEUR_VIBREUR) - Math.max(d - R.SENSATIONS_DEMI_VOIE, demi);
        if (dedans > 0) f.vibreur = Math.min(1, dedans / R.SENSATIONS_VIBREUR_PLEIN);
      }
    }
    if (v.surHerbe && u > R.SENSATIONS_VITESSE_MIN) f.herbe = 1;
    if (u > 1) {
      const derive = Math.abs(Math.atan2(v.v, u)), [g0, g1] = R.SENSATIONS_GLISSE;
      f.glisse = Math.max(0, Math.min(1, (derive - g0) / (g1 - g0)));
    }
    // la voiture vivante (tour 42) : l'arrière qui part (l'angle de glissement de l'essieu arrière, celui de la physique, relu ici)
    // et le patinage (la poussée du moteur au-delà de l'adhérence de l'arrière, v.chargeArriere posé par la physique vivante)
    if (u > R.SENSATIONS_VITESSE_MIN) {
      const b = R.EMPATTEMENT - R.CG_AVANT, alpha = Math.abs(Math.atan2(v.v - b * v.r, u)), [a0, a1] = R.SENSATIONS_ARRIERE;
      f.arriere = Math.max(0, Math.min(1, (alpha - a0) / (a1 - a0)));
    }
    if (v.chargeArriere && v.gaz > 0 && v.u > 0) {
      const mu = R.ADHERENCE * (v.adhMeteo || 1) * (v.adherence || 1) * (v.aero || 1) * (v.aileronAdherence || 1) * (v.surHerbe ? R.ADHERENCE_HERBE : 1);
      const moteur = v.gaz * Math.min(R.FORCE_MOTEUR_MAX, R.PUISSANCE / Math.max(v.u, 1)) * (v.surHerbe ? R.GAZ_HERBE : 1) * (v.facteurDepart || 1) * (v.moteur || 1);
      const cap = mu * R.VIVANTE_ADHERENCE_ARRIERE * v.chargeArriere;
      if (cap > 0 && moteur > cap) f.patinage = Math.min(1, (moteur - cap) / (R.SENSATIONS_PATINAGE * cap));
    }
    if (v.u > R.SENSATIONS_BLOCAGE_VITESSE && v.frein >= R.SENSATIONS_BLOCAGE_FREIN)
      f.blocage = Math.min(1, R.SENSATIONS_BLOCAGE_DROIT + (1 - R.SENSATIONS_BLOCAGE_DROIT) * Math.abs(v.direction) / R.SENSATIONS_BLOCAGE_BRAQUAGE);
    if (nouveauxV > 0) f.contact = Math.min(1, 0.3 + (v.chocs.length ? v.chocs[v.chocs.length - 1] : 0) / 10);
    if (nouveauxB > 0) f.choc = Math.min(1, 0.3 + Math.hypot(v.u, v.v) / 40);
    return f;
  }

  // une fois par image (principal.js) : les faits de chaque voiture, lus ensuite par le son, la caméra et les effets
  // (une voiture absente de l'image, comme au podium, n'a plus de faits : de(v) donne RIEN)
  function observer(voitures, circuit) {
    image++;
    for (const v of voitures) {
      if (!v) continue;
      let m = memos.get(v);
      if (!m) { m = { voiture: v.contactsVoiture, barriere: v.contactsBarriere }; memos.set(v, m); }
      derniers.set(v, { f: faits(v, circuit, m), image });
    }
  }
  function de(v) { const d = v && derniers.get(v); return d && d.image === image ? d.f : RIEN; }

  // la secousse de la caméra (sur le vibreur, au choc), très légère : etat { temps, phase, choc } ; renvoie le décalage
  // de la caméra (m, x à droite, y en haut). Un bruit sans hasard (des sinus) : la même image pour les mêmes faits.
  function secousse(etat, f, dt) {
    etat.temps += dt;
    etat.phase += dt * Math.PI * f.vitesse / R.LONGUEUR_BANDE_VIBREUR;   // une bosse par bande du vibreur
    etat.choc = Math.max(etat.choc * Math.exp(-dt / R.SECOUSSE_CHOC_DUREE), f.contact, f.choc);
    if (!actif) etat.choc = 0;
    const a = R.SECOUSSE_VIBREUR * f.vibreur * Math.min(1, f.vitesse / 30), c = R.SECOUSSE_CHOC * etat.choc;
    return {
      x: a * 0.5 * Math.sin(etat.phase * 0.7 + 1) + c * Math.sin(etat.temps * 61),
      y: a * Math.abs(Math.sin(etat.phase)) + c * Math.sin(etat.temps * 47 + 2),
    };
  }

  // le champ de vision un peu plus large à très haute vitesse (degrés en plus du champ réglé par le propriétaire) : 0 jusqu'à
  // CHAMP_HAUTE_VITESSE[0], CHAMP_HAUTE_VITESSE[2] au plus à CHAMP_HAUTE_VITESSE[1] (m/s)
  function champ(u) {
    if (!actif) return 0;
    const [u0, u1, plus] = R.CHAMP_HAUTE_VITESSE;
    return plus * Math.max(0, Math.min(1, (u - u0) / (u1 - u0)));
  }

  return {
    faits, observer, de, secousse, champ, RIEN,
    get actif() { return actif; },
    regler(oui) { actif = !!oui; },
  };
})();
