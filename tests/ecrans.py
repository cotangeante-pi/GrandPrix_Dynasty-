#!/usr/bin/env python3
"""La vraie page dans Chrome (Playwright) : python3 tests/ecrans.py
Pour chaque page : la console reste vide (ni erreur, ni avertissement, ni fichier manquant), la page ne défile
pas, la scène 3D dessine le circuit. En plus : la caméra auto bouge toute seule, la caméra libre bouge avec une
flèche et la molette, ?debug=1 affiche images par seconde et triangles. Captures dans tests/captures/."""
import os, re, sys
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    # la console vide est un critère de l'étape 0 : sans Playwright, ce n'est pas vérifié, donc c'est un échec
    print('RESULTAT 0/1 (Playwright absent : pip install playwright)'); sys.exit(1)
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURES = os.path.join(RACINE, 'tests', 'captures')
# (page, largeur, hauteur, capture)
PAGES = [
    ('index.html', 960, 600, 'poki.png'),
    ('index.html?debug=1', 960, 600, 'poki-debug.png'),
    ('index.html', 1280, 720, 'large.png'),
    ('index.html?debug=1', 1280, 720, 'large-debug.png'),
    ('index.html?camera=libre', 1280, 720, 'libre.png'),
    ('index.html?camera=dessus', 1280, 720, 'dessus.png'),
    ('index.html?camera=virage', 1280, 720, 'virage.png'),
]
POSITION = '() => CAMERA.position'

L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + detail if detail else ''))

def attendre(pg, condition, arg=None, delai=5000):
    # swiftshader rame parfois (une image > 300 ms) : on attend que la condition soit vraie, 5 s au plus
    try: pg.wait_for_function(condition, arg=arg, timeout=delai); return True
    except Exception: return False

mesures = None
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for page, l, h, capture in PAGES:
            titre = f'{page} {l}×{h}'
            ctx = b.new_context(viewport={'width': l, 'height': h})
            pg = ctx.new_page(); console = []
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.on('requestfailed', lambda r: console.append('FICHIER MANQUANT ' + r.url))
            pg.goto('file://' + RACINE + '/' + page); pg.wait_for_timeout(1500)
            t(f'{titre} : console vide', not console, ' | '.join(console)[:500])
            defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
            t(f'{titre} : pas de défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
            t(f'{titre} : la scène 3D a démarré', pg.evaluate('() => SCENE3D.actif && !!document.querySelector("#scene3d canvas")'))
            t(f'{titre} : le circuit est dessiné', attendre(pg, '() => SCENE3D.trianglesDessines > 5000'), f'{pg.evaluate("() => SCENE3D.trianglesDessines")} triangles')
            if mesures is None: mesures = pg.evaluate('() => SCENE3D.infoCircuit')

            if 'camera=' not in page:
                p1 = pg.evaluate(POSITION)
                t(f'{titre} : la caméra fait le tour toute seule', attendre(pg, 'p => CAMERA.position.x !== p.x || CAMERA.position.z !== p.z', p1), str(p1))
            if 'camera=libre' in page:
                p1 = pg.evaluate(POSITION)
                pg.wait_for_timeout(500)
                t(f'{titre} : sans touche, la caméra libre ne bouge pas', pg.evaluate(POSITION) == p1)
                pg.keyboard.down('ArrowUp')
                bouge = attendre(pg, 'p => Math.hypot(CAMERA.position.x - p.x, CAMERA.position.z - p.z) > 1', p1)
                pg.keyboard.up('ArrowUp')
                t(f'{titre} : la flèche ↑ fait avancer la caméra', bouge, f'{p1} → {pg.evaluate(POSITION)}')
                p2 = pg.evaluate(POSITION)
                pg.mouse.move(l / 2, h / 2); pg.mouse.wheel(0, -400)
                t(f'{titre} : la molette rapproche la caméra', attendre(pg, 'p => CAMERA.position.y < p.y - 1', p2), f'{p2} → {pg.evaluate(POSITION)}')
            # la vraie capture de l'écran : on laisse passer quelques images d'abord
            pg.wait_for_timeout(500)
            pg.screenshot(path=os.path.join(CAPTURES, capture))
            ips = pg.evaluate('() => { const e = document.getElementById("ips"); return e.classList.contains("cache") ? null : e.textContent; }')
            if 'debug=1' in page:
                attendre(pg, '() => /triangles/.test(document.getElementById("ips").textContent)')
                ips = pg.evaluate('() => document.getElementById("ips").textContent')
                t(f'{titre} : images par seconde et triangles affichés', bool(re.fullmatch(r'\d+ i/s · \d+ triangles', ips or '')), repr(ips))
            else: t(f'{titre} : sans debug, pas de compteur', ips is None, repr(ips))
            ctx.close()
    finally:
        b.close()

print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
if mesures: print(f'  (circuit 3D : {mesures["triangles"]:.0f} triangles, construit en {mesures["msConstruction"]:.0f} ms sous swiftshader)')
sys.exit(0 if ko == 0 else 1)
