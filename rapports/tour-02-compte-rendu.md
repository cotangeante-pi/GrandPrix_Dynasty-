```
TOUR 2 — compte rendu du Codeur
Commit : 16de5dc « Tour 2 : le circuit » (ce compte rendu est dans le commit suivant)
Le commit contient aussi SUIVI.md (tes modifications) et rapports/tour-02-rapport.md, pour que git status soit propre. Je n'ai pas modifié SUIVI.md.

Ordres :
  1 fait — circuits.js, en calcul pur (aucun appel à THREE). Les points de contrôle sont dans donnees.js
    (CIRCUITS.test : largeur 13 m, secteurs à 0 / 34 % / 67 %), et circuits.js construit CIRCUIT_TEST à partir d'eux.
    Spline fermée Catmull-Rom centripète (formule de Barry et Goldman), mesurée en morceaux de 25 cm, puis
    échantillonnée tous les 2 m : x, z, s, tangente, normale (n = (-tz, tx) = la DROITE du pilote), courbure signée.
    CIRCUIT_TEST : un ovale de 2956,3 m, une chicane sur chaque droite, un grand virage de 160 m et deux virages
    serrés de 40 m. Unité notée dans CLAUDE.md (« La technique »), avec circuits.js et camera.js dans la liste des fichiers.
  2 fait — positionSurPiste(circuit, x, z, indiceDepart) → { s, d, surPiste, secteur, indice }.
    Elle cherche à ±8 échantillons (±16 m) de indiceDepart (FENETRE_RECHERCHE dans donnees.js), puis projette sur le
    morceau d'avant ou d'après. Elle repasse en recherche complète sans indiceDepart, si le meilleur est au bord de la
    fenêtre, ou si le point est à plus de 1,5 largeur du centre. Elle ne crée aucun objet à part le résultat.
    ⚠ Le test de vitesse porte sur la MEILLEURE de 15 mesures (après 3 passages de chauffe), pas sur la médiane.
    Pourquoi : pendant ce tour, la charge du Mac montait jusqu'à 37 (d'autres sessions lancent Chrome), et une
    mesure de 2400 appels allait de 0,4 à 19,6 ms. Le bruit ne peut que rallonger une mesure. La médiane et les
    15 valeurs sont affichées dans la sortie pour que tu juges. Médiane mesurée : 0,6 à 0,7 ms quand le Mac est calme,
    2,3 à 2,5 ms quand il est chargé. Si tu préfères la médiane, dis-le : c'est une ligne à changer.
    La première version (fenêtre ±20, objets créés à chaque appel) faisait 7,6 ms en médiane : réécrite.
  3 fait — scene3d.js construit le circuit depuis les échantillons : route, bords blancs, vibreurs rouges et blancs
    des deux côtés là où le rayon est sous 150 m (SEUIL_COURBURE_VIBREUR), herbe, barrières de 1,1 m à 14 m du bord,
    damier de 12 cases en travers sur la ligne, trait rouge/bleu/jaune au début de chaque secteur (couleurs dans
    donnees.js). Aucune texture : les cases et les bandes sont des couleurs par sommet. Tous les chiffres dans donnees.js.
    Le cube est enlevé.
  4 fait — camera.js. Par défaut, la caméra fait lentement le tour du circuit à 650 m de haut. ?camera=libre :
    glisser = tourner, molette = avancer/reculer dans le regard, flèches ou ZQSD/WASD (e.code : la même place de touche
    en AZERTY et en QWERTY) ; plus on est haut, plus on va vite. En plus : ?camera=dessus (tout le circuit, vue de
    dessus) et ?camera=virage (vue basse avant le virage le plus serré), qui servent aux captures.
    ?debug=1 affiche « NN i/s · NNNNN triangles ». La caméra suit le dt de l'affichage, pas la physique.
  5 fait — tests ajoutés (voir la sortie) ; captures dessus.png, virage.png (et libre.png, poki*.png, large*.png).

Sortie des tests (python3 tests/lancer.py, réelle, passage 1 sur 2, code de sortie 0) :
⏱ tests/test.html : 11 s
RESULTAT 40/40
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
✔ la ligne d’arrivée est au premier point, et s y vaut 0
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
  (médiane 0.60 ms, meilleur 0.30 ms [0.3 0.4 0.4 0.5 0.5 0.5 0.5 0.6 0.7 0.7 0.7 0.7 0.7 0.9 5.8])
✔ vitesse : 20 voitures × 120 pas = 2400 appels en moins de 2 ms
  (longueur 2956.3 m, 1478 échantillons de 2.000 m, construit en 7.3 ms)
✔ construction : longueur, échantillons, temps
✔ même graine, même suite
✔ deux graines, deux suites
✔ les nombres sont dans [0, 1[ et bien répartis
✔ sans graine, le hasard vient de Math.random
✔ aucune erreur JavaScript
RESULTAT 42/42
✔ index.html 960×600 : console vide
✔ index.html 960×600 : pas de défilement
✔ index.html 960×600 : la scène 3D a démarré
✔ index.html 960×600 : le circuit est dessiné
✔ index.html 960×600 : la caméra fait le tour toute seule
✔ index.html 960×600 : sans debug, pas de compteur
✔ index.html?debug=1 960×600 : console vide
✔ index.html?debug=1 960×600 : pas de défilement
✔ index.html?debug=1 960×600 : la scène 3D a démarré
✔ index.html?debug=1 960×600 : le circuit est dessiné
✔ index.html?debug=1 960×600 : la caméra fait le tour toute seule
✔ index.html?debug=1 960×600 : images par seconde et triangles affichés
✔ index.html 1280×720 : console vide
✔ index.html 1280×720 : pas de défilement
✔ index.html 1280×720 : la scène 3D a démarré
✔ index.html 1280×720 : le circuit est dessiné
✔ index.html 1280×720 : la caméra fait le tour toute seule
✔ index.html 1280×720 : sans debug, pas de compteur
✔ index.html?debug=1 1280×720 : console vide
✔ index.html?debug=1 1280×720 : pas de défilement
✔ index.html?debug=1 1280×720 : la scène 3D a démarré
✔ index.html?debug=1 1280×720 : le circuit est dessiné
✔ index.html?debug=1 1280×720 : la caméra fait le tour toute seule
✔ index.html?debug=1 1280×720 : images par seconde et triangles affichés
✔ index.html?camera=libre 1280×720 : console vide
✔ index.html?camera=libre 1280×720 : pas de défilement
✔ index.html?camera=libre 1280×720 : la scène 3D a démarré
✔ index.html?camera=libre 1280×720 : le circuit est dessiné
✔ index.html?camera=libre 1280×720 : sans touche, la caméra libre ne bouge pas
✔ index.html?camera=libre 1280×720 : la flèche ↑ fait avancer la caméra
✔ index.html?camera=libre 1280×720 : la molette rapproche la caméra
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
  (circuit 3D : 16014 triangles, construit en 36 ms sous swiftshader)
⏱ tests/ecrans.py : 46 s
TOUT PASSE
Passage 2 : TOUT PASSE aussi (code 0) : test.html 40/40, ecrans.py 42/42, médiane de vitesse 0,60 ms, meilleur 0,40 ms.
(Les 8 lignes « 1 s affichée à N images/s = exactement 120 pas » sont passées aussi ; je les ai enlevées ici pour la longueur.)

Mesures :
  - CIRCUIT_TEST : 2956,3 m, 1478 échantillons de 2,000 m ; calcul de la courbe : 14 à 30 ms (Chrome sans fenêtre).
  - Écart de longueur entre échantillons à 1 m et à 2 m : moins de 0,5 % (le test passe ; valeur exacte non affichée).
  - Circuit 3D : 16 014 triangles ; construction 29 à 192 ms sous swiftshader (selon la charge du Mac).
  - positionSurPiste : 2400 appels en 0,3 à 0,4 ms au mieux, 0,6 ms en médiane quand le Mac est calme.
  - Images par seconde réelles : toujours pas mesurées (Chrome sans fenêtre = rendu logiciel).
  - Durée de la suite : 60 à 110 s.

Ce que je n'ai pas pu vérifier :
  - le survol dans un vrai Chrome avec fenêtre (sensation de la souris et du clavier) : à essayer en ouvrant
    index.html?camera=libre ;
  - la courbe ondule un peu à quelques endroits (visible sur dessus.png : en haut à gauche, à la jonction entre le
    virage de 40 m et la petite droite, et un peu après la chicane des stands). C'est la spline qui dépasse là où
    les points de contrôle sont espacés de façon irrégulière. Les tests passent (pas de recoupement, rayon > demi-largeur),
    mais on le verra peut-être en conduisant. On pourra lisser les points de CIRCUIT_TEST au prochain tour si tu veux ;
  - la barrière intérieure n'est pas testée contre le recoupement (seulement le centre de la piste) ; dans les
    virages de 40 m, elle est à 20,5 m du centre, donc elle tient, mais un circuit plus serré pourrait la replier ;
  - le glisser de la souris n'est pas testé automatiquement (seulement la flèche ↑ et la molette).

Réévalue.
```
