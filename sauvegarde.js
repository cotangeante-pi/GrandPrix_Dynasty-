// La sauvegarde : un seul module, une seule clé dans localStorage, avec un numéro de version.
// localStorage peut manquer ou refuser (navigation privée, Poki dans une iframe) : tout passe par try/catch,
// et le jeu marche sans.
const SAUVEGARDE = (function () {
  const CLE = 'grand-prix-dynasty';
  const VERSION = 1;

  function vierge() {
    // records : le meilleur tour de chaque longueur (« 5 », « 12 », « 18 », « 0 ») ; sur un autre circuit que celui de test,
    // la clé commence par son nom (« technique-5 »)
    return { version: VERSION, records: {} };
  }

  // une sauvegarde d'une ancienne version est transformée ici (aucune pour l'instant)
  function migrer(d) {
    if (!d || typeof d !== 'object' || typeof d.version !== 'number' || d.version > VERSION) return vierge();
    if (!d.records || typeof d.records !== 'object') d.records = {};
    d.version = VERSION;
    return d;
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

  return { lire, record, proposerRecord, VERSION, CLE };
})();
