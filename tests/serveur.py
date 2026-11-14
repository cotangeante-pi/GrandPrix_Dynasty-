#!/usr/bin/env python3
"""Le serveur relais des batailles en ligne (tour 56, T3) : python3 tests/serveur.py
Lance serveur/relais.py dans ce processus (port libre, délais courts) et le fait parler par de VRAIS clients websockets :
créer, rejoindre, refus (inconnue, pleine, commencée, version, nom), prêt, lancer (hôte seul), départ (graine, ordre), relais des
commandes dans l'ordre, empreintes, émotes préréglées, ping, hôte qui part, salle vide, limites (taille, cadence, JSON faux, noms,
connexions par adresse, trame binaire), salles qui expirent. Il faut le paquet websockets (pip install websockets)."""
import asyncio, json, os, re, sys, time
try:
    from websockets.asyncio.client import connect
    from websockets.exceptions import ConnectionClosed
except ImportError:
    print('RESULTAT 0/1 (websockets absent : pip install websockets)'); sys.exit(1)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'serveur'))
import relais as R

L, RES = [], {'ok': 0, 'ko': 0}
V = '1-3735928559'   # une version « EN_LIGNE_VERSION-empreinte » (décision D4)
def t(nom, cond, detail=''):
    RES['ok' if cond else 'ko'] += 1
    L.append(('✔ ' if cond else '✘ ') + nom + ('' if cond or not detail else ' — ' + str(detail)[:600]))

class C:
    """Un client de test : envoie des objets, lit des objets."""
    def __init__(self, ws): self.ws = ws; self.recus = []
    async def env(self, **m): await self.ws.send(json.dumps(m))
    async def lire(self, delai=3.0):
        return json.loads(await asyncio.wait_for(self.ws.recv(), delai))
    async def jusqua(self, type_, delai=3.0):
        """Lit jusqu'à un message de ce type (les autres sont gardés dans self.recus)."""
        fin = time.monotonic() + delai
        while True:
            m = await self.lire(max(0.05, fin - time.monotonic()))
            self.recus.append(m)
            if m.get('t') == type_: return m
    async def silence(self, delai=0.25):
        try: m = await self.lire(delai)
        except asyncio.TimeoutError: return None
        except ConnectionClosed: return 'FERME'
        return m
    async def ferme(self, delai=3.0):
        """Vrai si le serveur coupe la connexion (et le code de coupure)."""
        try:
            while True: await asyncio.wait_for(self.ws.recv(), delai)
        except ConnectionClosed as e: return e.rcvd.code if e.rcvd else 1006
        except asyncio.TimeoutError: return None

async def ouvre(port, nom=None, code=None, version=V, creer=False):
    ws = await connect(f'ws://127.0.0.1:{port}', open_timeout=5)
    c = C(ws)
    if creer: await c.env(t='creer', nom=nom, version=version)
    elif code: await c.env(t='rejoindre', code=code, nom=nom, version=version)
    return c

