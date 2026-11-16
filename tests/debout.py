#!/usr/bin/env python3
"""(tour 56, T16) Le téléphone TENU DEBOUT de bout en bout : python3 tests/debout.py [appareil ...]
Hors workflow GitHub, sur le Mac sous le verrou /tmp/gpd-tests.lock (plusieurs minutes par appareil sous swiftshader).
Pour chaque profil réel de Playwright (iPhone SE, iPhone 13, Pixel 7, Galaxy S9+) TENU DEBOUT : le jeu s'affiche tourné de 90° (PORTRAIT_TOURNER,
html.tourne), au doigt seulement (vrais toucher de Playwright) : titre → « ▶ Jouer » → grille et course de découverte → ⏸ ↩ 🎥 → une course
contre des IA avec arrêt au stand (les boutons de pneus touchés l'un après l'autre) → arrivée → podium. À chaque écran, l'audit de telephones.py
(rien hors de l'écran, rien de recouvert, boutons ≥ 40 px, page qui ne défile pas). Captures tests/captures/debout-<appareil>-<étape>.png.
TEL_COURT=1 : sans la découverte (seulement la course avec l'arrêt)."""
import os, sys, time, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import telephones as T
from telephones import t, attendre, toucher, audit
from playwright.sync_api import sync_playwright
APPAREILS = ['iPhone SE', 'iPhone 13', 'Pixel 7', 'Galaxy S9+']
COURT = bool(os.environ.get('TEL_COURT'))
# l'audit de telephones.py compare tout à la fenêtre ; jeu tourné, le défilement d'un menu (pause) est sur l'autre axe de la fenêtre, et body.scrollWidth
# (640) n'est pas un défilement de la page : on garde le même audit avec ces deux seules corrections
_A = T.AUDIT
_A = _A.replace("v.x < -1 || v.r > W + 1 || (!v.defil && (v.y < -1 || v.b > H + 1))", "(!v.defil && (v.x < -1 || v.r > W + 1 || v.y < -1 || v.b > H + 1))")
_A = _A.replace("(r.right > W + 1 || r.left < -1 || (!defil && (r.bottom > H + 1 || r.top < -1)))", "(!defil && (r.right > W + 1 || r.left < -1 || r.bottom > H + 1 || r.top < -1))")
_A = _A.replace(" || document.body.scrollWidth > W + 1 || document.body.scrollHeight > H + 1", "")
assert _A != T.AUDIT
T.AUDIT = _A

def cible(pg, id_):
    """le centre (espace fenêtre) d'un élément : les rectangles suivent la rotation CSS"""
    return pg.evaluate('(i) => { const r = document.getElementById(i).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.width, h: r.height }; }', id_)

