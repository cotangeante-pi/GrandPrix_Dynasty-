#!/usr/bin/env python3
"""La chasse aux bugs dans les recoins que tests/saison.py ne visite pas (tour 38d, Codeur 4) : python3 tests/recoins.py [deux tournoi fin ecrans tuto]
La vraie page, en 960×600, en français puis en anglais, jouée par le robot d'essai :
- deux : le mode 2 joueurs depuis l'écran titre (Entre amis → réglages), les deux claviers en même temps, une course complète à deux
  robots, la revanche, le score de la rivalité, « Menu » ;
- tournoi : le tournoi chrono à 3 joueurs, ⚡ Éclair puis 🏆 Tournoi (3 manches), les égalités (au temps et aux points), le classement final ;
- fin : la fin de carrière : la retraite anticipée (contrats), le bilan, le temple, l'arbre, la relève (l'héritière), puis sa retraite par
  l'âge (SAISONS_MAX), et une nouvelle dynastie ;
- ecrans : le calendrier, l'album des unes (feuilleté), la fiche d'un rival, l'arbre, « Mon casque », les sponsors, et le menu pause d'une
  course avec tous ses réglages (fantôme, commentateur, revoir les aides, tutoriel) ;
- tuto : le tutoriel guidé complet, les 7 leçons à la suite (« Leçon suivante ») ;
- tailles-carriere, tailles-jeux (tour 39d) : en 1280×720 et en 1920×1080, un passage court : le premier lancement, un Grand Prix, le
  paddock et ses écrans, le menu pause ; une course à deux, un tournoi Éclair.
Relevé comme saison.py (tests/chasse.py) : la console, les textes cassés, les clés de textes.js qui manquent dans la langue, les boutons
vides, hors de l'écran, qui débordent ou se recouvrent, le défilement, les clics impossibles, les écrans où l'on reste bloqué.
Les parties : RECOINS=deux,tournoi (variable d'environnement) ou en arguments ; sans rien, toutes."""
import os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chasse import *

class Recoin(Carriere):
    def __init__(self, pg, langue, adresse):
        super().__init__(pg, langue, adresse)
        self.cles, self.blocages = set(), []
    # les clés manquantes sont gardées avant chaque action (une navigation remet la page à zéro)
    def recolter(self):
        for k in self.ev('() => window.__clesManquantes || []') or []: self.cles.add(k)
    def manquantes(self): self.recolter(); return sorted(self.cles)
    def aller(self, adresse):
        self.recolter(); self.pg.goto('file://' + RACINE + '/' + adresse); self.pret()
    def attendre(self, js, delai=30000):
        try: self.pg.wait_for_function(js, timeout=delai); return True
        except Exception: return False
    # un écran attendu : sinon, l'endroit est noté comme bloqué (avec la page qui le reproduit)
    def ecran(self, nom, quoi, delai=30000):
        if not self.pret(delai): self.blocages.append({ 'quoi': quoi, 'attendu': nom, 'ecran': None, 'page': self.pg.url.split('/')[-1] }); return False
        if self.attendre(f'() => JEU.ecran === "{nom}"', delai): self.dernier = nom; self.ecrans.add(nom); self.inspecter(quoi); return True
        self.capture('bloque'); self.blocages.append({ 'quoi': quoi, 'attendu': nom, 'ecran': self.ev('() => JEU.ecran'), 'page': self.pg.url.split('/')[-1] }); return False
    # un clic qui peut recharger la page (on attend ensuite que le jeu soit prêt)
    def cliquer(self, sel, navigation=False):
        self.recolter(); r = self.clic(sel, navigation=navigation)
        self.pg.wait_for_timeout(250)
        if not navigation: self.pret()
        return r
    # un bouton facultatif : cliqué seulement s'il est visible et permis (un bouton grisé n'est pas un bug)
    def si(self, sel):
        if self.ev(f'() => {{ const b = document.querySelector("{sel}"); return !!b && b.getClientRects().length > 0 && !b.disabled && !b.closest(".cache"); }}'): return self.cliquer(sel)
        return False
    # le robot conduit la course du moment jusqu'au podium (les feux abrégés, « passer » l'attente)
    def rouler(self, quoi, pas_max=200):
        self.attendre('() => JEU.plateau && JEU.plateau.carte !== null', 240000)
        self.ev('() => { JEU.robot = true; }')
        for _ in range(pas_max):
            e = self.ev('() => [JEU.ecran, !!(JEU.attente && !JEU.attente.passer), JEU.course && JEU.course.etat]')
            if e is None: self.pg.wait_for_timeout(300); continue
            if e[0] == 'podium': return True
            if e[1]:
                # l'attente des autres : « passer » doit être là. La boucle est arrêtée le temps de le vérifier et de cliquer : sinon les
                # dernières voitures arrivent pendant que Playwright attend, le podium vient et cache le bouton (le test était instable
                # sur GitHub, tour 39d). Le bandeau est déjà affiché à l'image qui a créé l'attente.
                self.ev('() => BOUCLE.arreter()')
                vu = self.ev('() => { const b = document.getElementById("boutonPasser"); return b.getClientRects().length > 0 && !b.closest(".cache"); }')
                if not vu: self.problemes.setdefault(('« passer » absent', quoi), { 'ecran': 'course', 'detail': str(self.ev('() => [!!JEU.attente, JEU.ecran, document.getElementById("attenteArrivee").className]')), 'page': self.pg.url.split('/')[-1] })
                if not (vu and self.clic('#boutonPasser')): self.ev('() => passerAuPodium()')
                self.ev('() => BOUCLE.demarrer()')
                self.pg.wait_for_timeout(300); continue
            if e[2] == 'compte': self.ev('() => { for (const p of (JEU.plateau ? JEU.plateau.pilotes : [])) if (p.course && p.course.compte > 0.05) p.course.compte = 0.05; }')
            self.ev('() => BOUCLE.simuler(5)'); self.pg.wait_for_timeout(40)
        self.capture('bloque'); self.blocages.append({ 'quoi': quoi, 'attendu': 'podium', 'ecran': self.ev('() => JEU.ecran'), 'page': self.pg.url.split('/')[-1] }); return False

def bilan(c, titre):
    rapport(c, titre)
    t(f'{titre} : aucun endroit où l’on reste bloqué', not c.blocages, str(c.blocages[:6]))

# --- le mode 2 joueurs ---
def deux(c, titre, court=False):
    pg = c.pg
    c.aller(f'index.html?lang={c.langue}')
    if not c.ecran('titre', 'titre'): return
    c.cliquer('#boutonAmis'); c.ecran('amis', 'Entre amis')
    c.cliquer('#boutonAmisDeux')
    if not c.ecran('deuxReglages', 'réglages à deux'): return
    try:
        pg.fill('#deuxNom1', 'Léo'); pg.fill('#deuxNom2', 'Sarah')
        pg.select_option('#deuxIA', '3'); pg.select_option('#deuxTours', '3'); pg.select_option('#deuxCircuit', 'test')
    except Exception as e: c.problemes.setdefault(('réglages à deux', 'formulaire'), { 'ecran': 'deuxReglages', 'detail': str(e)[:200], 'page': pg.url.split('/')[-1] })
    c.inspecter('réglages à deux (remplis)')
    c.cliquer('#boutonDeuxPartir', navigation=True)
    if not c.ecran('course', 'course à deux', 60000): return
    c.attendre('() => JEU.plateau && JEU.plateau.carte !== null', 240000)
    # les deux claviers en même temps : W (joueur 1) et ↑ (joueur 2) tenus ensemble, après l'extinction des feux
    c.ev('() => { BOUCLE.arreter(); for (const p of JEU.plateau.pilotes) if (p.course && p.course.compte > 0.05) p.course.compte = 0.05; let n = 0; while (JEU.course.etat === "compte" && n++ < 2400) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE); BOUCLE.demarrer(); }')
    # (les touches tenues pendant 1 s de jeu, la boucle arrêtée : pas 1,5 s réelles, qui ne font que 0,9 m/s quand la machine est lente)
    pg.keyboard.down('KeyW'); pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(100)
    v = c.ev('() => { BOUCLE.arreter(); const u0 = DEUX_JOUEURS.joueurs(JEU.plateau).map(p => p.v.u); BOUCLE.simuler(1); const u1 = DEUX_JOUEURS.joueurs(JEU.plateau).map(p => p.v.u); return [u0, u1]; }')
    pg.keyboard.up('KeyW'); pg.keyboard.up('ArrowUp'); c.ev('() => BOUCLE.demarrer()')
    t(f'{titre} : les deux claviers en même temps (W et ↑ tenus ensemble, 1 s de jeu) : les deux voitures accélèrent', bool(v) and all(v[1][k] > v[0][k] + 2 for k in range(2)), str(v))
    c.inspecter('course à deux')
    for manche in ((1,) if court else (1, 2)):
        if not c.rouler(f'course à deux {manche}'): return
        c.ecran('podium', f'podium à deux {manche}')
        c.cliquer('#boutonResultats')
        if not c.ecran('resultats', f'résultats à deux {manche}'): return
        riv = c.ev('() => [document.getElementById("resultatsRivalite").textContent, SAUVEGARDE.deux().rivalite]')
        t(f'{titre} : course {manche} : le score de la rivalité affiché (Léo – Sarah), {manche} course(s) comptée(s)', bool(riv) and 'Léo' in riv[0] and 'Sarah' in riv[0] and sum(riv[1]['score']) == manche, str(riv))
        if manche == 1 and not court:
            c.cliquer('#boutonRejouerResultats')   # « Revanche »
            if not c.ecran('course', 'revanche', 30000): return
    c.cliquer('#boutonChangerResultats', navigation=True)   # « Menu »
    c.ecran('amis', 'retour au menu Entre amis', 60000)

