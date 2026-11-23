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

# (décision D3 du Chef : une seule source, le cœur ; ces nombres sont ceux de donnees.js) EN_LIGNE_TOURS_MAX, EN_LIGNE_IA_MAX, EN_LIGNE_VOITURES_MAX, EN_LIGNE_METEOS
TOURS_MAX, IA_MAX, VOITURES_MAX = 30, 8, 16
METEOS = ('auto', 'sec', 'pluie', 'averse', 'eclaircie')
CONSONNES = 'BCDFGHJKLMNPQRSTVWXZ'   # le code d'une salle : 4 lettres sans voyelle (donc aucun mot) ni Y

class Config:
    """Tous les réglages en un seul endroit ; les tests en changent quelques-uns (délais courts)."""
    def __init__(self, **kw):
        self.version = None              # None : la version de la salle est celle de son créateur (décision D4) ; sinon le créateur doit annoncer exactement celle-ci
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
        self.origines = None             # (tour 59) None : toute page peut ouvrir une connexion ; sinon la liste exacte des origines permises (« https://exemple.fr »), une page d'ailleurs est refusée (403) ; sans en-tête Origin (un script) : refusé aussi
        self.max_par_ip = 24             # connexions simultanées d'une même adresse (0 = pas de limite ; derrière un proxy : 0)
        self.max_file = 2000             # messages en attente d'envoi à un client lent avant de le couper
        self.grace = 20.0                # EN_LIGNE_GRACE : s pendant lesquelles un joueur coupé (il recharge la page) peut revenir avec son jeton, sans « parti »
        self.grace_course = 12.0         # EN_LIGNE_GRACE_COURSE (tour 61) : s pendant lesquelles un joueur coupé EN PLEINE COURSE (le Wi-Fi qui saute) garde sa place ; il revient avec son jeton et rattrape les commandes manquées ; au-delà : « parti » (voiture neutre) ; 0 = pas de grâce en course
        self.journal_max = 150000        # commandes gardées par salle pour ce rattrapage (au-delà : plus de grâce en course, un joueur coupé est « parti » tout de suite)
        self.exiger_charge = True        # « lancer » refusé tant qu'un joueur n'a pas annoncé (charge) le circuit des réglages
        self.delai_base = 12             # EN_LIGNE_DELAI : le plus petit délai d'entrée (pas de physique) ; au départ le relais l'augmente selon les latences mesurées
        self.delai_max = 120             # EN_LIGNE_DELAI_MAX
        self.delai_marge = 6             # EN_LIGNE_DELAI_MARGE : pas ajoutés au trajet mesuré
        self.pas_ms = 1000.0 / 120       # un pas de physique (REGLAGES.PAS_PHYSIQUE)
        self.mesure_periode = 2.0        # s : le relais mesure lui-même l'aller-retour de chaque client (ping de la connexion websocket) ; 0 = pas de mesure
        self.ping_intervalle = 20        # pings de la bibliothèque (connexions mortes)
        # les garde-fous contre la triche simple (tour 56, T9) : une commande est un entier de 0 à code_max (14 bits : gaz, frein, direction, remise)
        # ou un paquet de 1 à paquet_max entiers ; n est le premier pas du paquet
        self.code_max = (1 << 14) - 1
        self.paquet_max = 128            # pas dans un paquet (le jeu en envoie 4 : EN_LIGNE_PAQUET) ; décision D5 : de 1 à 128 entiers
        self.avance_max = 240            # pas (2 s) : un joueur ne peut pas avoir envoyé plus loin que le plus en retard des autres + ça ; 0 = pas de limite
        for k, v in kw.items():
            if not hasattr(self, k): raise TypeError('réglage inconnu : ' + k)
            setattr(self, k, v)

