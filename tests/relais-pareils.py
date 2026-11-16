#!/usr/bin/env python3
"""(tour 57, tâche 3) Les deux relais disent la même chose : python3 tests/relais-pareils.py
Un même scénario (créer, rejoindre, refus, prêt, réglages bons et mauvais, lancer sans « charge », départ, commandes bonnes et mal formées, émotes, retour,
quitter, nouvel hôte) est joué contre serveur/relais.py (un vrai processus, de vrais clients websockets) et contre RESEAU.creerRelais (reseau.js, dans une
page). Les messages reçus par chaque client doivent être identiques (le code de salle, les jetons et la graine sont remplacés par des marques).
Il faut playwright et websockets. Plafond dur : 3 minutes."""
import asyncio, json, os, socket, subprocess, sys, threading, time
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
threading.Timer(180, lambda: os._exit(2)).start()
V = '1-3735928559'
RG = {'circuit': 'monza', 'tours': 2, 'meteo': 'sec', 'nbIA': 1}
S = [   # (le client, le message) ; « $CODE » = le code de la salle
    (0, {'t': 'creer', 'nom': 'bleu', 'version': V}),
    (1, {'t': 'rejoindre', 'code': '$CODE', 'nom': 'rouge', 'version': V}),
    (2, {'t': 'rejoindre', 'code': '$CODE', 'nom': 'rouge', 'version': V}),       # la couleur est prise : rouge-2
    (3, {'t': 'rejoindre', 'code': '$CODE', 'nom': 'Bob', 'version': V}),         # refus nom
    (4, {'t': 'rejoindre', 'code': 'ZZZZ', 'nom': 'vert', 'version': V}),         # refus inconnue
    (5, {'t': 'rejoindre', 'code': '$CODE', 'nom': 'vert', 'version': '9-9'}),    # refus version
    (6, {'t': 'creer', 'nom': 'x y', 'version': V}),                              # refus nom
    (1, {'t': 'pret', 'pret': True}),
    (1, {'t': 'pret', 'pret': 'oui'}),                                            # mal formé : rien
    (1, {'t': 'reglages', 'reglages': RG}),                                       # pas l'hôte : rien
    (0, {'t': 'reglages', 'reglages': dict(RG, tours=999)}),                      # erreur reglages
    (0, {'t': 'reglages', 'reglages': RG}),
    (7, {'t': 'rejoindre', 'code': '$CODE', 'nom': 'jaune', 'version': V}),
    (0, {'t': 'lancer', 'reglages': RG}),                                         # erreur charge (personne n'a annoncé)
    (0, {'t': 'charge', 'circuit': 'monza'}), (1, {'t': 'charge', 'circuit': 'monza'}), (2, {'t': 'charge', 'circuit': 'monza'}), (7, {'t': 'charge', 'circuit': 'spa'}),
    (0, {'t': 'lancer', 'reglages': RG}),                                         # erreur charge (un autre circuit)
    (7, {'t': 'quitter'}),
    (1, {'t': 'lancer', 'reglages': RG}),                                         # pas l'hôte : rien
    (0, {'t': 'cmd', 'n': 0, 'c': [1]}),                                          # avant le départ : rien
    (0, {'t': 'lancer', 'reglages': RG}),                                         # départ
    (8, {'t': 'rejoindre', 'code': '$CODE', 'nom': 'vert', 'version': V}),        # refus commencee
    (1, {'t': 'cmd', 'n': 0, 'c': [1, 2, 3]}),
    (1, {'t': 'cmd', 'n': 0, 'c': [1]}),                                          # n qui n'avance pas : rien
    (1, {'t': 'cmd', 'n': 1, 'c': 5}),                                            # pas un tableau : rien
    (1, {'t': 'cmd', 'n': 2, 'c': [99999]}),                                      # hors bornes : rien
    (1, {'t': 'cmd', 'n': 3, 'c': []}),                                           # vide : rien
    (2, {'t': 'cmd', 'n': 0, 'c': [4]}),
    (1, {'t': 'controle', 'n': 5, 'h': 123456}),
    (1, {'t': 'controle', 'n': 6, 'h': 'x' * 65}),                                # trop long : rien
    (1, {'t': 'controle', 'n': 7, 'h': 1.5}),                                     # pas entier : rien
    (2, {'t': 'emote', 'i': 0}), (2, {'t': 'emote', 'i': 99}),
    (0, {'t': 'retour'}),
    (0, {'t': 'quitter'}),                                                        # l'hôte part : nouvel hôte
    (1, {'t': 'quitter'}),
]

def normaliser(recus, code):
    jetons = {}
    sortie = []
    for liste in recus:
        out = []
        for m in liste:
            m = json.loads(json.dumps(m))
            if m.get('code') == code: m['code'] = 'CODE'
            if 'jeton' in m: m['jeton'] = 'JETON'
            if 'graine' in m: m['graine'] = 'GRAINE'
            out.append(m)
        sortie.append(out)
    return sortie

async def python_relais(port):
    from websockets.asyncio.client import connect
    ws, recus, code = [], [], None
    async def lire(k):
        try:
            async for brut in ws[k]: recus[k].append(json.loads(brut))
        except Exception: pass
    taches = []
    for i, msg in S:
        while len(ws) <= i:
            k = len(ws); ws.append(await connect(f'ws://127.0.0.1:{port}', open_timeout=5)); recus.append([]); taches.append(asyncio.create_task(lire(k)))
        m = dict(msg)
        if m.get('code') == '$CODE': m['code'] = code
        await ws[i].send(json.dumps(m))
        await asyncio.sleep(0.12)
        if code is None:
            for x in recus[i]:
                if x.get('t') == 'salle': code = x['code']
    await asyncio.sleep(0.3)
    for w in ws:
        try: await w.close()
        except Exception: pass
    return code, recus

def main():
    from playwright.sync_api import sync_playwright
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    rel = subprocess.Popen([sys.executable, os.path.join(RACINE, 'serveur', 'relais.py'), '--port', str(port), '--max-par-ip', '0'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    ok = True
    try:
        for _ in range(50):
            try: socket.create_connection(('127.0.0.1', port), 0.2).close(); break
            except OSError: time.sleep(0.2)
        code_py, recus_py = asyncio.run(python_relais(port))
    finally:
        rel.terminate()
        try: rel.wait(5)
        except subprocess.TimeoutExpired: rel.kill()
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', args=['--allow-file-access-from-files', '--disable-audio-output'])
        try:
            pg = b.new_page(); pg.set_default_timeout(30000)
            pg.goto('file://' + os.path.join(RACINE, 'tests', 'relais-pareils.html'))
            r = pg.evaluate('([s]) => rejouer(s)', [S])
        finally:
            b.close()
    a, c = normaliser(recus_py, code_py), normaliser(r['recus'], r['code'])
    for k in range(max(len(a), len(c))):
        x, y = (a[k] if k < len(a) else None), (c[k] if k < len(c) else None)
        if x == y: print('✔ client %d : les mêmes %d messages' % (k, len(x))); continue
        ok = False
        print('✘ client %d : serveur.py et reseau.js ne disent pas la même chose' % k)
        for j in range(max(len(x or []), len(y or []))):
            u, v = (x[j] if x and j < len(x) else None), (y[j] if y and j < len(y) else None)
            if u != v: print('    message %d\n      relais.py : %s\n      reseau.js : %s' % (j, json.dumps(u, ensure_ascii=False), json.dumps(v, ensure_ascii=False)))
    print('RESULTAT ' + ('OK' if ok else 'ECHEC')); sys.exit(0 if ok else 1)
main()
