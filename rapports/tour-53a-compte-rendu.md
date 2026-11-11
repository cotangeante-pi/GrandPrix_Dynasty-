TOUR 53a - compte rendu du Codeur 1 (branche attaque-tete-2, dernier commit fb3086e ; repli : attaque-tete-2-repli 8dba686)

Fait : origin/main (ce000f0) fusionné ; journal temporaire des chocs de la rivalité dans tests/courses.html (graine, s, d, vitesse, état d'attaque des voitures proches, historique de 3 s, journal des IA : lignes « JOURNALCHOC », « HIST », « JRN » dans le journal GitHub) ;
cache-carte-test.js regénéré (la clé dépend des réglages IA_* : à refaire à chaque changement de réglage IA_* ou de physique).
Les chocs de GitHub (graine 8, rival devant, s 2400-2430) ne se reproduisent pas dans Chrome ni jsc du Mac (flottants différents) : seul GitHub tranche.
Cause du premier choc : le rival (n9) revient vers la ligne du joueur (rival : defendreContreJoueur) alors que le joueur arrive à 26 m/s de plus à 21 m : il lui ferme la porte trop tard, le joueur le touche.
Correction : IA_DEFENSE_TEMPS_MIN (1,2 s ; 0 = avant) : pas de défense si le joueur arrive sur lui en moins de ça. Choc disparu sur GitHub.
Deuxième choc (une attaque abandonnée à 20 m d'une voiture 19 m/s plus lente rejoignait sa ligne trop près) : IA_APPROCHE_DECEL (8 m/s², 0 = avant) et IA_APPROCHE_LONG_DECEL (45 m).
Résultat fb3086e : 17/18, le seul rouge est courses (« pas de casse » 1 choc contre 0) : un empilement derrière le joueur à 2-3 m/s à l'épingle (graine 8, n3 à 30 m/s contre n8 à 7 m/s, 23 m devant) ; le reste (moteur, premier, ecrans-6) est vert avec le cache regénéré, ecrans-2 (manette, pause) était un aléa (vert au passage suivant).
Repli (IA_ATTAQUE_TETE 1,5, 8dba686) : PAS vert, courses a 2 rouges (un choc d'attaquant en « decaler » à 57 m/s contre 44 m/s, graine 7, et « défense : passé 1 / 0 »). Le repli ne vaut donc pas mieux.
Pas fait : la section Saison (passée au Codeur 6 par le Chef).
Reprise : le dernier choc est un effet en chaîne (graine 8) ; piste : pourquoi le joueur-IA tombe à 2-3 m/s à l'épingle derrière le rival (suiveur trop doux ?), ou accepter un seuil de 1 choc dans le test. Retirer le journal temporaire de tests/courses.html une fois vert.
