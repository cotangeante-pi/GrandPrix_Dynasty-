// Les touches au choix (CLAUDE.md « Pour l'ordinateur : … touches », tour 49b), en calcul pur : les touches de chaque commande, de la course
// seule (gaz, frein, gauche, droite, retour en piste, caméra, pause) et des deux joueurs de l'écran partagé (gaz, frein, gauche, droite,
// retour en piste). Une touche est sa place sur le clavier (e.code), comme partout dans le jeu. Celles de départ sont dans donnees.js
// (TOUCHES_SEUL, TOUCHES_DEUX), copiées ici au chargement ; le choix du joueur est gardé à la racine de la sauvegarde (null = celles de
// départ). Une touche déjà prise est refusée (on dit par quelle commande) ; Échap ouvre toujours la pause et ne sert à rien d'autre.
//
//   CLAVIER.completer(sauve)            → les touches complètes (une vieille sauvegarde, ou rien : celles de départ)
//   CLAVIER.changer(t, groupe, action, code)  → { ok } ou { ok: false, raison: 'echap' | 'prise', groupe, action } (la commande qui l'a)
//   CLAVIER.appliquer(t)                → pose les touches des deux joueurs dans REGLAGES.TOUCHES_DEUX ; renvoie celles de la course seule
const CLAVIER = (function () {
  const R = REGLAGES;
  const copie = x => JSON.parse(JSON.stringify(x));
  const DEPART = { seul: copie(R.TOUCHES_SEUL), j1: copie(R.TOUCHES_DEUX[1]), j2: copie(R.TOUCHES_DEUX[2]) };
  const GROUPES = { seul: ['gaz', 'frein', 'gauche', 'droite', 'remise', 'camera', 'pause'], j1: ['gaz', 'frein', 'gauche', 'droite', 'remise'], j2: ['gaz', 'frein', 'gauche', 'droite', 'remise'] };
  // les groupes qui servent en même temps (une touche n'y est qu'à une commande) : la course seule à part, les deux joueurs ensemble
  const ENSEMBLE = { seul: ['seul'], j1: ['j1', 'j2'], j2: ['j1', 'j2'] };
  const ENSEMBLES = [['seul'], ['j1', 'j2']];
  const codeValide = c => typeof c === 'string' && /^[A-Za-z0-9]{1,24}$/.test(c);

  const defaut = () => copie(DEPART);

  function completer(s) {
    const t = defaut();
    if (s && typeof s === 'object') for (const g of Object.keys(GROUPES)) for (const a of GROUPES[g]) {
      const l = s[g] && s[g][a];
      if (Array.isArray(l) && l.length && l.every(codeValide)) t[g][a] = l.slice(0, 2);
    }
    // (tour 51j) Échap : la pause et rien d'autre, même dans une sauvegarde écrite à la main
    for (const g of Object.keys(GROUPES)) for (const a of GROUPES[g]) if (g !== 'seul' || a !== 'pause') t[g][a] = t[g][a].filter(c => c !== 'Escape');
    t.seul.pause = ['Escape'].concat(t.seul.pause.filter(c => c !== 'Escape')).slice(0, 2);   // (Échap toujours d'abord)
    // (tour 51j) jamais la même touche à deux commandes d'un même ensemble (une sauvegarde écrite à la main) : la première la garde, les
    // suivantes la perdent ; une commande restée sans touche reprend celle de départ si elle est libre, sinon tout l'ensemble repart du départ
    for (const ens of ENSEMBLES) {
      const vu = new Set(), vides = [];
      for (const g of ens) for (const a of GROUPES[g]) {
        t[g][a] = t[g][a].filter(c => !vu.has(c));
        t[g][a].forEach(c => vu.add(c));
        if (!t[g][a].length) vides.push([g, a]);
      }
      for (const [g, a] of vides) {
        const d = DEPART[g][a].filter(c => !vu.has(c));
        if (!d.length) { for (const g2 of ens) t[g2] = copie(DEPART[g2]); break; }
        t[g][a] = d; d.forEach(c => vu.add(c));
      }
    }
    return t;
  }

  // qui a déjà cette touche, parmi les groupes qui servent avec celui-ci (sauf la commande elle-même) ; null si personne
  function prise(t, groupe, action, code) {
    for (const g of ENSEMBLE[groupe]) for (const a of GROUPES[g]) {
      if (g === groupe && a === action) continue;
      if (t[g][a].includes(code)) return { groupe: g, action: a };
    }
    return null;
  }

  // la commande (groupe, action) prend la touche code (elle remplace ses touches ; la pause garde Échap en plus)
  function changer(t, groupe, action, code) {
    if (!GROUPES[groupe] || !GROUPES[groupe].includes(action) || !codeValide(code)) return { ok: false, raison: 'inconnue' };
    if (code === 'Escape') return { ok: false, raison: 'echap' };
    const p = prise(t, groupe, action, code);
    if (p) return { ok: false, raison: 'prise', groupe: p.groupe, action: p.action };
    t[groupe][action] = groupe === 'seul' && action === 'pause' ? ['Escape', code] : [code];
    return { ok: true };
  }

  function appliquer(t) {
    R.TOUCHES_DEUX[1] = copie(t.j1);
    R.TOUCHES_DEUX[2] = copie(t.j2);
    return copie(t.seul);
  }

  // les touches sont-elles celles de départ ? (pour garder null dans la sauvegarde)
  const auDepart = t => JSON.stringify(t) === JSON.stringify(DEPART);

  return { defaut, completer, changer, prise, appliquer, auDepart, GROUPES };
})();
