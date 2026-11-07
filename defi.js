// Le défi du fantôme entre amis (CLAUDE.md « Le défi du fantôme entre amis », tour 49b), en calcul pur, sans écran ni serveur.
// Un tour chronométré devient un code à copier : « GPD-SPAA-1:23.456-1-<données>-<somme> » (le circuit et le temps en clair, la
// version du code, puis les données et une somme de contrôle). Les données : le pilote (nom, casque, aileron, aides) et le tour
// lui-même, le fantôme compact de fantome.js (positions au cm, cap au millième, distance au cm), en entiers : chaque valeur est
// l'écart à la précédente, écrite en chiffres de 64 signes (5 bits et un bit « la suite »). Décodé, le fantôme est le même au bit
// près (un entier divisé par 100 ou 1000, comme l'arrondi de fantome.js) : le défi se rejoue identique sur un autre ordinateur.
// Un code abîmé (la somme), d'une autre version, ou un tour impossible (vitesse, nombre d'images, distance) est refusé proprement.
//
//   DEFI.coder({ circuit, fantome, nom, casque, aileron, aides })   → le code (texte)
//   DEFI.decoder(code, longueur)   → { ok: true, defi: { id, circuit, temps, nom, casque, aileron, aides, fantome } }
//                                    ou { ok: false, raison: 'vide' | 'format' | 'version' | 'abime' | 'circuit' | 'impossible' }
//   (longueur : la longueur du circuit en m, si on la connaît, pour vérifier la distance du tour)
//   DEFI.lien(code, adresse)   → l'adresse du jeu + ?defi=<code> (le lien de défi, tour 50b)
const DEFI = (function () {
  const R = REGLAGES;
  const SIGNES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.';   // 64 signes, jamais « - » (le séparateur)
  const VALEUR = {};
  for (let i = 0; i < SIGNES.length; i++) VALEUR[SIGNES[i]] = i;

  // un entier (positif ou négatif) en chiffres de 64 signes : zigzag, puis 5 bits par signe, le 6e dit « il en reste »
  function ecrireEntier(n, sortie) {
    let z = n >= 0 ? 2 * n : -2 * n - 1;
    do {
      const bas = z % 32;
      z = Math.floor(z / 32);
      sortie.push(SIGNES[bas + (z > 0 ? 32 : 0)]);
    } while (z > 0);
  }
  // la lecture : { i } avance dans le texte ; null si le texte est fini ou a un signe inconnu
  function lireEntier(t, curseur) {
    let z = 0, f = 1;
    for (;;) {
      if (curseur.i >= t.length || f > 1e15) return null;
      const v = VALEUR[t[curseur.i++]];
      if (v === undefined) return null;
      z += (v % 32) * f;
      f *= 32;
      if (v < 32) break;
    }
    return z % 2 === 0 ? z / 2 : -(z + 1) / 2;
  }

  // la somme de contrôle (FNV-1a sur 32 bits) d'un texte, en base 36
  function somme(t) {
    let h = 0x811c9dc5;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }

  // le temps en clair dans le code : « 1:23.456 »
  function tempsClair(s) {
    const ms = Math.round(s * 1000), m = Math.floor(ms / 60000), r = ms - m * 60000, sec = Math.floor(r / 1000), mil = r - sec * 1000;
    return m + ':' + String(sec).padStart(2, '0') + '.' + String(mil).padStart(3, '0');
  }

  const entier = (x, k) => Math.round(x * k);

  function coder(d) {
    const f = d.fantome, sortie = [];
    const meta = JSON.stringify({ n: d.nom || null, c: d.casque || null, a: typeof d.aileron === 'number' ? d.aileron : null, h: (d.aides || []).slice() });
    ecrireEntier(meta.length, sortie);
    for (let i = 0; i < meta.length; i++) ecrireEntier(meta.charCodeAt(i), sortie);
    ecrireEntier(f.x.length, sortie);
    ecrireEntier(entier(f.pas, 1000), sortie);
    ecrireEntier(entier(f.temps, 1000), sortie);
    ecrireEntier(entier(f.fin, 100), sortie);
    for (const [liste, k] of [[f.x, 100], [f.z, 100], [f.cap, 1000], [f.s, 100]]) {
      let avant = 0;
      for (const x of liste) { const n = entier(x, k); ecrireEntier(n - avant, sortie); avant = n; }
    }
    const corps = 'GPD-' + d.circuit.toUpperCase() + '-' + tempsClair(f.temps) + '-' + R.DEFI_VERSION + '-' + sortie.join('');
    return corps + '-' + somme(corps);
  }

  const refus = raison => ({ ok: false, raison });

  function decoder(code, longueur) {
    const t = String(code || '').replace(/\s+/g, '');
    if (!t) return refus('vide');
    if (t.length > R.DEFI_LONGUEUR_MAX + 200) return refus('abime');
    const p = t.split('-');
    if (p.length !== 6 || p[0] !== 'GPD') return refus('format');
    if (p[3] !== String(R.DEFI_VERSION)) return refus('version');
    if (somme(p.slice(0, 5).join('-')) !== p[5]) return refus('abime');
    const circuit = p[1].toLowerCase();
    if (typeof CIRCUITS === 'undefined' || !Object.prototype.hasOwnProperty.call(CIRCUITS, circuit)) return refus('circuit');
    const donnees = p[4], c = { i: 0 }, lire = () => lireEntier(donnees, c);
    const nm = lire();
    if (nm === null || nm < 0 || nm > 2000) return refus('abime');
    let meta = '';
    for (let i = 0; i < nm; i++) { const x = lire(); if (x === null || x < 0 || x > 0xffff) return refus('abime'); meta += String.fromCharCode(x); }
    try { meta = JSON.parse(meta); } catch (e) { return refus('abime'); }
    const n = lire(), pas = lire(), temps = lire(), fin = lire();
    if ([n, pas, temps, fin].some(x => x === null) || n < 2 || n > 100000 || pas <= 0) return refus('abime');
    const f = { temps: temps / 1000, fin: fin / 100, pas: pas / 1000, x: [], z: [], cap: [], s: [] };
    for (const [liste, k] of [[f.x, 100], [f.z, 100], [f.cap, 1000], [f.s, 100]]) {
      let v = 0;
      for (let i = 0; i < n; i++) { const d = lire(); if (d === null) return refus('abime'); v += d; liste.push(v / k); }
    }
    if (c.i !== donnees.length || tempsClair(f.temps) !== p[2] || !FANTOME.valide(f)) return refus('abime');
    if (!possible(f, longueur)) return refus('impossible');
    return { ok: true, defi: { id: p[5], circuit, temps: f.temps, nom: typeof meta.n === 'string' ? meta.n.slice(0, 40) : null, casque: meta.c && typeof meta.c === 'object' ? meta.c : null,
      aileron: typeof meta.a === 'number' ? meta.a : null, aides: Array.isArray(meta.h) ? meta.h.filter(a => typeof a === 'string') : [], fantome: f } };
  }

  // un tour possible ? Le nombre d'images va avec le temps (une image toutes les « pas » s, de la ligne à l'arrivée), la distance
  // depuis la ligne ne recule pas, aucune image n'est plus loin de la précédente que DEFI_VITESSE_MAX, et la distance du tour est
  // la longueur du circuit (si on la connaît). Sinon le code a été trafiqué
  function possible(f, longueur) {
    const n = f.x.length, attendu = Math.floor(f.temps / f.pas + 1e-6) + 1;
    if (!(f.temps > 0) || Math.abs(n - attendu) > 1) return false;
    for (let i = 1; i < n; i++) {
      if (f.s[i] < f.s[i - 1] - 0.01) return false;
      if (Math.hypot(f.x[i] - f.x[i - 1], f.z[i] - f.z[i - 1]) > R.DEFI_VITESSE_MAX * f.pas) return false;
    }
    if (f.fin < f.s[n - 1] - 0.01) return false;
    if (typeof longueur === 'number' && Math.abs(f.fin - longueur) > R.DEFI_DISTANCE_TOLERANCE * longueur) return false;
    return true;
  }

  // le résultat d'un défi relevé : l'écart (s) du tour de l'ami au fantôme ; < 0 : relevé
  const ecart = (defi, temps) => temps - defi.temps;

  // les défis reçus (la sauvegarde) : ajouter ou retrouver un défi par son id ; le meilleur écart y est gardé. code (le lien de défi,
  // tour 50b) : le code lui-même, pour « Relever » depuis la page Messages ; seuls les DEFI_CODES_MAX derniers le gardent (la taille)
  function recevoir(liste, defi, code) {
    const l = Array.isArray(liste) ? liste.filter(x => x && x.id !== defi.id) : [];
    const ancien = Array.isArray(liste) ? liste.find(x => x && x.id === defi.id) : null;
    const garde = typeof code === 'string' ? code : ancien && typeof ancien.code === 'string' ? ancien.code : undefined;
    const x = { id: defi.id, circuit: defi.circuit, temps: defi.temps, nom: defi.nom, meilleur: ancien && typeof ancien.meilleur === 'number' ? ancien.meilleur : null };
    if (garde !== undefined) x.code = garde;
    l.push(x);
    while (l.length > R.DEFI_LISTE_MAX) l.shift();
    let n = 0;
    for (let i = l.length - 1; i >= 0; i--) if (typeof l[i].code === 'string' && ++n > R.DEFI_CODES_MAX) delete l[i].code;
    return l;
  }

  // le lien de défi (tour 50b, CLAUDE.md « Le lien de défi ») : l'adresse du jeu (base : sans paramètres) + ?defi=<code> ; un clic sur ce
  // lien ouvre le jeu directement sur la grille du défi (principal.js, lireLienDefi)
  function lien(code, base) {
    return String(base).split('#')[0].split('?')[0] + '?defi=' + encodeURIComponent(code);
  }
  function noterResultat(liste, id, e) {
    const x = (liste || []).find(y => y && y.id === id);
    if (x && typeof e === 'number' && (x.meilleur === null || e < x.meilleur)) x.meilleur = Math.round(e * 1000) / 1000;
    return liste;
  }

  return { coder, decoder, possible, ecart, recevoir, noterResultat, tempsClair, somme, lien };
})();
