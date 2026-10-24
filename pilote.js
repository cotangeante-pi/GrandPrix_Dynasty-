// La création du pilote (étape 6, CLAUDE.md « La carrière du joueur » et « Le Grand Prix à domicile »), en calcul pur :
// le nom, le numéro (libre, pas celui d'un rival), le pays (PAYS, donnees.js ; les noms par texte('pays_<code>')) et la
// course de cœur (un des 12 circuits ; si le pays du joueur a un circuit, CIRCUITS_PAYS, c'est son Grand Prix à domicile,
// choisi d'office). Le choix est écrit dans le pilote du joueur du championnat (championnat.js : pilotes[j]) et passe par
// la sauvegarde unique. Le casque viendra dans un autre tour. L'écran est dans interface.js.
const PILOTE = (function () {
  const R = REGLAGES;

  // le pilote du joueur dans le championnat
  function joueur(ch) {
    return ch.pilotes.find(p => p.humain) || null;
  }

  // la création est-elle encore à faire ? (un championnat d'avant la création du pilote n'a pas de pays)
  function manque(ch) {
    const j = joueur(ch);
    return !!j && (typeof j.pays !== 'string' || typeof j.coeur !== 'string');
  }

  // le circuit du pays (son Grand Prix à domicile), ou null si le pays n'en a pas
  function domicile(pays) {
    for (const [circuit, p] of Object.entries(R.CIRCUITS_PAYS)) if (p === pays) return circuit;
    return null;
  }

  // ce numéro est-il libre ? (1 à 99, entier, et pas celui d'un rival)
  function numeroLibre(ch, numero) {
    if (!Number.isInteger(numero) || numero < R.NUMERO_MIN || numero > R.NUMERO_MAX) return false;
    return !ch.pilotes.some(p => !p.humain && p.numero === numero);
  }

  // le nom nettoyé : sans espaces autour, NOM_LONGUEUR_MAX caractères au plus ; vide → null (le nom par défaut de textes.js)
  function nettoyerNom(nom) {
    const n = String(nom === undefined || nom === null ? '' : nom).trim().slice(0, R.NOM_LONGUEUR_MAX).trim();
    return n === '' ? null : n;
  }

  // les choix du joueur { nom, numero, pays, coeur } vérifiés : renvoie { ok, erreurs: ['numero' | 'pays' | 'coeur'…], choix }
  // (choix : les valeurs nettoyées, la course de cœur imposée par le pays s'il a un circuit)
  function valider(ch, choix) {
    const erreurs = [];
    const numero = Number(choix.numero);
    if (!numeroLibre(ch, numero)) erreurs.push('numero');
    const pays = typeof choix.pays === 'string' && R.PAYS.includes(choix.pays) ? choix.pays : null;
    if (!pays) erreurs.push('pays');
    const maison = pays ? domicile(pays) : null;
    const coeur = maison || (typeof choix.coeur === 'string' && Object.prototype.hasOwnProperty.call(R.CIRCUITS_PAYS, choix.coeur) ? choix.coeur : null);
    if (!coeur) erreurs.push('coeur');
    return { ok: erreurs.length === 0, erreurs, choix: { nom: nettoyerNom(choix.nom), numero, pays, coeur, domicile: !!maison } };
  }

  // écrit les choix validés dans le pilote du joueur (le nom et le numéro remplacent « Toi » / n°20 partout) ; renvoie le pilote
  function appliquer(ch, choix) {
    const j = joueur(ch);
    if (!j) return null;
    j.nom = choix.nom; j.numero = choix.numero; j.pays = choix.pays; j.coeur = choix.coeur;
    return j;
  }

  return { joueur, manque, domicile, numeroLibre, nettoyerNom, valider, appliquer };
})();
