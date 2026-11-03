```
TOUR 3 — compte rendu du Codeur
Commit : 43a3fa8 « Tour 3 : la voiture roule » (ce compte rendu est dans le commit suivant)
Le commit contient aussi tes CLAUDE.md et SUIVI.md (nom du jeu) tels quels, et rapports/tour-03-rapport.md.
Dans CLAUDE.md, je n'ai touché qu'à la liste des fichiers (« La technique »).

Ordres : 1 fait / 2 fait / 3 fait / 4 fait / 5 fait — et le nom du jeu (en plus, une ligne)

  1 fait — Choix : le circuit est décrit PAR MORCEAUX (['droite', L], ['virage', R, angle], ['chicane', R, angle]),
    parce que ce sera plus sûr pour les 12 vrais circuits : une droite est droite par construction. Les morceaux sont
    convertis en points tous les 4 m sur la géométrie exacte, puis passés à la même spline (rien ne change pour le
    reste du code). Les points bruts restent possibles (def.points).
    CIRCUIT_TEST fait maintenant 3100,0 m. Les chicanes sont à 35° (décalage d'environ 14,5 m) au lieu de 20° :
    avec 20°, elles ne décalaient la piste que de 5 m environ, ce n'était pas une vraie chicane.
    Tests chiffrés : la description se referme sur le départ (< 5 cm) ; sur les droites (à 8 m de leurs bouts),
    la pire courbure vaut 1/17 210 244 587 987 m (critère < 1/3000) ; dans chaque virage, la courbure garde le
    bon signe ; dans chaque chicane, elle change de signe exactement 2 fois et commence du bon côté.
    dessus.png : les droites sont droites.
    Garde-fou ajouté au test de vitesse : la médiane doit être sous 10 ms.

  2 fait — physique.js, en calcul pur. État : x, z, cap, u (avant), v (latéral), r (lacet). Modèle « vélo » :
    pneus avant et arrière avec force latérale = rigidité × charge × angle de glissement, plafonnée par l'adhérence ;
    appui aérodynamique (charge = poids + APPUI × v²) ; braquage max divisé par (1 + v/25) ; moteur limité en force
    puis en puissance ; traînée ; frein proportionnel à la charge (plus fort à haute vitesse). Sous 3 m/s, la voiture
    roule sans glisser (évite les à-coups à l'arrêt) ; marche arrière lente (2,5 m/s max) quand on freine à l'arrêt.
    Herbe : adhérence × 0,5 et frottement en plus. Barrières : la voiture est ramenée contre la barrière, sa vitesse
    vers la barrière repart à 30 % dans l'autre sens, et elle perd 30 % le long : elle ne traverse jamais.
    Les commandes au clavier montent et descendent progressivement (rampes dans donnees.js) ; le robot et les IA
    donnent leurs commandes sans rampe. Tous les chiffres sont dans donnees.js.

  3 fait — voiture3d.js : nez, aileron avant avec dérives, aileron arrière avec dérives et support, pontons, fond plat,
    capot moteur, prise d'air, casque, halo (arceau et pilier), bras de suspension, 4 roues (les roues tournent avec
    la vitesse, les roues avant braquent). Couleur d'écurie en paramètre (VOITURE3D.creer(couleur)).
    L'affichage dessine etatAffiche(voiture, alpha) : entre l'état d'avant le pas et l'état d'après.
    Capture voiture.png (?camera=vitrine). Nombre de triangles de la voiture : pas mesuré à part.

  4 fait — Flèches / ZQSD / WASD (e.code). La voiture part à l'arrêt sur la ligne. C : derrière (ressort amorti
    critique, champ de vision de 60° à 75° selon la vitesse) → cockpit (œil à la place du casque, casque caché) →
    télé (13 postes au bord de la piste, derrière la barrière, le plus proche suit la voiture en zoomant) → derrière.
    Espace : remise au point le plus proche, au centre, dans le bon sens, à l'arrêt (traitée au pas de physique suivant).
    Affichage provisoire : la vitesse en km/h, « HORS PISTE » / « OFF TRACK », et une ligne d'aide. Les textes sont
    dans textes.js (anglais par défaut, français si le navigateur est en français).
    ?camera=libre marche toujours, et dans ce mode les flèches ne font pas rouler la voiture.
    La caméra qui fait le tour est maintenant ?camera=auto (par défaut, c'est la caméra derrière la voiture).

  5 fait — robot.js : il vise un point de la ligne du milieu (au moins 12 m devant, ou 0,55 s), freine pour ne pas
    dépasser 85 % de la vitesse limite des virages dans les 400 m devant (freinage prévu : 22 m/s²).
    Un tour lancé de l'arrêt : 66,55 s, 0 contact de barrière, 0 pas dans l'herbe, écart max au centre 2,68 m,
    calcul en 44 à 70 ms.

  Nom du jeu : <title>Grand Prix Dynasty</title> et la clé texte('nomDuJeu') dans textes.js. Un test vérifie
    que le titre est égal à texte('nomDuJeu') et vaut « Grand Prix Dynasty ». Aucune trace de NOM_DU_JEU.

Sortie des tests (python3 tests/lancer.py, réelle, passage 1 sur 2, code de sortie 0) :
⏱ tests/test.html : 5 s
RESULTAT 58/58
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
  (médiane 0.60 ms, meilleur 0.40 ms [0.4 0.4 0.5 0.5 0.5 0.5 0.6 0.6 0.7 0.7 0.8 0.9 1.2 1.9 4.9])
✔ vitesse : 20 voitures × 120 pas = 2400 appels en moins de 2 ms (médiane sous 10 ms)
  (longueur 3183.8 m, 1592 échantillons de 2.000 m, construit en 14.8 ms)
✔ construction : longueur, échantillons, temps
  (0–100 : 2.64 s)
✔ 0–100 km/h en 2,6 s environ (entre 2,3 et 2,9 s)
  (vitesse max : 328.9 km/h)
✔ vitesse max ≈ 330 km/h (entre 320 et 340)
  (300 → 80 km/h : 101.1 m en 2.10 s)
✔ freinage de 300 à 80 km/h en 70 à 160 m
✔ le frein arrête la voiture sans la faire reculer, puis la marche arrière est lente
  (limite théorique à 100 m : 175 km/h ; à 80 % : écart au centre ≤ 1.01 m, vitesse 138.5–138.5 km/h)
✔ virage de 100 m à 80 % de la vitesse limite : la voiture tient le cercle à vitesse stable
✔ virage de 100 m à 125 % de la vitesse limite : la voiture sort du virage
  (4 s plein gaz : piste 146 km/h, herbe 103 km/h)
✔ l’herbe ralentit
✔ une barrière n’est jamais traversée, même de face à 330 km/h
✔ Espace : remise au centre, dans le bon sens, à l’arrêt
✔ au clavier, les commandes montent progressivement
✔ la direction est moins sensible à haute vitesse
✔ mêmes entrées = exactement la même trajectoire, à 30 et à 144 images/s
✔ l’affichage interpole entre l’état d’avant et l’état d’après
  (robot : tour en 66.55 s, écart max au centre 2.68 m, 0 contacts de barrière, 0 pas dans l’herbe, calcul 66 ms)
✔ le robot fait un tour complet sans toucher de barrière, en 45 à 75 s, et le test dure moins de 5 s
✔ même graine, même suite
✔ deux graines, deux suites
✔ les nombres sont dans [0, 1[ et bien répartis
✔ sans graine, le hasard vient de Math.random
✔ aucune erreur JavaScript
RESULTAT 63/63
✔ index.html 960×600 : console vide
✔ index.html 960×600 : pas de défilement
✔ index.html 960×600 : la scène 3D a démarré
✔ index.html 960×600 : le circuit est dessiné
✔ index.html 960×600 : sans debug, pas de compteur
✔ index.html?debug=1 960×600 : console vide
✔ index.html?debug=1 960×600 : pas de défilement
✔ index.html?debug=1 960×600 : la scène 3D a démarré
✔ index.html?debug=1 960×600 : le circuit est dessiné
✔ index.html?debug=1 960×600 : images par seconde et triangles affichés
✔ index.html 1280×720 : console vide
✔ index.html 1280×720 : pas de défilement
✔ index.html 1280×720 : la scène 3D a démarré
✔ index.html 1280×720 : le circuit est dessiné
✔ index.html 1280×720 : la voiture attend sur la ligne, à l’arrêt
✔ index.html 1280×720 : le titre est le nom du jeu, sans « F1 »
✔ index.html 1280×720 : ↑ fait avancer la voiture
✔ index.html 1280×720 : la voiture est dessinée entre l’état d’avant et l’état d’après
✔ index.html 1280×720 : ← fait tourner la voiture à gauche
✔ index.html 1280×720 : ↓ freine
✔ index.html 1280×720 : la voiture a roulé
✔ index.html 1280×720 : C passe au cockpit
✔ index.html 1280×720 : C passe à la télé
✔ index.html 1280×720 : C revient derrière
✔ index.html 1280×720 : dans l’herbe, « hors piste » s’affiche
✔ index.html 1280×720 : Espace remet la voiture au centre de la piste, à l’arrêt
✔ index.html 1280×720 : la vitesse s’affiche en km/h
✔ index.html 1280×720 : sans debug, pas de compteur
✔ index.html?debug=1 1280×720 : console vide
✔ index.html?debug=1 1280×720 : pas de défilement
✔ index.html?debug=1 1280×720 : la scène 3D a démarré
✔ index.html?debug=1 1280×720 : le circuit est dessiné
✔ index.html?debug=1 1280×720 : images par seconde et triangles affichés
✔ index.html?camera=auto 1280×720 : console vide
✔ index.html?camera=auto 1280×720 : pas de défilement
✔ index.html?camera=auto 1280×720 : la scène 3D a démarré
✔ index.html?camera=auto 1280×720 : le circuit est dessiné
✔ index.html?camera=auto 1280×720 : la caméra fait le tour toute seule
✔ index.html?camera=auto 1280×720 : sans debug, pas de compteur
✔ index.html?camera=libre 1280×720 : console vide
✔ index.html?camera=libre 1280×720 : pas de défilement
✔ index.html?camera=libre 1280×720 : la scène 3D a démarré
✔ index.html?camera=libre 1280×720 : le circuit est dessiné
✔ index.html?camera=libre 1280×720 : sans touche, la caméra libre ne bouge pas
✔ index.html?camera=libre 1280×720 : la flèche ↑ fait avancer la caméra
✔ index.html?camera=libre 1280×720 : la molette rapproche la caméra
✔ index.html?camera=libre 1280×720 : en caméra libre, les flèches ne font pas rouler la voiture
✔ index.html?camera=libre 1280×720 : sans debug, pas de compteur
✔ index.html?camera=dessus 1280×720 : console vide
✔ index.html?camera=dessus 1280×720 : pas de défilement
✔ index.html?camera=dessus 1280×720 : la scène 3D a démarré
✔ index.html?camera=dessus 1280×720 : le circuit est dessiné
✔ index.html?camera=dessus 1280×720 : sans debug, pas de compteur
✔ index.html?camera=virage 1280×720 : console vide
✔ index.html?camera=virage 1280×720 : pas de défilement
✔ index.html?camera=virage 1280×720 : la scène 3D a démarré
✔ index.html?camera=virage 1280×720 : le circuit est dessiné
✔ index.html?camera=virage 1280×720 : sans debug, pas de compteur
✔ index.html?camera=vitrine 1280×720 : console vide
✔ index.html?camera=vitrine 1280×720 : pas de défilement
✔ index.html?camera=vitrine 1280×720 : la scène 3D a démarré
✔ index.html?camera=vitrine 1280×720 : le circuit est dessiné
✔ index.html?camera=vitrine 1280×720 : sans debug, pas de compteur
  (circuit 3D : 16626 triangles, construit en 29 ms sous swiftshader)
⏱ tests/ecrans.py : 66 s
TOUT PASSE
Passage 2 : TOUT PASSE aussi (code 0) : test.html 58/58, ecrans.py 63/63.
(Les 8 lignes « 1 s affichée à N images/s = exactement 120 pas » sont passées aussi ; je les ai enlevées ici pour la longueur.)

Mesures :
  - 0–100 km/h : 2,64 s ; vitesse max : 328,9 km/h ; 300 → 80 km/h : 101,1 m en 2,10 s.
  - Virage de 100 m : limite théorique 175 km/h ; à 80 %, la voiture tient le cercle (écart ≤ 1,01 m, vitesse stable
    à 138,5 km/h) ; à 125 %, elle sort.
  - Herbe : après 4 s plein gaz, 146 km/h sur la piste contre 103 km/h dans l'herbe.
  - Robot : tour en 66,55 s (3100 m, départ arrêté).
  - Circuit 3D : 16 034 triangles. CIRCUIT_TEST : 3100,0 m, 1550 échantillons.
  - Suite complète : 65 à 75 s.

Ce que je n'ai pas pu vérifier :
  - la SENSATION de conduite : personne n'a conduit à part les tests. Les chiffres sont des premiers réglages
    (donnees.js) : c'est au propriétaire de dire si ça tourne trop, si le freinage est mou, etc. ;
  - la marche arrière et les chocs contre la barrière au clavier (testés seulement par le calcul) ;
  - le dérapage « si on entre trop vite » est vérifié seulement par le test à 125 % (la voiture sort du virage),
    pas par une mesure de l'angle de dérive ;
  - le nombre de triangles de la voiture seule, et les images par seconde réelles avec la voiture ;
  - la caméra télé est jugée sur une seule capture (tele.png) ; les changements de poste pendant un tour n'ont pas été regardés ;
  - le cockpit : le halo prend le haut de l'écran et son pilier le milieu (comme une vraie vue de F1). C'est un choix
    à faire valider par le propriétaire ;
  - pas de son du moteur (prévu au tour 4).

Réévalue.
```
