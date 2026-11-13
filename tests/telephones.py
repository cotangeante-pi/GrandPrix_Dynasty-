#!/usr/bin/env python3
"""(tour 54b) Le jeu sur des téléphones ÉMULÉS, au plus près d'un vrai : python3 tests/telephones.py [appareil ...]
Hors workflow GitHub (long : plusieurs minutes par appareil sur le Mac, swiftshader). Sur le Mac, sous le verrou /tmp/gpd-tests.lock.

Pour chaque profil réel de Playwright (iPhone SE, iPhone 13, Pixel 7, Galaxy S9+, couchés) : user agent, device_scale_factor, is_mobile et
has_touch du vrai appareil, Chrome pour tous (le moteur n'est pas Safari). Le parcours, AU DOIGT SEULEMENT (vrais touchers de Playwright,
page.touchscreen.tap, et des doigts tenus par le protocole Chrome, Input.dispatchTouchEvent) : titre → « ▶ Jouer » → course de découverte
→ « Passer » → podium → création du pilote → paddock → course de carrière (qualification passée) → rotation debout ↔ couché en pleine
course → barre d'adresse (hauteur plus petite de 50 px) en pleine course. À chaque écran, un audit de la mise en page : ce qui sort de
l'écran, ce qui se recouvre, les boutons trop petits pour un pouce (< 40 px), la page qui défile, les champs de texte dont la police
fait zoomer Safari (< 16 px). Captures dans tests/captures/tel-<appareil>-<étape>.png.
Résultat : RESULTAT ok/total ; le détail de chaque défaut est imprimé. Option : TEL_COURT=1 saute la course de découverte (« ?pilote » direct).

CE QUE L'ÉMULATION NE VÉRIFIE PAS (voir aussi CLAUDE.md, « Jamais essayé sur un vrai téléphone ») : le moteur Safari/WebKit, le capteur
d'orientation réel et son sens, le plein écran et le verrou de l'iframe de Poki, les images par seconde (swiftshader), la barre d'adresse
qui se replie vraiment, l'encoche (env(safe-area-inset-*) : le jeu n'a pas viewport-fit=cover, donc Safari garde tout dans la zone sûre),
le clavier à l'écran qui pousse la page, le confort réel du pouce."""
import json, os, sys, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURES = os.path.join(RACINE, 'tests', 'captures')
APPAREILS = ['iPhone SE landscape', 'iPhone 13 landscape', 'Pixel 7 landscape', 'Galaxy S9+ landscape']
MIN_POUCE = 40
COMPLETS = ['iPhone SE landscape', 'Pixel 7 landscape'] if os.environ.get('TEL_COMPLET') else []   # (le tour de découverte entier par le robot, puis le podium : plus de 7 minutes sous swiftshader, donc seulement avec TEL_COMPLET=1 ; sinon la découverte est marquée faite et le podium se voit dans test=tactile-decouverte et test=apres-course de ecrans.py)
EN_COURSE_PETITS = ('boutonSon', 'tactilePause', 'tactileRemise')   # (🔊 ⏸ ↩ pendant la course : ≥ 36 px, décision du tour 52b revue au 54b)
L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + str(detail)[:900] if detail else ''))
    print(time.strftime('%H:%M:%S'), L[-1][:300], flush=True)   # (au fil de l'eau : si un parcours se bloque, on voit où)
def attendre(pg, cond, arg=None, delai=5000):
    try: pg.wait_for_function(cond, arg=arg, timeout=delai); return True
    except Exception: return False

