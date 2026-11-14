// Le FAUX transport des batailles en ligne (tour 56, T5) : un petit « serveur » en mémoire qui parle le protocole fixé par le Chef
// (CLAUDE.md « Les batailles en ligne »), pour que les écrans (enligne-ecran.js) marchent et se testent AVANT le vrai réseau (reseau.js, T4).
// Rien ne sort de la page. Aucune simulation de course ici : seulement les salles.
//
//   const t = ENLIGNE_FAUX.creer();   // un transport : la même interface que le vrai
//   t.sur(message => …)               // les messages « serveur → client » (asynchrones, dans l'ordre)
//   t.envoyer({ t: 'creer', nom, version })   // les messages « client → serveur »
//   t.fermer()
//
// ENLIGNE_FAUX.auto (vrai par défaut) : dans la salle créée, un ami « arrive » après EN_LIGNE_FAUX_DELAI s puis se déclare prêt ; dans la salle
// 'BCDF', l'hôte (un faux ami) lance la course quand tout le monde est prêt. Les tests le coupent (auto = false) et pilotent à la main
// (ajouterAmi, pretAmi). Salles toutes faites : 'BCDF' (existe, 1 ami), 'GHJK' (pleine), 'LMNP' (course commencée) ; les autres codes : « inconnue ».
// (Le hasard d'ici ne sert qu'à tirer un code de salle : jamais dans une simulation de course.)
const ENLIGNE_FAUX = (function () {
  const R = REGLAGES;
  let salles = new Map(), suivant = 1;
  const api = { auto: true };

  const nomDe = id => id;   // (D1) le nom sur le fil est l'id d'une couleur (« rouge », « rouge-2 »)
  const codeAuHasard = () => { let c; do { c = ''; for (let i = 0; i < R.EN_LIGNE_CODE_LONGUEUR; i++) c += R.EN_LIGNE_LETTRES[Math.floor(Math.random() * R.EN_LIGNE_LETTRES.length)]; } while (salles.has(c)); return c; };

  function salle(code, hote, commencee) {
    const s = { code, joueurs: [], commencee: !!commencee, hote: null, reglages: null };
    salles.set(code, s);
    return s;
  }
  // un faux ami de plus dans la salle (une couleur libre) ; renvoie son joueur
  function ami(s, pret) {
    const pris = new Set(s.joueurs.map(j => j.nom));
    const c = R.EN_LIGNE_COULEURS.find(x => !pris.has(nomDe(x.id)));
    if (!c) return null;
    const j = { id: suivant++, nom: nomDe(c.id), pret: !!pret, hote: s.joueurs.length === 0, faux: true };
    s.joueurs.push(j);
    if (j.hote) s.hote = j.id;
    return j;
  }
  const liste = s => s.joueurs.map(j => ({ id: j.id, nom: j.nom, pret: j.pret, hote: j.id === s.hote }));
  const diffuser = (s, msg, sauf) => { for (const j of s.joueurs) if (j.transport && j !== sauf) j.transport.livrer(msg); };

  function initialiser() {
    salles = new Map(); suivant = 1;
    const a = salle('BCDF'); a.reglages = { circuit: 'technique', tours: 5, meteo: 'pluie', nbIA: 3 }; ami(a, true); ami(a, false);   // l'hôte est prêt, un autre ami pas encore
    const p = salle('GHJK'); for (let i = 0; i < R.EN_LIGNE_JOUEURS_MAX; i++) ami(p, true);
    const c = salle('LMNP', null, true); ami(c, true); ami(c, true);
  }
  initialiser();
  api.reinitialiser = initialiser;
  api.salle = code => salles.get(code) || null;

  function creer() {
    const ecoute = [];
    const t = { ouvert: true, moi: null, salle: null };
    const livrer = msg => setTimeout(() => { if (t.ouvert) for (const f of ecoute) f(JSON.parse(JSON.stringify(msg))); }, 0);   // un « réseau » : asynchrone, dans l'ordre, une copie
    t.livrer = livrer;
    t.sur = f => { ecoute.push(f); };
    t.fermer = () => { quitter(); t.ouvert = false; };

    function entrer(s, nom) {
      const j = { id: suivant++, nom, pret: false, hote: false, transport: t };
      if (!s.joueurs.length) s.hote = j.id;
      s.joueurs.push(j); t.moi = j; t.salle = s;
      livrer({ t: 'salle', code: s.code, toi: j.id, hote: s.hote === j.id });
      if (s.reglages && s.hote !== j.id) livrer({ t: 'reglages', reglages: s.reglages });
      diffuser(s, { t: 'joueurs', liste: liste(s) });
    }
    function quitter() {
      const s = t.salle, j = t.moi;
      if (!s || !j) return;
      s.joueurs = s.joueurs.filter(x => x !== j); t.salle = null; t.moi = null;
      if (!s.joueurs.length) { salles.delete(s.code); return; }   // une salle vide disparaît (les salles toutes faites gardent leurs faux amis)
      if (!s.joueurs.some(x => x.transport)) { s.hote = s.joueurs[0].id; s.commencee = false; return; }   // (plus d'humain : la salle toute faite revient à son état de départ)
      diffuser(s, { t: 'parti', id: j.id });
      if (s.hote === j.id) { s.hote = s.joueurs[0].id; diffuser(s, { t: 'nouvel-hote', id: s.hote }); }
      diffuser(s, { t: 'joueurs', liste: liste(s) });
    }
    function nomLibre(s, nom) { return !s.joueurs.some(x => x.nom === nom); }

    t.envoyer = function (m) {
      if (!t.ouvert || !m) return;
      const s = t.salle;
      if (m.t === 'creer') {
        if (m.version !== R.EN_LIGNE_VERSION) return livrer({ t: 'refus', raison: 'version' });
        const nouvelle = salle(codeAuHasard());
        entrer(nouvelle, m.nom);
        if (api.auto) setTimeout(() => { if (!t.salle || t.salle !== nouvelle) return; const a = ami(nouvelle, false); if (!a) return; diffuser(nouvelle, { t: 'joueurs', liste: liste(nouvelle) });
          setTimeout(() => { if (t.salle !== nouvelle || !nouvelle.joueurs.includes(a)) return; a.pret = true; diffuser(nouvelle, { t: 'joueurs', liste: liste(nouvelle) }); }, R.EN_LIGNE_FAUX_DELAI * 1000); }, R.EN_LIGNE_FAUX_DELAI * 1000);
      } else if (m.t === 'rejoindre') {
        const x = salles.get(String(m.code || '').toUpperCase());
        if (m.version !== R.EN_LIGNE_VERSION) return livrer({ t: 'refus', raison: 'version' });
        if (!x) return livrer({ t: 'refus', raison: 'inconnue' });
        if (x.commencee) return livrer({ t: 'refus', raison: 'commencee' });
        if (x.joueurs.length >= R.EN_LIGNE_JOUEURS_MAX) return livrer({ t: 'refus', raison: 'pleine' });
        if (!nomLibre(x, m.nom)) return livrer({ t: 'refus', raison: 'nom' });
        entrer(x, m.nom);
        // dans une salle toute faite, l'hôte lance la course dès que tout le monde est prêt (auto)
        if (api.auto && x.code === 'BCDF') { const faux = x.joueurs.filter(j => j.faux); for (const f of faux) f.pret = true; }
      } else if (s && m.t === 'pret') {
        t.moi.pret = !!m.pret; diffuser(s, { t: 'joueurs', liste: liste(s) });
        if (api.auto && s.code === 'BCDF' && s.joueurs.every(j => j.pret)) setTimeout(() => api.lancerHote(s.code), R.EN_LIGNE_FAUX_DELAI * 1000);
      } else if (s && m.t === 'reglages') {
        if (s.hote === t.moi.id && !s.commencee && m.reglages && typeof m.reglages === 'object') { s.reglages = m.reglages; diffuser(s, { t: 'reglages', reglages: m.reglages }, t.moi); }
      } else if (s && m.t === 'lancer') {
        if (s.hote !== t.moi.id || s.commencee) return;
        api.depart(s, m.reglages);
      } else if (s && m.t === 'emote') {
        if (Number.isInteger(m.i) && m.i >= 0 && m.i < R.EN_LIGNE_EMOTES.length) diffuser(s, { t: 'emote', de: t.moi.id, i: m.i }, t.moi);
      } else if (m.t === 'quitter') quitter();
      else if (m.t === 'ping') livrer({ t: 'pong', h: m.h });
    };
    return t;
  }

  // le départ d'une salle (le serveur tire la graine ; ici une graine fixe : c'est un faux)
  api.depart = function (s, reglages) {
    s.commencee = true;
    diffuser(s, { t: 'depart', reglages: reglages || R.EN_LIGNE_REGLAGES_DEFAUT, graine: 12345, ordre: s.joueurs.map(j => j.id) });
  };
  // l'hôte d'une salle (un faux ami) lance la course
  api.lancerHote = function (code) { const s = salles.get(code); if (s && !s.commencee) api.depart(s, R.EN_LIGNE_REGLAGES_DEFAUT); };
  // pour les tests : un ami de plus (prêt ou non), un ami qui change d'état, un qui part, une émote reçue
  api.ajouterAmi = function (code, pret) { const s = salles.get(code); if (!s) return null; const j = ami(s, pret); if (j) diffuser(s, { t: 'joueurs', liste: liste(s) }); return j; };
  api.pretAmi = function (code, id, pret) { const s = salles.get(code), j = s && s.joueurs.find(x => x.id === id); if (!j) return; j.pret = pret; diffuser(s, { t: 'joueurs', liste: liste(s) }); };
  api.partirAmi = function (code, id) {
    const s = salles.get(code), j = s && s.joueurs.find(x => x.id === id); if (!j) return;
    s.joueurs = s.joueurs.filter(x => x !== j); diffuser(s, { t: 'parti', id });
    if (s.hote === id && s.joueurs.length) { s.hote = s.joueurs[0].id; diffuser(s, { t: 'nouvel-hote', id: s.hote }); }
    diffuser(s, { t: 'joueurs', liste: liste(s) });
  };
  api.emoteAmi = function (code, id, i) { const s = salles.get(code); if (s) diffuser(s, { t: 'emote', de: id, i }); };
  api.creer = creer;
  return api;
})();
