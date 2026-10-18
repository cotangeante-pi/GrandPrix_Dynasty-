#!/usr/bin/env python3
"""La vraie page dans Chrome (Playwright) : python3 tests/ecrans.py
Pour chaque page : la console reste vide (ni erreur, ni avertissement, ni fichier manquant), la page ne défile
pas, la scène 3D dessine le circuit. En plus : la conduite au clavier (avancer, tourner, freiner, Espace, C),
l'interpolation de l'affichage, les caméras de survol, ?debug=1. Captures dans tests/captures/."""
import math, os, re, sys
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
    ('index.html?camera=auto', 1280, 720, 'auto.png'),
    ('index.html?camera=libre', 1280, 720, 'libre.png'),
    ('index.html?camera=dessus', 1280, 720, 'dessus.png'),
    ('index.html?camera=virage', 1280, 720, 'virage.png'),
    ('index.html?camera=vitrine', 1280, 720, 'voiture.png'),
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

JOUEUR = '() => ({ x: JEU.joueur.x, z: JEU.joueur.z, cap: JEU.joueur.cap, u: JEU.joueur.u, d: JEU.joueur.piste.d, herbe: JEU.joueur.surHerbe })'
# la position dessinée est entre l'état d'avant le pas et l'état d'après
INTERPOLE = """() => { const v = JEU.joueur, g = JEU.modele.groupe.position, e = etatAffiche(v, JEU.alpha);
  const entre = (a, b, c) => c >= Math.min(a, b) - 1e-6 && c <= Math.max(a, b) + 1e-6;
  return { ok: Math.abs(g.x - e.x) < 1e-6 && Math.abs(g.z - e.z) < 1e-6 && entre(v.avant.x, v.x, g.x) && entre(v.avant.z, v.z, g.z), alpha: JEU.alpha, avant: v.avant.x, apres: v.x, dessine: g.x }; }"""

def conduite(pg, titre):
    t(f'{titre} : la voiture attend sur la ligne, à l’arrêt', pg.evaluate(JOUEUR)['u'] == 0)
    t(f'{titre} : le titre est le nom du jeu, sans « F1 »', pg.evaluate('() => document.title === texte("nomDuJeu") && document.title === "Grand Prix Dynasty"'), pg.evaluate('() => document.title'))
    depart = pg.evaluate(JOUEUR)
    pg.keyboard.down('ArrowUp')
    t(f'{titre} : ↑ fait avancer la voiture', attendre(pg, '() => JEU.joueur.u > 15', None, 8000), str(pg.evaluate(JOUEUR)))
    i = pg.evaluate(INTERPOLE)
    t(f'{titre} : la voiture est dessinée entre l’état d’avant et l’état d’après', i['ok'], str(i))
    pg.screenshot(path=os.path.join(CAPTURES, 'derriere.png'))
    p1 = pg.evaluate(JOUEUR)
    pg.keyboard.down('ArrowLeft')
    t(f'{titre} : ← fait tourner la voiture à gauche', attendre(pg, 'c => JEU.joueur.cap < c - 0.05', p1['cap']), f"cap {p1['cap']} → {pg.evaluate(JOUEUR)['cap']}")
    pg.keyboard.up('ArrowLeft'); pg.keyboard.up('ArrowUp')
    p2 = pg.evaluate(JOUEUR)
    pg.keyboard.down('ArrowDown')
    t(f'{titre} : ↓ freine', attendre(pg, 'u => JEU.joueur.u < u * 0.5', p2['u']), f"{p2['u']} → {pg.evaluate(JOUEUR)['u']}")
    pg.keyboard.up('ArrowDown')
    t(f'{titre} : la voiture a roulé', math.hypot(p2['x'] - depart['x'], p2['z'] - depart['z']) > 10, str(p2))
    # C : derrière → cockpit → télé → derrière
    pg.keyboard.press('KeyC')
    t(f'{titre} : C passe au cockpit', pg.evaluate('() => CAMERA.mode') == 'cockpit')
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'cockpit.png'))
    pg.keyboard.press('KeyC')
    t(f'{titre} : C passe à la télé', pg.evaluate('() => CAMERA.mode') == 'tele')
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'tele.png'))
    pg.keyboard.press('KeyC')
    t(f'{titre} : C revient derrière', pg.evaluate('() => CAMERA.mode') == 'derriere')
    # dans l'herbe, puis Espace
    pg.evaluate('() => { const v = JEU.joueur; const e = 12 - v.piste.d; v.x += v.piste.nx * e; v.z += v.piste.nz * e; v.u = 0; v.v = 0; v.r = 0; }')
    t(f'{titre} : dans l’herbe, « hors piste » s’affiche', attendre(pg, '() => JEU.joueur.surHerbe && !document.getElementById("horsPiste").classList.contains("cache")'), str(pg.evaluate(JOUEUR)))
    pg.keyboard.press('Space')
    t(f'{titre} : Espace remet la voiture au centre de la piste, à l’arrêt', attendre(pg, '() => Math.abs(JEU.joueur.piste.d) < 0.05 && JEU.joueur.u === 0 && !JEU.joueur.surHerbe'), str(pg.evaluate(JOUEUR)))
    t(f'{titre} : la vitesse s’affiche en km/h', bool(re.fullmatch(r'\d+', pg.evaluate('() => document.getElementById("vitesse").textContent'))))

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

            if page == 'index.html' and l == 1280:
                conduite(pg, titre)
            if 'camera=auto' in page:
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
                t(f'{titre} : en caméra libre, les flèches ne font pas rouler la voiture', pg.evaluate('() => JEU.joueur.u') == 0)
            # la vraie capture de l'écran : on laisse passer quelques images d'abord
            pg.wait_for_timeout(500)
            if capture: pg.screenshot(path=os.path.join(CAPTURES, capture))
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
