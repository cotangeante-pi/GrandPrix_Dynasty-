#!/usr/bin/env python3
"""La vraie page dans Chrome (Playwright) : python3 tests/ecrans.py
Pour chaque page : la console reste vide (ni erreur, ni avertissement, ni fichier manquant), la page ne défile
pas, la scène 3D dessine le circuit. En plus : la conduite au clavier (avancer, tourner, freiner, Espace, C),
l'interpolation de l'affichage, les caméras de survol, ?debug=1. Captures dans tests/captures/."""
import base64, math, os, re, sys, time
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    # la console vide est un critère de l'étape 0 : sans Playwright, ce n'est pas vérifié, donc c'est un échec
    print('RESULTAT 0/1 (Playwright absent : pip install playwright)'); sys.exit(1)
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# l'avertissement de Chrome quand une capture lit les pixels de l'écran (voir « console vide »)
LECTURE_PIXELS = re.compile(r'\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels')
CAPTURES = os.path.join(RACINE, 'tests', 'captures')
# (page, largeur, hauteur, capture)
PAGES = [
    ('index.html', 960, 600, 'poki.png'),   # la page nue = le premier lancement : l'écran titre
    ('index.html?debug=1', 960, 600, 'poki-debug.png'),
    ('index.html', 1280, 720, 'large.png'),
    ('index.html?seul=1', 1280, 720, None),   # l'écran de choix d'une course seule (étape 3), la conduite au clavier
    ('index.html?debug=1', 1280, 720, 'large-debug.png'),
    ('index.html?camera=auto', 1280, 720, 'auto.png'),
    ('index.html?camera=libre', 1280, 720, 'libre.png'),
    ('index.html?camera=dessus', 1280, 720, 'dessus.png'),
    ('index.html?camera=virage', 1280, 720, 'virage.png'),
    ('index.html?camera=vitrine', 1280, 720, 'voiture.png'),
    ('index.html?reglages=1&course=0', 1280, 720, 'reglages.png'),
    ('index.html?course=5&robot=1', 1280, 720, None),
    ('index.html?camera=dessus&circuit=technique', 1280, 720, 'technique.png'),
    ('index.html?camera=dessus&circuit=test', 1280, 720, 'stands.png'),   # la voie des stands (étape 7) : la bande et le muret le long de la ligne droite, côté gauche
    ('index.html?course=5&ia=1&circuit=technique', 1280, 720, 'ia.png'),
    ('index.html?course=5&ia=10&circuit=technique&debug=1', 1280, 720, 'ia10.png'),
    ('index.html?course=5&ia=9&joueur=1&circuit=technique', 1280, 720, None),   # capture joueur-ia.png prise en roulant
    ('index.html?course=5&ia=9&joueur=1&circuit=technique', 960, 600, None),    # la tour de classement et le radar en petit
    ('index.html?course=1&ia=8&circuit=test', 1280, 720, None),
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=qualif', 1280, 720, None),   # la qualification du joueur (robot), capture qualif.png
    ('index.html?championnat=1&tours=1&robot=1', 960, 600, 'championnat-960.png'),   # l'écran du championnat en petit
    ('index.html?championnat=1&tours=1&robot=1', 1280, 720, None),   # 2 Grands Prix joués par le robot, rechargement, capture championnat.png   # une course d'un tour, jusqu'au podium et aux résultats
    ('index.html?course=1&ia=8&circuit=test', 960, 600, None),
    ('index.html?course=1&robot=1&test=sdk', 1280, 720, None),   # le faux SDK Poki (sdk.js) : l'ordre des appels sur une course d'un tour
    ('index.html?course=0&robot=1&pneus=1&debug=1', 1280, 720, None),
    ('index.html?course=12&robot=1&pneus=1&circuit=test&test=stand', 1280, 720, None),
    ('index.html?championnat=1&tours=2&robot=1&test=consigne-suivie', 1280, 720, None),    # la consigne d'équipe vise le joueur : il la suit (capture consigne.png), confiance +5
    ('index.html?championnat=1&tours=2&robot=1&test=consigne-ignoree', 1280, 720, None),   # … il l'ignore, confiance −5   # l'arrêt au stand (étape 7) : le message, le robot entre dans la voie, s'arrête, ressort ; capture stand.png   # ?pneus=1 : l'usure monte sur 10 tours du robot, affichée dans ?debug=1
    ('index.html?championnat=1&tours=1&robot=1&gp=12', 1280, 720, None),   # la fin de saison : le 12e Grand Prix joué par le robot, champion, duel de la saison, contrats, saison 2 ; captures champion.png, duel-saison.png, contrats.png
    ('index.html?championnat=1&tours=1&robot=1&gp=12', 960, 600, None),    # les écrans de fin de saison en petit (Grand Prix 12 fabriqué), la retraite
    ('index.html?championnat=1&tours=1&robot=1&lang=en', 1280, 720, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=12&lang=en', 960, 600, None),   # l'audit anglais (tour 31, Codeur 3) : chaque écran du championnat et de la fin de carrière, sans un mot français, rien hors de l'écran en 960×600   # la page en anglais : championnat et podium sans un mot français, capture championnat-en.png
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=fantome', 1280, 720, None),   # le fantôme du meilleur tour : deux qualifications de suite, la 2e contre le fantôme, capture fantome.png
    ('index.html?robot=1&test=decouverte&tours=1', 1280, 720, None),
    ('index.html?deux=1&ia=5&robot=1&circuit=test&test=deux', 1280, 720, None),   # le mode 2 joueurs (deux-joueurs.js) : l'écran partagé, deux robots + 5 IA, jusqu'au podium ; capture deux-joueurs.png
    ('index.html?deux=1&ia=5&robot=1&circuit=test&test=deux', 960, 600, None),    # … en petit : rien ne déborde ; capture deux-joueurs-960.png
    ('index.html?deux=1&ia=5&robot=1&circuit=technique&test=deux', 1280, 720, None),
    ('index.html?course=1&ia=9&joueur=1&robot=1&circuit=test&test=accelere', 1280, 720, None),   # « passer » finit la course en accéléré : les mêmes places et les mêmes temps qu'en regardant (deux chargements)
    ('index.html?championnat=1&tours=1&robot=1&test=accelere', 1280, 720, None),   # … en championnat : puis l'interview et la une
    ('index.html?test=amis', 1280, 720, None),
    ('index.html?course=0&camera=cockpit&test=volant', 1280, 720, None),   # le volant en vue cockpit (tour 27b) : jamais dans la moitié haute, il tourne dans le bon sens et revient ; capture cockpit.png
    ('index.html?course=0&camera=cockpit&test=volant', 960, 600, None),    # … en petit ; capture cockpit-960.png
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=resume', 1280, 720, None),   # le résumé vidéo (étape 13) : après une course, « ▶ Résumé », le rejeu, Échap / clic ; capture resume.png
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=resume', 960, 600, None),    # … en petit ; capture resume-960.png
    ('index.html?course=3&ia=5&joueur=1&robot=1&pneus=1&circuit=test&test=hudcourse', 1280, 720, None),   # la minicarte, les pneus, les messages de course (suite du tour 31) ; captures minicarte.png, pneus-hud.png, messages.png
    ('index.html?course=3&ia=5&joueur=1&robot=1&pneus=1&circuit=test&test=hudcourse', 960, 600, None),    # … en petit, sans recouvrement
    ('index.html?test=tournoi', 1280, 720, None),   # le tournoi chrono (tour 26b) : inscription de 3 joueurs → 3 manches (robot ; un abandon) → podium → Rejouer ; captures tournoi.png, tournoi-podium.png
    ('index.html?test=tournoi', 960, 600, None),    # … l'inscription de 8 joueurs tient en 960×600   # le mode 2 joueurs, tour 25b ordre 3 : titre → « Entre amis » → réglages → course à deux (robots) → podium → rivalité → Revanche → Menu ; captures entre-amis.png, deux-reglages.png, rivalite.png
    ('index.html?test=amis', 960, 600, None),    # … en petit : le menu et l'écran avant la course tiennent sans défilement ni débordement   # … la mesure de la 3D dessinée deux fois sur le technique   # le premier lancement : titre → course de découverte (robot) → Bravo → paddock ; captures titre.png, decouverte.png, bravo.png
]
# ECRANS_FILTRE=… (pendant le travail, sur le Mac) : seulement les pages dont l'adresse contient ce texte ; GitHub lance toujours tout
if os.environ.get('ECRANS_FILTRE'): PAGES = [x for x in PAGES if os.environ['ECRANS_FILTRE'] in f'{x[0]} {x[1]}']   # (« adresse largeur » : « robot=1 960 »)
# le faux SDK Poki (comme dans tests/sdk.html), posé avant le chargement de la page ?test=sdk : il note chaque appel dans APPELS_SDK (pas « JOURNAL » : c'est le module de la une du journal, journal.js)
FAUX_SDK = """window.APPELS_SDK = []; window.PokiSDK = { init() { APPELS_SDK.push('init'); return Promise.resolve(); }, gameLoadingFinished() { APPELS_SDK.push('gameLoadingFinished'); },
  gameplayStart() { APPELS_SDK.push('gameplayStart'); }, gameplayStop() { APPELS_SDK.push('gameplayStop'); },
  commercialBreak() { APPELS_SDK.push('commercialBreak'); return Promise.resolve(); }, rewardedBreak() { APPELS_SDK.push('rewardedBreak'); return Promise.resolve(true); } };"""
SEP = r'[.,]'   # le séparateur décimal des temps affichés : la virgule en français (texte('virgule')), le point en anglais
POSITION = '() => CAMERA.position'

L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + str(detail) if detail else ''))   # str : un détail peut être un nombre ou une liste

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
    t(f'{titre} : aucun son avant le premier geste', pg.evaluate('() => !SON.actif'))
    t(f'{titre} : au départ, l’écran de choix (5, 12, 18 tours, essai libre)', pg.evaluate('() => !document.getElementById("choix").classList.contains("cache") && ["choix5","choix12","choix18","choix0"].every(id => document.getElementById(id))'))
    pg.screenshot(path=os.path.join(CAPTURES, 'choix.png'))
    pg.click('#choix5')
    # sur un Mac chargé, le clic peut arriver tard : on attend la course (le compte à rebours, ou déjà le GO s'il a fini)
    t(f'{titre} : choisir « 5 tours » lance le compte à rebours', attendre(pg, '() => JEU.ecran === "course" && JEU.course.nbTours === 5 && (JEU.course.etat === "compte" || JEU.course.etat === "attente")', None, 30000), pg.evaluate('() => [JEU.ecran, JEU.course && JEU.course.etat]'))
    t(f'{titre} : le titre est le nom du jeu, sans « F1 »', pg.evaluate('() => document.title === texte("nomDuJeu") && document.title === "Grand Prix Dynasty"'), pg.evaluate('() => document.title'))
    t(f'{titre} : <html lang> est la langue des textes', pg.evaluate('() => document.documentElement.lang === LANGUE && (LANGUE === "fr" || LANGUE === "en")'), pg.evaluate('() => [document.documentElement.lang, LANGUE]'))
    depart = pg.evaluate(JOUEUR)
    t(f'{titre} : après le compte à rebours, GO', attendre(pg, '() => JEU.course.etat === "attente"', None, 40000), pg.evaluate('() => JEU.course.etat'))
    t(f'{titre} : les bips 3, 2, 1 puis le GO aigu sont demandés, une fois chacun', pg.evaluate('() => SON.historique.join(",")') == 'compte,compte,compte,go', pg.evaluate('() => SON.historique.join(",")'))
    pg.keyboard.down('ArrowUp')
    t(f'{titre} : le premier geste allume le son', attendre(pg, '() => SON.actif'), pg.evaluate('() => SON.etatContexte'))
    t(f'{titre} : ↑ fait avancer la voiture', attendre(pg, '() => JEU.joueur.u > 15', None, 40000), str(pg.evaluate(JOUEUR)))
    i = pg.evaluate(INTERPOLE)
    t(f'{titre} : la voiture est dessinée entre l’état d’avant et l’état d’après', i['ok'], str(i))
    pg.screenshot(path=os.path.join(CAPTURES, 'derriere.png'))
    p1 = pg.evaluate(JOUEUR)
    pg.keyboard.down('ArrowLeft')
    t(f'{titre} : ← fait tourner la voiture à gauche', attendre(pg, 'c => JEU.joueur.cap < c - 0.05', p1['cap'], 20000), f"cap {p1['cap']} → {pg.evaluate(JOUEUR)['cap']}")
    t(f'{titre} : le rapport monte et s’affiche', attendre(pg, '() => Number(document.getElementById("rapport").textContent) >= 2'), pg.evaluate('() => document.getElementById("rapport").textContent'))
    pg.keyboard.up('ArrowLeft'); pg.keyboard.up('ArrowUp')
    p2 = pg.evaluate(JOUEUR)
    pg.keyboard.down('ArrowDown')
    t(f'{titre} : ↓ freine', attendre(pg, 'u => JEU.joueur.u < u * 0.5', p2['u'], 20000), f"{p2['u']} → {pg.evaluate(JOUEUR)['u']}")
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
    pg.keyboard.press('KeyM')
    t(f'{titre} : M coupe le son', pg.evaluate('() => SON.muet && document.getElementById("boutonSon").textContent === "🔇"'))
    pg.keyboard.press('KeyM')
    t(f'{titre} : M le remet', pg.evaluate('() => !SON.muet && document.getElementById("boutonSon").textContent === "🔊"'))
    pg.click('#boutonSon')
    t(f'{titre} : le bouton 🔊 coupe le son', pg.evaluate('() => SON.muet'))
    pg.click('#boutonSon')
    t(f'{titre} : le bouton ne garde pas le focus (Espace ne le clique pas)', pg.evaluate('() => document.activeElement !== document.getElementById("boutonSon") && !SON.muet'))
    # Échap : la pause arrête la physique
    pg.keyboard.press('Escape')
    n1 = pg.evaluate('() => JEU.pas'); pg.wait_for_timeout(600); n2 = pg.evaluate('() => JEU.pas')
    t(f'{titre} : Échap met en pause et la physique s’arrête', pg.evaluate('() => JEU.ecran') == 'pause' and n1 == n2, f'{n1} → {n2}')
    pg.click('#boutonReprendre')
    t(f'{titre} : « Reprendre » relance la physique', attendre(pg, 'n => JEU.pas > n', n2) and pg.evaluate('() => JEU.ecran') == 'course')
    t(f'{titre} : la vitesse s’affiche en km/h', bool(re.fullmatch(r'\d+', pg.evaluate('() => document.getElementById("vitesse").textContent'))))

def reglages(pg, titre):
    # un curseur bouge : REGLAGES change tout de suite, et « copier » donne la ligne pour donnees.js
    pg.evaluate("""() => { const c = document.querySelector('#reglages input[data-cle="ADHERENCE"]'); c.value = 2.2; c.dispatchEvent(new Event('input')); }""")
    t(f'{titre} : le curseur ADHERENCE change REGLAGES.ADHERENCE', pg.evaluate('() => REGLAGES.ADHERENCE') == 2.2, str(pg.evaluate('() => REGLAGES.ADHERENCE')))
    pg.evaluate("""() => { const c = document.querySelector('#reglages input[data-cle="CAMERA_DERRIERE.0"]'); c.value = 6; c.dispatchEvent(new Event('input')); }""")
    t(f'{titre} : un réglage dans un tableau (CAMERA_DERRIERE[0]) change aussi', pg.evaluate('() => REGLAGES.CAMERA_DERRIERE[0]') == 6)
    tri = pg.evaluate('() => VOITURE3D.triangles(JEU.modele)')
    pg.evaluate("""() => { const c = document.querySelector('#reglages input[data-cle="HALO_EPAISSEUR"]'); c.value = 0.06; c.dispatchEvent(new Event('input')); }""")
    t(f'{titre} : l’épaisseur du halo refait la voiture (mêmes triangles, mêmes appels)', pg.evaluate('() => REGLAGES.HALO_EPAISSEUR') == 0.06 and pg.evaluate('() => VOITURE3D.triangles(JEU.modele)') == tri and pg.evaluate('() => VOITURE3D.appels(JEU.modele)') <= 7)
    pg.click('#reglages button')
    copie = pg.evaluate('() => document.querySelector("#reglages pre").textContent')
    t(f'{titre} : « copier » donne les valeurs changées, prêtes pour donnees.js', 'ADHERENCE: 2.2,' in copie and 'CAMERA_DERRIERE: [6, 2.4],' in copie and 'APPUI' not in copie, repr(copie))
    # les flèches conduisent toujours après avoir touché le panneau
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    pg.keyboard.down('ArrowUp')
    t(f'{titre} : après le panneau, ↑ fait toujours rouler', attendre(pg, '() => JEU.joueur.u > 5', None, 20000))
    pg.keyboard.up('ArrowUp')

def course_robot(pg, titre, page):
    # le robot conduit : on attend le GO, puis on avance la physique sans affichage (BOUCLE.simuler)
    # le compte à rebours est vérifié ailleurs ; ici on le raccourcit (sous swiftshader, 3 s de jeu peuvent prendre 30 s)
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    t(f'{titre} : le robot part après le compte à rebours', attendre(pg, '() => JEU.course.etat === "course"', None, 20000), pg.evaluate('() => JEU.course.etat'))
    CASES = '() => ["hudS1", "hudS2", "hudS3"].map(id => document.getElementById(id).className).join(",")'
    t(f'{titre} : au début du tour, les 3 cases de secteur sont grises', attendre(pg, '() => JEU.course.etat === "course" && !/^0:00[.,]000$/.test(document.getElementById("hudChrono").textContent)', None, 20000)
      and pg.evaluate(CASES) == 'secteur,secteur,secteur' and pg.evaluate('() => document.getElementById("hudPrecedent").classList.contains("cache")'), pg.evaluate(CASES))
    pg.evaluate('() => BOUCLE.simuler(25)')
    t(f'{titre} : après le secteur 1, S1 se colore et S2, S3 restent grises', attendre(pg, 'c => /^secteur (violet|vert|jaune),secteur,secteur$/.test(eval(c)())', CASES), pg.evaluate(CASES))
    pg.evaluate('() => BOUCLE.simuler(130)')
    t(f'{titre} : en course, Tour n/N, chrono, tour précédent et secteurs du tour en cours', attendre(pg, '() => /^(Tour|Lap) 3 \\/ 5$/.test(document.getElementById("hudTour").textContent) && /violet|vert|jaune/.test(document.getElementById("hudS1").className) && document.getElementById("hudS3").className === "secteur" && !document.getElementById("hudPrecedent").classList.contains("cache")'),
      pg.evaluate('() => [document.getElementById("hudTour").textContent, document.getElementById("hudPrecedent").textContent]') + [pg.evaluate(CASES)])
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'course.png'))
    pg.evaluate('() => BOUCLE.simuler(245)')
    t(f'{titre} : la course finie, l’écran de fin', attendre(pg, '() => !document.getElementById("fin").classList.contains("cache")'), pg.evaluate('() => JEU.course.etat'))
    fin = pg.evaluate('() => ({ tours: document.querySelectorAll("#finTours li").length, total: document.getElementById("finTotal").textContent, record: document.getElementById("finRecord").textContent, meilleur: JEU.course.meilleurTour, garde: SAUVEGARDE.record(5) })')
    t(f'{titre} : l’écran de fin montre les 5 tours, le total et le nouveau record', fin['tours'] == 5 and re.search(r'\d:\d\d' + SEP + r'\d{3}', fin['total']) and fin['record'] != '', str(fin))
    t(f'{titre} : le meilleur tour est gardé comme record des 5 tours', fin['garde'] == fin['meilleur'], str(fin))
    arret = pg.evaluate('() => ({ u: JEU.joueur.u, arret: JEU.arretApres, bandeau: document.getElementById("hudCourse").classList.contains("cache"), sons: SON.historique.slice(-1)[0] })')
    t(f'{titre} : après l’arrivée, la voiture s’arrête seule en moins de 6 s', arret['u'] == 0 and arret['arret'] is not None and arret['arret'] < 6, str(arret))
    t(f'{titre} : le bandeau de course est caché sous l’écran de fin', arret['bandeau'], str(arret))
    t(f'{titre} : le son d’arrivée est demandé', arret['sons'] == 'arrivee', str(arret))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'fin.png'))
    # après rechargement, le record est toujours là (sur l'écran de choix)
    pg.goto('file://' + RACINE + '/index.html?seul=1'); pg.wait_for_timeout(1500)   # (la page nue est maintenant l'écran titre : l'écran de choix est ?seul=1)
    rec = pg.evaluate('() => document.getElementById("record5").textContent')
    t(f'{titre} : après rechargement, le record des 5 tours est affiché', INTERFACE_TEMPS(fin['meilleur'], pg.evaluate('() => texte("virgule")')) in rec, repr(rec))
    pg.click('#choix0')
    t(f'{titre} : l’essai libre n’a pas de nombre de tours', pg.evaluate('() => JEU.course.nbTours === 0 && !/\\//.test(document.getElementById("hudTour").textContent)'))

def course_ia(pg, titre):
    # l'IA conduit la voiture du joueur sur le circuit technique : elle part, fait au moins un tour, sans faute
    # la trajectoire se calcule en fond, découpée en tranches : la page ne doit jamais rester bloquée plus de 300 ms
    pret = attendre(pg, '() => JEU.trajectoire !== null', None, 120000)
    t(f'{titre} : le circuit technique est chargé et la trajectoire de l’IA calculée', pret and pg.evaluate('() => CIRCUIT.nom === "Technique" && JEU.ia && JEU.trajectoire.vitesse.length === CIRCUIT.nb'))
    # ce que bloque le calcul : chaque tranche est chronométrée par le jeu. Les autres tâches longues de la page
    # (le premier dessin 3D en logiciel sous swiftshader) existent aussi sans ?ia=1 : elles sont seulement affichées
    calcul = pg.evaluate('() => JEU.calculTrajectoire')
    longues = pg.evaluate('() => window.__longues')
    L.append(f"  (?ia=1 : trajectoire calculée en {calcul['tranches']} tranches, la plus longue {calcul['plusLongue']:.0f} ms, en {(calcul['fin'] - calcul['debut']) / 1000:.1f} s ; tâches de plus de 50 ms dans la page : {sorted(round(x) for x in longues)[-6:]} ms)")
    t(f'{titre} : le calcul de la trajectoire ne bloque jamais la page plus de 300 ms d’affilée', calcul['tranches'] > 10 and calcul['plusLongue'] < 300, str(calcul))
    tour = pg.evaluate('''() => { const c = creerCourse(CIRCUIT, 5), v = creerVoiture(CIRCUIT); placerAuDepart(v, CIRCUIT);
      const pilote = creerPilote(JEU.carte);
      for (let k = 0; k < 600 * 120 && c.etat !== 'finie'; k++) { appliquerCommandes(v, courseAutorise(c) ? piloterIA(pilote, v, [], 1 / 120) : { gaz: 0, frein: 0, direction: 0 }); pasVoiture(v, CIRCUIT, 1 / 120); majCourse(c, v, 1 / 120); }
      return c.meilleurTour; }''')
    t(f'{titre} : la carte calculée en fond est la même (le pilote neutre seul fait le même meilleur tour que dans test.html, 55,26 s)', tour is not None and abs(tour - 55.2583) < 0.006, str(tour))
    t(f'{titre} : le pilote IA de ?ia=1 est prêt', pg.evaluate('() => JEU.pilote !== null && JEU.carte !== null'))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    t(f'{titre} : l’IA part après le compte à rebours', attendre(pg, '() => JEU.course.etat === "course" && JEU.joueur.u > 1', None, 20000), pg.evaluate('() => JEU.course.etat'))
    pg.evaluate('() => BOUCLE.simuler(75)')
    etat = pg.evaluate('() => ({ tours: JEU.course.tours.map(t => t.temps), progression: JEU.course.progression, contacts: JEU.joueur.contactsBarriere, penalites: JEU.course.penalites, kmh: JEU.joueur.u * 3.6 })')
    t(f'{titre} : en 75 s, l’IA a fini au moins un tour, sans barrière ni pénalité', len(etat['tours']) >= 1 and etat['contacts'] == 0 and etat['penalites'] == 0 and etat['kmh'] > 30, str(etat))
    if etat['tours']: L.append(f"  (?ia=1 sur le circuit technique : premier tour {etat['tours'][0]:.2f} s, départ arrêté)")

def course_ia10(pg, titre):
    # 10 IA dans la page : chacune sa couleur, la caméra en suit une, Tab passe à la suivante
    t(f'{titre} : 10 IA en course, 10 modèles de couleurs différentes', pg.evaluate('() => JEU.plateau.pilotes.length === 10 && JEU.modeles.length === 10 && new Set(JEU.modeles.map(m => m.couleur)).size === 10'))
    t(f'{titre} : la carte se calcule en fond, puis chaque IA reçoit son pilote', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.every(p => p.pilote !== null)', None, 120000))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    t(f'{titre} : les 10 partent après le compte à rebours', attendre(pg, '() => JEU.plateau.pilotes.every(p => p.v.u > 1)', None, 30000), pg.evaluate('() => JEU.plateau.pilotes.map(p => p.v.u.toFixed(1)).join(" ")'))
    pg.evaluate('() => BOUCLE.simuler(30)')
    etat = pg.evaluate('() => JEU.plateau.pilotes.map(p => ({ progression: Math.round(p.course.progression), chocs: p.v.chocs, barriere: p.v.contactsBarriere }))')
    t(f'{titre} : en 30 s, les 10 avancent (plus de 500 m chacune), sans choc à plus de 5 m/s ni barrière', all(e['progression'] > 500 and all(c <= 5 for c in e['chocs']) and e['barriere'] == 0 for e in etat), str(etat))
    L.append(f"  (?ia=10 : après 30 s, de {min(e['progression'] for e in etat)} à {max(e['progression'] for e in etat)} m parcourus, {sum(len(e['chocs']) for e in etat) // 2} contacts)")
    avant = pg.evaluate('() => JEU.suivie')
    pg.keyboard.press('Tab')
    t(f'{titre} : Tab : la caméra suit la voiture suivante', pg.evaluate('s => JEU.suivie === (s + 1) % 10 && JEU.joueur === JEU.plateau.pilotes[JEU.suivie].v', avant))
    attendre(pg, '() => /i\/s/.test(document.getElementById("ips").textContent)')
    ips = pg.evaluate('() => document.getElementById("ips").textContent.split(String.fromCharCode(10))[0]')
    L.append(f'  (?ia=10 sous swiftshader : {ips})')

# avant une course contre les IA, l'écran de qualification : on le passe (le joueur part dernier)
def passer_qualif(pg, titre):
    t(f'{titre} : avant la course, l’écran de qualification (« Faire mon tour » / « Passer »)', attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix" && !document.getElementById("qualif").classList.contains("cache")', None, 10000), str(pg.evaluate('() => [JEU.ecran, JEU.qualif]')))
    pg.click('#boutonQualifPasser')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)   # (la carte des IA d'abord, s'il le faut)
    pg.click('#boutonQualifCourse')
    attendre(pg, '() => JEU.ecran === "course"', None, 10000)

def qualif(pg, titre):
    # le robot fait le tour de qualification : il part à la place que donne son temps ; « Passer » le met dernier
    t(f'{titre} : l’écran de qualification, les IA sur la grille', attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif.etat === "choix" && JEU.plateau.pilotes.length === 6', None, 10000), str(pg.evaluate('() => [JEU.ecran, JEU.qualif]')))
    t(f'{titre} : la carte se calcule en fond', attendre(pg, '() => JEU.plateau.carte !== null', None, 180000))
    pg.click('#boutonQualifTour')
    t(f'{titre} : « Faire mon tour » : sa voiture du tour, seule, 250 m avant la ligne ; le chrono s’affiche ; les IA ne bougent pas',
      attendre(pg, '() => JEU.qualif.etat === "tour" && JEU.joueur === JEU.qualif.v && JEU.joueur !== JEU.plateau.pilotes[5].v && !document.getElementById("hudCourse").classList.contains("cache") && document.getElementById("classement").classList.contains("cache")'),
      str(pg.evaluate('() => [JEU.qualif.etat, JEU.joueur.piste.s]')))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.qualif.etat') == 'resultat': break
        pg.wait_for_timeout(50)
    r = pg.evaluate('''() => { const e = JEU.plateau, g = e.grille, k = g.findIndex(x => e.pilotes[x.numero - 1].humain); return { etat: JEU.qualif.etat, temps: JEU.qualif.q.temps, valide: JEU.qualif.q.valide,
      place: k + 1, depart: e.pilotes[5].depart, attendu: placesGrille(CIRCUIT, 6)[k].s - CIRCUIT.longueur, texte: document.getElementById("qualifTexte").textContent, ordre: g.map(x => x.qualif), ia: JEU.plateau.pilotes.slice(0, 5).every(p => p.v.u === 0) }; }''')
    t(f'{titre} : le tour fini : un temps, une place dans la grille selon ce temps, la voiture posée à cette place', r['etat'] == 'resultat' and r['valide'] and 40 < r['temps'] < 80 and abs(r['depart'] - r['attendu']) < 1e-6 and r['ia']
      and all(r['ordre'][i] <= r['ordre'][i + 1] for i in range(len(r['ordre']) - 1)), str(r))
    t(f'{titre} : le résultat affiché : « P{r["place"]} / 6 — temps » et l’écart à la pole', re.match(rf'^P{r["place"]} / 6 — \d:\d\d{SEP}\d\d\d · ', r['texte']) is not None, repr(r['texte']))
    L.append(f"  (qualification du robot : {r['temps']:.2f} s, P{r['place']} / 6)")
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, 'qualif.png'))
    pg.click('#boutonQualifCourse')
    t(f'{titre} : « Départ de la course » : la course, sa voiture de course suivie, les feux', attendre(pg, '() => JEU.ecran === "course" && JEU.qualif === null && JEU.joueur === JEU.plateau.pilotes[5].v && JEU.course.feux', None, 10000))
    enregistreur(pg, titre)
    # une nouvelle page : « Passer » = dernier
    pg.reload()
    t(f'{titre} : « Passer (départ dernier) » : P6 / 6, la voiture dernière sur la grille', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif" && JEU.qualif.etat === "choix"', None, 60000)
      and (pg.click('#boutonQualifPasser') or True) and attendre(pg, '() => JEU.qualif.etat === "resultat"', None, 180000)
      and pg.evaluate('() => { const e = JEU.plateau; return e.grille[5].numero === 6 && e.pilotes[5].depart === Math.min(...e.pilotes.map(p => p.depart)) && /dernier/.test(document.getElementById("qualifTexte").textContent); }'),
      pg.evaluate('() => [JEU.qualif && JEU.qualif.etat, document.getElementById("qualifTexte").textContent]'))

# l'enregistreur (enregistreur.js, étape 13), branché dans la page sans rien afficher : la course d'un tour (5 IA + le robot)
# est enregistrée à chaque pas ; relue à sa dernière image, elle redonne les positions de toutes les voitures
def enregistreur(pg, titre):
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    pg.evaluate('() => BOUCLE.simuler(20)')
    # on avance pas par pas jusqu'à la prochaine image, puis on compare la relecture à cet instant avec les vraies positions
    RELU = '''() => { const r = JEU.enregistreur, enr = r.enr, n = enr.nbImages; let k = 0; while (enr.nbImages === n && k++ < 24) BOUCLE.simuler(1 / 120);
      const lu = enr.lire(enr.fin), ecart = Math.max(...JEU.plateau.pilotes.map((p, i) => Math.hypot(lu[i].x - p.v.x, lu[i].z - p.v.z)));
      return { nouvelle: enr.nbImages === n + 1, ecart, images: enr.nbImages, octets: enr.octets(), temps: JEU.plateau.temps, parti: r.parti, pas: r.pas, ms: r.ms, arrivees: r.arrivees.size }; }'''
    r1 = pg.evaluate(RELU)
    t(f'{titre} : en course, l’enregistrement relu à sa dernière image redonne les 6 positions à moins d’1 cm ; le GO est noté', r1['nouvelle'] and r1['ecart'] < 0.01 and r1['parti'] and r1['pas'] > 2000, str(r1))
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.plateau.arrives >= 1 || JEU.ecran !== "course"'): break
    r2 = pg.evaluate(RELU)
    t(f'{titre} : à la fin (la première voiture arrivée), relu : écart < 1 cm, l’arrivée notée', r2['nouvelle'] and r2['ecart'] < 0.01 and r2['images'] > r1['images'] and r2['arrivees'] >= 1, str(r2))
    L.append(f"  (enregistreur, 6 voitures, 1 tour : {r2['images']} images, {r2['octets'] / 1024:.0f} Ko, {r2['ms'] / max(1, r2['pas']) * 1000:.0f} µs par pas en moyenne)")

