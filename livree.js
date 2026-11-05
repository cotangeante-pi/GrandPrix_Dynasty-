// La livrée de la voiture (CLAUDE.md « La personnalisation », tour 48c), en calcul pur + son dessin en canvas 2D :
// un motif (LIVREE_MOTIFS, ou celui d'un skin de la boutique), une couleur secondaire et le numéro du pilote en gros, sur le nez et
// sur les dérives de l'aileron arrière. En championnat, la couleur principale reste celle de l'écurie (on la reconnaît) ; en mode
// 2 joueurs et au tournoi, elle est libre. Les IA ont la livrée de leur écurie (LIVREE_ECURIES) avec leur propre numéro.
// La livrée du joueur est gardée avec son pilote dans le championnat (ch.pilotes[k].livree = { motif, couleur2 }).
// Le dessin (dessiner) remplit la case d'une voiture dans l'atlas des livrées (voiture3d.js : une texture, un matériau pour
// toutes les voitures, aucun appel de dessin en plus). Un skin ne change que le look : rien ici n'est lu par la physique.
const LIVREE = (function () {
  const R = REGLAGES;

  // la case d'une voiture : quatre zones (en part de la case) ; voiture3d.js y projette chaque face de la carrosserie
  //  COTE   : les flancs (x de la voiture → largeur, y → hauteur)        DESSUS : le dessus (x → largeur, z → hauteur)
  //  NEZ    : la plaque du numéro sur le nez (z → largeur, x → hauteur : le haut du numéro vers l'avant)
  //  DERIVE : les dérives de l'aileron arrière (le numéro, lisible des deux côtés)   BLANC : les pièces sans livrée (carbone, noir)
  const ZONES = {
    COTE: [0, 0, 1, 0.35], DESSUS: [0, 0.35, 1, 0.35], NEZ: [0.02, 0.71, 0.16, 0.28], DERIVE: [0.24, 0.71, 0.3, 0.28], BLANC: [0.62, 0.71, 0.36, 0.28],
  };
  // l'étendue de la voiture projetée dans les zones (m, repère de voiture3d.js : x vers l'avant, y vers le haut, z à droite)
  const ETENDUE = { xMin: -3.0, xMax: 3.3, yMin: 0, yMax: 1.3, zMin: -1, zMax: 1 };

  // tous les motifs : ceux de départ, puis ceux des skins (boutique)
  function motifsSkins() {
    return R.SKINS.filter(s => s.type === 'livree').map(s => s.motif);
  }
  function tousLesMotifs() {
    return R.LIVREE_MOTIFS.concat(motifsSkins());
  }

  // le motif m est-il permis ? ceux de départ toujours ; ceux d'un skin s'il est possédé (possedes : les motifs de livrée obtenus)
  function permis(m, possedes) {
    return R.LIVREE_MOTIFS.includes(m) || (possedes || []).includes(m);
  }

  const couleurOk = x => Number.isInteger(x) && x >= 0 && x <= 0xffffff;

  function creer(motif, couleur2, couleur1) {
    const l = { motif, couleur2 };
    if (couleur1 !== undefined && couleur1 !== null) l.couleur1 = couleur1;
    return l;
  }

  function defaut() {
    return creer(R.LIVREE_DEFAUT.motif, R.LIVREE_DEFAUT.couleur2);
  }

  // une livrée valide ? (motif connu, couleur secondaire entière ; la couleur principale, si elle est là, aussi)
  function valide(l) {
    return !!l && typeof l === 'object' && tousLesMotifs().includes(l.motif) && couleurOk(l.couleur2) && (l.couleur1 === undefined || couleurOk(l.couleur1));
  }

  // la livrée de l'écurie i (ses deux voitures : celle de l'IA et, s'il n'a pas choisi, celle du joueur)
  function ecurie(i) {
    const e = R.LIVREE_ECURIES[((i % R.LIVREE_ECURIES.length) + R.LIVREE_ECURIES.length) % R.LIVREE_ECURIES.length];
    return creer(e.motif, e.couleur2);
  }

  // le joueur sans livrée (une ancienne sauvegarde, un championnat neuf) reçoit la livrée par défaut ; les rivaux n'en gardent
  // pas (la leur vient de leur écurie) ; renvoie le nombre de livrées données
  function completer(ch) {
    if (!ch || !Array.isArray(ch.pilotes)) return 0;
    let n = 0;
    for (const p of ch.pilotes) if (p && p.humain && !valide(p.livree)) { p.livree = defaut(); n++; }
    return n;
  }

  // ce que dessine la case d'une voiture : { couleur1, couleur2, motif, numero, drapeau } ; libre : la couleur principale
  // de la livrée remplace celle de l'écurie (2 joueurs, tournoi) ; pays : le pays du pilote (le skin drapeau)
  function pourVoiture(couleurEcurie, livree, numero, libre, pays) {
    const l = valide(livree) ? livree : defaut();
    const c1 = libre && l.couleur1 !== undefined ? l.couleur1 : couleurEcurie;
    return { couleur1: c1, couleur2: l.couleur2, motif: l.motif, numero: numero === undefined || numero === null ? '' : String(numero), drapeau: (pays && R.PAYS_COULEURS[pays]) || R.PAYS_COULEURS.fr };
  }

  const css = x => '#' + x.toString(16).padStart(6, '0');
  const clair = x => ((x >> 16) & 255) * 0.299 + ((x >> 8) & 255) * 0.587 + (x & 255) * 0.114 > 150;

  // --- le dessin de la case (x, y, t : son coin et sa taille en pixels) dans un contexte canvas 2D
  function dessiner(ctx, x, y, t, d) {
    const zone = n => { const z = ZONES[n]; return [x + z[0] * t, y + z[1] * t, z[2] * t, z[3] * t]; };
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, t, t); ctx.clip();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, t, t);
    bande(ctx, zone('COTE'), d, 'cote');
    bande(ctx, zone('DESSUS'), d, 'dessus');
    numero(ctx, zone('NEZ'), d, true);
    numero(ctx, zone('DERIVE'), d, false);
    const b = zone('BLANC'); ctx.fillStyle = '#ffffff'; ctx.fillRect(b[0], b[1], b[2], b[3]);
    ctx.restore();
  }

  // une bande (les flancs ou le dessus) : la gauche est l'arrière de la voiture, la droite l'avant ; sur le dessus, le milieu de la
  // hauteur est l'axe de la voiture
  function bande(ctx, [bx, by, bw, bh], d, sorte) {
    const c1 = css(d.couleur1), c2 = css(d.couleur2), m = d.motif, dessus = sorte === 'dessus';
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.fillStyle = c1; ctx.fillRect(bx, by, bw, bh);
    const X = f => bx + f * bw, Y = f => by + f * bh;
    ctx.fillStyle = c2;
    if (m === 'bandes') {
      if (dessus) { ctx.fillRect(bx, Y(0.38), bw, bh * 0.07); ctx.fillRect(bx, Y(0.55), bw, bh * 0.07); }
      else { ctx.fillRect(bx, Y(0.42), bw, bh * 0.12); ctx.fillRect(bx, Y(0.6), bw, bh * 0.05); }
    } else if (m === 'fleche') {
      ctx.beginPath();
      if (dessus) { ctx.moveTo(X(0.15), Y(0.2)); ctx.lineTo(X(0.95), Y(0.5)); ctx.lineTo(X(0.15), Y(0.8)); ctx.lineTo(X(0.3), Y(0.5)); }
      else { ctx.moveTo(X(0.1), Y(0.25)); ctx.lineTo(X(0.98), Y(0.62)); ctx.lineTo(X(0.1), Y(0.85)); ctx.lineTo(X(0.25), Y(0.6)); }
      ctx.closePath(); ctx.fill();
    } else if (m === 'degrade') {
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, c2); g.addColorStop(0.35, c2); g.addColorStop(0.75, c1); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
    } else if (m === 'damier') {
      const n = 8, c = bh / n;
      for (let i = 0; i * c < bw * 0.4; i++) for (let j = 0; j < n; j++) if ((i + j) % 2) ctx.fillRect(bx + i * c, by + j * c, c + 0.5, c + 0.5);
    } else if (m === 'flammes') {   // des langues de feu qui partent de l'avant vers l'arrière
      const bas = dessus ? 0.8 : 0.88;
      ctx.beginPath(); ctx.moveTo(X(1), Y(bas)); ctx.lineTo(X(1), Y(dessus ? 0.2 : 0.3));
      for (let i = 0; i < 6; i++) { const f = 0.92 - i * 0.1; ctx.lineTo(X(f - 0.07), Y(i % 2 ? 0.12 : 0.22)); ctx.lineTo(X(f - 0.08), Y(0.5)); }
      ctx.lineTo(X(0.3), Y(bas)); ctx.closePath(); ctx.fill();
    } else if (m === 'carbone') {   // (skin) un tissage de carbone sombre, une bande de la couleur principale au milieu
      const c = Math.max(2, bh / 14);
      ctx.fillStyle = '#1f2125'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#34373d';
      for (let i = 0; i * c < bw; i++) for (let j = 0; j * c < bh; j++) if ((i + j) % 2) ctx.fillRect(bx + i * c, by + j * c, c, c * 0.5);
      ctx.fillStyle = c1; ctx.fillRect(bx, Y(dessus ? 0.4 : 0.45), bw, bh * 0.2);
      ctx.fillStyle = c2; ctx.fillRect(bx, Y(dessus ? 0.37 : 0.42), bw, bh * 0.03); ctx.fillRect(bx, Y(dessus ? 0.6 : 0.65), bw, bh * 0.03);
    } else if (m === 'eclairs') {   // (skin) des éclairs de la couleur secondaire
      for (const f of [0.15, 0.48, 0.8]) {
        ctx.beginPath(); ctx.moveTo(X(f), Y(0.15)); ctx.lineTo(X(f + 0.08), Y(0.15)); ctx.lineTo(X(f + 0.03), Y(0.48)); ctx.lineTo(X(f + 0.1), Y(0.48));
        ctx.lineTo(X(f - 0.02), Y(0.9)); ctx.lineTo(X(f + 0.01), Y(0.55)); ctx.lineTo(X(f - 0.05), Y(0.55)); ctx.closePath(); ctx.fill();
      }
    } else if (m === 'galaxie') {   // (skin) un ciel de nuit étoilé, la couleur principale en liseré
      const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
      g.addColorStop(0, '#120a2e'); g.addColorStop(0.5, '#3b1a6e'); g.addColorStop(1, '#0b1f4d');
      ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
      let s = 7;
      const alea = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };   // (un petit tirage à lui : jamais hasard(), la graine du jeu ne bouge pas)
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) { const r = 0.6 + alea() * 1.4; ctx.fillRect(X(alea()), Y(alea()), r, r); }
      ctx.fillStyle = c1; ctx.fillRect(bx, Y(dessus ? 0.46 : 0.88), bw, bh * 0.08);
    } else if (m === 'or') {   // (skin, récompense) de l'or, la couleur de l'écurie au milieu
      const g = ctx.createLinearGradient(bx, by, bx, by + bh);
      g.addColorStop(0, '#fff1a8'); g.addColorStop(0.45, '#d4af37'); g.addColorStop(1, '#8a6d1c');
      ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = c1; ctx.fillRect(bx, Y(dessus ? 0.42 : 0.45), bw, bh * 0.16);
    } else if (m === 'drapeau') {   // (skin, récompense) les couleurs du drapeau du pays, en bandes le long de la voiture
      const f = d.drapeau, h = 0.6 / f.length;
      f.forEach((c, i) => { ctx.fillStyle = css(c); ctx.fillRect(X(0.12), Y(0.2 + i * h), bw * 0.76, bh * h + 0.5); });
    } else {   // uni : un liseré de la couleur secondaire
      ctx.fillRect(bx, Y(dessus ? 0.47 : 0.78), bw, bh * 0.06);
    }
    ctx.restore();
  }

  // le numéro en gros, sur le fond de la couleur principale ; un contour pour qu'il se lise sur n'importe quelle couleur.
  // nez : la plaque est plus longue (le long de la voiture) que large : le numéro est étiré en hauteur pour garder sa forme
  function numero(ctx, [zx, zy, zw, zh], d, nez) {
    ctx.save();
    ctx.beginPath(); ctx.rect(zx, zy, zw, zh); ctx.clip();
    ctx.fillStyle = css(d.couleur1); ctx.fillRect(zx, zy, zw, zh);
    if (d.numero) {
      const fonce = clair(d.couleur1);
      ctx.fillStyle = fonce ? '#111111' : '#ffffff'; ctx.strokeStyle = fonce ? '#ffffff' : '#111111';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const taille = Math.min(zw / (0.62 * Math.max(1, d.numero.length)), zh) * 0.92;
      ctx.translate(zx + zw / 2, zy + zh / 2);
      if (nez) ctx.scale(1, Math.min(2.2, zh / zw));   // (la plaque du nez : 0,3 m de large pour 0,7 m de long)
      ctx.font = 'bold ' + Math.round(taille) + 'px sans-serif';
      ctx.lineWidth = Math.max(1, taille * 0.08);
      ctx.strokeText(d.numero, 0, 0); ctx.fillText(d.numero, 0, 0);
    }
    ctx.restore();
  }

  // un aperçu 2D de la livrée (la bande des flancs, avec le numéro de la dérive à droite) : la boutique, la liste des motifs
  function icone(d, largeur, hauteur) {
    const c = document.createElement('canvas');
    c.width = largeur; c.height = hauteur;
    c.className = 'livreeIcone';
    const ctx = c.getContext('2d');
    bande(ctx, [0, 0, largeur, hauteur], d, 'cote');
    return c;
  }

  return { ZONES, ETENDUE, tousLesMotifs, motifsSkins, permis, creer, defaut, valide, ecurie, completer, pourVoiture, dessiner, icone };
})();
