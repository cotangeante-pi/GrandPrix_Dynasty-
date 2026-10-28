#!/usr/bin/env python3
"""En piste en 10 secondes (tour 37d, Codeur 4) : python3 tests/premier.py
Le premier lancement, mesuré dans la vraie page (Chrome sans carte graphique, swiftshader, 960×600), sur 3 essais (la médiane, contre le
bruit des machines de GitHub) :
- le temps du clic sur « ▶ Jouer » au premier feu, puis à l'extinction des feux, comparé à la référence d'avant le tour 37d ;
- les feux durent leurs vraies secondes (la boucle rattrape le temps réel pendant les feux, PAS_MAX_FEUX), même à 3 images par seconde ;
- le tableau du chargement : chaque script (le temps entre deux évènements « load » : analyse + exécution), ce qui sert ou non avant
  les feux (la couverture du code), la taille du paquet. La console reste vide."""
import os, re, sys, io, zipfile, statistics
from urllib.parse import unquote
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('RESULTAT 0/1 (Playwright absent : pip install playwright)'); sys.exit(1)
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LECTURE_PIXELS = re.compile(r'\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels')
# la référence d'avant le tour 37d : le clic → feux éteints de la découverte mesuré par tests/ecrans.py sur 10 passages de GitHub du
# 2026-10-27 (8,8 / 9,0 / 11,7 / 12,4 / 16,9 / 17,0 / 17,1 / 17,3 / 17,3 / 17,9 s) : la médiane, 16,95 s. Le but de CLAUDE.md : 10 s.
REFERENCE_CLIC_AUX_FEUX = 16.95
BUT = 10.0
ESSAIS = 3
L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + str(detail)[:1200] if detail else ''))

INIT = '''window.__scripts = []; document.addEventListener('load', e => { if (e.target && e.target.tagName === 'SCRIPT') window.__scripts.push([e.target.getAttribute('src'), performance.now()]); }, true);
window.__images = []; (function boucle() { window.__images.push(performance.now()); requestAnimationFrame(boucle); })();'''

def un_essai(b, couverture):
    ctx = b.new_context(viewport={'width': 960, 'height': 600}); pg = ctx.new_page(); console = []
    pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
    pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
    cdp = None
    if couverture:
        cdp = ctx.new_cdp_session(pg); cdp.send('Profiler.enable'); cdp.send('Profiler.startPreciseCoverage', {'callCount': False, 'detailed': False})
    pg.add_init_script(INIT)
    pg.goto('file://' + RACINE + '/index.html?robot=1')
    pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "titre"', timeout=60000)
    pret = pg.evaluate('() => ({ dcl: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart, titre: Math.round(performance.now()) })')
    pg.wait_for_timeout(1500)   # (comme tests/ecrans.py : la page vient d'arriver, le joueur clique)
    t0 = pg.evaluate('() => performance.now()')
    pg.click('#boutonJouer')
    pg.wait_for_function('() => JEU.clicAuxFeux !== null', timeout=180000)
    r = pg.evaluate('''(t0) => { const im = window.__images.filter(x => x >= t0 && x <= t0 + JEU.clicAuxFeux), d = [];
      for (let i = 1; i < im.length; i++) d.push(im[i] - im[i - 1]); d.sort((a, b) => a - b); const c = JEU.calculTrajectoire;
      return { premier: JEU.clicAuPremierFeu / 1000, feux: JEU.clicAuxFeux / 1000, total: JEU.course.feux.total, ips: im.length / (JEU.clicAuxFeux / 1000),
        image: d.length ? d[Math.floor(d.length / 2)] : null, carte: c ? (c.fin === null ? 'pas finie' : Math.round(c.fin - c.debut)) : 'cache' }; }''', t0)
    scripts = pg.evaluate('() => window.__scripts')
    cov = cdp.send('Profiler.takePreciseCoverage')['result'] if cdp else None
    ctx.close()
    return pret, r, scripts, cov, console

