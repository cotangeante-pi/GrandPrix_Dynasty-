#!/usr/bin/env python3
"""Régénère cache-carte-test.js : la carte des IA du circuit « test » livrée avec le jeu (tour 52f, plan de la première minute n° 3).
Au premier lancement, la carte n'est pas dans la sauvegarde : sans ce fichier, le joueur attend 2 à 5 s de « Préparation de la course… ».
À relancer dès que le test « carte livrée » est rouge (un réglage IA_*, la physique de la vitesse limite ou le tracé « test » a changé) :
    python3 tests/regenerer-cache-carte.py
Le calcul se fait dans la vraie page (index.html), comme le jeu le fait en fond ; l'encodage est celui de cache-carte.js."""
import os, sys
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'cache-carte-test.js')
with sync_playwright() as p:
    nav = p.chromium.launch(args=['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = nav.new_page()
    pg.goto('file://' + os.path.join(RACINE, 'index.html?menu=amis'), wait_until='domcontentloaded', timeout=180000)
    pg.wait_for_function('() => typeof CACHE_CARTE !== "undefined" && typeof calculerTrajectoire === "function"', timeout=180000)
    texte = pg.evaluate('''() => { const c = construireCircuit(CIRCUITS.test), t = calculerTrajectoire(c);
      return JSON.stringify(CACHE_CARTE.encoder('test', CIRCUITS.test, t)); }''')
    nav.close()
with open(SORTIE, 'w') as f:
    f.write('// La carte des IA du circuit « test » livrée avec le jeu (tour 52f) : au premier lancement, la course de découverte n\'attend plus\n'
            '// le calcul de fond (principal.js la prend comme un cache valide si sa clé correspond, sinon il calcule comme avant).\n'
            '// FICHIER GÉNÉRÉ : python3 tests/regenerer-cache-carte.py (le test « carte livrée » du moteur dit quand il faut le refaire).\n'
            'const CACHE_CARTE_LIVREE = { test: ' + texte + ' };\n')
print(f'{SORTIE} : {os.path.getsize(SORTIE)} octets')
