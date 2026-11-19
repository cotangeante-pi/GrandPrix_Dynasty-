// Les aides au pilotage du joueur (tour 41, décision du Chef, réversible), comme dans les jeux de F1. Elles corrigent seulement
// les cibles { gaz, frein, direction } du joueur, avant la physique : la physique et les IA ne changent pas, et toutes coupées,
// la course est celle d'avant au bit près (l'objet des cibles est rendu tel quel). Calcul pur, testé sans écran.
// - freinage assisté : trop vite pour ce qui arrive (les virages de la trajectoire de la carte, ou à défaut du milieu de la
//   piste, avec l'adhérence du moment), la voiture freine d'elle-même, au freinage possible avec une marge ; le joueur peut toujours freiner plus.
//   Et l'anti-blocage : en braquant, le frein reste sous le seuil du blocage du jeu (sensations.js). La physique, elle, ne bloque
//   jamais les roues : plafonner le frein n'évite donc aucune sortie à lui seul, c'est le freinage avant le virage qui le fait.
// - antipatinage : en virage, au bout de l'adhérence, les gaz sont limités avant que la voiture ne glisse vers l'extérieur.
// - direction assistée : un léger retour vers la trajectoire de la carte (quand la carte est là).
// Le choix du propriétaire (2026-10-30) : le joueur choisit ses aides une par une, quel que soit le niveau (le niveau donne seulement le
// réglage proposé), avant la course ; l'anti-blocage est une aide à part (ASSIST_BONUS dans donnees.js : un bonus par aide coupée).
const ASSISTANCE = (function () {
  const R = REGLAGES;
  const AIDES = ['direction', 'freinage', 'antiblocage', 'antipatinage'];

  // les aides de départ selon le niveau : toutes en débutant, aucune au-dessus ; reglage (sauvegardé) : { direction, freinage,
  // antiblocage, antipatinage } ou null (pas encore choisi) ; le choix du joueur l'emporte à tous les niveaux. Une sauvegarde du
  // tour 41 n'a pas d'anti-blocage à part : il suit son freinage assisté (il en faisait partie)
  function reglees(reglage, niveau) {
    const debutant = niveau === 'debutant', r = {};
    for (const a of AIDES) r[a] = reglage && typeof reglage[a] === 'boolean' ? reglage[a] : debutant;
    if (reglage && typeof reglage.antiblocage !== 'boolean' && typeof reglage.freinage === 'boolean') r.antiblocage = reglage.freinage;
    return r;
  }
  // le bonus d'argent sans aide (ASSIST_BONUS) : la somme des parts des aides coupées ; r null = aucun bonus (pas de choix connu)
  const bonus = r => r ? AIDES.reduce((s, a) => s + (r[a] ? 0 : R.ASSIST_BONUS[a] || 0), 0) : 0;
  const aucune = r => !r || AIDES.every(a => !r[a]);
  // la voiture vivante (physique.js) : les aides la pilotent un peu autrement ; 0 = la voiture d'avant, les aides d'avant au bit près
  const vivante = v => typeof voitureVivante === 'function' && voitureVivante(v) > 0;   // (la voiture vivante vient du pneu drift de cette voiture, physique.js)

  // l'adhérence de la voiture, comme la physique la lit (× 1 sans météo, pneus, garage ni aileron)
  const adherence = v => (v.adhMeteo || 1) * (v.adherence || 1) * (v.aero || 1) * (v.aileronAdherence || 1) * (v.surHerbe ? R.ADHERENCE_HERBE : 1);

  // la vitesse qu'il ne faut pas dépasser ici pour passer ce qui arrive (m/s) : la vitesse de virage de la physique (vitesseVirage,
  // avec l'adhérence de la voiture : pluie, pneus) sur la plus serrée des courbures, celle du milieu de la piste ou celle de la
  // trajectoire de la carte (le débutant ne prend pas forcément la bonne ligne), à ASSIST_MARGE près, et le freinage possible à
  // ASSIST_FREIN_PART près
  function vitesseSure(v, circuit, carte) {
    const p = v.piste, nb = circuit.nb, n = Math.ceil(R.ASSIST_REGARD / circuit.pas), mu = adherence(v);
    const a = R.ASSIST_FREIN_PART * freinagePossible(Math.max(0, v.u)) * (v.adhMeteo || 1) * (v.freins || 1) * (vivante(v) ? R.ASSIST_VIVANTE_FREIN : 1);
    const kt = carte && carte.trajectoire ? carte.trajectoire.courbure : null, kc = circuit.courbure;
    let sure = Infinity;
    for (let j = 1; j <= n; j++) {
      const i = (p.indice + j) % nb, k = kt ? Math.max(Math.abs(kt[i]), Math.abs(kc[i])) : kc[i], lim = vitesseVirage(k, R.ADHERENCE * mu) * R.ASSIST_MARGE;
      if (lim === Infinity) continue;
      sure = Math.min(sure, Math.sqrt(lim * lim + 2 * a * j * circuit.pas));
    }
    return sure;
  }

  // les cibles corrigées ; c : celles du joueur ; v : sa voiture ; ctx : { circuit, carte } ; r : reglees(...) ou null
  function appliquer(c, v, ctx, r) {
    if (aucune(r) || !v || !ctx || !ctx.circuit || !v.piste || v.dansStands || v.u < R.ASSIST_VITESSE_MIN) return c;
    let gaz = c.gaz, frein = c.frein, direction = c.direction;
    if (r.freinage) {
      const trop = v.u - vitesseSure(v, ctx.circuit, ctx.carte);
      if (trop > 0) { frein = Math.max(frein, Math.min(1, trop / R.ASSIST_FREIN_PENTE)); gaz = 0; }
    }
    if (r.antiblocage) {
      // l'anti-blocage : en braquant, la pression au frein reste sous le seuil du blocage (SENSATIONS_BLOCAGE_FREIN : ni fumée ni
      // crissement) ; la marge du freinage assisté (ASSIST_FREIN_PART) compte déjà avec ce frein plus doux
      if (frein >= R.SENSATIONS_BLOCAGE_FREIN && Math.abs(direction) > R.ASSIST_ABS_BRAQUAGE && v.u > R.SENSATIONS_BLOCAGE_VITESSE) {
        // (la voiture vivante, tour 42d : l'arrière se déleste au freinage et part si l'on braque en freinant fort ; en braquant, le frein
        // descend plus bas, ASSIST_VIVANTE_ABS_PART du seuil, pour garder du poids sur l'arrière ; le braquage du joueur n'est jamais touché)
        frein = R.SENSATIONS_BLOCAGE_FREIN * (vivante(v) ? R.ASSIST_VIVANTE_ABS_PART : R.ASSIST_ABS_PART);
      }
    }
    if (r.antipatinage && gaz > 0) {
      const limite = R.ADHERENCE * adherence(v) * charge(v.u) / R.MASSE, lat = Math.abs(v.u * v.r);
      const part = limite > 0 ? lat / limite : 0, [s0, s1] = R.ASSIST_ANTIPATINAGE;
      if (part > s0) gaz = Math.min(gaz, Math.max(0, (s1 - part) / (s1 - s0)));
      // (la voiture vivante, tour 43d : un lever de pied brusque fait partir l'arrière ; l'antipatinage relâche les gaz en douceur)
      if (vivante(v) && gaz < c.gaz) gaz = Math.min(c.gaz, Math.max(gaz, (v.gaz || 0) - R.ASSIST_VIVANTE_LEVER));
    }
    if (r.direction && ctx.carte && ctx.carte.trajectoire) {
      const T = ctx.carte.trajectoire, i = (v.piste.indice + Math.round(R.ASSIST_DIRECTION_VISEE / ctx.circuit.pas)) % ctx.circuit.nb;
      const ecart = T.ecart[i] - v.piste.d, k = R.ASSIST_DIRECTION, f = vivante(v) ? R.ASSIST_VIVANTE_DIRECTION : 1;   // (× 1 sans la voiture vivante, au bit près)
      direction = Math.max(-1, Math.min(1, direction + f * Math.max(-k[1], Math.min(k[1], k[0] * ecart))));
    }
    return gaz === c.gaz && frein === c.frein && direction === c.direction ? c : { gaz, frein, direction };
  }

  // --- (tour 60, Codeur 4, le propriétaire 2026-11-19 : « quand tu te déstabilises et que tu fais des gros zigzags sur la piste droite,
  // l'auto-guidage, sans freiner, doit te restabiliser ») l'auto-guidage du téléphone. Le principe :
  // - la cause : le volant du téléphone est imprécis et en retard ; le joueur sur-corrige, la voiture répond un peu après (STABILITE_LACET),
  //   il corrige encore plus fort de l'autre côté : un zigzag qui grandit. On le reconnaît au volant du joueur qui change franchement de côté
  //   (|direction| ≥ GUIDAGE_AMPLITUDE) GUIDAGE_INVERSIONS fois à la suite, à moins de GUIDAGE_FENETRE s d'écart (ou à la voiture qui glisse) ;
  //   un changement de file (un coup d'un côté, un coup de l'autre pour se redresser) n'en fait qu'un : il n'est pas touché ;
  // - le remède : la direction passe (en GUIDAGE_MONTEE s) à un pilote qui vise le cap de la piste : la rotation voulue referme l'écart de cap
  //   en GUIDAGE_TAU s et retient la rotation de la voiture (GUIDAGE_AMORTI), traduite en braquage par le modèle de la physique
  //   (rotation = u·tan(braquage) / empattement) ; il garde la file où est la voiture (il ne la ramène pas au milieu) ; ni gaz ni frein touchés ;
  // - seulement en ligne droite : la courbure de la piste devant (GUIDAGE_REGARD) le dose de 1 à 0 (GUIDAGE_COURBURE), rien en virage ;
  // - il rend la main (en GUIDAGE_DESCENTE s) quand la voiture est droite depuis GUIDAGE_CALME s sans nouveau zigzag, ou dès que le joueur
  //   tourne exprès (le volant tenu d'un côté : le cap qu'il demande grandit, GUIDAGE_EXPRES) ;
  // - le secours : si la voiture est perdue quand même (GUIDAGE_PERDU), comme Espace mais à la vitesse d'avant (secours, relancer).
  // Calcul pur ; l'état e vient de creerGuidage() (un par voiture du joueur).
  const RAD = Math.PI / 180;
  const angleVrai = a => Math.atan2(Math.sin(a), Math.cos(a));
  function creerGuidage() {
    return { t: 0, cote: 0, tInversion: -Infinity, inversions: 0, g: 0, actif: false, calme: 0, tenu: 0, coteTenu: 0, glisse: false, allume: 0,
      uStable: 0, perdu: 0, herbe: 0, attente: 0, secours: 0 };
  }
  // la part « ligne droite » de la piste devant la voiture : 1 droite, 0 virage
  function droiture(v, circuit) {
    // (près de la voie des stands, de GUIDAGE_STANDS m avant son entrée jusqu'à sa sortie, on tourne exprès pour y entrer ou en sortir : rien)
    const st = R.PNEUS_ACTIFS && circuit.stands, L = circuit.longueur;
    if (st && ((v.piste.s - st.entree + R.GUIDAGE_STANDS) % L + L) % L < st.longueur + R.GUIDAGE_STANDS) return 0;
    const R_ = R, n = Math.ceil(Math.max(R_.GUIDAGE_REGARD[0], Math.abs(v.u) * R_.GUIDAGE_REGARD[1]) / circuit.pas), [k0, k1] = R_.GUIDAGE_COURBURE;
    let pire = 0;
    for (let j = -2; j <= n; j++) pire = Math.max(pire, Math.abs(circuit.courbure[((v.piste.indice + j) % circuit.nb + circuit.nb) % circuit.nb]));
    return Math.max(0, Math.min(1, (k1 - pire) / (k1 - k0)));
  }
  const capPiste = (v, circuit) => Math.atan2(circuit.tz[v.piste.indice], circuit.tx[v.piste.indice]);
  // la direction (−1..1) du pilote qui tient le cap de la piste, plus psiCible (rad : le cap que demande encore le joueur, à droite > 0)
  function directionDroite(v, circuit, psiCible = 0) {
    const k = circuit.courbure[v.piste.indice], u = Math.max(1, v.u);
    const psi = angleVrai(v.cap + Math.atan2(v.v, u) - capPiste(v, circuit)) - psiCible;   // le cap de la trajectoire (le nez et la glisse) moins celui voulu
    const rVoulue = u * k - psi / R.GUIDAGE_TAU - R.GUIDAGE_AMORTI * (v.r - u * k);
    return Math.max(-1, Math.min(1, Math.atan(rVoulue * R.EMPATTEMENT / u) / braquageMax(u)));
  }
  // brut : les cibles du joueur (son volant à lui) ; c : après les autres aides ; renvoie les cibles guidées (c lui-même si rien ne change).
  // Guidé, le volant du joueur ne braque plus : il demande un cap (à fond, GUIDAGE_CAP_JOUEUR ° de la piste), que le pilote tient. Le zigzag
  // venait du gain trop fort de la boucle « joueur en retard → braquage → rotation » : le cap borné et amorti la rend stable (sur-correction
  // impossible), sans enlever au joueur le choix de sa file.
  function guider(e, brut, c, v, circuit, dt) {
    e.t += dt;
    if (!v || !v.piste || !circuit || v.dansStands || v.u < R.GUIDAGE_VITESSE_MIN) { e.g = 0; e.actif = false; e.inversions = 0; e.cote = 0; return c; }
    const d = brut.direction, A = R.GUIDAGE_AMPLITUDE;
    // les changements de côté francs du volant du joueur, à la suite
    if (Math.abs(d) >= A) {
      const s = Math.sign(d);
      if (e.cote && s !== e.cote) { e.inversions = e.t - e.tInversion <= R.GUIDAGE_FENETRE ? e.inversions + 1 : 1; e.tInversion = e.t; }
      e.cote = s;
    }
    if (e.t - e.tInversion > R.GUIDAGE_FENETRE) e.inversions = 0;
    const f = droiture(v, circuit);
    // le volant tenu d'un côté (tourner exprès, revenir de loin) : guidé, le volant du joueur ne braque plus, il demande un cap, et seulement
    // s'il est tenu : rien avant GUIDAGE_EXPRES[1] s (les coups alternés du zigzag ne demandent rien), puis le cap demandé grandit jusqu'à
    // GUIDAGE_CAP_JOUEUR ° en GUIDAGE_EXPRES[2] s de plus : le guidage s'efface devant une vraie volonté, lentement (la boucle reste stable)
    const [ae, t0, te] = R.GUIDAGE_EXPRES, cote = Math.abs(d) >= ae ? Math.sign(d) : 0;
    e.tenu = cote && cote === e.coteTenu ? e.tenu + dt : 0; e.coteTenu = cote;
    const psi = angleVrai(v.cap - capPiste(v, circuit)), psiCible = cote * Math.min(1, Math.abs(d)) * R.GUIDAGE_CAP_JOUEUR * RAD * Math.max(0, Math.min(1, (e.tenu - t0) / te));
    const glisse = f > 0 && Math.abs(Math.atan2(v.v, v.u)) > R.GUIDAGE_GLISSE * RAD;
    // le cap à la piste dans GUIDAGE_ANTICIPE s : la rotation du moment et celle que demande le volant du joueur (la physique y va), en moyenne
    const rVolant = v.u * Math.tan(d * braquageMax(v.u)) / R.EMPATTEMENT, capVu = Math.abs(psi + (v.r + rVolant) / 2 * R.GUIDAGE_ANTICIPE);
    const zigzag = e.inversions >= R.GUIDAGE_INVERSIONS || (e.inversions >= 1 && e.t - e.tInversion < 0.5 && capVu > R.GUIDAGE_CAP_ALERTE * RAD) || Math.abs(psi + v.r * R.GUIDAGE_ANTICIPE) > R.GUIDAGE_CAP_SORTIE * RAD;
    if (!e.actif && f > 0 && (zigzag || glisse)) { e.actif = true; e.calme = 0; e.tenu = 0; e.allume++; }
    if (e.actif) {
      e.calme = Math.abs(psi) < R.GUIDAGE_DROIT * RAD && Math.abs(d) < A && e.t - e.tInversion > R.GUIDAGE_CALME ? e.calme + dt : 0;
      if (e.calme >= R.GUIDAGE_CALME || f <= 0) { e.actif = false; e.inversions = 0; }
    }
    e.g = e.actif ? Math.min(1, e.g + dt / R.GUIDAGE_MONTEE) : Math.max(0, e.g - dt / R.GUIDAGE_DESCENTE);
    const w = e.g * f;
    if (!(w > 0)) return c;
    const direction = c.direction + w * (directionDroite(v, circuit, psiCible) - c.direction);
    return { gaz: c.gaz, frein: c.frein, direction };
  }
  // le secours : renvoie la vitesse (m/s) à laquelle relancer la voiture perdue, ou null ; à appeler à chaque pas de la voiture du joueur
  function secours(e, v, circuit, dt) {
    if (e.attente > 0) e.attente -= dt;
    if (!v || !v.piste || !circuit || v.dansStands) { e.perdu = 0; e.herbe = 0; return null; }
    const [gs, cs] = R.GUIDAGE_STABLE, [pc, pg, ph, pd] = R.GUIDAGE_PERDU;
    const glisse = Math.abs(v.u) > 1 ? Math.abs(Math.atan2(v.v, Math.abs(v.u))) : 0, psi = Math.abs(angleVrai(v.cap - capPiste(v, circuit)));
    if (v.u >= R.GUIDAGE_VITESSE_MIN && glisse < gs * RAD && psi < cs * RAD && !v.surHerbe && !e.actif && e.inversions === 0) e.uStable = v.u;   // la vitesse d'avant le trouble
    e.herbe = v.surHerbe ? e.herbe + dt : 0;
    const perdue = psi > pc * RAD || (glisse > pg * RAD && Math.abs(v.u) > 5) || (e.herbe >= ph && droiture(v, circuit) >= 0.5);
    e.perdu = perdue ? e.perdu + dt : 0;
    if (e.perdu < pd || e.attente > 0 || e.uStable < R.GUIDAGE_VITESSE_MIN) return null;
    e.perdu = 0; e.herbe = 0; e.attente = R.GUIDAGE_SECOURS_PAUSE; e.secours++;
    e.actif = false; e.g = 0; e.inversions = 0; e.cote = 0;
    return e.uStable;
  }
  // le retour en piste du secours : celui d'Espace (remettreSurPiste : au plus près, au milieu, dans le sens de la piste), puis la vitesse
  // d'avant, bornée à ce qu'il faut pour passer ce qui arrive (vitesseSure, celle du freinage assisté) ; renvoie la vitesse donnée
  function relancer(v, circuit, carte, u) {
    remettreSurPiste(v, circuit);
    v.u = u;
    const sure = vitesseSure(v, circuit, carte);
    v.u = Math.max(0, Math.min(u, sure));
    return v.u;
  }

  return { appliquer, reglees, vitesseSure, bonus, AIDES, creerGuidage, guider, secours, relancer, droiture, directionDroite };
})();
