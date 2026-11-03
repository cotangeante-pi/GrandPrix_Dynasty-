TOUR 2 — étape 1 (le circuit, fait à partir de sa courbe) — rapport du Chef
Commit vérifié : 044c78f (code a4f5bdd)
Note : 10/100 — conduite 0/20, course et IA 0/20, championnat 0/15, interface 0/15, 3D et perf 1/15, code et tests 8/10, Poki 1/5
Tests : relancés par le Chef, `python3 tests/lancer.py` → TOUT PASSE (test.html 23/23, ecrans.py 24/24, 55 s).
Mesures : three.min.js 633 Ko, le reste < 25 Ko. Images par seconde réelles : pas encore mesurées (demandé au propriétaire).

Ce qui marche (vérifié par le Chef, pas sur parole) :
- boucle propre : accumulateur, plafond de 12 pas, EPSILON, onglet caché, simuler() sans affichage ;
- les tests attrapent bien une erreur ou un avertissement dans la console ;
- capture 1280×720 : ciel, sol, cube rouge. Étape 0 : critère atteint. Bon travail.

À garder en tête (pas un ordre pour ce tour) :
- l'affichage ne se sert pas encore de `alpha` : le cube saute d'un pas à l'autre. Pour la voiture (étape 2), l'affichage devra interpoler entre l'état d'avant et l'état d'après, sinon la conduite saccadera à 144 Hz ou à 50 Hz.
- le `keydown` bloque Espace partout : quand il y aura des boutons et des champs, il ne faudra pas bloquer les touches d'un champ qui a le focus.

ORDRES (étape 1 ; tu as le droit d'enlever le cube) :

1. Le circuit en données et en calcul pur — `circuits.js`. Unité : 1 = 1 mètre (à écrire dans CLAUDE.md, « La technique »). Un circuit = une liste de points de contrôle (x, z) au milieu de la piste, fermée, + une largeur (12 à 14 m) et ses 3 secteurs. La courbe : une spline fermée (Catmull-Rom centripète, écrite par nous, SANS Three.js, pour que le moteur marche sans 3D), échantillonnée régulièrement par distance (ex. tous les 2 m) : pour chaque échantillon, la position, la tangente, la normale, la courbure, la distance depuis la ligne d'arrivée. Le circuit de test : `CIRCUIT_TEST`, un ovale avec deux chicanes et au moins un virage serré, 2,5 à 3,5 km.
   Fini quand : des tests vérifient que la longueur est stable (échantillonnage à 1 m et à 2 m : moins de 0,5 % d'écart), que les échantillons sont régulièrement espacés, et que la piste ne se recoupe nulle part (deux bords de piste éloignés le long de la courbe ne se touchent pas).

2. Où est un point sur la piste — `positionSurPiste(circuit, x, z)` → { s (distance le long, depuis la ligne d'arrivée), d (écart au centre, signé), surPiste (|d| ≤ largeur/2), secteur (1, 2, 3) }. Elle doit être rapide (20 voitures × 120 pas/s) : partir d'un indice d'échantillon connu (`indiceDepart`) et chercher seulement autour, avec une recherche complète en secours.
   Fini quand : des tests sur des points connus (sur la ligne, au milieu d'une droite, à gauche, à droite, hors piste, dans chaque secteur, juste avant et juste après la ligne d'arrivée) donnent le bon résultat, et un test de vitesse montre 20 × 120 appels en moins de 2 ms (dans Chrome sans fenêtre).

3. Le dessin du circuit — `scene3d.js` construit à partir des échantillons : la route (ruban), les bords blancs, des vibreurs rouges et blancs seulement dans les virages (courbure au-dessus d'un seuil réglé dans `donnees.js`), l'herbe, des barrières le long de la piste à une distance réglable, la ligne d'arrivée en damier, un repère discret pour chaque secteur. Tous les chiffres dans `donnees.js`. Pas de texture lourde ; un damier ou un vibreur peut être une petite texture faite par le code (canvas).
   Fini quand : les captures montrent le circuit complet vu de dessus, et une vue basse dans un virage montre les vibreurs et la barrière ; console vide.

4. La caméra libre — par défaut, la caméra fait lentement le tour du circuit, en hauteur. Avec `?camera=libre` : souris (glisser = tourner, molette = zoom) et flèches/ZQSD/WASD pour se déplacer, écrite par nous (pas de fichier OrbitControls). `?debug=1` affiche en plus le nombre de triangles.
   Fini quand : on peut survoler tout le circuit ; un test vérifie que la caméra libre bouge quand on appuie sur une flèche.

5. Les tests et les mesures — ajoute au compte rendu : nombre de triangles du circuit, longueur de CIRCUIT_TEST, temps de construction du circuit. Captures dans tests/captures/ : dessus.png, virage.png (1280×720).
   Fini quand : `python3 tests/lancer.py` → TOUT PASSE, deux fois de suite.

Pas de voiture dans ce tour (c'est l'étape 2). Écris `rapports/tour-02-compte-rendu.md`, commite « Tour 2 : le circuit » si tout est vert, et envoie-moi le compte rendu avec « Réévalue. » à la fin. Rappel : on fige à 21h ; je te préviens à 20h40.

Questions pour le propriétaire : ouvrir `index.html?debug=1` dans Chrome et dire combien d'images par seconde s'affichent (mesure réelle de son Mac).
