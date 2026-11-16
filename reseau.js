// Le client réseau des batailles en ligne (tour 56, T4). UNE interface, trois transports, le même protocole (voir CLAUDE.md, « Les batailles en ligne ») :
//   - « websocket » : vers le relais (serveur/relais.py) à l'adresse REGLAGES.EN_LIGNE_URL ;
//   - « diffusion » : un BroadcastChannel, pour jouer à plusieurs onglets du même navigateur sans serveur (l'onglet qui crée la salle fait le relais) ;
//   - « memoire »   : tout dans la page, pour les tests (un monde partagé, la file des messages se vide à la main ou toute seule).
// Rien ici ne touche à la simulation : ce fichier n'envoie et ne reçoit que des messages JSON. Math.random ne sert qu'aux codes de salle et aux
// identifiants d'onglet (jamais à la course : la graine de la course est tirée par le relais et envoyée dans « depart »).
//
// Utilisation :
//   const r = RESEAU.client({ transport: 'memoire', monde });          // ou 'diffusion', ou 'websocket' (url dans REGLAGES.EN_LIGNE_URL)
//   r.sur('joueurs', liste => …);  await r.ouvrir();  r.creer('Éclair Rouge');  // puis r.rejoindre(code, nom), r.pret(true), r.lancer({...}), r.cmd(n, c)…
// Événements : etat ({etat}), salle, refus ({raison}), joueurs ({liste}), depart, cmd, controle, emote, parti, nouvel-hote, pong,
//   latence ({ms}), reconnecte, perdu (la connexion est perdue pour de bon), erreur ({raison}).
const RESEAU = (function () {
  const R = REGLAGES;
  const CONSONNES = 'BCDFGHJKLMNPQRSTVWXZ';      // pas de voyelle (ni Y) : le code ne forme jamais un mot
  const TYPES_CLIENT = ['creer', 'rejoindre', 'pret', 'reglages', 'charge', 'lancer', 'retour', 'cmd', 'controle', 'emote', 'quitter', 'ping'];

  // ---------------------------------------------------------------- les noms (jamais de texte libre devant des enfants)
  // D1 : le nom qui voyage est neutre de langue : l'id d'une couleur de EN_LIGNE_COULEURS (« rouge »), suivi de « -2 » à « -8 » quand la couleur est déjà
  // prise dans la salle (le relais choisit le suffixe) ; chaque client affiche le nom traduit (« Pilote rouge » / « Red driver »). EN_LIGNE_NOMS_LIBRES
  // vrai (plus tard) : des lettres, des chiffres, des espaces.
  function nomAutorise(nom) {
    if (typeof nom !== 'string') return false;
    if (R.EN_LIGNE_NOMS_LIBRES) { const n = nom.trim(); return !!n && n.length <= R.EN_LIGNE_NOM_MAX && /^[\p{L}\p{N} _-]+$/u.test(n); }
    const m = /^([a-z]+)(?:-([2-8]))?$/.exec(nom);
    return !!m && Array.isArray(R.EN_LIGNE_COULEURS) && R.EN_LIGNE_COULEURS.some(c => c && c.id === m[1]);
  }
  // un nom permis tiré au hasard
  function nomAuHasard(hasard) {
    const h = hasard || Math.random;
    return R.EN_LIGNE_COULEURS[Math.floor(h() * R.EN_LIGNE_COULEURS.length) % R.EN_LIGNE_COULEURS.length].id;
  }

  // D3 : une seule source des bornes d'une course, le cœur (EN_LIGNE.reglagesValides : circuit connu, tours ≤ EN_LIGNE_TOURS_MAX, météo de EN_LIGNE_METEOS, IA ≤
  // EN_LIGNE_IA_MAX et voitures ≤ EN_LIGNE_VOITURES_MAX) ; des réglages qu'il faudrait corriger sont refusés, pas corrigés. → les réglages, ou null
  function reglagesAccepte(g, nbJoueurs) {
    if (!g || typeof g !== 'object') return null;
    if (typeof EN_LIGNE === 'undefined' || !EN_LIGNE.reglagesValides) return typeof g.circuit === 'string' && g.circuit && typeof g.meteo === 'string' && Number.isInteger(g.tours) && g.tours >= 1 && Number.isInteger(g.nbIA) && g.nbIA >= 0
      ? { circuit: g.circuit, tours: g.tours, meteo: g.meteo, nbIA: g.nbIA } : null;
    const c = EN_LIGNE.reglagesValides(g, nbJoueurs);
    return c.circuit === g.circuit && c.tours === g.tours && c.meteo === g.meteo && c.nbIA === g.nbIA ? c : null;
  }
  // D4 : la version = EN_LIGNE_VERSION + l'empreinte des réglages de la course (le cœur) : deux jeux qui ne calculent pas la même course ne jouent pas ensemble
  function versionLocale() {
    if (typeof EN_LIGNE !== 'undefined' && EN_LIGNE.version) { const v = EN_LIGNE.version(); return v.v + '-' + v.h; }
    return String(R.EN_LIGNE_VERSION);
  }
  // D5 : les commandes et les empreintes qui voyagent : un tableau de 1 à 128 entiers de 0 à 16383 ; une empreinte entière de 32 bits ou une chaîne de 64 signes au plus
  const commandesValides = c => Array.isArray(c) && c.length >= 1 && c.length <= 128 && c.every(x => Number.isInteger(x) && x >= 0 && x <= 16383);
  const empreinteValide = h => (Number.isInteger(h) && h >= 0 && h <= 4294967295) || (typeof h === 'string' && h.length > 0 && h.length <= 64);

  // ---------------------------------------------------------------- le relais (le rôle du serveur : mêmes règles que serveur/relais.py)
  // Sans transport : connecter(sortie) donne une connexion { id, recevoir(msg), fermer() } ; sortie(msg) reçoit ce que le relais lui dit.
  function creerRelais(opt) {
    opt = opt || {};
    const hasard = opt.hasard || Math.random, salles = new Map();
    const max = opt.max || R.EN_LIGNE_JOUEURS_MAX, min = opt.min || R.EN_LIGNE_JOUEURS_MIN;
    // la grâce (EN_LIGNE_GRACE s) : un joueur dont la connexion tombe garde sa place (même id, même rôle d'hôte, aucun « parti » pour les autres) et peut
    // se rattacher avec le jeton de sa salle : le rechargement de la page sur le bon circuit, une coupure courte
    const grace = opt.grace === undefined ? R.EN_LIGNE_GRACE : opt.grace;
    const horloge = opt.horloge || { delai: (f, ms) => setTimeout(f, ms), annuler: id => clearTimeout(id) };
    let suivant = 1;
    const relais = { salles, rejets: 0 };
    function jetonNouveau() { let j = ''; for (let i = 0; i < 12; i++) j += Math.floor(hasard() * 36).toString(36); return j; }

    function codeNouveau() {
      for (let essai = 0; essai < 1000; essai++) {
        let c = '';
        for (let i = 0; i < 4; i++) c += CONSONNES[Math.floor(hasard() * CONSONNES.length) % CONSONNES.length];
        if (!salles.has(c)) return c;
      }
      return null;
    }
    const entier = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
    const env = (conn, m) => { if (conn.ouverte) conn.sortie(m); };
    function diffuser(salle, m, sauf) { for (const j of salle.joueurs) if (j !== sauf) env(j, m); }
    function liste(salle) { return salle.joueurs.map(j => { const x = { id: j.id, nom: j.nom, pret: j.pret, hote: j === salle.hote }; if (j.circuit !== undefined) x.circuit = j.circuit; if (j.absent) x.absent = true; return x; }); }
    function annoncer(salle) { diffuser(salle, { t: 'joueurs', liste: liste(salle) }); }
    const nomValide = nomAutorise;

    function retirer(conn) {
      const salle = conn.salle;
      if (!salle) return;
      if (conn.minuteur !== null && conn.minuteur !== undefined) { horloge.annuler(conn.minuteur); conn.minuteur = null; }
      conn.absent = false; conn.salle = null; conn.pret = false; conn.circuit = undefined;
      salle.joueurs.splice(salle.joueurs.indexOf(conn), 1);
      if (!salle.joueurs.length) { salles.delete(salle.code); return; }
      diffuser(salle, { t: 'parti', id: conn.id });
      if (salle.hote === conn) { salle.hote = salle.joueurs[0]; diffuser(salle, { t: 'nouvel-hote', id: salle.hote.id }); }
      annoncer(salle);
    }
    function entrer(conn, salle, nom) {
      conn.salle = salle; conn.nom = nom.trim(); conn.pret = false;
      salle.joueurs.push(conn);
      conn.jeton = jetonNouveau();
      env(conn, { t: 'salle', code: salle.code, toi: conn.id, hote: salle.hote.id, jeton: conn.jeton, nom: conn.nom });
      annoncer(salle);
      if (salle.reglages) env(conn, { t: 'reglages', reglages: salle.reglages });     // ceux déjà choisis par l'hôte
    }

    // la couleur est prise : « rouge-2 » à « rouge-8 » (R.EN_LIGNE_NOMS_LIBRES vrai : un nom pris reste refusé)
    function nomLibre(salle, nom) {
      const pris = new Set(salle.joueurs.map(j => j.nom.toLowerCase()));
      if (!pris.has(nom.toLowerCase())) return nom;
      if (R.EN_LIGNE_NOMS_LIBRES) return null;
      const base = nom.replace(/-[2-8]$/, '');
      if (!pris.has(base)) return base;
      for (let k = 2; k <= 8; k++) if (!pris.has(base + '-' + k)) return base + '-' + k;
      return null;
    }
    function reprendre(conn, s, idx) {
      const ancien = s.joueurs[idx];
      if (ancien.minuteur !== null && ancien.minuteur !== undefined) { horloge.annuler(ancien.minuteur); ancien.minuteur = null; }
      conn.id = ancien.id; conn.dernierN = ancien.dernierN; conn.nom = ancien.nom; conn.pret = ancien.pret; conn.circuit = ancien.circuit; conn.jeton = ancien.jeton; conn.absent = false; conn.salle = s;
      s.joueurs[idx] = conn;
      if (s.hote === ancien) s.hote = conn;
      ancien.ouverte = false; ancien.salle = null; ancien.absent = false;
      env(conn, { t: 'salle', code: s.code, toi: conn.id, hote: s.hote.id, jeton: conn.jeton, nom: conn.nom });
      annoncer(s);
      if (s.reglages) env(conn, { t: 'reglages', reglages: s.reglages });
      if (s.commencee && s.depart) env(conn, s.depart);
    }

    function recevoir(conn, m) {
      if (!conn.ouverte) return;
      if (!m || typeof m !== 'object' || typeof m.t !== 'string' || !TYPES_CLIENT.includes(m.t)) { relais.rejets++; return; }
      const salle = conn.salle;
      switch (m.t) {
        case 'ping': env(conn, { t: 'pong', h: m.h }); return;
        case 'creer':
          if (salle) return;
          if (!nomValide(m.nom)) return env(conn, { t: 'refus', raison: 'nom' });
          if (typeof m.version !== 'string' || !m.version || m.version.length > 64) return env(conn, { t: 'refus', raison: 'version' });
          { const code = codeNouveau();
            if (!code) return env(conn, { t: 'refus', raison: 'pleine' });
            const s = { code, joueurs: [], hote: conn, commencee: false, version: m.version };
            salles.set(code, s); entrer(conn, s, m.nom); }
          return;
        case 'rejoindre': {
          if (salle) return;
          const s = typeof m.code === 'string' ? salles.get(m.code.trim().toUpperCase()) : null;
          if (!s) return env(conn, { t: 'refus', raison: 'inconnue' });
          if (m.version !== s.version) return env(conn, { t: 'refus', raison: 'version' });   // D4 : celle du créateur de la salle
          if (typeof m.jeton === 'string' && m.jeton) {      // la reprise : le même joueur revient (rechargement, coupure courte)
            const idx = s.joueurs.findIndex(j => j.jeton === m.jeton && typeof m.nom === 'string' && j.nom.toLowerCase() === m.nom.trim().toLowerCase());
            if (idx >= 0) { reprendre(conn, s, idx); return; }
          }
          if (s.commencee) return env(conn, { t: 'refus', raison: 'commencee' });
          if (s.joueurs.length >= max) return env(conn, { t: 'refus', raison: 'pleine' });
          if (!nomValide(m.nom)) return env(conn, { t: 'refus', raison: 'nom' });
          { const nom = nomLibre(s, m.nom);
            if (!nom) return env(conn, { t: 'refus', raison: 'pleine' });
            entrer(conn, s, nom); }
          return;
        }
        default:
      }
      if (!salle) { relais.rejets++; return; }
      switch (m.t) {
        case 'quitter': retirer(conn); return;
        case 'charge':             // le circuit chargé dans la page du joueur : le lancement attend que tous aient celui des réglages
          if (typeof m.circuit !== 'string' || !m.circuit || m.circuit.length > 40) return;
          conn.circuit = m.circuit; annoncer(salle); return;
        case 'pret':
          if (salle.commencee || typeof m.pret !== 'boolean') return;
          conn.pret = m.pret; annoncer(salle); return;
        case 'reglages': {         // l'hôte seul, avant le lancement : tout le monde les voit, et les suivants à leur arrivée
          if (conn !== salle.hote || salle.commencee) return;
          const g = reglagesAccepte(m.reglages, salle.joueurs.length);
          if (!g) { env(conn, { t: 'erreur', raison: 'reglages' }); return; }   // D3
          salle.reglages = g; diffuser(salle, { t: 'reglages', reglages: g });
          return;
        }
        case 'lancer': {
          if (conn !== salle.hote || salle.commencee || salle.joueurs.length < min) return;
          const g = reglagesAccepte(m.reglages, salle.joueurs.length);
          if (!g) { env(conn, { t: 'erreur', raison: 'reglages' }); return; }   // D3
          if (salle.joueurs.some(j => j.absent || (j.circuit !== undefined && j.circuit !== g.circuit))) { env(conn, { t: 'erreur', raison: 'charge' }); return; }
          salle.commencee = true;
          const graine = Math.floor(hasard() * 4294967296) >>> 0;
          for (const j of salle.joueurs) j.dernierN = undefined;
          salle.depart = { t: 'depart', reglages: g, graine, ordre: salle.joueurs.map(j => j.id) };
          diffuser(salle, salle.depart);
          return;
        }
        case 'retour':             // l'hôte, après la course : la salle se rouvre, les « prêt » repartent à faux
          if (conn !== salle.hote || !salle.commencee) return;
          salle.commencee = false;
          for (const j of salle.joueurs) { j.pret = false; j.dernierN = undefined; }
          diffuser(salle, { t: 'retour' }); annoncer(salle);
          return;
        case 'cmd':          // D5 : des commandes bien formées, et un pas qui avance
          if (!salle.commencee) return;
          if (!entier(m.n, 0, 1e9) || !commandesValides(m.c) || (conn.dernierN !== undefined && m.n <= conn.dernierN)) { relais.rejets++; return; }
          conn.dernierN = m.n;
          diffuser(salle, { t: 'cmd', de: conn.id, n: m.n, c: m.c }, conn); return;
        case 'controle':
          if (!salle.commencee) return;
          if (!entier(m.n, 0, 1e9) || !empreinteValide(m.h)) { relais.rejets++; return; }
          diffuser(salle, { t: 'controle', de: conn.id, n: m.n, h: m.h }, conn); return;
        case 'emote':
          if (!entier(m.i, 0, R.EN_LIGNE_EMOTES.length - 1)) return;
          diffuser(salle, { t: 'emote', de: conn.id, i: m.i }, conn); return;
        default:
      }
    }

    relais.connecter = function (sortie) {
      const conn = { id: suivant++, nom: null, salle: null, pret: false, ouverte: true, sortie, vu: null };
      conn.recevoir = m => recevoir(conn, m);
      conn.minuteur = null;
      conn.fermer = () => {         // la connexion est tombée (pas un « quitter » : celui-là retire tout de suite)
        conn.ouverte = false;
        if (conn.salle && grace > 0) {
          conn.absent = true; annoncer(conn.salle);
          conn.minuteur = horloge.delai(() => { conn.minuteur = null; if (conn.absent) retirer(conn); }, grace * 1000);
        } else retirer(conn);
      };
      return conn;
    };
    relais.aSalle = code => typeof code === 'string' && salles.has(code.trim().toUpperCase());
    return relais;
  }

  // ---------------------------------------------------------------- les transports : { ouvrir(rx, ferme) -> Promise, envoyer(msg), fermer() }

  // un monde en mémoire : un relais et une file de messages. auto : la file se vide toute seule (au prochain micro-créneau) ; sinon vider() à la main.
  function monde(opt) {
    opt = opt || {};
    const m = { relais: creerRelais(opt.relais), file: [], auto: opt.auto !== false, liens: new Set(), livres: 0 };
    m.planifier = f => { m.file.push(f); if (m.auto) Promise.resolve().then(m.vider); };
    m.vider = () => { let n = 0; while (m.file.length) { m.file.shift()(); n++; } m.livres += n; return n; };
    m.couperTous = () => { for (const l of Array.from(m.liens)) l.couper(); };
    return m;
  }
  function transportMemoire(m) {
    let lien = null;
    return {
      immediat: true,
      ouvrir(rx, ferme) {
        return new Promise(res => {
          const l = lien = { ouvert: true };
          l.conn = m.relais.connecter(msg => { const s = JSON.stringify(msg); m.planifier(() => { if (l.ouvert) rx(JSON.parse(s)); }); });
          l.couper = () => { if (!l.ouvert) return; l.ouvert = false; m.liens.delete(l); l.conn.fermer(); ferme(); };
          m.liens.add(l); res();
        });
      },
      envoyer(msg) {
        const l = lien, s = JSON.stringify(msg);
        if (l && l.ouvert) m.planifier(() => { if (l.ouvert) l.conn.recevoir(JSON.parse(s)); });
      },
      fermer() { if (lien && lien.ouvert) { if (lien.conn.salle) lien.conn.recevoir({ t: 'quitter' }); lien.ouvert = false; m.liens.delete(lien); lien.conn.fermer(); } },   // (« quitter » d'abord : une fermeture voulue ne garde pas de place)
      couper() { if (lien) lien.couper(); },     // pour les tests : une coupure du réseau
    };
  }

  // BroadcastChannel : l'onglet qui crée la salle fait le relais (tant qu'il reste ouvert). Chaque transport a son identifiant d'onglet et son canal.
  function transportDiffusion(opt) {
    opt = opt || {};
    const horloge = opt.horloge || horlogeReelle();
    const moi = 'o' + Math.random().toString(36).slice(2, 10);
    let canal = null, rx = null, ferme = null, rel = null, relais = null, local = null, attente = null, vivant = false;
    const conns = new Map();     // côté relais : onglet -> connexion
    const vus = new Map();       // côté relais : onglet -> dernier message reçu
    const poster = d => { try { canal.postMessage(d); } catch (e) { /* canal fermé */ } };
    const asynchrone = f => Promise.resolve().then(() => { if (vivant) f(); });

    function purger() {          // un onglet muet depuis trop longtemps (fermé sans prévenir) quitte sa salle
      const t = horloge.maintenant();
      for (const [src, c] of Array.from(conns)) if (t - vus.get(src) > R.EN_LIGNE_SILENCE_MS) { c.fermer(); conns.delete(src); vus.delete(src); }
    }
    function chezRelais(src, m, accueillir) {
      let c = conns.get(src);
      if (!c) {
        if (!accueillir) return;
        c = relais.connecter(msg => poster({ s: moi, a: src, m: msg }));
        conns.set(src, c);
      }
      vus.set(src, horloge.maintenant());
      purger();
      c.recevoir(m);
    }
    function surCanal(ev) {
      const d = ev.data;
      if (!vivant || !d || typeof d !== 'object') return;
      if (d.fin) { if (d.s === rel) { rel = null; ferme(); } return; }
      if (d.coupe) { if (relais && conns.has(d.s)) { conns.get(d.s).fermer(); conns.delete(d.s); vus.delete(d.s); } return; }   // un onglet qui se recharge : la grâce commence
      if (typeof d.s !== 'string' || !d.m || typeof d.m !== 'object') return;
      if (d.a === '*') {                                           // un « rejoindre » : seul le relais qui connaît la salle répond
        if (relais && d.m.t === 'rejoindre' && relais.aSalle(d.m.code)) chezRelais(d.s, d.m, true);
      } else if (d.a === moi) {
        if (relais && d.s !== moi) { if (conns.has(d.s)) chezRelais(d.s, d.m, false); return; }
        if (attente !== null) { horloge.annuler(attente); attente = null; }
        if (d.m.t === 'salle') rel = d.s;
        rx(d.m);
      }
    }
    // la page se ferme ou se recharge : ce n'est pas un « quitter » (le joueur garde sa place pendant la grâce, EN_LIGNE_GRACE) ; l'onglet du relais, lui, emporte la salle
    function lacher() {
      if (!vivant) return;
      if (relais) { poster({ fin: true, s: moi }); return; }
      if (rel) poster({ s: moi, a: rel, coupe: true });
    }
    return {
      ouvrir(rx2, ferme2) {
        return new Promise((res, rej) => {
          if (typeof BroadcastChannel === 'undefined') return rej(new Error('BroadcastChannel absent'));
          rx = rx2; ferme = ferme2; vivant = true;
          canal = new BroadcastChannel(opt.canal || R.EN_LIGNE_CANAL);
          canal.onmessage = surCanal;
          if (typeof addEventListener === 'function') addEventListener('pagehide', lacher);
          res();
        });
      },
      envoyer(msg) {
        if (!vivant) return;
        const copie = JSON.parse(JSON.stringify(msg));
        if (local) { asynchrone(() => local.recevoir(copie)); if (copie.t === 'quitter' && !relais.salles.size) { /* le relais reste : il peut resservir */ } return; }
        if (copie.t === 'creer') {
          relais = creerRelais(opt.relais);
          local = relais.connecter(m => { const c = JSON.parse(JSON.stringify(m)); asynchrone(() => rx(c)); });
          asynchrone(() => local.recevoir(copie));
        } else if (copie.t === 'rejoindre' && !rel) {
          if (attente !== null) horloge.annuler(attente);
          poster({ s: moi, a: '*', m: copie });
          attente = horloge.delai(() => { attente = null; if (vivant) rx({ t: 'refus', raison: 'inconnue' }); }, R.EN_LIGNE_ATTENTE_MS);
        } else if (rel) {
          poster({ s: moi, a: rel, m: copie });
          if (copie.t === 'quitter') rel = null;
        }
      },
      fermer: function fermer() {
        if (!vivant) return;
        vivant = false;
        if (typeof removeEventListener === 'function') removeEventListener('pagehide', lacher);
        if (attente !== null) { horloge.annuler(attente); attente = null; }
        if (relais) poster({ fin: true, s: moi });
        else if (rel) poster({ s: moi, a: rel, m: { t: 'quitter' } });
        for (const c of conns.values()) c.fermer();
        conns.clear(); if (local) local.fermer();
        try { canal.close(); } catch (e) { /* déjà fermé */ }
        canal = null; relais = null; local = null; rel = null;
      },
    };
  }

  // WebSocket vers le relais. WebSocketClasse permet de mettre un faux WebSocket dans les tests.
  function transportWebSocket(url, opt) {
    opt = opt || {};
    const horloge = opt.horloge || horlogeReelle();
    let ws = null, ouvert = false;
    return {
      ouvrir(rx, ferme) {
        return new Promise((res, rej) => {
          const WS = opt.WebSocketClasse || (typeof WebSocket !== 'undefined' ? WebSocket : null);
          if (!WS || !url) return rej(new Error('pas d’adresse de relais'));
          let fini = false, minuteur = null;
          const echec = e => { if (fini) return; fini = true; if (minuteur !== null) horloge.annuler(minuteur); try { s.close(); } catch (x) { /* rien */ } rej(e); };
          let s;
          try { s = new WS(url); } catch (e) { return rej(e); }
          ws = s;
          minuteur = horloge.delai(() => echec(new Error('délai dépassé')), R.EN_LIGNE_OUVERTURE_MS);
          s.onopen = () => { if (fini) return; fini = true; ouvert = true; horloge.annuler(minuteur); res(); };
          s.onerror = () => echec(new Error('connexion impossible'));
          s.onmessage = ev => {
            const d = ev && ev.data;
            if (typeof d !== 'string' || d.length > R.EN_LIGNE_TAILLE_MAX) return;
            let m; try { m = JSON.parse(d); } catch (e) { return; }
            if (m && typeof m === 'object' && typeof m.t === 'string') rx(m);
          };
          s.onclose = () => { if (!fini) return echec(new Error('fermée')); if (ouvert && ws === s) { ouvert = false; ferme(); } };
        });
      },
      envoyer(msg) {
        if (!ws || !ouvert) return;
        const d = JSON.stringify(msg);
        if (d.length <= R.EN_LIGNE_TAILLE_MAX) ws.send(d);
      },
      fermer() { const s = ws; ouvert = false; ws = null; if (s) try { s.close(); } catch (e) { /* rien */ } },
      couper() { if (ws) { const s = ws; if (s.onclose) s.onclose(); try { s.close(); } catch (e) { /* rien */ } } },
    };
  }

  function horlogeReelle() {
    return {
      maintenant: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      delai: (f, ms) => setTimeout(f, ms),
      annuler: id => clearTimeout(id),
    };
  }

  // ---------------------------------------------------------------- le client
  function client(opt) {
    opt = opt || {};
    const horloge = opt.horloge || horlogeReelle();
    const transport = typeof opt.transport === 'object' && opt.transport ? opt.transport
      : opt.transport === 'memoire' ? transportMemoire(opt.monde || (opt.monde = monde()))
      : opt.transport === 'diffusion' ? transportDiffusion({ horloge, canal: opt.canal, relais: opt.relais })
      : transportWebSocket(opt.url === undefined ? R.EN_LIGNE_URL : opt.url, { horloge, WebSocketClasse: opt.WebSocketClasse });
    const version = opt.version === undefined ? versionLocale() : opt.version;
    const ecouteurs = {};
    const c = { etat: 'ferme', code: null, moi: null, hote: null, joueurs: [], depart: null, jeton: null, reglagesSalle: null, latence: null, nom: null, transport, rejets: 0 };
    let volontaire = false, dernierRecu = 0, minuteurPing = null, minuteurRecon = null, essai = 0;

    function emettre(t, d) {
      if (t !== '*' && t !== 'etat' && t !== 'erreur' && t !== 'latence' && t !== 'reconnecte' && t !== 'perdu') emettre('*', Object.assign({ t }, d));
      for (const f of (ecouteurs[t] || []).slice()) {
        try { f(d); } catch (e) { if (t !== 'erreur') emettre('erreur', { raison: 'ecouteur', message: String(e && e.message || e) }); }
      }
    }
    // sur(type, f) : un type de message ; sur(f) : tous les messages (la forme { envoyer, sur, fermer } des écrans), y compris {t:'coupure'}
    c.sur = function (t, f) {
      if (typeof t === 'function') { f = t; t = '*'; }
      (ecouteurs[t] = ecouteurs[t] || []).push(f);
      return () => { const l = ecouteurs[t]; const i = l.indexOf(f); if (i >= 0) l.splice(i, 1); };
    };
    function changer(etat) { if (c.etat !== etat) { c.etat = etat; emettre('etat', { etat }); } }
    function oublierSalle() { c.jeton = null; c.reglagesSalle = null; c.code = null; c.moi = null; c.hote = null; c.joueurs = []; c.depart = null; }
    c.enSalle = () => c.code !== null;
    c.estHote = () => c.moi !== null && c.moi === c.hote;

    function recevoir(m) {
      dernierRecu = horloge.maintenant();
      switch (m.t) {
        case 'salle':
          c.code = m.code; c.moi = m.toi; c.hote = m.hote; if (typeof m.nom === 'string') c.nom = m.nom; c.depart = null; c.jeton = typeof m.jeton === 'string' ? m.jeton : null; emettre('salle', m);
          if (opt.circuit) c.charge(opt.circuit);      // « mon circuit chargé » : le lancement attend que tous aient celui des réglages
          break;
        case 'erreur': emettre('erreur', { raison: m.raison, relais: true }); break;
        case 'refus': emettre('refus', m); break;
        case 'joueurs': c.joueurs = Array.isArray(m.liste) ? m.liste : []; emettre('joueurs', m); break;
        case 'reglages': c.reglagesSalle = m.reglages; emettre('reglages', m); break;
        case 'depart': c.depart = m; emettre('depart', m); break;
        case 'retour': c.depart = null; emettre('retour', m); break;
        case 'nouvel-hote': c.hote = m.id; emettre('nouvel-hote', m); break;
        case 'pong':
          if (typeof m.h === 'number') {
            const ms = Math.max(0, horloge.maintenant() - m.h);
            c.latence = c.latence === null ? ms : c.latence * 0.7 + ms * 0.3;
            emettre('latence', { ms: c.latence });
          }
          emettre('pong', m); break;
        case 'cmd': case 'controle': case 'emote': case 'parti': emettre(m.t, m); break;
        default: c.rejets++;
      }
    }
    function surFermeture() {
      if (volontaire) return;
      stopPing();
      if (c.etat === 'ouvert') { changer('coupe'); emettre('coupure', {}); essayer(); }
    }
    function perdu() { stopPing(); changer('ferme'); emettre('perdu', {}); }
    function essayer() {
      essai++;
      if (essai > R.EN_LIGNE_RECONNEXIONS || (c.depart && c.code)) { oublierSalle(); return perdu(); }   // en pleine course, une coupure est définitive
      minuteurRecon = horloge.delai(() => {
        minuteurRecon = null;
        if (volontaire) return;
        transport.ouvrir(recevoir, surFermeture).then(() => {
          if (volontaire) return;
          const code = c.code, jeton = c.jeton; oublierSalle();
          changer('ouvert'); dernierRecu = horloge.maintenant(); essai = 0; ping_();
          emettre('reconnecte', { code });
          if (code && c.nom) c.envoyerBrut({ t: 'rejoindre', code, nom: c.nom, version, jeton });
        }, () => { if (!volontaire) essayer(); });
      }, R.EN_LIGNE_RECONNEXION_MS * essai);
    }
    function stopPing() { if (minuteurPing !== null) { horloge.annuler(minuteurPing); minuteurPing = null; } }
    function ping_() {
      if (opt.ping === false || minuteurPing !== null) return;
      minuteurPing = horloge.delai(() => {
        minuteurPing = null;
        if (c.etat !== 'ouvert') return;
        if (horloge.maintenant() - dernierRecu > R.EN_LIGNE_SILENCE_MS) {       // muet : la connexion est morte
          transport.fermer(); surFermeture(); return;
        }
        if (c.code) c.envoyerBrut({ t: 'ping', h: horloge.maintenant(), l: c.latence === null ? undefined : Math.round(c.latence) });
        ping_();
      }, R.EN_LIGNE_PING_MS);
    }

    c.ouvrir = function () {
      if (c.etat === 'ouvert') return Promise.resolve();
      volontaire = false; changer('ouverture');
      const fin = () => { changer('ouvert'); dernierRecu = horloge.maintenant(); essai = 0; ping_(); };
      const p = transport.ouvrir(recevoir, surFermeture);
      if (transport.immediat) { fin(); return Promise.resolve(); }     // la mémoire : ouvert tout de suite (les tests se lisent sans attendre)
      return p.then(fin, e => { changer('ferme'); throw e; });
    };
    c.envoyerBrut = function (m) { if (c.etat !== 'ouvert') return false; transport.envoyer(m); return true; };
    function erreur(raison) { emettre('erreur', { raison }); return false; }
    function envoyer(m) {
      if (c.etat !== 'ouvert') return erreur('ferme');
      if (!TYPES_CLIENT.includes(m.t)) return erreur('type');
      transport.envoyer(m); return true;
    }
    function refuserNom(nom) { if (nomAutorise(nom)) return false; emettre('refus', { t: 'refus', raison: 'nom' }); return true; }

    c.creer = function (nom) { if (c.code) return erreur('deja-en-salle'); if (refuserNom(nom)) return false; c.nom = nom.trim(); return envoyer({ t: 'creer', nom: c.nom, version }); };
    c.charge = function (circuit) { return c.code ? envoyer({ t: 'charge', circuit }) : erreur('pas-en-salle'); };
    c.rejoindre = function (code, nom, jeton) {
      if (c.code) return erreur('deja-en-salle');
      if (typeof code !== 'string' || !/^[A-Za-z]{4}$/.test(code.trim())) { emettre('refus', { t: 'refus', raison: 'inconnue' }); return false; }
      if (refuserNom(nom)) return false;
      c.nom = nom.trim();
      const msg = { t: 'rejoindre', code: code.trim().toUpperCase(), nom: c.nom, version };
      if (typeof jeton === 'string' && jeton) msg.jeton = jeton;
      return envoyer(msg);
    };
    c.reglages = function (g) {
      if (!c.code) return erreur('pas-en-salle');
      if (!c.estHote()) return erreur('pas-hote');
      const ok = reglagesAccepte(g, c.joueurs.length || 1);
      if (!ok) return erreur('reglages');
      return envoyer({ t: 'reglages', reglages: ok });
    };
    c.retour = function () {
      if (!c.depart) return erreur('pas-commence');
      if (!c.estHote()) return erreur('pas-hote');
      return envoyer({ t: 'retour' });
    };
    c.pret = function (p) { return c.code ? envoyer({ t: 'pret', pret: !!p }) : erreur('pas-en-salle'); };
    c.lancer = function (reglages) {
      if (!c.code) return erreur('pas-en-salle');
      if (!c.estHote()) return erreur('pas-hote');
      const ok = reglagesAccepte(reglages, c.joueurs.length || 1);
      if (!ok) return erreur('reglages');
      return envoyer({ t: 'lancer', reglages: ok });
    };
    c.envoyer = function (m) {      // l'interface générique : { t:'pret', pret:true }… (les mêmes contrôles que les méthodes)
      if (!m || typeof m !== 'object') return erreur('type');
      switch (m.t) {
        case 'creer': return c.creer(m.nom);
        case 'rejoindre': return c.rejoindre(m.code, m.nom, m.jeton);
        case 'charge': return c.charge(m.circuit);
        case 'pret': return c.pret(m.pret);
        case 'reglages': return c.reglages(m.reglages);
        case 'lancer': return c.lancer(m.reglages);
        case 'retour': return c.retour();
        case 'cmd': return c.cmd(m.n, m.c);
        case 'controle': return c.controle(m.n, m.h);
        case 'emote': return c.emote(m.i);
        case 'quitter': return c.quitter();
        case 'ping': return c.ping();
        default: return erreur('type');
      }
    };
    c.cmd = function (n, cmds) {
      if (!c.depart) return erreur('pas-commence');
      if (!Number.isInteger(n) || n < 0 || !commandesValides(cmds)) return erreur('cmd');
      return envoyer({ t: 'cmd', n, c: cmds });
    };
    c.controle = function (n, h) { return c.depart && Number.isInteger(n) && n >= 0 && empreinteValide(h) ? envoyer({ t: 'controle', n, h }) : erreur('controle'); };
    c.emote = function (i) { return c.code && Number.isInteger(i) && i >= 0 && i < R.EN_LIGNE_EMOTES.length ? envoyer({ t: 'emote', i }) : erreur('emote'); };
    c.quitter = function () { if (!c.code) return false; const ok = envoyer({ t: 'quitter' }); oublierSalle(); return ok; };
    c.ping = function () { return c.code ? envoyer({ t: 'ping', h: horloge.maintenant(), l: c.latence === null ? undefined : Math.round(c.latence) }) : false; };
    c.fermer = function () {
      volontaire = true; stopPing();
      if (minuteurRecon !== null) { horloge.annuler(minuteurRecon); minuteurRecon = null; }
      if (c.etat === 'ouvert' && c.code) transport.envoyer({ t: 'quitter' });
      transport.fermer(); oublierSalle(); changer('ferme');
    };
    return c;
  }

  // la session gardée d'une page à l'autre (sessionStorage) : le rechargement sur le bon circuit rejoint la même salle avec le même jeton
  const CLE_SESSION = 'gpd-enligne-session';
  const session = {
    ecrire(c, plus) { try { sessionStorage.setItem(CLE_SESSION, JSON.stringify(Object.assign({ code: c.code, nom: c.nom, jeton: c.jeton, moi: c.moi }, plus || {}))); return true; } catch (e) { return false; } },
    lire() {
      try {
        const x = JSON.parse(sessionStorage.getItem(CLE_SESSION));
        return x && typeof x === 'object' && typeof x.code === 'string' && typeof x.nom === 'string' && typeof x.jeton === 'string' ? x : null;
      } catch (e) { return null; }
    },
    effacer() { try { sessionStorage.removeItem(CLE_SESSION); } catch (e) { /* tant pis */ } },
  };

  return { session, client, creerRelais, monde, transportMemoire, transportDiffusion, transportWebSocket, horlogeReelle, nomAutorise, nomAuHasard, TYPES_CLIENT };
})();
