TOUR 9 — étape 4b (plusieurs IA sans se percuter) — rapport du Chef
Commit vérifié : 86fa93b (code 7cd8ce5)
Note : 48/100 — conduite 12/20, course et IA 9/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5
Tests : TOUT PASSE (103/103, 135/135) au tour 8, relancés par le Chef.
Le propriétaire : « continuez à travailler » → feu vert pour 4b. Il n'a pas encore regardé ?ia=1 ; ses retours peuvent changer la conduite de l'IA plus tard.

Ce qui manque (du plus grave au moins grave) :
- Les voitures ne se touchent pas : la physique n'a aucun contact voiture–voiture. Avec plusieurs voitures, ce seraient des fantômes (interdit par CLAUDE.md).
- Aucune simulation à plusieurs : « devant » est un point imaginaire, pas une vraie voiture.
- Toutes les IA iraient exactement à la même vitesse : on ne verrait jamais un rapide coincé derrière un lent.
- On ne peut pas regarder plusieurs voitures dans la page, et on ne sait pas ce que coûtent 20 voitures.

RÈGLES (rappel) : même physique pour tous ; l'IA ne voit que la piste, sa voiture et les voitures qu'un pilote verrait devant elle ; tous les chiffres dans donnees.js ; pas de dépassement voulu à ce tour (c'est 4c) ; pas de push.

ORDRES :
1. Les contacts entre voitures, dans physique.js (calcul pur, le même pour le joueur et les IA) : chaque voiture est un rectangle (LONGUEUR_VOITURE ≈ 5,5 m, LARGEUR_VOITURE ≈ 2 m dans donnees.js), deux voitures qui se chevauchent sont écartées et échangent de la vitesse (choc mou, rebond réglable), sans jamais se traverser, même à 90 m/s d'écart. Les contacts sont comptés par voiture.
   Fini quand : des tests vérifient : une voiture rapide qui arrive par derrière ne traverse pas (choc à 30 et 90 m/s d'écart), un choc latéral pousse sur le côté, la quantité de mouvement totale est à peu près conservée, deux voitures au contact ne restent pas collées. Le coût pour 20 voitures × 120 pas est mesuré et affiché.
2. simulation.js, une course entre IA sans affichage (calcul pur) : simulerCourse(circuit, nbVoitures, nbTours, graine) place les voitures sur une grille (deux files décalées, ~8 m entre deux places), lance toutes les IA, applique les contacts, et rend pour chaque voiture : ordre d'arrivée, temps, meilleur tour, contacts voiture, contacts barrière, pas dans l'herbe, virages coupés. « devant » est maintenant calculé depuis les vraies positions : la voiture la plus proche devant, dans un cône de vision vers l'avant (angle et distance dans donnees.js), avec sa distance et sa vitesse.
   Fini quand : simulerCourse marche sur les deux circuits et ses résultats sont identiques avec la même graine.
3. Des rythmes différents : chaque IA a un IA_RYTHME (par exemple 0,94 à 1,00, un facteur sur sa vitesse conseillée, tiré avec la graine). Pas de dépassement voulu : un rapide reste derrière un lent.
   Fini quand : la simulation affiche le rythme de chaque voiture, et un test montre qu'un rapide derrière un lent s'en rapproche puis reste derrière sans le toucher.
4. Le critère de 4b : 10 voitures, 5 tours, graines 1 à 5, sur les deux circuits (10 courses).
   Fini quand : test.html affiche un tableau par course ; toutes les voitures finissent ; contacts voiture–voiture : 0 à plus de 5 m/s d'écart de vitesse, et au plus quelques touchettes au départ (affichées) ; 0 contact de barrière ; 0 virage coupé ; durée de calcul d'une course affichée. Les mêmes chiffres pour 20 voitures sur 1 graine (pour savoir si 20, c'est trop).
5. `?ia=N` (par exemple ?ia=10&circuit=technique) : la page montre N voitures IA en course (couleurs différentes, même modèle), la caméra suit l'une d'elles (touche Tab pour passer à la suivante si c'est simple, sinon la première). ?debug=1 affiche les images par seconde.
   Fini quand : ecrans.py lance ?course=5&ia=10&circuit=technique, console vide, les 10 voitures avancent, capture tests/captures/ia10.png.

Commit « Tour 9 : plusieurs IA » seulement si `python3 tests/lancer.py` passe. Si le tour est trop gros, fais 1, 2, 4 d'abord, commite vert, et dis ce qui reste. Compte rendu dans rapports/tour-09-compte-rendu.md, puis « Réévalue. » à session-76.

Questions pour le propriétaire (toujours ouvertes) : ?ia=1 a-t-il l'air d'une vraie F1 ? Le circuit technique est-il assez difficile ? Le Chef peut-il compléter la liste des fichiers de CLAUDE.md ?
