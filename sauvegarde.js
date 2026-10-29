// La sauvegarde : un seul module, une seule clé dans localStorage, avec un numéro de version.
// localStorage peut manquer ou refuser (navigation privée, Poki dans une iframe) : tout passe par try/catch,
// et le jeu marche sans.
const SAUVEGARDE = (function () {
  const CLE = 'grand-prix-dynasty';
  const VERSION = 4;   // v4 (tour 28c) : la dynastie (carriere.js) ; une sauvegarde d'avant devient une dynastie d'une génération

  function vierge() {
    // records : le meilleur tour de chaque longueur (« 5 », « 12 », « 18 », « 0 ») ; sur un autre circuit que celui de test,
    // la clé commence par son nom (« technique-5 ») ; championnat : le championnat en cours (championnat.js), ou null
    // fantomes : le fantôme du meilleur tour de chaque circuit (fantome.js, compact), par nom de circuit ; options : les
    // réglages du joueur (fantome : le fantôme affiché, vrai par défaut) ; reaction : le meilleur temps de réaction au départ (s)
    // decouverteFaite : la course de découverte du premier lancement est jouée ; argent : l'argent du joueur (la prime de la découverte, pas encore dépensable)
    // temple : le temple de la renommée et les records de carrière (carriere.js), à côté du championnat : ils survivent à une nouvelle carrière
    return { version: VERSION, records: {}, championnat: null, fantomes: {}, options: {}, reaction: null, decouverteFaite: false, argent: 0, cartes: {}, temple: { carrieres: [], records: {} }, deux: null, tournoi: null, motifs: [], motifsAnnonce: [], aides: [], tutoriel: [] };   // tutoriel : les leçons réussies (tutoriel.js)   // aides : les aides au premier usage déjà vues (aides.js), à la racine
  }

  // une sauvegarde d'une ancienne version est transformée ici, sans rien perdre :
  // v1 → v2 : le championnat (étape 6) ; une v1 n'en a pas
  // v2 → v3 : les noms provisoires (voir plus bas) et le duel contre le coéquipier (championnat.js : completer le reconstruit)
  // v3 → v4 : la dynastie et la carrière en cours (carriere.js : completer, une génération, commencée à la saison 1) et le temple
  function migrer(d) {
    if (!d || typeof d !== 'object' || typeof d.version !== 'number' || d.version > VERSION) return vierge();
    if (!d.records || typeof d.records !== 'object') d.records = {};
    if (d.version < 2 || d.championnat === undefined) d.championnat = null;
    // v2 → v3 : les noms provisoires en français (« Pilote joueur », « Pilote 3 », « Écurie 1 ») deviennent null : le nom
    // par défaut vient de textes.js, dans la langue du joueur (un nom choisi ou inventé est gardé)
    if (d.version < 3 && d.championnat) {
      for (const p of d.championnat.pilotes || []) if (p.nom === 'Pilote joueur' || /^Pilote \d+$/.test(p.nom)) p.nom = null;
      for (const e of d.championnat.ecuries || []) if (/^Écurie \d+$/.test(e.nom)) e.nom = null;
    }
    // le fantôme, les options et le record de réaction (tour 22b) : ajoutés s'ils manquent, sans changer de version
    if (!d.fantomes || typeof d.fantomes !== 'object') d.fantomes = {};
    if (!d.options || typeof d.options !== 'object') d.options = {};
    if (typeof d.reaction !== 'number') d.reaction = null;
    // le premier lancement (tour 23b) : la découverte faite (une sauvegarde qui a déjà un championnat compte comme faite) et l'argent
    if (d.decouverteFaite === undefined) d.decouverteFaite = !!d.championnat;
    if (typeof d.argent !== 'number') d.argent = 0;
    if (!d.cartes || typeof d.cartes !== 'object') d.cartes = {};   // la carte des IA de chaque circuit en cache (cache-carte.js, tour 24b)
    if (!d.deux || typeof d.deux !== 'object') d.deux = null;
    if (!d.tournoi || typeof d.tournoi !== 'object') d.tournoi = null;
    if (!Array.isArray(d.motifs)) d.motifs = [];
    if (!Array.isArray(d.motifsAnnonce)) d.motifsAnnonce = [];   // les motifs gagnés pas encore annoncés à l'écran (une fois, au paddock)   // les motifs de casque débloqués (casque.js, tour 27b) : à la racine, ils survivent à une nouvelle carrière   // la dernière liste de joueurs du tournoi chrono et le tournoi en cours (tournoi.js, tour 26b), à part de la carrière   // les réglages et la rivalité du mode 2 joueurs (deux-joueurs.js, tour 25b), à part de la carrière
    if (!Array.isArray(d.tutoriel)) d.tutoriel = [];   // les leçons du tutoriel réussies (tutoriel.js, Codeur 4) : aucune dans une sauvegarde d'avant
    if (!Array.isArray(d.aides)) d.aides = [];   // les aides au premier usage déjà vues (aides.js, Codeur 4) : aucune dans une sauvegarde d'avant
    if (typeof CARRIERE !== 'undefined') d.temple = CARRIERE.completerTemple(d.temple);   // le temple de la renommée (tour 28c) : vide dans une sauvegarde d'avant
    // (tour 41d) un championnat abîmé (sans pilotes, sans écuries, une écurie qui n'existe pas) ne se charge pas : il ferait planter la
    // page ; il est enlevé, le reste de la sauvegarde (records, temple, motifs) est gardé, et le jeu dit qu'une nouvelle carrière commence
    if (d.championnat && !championnatLisible(d.championnat)) { d.championnat = null; perdue = true; signaler('perdue'); }
    if (d.championnat && typeof CHAMPIONNAT !== 'undefined') {
      try { CHAMPIONNAT.completer(d.championnat); } catch (e) { d.championnat = null; perdue = true; signaler('perdue'); }
    }
    d.version = VERSION;
    return d;
  }

  function championnatLisible(ch) {
    if (!ch || typeof ch !== 'object' || !Array.isArray(ch.pilotes) || !Array.isArray(ch.ecuries) || ch.pilotes.length < 2 || !ch.ecuries.length) return false;
    return ch.pilotes.every(p => p && typeof p === 'object' && Number.isInteger(p.ecurie) && p.ecurie >= 0 && p.ecurie < ch.ecuries.length) && ch.ecuries.every(e => e && typeof e === 'object');
  }

  // le championnat en cours (null s'il n'y en a pas), et son écriture après chaque course
  function championnat() {
    return lire().championnat;
  }

  function ecrireChampionnat(ch) {
    const d = lire();
    d.championnat = ch;
    return ecrire(d);
  }

  // (tour 41d, Codeur 4) le secours quand localStorage refuse (plein, interdit en navigation privée ou dans une iframe) : la sauvegarde
  // du jeu, et rien d'autre, dans window.name, qui survit aux rechargements du même onglet (la création du pilote, « Course suivante »
  // rechargent la page : sans lui, la carrière repartait au premier lancement, en boucle) ; vidé dès que localStorage remarche.
  // perdue : une sauvegarde illisible a été remplacée par une vierge ; impossible : localStorage a refusé (le jeu le dit à l'écran)
  const SECOURS = 'grand-prix-dynasty:';
  let perdue = false, impossible = false, avis = null;
  const signales = {};
  function signaler(type) { if (signales[type]) return; signales[type] = true; if (avis) avis(type); }
  // l'écran s'abonne (principal.js) : f('perdue') ou f('impossible'), une fois chacun ; ce qui est arrivé avant l'abonnement est rejoué
  function surAvis(f) { avis = f; for (const type of ['perdue', 'impossible']) if (signales[type]) f(type); }
  function secours() {
    try { return typeof window !== 'undefined' && typeof window.name === 'string' && window.name.startsWith(SECOURS) ? window.name.slice(SECOURS.length) : null; } catch (e) { return null; }
  }
  function viderSecours() {
    try { if (secours() !== null) window.name = ''; } catch (e) { /* rien */ }
  }

  function lire() {
    let texte = null;
    try { texte = localStorage.getItem(CLE); } catch (e) { impossible = true; signaler('impossible'); }
    const s = secours();
    if (s !== null) texte = s;   // (le secours n'est écrit que quand localStorage a refusé : il est plus récent)
    if (!texte) return vierge();
    try {
      const d = JSON.parse(texte), ok = d && typeof d === 'object' && typeof d.version === 'number' && d.version <= VERSION;
      const m = migrer(d);
      if (!ok) { perdue = true; signaler('perdue'); }
      return m;
    } catch (e) {
      perdue = true; signaler('perdue');
      return vierge();
    }
  }

  function ecrire(d) {
    const json = JSON.stringify(d);
    try {
      localStorage.setItem(CLE, json);
      viderSecours();
      return true;
    } catch (e) {
      impossible = true; signaler('impossible');
      try { window.name = SECOURS + json; } catch (e2) { /* rien */ }
      return false;
    }
  }

  function cle(nbTours, circuit) {
    return !circuit || circuit === 'test' ? String(nbTours) : circuit + '-' + nbTours;
  }

  function record(nbTours, circuit) {
    const r = lire().records[cle(nbTours, circuit)];
    return typeof r === 'number' ? r : null;
  }

  // garde le temps s'il bat le record ; renvoie true si c'est un nouveau record
  function proposerRecord(nbTours, temps, circuit) {
    if (temps === null) return false;
    const d = lire(), ancien = d.records[cle(nbTours, circuit)];
    if (typeof ancien === 'number' && ancien <= temps) return false;
    d.records[cle(nbTours, circuit)] = temps;
    ecrire(d);
    return true;
  }

  // --- le fantôme du meilleur tour (fantome.js), un par circuit
  function fantome(circuit) {
    const f = lire().fantomes[circuit || 'test'];
    return FANTOME.valide(f) ? f : null;
  }

  // garde ce fantôme compact s'il bat l'ancien (FANTOME.bat : jamais un tour coupé, ni un temps égal ou plus lent) ;
  // renvoie true si c'est le nouveau record du circuit
  function proposerFantome(circuit, f, coupe) {
    const d = lire(), cle = circuit || 'test';
    if (!FANTOME.bat(d.fantomes[cle], f && f.temps, coupe)) return false;
    d.fantomes[cle] = f;
    ecrire(d);
    return true;
  }

  // --- les options du joueur (le fantôme affiché ou masqué, …)
  function option(nom, defaut) {
    const o = lire().options[nom];
    return o === undefined ? defaut : o;
  }

  function ecrireOption(nom, valeur) {
    const d = lire();
    d.options[nom] = valeur;
    return ecrire(d);
  }

  // --- le record du temps de réaction au départ (depart.js) : gardé s'il est meilleur ; renvoie true si c'est un record
  function reaction() {
    return lire().reaction;
  }

  function proposerReaction(t) {
    if (typeof t !== 'number' || !(t > 0)) return false;
    const d = lire();
    if (typeof d.reaction === 'number' && d.reaction <= t) return false;
    d.reaction = t;
    ecrire(d);
    return true;
  }

  // --- le premier lancement (decouverte.js) : la découverte faite, et l'argent
  function decouverteFaite() {
    return lire().decouverteFaite === true;
  }

  function argent() {
    return lire().argent;
  }

  // la découverte jouée : la prime s'ajoute à l'argent, et elle ne revient plus
  function finirDecouverte(prime) {
    const d = lire();
    d.decouverteFaite = true;
    d.argent += Math.max(0, prime || 0);
    return ecrire(d);
  }

  // --- la carte des IA d'un circuit en cache (cache-carte.js) : le cache compact, par nom de circuit
  function carte(nom) {
    const c = lire().cartes[nom];
    return c && typeof c === 'object' ? c : null;
  }

  function ecrireCarte(nom, cache) {
    const d = lire();
    d.cartes[nom] = cache;
    return ecrire(d);
  }

  // --- le mode 2 joueurs (deux-joueurs.js) : ses derniers réglages et le score de la rivalité, à part de la carrière (rien d'autre
  // n'est touché : ni le championnat, ni les records, ni les fantômes)
  function deux() {
    return lire().deux;
  }

  function ecrireDeux(r) {
    const d = lire();
    d.deux = r;
    return ecrire(d);
  }

  // --- le temple de la renommée et les records de carrière (carriere.js) : la carrière finie y entre une seule fois
  // (ch.retraite.temple garde son numéro d'entrée), en même temps que le championnat est écrit ; renvoie sa place (ou null)
  function temple() {
    const d = lire();
    return d.temple || { carrieres: [], records: {} };
  }

  function entrerAuTemple(ch) {
    if (!ch || !ch.retraite) return null;
    const d = lire();
    if (ch.retraite.temple === undefined) ch.retraite.temple = CARRIERE.entrer(d.temple, CARRIERE.resume(ch));
    d.championnat = ch;
    ecrire(d);
    return CARRIERE.place(d.temple, ch.retraite.temple);
  }

  // --- le tournoi chrono (tournoi.js) : { joueurs (la dernière liste), formule, enCours (le tournoi qui se joue, ou null) }, à part
  // de la carrière ; jamais de fantôme (ils restent en mémoire, le temps d'une manche)
  function tournoi() {
    return lire().tournoi;
  }

  function ecrireTournoi(r) {
    const d = lire();
    d.tournoi = r;
    return ecrire(d);
  }

  // --- les motifs de casque débloqués (casque.js) : à la racine de la sauvegarde, ils survivent à une nouvelle carrière ; renvoie
  // les motifs nouveaux (pas encore débloqués)
  function motifs() {
    return lire().motifs.slice();
  }

  function debloquerMotifs(liste) {
    const d = lire(), nouveaux = (liste || []).filter(m => !d.motifs.includes(m));
    if (!nouveaux.length) return [];
    d.motifs.push(...nouveaux);
    d.motifsAnnonce.push(...nouveaux);
    ecrire(d);
    return nouveaux;
  }

  // les motifs gagnés à annoncer, une seule fois : la liste est rendue puis vidée
  function prendreAnnonceMotifs() {
    const d = lire(), l = d.motifsAnnonce.slice();
    if (!l.length) return [];
    d.motifsAnnonce = [];
    ecrire(d);
    return l;
  }

  // --- les aides au premier usage (aides.js) : la liste des aides déjà vues, à la racine (elle survit à une nouvelle carrière)
  function aides() {
    return lire().aides.slice();
  }

  function ecrireAides(liste) {
    const d = lire();
    d.aides = Array.from(liste || []);
    return ecrire(d);
  }

  // --- le tutoriel guidé (tutoriel.js) : les leçons réussies, à la racine (une étoile chacune, elles survivent à une nouvelle carrière)
  function tutoriel() {
    return lire().tutoriel.slice();
  }

  function reussirLecon(id) {
    const d = lire();
    if (d.tutoriel.includes(id)) return false;
    d.tutoriel.push(id);
    return ecrire(d);
  }

  return { perdue: () => perdue, impossible: () => impossible, surAvis, tutoriel, reussirLecon, aides, ecrireAides, motifs, debloquerMotifs, prendreAnnonceMotifs, tournoi, ecrireTournoi, deux, ecrireDeux, temple, entrerAuTemple, lire, ecrire, record, proposerRecord, championnat, ecrireChampionnat, fantome, proposerFantome, option, ecrireOption, reaction, proposerReaction, decouverteFaite, argent, finirDecouverte, carte, ecrireCarte, VERSION, CLE };
})();