def non_executes(cov):
    taille = {}
    for e in cov:
        u = unquote(e['url'])
        if not u.startswith('file://') or u.endswith('.html'): continue
        nom = u.split(RACINE + '/')[-1]
        if not os.path.isfile(os.path.join(RACINE, nom)): continue
        n = os.path.getsize(os.path.join(RACINE, nom))
        iv = sorted((rg['startOffset'], rg['endOffset']) for f in e['functions'] for rg in f['ranges'] if rg['count'] == 0)
        vide, fin = 0, -1
        for a, b_ in iv:
            if a > fin: vide += b_ - a; fin = b_
            elif b_ > fin: vide += b_ - fin; fin = b_
        taille[nom] = (n, min(n, vide))
    return taille

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        essais = [un_essai(b, i == 0) for i in range(ESSAIS)]
    finally:
        b.close()

consoles = [c for e in essais for c in e[4]]
t('le premier lancement, 3 fois : la console reste vide', not consoles, ' | '.join(consoles[:5]))
med = lambda k: statistics.median(e[1][k] for e in essais)
premier, feux, total = med('premier'), med('feux'), med('total')
L.append('  (essais : ' + ' ; '.join(f"clic → premier feu {e[1]['premier']:.2f} s, → feux éteints {e[1]['feux']:.2f} s (feux {e[1]['total']:.2f} s de jeu), {e[1]['ips']:.1f} images/s, image médiane {e[1]['image']:.0f} ms, carte {e[1]['carte']} ms" for e in essais) + ')')
t(f'clic → premier feu : médiane {premier:.2f} s, sous 1 s (aucune attente de la carte des IA)', premier < 1.0, premier)
t(f'clic → feux éteints : médiane {feux:.2f} s, sous la référence d’avant le tour 37d ({REFERENCE_CLIC_AUX_FEUX} s)', feux < REFERENCE_CLIC_AUX_FEUX, feux)
t(f'les feux durent leurs vraies secondes : du premier feu à l’extinction {feux - premier:.2f} s pour {total:.2f} s de feux (à moins de 1,5 s près, même à quelques images par seconde)', abs((feux - premier) - total) < 1.5, [feux - premier, total])
t(f'en piste en {BUT:.0f} secondes : clic → feux éteints {feux:.2f} s (médiane de {ESSAIS} essais, sous swiftshader)', feux <= BUT, feux)

# le tableau du chargement (le premier essai) : les scripts les plus lourds à analyser et exécuter, et ce qui ne sert pas avant les feux
pret, r, scripts, cov, _ = essais[0]
prec, temps = 0, []
for nom, tt in scripts: temps.append((nom, tt - prec)); prec = tt
L.append(f"  (chargement : page prête {pret['dcl']} ms, écran titre à {pret['titre']} ms)")
L.append('  (scripts, analyse + exécution, du plus lourd : ' + ', '.join(f'{n} {d:.0f} ms' for n, d in sorted(temps, key=lambda x: -x[1])[:12]) + ' ; tous les autres sous 2 ms)')
if cov:
    c = non_executes(cov); tot = sum(v[0] for v in c.values()); vide = sum(v[1] for v in c.values())
    L.append(f'  (code jamais exécuté avant les feux : {vide / 1024:.0f} Ko sur {tot / 1024:.0f} Ko ; par fichier : ' + ', '.join(f'{k} {v[1] / 1024:.0f}/{v[0] / 1024:.0f} Ko' for k, v in sorted(c.items(), key=lambda x: -x[1][1])[:20]) + ')')
# le paquet : les fichiers que la page charge (comme tests/paquet.py), compressés
page = open(os.path.join(RACINE, 'index.html'), encoding='utf-8').read()
fichiers = ['index.html'] + sorted(set(r_ for r_ in re.findall(r'(?:src|href)="([^"]+)"', page) if not re.match(r'^(https?:|data:|#|//)', r_)))
tampon = io.BytesIO()
with zipfile.ZipFile(tampon, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in fichiers: z.write(os.path.join(RACINE, f), f)
brut = sum(os.path.getsize(os.path.join(RACINE, f)) for f in fichiers)
L.append(f'  (paquet : {len(fichiers)} fichiers, {brut / 1024:.0f} Ko, zip {len(tampon.getvalue()) / 1024:.0f} Ko)')
print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
sys.exit(0 if ko == 0 else 1)
