#!/usr/bin/env python3
"""La mesure des images par seconde (étape 10, « chaque circuit tient 60 images par seconde avec 20 voitures ») : hors de la suite
et de GitHub (il faut la vraie carte graphique : un Chrome avec fenêtre, pas swiftshader). Sous le verrou /tmp/gpd-tests.lock.
  python3 tests/perf.py [circuit …] [--pluie] [--tele] [--secondes N] [--fois N] [--sans-limite] [--sans-fenetre] [--racine DOSSIER]
--sans-limite : ni synchronisation verticale ni plafond d'images (ce que la machine peut faire : au-dessus de 60, le circuit tient 60) ;
la fenêtre n'est jamais ralentie quand elle est cachée par une autre (--disable-backgrounding-occluded-windows).
Pour chaque circuit : index.html?debug=1&course=3&ia=20&circuit=<nom>, la course lancée (20 IA, vue derrière la voiture suivie),
puis N secondes de mesure (requestAnimationFrame) : images par seconde moyennes, le pire 1 % (l'image la plus lente sur cent),
appels de dessin et triangles (SCENE3D, la dernière image). --pluie : une fausse météo de pluie (window.METEO_TEST) ; --tele : la vue
télé (la régie). Écrit une ligne de tableau par circuit."""
import os, sys, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if '--racine' in sys.argv: RACINE = os.path.abspath(sys.argv[sys.argv.index('--racine') + 1])   # (une autre copie du jeu, pour comparer avant / après)
TOUS = ['monoco', 'silverstoun', 'monzo', 'spaa', 'suzuko', 'interlagas', 'montreol', 'melbourn', 'barcelana', 'bahrayn', 'singapura', 'yasmarino']
args = sys.argv[1:]
pluie, tele, sans = '--pluie' in args, '--tele' in args, '--sans-fenetre' in args
secondes = 10
if '--secondes' in args: secondes = float(args[args.index('--secondes') + 1])
circuits = [a for a in args if a in TOUS or a == 'test'] or TOUS
fois = int(args[args.index('--fois') + 1]) if '--fois' in args else 1   # (plusieurs mesures par circuit : la médiane, le Mac est souvent chargé)
MESURE = '''async s => { const t = []; let d = performance.now(); await new Promise(r => { const f = now => { t.push(now - d); d = now; if (t.length && t.reduce((a, b) => a + b, 0) < s * 1000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
  t.shift(); const tri = t.slice().sort((a, b) => a - b), moy = t.reduce((a, b) => a + b, 0) / t.length, p99 = tri[Math.min(tri.length - 1, Math.floor(tri.length * 0.99))];
  return { images: t.length, ips: 1000 / moy, pire: 1000 / p99, appels: SCENE3D.appelsDessin, triangles: SCENE3D.trianglesDessines, rendu: (() => { const g = SCENE3D.canvas.getContext('webgl2') || SCENE3D.canvas.getContext('webgl'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })() }; }'''
# (un navigateur neuf par circuit : avec un seul navigateur, une page sur deux tombait à ~35 images par seconde, la fenêtre
# précédente encore en train de se fermer)
with sync_playwright() as p:
    lancer = lambda: p.chromium.launch(channel='chrome', headless=sans, args=['--allow-file-access-from-files', '--disable-audio-output', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows'] + (['--disable-gpu-vsync', '--disable-frame-rate-limit'] if '--sans-limite' in args else []))
    print('| circuit | images/s | pire 1 % | dessin seul (images/s) | appels | triangles | carte graphique |')
    print('|---|---|---|---|---|---|---|')
    print(f'(charge du Mac au début : {os.getloadavg()[0]:.1f})')
    b = None
    try:
        for nom in circuits:
            b = lancer()
            pg = b.new_page(viewport={'width': 1280, 'height': 720})
            if pluie: pg.add_init_script('window.METEO_TEST = { etat: () => ({ pluie: 0.85, eau: 0.75, eauTrajectoire: 0.35, ciel: 0.9 }), prevision: () => ({ type: "pluie", risque: 90 }) };')
            pg.goto('file://' + RACINE + f'/index.html?debug=1&course=3&ia=20&circuit={nom}')
            ok = False
            for _ in range(240):
                time.sleep(1)
                try: ok = pg.evaluate('() => !!(JEU.plateau && JEU.plateau.pilotes.filter(p => Math.abs(p.v.u) > 15).length >= 5)')
                except Exception: ok = False
                if ok: break
            if tele: pg.evaluate('() => CAMERA.forcer("tele")')
            time.sleep(2)
            mesures = [pg.evaluate(MESURE, secondes) for _ in range(fois)] if ok else []
            m = sorted(mesures, key=lambda x: x['ips'])[len(mesures) // 2] if mesures else None
            # le dessin seul : la course en pause (la physique et les IA s'arrêtent, l'image continue) ; ce qui reste, c'est la 3D
            d = None
            if ok:
                pg.evaluate('() => { JEU.ecran = "pause"; }'); time.sleep(1)
                d = pg.evaluate(MESURE, min(5, secondes))
            print(f"| {nom} | {m['ips']:.1f} | {m['pire']:.1f} | {d['ips']:.1f} | {m['appels']} | {m['triangles']} | {m['rendu']} |" if m else f'| {nom} | (la course n’a pas démarré) | | | | | |', flush=True)
            pg.close(); b.close(); b = None
    finally:
        if b: b.close()