# --- le tournoi chrono ---
TOURNOI_EGALITE = '''(eclair) => { const t = JEU.tournoi;
  if (eclair) t.passages = [[{ j: 0, abandon: false, tour: 61, penalites: 0 }, { j: 1, abandon: false, tour: 60, penalites: 0 }, { j: 2, abandon: false, tour: 60, penalites: 0 }]];
  else t.passages = [[{ j: 0, abandon: false, tour: 60, penalites: 0 }, { j: 1, abandon: false, tour: 61, penalites: 0 }, { j: 2, abandon: false, tour: 62, penalites: 0 }],
    [{ j: 0, abandon: false, tour: 61.5, penalites: 0 }, { j: 1, abandon: false, tour: 59.5, penalites: 0 }, { j: 2, abandon: false, tour: 60.5, penalites: 0 }],
    [{ j: 0, abandon: false, tour: 60.2, penalites: 0 }, { j: 1, abandon: false, tour: 61.2, penalites: 0 }, { j: 2, abandon: false, tour: 59, penalites: 0 }]];
  JEU.ecran = "podium"; montrerFinTournoi();
  return [...document.querySelectorAll("#tournoiFinListe li")].map(li => li.textContent); }'''
def tournoi(c, titre, court=False):
    pg = c.pg
    c.aller(f'index.html?lang={c.langue}')
    if not c.ecran('titre', 'titre'): return
    c.cliquer('#boutonAmis'); c.cliquer('#boutonAmisTournoi')
    if not c.ecran('tournoiInscription', 'inscription du tournoi'): return
    for formule in (('eclair',) if court else ('eclair', 'tournoi')):
        try:
            while (c.ev('() => document.querySelectorAll("#tournoiListe li").length') or 0) < 3: pg.click('#boutonTournoiAjouter', timeout=3000)
            for i, nom in enumerate(['Léo', 'Sarah', 'Tom']): pg.fill(f'#tournoiListe li:nth-child({i + 1}) .tournoiPrenom', nom, timeout=3000)
        except Exception as e: c.problemes.setdefault(('inscription', formule), { 'ecran': 'tournoiInscription', 'detail': str(e)[:200], 'page': pg.url.split('/')[-1] })
        c.cliquer('#boutonFormuleEclair' if formule == 'eclair' else '#boutonFormuleTournoi')
        c.inspecter(f'inscription ({formule})')
        c.cliquer('#boutonTournoiPartir', navigation=True)
        manches = 1 if formule == 'eclair' else 3
        for m in range(manches):
            for k in range(3):
                if not c.ecran('tournoiAToi', f'{formule} : à toi (manche {m + 1}, joueur {k + 1})', 60000): return
                c.ev('() => { JEU.robot = true; }')
                if not c.attendre('() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "tour"', 20000):
                    c.blocages.append({ 'quoi': f'{formule} : le tour ne part pas', 'attendu': 'qualif', 'ecran': c.ev('() => JEU.ecran'), 'page': pg.url.split('/')[-1] }); return
                c.inspecter(f'{formule} : le tour')
                for _ in range(300):
                    if c.ev('() => JEU.ecran') == 'tournoiManche': break
                    c.ev('() => BOUCLE.simuler(2)'); pg.wait_for_timeout(30)
                if not c.ecran('tournoiManche', f'{formule} : classement de la manche {m + 1}', 20000): return
                fin_manche = k == 2
                if not fin_manche: c.cliquer('#boutonTournoiSuite')
            if m < manches - 1: c.cliquer('#boutonTournoiSuite', navigation=True)
        c.cliquer('#boutonTournoiSuite')
        if not c.ecran('podium', f'{formule} : podium'): return
        c.cliquer('#boutonResultats')
        if not c.ecran('tournoiFin', f'{formule} : classement final'): return
        lignes = c.ev('() => [...document.querySelectorAll("#tournoiFinListe li")].map(li => li.textContent)') or []
        t(f'{titre} : {formule} : le classement final a les 3 joueurs', len(lignes) == 3 and all(any(n in l for l in lignes) for n in ('Léo', 'Sarah', 'Tom')), str(lignes))
        # les égalités : Éclair, deux temps égaux → le premier à l'avoir fait devant ; Tournoi, 58 points chacun → le meilleur temps d'une manche
        eg = c.ev(TOURNOI_EGALITE, formule == 'eclair') or []
        attendu = ['Sarah', 'Tom', 'Léo'] if formule == 'eclair' else ['Tom', 'Sarah', 'Léo']
        t(f'{titre} : {formule} : l’égalité est départagée ({" > ".join(attendu)})', len(eg) == 3 and all(attendu[i] in eg[i] for i in range(3)), str(eg))
        c.inspecter(f'{formule} : classement final avec égalité')
        if formule == 'eclair' and not court:
            c.cliquer('#boutonTournoiNouveaux', navigation=True)
            if not c.ecran('tournoiInscription', 'nouveaux joueurs', 60000): return

