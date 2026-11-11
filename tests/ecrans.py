#!/usr/bin/env python3
"""La vraie page dans Chrome (Playwright) : python3 tests/ecrans.py
Pour chaque page : la console reste vide (ni erreur, ni avertissement, ni fichier manquant), la page ne défile
pas, la scène 3D dessine le circuit. En plus : la conduite au clavier (avancer, tourner, freiner, Espace, C),
l'interpolation de l'affichage, les caméras de survol, ?debug=1. Captures dans tests/captures/."""
import base64, json, math, os, re, sys, time
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    # la console vide est un critère de l'étape 0 : sans Playwright, ce n'est pas vérifié, donc c'est un échec
    print('RESULTAT 0/1 (Playwright absent : pip install playwright)'); sys.exit(1)
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# l'avertissement de Chrome quand une capture lit les pixels de l'écran (voir « console vide »)
LECTURE_PIXELS = re.compile(r'\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels')
CAPTURES = os.path.join(RACINE, 'tests', 'captures')
# (page, largeur, hauteur, capture)
PAGES = [
    ('index.html', 960, 600, 'poki.png'),   # la page nue = le premier lancement : l'écran titre
    ('index.html?debug=1', 960, 600, 'poki-debug.png'),
    ('index.html', 1280, 720, 'large.png'),
    ('index.html?seul=1', 1280, 720, None),   # l'écran de choix d'une course seule (étape 3), la conduite au clavier
    ('index.html?debug=1', 1280, 720, 'large-debug.png'),
    ('index.html?camera=auto', 1280, 720, 'auto.png'),
    ('index.html?camera=libre', 1280, 720, 'libre.png'),
    ('index.html?camera=dessus', 1280, 720, 'dessus.png'),
    ('index.html?camera=virage', 1280, 720, 'virage.png'),
    ('index.html?camera=vitrine', 1280, 720, 'voiture.png'),
    ('index.html?reglages=1&course=0', 1280, 720, 'reglages.png'),
    ('index.html?reglages=1&course=0', 960, 600, 'reglages-960.png'),          # le panneau en petit (tour 47c) : rien de coupé, libellés en français…
    ('index.html?reglages=1&course=0&lang=en', 960, 600, 'reglages-960-en.png'),   # … et en anglais
    ('index.html?course=5&robot=1', 1280, 720, None),
    ('index.html?camera=dessus&circuit=technique', 1280, 720, 'technique.png'),
    ('index.html?camera=dessus&circuit=test', 1280, 720, 'stands.png'),   # la voie des stands (étape 7) : la bande et le muret le long de la ligne droite, côté gauche
    ('index.html?course=5&ia=1&circuit=technique', 1280, 720, 'ia.png'),
    ('index.html?course=5&ia=10&circuit=technique&debug=1', 1280, 720, 'ia10.png'),
    ('index.html?course=5&ia=9&joueur=1&circuit=technique', 1280, 720, None),   # capture joueur-ia.png prise en roulant
    ('index.html?course=5&ia=9&joueur=1&circuit=technique', 960, 600, None),    # la tour de classement et le radar en petit
    ('index.html?course=1&ia=8&circuit=test', 1280, 720, None),
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=qualif', 1280, 720, None),   # la qualification du joueur (robot), capture qualif.png
    ('index.html?championnat=1&tours=1&robot=1', 960, 600, 'championnat-960.png'),   # l'écran du championnat en petit
    ('index.html?championnat=1&tours=1&robot=1', 1280, 720, None),   # 2 Grands Prix joués par le robot, rechargement, capture championnat.png   # une course d'un tour, jusqu'au podium et aux résultats
    ('index.html?course=1&ia=8&circuit=test', 960, 600, None),
    ('index.html?course=1&robot=1&test=sdk', 1280, 720, None),   # le faux SDK Poki (sdk.js) : l'ordre des appels sur une course d'un tour
    ('index.html?course=0&robot=1&pneus=1&debug=1', 1280, 720, None),
    ('index.html?course=12&robot=1&pneus=1&circuit=test&test=stand', 1280, 720, None),
    ('index.html?course=1&ia=5&circuit=monoco&test=officiel', 1280, 720, None),      # les tracés officiels dans le jeu (tour 32) : capture circuit-monoco.png
    ('index.html?course=1&ia=5&circuit=spaa&test=officiel', 1280, 720, None),        # … circuit-spaa.png
    ('index.html?course=1&ia=5&circuit=singapura&test=officiel', 1280, 720, None),   # … circuit-singapura.png
    ('index.html?championnat=1&tours=2&robot=1&test=consigne-suivie', 1280, 720, None),    # la consigne d'équipe vise le joueur : il la suit (capture consigne.png), confiance +5
    ('index.html?championnat=1&tours=2&robot=1&test=consigne-ignoree', 1280, 720, None),   # … il l'ignore, confiance −5   # l'arrêt au stand (étape 7) : le message, le robot entre dans la voie, s'arrête, ressort ; capture stand.png   # ?pneus=1 : l'usure monte sur 10 tours du robot, affichée dans ?debug=1
    ('index.html?championnat=1&tours=1&robot=1&gp=12', 1280, 720, None),   # la fin de saison : le 12e Grand Prix joué par le robot, champion, duel de la saison, contrats, saison 2 ; captures champion.png, duel-saison.png, contrats.png
    ('index.html?championnat=1&tours=1&robot=1&gp=12', 960, 600, None),    # les écrans de fin de saison en petit (Grand Prix 12 fabriqué), la retraite
    ('index.html?championnat=1&tours=1&robot=1&lang=en', 1280, 720, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=12&lang=en', 960, 600, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=12&lang=en', 1280, 720, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=3&test=discussion', 1280, 720, None),   # les discussions (tour 33, Codeur 3) : fiche → Discuter, saisie, composeur, coéquipier ; capture discussion.png
    ('index.html?championnat=1&tours=1&robot=1&gp=3&test=discussion', 960, 600, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=3&lang=en&test=discussion', 960, 600, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=3&lang=en&test=discussion', 1280, 720, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=12&test=patron', 1280, 720, None),   # les patrons (tour 35, Codeur 3) : ton patron, puis la négociation aux contrats ; captures patron.png, contrats-patron.png
    ('index.html?championnat=1&tours=1&robot=1&gp=12&test=patron', 960, 600, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=12&lang=en&test=patron', 960, 600, None),
    ('index.html?championnat=1&tours=1&robot=1&gp=12&lang=en&test=patron', 1280, 720, None),   # … en 1280×720 (le thème télé, tour 32) : aucun débordement aux deux tailles
    # l'audit anglais, suite (tour 31) : la découverte et ses aides, Entre amis, l'écran partagé et ses réglages, la création du pilote ; le
    # tournoi ; la course à deux ; le résumé vidéo ; les stands ; la consigne d'équipe ; le volant (?lang=en, 960×600, mots témoins, rien hors de l'écran)
    ('index.html?robot=1&tours=1&lang=en&test=audit-decouverte', 960, 600, None),
    ('index.html?robot=1&tours=1&lang=en&test=audit-decouverte', 640, 360, None),   # (tour 53b) l'audit de la découverte aux deux autres tailles
    ('index.html?robot=1&tours=1&lang=en&test=audit-decouverte', 1280, 720, None),
    # (tour 53b) l'audit anglais des sections du paddock (Course, Mon équipe, Boutique, Saison, Messages, Réglages), d'« Apprendre » et d'« Entre amis » aux 3 tailles
    ('index.html?championnat=1&lang=en&test=audit-paddock', 640, 360, None),
    ('index.html?championnat=1&lang=en&test=audit-paddock', 960, 600, None),
    ('index.html?championnat=1&lang=en&test=audit-paddock', 1280, 720, None),
    ('index.html?lang=en&test=audit-tournoi', 960, 600, None),
    ('index.html?deux=1&ia=3&robot=1&circuit=test&lang=en&test=audit-deux', 960, 600, None),
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&lang=en&test=audit-resume', 960, 600, None),
    ('index.html?course=12&robot=1&pneus=1&circuit=test&lang=en&test=audit-stand', 960, 600, None),
    ('index.html?championnat=1&tours=2&robot=1&lang=en&test=audit-consigne', 960, 600, None),
    ('index.html?course=0&camera=cockpit&lang=en&test=audit-volant', 960, 600, None),   # l'audit anglais (tour 31, Codeur 3) : chaque écran du championnat et de la fin de carrière, sans un mot français, rien hors de l'écran en 960×600   # la page en anglais : championnat et podium sans un mot français, capture championnat-en.png
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=fantome', 1280, 720, None),
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=defi', 960, 600, None),
    ('index.html?course=3&robot=1&circuit=test&test=seuldefi', 960, 600, None),   # (tour 51b) « 📋 Défier un ami » après une course seule
    ('index.html?championnat=1&tours=1&test=clavier', 960, 600, None),
    ('index.html?test=clavier-titre', 640, 360, None),   # (tour 50c) « ⌨ Touches » depuis l'écran titre, tout tient en 640×360 ; capture touches-titre-640.png
    ('index.html?course=0&test=clavier-pause', 640, 360, None),   # (tour 50c) … depuis le menu pause : la course reste en pause pendant le choix ; captures pause-640.png, touches-pause-640.png   # (tour 49b) les touches au choix : l'écran depuis Réglages, une touche changée conduit la voiture, capture touches.png   # (tour 49b) le défi du fantôme : « Défier un ami » après la qualification, « Relever un défi », le tour contre le fantôme, captures defi-*.png   # le fantôme du meilleur tour : deux qualifications de suite, la 2e contre le fantôme, capture fantome.png
    ('index.html?robot=1&test=decouverte&tours=1', 1280, 720, None),
    ('index.html?deux=1&ia=5&robot=1&circuit=test&test=deux', 1280, 720, None),   # le mode 2 joueurs (deux-joueurs.js) : l'écran partagé, deux robots + 5 IA, jusqu'au podium ; capture deux-joueurs.png
    ('index.html?deux=1&ia=5&robot=1&circuit=test&test=deux', 960, 600, None),    # … en petit : rien ne déborde ; capture deux-joueurs-960.png
    ('index.html?deux=1&ia=5&robot=1&circuit=technique&test=deux', 1280, 720, None),
    ('index.html?course=1&ia=9&joueur=1&robot=1&circuit=test&test=accelere', 1280, 720, None),
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=suivie', 1280, 720, None),   # suivre un pilote après l'arrivée (tour 45d) : un clic sur le classement ; capture camera-suivie.png   # « passer » finit la course en accéléré : les mêmes places et les mêmes temps qu'en regardant (deux chargements)
    ('index.html?championnat=1&tours=1&robot=1&test=accelere', 1280, 720, None),   # … en championnat : puis l'interview et la une
    ('index.html?test=amis', 1280, 720, None),
    ('index.html?course=0&camera=cockpit&test=volant', 1280, 720, None),   # le volant en vue cockpit (tour 27b) : jamais dans la moitié haute, il tourne dans le bon sens et revient ; capture cockpit.png
    ('index.html?course=0&camera=cockpit&test=volant', 960, 600, None),    # … en petit ; capture cockpit-960.png
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=resume', 1280, 720, None),   # le résumé vidéo (étape 13) : après une course, « ▶ Résumé », le rejeu, Échap / clic ; capture resume.png
    ('index.html?course=1&ia=5&joueur=1&robot=1&circuit=test&test=resume', 960, 600, None),    # … en petit ; capture resume-960.png
    ('index.html?course=3&ia=5&joueur=1&robot=1&pneus=1&circuit=test&test=hudcourse', 1280, 720, None),   # la minicarte, les pneus, les messages de course (suite du tour 31) ; captures minicarte.png, pneus-hud.png, messages.png
    ('index.html?course=3&ia=5&joueur=1&robot=1&pneus=1&circuit=test&test=hudcourse', 960, 600, None),    # … en petit, sans recouvrement
    ('index.html?course=3&ia=20&circuit=test&test=decor', 1280, 720, None),
    # les décors des 12 tracés (étape 10, tour 32) : decor.js + decors-officiels.js, le lieu (ciel, lumière, brouillard), 20 voitures ; captures lieu-<nom>.png
    ('tests/lieu.html?circuit=monoco', 1280, 720, None),
    ('tests/lieu.html?circuit=silverstoun', 1280, 720, None),
    ('tests/lieu.html?circuit=monzo', 1280, 720, None),
    ('tests/lieu.html?circuit=spaa', 1280, 720, None),
    ('tests/lieu.html?circuit=suzuko', 1280, 720, None),
    ('tests/lieu.html?circuit=interlagas', 1280, 720, None),
    ('tests/lieu.html?circuit=montreol', 1280, 720, None),
    ('tests/lieu.html?circuit=melbourn', 1280, 720, None),
    ('tests/lieu.html?circuit=barcelana', 1280, 720, None),
    ('tests/lieu.html?circuit=bahrayn', 1280, 720, None),
    ('tests/lieu.html?circuit=singapura', 1280, 720, None),
    ('tests/lieu.html?circuit=yasmarino', 1280, 720, None),
    ('index.html?course=3&ia=20&circuit=singapura&test=jeudecor', 1280, 720, None),
    ('index.html?course=3&ia=20&circuit=monzo&test=jeudecor', 1280, 720, None),
    # la météo dessinée (meteo3d.js, avec une fausse météo de test) : la pluie, les gerbes, la piste mouillée, le ciel couvert, les gouttes,
    # l'icône ; au sec, pas un pixel de changé ; la prévision au paddock ; captures pluie.png, pluie-960.png, prevision.png
    ('index.html?course=3&ia=20&circuit=monzo&meteo=pluie&test=pluie', 1280, 720, None),
    ('index.html?course=3&ia=20&circuit=monzo&meteo=pluie&test=pluie', 960, 600, None),
    ('index.html?championnat=1&meteo=risque&test=prevision', 1280, 720, None),
    ('index.html?course=3&ia=20&circuit=test&test=commentaire', 1280, 720, None),   # le commentateur (commentaire.js) dans le bandeau télé ; capture commentaire.png
    ('index.html?course=3&ia=20&circuit=monoco&test=tele', 1280, 720, None),
    ('index.html?course=3&ia=9&joueur=1&robot=1&circuit=test&test=sensations&pneus=drift&drift=1', 1280, 720, None),   # (tour 44 : la voiture vivante vient du pneu drift)
    ('index.html?course=3&ia=5&joueur=1&robot=1&circuit=test&niveau=debutant&test=conseil', 1280, 720, None),   # la trajectoire conseillée (tour 39) : en débutant, d'office ; capture conseil.png
    ('index.html?course=3&ia=5&joueur=1&robot=1&circuit=test&niveau=normal&test=conseil', 960, 600, None),     # … en normal, aucune
    ('index.html?course=3&ia=9&joueur=1&robot=1&circuit=test&qualite=auto&test=qualite', 1280, 720, None),   # la qualité automatique (tour 40, tour 49a l'Auto continu) : jusqu'au plus simple sous swiftshader, jamais pendant les feux ; captures qualite-plus-beau.png, qualite-plus-simple.png
    ('index.html?course=3&ia=5&circuit=test&test=qualite', 960, 600, None),   # … sans ?qualite, sous un automate, rien ne bouge
    ('index.html?course=3&ia=5&joueur=1&robot=1&circuit=test&niveau=normal&test=retro', 960, 600, None),   # le rétroviseur (tour 49a) : sous le chrono, jamais sur la piste devant, une voiture 20 m derrière s'y voit ; capture retroviseur.png
    ('index.html?course=3&circuit=test&test=manette', 1280, 720, None),   # la manette (tour 38) : une fausse manette conduit un tour, la pause, le menu au stick et à la croix
    ('index.html?course=3&circuit=test&test=tactile', 640, 360, None),   # le téléphone (tactile.js, tour 51k) : écran tactile émulé, GAZ / FREIN, ◀ ▶ sans capteur, le volant par de faux évènements d'orientation, un tour sans clavier ; capture tactile-640.png
    ('index.html?course=3&circuit=test&lang=en&test=tactile', 960, 600, None),   # … en anglais, 960×600 ; capture tactile-960.png
    ('index.html?test=tactile-decouverte', 960, 600, None),   # (tour 52b) de la découverte au podium sans clavier, aux doigts et au volant
    ('index.html?championnat=1&tours=1&robot=1&test=apres-course', 1280, 720, None),   # (tour 53d) après un Grand Prix de carrière : du podium au paddock en 2 clics (« Continuer », « Passer », la une passe seule), l'argent et les points comme avant ; capture apres-podium.png
    ('index.html?championnat=1&tours=1&robot=1&test=apres-course', 640, 360, None),   # … en 640×360 : tout tient
    ('index.html?test=tactile-titre', 640, 360, None),   # (tour 53c, premiere-minute n° 12) l'écran titre simple : au doigt, « ▶ Jouer », « Entre amis » et 🔊 seulement ; capture titre-640-tactile.png
    ('index.html?championnat=1&test=tactile-classement', 640, 360, None),   # (tour 53b) au doigt, un appui sur un classement ouvre la liste entière (20 lignes d'au moins 40 px), un appui sur une ligne ouvre la fiche, Retour referme
    ('index.html?test=titre-simple', 1280, 720, None),   # … au clavier en 1280×720, le titre est inchangé (Apprendre / Aides / Touches) ; capture titre-1280.png
    ('index.html?championnat=1&test=tactile-reglages', 960, 600, None),   # (tour 53f) les réglages du volant : crans, inversé, choix, sauvegarde
    ('index.html?test=tactile-iphone', 960, 600, None),   # … l'autorisation de l'iPhone (« 🎮 Activer le volant »), refusée → ◀ ▶ ; le message « Tourne ton téléphone » en portrait
    ('index.html?deux=1&ia=0&circuit=test&test=manette-deux', 1280, 720, None),   # … deux manettes, une par joueur   # les sensations de conduite (tour 37) : son au premier geste, fumée, étincelles, réglage ; capture sensations.png
    ('index.html?course=3&ia=19&joueur=1&circuit=monzo&domicile=1&test=supporters', 1280, 720, None),   # le Grand Prix à domicile : la caméra de la grille longe d'abord la tribune des supporters ; capture supporters.png   # la réalisation télé (regie.js) : de vraies caméras, l'hélicoptère ; captures tele-monoco.png, tele-helico.png   # … et Monzo de jour : la luminosité de l'image, pour la comparer à la nuit   # le décor dans le vrai jeu : la course de nuit à Singapura, 20 voitures, vue télé ; capture jeu-singapura.png
    ('tests/lieu.html?circuit=monoco&vue=port', 1280, 720, None),
    ('tests/lieu.html?circuit=suzuko&vue=pont', 1280, 720, None),   # le pont de Suzuko (PONT_ACTIF) : une voiture dessus, une dessous ; capture pont-suzuko.png   # Monoco en détail : le port, les bateaux, les façades ; capture monoco.png
    ('tests/lieu.html?circuit=monoco&domicile=1', 1280, 720, None),   # le Grand Prix à domicile : le public aux couleurs du pays, les banderoles ; capture banderoles.png
   # le décor du circuit test (étape 10) avec 20 voitures : appels de dessin, triangles, niveaux de détail ; captures decor-test.png, decor-dessus.png
    ('index.html?test=tournoi', 1280, 720, None),   # le tournoi chrono (tour 26b) : inscription de 3 joueurs → 3 manches (robot ; un abandon) → podium → Rejouer ; captures tournoi.png, tournoi-podium.png
    ('index.html?test=tournoi', 960, 600, None),    # … l'inscription de 8 joueurs tient en 960×600   # le mode 2 joueurs, tour 25b ordre 3 : titre → « Entre amis » → réglages → course à deux (robots) → podium → rivalité → Revanche → Menu ; captures entre-amis.png, deux-reglages.png, rivalite.png
    ('index.html?test=amis', 960, 600, None),
    ('index.html?test=touches', 960, 600, None),   # les touches de chaque joueur à deux (touches.js, tour 44d) : la carte, le rappel, la pause ; captures touches-*.png
    ('index.html?test=touches', 1280, 720, None),    # … en petit : le menu et l'écran avant la course tiennent sans défilement ni débordement   # … la mesure de la 3D dessinée deux fois sur le technique   # le premier lancement : titre → course de découverte (robot) → Bravo → paddock ; captures titre.png, decouverte.png, bravo.png
    # les aides au premier usage (aides.js, étape 11b, Codeur 4) : en course (qualification, feux, arrêt obligatoire en ligne droite, pause) et au paddock
    # (duel, garage, aileron, « Revoir », ancienne sauvegarde) ; captures aide-stand.png, aide-garage.png (et -960)
    ('index.html?course=12&ia=3&joueur=1&robot=1&circuit=test&test=aides-course', 1280, 720, None),
    ('index.html?course=12&ia=3&joueur=1&robot=1&circuit=test&test=aides-course', 960, 600, None),
    ('index.html?championnat=1&test=aides-menus', 1280, 720, None),
    # le nouveau paddock (tour 48a) : le menu, les pages, les deux « Nouvelle carrière » ; captures paddock-<page>-<langue>-<largeur>.png
    ('index.html?championnat=1&gp=5&test=fond&lang=fr', 1280, 720, None),   # l'arrière-plan des menus (tour 49a-2) : la voiture au stand ; capture paddock-fond-1280.png
    ('index.html?championnat=1&gp=3&test=longueurs', 1280, 720, None),   # (tour 53h) 5, 12 ou 18 tours avant chaque Grand Prix de carrière : le choix, sa sauvegarde, la course à 12 tours ; captures longueurs-*.png
    ('index.html?championnat=1&gp=3&test=longueurs', 960, 600, None),
    ('index.html?championnat=1&gp=3&test=longueurs', 640, 360, None),
    ('index.html?championnat=1&gp=5&test=paddock&lang=fr', 1280, 720, None),
    ('index.html?championnat=1&gp=5&test=paddock&lang=en', 1280, 720, None),
    ('index.html?championnat=1&gp=5&test=paddock&lang=fr', 960, 600, None),
    ('index.html?championnat=1&gp=5&test=paddock&lang=en', 960, 600, None),
    ('index.html?championnat=1&gp=5&test=paddock&lang=fr', 640, 360, None),
    ('index.html?championnat=1&gp=5&test=paddock&lang=en', 640, 360, None),
    ('index.html?championnat=1&test=aides-menus', 960, 600, None),
    ('index.html?championnat=1&tours=2&robot=1&test=aides-consigne', 1280, 720, None),   # les aides des contrats et de la consigne d'équipe, dans la page
    ('index.html?championnat=1&tours=2&robot=1&test=aides-consigne', 960, 600, None),
    # le tutoriel guidé (tutoriel.js, étape 11d, Codeur 4) : la liste (titre, pause, paddock), « Passer », chaque leçon réussie par le robot, l'échec sans rien faire
    ('index.html?test=tuto-menu', 1280, 720, None),
    ('index.html?test=tuto-menu', 960, 600, None),
    ('index.html?tutoriel=conduite&course=1&test=tuto', 1280, 720, None),
    ('index.html?tutoriel=conduite&course=1&test=tuto-rien', 960, 600, None),
    ('index.html?tutoriel=freinage&course=0&test=tuto', 1280, 720, None),
    ('index.html?tutoriel=depart&course=1&ia=1&joueur=1&niveau=debutant&test=tuto', 1280, 720, None),
    ('index.html?tutoriel=depassement&course=3&ia=1&joueur=1&niveau=debutant&test=tuto', 1280, 720, None),
    ('index.html?tutoriel=stand&course=2&test=tuto', 960, 600, None),
    ('index.html?tutoriel=pluie&course=3&ia=1&joueur=1&niveau=debutant&meteo=averse&test=tuto', 1280, 720, None),
    ('index.html?tutoriel=visite&championnat=1&test=tuto', 1280, 720, None),
    ('index.html?course=3&circuit=test&niveau=debutant&test=assistance', 1280, 720, None),   # les aides au pilotage (tour 41) : d'office en débutant, le freinage assisté freine avant le virage (placées ici : les tranches de GitHub restent équilibrées)
    ('index.html?course=3&circuit=test&test=assistance', 960, 600, None),                    # … coupées en normal
    ('index.html?tutoriel=visite&championnat=1&test=tuto-quitter', 960, 600, None),   # … passée en cours de route : rien ne reste dans la carrière
    ('index.html?course=3&circuit=test&test=son', 960, 600, None),   # le réglage du son (tour 44) : le pire mélange ne sature pas, le volume par famille, l'onglet caché et la pub coupent
    ('index.html?ia=20&course=1&circuit=test&mesure=1&ips=1', 1280, 720, None),   # la mesure des images par seconde du propriétaire (tour 45) : 20 voitures, caméra de course, « Copier » ; capture mesure.png
    # la personnalisation (tour 48c, Codeur 3) : « Ma voiture » (livrée, numéro, célébration) et la boutique depuis le garage ; les appels de
    # dessin avec et sans livrée ; l'essai d'un skin (seul sur le test, sa célébration, le résumé, « Acheter ») ; captures livree*.png, boutique*.png, essai*.png
    ('index.html?championnat=1&test=livree', 1280, 720, None),   # (deux pages seulement : les tranches de GitHub approchent de leurs 600 s)
    ('index.html?championnat=1&lang=en&test=livree', 960, 600, None),
    ('index.html?course=1&ia=9&joueur=1&circuit=test&test=livree-appels', 1280, 720, None),
    ('index.html?course=1&circuit=test&essai=celebration_feux&robot=1&test=essai', 1280, 720, None),
    # les réglages de la voiture (tour 50b) : depuis le garage, les quatre curseurs, « Réglage conseillé », la sauvegarde, la voiture du joueur
    # et celles des IA réglées au Grand Prix suivant ; tient en 1280×720 et 640×360 ; captures reglages-voiture*.png
    ('index.html?championnat=1&test=reglages-voiture', 1280, 720, None),
    ('index.html?championnat=1&lang=en&test=reglages-voiture', 640, 360, None),
]
# ECRANS_FILTRE=… (pendant le travail, sur le Mac) : seulement les pages dont l'adresse contient ce texte ; GitHub lance toujours tout
if os.environ.get('ECRANS_FILTRE'): PAGES = [x for x in PAGES if os.environ['ECRANS_FILTRE'] in f'{x[0]} {x[1]}']   # (« adresse largeur » : « robot=1 960 »)
# le faux SDK Poki (comme dans tests/sdk.html), posé avant le chargement de la page ?test=sdk : il note chaque appel dans APPELS_SDK (pas « JOURNAL » : c'est le module de la une du journal, journal.js)
FAUX_SDK = """window.APPELS_SDK = []; window.PokiSDK = { init() { APPELS_SDK.push('init'); return Promise.resolve(); }, gameLoadingFinished() { APPELS_SDK.push('gameLoadingFinished'); },
  gameplayStart() { APPELS_SDK.push('gameplayStart'); }, gameplayStop() { APPELS_SDK.push('gameplayStop'); },
  commercialBreak() { APPELS_SDK.push('commercialBreak'); return Promise.resolve(); }, rewardedBreak() { APPELS_SDK.push('rewardedBreak'); return Promise.resolve(true); } };"""
SEP = r'[.,]'   # le séparateur décimal des temps affichés : la virgule en français (texte('virgule')), le point en anglais
POSITION = '() => CAMERA.position'

L, ok, ko = [], 0, 0
def t(nom, cond, detail=''):
    global ok, ko
    if cond: ok += 1; L.append('✔ ' + nom)
    else: ko += 1; L.append('✘ ' + nom + (' — ' + str(detail) if detail else ''))   # str : un détail peut être un nombre ou une liste

def attendre(pg, condition, arg=None, delai=5000):
    # swiftshader rame parfois (une image > 300 ms) : on attend que la condition soit vraie, 5 s au plus
    try: pg.wait_for_function(condition, arg=arg, timeout=delai); return True
    except Exception: return False

JOUEUR = '() => ({ x: JEU.joueur.x, z: JEU.joueur.z, cap: JEU.joueur.cap, u: JEU.joueur.u, d: JEU.joueur.piste.d, herbe: JEU.joueur.surHerbe })'
# la position dessinée est entre l'état d'avant le pas et l'état d'après
INTERPOLE = """() => { const v = JEU.joueur, g = JEU.modele.groupe.position, e = etatAffiche(v, JEU.alpha);
  const entre = (a, b, c) => c >= Math.min(a, b) - 1e-6 && c <= Math.max(a, b) + 1e-6;
  return { ok: Math.abs(g.x - e.x) < 1e-6 && Math.abs(g.z - e.z) < 1e-6 && entre(v.avant.x, v.x, g.x) && entre(v.avant.z, v.z, g.z), alpha: JEU.alpha, avant: v.avant.x, apres: v.x, dessine: g.x }; }"""

def conduite(pg, titre):
    t(f'{titre} : la voiture attend sur la ligne, à l’arrêt', pg.evaluate(JOUEUR)['u'] == 0)
    t(f'{titre} : aucun son avant le premier geste', pg.evaluate('() => !SON.actif'))
    t(f'{titre} : au départ, l’écran de choix (5, 12, 18 tours, essai libre)', pg.evaluate('() => !document.getElementById("choix").classList.contains("cache") && ["choix5","choix12","choix18","choix0"].every(id => document.getElementById(id))'))
    pg.screenshot(path=os.path.join(CAPTURES, 'choix.png'))
    pg.click('#choix5')
    # sur un Mac chargé, le clic peut arriver tard : on attend la course (le compte à rebours, ou déjà le GO s'il a fini)
    t(f'{titre} : choisir « 5 tours » lance le compte à rebours', attendre(pg, '() => JEU.ecran === "course" && JEU.course.nbTours === 5 && (JEU.course.etat === "compte" || JEU.course.etat === "attente")', None, 30000), pg.evaluate('() => [JEU.ecran, JEU.course && JEU.course.etat]'))
    t(f'{titre} : le titre est le nom du jeu, sans « F1 »', pg.evaluate('() => document.title === texte("nomDuJeu") && document.title === "Grand Prix Dynasty"'), pg.evaluate('() => document.title'))
    t(f'{titre} : <html lang> est la langue des textes', pg.evaluate('() => document.documentElement.lang === LANGUE && (LANGUE === "fr" || LANGUE === "en")'), pg.evaluate('() => [document.documentElement.lang, LANGUE]'))
    depart = pg.evaluate(JOUEUR)
    t(f'{titre} : après le compte à rebours, GO', attendre(pg, '() => JEU.course.etat === "attente"', None, 40000), pg.evaluate('() => JEU.course.etat'))
    t(f'{titre} : les bips 3, 2, 1 puis le GO aigu sont demandés, une fois chacun', pg.evaluate('() => SON.historique.join(",")') == 'compte,compte,compte,go', pg.evaluate('() => SON.historique.join(",")'))
    pg.keyboard.down('ArrowUp')
    t(f'{titre} : le premier geste allume le son', attendre(pg, '() => SON.actif'), pg.evaluate('() => SON.etatContexte'))
    t(f'{titre} : ↑ fait avancer la voiture', attendre(pg, '() => JEU.joueur.u > 15', None, 40000), str(pg.evaluate(JOUEUR)))
    i = pg.evaluate(INTERPOLE)
    t(f'{titre} : la voiture est dessinée entre l’état d’avant et l’état d’après', i['ok'], str(i))
    pg.screenshot(path=os.path.join(CAPTURES, 'derriere.png'))
    p1 = pg.evaluate(JOUEUR)
    pg.keyboard.down('ArrowLeft')
    t(f'{titre} : ← fait tourner la voiture à gauche', attendre(pg, 'c => JEU.joueur.cap < c - 0.05', p1['cap'], 20000), f"cap {p1['cap']} → {pg.evaluate(JOUEUR)['cap']}")
    t(f'{titre} : le rapport monte et s’affiche', attendre(pg, '() => Number(document.getElementById("rapport").textContent) >= 2'), pg.evaluate('() => document.getElementById("rapport").textContent'))
    pg.keyboard.up('ArrowLeft'); pg.keyboard.up('ArrowUp')
    p2 = pg.evaluate(JOUEUR)
    pg.keyboard.down('ArrowDown')
    t(f'{titre} : ↓ freine', attendre(pg, 'u => JEU.joueur.u < u * 0.5', p2['u'], 20000), f"{p2['u']} → {pg.evaluate(JOUEUR)['u']}")
    pg.keyboard.up('ArrowDown')
    t(f'{titre} : la voiture a roulé', math.hypot(p2['x'] - depart['x'], p2['z'] - depart['z']) > 10, str(p2))
    # C : derrière → cockpit → télé → derrière
    pg.keyboard.press('KeyC')
    t(f'{titre} : C passe au cockpit', pg.evaluate('() => CAMERA.mode') == 'cockpit')
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'cockpit.png'))
    pg.keyboard.press('KeyC')
    t(f'{titre} : C passe à la télé', pg.evaluate('() => CAMERA.mode') == 'tele')
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'tele.png'))
    pg.keyboard.press('KeyC')
    t(f'{titre} : C revient derrière', pg.evaluate('() => CAMERA.mode') == 'derriere')
    # dans l'herbe, puis Espace
    pg.evaluate('() => { const v = JEU.joueur; const e = 12 - v.piste.d; v.x += v.piste.nx * e; v.z += v.piste.nz * e; v.u = 0; v.v = 0; v.r = 0; }')
    t(f'{titre} : dans l’herbe, « hors piste » s’affiche', attendre(pg, '() => JEU.joueur.surHerbe && !document.getElementById("horsPiste").classList.contains("cache")'), str(pg.evaluate(JOUEUR)))
    pg.keyboard.press('Space')
    t(f'{titre} : Espace remet la voiture au centre de la piste, à l’arrêt', attendre(pg, '() => Math.abs(JEU.joueur.piste.d) < 0.05 && JEU.joueur.u === 0 && !JEU.joueur.surHerbe'), str(pg.evaluate(JOUEUR)))
    pg.keyboard.press('KeyM')
    t(f'{titre} : M coupe le son', pg.evaluate('() => SON.muet && document.getElementById("boutonSon").textContent === "🔇"'))
    pg.keyboard.press('KeyM')
    t(f'{titre} : M le remet', pg.evaluate('() => !SON.muet && document.getElementById("boutonSon").textContent === "🔊"'))
    pg.click('#boutonSon')
    t(f'{titre} : le bouton 🔊 coupe le son', pg.evaluate('() => SON.muet'))
    pg.click('#boutonSon')
    t(f'{titre} : le bouton ne garde pas le focus (Espace ne le clique pas)', pg.evaluate('() => document.activeElement !== document.getElementById("boutonSon") && !SON.muet'))
    # Échap : la pause arrête la physique
    pg.keyboard.press('Escape')
    n1 = pg.evaluate('() => JEU.pas'); pg.wait_for_timeout(600); n2 = pg.evaluate('() => JEU.pas')
    t(f'{titre} : Échap met en pause et la physique s’arrête', pg.evaluate('() => JEU.ecran') == 'pause' and n1 == n2, f'{n1} → {n2}')
    pg.click('#boutonReprendre')
    t(f'{titre} : « Reprendre » relance la physique', attendre(pg, 'n => JEU.pas > n', n2) and pg.evaluate('() => JEU.ecran') == 'course')
    t(f'{titre} : la vitesse s’affiche en km/h', bool(re.fullmatch(r'\d+', pg.evaluate('() => document.getElementById("vitesse").textContent'))))

# le panneau ?reglages=1 (tour 47c) : chaque curseur a un nom lisible en français et en anglais (et le nom du code en petit),
# rangé dans un thème ; rien n'est coupé, et le bouton « Copier » est entier et visible
PANNEAU_MESURE = """() => {
  const p = document.getElementById('reglages'), P = p.getBoundingClientRect(), L = p.querySelector('.reglagesListe').getBoundingClientRect();
  const dedans = (r, c) => r.width > 0 && r.height > 0 && r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1;
  const ecran = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const coupes = [];
  const boutons = [...p.querySelectorAll('button')];
  for (const b of boutons) {
    const B = b.getBoundingClientRect();
    if (!dedans(B, P) || !dedans(B, ecran)) coupes.push(b.textContent + ' : bouton hors du panneau ou de l’écran');
    if (b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1) coupes.push(b.textContent + ' : texte du bouton coupé ' + [b.scrollWidth, b.clientWidth, b.scrollHeight, b.clientHeight]);
    if (document.elementFromPoint(B.left + B.width / 2, B.top + B.height / 2) !== b) coupes.push(b.textContent + ' : bouton caché par autre chose');
  }
  if (!dedans(P, ecran)) coupes.push('panneau hors de l’écran');
  if (p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1) coupes.push('le panneau déborde');
  for (const e of p.querySelectorAll('h2, h3, .reglageNom, .reglageCode, output'))
    if (e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > L.right + 1) coupes.push('texte coupé : ' + e.textContent);
  return { coupes, bouton: boutons[0].textContent, boutons: boutons.length };
}"""

def reglages_panneau(pg, titre):
    infos = pg.evaluate("""() => PANNEAU_REGLAGES.liste().map(c => {
      const k = document.querySelector(`#reglages input[data-texte="${c.texte}"]`), l = k && k.closest('label');
      return { ...c, en: TEXTES.en[c.texte], fr: TEXTES.fr[c.texte], affiche: l && l.querySelector('.reglageNom').textContent,
        code_affiche: l && l.querySelector('.reglageCode').textContent, theme_affiche: k && k.closest('section').dataset.theme,
        titre_theme: TEXTES.en['reglagesTheme_' + c.theme] && TEXTES.fr['reglagesTheme_' + c.theme] ? 'ok' : null };
    })""")
    langue = pg.evaluate('() => LANGUE')
    sans = [c['texte'] for c in infos if not (isinstance(c['en'], str) and c['en'].strip() and isinstance(c['fr'], str) and c['fr'].strip()) or c['en'] == c['cle'] or c['fr'] == c['cle']]
    t(f'{titre} : chaque curseur ({len(infos)}) a un nom lisible en français et en anglais (textes.js, reglage_…), pas le nom du code', len(infos) >= 30 and not sans, ', '.join(sans))
    # (tour 48b) le curseur du pneu drift est caché avec lui (PNEU_DRIFT faux) : absent du panneau, ses textes gardés pour le drift rallumé
    drift = pg.evaluate('() => REGLAGES.PNEU_DRIFT')
    cache = lambda c: c['cle'] == 'VOITURE_VIVANTE' and not drift
    mal = [c['texte'] for c in infos if (c['affiche'] is not None if cache(c) else (c['affiche'] != c[langue] or c['code_affiche'] != c['code'] or c['theme_affiche'] != c['theme'] or not c['titre_theme']))]
    t(f'{titre} : chaque curseur montre son nom en {langue}, le nom du code en petit, et il est dans son thème (titre fr et en) ; celui du pneu drift caché avec lui', not mal, ', '.join(mal))
    themes = pg.evaluate('() => [...document.querySelectorAll("#reglages section")].map(s => [s.dataset.theme, s.querySelector("h3").textContent, s.querySelectorAll("input").length])')
    t(f'{titre} : les curseurs sont rangés par thème, aucun thème vide', len(themes) >= 5 and all(n > 0 and h for _, h, n in themes), str(themes))
    taille = pg.viewport_size
    for l, h in ([(taille['width'], taille['height'])] + ([(1280, 720)] if taille['width'] == 960 else [])):
        pg.set_viewport_size({'width': l, 'height': h}); pg.wait_for_timeout(200)
        m = pg.evaluate(PANNEAU_MESURE)
        t(f'{titre} : en {l}×{h}, rien n’est coupé dans le panneau, le bouton « {m["bouton"]} » (et les {m["boutons"]} boutons) entier et visible', not m['coupes'], ' ; '.join(m['coupes'])[:600])
    pg.set_viewport_size(taille); pg.wait_for_timeout(200)

def reglages(pg, titre):
    # un curseur bouge : REGLAGES change tout de suite, et « copier » donne la ligne pour donnees.js
    pg.evaluate("""() => { const c = document.querySelector('#reglages input[data-cle="ADHERENCE"]'); c.value = 2.2; c.dispatchEvent(new Event('input')); }""")
    t(f'{titre} : le curseur ADHERENCE change REGLAGES.ADHERENCE', pg.evaluate('() => REGLAGES.ADHERENCE') == 2.2, str(pg.evaluate('() => REGLAGES.ADHERENCE')))
    pg.evaluate("""() => { const c = document.querySelector('#reglages input[data-cle="CAMERA_DERRIERE.0"]'); c.value = 6; c.dispatchEvent(new Event('input')); }""")
    t(f'{titre} : un réglage dans un tableau (CAMERA_DERRIERE[0]) change aussi', pg.evaluate('() => REGLAGES.CAMERA_DERRIERE[0]') == 6)
    tri = pg.evaluate('() => VOITURE3D.triangles(JEU.modele)')
    pg.evaluate("""() => { const c = document.querySelector('#reglages input[data-cle="HALO_EPAISSEUR"]'); c.value = 0.06; c.dispatchEvent(new Event('input')); }""")
    t(f'{titre} : l’épaisseur du halo refait la voiture (mêmes triangles, mêmes appels)', pg.evaluate('() => REGLAGES.HALO_EPAISSEUR') == 0.06 and pg.evaluate('() => VOITURE3D.triangles(JEU.modele)') == tri and pg.evaluate('() => VOITURE3D.appels(JEU.modele)') <= 7)
    pg.click('#reglages button')
    copie = pg.evaluate('() => document.querySelector("#reglages pre").textContent')
    t(f'{titre} : « copier » donne les valeurs changées, prêtes pour donnees.js', 'ADHERENCE: 2.2,' in copie and 'CAMERA_DERRIERE: [6, 2.4],' in copie and 'APPUI' not in copie, repr(copie))
    # les flèches conduisent toujours après avoir touché le panneau
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    pg.keyboard.down('ArrowUp')
    t(f'{titre} : après le panneau, ↑ fait toujours rouler', attendre(pg, '() => JEU.joueur.u > 5', None, 20000))
    pg.keyboard.up('ArrowUp')

def course_robot(pg, titre, page):
    # le robot conduit : on attend le GO, puis on avance la physique sans affichage (BOUCLE.simuler)
    # le compte à rebours est vérifié ailleurs ; ici on le raccourcit (sous swiftshader, 3 s de jeu peuvent prendre 30 s)
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    t(f'{titre} : le robot part après le compte à rebours', attendre(pg, '() => JEU.course.etat === "course"', None, 20000), pg.evaluate('() => JEU.course.etat'))
    CASES = '() => ["hudS1", "hudS2", "hudS3"].map(id => document.getElementById(id).className).join(",")'
    t(f'{titre} : au début du tour, les 3 cases de secteur sont grises', attendre(pg, '() => JEU.course.etat === "course" && !/^0:00[.,]000$/.test(document.getElementById("hudChrono").textContent)', None, 20000)
      and pg.evaluate(CASES) == 'secteur,secteur,secteur' and pg.evaluate('() => document.getElementById("hudPrecedent").classList.contains("cache")'), pg.evaluate(CASES))
    pg.evaluate('() => BOUCLE.simuler(25)')
    t(f'{titre} : après le secteur 1, S1 se colore et S2, S3 restent grises', attendre(pg, 'c => /^secteur (violet|vert|jaune),secteur,secteur$/.test(eval(c)())', CASES), pg.evaluate(CASES))
    pg.evaluate('() => BOUCLE.simuler(130)')
    t(f'{titre} : en course, Tour n/N, chrono, tour précédent et secteurs du tour en cours', attendre(pg, '() => /^(Tour|Lap) 3 \\/ 5$/.test(document.getElementById("hudTour").textContent) && /violet|vert|jaune/.test(document.getElementById("hudS1").className) && document.getElementById("hudS3").className === "secteur" && !document.getElementById("hudPrecedent").classList.contains("cache")'),
      pg.evaluate('() => [document.getElementById("hudTour").textContent, document.getElementById("hudPrecedent").textContent]') + [pg.evaluate(CASES)])
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'course.png'))
    pg.evaluate('() => BOUCLE.simuler(245)')
    t(f'{titre} : la course finie, l’écran de fin', attendre(pg, '() => !document.getElementById("fin").classList.contains("cache")'), pg.evaluate('() => JEU.course.etat'))
    fin = pg.evaluate('() => ({ tours: document.querySelectorAll("#finTours li").length, total: document.getElementById("finTotal").textContent, record: document.getElementById("finRecord").textContent, meilleur: JEU.course.meilleurTour, garde: SAUVEGARDE.record(5) })')
    t(f'{titre} : l’écran de fin montre les 5 tours, le total et le nouveau record', fin['tours'] == 5 and re.search(r'\d:\d\d' + SEP + r'\d{3}', fin['total']) and fin['record'] != '', str(fin))
    t(f'{titre} : le meilleur tour est gardé comme record des 5 tours', fin['garde'] == fin['meilleur'], str(fin))
    arret = pg.evaluate('() => ({ u: JEU.joueur.u, arret: JEU.arretApres, bandeau: document.getElementById("hudCourse").classList.contains("cache"), sons: SON.historique.slice(-1)[0] })')
    t(f'{titre} : après l’arrivée, la voiture s’arrête seule en moins de 6 s', arret['u'] == 0 and arret['arret'] is not None and arret['arret'] < 6, str(arret))
    t(f'{titre} : le bandeau de course est caché sous l’écran de fin', arret['bandeau'], str(arret))
    t(f'{titre} : le son d’arrivée est demandé', arret['sons'] == 'arrivee', str(arret))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'fin.png'))
    # après rechargement, le record est toujours là (sur l'écran de choix)
    pg.goto('file://' + RACINE + '/index.html?seul=1'); pg.wait_for_timeout(1500)   # (la page nue est maintenant l'écran titre : l'écran de choix est ?seul=1)
    rec = pg.evaluate('() => document.getElementById("record5").textContent')
    t(f'{titre} : après rechargement, le record des 5 tours est affiché', INTERFACE_TEMPS(fin['meilleur'], pg.evaluate('() => texte("virgule")')) in rec, repr(rec))
    pg.click('#choix0')
    t(f'{titre} : l’essai libre n’a pas de nombre de tours', pg.evaluate('() => JEU.course.nbTours === 0 && !/\\//.test(document.getElementById("hudTour").textContent)'))

def course_ia(pg, titre):
    # l'IA conduit la voiture du joueur sur le circuit technique : elle part, fait au moins un tour, sans faute
    # la trajectoire se calcule en fond, découpée en tranches : la page ne doit jamais rester bloquée plus de 300 ms
    pret = attendre(pg, '() => JEU.trajectoire !== null', None, 120000)
    t(f'{titre} : le circuit technique est chargé et la trajectoire de l’IA calculée', pret and pg.evaluate('() => CIRCUIT.nom === "Technique" && JEU.ia && JEU.trajectoire.vitesse.length === CIRCUIT.nb'))
    # ce que bloque le calcul : chaque tranche est chronométrée par le jeu. Les autres tâches longues de la page
    # (le premier dessin 3D en logiciel sous swiftshader) existent aussi sans ?ia=1 : elles sont seulement affichées
    calcul = pg.evaluate('() => JEU.calculTrajectoire')
    longues = pg.evaluate('() => window.__longues')
    L.append(f"  (?ia=1 : trajectoire calculée en {calcul['tranches']} tranches, la plus longue {calcul['plusLongue']:.0f} ms, en {(calcul['fin'] - calcul['debut']) / 1000:.1f} s ; tâches de plus de 50 ms dans la page : {sorted(round(x) for x in longues)[-6:]} ms)")
    t(f'{titre} : le calcul de la trajectoire ne bloque jamais la page plus de 300 ms d’affilée', calcul['tranches'] > 10 and calcul['plusLongue'] < 300, str(calcul))
    tour = pg.evaluate('''() => { const c = creerCourse(CIRCUIT, 5), v = creerVoiture(CIRCUIT); placerAuDepart(v, CIRCUIT);
      const pilote = creerPilote(JEU.carte);
      for (let k = 0; k < 600 * 120 && c.etat !== 'finie'; k++) { appliquerCommandes(v, courseAutorise(c) ? piloterIA(pilote, v, [], 1 / 120) : { gaz: 0, frein: 0, direction: 0 }); pasVoiture(v, CIRCUIT, 1 / 120); majCourse(c, v, 1 / 120); }
      return c.meilleurTour; }''')
    t(f'{titre} : la carte calculée en fond est la même (le pilote neutre seul fait le même meilleur tour que dans test.html, 55,42 s ; 55,26 s avant le tour 31 : la courbure des épingles mesurée aussi de près, ia.js)', tour is not None and abs(tour - 55.4167) < 0.006, str(tour))
    t(f'{titre} : le pilote IA de ?ia=1 est prêt', pg.evaluate('() => JEU.pilote !== null && JEU.carte !== null'))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    t(f'{titre} : l’IA part après le compte à rebours', attendre(pg, '() => JEU.course.etat === "course" && JEU.joueur.u > 1', None, 20000), pg.evaluate('() => JEU.course.etat'))
    pg.evaluate('() => BOUCLE.simuler(75)')
    etat = pg.evaluate('() => ({ tours: JEU.course.tours.map(t => t.temps), progression: JEU.course.progression, contacts: JEU.joueur.contactsBarriere, penalites: JEU.course.penalites, kmh: JEU.joueur.u * 3.6 })')
    t(f'{titre} : en 75 s, l’IA a fini au moins un tour, sans barrière ni pénalité', len(etat['tours']) >= 1 and etat['contacts'] == 0 and etat['penalites'] == 0 and etat['kmh'] > 30, str(etat))
    if etat['tours']: L.append(f"  (?ia=1 sur le circuit technique : premier tour {etat['tours'][0]:.2f} s, départ arrêté)")

def course_ia10(pg, titre):
    # 10 IA dans la page : chacune sa couleur, la caméra en suit une, Tab passe à la suivante
    t(f'{titre} : 10 IA en course, 10 modèles de couleurs différentes', pg.evaluate('() => JEU.plateau.pilotes.length === 10 && JEU.modeles.length === 10 && new Set(JEU.modeles.map(m => m.couleur)).size === 10'))
    t(f'{titre} : la carte se calcule en fond, puis chaque IA reçoit son pilote', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.every(p => p.pilote !== null)', None, 120000))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    t(f'{titre} : les 10 partent après le compte à rebours', attendre(pg, '() => JEU.plateau.pilotes.every(p => p.v.u > 1)', None, 30000), pg.evaluate('() => JEU.plateau.pilotes.map(p => p.v.u.toFixed(1)).join(" ")'))
    pg.evaluate('() => BOUCLE.simuler(30)')
    etat = pg.evaluate('() => JEU.plateau.pilotes.map(p => ({ progression: Math.round(p.course.progression), chocs: p.v.chocs, barriere: p.v.contactsBarriere }))')
    t(f'{titre} : en 30 s, les 10 avancent (plus de 500 m chacune), sans choc à plus de 5 m/s ni barrière', all(e['progression'] > 500 and all(c <= 5 for c in e['chocs']) and e['barriere'] == 0 for e in etat), str(etat))
    L.append(f"  (?ia=10 : après 30 s, de {min(e['progression'] for e in etat)} à {max(e['progression'] for e in etat)} m parcourus, {sum(len(e['chocs']) for e in etat) // 2} contacts)")
    avant = pg.evaluate('() => JEU.suivie')
    pg.keyboard.press('Tab')
    t(f'{titre} : Tab : la caméra suit la voiture suivante', pg.evaluate('s => JEU.suivie === (s + 1) % 10 && JEU.joueur === JEU.plateau.pilotes[JEU.suivie].v', avant))
    attendre(pg, '() => /i\/s/.test(document.getElementById("ips").textContent)')
    ips = pg.evaluate('() => document.getElementById("ips").textContent.split(String.fromCharCode(10))[0]')
    L.append(f'  (?ia=10 sous swiftshader : {ips})')

# avant une course contre les IA, l'écran de qualification : on le passe (le joueur part dernier)
def passer_qualif(pg, titre):
    t(f'{titre} : avant la course, l’écran de qualification (« Faire mon tour » / « Passer »)', attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix" && !document.getElementById("qualif").classList.contains("cache")', None, 10000), str(pg.evaluate('() => [JEU.ecran, JEU.qualif]')))
    pg.click('#boutonQualifPasser')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)   # (la carte des IA d'abord, s'il le faut)
    pg.click('#boutonQualifCourse')
    attendre(pg, '() => JEU.ecran === "course"', None, 10000)

def qualif(pg, titre):
    # le robot fait le tour de qualification : il part à la place que donne son temps ; « Passer » le met dernier
    t(f'{titre} : l’écran de qualification, les IA sur la grille', attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif.etat === "choix" && JEU.plateau.pilotes.length === 6', None, 10000), str(pg.evaluate('() => [JEU.ecran, JEU.qualif]')))
    t(f'{titre} : la carte se calcule en fond', attendre(pg, '() => JEU.plateau.carte !== null', None, 180000))
    pg.click('#boutonQualifTour')
    t(f'{titre} : « Faire mon tour » : sa voiture du tour, seule, 250 m avant la ligne ; le chrono s’affiche ; les IA ne bougent pas',
      attendre(pg, '() => JEU.qualif.etat === "tour" && JEU.joueur === JEU.qualif.v && JEU.joueur !== JEU.plateau.pilotes[5].v && !document.getElementById("hudCourse").classList.contains("cache") && document.getElementById("classement").classList.contains("cache")'),
      str(pg.evaluate('() => [JEU.qualif.etat, JEU.joueur.piste.s]')))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.qualif.etat') == 'resultat': break
        pg.wait_for_timeout(50)
    r = pg.evaluate('''() => { const e = JEU.plateau, g = e.grille, k = g.findIndex(x => e.pilotes[x.numero - 1].humain); return { etat: JEU.qualif.etat, temps: JEU.qualif.q.temps, valide: JEU.qualif.q.valide,
      place: k + 1, depart: e.pilotes[5].depart, attendu: placesGrille(CIRCUIT, 6)[k].s - CIRCUIT.longueur, texte: document.getElementById("qualifTexte").textContent, ordre: g.map(x => x.qualif), ia: JEU.plateau.pilotes.slice(0, 5).every(p => p.v.u === 0) }; }''')
    t(f'{titre} : le tour fini : un temps, une place dans la grille selon ce temps, la voiture posée à cette place', r['etat'] == 'resultat' and r['valide'] and 40 < r['temps'] < 80 and abs(r['depart'] - r['attendu']) < 1e-6 and r['ia']
      and all(r['ordre'][i] <= r['ordre'][i + 1] for i in range(len(r['ordre']) - 1)), str(r))
    t(f'{titre} : le résultat affiché : « P{r["place"]} / 6 — temps » et l’écart à la pole', re.match(rf'^P{r["place"]} / 6 — \d:\d\d{SEP}\d\d\d · ', r['texte']) is not None, repr(r['texte']))
    L.append(f"  (qualification du robot : {r['temps']:.2f} s, P{r['place']} / 6)")
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, 'qualif.png'))
    pg.click('#boutonQualifCourse')
    t(f'{titre} : « Départ de la course » : la course, sa voiture de course suivie, les feux', attendre(pg, '() => JEU.ecran === "course" && JEU.qualif === null && JEU.joueur === JEU.plateau.pilotes[5].v && JEU.course.feux', None, 10000))
    enregistreur(pg, titre)
    # une nouvelle page : « Passer » = dernier
    pg.reload()
    t(f'{titre} : « Passer (départ dernier) » : P6 / 6, la voiture dernière sur la grille', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif" && JEU.qualif.etat === "choix"', None, 60000)
      and (pg.click('#boutonQualifPasser') or True) and attendre(pg, '() => JEU.qualif.etat === "resultat"', None, 180000)
      and pg.evaluate('() => { const e = JEU.plateau; return e.grille[5].numero === 6 && e.pilotes[5].depart === Math.min(...e.pilotes.map(p => p.depart)) && /dernier/.test(document.getElementById("qualifTexte").textContent); }'),
      pg.evaluate('() => [JEU.qualif && JEU.qualif.etat, document.getElementById("qualifTexte").textContent]'))

# l'enregistreur (enregistreur.js, étape 13), branché dans la page sans rien afficher : la course d'un tour (5 IA + le robot)
# est enregistrée à chaque pas ; relue à sa dernière image, elle redonne les positions de toutes les voitures
def enregistreur(pg, titre):
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    pg.evaluate('() => BOUCLE.simuler(20)')
    # on avance pas par pas jusqu'à la prochaine image, puis on compare la relecture à cet instant avec les vraies positions
    RELU = '''() => { const r = JEU.enregistreur, enr = r.enr, n = enr.nbImages; let k = 0; while (enr.nbImages === n && k++ < 24) BOUCLE.simuler(1 / 120);
      const lu = enr.lire(enr.fin), ecart = Math.max(...JEU.plateau.pilotes.map((p, i) => Math.hypot(lu[i].x - p.v.x, lu[i].z - p.v.z)));
      return { nouvelle: enr.nbImages === n + 1, ecart, images: enr.nbImages, octets: enr.octets(), temps: JEU.plateau.temps, parti: r.parti, pas: r.pas, ms: r.ms, arrivees: r.arrivees.size }; }'''
    r1 = pg.evaluate(RELU)
    t(f'{titre} : en course, l’enregistrement relu à sa dernière image redonne les 6 positions à moins d’1 cm ; le GO est noté', r1['nouvelle'] and r1['ecart'] < 0.01 and r1['parti'] and r1['pas'] > 2000, str(r1))
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.plateau.arrives >= 1 || JEU.ecran !== "course"'): break
    r2 = pg.evaluate(RELU)
    t(f'{titre} : à la fin (la première voiture arrivée), relu : écart < 1 cm, l’arrivée notée', r2['nouvelle'] and r2['ecart'] < 0.01 and r2['images'] > r1['images'] and r2['arrivees'] >= 1, str(r2))
    L.append(f"  (enregistreur, 6 voitures, 1 tour : {r2['images']} images, {r2['octets'] / 1024:.0f} Ko, {r2['ms'] / max(1, r2['pas']) * 1000:.0f} µs par pas en moyenne)")

# le fantôme du meilleur tour (fantome.js) : deux qualifications de suite par le robot. La première n'a pas de fantôme et
# devient le record du circuit (sauvegardé, compact) ; la deuxième, par un robot plus prudent, roule contre le fantôme
# (voiture transparente, écart en direct en rouge) et ne remplace pas le record. Puis l'option « masqué » et la course sans fantôme
# (tour 49b) les touches au choix (clavier.js) : depuis « Réglages » du paddock, l'écran (3 colonnes, tient en 960×600) ; le gaz sur I ;
# I pour le frein est refusé (déjà pris par le gaz) ; Échap annule ; puis dans une course, I accélère et ↑ / W ne font plus rien ;
# « Par défaut » remet tout (la sauvegarde revient à null)
def clavier_ecran(pg, titre, l, h):
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    pg.evaluate('() => INTERFACE.pagePaddock("reglages")')
    pg.click('#boutonTouchesPaddock')
    attendre(pg, '() => JEU.ecran === "touches"', None, 5000)
    e = pg.evaluate('''() => { const b = [...document.querySelectorAll("#touchesGroupes button")].map(x => x.getBoundingClientRect());
      return { n: b.length, dedans: b.every(x => x.left >= 0 && x.top >= 0 && x.right <= innerWidth && x.bottom <= innerHeight), defile: [document.documentElement.scrollHeight, innerHeight],
        gaz: document.querySelector('#touchesGroupes button[data-groupe=seul][data-action=gaz]').textContent }; }''')
    t(f'{titre} : « ⌨ Touches » (Réglages) : chaque commande (course : 7, joueur 1 : 5, joueur 2 : 5) avec sa touche d’aujourd’hui, tout dans l’écran sans défilement', e['n'] == 17 and e['dedans'] and e['defile'][0] <= e['defile'][1] + 2 and '↑' in e['gaz'], str(e))
    pg.click('#touchesGroupes button[data-groupe=seul][data-action=gaz]'); pg.keyboard.press('KeyI')
    a = pg.evaluate('() => [JEU.ecran, document.querySelector("#touchesGroupes button[data-groupe=seul][data-action=gaz]").textContent, (SAUVEGARDE.touches() || {}).seul && SAUVEGARDE.touches().seul.gaz]')
    t(f'{titre} : un clic sur « Accélérer », puis I : le gaz est sur I, gardé dans la sauvegarde', a[0] == 'touches' and a[1] == 'I' and a[2] == ['KeyI'], str(a))
    pg.click('#touchesGroupes button[data-groupe=seul][data-action=frein]'); pg.keyboard.press('KeyI')
    b = pg.evaluate('() => [JEU.ecran, document.getElementById("touchesMessage").textContent, texte("touchesAction_gaz"), SAUVEGARDE.touches().seul.frein]')
    t(f'{titre} : I pour freiner est refusé : la touche est déjà prise, le message dit par quoi (« Accélérer »), le frein ne change pas', b[0] == 'touches' and b[2] in b[1] and b[3] == ['ArrowDown', 'KeyS'], str(b))
    pg.click('#touchesGroupes button[data-groupe=seul][data-action=camera]'); pg.keyboard.press('Escape')
    c = pg.evaluate('() => [JEU.ecran, SAUVEGARDE.touches().seul.camera]')
    t(f'{titre} : Échap pendant l’attente annule (rien ne change, pas de pause, on reste sur l’écran)', c == ['touches', ['KeyC']], str(c))
    pg.screenshot(path=os.path.join(CAPTURES, 'touches.png'))
    pg.goto('file://' + RACINE + '/index.html?course=0'); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "course"', None, 60000)
    r = []
    for k in ('KeyI', 'ArrowUp', 'KeyW'):
        pg.keyboard.down(k); r.append(pg.evaluate('() => JEU.cibles.gaz')); pg.keyboard.up(k)
    t(f'{titre} : dans une course, I accélère ; ↑ et W (Z en AZERTY) ne font plus rien', r == [1, 0, 0], str(r))
    pg.goto('file://' + RACINE + '/index.html?championnat=1&tours=1'); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    pg.evaluate('() => INTERFACE.pagePaddock("reglages")'); pg.click('#boutonTouchesPaddock'); attendre(pg, '() => JEU.ecran === "touches"', None, 5000)
    pg.click('#boutonTouchesDefaut')
    d = pg.evaluate('() => [SAUVEGARDE.touches(), document.querySelector("#touchesGroupes button[data-groupe=seul][data-action=gaz]").textContent]')
    pg.click('#boutonTouchesRetour')
    t(f'{titre} : « Par défaut » remet tout (la sauvegarde revient à celles de départ), « Retour » ramène au paddock', d[0] is None and '↑' in d[1] and pg.evaluate('() => JEU.ecran === "championnat"'), str(d))

# (tour 50c) « ⌨ Touches » aussi sur l'écran titre et dans le menu pause, en 640×360 (le téléphone couché, l'écran le plus petit) :
# chaque bouton de l'écran dans l'image, sans défilement ; depuis la pause, la course reste arrêtée pendant le choix, Échap annule le
# choix sans fermer la pause, puis ramène au menu pause ; la touche choisie conduit dès la reprise
DEDANS_JS = '''sel => { const bs = [...document.querySelectorAll(sel)].filter(b => b.offsetParent !== null).map(b => b.getBoundingClientRect());
  return { n: bs.length, dedans: bs.every(r => r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1),
    defile: document.documentElement.scrollHeight <= innerHeight + 2 && document.documentElement.scrollWidth <= innerWidth + 2,
    recouvre: bs.some((a, i) => bs.some((b, j) => j > i && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1)) }; }'''
def clavier_titre(pg, titre, l, h):
    if not attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "titre"', None, 60000):
        t(f'{titre} : l’écran titre', False, str(pg.evaluate('() => typeof JEU !== "undefined" && JEU.ecran'))); return
    pg.evaluate('() => { REGLAGES.TITRE_SIMPLE = false; document.body.classList.remove("titreSimple"); }')   # (tour 53c : sous 700 px le titre n'a plus la rangée ; on la remet pour essayer « ⌨ Touches » depuis le titre)
    d = pg.evaluate(DEDANS_JS, '#titre button')
    vu = pg.evaluate('() => { const b = document.getElementById("boutonTouchesTitre"); return !!b && b.offsetParent !== null && b.textContent === texte("touchesBouton"); }')
    t(f'{titre} : l’écran titre : « ⌨ Touches », et chaque bouton dans l’écran, sans défilement ni recouvrement', vu and d['dedans'] and d['defile'] and not d['recouvre'], str([vu, d]))
    pg.click('#boutonTouchesTitre')
    attendre(pg, '() => JEU.ecran === "touches"', None, 5000)
    d = pg.evaluate(DEDANS_JS, '#touches button')
    t(f'{titre} : « ⌨ Touches » depuis le titre : les 17 commandes, « Par défaut » et « Retour » dans l’écran, sans défilement ni recouvrement', d['n'] == 19 and d['dedans'] and d['defile'] and not d['recouvre'], str(d))
    pg.click('#touchesGroupes button[data-groupe=seul][data-action=gaz]'); pg.keyboard.press('KeyI')
    a = pg.evaluate('() => [JEU.ecran, (SAUVEGARDE.touches() || {}).seul && SAUVEGARDE.touches().seul.gaz]')
    pg.screenshot(path=os.path.join(CAPTURES, f'touches-titre-{l}.png'))
    pg.keyboard.press('Escape')
    e = pg.evaluate('() => [JEU.ecran, !document.getElementById("titre").classList.contains("cache")]')
    t(f'{titre} : le gaz mis sur I depuis le titre (gardé), puis Échap ramène à l’écran titre', a == ['touches', ['KeyI']] and e == ['titre', True], str([a, e]))

def clavier_pause(pg, titre, l, h):
    if not attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "course" && !!JEU.course', None, 120000):   # (?course=0 : une course seule, sans plateau d'IA)
        t(f'{titre} : la course', False, str(pg.evaluate('() => typeof JEU !== "undefined" && JEU.ecran'))); return
    pg.keyboard.press('Escape')
    attendre(pg, '() => JEU.ecran === "pause"', None, 5000)
    d = pg.evaluate(DEDANS_JS, '#pause button')
    vu = pg.evaluate('() => { const b = document.getElementById("boutonTouchesPause"); return !!b && b.offsetParent !== null && b.textContent === texte("touchesBouton"); }')
    pg.screenshot(path=os.path.join(CAPTURES, f'pause-{l}.png'))
    t(f'{titre} : le menu pause : « ⌨ Touches », et chaque bouton dans l’écran, sans défilement ni recouvrement', vu and d['dedans'] and d['defile'] and not d['recouvre'], str([vu, d]))
    pg.click('#boutonTouchesPause')
    ETAT = '() => ({ ecran: JEU.ecran, touches: !document.getElementById("touches").classList.contains("cache"), pause: !document.getElementById("pause").classList.contains("cache"), pas: JEU.pas, gaz: (SAUVEGARDE.touches() || {}).seul && SAUVEGARDE.touches().seul.gaz })'
    e0 = pg.evaluate(ETAT)
    d = pg.evaluate(DEDANS_JS, '#touches button')
    t(f'{titre} : « ⌨ Touches » depuis la pause : les 17 commandes, « Par défaut » et « Retour » dans l’écran, sans défilement ni recouvrement ; la course reste en pause', e0['ecran'] == 'pause' and e0['touches'] and not e0['pause'] and d['n'] == 19 and d['dedans'] and d['defile'] and not d['recouvre'], str([e0, d]))
    pg.click('#touchesGroupes button[data-groupe=seul][data-action=gaz]'); pg.keyboard.press('Escape')
    e1 = pg.evaluate(ETAT)
    pg.click('#touchesGroupes button[data-groupe=seul][data-action=gaz]'); pg.keyboard.press('KeyI')
    pg.wait_for_timeout(500)   # (des images passent : la physique ne doit pas repartir)
    e2 = pg.evaluate(ETAT)
    pg.screenshot(path=os.path.join(CAPTURES, f'touches-pause-{l}.png'))
    t(f'{titre} : pendant le choix, Échap annule le choix sans fermer la pause (l’écran des touches reste) ; I pour le gaz est gardé ; la course n’a pas bougé',
      e1['ecran'] == 'pause' and e1['touches'] and e2['ecran'] == 'pause' and e2['touches'] and e2['gaz'] == ['KeyI'] and e2['pas'] == e0['pas'], str([e0, e1, e2]))
    pg.keyboard.press('Escape')
    e3 = pg.evaluate(ETAT)
    pg.keyboard.press('Escape')
    pg.keyboard.down('KeyI'); g = pg.evaluate('() => [JEU.ecran, JEU.cibles.gaz]'); pg.keyboard.up('KeyI')
    t(f'{titre} : Échap ramène au menu pause (toujours en pause), puis Échap reprend la course, et I accélère', e3['ecran'] == 'pause' and e3['pause'] and not e3['touches'] and g == ['course', 1], str([e3, g]))

# (tour 49b) le défi du fantôme entre amis (defi.js) : le robot fait sa qualification, « 📋 Défier un ami » donne le code ; « Entre amis »
# → « Relever un défi » refuse un code abîmé (le message) et accepte le bon ; la page ?defi=1 : le même tour du robot contre ce fantôme
# (visible, l'écart en direct) ; à l'arrivée, l'écart au fantôme vaut 0 (le même robot), « Renvoyer mon code », le meilleur gardé
def texte_ok(x): return bool(x) and '{' not in x and 'undefined' not in x and 'null' not in x

# (tour 51b) le défi après une course seule : le robot fait 3 tours seul ; le premier (départ arrêté) n'est pas gardé, le meilleur des deux autres l'est ;
# « 📋 Défier un ami » à l'arrivée donne un lien et un code qui se décodent, au temps du meilleur tour ; le record du circuit est le même tour
# (tour 51l) le robot (?robot=1) et l'IA (?ia=1) ne font plus de défi : un tour que le joueur n'a pas conduit ne devient ni son fantôme ni son code.
# Pour la suite du test, le robot conduit « comme le joueur » : JEU.robot éteint, ses commandes passent par JEU.cibles (lisserCommandes, comme les touches)
ROBOT_COMME_JOUEUR = '''() => { JEU.robot = false; window.LEVER_LE_PIED = null;
  BOUCLE.surPhysique(() => { if (JEU.ecran !== "course" || !JEU.course || !courseAutorise(JEU.course)) return; const c = piloteRobot(JEU.joueur, CIRCUIT);
    if (window.LEVER_LE_PIED && window.LEVER_LE_PIED()) c.gaz = 0; Object.assign(JEU.cibles, c); }); }'''
ETAT_SEUL = '() => ({ meilleur: JEU.course.meilleurTour, garde: JEU.fantomeSeul && JEU.fantomeSeul.meilleur && JEU.fantomeSeul.meilleur.temps, bouton: !document.getElementById("boutonFinDefi").classList.contains("cache"), texte: document.getElementById("boutonFinDefi").textContent === texte("defiBouton"), record: SAUVEGARDE.fantome(NOM_CIRCUIT) && SAUVEGARDE.fantome(NOM_CIRCUIT).temps, tours: JEU.course.tours.map(x => x.temps) })'

def course_seule_jusqu_a_la_fin(pg):
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "course" && !!JEU.course', None, 120000)
    for _ in range(120):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'fin': break
        pg.wait_for_timeout(50)
    attendre(pg, '() => JEU.ecran === "fin"', None, 10000)

def defi_seul(pg, titre):
    # 1. le robot (?robot=1) : rien n'est enregistré, pas de « Défier un ami »
    course_seule_jusqu_a_la_fin(pg)
    e0 = pg.evaluate(ETAT_SEUL)
    t(f'{titre} : (tour 51l) une course seule conduite par le robot (?robot=1) : aucun tour enregistré, pas de « 📋 Défier un ami » (le joueur ne l’a pas conduite)', e0['garde'] is None and not e0['bouton'] and len(e0['tours']) == 3, str(e0))
    # 2. « Rejouer », le robot conduit comme le joueur : le meilleur tour propre est gardé
    pg.evaluate(ROBOT_COMME_JOUEUR)
    pg.click('#boutonRejouer')
    course_seule_jusqu_a_la_fin(pg)
    e = pg.evaluate(ETAT_SEUL)
    ok = e['garde'] is not None and e['meilleur'] is not None and abs(e['garde'] - e['meilleur']) < 0.0005 and e['tours'][0] != e['garde']
    t(f'{titre} : après une course seule de 3 tours (le joueur), le meilleur tour propre est enregistré (pas le premier, départ arrêté), c’est le record du circuit, et « 📋 Défier un ami » est là', ok and e['bouton'] and e['texte'] and e['record'] is not None and abs(e['record'] - e['garde']) < 0.0005, str(e))
    # 3. (tour 51l) « Rejouer » encore : la course repart de zéro (JEU.fantomeSeul remis) ; on lève le pied 2 s au début des tours 2 et 3 : ils sont
    # plus lents que ceux d'avant, et le tour proposé doit être le meilleur de CETTE course, pas celui de la course précédente
    pg.evaluate('() => { window.LEVER_LE_PIED = () => JEU.course.tours.length >= 1 && JEU.course.temps - JEU.course.debutTour < 2; }')
    pg.click('#boutonRejouer')
    course_seule_jusqu_a_la_fin(pg)
    e2 = pg.evaluate(ETAT_SEUL)
    lents = e2['tours'][1:]
    ok2 = e2['garde'] is not None and len(lents) == 2 and abs(e2['garde'] - min(lents)) < 0.0005 and min(lents) > e['garde'] + 0.1
    t(f'{titre} : (tour 51l) « Rejouer » : le défi repart de zéro, le tour proposé est le meilleur de cette course (plus lente d’un pied levé), pas celui de la course d’avant ; le record du circuit reste le plus rapide', ok2 and e2['bouton'] and abs(e2['record'] - e['garde']) < 0.0005, str([e['garde'], e2]))
    e = e2
    pg.click('#boutonFinDefi')
    c = pg.evaluate('() => { const c = document.querySelector("#finCode input.defiCode"); return c ? c.value : ""; }')
    l = pg.evaluate('() => { const c = document.querySelector("#finCode input.defiLien"); return c ? c.value : ""; }')
    d = pg.evaluate('c => { const r = DEFI.decoder(c, CIRCUIT.longueur); return r.ok ? r.defi.temps : null; }', c)
    t(f'{titre} : le lien (?defi=…) et le code (« GPD-TEST-… ») s’affichent à l’arrivée et se décodent au temps du meilleur tour', c.startswith('GPD-TEST-') and '/index.html?defi=' in l and d is not None and abs(d - e['garde']) < 0.0015, str([c[:20], l[:60], d, e['garde']]))

def defi_ecran(pg, titre):
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    pg.click('#boutonQualifTour'); pg.evaluate('() => { JEU.course.compte = 0.01; }')
    for _ in range(60):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.qualif.etat') == 'resultat': break
        pg.wait_for_timeout(50)
    vu = pg.evaluate('() => JEU.ecran === "qualif" && !document.getElementById("boutonQualifDefi").classList.contains("cache") && document.getElementById("boutonQualifDefi").textContent === texte("defiBouton")')
    t(f'{titre} : après un tour de qualification valide, le bouton « 📋 Défier un ami »', vu, str(pg.evaluate('() => [JEU.ecran, JEU.qualif && JEU.qualif.etat, JEU.qualif && JEU.qualif.q.valide]')))
    pg.click('#boutonQualifDefi')
    attendre(pg, '() => !!document.querySelector("#qualifCode input.defiCode")', None, 5000)
    code = pg.evaluate('() => { const c = document.querySelector("#qualifCode input.defiCode"); return c ? c.value : ""; }')
    temps = pg.evaluate('() => JEU.qualif.q.temps')
    ok = pg.evaluate('c => { const r = DEFI.decoder(c, CIRCUIT.longueur); return r.ok && Math.abs(r.defi.temps - JEU.qualif.q.temps) < 0.001 && !document.getElementById("qualifCode").classList.contains("cache"); }', code)
    t(f'{titre} : le code du tour s’affiche à copier (« GPD-TEST-… », {len(code)} caractères), avec « Copier », et il se décode', code.startswith('GPD-TEST-') and ok and pg.evaluate('() => document.querySelector("#qualifCode button.defiCode").textContent === texte("defiCopier")'), code[:60])
    # (tour 50b) le lien de défi : d'abord le lien (l'adresse du jeu + ?defi=<code>) et « Copier le lien »
    lien = pg.evaluate('() => { const c = document.querySelector("#qualifCode input.defiLien"), b = document.querySelector("#qualifCode button.defiLien"); return c && b && b.textContent === texte("defiCopierLien") ? c.value : ""; }')
    t(f'{titre} : le lien de défi s’affiche avant le code, avec « Copier le lien » : l’adresse du jeu + ?defi=<le code>', lien.startswith('file://') and '/index.html?defi=' in lien and pg.evaluate('l => decodeURIComponent(new URL(l).searchParams.get("defi") || "")', lien) == code, lien[:80])
    pg.screenshot(path=os.path.join(CAPTURES, 'defi-code.png'))
    # « Entre amis » → « Relever un défi »
    pg.goto('file://' + RACINE + '/index.html?menu=amis'); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "amis"', None, 30000)
    pg.click('#boutonAmisDefi')
    attendre(pg, '() => JEU.ecran === "defi"', None, 5000)
    abime = code[:200] + ('B' if code[200] != 'B' else 'C') + code[201:]
    pg.fill('#defiSaisie', abime); pg.click('#boutonDefiCourir'); pg.wait_for_timeout(200)
    m = pg.evaluate('() => [JEU.ecran, document.getElementById("defiMessage").textContent, texte("defiRefus_abime")]')
    t(f'{titre} : « Relever un défi » : un code abîmé d’un caractère est refusé, avec son message, et l’on reste sur l’écran', m[0] == 'defi' and m[1] == m[2] and m[1] != '', str(m))
    pg.screenshot(path=os.path.join(CAPTURES, 'defi-refus.png'))
    pg.fill('#defiSaisie', code)
    with pg.expect_navigation(timeout=30000): pg.click('#boutonDefiCourir')
    s = pg.evaluate('() => SAUVEGARDE.defis()')
    t(f'{titre} : le bon code est accepté : gardé dans la sauvegarde (le défi en cours, la liste des reçus), la page du défi s’ouvre', 'defi=1' in pg.url and s['enCours'] == code and len(s['liste']) == 1 and s['liste'][0]['meilleur'] is None, str([pg.url[-30:], len(s['liste'])]))
    # le tour contre le fantôme, par le robot (le même tour que le code : l'écart final vaut 0)
    pg.goto('file://' + RACINE + '/index.html?defi=1&robot=1'); attendre(pg, '() => typeof JEU !== "undefined" && !!JEU.defi && JEU.ecran === "qualif" && !!JEU.qualif', None, 60000)
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    pg.evaluate('() => BOUCLE.simuler(10)')
    attendre(pg, '() => JEU.modeleFantome && JEU.modeleFantome.groupe.visible && !document.getElementById("hudEcart").classList.contains("cache")', None, 10000)
    e = pg.evaluate('() => ({ circuit: NOM_CIRCUIT, rejeu: !!(JEU.fantome && JEU.fantome.rejeu), visible: !!(JEU.modeleFantome && JEU.modeleFantome.groupe.visible), ecart: JEU.fantome && JEU.fantome.ecart, hud: !document.getElementById("hudEcart").classList.contains("cache"), ia: JEU.plateau === null })')
    t(f'{titre} : la page du défi : seul sur le circuit du code, contre le fantôme (visible), l’écart en direct sous le chrono', e['circuit'] == 'test' and e['rejeu'] and e['visible'] and e['hud'] and e['ia'] and e['ecart'] is not None and abs(e['ecart']) < 0.05, str(e))
    pg.screenshot(path=os.path.join(CAPTURES, 'defi-tour.png'))
    for _ in range(60):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'defiFin': break
        pg.wait_for_timeout(50)
    attendre(pg, '() => JEU.ecran === "defiFin" && !document.getElementById("defiFin").classList.contains("cache")', None, 10000)
    f = pg.evaluate('() => ({ ecran: JEU.ecran, ecart: JEU.defi.ecart, texte: document.getElementById("defiFinTexte").textContent, contre: document.getElementById("defiFinContre").textContent, circuitVu: document.getElementById("defiFinContre").textContent.includes(texte("circuit_test")), renvoyer: !document.getElementById("boutonDefiRenvoyer").classList.contains("cache"), meilleur: SAUVEGARDE.defis().liste[0].meilleur, defile: [document.documentElement.scrollHeight, innerHeight] })')
    t(f'{titre} : à l’arrivée, le résultat : le même robot que le fantôme, l’écart vaut 0 (« … 0,000 »), le défi affiché (nom, temps, circuit, aides), « Renvoyer mon code », le meilleur gardé, sans défilement',
      f['ecran'] == 'defiFin' and f['ecart'] is not None and abs(f['ecart']) < 0.0005 and '0,000' in f['texte'] and f['circuitVu'] and f['renvoyer'] and f['meilleur'] is not None and abs(f['meilleur']) < 0.001 and f['defile'][0] <= f['defile'][1] + 2, str(f))
    pg.click('#boutonDefiRenvoyer')
    c2 = pg.evaluate('() => { const c = document.querySelector("#defiFinCode input.defiCode"); return c ? c.value : ""; }')
    l2 = pg.evaluate('() => { const c = document.querySelector("#defiFinCode input.defiLien"); return c ? c.value : ""; }')
    t(f'{titre} : « Renvoyer mon lien » : son propre lien (et son code), sur le même circuit, qui se décode', c2.startswith('GPD-TEST-') and pg.evaluate('c => DEFI.decoder(c, CIRCUIT.longueur).ok', c2)
      and pg.evaluate('() => document.getElementById("boutonDefiRenvoyer").textContent === texte("defiRenvoyer")') and '?defi=' in l2 and pg.evaluate('l => new URL(l).searchParams.get("defi")', l2) == c2, c2[:40])
    pg.screenshot(path=os.path.join(CAPTURES, 'defi-fin.png'))
    # (tour 50b) le lien de défi : un clic sur le lien (une page neuve) ouvre directement la grille du défi, sans autre écran
    pg.evaluate('() => { const s = SAUVEGARDE.defis(); s.enCours = null; s.liste = []; SAUVEGARDE.ecrireDefis(s); }')
    pg.goto(lien)
    vus = []
    for _ in range(300):
        e = pg.evaluate('() => typeof JEU === "undefined" ? null : JEU.ecran')
        if e and (not vus or vus[-1] != e): vus.append(e)
        if e == 'qualif' and pg.evaluate('() => !!JEU.defi && !!JEU.qualif'): break
        pg.wait_for_timeout(100)
    s = pg.evaluate('() => ({ circuit: NOM_CIRCUIT, defi: !!JEU.defi, liste: SAUVEGARDE.defis().liste.map(d => [d.nom, typeof d.code === "string"]), enCours: SAUVEGARDE.defis().enCours })')
    t(f'{titre} : un clic sur le lien ouvre directement la grille du défi (écrans vus : {vus}), le défi est reçu avec son code', not (set(vus) & {'titre', 'championnat', 'amis', 'defi', 'choix', 'pilote'}) and vus[-1:] == ['qualif'] and s['circuit'] == 'test' and s['defi'] and s['enCours'] == code and s['liste'] == [[s['liste'][0][0], True]], str([vus, s]))
    # un lien abîmé : le jeu s'ouvre normalement (le paddock), avec le message de refus
    abime_lien = lien.split('?')[0] + '?championnat=1&defi=' + pg.evaluate('c => encodeURIComponent(c)', abime)
    pg.goto(abime_lien); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    r = pg.evaluate('() => { const e = document.getElementById("defiLienRefus"); return { defi: !!JEU.defi, vu: !!e && !e.classList.contains("cache"), texte: e ? e.textContent : "", refus: texte("defiLienRefuse") }; }')
    t(f'{titre} : un lien de défi abîmé est refusé proprement : le jeu s’ouvre normalement (le paddock), le message de refus en haut', not r['defi'] and r['vu'] and r['texte'].startswith(r['refus']), str(r))
    # le défi reçu est dans la page Messages, avec « Relever » ; le clic ouvre la grille du défi
    pg.evaluate('() => INTERFACE.pagePaddock("messages")')
    m = pg.evaluate('() => [...document.querySelectorAll("#paddockDefis .defiMessage")].map(x => [x.querySelector("span").textContent, x.querySelector("button").textContent])')
    t(f'{titre} : la page Messages : « Défi de <nom> : <circuit>, <temps> » avec « Relever »', len(m) == 1 and texte_ok(m[0][0]) and m[0][1] == pg.evaluate('() => texte("defiRelever")'), str(m))
    pg.screenshot(path=os.path.join(CAPTURES, 'defi-messages.png'))
    with pg.expect_navigation(timeout=30000): pg.evaluate('() => document.querySelector("#paddockDefis .defiMessage button").click()')
    t(f'{titre} : « Relever » ouvre la grille du défi', attendre(pg, '() => typeof JEU !== "undefined" && !!JEU.defi && JEU.ecran === "qualif" && !!JEU.qualif', None, 60000) and 'defi=1' in pg.url, pg.url[-40:])

def fantome(pg, titre):
    TOUR = '() => JEU.ecran === "qualif" && JEU.qualif.etat === "tour" && JEU.qualif.q.lance'
    # après BOUCLE.simuler, l'écran et la 3D ne sont à jour qu'à l'image suivante : on attend deux images dessinées (sous
    # swiftshader et un Mac chargé, une image peut prendre plus de 300 ms)
    def image():
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } return window.__images; }')
        attendre(pg, 'n => window.__images > n + 1', n, 30000)
    def mon_tour():
        attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
        attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
        pg.click('#boutonQualifTour')
        pg.evaluate('() => { JEU.course.compte = 0.01; }')
        attendre(pg, TOUR, None, 20000)
    def finir_tour():
        for _ in range(40):
            pg.evaluate('() => BOUCLE.simuler(5)')
            if pg.evaluate('() => JEU.qualif.etat') == 'resultat': break
            pg.wait_for_timeout(50)
    t(f'{titre} : au départ, aucun fantôme sauvegardé pour ce circuit, l’option « affiché »', pg.evaluate('() => SAUVEGARDE.fantome(NOM_CIRCUIT) === null && SAUVEGARDE.option("fantome", true) === true && JEU.fantome === null'))
    mon_tour()
    t(f'{titre} : 1er tour : le tour est enregistré, mais sans record il n’y a ni fantôme (pas de voiture transparente) ni écart affiché',
      pg.evaluate('() => !!(JEU.fantome && JEU.fantome.rejeu === null && JEU.fantome.tour && JEU.modeleFantome === null && document.getElementById("hudEcart").classList.contains("cache"))'), str(pg.evaluate('() => [JEU.fantome && JEU.fantome.rejeu, JEU.modeleFantome]')))
    pg.evaluate('() => BOUCLE.simuler(15)'); image()
    appels1 = pg.evaluate('() => SCENE3D.appelsDessin')
    finir_tour()
    r1 = pg.evaluate('''() => { const f = SAUVEGARDE.fantome(NOM_CIRCUIT); return { etat: JEU.qualif.etat, temps: JEU.qualif.q.temps, fantome: f && { temps: f.temps, images: f.x.length, pas: f.pas, taille: FANTOME.taille(f) },
      texte: document.getElementById("qualifFantome").textContent, resultat: JEU.qualif.fantome, octets: localStorage.getItem(SAUVEGARDE.CLE).length }; }''')
    t(f'{titre} : 1er tour fini : « Nouveau record ! », le fantôme sauvegardé pour le circuit (compact, son temps = le temps du tour)',
      r1['etat'] == 'resultat' and r1['fantome'] and abs(r1['fantome']['temps'] - r1['temps']) < 0.001 and r1['fantome']['images'] > 100 and r1['resultat']['record'] and r1['texte'] == pg.evaluate('() => texte("nouveauRecord")'), str(r1))
    if r1['fantome']: L.append(f"  (fantôme du robot sur le circuit test : {r1['temps']:.2f} s, {r1['fantome']['images']} images à {r1['fantome']['pas']} s, {r1['fantome']['taille']} octets ; la sauvegarde fait {r1['octets']} octets)")
    # 2e qualification : un robot plus prudent en virage (plus lent) roule contre le fantôme
    pg.reload()
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif"', None, 60000)
    pg.evaluate('() => { REGLAGES.ROBOT_MARGE_VIRAGE = 0.7; }')
    mon_tour()
    t(f'{titre} : 2e tour : le fantôme est chargé et sa voiture transparente roule (visible, matériau transparent, couleur neutre)',
      attendre(pg, '() => JEU.fantome && JEU.fantome.rejeu && JEU.fantome.visible && JEU.modeleFantome && JEU.modeleFantome.groupe.visible && JEU.modeleFantome.corps.material.transparent && JEU.modeleFantome.corps.material.opacity === REGLAGES.FANTOME_OPACITE', None, 10000), str(pg.evaluate('() => [JEU.fantome && !!JEU.fantome.rejeu, JEU.modeleFantome && JEU.modeleFantome.groupe.visible]')))
    pg.evaluate('() => BOUCLE.simuler(15)'); image()
    e = pg.evaluate('''() => { const el = document.getElementById("hudEcart"), p = FANTOME.position(JEU.fantome.rejeu, QUALIFICATION.chrono(JEU.qualif.q)), g = JEU.modeleFantome.groupe.position;
      return { cache: el.classList.contains("cache"), texte: el.textContent, classe: el.className, ecart: JEU.fantome.ecart, appels: SCENE3D.appelsDessin, distance: Math.hypot(g.x - p.x, g.z - p.z), loin: Math.hypot(g.x - JEU.joueur.x, g.z - JEU.joueur.z) }; }''')
    t(f'{titre} : 2e tour, après 15 s : l’écart en direct sous le chrono, positif et en rouge (« +1,23 »), le fantôme dessiné à sa position du rejeu, devant la voiture',
      not e['cache'] and re.fullmatch(r'\+\d+' + SEP + r'\d\d', e['texte']) is not None and e['classe'] == 'rouge' and e['ecart'] > 0 and e['distance'] < 1 and e['loin'] > 5, str(e))
    # (la même image, avec et sans le fantôme : d'un endroit du circuit à l'autre, le décor et les voitures lointaines n'ont pas les mêmes appels)
    cout = pg.evaluate('() => { const g = JEU.modeleFantome.groupe; SCENE3D.dessiner(); const avec = SCENE3D.appelsDessin; g.visible = false; SCENE3D.dessiner(); const sans = SCENE3D.appelsDessin; g.visible = true; SCENE3D.dessiner(); return [sans, avec]; }')
    t(f'{titre} : le fantôme coûte 6 appels de dessin de plus', cout[1] == cout[0] + 6, f"{cout[0]} → {cout[1]} (le tour d’avant, sans fantôme : {appels1})")
    L.append(f"  (appels de dessin pendant le tour de qualification : {appels1} sans le fantôme, {e['appels']} avec)")
    pg.screenshot(path=os.path.join(CAPTURES, 'fantome.png'))
    # les classes de l'écart : vert devant, rouge derrière, neutre à 0
    # (tour 48b) l'écart posé et lu dans le même appel : sans image entre les deux (avant, une image du jeu remettait l'écart du tour, « +1,10 »)
    vert = pg.evaluate('() => { INTERFACE.majEcartFantome(-0.34); return [document.getElementById("hudEcart").textContent, document.getElementById("hudEcart").className]; }')
    egal = pg.evaluate('() => { INTERFACE.majEcartFantome(0.004); return [document.getElementById("hudEcart").textContent, document.getElementById("hudEcart").className]; }')
    t(f'{titre} : « −0,34 » en vert quand le joueur est devant, « 0,00 » neutre à égalité', vert == ['−0' + pg.evaluate('() => texte("virgule")') + '34', 'vert'] and egal[1] == 'egal', str([vert, egal]))
    finir_tour(); image()
    r2 = pg.evaluate('''() => ({ etat: JEU.qualif.etat, temps: JEU.qualif.q.temps, record: SAUVEGARDE.fantome(NOM_CIRCUIT).temps, resultat: JEU.qualif.fantome, texte: document.getElementById("qualifFantome").textContent, visible: JEU.modeleFantome.groupe.visible })''')
    t(f'{titre} : 2e tour fini, plus lent : l’écart final affiché (« +x,xx s du record »), le record n’est pas remplacé, le fantôme disparaît',
      r2['etat'] == 'resultat' and r2['temps'] > r2['record'] and abs(r2['record'] - r1['temps']) < 0.001 and not r2['resultat']['record'] and abs(r2['resultat']['ecart'] - (r2['temps'] - r2['record'])) < 0.01
      and re.search(r'\+\d+' + SEP + r'\d\d s', r2['texte']) is not None and not r2['visible'], str(r2))
    L.append(f"  (2e qualification, robot prudent : {r2['temps']:.2f} s, {r2['texte']})")
    # l'option « masqué » (bouton sur l'écran de qualification, sauvegardée), puis la course : jamais de fantôme
    pg.reload()
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif" && JEU.qualif.etat === "choix"', None, 60000)
    t(f'{titre} : le bouton « Fantôme : affiché » est sur l’écran de qualification et dans le menu pause', pg.evaluate('() => document.getElementById("boutonFantomeQualif").textContent === texte("fantomeOui") && document.getElementById("boutonFantomePause").textContent === texte("fantomeOui") && !document.getElementById("boutonFantomeQualif").classList.contains("cache")'))
    pg.click('#boutonFantomeQualif')
    t(f'{titre} : un clic le masque, et l’option est sauvegardée', pg.evaluate('() => document.getElementById("boutonFantomeQualif").textContent === texte("fantomeNon") && SAUVEGARDE.option("fantome", true) === false'))
    mon_tour()
    pg.evaluate('() => BOUCLE.simuler(5)'); image()
    t(f'{titre} : masqué : la voiture transparente n’est pas dessinée, l’écart reste affiché', pg.evaluate('() => !!(JEU.fantome.rejeu && !JEU.fantome.visible && !JEU.modeleFantome.groupe.visible && !document.getElementById("hudEcart").classList.contains("cache"))'))
    finir_tour()
    pg.click('#boutonQualifCourse')
    t(f'{titre} : en course, aucun fantôme : pas de voiture transparente, pas d’écart, et seules les voitures des pilotes existent pour les IA', attendre(pg, '() => JEU.ecran === "course" && JEU.fantome === null && !JEU.modeleFantome.groupe.visible && document.getElementById("hudEcart").classList.contains("cache")', None, 10000)
      and pg.evaluate('() => JEU.plateau.pilotes.every(p => voituresVues(p.v, JEU.plateau.pilotes.map(x => x.v)).every(w => w.id !== JEU.modeleFantome))'), str(pg.evaluate('() => [JEU.ecran, JEU.fantome]')))
    # le fantôme PROUVÉ visible (tour 23b) : un 3e tour, par un robot moins puissant (FORCE_MOTEUR_MAX et PUISSANCE × 0,7, ce
    # qui ne change que cette page) : dès la ligne, le fantôme (le record) le distance ; ~1 s après la ligne, il est à quelques
    # mètres devant. Capture fantome-proche.png, puis deux rendus de la même image, fantôme montré / caché (BOUCLE arrêtée,
    # SCENE3D.dessiner) : dans la moitié basse, les pixels qui changent sont ceux du fantôme, plus clairs (sa couleur neutre)
    pg.reload()
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "qualif" && JEU.qualif.etat === "choix"', None, 60000)
    pg.evaluate('() => { SAUVEGARDE.ecrireOption("fantome", true); INTERFACE.majBoutonsFantome(true); REGLAGES.FORCE_MOTEUR_MAX *= 0.7; REGLAGES.PUISSANCE *= 0.7; }')
    # (la boucle arrêtée dès le clic : le tour est joué pas à pas jusqu'à 0,5 s après la ligne, quel que soit le temps d'une image ;
    # avec le décor, sous swiftshader, attendre le tour en temps réel laissait passer plusieurs secondes de chrono, et à 1 s pile
    # le fantôme est déjà à 12-20 m, à moitié au-dessus du milieu de l'image)
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    pg.click('#boutonQualifTour')
    pg.evaluate('() => { BOUCLE.arreter(); JEU.course.compte = 0.01; }')
    pg.evaluate('t => { const tour = eval(t); let n = 0; while (!tour() && n++ < 120 * 60) BOUCLE.simuler(1 / 120); while (QUALIFICATION.chrono(JEU.qualif.q) < 0.5 && n++ < 120 * 120) BOUCLE.simuler(1 / 120); BOUCLE.demarrer(); }', TOUR)
    image()   # (deux images : la première sans physique, la seconde 0,1 s au plus)
    pg.evaluate('() => BOUCLE.arreter()')
    pos = pg.evaluate('''() => { const p = FANTOME.position(JEU.fantome.rejeu, QUALIFICATION.chrono(JEU.qualif.q)), v = JEU.joueur, c = Math.cos(v.cap), s = Math.sin(v.cap);
      return { chrono: QUALIFICATION.chrono(JEU.qualif.q), devant: c * (p.x - v.x) + s * (p.z - v.z), cote: -s * (p.x - v.x) + c * (p.z - v.z), visible: JEU.modeleFantome.groupe.visible, ecart: JEU.fantome.ecart }; }''')
    t(f'{titre} : 3e tour (robot moins puissant), ~1 s après la ligne : le fantôme est quelques mètres devant la voiture, visible', pos['visible'] and 1 <= pos['devant'] <= 40 and abs(pos['cote']) < 6 and pos['ecart'] > 0, str(pos))
    pg.screenshot(path=os.path.join(CAPTURES, 'fantome-proche.png'))
    avec = base64.b64encode(pg.screenshot()).decode()
    pg.evaluate('() => { JEU.modeleFantome.groupe.visible = false; SCENE3D.dessiner(); }')
    sans = base64.b64encode(pg.screenshot()).decode()
    pg.evaluate('() => { JEU.modeleFantome.groupe.visible = true; SCENE3D.dessiner(); }')
    diff = pg.evaluate('''async ([a, b]) => { const lire = async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        return { w: img.width, h: img.height, d: ctx.getImageData(0, Math.floor(img.height / 2), img.width, img.height - Math.floor(img.height / 2)).data }; };
      const A = await lire(a), B = await lire(b); let n = 0, clairA = 0, clairB = 0;
      for (let i = 0; i < A.d.length; i += 4) { const la = A.d[i] + A.d[i + 1] + A.d[i + 2], lb = B.d[i] + B.d[i + 1] + B.d[i + 2];
        if (Math.abs(la - lb) > 30) { n++; clairA += la; clairB += lb; } }
      return { pixels: n, clairA: n ? clairA / n / 3 : 0, clairB: n ? clairB / n / 3 : 0, taille: A.w + 'x' + A.h }; }''', [avec, sans])
    seuil = pg.evaluate('() => REGLAGES.FANTOME_PIXELS_MIN')
    t(f'{titre} : contrôle en pixels : dans la moitié basse, au moins FANTOME_PIXELS_MIN = {seuil} pixels changent quand le fantôme est caché, et ils sont plus clairs avec lui (sa teinte neutre mélangée à la piste)',
      diff['pixels'] >= seuil and diff['clairA'] > diff['clairB'], str(diff))
    L.append(f"  (fantôme à {pos['devant']:.1f} m devant, {diff['pixels']} pixels changés dans la moitié basse, clarté {diff['clairB']:.0f} → {diff['clairA']:.0f})")
    pg.evaluate('() => BOUCLE.demarrer()')

# le premier lancement (decouverte.js, CLAUDE.md « En piste en 10 secondes ») : sans sauvegarde, l'écran titre ; « ▶ Jouer »
# mène directement à la grille de la course de découverte (3 tours, 6 IA débutant, pilotes du monde, le joueur au milieu, les
# aides) ; le robot la joue jusqu'au podium, puis « Bravo ! Prêt pour ta carrière ? », la prime, et la page rechargée arrive au
# paddock. Le faux SDK note les appels : gameLoadingFinished une fois, gameplayStart aux feux éteints, jamais commercialBreak
def decouverte(pg, titre):
    R = pg.evaluate('() => ({ tours: REGLAGES.DECOUVERTE_TOURS, ia: REGLAGES.DECOUVERTE_IA, niveau: REGLAGES.DECOUVERTE_NIVEAU, circuit: REGLAGES.DECOUVERTE_CIRCUIT, argent: REGLAGES.DECOUVERTE_ARGENT, max: REGLAGES.DECOUVERTE_ARGENT_MAX })')
    t(f'{titre} : sans sauvegarde, l’écran titre : le nom du jeu par sa clé, « ▶ Jouer », le petit « 👥 Entre amis », rien d’autre ; le monde du championnat est créé et sauvegardé ; aucun gameplayStart',
      pg.evaluate('''() => JEU.ecran === "titre" && JEU.decouverte && !document.getElementById("titre").classList.contains("cache") && document.getElementById("titreNom").textContent === texte("nomDuJeu")
        && document.getElementById("boutonJouer").textContent === texte("titreJouer") && document.getElementById("boutonAmis").textContent === texte("titreAmis")
        && SAUVEGARDE.championnat() !== null && SAUVEGARDE.championnat().pilotes.length === 20 && !SAUVEGARDE.decouverteFaite() && JEU.monde === null === false
        && window.APPELS_SDK.join(",") === "init,gameLoadingFinished"'''), str(pg.evaluate('() => [JEU.ecran, JEU.decouverte, window.APPELS_SDK]')))
    pg.screenshot(path=os.path.join(CAPTURES, 'titre.png'))
    pg.click('#boutonAmis')
    t(f'{titre} : « Entre amis » ouvre son petit menu (écran partagé, tournoi), « Retour » revient au titre', pg.evaluate('() => JEU.ecran === "amis" && document.getElementById("boutonAmisDeux").textContent === texte("amisDeux")')
      and (pg.click('#boutonAmisRetour') or True) and pg.evaluate('() => JEU.ecran === "titre"'))
    chargement = pg.evaluate('() => performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart')
    pg.click('#boutonJouer')
    t(f'{titre} : la course de découverte n’a pas de survol de la grille (GRILLE_DECOUVERTE faux : en piste en 10 secondes)', pg.evaluate('() => JEU.ecran !== "grille" && !REGLAGES.GRILLE_DECOUVERTE'), str(pg.evaluate('() => JEU.ecran')))
    t(f'{titre} : « ▶ Jouer » mène directement à la grille (écran course, pas de qualification), {R["tours"]} tours, {R["ia"]} IA au niveau {R["niveau"]} sur le circuit {R["circuit"]}, le joueur nommé « Toi » par défaut',
      attendre(pg, '() => JEU.ecran === "course" && JEU.plateau && JEU.qualif === null', None, 10000)
      and pg.evaluate(f'() => JEU.course.nbTours === {R["tours"]} && JEU.plateau.pilotes.length === {R["ia"]} + 1 && JEU.plateau.pilotes[{R["ia"]}].humain && REGLAGES.NIVEAU === "{R["niveau"]}" && NOM_CIRCUIT === "{R["circuit"]}" && JEU.course.feux && !!JEU.course.depart'),
      str(pg.evaluate('() => [JEU.ecran, JEU.course && JEU.course.nbTours, JEU.plateau && JEU.plateau.pilotes.length, REGLAGES.NIVEAU, NOM_CIRCUIT]')))
    t(f'{titre} : les {R["ia"]} IA sont des pilotes du monde (DECOUVERTE_PILOTES), aux couleurs de leur écurie',
      pg.evaluate('() => JEU.indices.length === REGLAGES.DECOUVERTE_IA && JEU.indices.every(id => !JEU.monde.pilotes[id].humain) && new Set(JEU.indices).size === JEU.indices.length && JEU.couleurs.slice(0, JEU.indices.length).every((c, k) => c === JEU.monde.ecuries[JEU.monde.pilotes[JEU.indices[k]].ecurie].couleur)'),
      str(pg.evaluate('() => JEU.indices')))
    # la carte des IA se calcule en fond : les feux attendent ; du clic aux feux éteints, la mesure (but : 10 s)
    t(f'{titre} : la carte se calcule, les IA reçoivent le caractère de leur pilote du monde', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.slice(0, REGLAGES.DECOUVERTE_IA).every((p, k) => p.pilote && p.pilote.caractere && Math.abs(p.pilote.caractere.agressivite - Math.max(0, Math.min(1, JEU.monde.pilotes[JEU.indices[k]].caractere.agressivite + REGLAGES.NIVEAUX.debutant.agressivite))) < 1e-9)', None, 240000))
    grille = pg.evaluate('() => { const P = JEU.plateau.pilotes, moi = P[P.length - 1], devant = P.filter(p => !p.humain && p.depart > moi.depart).length, derriere = P.filter(p => !p.humain && p.depart < moi.depart).length; return { devant, derriere, bouge: P.some(p => p.v.u !== 0) }; }')
    t(f'{titre} : le joueur part au milieu de la grille ({R["ia"] // 2} IA devant, {R["ia"] - R["ia"] // 2} derrière)', grille['devant'] == R['ia'] // 2 and grille['derriere'] == R['ia'] - R['ia'] // 2 and not grille['bouge'], str(grille))
    t(f'{titre} : sur la grille, une seule aide, grosse et centrée : « Tiens ↑ » (ni « ← → » ni « ↓ » encore)', attendre(pg, '() => !document.getElementById("aides").classList.contains("cache") && !document.getElementById("aideGaz").classList.contains("cache") && document.getElementById("aideGaz").textContent === texte("aideTenir") && ["aideDirection", "aideFrein"].every(id => document.getElementById(id).classList.contains("cache"))', None, 10000))
    t(f'{titre} : sur la grille, l’écran est nu : ni jauge, ni chrono, ni secteurs, ni meilleur tour, ni radar, ni barre des touches', pg.evaluate('() => document.body.classList.contains("grilleDecouverte") && ["jauge", "hudCourse", "radar", "aide"].every(id => getComputedStyle(document.getElementById(id)).display === "none")'))
    t(f'{titre} : sans aucune touche pendant AIDE_CLIGNOTE_APRES s sur la grille, « ↑ » clignote', attendre(pg, '() => document.getElementById("aideGaz").classList.contains("clignote")', None, 20000), str(pg.evaluate('() => [JEU.course.depart && JEU.course.depart.t, JEU.aides]')))
    extinction = attendre(pg, '() => JEU.course.etat !== "compte"', None, 60000)
    mesure = pg.evaluate('() => JEU.clicAuxFeux'); premier = pg.evaluate('() => JEU.clicAuPremierFeu')
    t(f'{titre} : les feux s’éteignent, le temps du clic aux feux est mesuré (sous swiftshader, la carte en fond pèse : la valeur est donnée telle quelle)', extinction and mesure is not None and mesure > 0, str(mesure))
    cache = pg.evaluate('() => { const c = SAUVEGARDE.carte(NOM_CIRCUIT); return { present: !!c, taille: c ? CACHE_CARTE.taille(c) : 0, duCache: JEU.carteDuCache }; }')
    # (tour 52f) la carte du circuit de la découverte (test) est livrée (cache-carte-test.js) : prise comme un cache valide, aucun calcul en fond, rien à écrire dans la sauvegarde ;
    # l'écriture en cache d'un circuit non livré est vérifiée plus bas, avec le 1er Grand Prix (bahrayn)
    t(f'{titre} : au premier lancement, la carte du circuit test vient du fichier livré (duCache vrai), sans calcul en fond', cache['duCache'] and not pg.evaluate('() => JEU.calculTrajectoire !== null'), str(cache))
    L.append(f"  (premier lancement : page chargée en {chargement} ms ; du clic sur « Jouer » au premier feu (l’attente de la carte des IA) : {(premier or 0) / 1000:.1f} s, à l’extinction des feux : {(mesure or 0) / 1000:.1f} s, sous swiftshader ; carte mise en cache : {cache['taille']} octets)")
    t(f'{titre} : gameplayStart seulement aux feux éteints, une fois', attendre(pg, '() => window.APPELS_SDK.join(",") === "init,gameLoadingFinished,gameplayStart"', None, 10000), str(pg.evaluate('() => window.APPELS_SDK')))
    # la prime en direct (tour 52g, premiere-minute n° 4) : pas pendant les feux, puis « Prime : <DECOUVERTE.prime(place)> » ; une place gagnée : « P3 ! » en moins de 0,5 s et « +<gain> »
    t(f'{titre} : la prime en direct s’affiche après le départ (pas pendant les feux) et vaut DECOUVERTE.prime(place) de la place du joueur',
      attendre(pg, '() => JEU.primeVue !== null && !document.getElementById("primeDecouverte").classList.contains("cache")', None, 10000)
      and pg.evaluate('() => { const o = classementCourse(JEU.plateau), place = o.findIndex(x => x.k === JEU.suivie) + 1, v = JEU.primeVue.place; return document.getElementById("primeTexte").textContent === texte("primeLive").replace("{n}", ARGENT.formater(DECOUVERTE.prime(v))) && Math.abs(place - v) <= 2; }'),
      str(pg.evaluate('() => [JEU.primeVue, document.getElementById("primeTexte").textContent]')))
    gain = pg.evaluate('''() => { const o = classementCourse(JEU.plateau), v = JEU.primeVue, avant = v.place, nouvelle = Math.max(1, avant - 1), t0 = performance.now();
      // le robot n'a pas forcément doublé : on rejoue le même classement avec le joueur une place plus haut (la fonction ne lit que cet ordre)
      const moi = o.findIndex(x => x.k === JEU.suivie); const f = o.slice(); const [m] = f.splice(moi, 1); f.splice(Math.max(0, avant - 2), 0, m);
      majPrimeDecouverte(f);
      const g = document.getElementById("placeGrand");
      return { avant, nouvelle, visible: !g.classList.contains("cache"), texte: g.textContent, attendu: texte("placeGrand").replace("{p}", nouvelle), ms: performance.now() - t0, gain: document.getElementById("primeGain").textContent,
        gainAttendu: "+" + ARGENT.formater(DECOUVERTE.prime(nouvelle) - DECOUVERTE.prime(avant)), compteur: document.getElementById("primeTexte").textContent === texte("primeLive").replace("{n}", ARGENT.formater(DECOUVERTE.prime(nouvelle))), anime: document.getElementById("primeDecouverte").classList.contains("monte") }; }''')
    t(f'{titre} : une place gagnée : « P{gain["nouvelle"]} ! » au centre en moins de 0,5 s, le compteur à DECOUVERTE.prime(place), « {gain["gainAttendu"]} » vert animé', gain['avant'] == 1 or (gain['visible'] and gain['texte'] == gain['attendu'] and gain['ms'] < 500 and gain['gain'] == gain['gainAttendu'] and gain['compteur'] and gain['anime']), str(gain))
    t(f'{titre} : le « P{gain["nouvelle"]} ! » disparaît au bout de PRIME_PLACE_GRAND_DUREE s', attendre(pg, '() => document.getElementById("placeGrand").classList.contains("cache")', None, 5000))
    # les touches : chaque aide part quand sa touche a servi (le robot conduit ; les touches ne font que marquer les aides)
    pg.keyboard.press('ArrowUp'); pg.wait_for_timeout(100)
    t(f'{titre} : après le départ, ↑ pressée : « Tiens ↑ » disparaît, « ← → pour tourner » est la seule aide (« ↓ freiner » vient après)', attendre(pg, '() => !document.body.classList.contains("grilleDecouverte") && document.getElementById("aideGaz").classList.contains("cache") && !document.getElementById("aideDirection").classList.contains("cache") && document.getElementById("aideFrein").classList.contains("cache")', None, 5000), str(pg.evaluate('() => JEU.aides')))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'decouverte.png'))
    pg.keyboard.press('ArrowLeft'); pg.keyboard.press('ArrowDown')
    t(f'{titre} : ← et ↓ pressées : plus aucune aide', attendre(pg, '() => document.getElementById("aides").classList.contains("cache") || ["aideGaz", "aideDirection", "aideFrein"].every(id => document.getElementById(id).classList.contains("cache"))', None, 5000), str(pg.evaluate('() => JEU.aides')))
    pg.evaluate('() => { REGLAGES.PODIUM_DECOUVERTE_DUREE = 1e9; }')   # (avant le podium : sous swiftshader une image dure des secondes ; le passage tout seul est testé plus bas, avec un délai court)
    # le robot roule jusqu'au podium (3 tours, 7 voitures)
    for _ in range(90):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    t(f'{titre} : la course va jusqu’au podium ; gameplayStop au podium', pg.evaluate('() => JEU.ecran === "podium" && JEU.final && JEU.final.length === REGLAGES.DECOUVERTE_IA + 1') and attendre(pg, '() => window.APPELS_SDK.slice(-1)[0] === "gameplayStop"'), str(pg.evaluate('() => [JEU.ecran, window.APPELS_SDK]')))
    # le podium de la découverte (tour 52e) : « Tu finis P2 / 7 · +800 € », « Continuer » (plus de « Résultats », plus d'écran « Bravo ! »)
    bravo = pg.evaluate('''() => { const moi = JEU.final.find(x => x.k === JEU.suivie), vu = id => !document.getElementById(id).classList.contains("cache"); return { ecran: JEU.ecran, place: moi.place, prime: JEU.prime, attendu: DECOUVERTE.prime(moi.place),
      bilan: document.getElementById("podiumBilan").textContent, continuer: vu("boutonPodiumContinuer") && document.getElementById("boutonPodiumContinuer").textContent === texte("pdContinuer"), resultats: vu("boutonResultats"),
      encore: vu("boutonPodiumEncore"), apprendre: vu("boutonTutorielPodium") && document.getElementById("boutonTutorielPodium").textContent === texte("tutoBravo") && document.getElementById("boutonTutorielPodium").closest("#podium") !== null,
      pas_de_bravo: document.getElementById("bravo") === null, faite: SAUVEGARDE.decouverteFaite(), argent: SAUVEGARDE.argent() }; }''')
    t(f'{titre} : à la découverte, le podium dit « Tu finis P{bravo["place"]} / {R["ia"] + 1} · +prime » (selon la place, plafond {R["max"]}), un seul bouton « Continuer » (+ « Encore une course ? » et « D’abord apprendre » en petit), plus de « Résultats » ni d’écran « Bravo ! » ; rien n’est encore sauvegardé',
      bravo['ecran'] == 'podium' and bravo['prime'] == bravo['attendu'] and bravo['prime'] == min(R['argent'][bravo['place'] - 1], R['max']) and f"P{bravo['place']} / {R['ia'] + 1}" in bravo['bilan']
      and ('+' + pg.evaluate('p => ARGENT.formater(p)', bravo['prime'])) in bravo['bilan'] and '$' not in bravo['bilan'] and bravo['continuer'] and not bravo['resultats'] and bravo['encore'] and bravo['apprendre'] and bravo['pas_de_bravo']
      and not bravo['faite'] and bravo['argent'] == 0, str(bravo))
    L.append(f"  (découverte du robot : P{bravo['place']} / {R['ia'] + 1}, prime {bravo['prime']} $)")
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'podium-decouverte.png'))
    # sans clic, le podium passe tout seul à la création du pilote après PODIUM_DECOUVERTE_DUREE s (la liste du tutoriel, ouverte, l'arrête)
    duree = 3
    pg.evaluate('(d) => { REGLAGES.PODIUM_DECOUVERTE_DUREE = d; JEU.tempsPodium = 0; }', duree)
    t(f'{titre} : le podium de la découverte passe tout seul à la création du pilote sans clic (PODIUM_DECOUVERTE_DUREE, 8 s par défaut, réglée à {duree} s ici), pas avant',
      pg.evaluate('(d) => JEU.ecran === "podium" && JEU.tempsPodium < d', duree) and attendre(pg, '() => JEU.ecran === "pilote"', None, int(duree * 1000) + 15000) and pg.evaluate('() => SAUVEGARDE.championnat() !== null && !SAUVEGARDE.decouverteFaite()'), str(pg.evaluate('() => [JEU.ecran, JEU.tempsPodium]')))
    cartes = pg.evaluate('''() => { const ch = JEU.monde, cs = Array.from(document.querySelectorAll("#piloteCartes .piloteCarte")), vu = id => !document.getElementById(id).classList.contains("cache") && document.getElementById(id).offsetParent !== null;
      const props = PILOTE.propositions(ch, "fr-FR");
      return { n: cs.length, attendu: REGLAGES.PILOTE_PROPOSITIONS, rapide: document.getElementById("pilote").classList.contains("rapide"), champsCaches: document.getElementById("piloteChamps").offsetParent === null && document.getElementById("casqueEditeur").offsetParent === null,
        perso: vu("boutonPilotePerso") && document.getElementById("boutonPilotePerso").textContent === texte("pilotePerso"), premier: cs[0].querySelector("strong").textContent === texte("nomJoueur"),
        valides: props.length === REGLAGES.PILOTE_PROPOSITIONS && props.every(p => PILOTE.valider(ch, { nom: p.nom, numero: p.numero, pays: p.pays, coeur: p.coeur }).ok && p.pays === "fr" && CASQUE.valide(p.casque)) && new Set(props.map(p => p.numero)).size === props.length,
        paysNavigateur: [PILOTE.paysDeLangue("fr-CA"), PILOTE.paysDeLangue("en-US"), PILOTE.paysDeLangue("ja"), PILOTE.paysDeLangue("xx"), PILOTE.paysDeLangue("it-IT")].join(),
        noms: REGLAGES.PILOTE_PRENOMS.every(n => /^[A-Za-z]+$/.test(n)) && props.every(p => p.nom === null || (REGLAGES.PILOTE_PRENOMS.includes(p.nom) && !ch.pilotes.some(r => !r.humain && r.nom === p.nom))),
        domicile: PILOTE.propositions(ch, "it").every(p => p.pays === "it" && p.coeur === "monzo" && PILOTE.valider(ch, { nom: p.nom, numero: p.numero, pays: p.pays, coeur: p.coeur }).ok) }; }''')
    t(f'{titre} : la création du pilote propose {cartes["attendu"]} pilotes prêts en cartes (le premier « Toi », numéros libres et différents, pays du navigateur, cœur cohérent avec le pays : Italie → Monzo, casque valide, prénoms génériques), le formulaire est derrière « Personnaliser »',
      cartes['n'] == cartes['attendu'] and cartes['rapide'] and cartes['champsCaches'] and cartes['perso'] and cartes['premier'] and cartes['valides'] and cartes['noms'] and cartes['domicile'] and cartes['paysNavigateur'] == 'ca,us,jp,fr,it', str(cartes))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'pilote-cartes.png'))
    pg.click('#boutonPilotePerso')
    t(f'{titre} : aucun point de championnat n’est donné', pg.evaluate('() => SAUVEGARDE.championnat().pilotes.every(p => p.stats.points === 0 && p.stats.courses === 0) && SAUVEGARDE.championnat().prochain === 0'))
    t(f'{titre} : jamais de commercialBreak', pg.evaluate('() => !window.APPELS_SDK.includes("commercialBreak")'), str(pg.evaluate('() => window.APPELS_SDK')))
    # la création du pilote (pilote.js) : après « Commencer ma carrière », l'écran ; un numéro de rival est refusé, un pays sans
    # circuit demande la course de cœur, un pays avec circuit l'impose (🏠) ; validé → sauvegardé, la page recharge sur le paddock
    # avec le nom du joueur ; puis un Grand Prix d'un tour : son numéro dans la tour, son nom sur la une du journal
    t(f'{titre} : « Personnaliser » ouvre le formulaire (nom, numéro, pays, course de cœur), rien n’est encore sauvegardé',
      attendre(pg, '() => JEU.ecran === "pilote" && !document.getElementById("pilote").classList.contains("cache") && !document.getElementById("pilote").classList.contains("rapide")') and pg.evaluate('() => !SAUVEGARDE.decouverteFaite() && document.querySelectorAll("#pilotePays option").length === REGLAGES.PAYS.length && document.querySelectorAll("#piloteCoeur option").length === 12 && document.getElementById("piloteNom").placeholder === texte("nomJoueur")'),
      str(pg.evaluate('() => [JEU.ecran, document.querySelectorAll("#pilotePays option").length]')))
    # l'éditeur du casque : le motif et une couleur changent, la case du joueur dans l'atlas change, l'aperçu 3D tourne
    casque0 = pg.evaluate('() => { const a = VOITURE3D.atlas, i = JEU.contre ? JEU.ia : 0, t = a.t; return Array.from(a.ctx.getImageData((i % a.colonnes) * t, Math.floor(i / a.colonnes) * t, t, t).data).join(); }')
    t(f'{titre} : l’éditeur du casque est là (motif, 3 couleurs, aperçu 3D), avec le casque neutre du joueur ; les 19 rivaux ont chacun le leur', pg.evaluate('() => document.querySelectorAll("#casqueMotif option").length === CASQUE.tousLesMotifs().length && document.querySelectorAll("#casqueMotif option:disabled").length === Object.keys(REGLAGES.CASQUE_DEBLOCAGES).length + CASQUE.motifsSkins().length && document.getElementById("casqueMotif").value === "uni" && !!VOITURE3D.atlas && CASQUE.doublons(JEU.monde).length === 0 && JEU.monde.pilotes.filter(p => !p.humain).every(p => CASQUE.valide(p.casque))'))
    pg.select_option('#casqueMotif', 'flammes')
    pg.evaluate('() => { const c = document.getElementById("casqueC1"); c.value = "#d8262e"; c.dispatchEvent(new Event("input")); }')
    pg.wait_for_timeout(300)
    casque1 = pg.evaluate('() => { const a = VOITURE3D.atlas, i = JEU.contre ? JEU.ia : 0, t = a.t; return Array.from(a.ctx.getImageData((i % a.colonnes) * t, Math.floor(i / a.colonnes) * t, t, t).data).join(); }')
    t(f'{titre} : changer le motif (flammes) et la couleur 1 redessine la case du joueur dans l’atlas (une seule texture, un seul matériau), et le casque tourne', casque1 != casque0 and pg.evaluate('() => INTERFACE.lireCasque().motif === "flammes" && INTERFACE.lireCasque().couleurs[0] === 0xd8262e && JEU.modeles.every(m => m.tete.material === VOITURE3D.atlas.materiau)'))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'casque.png'))
    pg.fill('#piloteNom', 'Léo'); pg.fill('#piloteNumero', '7'); pg.select_option('#pilotePays', 'fr')
    t(f'{titre} : la France n’a pas de circuit : la course de cœur est à choisir (liste active, pas de 🏠)', pg.evaluate('() => !document.getElementById("piloteCoeur").disabled && document.getElementById("piloteDomicile").textContent === ""'))
    pg.select_option('#pilotePays', 'it')
    t(f'{titre} : l’Italie a Monzo : la course de cœur est imposée (🏠 Grand Prix à domicile : Monzo)', pg.evaluate('() => document.getElementById("piloteCoeur").disabled && document.getElementById("piloteCoeur").value === "monzo" && document.getElementById("piloteDomicile").textContent === texte("piloteDomicile").replace("{circuit}", texte("circuit_monzo"))'), pg.evaluate('() => document.getElementById("piloteDomicile").textContent'))
    pg.select_option('#pilotePays', 'fr'); pg.select_option('#piloteCoeur', 'monoco')
    pg.click('#boutonPiloteValider')
    t(f'{titre} : le numéro 7 est celui d’un rival : refusé, l’erreur affichée, on reste sur l’écran', pg.evaluate('() => JEU.ecran === "pilote" && document.getElementById("piloteErreur").textContent === texte("piloteErreurNumero").replace("{min}", REGLAGES.NUMERO_MIN).replace("{max}", REGLAGES.NUMERO_MAX)'), pg.evaluate('() => document.getElementById("piloteErreur").textContent'))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'pilote.png'))
    pg.fill('#piloteNumero', '27')
    with pg.expect_navigation(): pg.click('#boutonPiloteValider')
    t(f'{titre} : numéro 27 : validé, sauvegardé (nom, numéro, pays, course de cœur), la découverte faite avec sa prime, et la page rechargée arrive au paddock avec « Léo » dans le classement',
      attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat', None, 60000)
      and pg.evaluate(f'''() => {{ const j = PILOTE.joueur(JEU.championnat), s = PILOTE.joueur(SAUVEGARDE.championnat()); return j.nom === "Léo" && j.numero === 27 && j.pays === "fr" && j.coeur === "monoco" && s.nom === "Léo" && s.numero === 27
        && SAUVEGARDE.decouverteFaite() && SAUVEGARDE.argent() === {bravo["prime"]} && (typeof ARGENT === "undefined" || ARGENT.solde(JEU.championnat) === {bravo["prime"]}) && [...document.querySelectorAll("#championnatPilotes li .nom")].some(e => e.textContent === "Léo") && !PILOTE.manque(JEU.championnat)
        && j.casque.motif === "flammes" && j.casque.couleurs[0] === 0xd8262e && document.querySelectorAll("#championnatPilotes li .nom canvas.casqueIcone").length === 20; }}'''),
      str(pg.evaluate('() => [JEU.ecran, PILOTE.joueur(JEU.championnat)]')))
    # un Grand Prix d'un tour : le numéro 27 dans la tour de classement, le nom sur la une du journal
    # (depuis le tour 32, le 1er Grand Prix est Bahrayn, pas le circuit de la découverte : sa carte n'est pas encore dans le cache, elle se
    # calcule en fond ; celle de la découverte, elle, y est gardée)
    t(f'{titre} : au lancement suivant, la carte de la découverte vient encore du fichier livré (ou de la sauvegarde) ; celle du 1er Grand Prix (un autre circuit, non livré) vient du cache ou se calcule en fond',
      pg.evaluate('() => (SAUVEGARDE.carte(REGLAGES.DECOUVERTE_CIRCUIT) !== null || !!CACHE_CARTE_LIVREE[REGLAGES.DECOUVERTE_CIRCUIT]) && NOM_CIRCUIT === JEU.championnat.calendrier[0].circuit && (JEU.carteDuCache === true || JEU.calculTrajectoire !== null || JEU.carte !== null)'),   # (la clé du fichier livré se vérifie au lancement et dans test.html ; en carrière, DIVISIONS.appliquer change des réglages : pas ici)
      str(pg.evaluate('() => [NOM_CIRCUIT, SAUVEGARDE.carte(REGLAGES.DECOUVERTE_CIRCUIT) !== null, JEU.carteDuCache, JEU.carte !== null, JEU.calculTrajectoire !== null]')))
    paddock_clic(pg, '#boutonCourseSuivante')
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 10000)
    pg.click('#boutonQualifPasser')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)   # (la carte des IA d'abord, s'il le faut)
    t(f'{titre} : la carte du 1er Grand Prix (non livrée) est calculée puis écrite dans la sauvegarde (la mise en cache des autres circuits est intacte, taille < CACHE_CARTE_TAILLE_MAX)',
      pg.evaluate('() => { const c = SAUVEGARDE.carte(NOM_CIRCUIT); return !!c && CACHE_CARTE.taille(c) < REGLAGES.CACHE_CARTE_TAILLE_MAX; }'), str(pg.evaluate('() => [NOM_CIRCUIT, SAUVEGARDE.carte(NOM_CIRCUIT) !== null, JEU.carteDuCache]')))
    pg.click('#boutonQualifCourse')
    # avant les feux, la grille vue d'en haut (CLAUDE.md « L'interface ») : la caméra au-dessus de la grille, les feux pas encore
    # allumés (la physique attend), une touche la passe ; jamais à deux ni au tournoi (vérifié dans leurs pages : pas d'écran « grille »)
    attendre(pg, '() => JEU.ecran !== "grille" || Math.abs(SCENE3D.camera.position.y - REGLAGES.GRILLE_HAUTEUR) < 1', None, 3000)
    g = pg.evaluate('() => ({ ecran: JEU.ecran, y: SCENE3D.camera.position.y, h: REGLAGES.GRILLE_HAUTEUR, compte: JEU.course.compte, total: JEU.course.feux.total, aide: document.getElementById("grilleAide").textContent })')
    t(f'{titre} : avant les feux, la grille vue d’en haut (la caméra à GRILLE_HAUTEUR m, aucun feu allumé, « une touche pour passer »)', g['ecran'] == 'grille' and abs(g['y'] - g['h']) < 1 and g['compte'] >= g['total'] and g['aide'] != '', str(g))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'grille.png'))
    pg.keyboard.press('KeyX')
    t(f'{titre} : une touche passe la grille : la course (les feux) tout de suite, la caméra de course revient', attendre(pg, '() => JEU.ecran === "course" && SCENE3D.camera.position.y < 10', None, 3000), str(pg.evaluate('() => [JEU.ecran, SCENE3D.camera.position.y]')))
    t0 = time.monotonic()
    premier2 = attendre(pg, '() => JEU.ecran === "course" && JEU.course.feux && (JEU.course.etat !== "compte" || JEU.course.compte < JEU.course.feux.total)', None, 60000)
    attente2 = time.monotonic() - t0
    feux2 = attendre(pg, '() => JEU.course.etat !== "compte"', None, 90000)
    mesure2 = time.monotonic() - t0
    # (sous swiftshader avec 20 voitures, les 5 feux eux-mêmes prennent plus de temps réel que de temps de jeu : c'est l'attente
    # avant le premier feu qui mesure la carte)
    t(f'{titre} : avec le cache, du départ de la course au premier feu : aucune attente de la carte (moins de 3 s, contre {(premier or 0) / 1000:.1f} s au premier lancement)', premier2 and attente2 < 3 and feux2, f'{attente2:.1f} s')
    L.append(f"  (deuxième lancement, carte en cache : du départ de la course au premier feu {attente2:.1f} s, aux feux éteints {mesure2:.1f} s ; au premier lancement : {(premier or 0) / 1000:.1f} s et {(mesure or 0) / 1000:.1f} s)")
    t(f'{titre} : en course, la ligne du joueur dans la tour porte son numéro 27 et l’icône de son casque (une par ligne)', attendre(pg, '() => document.querySelector("#classementListe li.moi") && document.querySelector("#classementListe li.moi .numero").textContent === "27" && document.querySelectorAll("#classementListe li canvas.casqueIcone").length === 20', None, 20000), pg.evaluate('() => document.querySelector("#classementListe li.moi") && document.querySelector("#classementListe li.moi").innerText'))
    # la vue télé pendant la course : des casques différents sur les voitures (capture casques-course.png)
    pg.evaluate('() => BOUCLE.simuler(8)')
    pg.evaluate('() => CAMERA.forcer("tele")'); pg.wait_for_timeout(500)
    pg.screenshot(path=os.path.join(CAPTURES, 'casques-course.png'))
    pg.evaluate('() => CAMERA.forcer("derriere")')
    attendre(pg, '() => JEU.plateau.carte !== null', None, 240000)
    for _ in range(80):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    pg.click('#boutonResultats'); attendre(pg, '() => JEU.ecran === "resultats"')
    t(f'{titre} : dans les résultats, le joueur a le numéro 27', pg.evaluate('() => /\\b27\\b/.test(document.querySelector("#resultatsLignes tr.moi").innerText)'), pg.evaluate('() => document.querySelector("#resultatsLignes tr.moi") && document.querySelector("#resultatsLignes tr.moi").innerText'))
    pg.click('#boutonChangerResultats')
    passer_interview(pg)   # l'interview d'après course (Codeur 3) : « Pas de commentaire »
    t(f'{titre} : la une du journal nomme « Léo »', attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => document.getElementById("une").innerText.includes("Léo")'), pg.evaluate('() => document.getElementById("une").innerText.slice(0, 300)'))

# sdk.js est le seul passage vers Poki : avec le faux SDK posé avant la page, les appels viennent dans l'ordre, et jamais
# deux fois le même état (gameplayStart / gameplayStop) de suite ; une course d'un tour par le robot
def sdk(pg, titre):
    J = '() => window.APPELS_SDK.join(",")'
    t(f'{titre} : le faux SDK est vu ; au démarrage d’une course : init, gameLoadingFinished, gameplayStart, dans cet ordre', attendre(pg, '() => SDK.present && JEU.sdkPret && window.APPELS_SDK.join(",") === "init,gameLoadingFinished,gameplayStart"', None, 20000), pg.evaluate(J))
    pg.keyboard.press('Escape')
    t(f'{titre} : la pause envoie gameplayStop', attendre(pg, '() => JEU.ecran === "pause" && window.APPELS_SDK.slice(-1)[0] === "gameplayStop"'), pg.evaluate(J))
    pg.click('#boutonReprendre')
    t(f'{titre} : « Reprendre » renvoie gameplayStart', attendre(pg, '() => JEU.ecran === "course" && window.APPELS_SDK.slice(-1)[0] === "gameplayStart"'), pg.evaluate(J))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'fin': break
        pg.wait_for_timeout(50)
    t(f'{titre} : à l’arrivée (écran de fin), gameplayStop ; sur toute la course, jamais deux fois le même état de suite',
      attendre(pg, '() => JEU.ecran === "fin" && window.APPELS_SDK.slice(-1)[0] === "gameplayStop"') and pg.evaluate(J) == 'init,gameLoadingFinished,gameplayStart,gameplayStop,gameplayStart,gameplayStop', pg.evaluate(J))
    pg.click('#boutonRejouer')
    t(f'{titre} : « Rejouer » : gameplayStart, une seule fois', attendre(pg, '() => JEU.ecran === "course" && window.APPELS_SDK.slice(-2).join(",") === "gameplayStop,gameplayStart"'), pg.evaluate(J))
    # (tour 51l) DEFI_ECRAN.montrerCode : un lienDe qui rappelle tout de suite (un shareableURL synchrone) remplit le champ du lien sans erreur ;
    # un rappel qui arrive après que la boîte a été redessinée (« Renvoyer mon lien » deux fois) ne touche pas le champ courant, le bon le remplit
    r = pg.evaluate('''() => { const R = [], lien = () => document.querySelector("#finCode input.defiLien").value; let erreur = null;
      try { DEFI_ECRAN.montrerCode('finCode', 'GPD-TEST-x', (c, rap) => { rap('sync://' + c); return 'repli://' + c; }); } catch (e) { erreur = String(e); }
      const sync = erreur ? null : lien();
      DEFI_ECRAN.montrerCode('finCode', 'GPD-TEST-a', (c, rap) => { R.push(rap); return 'repli://a'; });
      DEFI_ECRAN.montrerCode('finCode', 'GPD-TEST-b', (c, rap) => { R.push(rap); return 'repli://b'; });
      R[0]('tard://a'); const apresTard = lien(); R[1]('poki://b'); const apresBon = lien();
      document.getElementById('finCode').classList.add('cache');
      return { erreur, sync, apresTard, apresBon, n: document.querySelectorAll('#finCode input.defiLien').length }; }''')
    t(f'{titre} : le lien de défi (montrerCode) : un rappel immédiat de shareableURL remplit le champ sans erreur ; un rappel en retard (boîte redessinée) ne touche pas le champ courant, le bon le remplit',
      r['erreur'] is None and r['sync'] == 'sync://GPD-TEST-x' and r['apresTard'] == 'repli://b' and r['apresBon'] == 'poki://b' and r['n'] == 1, str(r))

# ?pneus=1 : les pneus du joueur (pneus.js) s'usent, son adhérence baisse, ?debug=1 l'affiche (sans ?pneus=1 : rien, PNEUS_ACTIFS faux)
def pneus(pg, titre):
    t(f'{titre} : ?pneus=1 active PNEUS_ACTIFS, la voiture du joueur part avec des pneus neufs (usure 0, adhérence × 1)', pg.evaluate('() => REGLAGES.PNEUS_ACTIFS === true && !!JEU.joueur.pneus && JEU.joueur.pneus.usure === 0 && JEU.joueur.adherence === 1'))
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    releves = []
    for _ in range(10):
        pg.evaluate('() => BOUCLE.simuler(64)')
        releves.append(pg.evaluate('() => [JEU.course.tours.length, JEU.joueur.pneus.usure, JEU.joueur.adherence]'))
    monte = all(b[1] > a[1] and b[2] < a[2] for a, b in zip(releves, releves[1:]))
    t(f'{titre} : en 10 tours du robot (essai libre), l’usure monte à chaque tour et l’adhérence baisse', monte and releves[-1][0] >= 9 and 0 < releves[-1][1] <= 1 and releves[-1][2] < 1, str(releves))
    L.append(f'  (?pneus=1, robot : après {releves[-1][0]} tours, usure {releves[-1][1]:.2f}, adhérence × {releves[-1][2]:.3f})')
    t(f'{titre} : ?debug=1 affiche l’usure des pneus', attendre(pg, '() => /pneus \\d+ %/.test(document.getElementById("ips").textContent)'), pg.evaluate('() => document.getElementById("ips").textContent'))

# l'arrêt au stand (étape 7, ?pneus=1, course de 12 tours, le robot) : le message du tour conseillé au départ ; le robot va aux stands
# (v.versStands, robot.js), s'arrête dans la zone (capture stand.png pendant l'arrêt, le message « Arrêt au stand… »), repart avec des
# pneus neufs, « Pneus neufs ! », sans pénalité ; son tour compte
def stand_ecran(pg, titre):
    attendre(pg, '() => typeof JEU !== "undefined" && !!JEU.course && !!JEU.joueur.pneus', None, 30000)
    pg.evaluate('() => { JEU.course.compte = 0.01; }')
    attendre(pg, '() => JEU.course.etat === "course"', None, 20000)
    conseil = attendre(pg, '() => !document.getElementById("hudStand").classList.contains("cache") && /tour 6 conseillé/.test(document.getElementById("hudStand").textContent)', None, 10000)
    # (tour 46d2) le repère peint de la zone d'arrêt : dans la scène, un seul maillage, aux couleurs du joueur
    rp = pg.evaluate('() => { const m = SCENE3D.repereStand; if (!m) return null; const c = JEU.contre && JEU.couleurs.length > JEU.ia ? JEU.couleurs[JEU.ia] : REGLAGES.COULEUR_JOUEUR; return { visible: m.visible, dansScene: !!m.parent, triangles: m.geometry.attributes.position.count / 3, couleur: m.material.color.getHex() === c }; }')
    t(f'{titre} : le repère peint de la zone d’arrêt est dans la scène (un maillage, aux couleurs du joueur)', bool(rp) and rp['visible'] and rp['dansScene'] and rp['triangles'] > 0 and rp['couleur'], str(rp))
    t(f'{titre} : au départ, le message « Arrêt au stand obligatoire : tour 6 conseillé »', conseil, pg.evaluate('() => document.getElementById("hudStand").textContent'))
    pg.evaluate('() => { BOUCLE.simuler(3); JEU.joueur.pneus.usure = 0.5; JEU.joueur.versStands = true; }')
    arrete = False
    for _ in range(60):
        pg.evaluate('() => BOUCLE.simuler(2)')
        if pg.evaluate('() => !!JEU.course.arretEnCours'): arrete = True; break
    attendre(pg, '() => /^Arrêt au stand… \\d,\\d s$/.test(document.getElementById("hudStand").textContent)', None, 3000)   # (l'affichage suit à l'image suivante)
    texte = pg.evaluate('() => document.getElementById("hudStand").textContent')
    t(f'{titre} : le robot entre dans la voie et s’arrête dans la zone ; le message « Arrêt au stand… x,x s » pendant l’arrêt', arrete and re.fullmatch(r'Arrêt au stand… \d,\d s', texte) is not None and pg.evaluate('() => JEU.joueur.dansStands && JEU.joueur.u === 0'), texte)
    pg.screenshot(path=os.path.join(CAPTURES, 'stand.png'))
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(1)')
        if pg.evaluate('() => JEU.course.arrets.length === 1'): break
    attendre(pg, '() => /Pneus neufs|montés/.test(document.getElementById("hudStand").textContent)', None, 2000)   # (l'affichage suit à l'image suivante ; tour 45a : « Pneus … montés ! »)
    neufs = pg.evaluate('() => [JEU.course.arrets.length, JEU.joueur.pneus.usure, document.getElementById("hudStand").textContent, JEU.course.penalites]')
    t(f'{titre} : il repart avec des pneus neufs (« Pneus … montés ! », tour 45a), sans pénalité', neufs[0] == 1 and neufs[1] < 0.05 and 'montés' in neufs[2] and neufs[3] == 0, str(neufs))
    for _ in range(20):
        pg.evaluate('() => BOUCLE.simuler(2)')
        if pg.evaluate('() => !JEU.joueur.versStands'): break
    fin = pg.evaluate('() => [JEU.joueur.versStands, JEU.joueur.dansStands, JEU.course.tours.length, JEU.joueur.contactsMurStands, JEU.course.penalites]')
    t(f'{titre} : il ressort sur la piste, sans toucher le muret, et son tour compte', fin[0] is False and fin[1] is False and fin[2] >= 1 and fin[3] == 0 and fin[4] == 0, str(fin))
    L.append(f'  (arrêt au stand dans la page : arrêts {pg.evaluate("() => JSON.stringify(JEU.course.arrets)")}, tours {fin[2]})')

# un tracé officiel dans le jeu (tour 32 : CALENDRIER_CIRCUITS, ?circuit=<nom>) : 5 IA en course ; la page construit le bon tracé, la carte
# des IA se calcule (en fond), puis elles roulent sur la piste (la voiture suivie a avancé, elle est sur la piste) ; capture circuit-<nom>.png
def officiel_ecran(pg, titre, nom):
    t(f'{titre} : la page construit le tracé officiel « {nom} »', attendre(pg, f'() => typeof JEU !== "undefined" && NOM_CIRCUIT === "{nom}" && CIRCUIT.nom === CIRCUITS["{nom}"].nom', None, 30000), str(pg.evaluate('() => typeof NOM_CIRCUIT !== "undefined" ? NOM_CIRCUIT : null')))
    t(f'{titre} : la carte des IA se calcule (en fond)', attendre(pg, '() => !!JEU.plateau && JEU.plateau.carte !== null', None, 240000), str(pg.evaluate('() => [!!JEU.plateau, JEU.plateau && JEU.plateau.carte !== null]')))
    for _ in range(12):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.plateau.pilotes[JEU.suivie].course.progression > 400'): break
    etat = pg.evaluate('() => { const p = JEU.plateau.pilotes[JEU.suivie]; return { avance: p.course.progression, surPiste: p.v.piste.surPiste, d: p.v.piste.d, barr: JEU.plateau.pilotes.reduce((a, q) => a + q.v.contactsBarriere, 0) }; }')
    t(f'{titre} : les IA roulent sur la piste (la voiture suivie a fait plus de 400 m, elle est sur la piste, aucune barrière)', etat['avance'] > 400 and etat['surPiste'] and etat['barr'] == 0, str(etat))
    pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(CAPTURES, f'circuit-{nom}.png'))

# les consignes d'équipe (simulation.js majConsignes) quand elles visent le JOUEUR, devant son coéquipier : en championnat, Grand Prix 1,
# le robot et son coéquipier échangent leurs places sur la grille (le joueur devant), puis l'écurie lui donne la consigne (fabriquée : le
# déclenchement lui-même est testé en simulation, test.html et consignes.html) ; le message s'affiche (capture consigne.png) ; « suivie » :
# le robot lève le pied, le coéquipier passe, « Merci ! » ; « ignorée » : il ne lève pas le pied et le délai est court (3 s) ; à la fin du
# Grand Prix (« Pas de commentaire » à l'interview), la confiance de l'écurie a bougé de ±CONSIGNE_CONFIANCE, et c'est sauvegardé
def consigne_ecran(pg, titre, suivre):
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    avant = pg.evaluate('() => JEU.championnat.reputation ? JEU.championnat.reputation.ecurie : 50')
    paddock_clic(pg, '#boutonCourseSuivante')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.etat === "compte"', None, 180000)
    # le joueur et son coéquipier échangent leurs places sur la grille (le joueur devant lui)
    info = pg.evaluate('''() => { const e = JEU.plateau, P = e.pilotes, j = P.findIndex(p => p.humain), kc = CHAMPIONNAT.coequipierDe(JEU.championnat).id;
      const a = P[j], b = P[kc], pa = { s: a.v.piste.s, d: a.v.piste.d, depart: a.depart }, pb = { s: b.v.piste.s, d: b.v.piste.d, depart: b.depart };
      if (pa.depart < pb.depart) { placerSurPiste(a.v, CIRCUIT, pb.s, pb.d); placerSurPiste(b.v, CIRCUIT, pa.s, pa.d); a.depart = pb.depart; b.depart = pa.depart; e.origine = Math.min(...P.map(p => p.depart)); }
      return [j, kc, P[kc].numero]; }''')
    if not suivre: pg.evaluate('() => { REGLAGES.CONSIGNE_DELAI = 3; }')
    attendre(pg, '() => JEU.course.etat === "course" && JEU.course.temps > 1', None, 30000)
    pg.evaluate(f'''() => {{ const e = JEU.plateau, P = e.pilotes, j = {info[0]}, kc = {info[1]};
      const c = {{ devant: j, derriere: kc, numero: P[kc].numero, debut: e.temps, joueur: true, refus: false, resultat: null }};
      e.consigne = c; P[j].course.consigne = c; P[kc].course.consigne = c; if (P[kc].pilote) P[kc].pilote.passer = {{ id: P[j].v }}; }}''')
    message = attendre(pg, f'() => document.getElementById("hudStand").textContent.startsWith("Consigne de l’écurie : laisse passer ton coéquipier n°{info[2]}".replace("’", "\'")) && !document.getElementById("hudStand").classList.contains("cache")', None, 5000)
    texte = pg.evaluate('() => document.getElementById("hudStand").textContent')
    t(f'{titre} : la consigne vise le joueur, devant son coéquipier plus rapide : le message dit ce qui est demandé et ce qu’on risque', message and 'confiance' in texte, texte)
    if suivre: pg.screenshot(path=os.path.join(CAPTURES, 'consigne.png')); pg.evaluate('() => { JEU.joueur.leverLePied = 12; }')   # (il lève le pied après le message)
    for _ in range(60):
        pg.evaluate('() => BOUCLE.simuler(1)')
        if pg.evaluate('() => !!JEU.plateau.consigne.resultat'): break
    res = pg.evaluate('() => JEU.plateau.consigne.resultat')
    pg.evaluate('() => { JEU.joueur.leverLePied = 0; }')
    attendre(pg, '() => /La confiance|Consigne ignorée|Merci/.test(document.getElementById("hudStand").textContent)', None, 3000)
    apres = pg.evaluate('() => document.getElementById("hudStand").textContent')
    if suivre: t(f'{titre} : le robot lève le pied, son coéquipier passe : « suivie », « Merci ! La confiance de l’écurie monte. »', res == 'suivie' and apres.startswith('Merci'), f'{res} / {apres}')
    else: t(f'{titre} : le robot ne laisse pas passer dans le délai : « ignorée », « Consigne ignorée : la confiance de l’écurie baisse. »', res == 'ignoree' and apres.startswith('Consigne ignorée'), f'{res} / {apres}')
    for _ in range(120):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(30)
    pg.click('#boutonResultats')
    attendre(pg, '() => JEU.ecran === "resultats"')
    pg.click('#boutonChangerResultats')
    passer_interview(pg)
    attendu = max(0, min(100, avant + (1 if suivre else -1) * pg.evaluate('() => REGLAGES.CONSIGNE_CONFIANCE')))
    fin = attendre(pg, f'() => JEU.championnat.reputation.ecurie === {attendu} && JEU.championnat.confiance === {attendu} && SAUVEGARDE.championnat().reputation.ecurie === {attendu}', None, 10000)
    t(f'{titre} : à la fin du Grand Prix, la confiance de l’écurie {"monte" if suivre else "baisse"} de CONSIGNE_CONFIANCE ({avant} → {attendu}), sauvegardée', fin,
      str(pg.evaluate('() => [JEU.ecran, JEU.championnat.reputation, JEU.championnat.confiance]')))

# ?lang=en : la page en anglais : lang et title remplis au démarrage, puis le classement du championnat, le podium et les
# résultats sans un mot français (les 11 textes en dur de l'audit) ; le robot joue le Grand Prix 1 (un tour)
MOTS_FR = r'(?i)Écurie|Pilote|\bToi\b|Tu marques|Course suivante|Continuer|Pénalit|Résultat|n°|Solde|Gains'   # (sans tenir compte des capitales : les titres du thème télé sont en capitales à l'écran, innerText les rend ainsi)
def championnat_en(pg, titre):
    t(f'{titre} : <html lang> et le titre de la page viennent de textes.js (en)', pg.evaluate('() => document.documentElement.lang === "en" && LANGUE === "en" && document.title === texte("nomDuJeu")'))
    ecran = pg.evaluate('''() => ({ titre: document.getElementById("championnatTitre").textContent, h2: [...document.querySelectorAll("#championnatTableaux h2")].map(e => e.textContent),
      pilotes: [...document.querySelectorAll("#championnatPilotes li .nom")].map(e => e.textContent), ecuries: [...document.querySelectorAll("#championnatEcuries li .nom")].map(e => e.textContent),
      bouton: document.getElementById("boutonCourseSuivante").textContent, tout: document.getElementById("championnat").innerText })''')
    t(f'{titre} : l’écran du championnat en anglais : « Grand Prix 1 / 12 — Bahrayn », « Drivers · Division 4 » / Teams (une carrière neuve en division 4, tour 49d), « You » et « Driver n », « Team n », « Next race », pas un mot français',
      ecran['titre'] == 'Grand Prix 1 / 12 — Bahrayn' and ecran['h2'] == ['Drivers · Division 4', 'Teams'] and all(re.fullmatch(r'Driver \d+|You', n) for n in ecran['pilotes']) and ecran['pilotes'].count('You') == 1
      and all(re.fullmatch(r'Team \d+', n) for n in ecran['ecuries']) and ecran['bouton'] == 'Next race' and not re.search(MOTS_FR, ecran['tout']), str(ecran)[:400])
    paddock_clic(pg, '#boutonCourseSuivante')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    for _ in range(80):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    podium = pg.evaluate('() => ({ ecran: JEU.ecran, marches: [...document.querySelectorAll("#podiumMarches .marche")].map(e => e.innerText), bouton: document.getElementById("boutonResultats").textContent, tout: document.getElementById("podium").innerText })')
    t(f'{titre} : le podium en anglais : « No. n », le temps avec le point, « Results », pas un mot français', podium['ecran'] == 'podium' and len(podium['marches']) == 3
      and all(re.search(r'No\. \d+', m) and re.search(r'\d:\d\d\.\d{3}', m) for m in podium['marches']) and podium['bouton'] == 'Results' and not re.search(MOTS_FR, podium['tout']), str(podium))
    pg.click('#boutonResultats')
    attendre(pg, '() => JEU.ecran === "resultats"')
    res = pg.evaluate('() => ({ entete: [...document.querySelectorAll("#resultatsEntete th")].map(e => e.textContent).join(","), texte: document.getElementById("resultats").innerText })')
    t(f'{titre} : les résultats en anglais (Pos, No, Time, Penalty, Gap, Grid ; « Continue »)', res['entete'] == 'Pos,No,Time,Penalty,Gap,Grid' and 'Continue' in res['texte'] and not re.search(MOTS_FR, res['texte']), str(res)[:300])
    pg.click('#boutonChangerResultats')
    attendre(pg, '() => JEU.ecran === "interview"', None, 10000)
    t(f'{titre} : après les résultats, l’interview en anglais (« Post-race interview », « Skip »), pas un mot français', not re.search(MOTS_FR, pg.evaluate('() => document.getElementById("interview").innerText'))
      and 'post-race interview' in pg.evaluate('() => document.getElementById("interview").innerText').lower() and 'skip' in pg.evaluate('() => document.getElementById("interview").innerText').lower(), pg.evaluate('() => document.getElementById("interview").innerText')[:300])
    interview_ecran(pg, titre, 'calme', gp='en anglais : ')
    t(f'{titre} : après les résultats, la une du journal en anglais, pas un mot français', attendre(pg, '() => JEU.ecran === "une"') and not re.search(MOTS_FR, pg.evaluate('() => document.getElementById("une").innerText')),
      pg.evaluate('() => document.getElementById("une").innerText')[:300])
    une_ecran(pg, titre, 'une-en.png')
    t(f'{titre} : après le Grand Prix, « You scored n points » et le classement en anglais', attendre(pg, '() => JEU.ecran === "championnat" && /^You scored \\d+ points?$/.test(document.getElementById("championnatGagne").textContent)')
      and not re.search(MOTS_FR, pg.evaluate('() => document.getElementById("championnat").innerText')), pg.evaluate('() => document.getElementById("championnatGagne").textContent'))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, 'championnat-en.png'))

# le mode 2 joueurs (deux-joueurs.js, CLAUDE.md « Le mode 2 joueurs (écran partagé) ») : ?deux=1&ia=5, les deux joueurs conduits par le
# robot ; l'écran partagé haut (joueur 1) / bas (joueur 2), la tour partagée, ni radar ni bandeau seul, feux et jauge de chacun dans sa
# moitié, rien ne déborde ; la mesure de la 3D dessinée deux fois (images/s, triangles, appels) contre une seule vue de la même scène
def deux_ecran(pg, titre, l, h, page):
    def image():
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } BOUCLE.demarrer(); return window.__images; }')
        attendre(pg, 'n => window.__images > n + 1', n, 20000)
    def boite(sel):
        return pg.evaluate('s => { const e = document.querySelector(s); if (!e || e.classList.contains("cache") || getComputedStyle(e).display === "none") return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', sel)
    def dans(b, x1, y1, x2, y2): return b is not None and b[0] >= x1 - 2 and b[1] >= y1 - 2 and b[2] <= x2 + 2 and b[3] <= y2 + 2
    etat = pg.evaluate('() => ({ deux: !!JEU.deux, nb: JEU.plateau.pilotes.length, joueurs: DEUX_JOUEURS.joueurs(JEU.plateau).map(p => p.humain && p.joueur), partage: SCENE3D.partage, corps: document.body.classList.contains("deux"), ecran: JEU.ecran, modeles: JEU.modeles.length, detailles: JEU.modeles.filter(m => m.detaille).length })')
    t(f'{titre} : ?deux=1&ia=5 : 7 voitures (2 joueurs + 5 IA), les deux joueurs humains, l’écran partagé allumé, la course tout de suite (pas de qualification)',
      etat['deux'] and etat['nb'] == 7 and etat['joueurs'] == [1, 2] and etat['partage'] and etat['corps'] and etat['ecran'] == 'course' and etat['modeles'] == 7 and etat['detailles'] == 2, str(etat))
    t(f'{titre} : la carte des IA arrive, les 5 IA ont leur pilote, la grille est tirée (les deux joueurs côte à côte)',
      attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.filter(p => p.pilote).length === 5 && JEU.plateau.grille && (() => { const [a, b] = DEUX_JOUEURS.joueurs(JEU.plateau); const g = JEU.plateau.grille.map(x => x.numero); return g.indexOf(b.numero) === g.indexOf(a.numero) + 1; })()', None, 120000),
      str(pg.evaluate('() => [JEU.plateau.carte !== null, JEU.plateau.grille]')))
    # les feux : on les retient pour voir les deux jeux de feux et les deux jauges, chacun dans sa moitié
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
    t(f'{titre} : les 5 feux du joueur 1 en haut et leur copie en bas, allumés pareil', attendre(pg, '() => !document.getElementById("feux").classList.contains("cache") && !document.getElementById("feux2").classList.contains("cache") && document.querySelectorAll("#feux span.allume").length === 5 && document.querySelectorAll("#feux2 span.allume").length === 5', None, 20000),
      pg.evaluate('() => [document.getElementById("feux").className, document.getElementById("feux2").className]'))
    f1, f2, j1, j2 = boite('#feux'), boite('#feux2'), boite('#jauge'), boite('#jauge2')
    t(f'{titre} : côte à côte : les feux et la jauge du joueur 1 sont dans la moitié gauche, ceux du joueur 2 dans la moitié droite', dans(f1, 0, 0, l / 2, h) and dans(j1, 0, 0, l / 2, h) and dans(f2, l / 2, 0, l, h) and dans(j2, l / 2, 0, l, h), str([f1, j1, f2, j2]))
    if l == 1280 and 'technique' not in page: pg.screenshot(path=os.path.join(CAPTURES, 'deux-feux.png'))
    # la piste sous chaque voiture (en pixels, la boucle arrêtée, l'image lue juste après SCENE3D.dessiner) : la route est grise (PISTE_GRIS_ECART_MAX),
    # l'herbe est verte ; vu au tour 25b : à 2 cm sous la route, l'herbe gagnait parfois le tampon de profondeur (SOL_RECUL_PROFONDEUR)
    PISTE = '''(zones) => { BOUCLE.arreter(); const c = SCENE3D.canvas, l = c.width, h = c.height, k = document.createElement('canvas'); k.width = l; k.height = h; const ctx = k.getContext('2d');
      SCENE3D.dessiner(); ctx.drawImage(c, 0, 0); const res = [];
      for (const z of zones) { const x0 = Math.round(z[0] * l), y0 = Math.round(z[1] * h), w = Math.round(z[2] * l) - x0, ht = Math.round(z[3] * h) - y0, d = ctx.getImageData(x0, y0, w, ht).data; let gris = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { n++; const m = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]); if (m <= REGLAGES.PISTE_GRIS_ECART_MAX) gris++; }
        res.push({ gris: Math.round(100 * gris / n), exemple: [d[0], d[1], d[2]].join(',') }); }
      BOUCLE.demarrer(); return res; }'''
    # (tour 50c, le test instable du 2026-11-05) les deux caméras rejoignent leur place derrière la voiture en quelques images (lissées) ;
    # sous swiftshader, la lecture pouvait venir avant : on attend qu'elles ne bougent plus d'une image à l'autre (les feux retenus, rien ne roule)
    attendre(pg, '''() => { const p = [SCENE3D.camera, SCENE3D.camera2].map(c => c.position.x.toFixed(2) + ',' + c.position.y.toFixed(2) + ',' + c.position.z.toFixed(2)).join(';');
      const ok = window.__camerasAvant === p; window.__camerasAvant = p; return ok; }''', None, 20000)
    piste = pg.evaluate(PISTE, [[0.20, 0.93, 0.30, 0.99], [0.70, 0.93, 0.80, 0.99]])
    t(f'{titre} : la piste est dessinée sous chaque voiture : sur la grille, sous le joueur 1 (bas de la moitié gauche) et sous le joueur 2 (bas de la moitié droite), au moins 90 % de pixels gris de route', all(p['gris'] >= 90 for p in piste), str(piste))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    t(f'{titre} : les deux robots partent après les feux (chacun son départ)', attendre(pg, '() => DEUX_JOUEURS.joueurs(JEU.plateau).every(p => p.course.etat === "course" && p.course.depart.lance !== null)', None, 20000), str(pg.evaluate('() => DEUX_JOUEURS.joueurs(JEU.plateau).map(p => [p.course.etat, p.course.depart.resultat])')))
    pg.evaluate('() => BOUCLE.simuler(12)'); image()
    cams = pg.evaluate('() => { const [a, b] = DEUX_JOUEURS.joueurs(JEU.plateau), c1 = SCENE3D.camera.position, c2 = SCENE3D.camera2.position; return { d1: Math.hypot(c1.x - a.v.x, c1.z - a.v.z), d2: Math.hypot(c2.x - b.v.x, c2.z - b.v.z), entre: Math.hypot(c1.x - c2.x, c1.z - c2.z), aspect: [SCENE3D.camera.aspect, SCENE3D.camera2.aspect], fov: [SCENE3D.camera.fov, SCENE3D.camera2.fov], fovBase: REGLAGES.DEUX_FOV_COTE }; }')
    t(f'{titre} : deux vues : la caméra de gauche est derrière le joueur 1, celle de droite derrière le joueur 2 (à moins de 30 m chacune, distinctes), à la proportion d’une moitié (étroite et haute), avec le champ de vision DEUX_FOV_COTE', cams['d1'] < 30 and cams['d2'] < 30 and cams['entre'] > 1 and abs(cams['aspect'][0] - (l / 2) / h) < 0.05 and cams['aspect'][0] == cams['aspect'][1] and cams['fov'][0] >= cams['fovBase'] and cams['fov'][1] >= cams['fovBase'], str(cams))
    LIRE_HUD = '() => { const lire = id => [...document.querySelectorAll("#" + id + " span")].map(s => s.textContent); return { haut: lire("deuxHaut"), bas: lire("deuxBas"), tour: document.querySelectorAll("#classementListe li").length, classementCache: document.getElementById("classement").classList.contains("cache"), radar: getComputedStyle(document.getElementById("radar")).display, bandeau: getComputedStyle(document.getElementById("hudCourse")).display, tableau: getComputedStyle(document.getElementById("tableau")).display, moi: document.querySelectorAll("#classementListe li.moi").length, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'
    hud = pg.evaluate(LIRE_HUD)
    t(f'{titre} : l’affichage de chaque moitié : « Joueur 1 », place, Tour 1 / 3, vitesse en km/h ; pareil pour le joueur 2', len(hud['haut']) == 5 and re.fullmatch(r'🔵 (Joueur|Player) 1', hud['haut'][0]) and re.fullmatch(r'P[1-7]', hud['haut'][1]) and re.fullmatch(r'(Tour|Lap) 1 / 3', hud['haut'][2]) and re.fullmatch(r'\d+ km/h', hud['haut'][3])
      and re.fullmatch(r'🔴 (Joueur|Player) 2', hud['bas'][0]) and re.fullmatch(r'P[1-7]', hud['bas'][1]) and re.fullmatch(r'\d+ km/h', hud['bas'][3]) and hud['haut'][1] != hud['bas'][1], str(hud))
    # le commentateur à deux : le bandeau des messages gênerait une moitié (le haut du milieu est à la tour partagée) : il est coupé à deux
    t(f'{titre} : à deux, le commentateur est coupé (aucun bandeau de messages par-dessus une moitié)', pg.evaluate('() => document.getElementById("messageCourse").classList.contains("cache") && !JEU.commentaire'), pg.evaluate('() => document.getElementById("messageCourse").textContent'))
    t(f'{titre} : UNE tour de classement partagée (7 lignes, les deux joueurs marqués), ni radar, ni bandeau de la course seule, ni compteur', hud['tour'] == 7 and not hud['classementCache'] and hud['moi'] == 2 and hud['radar'] == 'none' and hud['bandeau'] == 'none' and hud['tableau'] == 'none', str(hud))
    bh, bb, bc, sep, son = boite('#deuxHaut'), boite('#deuxBas'), boite('#classement'), boite('#deuxSeparation'), boite('#boutonSon')
    croise = lambda a, b: a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    t(f'{titre} : rien ne déborde en {l}×{h} : l’affichage du joueur 1 en haut de la moitié gauche, celui du joueur 2 en haut de la moitié droite, la tour en haut au milieu (à cheval sur le trait vertical, sans toucher les affichages), le bouton du son hors des affichages, pas de défilement',
      dans(bh, 0, 0, l / 2, h) and dans(bb, l / 2, 0, l, h) and bh[1] < h / 4 and bb[1] < h / 4 and dans(bc, 0, 0, l, h) and bc[0] < l / 2 < bc[2] and bc[1] < h / 4 and bc[2] - bc[0] < l / 4 and not croise(bc, bh) and not croise(bc, bb) and son is not None and not croise(son, bh) and not croise(son, bb)
      and sep is not None and abs((sep[0] + sep[2]) / 2 - l / 2) < 2 and sep[3] - sep[1] > h - 4 and pas_de_defilement(hud['defile']), str([bh, bb, bc, sep, son, hud['defile']]))
    pg.wait_for_timeout(300)
    if 'technique' not in page: pg.screenshot(path=os.path.join(CAPTURES, 'deux-joueurs.png' if l == 1280 else 'deux-joueurs-960.png'))
    # la mesure : la même scène dessinée deux fois (écran partagé) contre une fois (une seule vue), 2 s chacune, la boucle tournant
    def mesure():
        n0 = pg.evaluate('() => window.__images'); pg.wait_for_timeout(2000); n1 = pg.evaluate('() => window.__images')
        return [round((n1 - n0) / 2), pg.evaluate('() => SCENE3D.trianglesDessines'), pg.evaluate('() => SCENE3D.appelsDessin')]
    pg.evaluate('() => { JEU.ecran = "pause"; }')   # la physique s'arrête, l'image continue : la mesure compare le dessin seul
    deux = mesure()
    pg.evaluate('() => { window.__deux = JEU.deux; JEU.deux = null; SCENE3D.partager(false); }'); pg.wait_for_timeout(300); seule = mesure()   # (sans JEU.deux, la boucle ne rallume pas le partage)
    pg.evaluate('() => { JEU.deux = window.__deux; SCENE3D.partager(true); JEU.ecran = "course"; }')
    circuit = 'technique' if 'technique' in page else 'test'
    L.append(f'  (2 joueurs + 5 IA sur {circuit}, {l}×{h}, swiftshader : écran partagé {deux[0]} i/s, {deux[1]} triangles, {deux[2]} appels ; une seule vue {seule[0]} i/s, {seule[1]} triangles, {seule[2]} appels)')
    t(f'{titre} : l’écran partagé dessine la scène deux fois : plus d’appels de dessin et plus de triangles qu’une seule vue (environ le double : chaque caméra voit sa part du circuit), moins du triple', deux[2] > seule[2] and deux[1] > seule[1] and deux[1] < 3 * seule[1] and deux[2] < 3 * seule[2], str([deux, seule]))
    if l == 1280 and circuit == 'test':
        pg.evaluate('() => BOUCLE.arreter()'); pg.evaluate('() => BOUCLE.simuler(260)'); pg.evaluate('() => BOUCLE.demarrer()')
        t(f'{titre} : la course finit : les 7 voitures arrivent, le podium vient (une seule vue), les 7 classées', attendre(pg, '() => JEU.ecran === "podium" && !SCENE3D.partage && JEU.plateau.pilotes.every(p => p.arrivee !== null) && JEU.final && JEU.final.length === 7', None, 60000),
          str(pg.evaluate('() => [JEU.ecran, SCENE3D.partage, JEU.plateau.pilotes.map(p => p.arrivee)]')))
        sauve = pg.evaluate('() => { const d = JSON.parse(localStorage.getItem(SAUVEGARDE.CLE) || "{}"); return { championnat: d.championnat || null, records: Object.keys(d.records || {}).length, reaction: d.reaction === undefined ? null : d.reaction }; }')
        t(f'{titre} : la sauvegarde de la carrière n’a pas bougé (ni championnat, ni record, ni temps de réaction)', sauve['championnat'] is None and sauve['records'] == 0 and sauve['reaction'] is None, str(sauve))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'deux-podium.png'))

# le mode 2 joueurs, les écrans autour (tour 25b, ordre 3) : « Entre amis » ouvre le petit menu (l'écran partagé ; le tournoi « bientôt »),
# l'écran avant la course (nom, couleur, casque de chaque joueur ; circuit, tours, IA, niveau), refuse deux noms ou deux couleurs pareils,
# écrit les réglages à part de la carrière et ouvre la course à deux ; les robots la finissent ; le podium met les deux joueurs en valeur ;
# la rivalité (« Léo 1 – 0 Sarah ») ; « Revanche » : un commercialBreak (faux SDK) puis la même course, grille retirée ; « Menu » : un
# commercialBreak puis le menu ; jamais de commercialBreak pendant une course ; la carrière n'a pas bougé
def JEU_PODIUM(pg): return attendre(pg, '() => JEU.ecran === "podium" && JEU.final && JEU.final.length === 5', None, 60000)
# les touches de chaque joueur à deux (touches.js, le propriétaire 2026-11-02 : « 2 joueurs il faudrait montrer les touches ») : avant la course, la
# carte de chacun dans sa couleur ; pendant les feux, le rappel en bas de chaque moitié, qui s'efface quand le joueur a utilisé ses quatre
# commandes (et pas celui de l'autre), ou DEUX_RAPPEL_DUREE s après l'extinction ; dans le menu pause, les touches des deux ; rien ne déborde
def touches_deux(pg, titre, l, h):
    def dans(sel):
        return pg.evaluate('s => [...document.querySelectorAll(s)].every(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; })', sel)
    pg.click('#boutonAmis'); pg.click('#boutonAmisDeux')
    c = pg.evaluate("""() => [1, 2].map(i => { const p = document.querySelector('#deuxJoueur' + i + ' .deuxTouches'); return { texte: p.innerText, lignes: p.querySelectorAll('br').length + 1, bord: getComputedStyle(p).borderLeftColor, couleur: document.getElementById('deuxCouleurs' + i).dataset.couleur }; })""")
    hexa = lambda n: 'rgb(%d, %d, %d)' % ((int(n) >> 16) & 255, (int(n) >> 8) & 255, int(n) & 255)
    t(f'{titre} : avant la course, la carte des touches de chaque joueur, dans sa couleur : le joueur 1 Z/W Q/A S D (le clavier inconnu : les deux) et E, le joueur 2 les flèches et Entrée, la pause',
      len(c) == 2 and all(x['lignes'] == 2 and x['bord'] == hexa(x['couleur']) for x in c) and (('Z/W' in c[0]['texte'] and 'Q/A' in c[0]['texte']) or pg.evaluate('() => !!(navigator.keyboard && navigator.keyboard.getLayoutMap)')) and all(k in c[0]['texte'] for k in ('S', 'D', 'E')) and all(k in c[1]['texte'] for k in ('↑', '↓', '←', '→', pg.evaluate('() => texte("tch_entree")'))) and pg.evaluate('() => texte("tch_echap")') in c[0]['texte'], str(c))
    t(f'{titre} : les cartes tiennent dans l’écran ({l}×{h})', dans('#deuxJoueur1 .deuxTouches, #deuxJoueur2 .deuxTouches, #boutonDeuxPartir'))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, f'touches-reglages-{l}.png'))
    pg.select_option('#deuxIA', '0'); pg.select_option('#deuxTours', '3'); pg.select_option('#deuxCircuit', 'test')
    with pg.expect_navigation(): pg.click('#boutonDeuxPartir')
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.deux && JEU.ecran === "course" && JEU.rappelDeux', None, 30000)
    attendre(pg, '() => JEU.plateau && JEU.plateau.carte !== null && JEU.course.etat === "compte"', None, 240000)
    r = pg.evaluate('() => [1, 2].map(j => { const e = document.getElementById("deuxRappel" + j); return { vu: !e.classList.contains("cache"), n: e.querySelectorAll(".touche").length, texte: e.textContent }; })')
    t(f'{titre} : pendant les feux, le rappel des touches en bas de chaque moitié (4 commandes chacun)', all(x['vu'] and x['n'] == 4 for x in r) and dans('.deuxRappel:not(.cache)'), str(r))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, f'touches-feux-{l}.png'))
    # le joueur 1 utilise ses quatre commandes (une à une) : son rappel s'efface, celui du joueur 2 reste
    for k in ('KeyW', 'KeyS', 'KeyA', 'KeyD'):
        pg.keyboard.down(k); pg.wait_for_timeout(250); pg.keyboard.up(k)
    pg.wait_for_timeout(300)
    r = pg.evaluate('() => [1, 2].map(j => !document.getElementById("deuxRappel" + j).classList.contains("cache"))')
    t(f'{titre} : le joueur 1 a utilisé ses quatre commandes : son rappel s’efface, celui du joueur 2 reste', r == [False, True], str([r, pg.evaluate('() => JEU.rappelDeux')]))
    # le temps passe après l'extinction : le rappel du joueur 2 s'efface aussi (au plus DEUX_RAPPEL_DUREE s)
    # (tour 48b) on attend l'image qui les efface (sous swiftshader, 300 ms peuvent passer sans une image), 5 s au plus
    pg.evaluate('() => { JEU.rappelDeux.t = REGLAGES.DEUX_RAPPEL_DUREE; }')
    t(f'{titre} : DEUX_RAPPEL_DUREE s après l’extinction des feux, plus aucun rappel', attendre(pg, '() => document.querySelectorAll(".deuxRappel:not(.cache)").length === 0'), str(pg.evaluate('() => [document.querySelectorAll(".deuxRappel:not(.cache)").length, JEU.rappelDeux]')))
    pg.keyboard.press('Escape')
    p = pg.evaluate('() => ({ ecran: JEU.ecran, vu: !document.getElementById("pauseTouches").classList.contains("cache"), texte: document.getElementById("pauseTouches").innerText })')
    t(f'{titre} : dans le menu pause, les touches des deux joueurs (🔵 et 🔴)', p['ecran'] == 'pause' and p['vu'] and '🔵' in p['texte'] and '🔴' in p['texte'] and '↑' in p['texte'] and dans('#pause > *:not(.cache)'), str(p))   # (tour 52b : les rangées cachées, comme celle du téléphone, ont une largeur nulle : elles ne comptent pas)
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, f'touches-pause-{l}.png'))
    pg.keyboard.press('Escape')

def amis(pg, titre, l, h):
    J = '() => window.APPELS_SDK.join(",")'
    def boite(sel):
        return pg.evaluate('s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', sel)
    def tient(ids):   # chaque élément est dans l'image, sans défilement
        b = [boite(s) for s in ids]
        d = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
        return all(x is not None and x[0] >= -1 and x[1] >= -1 and x[2] <= l + 1 and x[3] <= h + 1 and x[2] > x[0] for x in b) and pas_de_defilement(d), str([b, d])
    pg.click('#boutonAmis')
    t(f'{titre} : « Entre amis » (titre) ouvre le petit menu : « Écran partagé (2 joueurs) », « Tournoi chrono (2 à 8 joueurs) » (ouvert depuis le tour 26b), « Retour »',
      pg.evaluate('() => JEU.ecran === "amis" && !document.getElementById("amis").classList.contains("cache") && document.getElementById("boutonAmisDeux").textContent === texte("amisDeux") && !document.getElementById("boutonAmisTournoi").disabled && document.getElementById("boutonAmisTournoi").textContent === texte("amisTournoi")'),
      str(pg.evaluate('() => JEU.ecran')))
    ok_, det = tient(['#amisTitre', '#boutonAmisDeux', '#boutonAmisTournoi', '#boutonAmisRetour'])
    t(f'{titre} : le menu tient en {l}×{h}', ok_, det)
    if l == 1280: pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'entre-amis.png'))
    pg.click('#boutonAmisDeux')
    reg = pg.evaluate('() => ({ ecran: JEU.ecran, n1: document.getElementById("deuxNom1").value, p1: document.getElementById("deuxNom1").placeholder, c: [1, 2].map(i => Number(document.getElementById("deuxCouleurs" + i).dataset.couleur)), pastilles: document.querySelectorAll("#deuxCouleurs1 button").length, circuits: [...document.getElementById("deuxCircuit").options].map(o => o.value), tours: [...document.getElementById("deuxTours").options].map(o => o.value), ia: [...document.getElementById("deuxIA").options].map(o => o.value), niveaux: document.getElementById("deuxNiveau").options.length, motifs: document.getElementById("deuxMotif1").options.length, bloques: document.querySelectorAll("#deuxMotif1 option:disabled").length, icones: document.querySelectorAll(".deuxIcone canvas").length })')
    t(f'{titre} : l’écran avant la course : nom (vide, « Joueur 1 » en attente), couleur (le bleu et le rouge d’abord), casque (tous les motifs, son icône) de chaque joueur ; circuits, 3/5 tours, 0/3/5 IA, 4 niveaux',
      reg['ecran'] == 'deuxReglages' and reg['n1'] == '' and reg['p1'] in ('Joueur 1', 'Player 1') and reg['c'] == [0x1f6fe0, 0xd8262e] and reg['pastilles'] == 8 and reg['circuits'] == pg.evaluate('() => Object.keys(CIRCUITS)') and len(reg['circuits']) == 14 and reg['tours'] == ['3', '5'] and reg['ia'] == ['0', '3', '5'] and reg['niveaux'] == 4 and reg['motifs'] == 14 and reg['bloques'] == 8 and reg['icones'] == 2, str(reg))
    ok_, det = tient(['#deuxTitre', '#deuxJoueur1', '#deuxJoueur2', '#deuxCourse', '#boutonDeuxPartir', '#boutonDeuxRetour'])
    t(f'{titre} : l’écran avant la course tient en {l}×{h} (les deux joueurs côte à côte, rien ne déborde)', ok_, det)
    if l == 960:
        pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'deux-reglages-960.png'))
        pg.click('#boutonDeuxRetour'); pg.click('#boutonAmisRetour')
        t(f'{titre} : « Retour » revient au menu, puis au titre', pg.evaluate('() => JEU.ecran === "titre"'), str(pg.evaluate('() => JEU.ecran')))
        return
    # deux noms pareils, puis deux couleurs pareilles : refusés, la page reste
    pg.fill('#deuxNom1', 'Léo'); pg.fill('#deuxNom2', ' léo ')
    pg.click('#boutonDeuxPartir')
    t(f'{titre} : deux noms pareils (majuscules et espaces comptés pareil) sont refusés', pg.evaluate('() => JEU.ecran === "deuxReglages" && document.getElementById("deuxErreur").textContent === texte("deuxErreurNom") && SAUVEGARDE.deux() === null'), str(pg.evaluate('() => [JEU.ecran, document.getElementById("deuxErreur").textContent]')))
    pg.fill('#deuxNom2', 'Sarah'); pg.click('#deuxCouleurs2 button:nth-child(1)')
    pg.click('#boutonDeuxPartir')
    t(f'{titre} : deux couleurs pareilles sont refusées', pg.evaluate('() => JEU.ecran === "deuxReglages" && document.getElementById("deuxErreur").textContent === texte("deuxErreurCouleur") && SAUVEGARDE.deux() === null'), str(pg.evaluate('() => [JEU.ecran, document.getElementById("deuxErreur").textContent]')))
    pg.click('#deuxCouleurs2 button:nth-child(4)')   # le vert
    pg.select_option('#deuxMotif2', 'damier'); pg.select_option('#deuxIA', '3'); pg.select_option('#deuxTours', '3'); pg.select_option('#deuxNiveau', 'debutant'); pg.select_option('#deuxCircuit', 'test')
    t(f'{titre} : deux couleurs différentes : le message d’erreur disparaît dès le nouveau choix', pg.evaluate('() => document.getElementById("deuxErreur").textContent === ""'), pg.evaluate('() => document.getElementById("deuxErreur").textContent'))
    rb = pg.evaluate('() => { const b = document.getElementById("boutonDeuxRetour").getBoundingClientRect(), p = document.getElementById("boutonDeuxPartir").getBoundingClientRect(); return [b.top + b.height / 2, p.top + p.height / 2, b.height, p.height]; }')
    t(f'{titre} : le petit bouton « Retour » est centré sur la ligne de « C’est parti ! », pas étiré', abs(rb[0] - rb[1]) < 2 and rb[2] < rb[3], str(rb))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'deux-reglages.png'))
    carriere = pg.evaluate('() => localStorage.getItem(SAUVEGARDE.CLE) && JSON.stringify(JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat)')
    with pg.expect_navigation(): pg.click('#boutonDeuxPartir')
    t(f'{titre} : « C’est parti ! » écrit les réglages (à part de la carrière) et ouvre la course à deux : les noms, les couleurs, les casques, 3 IA, 3 tours, débutant',
      attendre(pg, '''() => typeof JEU !== "undefined" && JEU.deux && JEU.plateau && JEU.ecran === "course" && JEU.plateau.pilotes.length === 5 && JEU.course.nbTours === 3 && REGLAGES.NIVEAU === "debutant" && NOM_CIRCUIT === "test"
        && JEU.deux.reglages.joueurs.map(j => j.nom).join() === "Léo,Sarah" && JEU.couleurs[3] === 0x1f6fe0 && JEU.couleurs[4] === 0x2fa84f && casqueDe(4).motif === "damier" && SAUVEGARDE.deux().joueurs[1].couleur === 0x2fa84f''', None, 30000),
      str(pg.evaluate('() => typeof JEU === "undefined" ? null : [JEU.ecran, JEU.deux && JEU.deux.reglages, JEU.couleurs, REGLAGES.NIVEAU]')))
    t(f'{titre} : la carte arrive, la grille est tirée', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.grille', None, 120000))
    pg.evaluate('() => { JEU.robot = true; }')
    def finir():
        pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(260); BOUCLE.demarrer(); }')
        return attendre(pg, '() => JEU.ecran === "podium" && JEU.final && JEU.final.length === 5', None, 60000)
    sous_course = pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(20); BOUCLE.demarrer(); return [JEU.ecran, window.APPELS_SDK.join(",")]; }')
    pg.wait_for_timeout(300)
    hud = pg.evaluate('() => [...document.querySelectorAll(".deuxNom")].map(s => s.textContent)')
    t(f'{titre} : chaque moitié affiche le nom de son joueur', [h.replace(' 🛞', '') for h in hud] == ['🔵 Léo', '🔴 Sarah'], str(hud))
    t(f'{titre} : la course finit, le podium vient', finir(), str(pg.evaluate('() => [JEU.ecran, JEU.final && JEU.final.length]')))
    pod = pg.evaluate('''() => { const [a, b] = DEUX_JOUEURS.joueurs(JEU.plateau), P = JEU.plateau.pilotes, pl = p => JEU.final.find(x => x.k === P.indexOf(p)).place;
      return { places: [pl(a), pl(b)], texte: document.getElementById("podiumDeux").textContent, cache: document.getElementById("podiumDeux").classList.contains("cache"),
        marches: [...document.querySelectorAll("#podiumMarches .marche")].map(m => m.className + " " + m.querySelector("strong").textContent), riv: SAUVEGARDE.deux().rivalite }; }''')
    marques = [m for m in pod['marches'] if 'joueur' in m]
    attendues = sum(1 for p in pod['places'] if p <= 3)
    t(f'{titre} : le podium met les deux joueurs en valeur : leur place à tous les deux (même hors du podium), et sur les marches leur nom et leur couleur',
      not pod['cache'] and 'Léo' in pod['texte'] and 'Sarah' in pod['texte'] and f'P{pod["places"][0]}' in pod['texte'] and f'P{pod["places"][1]}' in pod['texte'] and len(marques) == attendues and all(('Léo' in m) if 'joueur1' in m else ('Sarah' in m) for m in marques), str(pod))
    g = 0 if pod['places'][0] < pod['places'][1] else 1
    t(f'{titre} : la rivalité est comptée une fois et sauvegardée : 1 point à celui qui a fini devant', pod['riv'] == {'noms': ['Léo', 'Sarah'], 'score': [1 - g, g]}, str(pod))
    pg.click('#boutonResultats')
    res = pg.evaluate('() => ({ ecran: JEU.ecran, riv: document.getElementById("resultatsRivalite").textContent, cache: document.getElementById("resultatsRivalite").classList.contains("cache"), moi: [...document.querySelectorAll("#resultatsLignes tr.moi")].map(tr => tr.children[1].textContent.trim()), boutons: [document.getElementById("boutonRejouerResultats").textContent, document.getElementById("boutonChangerResultats").textContent] })')
    t(f'{titre} : les résultats : les deux joueurs marqués par leur nom, le score de la rivalité (« Léo {1 - g} – {g} Sarah »), « Revanche » et « Menu »',
      res['ecran'] == 'resultats' and not res['cache'] and res['riv'].endswith(f'Léo {1 - g} – {g} Sarah') and sorted(res['moi']) == ['Léo', 'Sarah'] and res['boutons'] == [pg.evaluate('() => texte("revanche")'), pg.evaluate('() => texte("menuAmis")')], str(res))
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'rivalite.png'))
    appels = pg.evaluate(J)
    t(f'{titre} : Poki : gameplayStart à la course, gameplayStop au podium, aucun commercialBreak avant le clic', 'commercialBreak' not in appels and appels.endswith('gameplayStart,gameplayStop') and ',gameplayStart,gameplayStart' not in appels and ',gameplayStop,gameplayStop' not in appels, appels)
    grille1 = pg.evaluate('() => [JEU.plateau.graine, JEU.plateau.grille.map(x => x.numero).join()]')
    pg.click('#boutonRejouerResultats')
    t(f'{titre} : « Revanche » : un commercialBreak (le jeu arrêté avant), puis la même course (mêmes joueurs, 3 IA, 3 tours) avec une autre graine de grille',
      attendre(pg, '() => JEU.ecran === "course" && JEU.course.etat === "compte" && JEU.final === null', None, 10000) and pg.evaluate(J) == appels + ',commercialBreak'
      and pg.evaluate(f'() => JEU.plateau.pilotes.length === 5 && JEU.course.nbTours === 3 && JEU.plateau.graine !== {grille1[0]} && JEU.deux.revanche === 1'), str([grille1, pg.evaluate('() => [JEU.ecran, JEU.plateau.graine, JEU.plateau.grille && JEU.plateau.grille.map(x => x.numero).join()]'), pg.evaluate(J)]))
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(20); BOUCLE.demarrer(); }')
    t(f'{titre} : pendant la revanche, pas de pub : gameplayStart aux feux éteints', attendre(pg, '() => JEU.ecran === "course" && window.APPELS_SDK.slice(-1)[0] === "gameplayStart"', None, 10000) and pg.evaluate(J).count('commercialBreak') == 1, pg.evaluate(J))
    # la revanche : les deux joueurs finissent, puis « passer » : le reste de la course en accéléré (les deux ont fini : c'est permis)
    # (les deux joueurs « finissent » 15 s après le départ, on leur donne leurs tours : les IA ont encore la course à faire)
    pg.evaluate('''() => { BOUCLE.arreter(); let n = 0; while (!(JEU.course.etat === "course" && JEU.plateau.temps > 15) && n++ < 200 * 120) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE);
      for (const p of DEUX_JOUEURS.joueurs(JEU.plateau)) { const c = p.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; } BOUCLE.demarrer(); }''')
    attendre(pg, '() => !!JEU.attente', None, 20000)
    attente = pg.evaluate('() => [!!JEU.attente, DEUX_JOUEURS.finie(JEU.plateau), ARRIVEE.restantes(JEU.plateau)]')
    if attente[0] and pg.evaluate('() => JEU.ecran === "course"'): pg.click('#boutonPasser')
    # (3 tours d'IA restent, bien plus que les 90 s d'ARRIVEE_ATTENTE_MAX : en accéléré, le podium attend qu'elles aient toutes vraiment fini)
    t(f'{titre} : à deux, l’attente vient quand les deux joueurs ont fini, et « passer » joue la suite en accéléré : au podium, toutes les IA sont vraiment arrivées (même au-delà des 90 s)', attente[0] and attente[1] and attente[2] > 0 and attendre(pg, '() => JEU.ecran === "podium" && JEU.final && JEU.final.length === 5 && JEU.plateau.pilotes.every(p => p.arrivee !== null)', None, 120000),
      str([attente, pg.evaluate('() => [JEU.ecran, JEU.plateau.temps, JEU.plateau.pilotes.map(p => p.arrivee)]')]))
    t(f'{titre} : la revanche finit, la rivalité s’additionne (2 courses comptées)', JEU_PODIUM(pg) and sum(pg.evaluate('() => SAUVEGARDE.deux().rivalite.score')) == 2, str(pg.evaluate('() => SAUVEGARDE.deux()')))
    pg.click('#boutonResultats')
    with pg.expect_navigation(): pg.click('#boutonChangerResultats')
    t(f'{titre} : « Menu » : un commercialBreak, puis le menu « Entre amis » (la page nue, ?menu=amis)', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "amis"', None, 30000), str(pg.evaluate('() => typeof JEU === "undefined" ? null : JEU.ecran')))
    pg.click('#boutonAmisDeux')
    gardes = pg.evaluate('() => [document.getElementById("deuxNom1").value, document.getElementById("deuxNom2").value, document.getElementById("deuxCouleurs2").dataset.couleur, document.getElementById("deuxMotif2").value, document.getElementById("deuxIA").value, document.getElementById("deuxNiveau").value, SAUVEGARDE.deux().rivalite.score.reduce((a, b) => a + b)]')
    t(f'{titre} : les derniers choix sont gardés pour la fois suivante (noms, couleur, casque, IA, niveau) avec la rivalité', gardes == ['Léo', 'Sarah', str(0x2fa84f), 'damier', '3', 'debutant', 2], str(gardes))
    apres = pg.evaluate('() => localStorage.getItem(SAUVEGARDE.CLE) && JSON.stringify(JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat)')
    t(f'{titre} : la carrière n’a pas bougé (le monde du championnat créé au premier lancement est le même)', carriere is not None and apres == carriere, str([carriere and carriere[:80], apres and apres[:80]]))

# « passer » la vue télé finit la course en accéléré (décision du propriétaire, 2026-10-24, CLAUDE.md « La course ») : le reste de la course
# est vraiment joué (×ARRIVEE_ACCELERE, les mêmes pas de physique), le podium vient avec toutes les voitures arrivées ; la même course
# regardée jusqu'au bout (après un rechargement, même graine) donne les mêmes places, les mêmes temps et les mêmes pénalités, au bit près.
# En championnat : l'interview et la une suivent normalement
# suivre un pilote après l'arrivée (tour 45d, le propriétaire 2026-11-02 ; CLAUDE.md « La réalisation télé ») : dans l'attente de la vue télé, un
# clic sur une ligne du classement met la caméra sur ce pilote (la ligne marquée, « Caméra : Nom ») ; un second clic rend la régie ;
# le classement final est le même au bit près qu'avec la même course sans un clic (rechargée, même graine)
SUIVIE_ETAT = '''(k) => ({ tele: JEU.attente.tele, choisi: JEU.attente.choisi, suivie: [...document.querySelectorAll("#classementListe li.suivie")].map(li => li.dataset.numero),
  bandeau: !document.getElementById("cameraSuivie").classList.contains("cache"), texte: document.getElementById("cameraSuivie").textContent, nom: nomTele(k) })'''
SUIVIE_FINIR = '''() => { BOUCLE.arreter(); let n = 0; while (!(JEU.course.etat === "course" && JEU.plateau.temps > 15) && n++ < 200 * 120) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE);
  const c = JEU.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; BOUCLE.demarrer(); }'''
def camera_suivie(pg, titre, page):
    FINAL = '() => JEU.final.map(x => [x.k, x.place, x.total, x.penalites, JEU.plateau.pilotes[x.k].arrivee])'
    def jusqua_arrivee():
        passer_qualif(pg, titre)
        attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
        pg.evaluate(SUIVIE_FINIR)
        return attendre(pg, '() => !!JEU.attente && JEU.ecran === "course"', None, 20000)
    t(f'{titre} : le joueur (robot) a fini : l’attente, la vue télé', jusqua_arrivee())
    attendre(pg, '() => document.getElementById("classement").classList.contains("cliquable")', None, 5000)
    k, num = pg.evaluate('() => { const P = JEU.plateau.pilotes, k = P.findIndex((p, i) => p.arrivee === null && i !== JEU.attente.tele && !p.humain); return [k, String(numeroDe(k))]; }')
    pg.click(f'#classementListe li[data-numero="{num}"]'); pg.wait_for_timeout(300)
    e = pg.evaluate(SUIVIE_ETAT, k)
    t(f'{titre} : un clic sur une ligne du classement : la caméra suit ce pilote, la ligne est marquée, le bandeau « Caméra : Nom »', e['tele'] == k and e['choisi'] == k and e['suivie'] == [num] and e['bandeau'] and e['nom'] in e['texte'], str([k, num, e]))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'camera-suivie.png'))
    pg.click(f'#classementListe li[data-numero="{num}"]')
    # (la régie choisit sa voiture à l'image suivante : on attend qu'elle l'ait fait, au lieu de 300 ms qui, sous swiftshader, pouvaient
    # passer sans une image ; vu sur GitHub le 2026-11-02, tele encore null)
    attendre(pg, '() => JEU.attente && JEU.attente.tele !== null', None, 10000)
    e2 = pg.evaluate(SUIVIE_ETAT, k)
    t(f'{titre} : un second clic sur la même ligne : la régie reprend (plus de ligne marquée ni de bandeau)', e2['choisi'] is None and e2['suivie'] == [] and not e2['bandeau'] and e2['tele'] is not None, str(e2))
    pg.click(f'#classementListe li[data-numero="{num}"]'); pg.wait_for_timeout(200)
    pg.click('#boutonPasser')
    fini = attendre(pg, '() => JEU.ecran === "podium"', None, 180000)
    a = pg.evaluate(FINAL) if fini else None
    t(f'{titre} : « passer » : le bandeau part, le podium vient', fini and pg.evaluate('() => document.getElementById("cameraSuivie").classList.contains("cache")'))
    pg.reload(); pg.wait_for_timeout(1500)
    jusqua_arrivee(); pg.click('#boutonPasser')
    b = pg.evaluate(FINAL) if attendre(pg, '() => JEU.ecran === "podium"', None, 180000) else None
    t(f'{titre} : la même course sans un clic donne le même classement final au bit près (places, temps, pénalités, arrivées)', a is not None and a == b, str([a, b])[:800])

def accelere(pg, titre, page):
    champ = 'championnat=1' in page
    FINAL = '() => JEU.final.map(x => [x.k, x.place, x.total, x.penalites, JEU.plateau.pilotes[x.k].arrivee])'
    def jusqua_arrivee():
        if champ: paddock_clic(pg, '#boutonCourseSuivante')
        passer_qualif(pg, titre)
        attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
        # le joueur « finit » au même pas de physique dans les deux courses (15 s après le départ, la boucle arrêtée : on lui donne ses
        # tours, comme course_joueur) ; les IA ont encore toute la course à faire ; l'attente commence à l'image suivante
        pg.evaluate('''() => { BOUCLE.arreter(); let n = 0; while (!(JEU.course.etat === "course" && JEU.plateau.temps > 15) && n++ < 200 * 120) BOUCLE.simuler(REGLAGES.PAS_PHYSIQUE);
          const c = JEU.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; BOUCLE.demarrer(); }''')
        attendre(pg, '() => !!JEU.attente', None, 20000)
        return pg.evaluate('() => !!JEU.attente && JEU.ecran === "course" && JEU.plateau.pilotes.some(p => p.arrivee === null)')
    pret = jusqua_arrivee()
    t(f'{titre} : le joueur (robot) a fini, des voitures sont encore en course, le bandeau d’attente', pret, str(pg.evaluate('() => [JEU.ecran, !!JEU.attente, JEU.plateau && JEU.plateau.pilotes.map(p => p.arrivee)]')))
    if not pret: return
    restantes = pg.evaluate('() => ARRIVEE.restantes(JEU.plateau)')
    t0 = time.monotonic()
    pg.click('#boutonPasser')
    vu = attendre(pg, '() => JEU.ecran === "podium" || /⏩/.test(document.getElementById("attenteTexte").textContent)', None, 10000)
    texte_ = pg.evaluate('() => [document.getElementById("attenteTexte").textContent, document.getElementById("boutonPasser").classList.contains("cache")]')
    fini = attendre(pg, '() => JEU.ecran === "podium"', None, 180000)
    duree = time.monotonic() - t0
    etat = pg.evaluate('() => ({ arrivees: JEU.plateau.pilotes.every(p => p.arrivee !== null), nb: JEU.final && JEU.final.length, n: JEU.plateau.pilotes.length, temps: JEU.plateau.temps })')
    t(f'{titre} : « passer » : « ⏩ » et les voitures restantes à l’écran, puis le podium avec TOUTES les voitures arrivées (classées par leur vraie arrivée)', vu and fini and etat['arrivees'] and etat['nb'] == etat['n'], str([texte_, etat]))
    L.append(f"  (« passer » en accéléré : {restantes} voitures encore en course, podium {duree:.1f} s réelles après le clic ; course finie à {etat['temps']:.1f} s de course)")
    a = pg.evaluate(FINAL)
    if champ:
        pg.click('#boutonResultats'); attendre(pg, '() => JEU.ecran === "resultats"')
        pg.click('#boutonChangerResultats')
        t(f'{titre} : en championnat, après « passer » : les résultats, puis l’interview et la une du journal, comme d’habitude', attendre(pg, '() => JEU.ecran === "interview"', None, 10000) and (pg.click('#boutonPasCommentaire') or True) and attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => JEU.championnat.prochain === 1'), str(pg.evaluate('() => [JEU.ecran, JEU.championnat.prochain]')))
        # l'annonce d'un motif de casque gagné (tour 31) : au paddock, une seule fois
        pg.evaluate('() => { SAUVEGARDE.prendreAnnonceMotifs(); SAUVEGARDE.debloquerMotifs(["couronne"]); }')
        pg.evaluate('() => passerUne()')
        a1 = pg.evaluate('() => [JEU.ecran, document.getElementById("annonceMotif").classList.contains("cache"), document.getElementById("annonceMotif").textContent, document.querySelectorAll("#annonceMotif canvas").length]')
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'motif-gagne.png'))
        pg.click('#annonceMotif')
        ferme = pg.evaluate('() => document.getElementById("annonceMotif").classList.contains("cache")')
        pg.evaluate('() => montrerChampionnat(null)')
        a2 = pg.evaluate('() => document.getElementById("annonceMotif").classList.contains("cache")')
        t(f'{titre} : un motif gagné est annoncé au paddock (« Nouveau motif de casque : Couronne ! », son dessin), un clic la ferme, et la fois suivante plus rien (une seule fois)',
          a1[0] == 'championnat' and not a1[1] and 'Couronne' in a1[2] and a1[3] == 1 and ferme and a2, str([a1, ferme, a2]))
        return
    # la même course, regardée jusqu'au bout (sans passer) : rechargée, même graine
    pg.reload(); pg.wait_for_timeout(1500)
    jusqua_arrivee()
    for _ in range(400):
        if pg.evaluate('() => JEU.ecran === "podium"'): break
        pg.evaluate('() => BOUCLE.simuler(2)'); pg.wait_for_timeout(20)
    b = pg.evaluate('() => JEU.ecran === "podium" ? (' + FINAL[6:] + ') : null')
    t(f'{titre} : la même course regardée jusqu’au bout donne les mêmes places, les mêmes temps et les mêmes pénalités, au bit près', b is not None and a == b, str([a, b])[:800])
    # (tour 46, l'arrivée lente) la même course, « passer » avec un plafond de temps réel réduit à 0,2 s (un ordinateur très lent) : la fin de
    # la course est quand même jouée pour de vrai, par tranches, sans dessin ; le classement final est celui de la vraie arrivée, au bit près
    pg.reload(); pg.wait_for_timeout(1500)
    jusqua_arrivee()
    pg.evaluate('() => { REGLAGES.ARRIVEE_ACCELERE_MAX_REEL = 0.2; }')
    pg.click('#boutonPasser')
    attendre(pg, '() => JEU.ecran === "podium"', None, 180000)
    c = pg.evaluate('() => JEU.ecran === "podium" ? (' + FINAL[6:] + ') : null')
    toutes = pg.evaluate('() => JEU.plateau.pilotes.every(p => p.arrivee !== null)')
    t(f'{titre} : « passer » sur un ordinateur lent (plafond de temps réel réduit à 0,2 s) : toutes les voitures arrivent pour de vrai, et le classement est le même, au bit près', c is not None and toutes and c == a, str([toutes, a, c])[:800])

# le tournoi chrono entre copains (tournoi.js, CLAUDE.md « Le tournoi chrono entre copains ») : l'inscription (2 à 8, prénoms différents),
# « À toi, Léo ! » et 3 s, le tour de qualification (le robot), le fantôme du leader du moment (absent pour le premier), un abandon
# (pas de temps), le classement de la manche et le général, 3 manches (la page de chaque manche), l'ordre inverse du classement, le
# podium 3D, le classement final, « Rejouer » ; Poki : commercialBreak entre deux manches et à la fin, jamais entre deux joueurs
def tournoi(pg, titre, l, h):
    J = '() => window.APPELS_SDK.join(",")'
    PUBS = '() => +sessionStorage.getItem("pubs") || 0'
    def boite(sel):
        return pg.evaluate('s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', sel)
    pg.click('#boutonAmis')
    t(f'{titre} : « Tournoi chrono » est ouvert dans le menu « Entre amis »', pg.evaluate('() => !document.getElementById("boutonAmisTournoi").disabled && document.getElementById("boutonAmisTournoi").textContent === texte("amisTournoi")'))
    pg.click('#boutonAmisTournoi')
    ins = pg.evaluate('() => ({ ecran: JEU.ecran, n: document.querySelectorAll("#tournoiListe li").length, formule: document.getElementById("tournoiInscription").dataset.formule, icones: document.querySelectorAll("#tournoiListe .tournoiIcone canvas").length, circuits: [0, 1, 2].map(m => document.getElementById("tournoiCircuit" + m).value) })')
    t(f'{titre} : l’inscription : 3 joueurs proposés (prénom, casque et son icône), la formule 🏆 Tournoi, 3 circuits au hasard', ins == {'ecran': 'tournoiInscription', 'n': 3, 'formule': 'tournoi', 'icones': 3, 'circuits': ['', '', '']}, str(ins))
    carriere = pg.evaluate('() => JSON.stringify([JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat, JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).fantomes])')
    if l == 960:
        for _ in range(5): pg.click('#boutonTournoiAjouter')   # (3 proposés + 5 = 8)
        n = pg.evaluate('() => [document.querySelectorAll("#tournoiListe li").length, document.getElementById("boutonTournoiAjouter").disabled]')
        b = [boite(s) for s in ['#tournoiTitre', '#tournoiListe', '#tournoiFormules', '#tournoiCircuits', '#boutonTournoiPartir']]
        d = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
        t(f'{titre} : 8 joueurs au plus (le bouton + grisé), et l’inscription de 8 tient en 960×600 sans défilement', n == [8, True] and all(x[1] >= -1 and x[3] <= h + 1 and x[0] >= -1 and x[2] <= l + 1 for x in b) and pas_de_defilement(d), str([n, b, d]))
        pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'tournoi-inscription-960.png'))
        return
    # jamais 1 joueur : à 2, le ✕ est grisé ; deux prénoms pareils refusés
    pg.click('#tournoiListe li:nth-child(3) .tournoiEnlever')
    t(f'{titre} : à 2 joueurs, on ne peut plus en enlever (jamais 1)', pg.evaluate('() => document.querySelectorAll("#tournoiListe li").length === 2 && [...document.querySelectorAll("#tournoiListe .tournoiEnlever")].every(b => b.disabled)'))
    pg.click('#boutonTournoiAjouter')
    pg.fill('#tournoiListe li:nth-child(1) .tournoiPrenom', 'Léo'); pg.fill('#tournoiListe li:nth-child(2) .tournoiPrenom', 'Sarah'); pg.fill('#tournoiListe li:nth-child(3) .tournoiPrenom', 'sarah')
    pg.click('#boutonTournoiPartir')
    t(f'{titre} : deux prénoms pareils sont refusés', pg.evaluate('() => JEU.ecran === "tournoiInscription" && document.getElementById("tournoiErreur").textContent === texte("tournoiErreurPrenom")'), pg.evaluate('() => document.getElementById("tournoiErreur").textContent'))
    pg.fill('#tournoiListe li:nth-child(3) .tournoiPrenom', 'Tom')
    pg.select_option('#tournoiListe li:nth-child(3) .tournoiMotif', 'eclair')
    with pg.expect_navigation(): pg.click('#boutonTournoiPartir')
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.tournoi', None, 30000)
    t0 = pg.evaluate('() => ({ ecran: JEU.ecran, joueurs: JEU.tournoi.joueurs.map(j => j.prenom), circuits: JEU.tournoi.circuits, circuit: NOM_CIRCUIT, ia: JEU.plateau, titre: document.getElementById("atoiTitre").textContent, motif: JEU.tournoi.joueurs[2].casque.motif, liste: SAUVEGARDE.tournoi().joueurs.map(j => j.prenom) })')
    t(f'{titre} : « C’est parti ! » : la page de la manche 1 (son circuit, seul sur la piste), « À toi, Léo ! », la liste gardée',
      t0['ecran'] == 'tournoiAToi' and t0['joueurs'] == ['Léo', 'Sarah', 'Tom'] and len(t0['circuits']) == 3 and t0['circuit'] == t0['circuits'][0] and t0['ia'] is None and t0['titre'].replace(' 🛞', '') in ('À toi, Léo !', 'Your turn, Léo!') and t0['motif'] == 'eclair' and t0['liste'] == ['Léo', 'Sarah', 'Tom'], str(t0))
    def passage(abandon=False):
        pg.evaluate('() => { JEU.robot = true; }')
        attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "tour"', None, 15000)
        etat = pg.evaluate('() => ({ j: TOURNOI.joueurActuel(JEU.tournoi), fantome: !!(JEU.fantome && JEU.fantome.rejeu), leader: TOURNOI.leader(JEU.tournoi, JEU.tournoi.manche), sdk: window.APPELS_SDK.slice(-1)[0] })')
        if abandon:
            pg.evaluate('() => BOUCLE.simuler(5)'); pg.wait_for_timeout(100)
            pg.keyboard.press('Escape')
            attendre(pg, '() => JEU.ecran === "tournoiPause"', None, 5000)
            pg.click('#boutonTournoiAbandon')
        else:
            for _ in range(200):
                if pg.evaluate('() => JEU.ecran === "tournoiManche"'): break
                pg.evaluate('() => BOUCLE.simuler(2)'); pg.wait_for_timeout(30)
        attendre(pg, '() => JEU.ecran === "tournoiManche"', None, 10000)
        etat['phrase'] = pg.evaluate('() => document.getElementById("tournoiPhrase").textContent')
        etat['lignes'] = pg.evaluate('() => [...document.querySelectorAll("#tournoiMancheListe li")].map(li => li.textContent)')
        etat['nouveau'] = pg.evaluate('() => (document.querySelector("#tournoiMancheListe li.nouveau") || { textContent: "" }).textContent')
        return etat
    vus = []
    for m in range(3):
        if m:
            pubs = pg.evaluate(PUBS)
            with pg.expect_navigation(): pg.click('#boutonTournoiSuite')
            attendre(pg, '() => typeof JEU !== "undefined" && JEU.tournoi && JEU.ecran === "tournoiAToi"', None, 30000)
            t(f'{titre} : manche {m + 1} : une pub entre deux manches (une seule), puis la page de la manche (son circuit) ; l’ordre de passage = l’inverse du classement général',
              pg.evaluate(PUBS) == pubs + 1 and pg.evaluate(f'() => JEU.tournoi.manche === {m} && NOM_CIRCUIT === JEU.tournoi.circuits[{m}] && TOURNOI.joueurActuel(JEU.tournoi) === TOURNOI.ordre(JEU.tournoi, {m})[0] && TOURNOI.ordre(JEU.tournoi, {m}).join() === TOURNOI.classementGeneral({{ ...JEU.tournoi, passages: JEU.tournoi.passages.slice(0, {m}) }}).map(x => x.j).reverse().join()'),
              str([pg.evaluate(J), pg.evaluate('() => [JEU.tournoi.manche, TOURNOI.ordre(JEU.tournoi, JEU.tournoi.manche)]')]))
        for k in range(3):
            pubs = pg.evaluate(PUBS)
            e = passage(abandon=(m == 0 and k == 2))
            vus.append(e)
            if m == 0 and k in (0, 2):   # (tour 49b) « 📋 Défier un ami » sous le classement : pour un tour propre, jamais après un abandon
                d = pg.evaluate('() => { const b = document.getElementById("boutonTournoiDefi"), vu = !b.classList.contains("cache"); if (vu) b.click(); const c = document.querySelector("#tournoiCode input.defiCode"); return [vu, !!JEU.tournoiDefi, c ? c.value : "", TOURNOI.joueurActuel(JEU.tournoi)]; }')
                if k == 0:
                    bon = d[0] == d[1] and (not d[0] or pg.evaluate('c => { const r = DEFI.decoder(c, CIRCUIT.longueur); return r.ok && r.defi.nom === "Léo" && r.defi.circuit === NOM_CIRCUIT; }', d[2]))
                    t(f'{titre} : après le tour de Léo, « 📋 Défier un ami » (s’il est sans virage coupé) donne le code de son tour, signé Léo, sur le circuit de la manche', bon, str([d[0], d[1], d[2][:40]]))
                else:
                    t(f'{titre} : après un abandon, pas de « Défier un ami »', not d[0] and not d[1], str(d[:2]))
            t(f'{titre} : manche {m + 1}, passage {k + 1} : le fantôme du leader du moment ({"aucun pour le premier" if k == 0 else "présent"}), gameplayStart pendant le tour, le classement s’anime (le nouveau temps marqué), aucune pub entre deux joueurs',
              e['fantome'] == (k > 0) and (e['leader'] is None) == (k == 0) and e['sdk'] == 'gameplayStart' and e['nouveau'] != '' and pg.evaluate(PUBS) == pubs, str(e))
            if k < 2 or m == 2:
                if k < 2: pg.click('#boutonTournoiSuite')
            if m == 0 and k == 2:
                t(f'{titre} : l’abandon donne « pas de temps », dernier de la manche', 'pas de temps' in e['lignes'][-1] or 'no time' in e['lignes'][-1], str(e['lignes']))
                gen = pg.evaluate('() => [!document.getElementById("tournoiGeneral").classList.contains("cache"), [...document.querySelectorAll("#tournoiGeneralListe li")].map(li => li.textContent)]')
                t(f'{titre} : à la fin de la manche, le classement général avec les points', gen[0] and len(gen[1]) == 3 and all(re.search(r'\bpts?\b', x) for x in gen[1]), str(gen))
                pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(CAPTURES, 'tournoi.png'))
    t(f'{titre} : la phrase du premier passage : « Léo prend la tête ! »', vus[0]['phrase'] in ('Léo prend la tête !', 'Léo takes the lead!'), vus[0]['phrase'])
    pg.click('#boutonTournoiSuite')
    attendre(pg, '() => JEU.ecran === "podium"', None, 10000)
    pod = pg.evaluate('() => ({ ecran: JEU.ecran, marches: [...document.querySelectorAll("#podiumMarches .marche strong")].map(s => s.textContent), visibles: JEU.tournoiPodium.filter(m => m.groupe.visible).length, attendu: TOURNOI.podium(JEU.tournoi).map(x => JEU.tournoi.joueurs[x.j].prenom) })')
    t(f'{titre} : le podium 3D des trois premiers (leurs casques, leurs prénoms)', pod['ecran'] == 'podium' and pod['visibles'] == 3 and len(pod['marches']) == 3 and all(any(p in m for m in pod['marches']) for p in pod['attendu']), str(pod))
    pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(CAPTURES, 'tournoi-podium.png'))
    pg.click('#boutonResultats')
    fin = pg.evaluate('() => ({ ecran: JEU.ecran, lignes: [...document.querySelectorAll("#tournoiFinListe li")].map(li => li.textContent), attendu: TOURNOI.classementGeneral(JEU.tournoi).map(x => JEU.tournoi.joueurs[x.j].prenom) })')
    t(f'{titre} : le classement final (les points), puis « Rejouer » et « Nouveaux joueurs »', fin['ecran'] == 'tournoiFin' and len(fin['lignes']) == 3 and all(fin['lignes'][i].strip().startswith(fin['attendu'][i]) for i in range(3)), str(fin))
    pubs = pg.evaluate(PUBS)
    t(f'{titre} : en tout, une pub entre chaque manche (2), aucune entre deux joueurs', pubs == 2, str(pubs))
    apres = pg.evaluate('() => JSON.stringify([JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).championnat, JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).fantomes])')
    t(f'{titre} : la carrière n’a pas bougé (championnat, fantômes de carrière)', apres == carriere, str([carriere[:80], apres[:80]]))
    with pg.expect_navigation(): pg.click('#boutonTournoiRejouer')
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.tournoi && JEU.ecran === "tournoiAToi"', None, 30000)
    t(f'{titre} : « Rejouer » : une pub, puis un nouveau tournoi avec les mêmes joueurs et la même formule (manche 1, Léo d’abord)', pg.evaluate(PUBS) == 3 and pg.evaluate('() => JEU.tournoi.manche === 0 && JEU.tournoi.passages.every(p => !p.length) && JEU.tournoi.formule === "tournoi" && JEU.tournoi.joueurs.map(j => j.prenom).join() === "Léo,Sarah,Tom" && TOURNOI.joueurActuel(JEU.tournoi) === 0'), pg.evaluate(J))

# le volant en vue cockpit (CLAUDE.md « Le casque du pilote ») : il est là en vue cockpit (et seulement là), le rapport et la vitesse
# quittent l'interface HTML pour son écran ; en pixels, la moitié haute de l'image est exactement la même avec ou sans volant, la
# moitié basse change ; il tourne avec les roues avant (à droite : sens horaire) et revient au centre ; ses appels de dessin mesurés
def volant(pg, titre, l, h):
    t(f'{titre} : en vue cockpit, le volant est là, le rapport et la vitesse ne sont plus dans l’interface HTML (une seule fois : sur le volant)',
      attendre(pg, '() => CAMERA.mode === "cockpit" && JEU.volant && JEU.volant.groupe.visible && document.getElementById("tableau").classList.contains("cache") && JEU.volant.texte === rapportPourVitesse(JEU.joueur.u) + ":" + Math.round(Math.abs(JEU.joueur.u) * 3.6)', None, 20000),
      str(pg.evaluate('() => [CAMERA.mode, !!JEU.volant, JEU.volant && JEU.volant.texte, document.getElementById("tableau").className]')))
    attendre(pg, '() => JEU.course && (JEU.course.etat === "attente" || JEU.course.etat === "course")', None, 20000)
    # en pixels : la même image dessinée avec et sans volant (la boucle arrêtée) ; on compte les pixels qui changent, en haut et en bas
    PIX = '''(braq) => { BOUCLE.arreter(); JEU.joueur.braquage = braq; majVolant(); const c = SCENE3D.canvas, L = c.width, H = c.height, k = document.createElement('canvas'); k.width = L; k.height = H; const ctx = k.getContext('2d');
      const lire = () => { SCENE3D.dessiner(); ctx.clearRect(0, 0, L, H); ctx.drawImage(c, 0, 0); return ctx.getImageData(0, 0, L, H).data; };
      JEU.volant.groupe.visible = true; const a = lire(), appelsAvec = SCENE3D.appelsDessin; JEU.volant.groupe.visible = false; const b = lire(), appelsSans = SCENE3D.appelsDessin; JEU.volant.groupe.visible = true;
      let haut = 0, bas = 0, plusHaut = H; for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const i = (y * L + x) * 4; if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 6) { if (y < H / 2) haut++; else bas++; if (y < plusHaut) plusHaut = y; } }
      BOUCLE.demarrer(); return { haut, bas, plusHaut, H, appelsAvec, appelsSans }; }'''
    for braq in (0, 1):
        px = pg.evaluate(PIX, braq * 0.12)   # (volant au centre, puis tourné : il ne monte pas plus haut)
        t(f'{titre} : volant {"tourné" if braq else "au centre"} : aucun pixel du volant dans la moitié haute de l’image ({l}×{h}), la moitié basse le montre', px['haut'] == 0 and px['bas'] > 500 and px['plusHaut'] >= px['H'] / 2, str(px))
    L.append(f"  (le volant en vue cockpit, {l}×{h} : {px['appelsAvec'] - px['appelsSans']} appels de dessin en plus ; son plus haut pixel à {100 * px['plusHaut'] / px['H']:.0f} % de la hauteur)")
    t(f'{titre} : le volant coûte au plus 5 appels de dessin', 0 < px['appelsAvec'] - px['appelsSans'] <= 5, str(px))
    if l == 1280:
        # le sens : à droite (→), les roues braquent à droite et le volant tourne dans le sens horaire (angle < 0) ; lâché, il revient au centre
        pg.keyboard.down('ArrowUp'); pg.keyboard.down('ArrowRight')
        droite = attendre(pg, '() => JEU.joueur.braquage > 0.01 && Math.abs(JEU.volant.volant.rotation.z + JEU.joueur.braquage * REGLAGES.VOLANT_FACTEUR) < 1e-9', None, 10000)
        r1 = pg.evaluate('() => [JEU.joueur.braquage, JEU.volant.volant.rotation.z]')
        pg.keyboard.up('ArrowRight'); pg.keyboard.down('ArrowLeft')
        gauche = attendre(pg, '() => JEU.joueur.braquage < -0.01 && JEU.volant.volant.rotation.z > 0', None, 10000)
        pg.keyboard.up('ArrowLeft')
        centre = attendre(pg, '() => JEU.joueur.braquage === 0 && JEU.volant.volant.rotation.z === 0', None, 10000)
        pg.keyboard.up('ArrowUp')
        t(f'{titre} : le volant tourne dans le bon sens (à droite : sens horaire, à gauche : l’inverse, l’angle des roues × VOLANT_FACTEUR) et revient au centre', droite and r1[1] < 0 and gauche and centre, str([r1, pg.evaluate('() => [JEU.joueur.braquage, JEU.volant.volant.rotation.z]')]))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'cockpit.png' if l == 1280 else 'cockpit-960.png'))
    pg.keyboard.press('KeyC')
    t(f'{titre} : dans une autre vue (C), plus de volant, le rapport et la vitesse reviennent dans l’interface', attendre(pg, '() => CAMERA.mode !== "cockpit" && !JEU.volant.groupe.visible && !document.getElementById("tableau").classList.contains("cache")', None, 5000), str(pg.evaluate('() => [CAMERA.mode, JEU.volant.groupe.visible]')))

# le résumé vidéo de la course (resume.js, étape 13) : après une course (le robot), les résultats proposent « ▶ Résumé » ; la 3D
# rejoue les moments forts de l'enregistrement avec la caméra télé (les voitures aux positions de l'enregistrement, pas de la
# physique, qui ne bouge plus), un bandeau dit le moment ; rien n'est ajouté à la scène ; Échap ou un clic ramènent aux résultats
def resume_ecran(pg, titre, l, h):
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    for _ in range(300):
        if pg.evaluate('() => JEU.ecran === "podium"'): break
        if pg.evaluate('() => !!JEU.attente && !JEU.attente.passer && JEU.ecran === "course"'): pg.evaluate('() => passerAuPodium()')   # (le joueur a fini : la fin en accéléré)
        pg.evaluate('() => BOUCLE.simuler(2)'); pg.wait_for_timeout(30)
    t(f'{titre} : la course va jusqu’au podium', attendre(pg, '() => JEU.ecran === "podium"', None, 60000), str(pg.evaluate('() => JEU.ecran')))
    pg.click('#boutonResultats')
    objets = pg.evaluate('() => SCENE3D.nbObjets')
    t(f'{titre} : les résultats proposent « ▶ Résumé »', attendre(pg, '() => JEU.ecran === "resultats" && !document.getElementById("boutonResume").classList.contains("cache") && document.getElementById("boutonResume").textContent === texte("resume")', None, 5000))
    pg.click('#boutonResume')
    etat = pg.evaluate('''() => { BOUCLE.arreter(); majResume(1 / 30); const r = JEU.resume.r, pos = RESUME.positions(r, JEU.enregistreur.enr);
      const ecart = Math.max(...pos.map((p, k) => Math.hypot(JEU.modeles[k].groupe.position.x - p.x, JEU.modeles[k].groupe.position.z - p.z)));
      const pas = JEU.pas; BOUCLE.demarrer(); return { ecran: JEU.ecran, camera: CAMERA.mode, bandeau: document.getElementById("resumeMoment").textContent, ecart, visibles: JEU.modeles.filter(m => m.groupe.visible).length, n: JEU.modeles.length,
        plages: r.plages.length, duree: r.duree, max: REGLAGES.RESUME_DUREE_MAX, jeu: SDK.enJeu, pas, objets: SCENE3D.nbObjets }; }''')
    t(f'{titre} : le résumé : la caméra télé, un bandeau qui dit le moment, chaque voiture à sa position de l’enregistrement, la durée bornée, gameplayStop, rien d’ajouté à la scène',
      etat['ecran'] == 'resume' and etat['camera'] == 'tele' and etat['bandeau'] != '' and etat['ecart'] < 1e-6 and etat['visibles'] == etat['n'] and 0 < etat['duree'] <= etat['max'] and not etat['jeu'] and etat['objets'] == objets, str([etat, objets]))
    pg.wait_for_timeout(200)
    PHYS = '() => JEU.plateau.pilotes.map(p => [p.v.x, p.v.z, p.v.u].join()).join(";")'
    phys = pg.evaluate(PHYS); joue = pg.evaluate('() => JEU.resume.r.joue'); pg.wait_for_timeout(500)
    t(f'{titre} : pendant le résumé, les voitures de la physique ne bougent pas, le rejeu avance', pg.evaluate(PHYS) == phys and pg.evaluate('() => JEU.resume && JEU.resume.r.joue') > joue, str(pg.evaluate('() => JEU.resume && JEU.resume.r.joue')))
    # le commentateur du résumé : une phrase pour le moment montré, dans l'image, sous le nom du commentateur
    com = pg.evaluate('() => { const el = document.getElementById("resumeCommentaire"), r = el.getBoundingClientRect(); return { cache: el.classList.contains("cache"), texte: el.textContent, boite: [r.left, r.top, r.right, r.bottom], moment: RESUME.moment(JEU.resume.r) ? RESUME.moment(JEU.resume.r).type : null }; }')
    t(f'{titre} : le résumé est commenté : une phrase du commentateur pour le moment montré ({com["moment"]}), dans l’image', not com['cache'] and com['texte'].startswith('🎙') and com['boite'][0] >= 0 and com['boite'][2] <= l and com['boite'][1] >= 0, str(com))
    pg.screenshot(path=os.path.join(CAPTURES, 'resume.png' if l == 1280 else 'resume-960.png'))
    b = pg.evaluate('() => { const e = document.getElementById("resumeBandeau").getBoundingClientRect(); return [e.left, e.top, e.right, e.bottom]; }')
    t(f'{titre} : le bandeau tient dans l’image ({l}×{h})', b[0] >= 0 and b[2] <= l and b[3] <= h and b[1] >= h / 2, str(b))
    pg.keyboard.press('Escape')
    t(f'{titre} : Échap ramène aux résultats, le podium revient derrière', attendre(pg, '() => JEU.ecran === "resultats" && !JEU.resume && CAMERA.mode !== "tele" && document.getElementById("resume").classList.contains("cache")', None, 5000), str(pg.evaluate('() => [JEU.ecran, CAMERA.mode]')))
    pg.click('#boutonResume'); attendre(pg, '() => JEU.ecran === "resume"', None, 5000)
    pg.mouse.click(l / 2, h / 3)
    t(f'{titre} : un clic sort aussi du résumé', attendre(pg, '() => JEU.ecran === "resultats"', None, 5000), str(pg.evaluate('() => JEU.ecran')))

# l'interface en course (suite du tour 31) : la minicarte (le circuit entier, chaque voiture au bon endroit à 2 m près, le joueur
# mis en valeur), l'état des pneus avec ?pneus=1 (la jauge baisse en roulant), un message de course (meilleur tour) qui apparaît
# puis disparaît ; rien ne se recouvre en 960×600 et 1280×720 ; aucun appel de dessin en plus (ce sont des canvas 2D et du HTML)
# le décor (étape 10, decor.js) sur le circuit test, avec 20 voitures : chaque brique est là, en InstancedMesh (un appel de dessin par
# type et par niveau de détail), le décor coûte au plus DECOR_APPELS_MAX appels ; le public et les arbres passent en forme simple
# loin de la caméra ; la mesure (appels, triangles, avec et sans décor) va dans le journal ; captures decor-test.png, decor-dessus.png
# les décors des 12 tracés (tests/lieu.html) : le décor du circuit et son lieu, 20 voitures, vus d'un poste télé ; la mesure (appels
# de dessin et triangles, avec et sans le décor) ; au plus LIEU_APPELS_MAX appels en tout et DECOR_APPELS_MAX pour le décor ; le ciel
# (la coupole), la nuit avec ses mâts ; Monoco : le port, les bateaux, les façades ; le domicile : les banderoles et le public aux couleurs
# le décor dans le vrai jeu (index.html, un circuit officiel) : le décor et son lieu sont construits pour le circuit de la course, et
# l'image reste sous LIEU_APPELS_MAX appels de dessin avec 20 voitures, en vue télé ; capture jeu-<nom>.png
def decor_jeu(pg, titre, page):
    nom = re.search(r'circuit=([a-z]+)', page).group(1)
    pret = attendre(pg, '() => !!SCENE3D.decor && JEU.plateau && JEU.plateau.pilotes.length === 20', None, 60000)
    pg.evaluate('() => CAMERA.forcer("tele")'); pg.wait_for_timeout(1500)
    m = pg.evaluate("""() => { SCENE3D.dessiner(); const d = SCENE3D.decor, n = {}; for (const k in d.objets) n[k] = d.objets[k].length; const noms = []; d.groupe.traverse(o => { if (o.isMesh) noms.push(o.name); });
      return { appels: SCENE3D.appelsDessin, triangles: SCENE3D.trianglesDessines, lieu: d.lieu ? d.lieu.lieu : null, nuit: !!(d.lieu && d.lieu.lumiere.projecteurs), n, ciel: noms.includes('decor-ciel'), max: REGLAGES.LIEU_APPELS_MAX, lointaines: SCENE3D.nbLointaines }; }""")
    L.append(f"  (dans le jeu, {nom}, 20 voitures, vue télé : {m['appels']} appels de dessin, {m['triangles']} triangles, {m['lointaines']} voitures lointaines)")
    t(f'{titre} : dans le jeu, le décor de {nom} (decors-officiels.js) et son lieu : ciel, tribunes, public{", mâts d’éclairage" if m["nuit"] else ""} ; sous LIEU_APPELS_MAX appels de dessin avec 20 voitures',
      pret and m['lieu'] is not None and m['ciel'] and m['n']['tribune'] > 10 and m['n']['public'] > 1000 and (not m['nuit'] or m['n']['projecteur'] > 20) and m['appels'] < m['max'], str(m))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, f'jeu-{nom}.png'))
    # la nuit (ou le jour) se voit : derrière la voiture, la luminosité moyenne du haut de l'image (le ciel) et de toute l'image,
    # lues dans l'image 3D seule (sans l'interface), juste après un dessin
    pg.evaluate('() => CAMERA.forcer("derriere")'); pg.wait_for_timeout(1500)
    lum = pg.evaluate('''async () => { SCENE3D.dessiner(); const url = SCENE3D.canvas.toDataURL(); const img = new Image(); img.src = url; await img.decode();
      const W = 64, H = 36, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data;
      const moy = (y0, y1) => { let s = 0, n = 0; for (let y = y0; y < y1; y++) for (let i = 0; i < W; i++) { const k = (y * W + i) * 4; s += 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]; n++; } return s / n; };
      return { ciel: moy(0, Math.round(H * 0.15)), image: moy(0, H), nuit: DECOR.nuitDe(SCENE3D.decor.lieu), R: { ciel: REGLAGES.NUIT_CIEL_MAX, nuitImage: REGLAGES.NUIT_IMAGE_MAX, jourImage: REGLAGES.JOUR_IMAGE_MIN } }; }''')
    L.append(f"  (dans le jeu, {nom}, derrière la voiture : luminosité du ciel {lum['ciel']:.0f}, de l'image {lum['image']:.0f} sur 255)")
    if lum['nuit'] >= 1:
        t(f'{titre} : la nuit à {nom} : le ciel est sombre (sous NUIT_CIEL_MAX) et toute l’image aussi (sous NUIT_IMAGE_MAX)', lum['ciel'] < lum['R']['ciel'] and lum['image'] < lum['R']['nuitImage'], str(lum))
    elif lum['nuit'] == 0:
        t(f'{titre} : le jour à {nom} : l’image est claire (au-dessus de JOUR_IMAGE_MIN), nettement plus que la nuit', lum['image'] > lum['R']['jourImage'], str(lum))
    pg.screenshot(path=os.path.join(CAPTURES, f'jeu-{nom}-derriere.png'))

# la météo dessinée (meteo3d.js) avec la fausse météo de test (pluie 0,85, eau 0,75, ciel 0,9) : la pluie tombe (un appel), les gerbes
# derrière les voitures qui roulent, la route mouillée (un matériau à reflets), le ciel plus gris, l'icône et l'eau ; les gouttes en vue
# cockpit ; avec 20 voitures sous la pluie, sous LIEU_APPELS_MAX appels ; au sec (une météo à 0, ou pas de météo), la même image au pixel près
def pluie_ecran(pg, titre, l, h):
    pret = attendre(pg, '() => METEO3D.actif && JEU.plateau && JEU.plateau.pilotes.length === 20 && JEU.plateau.pilotes.filter(p => Math.abs(p.v.u) > 15).length >= 5', None, 90000)
    pg.wait_for_timeout(800)
    m = pg.evaluate("""() => { SCENE3D.dessiner();
      return { appels: SCENE3D.appelsDessin, pluie: METEO3D.pluie.visible, gouttes: METEO3D.pluie.geometry.drawRange.count, gerbes: METEO3D.gerbes.count, hudCache: document.getElementById('meteoHud').classList.contains('cache'), eau: document.getElementById('meteoEau').textContent, icone: document.getElementById('meteoIcone').textContent, max: REGLAGES.LIEU_APPELS_MAX }; }""")
    route = pg.evaluate("() => METEO3D.routeMateriau")
    L.append(f"  (pluie, 20 voitures, {l}×{h}, derrière la voiture : {m['appels']} appels de dessin, {m['gouttes'] // 2} gouttes, {m['gerbes']} gerbes)")
    t(f'{titre} : sous la pluie : la pluie tombe (un trait par goutte, en un appel), des gerbes derrière les voitures qui roulent, la route mouillée (à reflets) et sa trajectoire plus sèche, l’icône et l’eau sur la piste ; sous LIEU_APPELS_MAX appels avec 20 voitures',
      pret and m['pluie'] and m['gouttes'] > 1000 and m['gerbes'] >= 3 and route == 'MeshPhongMaterial' and not m['hudCache'] and '75' in m['eau'] and m['icone'] == '🌧' and m['appels'] < m['max'] and pg.evaluate('() => !!(METEO3D.ligne && METEO3D.ligne.visible)'), str([m, route]))
    pg.screenshot(path=os.path.join(CAPTURES, 'pluie.png' if l == 1280 else 'pluie-960.png'))
    if l != 1280: return
    pg.evaluate('() => CAMERA.forcer("cockpit")'); pg.wait_for_timeout(800)
    t(f'{titre} : en vue cockpit sous la pluie, des gouttes sur la visière', pg.evaluate('() => !document.getElementById("gouttes").classList.contains("cache")'))
    pg.screenshot(path=os.path.join(CAPTURES, 'pluie-cockpit.png'))
    # au sec : avec une météo à 0 (après la pluie : tout est remis) et sans météo (la course sans e.meteo, depuis que meteo.js donne le vrai temps : Codeur 1), la même image au pixel près
    egal = pg.evaluate("""() => { BOUCLE.arreter(); CAMERA.forcer("derriere"); const image = () => { METEO3D.maj(METEO3D.etat(JEU.plateau), SCENE3D.camera, JEU.plateau.pilotes.map(p => p.v), 0, false); SCENE3D.dessiner(); return SCENE3D.canvas.toDataURL(); };
      const pluie = window.METEO_TEST; window.METEO_TEST = { etat: () => ({ pluie: 0, eau: 0, ciel: 0 }) }; const zero = image(); window.METEO_TEST = undefined; const em = JEU.plateau.meteo; JEU.plateau.meteo = undefined; const sans = image(); JEU.plateau.meteo = em; window.METEO_TEST = pluie; const mouille = image(); BOUCLE.demarrer();
      return { zeroEgalSans: zero === sans, pluieDifferente: mouille !== sans }; }""")
    t(f'{titre} : au sec, pas un pixel ne change : une météo à 0 (après la pluie) donne la même image que pas de météo ; sous la pluie, l’image change', egal['zeroEgalSans'] and egal['pluieDifferente'], str(egal))
    # le coût de la pluie (tour 40, le tableau des coûts) : la même image au sec et sous la pluie, derrière la voiture
    cp = pg.evaluate('''() => { BOUCLE.arreter(); const appels = () => { METEO3D.maj(METEO3D.etat(JEU.plateau), SCENE3D.camera, JEU.plateau.pilotes.map(p => p.v), 0, false); SCENE3D.dessiner(); return [SCENE3D.appelsDessin, SCENE3D.trianglesDessines]; };
      const pluie = window.METEO_TEST, mouille = appels(); window.METEO_TEST = { etat: () => ({ pluie: 0, eau: 0, ciel: 0 }) }; const sec = appels(); window.METEO_TEST = pluie; appels(); BOUCLE.demarrer(); return { mouille, sec }; }''')
    L.append(f"  (le coût de la pluie à {l}×{h}, 20 voitures : {cp['mouille'][0] - cp['sec'][0]} appels de dessin, {cp['mouille'][1] - cp['sec'][1]} triangles de plus)")

# la prévision au paddock (meteo3d.js, la fausse météo de test : risque de pluie 40 %) ; capture prevision.png
def prevision_ecran(pg, titre):
    vu = attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && !document.getElementById("prevision").classList.contains("cache")', None, 30000)
    txt = pg.evaluate('() => document.getElementById("prevision").textContent')
    t(f'{titre} : la météo prévue au paddock (« Météo prévue : risque de pluie (40 %) »)', vu and '40' in txt and re.search(r'(pluie|rain)', txt, re.I) is not None, txt)
    pg.screenshot(path=os.path.join(CAPTURES, 'prevision.png'))

# les sensations de conduite (tour 37 : sensations.js, son.js, effets3d.js, camera.js) dans le vrai jeu : aucun son avant un
# geste (une course entière de robot sans AudioContext), puis le son démarre au premier geste ; la fumée et les étincelles
# coûtent un appel de dessin chacune (au plus 3 de plus en tout), aucun quand elles sont vides ; « Effets de conduite » dans le
# menu pause (oui / non, sauvegardé) ; capture sensations.png
def sensations_ecran(pg, titre):
    # (les boutons par le DOM, sans geste : pg.click enverrait un pointerdown, le premier geste)
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
    pg.evaluate('() => document.getElementById("boutonQualifPasser").click()')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)
    pg.evaluate('() => document.getElementById("boutonQualifCourse").click()')
    attendre(pg, '() => JEU.ecran === "course" || JEU.ecran === "grille"', None, 10000)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    if pg.evaluate('() => JEU.ecran === "grille"'): pg.evaluate('() => finirGrille()')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(25); BOUCLE.demarrer(); }')
    roule = attendre(pg, '() => JEU.ecran === "course" && JEU.course && JEU.course.etat === "course" && JEU.joueur.u > 25', None, 60000)
    pg.wait_for_timeout(1500)
    t(f'{titre} : aucun son avant un geste du joueur : la course roule (robot), pas d’AudioContext', roule and pg.evaluate('() => !SON.actif && SON.etatContexte === "aucun"'), pg.evaluate('() => SON.etatContexte'))
    m = pg.evaluate('''() => { BOUCLE.arreter(); const E = EFFETS3D, e = E.etat, j = JEU.joueur, F = { vibreur: 0, herbe: 1, glisse: 0, blocage: 1, contact: 1, choc: 0, vitesse: 40 };
      const sansRien = () => { e.fumee.length = 0; e.etincelle.length = 0; e.trace.length = 0; E.maj([], null, 0); SCENE3D.dessiner(); return SCENE3D.appelsDessin; };   // (tour 50c : les traces aussi : celles laissées par le robot pendant la course comptaient un appel dans « vide », pas dans « coupe »)
      const vide = sansRien(); SENSATIONS.regler(false); const coupe = sansRien(); SENSATIONS.regler(true);
      const devant = { x: j.x + Math.cos(j.cap) * 9, z: j.z + Math.sin(j.cap) * 9, cap: j.cap };   // (devant la voiture : la capture les montre)
      E.emettre(e, j, devant, F, 0.4);
      // (tour 42 : l'arrière qui part, sur 12 m : les traces de pneus, un appel de plus)
      for (let k = 1; k <= 6; k++) E.emettre(e, j, { x: devant.x + Math.cos(j.cap) * 2 * k, z: devant.z + Math.sin(j.cap) * 2 * k, cap: j.cap + 0.05 * k }, Object.assign({}, F, { arriere: 1, contact: 0, herbe: 0 }), 0.02);
      E.maj([], null, 0); SCENE3D.dessiner();
      return { vide, coupe, plein: SCENE3D.appelsDessin, fumees: E.fumees.count, etincelles: E.etincelles.count, traces: e.trace.length, visibles: [E.fumees.visible, E.etincelles.visible, E.traces.visible] }; }''')
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'sensations.png'))
    L.append(f"  (les effets de conduite : {m['vide']} appels de dessin sans effet, {m['plein']} avec {m['fumees']} bouffées de fumée, {m['etincelles']} étincelles et {m['traces']} bandes de traces)")
    t(f'{titre} : la fumée, les étincelles et les traces de pneus : un appel de dessin chacune, au plus 3 de plus en tout ; aucun quand elles sont vides (effets coupés : la même image)',
      m['fumees'] > 0 and m['etincelles'] > 0 and m['traces'] >= 10 and m['visibles'] == [True, True, True] and 0 < m['plein'] - m['vide'] <= 3 and m['coupe'] == m['vide'], str(m))
    pg.evaluate('() => { EFFETS3D.etat.fumee.length = 0; EFFETS3D.etat.etincelle.length = 0; EFFETS3D.etat.trace.length = 0; BOUCLE.demarrer(); }')
    # le réglage du menu pause : oui → non (sauvegardé) → oui
    r = pg.evaluate('''() => { const b = document.getElementById("boutonEffetsPause"), vu = [b.textContent, SENSATIONS.actif]; b.click(); vu.push(b.textContent, SENSATIONS.actif, SAUVEGARDE.option("effets", "?")); b.click(); vu.push(SENSATIONS.actif, SAUVEGARDE.option("effets", "?"));
      return vu; }''')
    t(f'{titre} : « Effets de conduite » se règle dans le menu pause (oui, non ; sauvegardé)', r[1] is True and r[3] is False and r[4] is False and r[5] is True and r[6] is True and r[0] != r[2], str(r))
    # le premier geste (une touche sans rôle) : le son démarre, la course continue sans erreur
    pg.evaluate('() => { window.__errSens = []; window.addEventListener("error", e => __errSens.push(e.message)); }')
    t0 = pg.evaluate('() => JEU.course.temps')
    pg.keyboard.press('KeyJ'); pg.wait_for_timeout(1500)
    s = pg.evaluate('() => ({ actif: SON.actif, etat: SON.etatContexte, erreurs: __errSens, avance: JEU.course.temps })')
    t(f'{titre} : au premier geste, le son démarre (moteur, pneus, vibreurs, herbe, aspiration, voisin, pluie) et la course continue sans erreur', s['actif'] and s['etat'] != 'aucun' and not s['erreurs'] and s['avance'] > t0, str(s))
# la manette (manette.js, tour 38) : de fausses manettes (navigator.getGamepads remplacé avant le chargement, ?test=manette…) ;
# window.__pads : la liste ; __padFixer(k, nom, valeur) appuie (1) ou relâche (0) un bouton, ou pose un axe ('axe0')
FAUSSES_MANETTES = """(() => { const pad = i => ({ index: i, id: 'fausse manette ' + i, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })) });
  window.__vibrations = [];   // (la vibration, tour 42 : chaque impulsion demandée à la manette)
  const vibrante = p => Object.assign(p, { vibrationActuator: { type: 'dual-rumble', playEffect: (t, o) => { window.__vibrations.push([p.index, t, o.strongMagnitude, o.weakMagnitude]); return Promise.resolve('complete'); } } });
  window.__pads = [vibrante(pad(0))]; if (/test=manette-deux/.test(location.search)) window.__pads.push(vibrante(pad(1)));
  navigator.getGamepads = () => window.__pads;
  window.__padFixer = (k, nom, x) => { const p = window.__pads[k]; if (nom.startsWith('axe')) p.axes[+nom.slice(3)] = x; else p.buttons[MANETTE.BOUTONS[nom]] = { value: x, pressed: x > 0.5 }; }; })();"""
def manette_appui(pg, k, nom):
    # un appui franc : enfoncé pendant quelques images, puis relâché (la manette est lue à chaque image)
    pg.evaluate('([k, n]) => __padFixer(k, n, 1)', [k, nom]); pg.wait_for_timeout(350)
    pg.evaluate('([k, n]) => __padFixer(k, n, 0)', [k, nom]); pg.wait_for_timeout(350)
# une course seule : la fausse manette conduit un tour entier (gâchettes et stick posés chaque image d'après le robot d'essai,
# en analogique, la zone morte compensée) ; Start ouvre la pause, la croix choisit un bouton (un halo), A le valide, B reprend
def manette_ecran(pg, titre):
    pg.evaluate('''() => { const Z = REGLAGES.MANETTE_ZONE_STICK, ZG = REGLAGES.MANETTE_ZONE_GACHETTE, avant = z => x => x <= 0 ? 0 : z + x * (1 - z);
      BOUCLE.surAffichage(() => { if (!window.__conduire) return; const c = piloteRobot(JEU.joueur, CIRCUIT), d = c.direction;
        __padFixer(0, 'gachetteD', avant(ZG)(c.gaz)); __padFixer(0, 'gachetteG', avant(ZG)(c.frein)); __padFixer(0, 'axe0', Math.sign(d) * avant(Z)(Math.abs(d))); });
      window.__conduire = true; }''')
    fini = attendre(pg, '() => JEU.course && JEU.course.tours.length >= 1', None, 240000)
    r = pg.evaluate('() => ({ tours: JEU.course.tours.map(x => x.temps), coupes: JEU.course.tours.filter(x => x.coupe).length, robot: !!JEU.robot })')
    L.append(f"  (la fausse manette : un tour en {r['tours'][0] if r['tours'] else '—'} s)")
    t(f'{titre} : une fausse manette conduit un tour entier (gâchettes et stick en analogique), sans robot ni clavier', fini and not r['robot'], str(r))
    pg.evaluate('() => { window.__conduire = false; for (const n of ["gachetteD", "gachetteG", "axe0"]) __padFixer(0, n, 0); }'); pg.wait_for_timeout(300)
    manette_appui(pg, 0, 'start')
    t(f'{titre} : Start ouvre la pause', pg.evaluate('() => JEU.ecran') == 'pause', pg.evaluate('() => JEU.ecran'))
    # la croix choisit les boutons du menu pause, jusqu'à « Effets de conduite » ; A le change ; B reprend la course
    # (tour 53i) un appui peut passer entre deux images sur une machine chargée (la manette se lit à chaque image) : on le répète jusqu'à ce que le halo change, au lieu de compter sur un délai fixe
    attendre(pg, '() => JEU.ecran === "pause" && !document.getElementById("pause").classList.contains("cache")', None, 10000)
    HALO = '() => { const b = document.querySelector("button.manette-choix"); return b ? b.id : null; }'
    vus = []
    for _ in range(30):
        ch = pg.evaluate(HALO)
        if not vus or vus[-1] != ch: vus.append(ch)
        if ch == 'boutonEffetsPause': break
        for _ in range(6):
            manette_appui(pg, 0, 'droite' if ch == 'boutonCommentairePause' else 'bas')
            if pg.evaluate(HALO) != ch: break
    avant = pg.evaluate('() => SENSATIONS.actif')
    for _ in range(6):   # (un appui perdu entre deux images : on le répète tant que le réglage n'a pas changé)
        manette_appui(pg, 0, 'a')
        if pg.evaluate('() => SENSATIONS.actif') != avant: break
    apres = pg.evaluate('() => [SENSATIONS.actif, document.querySelectorAll("button.manette-choix").length]')
    t(f'{titre} : dans le menu pause, la croix choisit un bouton (un halo, un seul à la fois) et A le valide (« Effets de conduite » changé)', 'boutonEffetsPause' in vus and apres[0] == (not avant) and apres[1] == 1, str([vus, avant, apres]))
    # (A remet « Effets de conduite », B reprend la course ; sous swiftshader chargé, une image peut manquer un appui court : on réappuie)
    for _ in range(3):
        manette_appui(pg, 0, 'a')
        if pg.evaluate('() => SENSATIONS.actif') == avant: break
    for _ in range(3):
        manette_appui(pg, 0, 'b')
        if pg.evaluate('() => JEU.ecran') == 'course': break
    t(f'{titre} : B quitte la pause, la course reprend ; le halo disparaît en conduite', pg.evaluate('() => JEU.ecran === "course" && SENSATIONS.actif && !document.querySelector("button.manette-choix")'), pg.evaluate('() => [JEU.ecran, SENSATIONS.actif]'))
    # Y change la caméra, A remet sur la piste
    c0 = pg.evaluate('() => CAMERA.mode'); manette_appui(pg, 0, 'y')
    t(f'{titre} : Y change la caméra', pg.evaluate('() => CAMERA.mode') != c0, c0)
    # la vibration (tour 42) : l'arrière qui part fait vibrer le gros moteur (les faits de la voiture remplacés 1,5 s), puis plus rien
    vb = pg.evaluate('''async () => { const de = SENSATIONS.de; window.__vibrations.length = 0; SENSATIONS.de = v => Object.assign({}, SENSATIONS.RIEN, { arriere: 1 });
      await new Promise(r => setTimeout(r, 1500)); SENSATIONS.de = de; const glisse = window.__vibrations.slice(); window.__vibrations.length = 0;
      await new Promise(r => setTimeout(r, 1000)); return { glisse: glisse.length, fort: glisse.length ? glisse[0][2] : 0, type: glisse.length ? glisse[0][1] : null, apres: window.__vibrations.filter(x => x[2] > 0.5).length }; }''')
    t(f'{titre} : la manette vibre quand l’arrière part (le gros moteur, « dual-rumble »), et plus de gros moteur quand la voiture accroche', vb['glisse'] >= 2 and vb['fort'] > 0.5 and vb['type'] == 'dual-rumble' and vb['apres'] == 0, str(vb))
# le téléphone (tactile.js, tour 51k) : l'écran tactile est émulé par Playwright (has_touch) ; les doigts sont de faux évènements pointer
# (pointerType touch, un pointerId par doigt) sur les boutons ; le volant, de faux évènements deviceorientation (beta = l'inclinaison)
FAUSSE_PERMISSION = "DeviceOrientationEvent.requestPermission = () => Promise.resolve(sessionStorage.getItem('perm') || 'granted');"
DOIGT = "([id, pid, bas]) => { const el = document.getElementById(id); el.dispatchEvent(new PointerEvent(bas ? 'pointerdown' : 'pointerup', { pointerId: pid, pointerType: 'touch', isPrimary: pid === 1, bubbles: true, cancelable: true })); }"
INCLINER = "(beta) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta, gamma: 0, absolute: false }))"
TACTILE_ETAT = '''() => { const b = id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return { cache: e.classList.contains('cache') || getComputedStyle(e).display === 'none', x: r.left, y: r.top, l: r.width, h: r.height, texte: e.textContent }; };
  return { present: TACTILE.estPresent(), mode: TACTILE.etat.mode, choix: TACTILE.etat.choix, neutre: TACTILE.etat.neutre, cibles: Object.assign({}, JEU.cibles), ecran: JEU.ecran, W: innerWidth, H: innerHeight,
    tactile: !document.getElementById('tactile').classList.contains('cache'), gaz: b('tactileGaz'), frein: b('tactileFrein'), gauche: b('tactileGauche'), droite: b('tactileDroite'), pause: b('tactilePause'),
    activer: b('tactileActiver'), portrait: b('tactilePortrait'), volantPause: b('boutonVolantPause'), recentrer: b('boutonRecentrerPause') }; }'''
CONDUITE_DOIGTS = '''() => { clearInterval(window.__penche); const Z = REGLAGES.VOLANT_ZONE_MORTE, P = REGLAGES.VOLANT_PLEIN, doigt = (id, pid, bas) => document.getElementById(id).dispatchEvent(new PointerEvent(bas ? 'pointerdown' : 'pointerup', { pointerId: pid, pointerType: 'touch', isPrimary: pid === 1, bubbles: true, cancelable: true }));
      window.__tenus = { gaz: false, frein: false };
      BOUCLE.surAffichage(() => { if (!window.__conduire) return; const c = piloteRobot(JEU.joueur, CIRCUIT);
        const gaz = c.gaz > 0.3, frein = c.frein > 0.3;
        if (gaz !== window.__tenus.gaz) { doigt('tactileGaz', 1, gaz); window.__tenus.gaz = gaz; }
        if (frein !== window.__tenus.frein) { doigt('tactileFrein', 2, frein); window.__tenus.frein = frein; }
        const d = c.direction, a = d === 0 ? 0 : Math.sign(d) * (Z + Math.min(1, Math.abs(d)) * (P - Z));
        window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: TACTILE.etat.neutre + a, gamma: 0 })); });
      window.__conduire = true; }'''   # (tour 52b : le robot d'essai dicte, tout passe par les faux doigts et le faux volant)
def titre_simple(pg, titre, l, h):
    """(tour 53c) l'écran titre : sur tactile ou sous 700 px, 2 boutons + 🔊 ; au clavier en grand, la rangée « Apprendre / Aides / Touches » comme avant."""
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "titre"', None, 60000)
    pg.wait_for_timeout(400)
    etat = pg.evaluate("""() => { const vis = id => { const e = document.getElementById(id); return !!e && e.offsetParent !== null; };
      return { tactile: document.body.classList.contains('tactile'), simple: document.body.classList.contains('titreSimple'), jouer: vis('boutonJouer'), amis: vis('boutonAmis'),
        apprendre: vis('boutonTutorielTitre'), aides: vis('boutonAidesTitre'), touches: vis('boutonTouchesTitre'),
        paddock: ['boutonTutorielPaddock', 'boutonAidesPaddock', 'boutonTouchesPaddock'].every(id => !!document.getElementById(id)) }; }""")
    d = pg.evaluate(DEDANS_JS, '#titre button')
    if 'tactile' in titre or l < 700:
        t(f'{titre} : sur un écran tactile (ou sous 700 px), le titre n’a que « ▶ Jouer » et « Entre amis » (et 🔊), tout dans l’écran ; « Apprendre / Aides / Touches » sont dans les Réglages du paddock',
          etat['jouer'] and etat['amis'] and not etat['apprendre'] and not etat['aides'] and not etat['touches'] and etat['paddock'] and d['n'] == 2 and d['dedans'] and d['defile'] and not d['recouvre'], str([etat, d]))
        pg.screenshot(path=os.path.join(CAPTURES, 'titre-640-tactile.png'))
    else:
        t(f'{titre} : au clavier en grand, le titre est inchangé : « ▶ Jouer », « Entre amis », « Apprendre », « Aides », « Touches »',
          etat['jouer'] and etat['amis'] and etat['apprendre'] and etat['aides'] and etat['touches'] and d['n'] == 5 and d['dedans'] and d['defile'] and not d['recouvre'], str([etat, d]))
        pg.screenshot(path=os.path.join(CAPTURES, 'titre-1280.png'))
    pg.evaluate('() => { REGLAGES.TITRE_SIMPLE = false; INTERFACE.preparerTitre(() => {}, () => {}, () => {}); }')
    t(f'{titre} : avec TITRE_SIMPLE faux, la rangée est là comme avant', pg.evaluate('() => document.getElementById("boutonTouchesTitre").offsetParent !== null'))

def apres_course(pg, titre, l, h):
    """(tour 53d) la boucle « encore une course » : du podium au paddock, 2 clics au plus, rien de changé dans l'argent ni les points."""
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    paddock_clic(pg, '#boutonCourseSuivante')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.etat === "compte"', None, 180000)
    for _ in range(400):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(30)
    pg.evaluate('''() => { window.__ref = (() => { const ch = JSON.parse(JSON.stringify(JEU.championnat)); CHAMPIONNAT.finirGrandPrix(ch, CHAMPIONNAT.lignesDepuisCourse(JEU.plateau), JEU.assistance); const j = ch.pilotes.find(p => p.humain);
      return { solde: ARGENT.solde(ch), points: j.stats.points, prochain: ch.prochain }; })(); window.__t0 = performance.now(); }''')
    p = pg.evaluate("""() => { const v = id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return { vu: e.offsetParent !== null && !e.classList.contains('cache'), dedans: r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, haut: r.top, bas: r.bottom, h: r.height }; };
      return { ecran: JEU.ecran, gains: document.getElementById('podiumGains').textContent, suite: v('boutonPodiumSuite'), res: v('boutonResultats'), g: v('podiumGains'), suiteTexte: document.getElementById('boutonPodiumSuite').textContent }; }""")
    t(f'{titre} : le podium de la carrière montre les gains (« {p["gains"]} ») et un gros « Continuer », « Résultats » reste en petit, tout dans l’écran',
      p['ecran'] == 'podium' and '€' in p['gains'] and 'pts' in p['gains'] and p['suite']['vu'] and p['suite']['dedans'] and p['res']['vu'] and p['res']['dedans'] and p['g']['dedans'] and p['suite']['h'] > p['res']['h'], str(p))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, f'apres-podium-{l}.png'))
    clics = 0
    pg.click('#boutonPodiumSuite'); clics += 1
    t(f'{titre} : clic 1, « Continuer » : droit à l’interview, avec « Passer » visible', attendre(pg, '() => JEU.ecran === "interview"', None, 5000) and pg.evaluate('() => { const b = document.getElementById("boutonPasCommentaire"); return b.offsetParent !== null && b.textContent === texte("interviewPasser") && !b.classList.contains("petit"); }'))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, f'apres-interview-{l}.png'))
    pg.click('#boutonPasCommentaire'); clics += 1
    t(f'{titre} : clic 2, « Passer » : la une du journal, le Grand Prix est enregistré', attendre(pg, '() => JEU.ecran === "une" && JEU.grandPrixFini', None, 5000))
    debut = pg.evaluate('() => performance.now()')
    arrive = attendre(pg, '() => JEU.ecran === "championnat"', None, 20000)
    duree = (pg.evaluate('() => performance.now()') - debut) / 1000
    t(f'{titre} : sans un 3e clic, la une passe toute seule au paddock en moins de UNE_AUTO_DUREE + 3 s ({duree:.1f} s) : {clics} clics du podium au paddock', arrive and clics <= 2 and duree <= pg.evaluate('() => REGLAGES.UNE_AUTO_DUREE') + 3, f'{clics} / {duree}')
    apres = pg.evaluate('() => { const j = JEU.championnat.pilotes.find(p => p.humain); return { solde: ARGENT.solde(JEU.championnat), points: j.stats.points, prochain: JEU.championnat.prochain }; }')
    ref = pg.evaluate('() => window.__ref')
    t(f'{titre} : l’argent, les points et le Grand Prix suivant sont exactement ceux de l’ancien chemin (Résultats, Continuer, interview, une)', apres == ref, f'{apres} / {ref}')
    pg.evaluate('() => { REGLAGES.UNE_AUTO_DUREE = 0; }')
    t(f'{titre} : le paddock affiche l’argent', pg.evaluate('() => !document.getElementById("championnat").classList.contains("cache")'))

def tactile_classement(pg, titre, l, h):
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000); pg.wait_for_timeout(500)
    def tape(sel, n=0):
        c = pg.evaluate('([s, n]) => { const r = document.querySelectorAll(s)[n].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }', [sel, n])
        pg.touchscreen.tap(c[0], c[1]); pg.wait_for_timeout(600)
    etat = '() => { const b = document.getElementById("classementPlein"), l = [...b.querySelectorAll("li")]; return { ouvert: !b.classList.contains("cache"), n: l.length, mini: Math.min(...l.map(x => x.getBoundingClientRect().height)), ecran: JEU.ecran }; }'
    tape('#paddockClassementCourt li.rival')
    e = pg.evaluate(etat)
    t(f'{titre} : au doigt, un appui sur le classement de la page Course ouvre la liste entière : 20 lignes d’au moins 40 px', e['ouvert'] and e['n'] == 20 and e['mini'] >= 40, str(e))
    pg.screenshot(path=os.path.join(CAPTURES, 'classement-plein-640.png'))
    tape('#boutonClassementPleinRetour')
    t(f'{titre} : « Retour » referme la liste', not pg.evaluate(etat)['ouvert'], str(pg.evaluate(etat)))
    pg.evaluate('() => document.getElementById("menuSaison").click()'); pg.wait_for_timeout(500)
    tape('#championnatPilotes li.rival', 2)
    t(f'{titre} : le classement de la page Saison ouvre la même liste', pg.evaluate(etat)['ouvert'], str(pg.evaluate(etat)))
    tape('#classementPleinListe li.rival', 1)
    e = pg.evaluate(etat)
    t(f'{titre} : un appui sur une ligne ouvre la fiche du rival et ferme la liste', e['ecran'] == 'fiche' and not e['ouvert'], str(e))

def longueurs_ecran(pg, titre, l, h):
    """(tour 53h) les trois longueurs sur la page Course : visibles et dans l'écran, sans cacher « Course suivante » ; le choix est gardé ; la course a ce nombre de tours."""
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    pg.evaluate('() => { if (typeof AIDES_ECRAN !== "undefined") { REGLAGES.AIDES_ACTIVES = false; AIDES_ECRAN.fermer(); } }')
    pg.click('#menuCourse'); pg.wait_for_timeout(300)
    d = pg.evaluate("""() => { const r = id => { const e = document.getElementById(id), b = e.getBoundingClientRect(); return { vu: e.offsetParent !== null, dedans: b.left >= -1 && b.top >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1, b: [b.left, b.top, b.right, b.bottom] }; };
      const c = r('boutonCourseSuivante'), x = [5, 12, 18].map(n => r('longueur' + n)), recouvre = x.some(a => a.b[0] < c.b[2] && c.b[0] < a.b[2] && a.b[1] < c.b[3] && c.b[1] < a.b[3]);
      return { x, c, recouvre, choisi: [...document.querySelectorAll('.longueurChoix.choisi b')].map(e => e.textContent), defile: [document.documentElement.scrollHeight, innerHeight] }; }""")
    t(f'{titre} : avant le Grand Prix 3, trois gros boutons 5 / 12 / 18 tours, « très courte » choisie d’office, tout dans l’écran, sans recouvrir « Course suivante »',
      all(a['vu'] and a['dedans'] for a in d['x']) and d['c']['vu'] and d['c']['dedans'] and not d['recouvre'] and d['choisi'] == ['5'] and d['defile'][0] <= d['defile'][1] + 2, str(d))
    pg.screenshot(path=os.path.join(CAPTURES, f'longueurs-{l}.png'))
    pg.click('#longueur12'); pg.wait_for_timeout(200)
    t(f'{titre} : un clic sur 12 le choisit et le garde dans la sauvegarde', pg.evaluate('() => SAUVEGARDE.option("longueurGP", null) === "moyenne" && document.querySelector(".longueurChoix.choisi b").textContent === "12"'))
    if l != 1280: return
    pg.click('#boutonCourseSuivante')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau && JEU.plateau.carte !== null && JEU.course.etat === "compte"', None, 180000)
    c = pg.evaluate('() => ({ tours: JEU.course.nbTours, plateau: JEU.plateau.nbTours, arret: arretObligatoire(JEU.course.nbTours), pas5: arretObligatoire(5), penalite: penaliteSansArret({ arrets: 0 }, JEU.course.nbTours), penalite18: penaliteSansArret({ arrets: 0 }, 18) })')
    t(f'{titre} : la course dure 12 tours, avec l’arrêt obligatoire (+{c["penalite"]} s sans arrêt, comme à 18 tours : +{c["penalite18"]} s), que la course de 5 tours n’a pas', c['tours'] == 12 and c['plateau'] == 12 and c['arret'] and not c['pas5'] and c['penalite'] > 0 and c['penalite18'] == c['penalite'], str(c))

def tactile_ecran(pg, titre, l, h, page):
    if 'tactile-titre' in page: return titre_simple(pg, titre, l, h)
    if 'tactile-classement' in page: return tactile_classement(pg, titre, l, h)
    if 'tactile-iphone' in page: return tactile_iphone(pg, titre, l, h)
    if 'tactile-reglages' in page: return tactile_reglages(pg, titre, l, h)
    if 'tactile-decouverte' in page: return tactile_decouverte(pg, titre, l, h)
    pret = attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "course"', None, 30000)
    pg.wait_for_timeout(300)
    e = pg.evaluate(TACTILE_ETAT)
    dedans = lambda b: b['x'] >= 0 and b['y'] >= 0 and b['x'] + b['l'] <= e['W'] + 1 and b['y'] + b['h'] <= e['H'] + 1
    t(f'{titre} : sur un écran tactile, GAZ et FREIN s’affichent pendant la conduite, en bas à droite, dans l’écran, FREIN à gauche de GAZ, en gros (≥ 72 px)',
      pret and e['tactile'] and not e['gaz']['cache'] and not e['frein']['cache'] and dedans(e['gaz']) and dedans(e['frein']) and e['gaz']['x'] > e['W'] / 2 and e['gaz']['y'] > e['H'] / 2 and e['frein']['x'] + e['frein']['l'] <= e['gaz']['x'] + 1
      and e['gaz']['l'] >= 72 and e['frein']['l'] >= 72 and e['gaz']['texte'] == pg.evaluate('() => texte("tac_gaz")') and e['frein']['texte'] == pg.evaluate('() => texte("tac_frein")'), str(e))
    # (tour 52b) rien ne se chevauche : 🔊 ⏸ ↩, le bandeau du tour, la minicarte, la tour de classement, GAZ / FREIN (ceux qui sont affichés)
    sup = pg.evaluate("""() => { const ids = ['boutonSon', 'tactilePause', 'tactileRemise', 'hudCourse', 'minicarte', 'classement', 'tactileGaz', 'tactileFrein'], r = [];
      for (const id of ids) { const e = document.getElementById(id); if (!e || e.classList.contains('cache') || getComputedStyle(e).display === 'none') continue; const b = e.getBoundingClientRect(); if (b.width > 0) r.push([id, b.left, b.top, b.right, b.bottom]); }
      const c = []; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i], b = r[j]; if (a[1] < b[3] - 1 && b[1] < a[3] - 1 && a[2] < b[4] - 1 && b[2] < a[4] - 1) c.push(a[0] + '/' + b[0]); }
      return { vus: r.map(x => x[0]), chevauchements: c }; }""")
    t(f'{titre} : ni 🔊, ⏸, ↩, le bandeau du tour, la minicarte, la tour de classement, GAZ ou FREIN ne se recouvrent', pret and not sup['chevauchements'] and len(sup['vus']) >= 5, str(sup))
    # sans capteur (aucun évènement d'orientation n'arrive) : après VOLANT_ATTENTE, le mode « boutons » et ◀ ▶ en bas à gauche
    boutons = attendre(pg, '() => TACTILE.etat.mode === "boutons"', None, 8000)
    e = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : sans capteur d’orientation, après {pg.evaluate("() => REGLAGES.VOLANT_ATTENTE")} s, les boutons ◀ ▶ de secours apparaissent en bas à gauche ; pas de « Recentrer » ni de choix du volant dans la pause',
      boutons and not e['gauche']['cache'] and not e['droite']['cache'] and dedans(e['gauche']) and dedans(e['droite']) and e['droite']['x'] + e['droite']['l'] < e['W'] / 2 and e['gauche']['y'] > e['H'] / 2 and e['gauche']['x'] + e['gauche']['l'] <= e['droite']['x'] + 1
      and e['volantPause']['cache'] and e['recentrer']['cache'], str(e))
    # les doigts : GAZ tenu → gaz 1 ; GAZ et ▶ en même temps (deux doigts) → gaz 1 et direction 1 ; FREIN par-dessus → frein 1 ; tout lâché → 0
    # (le Mac chargé : une image peut prendre plus d'une seconde sous swiftshader ; on attend que les cibles suivent, 4 s au plus)
    pg.evaluate(DOIGT, ['tactileGaz', 1, True]); attendre(pg, '() => JEU.cibles.gaz === 1', None, 4000)
    a = pg.evaluate('() => [TACTILE.cibles(), Object.assign({}, JEU.cibles), document.getElementById("tactileGaz").classList.contains("tenu")]')
    pg.evaluate(DOIGT, ['tactileDroite', 2, True]); pg.evaluate(DOIGT, ['tactileFrein', 3, True]); attendre(pg, '() => JEU.cibles.gaz === 1 && JEU.cibles.frein === 1 && JEU.cibles.direction === 1', None, 4000)
    b = pg.evaluate('() => [TACTILE.cibles(), Object.assign({}, JEU.cibles)]')
    pg.evaluate(DOIGT, ['tactileGaz', 1, False]); pg.evaluate(DOIGT, ['tactileDroite', 2, False]); pg.evaluate(DOIGT, ['tactileFrein', 3, False]); attendre(pg, '() => JEU.cibles.gaz === 0 && JEU.cibles.frein === 0 && JEU.cibles.direction === 0', None, 4000)
    c = pg.evaluate('() => [TACTILE.cibles(), Object.assign({}, JEU.cibles), document.getElementById("tactileGaz").classList.contains("tenu")]')
    t(f'{titre} : un doigt sur GAZ donne gaz 1 dans les cibles du joueur (le bouton s’allume) ; trois doigts à la fois (GAZ, ▶, FREIN) donnent gaz 1, direction 1, frein 1 ; tout lâché, 0 partout',
      a[0]['gaz'] == 1 and a[1]['gaz'] == 1 and a[1]['direction'] == 0 and a[2] and b[0] == {'gaz': 1, 'frein': 1, 'direction': 1} and b[1]['gaz'] == 1 and b[1]['frein'] == 1 and b[1]['direction'] == 1
      and c[0] == {'gaz': 0, 'frein': 0, 'direction': 0} and c[1] == {'gaz': 0, 'frein': 0, 'direction': 0} and not c[2], str([a, b, c]))
    # le volant : de faux évènements d'orientation ; la première mesure est le neutre (ici 40°, le téléphone tenu comme on veut) ; ◀ ▶ disparaissent
    pg.evaluate(INCLINER, 40); attendre(pg, '() => TACTILE.etat.mode === "volant" && document.getElementById("tactileGauche").classList.contains("cache")', None, 4000)
    e = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : dès qu’une mesure d’orientation arrive, le volant prend la main (neutre = la première mesure, 40°), les boutons ◀ ▶ disparaissent, la pause propose « Recentrer » et le choix du volant',
      e['mode'] == 'volant' and e['neutre'] == 40 and e['gauche']['cache'] and e['droite']['cache'] and not e['volantPause']['cache'] and not e['recentrer']['cache']
      and e['volantPause']['texte'] == pg.evaluate('() => texte("tac_mode_volant")') and e['recentrer']['texte'] == pg.evaluate('() => texte("tac_recentrer")'), str(e))
    # 25° à droite (beta 65) = braquage à fond ; lissé, il y arrive en moins d'une seconde
    pg.evaluate("() => { window.__beta = 65; window.__pencher = () => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: window.__beta, gamma: 0 })); window.__penche = setInterval(window.__pencher, 16); }")
    plein = attendre(pg, '() => JEU.cibles.direction >= 0.98 && TACTILE.cibles().direction >= 0.98', None, 6000)
    d1 = pg.evaluate('() => [JEU.cibles.direction, TACTILE.cibles().direction, JEU.cibles.gaz]')
    t(f'{titre} : 25° à droite du neutre = braquage à fond (direction 1), sans gaz', plein and d1[2] == 0, str(d1))
    # la zone morte : 1° ne braque pas ; 12,5° de l'autre côté : à peu près la moitié (la zone morte retirée, sans saut)
    pg.evaluate('() => { window.__beta = 41; }')
    d0 = attendre(pg, '() => JEU.cibles.direction === 0', None, 4000)   # (le lissage : quelques images)
    z, p = pg.evaluate('() => [REGLAGES.VOLANT_ZONE_MORTE, REGLAGES.VOLANT_PLEIN]')
    attendu = -(12.5 - z) / (p - z)
    pg.evaluate('() => { window.__beta = 40 - 12.5; }')
    dm = attendre(pg, 'a => Math.abs(JEU.cibles.direction - a) < 0.03', attendu, 4000)
    t(f'{titre} : 1° dans la zone morte ne braque pas ; 12,5° à gauche braque à gauche, à {attendu:.2f} (la zone morte retirée, sans saut)', d0 and dm, str([d0, dm, pg.evaluate('() => JEU.cibles.direction'), attendu]))
    # « Recentrer » : le neutre devient l'angle d'aujourd'hui (27,5°), et l'on ne braque plus
    pg.evaluate('() => TACTILE.recentrer()')
    attendre(pg, '() => JEU.cibles.direction === 0', None, 4000)
    r = pg.evaluate('() => [TACTILE.etat.neutre, JEU.cibles.direction]')
    t(f'{titre} : « Recentrer » prend l’angle du moment pour neutre, et le volant recentré ne braque pas', r[0] == 27.5 and r[1] == 0, str(r))
    # le choix de la pause : « Direction : boutons ◀ ▶ » rend les boutons, même avec un capteur ; puis retour au volant
    pg.evaluate('() => document.getElementById("boutonVolantPause").click()')
    e = pg.evaluate(TACTILE_ETAT)   # (rafraichir est immédiat : pas d'image à attendre)
    pg.evaluate('() => document.getElementById("boutonVolantPause").click()')
    e2 = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : dans la pause, le joueur peut préférer les boutons ◀ ▶ au volant (ils reviennent, « Recentrer » se cache), puis revenir au volant',
      e['choix'] == 'boutons' and not e['gauche']['cache'] and e['recentrer']['cache'] and e['volantPause']['texte'] == pg.evaluate('() => texte("tac_mode_boutons")') and e2['choix'] == 'volant' and e2['gauche']['cache'], str([e['choix'], e2['choix']]))
    # une course sans clavier : le robot d'essai dit quoi faire, mais tout passe par les doigts (GAZ, FREIN tenus ou lâchés) et le volant (l'inclinaison) ;
    # au moins un tour entier, sans robot ni clavier
    pg.evaluate(CONDUITE_DOIGTS)
    pg.wait_for_timeout(4000)
    pg.screenshot(path=os.path.join(CAPTURES, f'tactile-{l}.png'))
    fini = attendre(pg, '() => JEU.course && JEU.course.tours.length >= 1', None, 240000)
    r = pg.evaluate('() => ({ tours: JEU.course.tours.map(x => x.temps), coupes: JEU.course.tours.filter(x => x.coupe).length, robot: !!JEU.robot })')
    L.append(f"  (le téléphone : un tour aux doigts et au volant en {r['tours'][0] if r['tours'] else '—'} s)")
    t(f'{titre} : une course au téléphone, sans clavier ni robot : GAZ / FREIN aux doigts et le volant à l’inclinaison font un tour entier', fini and not r['robot'], str(r))
    pg.evaluate('() => { window.__conduire = false; }'); pg.wait_for_timeout(200)
    for id_, pid in [('tactileGaz', 1), ('tactileFrein', 2)]: pg.evaluate(DOIGT, [id_, pid, False])
    # ⏸ au doigt ouvre la pause ; les boutons de conduite se cachent ; « Reprendre » les rend
    pg.evaluate('() => document.getElementById("tactilePause").click()'); attendre(pg, '() => JEU.ecran === "pause" && document.getElementById("tactile").classList.contains("cache")', None, 4000)
    e = pg.evaluate(TACTILE_ETAT)
    pg.evaluate('() => document.getElementById("boutonReprendre").click()'); attendre(pg, '() => JEU.ecran === "course" && !document.getElementById("tactile").classList.contains("cache")', None, 4000)
    e2 = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : le bouton ⏸ ouvre la pause (les boutons de conduite se cachent) et « Reprendre » les rend', e['ecran'] == 'pause' and not e['tactile'] and e2['ecran'] == 'course' and e2['tactile'], str([e['ecran'], e['tactile'], e2['ecran'], e2['tactile']]))
    # (tour 52b) le premier geste demande le plein écran puis le verrou en paysage (une seule fois), et le refus ne se voit pas
    pg.evaluate("() => { document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); }"); pg.wait_for_timeout(200)
    t(f'{titre} : au premier geste sur un écran tactile, le plein écran puis le verrou en paysage sont demandés, une seule fois', pg.evaluate('() => window.__plein === 2'), str(pg.evaluate('() => window.__plein')))
    # le téléphone debout pendant la course : le message par-dessus tout et la course en pause ; couché : le message part, la pause reste jusqu'à « Reprendre »
    pg.set_viewport_size({'width': h, 'height': l}); attendre(pg, '() => JEU.ecran === "pause" && !document.getElementById("tactilePortrait").classList.contains("cache")', None, 8000)
    d = pg.evaluate(TACTILE_ETAT)
    pg.set_viewport_size({'width': l, 'height': h}); attendre(pg, '() => document.getElementById("tactilePortrait").classList.contains("cache")', None, 8000); pg.wait_for_timeout(500)
    c = pg.evaluate(TACTILE_ETAT)
    pg.evaluate('() => document.getElementById("boutonReprendre").click()'); attendre(pg, '() => JEU.ecran === "course"', None, 4000)
    t(f'{titre} : téléphone debout pendant la course : « Tourne ton téléphone » et la course en pause ; couché : le message disparaît, la pause reste ; « Reprendre » rend la course',
      d['ecran'] == 'pause' and not d['portrait']['cache'] and c['ecran'] == 'pause' and c['portrait']['cache'] and pg.evaluate('() => JEU.ecran === "course"'), str([d['ecran'], d['portrait']['cache'], c['ecran'], c['portrait']['cache']]))
# (tour 52b) de la découverte au podium sans clavier : titre → « ▶ Jouer » au doigt, la course de découverte entière aux doigts et au volant
# (le robot d'essai dicte, rien d'autre ne conduit), le bouton « Passer » au doigt, le podium, « Continuer » : aucune touche
def toucher(pg, sel):   # un toucher au doigt ; si le bouton est caché ou recouvert un instant (mac chargé), le même clic par la page
    try: pg.wait_for_selector(sel, state='visible', timeout=30000)
    except Exception: pass
    try: pg.tap(sel, timeout=8000)
    except Exception: pg.evaluate('s => { const e = document.querySelector(s); if (e) e.click(); }', sel)
def tactile_decouverte(pg, titre, l, h):
    attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "titre"', None, 30000)
    toucher(pg, '#boutonJouer')
    t(f'{titre} : au doigt, « ▶ Jouer » mène à la grille de la course de découverte', attendre(pg, '() => JEU.ecran === "course" && JEU.plateau && JEU.qualif === null && !!JEU.decouverte', None, 30000), str(pg.evaluate('() => JEU.ecran')))
    attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.etat !== "compte"', None, 240000)
    attendre(pg, '() => TACTILE.etat.mode === "boutons" || TACTILE.etat.mode === "volant"', None, 20000)
    pg.evaluate("() => { window.__beta0 = 40; window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: 40, gamma: 0 })); }")
    pg.evaluate(CONDUITE_DOIGTS)
    arrive = attendre(pg, '() => !!JEU.attente || JEU.ecran === "podium"', None, 560000)
    pg.evaluate('() => { window.__conduire = false; }')
    for id_, pid in [('tactileGaz', 1), ('tactileFrein', 2)]: pg.evaluate(DOIGT, [id_, pid, False])
    pg.screenshot(path=os.path.join(CAPTURES, f'tactile-decouverte-{l}.png'))
    t(f'{titre} : les trois tours de la course de découverte se font aux doigts et au volant, sans clavier ni robot', arrive and pg.evaluate('() => !JEU.robot'), str(pg.evaluate('() => [JEU.ecran, JEU.course ? JEU.course.etat : null, JEU.course ? JEU.course.tours.length : null]')))
    if pg.evaluate('() => JEU.ecran === "course" && !document.getElementById("attenteArrivee").classList.contains("cache")'): toucher(pg, '#boutonPasser')
    t(f'{titre} : à l’arrivée, « Passer » au doigt mène au podium', attendre(pg, '() => JEU.ecran === "podium"', None, 120000), str(pg.evaluate('() => JEU.ecran')))
    toucher(pg, '#boutonPodiumContinuer')
    t(f'{titre} : « Continuer » au doigt mène à la création du pilote : toute la découverte s’est jouée sans une touche du clavier', attendre(pg, '() => JEU.ecran === "pilote"', None, 20000), str(pg.evaluate('() => JEU.ecran')))

# (tour 53f) les réglages du volant, sur écran tactile : dans les Réglages du paddock (et la pause), sensibilité en 3 crans, volant inversé, choix volant / ◀ ▶,
# « Recentrer » ; gros boutons, sauvegardés (ils survivent à un rechargement) ; sans tactile, rien n'apparaît
def tactile_reglages(pg, titre, l, h):
    attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "championnat"', None, 60000)
    pg.evaluate('() => { if (typeof AIDES_ECRAN !== "undefined") { REGLAGES.AIDES_ACTIVES = false; AIDES_ECRAN.fermer(); } }')
    pg.evaluate('() => document.getElementById("menuReglages").click()'); pg.wait_for_timeout(400)
    ETAT = """() => { const ids = ['sens', 'inverse', 'choix', 'recentrer'].map(c => document.getElementById('reglagesVolant_' + c)), r = ids.map(b => b ? b.getBoundingClientRect() : null);
      return { n: ids.filter(b => b).length, vus: r.every(x => x && x.width > 0), min: Math.min(...r.map(x => x ? x.height : 0)), minl: Math.min(...r.map(x => x ? x.width : 0)), dedans: r.every(x => x && x.right <= innerWidth + 1 && x.bottom <= innerHeight + 1 || true),
        textes: ids.map(b => b ? b.textContent : null), pause: ['sens', 'inverse'].map(c => { const b = document.getElementById('pauseTactile_' + c); return b ? parseFloat(getComputedStyle(b).minHeight) : 0; }),
        cran: TACTILE.reglages.cran, inverse: TACTILE.reglages.inverse, choix: TACTILE.etat.choix, b: TACTILE.braquage(12.5, 0, 1) }; }"""
    e0 = pg.evaluate(ETAT)
    t(f'{titre} : sur écran tactile, les Réglages du paddock montrent le volant : sensibilité, inversé, direction, recentrer, en gros boutons (≥ 40 px), textes courts', e0['n'] == 4 and e0['vus'] and e0['min'] >= 40 and e0['minl'] >= 40 and all(x and len(x) <= 22 for x in e0['textes']) and e0['pause'][0] >= 40, str(e0))
    clic = lambda c: (pg.evaluate('(c) => document.getElementById("reglagesVolant_" + c).click()', c), pg.wait_for_timeout(100))
    clic('sens'); vif = pg.evaluate(ETAT)
    clic('sens'); doux = pg.evaluate(ETAT)
    clic('sens'); normal = pg.evaluate(ETAT)
    t(f'{titre} : chaque cran change le braquage pour un même angle (12,5° : doux < normal < vif), et le texte du bouton suit',
      doux['cran'] == 0 and normal['cran'] == 1 and vif['cran'] == 2 and 0 < doux['b'] < normal['b'] < vif['b'] <= 1 and len({e0['textes'][0], vif['textes'][0], doux['textes'][0]}) == 3, str([doux['b'], normal['b'], vif['b'], doux['textes'][0], normal['textes'][0], vif['textes'][0]]))
    clic('sens'); clic('sens')   # (vif, puis doux : le doux est gardé pour le rechargement)
    clic('inverse'); inv = pg.evaluate(ETAT)
    clic('choix'); cb = pg.evaluate(ETAT)
    t(f'{titre} : « Inversé » change le signe du braquage ; « Direction » passe aux boutons ◀ ▶', inv['inverse'] and inv['b'] < 0 and abs(inv['b'] + doux['b']) < 1e-6 and cb['choix'] == 'boutons' and cb['textes'][2] != inv['textes'][2], str([inv['b'], doux['b'], cb['choix']]))
    pg.reload(); attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "championnat"', None, 60000)
    ap = pg.evaluate(ETAT)
    t(f'{titre} : les choix du volant sont sauvegardés : après un rechargement, cran doux, inversé, direction ◀ ▶', ap['cran'] == 0 and ap['inverse'] and ap['choix'] == 'boutons' and ap['b'] < 0, str([ap['cran'], ap['inverse'], ap['choix'], ap['b']]))
    # sans tactile (la classe body.tactile retirée) : le bloc est caché
    pg.evaluate('() => { document.getElementById("menuReglages").click(); document.body.classList.remove("tactile"); }'); pg.wait_for_timeout(200)
    c = pg.evaluate('() => { const e = document.getElementById("reglagesVolant"); return getComputedStyle(e).display; }')
    t(f'{titre} : sans écran tactile, les réglages du volant ne s’affichent pas', c == 'none', c)

# l'iPhone : le navigateur ne donne l'orientation qu'après un toucher (DeviceOrientationEvent.requestPermission, faux ici) ; sur l'écran titre,
# (tour 53e : « 🎮 Activer le volant » est sur la grille, pendant les feux) ; accordée → le volant écoute ; refusée (rechargement avec sessionStorage perm = denied) → les boutons ◀ ▶ ;
# le téléphone debout (viewport portrait) → « Tourne ton téléphone »
def grille_iphone(pg, titre, l, h, passage):
    """(tour 53e) du titre à la grille de la découverte : le bouton « Activer le volant » y est (gros, centre-bas, sous les feux), pas sur le titre"""
    e = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : {passage} : sur l’écran titre, pas de « 🎮 Activer le volant »', e['activer']['cache'] and e['mode'] == 'aucun', str(e['activer']))
    toucher(pg, '#boutonJouer')
    attendre(pg, '() => JEU.ecran === "course" && JEU.course && JEU.course.etat === "compte" && !document.getElementById("tactileActiver").classList.contains("cache")', None, 60000)
    pg.wait_for_timeout(300)
    g = pg.evaluate("""() => { const r = e => e.getBoundingClientRect(), a = r(document.getElementById('tactileActiver')), W = innerWidth, H = innerHeight;
      const feux = ['feux', 'feuxDepart', 'feuxRouges'].map(i => document.getElementById(i)).filter(x => x && x.getBoundingClientRect().height > 0 && getComputedStyle(x).display !== 'none').map(r);
      const recouvre = feux.some(f => a.left < f.right && a.right > f.left && a.top < f.bottom && a.bottom > f.top);
      return { x: a.left + a.width / 2, y: a.top, l: a.width, h: a.height, W, H, bas: a.bottom, recouvre, nfeux: feux.length, texte: document.getElementById('tactileActiver').textContent }; }""")
    t(f'{titre} : {passage} : sur la grille, pendant les feux, « 🎮 Activer le volant » est gros, au centre-bas, dans l’écran, sans cacher les feux',
      g['h'] >= 36 and g['l'] >= 150 and abs(g['x'] - g['W'] / 2) < 3 and g['y'] > g['H'] / 2 and g['bas'] <= g['H'] and not g['recouvre'] and g['texte'] == pg.evaluate('() => texte("tac_activer")'), str(g))
    return g
def tactile_iphone(pg, titre, l, h):
    pret = attendre(pg, '() => typeof TACTILE !== "undefined" && TACTILE.estPresent() && JEU.ecran === "titre"', None, 30000)
    # (tour 53e) dans l'iframe de Poki le plein écran peut être refusé : requestFullscreen rejette, rien ne casse
    pg.evaluate('() => { window.__refus = 0; Element.prototype.requestFullscreen = function () { window.__refus++; return Promise.reject(new Error("refus")); }; }')
    e = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : sur un iPhone (autorisation à demander), l’écran titre ne montre plus « 🎮 Activer le volant » ni les boutons de conduite', pret and e['activer']['cache'] and not e['tactile'] and e['mode'] == 'aucun', str(e))
    grille_iphone(pg, titre, l, h, 'accordée')
    t(f'{titre} : le plein écran refusé (requestFullscreen rejette) : demandé une fois, sans erreur', pg.evaluate('() => window.__refus') == 1, str(pg.evaluate('() => window.__refus')))
    pg.evaluate('() => document.getElementById("tactileActiver").click()'); attendre(pg, '() => TACTILE.etat.mode === "attente"', None, 4000)
    e = pg.evaluate(TACTILE_ETAT)
    pg.evaluate(INCLINER, 30)
    e2 = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : accordée, le bouton disparaît, le volant écoute (mode attente), puis une mesure le met en mode volant', e['activer']['cache'] and e['mode'] == 'attente' and e2['mode'] == 'volant' and e2['neutre'] == 30, str([e['mode'], e2['mode'], e2['neutre']]))
    # le téléphone debout, sur la grille : le message par-dessus tout et la course en pause (même si le plein écran est refusé) ; couché : le message part, la pause reste
    pg.set_viewport_size({'width': h, 'height': l}); attendre(pg, '() => JEU.ecran === "pause" && !document.getElementById("tactilePortrait").classList.contains("cache")', None, 8000)
    p1 = pg.evaluate(TACTILE_ETAT)
    pg.set_viewport_size({'width': l, 'height': h}); attendre(pg, '() => document.getElementById("tactilePortrait").classList.contains("cache")', None, 5000)
    p2 = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : le téléphone debout (plein écran refusé) montre « Tourne ton téléphone » par-dessus tout et met la course en pause ; couché, le message disparaît',
      p1['ecran'] == 'pause' and not p1['portrait']['cache'] and p1['portrait']['texte'] == pg.evaluate('() => texte("tac_portrait")') and p2['portrait']['cache'], str([p1['ecran'], p1['portrait'], p2['portrait']['cache']]))
    # l'autorisation refusée : le mode « boutons » (◀ ▶ dès la conduite)
    pg.evaluate('() => sessionStorage.setItem("perm", "denied")'); pg.reload()
    attendre(pg, '() => typeof TACTILE !== "undefined" && JEU.ecran === "titre"', None, 30000)
    grille_iphone(pg, titre, l, h, 'refusée')
    pg.evaluate('() => document.getElementById("tactileActiver").click()'); attendre(pg, '() => TACTILE.etat.mode === "boutons"', None, 4000)
    e = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : autorisation refusée : le bouton disparaît et le mode « boutons » (◀ ▶) est pris, sans erreur', e['activer']['cache'] and e['mode'] == 'boutons', str([e['activer']['cache'], e['mode']]))
    # sans réponse à l'extinction des feux : le bouton part, les boutons ◀ ▶ sont là (comme avant)
    pg.reload(); attendre(pg, '() => typeof TACTILE !== "undefined" && JEU.ecran === "titre"', None, 30000)
    grille_iphone(pg, titre, l, h, 'sans réponse')
    attendre(pg, '() => JEU.course.etat !== "compte"', None, 400000); pg.wait_for_timeout(300)
    e = pg.evaluate(TACTILE_ETAT)
    t(f'{titre} : sans réponse à l’extinction des feux, le bouton a disparu et les boutons ◀ ▶ sont là', e['activer']['cache'] and not e['gauche']['cache'] and not e['droite']['cache'] and e['tactile'], str([e['activer']['cache'], e['gauche']['cache'], e['droite']['cache']]))
# le mode 2 joueurs : deux fausses manettes, une par joueur ; la gâchette de l'une ne fait rouler que sa voiture
def manette_deux(pg, titre):
    pret = attendre(pg, '() => JEU.deux && JEU.plateau && JEU.plateau.carte !== null && DEUX_JOUEURS.joueurs(JEU.plateau).every(p => p.course.depart && p.course.depart.extinction !== null)', None, 240000)
    # (sans gaz tenu pendant les feux, le départ est « calé » : la voiture part lentement)
    pg.evaluate('() => __padFixer(0, "gachetteD", 1)'); pg.wait_for_timeout(3000)
    a = pg.evaluate('() => { const [j1, j2] = DEUX_JOUEURS.joueurs(JEU.plateau); return { u1: j1.v.u, u2: j2.v.u, g1: JEU.deuxCommandes[1].cibles.gaz, g2: JEU.deuxCommandes[2].cibles.gaz }; }')
    pg.evaluate('() => __padFixer(1, "gachetteD", 1)'); pg.wait_for_timeout(3000)
    b = pg.evaluate('() => { const [j1, j2] = DEUX_JOUEURS.joueurs(JEU.plateau); return { u1: j1.v.u, u2: j2.v.u, g2: JEU.deuxCommandes[2].cibles.gaz }; }')
    t(f'{titre} : deux joueurs, une manette chacun : la gâchette de la 1re ne fait rouler que le joueur 1, celle de la 2e le joueur 2',
      pret and a['g1'] == 1 and a['g2'] == 0 and a['u1'] > 1 and a['u2'] == 0 and b['g2'] == 1 and b['u2'] > 1, str([a, b]))
# la trajectoire conseillée (conseil.js, tour 39) dans le vrai jeu : en débutant (aucun réglage choisi), la ligne est devant
# le joueur pendant la course, en un appel de dessin ; en normal, aucune ligne ; capture conseil.png
def conseil_ecran(pg, titre, page):
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
    pg.evaluate('() => document.getElementById("boutonQualifPasser").click()')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)
    pg.evaluate('() => document.getElementById("boutonQualifCourse").click()')
    attendre(pg, '() => JEU.ecran === "course" || JEU.ecran === "grille"', None, 10000)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    if pg.evaluate('() => JEU.ecran === "grille"'): pg.evaluate('() => finirGrille()')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(12); BOUCLE.demarrer(); }')
    roule = attendre(pg, '() => JEU.ecran === "course" && JEU.course && JEU.course.etat === "course" && JEU.joueur.u > 15', None, 60000)
    pg.wait_for_timeout(1500)
    if 'niveau=debutant' in page:
        m = pg.evaluate('''() => { BOUCLE.arreter(); SCENE3D.dessiner(); const avec = SCENE3D.appelsDessin, vu = CONSEIL.ligne.visible; CONSEIL.ligne.visible = false; SCENE3D.dessiner(); const sans = SCENE3D.appelsDessin;
          CONSEIL.ligne.visible = vu; SCENE3D.dessiner(); return { vu, avec, sans, niveau: REGLAGES.NIVEAU, reglage: JEU.reglageTrajectoire, bouton: document.getElementById("boutonTrajectoirePause").textContent }; }''')
        pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'conseil.png'))
        pg.evaluate('() => BOUCLE.demarrer()')
        L.append(f"  (la trajectoire conseillée : {m['sans']} → {m['avec']} appels de dessin)")
        t(f'{titre} : en débutant, la trajectoire conseillée est allumée d’office devant le joueur, en un appel de dessin de plus au plus ; le bouton du menu pause dit « oui »',
          roule and m['vu'] and 0 < m['avec'] - m['sans'] <= 1 and m['reglage'] is None and m['bouton'] == pg.evaluate('() => texte("trajectoire_oui")'), str(m))
        # le réglage : oui → freinages seulement → non (sauvegardé), puis la ligne disparaît
        r = pg.evaluate('''() => { const b = document.getElementById("boutonTrajectoirePause"); b.click(); const un = SAUVEGARDE.option("trajectoire", "?"); b.click(); return [un, SAUVEGARDE.option("trajectoire", "?")]; }''')
        pg.wait_for_timeout(600)
        t(f'{titre} : le menu pause la règle (oui → freinages seulement → non, sauvegardé) ; à « non », plus de ligne', r == ['freinages', 'non'] and not pg.evaluate('() => CONSEIL.ligne.visible'), str(r))
    else:
        t(f'{titre} : en normal, aucune trajectoire conseillée (sans réglage choisi)', roule and not pg.evaluate('() => CONSEIL.ligne.visible') and pg.evaluate('() => REGLAGES.NIVEAU') == 'normal', pg.evaluate('() => [CONSEIL.ligne.visible, REGLAGES.NIVEAU]'))
# l'arrière-plan du paddock et des menus (stand3d.js, tour 49a-2) : au paddock, la voiture du joueur (sa livrée) garée devant le garage de son
# écurie, rien d'autre ne se montre ni ne bouge, la caméra tourne autour ; son coût en appels de dessin ; « Course suivante » mène à la course
STAND_ETAT = '''() => { const p = JEU.stand && JEU.stand.pose, c = SCENE3D.camera.position, g = JEU.modele.groupe;
  return { ecran: JEU.ecran, stand: !!(JEU.stand && JEU.stand.groupe.visible), ou: p ? p.ou : null, voiture: [g.position.x, g.position.z, g.rotation.y], visible: g.visible,
    autres: JEU.modeles.filter(m => m !== JEU.modele && m.groupe.visible).length, poses: JEU.modeles.map(m => [m.groupe.position.x, m.groupe.position.z]),
    joueur: [JEU.joueur.x, JEU.joueur.z, JEU.joueur.u], cam: [c.x, c.y, c.z], rayon: p ? Math.hypot(c.x - p.x, c.z - p.z) : null,
    livree: JEU.modele === JEU.modeles[indiceJoueur()] && !!JEU.modele.cl, appels: SCENE3D.appelsDessin, triangles: SCENE3D.trianglesDessines }; }'''
def fond_ecran(pg, titre, l, h):
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.stand && JEU.stand.groupe.visible', None, 60000)
    pg.wait_for_timeout(500)
    a = pg.evaluate(STAND_ETAT)
    pg.wait_for_timeout(2500)
    b = pg.evaluate(STAND_ETAT)
    pg.screenshot(path=os.path.join(CAPTURES, f'paddock-fond-{l}.png'))
    pg.evaluate('() => document.body.style.visibility = "hidden"'); pg.evaluate('() => document.getElementById("scene3d").style.visibility = "visible"')
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, f'paddock-fond-seul-{l}.png'))   # (l'arrière-plan seul, sans les menus)
    pg.evaluate('() => { document.body.style.visibility = ""; document.getElementById("scene3d").style.visibility = ""; }')
    bouge = max(abs(x - y) for x, y in zip(a['voiture'] + a['joueur'], b['voiture'] + b['joueur']))
    poses = max(abs(x - y) for p, q in zip(a['poses'], b['poses']) for x, y in zip(p, q))
    cam = math.dist(a['cam'], b['cam'])
    t(f'{titre} : derrière le paddock, la voiture du joueur avec sa livrée, garée au stand de son écurie ; aucune autre voiture ; rien ne bouge',
      a['stand'] and b['stand'] and a['ou'] in ('arret', 'garage') and a['visible'] and a['livree'] and a['autres'] == 0 and b['autres'] == 0 and bouge < 1e-9 and poses < 1e-9, str([a, b, bouge, poses]))
    t(f'{titre} : la caméra tourne lentement autour de la voiture (à STAND3D_RAYON m)', cam > 0.2 and abs(a['rayon'] - pg.evaluate('() => REGLAGES.STAND3D_RAYON')) < 0.01, str([cam, a['rayon'], a['cam'], b['cam']]))
    L.append(f"  (le paddock, arrière-plan au stand : {b['appels']} appels de dessin, {b['triangles']} triangles ; captures paddock-fond-{l}.png, paddock-fond-seul-{l}.png)")
    pg.click('#boutonCourseSuivante')
    attendre(pg, '() => JEU.ecran === "qualif" || JEU.ecran === "course" || JEU.ecran === "grille"', None, 30000)
    attendre(pg, '() => !JEU.stand.groupe.visible && JEU.modeles.some(m => m !== JEU.modele && m.groupe.visible)', None, 15000)   # (la prochaine image dessinée ; swiftshader est lent)
    c = pg.evaluate(STAND_ETAT)
    t(f'{titre} : « Course suivante » mène à la course : le stand disparaît, les autres voitures reviennent', c['ecran'] in ('qualif', 'course', 'grille') and not c['stand'] and c['autres'] > 0, str(c))
# le rétroviseur (tour 49a, scene3d.js dessinerRetro) dans le vrai jeu : en course, vue derrière, en haut au milieu sous le chrono ; aucun
# point de la piste devant la voiture sous lui (la méthode des aides : les points du couloir projetés à l'écran) ; une voiture posée
# 20 m derrière se voit dans son image (les pixels changent quand on l'enlève) ; son coût en appels de dessin ; masqué, rien de plus
RETRO_IMAGE = '''(derriere) => { const c = SCENE3D.canvas, W = c.clientWidth, z = SCENE3D.retroZone, sx = c.width / W, k = document.createElement('canvas'); k.width = c.width; k.height = c.height;
  const ctx = k.getContext('2d'), j = JEU.modele.groupe, f = new THREE.Vector3(1, 0, 0).applyQuaternion(j.quaternion), autres = JEU.modeles.filter(m => m !== JEU.modele);
  const vus = autres.map(m => m.groupe.visible); autres.forEach(m => m.groupe.visible = false);
  const m = autres[0].groupe, avant = m.position.clone(), q = m.quaternion.clone();
  if (derriere) { m.visible = true; m.position.set(j.position.x - f.x * 20, j.position.y, j.position.z - f.z * 20); m.quaternion.copy(j.quaternion); }
  SCENE3D.dessiner(); ctx.drawImage(c, 0, 0);
  const d = z ? Array.from(ctx.getImageData(Math.round(z.x * sx), Math.round(z.y * sx), Math.round(z.l * sx), Math.round(z.h * sx)).data) : [];
  m.position.copy(avant); m.quaternion.copy(q); autres.forEach((a, i) => a.groupe.visible = vus[i]);
  return { d, appels: SCENE3D.appelsDessin, retro: SCENE3D.appelsRetro }; }'''
RETRO_COULOIR = '''() => { const c = SCENE3D.canvas, W = c.clientWidth, H = c.clientHeight, z = SCENE3D.retroZone;
  const C = CIRCUIT, v = JEU.joueur, i0 = v.piste.indice, cam = SCENE3D.camera; let n = 0, dessous = 0;
  for (let m = 6; m <= REGLAGES.AIDES_DROITE_DEVANT; m += 3) for (const cote of [-2, 0, 2]) {
    const i = (i0 + Math.round(m / C.pas)) % C.nb, p = new THREE.Vector3(C.x[i] + C.nx[i] * cote, 0.02, C.z[i] + C.nz[i] * cote).project(cam);
    if (p.z < -1 || p.z > 1) continue; const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H; if (x < 0 || x >= W || y < 0 || y >= H) continue;
    n++; if (z && x >= z.x && x <= z.x + z.l && y >= z.y && y <= z.y + z.h) dessous++; }
  return { n, dessous, zone: z }; }'''
def retro_ecran(pg, titre, l, h):
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
    pg.evaluate('() => document.getElementById("boutonQualifPasser").click()')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)
    pg.evaluate('() => document.getElementById("boutonQualifCourse").click()')
    attendre(pg, '() => JEU.ecran === "course" || JEU.ecran === "grille"', None, 10000)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    if pg.evaluate('() => JEU.ecran === "grille"'): pg.evaluate('() => finirGrille()')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(12); BOUCLE.demarrer(); }')
    roule = attendre(pg, '() => JEU.ecran === "course" && JEU.course && JEU.course.etat === "course" && JEU.joueur.u > 15 && SCENE3D.retroZone !== null', None, 60000)
    pg.wait_for_timeout(1000)
    pg.evaluate('() => BOUCLE.arreter()')
    hud = pg.evaluate('() => { const r = document.getElementById("hudCourse").getBoundingClientRect(), c = document.getElementById("retroviseur"), b = c.getBoundingClientRect(); return { bas: r.bottom, cadre: !c.classList.contains("cache"), x: b.left, y: b.top, l: b.width, h: b.height, mode: CAMERA.mode }; }')
    co = pg.evaluate(RETRO_COULOIR)
    z = co['zone']
    t(f'{titre} : en course, vue derrière : le rétroviseur en haut au milieu, juste sous le chrono et au-dessus des messages de course, dans son cadre ; aucun point de la piste devant la voiture dessous',
      roule and z and hud['cadre'] and hud['mode'] == 'derriere' and abs(z['x'] + z['l'] / 2 - l / 2) <= 1 and z['y'] >= hud['bas'] and z['y'] + z['h'] < h * 0.4 and z['y'] + z['h'] <= pg.evaluate('() => document.getElementById("messageCourse").offsetTop || 176')
      and abs(hud['x'] - z['x']) <= 1 and abs(hud['l'] - z['l']) <= 1 and co['n'] >= 20 and co['dessous'] == 0, str([hud, co]))
    avec = pg.evaluate(RETRO_IMAGE, True)
    sans = pg.evaluate(RETRO_IMAGE, False)
    diff = sum(1 for k in range(0, min(len(avec['d']), len(sans['d'])), 4) if abs(avec['d'][k] - sans['d'][k]) + abs(avec['d'][k + 1] - sans['d'][k + 1]) + abs(avec['d'][k + 2] - sans['d'][k + 2]) > 60)
    part = diff / max(1, len(avec['d']) // 4)
    pg.screenshot(path=os.path.join(CAPTURES, 'retroviseur.png'))
    t(f'{titre} : une voiture posée 20 m derrière se voit dans le rétroviseur (au moins 1 % de ses pixels changent quand on l’enlève)', len(avec['d']) > 0 and part >= 0.01, f'{diff} pixels, {part:.3f}')
    r = pg.evaluate('''() => { const b = document.getElementById("boutonRetroPause"); SCENE3D.dessiner(); const vu = [b.textContent, SCENE3D.appelsDessin]; b.click(); majRetro(0); SCENE3D.dessiner();
      vu.push(b.textContent, SCENE3D.appelsDessin, SCENE3D.appelsRetro, SCENE3D.retroZone, document.getElementById("retroviseur").classList.contains("cache"), SAUVEGARDE.option("retroviseur", "?"));
      b.click(); majRetro(0); SCENE3D.dessiner(); vu.push(b.textContent, SCENE3D.retroZone !== null, SAUVEGARDE.option("retroviseur", "?")); return vu; }''')
    pg.evaluate('() => BOUCLE.demarrer()')
    L.append(f"  (le rétroviseur : {sans['appels']} → {sans['appels'] + sans['retro']} appels de dessin, {sans['retro']} pour lui ; {diff} pixels changent avec une voiture 20 m derrière)")
    t(f'{titre} : le rétroviseur coûte peu (au plus 30 appels de dessin) ; « Rétroviseur : non » (menu pause, sauvegardé) le masque : plus rien de dessiné en plus ; « oui » le remet',
      0 < sans['retro'] <= 30 and r[0] == pg.evaluate('() => texte("retro_oui")') and r[2] == pg.evaluate('() => texte("retro_non")') and r[3] == r[1]
      and r[4] == 0 and r[5] is None and r[6] and r[7] is False and r[8] == r[0] and r[9] and r[10] is True, str([r, sans['appels'], sans['retro']]))
# la qualité automatique (qualite.js ; tour 40, tour 49a l'Auto continu) dans le vrai jeu, ?qualite=auto (sous un automate, « auto » ne
# bouge pas seul sans ce paramètre) : swiftshader est sous 55 images par seconde, donc l'Auto se simplifie un pas à la fois jusqu'au plus
# simple, jamais pendant les feux, sans jamais simplifier la voiture du joueur ; le niveau est sauvegardé ; le menu pause la règle
# (auto → haute → moyenne → basse → auto, sauvegardé) ; captures et coûts du plus beau et du plus simple ; sans ?qualite, rien ne bouge
def qualite_ecran(pg, titre, page):
    if 'qualite=auto' not in page:
        pg.wait_for_timeout(4000)
        t(f'{titre} : sous un automate, sans ?qualite, la qualité ne bouge pas seule (les mesures restent comparables)', pg.evaluate('() => JEU.qualite.niveau === 0 && SCENE3D.qualite === null'), pg.evaluate('() => [JEU.qualite.niveau, JEU.qualiteAuto]'))
        return
    # (sous swiftshader, une image peut dépasser QUALITE_DT_MAX, faite pour les chargements : ici, toutes les images comptent)
    pg.evaluate('() => { REGLAGES.QUALITE_DT_MAX = 10; window.__qFeux = 0; window.__qJoueur = 0; BOUCLE.surAffichage(() => { if (SCENE3D.joueurSimplifie && JEU.qualite.niveau > 0) window.__qJoueur++; if (JEU.course && JEU.course.etat === "compte" && window.__qAvant !== undefined) window.__qFeux = Math.max(window.__qFeux, Math.abs(JEU.qualite.niveau - window.__qAvant)); }); }')
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
    pg.evaluate('() => document.getElementById("boutonQualifPasser").click()')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)
    pg.evaluate('() => document.getElementById("boutonQualifCourse").click()')
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    if pg.evaluate('() => JEU.ecran === "grille"'): pg.evaluate('() => finirGrille()')
    # (les menus d'avant, sous swiftshader, ont déjà simplifié : on repart d'« auto » au plus beau, juste avant les feux)
    # les feux : on les retient 8 s ; la qualité ne doit pas bouger pendant ce temps
    pg.evaluate('() => { JEU.qualite.niveauAuto = 0; QUALITE.regler(JEU.qualite, "auto"); JEU.appliquerQualite(); window.__qAvant = JEU.qualite.niveau; window.__qFeux = 0; for (const p of JEU.plateau.pilotes) if (p.course.feux) { p.course.feux.delai = 8; p.course.feux.total = 13; p.course.compte = 8; } }')
    attendre(pg, '() => JEU.course && JEU.course.etat !== "compte"', None, 60000)
    feux = pg.evaluate('() => window.__qFeux')
    simple = attendre(pg, '() => QUALITE.auPlusSimple(JEU.qualite)', None, 90000)
    pg.wait_for_timeout(int(pg.evaluate('() => REGLAGES.QUALITE_PAS_RETOUR') * 1000) + 1500)
    q = pg.evaluate("""() => ({ niveau: JEU.qualite.niveau, max: JEU.qualite.niveaux.length - 1, qualite: SCENE3D.qualite, ratio: SCENE3D.pixelRatio, feux: window.__qFeux, joueur: window.__qJoueur,
      sauve: SAUVEGARDE.option("qualite_niveau", -1), texte: document.getElementById("boutonQualitePause").textContent, attendu: texte("qualite_autoSimple"), appels: SCENE3D.appelsDessin, triangles: SCENE3D.trianglesDessines })""")
    t(f'{titre} : qualité « auto » sous 55 images par seconde : un pas à la fois jusqu’au plus simple (moins de pixels, le décor moins loin), jamais pendant les feux ; la voiture du joueur jamais simplifiée ; le niveau sauvegardé ; le menu dit « au plus simple »',
      feux == 0 and simple and q['qualite'] and q['qualite']['detail'] < pg.evaluate('() => REGLAGES.DECOR_DETAIL_LOIN') and q['ratio'] <= 0.6 + 1e-9 and q['joueur'] == 0
      and q['sauve'] == q['max'] and q['texte'] == q['attendu'], str([feux, q]))
    pg.screenshot(path=os.path.join(CAPTURES, 'qualite-plus-simple.png'))
    r = pg.evaluate("""() => { const b = document.getElementById("boutonQualitePause"), vu = [b.textContent, JEU.qualite.regle]; b.click(); vu.push(JEU.qualite.regle, JEU.qualite.niveau, SCENE3D.qualite, SAUVEGARDE.option("qualite", "?"));
      b.click(); vu.push(JEU.qualite.regle, SCENE3D.qualite && SCENE3D.qualite.pixelRatio); b.click(); vu.push(JEU.qualite.regle, SCENE3D.qualite && SCENE3D.qualite.pixelRatio); return vu; }""")
    pg.evaluate('() => { const b = document.getElementById("boutonQualitePause"); b.click(); b.click(); }')   # (basse → auto → haute : le plus beau, mesuré et capturé)
    pg.wait_for_timeout(1500)
    beau = pg.evaluate('() => ({ appels: SCENE3D.appelsDessin, triangles: SCENE3D.trianglesDessines, regle: JEU.qualite.regle })')
    pg.screenshot(path=os.path.join(CAPTURES, 'qualite-plus-beau.png'))
    pg.evaluate('() => { const b = document.getElementById("boutonQualitePause"); b.click(); b.click(); b.click(); }')   # (haute → moyenne → basse → auto)
    r2 = pg.evaluate('() => [JEU.qualite.regle, document.getElementById("boutonQualitePause").textContent, JEU.qualite.niveau, JEU.qualite.niveaux.length - 1]')
    print(f'  (qualité, appels de dessin / triangles : le plus beau {beau["appels"]} / {beau["triangles"]}, le plus simple {q["appels"]} / {q["triangles"]} ; captures qualite-plus-beau.png, qualite-plus-simple.png)')
    t(f'{titre} : le menu pause règle la qualité (auto → haute → moyenne → basse → auto, sauvegardé) ; « haute » remet l’image d’avant ; l’Auto reprend son niveau',
      r[1] == 'auto' and r[2] == 'haute' and r[3] == 0 and r[4] is None and r[5] == 'haute' and r[6] == 'moyenne' and r[7] == 1 and r[8] == 'basse' and r[9] == 0.75
      and beau['regle'] == 'haute' and r2[0] == 'auto' and r2[1] == r[0] and r2[2] == r2[3], str([r, r2, beau]))
# les aides au pilotage (assistance.js, tour 41) dans le vrai jeu, une course seule : en débutant, les trois aides sont allumées
# d'office (menu pause), et pour un joueur qui ne freine jamais, le freinage assisté freine avant les virages (le frein de la
# voiture monte sans que le joueur freine) et la voiture reste sur la piste ; en normal, elles sont coupées et ce joueur sort
def assistance_ecran(pg, titre, page):
    debutant = 'niveau=debutant' in page
    # (tour 37e, le propriétaire 2026-10-30) quatre aides, choisies avant la course à tous les niveaux : le menu pause les montre, figées
    b = pg.evaluate('() => ["boutonFreinagePause", "boutonAntipatinagePause", "boutonDirectionPause", "boutonAntiblocagePause"].map(id => { const e = document.getElementById(id); return [e.textContent, e.classList.contains("cache")]; })')
    oui = [pg.evaluate(f'() => texte("assist_{a}_oui")') for a in ('freinage', 'antipatinage', 'direction', 'antiblocage')]
    if debutant:
        t(f'{titre} : en débutant, les quatre aides au pilotage sont allumées d’office et montrées dans le menu pause (freinage, antipatinage, direction, anti-blocage)', [x[0] for x in b] == oui and not any(x[1] for x in b), str(b))
    else:
        t(f'{titre} : en normal, les aides au pilotage sont coupées d’office (toutes montrées, la direction assistée aussi : on la choisit avant la course)', all(x[0] != o for x, o in zip(b, oui)) and not any(x[1] for x in b), str(b))
    attendre(pg, '() => JEU.ecran === "course" && JEU.course && JEU.course.etat !== "compte" && (REGLAGES.NIVEAU !== "debutant" || !!JEU.carte)', None, 120000)
    # un joueur qui ne freine jamais : à chaque pas, les commandes du robot d'essai à 75 m/s partout (il tourne, il ne freine pas),
    # posées comme celles du clavier (JEU.cibles) ; le temps passé dans l'herbe et le frein que la voiture prend d'elle-même
    pg.evaluate('''() => { window.__freinSeul = 0; window.__herbe = 0; BOUCLE.surPhysique(pas => { const c = piloteRobot(JEU.joueur, CIRCUIT, 75); JEU.cibles.gaz = c.gaz; JEU.cibles.frein = 0; JEU.cibles.direction = c.direction;
      if (JEU.joueur.frein > window.__freinSeul) window.__freinSeul = JEU.joueur.frein; if (JEU.joueur.surHerbe) window.__herbe += pas; }); }''')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(40); BOUCLE.demarrer(); }')   # (40 s de course, sans attendre les images de swiftshader)
    r = pg.evaluate('() => ({ frein: window.__freinSeul, herbe: window.__herbe, barriere: JEU.joueur.contactsBarriere, s: JEU.course.tours.length, assistance: JEU.assistance, carte: !!JEU.carte })')
    L.append(f"  (aides au pilotage, {'débutant' if debutant else 'normal'}, un joueur qui ne freine jamais, 40 s : frein pris par la voiture jusqu'à {r['frein']:.2f}, {r['herbe']:.1f} s dans l'herbe, {r['barriere']} contacts barrière)")
    if debutant:
        t(f'{titre} : un joueur qui ne freine jamais : le freinage assisté freine pour lui avant les virages, il reste sur la piste', r['frein'] > 0.3 and r['carte'] and r['herbe'] < 2 and r['barriere'] == 0, str(r))
        # (tour 37e) pendant la course, les aides sont figées : un clic dans le menu pause, ou le choix des aides lui-même, ne change rien
        s = pg.evaluate('() => { const avant = JSON.stringify(JEU.assistance); document.getElementById("boutonFreinagePause").click(); INTERFACE.ouvrirAides(); document.querySelector("#choixAidesListe button[data-aide=freinage]").click(); INTERFACE.fermerAides(); return [avant, JSON.stringify(JEU.assistance), SAUVEGARDE.option("aides_pilotage", null), document.getElementById("boutonFreinagePause").textContent]; }')
        t(f'{titre} : pendant la course, les aides sont figées : ni le menu pause ni le choix des aides ne les changent', s[0] == s[1] and s[2] is None and s[3] == oui[0], str(s))
    else:
        t(f'{titre} : sans aide, la voiture ne freine jamais d’elle-même, et ce joueur-là sort de la piste', r['frein'] == 0 and (r['herbe'] > 0.2 or r['barriere'] > 0), str(r))
# le réglage du son (son.js, tour 44) dans le vrai jeu : le pire mélange rendu hors ligne ne sature pas (compresseur et plafond) ;
# le premier geste allume le son, le volume de chaque famille se règle au menu pause (sauvegardé), l'onglet caché et une pub le
# coupent, puis le rendent sans toucher à M
def son_ecran(pg, titre):
    sat = pg.evaluate('() => SON.essaiSaturation(1.5)')
    L.append(f"  (le son, tout au plus fort en même temps : crête {sat['crete']:.3f} avec le compresseur et le plafond, {sat['creteSans']:.3f} sans)")
    t(f'{titre} : tout le son au plus fort en même temps (moteur, pneus, vibreurs, herbe, aspiration, voiture d’à côté, pluie, choc, signaux, commentateur) : le mélange ne sature pas (crête sous 1)', sat and sat['crete'] < 1 and sat['crete'] > 0.05, str(sat))
    pg.keyboard.press('KeyJ'); attendre(pg, '() => SON.actif && SON.etatContexte === "running"', None, 5000)
    v = pg.evaluate('''() => { const b = document.getElementById("boutonSonEffetsPause"), avant = b.textContent; b.click(); b.click();
      return { avant, apres: b.textContent, vol: SON.volumes.effets, sauve: SAUVEGARDE.option("son_volumes", null), paddock: document.getElementById("boutonSonEffets").textContent }; }''')
    t(f'{titre} : le menu pause règle le volume « moteur et effets » (100 → 75 → 50 %, sauvegardé, le même au paddock)', v['vol'] == 0.5 and v['sauve'] and v['sauve']['effets'] == 0.5 and '50' in v['apres'] and '100' in v['avant'] and v['paddock'] == v['apres'], str(v))
    pg.evaluate('''() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); }''')
    cache = attendre(pg, '() => SON.etatContexte === "suspended"', None, 5000)
    pg.evaluate('''() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); }''')
    revenu = attendre(pg, '() => SON.etatContexte === "running"', None, 5000)
    t(f'{titre} : l’onglet caché coupe le son (suspendu), revenu il le rend', cache and revenu, pg.evaluate('() => SON.etatContexte'))
    pg.evaluate('() => couperSonPub(true)')
    pub = attendre(pg, '() => SON.etatContexte === "suspended" && SON.muet && !SON.muetJoueur', None, 5000)
    pg.evaluate('() => couperSonPub(false)')
    apres = attendre(pg, '() => SON.etatContexte === "running" && !SON.muet', None, 5000)
    t(f'{titre} : une pub coupe le son, puis le rend tel que le joueur l’avait (M n’est pas touché)', pub and apres, pg.evaluate('() => [SON.etatContexte, SON.muet, SON.muetJoueur]'))
# la mesure des images par seconde (mesure.js, tour 45) : ?mesure=1&ips=1 (raccourcie à 4 s ici) : le compteur discret, puis, une fois
# la course partie, la mesure à 20 voitures avec la caméra de course : la moyenne, le 1 % le plus lent, les appels, la qualité, « Copier » ;
# sans ces paramètres, ni compteur ni panneau (aucun coût) ; capture mesure.png
def mesure_ecran(pg, titre):
    pg.evaluate('() => { REGLAGES.MESURE_DUREE = 4; }')
    fini = attendre(pg, '() => !!window.__mesure', None, 180000)
    m = pg.evaluate('''() => ({ m: window.__mesure, sortie: document.getElementById("mesureSortie").textContent, copier: !document.getElementById("mesureCopier").classList.contains("cache"),
      compteur: (document.getElementById("compteurIps") || {}).textContent || "", voitures: JEU.plateau ? JEU.plateau.pilotes.length : 0, camera: CAMERA.mode })''')
    L.append(f"  (la mesure du propriétaire, sous swiftshader, {m['voitures']} voitures : {m['sortie']})")
    t(f'{titre} : « Mesurer » : 20 voitures, la caméra de course, puis la moyenne, le 1 % le plus lent, les appels de dessin et la qualité, prêts à copier ; le compteur discret affiche les images par seconde',
      fini and m['m'] and m['m']['ips'] > 0 and m['m']['appels'] > 0 and m['m']['unPourcent'] > 0 and m['voitures'] == 20 and m['camera'] == 'derriere' and m['copier'] and '{' not in m['sortie'] and re.search(r'\d+ i/s', m['compteur']), str(m))
    pg.screenshot(path=os.path.join(CAPTURES, 'mesure.png'))
    pg.evaluate('() => document.getElementById("mesureCopier").click()'); pg.wait_for_timeout(500)
    t(f'{titre} : « Copier » copie le résultat (ou le laisse sélectionné) et le dit', pg.evaluate('() => document.getElementById("mesureCopier").textContent === texte("mesure_copie")'), pg.evaluate('() => document.getElementById("mesureCopier").textContent'))
def commentaire_ecran(pg, titre):
    vu = attendre(pg, '() => /🎙/.test(document.getElementById("messageCourse").textContent) && !document.getElementById("messageCourse").classList.contains("cache")', None, 90000)
    txt = pg.evaluate('() => document.getElementById("messageCourse").textContent')
    t(f'{titre} : le commentateur parle dans le bandeau télé, avec son nom (« 🎙 {txt[:40]}… »)', vu and pg.evaluate('() => texte("commentateur")') in txt, txt)
    pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'commentaire.png'))
    # le réglage du menu pause : tout → tes faits → coupé (sauvegardé) ; coupé, plus aucune phrase du commentateur
    r = pg.evaluate('''() => { const b = document.getElementById("boutonCommentairePause"), vu = [b.textContent]; b.click(); vu.push(b.textContent, SAUVEGARDE.option("commentaire", "?")); b.click(); vu.push(b.textContent, REGLAGES.COMMENTAIRE_MODE);
      return vu; }''')
    t(f'{titre} : le commentateur se règle dans le menu pause (tout, tes faits, coupé ; sauvegardé)', r[2] == 'joueur' and r[4] == 'non' and len(set([r[0], r[1], r[3]])) == 3, str(r))
    pg.wait_for_timeout(9000)
    coupe = pg.evaluate('() => { const el = document.getElementById("messageCourse"); return el.classList.contains("cache") || !/🎙/.test(el.textContent); }')   # (le bandeau caché garde son dernier texte)
    t(f'{titre} : coupé, le commentateur ne dit plus rien', coupe, pg.evaluate('() => document.getElementById("messageCourse").textContent'))
# la réalisation télé (regie.js) dans le vrai jeu, à Monoco : en vue télé, la caméra est un vrai poste du décor (sa place ne bouge
# pas, elle voit la voiture), puis l'hélicoptère (dans ses hauteurs) ; les mâts des caméras coûtent un appel de dessin au plus
# le Grand Prix à domicile (?domicile=1 : un joueur fictif chez lui à Monzo) : avant les feux, la caméra longe la tribune des supporters
# (la tribune principale du décor, à moins de 30 m d'elle), puis la grille vue d'en haut ; capture supporters.png
def supporters_ecran(pg, titre):
    pg.evaluate('() => { REGLAGES.GRILLE_TRIBUNE_DUREE = 6; }')   # (plus long : swiftshader est lent, la capture doit tomber dedans)
    attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 60000)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    pg.evaluate('() => document.getElementById("boutonQualifPasser").click()')   # (un clic par la page : swiftshader rame, le bouton « bouge »)
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)
    pg.evaluate('() => document.getElementById("boutonQualifCourse").click()')
    vu = attendre(pg, '() => JEU.ecran === "grille" && JEU.grille && JEU.grille.tribune && JEU.grille.t > 0.3', None, 30000)
    if not vu: t(f'{titre} : la caméra de la grille au Grand Prix à domicile', False, str(pg.evaluate('() => [JEU.ecran, !!JEU.grille]'))); return
    m = pg.evaluate("""() => { const tr = JEU.grille.tribune, c = SCENE3D.camera.position, d = Math.min(Math.hypot(c.x - tr.a.x, c.z - tr.a.z), Math.hypot(c.x - tr.b.x, c.z - tr.b.z));
      let ban = 0; SCENE3D.decor.groupe.traverse(o => { if (o.name === 'decor-banderoles') ban++; }); return { t: JEU.grille.t, d, proche: (() => { let m = Infinity; for (const o of SCENE3D.decor.objets.tribune) if (o.entree === 1) m = Math.min(m, Math.hypot(c.x - o.x, c.z - o.z)); return m; })(), ban }; }""")
    t(f'{titre} : au Grand Prix à domicile, avant la grille, la caméra longe la tribune des supporters (à {round(m["proche"])} m), avec les banderoles', vu and m['proche'] < 30 and m['ban'] == 1, str(m))
    pg.screenshot(path=os.path.join(CAPTURES, 'supporters.png'))
    t(f'{titre} : puis la grille vue d’en haut, et la course', attendre(pg, '() => JEU.ecran === "course"', None, 60000), pg.evaluate('() => JEU.ecran'))
def tele_ecran(pg, titre):
    pret = attendre(pg, '() => JEU.plateau && JEU.plateau.pilotes.filter(p => Math.abs(p.v.u) > 15).length >= 5 && CAMERA.regie', None, 90000)
    pg.evaluate('() => CAMERA.forcer("tele")')
    vus = []
    for _ in range(6):
        pg.wait_for_timeout(700)
        vus.append(pg.evaluate("""() => { const p = CAMERA.planTele, c = SCENE3D.camera.position, v = JEU.joueur, r = CAMERA.regie;
          const poste = p && p.genre === 'poste' ? r.postes[p.poste] : null;
          return { genre: p ? p.genre : null, fixe: poste ? Math.hypot(c.x - poste.x, c.y - poste.y, c.z - poste.z) < 1e-6 : null, voit: p ? REGIE.voit(r, c, { x: v.x, y: REGLAGES.TELE_VISEE, z: v.z }) : false }; }"""))
    t(f'{titre} : en vue télé, la caméra est un vrai poste du décor (à sa place, sans bouger) ou l’hélicoptère, et elle voit la voiture', pret and all(x['genre'] in ('poste', 'helico') and x['voit'] and (x['genre'] != 'poste' or x['fixe']) for x in vus) and any(x['genre'] == 'poste' for x in vus), str(vus))
    appels = pg.evaluate("""() => { let m = null; SCENE3D.decor.groupe.traverse(o => { if (o.name === 'decor-cameras-tele') m = o; }); SCENE3D.dessiner(); const avec = SCENE3D.appelsDessin; m.visible = false; SCENE3D.dessiner(); const sans = SCENE3D.appelsDessin; m.visible = true; SCENE3D.dessiner(); return { avec, sans, postes: m.count }; }""")
    t(f'{titre} : les mâts des caméras de télé ({appels["postes"]}) coûtent un appel de dessin au plus', appels['postes'] >= 8 and appels['avec'] - appels['sans'] <= 1, str(appels))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'tele-monoco.png'))
    pg.evaluate('() => { const r = CAMERA.regie; r.actuel = "helico"; r.depuis = r.t; r.helico = null; }')
    pg.wait_for_timeout(1500)
    h = pg.evaluate('() => ({ genre: CAMERA.planTele.genre, y: SCENE3D.camera.position.y, borne: REGLAGES.TELE_HELICO_HAUTEUR })')
    t(f'{titre} : l’hélicoptère, dans ses hauteurs ({round(h["y"])} m)', h['genre'] == 'helico' and h['borne'][0] <= h['y'] <= h['borne'][1], str(h))
    pg.screenshot(path=os.path.join(CAPTURES, 'tele-helico.png'))

# les garde-fous des coûts par circuit (étape 10, tour 40) : la caméra de course derrière la voiture de tête, en COUTS_POINTS endroits du
# tour, les 19 autres voitures en file devant elle (tests/lieu.html, window.__couts) ; le pire des appels de dessin et des triangles
# reste sous ces plafonds (la mesure du 2026-10-29, + 4 appels et + 10 % de triangles). Un plafond qui tombe : on regarde ce qui a
# grossi avant de le relever
PLAFONDS_IMAGE = {
    'monoco': (47, 169000),
    'silverstoun': (44, 134000),
    'monzo': (46, 89000),
    'spaa': (45, 98000),      # (tour 50c : 107 008 → 88 712 triangles au pire, le décor allégé)
    'suzuko': (48, 143000),
    'interlagas': (45, 151000),
    'montreol': (51, 117000),
    'melbourn': (48, 99000),
    'barcelana': (44, 108000),
    'bahrayn': (45, 94000),
    'singapura': (46, 106000),   # (tour 50c : 147 286 → 96 344)
    'yasmarino': (48, 97000),
}
def lieu_ecran(pg, titre, page):
    nom = re.search(r'circuit=([a-z]+)', page).group(1)
    pret = attendre(pg, '() => !!window.__lieu', None, 60000)
    m = pg.evaluate('() => window.__lieu') if pret else {}
    R = pg.evaluate('() => ({ total: REGLAGES.LIEU_APPELS_MAX, decor: REGLAGES.DECOR_APPELS_MAX })')
    if not pret:
        t(f'{titre} : le décor est construit', False, 'pas de mesure'); return
    L.append(f"  (décor de {nom}, 20 voitures, 1280×720, swiftshader : {m['avec'][0]} appels de dessin et {m['avec'][1]} triangles avec le décor, {m['sans'][0]} et {m['sans'][1]} sans ; {m['ms']} ms de construction ; objets {dict((k, v) for k, v in m['n'].items() if v)} ; places refusées {m['refus']})")
    n = m['n']
    t(f'{titre} : le décor de {nom} : tribunes et public, ciel, des appels de dessin sous LIEU_APPELS_MAX avec 20 voitures ({m["avec"][0]}), le décor sous DECOR_APPELS_MAX ({m["avec"][0] - m["sans"][0]})',
      n['tribune'] > 10 and n['public'] > 1000 and 'decor-ciel' in m['maillages'] and m['avec'][0] < R['total'] and 0 < m['avec'][0] - m['sans'][0] <= R['decor'] and m['avec'][1] > m['sans'][1], str(m))
    if m['nuit']:
        t(f'{titre} : la nuit (ou le crépuscule) : des mâts d’éclairage le long de la piste', n['projecteur'] >= 20, str(n))
    if re.fullmatch(r'tests/lieu\.html\?circuit=[a-z]+', page):
        # le panneau « 80 » et la ligne de la voie des stands (tour 45b2) : sur chaque tracé qui a une voie des stands, un seul maillage
        ps = pg.evaluate('''() => { const c = DEFS_LIEU().circuit; let n = 0, m = null; SCENE3D.camera.parent; let sc = SCENE3D.decor.groupe; while (sc.parent) sc = sc.parent;
          sc.traverse(o => { if (o.name === 'stands-panneau') { n++; m = o; } }); return { stands: !!c.stands, n, tex: !!(m && m.material.map), triangles: m ? m.geometry.attributes.position.count / 3 : 0 }; }''')
        t(f'{titre} : le panneau « 80 » avant l’entrée de la voie des stands et la ligne peinte à son entrée, en un seul maillage, sur chaque tracé qui a des stands',
          (not ps['stands'] and ps['n'] == 0) or (ps['stands'] and ps['n'] == 1 and ps['tex'] and ps['triangles'] == 6), str(ps))
    if re.fullmatch(r'tests/lieu\.html\?circuit=[a-z]+', page) and nom in PLAFONDS_IMAGE:
        c = pg.evaluate('() => window.__couts()')
        pa, pt = PLAFONDS_IMAGE[nom]
        L.append(f"  (coûts de {nom}, caméra de course, 20 voitures, {c['points']} endroits du tour : appels {c['appelsMoy']} en moyenne, {c['appelsMax']} au pire ; triangles {c['trianglesMoy']} et {c['trianglesMax']} ; {c['materiaux']} matériaux, {c['programmes']} programmes, ombres {'oui' if c['ombres'] else 'non'} ; effets : fumée, étincelles et traces de pneus +{c['sensations']}, trajectoire conseillée +{c['conseil']})")
        t(f'{titre} : les coûts de {nom} à la caméra de course, avec 20 voitures : au pire {c["appelsMax"]} appels de dessin (plafond {pa}) et {c["trianglesMax"]} triangles (plafond {pt}) ; les effets coûtent au plus 4 appels (fumée, étincelles, traces de pneus, trajectoire conseillée)',
          c['appelsMax'] <= pa and c['trianglesMax'] <= pt and c['sensations'] + c['conseil'] <= 4 and not c['ombres'], str(c))
    if 'vue=port' in page:
        t(f'{titre} : Monoco : le port (de l’eau), des bateaux, des façades et des immeubles', n['eau'] > 50 and n['bateau'] >= 20 and n['immeuble'] > 200, str(n))
    if 'vue=pont' in page:
        p = pg.evaluate('''() => { const r = SCENE3D.relief, c = DEFS_LIEU(), L = c.circuit.longueur, i = s => Math.round((((s % L) + L) % L) / c.circuit.pas) % c.circuit.nb;
          let pont = null, dessus = null, dessous = null; SCENE3D.camera.parent; const scene = (() => { let o = SCENE3D.decor.groupe; while (o.parent) o = o.parent; return o; })();
          scene.traverse(o => { if (o.name === 'pont') pont = o; if (o.name === 'voiture-dessus') dessus = o.position.y; if (o.name === 'voiture-dessous') dessous = o.position.y; });
          let max = 0; for (const h of r) max = Math.max(max, h);
          return { max, h1: r[i(c.croisement[0])], h2: r[i(c.croisement[1])], pont: !!pont, dessus, dessous, H: REGLAGES.PONT_HAUTEUR, actif: REGLAGES.PONT_ACTIF }; }''')
        t(f'{titre} : le pont de Suzuko : la route du premier passage monte à PONT_HAUTEUR au croisement, le second passe dessous à plat ; le tablier et ses talus ; la voiture du dessus est en haut, celle du dessous en bas',
          p['actif'] and p['pont'] and abs(p['max'] - p['H']) < 1e-6 and abs(p['h1'] - p['H']) < 1e-6 and p['h2'] == 0 and abs(p['dessus'] - p['H']) < 1e-6 and p['dessous'] == 0, str(p))
    if 'domicile=1' in page:
        b = pg.evaluate('() => { const d = SCENE3D.decor; let m = null; d.groupe.traverse(o => { if (o.name === "decor-banderoles") m = o; }); const pays = REGLAGES.PAYS_COULEURS[REGLAGES.CIRCUITS_PAYS[__lieu.nom]] || []; const sup = d.objets.public.filter(p => pays.includes(p.couleur)).length; return { banderoles: d.objets.banderole.length, maillage: !!m, textes: d.objets.banderole.map(x => x.texte), part: sup / d.objets.public.length, attendu: REGLAGES.PUBLIC_DOMICILE_PART }; }')
        t(f'{titre} : le Grand Prix à domicile : des banderoles (« ALLEZ 27 ! », le nom) sur la barrière, et une part du public aux couleurs du pays', b['banderoles'] >= 2 and b['maillage'] and any('27' in x for x in b['textes']) and b['part'] >= b['attendu'] * 0.8, str(b))
    pg.wait_for_timeout(500)
    capture = 'monoco.png' if 'vue=port' in page else 'pont-suzuko.png' if 'vue=pont' in page else 'banderoles.png' if 'domicile=1' in page else f'lieu-{nom}.png'
    pg.screenshot(path=os.path.join(CAPTURES, capture))

def decor_ecran(pg, titre, l, h):
    pret = attendre(pg, '() => !!SCENE3D.decor && JEU.plateau && JEU.plateau.pilotes.length === 20', None, 30000)
    info = pg.evaluate('''() => { const d = SCENE3D.decor, o = d.objets, n = {}; for (const k in o) n[k] = o[k].length;
      const maillages = []; d.groupe.traverse(m => { if (m.isInstancedMesh) maillages.push(m.name); });
      return { n, refus: d.refus, maillages, triangles: d.triangles, ms: Math.round(d.ms) }; }''')
    n = info['n']
    t(f'{titre} : le décor du circuit test : tribunes avec leur public, public debout, stands (bâtiment, un garage par écurie), deux formes d’arbres, panneaux, piles de pneus ; tout en InstancedMesh',
      pret and n['tribune'] >= 30 and n['public'] >= 1000 and n['batiment'] >= 10 and n['garage'] == pg.evaluate('() => REGLAGES.ECURIES.length') and n['arbreA'] >= 50 and n['arbreB'] >= 50 and n['panneau'] >= 20 and n['pneus'] >= 50
      and len(info['maillages']) <= pg.evaluate('() => REGLAGES.DECOR_APPELS_MAX'), str(info))
    # la vue télé, au départ (la grille, la grande tribune en face des stands)
    pg.evaluate('() => CAMERA.forcer("tele")'); pg.wait_for_timeout(1500)
    mesure = pg.evaluate('''() => { SCENE3D.dessiner(); const avec = [SCENE3D.appelsDessin, SCENE3D.trianglesDessines];
      SCENE3D.decor.groupe.visible = false; SCENE3D.dessiner(); const sans = [SCENE3D.appelsDessin, SCENE3D.trianglesDessines];
      SCENE3D.decor.groupe.visible = true; SCENE3D.dessiner();
      const g = SCENE3D.decor.detail; return { avec, sans, proches: g.map(x => x.nbProches), loin: g.map(x => x.nbLoin), total: g.map(x => x.tous.length), voitures: JEU.plateau.pilotes.length }; }''')
    L.append(f"  (décor du circuit test, {mesure['voitures']} voitures, vue télé {l}×{h}, swiftshader : {mesure['avec'][0]} appels de dessin et {mesure['avec'][1]} triangles avec le décor, {mesure['sans'][0]} et {mesure['sans'][1]} sans ; {info['ms']} ms de construction ; objets {n} ; places refusées {info['refus']})")
    t(f'{titre} : le décor coûte au plus DECOR_APPELS_MAX appels de dessin (avec 20 voitures : {mesure["avec"][0]} appels en tout, {mesure["sans"][0]} sans le décor), et le total reste sous DECOR_APPELS_TOTAL_MAX',
      0 < mesure['avec'][0] - mesure['sans'][0] <= pg.evaluate('() => REGLAGES.DECOR_APPELS_MAX') and mesure['avec'][0] < pg.evaluate('() => REGLAGES.DECOR_APPELS_TOTAL_MAX') and mesure['avec'][1] > mesure['sans'][1], str(mesure))
    t(f'{titre} : niveaux de détail : près de la caméra télé, du public et des arbres détaillés, les autres en forme simple ou pas dessinés (jamais deux fois)',
      all(p + q <= tt for p, q, tt in zip(mesure['proches'], mesure['loin'], mesure['total'])) and mesure['proches'][0] > 0 and mesure['loin'][0] > 0 and mesure['loin'][1] > 0, str(mesure))
    # l'échelle en vrais mètres : la hauteur de chaque spectateur dessiné de près (la forme × l'échelle de son instance), d'une voiture
    tailles = pg.evaluate('''() => { const m = SCENE3D.decor.detail[0].proches[0], g = m.geometry; g.computeBoundingBox();
      const a = m.instanceMatrix.array, h = []; for (let k = 0; k < m.count; k++) h.push((g.boundingBox.max.y - g.boundingBox.min.y) * Math.hypot(a[k * 16 + 4], a[k * 16 + 5], a[k * 16 + 6]));
      const b = new THREE.Box3().setFromObject(JEU.modeles[0].groupe || JEU.modeles[0]); return { n: h.length, min: Math.min(...h), max: Math.max(...h), voiture: b.max.y - b.min.y }; }''')
    t(f'{titre} : à l’échelle : un spectateur fait entre 1,1 et 1,9 m (assis ou debout), une voiture environ 1 m', tailles['n'] > 0 and 1.1 <= tailles['min'] and tailles['max'] <= 1.9 and 0.7 < tailles['voiture'] < 1.5, str(tailles))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'decor-test.png'))
    # vu d'en haut : toute la caméra est loin, plus rien de détaillé
    pg.evaluate('() => { const c = SCENE3D.camera; c.fov = 55; c.updateProjectionMatrix(); CAMERA.init(c, CIRCUIT, "dessus"); }')   # (le champ de la télé, très serré, mettrait la caméra au-delà du brouillard); pg.wait_for_timeout(1500)
    haut = pg.evaluate('() => { SCENE3D.dessiner(); return { proches: SCENE3D.decor.detail.map(x => x.nbProches), loin: SCENE3D.decor.detail.map(x => x.nbLoin), y: SCENE3D.camera.position.y }; }')
    t(f'{titre} : vu d’en haut (à {round(haut["y"])} m), le public et les arbres sont tous en forme simple', haut['proches'] == [0, 0, 0] and haut['loin'][1] > 0, str(haut))
    pg.screenshot(path=os.path.join(CAPTURES, 'decor-dessus.png'))

def hud_course(pg, titre, l, h):
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    if pg.evaluate('() => JEU.ecran === "grille"'): pg.evaluate('() => finirGrille()')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(25); BOUCLE.demarrer(); }')
    attendre(pg, '() => JEU.ecran === "course" && !document.getElementById("minicarte").classList.contains("cache")', None, 10000)
    pg.wait_for_timeout(300)
    mc = pg.evaluate('''() => { const P = JEU.plateau.pilotes, pts = MINICARTE.points; let pire = 0;
      for (const p of pts) { const [x, z] = MINICARTE.versMonde(p.x, p.y), v = P[p.k].v; pire = Math.max(pire, Math.hypot(x - v.x, z - v.z)); }
      return { n: pts.length, voitures: P.length, pire, pret: MINICARTE.pret }; }''')
    t(f'{titre} : la minicarte : le circuit entier, toutes les voitures (chacune au bon endroit à 2 m près)', mc['pret'] and mc['n'] == mc['voitures'] and mc['pire'] < 2, str(mc))
    u1 = pg.evaluate('() => [JEU.joueur.pneus.usure, document.getElementById("pneusTexte").textContent, document.getElementById("pneusHud").classList.contains("cache")]')
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(60); BOUCLE.demarrer(); }')
    attendre(pg, '() => document.getElementById("pneusTexte").textContent.endsWith(" " + Math.round((1 - JEU.joueur.pneus.usure) * 100) + " %")', None, 5000)
    u2 = pg.evaluate('() => [JEU.joueur.pneus.usure, document.getElementById("pneusTexte").textContent, document.getElementById("pneusPlein").style.width, document.getElementById("pneusAdherence").textContent, 1 - JEU.joueur.adherence]')
    perte = u2[4]  # lue avec le texte ; une image de retard possible, d'où la marge (0,05 % de part et d'autre du seuil)
    t(f'{titre} : avec ?pneus=1, l’état des pneus à l’écran : la jauge baisse en roulant ; l’adhérence perdue n’est écrite qu’à partir de 0,1 % (jamais « −0,0 % »)', not u1[2] and u2[0] > u1[0] and u1[1] != u2[1] and (u2[3] == '' or re.search(r'[1-9]', u2[3]) is not None) and (perte < 0.0015 or u2[3] != '') and (perte >= 0.0005 or u2[3] == ''), str([u1, u2, perte]))
    # le vrai meilleur tour de la course (les voitures ont déjà bouclé des tours) : les messages repartent de zéro, et le premier
    # dit ce meilleur tour, le même temps que celui de la course ; puis il s'en va après MESSAGES_DUREE s de course
    pg.evaluate('() => { JEU.messages = null; }')
    meilleur = pg.evaluate('() => { const P = JEU.plateau.pilotes; let b = null; for (const p of P) if (p.course.meilleurTour !== null && (b === null || p.course.meilleurTour < b)) b = p.course.meilleurTour; return b === null ? null : INTERFACE.formatTemps(b); }')
    vu = meilleur is not None and attendre(pg, 't => !document.getElementById("messageCourse").classList.contains("cache") && document.getElementById("messageCourse").textContent.includes(t)', meilleur, 5000)
    texte_msg = pg.evaluate('() => document.getElementById("messageCourse").textContent')
    bm, bh, bc, bt, bp, br = [pg.evaluate('s => { const e = document.querySelector(s); if (!e || e.classList.contains("cache") || getComputedStyle(e).display === "none") return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }', s) for s in ['#minicarte', '#hudCourse', '#classement', '#tableau', '#pneusHud', '#radar']]
    croise = lambda a, b: a is not None and b is not None and a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    bmsg = pg.evaluate('() => { const r = document.getElementById("messageCourse").getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }')
    boites = {'minicarte': bm, 'chrono': bh, 'tour': bc, 'compteur': bt, 'pneus': bp, 'radar': br, 'message': bmsg}
    chevauche = [(a, b) for a in boites for b in boites if a < b and croise(boites[a], boites[b])]
    t(f'{titre} : un message de course (meilleur tour) apparaît en bandeau ; rien ne se recouvre en {l}×{h} (minicarte, chrono, tour, compteur, pneus, radar, message)', vu and texte_msg != '' and not chevauche and all(b is None or (b[0] >= -1 and b[2] <= l + 1 and b[3] <= h + 1) for b in boites.values()), str([texte_msg, chevauche, boites]))
    if l == 1280:
        pg.screenshot(path=os.path.join(CAPTURES, 'messages.png'))
        pg.locator('#minicarte').screenshot(path=os.path.join(CAPTURES, 'minicarte.png'))
        pg.locator('#pneusHud').screenshot(path=os.path.join(CAPTURES, 'pneus-hud.png'))
    else:
        pg.screenshot(path=os.path.join(CAPTURES, 'hud-course-960.png'))
    pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(REGLAGES.MESSAGES_DUREE * 3 + 1); BOUCLE.demarrer(); }')
    t(f'{titre} : le message s’en va après MESSAGES_DUREE s', attendre(pg, 't => !document.getElementById("messageCourse").textContent.includes(t) || document.getElementById("messageCourse").classList.contains("cache")', meilleur, 5000), pg.evaluate('() => document.getElementById("messageCourse").textContent'))

def course_joueur(pg, titre):
    # le joueur conduit sa voiture au clavier, au milieu de 9 IA ; la caméra le suit, Tab ne change rien
    t(f'{titre} : 9 IA et la voiture du joueur, en dernière place de la grille ; la caméra suit le joueur',
      pg.evaluate('() => JEU.contre && JEU.plateau.pilotes.length === 10 && JEU.plateau.pilotes[9].humain && JEU.joueur === JEU.plateau.pilotes[9].v && JEU.course === JEU.plateau.pilotes[9].course && JEU.modeles.length === 10'))
    # tant que la carte se calcule, le compte à rebours attend (« Préparation de la course… ») : jamais de GO sans carte
    t(f'{titre} : pas de GO avant la carte : elle est prête, ou le compte à rebours attend avec « Préparation de la course… »',
      pg.evaluate('() => JEU.plateau.carte !== null || (JEU.course.etat === "compte" && JEU.course.compte === REGLAGES.COMPTE_A_REBOURS && document.getElementById("compte").textContent === texte("preparation"))'),
      str(pg.evaluate('() => [JEU.plateau.carte !== null, JEU.course.etat, JEU.course.compte, document.getElementById("compte").textContent]')))
    t(f'{titre} : la carte se calcule en fond, les 9 IA reçoivent leur pilote', attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.filter(p => p.pilote !== null).length === 9', None, 120000))
    # les feux de départ : on retient l'extinction (un long délai) pour voir les 5 feux allumés
    t(f'{titre} : les feux de départ remplacent le 3-2-1 (même extinction pour toutes les voitures)', pg.evaluate('() => JEU.plateau.pilotes.every(p => p.course.feux && p.course.feux.total === JEU.course.feux.total) && JEU.plateau.pilotes.every(p => p.course.etat === "compte") && document.getElementById("compte").classList.contains("cache")'))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
    t(f'{titre} : les 5 feux rouges sont allumés', attendre(pg, '() => !document.getElementById("feux").classList.contains("cache") && document.querySelectorAll("#feux span.allume").length === 5'),
      pg.evaluate('() => document.getElementById("feux").outerHTML'))
    pg.screenshot(path=os.path.join(CAPTURES, 'feux.png'))
    # le départ parfait (depart.js) : pendant les feux, la voiture est tenue ; ↑ fait monter le régime de la jauge (centre bas).
    # La boucle réelle est arrêtée : la physique avance seulement par BOUCLE.simuler, pour mesurer la réaction exactement ;
    # image() la relance un instant pour que l'écran se redessine (au plus 0,1 s de physique par image)
    def image():
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } BOUCLE.demarrer(); return window.__images; }')
        attendre(pg, 'n => window.__images > n', n, 20000)
        pg.evaluate('() => BOUCLE.arreter()')
    pg.evaluate('() => BOUCLE.arreter()')
    pg.keyboard.down('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.5)')
    image()
    d1 = pg.evaluate('() => ({ regime: JEU.course.depart.regime, u: JEU.joueur.u, lance: JEU.course.depart.lance, jauge: !document.getElementById("jauge").classList.contains("cache"), aiguille: document.getElementById("jaugeAiguille").style.left, vert: document.getElementById("jaugeVert").style.width })')
    pg.keyboard.up('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.25)')
    d2 = pg.evaluate('() => ({ regime: JEU.course.depart.regime, u: JEU.joueur.u })')
    t(f'{titre} : pendant les feux, ↑ tenue 0,5 s fait monter le régime de départ sans lancer la voiture, et la jauge l’affiche au centre bas (zone verte)', abs(d1['regime'] - 0.5 * pg.evaluate('() => REGLAGES.DEPART_MONTEE')) < 0.02 and d1['u'] == 0 and d1['lance'] is None and d1['jauge'] and d1['aiguille'] and d1['vert'], str(d1))
    t(f'{titre} : ↑ lâchée 0,25 s : le régime redescend, la voiture ne bouge toujours pas', d2['regime'] < d1['regime'] and d2['u'] == 0, str(d2))
    t(f'{titre} : les IA ne bougent pas avant l’extinction', pg.evaluate('() => JEU.plateau.pilotes.every(p => p.humain || p.v.u === 0)'))
    # le régime au milieu du vert, la capture avec la jauge, puis l'extinction : lâcher puis réappuyer 0,2 s après = départ parfait
    pg.evaluate('() => { JEU.course.depart.regime = (REGLAGES.DEPART_VERT[0] + REGLAGES.DEPART_VERT[1]) / 2; }')
    image()
    pg.screenshot(path=os.path.join(CAPTURES, 'depart.png'))
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; BOUCLE.simuler(0.05); }')
    t(f'{titre} : à l’extinction, la voiture du joueur reste tenue tant qu’il n’a pas réappuyé', pg.evaluate('() => JEU.course.etat === "attente" && JEU.course.depart.extinction !== null && JEU.course.depart.lance === null && JEU.joueur.u === 0'),
      str(pg.evaluate('() => [JEU.course.etat, JEU.course.depart.extinction, JEU.course.depart.lance, JEU.joueur.u]')))
    # (le régime redescend pendant qu'on ne tient pas la touche : on le remet dans le vert juste avant d'appuyer, comme un joueur qui dose)
    pg.evaluate('() => { BOUCLE.simuler(0.1); JEU.course.depart.regime = (REGLAGES.DEPART_VERT[0] + REGLAGES.DEPART_VERT[1]) / 2; }')
    pg.keyboard.down('ArrowUp')
    pg.evaluate('() => BOUCLE.simuler(0.5)')
    image()
    t(f'{titre} : après l’extinction, les feux s’éteignent tous', pg.evaluate('() => document.querySelectorAll("#feux span.allume").length === 0'))
    dp = pg.evaluate('() => ({ resultat: JEU.course.depart.resultat, reaction: JEU.course.depart.reaction, u: JEU.joueur.u, facteur: JEU.joueur.facteurDepart, penalites: JEU.course.penalites, record: JEU.departRecord, sauve: SAUVEGARDE.reaction(), texte: document.getElementById("departResultat").textContent, classe: document.getElementById("departResultat").className, jauge: document.getElementById("jauge").classList.contains("cache") })')
    t(f'{titre} : réappuyer 0,2 s après l’extinction, régime dans le vert = départ parfait : la voiture part (facteur moteur 1, pas de pénalité), « Départ parfait ! · 0,2x s ★ record » affiché, le record de réaction sauvegardé',
      dp['resultat'] == 'parfait' and 0.1 <= dp['reaction'] < 0.3 and dp['u'] > 1 and dp['facteur'] == 1 and dp['penalites'] == 0 and dp['record'] and abs(dp['sauve'] - dp['reaction']) < 1e-9
      and dp['texte'].startswith(pg.evaluate('() => texte("departParfait")')) and '★' in dp['texte'] and dp['classe'] == 'parfait' and dp['jauge'], str(dp))
    L.append(f"  (départ du joueur joué par le test : {dp['resultat']}, réaction {dp['reaction']:.3f} s, « {dp['texte']} »)")
    pg.evaluate('() => BOUCLE.demarrer()')
    depart = pg.evaluate('() => JEU.plateau.temps')
    t(f'{titre} : ↑ fait avancer la voiture du joueur', attendre(pg, '() => JEU.joueur.u > 15', None, 40000), pg.evaluate('() => JEU.joueur.u'))
    pg.keyboard.press('Tab')
    t(f'{titre} : Tab ne change pas la voiture suivie', pg.evaluate('() => JEU.suivie === 9 && JEU.joueur === JEU.plateau.pilotes[9].v'))
    # 5 s de course (le temps de la course, pas l'horloge : un Mac chargé fait moins de pas de physique par seconde)
    attendre(pg, f'() => JEU.plateau.temps > {depart} + 5', None, 60000)
    pg.screenshot(path=os.path.join(CAPTURES, 'joueur-ia.png'))
    pg.keyboard.up('ArrowUp')
    # (sur un Mac chargé, la physique prend du retard sur l'horloge : on attend que tout le monde ait roulé)
    avance = attendre(pg, '() => JEU.plateau.pilotes.every(p => p.course.progression > 20)', None, 20000)
    etat = pg.evaluate('() => JEU.plateau.pilotes.map(p => ({ humain: p.humain, progression: Math.round(p.course.progression), chocs: p.v.chocs.length }))')
    t(f'{titre} : la voiture du joueur et les 9 IA ont avancé', avance, str(etat))
    L.append(f"  (contre 9 IA : joueur {etat[9]['progression']} m, IA de {min(e['progression'] for e in etat[:9])} à {max(e['progression'] for e in etat[:9])} m, {sum(e['chocs'] for e in etat) // 2} contacts)")
    # le joueur passe la ligne (on lui donne ses tours) : la caméra télé suit une IA encore en course, le podium attend
    pg.evaluate('() => { const c = JEU.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; }')
    t(f'{titre} : après l’arrivée du joueur, caméra télé sur une IA encore en course, bandeau d’attente, pas encore de podium',
      attendre(pg, '() => JEU.attente && CAMERA.mode === "tele" && JEU.attente.tele !== null && !JEU.plateau.pilotes[JEU.attente.tele].humain && JEU.plateau.pilotes[JEU.attente.tele].arrivee === null'
                   ' && !document.getElementById("attenteArrivee").classList.contains("cache") && JEU.ecran === "course"', None, 20000),
      str(pg.evaluate('() => [JEU.ecran, CAMERA.mode, JEU.attente && JEU.attente.tele]')))
    t(f'{titre} : la tour de classement reste, le joueur marqué 🏁', pg.evaluate('() => !document.getElementById("classement").classList.contains("cache") && document.querySelector("#classementListe li.moi").classList.contains("arrive")'))
    # sa voiture dans l'herbe : plus de « hors piste » après l'arrivée (il ne chevaucherait le bandeau)
    pg.evaluate('() => { const v = JEU.joueur; const e = 12 - v.piste.d; v.x += v.piste.nx * e; v.z += v.piste.nz * e; }')
    t(f'{titre} : après l’arrivée, pas de « hors piste » même dans l’herbe', attendre(pg, '() => JEU.joueur.surHerbe && document.getElementById("horsPiste").classList.contains("cache")', None, 10000),
      str(pg.evaluate('() => [JEU.joueur.surHerbe, document.getElementById("horsPiste").className]')))
    pg.wait_for_timeout(1000)
    pg.screenshot(path=os.path.join(CAPTURES, 'apres-arrivee.png'))
    pg.click('#boutonPasser')
    t(f'{titre} : le bouton « passer » mène au podium (la caméra d’avant revient, le bandeau part)',
      attendre(pg, '() => JEU.ecran === "podium" && CAMERA.mode !== "tele" && document.getElementById("attenteArrivee").classList.contains("cache")', None, 180000),   # (depuis le 2026-10-24, « passer » joue la fin de la course en accéléré : plus de temps réel)
      str(pg.evaluate('() => [JEU.ecran, CAMERA.mode]')))
    # le patinage, joué par le test sur une nouvelle course (podium → résultats → « Rejouer » → qualification passée) : depuis le tour 52d
    # (décision du propriétaire), la touche tenue à travers l'extinction lance la voiture à l'extinction même (DEPART_TENIR_PART) ; le
    # régime monté au bout donne le patinage (hors découverte). L'ancienne règle (lâcher d'abord) : DEPART_TENIR_PART faux, testé dans tests/test.html
    pg.click('#boutonResultats')
    attendre(pg, '() => JEU.ecran === "resultats"')
    pg.click('#boutonRejouerResultats')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.depart && JEU.course.depart.lance === null', None, 180000)
    pg.evaluate('() => { BOUCLE.arreter(); for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
    pg.keyboard.down('ArrowUp')
    pg.evaluate('() => { BOUCLE.simuler(2); for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; BOUCLE.simuler(0.5); }')
    tenue = pg.evaluate('() => ({ regime: JEU.course.depart.regime, lance: JEU.course.depart.lance, etat: JEU.course.etat, u: JEU.joueur.u, extinction: JEU.course.depart.extinction, resultat: JEU.course.depart.resultat, tenu: JEU.course.depart.tenu })')
    t(f'{titre} : patinage : ↑ tenue 2 s puis à travers l’extinction : le régime est au bout, la voiture est lancée à l’extinction même (départ tenu), résultat « patinage »', tenue['regime'] == 1 and tenue['extinction'] is not None and tenue['lance'] == tenue['extinction'] and tenue['tenu'] and tenue['resultat'] == 'patinage' and tenue['u'] > 0, str(tenue))
    image()
    pt = pg.evaluate('() => ({ resultat: JEU.course.depart.resultat, reaction: JEU.course.depart.reaction, facteur: JEU.joueur.facteurDepart, u: JEU.joueur.u, penalites: JEU.course.penalites, texte: document.getElementById("departResultat").textContent, classe: document.getElementById("departResultat").className })')
    t(f'{titre} : le départ tenu avec le régime trop haut = patinage : la voiture part moins fort (facteur moteur DEPART_PATINAGE[0]), « Patinage ! » affiché, pas de pénalité',
      pt['resultat'] == 'patinage' and pt['facteur'] == pg.evaluate('() => REGLAGES.DEPART_PATINAGE[0]') and pt['u'] > 0 and pt['penalites'] == 0 and pt['texte'].startswith(pg.evaluate('() => texte("departPatinage")')) and pt['classe'] == 'patinage', str(pt))
    L.append(f"  (patinage joué par le test : réaction {pt['reaction']:.3f} s, facteur moteur {pt['facteur']}, « {pt['texte']} »)")
    pg.evaluate('() => { BOUCLE.simuler(REGLAGES.DEPART_PATINAGE[1] + 0.1); }')
    t(f'{titre} : après DEPART_PATINAGE[1] s, l’effet s’arrête (facteur 1)', pg.evaluate('() => JEU.joueur.facteurDepart === 1 && JEU.joueur.u > 5'), str(pg.evaluate('() => [JEU.joueur.facteurDepart, JEU.joueur.u]')))
    pg.keyboard.up('ArrowUp')
    pg.evaluate('() => BOUCLE.demarrer()')

# les éléments fixes de l'écran de course, qui ne doivent jamais se chevaucher
ELEMENTS_COURSE = ['classement', 'radar', 'boutonSon', 'aide', 'hudCourse', 'tableau']

# les lignes de la tour, de haut en bas (par leur place à l'écran) : 1, 2, 3… et chacune posée à sa place (fin du glissement)
ORDRE_TOUR = '''() => {
  const lis = [...document.querySelectorAll("#classementListe li")], haut = document.getElementById("classementListe").getBoundingClientRect().top;
  const h = lis.length ? lis[0].getBoundingClientRect().height : 0;
  return lis.length > 0 && lis.every(li => Math.abs(li.getBoundingClientRect().top - haut - (Number(li.children[0].textContent) - 1) * h) < 0.5)
    && lis.map(li => li.getBoundingClientRect().top).sort((a, b) => a - b).every((y, i, t) => i === 0 || y > t[i - 1]);
}'''

def hud(pg, titre, l):
    # la tour de classement en haut à droite et le radar en bas à gauche, pendant une course contre les IA
    passer_qualif(pg, titre)
    t(f'{titre} : la tour de classement est visible, avec 10 lignes et la ligne du joueur marquée', attendre(pg,
      '() => !document.getElementById("classement").classList.contains("cache") && document.querySelectorAll("#classementListe li").length === 10'
      ' && document.querySelectorAll("#classementListe li.moi").length === 1 && /^P\\d+ \\/ 10$/.test(document.getElementById("classementPlace").textContent)'),
      pg.evaluate('() => document.getElementById("classement").innerText'))
    t(f'{titre} : la ligne marquée est celle du joueur (n°10)', pg.evaluate('() => document.querySelector("#classementListe li.moi").dataset.numero') == '10')
    t(f'{titre} : le radar est visible, avec des points de voitures', attendre(pg, '() => !document.getElementById("radar").classList.contains("cache") && RADAR.etat.points > 0'),
      str(pg.evaluate('() => RADAR.etat.points')))
    boites = pg.evaluate('ids => ids.map(id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return [id, getComputedStyle(e).display === "none" ? null : [r.left, r.top, r.right, r.bottom]]; })', ELEMENTS_COURSE)
    vus = [(n, b) for n, b in boites if b and b[2] > b[0] and b[3] > b[1]]
    chevauchent = [f'{a[0]} / {b[0]}' for i, a in enumerate(vus) for b in vus[i + 1:]
                   if a[1][0] < b[1][2] and b[1][0] < a[1][2] and a[1][1] < b[1][3] and b[1][1] < a[1][3]]
    dehors = [n for n, b in vus if b[0] < 0 or b[1] < 0 or b[2] > pg.viewport_size['width'] or b[3] > pg.viewport_size['height']]
    t(f'{titre} : ni chevauchement ni débordement entre {", ".join(n for n, _ in vus)}', not chevauchent and not dehors and len(vus) == len(ELEMENTS_COURSE),
      f'chevauchent : {chevauchent}, dehors : {dehors}, visibles : {[n for n, _ in vus]}')
    # les lignes glissent quand l'ordre change (la grille se range quand la carte est prête) : on attend qu'elles soient
    # à leur place, et les places affichées doivent aller de 1 à N, de haut en bas
    t(f'{titre} : les places de la tour vont de 1 à 10, de haut en bas, chaque ligne à sa place', attendre(pg, ORDRE_TOUR, None, 10000),
      pg.evaluate('() => [...document.querySelectorAll("#classementListe li")].map(li => [li.children[0].textContent, Math.round(li.getBoundingClientRect().top)])'))
    # l'icône du casque a sa colonne : sur la ligne du joueur, sa boîte et celle du numéro ne se recouvrent pas, le numéro est lisible en entier
    boite = pg.evaluate('''() => { const li = document.querySelector("#classementListe li.moi"), c = li.querySelector(".casque canvas"), n = li.querySelector(".numero");
      const a = c.getBoundingClientRect(), b = n.getBoundingClientRect(); return { casque: [a.left, a.right, a.top, a.bottom], numero: [b.left, b.right, b.top, b.bottom], texte: n.textContent, deborde: n.scrollWidth > n.clientWidth + 1, ordre: a.right <= b.left }; }''')
    t(f'{titre} : dans la tour, l’icône du casque est dans sa colonne, avant le numéro, sans recouvrir le numéro (lisible en entier)', boite['ordre'] and not boite['deborde'] and boite['casque'][1] <= boite['numero'][0], str(boite))
    pg.screenshot(path=os.path.join(CAPTURES, f'hud-{l}.png'))
    # le faux départ par la touche (tour 23b, en 960×600) : la carte prête, les feux retenus, ↑ pressée DEPART_ANTICIPATION / 2
    # avant l'extinction (la boucle arrêtée, la physique par BOUCLE.simuler) : faux départ, la voiture part, « +5 s faux départ »
    # affiché, et la pénalité compte dans le classement final
    if l == 960:
        attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.depart && JEU.course.depart.lance === null', None, 180000)
        pg.evaluate('() => { BOUCLE.arreter(); for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
        pg.evaluate('() => { BOUCLE.simuler(0.5); JEU.course.depart.regime = (REGLAGES.DEPART_VERT[0] + REGLAGES.DEPART_VERT[1]) / 2; for (const p of JEU.plateau.pilotes) p.course.compte = REGLAGES.DEPART_ANTICIPATION / 2 + 1 / 120; BOUCLE.simuler(1 / 120); }')
        pg.keyboard.down('ArrowUp')
        pg.evaluate('() => BOUCLE.simuler(0.5)')
        n = pg.evaluate('() => { if (window.__images === undefined) { window.__images = 0; BOUCLE.surAffichage(() => window.__images++); } BOUCLE.demarrer(); return window.__images; }')
        attendre(pg, 'n => window.__images > n + 1', n, 20000)
        pg.evaluate('() => BOUCLE.arreter()')
        f = pg.evaluate('() => ({ resultat: JEU.course.depart.resultat, reaction: JEU.course.depart.reaction, faux: JEU.course.fauxDepart, penalites: JEU.course.penalites, u: JEU.joueur.u, affiche: !document.getElementById("hudPenalite").classList.contains("cache"), texte: document.getElementById("hudPenalite").textContent, resultatTexte: document.getElementById("departResultat").textContent })')
        t(f'{titre} : ↑ juste avant l’extinction (dans DEPART_ANTICIPATION) = faux départ : la voiture part, « +5 s faux départ » affiché, pénalité de 5 s',
          f['resultat'] == 'faux' and f['reaction'] < 0 and f['faux'] and f['penalites'] == 5 and f['u'] > 0.5 and f['affiche'] and f['texte'] == pg.evaluate('() => texte("fauxDepart").replace("{s}", REGLAGES.PENALITE_FAUX_DEPART)'), str(f))
        pg.keyboard.up('ArrowUp')
        # le joueur passe la ligne (ses tours donnés) : au classement final, son total porte les 5 s
        pg.evaluate('() => { const c = JEU.course; while (c.tours.length < c.nbTours) c.tours.push({ temps: 60, secteurs: [20, 20, 20], coupe: false }); c.etat = "finie"; BOUCLE.simuler(1 / 120); }')
        cf = pg.evaluate('() => { const f = classementFinal(JEU.plateau), moi = f.find(x => x.k === JEU.suivie); return { penalites: moi.penalites, total: moi.total, temps: moi.temps }; }')
        t(f'{titre} : la pénalité du faux départ est dans le classement final (total = temps + 5 s)', cf['penalites'] == 5 and cf['total'] is not None and abs(cf['total'] - cf['temps'] - 5) < 1e-9, str(cf))
        L.append(f"  (faux départ joué par le test : réaction {f['reaction']:.3f} s, « {f['resultatTexte']} », « {f['texte']} »)")
        pg.evaluate('() => BOUCLE.demarrer()')

def course_podium(pg, titre, l):
    # une course d'un tour entre 8 IA, accélérée (BOUCLE.simuler) jusqu'à ce que les trois premiers soient connus
    t(f'{titre} : la carte se calcule en fond', attendre(pg, '() => JEU.plateau.carte !== null', None, 180000))
    pg.evaluate('() => BOUCLE.simuler(25)')
    # une pénalité (décision du propriétaire) : pendant la course, elle est affichée dans la tour sans changer la place ;
    # elle compte au podium et aux résultats. On suit le premier, on lui donne +60 s : il reste P1 dans la tour,
    # et finit derrière tous ceux qui arrivent moins de 60 s après lui
    pg.evaluate('() => suivre(classementCourse(JEU.plateau)[0].k)')
    pg.wait_for_timeout(300)
    pg.evaluate('() => { JEU.course.penalites += 60; }')
    t(f'{titre} : +60 s de pénalité au premier : la tour l’affiche (« ✂ +60 s ») et il reste P1',
      attendre(pg, '() => document.getElementById("classementPlace").textContent.startsWith("P1 ") && document.querySelector("#classementListe li.moi .penalite").textContent === "✂ +60 s"'),
      pg.evaluate('() => document.getElementById("classementPlace").textContent'))
    for _ in range(40):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    t(f'{titre} : après l’arrivée, le podium avec 3 voitures (2e, 1er, 3e), dans l’ordre du classement final', pg.evaluate('''() => JEU.ecran === "podium"
      && [...document.querySelectorAll("#podiumMarches .marche")].map(e => e.className).join() === "marche marche2,marche marche1,marche marche3"
      && JEU.final.slice(0, 3).every(x => JEU.modeles[x.k].groupe.visible) && JEU.modeles.filter(m => m.groupe.visible).length === 3'''),
      str(pg.evaluate('() => [JEU.ecran, JEU.plateau.arrives, JEU.plateau.temps]')))
    pg.wait_for_timeout(800)
    if l == 1280: pg.screenshot(path=os.path.join(CAPTURES, 'podium.png'))
    pg.click('#boutonResultats')
    t(f'{titre} : au podium, la pénalité compte : le premier sur la ligne (+60 s) n’est pas sur le podium',
      pg.evaluate('() => JEU.final.slice(0, 3).every(x => x.k !== JEU.suivie) && JEU.final.find(x => x.k === JEU.suivie).ligne === 1'),
      str(pg.evaluate('() => JEU.final.map(x => [x.k, x.ligne, x.place, x.penalites])')))
    t(f'{titre} : le bouton passe aux résultats : 8 lignes, la voiture suivie marquée, temps et pénalités du classement final',
      attendre(pg, '''() => JEU.ecran === "resultats" && document.querySelectorAll("#resultatsLignes tr").length === 8
        && document.querySelectorAll("#resultatsLignes tr.moi").length === 1
        && [...document.querySelectorAll("#resultatsLignes tr")].every((tr, i) => tr.children[0].textContent === String(i + 1)
             && tr.children[3].textContent === (JEU.final[i].penalites > 0 ? "+" + JEU.final[i].penalites + " s ✂" : ""))'''),
      pg.evaluate('() => document.getElementById("resultatsTable").innerText.slice(0, 300)'))
    defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
    t(f'{titre} : résultats sans défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, 'resultats.png' if l == 1280 else 'resultats-960.png'))

# ?championnat=1 : la ligne du coéquipier dans la tour (null si elle n'y est pas encore)
DUEL_TOUR = '''() => { const li = document.querySelectorAll("#classementListe li.coequipier"); if (!li.length || document.getElementById("classement").classList.contains("cache")) return null;
  return { n: li.length, numero: Number(li[0].dataset.numero), attendu: JEU.plateau.pilotes[CHAMPIONNAT.coequipierDe(JEU.championnat).id].numero,
    couleur: li[0].style.getPropertyValue("--ecurie") !== "", ecart: li[0].querySelector(".ecart").textContent }; }'''

def duel_ecran(pg, titre, gp):
    # l'écran entre les courses : « ⚔ Duel contre ton coéquipier : Toi 1 – 3 Pilote 19 (qualifs 0–2, courses 1–1) », les chiffres de
    # CHAMPIONNAT.scoreDuel ; après gp Grands Prix, 2 points par Grand Prix au plus (une qualif, une course) ; la ligne ne déborde pas
    d = pg.evaluate('''() => { const p = document.getElementById("championnatDuel"), s = CHAMPIONNAT.scoreDuel(JEU.championnat);
      return { texte: p.textContent, s, nom: INTERFACE.nomPilote(JEU.championnat.pilotes[s.k]), deborde: p.scrollWidth > p.clientWidth + 1 || p.getBoundingClientRect().right > innerWidth }; }''')
    s = d['s']
    attendu = f"⚔ Duel contre ton coéquipier : Toi {s['total'][0]} – {s['total'][1]} {d['nom']} (qualifs {s['qualifs'][0]}–{s['qualifs'][1]}, courses {s['courses'][0]}–{s['courses'][1]})"
    t(f'{titre} : après {gp} Grand(s) Prix, le score du duel contre le coéquipier est affiché, sans déborder', d['texte'] == attendu and not d['deborde']
      and sum(s['qualifs']) <= gp and sum(s['courses']) <= gp and sum(s['qualifs']) + sum(s['courses']) >= gp, str(d))

# ?championnat=1 : la une du journal (journal.js) à l'écran, après les résultats : la dernière une de l'album, rendue avec les
# noms de l'affichage ; grand titre, petit texte, 2 ou 3 brèves, le classement (5 premiers + le joueur) ; rien ne déborde de la
# page de journal, et la page ne défile pas ; puis un clic (ou une touche) mène à l'écran du championnat
UNE = '''() => { const ch = JEU.championnat, une = ch.album[ch.album.length - 1], r = JOURNAL.rendre(une, ch, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie });
  const $ = id => document.getElementById(id), page = $("unePage").getBoundingClientRect(), dedans = [];
  for (const id of ["uneNom", "uneTitre", "uneTexte", "uneBreves", "uneClassement", "unePhoto"]) { const b = $(id).getBoundingClientRect();
    dedans.push(b.left >= page.left - 1 && b.right <= page.right + 1 && b.top >= page.top - 1 && b.bottom <= page.bottom + 1 && b.width > 0 && b.height > 0); }
  const coupe = ["unePrincipal", "uneCote", "unePage"].filter(id => $(id).scrollHeight > $(id).clientHeight + 1 || $(id).scrollWidth > $(id).clientWidth + 1);
  return { ecran: JEU.ecran, visible: !$("une").classList.contains("cache"), nom: $("uneNom").textContent, attenduNom: r.nom, titre: $("uneTitre").textContent, attenduTitre: r.titre,
    texte: $("uneTexte").textContent, attenduTexte: r.texte, breves: [...document.querySelectorAll("#uneBreves li")].map(e => e.textContent), attenduBreves: r.breves,
    classement: [...document.querySelectorAll("#uneClassement li")].map(e => e.textContent), moi: document.querySelectorAll("#uneClassement li.moi").length, attenduClassement: r.classement.length,
    photo: $("unePhoto").textContent, passer: $("unePasser").textContent, dedans, coupe, fait: une.f,
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''


# ?championnat=1 : l'interview d'après course (interview.js, Codeur 3), entre « Continuer » des résultats et la une du journal :
# le journaliste, la question, trois boutons avec l'icône du ton, « Pas de commentaire » ; après le choix, la ligne d'effet et
# « Continuer » ; ton : 'provocant' | 'calme' | 'malin' | None (pas de commentaire : la une tout de suite, aucun effet)
INTERVIEW_ETAT = """() => { const q = JEU.interview, ch = JEU.championnat, $ = id => document.getElementById(id), b = [...document.querySelectorAll("#interviewReponses button")];
  return { ecran: JEU.ecran, visible: !$("interview").classList.contains("cache"), fait: q && q.fait, rival: q ? q.rival : null, journaliste: $("interviewJournaliste").textContent,
    question: $("interviewQuestion").textContent, attenduQuestion: q ? INTERVIEW.phrase("interview_" + q.fait + "_q", q.variante, q.params, ch, { pilote: INTERFACE.nomPilote }) : null,
    n: b.length, tons: b.map(x => x.dataset.ton), icones: b.map(x => x.querySelector(".icone").textContent), textes: b.map(x => x.querySelector(".reponse").textContent),
    pas: $("boutonPasCommentaire").textContent, effet: $("interviewEffet").textContent, choixCache: $("interviewChoix").classList.contains("cache"), suiteCache: $("interviewSuite").classList.contains("cache"),
    fini: !!JEU.grandPrixFini, prochain: ch.prochain, reputation: Object.assign({}, ch.reputation), confiance: ch.confiance,
    rivalite: q && q.rival !== null && ch.pilotes[q.rival].rivalite ? ch.pilotes[q.rival].rivalite.courses : 0, nomRival: q && q.rival !== null ? INTERFACE.nomPilote(ch.pilotes[q.rival]) : null,
    dedans: [...document.querySelectorAll("#interviewCarte, #interviewReponses button, #boutonPasCommentaire")].every(e => { const r = e.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }),
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
def interview_ecran(pg, titre, ton, capture=None, gp=''):
    ok = attendre(pg, '() => JEU.ecran === "interview" && !document.getElementById("interview").classList.contains("cache")', None, 10000)
    e = pg.evaluate(INTERVIEW_ETAT)
    t(f'{titre} : {gp}après les résultats, l’interview (fait « {e["fait"]} ») : le journaliste et le journal, la question rendue avec les noms, trois boutons avec l’icône du ton (😤 🤝 😏), « Pas de commentaire », le Grand Prix pas encore enregistré, tout dans l’écran',
      ok and e['visible'] and e['journaliste'].startswith(pg.evaluate('() => texte("interviewJournaliste")')) and e['question'] == e['attenduQuestion'] and len(e['question']) > 5 and '{' not in e['question']
      and e['n'] == 3 and e['tons'] == ['provocant', 'calme', 'malin'] and e['icones'] == ['😤', '🤝', '😏'] and all(len(x) > 5 and '{' not in x for x in e['textes']) and e['pas'] == pg.evaluate('() => texte(REGLAGES.INTERVIEW_PASSER ? "interviewPasser" : "interviewPasCommentaire")')
      and not e['fini'] and e['suiteCache'] and not e['choixCache'] and e['dedans'] and pas_de_defilement(e['defile']), str(e)[:700])
    if capture:
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    avant = e
    if ton is None:
        pg.click('#boutonPasCommentaire')
        t(f'{titre} : {gp}« Pas de commentaire » : aucun effet (jauges, confiance), le Grand Prix enregistré et la une tout de suite',
          attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => [Object.assign({}, JEU.championnat.reputation), JEU.championnat.confiance, JEU.championnat.prochain, JEU.championnat.interview.derniere.ton]') == [avant['reputation'], avant['confiance'], avant['prochain'] + 1, None],
          str(pg.evaluate(INTERVIEW_ETAT))[:400])
        return avant
    pg.click(f'#interviewReponses button[data-ton="{ton}"]')
    e = pg.evaluate(INTERVIEW_ETAT)
    effets = pg.evaluate('ton => REGLAGES.INTERVIEW_EFFETS[ton]', ton)
    attendu = {j: max(0, min(100, avant['reputation'][j] + effets.get(j, 0))) for j in avant['reputation']}
    ligne = pg.evaluate('ton => { const l = INTERVIEW.ligneEffet(JEU.interview, ton); return INTERVIEW.phrase(l.cle, 0, l.params, JEU.championnat, { pilote: INTERFACE.nomPilote }); }', ton)
    t(f'{titre} : {gp}la réponse « {ton} » : la ligne d’effet (« {e["effet"]} »), les trois boutons cachés, « Continuer », les jauges bougées d’un pas (INTERVIEW_EFFETS), la confiance = la jauge écurie, le Grand Prix toujours pas enregistré',
      e['effet'] == ligne and e['effet'] != '' and e['choixCache'] and not e['suiteCache'] and e['reputation'] == attendu and e['confiance'] == attendu['ecurie'] and not e['fini'] and e['prochain'] == avant['prochain'], str(e)[:600])
    if ton == 'provocant':
        n = pg.evaluate('() => REGLAGES.INTERVIEW_RIVALITE_COURSES')
        if avant['rival'] is not None:
            t(f'{titre} : {gp}provocant contre {avant["nomRival"]} : « n’a pas aimé » et la rivalité posée sur lui ({n} courses)', e['rivalite'] == n and avant['nomRival'] in e['effet'] and e['effet'].endswith('n’a pas aimé.'), str(e)[:300])
        else:
            t(f'{titre} : {gp}provocant sans rival nommé : aucune rivalité posée', pg.evaluate('() => JEU.championnat.pilotes.every(p => !p.rivalite)'), e['effet'])
    pg.click('#boutonInterviewSuite')
    t(f'{titre} : {gp}« Continuer » de l’interview enregistre le Grand Prix et montre la une du journal', attendre(pg, '() => JEU.ecran === "une"', None, 10000) and pg.evaluate('() => JEU.championnat.prochain') == avant['prochain'] + 1, str(pg.evaluate(INTERVIEW_ETAT))[:300])
    return e
def passer_interview(pg):   # pour les tests qui ne regardent pas l'interview : « Pas de commentaire »
    attendre(pg, '() => JEU.ecran === "interview"', None, 10000); pg.click('#boutonPasCommentaire')
# les trois jauges de réputation au paddock (trois petites barres), aux valeurs du championnat
REPUTATION_ETAT = """() => { const ch = JEU.championnat, js = [...document.querySelectorAll("#championnatReputation .jauge")]; return { ecran: JEU.ecran, n: js.length, jauges: js.map(j => j.dataset.jauge),
  noms: js.map(j => j.querySelector(".nom").textContent), valeurs: js.map(j => +j.querySelector(".valeur").textContent), largeurs: js.map(j => j.querySelector(".plein").style.width), attendu: INTERVIEW.JAUGES.map(j => Math.round(ch.reputation[j])),
  visible: js.length > 0 && js.every(j => j.querySelector(".barre").getBoundingClientRect().width > 40 && j.getBoundingClientRect().bottom <= innerHeight), defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
def reputation_paddock(pg, titre, attendu=None):
    if pg.evaluate('() => JEU.ecran === "championnat"'): paddock_page(pg, '#championnatReputation')   # (tour 48a : les jauges sont dans la page « Mon équipe »)
    e = pg.evaluate(REPUTATION_ETAT)
    if pg.evaluate('() => JEU.ecran === "championnat"'): pg.click('#menuCourse')
    t(f'{titre} : au paddock, les trois jauges de réputation (Public, Écurie, Sponsors) en petites barres, aux valeurs du championnat' + (f' ({attendu})' if attendu else '') + ', sans défilement',
      e['ecran'] == 'championnat' and e['n'] == 3 and e['jauges'] == ['public', 'ecurie', 'sponsors'] and e['noms'] == ['Public', 'Écurie', 'Sponsors'] and e['valeurs'] == e['attendu'] and e['largeurs'] == [f'{v}%' for v in e['attendu']]
      and e['visible'] and (attendu is None or e['valeurs'] == attendu) and pas_de_defilement(e['defile']), str(e))
# la fiche d'un rival avec une rivalité en cours : « “phrase” — circuit, saison N · rivalité : encore n courses »
def fiche_rivalite(pg, titre, k, n):
    paddock_clic(pg, f'#championnatPilotes li[data-k="{k}"] .nom')
    e = pg.evaluate("""k => { const ch = JEU.championnat, p = ch.pilotes[k], rv = p.rivalite, $ = id => document.getElementById(id); return { ecran: JEU.ecran, texte: $("ficheRivalite").textContent, courses: rv ? rv.courses : null,
      nom: INTERFACE.nomPilote(p), circuit: rv ? (texte("circuit_" + rv.circuit) || CIRCUITS[rv.circuit].nom) : null, saison: ch.saison, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }""", k)
    t(f'{titre} : la fiche du rival montre la rivalité : « “phrase” — circuit, saison N · rivalité : encore {n} courses », la phrase le nomme, sans défilement',
      e['ecran'] == 'fiche' and e['courses'] == n and e['texte'].startswith('« ') and e['nom'] in e['texte'] and (' » — ' + str(e['circuit']) + ', saison ' + str(e['saison']) + ' · ') in e['texte'] and e['texte'].endswith(f'rivalité : encore {n} courses') and pas_de_defilement(e['defile']), str(e))
    pg.click('#boutonFicheRetour'); attendre(pg, '() => JEU.ecran === "championnat"')

# l'album des unes (tour 28c) : après 3 Grands Prix (le 3e joué d'avance), « Album » au paddock : la dernière une, puis ← ← la
# première, un clic la suivante ; chaque une est la même que le jour même ; Échap ramène au paddock ; capture album.png
ALBUM_ETAT = '''() => ({ ecran: JEU.ecran, i: JEU.album, titre: document.getElementById("uneTitre").textContent, page: document.getElementById("albumPage").textContent,
  barre: getComputedStyle(document.getElementById("albumBarre")).display !== "none", passer: getComputedStyle(document.getElementById("unePasser")).display === "none",
  avant: document.getElementById("boutonAlbumAvant").disabled, apres: document.getElementById("boutonAlbumApres").disabled,
  dedans: [...document.querySelectorAll("#unePage, #albumBarre")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }),
  defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })'''
def album_ecran(pg, titre, titres):
    pg.evaluate('() => { SAISONS.avancer(JEU.championnat, 1); montrerChampionnat(null); }')
    titres = titres + [pg.evaluate('() => JOURNAL.rendre(JEU.championnat.album[2], JEU.championnat, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie }).titre')]
    t(f'{titre} : au paddock, le bouton « 📰 Album » (3 unes)', pg.evaluate('() => document.getElementById("boutonAlbum").textContent === "📰 Album" && !document.getElementById("boutonAlbum").disabled && JEU.championnat.album.length === 3'))
    paddock_clic(pg, '#boutonAlbum')
    a = pg.evaluate(ALBUM_ETAT)
    t(f'{titre} : l’album s’ouvre sur la dernière une (« Saison 1 · Grand Prix 3 · 3 / 3 »), la même que le jour même, la barre à la place de « clique pour passer », tout dans l’écran',
      a['ecran'] == 'album' and a['i'] == 2 and a['titre'] == titres[2] and a['page'] == 'Saison 1 · Grand Prix 3 · 3 / 3' and a['barre'] and a['passer'] and a['apres'] and not a['avant'] and a['dedans'] and pas_de_defilement(a['defile']), str(a))
    pg.keyboard.press('ArrowLeft'); pg.keyboard.press('ArrowLeft')
    a = pg.evaluate(ALBUM_ETAT)
    t(f'{titre} : ← ← : la première une, redessinée à l’identique (« {titres[0]} »)', a['ecran'] == 'album' and a['i'] == 0 and a['titre'] == titres[0] and a['avant'], str(a))
    pg.click('#uneTitre')
    a = pg.evaluate(ALBUM_ETAT)
    t(f'{titre} : un clic sur la page : la une suivante, à l’identique', a['ecran'] == 'album' and a['i'] == 1 and a['titre'] == titres[1] and a['page'] == 'Saison 1 · Grand Prix 2 · 2 / 3', str(a))
    ph = pg.evaluate(PHOTO_ETAT, 1)
    t(f'{titre} : dans l’album, la photo est redessinée à l’identique depuis la une compacte', bool(ph) and ph['pareil'] and ph['couleurs'] > 8, str(ph))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'album.png')); pg.screenshot(path=os.path.join(CAPTURES, 'album-photo.png'))
    pg.click('#boutonAlbumApres')
    t(f'{titre} : ▶ : la une suivante ; un clic sur la barre ne tourne pas la page en plus', pg.evaluate('() => JEU.album') == 2)
    pg.keyboard.press('Escape')
    t(f'{titre} : Échap ferme l’album : le paddock', attendre(pg, '() => JEU.ecran === "championnat" && document.getElementById("une").classList.contains("cache") && !document.getElementById("une").classList.contains("album")'), str(pg.evaluate('() => JEU.ecran')))

PHOTO_ETAT = '''i => { const cv = document.querySelector("#unePhoto canvas"); if (!cv) return null; const ch = JEU.championnat, u = ch.album[i === null ? ch.album.length - 1 : i];
  const t = document.createElement("canvas"); t.width = cv.width; t.height = cv.height; PHOTO.dessiner(t.getContext("2d", { willReadFrequently: true }), t.width, t.height, JOURNAL.photo(u, ch));
  const px = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data, c = new Set(); for (let k = 0; k < px.length; k += 4 * 53) c.add(px[k] + "," + px[k + 1] + "," + px[k + 2]);
  const q = t.getContext("2d").getImageData(0, 0, t.width, t.height).data; let diff = 0; for (let k = 0; k < px.length; k++) if (px[k] !== q[k]) diff++;
  const r = cv.getBoundingClientRect(); return { couleurs: c.size, pareil: t.toDataURL() === cv.toDataURL(), diff, desc: JSON.stringify(JOURNAL.photo(u, ch)).slice(0, 300), affiche: cv.dataset.desc ? cv.dataset.desc.slice(0, 300) : null, type: JOURNAL.photo(u, ch).type, visible: r.width > 50 && r.height > 30 }; }'''
# le calendrier de la saison (tour 31) : depuis le paddock ; le joueur a pour course de cœur Suzuko (en mémoire, le temps de l'écran ;
# depuis le tour 32, les 12 tracés sont au calendrier) ; les faits, le prochain, la maison du domicile ; capture
def calendrier_ecran(pg, titre, capture):
    pg.evaluate('() => { JEU.coeurAvant = JEU.championnat.pilotes[19].coeur; JEU.championnat.pilotes[19].coeur = "suzuko"; }')
    paddock_clic(pg, '#boutonCalendrier')
    c = pg.evaluate('''() => { const ch = JEU.championnat, lis = [...document.querySelectorAll("#calendrierListe li")];
      return { ecran: JEU.ecran, n: lis.length, faits: lis.filter(li => li.classList.contains("fait")).length, prochain: lis.findIndex(li => li.classList.contains("prochain")), attendu: ch.prochain,
        maisons: document.querySelectorAll("#calendrierListe li.domicile .maison").length, attenduMaisons: ch.calendrier.filter(g => g.circuit === "suzuko").length, resultats: ch.resultats.length,
        texte: lis.map(li => li.textContent).slice(0, 2), gagnes: ch.resultats.map((r, i) => r.ordre[0] === 19 ? lis[i].textContent : null).filter(x => x), nomJoueur: INTERFACE.nomPilote(ch.pilotes[19]), dans: [...document.querySelectorAll("#calendrier > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
        defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }''')
    t(f'{titre} : « 📅 Calendrier » : les 12 Grands Prix, {c["faits"]} faits (vainqueur et ta place), le prochain mis en valeur, le Grand Prix à domicile marqué d’une maison, tout dans l’écran',
      c['ecran'] == 'calendrier' and c['n'] == 12 and c['faits'] == c['resultats'] and c['prochain'] == c['attendu'] and c['maisons'] == c['attenduMaisons'] and c['maisons'] > 0
      and (c['faits'] == 0 or 'vainqueur' in c['texte'][0] or 'ta victoire' in c['texte'][0]) and all('ta victoire' in x and 'vainqueur' not in x and c['nomJoueur'] not in x for x in c['gagnes']) and c['dans'] and pas_de_defilement(c['defile']), str(c))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#boutonCalendrierRetour')
    pg.evaluate('() => { JEU.championnat.pilotes[19].coeur = JEU.coeurAvant; }')
    t(f'{titre} : « Retour » : le paddock', attendre(pg, '() => JEU.ecran === "championnat"'), str(pg.evaluate('() => JEU.ecran')))

# l'audit anglais (tour 31) : chaque écran ouvert en anglais (?lang=en) ; aucun mot français témoin dans son texte, aucun texte hors de
# l'écran en 960×600, pas de défilement ; une capture *-en.png par écran
FRANCAIS = r"(^|[^A-Za-zÀ-ÿ])(le|la|les|des|du|une|et|est|pour|avec|sans|saison|écurie|retour|victoire|victoires|vainqueur|classement|prochain|arbre|toi|ton|ta|tes|tu|cette|carrière|pilote|écuries|courses|titres|saisons|aucune?|suite|continuer)(?![A-Za-zÀ-ÿ])|[éèêàçù]"
AUDIT_ETAT = '''re => { const id = JEU.ecran === "album" ? "une" : JEU.ecran, el = document.getElementById(id); if (!el) return { id, absent: true };
  let texte = el.innerText.replace(/protégée?/g, "");
  for (const [k, v] of Object.entries(TEXTES.en)) if (/^(circuit_|sponsor_)/.test(k) && typeof v === "string") texte = texte.split(v).join("");   // (les noms propres inventés : circuits, sponsors)
  const m = texte.match(new RegExp(re, "i"));
  const hors = [...el.querySelectorAll("*")].filter(e => e.childElementCount === 0 && e.textContent.trim() && getComputedStyle(e).display !== "none" && e.getClientRects().length)
    .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map(e => e.textContent.trim().slice(0, 40));
  return { id, francais: m ? texte.slice(Math.max(0, m.index - 30), m.index + 40) : null, hors, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
# les discussions (tour 33, Codeur 3, discussion.js) : depuis la fiche d'un rival (« Discuter ») et depuis le paddock (le coéquipier) ;
# la saisie libre (les espaces se tapent, Entrée envoie), le composeur au clic, la réponse du pilote dans le fil, la mémoire sauvegardée ;
# rien hors de l'écran ; captures discussion.png (et -960, -en)
DISCUSSION_ETAT = """() => { const el = document.getElementById("discussion"), fil = [...document.querySelectorAll("#discussionFil li")].map(l => [l.className, l.textContent]);
  const hors = [...el.querySelectorAll("*")].filter(e => e.childElementCount === 0 && e.textContent.trim() && getComputedStyle(e).display !== "none" && e.getClientRects().length && !e.closest("#discussionFil"))
    .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map(e => e.textContent.trim().slice(0, 30));
  const carte = document.getElementById("discussionCarte").getBoundingClientRect(), retour = document.getElementById("boutonDiscussionRetour").getBoundingClientRect();
  return { ecran: JEU.ecran, k: JEU.discussion && JEU.discussion.k, fil, intentions: [...document.querySelectorAll("#discussionComposeur button.intention")].map(b => b.dataset.intention),
    nom: document.getElementById("discussionNom").textContent, hors, dedans: carte.top >= 0 && retour.bottom <= innerHeight + 1 && carte.right <= innerWidth + 1,
    focus: document.activeElement && document.activeElement.id, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
def discussion_ecran(pg, titre, l, h, page):
    en = 'lang=en' in page
    t(f'{titre} : le paddock', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000))
    pg.wait_for_timeout(300)
    k = pg.evaluate('() => { const co = CHAMPIONNAT.coequipierDe(JEU.championnat); return JEU.championnat.pilotes.find(p => !p.humain && p.id !== co.id).id; }')
    paddock_clic(pg, f'#championnatPilotes li[data-k="{k}"] .nom')
    attendre(pg, '() => JEU.ecran === "fiche"', None, 5000)
    pg.click('#boutonFicheDiscuter')
    t(f'{titre} : « Discuter » sur la fiche d’un rival ouvre la discussion, la saisie prête à écrire', attendre(pg, f'() => JEU.ecran === "discussion" && JEU.discussion.k === {k} && document.activeElement && document.activeElement.id === "discussionTexte"', None, 5000),
      str(pg.evaluate(DISCUSSION_ETAT)))
    # la saisie libre au clavier : les espaces se tapent (le jeu ne les prend plus), Entrée envoie
    pg.click('#discussionTexte'); pg.keyboard.type('slt, t es trop nul' if not en else 'hey, you are so slow')
    v = pg.evaluate('() => document.getElementById("discussionTexte").value')
    t(f'{titre} : on tape un message avec des espaces (« {v} »)', ' ' in v and len(v) > 10, v)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    d = pg.evaluate(DISCUSSION_ETAT); r = pg.evaluate('() => JEU.derniereReponse && { acte: JEU.derniereReponse.analyse.acte, texte: JEU.derniereReponse.texte, reaction: JEU.derniereReponse.reaction }')
    t(f'{titre} : Entrée envoie ; le pilote répond depuis son raisonnement (l’insulte lue, sa réaction dans le fil)', r and r['acte'] == 'INSULTE' and len(d['fil']) == 2 and d['fil'][0][0] == 'moi' and d['fil'][1] == ['lui', r['texte']]
      and pg.evaluate('() => document.getElementById("discussionTexte").value') == '', str(d['fil']) + ' ' + str(r))
    # le composeur au clic : « S'excuser » repart dans la même lecture
    pg.click('#discussionComposeur button[data-intention="excuser"]'); pg.wait_for_timeout(200)
    d = pg.evaluate(DISCUSSION_ETAT); r = pg.evaluate('() => JEU.derniereReponse.analyse.acte')
    t(f'{titre} : le composeur au clic (« S’excuser ») : la phrase et la réponse s’ajoutent au fil, lues comme une excuse', len(d['fil']) == 4 and r == 'EXCUSE', str(d['fil']) + ' ' + str(r))
    t(f'{titre} : la mémoire du pilote est sauvegardée (2 messages)', pg.evaluate(f'() => {{ const c = SAUVEGARDE.championnat(); return !!c && c.pilotes[{k}].memoire && c.pilotes[{k}].memoire.dits.length === 2; }}'))
    t(f'{titre} : la discussion tient dans l’écran ({l}×{h}), sans défilement, le duel absent avec un rival', d['dedans'] and not d['hors'] and pas_de_defilement(d['defile']) and 'duel' not in d['intentions'] and len(d['intentions']) >= 12, str(d))
    pg.wait_for_timeout(800); pg.screenshot(path=os.path.join(CAPTURES, 'discussion' + ('-en' if en else '') + ('' if l == 1280 else '-' + str(l)) + '.png'))
    pg.click('#boutonDiscussionRetour')
    t(f'{titre} : « Retour » ramène à la fiche, puis au paddock', attendre(pg, '() => JEU.ecran === "fiche"', None, 3000) and (pg.click('#boutonFicheRetour') or True) and attendre(pg, '() => JEU.ecran === "championnat"', None, 3000))
    # le coéquipier, depuis le paddock : le duel est proposé
    paddock_clic(pg, '#boutonParlerCoequipier')
    d = pg.evaluate(DISCUSSION_ETAT)
    t(f'{titre} : « 💬 Coéquipier » au paddock ouvre la discussion avec ton coéquipier, le duel proposé', d['ecran'] == 'discussion' and d['k'] == pg.evaluate('() => CHAMPIONNAT.coequipierDe(JEU.championnat).id') and 'duel' in d['intentions'], str(d))
    pg.click('#discussionComposeur button[data-intention="duel"]'); pg.wait_for_timeout(200)
    t(f'{titre} : il répond sur votre duel', pg.evaluate('() => JEU.derniereReponse.reaction.startsWith("duel_")'), pg.evaluate('() => JEU.derniereReponse.reaction'))
    pg.click('#boutonDiscussionRetour')
    t(f'{titre} : retour au paddock', attendre(pg, '() => JEU.ecran === "championnat"', None, 3000))
    # le courrier : un message du pilote touché à la dernière course ; « ✉ Courrier (1) » au paddock, l'écran, « Répondre » ouvre la discussion
    avant = pg.evaluate('() => COURRIER_PILOTES.nonLus(JEU.championnat)')   # (les Grands Prix fabriqués par ?gp=3 ont déjà fait écrire des pilotes)
    pg.evaluate(f'''() => {{ const ch = JEU.championnat, c = COURRIER_PILOTES.completer(ch); c.messages.push({{ k: {k}, sujet: 'contact', cle: 'courrier_contact_calme', saison: ch.saison, gp: ch.resultats.length, lu: false }}); montrerChampionnat(null); }}''')
    b = pg.evaluate('() => document.getElementById("boutonCourrier").textContent')
    t(f'{titre} : au paddock, « ✉ Courrier ({avant + 1}) » annonce les messages non lus', b.endswith(f'({avant + 1})') and pg.evaluate('() => document.getElementById("boutonCourrier").classList.contains("nouveau")'), b)
    paddock_clic(pg, '#boutonCourrier')
    c = pg.evaluate('''() => { const li = [...document.querySelectorAll("#courrierListe li")]; const el = document.getElementById("courrier");
      const hors = [...el.querySelectorAll("*")].filter(e => e.childElementCount === 0 && e.textContent.trim() && getComputedStyle(e).display !== "none" && e.getClientRects().length)
        .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map(e => e.textContent.trim().slice(0, 30));
      return { ecran: JEU.ecran, n: li.length, nouveau: li.filter(x => x.classList.contains("nouveau")).length, texte: li[0] && li[0].querySelector(".texte").textContent, hors }; }''')
    t(f'{titre} : l’écran du courrier : le plus récent en haut, marqué nouveau, rien hors de l’écran', c['ecran'] == 'courrier' and c['n'] >= 1 and c['nouveau'] == avant + 1 and c['texte'] and not c['hors'], str(c))
    pg.wait_for_timeout(800); pg.screenshot(path=os.path.join(CAPTURES, 'courrier' + ('-en' if en else '') + ('' if l == 1280 else '-' + str(l)) + '.png'))
    pg.click('#courrierListe li button')
    d = pg.evaluate(DISCUSSION_ETAT)
    t(f'{titre} : « Répondre » ouvre la discussion avec son auteur, son message en tête du fil ; il est lu', d['ecran'] == 'discussion' and d['k'] == k and d['fil'][0] == ['lui', c['texte']]
      and pg.evaluate('() => COURRIER_PILOTES.nonLus(JEU.championnat)') == avant, str(d['fil']))
    pg.click('#boutonDiscussionRetour')
    t(f'{titre} : « Retour » ramène au courrier, puis au paddock', attendre(pg, '() => JEU.ecran === "courrier"', None, 3000) and (pg.click('#boutonCourrierRetour') or True) and attendre(pg, '() => JEU.ecran === "championnat"', None, 3000))

# les patrons d'écurie (tour 35, Codeur 3, patrons.js) : ton patron depuis le paddock (« 💼 Direction ») ; aux contrats, « 💬 Négocier »
# avec le patron d'une offre, puis l'offre redessinée avec son salaire ; rien hors de l'écran ; captures patron.png, contrats-patron.png
CONTRATS_PATRON = """() => { const el = document.getElementById("contrats"), li = [...document.querySelectorAll("#contratsListe li")];
  const hors = [...el.querySelectorAll("*")].filter(e => e.childElementCount === 0 && e.textContent.trim() && getComputedStyle(e).display !== "none" && e.getClientRects().length)
    .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map(e => e.textContent.trim().slice(0, 30));
  return { ecran: JEU.ecran, n: li.length, salaires: li.map(x => x.querySelector(".salaire") && x.querySelector(".salaire").textContent), negocier: li.map(x => !!x.querySelector("button.negocier")), hors,
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
def patron_ecran(pg, titre, l, h, page):
    en = 'lang=en' in page
    t(f'{titre} : le paddock', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000))
    pg.wait_for_timeout(300)
    paddock_clic(pg, '#boutonParlerPatron')
    d = pg.evaluate(DISCUSSION_ETAT)
    t(f'{titre} : « 💼 Direction » ouvre la discussion avec le patron de ton écurie (confiance, statut, budget, consignes)', d['ecran'] == 'discussion' and pg.evaluate('() => JEU.discussion.patron === PILOTE.joueur(JEU.championnat).ecurie')
      and all(i in d['intentions'] for i in ['confiance', 'statut', 'budget', 'consigne']), str(d))
    pg.click('#discussionTexte'); pg.keyboard.type('does the team trust me?' if en else 'tu me fais confiance ?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    r = pg.evaluate('() => JEU.derniereReponse && { reaction: JEU.derniereReponse.reaction, texte: JEU.derniereReponse.texte }')
    d = pg.evaluate(DISCUSSION_ETAT)
    t(f'{titre} : il répond sur la confiance de l’écurie, depuis la vraie jauge', r and r['reaction'].startswith('confiance_') and d['fil'][-1] == ['lui', r['texte']], str(r))
    pg.click('#discussionComposeur button[data-intention="statut"]'); pg.wait_for_timeout(200)
    t(f'{titre} : « Premier pilote » au clic : accordé ou refusé, avec sa raison', pg.evaluate('() => /^statut_/.test(JEU.derniereReponse.reaction) && JEU.derniereReponse.raisons.length > 0'), pg.evaluate('() => JEU.derniereReponse.reaction'))
    t(f'{titre} : la discussion avec le patron tient dans l’écran ({l}×{h})', d['dedans'] and not d['hors'] and pas_de_defilement(d['defile']), str(d))
    pg.wait_for_timeout(800); pg.screenshot(path=os.path.join(CAPTURES, 'patron' + ('-en' if en else '') + ('' if l == 1280 else '-' + str(l)) + '.png'))
    pg.click('#boutonDiscussionRetour')
    t(f'{titre} : retour au paddock', attendre(pg, '() => JEU.ecran === "championnat"', None, 3000))
    # les contrats : la fin de la saison fabriquée, puis « Négocier » avec le patron de la meilleure offre
    pg.evaluate('() => { JEU.lignesGP = null; SAISONS.avancer(JEU.championnat, 1); montrerFinSaison(); }'); pg.wait_for_timeout(200)
    pg.evaluate('() => { suiteCeremonie(); suiteClassementSaison(); suiteDuelSaison(); }')
    t(f'{titre} : les contrats', attendre(pg, '() => JEU.ecran === "contrats"', None, 5000), pg.evaluate('() => JEU.ecran'))
    c = pg.evaluate(CONTRATS_PATRON)
    t(f'{titre} : aux contrats, chaque offre montre son salaire et « 💬 Négocier », rien hors de l’écran', c['n'] >= 1 and all(c['salaires']) and all(c['negocier']) and not c['hors'] and pas_de_defilement(c['defile']), str(c))
    pg.wait_for_timeout(800); pg.screenshot(path=os.path.join(CAPTURES, 'contrats-patron' + ('-en' if en else '') + ('' if l == 1280 else '-' + str(l)) + '.png'))
    e = pg.evaluate('() => Number(document.querySelector("#contratsListe li").dataset.ecurie)')
    pg.click('#contratsListe li:first-child button.negocier')
    t(f'{titre} : « Négocier » ouvre la discussion avec le patron de cette écurie (le salaire proposé)', attendre(pg, f'() => JEU.ecran === "discussion" && JEU.discussion.patron === {e}', None, 3000)
      and 'salaire' in pg.evaluate(DISCUSSION_ETAT)['intentions'], str(pg.evaluate(DISCUSSION_ETAT)))
    pg.click('#discussionComposeur button[data-intention="salaire"]'); pg.wait_for_timeout(200)
    r = pg.evaluate('() => JEU.derniereReponse.reaction')
    t(f'{titre} : « Salaire » : il accepte, refuse ou fait une contre-offre, depuis son envie de t’avoir', r in ('contre_offre', 'salaire_refuse', 'salaire_accepte'), r)
    if r == 'contre_offre':
        pg.click('#discussionComposeur button[data-intention="oui"]'); pg.wait_for_timeout(200)
        t(f'{titre} : « Oui » à la contre-offre : marché conclu', pg.evaluate('() => JEU.derniereReponse.reaction') == 'marche_conclu', pg.evaluate('() => JEU.derniereReponse.reaction'))
    attendu = pg.evaluate(f'() => ARGENT.formater(PATRONS.conditions(JEU.championnat, {e}).salaire)')
    pg.click('#boutonDiscussionRetour')
    c = pg.evaluate(CONTRATS_PATRON)
    t(f'{titre} : « Retour » ramène aux contrats, l’offre redessinée avec le salaire négocié ({attendu})', c['ecran'] == 'contrats' and attendu in (c['salaires'][0] or ''), str(c['salaires']))
    # (tour 51b) un promu : les contrats d'en haut, « Négocier » avec leurs patrons (salaire d'en haut), et le retour
    pg.evaluate('''() => { const ch = CHAMPIONNAT.creer(77); SAISONS.avancer(ch, 99); const j = ch.pilotes.find(p => p.humain); if (SAISONS.bilan(ch).joueurPlace > 3) j.stats.points += 1000;
      SAISONS.terminerSaison(ch); JEU.championnat = ch; JEU.discussion = null; montrerContrats(); }'''); pg.wait_for_timeout(300)
    c = pg.evaluate(CONTRATS_PATRON)
    promu = pg.evaluate('() => ({ monte: DIVISIONS.enAttente(JEU.championnat), note: document.getElementById("contratsNote").textContent })')
    t(f'{titre} : monté de division, les offres d’en haut montrent leur salaire et « 💬 Négocier », rien hors de l’écran', promu['monte'] and c['n'] >= 1 and all(c['salaires']) and all(c['negocier']) and not c['hors'] and pas_de_defilement(c['defile']), str([promu, c]))
    e = pg.evaluate('() => Number(document.querySelector("#contratsListe li").dataset.ecurie)')
    pg.evaluate('() => document.querySelector("#contratsListe li:first-child button.negocier").click()')
    d = pg.evaluate(DISCUSSION_ETAT)
    t(f'{titre} : « Négocier » avec le patron d’en haut ouvre la discussion (salaire, statut ; ni budget ni consigne), dans l’écran', attendre(pg, f'() => JEU.ecran === "discussion" && JEU.discussion.patron === {e}', None, 3000) and 'salaire' in d['intentions'] and 'budget' not in d['intentions'] and d['dedans'] and not d['hors'] and pas_de_defilement(d['defile']), str(d))
    pg.evaluate('() => document.querySelector("#discussionComposeur button[data-intention=salaire]").click()'); pg.wait_for_timeout(200)
    r = pg.evaluate('() => JEU.derniereReponse && JEU.derniereReponse.reaction')
    t(f'{titre} : il répond au salaire depuis son envie de t’avoir, avec un texte', r in ('contre_offre', 'salaire_refuse', 'salaire_accepte') and pg.evaluate('() => !!JEU.derniereReponse.texte && !/[{]|undefined/.test(JEU.derniereReponse.texte)'), str(r))
    pg.evaluate('() => document.querySelector("#discussionComposeur button[data-intention=statut]").click()'); pg.wait_for_timeout(200)
    t(f'{titre} : « Premier pilote » : refusé à un promu', pg.evaluate('() => JEU.derniereReponse.reaction') == 'statut_refuse', pg.evaluate('() => JEU.derniereReponse.reaction'))
    pg.evaluate('() => document.querySelector("#boutonDiscussionRetour").click()')
    t(f'{titre} : « Retour » ramène aux contrats d’en haut', attendre(pg, '() => JEU.ecran === "contrats" && DIVISIONS.enAttente(JEU.championnat)', None, 3000))

# (tour 48a) le nouveau paddock : chaque bouton est rangé dans une page (menu à gauche) ; on ouvre sa page par le menu, comme un
# joueur, puis on clique le bouton
MENU_PAGES = {'course': '#menuCourse', 'equipe': '#menuEquipe', 'boutique': '#menuBoutique', 'saison': '#menuSaison', 'messages': '#menuMessages', 'reglages': '#menuReglages'}
def paddock_page(pg, sel):
    page = pg.evaluate('(s) => { const e = document.querySelector(s), p = e && e.closest(".paddockPage"); return p && p.classList.contains("cache") ? p.dataset.page : null; }', sel)
    if page: pg.evaluate('s => document.querySelector(s).click()', MENU_PAGES[page])   # (un clic par la page : sous swiftshader, celui de Playwright attend parfois plus de 30 s que la page réponde, voir livree_ecran)
def paddock_clic(pg, sel):
    paddock_page(pg, sel)
    pg.click(sel)

# --- le nouveau paddock (tour 48a, Codeur 1 ; le propriétaire 2026-11-04) : un menu à gauche, une page au centre ; chaque ancien bouton
# rangé dans une page (aucune fonction perdue) ; chaque page tient dans l'écran (1280×720, 960×600, téléphone 640×360, fr et en), sans
# défilement ni bouton coupé ; « Course suivante » visible sur la page Course ; plus rien dans les coins ; le classement réduit ; la page
# gardée au retour du garage ; « Nouvelle carrière » et « Nouvelle carrière à 0 » avec leurs deux confirmations, ce qui reste et ce qui part
PADDOCK_RANGES = {'boutonCourseSuivante': 'course', 'boutonVoirTout': 'course', 'boutonVoirMessages': 'course', 'boutonGarage': 'equipe', 'boutonMaVoiture': 'equipe', 'boutonSponsors': 'equipe', 'boutonMonCasque': 'equipe', 'boutonBoutique': 'boutique',
  'boutonCalendrier': 'saison', 'boutonAlbum': 'saison', 'boutonArbre': 'saison', 'boutonCourrier': 'messages', 'boutonParlerCoequipier': 'messages', 'boutonParlerPatron': 'messages',
  'boutonMuetPaddock': 'reglages', 'boutonSonEffets': 'reglages', 'boutonSonAmbiance': 'reglages', 'boutonSonCommentateur': 'reglages', 'boutonAidesPaddock': 'reglages',
  'boutonRevoirAides': 'reglages', 'boutonQualitePaddock': 'reglages', 'boutonNouvelleCarriere': 'reglages', 'boutonNouvelleCarriereZero': 'reglages'}
PADDOCK_DEDANS = """() => { const out = [], L = innerWidth, H = innerHeight;
  for (const e of document.querySelectorAll('#championnat button, #championnat .tvCarte, #championnat li, #championnat h1, #championnat h2, #championnat p')) {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.left < -1 || r.top < -1 || r.right > L + 1 || r.bottom > H + 1) out.push('hors:' + (e.id || e.className || e.tagName));
    if (e.tagName === 'BUTTON' && e.scrollWidth > e.clientWidth + 2) out.push('coupé:' + e.id); }
  const page = document.querySelector('#paddockPages .paddockPage:not(.cache)');
  return { out, page: page && page.dataset.page, defile: [document.documentElement.scrollHeight, H, document.documentElement.scrollWidth, L],
    fixes: [...document.querySelectorAll('#championnat button')].filter(b => getComputedStyle(b).position === 'fixed').map(b => b.id),
    son: document.getElementById('boutonSon').getBoundingClientRect().width }; }"""
ECRAN_DEDANS = """(id) => { const out = [], ec = document.getElementById(id);
  for (const e of ec.querySelectorAll('button, li, h1, p, canvas, select, input, label')) { const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) out.push((e.id || e.className || e.tagName) + ' ' + Math.round(r.top) + '→' + Math.round(r.bottom)); }
  const retour = [...ec.querySelectorAll('button')].find(b => /Retour$/.test(b.id)), rr = retour && retour.getBoundingClientRect();
  const bs = [...ec.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width), rec = [];   // (tour 51e) deux boutons ne se recouvrent pas
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i].getBoundingClientRect(), c = bs[j].getBoundingClientRect();
    if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) rec.push(bs[i].id + '/' + bs[j].id); }
  return { ecran: JEU.ecran, out, rec, retour: !!rr && rr.width > 0 && rr.bottom <= innerHeight + 1, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
def paddock_menu(pg, titre, l, h, lang):
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    pg.evaluate('() => { if (typeof AIDES_ECRAN !== "undefined") { REGLAGES.AIDES_ACTIVES = false; AIDES_ECRAN.fermer(); } }')   # (la bulle d'aide ne compte pas ici : aides-menus la teste)
    pg.wait_for_timeout(300)
    m = pg.evaluate("""() => [...document.querySelectorAll('#paddockMenu button')].map(b => [b.id, b.querySelector('.menuNom').textContent, b.getBoundingClientRect().width > 0])""")
    t(f'{titre} : sans écran tactile, les réglages du volant n’existent pas dans les Réglages du paddock', pg.evaluate('() => document.querySelectorAll(".tactileReglage").length === 0 && getComputedStyle(document.getElementById("reglagesVolant")).display === "none"'))
    noms = pg.evaluate("() => ['paddock_course', 'paddock_equipe', 'paddock_boutique', 'paddock_saison', 'paddock_messages', 'titreAmis', 'paddock_reglages', 'paddock_apprendre'].map(texte)")
    t(f'{titre} : le menu à gauche : Course, Mon équipe, Boutique, Saison, Messages, Entre amis, puis Réglages et Apprendre en bas, tous visibles', [x[1] for x in m] == noms and all(x[2] for x in m)
      and [x[0] for x in m] == ['menuCourse', 'menuEquipe', 'menuBoutique', 'menuSaison', 'menuMessages', 'boutonAmisPaddock', 'menuReglages', 'boutonTutorielPaddock'], str(m))
    ranges = pg.evaluate('(ids) => Object.fromEntries(Object.keys(ids).map(id => [id, INTERFACE.pageDe(id)]))', PADDOCK_RANGES)
    t(f'{titre} : chaque ancien bouton du paddock est rangé dans sa page (aucune fonction perdue) ; « Entre amis » et « Apprendre » sont dans le menu', ranges == PADDOCK_RANGES
      and pg.evaluate('() => ["boutonAmisPaddock", "boutonTutorielPaddock"].every(id => document.getElementById(id).closest("#paddockMenu"))'), str({k: v for k, v in ranges.items() if PADDOCK_RANGES[k] != v}))
    for page, menu in MENU_PAGES.items():
        pg.click(menu); pg.wait_for_timeout(250)
        d = pg.evaluate(PADDOCK_DEDANS)
        fr = re.search(MOTS_FR, pg.evaluate('() => document.getElementById("championnat").innerText')) if lang == 'en' else None
        t(f'{titre} : la page « {page} » (un clic sur le menu) tient dans l’écran, sans défilement ni bouton coupé ; rien dans les coins, pas de 🔊 en double' + (' ; pas un mot français' if lang == 'en' else ''),
          d['page'] == page and not d['out'] and pas_de_defilement(d['defile']) and not d['fixes'] and d['son'] == 0 and not fr, str([d, fr and fr.group(0)]))
        pg.screenshot(path=os.path.join(CAPTURES, f'paddock-{page}-{lang}-{l}.png'))
    pg.click('#menuCourse'); pg.wait_for_timeout(200)
    c = pg.evaluate("""() => { const b = document.getElementById('boutonCourseSuivante').getBoundingClientRect(), ch = JEU.championnat, cl = CHAMPIONNAT.classementPilotes(ch), co = CHAMPIONNAT.coequipierDe(ch);
      const lignes = [...document.querySelectorAll('#paddockClassementCourt li:not(.trou) .place')].map(e => Number(e.textContent));
      const j = cl.findIndex(x => ch.pilotes[x.k].humain) + 1, c = co ? cl.findIndex(x => x.k === co.id) + 1 : null;
      return { bouton: [b.left, b.top, b.right, b.bottom, innerWidth, innerHeight], lignes, j, c, moi: !!document.querySelector('#paddockClassementCourt li.moi'), coeq: !!document.querySelector('#paddockClassementCourt li.coequipier') }; }""")
    bo = c['bouton']
    t(f'{titre} : « Course suivante » est visible en entier sur la page Course ; le classement réduit : les 3 premiers, toi (P{c["j"]}) et tes voisins, ton coéquipier (P{c["c"]}), dans l’ordre',
      bo[2] - bo[0] > 50 and bo[0] >= 0 and bo[1] >= 0 and bo[2] <= bo[4] and bo[3] <= bo[5] and c['lignes'][:3] == [1, 2, 3] and c['j'] in c['lignes'] and c['c'] in c['lignes']
      and c['lignes'] == sorted(c['lignes']) and c['moi'] and c['coeq'] and len(c['lignes']) <= 8, str(c))
    pg.click('#boutonVoirTout')
    t(f'{titre} : « Voir tout » ouvre la page Saison (les classements complets)', pg.evaluate('() => INTERFACE.pageActive() === "saison" && document.querySelectorAll("#championnatPilotes li").length === 20'))
    pg.click('#menuEquipe'); pg.click('#boutonGarage'); attendre(pg, '() => JEU.ecran === "garage"')
    pg.click('#boutonGarageRetour')
    t(f'{titre} : au retour du garage, le paddock est resté sur « Mon équipe »', attendre(pg, '() => JEU.ecran === "championnat" && INTERFACE.pageActive() === "equipe" && !document.getElementById("pageEquipe").classList.contains("cache")'))
    # (tour 48a-2) les écrans ouverts depuis les pages du paddock tiennent aussi dans l'écran (le garage, l'aileron, « Ma voiture », la boutique),
    # ouverts par leurs fonctions (sous swiftshader, l'aperçu 3D de « Ma voiture » fait attendre les clics de Playwright)
    for nom, ouvrir, fermer in (('garage', 'montrerGarage()', 'quitterGarage()'), ('aileron', 'montrerGarage(); montrerAileron()', 'quitterAileron(); quitterGarage()'),
                                ('livree', 'montrerMaVoiture()', 'quitterLivree()'), ('boutique', 'montrerBoutique()', 'quitterBoutique()'),
                                ('reglagesVoiture', 'montrerGarage(); montrerReglagesVoiture()', 'quitterReglagesVoiture(); quitterGarage()')):   # (+ les réglages de la voiture, tour 50b)
        pg.evaluate('() => { ' + ouvrir + ' }'); pg.wait_for_timeout(400)
        e = pg.evaluate(ECRAN_DEDANS, nom)
        if l == 640: pg.screenshot(path=os.path.join(CAPTURES, f'paddock-{nom}-{lang}-{l}.png'))
        pg.evaluate('() => { ' + fermer + ' }'); pg.wait_for_timeout(200)
        t(f'{titre} : l’écran « {nom} » (depuis le paddock) tient dans l’écran, son « Retour » compris, sans défilement ni boutons qui se recouvrent', e['ecran'] == nom and not e['out'] and not e['rec'] and e['retour'] and pas_de_defilement(e['defile']), str(e))
    garde = pg.evaluate('() => localStorage.getItem(SAUVEGARDE.CLE)')
    pg.click('#menuReglages'); pg.click('#boutonNouvelleCarriereZero'); pg.click('#boutonCarriereOui'); pg.wait_for_timeout(200)
    d = pg.evaluate(PADDOCK_DEDANS)
    pg.screenshot(path=os.path.join(CAPTURES, f'paddock-confirmation-{lang}-{l}.png'))
    pg.click('#boutonCarriereNon')
    t(f'{titre} : la confirmation de « Nouvelle carrière à 0 » (le second temps, avec la liste) tient dans l’écran, sans défilement ; « Annuler » la referme sans rien effacer',
      not d['out'] and pas_de_defilement(d['defile']) and pg.evaluate('() => document.getElementById("carriereConfirmation").classList.contains("cache") && JEU.ecran === "championnat"') and pg.evaluate('() => localStorage.getItem(SAUVEGARDE.CLE)') == garde, str(d))
    if l != 1280: return
    # « Nouvelle carrière » : deux temps, « Annuler » ne change rien ; puis la création du pilote, un monde neuf, l'argent à 0, les motifs,
    # les leçons et le temple gardés (la carrière abandonnée y entre : elle a une saison finie)
    avant = pg.evaluate("""() => { const d = SAUVEGARDE.lire(); d.motifs = ['etoile']; d.tutoriel = ['conduite']; SAUVEGARDE.ecrire(d); JEU.championnat.saison = 2; JEU.championnat.carriere.debut = 1;
      return { graine: JEU.championnat.graine, temple: d.temple.carrieres.length, argent: ARGENT.solde(JEU.championnat), decouverte: d.decouverteFaite }; }""")
    pg.click('#menuReglages'); pg.click('#boutonNouvelleCarriere')
    q1 = pg.evaluate('() => [document.getElementById("carriereConfirmationTexte").textContent, document.getElementById("boutonCarriereOui").textContent]')
    pg.click('#boutonCarriereNon')
    annule = pg.evaluate('() => document.getElementById("carriereConfirmation").classList.contains("cache") && JEU.ecran === "championnat"')
    pg.click('#boutonNouvelleCarriere'); pg.click('#boutonCarriereOui')
    q2 = pg.evaluate('() => [document.getElementById("carriereConfirmationTexte").textContent, document.getElementById("boutonCarriereOui").textContent, JEU.ecran]')
    t(f'{titre} : « Nouvelle carrière » demande deux fois (« {q1[0]} », puis « {q2[1]} ») ; « Annuler » ne change rien', q1[0] == pg.evaluate('() => texte("carriere_nouvelleQuestion")') and annule
      and q2[0] == pg.evaluate('() => texte("carriere_nouvelleSur")') and q2[1] == pg.evaluate('() => texte("carriere_nouvelleOui")') and q2[2] == 'championnat', str([q1, q2, annule]))
    pg.click('#boutonCarriereOui')
    apres = pg.evaluate("""() => { const d = SAUVEGARDE.lire(); return { ecran: JEU.ecran, graine: d.championnat.graine, manque: PILOTE.manque(d.championnat), argent: ARGENT.solde(d.championnat),
      saison: d.championnat.saison, motifs: d.motifs, tutoriel: d.tutoriel, temple: d.temple.carrieres.length, decouverte: d.decouverteFaite }; }""")
    t(f'{titre} : après « Nouvelle carrière » : la création du pilote, un monde neuf (saison 1, argent 0), les motifs, les leçons et la découverte gardés, la carrière abandonnée au temple',
      apres['ecran'] == 'pilote' and apres['graine'] != avant['graine'] and apres['manque'] and apres['argent'] == 0 and apres['saison'] == 1 and apres['motifs'] == ['etoile']
      and apres['tutoriel'] == ['conduite'] and apres['temple'] == avant['temple'] + 1 and apres['decouverte'] == avant['decouverte'], str([avant, apres]))
    # « Nouvelle carrière à 0 » : deux temps en rouge, avec la liste de ce qui sera perdu ; puis tout est effacé sauf le son et la qualité, et
    # la page nue repart du premier lancement (l'écran titre, « ▶ Jouer » → la découverte)
    pg.goto('file://' + RACINE + '/index.html?championnat=1&gp=5&lang=' + lang); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    pg.evaluate("""() => { REGLAGES.AIDES_ACTIVES = false; AIDES_ECRAN.fermer(); SAUVEGARDE.ecrireOption('qualite', 'basse'); SAUVEGARDE.ecrireOption('son_volumes', { effets: 0.5, ambiance: 1, commentateur: 0.25 });
      SAUVEGARDE.ecrireOption('fantome', false); const d = SAUVEGARDE.lire(); d.motifs = ['etoile']; d.tutoriel = ['conduite']; d.aides = ['duel']; d.records = { 5: 50 }; SAUVEGARDE.ecrire(d); }""")
    pg.click('#menuReglages'); pg.click('#boutonNouvelleCarriereZero')
    z1 = pg.evaluate('() => ({ texte: document.getElementById("carriereConfirmationTexte").textContent, liste: document.querySelectorAll("#carriereConfirmationListe li").length, rouge: document.getElementById("carriereConfirmation").classList.contains("danger") })')
    pg.click('#boutonCarriereOui')
    z2 = pg.evaluate('() => [document.getElementById("carriereConfirmationTexte").textContent, document.getElementById("boutonCarriereOui").textContent, JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)).motifs]')
    pg.screenshot(path=os.path.join(CAPTURES, f'paddock-zero-{lang}.png'))
    t(f'{titre} : « Nouvelle carrière à 0 » : deux temps, en rouge, avec la liste de ce qui sera perdu ; rien n’est effacé avant le second « Oui »',
      z1['texte'] == pg.evaluate('() => texte("carriere_zeroQuestion")') and z1['liste'] >= 5 and z1['rouge'] and z2[1] == pg.evaluate('() => texte("carriere_zeroOui")') and z2[2] == ['etoile'], str([z1, z2]))
    with pg.expect_navigation(): pg.click('#boutonCarriereOui')
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "titre"', None, 30000)
    z = pg.evaluate("""() => { const d = JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)); return { ecran: JEU.ecran, url: location.search, ch: !d.championnat || (d.championnat.prochain === 0 && d.championnat.saison === 1 && !d.championnat.resultats.length), options: Object.keys(d.options).sort(), qualite: d.options.qualite,
      motifs: d.motifs, tutoriel: d.tutoriel, aides: d.aides, records: Object.keys(d.records).length, temple: d.temple.carrieres.length, decouverte: d.decouverteFaite, fantomes: Object.keys(d.fantomes).length }; }""")
    t(f'{titre} : après « Nouvelle carrière à 0 » : l’écran titre du premier lancement, la sauvegarde ne garde que le son et la qualité (aucune carrière jouée, motif, leçon, aide, record, temple ; le monde neuf du premier lancement)',
      z['ecran'] == 'titre' and z['ch'] and z['options'] == ['qualite', 'son_volumes'] and z['qualite'] == 'basse' and not z['motifs'] and not z['tutoriel'] and not z['aides']
      and z['records'] == 0 and z['temple'] == 0 and not z['decouverte'] and z['fantomes'] == 0, str(z))
    pg.click('#boutonJouer')
    t(f'{titre} : puis « ▶ Jouer » mène à la course de découverte', attendre(pg, '() => JEU.ecran === "course" && JEU.plateau && JEU.qualif === null && !!JEU.decouverte', None, 30000), str(pg.evaluate('() => [JEU.ecran, !!JEU.decouverte]')))

# le thème télé (tour 32, Codeur 3, style.css) : l'écran affiché a le voile en dégradé, son titre la police des titres (sauf la une,
# qui a sa police de journal), et son arrivée (une animation CSS) dure moins de 250 ms ; la cérémonie, sans voile, laisse voir le podium 3D
THEME_ETAT = """() => { const id = JEU.ecran === "album" ? "une" : JEU.ecran, el = document.getElementById(id); if (!el) return { id, ok: false };
  const st = getComputedStyle(el), h1 = el.querySelector("h1"), racine = getComputedStyle(document.documentElement);
  const titre = racine.getPropertyValue("--tv-police-titre").trim(), duree = parseFloat(st.animationDuration) * (st.animationDuration.endsWith("ms") ? 0.001 : 1);
  const police = !h1 || id === "une" || getComputedStyle(h1).fontFamily.replace(/\\s/g, "") === titre.replace(/\\s/g, "");
  const voile = id === "ceremonie" || st.backgroundImage.startsWith("linear-gradient");   // (la cérémonie laisse voir le podium 3D : pas de voile)
  return { id, voile, police, animation: st.animationName, duree, ok: voile && police && st.animationName === "tv-entree" && duree > 0 && duree < 0.25 }; }"""
# le paddock en écran d'accueil (tour 32, Codeur 3) : le prochain Grand Prix en grand (surtitre, titre, carte 2D dessinée, domicile
# seulement chez soi), ta place et l'écart au leader, les quatre groupes de boutons ; les points qui montent après une course (le
# texte ne change pas) ; les lignes des résultats qui arrivent une à une ; rien de tout ça avec prefers-reduced-motion
PADDOCK_ETAT = """() => { const $ = id => document.getElementById(id), ch = JEU.championnat, cv = $("paddockCarte"), d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
  let dessine = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) dessine++;
  const groupes = [...document.querySelectorAll("#paddockMenu .menuNom")].map(e => e.textContent);   // (tour 48a : le menu à gauche à la place des groupes de boutons)
  const cl = CHAMPIONNAT.classementPilotes(ch), k = ch.pilotes.findIndex(p => p.humain), i = cl.findIndex(x => x.k === k);
  const boites = ["paddockMenu", "paddockProchain", "paddockMoi", "paddockCourt", "boutonCourseSuivante"].map(id => { const r = $(id).getBoundingClientRect(); return [id, r.left, r.top, r.right, r.bottom]; });
  const cal = CHAMPIONNAT.calendrierSaison(ch)[ch.prochain];
  return { ecran: JEU.ecran, surtitre: $("paddockSurtitre").textContent, titre: $("championnatTitre").textContent, dessine, carte: !cv.classList.contains("cache"),
    domicile: !$("paddockDomicile").classList.contains("cache"), domicileAttendu: !!(cal && cal.domicile), place: $("paddockPlace").textContent,
    attendu: TEXTES[LANGUE].paddockPlace.replace("{p}", i + 1).replace("{n}", cl[i].points), groupes, boites, l: innerWidth, h: innerHeight,
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }"""
PADDOCK_DOMICILE = """() => { const j = JEU.championnat.pilotes.find(p => p.humain), avant = j.coeur, ici = circuitProchain(); j.coeur = ici; montrerChampionnat(null);
  const oui = !document.getElementById("paddockDomicile").classList.contains("cache"), texte = document.getElementById("paddockDomicileTexte").textContent;
  j.coeur = ici === "monoco" ? "monzo" : "monoco"; montrerChampionnat(null); const non = document.getElementById("paddockDomicile").classList.contains("cache"); j.coeur = avant; montrerChampionnat(null);
  return { oui, non, texte }; }"""
PADDOCK_POINTS = """() => { montrerChampionnat(25); const tb = document.getElementById("championnatTableaux"), pts = [...document.querySelectorAll("#championnatPilotes .points")];
  const cl = CHAMPIONNAT.classementPilotes(JEU.championnat), ok = pts.every((p, i) => p.textContent === accorder(cl[i].points + " " + texte("pts")) && p.style.getPropertyValue("--tv-fin") === String(cl[i].points));
  const anime = tb.classList.contains("tvMonte"), nom = getComputedStyle(pts[0], "::after").animationName, li = getComputedStyle(tb.querySelector("li")).animationName;
  montrerChampionnat(null); return { ok, anime, nom, li, sans: !tb.classList.contains("tvMonte") }; }"""
RESULTATS_ANIMES = """() => { INTERFACE.remplirResultats([1, 2, 3].map(i => ({ place: i, numero: i, couleur: 0xd8262e, total: 60 + i, penalites: 0, ecart: i - 1, grille: i, moi: i === 2 })));
  return [...document.querySelectorAll("#resultatsLignes tr")].map(x => [x.style.getPropertyValue("--i"), getComputedStyle(x).animationName, getComputedStyle(x).animationDelay]); }"""
SANS_MOUVEMENT = """() => { montrerChampionnat(25); const r = [getComputedStyle(document.getElementById("championnat")).animationName, getComputedStyle(document.querySelector("#championnatPilotes li")).animationName,
  getComputedStyle(document.querySelector("#championnatPilotes .points"), "::after").animationName, getComputedStyle(document.querySelector("#resultatsLignes tr")).animationName]; montrerChampionnat(null); return r; }"""
def paddock_ecran(pg, titre):
    pg.wait_for_timeout(300)
    p = pg.evaluate(PADDOCK_ETAT)
    t(f'{titre} : le paddock en écran d’accueil : « Next Grand Prix », le titre du Grand Prix, la carte du circuit dessinée, ta place et l’écart au leader, le menu à gauche (tour 48a)',
      p['ecran'] == 'championnat' and p['surtitre'] == 'Next Grand Prix' and p['titre'].startswith('Grand Prix ') and p['carte'] and p['dessine'] > 500
      and p['place'].startswith(p['attendu'] + ' · ') and p['groupes'] == ['Race', 'My team', 'Shop', 'Season', 'Messages', 'With friends', 'Settings', 'Learn'], str(p)[:900])
    dedans = all(b[1] >= 0 and b[2] >= 0 and b[3] <= p['l'] + 1 and b[4] <= p['h'] + 1 for b in p['boites'])
    t(f'{titre} : le paddock tient dans l’écran ({p["l"]}×{p["h"]}), sans défilement : le menu, le prochain Grand Prix, toi, le classement réduit, « Course suivante »', dedans and pas_de_defilement(p['defile']), str(p['boites']))
    t(f'{titre} : la maison du Grand Prix à domicile seulement si le prochain est chez toi', p['domicile'] == p['domicileAttendu'], str(p))
    d = pg.evaluate(PADDOCK_DOMICILE)
    t(f'{titre} : le prochain Grand Prix chez toi : « Your home Grand Prix » avec la maison ; ailleurs, rien', d['oui'] and d['non'] and d['texte'] == 'Your home Grand Prix', str(d))
    m = pg.evaluate(PADDOCK_POINTS)
    t(f'{titre} : après une course, les lignes du classement arrivent une à une et les points montent (animation CSS), le texte des points ne change pas ; sinon rien ne bouge',
      m['ok'] and m['anime'] and m['nom'] == 'tv-points' and m['li'] == 'tv-ligne' and m['sans'], str(m))
    r = pg.evaluate(RESULTATS_ANIMES)
    t(f'{titre} : les résultats animés : les lignes arrivent une à une (rang, délai croissant)', [x[0] for x in r] == ['0', '1', '2'] and all(x[1] == 'tv-ligne' for x in r) and r[0][2] != r[2][2], str(r))
    pg.emulate_media(reduced_motion='reduce')
    a = pg.evaluate(SANS_MOUVEMENT)
    pg.emulate_media(reduced_motion='no-preference')
    t(f'{titre} : avec prefers-reduced-motion, aucune animation (ni l’arrivée des écrans, ni les lignes, ni les points)', a == ['none'] * 4, str(a))

def audit_en(pg, titre, l):
    def verifier(nom, js=None):
        if js: pg.evaluate(js)
        pg.wait_for_timeout(300)   # (la fin de l'arrivée de l'écran, thème télé : < 250 ms)
        a = pg.evaluate(AUDIT_ETAT, FRANCAIS)
        t(f'{titre} : en anglais, l’écran « {nom} » ({a.get("id")}) : aucun mot français, rien hors de l’écran, sans défilement', not a.get('absent') and not a['francais'] and not a['hors'] and pas_de_defilement(a['defile']), str(a))
        th = pg.evaluate(THEME_ETAT)
        t(f'{titre} : l’écran « {nom} » ({th.get("id")}) a le thème télé (le voile, la police des titres, une arrivée de moins de 250 ms)', th.get('ok'), str(th))
        pg.screenshot(path=os.path.join(CAPTURES, nom + '-en' + ('' if l == 960 else '-' + str(l)) + '.png'))
    paddock_ecran(pg, titre)
    verifier('paddock')
    verifier('amis', '() => montrerAmis()'); pg.evaluate('() => montrerChampionnat(null)')
    verifier('garage', '() => montrerGarage()'); verifier('aileron', '() => montrerAileron()'); pg.evaluate('() => { quitterAileron(); quitterGarage(); }')
    verifier('sponsors', '() => montrerSponsors()'); pg.evaluate('() => quitterSponsors()')
    verifier('fiche', '() => montrerFiche(3)'); pg.evaluate('() => quitterFiche()')
    verifier('album', '() => montrerAlbum()'); pg.evaluate('() => quitterAlbum()')
    verifier('calendrier', '() => montrerCalendrier()'); pg.evaluate('() => quitterCalendrier()')
    verifier('arbre', '() => montrerArbre()'); pg.evaluate('() => quitterArbre()')
    verifier('interview', '''() => { const ch = JEU.championnat, o = [0, 1, 2, 3, 19].concat([...Array(20).keys()].filter(k => k > 3 && k < 19));
      const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true, chocMax: 0 })); JEU.lignesGP = lignes; montrerInterview(INTERVIEW.question(ch, lignes)); }''')
    verifier('une', '() => montrerUne(JEU.championnat.album[JEU.championnat.album.length - 1])')
    pg.evaluate('() => { JEU.lignesGP = null; SAISONS.avancer(JEU.championnat, 1); montrerFinSaison(); }')
    verifier('ceremonie'); pg.evaluate('() => suiteCeremonie()')
    verifier('saison'); pg.evaluate('() => suiteClassementSaison()')
    verifier('duel-saison'); pg.evaluate('() => suiteDuelSaison()')
    verifier('contrats')
    verifier('bilan', '() => prendreRetraite()')
    verifier('temple', '() => montrerTemple()'); pg.evaluate('() => quitterTemple()')
    verifier('arbre-bilan', '() => montrerArbre()'); pg.evaluate('() => quitterArbre()')
    verifier('releve', '() => montrerHeritier()')

# l'audit anglais, suite (tour 31) : le texte VISIBLE de toute la page (body.innerText : les écrans cachés n'y sont pas), mêmes mots témoins,
# rien hors de l'écran, pas de défilement ; une capture <nom>-en.png
AUDIT_PAGE = AUDIT_ETAT.replace('const id = JEU.ecran === "album" ? "une" : JEU.ecran, el = document.getElementById(id); if (!el) return { id, absent: true };', 'const id = JEU.ecran, el = document.body;')
def audit_autres(pg, titre, page, l, h):
    def verifier(nom, js=None, attente=None):
        if js: pg.evaluate(js)
        if attente: attendre(pg, attente, None, 60000)
        pg.wait_for_timeout(200)
        a = pg.evaluate(AUDIT_PAGE, FRANCAIS)
        t(f'{titre} : en anglais, « {nom} » ({a.get("id")}) : aucun mot français visible, rien hors de l’écran, sans défilement', not a['francais'] and not a['hors'] and pas_de_defilement(a['defile']), str(a))
        pg.screenshot(path=os.path.join(CAPTURES, nom + '-en.png'))
    def jusqu_au_podium():
        for _ in range(150):
            pg.evaluate('() => { if (JEU.attente && !JEU.attente.passer) passerAuPodium(); BOUCLE.simuler(5); }')
            if pg.evaluate('() => JEU.ecran') == 'podium': return True
            pg.wait_for_timeout(30)
        return False
    if 'audit-decouverte' in page:
        verifier('titre')
        pg.click('#boutonAmis'); verifier('amis')
        pg.click('#boutonAmisDeux'); verifier('deux-reglages')
        pg.click('#boutonDeuxRetour'); pg.click('#boutonAmisRetour')
        pg.click('#boutonJouer')
        pg.evaluate('() => { REGLAGES.PODIUM_DECOUVERTE_DUREE = 1e9; }')   # (les captures sous swiftshader : le passage tout seul est testé dans decouverte())
        verifier('decouverte-aides', None, '() => JEU.ecran === "course" && JEU.plateau && JEU.plateau.carte !== null && JEU.course.etat === "course"')
        t(f'{titre} : la course de découverte va jusqu’au podium', jusqu_au_podium())
        verifier('podium')
        pg.click('#boutonPodiumContinuer'); verifier('pilote', None, '() => JEU.ecran === "pilote"')   # (« Bravo ! » n'existe plus : le podium mène à la création, tour 52e)
        # du podium au paddock en DEUX clics : « Continuer », puis un pilote prêt ; le pilote est valide et sauvegardé, la découverte faite
        with pg.expect_navigation(timeout=120000): pg.click('#piloteCartes .piloteCarte >> nth=0', timeout=120000)
        t(f'{titre} : du podium au paddock en deux clics (Continuer, un pilote prêt) : un pilote valide (numéro libre, pays de la liste, course de cœur cohérente), la découverte faite',
          attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat', None, 60000)
          and pg.evaluate('() => { const j = PILOTE.joueur(JEU.championnat), s = PILOTE.joueur(SAUVEGARDE.championnat()); return !PILOTE.manque(JEU.championnat) && s.numero === j.numero && PILOTE.numeroLibre(JEU.championnat, j.numero) && REGLAGES.PAYS.includes(j.pays) && (PILOTE.domicile(j.pays) === null || PILOTE.domicile(j.pays) === j.coeur) && Object.keys(REGLAGES.CIRCUITS_PAYS).includes(j.coeur) && CASQUE.valide(j.casque) && SAUVEGARDE.decouverteFaite(); }'),
          str(pg.evaluate('() => [JEU.ecran, PILOTE.joueur(JEU.championnat)]')))
    elif 'audit-paddock' in page:
        attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
        for m in ['menuCourse', 'menuEquipe', 'menuBoutique', 'menuSaison', 'menuMessages'] + ([] if h < 500 else ['menuReglages']):   # (la page Réglages défile en 640×360 : c'est voulu)
            verifier('paddock-' + m, f'() => document.getElementById("{m}").click()')
        verifier('apprendre', '() => document.getElementById("boutonTutorielPaddock").click()')
        pg.evaluate('() => document.getElementById("boutonTutoRetour").click()')
        verifier('amis-paddock', '() => document.getElementById("boutonAmisPaddock").click()')
    elif 'audit-tournoi' in page:
        pg.click('#boutonAmis'); pg.click('#boutonAmisTournoi'); verifier('tournoi-inscription', None, '() => JEU.ecran === "tournoiInscription"')
        with pg.expect_navigation(): pg.click('#boutonTournoiPartir')
        verifier('tournoi-a-toi', None, '() => typeof JEU !== "undefined" && JEU.ecran === "tournoiAToi"')
        pg.evaluate('() => { JEU.robot = true; }')
        attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "tour"', None, 20000)
        pg.evaluate('() => BOUCLE.simuler(3)'); verifier('tournoi-tour')
        pg.keyboard.press('Escape'); verifier('tournoi-pause', None, '() => JEU.ecran === "tournoiPause"')
        pg.click('#boutonTournoiAbandon'); verifier('tournoi-manche', None, '() => JEU.ecran === "tournoiManche"')
        # les autres passages, joués d'avance (des temps fabriqués), jusqu'au podium puis au classement final
        verifier('tournoi-podium', '''() => { const t = JEU.tournoi; for (let k = 0; k < 40 && !TOURNOI.fini(t); k++) { const j = TOURNOI.joueurActuel(t);
          if (j === null) TOURNOI.mancheSuivante(t); else TOURNOI.enregistrer(t, j, { tour: 60 + j + k * 0.1, penalites: 0 }); } montrerPodiumTournoi(); }''')
        verifier('tournoi-fin', '() => montrerFinTournoi()')
    elif 'audit-deux' in page:
        verifier('deux-course', None, '() => JEU.ecran === "course" && JEU.plateau && JEU.plateau.carte !== null && JEU.course.etat === "course"')
    elif 'audit-resume' in page:
        pg.click('#boutonQualifPasser') if pg.evaluate('() => JEU.ecran === "qualif"') else None
        attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000); verifier('qualif-resultat')
        pg.click('#boutonQualifCourse')
        verifier('course', None, '() => JEU.ecran === "course" && JEU.plateau.carte !== null && JEU.course.etat === "course"')
        t(f'{titre} : la course va jusqu’au podium', jusqu_au_podium())
        pg.click('#boutonResultats'); verifier('resultats', None, '() => JEU.ecran === "resultats"')
        pg.click('#boutonResume'); verifier('resume', None, '() => JEU.ecran === "resume"')
    elif 'audit-stand' in page:
        attendre(pg, '() => JEU.ecran === "course" && JEU.course', None, 30000)
        pg.evaluate('() => { JEU.course.compte = 0.01; }'); pg.wait_for_timeout(300)
        verifier('stand-course', '() => { BOUCLE.simuler(3); JEU.joueur.pneus.usure = 0.5; JEU.joueur.versStands = true; BOUCLE.simuler(2); }')
        for _ in range(40):
            if pg.evaluate('() => !!JEU.course.arretEnCours'): break
            pg.evaluate('() => BOUCLE.simuler(1)')
        verifier('stand-arret')
    elif 'audit-consigne' in page:
        paddock_clic(pg, '#boutonCourseSuivante')
        attendre(pg, '() => JEU.ecran === "qualif" && JEU.qualif && JEU.qualif.etat === "choix"', None, 10000); verifier('qualif')
        pg.click('#boutonQualifPasser'); attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 180000)
        pg.click('#boutonQualifCourse')
        attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.etat === "course" && JEU.course.temps > 1', None, 180000)
        verifier('consigne', '''() => { const e = JEU.plateau, P = e.pilotes, j = P.findIndex(p => p.humain), kc = CHAMPIONNAT.coequipierDe(JEU.championnat).id;
          const c = { devant: j, derriere: kc, numero: P[kc].numero, debut: e.temps, joueur: true, refus: false, resultat: null };
          e.consigne = c; P[j].course.consigne = c; P[kc].course.consigne = c; }''', '() => document.getElementById("hudStand").textContent.length > 10')
    elif 'audit-volant' in page:
        verifier('cockpit', None, '() => JEU.ecran === "course"')

def une_ecran(pg, titre, capture, touche=False):
    ph = pg.evaluate(PHOTO_ETAT, None)
    t(f'{titre} : la photo de la une est dessinée par le code ({ph and ph["type"]}), visible, pas d’une seule couleur, la même que celle de la une compacte', bool(ph) and ph['couleurs'] > 8 and ph['pareil'] and ph['visible'], str(ph))
    if capture == 'une.png': pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(CAPTURES, 'une-photo.png'))
    u = pg.evaluate(UNE)
    t(f'{titre} : la une du journal : le nom du journal, le grand titre et le petit texte de la dernière une de l’album (fait « {u["fait"]} »), rendus avec les noms de l’affichage',
      u['ecran'] == 'une' and u['visible'] and u['nom'] == u['attenduNom'] and u['nom'] != '' and u['titre'] == u['attenduTitre'] and len(u['titre']) > 5 and u['texte'] == u['attenduTexte'] and len(u['texte']) > 10, str(u)[:600])
    t(f'{titre} : la une : 2 ou 3 brèves sur le côté, le classement (5 premiers + le joueur, le joueur marqué), la place de la photo vide, « clique ou appuie sur une touche »',
      u['breves'] == u['attenduBreves'] and 2 <= len(u['breves']) <= 3 and u['classement'] and len(u['classement']) == u['attenduClassement'] and 5 <= len(u['classement']) <= 6 and u['moi'] == 1
      and u['photo'] == '' and u['passer'] != '', str(u)[:600])
    t(f'{titre} : la une tient dans sa page (rien ne déborde, rien n’est coupé) et la page ne défile pas', all(u['dedans']) and not u['coupe'] and u['defile'][0] <= u['defile'][1] + 2 and u['defile'][2] <= u['defile'][3] + 2, str([u['dedans'], u['coupe'], u['defile']]))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, capture))
    if touche: pg.keyboard.press('Enter')
    else: pg.click('#uneTitre')
    t(f'{titre} : {"une touche" if touche else "un clic"} passe la une : l’écran du championnat', attendre(pg, '() => JEU.ecran === "championnat" && !document.getElementById("championnat").classList.contains("cache") && document.getElementById("une").classList.contains("cache")'), str(pg.evaluate('() => JEU.ecran')))
    return u

# ?championnat=1 : le garage (garage.js) depuis l'écran du championnat : on crédite de quoi acheter (en mémoire), on achète un niveau
# de moteur : le solde baisse du prix, le niveau monte, c'est sauvegardé ; capture garage.png ; « Retour » ramène au championnat
GARAGE_ETAT = '''() => { const ch = JEU.championnat, lis = [...document.querySelectorAll("#garageListe li")];
  return { ecran: JEU.ecran, visible: !document.getElementById("garage").classList.contains("cache"), n: lis.length, noms: lis.map(li => li.dataset.nom),
    actifs: lis.map(li => !li.querySelector("button").disabled), niveaux: lis.map(li => li.querySelector(".niveau").textContent), prix: lis.map(li => li.querySelector(".prix").textContent),
    solde: ch.argent.solde, soldeTexte: document.getElementById("garageSolde").textContent, bonus: document.getElementById("garageBonus").textContent, garage: Object.assign({}, ch.garage),
    sauve: SAUVEGARDE.championnat() && { garage: SAUVEGARDE.championnat().garage, solde: SAUVEGARDE.championnat().argent.solde },
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
# ?championnat=1 : les sponsors (sponsors.js) : au paddock « Pas encore de sponsor », le bouton « Sponsors » ouvre les offres (2 à 4),
# « Choisir » la première : le rappel au paddock, le montant crédité, sauvegardé ; la fiche d'un rival (fiche.js) au clic sur son nom
SPONSORS_ETAT = '''() => { const ch = JEU.championnat, lis = [...document.querySelectorAll("#sponsorsListe > li")], o = SPONSORS.offres(ch); return { ecran: JEU.ecran, n: lis.length, cles: lis.map(li => li.dataset.sponsor),
  offres: o.map(x => x.cle), boutons: lis.map(li => !!li.querySelector("button.choisir")), objectifs: lis.map(li => li.querySelectorAll(".objectifs li").length), montant0: o.length ? o[0].montant : 0,
  solde: ch.argent.solde, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def sponsors_ecran(pg, titre, capture):
    r0 = pg.evaluate('() => document.getElementById("championnatSponsor").textContent')
    t(f'{titre} : au paddock, « Pas encore de sponsor »', r0 == 'Pas encore de sponsor', r0)
    paddock_clic(pg, '#boutonSponsors')
    e = pg.evaluate(SPONSORS_ETAT)
    t(f'{titre} : « Sponsors » : les offres (2 à 4, celles de SPONSORS.offres, chacune avec ses objectifs et « Choisir »), sans défilement',
      e['ecran'] == 'sponsors' and 2 <= e['n'] <= 4 and e['cles'] == e['offres'] and all(e['boutons']) and all(x >= 1 for x in e['objectifs']) and pas_de_defilement(e['defile']), str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#sponsorsListe > li:first-child button.choisir')
    r = pg.evaluate("""() => { const ch = JEU.championnat; return { ecran: JEU.ecran, sponsor: ch.sponsor && ch.sponsor.cle, rappel: document.getElementById("championnatSponsor").textContent, solde: ch.argent.solde,
      sauve: SAUVEGARDE.championnat().sponsor && SAUVEGARDE.championnat().sponsor.cle, nom: ch.sponsor ? texte("sponsor_" + ch.sponsor.cle) : "" }; }""")
    t(f'{titre} : « Choisir » : retour au paddock avec le rappel « Sponsor : <nom> · objectifs », le montant crédité, sauvegardé',
      r['ecran'] == 'championnat' and r['sponsor'] == e['cles'][0] and r['rappel'].startswith('Sponsor : ' + r['nom']) and ' / ' in r['rappel'] and r['solde'] == e['solde'] + e['montant0'] and r['sauve'] == r['sponsor'], str(r))
    paddock_clic(pg, '#boutonSponsors')
    t(f'{titre} : « Sponsors » une fois signé : le sponsor et l’avancement de ses objectifs, sans bouton « Choisir » ; « Retour »',
      pg.evaluate('() => JEU.ecran === "sponsors" && document.querySelectorAll("#sponsorsListe > li").length === 1 && !document.querySelector("#sponsorsListe button.choisir") && /0 \\/ \\d/.test(document.getElementById("sponsorsListe").textContent)'),
      pg.evaluate('() => document.getElementById("sponsorsListe").textContent')[:200])
    pg.click('#boutonSponsorsRetour')
    t(f'{titre} : « Retour » ramène au paddock', attendre(pg, '() => JEU.ecran === "championnat"'))

FICHE_ETAT = '''k => { const ch = JEU.championnat, f = FICHE.fiche(ch, k), p = ch.pilotes[k], $ = id => document.getElementById(id).textContent; return { ecran: JEU.ecran, nom: $("ficheNom"), attenduNom: INTERFACE.nomPilote(p),
  infos: $("ficheInfos"), numero: p.numero, age: p.age, caractere: $("ficheCaractere"), mots: f.mots.map(m => texte("caractere_" + m)), saison: $("ficheSaison"), place: f.saison.place, points: f.saison.points, courses: f.saison.courses,
  historique: $("ficheHistorique"), duels: $("ficheDuels"), rivalite: $("ficheRivalite"), devant: f.duels.devant, derriere: f.duels.derriere, photo: document.getElementById("fichePhoto").getBoundingClientRect().width,
  defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def fiche_ecran(pg, titre, capture):
    paddock_clic(pg, '#championnatPilotes li[data-k="3"] .nom')
    f = pg.evaluate(FICHE_ETAT, 3)
    t(f'{titre} : un clic sur un rival ouvre sa fiche : nom, numéro, écurie, âge, caractère en mots, saison (place, points), historique, duels contre le joueur, la place de la photo, sans défilement',
      f['ecran'] == 'fiche' and f['nom'] == f['attenduNom'] and f['nom'] != '' and str(f['numero']) in f['infos'] and (str(f['age']) + ' ans') in f['infos'] and f['caractere'] == 'Caractère : ' + ', '.join(f['mots'])
      and (f['saison'].startswith(f'Cette saison : P{f["place"]} · {f["points"]} pts') if f['courses'] else f['saison'] == 'Cette saison : pas encore de course, pas encore de classement') and f['historique'].startswith('Carrière : ') and f['duels'] == f'Contre toi : devant {f["devant"]} fois, derrière {f["derriere"]} fois' and f['photo'] > 50 and f['rivalite'] == '' and pas_de_defilement(f['defile']), str(f))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    fp = pg.evaluate('''() => { const cv = document.querySelector("#fichePhoto canvas"); if (!cv) return null; const px = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data, c = new Set();
      for (let k = 0; k < px.length; k += 4 * 31) c.add(px[k] + "," + px[k + 1] + "," + px[k + 2]); const r = cv.getBoundingClientRect(); return { couleurs: c.size, visible: r.width > 40 && r.height > 40 }; }''')
    t(f'{titre} : la fiche du rival a sa photo stylisée (son casque, sa voiture aux couleurs de son écurie), dessinée par le code', bool(fp) and fp['couleurs'] > 8 and fp['visible'], str(fp))
    pg.click('#boutonFicheRetour')
    t(f'{titre} : « Retour » ramène au paddock ; un clic sur le joueur n’ouvre rien', attendre(pg, '() => JEU.ecran === "championnat"') and pg.evaluate('() => { const moi = document.querySelector("#championnatPilotes li.moi"); moi.click(); return JEU.ecran === "championnat" && !moi.dataset.k; }'))

# l'aileron (tour 29c) : depuis le garage, « 🪽 Aileron » : la carte de la prochaine course (dessinée), le curseur au milieu, les deux
# barres ; un cran choisi bouge les barres et l'aileron, il est gardé pour CE circuit et sauvegardé ; aucun conseil ; « Retour » : le garage
AILERON_ETAT = '''() => { const $ = id => document.getElementById(id), ch = JEU.championnat, nom = circuitProchain(), cv = $("aileronCarte"), px = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
  let clairs = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > 200 && px[i + 1] > 200 && px[i + 2] > 200) clairs++;
  return { ecran: JEU.ecran, titre: $("aileronTitre").textContent, nom, curseur: Number($("aileronCurseur").value), cran: $("aileronCran").textContent, virages: $("barreVirages").style.width, vitesse: $("barreVitesse").style.width,
    sauve: SAUVEGARDE.championnat().ailerons ? SAUVEGARDE.championnat().ailerons[nom] : undefined, clairs, texte: $("aileron").textContent,
    dans: [...document.querySelectorAll("#aileron > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def aileron_ecran(pg, titre, capture, cran):
    pg.click('#boutonAileron')
    a = pg.evaluate(AILERON_ETAT)
    t(f'{titre} : « 🪽 Aileron » : la carte de la prochaine course ({a["nom"]}) dessinée, le curseur au milieu (cran 3 / 5), les barres à 50 %, sans conseil, tout dans l’écran',
      a['ecran'] == 'aileron' and a['curseur'] == 2 and a['cran'] == 'Cran 3 / 5' and a['virages'] == '50%' and a['vitesse'] == '50%' and a['clairs'] > 300
      and not any(m in a['texte'].lower() for m in ('conseil', 'recommand', 'ingénieur')) and a['dans'] and pas_de_defilement(a['defile']), str(a))
    pg.evaluate(f'() => {{ const c = document.getElementById("aileronCurseur"); c.value = {cran}; c.dispatchEvent(new Event("input")); }}')
    b = pg.evaluate(AILERON_ETAT)
    t(f'{titre} : le cran {cran + 1} : les barres bougent (virages {b["virages"]}, vitesse {b["vitesse"]}), gardé pour {b["nom"]} et sauvegardé',
      b['curseur'] == cran and b['sauve'] == cran and b['virages'] == f'{cran * 25}%' and b['vitesse'] == f'{100 - cran * 25}%', str(b))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#boutonAileronRetour')
    t(f'{titre} : « Retour » ramène au garage', attendre(pg, '() => JEU.ecran === "garage"'), str(pg.evaluate('() => JEU.ecran')))

def garage_ecran(pg, titre, achat=True, capture='garage.png'):
    if achat: pg.evaluate('() => ARGENT.crediter(JEU.championnat, 200000, "test")')
    paddock_clic(pg, '#boutonGarage')
    e = pg.evaluate(GARAGE_ETAT)
    t(f'{titre} : « Garage » ouvre le garage : 4 améliorations (roues, moteur, aero, freins) au niveau 0, leur prix, le solde, le bonus de la voiture, sans défilement',
      e['ecran'] == 'garage' and e['visible'] and e['noms'] == ['roues', 'moteur', 'aero', 'freins'] and all('0 / 5' in n for n in e['niveaux']) and e['soldeTexte'] == 'Solde : ' + pg.evaluate('() => ARGENT.formater(JEU.championnat.argent.solde)')
      and e['bonus'] == 'Voiture de l’écurie : ' + str(pg.evaluate('() => Math.round(JEU.championnat.ecuries[JEU.championnat.pilotes[19].ecurie].niveau * 100)')) + ' / 100 · tes améliorations : +0,0 % / 7 % maxi' and e['defile'][0] <= e['defile'][1] + 2 and e['defile'][2] <= e['defile'][3] + 2, str(e))
    # les pneus du départ (la météo, Codeur 1) : quatre choix sous les améliorations, « Au choix de l’équipe » d'abord ; un clic choisit et sauvegarde
    pn = pg.evaluate('() => { const b = [...document.querySelectorAll("#garagePneus button")]; return { n: b.length, choisi: b.filter(x => x.classList.contains("choisi")).map(x => x.dataset.pneu), titre: (document.querySelector("#garagePneus .titre") || {}).textContent || "" }; }')
    pg.click('#garagePneus button[data-pneu="pluie"]')
    apres = pg.evaluate('() => [JEU.championnat.pneusDepart, SAUVEGARDE.championnat().pneusDepart, [...document.querySelectorAll("#garagePneus button.choisi")].map(x => x.dataset.pneu)]')
    pg.click('#garagePneus button[data-pneu="equipe"]')
    retour = pg.evaluate('() => JEU.championnat.pneusDepart')
    # (tour 48b) le drift caché : ni bouton ni texte « Drift » au garage
    t(f'{titre} : au garage, les pneus du départ : « Au choix de l’équipe » par défaut (l’adhérant), slicks, intermédiaires, pluie (le drift caché : aucun bouton ni texte drift) ; « Pluie » choisi et sauvegardé, puis de nouveau l’équipe', pn['n'] == 4 and pg.evaluate('() => !/drift/i.test(document.getElementById("garage").innerText)') and pn['choisi'] == ['equipe'] and pn['titre'].startswith('Pneus au départ') and apres == ['pluie', 'pluie', ['pluie']] and retour is None, str([pn, apres, retour]))
    if not achat:
        t(f'{titre} : sans argent, tous les boutons « Acheter » sont grisés', not any(e['actifs']), str(e['actifs']))
    else:
        t(f'{titre} : avec de l’argent, « Acheter » est actif', all(e['actifs']), str(e['actifs']))
        prix = pg.evaluate('() => GARAGE.prix(JEU.championnat, "moteur")')   # (tour 49d-2 : le prix de la division, × DIVISIONS[d].garage)
        pg.click('#garageListe li[data-nom="moteur"] button')
        e2 = pg.evaluate(GARAGE_ETAT)
        t(f'{titre} : acheter le moteur : le solde baisse du prix ({prix}), le niveau passe à 1 / 5, le prix suivant s’affiche, le bonus monte, et c’est sauvegardé',
          e2['solde'] == e['solde'] - prix and e2['garage']['moteur'] == 1 and '1 / 5' in e2['niveaux'][1] and e2['prix'][1] != e['prix'][1] and 'tes améliorations : +0,5 %' in e2['bonus']
          and e2['sauve'] and e2['sauve']['garage']['moteur'] == 1 and e2['sauve']['solde'] == e2['solde'], str(e2))
    pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(CAPTURES, capture))
    aileron_ecran(pg, titre, 'aileron.png' if capture == 'garage.png' else 'aileron-960.png', 4 if capture == 'garage.png' else 0)
    pg.click('#boutonGarageRetour')
    t(f'{titre} : « Retour » ramène à l’écran du championnat, avec le solde à jour', attendre(pg, '() => JEU.ecran === "championnat" && document.getElementById("garage").classList.contains("cache")')
      and pg.evaluate('() => document.getElementById("championnatArgent").textContent === "Solde : " + ARGENT.formater(JEU.championnat.argent.solde)'), str(pg.evaluate('() => [JEU.ecran, document.getElementById("championnatArgent").textContent]')))

# ?championnat=1&gp=12 : un championnat neuf arrive au 12e Grand Prix (les 11 premiers joués d'avance par SAISONS.avancer) ; après le
# 12e : le classement final et le champion, le duel de la saison, les contrats, la signature → saison 2 ; en 960 : le 12e est fabriqué,
# les écrans tiennent, et « Prendre ma retraite » (deux clics) mène à « Carrière terminée »
SAISON_ETAT = '''() => { const ch = JEU.championnat, $ = id => document.getElementById(id), b = SAISONS.bilan(ch); return { ecran: JEU.ecran, saison: ch.saison, prochain: ch.prochain,
  titre: $("saisonTitre").textContent, champion: $("saisonChampion").textContent, ecurie: $("saisonEcurie").textContent, lignes: document.querySelectorAll("#saisonPilotes li").length,
  moi: document.querySelectorAll("#saisonPilotes li.moi").length, premier: document.querySelector("#saisonPilotes li.champion .nom").textContent, attenduChampion: INTERFACE.nomPilote(ch.pilotes[b.champion]), humain: ch.pilotes[b.champion].humain,
  saisons: ch.saisons.length, sauve: SAUVEGARDE.championnat() ? SAUVEGARDE.championnat().saisons.length : -1, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
DUEL_SAISON_ETAT = '''() => { const ch = JEU.championnat, s = CHAMPIONNAT.scoreDuel(ch), nom = INTERFACE.nomPilote(ch.pilotes[s.k]), a = s.total[0], b = s.total[1];
  return { ecran: JEU.ecran, score: document.getElementById("duelSaisonScore").textContent, detail: document.getElementById("duelSaisonDetail").textContent, nom, a, b,
    defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
CONTRATS_ETAT = '''() => { const ch = JEU.championnat, o = SAISONS.offres(ch), lis = [...document.querySelectorAll("#contratsListe li")]; return { ecran: JEU.ecran, note: SAISONS.note(ch),
  texteNote: document.getElementById("contratsNote").textContent, n: lis.length, offres: o.map(x => x.ecurie), ecuries: lis.map(li => Number(li.dataset.ecurie)), actuelle: ch.pilotes[19].ecurie,
  bouton: document.getElementById("boutonRetraite").textContent, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
RETRAITE_ETAT = '''() => { const ch = JEU.championnat; return { ecran: JEU.ecran, retraite: ch.retraite, bilan: document.getElementById("retraiteBilan").textContent, raison: document.getElementById("retraiteRaison").textContent,
  sauve: SAUVEGARDE.championnat().retraite && SAUVEGARDE.championnat().retraite.raison, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
SAISON2_ETAT = '''() => { const ch = JEU.championnat, j = ch.pilotes[19]; return { ecran: JEU.ecran, saison: ch.saison, prochain: ch.prochain, ecurie: j.ecurie, titre: document.getElementById("championnatTitre").textContent,
  garage: JSON.stringify(ch.garage), solde: ch.argent.solde, coequipier: CHAMPIONNAT.coequipierDe(ch).id, duel: CHAMPIONNAT.scoreDuel(ch).total, deux: ch.ecuries.every(e => ch.pilotes.filter(p => p.ecurie === e.id).length === 2),
  sauve: SAUVEGARDE.championnat().saison, contrats: ch.contrats, gagne: document.getElementById("championnatGagne").textContent, pilotesLi: document.querySelectorAll("#championnatPilotes li").length, zero: ch.pilotes.every(p => p.stats.points === 0) }; }'''
def pas_de_defilement(d): return d[0] <= d[1] + 2 and d[2] <= d[3] + 2
# la cérémonie du champion (tour 28c) : l'écran, le podium 3D (le champion seul en haut), les confettis (un seul appel de dessin), Poki arrêté
CEREMONIE_ETAT = '''() => { const ch = JEU.championnat, $ = id => document.getElementById(id), b = SAISONS.bilan(ch), c = PODIUM3D.confettis;
  SCENE3D.dessiner(); const avec = SCENE3D.appelsDessin, vus = c && c.visible;
  if (c) { c.visible = false; SCENE3D.dessiner(); c.visible = vus; }
  const sans = SCENE3D.appelsDessin; SCENE3D.dessiner();
  return { ecran: JEU.ecran, titre: $("ceremonieTitre").textContent, nom: $("ceremonieNom").textContent, detail: $("ceremonieDetail").textContent, court: $("ceremonie").classList.contains("court"),
    champion: INTERFACE.nomPilote(ch.pilotes[b.champion]), humain: !!ch.pilotes[b.champion].humain, visibles: JEU.modeles.filter(m => m.groupe.visible).length, championVisible: !!(JEU.modeles[b.champion] && JEU.modeles[b.champion].groupe.visible),
    hauteur: JEU.modeles[b.champion] ? JEU.modeles[b.champion].groupe.position.y : null, marche: REGLAGES.PODIUM_HAUTEURS[0], confettis: !!vus, n: c ? c.geometry.attributes.position.count : 0, appels: [avec, sans],
    y0: c ? c.geometry.attributes.position.array[1] : null, enJeu: SDK.enJeu, vue: ch.saisons[ch.saisons.length - 1].ceremonie, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
# un championnat fabriqué cohérent où le joueur (19) est champion : n Grands Prix joués d'avance avec de vraies places (il gagne un
# Grand Prix sur deux, il est 2e sinon, derrière le pilote 0 puis le 1) ; les points, victoires, album et argent en découlent ; il
# remplace le championnat de la page (le même objet) et il est sauvegardé
FABRIQUER_CHAMPION = '''n => { const ch = CHAMPIONNAT.creer(JEU.championnat.graine); ch.pilotes[19].casque = JEU.championnat.pilotes[19].casque; ch.pilotes[19].nom = 'Marco Rossi'; ch.pilotes[19].pays = 'it'; ch.pilotes[19].coeur = 'monzo'; CASQUE.completer(ch); CARRIERE.completer(ch);
  for (let g = 0; g < n; g++) { const tete = g % 2 ? [19, 0] : [g % 4 ? 1 : 0, 19], o = tete.concat([...Array(20).keys()].filter(k => !tete.includes(k)));
    const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true }));
    CHAMPIONNAT.enregistrerCourse(ch, lignes); JOURNAL.ranger(ch, JOURNAL.composer(ch, lignes)); ARGENT.encaisser(ch, lignes); }
  for (const k of Object.keys(JEU.championnat)) delete JEU.championnat[k];
  Object.assign(JEU.championnat, ch); SAUVEGARDE.ecrireChampionnat(JEU.championnat); }'''
def ceremonie_ecran(pg, titre, toi, capture):
    e = pg.evaluate(CEREMONIE_ETAT)
    t(f'{titre} : la cérémonie de fin de saison, avant le classement final : le champion seul sur la plus haute marche du podium 3D, Poki arrêté (gameplayStop), sans défilement',
      e['ecran'] == 'ceremonie' and e['humain'] == toi and e['visibles'] == 1 and e['championVisible'] and abs(e['hauteur'] - e['marche']) < 1e-6 and not e['enJeu'] and e['vue'] == 1 and pas_de_defilement(e['defile']), str(e))
    if toi:
        t(f'{titre} : le joueur champion : « CHAMPION DU MONDE », son nom, ses points ; {e["n"]} confettis faits par le code en UN seul appel de dessin ({e["appels"][0]} appels avec, {e["appels"][1]} sans)',
          e['titre'] == 'CHAMPION DU MONDE' and e['nom'] == e['champion'] and 'points' in e['detail'] and not e['court'] and e['confettis'] and e['n'] == pg.evaluate('() => REGLAGES.CEREMONIE_CONFETTIS') and e['appels'][0] - e['appels'][1] == 1, str(e))
        pg.wait_for_timeout(400)
        t(f'{titre} : les confettis tombent', pg.evaluate('() => PODIUM3D.confettis.geometry.attributes.position.array[1]') != e['y0'])
    else:
        t(f'{titre} : un rival champion : l’écran court « {e["champion"]} est champion du monde », sans confettis, la place du joueur', e['court'] and e['titre'] == e['champion'] + ' est champion du monde' and e['nom'] == '' and not e['confettis'] and 'tu finis P' in e['detail'] and e['appels'][0] == e['appels'][1], str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, capture))
    pg.click('#boutonCeremonieSuite')

# le bilan de carrière et le temple de la renommée (tour 28c, carriere.js) : après la retraite, le bilan (9 cases, les duels, la une
# préférée, la place au temple) tient dans l'écran ; « Temple de la renommée » : la carrière y est (marquée), les records ; « Retour »
BILAN_ETAT = '''() => { const ch = JEU.championnat, b = CARRIERE.bilan(ch), $ = id => document.getElementById(id), u = b.une === null ? null : JOURNAL.rendreAlbum(ch, b.une, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie });
  return { ecran: JEU.ecran, cases: [...document.querySelectorAll("#bilanStats li")].map(li => [li.children[0].textContent, li.children[1].textContent]), b: { saisons: b.saisons, titres: b.titres, victoires: b.victoires, podiums: b.podiums },
    duels: $("bilanDuels").textContent, une: $("bilanUne").textContent, attenduUne: u ? u.titre : null, temple: $("bilanTemple").textContent, bouton: $("boutonTemple").textContent,
    dans: [...document.querySelectorAll("#retraite > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
    sauve: SAUVEGARDE.temple().carrieres.length, defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] }; }'''
def bilan_temple(pg, titre):
    e = pg.evaluate(BILAN_ETAT)
    vals = dict(e['cases'])
    t(f'{titre} : le bilan de carrière : 9 cases (saisons, titres, victoires, podiums…) justes, les duels contre les coéquipiers, la une préférée (redessinée), la place au temple, tout dans l’écran',
      e['ecran'] == 'retraite' and len(e['cases']) == 9 and vals.get('Saisons') == str(e['b']['saisons']) and vals.get('Titres') == str(e['b']['titres']) and vals.get('Victoires') == str(e['b']['victoires'])
      and vals.get('Podiums') == str(e['b']['podiums']) and e['duels'].startswith('Duels contre les coéquipiers : ') and (e['attenduUne'] is None or e['attenduUne'] in e['une'])
      and pg.evaluate('() => !!document.querySelector("#retraiteTitre canvas#bilanCasque")') and e['temple'] == 'Temple de la renommée : 1 sur 1' and e['sauve'] == 1 and e['bouton'] == '🏛 Temple de la renommée' and e['dans'] and pas_de_defilement(e['defile']), str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'bilan.png'))
    pg.click('#boutonTemple')
    tp = pg.evaluate('''() => ({ ecran: JEU.ecran, lignes: [...document.querySelectorAll("#templeListe li")].map(li => li.textContent), moi: document.querySelectorAll("#templeListe li.moi").length,
      records: [...document.querySelectorAll("#templeRecords li")].map(li => li.textContent), nom: INTERFACE.nomPilote(JEU.championnat.pilotes[19]),
      defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })''')
    t(f'{titre} : le temple de la renommée : la carrière finie en 1re place, marquée, avec ses titres et victoires ; les records de carrière à son nom',
      tp['ecran'] == 'temple' and len(tp['lignes']) == 1 and tp['moi'] == 1 and tp['lignes'][0].startswith('1' + tp['nom']) and 'victoire' in tp['lignes'][0] and len(tp['records']) >= 6 and all(tp['nom'] in r for r in tp['records']) and pas_de_defilement(tp['defile']), str(tp))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'temple.png'))
    pg.click('#boutonTempleRetour')
    t(f'{titre} : « Retour » ramène au bilan ; rechargée, la page revient au bilan sans entrer deux fois au temple', pg.evaluate('() => JEU.ecran') == 'retraite')
    pg.reload()
    t(f'{titre} : (rechargement) le bilan, le temple toujours à 1 carrière', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "retraite" && SAUVEGARDE.temple().carrieres.length === 1', None, 60000), str(pg.evaluate('() => typeof JEU !== "undefined" && [JEU.ecran, SAUVEGARDE.temple().carrieres.length]')))

# la relève (tour 28c) : depuis le bilan, « Continuer la dynastie » : l'écran de l'héritier (le parent nommé, le nom de famille gardé,
# les quatre liens, le motif aux couleurs du parent, l'arbre) ; Léa, « fille », n° libre → le paddock de la saison 2, le même monde ;
# le premier Grand Prix (joué d'avance) : la une « La fille de Marco Rossi débarque »
def releve(pg, titre):
    t(f'{titre} : le bilan propose « 👪 Continuer la dynastie » et « ✨ Nouvelle dynastie » ; les records de famille', pg.evaluate('() => document.getElementById("boutonContinuerDynastie").textContent === "👪 Continuer la dynastie" && document.getElementById("boutonNouvelleDynastie").textContent === "✨ Nouvelle dynastie" && document.getElementById("bilanFamille").textContent.startsWith("Records de famille : 1 génération")'), pg.evaluate('() => document.getElementById("bilanFamille").textContent'))
    avant = pg.evaluate('() => ({ ecuries: JEU.championnat.ecuries.map(e => e.couleur), rivaux: JEU.championnat.pilotes.filter(p => !p.humain).map(p => p.id + ":" + p.numero), saison: JEU.championnat.saison, casque: JSON.stringify(JEU.championnat.pilotes[19].casque) })')
    pg.click('#boutonContinuerDynastie')
    h = pg.evaluate('''() => ({ ecran: JEU.ecran, parent: document.getElementById("heritierParent").textContent, famille: document.getElementById("heritierFamille").textContent,
      liens: [...document.querySelectorAll("#heritierLien option")].map(o => o.textContent), motif: document.getElementById("heritierMotif").value, attenduMotif: JEU.championnat.pilotes[19].casque.motif,
      pays: document.getElementById("heritierPays").value, arbre: document.querySelectorAll("#arbreListe li").length,
      dans: [...document.querySelectorAll("#heritier > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
      defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })''')
    t(f'{titre} : l’écran de l’héritier : « Prendre la suite de Marco Rossi », le nom de famille Rossi, les 4 liens accordés, le motif et le pays du parent, l’arbre, tout dans l’écran',
      h['ecran'] == 'heritier' and h['parent'] == 'Prendre la suite de Marco Rossi' and h['famille'] == 'Nom de famille : Rossi' and h['liens'] == ['fils de Marco Rossi', 'fille de Marco Rossi', 'protégé de Marco Rossi', 'protégée de Marco Rossi']
      and h['motif'] == h['attenduMotif'] and h['pays'] == 'it' and h['arbre'] == 1 and h['dans'] and pas_de_defilement(h['defile']), str(h))
    mo = pg.evaluate('() => ({ options: [...document.querySelectorAll("#heritierMotif option")].map(o => [o.value, o.disabled]), tous: CASQUE.tousLesMotifs(), debloques: SAUVEGARDE.motifs() })')
    t(f'{titre} : l’éditeur de l’héritier propose tous les motifs, les débloqués permis, les autres grisés avec leur condition', [o[0] for o in mo['options']] == mo['tous'] and all(o[1] == (o[0] not in pg.evaluate('() => REGLAGES.CASQUE_MOTIFS') and o[0] not in mo['debloques']) for o in mo['options']), str(mo))
    pg.click('#boutonHeritierValider')
    t(f'{titre} : sans prénom, l’héritier est refusé (message)', pg.evaluate('() => JEU.ecran === "heritier" && document.getElementById("heritierErreur").textContent !== ""'))
    pg.fill('#heritierPrenom', 'Léa'); pg.select_option('#heritierLien', 'fille')
    t(f'{titre} : le message d’erreur part dès que le prénom est corrigé', pg.evaluate('() => document.getElementById("heritierErreur").textContent === ""'))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'releve.png'))
    pg.click('#boutonHeritierValider')
    s = pg.evaluate('''() => { const ch = JEU.championnat, j = ch.pilotes[19], faible = ch.ecuries.slice().sort((a, b) => a.niveau - b.niveau || b.id - a.id)[0].id;
      return { ecran: JEU.ecran, saison: ch.saison, prochain: ch.prochain, nom: j.nom, ecurie: j.ecurie, faible, garage: Object.values(ch.garage).every(x => x === 0), solde: ch.argent.solde, stats: j.stats.courses + j.stats.victoires,
        gens: ch.dynastie.generations.length, lien: ch.dynastie.lien, couleurs: JSON.stringify(j.casque.couleurs), sauve: SAUVEGARDE.championnat().saison, retraite: ch.retraite,
        ecuries: ch.ecuries.map(e => e.couleur), titre: document.getElementById("championnatTitre").textContent }; }''')
    t(f'{titre} : « C’est parti ! » : Léa Rossi, la fille, au paddock de la saison {avant["saison"] + 1} (Grand Prix 1), le même monde (les mêmes écuries), dans la plus petite écurie, sans garage ni argent, sauvegardé',
      s['ecran'] == 'championnat' and s['saison'] == avant['saison'] + 1 and s['prochain'] == 0 and s['nom'] == 'Léa Rossi' and s['ecurie'] == s['faible'] and s['garage'] and s['solde'] == 0 and s['stats'] == 0
      and s['gens'] == 1 and s['lien'] == 'fille' and s['couleurs'] == json_couleurs(avant['casque']) and s['sauve'] == s['saison'] and s['retraite'] is None and s['ecuries'] == avant['ecuries'] and s['titre'].startswith('Grand Prix 1 / 12'), str(s))
    # l'arbre de la dynastie au paddock (tour 29c) : les deux générations, Léa en piste, les records de famille ; « Retour »
    paddock_clic(pg, '#boutonArbre')
    ar = pg.evaluate('''() => ({ ecran: JEU.ecran, lignes: [...document.querySelectorAll("#arbreGenerations li")].map(li => li.textContent), actuel: document.querySelectorAll("#arbreGenerations li.actuel").length,
      casques: document.querySelectorAll("#arbreGenerations canvas").length, famille: document.getElementById("arbreFamille").textContent, circuits: document.getElementById("arbreCircuits").textContent,
      dans: [...document.querySelectorAll("#arbre > *")].every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }),
      defile: [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth] })''')
    t(f'{titre} : « 🌳 Arbre de la dynastie » au paddock : Marco Rossi puis Léa Rossi (en piste), leurs casques, les records de famille (2 générations), tout dans l’écran',
      ar['ecran'] == 'arbre' and len(ar['lignes']) == 2 and 'Marco Rossi' in ar['lignes'][0] and 'Léa Rossi' in ar['lignes'][1] and 'en piste' in ar['lignes'][1] and ar['actuel'] == 1 and ar['casques'] == 2
      and ar['famille'].startswith('Records de famille : 2 générations') and ar['circuits'].startswith('Victoires de la famille par circuit') and ar['dans'] and pas_de_defilement(ar['defile']), str(ar))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'arbre.png'))
    pg.click('#boutonArbreRetour')
    t(f'{titre} : « Retour » : le paddock', attendre(pg, '() => JEU.ecran === "championnat"'), str(pg.evaluate('() => JEU.ecran')))
    pg.evaluate('() => { SAISONS.avancer(JEU.championnat, 1); montrerUne(JEU.championnat.album[JEU.championnat.album.length - 1]); }')
    u = pg.evaluate('() => ({ f: JEU.championnat.album[JEU.championnat.album.length - 1].f, titre: document.getElementById("uneTitre").textContent })')
    t(f'{titre} : le premier Grand Prix de l’héritière : la une de la relève (« {u["titre"]} »), accordée au lien, le parent nommé', u['f'] == 'releve_fille' and 'Marco Rossi' in u['titre'] and ('fille' in u['titre']), str(u))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'releve-une.png'))

def json_couleurs(casque):
    import json
    return json.dumps(json.loads(casque)['couleurs'], separators=(',', ':'))

def fin_saison(pg, titre, l):
    t(f'{titre} : ?gp=12 : un championnat neuf arrive au Grand Prix 12 / 12, les 11 premiers joués d’avance (résultats, album, argent)',
      pg.evaluate('() => JEU.ecran === "championnat" && JEU.championnat.prochain === 11 && JEU.championnat.resultats.length === 11 && JEU.championnat.album.length === 11 && JEU.championnat.argent.solde > 0 && document.getElementById("championnatTitre").textContent.startsWith("Grand Prix 12 / 12")'),
      str(pg.evaluate('() => [JEU.ecran, JEU.championnat.prochain, document.getElementById("championnatTitre").textContent]')))
    if l != 1280:
        # en petit : le 12e Grand Prix fabriqué en mémoire, puis les écrans ; à la fin, la retraite anticipée
        pg.evaluate('() => { SAISONS.avancer(JEU.championnat, 1); montrerFinSaison(); }')
        # la cérémonie : d'abord l'écran court d'un rival champion (le robot n'a pas joué : un rival a le titre) ...
        rival = pg.evaluate('() => !JEU.championnat.pilotes[SAISONS.bilan(JEU.championnat).champion].humain')
        t(f'{titre} : le 12e fabriqué : un rival est champion', rival)
        ceremonie_ecran(pg, titre, False, 'ceremonie-rival-960.png')
        # ... puis la vraie cérémonie : un championnat fabriqué cohérent (12 Grands Prix, le joueur en gagne 6 et finit 2e des 6 autres : 258 points)
        pg.evaluate(f'() => {{ ({FABRIQUER_CHAMPION})(12); montrerFinSaison(); }}')
        e = pg.evaluate(CEREMONIE_ETAT)
        t(f'{titre} : la cérémonie du joueur champion tient en 960×600 : « CHAMPION DU MONDE », son nom, « 258 points · 6 victoires », les confettis (un appel de dessin)', e['ecran'] == 'ceremonie' and e['titre'] == 'CHAMPION DU MONDE' and e['nom'] == pg.evaluate('() => INTERFACE.nomPilote(JEU.championnat.pilotes[19])') and e['detail'].startswith('258 points · 6 victoires') and e['confettis'] and e['appels'][0] - e['appels'][1] == 1 and pas_de_defilement(e['defile']), str(e))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'ceremonie-960.png'))
        pg.click('#boutonCeremonieSuite')
        e = pg.evaluate(SAISON_ETAT)
        t(f'{titre} : le classement final de la saison tient en 960×600 (20 lignes, le champion en tête, le joueur marqué)', e['ecran'] == 'saison' and e['lignes'] == 20 and e['moi'] == 1 and e['premier'] == e['attenduChampion'] and pas_de_defilement(e['defile']), str(e))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'champion-960.png'))
        pg.click('#boutonSaisonSuite')
        d = pg.evaluate(DUEL_SAISON_ETAT)
        t(f'{titre} : le duel de la saison tient en 960×600', d['ecran'] == 'duelSaison' and d['nom'] in d['score'] and pas_de_defilement(d['defile']), str(d))
        pg.click('#boutonDuelSaisonSuite')
        c = pg.evaluate(CONTRATS_ETAT)
        t(f'{titre} : les contrats tiennent en 960×600, au moins une offre', c['ecran'] == 'contrats' and c['n'] >= 1 and c['n'] == len(c['offres']) and pas_de_defilement(c['defile']), str(c))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'contrats-960.png'))
        pg.click('#boutonRetraite')
        t(f'{titre} : « Prendre ma retraite » demande d’abord une confirmation', pg.evaluate('() => JEU.ecran === "contrats" && document.getElementById("boutonRetraite").textContent === texte("retraiteConfirmer")'), pg.evaluate('() => document.getElementById("boutonRetraite").textContent'))
        pg.click('#boutonRetraite')
        r = pg.evaluate(RETRAITE_ETAT)
        t(f'{titre} : le second clic : « Carrière terminée », le bilan (1 saison), sauvegardé', r['ecran'] == 'retraite' and r['retraite'] and r['retraite']['raison'] == 'choix' and r['sauve'] == 'choix' and r['bilan'].startswith('1 saison') and r['raison'] != '' and pas_de_defilement(r['defile']), str(r))
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'retraite-960.png'))
        bilan_temple(pg, titre)
        releve(pg, titre)
        return
    # le joueur champion : les 11 premiers Grands Prix refaits avec de vraies places (il en gagne 5 et finit 2e des 6 autres : 233 points,
    # le titre est à lui avant le 12e) ; puis la une spéciale « CHAMPION ! » et la cérémonie, avec ses vrais points et ses vraies victoires
    pg.evaluate(f'() => {{ ({FABRIQUER_CHAMPION})(11); montrerChampionnat(null); }}')
    calendrier_ecran(pg, titre, 'calendrier.png')   # (11 Grands Prix faits, le 12e est le prochain)
    paddock_clic(pg, '#boutonCourseSuivante')
    passer_qualif(pg, titre)
    t(f'{titre} : le 12e Grand Prix part (circuit du calendrier, 20 voitures)', attendre(pg, '() => JEU.ecran === "course" && JEU.plateau && JEU.plateau.pilotes.length === 20', None, 10000))
    attendre(pg, '() => JEU.plateau.carte !== null', None, 180000)
    for _ in range(80):
        pg.evaluate('() => BOUCLE.simuler(5)')
        if pg.evaluate('() => JEU.ecran') == 'podium': break
        pg.wait_for_timeout(50)
    t(f'{titre} : la course va jusqu’au podium', pg.evaluate('() => JEU.ecran === "podium"'), str(pg.evaluate('() => [JEU.ecran, JEU.plateau.arrives]')))
    pg.click('#boutonResultats'); attendre(pg, '() => JEU.ecran === "resultats"')
    pg.click('#boutonChangerResultats')
    interview_ecran(pg, titre, None, gp='12e : ')
    t(f'{titre} : « Continuer » : le 12e enregistré (la saison est finie), la une du journal', attendre(pg, '() => JEU.ecran === "une" && JEU.championnat.prochain === 12 && SAISONS.finie(JEU.championnat)'), str(pg.evaluate('() => [JEU.ecran, JEU.championnat.prochain]')))
    # la rumeur de transfert (tour 27c) : au 12e Grand Prix, la première brève de la une est une rumeur (vraie ou fausse), rendue avec un nom de pilote et d'écurie
    ru = pg.evaluate('''() => { const u = JEU.championnat.album[JEU.championnat.album.length - 1], r = JOURNAL.rendre(u, JEU.championnat, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie }), li = document.querySelector("#uneBreves li");
      return { cle: u.b[0][0], vraie: u.b[0][2].vraie, texte: li ? li.textContent : null, attendu: r.breves[0], intentions: JEU.championnat.transferts.liste.length }; }''')
    t(f'{titre} : la une du 12e porte une rumeur de transfert en première brève ({"vraie" if ru["vraie"] else "fausse"}), avec un pilote et une écurie nommés', ru['cle'] == 'breveRumeur' and ru['texte'] == ru['attendu'] and '{' not in (ru['texte'] or '{') and ru['intentions'] >= 1, str(ru))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'une-rumeur.png'))
    sp = pg.evaluate('() => ({ classe: document.getElementById("unePage").classList.contains("speciale"), titre: document.getElementById("uneTitre").textContent, f: JEU.championnat.album[JEU.championnat.album.length - 1].f })')
    t(f'{titre} : le joueur champion : la une du 12e est la une spéciale « CHAMPION ! »', sp['classe'] and sp['f'] == 'titreChampion' and sp['titre'].startswith('CHAMPION !'), str(sp))
    pg.click('#uneTitre')
    vrai = pg.evaluate('() => { const j = JEU.championnat.pilotes[19]; return { points: j.stats.points, v: j.places.filter(x => x === 1).length, n: j.places.length }; }')
    t(f'{titre} : la saison du champion est cohérente : 12 Grands Prix, {vrai["v"]} victoires, {vrai["points"]} points (au plus 300)', vrai['n'] == 12 and 5 <= vrai['v'] <= 6 and vrai['points'] <= 300 and vrai['points'] >= 233, str(vrai))
    d = pg.evaluate('() => document.getElementById("ceremonieDetail").textContent')
    t(f'{titre} : la cérémonie dit les vrais points et les vraies victoires (« {d} »)', d.startswith(f'{vrai["points"]} points · {vrai["v"]} victoires'), d)
    ceremonie_ecran(pg, titre, True, 'ceremonie.png')
    e = pg.evaluate(SAISON_ETAT)
    t(f'{titre} : après la une, le classement final de la saison : « La saison 1 est finie », le champion (« CHAMPION ! » si c’est le joueur), l’écurie championne, 20 lignes, la saison close et sauvegardée, sans défilement',
      e['ecran'] == 'saison' and e['titre'] == 'La saison 1 est finie' and (e['champion'] == 'CHAMPION !' if e['humain'] else e['champion'] == 'Champion : ' + e['attenduChampion']) and e['ecurie'].startswith('Écurie championne : ')
      and e['lignes'] == 20 and e['moi'] == 1 and e['premier'] == e['attenduChampion'] and e['saisons'] == 1 and e['sauve'] == 1 and pas_de_defilement(e['defile']), str(e))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'champion.png'))
    pg.click('#boutonSaisonSuite')
    d = pg.evaluate(DUEL_SAISON_ETAT)
    attendu = (f"Tu as battu {d['nom']} {d['a']} à {d['b']}" if d['a'] > d['b'] else f"{d['nom']} a fini devant toi, {d['b']} à {d['a']}" if d['a'] < d['b'] else f"Égalité avec {d['nom']} : {d['a']} à {d['b']}")
    t(f'{titre} : le duel de la saison : « {attendu} », le détail (qualifs, courses, carrière)', d['ecran'] == 'duelSaison' and d['score'] == attendu and 'qualifs' in d['detail'] and 'carrière' in d['detail'] and pas_de_defilement(d['defile']), str(d))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'duel-saison.png'))
    pg.click('#boutonDuelSaisonSuite')
    c = pg.evaluate(CONTRATS_ETAT)
    t(f'{titre} : les contrats : la note, les offres (au moins une, celles de SAISONS.offres, de la meilleure à la moins bonne), « Prendre ma retraite »',
      c['ecran'] == 'contrats' and c['n'] >= 1 and c['ecuries'] == c['offres'] and c['texteNote'].startswith('Ta note : ' + str(round(c['note'] * 100))) and c['bouton'] == 'Prendre ma retraite' and pas_de_defilement(c['defile']), str(c))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'contrats.png'))
    # signer : une autre écurie si on en propose une, sinon la sienne
    choix = next((x for x in c['offres'] if x != c['actuelle']), c['actuelle'])
    avant = pg.evaluate('() => ({ garage: JSON.stringify(JEU.championnat.garage), solde: JEU.championnat.argent.solde, coequipier: CHAMPIONNAT.coequipierDe(JEU.championnat).id, transferts: JEU.championnat.transferts.liste })')
    avant['solde'] += pg.evaluate(f'() => SAISONS.offres(JEU.championnat).find(o => o.ecurie === {choix}).salaire || 0')   # (le salaire de la saison, versé à la signature : patrons.js, tour 35)
    pg.click(f'#contratsListe li[data-ecurie="{choix}"] button.signer')
    t(f'{titre} : « Signer » mène d’abord au choix du sponsor de la saison 2 (2 à 4 offres)', attendre(pg, '() => JEU.ecran === "sponsors" && JEU.championnat.saison === 2 && document.querySelectorAll("#sponsorsListe > li").length >= 2 && SPONSORS.aChoisir(JEU.championnat)'), str(pg.evaluate('() => [JEU.ecran, JEU.championnat.saison]')))
    montant = pg.evaluate('() => SPONSORS.offres(JEU.championnat)[0].montant')
    pg.click('#sponsorsListe > li:first-child button.choisir')
    avant['solde'] += montant   # le montant du sponsor est crédité au choix
    s2 = pg.evaluate(SAISON2_ETAT)
    t(f'{titre} : « Signer » (écurie {choix}) : la saison 2 commence (Grand Prix 1 / 12, points à 0), le joueur est dans l’écurie choisie, 10 écuries de 2, le garage et l’argent suivent, le duel repart de 0, sauvegardé',
      s2['ecran'] == 'championnat' and s2['saison'] == 2 and s2['prochain'] == 0 and s2['ecurie'] == choix and s2['titre'].startswith('Grand Prix 1 / 12') and s2['garage'] == avant['garage'] and s2['solde'] == avant['solde']
      and s2['deux'] and s2['duel'] == [0, 0] and s2['sauve'] == 2 and s2['contrats'] == [[2, choix]] and s2['gagne'] == '' and s2['pilotesLi'] == 20 and s2['zero'], str(s2))
    if choix != c['actuelle']:
        # (sauf si l'ancien coéquipier avait lui-même un transfert annoncé vers cette écurie : saisons.js, les intentions de la saison)
        t(f'{titre} : le coéquipier a changé avec l’écurie (ou l’ancien l’y a suivi par un transfert annoncé)', (s2['coequipier'] != avant['coequipier'] or any(avant['coequipier'] in x for x in avant['transferts'])) and pg.evaluate(f'() => JEU.championnat.pilotes[CHAMPIONNAT.coequipierDe(JEU.championnat).id].ecurie === {choix}'), str([avant['coequipier'], s2['coequipier']]))
    with pg.expect_navigation(): paddock_clic(pg, '#boutonCourseSuivante')
    t(f'{titre} : « Course suivante » recharge la page sur le Grand Prix 1 de la saison 2', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.saison === 2 && JEU.championnat.prochain === 0', None, 60000), str(pg.evaluate('() => [JEU.ecran, JEU.championnat && JEU.championnat.saison]')))

def championnat(pg, titre, l):
    # ?championnat=1 : l'écran entre les courses au démarrage (nouveau championnat : Grand Prix 1), le robot joue deux
    # Grands Prix d'un tour, « Continuer » enregistre et sauvegarde ; la page rechargée retrouve le Grand Prix 3 et les points
    ECRAN = '() => [JEU.ecran, JEU.championnat && JEU.championnat.prochain, document.getElementById("championnatTitre").textContent]'
    t(f'{titre} : au démarrage, l’écran du championnat : Grand Prix 1 / 12, 20 pilotes (le joueur marqué), 10 écuries',
      pg.evaluate('''() => JEU.ecran === "championnat" && JEU.championnat.prochain === 0 && /^Grand Prix 1 \/ 12 — /.test(document.getElementById("championnatTitre").textContent)
        && document.querySelectorAll("#championnatPilotes li").length === 20 && document.querySelectorAll("#championnatPilotes li.moi").length === 1
        && document.querySelectorAll("#championnatEcuries li").length === 10 && document.getElementById("championnatGagne").textContent === ""'''), str(pg.evaluate(ECRAN)))
    duel_ecran(pg, titre, 0)
    fiche_ecran(pg, titre, 'fiche.png' if l == 1280 else 'fiche-960.png')
    sponsors_ecran(pg, titre, 'sponsors.png' if l == 1280 else 'sponsors-960.png')
    if l != 1280:
        garage_ecran(pg, titre, achat=False, capture='garage-960.png')
        # en petit : l'interview d'un Grand Prix fabriqué en mémoire (le joueur 8e avec un gros contact, le pilote 3 aussi : la question
        # « contact » nomme le 3) ; réponse provocante → « n'a pas aimé », la une « interview », les jauges au paddock, la rivalité sur la fiche du 3
        pg.evaluate('''() => { const ch = JEU.championnat, o = [0, 1, 2, 3, 4, 5, 6, 19, 18].concat([...Array(20).keys()].filter(k => k > 6 && k < 18));
          const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true, chocMax: k === 19 || k === 3 ? REGLAGES.INTERVIEW_CHOC + 3 : 0 }));
          JEU.lignesGP = lignes; montrerInterview(INTERVIEW.question(ch, lignes)); }''')
        itw = interview_ecran(pg, titre, 'provocant', capture='interview-960.png', gp='fabriqué (contact avec le pilote 3) : ')
        t(f'{titre} : la question fabriquée est bien « contact » avec le pilote 3', itw['fait'] == 'contact' and itw['rival'] == 3, str([itw['fait'], itw['rival']]))
        u = une_ecran(pg, titre, 'une-interview-960.png', touche=True)
        t(f'{titre} : la une du journal reprend la phrase de l’interview (fait « interview »)', u['fait'] == 'interview', u['fait'])
        E_ = pg.evaluate('() => REGLAGES.INTERVIEW_EFFETS.provocant'); D_ = pg.evaluate('() => REGLAGES.REPUTATION_DEPART')
        reputation_paddock(pg, titre, [D_ + E_.get(j, 0) for j in ('public', 'ecurie', 'sponsors')])
        fiche_rivalite(pg, titre, 3, pg.evaluate('() => REGLAGES.INTERVIEW_RIVALITE_COURSES'))
        # en petit : la une d'un Grand Prix fabriqué en mémoire (le joueur 2e, sans sauvegarde), pour vérifier qu'elle tient en 960×600
        pg.evaluate('''() => { const ch = JEU.championnat, o = [0, 19].concat([...Array(20).keys()].filter(k => k !== 0 && k !== 19));
          const lignes = o.map((k, i) => ({ k, place: i + 1, grille: i + 1, ligne: i + 1, penalites: 0, meilleurTour: 60 + i, classe: true }));
          CHAMPIONNAT.enregistrerCourse(ch, lignes); montrerUne(JOURNAL.ranger(ch, JOURNAL.composer(ch, lignes))); }''')
        u2 = une_ecran(pg, titre, 'une-960.png', touche=True)
        t(f'{titre} : la une du joueur 2e est « premier podium »', u2['fait'] == 'premierPodium', u2['fait'])
        album_ecran(pg, titre, [u['titre'], u2['titre']])
        calendrier_ecran(pg, titre, 'calendrier-960.png')
        return
    points = None
    for gp in (1, 2):
        if gp == 2:
            with pg.expect_navigation(): paddock_clic(pg, '#boutonCourseSuivante')   # le Grand Prix joué : la page se recharge sur le suivant
            t(f'{titre} : « Course suivante » recharge la page sur le Grand Prix {gp}', attendre(pg, f'() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.prochain === {gp - 1}', None, 60000), str(pg.evaluate(ECRAN)))
        paddock_clic(pg, '#boutonCourseSuivante')
        passer_qualif(pg, titre)
        t(f'{titre} : GP {gp} : la course part sur le circuit du calendrier, le joueur (robot) et 19 IA aux couleurs des écuries',
          attendre(pg, '() => JEU.ecran === "course" && JEU.contre && JEU.robot && JEU.plateau && JEU.plateau.pilotes.length === 20 && NOM_CIRCUIT === JEU.championnat.calendrier[JEU.championnat.prochain].circuit'
                       ' && JEU.couleurs.every((c, k) => c === JEU.championnat.ecuries[JEU.championnat.pilotes[k].ecurie].couleur) && JEU.course.nbTours === 1', None, 10000), str(pg.evaluate(ECRAN)))
        t(f'{titre} : GP {gp} : la carte se calcule, chaque IA prend le caractère de son pilote du championnat',
          attendre(pg, '() => JEU.plateau.carte !== null && JEU.plateau.pilotes.slice(0, 19).every((p, k) => p.pilote && p.pilote.caractere.regularite === JEU.championnat.pilotes[k].caractere.regularite * niveau().regularite)', None, 180000))   # (tour 49d : × le niveau de la division, débutant en division 4)
        if gp == 2:   # l'aileron réglé au garage après le GP 1 (cran 5 pour ce circuit) est sur la voiture du joueur ; les IA ont le leur
            al = pg.evaluate('() => ({ ad: JEU.joueur.aileronAdherence, tr: JEU.joueur.aileronTrainee, attendu: AILERON.facteurs(AILERON.cranDe(JEU.championnat, NOM_CIRCUIT)), cran: AILERON.cranDe(JEU.championnat, NOM_CIRCUIT), ia: JEU.plateau.pilotes.slice(0, 19).filter(p => typeof p.aileron === "number").length })')
            t(f'{titre} : GP 2 : l’aileron réglé (cran {al["cran"] + 1}) est sur la voiture du joueur, et les 19 IA ont choisi le leur', al['cran'] == 4 and al['ad'] == al['attendu']['adherence'] and al['tr'] == al['attendu']['trainee'] and al['ia'] == 19, str(al))
        tour = None   # la ligne du coéquipier dans la tour, vue pendant la course
        for _ in range(80):
            pg.evaluate('() => BOUCLE.simuler(5)')
            if pg.evaluate('() => JEU.ecran') == 'podium': break
            pg.wait_for_timeout(50)
            if tour is None:
                tour = pg.evaluate(DUEL_TOUR)
                if tour and tour['ecart'] and gp == 1:
                    # la capture seulement une fois les lignes posées (elles glissent quand l'ordre change), et les 20 rangs de 1 à 20 de haut en bas
                    t(f'{titre} : GP {gp} : avant duel-tour.png, la tour est stable : 20 lignes, les rangs 1 à 20 de haut en bas, chacune à sa place',
                      attendre(pg, ORDRE_TOUR, None, 10000) and pg.evaluate('() => [...document.querySelectorAll("#classementListe li")].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map(li => li.children[0].textContent).join(",")') == ','.join(str(i) for i in range(1, 21)),
                      pg.evaluate('() => [...document.querySelectorAll("#classementListe li")].map(li => [li.children[0].textContent, Math.round(li.getBoundingClientRect().top)])'))
                    pg.screenshot(path=os.path.join(CAPTURES, 'duel-tour.png'))
                if tour and not tour['ecart']: tour = None   # l'écart n'est pas encore connu : on regarde à l'image suivante
        t(f'{titre} : GP {gp} : en course, une seule ligne du coéquipier dans la tour (son numéro, la couleur de l’écurie), avec l’écart en temps « ▲/▼ x,x s »',
          bool(tour) and tour['n'] == 1 and tour['numero'] == tour['attendu'] and tour['couleur'] and bool(re.fullmatch(r'[▲▼] \d+,\d s', tour['ecart'])), str(tour))
        t(f'{titre} : GP {gp} : la course va jusqu’au podium', pg.evaluate('() => JEU.ecran === "podium"'), str(pg.evaluate('() => [JEU.ecran, JEU.plateau.arrives, JEU.plateau.temps, JEU.course.etat]')))
        pg.click('#boutonResultats')
        attendre(pg, '() => JEU.ecran === "resultats"')
        t(f'{titre} : GP {gp} : un seul bouton, « Continuer »', pg.evaluate('() => document.getElementById("boutonRejouerResultats").classList.contains("cache") && document.getElementById("boutonChangerResultats").textContent === "Continuer"'))
        # l'argent (argent.js) : la ligne des gains sous les résultats, calculée sur le classement final de cet instant
        arg = pg.evaluate('''() => { const g = ARGENT.gains(JEU.championnat, CHAMPIONNAT.lignesDepuisCourse(JEU.plateau), JEU.assistance), p = document.getElementById("resultatsArgent");
          return { texte: p.textContent, total: g.total, attendu: ARGENT.formater(g.total), deborde: p.getBoundingClientRect().right > innerWidth || p.getBoundingClientRect().bottom > innerHeight, g }; }''')
        t(f'{titre} : GP {gp} : les résultats montrent l’argent gagné (« Gains : +n € » avec le détail), sans déborder', arg['texte'].startswith('Gains : +' + arg['attendu']) and '(' in arg['texte'] and not arg['deborde'] and arg['total'] > 0, str(arg))
        if gp == 1:
            pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(CAPTURES, 'argent.png'))
        pg.click('#boutonChangerResultats')
        itw = interview_ecran(pg, titre, 'provocant' if gp == 1 else None, capture='interview.png' if gp == 1 else None, gp=f'GP {gp} : ')
        t(f'{titre} : GP {gp} : « Continuer » enregistre le Grand Prix, range sa une dans l’album et sauvegarde, puis montre la une du journal',
          attendre(pg, f'''() => JEU.ecran === "une" && JEU.championnat.prochain === {gp} && SAUVEGARDE.championnat().prochain === {gp} && SAUVEGARDE.championnat().album.length === {gp}
            && JEU.championnat.album.length === {gp} && JEU.championnat.album[{gp - 1}].g === {gp}'''), str(pg.evaluate(ECRAN)) + ' ' + str(pg.evaluate('() => JEU.championnat.album.length')))
        une_ecran(pg, titre, 'une.png' if gp == 1 else 'une-2.png')
        t(f'{titre} : GP {gp} : après la une, l’écran du championnat avec les points gagnés',
          attendre(pg, f'''() => JEU.ecran === "championnat" && /^Tu marques \d+ points?$/.test(document.getElementById("championnatGagne").textContent)
            && document.getElementById("championnatTitre").textContent.startsWith("Grand Prix {gp + 1} / 12")'''), str(pg.evaluate(ECRAN)) + ' ' + pg.evaluate('() => document.getElementById("championnatGagne").textContent'))
        points = pg.evaluate('() => JEU.championnat.pilotes.map(p => p.stats.points)')
        # la réputation après la réponse provocante du GP 1 (public +4, écurie −3, sponsors −3 : INTERVIEW_EFFETS), gardée au GP 2 (pas de commentaire, page rechargée entre les deux)
        E_ = pg.evaluate('() => REGLAGES.INTERVIEW_EFFETS.provocant'); D_ = pg.evaluate('() => REGLAGES.REPUTATION_DEPART')
        reputation_paddock(pg, titre, [D_ + E_.get(j, 0) for j in ('public', 'ecurie', 'sponsors')])
        if gp == 1 and itw['rival'] is not None: fiche_rivalite(pg, titre, itw['rival'], pg.evaluate('() => REGLAGES.INTERVIEW_RIVALITE_COURSES'))
        total = pg.evaluate('() => REGLAGES.POINTS.reduce((a, b) => a + b, 0)')
        t(f'{titre} : GP {gp} : les points sont ceux du classement final (somme = {total} par Grand Prix)', sum(points) == gp * total, str(points))
        duel_ecran(pg, titre, gp)
        # le solde = les gains des Grands Prix + les crédits (le test du garage en ajoute un) − les achats du garage (la somme des prix des niveaux achetés)
        sol = pg.evaluate('''() => { const ch = JEU.championnat, s = ch.argent.solde, R = REGLAGES; return { texte: document.getElementById("championnatArgent").textContent, attendu: "Solde : " + ARGENT.formater(s), s,
          somme: ch.argent.historique.reduce((a, h) => a + h[1], 0) - GARAGE.NOMS.reduce((a, n) => a + R.GARAGE[n].prix.slice(0, ch.garage[n]).reduce((x, y) => x + DIVISIONS.echelle(y, ch, "garage"), 0), 0),   /* (tour 49d-2) les prix de la division */
          sauve: SAUVEGARDE.championnat().argent.solde, n: ch.argent.historique.filter(h => h[0] > 0).length }; }''')
        t(f'{titre} : GP {gp} : l’écran du championnat montre le solde = les gains + les crédits − les achats, sauvegardé, {gp} Grand(s) Prix dans l’historique', sol['texte'] == sol['attendu'] and sol['s'] == sol['somme'] and sol['sauve'] == sol['s'] and sol['n'] == gp and sol['s'] > 0, str(sol))
        if gp == 1:
            pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(CAPTURES, 'championnat.png'))
            garage_ecran(pg, titre)
        else:
            pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(CAPTURES, 'duel.png'))
    pg.reload()
    t(f'{titre} : la page rechargée retrouve le Grand Prix 3 et les mêmes points', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.prochain === 2', None, 60000)
      and pg.evaluate('() => JEU.championnat.pilotes.map(p => p.stats.points)') == points and pg.evaluate('() => document.getElementById("championnatTitre").textContent').startswith('Grand Prix 3 / 12'), str(pg.evaluate(ECRAN)))

# --- les aides au premier usage (aides.js, interface.js AIDES_ECRAN ; étape 11b, Codeur 4) : la bulle au bon moment, une fois ; jamais en
# virage ni pendant un freinage ; jamais sur la piste devant la voiture (en pixels, la méthode de la piste sous les voitures : la boucle
# arrêtée, l'image lue juste après SCENE3D.dessiner ; les points du couloir de la voiture, AIDES_DROITE_DEVANT m devant elle, projetés
# à l'écran par la caméra, sont gris de route et aucun n'est sous la bulle) ; « Revoir les aides » ; AIDES_ACTIVES ; une ancienne sauvegarde
AIDE_BULLE = '() => { const b = document.getElementById("bulleAide"); if (b.classList.contains("cache")) return null; const r = b.getBoundingClientRect(); return { aide: b.dataset.aide, x1: r.left, y1: r.top, x2: r.right, y2: r.bottom, course: b.classList.contains("bulleCourse"), texte: document.getElementById("bulleAideTexte").textContent }; }'
AIDE_COULOIR = '''() => { BOUCLE.arreter(); const c = SCENE3D.canvas, W = c.clientWidth, H = c.clientHeight, k = document.createElement('canvas'); k.width = c.width; k.height = c.height; const ctx = k.getContext('2d');
  SCENE3D.dessiner(); ctx.drawImage(c, 0, 0); const d = ctx.getImageData(0, 0, c.width, c.height).data, sx = c.width / W, sy = c.height / H;
  const b = document.getElementById("bulleAide"), r = b.classList.contains("cache") ? null : b.getBoundingClientRect();
  const C = CIRCUIT, v = JEU.qualif && JEU.qualif.etat === 'tour' ? JEU.qualif.v : JEU.joueur, i0 = v.piste.indice, cam = SCENE3D.camera; let n = 0, gris = 0, dessous = 0;
  for (let m = 6; m <= REGLAGES.AIDES_DROITE_DEVANT; m += 3) for (const cote of [-2, 0, 2]) {
    const i = (i0 + Math.round(m / C.pas)) % C.nb, p = new THREE.Vector3(C.x[i] + C.nx[i] * cote, 0.02, C.z[i] + C.nz[i] * cote).project(cam);
    if (p.z < -1 || p.z > 1) continue; const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H; if (x < 0 || x >= W || y < 0 || y >= H) continue;
    n++; if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) dessous++;
    const o = 4 * (Math.floor(y * sy) * c.width + Math.floor(x * sx)), e = Math.max(d[o], d[o + 1], d[o + 2]) - Math.min(d[o], d[o + 1], d[o + 2]); if (e <= REGLAGES.PISTE_GRIS_ECART_MAX) gris++; }
  BOUCLE.demarrer(); return { n, gris: n ? Math.round(100 * gris / n) : 0, dessous, bulle: r ? [r.left, r.top, r.right, r.bottom].map(Math.round) : null }; }'''
def aide_recouvre(pg, bulle, selecteur):
    # les boutons et champs visibles qui touchent la bulle (aucun ne doit : elle ne cache rien qu'on doive cliquer)
    return pg.evaluate('''([b, sel]) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null || getComputedStyle(e).position === "fixed").map(e => [e.id || e.tagName, e.getBoundingClientRect()])
      .filter(([id, r]) => r.width > 0 && r.height > 0 && !(r.right <= b.x1 || r.left >= b.x2 || r.bottom <= b.y1 || r.top >= b.y2)).map(([id]) => id)''', [bulle, selecteur])

def aides_course(pg, titre, l, h):
    t(f'{titre} : sauvegarde neuve, aucune aide vue ; l’écran de qualification montre l’aide « qualification » en haut à gauche (une bulle de deux lignes au plus, dans l’écran, sur aucun bouton)',
      attendre(pg, '() => JEU.ecran === "qualif" && document.getElementById("bulleAide").dataset.aide === "qualif" && !document.getElementById("bulleAide").classList.contains("cache")', None, 10000), str(pg.evaluate(AIDE_BULLE)))
    b = pg.evaluate(AIDE_BULLE)
    t(f'{titre} : la bulle de la qualification : son texte (textes.js), en haut à gauche, au plus deux lignes, rien qu’on clique dessous', b and b['texte'] == pg.evaluate('() => texte("aide_qualif")') and not b['course'] and b['x1'] >= 0 and b['y1'] >= 0 and b['x2'] <= l and b['y2'] < h * 0.2 and b['y2'] - b['y1'] <= 60 and not aide_recouvre(pg, b, '#qualif button'), str([b, b and aide_recouvre(pg, b, '#qualif button')]))
    pg.wait_for_timeout(800)
    pg.click('#boutonQualifPasser')
    attendre(pg, '() => JEU.qualif && JEU.qualif.etat === "resultat"', None, 240000)
    t(f'{titre} : on quitte l’écran du choix : la bulle s’en va et l’aide est vue (sauvegardée)', attendre(pg, '() => SAUVEGARDE.aides().includes("qualif") && document.getElementById("bulleAide").dataset.aide !== "qualif" || document.getElementById("bulleAide").classList.contains("cache") && SAUVEGARDE.aides().includes("qualif")'), str(pg.evaluate('() => SAUVEGARDE.aides()')))
    pg.click('#boutonQualifCourse')
    attendre(pg, '() => JEU.ecran === "grille" || JEU.ecran === "course"', None, 10000)
    pg.evaluate('() => { if (JEU.ecran === "grille") finirGrille(); }')
    # les feux retenus allumés : l'aide du départ, la voiture tenue sur place sur la grille
    attendre(pg, '() => JEU.course.feux && JEU.course.etat === "compte"', None, 30000)
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) { p.course.feux.delai = 30; p.course.feux.total = 35; p.course.compte = 30; } }')
    t(f'{titre} : les premiers feux : l’aide du départ (↑ dans le vert, puis lâcher et réappuyer), à gauche, la voiture à l’arrêt', attendre(pg, '() => document.getElementById("bulleAide").dataset.aide === "depart" && !document.getElementById("bulleAide").classList.contains("cache") && document.getElementById("bulleAide").classList.contains("bulleCourse")', None, 15000), str(pg.evaluate(AIDE_BULLE)))
    b = pg.evaluate(AIDE_BULLE)
    t(f'{titre} : la bulle du départ ne touche ni les feux, ni la jauge, ni la minicarte, ni le radar, ni la tour', b is not None and not aide_recouvre(pg, b, '#feux, #jauge, #minicarte, #radar, #classement, #hudCourse, #tableau'), str([b, b and aide_recouvre(pg, b, '#feux, #jauge, #minicarte, #radar, #classement, #hudCourse, #tableau')]))
    co = pg.evaluate(AIDE_COULOIR)
    t(f'{titre} : sur la grille, aucun point de la piste devant la voiture (son couloir sur AIDES_DROITE_DEVANT m) sous la bulle', co['n'] >= 20 and co['dessous'] == 0, str(co))
    L.append(f"  (aides, sur la grille {l}×{h} : {co['n']} points du couloir devant la voiture à l’écran, {co['gris']} % gris de route (les voitures devant en cachent), {co['dessous']} sous la bulle {co['bulle']})")
    pg.evaluate('() => { for (const p of JEU.plateau.pilotes) p.course.compte = 0.01; }')
    t(f'{titre} : feux éteints (l’action est faite) : la bulle se ferme, l’aide du départ est vue', attendre(pg, '() => JEU.course.etat !== "compte" && document.getElementById("bulleAide").classList.contains("cache") && SAUVEGARDE.aides().includes("depart")', None, 15000), str([pg.evaluate(AIDE_BULLE), pg.evaluate('() => SAUVEGARDE.aides()')]))
    # l'arrêt obligatoire conseillé dès ce tour : la bulle ne vient qu'en ligne droite ; on suit le robot sur plus d'un tour, image par image
    pg.evaluate('() => BOUCLE.simuler(1)')
    pg.evaluate('() => { JEU.course.arretConseille = 1; BOUCLE.arreter(); }')
    vu, cache_virage, faux, capture = 0, 0, [], False
    for i in range(320):
        r = pg.evaluate('''() => { BOUCLE.simuler(0.25); const aide = AIDES_ECRAN.maj(0.02), s = AIDES.situation(JEU, CIRCUIT, null), e = AIDES_ECRAN.etat(), dom = !document.getElementById("bulleAide").classList.contains("cache");
          return { aide, dom, attend: e.actuelle === "stand" && !aide, courbure: s.courbure, frein: s.frein, direction: s.direction, vitesse: s.vitesse, s: JEU.joueur.piste.s, vue: e.vues.has("stand") }; }''')
        if r['aide'] == 'stand':
            vu += 1
            if not (r['vitesse'] <= 1 or (r['courbure'] <= pg.evaluate('() => REGLAGES.AIDES_COURBURE_MAX') and r['frein'] <= 0.05 and abs(r['direction']) <= 0.3)) or not r['dom']: faux.append(r)
            if not capture and r['vitesse'] > 20:
                capture = True
                co = pg.evaluate(AIDE_COULOIR)
                t(f'{titre} : en roulant dans la ligne droite, l’aide de l’arrêt obligatoire est affichée et aucun point de la piste devant la voiture n’est sous la bulle (les points sont bien sur la route : gris)', co['n'] >= 20 and co['dessous'] == 0 and co['gris'] >= 60 and pg.evaluate('() => document.getElementById("bulleAideTexte").textContent.includes(String(Math.round(REGLAGES.STAND_VITESSE_MAX * 3.6)))'), str(co))
                L.append(f"  (aides, l’arrêt obligatoire en roulant {l}×{h} : {co['n']} points du couloir, {co['gris']} % gris de route, {co['dessous']} sous la bulle {co['bulle']})")
                pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'aide-stand.png' if l == 1280 else 'aide-stand-960.png'))   # (la dernière image dessinée, la boucle arrêtée ; la bulle a fini d'apparaître)
        elif r['attend']: cache_virage += 1
        if r['vue']: break
    t(f'{titre} : l’aide de l’arrêt s’affiche en ligne droite ({vu} images), se cache dans les virages et les freinages ({cache_virage} images) et jamais elle n’est affichée dans un virage, un freinage ou volant tourné', vu > 0 and cache_virage > 0 and not faux and capture, str(faux[:3]))
    pg.evaluate('() => BOUCLE.demarrer()')
    # « Revoir les aides » dans le menu pause
    pg.keyboard.press('Escape')
    t(f'{titre} : le menu pause a « Revoir les aides » : il remet toutes les aides (la sauvegarde aussi)', attendre(pg, '() => JEU.ecran === "pause" && document.getElementById("boutonRevoirAidesPause").textContent === texte("revoirAides")') and (pg.click('#boutonRevoirAidesPause') or True) and pg.evaluate('() => SAUVEGARDE.aides().length === 0 && AIDES_ECRAN.etat().vues.size === 0'), str(pg.evaluate('() => [JEU.ecran, SAUVEGARDE.aides()]')))
    pg.keyboard.press('Escape'); attendre(pg, '() => JEU.ecran === "course"')
    # AIDES_ACTIVES = false : plus rien, même avec toutes les aides à revoir et l'arrêt à faire
    n = pg.evaluate('() => { REGLAGES.AIDES_ACTIVES = false; BOUCLE.arreter(); let n = 0; for (let i = 0; i < 120; i++) { BOUCLE.simuler(0.25); if (AIDES_ECRAN.maj(0.02) || !document.getElementById("bulleAide").classList.contains("cache")) n++; } REGLAGES.AIDES_ACTIVES = true; BOUCLE.demarrer(); return n; }')
    t(f'{titre} : AIDES_ACTIVES = false : aucune bulle pendant 30 s de course, même avec les aides remises', n == 0, str(n))

def aides_menus(pg, titre, l, h):
    vis = '() => !document.getElementById("bulleAide").classList.contains("cache") && document.getElementById("bulleAide").dataset.aide'
    t(f'{titre} : au paddock, sauvegarde neuve : l’aide du duel contre le coéquipier', attendre(pg, '() => JEU.ecran === "championnat" && !document.getElementById("bulleAide").classList.contains("cache") && document.getElementById("bulleAide").dataset.aide === "duel"', None, 20000), str(pg.evaluate(AIDE_BULLE)))
    b = pg.evaluate(AIDE_BULLE)
    t(f'{titre} : la bulle du paddock tient dans l’écran, ne touche aucun bouton (le menu à gauche compris) ; au plus deux lignes ; « Revoir les aides » est dans la page Réglages', b and b['x1'] >= 0 and b['y1'] >= 0 and b['x2'] <= l and b['y2'] - b['y1'] <= 60 and not aide_recouvre(pg, b, '#championnat button, #boutonSon')
      and pg.evaluate(f'() => {{ const b = document.getElementById("boutonRevoirAides"); return INTERFACE.pageDe("boutonRevoirAides") === "reglages" && b.textContent === texte("revoirAides"); }}'),
      str([b, b and aide_recouvre(pg, b, '#championnat button, #boutonSon')]))
    pg.click('#bulleAide')
    t(f'{titre} : un clic ferme la bulle ; l’aide est vue (sauvegardée)', pg.evaluate('() => document.getElementById("bulleAide").classList.contains("cache") && SAUVEGARDE.aides().includes("duel")'), str(pg.evaluate('() => SAUVEGARDE.aides()')))
    paddock_clic(pg, '#boutonGarage')
    t(f'{titre} : le premier garage : l’aide du garage (à quoi servent les améliorations, le plafond), sur aucun bouton', attendre(pg, '() => JEU.ecran === "garage" && document.getElementById("bulleAide").dataset.aide === "garage" && !document.getElementById("bulleAide").classList.contains("cache")'), str(pg.evaluate(AIDE_BULLE)))
    b = pg.evaluate(AIDE_BULLE)
    t(f'{titre} : la bulle du garage dit le plafond de GARAGE_PLAFOND et ne touche aucun bouton ni aucune ligne du garage', b and pg.evaluate('() => document.getElementById("bulleAideTexte").textContent.includes(String(Math.round(REGLAGES.GARAGE_PLAFOND * 100)))') and not aide_recouvre(pg, b, '#garage button, #garageListe li, #garage h1'), str([b, b and aide_recouvre(pg, b, '#garage button, #garageListe li, #garage h1')]))
    pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(CAPTURES, 'aide-garage.png' if l == 1280 else 'aide-garage-960.png'))
    attendre(pg, '() => AIDES_ECRAN.etat().montree >= REGLAGES.AIDES_VUE_APRES', None, 10000)
    pg.click('#boutonAileron')
    t(f'{titre} : on quitte le garage : son aide est vue ; le premier aileron : son aide', attendre(pg, '() => JEU.ecran === "aileron" && document.getElementById("bulleAide").dataset.aide === "aileron" && !document.getElementById("bulleAide").classList.contains("cache") && SAUVEGARDE.aides().includes("garage")'), str([pg.evaluate(AIDE_BULLE), pg.evaluate('() => SAUVEGARDE.aides()')]))
    b = pg.evaluate(AIDE_BULLE)
    t(f'{titre} : la bulle de l’aileron ne touche ni le curseur ni la carte ni les boutons', b and not aide_recouvre(pg, b, '#aileron button, #aileronCurseur, #aileronCarte, #aileron h1'), str([b, b and aide_recouvre(pg, b, '#aileron button, #aileronCurseur, #aileronCarte, #aileron h1')]))
    attendre(pg, '() => AIDES_ECRAN.etat().montree >= REGLAGES.AIDES_VUE_APRES', None, 10000)   # (lue un peu : swiftshader dessine lentement derrière l'écran)
    pg.click('#boutonAileronRetour')
    garage = attendre(pg, '() => JEU.ecran === "garage" && document.getElementById("bulleAide").classList.contains("cache") && SAUVEGARDE.aides().includes("aileron")', None, 10000)
    pg.wait_for_timeout(300)
    t(f'{titre} : revenu au garage : plus d’aide (vue une fois) ; au paddock non plus', garage and pg.evaluate(vis) is False and (pg.click('#boutonGarageRetour') or True) and attendre(pg, '() => JEU.ecran === "championnat"') and (pg.wait_for_timeout(500) or True) and pg.evaluate(vis) is False, str([pg.evaluate('() => JEU.ecran'), pg.evaluate(AIDE_BULLE), pg.evaluate('() => SAUVEGARDE.aides()')]))
    pg.reload(); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 30000); pg.wait_for_timeout(500)
    t(f'{titre} : après un rechargement, les aides vues ne reviennent pas (duel, garage, aileron gardés à la racine de la sauvegarde)', pg.evaluate(vis) is False and pg.evaluate('() => ["duel", "garage", "aileron"].every(a => SAUVEGARDE.aides().includes(a))'), str(pg.evaluate('() => SAUVEGARDE.aides()')))
    paddock_clic(pg, '#boutonRevoirAides')
    t(f'{titre} : « Revoir les aides » au paddock : la liste est vidée, l’aide du duel revient tout de suite', attendre(pg, '() => SAUVEGARDE.aides().length === 0 && document.getElementById("bulleAide").dataset.aide === "duel" && !document.getElementById("bulleAide").classList.contains("cache")'), str([pg.evaluate('() => SAUVEGARDE.aides()'), pg.evaluate(AIDE_BULLE)]))
    # une ancienne sauvegarde : la même, sans le champ « aides » (comme avant ce tour) : elle se charge, et aucune aide n'est vue
    pg.evaluate('() => { const d = JSON.parse(localStorage.getItem(SAUVEGARDE.CLE)); d.aides = ["duel"]; localStorage.setItem(SAUVEGARDE.CLE, JSON.stringify(d)); delete d.aides; localStorage.setItem(SAUVEGARDE.CLE, JSON.stringify(d)); }')
    pg.reload()
    t(f'{titre} : une ancienne sauvegarde (sans le champ des aides) se charge au paddock, sans erreur, avec aucune aide vue (l’aide du duel s’affiche)', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.pilotes.length === 20 && SAUVEGARDE.aides().length === 0 && document.getElementById("bulleAide").dataset.aide === "duel"', None, 30000), str(pg.evaluate('() => [JEU.ecran, SAUVEGARDE.aides()]')))

# --- le tutoriel guidé (tutoriel.js, interface.js TUTORIEL_ECRAN ; étape 11d, Codeur 4) : la liste des leçons (titre, paddock, pause,
# « Bravo ! »), chaque leçon réussie par le robot d'essai (ou un pilote scripté), le résultat et l'étoile gardée, « Passer », l'échec sans rien faire
TUTO_JOUER = '''(n) => { for (let i = 0; i < n; i++) { if (TUTORIEL_ECRAN.resultat()) break; BOUCLE.simuler(0.05); TUTORIEL_ECRAN.maj(0.05); }
  const su = TUTORIEL_ECRAN.suivi(); return { resultat: TUTORIEL_ECRAN.resultat(), raison: su && su.raison, t: su && su.t, essais: su && su.essais, meilleur: su && su.meilleur, dernier: su && su.dernier }; }'''
def aides_consigne(pg, titre, l, h):
    # les contrats : l'écran de fin de saison ouvert tout de suite (montrerContrats, les offres de la note du joueur) : l'aide des contrats, sur
    # aucun bouton ni aucune offre ; un clic la ferme ; revenu au paddock, elle ne revient plus
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000)
    pg.evaluate('() => { AIDES_ECRAN.fermer(); montrerContrats(); }')
    t(f'{titre} : l’écran des contrats (ouvert par montrerContrats) : l’aide des contrats (les écuries regardent tes points et ton duel)', attendre(pg, '() => JEU.ecran === "contrats" && !document.getElementById("bulleAide").classList.contains("cache") && document.getElementById("bulleAide").dataset.aide === "contrats"', None, 10000), str(pg.evaluate(AIDE_BULLE)))
    b = pg.evaluate(AIDE_BULLE)
    t(f'{titre} : la bulle des contrats : son texte, en haut à gauche, deux lignes au plus, sur aucun bouton ni aucune offre ni le titre', b and b['texte'] == pg.evaluate('() => texte("aide_contrats")') and not b['course'] and b['x1'] >= 0 and b['x2'] <= l and b['y2'] - b['y1'] <= 60 and not aide_recouvre(pg, b, '#contrats button, #contratsListe li, #contrats h1, #contratsNote'), str([b, b and aide_recouvre(pg, b, '#contrats button, #contratsListe li, #contrats h1, #contratsNote')]))
    if l == 1280: pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'aide-contrats.png'))
    pg.click('#bulleAide')
    t(f'{titre} : un clic la ferme, l’aide des contrats est vue ; rouvert, l’écran n’a plus de bulle', pg.evaluate('() => document.getElementById("bulleAide").classList.contains("cache") && SAUVEGARDE.aides().includes("contrats")') and (pg.evaluate('() => { montrerChampionnat(null); montrerContrats(); }') or True) and (pg.wait_for_timeout(600) or True) and pg.evaluate('() => document.getElementById("bulleAide").classList.contains("cache")'), str(pg.evaluate('() => [JEU.ecran, SAUVEGARDE.aides()]')))
    pg.evaluate('() => montrerChampionnat(null)')
    # la consigne d'équipe : une vraie course du championnat ; la consigne posée comme dans consigne_ecran (le joueur devant son coéquipier) ;
    # l'aide ne vient qu'en ligne droite, ne recouvre pas la piste devant la voiture, et se ferme quand la consigne a sa réponse
    paddock_clic(pg, '#boutonCourseSuivante')
    passer_qualif(pg, titre)
    attendre(pg, '() => JEU.plateau.carte !== null && JEU.course.etat === "compte"', None, 180000)
    # (comme consigne_ecran : le joueur et son coéquipier échangent leurs places sur la grille, le joueur devant lui)
    pg.evaluate('''() => { const e = JEU.plateau, P = e.pilotes, j = P.findIndex(p => p.humain), kc = CHAMPIONNAT.coequipierDe(JEU.championnat).id;
      const a = P[j], b = P[kc], pa = { s: a.v.piste.s, d: a.v.piste.d, depart: a.depart }, pb = { s: b.v.piste.s, d: b.v.piste.d, depart: b.depart };
      if (pa.depart < pb.depart) { placerSurPiste(a.v, CIRCUIT, pb.s, pb.d); placerSurPiste(b.v, CIRCUIT, pa.s, pa.d); a.depart = pb.depart; b.depart = pa.depart; e.origine = Math.min(...P.map(p => p.depart)); }
      for (const p of P) p.course.compte = 0.01; }''')
    attendre(pg, '() => JEU.course.etat === "course" && JEU.course.temps > 1', None, 30000)
    pg.evaluate('''() => { BOUCLE.arreter(); const e = JEU.plateau, P = e.pilotes, j = P.findIndex(p => p.humain), kc = CHAMPIONNAT.coequipierDe(JEU.championnat).id;
      const c = { devant: j, derriere: kc, numero: P[kc].numero, debut: e.temps, joueur: true, refus: false, resultat: null }; REGLAGES.CONSIGNE_DELAI = 1e9;
      e.consigne = c; P[j].course.consigne = c; P[kc].course.consigne = c; }''')
    vu, cache, faux, couloir = 0, 0, [], None
    for i in range(240):
        r = pg.evaluate('''() => { BOUCLE.simuler(0.25); const aide = AIDES_ECRAN.maj(0.02), s = AIDES.situation(JEU, CIRCUIT, null), e = AIDES_ECRAN.etat();
          return { aide, dom: !document.getElementById("bulleAide").classList.contains("cache"), attend: e.actuelle === "consigne" && !aide, libre: AIDES.libre(s), texte: document.getElementById("bulleAideTexte").textContent }; }''')
        if r['aide'] == 'consigne':
            vu += 1
            if not r['libre'] or not r['dom']: faux.append(r)
            if couloir is None:
                couloir = pg.evaluate(AIDE_COULOIR)
                t(f'{titre} : la consigne d’équipe vise le joueur : son aide (lever le pied ↓ ou garder sa place), en ligne droite, sans recouvrir la piste devant la voiture', r['texte'] == pg.evaluate('() => texte("aide_consigne")') and couloir['n'] >= 20 and couloir['dessous'] == 0, str([r, couloir]))
                L.append(f"  (aides, la consigne d’équipe {l}×{h} : {couloir['n']} points du couloir, {couloir['gris']} % gris de route, {couloir['dessous']} sous la bulle {couloir['bulle']})")
                pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'aide-consigne.png' if l == 1280 else 'aide-consigne-960.png'))
        elif r['attend']: cache += 1
        if vu >= 8 and cache >= 1: break
    t(f'{titre} : l’aide de la consigne s’affiche en ligne droite ({vu} images), attend dans les virages ({cache} images), jamais affichée hors d’une ligne droite', vu > 0 and not faux and couloir is not None, str([vu, cache, faux[:2]]))
    # la consigne répondue (suivie) : l'action est faite, la bulle se ferme, l'aide est vue
    r = pg.evaluate('() => { JEU.plateau.consigne.resultat = "suivie"; JEU.plateau.consigne.finCourse = JEU.course.temps; const a = AIDES_ECRAN.maj(0.02); return { a, cache: document.getElementById("bulleAide").classList.contains("cache"), vues: SAUVEGARDE.aides() }; }')
    t(f'{titre} : la consigne répondue : la bulle se ferme, l’aide de la consigne est vue (sauvegardée)', r['a'] is None and r['cache'] and 'consigne' in r['vues'], str(r))
    pg.evaluate('() => BOUCLE.demarrer()')

def tuto_resultat(pg, titre, l, h, id, r):
    vis = pg.evaluate('''() => { const e = document.getElementById("tutoResultat"), b = [...e.querySelectorAll("button")].filter(x => !x.classList.contains("cache")).map(x => x.getBoundingClientRect());
      return { vu: !e.classList.contains("cache"), titre: document.getElementById("tutoResultatTitre").textContent, texte: document.getElementById("tutoResultatTexte").textContent, dedans: b.every(x => x.left >= 0 && x.top >= 0 && x.right <= innerWidth && x.bottom <= innerHeight), consigne: !document.getElementById("tutoConsigne").classList.contains("cache"), etoile: SAUVEGARDE.tutoriel(), boucle: BOUCLE.tourne }; }''')
    t(f'{titre} : leçon « {id} » réussie ({r}) : l’écran du résultat (« Leçon réussie ! ★ »), ses boutons dans l’écran, la consigne cachée, l’étoile gardée à la racine de la sauvegarde, la course arrêtée derrière',
      r['resultat'] == 'reussie' and vis['vu'] and vis['titre'] == pg.evaluate('() => texte("tutoReussie")') and vis['dedans'] and not vis['consigne'] and id in vis['etoile'] and (id == 'visite' or not vis['boucle']), str([r, vis]))
    return vis

def tuto_lecon(pg, titre, l, h, page):
    id = re.search(r'tutoriel=(\w+)', page).group(1)
    attendre(pg, '() => typeof TUTORIEL_ECRAN !== "undefined" && TUTORIEL_ECRAN.lecon() !== null', None, 10000)
    if id == 'visite':
        # une vraie carrière dans la sauvegarde (graine 7), puis la page de la leçon : la visite ne doit rien y laisser (l'aileron, les pneus du départ…)
        # (posée depuis une page qui n'est pas une leçon : recharger la leçon remettrait la sauvegarde d'avant, c'est voulu)
        pg.goto('file://' + RACINE + '/index.html?championnat=1'); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 30000)
        pg.evaluate('() => { const d = SAUVEGARDE.lire(); d.championnat = CHAMPIONNAT.creer(7); d.championnat.marqueTest = 7; SAUVEGARDE.ecrire(d); }')
        pg.goto('file://' + RACINE + '/' + page); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 30000)
        avant = pg.evaluate('() => TUTORIEL_ECRAN.avantVisite()')
        t(f'{titre} : la visite garde la carrière de la sauvegarde telle quelle avant de commencer', avant is not None and '"marqueTest":7' in avant, str(avant)[:200])
        def changer_carriere():
            # au garage : les pneus du départ (le dernier bouton) ; à l'aileron : un autre cran ; la sauvegarde change bien
            pg.evaluate('() => { const c = document.getElementById("aileronCurseur"); c.value = String((Number(c.value) + 2) % REGLAGES.AILERON_CRANS); c.dispatchEvent(new Event("input")); }')
            return pg.evaluate('(a) => JSON.stringify(SAUVEGARDE.lire().championnat) !== a', avant)
        if 'quitter' in page:
            paddock_clic(pg, '#boutonGarage'); attendre(pg, '() => JEU.ecran === "garage"')
            pg.click('#boutonAileron'); attendre(pg, '() => JEU.ecran === "aileron"')
            change = changer_carriere()
            # on quitte la page (une autre page du jeu, qui ne touche pas à la sauvegarde) : la carrière est remise en partant
            pg.goto('file://' + RACINE + '/tests/textes.html'); pg.wait_for_timeout(300)
            apres = pg.evaluate('() => { const d = JSON.parse(localStorage.getItem("grand-prix-dynasty")); return { ch: JSON.stringify(d.championnat), tuto: d.tutoriel || [] }; }')
            t(f'{titre} : la visite quittée en cours de route (l’aileron changé) : la carrière de la sauvegarde revient exactement comme avant, sans étoile', change and apres['ch'] == avant and 'visite' not in apres['tuto'], str([change, apres['ch'] == avant, apres['tuto']]))
            pg.goto('file://' + RACINE + '/index.html?championnat=1'); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 30000)   # (de retour sur une page du jeu, pour les vérifications de fin de page)
            return
        t(f'{titre} : la visite : au paddock, la consigne en haut à gauche (« Clique sur Garage »), pas de bulle d’aide', attendre(pg, '() => JEU.ecran === "championnat" && !document.getElementById("tutoConsigne").classList.contains("cache") && document.getElementById("tutoConsigneTexte").textContent === texte("tuto_visite_paddock") && document.getElementById("bulleAide").classList.contains("cache")', None, 20000), pg.evaluate('() => [JEU.ecran, document.getElementById("tutoConsigneTexte").textContent]'))
        etapes = []
        change = False
        for clic, attendu in [('#boutonGarage', 'garage'), ('#garagePneus button:last-of-type', None), ('#boutonAileron', 'aileron'), (None, None), ('#boutonAileronRetour', 'retour'), ('#boutonGarageRetour', None)]:
            if clic is None: change = changer_carriere(); continue
            paddock_clic(pg, clic); pg.wait_for_timeout(400)
            if attendu: etapes.append(attendre(pg, f'() => document.getElementById("tutoConsigneTexte").textContent === texte("tuto_visite_{attendu}")', None, 10000))
        attendre(pg, '() => TUTORIEL_ECRAN.resultat() !== null', None, 10000)
        apres = pg.evaluate('(a) => ({ sauvee: JSON.stringify(SAUVEGARDE.lire().championnat) === a, memoire: JSON.stringify(JEU.championnat) === a })', avant)
        t(f'{titre} : la visite réussie, après avoir changé les pneus du départ et l’aileron : la carrière revient exactement comme avant (sauvegarde et mémoire)', change and apres['sauvee'] and apres['memoire'], str([change, apres]))
        t(f'{titre} : la visite guidée : garage → aileron → retour, chaque écran a sa consigne', all(etapes), str(etapes))
        tuto_resultat(pg, titre, l, h, id, { 'resultat': pg.evaluate('() => TUTORIEL_ECRAN.resultat()') })
        if l == 1280: pg.screenshot(path=os.path.join(CAPTURES, 'tuto-visite.png'))
        return
    if 'ia=1' in page: attendre(pg, '() => JEU.plateau && JEU.plateau.carte !== null', None, 240000)
    t(f'{titre} : leçon « {id} » : pas de qualification, la course tout de suite ; la consigne à gauche (son titre, son texte, « Passer »), aucune bulle d’aide',
      attendre(pg, '() => JEU.ecran === "course" && !document.getElementById("tutoConsigne").classList.contains("cache") && document.getElementById("bulleAide").classList.contains("cache")', None, 20000) and pg.evaluate(f'() => JEU.qualif === null && document.getElementById("tutoConsigneTitre").textContent.startsWith(TUTORIEL.PAR_ID["{id}"].numero + ". ") && document.getElementById("boutonTutoPasser").textContent === texte("tutoPasser")'),
      str(pg.evaluate('() => [JEU.ecran, JEU.qualif, document.getElementById("tutoConsigne").className, document.getElementById("tutoConsigneTexte").textContent]')))
    if 'rien' in page:
        # ne rien faire : la voiture reste sur la ligne ; après TUTO_TEMPS_MAX s, la leçon est ratée
        r = pg.evaluate('() => { BOUCLE.arreter(); BOUCLE.simuler(5); TUTORIEL_ECRAN.maj(REGLAGES.TUTO_TEMPS_MAX + 1); return { resultat: TUTORIEL_ECRAN.resultat(), raison: TUTORIEL_ECRAN.suivi().raison, u: JEU.joueur.u, etoiles: SAUVEGARDE.tutoriel() }; }')
        t(f'{titre} : sans rien faire, la leçon « {id} » est ratée après TUTO_TEMPS_MAX s (« Pas encore… », le temps est écoulé), sans étoile', r['resultat'] == 'ratee' and r['raison'] == 'temps' and r['u'] == 0 and not r['etoiles'] and pg.evaluate('() => document.getElementById("tutoResultatTitre").textContent === texte("tutoRatee") && !document.getElementById("tutoResultat").classList.contains("cache")'), str(r))
        if l == 960: pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'tuto-rate-960.png'))
        with pg.expect_navigation(): pg.click('#boutonTutoSuivante')
        t(f'{titre} : « Leçon suivante » mène à la leçon 2', attendre(pg, '() => typeof TUTORIEL_ECRAN !== "undefined" && TUTORIEL_ECRAN.lecon() === "freinage"', None, 20000), pg.url)
        return
    if l == 1280: pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, f'tuto-{id}.png'))
    pg.evaluate('() => { BOUCLE.arreter(); JEU.robot = true; }')   # (le robot d'essai conduit, comme ?robot=1 : il fait aussi le départ parfait)
    if id == 'stand': pg.evaluate('() => { BOUCLE.simuler(4); JEU.joueur.versStands = true; }')   # (le robot prend la voie des stands, comme dans stand_ecran)
    if id == 'pluie':
        eau = pg.evaluate('() => { for (let i = 0; i < 4000 && !(JEU.plateau.meteo && JEU.plateau.meteo.eau >= REGLAGES.TUTO_PLUIE_EAU); i++) { BOUCLE.simuler(0.05); TUTORIEL_ECRAN.maj(0.05); } JEU.joueur.versStands = true; return JEU.plateau.meteo ? JEU.plateau.meteo.eau : null; }')
        L.append(f'  (leçon pluie : la piste mouillée à {eau}, le robot va au stand)')
    if id == 'freinage':
        # les plots du point de freinage, vus en arrivant : 60 m avant eux, une image dessinée, capture tuto-plots.png
        pl = pg.evaluate('''() => { const z = TUTORIEL_ECRAN.suivi().zone, L = CIRCUIT.longueur; for (let i = 0; i < 3000; i++) { const a = ((z.debut - JEU.joueur.piste.s) % L + L) % L; if (a < 60 && a > 30) break; BOUCLE.simuler(0.05); TUTORIEL_ECRAN.maj(0.05); }
          let n = 0; JEU.modele && JEU.modele.groupe.parent && JEU.modele.groupe.parent.traverse(o => { if (o.name === "tutoriel-plots") n = o.count; }); return n; }''')
        t(f'{titre} : les plots orange du point de freinage et de la sortie de la zone sont posés dans la 3D (6, en un seul appel de dessin)', pl == 6, str(pl))
        pg.evaluate('() => BOUCLE.demarrer()'); pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(CAPTURES, 'tuto-plots.png')); pg.evaluate('() => BOUCLE.arreter()')
    r = pg.evaluate(TUTO_JOUER, 6000)
    if id == 'freinage': L.append(f"  (leçon du freinage : le robot d’essai passe la zone en {r['meilleur']} s (dernier passage {r['dernier']}), objectif {pg.evaluate('() => REGLAGES.TUTO_ZONE_OBJECTIF')} s)")
    if id == 'depart': L.append(f"  (leçon du départ : robot, {pg.evaluate('() => [JEU.course.depart.resultat, JEU.course.depart.reaction]')})")
    vis = tuto_resultat(pg, titre, l, h, id, r)
    if l == 960 or id == 'stand': pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, f'tuto-reussie-{id}{"-960" if l == 960 else ""}.png'))

def tuto_menu(pg, titre, l, h):
    t(f'{titre} : le premier lancement : l’écran titre a le petit « Apprendre à piloter » sous « Entre amis » ; la liste des leçons est cachée (aucun écran de plus)',
      pg.evaluate('() => JEU.ecran === "titre" && document.getElementById("boutonTutorielTitre").textContent === texte("tutoBouton") && document.getElementById("boutonTutorielTitre").getBoundingClientRect().top > document.getElementById("boutonAmis").getBoundingClientRect().top && document.getElementById("tutoMenu").classList.contains("cache")'))
    t(f'{titre} : le podium de la découverte a aussi « D’abord apprendre »', pg.evaluate('() => document.getElementById("boutonTutorielPodium").textContent === texte("tutoBravo") && document.getElementById("boutonTutorielPodium").closest("#podium") !== null'))
    pg.click('#boutonTutorielTitre')
    m = pg.evaluate('''() => { const e = document.getElementById("tutoMenu"), li = [...e.querySelectorAll("#tutoListe li")], b = [...e.querySelectorAll("button")].map(x => x.getBoundingClientRect());
      return { vu: !e.classList.contains("cache"), n: li.length, etoiles: li.map(x => x.querySelector(".tutoEtoile").textContent).join(""), noms: li.map(x => x.querySelector(".tutoNom").textContent), dedans: b.every(x => x.left >= 0 && x.top >= 0 && x.right <= innerWidth && x.bottom <= innerHeight),
        defile: [document.documentElement.scrollHeight, innerHeight] }; }''')
    t(f'{titre} : « Apprendre à piloter » : la liste des 7 leçons (numéro, nom, but, « Commencer » ; la 8e, le drift, cachée avec le pneu drift, tour 48b), aucune étoile encore, aucun texte drift, tout dans l’écran sans défilement',
      m['vu'] and m['n'] == 7 and m['etoiles'] == '☆' * 7 and pg.evaluate('() => !/drift/i.test(document.getElementById("tutoMenu").innerText)') and m['noms'][0].startswith('1. ') and m['dedans'] and m['defile'][0] <= m['defile'][1] + 2, str(m))
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(CAPTURES, 'tuto-menu.png' if l == 1280 else 'tuto-menu-960.png'))
    pg.click('#boutonTutoRetour')
    t(f'{titre} : « Retour » referme la liste : l’écran titre est toujours là, « ▶ Jouer » mène toujours à la grille d’un clic', pg.evaluate('() => document.getElementById("tutoMenu").classList.contains("cache") && JEU.ecran === "titre"'))
    pg.evaluate('() => { SAUVEGARDE.reussirLecon("depart"); }')
    pg.click('#boutonTutorielTitre')
    t(f'{titre} : une leçon réussie a son étoile dans la liste', pg.evaluate('() => [...document.querySelectorAll("#tutoListe .tutoEtoile")].map(x => x.textContent).join("") === "☆☆★☆☆☆☆"'), pg.evaluate('() => [...document.querySelectorAll("#tutoListe .tutoEtoile")].map(x => x.textContent).join("")'))
    with pg.expect_navigation(): pg.click('#tutoListe li:first-child button')
    t(f'{titre} : « Commencer » ouvre la leçon 1 (course seule, un tour)', attendre(pg, '() => typeof TUTORIEL_ECRAN !== "undefined" && TUTORIEL_ECRAN.lecon() === "conduite" && JEU.course && JEU.course.nbTours === 1 && !JEU.plateau', None, 20000), pg.url)
    with pg.expect_navigation(): pg.click('#boutonTutoPasser')
    t(f'{titre} : « Passer » mène à la leçon suivante, sans étoile pour celle passée', attendre(pg, '() => typeof TUTORIEL_ECRAN !== "undefined" && TUTORIEL_ECRAN.lecon() === "freinage" && !SAUVEGARDE.tutoriel().includes("conduite")', None, 20000), pg.url)
    # la pause d'une leçon et le paddock ont aussi le bouton
    attendre(pg, '() => JEU.ecran === "course"', None, 10000); pg.keyboard.press('Escape')
    t(f'{titre} : le menu pause a « Apprendre à piloter », qui ouvre la liste', attendre(pg, '() => JEU.ecran === "pause"') and (pg.click('#boutonTutorielPause') or True) and pg.evaluate('() => !document.getElementById("tutoMenu").classList.contains("cache")'))
    pg.goto('file://' + RACINE + '/index.html?championnat=1'); attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 30000)
    b = pg.evaluate('() => { const b = document.getElementById("boutonTutorielPaddock"), r = b.getBoundingClientRect(); return { texte: b.querySelector(".menuNom").textContent, menu: !!b.closest("#paddockMenu"), dedans: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && r.width > 0 }; }')
    t(f'{titre} : au paddock, « ? Apprendre » est en bas du menu à gauche, dans l’écran', b['texte'] == pg.evaluate('() => texte("paddock_apprendre")') and b['menu'] and b['dedans'], str(b))

def INTERFACE_TEMPS(t, virgule='.'):
    m = int(t // 60); s = t - m * 60
    return f'{m}:{s:06.3f}'.replace('.', virgule)

# PAGES_FILTRE=<expression> (variable d'environnement, développement) : seulement les pages dont l'adresse y correspond
if os.environ.get('PAGES_FILTRE'): PAGES = [x for x in PAGES if re.search(os.environ['PAGES_FILTRE'], x[0])]
# --- la personnalisation (tour 48c, Codeur 3) : « Ma voiture » depuis le garage : la livrée (motif, couleur secondaire ; la couleur principale est
# celle de l'écurie), le numéro, la célébration, la voiture qui tourne ; « Garder » sauvegarde ; puis la boutique (onglets, achat à l'argent du
# championnat, 📺 avec le faux SDK) ; rien ne déborde ; après rechargement, tout est là
# un clic par la page (element.click()) : sous swiftshader, l'aperçu 3D de « Ma voiture » (un second rendu) ralentit tant la page
# que le clic de Playwright attend plus de 30 s qu'elle lui réponde
def clic(pg, sel):
    pg.evaluate('s => document.querySelector(s).click()', sel)

# les réglages de la voiture (tour 50b, reglages-voiture.js, mes-reglages.js) : depuis le garage (page « Mon équipe »), « 🔩 Réglages » : quatre
# curseurs au milieu, « Réglage conseillé » grisé ; un curseur bougé change sa ligne d'effet et est sauvegardé pour ce circuit ; « Réglage
# conseillé » remet le milieu ; « Retour » : le garage ; au Grand Prix suivant, la voiture du joueur porte son réglage et les IA ont le leur
def reglages_voiture_ecran(pg, titre, l, h, page):
    suffixe = ('-en' if 'lang=en' in page else '') + ('-' + str(l) if l != 1280 else '')
    t(f'{titre} : le paddock', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 60000))
    pg.evaluate('() => { INTERFACE.pagePaddock("equipe"); montrerGarage(); }')
    t(f'{titre} : le garage a le bouton « Réglages »', attendre(pg, '() => JEU.ecran === "garage" && document.getElementById("boutonReglagesVoiture").textContent === texte("reglagesVoiture")'))
    clic(pg, '#boutonReglagesVoiture')
    ETAT = '''() => { const $ = id => document.getElementById(id), nom = circuitProchain(), s = SAUVEGARDE.championnat() || {};
      return { ecran: JEU.ecran, visible: !$("reglagesVoiture").classList.contains("cache"), garage: $("garage").classList.contains("cache"), lignes: document.querySelectorAll("#rvListe .rvLigne").length,
        curseurs: REGLAGES_VOITURE.NOMS.map(n => Number($("rvCurseur_" + n).value)), effets: REGLAGES_VOITURE.NOMS.map(n => $("rvEffet_" + n).textContent), conseilleGris: $("boutonRvConseille").disabled,
        titre: $("rvTitre").textContent, nom, sauve: s.reglagesVoiture ? s.reglagesVoiture[nom] || null : null }; }'''
    e = pg.evaluate(ETAT)
    t(f'{titre} : « Réglages » : quatre curseurs au milieu (le réglage conseillé, grisé), une ligne d’effet chacun, le nom du circuit',
      e['ecran'] == 'reglagesVoiture' and e['visible'] and e['garage'] and e['lignes'] == 4 and e['curseurs'] == [2, 2, 2, 2] and e['conseilleGris'] and len(set(e['effets'])) == 1 and e['effets'][0] and e['sauve'] is None, str(e))
    pg.evaluate('() => { for (const [n, c] of [["boite", 0], ["pression", 4]]) { const x = document.getElementById("rvCurseur_" + n); x.value = c; x.dispatchEvent(new Event("input")); } }')
    f = pg.evaluate(ETAT)
    t(f'{titre} : la boîte longue et la pression haute : leurs lignes d’effet changent, le réglage est sauvegardé pour ce circuit, « Réglage conseillé » n’est plus grisé',
      f['curseurs'] == [2, 0, 2, 4] and f['effets'][1] != e['effets'][1] and f['effets'][3] != e['effets'][3] and f['effets'][0] == e['effets'][0] and not f['conseilleGris']
      and f['sauve'] == {'freins': 2, 'boite': 0, 'suspensions': 2, 'pression': 4}, str(f))
    d = pg.evaluate(ECRAN_DEDANS, 'reglagesVoiture')
    coupe = pg.evaluate('() => [...document.querySelectorAll("#reglagesVoiture .rvNom, #reglagesVoiture .rvBout, #reglagesVoiture .rvEffet, #reglagesVoiture button")].filter(e => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map(e => e.id + " " + e.textContent)')
    t(f'{titre} : l’écran des réglages tient en {l}×{h}, son « Retour » compris, sans défilement ni texte coupé', not d['out'] and d['retour'] and pas_de_defilement(d['defile']) and not coupe, str([d, coupe]))
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, f'reglages-voiture{suffixe}.png'))
    clic(pg, '#boutonRvConseille')
    g = pg.evaluate(ETAT)
    t(f'{titre} : « Réglage conseillé » remet les quatre curseurs au milieu (sauvegardé) et se grise', g['curseurs'] == [2, 2, 2, 2] and g['conseilleGris'] and g['sauve'] is None and g['effets'] == e['effets'], str(g))
    pg.evaluate('() => { const x = document.getElementById("rvCurseur_suspensions"); x.value = 4; x.dispatchEvent(new Event("input")); }')
    clic(pg, '#boutonRvRetour')
    t(f'{titre} : « Retour » ramène au garage', attendre(pg, '() => JEU.ecran === "garage" && document.getElementById("reglagesVoiture").classList.contains("cache") && !document.getElementById("garage").classList.contains("cache")'))
    if l != 1280: return
    # au Grand Prix suivant : la voiture du joueur porte son réglage (les suspensions dures), les IA ont le leur
    pg.evaluate('() => { quitterGarage(); courseSuivante(); }')
    ok_ = attendre(pg, '() => JEU.joueur && JEU.plateau && (JEU.ecran === "qualif" || JEU.ecran === "course")', None, 60000)
    r = pg.evaluate('''() => ({ ecran: JEU.ecran, joueur: JEU.joueur.reglageVoiture || null, susp: JEU.joueur.rvSuspension, attendu: REGLAGES_VOITURE.effets({ suspensions: 4 }).suspension,
      ia: JEU.plateau.pilotes.filter(p => !p.humain && p.reglageVoiture).length, autres: JEU.joueur.rvBoite === undefined && JEU.joueur.rvAdherence === undefined && JEU.joueur.rvFrein === undefined })''') if ok_ else None
    t(f'{titre} : au Grand Prix suivant, la voiture du joueur porte son réglage (suspensions dures, rien d’autre) et les 19 IA ont choisi le leur',
      r is not None and r['joueur'] == {'freins': 2, 'boite': 2, 'suspensions': 4, 'pression': 2} and r['susp'] == r['attendu'] and r['autres'] and r['ia'] == 19, str(r))

def livree_ecran(pg, titre, l, h, page):
    suffixe = ('-en' if 'lang=en' in page else '') + ('-960' if l == 960 else '')
    def tient(sels):
        b = pg.evaluate('ss => ss.map(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })', sels)
        d = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
        return all(x is not None and x[0] >= -1 and x[1] >= -1 and x[2] <= l + 1 and x[3] <= h + 1 and x[2] > x[0] for x in b) and pas_de_defilement(d), str([b, d])
    t(f'{titre} : le paddock', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 30000))
    pg.evaluate('() => { ARGENT.crediter(JEU.championnat, 150000, "test"); SAUVEGARDE.ecrireChampionnat(JEU.championnat); }')
    t(f'{titre} : au paddock, « Ma voiture » est dans la page Mon équipe et « Ouvrir la boutique » dans la page Boutique (tour 48a)', attendre(pg, '() => JEU.ecran === "championnat" && INTERFACE.pageDe("boutonMaVoiture") === "equipe" && INTERFACE.pageDe("boutonBoutique") === "boutique" && document.getElementById("boutonMaVoiture").textContent === texte("maVoiture") && document.getElementById("boutonBoutique").textContent === texte("paddock_ouvrirBoutique")'))
    pg.evaluate('() => INTERFACE.pagePaddock("equipe")')
    CASE = '() => { const a = VOITURE3D.atlasLivrees, i = indiceJoueur(), t = a.t; return Array.from(a.ctx.getImageData((i % a.colonnes) * t, Math.floor(i / a.colonnes) * t, t, t).data).join(); }'
    case0 = pg.evaluate(CASE)
    clic(pg, '#boutonMaVoiture')
    e = pg.evaluate('''() => ({ ecran: JEU.ecran, visible: !document.getElementById("livree").classList.contains("cache"), garage: document.getElementById("garage").classList.contains("cache"),
      motifs: document.querySelectorAll("#livreeMotif option").length, bloques: [...document.querySelectorAll("#livreeMotif option")].filter(o => o.disabled).map(o => o.value).join(),
      c1: document.getElementById("livreeC1Ligne").classList.contains("cache"), note: document.getElementById("livreeNote").textContent, numero: String(PILOTE.joueur(JEU.championnat).numero),
      celebrations: document.querySelectorAll("#livreeCelebration option").length, apercu: !!VOITURE3D.apercuVoitureModele })''')
    t(f'{titre} : « Ma voiture » : les motifs (ceux des skins grisés), la couleur secondaire seule (la principale est celle de l’écurie), le numéro, les célébrations, la voiture en 3D',
      e['ecran'] == 'livree' and e['visible'] and e['garage'] and e['motifs'] == 11 and e['bloques'] == 'carbone,eclairs,galaxie,or,drapeau' and e['c1'] and e['numero'] in e['note'] and e['celebrations'] == 8 and e['apercu'], str(e))
    pg.select_option('#livreeMotif', 'flammes')
    pg.evaluate('() => { const c = document.getElementById("livreeC2"); c.value = "#111111"; c.dispatchEvent(new Event("input")); }')
    pg.select_option('#livreeCelebration', 'drapeau')
    t(f'{titre} : changer le motif et la couleur redessine la case de la voiture du joueur dans l’atlas des livrées, et sa célébration se joue sur l’aperçu',
      pg.evaluate(CASE) != case0 and attendre(pg, '() => CELEBRATION.enCours && CELEBRATION.enCours.nom === "drapeau" && CELEBRATION.enCours.modele === VOITURE3D.apercuVoitureModele'), str(pg.evaluate('() => CELEBRATION.enCours && CELEBRATION.enCours.nom')))
    ok_, det = tient(['#livreeTitre', '#livreeApercu', '#livreeMotif', '#livreeCelebration', '#boutonLivreeValider', '#boutonLivreeRetour'])
    t(f'{titre} : « Ma voiture » tient en {l}×{h}', ok_, det)
    pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(CAPTURES, f'livree{suffixe}.png'))
    clic(pg, '#boutonLivreeValider')
    t(f'{titre} : « Garder » écrit la livrée et la célébration dans le championnat sauvegardé, et revient au paddock (page Mon équipe)',
      attendre(pg, '() => { const j = PILOTE.joueur(SAUVEGARDE.championnat()); return JEU.ecran === "championnat" && INTERFACE.pageActive() === "equipe" && j.livree.motif === "flammes" && j.livree.couleur2 === 0x111111 && j.celebration === "drapeau" && !CELEBRATION.enCours && document.getElementById("livree").classList.contains("cache"); }'))
    # la boutique
    pg.evaluate('() => INTERFACE.pagePaddock("boutique")'); clic(pg, '#boutonBoutique')
    b = pg.evaluate('() => ({ ecran: JEU.ecran, onglets: document.querySelectorAll("#boutiqueConteneur .boutiqueOnglets button").length, lignes: document.querySelectorAll("#boutiqueConteneur .skin").length, solde: document.querySelector("#boutiqueConteneur .boutiqueSolde").textContent })')
    t(f'{titre} : la boutique (une seule : trois onglets), les livrées d’abord, le solde', b['ecran'] == 'boutique' and b['onglets'] == 3 and b['lignes'] == 5 and b['solde'] != '', str(b))
    solde0 = pg.evaluate('() => ARGENT.solde(JEU.championnat)')
    clic(pg, '#boutiqueConteneur .skin[data-id="livree_carbone"] button.acheter')
    t(f'{titre} : « Acheter » : le skin est à toi, le solde baisse de son prix, le championnat est sauvegardé',
      attendre(pg, '() => SAUVEGARDE.skins().includes("livree_carbone") && document.querySelector("#boutiqueConteneur .skin[data-id=\\"livree_carbone\\"]").dataset.etat === "possede"') and pg.evaluate('() => ARGENT.solde(SAUVEGARDE.championnat())') == solde0 - 60000,
      str(pg.evaluate('() => [SAUVEGARDE.skins(), ARGENT.solde(SAUVEGARDE.championnat())]')))
    clic(pg, '#boutiqueConteneur .skin[data-id="livree_galaxie"] button.pub')
    t(f'{titre} : 📺 : une pub récompensée (rewardedBreak, regardée jusqu’au bout) donne le skin pour toujours',
      attendre(pg, '() => SAUVEGARDE.skins().includes("livree_galaxie") && APPELS_SDK.includes("rewardedBreak")'), str(pg.evaluate('() => [SAUVEGARDE.skins(), APPELS_SDK]')))
    clic(pg, '#boutiqueConteneur .boutiqueOnglets button[data-type="casque"]')
    t(f'{titre} : l’onglet des casques', attendre(pg, '() => document.querySelectorAll("#boutiqueConteneur .skin").length === 3 && document.querySelector("#boutiqueConteneur .onglet.choisi").dataset.type === "casque"'))
    ok_, det = tient(['#boutiqueConteneur .boutiqueTitre', '#boutiqueConteneur .boutiqueOnglets', '#boutiqueConteneur .boutiqueListe', '#boutonBoutiqueRetour'])
    t(f'{titre} : la boutique tient en {l}×{h}', ok_, det)
    pg.wait_for_timeout(300)
    vu = pg.evaluate('() => [JEU.ecran, ...["boutique", "garage", "championnat", "livree", "pause"].filter(i => !document.getElementById(i).classList.contains("cache"))].join()')
    t(f'{titre} : au moment de la capture, la boutique est l’écran visible', vu == 'boutique,boutique', vu)
    clic(pg, '#boutonBoutiqueRetour')
    t(f'{titre} : « Retour » ramène au paddock, sur la page Boutique', attendre(pg, '() => JEU.ecran === "championnat" && INTERFACE.pageActive() === "boutique" && document.getElementById("boutique").classList.contains("cache")'))
    # après rechargement : la livrée, la célébration et les skins sont là ; le motif acheté n'est plus grisé
    pg.reload()
    attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat"', None, 30000)
    # (la capture de la boutique : avant d'ouvrir « Ma voiture », dont le second rendu WebGL fige l'image des captures sous swiftshader)
    pg.evaluate('() => INTERFACE.pagePaddock("boutique")'); clic(pg, '#boutonBoutique'); clic(pg, '#boutiqueConteneur .boutiqueOnglets button[data-type="casque"]')
    pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(CAPTURES, f'boutique{suffixe}.png'))
    clic(pg, '#boutonBoutiqueRetour'); clic(pg, '#boutonMaVoiture')
    r = pg.evaluate('() => ({ motif: document.getElementById("livreeMotif").value, cel: document.getElementById("livreeCelebration").value, carbone: document.querySelector("#livreeMotif option[value=carbone]").disabled, galaxie: document.querySelector("#livreeMotif option[value=galaxie]").disabled, atlas: VOITURE3D.atlasLivrees.livrees[indiceJoueur()].motif })')
    t(f'{titre} : après rechargement : la livrée (flammes, aussi sur la voiture), la célébration et les skins obtenus (plus grisés)', r == {'motif': 'flammes', 'cel': 'drapeau', 'carbone': False, 'galaxie': False, 'atlas': 'flammes'}, str(r))

# les appels de dessin d'une course de 10 voitures, la même image avec et sans livrée (?livree=0) : aucun en plus (une texture, un matériau)
def livree_appels(pg, titre, page):
    MES = '''() => { BOUCLE.arreter(); const c = SCENE3D.camera, x = CIRCUIT.x[0], z = CIRCUIT.z[0]; c.position.set(x + 40 * CIRCUIT.nx[0], 30, z + 40 * CIRCUIT.nz[0]); c.lookAt(x, 0, z); c.updateMatrixWorld();
      SCENE3D.dessiner(); return { appels: SCENE3D.appelsDessin, voitures: JEU.modeles.map(m => VOITURE3D.appels(m)).join(), atlas: !!VOITURE3D.atlasLivrees, triangles: VOITURE3D.triangles(JEU.modele) }; }'''
    attendre(pg, '() => JEU.modeles.length === 10 && SCENE3D.trianglesDessines > 5000', None, 30000)
    avec = pg.evaluate(MES)
    pg.screenshot(path=os.path.join(CAPTURES, 'livree-grille.png'))
    pg.goto('file://' + RACINE + '/' + page + '&livree=0'); pg.wait_for_timeout(1500)
    attendre(pg, '() => JEU.modeles.length === 10 && SCENE3D.trianglesDessines > 5000', None, 30000)
    sans = pg.evaluate(MES)
    L.append(f"  (livrées : {avec['appels']} appels de dessin avec, {sans['appels']} sans ; la voiture du joueur {avec['triangles']} triangles avec, {sans['triangles']} sans)")
    t(f'{titre} : avec les livrées, la même image a autant d’appels de dessin que sans (6 par voiture), une seule texture pour toutes', avec['atlas'] and not sans['atlas'] and avec['appels'] == sans['appels'] and avec['voitures'] == sans['voitures'] == ','.join(['6'] * 10), str([avec, sans]))

# l'essai d'un skin avant l'achat : seul sur le circuit de test, hors championnat (aucun record), la célébration du skin à l'arrivée, le résumé
# vidéo de l'essai, puis « Acheter » (l'argent du championnat) : la page revient au paddock, la boutique ouverte, le skin à toi
def essai_ecran(pg, titre):
    pg.evaluate('''() => { const ch = CHAMPIONNAT.creer(1); CASQUE.completer(ch); const j = PILOTE.joueur(ch); j.nom = "Léa"; j.numero = 27; j.pays = "it"; j.coeur = "monzo";
      ARGENT.crediter(ch, 100000, "test"); SAUVEGARDE.ecrireChampionnat(ch); SAUVEGARDE.finirDecouverte(0); }''')
    pg.reload(); pg.wait_for_timeout(1000)
    e = pg.evaluate('() => ({ essai: ESSAI && ESSAI.id, plateau: !!JEU.plateau, bandeau: !document.getElementById("essaiBandeau").classList.contains("cache") && document.getElementById("essaiBandeau").textContent, numero: VOITURE3D.atlasLivrees.livrees[0].numero, circuit: NOM_CIRCUIT })')
    t(f'{titre} : l’essai : seul (aucune IA) sur le circuit de test, le bandeau « rien n’est compté », la voiture du joueur (son numéro)', e['essai'] == 'celebration_feux' and not e['plateau'] and e['bandeau'] and e['numero'] == '27' and e['circuit'] == 'test', str(e))
    # le robot conduit : après le GO, la physique avance sans affichage jusqu'à juste après l'arrivée (BOUCLE.simuler, comme course_robot)
    attendre(pg, '() => JEU.course && JEU.course.etat === "course"', None, 30000)
    pg.evaluate('() => { for (let i = 0; i < 300 && JEU.course.etat !== "finie"; i++) BOUCLE.simuler(0.5); }')
    t(f'{titre} : à l’arrivée, la célébration du skin (feu d’artifice) se joue sur la voiture', attendre(pg, '() => JEU.course && JEU.course.etat === "finie" && CELEBRATION.enCours && CELEBRATION.enCours.nom === "feux" && CELEBRATION.enCours.modele === JEU.modele', None, 20000),
      str(pg.evaluate('() => [JEU.ecran, JEU.course && JEU.course.etat, CELEBRATION.enCours && CELEBRATION.enCours.nom]')))
    pg.wait_for_timeout(800); pg.screenshot(path=os.path.join(CAPTURES, 'essai-celebration.png'))
    t(f'{titre} : puis le résumé vidéo de l’essai ; aucun record n’est gardé', attendre(pg, '() => JEU.ecran === "resume"', None, 60000) and pg.evaluate('() => Object.keys(SAUVEGARDE.lire().records).length === 0'), str(pg.evaluate('() => [JEU.ecran, SAUVEGARDE.lire().records]')))
    pg.wait_for_timeout(1500); pg.screenshot(path=os.path.join(CAPTURES, 'essai-resume.png'))
    pg.keyboard.press('Escape')
    t(f'{titre} : la fin de l’essai : « Acheter · 80 000 € » et « Retour à la boutique »', attendre(pg, '() => JEU.ecran === "essaiFin" && !document.getElementById("essaiFin").classList.contains("cache") && /80/.test(document.getElementById("boutonEssaiAcheter").textContent) && document.getElementById("boutonEssaiRetour").textContent === texte("essaiRetour")'),
      str(pg.evaluate('() => [JEU.ecran, document.getElementById("boutonEssaiAcheter").textContent]')))
    pg.screenshot(path=os.path.join(CAPTURES, 'essai-fin.png'))
    try:
        with pg.expect_navigation(timeout=30000): clic(pg, '#boutonEssaiAcheter')
    except Exception as x:
        t(f'{titre} : « Acheter » recharge la page', False, str(x)[:200] + ' ' + str(pg.evaluate('() => [JEU.ecran, document.getElementById("essaiFinMessage").textContent, SAUVEGARDE.skins()]')))
        return
    t(f'{titre} : « Acheter » : la page revient au paddock, la boutique ouverte sur les célébrations, le skin à toi, 80 000 € de moins',
      attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "boutique" && document.querySelector("#boutiqueConteneur .onglet.choisi").dataset.type === "celebration" && SAUVEGARDE.skins().includes("celebration_feux") && ARGENT.solde(JEU.championnat) === 20000', None, 30000),
      str(pg.evaluate('() => typeof JEU !== "undefined" && [JEU.ecran, SAUVEGARDE.skins(), JEU.championnat && ARGENT.solde(JEU.championnat)]')))

# ECRANS_TRANCHE=k/n (GitHub, les travaux en parallèle) : seulement la k-ième tranche des pages sur n (une page sur n, à partir de la k-ième) ;
# chaque page a son propre contexte de navigateur, les tranches sont indépendantes
# (tour 48c-2) les pages sont réparties par leur durée mesurée sur GitHub (tests/ecrans-durees.json, « adresse largeur » → secondes ;
# une page nouvelle compte DUREE_INCONNUE s) : la plus longue d'abord dans la tranche la moins chargée, chaque tranche garde l'ordre de PAGES
DUREE_INCONNUE = 30
if os.environ.get('ECRANS_TRANCHE'):
    k_, n_ = (int(x) for x in os.environ['ECRANS_TRANCHE'].split('/'))
    try: DUREES_PAGES = json.load(open(os.path.join(RACINE, 'tests', 'ecrans-durees.json'), encoding='utf-8'))
    except (OSError, ValueError): DUREES_PAGES = {}
    charges, tranche_de = [0] * n_, {}
    for i in sorted(range(len(PAGES)), key=lambda i: (-DUREES_PAGES.get(f'{PAGES[i][0]} {PAGES[i][1]}', DUREE_INCONNUE), i)):
        k = charges.index(min(charges)); tranche_de[i] = k; charges[k] += DUREES_PAGES.get(f'{PAGES[i][0]} {PAGES[i][1]}', DUREE_INCONNUE)
    print(f'(tranche {k_}/{n_} : {charges[k_ - 1]} s prévues)')
    PAGES = [x for i, x in enumerate(PAGES) if tranche_de[i] == k_ - 1]
if os.environ.get('ECRANS_PAGES'): PAGES = [x for x in PAGES if os.environ['ECRANS_PAGES'] in x[0]]   # (tour 51k) sur le Mac : seulement les pages dont l'adresse contient ce texte
DUREES = []   # (page, largeur, secondes) : imprimées à la fin
mesures = None
mesures_voiture = []
os.makedirs(CAPTURES, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-audio-output'])
    try:
        for page, l, h, capture in PAGES:
            titre = f'{page} {l}×{h}'
            debut_page = time.monotonic()   # (la durée de chaque page, pour équilibrer les tranches de GitHub)
            ctx = b.new_context(viewport={'width': l, 'height': h}, has_touch='test=tactile' in page)   # (le téléphone, tour 51k : un écran tactile émulé pour ces pages seulement)
            pg = ctx.new_page(); console = []
            # les tâches longues (> 50 ms) qui bloquent la page, relevées dès le début du chargement
            pg.add_init_script('window.__longues = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__longues.push(e.duration); }).observe({ entryTypes: ["longtask"] });')
            # sauf l'avertissement du pilote graphique quand Playwright fait une capture (le jeu ne lit jamais les pixels) :
            # seulement ce message exact (l'adresse entre crochets change), tout autre message reste une erreur
            pg.on('console', lambda m: console.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and not LECTURE_PIXELS.fullmatch(m.text) else None)
            pg.on('pageerror', lambda e: console.append('PAGEERROR ' + str(e)))
            pg.on('requestfailed', lambda r: console.append('FICHIER MANQUANT ' + r.url))
            if 'test=sdk' in page or 'test=decouverte' in page or 'test=amis' in page or 'test=tournoi' in page or 'test=livree' in page or 'test=essai' in page: pg.add_init_script(FAUX_SDK)
            # la météo dessinée (meteo3d.js) : une fausse météo de test (window.METEO_TEST, jamais dans le jeu), ?meteo=pluie ou ?meteo=risque
            if 'test=manette' in page: pg.add_init_script(FAUSSES_MANETTES)   # la manette (tour 38) : de fausses manettes
            pg.add_init_script('window.__plein = 0; try { Element.prototype.requestFullscreen = function () { window.__plein++; return Promise.resolve(); }; } catch (e) {} try { screen.orientation.lock = () => { window.__plein++; return Promise.resolve(); }; } catch (e) {}')   # (tour 52b : combien de fois le plein écran ou le verrou en paysage est demandé)
            if 'test=tactile' in page and 'test=tactile-iphone' not in page: pg.add_init_script('try { DeviceOrientationEvent.requestPermission = undefined; } catch (e) {}')   # (tour 52b : un Chrome récent sur GitHub offre requestPermission, jamais résolue sans geste : ces pages simulent un Android, sans autorisation à demander)
            if 'test=tactile-iphone' in page: pg.add_init_script(FAUSSE_PERMISSION)   # le téléphone (tour 51k) : l'autorisation de l'iPhone, accordée ou refusée (sessionStorage perm)
            if 'meteo=pluie' in page: pg.add_init_script('window.METEO_TEST = { etat: () => ({ pluie: 0.85, eau: 0.75, eauTrajectoire: 0.35, ciel: 0.9 }), prevision: () => ({ type: "pluie", risque: 90 }) };')
            if 'meteo=risque' in page: pg.add_init_script('window.METEO_TEST = { etat: () => ({ pluie: 0, eau: 0, ciel: 0 }), prevision: () => ({ type: "risque", risque: 40 }) };')
            # le tournoi change de page entre deux manches : les pubs sont aussi comptées dans sessionStorage (qui survit au rechargement)
            if 'test=tournoi' in page: pg.add_init_script("const __cb = PokiSDK.commercialBreak; PokiSDK.commercialBreak = function () { sessionStorage.setItem('pubs', String((+sessionStorage.getItem('pubs') || 0) + 1)); return __cb.call(this); };")
            pg.goto('file://' + RACINE + '/' + page); pg.wait_for_timeout(1500)
            t(f'{titre} : console vide', not console, ' | '.join(console)[:500])
            defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
            t(f'{titre} : pas de défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
            t(f'{titre} : la scène 3D a démarré', pg.evaluate('() => SCENE3D.actif && !!document.querySelector("#scene3d canvas")'))
            t(f'{titre} : le circuit est dessiné', attendre(pg, '() => SCENE3D.trianglesDessines > 5000', None, 30000), f'{pg.evaluate("() => SCENE3D.trianglesDessines")} triangles')
            if mesures is None: mesures = pg.evaluate('() => SCENE3D.infoCircuit')

            t(f'{titre} : le panneau de réglage n’existe que avec ?reglages=1', pg.evaluate('() => !!document.getElementById("reglages")') == ('reglages=1' in page))
            # le téléphone (tactile.js, tour 51k) : sur un écran sans tactile, rien ne s'affiche et rien n'est branché
            if 'test=tactile' not in page:
                pg.evaluate("() => { document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); document.body.click(); }"); pg.wait_for_timeout(100)
                t(f'{titre} : sans écran tactile, aucun plein écran ni verrou en paysage n’est jamais demandé', pg.evaluate('() => window.__plein === 0'), str(pg.evaluate('() => window.__plein')))
                t(f'{titre} : sans écran tactile, aucun bouton tactile (ni GAZ / FREIN, ni ◀ ▶, ni « Activer le volant »), rien n’est branché', pg.evaluate('() => typeof TACTILE === "undefined" || !TACTILE.estPresent() && TACTILE.etat.mode === "aucun" && ["tactile", "tactileActiver", "tactilePortrait", "boutonVolantPause", "boutonRecentrerPause"].every(id => document.getElementById(id).classList.contains("cache"))'), str(pg.evaluate('() => typeof TACTILE === "undefined" ? "pas de TACTILE" : [TACTILE.estPresent(), TACTILE.etat.mode, navigator.maxTouchPoints]')))
            if page == 'index.html?seul=1' and l == 1280:
                conduite(pg, titre)
            if page == 'index.html':
                t(f'{titre} : la page nue, sans sauvegarde : l’écran titre (« ▶ Jouer », « 👥 Entre amis »), pas de qualification ni d’écran de choix', pg.evaluate('() => JEU.ecran === "titre" && JEU.decouverte && !document.getElementById("titre").classList.contains("cache") && document.getElementById("choix").classList.contains("cache") && document.getElementById("boutonJouer").textContent === texte("titreJouer")'), str(pg.evaluate('() => [JEU.ecran, JEU.decouverte]')))
                if l == 960:
                    # une ancienne sauvegarde : un championnat déjà commencé, sans pilote créé → la création est demandée une fois, en 960×600 sans défilement
                    pg.evaluate('() => { const ch = CHAMPIONNAT.creer(1); ch.prochain = 2; localStorage.setItem(SAUVEGARDE.CLE, JSON.stringify({ version: 3, records: {}, championnat: ch })); }')   # (une sauvegarde d'avant : sans decouverteFaite ni argent)
                    pg.reload()
                    t(f'{titre} : une ancienne sauvegarde (championnat sans pilote) se charge et demande la création du pilote, une fois', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "pilote" && SAUVEGARDE.decouverteFaite() && !JEU.decouverte', None, 60000), str(pg.evaluate('() => [JEU.ecran, SAUVEGARDE.decouverteFaite()]')))
                    defile = pg.evaluate('() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]')
                    t(f'{titre} : l’écran de création tient en 960×600 sans défilement', defile[0] <= defile[1] + 2 and defile[2] <= defile[3] + 2, str(defile))
                    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAPTURES, 'pilote-960.png'))
                    pg.select_option('#pilotePays', 'jp')
                    with pg.expect_navigation(): pg.click('#boutonPiloteValider')
                    t(f'{titre} : validée (Japon → 🏠 Suzuko d’office), la page revient au paddock, Grand Prix 3, et ne redemande plus la création', attendre(pg, '() => typeof JEU !== "undefined" && JEU.ecran === "championnat" && JEU.championnat.prochain === 2 && PILOTE.joueur(JEU.championnat).coeur === "suzuko" && PILOTE.joueur(JEU.championnat).pays === "jp"', None, 60000), str(pg.evaluate('() => [JEU.ecran, PILOTE.joueur(JEU.championnat)]')))
            if 'test=decouverte' in page:
                decouverte(pg, titre)
            if 'reglages=1' in page:
                reglages_panneau(pg, titre)
                reglages(pg, titre)
            if 'test=audit' not in page and 'test=seuldefi' not in page and 'test=essai' not in page and 'robot=1' in page and 'championnat=1' not in page and 'joueur=1' not in page and 'test=sdk' not in page and 'pneus=1' not in page and 'test=decouverte' not in page and 'test=deux' not in page:   # (avec ?championnat=1 ou &joueur=1, le robot joue dans championnat() ou qualif() ; sdk() et pneus() ont leur page)
                course_robot(pg, titre, page)
            if 'test=sdk' in page:
                sdk(pg, titre)
            if 'test=deux' in page:
                deux_ecran(pg, titre, l, h, page)
            if 'test=amis' in page:
                amis(pg, titre, l, h)
            if 'test=touches' in page:
                touches_deux(pg, titre, l, h)
            if 'test=suivie' in page:
                camera_suivie(pg, titre, page)
            if 'test=tournoi' in page:
                tournoi(pg, titre, l, h)
            if 'test=volant' in page:
                volant(pg, titre, l, h)
            if 'pneus=1' in page and 'test=stand' not in page and 'test=hudcourse' not in page and 'test=audit' not in page:
                pneus(pg, titre)
            if 'test=stand' in page:
                stand_ecran(pg, titre)
            if 'test=officiel' in page:
                officiel_ecran(pg, titre, re.search(r'circuit=(\w+)', page).group(1))
            if re.search(r'[?&]ia=1(&|$)', page) and 'tutoriel=' not in page:   # (une leçon du tutoriel avec une IA : tuto_lecon)
                course_ia(pg, titre)
            if re.search(r'[?&]ia=10(&|$)', page):
                course_ia10(pg, titre)
            if 'course=1&ia=8' in page:
                course_podium(pg, titre, l)
            if 'test=commentaire' in page:
                commentaire_ecran(pg, titre)
            if 'test=supporters' in page:
                supporters_ecran(pg, titre)
            if 'test=sensations' in page:
                sensations_ecran(pg, titre)
            if 'test=conseil' in page:
                conseil_ecran(pg, titre, page)
            if 'test=qualite' in page:
                qualite_ecran(pg, titre, page)
            if 'test=retro' in page:
                retro_ecran(pg, titre, l, h)
            if 'test=assistance' in page:
                assistance_ecran(pg, titre, page)
            if 'test=son' in page:
                son_ecran(pg, titre)
            if 'test=livree-appels' in page:
                livree_appels(pg, titre, page)
            elif 'test=livree' in page:
                livree_ecran(pg, titre, l, h, page)
            if 'test=reglages-voiture' in page:
                reglages_voiture_ecran(pg, titre, l, h, page)
            if 'test=essai' in page:
                essai_ecran(pg, titre)
            if 'mesure=1' in page:
                mesure_ecran(pg, titre)
            elif 'test=' not in page and 'mesure' not in page and l == 1280 and page.startswith('index.html?course='):
                t(f'{titre} : sans ?ips ni ?mesure, ni compteur ni panneau de mesure (aucun coût)', pg.evaluate('() => !document.getElementById("compteurIps") && !document.getElementById("mesurePanneau")'))
            if 'test=tactile' in page:
                tactile_ecran(pg, titre, l, h, page)
            if 'test=manette-deux' in page:
                manette_deux(pg, titre)
            elif 'test=manette' in page:
                manette_ecran(pg, titre)
            if 'test=tele' in page:
                tele_ecran(pg, titre)
            if 'test=pluie' in page:
                pluie_ecran(pg, titre, l, h)
            if 'test=prevision' in page:
                prevision_ecran(pg, titre)
            elif 'test=livree' in page or 'test=essai' in page or 'test=reglages-voiture' in page: pass   # (la personnalisation : ses fonctions à elle, plus haut ; + les réglages de la voiture, tour 50b)
            elif 'test=aides-course' in page:
                aides_course(pg, titre, l, h)
            elif 'test=fond' in page:
                fond_ecran(pg, titre, l, h)
            elif 'test=paddock' in page:
                paddock_menu(pg, titre, l, h, 'en' if 'lang=en' in page else 'fr')
            elif 'test=aides-menus' in page:
                aides_menus(pg, titre, l, h)
            elif 'test=aides-consigne' in page:
                aides_consigne(pg, titre, l, h)
            elif 'test=tuto-menu' in page:
                tuto_menu(pg, titre, l, h)
            elif 'test=tuto' in page:
                tuto_lecon(pg, titre, l, h, page)
            elif 'test=audit' in page:
                audit_autres(pg, titre, page, l, h)
            elif 'test=longueurs' in page:
                longueurs_ecran(pg, titre, l, h)
            elif 'test=apres-course' in page:
                apres_course(pg, titre, l, h)
            elif 'test=titre-simple' in page:
                titre_simple(pg, titre, l, h)
            elif 'test=clavier-titre' in page:
                clavier_titre(pg, titre, l, h)
            elif 'test=clavier-pause' in page:
                clavier_pause(pg, titre, l, h)
            elif 'test=clavier' in page:
                clavier_ecran(pg, titre, l, h)
            elif 'test=patron' in page:
                patron_ecran(pg, titre, l, h, page)
            elif 'test=discussion' in page:
                discussion_ecran(pg, titre, l, h, page)
            elif 'gp=12' in page and 'lang=en' in page:
                audit_en(pg, titre, l)
            elif 'gp=12' in page:
                fin_saison(pg, titre, l)
            elif 'test=tactile-classement' in page: pass   # (sa page à lui : tactile_ecran, plus bas)
            elif 'championnat=1' in page and 'lang=en' in page:
                championnat_en(pg, titre)
            elif 'test=consigne' in page:
                consigne_ecran(pg, titre, 'suivie' in page)
            elif 'test=accelere' in page:
                accelere(pg, titre, page)
            elif 'championnat=1' in page:
                championnat(pg, titre, l)
            if 'test=accelere' in page or 'test=audit' in page or 'test=suivie' in page or 'test=livree' in page or 'test=essai' in page or 'test=reglages-voiture' in page: pass   # (test=suivie : sa page à lui, plus haut ; sinon hud() recommencerait la qualification après le podium)
            elif 'test=aides' in page or 'test=tuto' in page: pass   # (les aides et le tutoriel : leurs pages à eux, plus haut)
            elif 'test=hudcourse' in page:
                hud_course(pg, titre, l, h)
            elif 'test=decor' in page:
                decor_ecran(pg, titre, l, h)
            elif 'test=jeudecor' in page:
                decor_jeu(pg, titre, page)
            elif 'tests/lieu.html' in page:
                lieu_ecran(pg, titre, page)
            elif 'test=resume' in page:
                resume_ecran(pg, titre, l, h)
            elif 'test=qualif' in page:
                qualif(pg, titre)
            elif 'test=seuldefi' in page:
                defi_seul(pg, titre)
            elif 'test=defi' in page:
                defi_ecran(pg, titre)
            elif 'test=fantome' in page:
                fantome(pg, titre)
            elif 'joueur=1' in page and 'test=supporters' not in page and 'test=sensations' not in page and 'test=conseil' not in page and 'test=qualite' not in page and 'test=retro' not in page:   # (la page des supporters a son propre parcours)
                hud(pg, titre, l)
                if l == 1280: course_joueur(pg, titre)
            if 'camera=auto' in page:
                p1 = pg.evaluate(POSITION)
                t(f'{titre} : la caméra fait le tour toute seule', attendre(pg, 'p => CAMERA.position.x !== p.x || CAMERA.position.z !== p.z', p1), str(p1))
            if 'camera=libre' in page:
                p1 = pg.evaluate(POSITION)
                pg.wait_for_timeout(500)
                t(f'{titre} : sans touche, la caméra libre ne bouge pas', pg.evaluate(POSITION) == p1)
                pg.keyboard.down('ArrowUp')
                bouge = attendre(pg, 'p => Math.hypot(CAMERA.position.x - p.x, CAMERA.position.z - p.z) > 1', p1)
                pg.keyboard.up('ArrowUp')
                t(f'{titre} : la flèche ↑ fait avancer la caméra', bouge, f'{p1} → {pg.evaluate(POSITION)}')
                p2 = pg.evaluate(POSITION)
                pg.mouse.move(l / 2, h / 2); pg.mouse.wheel(0, -400)
                t(f'{titre} : la molette rapproche la caméra', attendre(pg, 'p => CAMERA.position.y < p.y - 1', p2), f'{p2} → {pg.evaluate(POSITION)}')
                t(f'{titre} : en caméra libre, les flèches ne font pas rouler la voiture', pg.evaluate('() => JEU.joueur.u') == 0)
            # la vraie capture de l'écran : on laisse passer quelques images d'abord
            pg.wait_for_timeout(500)
            if capture: pg.screenshot(path=os.path.join(CAPTURES, capture))
            ips = pg.evaluate('() => { const e = document.getElementById("ips"); return e.classList.contains("cache") ? null : e.textContent; }')
            if 'debug=1' in page:
                attendre(pg, '() => /triangles/.test(document.getElementById("ips").textContent)')
                ips = pg.evaluate('() => document.getElementById("ips").textContent')
                m = re.fullmatch(r'\d+ i/s · \d+ triangles · (\d+) appels\ndérive (-?[\d.]+)° · ([\d.]+) g · voiture (\d+) triangles, (\d+) appels(?: · pneus \d+ %)?', ips or '')
                t(f'{titre} : images par seconde, triangles, dérive, g latéraux et triangles d’une voiture affichés', bool(m), repr(ips))
                if m:
                    # (avec ?ia=10, la voiture suivie roule : ni « à l'arrêt », ni la mesure d'une voiture seule)
                    if 'ia=10' not in page and 'pneus=1' not in page:   # (avec ?pneus=1, le robot a roulé)
                        t(f'{titre} : à l’arrêt, 0° de dérive et 0 g', float(m.group(2)) == 0 and float(m.group(3)) == 0, repr(ips))
                        mesures_voiture.append((int(m.group(4)), int(m.group(5)), int(m.group(1))))
                    t(f'{titre} : une voiture fait au plus 7 appels de dessin et moins de 1500 triangles', int(m.group(5)) <= 7 and int(m.group(4)) < 1500, repr(ips))
                    if 'ia=10' in page:
                        t(f'{titre} : les IA gardent le modèle léger (moins de triangles que la voiture du joueur)', not pg.evaluate('() => JEU.modeles.some(m => m.detaille)') and pg.evaluate('() => VOITURE3D.triangles(JEU.modeles[0]) < VOITURE3D.triangles(VOITURE3D.creer(0xffffff, true))'), repr(ips))
                    else:
                        t(f'{titre} : la voiture du joueur est la voiture détaillée', pg.evaluate('() => JEU.modele.detaille'))
            else: t(f'{titre} : sans debug, pas de compteur', ips is None, repr(ips))
            ctx.close()
            DUREES.append((page, l, round(time.monotonic() - debut_page)))
    finally:
        b.close()

print(f'RESULTAT {ok}/{ok + ko}'); print('\n'.join(L))
for page_, l_, d_ in DUREES: print(f'  ⏱ {d_} s : {page_} {l_}')
if mesures_voiture: print(f'  (une voiture : {mesures_voiture[0][0]} triangles, {mesures_voiture[0][1]} appels de dessin ; toute l’image : {mesures_voiture[0][2]} appels)')
if mesures: print(f'  (circuit 3D : {mesures["triangles"]:.0f} triangles, construit en {mesures["msConstruction"]:.0f} ms sous swiftshader)')
sys.exit(0 if ko == 0 else 1)
