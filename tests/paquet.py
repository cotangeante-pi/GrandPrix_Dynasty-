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
PAQUET_MAX_MO = 8   # le plafond du zip (Poki conseille un jeu léger : on reste sous 8 Mo)
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

# le script du SDK Poki (CLAUDE.md « Règles Poki ») : ajouté SEULEMENT dans l'index.html du zip, juste avant sdk.js ; le dépôt reste
# sans réseau (les tests ouvrent la page en file://). Sans réseau, le script échoue et sdk.js fait comme si Poki n'était pas là
SDK_POKI = '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>'
def index_du_zip():
    page = open(os.path.join(RACINE, 'index.html'), encoding='utf-8').read()
    assert page.count('<script src="sdk.js"></script>') == 1 and 'poki-sdk.js' not in page
    return page.replace('<script src="sdk.js"></script>', SDK_POKI + '\n<script src="sdk.js"></script>')

def fabriquer():
    liste, externes = fichiers_du_jeu()
    os.makedirs(DIST, exist_ok=True)
    if os.path.exists(ZIP): os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('index.html', index_du_zip())
        for f in liste[1:]: z.write(os.path.join(RACINE, f), f)
    return liste, externes

liste, externes = fabriquer()
total = sum(os.path.getsize(os.path.join(RACINE, f)) for f in liste)
t(f'le paquet : {len(liste)} fichiers, {total / 1024:.0f} Ko non compressés, zip {os.path.getsize(ZIP) / 1024:.0f} Ko', len(liste) > 10)
t(f'le zip pèse {os.path.getsize(ZIP) / 1048576:.2f} Mo, sous PAQUET_MAX_MO = {PAQUET_MAX_MO} Mo (Poki : un premier chargement léger)', os.path.getsize(ZIP) <= PAQUET_MAX_MO * 1048576, os.path.getsize(ZIP))
t('index.html est à la racine du zip, et chaque fichier chargé par la page existe', zipfile.ZipFile(ZIP).namelist()[0] == 'index.html' and all(os.path.isfile(os.path.join(RACINE, f)) for f in liste))
interdits = [f for f in liste if f.startswith(('tests/', 'rapports/', '.github', 'dist/')) or f.endswith('.md') or '/captures/' in f]
t('aucun test, rapport, .md, .github ni capture dans le paquet', not interdits, interdits)
t('aucun fichier externe chargé par la page du dépôt', not externes, externes)
iz = zipfile.ZipFile(ZIP).read('index.html').decode('utf-8')
t('l’index.html du zip a le script du SDK Poki, une seule fois, juste avant sdk.js (Règles Poki)', iz.count('poki-sdk.js') == 1 and iz.index(SDK_POKI) < iz.index('<script src="sdk.js">') and iz.index('<script src="sdk.js">') - iz.index(SDK_POKI) <= len(SDK_POKI) + 2, iz.count('poki-sdk.js'))
L.append('  (fichiers : ' + ', '.join(f'{f} {os.path.getsize(os.path.join(RACINE, f)) / 1024:.0f} Ko' for f in liste) + ')')
if '--zip' in sys.argv:
    print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L)); sys.exit(0 if ko == 0 else 1)

# --- 2 et 3. le jeu depuis le zip décompressé
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('RESULTAT 0/1 (Playwright absent)'); sys.exit(1)
# le faux SDK note chaque appel (APPELS_SDK) et, pour l'étape 15, l'état du jeu à ce moment (JOURNAL_SDK : l'écran, l'état de la course,
# les feux allumés, le tour de qualification) : verifier_sdk y lit les règles Poki
FAUX_SDK = """window.APPELS_SDK = []; window.JOURNAL_SDK = [];
  const noter = q => { APPELS_SDK.push(q); let e = { q }; try { if (typeof JEU !== 'undefined') e = { q, ecran: JEU.ecran, etat: JEU.course ? JEU.course.etat : null,
    feux: !!(JEU.course && JEU.course.feux && JEU.course.etat === 'compte'), tour: typeof enTourQualif === 'function' && enTourQualif() }; } catch (x) {} JOURNAL_SDK.push(e); };
  window.PokiSDK = { init() { noter('init'); return Promise.resolve(); }, gameLoadingFinished() { noter('gameLoadingFinished'); },
  gameplayStart() { noter('gameplayStart'); }, gameplayStop() { noter('gameplayStop'); },
  commercialBreak() { noter('commercialBreak'); return Promise.resolve(); }, rewardedBreak() { noter('rewardedBreak'); return Promise.resolve(true); } };"""
