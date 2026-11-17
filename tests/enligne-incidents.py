#!/usr/bin/env python3
"""(tour 56, T8) Les incidents d'une course en ligne : python3 tests/enligne-incidents.py
Deux pages de la vraie page de jeu reliées par un BroadcastChannel (comme tests/enligne-course.py), sur le circuit d'essai :
- un joueur qui part (quitter) : l'autre voit « Pilote Rouge a quitté la course », la partie le marque sorti, la course continue seule jusqu'au podium ;
- onglet caché : la boucle (requestAnimationFrame) est coupée, un minuteur de fond fait quand même avancer la course ; revenu, il s'arrête ;
- Échap pendant la course : pas de pause, le premier appui prévient, le second (en 3 s) quitte ;
- la pub Poki : refusée pendant la course en ligne (le rappel part tout de suite, rien demandé au SDK), permise au podium ;
- un joueur qui ne répond plus : « Connexion lente : on attend Pilote Rouge… » puis, après EN_LIGNE_ATTENTE_MAX_MS, « Connexion trop lente » et la sortie ;
- une désynchro (un bit changé chez l'un) : message clair puis la sortie ;
- la connexion perdue en course (événement « perdu ») : message puis retour au début.
Plafond dur : 10 minutes."""
import os, signal, sys, threading, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _garde():
    print('✘ enligne-incidents.py : plus de 10 min, arrêté', flush=True)
    try: os.killpg(os.getpgid(0), signal.SIGKILL)
    except Exception: os._exit(2)
_t = threading.Timer(900, _garde); _t.daemon = True; _t.start()
ok_tout = True
FILTRE = os.environ.get('INCIDENTS_FILTRE', '')   # (un seul incident : INCIDENTS_FILTRE=cache)
try: os.setpgrp()
except Exception: pass
def dire(ok, nom, detail=''):
    global ok_tout
    ok_tout = ok_tout and bool(ok)
    print(('✔ ' if ok else '✘ ') + nom + (' — ' + str(detail)[:600] if (detail and not ok) else ''), flush=True)

def attendre(pg, expr, ms=120000):
    """Attend qu'une expression soit vraie : une boucle d'evaluate à nous (le wait_for_function par défaut, sur requestAnimationFrame, ne tourne pas dans un onglet qui n'est pas au premier plan)."""
    t0 = time.monotonic(); derniere = None
    while time.monotonic() - t0 < ms / 1000:
        try:
            if pg.evaluate(expr): return True
        except Exception as e: derniere = e
        time.sleep(0.1)
    raise TimeoutError('attendre : %s (%s)' % (expr[:90], derniere))

FAUX_POKI = "() => { window.__pub = 0; window.PokiSDK = new Proxy({}, { get: (t, k) => k === 'commercialBreak' ? () => { window.__pub++; return Promise.resolve(); } : () => Promise.resolve() }); }"
def deux_pages(b, nom, tours=1, noms=('bleu', 'rouge'), patient=True, arreter=True):   # (D1 : le nom est l'id d'une couleur : noms=('bleu', 'rouge'), patient=True)
    ctx = b.new_context(viewport={'width': 960, 'height': 600})
    erreurs = []; pages = []
    canal = 'incident-%d-%d' % (os.getpid(), time.time())
    for i in range(2):
        pg = ctx.new_page(); pg.set_default_timeout(120000)
        pg.on('pageerror', lambda e, i=i: erreurs.append('page %d : %s' % (i, e)))
        pg.on('console', lambda m, i=i: erreurs.append('console %d : %s' % (i, m.text)) if m.type in ('error',) else None)
        pages.append(pg)
    base = 'file://' + RACINE + '/index.html?circuit=test&robot=1&tours=%d&ia=0&canal=%s&joueurs=2' % (tours, canal)
    pages[0].goto(base + '&enlignecourse=hote&nom=' + noms[0])
    attendre(pages[0], '() => window.__enligne && window.__enligne.code', 120000)
    code = pages[0].evaluate('() => window.__enligne.code')
    pages[1].goto(base + '&enlignecourse=%s&nom=' % code + noms[1])
    for pg in pages: attendre(pg, '() => window.__enligne && window.__enligne.partie', 120000)
    # les pages sont pilotées à la main par tranches (le dessin du Mac, en logiciel, est trop lent) : la boucle du navigateur est arrêtée
    for pg in pages: pg.evaluate('([p, a]) => { if (p) REGLAGES.EN_LIGNE_ATTENTE_MAX_MS = 0; if (a) BOUCLE.arreter(); }', [patient, arreter])   # (patient : la machine lente n'abandonne pas la course avant la mesure)
    return ctx, pages, erreurs

