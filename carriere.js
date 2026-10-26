// La fin de carrière (étape 14, CLAUDE.md « La carrière du joueur », « La relève »), en calcul pur (ni Three.js ni page) :
// ce que la carrière garde au fil des Grands Prix (le meilleur résultat à domicile, le meilleur temps de réaction), le bilan
// à la retraite (saisons, titres, victoires, podiums, poles, meilleurs tours, domicile, réaction, les duels contre chaque
// coéquipier, la une préférée), le résumé compact d'une carrière finie, le temple de la renommée (les carrières finies,
// classées par titres puis victoires) et les records de carrière. Le championnat (ch) garde la carrière en cours
// (ch.carriere) ; le temple et les records sont à la racine de la sauvegarde unique (sauvegarde.js : temple), à côté du
// championnat : ils survivent à une nouvelle carrière. Les réglages sont dans donnees.js (TEMPLE_*).
const CARRIERE = (function () {
  const R = REGLAGES;
  const joueur = ch => ch.pilotes.find(p => p.humain);
  // les records de carrière : le plus grand nombre (ou, pour la réaction, le plus petit temps) d'une carrière finie
  const RECORDS = ['titres', 'victoires', 'podiums', 'poles', 'meilleursTours', 'saisons'];

  // la carrière en cours : la saison où elle a commencé, le meilleur résultat à domicile (place), le meilleur temps de réaction
  // (s), les duels contre les coéquipiers au début de la carrière (la relève : l'historique de la famille est gardé, le bilan
  // ne compte que ceux de ce pilote) ; une sauvegarde d'avant : une carrière commencée à la saison 1, sans record
  function completer(ch) {
    if (!ch.carriere || typeof ch.carriere !== 'object') ch.carriere = {};
    const c = ch.carriere;
    if (typeof c.debut !== 'number') c.debut = 1;
    if (c.domicile === undefined) c.domicile = null;
    if (c.reaction === undefined) c.reaction = null;
    if (!c.duelsDepart || typeof c.duelsDepart !== 'object') c.duelsDepart = {};
    if (!c.victoiresCircuit || typeof c.victoiresCircuit !== 'object') c.victoiresCircuit = {};
    // la dynastie (la relève) : le nom de famille, les générations finies (résumés compacts), le lien du pilote d'aujourd'hui
    // avec le précédent ; une sauvegarde d'avant = une dynastie d'une génération
    if (!ch.dynastie || typeof ch.dynastie !== 'object') ch.dynastie = {};
    const d = ch.dynastie, j = ch.pilotes && joueur(ch);
    if (!Array.isArray(d.generations)) d.generations = [];
    if (d.lien === undefined) d.lien = null;
    if (d.famille === undefined) d.famille = j ? famille(j.nom) : null;
    return ch;
  }

  // le nom de famille d'un nom de pilote : son dernier mot (« Alex Rossi » → « Rossi ») ; sans nom : null
  function famille(nom) {
    if (typeof nom !== 'string' || !nom.trim()) return null;
    const mots = nom.trim().split(/\s+/);
    return mots[mots.length - 1];
  }

  // après chaque Grand Prix enregistré (championnat.js : enregistrerCourse) : le meilleur résultat à domicile (la course de
  // cœur du joueur, pilote.js)
  function suivre(ch, lignes) {
    completer(ch);
    suivreVictoires(ch, lignes);
    const j = joueur(ch), n = ch.resultats.length - 1, gp = ch.calendrier[n];
    if (!j || !gp || !j.coeur || gp.circuit !== j.coeur) return ch;
    const l = lignes.find(x => x.k === j.id);
    if (l && (ch.carriere.domicile === null || l.place < ch.carriere.domicile)) ch.carriere.domicile = l.place;
    return ch;
  }

  // les victoires de la carrière par circuit (les records de famille)
  function suivreVictoires(ch, lignes) {
    const j = joueur(ch), n = ch.resultats.length - 1, gp = ch.calendrier[n], l = j && lignes.find(x => x.k === j.id);
    if (l && l.place === 1 && gp) ch.carriere.victoiresCircuit[gp.circuit] = (ch.carriere.victoiresCircuit[gp.circuit] || 0) + 1;
  }

  // un départ du joueur (principal.js) : son temps de réaction, gardé s'il est meilleur
  function noterReaction(ch, t) {
    if (!ch || typeof t !== 'number' || !(t > 0)) return false;
    completer(ch);
    if (ch.carriere.reaction !== null && ch.carriere.reaction <= t) return false;
    ch.carriere.reaction = t;
    return true;
  }

  const paire = d => ({ qualifs: d ? d.qualifs.slice() : [0, 0], courses: d ? d.courses.slice() : [0, 0] });
  const moins = (a, b) => ({ qualifs: [a.qualifs[0] - b.qualifs[0], a.qualifs[1] - b.qualifs[1]], courses: [a.courses[0] - b.courses[0], a.courses[1] - b.courses[1]] });

  // les duels de la carrière contre chaque coéquipier : ceux d'aujourd'hui (ch.duel.carriere) et ceux des coéquipiers partis à
  // la retraite pendant la carrière (leur résumé compact) ; moins ce qui était déjà là au début de la carrière (la relève).
  // [{ pilote: { id, nom, numero } (pour le nom à l'écran), qualifs, courses, total: [joueur, lui] }], du plus disputé au moins
  function duels(ch) {
    completer(ch);
    const debut = ch.carriere.debut, depart = ch.carriere.duelsDepart, liste = [];
    const ajouter = (p, d, base) => {
      const x = moins(paire(d), paire(base));
      const total = [x.qualifs[0] + x.courses[0], x.qualifs[1] + x.courses[1]];
      if (total[0] + total[1] > 0) liste.push({ pilote: { id: p.id, nom: p.nom, numero: p.numero }, qualifs: x.qualifs, courses: x.courses, total });
    };
    // (ce qui était déjà là au début : le même pilote, reconnu à son nom et à son numéro dans duelsDepart)
    const base = p => { const x = depart[p.id]; return x && x.nom === p.nom && x.numero === p.numero ? x : null; };
    for (const r of ch.retraites || []) if (r.duel && r.saison >= debut && typeof r.id === 'number') ajouter(r, r.duel, base(r));
    const C = ch.duel ? ch.duel.carriere : {};
    for (const k of Object.keys(C)) { const p = ch.pilotes[k]; if (p) ajouter(p, C[k], base(p)); }
    return liste.sort((a, b) => (b.total[0] + b.total[1]) - (a.total[0] + a.total[1]) || a.pilote.id - b.pilote.id);
  }

  // la une préférée : celle de la carrière dont le fait a la plus haute priorité (JOURNAL_PRIORITES), la première s'il y en a
  // plusieurs ; renvoie son indice dans l'album, ou null
  function unePreferee(ch) {
    completer(ch);
    const P = R.JOURNAL_PRIORITES, debut = ch.carriere.debut;
    let meilleure = null;
    (ch.album || []).forEach((u, i) => {
      if ((typeof u.s === 'number' ? u.s : 1) < debut) return;
      const rang = P.indexOf(u.f) < 0 ? P.length : P.indexOf(u.f);
      if (meilleure === null || rang < meilleure.rang) meilleure = { i, rang };
    });
    return meilleure ? meilleure.i : null;
  }

  // les saisons de la carrière dans l'historique (saisons.js : ch.saisons)
  const saisonsDe = ch => (ch.saisons || []).filter(s => s.saison >= ch.carriere.debut);

  // le bilan de la carrière : tout ce que l'écran montre (les noms viennent de l'affichage)
  function bilan(ch) {
    completer(ch);
    const j = joueur(ch), s = j.stats, S = saisonsDe(ch);
    return {
      nom: j.nom, numero: j.numero, pays: j.pays || null, casque: j.casque || null, debut: ch.carriere.debut, fin: ch.saison,
      raison: ch.retraite ? ch.retraite.raison : null,
      saisons: s.saisons || S.length, titres: s.titres || 0, victoires: s.victoires, podiums: s.podiums, poles: s.poles, meilleursTours: s.meilleursTours, courses: s.courses,
      meilleurePlace: S.length ? Math.min(...S.map(x => x.joueur)) : null,   // la meilleure place au championnat
      domicile: ch.carriere.domicile, reaction: ch.carriere.reaction, duels: duels(ch), une: unePreferee(ch),
    };
  }

  // le résumé compact d'une carrière finie (le temple, la dynastie) : des nombres et le nom, jamais l'historique course par course
  function resume(ch) {
    const b = bilan(ch), d = ch.dynastie;
    return {
      nom: b.nom, numero: b.numero, pays: b.pays, casque: b.casque, debut: b.debut, fin: b.fin, saisons: b.saisons, titres: b.titres,
      victoires: b.victoires, podiums: b.podiums, poles: b.poles, meilleursTours: b.meilleursTours, domicile: b.domicile, reaction: b.reaction,
      famille: d ? d.famille || null : null, generation: d && d.generations ? d.generations.length + 1 : 1, monde: ch.graine,
      lien: d ? d.lien : null, victoiresCircuit: Object.assign({}, ch.carriere.victoiresCircuit),
    };
  }

  // --- la relève (CLAUDE.md « La relève : une vraie dynastie ») ---
  const LIENS = ['fils', 'fille', 'protege', 'protegee'];

  // les records de la famille : titres et victoires de toutes les générations (celle d'aujourd'hui comprise), les victoires par
  // circuit, le nombre de générations championnes
  function recordsFamille(ch) {
    completer(ch);
    const toutes = ch.dynastie.generations.concat([resume(ch)]), circuits = {};
    for (const g of toutes) for (const [c, n] of Object.entries(g.victoiresCircuit || {})) circuits[c] = (circuits[c] || 0) + n;
    return {
      generations: toutes.length, titres: toutes.reduce((a, g) => a + (g.titres || 0), 0), victoires: toutes.reduce((a, g) => a + (g.victoires || 0), 0),
      podiums: toutes.reduce((a, g) => a + (g.podiums || 0), 0), championnes: toutes.filter(g => g.titres > 0).length, circuits,
    };
  }

  // les titres des générations finies (l'héritage se calcule sur ce que la famille a déjà gagné)
  const titresFamille = ch => ch.dynastie.generations.reduce((a, g) => a + (g.titres || 0), 0);

  // l'héritage, toujours plafonné (donnees.js) : les jauges de réputation de départ un peu plus haut si la famille a des titres
  function reputationDepart(ch) {
    return R.REPUTATION_DEPART + Math.min(R.HERITAGE_REPUTATION_MAX, titresFamille(ch) * R.HERITAGE_REPUTATION_PAR_TITRE);
  }

  // « un peu plus d'attention » : à la fin de sa première saison, un héritier a ce bonus de note pour les offres des écuries
  // moyennes et faibles, jamais pour une grande (saisons.js : offres) ; 0 pour un premier pilote
  function attention(ch, rang, nbEcuries) {
    completer(ch);
    if (!ch.dynastie.generations.length || ch.saison !== ch.carriere.debut) return 0;
    return rang < nbEcuries / 3 ? 0 : R.HERITAGE_ATTENTION;
  }

  // l'écurie la plus faible (le plus petit niveau ; à égalité la plus grande id)
  const plusFaible = ch => ch.ecuries.slice().sort((a, b) => a.niveau - b.niveau || b.id - a.id)[0].id;

  // les choix de l'héritier { prenom, numero, lien, casque, pays, coeur } vérifiés ; le nom de famille est gardé, le pays et la
  // course de cœur du parent par défaut. Renvoie { ok, erreurs: ['prenom' | 'numero' | 'lien' | 'pays' | 'coeur'], choix }
  function validerHeritier(ch, choix) {
    completer(ch);
    const j = joueur(ch), erreurs = [];
    const prenom = PILOTE.nettoyerNom(choix.prenom);
    if (!prenom) erreurs.push('prenom');
    if (!LIENS.includes(choix.lien)) erreurs.push('lien');
    const v = PILOTE.valider(ch, { nom: prenom, numero: choix.numero, pays: choix.pays || j.pays, coeur: choix.coeur || j.coeur });
    // (la course de cœur du parent est gardée telle quelle, même si c'est un circuit d'essai)
    if (v.erreurs.includes('coeur') && v.choix.pays && !choix.coeur && j.coeur) v.choix.coeur = j.coeur;
    for (const e of v.erreurs) if (!(e === 'coeur' && v.choix.coeur)) erreurs.push(e);
    const fam = ch.dynastie.generations.length ? ch.dynastie.famille : famille(j.nom);   // (le premier pilote a pu se nommer après le chargement)
    const nom = prenom ? (fam ? prenom + ' ' + fam : prenom) : null;
    // le casque : celui choisi, si son motif est permis (ceux de départ et les motifs débloqués, debloques = SAUVEGARDE.motifs()) ;
    // sinon celui du parent
    const debloques = choix.debloques || [], permis = c => CASQUE.valide(c) && (typeof CASQUE.permis !== 'function' || CASQUE.permis(c.motif, debloques) || (j.casque && c.motif === j.casque.motif));
    const casque = permis(choix.casque) ? CASQUE.creer(choix.casque.motif, choix.casque.couleurs) : (CASQUE.valide(j.casque) ? CASQUE.creer(j.casque.motif, j.casque.couleurs) : CASQUE.neutre());
    return { ok: erreurs.length === 0, erreurs, choix: { nom, prenom, numero: v.choix.numero, lien: choix.lien, casque, pays: v.choix.pays, coeur: v.choix.coeur } };
  }

  // le casque proposé à l'héritier : celui du parent (mêmes couleurs, même motif : l'éditeur laisse changer le motif)
  function casqueParent(ch) {
    const j = joueur(ch);
    return CASQUE.valide(j.casque) ? CASQUE.creer(j.casque.motif, j.casque.couleurs) : CASQUE.neutre();
  }

  // « Continuer la dynastie » : la carrière finie devient une génération (résumé compact) ; le MÊME monde passe à la saison
  // suivante (les rivaux évoluent, saisons.js : nouvelleSaison) ; l'héritier prend la place du joueur : son nom (prénom + nom de
  // famille), son numéro, son casque, son pays ; il repart de zéro (statistiques, garage, argent) dans l'écurie la plus faible ;
  // seule la réputation de départ hérite un peu (plafonnée). Renvoie false si les choix ne vont pas ou si la carrière n'est pas finie
  function continuer(ch, choix) {
    completer(ch);
    if (!ch.retraite) return false;
    const v = validerHeritier(ch, choix);
    if (!v.ok) return false;
    const c = v.choix, j = joueur(ch), ancienNumero = j.numero;
    if (!ch.dynastie.generations.length) ch.dynastie.famille = famille(j.nom);
    ch.dynastie.generations.push(resume(ch));
    ch.retraite = null;
    ch.enFinDeSaison = true;   // (la saison est close : terminerSaison)
    SAISONS.nouvelleSaison(ch);
    // l'écurie la plus faible de la nouvelle saison (les niveaux viennent d'évoluer) : il prend la place de son pilote le moins bien
    // classé, qui va dans l'ancienne écurie du joueur ; puis le duel repart avec le nouveau coéquipier
    const faible = plusFaible(ch);
    if (j.ecurie !== faible) {
      const partant = ch.pilotes.filter(p => p.ecurie === faible && !p.humain).sort((a, b) => b.id - a.id)[0];
      partant.ecurie = j.ecurie;
      j.ecurie = faible;
      CHAMPIONNAT.completer(ch);
    }
    // l'héritier : tout repart de zéro, comme un premier pilote
    j.nom = c.nom; j.numero = c.numero; j.casque = c.casque; j.pays = c.pays; j.coeur = c.coeur;
    // (un nouveau rival arrivé à cette fin de saison a pu tirer le numéro choisi : il prend l'ancien numéro du parent, libre)
    for (const p of ch.pilotes) if (!p.humain && p.numero === c.numero) p.numero = ancienNumero;
    j.stats = { courses: 0, victoires: 0, podiums: 0, poles: 0, meilleursTours: 0, points: 0, titres: 0, saisons: 0 };
    j.places = [];
    for (const n of Object.keys(ch.garage || {})) ch.garage[n] = 0;
    ch.argent = { solde: 0, historique: [] };
    ch.sponsor = null;
    const rep = reputationDepart(ch);
    ch.reputation = { public: rep, ecurie: rep, sponsors: rep };
    ch.confiance = rep;
    ch.dynastie.lien = c.lien;
    // la nouvelle carrière : ses records repartent de rien ; les duels de la famille sont gardés (on note où ils en étaient)
    const depart = {};
    for (const [k, d] of Object.entries(ch.duel ? ch.duel.carriere : {})) { const p = ch.pilotes[k]; depart[k] = { qualifs: d.qualifs.slice(), courses: d.courses.slice(), nom: p ? p.nom : null, numero: p ? p.numero : null }; }
    ch.carriere = { debut: ch.saison, domicile: null, reaction: null, duelsDepart: depart, victoiresCircuit: {} };
    return true;
  }

  // « Nouvelle dynastie » : un monde neuf (une autre graine : d'autres rivaux, d'autres caractères) ; l'ancienne carrière reste au
  // temple (sauvegarde.js : entrerAuTemple, à la racine de la sauvegarde)
  function nouveauMonde(ancien) {
    return CHAMPIONNAT.creer(((ancien && ancien.graine) || 1) * 7 + 13);
  }

  // la génération d'avant (son résumé), ou null pour un premier pilote
  function parent(ch) {
    completer(ch);
    const G = ch.dynastie.generations;
    return G.length ? G[G.length - 1] : null;
  }

  // un rival a-t-il couru contre la génération d'avant ? (il était déjà là avant le début de la carrière d'aujourd'hui)
  function aCouruContreParent(ch, k) {
    completer(ch);
    const p = ch.pilotes[k];
    if (!parent(ch) || !p || p.humain) return false;
    return (p.stats.saisons || 0) > ch.saison - ch.carriere.debut;
  }

  // les clés de texte qui parlent du pilote précédent (jamais genrées : tests) et celles de l'héritier (une par lien)
  const CLES_PARENT = ['ficheFamille', 'releveTitre', 'releveParent', 'heritierParent', 'heritierMotif', 'arbreTitre', 'bilanFamille', 'continuerDynastie', 'nouvelleDynastie', 'heritierTitre'];
  const CLES_HERITIER = l => ['uneTitre_releve_' + l, 'uneTexte_releve_' + l, 'heritierLien_' + l];

  // --- le temple de la renommée et les records de carrière (à la racine de la sauvegarde : t = { carrieres, records }) ---
  function templeVierge() {
    return { carrieres: [], records: {} };
  }

  function completerTemple(t) {
    if (!t || typeof t !== 'object') t = templeVierge();
    if (!Array.isArray(t.carrieres)) t.carrieres = [];
    if (!t.records || typeof t.records !== 'object') t.records = {};
    return t;
  }

  // l'ordre du temple : les titres, puis les victoires, puis les podiums, puis la plus ancienne
  const ordre = (a, b) => b.titres - a.titres || b.victoires - a.victoires || b.podiums - a.podiums || (a.n || 0) - (b.n || 0);
  function classer(t) {
    return completerTemple(t).carrieres.slice().sort(ordre);
  }

  // une carrière finie entre au temple (r = resume) avec son numéro d'entrée n (t.compteur) ; les records battus sont remplacés ;
  // le temple garde au plus TEMPLE_MAX carrières (les moins bonnes partent) ; renvoie son numéro n
  function entrer(t, r) {
    completerTemple(t);
    t.compteur = (t.compteur || t.carrieres.reduce((m, x) => Math.max(m, x.n || 0), 0)) + 1;
    const e = Object.assign({ n: t.compteur }, r);
    for (const cle of RECORDS) if (typeof e[cle] === 'number' && (!t.records[cle] || e[cle] > t.records[cle].valeur)) t.records[cle] = { valeur: e[cle], nom: e.nom, numero: e.numero, n: e.n };
    if (typeof e.reaction === 'number' && (!t.records.reaction || e.reaction < t.records.reaction.valeur)) t.records.reaction = { valeur: e.reaction, nom: e.nom, numero: e.numero, n: e.n };
    t.carrieres.push(e);
    t.carrieres.sort(ordre);
    if (t.carrieres.length > R.TEMPLE_MAX) t.carrieres.length = R.TEMPLE_MAX;
    return e.n;
  }

  // la place au temple (1 = la meilleure) de la carrière n, ou null si elle n'y est pas (ou plus)
  function place(t, n) {
    const i = classer(t).findIndex(x => x.n === n);
    return i < 0 ? null : i + 1;
  }

  return { completer, suivre, noterReaction, duels, unePreferee, bilan, resume, templeVierge, completerTemple, classer, entrer, place, RECORDS,
    famille, LIENS, recordsFamille, reputationDepart, attention, validerHeritier, casqueParent, continuer, nouveauMonde, parent, aCouruContreParent, CLES_PARENT, CLES_HERITIER };
})();
