#!/usr/bin/env python3
"""(tour 56, T7) Une course en ligne de bout en bout : python3 tests/enligne-course.py
Deux pages de la vraie page de jeu, dans le même navigateur, reliées par un BroadcastChannel (reseau.js, transport « diffusion » : la page de l'hôte
fait le relais) : l'hôte crée la salle, l'autre la rejoint par son code, l'hôte lance, chacune construit la même course (enligne.js) et le robot
d'essai conduit les deux voitures ; 1 tour du circuit d'essai avec 0 puis 2 IA. Vérifie : la course part, les deux pages arrivent au podium, les
arrivées et le classement final sont identiques au bit près des deux côtés, aucune désynchro, aucune erreur dans la console. Les pas de physique
sont donnés par BOUCLE.simuler (le dessin du Mac, en logiciel, serait bien trop lent), par petites tranches, une page puis l'autre.
Plafond dur : 14 minutes ; sans prise sur le verrou des tests du Mac (à prendre par l'appelant)."""
import json, os, signal, sys, threading, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# un garde-fou qui marche même si Playwright bloque le fil principal (signal.alarm n'y suffit pas : vu le 2026-11-13, un passage est resté des heures) :
# au bout de 14 minutes, tout le groupe de processus (Python, Playwright, Chrome) est tué
def _garde():
    print('✘ enligne-course.py : plus de 14 min, arrêté', flush=True)
    try: os.killpg(os.getpgid(0), signal.SIGKILL)
    except Exception: os._exit(2)
_t = threading.Timer(840, _garde); _t.daemon = True; _t.start()
ok_tout = True
try: os.setpgrp()   # (son propre groupe de processus : le garde-fou ci-dessous emporte Playwright et Chrome avec lui, jamais un enfant orphelin qui tient un tube ouvert)
except Exception: pass
def dire(ok, nom, detail=''):
    global ok_tout
    ok_tout = ok_tout and ok
    print(('✔ ' if ok else '✘ ') + nom + (' — ' + str(detail) if (detail and not ok) else ''), flush=True)

def attendre(pg, expr, ms=30000):
    """Attend qu'une expression soit vraie dans la page. Une boucle d'evaluate à nous (la page de l'invité se recharge en route ; ENLIGNE_ECRAN est une const, pas window.ENLIGNE_ECRAN). Le défaut de wait_for_function (requestAnimationFrame) ne tourne pas dans un onglet qui n'est pas au premier plan."""
    t0 = time.monotonic(); derniere = None
    while time.monotonic() - t0 < ms / 1000:
        try:
            if pg.evaluate(expr): return True
        except Exception as e: derniere = e   # (page en train de se recharger)
        time.sleep(0.1)
    raise TimeoutError('attendre : %s (%s)' % (expr[:90], derniere))

def course(b, nom, ia, joueurs=2, tours=1):
    ctx = b.new_context(viewport={'width': 960, 'height': 600})
    erreurs = []
    canal = 'essai-%d-%d' % (os.getpid(), time.time())
    pages = []
    for i in range(joueurs):
        pg = ctx.new_page(); pg.set_default_timeout(30000)
        pg.on('pageerror', lambda e, i=i: erreurs.append('page %d : %s' % (i, e)))
        pg.on('console', lambda m, i=i: erreurs.append('console %d : %s' % (i, m.text)) if m.type in ('error', 'warning') else None)
        pages.append(pg)
    base = 'file://' + RACINE + '/index.html?circuit=test&robot=1&tours=%d&ia=%d&canal=%s&joueurs=%d' % (tours, ia, canal, joueurs)
    pages[0].goto(base + '&enlignecourse=hote&nom=bleu', wait_until='domcontentloaded', timeout=120000)
    pages[0].wait_for_function('() => window.__enligne && window.__enligne.code', polling=100, timeout=30000)
    code = pages[0].evaluate('() => window.__enligne.code')
    dire(len(code) == 4 and not any(c in 'AEIOUY' for c in code), nom + ' : un code de salle sans voyelle', code)
    for i in range(1, joueurs):
        pages[i].goto(base + '&enlignecourse=%s&nom=%s' % (code, ['bleu', 'rouge', 'jaune', 'vert'][i]), wait_until='domcontentloaded', timeout=120000)
    for pg in pages:
        attendre(pg, '() => window.__enligne && window.__enligne.partie', 60000)
    dire(True, nom + ' : la course part sur les %d pages' % joueurs)
    t0 = time.monotonic(); resumes = None
    while time.monotonic() - t0 < 700:
        resumes = [pg.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(24); return ENLIGNE_PAGE.resume(); }') for pg in pages]
        if all(r['ecran'] in ('podium', 'resultats') for r in resumes): break
        if any(r['desynchro'] for r in resumes): break
        time.sleep(0.02)
    dire(all(r['ecran'] in ('podium', 'resultats') for r in resumes), nom + ' : toutes les pages arrivent au podium (%.0f s, pas %s)' % (time.monotonic() - t0, [r['n'] for r in resumes]), [r['ecran'] for r in resumes])
    dire(not any(r['desynchro'] for r in resumes), nom + ' : aucune désynchro', [r['desynchro'] for r in resumes])
    dire(all(r['final'] is not None for r in resumes) and all(r['final'] == resumes[0]['final'] for r in resumes), nom + ' : le même classement final partout', [r['final'] for r in resumes])
    dire(all(r['arrivees'] == resumes[0]['arrivees'] for r in resumes), nom + ' : les mêmes temps d\'arrivée au bit près', [r['arrivees'] for r in resumes])
    if resumes[0]['final']: print('   classement : ' + ' '.join('P%d=k%d' % (x[1], x[0]) for x in resumes[0]['final']))
    dire(not erreurs, nom + ' : console vide', erreurs[:3])
    ctx.close()

