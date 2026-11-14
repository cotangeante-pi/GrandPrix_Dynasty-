#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Le serveur relais des batailles en ligne de Grand Prix Dynasty (tour 56, T3).

Il ne simule rien : chaque client simule toute la course (lockstep), le relais ne fait que
fabriquer des salles, tirer la graine et faire suivre les messages dans l'ordre.
Le protocole (messages JSON, un par trame texte) est décrit dans serveur/LISEZMOI.md.

    python3 serveur/relais.py --port 8765        (voir serveur/LISEZMOI.md)

Il faut le paquet « websockets » (pip install websockets, version 13 ou plus) et Python 3.9 ou plus.
Rien n'est écrit sur le disque, rien n'est gardé après la fin d'une salle, aucune adresse n'est journalisée.
"""
from __future__ import annotations
import argparse, asyncio, json, logging, math, os, random, re, secrets, time

from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosed

journal = logging.getLogger('relais')

TOURS_MAX, IA_MAX = 20, 20   # EN_LIGNE_TOURS_MAX, EN_LIGNE_IA_MAX
CONSONNES = 'BCDFGHJKLMNPQRSTVWXZ'   # le code d'une salle : 4 lettres sans voyelle (donc aucun mot) ni Y

class Config:
    """Tous les réglages en un seul endroit ; les tests en changent quelques-uns (délais courts)."""
    def __init__(self, **kw):
        self.version = '1'               # la version du protocole / du jeu que les clients doivent annoncer
        self.max_joueurs = 8             # 2 à 8 joueurs par salle
        self.min_pour_lancer = 2         # on ne lance pas une course en ligne tout seul
        self.max_octets = 4096           # taille d'un message (au-delà : la connexion est coupée par la bibliothèque)
        self.cadence = 150.0             # messages par seconde et par client (le jeu en envoie ~60 au plus)
        self.rafale = 300                # réserve de messages (une seconde de retard rattrapée d'un coup)
        self.fautes_max = 200            # messages jetés (cadence, JSON faux, inconnus) avant de couper la connexion
        self.noms_libres = False         # EN_LIGNE_NOMS_LIBRES : faux = « Pilote N » + couleur, ou un nom d'une liste du jeu
        self.max_emotes = 8              # indices d'émotes préréglées permis (0 à 7, EN_LIGNE_EMOTES)
        self.delai_emote = 0.5           # secondes minimum entre deux émotes d'un joueur
        self.delai_arrivee = 10.0        # une connexion qui ne crée ni ne rejoint rien en 10 s est coupée
        self.refus_max = 12              # refus avant qu'on coupe (qui devine des codes)
        self.attente_salle = 1800.0      # une salle en attente, muette 30 minutes, expire
        self.attente_course = 7200.0     # une salle commencée, muette 2 heures, expire
        self.nettoyage = 15.0            # période du balayage des salles expirées
        self.max_salles = 500
        self.max_par_ip = 24             # connexions simultanées d'une même adresse (0 = pas de limite ; derrière un proxy : 0)
        self.max_file = 2000             # messages en attente d'envoi à un client lent avant de le couper
        self.grace = 20.0                # EN_LIGNE_GRACE : s pendant lesquelles un joueur coupé (il recharge la page) peut revenir avec son jeton, sans « parti »
        self.exiger_charge = True        # « lancer » refusé tant qu'un joueur n'a pas annoncé (charge) le circuit des réglages
        self.delai_base = 12             # EN_LIGNE_DELAI : le plus petit délai d'entrée (pas de physique) ; au départ le relais l'augmente selon les latences mesurées
        self.delai_max = 120             # EN_LIGNE_DELAI_MAX
        self.delai_marge = 6             # EN_LIGNE_DELAI_MARGE : pas ajoutés au trajet mesuré
        self.pas_ms = 1000.0 / 120       # un pas de physique (REGLAGES.PAS_PHYSIQUE)
        self.ping_intervalle = 20        # pings de la bibliothèque (connexions mortes)
        for k, v in kw.items():
            if not hasattr(self, k): raise TypeError('réglage inconnu : ' + k)
            setattr(self, k, v)

# les mêmes règles que reseau.js (nomAutorise), mêmes listes que donnees.js (EN_LIGNE_NOMS, EN_LIGNE_COULEURS)
NOMS = ['Éclair', 'Turbo', 'Comète', 'Fusée', 'Tonnerre', 'Mistral', 'Phénix', 'Faucon', 'Panthère', 'Requin', 'Étoile', 'Tempête']
COULEURS = ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet', 'Rose', 'Blanc']
_NOM_LIBRE = re.compile(r'^[\w _-]+$')
_PILOTE = re.compile(r'^Pilote [1-9][0-9]?$')

# les noms des écrans de salle (textes.js : enligneNom « Pilote {c} » / « {c} driver », avec enligneCouleur_<id>, deux langues)
COULEURS_ECRANS = ['Bleu', 'Rouge', 'Jaune', 'Vert', 'Orange', 'Violet', 'Turquoise', 'Rose', 'Blue', 'Red', 'Yellow', 'Green', 'Purple', 'Teal', 'Pink']
NOMS_ECRANS = {'Pilote ' + c for c in COULEURS_ECRANS} | {c + ' driver' for c in COULEURS_ECRANS}

def nom_valide(nom, libres, nom_max=20):
    """Le nom (sans espaces autour), comme nomAutorise de reseau.js : un nom des écrans (« Pilote Rouge », « Red driver »), un nom de la liste ou
    « Pilote N » (avec une couleur de la liste au bout), le tout avec un numéro de plus facultatif ; libre si on l'autorise."""
    if not isinstance(nom, str): return False
    n = nom.strip()
    if not n or len(n) > nom_max or not n.isprintable(): return False
    if libres: return bool(_NOM_LIBRE.match(n))
    tous = n.split(' ')
    variantes = [tous]
    if len(tous) > 1 and re.fullmatch(r'[1-9][0-9]?', tous[-1]): variantes.append(tous[:-1])
    for mots in variantes:
        if ' '.join(mots) in NOMS_ECRANS: return True
        couleur = len(mots) > 1 and mots[-1] in COULEURS
        base = ' '.join(mots[:-1] if couleur else mots)
        if base in NOMS or _PILOTE.match(base): return True
    return False

