#!/usr/bin/env python3
"""Le paquet Poki (étape 15, Codeur 3) : python3 tests/paquet.py
1. fabrique dist/grand-prix-dynasty.zip : index.html à la racine et SEULEMENT les fichiers du jeu, c'est-à-dire ce que index.html
   charge (scripts, feuille de style, lib/three.min.js) ; aucun test, rapport, .md, .github, capture ni fichier de travail ;
2. le décompresse dans un dossier temporaire et ouvre le jeu DEPUIS ce dossier (Playwright, 960×600 et 1280×720) : console vide,
   l'écran titre, « ▶ Jouer » lance la course de découverte ;
3. les vérifications Poki qui se font sans Poki (CLAUDE.md « Règles Poki ») : pas de défilement, flèches / Espace / molette qui ne
   font rien défiler, pas de menu contextuel, pas de sélection de texte, aucun lien ni fichier externe, aucun son avant le premier
   geste, gameLoadingFinished une seule fois, jamais deux gameplayStart ou deux gameplayStop de suite, aucun commercialBreak avant la
   première course de carrière (faux SDK). Le test sur inspector.poki.dev reste à faire par le propriétaire.
--zip seul : fabrique le zip sans lancer Chrome. Écrit RESULTAT n/m comme les autres tests."""
import os, re, sys, shutil, tempfile, zipfile
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(RACINE, 'dist')
ZIP = os.path.join(DIST, 'grand-prix-dynasty.zip')
L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + str(detail) if detail else ''))

# --- 1. les fichiers du jeu : index.html et ce qu'il charge (src="…", href="…" locaux), rien d'autre
def fichiers_du_jeu():
    page = open(os.path.join(RACINE, 'index.html'), encoding='utf-8').read()
    refs = re.findall(r'(?:src|href)="([^"]+)"', page)
    locaux = [r for r in refs if not re.match(r'^(https?:|data:|#|//)', r)]
    externes = [r for r in refs if re.match(r'^(https?:|//)', r)]
    return ['index.html'] + sorted(set(locaux)), externes

def fabriquer():
    liste, externes = fichiers_du_jeu()
    os.makedirs(DIST, exist_ok=True)
    if os.path.exists(ZIP): os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in liste: z.write(os.path.join(RACINE, f), f)
    return liste, externes

liste, externes = fabriquer()
total = sum(os.path.getsize(os.path.join(RACINE, f)) for f in liste)
t(f'le paquet : {len(liste)} fichiers, {total / 1024:.0f} Ko non compressés, zip {os.path.getsize(ZIP) / 1024:.0f} Ko', len(liste) > 10)
t('index.html est à la racine du zip, et chaque fichier chargé par la page existe', zipfile.ZipFile(ZIP).namelist()[0] == 'index.html' and all(os.path.isfile(os.path.join(RACINE, f)) for f in liste))
interdits = [f for f in liste if f.startswith(('tests/', 'rapports/', '.github', 'dist/')) or f.endswith('.md') or '/captures/' in f]
t('aucun test, rapport, .md, .github ni capture dans le paquet', not interdits, interdits)
t('aucun fichier externe chargé par la page (le SDK Poki excepté, s’il y est)', all('poki' in e for e in externes), externes)
L.append('  (fichiers : ' + ', '.join(f'{f} {os.path.getsize(os.path.join(RACINE, f)) / 1024:.0f} Ko' for f in liste) + ')')
if '--zip' in sys.argv:
    print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L)); sys.exit(0 if ko == 0 else 1)

# --- 2 et 3. le jeu depuis le zip décompressé
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('RESULTAT 0/1 (Playwright absent)'); sys.exit(1)
FAUX_SDK = """window.APPELS_SDK = []; window.PokiSDK = { init() { APPELS_SDK.push('init'); return Promise.resolve(); }, gameLoadingFinished() { APPELS_SDK.push('gameLoadingFinished'); },
  gameplayStart() { APPELS_SDK.push('gameplayStart'); }, gameplayStop() { APPELS_SDK.push('gameplayStop'); },
  commercialBreak() { APPELS_SDK.push('commercialBreak'); return Promise.resolve(); }, rewardedBreak() { APPELS_SDK.push('rewardedBreak'); return Promise.resolve(true); } };"""