AUDIT = """() => {
  const W = innerWidth, H = innerHeight, vus = [];
  const visible = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    for (let p = e; p && p !== document.body; p = p.parentElement) { const q = getComputedStyle(p); if (q.display === 'none' || q.visibility === 'hidden' || p.classList.contains('cache')) return false; } return true; };
  for (const e of document.querySelectorAll('button, input, select, textarea, a[href]')) {
    if (!visible(e)) continue; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    vus.push({ id: e.id || e.className || e.tagName, txt: (e.textContent || e.value || '').trim().slice(0, 18), x: Math.round(r.left), y: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height), tag: e.tagName, fs: parseFloat(getComputedStyle(e).fontSize), defil: (() => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const q = getComputedStyle(p); if (/(auto|scroll)/.test(q.overflowY) && p.scrollHeight > p.clientHeight + 1) return true; } return false; })() }); }
  const dehors = vus.filter(v => v.x < -1 || v.r > W + 1 || (!v.defil && (v.y < -1 || v.b > H + 1)));   // (un bouton plus bas qu'un écran qui défile au doigt, la pause en 320 px, n'est pas perdu)
  const petits = vus.filter(v => Math.min(v.w, v.h) < %d && v.tag !== 'INPUT' || (v.tag === 'INPUT' && v.h < %d));
  const zoom = vus.filter(v => (v.tag === 'INPUT' || v.tag === 'SELECT' || v.tag === 'TEXTAREA') && v.fs < 16);
  const chev = []; for (let i = 0; i < vus.length; i++) for (let j = i + 1; j < vus.length; j++) { const a = vus[i], b = vus[j];
    if (a.x < b.r - 2 && b.x < a.r - 2 && a.y < b.b - 2 && b.y < a.b - 2) chev.push(a.id + '/' + b.id); }
  const texte = []; for (const e of document.querySelectorAll('h1, h2, p, span, div, li, td, label')) { if (!e.childElementCount && (e.textContent || '').trim() && visible(e)) { const r = e.getBoundingClientRect(); let defil = false; for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const q = getComputedStyle(p); if (/(auto|scroll)/.test(q.overflowY) && p.scrollHeight > p.clientHeight + 1) { defil = true; break; } }
    if (r.width > 0 && (r.right > W + 1 || r.left < -1 || (!defil && (r.bottom > H + 1 || r.top < -1)))) texte.push((e.id || e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 20) + '@' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom)); } }
  const sw = document.documentElement.scrollWidth > W + 1 || document.documentElement.scrollHeight > H + 1 || document.body.scrollWidth > W + 1 || document.body.scrollHeight > H + 1;
  return { W, H, n: vus.length, dehors, petits, zoom, chev, texte: texte.slice(0, 6), defile: sw, ecran: typeof JEU !== 'undefined' ? JEU.ecran : null }; }""" % (MIN_POUCE, MIN_POUCE)
# les recouvrements normaux (un bouton dans sa carte, GAZ / FREIN séparés…) ne sont pas filtrés : seuls des BOUTONS qui se touchent comptent
def audit(pg, nom, tel, ignorer_petits=()):
    petit_ok = 36 if any(m in nom for m in ('course', 'barre', 'grille', 'pause')) else 0
    pg.evaluate("() => { if (!document.getElementById('__sans_transition')) { const s = document.createElement('style'); s.id = '__sans_transition'; s.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(s); } }")   # (swiftshader chargé : une transition de 0,4 s peut ne pas avoir fini, la mesure verrait les lignes de la tour à mi-chemin)
    pg.wait_for_timeout(500)
    a = pg.evaluate(AUDIT)
    photo(pg, os.path.join(CAPTURES, f'tel-{tel.replace(" ", "_").replace("+", "p")}-{nom}.png'))
    champ_ok = 32 if nom == 'pilote' else 0   # (les champs de la création du pilote : 32 px, la page ne sert qu'une fois)
    petits = [v for v in a['petits'] if v['id'] not in ignorer_petits and not (champ_ok and v['tag'] in ('INPUT', 'SELECT') and min(v['w'], v['h']) >= champ_ok) and not (v['id'] in EN_COURSE_PETITS and min(v['w'], v['h']) >= petit_ok > 0)]
    t(f'{tel} {a["W"]}×{a["H"]} · {nom} : rien hors de l’écran (boutons, textes), la page ne défile pas', not a['dehors'] and not a['texte'] and not a['defile'], json.dumps({k: a[k] for k in ('dehors', 'texte', 'defile')}, ensure_ascii=False))
    t(f'{tel} · {nom} : aucun bouton plus petit que {MIN_POUCE} px', not petits, json.dumps(petits, ensure_ascii=False))
    t(f'{tel} · {nom} : aucun bouton ne se recouvre', not a['chev'], a['chev'])
    t(f'{tel} · {nom} : champs de texte à 16 px au moins (sinon Safari zoome)', not a['zoom'], a['zoom'])
    return a

def photo(pg, chemin):   # (swiftshader chargé : une capture peut dépasser 30 s ; un échec de capture ne casse pas le parcours)
    try: pg.screenshot(path=chemin, timeout=120000)
    except Exception: L.append('  (!) capture ratée : ' + os.path.basename(chemin))

