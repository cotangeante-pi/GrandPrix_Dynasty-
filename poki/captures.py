"""Les captures promotionnelles pour Poki (16:9, 1920×1080), en français et en anglais : python3 poki/captures.py
(Codeur 3, tour 37b). Propositions À VALIDER par le propriétaire. Le dossier poki/ n'entre pas dans le zip (tests/paquet.py
n'y met que les fichiers chargés par index.html). Sept scènes : départ sous les feux, bataille en course, pluie,
podium, paddock, glissade en légende, aides au pilotage ; dans poki/captures/<scène>-<fr|en>.jpg. Rien n'est sauvegardé : chaque page a son propre contexte."""
import os, sys
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'poki', 'captures'); os.makedirs(SORTIE, exist_ok=True)
L, H = 1920, 1080
LANGUES = sys.argv[1:] or ['fr', 'en']
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output']
# la course prête : la grille vue d'en haut passée, la carte calculée, la course à l'écran
PRET = '''() => { if (typeof JEU === "undefined") return false; if (JEU.ecran === "grille" && typeof finirGrille === "function") finirGrille();
  if (JEU.ecran === "qualif") { const c = document.getElementById("boutonQualifCourse"), q = document.getElementById("boutonQualifPasser");   // (la qualification passée : la grille complète devant)
    if (c && c.offsetParent) c.click(); else if (q && q.offsetParent) q.click(); return false; }
  if (JEU.course && JEU.course.etat === "attente" && JEU.plateau && JEU.plateau.carte === null) return false; return JEU.ecran === "course" && !!JEU.course; }'''
erreurs = []

def page(b, adresse, langue):
    ctx = b.new_context(viewport={'width': L, 'height': H}, locale='fr-FR' if langue == 'fr' else 'en-US')
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto('file://' + RACINE + '/' + adresse + ('&' if '?' in adresse else '?') + 'lang=' + langue)
    return ctx, pg

def cap(pg, nom, langue):
    # (une image de promotion : sans la bulle des aides au premier usage, qui se ferme d'un clic dans le jeu)
    pg.add_style_tag(content='#bulleAide { display: none !important; }')
    pg.wait_for_timeout(1200)
    pg.screenshot(path=os.path.join(SORTIE, f'{nom}-{langue}.jpg'), type='jpeg', quality=88)
    print('capture', nom, langue, pg.evaluate('() => [JEU.ecran, JEU.course ? JEU.course.etat : null]'))

def course_prete(pg):
    for _ in range(400):
        if pg.evaluate(PRET): return True
        pg.wait_for_timeout(300)
    return False

def partir(pg):
    # les feux s'éteignent, puis ↑ (le robot d'essai conduit ensuite)
    pg.evaluate('() => { JEU.robot = true; if (JEU.course.etat === "compte") BOUCLE.simuler(JEU.course.compte + 0.3); }'); pg.keyboard.down('ArrowUp')
    for _ in range(100):
        if pg.evaluate('() => JEU.course.etat === "course"'): break
        pg.evaluate('() => BOUCLE.simuler(0.2)'); pg.wait_for_timeout(100)
    pg.keyboard.up('ArrowUp')

def rouler(pg, secondes):
    pg.evaluate(f'() => BOUCLE.simuler({secondes})')

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=ARGS)
    for lg in LANGUES:
        # 1. le départ : la grille pleine, les feux qui s'allument
        ctx, pg = page(b, 'index.html?course=3&ia=19&circuit=monzo&joueur=1&robot=1&meteo=sec', lg)
        if course_prete(pg):
            pg.evaluate('() => BOUCLE.simuler(Math.max(0, 4.3 - (JEU.course.feux.total - JEU.course.compte)))')   # (quatre feux allumés)
            cap(pg, '1-depart-feux', lg)
            # 2. la bataille : quelques secondes après le départ, le peloton encore groupé
            partir(pg); rouler(pg, 4); cap(pg, '2-bataille', lg)
        ctx.close()
        # 3. la pluie
        ctx, pg = page(b, 'index.html?course=3&ia=19&circuit=monzo&joueur=1&robot=1&meteo=pluie', lg)
        if course_prete(pg):
            partir(pg); rouler(pg, 6); cap(pg, '3-pluie', lg)
        ctx.close()
        # 4. le podium : une course d'un tour jusqu'au bout
        ctx, pg = page(b, 'index.html?course=1&ia=9&circuit=monzo&joueur=1&robot=1&tours=1&meteo=sec', lg)
        if course_prete(pg):
            partir(pg)
            for _ in range(300):
                if pg.evaluate('() => JEU.ecran') == 'podium': break
                pg.evaluate('() => { if (JEU.attente && !JEU.attente.passer && typeof passerAuPodium === "function") passerAuPodium(); BOUCLE.simuler(5); }'); pg.wait_for_timeout(30)
            pg.wait_for_timeout(2500); cap(pg, '4-podium', lg)
        ctx.close()
        # 5. le paddock du championnat, en cours de saison
        ctx, pg = page(b, 'index.html?championnat=1&tours=1&robot=1&gp=6', lg)
        pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=40000)
        cap(pg, '5-paddock', lg)
        # 7. (tour 37k) l'écran « Aides au pilotage », ouvert du paddock, la direction assistée allumée et le freinage coupé (le bonus annoncé)
        pg.evaluate('() => AIDES_ECRAN.fermer()')
        pg.click('#boutonAidesPaddock')
        pg.evaluate('''() => { const r = JEU.assistance; for (const [a, oui] of [['direction', true], ['freinage', false], ['antiblocage', true], ['antipatinage', true]]) if (r[a] !== oui) document.querySelector('#choixAidesListe button[data-aide=' + a + ']').click(); AIDES_ECRAN.fermer(); }''')
        cap(pg, '7-aides', lg)
        ctx.close()
        # 6. (tour 37k) une glissade en légende (la voiture vivante) : l'arrière qui part à l'épingle du technique, les traces de pneus et la
        # fumée ; le robot d'essai freine en tournant (c'est ce que la 8e leçon apprend à éviter), la caméra télé pour voir la voiture de côté
        ctx, pg = page(b, 'index.html?course=3&ia=3&circuit=technique&joueur=1&robot=1&niveau=legende&meteo=sec', lg)
        if course_prete(pg):
            partir(pg)
            pg.evaluate('''() => { const z = TUTORIEL.zoneFreinage(CIRCUIT), L = CIRCUIT.longueur; for (let i = 0; i < 4000; i++) { const a = ((z.debut - JEU.joueur.piste.s) % L + L) % L; if (a < 120 && a > 60) break; BOUCLE.simuler(0.1); } }''')
            vu = False
            for _ in range(600):
                if pg.evaluate('() => SENSATIONS.glisseArriere(JEU.joueur).arriere > 0.6'): vu = True; break
                pg.wait_for_timeout(50)
            pg.wait_for_timeout(700)
            print('glissade', vu, pg.evaluate('() => SENSATIONS.glisseArriere(JEU.joueur).arriere'))
            cap(pg, '6-glissade', lg)
        ctx.close()
    b.close()
print('erreurs', erreurs)
sys.exit(1 if erreurs else 0)