# --- la fin de carrière ---
def fin(c, titre):
    pg = c.pg
    c.aller(f'index.html?championnat=1&tours=1&robot=1&gp=12&lang={c.langue}')
    if not c.ecran('championnat', 'paddock du Grand Prix 12', 60000): return
    c.ev('() => { if (window.AIDES_ECRAN) AIDES_ECRAN.fermer(); SAISONS.avancer(JEU.championnat, 1); montrerFinSaison(); }')
    def jusqua_retraite(quoi, anticipee):
        for _ in range(12):
            e = c.ev('() => JEU.ecran'); c.dernier = e or '?'
            if e: c.ecrans.add(e)
            if e == 'retraite': c.ecran('retraite', f'{quoi} : bilan de carrière'); return True
            if e == 'ceremonie': c.inspecter(f'{quoi} : cérémonie'); c.cliquer('#boutonCeremonieSuite')
            elif e == 'saison': c.inspecter(f'{quoi} : classement final'); c.cliquer('#boutonSaisonSuite')
            elif e == 'duelSaison': c.inspecter(f'{quoi} : duel de la saison'); c.cliquer('#boutonDuelSaisonSuite')
            elif e == 'contrats':
                c.inspecter(f'{quoi} : contrats')
                # l'aide des contrats, la première fois, dans la page : sa bulle, sur aucun bouton, aucune offre, ni le titre
                if anticipee:
                    c.attendre('() => !document.getElementById("bulleAide").classList.contains("cache")', 5000)
                    b = c.ev('''() => { const b = document.getElementById("bulleAide"); if (b.classList.contains("cache")) return null; const r = b.getBoundingClientRect();
                      const sur = [...document.querySelectorAll("#contrats button, #contratsListe li, #contrats h1, #contratsNote")].filter(e => e.getClientRects().length).filter(e => { const q = e.getBoundingClientRect(); return Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 1; }).map(e => e.id || e.tagName);
                      return { aide: b.dataset.aide, texte: document.getElementById("bulleAideTexte").textContent, attendu: texte("aide_contrats"), sur }; }''')
                    t(f'{titre} : aux contrats, l’aide des contrats s’affiche (la première fois), sur aucun bouton, aucune offre ni le titre', bool(b) and b['aide'] == 'contrats' and b['texte'] == b['attendu'] and not b['sur'], str(b))
                    c.si('#bulleAide')
                if not anticipee: break
                c.cliquer('#boutonRetraite'); c.inspecter(f'{quoi} : confirmation de la retraite'); c.cliquer('#boutonRetraite')
            elif e == 'sponsors': c.inspecter(f'{quoi} : sponsors'); c.cliquer('#boutonSponsorsRetour')
            else: pg.wait_for_timeout(300)
            if c.bloque: break
        c.capture('bloque'); c.blocages.append({ 'quoi': quoi, 'attendu': 'retraite', 'ecran': c.ev('() => JEU.ecran'), 'page': pg.url.split('/')[-1] }); return False
    if not jusqua_retraite('retraite anticipée', True): return
    r = c.ev('() => JEU.championnat.retraite && JEU.championnat.retraite.raison')
    t(f'{titre} : la retraite anticipée : « Carrière terminée » (raison : choix)', r == 'choix', str(r))
    c.cliquer('#boutonTemple'); c.ecran('temple', 'temple de la renommée'); c.cliquer('#boutonTempleRetour'); c.ecran('retraite', 'retour au bilan')
    c.cliquer('#boutonArbreBilan'); c.ecran('arbre', 'arbre (depuis le bilan)'); c.cliquer('#boutonArbreRetour'); c.ecran('retraite', 'retour au bilan')
    c.cliquer('#boutonContinuerDynastie')
    if not c.ecran('heritier', 'héritier'): return
    c.cliquer('#boutonHeritierValider'); c.inspecter('héritier sans prénom (le message)')
    try: pg.fill('#heritierPrenom', 'Léa', timeout=3000); pg.select_option('#heritierLien', 'fille', timeout=3000)
    except Exception as e: c.problemes.setdefault(('héritier', 'formulaire'), { 'ecran': 'heritier', 'detail': str(e)[:200], 'page': pg.url.split('/')[-1] })
    c.cliquer('#boutonHeritierValider')
    if not c.ecran('championnat', 'paddock de l’héritière'): return
    c.cliquer('#boutonArbre'); c.ecran('arbre', 'arbre de la dynastie (2 générations)'); c.cliquer('#boutonArbreRetour')
    # la retraite par l'âge : l'héritière arrive à sa 15e saison (SAISONS_MAX), la saison se joue d'avance
    c.ev('() => { const ch = JEU.championnat; ch.saison = (ch.carriere && typeof ch.carriere.debut === "number" ? ch.carriere.debut : 1) + REGLAGES.SAISONS_MAX - 1; SAISONS.avancer(ch, REGLAGES.NB_GRANDS_PRIX); SAUVEGARDE.ecrireChampionnat(ch); montrerFinSaison(); }')
    if not jusqua_retraite('retraite par l’âge', False): return
    r = c.ev('() => [JEU.championnat.retraite && JEU.championnat.retraite.raison, document.getElementById("retraiteRaison").textContent]')
    t(f'{titre} : la retraite par l’âge ({r and r[1]})', bool(r) and r[0] == 'age' and r[1].strip() != '', str(r))
    c.cliquer('#boutonTemple'); c.ecran('temple', 'temple (2 carrières)'); c.cliquer('#boutonTempleRetour')
    c.cliquer('#boutonNouvelleDynastie'); c.inspecter('nouvelle dynastie : la confirmation')   # (deux clics : le premier demande de confirmer)
    c.cliquer('#boutonNouvelleDynastie', navigation=True)
    c.ecran('championnat', 'nouvelle dynastie : le paddock d’un monde neuf', 60000)
    n = c.ev('() => [SAUVEGARDE.temple().carrieres.length, JEU.championnat.saison, !!JEU.championnat.retraite]')
    t(f'{titre} : la nouvelle dynastie : un monde neuf (saison 1, pas en retraite), les 2 carrières au temple', n == [2, 1, False], str(n))

# --- les écrans pas visités ---
def ecrans(c, titre):
    pg = c.pg
    c.aller(f'index.html?championnat=1&tours=1&robot=1&gp=4&lang={c.langue}')
    if not c.ecran('championnat', 'paddock du Grand Prix 4', 60000): return
    c.ev('() => { if (window.AIDES_ECRAN) AIDES_ECRAN.fermer(); }')
    c.cliquer('#boutonCalendrier'); c.ecran('calendrier', 'calendrier'); c.cliquer('#boutonCalendrierRetour'); c.ecran('championnat', 'retour du calendrier')
    c.cliquer('#boutonAlbum')
    if c.ecran('album', 'album des unes'):
        for b in ('#boutonAlbumAvant', '#boutonAlbumAvant', '#boutonAlbumApres', '#boutonAlbumSaisonAvant', '#boutonAlbumSaisonApres'):
            if c.si(b): c.inspecter('album feuilleté')
        c.cliquer('#boutonAlbumFermer'); c.ecran('championnat', 'retour de l’album')
    c.ev('() => montrerFiche(3)')
    if c.ecran('fiche', 'fiche d’un rival'):
        c.cliquer('#boutonFicheDiscuter'); c.ecran('discussion', 'discussion depuis la fiche'); c.cliquer('#boutonDiscussionRetour')
        c.ev('() => { if (JEU.ecran === "fiche") quitterFiche(); }'); c.ecran('championnat', 'retour de la fiche')
    c.cliquer('#boutonArbre'); c.ecran('arbre', 'arbre (1 génération)'); c.cliquer('#boutonArbreRetour'); c.ecran('championnat', 'retour de l’arbre')
    c.cliquer('#boutonMonCasque')
    if c.ecran('pilote', 'Mon casque'):
        c.cliquer('#boutonPiloteValider'); c.ecran('championnat', 'retour de Mon casque')
    c.cliquer('#boutonSponsors')
    if c.ecran('sponsors', 'sponsors (en saison)'): c.cliquer('#boutonSponsorsRetour'); c.ecran('championnat', 'retour des sponsors')
    c.cliquer('#boutonCourrier')
    if c.ecran('courrier', 'courrier'): c.cliquer('#boutonCourrierRetour'); c.ecran('championnat', 'retour du courrier')
    # le menu pause d'une course, avec tous ses réglages
    c.aller(f'index.html?course=1&ia=3&joueur=1&robot=1&circuit=test&lang={c.langue}')
    if c.ecran('qualif', 'qualification', 60000):
        c.cliquer('#boutonQualifPasser'); c.attendre('() => JEU.qualif && JEU.qualif.etat === "resultat"', 240000); c.inspecter('qualification : le résultat'); c.cliquer('#boutonQualifCourse')
    if not c.ecran('course', 'course seule', 60000): return
    c.attendre('() => JEU.plateau && JEU.plateau.carte !== null', 240000)
    c.ev('() => BOUCLE.simuler(2)')
    pg.keyboard.press('Escape')
    if not c.ecran('pause', 'menu pause'): return
    vus = []
    for b in ('#boutonFantomePause', '#boutonFantomePause', '#boutonCommentairePause', '#boutonCommentairePause', '#boutonCommentairePause', '#boutonRevoirAidesPause'):
        avant = c.ev(f'() => document.querySelector("{b}") && document.querySelector("{b}").textContent')
        if c.si(b): vus.append([b, avant, c.ev(f'() => document.querySelector("{b}").textContent')]); c.inspecter('menu pause : ' + b)
    t(f'{titre} : le menu pause : chaque réglage change le texte de son bouton (fantôme, commentateur, revoir les aides)', len(vus) == 6 and all(x[1] != x[2] or x[0] == '#boutonRevoirAidesPause' for x in vus), str(vus))
    if c.si('#boutonTutorielPause'):
        c.inspecter('menu pause : liste des leçons')
        c.si('#boutonTutoRetour')
    c.cliquer('#boutonReprendre'); c.ecran('course', 'reprendre')