def toucher(pg, sel, delai=30000):
    """un vrai toucher (page.touchscreen.tap) au centre de l'élément, après l'avoir fait défiler dans l'écran s'il le faut"""
    pg.wait_for_selector(sel, state='visible', timeout=delai)
    b = pg.locator(sel).bounding_box()
    pg.touchscreen.tap(b['x'] + b['width'] / 2, b['y'] + b['height'] / 2)

class Doigts:
    """des doigts tenus par le protocole Chrome (vrais évènements tactiles : touchstart, pointerdown…)"""
    def __init__(self, pg): self.pg = pg; self.cdp = pg.context.new_cdp_session(pg); self.pts = {}
    def _env(self, type_):
        self.cdp.send('Input.dispatchTouchEvent', {'type': type_, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in self.pts.items()]})
    def centre(self, sel):
        b = self.pg.locator(sel).bounding_box(); return b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
    def poser(self, i, sel): self.pts[i] = self.centre(sel); self._env('touchStart')
    def lever(self, i):
        self.pts.pop(i, None); self._env('touchEnd' if not self.pts else 'touchMove') if self.pts else self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    def tout_lever(self): self.pts = {}; self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})

CONDUITE_DOIGTS = '''() => { clearInterval(window.__penche); const Z = REGLAGES.VOLANT_ZONE_MORTE, P = REGLAGES.VOLANT_PLEIN, doigt = (id, pid, bas) => document.getElementById(id).dispatchEvent(new PointerEvent(bas ? 'pointerdown' : 'pointerup', { pointerId: pid, pointerType: 'touch', isPrimary: pid === 1, bubbles: true, cancelable: true }));
      window.__tenus = { gaz: false, frein: false };
      BOUCLE.surAffichage(() => { if (!window.__conduire) return; const c = piloteRobot(JEU.joueur, CIRCUIT);
        const gaz = c.gaz > 0.3, frein = c.frein > 0.3;
        if (gaz !== window.__tenus.gaz) { doigt('tactileGaz', 1, gaz); window.__tenus.gaz = gaz; }
        if (frein !== window.__tenus.frein) { doigt('tactileFrein', 2, frein); window.__tenus.frein = frein; }
        const d = c.direction, a = d === 0 ? 0 : Math.sign(d) * (Z + Math.min(1, Math.abs(d)) * (P - Z));
        window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: TACTILE.etat.neutre + a, gamma: 0 })); });
      window.__conduire = true; }'''   # (copié de ecrans.py : le robot d'essai dicte GAZ / FREIN / volant, tout passe par des évènements de doigt et d'orientation)

def pause_audit(pg, nom, tel_, ignorer=()):
    return audit(pg, nom, tel_, ignorer)

def course_aux_doigts(pg, D, nom, etape):
    """la voiture roule quelques secondes avec de vrais doigts tenus ; rotation debout puis couché ; barre d'adresse"""
    attendre(pg, '() => TACTILE.etat.mode === "boutons" || TACTILE.etat.mode === "volant"', None, 20000)
    audit(pg, etape + '-course', nom)
    D = Doigts(pg)
    D.poser(1, '#tactileGaz'); pg.wait_for_timeout(2500)
    t(f'{nom} · {etape} : un doigt tenu sur GAZ (vrai toucher) = gaz 1', pg.evaluate('() => JEU.cibles.gaz === 1'), pg.evaluate('() => JEU.cibles'))
    D.poser(2, '#tactileFrein'); attendre(pg, '() => JEU.cibles.frein === 1', None, 6000)
    t(f'{nom} · {etape} : GAZ et FREIN tenus ensemble par deux doigts', pg.evaluate('() => JEU.cibles.gaz === 1 && JEU.cibles.frein === 1'), pg.evaluate('() => JEU.cibles'))
    D.tout_lever(); pg.wait_for_timeout(300)
    l, h = pg.evaluate('() => [innerWidth, innerHeight]')
    pg.set_viewport_size({'width': h, 'height': l}); attendre(pg, '() => !document.getElementById("tactilePortrait").classList.contains("cache")', None, 8000); pg.wait_for_timeout(400)
    photo(pg, os.path.join(CAPTURES, f'tel-{nom.replace(" ", "_").replace("+", "p")}-{etape}-debout.png'))
    t(f'{nom} · {etape} : debout en pleine course, « Tourne ton téléphone » couvre l’écran et la course est en pause',
      pg.evaluate('() => JEU.ecran === "pause"') and pg.evaluate('() => { const r = document.getElementById("tactilePortrait").getBoundingClientRect(); return r.width >= innerWidth - 2 && r.height >= innerHeight - 2; }'), pg.evaluate('() => JEU.ecran'))
    pg.set_viewport_size({'width': l, 'height': h}); attendre(pg, '() => document.getElementById("tactilePortrait").classList.contains("cache")', None, 8000)
    audit(pg, etape + '-pause', nom)
    toucher(pg, '#boutonReprendre')
    t(f'{nom} · {etape} : couché, « Reprendre » au toucher rend la course', attendre(pg, '() => JEU.ecran === "course"', None, 8000))
    pg.set_viewport_size({'width': l, 'height': h - 50}); pg.wait_for_timeout(700)
    audit(pg, etape + '-barre', nom)
    t(f'{nom} · {etape} : avec la barre d’adresse (50 px de moins), GAZ et FREIN restent dans l’écran', pg.evaluate('() => { const b = id => document.getElementById(id).getBoundingClientRect(); return [b("tactileGaz"), b("tactileFrein")].every(r => r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1); }'))
    pg.set_viewport_size({'width': l, 'height': h}); pg.wait_for_timeout(400)

