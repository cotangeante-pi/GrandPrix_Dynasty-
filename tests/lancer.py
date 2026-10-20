#!/usr/bin/env python3
"""Lance tous les tests du jeu dans Chrome sans fenêtre : python3 tests/lancer.py
1. tests/test.html (le moteur, sans 3D) et tests/courses.html (30 courses entre IA) dans Chrome --headless ;
2. tests/ecrans.py (la vraie page dans Playwright : console vide, rendu, captures dans tests/captures/)."""
import os, re, html, signal, subprocess, sys, tempfile, shutil, threading, time
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if not os.path.exists(CHROME): CHROME = shutil.which('google-chrome') or shutil.which('chromium') or sys.exit('Chrome introuvable')

def chrome(args, delai=120):
    profil = tempfile.mkdtemp(prefix='f1-')
    # swiftshader : WebGL en logiciel, pour la scène 3D
    proc = subprocess.Popen([CHROME, '--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--user-data-dir=' + profil] + args,
                            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, start_new_session=True)   # un groupe à lui : on le tue en entier
    out = []
    def lire():
        for l in proc.stdout:
            out.append(l)
            if '</html>' in l: break
    th = threading.Thread(target=lire, daemon=True); th.start()
    # time.monotonic : ne compte pas la veille sur macOS (time.time, si) — un plafond ne doit pas expirer pendant que le Mac dort
    t0 = time.monotonic()
    while time.monotonic() - t0 < delai:
        if not th.is_alive() or proc.poll() is not None: break
        time.sleep(0.2)
    # Chrome et TOUS ses enfants (GPU, rendu) : sinon un processus GPU orphelin reste à 100 % et ralentit les passages suivants
    try: os.killpg(proc.pid, signal.SIGKILL)
    except ProcessLookupError: pass
    proc.wait(); shutil.rmtree(profil, ignore_errors=True)
    return ''.join(out)

def serie(page, delai=300):
    t0 = time.monotonic()
    dom = chrome(['--dump-dom', 'file://' + os.path.join(RACINE, page)], delai=delai)
    print(f'⏱ {page} : {time.monotonic() - t0:.0f} s')
    m = re.search(r'<pre id="res">(.*?)</pre>', dom, re.S)
    if not m: print(f'✘ {page} : aucun résultat'); return False
    texte = html.unescape(m.group(1)); print(texte)
    if texte.startswith('EN COURS'): print(f'✘ {page} : coupée avant la fin'); return False   # un résultat partiel n'est pas un succès
    r = re.search(r'RESULTAT (\d+)/(\d+)', texte)
    return bool(r and r.group(1) == r.group(2) and int(r.group(2)) > 0)

def ecrans(delai=600):
    # dans son propre groupe, avec une limite : s'il est interrompu ou trop long, Playwright et ses Chrome partent avec lui
    t0 = time.monotonic()
    p = subprocess.Popen([sys.executable, os.path.join(RACINE, 'tests', 'ecrans.py')], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
    try: out, err = p.communicate(timeout=delai)
    except subprocess.TimeoutExpired:
        os.killpg(p.pid, signal.SIGKILL); out, err = p.communicate(); out += f'\n✘ ecrans.py : plus de {delai} s, arrêté'
    # planté sans écrire son RESULTAT : la fin de stderr (la trace Python), sinon on ne voit rien
    if 'RESULTAT' not in out: out += '\n✘ ecrans.py s’est arrêté sans résultat :\n' + (err or '').strip()[-2000:]
    print(out.strip()); print(f'⏱ tests/ecrans.py : {time.monotonic() - t0:.0f} s')
    return p.returncode == 0

def tests():
    # une liste : tout tourne même si le premier échoue ; courses.html = le critère de l'étape 4 (30 courses entre IA)
    return all([serie('tests/test.html'), serie('tests/courses.html'), ecrans()])

if __name__ == '__main__':
    # le Mac ne s'endort pas tant que la suite tourne (caffeinate s'arrête de lui-même avec ce processus)
    if sys.platform == 'darwin' and shutil.which('caffeinate'):
        subprocess.Popen(['caffeinate', '-i', '-w', str(os.getpid())], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(1))
    ok = tests()
    print('TOUT PASSE' if ok else 'ÉCHECS')
    sys.exit(0 if ok else 1)
