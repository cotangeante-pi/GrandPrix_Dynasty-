TOUR 49a — étape 11e — compte rendu du Codeur 1
Branche : qualite-auto
Commit : 60c4099 pour le code (GitHub 42144270472 : vert 18/18) ; ce compte rendu est le commit suivant

Ordres :
1. L'Auto qui tient 58 images/s : fait (246587c, GitHub 42140465922 : vert 18/18).
   - qualite.js : un niveau continu de 0 (le plus beau = l'image d'avant) au plus simple. Sous 55 images/s (moyenne sur 1 s), un pas
     de simplification toutes les 0,5 s au plus, jugé sur les images depuis le dernier pas, jusqu'à 58 ou plus. Le détail revient
     d'un pas toutes les 3 s au plus, seulement si une image se calcule en moins de 70 % de 16,7 ms (le temps de calcul mesuré du
     début de l'image dans boucle.js jusqu'après le dessin, principal.js) ; un pas rendu qui refait passer sous 58 est repris
     aussitôt et ce niveau n'est plus rendu avant 90 s (doublé à chaque échec). Rien pendant les feux. Une image de plus de 0,25 s
     (chargement, onglet) ne compte pas. Un pas sans effet à l'écran (pixels 1,5 → 1,35 sur un écran à 1 pixel par pixel CSS) est sauté.
   - L'ordre (QUALITE_PAS, donnees.js) : 1) voitures lointaines 45 → 35 → 25 → 15 m et détaillées 8 → 6 → 4 → 2 ; 2) densité du
     public, des arbres et des piles de pneus 1 → 0,75 → 0,5 → 0,3 (toujours les mêmes objets, rien ne clignote) ; 3) distance du
     décor (180/1600 → 90/900 m) ; 4) effets 1 → 0,5 → 0,25 (fumée, étincelles, gerbes, gouttes ; la simulation ne change pas) ;
     5) pas d'ombres dans le jeu (shadowMap éteint) : à leur place, le rétroviseur coupé ; 6) pixels 1,5 → 0,6 par pas de 0,15.
     19 niveaux (16 sur un écran à 1 pixel par pixel CSS).
   - Jamais simplifié : piste, vibreurs, repères, trajectoire conseillée (aucun pas n'y touche) ; la voiture du joueur garde la règle
     d'avant (VOITURE_LOIN, VOITURES_DETAILLEES_MAX), quel que soit le niveau (userData.lointaine.joueur ; SCENE3D.joueurSimplifie
     pour les tests).
   - Le niveau est gardé (option qualite_niveau, écrite une fois tenu 3 s, jamais pendant les feux, pour ne pas écrire la
     sauvegarde à chaque pas) ; gardé aussi par « Nouvelle carrière à 0 ». Le menu : auto → haute → moyenne → basse → auto (moyenne
     ajoutée), « Qualité : auto (au plus simple) » ; revenir à « auto » reprend le niveau de l'Auto.
   - Tests : tests/test.html (ordinateur lent simulé 24 ms − 1 ms par pas ± 1,5 ms : niveau 8 en 4,6 s, 59,5 images/s, puis 60 s sans
     bouger ; rapide 6 ms : rien ; trop lent 40 ms : au plus simple et y reste ; 56,5 images/s : rien ne commence ; carte graphique
     lente simulée (calcul court, image longue) : un seul essai de retour, repris aussitôt, puis 75 s sans bouger ; retour lent du
     niveau 10 au plus beau, un pas toutes les 3 s ; 12,5 ms de calcul : pas de retour ; feux ; crans fixes ; menu ; ordre des pas ;
     la course au bit près au plus beau et au plus simple) ; tests/ecrans.py test=qualite (swiftshader jusqu'au plus simple, jamais
     pendant les feux, voiture du joueur jamais simplifiée, niveau sauvegardé, texte « au plus simple », menu à 4 crans).
2. Le rétroviseur (fini avant 23h, pris ensuite comme demandé) : fait (447118b + 60c4099).
   - scene3d.js dessinerRetro : une 2e caméra à l'arrière de la voiture du joueur (1,6 m derrière, 1,1 m de haut, 55° de gauche à
     droite), une petite image (0,5 pixel par pixel CSS), sans le décor, sans la voiture du joueur ni le volant, posée en miroir ;
     un cadre CSS #retroviseur. En haut au milieu, juste sous le chrono, au-dessus des messages de course (#messageCourse à 176 px).
   - Quand : en course avec d'autres voitures, vue derrière ou cockpit (et en pause) ; jamais en qualification seule, ni pendant la
     vue télé d'après l'arrivée, ni au résumé ; à deux jamais (RETRO_DEUX faux : choix réversible du Codeur, à la place de « s'il fait
     passer sous 60 images/s », que je n'ai pas pu mesurer) ; coupé en « basse » et par l'Auto (pas 5).
   - « Rétroviseur : oui / non » au menu pause et dans ⚙ Réglages, sauvegardé (option retroviseur).
   - appelsDessin / trianglesDessines restent ceux de la vue de course (les tests d'appels de dessin existants ne bougent pas) ;
     le rétroviseur compte à part (SCENE3D.appelsRetro, trianglesRetro).
   - Test ecrans.py test=retro (960×600) : sa place, aucun point de la piste devant dessous, une voiture posée 20 m derrière change
     au moins 1 % de ses pixels, son coût (≤ 30 appels), masqué = 0 appel de plus et la même vue ; capture retroviseur.png.

Sortie des tests : GitHub 42140465922 (246587c) vert 18/18 ; 42141734966 (447118b) rouge : ecrans-1, -3 et -6, parce que les
appels de dessin du rétroviseur s'ajoutaient à ceux de la vue (tests de la trajectoire conseillée et des effets) et qu'une voiture
20 m derrière était trop petite au champ de 111° ; corrigé dans 60c4099 : GitHub 42144270472 vert 18/18 (PARTIE OK partout).
Sur le Mac : seulement les tests de calcul pur de la qualité, en osascript (5/5).

Mesures (GitHub, swiftshader) :
- circuit test, 10 voitures, 1280×720 : le plus beau 40 appels de dessin / 52 076 triangles ; le plus simple 27 / 30 682.
- rétroviseur, circuit test, 6 voitures, 960×600 : 27 → 41 appels de dessin (14 pour lui) ; une voiture 20 m derrière change 274 pixels
  de son image ; la page test=retro dure 5 s sur GitHub.
- (passage 42144270472, même page qualité : le plus beau 39 / 50 398, le plus simple 28 / 31 760.)

Ce que je n'ai pas pu vérifier :
- Le Mac était trop chargé (charge 40) : aucune page d'écran lancée ici, tout sur GitHub ; aucune mesure d'images/s réelle.
- La sensation de l'Auto sur un vrai ordinateur lent (à essayer par le propriétaire : ?qualite=auto, ou sans paramètre hors test).
- Le temps de calcul mesuré ne voit pas le travail de la carte graphique (WebGL est asynchrone) : c'est pour ça qu'un retour
  repris attend 90 s (le cas « carte graphique lente » est testé).
- Le rétroviseur en vue cockpit n'est pas capturé (seulement la vue derrière) ; à deux, il est coupé sans mesure.
- Pas de bouton qualité sur l'écran titre (il est au menu pause et dans ⚙ Réglages du paddock, comme avant).

Réévalue.