# les mêmes règles que reseau.js (nomAutorise), mêmes listes que donnees.js (EN_LIGNE_COULEURS)
# (décision D1) le nom sur le fil ne dépend d'aucune langue : l'id d'une couleur (EN_LIGNE_COULEURS), suivi de « -2 » à « -8 » si la couleur est prise ;
# chaque client affiche le nom traduit (« Pilote rouge », « Red driver »)
COULEURS = ('bleu', 'rouge', 'jaune', 'vert', 'orange', 'violet', 'turquoise', 'rose')
_NOM_LIBRE = re.compile(r'^[\w _-]+$')
_NOM_COULEUR = re.compile(r'^(' + '|'.join(COULEURS) + r')(-[2-8])?$')
# (décision D4) la version = EN_LIGNE_VERSION + '-' + l'empreinte des réglages de course du cœur : « 1-3735928559 »
_VERSION = re.compile(r'^[0-9]{1,5}-[0-9]{1,10}$')

def nom_valide(nom, libres, nom_max=20):
    """Le nom (sans espaces autour) : l'id d'une couleur (+ « -2 » à « -8 »), ou libre si on l'autorise (EN_LIGNE_NOMS_LIBRES)."""
    if not isinstance(nom, str): return False
    n = nom.strip()
    if not n or len(n) > nom_max or not n.isprintable(): return False
    if libres: return bool(_NOM_LIBRE.match(n))
    return bool(_NOM_COULEUR.match(n))

def _refuser_constante(x):
    raise ValueError(x)   # NaN, Infinity : pas du JSON permis

def entier(v, lo, hi):
    return isinstance(v, int) and not isinstance(v, bool) and lo <= v <= hi

