// Les écrans des batailles en ligne (tour 56, T5 ; CLAUDE.md « Les batailles en ligne ») : « En ligne » (créer ou rejoindre une salle), « rejoindre par
// code » (4 lettres sans voyelle, au clavier ou avec les gros boutons), la salle d'attente (les joueurs, prêt, l'hôte choisit circuit / tours /
// météo / IA, des émotes PRÉRÉGLÉES : jamais de texte libre, pas de nom tapé : « Pilote » + la couleur choisie, EN_LIGNE_NOMS_LIBRES faux).
// Tout est derrière EN_LIGNE (donnees.js, faux par défaut : aucun bouton, le jeu d'avant ; ?enligne=1 l'ouvre) ; ce fichier ne touche ni la
// course ni la physique.
//
// Le TRANSPORT (la seule chose dont ce fichier a besoin du réseau) : un objet { envoyer(msg), sur(f(msg)), fermer() } qui parle le protocole du
// Chef (messages JSON : creer, rejoindre, pret, lancer, emote, quitter côté client ; salle, refus, joueurs, depart, emote, parti, nouvel-hote côté
// serveur). Tant que reseau.js (T4) n'est pas là, ENLIGNE_ECRAN.fabrique donne le faux (enligne-faux.js, en mémoire). Un transport qui perd la
// connexion peut livrer le message local { t: 'coupure' } : l'écran dit « La connexion a été perdue » et revient au menu.
//
//   ENLIGNE_ECRAN.preparer({ aller(ecran), retour(), depart(msg) })   // les rappels de principal.js
//   ENLIGNE_ECRAN.ouvrir()          // le menu « En ligne »
//   ENLIGNE_ECRAN.echap()           // Échap / B de la manette : un pas en arrière (quitte la salle si on y est)
//   ENLIGNE_ECRAN.etat()            // pour les tests : { ecran, code, moi, hote, joueurs, reglages }
const ENLIGNE_ECRAN = (function () {
  const R = REGLAGES;
  const $ = id => document.getElementById(id);
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  let rappels = { aller: () => {}, retour: () => {}, depart: () => {} };
  let transport = null, ecran = 'enligne', code = '', moi = null, hote = false, joueurs = [], note = '', emotes = {}, prochaineEmote = 0;
  let reglages = null, pretMoi = false, minuterieNote = null;
  const api = { fabrique: () => ENLIGNE_FAUX.creer() };

  const nomDe = id => texte('enligneNom').replace('{c}', texte('enligneCouleur_' + id));
  const couleurDeNom = nom => R.EN_LIGNE_COULEURS.find(c => nomDe(c.id) === nom) || null;
  function couleurChoisie() {
    const i = Number(SAUVEGARDE.option('enligne_couleur', 0));
    return Number.isInteger(i) && i >= 0 && i < R.EN_LIGNE_COULEURS.length ? i : 0;
  }
  const nomChoisi = () => nomDe(R.EN_LIGNE_COULEURS[couleurChoisie()].id);
  const bouton = (id, f) => { const b = $(id); b.tabIndex = 0; b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', f); return b; };
  const vide = el => { el.textContent = ''; return el; };

  // --- le menu ---
  function majMenu() {
    $('enligneTitre').textContent = texte('enligneTitre');
    $('enligneExplication').textContent = texte('enligneExplication');
    $('boutonEnligneCreer').textContent = texte('enligneCreer');
    $('boutonEnligneRejoindre').textContent = texte('enligneRejoindre');
    $('boutonEnligneRetour').textContent = texte('enligneRetour');
    $('enligneNomChoisi').textContent = texte('enligneNomChoisi').replace('{nom}', nomChoisi());
    const boite = vide($('enligneCouleurs'));
    boite.setAttribute('aria-label', texte('enligneCouleur'));
    R.EN_LIGNE_COULEURS.forEach((c, i) => {
      const b = document.createElement('button');
      b.tabIndex = 0; b.className = 'enlignePastille' + (i === couleurChoisie() ? ' choisie' : ''); b.style.background = hex(c.hex);
      b.setAttribute('aria-label', texte('enligneCouleur') + ' : ' + texte('enligneCouleur_' + c.id)); b.title = texte('enligneCouleur_' + c.id);
      b.setAttribute('aria-pressed', i === couleurChoisie() ? 'true' : 'false');
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => { SAUVEGARDE.ecrireOption('enligne_couleur', i); majMenu(); });
      boite.appendChild(b);
    });
  }
  const dire = (id, t) => { $(id).textContent = t || ''; };

  // --- la connexion ---
  function ouvrirTransport() {
    fermerTransport();
    transport = api.fabrique();
    const celui = transport;
    transport.sur(m => { if (transport === celui) recevoir(m); });
    return transport;
  }
  function fermerTransport() { if (transport) { try { transport.fermer(); } catch (e) { /* déjà fermé */ } } transport = null; }
  function remiseAZero() { fermerTransport(); code = ''; moi = null; hote = false; joueurs = []; note = ''; emotes = {}; reglages = null; pretMoi = false; clearTimeout(minuterieNote); }

  function creer() {
    if (ecran !== 'enligne') return;
    dire('enligneMessage', texte('enligneConnexion'));
    ouvrirTransport().envoyer({ t: 'creer', nom: nomChoisi(), version: R.EN_LIGNE_VERSION });
  }
  function rejoindre() {
    if (ecran !== 'enligneRejoindre') return;
    const c = $('enligneCode').value;
    if (c.length < R.EN_LIGNE_CODE_LONGUEUR) { dire('enligneRejoindreMessage', texte('enligneCodeCourt')); return; }
    dire('enligneRejoindreMessage', texte('enligneConnexion'));
    ouvrirTransport().envoyer({ t: 'rejoindre', code: c, nom: nomChoisi(), version: R.EN_LIGNE_VERSION });
  }

  function recevoir(m) {
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'salle') {
      code = String(m.code || ''); moi = m.toi; hote = m.hote === true || m.hote === m.toi; joueurs = []; pretMoi = false; emotes = {};
      reglages = Object.assign({}, R.EN_LIGNE_REGLAGES_DEFAUT);
      ecran = 'enligneSalle'; rappels.aller('enligneSalle'); majSalle();
      if (hote) envoyerReglages();   // (l'hôte dit tout de suite son choix : les invités le voient)
    } else if (m.t === 'refus') {
      fermerTransport();
      const t = texte('enligneRefus_' + m.raison) || texte('enligneCoupure');
      dire(ecran === 'enligneRejoindre' ? 'enligneRejoindreMessage' : 'enligneMessage', t);
    } else if (m.t === 'coupure') {
      const dans = ecran === 'enligneSalle';
      remiseAZero();
      if (dans) { ecran = 'enligne'; rappels.aller('enligne'); majMenu(); }
      dire(ecran === 'enligneRejoindre' ? 'enligneRejoindreMessage' : 'enligneMessage', texte('enligneCoupure'));
    } else if (ecran !== 'enligneSalle') return;
    else if (m.t === 'joueurs' && Array.isArray(m.liste)) {
      joueurs = m.liste.filter(j => j && typeof j.nom === 'string');
      const lui = joueurs.find(j => j.id === moi);
      if (lui) { hote = !!lui.hote; pretMoi = !!lui.pret; }
      majSalle();
    } else if (m.t === 'reglages') {
      if (!hote && m.reglages && typeof m.reglages === 'object') { for (const x of regles()) if (m.reglages[x.cle] !== undefined && (x.cle === 'nbIA' ? Number.isInteger(m.reglages[x.cle]) : x.valeurs.includes(m.reglages[x.cle]))) reglages[x.cle] = m.reglages[x.cle]; majSalle(); }
    } else if (m.t === 'parti') {
      const j = joueurs.find(x => x.id === m.id);
      if (j) dirNote(texte('enligneParti').replace('{nom}', j.nom));
    } else if (m.t === 'nouvel-hote') {
      if (m.id === moi) { hote = true; dirNote(texte('enligneNouvelHote')); }
      majSalle();
    } else if (m.t === 'emote') montrerEmote(m.de, m.i);
    else if (m.t === 'depart') { dirNote(texte('enligneDepart')); rappels.depart(m); }
  }

  function dirNote(t) { note = t; majSalle(); clearTimeout(minuterieNote); minuterieNote = setTimeout(() => { note = ''; if (ecran === 'enligneSalle') majSalle(); }, 4000); }

  // --- « rejoindre par code » ---
  function majRejoindre() {
    $('enligneRejoindreTitre').textContent = texte('enligneRejoindreTitre');
    $('enligneCode').placeholder = '· · · ·';
    $('enligneCode').setAttribute('aria-label', texte('enligneCodeAide'));
    $('boutonEnligneGo').textContent = texte('enligneGo');
    $('boutonEnligneRejoindreRetour').textContent = texte('enligneRetour');
    const clavier = vide($('enligneClavier'));
    for (const l of R.EN_LIGNE_LETTRES) {
      const b = document.createElement('button');
      b.tabIndex = 0; b.className = 'enligneTouche'; b.textContent = l;
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => taper(l));
      clavier.appendChild(b);
    }
    const eff = document.createElement('button');
    eff.tabIndex = 0; eff.className = 'enligneTouche enligneEffacer'; eff.textContent = texte('enligneEffacer'); eff.setAttribute('aria-label', texte('enligneEffacer'));
    eff.addEventListener('mousedown', e => e.preventDefault());
    eff.addEventListener('click', () => { const c = $('enligneCode'); c.value = c.value.slice(0, -1); dire('enligneRejoindreMessage', ''); });
    clavier.appendChild(eff);
  }
  const filtrer = t => String(t).toUpperCase().split('').filter(l => R.EN_LIGNE_LETTRES.includes(l)).join('').slice(0, R.EN_LIGNE_CODE_LONGUEUR);
  function taper(l) { const c = $('enligneCode'); c.value = filtrer(c.value + l); dire('enligneRejoindreMessage', ''); }

  // --- la salle d'attente ---
  function circuitsPermis() { const l = R.EN_LIGNE_CIRCUITS_CHOIX.filter(c => CIRCUITS[c]); return l.length ? l : Object.keys(CIRCUITS); }
  function iaPermis() { return R.EN_LIGNE_IA_CHOIX.filter(n => n + Math.max(joueurs.length, 1) <= R.EN_LIGNE_JOUEURS_MAX); }
  const regles = () => [
    { cle: 'circuit', libelle: 'enligneCircuit', valeurs: circuitsPermis(), nom: v => texte('circuit_' + v) || v },
    { cle: 'tours', libelle: 'enligneTours', valeurs: R.EN_LIGNE_TOURS_CHOIX, nom: v => String(v) },
    { cle: 'meteo', libelle: 'enligneMeteo', valeurs: R.EN_LIGNE_METEO_CHOIX, nom: v => texte('enligneMeteo_' + v) },
    { cle: 'nbIA', libelle: 'enligneIA', valeurs: iaPermis(), nom: v => String(v) },
  ];
  function valeurReglage(r) {   // la valeur courante, ramenée dans la liste permise (moins de places = moins d'IA)
    const l = r.valeurs, v = reglages[r.cle];
    if (l.includes(v)) return v;
    if (r.cle === 'nbIA') return l.length ? l[l.length - 1] : 0;
    return l[0];
  }
  function changerReglage(cle, sens) {
    if (!hote || !reglages) return;
    const r = regles().find(x => x.cle === cle), l = r.valeurs;
    if (!l.length) return;
    const i = Math.max(0, l.indexOf(valeurReglage(r)));
    reglages[cle] = l[(i + sens + l.length) % l.length];
    envoyerReglages();
    majSalle();
  }
  function envoyerReglages() { if (!hote || !transport || !reglages) return; const r = {}; for (const x of regles()) r[x.cle] = valeurReglage(x); transport.envoyer({ t: 'reglages', reglages: r }); }
  function tousPrets() { return joueurs.length >= 2 && joueurs.every(j => j.hote || j.pret); }

  function majSalle() {
    if (ecran !== 'enligneSalle') return;
    $('enligneSalleNom').textContent = texte('enligneSalle');
    $('enligneSalleCode').textContent = code;
    $('enligneJoueursTitre').textContent = texte('enligneJoueurs').replace('{n}', joueurs.length).replace('{max}', R.EN_LIGNE_JOUEURS_MAX);
    const ul = vide($('enligneListe'));
    for (const j of joueurs) {
      const li = document.createElement('li');
      li.dataset.id = String(j.id);
      if (j.id === moi) li.className = 'moi';
      const pastille = document.createElement('i'); const c = couleurDeNom(j.nom);
      pastille.className = 'pastille'; pastille.style.background = c ? hex(c.hex) : '#8a8f9c';
      const nom = document.createElement('span'); nom.className = 'nom'; nom.textContent = j.nom + (j.id === moi ? ' (' + texte('enligneToi') + ')' : '');
      const etat = document.createElement('span'); etat.className = 'etat';
      etat.textContent = j.hote ? '★ ' + texte('enligneHote') : j.pret ? '✔ ' + texte('enlignePret') : '… ' + texte('enlignePasPret');
      li.append(pastille, nom, etat);
      const e = emotes[j.id];
      if (e) { const s = document.createElement('span'); s.className = 'emote'; s.textContent = R.EN_LIGNE_EMOTES[e.i] || ''; s.setAttribute('role', 'img'); s.setAttribute('aria-label', texte('enligneEmote_' + e.i)); li.appendChild(s); }
      ul.appendChild(li);
    }
    // les réglages : l'hôte les choisit (◀ valeur ▶), les autres lisent « L'hôte choisit la course »
    $('enligneReglagesTitre').textContent = texte('enligneReglages');
    $('enligneHoteChoisit').textContent = hote ? '' : texte('enligneHoteChoisit');
    const zone = vide($('enligneRegles'));
    if (reglages) for (const r of regles()) {
      const ligne = document.createElement('div'); ligne.className = 'regle'; ligne.dataset.cle = r.cle;
      const l = document.createElement('span'); l.className = 'libelle'; l.textContent = texte(r.libelle);
      const moins = document.createElement('button'), val = document.createElement('strong'), plus = document.createElement('button');
      moins.tabIndex = plus.tabIndex = 0; moins.className = plus.className = 'enligneFleche';
      moins.textContent = '◀'; plus.textContent = '▶'; moins.setAttribute('aria-label', '◀ ' + texte(r.libelle)); plus.setAttribute('aria-label', texte(r.libelle) + ' ▶');
      val.textContent = r.valeurs.length ? r.nom(valeurReglage(r)) : '–';
      for (const [b, s] of [[moins, -1], [plus, 1]]) { b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', () => changerReglage(r.cle, s)); }
      if (hote) ligne.append(l, moins, val, plus); else { ligne.classList.add('lecture'); ligne.append(l, val); }
      zone.appendChild(ligne);
    }
    // les émotes
    const boite = vide($('enligneEmotes'));
    boite.setAttribute('aria-label', texte('enligneEmotes'));
    R.EN_LIGNE_EMOTES.forEach((e, i) => {
      const b = document.createElement('button');
      b.tabIndex = 0; b.className = 'enligneEmote'; b.textContent = e; b.title = texte('enligneEmote_' + i); b.setAttribute('aria-label', texte('enligneEmote_' + i));
      b.addEventListener('mousedown', ev => ev.preventDefault());
      b.addEventListener('click', () => envoyerEmote(i));
      boite.appendChild(b);
    });
    // les boutons : l'hôte lance, les autres se déclarent prêts
    const lancer = $('boutonEnligneLancer'), pret = $('boutonEnlignePret');
    lancer.classList.toggle('cache', !hote); pret.classList.toggle('cache', hote);
    lancer.textContent = texte('enligneLancer'); lancer.disabled = !tousPrets();
    pret.textContent = texte(pretMoi ? 'enlignePretAnnuler' : 'enlignePretBouton'); pret.classList.toggle('actif', pretMoi);
    $('boutonEnligneQuitter').textContent = texte('enligneQuitter');
    $('enligneSalleMessage').textContent = note || (joueurs.length < 2 ? texte('enligneAttenteAmi') : tousPrets() ? texte('enligneLancerPret') : texte('enligneAttentePrets'));
  }

  function basculerPret() { if (ecran !== 'enligneSalle' || hote || !transport) return; transport.envoyer({ t: 'pret', pret: !pretMoi }); pretMoi = !pretMoi; majSalle(); }
  function lancer() {
    if (ecran !== 'enligneSalle' || !hote || !transport || !tousPrets()) return;
    const r = {}; for (const x of regles()) r[x.cle] = valeurReglage(x);
    transport.envoyer({ t: 'lancer', reglages: r });
  }
  function envoyerEmote(i) {
    const maintenant = performance.now();
    if (ecran !== 'enligneSalle' || !transport || !(i >= 0 && i < R.EN_LIGNE_EMOTES.length) || maintenant < prochaineEmote) return;
    prochaineEmote = maintenant + R.EN_LIGNE_EMOTE_PAUSE * 1000;
    transport.envoyer({ t: 'emote', i });
    montrerEmote(moi, i);
    for (const b of $('enligneEmotes').children) b.disabled = true;
    setTimeout(() => { if (ecran === 'enligneSalle') for (const b of $('enligneEmotes').children) b.disabled = false; }, R.EN_LIGNE_EMOTE_PAUSE * 1000);
  }
  function montrerEmote(id, i) {
    if (!(Number.isInteger(i) && i >= 0 && i < R.EN_LIGNE_EMOTES.length) || !joueurs.some(j => j.id === id)) return;   // un indice inconnu (jamais de texte) est ignoré
    const e = { i }; emotes[id] = e;
    majSalle();
    setTimeout(() => { if (emotes[id] === e) { delete emotes[id]; if (ecran === 'enligneSalle') majSalle(); } }, R.EN_LIGNE_EMOTE_DUREE * 1000);
  }
  function quitterSalle() {
    if (transport) { try { transport.envoyer({ t: 'quitter' }); } catch (e) { /* rien */ } }
    remiseAZero(); aller('enligne');
  }

  // --- aller d'un écran à l'autre ---
  function aller(e) {
    ecran = e;
    rappels.aller(e);
    if (e === 'enligne') { dire('enligneMessage', ''); majMenu(); }
    else if (e === 'enligneRejoindre') { dire('enligneRejoindreMessage', ''); $('enligneCode').value = ''; majRejoindre(); if (!window.matchMedia('(pointer: coarse)').matches) $('enligneCode').focus(); }
    else majSalle();
  }
  api.ouvrir = function () { remiseAZero(); aller('enligne'); };
  api.echap = function () {
    if (ecran === 'enligneSalle') quitterSalle();
    else if (ecran === 'enligneRejoindre') aller('enligne');
    else { remiseAZero(); rappels.retour(); }
  };
  api.actif = () => typeof JEU !== 'undefined' && (JEU.ecran === 'enligne' || JEU.ecran === 'enligneRejoindre' || JEU.ecran === 'enligneSalle');

  api.preparer = function (r) {
    rappels = Object.assign(rappels, r);
    bouton('boutonEnligneCreer', creer); bouton('boutonEnligneRejoindre', () => aller('enligneRejoindre')); bouton('boutonEnligneRetour', () => api.echap());
    bouton('boutonEnligneGo', rejoindre); bouton('boutonEnligneRejoindreRetour', () => aller('enligne'));
    bouton('boutonEnlignePret', basculerPret); bouton('boutonEnligneLancer', lancer); bouton('boutonEnligneQuitter', quitterSalle);
    const champ = $('enligneCode');
    champ.addEventListener('input', () => { champ.value = filtrer(champ.value); dire('enligneRejoindreMessage', ''); });
    champ.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); rejoindre(); } });
    if (window.matchMedia('(pointer: coarse)').matches) champ.readOnly = true;   // au doigt : les gros boutons, pas le clavier du téléphone (il cacherait la moitié de l'écran)
    // les entrées : le titre et le paddock (cachées tant que EN_LIGNE est faux)
    const titre = $('boutonEnligneTitre'), paddock = $('boutonEnlignePaddock');
    titre.textContent = texte('enligneBouton'); paddock.querySelector('.menuNom').textContent = texte('enligneMenu'); paddock.title = texte('enligneMenu'); paddock.setAttribute('aria-label', texte('enligneMenu'));
    for (const b of [titre, paddock]) { b.classList.toggle('cache', !R.EN_LIGNE); b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', () => rappels.ouvrir && rappels.ouvrir()); }
  };
  api.etat = () => ({ ecran, code, moi, hote, joueurs: joueurs.slice(), reglages: reglages && Object.assign({}, reglages), pret: pretMoi, note, connecte: !!transport });
  return api;
})();