def entier(v, lo, hi):
    return isinstance(v, int) and not isinstance(v, bool) and lo <= v <= hi

def reglages_valides(r):
    """Les réglages d'une course (comme reseau.js) : circuit, tours, meteo, nbIA, rien d'autre."""
    if not isinstance(r, dict): return None
    c, m = r.get('circuit'), r.get('meteo')
    if not (isinstance(c, str) and 0 < len(c) <= 40 and isinstance(m, str) and len(m) <= 20): return None
    if not (entier(r.get('tours'), 1, TOURS_MAX) and entier(r.get('nbIA'), 0, IA_MAX)): return None
    return {'circuit': c, 'tours': r['tours'], 'meteo': m, 'nbIA': r['nbIA']}

class Client:
    def __init__(self, ws, ip, cfg):
        self.ws, self.ip, self.cfg = ws, ip, cfg
        self.file = asyncio.Queue()
        self.salle = None
        self.id = None
        self.nom = ''
        self.pret = False
        self.jetons = float(cfg.rafale)
        self.vu = time.monotonic()
        self.fautes = 0
        self.refus = 0
        self.derniere_emote = 0.0
        self.minuteur = None
        self.ferme = False
        self.jeton = None      # le jeton de retour (tiré à l'entrée en salle)
        self.absent = False    # coupé pendant la grâce : il reste dans la salle, « recharge »
        self.grace_minuteur = None
        self.rtt = None        # son temps d'aller-retour en ms, annoncé dans ses « ping » (champ l) : le délai d'entrée du départ en dépend
        self.circuit = None    # le circuit que sa page a chargé (message « charge »)

    def envoyer_texte(self, texte):
        if self.ferme: return
        if self.file.qsize() >= self.cfg.max_file:   # client trop lent : on le coupe plutôt que de tout retenir
            self.couper(1013, 'trop lent')
            return
        self.file.put_nowait(texte)

    def envoyer(self, obj):
        self.envoyer_texte(json.dumps(obj, separators=(',', ':'), ensure_ascii=False))

    def couper(self, code, raison):
        if self.ferme: return
        self.ferme = True
        self.file.put_nowait(('FIN', code, raison))

    def depenser(self):
        """Une pièce par message ; faux = cadence dépassée."""
        t = time.monotonic()
        self.jetons = min(float(self.cfg.rafale), self.jetons + (t - self.vu) * self.cfg.cadence)
        self.vu = t
        if self.jetons < 1: return False
        self.jetons -= 1
        return True

