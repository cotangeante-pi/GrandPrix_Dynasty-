#!/usr/bin/env python3
"""Les outils communs de la chasse aux bugs (tests/saison.py, tests/recoins.py ; Codeur 4) : l'inspection d'un écran (textes cassés,
boutons vides, hors de l'écran, qui débordent ou se recouvrent, défilement), les clés de textes.js qui manquent dans la langue, la console,
les clics impossibles, et la carrière jouée par le robot écran par écran (Carriere.pas, Carriere.jouer). Rien ne se lance à l'import."""
import os, re, sys, time
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('RESULTAT 0/1 (Playwright absent : pip install playwright)'); sys.exit(1)
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURES = os.path.join(RACINE, 'tests', 'captures')
LECTURE_PIXELS = re.compile(r'\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels')
L, RES = [], {'ok': 0, 'ko': 0}
def t(nom, cond, detail=''):
    if cond: RES['ok'] += 1; L.append('✔ ' + nom)
    else: RES['ko'] += 1; L.append('✘ ' + nom + (' — ' + str(detail)[:1500] if detail else ''))

# les clés demandées à texte() qui manquent dans la langue de la page (texte() retombe sur l'anglais, ou rend undefined)
PATCH_TEXTE = '''() => { if (window.__texteSurveille) return; window.__texteSurveille = true; window.__clesManquantes = window.__clesManquantes || [];
  const ancien = texte; window.texte = function (cle) { if (TEXTES[LANGUE][cle] === undefined && !window.__clesManquantes.includes(cle)) window.__clesManquantes.push(cle); return ancien(cle); }; }'''
# ce qui ne va pas à l'écran : textes cassés, boutons ou titres vides, boutons qui débordent, défilement
INSPECTER = r'''() => { const P = [], W = innerWidth, H = innerHeight;
  const vu = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.cache') && !e.closest('#ips') && !e.closest('#reglages');
  const nom = e => e.id || (e.parentElement && e.parentElement.id ? e.parentElement.id + '>' + e.tagName.toLowerCase() : e.tagName.toLowerCase());
  for (const e of document.querySelectorAll('body *')) {
    if (!vu(e) || ['SCRIPT', 'STYLE', 'CANVAS', 'svg', 'OPTION', 'SELECT'].includes(e.tagName)) continue;
    const propre = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
    if (/undefined|NaN|\bnull\b|\[object|\{[a-zA-Z]+\}/.test(propre)) P.push(['texte cassé', nom(e), propre.trim().slice(0, 90)]);
  }
  // (un bouton sans texte mais nommé par aria-label, comme une pastille de couleur, n'est pas vide)
  for (const e of document.querySelectorAll('button, h1')) if (vu(e) && !e.textContent.trim() && !(e.getAttribute('aria-label') || '').trim()) P.push(['vide', nom(e), '']);
  for (const b of document.querySelectorAll('button')) {
    if (!vu(b)) continue; let r = b.getBoundingClientRect();
    // dans une liste qui défile (overflow auto) : c'est la liste qui doit tenir dans l'écran, pas chacun de ses boutons
    let a = b.parentElement; while (a && a !== document.body && !/(auto|scroll)/.test(getComputedStyle(a).overflowY)) a = a.parentElement;
    if (a && a !== document.body) r = a.getBoundingClientRect();
    if (r.width > 0 && (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1)) P.push(['bouton hors de l’écran', nom(b), b.textContent.trim().slice(0, 40) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round)]);
    else if (b.scrollWidth > b.clientWidth + 2) P.push(['texte qui déborde du bouton', nom(b), b.textContent.trim().slice(0, 40)]);
  }
  // deux boutons visibles qui se recouvrent (l'un cache l'autre au clic)
  // (un bouton caché sous un autre écran posé par-dessus, comme la liste des leçons sur le paddock, ne compte pas : en son milieu, on
  // touche un élément d'un autre bloc de la page (un autre enfant de body) ; deux boutons d'un même écran qui se chevauchent restent signalés)
  const racine = e => { while (e.parentElement && e.parentElement !== document.body) e = e.parentElement; return e; };
  const recouvert = (b, r) => { const x = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!x && !b.contains(x) && racine(x) !== racine(b); };
  const bs = [...document.querySelectorAll('button')].filter(b => vu(b)).map(b => [b, b.getBoundingClientRect()]).filter(([b, r]) => r.width > 0 && r.height > 0 && !recouvert(b, r));
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const [a, ra] = bs[i], [b, rb] = bs[j];
    if (a.contains(b) || b.contains(a)) continue;
    if (Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left) > 2 && Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) > 2) P.push(['boutons qui se recouvrent', nom(a) + ' / ' + nom(b), a.textContent.trim().slice(0, 25) + ' / ' + b.textContent.trim().slice(0, 25)]); }
  const d = document.documentElement; if (d.scrollHeight > H + 2 || d.scrollWidth > W + 2) P.push(['défilement', JEU.ecran, d.scrollWidth + '×' + d.scrollHeight]);
  return P; }'''