# --- le tutoriel complet : les 7 leçons à la suite ---
TUTO_JOUER = '''(n) => { for (let i = 0; i < n; i++) { if (TUTORIEL_ECRAN.resultat()) break; BOUCLE.simuler(0.05); TUTORIEL_ECRAN.maj(0.05); } return TUTORIEL_ECRAN.resultat(); }'''
def tuto(c, titre):
    pg = c.pg
    c.aller(f'index.html?tutoriel=conduite&course=1&lang={c.langue}')
    faites = []
    for n in range(7):
        if not c.attendre('() => typeof TUTORIEL_ECRAN !== "undefined" && TUTORIEL_ECRAN.lecon() !== null', 30000):
            c.blocages.append({ 'quoi': f'leçon {n + 1}', 'attendu': 'une leçon', 'ecran': c.ev('() => JEU.ecran'), 'page': pg.url.split('/')[-1] }); break
        id = c.ev('() => TUTORIEL_ECRAN.lecon()')
        if id == 'visite':
            # (une vraie carrière dans la sauvegarde d'abord, posée depuis une page qui n'est pas une leçon, comme tests/ecrans.py ; puis la leçon)
            lecon = pg.url.split('/')[-1]
            c.aller(f'index.html?championnat=1&lang={c.langue}'); c.ecran('championnat', 'paddock avant la visite')
            c.ev('() => { const d = SAUVEGARDE.lire(); d.championnat = CHAMPIONNAT.creer(7); d.championnat.marqueTest = 7; SAUVEGARDE.ecrire(d); }')
            c.aller(lecon)
            c.attendre('() => typeof TUTORIEL_ECRAN !== "undefined" && TUTORIEL_ECRAN.lecon() === "visite"', 30000)
            c.ecran('championnat', 'leçon visite : le paddock')
            # la leçon 7 dans la page : on change le cran d'aileron pendant la visite ; la carrière (sauvegarde et mémoire) doit revenir telle quelle
            avant = c.ev('() => JSON.stringify(SAUVEGARDE.lire().championnat)')
            change = False
            for b, e in (('#boutonGarage', 'garage'), ('#boutonAileron', 'aileron'), (None, None), ('#boutonAileronRetour', 'garage'), ('#boutonGarageRetour', None)):
                if b is None:
                    change = c.ev('''(a) => { const k = document.getElementById("aileronCurseur"); k.value = String((Number(k.value) + 2) % REGLAGES.AILERON_CRANS); k.dispatchEvent(new Event("input")); k.dispatchEvent(new Event("change")); return JSON.stringify(SAUVEGARDE.lire().championnat) !== a || JSON.stringify(JEU.championnat) !== a; }''', avant)
                    continue
                c.cliquer(b)
                if e: c.ecran(e, f'leçon visite : {e}')
            c.attendre('() => TUTORIEL_ECRAN.resultat() !== null', 10000)
            apres = c.ev('(a) => [JSON.stringify(SAUVEGARDE.lire().championnat) === a, JSON.stringify(JEU.championnat) === a]', avant)
            t(f'{titre} : leçon 7 (la visite), dans la page : le cran d’aileron changé pendant la leçon ne reste pas dans la carrière (sauvegarde et mémoire)', change and apres == [True, True], str([change, apres]))
        else:
            if not c.ecran('course', f'leçon {id}', 60000): break
            c.attendre('() => !JEU.plateau || JEU.plateau.carte !== null', 240000)
            c.inspecter(f'leçon {id} : la consigne')
            c.ev('() => { BOUCLE.arreter(); JEU.robot = true; }')
            if id == 'stand': c.ev('() => { BOUCLE.simuler(4); JEU.joueur.versStands = true; }')
            if id == 'pluie': c.ev('() => { for (let i = 0; i < 4000 && !(JEU.plateau.meteo && JEU.plateau.meteo.eau >= REGLAGES.TUTO_PLUIE_EAU); i++) { BOUCLE.simuler(0.05); TUTORIEL_ECRAN.maj(0.05); } JEU.joueur.versStands = true; }')
            c.ev(TUTO_JOUER, 6000)
        r = c.ev('() => TUTORIEL_ECRAN.resultat()')
        faites.append([id, r]); c.inspecter(f'leçon {id} : le résultat')
        if n < 6:
            if not c.cliquer('#boutonTutoSuivante', navigation=True): break
            c.pret(60000)
    t(f'{titre} : le tutoriel complet : les 7 leçons à la suite, réussies par le robot', len(faites) == 7 and all(r == 'reussie' for _, r in faites), str(faites))
    c.si('#boutonTutoListe'); c.inspecter('tutoriel : la liste des leçons (7 étoiles)')

# --- la manette et la trajectoire conseillée (tour 40d) : de fausses manettes (comme tests/ecrans.py), mêlées au clavier ---
FAUSSES_MANETTES = """(() => { const pad = i => ({ index: i, id: 'fausse manette ' + i, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })) });
  window.__pads = [pad(0)];
  navigator.getGamepads = () => window.__pads;
  window.__padFixer = (k, nom, x) => { const p = window.__pads[k]; if (nom.startsWith('axe')) p.axes[+nom.slice(3)] = x; else p.buttons[MANETTE.BOUTONS[nom]] = { value: x, pressed: x > 0.5 }; };
  window.__padDebrancher = () => { const p = window.__pads.pop(); if (p) { p.connected = false; window.dispatchEvent(Object.assign(new Event('gamepaddisconnected'), { gamepad: p })); } }; })();"""
# les feux passés d'un coup (la boucle arrêtée le temps de les finir), puis la boucle repart
FEUX_PASSES = '() => { BOUCLE.arreter(); const P = JEU.plateau ? JEU.plateau.pilotes : []; for (const p of P) if (p.course && p.course.compte > 0.05) p.course.compte = 0.05; if (JEU.course && JEU.course.compte > 0.05) JEU.course.compte = 0.05; let n = 0; while (JEU.course.etat === "compte" && n++ < 2400) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE); BOUCLE.simuler(0.5); BOUCLE.demarrer(); return JEU.course.etat; }'
# la trajectoire conseillée devant le grand freinage du circuit (le point le plus lent de la carte, 150 m avant), dessinée par CONSEIL.maj
# pour une voiture à la vitesse conseillée : le premier point rouge, au sec puis sous la pluie (adhMeteo, l'adhérence que la météo laisse
# aux pneus : la même que lit ia.js) ; sous la pluie, on freine plus tôt
CONSEIL_PLUIE = """(adh) => { const C = JEU.carte, T = C.trajectoire, nb = C.circuit.nb; let m = 0; for (let i = 0; i < nb; i++) if (T.vitesse[i] < T.vitesse[m]) m = i;
  const k = (m - Math.round(150 / C.circuit.pas) + nb) % nb, v = { piste: { indice: k }, u: T.vitesse[(k + 1) % nb], adhMeteo: adh, adherence: 1, aileronAdherence: 1 };
  CONSEIL.maj(v, C, 'tout', null); const col = CONSEIL.ligne.geometry.attributes.color.array, r = new THREE.Color(REGLAGES.COULEUR_CONSEIL_ROUGE);
  for (let q = 0; q < col.length / 6; q++) if (Math.abs(col[6 * q] - r.r) < 1e-6 && Math.abs(col[6 * q + 1] - r.g) < 1e-6 && Math.abs(col[6 * q + 2] - r.b) < 1e-6) return q;
  return -1; }"""
