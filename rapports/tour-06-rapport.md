TOUR 6 — finition de l'étape 3 (petit tour, à commiter avant 20h35) — rapport du Chef
Commit vérifié : 860c68b (code 44b3624)
Note : 42/100 — conduite 12/20, course et IA 5/20, championnat 1/15, interface 6/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5
Tests : relancés par le Chef → TOUT PASSE (test.html 82/82, ecrans.py 112/112, 76 s).
Mesures : robot 5 tours en 314,74 s (tour 1 66,55 s, ensuite 62,05 s). Le propriétaire, après le tour 4 : > 90 images/s.

Ce qui marche (vérifié sur les captures) : écran de choix clair, chrono lisible, secteurs en couleur, écran de fin avec ★ et « Nouveau record ! ». Bon tour.

Ce qui ne va pas :
- course.png : à 0:11.783 du tour 3, les cases S1 S2 S3 montrent déjà trois temps. Ce sont ceux du tour d'avant, on dirait ceux du tour en cours. C'est trompeur.
- fin.png : le bandeau de course reste visible derrière l'écran de fin, et la voiture continue en roue libre.
- Le seuil de virage coupé (2 m) n'a pas été essayé par un vrai joueur : on attend le propriétaire.

ORDRES (petit tour : seulement ce qui est sûr d'être vert avant 20h35) :
1. Les secteurs du tour en cours : une case reste grise (« S2 –.– ») tant que le secteur n'est pas fini dans CE tour ; elle prend sa couleur quand il est fini. Le tour d'avant reste visible en petit sous le chrono (« Tour précédent 1:02.050 »).
   Fini quand : un test vérifie qu'au début d'un tour les 3 cases sont grises, puis que S1 se colore après le secteur 1.
2. Après l'arrivée : la voiture freine toute seule jusqu'à l'arrêt (commandes coupées), et le bandeau de course se cache sous l'écran de fin.
   Fini quand : un test vérifie la vitesse = 0 moins de 6 s après l'arrivée et que le bandeau est caché.
3. Deux petits sons dans son.js : un bip pour 3-2-1 et un plus aigu pour GO, et un son d'arrivée. Rien avant le premier geste, M coupe tout.
   Fini quand : un test vérifie que les sons sont demandés au bon moment (sans écouter).

Commit « Tour 6 : finition du chrono » avant 20h35, pas de push, puis compte rendu et « Réévalue. ». Si un ordre n'est pas vert à 20h35, ne le commite pas : dis-le.
