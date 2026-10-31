"""La capture du choix des pneus (tour 37l, Codeur 3) : poki/captures/pneus-drift-<fr|en>.png en 1280×720 : le garage avant les
qualifications, le pneu drift choisi dans la même liste que l'adhérant, l'intermédiaire et la pluie, avec la bulle du premier choix ;
puis en course, en pneus drift, l'icône à côté de la jauge d'usure : poki/captures/pneus-drift-course-<fr|en>.png"""
import os, sys
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'poki', 'captures')
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output']
erreurs = []
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=ARGS)
    for lg in sys.argv[1:] or ['fr', 'en']:
        ctx = b.new_context(viewport={'width': 1280, 'height': 720}); pg = ctx.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e)))
        pg.goto('file://' + RACINE + f'/index.html?championnat=1&tours=1&robot=1&gp=3&lang={lg}')
        pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=60000)
        pg.evaluate('() => AIDES_ECRAN.fermer()')
        pg.click('#boutonGarage'); pg.wait_for_timeout(500)
        pg.evaluate('() => AIDES_ECRAN.fermer()')   # (la bulle du garage, vue : celle du choix des pneus vient ensuite)
        pg.click('#garagePneus button[data-pneu=drift]')
        vu = pg.wait_for_function('() => document.getElementById("bulleAide").dataset.aide === "pneus" && !document.getElementById("bulleAide").classList.contains("cache")', timeout=8000)
        pg.wait_for_timeout(600)
        pg.screenshot(path=os.path.join(SORTIE, f'pneus-drift-{lg}.png'))
        print('garage', lg, bool(vu), pg.evaluate('() => [JEU.championnat.pneusDepart, document.querySelector("#garagePneus button.choisi") && document.querySelector("#garagePneus button.choisi").dataset.pneu]'))
        ctx.close()
        # en course, en pneus drift : l'icône à côté de la jauge
        ctx = b.new_context(viewport={'width': 1280, 'height': 720}); pg = ctx.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e)))
        pg.goto('file://' + RACINE + f'/index.html?course=0&circuit=technique&pneus=drift&robot=1&lang={lg}')
        pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "course" && JEU.course && JEU.course.etat !== "compte"', timeout=60000)
        pg.evaluate('() => { AIDES_ECRAN.fermer(); BOUCLE.simuler(8); }'); pg.wait_for_timeout(1200)
        pg.screenshot(path=os.path.join(SORTIE, f'pneus-drift-course-{lg}.png'))
        print('course', lg, pg.evaluate('() => [JEU.joueur.typePneus, document.getElementById("pneusIcone").textContent, document.getElementById("pneusIcone").title, document.getElementById("pneusHud").classList.contains("cache")]'))
        ctx.close()
    b.close()
print('erreurs', erreurs)
sys.exit(1 if erreurs else 0)