def salle_prete(pg, nom):
    attendre(pg, '() => ENLIGNE_ECRAN.etat().ecran === "enligneSalle"', 30000)

def course_ecrans(b, nom='écrans de salle'):
    # les vrais écrans de salle (enligne-ecran.js) : l'hôte crée sa salle sur le circuit « technique », l'invité (page chargée sur le circuit « test ») la rejoint par son code,
    # voit le circuit de l'hôte et se recharge dessus (jeton, grâce du relais), se met prêt ; l'hôte lance ; 1 tour ; retour à la salle ; une 2e course ; mêmes résultats
    ctx = b.new_context(viewport={'width': 960, 'height': 600})
    erreurs = []; canal = 'ecrans-%d-%d' % (os.getpid(), time.time())
    hote = ctx.new_page(); invite = ctx.new_page(); pages = [hote, invite]
    for i, pg in enumerate(pages):
        pg.set_default_timeout(30000)
        pg.on('pageerror', lambda e, i=i: erreurs.append('page %d : %s' % (i, e)))
        pg.on('console', lambda m, i=i: erreurs.append('console %d : %s' % (i, m.text)) if m.type in ('error', 'warning') else None)
    base = 'file://' + RACINE + '/index.html?robot=1&tours=1&ia=0&canal=' + canal
    hote.goto(base + '&circuit=technique&enlignecourse=menu', wait_until='domcontentloaded', timeout=120000)
    attendre(hote, '() => ENLIGNE_ECRAN.etat().ecran === "enligne"', 30000)
    hote.click('#boutonEnligneCreer'); salle_prete(hote, 'hote')
    etat = hote.evaluate('() => ENLIGNE_ECRAN.etat()'); code = etat['code']
    dire(len(code) == 4 and etat['hote'], nom + ' : l\'hôte crée la salle ' + code, etat)
    dire(etat['reglages']['circuit'] == 'technique', nom + ' : l\'hôte propose le circuit de sa page', etat['reglages'])
    invite.goto(base + '&circuit=test&enlignecourse=menu', wait_until='domcontentloaded', timeout=120000)
    attendre(invite, '() => ENLIGNE_ECRAN.etat().ecran === "enligne"', 30000)
    invite.click('#boutonEnligneRejoindre'); invite.fill('#enligneCode', code); invite.click('#boutonEnligneGo')
    # l'invité se recharge sur le circuit de l'hôte puis revient dans la salle
    attendre(invite, '() => /circuit=technique/.test(location.search) && /enlignecourse=reprise/.test(location.search)', 30000)
    try:
        attendre(invite, '() => typeof ENLIGNE_ECRAN !== "undefined" && ENLIGNE_ECRAN.etat().ecran === "enligneSalle" && ENLIGNE_ECRAN.etat().joueurs.length === 2', 60000)
    except Exception:
        print('DIAG invité :', invite.url, invite.evaluate('() => JSON.stringify({e: ENLIGNE_ECRAN.etat(), s: sessionStorage.getItem("gpd-enligne-session"), msg: document.getElementById("enligneMessage") && document.getElementById("enligneMessage").textContent})'), erreurs[:5], flush=True)
        print('DIAG hôte :', hote.evaluate('() => JSON.stringify(ENLIGNE_ECRAN.etat())'), flush=True)
        raise
    ei = invite.evaluate('() => ENLIGNE_ECRAN.etat()')
    dire(sorted(j['nom'] for j in ei['joueurs']) == ['bleu', 'bleu-2'], nom + ' : les noms sur le fil (la couleur prise reçoit -2)', [j['nom'] for j in ei['joueurs']])
    dire(not any(j.get('absent') for j in ei['joueurs']), nom + ' : l\'invité est revenu dans la salle (même place)', ei['joueurs'])
    attendre(hote, '() => ENLIGNE_ECRAN.etat().joueurs.length === 2 && ENLIGNE_ECRAN.etat().joueurs.every(j => j.circuit === "technique")', 30000)
    dire(True, nom + ' : les deux pages ont annoncé le circuit « technique »')
    invite.click('#boutonEnlignePret')
    attendre(hote, '() => !document.getElementById("boutonEnligneLancer").disabled', 30000)
    for k in (1, 2):
        if k == 2:
            attendre(hote, '() => !document.getElementById("boutonEnligneLancer").disabled', 30000)
        hote.click('#boutonEnligneLancer')
        for pg in pages:
            attendre(pg, '() => window.__enligne && window.__enligne.partie', 120000)
        dire(True, nom + ' : course %d : elle part sur les 2 pages' % k)
        t0 = time.monotonic(); resumes = None
        while time.monotonic() - t0 < 700:
            resumes = [pg.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(24); return ENLIGNE_PAGE.resume(); }') for pg in pages]
            if all(r['ecran'] in ('podium', 'resultats') for r in resumes) or any(r['desynchro'] for r in resumes): break
            time.sleep(0.02)
        dire(all(r['ecran'] in ('podium', 'resultats') for r in resumes), nom + ' : course %d : les deux pages arrivent au podium (%.0f s)' % (k, time.monotonic() - t0), [r['ecran'] for r in resumes])
        dire(not any(r['desynchro'] for r in resumes), nom + ' : course %d : aucune désynchro' % k)
        dire(all(r['final'] is not None and r['final'] == resumes[0]['final'] for r in resumes) and all(r['arrivees'] == resumes[0]['arrivees'] for r in resumes), nom + ' : course %d : mêmes résultats partout' % k, [r['final'] for r in resumes])
        # nos Math sont rendues (terminer) : plus de fonction remplacée après la course
        pg_maths = [pg.evaluate('() => (ENLIGNE_PAGE.etat.partie ? ENLIGNE_PAGE.etat.partie : null) && Math.sin.toString().includes("[native code]")') for pg in pages]
        if k == 1:
            hote.evaluate('() => ENLIGNE_PAGE.retourSalle()')
            for pg in pages:
                attendre(pg, '() => ENLIGNE_ECRAN.etat().ecran === "enligneSalle" && !window.__enligne.partie', 30000)
            dire(all(pg.evaluate('() => Math.sin.toString().includes("[native code]") && Math.atan2.toString().includes("[native code]")') for pg in pages), nom + ' : les Math du navigateur sont revenues')
            attendre(invite, '() => ENLIGNE_ECRAN.etat().joueurs.every(j => !j.pret || j.hote)', 30000)
            invite.click('#boutonEnlignePret')
            dire(True, nom + ' : retour à la salle, les prêts repartent à faux, on se remet prêt')
    dire(not erreurs, nom + ' : console vide', erreurs[:3])
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        mode = sys.argv[1] if len(sys.argv) > 1 else ''
        if mode == 'ecrans': course_ecrans(b)
        elif mode != 'ia': course(b, 'deux joueurs, 0 IA', 0)
        if mode in ('', 'ia'): course(b, 'deux joueurs, 2 IA', 2)
        if mode == '': course_ecrans(b)   # (les écrans de salle avec rechargement : pas encore au vert, hors de 'court' qui sert aux annexes de GitHub)
    finally:
        b.close()
print('RESULTAT ' + ('OK' if ok_tout else 'ECHEC'))
sys.exit(0 if ok_tout else 1)
