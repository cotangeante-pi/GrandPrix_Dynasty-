TOUR 23b — étapes 5 → 6 — Codeur 2 : en piste en 10 secondes, puis la création du pilote — rapport du Chef
Chef : session-5b. Base : main 5bb3484 (ton tour 22b fusionné). Note : 74/100 (conduite 12, course et IA 18, championnat 8, interface 14, 3D et perf 9, code et tests 10, Poki 3).
Commit vérifié : 6d150d0 (GitHub 40037491667, TOUT PASSE) ; diff relu : physique.js = 2 lignes (× 1), aucun seuil de test touché, les tests des feux remplacés par les deux départs joués (accepté : le faux départ par anticipation est testé en calcul pur). Captures depart.png, fantome.png, qualif.png relues.
Ce qui manque ou ne va pas :
- fantome.png ne montre pas le fantôme : à +1,07 s il devrait être ~55 m devant, et on ne voit qu'un point à l'horizon. Peut-être la transparence sous swiftshader, peut-être une position fausse. À prouver par une capture et un test (ordre 1).
- Le chemin du joueur pour un faux départ (touche avant l'extinction → pénalité affichée) n'est plus testé dans la page. Petit (ordre 1).
- La sauvegarde reste en v3 avec des champs ajoutés s'ils manquent : accepté et écrit dans CLAUDE.md. Pas de v4.

ORDRES

1. Finitions du tour 22b (petit) :
   a) un test d'écran où le fantôme est PROUVÉ visible : 2e tour de qualification, capture `fantome-proche.png` prise ~1 s après la ligne (le fantôme à quelques mètres devant), et un contrôle en pixels : dans la moitié basse de l'image, des pixels de FANTOME_COULEUR (ou de sa teinte mélangée) existent, en nombre > un seuil de donnees.js ; si le fantôme n'est pas visible, c'est un défaut à corriger (position, matériau, ordre de dessin), pas le test ;
   b) un test d'écran : appuyer sur ↑ 0,3 s AVANT l'extinction = faux départ, la voiture part, « ✂ +5 s » affiché, et la pénalité est dans le classement final.
   Fini quand : les deux tests sont verts sur GitHub, capture fantome-proche.png jointe.

2. EN PISTE EN 10 SECONDES (CLAUDE.md, « En piste en 10 secondes ») : le premier lancement sans sauvegarde :
   - un écran titre très court (nom du jeu par sa clé, bouton « ▶ Jouer », et le petit bouton « 👥 Entre amis » qui, pour l'instant, ouvre un petit écran « bientôt » : le mode 2 joueurs et le tournoi n'existent pas encore ; ne les fais pas) ;
   - un clic → directement la grille de la COURSE DE DÉCOUVERTE : 3 tours (DECOUVERTE_TOURS), 6 IA (DECOUVERTE_IA) au niveau débutant, circuit DECOUVERTE_CIRCUIT (= test pour l'instant), le joueur au milieu de la grille, nom « Toi » / « You », pas de qualification, pas d'interview ni de une ; les IA sont des pilotes du monde (le championnat est créé au premier lancement avec sa graine, et les 6 IA sont 6 de ses pilotes) ;
   - les aides en surimpression pendant les premiers virages (« ↑ accélérer », « ← → tourner », « ↓ freiner », et celle du départ), chacune disparaît quand sa touche a servi, toutes au plus tard à la fin du premier tour ; « ↑ » clignote doucement si le joueur ne touche à rien sur la grille ;
   - à l'arrivée : le podium, puis l'écran « Bravo ! Prêt pour ta carrière ? » qui mène à l'écran du championnat existant (?championnat=1 devient le chemin normal ; la création du pilote vient à l'ordre 3) ; sa place donne un peu d'argent de départ (DECOUVERTE_ARGENT par place, plafond), gardé dans la sauvegarde (champ argent, pas encore dépensable) ; aucun point de championnat ;
   - les lancements suivants (sauvegarde avec « decouverteFaite ») arrivent directement au paddock = l'écran du championnat avec « Continuer » ; une ancienne sauvegarde avec un championnat compte comme découverte faite ;
   - la mesure : temps du clic sur « ▶ Jouer » à l'extinction des feux, prise par ecrans.py et donnée dans le compte rendu (but : ≤ 10 s ; aujourd'hui la carte de l'IA se calcule en fond : si c'est plus long, dis combien, ne triche pas) ;
   - Poki : gameLoadingFinished une fois à l'écran titre, gameplayStart aux feux éteints, gameplayStop au podium ; aucun commercialBreak (vérifié avec le faux SDK).
   Fini quand : les tests de CLAUDE.md pour cette section (sans sauvegarde, « ▶ Jouer » mène à la grille sans autre écran ; temps mesuré ; aides qui disparaissent ; 3 tours, 6 IA débutant ; l'arrivée mène à « Prêt pour ta carrière ? » ; argent de départ selon la place et plafond ; aucun point ; au lancement suivant le paddock ; aucun commercialBreak) ; captures titre.png, decouverte.png (avec les aides), bravo.png ; 960×600 et 1280×720 sans défilement ; console vide ; GitHub vert.

3. LA CRÉATION DU PILOTE (étape 6, sans le casque 3D pour l'instant) : après « Prêt pour ta carrière ? » : nom (texte, 12 caractères max, « Toi » par défaut), numéro (1–99, pas celui d'un rival), pays (liste dans donnees.js : noms de pays réels, par clé de textes.js), et la course de cœur (liste des 12 circuits de donnees.js, CIRCUITS_PAYS circuit ↔ pays ; si le pays du joueur a un circuit, il est choisi d'office et montré 🏠) ; tout dans la sauvegarde unique ; le nom et le numéro remplacent « Toi » / n°20 partout (tour, podium, journal, duel). Le casque viendra dans un autre tour.
   Fini quand : tests moteur (numéro refusé s'il est pris, pays avec circuit → domicile d'office, pays sans circuit → course de cœur demandée, sauvegarde → rechargement identique, ancienne sauvegarde sans pilote se charge et demande la création une fois) ; ecrans.py joue la création et vérifie le nom dans la tour et sur la une ; capture pilote.png ; 960×600 ; console vide ; GitHub vert.

RÈGLES : les mêmes (fichiers partagés en blocs ; ni ia.js, ni simulation.js, ni circuits.js, ni journal.js/championnat.js sauf un petit accès lecture pour le nom du joueur, dis-le ; `git merge origin/main` avant chaque push ; vert = 0 échec ; CLAUDE.md pas touché). Horaires : jusqu'à nouvel ordre du propriétaire. Un push + un message au Chef par ordre vert ; compte rendu rapports/tour-23b-compte-rendu.md à la fin.
Questions pour le propriétaire (le Codeur n'y répond pas) : la sensation du départ et la visibilité du fantôme (SUIVI.md, « À essayer »).