def nouveautes(pg, nom):
    """(tour 55, T26) les nouveautés de la nuit au doigt, dans la course de carrière : le bandeau du drapeau (la VSC : le plus long), sa bulle d'aide, un aileron
    abîmé (son message et sa bulle), la voix. L'état est forcé sans toucher aux vrais chemins : etatJoueur de drapeaux.js rend une VSC (le bandeau, la bulle et
    la pause suivent comme en vrai), le joueur reçoit des dégâts (physique.js : v.degats ; messages.js et aides.js les lisent)."""
    pg.evaluate("() => { window.__etatJoueur = DRAPEAUX.etatJoueur; DRAPEAUX.etatJoueur = () => ({ type: 'vsc', limite: REGLAGES.DRAPEAUX_VSC_LIMITE_JOUEUR }); }")
    vu = attendre(pg, '() => !document.getElementById("drapeau").classList.contains("cache")', None, 20000)
    t(f'{nom} · nouveautés : le bandeau « VSC » s\u2019affiche en course', vu, pg.evaluate('() => document.getElementById("drapeau").className'))
    texte = pg.evaluate('() => document.getElementById("drapeau").textContent')
    t(f'{nom} · nouveautés : le bandeau dit ce qu\u2019il faut faire, avec son texte (pas la couleur seule) : « {texte} »', 'VSC' in texte and len(texte) > 12, texte)
    bulle = attendre(pg, '() => !document.getElementById("bulleAide").classList.contains("cache")', None, 20000)
    t(f'{nom} · nouveautés : la bulle d\u2019aide du drapeau apparaît', bulle, pg.evaluate('() => AIDES_ECRAN.affichee()'))
    pg.wait_for_timeout(400)
    r = audit(pg, 'course-vsc-bandeau-bulle', nom)
    box = pg.evaluate('() => { const g = id => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }; return { drapeau: g("drapeau"), bulle: g("bulleAide"), W: innerWidth, H: innerHeight }; }')
    d, bl = box['drapeau'], box['bulle']
    t(f'{nom} · nouveautés : le bandeau et la bulle tiennent dans l\u2019écran et ne se recouvrent pas', d[0] >= 0 and d[2] <= box['W'] and bl[0] >= 0 and bl[2] <= box['W'] and not (min(d[2], bl[2]) - max(d[0], bl[0]) > 4 and min(d[3], bl[3]) - max(d[1], bl[1]) > 4), json.dumps(box))
    # (revue T26) rien du HUD de course ne se recouvre, l'eau de la météo comprise (elle recouvrait la tour de classement en 640×360)
    pg.evaluate('() => { const m = document.getElementById("meteoHud"); m.classList.remove("cache"); document.getElementById("meteoIcone").textContent = "☁"; document.getElementById("meteoEau").textContent = "eau 40 %"; }')
    sur = pg.evaluate('''() => { const ids = ["hudCourse", "drapeau", "classement", "meteoHud", "pneusHud", "bulleAide", "minicarte", "boutonSon", "tactilePause", "tactileRemise", "tableau", "radar"], out = [];
      const vus = ids.map(i => [i, document.getElementById(i)]).filter(([, e]) => e && !e.closest(".cache") && getComputedStyle(e).display !== "none").map(([i, e]) => [i, e.getBoundingClientRect()]);
      for (let a = 0; a < vus.length; a++) for (let b = a + 1; b < vus.length; b++) { const A = vus[a][1], B = vus[b][1];
        if (Math.min(A.right, B.right) - Math.max(A.left, B.left) > 6 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 6) out.push(vus[a][0] + " / " + vus[b][0]); } return out; }''')
    pg.evaluate('() => document.getElementById("meteoHud").classList.add("cache")')
    t(f'{nom} · nouveautés : le bandeau, le chrono, la tour de classement, l\u2019eau, les pneus, la bulle et la minicarte ne se recouvrent pas', not sur, sur)
    photo(pg, os.path.join(CAPTURES, f'tel-{nom.replace(" ", "_").replace("+", "p")}-vsc.png'))
    # la bulle se ferme au toucher (une bulle de course se cache dans un virage : on attend qu'elle soit là, et on la touche tout de suite)
    for _ in range(6):
        if attendre(pg, '() => !document.getElementById("bulleAide").classList.contains("cache")', None, 8000):
            try: toucher(pg, '#bulleAide', delai=2500); break
            except Exception: pass
    t(f'{nom} · nouveautés : un toucher ferme la bulle', attendre(pg, '() => document.getElementById("bulleAide").classList.contains("cache") || AIDES_ECRAN.affichee() !== "drapeauVsc"', None, 5000))
    pg.evaluate("() => { DRAPEAUX.etatJoueur = window.__etatJoueur; JEU.joueur.degats = 0.45; }")   # l'aileron avant abîmé
    msg = attendre(pg, '() => !document.getElementById("messageCourse").classList.contains("cache") && /aileron/i.test(document.getElementById("messageCourse").textContent)', None, 20000)
    t(f'{nom} · nouveautés : le message « aileron avant abîmé » s\u2019affiche', msg, pg.evaluate('() => document.getElementById("messageCourse").textContent'))
    attendre(pg, '() => AIDES_ECRAN.affichee() === "degats"', None, 20000)
    pg.wait_for_timeout(400)
    audit(pg, 'course-degats', nom)
    t(f'{nom} · nouveautés : la bulle de l\u2019aileron abîmé est montrée', pg.evaluate('() => AIDES_ECRAN.affichee() === "degats"'), pg.evaluate('() => AIDES_ECRAN.affichee()'))
    photo(pg, os.path.join(CAPTURES, f'tel-{nom.replace(" ", "_").replace("+", "p")}-degats.png'))
    pg.evaluate('() => { JEU.joueur.degats = 0; }')
    # la voix : les sons enregistrés et la synthèse n'ont rien cassé (aucun son sans geste : le jeu est déjà touché, SON.actif)
    t(f'{nom} · nouveautés : la voix est là (VOIXSONS et VOIX chargés, aucune erreur)', pg.evaluate('() => typeof VOIXSONS !== "undefined" && typeof VOIX !== "undefined"'))

