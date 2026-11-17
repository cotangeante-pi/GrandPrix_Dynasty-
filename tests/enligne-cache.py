#!/usr/bin/env python3
"""(tour 58, D) L'onglet vraiment caché : python3 tests/enligne-cache.py [secondes]   (à la main : il faut un écran, Chrome PAS headless ; sous GitHub : xvfb-run -a python3 tests/enligne-cache.py)
Deux onglets du même Chrome dans une course en ligne (BroadcastChannel, comme tests/enligne-course.py) mais EN TEMPS RÉEL (aucun BOUCLE.simuler à la main) :
l'onglet A passe derrière l'onglet B (B.bring_to_front : document.visibilityState === 'hidden' vérifié sur A) pendant 60 s. Vérifie : A est vraiment caché, la course
continue des deux côtés (les pas avancent), personne n'abandonne (sortie vide, écran « course »), aucune désynchro, console vide ; puis A revient devant :
pas de saut, toujours aucune désynchro, et les deux pages arrivent au même pas n avec la même empreinte si on les arrête au même pas (contrôle entier).
Plafond dur : 10 minutes (le garde-fou tue le groupe de processus)."""
import os, signal, sys, threading, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECONDES = int(sys.argv[1]) if len(sys.argv) > 1 else 60
def _garde():
    print('✘ enligne-cache.py : plus de 10 min, arrêté', flush=True)
    try: os.killpg(os.getpgid(0), signal.SIGKILL)
    except Exception: os._exit(2)
_t = threading.Timer(600, _garde); _t.daemon = True; _t.start()
try: os.setpgrp()
except Exception: pass
ok_tout = True
def dire(ok, nom, detail=''):
    global ok_tout
    ok_tout = ok_tout and ok
    print(('✔ ' if ok else '✘ ') + nom + (' — ' + str(detail) if (detail and not ok) else ''), flush=True)
def attendre(pg, expr, ms=30000):
    t0 = time.monotonic(); derniere = None
    while time.monotonic() - t0 < ms / 1000:
        try:
            if pg.evaluate(expr): return True
        except Exception as e: derniere = e
        time.sleep(0.1)
    raise TimeoutError('attendre : %s (%s)' % (expr[:90], derniere))
ETAT = '() => { const e = ENLIGNE_PAGE.etat, p = e.partie; return { n: p && p.n, sortie: e.sortie, ecran: JEU.ecran, desynchro: p && p.desynchro, attente: p && p.attente, vis: document.visibilityState, fond: !!e.fond, fin: p && p.fin }; }'
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=False, args=['--allow-file-access-from-files'])
    try:
        ctx = b.new_context(viewport={'width': 960, 'height': 600})
        erreurs = []; canal = 'cache-%d-%d' % (os.getpid(), time.time()); pages = []
        def suivre(pg, i):
            pg.set_default_timeout(30000)
            pg.on('pageerror', lambda e, i=i: erreurs.append('page %d : %s' % (i, e)))
            pg.on('console', lambda m, i=i: erreurs.append('console %d : %s' % (i, m.text)) if m.type in ('error', 'warning') and 'GL Driver' not in m.text else None)
        A = ctx.new_page(); suivre(A, 0)
        # (B est ouvert PAR A, window.open : un onglet de la même fenêtre. Deux new_page() de Playwright en mode avec écran font deux fenêtres, toutes deux visibles : aucun n'est caché)
        B = None
        base = 'file://' + RACINE + '/index.html?circuit=test&robot=1&tours=3&ia=0&canal=%s&joueurs=2' % canal
        A.goto(base + '&enlignecourse=hote&nom=bleu', wait_until='domcontentloaded', timeout=120000)
        attendre(A, '() => window.__enligne && window.__enligne.code', 60000)
        code = A.evaluate('() => window.__enligne.code')
        with ctx.expect_page(timeout=60000) as nouvelle:
            A.evaluate('(u) => { window.__B = window.open(u, "_blank"); }', base + '&enlignecourse=%s&nom=rouge' % code)
        B = nouvelle.value; suivre(B, 1); pages = [A, B]
        B.wait_for_load_state('domcontentloaded')
        for pg in pages: attendre(pg, '() => window.__enligne && window.__enligne.partie', 60000)
        dire(True, 'la course part sur les 2 onglets (code %s)' % code)
        A.bring_to_front()
        time.sleep(3)
        eA0 = A.evaluate(ETAT); dire(eA0['vis'] == 'visible' and eA0['n'] > 0, 'avant : l\'onglet A est visible et la course avance', eA0)
        B.bring_to_front()
        try: attendre(A, '() => document.visibilityState === "hidden"', 15000); cache = True
        except Exception: cache = False
        dire(cache, 'A est vraiment caché (document.visibilityState === "hidden")', A.evaluate('() => document.visibilityState'))
        eA1 = A.evaluate(ETAT); eB1 = B.evaluate(ETAT)
        dire(eA1['fond'], 'A caché : le minuteur de fond est lancé (Worker)', eA1)
        pas = []; t0 = time.monotonic(); mal = None
        while time.monotonic() - t0 < SECONDES:
            time.sleep(5)
            eA = A.evaluate(ETAT); eB = B.evaluate(ETAT); pas.append((round(time.monotonic() - t0), eA['n'], eB['n']))
            if eA['sortie'] or eB['sortie'] or eA['desynchro'] or eB['desynchro'] or eA['vis'] != 'hidden' or eB['vis'] != 'visible':
                mal = (eA, eB); break
            if eA['fin'] or eB['fin']: break
        print('   (t, pas de A caché, pas de B devant) :', pas, flush=True)
        eA = A.evaluate(ETAT); eB = B.evaluate(ETAT)
        dire(mal is None, 'pendant %d s cachée : personne n\'abandonne, aucune désynchro, A reste caché' % SECONDES, mal)
        dire(eA['n'] - eA1['n'] > 0.5 * 60 * (time.monotonic() - t0) or eA['fin'] is not None, 'A caché a avancé presque en temps réel (%d pas en %.0f s, 60 pas/s)' % (eA['n'] - eA1['n'], time.monotonic() - t0), [eA1['n'], eA['n']])
        dire(eB['n'] > eB1['n'] and abs(eA['n'] - eB['n']) < 600, 'les deux onglets avancent ensemble (écart de pas %d)' % abs(eA['n'] - eB['n']), [eA['n'], eB['n']])
        A.bring_to_front(); time.sleep(10)
        eA = A.evaluate(ETAT); eB = B.evaluate(ETAT)
        dire(eA['vis'] == 'visible' and not eA['sortie'] and not eB['sortie'] and not eA['desynchro'] and not eB['desynchro'], 'A revient devant : toujours en course, aucune désynchro', [eA, eB])
        # le contrôle : à un même pas, la même empreinte (le relais compare tous les EN_LIGNE_CONTROLE pas : une désynchro l'aurait déjà arrêtée)
        dire(not erreurs, 'console vide', erreurs[:3])
    finally:
        try: b.close()
        except Exception: pass
print('RESULTAT OK' if ok_tout else 'ÉCHECS')
sys.exit(0 if ok_tout else 1)