class Carriere:
    def __init__(self, pg, langue, adresse):
        self.pg, self.langue, self.adresse = pg, langue, adresse
        self.problemes = {}   # (genre, élément) → { écran, détail, page }
        self.console, self.ecrans, self.bloque, self.captures = [], set(), None, []
        pg.on('console', lambda m: self.console.append((self.ecran_courant(), m.type + ': ' + m.text)) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
        pg.on('pageerror', lambda e: self.console.append((self.ecran_courant(), 'PAGEERROR ' + str(e))))
        self.dernier = '?'
    def ecran_courant(self): return self.dernier
    def ev(self, js, arg=None):
        try: return self.pg.evaluate(js, arg)
        except Exception as e: return None
    def pret(self, delai=60000):
        try: self.pg.wait_for_function('() => typeof JEU !== "undefined" && typeof texte === "function" && !!JEU.ecran', timeout=delai)
        except Exception: return False
        self.ev(PATCH_TEXTE); return True
    def capture(self, quoi):
        n = len(self.captures)
        if n < 8: nom = f'{getattr(self, "prefixe", "saison")}-{self.langue}-{n + 1}-{quoi}.png'; self.pg.screenshot(path=os.path.join(CAPTURES, nom)); self.captures.append(nom)
    def inspecter(self, quoi):
        for genre, el, detail in self.ev(INSPECTER) or []:
            cle = (genre, el)
            if cle not in self.problemes and not any(k[0] == genre for k in self.problemes): self.capture(re.sub(r'\W+', '-', genre)[:20])
            if cle not in self.problemes: self.problemes[cle] = { 'ecran': quoi, 'detail': detail, 'page': self.pg.url.split('/')[-1] }
    def clic(self, sel, navigation=False):
        try: self.pg.wait_for_selector(sel, state='visible', timeout=3000)
        except Exception: pass
        try:
            if navigation:
                with self.pg.expect_navigation(timeout=60000): self.pg.click(sel, timeout=8000)
                self.pret()
            else: self.pg.click(sel, timeout=8000)
            return True
        except Exception as e:
            m = str(e); cause = re.search(r'[^\n]*(intercepts pointer events|outside of the viewport|not visible|not stable)[^\n]*', m)
            if ('clic impossible', sel) not in self.problemes: self.capture('clic')
            self.problemes.setdefault(('clic impossible', sel), { 'ecran': self.dernier, 'detail': (cause.group(0).strip() if cause else m.split('\n')[0])[:220], 'page': self.pg.url.split('/')[-1] }); return False
    def manquantes(self): return self.ev('() => window.__clesManquantes || []') or []

    # le paddock : le garage, le courrier, une discussion avec le coéquipier, puis la course suivante
    def paddock(self, faits):
        pg = self.pg
        if self.ev('() => !document.getElementById("annonceMotif").classList.contains("cache")'): self.clic('#annonceMotif')
        # la bulle d'aide du paddock : fermée d'un clic si elle est là (elle peut s'être fermée seule entre-temps : rien à noter)
        try: pg.wait_for_selector('#bulleAide', state='visible', timeout=1000); pg.click('#bulleAide', timeout=3000)
        except Exception: self.ev('() => AIDES_ECRAN.fermer()')
        gp = self.ev('() => JEU.championnat.saison + "-" + JEU.championnat.prochain')
        if gp not in faits:
            faits.add(gp)
            self.inspecter('paddock')
            if self.clic('#boutonGarage'):
                self.ev('() => 0'); self.inspecter('garage')
                if self.ev('() => !document.getElementById("bulleAide").classList.contains("cache")'): self.clic('#bulleAide')
                self.clic('#boutonGarageRetour')
            if self.ev('() => !!document.getElementById("boutonCourrier") && document.getElementById("boutonCourrier").getClientRects().length > 0') and self.clic('#boutonCourrier'):
                self.inspecter('courrier'); self.clic('#boutonCourrierRetour')
            if self.ev('() => !!document.getElementById("boutonParlerCoequipier") && document.getElementById("boutonParlerCoequipier").getClientRects().length > 0') and self.clic('#boutonParlerCoequipier'):
                n = self.ev('() => document.querySelectorAll("#discussionFil li").length') or 0
                try: pg.fill('#discussionTexte', 'salut, belle course' if self.langue == 'fr' else 'hi, nice race', timeout=5000)
                except Exception: pass
                self.clic('#boutonDiscussionEnvoyer')
                r = self.ev('() => [...document.querySelectorAll("#discussionFil li")].map(li => li.textContent)') or []
                moi = 'salut, belle course' if self.langue == 'fr' else 'hi, nice race'
                if len(r) < 2 or moi not in r[-2] or not r[-1].strip() or r[-1].strip() == moi: self.problemes.setdefault(('discussion sans réponse', gp), { 'ecran': 'discussion', 'detail': str(r[-3:]), 'page': pg.url.split('/')[-1] })
                self.inspecter('discussion'); self.clic('#boutonDiscussionRetour')
            self.ev('() => { if (JEU.ecran !== "championnat") montrerChampionnat(JEU.gagne); }')
        fini = self.ev('() => !!JEU.grandPrixFini')
        if not self.clic('#boutonCourseSuivante', navigation=bool(fini)):
            # (le bouton ne se clique pas : noté ; on continue la carrière par la fonction du bouton, pour chercher les autres bugs)
            if fini:
                try:
                    with pg.expect_navigation(timeout=60000): self.ev('() => courseSuivante()')
                except Exception: pass
                self.pret()
            else: self.ev('() => courseSuivante()')

    # un pas : ce que ferait un joueur sur l'écran du moment
    def pas(self, faits):
        pg = self.pg
        e = self.ev('() => [JEU.ecran, JEU.qualif && JEU.qualif.etat, !!(JEU.attente && !JEU.attente.passer), JEU.course && JEU.course.etat, !!(JEU.plateau && JEU.plateau.carte), JEU.championnat ? JEU.championnat.saison : null, JEU.championnat ? JEU.championnat.prochain : null]')
        if e is None: pg.wait_for_timeout(300); self.pret(); return 'rechargé'
        ecran = e[0]; self.dernier = ecran
        if ecran not in self.ecrans: self.ecrans.add(ecran); self.inspecter(ecran)
        if ecran == 'titre': self.clic('#boutonJouer')
        elif ecran == 'grille': self.ev('() => finirGrille()')
        elif ecran == 'qualif':
            if e[1] == 'choix': self.inspecter('qualif'); self.clic('#boutonQualifPasser')
            elif e[1] == 'resultat': self.clic('#boutonQualifCourse')
            else: pg.wait_for_timeout(500)
        elif ecran == 'course':
            if e[2]:
                # (la boucle arrêtée pendant le clic : sinon les dernières voitures peuvent arriver pendant que Playwright attend le bouton,
                # le podium vient et le bouton se cache sous ses yeux ; le bandeau, lui, est déjà affiché à l'image qui a créé l'attente)
                self.ev('() => BOUCLE.arreter()')
                self.inspecter('attente')
                if not self.clic('#boutonPasser'): self.ev('() => passerAuPodium()')
                self.ev('() => BOUCLE.demarrer()')
                pg.wait_for_timeout(300)
            elif not e[4] and self.ev('() => !!JEU.plateau'): pg.wait_for_timeout(500)   # la carte des IA se calcule
            else:
                if e[3] == 'compte': self.ev('() => { for (const p of (JEU.plateau ? JEU.plateau.pilotes : [])) if (p.course.compte > 0.05) p.course.compte = 0.05; }')
                self.ev('() => BOUCLE.simuler(5)'); pg.wait_for_timeout(60)
        elif ecran == 'podium': self.clic('#boutonResultats')
        elif ecran == 'resultats': self.inspecter('résultats'); self.clic('#boutonChangerResultats' if self.ev('() => !document.getElementById("boutonChangerResultats").classList.contains("cache")') else '#boutonRejouerResultats')
        elif ecran == 'bravo': self.inspecter('bravo'); self.clic('#boutonCarriere')
        elif ecran == 'pilote':
            self.inspecter('pilote')
            try: pg.fill('#piloteNom', 'Testeur', timeout=5000); pg.select_option('#pilotePays', 'jp', timeout=5000)
            except Exception: pass
            self.clic('#boutonPiloteValider', navigation=True)
        elif ecran == 'interview':
            self.inspecter('interview')
            if self.ev('() => !document.getElementById("interviewChoix").classList.contains("cache")'): self.clic('#interviewReponses button')
            else: self.clic('#boutonInterviewSuite')
        elif ecran == 'une': self.inspecter('une'); self.ev('() => passerUne()')
        elif ecran == 'championnat': self.paddock(faits)
        elif ecran == 'ceremonie': self.inspecter('cérémonie'); self.clic('#boutonCeremonieSuite')
        elif ecran == 'saison': self.inspecter('saison'); self.clic('#boutonSaisonSuite')
        elif ecran == 'duelSaison': self.inspecter('duel de la saison'); self.clic('#boutonDuelSaisonSuite')
        elif ecran == 'contrats': self.inspecter('contrats'); self.clic('#contratsListe button.signer')
        elif ecran == 'discussion': self.inspecter('discussion'); self.clic('#boutonDiscussionRetour')
        elif ecran == 'sponsors':
            self.inspecter('sponsors')
            if not (self.ev('() => document.querySelectorAll("#sponsorsListe button").length') and self.clic('#sponsorsListe button')): self.clic('#boutonSponsorsRetour')
            if self.ev('() => JEU.ecran === "sponsors"'): self.clic('#boutonSponsorsRetour')
        else: self.inspecter(ecran); pg.wait_for_timeout(300)
        return e

    # joue jusqu'à la condition fin(e) (e : l'état lu à chaque pas) ; un écran sans progrès pendant trop de pas = bloqué
    def jouer(self, fin, pas_max, quoi):
        faits, avant, meme = set(), None, 0
        for i in range(pas_max):
            e = self.pas(faits)
            if isinstance(e, list) and fin(e): return True
            sig = str(e) + str(self.ev('() => JEU.course && Math.round(JEU.course.temps)'))
            meme = meme + 1 if sig == avant else 0; avant = sig
            if meme >= 40:
                self.capture('bloque')
                self.bloque = { 'ecran': e[0] if isinstance(e, list) else e, 'etat': e, 'page': self.pg.url.split('/')[-1], 'quoi': quoi }
                return False
        self.bloque = { 'ecran': self.dernier, 'etat': 'pas_max', 'page': self.pg.url.split('/')[-1], 'quoi': quoi }
        return False

def rapport(c, titre):
    t(f'{titre} : aucune erreur ni avertissement dans la console', not c.console, ' | '.join(f'[{a}] {b}' for a, b in c.console[:8]))
    for genre in ('texte cassé', 'vide', 'bouton hors de l’écran', 'boutons qui se recouvrent', 'texte qui déborde du bouton', 'défilement', 'clic impossible', 'discussion sans réponse', '« passer » absent'):
        l = [(k[1], v) for k, v in c.problemes.items() if k[0] == genre]
        t(f'{titre} : {genre} : aucun', not l, ' | '.join(f"{el} sur « {v['ecran']} » ({v['detail']}) — {v['page']}" for el, v in l[:12]))
    m = c.manquantes()
    t(f'{titre} : aucune clé de textes.js ne manque en {"anglais" if c.langue == "en" else "français"} (clés demandées pendant la carrière)', not m, ', '.join(m[:30]))
    t(f'{titre} : jamais bloqué sur un écran', c.bloque is None, str(c.bloque))
    L.append(f"  ({titre} : écrans vus : {', '.join(sorted(c.ecrans))} ; captures : {', '.join(c.captures)})")