def manette(c, titre):
    pg = c.pg
    pg.add_init_script(FAUSSES_MANETTES)
    # 1. seul : la manette conduit, puis on la débranche en pleine course : la pause
    c.aller(f'index.html?course=3&circuit=test&lang={c.langue}')
    if not c.ecran('course', 'course à la manette', 60000): return
    c.attendre('() => JEU.course && (!JEU.plateau || JEU.plateau.carte !== null)', 240000)
    c.ev(FEUX_PASSES)
    c.ev('() => __padFixer(0, "gachetteD", 1)'); pg.wait_for_timeout(1200)
    roule = c.ev('() => [JEU.cibles.gaz, JEU.joueur.u]')
    t(f'{titre} : seul, la gâchette droite de la manette accélère', bool(roule) and roule[0] == 1 and roule[1] > 0.3, str(roule))
    c.ev('() => __padDebrancher()'); pg.wait_for_timeout(800)
    e = c.ev('() => [JEU.ecran, JEU.cibles.gaz]')
    t(f'{titre} : la manette débranchée en pleine course : le jeu se met en pause, et la gâchette ne reste pas enfoncée', bool(e) and e[0] == 'pause' and e[1] == 0, str(e))
    if e and e[0] == 'pause': c.inspecter('pause : manette débranchée')
    # 2. à deux : le joueur 1 à la manette, le joueur 2 au clavier (les flèches), en même temps ; la trajectoire conseillée jamais à deux
    c.aller(f'index.html?deux=1&ia=0&tours=3&circuit=test&niveau=debutant&lang={c.langue}')
    if not c.ecran('course', 'course à deux, manette et clavier', 60000): return
    c.attendre('() => JEU.plateau && JEU.plateau.carte !== null', 240000)
    c.ev('() => { SAUVEGARDE.ecrireOption("trajectoire", "oui"); JEU.reglageTrajectoire = "oui"; }')
    c.ev(FEUX_PASSES)
    c.ev('() => __padFixer(0, "gachetteD", 1)'); pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(800)
    a = c.ev('() => [JEU.deuxCommandes[1].cibles.gaz, JEU.deuxCommandes[2].cibles.gaz]')
    c.ev('() => __padFixer(0, "gachetteD", 0)'); pg.wait_for_timeout(500)
    b = c.ev('() => [JEU.deuxCommandes[1].cibles.gaz, JEU.deuxCommandes[2].cibles.gaz]')
    pg.keyboard.up('ArrowUp'); c.ev('() => __padFixer(0, "gachetteD", 1)'); pg.wait_for_timeout(500)
    d = c.ev('() => [JEU.deuxCommandes[1].cibles.gaz, JEU.deuxCommandes[2].cibles.gaz]')
    t(f'{titre} : à deux, manette (joueur 1) et flèches (joueur 2) en même temps : chacun ses gaz, rien ne passe à l’autre', a == [1, 1] and b == [0, 1] and d == [1, 0], str([a, b, d]))
    conseil = c.ev('() => [REGLAGES.NIVEAU, !!(CONSEIL.ligne && CONSEIL.ligne.visible)]')
    t(f'{titre} : à deux (en débutant, la trajectoire conseillée réglée sur oui) : aucune trajectoire conseillée', bool(conseil) and conseil[0] == 'debutant' and not conseil[1], str(conseil))
    c.ev('() => __padDebrancher()'); pg.wait_for_timeout(800)
    e = c.ev('() => [JEU.ecran, JEU.deuxCommandes[1].cibles.gaz]')
    t(f'{titre} : à deux, la manette du joueur 1 débranchée en pleine course : la pause, et ses gaz relâchés', bool(e) and e[0] == 'pause' and e[1] == 0, str(e))
    # 3. la trajectoire conseillée sous la pluie : le rouge doit commencer plus tôt qu'au sec (moins d'adhérence, freinage plus long)
    c.aller(f'index.html?course=1&circuit=technique&niveau=debutant&lang={c.langue}')
    if not c.ecran('course', 'course seule, la trajectoire conseillée', 60000): return
    c.attendre('() => JEU.carte && typeof CONSEIL !== "undefined" && CONSEIL.ligne', 240000)
    sec, pluie = c.ev(CONSEIL_PLUIE, 1), c.ev(CONSEIL_PLUIE, 0.6)
    t(f'{titre} : la trajectoire conseillée sous la pluie (adhérence × 0,6) : le rouge commence plus tôt qu’au sec (premier point rouge : sec {sec}, pluie {pluie})', isinstance(sec, int) and isinstance(pluie, int) and 0 <= pluie < sec, str([sec, pluie]))

# --- une saison anglaise jouée en entier (tour 40d), puis, avec les vraies données de la saison, les écrans du paddock un par un :
# le calendrier, l'album feuilleté de bout en bout, la fiche de chacun des 19 rivaux, l'arbre de la dynastie
def paddock_complet(c, titre):
    pg = c.pg
    c.ev('() => { if (window.AIDES_ECRAN) AIDES_ECRAN.fermer(); }')
    c.cliquer('#boutonCalendrier'); c.ecran('calendrier', 'calendrier (saison jouée)')
    n = c.ev('() => document.querySelectorAll("#calendrierListe li, #calendrier li").length')
    t(f'{titre} : le calendrier montre les 12 Grands Prix', n == 12, str(n))
    c.cliquer('#boutonCalendrierRetour'); c.ecran('championnat', 'retour du calendrier')
    c.cliquer('#boutonAlbum')
    if c.ecran('album', 'album (saison jouée)'):
        pages = 0
        for _ in range(30):
            if not c.si('#boutonAlbumAvant'): break
            pages += 1; c.inspecter('album feuilleté (saison jouée)')
        for _ in range(3):
            if c.si('#boutonAlbumSaisonAvant'): c.inspecter('album : saison d’avant')
            if c.si('#boutonAlbumSaisonApres'): c.inspecter('album : saison d’après')
        t(f'{titre} : l’album se feuillette de bout en bout ({pages + 1} unes vues)', pages >= 11, str(pages))
        c.cliquer('#boutonAlbumFermer'); c.ecran('championnat', 'retour de l’album')
    rivaux = c.ev('() => JEU.championnat.pilotes.filter(p => !p.humain).map(p => JEU.championnat.pilotes.indexOf(p))') or []
    vues = 0
    for k in rivaux:
        c.ev(f'() => montrerFiche({k})')
        if c.ecran('fiche', 'fiche de chaque rival'): vues += 1
        c.ev('() => quitterFiche()')
    t(f'{titre} : la fiche de chacun des {len(rivaux)} rivaux s’ouvre et se ferme', vues == len(rivaux) == 19, str([vues, len(rivaux)]))
    c.cliquer('#boutonArbre'); c.ecran('arbre', 'arbre (saison jouée)'); c.cliquer('#boutonArbreRetour'); c.ecran('championnat', 'retour de l’arbre')

def saison_en(c, titre):
    c.aller('index.html?robot=1&tours=1&lang=en')
    arrive = c.jouer(lambda e: e[0] == 'championnat', 400, 'premier lancement')
    t(f'{titre} : le premier lancement mène au paddock', arrive, str(c.bloque))
    for gp in range(1, 13):
        if c.bloque is not None: break
        fin_ = (lambda e: e[0] == 'championnat' and e[5] == 2) if gp == 12 else (lambda e, gp=gp: e[0] in ('qualif', 'course') and e[5] == 1 and e[6] == gp)
        fait = c.jouer(fin_, 900, f'Grand Prix {gp}' + (' et la fin de saison' if gp == 12 else ''))
        t(f'{titre} : Grand Prix {gp} joué' + (' jusqu’au paddock de la saison 2' if gp == 12 else ''), fait, str(c.bloque))
        if not fait: break
    if c.bloque is None and c.ev('() => JEU.ecran === "championnat" && JEU.championnat.saison === 2'): paddock_complet(c, titre)

# --- la solidité (tour 41d) ---
# un écran est-il vraiment là (pas un écran noir) : un écran du jeu visible, ou la course
ECRAN_VU = '() => typeof JEU !== "undefined" && !!JEU.ecran && (["course", "qualif", "grille", "survol"].includes(JEU.ecran) || [...document.querySelectorAll("section.ecran")].some(e => !e.classList.contains("cache") && e.getClientRects().length > 0))'
def ecrire_sauvegarde(c, js_valeur):
    # (depuis une page qui ne touche pas à la sauvegarde ; null : la clé enlevée)
    # (sans attendre JEU : cette page n'a pas le jeu ; c.aller attendrait 60 s pour rien)
    c.recolter(); c.pg.goto('file://' + RACINE + '/tests/textes.html')
    c.ev(f'(v) => {{ if (v === null) localStorage.removeItem("grand-prix-dynasty"); else localStorage.setItem("grand-prix-dynasty", v); }}', js_valeur)
def lire_sauvegarde(c):
    return c.ev('() => localStorage.getItem("grand-prix-dynasty")')
