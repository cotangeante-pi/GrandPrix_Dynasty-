#!/usr/bin/env python3
"""Le jeu tourné de 90° (tour 56, T15) : python3 tests/tourne.py
Un téléphone ÉMULÉ (has_touch) en 640×360 lance la course d'essai, puis passe DEBOUT (360×640) : le jeu doit s'afficher tourné de 90°
(html.tourne), sans le message « Tourne ton téléphone » et sans pause ; un toucher (vrai, par le protocole Chrome) sur GAZ fait son effet ;
le volant (faux évènements d'orientation, téléphone debout, roulis dans son plan) braque du bon côté ; couché de nouveau, tout redevient
comme avant. Avec PORTRAIT_TOURNER faux : le message et la pause d'avant. Et tests/tourne-css.py --verifier (les @media aux dimensions
échangées sont à jour). Page ciblée, sans test.html ni ecrans entier : une minute sur le Mac."""
import math, os, re, subprocess, sys, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURES = os.path.join(RACINE, 'tests', 'captures')
L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + str(detail)[:900] if detail else ''))
    print(time.strftime('%H:%M:%S'), L[-1][:240], flush=True)
def attendre(pg, cond, arg=None, delai=8000):
    try: pg.wait_for_function(cond, arg=arg, timeout=delai); return True
    except Exception: return False

def angles_debout(theta, gz=0.3):
    """beta et gamma (°) d'un téléphone tenu debout, penché en arrière (gz = la part de la gravité sur l'écran), tourné de theta° dans son plan
    (theta > 0 : sens des aiguilles d'une montre, le haut du téléphone part vers la droite) : la gravité mesurée vaut (-cos b sin g, sin b, cos b cos g)"""
    n = math.sqrt(1 - gz * gz); gy, gx = n * math.cos(math.radians(theta)), -n * math.sin(math.radians(theta))
    b = math.asin(gy); g = math.asin(max(-1, min(1, -gx / math.cos(b))))
    return math.degrees(b), math.degrees(g)
ORIENTER = "([b, g]) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: b, gamma: g, absolute: false }))"
ETAT = '''() => { const r = id => { const e = document.getElementById(id), q = e.getBoundingClientRect(); return { x: q.left, y: q.top, l: q.width, h: q.height, cache: e.classList.contains('cache') }; };
  return { tourne: document.documentElement.classList.contains('tourne'), ecran: JEU.ecran, portrait: r('tactilePortrait'), gaz: r('tactileGaz'), frein: r('tactileFrein'), pause: r('tactilePause'),
    W: innerWidth, H: innerHeight, corps: [document.body.offsetWidth, document.body.offsetHeight], jw: getComputedStyle(document.documentElement).getPropertyValue('--jw'),
    scene: [document.querySelector('#scene3d canvas').clientWidth, document.querySelector('#scene3d canvas').clientHeight], direction: JEU.cibles.direction, gazC: JEU.cibles.gaz, mode: TACTILE.etat.mode }; }'''

def doigt(cdp, x, y, bas):
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart' if bas else 'touchEnd', 'touchPoints': [{'x': x, 'y': y, 'id': 1}] if bas else []})