def avancer(pages, pas=2, tours=1):
    for pg in pages: pg.evaluate('(n) => { if (JEU.ecran === "course") BOUCLE.simuler(n); }', pas)
def statut(pg): return pg.evaluate('() => ENLIGNE_PAGE.etat.statut')

def incident_parti(b):
    nom = 'un joueur part'
    ctx, (p1, p2), erreurs = deux_pages(b, nom, tours=3)
    for _ in range(5): avancer([p1, p2], 2)   # (BOUCLE.simuler compte des SECONDES de jeu ; une tranche de 2 s, une page puis l'autre)
    p2.evaluate('() => { ENLIGNE_PAGE.etat.partie.vider(); __enligne.client.quitter(); }')
    attendre(p1, '() => ENLIGNE_PAGE.etat.partie.sortis.size === 1', 120000)
    dire(('a quitté' in statut(p1) or 'left' in statut(p1)) and ('Rouge' in statut(p1) or 'Red' in statut(p1)), nom + ' : l’autre voit « Pilote Rouge a quitté la course »', statut(p1))
    n0 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n')
    for _ in range(10): p1.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(6); }')
    n1 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n')
    dire(n1 - n0 >= 6000, nom + ' : la course continue seule (60 s de jeu sans attendre le parti : %d pas)' % (n1 - n0), [n0, n1])
    dire(not p1.evaluate('() => ENLIGNE_PAGE.etat.partie.desynchro') and p1.evaluate('() => ENLIGNE_PAGE.etat.partie.attente') is None, nom + ' : aucune désynchro, plus d’attente', None)
    dire(not erreurs, nom + ' : console vide', erreurs[:3])
    ctx.close()

def incident_cache(b):
    nom = 'onglet caché'
    ctx, (p1, p2), erreurs = deux_pages(b, nom, tours=12, noms=('bleu', 'rouge'), patient=True)
    for _ in range(5): avancer([p1, p2], 2)
    n0 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n')
    p1.evaluate('() => { REGLAGES.EN_LIGNE_FOND_MS = 50; ENLIGNE_PAGE.cacher(true); }')   # (la page de l'hôte est cachée : seul le minuteur de fond la fait avancer)
    t0 = time.monotonic()
    while time.monotonic() - t0 < 6:   # l'autre page avance en même temps, par tranches
        try: p2.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(0.5); }'); time.sleep(0.02)
        except Exception as e: print('DEBUG p2 parti', time.monotonic() - t0, p1.evaluate('() => [ENLIGNE_PAGE.etat.statut, ENLIGNE_PAGE.etat.sortie, ENLIGNE_PAGE.etat.partie.n, !!ENLIGNE_PAGE.etat.fond && Object.keys(ENLIGNE_PAGE.etat.fond)]')); raise
    n1 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n')
    dire(n1 - n0 > 120, nom + ' : le minuteur de fond fait avancer la course sans requestAnimationFrame (%d pas)' % (n1 - n0), [n0, n1])
    p1.evaluate('() => ENLIGNE_PAGE.cacher(false)')
    n2 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n'); time.sleep(1.0)
    n3 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n')
    dire(n3 == n2 and p1.evaluate('() => ENLIGNE_PAGE.etat.fond') is None, nom + ' : revenu, le minuteur de fond s’arrête', [n2, n3])
    dire(not p1.evaluate('() => ENLIGNE_PAGE.etat.partie.desynchro') and not p2.evaluate('() => ENLIGNE_PAGE.etat.partie.desynchro'), nom + ' : aucune désynchro', None)
    dire(not erreurs, nom + ' : console vide', erreurs[:3])
    ctx.close()

def incident_echap_pub(b):
    nom = 'Échap et pub'
    ctx, (p1, p2), erreurs = deux_pages(b, nom)
    for _ in range(3): avancer([p1, p2], 2)
    p1.evaluate('() => pause(true)')
    ec = p1.evaluate('() => JEU.ecran'); s = statut(p1)
    dire(ec == 'course' and ('Échap' in s or 'Esc' in s), nom + ' : Échap en course : pas de pause, un message prévient', [ec, s])
    p1.evaluate(FAUX_POKI)   # (posé après le chargement : sdk.js relit window.PokiSDK à chaque appel)
    pub = p1.evaluate('() => new Promise(r => SDK.pubEntreCourses(() => r(window.__pub), () => {}))')
    dire(pub == 0, nom + ' : la pub est refusée pendant la course en ligne (le rappel part, rien demandé à Poki)', pub)
    p1.evaluate('() => pause(true)')   # le second appui, dans les 3 s : quitter (la page se recharge au début)
    attendre(p1, '() => !location.search.includes("enlignecourse")', 120000)
    dire('enlignecourse' not in p1.url, nom + ' : le second appui quitte la course (retour au début)', p1.url)
    attendre(p2, '() => ENLIGNE_PAGE.etat.partie.sortis.size === 1', 15000)
    dire(True, nom + ' : l’autre joueur voit « parti »')
    ctx.close()

