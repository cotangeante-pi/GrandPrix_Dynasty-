TOUR 51a — compte rendu du Codeur 1 (branche attaque-tete-2) : une sortie d'attaque propre, IA_ATTAQUE_TETE 1,5 -> 3

Le constat
- À IA_ATTAQUE_TETE 3, le duel des stands faisait 12 chocs (plafond 11). Les chocs viennent presque tous d'une attaque abandonnée tout près de la voiture attaquée (« pas à hauteur » à l'entrée du virage, « pas devant au freinage » dans un virage lent) : l'attaquant, à l'intérieur et 10 m/s plus vite, rejoignait sa ligne à travers l'autre.
- Deuxième cause, dans l'attaque qui continue : au sommet, la ligne de l'attaquant rejoignait sa propre ligne (la corde), à 2 m de l'autre voiture qui tournait vers la corde au même moment.

Ce qui change (ia.js, donnees.js ; chaque réglage à 0 = la course d'avant)
1. IA_ATTAQUE_SORTIE (1) : état « sortie ». Au lieu de revenir tout de suite sur sa ligne, l'attaquant qui renonce, avec l'autre voiture encore à moins d'une longueur + marge (+ ce qu'il lui reprend en 0,5 s) devant lui, garde sa place à côté d'elle, lève le pied derrière elle (le réflexe de côté revient, pas de freinage tardif ni d'aspiration) et ne rejoint sa ligne qu'une fois derrière (sortieDistance).
2. IA_ATTAQUE_ECART_MIN (1) et IA_ATTAQUE_ECART_PLUS (-1 m) : quand la ligne de l'attaquant rejoint la sienne au sommet, il reste au moins une largeur + la marge latérale - 1 m (2,5 m) de la voiture attaquée.
3. IA_ATTAQUE_TETE 1,5 -> 3.

Mesures (jsc, mêmes nombres que Chrome ; poleman à 95 % de son rythme, 10 IA)
| 60 courses de 5 tours | vainqueur ≠ poleman | dépassements | chocs > 5 m/s | herbe (pas) |
| avant (main, TETE 1,5) | 6 | 85 | 5 | 829 |
| avant (main, TETE 3)   | 10 | 146 | 6 | 810 |
| après (TETE 3)         | 5 | 123 | 3 | 205 |
Le duel des stands (50 courses de 12 tours avec arrêt, jsc) : avant TETE 3 = 9 chocs (12 sur GitHub), TETE 1,5 = 6 ; après TETE 3 = 5, TETE 2,5 = 7, TETE 4 = 2 (le résultat bouge beaucoup d'un réglage à l'autre : la dispersion vient des quelques contacts qui restent).
Essais écartés : l'écart minimal à 3,5 m (vainqueur ≠ poleman 2/60), sans écart minimal (9/60 mais 9 chocs sur 60 courses et 9 dans le duel), TETE 4 (1/60).
Le nombre de vainqueurs ≠ poleman ne monte pas : en 5 tours, le poleman à 95 % reste devant dans plus de 90 % des courses ; les dépassements, eux, montent de 85 à 123 avec moins de chocs et moins d'herbe.

ÉTAT À LA REPRISE (non vert, à ne pas fusionner tel quel)
- Dernier commit 598b510 (T=2, écart minimal 3,5 m, enveloppe 0,7 s). GitHub : stands vert (duel 7 chocs), consignes vert ; échecs : courses (rivalité 1 choc contre 0 : g5 avec rival devant, technique s 2439 ; ?ailerons=1 une coupe test g14), moteur (test « passer en accéléré » : une IA reste collée à 9 m derrière la voiture immobilisée, présent aussi à IA_ATTAQUE_TETE 0 sur 8 graines sur 40, test fragile).
- Autres passages : T=3 (e35b4e6) duel 13 et une coupe ; T=3 avant l'enveloppe (4a5aff1) stands 7/4 ; T=2 écart 2,5 m enveloppe 1 s (a0489d8) stands 4/3 et rivalité 1/0.
- Mesures jsc (duel 12 tours, 60 courses, ≈ GitHub) : T=2 écart 3,5 + enveloppe 0,7 = 3 chocs ; T=2 sans = 7 ; T=2,5 = 10-15 ; T=3 = 9-12. 5 tours, poleman à 95 %, 60 courses : main T=1,5 = 6 vainqueurs ≠ pole, 85 dépassements, 5 chocs ; T=2 réglage actuel = 3, 93, 6 ; T=3 écart 2,5 = 5, 123, 3.
- Piste pour la suite : les chocs restants sont des contacts d'une voiture décalée qui croise celle qu'elle double au virage (test, s 1750-1830) ; 3 tests à garde-fou zéro (rivalité, coupes, voiture immobilisée) basculent au moindre changement ; si rien de vert, garder 1,5.
- Si T=1,5 : la sortie propre (IA_ATTAQUE_SORTIE) est à revérifier seule.
