// La sauvegarde : un seul module, une seule clé dans localStorage, avec un numéro de version.
// localStorage peut manquer ou refuser (navigation privée, Poki dans une iframe) : tout passe par try/catch,
// et le jeu marche sans.
const SAUVEGARDE = (function () {
  const CLE = 'grand-prix-dynasty';
  const VERSION = 3;

  function vierge() {
    // records : le meilleur tour de chaque longueur (« 5 », « 12 », « 18 », « 0 ») ; sur un autre circuit que celui de test,
    // la clé commence par son nom (« technique-5 ») ; championnat : le championnat en cours (championnat.js), ou null
    // fantomes : le fantôme du meilleur tour de chaque circuit (fantome.js, compact), par nom de circuit ; options : les
    // réglages du joueur (fantome : le fantôme affiché, vrai par défaut) ; reaction : le meilleur temps de réaction au départ (s)
    return { version: VERSION, records: {}, championnat: null, fantomes: {}, options: {}, reaction: null };
  }

  // une sauvegarde d'une ancienne version est transformée ici, sans rien perdre :
  // v1 → v2 : le championnat (étape 6) ; une v1 n'en a pas ; v2 → v3 : les noms provisoires (voir plus bas)
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
    d.version = VERSION;
    return d;
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

  function lire() {
    try {
      const texte = localStorage.getItem(CLE);
      return texte ? migrer(JSON.parse(texte)) : vierge();
    } catch (e) {
      return vierge();
    }
  }

  function ecrire(d) {
    try {
      localStorage.setItem(CLE, JSON.stringify(d));
      return true;
    } catch (e) {
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

  return { lire, ecrire, record, proposerRecord, championnat, ecrireChampionnat, fantome, proposerFantome, option, ecrireOption, reaction, proposerReaction, VERSION, CLE };
})();
