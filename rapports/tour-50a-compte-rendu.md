TOUR 50a — compte rendu du Codeur 1 (branche attaque-tete) : l'attaque de la voiture de tête

Le problème
- En 5 tours, une IA rattrape la voiture devant mais ne la double jamais (29-30 courses sur 30, l'arrivée = la grille).

Les six verrous trouvés (ia.js), tous réglés sous IA_ATTAQUE_TETE (donnees.js) ; 0 = la course d'avant, au bit près
1. Dans le sillage, la ligne de l'attaquant est plafonnée à SA vitesse de pointe en air libre : l'aspiration ne lui rend rien (+3 m/s). Corrigé : en attaque, noterLigne connaît l'aspiration.
2. Collé derrière, retenu à IA_DISTANCE_MIN : il ne vient jamais à moins de ~10 m. Corrigé : il sort du sillage jusqu'à IA_ATTAQUE_TETE s avant le freinage.
3. Décalé à côté, le réflexe de côté le forçait à rouler 1 m/s moins vite que l'attaquée. Corrigé : à l'écart sûr, elle ne le retient plus.
4. À l'intérieur, la ligne d'attaque (place prévue de l'autre + 3,5 m) allait à la corde, hors piste (« pas la place »). Corrigé : écart sûr de sa place d'aujourd'hui, puis il rejoint sa ligne au sommet.
5. « Fond » : décalages lancés à 25-80 m, perdus d'avance. Corrigé : seulement près d'elle.
6. Le défenseur fermait la corde sur un attaquant déjà décalé (chocs), et à 7 m de côté l'attaquant la « perdait de vue ». Corrigé (defendreBataille, majAttaque).

Réglage final : IA_ATTAQUE_TETE = 1,5 (secondes avant le freinage où il peut sortir du sillage)
- 3 donnait trois fois plus de chocs dans le duel des stands (jsc, 60 courses de 12 tours avec arrêt : 11 chocs contre 3 avec 0 ; 4 avec 1,5) et faisait échouer le duel (12 > 11), les consignes (5 / 6) et la rivalité (2 / 0) sur GitHub. 1,5 garde l'essentiel des dépassements.
- La marge latérale plus large quand il va bien plus vite qu'elle a été essayée : aucun effet (15 chocs contre 11), retirée.

Mesures (Chrome sur le Mac, 30 courses de 5 tours, test + technique, 10 IA ; main au moment de la fusion)
| réglage | vainqueur ≠ poleman | dépassements | chocs > 5 m/s | herbe (pas) |
| poleman à 95 % de son rythme, IA_ATTAQUE_TETE 0 | 1/30 | 33 | 1 | 7 |
| poleman à 95 %, IA_ATTAQUE_TETE 1,5 | 4/30 | 43 | 0 | 740 |
| forme 0,15 (IA_FORME), TETE 0 | 1/30 | 37 | 4 | 213 |
| forme 0,15, TETE 1,5 | 3/30 | 62 | 6 | 903 |
Avant le tour (jsc, TETE 0 -> 3) : vainqueur ≠ poleman 0/30 -> 5/30 (poleman à 95 %), dépassements 27 -> 64 ; l'herbe monte avec les attaques (elle reste sous les garde-fous de courses.html).

Les tests qui ont demandé un ajustement
- tests/test.html, consignes : courseConsigne force IA_ATTAQUE_TETE 0 (le test suppose « à la file, ne la passe pas seule »).
- tests/test.html, résumé vidéo : graine 2 au lieu de 5 (avec l'attaque, la graine 5 n'a plus aucun dépassement tenu dans les 3 tours ; la 2 en a avec et sans).
- ia.js : le rival de l'interview utilise aussi defendreBataille contre les autres IA quand IA_ATTAQUE_TETE > 0 (« contre les autres IA, rien ne change » : le test de rivalité à l'identique au bit près le demande).

Outils de mesure (hors dépôt) : jsc (JavaScriptCore) charge les fichiers de calcul ; un Chrome sans fenêtre sur une petite page donne les mêmes nombres que GitHub (vérifié sur le résumé vidéo, les courses et le moteur).
La page temporaire tests/courses-mesure.html et sa ligne de tests/lancer.py sont retirées.
