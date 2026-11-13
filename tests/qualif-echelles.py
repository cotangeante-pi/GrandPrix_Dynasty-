#!/usr/bin/env python3
"""(tour 55, T23) La table des échelles de qualification par circuit : python3 tests/qualif-echelles.py [niveau,niveau…] [circuit,circuit…]
Ouvre tests/qualif-estime.html?mesure=1 (l'estimation BRUTE de tourEstime contre un vrai tour lancé simulé, une IA seule, régulière, sans erreur, au
rythme 1) et écrit sur la sortie la table prête à coller dans donnees.js (QUALIF_ECHELLE_CIRCUIT : niveau → nom du circuit → temps simulé / estimé).
Sans écran graphique utile (du calcul pur : quelques minutes), sous le verrou /tmp/gpd-tests.lock sur le Mac. À refaire si la physique, ia.js ou un réglage IA_* change."""
import os, sys, json
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
niveaux = sys.argv[1] if len(sys.argv) > 1 else 'debutant,normal,expert,legende'
circuits = sys.argv[2] if len(sys.argv) > 2 else ''
adresse = 'file://' + RACINE + '/tests/qualif-estime.html?mesure=1&niveaux=' + niveaux + ('&circuits=' + circuits if circuits else '')
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--allow-file-access-from-files', '--disable-audio-output'])
    pg = b.new_page()
    pg.goto(adresse, wait_until='commit', timeout=60000)   # (la page calcule en bloquant son chargement : on n'attend pas « load »)
    pg.wait_for_function('() => window.__FIN === true', timeout=1500000)
    res = pg.evaluate('() => window.__RES')
    b.close()
tab = {}
for r in res:
    tab.setdefault(r['niv'], {})[r['nom']] = round(r['1']['k'], 3)
print('  QUALIF_ECHELLE_CIRCUIT: {')
for niv, d in tab.items():
    print('    %s: { %s },' % (niv, ', '.join("'%s': %s" % (n, k) for n, k in d.items())))
print('  },')
print('# pire écart au rythme 0,95 :', max(abs(r['0.95']['k'] / r['1']['k'] - 1) for r in res))
