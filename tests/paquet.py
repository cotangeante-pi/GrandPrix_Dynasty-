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
import json, os, re, sys, shutil, tempfile, zipfile
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
    # (tour 51c) les voix enregistrées (voix-sons.js) : sons/voix/*.m4a font partie du jeu
    sons = sorted('sons/voix/' + f for f in os.listdir(os.path.join(RACINE, 'sons', 'voix'))) if os.path.isdir(os.path.join(RACINE, 'sons', 'voix')) else []
    return ['index.html'] + sorted(set(locaux)) + sons, externes

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
            # (tour 55, T9) LE TÉLÉPHONE depuis le zip (iPhone SE couché, vrais toucher) : « Jouer » au doigt, gameplayStart seulement aux feux éteints,
            # le téléphone debout en pleine course = pause = gameplayStop (et il ne reprend pas tout seul couché), « Reprendre » = gameplayStart, console
            # vide, aucun commercialBreak, et la mesure du clic aux feux (la cible de 10 s est celle du propriétaire sur un vrai appareil : sous swiftshader on note la valeur)
            titre = 'paquet téléphone iPhone SE couché'
            prof = p.devices['iPhone SE landscape']
            args_tel = {k: v for k, v in prof.items() if k != 'default_browser_type'}
            PLEIN_ECRAN_REFUSE = " Element.prototype.requestFullscreen = function () { return Promise.reject(new Error('refus')); };"
            ctx = b.new_context(**args_tel)
            pg = ctx.new_page(); console = []
            pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
            pg.add_init_script(FAUX_SDK + PLEIN_ECRAN_REFUSE)
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.goto('file://' + dossier + '/index.html')
            pg.wait_for_function('() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "titre"', timeout=60000)
            pg.wait_for_timeout(500)
            lt, ht = prof['viewport']['width'], prof['viewport']['height']
            t(f'{titre} {lt}×{ht} : depuis le zip, l’écran titre au doigt, la console vide, la page ne défile pas', not console and pas_de_defilement(pg.evaluate(DEFILE)), ' | '.join(console)[:300] + str(pg.evaluate(DEFILE)))
            bb = pg.locator('#boutonJouer').bounding_box()
            pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
            pg.wait_for_function('() => JEU.ecran === "course" && JEU.decouverte && JEU.course', timeout=120000)
            pg.wait_for_function('() => JEU.course.feux && JEU.course.etat !== "compte"', timeout=240000)
            pg.wait_for_timeout(500)
            mesure = pg.evaluate('() => JEU.clicAuxFeux')
            appels = pg.evaluate('() => APPELS_SDK.slice()')
            t(f'{titre} : « Jouer » au toucher : init, gameLoadingFinished une fois, gameplayStart aux feux éteints seulement, aucune pub ({" → ".join(appels)})',
              appels[:2] == ['init', 'gameLoadingFinished'] and appels.count('gameLoadingFinished') == 1 and appels.count('gameplayStart') == 1 and 'commercialBreak' not in appels and not verifier_sdk(pg.evaluate('() => JOURNAL_SDK.slice()')), str(appels))
            L.append(f'  (téléphone émulé, depuis le zip, sous swiftshader : du clic sur « Jouer » aux feux éteints {(mesure or 0) / 1000:.1f} s ; la cible du propriétaire est 10 s sur un vrai appareil)')
            t(f'{titre} : la mesure du clic aux feux existe et reste raisonnable (< 40 s sous swiftshader)', mesure is not None and 0 < mesure < 40000, str(mesure))
            pg.evaluate('() => { REGLAGES.PORTRAIT_TOURNER = false; }')   # (tour 56, T15 : ici le message d'avant ; le jeu tourné est dans tests/tourne.py)
            pg.set_viewport_size({'width': ht, 'height': lt})   # le téléphone debout
            pg.wait_for_function('() => JEU.ecran === "pause" && APPELS_SDK.slice(-1)[0] === "gameplayStop"', timeout=10000)
            t(f'{titre} : le téléphone debout en pleine course met la course en pause : gameplayStop, le message « tourne ton téléphone »', pg.evaluate('() => !document.getElementById("tactilePortrait").classList.contains("cache")'), str(pg.evaluate('() => APPELS_SDK.slice(-3)')))
            pg.set_viewport_size({'width': lt, 'height': ht})   # de nouveau couché
            pg.wait_for_timeout(800)
            t(f'{titre} : couché de nouveau, la course ne reprend pas toute seule (pause, pas de gameplayStart de plus)', pg.evaluate('() => JEU.ecran === "pause" && APPELS_SDK.slice(-1)[0] === "gameplayStop"'), str(pg.evaluate('() => [JEU.ecran, APPELS_SDK.slice(-3)]')))
            bb = pg.locator('#boutonReprendre').bounding_box()
            pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
            pg.wait_for_function('() => JEU.ecran === "course" && APPELS_SDK.slice(-1)[0] === "gameplayStart"', timeout=10000)
            appels = pg.evaluate('() => APPELS_SDK.slice()')
            jeu = [a for a in appels if a in ('gameplayStart', 'gameplayStop')]
            f = verifier_sdk(pg.evaluate('() => JOURNAL_SDK.slice()'))
            t(f'{titre} : « Reprendre » au toucher : gameplayStart, jamais deux fois le même état de suite, les règles du SDK tenues, console vide', not f and not [i for i in range(1, len(jeu)) if jeu[i] == jeu[i - 1]] and not console, [f, console])
            ctx.close()
            # (tour 55, T9) L'APRÈS-COURSE EN 2 CLICS sur téléphone, depuis le zip : podium → « Continuer » → interview → « Passer » → une → paddock :
            # aucune pub avant « Course suivante », puis une seule, entre deux Grands Prix, gameplayStop d'abord, le son coupé
            titre = 'paquet après-course en 2 clics, téléphone'
            ctx = b.new_context(**args_tel)
            pg = ctx.new_page(); console = []
            pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
            pg.add_init_script(FAUX_SDK.replace("commercialBreak() { noter('commercialBreak'); return Promise.resolve(); }", "commercialBreak() { noter('commercialBreak'); return new Promise(() => {}); }") + PLEIN_ECRAN_REFUSE)
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.goto('file://' + dossier + '/index.html?championnat=1&tours=1&robot=1')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=60000)
            pg.click('#boutonCourseSuivante')
            pg.wait_for_function('() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', timeout=10000)
            pg.wait_for_function('() => JEU.plateau && JEU.plateau.carte !== null', timeout=240000)
            pg.click('#boutonQualifTour')
            for _ in range(200):
                if pg.evaluate('() => JEU.qualif && JEU.qualif.etat === "resultat"'): break
                pg.evaluate('() => { if (JEU.qualif && JEU.qualif.etat === "tour") BOUCLE.simuler(5); }'); pg.wait_for_timeout(30)
            pg.wait_for_function('() => JEU.qualif && JEU.qualif.etat === "resultat"', timeout=240000)
            pg.click('#boutonQualifCourse')
            pg.wait_for_function('() => JEU.ecran === "course" && JEU.plateau.carte !== null', timeout=60000)
            pg.evaluate('() => { JEU.course.compte = 0.01; }')
            for _ in range(120):
                pg.evaluate('() => BOUCLE.simuler(5)')
                if pg.evaluate('() => JEU.ecran') == 'podium': break
                pg.wait_for_timeout(30)
            t(f'{titre} : la course va jusqu’au podium', pg.evaluate('() => JEU.ecran === "podium"'), pg.evaluate('() => JEU.ecran'))
            t(f'{titre} : le podium a son gros « Continuer » (APRES_PODIUM_DIRECT), plus grand que 40 px au doigt', pg.evaluate('() => { const b = document.getElementById("boutonPodiumSuite"), r = b.getBoundingClientRect(); return !b.classList.contains("cache") && Math.min(r.width, r.height) >= 40; }'), '')
            pg.click('#boutonPodiumSuite'); pg.wait_for_function('() => JEU.ecran === "interview"', timeout=10000)   # clic 1
            pg.click('#boutonPasCommentaire'); pg.wait_for_function('() => JEU.ecran === "une"', timeout=10000)   # clic 2
            avant = pg.evaluate('() => APPELS_SDK.slice()')
            t(f'{titre} : en 2 clics du podium à la une, aucune pause pub, gameplayStop au podium et il le reste', 'commercialBreak' not in avant and avant[-1] == 'gameplayStop', str(avant))
            pg.click('#uneTitre'); pg.wait_for_function('() => JEU.ecran === "championnat"', timeout=10000)
            pg.click('#boutonCourseSuivante')
            pg.wait_for_function('() => APPELS_SDK.includes("commercialBreak")', timeout=10000)
            appels = pg.evaluate('() => APPELS_SDK.slice()')
            jeu = [a for a in appels if a in ('gameplayStart', 'gameplayStop')]
            t(f'{titre} : la pause pub vient une seule fois, entre deux Grands Prix, après gameplayStop, le son coupé pendant la pub', appels.count('commercialBreak') == 1 and jeu[-1] == 'gameplayStop' and not [i for i in range(1, len(jeu)) if jeu[i] == jeu[i - 1]] and pg.evaluate('() => SDK.pubEnCours && SON.muet'), str(appels))
            f = verifier_sdk(pg.evaluate('() => JOURNAL_SDK.slice()'))
            t(f'{titre} : les règles du SDK sur tout le parcours, console vide', not f and not console, [f, console])
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
            # (tour 48a) au paddock, chaque page du menu est lue (innerText ne lit que la page affichée), puis on revient sur « Course »
            LIRE_PADDOCK = """() => { const lu = []; for (const p of ['course', 'equipe', 'boutique', 'saison', 'messages', 'reglages']) { INTERFACE.pagePaddock(p); lu.push(document.body.innerText); }
              INTERFACE.pagePaddock('course'); return lu.concat([...document.querySelectorAll('[title]')].map(e => e.title)).join('\\n'); }"""
            lus = {'paddock': pg.evaluate(LIRE_PADDOCK)}
            # (tour 37c) le panneau des classements : le contenu en haut, les 20 pilotes en une colonne qui le remplissent (plus de grand vide au-dessus)
            pan = pg.evaluate("""() => { INTERFACE.pagePaddock('saison'); const p = document.getElementById("championnatTableaux").getBoundingClientRect(), h = document.querySelector("#championnatTableaux h2").getBoundingClientRect(),
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
                lus = {'paddock': pg.evaluate(LIRE_PADDOCK)}
                for nom, montrer, quitter in (('calendrier', 'montrerCalendrier()', 'quitterCalendrier()'), ('fiche', 'montrerFiche(3)', 'quitterFiche()'),
                                              ('album', 'montrerAlbum()', 'quitterAlbum()'), ('arbre', 'montrerArbre()', 'quitterArbre()')):
                    pg.evaluate(f'() => {montrer}'); pg.wait_for_timeout(300); lus[nom] = pg.evaluate(LIRE); pg.evaluate(f'() => {quitter}')
                # (tour 37f) les écrans qui restent, remplis avec 0, 1 et 2 : le classement du tournoi (points), les gains (places gagnées),
                # les résultats à deux, la fin de saison (le classement du championnat après un Grand Prix), le bilan de carrière
                lus['tournoi'] = pg.evaluate('''() => { const c = TOURNOI.casqueDefaut(0); INTERFACE.remplirFinTournoi([0, 1, 2].map(n => ({ prenom: 'J' + n, casque: c, temps: 60 + n, penalites: 0, points: n })), true);
                  return document.getElementById('tournoiFinListe').innerText; }''')
                lus['gains'] = pg.evaluate('''() => [0, 1, 2].map(n => { INTERFACE.remplirArgent({ place: 1000, placeNumero: 3, meilleurTour: 0, placesGagnees: n * 1000, nbPlacesGagnees: n, duel: 0, sansAide: 0, total: 1000 + n * 1000, plafonne: false });
                  return document.getElementById('resultatsArgent').textContent; }).join('\\n')''')
                lus['bilan'] = pg.evaluate('''() => [0, 1, 2].map(n => { try { INTERFACE.remplirRetraite({ raison: 'age', saisons: n, saison: n, titres: n, victoires: n, podiums: n, poles: n, points: n, courses: n, meilleurePlace: 1 }); } catch (e) { return 'ERREUR ' + e.message; }
                  return document.getElementById('retraite').innerText; }).join('\\n')''')
                un = '[01]' if lg == 'fr' else '1'
                fautes = [f'{k} : « {m.group(0).strip()} »' for k, x in lus.items() for m in re.finditer(r'(?<![\d.,\u00a0])' + un + r'[ \u00a0](' + UNITES[lg] + r')\b', x)]
                vus = sorted({m.group(1) for x in lus.values() for m in re.finditer(r'(?<![\d.,])([012]) (pts?)\b', x)})
                t(f'{titre} : aucun « {un} » suivi d’un pluriel sur le paddock, le calendrier, une fiche, l’album, l’arbre, le tournoi, les gains et le bilan (avec 0, 1 et 2 ; points vus à {", ".join(vus)})',
                  not fautes and not console and '1' in vus and 'ERREUR' not in lus['bilan'] and 'J1' in lus['tournoi'], str([fautes[:10], console, vus, lus['bilan'][:200]]))
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
            pg.click('#menuReglages')   # (tour 48a : « Aides au pilotage » est dans la page Réglages du paddock)
            avant = pg.evaluate('() => ({ niveau: REGLAGES.NIVEAU, aides: Object.assign({}, JEU.assistance), visible: document.getElementById("boutonAidesPaddock").getBoundingClientRect().width > 0 })')
            pg.click('#boutonAidesPaddock')
            # (tour 37g) la première fois, la bulle d'aide du choix : ce que fait chaque aide, et le bonus ; chaque bouton dit ce que fait son aide
            bulle = pg.wait_for_function('() => { const b = document.getElementById("bulleAide"); return !b.classList.contains("cache") && b.dataset.aide === "choixAides" && document.getElementById("bulleAideTexte").textContent === texte("aide_choixAides"); }', timeout=8000)
            quoi = pg.evaluate('() => [...document.querySelectorAll("#choixAidesListe button .quoi")].map(e => e.textContent)')
            t(f'{titre} : la première ouverture du choix des aides montre sa bulle d’aide (ce que fait chaque aide, le bonus), et chaque aide dit ce qu’elle fait',
              bool(bulle) and len(quoi) == 4 and all(len(q) > 10 for q in quoi), str(quoi))
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
            # (tour 45c) la voix du commentateur, sans voix dans le Chrome sans écran : rien ne casse ; le réglage du menu pause, sauvegardé
            vx = pg.evaluate('''() => { const d = VOIX.disponible(); let r = null, err = null; try { r = VOIX.dire('Test', true); VOIX.taire(); } catch (e) { err = String(e); }
              const b = document.getElementById('boutonVoixPause'), t0 = b.textContent; b.click(); const o1 = SAUVEGARDE.option('voix', true), t1 = b.textContent; b.click();
              return { d, r, err, t0, t1, o1, o2: SAUVEGARDE.option('voix', true), oui: texte('voix_oui'), non: texte('voix_non') }; }''')
            t(f'{titre} : la voix du commentateur (voix.js) : sans voix ou sans le son, rien ne casse ; le menu pause la coupe et la remet (sauvegardé)',
              vx['err'] is None and (vx['r'] is False or vx['d']) and vx['t0'] == vx['oui'] and vx['t1'] == vx['non'] and vx['o1'] is False and vx['o2'] is True and not console, str([vx, console]))
            t(f'{titre} : le bouton « Aides au pilotage » est au titre, à la course rapide, au menu des leçons et au paddock', all(x[1] and x[2] for x in boutons), str(boutons))
            amis = pg.evaluate("""() => { INTERFACE.noterAidesAmi('Léo', true); INTERFACE.noterAidesAmi('Sam', false);
              INTERFACE.remplirAToi({ prenom: 'Léo', casque: TOURNOI.casqueDefaut(0) }, 0, 1, 'X'); const a1 = document.getElementById('atoiTitre').textContent;
              INTERFACE.remplirAToi({ prenom: 'Sam', casque: TOURNOI.casqueDefaut(1) }, 0, 1, 'X'); const a2 = document.getElementById('atoiTitre').textContent;
              return { a1, a2, m: texte('aidesMarque'), leo: INTERFACE.aidesAmi('léo'), sam: INTERFACE.aidesAmi('SAM') }; }""")
            t(f'{titre} : au tournoi, les aides de chacun à côté de son nom (« {amis["a1"]} » / « {amis["a2"]} »), gardées par prénom',
              amis['m'] in amis['a1'] and amis['m'] not in amis['a2'] and amis['leo'] is True and amis['sam'] is False and not console, str([amis, console]))
            ctx.close()
            # (tour 51c) les voix enregistrées, depuis le zip : les sons y sont, servis avec un type audio, décodés par Chrome après la découverte,
            # jamais avant le premier geste ; un son joué passe par le mixage ; console vide
            import mimetypes
            noms_sons = [n for n in zipfile.ZipFile(ZIP).namelist() if n.startswith('sons/voix/')]
            poids_sons = sum(zipfile.ZipFile(ZIP).getinfo(n).file_size for n in noms_sons)
            t(f'paquet : les 45 sons des voix (tour 55, T10 : une prise par phrase, 16 groupes, + 3 prises « remontée » au T22, + 4 prises des nouveautés au T25, en français seulement) sont dans le zip, et pèsent moins de 920 Ko ({poids_sons} octets)', len(noms_sons) == 45 and all(n.startswith('sons/voix/fr-') for n in noms_sons) and poids_sons < 920000, len(noms_sons))
            t('paquet : les sons ont un type audio (' + str(mimetypes.guess_type('x.m4a')[0]) + ')', (mimetypes.guess_type('x.m4a')[0] or '').startswith('audio/') or mimetypes.guess_type('x.m4a')[0] is None)
            titre = 'paquet voix enregistrées 1280×720'
            ctx = b.new_context(viewport={'width': 1280, 'height': 720})
            pg = ctx.new_page(); console = []
            pg.add_init_script(FAUX_SDK)
            pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.on('request', lambda r: sons_vus.append(r.url) if '/sons/voix/' in r.url else None)
            sons_vus = []
            pg.goto('file://' + dossier + '/index.html?voixsons=1&lang=fr')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "titre"', timeout=60000)
            pg.wait_for_timeout(1500)
            t(f'{titre} : ?voixsons=1 allume les voix ; avant le premier geste et pendant la découverte, aucun son demandé ni lu', pg.evaluate('() => VOIXSONS.active && !SON.actif') and not sons_vus, sons_vus[:3])
            pg.mouse.click(640, 360); pg.wait_for_timeout(500)
            pg.evaluate('() => { VOIXSONS.charger(); }')
            t(f'{titre} : après un geste, pendant la découverte, rien ne se charge', not sons_vus, sons_vus[:3])
            pg.evaluate('() => { JEU.decouverte = false; VOIXSONS.charger(); }')
            try: pg.wait_for_function('() => { const e = VOIXSONS.etat()[LANGUE] || {}; return VOIXSONS.CLES.every(c => e[c] === VOIXSONS.PRISES_DE[c]); }', timeout=20000)
            except Exception: pass
            vs = pg.evaluate('() => ({ etat: VOIXSONS.etat(), langue: LANGUE, ctx: SON.etatContexte, joue: VOIXSONS.jouer("depassement"), joues: VOIXSONS.joues, mem: VOIXSONS.memoire() })')
            t(f'{titre} : (tour 55, T29) les sons décodés pèsent moins de 8 Mo en mémoire ({vs["mem"]} octets ; 24 kHz, ~5 Mo ; au contexte du jeu, 48 kHz, ils feraient ~10 Mo)', 1000000 < vs['mem'] < 8000000, vs['mem'])
            t(f'{titre} : après la découverte, les 45 sons du français sont chargés et décodés par Chrome ({len(sons_vus)} fichiers), un fait joue un son', len(sons_vus) == 45 and vs['langue'] == 'fr' and all(vs['etat'].get('fr', {}).get(c) == n for c, n in pg.evaluate('() => VOIXSONS.PRISES_DE').items()) and vs['joue'] is True, str([vs, sons_vus[:2]]))
            pg.evaluate('() => { SON.basculer(); }')
            muet = pg.evaluate('() => ({ coupe: SON.coupe, joue: VOIXSONS.jouer("erreur") })')
            pg.evaluate('() => { SON.basculer(); }')
            t(f'{titre} : son coupé (M) : aucun son de voix', muet['coupe'] is True and muet['joue'] is False, str(muet))
            t(f'{titre} : console vide', not console, ' | '.join(console)[:400])
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
            # (tour 51e) le lien de défi sur Poki : avec le SDK, « Copier le lien » donne l'adresse de PokiSDK.shareableURL ({defi: code}) ; si elle échoue
            # ou tarde (> 2 s), l'adresse où le jeu tourne, sans erreur console ; et PokiSDK.getURLParam('defi') mène à la grille du défi (une fois par onglet)
            ADRESSE_POKI = 'https://poki.com/fr/g/grand-prix-dynasty?gdgd_defi='
            def page_poki(extra, url, ctx_args=None):
                c = b.new_context(viewport={'width': 960, 'height': 600}); p_ = c.new_page(); cons = []
                p_.add_init_script(FAUX_SDK.replace("window.PokiSDK = {", "window.PokiSDK = { " + extra + ","))
                p_.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
                p_.on('console', lambda m: cons.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
                p_.on('pageerror', lambda e: cons.append('PAGEERROR ' + str(e)))
                p_.goto('file://' + dossier + '/index.html' + url, timeout=90000)
                return c, p_, cons
            MONTRER = """() => { window.COPIES = []; navigator.clipboard.writeText = v => { COPIES.push(v); return Promise.resolve(); };
              document.getElementById('qualifCode').classList.remove('cache'); DEFI_ECRAN.montrerCode('qualifCode', 'GPD-TEST-abc', lienDefi); }"""
            LIEN = '() => { const c = document.querySelector("#qualifCode input.defiLien"); return c ? c.value : ""; }'
            # le code d'un vrai tour (le robot, 3 tours seul)
            ctx, pg, cons = page_poki("getURLParam() { return ''; }", '?course=3&robot=1&circuit=test')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "course" && !!JEU.course', timeout=120000)
            # (tour 51l) le robot (?robot=1) ne fait plus de défi : il conduit ici « comme le joueur », par JEU.cibles (comme tests/ecrans.py)
            pg.evaluate('''() => { JEU.robot = false; BOUCLE.surPhysique(() => { if (JEU.ecran === "course" && JEU.course && courseAutorise(JEU.course)) Object.assign(JEU.cibles, piloteRobot(JEU.joueur, CIRCUIT)); }); }''')
            for _ in range(120):
                pg.evaluate('() => BOUCLE.simuler(5)')
                if pg.evaluate('() => JEU.ecran') == 'fin': break
                pg.wait_for_timeout(50)
            pg.wait_for_function('() => JEU.ecran === "fin"', timeout=10000)
            pg.click('#boutonFinDefi')
            code = pg.evaluate('() => { const c = document.querySelector("#finCode input.defiCode"); return c ? c.value : ""; }')
            ctx.close()
            t('paquet Poki : un vrai code de défi pour les essais du lien', code.startswith('GPD-TEST-'), code[:30])
            # shareableURL répond : le lien et « Copier le lien » donnent son adresse
            ctx, pg, cons = page_poki("shareableURL(p) { noter('shareableURL'); return Promise.resolve('" + ADRESSE_POKI + "' + p.defi); }", '?menu=amis')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "amis"', timeout=60000)
            pg.evaluate(MONTRER); pg.wait_for_timeout(300)
            lien = pg.evaluate(LIEN)
            pg.evaluate('() => document.querySelector("#qualifCode button.defiLien").click()'); pg.wait_for_timeout(200)   # (l'écran de la qualification est caché : le clic part du code)
            copies = pg.evaluate('() => COPIES')
            t('paquet Poki : avec le SDK, le lien de défi est l’adresse de shareableURL, et « Copier le lien » la copie', lien == ADRESSE_POKI + 'GPD-TEST-abc' and copies == [lien] and 'shareableURL' in pg.evaluate('() => APPELS_SDK') and not cons, str([lien, copies, cons]))
            ctx.close()
            # shareableURL échoue (rejet, exception) : l'adresse où le jeu tourne, sans erreur console
            for nom, extra in (('rejette', "shareableURL() { return Promise.reject(new Error('non')); }"), ('lève', "shareableURL() { throw new Error('non'); }")):
                ctx, pg, cons = page_poki(extra, '?menu=amis')
                pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "amis"', timeout=60000)
                pg.evaluate(MONTRER); pg.wait_for_timeout(300)
                lien = pg.evaluate(LIEN)
                t(f'paquet Poki : shareableURL {nom} : le lien garde l’adresse où le jeu tourne (?defi=<code>), sans erreur console', lien.startswith('file://') and lien.endswith('/index.html?defi=GPD-TEST-abc') and not cons, str([lien, cons]))
                ctx.close()
            # shareableURL tarde plus de 2 s : le repli reste, même si la réponse arrive après
            ctx, pg, cons = page_poki("shareableURL(p) { return new Promise(r => setTimeout(() => r('" + ADRESSE_POKI + "' + p.defi), 3500)); }", '?menu=amis')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "amis"', timeout=60000)
            pg.evaluate(MONTRER); pg.wait_for_timeout(2600)
            avant = pg.evaluate(LIEN); pg.wait_for_timeout(1500); apres = pg.evaluate(LIEN)
            t('paquet Poki : shareableURL tarde (> 2 s) : le lien reste l’adresse où le jeu tourne, même quand la réponse arrive ensuite, sans erreur console', avant == apres and avant.startswith('file://') and not cons, str([avant, apres, cons]))
            ctx.close()
            # sans SDK : inchangé (le lien de l'adresse du jeu)
            ctx = b.new_context(viewport={'width': 960, 'height': 600}); pg = ctx.new_page(); cons = []
            pg.route('**/poki-sdk.js', lambda r: r.fulfill(status=404, body=''))
            pg.on('pageerror', lambda e: cons.append(str(e)))
            pg.goto('file://' + dossier + '/index.html?menu=amis', timeout=90000)
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "amis"', timeout=60000)
            pg.evaluate(MONTRER); pg.wait_for_timeout(300)
            lien = pg.evaluate(LIEN)
            t('paquet Poki : sans SDK, le lien est l’adresse du jeu + ?defi=<code>, comme avant', lien.startswith('file://') and lien.endswith('/index.html?defi=GPD-TEST-abc') and not cons, str([lien, cons]))
            ctx.close()
            # getURLParam('defi') : le code passé par la page Poki mène directement à la grille du défi ; rechargé, le jeu ne le relit pas
            ctx, pg, cons = page_poki("getURLParam(n) { return n === 'defi' ? " + json.dumps(code) + " : ''; }", '')
            pg.wait_for_function('() => typeof JEU !== "undefined" && !!JEU.defi && JEU.ecran === "qualif"', timeout=90000)
            e = pg.evaluate('() => ({ circuit: NOM_CIRCUIT, enCours: SAUVEGARDE.defis().enCours, recus: SAUVEGARDE.defis().liste.length })')
            t('paquet Poki : getURLParam(\'defi\') mène à la grille du défi (le circuit du code, le défi reçu et gardé), sans erreur console', e['circuit'] == 'test' and e['enCours'] == code and e['recus'] == 1 and not [c for c in cons if 'error' in c or 'PAGEERROR' in c], str([e, cons]))
            pg.goto('file://' + dossier + '/index.html?menu=amis', timeout=90000)
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "amis"', timeout=60000)
            t('paquet Poki : au rechargement dans le même onglet, le paramètre de la page Poki n’est pas relu (le jeu ne retombe pas sur le défi)', pg.evaluate('() => JEU.ecran === "amis" && !JEU.defi'))
            ctx.close()
            # getURLParam renvoie n'importe quoi ou lève : le jeu s'ouvre normalement
            ctx, pg, cons = page_poki("getURLParam() { throw new Error('non'); }", '')
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "titre"', timeout=60000)
            t('paquet Poki : getURLParam qui lève : le jeu s’ouvre normalement (l’écran titre), sans erreur', not cons, str(cons))
            ctx.close()
        finally:
            b.close()
finally:
    shutil.rmtree(dossier, ignore_errors=True)
print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
sys.exit(0 if ko == 0 else 1)
