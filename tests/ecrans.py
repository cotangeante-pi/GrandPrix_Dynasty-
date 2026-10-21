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
# l'avertissement de Chrome quand une capture lit les pixels de l'écran (voir « console vide »)
LECTURE_PIXELS = re.compile(r'\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels')
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
    ('index.html?reglages=1&course=0', 1280, 720, 'reglages.png'),
    ('index.html?course=5&robot=1', 1280, 720, None),
    ('index.html?camera=dessus&circuit=technique', 1280, 720, 'technique.png'),
    ('index.html?course=5&ia=1&circuit=technique', 1280, 720, 'ia.png'),
    ('index.html?course=5&ia=10&circuit=technique&debug=1', 1280, 720, 'ia10.png'),
    ('index.html?course=5&ia=9&joueur=1&circuit=technique', 1280, 720, None),   # capture joueur-ia.png prise en roulant
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
    t(f'{titre} : aucun son avant le premier geste', pg.evaluate('() => !SON.actif'))
    t(f'{titre} : au départ, l’écran de choix (5, 12, 18 tours, essai libre)', pg.evaluate('() => !document.getElementById("choix").classList.contains("cache") && ["choix5","choix12","choix18","choix0"].every(id => document.getElementById(id))'))
    pg.screenshot(path=os.path.join(CAPTURES, 'choix.png'))
    pg.click('#choix5')
    # sur un Mac chargé, le clic peut arriver tard : on attend la course (le compte à rebours, ou déjà le GO s'il a fini)
    t(f'{titre} : choisir « 5 tours » lance le compte à rebours', attendre(pg, '() => JEU.ecran === "course" && JEU.course.nbTours === 5 && (JEU.course.etat === "compte" || JEU.course.etat === "attente")', None, 30000), pg.evaluate('() => [JEU.ecran, JEU.course && JEU.course.etat]'))
    t(f'{titre} : le titre est le nom du jeu, sans « F1 »', pg.evaluate('() => document.title === texte("nomDuJeu") && document.title === "Grand Prix Dynasty"'), pg.evaluate('() => document.title'))
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
    t(f'{titre} : l’épaisseur du halo refait la voiture (mêmes triangles, mêmes appels)', pg.evaluate('() => REGLAGES.HALO_EPAISSEUR') == 0.06 and pg.evaluate('() => VOITURE3D.triangles(JEU.modele)') == tri and pg.evaluate('() => VOITURE3D.appels(JEU.modele)') <= 8)
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
    t(f'{titre} : au début du tour, les 3 cases de secteur sont grises', attendre(pg, '() => JEU.course.etat === "course" && document.getElementById("hudChrono").textContent !== "0:00.000"', None, 20000)
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
    t(f'{titre} : l’écran de fin montre les 5 tours, le total et le nouveau record', fin['tours'] == 5 and re.search(r'\d:\d\d\.\d{3}', fin['total']) and fin['record'] != '', str(fin))
    t(f'{titre} : le meilleur tour est gardé comme record des 5 tours', fin['garde'] == fin['meilleur'], str(fin))
    arret = pg.evaluate('() => ({ u: JEU.joueur.u, arret: JEU.arretApres, bandeau: document.getElementById("hudCourse").classList.contains("cache"), sons: SON.historique.slice(-1)[0] })')
    t(f'{titre} : après l’arrivée, la voiture s’arrête seule en moins de 6 s', arret['u'] == 0 and arret['arret'] is not None and arret['arret'] < 6, str(arret))
    t(f'{titre} : le bandeau de course est caché sous l’écran de fin', arret['bandeau'], str(arret))
    t(f'{titre} : le son d’arrivée est demandé', arret['sons'] == 'arrivee', str(arret))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'fin.png'))
    # après rechargement, le record est toujours là (sur l'écran de choix)
    pg.goto('file://' + RACINE + '/index.html'); pg.wait_for_timeout(1500)
    rec = pg.evaluate('() => document.getElementById("record5").textContent')
    t(f'{titre} : après rechargement, le record des 5 tours est affiché', INTERFACE_TEMPS(fin['meilleur']) in rec, repr(rec))
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
    t(f'{titre} : la carte calculée en fond est la même (le pilote neutre seul fait le même meilleur tour que dans test.html, 55,08 s)', tour is not None and abs(tour - 55.0833) < 0.006, str(tour))
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

