#!/usr/bin/env python3
"""La chasse aux bugs du tour 53 (Codeur 6) : python3 tests/chasse53.py [fr1280|en640|les deux]
Le nouveau joueur, de bout en bout, aux tailles que tests/saison.py (960×600) ne couvre pas : titre → découverte → podium → pilote → paddock →
Grand Prix 1 (qualification, course) → après-course → paddock → Grand Prix 2. Au clavier en 1280×720 en français ; au doigt (écran tactile
émulé) en 640×360 en anglais. À chaque écran : ce que vérifie tests/chasse.py (console, textes cassés, boutons hors de l'écran ou qui se
recouvrent, clés de textes manquantes, clics impossibles, écran bloqué), et, par écran, les nouveautés qui ne doivent pas se marcher dessus."""
import os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chasse import *

CAS = {'fr1280': ('fr', 1280, 720, False), 'en640': ('en', 640, 360, True)}
choix = [a for a in sys.argv[1:] if a in CAS] or list(CAS)
t0 = time.monotonic()
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for cle in choix:
            langue, w, h, doigt = CAS[cle]
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=doigt); pg = ctx.new_page()
            c = Carriere(pg, langue, f'index.html?robot=1&tours=3&lang={langue}'); c.prefixe = 'chasse53-' + cle
            pg.goto('file://' + RACINE + '/' + c.adresse); c.pret()
            titre = f'nouveau joueur {langue} {w}×{h}' + (' au doigt' if doigt else '')
            arrive = c.jouer(lambda e: e[0] == 'championnat', 500, 'premier lancement')
            t(f'{titre} : titre → découverte → podium → pilote → paddock', arrive, str(c.bloque))
            if arrive:
                g1 = c.jouer(lambda e: e[0] == 'championnat' and e[6] == 1, 1200, 'Grand Prix 1')
                t(f'{titre} : Grand Prix 1 (qualification, course de 3 tours, après-course) jusqu’au paddock', g1, str(c.bloque))
                if g1:
                    g2 = c.jouer(lambda e: e[0] == 'championnat' and e[6] == 2, 1200, 'Grand Prix 2')
                    t(f'{titre} : Grand Prix 2 joué jusqu’au paddock', g2, str(c.bloque))
            rapport(c, titre)
            L.append(f'  ({titre} : {time.monotonic() - t0:.0f} s)')
            ctx.close()
    finally:
        b.close()
print(f'RESULTAT {RES["ok"]}/{RES["ok"] + RES["ko"]}'); print('\n'.join(L))
sys.exit(0 if RES['ko'] == 0 else 1)
