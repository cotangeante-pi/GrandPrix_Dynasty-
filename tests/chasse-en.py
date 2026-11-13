#!/usr/bin/env python3
"""(tour 55, T24) La chasse aux bugs en anglais, pour les nouveautés de la nuit : python3 tests/chasse-en.py [1280|960|640]
La vraie page en lang=en, au clavier en 1280×720 et en 960×600, au doigt (écran tactile émulé) en 640×360. Pour chaque nouveauté, son texte anglais
est posé dans son vrai élément (le bandeau #drapeau, le message de course #messageCourse, la bulle d'aide #bulleAide, les boutons du fantôme de la
pole, de la foule…) et mesuré dans la même image : rien hors de l'écran, rien de coupé ni de sur plusieurs lignes quand l'élément est fait pour une
ligne, rien qui en recouvre un autre (le pire cas : le bandeau, le plus long message et la bulle la plus longue ensemble), aucun mot français
(FRANCAIS de tests/ecrans.py), aucune clé qui manque. Se lance sous le verrou /tmp/gpd-tests.lock."""
import os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chasse import *
CAS = {'1280': (1280, 720, False), '960': (960, 600, False), '640': (640, 360, True)}
choix = [a for a in sys.argv[1:] if a in CAS] or list(CAS)
FRANCAIS = re.compile(r"(^|[^A-Za-zÀ-ÿ])(le|la|les|des|du|une|et|est|pour|avec|sans|saison|écurie|retour|victoire|victoires|vainqueur|classement|prochain|arbre|toi|ton|ta|tes|tu|cette|carrière|pilote|écuries|courses|titres|saisons|aucune?|suite|continuer)(?![A-Za-zÀ-ÿ])|[éèêàçù]")
# les recouvrements entre éléments posés (fixed / absolute) de l'écran de course
CHEV = '''() => { const els = [...document.body.children].flatMap(x => [x, ...x.querySelectorAll("*")]).filter(e => {
  if (!e.id || e.closest(".cache") || ["CANVAS", "SCRIPT"].includes(e.tagName)) return false; const cs = getComputedStyle(e);
  if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05) return false; if (!(cs.position === "fixed" || cs.position === "absolute")) return false;
  const r = e.getBoundingClientRect(); return r.width > 8 && r.height > 8 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight && (e.textContent.trim() || e.tagName === "BUTTON"); });
  const out = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b = els[j]; if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 6 && h > 6) out.push(a.id + " / " + b.id + " " + Math.round(w) + "x" + Math.round(h)); } return out; }'''
# poser un état dans les vrais éléments puis mesurer, dans la même image (la boucle du jeu les rééteint à l'image suivante)
POSER = '''(a) => { const [drap, msg, aide, genre] = a;
  const eau = document.getElementById("meteoHud"); eau.classList.remove("cache"); document.getElementById("meteoEau").textContent = "water 40 %%";   // (l'eau de la météo : elle recouvrait la tour de classement en 640×360, revue T26)
  if (drap) INTERFACE.majDrapeau(drap); if (msg) INTERFACE.majMessage(msg);
  if (aide) { const b = document.getElementById("bulleAide"); b.classList.remove("cache"); document.getElementById("bulleAideTexte").textContent = aide;
    b.classList.toggle("bulleCourse", genre === "course"); b.classList.toggle("bulleMenu", genre !== "course"); }
  const rect = id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return { id, left: r.left, right: r.right, top: r.top, bottom: r.bottom, h: r.height, w: r.width, sw: e.scrollWidth, cw: e.clientWidth, visible: !e.classList.contains("cache") }; };
  const res = { W: innerWidth, H: innerHeight, elements: ["drapeau", "messageCourse", "bulleAide"].map(rect), chev: (%s)(), insp: (%s)() };
  INTERFACE.majDrapeau(null); INTERFACE.majMessage(null); eau.classList.add("cache"); document.getElementById("bulleAide").classList.add("cache"); return res; }''' % (CHEV, INSPECTER)
TEXTES_JS = '''(INTERFACE_TACTILE) => { const g = k => TEXTES.en[k], bandeaux = ['jaune', 'bleu', 'vsc', 'vert'].map(t => [t, g('drapeau_' + t).replace('{v}', '151')]);
  const messages = [g('drapeau_infraction').replace('{s}', '5'), g('msg_degats').replace('{qui}', 'No. 27'), g('msg_repare').replace('{qui}', 'No. 27')]
    .concat(INTERFACE_TACTILE ? [] : ['com_drapeauJaune', 'com_vsc', 'com_drapeauVert', 'com_domicileRival'].flatMap(k => g(k).map(x => '🎙 ' + g('commentateur') + ': ' + x.replace('{qui}', 'Alexander Rossi-Moreau').replace('{lieu}', g('lieu_melbourn')))));
  const aides = ['fantomePole', 'degats', 'drapeauJaune', 'drapeauBleu', 'drapeauVsc', 'rivalDomicile'].map(i => [i, g('aide_' + i)]);
  return { bandeaux, messages, aides }; }'''