# les règles Poki sur un journal : gameplayStart seulement quand la voiture peut rouler (la course, feux éteints, ou le tour de
# qualification), jamais deux gameplayStart ni deux gameplayStop de suite, gameLoadingFinished une fois, et les pubs seulement entre deux
# écrans : jamais en course, ni pendant les feux, ni en pause, ni pendant le tour de qualification
def verifier_sdk(journal):
    fautes, dernier = [], None
    for i, e in enumerate(journal):
        q = e.get('q')
        if q in ('gameplayStart', 'gameplayStop'):
            if q == dernier: fautes.append(f'{i} : deux {q} de suite')
            dernier = q
        if q == 'gameplayStart' and not ((e.get('ecran') == 'course' and not e.get('feux')) or e.get('tour')): fautes.append(f'{i} : gameplayStart sur {e}')
        if q in ('commercialBreak', 'rewardedBreak') and (e.get('ecran') in ('course', 'pause', 'grille') or e.get('tour') or e.get('feux')): fautes.append(f'{i} : {q} sur {e}')
    if [e.get('q') for e in journal].count('gameLoadingFinished') > 1: fautes.append('gameLoadingFinished plus d’une fois')
    return fautes
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
                pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))   # (le vrai SDK ne vient pas : le faux SDK reste)
                pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
                pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
                pg.on('requestfailed', lambda r: console.append('FICHIER MANQUANT ' + r.url))
                demandes = []
                pg.on('request', lambda r: demandes.append(r.url) if 'poki-sdk.js' not in r.url else None)
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
                # l'onglet caché : le son est coupé (l'AudioContext suspendu), puis il revient
                pg.evaluate('() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); }')
                coupe = pg.wait_for_function('() => SON.etatContexte === "suspended"', timeout=5000)
                pg.evaluate('() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); }')
                t(f'{titre} : l’onglet caché coupe le son (AudioContext suspendu), revenu il le rend', bool(coupe) and bool(pg.wait_for_function('() => SON.etatContexte === "running"', timeout=5000)), pg.evaluate('() => SON.etatContexte'))
                pg.wait_for_function('() => JEU.course.feux && JEU.course.etat !== "compte"', timeout=180000)
                pg.wait_for_timeout(500)
                appels = pg.evaluate('() => APPELS_SDK.slice()')
                jeu = [a for a in appels if a in ('gameplayStart', 'gameplayStop')]
                double = [i for i in range(1, len(jeu)) if jeu[i] == jeu[i - 1]]
                t(f'{titre} : SDK : init puis gameLoadingFinished une seule fois, gameplayStart quand la voiture roule, jamais deux fois de suite le même, aucun commercialBreak ({" → ".join(appels)})',
                  appels[:2] == ['init', 'gameLoadingFinished'] and appels.count('gameLoadingFinished') == 1 and 'gameplayStart' in jeu and not double and 'commercialBreak' not in appels, str(appels))
                f = verifier_sdk(pg.evaluate('() => JOURNAL_SDK.slice()'))
                t(f'{titre} : les règles du SDK sur le journal (gameplayStart seulement voiture lancée, feux éteints ; aucune pub pendant les feux ni en course)', not f, f)
                t(f'{titre} : la course ne fait rien défiler', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
                t(f'{titre} : console toujours vide après le départ', not console, ' | '.join(console)[:400])
                ctx.close()
            # un parcours de championnat depuis le zip (1280×720, le robot, 1 tour) : la course → le podium → les résultats → l'interview →
            # la une → le paddock → « Course suivante » : la pause pub vient là, ENTRE deux Grands Prix (le faux commercialBreak ne finit
            # jamais : on regarde l'état pendant la pub) ; jamais deux gameplayStart ou deux gameplayStop de suite
            titre = 'paquet championnat 1280×720'
            ctx = b.new_context(viewport={'width': 1280, 'height': 720})
            pg = ctx.new_page(); console = []
            pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
            pg.add_init_script(FAUX_SDK.replace("commercialBreak() { noter('commercialBreak'); return Promise.resolve(); }", "commercialBreak() { noter('commercialBreak'); return new Promise(() => {}); }"))
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.goto('file://' + dossier + '/index.html?championnat=1&tours=1&robot=1')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=60000)
            pg.click('#boutonCourseSuivante')
            pg.wait_for_function('() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', timeout=10000)
            # le tour de qualification (le robot le pilote) : gameplayStart pendant le tour, gameplayStop au résultat
            pg.wait_for_function('() => JEU.plateau && JEU.plateau.carte !== null', timeout=240000)
            pg.click('#boutonQualifTour')
            for _ in range(200):
                if pg.evaluate('() => JEU.qualif && JEU.qualif.etat === "resultat"'): break
                pg.evaluate('() => { if (JEU.qualif && JEU.qualif.etat === "tour") BOUCLE.simuler(5); }'); pg.wait_for_timeout(30)
            pg.wait_for_function('() => JEU.qualif && JEU.qualif.etat === "resultat"', timeout=240000)
            arret = False
            try: arret = bool(pg.wait_for_function('() => APPELS_SDK.filter(a => /^gameplay/.test(a)).slice(-1)[0] === "gameplayStop"', timeout=10000))   # (à l'image suivante)
            except Exception: pass
            j = pg.evaluate('() => JOURNAL_SDK.slice()')
            t(f'{titre} : le tour de qualification : gameplayStart pendant le tour, gameplayStop au résultat', any(e.get('q') == 'gameplayStart' and e.get('tour') for e in j) and arret, str(j[-4:]))
            pg.click('#boutonQualifCourse')
            pg.wait_for_function('() => JEU.ecran === "course" && JEU.plateau.carte !== null', timeout=60000)
            # la pause en course : gameplayStop ; « Reprendre » : gameplayStart
            pg.evaluate('() => { JEU.course.compte = 0.01; }')
            pg.wait_for_function('() => JEU.course.etat === "course"', timeout=60000); pg.wait_for_timeout(300)
            pg.keyboard.press('Escape')
            pause = pg.wait_for_function('() => JEU.ecran === "pause" && APPELS_SDK.slice(-1)[0] === "gameplayStop"', timeout=5000)
            pg.click('#boutonReprendre')
            reprise = pg.wait_for_function('() => JEU.ecran === "course" && APPELS_SDK.slice(-1)[0] === "gameplayStart"', timeout=5000)
            t(f'{titre} : la pause en course envoie gameplayStop, « Reprendre » gameplayStart', bool(pause) and bool(reprise), pg.evaluate('() => APPELS_SDK.slice(-4)'))
            pendant = None
            for _ in range(120):
                pg.evaluate('() => BOUCLE.simuler(5)')
                if pendant is None and pg.evaluate('() => JEU.ecran === "course" && JEU.course.etat === "course"'): pendant = pg.evaluate('() => APPELS_SDK.includes("commercialBreak")')
                if pg.evaluate('() => JEU.ecran') == 'podium': break
                pg.wait_for_timeout(30)
            t(f'{titre} : la course va jusqu’au podium, sans pause pub pendant la course', pg.evaluate('() => JEU.ecran === "podium"') and pendant is False, str(pg.evaluate('() => [JEU.ecran, APPELS_SDK]')))
            t(f'{titre} : le podium ne fait rien défiler', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
            pg.click('#boutonResultats'); pg.wait_for_function('() => JEU.ecran === "resultats"', timeout=5000)
            t(f'{titre} : les résultats ne font rien défiler', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
            # le résumé vidéo (s'il y en a un) : gameplayStop pendant le rejeu ; Échap ramène aux résultats
            if pg.evaluate('() => !document.getElementById("boutonResume").classList.contains("cache")'):
                pg.click('#boutonResume')
                resume = pg.wait_for_function('() => JEU.ecran === "resume"', timeout=10000); pg.wait_for_timeout(500)
                arret = pg.evaluate('() => APPELS_SDK.filter(a => /^gameplay/.test(a)).slice(-1)[0] === "gameplayStop"')
                pg.keyboard.press('Escape'); pg.wait_for_function('() => JEU.ecran === "resultats"', timeout=10000)
                t(f'{titre} : le résumé vidéo : gameplayStop pendant le rejeu, puis retour aux résultats', bool(resume) and arret, pg.evaluate('() => APPELS_SDK.slice(-3)'))
            pg.click('#boutonChangerResultats'); pg.wait_for_function('() => JEU.ecran === "interview"', timeout=10000)
            t(f'{titre} : l’interview ne fait rien défiler', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
            pg.click('#boutonPasCommentaire'); pg.wait_for_function('() => JEU.ecran === "une"', timeout=10000)
            t(f'{titre} : la une ne fait rien défiler', pas_de_defilement(pg.evaluate(DEFILE)), str(pg.evaluate(DEFILE)))
            avant = pg.evaluate('() => APPELS_SDK.slice()')
            t(f'{titre} : jusqu’à la une, aucune pause pub', 'commercialBreak' not in avant, str(avant))
            pg.click('#uneTitre'); pg.wait_for_function('() => JEU.ecran === "championnat"', timeout=10000)
            pg.click('#boutonCourseSuivante')
            pg.wait_for_function('() => APPELS_SDK.includes("commercialBreak")', timeout=10000)
            appels = pg.evaluate('() => APPELS_SDK.slice()')
            jeu = [a for a in appels if a in ('gameplayStart', 'gameplayStop')]
            double = [i for i in range(1, len(jeu)) if jeu[i] == jeu[i - 1]]
            t(f'{titre} : « Course suivante » après la une : la pause pub entre deux Grands Prix (commercialBreak une fois), gameplayStop avant, le son coupé pendant la pub, jamais deux fois de suite le même ({" → ".join(appels)})',
              appels.count('commercialBreak') == 1 and appels.count('gameLoadingFinished') == 1 and 'gameplayStart' in jeu and jeu[-1] == 'gameplayStop' and not double and pg.evaluate('() => SDK.pubEnCours && SON.muet'), str(appels))
            f = verifier_sdk(pg.evaluate('() => JOURNAL_SDK.slice()'))
            t(f'{titre} : les règles du SDK sur tout le parcours (qualification, course, pause, résumé, interview, une, pub entre deux Grands Prix)', not f, f)
            t(f'{titre} : console vide sur tout le parcours', not console, ' | '.join(console)[:400])
            ctx.close()
            # le mode 2 joueurs et le tutoriel, depuis le zip : les mêmes règles ; la pub de « Revanche » tombe sur les résultats
            for titre, adresse in (('paquet 2 joueurs 1280×720', 'index.html?deux=1&ia=3&robot=1&circuit=test'), ('paquet tutoriel 1280×720', 'index.html?tutoriel=conduite&course=1')):
                ctx = b.new_context(viewport={'width': 1280, 'height': 720})
                pg = ctx.new_page(); console = []
                pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
                pg.add_init_script(FAUX_SDK)
                pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
                pg.goto('file://' + dossier + '/' + adresse)
                # (la grille vue d'en haut se passe ; le compte à rebours est écourté, les feux restent)
                pret = False
                if 'tutoriel=' in adresse:   # (la leçon attend le pilote : le robot d'essai conduit, comme dans les tests du tutoriel)
                    pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "course"', timeout=30000); pg.evaluate('() => { JEU.robot = true; }'); pg.keyboard.down('ArrowUp')
                for _ in range(600):
                    pret = pg.evaluate('() => { if (typeof JEU === "undefined") return false; if (JEU.ecran === "grille" && typeof finirGrille === "function") finirGrille(); if (JEU.course && JEU.course.etat === "attente" && JEU.plateau && JEU.plateau.carte === null) return false; return JEU.ecran === "course" && !!JEU.course && JEU.course.etat === "course"; }')
                    if pret: break
                    pg.wait_for_timeout(300)
                t(f'{titre} : la course démarre depuis le zip', pret, str(pg.evaluate('() => typeof JEU === "undefined" ? null : [JEU.ecran, JEU.course && JEU.course.etat, JEU.course && JEU.course.compte, !!(JEU.plateau && JEU.plateau.carte)]')))
                if not pret: ctx.close(); continue
                pg.wait_for_timeout(500)
                pg.keyboard.press('Escape')
                pause = pg.wait_for_function('() => JEU.ecran === "pause" && APPELS_SDK.slice(-1)[0] === "gameplayStop"', timeout=5000)
                t(f'{titre} : la voiture roule (gameplayStart après les feux), la pause envoie gameplayStop', 'gameplayStart' in pg.evaluate('() => APPELS_SDK') and bool(pause), pg.evaluate('() => APPELS_SDK.slice()'))
                if 'deux=1' in adresse:
                    pg.click('#boutonReprendre')
                    dj = pg.evaluate('() => { INTERFACE.ouvrirAides(); const txt = document.getElementById("choixAidesBonus").textContent; INTERFACE.fermerAides(); return { txt, sans: texte("aidesSansArgent"), aides: INTERFACE.aidesDeux(), noms: [...document.querySelectorAll(".deuxNom")].map(e => e.textContent), m: texte("aidesMarque") }; }')
                    t(f'{titre} : à deux, pas d’argent ni de bonus, et les aides de chacun à côté de son nom ({dj["noms"]})',
                      dj['txt'] == dj['sans'] and len(dj['noms']) == 2 and all((dj['m'] in n) == a for n, a in zip(dj['noms'], dj['aides'])), str(dj))
                    for _ in range(200):
                        if pg.evaluate('() => JEU.ecran') == 'podium': break
                        pg.evaluate('() => { if (JEU.attente && !JEU.attente.passer) passerAuPodium(); BOUCLE.simuler(5); }'); pg.wait_for_timeout(30)
                    pg.click('#boutonResultats'); pg.wait_for_function('() => JEU.ecran === "resultats"', timeout=10000)
                    pg.click('#boutonRejouerResultats')
                    pub = pg.wait_for_function('() => APPELS_SDK.includes("commercialBreak")', timeout=10000)
                    t(f'{titre} : « Revanche » : la pub tombe entre deux courses, sur les résultats', bool(pub) and any(e.get('q') == 'commercialBreak' and e.get('ecran') in ('resultats', 'podium') for e in pg.evaluate('() => JOURNAL_SDK')), str(pg.evaluate('() => JOURNAL_SDK.slice(-3)')))
                f = verifier_sdk(pg.evaluate('() => JOURNAL_SDK.slice()'))
                t(f'{titre} : les règles du SDK sur le journal', not f and not console, [f, console])
                ctx.close()
            # L'ANGLAIS (tour 37c) : la ponctuation anglaise n'a pas d'espace avant « : ; ! ? » (« Teammate duel: », jamais « Teammate duel : ») ;
            # le texte lu sur les écrans du paddock (championnat, calendrier, fiche, garage, album), les bulles (title) et la rivalité à deux
            titre = 'paquet anglais 1280×720'
            ctx = b.new_context(viewport={'width': 1280, 'height': 720}, locale='en-US')
            pg = ctx.new_page(); console = []
            pg.add_init_script(FAUX_SDK)
            pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.goto('file://' + dossier + '/index.html?championnat=1&tours=1&robot=1&gp=6&lang=en')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=60000)
            LIRE = """() => [document.body.innerText, ...[...document.querySelectorAll('[title]')].map(e => e.title)].join('\\n')"""
            lus = {'paddock': pg.evaluate(LIRE)}
            # (tour 37c) le panneau des classements : le contenu en haut, les 20 pilotes en une colonne qui le remplissent (plus de grand vide au-dessus)
            pan = pg.evaluate("""() => { const p = document.getElementById("championnatTableaux").getBoundingClientRect(), h = document.querySelector("#championnatTableaux h2").getBoundingClientRect(),
              l = [...document.querySelectorAll("#championnatPilotes li")], d = l[l.length - 1].getBoundingClientRect(); return { haut: h.top - p.top, rempli: (d.bottom - p.top) / p.height, n: l.length, bas: d.bottom <= p.bottom + 1, colonne: l[0].getBoundingClientRect().left === d.left }; }""")
            t(f'{titre} : au paddock, les classements commencent en haut du panneau ({pan["haut"]:.0f} px) et les {pan["n"]} pilotes en une colonne le remplissent à {pan["rempli"] * 100:.0f} %, sans déborder',
              pan['haut'] < 30 and pan['rempli'] > 0.7 and pan['bas'] and pan['colonne'] and pan['n'] == 20, str(pan))
            for nom, montrer, quitter in (('calendrier', 'montrerCalendrier()', 'quitterCalendrier()'), ('fiche', 'montrerFiche(3)', 'quitterFiche()'),
                                          ('garage', 'montrerGarage()', 'quitterGarage()'), ('album', 'montrerAlbum()', 'quitterAlbum()')):
                pg.evaluate(f'() => {montrer}'); pg.wait_for_timeout(300); lus[nom] = pg.evaluate(LIRE); pg.evaluate(f'() => {quitter}')
            lus['rivalite'] = pg.evaluate('() => { INTERFACE.remplirRivalite({ noms: ["Leo", "Sam"], score: [1, 2] }); return document.getElementById("resultatsRivalite").textContent; }')
            fautes = [f'{k} : « {m.group(0).strip()} »' for k, x in lus.items() for m in re.finditer(r'\S{1,20} [:;!?](?=\s|$)', x)]
            t(f'{titre} : la langue est l’anglais (« {pg.evaluate("() => LANGUE")} »), le duel et la rivalité s’écrivent « Teammate duel: … », « …: Leo 1 – 2 Sam »',
              pg.evaluate('() => LANGUE') == 'en' and 'Teammate duel: ' in lus['paddock'] and lus['rivalite'].endswith('Leo 1 – 2 Sam') and ' : ' not in lus['rivalite'], str([lus['rivalite'], lus['paddock'][:300]]))
            t(f'{titre} : aucune espace avant « : ; ! ? » sur les écrans anglais ({", ".join(lus)})', not fautes and not console, str([fautes[:10], console]))
            ctx.close()
            # LES ACCORDS DE NOMBRE (tour 37d) : sur les mêmes écrans, en anglais et en français, jamais « 1 pts », « 1 tours », « 1 races »… (en
            # français, le singulier aussi à 0 : « 0 pt », « 0 victoire ») ; le paddock du 6e Grand Prix a des pilotes à 0, 1 et plusieurs points
            UNITES = {'en': r'pts|points|laps|races|seasons|wins|podiums|titles|poles|years|generations|seconds', 'fr': r'pts|points|tours|courses|saisons|victoires|podiums|titres|poles|ans|générations|secondes'}
            for lg in ('en', 'fr'):
                titre = f'paquet accords {lg} 1280×720'
                ctx = b.new_context(viewport={'width': 1280, 'height': 720}); pg = ctx.new_page(); console = []
                pg.add_init_script(FAUX_SDK)
                pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
                pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
                pg.goto('file://' + dossier + f'/index.html?championnat=1&tours=1&robot=1&gp=6&lang={lg}')
                pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=60000)
                lus = {'paddock': pg.evaluate(LIRE)}
                for nom, montrer, quitter in (('calendrier', 'montrerCalendrier()', 'quitterCalendrier()'), ('fiche', 'montrerFiche(3)', 'quitterFiche()'),
                                              ('album', 'montrerAlbum()', 'quitterAlbum()'), ('arbre', 'montrerArbre()', 'quitterArbre()')):
                    pg.evaluate(f'() => {montrer}'); pg.wait_for_timeout(300); lus[nom] = pg.evaluate(LIRE); pg.evaluate(f'() => {quitter}')
                un = '[01]' if lg == 'fr' else '1'
                fautes = [f'{k} : « {m.group(0).strip()} »' for k, x in lus.items() for m in re.finditer(r'(?<![\d.,\u00a0])' + un + r'[ \u00a0](' + UNITES[lg] + r')\b', x)]
                vus = sorted({m.group(1) for x in lus.values() for m in re.finditer(r'(?<![\d.,])([012]) (pts?)\b', x)})
                t(f'{titre} : aucun « {un} » suivi d’un pluriel sur le paddock, le calendrier, une fiche, l’album et l’arbre (points vus à {", ".join(vus)})',
                  not fautes and not console and '1' in vus, str([fautes[:10], console, vus]))
                ctx.close()
            # LES AIDES AU PILOTAGE, CHOISIES AVANT LA COURSE (tour 37e, le propriétaire 2026-10-30) : au paddock, le choix une par une (à tous les niveaux),
            # le bonus annoncé, gardé après rechargement (d'un Grand Prix à l'autre) ; le bonus sur l'écran des gains ; en tournoi, pas
            # d'argent : les aides de chacun à côté de son nom ; les boutons du titre, de la course rapide et des leçons ouvrent le même choix
            titre = 'paquet aides 1280×720'
            ctx = b.new_context(viewport={'width': 1280, 'height': 720}); pg = ctx.new_page(); console = []
            pg.add_init_script(FAUX_SDK)
            pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            page_ch = 'file://' + dossier + '/index.html?championnat=1&tours=1&robot=1&gp=3'
            pg.goto(page_ch)
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=60000)
            avant = pg.evaluate('() => ({ niveau: REGLAGES.NIVEAU, aides: Object.assign({}, JEU.assistance), visible: !!document.getElementById("boutonAidesPaddock").offsetParent })')
            pg.click('#boutonAidesPaddock')
            pg.click('#choixAidesListe button[data-aide=direction]'); pg.click('#choixAidesListe button[data-aide=freinage]')
            ch = pg.evaluate('() => ({ aides: Object.assign({}, JEU.assistance), sauve: SAUVEGARDE.option("aides_pilotage", null), bonus: document.getElementById("choixAidesBonus").textContent, ouvert: !document.getElementById("choixAides").classList.contains("cache"), attendu: ASSISTANCE.bonus(JEU.assistance) })')
            pg.click('#boutonAidesValider')
            ferme = pg.evaluate('() => document.getElementById("choixAides").classList.contains("cache") && JEU.ecran === "championnat"')
            base = avant['aides']
            t(f'{titre} : au paddock, « Aides au pilotage » ouvre le choix ; un clic par aide (direction, freinage) les change, sauvegardé ; le bonus annoncé suit (« {ch["bonus"]} »)',
              avant['visible'] and ch['ouvert'] and ferme and ch['aides']['direction'] != base['direction'] and ch['aides']['freinage'] != base['freinage'] and ch['sauve'] == ch['aides']
              and (str(round(ch['attendu'] * 100)) in ch['bonus'] if ch['attendu'] > 0 else True), str([avant, ch]))
            # le bonus sur l'écran des gains (les gains d'un classement inventé, sans aucune aide, puis avec toutes)
            g = pg.evaluate("""() => { const ch = JEU.championnat, j = ch.pilotes.find(p => p.humain), lignes = ch.pilotes.map((p, i) => ({ k: p.id, place: p === j ? 1 : i + 2, grille: p === j ? 5 : i + 1, meilleurTour: p === j ? 50 : 60, classe: true }));
              const sans = { direction: false, freinage: false, antiblocage: false, antipatinage: false }, g = ARGENT.gains(ch, lignes, sans), toutes = ARGENT.gains(ch, lignes, ASSISTANCE.reglees(null, 'debutant'));
              g.placeNumero = 1; INTERFACE.remplirArgent(g); const txt = document.getElementById('resultatsArgent').textContent; INTERFACE.remplirArgent(null);
              return { txt, bonus: g.sansAide, f: ARGENT.formater(g.sansAide), cle: texte('argentSansAide').split('{n}')[0], toutes: toutes.sansAide, totalToutes: toutes.total, totalSans: g.total }; }""")
            t(f'{titre} : l’écran des gains montre le bonus sans aide (« {g["cle"]}{g["f"]} ») ; toutes les aides allumées, aucun bonus',
              g['bonus'] > 0 and (g['cle'] + g['f']) in g['txt'] and g['toutes'] == 0 and g['totalSans'] >= g['totalToutes'], str(g))
            pg.goto(page_ch)
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=60000)
            garde = pg.evaluate('() => Object.assign({}, JEU.assistance)')
            t(f'{titre} : le choix est gardé après rechargement (d’un Grand Prix à l’autre)', garde == ch['aides'], str([garde, ch['aides']]))
            boutons = pg.evaluate("""() => ['boutonAidesTitre', 'boutonAidesChoix', 'boutonAidesTuto', 'boutonAidesPaddock'].map(id => { const b = document.getElementById(id); return [id, !!b, !!b && b.textContent === texte('aidesBouton')]; })""")
            t(f'{titre} : le bouton « Aides au pilotage » est au titre, à la course rapide, au menu des leçons et au paddock', all(x[1] and x[2] for x in boutons), str(boutons))
            amis = pg.evaluate("""() => { INTERFACE.noterAidesAmi('Léo', true); INTERFACE.noterAidesAmi('Sam', false);
              INTERFACE.remplirAToi({ prenom: 'Léo', casque: TOURNOI.casqueDefaut(0) }, 0, 1, 'X'); const a1 = document.getElementById('atoiTitre').textContent;
              INTERFACE.remplirAToi({ prenom: 'Sam', casque: TOURNOI.casqueDefaut(1) }, 0, 1, 'X'); const a2 = document.getElementById('atoiTitre').textContent;
              return { a1, a2, m: texte('aidesMarque'), leo: INTERFACE.aidesAmi('léo'), sam: INTERFACE.aidesAmi('SAM') }; }""")
            t(f'{titre} : au tournoi, les aides de chacun à côté de son nom (« {amis["a1"]} » / « {amis["a2"]} »), gardées par prénom',
              amis['m'] in amis['a1'] and amis['m'] not in amis['a2'] and amis['leo'] is True and amis['sam'] is False and not console, str([amis, console]))
            ctx.close()
            # SANS réseau : le script du SDK Poki échoue (requête refusée) ; le jeu reste jouable, sans SDK (sdk.js le tolère) ; la seule
            # trace est l'échec de ce script
            titre = 'paquet sans réseau 960×600'
            ctx = b.new_context(viewport={'width': 960, 'height': 600})
            pg = ctx.new_page(); console = []; echecs = []
            pg.route('**/poki-sdk.js', lambda r: r.abort())
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.on('requestfailed', lambda r: echecs.append(r.url))
            pg.goto('file://' + dossier + '/index.html')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "titre"', timeout=60000)
            pg.click('#boutonJouer')
            jouable = pg.wait_for_function('() => JEU.ecran === "course" && JEU.decouverte && JEU.course', timeout=120000)
            autres = [c for c in console if 'poki-sdk' not in c and 'ERR_FAILED' not in c and 'Failed to load resource' not in c]
            t(f'{titre} : le script du SDK Poki échoue, le jeu marche quand même (titre, « Jouer », la découverte), sans SDK, aucune autre erreur',
              bool(jouable) and pg.evaluate('() => !SDK.present && JEU.sdkPret') and all('poki-sdk.js' in u for u in echecs) and not autres, str([echecs, console]))
            ctx.close()
        finally:
            b.close()
finally:
    shutil.rmtree(dossier, ignore_errors=True)
print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
sys.exit(0 if ko == 0 else 1)
