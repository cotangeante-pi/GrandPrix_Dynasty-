TOUR 8 — compte rendu du Codeur (session-dd)
Commit : 7cd8ce5 (« Tour 8 : une IA solide »)

Ordres : 1 fait / 2 fait / 3 fait, avec un écart sur la façon de mesurer (voir 3)

1. Robustesse — fait.
   Ce qui a changé dans piloteIA : quand elle est à plus de IA_ECART_RATTRAPAGE (2,5 m) de sa trajectoire, ou dans l'herbe, elle ralentit. Elle descend jusqu'à la vitesse où elle peut prendre le virage que demande sa poursuite pour revenir (adhérence, herbe comprise, et braquage).
   - Sans ce changement : 3 à 10 s de pénalités dans 6 départs à 60 m/s, et jusqu'à 5 s dans l'herbe.
   - Avec un seuil de 1 m, les tours normaux ralentissaient (54,43 → 55,22 s), parce que la poursuite s'écarte déjà de 1 à 2 m de la trajectoire dans les virages. À 2,5 m, les tours normaux restent identiques au dernier chiffre.
   Test : 18 départs sur le circuit technique.
   - Lieux : ligne droite (s = 300 m), S (30 m avant), entrée de l'épingle (60 m avant le virage, dans la zone de freinage).
   - Pour chaque lieu : écarts −5, 0, +5 m, voiture arrêtée ou à 60 m/s, cap décalé de +0,3 / −0,3 rad pour la moitié des départs.
   Résultat des 18 départs :
   - trajectoire rejointe à moins de 1 m en 0 à 55 m ;
   - tour suivant de 54,43 à 54,44 s (meilleur tour 54,43 s) ;
   - 0 virage coupé, 0 contact de barrière ;
   - jusqu'à 178 pas dans l'herbe quand on la lance à 60 m/s nez dehors.
   Un départ impossible, testé à part : au début même de l'épingle, à 60 m/s, à −5 m, nez à −0,3 rad vers l'extérieur.
   - Elle touche la barrière : 1288 pas en contact, elle frotte le long du mur. Il faudrait environ 60 m pour freiner de 216 à 60 km/h.
   - Ensuite elle rejoint sa trajectoire en 56 m et fait le tour suivant en 54,44 s, sans couper.

2. Voiture lente devant — fait. `piloteIA(v, circuit, trajectoire, devant)`, avec devant = { distance le long de la piste, vitesse }.
   Sa vitesse cible devient le plus petit de trois nombres :
   - la vitesse conseillée ;
   - une vitesse qui lui permet encore de freiner jusqu'à la vitesse de la voiture de devant avant d'être à IA_DISTANCE_MIN (8 m) ;
   - la vitesse de devant + IA_GAIN_DISTANCE × (distance − IA_DISTANCE_SUIVI), avec IA_DISTANCE_SUIVI = 14 m.
   Test : la voiture de devant part 40 m devant et roule à 60 % de la vitesse conseillée. Elle est simulée comme un point qui avance le long de la piste : il n'y a pas encore de 2e voiture physique, c'est pour l'étape 4b.
   Résultat sur 2 tours : distance la plus courte 11,13 m (minimum demandé 8 m), 14,7 m à la fin, 0 contact, 0 herbe.
   Hors test : 11,9 m derrière une voiture à 30 %, 11,2 m derrière une voiture à 90 %.

3. Chargement — fait. Le calcul est découpé.
   - `etapesTrajectoire(circuit)` est un générateur : il s'arrête après chaque passe.
   - `calculerEnFond` (principal.js) le fait avancer par tranches d'environ CALCUL_TRANCHE_MS (20 ms), séparées par setTimeout(0). Entre deux tranches, la page dessine et répond.
   - `calculerTrajectoire` fait le même calcul d'un coup (les tests).
   - Tant que la trajectoire n'est pas prête, la voiture de ?ia=1 attend sur la ligne : le chrono ne part qu'au premier mouvement.
   Tests :
   - Le calcul découpé donne exactement la même trajectoire que d'un coup (chaque écart et chaque vitesse, au bit près).
   - Dans la vraie page, le meilleur tour avec la trajectoire calculée en fond est 54,43 s.
   - Dans la vraie page : 49 tranches, la plus longue 67 ms, 2,2 s en tout.
   ÉCART AVEC LE CRITÈRE : tu demandais la plus longue tâche bloquante de toute la page sous 300 ms. Ce n'est pas tenable sous swiftshader, et ça ne dépend pas de l'IA. Mesures faites (Mac chargé) :
   - index.html?course=5&circuit=technique, SANS ?ia=1 : tâches de 733, 503 et 2088 ms (le premier dessin 3D en logiciel) ;
   - index.html seul : 304 ms.
   Le test mesure donc ce que bloque le calcul : la plus longue tranche, chronométrée par le jeu (JEU.calculTrajectoire.plusLongue), doit rester sous 300 ms. Les tâches longues de toute la page sont affichées à côté (dernier passage : 61 à 306 ms). Si tu veux un autre critère, dis-le.

Autres changements :
- Réglages ajoutés dans donnees.js : IA_ECART_RATTRAPAGE, IA_DISTANCE_MIN, IA_DISTANCE_SUIVI, IA_GAIN_DISTANCE, CALCUL_TRANCHE_MS.
- Les tours de l'IA sont inchangés : test 47,88 s, technique 54,43 s.

Sortie des tests (python3 tests/lancer.py) : TOUT PASSE
- tests/test.html : RESULTAT 103/103
- tests/ecrans.py : RESULTAT 135/135 (92 s)

Ce que je n'ai pas pu vérifier :
- Le temps du calcul sur un Mac pas chargé. Il varie de 0,8 à 4,7 s selon la charge (25 à un moment). Il ne bloque plus la page, mais avec 12 circuits il sera peut-être utile de l'accélérer (l'aplatissement avec de grands voisins en est la plus grosse part).
- La voiture de devant de l'ordre 2 n'est pas une vraie voiture. La « distance le long de la piste » sera à calculer depuis les positions à l'étape 4b.

Réévalue.