# le fantôme du meilleur tour (fantome.js) : deux qualifications de suite par le robot. La première n'a pas de fantôme et
# devient le record du circuit (sauvegardé, compact) ; la deuxième, par un robot plus prudent, roule contre le fantôme
# (voiture transparente, écart en direct en rouge) et ne remplace pas le record. Puis l'option « masqué » et la course sans fantôme
def fantome(pg, titre):
    TOUR = '() => JEU.ecran === "qualif" && JEU.qualif.etat === "tour" && JEU.qualif.q.lance'
    # après BOUCLE.simuler, l'écran et la 3D ne sont à jour qu'à l'image suivante : on attend deux images dessinées (sous
    # swiftshader et un Mac chargé, une image peut prendre plus de 300 ms)
    def image():
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } return window.__images; }')
        attendre(pg, 'n => window.__images > n + 1', n, 30000)
    def mon_tour():
        attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
        attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
        pg.click('#boutonQualifTour')
        pg.evaluate('() => { JEU.course.compte = 0.01; }')
        attendre(pg, TOUR, None, 20000)
    def finir_tour():
        for _ in range(40):
            pg.evaluate('() => BOUCLE.simuler(5)')
            if pg.evaluate('() => JEU.qualif.etat') == 'resultat': break
            pg.wait_for_timeout(50)
    t(f'{titre} : au départ, aucun fantôme sauvegardé pour ce circuit, l’option « affiché »', pg.evaluate('() => SAUVEGARDE.fantome(NOM_CIRCUIT) === null && SAUVEGARDE.option("fantome", true) === true && JEU.fantome === null'))
    mon_tour()
    t(f'{titre} : 1er tour : le tour est enregistré, mais sans record il n’y a ni fantôme (pas de voiture transparente) ni écart affiché',
      pg.evaluate('() => !!(JEU.fantome && JEU.fantome.rejeu === null && JEU.fantome.tour && JEU.modeleFantome === null && document.getElementById("hudEcart").classList.contains("cache"))'), str(pg.evaluate('() => [JEU.fantome && JEU.fantome.rejeu, JEU.modeleFantome]')))
    pg.evaluate('() => BOUCLE.simuler(15)'); image()
    appels1 = pg.evaluate('() => SCENE3D.appelsDessin')
    finir_tour()
    r1 = pg.evaluate('''() => { const f = SAUVEGARDE.fantome(NOM_CIRCUIT); return { etat: JEU.qualif.etat, temps: JEU.qualif.q.temps, fantome: f && { temps: f.temps, images: f.x.length, pas: f.pas, taille: FANTOME.taille(f) },
      texte: document.getElementById("qualifFantome").textContent, resultat: JEU.qualif.fantome, octets: localStorage.getItem(SAUVEGARDE.CLE).length }; }''')
    t(f'{titre} : 1er tour fini : « Nouveau record ! », le fantôme sauvegardé pour le circuit (compact, son temps = le temps du tour)',
      r1['etat'] == 'resultat' and r1['fantome'] and abs(r1['fantome']['temps'] - r1['temps']) < 0.001 and r1['fantome']['images'] > 100 and r1['resultat']['record'] and r1['texte'] == pg.evaluate('() => texte("nouveauRecord")'), str(r1))
    if r1['fantome']: L.append(f"  (fantôme du robot sur le circuit test : {r1['temps']:.2f} s, {r1['fantome']['images']} images à {r1['fantome']['pas']} s, {r1['fantome']['taille']} octets ; la sauvegarde fait {r1['octets']} octets)")
    # 2e qualification : un robot plus prudent en virage (plus lent) roule contre le fantôme
    pg.reload()
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif"', None, 60000)
    pg.evaluate('() => { REGLAGES.ROBOT_MARGE_VIRAGE = 0.7; }')
    mon_tour()
    t(f'{titre} : 2e tour : le fantôme est chargé et sa voiture transparente roule (visible, matériau transparent, couleur neutre)',
      attendre(pg, '() => JEU.fantome && JEU.fantome.rejeu && JEU.fantome.visible && JEU.modeleFantome && JEU.modeleFantome.groupe.visible && JEU.modeleFantome.corps.material.transparent && JEU.modeleFantome.corps.material.opacity === REGLAGES.FANTOME_OPACITE', None, 10000), str(pg.evaluate('() => [JEU.fantome && !!JEU.fantome.rejeu, JEU.modeleFantome && JEU.modeleFantome.groupe.visible]')))
    pg.evaluate('() => BOUCLE.simuler(15)'); image()
    e = pg.evaluate('''() => { const el = document.getElementById("hudEcart"), p = FANTOME.position(JEU.fantome.rejeu, QUALIFICATION.chrono(JEU.qualif.q)), g = JEU.modeleFantome.groupe.position;
      return { cache: el.classList.contains("cache"), texte: el.textContent, classe: el.className, ecart: JEU.fantome.ecart, appels: SCENE3D.appelsDessin, distance: Math.hypot(g.x - p.x, g.z - p.z), loin: Math.hypot(g.x - JEU.joueur.x, g.z - JEU.joueur.z) }; }''')
    t(f'{titre} : 2e tour, après 15 s : l’écart en direct sous le chrono, positif et en rouge (« +1,23 »), le fantôme dessiné à sa position du rejeu, devant la voiture',
      not e['cache'] and re.fullmatch(r'\+\d+' + SEP + r'\d\d', e['texte']) is not None and e['classe'] == 'rouge' and e['ecart'] > 0 and e['distance'] < 1 and e['loin'] > 5, str(e))
    t(f'{titre} : le fantôme coûte 6 appels de dessin de plus', e['appels'] == appels1 + 6, f"{appels1} → {e['appels']}")
    L.append(f"  (appels de dessin pendant le tour de qualification : {appels1} sans le fantôme, {e['appels']} avec)")
    pg.screenshot(path=os.path.join(CAPTURES, 'fantome.png'))
    # les classes de l'écart : vert devant, rouge derrière, neutre à 0
    pg.evaluate('() => INTERFACE.majEcartFantome(-0.34)')
    vert = pg.evaluate('() => [document.getElementById("hudEcart").textContent, document.getElementById("hudEcart").className]')
    pg.evaluate('() => INTERFACE.majEcartFantome(0.004)')
    egal = pg.evaluate('() => [document.getElementById("hudEcart").textContent, document.getElementById("hudEcart").className]')
    t(f'{titre} : « −0,34 » en vert quand le joueur est devant, « 0,00 » neutre à égalité', vert == ['−0' + pg.evaluate('() => texte("virgule")') + '34', 'vert'] and egal[1] == 'egal', str([vert, egal]))
    finir_tour(); image()
    r2 = pg.evaluate('''() => ({ etat: JEU.qualif.etat, temps: JEU.qualif.q.temps, record: SAUVEGARDE.fantome(NOM_CIRCUIT).temps, resultat: JEU.qualif.fantome, texte: document.getElementById("qualifFantome").textContent, visible: JEU.modeleFantome.groupe.visible })''')
    t(f'{titre} : 2e tour fini, plus lent : l’écart final affiché (« +x,xx s du record »), le record n’est pas remplacé, le fantôme disparaît',
      r2['etat'] == 'resultat' and r2['temps'] > r2['record'] and abs(r2['record'] - r1['temps']) < 0.001 and not r2['resultat']['record'] and abs(r2['resultat']['ecart'] - (r2['temps'] - r2['record'])) < 0.01
      and re.search(r'\+\d+' + SEP + r'\d\d s', r2['texte']) is not None and not r2['visible'], str(r2))
    L.append(f"  (2e qualification, robot prudent : {r2['temps']:.2f} s, {r2['texte']})")
    # l'option « masqué » (bouton sur l'écran de qualification, sauvegardée), puis la course : jamais de fantôme
    pg.reload()
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif" && JEU.qualif.etat === "choix"', None, 60000)
    t(f'{titre} : le bouton « Fantôme : affiché » est sur l’écran de qualification et dans le menu pause', pg.evaluate('() => document.getElementById("boutonFantomeQualif").textContent === texte("fantomeOui") && document.getElementById("boutonFantomePause").textContent === texte("fantomeOui") && !document.getElementById("boutonFantomeQualif").classList.contains("cache")'))
    pg.click('#boutonFantomeQualif')
    t(f'{titre} : un clic le masque, et l’option est sauvegardée', pg.evaluate('() => document.getElementById("boutonFantomeQualif").textContent === texte("fantomeNon") && SAUVEGARDE.option("fantome", true) === false'))
    mon_tour()
    pg.evaluate('() => BOUCLE.simuler(5)'); image()
    t(f'{titre} : masqué : la voiture transparente n’est pas dessinée, l’écart reste affiché', pg.evaluate('() => !!(JEU.fantome.rejeu && !JEU.fantome.visible && !JEU.modeleFantome.groupe.visible && !document.getElementById("hudEcart").classList.contains("cache"))'))
    finir_tour()
    pg.click('#boutonQualifCourse')
    t(f'{titre} : en course, aucun fantôme : pas de voiture transparente, pas d’écart, et seules les voitures des pilotes existent pour les IA', attendre(pg, '() => JEU.ecran === "course" && JEU.fantome === null && !JEU.modeleFantome.groupe.visible && document.getElementById("hudEcart").classList.contains("cache")', None, 10000)
      and pg.evaluate('() => JEU.plateau.pilotes.every(p => voituresVues(p.v, JEU.plateau.pilotes.map(x => x.v)).every(w => w.id !== JEU.modeleFantome))'), str(pg.evaluate('() => [JEU.ecran, JEU.fantome]')))
    # le fantôme PROUVÉ visible (tour 23b) : un 3e tour, par un robot moins puissant (FORCE_MOTEUR_MAX et PUISSANCE × 0,7, ce
    # qui ne change que cette page) : dès la ligne, le fantôme (le record) le distance ; ~1 s après la ligne, il est à quelques
    # mètres devant. Capture fantome-proche.png, puis deux rendus de la même image, fantôme montré / caché (BOUCLE arrêtée,
    # SCENE3D.dessiner) : dans la moitié basse, les pixels qui changent sont ceux du fantôme, plus clairs (sa couleur neutre)
    pg.reload()
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif" && JEU.qualif.etat === "choix"', None, 60000)
    pg.evaluate('() => { SAUVEGARDE.ecrireOption("fantome", true); INTERFACE.majBoutonsFantome(true); REGLAGES.FORCE_MOTEUR_MAX *= 0.7; REGLAGES.PUISSANCE *= 0.7; }')
    mon_tour()
    pg.evaluate('() => { BOUCLE.arreter(); while (QUALIFICATION.chrono(JEU.qualif.q) < 1) BOUCLE.simuler(1 / 120); }')
    image()
    pg.evaluate('() => BOUCLE.arreter()')
    pos = pg.evaluate('''() => { const p = FANTOME.position(JEU.fantome.rejeu, QUALIFICATION.chrono(JEU.qualif.q)), v = JEU.joueur, c = Math.cos(v.cap), s = Math.sin(v.cap);
      return { chrono: QUALIFICATION.chrono(JEU.qualif.q), devant: c * (p.x - v.x) + s * (p.z - v.z), cote: -s * (p.x - v.x) + c * (p.z - v.z), visible: JEU.modeleFantome.groupe.visible, ecart: JEU.fantome.ecart }; }''')
    t(f'{titre} : 3e tour (robot moins puissant), ~1 s après la ligne : le fantôme est quelques mètres devant la voiture, visible', pos['visible'] and 1 <= pos['devant'] <= 40 and abs(pos['cote']) < 6 and pos['ecart'] > 0, str(pos))
    pg.screenshot(path=os.path.join(CAPTURES, 'fantome-proche.png'))
    avec = base64.b64encode(pg.screenshot()).decode()
    pg.evaluate('() => { JEU.modeleFantome.groupe.visible = false; SCENE3D.dessiner(); }')
    sans = base64.b64encode(pg.screenshot()).decode()
    pg.evaluate('() => { JEU.modeleFantome.groupe.visible = true; SCENE3D.dessiner(); }')
    diff = pg.evaluate('''async ([a, b]) => { const lire = async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        return { w: img.width, h: img.height, d: ctx.getImageData(0, Math.floor(img.height / 2), img.width, img.height - Math.floor(img.height / 2)).data }; };
      const A = await lire(a), B = await lire(b); let n = 0, clairA = 0, clairB = 0;
      for (let i = 0; i < A.d.length; i += 4) { const la = A.d[i] + A.d[i + 1] + A.d[i + 2], lb = B.d[i] + B.d[i + 1] + B.d[i + 2];
        if (Math.abs(la - lb) > 30) { n++; clairA += la; clairB += lb; } }
      return { pixels: n, clairA: n ? clairA / n / 3 : 0, clairB: n ? clairB / n / 3 : 0, taille: A.w + 'x' + A.h }; }''', [avec, sans])
    seuil = pg.evaluate('() => REGLAGES.FANTOME_PIXELS_MIN')
    t(f'{titre} : contrôle en pixels : dans la moitié basse, au moins FANTOME_PIXELS_MIN = {seuil} pixels changent quand le fantôme est caché, et ils sont plus clairs avec lui (sa teinte neutre mélangée à la piste)',
      diff['pixels'] >= seuil and diff['clairA'] > diff['clairB'], str(diff))
    L.append(f"  (fantôme à {pos['devant']:.1f} m devant, {diff['pixels']} pixels changés dans la moitié basse, clarté {diff['clairB']:.0f} → {diff['clairA']:.0f})")
    pg.evaluate('() => BOUCLE.demarrer()')

# le premier lancement (decouverte.js, CLAUDE.md « En piste en 10 secondes ») : sans sauvegarde, l'écran titre ; « ▶ Jouer »
# mène directement à la grille de la course de découverte (3 tours, 6 IA débutant, pilotes du monde, le joueur au milieu, les
# aides) ; le robot la joue jusqu'au podium, puis « Bravo ! Prêt pour ta carrière ? », la prime, et la page rechargée arrive au
# paddock. Le faux SDK note les appels : gameLoadingFinished une fois, gameplayStart aux feux éteints, jamais commercialBreak
def decouverte(pg, titre):
    R = pg.evaluate('() => ({ tours: REGLAGES.DECOUVERTE_TOURS, ia: REGLAGES.DECOUVERTE_IA, niveau: REGLAGES.DECOUVERTE_NIVEAU, circuit: REGLAGES.DECOUVERTE_CIRCUIT, argent: REGLAGES.DECOUVERTE_ARGENT, max: REGLAGES.DECOUVERTE_ARGENT_MAX })')
    t(f'{titre} : sans sauvegarde, l’écran titre : le nom du jeu par sa clé, « ▶ Jouer », le petit « 👥 Entre amis », rien d’autre ; le monde du championnat est créé et sauvegardé ; aucun gameplayStart',
      pg.evaluate('''() => JEU.ecran === "titre" && JEU.decouverte && !document.getElementById("titre").classList.contains("cache") && document.getElementById("titreNom").textContent === texte("nomDuJeu")
        && document.getElementById("boutonJouer").textContent === texte("titreJouer") && document.getElementById("boutonAmis").textContent === texte("titreAmis")
        && SAUVEGARDE.championnat() !== null && SAUVEGARDE.championnat().pilotes.length === 20 && !SAUVEGARDE.decouverteFaite() && JEU.monde === null === false
        && window.APPELS_SDK.join(",") === "init,gameLoadingFinished"'''), str(pg.evaluate('() => [JEU.ecran, JEU.decouverte, window.APPELS_SDK]')))
    pg.screenshot(path=os.path.join(CAPTURES, 'titre.png'))
    pg.click('#boutonAmis')
    t(f'{titre} : « Entre amis » ouvre son petit menu (écran partagé, tournoi), « Retour » revient au titre', pg.evaluate('() => JEU.ecran === "amis" && document.getElementById("boutonAmisDeux").textContent === texte("amisDeux")')
      and (pg.click('#boutonAmisRetour') or True) and pg.evaluate('() => JEU.ecran === "titre"'))
    chargement = pg.evaluate('() => performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart')
    pg.click('#boutonJouer')
    t(f'{titre} : la course de découverte n’a pas de survol de la grille (GRILLE_DECOUVERTE faux : en piste en 10 secondes)', pg.evaluate('() => JEU.ecran !== "grille" && !REGLAGES.GRILLE_DECOUVERTE'), str(pg.evaluate('() => JEU.ecran')))
    t(f'{titre} : « ▶ Jouer » mène directement à la grille (écran course, pas de qualification), {R["tours"]} tours, {R["ia"]} IA au niveau {R["niveau"]} sur le circuit {R["circuit"]}, le joueur nommé « Toi » par défaut',
      attendre(pg, '() => JEU.ecran === "course" && JEU.plateau && JEU.qualif === null', None, 10000)
      and pg.evaluate(f'() => JEU.course.nbTours === {R["tours"]} && JEU.plateau.pilotes.length === {R["ia"]} + 1 && JEU.plateau.pilotes[{R["ia"]}].humain && REGLAGES.NIVEAU === "{R["niveau"]}" && NOM_CIRCUIT === "{R["circuit"]}" && JEU.course.feux && !!JEU.course.depart'),
      str(pg.evaluate('() => [JEU.ecran, JEU.course && JEU.course.nbTours, JEU.plateau && JEU.plateau.pilotes.length, REGLAGES.NIVEAU, NOM_CIRCUIT]')))
    t(f'{titre} : les {R["ia"]} IA sont des pilotes du monde (DECOUVERTE_PILOTES), aux couleurs de leur écurie',
      pg.evaluate('() => JEU.indices.length === REGLAGES.DECOUVERTE_IA && JEU.indices.every(id => !JEU.monde.pilotes[id].humain) && new Set(JEU.indices).size === JEU.indices.length && JEU.couleurs.slice(0, JEU.indices.length).every((c, k) => c === JEU.monde.ecuries[JEU.monde.pilotes[JEU.indices[k]].ecurie].couleur)'),
      str(pg.evaluate('() => JEU.indices')))
    # la carte des IA se calcule en fond : les feux attendent ; du clic aux feux éteints, la mesure (but : 10 s)
    t(f'{titre} : la carte se calcule, les IA reçoivent le caractère de leur pilote du monde', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.slice(0, REGLAGES.DECOUVERTE_IA).every((p, k) => p.pilote && p.pilote.caractere && Math.abs(p.pilote.caractere.agressivite - Math.max(0, Math.min(1, JEU.monde.pilotes[JEU.indices[k]].caractere.agressivite + REGLAGES.NIVEAUX.debutant.agressivite))) < 1e-9)', None, 240000))
    grille = pg.evaluate('() => { const P = JEU.plateau.pilotes, moi = P[P.length - 1], devant = P.filter(p => !p.humain && p.depart > moi.depart).length, derriere = P.filter(p => !p.humain && p.depart < moi.depart).length; return { devant, derriere, bouge: P.some(p => p.v.u !== 0) }; }')
    t(f'{titre} : le joueur part au milieu de la grille ({R["ia"] // 2} IA devant, {R["ia"] - R["ia"] // 2} derrière)', grille['devant'] == R['ia'] // 2 and grille['derriere'] == R['ia'] - R['ia'] // 2 and not grille['bouge'], str(grille))
    t(f'{titre} : sur la grille, les aides sont affichées (↑ ← → ↓), aucune touche encore', attendre(pg, '() => !document.getElementById("aides").classList.contains("cache") && ["aideGaz", "aideDirection", "aideFrein"].every(id => !document.getElementById(id).classList.contains("cache"))', None, 10000))
    t(f'{titre} : sans aucune touche pendant AIDE_CLIGNOTE_APRES s sur la grille, « ↑ » clignote', attendre(pg, '() => document.getElementById("aideGaz").classList.contains("clignote")', None, 20000), str(pg.evaluate('() => [JEU.course.depart && JEU.course.depart.t, JEU.aides]')))
    extinction = attendre(pg, '() => JEU.course.etat !== "compte"', None, 60000)
    mesure = pg.evaluate('() => JEU.clicAuxFeux'); premier = pg.evaluate('() => JEU.clicAuPremierFeu')
    t(f'{titre} : les feux s’éteignent, le temps du clic aux feux est mesuré (sous swiftshader, la carte en fond pèse : la valeur est donnée telle quelle)', extinction and mesure is not None and mesure > 0, str(mesure))
    cache = pg.evaluate('() => { const c = SAUVEGARDE.carte(NOM_CIRCUIT); return { present: !!c, taille: c ? CACHE_CARTE.taille(c) : 0, duCache: JEU.carteDuCache }; }')
    t(f'{titre} : au premier lancement, pas de cache : la carte est calculée en fond, puis mise en cache dans la sauvegarde (taille < CACHE_CARTE_TAILLE_MAX)', not cache['duCache'] and cache['present'] and 0 < cache['taille'] < pg.evaluate('() => REGLAGES.CACHE_CARTE_TAILLE_MAX'), str(cache))
    L.append(f"  (premier lancement : page chargée en {chargement} ms ; du clic sur « Jouer » au premier feu (l’attente de la carte des IA) : {(premier or 0) / 1000:.1f} s, à l’extinction des feux : {(mesure or 0) / 1000:.1f} s, sous swiftshader ; carte mise en cache : {cache['taille']} octets)")
    t(f'{titre} : gameplayStart seulement aux feux éteints, une fois', attendre(pg, '() => window.APPELS_SDK.join(",") === "init,gameLoadingFinished,gameplayStart"', None, 10000), str(pg.evaluate('() => window.APPELS_SDK')))
    # les touches : chaque aide part quand sa touche a servi (le robot conduit ; les touches ne font que marquer les aides)
    pg.keyboard.press('ArrowUp'); pg.wait_for_timeout(100)
    t(f'{titre} : ↑ pressée : l’aide « ↑ accélérer » disparaît, les autres restent', attendre(pg, '() => document.getElementById("aideGaz").classList.contains("cache") && !document.getElementById("aideDirection").classList.contains("cache") && !document.getElementById("aideFrein").classList.contains("cache")', None, 5000), str(pg.evaluate('() => JEU.aides')))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'decouverte.png'))
    pg.keyboard.press('ArrowLeft'); pg.keyboard.press('ArrowDown')
    t(f'{titre} : ← et ↓ pressées : plus aucune aide', attendre(pg, '() => document.getElementById("aides").classList.contains("cache") || ["aideGaz", "aideDirection", "aideFrein"].every(id => document.getElementById(id).classList.contains("cache"))', None, 5000), str(pg.evaluate('() => JEU.aides')))
    # le robot roule jusqu'au podium (3 tours, 7 voitures)
    for _ in range(90):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    t(f'{titre} : la course va jusqu’au podium ; gameplayStop au podium', pg.evaluate('() => JEU.ecran === "podium" && JEU.final && JEU.final.length === REGLAGES.DECOUVERTE_IA + 1') and attendre(pg, '() => window.APPELS_SDK.slice(-1)[0] === "gameplayStop"'), str(pg.evaluate('() => [JEU.ecran, window.APPELS_SDK]')))
    pg.click('#boutonResultats')
    bravo = pg.evaluate('''() => { const moi = JEU.final.find(x => x.k === JEU.suivie); return { ecran: JEU.ecran, place: moi.place, prime: JEU.prime, attendu: DECOUVERTE.prime(moi.place),
      titre: document.getElementById("bravoTitre").textContent, question: document.getElementById("bravoQuestion").textContent, placeTexte: document.getElementById("bravoPlace").textContent, argentTexte: document.getElementById("bravoArgent").textContent, faite: SAUVEGARDE.decouverteFaite(), argent: SAUVEGARDE.argent() }; }''')
    t(f'{titre} : après le podium, « Bravo ! Prêt pour ta carrière ? », la place et la prime selon la place (plafond {R["max"]}) ; rien n’est encore sauvegardé',
      bravo['ecran'] == 'bravo' and bravo['prime'] == bravo['attendu'] and bravo['prime'] == min(R['argent'][bravo['place'] - 1], R['max']) and bravo['titre'] == pg.evaluate('() => texte("bravoTitre")')
      and bravo['question'] == pg.evaluate('() => texte("bravoQuestion")') and f"P{bravo['place']} / {R['ia'] + 1}" in bravo['placeTexte'] and pg.evaluate('p => ARGENT.formater(p)', bravo['prime']) in bravo['argentTexte'] and '$' not in bravo['argentTexte'] and not bravo['faite'] and bravo['argent'] == 0, str(bravo))
    L.append(f"  (découverte du robot : P{bravo['place']} / {R['ia'] + 1}, prime {bravo['prime']} $)")
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'bravo.png'))
    t(f'{titre} : aucun point de championnat n’est donné', pg.evaluate('() => SAUVEGARDE.championnat().pilotes.every(p => p.stats.points === 0 && p.stats.courses === 0) && SAUVEGARDE.championnat().prochain === 0'))
    t(f'{titre} : jamais de commercialBreak', pg.evaluate('() => !window.APPELS_SDK.includes("commercialBreak")'), str(pg.evaluate('() => window.APPELS_SDK')))
    # la création du pilote (pilote.js) : après « Commencer ma carrière », l'écran ; un numéro de rival est refusé, un pays sans
    # circuit demande la course de cœur, un pays avec circuit l'impose (🏠) ; validé → sauvegardé, la page recharge sur le paddock
    # avec le nom du joueur ; puis un Grand Prix d'un tour : son numéro dans la tour, son nom sur la une du journal
    pg.click('#boutonCarriere')
    t(f'{titre} : « Commencer ma carrière » ouvre la création du pilote (nom, numéro, pays, course de cœur), rien n’est encore sauvegardé',
      attendre(pg, '() => JEU.ecran === "pilote" && !document.getElementById("pilote").classList.contains("cache")') and pg.evaluate('() => !SAUVEGARDE.decouverteFaite() && document.querySelectorAll("#pilotePays option").length === REGLAGES.PAYS.length && document.querySelectorAll("#piloteCoeur option").length === 12 && document.getElementById("piloteNom").placeholder === texte("nomJoueur")'),
      str(pg.evaluate('() => [JEU.ecran, document.querySelectorAll("#pilotePays option").length]')))
    # l'éditeur du casque : le motif et une couleur changent, la case du joueur dans l'atlas change, l'aperçu 3D tourne
    casque0 = pg.evaluate('() => { const a = VOITURE3D.atlas, i = JEU.contre ? JEU.ia : 0, t = a.t; return Array.from(a.ctx.getImageData((i % a.colonnes) * t, Math.floor(i / a.colonnes) * t, t, t).data).join(); }')
    t(f'{titre} : l’éditeur du casque est là (motif, 3 couleurs, aperçu 3D), avec le casque neutre du joueur ; les 19 rivaux ont chacun le leur', pg.evaluate('() => document.querySelectorAll("#casqueMotif option").length === CASQUE.tousLesMotifs().length && document.querySelectorAll("#casqueMotif option:disabled").length === Object.keys(REGLAGES.CASQUE_DEBLOCAGES).length && document.getElementById("casqueMotif").value === "uni" && !!VOITURE3D.atlas && CASQUE.doublons(JEU.monde).length === 0 && JEU.monde.pilotes.filter(p => !p.humain).every(p => CASQUE.valide(p.casque))'))
    pg.select_option('#casqueMotif', 'flammes')
    pg.evaluate('() => { const c = document.getElementById("casqueC1"); c.value = "#d8262e"; c.dispatchEvent(new Event("input")); }')
    pg.wait_for_timeout(300)
    casque1 = pg.evaluate('() => { const a = VOITURE3D.atlas, i = JEU.contre ? JEU.ia : 0, t = a.t; return Array.from(a.ctx.getImageData((i % a.colonnes) * t, Math.floor(i / a.colonnes) * t, t, t).data).join(); }')
    t(f'{titre} : changer le motif (flammes) et la couleur 1 redessine la case du joueur dans l’atlas (une seule texture, un seul matériau), et le casque tourne', casque1 != casque0 and pg.evaluate('() => INTERFACE.lireCasque().motif === "flammes" && INTERFACE.lireCasque().couleurs[0] === 0xd8262e && JEU.modeles.every(m => m.tete.material === VOITURE3D.atlas.materiau)'))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'casque.png'))
    pg.fill('#piloteNom', 'Léo'); pg.fill('#piloteNumero', '7'); pg.select_option('#pilotePays', 'fr')
    t(f'{titre} : la France n’a pas de circuit : la course de cœur est à choisir (liste active, pas de 🏠)', pg.evaluate('() => !document.getElementById("piloteCoeur").disabled && document.getElementById("piloteDomicile").textContent === ""'))
    pg.select_option('#pilotePays', 'it')
    t(f'{titre} : l’Italie a Monzo : la course de cœur est imposée (🏠 Grand Prix à domicile : Monzo)', pg.evaluate('() => document.getElementById("piloteCoeur").disabled && document.getElementById("piloteCoeur").value === "monzo" && document.getElementById("piloteDomicile").textContent === texte("piloteDomicile").replace("{circuit}", texte("circuit_monzo"))'), pg.evaluate('() => document.getElementById("piloteDomicile").textContent'))
    pg.select_option('#pilotePays', 'fr'); pg.select_option('#piloteCoeur', 'monoco')
    pg.click('#boutonPiloteValider')
    t(f'{titre} : le numéro 7 est celui d’un rival : refusé, l’erreur affichée, on reste sur l’écran', pg.evaluate('() => JEU.ecran === "pilote" && document.getElementById("piloteErreur").textContent === texte("piloteErreurNumero").replace("{min}", REGLAGES.NUMERO_MIN).replace("{max}", REGLAGES.NUMERO_MAX)'), pg.evaluate('() => document.getElementById("piloteErreur").textContent'))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'pilote.png'))
    pg.fill('#piloteNumero', '27')
    with pg.expect_navigation(): pg.click('#boutonPiloteValider')
    t(f'{titre} : numéro 27 : validé, sauvegardé (nom, numéro, pays, course de cœur), la découverte faite avec sa prime, et la page rechargée arrive au paddock avec « Léo » dans le classement',
      attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat', None, 60000)
      and pg.evaluate(f'''() => {{ const j = PILOTE.joueur(JEU.championnat), s = PILOTE.joueur(SAUVEGARDE.championnat()); return j.nom === "Léo" && j.numero === 27 && j.pays === "fr" && j.coeur === "monoco" && s.nom === "Léo" && s.numero === 27
        && SAUVEGARDE.decouverteFaite() && SAUVEGARDE.argent() === {bravo["prime"]} && (typeof ARGENT === "undefined" || ARGENT.solde(JEU.championnat) === {bravo["prime"]}) && [...document.querySelectorAll("#championnatPilotes li .nom")].some(e => e.textContent === "Léo") && !PILOTE.manque(JEU.championnat)
        && j.casque.motif === "flammes" && j.casque.couleurs[0] === 0xd8262e && document.querySelectorAll("#championnatPilotes li .nom canvas.casqueIcone").length === 20; }}'''),
      str(pg.evaluate('() => [JEU.ecran, PILOTE.joueur(JEU.championnat)]')))
    # un Grand Prix d'un tour : le numéro 27 dans la tour de classement, le nom sur la une du journal
    t(f'{titre} : au lancement suivant, la carte des IA vient du cache de la sauvegarde (pas de calcul en fond, les IA ont déjà leur pilote)', pg.evaluate('() => JEU.carteDuCache === true && JEU.carte !== null && JEU.calculTrajectoire === null'), str(pg.evaluate('() => [JEU.carteDuCache, JEU.carte !== null]')))
    pg.click('#boutonCourseSuivante')
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 10000)
    pg.click('#boutonQualifPasser')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 10000)
    pg.click('#boutonQualifCourse')
    # avant les feux, la grille vue d'en haut (CLAUDE.md « L'interface ») : la caméra au-dessus de la grille, les feux pas encore
    # allumés (la physique attend), une touche la passe ; jamais à deux ni au tournoi (vérifié dans leurs pages : pas d'écran « grille »)
    attendre(pg, '() => JEU.ecran !== "grille" || Math.abs(SCENE3D.camera.position.y - REGLAGES.GRILLE_HAUTEUR) < 1', None, 3000)
    g = pg.evaluate('() => ({ ecran: JEU.ecran, y: SCENE3D.camera.position.y, h: REGLAGES.GRILLE_HAUTEUR, compte: JEU.course.compte, total: JEU.course.feux.total, aide: document.getElementById("grilleAide").textContent })')
    t(f'{titre} : avant les feux, la grille vue d’en haut (la caméra à GRILLE_HAUTEUR m, aucun feu allumé, « une touche pour passer »)', g['ecran'] == 'grille' and abs(g['y'] - g['h']) < 1 and g['compte'] >= g['total'] and g['aide'] != '', str(g))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'grille.png'))
    pg.keyboard.press('KeyX')
    t(f'{titre} : une touche passe la grille : la course (les feux) tout de suite, la caméra de course revient', attendre(pg, '() => JEU.ecran === "course" && SCENE3D.camera.position.y < 10', None, 3000), str(pg.evaluate('() => [JEU.ecran, SCENE3D.camera.position.y]')))
    t0 = time.monotonic()
    premier2 = attendre(pg, '() => JEU.ecran === "course" && JEU.course.feux && (JEU.course.etat !== "compte" || JEU.course.compte < JEU.course.feux.total)', None, 60000)
    attente2 = time.monotonic() - t0
    feux2 = attendre(pg, '() => JEU.course.etat !== "compte"', None, 90000)
    mesure2 = time.monotonic() - t0
    # (sous swiftshader avec 20 voitures, les 5 feux eux-mêmes prennent plus de temps réel que de temps de jeu : c'est l'attente
    # avant le premier feu qui mesure la carte)
    t(f'{titre} : avec le cache, du départ de la course au premier feu : aucune attente de la carte (moins de 3 s, contre {(premier or 0) / 1000:.1f} s au premier lancement)', premier2 and attente2 < 3 and feux2, f'{attente2:.1f} s')
    L.append(f"  (deuxième lancement, carte en cache : du départ de la course au premier feu {attente2:.1f} s, aux feux éteints {mesure2:.1f} s ; au premier lancement : {(premier or 0) / 1000:.1f} s et {(mesure or 0) / 1000:.1f} s)")
    t(f'{titre} : en course, la ligne du joueur dans la tour porte son numéro 27 et l’icône de son casque (une par ligne)', attendre(pg, '() => document.querySelector("#classementListe li.moi") && document.querySelector("#classementListe li.moi .numero").textContent === "27" && document.querySelectorAll("#classementListe li canvas.casqueIcone").length === 20', None, 20000), pg.evaluate('() => document.querySelector("#classementListe li.moi") && document.querySelector("#classementListe li.moi").innerText'))
    # la vue télé pendant la course : des casques différents sur les voitures (capture casques-course.png)
    pg.evaluate('() => BOUCLE.simuler(8)')
    pg.evaluate('() => CAMERA.forcer("tele")'); pg.wait_for_timeout(500)
    pg.screenshot(path=os.path.join(CAPTURES, 'casques-course.png'))
    pg.evaluate('() => CAMERA.forcer("derriere")')
    attendre(pg, '() => JEU.plateau.carte !== null', None, 240000)
    for _ in range(80):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    pg.click('#boutonResultats'); attendre(pg, '() => JEU.ecran === "resultats"')
    t(f'{titre} : dans les résultats, le joueur a le numéro 27', pg.evaluate('() => /\\b27\\b/.test(document.querySelector("#resultatsLignes tr.moi").innerText)'), pg.evaluate('() => document.querySelector("#resultatsLignes tr.moi") && document.querySelector("#resultatsLignes tr.moi").innerText'))
    pg.click('#boutonChangerResultats')
    passer_interview(pg)   # l'interview d'après course (Codeur 3) : « Pas de commentaire »
    t(f'{titre} : la une du journal nomme « Léo »', attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => document.getElementById("une").innerText.includes("Léo")'), pg.evaluate('() => document.getElementById("une").innerText.slice(0, 300)'))

# sdk.js est le seul passage vers Poki : avec le faux SDK posé avant la page, les appels viennent dans l'ordre, et jamais
# deux fois le même état (gameplayStart / gameplayStop) de suite ; une course d'un tour par le robot
def sdk(pg, titre):
    J = '() => window.APPELS_SDK.join(",")'
    t(f'{titre} : le faux SDK est vu ; au démarrage d’une course : init, gameLoadingFinished, gameplayStart, dans cet ordre', attendre(pg, '() => SDK.present && JEU.sdkPret && window.APPELS_SDK.join(",") === "init,gameLoadingFinished,gameplayStart"', None, 20000), pg.evaluate(J))
    pg.keyboard.press('Escape')
    t(f'{titre} : la pause envoie gameplayStop', attendre(pg, '() => JEU.ecran === "pause" && window.APPELS_SDK.slice(-1)[0] === "gameplayStop"'), pg.evaluate(J))
    pg.click('#boutonReprendre')
    t(f'{titre} : « Reprendre » renvoie gameplayStart', attendre(pg, '() => JEU.ecran === "course" && window.APPELS_SDK.slice(-1)[0] === "gameplayStart"'), pg.evaluate(J))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'fin': break
        pg.wait_for_timeout(50)
    t(f'{titre} : à l’arrivée (écran de fin), gameplayStop ; sur toute la course, jamais deux fois le même état de suite',
      attendre(pg, '() => JEU.ecran === "fin" && window.APPELS_SDK.slice(-1)[0] === "gameplayStop"') and pg.evaluate(J) == 'init,gameLoadingFinished,gameplayStart,gameplayStop,gameplayStart,gameplayStop', pg.evaluate(J))
    pg.click('#boutonRejouer')
    t(f'{titre} : « Rejouer » : gameplayStart, une seule fois', attendre(pg, '() => JEU.ecran === "course" && window.APPELS_SDK.slice(-2).join(",") === "gameplayStop,gameplayStart"'), pg.evaluate(J))

# ?pneus=1 : les pneus du joueur (pneus.js) s'usent, son adhérence baisse, ?debug=1 l'affiche (sans ?pneus=1 : rien, PNEUS_ACTIFS faux)
def pneus(pg, titre):
    t(f'{titre} : ?pneus=1 active PNEUS_ACTIFS, la voiture du joueur part avec des pneus neufs (usure 0, adhérence × 1)', pg.evaluate('() => REGLAGES.PNEUS_ACTIFS === true && !!JEU.joueur.pneus && JEU.joueur.pneus.usure === 0 && JEU.joueur.adherence === 1'))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    releves = []
    for _ in range(10):
        pg.evaluate('() => BOUCLE.simuler(64)')
        releves.append(pg.evaluate('() => [JEU.course.tours.length, JEU.joueur.pneus.usure, JEU.joueur.adherence]'))
    monte = all(b[1] > a[1] and b[2] < a[2] for a, b in zip(releves, releves[1:]))
    t(f'{titre} : en 10 tours du robot (essai libre), l’usure monte à chaque tour et l’adhérence baisse', monte and releves[-1][0] >= 9 and 0 < releves[-1][1] <= 1 and releves[-1][2] < 1, str(releves))
    L.append(f'  (?pneus=1, robot : après {releves[-1][0]} tours, usure {releves[-1][1]:.2f}, adhérence × {releves[-1][2]:.3f})')
    t(f'{titre} : ?debug=1 affiche l’usure des pneus', attendre(pg, '() => /pneus \\d+ %/.test(document.getElementById("ips").textContent)'), pg.evaluate('() => document.getElementById("ips").textContent'))

# l'arrêt au stand (étape 7, ?pneus=1, course de 12 tours, le robot) : le message du tour conseillé au départ ; le robot va aux stands
# (v.versStands, robot.js), s'arrête dans la zone (capture stand.png pendant l'arrêt, le message « Arrêt au stand… »), repart avec des
# pneus neufs, « Pneus neufs ! », sans pénalité ; son tour compte
def stand_ecran(pg, titre):
    attendre(pg, '() => typeof JEU !== "undefined" && !!JEU.course && !!JEU.joueur.pneus', None, 30000)
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    conseil = attendre(pg, '() => !document.getElementById("hudStand").classList.contains("cache") && /tour 6 conseillé/.test(document.getElementById("hudStand").textContent)', None, 10000)
    t(f'{titre} : au départ, le message « Arrêt au stand obligatoire : tour 6 conseillé »', conseil, pg.evaluate('() => document.getElementById("hudStand").textContent'))
    pg.evaluate('() => { BOUCLE.simuler(3); JEU.joueur.pneus.usure = 0.5; JEU.joueur.versStands = true; }')
    arrete = False
    for _ in range(60):
        pg.evaluate('() => BOUCLE.simuler(2)')
        if pg.evaluate('() => !!JEU.course.arretEnCours'): arrete = True; break
    attendre(pg, '() => /^Arrêt au stand… \\d,\\d s$/.test(document.getElementById("hudStand").textContent)', None, 3000)   # (l'affichage suit à l'image suivante)
    texte = pg.evaluate('() => document.getElementById("hudStand").textContent')
    t(f'{titre} : le robot entre dans la voie et s’arrête dans la zone ; le message « Arrêt au stand… x,x s » pendant l’arrêt', arrete and re.fullmatch(r'Arrêt au stand… \d,\d s', texte) is not None and pg.evaluate('() => JEU.joueur.dansStands && JEU.joueur.u === 0'), texte)
    pg.screenshot(path=os.path.join(CAPTURES, 'stand.png'))
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(1)')
        if pg.evaluate('() => JEU.course.arrets.length === 1'): break
    attendre(pg, '() => /Pneus neufs/.test(document.getElementById("hudStand").textContent)', None, 2000)   # (l'affichage suit à l'image suivante)
    neufs = pg.evaluate('() => [JEU.course.arrets.length, JEU.joueur.pneus.usure, document.getElementById("hudStand").textContent, JEU.course.penalites]')
    t(f'{titre} : il repart avec des pneus neufs (« Pneus neufs ! »), sans pénalité', neufs[0] == 1 and neufs[1] < 0.05 and 'Pneus neufs' in neufs[2] and neufs[3] == 0, str(neufs))
    for _ in range(20):
        pg.evaluate('() => BOUCLE.simuler(2)')
        if pg.evaluate('() => !JEU.joueur.versStands'): break
    fin = pg.evaluate('() => [JEU.joueur.versStands, JEU.joueur.dansStands, JEU.course.tours.length, JEU.joueur.contactsMurStands, JEU.course.penalites]')
    t(f'{titre} : il ressort sur la piste, sans toucher le muret, et son tour compte', fin[0] is False and fin[1] is False and fin[2] >= 1 and fin[3] == 0 and fin[4] == 0, str(fin))
    L.append(f'  (arrêt au stand dans la page : arrêts {pg.evaluate("() => JSON.stringify(JEU.course.arrets)")}, tours {fin[2]})')

# les consignes d'équipe (simulation.js majConsignes) quand elles visent le JOUEUR, devant son coéquipier : en championnat, Grand Prix 1,
# le robot et son coéquipier échangent leurs places sur la grille (le joueur devant), puis l'écurie lui donne la consigne (fabriquée : le
# déclenchement lui-même est testé en simulation, test.html et consignes.html) ; le message s'affiche (capture consigne.png) ; « suivie » :
# le robot lève le pied, le coéquipier passe, « Merci ! » ; « ignorée » : il ne lève pas le pied et le délai est court (3 s) ; à la fin du
# Grand Prix (« Pas de commentaire » à l'interview), la confiance de l'écurie a bougé de ±CONSIGNE_CONFIANCE, et c'est sauvegardé
def consigne_ecran(pg, titre, suivre):
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    avant = pg.evaluate('() => JEU.championnat.reputation ? JEU.championnat.reputation.ecurie : 50')
    pg.click('#boutonCourseSuivante')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.etat === "compte"', None, 180000)
    # le joueur et son coéquipier échangent leurs places sur la grille (le joueur devant lui)
    info = pg.evaluate('''() => { const e = JEU.plateau, P = e.pilotes, j = P.findIndex(p => p.humain), kc = CHAMPIONNAT.coequipierDe(JEU.championnat).id;
      const a = P[j], b = P[kc], pa = { s: a.v.piste.s, d: a.v.piste.d, depart: a.depart }, pb = { s: b.v.piste.s, d: b.v.piste.d, depart: b.depart };
      if (pa.depart < pb.depart) { placerSurPiste(a.v, CIRCUIT, pb.s, pb.d); placerSurPiste(b.v, CIRCUIT, pa.s, pa.d); a.depart = pb.depart; b.depart = pa.depart; e.origine = Math.min(...P.map(p => p.depart)); }
      return [j, kc, P[kc].numero]; }''')
    if not suivre: pg.evaluate('() => { REGLAGES.CONSIGNE_DELAI = 3; }')
    attendre(pg, '() => JEU.course.etat === "course" && JEU.course.temps > 1', None, 30000)
    pg.evaluate(f'''() => {{ const e = JEU.plateau, P = e.pilotes, j = {info[0]}, kc = {info[1]};
      const c = {{ devant: j, derriere: kc, numero: P[kc].numero, debut: e.temps, joueur: true, refus: false, resultat: null }};
      e.consigne = c; P[j].course.consigne = c; P[kc].course.consigne = c; if (P[kc].pilote) P[kc].pilote.passer = {{ id: P[j].v }}; }}''')
    message = attendre(pg, f'() => document.getElementById("hudStand").textContent.startsWith("Consigne de l’écurie : laisse passer ton coéquipier n°{info[2]}".replace("’", "\'")) && !document.getElementById("hudStand").classList.contains("cache")', None, 5000)
    texte = pg.evaluate('() => document.getElementById("hudStand").textContent')
    t(f'{titre} : la consigne vise le joueur, devant son coéquipier plus rapide : le message dit ce qui est demandé et ce qu’on risque', message and 'confiance' in texte, texte)
    if suivre: pg.screenshot(path=os.path.join(CAPTURES, 'consigne.png')); pg.evaluate('() => { JEU.joueur.leverLePied = 12; }')   # (il lève le pied après le message)
    for _ in range(60):
        pg.evaluate('() => BOUCLE.simuler(1)')
        if pg.evaluate('() => !!JEU.plateau.consigne.resultat'): break
    res = pg.evaluate('() => JEU.plateau.consigne.resultat')
    pg.evaluate('() => { JEU.joueur.leverLePied = 0; }')
    attendre(pg, '() => /La confiance|Consigne ignorée|Merci/.test(document.getElementById("hudStand").textContent)', None, 3000)
    apres = pg.evaluate('() => document.getElementById("hudStand").textContent')
    if suivre: t(f'{titre} : le robot lève le pied, son coéquipier passe : « suivie », « Merci ! La confiance de l’écurie monte. »', res == 'suivie' and apres.startswith('Merci'), f'{res} / {apres}')
    else: t(f'{titre} : le robot ne laisse pas passer dans le délai : « ignorée », « Consigne ignorée : la confiance de l’écurie baisse. »', res == 'ignoree' and apres.startswith('Consigne ignorée'), f'{res} / {apres}')
    for _ in range(120):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(30)
    pg.click('#boutonResultats')
    attendre(pg, '() => JEU.ecran === "resultats"')
    pg.click('#boutonChangerResultats')
    passer_interview(pg)
    attendu = max(0, min(100, avant + (1 if suivre else -1) * pg.evaluate('() => REGLAGES.CONSIGNE_CONFIANCE')))
    fin = attendre(pg, f'() => JEU.championnat.reputation.ecurie === {attendu} && JEU.championnat.confiance === {attendu} && SAUVEGARDE.championnat().reputation.ecurie === {attendu}', None, 10000)
    t(f'{titre} : à la fin du Grand Prix, la confiance de l’écurie {"monte" if suivre else "baisse"} de CONSIGNE_CONFIANCE ({avant} → {attendu}), sauvegardée', fin,
      str(pg.evaluate('() => [JEU.ecran, JEU.championnat.reputation, JEU.championnat.confiance]')))

# ?lang=en : la page en anglais : lang et title remplis au démarrage, puis le classement du championnat, le podium et les
# résultats sans un mot français (les 11 textes en dur de l'audit) ; le robot joue le Grand Prix 1 (un tour)
MOTS_FR = r'Écurie|Pilote|\bToi\b|Tu marques|Course suivante|Continuer|Pénalit|Résultat|n°|Solde|Gains'
def championnat_en(pg, titre):
    t(f'{titre} : <html lang> et le titre de la page viennent de textes.js (en)', pg.evaluate('() => document.documentElement.lang === "en" && LANGUE === "en" && document.title === texte("nomDuJeu")'))
    ecran = pg.evaluate('''() => ({ titre: document.getElementById("championnatTitre").textContent, h2: [...document.querySelectorAll("#championnatTableaux h2")].map(e => e.textContent),
      pilotes: [...document.querySelectorAll("#championnatPilotes li .nom")].map(e => e.textContent), ecuries: [...document.querySelectorAll("#championnatEcuries li .nom")].map(e => e.textContent),
      bouton: document.getElementById("boutonCourseSuivante").textContent, tout: document.getElementById("championnat").innerText })''')
    t(f'{titre} : l’écran du championnat en anglais : « Grand Prix 1 / 12 — Test track », Drivers / Teams, « You » et « Driver n », « Team n », « Next race », pas un mot français',
      ecran['titre'] == 'Grand Prix 1 / 12 — Test track' and ecran['h2'] == ['Drivers', 'Teams'] and all(re.fullmatch(r'Driver \d+|You', n) for n in ecran['pilotes']) and ecran['pilotes'].count('You') == 1
      and all(re.fullmatch(r'Team \d+', n) for n in ecran['ecuries']) and ecran['bouton'] == 'Next race' and not re.search(MOTS_FR, ecran['tout']), str(ecran)[:400])
    pg.click('#boutonCourseSuivante')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    for _ in range(80):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    podium = pg.evaluate('() => ({ ecran: JEU.ecran, marches: [...document.querySelectorAll("#podiumMarches .marche")].map(e => e.innerText), bouton: document.getElementById("boutonResultats").textContent, tout: document.getElementById("podium").innerText })')
    t(f'{titre} : le podium en anglais : « No. n », le temps avec le point, « Results », pas un mot français', podium['ecran'] == 'podium' and len(podium['marches']) == 3
      and all(re.search(r'No\. \d+', m) and re.search(r'\d:\d\d\.\d{3}', m) for m in podium['marches']) and podium['bouton'] == 'Results' and not re.search(MOTS_FR, podium['tout']), str(podium))
    pg.click('#boutonResultats')
    attendre(pg, '() => JEU.ecran === "resultats"')
    res = pg.evaluate('() => ({ entete: [...document.querySelectorAll("#resultatsEntete th")].map(e => e.textContent).join(","), texte: document.getElementById("resultats").innerText })')
    t(f'{titre} : les résultats en anglais (Pos, No, Time, Penalty, Gap, Grid ; « Continue »)', res['entete'] == 'Pos,No,Time,Penalty,Gap,Grid' and 'Continue' in res['texte'] and not re.search(MOTS_FR, res['texte']), str(res)[:300])
    pg.click('#boutonChangerResultats')
    attendre(pg, '() => JEU.ecran === "interview"', None, 10000)
    t(f'{titre} : après les résultats, l’interview en anglais (« Post-race interview », « No comment »), pas un mot français', not re.search(MOTS_FR, pg.evaluate('() => document.getElementById("interview").innerText'))
      and 'Post-race interview' in pg.evaluate('() => document.getElementById("interview").innerText') and 'No comment' in pg.evaluate('() => document.getElementById("interview").innerText'), pg.evaluate('() => document.getElementById("interview").innerText')[:300])
    interview_ecran(pg, titre, 'calme', gp='en anglais : ')
    t(f'{titre} : après les résultats, la une du journal en anglais, pas un mot français', attendre(pg, '() => JEU.ecran === "une"') and not re.search(MOTS_FR, pg.evaluate('() => document.getElementById("une").innerText')),
      pg.evaluate('() => document.getElementById("une").innerText')[:300])
    une_ecran(pg, titre, 'une-en.png')
    t(f'{titre} : après le Grand Prix, « You scored n points » et le classement en anglais', attendre(pg, '() => JEU.ecran === "championnat" && /^You scored \\d+ points?$/.test(document.getElementById("championnatGagne").textContent)')
      and not re.search(MOTS_FR, pg.evaluate('() => document.getElementById("championnat").innerText')), pg.evaluate('() => document.getElementById("championnatGagne").textContent'))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, 'championnat-en.png'))

