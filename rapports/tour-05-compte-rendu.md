```
TOUR 5 — compte rendu du Codeur
Commit : 44b3624 « Tour 5 : le chrono » (ce compte rendu est dans le commit suivant). Pas de push.
Aucun réglage de conduite n'a changé (donnees.js : seulement des réglages de course ajoutés).

Ordres : 1 fait / 2 fait / 3 fait / 4 fait

  1 course.js, calcul pur. La voiture part arrêtée 6 m derrière la ligne (DEPART_RECUL). Compte à rebours de 3 s (les
    commandes sont bloquées), puis GO : le chrono part au premier mouvement. Le premier passage de la ligne commence le
    tour 1 sans rien compter (le tour 1 inclut les 6 m). Ensuite, un tour ne compte que si la voiture a vu le secteur 2
    puis le secteur 3, et passe la ligne EN AVANÇANT. Reculer sur la ligne ou repasser la ligne sans avoir fait le tour
    ne compte pas. On garde chaque tour, ses 3 secteurs, le meilleur tour (sans ✂), les meilleurs secteurs, et le total
    (somme des tours + pénalités).
    Robot sur 5 tours : 66,55 / 62,05 / 62,04 / 62,05 / 62,05 s, total 314,74 s, meilleur 62,04 s ; la somme des tours =
    le chrono, et chaque tour = la somme de ses 3 secteurs (à 1e-9 près).
  2 Virage coupé : une sortie commence quand |d| > demi-largeur + 1 m (MARGE_COUPE). Pendant la sortie, on additionne la
    distance vraiment roulée ; au retour sur la piste, si l'avance le long de la piste dépasse la distance roulée + 2 m
    (SEUIL_COUPE), c'est +5 s (PENALITE_COUPE) et le tour est marqué ✂ (il ne peut pas être le meilleur tour).
    Testé : tout droit à travers la chicane des stands → +5 s et ✂ ; sortie large à l'extérieur du grand virage
    (5 m dans l'herbe, tout le virage) → rien. Le seuil est petit (2 m) parce que nos chicanes à 35° ne font gagner
    que quelques mètres quand on les coupe. On pourra le régler quand le propriétaire aura coupé lui-même.
  3 Interface (interface.js + textes en/fr) : écran de choix (Très courte 5 / Moyenne 12 / Longue 18 / Essai libre,
    avec le record de chaque longueur), compte à rebours 3-2-1-GO, Tour n/N (n seul en essai libre), chrono du tour,
    meilleur tour, S1 S2 S3 (violet = meilleur secteur, vert = mieux qu'au tour d'avant, jaune = plus lent ; ceux du
    tour en cours, sinon ceux du dernier tour), « +5 s ✂ virage coupé » pendant 3 s. Échap = pause : la physique
    s'arrête (testé : le compteur de pas ne bouge plus en 0,6 s), « Reprendre » et « Recommencer ».
    Captures : choix.png, course.png. « HORS PISTE » ne s'affiche plus derrière les écrans de choix et de fin.
    Outils ajoutés : ?course=5|12|18|0 lance directement une course, et ?robot=1 fait conduire le robot (tests, démo).
    Les caméras de survol (?camera=auto, libre, dessus, virage, vitrine) n'ont pas d'écran de choix.
  4 Écran de fin : « Arrivée », « Nouveau record ! », temps total, meilleur tour, pénalités, la liste des tours (✂ si
    coupé, ★ pour le meilleur), « Rejouer » et « Changer de longueur ». sauvegarde.js : une clé « grand-prix-dynasty »,
    version 1 (avec une fonction de migration prête), tout en try/catch ; le record = le meilleur tour de chaque
    longueur. Testé dans la vraie page : le robot finit 5 tours (BOUCLE.simuler), l'écran de fin montre les 5 tours,
    le record est gardé, et après rechargement l'écran de choix l'affiche. Capture : fin.png.

Sortie des tests (python3 tests/lancer.py, réelle, passage 1 sur 2, code de sortie 0) :
⏱ tests/test.html : 10 s
RESULTAT 82/82
✔ la physique avance par pas de 1/120 s
✔ 10 s à 144 images/s = exactement 1200 pas (pas de dérive)
✔ des images irrégulières donnent quand même 120 pas par seconde
✔ plafond : une image de 5 s ne fait que 12 pas, et le retard est oublié
✔ simuler(1) = 120 pas, sans affichage
✔ simuler(60) = 7200 pas
✔ l’onglet caché arrête la boucle, revenu il la relance
✔ arrêtée, la boucle ne repart pas quand l’onglet revient
✔ CIRCUIT_TEST fait entre 2,5 et 3,5 km
✔ la longueur est stable : échantillons à 1 m et à 2 m, moins de 0,5 % d’écart
✔ les échantillons sont régulièrement espacés (±1 %)
✔ la piste ne se recoupe nulle part (deux morceaux éloignés le long de la courbe restent à plus d’une largeur)
✔ aucun virage plus serré que la demi-largeur (le bord intérieur ne se replie pas)
✔ il y a un virage serré (rayon < 60 m) et des parties droites
✔ la ligne d’arrivée est au départ, et s y vaut 0
✔ les morceaux se referment sur le départ (moins de 5 cm)
  (pire courbure sur une droite : 1/18200743398990 m)
✔ sur les droites, |courbure| < 1/3000 par mètre
✔ dans un virage, la courbure ne change pas de signe, et c’est le bon
✔ dans une chicane, la courbure change de signe deux fois
✔ trois secteurs dans l’ordre
✔ sur la ligne : s = 0, d = 0, sur la piste, secteur 1
✔ au milieu de la droite des stands : s = 150
✔ à droite du pilote : d > 0 ; à gauche : d < 0
✔ au bord : sur la piste ; un peu plus loin : dehors
✔ juste avant la ligne : s presque égal à la longueur ; juste après : s presque 0
✔ un point de chaque secteur
✔ chaque échantillon se retrouve à sa place (s, d = 0)
✔ avec indiceDepart, même résultat que la recherche complète (2000 points au hasard près de la piste)
✔ un indiceDepart faux (à l’autre bout du circuit) est rattrapé par la recherche complète
  (médiane 1.10 ms, meilleur 0.40 ms [0.4 0.6 0.6 0.7 0.8 1.0 1.1 1.1 1.2 1.3 1.6 1.9 2.8 7.4 10.8])
✔ vitesse : 20 voitures × 120 pas = 2400 appels en moins de 2 ms (médiane sous 10 ms)
  (longueur 3183.8 m, 1592 échantillons de 2.000 m, construit en 49.8 ms)
✔ construction : longueur, échantillons, temps
  (0–100 : 2.64 s)
✔ 0–100 km/h en 2,6 s environ (entre 2,3 et 2,9 s)
  (vitesse max : 328.9 km/h)
✔ vitesse max ≈ 330 km/h (entre 320 et 340)
  (300 → 80 km/h : 101.1 m en 2.10 s)
✔ freinage de 300 à 80 km/h en 70 à 160 m
✔ le frein arrête la voiture sans la faire reculer, puis la marche arrière est lente
  (limite théorique à 100 m : 175 km/h ; à 80 % : écart au centre ≤ 0.72 m, vitesse 138.6–138.6 km/h)
✔ virage de 100 m à 80 % de la vitesse limite : la voiture tient le cercle à vitesse stable
  (à 125 % : écart max 6.22 m)
✔ virage de 100 m à 125 % de la vitesse limite : la voiture ne tient plus la ligne (elle s’écarte de plus de 4 m)
  (4 s plein gaz : piste 146 km/h, herbe 71 km/h)
✔ l’herbe ralentit
  (150 km/h : |r| < 0,05 en 0.308 s, cap encore 7.1° ; au tour 3 : tête-à-queue, 184°)
✔ touche gardée 1 s à 150 km/h puis lâchée : |r| < 0,05 rad/s en moins de 0,6 s, le cap tourne de moins de 8° de plus
  (250 km/h : |r| < 0,05 en 0.333 s, cap encore 7.4° ; au tour 3 : tête-à-queue, 184°)
✔ touche gardée 1 s à 250 km/h puis lâchée : |r| < 0,05 rad/s en moins de 0,6 s, le cap tourne de moins de 8° de plus
  (rayon à 80 km/h : piste 26.3 m, herbe 29.2 m)
✔ sur l’herbe, on tourne presque aussi serré que sur la piste (à 80 km/h)
  (herbe : sous 100 km/h en 2.35 s, vitesse limite 81 km/h)
✔ sur l’herbe à 250 km/h, plein gaz : sous 100 km/h en moins de 3 s, puis une vitesse limite vers 80–100 km/h
✔ une barrière n’est jamais traversée, même de face à 330 km/h
✔ Espace : remise au centre, dans le bon sens, à l’arrêt
✔ au clavier, le gaz monte progressivement
  (appui de 0,15 s : entrée 0.383)
✔ direction : un appui de 0,15 s donne une entrée ≤ 0,4 (petite correction)
✔ direction : garder la touche 1,5 s atteint 1
  (retour au centre : 0.208 s)
✔ direction : le retour au centre est complet en 0,25 s au plus
✔ direction : changer de côté passe par le centre, puis repart vite
  (rayon : tour 3 = 45,9 m (à 128 km/h en fin d’essai) ; maintenant = 89.0 m (à 200 km/h))
✔ à 200 km/h, touche gardée 2 s : le virage est plus large qu’au tour 3 (45,9 m)
✔ la direction est moins sensible à haute vitesse
✔ mêmes entrées = exactement la même trajectoire, à 30 et à 144 images/s
✔ l’affichage interpole entre l’état d’avant et l’état d’après
  (caméra derrière : distance 7.50 à 8.00 m, recul 7.5 m, vitesse finale 329 km/h)
✔ caméra derrière : de 0 à pleine vitesse, elle reste à recul − 0,3 m … recul + 0,8 m de la voiture
✔ caméra derrière : le champ de vision va de 60° à 66° au plus
  (robot : tour en 66.46 s, écart max au centre 1.70 m, 0 contacts de barrière, 0 pas dans l’herbe, calcul 280 ms)
✔ le robot fait un tour complet sans toucher de barrière, en 45 à 75 s, et le test dure moins de 5 s
✔ pour une même entrée, la physique est celle du tour 3 (commit 43a3fa8) : 20 s de conduite, mêmes positions au dernier chiffre
✔ à fond, le rapport passe de 1 à 8, sans jamais redescendre
✔ le régime monte avec la vitesse dans un rapport, et retombe au changement de rapport
✔ le son : la note suit le régime, les pneus se taisent quand la voiture ne glisse pas
✔ aucun son avant un geste du joueur
  (5 tours : 66.55 / 62.05 / 62.04 / 62.05 / 62.05 s ; total 314.74 s ; meilleur 62.04 s)
✔ le robot finit une course de 5 tours : le total = la somme des tours, chaque tour = la somme de ses 3 secteurs
✔ pendant le compte à rebours, rien ne bouge ; le chrono part au premier mouvement
✔ reculer sur la ligne puis la repasser ne compte pas de tour
✔ repasser la ligne sans avoir fait le tour ne compte pas
  (chicane coupée : pénalité 5 s)
✔ couper la chicane tout droit : +5 s et le tour marqué ✂
✔ sortir large dans le grand virage (sans raccourci) ne coûte rien
✔ un tour coupé ne peut pas être le meilleur tour
✔ couleurs des secteurs : violet = meilleur, vert = mieux qu’au tour d’avant, jaune = plus lent
✔ même graine, même suite
✔ deux graines, deux suites
✔ les nombres sont dans [0, 1[ et bien répartis
✔ sans graine, le hasard vient de Math.random
✔ aucune erreur JavaScript
RESULTAT 112/112
✔ index.html 960×600 : console vide
✔ index.html 960×600 : pas de défilement
✔ index.html 960×600 : la scène 3D a démarré
✔ index.html 960×600 : le circuit est dessiné
✔ index.html 960×600 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html 960×600 : sans debug, pas de compteur
✔ index.html?debug=1 960×600 : console vide
✔ index.html?debug=1 960×600 : pas de défilement
✔ index.html?debug=1 960×600 : la scène 3D a démarré
✔ index.html?debug=1 960×600 : le circuit est dessiné
✔ index.html?debug=1 960×600 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?debug=1 960×600 : images par seconde, triangles, dérive, g latéraux et triangles d’une voiture affichés
✔ index.html?debug=1 960×600 : à l’arrêt, 0° de dérive et 0 g
✔ index.html?debug=1 960×600 : une voiture fait au plus 8 appels de dessin
✔ index.html 1280×720 : console vide
✔ index.html 1280×720 : pas de défilement
✔ index.html 1280×720 : la scène 3D a démarré
✔ index.html 1280×720 : le circuit est dessiné
✔ index.html 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html 1280×720 : la voiture attend sur la ligne, à l’arrêt
✔ index.html 1280×720 : aucun son avant le premier geste
✔ index.html 1280×720 : au départ, l’écran de choix (5, 12, 18 tours, essai libre)
✔ index.html 1280×720 : choisir « 5 tours » lance le compte à rebours
✔ index.html 1280×720 : le titre est le nom du jeu, sans « F1 »
✔ index.html 1280×720 : après le compte à rebours, GO
✔ index.html 1280×720 : le premier geste allume le son
✔ index.html 1280×720 : ↑ fait avancer la voiture
✔ index.html 1280×720 : la voiture est dessinée entre l’état d’avant et l’état d’après
✔ index.html 1280×720 : ← fait tourner la voiture à gauche
✔ index.html 1280×720 : le rapport monte et s’affiche
✔ index.html 1280×720 : ↓ freine
✔ index.html 1280×720 : la voiture a roulé
✔ index.html 1280×720 : C passe au cockpit
✔ index.html 1280×720 : C passe à la télé
✔ index.html 1280×720 : C revient derrière
✔ index.html 1280×720 : dans l’herbe, « hors piste » s’affiche
✔ index.html 1280×720 : Espace remet la voiture au centre de la piste, à l’arrêt
✔ index.html 1280×720 : M coupe le son
✔ index.html 1280×720 : M le remet
✔ index.html 1280×720 : le bouton 🔊 coupe le son
✔ index.html 1280×720 : le bouton ne garde pas le focus (Espace ne le clique pas)
✔ index.html 1280×720 : Échap met en pause et la physique s’arrête
✔ index.html 1280×720 : « Reprendre » relance la physique
✔ index.html 1280×720 : la vitesse s’affiche en km/h
✔ index.html 1280×720 : sans debug, pas de compteur
✔ index.html?debug=1 1280×720 : console vide
✔ index.html?debug=1 1280×720 : pas de défilement
✔ index.html?debug=1 1280×720 : la scène 3D a démarré
✔ index.html?debug=1 1280×720 : le circuit est dessiné
✔ index.html?debug=1 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?debug=1 1280×720 : images par seconde, triangles, dérive, g latéraux et triangles d’une voiture affichés
✔ index.html?debug=1 1280×720 : à l’arrêt, 0° de dérive et 0 g
✔ index.html?debug=1 1280×720 : une voiture fait au plus 8 appels de dessin
✔ index.html?camera=auto 1280×720 : console vide
✔ index.html?camera=auto 1280×720 : pas de défilement
✔ index.html?camera=auto 1280×720 : la scène 3D a démarré
✔ index.html?camera=auto 1280×720 : le circuit est dessiné
✔ index.html?camera=auto 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?camera=auto 1280×720 : la caméra fait le tour toute seule
✔ index.html?camera=auto 1280×720 : sans debug, pas de compteur
✔ index.html?camera=libre 1280×720 : console vide
✔ index.html?camera=libre 1280×720 : pas de défilement
✔ index.html?camera=libre 1280×720 : la scène 3D a démarré
✔ index.html?camera=libre 1280×720 : le circuit est dessiné
✔ index.html?camera=libre 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?camera=libre 1280×720 : sans touche, la caméra libre ne bouge pas
✔ index.html?camera=libre 1280×720 : la flèche ↑ fait avancer la caméra
✔ index.html?camera=libre 1280×720 : la molette rapproche la caméra
✔ index.html?camera=libre 1280×720 : en caméra libre, les flèches ne font pas rouler la voiture
✔ index.html?camera=libre 1280×720 : sans debug, pas de compteur
✔ index.html?camera=dessus 1280×720 : console vide
✔ index.html?camera=dessus 1280×720 : pas de défilement
✔ index.html?camera=dessus 1280×720 : la scène 3D a démarré
✔ index.html?camera=dessus 1280×720 : le circuit est dessiné
✔ index.html?camera=dessus 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?camera=dessus 1280×720 : sans debug, pas de compteur
✔ index.html?camera=virage 1280×720 : console vide
✔ index.html?camera=virage 1280×720 : pas de défilement
✔ index.html?camera=virage 1280×720 : la scène 3D a démarré
✔ index.html?camera=virage 1280×720 : le circuit est dessiné
✔ index.html?camera=virage 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?camera=virage 1280×720 : sans debug, pas de compteur
✔ index.html?camera=vitrine 1280×720 : console vide
✔ index.html?camera=vitrine 1280×720 : pas de défilement
✔ index.html?camera=vitrine 1280×720 : la scène 3D a démarré
✔ index.html?camera=vitrine 1280×720 : le circuit est dessiné
✔ index.html?camera=vitrine 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?camera=vitrine 1280×720 : sans debug, pas de compteur
✔ index.html?reglages=1&course=0 1280×720 : console vide
✔ index.html?reglages=1&course=0 1280×720 : pas de défilement
✔ index.html?reglages=1&course=0 1280×720 : la scène 3D a démarré
✔ index.html?reglages=1&course=0 1280×720 : le circuit est dessiné
✔ index.html?reglages=1&course=0 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?reglages=1&course=0 1280×720 : le curseur ADHERENCE change REGLAGES.ADHERENCE
✔ index.html?reglages=1&course=0 1280×720 : un réglage dans un tableau (CAMERA_DERRIERE[0]) change aussi
✔ index.html?reglages=1&course=0 1280×720 : l’épaisseur du halo refait la voiture (mêmes triangles, mêmes appels)
✔ index.html?reglages=1&course=0 1280×720 : « copier » donne les valeurs changées, prêtes pour donnees.js
✔ index.html?reglages=1&course=0 1280×720 : après le panneau, ↑ fait toujours rouler
✔ index.html?reglages=1&course=0 1280×720 : sans debug, pas de compteur
✔ index.html?course=5&robot=1 1280×720 : console vide
✔ index.html?course=5&robot=1 1280×720 : pas de défilement
✔ index.html?course=5&robot=1 1280×720 : la scène 3D a démarré
✔ index.html?course=5&robot=1 1280×720 : le circuit est dessiné
✔ index.html?course=5&robot=1 1280×720 : le panneau de réglage n’existe que avec ?reglages=1
✔ index.html?course=5&robot=1 1280×720 : le robot part après le compte à rebours
✔ index.html?course=5&robot=1 1280×720 : en course, Tour n/N, chrono et secteurs en couleurs
✔ index.html?course=5&robot=1 1280×720 : la course finie, l’écran de fin
✔ index.html?course=5&robot=1 1280×720 : l’écran de fin montre les 5 tours, le total et le nouveau record
✔ index.html?course=5&robot=1 1280×720 : le meilleur tour est gardé comme record des 5 tours
✔ index.html?course=5&robot=1 1280×720 : après rechargement, le record des 5 tours est affiché
✔ index.html?course=5&robot=1 1280×720 : l’essai libre n’a pas de nombre de tours
✔ index.html?course=5&robot=1 1280×720 : sans debug, pas de compteur
  (une voiture : 796 triangles, 6 appels de dessin ; toute l’image : 15 appels)
  (circuit 3D : 16626 triangles, construit en 53 ms sous swiftshader)
⏱ tests/ecrans.py : 188 s
TOUT PASSE
Passage 2 : TOUT PASSE aussi (code 0) : test.html 82/82, ecrans.py 112/112 (77 s).
(Les 8 lignes « 1 s affichée à N images/s = exactement 120 pas » sont passées aussi ; je les ai enlevées ici pour la longueur.)

Mesures : robot 66,55 s pour le premier tour (départ arrêté), puis 62,04–62,05 s ; course de 5 tours 314,74 s.
Suite complète : 80 à 200 s selon la charge du Mac.

Tests changés à cause de la charge du Mac (swiftshader tombait à 1 ou 2 images par seconde) :
  - le test de conduite attend le GO (40 s au plus) avant d'appuyer sur ↑ ;
  - sur les pages ?reglages=1&course=0 et ?course=5&robot=1, le test raccourcit le compte à rebours
    (JEU.course.compte = 0.01) : ces pages ne testent pas le compte à rebours, qui est vérifié dans test.html et
    par le test de conduite.

Ce que je n'ai pas pu vérifier :
  - un vrai joueur qui coupe un virage : le seuil de 2 m est réglé sur la chicane coupée tout droit ; couper
    l'intérieur d'un virage serré de 40 m sur quelques mètres d'herbe sera pénalisé aussi (c'est voulu, mais à confirmer
    avec le propriétaire) ;
  - les couleurs des secteurs dépendent de différences de millièmes : avec le robot, deux secteurs « égaux » à
    l'affichage peuvent être jaune et violet ;
  - après l'arrivée, la voiture continue en roue libre (sans commandes) derrière l'écran de fin ;
  - pas de son ou d'animation pour le GO, le record ou l'arrivée.

Réévalue.
```
