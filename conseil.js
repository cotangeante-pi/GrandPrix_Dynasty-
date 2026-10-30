// La trajectoire conseillée (tour 39, décision du Chef du 2026-10-28) : une ligne peinte sur la piste, sur les
// CONSEIL_LONGUEUR mètres devant la voiture du joueur, le long de la trajectoire de la carte des IA (ia.js, lue seulement) :
// verte où l'on peut accélérer, jaune où il faut lever (au bout de ce que la voiture peut tenir), rouge où il faut freiner.
// Elle est calculée pour la vitesse réelle de la voiture : plus on arrive vite, plus le rouge commence tôt. Dessin
// seulement : rien n'est écrit dans la voiture ni dans la carte. Le calcul est pur (testé sans écran) ; un seul appel de dessin.
const CONSEIL = (function () {
  const R = REGLAGES;
  const VERT = 0, JAUNE = 1, ROUGE = 2;

  // les couleurs des points de la trajectoire devant la voiture : carte (carteDepuis), i0 = l'indice du circuit où est la
  // voiture, u = sa vitesse (m/s), n = le nombre de points ; renvoie un tableau de n couleurs (VERT, JAUNE, ROUGE).
  // La vitesse « à fond » part de u et monte avec l'accélération possible ; dès qu'elle touche la vitesse conseillée de la
  // carte (déjà bornée par le freinage possible), on la suit : là où la vitesse conseillée baisse, il faut freiner (rouge),
  // là où elle tient, il faut lever (jaune) ; là où elle remonte (la sortie du virage) ou en dessous, on accélère (vert). Plus vite que la vitesse conseillée : rouge
  // tout de suite, jusqu'à la rejoindre au freinage possible (IA_MARGE_FREIN, comme la carte).
  // adh (tour 40d, Codeur 4) : l'adhérence qui reste à la voiture, v.adhMeteo × v.adherence × v.aileronAdherence (1 au sec, pneus neufs,
  // aileron au milieu) : comme ia.js, la vitesse conseillée est multipliée par √adh, l'accélération et le freinage possibles par adh ;
  // à adh = 1, les couleurs sont exactement celles d'avant (×1 et √1 = 1, au bit près)
  function couleurs(carte, i0, u, n, adh) {
    const c = carte.circuit, T = carte.trajectoire, vit = T.vitesse, nb = c.nb, res = new Array(n);
    const a = typeof adh === 'number' && adh > 0 ? adh : 1, ka = Math.sqrt(a);
    let f = Math.max(0, u), tropVite = true;   // (trop vite : seulement tant que la voiture n'a pas rejoint la vitesse conseillée)
    for (let k = 0; k < n; k++) {
      const i = (i0 + k) % nb, j = (i + R.CONSEIL_REGARD) % nb, cible = vit[i] * ka;   // (la baisse sur quelques points : pas de clignotement à la corde)
      // (à la vitesse de pointe, en ligne droite, on reste à fond : vert)
      // trop vite pour ici : freiner tout de suite (rouge), en freinant fort on rejoint la vitesse conseillée plus loin
      if (tropVite && f > cible + R.CONSEIL_TOLERANCE) {
        res[k] = ROUGE;
        f = Math.max(cible, Math.sqrt(Math.max(0, f * f - 2 * R.IA_MARGE_FREIN * freinagePossible(f) * a * T.ds[i])));
        continue;
      }
      tropVite = false;
      // (la ligne droite à fond se lit sur la carte elle-même : la vitesse de pointe vient de la traînée, pas de l'adhérence)
      if (f < cible - R.CONSEIL_TOLERANCE || vit[i] >= carte.pointe - R.CONSEIL_TOLERANCE) res[k] = VERT;
      else res[k] = vit[j] * ka < cible - R.CONSEIL_BAISSE ? ROUGE : vit[j] * ka > cible + R.CONSEIL_BAISSE ? VERT : JAUNE;   // (au bout, la vitesse conseillée monte : on remet les gaz)
      // le point suivant : à fond depuis la vitesse tenue ici (au plus la vitesse conseillée : on suit le conseil)
      const tenue = Math.min(f, cible);
      f = Math.sqrt(tenue * tenue + 2 * Math.max(0, accelerationPossible(tenue)) * a * T.ds[i]);
    }
    return res;
  }

  // la ligne se montre-t-elle, et comment : 'tout', 'freinages' ou null. o : { reglage ('oui', 'non', 'freinages' ou
  // null = pas encore choisi), niveau, ecran, qualifClassee, tournoi, deux, carte }. Jamais en qualification classée, en
  // tournoi chrono ni à deux ; sans choix du joueur, allumée en débutant seulement.
  // (spectateur : une course entre IA sans joueur, il n'y a personne à conseiller ; force : une leçon du tutoriel qui
  // l'allume pendant la leçon, 'oui' ou 'freinages', JEU.conseilForce, quel que soit le réglage du joueur)
  function mode(o) {
    if (!o.carte || o.tournoi || o.deux || o.qualifClassee || o.spectateur) return null;
    if (!['course', 'pause', 'survol', 'qualif'].includes(o.ecran)) return null;
    if (o.force === 'oui' || o.force === 'freinages') return o.force === 'oui' ? 'tout' : 'freinages';
    const r = o.reglage === 'oui' || o.reglage === 'non' || o.reglage === 'freinages' ? o.reglage : (o.niveau === 'debutant' ? 'oui' : 'non');
    return r === 'oui' ? 'tout' : r === 'freinages' ? 'freinages' : null;
  }
  // le réglage que montre le bouton (le choix sauvegardé, ou celui du niveau tant qu'on n'a rien choisi)
  function reglageVu(reglage, niveau) {
    return reglage === 'oui' || reglage === 'non' || reglage === 'freinages' ? reglage : (niveau === 'debutant' ? 'oui' : 'non');
  }

  // --- le dessin : un ruban de points (deux sommets par point de la trajectoire), couleurs par sommet, un appel
  let ligne = null, nbPoints = 0;
  function init(scene) {
    nbPoints = Math.ceil(R.CONSEIL_LONGUEUR / 2) + 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nbPoints * 6), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nbPoints * 6), 3));
    const idx = [];
    for (let k = 0; k < nbPoints - 1; k++) { const a = 2 * k; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setIndex(idx);
    // (forceSinglePass : un objet transparent à deux faces serait dessiné en deux passes, donc deux appels)
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: R.CONSEIL_OPACITE, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    ligne = new THREE.Mesh(geo, mat);
    ligne.name = 'conseil-trajectoire'; ligne.frustumCulled = false; ligne.visible = false;
    scene.add(ligne);
  }
  const TEINTES = typeof THREE !== 'undefined' ? [R.COULEUR_CONSEIL_VERT, R.COULEUR_CONSEIL_JAUNE, R.COULEUR_CONSEIL_ROUGE].map(h => new THREE.Color(h)) : [];
  // à chaque image : v la voiture du joueur, carte, m = mode(...) ; relief = SCENE3D.relief (le pont) ou null
  function maj(v, carte, m, relief) {
    if (!ligne) return;
    if (!m || !v || !v.piste || !carte) { ligne.visible = false; return; }
    const c = carte.circuit, T = carte.trajectoire, nb = c.nb, i0 = (v.piste.indice + 1) % nb;
    const n = Math.min(nbPoints, Math.max(2, Math.round(R.CONSEIL_LONGUEUR / c.pas)));
    const coul = couleurs(carte, i0, v.u, n, (v.adhMeteo || 1) * (v.adherence || 1) * (v.aileronAdherence || 1)), pos = ligne.geometry.attributes.position.array, col = ligne.geometry.attributes.color.array, L = R.CONSEIL_LARGEUR / 2;
    let quads = 0;
    for (let k = 0; k < n; k++) {
      const i = (i0 + k) % nb, y = R.CONSEIL_HAUTEUR + (relief ? relief[i] : 0), cache = m === 'freinages' && coul[k] !== ROUGE;
      // (freinages seulement : les autres points ont une largeur nulle, rien ne se voit)
      const l = cache ? 0 : L, nx = c.nx[i], nz = c.nz[i];
      pos.set([T.x[i] - nx * l, y, T.z[i] - nz * l, T.x[i] + nx * l, y, T.z[i] + nz * l], 6 * k);
      const t = TEINTES[coul[k]];
      col.set([t.r, t.g, t.b, t.r, t.g, t.b], 6 * k);
      if (!cache) quads++;
    }
    ligne.geometry.setDrawRange(0, (n - 1) * 6);
    ligne.geometry.attributes.position.needsUpdate = true;
    ligne.geometry.attributes.color.needsUpdate = true;
    ligne.visible = quads > 0;
  }

  return { couleurs, mode, reglageVu, init, maj, VERT, JAUNE, ROUGE, get ligne() { return ligne; } };
})();