def incident_pub_podium(b):
    nom = 'pub au podium'
    ctx, (p1, p2), erreurs = deux_pages(b, nom, arreter=False)   # (la boucle du navigateur tourne : c'est elle qui montre le podium)
    t0 = time.monotonic()
    while time.monotonic() - t0 < 240:   # (comme tests/enligne-course.py : de grosses tranches, une page puis l'autre)
        avancer([p1, p2], 24)
        if all(pg.evaluate('() => JEU.ecran') in ('podium', 'resultats') for pg in (p1, p2)): break
        time.sleep(0.02)
    diag = [pg.evaluate('() => { const e = ENLIGNE_PAGE.etat; return [JEU.ecran, e.partie && e.partie.n, e.partie && e.partie.attente, e.sortie, e.statut]; }') for pg in (p1, p2)]
    p1.evaluate(FAUX_POKI)   # (posé après le chargement : sdk.js relit window.PokiSDK à chaque appel)
    p1.evaluate(FAUX_POKI)
    pub = p1.evaluate('() => new Promise(r => SDK.pubEntreCourses(() => r(window.__pub), () => {}))')
    dire(pub == 1, nom + ' : hors course (podium), la pub reste permise (Poki la demande une fois)', 'pub=%r diag=%s' % (pub, diag))
    ctx.close()

def incident_lent(b):
    nom = 'connexion lente'
    ctx, (p1, p2), erreurs = deux_pages(b, nom, tours=3, patient=False)   # (c'est ce délai que ce test vérifie)
    p1.evaluate('() => { REGLAGES.EN_LIGNE_ATTENTE_ANNONCE_MS = 500; REGLAGES.EN_LIGNE_ATTENTE_MAX_MS = 3500; REGLAGES.EN_LIGNE_RETOUR_MS = 600000; }')
    t0 = time.monotonic(); vu_annonce = False; sortie = None
    while time.monotonic() - t0 < 12:   # p2 ne répond plus : on ne le fait pas avancer ; p1 essaie d'avancer
        p1.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(2); ENLIGNE_PAGE.surveillerAttente(); }')
        s = statut(p1)
        if ('lente' in s or 'Slow' in s) and ('Rouge' in s or 'Red' in s): vu_annonce = True
        sortie = p1.evaluate('() => ENLIGNE_PAGE.etat.sortie')
        if sortie: break
        time.sleep(0.1)
    dire(vu_annonce, nom + ' : après un moment, « Connexion lente : on attend Pilote Rouge… »', statut(p1))
    dire(sortie == 'lent' and ('trop lente' in statut(p1) or 'too slow' in statut(p1)), nom + ' : après EN_LIGNE_ATTENTE_MAX_MS, « Connexion trop lente » et la sortie', [sortie, statut(p1)])
    ctx.close()

def incident_desynchro(b):
    nom = 'désynchro'
    ctx, (p1, p2), erreurs = deux_pages(b, nom, tours=3)
    for _ in range(5): avancer([p1, p2], 2)
    p2.evaluate('() => { REGLAGES.EN_LIGNE_RETOUR_MS = 600000; const q = ENLIGNE_PAGE.etat.partie.e.pilotes[0]; q.v.x += 1e-9; }')
    p1.evaluate('() => { REGLAGES.EN_LIGNE_RETOUR_MS = 600000; }')
    for _ in range(200):
        avancer([p1, p2], 2)
        if any(pg.evaluate('() => !!ENLIGNE_PAGE.etat.partie.desynchro') for pg in (p1, p2)): break
    for pg in (p1, p2): pg.evaluate('() => ENLIGNE_PAGE.image()')
    vus = [pg.evaluate('() => [ENLIGNE_PAGE.etat.sortie, ENLIGNE_PAGE.etat.statut]') for pg in (p1, p2)]
    dire(any(v[0] == 'desynchro' for v in vus), nom + ' : un bit changé chez l’un : désynchro signalée, la sortie est lancée', vus)
    dire(all(('plus les mêmes' in v[1] or 'no longer match' in v[1]) for v in vus if v[0] == 'desynchro'), nom + ' : le message est clair (les courses ne sont plus les mêmes : retour à la salle)', vus)
    ctx.close()