def partie(b, tourner):
    titre = 'jeu tourné' if tourner else 'PORTRAIT_TOURNER faux'
    ctx = b.new_context(viewport={'width': 640, 'height': 360}, has_touch=True, is_mobile=True); pg = ctx.new_page(); console = []
    LECT = re.compile(r'\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels')
    pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECT.fullmatch(m.text) else None)
    pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
    pg.add_init_script('window.__plein = 0; try { Element.prototype.requestFullscreen = function () { return Promise.resolve(); }; screen.orientation.lock = () => Promise.resolve(); } catch (e) {} try { DeviceOrientationEvent.requestPermission = undefined; } catch (e) {}')
    pg.goto('file://' + RACINE + '/index.html?course=3&circuit=test&test=tactile'); pg.wait_for_timeout(1500)
    pret = attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "course"', None, 60000)
    t(f'{titre} : la course d\'essai est lancée sur un téléphone émulé', pret)
    pg.evaluate('(v) => { REGLAGES.PORTRAIT_TOURNER = v; }', tourner)
    if pg.evaluate('() => JEU.ecran') != 'course': ctx.close(); return
    cdp = ctx.new_cdp_session(pg)
    a = pg.evaluate(ETAT)
    t(f'{titre} : couché (640×360), rien n\'est tourné', not a['tourne'] and a['W'] == 640 and a['corps'] == [640, 360] and a['jw'].strip() == '', str(a))
    pg.set_viewport_size({'width': 360, 'height': 640})
    if tourner:
        attendre(pg, '() => document.documentElement.classList.contains("tourne")', None, 8000); pg.wait_for_timeout(600)
        d = pg.evaluate(ETAT)
        t(f'{titre} : debout (360×640), le jeu est tourné : html.tourne, le jeu mesure 640×360, le dessin 3D aussi', d['tourne'] and d['corps'] == [640, 360] and d['scene'] == [640, 360], str(d))
        t(f'{titre} : debout, ni message « Tourne ton téléphone » ni pause : la course continue', d['portrait']['cache'] and d['ecran'] == 'course', str([d['portrait'], d['ecran']]))
        pg.screenshot(path=os.path.join(CAPTURES, 'tourne-360x640.png'))
        # le haut du jeu est à gauche : le bouton ⏸ (haut) est à gauche de GAZ ; GAZ (bas à droite du jeu) est en haut à droite de la fenêtre, FREIN en bas à droite
        gz, fr = d['gaz'], d['frein']
        cx = lambda r: r['x'] + r['l'] / 2; cy = lambda r: r['y'] + r['h'] / 2
        t(f'{titre} : GAZ et FREIN sont du côté du pouce droit (moitié droite de la fenêtre), GAZ au-dessus de FREIN, tous deux dans l\'écran',
          cx(gz) > 180 and cx(fr) > 180 and cy(gz) < cy(fr) and gz['x'] >= 0 and gz['x'] + gz['l'] <= 360 and fr['y'] + fr['h'] <= 640 and gz['y'] >= 0, str([gz, fr]))
        # (T15b) les rectangles ramenés dans le jeu : les mêmes que couché ; la croix de la manette va du bon côté
        rj = pg.evaluate('() => { const q = id => { const r = TACTILE.rectJeu(document.getElementById(id)); return { x: r.left, y: r.top, l: r.width, h: r.height }; }; return { gaz: q("tactileGaz"), frein: q("tactileFrein"), pause: q("tactilePause") }; }')
        proche = lambda u, v: all(abs(u[k] - v[k]) <= 1.5 for k in ('x', 'y', 'l', 'h'))
        coucheGaz = {'x': a['gaz']['x'], 'y': a['gaz']['y'], 'l': a['gaz']['l'], 'h': a['gaz']['h']}; coucheFrein = {'x': a['frein']['x'], 'y': a['frein']['y'], 'l': a['frein']['l'], 'h': a['frein']['h']}
        t(f'{titre} : rectJeu ramène GAZ et FREIN dans le jeu : les mêmes rectangles que couché', proche(rj['gaz'], coucheGaz) and proche(rj['frein'], coucheFrein), str([rj, coucheGaz, coucheFrein]))
        v = pg.evaluate('(r) => [MANETTE.voisin([r.frein, r.gaz], 0, "droite"), MANETTE.voisin([r.frein, r.gaz], 1, "gauche"), MANETTE.voisin([r.frein, r.gaz], 0, "haut")]', rj)
        t(f'{titre} : la croix de la manette dans le jeu tourné : de FREIN (à gauche dans le jeu) vers la droite = GAZ, et retour vers la gauche', v[0] == 1 and v[1] == 0, str(v))
        # un vrai toucher sur GAZ (aux coordonnées de la FENÊTRE : le navigateur suit la rotation) fait son effet
        doigt(cdp, cx(gz), cy(gz), True); ok_gaz = attendre(pg, '() => JEU.cibles.gaz === 1', None, 5000)
        doigt(cdp, cx(gz), cy(gz), False); lache = attendre(pg, '() => JEU.cibles.gaz === 0', None, 5000)
        t(f'{titre} : un doigt posé sur GAZ (aux coordonnées de la fenêtre) donne gaz 1, levé 0', ok_gaz and lache, str([ok_gaz, lache]))
        doigt(cdp, cx(fr), cy(fr), True); ok_fr = attendre(pg, '() => JEU.cibles.frein === 1', None, 5000); doigt(cdp, cx(fr), cy(fr), False)
        t(f'{titre} : un doigt sur FREIN donne frein 1', ok_fr)
        # le volant : debout, on tourne le téléphone dans son plan, comme un volant ; la première mesure est le neutre
        pg.evaluate('() => { REGLAGES.VOLANT_INVERSE = false; }')
        pg.evaluate(ORIENTER, list(angles_debout(0))); attendre(pg, '() => TACTILE.etat.mode === "volant"', None, 4000)
        pg.evaluate('([b, g]) => { window.__angles = [b, g]; clearInterval(window.__penche); window.__penche = setInterval(() => window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { alpha: 0, beta: window.__angles[0], gamma: window.__angles[1] })), 16); }', list(angles_debout(0)))
        pg.evaluate('(a) => { window.__angles = a; }', list(angles_debout(35)))
        droite = attendre(pg, '() => JEU.cibles.direction >= 0.98', None, 6000)
        pg.evaluate('(a) => { window.__angles = a; }', list(angles_debout(-35)))
        gauche = attendre(pg, '() => JEU.cibles.direction <= -0.98', None, 6000)
        pg.evaluate('(a) => { window.__angles = a; }', list(angles_debout(4)))
        zone = attendre(pg, '() => JEU.cibles.direction === 0', None, 6000)
        t(f'{titre} : le volant debout : tourné de 35° dans le sens des aiguilles d\'une montre = braquage à droite à fond, de 35° dans l\'autre sens = à gauche, 4° = tout droit (zone morte)', droite and gauche and zone, str([droite, gauche, zone, pg.evaluate('() => JEU.cibles.direction')]))
        pg.evaluate('() => clearInterval(window.__penche)')
        # glisser (caméra libre) : l'écart de la fenêtre est ramené dans le jeu
        e = pg.evaluate('() => [TACTILE.ecartJeu(10, 0), TACTILE.ecartJeu(0, 10), TACTILE.tailleJeu()]')
        t(f'{titre} : un glissé vers la droite de la fenêtre = vers le BAS du jeu ; vers le bas de la fenêtre = vers la DROITE... du haut vers la gauche (x_jeu = −dy, y_jeu = dx)', e[0] == {'x': 0, 'y': 10} and e[1] == {'x': -10, 'y': 0} and e[2] == {'l': 640, 'h': 360}, str(e))
        # couché de nouveau : tout redevient comme avant
        pg.set_viewport_size({'width': 640, 'height': 360}); attendre(pg, '() => !document.documentElement.classList.contains("tourne")', None, 8000); pg.wait_for_timeout(500)
        c = pg.evaluate(ETAT)
        t(f'{titre} : couché de nouveau, le jeu est droit (plus de html.tourne), la course continue', not c['tourne'] and c['corps'] == [640, 360] and c['ecran'] == 'course' and c['jw'].strip() == '', str(c))
    else:
        attendre(pg, '() => JEU.ecran === "pause"', None, 8000); pg.wait_for_timeout(400)
        d = pg.evaluate(ETAT)
        t(f'{titre} : debout : « Tourne ton téléphone », la course en pause, rien de tourné', d['ecran'] == 'pause' and not d['portrait']['cache'] and not d['tourne'], str(d))
    t(f'{titre} : aucune erreur ni avertissement dans la console', not console, ' | '.join(console[:5]))
    ctx.close()

os.makedirs(CAPTURES, exist_ok=True)
t0 = time.monotonic()
r = subprocess.run([sys.executable, os.path.join(RACINE, 'tests', 'tourne-css.py'), '--verifier'], capture_output=True, text=True)
t('style.css : les @media aux dimensions échangées (tests/tourne-css.py) sont à jour', r.returncode == 0, r.stdout + r.stderr)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        partie(b, True); partie(b, False)
    finally: b.close()
print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L)); print(f'⏱ {time.monotonic() - t0:.0f} s')
sys.exit(0 if ko == 0 else 1)