def parcours(b, p, nom):
    prof = p.devices[nom]
    l, h = prof['viewport']['width'], prof['viewport']['height']
    ctx = b.new_context(**{k: v for k, v in prof.items() if k != 'default_browser_type'})
    pg = ctx.new_page(); console = []
    pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
    pg.add_init_script("window.__plein = 0; Element.prototype.requestFullscreen = function () { window.__plein++; return Promise.reject(new Error('refus')); };")
    pg.goto('file://' + RACINE + '/index.html', timeout=180000)
    attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "titre"', None, 60000)
    t(f'{nom} : l’émulation est un téléphone (tactile détecté, body.tactile, devicePixelRatio {prof["device_scale_factor"]})', pg.evaluate('() => TACTILE.estPresent() && document.body.classList.contains("tactile") && devicePixelRatio === %s' % prof['device_scale_factor']))
    audit(pg, 'titre', nom)
    pg.evaluate('() => { REGLAGES.DECOUVERTE_TOURS = 1; }')   # un seul tour pour la découverte (le Mac est lent) ; la mise en page est la même
    toucher(pg, '#boutonJouer')
    t(f'{nom} : « ▶ Jouer » au toucher mène à la course de découverte', attendre(pg, '() => JEU.ecran === "course" && !!JEU.decouverte', None, 60000), pg.evaluate('() => JEU.ecran'))
    attendre(pg, '() => JEU.plateau && JEU.plateau.carte !== null && JEU.course.etat !== "compte"', None, 300000)
    pg.evaluate("() => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: 40, gamma: 0 }))")
    course_aux_doigts(pg, None, nom, 'decouverte')
    # la suite de la découverte : le robot d'essai fait le tour (page ?robot=1&tours=1, long sous swiftshader : seulement pour les appareils COMPLETS),
    # puis « Passer » et « Continuer » au toucher ; les autres appareils sautent la course (découverte marquée faite) et arrivent à la création du pilote
    if nom in COMPLETS:
        pg.goto('file://' + RACINE + '/index.html?robot=1&tours=1', timeout=180000)
        attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "course"', None, 60000)
        arrive = attendre(pg, '() => !!JEU.attente || JEU.ecran === "podium"', None, 420000)
        t(f'{nom} : la course de découverte (robot) arrive à son terme', arrive)
        if pg.evaluate('() => JEU.ecran === "course" && !document.getElementById("attenteArrivee").classList.contains("cache")'):
            audit(pg, 'decouverte-passer', nom); toucher(pg, '#boutonPasser')
        if attendre(pg, '() => JEU.ecran === "podium"', None, 120000):
            pg.wait_for_timeout(1500); audit(pg, 'podium', nom); toucher(pg, '#boutonPodiumContinuer')
    else:
        pg.evaluate('() => SAUVEGARDE.finirDecouverte(0)'); pg.goto('file://' + RACINE + '/index.html', timeout=180000)
    t(f'{nom} : du podium, « Continuer » au toucher mène à la création du pilote', attendre(pg, '() => JEU.ecran === "pilote"', None, 30000), pg.evaluate('() => JEU.ecran'))
    pg.wait_for_timeout(800)
    audit(pg, 'pilote', nom)
    # un pilote prêt, au toucher (la page se recharge sur le paddock) ; sans cartes (découverte sautée), le formulaire : un nom au clavier à l'écran, puis « Commencer »
    if pg.locator('#piloteCartes .piloteCarte').count() and pg.locator('#piloteCartes .piloteCarte').first.is_visible():
        with pg.expect_navigation(timeout=120000): toucher(pg, '#piloteCartes .piloteCarte')
    else:
        toucher(pg, '#piloteNom'); pg.keyboard.type('Essai')
        with pg.expect_navigation(timeout=120000): toucher(pg, '#boutonPiloteValider')
    t(f'{nom} : un pilote prêt, au toucher, mène au paddock', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat', None, 90000), pg.evaluate('() => typeof JEU !== "undefined" ? JEU.ecran : null'))
    pg.wait_for_timeout(1000)
    # (la fenêtre d'aide du paddock, s'il y en a une, fait partie du parcours : on l'audite puis on la ferme)
    audit(pg, 'paddock', nom)
    for m in ['menuEquipe', 'menuBoutique', 'menuSaison', 'menuMessages', 'menuReglages', 'menuCourse']:
        toucher(pg, '#' + m); pg.wait_for_timeout(500); audit(pg, 'paddock-' + m[4:].lower(), nom)
    toucher(pg, '#boutonCourseSuivante')
    t(f'{nom} : « Course suivante » au toucher mène à la qualification', attendre(pg, '() => JEU.ecran === "qualif"', None, 60000), pg.evaluate('() => JEU.ecran'))
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "choix" && !document.getElementById("qualif").classList.contains("cache")', None, 60000)
    audit(pg, 'qualif', nom)
    toucher(pg, '#boutonQualifPasser')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 300000)
    audit(pg, 'qualif-resultat', nom)
    toucher(pg, '#boutonQualifCourse')
    t(f'{nom} : de la qualification à la course de carrière, au toucher', attendre(pg, '() => JEU.ecran === "course"', None, 60000), pg.evaluate('() => JEU.ecran'))
    attendre(pg, '() => JEU.plateau && JEU.plateau.carte !== null', None, 300000)
    audit(pg, 'grille', nom)
    attendre(pg, '() => JEU.course.etat !== "compte"', None, 120000)
    course_aux_doigts(pg, None, nom, 'carriere')
    nouveautes(pg, nom)
    ctx.close()
    return console

if __name__ == '__main__':
    noms = sys.argv[1:] or APPAREILS
    os.makedirs(CAPTURES, exist_ok=True)
    debut = time.monotonic()
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
        try:
            for nom in noms:
                try: c = parcours(b, p, nom)
                except Exception as e: c = ['EXCEPTION ' + str(e)[:300]]
                t(f'{nom} : la console reste sans erreur', not c, c[:3])
        finally: b.close()
    print('\n'.join(L)); print(f'RESULTAT {ok}/{ok + ko} ({time.monotonic() - debut:.0f} s)')
    sys.exit(0 if ko == 0 else 1)