class Salle:
    def __init__(self, code):
        self.code = code
        self.joueurs = {}      # id -> Client, dans l'ordre d'arrivée (le premier est l'hôte)
        self.suivant = 1
        self.hote = None
        self.commencee = False
        self.reglages = None   # les derniers réglages choisis par l'hôte (renvoyés à qui rejoint ensuite)
        self.activite = time.monotonic()

class Relais:
    def __init__(self, cfg=None):
        self.cfg = cfg or Config()
        self.salles = {}
        self.par_ip = {}
        self.hasard = random.SystemRandom()
        self.tache_nettoyage = None

    # ---- une connexion ----
    async def gerer(self, ws):
        ip = ws.remote_address[0] if ws.remote_address else '?'
        c = Client(ws, ip, self.cfg)
        n = self.par_ip.get(ip, 0)
        if self.cfg.max_par_ip and n >= self.cfg.max_par_ip:
            await ws.close(1013, 'trop de connexions')
            return
        self.par_ip[ip] = n + 1
        ecrivain = asyncio.ensure_future(self._ecrire(c))
        self._armer(c)
        try:
            async for brut in ws:
                if not c.ferme: self._recu(c, brut)   # (coupé : on ignore la suite, la fermeture en cours finit seule avec son code)
        except ConnectionClosed:
            pass
        finally:
            if c.minuteur: c.minuteur.cancel()
            c.ferme = True
            self._deconnecte(c)
            ecrivain.cancel()
            self.par_ip[ip] = self.par_ip.get(ip, 1) - 1
            if self.par_ip[ip] <= 0: self.par_ip.pop(ip, None)

    def _armer(self, c):
        """Sans salle, une connexion a delai_arrivee secondes pour en créer ou en rejoindre une."""
        if c.minuteur: c.minuteur.cancel()
        c.minuteur = asyncio.get_running_loop().call_later(self.cfg.delai_arrivee, lambda: c.couper(1008, 'pas de salle') if c.salle is None else None)

    async def _ecrire(self, c):
        try:
            while True:
                x = await c.file.get()
                if isinstance(x, tuple):
                    await c.ws.close(x[1], x[2])
                    return
                await c.ws.send(x)
        except (ConnectionClosed, asyncio.CancelledError):
            return

    def _faute(self, c):
        c.fautes += 1
        if c.fautes > self.cfg.fautes_max: c.couper(1008, 'trop de messages invalides')

    def _recu(self, c, brut):
        if not c.depenser():
            self._faute(c)
            return
        if not isinstance(brut, str):          # trame binaire : jamais utilisée par le protocole
            self._faute(c)
            return
        try: m = json.loads(brut)
        except ValueError:
            self._faute(c)
            return
        if not isinstance(m, dict) or not isinstance(m.get('t'), str):
            self._faute(c)
            return
        self.traiter(c, m)

    # ---- les messages ----
    def traiter(self, c, m):
        t = m['t']
        if t == 'ping':
            h = m.get('h')
            l = m.get('l')
            if isinstance(l, (int, float)) and not isinstance(l, bool) and 0 <= l <= 60000: c.rtt = float(l)
            c.envoyer({'t': 'pong', 'h': h if h is None or isinstance(h, (int, float)) or (isinstance(h, str) and len(h) <= 64) else None})
            return
        if c.salle is None:
            if t == 'creer': self._creer(c, m)
            elif t == 'rejoindre': self._rejoindre(c, m)
            else: self._faute(c)
            return
        salle = c.salle
        salle.activite = time.monotonic()
        if t == 'pret': self._pret(c, m)
        elif t == 'lancer': self._lancer(c, m)
        elif t == 'reglages':
            if c.id != salle.hote or salle.commencee: return self._erreur(c, 'hote' if c.id != salle.hote else 'commencee')
            r = reglages_valides(m.get('reglages'))
            if r is None: return self._erreur(c, 'reglages')
            salle.reglages = r
            self._diffuser(salle, {'t': 'reglages', 'reglages': r})
        elif t == 'cmd':
            if salle.commencee and entier(m.get('n'), 0, 10 ** 8) and 'c' in m:
                self._diffuser(salle, {'t': 'cmd', 'de': c.id, 'n': m['n'], 'c': m['c']}, sauf=c)
            else: self._faute(c)
        elif t == 'controle':
            h = m.get('h')
            if salle.commencee and entier(m.get('n'), 0, 10 ** 8) and (isinstance(h, (int, str)) and not isinstance(h, bool) and len(str(h)) <= 64):
                self._diffuser(salle, {'t': 'controle', 'de': c.id, 'n': m['n'], 'h': h}, sauf=c)
            else: self._faute(c)
        elif t == 'emote':
            now = time.monotonic()
            if not entier(m.get('i'), 0, self.cfg.max_emotes - 1): self._faute(c)
            elif now - c.derniere_emote >= self.cfg.delai_emote:   # trop vite : jetée sans bruit
                c.derniere_emote = now
                self._diffuser(salle, {'t': 'emote', 'de': c.id, 'i': m['i']}, sauf=c)
        elif t == 'charge':
            circuit = m.get('circuit')
            if salle.commencee or not (isinstance(circuit, str) and 0 < len(circuit) <= 40 and circuit.isprintable()): return self._faute(c)
            c.circuit = circuit
            self._diffuser(salle, self._liste(salle))
        elif t == 'retour':
            if c.id != salle.hote or not salle.commencee: return self._erreur(c, 'hote' if c.id != salle.hote else 'pas-commencee')
            salle.commencee = False
            for j in salle.joueurs.values(): j.pret = False
            self._diffuser(salle, {'t': 'retour'})
            self._diffuser(salle, self._liste(salle))
        elif t == 'quitter':
            self._sortir(c)
            self._armer(c)
        else:
            self._faute(c)

    def _refuser(self, c, raison):
        c.refus += 1
        c.envoyer({'t': 'refus', 'raison': raison})
        if c.refus >= self.cfg.refus_max: c.couper(1008, 'trop de refus')

    def _controle_entree(self, c, m):
        """Version et nom : les mêmes règles pour créer et rejoindre. Renvoie la raison du refus, ou None."""
        v = m.get('version')
        if not isinstance(v, (str, int)) or isinstance(v, bool) or str(v) != str(self.cfg.version): return 'version'
        if not nom_valide(m.get('nom'), self.cfg.noms_libres): return 'nom'
        return None

    def _creer(self, c, m):
        raison = self._controle_entree(c, m)
        if not raison and len(self.salles) >= self.cfg.max_salles: raison = 'pleine'
        if raison: return self._refuser(c, raison)
        while True:
            code = ''.join(self.hasard.choice(CONSONNES) for _ in range(4))
            if code not in self.salles: break
        salle = self.salles[code] = Salle(code)
        self._entrer(c, salle, m['nom'].strip())

    def _rejoindre(self, c, m):
        code = m.get('code')
        salle = self.salles.get(code.strip().upper()) if isinstance(code, str) and len(code) <= 8 else None
        if salle is None: return self._refuser(c, 'inconnue')
        if salle.commencee: return self._refuser(c, 'commencee')
        if self._retour(c, salle, m): return
        raison = self._controle_entree(c, m)
        if not raison and len(salle.joueurs) >= self.cfg.max_joueurs: raison = 'pleine'
        if not raison and any(j.nom.lower() == m['nom'].strip().lower() for j in salle.joueurs.values()): raison = 'nom'
        if raison: return self._refuser(c, raison)
        self._entrer(c, salle, m['nom'].strip())

    def _retour(self, c, salle, m):
        """Un joueur qui revient avec son jeton pendant la grâce reprend sa place (même id, même rôle d'hôte) ; vrai si c'était lui."""
        jeton = m.get('jeton')
        if not isinstance(jeton, str) or not jeton: return False
        vieux = next((j for j in salle.joueurs.values() if j.absent and j.jeton and secrets.compare_digest(j.jeton.encode(), jeton.encode())), None)
        if vieux is None: return False
        if self._controle_version(m): self._refuser(c, 'version'); return True
        if vieux.grace_minuteur: vieux.grace_minuteur.cancel()
        vieux.salle = None
        c.salle, c.id, c.nom, c.pret, c.jeton = salle, vieux.id, vieux.nom, vieux.pret, vieux.jeton
        salle.joueurs[c.id] = c
        salle.activite = time.monotonic()
        if c.minuteur: c.minuteur.cancel(); c.minuteur = None
        c.envoyer({'t': 'salle', 'code': salle.code, 'toi': c.id, 'hote': salle.hote, 'jeton': c.jeton})
        self._diffuser(salle, self._liste(salle))
        if salle.reglages is not None: c.envoyer({'t': 'reglages', 'reglages': salle.reglages})
        return True

    def _controle_version(self, m):
        v = m.get('version')
        return not isinstance(v, (str, int)) or isinstance(v, bool) or str(v) != str(self.cfg.version)

    def _entrer(self, c, salle, nom):
        c.salle, c.nom, c.pret, c.id = salle, nom, False, salle.suivant
        c.jeton = secrets.token_urlsafe(12)
        salle.suivant += 1
        salle.joueurs[c.id] = c
        if salle.hote is None: salle.hote = c.id
        salle.activite = time.monotonic()
        if c.minuteur: c.minuteur.cancel(); c.minuteur = None
        c.envoyer({'t': 'salle', 'code': salle.code, 'toi': c.id, 'hote': salle.hote, 'jeton': c.jeton})
        self._diffuser(salle, self._liste(salle))
        if salle.reglages is not None: c.envoyer({'t': 'reglages', 'reglages': salle.reglages})

    def _liste(self, salle):
        return {'t': 'joueurs', 'liste': [{'id': j.id, 'nom': j.nom, 'pret': j.pret, 'hote': j.id == salle.hote, 'circuit': j.circuit, 'recharge': j.absent} for j in salle.joueurs.values()]}

    def _pret(self, c, m):
        salle = c.salle
        if salle.commencee or not isinstance(m.get('pret'), bool): return self._faute(c)
        c.pret = m['pret']
        self._diffuser(salle, self._liste(salle))

    def _lancer(self, c, m):
        salle = c.salle
        if c.id != salle.hote or salle.commencee: return self._erreur(c, 'hote' if c.id != salle.hote else 'commencee')
        reglages = reglages_valides(m.get('reglages'))
        if reglages is None: return self._erreur(c, 'reglages')
        if len(salle.joueurs) < self.cfg.min_pour_lancer: return self._erreur(c, 'seul')
        if self.cfg.exiger_charge and any(j.circuit != reglages.get('circuit') or j.absent for j in salle.joueurs.values()): return self._erreur(c, 'charge')
        salle.commencee = True
        ordre = list(salle.joueurs)
        self.hasard.shuffle(ordre)
        delai = self._delai(salle)
        if delai is not None: reglages = dict(reglages, delai=delai)
        self._diffuser(salle, {'t': 'depart', 'reglages': reglages, 'graine': secrets.randbelow(2 ** 32), 'ordre': ordre})

    def _delai(self, salle):
        """Le délai d'entrée (en pas) du départ, le même pour tous : le trajet d'une commande entre les deux joueurs les plus lents
        ((rtt A + rtt B) / 2 : chacun passe par le relais), plus une marge, entre delai_base et delai_max. None : aucune latence annoncée."""
        rtts = sorted((j.rtt for j in salle.joueurs.values() if j.rtt is not None and not j.absent), reverse=True)
        if not rtts: return None
        trajet = (rtts[0] + rtts[1]) / 2 if len(rtts) > 1 else rtts[0]
        return int(max(self.cfg.delai_base, min(self.cfg.delai_max, math.ceil(trajet / self.cfg.pas_ms) + self.cfg.delai_marge)))

    def _erreur(self, c, raison):
        """Hors protocole du Chef, ajout du relais : pourquoi un « lancer » est ignoré (les clients peuvent l'ignorer)."""
        c.envoyer({'t': 'erreur', 'raison': raison})

    def _diffuser(self, salle, obj, sauf=None):
        texte = json.dumps(obj, separators=(',', ':'), ensure_ascii=False)
        for j in list(salle.joueurs.values()):
            if j is not sauf: j.envoyer_texte(texte)

    def _deconnecte(self, c):
        """La connexion de c est finie. Avant le départ, il reste GRACE s dans la salle (il recharge sa page) : ni « parti » ni nouvel hôte."""
        salle = c.salle
        if salle is None: return
        if salle.commencee or self.cfg.grace <= 0 or not c.jeton: return self._sortir(c)
        c.absent, c.circuit = True, None
        self._diffuser(salle, self._liste(salle))
        c.grace_minuteur = asyncio.get_running_loop().call_later(self.cfg.grace, lambda: self._sortir(c) if c.absent and c.salle is not None else None)

    def _sortir(self, c):
        salle = c.salle
        if salle is None: return
        c.salle = None
        if c.grace_minuteur: c.grace_minuteur.cancel()
        if salle.joueurs.get(c.id) is c: salle.joueurs.pop(c.id, None)
        c.pret = False
        if not salle.joueurs:
            self.salles.pop(salle.code, None)
            return
        self._diffuser(salle, {'t': 'parti', 'id': c.id})
        if salle.hote == c.id:
            salle.hote = next(iter(salle.joueurs))
            self._diffuser(salle, {'t': 'nouvel-hote', 'id': salle.hote})
        if not salle.commencee: self._diffuser(salle, self._liste(salle))

    # ---- les salles qui expirent ----
    def nettoyer(self):
        now = time.monotonic()
        for salle in list(self.salles.values()):
            limite = self.cfg.attente_course if salle.commencee else self.cfg.attente_salle
            if now - salle.activite > limite:
                journal.info('salle %s expirée', salle.code)
                for j in list(salle.joueurs.values()):
                    if j.absent: j.salle = None
                    else: j.couper(1001, 'salle expirée')
                if all(j.absent for j in salle.joueurs.values()): self.salles.pop(salle.code, None)

    async def _boucle_nettoyage(self):
        while True:
            await asyncio.sleep(self.cfg.nettoyage)
            self.nettoyer()

    async def servir(self, hote='127.0.0.1', port=8765):
        """À utiliser avec « async with » : renvoie le serveur websockets (son port réel dans .sockets)."""
        serveur = serve(self.gerer, hote, port, max_size=self.cfg.max_octets, ping_interval=self.cfg.ping_intervalle, compression=None)
        return _Lance(self, serveur)