# le mode 2 joueurs (deux-joueurs.js, CLAUDE.md « Le mode 2 joueurs (écran partagé) ») : ?deux=1&ia=5, les deux joueurs conduits par le
# robot ; l'écran partagé haut (joueur 1) / bas (joueur 2), la tour partagée, ni radar ni bandeau seul, feux et jauge de chacun dans sa
# moitié, rien ne déborde ; la mesure de la 3D dessinée deux fois (images/s, triangles, appels) contre une seule vue de la même scène
def deux_ecran(pg, titre, l, h, page):
    def image():
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } BOUCLE.demarrer(); return window.__images; }')
        attendre(pg, 'n => window.__images > n + 1', n, 20000)
    def boite(sel):
        return pg.evaluate('s => { const e = document.querySelector(s); if (!e || e.classList.contains("cache") || getComputedStyle(e).display === "none") return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', sel)
    def dans(b, x1, y1, x2, y2): return b is not None and b[0] >= x1 - 2 and b[1] >= y1 - 2 and b[2] <= x2 + 2 and b[3] <= y2 + 2
    etat = pg.evaluate('() => ({ deux: !!JEU.deux, nb: JEU.plateau.pilotes.length, joueurs: DEUX_JOUEURS.joueurs(JEU.plateau).map(p => p.humain && p.joueur), partage: SCENE3D.partage, corps: document.body.classList.contains("deux"), ecran: JEU.ecran, modeles: JEU.modeles.length, detailles: JEU.modeles.filter(m => m.detaille).length })')
    t(f'{titre} : ?deux=1&ia=5 : 7 voitures (2 joueurs + 5 IA), les deux joueurs humains, l’écran partagé allumé, la course tout de suite (pas de qualification)',
      etat['deux'] and etat['nb'] == 7 and etat['joueurs'] == [1, 2] and etat['partage'] and etat['corps'] and etat['ecran'] == 'course' and etat['modeles'] == 7 and etat['detailles'] == 2, str(etat))
    t(f'{titre} : la carte des IA arrive, les 5 IA ont leur pilote, la grille est tirée (les deux joueurs côte à côte)',
      attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.filter(p => p.pilote).length === 5 && JEU.plateau.grille && (() => { const [a, b] = DEUX_JOUEURS.joueurs(JEU.plateau); const g = JEU.plateau.grille.map(x => x.numero); return g.indexOf(b.numero) === g.indexOf(a.numero) + 1; })()', None, 120000),
      str(pg.evaluate('() => [JEU.plateau.carte !== null, JEU.plateau.grille]')))
    # les feux : on les retient pour voir les deux jeux de feux et les deux jauges, chacun dans sa moitié
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
    t(f'{titre} : les 5 feux du joueur 1 en haut et leur copie en bas, allumés pareil', attendre(pg, '() => !document.getElementById("feux").classList.contains("cache") && !document.getElementById("feux2").classList.contains("cache") && document.querySelectorAll("#feux span.allume").length === 5 && document.querySelectorAll("#feux2 span.allume").length === 5', None, 20000),
      pg.evaluate('() => [document.getElementById("feux").className, document.getElementById("feux2").className]'))
    f1, f2, j1, j2 = boite('#feux'), boite('#feux2'), boite('#jauge'), boite('#jauge2')
    t(f'{titre} : côte à côte : les feux et la jauge du joueur 1 sont dans la moitié gauche, ceux du joueur 2 dans la moitié droite', dans(f1, 0, 0, l / 2, h) and dans(j1, 0, 0, l / 2, h) and dans(f2, l / 2, 0, l, h) and dans(j2, l / 2, 0, l, h), str([f1, j1, f2, j2]))
    if l == 1280 and 'technique' not in page: pg.screenshot(path=os.path.join(CAPTURES, 'deux-feux.png'))
    # la piste sous chaque voiture (en pixels, la boucle arrêtée, l'image lue juste après SCENE3D.dessiner) : la route est grise (PISTE_GRIS_ECART_MAX),
    # l'herbe est verte ; vu au tour 25b : à 2 cm sous la route, l'herbe gagnait parfois le tampon de profondeur (SOL_RECUL_PROFONDEUR)
    PISTE = '''(zones) => { BOUCLE.arreter(); const c = SCENE3D.canvas, l = c.width, h = c.height, k = document.createElement('canvas'); k.width = l; k.height = h; const ctx = k.getContext('2d');
      SCENE3D.dessiner(); ctx.drawImage(c, 0, 0); const res = [];
      for (const z of zones) { const x0 = Math.round(z[0] * l), y0 = Math.round(z[1] * h), w = Math.round(z[2] * l) - x0, ht = Math.round(z[3] * h) - y0, d = ctx.getImageData(x0, y0, w, ht).data; let gris = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { n++; const m = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]); if (m <= REGLAGES.PISTE_GRIS_ECART_MAX) gris++; }
        res.push({ gris: Math.round(100 * gris / n), exemple: [d[0], d[1], d[2]].join(',') }); }
      BOUCLE.demarrer(); return res; }'''
    piste = pg.evaluate(PISTE, [[0.20, 0.93, 0.30, 0.99], [0.70, 0.93, 0.80, 0.99]])
    t(f'{titre} : la piste est dessinée sous chaque voiture : sur la grille, sous le joueur 1 (bas de la moitié gauche) et sous le joueur 2 (bas de la moitié droite), au moins 90 % de pixels gris de route', all(p['gris'] >= 90 for p in piste), str(piste))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    t(f'{titre} : les deux robots partent après les feux (chacun son départ)', attendre(pg, '() => DEUX_JOUEURS.joueurs(JEU.plateau).every(p => p.course.etat === "course" && p.course.depart.lance !== null)', None, 20000), str(pg.evaluate('() => DEUX_JOUEURS.joueurs(JEU.plateau).map(p => [p.course.etat, p.course.depart.resultat])')))
    pg.evaluate('() => BOUCLE.simuler(12)'); image()
    cams = pg.evaluate('() => { const [a, b] = DEUX_JOUEURS.joueurs(JEU.plateau), c1 = SCENE3D.camera.position, c2 = SCENE3D.camera2.position; return { d1: Math.hypot(c1.x - a.v.x, c1.z - a.v.z), d2: Math.hypot(c2.x - b.v.x, c2.z - b.v.z), entre: Math.hypot(c1.x - c2.x, c1.z - c2.z), aspect: [SCENE3D.camera.aspect, SCENE3D.camera2.aspect], fov: [SCENE3D.camera.fov, SCENE3D.camera2.fov], fovBase: REGLAGES.DEUX_FOV_COTE }; }')
    t(f'{titre} : deux vues : la caméra de gauche est derrière le joueur 1, celle de droite derrière le joueur 2 (à moins de 30 m chacune, distinctes), à la proportion d’une moitié (étroite et haute), avec le champ de vision DEUX_FOV_COTE', cams['d1'] < 30 and cams['d2'] < 30 and cams['entre'] > 1 and abs(cams['aspect'][0] - (l / 2) / h) < 0.05 and cams['aspect'][0] == cams['aspect'][1] and cams['fov'][0] >= cams['fovBase'] and cams['fov'][1] >= cams['fovBase'], str(cams))
    LIRE_HUD = '() => { const lire = id => [...document.querySelectorAll("#" + id + " span")].map(s => s.textContent); return { haut: lire("deuxHaut"), bas: lire("deuxBas"), tour: document.querySelectorAll("#classementListe li").length, classementCache: document.getElementById("classement").classList.contains("cache"), radar: getComputedStyle(document.getElementById("radar")).display, bandeau: getComputedStyle(document.getElementById("hudCourse")).display, tableau: getComputedStyle(document.getElementById("tableau")).display, moi: document.querySelectorAll("#classementListe li.moi").length, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'
    hud = pg.evaluate(LIRE_HUD)
    t(f'{titre} : l’affichage de chaque moitié : « Joueur 1 », place, Tour 1 / 3, vitesse en km/h ; pareil pour le joueur 2', len(hud['haut']) == 5 and re.fullmatch(r'🔵 (Joueur|Player) 1', hud['haut'][0]) and re.fullmatch(r'P[1-7]', hud['haut'][1]) and re.fullmatch(r'(Tour|Lap) 1 / 3', hud['haut'][2]) and re.fullmatch(r'\d+ km/h', hud['haut'][3])
      and re.fullmatch(r'🔴 (Joueur|Player) 2', hud['bas'][0]) and re.fullmatch(r'P[1-7]', hud['bas'][1]) and re.fullmatch(r'\d+ km/h', hud['bas'][3]) and hud['haut'][1] != hud['bas'][1], str(hud))
    t(f'{titre} : UNE tour de classement partagée (7 lignes, les deux joueurs marqués), ni radar, ni bandeau de la course seule, ni compteur', hud['tour'] == 7 and not hud['classementCache'] and hud['moi'] == 2 and hud['radar'] == 'none' and hud['bandeau'] == 'none' and hud['tableau'] == 'none', str(hud))
    bh, bb, bc, sep, son = boite('#deuxHaut'), boite('#deuxBas'), boite('#classement'), boite('#deuxSeparation'), boite('#boutonSon')
    croise = lambda a, b: a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    t(f'{titre} : rien ne déborde en {l}×{h} : l’affichage du joueur 1 en haut de la moitié gauche, celui du joueur 2 en haut de la moitié droite, la tour en haut au milieu (à cheval sur le trait vertical, sans toucher les affichages), le bouton du son hors des affichages, pas de défilement',
      dans(bh, 0, 0, l / 2, h) and dans(bb, l / 2, 0, l, h) and bh[1] < h / 4 and bb[1] < h / 4 and dans(bc, 0, 0, l, h) and bc[0] < l / 2 < bc[2] and bc[1] < h / 4 and bc[2] - bc[0] < l / 4 and not croise(bc, bh) and not croise(bc, bb) and son is not None and not croise(son, bh) and not croise(son, bb)
      and sep is not None and abs((sep[0] + sep[2]) / 2 - l / 2) < 2 and sep[3] - sep[1] > h - 4 and pas_de_defilement(hud['defile']), str([bh, bb, bc, sep, son, hud['defile']]))
    pg.wait_for_timeout(300)
    if 'technique' not in page: pg.screenshot(path=os.path.join(CAPTURES, 'deux-joueurs.png' if l == 1280 else 'deux-joueurs-960.png'))
    # la mesure : la même scène dessinée deux fois (écran partagé) contre une fois (une seule vue), 2 s chacune, la boucle tournant
    def mesure():
        n0 = pg.evaluate('() => window.__images'); pg.wait_for_timeout(2000); n1 = pg.evaluate('() => window.__images')
        return [round((n1 - n0) / 2), pg.evaluate('() => SCENE3D.trianglesDessines'), pg.evaluate('() => SCENE3D.appelsDessin')]
    pg.evaluate('() => { JEU.ecran = "pause"; }')   # la physique s'arrête, l'image continue : la mesure compare le dessin seul
    deux = mesure()
    pg.evaluate('() => { window.__deux = JEU.deux; JEU.deux = null; SCENE3D.partager(false); }'); pg.wait_for_timeout(300); seule = mesure()   # (sans JEU.deux, la boucle ne rallume pas le partage)
    pg.evaluate('() => { JEU.deux = window.__deux; SCENE3D.partager(true); JEU.ecran = "course"; }')
    circuit = 'technique' if 'technique' in page else 'test'
    L.append(f'  (2 joueurs + 5 IA sur {circuit}, {l}×{h}, swiftshader : écran partagé {deux[0]} i/s, {deux[1]} triangles, {deux[2]} appels ; une seule vue {seule[0]} i/s, {seule[1]} triangles, {seule[2]} appels)')
    t(f'{titre} : l’écran partagé dessine la scène deux fois : plus d’appels de dessin et plus de triangles qu’une seule vue (environ le double : chaque caméra voit sa part du circuit), moins du triple', deux[2] > seule[2] and deux[1] > seule[1] and deux[1] < 3 * seule[1] and deux[2] < 3 * seule[2], str([deux, seule]))
    if l == 1280 and circuit == 'test':
        pg.evaluate('() => BOUCLE.arreter()'); pg.evaluate('() => BOUCLE.simuler(260)'); pg.evaluate('() => BOUCLE.demarrer()')
        t(f'{titre} : la course finit : les 7 voitures arrivent, le podium vient (une seule vue), les 7 classées', attendre(pg, '() => JEU.ecran === "podium" && !SCENE3D.partage && JEU.plateau.pilotes.every(p => p.arrivee !== null) && JEU.final && JEU.final.length === 7', None, 60000),
          str(pg.evaluate('() => [JEU.ecran, SCENE3D.partage, JEU.plateau.pilotes.map(p => p.arrivee)]')))
        sauve = pg.evaluate('() => { const d = JSON.parse(localStorage.getItem(SAUVEGARDE.CLE) || "{}"); return { championnat: d.championnat || null, records: Object.keys(d.records || {}).length, reaction: d.reaction === undefined ? null : d.reaction }; }')
        t(f'{titre} : la sauvegarde de la carrière n’a pas bougé (ni championnat, ni record, ni temps de réaction)', sauve['championnat'] is None and sauve['records'] == 0 and sauve['reaction'] is None, str(sauve))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'deux-podium.png'))