def reglages_valides(r, humains=2):
    """Les réglages d'une course (comme le cœur, enligne.js reglagesValides) : circuit, tours, meteo, nbIA, rien d'autre ; au plus VOITURES_MAX voitures
    (humains + IA)."""
    if not isinstance(r, dict): return None
    c, m = r.get('circuit'), r.get('meteo')
    if not (isinstance(c, str) and 0 < len(c) <= 40 and m in METEOS): return None
    if not (entier(r.get('tours'), 1, TOURS_MAX) and entier(r.get('nbIA'), 0, IA_MAX)): return None
    if humains + r['nbIA'] > VOITURES_MAX: return None
    out = {'circuit': c, 'tours': r['tours'], 'meteo': m, 'nbIA': r['nbIA']}
    if 'delai' in r:   # le délai d'entrée choisi pour la salle (pas) : la limite d'avance s'y adapte
        if not entier(r['delai'], 1, 240): return None
        out['delai'] = r['delai']
    return out

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
        self.dernier_controle = -1       # le pas de la dernière empreinte reçue (la suivante doit être après)
        self.fin_cmd = 0                 # le pas qui suit la dernière commande reçue de ce joueur (la prochaine doit commencer là ou après)
        self.minuteur = None
        self.ferme = False
        self.jeton = None      # le jeton de retour (tiré à l'entrée en salle)
        self.absent = False    # coupé pendant la grâce : il reste dans la salle, « recharge »
        self.grace_minuteur = None
        self.rtt = None        # son temps d'aller-retour en ms, mesuré par le relais (_mesurer) : le délai d'entrée du départ en dépend
        self.circuit = None    # le circuit que sa page a chargé (message « charge »)
        self.coupe_a = None    # (tour 61) coupé en pleine course : l'instant de la coupure

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
        self.version = None    # celle de son créateur (D4)
        self.reglages = None   # les derniers réglages choisis par l'hôte (renvoyés à qui rejoint ensuite)
        self.journal = []      # (tour 61) la course en cours : ('cmd', de, n, c) et ('parti', id) dans l'ordre où le relais les a diffusés (pour le joueur qui revient)
        self.journal_plein = False
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
        mesureur = asyncio.ensure_future(self._mesurer(c)) if self.cfg.mesure_periode > 0 else None
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
            if mesureur: mesureur.cancel()
            self.par_ip[ip] = self.par_ip.get(ip, 1) - 1
            if self.par_ip[ip] <= 0: self.par_ip.pop(ip, None)

    async def _mesurer(self, c):
        """L'aller-retour du client, mesuré par le relais (ping de la connexion, auquel le navigateur répond tout seul) : ce que le client
        dit de sa latence (champ l des « ping ») n'est PAS cru, un client ne peut pas imposer un délai énorme à toute la salle."""
        try:
            while not c.ferme:
                debut = time.monotonic()
                try:
                    attente = await c.ws.ping()
                    await asyncio.wait_for(attente, 10)
                    ms = (time.monotonic() - debut) * 1000
                    c.rtt = ms if c.rtt is None else c.rtt * 0.7 + ms * 0.3
                except asyncio.TimeoutError:
                    c.rtt = 10000.0
                if c.salle is not None and not c.absent:   # (tour 61) la qualité de la connexion de chacun, pour l'indicateur de la salle et de la course
                    self._diffuser(c.salle, {'t': 'qualite', 'id': c.id, 'ms': int(min(9999, round(c.rtt)))})
                await asyncio.sleep(self.cfg.mesure_periode)
        except (ConnectionClosed, asyncio.CancelledError):
            return

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
        try: m = json.loads(brut, parse_constant=_refuser_constante)
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
            r = reglages_valides(m.get('reglages'), max(len(salle.joueurs), self.cfg.min_pour_lancer))
            if r is None: return self._erreur(c, 'reglages')
            salle.reglages = r
            self._diffuser(salle, {'t': 'reglages', 'reglages': r})
        elif t == 'cmd':
            if salle.commencee and self._cmd_valide(c, salle, m):
                self._noter(salle, ('cmd', c.id, m['n'], m['c']))
                self._diffuser(salle, {'t': 'cmd', 'de': c.id, 'n': m['n'], 'c': m['c']}, sauf=c)
            else: self._faute(c)
        elif t == 'controle':
            h = m.get('h')
            if salle.commencee and entier(m.get('n'), 0, 10 ** 8) and m['n'] > c.dernier_controle and ((isinstance(h, str) and len(h) <= 64) or entier(h, 0, 2 ** 32 - 1)):   # (D5) h : une chaîne de 64 caractères au plus (ou un entier de 32 bits : le cœur compare des entiers) ; n croissant
                c.dernier_controle = m['n']
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
            salle.journal, salle.journal_plein = [], False
            for j in salle.joueurs.values(): j.pret = False
            self._diffuser(salle, {'t': 'retour'})
            self._diffuser(salle, self._liste(salle))
        elif t == 'quitter':
            self._sortir(c)
            self._armer(c)
        else:
            self._faute(c)

    def _cmd_valide(self, c, salle, m):
        """Une commande : n entier, c un entier de 14 bits ou un paquet d'entiers de 14 bits ; jamais en arrière (pas de réécriture du passé),
        jamais trop en avance sur les autres (lockstep : on ne joue pas plus vite que le plus lent). Met à jour fin_cmd si elle passe."""
        n, cmd, cfg = m.get('n'), m.get('c'), self.cfg
        if not entier(n, 0, 10 ** 8): return False
        paquet = cmd if isinstance(cmd, list) else []   # (D5) toujours un tableau de 1 à paquet_max entiers
        if not (1 <= len(paquet) <= cfg.paquet_max and all(entier(x, 0, cfg.code_max) for x in paquet)): return False
        if n < c.fin_cmd: return False
        fin = n + len(paquet)
        if cfg.avance_max:
            autres = [j.fin_cmd for j in salle.joueurs.values() if j is not c]
            delai = (salle.reglages or {}).get('delai') or 12   # EN_LIGNE_DELAI
            if autres and fin > min(autres) + max(cfg.avance_max, 2 * delai + 16): return False   # (le délai adaptatif : jamais refuser une commande honnête)
        c.fin_cmd = fin
        return True

    def _refuser(self, c, raison):
        c.refus += 1
        c.envoyer({'t': 'refus', 'raison': raison})
        if c.refus >= self.cfg.refus_max: c.couper(1008, 'trop de refus')

    def _controle_entree(self, c, m, salle=None):
        """Version et nom : les mêmes règles pour créer et rejoindre. Renvoie la raison du refus, ou None."""
        v = m.get('version')
        if not isinstance(v, str) or not _VERSION.match(v): return 'version'
        if salle is not None:
            if v != salle.version: return 'version'     # (décision D4) la version de la salle est celle de son créateur
        elif self.cfg.version is not None and v != self.cfg.version: return 'version'
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
        salle.version = m['version']
        self._entrer(c, salle, m['nom'].strip())

    def _rejoindre(self, c, m):
        code = m.get('code')
        salle = self.salles.get(code.strip().upper()) if isinstance(code, str) and len(code) <= 8 else None
        if salle is None: return self._refuser(c, 'inconnue')
        if self._retour(c, salle, m): return
        if salle.commencee: return self._refuser(c, 'commencee')
        raison = self._controle_entree(c, m, salle)
        if not raison and len(salle.joueurs) >= self.cfg.max_joueurs: raison = 'pleine'
        nom = None
        if not raison:
            nom = self._nom_libre(salle, m['nom'].strip())
            if nom is None: raison = 'pleine'      # (comme reseau.js : plus de nom libre dans la salle)
        if raison: return self._refuser(c, raison)
        self._entrer(c, salle, nom)

    def _nom_libre(self, salle, nom):
        """D1 : la couleur est prise : « rouge-2 » à « rouge-8 » (comme reseau.js ; avec les noms libres, un nom pris est refusé) ; None si rien n'est libre."""
        pris = {j.nom.lower() for j in salle.joueurs.values()}
        if nom.lower() not in pris: return nom
        if self.cfg.noms_libres: return None
        base = re.sub(r'-[2-8]$', '', nom)
        if base.lower() not in pris: return base
        for k in range(2, 9):
            if '%s-%d' % (base, k) not in pris: return '%s-%d' % (base, k)
        return None

    def _retour(self, c, salle, m):
        """Un joueur qui revient avec son jeton reprend sa place (même id, même rôle d'hôte) ; vrai si c'était lui. Avant le départ : après un rechargement de page
        (grâce de 20 s). En pleine course (tour 61) : après une coupure du Wi-Fi (grâce de 12 s) ; il rattrape alors les commandes qu'il a manquées et
        le relais lui dit où reprendre les siennes. Si l'ancienne connexion n'est pas encore vue comme morte, la nouvelle la remplace (le jeton est secret)."""
        jeton = m.get('jeton')
        if not isinstance(jeton, str) or not jeton: return False
        vieux = next((j for j in salle.joueurs.values() if j is not c and j.jeton and secrets.compare_digest(j.jeton.encode(), jeton.encode())), None)
        if vieux is None: return False
        if self._controle_version(m, salle): self._refuser(c, 'version'); return True
        if salle.commencee and salle.journal_plein: self._refuser(c, 'commencee'); return True   # (trop de commandes à rejouer : la règle d'avant, voiture neutre)
        if vieux.grace_minuteur: vieux.grace_minuteur.cancel()
        remplace = not vieux.absent
        vieux.salle = None
        if remplace: vieux.couper(1000, 'remplacée')
        c.salle, c.id, c.nom, c.pret, c.jeton = salle, vieux.id, vieux.nom, vieux.pret, vieux.jeton
        c.fin_cmd, c.dernier_controle, c.rtt = vieux.fin_cmd, vieux.dernier_controle, vieux.rtt
        if salle.commencee or remplace: c.circuit = vieux.circuit
        salle.joueurs[c.id] = c
        salle.activite = time.monotonic()
        if c.minuteur: c.minuteur.cancel(); c.minuteur = None
        c.envoyer({'t': 'salle', 'code': salle.code, 'toi': c.id, 'hote': salle.hote, 'jeton': c.jeton, 'nom': c.nom})
        if salle.commencee:
            self._diffuser(salle, {'t': 'revenu', 'id': c.id}, sauf=c)
            self._rattraper(c, salle, m)
            c.envoyer({'t': 'reprise', 'fin': c.fin_cmd})   # (le prochain pas de commande que le relais attend de lui : il renvoie ce qu'il a produit depuis)
            return True
        self._diffuser(salle, self._liste(salle))
        if salle.reglages is not None: c.envoyer({'t': 'reglages', 'reglages': salle.reglages})
        return True

    def _rattraper(self, c, salle, m):
        """Rejoue à c ce que les autres ont envoyé pendant sa coupure : m['vu'] = {id: le pas qui suit la dernière commande reçue de cet id}, m['partis'] = les ids déjà vus partis."""
        vu_brut, partis_brut = m.get('vu'), m.get('partis')
        vu = {}
        if isinstance(vu_brut, dict) and len(vu_brut) <= 16:
            for k, v in vu_brut.items():
                if isinstance(k, str) and k.isdigit() and entier(v, 0, 10 ** 8): vu[int(k)] = v
        partis = {x for x in partis_brut if entier(x, 1, 64)} if isinstance(partis_brut, list) and len(partis_brut) <= 16 else set()
        for e in salle.journal:
            if e[0] == 'cmd':
                _, de, n, cm = e
                if de == c.id: continue
                deja = vu.get(de, 0)
                if n + len(cm) <= deja: continue
                if n < deja: n, cm = deja, cm[deja - n:]
                c.envoyer({'t': 'cmd', 'de': de, 'n': n, 'c': cm})
            elif e[1] not in partis:
                c.envoyer({'t': 'parti', 'id': e[1]})

    def _noter(self, salle, entree):
        """Garde ce que le relais diffuse pendant la course (pour un joueur qui revient) ; trop long : on arrête (plus de grâce en course)."""
        if salle.journal_plein or not self.cfg.grace_course: return
        salle.journal.append(entree)
        if len(salle.journal) > self.cfg.journal_max: salle.journal, salle.journal_plein = [], True

    def _controle_version(self, m, salle):
        """Vrai si la version annoncée n'est pas celle de la salle (D4 : celle de son créateur)."""
        v = m.get('version')
        return not isinstance(v, str) or not _VERSION.match(v) or v != salle.version

    def _entrer(self, c, salle, nom):
        c.salle, c.nom, c.pret, c.id = salle, nom, False, salle.suivant
        c.jeton = secrets.token_urlsafe(12)
        salle.suivant += 1
        salle.joueurs[c.id] = c
        if salle.hote is None: salle.hote = c.id
        salle.activite = time.monotonic()
        if c.minuteur: c.minuteur.cancel(); c.minuteur = None
        c.envoyer({'t': 'salle', 'code': salle.code, 'toi': c.id, 'hote': salle.hote, 'jeton': c.jeton, 'nom': c.nom})
        self._diffuser(salle, self._liste(salle))
        if salle.reglages is not None: c.envoyer({'t': 'reglages', 'reglages': salle.reglages})

    def _liste(self, salle):
        liste = []
        for j in salle.joueurs.values():
            x = {'id': j.id, 'nom': j.nom, 'pret': j.pret, 'hote': j.id == salle.hote}
            if j.circuit is not None: x['circuit'] = j.circuit      # (comme reseau.js : « circuit » et « absent » seulement quand ils disent quelque chose)
            if j.absent: x['absent'] = True
            liste.append(x)
        return {'t': 'joueurs', 'liste': liste}

    def _pret(self, c, m):
        salle = c.salle
        if salle.commencee or not isinstance(m.get('pret'), bool): return self._faute(c)
        c.pret = m['pret']
        self._diffuser(salle, self._liste(salle))

    def _lancer(self, c, m):
        salle = c.salle
        if c.id != salle.hote or salle.commencee: return self._erreur(c, 'hote' if c.id != salle.hote else 'commencee')
        reglages = reglages_valides(m.get('reglages'), len(salle.joueurs))
        if reglages is None: return self._erreur(c, 'reglages')
        if len(salle.joueurs) < self.cfg.min_pour_lancer: return self._erreur(c, 'seul')
        if self.cfg.exiger_charge and any(j.circuit != reglages.get('circuit') or j.absent for j in salle.joueurs.values()): return self._erreur(c, 'charge')
        salle.commencee = True
        salle.reglages = reglages   # (le délai de la course règle la limite d'avance)
        for j in salle.joueurs.values(): j.fin_cmd, j.dernier_controle = 0, -1
        salle.journal, salle.journal_plein = [], False
        ordre = list(salle.joueurs)
        self.hasard.shuffle(ordre)
        delai = self._delai(salle)
        if delai is not None: reglages = dict(reglages, delai=delai)
        self._diffuser(salle, {'t': 'depart', 'reglages': reglages, 'graine': secrets.randbelow(2 ** 32), 'ordre': ordre})

    def _delai(self, salle):
        """Le délai d'entrée (en pas) du départ, le même pour tous : le trajet d'une commande entre les deux joueurs les plus lents
        ((rtt A + rtt B) / 2 : chacun passe par le relais), plus une marge, entre delai_base et delai_max. None : aucune latence mesurée."""
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
        if salle.commencee:   # (tour 61) en pleine course : quelques secondes pour que le Wi-Fi revienne ; les autres attendent ses commandes (« On attend… »)
            if self.cfg.grace_course <= 0 or not c.jeton or salle.journal_plein: return self._sortir(c)
            c.absent = True
            self._diffuser(salle, {'t': 'coupe', 'id': c.id}, sauf=c)
            c.grace_minuteur = asyncio.get_running_loop().call_later(self.cfg.grace_course, lambda: self._sortir(c) if c.absent and c.salle is not None else None)
            return
        if self.cfg.grace <= 0 or not c.jeton: return self._sortir(c)
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
        if salle.commencee: self._noter(salle, ('parti', c.id))
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

    async def servir(self, hote='127.0.0.1', port=8765, process_request=None):
        """À utiliser avec « async with » : renvoie le serveur websockets (son port réel dans .sockets).
        process_request (tour 61, serveur/maison.py) : sert aussi des pages HTTP sur le même port, et refuse les adresses qui ne sont pas du réseau local."""
        serveur = serve(self.gerer, hote, port, origins=self.cfg.origines, max_size=self.cfg.max_octets, ping_interval=self.cfg.ping_intervalle, compression=None, process_request=process_request)
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
    cfg = Config(version=args.version, noms_libres=args.noms_libres, max_par_ip=args.max_par_ip, origines=[o.strip() for o in args.origines.split(',') if o.strip()] if args.origines else None)
    relais = Relais(cfg)
    async with await relais.servir(args.hote, args.port) as s:
        journal.info('relais prêt sur %s:%d (version %s)', args.hote, s.port, cfg.version or 'celle du créateur de chaque salle')
        await asyncio.Future()

if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Serveur relais des batailles en ligne de Grand Prix Dynasty')
    p.add_argument('--hote', default=os.environ.get('RELAIS_HOTE', '127.0.0.1'), help='adresse d écoute (127.0.0.1 : cet ordinateur seulement ; 0.0.0.0 : tout le réseau)')
    p.add_argument('--port', type=int, default=int(os.environ.get('PORT', 8765)))
    p.add_argument('--version', default=os.environ.get('RELAIS_VERSION') or None, help='imposer la version que le créateur d une salle doit annoncer (« 1-3735928559 ») ; sans cela, la version d une salle est celle de son créateur')
    p.add_argument('--noms-libres', action='store_true', help='noms tapés librement (interdit au public d enfants)')
    p.add_argument('--max-par-ip', type=int, default=24, help='connexions par adresse (0 = pas de limite, à mettre derrière un proxy)')
    p.add_argument('--origines', default=os.environ.get('RELAIS_ORIGINES') or None, help='les pages permises, séparées par des virgules (« https://exemple.fr,https://autre.fr ») ; sans cela, toute page peut se connecter')
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
    try: asyncio.run(principal(p.parse_args()))
    except KeyboardInterrupt: pass
