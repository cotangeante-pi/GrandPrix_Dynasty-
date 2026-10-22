TOUR 18 — compte rendu du Codeur (session-dd)
Commits sur main, tous verts (suite complète avant chacun) :
- 2a500e5 « Tour 18 : radar et classement » (ajout 1) ;
- 3077e74 « Tour 18 : le podium » (ajout 2, règle du propriétaire sur les pénalités, départ corrigé) ;
- 16165f5 « Tests : lancer une partie » ;
- 9f29dbf « Tour 18 : la course attend la carte des IA » (ordre 0) ;
- main = bf3b57d (avance rapide sur codeur2, vue cockpit et feux d'session-9e), puis 5ef1216 (Chef) ;
- f4e455c « Tour 18 : les erreurs des pilotes » (ordre 1).

Ordres : AJOUT 1 fait / AJOUT 2 fait / AJOUT 3 pas fait (repris par session-9e) / 0 fait / 1 fait / 2 pas fait (pas le temps) / 3 pas fait (2 n'est pas vert)

AJOUT 1. Radar et classement — fait (2a500e5, vérifié par le Chef).
   - classementCourse (simulation.js) : le classement en direct, l'écart en temps au pilote devant (temps de passage notés tous les CLASSEMENT_PAS = 2 m, au prorata), les tours de retard. Testé : ordre, écarts justes à 0,1 s près contre un relevé indépendant, après chaque dépassement celui qui double passe devant.
   - La tour en haut à droite (« P4 / 10 », pastille, numéro, « ✂ +5 s », écart), la ligne du joueur en surbrillance, les lignes glissent (transition CSS sur --rang). Le radar en bas à gauche (radar.js, canvas 2D, RADAR_RAYON 150 m). 🔊 à gauche de la tour, l'aide des touches en bas au milieu. ecrans.py : 10 lignes, joueur marqué, points sur le radar, aucun chevauchement ni débordement en 960×600 et 1280×720, places de 1 à N après le glissement. Captures hud-960.png, hud-1280.png.

AJOUT 2. Podium et pénalités — fait (3077e74, vérifié par le Chef).
   - classementFinal : temps de course + pénalités, la même règle pour tous ; ordre de passage et ordre final gardés ; podiumConnu : les trois premiers sont sûrs quand plus personne ne peut faire mieux que le 3e.
   - Règle du propriétaire : en course, la tour montre la place de la PISTE, la pénalité est seulement affichée ; elle compte au podium et aux résultats. Testé dans le moteur (+60 s en course : toujours 3e dans la tour, passé la ligne 3e, classé 10e) et dans ecrans.py (+60 s au premier : il reste P1 dans la tour, pas sur le podium).
   - podium3d.js : trois marches (2e, 1er, 3e), les trois voitures, la caméra qui se balance ; puis les résultats (place, temps, pénalité, écart, grille ▲▼), le joueur en surbrillance, bouton pour passer. Captures podium.png, resultats.png, resultats-960.png.
   - Trouvé en route : au départ, les rangées partaient l'une après l'autre (la voiture devant, à 16 m sur la grille, était suivie à 14 m, donc vitesse visée 2 m/s tant qu'elle ne partait pas). Sur les IA_DEPART_LANCEMENT = 100 premiers mètres, suivi à 8 m : tout le monde part ensemble.

0. Le test du joueur — fait (9f29dbf). Cause réelle : avec ?ia=N, la course démarrait pendant que la carte se calculait encore en tranches ; sur un Mac chargé, le GO arrivait avant la carte et les IA restaient sur la grille (même retard pour toutes). Maintenant la course n'avance pas tant que la carte n'est pas prête, « Préparation de la course… » remplace le compte à rebours (les feux d'session-9e font pareil). Le test vérifie « pas de GO sans carte » et mesure 5 s de course (JEU.plateau.temps), pas d'horloge. ecrans.py 3 fois de suite : 200/200, 200/200, 200/200.

1. Les erreurs — fait (f4e455c), tous les « fini quand » tenus :
   | critère | demandé | mesuré (30 courses) |
   |---|---|---|
   | erreurs par type dans courses.html | oui | freinage 14, blocage 10, large 73 (évitées 54) |
   | chocs > 5 m/s pendant une erreur | 0 | 0 |
   | chocs > 5 m/s au total | ≤ 6 | 2 |
   | 20 voitures | ≤ 1 choc | 0 (test) et 0 (technique) |
   | herbe hors erreurs | ≤ 4000 | 2966 pas (pendant les erreurs : 158) |
   Ce qui a été fait :
   - tirerErreurs : à chaque tour, avec la probabilité taux / IA_ERREUR_TOURS, une erreur à un virage et d'un type tirés au hasard (toujours trois tirages, pour que la suite du hasard ne dépende pas du taux). Testé : taux 1 → 1,03 erreur par course, taux 0,1 → 0,10.
   - majErreur : freinage trop tard et roues bloquées au point de freinage, sortie large 25 m avant le sommet ; seulement de mauvaises commandes (vise 30 % trop vite pendant 1,5 s ; ne freine qu'à 45 % pendant 1 s ; ne braque qu'à 60 % pendant 1,2 s). Pendant l'erreur et IA_ERREUR_SUITE = 2 s après : il cède la place à toute voiture à côté de lui, son attaque s'arrête, et il se remet en roulant à IA_ERREUR_RECUPERATION = 70 % de sa vitesse visée.
   - Jamais d'erreur avec une voiture à moins de IA_DISTANCE_ERREUR = 25 m à côté ou derrière ; et, pour un freinage raté, jamais avec une voiture devant à moins de IA_ERREUR_TEMPS_DEVANT = 2 s de route. Sans cette dernière règle, un blocage à 2350 m donnait un choc à 18 m/s 96 m plus loin (technique, graine 12) : freiner trop peu, c'est percuter celle de devant.
   - Testé dans le moteur : 10 IA sur 2 min, aucune erreur déclenchée avec une voiture dans ces zones, les évitées comptées, pas d'attaque pendant une erreur. Seul, chaque type se déclenche à l'épingle.
   Ce qui n'est pas tenu (affiché, pas exigé) : le COÛT d'une erreur. Seul sur le technique, une erreur à l'épingle envoie la voiture dans l'herbe (330 et 238 pas) mais le tour n'est pas plus lent (−0,04 à −0,07 s), même avec la récupération à 70 % : à basse vitesse, l'herbe ne ralentit presque pas, et l'arc plus large compense. C'est pour ça que « meilleur rythme top 3 » reste à 30/30. C'est l'ordre 2 : il faudra soit une herbe qui coûte (physique, décision du propriétaire : le joueur la subirait aussi), soit une récupération plus forte / plus longue (réglages IA_ERREUR_RECUPERATION et IA_ERREUR_SUITE).
   Sur les 20 voitures : avant la récupération, la course technique (graine 1) avait 2 chocs, un seul accrochage n°3/n°17 au freinage de l'épingle (2390 m, 4 m/s d'écart, 5 m derrière, 2,5 m à côté), sans erreur ni attaque chez elles ni personne à moins de 70 m. Sans erreurs, cette course a déjà 1 choc depuis les feux (4 chocs sur 6 graines ; avec erreurs 6 sur 6) : c'est du bruit de course, pas une conséquence des erreurs. Avec la récupération, graine 1 passe à 0.

2. Des surprises — pas fait. Vainqueur ≠ poleman 0 (≥ 4 demandé), meilleur rythme top 3 30 (18 à 28). Voir le coût des erreurs ci-dessus : tant qu'une erreur ne coûte rien, rien ne bouge.

3. Le duel — pas fait (2 n'est pas vert).

Sortie des tests : suite complète sur main avant le commit des erreurs (20h11–20h15, sous le verrou) : test.html 128/128, courses.html 38/38, ecrans.py 211/211, TOUT PASSE, 0 Chrome restant. Avant chaque autre commit : 2a500e5 (120/120, 37/37, 173/173), 3077e74 (122/122, 37/37, 199/199), 16165f5 et 9f29dbf (122/122, 37/37, 200/200).

Ce que je n'ai pas pu vérifier : un deuxième passage complet ; l'effet d'une herbe plus dure (physique) sur le coût des erreurs.

Règle des tests (Chef, 18h40) respectée : une partie pendant le travail, la suite complète avant chaque commit, sous /tmp/gpd-tests.lock. lancer.py accepte maintenant moteur | courses | ecrans.

Aucun essai ne tourne, 0 Chrome --headless.

Réévalue.