# le mode 2 joueurs, les écrans autour (tour 25b, ordre 3) : « Entre amis » ouvre le petit menu (l'écran partagé ; le tournoi « bientôt »),
# l'écran avant la course (nom, couleur, casque de chaque joueur ; circuit, tours, IA, niveau), refuse deux noms ou deux couleurs pareils,
# écrit les réglages à part de la carrière et ouvre la course à deux ; les robots la finissent ; le podium met les deux joueurs en valeur ;
# la rivalité (« Léo 1 – 0 Sarah ») ; « Revanche » : un commercialBreak (faux SDK) puis la même course, grille retirée ; « Menu » : un
# commercialBreak puis le menu ; jamais de commercialBreak pendant une course ; la carrière n'a pas bougé
def JEU_PODIUM(pg): return attendre(pg, '() => JEU.ecran === "podium" && JEU.final && JEU.final.length === 5', None, 60000)
def amis(pg, titre, l, h):
    J = '() => window.APPELS_SDK.join(",")'
    def boite(sel):
        return pg.evaluate('s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', sel)
    def tient(ids):   # chaque élément est dans l'image, sans défilement
        b = [boite(s) for s in ids]
        d = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
        return all(x is not None and x[0] >= -1 and x[1] >= -1 and x[2] <= l + 1 and x[3] <= h + 1 and x[2] > x[0] for x in b) and pas_de_defilement(d), str([b, d])
    pg.click('#boutonAmis')
    t(f'{titre} : « Entre amis » (titre) ouvre le petit menu : « Écran partagé (2 joueurs) », « Tournoi chrono (2 à 8 joueurs) » (ouvert depuis le tour 26b), « Retour »',
      pg.evaluate('() => JEU.ecran === "amis" && !document.getElementById("amis").classList.contains("cache") && document.getElementById("boutonAmisDeux").textContent === texte("amisDeux") && !document.getElementById("boutonAmisTournoi").disabled && document.getElementById("boutonAmisTournoi").textContent === texte("amisTournoi")'),
      str(pg.evaluate('() => JEU.ecran')))
    ok_, det = tient(['#amisTitre', '#boutonAmisDeux', '#boutonAmisTournoi', '#boutonAmisRetour'])
    t(f'{titre} : le menu tient en {l}×{h}', ok_, det)
    if l == 1280: pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'entre-amis.png'))
    pg.click('#boutonAmisDeux')
    reg = pg.evaluate('() => ({ ecran: JEU.ecran, n1: document.getElementById("deuxNom1").value, p1: document.getElementById("deuxNom1").placeholder, c: [1, 2].map(i => Number(document.getElementById("deuxCouleurs" + i).dataset.couleur)), pastilles: document.querySelectorAll("#deuxCouleurs1 button").length, circuits: [...document.getElementById("deuxCircuit").options].map(o => o.value), tours: [...document.getElementById("deuxTours").options].map(o => o.value), ia: [...document.getElementById("deuxIA").options].map(o => o.value), niveaux: document.getElementById("deuxNiveau").options.length, motifs: document.getElementById("deuxMotif1").options.length, bloques: document.querySelectorAll("#deuxMotif1 option:disabled").length, icones: document.querySelectorAll(".deuxIcone canvas").length })')
    t(f'{titre} : l’écran avant la course : nom (vide, « Joueur 1 » en attente), couleur (le bleu et le rouge d’abord), casque (tous les motifs, son icône) de chaque joueur ; circuits, 3/5 tours, 0/3/5 IA, 4 niveaux',
      reg['ecran'] == 'deuxReglages' and reg['n1'] == '' and reg['p1'] in ('Joueur 1', 'Player 1') and reg['c'] == [0x1f6fe0, 0xd8262e] and reg['pastilles'] == 8 and reg['circuits'] == ['test', 'technique'] and reg['tours'] == ['3', '5'] and reg['ia'] == ['0', '3', '5'] and reg['niveaux'] == 4 and reg['motifs'] == 11 and reg['bloques'] == 5 and reg['icones'] == 2, str(reg))
    ok_, det = tient(['#deuxTitre', '#deuxJoueur1', '#deuxJoueur2', '#deuxCourse', '#boutonDeuxPartir', '#boutonDeuxRetour'])
    t(f'{titre} : l’écran avant la course tient en {l}×{h} (les deux joueurs côte à côte, rien ne déborde)', ok_, det)
    if l == 960:
        pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'deux-reglages-960.png'))
        pg.click('#boutonDeuxRetour'); pg.click('#boutonAmisRetour')
        t(f'{titre} : « Retour » revient au menu, puis au titre', pg.evaluate('() => JEU.ecran === "titre"'), str(pg.evaluate('() => JEU.ecran')))
        return
    # deux noms pareils, puis deux couleurs pareilles : refusés, la page reste
    pg.fill('#deuxNom1', 'Léo'); pg.fill('#deuxNom2', ' léo ')
    pg.click('#boutonDeuxPartir')
    t(f'{titre} : deux noms pareils (majuscules et espaces comptés pareil) sont refusés', pg.evaluate('() => JEU.ecran === "deuxReglages" && document.getElementById("deuxErreur").textContent === texte("deuxErreurNom") && SAUVEGARDE.deux() === null'), str(pg.evaluate('() => [JEU.ecran, document.getElementById("deuxErreur").textContent]')))
    pg.fill('#deuxNom2', 'Sarah'); pg.click('#deuxCouleurs2 button:nth-child(1)')
    pg.click('#boutonDeuxPartir')
    t(f'{titre} : deux couleurs pareilles sont refusées', pg.evaluate('() => JEU.ecran === "deuxReglages" && document.getElementById("deuxErreur").textContent === texte("deuxErreurCouleur") && SAUVEGARDE.deux() === null'), str(pg.evaluate('() => [JEU.ecran, document.getElementById("deuxErreur").textContent]')))
    pg.click('#deuxCouleurs2 button:nth-child(4)')   # le vert
    pg.select_option('#deuxMotif2', 'damier'); pg.select_option('#deuxIA', '3'); pg.select_option('#deuxTours', '3'); pg.select_option('#deuxNiveau', 'debutant'); pg.select_option('#deuxCircuit', 'test')
    t(f'{titre} : deux couleurs différentes : le message d’erreur disparaît dès le nouveau choix', pg.evaluate('() => document.getElementById("deuxErreur").textContent === ""'), pg.evaluate('() => document.getElementById("deuxErreur").textContent'))
    rb = pg.evaluate('() => { const b = document.getElementById("boutonDeuxRetour").getBoundingClientRect(), p = document.getElementById("boutonDeuxPartir").getBoundingClientRect(); return [b.top + b.height / 2, p.top + p.height / 2, b.height, p.height]; }')
    t(f'{titre} : le petit bouton « Retour » est centré sur la ligne de « C’est parti ! », pas étiré', abs(rb[0] - rb[1]) < 2 and rb[2] < rb[3], str(rb))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'deux-reglages.png'))
    carriere = pg.evaluate('() => localStorage.getItem(SAUVEGARDE.CLE) && JSON.stringify(JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat)')
    with pg.expect_navigation(): pg.click('#boutonDeuxPartir')
    t(f'{titre} : « C’est parti ! » écrit les réglages (à part de la carrière) et ouvre la course à deux : les noms, les couleurs, les casques, 3 IA, 3 tours, débutant',
      attendre(pg, '''() => typeof JEU !== "undefined" && JEU.deux && JEU.plateau && JEU.ecran === "course" && JEU.plateau.pilotes.length === 5 && JEU.course.nbTours === 3 && REGLAGES.NIVEAU === "debutant" && NOM_CIRCUIT === "test"
        && JEU.deux.reglages.joueurs.map(j => j.nom).join() === "Léo,Sarah" && JEU.couleurs[3] === 0x1f6fe0 && JEU.couleurs[4] === 0x2fa84f && casqueDe(4).motif === "damier" && SAUVEGARDE.deux().joueurs[1].couleur === 0x2fa84f''', None, 30000),
      str(pg.evaluate('() => typeof JEU === "undefined" ? null : [JEU.ecran, JEU.deux && JEU.deux.reglages, JEU.couleurs, REGLAGES.NIVEAU]')))
    t(f'{titre} : la carte arrive, la grille est tirée', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.grille', None, 120000))
    pg.evaluate('() => { JEU.robot = true; }')
    def finir():
        pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(260); BOUCLE.demarrer(); }')
        return attendre(pg, '() => JEU.ecran === "podium" && JEU.final && JEU.final.length === 5', None, 60000)
    sous_course = pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(20); BOUCLE.demarrer(); return [JEU.ecran, window.APPELS_SDK.join(",")]; }')
    pg.wait_for_timeout(300)
    hud = pg.evaluate('() => [...document.querySelectorAll(".deuxNom")].map(s => s.textContent)')
    t(f'{titre} : chaque moitié affiche le nom de son joueur', hud == ['🔵 Léo', '🔴 Sarah'], str(hud))
    t(f'{titre} : la course finit, le podium vient', finir(), str(pg.evaluate('() => [JEU.ecran, JEU.final && JEU.final.length]')))
    pod = pg.evaluate('''() => { const [a, b] = DEUX_JOUEURS.joueurs(JEU.plateau), P = JEU.plateau.pilotes, pl = p => JEU.final.find(x => x.k === P.indexOf(p)).place;
      return { places: [pl(a), pl(b)], texte: document.getElementById("podiumDeux").textContent, cache: document.getElementById("podiumDeux").classList.contains("cache"),
        marches: [...document.querySelectorAll("#podiumMarches .marche")].map(m => m.className + " " + m.querySelector("strong").textContent), riv: SAUVEGARDE.deux().rivalite }; }''')
    marques = [m for m in pod['marches'] if 'joueur' in m]
    attendues = sum(1 for p in pod['places'] if p <= 3)
    t(f'{titre} : le podium met les deux joueurs en valeur : leur place à tous les deux (même hors du podium), et sur les marches leur nom et leur couleur',
      not pod['cache'] and 'Léo' in pod['texte'] and 'Sarah' in pod['texte'] and f'P{pod["places"][0]}' in pod['texte'] and f'P{pod["places"][1]}' in pod['texte'] and len(marques) == attendues and all(('Léo' in m) if 'joueur1' in m else ('Sarah' in m) for m in marques), str(pod))
    g = 0 if pod['places'][0] < pod['places'][1] else 1
    t(f'{titre} : la rivalité est comptée une fois et sauvegardée : 1 point à celui qui a fini devant', pod['riv'] == {'noms': ['Léo', 'Sarah'], 'score': [1 - g, g]}, str(pod))
    pg.click('#boutonResultats')
    res = pg.evaluate('() => ({ ecran: JEU.ecran, riv: document.getElementById("resultatsRivalite").textContent, cache: document.getElementById("resultatsRivalite").classList.contains("cache"), moi: [...document.querySelectorAll("#resultatsLignes tr.moi")].map(tr => tr.children[1].textContent.trim()), boutons: [document.getElementById("boutonRejouerResultats").textContent, document.getElementById("boutonChangerResultats").textContent] })')
    t(f'{titre} : les résultats : les deux joueurs marqués par leur nom, le score de la rivalité (« Léo {1 - g} – {g} Sarah »), « Revanche » et « Menu »',
      res['ecran'] == 'resultats' and not res['cache'] and res['riv'].endswith(f'Léo {1 - g} – {g} Sarah') and sorted(res['moi']) == ['Léo', 'Sarah'] and res['boutons'] == [pg.evaluate('() => texte("revanche")'), pg.evaluate('() => texte("menuAmis")')], str(res))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'rivalite.png'))
    appels = pg.evaluate(J)
    t(f'{titre} : Poki : gameplayStart à la course, gameplayStop au podium, aucun commercialBreak avant le clic', 'commercialBreak' not in appels and appels.endswith('gameplayStart,gameplayStop') and ',gameplayStart,gameplayStart' not in appels and ',gameplayStop,gameplayStop' not in appels, appels)
    grille1 = pg.evaluate('() => [JEU.plateau.graine, JEU.plateau.grille.map(x => x.numero).join()]')
    pg.click('#boutonRejouerResultats')
    t(f'{titre} : « Revanche » : un commercialBreak (le jeu arrêté avant), puis la même course (mêmes joueurs, 3 IA, 3 tours) avec une autre graine de grille',
      attendre(pg, '() => JEU.ecran === "course" && JEU.course.etat === "compte" && JEU.final === null', None, 10000) and pg.evaluate(J) == appels + ',commercialBreak'
      and pg.evaluate(f'() => JEU.plateau.pilotes.length === 5 && JEU.course.nbTours === 3 && JEU.plateau.graine !== {grille1[0]} && JEU.deux.revanche === 1'), str([grille1, pg.evaluate('() => [JEU.ecran, JEU.plateau.graine, JEU.plateau.grille && JEU.plateau.grille.map(x => x.numero).join()]'), pg.evaluate(J)]))
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(20); BOUCLE.demarrer(); }')
    t(f'{titre} : pendant la revanche, pas de pub : gameplayStart aux feux éteints', attendre(pg, '() => JEU.ecran === "course" && window.APPELS_SDK.slice(-1)[0] === "gameplayStart"', None, 10000) and pg.evaluate(J).count('commercialBreak') == 1, pg.evaluate(J))
    # la revanche : les deux joueurs finissent, puis « passer » : le reste de la course en accéléré (les deux ont fini : c'est permis)
    # (les deux joueurs « finissent » 15 s après le départ, on leur donne leurs tours : les IA ont encore la course à faire)
    pg.evaluate('''() => { BOUCLE.arreter(); let n = 0; while (!(JEU.course.etat === "course" && JEU.plateau.temps > 15) && n++ < 200 * 120) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE);
      for (const p of DEUX_JOUEURS.joueurs(JEU.plateau)) { const c = p.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; } BOUCLE.demarrer(); }''')
    attendre(pg, '() => !!JEU.attente', None, 20000)
    attente = pg.evaluate('() => [!!JEU.attente, DEUX_JOUEURS.finie(JEU.plateau), ARRIVEE.restantes(JEU.plateau)]')
    if attente[0] and pg.evaluate('() => JEU.ecran === "course"'): pg.click('#boutonPasser')
    # (3 tours d'IA restent, bien plus que les 90 s d'ARRIVEE_ATTENTE_MAX : en accéléré, le podium attend qu'elles aient toutes vraiment fini)
    t(f'{titre} : à deux, l’attente vient quand les deux joueurs ont fini, et « passer » joue la suite en accéléré : au podium, toutes les IA sont vraiment arrivées (même au-delà des 90 s)', attente[0] and attente[1] and attente[2] > 0 and attendre(pg, '() => JEU.ecran === "podium" && JEU.final && JEU.final.length === 5 && JEU.plateau.pilotes.every(p => p.arrivee !== null)', None, 120000),
      str([attente, pg.evaluate('() => [JEU.ecran, JEU.plateau.temps, JEU.plateau.pilotes.map(p => p.arrivee)]')]))
    t(f'{titre} : la revanche finit, la rivalité s’additionne (2 courses comptées)', JEU_PODIUM(pg) and sum(pg.evaluate('() => SAUVEGARDE.deux().rivalite.score')) == 2, str(pg.evaluate('() => SAUVEGARDE.deux()')))
    pg.click('#boutonResultats')
    with pg.expect_navigation(): pg.click('#boutonChangerResultats')
    t(f'{titre} : « Menu » : un commercialBreak, puis le menu « Entre amis » (la page nue, ?menu=amis)', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "amis"', None, 30000), str(pg.evaluate('() => typeof JEU === "undefined" ? null : JEU.ecran')))
    pg.click('#boutonAmisDeux')
    gardes = pg.evaluate('() => [document.getElementById("deuxNom1").value, document.getElementById("deuxNom2").value, document.getElementById("deuxCouleurs2").dataset.couleur, document.getElementById("deuxMotif2").value, document.getElementById("deuxIA").value, document.getElementById("deuxNiveau").value, SAUVEGARDE.deux().rivalite.score.reduce((a, b) => a + b)]')
    t(f'{titre} : les derniers choix sont gardés pour la fois suivante (noms, couleur, casque, IA, niveau) avec la rivalité', gardes == ['Léo', 'Sarah', str(0x2fa84f), 'damier', '3', 'debutant', 2], str(gardes))
    apres = pg.evaluate('() => localStorage.getItem(SAUVEGARDE.CLE) && JSON.stringify(JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat)')
    t(f'{titre} : la carrière n’a pas bougé (le monde du championnat créé au premier lancement est le même)', carriere is not None and apres == carriere, str([carriere and carriere[:80], apres and apres[:80]]))

# « passer » la vue télé finit la course en accéléré (décision du propriétaire, 2026-10-24, CLAUDE.md « La course ») : le reste de la course
# est vraiment joué (×ARRIVEE_ACCELERE, les mêmes pas de physique), le podium vient avec toutes les voitures arrivées ; la même course
# regardée jusqu'au bout (après un rechargement, même graine) donne les mêmes places, les mêmes temps et les mêmes pénalités, au bit près.
# En championnat : l'interview et la une suivent normalement
def accelere(pg, titre, page):
    champ = 'championnat=1' in page
    FINAL = '() => JEU.final.map(x => [x.k, x.place, x.total, x.penalites, JEU.plateau.pilotes[x.k].arrivee])'
    def jusqua_arrivee():
        if champ: pg.click('#boutonCourseSuivante')
        passer_qualif(pg, titre)
        attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
        # le joueur « finit » au même pas de physique dans les deux courses (15 s après le départ, la boucle arrêtée : on lui donne ses
        # tours, comme course_joueur) ; les IA ont encore toute la course à faire ; l'attente commence à l'image suivante
        pg.evaluate('''() => { BOUCLE.arreter(); let n = 0; while (!(JEU.course.etat === "course" && JEU.plateau.temps > 15) && n++ < 200 * 120) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE);
          const c = JEU.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; BOUCLE.demarrer(); }''')
        attendre(pg, '() => !!JEU.attente', None, 20000)
        return pg.evaluate('() => !!JEU.attente && JEU.ecran === "course" && JEU.plateau.pilotes.some(p => p.arrivee === null)')
    pret = jusqua_arrivee()
    t(f'{titre} : le joueur (robot) a fini, des voitures sont encore en course, le bandeau d’attente', pret, str(pg.evaluate('() => [JEU.ecran, !!JEU.attente, JEU.plateau && JEU.plateau.pilotes.map(p => p.arrivee)]')))
    if not pret: return
    restantes = pg.evaluate('() => ARRIVEE.restantes(JEU.plateau)')
    t0 = time.monotonic()
    pg.click('#boutonPasser')
    vu = attendre(pg, '() => JEU.ecran === "podium" || /⏩/.test(document.getElementById("attenteTexte").textContent)', None, 10000)
    texte_ = pg.evaluate('() => [document.getElementById("attenteTexte").textContent, document.getElementById("boutonPasser").classList.contains("cache")]')
    fini = attendre(pg, '() => JEU.ecran === "podium"', None, 180000)
    duree = time.monotonic() - t0
    etat = pg.evaluate('() => ({ arrivees: JEU.plateau.pilotes.every(p => p.arrivee !== null), nb: JEU.final && JEU.final.length, n: JEU.plateau.pilotes.length, temps: JEU.plateau.temps })')
    t(f'{titre} : « passer » : « ⏩ » et les voitures restantes à l’écran, puis le podium avec TOUTES les voitures arrivées (classées par leur vraie arrivée)', vu and fini and etat['arrivees'] and etat['nb'] == etat['n'], str([texte_, etat]))
    L.append(f"  (« passer » en accéléré : {restantes} voitures encore en course, podium {duree:.1f} s réelles après le clic ; course finie à {etat['temps']:.1f} s de course)")
    a = pg.evaluate(FINAL)
    if champ:
        pg.click('#boutonResultats'); attendre(pg, '() => JEU.ecran === "resultats"')
        pg.click('#boutonChangerResultats')
        t(f'{titre} : en championnat, après « passer » : les résultats, puis l’interview et la une du journal, comme d’habitude', attendre(pg, '() => JEU.ecran === "interview"', None, 10000) and (pg.click('#boutonPasCommentaire') or True) and attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => JEU.championnat.prochain === 1'), str(pg.evaluate('() => [JEU.ecran, JEU.championnat.prochain]')))
        # l'annonce d'un motif de casque gagné (tour 31) : au paddock, une seule fois
        pg.evaluate('() => { SAUVEGARDE.prendreAnnonceMotifs(); SAUVEGARDE.debloquerMotifs(["couronne"]); }')
        pg.evaluate('() => passerUne()')
        a1 = pg.evaluate('() => [JEU.ecran, document.getElementById("annonceMotif").classList.contains("cache"), document.getElementById("annonceMotif").textContent, document.querySelectorAll("#annonceMotif canvas").length]')
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'motif-gagne.png'))
        pg.click('#annonceMotif')
        ferme = pg.evaluate('() => document.getElementById("annonceMotif").classList.contains("cache")')
        pg.evaluate('() => montrerChampionnat(null)')
        a2 = pg.evaluate('() => document.getElementById("annonceMotif").classList.contains("cache")')
        t(f'{titre} : un motif gagné est annoncé au paddock (« Nouveau motif de casque : Couronne ! », son dessin), un clic la ferme, et la fois suivante plus rien (une seule fois)',
          a1[0] == 'championnat' and not a1[1] and 'Couronne' in a1[2] and a1[3] == 1 and ferme and a2, str([a1, ferme, a2]))
        return
    # la même course, regardée jusqu'au bout (sans passer) : rechargée, même graine
    pg.reload(); pg.wait_for_timeout(1500)
    jusqua_arrivee()
    for _ in range(400):
        if pg.evaluate('() => JEU.ecran === "podium"'): break
        pg.evaluate('() => BOUCLE.simuler(2)'); pg.wait_for_timeout(20)
    b = pg.evaluate('() => JEU.ecran === "podium" ? (' + FINAL[6:] + ') : null')
    t(f'{titre} : la même course regardée jusqu’au bout donne les mêmes places, les mêmes temps et les mêmes pénalités, au bit près', b is not None and a == b, str([a, b])[:800])

# le tournoi chrono entre copains (tournoi.js, CLAUDE.md « Le tournoi chrono entre copains ») : l'inscription (2 à 8, prénoms différents),
# « À toi, Léo ! » et 3 s, le tour de qualification (le robot), le fantôme du leader du moment (absent pour le premier), un abandon
# (pas de temps), le classement de la manche et le général, 3 manches (la page de chaque manche), l'ordre inverse du classement, le
# podium 3D, le classement final, « Rejouer » ; Poki : commercialBreak entre deux manches et à la fin, jamais entre deux joueurs
def tournoi(pg, titre, l, h):
    J = '() => window.APPELS_SDK.join(",")'
    PUBS = '() => +sessionStorage.getItem("pubs") || 0'
    def boite(sel):
        return pg.evaluate('s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', sel)
    pg.click('#boutonAmis')
    t(f'{titre} : « Tournoi chrono » est ouvert dans le menu « Entre amis »', pg.evaluate('() => !document.getElementById("boutonAmisTournoi").disabled && document.getElementById("boutonAmisTournoi").textContent === texte("amisTournoi")'))
    pg.click('#boutonAmisTournoi')
    ins = pg.evaluate('() => ({ ecran: JEU.ecran, n: document.querySelectorAll("#tournoiListe li").length, formule: document.getElementById("tournoiInscription").dataset.formule, icones: document.querySelectorAll("#tournoiListe .tournoiIcone canvas").length, circuits: [0, 1, 2].map(m => document.getElementById("tournoiCircuit" + m).value) })')
    t(f'{titre} : l’inscription : 3 joueurs proposés (prénom, casque et son icône), la formule 🏆 Tournoi, 3 circuits au hasard', ins == {'ecran': 'tournoiInscription', 'n': 3, 'formule': 'tournoi', 'icones': 3, 'circuits': ['', '', '']}, str(ins))
    carriere = pg.evaluate('() => JSON.stringify([JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat, JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).fantomes])')
    if l == 960:
        for _ in range(5): pg.click('#boutonTournoiAjouter')   # (3 proposés + 5 = 8)
        n = pg.evaluate('() => [document.querySelectorAll("#tournoiListe li").length, document.getElementById("boutonTournoiAjouter").disabled]')
        b = [boite(s) for s in ['#tournoiTitre', '#tournoiListe', '#tournoiFormules', '#tournoiCircuits', '#boutonTournoiPartir']]
        d = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
        t(f'{titre} : 8 joueurs au plus (le bouton + grisé), et l’inscription de 8 tient en 960×600 sans défilement', n == [8, True] and all(x[1] >= -1 and x[3] <= h + 1 and x[0] >= -1 and x[2] <= l + 1 for x in b) and pas_de_defilement(d), str([n, b, d]))
        pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'tournoi-inscription-960.png'))
        return
    # jamais 1 joueur : à 2, le ✕ est grisé ; deux prénoms pareils refusés
    pg.click('#tournoiListe li:nth-child(3) .tournoiEnlever')
    t(f'{titre} : à 2 joueurs, on ne peut plus en enlever (jamais 1)', pg.evaluate('() => document.querySelectorAll("#tournoiListe li").length === 2 && [...document.querySelectorAll("#tournoiListe .tournoiEnlever")].every(b => b.disabled)'))
    pg.click('#boutonTournoiAjouter')
    pg.fill('#tournoiListe li:nth-child(1) .tournoiPrenom', 'Léo'); pg.fill('#tournoiListe li:nth-child(2) .tournoiPrenom', 'Sarah'); pg.fill('#tournoiListe li:nth-child(3) .tournoiPrenom', 'sarah')
    pg.click('#boutonTournoiPartir')
    t(f'{titre} : deux prénoms pareils sont refusés', pg.evaluate('() => JEU.ecran === "tournoiInscription" && document.getElementById("tournoiErreur").textContent === texte("tournoiErreurPrenom")'), pg.evaluate('() => document.getElementById("tournoiErreur").textContent'))
    pg.fill('#tournoiListe li:nth-child(3) .tournoiPrenom', 'Tom')
    pg.select_option('#tournoiListe li:nth-child(3) .tournoiMotif', 'eclair')
    with pg.expect_navigation(): pg.click('#boutonTournoiPartir')
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.tournoi', None, 30000)
    t0 = pg.evaluate('() => ({ ecran: JEU.ecran, joueurs: JEU.tournoi.joueurs.map(j => j.prenom), circuits: JEU.tournoi.circuits, circuit: NOM_CIRCUIT, ia: JEU.plateau, titre: document.getElementById("atoiTitre").textContent, motif: JEU.tournoi.joueurs[2].casque.motif, liste: SAUVEGARDE.tournoi().joueurs.map(j => j.prenom) })')
    t(f'{titre} : « C’est parti ! » : la page de la manche 1 (son circuit, seul sur la piste), « À toi, Léo ! », la liste gardée',
      t0['ecran'] == 'tournoiAToi' and t0['joueurs'] == ['Léo', 'Sarah', 'Tom'] and len(t0['circuits']) == 3 and t0['circuit'] == t0['circuits'][0] and t0['ia'] is None and t0['titre'] in ('À toi, Léo !', 'Your turn, Léo!') and t0['motif'] == 'eclair' and t0['liste'] == ['Léo', 'Sarah', 'Tom'], str(t0))
    def passage(abandon=False):
        pg.evaluate('() => { JEU.robot = true; }')
        attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "tour"', None, 15000)
        etat = pg.evaluate('() => ({ j: TOURNOI.joueurActuel(JEU.tournoi), fantome: !!(JEU.fantome && JEU.fantome.rejeu), leader: TOURNOI.leader(JEU.tournoi, JEU.tournoi.manche), sdk: window.APPELS_SDK.slice(-1)[0] })')
        if abandon:
            pg.evaluate('() => BOUCLE.simuler(5)'); pg.wait_for_timeout(100)
            pg.keyboard.press('Escape')
            attendre(pg, '() => JEU.ecran === "tournoiPause"', None, 5000)
            pg.click('#boutonTournoiAbandon')
        else:
            for _ in range(200):
                if pg.evaluate('() => JEU.ecran === "tournoiManche"'): break
                pg.evaluate('() => BOUCLE.simuler(2)'); pg.wait_for_timeout(30)
        attendre(pg, '() => JEU.ecran === "tournoiManche"', None, 10000)
        etat['phrase'] = pg.evaluate('() => document.getElementById("tournoiPhrase").textContent')
        etat['lignes'] = pg.evaluate('() => [...document.querySelectorAll("#tournoiMancheListe li")].map(li => li.textContent)')
        etat['nouveau'] = pg.evaluate('() => (document.querySelector("#tournoiMancheListe li.nouveau") || { textContent: "" }).textContent')
        return etat
    vus = []
    for m in range(3):
        if m:
            pubs = pg.evaluate(PUBS)
            with pg.expect_navigation(): pg.click('#boutonTournoiSuite')
            attendre(pg, '() => typeof JEU !== "undefined" && JEU.tournoi && JEU.ecran === "tournoiAToi"', None, 30000)
            t(f'{titre} : manche {m + 1} : une pub entre deux manches (une seule), puis la page de la manche (son circuit) ; l’ordre de passage = l’inverse du classement général',
              pg.evaluate(PUBS) == pubs + 1 and pg.evaluate(f'() => JEU.tournoi.manche === {m} && NOM_CIRCUIT === JEU.tournoi.circuits[{m}] && TOURNOI.joueurActuel(JEU.tournoi) === TOURNOI.ordre(JEU.tournoi, {m})[0] && TOURNOI.ordre(JEU.tournoi, {m}).join() === TOURNOI.classementGeneral({{ ...JEU.tournoi, passages: JEU.tournoi.passages.slice(0, {m}) }}).map(x => x.j).reverse().join()'),
              str([pg.evaluate(J), pg.evaluate('() => [JEU.tournoi.manche, TOURNOI.ordre(JEU.tournoi, JEU.tournoi.manche)]')]))
        for k in range(3):
            pubs = pg.evaluate(PUBS)
            e = passage(abandon=(m == 0 and k == 2))
            vus.append(e)
            t(f'{titre} : manche {m + 1}, passage {k + 1} : le fantôme du leader du moment ({"aucun pour le premier" if k == 0 else "présent"}), gameplayStart pendant le tour, le classement s’anime (le nouveau temps marqué), aucune pub entre deux joueurs',
              e['fantome'] == (k > 0) and (e['leader'] is None) == (k == 0) and e['sdk'] == 'gameplayStart' and e['nouveau'] != '' and pg.evaluate(PUBS) == pubs, str(e))
            if k < 2 or m == 2:
                if k < 2: pg.click('#boutonTournoiSuite')
            if m == 0 and k == 2:
                t(f'{titre} : l’abandon donne « pas de temps », dernier de la manche', 'pas de temps' in e['lignes'][-1] or 'no time' in e['lignes'][-1], str(e['lignes']))
                gen = pg.evaluate('() => [!document.getElementById("tournoiGeneral").classList.contains("cache"), [...document.querySelectorAll("#tournoiGeneralListe li")].map(li => li.textContent)]')
                t(f'{titre} : à la fin de la manche, le classement général avec les points', gen[0] and len(gen[1]) == 3 and all('pts' in x for x in gen[1]), str(gen))
                pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(CAPTURES, 'tournoi.png'))
    t(f'{titre} : la phrase du premier passage : « Léo prend la tête ! »', vus[0]['phrase'] in ('Léo prend la tête !', 'Léo takes the lead!'), vus[0]['phrase'])
    pg.click('#boutonTournoiSuite')
    attendre(pg, '() => JEU.ecran === "podium"', None, 10000)
    pod = pg.evaluate('() => ({ ecran: JEU.ecran, marches: [...document.querySelectorAll("#podiumMarches .marche strong")].map(s => s.textContent), visibles: JEU.tournoiPodium.filter(m => m.groupe.visible).length, attendu: TOURNOI.podium(JEU.tournoi).map(x => JEU.tournoi.joueurs[x.j].prenom) })')
    t(f'{titre} : le podium 3D des trois premiers (leurs casques, leurs prénoms)', pod['ecran'] == 'podium' and pod['visibles'] == 3 and len(pod['marches']) == 3 and all(any(p in m for m in pod['marches']) for p in pod['attendu']), str(pod))
    pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(CAPTURES, 'tournoi-podium.png'))
    pg.click('#boutonResultats')
    fin = pg.evaluate('() => ({ ecran: JEU.ecran, lignes: [...document.querySelectorAll("#tournoiFinListe li")].map(li => li.textContent), attendu: TOURNOI.classementGeneral(JEU.tournoi).map(x => JEU.tournoi.joueurs[x.j].prenom) })')
    t(f'{titre} : le classement final (les points), puis « Rejouer » et « Nouveaux joueurs »', fin['ecran'] == 'tournoiFin' and len(fin['lignes']) == 3 and all(fin['lignes'][i].strip().startswith(fin['attendu'][i]) for i in range(3)), str(fin))
    pubs = pg.evaluate(PUBS)
    t(f'{titre} : en tout, une pub entre chaque manche (2), aucune entre deux joueurs', pubs == 2, str(pubs))
    apres = pg.evaluate('() => JSON.stringify([JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat, JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).fantomes])')
    t(f'{titre} : la carrière n’a pas bougé (championnat, fantômes de carrière)', apres == carriere, str([carriere[:80], apres[:80]]))
    with pg.expect_navigation(): pg.click('#boutonTournoiRejouer')
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.tournoi && JEU.ecran === "tournoiAToi"', None, 30000)
    t(f'{titre} : « Rejouer » : une pub, puis un nouveau tournoi avec les mêmes joueurs et la même formule (manche 1, Léo d’abord)', pg.evaluate(PUBS) == 3 and pg.evaluate('() => JEU.tournoi.manche === 0 && JEU.tournoi.passages.every(p => !p.length) && JEU.tournoi.formule === "tournoi" && JEU.tournoi.joueurs.map(j => j.prenom).join() === "Léo,Sarah,Tom" && TOURNOI.joueurActuel(JEU.tournoi) === 0'), pg.evaluate(J))

