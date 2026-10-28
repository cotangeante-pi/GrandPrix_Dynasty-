// La réalisation télé (CLAUDE.md « La réalisation télé (de vraies caméras) ») : de vraies caméras placées dans le monde (des mâts
// au bord de la piste, à la ligne, à la sortie des stands, à chaque virage, le long des grandes lignes droites), un hélicoptère
// qui suit de loin, et une régie qui choisit le plan. En calcul pur (sans Three.js) : camera.js lit le plan et le pose.
// - REGIE.postes(circuit, cameras) : les postes { x, y, z, s, cote } (cameras : ceux d'un décor en données, sinon tirés du tracé) ;
// - REGIE.obstacles(objets) : les boîtes du décor qui cachent la vue (decor.js : tribunes, bâtiments, immeubles, collines, arbres…),
//   en cylindres { cx, cz, rayon, h } ;
// - REGIE.voit(regie, depuis, cible) : la ligne de visée ne traverse aucun obstacle ;
// - REGIE.creer(circuit, postes, obstacles) et REGIE.choisir(regie, t, cible) → le plan { genre: 'poste' | 'helico', poste, x, y, z,
//   champ } : un poste qui voit la voiture maintenant ET pendant TELE_PLAN_MIN s (d'après sa route), gardé au moins TELE_PLAN_MIN s,
//   coupé franchement ; l'hélicoptère (entre TELE_HELICO_HAUTEUR[0] et [1] m, qui suit en douceur) quand aucun poste ne la voit,
//   et sur les très longues lignes droites. Un poste ne bouge jamais : seuls l'angle et le zoom changent.
const REGIE = (function () {
  const R = REGLAGES;

  function indice(c, s) { const L = c.longueur; return Math.round((((s % L) + L) % L) / c.pas) % c.nb; }

  function postes(c, cameras) {
    const res = [], dB = c.largeur / 2 + R.DISTANCE_BARRIERE, L = c.longueur;
    const ajouter = (s, cote, ecart, hauteur) => {
      s = ((s % L) + L) % L;
      const i = indice(c, s), d = cote * (dB + (ecart === undefined ? R.TELE_POSTE_RECUL : ecart));
      const p = { x: c.x[i] + c.nx[i] * d, z: c.z[i] + c.nz[i] * d, y: hauteur === undefined ? R.TELE_POSTE_HAUTEUR : hauteur, s, cote };
      if (res.every(q => Math.hypot(q.x - p.x, q.z - p.z) >= R.TELE_POSTE_ECART_MIN)) res.push(p);
    };
    if (cameras && cameras.length) for (const k of cameras) ajouter(k.s, k.cote, k.ecart, k.hauteur);
    else {
      const stands = c.stands;
      ajouter(0, stands ? -stands.cote : 1);                                           // la ligne (du côté de la tribune principale)
      if (stands) ajouter(stands.sortie + R.TELE_SORTIE_STANDS, stands.cote);           // la sortie des stands
      for (const m of c.morceaux || []) {
        const longueur = m.fin - m.debut;
        if (m.type !== 'droite') ajouter((m.debut + m.fin) / 2, -(m.angles[0] || 1));   // chaque virage : à l'extérieur
        else if (longueur > R.TELE_DROITE_MIN) {                                          // le long des grandes lignes droites
          const n = Math.floor(longueur / R.TELE_DROITE_PAS);
          for (let k = 1; k <= n; k++) ajouter(m.debut + k * longueur / (n + 1), k % 2 ? 1 : -1);
        }
      }
      if (!res.length) for (let s = 0; s < L; s += R.TELE_DROITE_PAS) ajouter(s, 1);
    }
    return res;
  }

  // les obstacles : un cylindre par objet qui cache (le public, les panneaux, les pneus et l'eau ne cachent rien)
  function obstacles(objets) {
    const res = [], ajouter = (liste, h) => { for (const o of liste || []) if (o.cx !== undefined) res.push({ cx: o.cx, cz: o.cz, rayon: o.rayon, h: h(o) }); };
    const hTribune = R.TRIBUNE_RANGS * R.TRIBUNE_MARCHE[1] + R.TRIBUNE_TOIT + 0.3;
    ajouter(objets.tribune, o => hTribune * (o.ey === undefined ? 1 : o.ey));
    ajouter(objets.batiment, o => (R.STANDS_HAUTEUR + 0.4) * (o.ey === undefined ? 1 : o.ey));
    ajouter(objets.immeuble, o => o.ey);
    ajouter(objets.colline, o => o.ey);
    ajouter(objets.hotel, () => 30);
    ajouter(objets.arbreA, o => 9 * o.e);
    ajouter(objets.arbreB, o => 7.5 * o.e);
    return res;
  }

  function creer(c, liste, obst) {
    // les obstacles rangés dans une grille (TELE_CASE m) ; les très grands à part, regardés à chaque fois
    const G = R.TELE_CASE, grille = new Map(), grands = [];
    for (const o of obst || []) {
      if (o.rayon > G / 2) { grands.push(o); continue; }
      const k = Math.floor(o.cx / G) + ',' + Math.floor(o.cz / G);
      if (!grille.has(k)) grille.set(k, []);
      grille.get(k).push(o);
    }
    return { c, postes: liste, grille, grands, actuel: null, depuis: -Infinity, helico: null, t: 0 };
  }

  // la ligne de visée de depuis { x, y, z } à cible { x, y, z } ne passe dans aucun obstacle (un cylindre : la ligne entre dans son
  // cercle et passe sous son sommet) ; un obstacle qui contient la caméra (sur son toit) ou la cible ne compte pas
  function voit(r, a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    if (L < 1e-6) return true;
    const G = R.TELE_CASE, vus = new Set(), tester = o => {
      const u = Math.max(0, Math.min(1, ((o.cx - a.x) * dx + (o.cz - a.z) * dz) / (L * L)));
      const px = a.x + dx * u - o.cx, pz = a.z + dz * u - o.cz, d2 = px * px + pz * pz, r2 = o.rayon * o.rayon;
      if (d2 >= r2) return false;
      if ((a.x - o.cx) * (a.x - o.cx) + (a.z - o.cz) * (a.z - o.cz) < r2 || (b.x - o.cx) * (b.x - o.cx) + (b.z - o.cz) * (b.z - o.cz) < r2) return false;
      const demi = Math.sqrt(r2 - d2) / L, u0 = Math.max(0, u - demi), u1 = Math.min(1, u + demi);
      const y = Math.min(a.y + (b.y - a.y) * u0, a.y + (b.y - a.y) * u1);
      return y < o.h;
    };
    for (const o of r.grands) if (tester(o)) return false;
    const n = Math.ceil(L / (G / 2));
    for (let k = 0; k <= n; k++) {
      const x = a.x + dx * k / n, z = a.z + dz * k / n, gi = Math.floor(x / G), gj = Math.floor(z / G);
      for (let p = -1; p <= 1; p++) for (let q = -1; q <= 1; q++) {
        const cle = (gi + p) + ',' + (gj + q);
        if (vus.has(cle)) continue;
        vus.add(cle);
        const l = r.grille.get(cle);
        if (l) for (const o of l) if (tester(o)) return false;
      }
    }
    return true;
  }

  // où sera la voiture dans t secondes : le long de la piste à sa vitesse, au même écart (s et d connus), sinon tout droit
  function plusTard(r, cible, t) {
    const c = r.c, u = Math.max(0, cible.u || 0);
    if (cible.s === undefined || cible.s === null) return { x: cible.x + Math.cos(cible.cap) * u * t, y: R.TELE_VISEE, z: cible.z + Math.sin(cible.cap) * u * t };
    const i = indice(c, cible.s + u * t), d = cible.d || 0;
    return { x: c.x[i] + c.nx[i] * d, y: R.TELE_VISEE, z: c.z[i] + c.nz[i] * d };
  }

  // le poste voit-il la voiture maintenant et pendant les TELE_PLAN_MIN prochaines secondes, de pas trop loin ?
  function bonPoste(r, p, cible) {
    for (let t = 0; t <= R.TELE_PLAN_MIN + 1e-9; t += R.TELE_PREVISION_PAS) {
      const q = t === 0 ? { x: cible.x, y: R.TELE_VISEE, z: cible.z } : plusTard(r, cible, t);
      if (Math.hypot(q.x - p.x, q.z - p.z) > R.TELE_PORTEE || !voit(r, p, q)) return false;
    }
    return true;
  }

  // sur une très longue ligne droite (plus de TELE_HELICO_DROITE m), l'hélicoptère est préféré
  function surLongueDroite(r, cible) {
    if (cible.s === undefined || cible.s === null) return false;
    const m = (r.c.morceaux || []).find(x => cible.s >= x.debut && cible.s < x.fin);
    return !!m && m.type === 'droite' && m.fin - m.debut > R.TELE_HELICO_DROITE;
  }

  // l'hélicoptère : derrière et de côté, haut ; il suit en douceur (sauf quand on coupe sur lui : il y est tout de suite) ; sa hauteur
  // monte (jusqu'à TELE_HELICO_HAUTEUR[1]) tant qu'un obstacle cache la voiture
  function poseHelico(r, cible, dt, coupe) {
    const f = { x: Math.cos(cible.cap), z: Math.sin(cible.cap) }, [h0, h1] = R.TELE_HELICO_HAUTEUR;
    const voulu = { x: cible.x - f.x * R.TELE_HELICO_RECUL - f.z * R.TELE_HELICO_COTE, z: cible.z - f.z * R.TELE_HELICO_RECUL + f.x * R.TELE_HELICO_COTE, y: h0 };
    const visee = { x: cible.x, y: R.TELE_VISEE, z: cible.z };
    for (let y = h0; y <= h1; y += 10) { voulu.y = y; if (voit(r, voulu, visee)) break; }
    if (coupe || !r.helico) r.helico = { x: voulu.x, y: voulu.y, z: voulu.z };
    else { const a = 1 - Math.exp(-R.TELE_HELICO_DOUCEUR * dt); r.helico.x += (voulu.x - r.helico.x) * a; r.helico.y += (voulu.y - r.helico.y) * a; r.helico.z += (voulu.z - r.helico.z) * a; }
    r.helico.y = Math.max(h0, Math.min(h1, r.helico.y));
    return r.helico;
  }

  // le plan : cible { x, z, cap, u, s, d } (la voiture suivie) ; t : le temps (s), qui avance
  function choisir(r, t, cible) {
    const dt = Math.max(0, Math.min(0.5, t - r.t)); r.t = t;
    const visee = { x: cible.x, y: R.TELE_VISEE, z: cible.z };
    const age = t - r.depuis;
    let garde = false;
    if (r.actuel !== null && age < R.TELE_PLAN_MIN) garde = r.actuel === 'helico' || voit(r, r.postes[r.actuel], visee);
    else if (r.actuel !== null && r.actuel !== 'helico') {
      const p = r.postes[r.actuel];
      garde = voit(r, p, visee) && Math.hypot(p.x - cible.x, p.z - cible.z) < R.TELE_PORTEE_BONNE;
    }
    if (!garde) {
      // un nouveau plan : le poste le plus proche qui voit la voiture pendant TELE_PLAN_MIN, sinon l'hélicoptère
      let choix = 'helico';
      if (!surLongueDroite(r, cible)) {
        const tri = r.postes.map((p, k) => ({ k, d: Math.hypot(p.x - cible.x, p.z - cible.z) })).filter(x => x.d < R.TELE_PORTEE).sort((a, b) => a.d - b.d);
        for (const x of tri) if (x.k !== r.actuel && bonPoste(r, r.postes[x.k], cible)) { choix = x.k; break; }
      }
      if (choix !== r.actuel || age >= R.TELE_PLAN_MIN) { if (choix !== r.actuel) r.depuis = t; r.actuel = choix; if (choix === 'helico') poseHelico(r, cible, dt, true); }
    }
    const p = r.actuel === 'helico' ? poseHelico(r, cible, dt, false) : r.postes[r.actuel];
    const distance = Math.hypot(p.x - cible.x, p.y - R.TELE_VISEE, p.z - cible.z), cadrage = r.actuel === 'helico' ? R.TELE_HELICO_CADRAGE : R.TELE_CADRAGE;
    const champ = Math.max(R.TELE_CHAMP[0], Math.min(R.TELE_CHAMP[1], 2 * Math.atan(cadrage / 2 / distance) * 180 / Math.PI));
    return { genre: r.actuel === 'helico' ? 'helico' : 'poste', poste: r.actuel, x: p.x, y: p.y, z: p.z, champ, depuis: r.depuis };
  }

  return { postes, obstacles, creer, voit, choisir, plusTard };
})();
