#!/usr/bin/env python3
"""(tour 55, T3) Un téléphone lent : python3 tests/telephone-lent.py [rythme ...]   (par défaut 1 4 6 ; hors workflow GitHub)
La vraie page, en 844×390 (un téléphone couché, 2 pixels par pixel CSS, tactile), une course de 9 IA + le joueur sur Monoco avec la qualité
« auto » forcée (?qualite=auto : sous un automate, l'Auto ne bouge pas seule sinon), et le processeur ralenti par le protocole Chrome
(Emulation.setCPUThrottlingRate : 1 = normal, 4 = 4 fois plus lent, 6 = 6 fois). Chaque seconde : le niveau de l'Auto (QUALITE), les images par
seconde, le temps de calcul d'une image. Résultat : la seconde du premier pas de simplification, le niveau où l'Auto se pose, le nombre de
changements de niveau APRÈS qu'elle s'est posée (le va-et-vient : doit rester 0 ou presque), les images par seconde à la fin.
ATTENTION : le Mac de test dessine en logiciel (swiftshader), pas avec une carte graphique : le ralentissement ne touche que le processeur
principal (le calcul : physique, IA, scène), pas le dessin ; les chiffres valent EN RELATIF (rythme 1 / 4 / 6), pas comme des images par
seconde de vrai téléphone. Sous le verrou /tmp/gpd-tests.lock ; chaque passage est arrêté au bout de DUREE s (plafond dur 15 min)."""
import json, os, sys, time
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUREE = int(os.environ.get('TEL_DUREE', '70'))
NIVEAUX = '--niveaux' in sys.argv
rythmes = [float(a) for a in sys.argv[1:] if not a.startswith('--')] or [1, 4, 6]
ECHANTILLON = '''() => ({ n: JEU.qualite.niveau, max: JEU.qualite.niveaux.length - 1, regle: JEU.qualite.regle, auto: JEU.qualiteAuto, depuis: JEU.qualite.depuis,
  etat: JEU.course ? JEU.course.etat : (JEU.plateau ? JEU.plateau.etat : null), ips: window.__ips || 0, travail: window.__travail || 0, voitures: JEU.plateau ? JEU.plateau.pilotes.length : 0,
  v: JEU.plateau ? JEU.plateau.pilotes.filter(p => Math.abs(p.v.u) > 15).length : 0 })'''
SONDE = '''() => { window.__ips = 0; window.__travail = 0; let n = 0, d = performance.now(), tr = 0;
  const f = now => { n++; if (typeof BOUCLE !== 'undefined' && BOUCLE.debutImage !== null) tr += performance.now() - BOUCLE.debutImage; if (now - d >= 1000) { window.__ips = n * 1000 / (now - d); window.__travail = n ? tr / n : 0; n = 0; tr = 0; d = now; } requestAnimationFrame(f); };
  requestAnimationFrame(f); }'''
import signal; signal.alarm(900)   # plafond dur : 15 min
t0 = time.monotonic()
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for r in rythmes:
            ctx = b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2, is_mobile=True, has_touch=True)
            pg = ctx.new_page(); pg.set_default_timeout(30000); cdp = ctx.new_cdp_session(pg)
            erreurs = []; pg.on('pageerror', lambda e: erreurs.append(str(e)))
            pg.goto('file://' + RACINE + '/index.html?course=3&ia=9&joueur=1&circuit=monoco&qualite=auto&debug=1')
            ok = False
            for _ in range(120):
                time.sleep(1)
                try: ok = pg.evaluate('() => !!(JEU.plateau && JEU.plateau.pilotes.length >= 9 && JEU.qualite)')
                except Exception: ok = False
                if ok: break
            if not ok: print(f'rythme {r} : la course ne démarre pas', erreurs[:2]); ctx.close(); continue
            pg.evaluate(SONDE)
            if NIVEAUX:
                # le coût d'une image (le calcul sur le fil principal, BOUCLE.debutImage) à chaque niveau de l'Auto, forcé à la main (l'Auto coupée) :
                # sert de modèle aux téléphones simulés de tests/test.html (le ralentissement du processeur multiplie ce coût)
                pg.evaluate('() => { JEU.qualiteAuto = false; }'); cdp.send('Emulation.setCPUThrottlingRate', {'rate': r})
                maxn = pg.evaluate('() => JEU.qualite.niveaux.length - 1'); sortie = []
                for n in sorted(set([0, 3, 6, 9, 12, 15, maxn])):
                    pg.evaluate('n => { JEU.qualite.niveau = JEU.qualite.niveauAuto = n; JEU.appliquerQualite(); }', n)
                    time.sleep(3); mesures = []
                    for _ in range(int(os.environ.get('TEL_NIVEAU_S', '10'))):
                        time.sleep(1); mesures.append(pg.evaluate('() => [window.__travail, window.__ips]'))
                    mesures = sorted(m[0] for m in mesures if m[0] > 0)
                    sortie.append((n, mesures[len(mesures) // 2] if mesures else None))
                print(f'rythme {r:g}× : coût d\'une image par niveau (ms, médiane) : ' + ' '.join(f'{n}:{c:.1f}' if c is not None else f'{n}:?' for n, c in sortie))
                ctx.close(); continue
            cdp.send('Emulation.setCPUThrottlingRate', {'rate': r})
            serie = []; debut = time.monotonic()
            while time.monotonic() - debut < DUREE and time.monotonic() - t0 < 900:
                time.sleep(1)
                try: serie.append(pg.evaluate(ECHANTILLON))
                except Exception as e: erreurs.append(str(e)[:80]); break
            niv = [s['n'] for s in serie]
            changes = [i for i in range(1, len(niv)) if niv[i] != niv[i - 1]]
            premier = next((i for i, s in enumerate(serie) if s['n'] > 0), None)
            pose = changes[-1] if changes else None
            dernieres = serie[-10:]
            ips_fin = sum(s['ips'] for s in dernieres) / max(1, len(dernieres))
            tr_fin = sum(s['travail'] for s in dernieres) / max(1, len(dernieres))
            # le va-et-vient : les changements de niveau pendant la seconde moitié de la mesure, et les retours en arrière
            moitie = len(niv) // 2
            va = sum(1 for i in changes if i >= moitie)
            retours = sum(1 for i in changes if niv[i] < niv[i - 1])
            print(f'rythme {r:g}× : {len(serie)} s mesurées, auto={serie[0]["auto"]}, règle={serie[0]["regle"]}, voitures={serie[-1]["voitures"]}, '
                  f'premier pas à {premier} s, posée à {pose} s (niveau {niv[-1]}/{serie[-1]["max"]}), changements : {len(changes)} dont {va} dans la 2e moitié et {retours} retours en arrière, '
                  f'fin : {ips_fin:.1f} images/s, calcul {tr_fin:.1f} ms/image')
            print('   niveaux par seconde :', ''.join(chr(48 + n) if n < 10 else chr(55 + n) for n in niv))
            print('   images/s            :', ' '.join(f'{s["ips"]:.0f}' for s in serie[::5]))
            if erreurs: print('   erreurs :', erreurs[:3])
            cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
            ctx.close()
    finally:
        b.close()
