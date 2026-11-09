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

  // le pays qui va avec la langue du navigateur (« fr-CA » → ca, « en-US » → us, « fr » → fr) : la région si elle est dans PAYS, sinon la
  // langue (PILOTE_LANGUE_PAYS), sinon le premier de PAYS
  function paysDeLangue(langue) {
    const [l, region] = String(langue || '').toLowerCase().split(/[-_]/);
    const r = region === 'uk' ? 'gb' : region;
    if (r && R.PAYS.includes(r)) return r;
    const p = R.PILOTE_LANGUE_PAYS[l];
    return p && R.PAYS.includes(p) ? p : R.PAYS[0];
  }

  // un tirage dans [0, n[ avec hasard() (la suite semée des tests, sinon Math.random)
  const tirage = n => Math.min(n - 1, Math.floor(hasard() * n));

  // « trois pilotes prêts » (le premier lancement, après la découverte) : PILOTE_PROPOSITIONS cartes { nom (null : « Toi »), numero (libre),
  // pays (celui du navigateur), coeur (le circuit du pays, sinon un circuit tiré), casque (tiré, jamais celui d'un autre pilote du monde) }
  // La première s'appelle « Toi », les autres ont un prénom générique tiré (jamais celui d'un rival du monde) ; chaque carte est valide pour valider()
  function propositions(ch, langue) {
    const pays = paysDeLangue(langue), maison = domicile(pays);
    const rivaux = new Set(ch.pilotes.filter(p => !p.humain && typeof p.nom === 'string').map(p => p.nom.toLowerCase()));
    const noms = R.PILOTE_PRENOMS.filter(n => !rivaux.has(n.toLowerCase()));
    const numeros = [];
    for (let n = R.NUMERO_MIN; n <= R.NUMERO_MAX; n++) if (numeroLibre(ch, n)) numeros.push(n);
    const circuits = Object.keys(R.CIRCUITS_PAYS), prises = new Set(ch.pilotes.filter(p => CASQUE.valide(p.casque)).map(p => CASQUE.cle(p.casque)));
    const cartes = [];
    for (let i = 0; i < R.PILOTE_PROPOSITIONS; i++) {
      const nom = i === 0 || !noms.length ? null : noms.splice(tirage(noms.length), 1)[0];
      const numero = numeros.length ? numeros.splice(tirage(numeros.length), 1)[0] : R.NUMERO_MIN;
      const coeur = maison || circuits[tirage(circuits.length)];
      cartes.push({ nom, numero, pays, coeur, casque: CASQUE.tirer(prises) || CASQUE.neutre() });
    }
    return cartes;
  }

  return { paysDeLangue, propositions, joueur, manque, domicile, numeroLibre, nettoyerNom, valider, appliquer };
})();
