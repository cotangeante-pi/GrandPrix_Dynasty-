#!/usr/bin/env python3
"""La vraie page dans Chrome (Playwright) : python3 tests/ecrans.py
Pour chaque taille Poki (960×600, 1280×720) : index.html et index.html?debug=1 ne laissent rien dans la
console (ni erreur, ni avertissement), la page ne défile pas, la scène 3D dessine le cube rouge au centre, le
cube tourne, et ?debug=1 affiche les images par seconde. Une capture par page et par taille dans tests/captures/."""
import os, re, sys
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    # la console vide est un critère de l'étape 0 : sans Playwright, ce n'est pas vérifié, donc c'est un échec
    print('RESULTAT 0/1 (Playwright absent : pip install playwright)'); sys.exit(1)
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURES = os.path.join(RACINE, 'tests', 'captures')
TAILLES = [('poki', 960, 600), ('large', 1280, 720)]

# la couleur au centre du canevas, lue juste après un rendu (sinon le tampon WebGL est déjà vidé)
CENTRE = """() => {
  SCENE3D.dessiner(DEMO);
  const c = document.querySelector('#scene3d canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const px = new Uint8Array(4);
  gl.readPixels(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return Array.from(px);
}"""

L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + detail if detail else ''))

os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for nom, l, h in TAILLES:
            for page, debug in (('index.html', False), ('index.html?debug=1', True)):
                titre = f'{page} {l}×{h}'
                ctx = b.new_context(viewport={'width': l, 'height': h})
                pg = ctx.new_page(); console = []
                pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
                pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
                pg.on('requestfailed', lambda r: console.append('FICHIER MANQUANT ' + r.url))
                pg.goto('file://' + RACINE + '/' + page); pg.wait_for_timeout(1500)
                # la console d'abord : la lecture de pixels plus bas n'a pas à y compter
                t(f'{titre} : console vide', not console, ' | '.join(console)[:500])
                defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
                t(f'{titre} : pas de défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
                t(f'{titre} : la scène 3D a démarré', pg.evaluate('() => SCENE3D.actif && !!document.querySelector("#scene3d canvas")'))
                # swiftshader rame parfois (une image > 300 ms) : on attend que l'angle bouge, 5 s au plus
                a1 = pg.evaluate('() => DEMO.angleCube')
                try: pg.wait_for_function('a => DEMO.angleCube !== a', arg=a1, timeout=5000); tourne = True
                except Exception: tourne = False
                t(f'{titre} : le cube tourne', tourne, f'angle resté à {a1} pendant 5 s')
                pg.screenshot(path=os.path.join(CAPTURES, f'{nom}{"-debug" if debug else ""}.png'))
                r, g, bl, _ = pg.evaluate(CENTRE)
                t(f'{titre} : le cube rouge est au centre', r > 120 and r > 2 * g and r > 2 * bl, f'rgb({r},{g},{bl})')
                ips = pg.evaluate('() => { const e = document.getElementById("ips"); return e.classList.contains("cache") ? null : e.textContent; }')
                if debug: t(f'{titre} : les images par seconde s’affichent', bool(ips and re.fullmatch(r'\d+ i/s', ips)), repr(ips))
                else: t(f'{titre} : sans debug, pas de compteur', ips is None, repr(ips))
                ctx.close()
    finally:
        b.close()

print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
sys.exit(0 if ko == 0 else 1)