def sauvegarde(c, titre):
    import json
    # une vraie carrière (Grand Prix 4) dans la sauvegarde, la référence
    c.aller(f'index.html?championnat=1&tours=1&robot=1&gp=4&lang={c.langue}')
    c.ecran('championnat', 'paddock de référence', 60000)
    c.ev('() => SAUVEGARDE.ecrireChampionnat(JEU.championnat)')   # (?championnat=1 n'écrit pas tout seul : la carrière écrite comme après une course)
    bonne = json.loads(lire_sauvegarde(c)); bonne['decouverteFaite'] = True; bonne = json.dumps(bonne)   # (une carrière après la découverte, comme un vrai joueur)
    cas = []
    cas.append(('JSON coupé au milieu', bonne[:len(bonne) // 2], True))
    x = json.loads(bonne); del x['championnat']['pilotes']; cas.append(('championnat sans ses pilotes', json.dumps(x), True))
    x = json.loads(bonne); del x['championnat']['ecuries']; del x['options']; cas.append(('championnat sans ses écuries, sans options', json.dumps(x), True))
    x = json.loads(bonne); x['version'] = 3; x['championnat'].pop('dynastie', None); x['championnat'].pop('carriere', None); x.pop('temple', None); cas.append(('une sauvegarde v3 (sans dynastie ni temple)', json.dumps(x), False))
    x = json.loads(bonne); x['version'] = 1; x.pop('championnat', None); cas.append(('une sauvegarde v1 (avant le championnat : rien à perdre)', json.dumps(x), None))
    x = json.loads(bonne); x['version'] = 99; cas.append(('une sauvegarde d’une version future (99)', json.dumps(x), True))
    cas.append(('pas un objet (« 42 »)', '42', True))
    for nom, valeur, perdue in cas:
        t_cas = time.monotonic()
        ecrire_sauvegarde(c, valeur)
        avant = len(c.console)
        c.aller(f'index.html?lang={c.langue}')
        vu = c.attendre(ECRAN_VU, 30000)
        e = c.ev('() => [JEU.ecran, !!JEU.championnat, typeof SAUVEGARDE !== "undefined" && typeof SAUVEGARDE.perdue === "function" ? SAUVEGARDE.perdue() : null, document.getElementById("sauvegardePerdue").dataset.avis === "perdue" && document.getElementById("sauvegardePerdue").textContent === texte("sauvegardePerdue")]') or [None] * 4
        erreurs = [m for _, m in c.console[avant:]]
        t(f'{titre} : {nom} : le jeu repart sur un écran visible ({e[0]}), sans erreur', vu and not erreurs, str([e, erreurs[:3]]))
        if perdue:
            t(f'{titre} : {nom} : la carrière perdue, le jeu le dit (un message à l’écran)', bool(e[3]), str(e))
        elif perdue is None:
            t(f'{titre} : {nom} : pas de carrière à perdre, pas de message', not e[3], str(e))
        else:
            # (la carrière de référence vient de ?championnat=1 : son pilote n'a pas encore de nom, la page demande donc sa création)
            t(f'{titre} : {nom} : la carrière est gardée (paddock, ou la création du pilote qu’elle n’avait pas faite)', e[0] in ('championnat', 'pilote') and e[1] and not e[3], str(e))
        c.inspecter(f'sauvegarde : {nom}')
        L.append(f'  ({titre} : {nom} en {time.monotonic() - t_cas:.0f} s)')
    ecrire_sauvegarde(c, bonne)
STOCKAGE = {
  'plein': "(() => { const f = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException('plein', 'QuotaExceededError'); }; })();",
  'interdit': "(() => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('interdit', 'SecurityError'); } }); })();",
}
def stockage(c, titre):
    # le localStorage plein (rien ne s'écrit) ou interdit (navigation privée) : le premier lancement, la découverte, la création, le paddock
    for nom, js in STOCKAGE.items():
        pg = c.pg.context.new_page(); c.pg = pg
        pg.on('pageerror', lambda e: c.console.append((c.dernier, 'PAGEERROR ' + str(e))))
        pg.on('console', lambda m: c.console.append((c.dernier, m.type + ': ' + m.text)) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
        pg.add_init_script(js)
        c.aller(f'index.html?robot=1&tours=1&lang={c.langue}')
        vu = c.attendre(ECRAN_VU, 30000)
        t(f'{titre} : localStorage {nom} : l’écran titre vient', vu and c.ev('() => JEU.ecran') == 'titre', str(c.ev('() => JEU && JEU.ecran')))
        c.bloque = None
        arrive = c.jouer(lambda e: e[0] == 'championnat', 400, f'premier lancement, localStorage {nom}')
        t(f'{titre} : localStorage {nom} : le premier lancement va jusqu’au paddock (découverte, création du pilote), sans erreur', arrive and not c.console, str([c.bloque, c.console[:3]]))
        if arrive:
            # (le bandeau a été montré sur cette page : son avis et son texte restent, même une fois caché après AVIS_SAUVEGARDE_DUREE)
            av = c.ev('() => { SAUVEGARDE.ecrire(SAUVEGARDE.lire()); const e = document.getElementById("sauvegardePerdue"); return [SAUVEGARDE.impossible(), e.dataset.avis, e.textContent === texte("sauvegardeImpossible"), !!JEU.championnat]; }')
            t(f'{titre} : localStorage {nom} : la carrière tient tant que l’onglet reste ouvert, et le jeu le dit (« ta carrière s’arrêtera à la fermeture de l’onglet »)', av == [True, 'impossible', True, True], str(av))
# --- une dynastie longue : deux générations de 15 saisons (les Grands Prix joués d'avance par SAISONS.avancer, les écrans de fin de
# saison cliqués comme un joueur) ; la taille de la sauvegarde et le temps de chargement du paddock
def fin_de_saison(c, quoi):
    for _ in range(40):
        e = c.ev('() => JEU.ecran'); c.dernier = e or '?'
        if e: c.ecrans.add(e)
        if e in ('championnat', 'retraite'): return e
        if e == 'ceremonie': c.cliquer('#boutonCeremonieSuite')
        elif e == 'saison': c.cliquer('#boutonSaisonSuite')
        elif e == 'duelSaison': c.cliquer('#boutonDuelSaisonSuite')
        elif e == 'contrats':
            c.si('#bulleAide')
            if not c.si('#contratsListe button.signer'): c.ev('() => { const b = document.querySelector("#contratsListe button"); if (b) b.click(); }')
        elif e == 'sponsors':
            c.si('#bulleAide')
            if not c.si('#sponsorsListe button'): c.cliquer('#boutonSponsorsRetour')
            if c.ev('() => JEU.ecran') == 'sponsors': c.cliquer('#boutonSponsorsRetour')
        else: c.pg.wait_for_timeout(300)
    c.blocages.append({ 'quoi': quoi, 'attendu': 'championnat ou retraite', 'ecran': c.ev('() => JEU.ecran'), 'page': c.pg.url.split('/')[-1] }); return None

def dynastie(c, titre):
    c.aller(f'index.html?championnat=1&tours=1&robot=1&lang={c.langue}')
    if not c.ecran('championnat', 'paddock de la saison 1', 60000): return
    t0 = time.monotonic(); saisons = 0
    for gen in (1, 2):
        for _ in range(20):
            c.ev('() => { if (window.AIDES_ECRAN) AIDES_ECRAN.fermer(); const ch = JEU.championnat; SAISONS.avancer(ch, REGLAGES.NB_GRANDS_PRIX); SAUVEGARDE.ecrireChampionnat(ch); montrerFinSaison(); }')
            saisons += 1
            r = fin_de_saison(c, f'génération {gen}, saison {saisons}')
            if r != 'championnat': break
        t(f'{titre} : génération {gen} : la retraite par l’âge arrive ({saisons} saisons jouées en tout)', r == 'retraite' and c.ev('() => JEU.championnat.retraite && JEU.championnat.retraite.raison') == 'age', str([r, saisons]))
        if r != 'retraite': return
        c.inspecter(f'bilan de la génération {gen}')
        if gen == 1:
            c.cliquer('#boutonContinuerDynastie')
            if not c.ecran('heritier', 'héritier'): return
            try: c.pg.fill('#heritierPrenom', 'Léa', timeout=3000)
            except Exception: pass
            c.cliquer('#boutonHeritierValider')
            if not c.ecran('championnat', 'paddock de la 2e génération'): return
    duree = time.monotonic() - t0
    c.cliquer('#boutonArbreBilan'); c.ecran('arbre', 'arbre de 2 générations (depuis le bilan)')
    g = c.ev('() => document.querySelectorAll("#arbreGenerations li").length')
    t(f'{titre} : l’arbre de la dynastie montre les 2 générations', g == 2, str(g))
    c.ev('() => { SAUVEGARDE.ecrireChampionnat(JEU.championnat); const d = SAUVEGARDE.lire(); d.decouverteFaite = true; SAUVEGARDE.ecrire(d); }')   # (comme un vrai joueur : la découverte faite, la carrière écrite)
    taille = c.ev('() => localStorage.getItem("grand-prix-dynasty").length')
    # le chargement : la page nue rechargée jusqu'au paddock ; puis le paddock seul (montrerChampionnat), et une lecture de la sauvegarde
    c.aller(f'index.html?lang={c.langue}')
    ok_ = c.attendre('() => typeof JEU !== "undefined" && (JEU.ecran === "championnat" || JEU.ecran === "retraite")', 60000)
    m = c.ev('() => { const a = performance.now(); SAUVEGARDE.lire(); const b = performance.now(); if (JEU.ecran === "retraite") montrerRetraite(); else montrerChampionnat(null); const d = performance.now(); return { pret: Math.round(a), lire: b - a, paddock: d - b, ecran: JEU.ecran }; }') or {}
    L.append(f"  ({titre} : 2 générations, {saisons} saisons en {duree:.0f} s ; sauvegarde {taille} caractères ({(taille or 0) / 1024:.0f} Ko) ; la page jusqu’au paddock {m.get('pret')} ms, une lecture de la sauvegarde {m.get('lire', 0):.1f} ms, l’écran du paddock {m.get('paddock', 0):.1f} ms)")
    t(f'{titre} : après 2 générations, la sauvegarde reste sous 1 Mo ({(taille or 0) / 1024:.0f} Ko) et la page revient', ok_ and taille and taille < 1024 * 1024, str([taille, m]))
    t(f'{titre} : le paddock d’une dynastie de 2 générations s’affiche en moins de 500 ms ({m.get("paddock", 0):.0f} ms), une lecture de la sauvegarde en moins de 100 ms ({m.get("lire", 0):.0f} ms)', m.get('paddock', 1e9) < 500 and m.get('lire', 1e9) < 100, str(m))

# --- pendant la conduite : l'onglet caché puis revenu, la pause et la reprise, la fenêtre redimensionnée ; sur chaque écran de conduite
CACHER = """(oui) => { if (!window.__cacheFaux) { window.__cacheFaux = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => !!window.__cache }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__cache ? 'hidden' : 'visible' }); }
  window.__cache = oui; document.dispatchEvent(new Event('visibilitychange')); return [BOUCLE.nbPas, JEU.course ? JEU.course.temps : null]; }"""
def conduite(c, titre, quoi, pause_ecran):
    pg = c.pg
    c.ev('() => { JEU.robot = true; }')   # (le robot conduit : la voiture bouge, on voit si elle s'arrête)
    c.inspecter(f'{quoi} : en conduite')
    # l'onglet caché 2 s : rien n'avance ; revenu : pas de bond (au plus 0,5 s de jeu sur 0,5 s réelle, plus une image)
    a = c.ev(CACHER, True); pg.wait_for_timeout(2000); b = c.ev('() => [BOUCLE.nbPas, JEU.course ? JEU.course.temps : null]')
    c.ev(CACHER, False); pg.wait_for_timeout(500); d = c.ev('() => [BOUCLE.nbPas, JEU.course ? JEU.course.temps : null]')
    t(f'{titre} : {quoi} : l’onglet caché 2 s, rien n’avance ; revenu, la course repart sans bond', bool(a and b and d) and b[0] - a[0] <= 1 and 0 < d[0] - b[0] <= 0.5 * 120 + 2 * 12, str([a, b, d]))
    # la pause et la reprise : le temps de course s'arrête, puis repart
    if pause_ecran:
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        e1 = c.ev('() => [JEU.ecran, JEU.joueur ? JEU.joueur.x.toFixed(3) + "," + JEU.joueur.z.toFixed(3) : null]'); pg.wait_for_timeout(1000); e2 = c.ev('() => [JEU.ecran, JEU.joueur ? JEU.joueur.x.toFixed(3) + "," + JEU.joueur.z.toFixed(3) : null]')
        if e1 and e1[0] == pause_ecran: c.inspecter(f'{quoi} : la pause')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(800)
        e3 = c.ev('() => [JEU.ecran, JEU.joueur ? JEU.joueur.x.toFixed(3) + "," + JEU.joueur.z.toFixed(3) : null]')
        t(f'{titre} : {quoi} : Échap met la pause ({pause_ecran}), la physique du joueur s’arrête (la voiture ne bouge plus), Échap repart', bool(e1 and e2 and e3) and e1[0] == pause_ecran and e2[1] == e1[1] and e3[0] != pause_ecran and e3[1] != e2[1], str([e1, e2, e3]))
    # la fenêtre redimensionnée en pleine conduite : rien ne déborde, la course continue
    for l, h in ((1280, 720), (960, 600)):
        pg.set_viewport_size({'width': l, 'height': h}); pg.wait_for_timeout(400); c.inspecter(f'{quoi} : redimensionné en {l}×{h}')
    # (la course continue : mesurée en temps de jeu, la boucle arrêtée le temps de 0,5 s de physique, puis relancée ; en temps réel,
    # sous swiftshader, 400 ms pouvaient passer sans un seul pas, tour 42d)
    r = c.ev('() => { const a = [JEU.ecran, SCENE3D.canvas.clientWidth, BOUCLE.tourne, JEU.joueur.x.toFixed(3) + "," + JEU.joueur.z.toFixed(3)]; BOUCLE.arreter(); BOUCLE.simuler(0.5); a.push(JEU.joueur.x.toFixed(3) + "," + JEU.joueur.z.toFixed(3)); BOUCLE.demarrer(); a.push(BOUCLE.tourne); return a; }')
    t(f'{titre} : {quoi} : la fenêtre redimensionnée (1280×720 puis 960×600) en pleine conduite : le dessin suit, la course continue', bool(r) and r[1] == 960 and r[2] and r[5] and r[4] != r[3], str(r))

def pendant(c, titre):
    pg = c.pg
    # la qualification (le tour chronométré : il n'a pas de pause, voir CLAUDE.md), puis la course
    c.aller(f'index.html?course=1&ia=3&joueur=1&robot=1&circuit=test&lang={c.langue}')
    if c.ecran('qualif', 'qualification', 60000):
        c.attendre('() => !document.getElementById("boutonQualifTour").classList.contains("cache")', 240000)
        c.cliquer('#boutonQualifTour')
        if c.attendre('() => JEU.qualif && JEU.qualif.etat === "tour"', 30000): pg.wait_for_timeout(1500); conduite(c, titre, 'le tour de qualification', None)
        c.ev('() => { for (let i = 0; i < 400 && !(JEU.qualif && JEU.qualif.etat === "resultat"); i++) BOUCLE.simuler(1); }')
        c.attendre('() => JEU.qualif && JEU.qualif.etat === "resultat"', 60000); c.cliquer('#boutonQualifCourse')
    if c.ecran('course', 'course', 60000):
        c.attendre('() => JEU.plateau && JEU.plateau.carte !== null', 240000); c.ev(FEUX_PASSES); conduite(c, titre, 'la course', 'pause')
    # le tutoriel (la leçon 1)
    c.aller(f'index.html?tutoriel=conduite&course=1&lang={c.langue}')
    if c.ecran('course', 'leçon 1', 60000): c.ev(FEUX_PASSES); conduite(c, titre, 'une leçon du tutoriel', 'pause')
    # à deux
    c.aller(f'index.html?deux=1&ia=0&tours=3&circuit=test&lang={c.langue}')
    if c.ecran('course', 'course à deux', 60000):
        c.attendre('() => JEU.plateau && JEU.plateau.carte !== null', 240000); c.ev(FEUX_PASSES); conduite(c, titre, 'la course à deux', 'pause')
    # le tournoi : un passage (« À toi », puis le tour)
    c.aller(f'index.html?lang={c.langue}')
    if c.ecran('titre', 'titre'):
        c.cliquer('#boutonAmis'); c.cliquer('#boutonAmisTournoi')
        if c.ecran('tournoiInscription', 'inscription du tournoi'):
            c.cliquer('#boutonFormuleEclair'); c.cliquer('#boutonTournoiPartir', navigation=True)
            if c.ecran('tournoiAToi', 'à toi', 60000) and c.attendre('() => JEU.qualif && JEU.qualif.etat === "tour"', 30000):
                pg.wait_for_timeout(1500); conduite(c, titre, 'un tour du tournoi', 'tournoiPause')

# --- les aides au pilotage choisies avant la course (tour 42d) : l'écran, le bonus, gardées d'un Grand Prix à l'autre, figées pendant la
# course ; le curseur VOITURE_VIVANTE de ?reglages=1 à 0 : la voiture d'avant au bit près, même en légende
POSITION = '() => [JEU.joueur.x, JEU.joueur.z, JEU.joueur.cap, JEU.joueur.u]'
def tour_robot(c, adresse, avant_js=None):
    # une course seule, le robot, 20 s de jeu après les feux, la boucle arrêtée (au pas près) ; avant_js : posé avant les feux
    c.aller(adresse)
    if not c.ecran('course', 'course seule (robot)', 60000): return None
    c.attendre('() => JEU.course', 30000)
    if avant_js: c.ev(avant_js)
    return c.ev('() => { BOUCLE.arreter(); JEU.robot = true; let n = 0; while (JEU.course.etat === "compte" && n++ < 120 * 30) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE); BOUCLE.simuler(20); return [JEU.joueur.x, JEU.joueur.z, JEU.joueur.cap, JEU.joueur.u, REGLAGES.NIVEAU, REGLAGES.VOITURE_VIVANTE]; }')
def aides_pilotage(c, titre):
    pg = c.pg
    c.aller(f'index.html?championnat=1&tours=1&robot=1&lang={c.langue}')
    if not c.ecran('championnat', 'paddock', 60000): return
    c.ev('() => { if (window.AIDES_ECRAN) AIDES_ECRAN.fermer(); SAUVEGARDE.ecrireChampionnat(JEU.championnat); const d = SAUVEGARDE.lire(); d.decouverteFaite = true; SAUVEGARDE.ecrire(d); }')
    c.cliquer('#boutonAidesPaddock')
    vu = c.attendre('() => !document.getElementById("choixAides").classList.contains("cache")', 5000)
    t(f'{titre} : « Aides au pilotage » s’ouvre depuis le paddock', vu)
    c.inspecter('aides au pilotage (paddock)')
    avant = c.ev('() => JSON.stringify(JEU.assistance)')
    for a in ('freinage', 'antiblocage'):
        c.cliquer(f'#choixAidesListe button[data-aide="{a}"]')
    choisi = c.ev('() => [JSON.stringify(JEU.assistance), JSON.stringify(SAUVEGARDE.option("aides_pilotage", null)), ASSISTANCE.bonus(JEU.assistance), document.getElementById("choixAidesBonus").textContent]')
    t(f'{titre} : deux aides changées : le choix est sauvegardé, le bonus affiché suit', bool(choisi) and choisi[0] != avant and choisi[0] == choisi[1] and choisi[3].strip() != '', str([avant, choisi]))
    c.inspecter('aides au pilotage (deux aides changées)')
    c.cliquer('#boutonAidesValider')
    # le Grand Prix suivant (la page se recharge) : le même choix ; et les gains du Grand Prix joué portent le bonus de ces aides
    c.bloque = None
    g = c.jouer(lambda e: e[0] in ('qualif', 'course') and e[6] == 1, 900, 'Grand Prix 1 avec les aides choisies')
    apres = c.ev('() => [JSON.stringify(JEU.assistance), JSON.stringify((JEU.championnat.argent.historique || []).slice(-1)[0])]')
    t(f'{titre} : au Grand Prix suivant (page rechargée), le même choix d’aides', g and bool(apres) and apres[0] == choisi[0], str([g, c.bloque, apres, choisi[0]]))
    # pendant la course : le menu pause montre les aides, figées
    c.attendre('() => JEU.ecran === "course" || (JEU.qualif && JEU.qualif.etat === "choix")', 60000)
    if c.ev('() => JEU.ecran') == 'qualif':
        c.cliquer('#boutonQualifPasser'); c.attendre('() => JEU.qualif && JEU.qualif.etat === "resultat"', 240000); c.cliquer('#boutonQualifCourse')
    if c.ecran('course', 'course du Grand Prix 2', 60000):
        c.attendre('() => JEU.plateau && JEU.plateau.carte !== null', 240000)
        pg.keyboard.press('Escape')
        if c.ecran('pause', 'pause (aides figées)'):
            for a in ('Direction', 'Freinage', 'Antiblocage', 'Antipatinage'): c.si(f'#bouton{a}Pause')
            fige = c.ev('() => [JSON.stringify(JEU.assistance), JSON.stringify(SAUVEGARDE.option("aides_pilotage", null))]')
            t(f'{titre} : pendant la course, les aides du menu pause sont figées (un clic sur chacune ne change rien)', fige == [choisi[0], choisi[0]], str([fige, choisi[0]]))
            pg.keyboard.press('Escape')
    # le curseur VOITURE_VIVANTE (?reglages=1) à 0 en légende : le même tour que la voiture d'avant (en normal), au bit près
    ref = tour_robot(c, f'index.html?course=1&circuit=test&niveau=normal&lang={c.langue}')
    leg0 = tour_robot(c, f'index.html?course=1&circuit=test&niveau=legende&reglages=1&lang={c.langue}', '() => { const k = document.querySelector("input[data-cle=VOITURE_VIVANTE]"); k.value = "0"; k.dispatchEvent(new Event("input")); }')
    leg1 = tour_robot(c, f'index.html?course=1&circuit=test&niveau=legende&lang={c.langue}')
    t(f'{titre} : ?reglages=1, VOITURE_VIVANTE à 0 en légende : 20 s du robot au bit près comme la voiture d’avant (et à 1, une autre voiture)', bool(ref and leg0 and leg1) and ref[:4] == leg0[:4] and leg0[5] == 0 and leg1[:4] != ref[:4], str([ref, leg0, leg1]))

# --- les grandes tailles (tour 39d) : un passage court en 1280×720 et en 1920×1080, en plus du 960×600 des autres parties ---
# la carrière : le premier lancement (titre → découverte → Bravo → création), le premier Grand Prix joué par le robot comme dans saison.py
# (au paddock : garage, courrier, discussion), puis le paddock et tous ses écrans et le menu pause (la partie ecrans)
def tailles_carriere(c, titre):
    c.aller(f'index.html?robot=1&tours=1&lang={c.langue}')
    arrive = c.jouer(lambda e: e[0] == 'championnat', 400, 'premier lancement')
    t(f'{titre} : le premier lancement mène au paddock (titre → découverte → Bravo → création du pilote)', arrive, str(c.bloque))
    if arrive:
        g1 = c.jouer(lambda e: e[0] in ('qualif', 'course') and e[6] == 1, 900, 'Grand Prix 1')
        t(f'{titre} : le Grand Prix 1 joué jusqu’au paddock suivant (et la course d’après lancée)', g1, str(c.bloque))
    ecrans(c, titre)
# les jeux entre amis : une course à deux (sans la revanche) et un tournoi ⚡ Éclair
def tailles_jeux(c, titre):
    deux(c, titre, court=True)
    tournoi(c, titre, court=True)

PARTIES = { 'aides-pilotage': aides_pilotage, 'dynastie': dynastie, 'pendant': pendant, 'sauvegarde': sauvegarde, 'stockage': stockage, 'saison-en': saison_en, 'manette': manette, 'deux': deux, 'tournoi': tournoi, 'fin': fin, 'ecrans': ecrans, 'tuto': tuto, 'tailles-carriere': tailles_carriere, 'tailles-jeux': tailles_jeux }
LANGUES = { 'saison-en': ('en',), 'dynastie': ('fr',) }   # (la saison entière en français, c'est saison.py)
TAILLES = { 'tailles-carriere': [(1280, 720), (1920, 1080)], 'tailles-jeux': [(1280, 720), (1920, 1080)] }
demandees = [x for x in (sys.argv[1:] or os.environ.get('RECOINS', '').replace(',', ' ').split()) if x] or list(PARTIES)
inconnues = [x for x in demandees if x not in PARTIES]
if inconnues: sys.exit(f'partie inconnue : {" ".join(inconnues)} (au choix : {" ".join(PARTIES)})')
t0 = time.monotonic()
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for nom in demandees:
            for langue, (l, h) in [(lg, tl) for tl in TAILLES.get(nom, [(960, 600)]) for lg in LANGUES.get(nom, ('fr', 'en'))]:
                ctx = b.new_context(viewport={'width': l, 'height': h}); pg = ctx.new_page()
                c = Recoin(pg, langue, ''); c.prefixe = f'recoins-{nom}-{l}'
                titre = f'{nom} {langue} {l}×{h}'
                try: PARTIES[nom](c, titre)
                except Exception as e: c.blocages.append({ 'quoi': 'exception du script', 'detail': str(e).split('\n')[0][:300], 'ecran': c.dernier, 'page': pg.url.split('/')[-1] })
                bilan(c, titre)
                L.append(f'  ({titre} : {time.monotonic() - t0:.0f} s depuis le début)')
                ctx.close()
    finally:
        b.close()
print(f'RESULTAT {RES["ok"]}/{RES["ok"] + RES["ko"]}'); print('\n'.join(L))
print(f'  (les recoins en {time.monotonic() - t0:.0f} s)')
sys.exit(0 if RES['ko'] == 0 else 1)
