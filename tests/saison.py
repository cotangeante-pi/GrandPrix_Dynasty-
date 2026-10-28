#!/usr/bin/env python3
"""La chasse aux bugs sur une carrière entière (tour 35d, Codeur 4) : python3 tests/saison.py
La vraie page, en 960×600, jouée de bout en bout par le robot d'essai, en accéléré :
- en français : le premier lancement (titre → découverte → « Bravo ! » → création du pilote), puis les 12 Grands Prix de la saison 1 (au
  paddock : le garage, le courrier, une discussion avec le coéquipier ; qualification passée, course d'un tour, podium, résultats, interview,
  une du journal), la fin de saison (cérémonie, classement, duel, contrats, sponsors) et le paddock de la saison 2 ;
- en anglais : le premier lancement et le premier Grand Prix, puis une fin de saison (Grand Prix 12 fabriqué par ?gp=12).
À chaque écran : la console (ni erreur ni avertissement), aucun texte « undefined », « NaN », « null », « [object » ou {repère} laissé, aucun
bouton ni titre vide, aucun bouton qui déborde de l'écran ou de lui-même, pas de défilement, les clés de textes.js qui manquent dans la
langue ; et aucun écran où l'on reste bloqué. Chaque problème est noté une fois (écran + élément), avec la page qui le reproduit."""
import os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chasse import *

t0 = time.monotonic()
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        # les clés de textes.js : chaque clé française existe en anglais (et inversement)
        ctx = b.new_context(viewport={'width': 960, 'height': 600}); pg = ctx.new_page()
        pg.goto('file://' + RACINE + '/tests/textes.html')
        diff = pg.evaluate('() => ({ manqueEn: Object.keys(TEXTES.fr).filter(k => TEXTES.en[k] === undefined), manqueFr: Object.keys(TEXTES.en).filter(k => TEXTES.fr[k] === undefined) })')
        t('textes.js : toute clé française existe en anglais', not diff['manqueEn'], ', '.join(diff['manqueEn'][:40]))
        t('textes.js : toute clé anglaise existe en français', not diff['manqueFr'], ', '.join(diff['manqueFr'][:40]))
        ctx.close()

        # 1. en français : la carrière entière
        for langue in ('fr', 'en'):
            ctx = b.new_context(viewport={'width': 960, 'height': 600}); pg = ctx.new_page()
            c = Carriere(pg, langue, f'index.html?robot=1&tours=1&lang={langue}')
            pg.goto('file://' + RACINE + '/' + c.adresse); c.pret()
            titre = f'carrière {langue} 960×600'
            # le premier lancement jusqu'au paddock de la carrière
            arrive = c.jouer(lambda e: e[0] == 'championnat', 400, 'premier lancement')
            t(f'{titre} : le premier lancement mène au paddock (titre → découverte → Bravo → création du pilote)', arrive, str(c.bloque))
            if langue == 'fr':
                # les 12 Grands Prix, la fin de saison, la saison 2
                for gp in range(1, 13):
                    fin = (lambda e: e[0] == 'championnat' and e[5] == 2) if gp == 12 else (lambda e, gp=gp: e[0] == 'championnat' and e[5] == 1 and e[6] == gp)
                    fait = c.jouer(fin, 900, f'Grand Prix {gp}' + (' et la fin de saison' if gp == 12 else '')) if c.bloque is None else False
                    t(f'{titre} : Grand Prix {gp} joué jusqu’au paddock suivant', fait, str(c.bloque))
                    if not fait: break
                    L.append(f'  (Grand Prix {gp} : {time.monotonic() - t0:.0f} s depuis le début)')
                if c.bloque is None:
                    t(f'{titre} : la fin de saison (cérémonie, classement, duel, contrats, sponsors) mène au paddock de la saison 2', c.ev('() => JEU.ecran === "championnat" && JEU.championnat.saison === 2 && JEU.championnat.prochain === 0'), str(c.ev('() => [JEU.ecran, JEU.championnat.saison, JEU.championnat.prochain]')))
                    pg.screenshot(path=os.path.join(CAPTURES, 'saison-2.png'))
            else:
                g1 = c.jouer(lambda e: e[0] == 'championnat' and e[6] == 1, 900, 'Grand Prix 1') if c.bloque is None else False
                t(f'{titre} : le Grand Prix 1 joué jusqu’au paddock suivant', g1, str(c.bloque))
            rapport(c, titre)
            ctx.close()
        # 2. en anglais : une fin de saison (le Grand Prix 12 fabriqué), jusqu'à la saison 2
        ctx = b.new_context(viewport={'width': 960, 'height': 600}); pg = ctx.new_page()
        c = Carriere(pg, 'en', 'index.html?championnat=1&tours=1&robot=1&gp=12&lang=en')
        pg.goto('file://' + RACINE + '/' + c.adresse); c.pret()
        s2 = c.jouer(lambda e: e[0] == 'championnat' and e[5] == 2, 900, 'fin de saison')
        t('fin de saison en 960×600 : le Grand Prix 12, la cérémonie, le classement, le duel, les contrats, les sponsors, la saison 2', s2, str(c.bloque))
        rapport(c, 'fin de saison en 960×600')
        ctx.close()
    finally:
        b.close()
print(f'RESULTAT {RES["ok"]}/{RES["ok"] + RES["ko"]}'); print('\n'.join(L))
print(f'  (la carrière en {time.monotonic() - t0:.0f} s)')
sys.exit(0 if RES['ko'] == 0 else 1)