# le volant en vue cockpit (CLAUDE.md « Le casque du pilote ») : il est là en vue cockpit (et seulement là), le rapport et la vitesse
# quittent l'interface HTML pour son écran ; en pixels, la moitié haute de l'image est exactement la même avec ou sans volant, la
# moitié basse change ; il tourne avec les roues avant (à droite : sens horaire) et revient au centre ; ses appels de dessin mesurés
def volant(pg, titre, l, h):
    t(f'{titre} : en vue cockpit, le volant est là, le rapport et la vitesse ne sont plus dans l’interface HTML (une seule fois : sur le volant)',
      attendre(pg, '() => CAMERA.mode === "cockpit" && JEU.volant && JEU.volant.groupe.visible && document.getElementById("tableau").classList.contains("cache") && JEU.volant.texte === rapportPourVitesse(JEU.joueur.u) + ":" + Math.round(Math.abs(JEU.joueur.u) * 3.6)', None, 20000),
      str(pg.evaluate('() => [CAMERA.mode, !!JEU.volant, JEU.volant && JEU.volant.texte, document.getElementById("tableau").className]')))
    attendre(pg, '() => JEU.course && (JEU.course.etat === "attente" || JEU.course.etat === "course")', None, 20000)
    # en pixels : la même image dessinée avec et sans volant (la boucle arrêtée) ; on compte les pixels qui changent, en haut et en bas
    PIX = '''(braq) => { BOUCLE.arreter(); JEU.joueur.braquage = braq; majVolant(); const c = SCENE3D.canvas, L = c.width, H = c.height, k = document.createElement('canvas'); k.width = L; k.height = H; const ctx = k.getContext('2d');
      const lire = () => { SCENE3D.dessiner(); ctx.clearRect(0, 0, L, H); ctx.drawImage(c, 0, 0); return ctx.getImageData(0, 0, L, H).data; };
      JEU.volant.groupe.visible = true; const a = lire(), appelsAvec = SCENE3D.appelsDessin; JEU.volant.groupe.visible = false; const b = lire(), appelsSans = SCENE3D.appelsDessin; JEU.volant.groupe.visible = true;
      let haut = 0, bas = 0, plusHaut = H; for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const i = (y * L + x) * 4; if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 6) { if (y < H / 2) haut++; else bas++; if (y < plusHaut) plusHaut = y; } }
      BOUCLE.demarrer(); return { haut, bas, plusHaut, H, appelsAvec, appelsSans }; }'''
    for braq in (0, 1):
        px = pg.evaluate(PIX, braq * 0.12)   # (volant au centre, puis tourné : il ne monte pas plus haut)
        t(f'{titre} : volant {"tourné" if braq else "au centre"} : aucun pixel du volant dans la moitié haute de l’image ({l}×{h}), la moitié basse le montre', px['haut'] == 0 and px['bas'] > 500 and px['plusHaut'] >= px['H'] / 2, str(px))
    L.append(f"  (le volant en vue cockpit, {l}×{h} : {px['appelsAvec'] - px['appelsSans']} appels de dessin en plus ; son plus haut pixel à {100 * px['plusHaut'] / px['H']:.0f} % de la hauteur)")
    t(f'{titre} : le volant coûte au plus 5 appels de dessin', 0 < px['appelsAvec'] - px['appelsSans'] <= 5, str(px))
    if l == 1280:
        # le sens : à droite (→), les roues braquent à droite et le volant tourne dans le sens horaire (angle < 0) ; lâché, il revient au centre
        pg.keyboard.down('ArrowUp'); pg.keyboard.down('ArrowRight')
        droite = attendre(pg, '() => JEU.joueur.braquage > 0.01 && Math.abs(JEU.volant.volant.rotation.z + JEU.joueur.braquage * REGLAGES.VOLANT_FACTEUR) < 1e-9', None, 10000)
        r1 = pg.evaluate('() => [JEU.joueur.braquage, JEU.volant.volant.rotation.z]')
        pg.keyboard.up('ArrowRight'); pg.keyboard.down('ArrowLeft')
        gauche = attendre(pg, '() => JEU.joueur.braquage < -0.01 && JEU.volant.volant.rotation.z > 0', None, 10000)
        pg.keyboard.up('ArrowLeft')
        centre = attendre(pg, '() => JEU.joueur.braquage === 0 && JEU.volant.volant.rotation.z === 0', None, 10000)
        pg.keyboard.up('ArrowUp')
        t(f'{titre} : le volant tourne dans le bon sens (à droite : sens horaire, à gauche : l’inverse, l’angle des roues × VOLANT_FACTEUR) et revient au centre', droite and r1[1] < 0 and gauche and centre, str([r1, pg.evaluate('() => [JEU.joueur.braquage, JEU.volant.volant.rotation.z]')]))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'cockpit.png' if l == 1280 else 'cockpit-960.png'))
    pg.keyboard.press('KeyC')
    t(f'{titre} : dans une autre vue (C), plus de volant, le rapport et la vitesse reviennent dans l’interface', attendre(pg, '() => CAMERA.mode !== "cockpit" && !JEU.volant.groupe.visible && !document.getElementById("tableau").classList.contains("cache")', None, 5000), str(pg.evaluate('() => [CAMERA.mode, JEU.volant.groupe.visible]')))

# le résumé vidéo de la course (resume.js, étape 13) : après une course (le robot), les résultats proposent « ▶ Résumé » ; la 3D
# rejoue les moments forts de l'enregistrement avec la caméra télé (les voitures aux positions de l'enregistrement, pas de la
# physique, qui ne bouge plus), un bandeau dit le moment ; rien n'est ajouté à la scène ; Échap ou un clic ramènent aux résultats
def resume_ecran(pg, titre, l, h):
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    for _ in range(300):
        if pg.evaluate('() => JEU.ecran === "podium"'): break
        if pg.evaluate('() => !!JEU.attente && !JEU.attente.passer && JEU.ecran === "course"'): pg.evaluate('() => passerAuPodium()')   # (le joueur a fini : la fin en accéléré)
        pg.evaluate('() => BOUCLE.simuler(2)'); pg.wait_for_timeout(30)
    t(f'{titre} : la course va jusqu’au podium', attendre(pg, '() => JEU.ecran === "podium"', None, 60000), str(pg.evaluate('() => JEU.ecran')))
    pg.click('#boutonResultats')
    objets = pg.evaluate('() => SCENE3D.nbObjets')
    t(f'{titre} : les résultats proposent « ▶ Résumé »', attendre(pg, '() => JEU.ecran === "resultats" && !document.getElementById("boutonResume").classList.contains("cache") && document.getElementById("boutonResume").textContent === texte("resume")', None, 5000))
    pg.click('#boutonResume')
    etat = pg.evaluate('''() => { BOUCLE.arreter(); majResume(1 / 30); const r = JEU.resume.r, pos = RESUME.positions(r, JEU.enregistreur.enr);
      const ecart = Math.max(...pos.map((p, k) => Math.hypot(JEU.modeles[k].groupe.position.x - p.x, JEU.modeles[k].groupe.position.z - p.z)));
      const pas = JEU.pas; BOUCLE.demarrer(); return { ecran: JEU.ecran, camera: CAMERA.mode, bandeau: document.getElementById("resumeMoment").textContent, ecart, visibles: JEU.modeles.filter(m => m.groupe.visible).length, n: JEU.modeles.length,
        plages: r.plages.length, duree: r.duree, max: REGLAGES.RESUME_DUREE_MAX, jeu: SDK.enJeu, pas, objets: SCENE3D.nbObjets }; }''')
    t(f'{titre} : le résumé : la caméra télé, un bandeau qui dit le moment, chaque voiture à sa position de l’enregistrement, la durée bornée, gameplayStop, rien d’ajouté à la scène',
      etat['ecran'] == 'resume' and etat['camera'] == 'tele' and etat['bandeau'] != '' and etat['ecart'] < 1e-6 and etat['visibles'] == etat['n'] and 0 < etat['duree'] <= etat['max'] and not etat['jeu'] and etat['objets'] == objets, str([etat, objets]))
    pg.wait_for_timeout(200)
    PHYS = '() => JEU.plateau.pilotes.map(p => [p.v.x, p.v.z, p.v.u].join()).join(";")'
    phys = pg.evaluate(PHYS); joue = pg.evaluate('() => JEU.resume.r.joue'); pg.wait_for_timeout(500)
    t(f'{titre} : pendant le résumé, les voitures de la physique ne bougent pas, le rejeu avance', pg.evaluate(PHYS) == phys and pg.evaluate('() => JEU.resume && JEU.resume.r.joue') > joue, str(pg.evaluate('() => JEU.resume && JEU.resume.r.joue')))
    pg.screenshot(path=os.path.join(CAPTURES, 'resume.png' if l == 1280 else 'resume-960.png'))
    b = pg.evaluate('() => { const e = document.getElementById("resumeBandeau").getBoundingClientRect(); return [e.left, e.top, e.right, e.bottom]; }')
    t(f'{titre} : le bandeau tient dans l’image ({l}×{h})', b[0] >= 0 and b[2] <= l and b[3] <= h and b[1] >= h / 2, str(b))
    pg.keyboard.press('Escape')
    t(f'{titre} : Échap ramène aux résultats, le podium revient derrière', attendre(pg, '() => JEU.ecran === "resultats" && !JEU.resume && CAMERA.mode !== "tele" && document.getElementById("resume").classList.contains("cache")', None, 5000), str(pg.evaluate('() => [JEU.ecran, CAMERA.mode]')))
    pg.click('#boutonResume'); attendre(pg, '() => JEU.ecran === "resume"', None, 5000)
    pg.mouse.click(l / 2, h / 3)
    t(f'{titre} : un clic sort aussi du résumé', attendre(pg, '() => JEU.ecran === "resultats"', None, 5000), str(pg.evaluate('() => JEU.ecran')))

# l'interface en course (suite du tour 31) : la minicarte (le circuit entier, chaque voiture au bon endroit à 2 m près, le joueur
# mis en valeur), l'état des pneus avec ?pneus=1 (la jauge baisse en roulant), un message de course (meilleur tour) qui apparaît
# puis disparaît ; rien ne se recouvre en 960×600 et 1280×720 ; aucun appel de dessin en plus (ce sont des canvas 2D et du HTML)
def hud_course(pg, titre, l, h):
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    if pg.evaluate('() => JEU.ecran === "grille"'): pg.evaluate('() => finirGrille()')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(25); BOUCLE.demarrer(); }')
    attendre(pg, '() => JEU.ecran === "course" && !document.getElementById("minicarte").classList.contains("cache")', None, 10000)
    pg.wait_for_timeout(300)
    mc = pg.evaluate('''() => { const P = JEU.plateau.pilotes, pts = MINICARTE.points; let pire = 0;
      for (const p of pts) { const [x, z] = MINICARTE.versMonde(p.x, p.y), v = P[p.k].v; pire = Math.max(pire, Math.hypot(x - v.x, z - v.z)); }
      return { n: pts.length, voitures: P.length, pire, pret: MINICARTE.pret }; }''')
    t(f'{titre} : la minicarte : le circuit entier, toutes les voitures (chacune au bon endroit à 2 m près)', mc['pret'] and mc['n'] == mc['voitures'] and mc['pire'] < 2, str(mc))
    u1 = pg.evaluate('() => [JEU.joueur.pneus.usure, document.getElementById("pneusTexte").textContent, document.getElementById("pneusHud").classList.contains("cache")]')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(60); BOUCLE.demarrer(); }')
    attendre(pg, '() => document.getElementById("pneusTexte").textContent.endsWith(" " + Math.round((1 - JEU.joueur.pneus.usure) * 100) + " %")', None, 5000)
    u2 = pg.evaluate('() => [JEU.joueur.pneus.usure, document.getElementById("pneusTexte").textContent, document.getElementById("pneusPlein").style.width, document.getElementById("pneusAdherence").textContent, 1 - JEU.joueur.adherence]')
    perte = u2[4]  # lue avec le texte ; une image de retard possible, d'où la marge (0,05 % de part et d'autre du seuil)
    t(f'{titre} : avec ?pneus=1, l’état des pneus à l’écran : la jauge baisse en roulant ; l’adhérence perdue n’est écrite qu’à partir de 0,1 % (jamais « −0,0 % »)', not u1[2] and u2[0] > u1[0] and u1[1] != u2[1] and (u2[3] == '' or re.search(r'[1-9]', u2[3]) is not None) and (perte < 0.0015 or u2[3] != '') and (perte >= 0.0005 or u2[3] == ''), str([u1, u2, perte]))
    # le vrai meilleur tour de la course (les voitures ont déjà bouclé des tours) : les messages repartent de zéro, et le premier
    # dit ce meilleur tour, le même temps que celui de la course ; puis il s'en va après MESSAGES_DUREE s de course
    pg.evaluate('() => { JEU.messages = null; }')
    meilleur = pg.evaluate('() => { const P = JEU.plateau.pilotes; let b = null; for (const p of P) if (p.course.meilleurTour !== null && (b === null || p.course.meilleurTour < b)) b = p.course.meilleurTour; return b === null ? null : INTERFACE.formatTemps(b); }')
    vu = meilleur is not None and attendre(pg, 't => !document.getElementById("messageCourse").classList.contains("cache") && document.getElementById("messageCourse").textContent.includes(t)', meilleur, 5000)
    texte_msg = pg.evaluate('() => document.getElementById("messageCourse").textContent')
    bm, bh, bc, bt, bp, br = [pg.evaluate('s => { const e = document.querySelector(s); if (!e || e.classList.contains("cache") || getComputedStyle(e).display === "none") return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', s) for s in ['#minicarte', '#hudCourse', '#classement', '#tableau', '#pneusHud', '#radar']]
    croise = lambda a, b: a is not None and b is not None and a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    bmsg = pg.evaluate('() => { const r = document.getElementById("messageCourse").getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }')
    boites = {'minicarte': bm, 'chrono': bh, 'tour': bc, 'compteur': bt, 'pneus': bp, 'radar': br, 'message': bmsg}
    chevauche = [(a, b) for a in boites for b in boites if a < b and croise(boites[a], boites[b])]
    t(f'{titre} : un message de course (meilleur tour) apparaît en bandeau ; rien ne se recouvre en {l}×{h} (minicarte, chrono, tour, compteur, pneus, radar, message)', vu and texte_msg != '' and not chevauche and all(b is None or (b[0] >= -1 and b[2] <= l + 1 and b[3] <= h + 1) for b in boites.values()), str([texte_msg, chevauche, boites]))
    if l == 1280:
        pg.screenshot(path=os.path.join(CAPTURES, 'messages.png'))
        pg.locator('#minicarte').screenshot(path=os.path.join(CAPTURES, 'minicarte.png'))
        pg.locator('#pneusHud').screenshot(path=os.path.join(CAPTURES, 'pneus-hud.png'))
    else:
        pg.screenshot(path=os.path.join(CAPTURES, 'hud-course-960.png'))
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(REGLAGES.MESSAGES_DUREE * 3 + 1); BOUCLE.demarrer(); }')
    t(f'{titre} : le message s’en va après MESSAGES_DUREE s', attendre(pg, 't => !document.getElementById("messageCourse").textContent.includes(t) || document.getElementById("messageCourse").classList.contains("cache")', meilleur, 5000), pg.evaluate('() => document.getElementById("messageCourse").textContent'))

def course_joueur(pg, titre):
    # le joueur conduit sa voiture au clavier, au milieu de 9 IA ; la caméra le suit, Tab ne change rien
    t(f'{titre} : 9 IA et la voiture du joueur, en dernière place de la grille ; la caméra suit le joueur',
      pg.evaluate('() => JEU.contre && JEU.plateau.pilotes.length === 10 && JEU.plateau.pilotes[9].humain && JEU.joueur === JEU.plateau.pilotes[9].v && JEU.course === JEU.plateau.pilotes[9].course && JEU.modeles.length === 10'))
    # tant que la carte se calcule, le compte à rebours attend (« Préparation de la course… ») : jamais de GO sans carte
    t(f'{titre} : pas de GO avant la carte : elle est prête, ou le compte à rebours attend avec « Préparation de la course… »',
      pg.evaluate('() => JEU.plateau.carte !== null || (JEU.course.etat === "compte" && JEU.course.compte === REGLAGES.COMPTE_A_REBOURS && document.getElementById("compte").textContent === texte("preparation"))'),
      str(pg.evaluate('() => [JEU.plateau.carte !== null, JEU.course.etat, JEU.course.compte, document.getElementById("compte").textContent]')))
    t(f'{titre} : la carte se calcule en fond, les 9 IA reçoivent leur pilote', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.filter(p => p.pilote !== null).length === 9', None, 120000))
    # les feux de départ : on retient l'extinction (un long délai) pour voir les 5 feux allumés
    t(f'{titre} : les feux de départ remplacent le 3-2-1 (même extinction pour toutes les voitures)', pg.evaluate('() => JEU.plateau.pilotes.every(p => p.course.feux && p.course.feux.total === JEU.course.feux.total) && JEU.plateau.pilotes.every(p => p.course.etat === "compte") && document.getElementById("compte").classList.contains("cache")'))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
    t(f'{titre} : les 5 feux rouges sont allumés', attendre(pg, '() => !document.getElementById("feux").classList.contains("cache") && document.querySelectorAll("#feux span.allume").length === 5'),
      pg.evaluate('() => document.getElementById("feux").outerHTML'))
    pg.screenshot(path=os.path.join(CAPTURES, 'feux.png'))
    # le départ parfait (depart.js) : pendant les feux, la voiture est tenue ; ↑ fait monter le régime de la jauge (centre bas).
    # La boucle réelle est arrêtée : la physique avance seulement par BOUCLE.simuler, pour mesurer la réaction exactement ;
    # image() la relance un instant pour que l'écran se redessine (au plus 0,1 s de physique par image)
    def image():
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } BOUCLE.demarrer(); return window.__images; }')
        attendre(pg, 'n => window.__images > n', n, 20000)
        pg.evaluate('() => BOUCLE.arreter()')
    pg.evaluate('() => BOUCLE.arreter()')
    pg.keyboard.down('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.5)')
    image()
    d1 = pg.evaluate('() => ({ regime: JEU.course.depart.regime, u: JEU.joueur.u, lance: JEU.course.depart.lance, jauge: !document.getElementById("jauge").classList.contains("cache"), aiguille: document.getElementById("jaugeAiguille").style.left, vert: document.getElementById("jaugeVert").style.width })')
    pg.keyboard.up('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.25)')
    d2 = pg.evaluate('() => ({ regime: JEU.course.depart.regime, u: JEU.joueur.u })')
    t(f'{titre} : pendant les feux, ↑ tenue 0,5 s fait monter le régime de départ sans lancer la voiture, et la jauge l’affiche au centre bas (zone verte)', abs(d1['regime'] - 0.5 * pg.evaluate('() => REGLAGES.DEPART_MONTEE')) < 0.02 and d1['u'] == 0 and d1['lance'] is None and d1['jauge'] and d1['aiguille'] and d1['vert'], str(d1))
    t(f'{titre} : ↑ lâchée 0,25 s : le régime redescend, la voiture ne bouge toujours pas', d2['regime'] < d1['regime'] and d2['u'] == 0, str(d2))
    t(f'{titre} : les IA ne bougent pas avant l’extinction', pg.evaluate('() => JEU.plateau.pilotes.every(p => p.humain || p.v.u === 0)'))
    # le régime au milieu du vert, la capture avec la jauge, puis l'extinction : lâcher puis réappuyer 0,2 s après = départ parfait
    pg.evaluate('() => { JEU.course.depart.regime = (REGLAGES.DEPART_VERT[0] + REGLAGES.DEPART_VERT[1]) / 2; }')
    image()
    pg.screenshot(path=os.path.join(CAPTURES, 'depart.png'))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; BOUCLE.simuler(0.05); }')
    t(f'{titre} : à l’extinction, la voiture du joueur reste tenue tant qu’il n’a pas réappuyé', pg.evaluate('() => JEU.course.etat === "attente" && JEU.course.depart.extinction !== null && JEU.course.depart.lance === null && JEU.joueur.u === 0'),
      str(pg.evaluate('() => [JEU.course.etat, JEU.course.depart.extinction, JEU.course.depart.lance, JEU.joueur.u]')))
    # (le régime redescend pendant qu'on ne tient pas la touche : on le remet dans le vert juste avant d'appuyer, comme un joueur qui dose)
    pg.evaluate('() => { BOUCLE.simuler(0.1); JEU.course.depart.regime = (REGLAGES.DEPART_VERT[0] + REGLAGES.DEPART_VERT[1]) / 2; }')
    pg.keyboard.down('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.5)')
    image()
    t(f'{titre} : après l’extinction, les feux s’éteignent tous', pg.evaluate('() => document.querySelectorAll("#feux span.allume").length === 0'))
    dp = pg.evaluate('() => ({ resultat: JEU.course.depart.resultat, reaction: JEU.course.depart.reaction, u: JEU.joueur.u, facteur: JEU.joueur.facteurDepart, penalites: JEU.course.penalites, record: JEU.departRecord, sauve: SAUVEGARDE.reaction(), texte: document.getElementById("departResultat").textContent, classe: document.getElementById("departResultat").className, jauge: document.getElementById("jauge").classList.contains("cache") })')
    t(f'{titre} : réappuyer 0,2 s après l’extinction, régime dans le vert = départ parfait : la voiture part (facteur moteur 1, pas de pénalité), « Départ parfait ! · 0,2x s ★ record » affiché, le record de réaction sauvegardé',
      dp['resultat'] == 'parfait' and 0.1 <= dp['reaction'] < 0.3 and dp['u'] > 1 and dp['facteur'] == 1 and dp['penalites'] == 0 and dp['record'] and abs(dp['sauve'] - dp['reaction']) < 1e-9
      and dp['texte'].startswith(pg.evaluate('() => texte("departParfait")')) and '★' in dp['texte'] and dp['classe'] == 'parfait' and dp['jauge'], str(dp))
    L.append(f"  (départ du joueur joué par le test : {dp['resultat']}, réaction {dp['reaction']:.3f} s, « {dp['texte']} »)")
    pg.evaluate('() => BOUCLE.demarrer()')
    depart = pg.evaluate('() => JEU.plateau.temps')
    t(f'{titre} : ↑ fait avancer la voiture du joueur', attendre(pg, '() => JEU.joueur.u > 15', None, 40000), pg.evaluate('() => JEU.joueur.u'))
    pg.keyboard.press('Tab')
    t(f'{titre} : Tab ne change pas la voiture suivie', pg.evaluate('() => JEU.suivie === 9 && JEU.joueur === JEU.plateau.pilotes[9].v'))
    # 5 s de course (le temps de la course, pas l'horloge : un Mac chargé fait moins de pas de physique par seconde)
    attendre(pg, f'() => JEU.plateau.temps > {depart} + 5', None, 60000)
    pg.screenshot(path=os.path.join(CAPTURES, 'joueur-ia.png'))
    pg.keyboard.up('ArrowUp')
    # (sur un Mac chargé, la physique prend du retard sur l'horloge : on attend que tout le monde ait roulé)
    avance = attendre(pg, '() => JEU.plateau.pilotes.every(p => p.course.progression > 20)', None, 20000)
    etat = pg.evaluate('() => JEU.plateau.pilotes.map(p => ({ humain: p.humain, progression: Math.round(p.course.progression), chocs: p.v.chocs.length }))')
    t(f'{titre} : la voiture du joueur et les 9 IA ont avancé', avance, str(etat))
    L.append(f"  (contre 9 IA : joueur {etat[9]['progression']} m, IA de {min(e['progression'] for e in etat[:9])} à {max(e['progression'] for e in etat[:9])} m, {sum(e['chocs'] for e in etat) // 2} contacts)")
    # le joueur passe la ligne (on lui donne ses tours) : la caméra télé suit une IA encore en course, le podium attend
    pg.evaluate('() => { const c = JEU.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; }')
    t(f'{titre} : après l’arrivée du joueur, caméra télé sur une IA encore en course, bandeau d’attente, pas encore de podium',
      attendre(pg, '() => JEU.attente && CAMERA.mode === "tele" && JEU.attente.tele !== null && !JEU.plateau.pilotes[JEU.attente.tele].humain && JEU.plateau.pilotes[JEU.attente.tele].arrivee === null'
                   ' && !document.getElementById("attenteArrivee").classList.contains("cache") && JEU.ecran === "course"', None, 20000),
      str(pg.evaluate('() => [JEU.ecran, CAMERA.mode, JEU.attente && JEU.attente.tele]')))
    t(f'{titre} : la tour de classement reste, le joueur marqué 🏁', pg.evaluate('() => !document.getElementById("classement").classList.contains("cache") && document.querySelector("#classementListe li.moi").classList.contains("arrive")'))
    # sa voiture dans l'herbe : plus de « hors piste » après l'arrivée (il ne chevaucherait le bandeau)
    pg.evaluate('() => { const v = JEU.joueur; const e = 12 - v.piste.d; v.x += v.piste.nx * e; v.z += v.piste.nz * e; }')
    t(f'{titre} : après l’arrivée, pas de « hors piste » même dans l’herbe', attendre(pg, '() => JEU.joueur.surHerbe && document.getElementById("horsPiste").classList.contains("cache")', None, 10000),
      str(pg.evaluate('() => [JEU.joueur.surHerbe, document.getElementById("horsPiste").className]')))
    pg.wait_for_timeout(1000)
    pg.screenshot(path=os.path.join(CAPTURES, 'apres-arrivee.png'))
    pg.click('#boutonPasser')
    t(f'{titre} : le bouton « passer » mène au podium (la caméra d’avant revient, le bandeau part)',
      attendre(pg, '() => JEU.ecran === "podium" && CAMERA.mode !== "tele" && document.getElementById("attenteArrivee").classList.contains("cache")', None, 180000),   # (depuis le 2026-10-24, « passer » joue la fin de la course en accéléré : plus de temps réel)
      str(pg.evaluate('() => [JEU.ecran, CAMERA.mode]')))
    # le patinage, joué par le test sur une nouvelle course (podium → résultats → « Rejouer » → qualification passée) : la touche
    # tenue à travers l'extinction ne lance pas la voiture (le régime monte au bout), lâcher puis réappuyer = patinage
    pg.click('#boutonResultats')
    attendre(pg, '() => JEU.ecran === "resultats"')
    pg.click('#boutonRejouerResultats')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.depart && JEU.course.depart.lance === null', None, 180000)
    pg.evaluate('() => { BOUCLE.arreter(); for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
    pg.keyboard.down('ArrowUp')
    pg.evaluate('() => { BOUCLE.simuler(2); for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; BOUCLE.simuler(0.3); }')
    tenue = pg.evaluate('() => ({ regime: JEU.course.depart.regime, lance: JEU.course.depart.lance, etat: JEU.course.etat, u: JEU.joueur.u, extinction: JEU.course.depart.extinction })')
    t(f'{titre} : patinage : ↑ tenue 2 s puis à travers l’extinction : le régime est au bout, la voiture n’est pas lancée tant que la touche n’est pas lâchée', tenue['regime'] == 1 and tenue['lance'] is None and tenue['etat'] == 'attente' and tenue['u'] == 0 and tenue['extinction'] is not None, str(tenue))
    pg.keyboard.up('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.05)')
    pg.keyboard.down('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.5)')
    image()
    pt = pg.evaluate('() => ({ resultat: JEU.course.depart.resultat, reaction: JEU.course.depart.reaction, facteur: JEU.joueur.facteurDepart, u: JEU.joueur.u, penalites: JEU.course.penalites, texte: document.getElementById("departResultat").textContent, classe: document.getElementById("departResultat").className })')
    t(f'{titre} : lâcher puis réappuyer avec le régime trop haut = patinage : la voiture part moins fort (facteur moteur DEPART_PATINAGE[0]), « Patinage ! » affiché, pas de pénalité',
      pt['resultat'] == 'patinage' and pt['facteur'] == pg.evaluate('() => REGLAGES.DEPART_PATINAGE[0]') and pt['u'] > 0 and pt['penalites'] == 0 and pt['texte'].startswith(pg.evaluate('() => texte("departPatinage")')) and pt['classe'] == 'patinage', str(pt))
    L.append(f"  (patinage joué par le test : réaction {pt['reaction']:.3f} s, facteur moteur {pt['facteur']}, « {pt['texte']} »)")
    pg.evaluate('() => { BOUCLE.simuler(REGLAGES.DEPART_PATINAGE[1] + 0.1); }')
    t(f'{titre} : après DEPART_PATINAGE[1] s, l’effet s’arrête (facteur 1)', pg.evaluate('() => JEU.joueur.facteurDepart === 1 && JEU.joueur.u > 5'), str(pg.evaluate('() => [JEU.joueur.facteurDepart, JEU.joueur.u]')))
    pg.keyboard.up('ArrowUp')
    pg.evaluate('() => BOUCLE.demarrer()')

# les éléments fixes de l'écran de course, qui ne doivent jamais se chevaucher
ELEMENTS_COURSE = ['classement', 'radar', 'boutonSon', 'aide', 'hudCourse', 'tableau']

# les lignes de la tour, de haut en bas (par leur place à l'écran) : 1, 2, 3… et chacune posée à sa place (fin du glissement)
ORDRE_TOUR = '''() => {
  const lis = [...document.querySelectorAll("#classementListe li")], haut = document.getElementById("classementListe").getBoundingClientRect().top;
  const h = lis.length ? lis[0].getBoundingClientRect().height : 0;
  return lis.length > 0 && lis.every(li => Math.abs(li.getBoundingClientRect().top - haut - (Number(li.children[0].textContent) - 1) * h) < 0.5)
    && lis.map(li => li.getBoundingClientRect().top).sort((a, b) => a - b).every((y, i, t) => i === 0 || y > t[i - 1]);
}'''

def hud(pg, titre, l):
    # la tour de classement en haut à droite et le radar en bas à gauche, pendant une course contre les IA
    passer_qualif(pg, titre)
    t(f'{titre} : la tour de classement est visible, avec 10 lignes et la ligne du joueur marquée', attendre(pg,
      '() => !document.getElementById("classement").classList.contains("cache") && document.querySelectorAll("#classementListe li").length === 10'
      ' && document.querySelectorAll("#classementListe li.moi").length === 1 && /^P\\d+ \\/ 10$/.test(document.getElementById("classementPlace").textContent)'),
      pg.evaluate('() => document.getElementById("classement").innerText'))
    t(f'{titre} : la ligne marquée est celle du joueur (n°10)', pg.evaluate('() => document.querySelector("#classementListe li.moi").dataset.numero') == '10')
    t(f'{titre} : le radar est visible, avec des points de voitures', attendre(pg, '() => !document.getElementById("radar").classList.contains("cache") && RADAR.etat.points > 0'),
      str(pg.evaluate('() => RADAR.etat.points')))
    boites = pg.evaluate('ids => ids.map(id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return [id, getComputedStyle(e).display === "none" ? null : [r.left, r.top, r.right, r.bottom]]; })', ELEMENTS_COURSE)
    vus = [(n, b) for n, b in boites if b and b[2] > b[0] and b[3] > b[1]]
    chevauchent = [f'{a[0]} / {b[0]}' for i, a in enumerate(vus) for b in vus[i + 1:]
                   if a[1][0] < b[1][2] and b[1][0] < a[1][2] and a[1][1] < b[1][3] and b[1][1] < a[1][3]]
    dehors = [n for n, b in vus if b[0] < 0 or b[1] < 0 or b[2] > pg.viewport_size['width'] or b[3] > pg.viewport_size['height']]
    t(f'{titre} : ni chevauchement ni débordement entre {", ".join(n for n, _ in vus)}', not chevauchent and not dehors and len(vus) == len(ELEMENTS_COURSE),
      f'chevauchent : {chevauchent}, dehors : {dehors}, visibles : {[n for n, _ in vus]}')
    # les lignes glissent quand l'ordre change (la grille se range quand la carte est prête) : on attend qu'elles soient
    # à leur place, et les places affichées doivent aller de 1 à N, de haut en bas
    t(f'{titre} : les places de la tour vont de 1 à 10, de haut en bas, chaque ligne à sa place', attendre(pg, ORDRE_TOUR, None, 10000),
      pg.evaluate('() => [...document.querySelectorAll("#classementListe li")].map(li => [li.children[0].textContent, Math.round(li.getBoundingClientRect().top)])'))
    # l'icône du casque a sa colonne : sur la ligne du joueur, sa boîte et celle du numéro ne se recouvrent pas, le numéro est lisible en entier
    boite = pg.evaluate('''() => { const li = document.querySelector("#classementListe li.moi"), c = li.querySelector(".casque canvas"), n = li.querySelector(".numero");
      const a = c.getBoundingClientRect(), b = n.getBoundingClientRect(); return { casque: [a.left, a.right, a.top, a.bottom], numero: [b.left, b.right, b.top, b.bottom], texte: n.textContent, deborde: n.scrollWidth > n.clientWidth + 1, ordre: a.right <= b.left }; }''')
    t(f'{titre} : dans la tour, l’icône du casque est dans sa colonne, avant le numéro, sans recouvrir le numéro (lisible en entier)', boite['ordre'] and not boite['deborde'] and boite['casque'][1] <= boite['numero'][0], str(boite))
    pg.screenshot(path=os.path.join(CAPTURES, f'hud-{l}.png'))
    # le faux départ par la touche (tour 23b, en 960×600) : la carte prête, les feux retenus, ↑ pressée DEPART_ANTICIPATION / 2
    # avant l'extinction (la boucle arrêtée, la physique par BOUCLE.simuler) : faux départ, la voiture part, « +5 s faux départ »
    # affiché, et la pénalité compte dans le classement final
    if l == 960:
        attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.depart && JEU.course.depart.lance === null', None, 180000)
        pg.evaluate('() => { BOUCLE.arreter(); for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
        pg.evaluate('() => { BOUCLE.simuler(0.5); JEU.course.depart.regime = (REGLAGES.DEPART_VERT[0] + REGLAGES.DEPART_VERT[1]) / 2; for (const p of JEU.plateau.pilotes) p.course.compte = REGLAGES.DEPART_ANTICIPATION / 2 + 1 / 120; BOUCLE.simuler(1 / 120); }')
        pg.keyboard.down('ArrowUp')
        pg.evaluate('() => BOUCLE.simuler(0.5)')
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } BOUCLE.demarrer(); return window.__images; }')
        attendre(pg, 'n => window.__images > n + 1', n, 20000)
        pg.evaluate('() => BOUCLE.arreter()')
        f = pg.evaluate('() => ({ resultat: JEU.course.depart.resultat, reaction: JEU.course.depart.reaction, faux: JEU.course.fauxDepart, penalites: JEU.course.penalites, u: JEU.joueur.u, affiche: !document.getElementById("hudPenalite").classList.contains("cache"), texte: document.getElementById("hudPenalite").textContent, resultatTexte: document.getElementById("departResultat").textContent })')
        t(f'{titre} : ↑ juste avant l’extinction (dans DEPART_ANTICIPATION) = faux départ : la voiture part, « +5 s faux départ » affiché, pénalité de 5 s',
          f['resultat'] == 'faux' and f['reaction'] < 0 and f['faux'] and f['penalites'] == 5 and f['u'] > 0.5 and f['affiche'] and f['texte'] == pg.evaluate('() => texte("fauxDepart").replace("{s}", REGLAGES.PENALITE_FAUX_DEPART)'), str(f))
        pg.keyboard.up('ArrowUp')
        # le joueur passe la ligne (ses tours donnés) : au classement final, son total porte les 5 s
        pg.evaluate('() => { const c = JEU.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; BOUCLE.simuler(1 / 120); }')
        cf = pg.evaluate('() => { const f = classementFinal(JEU.plateau), moi = f.find(x => x.k === JEU.suivie); return { penalites: moi.penalites, total: moi.total, temps: moi.temps }; }')
        t(f'{titre} : la pénalité du faux départ est dans le classement final (total = temps + 5 s)', cf['penalites'] == 5 and cf['total'] is not None and abs(cf['total'] - cf['temps'] - 5) < 1e-9, str(cf))
        L.append(f"  (faux départ joué par le test : réaction {f['reaction']:.3f} s, « {f['resultatTexte']} », « {f['texte']} »)")
        pg.evaluate('() => BOUCLE.demarrer()')