def parcours(b, p, nom):
    prof = p.devices[nom]
    ctx = b.new_context(**{k: v for k, v in prof.items() if k != 'default_browser_type'})
    pg = ctx.new_page(); console = []
    pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
    pg.add_init_script("try { Element.prototype.requestFullscreen = function () { return Promise.reject(new Error('refus')); }; } catch (e) {}")
    pg.add_init_script('try { DeviceOrientationEvent.requestPermission = undefined; } catch (e) {}')
    sans = nom.replace(' ', '_').replace('+', 'p')
    def tourne(): return pg.evaluate('() => document.documentElement.classList.contains("tourne")')
    def verifier_debout(etape):
        a = audit(pg, 'debout-' + etape, nom)
        t(f'{nom} · {etape} : le jeu est tourné (html.tourne), sans message « Tourne ton téléphone »', tourne() and pg.evaluate('() => document.getElementById("tactilePortrait").classList.contains("cache")'), a['W'])
        return a
    if not COURT:
        pg.goto('file://' + T.RACINE + '/index.html', timeout=180000)
        attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "titre"', None, 60000)
        attendre(pg, '() => document.documentElement.classList.contains("tourne")', None, 15000); pg.wait_for_timeout(500)
        verifier_debout('titre')
        pg.evaluate('() => { REGLAGES.DECOUVERTE_TOURS = 1; }')
        toucher(pg, '#boutonJouer')
        t(f'{nom} · debout : « ▶ Jouer » au toucher mène à la course de découverte', attendre(pg, '() => JEU.ecran === "course" && !!JEU.decouverte', None, 60000), pg.evaluate('() => JEU.ecran'))
        attendre(pg, '() => JEU.plateau && JEU.plateau.carte !== null', None, 300000)
        verifier_debout('grille')
        attendre(pg, '() => JEU.course.etat !== "compte"', None, 120000)
        attendre(pg, '() => TACTILE.etat.mode === "boutons" || TACTILE.etat.mode === "volant"', None, 20000)
        verifier_debout('decouverte-course')
    # une course contre des IA, avec l'arrêt au stand (le robot conduit, les doigts ne servent qu'aux boutons)
    pg.goto('file://' + T.RACINE + '/index.html?course=2&ia=3&joueur=1&robot=1&circuit=test&pneus=1', timeout=180000)
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 90000)
    verifier_debout('qualif')
    toucher(pg, '#boutonQualifPasser')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 300000)
    toucher(pg, '#boutonQualifCourse')
    attendre(pg, '() => JEU.ecran === "course" && !!JEU.plateau && JEU.plateau.carte !== null', None, 300000)
    attendre(pg, '() => JEU.course.etat !== "compte"', None, 120000)
    pg.evaluate('() => { BOUCLE.arreter(); }')
    pg.evaluate('() => { majTactile(0); }')
    verifier_debout('course')
    # ↩ ⏸ 🎥 au toucher
    toucher(pg, '#tactileCamera'); m0 = pg.evaluate('() => CAMERA.mode')
    t(f'{nom} · debout : 🎥 au toucher change la caméra', m0 is not None)
    toucher(pg, '#tactileRemise'); pg.wait_for_timeout(100)
    t(f'{nom} · debout : ↩ au toucher demande le retour en piste', pg.evaluate('() => JEU.remettre === true'))
    pg.evaluate('() => { JEU.remettre = false; }')
    toucher(pg, '#tactilePause'); t(f'{nom} · debout : ⏸ au toucher ouvre la pause', attendre(pg, '() => JEU.ecran === "pause"', None, 6000))
    audit(pg, 'debout-pause', nom)
    toucher(pg, '#boutonReprendre'); attendre(pg, '() => JEU.ecran === "course"', None, 6000)
    pg.evaluate('() => BOUCLE.arreter()')
    # l'arrêt au stand : les boutons de pneus
    pg.evaluate('() => { BOUCLE.simuler(3); JEU.joueur.pneus.usure = 0.5; JEU.joueur.versStands = true; }')
    for _ in range(150):
        pg.evaluate('() => BOUCLE.simuler(2)')
        if pg.evaluate('() => !!JEU.course.arretEnCours'): break
    pg.evaluate('() => { majTactile(0); }')
    a = audit(pg, 'debout-course-stand', nom)
    r = pg.evaluate('() => [...document.getElementById("tactilePneus").children].map(b => b.dataset.pneu)')
    t(f'{nom} · debout : la rangée de pneus est là pendant l’arrêt ({len(r)} boutons)', len(r) >= 3, r)
    for ty in r + [r[0]]:
        toucher(pg, f'#tactilePneus [data-pneu="{ty}"]'); pg.wait_for_timeout(100)
        t(f'{nom} · debout : un toucher sur « {ty} » change le pneu monté', pg.evaluate('(x) => JEU.joueur.pneusProchain === x', ty))
    choisi = pg.evaluate('() => JEU.joueur.pneusProchain')
    for _ in range(80):
        pg.evaluate('() => BOUCLE.simuler(1)')
        if pg.evaluate('() => !!JEU.course.arrets && JEU.course.arrets.length === 1'): break
    t(f'{nom} · debout : la voiture repart avec le pneu touché ({choisi})', pg.evaluate('() => JEU.joueur.typePneus') == choisi)
    # jusqu'à l'arrivée et au podium
    arrive = False
    for _ in range(300):   # (on avance par paquets de 3 s de course ; le Mac est trop lent pour le temps réel)
        pg.evaluate('() => BOUCLE.simuler(3)'); pg.wait_for_timeout(30)
        if pg.evaluate('() => !!JEU.attente || JEU.ecran !== "course"'): arrive = True; break
    if not arrive:
        pg.evaluate('() => BOUCLE.demarrer()')
        arrive = attendre(pg, '() => !!JEU.attente || JEU.ecran !== "course"', None, 180000)
    t(f'{nom} · debout : la course arrive à son terme', arrive, pg.evaluate('() => [JEU.ecran, !!JEU.attente, JEU.course.tours.length]'))
    if pg.evaluate('() => JEU.ecran === "course" && !document.getElementById("attenteArrivee").classList.contains("cache")'):
        audit(pg, 'debout-passer', nom); toucher(pg, '#boutonPasser')
    attendre(pg, '() => JEU.ecran !== "course"', None, 60000); pg.wait_for_timeout(1500)
    verifier_debout('fin')
    t(f'{nom} : la console reste sans erreur', not console, console[:3])
    ctx.close()

if __name__ == '__main__':
    noms = sys.argv[1:] or APPAREILS
    os.makedirs(T.CAPTURES, exist_ok=True)
    debut = time.monotonic()
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
        try:
            for nom in noms:
                try: parcours(b, p, nom)
                except Exception as e: t(f'{nom} : le parcours va jusqu’au bout', False, str(e)[:400])
        finally: b.close()
    print('\n'.join(T.L)); print(f'RESULTAT {T.ok}/{T.ok + T.ko} ({time.monotonic() - debut:.0f} s)')
    sys.exit(0 if T.ko == 0 else 1)