def incident_perdu(b):
    nom = 'connexion perdue'
    ctx, (p1, p2), erreurs = deux_pages(b, nom)
    for _ in range(3): avancer([p1, p2], 2)
    p1.evaluate('() => { REGLAGES.EN_LIGNE_RETOUR_MS = 600000; ENLIGNE_PAGE.surPerdu(); }')
    s = statut(p1)
    dire(('perdue' in s or 'lost' in s) and p1.evaluate('() => ENLIGNE_PAGE.etat.sortie') == 'perdu', nom + ' : « Connexion perdue » est affiché et la sortie est lancée', s)
    ctx.close()

def incident_cache_worker(b):
    """(T57) Le tic du minuteur de fond vient d'un Worker (non ralenti dans un onglet caché ; un onglet vraiment caché ne se fabrique pas
    avec Playwright, donc on vérifie le chemin) et, si le Worker est absent ou refusé, setInterval prend le relais et la course avance."""
    nom = 'onglet caché (Worker)'
    ctx, (p1, p2), erreurs = deux_pages(b, nom, tours=12, noms=('bleu', 'rouge'), patient=True)
    for _ in range(3): avancer([p1, p2], 2)
    def mesure(worker, casse=False):
        p1.evaluate('([w, c]) => { REGLAGES.EN_LIGNE_FOND_WORKER = w; REGLAGES.EN_LIGNE_FOND_MS = 50; if (c) window.__W = Worker, window.Worker = function () { throw new Error("refuse"); }; ENLIGNE_PAGE.cacher(true); }', [worker, casse])
        n0 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n'); t0 = time.monotonic()
        while time.monotonic() - t0 < 4:
            p2.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(0.5); }'); time.sleep(0.02)
        n1 = p1.evaluate('() => ENLIGNE_PAGE.etat.partie.n')
        genre = p1.evaluate('() => ENLIGNE_PAGE.etat.fond && (ENLIGNE_PAGE.etat.fond.w ? "worker" : "intervalle")')
        p1.evaluate('() => { ENLIGNE_PAGE.cacher(false); if (window.__W) window.Worker = window.__W; }')
        return n1 - n0, genre
    n, g = mesure(True)
    dire(g == 'worker' and n > 100, nom + ' : le tic vient d’un Worker et la course avance (%d pas)' % n, [n, g])
    n, g = mesure(False)
    dire(g == 'intervalle' and n > 100, nom + ' : réglage à false : setInterval seul, la course avance (%d pas)' % n, [n, g])
    n, g = mesure(True, True)
    dire(g == 'intervalle' and n > 100, nom + ' : Worker refusé par le navigateur : repli sur setInterval, la course avance (%d pas)' % n, [n, g])
    dire(not erreurs, nom + ' : console vide', erreurs[:3])
    ctx.close()

def incident_erreur_relais(b):
    nom = 'erreur du relais'
    ctx, (p1, p2), erreurs = deux_pages(b, nom, patient=True)
    p1.evaluate("() => ENLIGNE_PAGE.etat.statut = ''")
    for raison, fr, en in (('hote', 'hôte', 'host'), ('seul', 'autre pilote', 'one more'), ('charge', 'charge', 'loading')):
        p1.evaluate('(r) => { REGLAGES.EN_LIGNE_FOND_MS = 0; ENLIGNE_PAGE.erreurRelais(r); }', raison)
        s = statut(p1)
        dire(fr in s or en in s, nom + ' : « %s » est affiché (fr ou en)' % raison, s)
    p1.evaluate("() => ENLIGNE_PAGE.erreurRelais('ecouteur')")
    dire(not erreurs, nom + ' : console vide', erreurs[:3])
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for f in (incident_parti, incident_cache, incident_echap_pub, incident_pub_podium, incident_lent, incident_desynchro, incident_perdu, incident_cache_worker, incident_erreur_relais):
            if FILTRE and FILTRE not in f.__name__: continue
            try: f(b)
            except Exception as e:
                import traceback; traceback.print_exc(); dire(False, f.__name__ + ' : exception', repr(e))
    finally:
        b.close()
print('RESULTAT ' + ('OK' if ok_tout else 'ECHEC'))
sys.exit(0 if ok_tout else 1)