def course_podium(pg, titre, l):
    # une course d'un tour entre 8 IA, accélérée (BOUCLE.simuler) jusqu'à ce que les trois premiers soient connus
    t(f'{titre} : la carte se calcule en fond', attendre(pg, '() => JEU.plateau.carte !== null', None, 180000))
    pg.evaluate('() => BOUCLE.simuler(25)')
    # une pénalité (décision du propriétaire) : pendant la course, elle est affichée dans la tour sans changer la place ;
    # elle compte au podium et aux résultats. On suit le premier, on lui donne +60 s : il reste P1 dans la tour,
    # et finit derrière tous ceux qui arrivent moins de 60 s après lui
    pg.evaluate('() => suivre(classementCourse(JEU.plateau)[0].k)')
    pg.wait_for_timeout(300)
    pg.evaluate('() => { JEU.course.penalites += 60; }')
    t(f'{titre} : +60 s de pénalité au premier : la tour l’affiche (« ✂ +60 s ») et il reste P1',
      attendre(pg, '() => document.getElementById("classementPlace").textContent.startsWith("P1 ") && document.querySelector("#classementListe li.moi .penalite").textContent === "✂ +60 s"'),
      pg.evaluate('() => document.getElementById("classementPlace").textContent'))
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    t(f'{titre} : après l’arrivée, le podium avec 3 voitures (2e, 1er, 3e), dans l’ordre du classement final', pg.evaluate('''() => JEU.ecran === "podium"
      && [...document.querySelectorAll("#podiumMarches .marche")].map(e => e.className).join() === "marche marche2,marche marche1,marche marche3"
      && JEU.final.slice(0, 3).every(x => JEU.modeles[x.k].groupe.visible) && JEU.modeles.filter(m => m.groupe.visible).length === 3'''),
      str(pg.evaluate('() => [JEU.ecran, JEU.plateau.arrives, JEU.plateau.temps]')))
    pg.wait_for_timeout(800)
    if l == 1280: pg.screenshot(path=os.path.join(CAPTURES, 'podium.png'))
    pg.click('#boutonResultats')
    t(f'{titre} : au podium, la pénalité compte : le premier sur la ligne (+60 s) n’est pas sur le podium',
      pg.evaluate('() => JEU.final.slice(0, 3).every(x => x.k !== JEU.suivie) && JEU.final.find(x => x.k === JEU.suivie).ligne === 1'),
      str(pg.evaluate('() => JEU.final.map(x => [x.k, x.ligne, x.place, x.penalites])')))
    t(f'{titre} : le bouton passe aux résultats : 8 lignes, la voiture suivie marquée, temps et pénalités du classement final',
      attendre(pg, '''() => JEU.ecran === "resultats" && document.querySelectorAll("#resultatsLignes tr").length === 8
        && document.querySelectorAll("#resultatsLignes tr.moi").length === 1
        && [...document.querySelectorAll("#resultatsLignes tr")].every((tr, i) => tr.children[0].textContent === String(i + 1)
             && tr.children[3].textContent === (JEU.final[i].penalites > 0 ? "+" + JEU.final[i].penalites + " s ✂" : ""))'''),
      pg.evaluate('() => document.getElementById("resultatsTable").innerText.slice(0, 300)'))
    defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
    t(f'{titre} : résultats sans défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, 'resultats.png' if l == 1280 else 'resultats-960.png'))

# ?championnat=1 : la ligne du coéquipier dans la tour (null si elle n'y est pas encore)
DUEL_TOUR = '''() => { const li = document.querySelectorAll("#classementListe li.coequipier"); if (!li.length || document.getElementById("classement").classList.contains("cache")) return null;
  return { n: li.length, numero: Number(li[0].dataset.numero), attendu: JEU.plateau.pilotes[CHAMPIONNAT.coequipierDe(JEU.championnat).id].numero,
    couleur: li[0].style.getPropertyValue("--ecurie") !== "", ecart: li[0].querySelector(".ecart").textContent }; }'''

def duel_ecran(pg, titre, gp):
    # l'écran entre les courses : « ⚔ Duel contre ton coéquipier : Toi 1 – 3 Pilote 19 (qualifs 0–2, courses 1–1) », les chiffres de
    # CHAMPIONNAT.scoreDuel ; après gp Grands Prix, 2 points par Grand Prix au plus (une qualif, une course) ; la ligne ne déborde pas
    d = pg.evaluate('''() => { const p = document.getElementById("championnatDuel"), s = CHAMPIONNAT.scoreDuel(JEU.championnat);
      return { texte: p.textContent, s, nom: INTERFACE.nomPilote(JEU.championnat.pilotes[s.k]), deborde: p.scrollWidth > p.clientWidth + 1 || p.getBoundingClientRect().right > innerWidth }; }''')
    s = d['s']
    attendu = f"⚔ Duel contre ton coéquipier : Toi {s['total'][0]} – {s['total'][1]} {d['nom']} (qualifs {s['qualifs'][0]}–{s['qualifs'][1]}, courses {s['courses'][0]}–{s['courses'][1]})"
    t(f'{titre} : après {gp} Grand(s) Prix, le score du duel contre le coéquipier est affiché, sans déborder', d['texte'] == attendu and not d['deborde']
      and sum(s['qualifs']) <= gp and sum(s['courses']) <= gp and sum(s['qualifs']) + sum(s['courses']) >= gp, str(d))

# ?championnat=1 : la une du journal (journal.js) à l'écran, après les résultats : la dernière une de l'album, rendue avec les
# noms de l'affichage ; grand titre, petit texte, 2 ou 3 brèves, le classement (5 premiers + le joueur) ; rien ne déborde de la
# page de journal, et la page ne défile pas ; puis un clic (ou une touche) mène à l'écran du championnat
UNE = '''() => { const ch = JEU.championnat, une = ch.album[ch.album.length - 1], r = JOURNAL.rendre(une, ch, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie });
  const $ = id => document.getElementById(id), page = $("unePage").getBoundingClientRect(), dedans = [];
  for (const id of ["uneNom", "uneTitre", "uneTexte", "uneBreves", "uneClassement", "unePhoto"]) { const b = $(id).getBoundingClientRect();
    dedans.push(b.left >= page.left - 1 && b.right <= page.right + 1 && b.top >= page.top - 1 && b.bottom <= page.bottom + 1 && b.width > 0 && b.height > 0); }
  const coupe = ["unePrincipal", "uneCote", "unePage"].filter(id => $(id).scrollHeight > $(id).clientHeight + 1 || $(id).scrollWidth > $(id).clientWidth + 1);
  return { ecran: JEU.ecran, visible: !$("une").classList.contains("cache"), nom: $("uneNom").textContent, attenduNom: r.nom, titre: $("uneTitre").textContent, attenduTitre: r.titre,
    texte: $("uneTexte").textContent, attenduTexte: r.texte, breves: [...document.querySelectorAll("#uneBreves li")].map(e => e.textContent), attenduBreves: r.breves,
    classement: [...document.querySelectorAll("#uneClassement li")].map(e => e.textContent), moi: document.querySelectorAll("#uneClassement li.moi").length, attenduClassement: r.classement.length,
    photo: $("unePhoto").textContent, passer: $("unePasser").textContent, dedans, coupe, fait: une.f,
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''


# ?championnat=1 : l'interview d'après course (interview.js, Codeur 3), entre « Continuer » des résultats et la une du journal :
# le journaliste, la question, trois boutons avec l'icône du ton, « Pas de commentaire » ; après le choix, la ligne d'effet et
# « Continuer » ; ton : 'provocant' | 'calme' | 'malin' | None (pas de commentaire : la une tout de suite, aucun effet)
INTERVIEW_ETAT = """() => { const q = JEU.interview, ch = JEU.championnat, $ = id => document.getElementById(id), b = [...document.querySelectorAll("#interviewReponses button")];
  return { ecran: JEU.ecran, visible: !$("interview").classList.contains("cache"), fait: q && q.fait, rival: q ? q.rival : null, journaliste: $("interviewJournaliste").textContent,
    question: $("interviewQuestion").textContent, attenduQuestion: q ? INTERVIEW.phrase("interview_" + q.fait + "_q", q.variante, q.params, ch, { pilote: INTERFACE.nomPilote }) : null,
    n: b.length, tons: b.map(x => x.dataset.ton), icones: b.map(x => x.querySelector(".icone").textContent), textes: b.map(x => x.querySelector(".reponse").textContent),
    pas: $("boutonPasCommentaire").textContent, effet: $("interviewEffet").textContent, choixCache: $("interviewChoix").classList.contains("cache"), suiteCache: $("interviewSuite").classList.contains("cache"),
    fini: !!JEU.grandPrixFini, prochain: ch.prochain, reputation: Object.assign({}, ch.reputation), confiance: ch.confiance,
    rivalite: q && q.rival !== null && ch.pilotes[q.rival].rivalite ? ch.pilotes[q.rival].rivalite.courses : 0, nomRival: q && q.rival !== null ? INTERFACE.nomPilote(ch.pilotes[q.rival]) : null,
    dedans: [...document.querySelectorAll("#interviewCarte, #interviewReponses button, #boutonPasCommentaire")].every(e => { const r = e.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }),
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
def interview_ecran(pg, titre, ton, capture=None, gp=''):
    ok = attendre(pg, '() => JEU.ecran === "interview" && !document.getElementById("interview").classList.contains("cache")', None, 10000)
    e = pg.evaluate(INTERVIEW_ETAT)
    t(f'{titre} : {gp}après les résultats, l’interview (fait « {e["fait"]} ») : le journaliste et le journal, la question rendue avec les noms, trois boutons avec l’icône du ton (😤 🤝 😏), « Pas de commentaire », le Grand Prix pas encore enregistré, tout dans l’écran',
      ok and e['visible'] and e['journaliste'].startswith(pg.evaluate('() => texte("interviewJournaliste")')) and e['question'] == e['attenduQuestion'] and len(e['question']) > 5 and '{' not in e['question']
      and e['n'] == 3 and e['tons'] == ['provocant', 'calme', 'malin'] and e['icones'] == ['😤', '🤝', '😏'] and all(len(x) > 5 and '{' not in x for x in e['textes']) and e['pas'] == pg.evaluate('() => texte("interviewPasCommentaire")')
      and not e['fini'] and e['suiteCache'] and not e['choixCache'] and e['dedans'] and pas_de_defilement(e['defile']), str(e)[:700])
    if capture:
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    avant = e
    if ton is None:
        pg.click('#boutonPasCommentaire')
        t(f'{titre} : {gp}« Pas de commentaire » : aucun effet (jauges, confiance), le Grand Prix enregistré et la une tout de suite',
          attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => [Object.assign({}, JEU.championnat.reputation), JEU.championnat.confiance, JEU.championnat.prochain, JEU.championnat.interview.derniere.ton]') == [avant['reputation'], avant['confiance'], avant['prochain'] + 1, None],
          str(pg.evaluate(INTERVIEW_ETAT))[:400])
        return avant
    pg.click(f'#interviewReponses button[data-ton="{ton}"]')
    e = pg.evaluate(INTERVIEW_ETAT)
    effets = pg.evaluate('ton => REGLAGES.INTERVIEW_EFFETS[ton]', ton)
    attendu = {j: max(0, min(100, avant['reputation'][j] + effets.get(j, 0))) for j in avant['reputation']}
    ligne = pg.evaluate('ton => { const l = INTERVIEW.ligneEffet(JEU.interview, ton); return INTERVIEW.phrase(l.cle, 0, l.params, JEU.championnat, { pilote: INTERFACE.nomPilote }); }', ton)
    t(f'{titre} : {gp}la réponse « {ton} » : la ligne d’effet (« {e["effet"]} »), les trois boutons cachés, « Continuer », les jauges bougées d’un pas (INTERVIEW_EFFETS), la confiance = la jauge écurie, le Grand Prix toujours pas enregistré',
      e['effet'] == ligne and e['effet'] != '' and e['choixCache'] and not e['suiteCache'] and e['reputation'] == attendu and e['confiance'] == attendu['ecurie'] and not e['fini'] and e['prochain'] == avant['prochain'], str(e)[:600])
    if ton == 'provocant':
        n = pg.evaluate('() => REGLAGES.INTERVIEW_RIVALITE_COURSES')
        if avant['rival'] is not None:
            t(f'{titre} : {gp}provocant contre {avant["nomRival"]} : « n’a pas aimé » et la rivalité posée sur lui ({n} courses)', e['rivalite'] == n and avant['nomRival'] in e['effet'] and e['effet'].endswith('n’a pas aimé.'), str(e)[:300])
        else:
            t(f'{titre} : {gp}provocant sans rival nommé : aucune rivalité posée', pg.evaluate('() => JEU.championnat.pilotes.every(p => !p.rivalite)'), e['effet'])
    pg.click('#boutonInterviewSuite')
    t(f'{titre} : {gp}« Continuer » de l’interview enregistre le Grand Prix et montre la une du journal', attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => JEU.championnat.prochain') == avant['prochain'] + 1, str(pg.evaluate(INTERVIEW_ETAT))[:300])
    return e
def passer_interview(pg):   # pour les tests qui ne regardent pas l'interview : « Pas de commentaire »
    attendre(pg, '() => JEU.ecran === "interview"', None, 10000); pg.click('#boutonPasCommentaire')
# les trois jauges de réputation au paddock (trois petites barres), aux valeurs du championnat
REPUTATION_ETAT = """() => { const ch = JEU.championnat, js = [...document.querySelectorAll("#championnatReputation .jauge")]; return { ecran: JEU.ecran, n: js.length, jauges: js.map(j => j.dataset.jauge),
  noms: js.map(j => j.querySelector(".nom").textContent), valeurs: js.map(j => +j.querySelector(".valeur").textContent), largeurs: js.map(j => j.querySelector(".plein").style.width), attendu: INTERVIEW.JAUGES.map(j => Math.round(ch.reputation[j])),
  visible: js.length > 0 && js.every(j => j.querySelector(".barre").getBoundingClientRect().width > 40 && j.getBoundingClientRect().bottom <= innerHeight), defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
def reputation_paddock(pg, titre, attendu=None):
    e = pg.evaluate(REPUTATION_ETAT)
    t(f'{titre} : au paddock, les trois jauges de réputation (Public, Écurie, Sponsors) en petites barres, aux valeurs du championnat' + (f' ({attendu})' if attendu else '') + ', sans défilement',
      e['ecran'] == 'championnat' and e['n'] == 3 and e['jauges'] == ['public', 'ecurie', 'sponsors'] and e['noms'] == ['Public', 'Écurie', 'Sponsors'] and e['valeurs'] == e['attendu'] and e['largeurs'] == [f'{v}%' for v in e['attendu']]
      and e['visible'] and (attendu is None or e['valeurs'] == attendu) and pas_de_defilement(e['defile']), str(e))
# la fiche d'un rival avec une rivalité en cours : « “phrase” — circuit, saison N · rivalité : encore n courses »
def fiche_rivalite(pg, titre, k, n):
    pg.click(f'#championnatPilotes li[data-k="{k}"] .nom')
    e = pg.evaluate("""k => { const ch = JEU.championnat, p = ch.pilotes[k], rv = p.rivalite, $ = id => document.getElementById(id); return { ecran: JEU.ecran, texte: $("ficheRivalite").textContent, courses: rv ? rv.courses : null,
      nom: INTERFACE.nomPilote(p), circuit: rv ? (texte("circuit_" + rv.circuit) || CIRCUITS[rv.circuit].nom) : null, saison: ch.saison, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }""", k)
    t(f'{titre} : la fiche du rival montre la rivalité : « “phrase” — circuit, saison N · rivalité : encore {n} courses », la phrase le nomme, sans défilement',
      e['ecran'] == 'fiche' and e['courses'] == n and e['texte'].startswith('« ') and e['nom'] in e['texte'] and (' » — ' + str(e['circuit']) + ', saison ' + str(e['saison']) + ' · ') in e['texte'] and e['texte'].endswith(f'rivalité : encore {n} courses') and pas_de_defilement(e['defile']), str(e))
    pg.click('#boutonFicheRetour'); attendre(pg, '() => JEU.ecran === "championnat"')

# l'album des unes (tour 28c) : après 3 Grands Prix (le 3e joué d'avance), « Album » au paddock : la dernière une, puis ← ← la
# première, un clic la suivante ; chaque une est la même que le jour même ; Échap ramène au paddock ; capture album.png
ALBUM_ETAT = '''() => ({ ecran: JEU.ecran, i: JEU.album, titre: document.getElementById("uneTitre").textContent, page: document.getElementById("albumPage").textContent,
  barre: getComputedStyle(document.getElementById("albumBarre")).display !== "none", passer: getComputedStyle(document.getElementById("unePasser")).display === "none",
  avant: document.getElementById("boutonAlbumAvant").disabled, apres: document.getElementById("boutonAlbumApres").disabled,
  dedans: [...document.querySelectorAll("#unePage, #albumBarre")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }),
  defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })'''
def album_ecran(pg, titre, titres):
    pg.evaluate('() => { SAISONS.avancer(JEU.championnat, 1); montrerChampionnat(null); }')
    titres = titres + [pg.evaluate('() => JOURNAL.rendre(JEU.championnat.album[2], JEU.championnat, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie }).titre')]
    t(f'{titre} : au paddock, le bouton « 📰 Album » (3 unes)', pg.evaluate('() => document.getElementById("boutonAlbum").textContent === "📰 Album" && !document.getElementById("boutonAlbum").disabled && JEU.championnat.album.length === 3'))
    pg.click('#boutonAlbum')
    a = pg.evaluate(ALBUM_ETAT)
    t(f'{titre} : l’album s’ouvre sur la dernière une (« Saison 1 · Grand Prix 3 · 3 / 3 »), la même que le jour même, la barre à la place de « clique pour passer », tout dans l’écran',
      a['ecran'] == 'album' and a['i'] == 2 and a['titre'] == titres[2] and a['page'] == 'Saison 1 · Grand Prix 3 · 3 / 3' and a['barre'] and a['passer'] and a['apres'] and not a['avant'] and a['dedans'] and pas_de_defilement(a['defile']), str(a))
    pg.keyboard.press('ArrowLeft'); pg.keyboard.press('ArrowLeft')
    a = pg.evaluate(ALBUM_ETAT)
    t(f'{titre} : ← ← : la première une, redessinée à l’identique (« {titres[0]} »)', a['ecran'] == 'album' and a['i'] == 0 and a['titre'] == titres[0] and a['avant'], str(a))
    pg.click('#uneTitre')
    a = pg.evaluate(ALBUM_ETAT)
    t(f'{titre} : un clic sur la page : la une suivante, à l’identique', a['ecran'] == 'album' and a['i'] == 1 and a['titre'] == titres[1] and a['page'] == 'Saison 1 · Grand Prix 2 · 2 / 3', str(a))
    ph = pg.evaluate(PHOTO_ETAT, 1)
    t(f'{titre} : dans l’album, la photo est redessinée à l’identique depuis la une compacte', bool(ph) and ph['pareil'] and ph['couleurs'] > 8, str(ph))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'album.png')); pg.screenshot(path=os.path.join(CAPTURES, 'album-photo.png'))
    pg.click('#boutonAlbumApres')
    t(f'{titre} : ▶ : la une suivante ; un clic sur la barre ne tourne pas la page en plus', pg.evaluate('() => JEU.album') == 2)
    pg.keyboard.press('Escape')
    t(f'{titre} : Échap ferme l’album : le paddock', attendre(pg, '() => JEU.ecran === "championnat" && document.getElementById("une").classList.contains("cache") && !document.getElementById("une").classList.contains("album")'), str(pg.evaluate('() => JEU.ecran')))

PHOTO_ETAT = '''i => { const cv = document.querySelector("#unePhoto canvas"); if (!cv) return null; const ch = JEU.championnat, u = ch.album[i === null ? ch.album.length - 1 : i];
  const t = document.createElement("canvas"); t.width = cv.width; t.height = cv.height; PHOTO.dessiner(t.getContext("2d", { willReadFrequently: true }), t.width, t.height, JOURNAL.photo(u, ch));
  const px = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data, c = new Set(); for (let k = 0; k < px.length; k += 4 * 53) c.add(px[k] + "," + px[k + 1] + "," + px[k + 2]);
  const q = t.getContext("2d").getImageData(0, 0, t.width, t.height).data; let diff = 0; for (let k = 0; k < px.length; k++) if (px[k] !== q[k]) diff++;
  const r = cv.getBoundingClientRect(); return { couleurs: c.size, pareil: t.toDataURL() === cv.toDataURL(), diff, desc: JSON.stringify(JOURNAL.photo(u, ch)).slice(0, 300), affiche: cv.dataset.desc ? cv.dataset.desc.slice(0, 300) : null, type: JOURNAL.photo(u, ch).type, visible: r.width > 50 && r.height > 30 }; }'''
# le calendrier de la saison (tour 31) : depuis le paddock ; le joueur a pour course de cœur un circuit du calendrier (en mémoire, le
# temps de l'écran : les 12 tracés ne sont pas encore au calendrier) ; les faits, le prochain, la maison du domicile ; capture
def calendrier_ecran(pg, titre, capture):
    pg.evaluate('() => { JEU.coeurAvant = JEU.championnat.pilotes[19].coeur; JEU.championnat.pilotes[19].coeur = "technique"; }')
    pg.click('#boutonCalendrier')
    c = pg.evaluate('''() => { const ch = JEU.championnat, lis = [...document.querySelectorAll("#calendrierListe li")];
      return { ecran: JEU.ecran, n: lis.length, faits: lis.filter(li => li.classList.contains("fait")).length, prochain: lis.findIndex(li => li.classList.contains("prochain")), attendu: ch.prochain,
        maisons: document.querySelectorAll("#calendrierListe li.domicile .maison").length, attenduMaisons: ch.calendrier.filter(g => g.circuit === "technique").length, resultats: ch.resultats.length,
        texte: lis.map(li => li.textContent).slice(0, 2), gagnes: ch.resultats.map((r, i) => r.ordre[0] === 19 ? lis[i].textContent : null).filter(x => x), nomJoueur: INTERFACE.nomPilote(ch.pilotes[19]), dans: [...document.querySelectorAll("#calendrier > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
        defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }''')
    t(f'{titre} : « 📅 Calendrier » : les 12 Grands Prix, {c["faits"]} faits (vainqueur et ta place), le prochain mis en valeur, le Grand Prix à domicile marqué d’une maison, tout dans l’écran',
      c['ecran'] == 'calendrier' and c['n'] == 12 and c['faits'] == c['resultats'] and c['prochain'] == c['attendu'] and c['maisons'] == c['attenduMaisons'] and c['maisons'] > 0
      and (c['faits'] == 0 or 'vainqueur' in c['texte'][0] or 'ta victoire' in c['texte'][0]) and all('ta victoire' in x and 'vainqueur' not in x and c['nomJoueur'] not in x for x in c['gagnes']) and c['dans'] and pas_de_defilement(c['defile']), str(c))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#boutonCalendrierRetour')
    pg.evaluate('() => { JEU.championnat.pilotes[19].coeur = JEU.coeurAvant; }')
    t(f'{titre} : « Retour » : le paddock', attendre(pg, '() => JEU.ecran === "championnat"'), str(pg.evaluate('() => JEU.ecran')))

# l'audit anglais (tour 31) : chaque écran ouvert en anglais (?lang=en) ; aucun mot français témoin dans son texte, aucun texte hors de
# l'écran en 960×600, pas de défilement ; une capture *-en.png par écran
FRANCAIS = r"(^|[^A-Za-zÀ-ÿ])(le|la|les|des|du|une|et|est|pour|avec|sans|saison|écurie|retour|victoire|victoires|vainqueur|classement|prochain|arbre|toi|ton|ta|tes|tu|cette|carrière|pilote|écuries|courses|titres|saisons|aucune?|suite|continuer)(?![A-Za-zÀ-ÿ])|[éèêàçù]"
AUDIT_ETAT = '''re => { const id = JEU.ecran === "album" ? "une" : JEU.ecran, el = document.getElementById(id); if (!el) return { id, absent: true };
  let texte = el.innerText.replace(/protégée?/g, "");
  for (const [k, v] of Object.entries(TEXTES.en)) if (/^(circuit_|sponsor_)/.test(k) && typeof v === "string") texte = texte.split(v).join("");   // (les noms propres inventés : circuits, sponsors)
  const m = texte.match(new RegExp(re, "i"));
  const hors = [...el.querySelectorAll("*")].filter(e => e.childElementCount === 0 && e.textContent.trim() && getComputedStyle(e).display !== "none" && e.getClientRects().length)
    .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map(e => e.textContent.trim().slice(0, 40));
  return { id, francais: m ? texte.slice(Math.max(0, m.index - 30), m.index + 40) : null, hors, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def audit_en(pg, titre, l):
    def verifier(nom, js=None):
        if js: pg.evaluate(js)
        pg.wait_for_timeout(150)
        a = pg.evaluate(AUDIT_ETAT, FRANCAIS)
        t(f'{titre} : en anglais, l’écran « {nom} » ({a.get("id")}) : aucun mot français, rien hors de l’écran, sans défilement', not a.get('absent') and not a['francais'] and not a['hors'] and pas_de_defilement(a['defile']), str(a))
        pg.screenshot(path=os.path.join(CAPTURES, nom + '-en.png'))
    verifier('paddock')
    verifier('amis', '() => montrerAmis()'); pg.evaluate('() => montrerChampionnat(null)')
    verifier('garage', '() => montrerGarage()'); verifier('aileron', '() => montrerAileron()'); pg.evaluate('() => { quitterAileron(); quitterGarage(); }')
    verifier('sponsors', '() => montrerSponsors()'); pg.evaluate('() => quitterSponsors()')
    verifier('fiche', '() => montrerFiche(3)'); pg.evaluate('() => quitterFiche()')
    verifier('album', '() => montrerAlbum()'); pg.evaluate('() => quitterAlbum()')
    verifier('calendrier', '() => montrerCalendrier()'); pg.evaluate('() => quitterCalendrier()')
    verifier('arbre', '() => montrerArbre()'); pg.evaluate('() => quitterArbre()')
    verifier('interview', '''() => { const ch = JEU.championnat, o = [0, 1, 2, 3, 19].concat([...Array(20).keys()].filter(k => k > 3 && k < 19));
      const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true, chocMax: 0 })); JEU.lignesGP = lignes; montrerInterview(INTERVIEW.question(ch, lignes)); }''')
    verifier('une', '() => montrerUne(JEU.championnat.album[JEU.championnat.album.length - 1])')
    pg.evaluate('() => { JEU.lignesGP = null; SAISONS.avancer(JEU.championnat, 1); montrerFinSaison(); }')
    verifier('ceremonie'); pg.evaluate('() => suiteCeremonie()')
    verifier('saison'); pg.evaluate('() => suiteClassementSaison()')
    verifier('duel-saison'); pg.evaluate('() => suiteDuelSaison()')
    verifier('contrats')
    verifier('bilan', '() => prendreRetraite()')
    verifier('temple', '() => montrerTemple()'); pg.evaluate('() => quitterTemple()')
    verifier('arbre-bilan', '() => montrerArbre()'); pg.evaluate('() => quitterArbre()')
    verifier('releve', '() => montrerHeritier()')

def une_ecran(pg, titre, capture, touche=False):
    ph = pg.evaluate(PHOTO_ETAT, None)
    t(f'{titre} : la photo de la une est dessinée par le code ({ph and ph["type"]}), visible, pas d’une seule couleur, la même que celle de la une compacte', bool(ph) and ph['couleurs'] > 8 and ph['pareil'] and ph['visible'], str(ph))
    if capture == 'une.png': pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'une-photo.png'))
    u = pg.evaluate(UNE)
    t(f'{titre} : la une du journal : le nom du journal, le grand titre et le petit texte de la dernière une de l’album (fait « {u["fait"]} »), rendus avec les noms de l’affichage',
      u['ecran'] == 'une' and u['visible'] and u['nom'] == u['attenduNom'] and u['nom'] != '' and u['titre'] == u['attenduTitre'] and len(u['titre']) > 5 and u['texte'] == u['attenduTexte'] and len(u['texte']) > 10, str(u)[:600])
    t(f'{titre} : la une : 2 ou 3 brèves sur le côté, le classement (5 premiers + le joueur, le joueur marqué), la place de la photo vide, « clique ou appuie sur une touche »',
      u['breves'] == u['attenduBreves'] and 2 <= len(u['breves']) <= 3 and u['classement'] and len(u['classement']) == u['attenduClassement'] and 5 <= len(u['classement']) <= 6 and u['moi'] == 1
      and u['photo'] == '' and u['passer'] != '', str(u)[:600])
    t(f'{titre} : la une tient dans sa page (rien ne déborde, rien n’est coupé) et la page ne défile pas', all(u['dedans']) and not u['coupe'] and u['defile'][0] <= u['defile'][1] + 2 and u['defile'][2] <= u['defile'][3] + 2, str([u['dedans'], u['coupe'], u['defile']]))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, capture))
    if touche: pg.keyboard.press('Enter')
    else: pg.click('#uneTitre')
    t(f'{titre} : {"une touche" if touche else "un clic"} passe la une : l’écran du championnat', attendre(pg, '() => JEU.ecran === "championnat" && !document.getElementById("championnat").classList.contains("cache") && document.getElementById("une").classList.contains("cache")'), str(pg.evaluate('() => JEU.ecran')))
    return u

# ?championnat=1 : le garage (garage.js) depuis l'écran du championnat : on crédite de quoi acheter (en mémoire), on achète un niveau
# de moteur : le solde baisse du prix, le niveau monte, c'est sauvegardé ; capture garage.png ; « Retour » ramène au championnat
GARAGE_ETAT = '''() => { const ch = JEU.championnat, lis = [...document.querySelectorAll("#garageListe li")];
  return { ecran: JEU.ecran, visible: !document.getElementById("garage").classList.contains("cache"), n: lis.length, noms: lis.map(li => li.dataset.nom),
    actifs: lis.map(li => !li.querySelector("button").disabled), niveaux: lis.map(li => li.querySelector(".niveau").textContent), prix: lis.map(li => li.querySelector(".prix").textContent),
    solde: ch.argent.solde, soldeTexte: document.getElementById("garageSolde").textContent, bonus: document.getElementById("garageBonus").textContent, garage: Object.assign({}, ch.garage),
    sauve: SAUVEGARDE.championnat() && { garage: SAUVEGARDE.championnat().garage, solde: SAUVEGARDE.championnat().argent.solde },
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
# ?championnat=1 : les sponsors (sponsors.js) : au paddock « Pas encore de sponsor », le bouton « Sponsors » ouvre les offres (2 à 4),
# « Choisir » la première : le rappel au paddock, le montant crédité, sauvegardé ; la fiche d'un rival (fiche.js) au clic sur son nom
SPONSORS_ETAT = '''() => { const ch = JEU.championnat, lis = [...document.querySelectorAll("#sponsorsListe > li")], o = SPONSORS.offres(ch); return { ecran: JEU.ecran, n: lis.length, cles: lis.map(li => li.dataset.sponsor),
  offres: o.map(x => x.cle), boutons: lis.map(li => !!li.querySelector("button.choisir")), objectifs: lis.map(li => li.querySelectorAll(".objectifs li").length), montant0: o.length ? o[0].montant : 0,
  solde: ch.argent.solde, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def sponsors_ecran(pg, titre, capture):
    r0 = pg.evaluate('() => document.getElementById("championnatSponsor").textContent')
    t(f'{titre} : au paddock, « Pas encore de sponsor »', r0 == 'Pas encore de sponsor', r0)
    pg.click('#boutonSponsors')
    e = pg.evaluate(SPONSORS_ETAT)
    t(f'{titre} : « Sponsors » : les offres (2 à 4, celles de SPONSORS.offres, chacune avec ses objectifs et « Choisir »), sans défilement',
      e['ecran'] == 'sponsors' and 2 <= e['n'] <= 4 and e['cles'] == e['offres'] and all(e['boutons']) and all(x >= 1 for x in e['objectifs']) and pas_de_defilement(e['defile']), str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#sponsorsListe > li:first-child button.choisir')
    r = pg.evaluate("""() => { const ch = JEU.championnat; return { ecran: JEU.ecran, sponsor: ch.sponsor && ch.sponsor.cle, rappel: document.getElementById("championnatSponsor").textContent, solde: ch.argent.solde,
      sauve: SAUVEGARDE.championnat().sponsor && SAUVEGARDE.championnat().sponsor.cle, nom: ch.sponsor ? texte("sponsor_" + ch.sponsor.cle) : "" }; }""")
    t(f'{titre} : « Choisir » : retour au paddock avec le rappel « Sponsor : <nom> · objectifs », le montant crédité, sauvegardé',
      r['ecran'] == 'championnat' and r['sponsor'] == e['cles'][0] and r['rappel'].startswith('Sponsor : ' + r['nom']) and ' / ' in r['rappel'] and r['solde'] == e['solde'] + e['montant0'] and r['sauve'] == r['sponsor'], str(r))
    pg.click('#boutonSponsors')
    t(f'{titre} : « Sponsors » une fois signé : le sponsor et l’avancement de ses objectifs, sans bouton « Choisir » ; « Retour »',
      pg.evaluate('() => JEU.ecran === "sponsors" && document.querySelectorAll("#sponsorsListe > li").length === 1 && !document.querySelector("#sponsorsListe button.choisir") && /0 \\/ \\d/.test(document.getElementById("sponsorsListe").textContent)'),
      pg.evaluate('() => document.getElementById("sponsorsListe").textContent')[:200])
    pg.click('#boutonSponsorsRetour')
    t(f'{titre} : « Retour » ramène au paddock', attendre(pg, '() => JEU.ecran === "championnat"'))

FICHE_ETAT = '''k => { const ch = JEU.championnat, f = FICHE.fiche(ch, k), p = ch.pilotes[k], $ = id => document.getElementById(id).textContent; return { ecran: JEU.ecran, nom: $("ficheNom"), attenduNom: INTERFACE.nomPilote(p),
  infos: $("ficheInfos"), numero: p.numero, age: p.age, caractere: $("ficheCaractere"), mots: f.mots.map(m => texte("caractere_" + m)), saison: $("ficheSaison"), place: f.saison.place, points: f.saison.points, courses: f.saison.courses,
  historique: $("ficheHistorique"), duels: $("ficheDuels"), rivalite: $("ficheRivalite"), devant: f.duels.devant, derriere: f.duels.derriere, photo: document.getElementById("fichePhoto").getBoundingClientRect().width,
  defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def fiche_ecran(pg, titre, capture):
    pg.click('#championnatPilotes li[data-k="3"] .nom')
    f = pg.evaluate(FICHE_ETAT, 3)
    t(f'{titre} : un clic sur un rival ouvre sa fiche : nom, numéro, écurie, âge, caractère en mots, saison (place, points), historique, duels contre le joueur, la place de la photo, sans défilement',
      f['ecran'] == 'fiche' and f['nom'] == f['attenduNom'] and f['nom'] != '' and str(f['numero']) in f['infos'] and (str(f['age']) + ' ans') in f['infos'] and f['caractere'] == 'Caractère : ' + ', '.join(f['mots'])
      and (f['saison'].startswith(f'Cette saison : P{f["place"]} · {f["points"]} pts') if f['courses'] else f['saison'] == 'Cette saison : pas encore de course, pas encore de classement') and f['historique'].startswith('Carrière : ') and f['duels'] == f'Contre toi : devant {f["devant"]} fois, derrière {f["derriere"]} fois' and f['photo'] > 50 and f['rivalite'] == '' and pas_de_defilement(f['defile']), str(f))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    fp = pg.evaluate('''() => { const cv = document.querySelector("#fichePhoto canvas"); if (!cv) return null; const px = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data, c = new Set();
      for (let k = 0; k < px.length; k += 4 * 31) c.add(px[k] + "," + px[k + 1] + "," + px[k + 2]); const r = cv.getBoundingClientRect(); return { couleurs: c.size, visible: r.width > 40 && r.height > 40 }; }''')
    t(f'{titre} : la fiche du rival a sa photo stylisée (son casque, sa voiture aux couleurs de son écurie), dessinée par le code', bool(fp) and fp['couleurs'] > 8 and fp['visible'], str(fp))
    pg.click('#boutonFicheRetour')
    t(f'{titre} : « Retour » ramène au paddock ; un clic sur le joueur n’ouvre rien', attendre(pg, '() => JEU.ecran === "championnat"') and pg.evaluate('() => { const moi = document.querySelector("#championnatPilotes li.moi"); moi.click(); return JEU.ecran === "championnat" && !moi.dataset.k; }'))

# l'aileron (tour 29c) : depuis le garage, « 🪽 Aileron » : la carte de la prochaine course (dessinée), le curseur au milieu, les deux
# barres ; un cran choisi bouge les barres et l'aileron, il est gardé pour CE circuit et sauvegardé ; aucun conseil ; « Retour » : le garage
AILERON_ETAT = '''() => { const $ = id => document.getElementById(id), ch = JEU.championnat, nom = circuitProchain(), cv = $("aileronCarte"), px = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
  let clairs = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > 200 && px[i + 1] > 200 && px[i + 2] > 200) clairs++;
  return { ecran: JEU.ecran, titre: $("aileronTitre").textContent, nom, curseur: Number($("aileronCurseur").value), cran: $("aileronCran").textContent, virages: $("barreVirages").style.width, vitesse: $("barreVitesse").style.width,
    sauve: SAUVEGARDE.championnat().ailerons ? SAUVEGARDE.championnat().ailerons[nom] : undefined, clairs, texte: $("aileron").textContent,
    dans: [...document.querySelectorAll("#aileron > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def aileron_ecran(pg, titre, capture, cran):
    pg.click('#boutonAileron')
    a = pg.evaluate(AILERON_ETAT)
    t(f'{titre} : « 🪽 Aileron » : la carte de la prochaine course ({a["nom"]}) dessinée, le curseur au milieu (cran 3 / 5), les barres à 50 %, sans conseil, tout dans l’écran',
      a['ecran'] == 'aileron' and a['curseur'] == 2 and a['cran'] == 'Cran 3 / 5' and a['virages'] == '50%' and a['vitesse'] == '50%' and a['clairs'] > 300
      and not any(m in a['texte'].lower() for m in ('conseil', 'recommand', 'ingénieur')) and a['dans'] and pas_de_defilement(a['defile']), str(a))
    pg.evaluate(f'() => {{ const c = document.getElementById("aileronCurseur"); c.value = {cran}; c.dispatchEvent(new Event("input")); }}')
    b = pg.evaluate(AILERON_ETAT)
    t(f'{titre} : le cran {cran + 1} : les barres bougent (virages {b["virages"]}, vitesse {b["vitesse"]}), gardé pour {b["nom"]} et sauvegardé',
      b['curseur'] == cran and b['sauve'] == cran and b['virages'] == f'{cran * 25}%' and b['vitesse'] == f'{100 - cran * 25}%', str(b))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#boutonAileronRetour')
    t(f'{titre} : « Retour » ramène au garage', attendre(pg, '() => JEU.ecran === "garage"'), str(pg.evaluate('() => JEU.ecran')))

def garage_ecran(pg, titre, achat=True, capture='garage.png'):
    if achat: pg.evaluate('() => ARGENT.crediter(JEU.championnat, 200000, "test")')
    pg.click('#boutonGarage')
    e = pg.evaluate(GARAGE_ETAT)
    t(f'{titre} : « Garage » ouvre le garage : 4 améliorations (roues, moteur, aero, freins) au niveau 0, leur prix, le solde, le bonus de la voiture, sans défilement',
      e['ecran'] == 'garage' and e['visible'] and e['noms'] == ['roues', 'moteur', 'aero', 'freins'] and all('0 / 5' in n for n in e['niveaux']) and e['soldeTexte'] == 'Solde : ' + pg.evaluate('() => ARGENT.formater(JEU.championnat.argent.solde)')
      and e['bonus'] == 'Voiture de l’écurie : ' + str(pg.evaluate('() => Math.round(JEU.championnat.ecuries[JEU.championnat.pilotes[19].ecurie].niveau * 100)')) + ' / 100 · tes améliorations : +0,0 % / 7 % maxi' and e['defile'][0] <= e['defile'][1] + 2 and e['defile'][2] <= e['defile'][3] + 2, str(e))
    if not achat:
        t(f'{titre} : sans argent, tous les boutons « Acheter » sont grisés', not any(e['actifs']), str(e['actifs']))
    else:
        t(f'{titre} : avec de l’argent, « Acheter » est actif', all(e['actifs']), str(e['actifs']))
        prix = pg.evaluate('() => REGLAGES.GARAGE.moteur.prix[0]')
        pg.click('#garageListe li[data-nom="moteur"] button')
        e2 = pg.evaluate(GARAGE_ETAT)
        t(f'{titre} : acheter le moteur : le solde baisse du prix ({prix}), le niveau passe à 1 / 5, le prix suivant s’affiche, le bonus monte, et c’est sauvegardé',
          e2['solde'] == e['solde'] - prix and e2['garage']['moteur'] == 1 and '1 / 5' in e2['niveaux'][1] and e2['prix'][1] != e['prix'][1] and 'tes améliorations : +0,5 %' in e2['bonus']
          and e2['sauve'] and e2['sauve']['garage']['moteur'] == 1 and e2['sauve']['solde'] == e2['solde'], str(e2))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, capture))
    aileron_ecran(pg, titre, 'aileron.png' if capture == 'garage.png' else 'aileron-960.png', 4 if capture == 'garage.png' else 0)
    pg.click('#boutonGarageRetour')
    t(f'{titre} : « Retour » ramène à l’écran du championnat, avec le solde à jour', attendre(pg, '() => JEU.ecran === "championnat" && document.getElementById("garage").classList.contains("cache")')
      and pg.evaluate('() => document.getElementById("championnatArgent").textContent === "Solde : " + ARGENT.formater(JEU.championnat.argent.solde)'), str(pg.evaluate('() => [JEU.ecran, document.getElementById("championnatArgent").textContent]')))

# ?championnat=1&gp=12 : un championnat neuf arrive au 12e Grand Prix (les 11 premiers joués d'avance par SAISONS.avancer) ; après le
# 12e : le classement final et le champion, le duel de la saison, les contrats, la signature → saison 2 ; en 960 : le 12e est fabriqué,
# les écrans tiennent, et « Prendre ma retraite » (deux clics) mène à « Carrière terminée »
SAISON_ETAT = '''() => { const ch = JEU.championnat, $ = id => document.getElementById(id), b = SAISONS.bilan(ch); return { ecran: JEU.ecran, saison: ch.saison, prochain: ch.prochain,
  titre: $("saisonTitre").textContent, champion: $("saisonChampion").textContent, ecurie: $("saisonEcurie").textContent, lignes: document.querySelectorAll("#saisonPilotes li").length,
  moi: document.querySelectorAll("#saisonPilotes li.moi").length, premier: document.querySelector("#saisonPilotes li.champion .nom").textContent, attenduChampion: INTERFACE.nomPilote(ch.pilotes[b.champion]), humain: ch.pilotes[b.champion].humain,
  saisons: ch.saisons.length, sauve: SAUVEGARDE.championnat() ? SAUVEGARDE.championnat().saisons.length : -1, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
DUEL_SAISON_ETAT = '''() => { const ch = JEU.championnat, s = CHAMPIONNAT.scoreDuel(ch), nom = INTERFACE.nomPilote(ch.pilotes[s.k]), a = s.total[0], b = s.total[1];
  return { ecran: JEU.ecran, score: document.getElementById("duelSaisonScore").textContent, detail: document.getElementById("duelSaisonDetail").textContent, nom, a, b,
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
CONTRATS_ETAT = '''() => { const ch = JEU.championnat, o = SAISONS.offres(ch), lis = [...document.querySelectorAll("#contratsListe li")]; return { ecran: JEU.ecran, note: SAISONS.note(ch),
  texteNote: document.getElementById("contratsNote").textContent, n: lis.length, offres: o.map(x => x.ecurie), ecuries: lis.map(li => Number(li.dataset.ecurie)), actuelle: ch.pilotes[19].ecurie,
  bouton: document.getElementById("boutonRetraite").textContent, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
RETRAITE_ETAT = '''() => { const ch = JEU.championnat; return { ecran: JEU.ecran, retraite: ch.retraite, bilan: document.getElementById("retraiteBilan").textContent, raison: document.getElementById("retraiteRaison").textContent,
  sauve: SAUVEGARDE.championnat().retraite && SAUVEGARDE.championnat().retraite.raison, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
SAISON2_ETAT = '''() => { const ch = JEU.championnat, j = ch.pilotes[19]; return { ecran: JEU.ecran, saison: ch.saison, prochain: ch.prochain, ecurie: j.ecurie, titre: document.getElementById("championnatTitre").textContent,
  garage: JSON.stringify(ch.garage), solde: ch.argent.solde, coequipier: CHAMPIONNAT.coequipierDe(ch).id, duel: CHAMPIONNAT.scoreDuel(ch).total, deux: ch.ecuries.every(e => ch.pilotes.filter(p => p.ecurie === e.id).length === 2),
  sauve: SAUVEGARDE.championnat().saison, contrats: ch.contrats, gagne: document.getElementById("championnatGagne").textContent, pilotesLi: document.querySelectorAll("#championnatPilotes li").length, zero: ch.pilotes.every(p => p.stats.points === 0) }; }'''
def pas_de_defilement(d): return d[0] <= d[1] + 2 and d[2] <= d[3] + 2
# la cérémonie du champion (tour 28c) : l'écran, le podium 3D (le champion seul en haut), les confettis (un seul appel de dessin), Poki arrêté
CEREMONIE_ETAT = '''() => { const ch = JEU.championnat, $ = id => document.getElementById(id), b = SAISONS.bilan(ch), c = PODIUM3D.confettis;
  SCENE3D.dessiner(); const avec = SCENE3D.appelsDessin, vus = c && c.visible;
  if (c) { c.visible = false; SCENE3D.dessiner(); c.visible = vus; }
  const sans = SCENE3D.appelsDessin; SCENE3D.dessiner();
  return { ecran: JEU.ecran, titre: $("ceremonieTitre").textContent, nom: $("ceremonieNom").textContent, detail: $("ceremonieDetail").textContent, court: $("ceremonie").classList.contains("court"),
    champion: INTERFACE.nomPilote(ch.pilotes[b.champion]), humain: !!ch.pilotes[b.champion].humain, visibles: JEU.modeles.filter(m => m.groupe.visible).length, championVisible: !!(JEU.modeles[b.champion] && JEU.modeles[b.champion].groupe.visible),
    hauteur: JEU.modeles[b.champion] ? JEU.modeles[b.champion].groupe.position.y : null, marche: REGLAGES.PODIUM_HAUTEURS[0], confettis: !!vus, n: c ? c.geometry.attributes.position.count : 0, appels: [avec, sans],
    y0: c ? c.geometry.attributes.position.array[1] : null, enJeu: SDK.enJeu, vue: ch.saisons[ch.saisons.length - 1].ceremonie, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
# un championnat fabriqué cohérent où le joueur (19) est champion : n Grands Prix joués d'avance avec de vraies places (il gagne un
# Grand Prix sur deux, il est 2e sinon, derrière le pilote 0 puis le 1) ; les points, victoires, album et argent en découlent ; il
# remplace le championnat de la page (le même objet) et il est sauvegardé
FABRIQUER_CHAMPION = '''n => { const ch = CHAMPIONNAT.creer(JEU.championnat.graine); ch.pilotes[19].casque = JEU.championnat.pilotes[19].casque; ch.pilotes[19].nom = 'Marco Rossi'; ch.pilotes[19].pays = 'it'; ch.pilotes[19].coeur = 'monzo'; CASQUE.completer(ch); CARRIERE.completer(ch);
  for (let g = 0; g < n; g++) { const tete = g % 2 ? [19, 0] : [g % 4 ? 1 : 0, 19], o = tete.concat([...Array(20).keys()].filter(k => !tete.includes(k)));
    const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true }));
    CHAMPIONNAT.enregistrerCourse(ch, lignes); JOURNAL.ranger(ch, JOURNAL.composer(ch, lignes)); ARGENT.encaisser(ch, lignes); }
  for (const k of Object.keys(JEU.championnat)) delete JEU.championnat[k];
  Object.assign(JEU.championnat, ch); SAUVEGARDE.ecrireChampionnat(JEU.championnat); }'''
def ceremonie_ecran(pg, titre, toi, capture):
    e = pg.evaluate(CEREMONIE_ETAT)
    t(f'{titre} : la cérémonie de fin de saison, avant le classement final : le champion seul sur la plus haute marche du podium 3D, Poki arrêté (gameplayStop), sans défilement',
      e['ecran'] == 'ceremonie' and e['humain'] == toi and e['visibles'] == 1 and e['championVisible'] and abs(e['hauteur'] - e['marche']) < 1e-6 and not e['enJeu'] and e['vue'] == 1 and pas_de_defilement(e['defile']), str(e))
    if toi:
        t(f'{titre} : le joueur champion : « CHAMPION DU MONDE », son nom, ses points ; {e["n"]} confettis faits par le code en UN seul appel de dessin ({e["appels"][0]} appels avec, {e["appels"][1]} sans)',
          e['titre'] == 'CHAMPION DU MONDE' and e['nom'] == e['champion'] and 'points' in e['detail'] and not e['court'] and e['confettis'] and e['n'] == pg.evaluate('() => REGLAGES.CEREMONIE_CONFETTIS') and e['appels'][0] - e['appels'][1] == 1, str(e))
        pg.wait_for_timeout(400)
        t(f'{titre} : les confettis tombent', pg.evaluate('() => PODIUM3D.confettis.geometry.attributes.position.array[1]') != e['y0'])
    else:
        t(f'{titre} : un rival champion : l’écran court « {e["champion"]} est champion du monde », sans confettis, la place du joueur', e['court'] and e['titre'] == e['champion'] + ' est champion du monde' and e['nom'] == '' and not e['confettis'] and 'tu finis P' in e['detail'] and e['appels'][0] == e['appels'][1], str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#boutonCeremonieSuite')

# le bilan de carrière et le temple de la renommée (tour 28c, carriere.js) : après la retraite, le bilan (9 cases, les duels, la une
# préférée, la place au temple) tient dans l'écran ; « Temple de la renommée » : la carrière y est (marquée), les records ; « Retour »
BILAN_ETAT = '''() => { const ch = JEU.championnat, b = CARRIERE.bilan(ch), $ = id => document.getElementById(id), u = b.une === null ? null : JOURNAL.rendreAlbum(ch, b.une, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie });
  return { ecran: JEU.ecran, cases: [...document.querySelectorAll("#bilanStats li")].map(li => [li.children[0].textContent, li.children[1].textContent]), b: { saisons: b.saisons, titres: b.titres, victoires: b.victoires, podiums: b.podiums },
    duels: $("bilanDuels").textContent, une: $("bilanUne").textContent, attenduUne: u ? u.titre : null, temple: $("bilanTemple").textContent, bouton: $("boutonTemple").textContent,
    dans: [...document.querySelectorAll("#retraite > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
    sauve: SAUVEGARDE.temple().carrieres.length, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def bilan_temple(pg, titre):
    e = pg.evaluate(BILAN_ETAT)
    vals = dict(e['cases'])
    t(f'{titre} : le bilan de carrière : 9 cases (saisons, titres, victoires, podiums…) justes, les duels contre les coéquipiers, la une préférée (redessinée), la place au temple, tout dans l’écran',
      e['ecran'] == 'retraite' and len(e['cases']) == 9 and vals.get('Saisons') == str(e['b']['saisons']) and vals.get('Titres') == str(e['b']['titres']) and vals.get('Victoires') == str(e['b']['victoires'])
      and vals.get('Podiums') == str(e['b']['podiums']) and e['duels'].startswith('Duels contre les coéquipiers : ') and (e['attenduUne'] is None or e['attenduUne'] in e['une'])
      and pg.evaluate('() => !!document.querySelector("#retraiteTitre canvas#bilanCasque")') and e['temple'] == 'Temple de la renommée : 1 sur 1' and e['sauve'] == 1 and e['bouton'] == '🏛 Temple de la renommée' and e['dans'] and pas_de_defilement(e['defile']), str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'bilan.png'))
    pg.click('#boutonTemple')
    tp = pg.evaluate('''() => ({ ecran: JEU.ecran, lignes: [...document.querySelectorAll("#templeListe li")].map(li => li.textContent), moi: document.querySelectorAll("#templeListe li.moi").length,
      records: [...document.querySelectorAll("#templeRecords li")].map(li => li.textContent), nom: INTERFACE.nomPilote(JEU.championnat.pilotes[19]),
      defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })''')
    t(f'{titre} : le temple de la renommée : la carrière finie en 1re place, marquée, avec ses titres et victoires ; les records de carrière à son nom',
      tp['ecran'] == 'temple' and len(tp['lignes']) == 1 and tp['moi'] == 1 and tp['lignes'][0].startswith('1' + tp['nom']) and 'victoire' in tp['lignes'][0] and len(tp['records']) >= 6 and all(tp['nom'] in r for r in tp['records']) and pas_de_defilement(tp['defile']), str(tp))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'temple.png'))
    pg.click('#boutonTempleRetour')
    t(f'{titre} : « Retour » ramène au bilan ; rechargée, la page revient au bilan sans entrer deux fois au temple', pg.evaluate('() => JEU.ecran') == 'retraite')
    pg.reload()
    t(f'{titre} : (rechargement) le bilan, le temple toujours à 1 carrière', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "retraite" && SAUVEGARDE.temple().carrieres.length === 1', None, 60000), str(pg.evaluate('() => typeof JEU !== "undefined" && [JEU.ecran, SAUVEGARDE.temple().carrieres.length]')))

# la relève (tour 28c) : depuis le bilan, « Continuer la dynastie » : l'écran de l'héritier (le parent nommé, le nom de famille gardé,
# les quatre liens, le motif aux couleurs du parent, l'arbre) ; Léa, « fille », n° libre → le paddock de la saison 2, le même monde ;
# le premier Grand Prix (joué d'avance) : la une « La fille de Marco Rossi débarque »
def releve(pg, titre):
    t(f'{titre} : le bilan propose « 👪 Continuer la dynastie » et « ✨ Nouvelle dynastie » ; les records de famille', pg.evaluate('() => document.getElementById("boutonContinuerDynastie").textContent === "👪 Continuer la dynastie" && document.getElementById("boutonNouvelleDynastie").textContent === "✨ Nouvelle dynastie" && document.getElementById("bilanFamille").textContent.startsWith("Records de famille : 1 génération")'), pg.evaluate('() => document.getElementById("bilanFamille").textContent'))
    avant = pg.evaluate('() => ({ ecuries: JEU.championnat.ecuries.map(e => e.couleur), rivaux: JEU.championnat.pilotes.filter(p => !p.humain).map(p => p.id + ":" + p.numero), saison: JEU.championnat.saison, casque: JSON.stringify(JEU.championnat.pilotes[19].casque) })')
    pg.click('#boutonContinuerDynastie')
    h = pg.evaluate('''() => ({ ecran: JEU.ecran, parent: document.getElementById("heritierParent").textContent, famille: document.getElementById("heritierFamille").textContent,
      liens: [...document.querySelectorAll("#heritierLien option")].map(o => o.textContent), motif: document.getElementById("heritierMotif").value, attenduMotif: JEU.championnat.pilotes[19].casque.motif,
      pays: document.getElementById("heritierPays").value, arbre: document.querySelectorAll("#arbreListe li").length,
      dans: [...document.querySelectorAll("#heritier > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
      defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })''')
    t(f'{titre} : l’écran de l’héritier : « Prendre la suite de Marco Rossi », le nom de famille Rossi, les 4 liens accordés, le motif et le pays du parent, l’arbre, tout dans l’écran',
      h['ecran'] == 'heritier' and h['parent'] == 'Prendre la suite de Marco Rossi' and h['famille'] == 'Nom de famille : Rossi' and h['liens'] == ['fils de Marco Rossi', 'fille de Marco Rossi', 'protégé de Marco Rossi', 'protégée de Marco Rossi']
      and h['motif'] == h['attenduMotif'] and h['pays'] == 'it' and h['arbre'] == 1 and h['dans'] and pas_de_defilement(h['defile']), str(h))
    mo = pg.evaluate('() => ({ options: [...document.querySelectorAll("#heritierMotif option")].map(o => [o.value, o.disabled]), tous: CASQUE.tousLesMotifs(), debloques: SAUVEGARDE.motifs() })')
    t(f'{titre} : l’éditeur de l’héritier propose tous les motifs, les débloqués permis, les autres grisés avec leur condition', [o[0] for o in mo['options']] == mo['tous'] and all(o[1] == (o[0] not in pg.evaluate('() => REGLAGES.CASQUE_MOTIFS') and o[0] not in mo['debloques']) for o in mo['options']), str(mo))
    pg.click('#boutonHeritierValider')
    t(f'{titre} : sans prénom, l’héritier est refusé (message)', pg.evaluate('() => JEU.ecran === "heritier" && document.getElementById("heritierErreur").textContent !== ""'))
    pg.fill('#heritierPrenom', 'Léa'); pg.select_option('#heritierLien', 'fille')
    t(f'{titre} : le message d’erreur part dès que le prénom est corrigé', pg.evaluate('() => document.getElementById("heritierErreur").textContent === ""'))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'releve.png'))
    pg.click('#boutonHeritierValider')
    s = pg.evaluate('''() => { const ch = JEU.championnat, j = ch.pilotes[19], faible = ch.ecuries.slice().sort((a, b) => a.niveau - b.niveau || b.id - a.id)[0].id;
      return { ecran: JEU.ecran, saison: ch.saison, prochain: ch.prochain, nom: j.nom, ecurie: j.ecurie, faible, garage: Object.values(ch.garage).every(x => x === 0), solde: ch.argent.solde, stats: j.stats.courses + j.stats.victoires,
        gens: ch.dynastie.generations.length, lien: ch.dynastie.lien, couleurs: JSON.stringify(j.casque.couleurs), sauve: SAUVEGARDE.championnat().saison, retraite: ch.retraite,
        ecuries: ch.ecuries.map(e => e.couleur), titre: document.getElementById("championnatTitre").textContent }; }''')
    t(f'{titre} : « C’est parti ! » : Léa Rossi, la fille, au paddock de la saison {avant["saison"] + 1} (Grand Prix 1), le même monde (les mêmes écuries), dans la plus petite écurie, sans garage ni argent, sauvegardé',
      s['ecran'] == 'championnat' and s['saison'] == avant['saison'] + 1 and s['prochain'] == 0 and s['nom'] == 'Léa Rossi' and s['ecurie'] == s['faible'] and s['garage'] and s['solde'] == 0 and s['stats'] == 0
      and s['gens'] == 1 and s['lien'] == 'fille' and s['couleurs'] == json_couleurs(avant['casque']) and s['sauve'] == s['saison'] and s['retraite'] is None and s['ecuries'] == avant['ecuries'] and s['titre'].startswith('Grand Prix 1 / 12'), str(s))
    # l'arbre de la dynastie au paddock (tour 29c) : les deux générations, Léa en piste, les records de famille ; « Retour »
    pg.click('#boutonArbre')
    ar = pg.evaluate('''() => ({ ecran: JEU.ecran, lignes: [...document.querySelectorAll("#arbreGenerations li")].map(li => li.textContent), actuel: document.querySelectorAll("#arbreGenerations li.actuel").length,
      casques: document.querySelectorAll("#arbreGenerations canvas").length, famille: document.getElementById("arbreFamille").textContent, circuits: document.getElementById("arbreCircuits").textContent,
      dans: [...document.querySelectorAll("#arbre > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
      defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })''')
    t(f'{titre} : « 🌳 Arbre de la dynastie » au paddock : Marco Rossi puis Léa Rossi (en piste), leurs casques, les records de famille (2 générations), tout dans l’écran',
      ar['ecran'] == 'arbre' and len(ar['lignes']) == 2 and 'Marco Rossi' in ar['lignes'][0] and 'Léa Rossi' in ar['lignes'][1] and 'en piste' in ar['lignes'][1] and ar['actuel'] == 1 and ar['casques'] == 2
      and ar['famille'].startswith('Records de famille : 2 générations') and ar['circuits'].startswith('Victoires de la famille par circuit') and ar['dans'] and pas_de_defilement(ar['defile']), str(ar))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'arbre.png'))
    pg.click('#boutonArbreRetour')
    t(f'{titre} : « Retour » : le paddock', attendre(pg, '() => JEU.ecran === "championnat"'), str(pg.evaluate('() => JEU.ecran')))
    pg.evaluate('() => { SAISONS.avancer(JEU.championnat, 1); montrerUne(JEU.championnat.album[JEU.championnat.album.length - 1]); }')
    u = pg.evaluate('() => ({ f: JEU.championnat.album[JEU.championnat.album.length - 1].f, titre: document.getElementById("uneTitre").textContent })')
    t(f'{titre} : le premier Grand Prix de l’héritière : la une de la relève (« {u["titre"]} »), accordée au lien, le parent nommé', u['f'] == 'releve_fille' and 'Marco Rossi' in u['titre'] and ('fille' in u['titre']), str(u))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'releve-une.png'))

def json_couleurs(casque):
    import json
    return json.dumps(json.loads(casque)['couleurs'], separators=(',', ':'))

def fin_saison(pg, titre, l):
    t(f'{titre} : ?gp=12 : un championnat neuf arrive au Grand Prix 12 / 12, les 11 premiers joués d’avance (résultats, album, argent)',
      pg.evaluate('() => JEU.ecran === "championnat" && JEU.championnat.prochain === 11 && JEU.championnat.resultats.length === 11 && JEU.championnat.album.length === 11 && JEU.championnat.argent.solde > 0 && document.getElementById("championnatTitre").textContent.startsWith("Grand Prix 12 / 12")'),
      str(pg.evaluate('() => [JEU.ecran, JEU.championnat.prochain, document.getElementById("championnatTitre").textContent]')))
    if l != 1280:
        # en petit : le 12e Grand Prix fabriqué en mémoire, puis les écrans ; à la fin, la retraite anticipée
        pg.evaluate('() => { SAISONS.avancer(JEU.championnat, 1); montrerFinSaison(); }')
        # la cérémonie : d'abord l'écran court d'un rival champion (le robot n'a pas joué : un rival a le titre) ...
        rival = pg.evaluate('() => !JEU.championnat.pilotes[SAISONS.bilan(JEU.championnat).champion].humain')
        t(f'{titre} : le 12e fabriqué : un rival est champion', rival)
        ceremonie_ecran(pg, titre, False, 'ceremonie-rival-960.png')
        # ... puis la vraie cérémonie : un championnat fabriqué cohérent (12 Grands Prix, le joueur en gagne 6 et finit 2e des 6 autres : 258 points)
        pg.evaluate(f'() => {{ ({FABRIQUER_CHAMPION})(12); montrerFinSaison(); }}')
        e = pg.evaluate(CEREMONIE_ETAT)
        t(f'{titre} : la cérémonie du joueur champion tient en 960×600 : « CHAMPION DU MONDE », son nom, « 258 points · 6 victoires », les confettis (un appel de dessin)', e['ecran'] == 'ceremonie' and e['titre'] == 'CHAMPION DU MONDE' and e['nom'] == pg.evaluate('() => INTERFACE.nomPilote(JEU.championnat.pilotes[19])') and e['detail'].startswith('258 points · 6 victoires') and e['confettis'] and e['appels'][0] - e['appels'][1] == 1 and pas_de_defilement(e['defile']), str(e))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'ceremonie-960.png'))
        pg.click('#boutonCeremonieSuite')
        e = pg.evaluate(SAISON_ETAT)
        t(f'{titre} : le classement final de la saison tient en 960×600 (20 lignes, le champion en tête, le joueur marqué)', e['ecran'] == 'saison' and e['lignes'] == 20 and e['moi'] == 1 and e['premier'] == e['attenduChampion'] and pas_de_defilement(e['defile']), str(e))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'champion-960.png'))
        pg.click('#boutonSaisonSuite')
        d = pg.evaluate(DUEL_SAISON_ETAT)
        t(f'{titre} : le duel de la saison tient en 960×600', d['ecran'] == 'duelSaison' and d['nom'] in d['score'] and pas_de_defilement(d['defile']), str(d))
        pg.click('#boutonDuelSaisonSuite')
        c = pg.evaluate(CONTRATS_ETAT)
        t(f'{titre} : les contrats tiennent en 960×600, au moins une offre', c['ecran'] == 'contrats' and c['n'] >= 1 and c['n'] == len(c['offres']) and pas_de_defilement(c['defile']), str(c))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'contrats-960.png'))
        pg.click('#boutonRetraite')
        t(f'{titre} : « Prendre ma retraite » demande d’abord une confirmation', pg.evaluate('() => JEU.ecran === "contrats" && document.getElementById("boutonRetraite").textContent === texte("retraiteConfirmer")'), pg.evaluate('() => document.getElementById("boutonRetraite").textContent'))
        pg.click('#boutonRetraite')
        r = pg.evaluate(RETRAITE_ETAT)
        t(f'{titre} : le second clic : « Carrière terminée », le bilan (1 saison), sauvegardé', r['ecran'] == 'retraite' and r['retraite'] and r['retraite']['raison'] == 'choix' and r['sauve'] == 'choix' and r['bilan'].startswith('1 saison') and r['raison'] != '' and pas_de_defilement(r['defile']), str(r))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'retraite-960.png'))
        bilan_temple(pg, titre)
        releve(pg, titre)
        return
    # le joueur champion : les 11 premiers Grands Prix refaits avec de vraies places (il en gagne 5 et finit 2e des 6 autres : 233 points,
    # le titre est à lui avant le 12e) ; puis la une spéciale « CHAMPION ! » et la cérémonie, avec ses vrais points et ses vraies victoires
    pg.evaluate(f'() => {{ ({FABRIQUER_CHAMPION})(11); montrerChampionnat(null); }}')
    calendrier_ecran(pg, titre, 'calendrier.png')   # (11 Grands Prix faits, le 12e est le prochain)
    pg.click('#boutonCourseSuivante')
    passer_qualif(pg, titre)
    t(f'{titre} : le 12e Grand Prix part (circuit du calendrier, 20 voitures)', attendre(pg, '() => JEU.ecran === "course" && JEU.plateau && JEU.plateau.pilotes.length === 20', None, 10000))
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    for _ in range(80):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    t(f'{titre} : la course va jusqu’au podium', pg.evaluate('() => JEU.ecran === "podium"'), str(pg.evaluate('() => [JEU.ecran, JEU.plateau.arrives]')))
    pg.click('#boutonResultats'); attendre(pg, '() => JEU.ecran === "resultats"')
    pg.click('#boutonChangerResultats')
    interview_ecran(pg, titre, None, gp='12e : ')
    t(f'{titre} : « Continuer » : le 12e enregistré (la saison est finie), la une du journal', attendre(pg, '() => JEU.ecran === "une" && JEU.championnat.prochain === 12 && SAISONS.finie(JEU.championnat)'), str(pg.evaluate('() => [JEU.ecran, JEU.championnat.prochain]')))
    # la rumeur de transfert (tour 27c) : au 12e Grand Prix, la première brève de la une est une rumeur (vraie ou fausse), rendue avec un nom de pilote et d'écurie
    ru = pg.evaluate('''() => { const u = JEU.championnat.album[JEU.championnat.album.length - 1], r = JOURNAL.rendre(u, JEU.championnat, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie }), li = document.querySelector("#uneBreves li");
      return { cle: u.b[0][0], vraie: u.b[0][2].vraie, texte: li ? li.textContent : null, attendu: r.breves[0], intentions: JEU.championnat.transferts.liste.length }; }''')
    t(f'{titre} : la une du 12e porte une rumeur de transfert en première brève ({"vraie" if ru["vraie"] else "fausse"}), avec un pilote et une écurie nommés', ru['cle'] == 'breveRumeur' and ru['texte'] == ru['attendu'] and '{' not in (ru['texte'] or '{') and ru['intentions'] >= 1, str(ru))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'une-rumeur.png'))
    sp = pg.evaluate('() => ({ classe: document.getElementById("unePage").classList.contains("speciale"), titre: document.getElementById("uneTitre").textContent, f: JEU.championnat.album[JEU.championnat.album.length - 1].f })')
    t(f'{titre} : le joueur champion : la une du 12e est la une spéciale « CHAMPION ! »', sp['classe'] and sp['f'] == 'titreChampion' and sp['titre'].startswith('CHAMPION !'), str(sp))
    pg.click('#uneTitre')
    vrai = pg.evaluate('() => { const j = JEU.championnat.pilotes[19]; return { points: j.stats.points, v: j.places.filter(x => x === 1).length, n: j.places.length }; }')
    t(f'{titre} : la saison du champion est cohérente : 12 Grands Prix, {vrai["v"]} victoires, {vrai["points"]} points (au plus 300)', vrai['n'] == 12 and 5 <= vrai['v'] <= 6 and vrai['points'] <= 300 and vrai['points'] >= 233, str(vrai))
    d = pg.evaluate('() => document.getElementById("ceremonieDetail").textContent')
    t(f'{titre} : la cérémonie dit les vrais points et les vraies victoires (« {d} »)', d.startswith(f'{vrai["points"]} points · {vrai["v"]} victoires'), d)
    ceremonie_ecran(pg, titre, True, 'ceremonie.png')
    e = pg.evaluate(SAISON_ETAT)
    t(f'{titre} : après la une, le classement final de la saison : « La saison 1 est finie », le champion (« CHAMPION ! » si c’est le joueur), l’écurie championne, 20 lignes, la saison close et sauvegardée, sans défilement',
      e['ecran'] == 'saison' and e['titre'] == 'La saison 1 est finie' and (e['champion'] == 'CHAMPION !' if e['humain'] else e['champion'] == 'Champion : ' + e['attenduChampion']) and e['ecurie'].startswith('Écurie championne : ')
      and e['lignes'] == 20 and e['moi'] == 1 and e['premier'] == e['attenduChampion'] and e['saisons'] == 1 and e['sauve'] == 1 and pas_de_defilement(e['defile']), str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'champion.png'))
    pg.click('#boutonSaisonSuite')
    d = pg.evaluate(DUEL_SAISON_ETAT)
    attendu = (f"Tu as battu {d['nom']} {d['a']} à {d['b']}" if d['a'] > d['b'] else f"{d['nom']} t’a battu {d['b']} à {d['a']}" if d['a'] < d['b'] else f"Égalité avec {d['nom']} : {d['a']} à {d['b']}")
    t(f'{titre} : le duel de la saison : « {attendu} », le détail (qualifs, courses, carrière)', d['ecran'] == 'duelSaison' and d['score'] == attendu and 'qualifs' in d['detail'] and 'carrière' in d['detail'] and pas_de_defilement(d['defile']), str(d))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'duel-saison.png'))
    pg.click('#boutonDuelSaisonSuite')
    c = pg.evaluate(CONTRATS_ETAT)
    t(f'{titre} : les contrats : la note, les offres (au moins une, celles de SAISONS.offres, de la meilleure à la moins bonne), « Prendre ma retraite »',
      c['ecran'] == 'contrats' and c['n'] >= 1 and c['ecuries'] == c['offres'] and c['texteNote'].startswith('Ta note : ' + str(round(c['note'] * 100))) and c['bouton'] == 'Prendre ma retraite' and pas_de_defilement(c['defile']), str(c))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'contrats.png'))
    # signer : une autre écurie si on en propose une, sinon la sienne
    choix = next((x for x in c['offres'] if x != c['actuelle']), c['actuelle'])
    avant = pg.evaluate('() => ({ garage: JSON.stringify(JEU.championnat.garage), solde: JEU.championnat.argent.solde, coequipier: CHAMPIONNAT.coequipierDe(JEU.championnat).id, transferts: JEU.championnat.transferts.liste })')
    pg.click(f'#contratsListe li[data-ecurie="{choix}"] button')
    t(f'{titre} : « Signer » mène d’abord au choix du sponsor de la saison 2 (2 à 4 offres)', attendre(pg, '() => JEU.ecran === "sponsors" && JEU.championnat.saison === 2 && document.querySelectorAll("#sponsorsListe > li").length >= 2 && SPONSORS.aChoisir(JEU.championnat)'), str(pg.evaluate('() => [JEU.ecran, JEU.championnat.saison]')))
    montant = pg.evaluate('() => SPONSORS.offres(JEU.championnat)[0].montant')
    pg.click('#sponsorsListe > li:first-child button.choisir')
    avant['solde'] += montant   # le montant du sponsor est crédité au choix
    s2 = pg.evaluate(SAISON2_ETAT)
    t(f'{titre} : « Signer » (écurie {choix}) : la saison 2 commence (Grand Prix 1 / 12, points à 0), le joueur est dans l’écurie choisie, 10 écuries de 2, le garage et l’argent suivent, le duel repart de 0, sauvegardé',
      s2['ecran'] == 'championnat' and s2['saison'] == 2 and s2['prochain'] == 0 and s2['ecurie'] == choix and s2['titre'].startswith('Grand Prix 1 / 12') and s2['garage'] == avant['garage'] and s2['solde'] == avant['solde']
      and s2['deux'] and s2['duel'] == [0, 0] and s2['sauve'] == 2 and s2['contrats'] == [[2, choix]] and s2['gagne'] == '' and s2['pilotesLi'] == 20 and s2['zero'], str(s2))
    if choix != c['actuelle']:
        # (sauf si l'ancien coéquipier avait lui-même un transfert annoncé vers cette écurie : saisons.js, les intentions de la saison)
        t(f'{titre} : le coéquipier a changé avec l’écurie (ou l’ancien l’y a suivi par un transfert annoncé)', (s2['coequipier'] != avant['coequipier'] or any(avant['coequipier'] in x for x in avant['transferts'])) and pg.evaluate(f'() => JEU.championnat.pilotes[CHAMPIONNAT.coequipierDe(JEU.championnat).id].ecurie === {choix}'), str([avant['coequipier'], s2['coequipier']]))
    with pg.expect_navigation(): pg.click('#boutonCourseSuivante')
    t(f'{titre} : « Course suivante » recharge la page sur le Grand Prix 1 de la saison 2', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.saison === 2 && JEU.championnat.prochain === 0', None, 60000), str(pg.evaluate('() => [JEU.ecran, JEU.championnat && JEU.championnat.saison]')))

def championnat(pg, titre, l):
    # ?championnat=1 : l'écran entre les courses au démarrage (nouveau championnat : Grand Prix 1), le robot joue deux
    # Grands Prix d'un tour, « Continuer » enregistre et sauvegarde ; la page rechargée retrouve le Grand Prix 3 et les points
    ECRAN = '() => [JEU.ecran, JEU.championnat && JEU.championnat.prochain, document.getElementById("championnatTitre").textContent]'
    t(f'{titre} : au démarrage, l’écran du championnat : Grand Prix 1 / 12, 20 pilotes (le joueur marqué), 10 écuries',
      pg.evaluate('''() => JEU.ecran === "championnat" && JEU.championnat.prochain === 0 && /^Grand Prix 1 \/ 12 — /.test(document.getElementById("championnatTitre").textContent)
        && document.querySelectorAll("#championnatPilotes li").length === 20 && document.querySelectorAll("#championnatPilotes li.moi").length === 1
        && document.querySelectorAll("#championnatEcuries li").length === 10 && document.getElementById("championnatGagne").textContent === ""'''), str(pg.evaluate(ECRAN)))
    duel_ecran(pg, titre, 0)
    fiche_ecran(pg, titre, 'fiche.png' if l == 1280 else 'fiche-960.png')
    sponsors_ecran(pg, titre, 'sponsors.png' if l == 1280 else 'sponsors-960.png')
    if l != 1280:
        garage_ecran(pg, titre, achat=False, capture='garage-960.png')
        # en petit : l'interview d'un Grand Prix fabriqué en mémoire (le joueur 8e avec un gros contact, le pilote 3 aussi : la question
        # « contact » nomme le 3) ; réponse provocante → « n'a pas aimé », la une « interview », les jauges au paddock, la rivalité sur la fiche du 3
        pg.evaluate('''() => { const ch = JEU.championnat, o = [0, 1, 2, 3, 4, 5, 6, 19, 18].concat([...Array(20).keys()].filter(k => k > 6 && k < 18));
          const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true, chocMax: k === 19 || k === 3 ? REGLAGES.INTERVIEW_CHOC + 3 : 0 }));
          JEU.lignesGP = lignes; montrerInterview(INTERVIEW.question(ch, lignes)); }''')
        itw = interview_ecran(pg, titre, 'provocant', capture='interview-960.png', gp='fabriqué (contact avec le pilote 3) : ')
        t(f'{titre} : la question fabriquée est bien « contact » avec le pilote 3', itw['fait'] == 'contact' and itw['rival'] == 3, str([itw['fait'], itw['rival']]))
        u = une_ecran(pg, titre, 'une-interview-960.png', touche=True)
        t(f'{titre} : la une du journal reprend la phrase de l’interview (fait « interview »)', u['fait'] == 'interview', u['fait'])
        E_ = pg.evaluate('() => REGLAGES.INTERVIEW_EFFETS.provocant'); D_ = pg.evaluate('() => REGLAGES.REPUTATION_DEPART')
        reputation_paddock(pg, titre, [D_ + E_.get(j, 0) for j in ('public', 'ecurie', 'sponsors')])
        fiche_rivalite(pg, titre, 3, pg.evaluate('() => REGLAGES.INTERVIEW_RIVALITE_COURSES'))
        # en petit : la une d'un Grand Prix fabriqué en mémoire (le joueur 2e, sans sauvegarde), pour vérifier qu'elle tient en 960×600
        pg.evaluate('''() => { const ch = JEU.championnat, o = [0, 19].concat([...Array(20).keys()].filter(k => k !== 0 && k !== 19));
          const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true }));
          CHAMPIONNAT.enregistrerCourse(ch, lignes); montrerUne(JOURNAL.ranger(ch, JOURNAL.composer(ch, lignes))); }''')
        u2 = une_ecran(pg, titre, 'une-960.png', touche=True)
        t(f'{titre} : la une du joueur 2e est « premier podium »', u2['fait'] == 'premierPodium', u2['fait'])
        album_ecran(pg, titre, [u['titre'], u2['titre']])
        calendrier_ecran(pg, titre, 'calendrier-960.png')
        return
    points = None
    for gp in (1, 2):
        if gp == 2:
            with pg.expect_navigation(): pg.click('#boutonCourseSuivante')   # le Grand Prix joué : la page se recharge sur le suivant
            t(f'{titre} : « Course suivante » recharge la page sur le Grand Prix {gp}', attendre(pg, f'() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.prochain === {gp - 1}', None, 60000), str(pg.evaluate(ECRAN)))
        pg.click('#boutonCourseSuivante')
        passer_qualif(pg, titre)
        t(f'{titre} : GP {gp} : la course part sur le circuit du calendrier, le joueur (robot) et 19 IA aux couleurs des écuries',
          attendre(pg, '() => JEU.ecran === "course" && JEU.contre && JEU.robot && JEU.plateau && JEU.plateau.pilotes.length === 20 && NOM_CIRCUIT === JEU.championnat.calendrier[JEU.championnat.prochain].circuit'
                       ' && JEU.couleurs.every((c, k) => c === JEU.championnat.ecuries[JEU.championnat.pilotes[k].ecurie].couleur) && JEU.course.nbTours === 1', None, 10000), str(pg.evaluate(ECRAN)))
        t(f'{titre} : GP {gp} : la carte se calcule, chaque IA prend le caractère de son pilote du championnat',
          attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.slice(0, 19).every((p, k) => p.pilote && p.pilote.caractere.regularite === JEU.championnat.pilotes[k].caractere.regularite)', None, 180000))
        if gp == 2:   # l'aileron réglé au garage après le GP 1 (cran 5 pour ce circuit) est sur la voiture du joueur ; les IA ont le leur
            al = pg.evaluate('() => ({ ad: JEU.joueur.aileronAdherence, tr: JEU.joueur.aileronTrainee, attendu: AILERON.facteurs(AILERON.cranDe(JEU.championnat, NOM_CIRCUIT)), cran: AILERON.cranDe(JEU.championnat, NOM_CIRCUIT), ia: JEU.plateau.pilotes.slice(0, 19).filter(p => typeof p.aileron === "number").length })')
            t(f'{titre} : GP 2 : l’aileron réglé (cran {al["cran"] + 1}) est sur la voiture du joueur, et les 19 IA ont choisi le leur', al['cran'] == 4 and al['ad'] == al['attendu']['adherence'] and al['tr'] == al['attendu']['trainee'] and al['ia'] == 19, str(al))
        tour = None   # la ligne du coéquipier dans la tour, vue pendant la course
        for _ in range(80):
            pg.evaluate('() => BOUCLE.simuler(5)')
            if pg.evaluate('() => JEU.ecran') == 'podium': break
            pg.wait_for_timeout(50)
            if tour is None:
                tour = pg.evaluate(DUEL_TOUR)
                if tour and tour['ecart'] and gp == 1:
                    # la capture seulement une fois les lignes posées (elles glissent quand l'ordre change), et les 20 rangs de 1 à 20 de haut en bas
                    t(f'{titre} : GP {gp} : avant duel-tour.png, la tour est stable : 20 lignes, les rangs 1 à 20 de haut en bas, chacune à sa place',
                      attendre(pg, ORDRE_TOUR, None, 10000) and pg.evaluate('() => [...document.querySelectorAll("#classementListe li")].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(li => li.children[0].textContent).join(",")') == ','.join(str(i) for i in range(1, 21)),
                      pg.evaluate('() => [...document.querySelectorAll("#classementListe li")].map(li => [li.children[0].textContent, Math.round(li.getBoundingClientRect().top)])'))
                    pg.screenshot(path=os.path.join(CAPTURES, 'duel-tour.png'))
                if tour and not tour['ecart']: tour = None   # l'écart n'est pas encore connu : on regarde à l'image suivante
        t(f'{titre} : GP {gp} : en course, une seule ligne du coéquipier dans la tour (son numéro, la couleur de l’écurie), avec l’écart en temps « ▲/▼ x,x s »',
          bool(tour) and tour['n'] == 1 and tour['numero'] == tour['attendu'] and tour['couleur'] and bool(re.fullmatch(r'[▲▼] \d+,\d s', tour['ecart'])), str(tour))
        t(f'{titre} : GP {gp} : la course va jusqu’au podium', pg.evaluate('() => JEU.ecran === "podium"'), str(pg.evaluate('() => [JEU.ecran, JEU.plateau.arrives, JEU.plateau.temps, JEU.course.etat]')))
        pg.click('#boutonResultats')
        attendre(pg, '() => JEU.ecran === "resultats"')
        t(f'{titre} : GP {gp} : un seul bouton, « Continuer »', pg.evaluate('() => document.getElementById("boutonRejouerResultats").classList.contains("cache") && document.getElementById("boutonChangerResultats").textContent === "Continuer"'))
        # l'argent (argent.js) : la ligne des gains sous les résultats, calculée sur le classement final de cet instant
        arg = pg.evaluate('''() => { const g = ARGENT.gains(JEU.championnat, CHAMPIONNAT.lignesDepuisCourse(JEU.plateau)), p = document.getElementById("resultatsArgent");
          return { texte: p.textContent, total: g.total, attendu: ARGENT.formater(g.total), deborde: p.getBoundingClientRect().right > innerWidth || p.getBoundingClientRect().bottom > innerHeight, g }; }''')
        t(f'{titre} : GP {gp} : les résultats montrent l’argent gagné (« Gains : +n € » avec le détail), sans déborder', arg['texte'].startswith('Gains : +' + arg['attendu']) and '(' in arg['texte'] and not arg['deborde'] and arg['total'] > 0, str(arg))
        if gp == 1:
            pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(CAPTURES, 'argent.png'))
        pg.click('#boutonChangerResultats')
        itw = interview_ecran(pg, titre, 'provocant' if gp == 1 else None, capture='interview.png' if gp == 1 else None, gp=f'GP {gp} : ')
        t(f'{titre} : GP {gp} : « Continuer » enregistre le Grand Prix, range sa une dans l’album et sauvegarde, puis montre la une du journal',
          attendre(pg, f'''() => JEU.ecran === "une" && JEU.championnat.prochain === {gp} && SAUVEGARDE.championnat().prochain === {gp} && SAUVEGARDE.championnat().album.length === {gp}
            && JEU.championnat.album.length === {gp} && JEU.championnat.album[{gp - 1}].g === {gp}'''), str(pg.evaluate(ECRAN)) + ' ' + str(pg.evaluate('() => JEU.championnat.album.length')))
        une_ecran(pg, titre, 'une.png' if gp == 1 else 'une-2.png')
        t(f'{titre} : GP {gp} : après la une, l’écran du championnat avec les points gagnés',
          attendre(pg, f'''() => JEU.ecran === "championnat" && /^Tu marques \d+ points?$/.test(document.getElementById("championnatGagne").textContent)
            && document.getElementById("championnatTitre").textContent.startsWith("Grand Prix {gp + 1} / 12")'''), str(pg.evaluate(ECRAN)) + ' ' + pg.evaluate('() => document.getElementById("championnatGagne").textContent'))
        points = pg.evaluate('() => JEU.championnat.pilotes.map(p => p.stats.points)')
        # la réputation après la réponse provocante du GP 1 (public +4, écurie −3, sponsors −3 : INTERVIEW_EFFETS), gardée au GP 2 (pas de commentaire, page rechargée entre les deux)
        E_ = pg.evaluate('() => REGLAGES.INTERVIEW_EFFETS.provocant'); D_ = pg.evaluate('() => REGLAGES.REPUTATION_DEPART')
        reputation_paddock(pg, titre, [D_ + E_.get(j, 0) for j in ('public', 'ecurie', 'sponsors')])
        if gp == 1 and itw['rival'] is not None: fiche_rivalite(pg, titre, itw['rival'], pg.evaluate('() => REGLAGES.INTERVIEW_RIVALITE_COURSES'))
        total = pg.evaluate('() => REGLAGES.POINTS.reduce((a, b) => a + b, 0)')
        t(f'{titre} : GP {gp} : les points sont ceux du classement final (somme = {total} par Grand Prix)', sum(points) == gp * total, str(points))
        duel_ecran(pg, titre, gp)
        # le solde = les gains des Grands Prix + les crédits (le test du garage en ajoute un) − les achats du garage (la somme des prix des niveaux achetés)
        sol = pg.evaluate('''() => { const ch = JEU.championnat, s = ch.argent.solde, R = REGLAGES; return { texte: document.getElementById("championnatArgent").textContent, attendu: "Solde : " + ARGENT.formater(s), s,
          somme: ch.argent.historique.reduce((a, h) => a + h[1], 0) - GARAGE.NOMS.reduce((a, n) => a + R.GARAGE[n].prix.slice(0, ch.garage[n]).reduce((x, y) => x + y, 0), 0),
          sauve: SAUVEGARDE.championnat().argent.solde, n: ch.argent.historique.filter(h => h[0] > 0).length }; }''')
        t(f'{titre} : GP {gp} : l’écran du championnat montre le solde = les gains + les crédits − les achats, sauvegardé, {gp} Grand(s) Prix dans l’historique', sol['texte'] == sol['attendu'] and sol['s'] == sol['somme'] and sol['sauve'] == sol['s'] and sol['n'] == gp and sol['s'] > 0, str(sol))
        if gp == 1:
            pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(CAPTURES, 'championnat.png'))
            garage_ecran(pg, titre)
        else:
            pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(CAPTURES, 'duel.png'))
    pg.reload()
    t(f'{titre} : la page rechargée retrouve le Grand Prix 3 et les mêmes points', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.prochain === 2', None, 60000)
      and pg.evaluate('() => JEU.championnat.pilotes.map(p => p.stats.points)') == points and pg.evaluate('() => document.getElementById("championnatTitre").textContent').startswith('Grand Prix 3 / 12'), str(pg.evaluate(ECRAN)))

