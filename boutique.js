// La boutique de skins (CLAUDE.md « La personnalisation », tour 48c) : une seule boutique pour les livrées, les casques et les
// célébrations (SKINS, donnees.js). Chaque skin s'obtient d'UNE façon : l'argent du jeu (le solde du championnat, argent.js), une pub
// (📺 rewardedBreak de sdk.js : débloque pour toujours) ou une récompense de carrière (elle ne s'achète pas). Un skin ne change que
// le look, jamais la vitesse. Les skins obtenus sont à la racine de la sauvegarde (SAUVEGARDE.skins : ils survivent à une nouvelle carrière).
// Le calcul (l'état d'un skin, l'achat, les récompenses gagnées) est pur ; rendre(conteneur, etat, actions) dessine la boutique dans
// n'importe quel conteneur (aujourd'hui un écran à part ouvert depuis le garage ; demain la page « Boutique » du paddock).
const BOUTIQUE = (function () {
  const R = REGLAGES;
  const TYPES = ['livree', 'casque', 'celebration'];

  function skin(id) {
    return R.SKINS.find(s => s.id === id) || null;
  }
  function liste(type) {
    return R.SKINS.filter(s => !type || s.type === type);
  }
  // le skin d'un type pour un motif (« or » est une livrée ET un casque : le type départage)
  function deMotif(type, motif) {
    return R.SKINS.find(s => s.type === type && s.motif === motif) || null;
  }

  // l'état d'un skin pour le joueur : 'possede', 'argent' (à acheter), 'pub' (une pub le donne), 'bloque' (une récompense pas encore gagnée)
  // possedes : les identifiants obtenus ; ch : le championnat en cours (les exploits), ou null
  function etat(id, possedes, ch) {
    const s = skin(id);
    if (!s) return null;
    if ((possedes || []).includes(id)) return 'possede';
    if (s.obtention === 'recompense') return 'bloque';
    return s.obtention;
  }

  // les récompenses gagnées par la carrière en cours et pas encore obtenues (les mêmes exploits que les motifs de casque)
  function recompensesGagnees(ch, possedes) {
    const f = typeof CASQUE !== 'undefined' ? CASQUE.faits(ch) : {};
    return R.SKINS.filter(s => s.obtention === 'recompense' && f[s.condition] && !(possedes || []).includes(s.id)).map(s => s.id);
  }

  // l'achat d'un skin à l'argent : { ok, raison } (raison : 'inconnu', 'possede', 'pasArgent' (il s'obtient autrement), 'solde') ; le
  // solde du championnat est débité, jamais de dette ; l'appelant garde le skin (SAUVEGARDE.obtenirSkin) et sauvegarde le championnat
  function acheter(ch, id, possedes) {
    const s = skin(id);
    if (!s) return { ok: false, raison: 'inconnu' };
    if ((possedes || []).includes(id)) return { ok: false, raison: 'possede' };
    if (s.obtention !== 'argent') return { ok: false, raison: 'pasArgent' };
    if (!ch || !ARGENT.debiter(ch, s.prix)) return { ok: false, raison: 'solde' };
    return { ok: true, raison: null };
  }

  // un skin se met à l'essai ? (une livrée, un casque ou une célébration qu'on n'a pas encore, et qu'on peut obtenir : pas une récompense)
  function essayable(id, possedes) {
    const s = skin(id);
    return !!s && s.obtention !== 'recompense' && !(possedes || []).includes(id);
  }

  // les mots
  function nom(s) {
    return texte(s.type === 'livree' ? 'livree_' + s.motif : s.type === 'casque' ? 'motif_' + s.motif : 'celebration_' + s.motif);
  }
  function conditionTexte(s) {
    return texte('cond_' + s.condition).replace('{n}', s.condition === 'legende' ? R.SKIN_LEGENDE_TITRES : R.SKIN_VICTOIRES);
  }

  // --- l'écran (DOM) : e = { onglet (type), possedes, ch (ou null), solde (ou null), message, couleur (celle de l'écurie), casque (celui du
  // joueur), numero, pays } ; actions = { onglet(type), acheter(id), pub(id), essayer(id) }. Tout est redessiné à chaque appel
  const ICONES = { poing: '✊', drapeau: '🏁', donuts: '🍩', saut: '🦘', confettis: '🎊', feux: '🎆', toupie: '🌀', trophee: '🏆' };
  function rendre(conteneur, e, actions) {
    const el = (balise, classe, txt) => { const x = document.createElement(balise); if (classe) x.className = classe; if (txt !== undefined) x.textContent = txt; return x; };
    const bouton = (txt, classe, f) => { const b = el('button', classe, txt); b.tabIndex = -1; b.addEventListener('mousedown', ev => ev.preventDefault()); b.addEventListener('click', f); return b; };
    conteneur.textContent = '';
    conteneur.classList.add('boutiqueVue');
    conteneur.append(el('h1', 'boutiqueTitre', texte('boutiqueTitre')));
    conteneur.append(el('p', 'boutiqueSolde', e.solde === null || e.solde === undefined ? texte('boutiqueSansCarriere') : texte('boutiqueSolde').replace('{s}', ARGENT.formater(e.solde))));
    const onglets = el('div', 'boutiqueOnglets');
    for (const t of TYPES) { const b = bouton(texte('boutique_' + t), 'onglet' + (t === e.onglet ? ' choisi' : ''), () => actions.onglet(t)); b.dataset.type = t; onglets.append(b); }
    conteneur.append(onglets);
    const grille = el('ul', 'boutiqueListe');
    for (const s of liste(e.onglet)) {
      const li = el('li', 'skin'), st = etat(s.id, e.possedes, e.ch);
      li.dataset.id = s.id; li.dataset.etat = st;
      const apercu = el('span', 'apercu');
      if (s.type === 'livree') apercu.append(LIVREE.icone(LIVREE.pourVoiture(e.couleur, LIVREE.creer(s.motif, 0xffffff), e.numero, false, e.pays), 96, 34));
      else if (s.type === 'casque') apercu.append(CASQUE.icone(CASQUE.creer(s.motif, e.casque ? e.casque.couleurs : R.CASQUE_NEUTRE.couleurs), 34));
      else apercu.textContent = ICONES[s.motif] || '★';
      li.append(apercu, el('span', 'nom', nom(s)));
      const actionsSkin = el('span', 'actions');
      if (st === 'possede') actionsSkin.append(el('span', 'possede', texte('boutiquePossede')));
      else if (st === 'bloque') actionsSkin.append(el('span', 'condition', texte('boutiqueRecompense').replace('{c}', conditionTexte(s))));
      else {
        if (st === 'argent') { const b = bouton(texte('boutiqueAcheter').replace('{p}', ARGENT.formater(s.prix)), 'acheter', () => actions.acheter(s.id)); b.disabled = !(e.solde >= s.prix); actionsSkin.append(b); }
        else actionsSkin.append(bouton(texte('boutiquePub'), 'pub', () => actions.pub(s.id)));
        if (essayable(s.id, e.possedes) && actions.essayer) actionsSkin.append(bouton(texte('boutiqueEssayer'), 'essayer', () => actions.essayer(s.id)));
      }
      li.append(actionsSkin);
      grille.append(li);
    }
    conteneur.append(grille);
    conteneur.append(el('p', 'boutiqueMessage', e.message || ''));
  }

  return { TYPES, skin, liste, deMotif, etat, recompensesGagnees, acheter, essayable, nom, conditionTexte, rendre };
})();