async def salle_de(port, noms, lancee=False):
    """Une salle avec ces joueurs (le premier est l'hôte) : renvoie (code, [clients])."""
    h = await ouvre(port, noms[0], creer=True)
    sa = await h.jusqua('salle'); cl = [h]
    for n in noms[1:]:
        c = await ouvre(port, n, code=sa['code']); await c.jusqua('salle'); cl.append(c)
    if lancee:
        for c in cl[1:]: await c.env(t='pret', pret=True)
        await asyncio.sleep(0.15)
        await h.env(t='lancer', reglages={'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4})
        for c in cl: await c.jusqua('depart')
    return sa['code'], cl

async def fin(clients):
    for c in clients:
        try: await c.ws.close()
        except Exception: pass

async def tests_principaux(port, rel):
    # --- créer ---
    h = await ouvre(port, 'bleu', creer=True)
    sa = await h.jusqua('salle')
    t('créer : le code a 4 lettres sans voyelle ni Y', re.fullmatch(r'[BCDFGHJKLMNPQRSTVWXZ]{4}', sa['code']), sa['code'])
    t('créer : on est le joueur 1 et l’hôte', sa['toi'] == 1 and sa['hote'] == 1, sa)
    j = await h.jusqua('joueurs')
    t('créer : la liste des joueurs donne id, nom, prêt, hôte', j['liste'] == [{'id': 1, 'nom': 'bleu', 'pret': False, 'hote': True}], j)
    # --- rejoindre (le code passe aussi en minuscules) ---
    b = await ouvre(port, 'rouge', code=sa['code'].lower())
    sb = await b.jusqua('salle')
    t('rejoindre : id 2, l’hôte reste le 1', sb['toi'] == 2 and sb['hote'] == 1 and sb['code'] == sa['code'], sb)
    jh = await h.jusqua('joueurs'); jb = await b.jusqua('joueurs')
    t('rejoindre : tout le monde reçoit la même liste à 2', jh['liste'] == jb['liste'] and len(jh['liste']) == 2 and jh['liste'][1]['nom'] == 'rouge', jh)
    # --- refus ---
    async def refus(**m):
        c = await ouvre(port); await c.env(**m)
        r = await c.lire(); await c.ws.close(); return r
    t('refus « inconnue » : un code qui n’existe pas', await refus(t='rejoindre', code='BCDF', nom='jaune', version=V) == {'t': 'refus', 'raison': 'inconnue'})
    t('refus « inconnue » : un code absurde (pas un texte, trop long)', all([(await refus(t='rejoindre', code=c, nom='jaune', version=V))['raison'] == 'inconnue' for c in (None, 12, 'A' * 500, '')]))
    t('refus « version » : à la création et en rejoignant', (await refus(t='creer', nom='jaune', version='0'))['raison'] == 'version' and (await refus(t='rejoindre', code=sa['code'], nom='jaune', version='1-2'))['raison'] == 'version')
    t('refus « version » : version absente ou d’un mauvais type', all([(await refus(t='creer', nom='jaune', version=v))['raison'] == 'version' for v in (None, [1], True, {'a': 1})]))
    t('refus « nom » : un nom déjà pris dans la salle (même en minuscules)', (await refus(t='rejoindre', code=sa['code'], nom='bleu', version=V))['raison'] == 'nom')
    t('refus « nom » : texte libre, vide, trop long, balises, pas un texte', all([(await refus(t='creer', nom=n, version=V))['raison'] == 'nom' for n in ('Salut les copains je suis nul', '', ' ', 'x' * 40, '<b>x</b>', 'a\nb', None, 5, 'Pilote 0', 'Pilote 100', 'Léa', 'Éclair Mauve', 'jaune Rouge Bleu')]))
    t('noms permis (D1) : l’id d’une couleur, avec « -2 » à « -8 » si elle est prise', all(['code' in await refus_ok(port, n) for n in ('turquoise', 'rose-2', 'violet-8', ' orange ')]))
    t('noms refusés (D1) : un nom traduit ou d’une ancienne liste, un suffixe hors 2 à 8, des majuscules', all([(await refus(t='creer', nom=n, version=V))['raison'] == 'nom' for n in ('Pilote rouge', 'Pilote 3', 'Éclair', 'Rouge', 'rouge-1', 'rouge-9', 'rouge-10', 'rouge-', 'rouge 2', 'bleu-2-2', 'red')]))
    # --- réglages choisis par l'hôte ---
    rg = {'circuit': 'spa', 'tours': 5, 'meteo': 'pluie', 'nbIA': 2}
    await b.env(t='reglages', reglages=rg); r = await b.jusqua('erreur')
    t('réglages : refusés à qui n’est pas l’hôte, rien n’est diffusé', r['raison'] == 'hote' and await h.silence() is None, r)
    await h.env(t='reglages', reglages={'circuit': 'a', 'tours': 0, 'meteo': 'sec', 'nbIA': 0}); r = await h.jusqua('erreur'); t('réglages : faux refusés', r['raison'] == 'reglages', r)
    await h.env(t='reglages', reglages=rg)
    t('réglages : renvoyés à tous, l’hôte compris', await h.jusqua('reglages') == {'t': 'reglages', 'reglages': rg} and await b.jusqua('reglages') == {'t': 'reglages', 'reglages': rg})
    c3 = await ouvre(port, 'jaune', code=sa['code']); await c3.jusqua('salle'); r = await c3.jusqua('reglages')
    t('réglages : gardés et envoyés à qui rejoint ensuite', r == {'t': 'reglages', 'reglages': rg}, r)
    await c3.env(t='quitter'); await h.jusqua('parti'); await b.jusqua('parti'); await h.silence(); await b.silence()
    # --- prêt, lancer ---
    await b.env(t='pret', pret=True)
    jh = await h.jusqua('joueurs'); await b.jusqua('joueurs')
    t('prêt : la liste montre le joueur 2 prêt', jh['liste'][1]['pret'] is True, jh)
    await b.env(t='lancer', reglages={'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4})
    r = await b.jusqua('erreur')
    t('lancer : un joueur qui n’est pas l’hôte est refusé', r['raison'] == 'hote' and await h.silence() is None, r)
    await b.env(t='cmd', n=1, c=[1]); t('cmd avant le départ : rien n’est relayé', await h.silence() is None)
    await b.env(t='pret', pret=False); await h.jusqua('joueurs'); await b.jusqua('joueurs')
    await h.env(t='lancer', reglages={'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4, 'x': 1}); r = await h.silence(0.3)
    t('lancer : « prêt » est informatif (pas prêt, le lancer part quand même)', r and r['t'] == 'depart' and r['reglages'] == {'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4}, r)
    await b.jusqua('depart'); await h.env(t='retour'); await h.jusqua('retour'); await b.jusqua('retour'); await h.jusqua('joueurs'); await b.jusqua('joueurs')
    await h.silence(0.2); await b.silence(0.2)
    await b.env(t='pret', pret=True); await h.jusqua('joueurs'); await b.jusqua('joueurs')
    for mauvais in ({'tours': 0}, {'circuit': 'monza', 'tours': 31, 'meteo': 'sec', 'nbIA': 0}, {'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 99}, 'texte', {'circuit': 'x' * 100, 'tours': 3, 'meteo': 'sec', 'nbIA': 0}, {'circuit': '', 'tours': 3, 'meteo': 'sec', 'nbIA': 0}, {'circuit': 'monza', 'tours': '3', 'meteo': 'sec', 'nbIA': 0}):
        await h.env(t='lancer', reglages=mauvais)
        r = await h.jusqua('erreur'); assert r['raison'] == 'reglages', (mauvais, r)
    t('lancer : réglages faux refusés (tours, nbIA, tailles, types, champs manquants)', True)
    await h.env(t='lancer', reglages={'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4})
    dh, db = await h.jusqua('depart'), await b.jusqua('depart')
    t('départ : mêmes réglages, même graine, même ordre pour tous', dh == db and dh['reglages'] == {'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4}, (dh, db))
    t('départ : graine entière 32 bits, ordre = les deux ids', isinstance(dh['graine'], int) and 0 <= dh['graine'] < 2 ** 32 and sorted(dh['ordre']) == [1, 2], dh)
    # --- salle commencée ---
    t('refus « commencee » : on ne rejoint pas une salle commencée', (await refus(t='rejoindre', code=sa['code'], nom='jaune', version=V))['raison'] == 'commencee')
    await h.env(t='lancer', reglages={'tours': 1}); r = await h.jusqua('erreur'); t('lancer deux fois : refusé', r['raison'] == 'commencee', r)
    # --- retour à la salle ---
    await b.env(t='retour'); r = await b.jusqua('erreur'); t('retour : refusé à qui n’est pas l’hôte', r['raison'] == 'hote' and await h.silence() is None, r)
    # --- relais ---
    for n in range(1, 41): await h.env(t='cmd', n=n, c=[n % 7])
    await b.env(t='cmd', n=1, c=[16383, 0, 5]); await h.env(t='controle', n=300, h='123456789'); await h.env(t='emote', i=3)
    recus = []
    while len(recus) < 42:
        recus.append(await b.lire())
    cmds = [m for m in recus if m['t'] == 'cmd']
    t('relais : 40 commandes dans l’ordre, avec « de » et sans modification', [m['n'] for m in cmds] == list(range(1, 41)) and all(m['de'] == 1 and m['c'] == [m['n'] % 7] for m in cmds), cmds[:3])
    t('relais : empreinte de contrôle et émote arrivent aux autres', {'t': 'controle', 'de': 1, 'n': 300, 'h': '123456789'} in recus and {'t': 'emote', 'de': 1, 'i': 3} in recus, recus[-3:])
    m = await h.jusqua('cmd')
    t('relais : l’autre sens aussi (paquet gardé tel quel)', m == {'t': 'cmd', 'de': 2, 'n': 1, 'c': [16383, 0, 5]}, m)
    t('relais : l’expéditeur ne reçoit pas ses propres messages', await h.silence() is None)
    # --- ping ---
    await h.env(t='ping', h=42); t('ping : pong avec la même valeur', await h.lire() == {'t': 'pong', 'h': 42})
    await h.env(t='ping', h={'x': 1}); t('ping : valeur absurde, pong sans elle', await h.lire() == {'t': 'pong', 'h': None})
    # --- émotes ---
    await h.env(t='emote', i=8); await h.env(t='emote', i=99); await h.env(t='emote', i='bonjour'); await h.env(t='emote', i=-1); await h.env(t='emote', i=True)
    t('émote : seulement un indice préréglé (pas de texte, pas hors liste)', await b.silence() is None)
    await h.env(t='emote', i=1); await h.env(t='emote', i=2); await asyncio.sleep(0.1)
    e = await b.silence(); t('émote : deux émotes en moins de 0,5 s, la 2e est jetée', e == {'t': 'emote', 'de': 1, 'i': 1} and await b.silence() is None, e)
    # --- hôte qui part, salle vide ---
    await h.env(t='quitter')
    p = await b.jusqua('parti'); nh = await b.jusqua('nouvel-hote')
    t('hôte qui part : « parti » puis « nouvel-hote » = le suivant', p == {'t': 'parti', 'id': 1} and nh == {'t': 'nouvel-hote', 'id': 2}, (p, nh))
    t('hôte parti : la salle existe encore tant qu’il reste un joueur', sa['code'] in rel.salles)
    await b.ws.close(); await asyncio.sleep(0.2)
    t('salle vide : elle disparaît quand le dernier part', sa['code'] not in rel.salles and not rel.salles, list(rel.salles))
    await h.ws.close()

async def refus_ok(port, nom):
    c = await ouvre(port, nom, creer=True)
    r = await c.lire(); await c.ws.close(); return r

async def tests_salles(port, rel):
    # --- 8 joueurs, la 9e est refusée ---
    code, cl = await salle_de(port, ['bleu', 'rouge', 'jaune', 'vert', 'orange', 'violet', 'turquoise', 'rose'])
    c9 = await ouvre(port, 'bleu-2', code=code); r = await c9.lire()
    t('salle pleine : 8 joueurs, le 9e reçoit « pleine »', r == {'t': 'refus', 'raison': 'pleine'}, r)
    liste = None
    for c in cl:
        while True:
            m = await c.lire()
            if m['t'] == 'joueurs' and len(m['liste']) == 8: liste = m['liste']; break
    t('salle pleine : les ids vont de 1 à 8, un seul hôte', [x['id'] for x in liste] == list(range(1, 9)) and sum(x['hote'] for x in liste) == 1, liste)
    await fin(cl + [c9])
    await asyncio.sleep(0.2)
    # --- l'hôte qui part avant le départ : la liste est renvoyée avec le bon hôte ---
    code, (h, b, c) = await salle_de(port, ['bleu', 'rouge', 'jaune'])
    await h.ws.close()
    nh = await b.jusqua('nouvel-hote'); await c.jusqua('nouvel-hote')
    j = None
    while True:
        j = await b.lire()
        if j['t'] == 'joueurs' and len(j['liste']) == 2: break
    t('hôte qui part avant le départ : le 2 devient hôte, la liste suit', nh['id'] == 2 and [(x['id'], x['hote']) for x in j['liste']] == [(2, True), (3, False)], j)
    await b.env(t='quitter'); await c.jusqua('parti')
    t('« quitter » : le joueur reste connecté et peut créer une autre salle', True)
    await b.env(t='creer', nom='rouge', version=V); s2 = await b.jusqua('salle')
    t('« quitter » puis créer : une autre salle, un autre code', s2['code'] != code and s2['toi'] == 1, s2)
    await fin([b, c]); await asyncio.sleep(0.2)
    # --- lancer seul refusé ; retour : la salle rouvre, prêts à faux, on relance et on accueille ---
    h = await ouvre(port, 'bleu', creer=True); sa = await h.jusqua('salle')
    await h.env(t='lancer', reglages={'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4}); r = await h.jusqua('erreur')
    t('lancer : un joueur seul ne lance pas (2 au moins)', r['raison'] == 'seul', r)
    await h.env(t='retour'); r = await h.jusqua('erreur'); t('retour : refusé avant la course', r['raison'] == 'pas-commencee', r)
    await fin([h]); await asyncio.sleep(0.2)
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'])
    await b.env(t='pret', pret=True); await asyncio.sleep(0.1)
    await h.env(t='lancer', reglages={'circuit': 'monza', 'tours': 3, 'meteo': 'sec', 'nbIA': 4})
    await h.jusqua('depart'); await b.jusqua('depart')
    await h.env(t='retour')
    t('retour : renvoyé à tous', await h.jusqua('retour') == {'t': 'retour'} and await b.jusqua('retour') == {'t': 'retour'})
    j = await b.jusqua('joueurs'); t('retour : les « prêt » repassent à faux', all(not x['pret'] for x in j['liste']) and len(j['liste']) == 2, j)
    c3 = await ouvre(port, 'jaune', code=code); r = await c3.jusqua('salle')
    t('retour : la salle est rouverte (un nouveau peut entrer)', r['code'] == code, r)
    await h.env(t='lancer', reglages={'circuit': 'spa', 'tours': 2, 'meteo': 'sec', 'nbIA': 0}); d = await b.jusqua('depart')
    t('retour : on peut relancer, nouvelle graine possible', d['reglages']['circuit'] == 'spa' and sorted(d['ordre']) == [1, 2, 3], d)
    await fin([h, b, c3]); await asyncio.sleep(0.2)
    # --- « parti » vient APRÈS la dernière cmd du joueur (même file), paquets de 4 entiers de 14 bits (cœur lockstep) ---
    code, (h, b, c) = await salle_de(port, ['bleu', 'rouge', 'jaune'], lancee=True)
    for n in range(0, 800, 4): await c.env(t='cmd', n=n, c=[(n * 37 + k) % 16384 for k in range(4)])
    await c.ws.close()
    for x in (h, b):
        ms = []
        while True:
            m = await x.lire()
            if m['t'] in ('cmd', 'parti'): ms.append(m)
            if m['t'] == 'parti': break
        t('en course : 200 paquets de 4 entiers 14 bits arrivent dans l’ordre, puis « parti » en dernier', [m['n'] for m in ms[:-1]] == list(range(0, 800, 4)) and ms[-1] == {'t': 'parti', 'id': 3} and ms[0]['c'] == [0, 1, 2, 3], (len(ms), ms[-1]))
    await fin([h, b]); await asyncio.sleep(0.2)
    # --- une partie : un joueur parti en pleine course ---
    code, (h, b, c) = await salle_de(port, ['bleu', 'rouge', 'jaune'], lancee=True)
    await c.ws.close()
    p = await h.jusqua('parti')
    t('en course : un joueur qui part est annoncé (« parti »), la course continue', p == {'t': 'parti', 'id': 3}, p)
    await b.env(t='cmd', n=5, c=[1]); m = await h.jusqua('cmd')
    t('en course : les commandes des restants circulent toujours', m['de'] == 2 and m['n'] == 5)
    await h.ws.close(); await b.jusqua('nouvel-hote')
    await b.ws.close(); await asyncio.sleep(0.2)
    t('en course : quand tous sont partis la salle disparaît', code not in rel.salles)

async def tests_limites(port, rel):
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'], lancee=True)
    # JSON faux, pas un objet, types faux : ignorés, la connexion tient
    for brut in ('pas du json', '[1,2]', '"cmd"', '{"t":5}', '{"t":"inconnu"}', '{"t":"cmd","n":-1,"c":[]}', '{"t":"cmd","n":"a","c":[]}', '{"t":"cmd","n":1}', '{"t":"controle","n":1,"h":[1]}'):
        await b.ws.send(brut)
    await b.ws.send(json.dumps({'t': 'cmd', 'n': 9, 'c': [2]}))
    m = await h.lire(); t('messages faux (JSON, types, sans « c ») : jetés sans couper, le suivant passe', m == {'t': 'cmd', 'de': 2, 'n': 9, 'c': [2]}, m)
    await b.ws.send(b'\x00\x01'); t('trame binaire : ignorée', await h.silence() is None)
    # trop gros : la bibliothèque coupe (1009)
    await b.ws.send(json.dumps({'t': 'cmd', 'n': 1, 'c': 'x' * 6000}))
    cd = await b.ferme(); t('message trop gros (> 4096 octets) : la connexion est coupée (1009)', cd == 1009, cd)
    await h.jusqua('parti')
    await fin([h])
    # cadence : 5000 messages d'un coup, le serveur n'en relaie qu'une partie et reste debout
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'], lancee=True)
    for n in range(5000): await b.ws.send(json.dumps({'t': 'cmd', 'n': n, 'c': [1]}))
    recus = 0
    while await h.silence(0.5) is not None: recus += 1
    t('cadence : 5000 messages en rafale, bien moins sont relayés', 0 < recus < 1500, recus)
    await h.env(t='ping', h=1); t('cadence : le serveur répond encore après la rafale', (await h.lire())['t'] == 'pong')
    await fin([h, b])
    # trop de messages absurdes : coupé
    c = await ouvre(port, 'turquoise', creer=True); await c.jusqua('salle')
    try:
        for _ in range(400): await c.ws.send('rien')
    except ConnectionClosed: pass
    cd = await c.ferme(); t('400 messages absurdes : la connexion est coupée (1008)', cd == 1008, repr(cd))
    # qui devine des codes
    c = await ouvre(port)
    for i in range(20):
        try: await c.env(t='rejoindre', code='BCD' + 'FGHJKLMNPQRS'[i % 12], nom='bleu', version=V)
        except ConnectionClosed: break
    cd = await c.ferme(); t('qui devine des codes : coupé après 12 refus (1008)', cd == 1008, repr(cd))
    # connexion muette : coupée
    c = await ouvre(port); cd = await c.ferme(5); t('une connexion qui ne crée ni ne rejoint rien est coupée (1008)', cd == 1008, cd)
    # des messages de salle sans salle : faute, pas de plantage
    c = await ouvre(port); await c.env(t='cmd', n=1, c=[1]); await c.env(t='lancer', reglages={}); await c.env(t='pret', pret=True)
    await c.env(t='ping', h=7); t('hors salle : cmd, lancer, prêt sont ignorés, ping répond', (await c.lire()) == {'t': 'pong', 'h': 7}); await fin([c])

async def vider(x, delai=0.3):
    """Tout ce que x a reçu en attendant un peu."""
    ms = []
    while True:
        m = await x.silence(delai)
        if m is None: return ms
        ms.append(m)

async def tests_garde_fous(port, rel):
    """(tour 56, T9) la triche simple : des commandes hors format, qui reviennent en arrière, ou qui jouent trop en avance sur les autres."""
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'], lancee=True)
    # le passé ne se réécrit pas : un paquet qui recouvre le précédent est jeté, le suivant (qui le prolonge) passe
    for n in (10, 12, 14, 13, 9, 18): await h.env(t='cmd', n=n, c=[1, 2, 3, 4])
    ns = [m['n'] for m in await vider(b) if m['t'] == 'cmd']
    t('garde-fou : un paquet qui recouvre le précédent (retour en arrière) est jeté, le suivant passe', ns == [10, 14, 18], ns)
    # le format : entier de 14 bits ou paquet de 1 à 32 entiers de 14 bits
    mauvais = [-1, 16384, 1.5, 'x', True, None, [], [1] * 129, 7, 16383, [1, 'a'], [[1]], {'a': 1}, [1, 2.0 + 0.5]]
    for k, c in enumerate(mauvais): await b.env(t='cmd', n=100 + 40 * k, c=c)
    await b.ws.send('{"t":"cmd","n":900,"c":[NaN]}'); await b.ws.send('{"t":"cmd","n":900,"c":[Infinity]}')
    await b.env(t='cmd', n=22, c=[16383])   # (h a envoyé jusqu'au pas 22 : b peut le suivre de 240 pas)
    await b.env(t='cmd', n=23, c=[0] * 128)
    ms = [m for m in await vider(h) if m['t'] == 'cmd']
    t('garde-fou : commande hors format (négative, trop grande, décimale, texte, vide, trop longue, NaN, objet) jetée ; un paquet d’entiers de 14 bits (jusqu’à 128) passe ; un entier seul est refusé (D5)', [m['n'] for m in ms] == [22, 23], ms)
    await fin([h, b]); await asyncio.sleep(0.2)
    # pas en avance : le lockstep attend le plus lent, donc personne ne peut avoir envoyé plus de 240 pas au-delà de lui
    code, (h, b, c3) = await salle_de(port, ['bleu', 'rouge', 'jaune'], lancee=True)
    for n in range(0, 400, 4): await h.env(t='cmd', n=n, c=[1, 1, 1, 1])
    ms = [m['n'] for m in await vider(b) if m['t'] == 'cmd']
    t('garde-fou : les autres n’ont rien envoyé : au plus 240 pas d’avance (60 paquets de 4), le reste est jeté', ms == list(range(0, 240, 4)), (len(ms), ms[-3:]))
    await b.env(t='cmd', n=0, c=[1] * 8); await c3.env(t='cmd', n=0, c=[1] * 8); await asyncio.sleep(0.2)
    await h.env(t='cmd', n=240, c=[1, 1, 1, 1])
    ms = [m['n'] for m in await vider(b) if m['t'] == 'cmd']
    t('garde-fou : quand les autres avancent, la limite avance avec le plus lent (8 pas chacun : 248 permis, 240 passe)', 240 in ms, ms)
    # un joueur parti ne bloque plus les autres
    await c3.ws.close(); await h.jusqua('parti'); await b.env(t='cmd', n=8, c=[1] * 8); await asyncio.sleep(0.2); await vider(h)
    await h.env(t='cmd', n=244, c=[1, 1, 1, 1]); await h.env(t='cmd', n=248, c=[1, 1, 1, 1]); await h.env(t='cmd', n=252, c=[1, 1, 1, 1]); await h.env(t='cmd', n=256, c=[1, 1, 1, 1])
    ms = [m['n'] for m in await vider(b) if m['t'] == 'cmd']
    t('garde-fou : la limite se règle sur ceux qui restent (le parti ne bloque personne) : 244 à 252 passent (fin 256 = 16 + 240), 256 (fin 260) est jeté', ms == [244, 248, 252], ms)
    await fin([h, b]); await asyncio.sleep(0.2)
    # une nouvelle course dans la même salle repart de zéro
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'], lancee=True)
    await h.env(t='cmd', n=0, c=[1] * 8); await b.env(t='cmd', n=0, c=[1] * 8); await vider(h); await vider(b)
    await h.env(t='retour'); await b.jusqua('retour')
    await h.env(t='lancer', reglages={'circuit': 'test', 'tours': 1, 'meteo': 'sec', 'nbIA': 0}); await b.jusqua('depart'); await h.jusqua('depart')
    await h.env(t='cmd', n=0, c=[1, 2]); m = await b.jusqua('cmd')
    t('garde-fou : après « retour » et un nouveau départ, les pas repartent de 0', m['n'] == 0, m)
    # trop de commandes fausses : la connexion est coupée (1008)
    for _ in range(260): await b.ws.send(json.dumps({'t': 'cmd', 'n': 0, 'c': -1}))
    cd = await b.ferme(); t('garde-fou : 200 commandes fausses de suite : la connexion est coupée (1008)', cd == 1008, repr(cd))
    await fin([h])

async def tests_decisions(port, rel):
    """(décisions D3, D4, D5 du Chef, mêmes règles que reseau.js) bornes du cœur, version comparée au créateur, cmd et contrôle mal formés."""
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'])
    R0 = {'circuit': 'test', 'tours': 3, 'meteo': 'sec', 'nbIA': 3}
    for nom, r in (('plus de 30 tours', dict(R0, tours=31)), ('0 tour', dict(R0, tours=0)), ('plus de 8 IA', dict(R0, nbIA=9)), ('2 humains + 15 IA = 17 voitures', dict(R0, nbIA=15)),
                   ('une météo hors de la liste du cœur', dict(R0, meteo='neige')), ('un champ en plus manquant', {'circuit': 'test'}), ('des tours décimaux', dict(R0, tours=2.5))):
        await h.env(t='reglages', reglages=r); e = await h.jusqua('erreur')
        t(f'D3 : réglages refusés ({nom}) : {{t:"erreur", raison:"reglages"}}', e == {'t': 'erreur', 'raison': 'reglages'}, e)
    await h.env(t='lancer', reglages=dict(R0, nbIA=9)); e = await h.jusqua('erreur'); t('D3 : un lancer hors bornes est refusé de même', e['raison'] == 'reglages', e)
    for meteo in ('auto', 'sec', 'pluie', 'averse', 'eclaircie'):
        await h.env(t='reglages', reglages=dict(R0, meteo=meteo, tours=30, nbIA=8)); m = await b.jusqua('reglages')
        t(f'D3 : bornes pleines (30 tours, 8 IA, météo « {meteo} ») acceptées et relayées', m['reglages']['meteo'] == meteo and m['reglages']['tours'] == 30, m)
    await h.env(t='lancer', reglages=dict(R0, nbIA=8)); d = await b.jusqua('depart'); t('D3 : on lance avec les bornes pleines', d['reglages']['nbIA'] == 8, d)
    await fin([h, b]); await asyncio.sleep(0.2)
    # --- D4 : la version de la salle est celle de son créateur
    h = await ouvre(port, 'bleu', creer=True, version='1-111'); sa = await h.jusqua('salle')
    for v_, ok in (('1-222', False), ('2-111', False), ('1-111', True)):
        c = await ouvre(port, 'rouge', code=sa['code'], version=v_)
        m = await c.lire(); t(f'D4 : rejoindre avec la version « {v_} » dans une salle « 1-111 » : ' + ('accepté' if ok else 'refusé (« version »)'), (m['t'] == 'salle') if ok else m == {'t': 'refus', 'raison': 'version'}, m)
        await fin([c]); await asyncio.sleep(0.1)
    await fin([h])
    t('D4 : une version mal formée est refusée à la création', all([(await refus_v(port, v_)) for v_ in ('1', 1, '1-', '-1', 'a-b', '1-1-1', '1-' + '9' * 11, '', None, ['1-1'])]))
    t('D4 : deux salles de versions différentes coexistent', await deux_versions(port))
    # --- D5 : cmd et controle mal formés, n croissant, h une chaîne de 64 au plus
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'], lancee=True)
    await b.env(t='controle', n=120, h='abc'); await b.env(t='controle', n=120, h='dup'); await b.env(t='controle', n=60, h='arriere')
    await b.env(t='controle', n=240, h=12345); await b.env(t='controle', n=360, h='x' * 65); await b.env(t='controle', n=-1, h='a'); await b.env(t='controle', n=480, h=['a'])
    await b.env(t='controle', n=600, h='x' * 64); await b.env(t='cmd', n=0, c=[1]); await b.env(t='cmd', n=1, c=5)
    ms = [(m['t'], m['n']) for m in await vider(h)]
    t('D5 : controle : h doit être une chaîne de 64 caractères au plus et n croissant ; cmd : c doit être un tableau (un entier seul est refusé)', ms == [('controle', 120), ('controle', 600), ('cmd', 0)], ms)
    await fin([h, b])

async def refus_v(port, v_):
    c = await ouvre(port, 'bleu', creer=True, version=v_)
    m = await c.lire(); await fin([c]); return m == {'t': 'refus', 'raison': 'version'}

async def deux_versions(port):
    a = await ouvre(port, 'bleu', creer=True, version='1-1'); b = await ouvre(port, 'bleu', creer=True, version='1-2')
    ma, mb = await a.lire(), await b.lire(); await fin([a, b])
    return ma['t'] == 'salle' and mb['t'] == 'salle' and ma['code'] != mb['code']

async def tests_expiration(port, rel):
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'])
    cd = await h.ferme(6)
    t('salle en attente muette : elle expire et ses joueurs sont coupés (1001)', cd == 1001 and await b.ferme(2) == 1001, cd)
    await asyncio.sleep(0.2); t('salle expirée : elle disparaît', code not in rel.salles)
    code, (h, b) = await salle_de(port, ['bleu', 'rouge'], lancee=True)
    await asyncio.sleep(0.6)
    await h.env(t='cmd', n=1, c=[0]); await b.jusqua('cmd')
    t('salle commencée : elle dure plus longtemps tant qu’on y parle', code in rel.salles)
    cd = await h.ferme(8)
    t('salle commencée muette : elle expire aussi', cd == 1001, cd)
    await fin([h, b])

async def tests_adresse(port, rel):
    cs = [await ouvre(port) for _ in range(3)]
    c4 = await connect(f'ws://127.0.0.1:{port}', open_timeout=5)
    try: await asyncio.wait_for(c4.recv(), 2); cd = None
    except ConnectionClosed as e: cd = e.rcvd.code if e.rcvd else 1006
    except asyncio.TimeoutError: cd = None
    t('trop de connexions d’une même adresse : la 4e est coupée (1013)', cd == 1013, cd)
    await fin(cs)

async def tests_noms_libres(port, rel):
    c = await ouvre(port, 'Salut les copains', creer=True); r = await c.lire()
    t('noms libres (si on l’autorise) : un nom tapé passe', r['t'] == 'salle', r); await fin([c])

async def lance(cfg, test):
    rel = R.Relais(cfg)
    async with await rel.servir('127.0.0.1', 0) as s:
        await test(s.port, rel)

async def tout():
    base = dict(delai_arrivee=1.5, delai_emote=0.5, nettoyage=0.2, avance_max=0)   # (avance_max 0 : les parties d'avant ne connaissent pas la limite d'avance ; la partie « garde-fous » la règle)
    for nom, cfg, f in (
        ('principal', R.Config(**base), tests_principaux), ('salles', R.Config(**base), tests_salles), ('limites', R.Config(**base), tests_limites),
        ('expiration', R.Config(attente_salle=1.0, attente_course=1.5, **base), tests_expiration),
        ('garde-fous', R.Config(**dict(base, avance_max=240)), tests_garde_fous), ('décisions', R.Config(**base), tests_decisions), ('adresse', R.Config(max_par_ip=3, **base), tests_adresse), ('noms libres', R.Config(noms_libres=True, **base), tests_noms_libres)):
        try: await asyncio.wait_for(lance(cfg, f), 90)
        except Exception as e:
            import traceback
            t(f'partie « {nom} » : s’est arrêtée sur une exception', False, ''.join(traceback.format_exception(type(e), e, e.__traceback__))[-700:])

if __name__ == '__main__':
    t0 = time.monotonic()
    asyncio.run(tout())
    print(f'RESULTAT {RES["ok"]}/{RES["ok"] + RES["ko"]}'); print('\n'.join(L)); print(f'⏱ {time.monotonic() - t0:.0f} s')
    sys.exit(0 if RES['ko'] == 0 else 1)