LECTURE_PIXELS = re.compile(r'\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels')
DEFILE = '() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth, scrollX, scrollY]'
def pas_de_defilement(d): return d[0] <= d[1] + 2 and d[2] <= d[3] + 2 and d[4] == 0 and d[5] == 0
dossier = tempfile.mkdtemp(prefix='gpd-paquet-')
try:
    zipfile.ZipFile(ZIP).extractall(dossier)
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
        try:
            for l, h in ((960, 600), (1280, 720)):
                titre = f'paquet {l}×{h}'
                ctx = b.new_context(viewport={'width': l, 'height': h})
                pg = ctx.new_page(); console = []
                pg.add_init_script(FAUX_SDK)
                pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
                pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
                pg.on('requestfailed', lambda r: console.append('FICHIER MANQUANT ' + r.url))
                demandes = []
                pg.on('request', lambda r: demandes.append(r.url))
                pg.goto('file://' + dossier + '/index.html')
                pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "titre"', timeout=60000)
                pg.wait_for_timeout(800)
                t(f'{titre} : depuis le zip décompressé, l’écran titre, la console vide, aucun fichier manquant', not console and pg.evaluate('() => !document.getElementById("titre").classList.contains("cache")'), ' | '.join(console)[:400])
                t(f'{titre} : tous les fichiers viennent du dossier du jeu (rien d’externe)', all(u.startswith('file://' + dossier) or u.startswith('data:') for u in demandes), [u for u in demandes if not u.startswith('file://' + dossier)][:5])
                t(f'{titre} : l’écran titre ne défile pas', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
                # aucun son avant le premier geste
                t(f'{titre} : aucun son avant le premier geste (pas d’AudioContext)', pg.evaluate('() => !SON.actif'))
                # flèches, Espace, Page, molette : rien ne défile
                for touche in ('ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'End'): pg.keyboard.press(touche)
                pg.mouse.move(l / 2, h / 2); pg.mouse.wheel(0, 800)
                pg.wait_for_timeout(200)
                t(f'{titre} : flèches, Espace, Page suivante, Fin et molette ne font rien défiler', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
                # pas de menu contextuel, pas de sélection de texte, aucun lien externe
                menu = pg.evaluate('() => { const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true }); document.body.dispatchEvent(e); return e.defaultPrevented; }')
                t(f'{titre} : le clic droit n’ouvre pas de menu contextuel', menu)
                sel = pg.evaluate('() => getComputedStyle(document.body).userSelect || getComputedStyle(document.body).webkitUserSelect')
                t(f'{titre} : pas de sélection de texte (user-select : none sur la page)', sel == 'none', sel)
                liens = pg.evaluate('() => [...document.querySelectorAll("a[href]")].map(a => a.getAttribute("href")).filter(h => /^(https?:)?\\/\\//.test(h))')
                t(f'{titre} : aucun lien externe', not liens, liens)
                # Poki : gameLoadingFinished une fois ; « ▶ Jouer » : la course de découverte démarre
                pg.click('#boutonJouer')
                t(f'{titre} : « ▶ Jouer » lance la course de découverte (depuis le zip)', bool(pg.wait_for_function('() => JEU.ecran === "course" && JEU.decouverte && JEU.course', timeout=120000)))
                t(f'{titre} : le premier geste crée le son', pg.evaluate('() => SON.actif'))
                pg.wait_for_function('() => JEU.course.feux && JEU.course.etat !== "compte"', timeout=180000)
                pg.wait_for_timeout(500)
                appels = pg.evaluate('() => APPELS_SDK.slice()')
                jeu = [a for a in appels if a in ('gameplayStart', 'gameplayStop')]
                double = [i for i in range(1, len(jeu)) if jeu[i] == jeu[i - 1]]
                t(f'{titre} : SDK : init puis gameLoadingFinished une seule fois, gameplayStart quand la voiture roule, jamais deux fois de suite le même, aucun commercialBreak ({" → ".join(appels)})',
                  appels[:2] == ['init', 'gameLoadingFinished'] and appels.count('gameLoadingFinished') == 1 and 'gameplayStart' in jeu and not double and 'commercialBreak' not in appels, str(appels))
                t(f'{titre} : la course ne fait rien défiler', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
                t(f'{titre} : console toujours vide après le départ', not console, ' | '.join(console)[:400])
                ctx.close()
        finally:
            b.close()
finally:
    shutil.rmtree(dossier, ignore_errors=True)
print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
sys.exit(0 if ko == 0 else 1)