def INTERFACE_TEMPS(t, virgule='.'):
    m = int(t // 60); s = t - m * 60
    return f'{m}:{s:06.3f}'.replace('.', virgule)

# PAGES_FILTRE=<expression> (variable d'environnement, développement) : seulement les pages dont l'adresse y correspond
if os.environ.get('PAGES_FILTRE'): PAGES = [x for x in PAGES if re.search(os.environ['PAGES_FILTRE'], x[0])]
# ECRANS_TRANCHE=k/n (GitHub, les travaux en parallèle) : seulement la k-ième tranche des pages sur n (une page sur n, à partir de la k-ième) ;
# chaque page a son propre contexte de navigateur, les tranches sont indépendantes
if os.environ.get('ECRANS_TRANCHE'):
    k_, n_ = (int(x) for x in os.environ['ECRANS_TRANCHE'].split('/'))
    PAGES = [x for i, x in enumerate(PAGES) if i % n_ == k_ - 1]
mesures = None
mesures_voiture = []
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for page, l, h, capture in PAGES:
            titre = f'{page} {l}×{h}'
            ctx = b.new_context(viewport={'width': l, 'height': h})
            pg = ctx.new_page(); console = []
            # les tâches longues (> 50 ms) qui bloquent la page, relevées dès le début du chargement
            pg.add_init_script('window.__longues = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__longues.push(e.duration); }).observe({ entryTypes: ["longtask"] });')
            # sauf l'avertissement du pilote graphique quand Playwright fait une capture (le jeu ne lit jamais les pixels) :
            # seulement ce message exact (l'adresse entre crochets change), tout autre message reste une erreur
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.on('requestfailed', lambda r: console.append('FICHIER MANQUANT ' + r.url))
            if 'test=sdk' in page or 'test=decouverte' in page or 'test=amis' in page or 'test=tournoi' in page: pg.add_init_script(FAUX_SDK)
            # le tournoi change de page entre deux manches : les pubs sont aussi comptées dans sessionStorage (qui survit au rechargement)
            if 'test=tournoi' in page: pg.add_init_script("const __cb = PokiSDK.commercialBreak; PokiSDK.commercialBreak = function () { sessionStorage.setItem('pubs', String((+sessionStorage.getItem('pubs') || 0) + 1)); return __cb.call(this); };")
            pg.goto('file://' + RACINE + '/' + page); pg.wait_for_timeout(1500)
            t(f'{titre} : console vide', not console, ' | '.join(console)[:500])
            defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
            t(f'{titre} : pas de défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
            t(f'{titre} : la scène 3D a démarré', pg.evaluate('() => SCENE3D.actif && !!document.querySelector("#scene3d canvas")'))
            t(f'{titre} : le circuit est dessiné', attendre(pg, '() => SCENE3D.trianglesDessines > 5000', None, 30000), f'{pg.evaluate("() => SCENE3D.trianglesDessines")} triangles')
            if mesures is None: mesures = pg.evaluate('() => SCENE3D.infoCircuit')

            t(f'{titre} : le panneau de réglage n’existe que avec ?reglages=1', pg.evaluate('() => !!document.getElementById("reglages")') == ('reglages=1' in page))
            if page == 'index.html?seul=1' and l == 1280:
                conduite(pg, titre)
            if page == 'index.html':
                t(f'{titre} : la page nue, sans sauvegarde : l’écran titre (« ▶ Jouer », « 👥 Entre amis »), pas de qualification ni d’écran de choix', pg.evaluate('() => JEU.ecran === "titre" && JEU.decouverte && !document.getElementById("titre").classList.contains("cache") && document.getElementById("choix").classList.contains("cache") && document.getElementById("boutonJouer").textContent === texte("titreJouer")'), str(pg.evaluate('() => [JEU.ecran, JEU.decouverte]')))
                if l == 960:
                    # une ancienne sauvegarde : un championnat déjà commencé, sans pilote créé → la création est demandée une fois, en 960×600 sans défilement
                    pg.evaluate('() => { const ch = CHAMPIONNAT.creer(1); ch.prochain = 2; localStorage.setItem(SAUVEGARDE.CLE, JSON.stringify({ version: 3, records: {}, championnat: ch })); }')   # (une sauvegarde d'avant : sans decouverteFaite ni argent)
                    pg.reload()
                    t(f'{titre} : une ancienne sauvegarde (championnat sans pilote) se charge et demande la création du pilote, une fois', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "pilote" && SAUVEGARDE.decouverteFaite() && !JEU.decouverte', None, 60000), str(pg.evaluate('() => [JEU.ecran, SAUVEGARDE.decouverteFaite()]')))
                    defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
                    t(f'{titre} : l’écran de création tient en 960×600 sans défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
                    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'pilote-960.png'))
                    pg.select_option('#pilotePays', 'jp')
                    with pg.expect_navigation(): pg.click('#boutonPiloteValider')
                    t(f'{titre} : validée (Japon → 🏠 Suzuko d’office), la page revient au paddock, Grand Prix 3, et ne redemande plus la création', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.prochain === 2 && PILOTE.joueur(JEU.championnat).coeur === "suzuko" && PILOTE.joueur(JEU.championnat).pays === "jp"', None, 60000), str(pg.evaluate('() => [JEU.ecran, PILOTE.joueur(JEU.championnat)]')))
            if 'test=decouverte' in page:
                decouverte(pg, titre)
            if 'reglages=1' in page:
                reglages(pg, titre)
            if 'robot=1' in page and 'championnat=1' not in page and 'joueur=1' not in page and 'test=sdk' not in page and 'pneus=1' not in page and 'test=decouverte' not in page and 'test=deux' not in page:   # (avec ?championnat=1 ou &joueur=1, le robot joue dans championnat() ou qualif() ; sdk() et pneus() ont leur page)
                course_robot(pg, titre, page)
            if 'test=sdk' in page:
                sdk(pg, titre)
            if 'test=deux' in page:
                deux_ecran(pg, titre, l, h, page)
            if 'test=amis' in page:
                amis(pg, titre, l, h)
            if 'test=tournoi' in page:
                tournoi(pg, titre, l, h)
            if 'test=volant' in page:
                volant(pg, titre, l, h)
            if 'pneus=1' in page and 'test=stand' not in page and 'test=hudcourse' not in page:
                pneus(pg, titre)
            if 'test=stand' in page:
                stand_ecran(pg, titre)
            if re.search(r'[?&]ia=1(&|$)', page):
                course_ia(pg, titre)
            if re.search(r'[?&]ia=10(&|$)', page):
                course_ia10(pg, titre)
            if 'course=1&ia=8' in page:
                course_podium(pg, titre, l)
            if 'gp=12' in page and 'lang=en' in page:
                audit_en(pg, titre, l)
            elif 'gp=12' in page:
                fin_saison(pg, titre, l)
            elif 'championnat=1' in page and 'lang=en' in page:
                championnat_en(pg, titre)
            elif 'test=consigne' in page:
                consigne_ecran(pg, titre, 'suivie' in page)
            elif 'test=accelere' in page:
                accelere(pg, titre, page)
            elif 'championnat=1' in page:
                championnat(pg, titre, l)
            if 'test=accelere' in page: pass
            elif 'test=hudcourse' in page:
                hud_course(pg, titre, l, h)
            elif 'test=resume' in page:
                resume_ecran(pg, titre, l, h)
            elif 'test=qualif' in page:
                qualif(pg, titre)
            elif 'test=fantome' in page:
                fantome(pg, titre)
            elif 'joueur=1' in page:
                hud(pg, titre, l)
                if l == 1280: course_joueur(pg, titre)
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
                m = re.fullmatch(r'\d+ i/s · \d+ triangles · (\d+) appels\ndérive (-?[\d.]+)° · ([\d.]+) g · voiture (\d+) triangles, (\d+) appels(?: · pneus \d+ %)?', ips or '')
                t(f'{titre} : images par seconde, triangles, dérive, g latéraux et triangles d’une voiture affichés', bool(m), repr(ips))
                if m:
                    # (avec ?ia=10, la voiture suivie roule : ni « à l'arrêt », ni la mesure d'une voiture seule)
                    if 'ia=10' not in page and 'pneus=1' not in page:   # (avec ?pneus=1, le robot a roulé)
                        t(f'{titre} : à l’arrêt, 0° de dérive et 0 g', float(m.group(2)) == 0 and float(m.group(3)) == 0, repr(ips))
                        mesures_voiture.append((int(m.group(4)), int(m.group(5)), int(m.group(1))))
                    t(f'{titre} : une voiture fait au plus 7 appels de dessin et moins de 1500 triangles', int(m.group(5)) <= 7 and int(m.group(4)) < 1500, repr(ips))
                    if 'ia=10' in page:
                        t(f'{titre} : les IA gardent le modèle léger (moins de triangles que la voiture du joueur)', not pg.evaluate('() => JEU.modeles.some(m => m.detaille)') and pg.evaluate('() => VOITURE3D.triangles(JEU.modeles[0]) < VOITURE3D.triangles(VOITURE3D.creer(0xffffff, true))'), repr(ips))
                    else:
                        t(f'{titre} : la voiture du joueur est la voiture détaillée', pg.evaluate('() => JEU.modele.detaille'))
            else: t(f'{titre} : sans debug, pas de compteur', ips is None, repr(ips))
            ctx.close()
    finally:
        b.close()

print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
if mesures_voiture: print(f'  (une voiture : {mesures_voiture[0][0]} triangles, {mesures_voiture[0][1]} appels de dessin ; toute l’image : {mesures_voiture[0][2]} appels)')
if mesures: print(f'  (circuit 3D : {mesures["triangles"]:.0f} triangles, construit en {mesures["msConstruction"]:.0f} ms sous swiftshader)')
sys.exit(0 if ko == 0 else 1)
