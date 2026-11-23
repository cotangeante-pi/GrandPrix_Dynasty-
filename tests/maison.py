#!/usr/bin/env python3
"""(tour 61) Jouer en ligne à la maison : python3 tests/maison.py   (LENT : sous le verrou /tmp/gpd-tests.lock, avec nice -n 19, jamais en entier sur le Mac chargé)
Lance serveur/maison.py (un vrai processus, un port libre, cet ordinateur seulement), ouvre le jeu PAR LE SERVEUR (http, pas file://) dans deux pages, par le vrai relais en
WebSocket (aucun BroadcastChannel) : un ordinateur (960x600) et un téléphone émulé (640x360, au doigt).
Le chemin complet : titre → « En ligne » → créer une salle / rejoindre par code → salle (pings) → course → un joueur perd le Wi-Fi quelques secondes et revient dans la même
course → arrivée (podium, mêmes empreintes) → retour à la salle.
Les pas de physique sont donnés à la main (BOUCLE.simuler, une page puis l'autre : le dessin du Mac, en logiciel, est trop lent). Plafond dur : 14 minutes, le serveur et
Chrome sont toujours arrêtés (groupe de processus)."""
import json, os, re, signal, socket, subprocess, sys, threading, time, urllib.error, urllib.request
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _garde():
    print('✘ maison.py : plus de 14 min, arrêté', flush=True)
    try: os.killpg(os.getpgid(0), signal.SIGKILL)
    except Exception: os._exit(2)
_t = threading.Timer(840, _garde); _t.daemon = True; _t.start()
try: os.setpgrp()
except Exception: pass
if os.environ.get('MAISON_TRACE'):
    import faulthandler; faulthandler.dump_traceback_later(int(os.environ['MAISON_TRACE']), exit=True)   # (où est-elle bloquée ?)
ok_tout = True
def dire(ok, nom, detail=''):
    global ok_tout
    ok_tout = ok_tout and bool(ok)
    print(('✔ ' if ok else '✘ ') + nom + (' — ' + str(detail)[:700] if (detail and not ok) else ''), flush=True)

def attendre(pg, expr, ms=60000, pas=0.15):
    """Une boucle d'evaluate à nous (la page se recharge en route : une erreur n'arrête pas l'attente)."""
    t0 = time.monotonic(); derniere = None
    while time.monotonic() - t0 < ms / 1000:
        try:
            if pg.evaluate(expr): return True
        except Exception as e: derniere = e
        time.sleep(pas)
    raise TimeoutError('attendre : %s (%s)' % (expr[:100], derniere))

COMPTEURS = "() => { window.__ws = 0; window.__bc = 0; const W = window.WebSocket; window.WebSocket = function (...a) { window.__ws++; return new W(...a); }; window.WebSocket.prototype = W.prototype; ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach((k, i) => { window.WebSocket[k] = i; }); const B = window.BroadcastChannel; if (B) { window.BroadcastChannel = function (...a) { window.__bc++; return new B(...a); }; window.BroadcastChannel.prototype = B.prototype; } }"

