TOUR 10 — étape 4 refaite : des pilotes qui choisissent leur ligne — rapport du Chef
Commit vérifié : 0c5ee77 (code 37196cd + bc85623)
Note : 49/100 — conduite 12/20, course et IA 10/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5
Tests : relancés par le Chef → TOUT PASSE (test.html 124/124, ecrans.py 147/147, 93 s).
Mesures : 10 courses de 10 IA (graines 1–5, deux circuits) : toutes arrivent, 0 contact, 0 barrière, 0 coupe, 0 herbe ; 20 voitures : 1,3–1,5 s de calcul, 1 touchette à 3 m/s ; contacts 20 voitures × 120 pas : 0,3 ms ; page ?ia=10 : 21 appels de dessin (6 i/s sous swiftshader, sans valeur).

Ce qui marche : les contacts (jamais traversés, quantité de mouvement conservée), simulation.js, ?ia=N avec Tab. Tour propre.

Ce qui ne va pas (du plus grave au moins grave) :
- C'EST UNE PROCESSION. test, graine 1 : l'ordre d'arrivée est l'ordre de la grille (n° 2, 1, 4, 3, 6, 5, 8, 7, 10, 9), tous les meilleurs tours entre 50,54 et 50,64 s. Le n° 2, le plus lent (rythme 0,940), gagne parce qu'il part devant. Le rythme ne sert à rien. C'est la conséquence directe du rail.
- Décision du propriétaire (CLAUDE.md, commit 697c02f) : plus de rail. Chaque IA choisit sa ligne en roulant ; deux IA ne passent jamais exactement au même endroit.
- Au départ, la 2e file passe parfois devant la 1re en se rabattant (pas voulu).

Le plan du Codeur (compte rendu du tour 9) est accepté : on garde la physique, les contacts, simulation.js, les fonctions de vitesse et les passes avant/arrière, la poursuite, le réglage gaz/frein, le rattrapage. La trajectoire unique devient au plus une « carte » de ce que le circuit permet, jamais la ligne suivie.

ORDRES :
1. Le pilote qui choisit sa ligne : toutes les IA_PERIODE_DECISION s (0,1–0,2), il construit quelques lignes possibles sur les IA_HORIZON m devant lui (150–250 m), qui partent de là où il EST (pas de saut) : continuer sa ligne, ligne rapide, intérieur, extérieur, à gauche ou à droite de la voiture devant. Il note chacune (temps estimé, moins des pénalités : bords, voitures, freinage impossible) et suit la meilleure avec la poursuite et le réglage gaz/frein actuels. Il ne voit que la piste et les voitures dans son champ de vision.
   Fini quand : seul, 5 tours : technique ≤ 56 s, test ≤ 50 s, 0 barrière, 0 coupe, 0 herbe. Le calcul d'un pilote reste petit : 20 IA × 120 pas, coût mesuré et affiché (< 2 ms par pas pour les 20 en moyenne).
2. Chaque pilote a sa façon de piloter, tirée avec la graine et rangée dans donnees.js (préparation de 4d) : point de corde (tôt/tard), marge de freinage, prise de risque près des bords, et un peu de variation d'un tour à l'autre.
   Fini quand : un test fait rouler 10 IA, seules, chacune sur le technique : à l'apex de chaque virage, l'écart-type de leurs positions latérales est > 0,5 m ; et une même IA ne passe pas deux tours de suite au même endroit (écart > 0,2 m à au moins un apex). Les écarts sont affichés.
3. Doubler quand on est plus rapide (le début de 4c) : si la voiture devant est plus lente, une ligne à côté d'elle peut gagner, surtout au freinage et en sortie de virage. La voiture doublée ne change pas de ligne pour bloquer (la défense, c'est le tour suivant).
   Fini quand : les 10 courses de 10 IA (graines 1–5, deux circuits) affichent les dépassements : au moins 20 au total ; l'ordre d'arrivée diffère de la grille dans au moins 8 courses sur 10 ; la voiture au meilleur rythme finit dans les 3 premiers dans au moins 6 courses sur 10 ; chocs à plus de 5 m/s : au plus 3 au total ; barrières et coupes : au plus 3 au total, chacun affiché. Si c'est trop pour ce tour, fais 1 et 2, commite vert, et dis où tu en es sur 3.
4. Le rail ne sert plus à conduire : ?ia=1, ?ia=N et simulerCourse utilisent le nouveau pilote. Les anciens tests du rail qui n'ont plus de sens sont remplacés (dis lesquels).
   Fini quand : ecrans.py lance ?course=5&ia=10&circuit=technique, console vide, les 10 avancent, capture ia10.png.

Commit « Tour 10 : des pilotes qui choisissent leur ligne » seulement si `python3 tests/lancer.py` passe. CLAUDE.md : le propriétaire autorise les mises à jour de documentation en auto mode ; ajoute ce qui change (ia.js) si tes règles l'acceptent, sinon je le fais. Identité git : continue comme au tour 9 (le propriétaire <266356357+cotangeante-pi@users.noreply.github.com>, sans toucher à la configuration). Compte rendu dans rapports/tour-10-compte-rendu.md, puis « Réévalue. » à session-76.

Questions pour le propriétaire : aucune ; il regardera ?ia=10&circuit=technique après ce tour.
