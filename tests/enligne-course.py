#!/usr/bin/env python3
"""(tour 56, T7) Une course en ligne de bout en bout : python3 tests/enligne-course.py
Deux pages de la vraie page de jeu, dans le même navigateur, reliées par un BroadcastChannel (reseau.js, transport « diffusion » : la page de l'hôte
fait le relais) : l'hôte crée la salle, l'autre la rejoint par son code, l'hôte lance, chacune construit la même course (enligne.js) et le robot
d'essai conduit les deux voitures ; 1 tour du circuit d'essai avec 0 puis 2 IA. Vérifie : la course part, les deux pages arrivent au podium, les
arrivées et le classement final sont identiques au bit près des deux côtés, aucune désynchro, aucune erreur dans la console. Les pas de physique
sont donnés par BOUCLE.simuler (le dessin du Mac, en logiciel, serait bien trop lent), par petites tranches, une page puis l'autre.
Plafond dur : 14 minutes ; sans prise sur le verrou des tests du Mac (à prendre par l'appelant)."""
import json, os, signal, sys, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
signal.alarm(840)
ok_tout = True
def dire(ok, nom, detail=''):
    global ok_tout
    ok_tout = ok_tout and ok
    print(('✔ ' if ok else '✘ ') + nom + (' — ' + str(detail) if (detail and not ok) else ''))

def course(b, nom, ia, joueurs=2, tours=1):
    ctx = b.new_context(viewport={'width': 960, 'height': 600})
    erreurs = []
    canal = 'essai-%d-%d' % (os.getpid(), time.time())
    pages = []
    for i in range(joueurs):
        pg = ctx.new_page(); pg.set_default_timeout(30000)
        pg.on('pageerror', lambda e, i=i: erreurs.append('page %d : %s' % (i, e)))
        pg.on('console', lambda m, i=i: erreurs.append('console %d : %s' % (i, m.text)) if m.type in ('error', 'warning') else None)
        pages.append(pg)
    base = 'file://' + RACINE + '/index.html?circuit=test&robot=1&tours=%d&ia=%d&canal=%s&joueurs=%d' % (tours, ia, canal, joueurs)
    pages[0].goto(base + '&enlignecourse=hote&nom=Pilote%201')
    pages[0].wait_for_function('() => window.__enligne && window.__enligne.code', timeout=30000)
    code = pages[0].evaluate('() => window.__enligne.code')
    dire(len(code) == 4 and not any(c in 'AEIOUY' for c in code), nom + ' : un code de salle sans voyelle', code)
    for i in range(1, joueurs):
        pages[i].goto(base + '&enlignecourse=%s&nom=Pilote%%20%d' % (code, i + 1))
    for pg in pages:
        pg.wait_for_function('() => window.__enligne && window.__enligne.partie', timeout=60000)
    dire(True, nom + ' : la course part sur les %d pages' % joueurs)
    t0 = time.monotonic(); resumes = None
    while time.monotonic() - t0 < 700:
        resumes = [pg.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(24); return ENLIGNE_PAGE.resume(); }') for pg in pages]
        if all(r['ecran'] in ('podium', 'resultats') for r in resumes): break
        if any(r['desynchro'] for r in resumes): break
        time.sleep(0.02)
    dire(all(r['ecran'] in ('podium', 'resultats') for r in resumes), nom + ' : toutes les pages arrivent au podium (%.0f s, pas %s)' % (time.monotonic() - t0, [r['n'] for r in resumes]), [r['ecran'] for r in resumes])
    dire(not any(r['desynchro'] for r in resumes), nom + ' : aucune désynchro', [r['desynchro'] for r in resumes])
    dire(all(r['final'] is not None for r in resumes) and all(r['final'] == resumes[0]['final'] for r in resumes), nom + ' : le même classement final partout', [r['final'] for r in resumes])
    dire(all(r['arrivees'] == resumes[0]['arrivees'] for r in resumes), nom + ' : les mêmes temps d\'arrivée au bit près', [r['arrivees'] for r in resumes])
    if resumes[0]['final']: print('   classement : ' + ' '.join('P%d=k%d' % (x[1], x[0]) for x in resumes[0]['final']))
    dire(not erreurs, nom + ' : console vide', erreurs[:3])
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        course(b, 'deux joueurs, 0 IA', 0)
        if len(sys.argv) < 2 or sys.argv[1] != 'court':
            course(b, 'deux joueurs, 2 IA', 2)
    finally:
        b.close()
print('RESULTAT ' + ('OK' if ok_tout else 'ECHEC'))
sys.exit(0 if ok_tout else 1)
