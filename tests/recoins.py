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
    pg.keyboard.down('KeyW'); pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(1500)
    v = c.ev('() => DEUX_JOUEURS.joueurs(JEU.plateau).map(p => p.v.u)')
    pg.keyboard.up('KeyW'); pg.keyboard.up('ArrowUp')
    t(f'{titre} : les deux claviers en même temps (W et ↑ tenus ensemble) : les deux voitures accélèrent', bool(v) and all(x > 1 for x in v), str(v))
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
            c.ecran('championnat', 'leçon visite : le paddock')
            for b, e in (('#boutonGarage', 'garage'), ('#boutonAileron', 'aileron'), ('#boutonAileronRetour', 'garage'), ('#boutonGarageRetour', None)):
                c.cliquer(b)
                if e: c.ecran(e, f'leçon visite : {e}')
            c.attendre('() => TUTORIEL_ECRAN.resultat() !== null', 10000)
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

PARTIES = { 'deux': deux, 'tournoi': tournoi, 'fin': fin, 'ecrans': ecrans, 'tuto': tuto, 'tailles-carriere': tailles_carriere, 'tailles-jeux': tailles_jeux }
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
            for langue, (l, h) in [(lg, tl) for tl in TAILLES.get(nom, [(960, 600)]) for lg in ('fr', 'en')]:
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