class _Lance:
    def __init__(self, relais, serveur): self.relais, self.serveur = relais, serveur
    async def __aenter__(self):
        self.s = await self.serveur.__aenter__()
        self.relais.tache_nettoyage = asyncio.ensure_future(self.relais._boucle_nettoyage())
        self.port = self.s.sockets[0].getsockname()[1]
        return self
    async def __aexit__(self, *a):
        self.relais.tache_nettoyage.cancel()
        return await self.serveur.__aexit__(*a)

async def principal(args):
    cfg = Config(version=args.version, noms_libres=args.noms_libres, max_par_ip=args.max_par_ip)
    relais = Relais(cfg)
    async with await relais.servir(args.hote, args.port) as s:
        journal.info('relais prêt sur %s:%d (version %s)', args.hote, s.port, cfg.version)
        await asyncio.Future()

if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Serveur relais des batailles en ligne de Grand Prix Dynasty')
    p.add_argument('--hote', default=os.environ.get('RELAIS_HOTE', '127.0.0.1'), help='adresse d écoute (127.0.0.1 : cet ordinateur seulement ; 0.0.0.0 : tout le réseau)')
    p.add_argument('--port', type=int, default=int(os.environ.get('PORT', 8765)))
    p.add_argument('--version', default=os.environ.get('RELAIS_VERSION', '1'), help='la version que les clients doivent annoncer')
    p.add_argument('--noms-libres', action='store_true', help='noms tapés librement (interdit au public d enfants)')
    p.add_argument('--max-par-ip', type=int, default=24, help='connexions par adresse (0 = pas de limite, à mettre derrière un proxy)')
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
    try: asyncio.run(principal(p.parse_args()))
    except KeyboardInterrupt: pass