def course_joueur(pg, titre):
    # le joueur conduit sa voiture au clavier, au milieu de 9 IA ; la caméra le suit, Tab ne change rien
    t(f'{titre} : 9 IA et la voiture du joueur, en dernière place de la grille ; la caméra suit le joueur',
      pg.evaluate('() => JEU.contre && JEU.plateau.pilotes.length === 10 && JEU.plateau.pilotes[9].humain && JEU.joueur === JEU.plateau.pilotes[9].v && JEU.course === JEU.plateau.pilotes[9].course && JEU.modeles.length === 10'))
    t(f'{titre} : la carte se calcule en fond, les 9 IA reçoivent leur pilote', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.filter(p => p.pilote !== null).length === 9', None, 120000))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "attente"', None, 20000)
    pg.keyboard.down('ArrowUp')
    t(f'{titre} : ↑ fait avancer la voiture du joueur', attendre(pg, '() => JEU.joueur.u > 15', None, 40000), pg.evaluate('() => JEU.joueur.u'))
    pg.keyboard.press('Tab')
    t(f'{titre} : Tab ne change pas la voiture suivie', pg.evaluate('() => JEU.suivie === 9 && JEU.joueur === JEU.plateau.pilotes[9].v'))
    pg.wait_for_timeout(1500)
    pg.screenshot(path=os.path.join(CAPTURES, 'joueur-ia.png'))
    pg.keyboard.up('ArrowUp')
    etat = pg.evaluate('() => JEU.plateau.pilotes.map(p => ({ humain: p.humain, progression: Math.round(p.course.progression), chocs: p.v.chocs.length }))')
    t(f'{titre} : la voiture du joueur et les 9 IA ont avancé', all(e['progression'] > 20 for e in etat), str(etat))
    L.append(f"  (contre 9 IA : joueur {etat[9]['progression']} m, IA de {min(e['progression'] for e in etat[:9])} à {max(e['progression'] for e in etat[:9])} m, {sum(e['chocs'] for e in etat) // 2} contacts)")

def INTERFACE_TEMPS(t):
    m = int(t // 60); s = t - m * 60
    return f'{m}:{s:06.3f}'

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
            pg.goto('file://' + RACINE + '/' + page); pg.wait_for_timeout(1500)
            t(f'{titre} : console vide', not console, ' | '.join(console)[:500])
            defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
            t(f'{titre} : pas de défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
            t(f'{titre} : la scène 3D a démarré', pg.evaluate('() => SCENE3D.actif && !!document.querySelector("#scene3d canvas")'))
            t(f'{titre} : le circuit est dessiné', attendre(pg, '() => SCENE3D.trianglesDessines > 5000', None, 30000), f'{pg.evaluate("() => SCENE3D.trianglesDessines")} triangles')
            if mesures is None: mesures = pg.evaluate('() => SCENE3D.infoCircuit')

            t(f'{titre} : le panneau de réglage n’existe que avec ?reglages=1', pg.evaluate('() => !!document.getElementById("reglages")') == ('reglages=1' in page))
            if page == 'index.html' and l == 1280:
                conduite(pg, titre)
            if 'reglages=1' in page:
                reglages(pg, titre)
            if 'robot=1' in page:
                course_robot(pg, titre, page)
            if re.search(r'[?&]ia=1(&|$)', page):
                course_ia(pg, titre)
            if re.search(r'[?&]ia=10(&|$)', page):
                course_ia10(pg, titre)
            if 'joueur=1' in page:
                course_joueur(pg, titre)
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
                m = re.fullmatch(r'\d+ i/s · \d+ triangles · (\d+) appels\ndérive (-?[\d.]+)° · ([\d.]+) g · voiture (\d+) triangles, (\d+) appels', ips or '')
                t(f'{titre} : images par seconde, triangles, dérive, g latéraux et triangles d’une voiture affichés', bool(m), repr(ips))
                if m:
                    # (avec ?ia=10, la voiture suivie roule : ni « à l'arrêt », ni la mesure d'une voiture seule)
                    if 'ia=10' not in page:
                        t(f'{titre} : à l’arrêt, 0° de dérive et 0 g', float(m.group(2)) == 0 and float(m.group(3)) == 0, repr(ips))
                        mesures_voiture.append((int(m.group(4)), int(m.group(5)), int(m.group(1))))
                    t(f'{titre} : une voiture fait au plus 8 appels de dessin', int(m.group(5)) <= 8, repr(ips))
            else: t(f'{titre} : sans debug, pas de compteur', ips is None, repr(ips))
            ctx.close()
    finally:
        b.close()

print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
if mesures_voiture: print(f'  (une voiture : {mesures_voiture[0][0]} triangles, {mesures_voiture[0][1]} appels de dessin ; toute l’image : {mesures_voiture[0][2]} appels)')
if mesures: print(f'  (circuit 3D : {mesures["triangles"]:.0f} triangles, construit en {mesures["msConstruction"]:.0f} ms sous swiftshader)')
sys.exit(0 if ko == 0 else 1)
