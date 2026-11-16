#!/usr/bin/env python3
"""(tour 56, T9) Le vrai réseau : python3 tests/reseau-ws.py
Lance serveur/relais.py (un vrai processus, un port libre) et fait courir DEUX pages du jeu par WebSocket : chacune crée ou rejoint la salle avec
reseau.js, reçoit le départ (graine tirée par le relais), simule TOUTE la course avec enligne.js (lockstep : seules les commandes voyagent) et
compare. Vérifie : les deux pages finissent au même pas avec la même empreinte au bit près, sans désynchro ; le relais a vraiment relayé les
commandes et les empreintes ; un état abîmé d'un seul bit (page « perturber ») est vu comme désynchro par l'autre page ; un code inconnu est refusé.
Il faut playwright et websockets (pip install playwright websockets). Chaque attente a une limite, le relais et Chrome sont toujours arrêtés."""
import os, socket, subprocess, sys, time
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = 'file://' + os.path.join(RACINE, 'tests', 'reseau-ws.html')
L, RES = [], {'ok': 0, 'ko': 0}
def t(nom, cond, detail=''):
    RES['ok' if cond else 'ko'] += 1
    L.append(('✔ ' if cond else '✘ ') + nom + ('' if cond or detail == '' else ' — ' + str(detail)))

def attendre(page, js, delai=60):
    t0 = time.monotonic()
    while time.monotonic() - t0 < delai:
        if page.evaluate(js): return True
        time.sleep(0.2)
    return False

def course(b, url, options_b=None, pas=700):
    """Un hôte et un invité dans une salle neuve ; rend (S de l'hôte, S de l'invité)."""
    ph, pi = b.new_page(), b.new_page()
    for p in (ph, pi):
        p.set_default_timeout(30000)
        p.goto(PAGE)
    ph.evaluate('([u]) => jouer(u, "bleu", null, {pasMax: %d})' % pas, [url])
    t('l’hôte crée une salle : un code de 4 consonnes', attendre(ph, 'S.salle !== null', 15) and len(ph.evaluate('S.salle.code')) == 4 and not set(ph.evaluate('S.salle.code')) & set('AEIOUY'), ph.evaluate('S.salle'))
    code = ph.evaluate('S.salle.code')
    pi.evaluate('([u, c, o]) => jouer(u, "rouge", c, o)', [url, code, options_b or {'pasMax': pas}])
    t('l’invité rejoint par le code', attendre(pi, 'S.salle !== null', 15), pi.evaluate('S.refus'))
    t('l’hôte voit deux joueurs', attendre(ph, 'S.joueurs.length === 2', 10), ph.evaluate('S.joueurs'))
    pi.evaluate('r.pret(true)'); ph.evaluate('r.pret(true)')
    time.sleep(0.5)
    ph.evaluate('r.lancer({circuit: "test", tours: 1, meteo: "sec", nbIA: 2})')
    return ph, pi, code

def tout(url):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', args=['--allow-file-access-from-files', '--disable-audio-output'])
        try:
            # 1) une course de 700 pas, mêmes empreintes des deux côtés
            ph, pi, code = course(b, url, pas=700)
            for nom, pg in (('hôte', ph), ('invité', pi)):
                t('la course démarre chez l’' + nom + ' (départ reçu, partie créée)', attendre(pg, 'S.partie !== null', 20))
            fin_h = attendre(ph, 'S.fin !== null', 120); fin_i = attendre(pi, 'S.fin !== null', 120)
            t('les deux pages arrivent au bout des 700 pas', fin_h and fin_i, (ph.evaluate('S.partie && S.partie.n'), pi.evaluate('S.partie && S.partie.n')))
            if fin_h and fin_i:
                a, c = ph.evaluate('S.fin'), pi.evaluate('S.fin')
                t('même nombre de pas et MÊME empreinte au bit près, aucune désynchro', a['n'] == c['n'] == 700 and a['empreinte'] == c['empreinte'] and a['desynchro'] is None and c['desynchro'] is None, (a, c))
            t('le relais a relayé les commandes et les empreintes (chaque page en a reçu des deux sortes)', ph.evaluate('S.cmdsRecues') > 100 and pi.evaluate('S.cmdsRecues') > 100 and ph.evaluate('S.controlesRecus') >= 4 and pi.evaluate('S.controlesRecus') >= 4, (ph.evaluate('[S.cmdsRecues, S.controlesRecus]'), pi.evaluate('[S.cmdsRecues, S.controlesRecus]')))
            t('aucune erreur de réseau', not ph.evaluate('S.erreurs') and not pi.evaluate('S.erreurs'), (ph.evaluate('S.erreurs'), pi.evaluate('S.erreurs')))
            # 2) un code inconnu est refusé
            pr = b.new_page(); pr.goto(PAGE)
            pr.evaluate('([u]) => jouer(u, "jaune", "ZZZZ")', [url])
            t('un code inconnu est refusé (« inconnue »)', attendre(pr, 'S.refus !== null', 15) and pr.evaluate('S.refus') == 'inconnue', pr.evaluate('S.refus'))
            # 3) une désynchro d'un millimètre est vue
            ph, pi, code = course(b, url, options_b={'pasMax': 900, 'perturber': 300}, pas=900)
            attendre(ph, 'S.fin !== null', 120); attendre(pi, 'S.fin !== null', 120)
            dh, di = ph.evaluate('S.fin && S.fin.desynchro'), pi.evaluate('S.fin && S.fin.desynchro')
            t('un état abîmé d’un millimètre chez l’invité au pas 300 : une des deux pages voit la désynchro (empreintes comparées toutes les EN_LIGNE_CONTROLE pas)', bool(dh) or bool(di), (dh, di))
        finally:
            b.close()

if __name__ == '__main__':
    t0 = time.monotonic()
    try: import websockets, playwright  # noqa
    except ImportError: print('RESULTAT 0/1 (playwright ou websockets absent)'); sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    rel = subprocess.Popen([sys.executable, os.path.join(RACINE, 'serveur', 'relais.py'), '--port', str(port)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        for _ in range(50):
            try: socket.create_connection(('127.0.0.1', port), 0.2).close(); break
            except OSError: time.sleep(0.2)
        else: t('le relais démarre', False)
        tout('ws://127.0.0.1:%d' % port)
    except Exception as e:
        import traceback; t('le test s’est arrêté sur une exception', False, traceback.format_exc()[-700:])
    finally:
        rel.terminate()
        try: rel.wait(5)
        except subprocess.TimeoutExpired: rel.kill()
    print(f'RESULTAT {RES["ok"]}/{RES["ok"] + RES["ko"]}'); print('\n'.join(L)); print(f'⏱ {time.monotonic() - t0:.0f} s')
    sys.exit(0 if RES['ko'] == 0 else 1)
