#!/usr/bin/env python3
"""La chasse aux bugs du tour 53 (Codeur 6) : python3 tests/chasse53.py [fr1280|en640|les deux]
Le nouveau joueur, de bout en bout, aux tailles que tests/saison.py (960×600) ne couvre pas : titre → découverte → podium → pilote → paddock →
Grand Prix 1 (qualification, course) → après-course → paddock → Grand Prix 2. Au clavier en 1280×720 en français ; au doigt (écran tactile
émulé) en 640×360 en anglais. À chaque écran : ce que vérifie tests/chasse.py (console, textes cassés, boutons hors de l'écran ou qui se
recouvrent, clés de textes manquantes, clics impossibles, écran bloqué), et, par écran, les nouveautés qui ne doivent pas se marcher dessus."""
import os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chasse import *

CAS = {'fr1280': ('fr', 1280, 720, False), 'en640': ('en', 640, 360, True)}
choix = [a for a in sys.argv[1:] if a in CAS] or list(CAS)
SEUL_HUD = 'hud' in sys.argv[1:]   # (seulement la partie « en course » : python3 tests/chasse53.py hud)

# en course (la découverte) : rien ne se marche dessus parmi les éléments posés sur l'écran (tour 53, Codeur 6 : « Tiens GAZ » sous 🔊 ⏸ ↩, la prime sur le message de course,
# les écarts de la tour de classement qui revenaient à la ligne, au doigt en 640×360)
CHEVAUCHE = '''()=>{const els=[...document.body.children].flatMap(x=>[x,...x.querySelectorAll("*")]).filter(e=>{
 if(!e.id||e.closest(".cache")||e.tagName==="CANVAS"||e.tagName==="SCRIPT")return false; const cs=getComputedStyle(e); if(cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<0.05)return false;
 if(!(cs.position==="fixed"||cs.position==="absolute"))return false; const r=e.getBoundingClientRect(); return r.width>8&&r.height>8&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight&&(e.textContent.trim()||e.tagName==="BUTTON"||e.tagName==="CANVAS")});
 const out=[];for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j]; if(a.contains(b)||b.contains(a))continue; const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(); const w=Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left),h=Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top); if(w>6&&h>6)out.push(a.id+" / "+b.id+" "+Math.round(w)+"x"+Math.round(h));} return [JEU.ecran,JEU.course&&JEU.course.etat,out]}'''
def hud_course(b, langue, w, h, doigt):
    ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=doigt); pg = ctx.new_page()
    pg.goto('file://' + RACINE + '/index.html?robot=1&tours=3&lang=' + langue, timeout=180000)
    pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "titre"', timeout=120000); pg.wait_for_timeout(1000)
    pg.click('#boutonJouer'); vus = {}; ecart = []
    for i in range(60):
        pg.wait_for_timeout(700)
        r = pg.evaluate(CHEVAUCHE)
        if r[0] == 'course':
            pg.evaluate('() => BOUCLE.simuler(30)')
            for o in r[2]:
                if not o.startswith('tactile ') and ' tactile ' not in o: vus.setdefault(o, i)
            ecart += pg.evaluate('() => [...document.querySelectorAll("#classementListe .ecart")].filter(e => e.getClientRects().length && e.getClientRects().length > 1).map(e => e.textContent)')
        if r[0] in ('podium', 'pilote', 'championnat'): break
    ctx.close()
    return vus, ecart

t0 = time.monotonic()
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for cle in choix:
            langue, w, h, doigt = CAS[cle]
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=doigt); pg = ctx.new_page()
            if SEUL_HUD:
                vus, ecart = hud_course(b, langue, w, h, doigt); t(f'{langue} {w}×{h} : en course, rien ne se marche dessus', not vus, str(vus)); t(f'{langue} {w}×{h} : écarts du classement sur une ligne', not ecart, str(ecart[:5])); ctx.close(); continue
            c = Carriere(pg, langue, f'index.html?robot=1&tours=3&lang={langue}'); c.prefixe = 'chasse53-' + cle
            pg.goto('file://' + RACINE + '/' + c.adresse); c.pret()
            titre = f'nouveau joueur {langue} {w}×{h}' + (' au doigt' if doigt else '')
            arrive = c.jouer(lambda e: e[0] == 'championnat', 500, 'premier lancement')
            t(f'{titre} : titre → découverte → podium → pilote → paddock', arrive, str(c.bloque))
            if arrive:
                g1 = c.jouer(lambda e: e[0] == 'championnat' and e[6] == 1, 1200, 'Grand Prix 1')
                t(f'{titre} : Grand Prix 1 (qualification, course de 3 tours, après-course) jusqu’au paddock', g1, str(c.bloque))
                if g1:
                    g2 = c.jouer(lambda e: e[0] == 'championnat' and e[6] == 2, 1200, 'Grand Prix 2')
                    t(f'{titre} : Grand Prix 2 joué jusqu’au paddock', g2, str(c.bloque))
            rapport(c, titre)
            vus, ecart = hud_course(b, langue, w, h, doigt)
            t(f'{titre} : en course, rien ne se marche dessus (aides, prime, 🔊 ⏸ ↩, message de course, tour de classement)', not vus, str(vus))
            t(f'{titre} : les écarts de la tour de classement tiennent sur une ligne', not ecart, str(ecart[:5]))
            L.append(f'  ({titre} : {time.monotonic() - t0:.0f} s)')
            ctx.close()
    finally:
        b.close()
print(f'RESULTAT {RES["ok"]}/{RES["ok"] + RES["ko"]}'); print('\n'.join(L))
sys.exit(0 if RES['ko'] == 0 else 1)
