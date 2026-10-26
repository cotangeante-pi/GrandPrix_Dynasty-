// Le public des tribunes (Codeur 3, étape 10, CLAUDE.md « Le Grand Prix à domicile ») : calcul pur, rien de 3D, rien à l'écran.
// Pour un Grand Prix donné, la couleur de chaque spectateur (le Codeur 2 la lit par instance, dans decor.js) :
//  - au Grand Prix à domicile du joueur (sa course de cœur), PUBLIC_DOMICILE_PART des spectateurs portent les couleurs de son pays
//    (PAYS_COULEURS), et PUBLIC_BANDEROLES banderoles affichent son numéro (« ALLEZ 27 ! ») ou son nom ;
//  - ailleurs, et pour les autres spectateurs, les couleurs de toutes les écuries (ECURIES).
// La même graine donne le même public. Le tirage a sa propre suite (ALEATOIRE.suite) : il ne dérange pas le hasard d'une course.
const DECOR_PUBLIC = (function () {
  const R = REGLAGES;

  // le Grand Prix à domicile du joueur : sa course de cœur (pilote.js), le circuit de son pays s'il en a un
  function domicile(joueur, circuit) {
    return !!(joueur && typeof joueur.coeur === 'string' && joueur.coeur === circuit);
  }

  // les couleurs du pays (un pays inconnu : aucune, le public est alors celui des écuries)
  function couleursPays(pays) {
    return (R.PAYS_COULEURS && R.PAYS_COULEURS[pays]) || [];
  }

  // la graine d'un Grand Prix : celle du championnat, GRAINE_PUBLIC et le circuit (chaque circuit a son public)
  function graineDe(gp) {
    let h = 0;
    for (const c of String(gp.circuit || '')) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
    return ((gp.graine || 0) + R.GRAINE_PUBLIC + h) >>> 0;
  }

  // le public : gp = { graine, circuit, joueur: { nom, numero, pays, coeur } }, nombre de spectateurs.
  // Renvoie { domicile, couleurs: [nombre] (0xRRGGBB, une par spectateur), supporters: [nombre] (true : aux couleurs du joueur),
  // nbSupporters, banderoles: [{ texte, fond, lettres }] (vide hors du Grand Prix à domicile) }
  function tirer(gp, nombre) {
    const n = Math.max(0, Math.floor(nombre || 0)), alea = ALEATOIRE.suite(graineDe(gp));
    const chez = domicile(gp.joueur, gp.circuit), drapeau = chez ? couleursPays(gp.joueur.pays) : [];
    const ecuries = R.ECURIES.map(e => e.couleur);
    // exactement round(n × part) supporters, à des places tirées (un mélange partiel des indices)
    const nbSupporters = drapeau.length ? Math.round(n * R.PUBLIC_DOMICILE_PART) : 0;
    const ordre = Array.from({ length: n }, (_, i) => i), supporters = new Array(n).fill(false);
    for (let k = 0; k < nbSupporters; k++) {
      const m = k + Math.floor(alea() * (n - k)), t = ordre[k];
      ordre[k] = ordre[m]; ordre[m] = t;
      supporters[ordre[k]] = true;
    }
    const couleurs = supporters.map(sup => sup ? drapeau[Math.floor(alea() * drapeau.length)] : ecuries[Math.floor(alea() * ecuries.length)]);
    return { domicile: chez, couleurs, supporters, nbSupporters, banderoles: chez ? banderoles(gp.joueur, drapeau) : [] };
  }

  // les banderoles du Grand Prix à domicile : une sur deux le numéro, l'autre le nom (en majuscules), aux couleurs du pays
  function banderoles(joueur, drapeau) {
    const fond = drapeau.length ? drapeau[0] : 0xffffff, lettres = drapeau.find(c => c !== fond) || 0x111111;
    const res = [];
    for (let k = 0; k < R.PUBLIC_BANDEROLES; k++) {
      const parNom = k % 2 === 1 && joueur.nom;
      const t = parNom ? texte('banderoleNom').replace('{nom}', String(joueur.nom).toUpperCase()) : texte('banderoleNumero').replace('{numero}', joueur.numero);
      res.push({ texte: t, fond: k % 2 ? lettres : fond, lettres: k % 2 ? fond : lettres });
    }
    return res;
  }

  // le public d'un Grand Prix du championnat (le joueur est le pilote humain de ch)
  function pourGrandPrix(ch, circuit, nombre) {
    const joueur = ch && ch.pilotes ? ch.pilotes.find(p => p.humain) : null;
    return tirer({ graine: ch ? ch.graine : 0, circuit, joueur }, nombre);
  }

  // la place de chaque objet d'un décor de decors-officiels.js sur un circuit construit (construireCircuit) : { tribunes, public, zones,
  // principale, stands }, chaque objet { genre, nom ou type, s (m le long de la piste, son milieu), longueur, d0 et d1 (m en travers,
  // signés : le bord proche et le bord loin), cote } ; le bâtiment des stands longe la voie des stands, sans ses deux rampes
  function placer(circuit, decor) {
    const L = circuit.longueur, m = circuit.morceaux, bord = circuit.largeur / 2, st = circuit.stands;
    const bande = (cote, ecart, profondeur) => [cote * (bord + ecart), cote * (bord + ecart + profondeur)];
    const autour = (o, genre) => {
      const k = m[o.morceau], [d0, d1] = bande(o.cote, o.ecart, o.profondeur);
      return { genre, nom: o.nom || null, s: ((k.debut + k.fin) / 2) % L, longueur: o.longueur, d0, d1, cote: o.cote };
    };
    const zones = (decor.zones || []).map(z => {
      const debut = m[z.de].debut, fin = m[z.a].fin, longueur = ((fin - debut) % L + L) % L || L, [d0, d1] = bande(z.cote, z.ecart, z.profondeur);
      return { genre: 'zone', type: z.type, s: (debut + longueur / 2) % L, longueur, d0, d1, cote: z.cote, densite: z.densite };
    });
    const res = { tribunes: (decor.tribunes || []).map(o => autour(o, 'tribune')), public: (decor.public || []).map(o => autour(o, 'public')), zones, principale: null, stands: null };
    if (decor.principale) {
      const cote = st ? -st.cote : 1, [d0, d1] = bande(cote, decor.principale.ecart, decor.principale.profondeur);
      res.principale = { genre: 'principale', s: 0, longueur: decor.principale.longueur, d0, d1, cote };
    }
    if (decor.stands && st) {
      const d0 = st.cote * (st.dExt + decor.stands.ecart);
      res.stands = { genre: 'stands', s: (st.entree + st.longueur / 2) % L, longueur: st.longueur - 2 * R.STAND_RAMPE, d0, d1: d0 + st.cote * decor.stands.profondeur,
        cote: st.cote, hauteur: decor.stands.hauteur };
    }
    return res;
  }

  return { domicile, couleursPays, tirer, banderoles, pourGrandPrix, placer };
})();