def lancer_serveur():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    p = subprocess.Popen([sys.executable, os.path.join(RACINE, 'serveur', 'maison.py'), '--port', str(port), '--cet-ordinateur'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, start_new_session=True)
    for _ in range(100):
        try: socket.create_connection(('127.0.0.1', port), 0.3).close(); return p, port
        except OSError: time.sleep(0.3)
    raise RuntimeError('le serveur ne démarre pas')

def get(port, chemin):
    try:
        with urllib.request.urlopen('http://127.0.0.1:%d%s' % (port, chemin), timeout=20) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, b''

def tranche(pages, s=2):
    for pg in pages: pg.evaluate('(n) => { if (JEU.ecran === "course") BOUCLE.simuler(n); }', s)

def resume(pg): return pg.evaluate('() => ENLIGNE_PAGE.resume()')

def tout(b, port):
    erreurs = []
    base = 'http://127.0.0.1:%d' % port
    # --- le serveur : la page du jeu, la marque du relais, rien d'autre que le jeu
    st, corps = get(port, '/')
    dire(st == 200 and b'gpd-relais' in corps, 'maison : la page du jeu est servie avec la marque du relais')
    dire(get(port, '/serveur/relais.py')[0] == 404 and get(port, '/tests/test.html')[0] == 404 and get(port, '/CLAUDE.md')[0] == 404 and get(port, '/../CLAUDE.md')[0] == 404, 'maison : serveur/, tests/, CLAUDE.md ne sont pas servis')
    ctx_a = b.new_context(viewport={'width': 960, 'height': 600})
    ctx_b = b.new_context(viewport={'width': 640, 'height': 360}, has_touch=True, is_mobile=True, device_scale_factor=2,
                          user_agent='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36')
    pa, pb = ctx_a.new_page(), ctx_b.new_page()
    for i, pg in enumerate((pa, pb)):
        pg.set_default_timeout(60000)
        pg.add_init_script('(' + COMPTEURS + ')()')
        pg.add_init_script("addEventListener('DOMContentLoaded', () => { REGLAGES.EN_LIGNE_SILENCE_MS = 600000; REGLAGES.EN_LIGNE_ATTENTE_MAX_MS = 0; })")   # (le test donne les pas à la main : une page occupée ne répond pas aux pings, ce n'est pas une connexion morte)
        pg.on('pageerror', lambda e, i=i: erreurs.append('page %d : %s' % (i, e)))
        pg.on('console', lambda m, i=i: erreurs.append('console %d : %s' % (i, m.text)) if m.type == 'error' else None)
    # --- titre → « En ligne » → créer (ordinateur)
    pa.goto(base + '/?enligne=1&lang=fr', wait_until='domcontentloaded', timeout=120000)
    attendre(pa, '() => JEU.ecran === "titre" && !document.getElementById("boutonEnligneTitre").classList.contains("cache")', 120000)
    dire(True, 'titre : « 🌐 En ligne » est là avec ?enligne=1')
    pa.click('#boutonEnligneTitre')
    attendre(pa, '() => JEU.ecran === "enligne"', 120000)
    dire(pa.evaluate('() => !!document.querySelector("meta[name=gpd-relais]") && RESEAU.urlRelais().startsWith("ws://127.0.0.1:")'), 'le jeu trouve le relais tout seul : même adresse que la page (%s)' % pa.evaluate('() => RESEAU.urlRelais()'))
    pa.click('#boutonEnligneCreer')
    attendre(pa, '() => JEU.ecran === "enligneSalle"', 60000)
    code = pa.evaluate('() => document.getElementById("enligneSalleCode").textContent.trim()')
    dire(re.fullmatch(r'[BCDFGHJKLMNPQRSTVWXZ]{4}', code or ''), 'créer : un code de 4 lettres sans voyelle', code)
    pa.evaluate('() => BOUCLE.arreter()')   # (la salle n'a pas besoin du dessin : sur le Mac chargé, deux pages qui dessinent en logiciel s'étouffent)
    # --- le téléphone rejoint par le code, au doigt
    pb.goto(base + '/?enligne=1&lang=fr', wait_until='domcontentloaded', timeout=120000)
    attendre(pb, '() => JEU.ecran === "titre" && !document.getElementById("boutonEnligneTitre").classList.contains("cache")', 120000)
    pb.tap('#boutonEnligneTitre')
    attendre(pb, '() => JEU.ecran === "enligne"', 120000)
    pb.tap('#boutonEnligneRejoindre')
    attendre(pb, '() => JEU.ecran === "enligneRejoindre"', 20000)
    for lettre in code:
        pb.tap('#enligneClavier button:text-is("%s")' % lettre)
    dire(pb.evaluate('() => document.getElementById("enligneCode").value') == code, 'rejoindre : le code tapé au doigt', pb.evaluate('() => document.getElementById("enligneCode").value'))
    pb.tap('#boutonEnligneGo')
    attendre(pb, '() => JEU.ecran === "enligneSalle"', 60000)
    pb.evaluate('() => BOUCLE.arreter()')
    attendre(pa, '() => document.querySelectorAll("#enligneListe li").length === 2', 30000)
    attendre(pb, '() => document.querySelectorAll("#enligneListe li").length === 2', 30000)
    dire(True, 'salle : les deux joueurs se voient (ordinateur et téléphone)')
    dire(pa.evaluate('() => window.__ws') >= 1 and pb.evaluate('() => window.__ws') >= 1 and pa.evaluate('() => window.__bc') == 0 and pb.evaluate('() => window.__bc') == 0,
         'le vrai WebSocket est utilisé, aucun BroadcastChannel', [pa.evaluate('() => [window.__ws, window.__bc]'), pb.evaluate('() => [window.__ws, window.__bc]')])
    # les pings (le relais mesure toutes les 2 s)
    ok = attendre(pa, '() => document.querySelectorAll("#enligneListe .ping.bonne, #enligneListe .ping.moyenne, #enligneListe .ping.mauvaise").length === 2', 20000)
    dire(ok, 'salle : le ping de chaque joueur est affiché (point, nombre, mot au survol)', pa.evaluate('() => document.getElementById("enligneListe").textContent'))
    pb.screenshot(path=os.path.join(RACINE, 'tests', 'captures', 'maison-salle-tel.png'))
    # --- l'hôte choisit une course courte, l'invité se déclare prêt, l'hôte lance (le circuit change : chaque page qui n'a pas le bon se recharge)
    def reglage(pg, cle, valeur_voulue, essais=6):
        for _ in range(essais):
            if pg.evaluate('(c) => (document.querySelector("#enligneRegles .regle[data-cle=" + c + "] strong") || {}).textContent', cle) == valeur_voulue: return True
            pg.click('#enligneReg_%s_plus' % cle)
            time.sleep(0.3)
        return pg.evaluate('(c) => (document.querySelector("#enligneRegles .regle[data-cle=" + c + "] strong") || {}).textContent', cle) == valeur_voulue
    circuit_voulu = pa.evaluate('() => REGLAGES.EN_LIGNE_REGLAGES_DEFAUT.circuit')
    nom_circuit = pa.evaluate('(c) => texte("enligneCircuit_" + c) || c', circuit_voulu)
    dire(reglage(pa, 'tours', '1'), 'l\'hôte choisit 1 tour', pa.evaluate('() => document.getElementById("enligneRegles").textContent'))
    attendre(pb, '() => document.querySelector("#enligneRegles .regle[data-cle=tours] strong") && document.querySelector("#enligneRegles .regle[data-cle=tours] strong").textContent === "1"', 20000)
    dire(True, 'l\'invité voit le choix de l\'hôte (1 tour)')
    pb.tap('#boutonEnlignePret')
    attendre(pa, '() => [...document.querySelectorAll("#enligneListe li")].some(li => !li.classList.contains("moi") && li.textContent.includes("✔"))', 20000)
    dire(True, 'salle : « prêt » de l\'invité vu par l\'hôte')
    attendre(pa, '() => !document.getElementById("boutonEnligneLancer").disabled', 30000)
    pa.click('#boutonEnligneLancer')
    # (le circuit est celui de la page de chacun : sinon la page se recharge sur le bon circuit et se rattache avec son jeton)
    for pg in (pa, pb): pg.evaluate('() => BOUCLE.demarrer()')   # (le dessin repart le temps de construire la course : c'est lui qui la démarre)
    for pg in (pa, pb): attendre(pg, '() => ENLIGNE_PAGE.etat.partie', 180000)
    dire(True, 'la course part sur les deux pages (ordinateur et téléphone), départ tiré par le relais')
    for pg in (pa, pb):
        pg.evaluate('() => { REGLAGES.EN_LIGNE_ATTENTE_MAX_MS = 0; JEU.robot = true; BOUCLE.arreter(); }')   # (le robot d'essai conduit ; la machine lente n'abandonne pas)
    # --- la course : des tranches, une page puis l'autre
    for _ in range(4): tranche((pa, pb), 2)
    for nom_pg, pg in (('ordinateur', pa), ('téléphone', pb)):
        if resume(pg) is None: print('DIAG', nom_pg, pg.url[-120:], pg.evaluate('() => [JEU.ecran, ENLIGNE_PAGE.etat.statut, ENLIGNE_PAGE.etat.sortie, ENLIGNE_PAGE.etat.termine, !!ENLIGNE_PAGE.etat.depart]'), erreurs[:4], flush=True)
    n0 = [(resume(pg) or {'n': 0})['n'] for pg in (pa, pb)]
    dire(min(n0) > 600, 'la course avance chez les deux (pas %s)' % n0, n0)
    ok = attendre(pa, '() => Object.keys(ENLIGNE_PAGE.etat.qualite).length >= 1', 15000)
    dire(ok and pa.evaluate('() => !!document.getElementById("enligneQualite") && document.getElementById("enligneQualite").textContent.includes("ms")'), 'en course : l\'indicateur de connexion montre le ping', pa.evaluate('() => (document.getElementById("enligneQualite") || {}).textContent'))
    pb.screenshot(path=os.path.join(RACINE, 'tests', 'captures', 'maison-course-tel.png'))
    # --- le Wi-Fi du téléphone tombe : sa connexion se coupe ; l'ordinateur attend ; le téléphone revient dans la même course
    ws_avant = pb.evaluate('() => window.__ws')
    pb.evaluate('() => { window.__vuReprise = false; ENLIGNE_PAGE.etat.client.sur("reprise", () => { window.__vuReprise = true; }); ENLIGNE_PAGE.etat.client.transport.couper(); }')
    attendre(pa, '() => /perdu la connexion|lost the connection/.test(ENLIGNE_PAGE.etat.statut)', 15000)
    dire(True, 'l\'ordinateur est prévenu : « … a perdu la connexion : on l\'attend… » (%s)' % pa.evaluate('() => ENLIGNE_PAGE.etat.statut'))
    tranche((pa,), 4)
    ok = attendre(pb, '() => window.__vuReprise === true && ENLIGNE_PAGE.etat.reconnexion === false', 20000)
    dire(ok, 'le téléphone se rattache tout seul (nouvelle connexion WebSocket : %d -> %d) et reprend sa place' % (ws_avant, pb.evaluate('() => window.__ws')))
    dire(pb.evaluate('() => window.__ws') > ws_avant, 'une vraie nouvelle connexion a été ouverte')
    dire(pa.evaluate('() => ENLIGNE_PAGE.etat.partie.sortis.size') == 0 and pb.evaluate('() => ENLIGNE_PAGE.etat.partie.sortis.size') == 0, 'personne n\'est « parti » : la voiture du téléphone n\'est pas neutralisée')
    t0 = time.monotonic(); resumes = None
    while time.monotonic() - t0 < 600:
        resumes = [pg.evaluate('() => { if (JEU.ecran === "course") BOUCLE.simuler(12); return ENLIGNE_PAGE.resume(); }') for pg in (pa, pb)]
        if any(r is None for r in resumes) or any(r['desynchro'] for r in resumes): break
        if all(r['ecran'] in ('podium', 'resultats') for r in resumes): break
        time.sleep(0.02)
    dire(resumes and all(r and r['ecran'] in ('podium', 'resultats') for r in resumes), 'arrivée : les deux pages arrivent au podium (%.0f s)' % (time.monotonic() - t0), [r and r['ecran'] for r in (resumes or [])])
    dire(resumes and all(r and r['desynchro'] is None for r in resumes), 'aucune désynchro après la coupure')
    ar = [r['arrivees'] for r in resumes]
    dire(ar[0] == ar[1] and all(x is not None for x in ar[0][:2]), 'les mêmes arrivées chez les deux, la voiture du téléphone a fini', ar)
    fi = [pg.evaluate('() => JEU.final && JEU.final.map(x => [x.k, x.place, x.total])') for pg in (pa, pb)]
    dire(fi[0] and fi[0] == fi[1], 'le même classement final au bit près', fi)
    # --- retour à la salle (l'hôte)
    for pg in (pa, pb): pg.evaluate('() => { REGLAGES.EN_LIGNE_ATTENTE_MAX_MS = 0; }')
    for pg in (pa, pb):
        pg.evaluate('() => { if (JEU.ecran === "podium") { const b = document.getElementById("boutonResultats"); if (b) b.click(); } }')
    time.sleep(0.5)
    for pg in (pa, pb):
        try: attendre(pg, '() => JEU.ecran === "resultats"', 15000)
        except TimeoutError: pass
    pb.evaluate('() => { const b = document.getElementById("boutonChangerResultats") || document.getElementById("boutonRejouerResultats"); if (b) b.click(); }')
    pa.evaluate('() => { const b = document.getElementById("boutonChangerResultats") || document.getElementById("boutonRejouerResultats"); if (b) b.click(); }')
    for pg in (pa, pb):
        attendre(pg, '() => JEU.ecran === "enligneSalle" && document.querySelectorAll("#enligneListe li").length === 2', 60000)
    dire(True, 'retour à la salle : les deux joueurs y sont de nouveau, la salle est rouverte')
    dire(not erreurs, 'console sans erreur', erreurs[:4])
    ctx_a.close(); ctx_b.close()

if __name__ == '__main__':
    from playwright.sync_api import sync_playwright
    t0 = time.monotonic()
    serveur, port = lancer_serveur()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(channel='chrome', args=['--disable-audio-output', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            try: tout(b, port)
            finally: b.close()
    except Exception as e:
        import traceback; dire(False, 'le test s\'est arrêté sur une exception', traceback.format_exc()[-900:])
    finally:
        try: os.killpg(serveur.pid, signal.SIGKILL)
        except Exception: pass
    print('RESULTAT', 'ok' if ok_tout else 'ECHEC', '(%.0f s)' % (time.monotonic() - t0), flush=True)
    sys.exit(0 if ok_tout else 1)
