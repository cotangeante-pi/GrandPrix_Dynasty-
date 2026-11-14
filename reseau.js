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
  const TYPES_CLIENT = ['creer', 'rejoindre', 'pret', 'reglages', 'lancer', 'retour', 'cmd', 'controle', 'emote', 'quitter', 'ping'];

  // ---------------------------------------------------------------- les noms (jamais de texte libre devant des enfants)
  // les noms permis (EN_LIGNE_NOMS_LIBRES faux) : « Pilote <couleur> » / « <couleur> driver » des écrans (textes.js, dans les deux langues, avec un
  // numéro facultatif pour deux joueurs de la même couleur), un nom de la liste (EN_LIGNE_NOMS) avec ou sans couleur, ou « Pilote N »
  function nomsDesEcrans() {
    const noms = new Set();
    if (typeof TEXTES === 'undefined') return noms;
    for (const l of Object.keys(TEXTES)) {
      const t = TEXTES[l];
      if (!t || !t.enligneNom || !Array.isArray(R.EN_LIGNE_COULEURS)) continue;
      for (const c of R.EN_LIGNE_COULEURS) if (c && t['enligneCouleur_' + c.id]) noms.add(t.enligneNom.replace('{c}', t['enligneCouleur_' + c.id]));
    }
    return noms;
  }
  let nomsEcrans = null;
  function nomAutorise(nom) {
    if (typeof nom !== 'string') return false;
    const n = nom.trim();
    if (!n || n.length > R.EN_LIGNE_NOM_MAX) return false;
    if (R.EN_LIGNE_NOMS_LIBRES) return /^[\p{L}\p{N} _-]+$/u.test(n);
    if (!nomsEcrans) nomsEcrans = nomsDesEcrans();
    const mots = n.split(' ');
    if (/^[1-9][0-9]?$/.test(mots[mots.length - 1]) && mots.length > 1) mots.pop();   // un numéro de plus (deux joueurs de la même couleur)
    const sans = mots.join(' ');
    if (nomsEcrans.has(sans)) return true;
    const couleur = mots.length > 1 && R.EN_LIGNE_NOMS_COULEURS.includes(mots[mots.length - 1]);
    const base = (couleur ? mots.slice(0, -1) : mots).join(' ');
    return R.EN_LIGNE_NOMS.includes(base) || /^Pilote [1-9][0-9]?$/.test(base);
  }
  // un nom permis tiré au hasard
  function nomAuHasard(hasard) {
    const h = hasard || Math.random, pick = l => l[Math.floor(h() * l.length) % l.length];
    return pick(R.EN_LIGNE_NOMS) + ' ' + pick(R.EN_LIGNE_NOMS_COULEURS);
  }

  // ---------------------------------------------------------------- le relais (le rôle du serveur : mêmes règles que serveur/relais.py)
  // Sans transport : connecter(sortie) donne une connexion { id, recevoir(msg), fermer() } ; sortie(msg) reçoit ce que le relais lui dit.
  function creerRelais(opt) {
    opt = opt || {};
    const hasard = opt.hasard || Math.random, salles = new Map();
    const version = opt.version === undefined ? R.EN_LIGNE_VERSION : opt.version;
    const max = opt.max || R.EN_LIGNE_JOUEURS_MAX, min = opt.min || R.EN_LIGNE_JOUEURS_MIN;
    let suivant = 1;
    const relais = { salles, rejets: 0 };

    function codeNouveau() {
      for (let essai = 0; essai < 1000; essai++) {
        let c = '';
        for (let i = 0; i < 4; i++) c += CONSONNES[Math.floor(hasard() * CONSONNES.length) % CONSONNES.length];
        if (!salles.has(c)) return c;
      }
      return null;
    }
    const entier = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
    function reglagesValides(g) {      // les réglages d'une course : une forme fixe, des bornes (jamais de texte libre long)
      if (!g || typeof g !== 'object') return null;
      if (typeof g.circuit !== 'string' || !g.circuit || g.circuit.length > 40 || typeof g.meteo !== 'string' || g.meteo.length > 20
        || !entier(g.tours, 1, R.EN_LIGNE_TOURS_MAX) || !entier(g.nbIA, 0, R.EN_LIGNE_IA_MAX)) return null;
      return { circuit: g.circuit, tours: g.tours, meteo: g.meteo, nbIA: g.nbIA };
    }
    const env = (conn, m) => { if (conn.ouverte) conn.sortie(m); };
    function diffuser(salle, m, sauf) { for (const j of salle.joueurs) if (j !== sauf) env(j, m); }
    function liste(salle) { return salle.joueurs.map(j => ({ id: j.id, nom: j.nom, pret: j.pret, hote: j === salle.hote })); }
    function annoncer(salle) { diffuser(salle, { t: 'joueurs', liste: liste(salle) }); }
    const nomValide = nomAutorise;

    function retirer(conn) {
      const salle = conn.salle;
      if (!salle) return;
      conn.salle = null; conn.pret = false;
      salle.joueurs.splice(salle.joueurs.indexOf(conn), 1);
      if (!salle.joueurs.length) { salles.delete(salle.code); return; }
      diffuser(salle, { t: 'parti', id: conn.id });
      if (salle.hote === conn) { salle.hote = salle.joueurs[0]; diffuser(salle, { t: 'nouvel-hote', id: salle.hote.id }); }
      annoncer(salle);
    }
    function entrer(conn, salle, nom) {
      conn.salle = salle; conn.nom = nom.trim(); conn.pret = false;
      salle.joueurs.push(conn);
      env(conn, { t: 'salle', code: salle.code, toi: conn.id, hote: salle.hote.id });
      annoncer(salle);
      if (salle.reglages) env(conn, { t: 'reglages', reglages: salle.reglages });     // ceux déjà choisis par l'hôte
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
          if (m.version !== version) return env(conn, { t: 'refus', raison: 'version' });
          { const code = codeNouveau();
            if (!code) return env(conn, { t: 'refus', raison: 'pleine' });
            const s = { code, joueurs: [], hote: conn, commencee: false };
            salles.set(code, s); entrer(conn, s, m.nom); }
          return;
        case 'rejoindre': {
          if (salle) return;
          const s = typeof m.code === 'string' ? salles.get(m.code.trim().toUpperCase()) : null;
          if (!s) return env(conn, { t: 'refus', raison: 'inconnue' });
          if (m.version !== version) return env(conn, { t: 'refus', raison: 'version' });
          if (s.commencee) return env(conn, { t: 'refus', raison: 'commencee' });
          if (s.joueurs.length >= max) return env(conn, { t: 'refus', raison: 'pleine' });
          if (!nomValide(m.nom) || s.joueurs.some(j => j.nom.toLowerCase() === m.nom.trim().toLowerCase())) return env(conn, { t: 'refus', raison: 'nom' });
          entrer(conn, s, m.nom);
          return;
        }
        default:
      }
      if (!salle) { relais.rejets++; return; }
      switch (m.t) {
        case 'quitter': retirer(conn); return;
        case 'pret':
          if (salle.commencee || typeof m.pret !== 'boolean') return;
          conn.pret = m.pret; annoncer(salle); return;
        case 'reglages': {         // l'hôte seul, avant le lancement : tout le monde les voit, et les suivants à leur arrivée
          const g = reglagesValides(m.reglages);
          if (conn !== salle.hote || salle.commencee || !g) return;
          salle.reglages = g; diffuser(salle, { t: 'reglages', reglages: g });
          return;
        }
        case 'lancer': {
          const g = reglagesValides(m.reglages);
          if (conn !== salle.hote || salle.commencee || salle.joueurs.length < min || !g) return;
          salle.commencee = true;
          const graine = Math.floor(hasard() * 4294967296) >>> 0;
          diffuser(salle, { t: 'depart', reglages: g, graine, ordre: salle.joueurs.map(j => j.id) });
          return;
        }
        case 'retour':             // l'hôte, après la course : la salle se rouvre, les « prêt » repartent à faux
          if (conn !== salle.hote || !salle.commencee) return;
          salle.commencee = false;
          for (const j of salle.joueurs) j.pret = false;
          diffuser(salle, { t: 'retour' }); annoncer(salle);
          return;
        case 'cmd':
          if (!salle.commencee || !entier(m.n, 0, 1e9) || m.c === undefined) return;
          diffuser(salle, { t: 'cmd', de: conn.id, n: m.n, c: m.c }, conn); return;
        case 'controle':
          if (!salle.commencee || !entier(m.n, 0, 1e9)) return;
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
      conn.fermer = () => { retirer(conn); conn.ouverte = false; };
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
      fermer() { if (lien && lien.ouvert) { lien.ouvert = false; m.liens.delete(lien); lien.conn.fermer(); } },
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
    return {
      ouvrir(rx2, ferme2) {
        return new Promise((res, rej) => {
          if (typeof BroadcastChannel === 'undefined') return rej(new Error('BroadcastChannel absent'));
          rx = rx2; ferme = ferme2; vivant = true;
          canal = new BroadcastChannel(opt.canal || R.EN_LIGNE_CANAL);
          canal.onmessage = surCanal;
          if (typeof addEventListener === 'function') addEventListener('pagehide', this.fermer);
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
        if (typeof removeEventListener === 'function') removeEventListener('pagehide', fermer);
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
    const version = opt.version === undefined ? R.EN_LIGNE_VERSION : opt.version;
    const ecouteurs = {};
    const c = { etat: 'ferme', code: null, moi: null, hote: null, joueurs: [], depart: null, reglagesSalle: null, latence: null, nom: null, transport, rejets: 0 };
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
    function oublierSalle() { c.reglagesSalle = null; c.code = null; c.moi = null; c.hote = null; c.joueurs = []; c.depart = null; }
    c.enSalle = () => c.code !== null;
    c.estHote = () => c.moi !== null && c.moi === c.hote;

    function recevoir(m) {
      dernierRecu = horloge.maintenant();
      switch (m.t) {
        case 'salle': c.code = m.code; c.moi = m.toi; c.hote = m.hote; c.depart = null; emettre('salle', m); break;
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
          const code = c.code; oublierSalle();
          changer('ouvert'); dernierRecu = horloge.maintenant(); essai = 0; ping_();
          emettre('reconnecte', { code });
          if (code && c.nom) c.envoyerBrut({ t: 'rejoindre', code, nom: c.nom, version });
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
        if (c.code) c.envoyerBrut({ t: 'ping', h: horloge.maintenant() });
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
    c.rejoindre = function (code, nom) {
      if (c.code) return erreur('deja-en-salle');
      if (typeof code !== 'string' || !/^[A-Za-z]{4}$/.test(code.trim())) { emettre('refus', { t: 'refus', raison: 'inconnue' }); return false; }
      if (refuserNom(nom)) return false;
      c.nom = nom.trim(); return envoyer({ t: 'rejoindre', code: code.trim().toUpperCase(), nom: c.nom, version });
    };
    c.reglages = function (g) {
      if (!c.code) return erreur('pas-en-salle');
      if (!c.estHote()) return erreur('pas-hote');
      if (!g || typeof g.circuit !== 'string' || !g.circuit || typeof g.meteo !== 'string' || !Number.isInteger(g.tours) || g.tours < 1
        || !Number.isInteger(g.nbIA) || g.nbIA < 0) return erreur('reglages');
      return envoyer({ t: 'reglages', reglages: { circuit: g.circuit, tours: g.tours, meteo: g.meteo, nbIA: g.nbIA } });
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
      const g = reglages;
      if (!g || typeof g.circuit !== 'string' || !g.circuit || typeof g.meteo !== 'string' || !Number.isInteger(g.tours) || g.tours < 1
        || !Number.isInteger(g.nbIA) || g.nbIA < 0) return erreur('reglages');
      return envoyer({ t: 'lancer', reglages: { circuit: g.circuit, tours: g.tours, meteo: g.meteo, nbIA: g.nbIA } });
    };
    c.envoyer = function (m) {      // l'interface générique : { t:'pret', pret:true }… (les mêmes contrôles que les méthodes)
      if (!m || typeof m !== 'object') return erreur('type');
      switch (m.t) {
        case 'creer': return c.creer(m.nom);
        case 'rejoindre': return c.rejoindre(m.code, m.nom);
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
      if (!Number.isInteger(n) || n < 0 || cmds === undefined) return erreur('cmd');
      return envoyer({ t: 'cmd', n, c: cmds });
    };
    c.controle = function (n, h) { return c.depart && Number.isInteger(n) && n >= 0 ? envoyer({ t: 'controle', n, h }) : erreur('controle'); };
    c.emote = function (i) { return c.code && Number.isInteger(i) && i >= 0 && i < R.EN_LIGNE_EMOTES.length ? envoyer({ t: 'emote', i }) : erreur('emote'); };
    c.quitter = function () { if (!c.code) return false; const ok = envoyer({ t: 'quitter' }); oublierSalle(); return ok; };
    c.ping = function () { return c.code ? envoyer({ t: 'ping', h: horloge.maintenant() }) : false; };
    c.fermer = function () {
      volontaire = true; stopPing();
      if (minuteurRecon !== null) { horloge.annuler(minuteurRecon); minuteurRecon = null; }
      if (c.etat === 'ouvert' && c.code) transport.envoyer({ t: 'quitter' });
      transport.fermer(); oublierSalle(); changer('ferme');
    };
    return c;
  }

  return { client, creerRelais, monde, transportMemoire, transportDiffusion, transportWebSocket, horlogeReelle, nomAutorise, nomAuHasard, TYPES_CLIENT };
})();