t0 = time.monotonic()
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for cle in choix:
            w, h, doigt = CAS[cle]; titre = f'anglais {w}×{h}' + (' au doigt' if doigt else '')
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=doigt, is_mobile=False); pg = ctx.new_page(); console = []
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.goto('file://' + RACINE + '/index.html?course=3&ia=9&circuit=test&lang=en', timeout=180000)
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "course" && JEU.course', timeout=120000); pg.wait_for_timeout(1500)
            pg.evaluate(PATCH_TEXTE)
            tx = pg.evaluate(TEXTES_JS, doigt)   # (au doigt, le bandeau texte du commentateur est caché : COMMENTAIRE_TEXTE_TACTILE)
            def mesurer(nom, args, une_ligne):
                r = pg.evaluate(POSER, args); defauts = []
                for attendu, valeur in zip(('drapeau', 'messageCourse', 'bulleAide'), args[:3]):   # (le test ne prouve rien si l'élément n'est pas montré)
                    if valeur and not [e for e in r['elements'] if e['id'] == attendu and e['visible'] and e['w'] > 10]: defauts.append(attendu + ' pas montré')
                for e in r['elements']:
                    if not e['visible']: continue
                    if e['left'] < -1 or e['right'] > r['W'] + 1 or e['top'] < -1 or e['bottom'] > r['H'] + 1: defauts.append(f"{e['id']} hors de l’écran ({e['left']:.0f}-{e['right']:.0f} sur {r['W']})")
                    if e['sw'] > e['cw'] + 2: defauts.append(f"{e['id']} coupé ({e['sw']} > {e['cw']})")
                    if une_ligne and e['id'] != 'bulleAide' and e['h'] > (80 if e['id'] == 'drapeau' else 60):   # (le bandeau du drapeau : deux lignes au plus)
                        defauts.append(f"{e['id']} sur plusieurs lignes ({e['h']:.0f} px)")
                    if e['id'] == 'bulleAide' and e['h'] > 110: defauts.append(f"bulleAide trop haute ({e['h']:.0f} px)")
                chev = [c for c in r['chev'] if not c.startswith('tactile') and ' tactile' not in c and 'compte' not in c]   # (le compte à rebours des feux : un drapeau ne vient jamais avant le départ)
                if chev: defauts.append('recouvrements : ' + ' ; '.join(chev[:4]))
                for genre, el, detail in r['insp']:
                    if genre in ('texte cassé', 'bouton hors de l’écran', 'texte qui déborde du bouton'): defauts.append(f'{genre} : {el} {detail}')
                return defauts
            # 1. chaque bandeau de drapeau, chaque message, chaque bulle, un par un (ils ne doivent pas déborder)
            pb = {}
            for tp, s in tx['bandeaux']:
                d = mesurer('bandeau', [{'type': tp, 'limite': 42}, None, None, None], True)
                if d: pb['bandeau ' + tp] = d
            for s in tx['messages']:
                d = mesurer('message', [None, s, None, None], True)
                if d: pb['message « ' + s[:40] + ' »'] = d
            for i, s in tx['aides']:
                d = mesurer('aide', [None, None, s, 'course' if i in ('degats', 'drapeauJaune', 'drapeauBleu', 'drapeauVsc') else 'menu'], False)
                if d: pb['bulle ' + i] = d
            t(f'{titre} : chaque bandeau, message du commentateur et bulle des nouveautés tient dans l’écran, sans être coupé ni sur plusieurs lignes', not pb, ' | '.join(f'{k} : {v}' for k, v in list(pb.items())[:6]))
            # 2. le pire cas ensemble : le bandeau de la VSC, le message le plus long, la bulle de course la plus longue
            plus_long = max(tx['messages'], key=len); bulle = max([a for a in tx['aides'] if a[0] in ('degats', 'drapeauJaune', 'drapeauBleu', 'drapeauVsc')], key=lambda a: len(a[1]))
            d = mesurer('ensemble', [{'type': 'vsc', 'limite': 42}, plus_long, bulle[1], 'course'], True)
            t(f'{titre} : le bandeau de la VSC, le message le plus long et la plus longue bulle de course ensemble ne se recouvrent pas et restent dans l’écran', not d, ' | '.join(d))
            # 3. aucun mot français dans les textes anglais des nouveautés, tels qu'ils sont posés à l'écran
            fr = [s for _, s in tx['bandeaux']] + tx['messages'] + [s for _, s in tx['aides']]
            mots = [s for s in fr if FRANCAIS.search(s.replace('🎙', ''))]
            t(f'{titre} : aucun mot français dans les textes anglais des nouveautés', not mots, ' | '.join(mots[:5]))
            # 4. la pause : tous les boutons de l'anglais tiennent (le choix du fantôme, le commentateur, la foule…)
            pg.evaluate('() => pause(true)'); pg.wait_for_timeout(600)
            ins = pg.evaluate(INSPECTER)
            mauvais = [x for x in ins if x[0] in ('bouton hors de l’écran', 'texte qui déborde du bouton', 'boutons qui se recouvrent', 'texte cassé')]
            t(f'{titre} : le menu pause en anglais : aucun bouton hors de l’écran, coupé ou recouvert', not mauvais, ' | '.join(f'{g} {e} {d}' for g, e, d in mauvais[:6]))
            pg.evaluate('() => pause(false)')
            # 5. l'écran de qualification : « Ghost: your record / pole » et le bouton du fantôme
            pg.evaluate('() => { INTERFACE.montrer("qualif"); INTERFACE.majBoutonFantomePole(texte("fantomeSrcPole")); }'); pg.wait_for_timeout(400)
            ins = pg.evaluate(INSPECTER)
            mauvais = [x for x in ins if x[0] in ('bouton hors de l’écran', 'texte qui déborde du bouton', 'boutons qui se recouvrent', 'texte cassé')]
            t(f'{titre} : l’écran de qualification avec le bouton « Ghost: pole position » : rien hors de l’écran, coupé ni recouvert', not mauvais, ' | '.join(f'{g} {e} {d}' for g, e, d in mauvais[:6]))
            # 6. (tour 55, T30) les nouveautés dans ⚙ Réglages du paddock : « Damage / Flags: on / off » et « Ghost: record / pole », au doigt ≥ 40 px, sauvegardés
            pg.goto('file://' + RACINE + '/index.html?championnat=1&gp=5&test=paddock&lang=en', timeout=180000)
            pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=120000); pg.wait_for_timeout(1500)
            pg.click('#menuReglages'); pg.wait_for_timeout(600)
            LIRE = '() => Object.fromEntries(["boutonDegatsPaddock", "boutonDrapeauxPaddock", "boutonFantomePolePaddock"].map(id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return [id, { t: e.textContent, w: r.width, h: r.height, vu: !e.classList.contains("cache") && r.width > 0, defile: e.scrollWidth > e.clientWidth + 2 }]; }))'
            bt = pg.evaluate(LIRE)
            t(f'{titre} : ⚙ Réglages : « Damage », « Flags » et « Ghost » sont là, lisibles, sans coupure' + (' et de 40 px au moins' if doigt else ''),
              all(x['vu'] and not x['defile'] and (not doigt or x['h'] >= 40) for x in bt.values()), str(bt))
            t(f'{titre} : ⚙ Réglages : les textes sont en anglais', bt['boutonDegatsPaddock']['t'] == 'Damage: on' and bt['boutonDrapeauxPaddock']['t'] == 'Flags: on' and bt['boutonFantomePolePaddock']['t'].startswith('Ghost'), str(bt))
            pg.click('#boutonDegatsPaddock'); pg.click('#boutonDrapeauxPaddock'); pg.click('#boutonFantomePolePaddock'); pg.wait_for_timeout(300)
            etat = pg.evaluate('() => [REGLAGES.DEGATS_ACTIF, REGLAGES.DRAPEAUX_ACTIFS, SAUVEGARDE.option("degats", true), SAUVEGARDE.option("drapeaux", true), SAUVEGARDE.option("fantome_pole", null), document.getElementById("boutonDegatsPaddock").textContent, document.getElementById("boutonFantomePolePaddock").textContent]')
            t(f'{titre} : ⚙ Réglages : un clic coupe les dégâts et les drapeaux (réglage et sauvegarde) et choisit « Ghost: pole position »', etat[:5] == [False, False, False, False, True] and etat[5] == 'Damage: off' and 'pole' in etat[6].lower(), str(etat))
            pg.reload(timeout=180000); pg.wait_for_function('() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', timeout=120000); pg.wait_for_timeout(1000)
            apres = pg.evaluate('() => [REGLAGES.DEGATS_ACTIF, REGLAGES.DRAPEAUX_ACTIFS, SAUVEGARDE.option("fantome_pole", null)]')
            t(f'{titre} : ⚙ Réglages : le choix survit à un rechargement', apres == [False, False, True], str(apres))
            pg.evaluate('() => { SAUVEGARDE.ecrireOption("degats", true); SAUVEGARDE.ecrireOption("drapeaux", true); SAUVEGARDE.ecrireOption("fantome_pole", false); }')   # (rien ne reste dans la sauvegarde du profil d'essai)
            t(f'{titre} : aucune erreur ni avertissement dans la console', not console, ' | '.join(console[:5]))
            m = pg.evaluate('() => window.__clesManquantes || []')
            t(f'{titre} : aucune clé de textes.js ne manque en anglais', not m, ', '.join(m[:20]))
            ctx.close()
    finally:
        b.close()
print(f'RESULTAT {RES["ok"]}/{RES["ok"] + RES["ko"]}'); print('\n'.join(L)); print(f'⏱ {time.monotonic() - t0:.0f} s')
sys.exit(0 if RES['ko'] == 0 else 1)
