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

ÉTAT À 18h30 (Codeur Sonnet, non vert)
- Dernier commit 598b510 (T=2, écart minimal 3,5 m, enveloppe 0,7 s). GitHub : stands vert (duel 7 chocs), consignes vert ; échecs : courses (rivalité 1 choc contre 0 : g5 avec rival devant, technique s 2439 ; ?ailerons=1 une coupe test g14), moteur (test « passer en accéléré » : une IA reste collée à 9 m derrière la voiture immobilisée, présent aussi à IA_ATTAQUE_TETE 0 sur 8 graines sur 40).
- Autres passages : T=3 (e35b4e6) duel 13 et une coupe ; T=3 avant l'enveloppe (4a5aff1) stands 7/4 ; T=2 écart 2,5 m enveloppe 1 s (a0489d8) stands 4/3 et rivalité 1/0.
- Mesures jsc (duel 12 tours, 60 courses) : T=2 écart 3,5 + enveloppe 0,7 = 3 chocs ; T=2 sans = 7 ; T=2,5 = 10-15 ; T=3 = 9-12. 5 tours, poleman à 95 %, 60 courses : main T=1,5 = 6 vainqueurs ≠ pole, 85 dépassements, 5 chocs ; T=2 réglage actuel = 3, 93, 6 ; T=3 écart 2,5 = 5, 123, 3.

REPRISE (Codeur 1 sur Fable, 18h36-20h50) : les causes plutôt que les graines
- origin/main fusionné dans la branche (2c1fed6 : techniques 51f, voix 51c, 51g, 51i). Son passage GitHub : courses rouge (rivalité « rival devant » : 3 chocs contre 0, le joueur passe le rival 1 fois contre 0), les 30 courses et ?ailerons=1 verts (0 choc, 0 coupe : la coupe g14 ne revient pas après la fusion).
- Attention : JavaScriptCore ne donne pas les mêmes courses que Chrome (la voiture immobilisée tombe à la graine 5 sur GitHub, pas en jsc ; en rivalité « rival devant », le rival attaque le joueur 54 fois sur GitHub, 0 en jsc). jsc sert à voir le mécanisme, Chrome (ou GitHub) à mesurer. Outils dans le scratchpad c1f/ : bloquee.js, rivalite.js, courses4b.js, duel.js, trace.js, chrome.py (le même scénario dans Chrome, sous le verrou).
1. Le suiveur collé derrière la voiture immobilisée (f8f24e6). Mécanisme (trace.js) : en préparant une attaque sur la voiture qui s'arrête, il vient se coller à IA_DISTANCE_MIN (8 m) ; une fois qu'elle est « arrêtée » (1 s), toute ligne « éviter » la touche encore (noterLigne : offset < IA_LENTE_CONTACT à 4 m du départ de la rampe), la pénalité est la même que pour sa ligne rapide, la plus rapide gagne, et au pas il est retenu (IA_LENTE_SUR) : il reste là, et relance toutes les 3 s une attaque « échappée » (g 8 > 1 s × 8 m/s). Correction, sous IA_ATTAQUE_LENTE (1) et IA_LENTE_RECUL (14 m) / IA_LENTE_RECUL_SOUS (10 m) : il n'attaque pas une voiture lente ou arrêtée (il la contourne) ; arrêté à moins de 10 m d'elle, il recule (le frein à l'arrêt = la marche arrière, physique.js) jusqu'à 14 m si personne n'est derrière lui ; au pas (sous IA_LENTE_VITESSE_FROLE), la ligne « éviter » prend son écart au plus tard là où les nez se croisent et peut la frôler à IA_LENTE_SUR (comme la retenue de piloterIA). jsc : 7/40 → 0/40 graines (les 8 graines qui tombaient passent en 20,0 s). Rien ne change hors du pas et d'une voiture arrêtée.
2. Le rival du joueur se rabattait sur un joueur déjà à côté de lui (8b7865a). defendreContreJoueur décalait sa ligne vers l'intérieur dès que le joueur était à moins de 20 m derrière, même décalé à l'écart sûr pour attaquer (avec IA_ATTAQUE_TETE il se décale tôt) : chocs au freinage du virage lent du technique (s 2439). Même garde que defendreBataille (tour 50a), sous IA_ATTAQUE_TETE. jsc : herbe en « rival devant » 366 → 0 pas, défenses 30 → 28.
- Repli de 19h45 (TETE 1,5) non pris : un seul passage GitHub à la fois sur la branche (un push annule le précédent), la file GitHub était lente (8b7865a en attente de 19h16 à 19h40), et les deux corrections valent pour toute valeur de TETE ; si le passage est rouge, main reste à 1,5 et rien n'est à fusionner.
3. L'attaquant en « sortie » cède franchement (pilote.cede : IA_CEDER_FORT, 4 m/s sous elle, au lieu d'IA_CEDER 1 m/s). Mesure Chrome locale de 8b7865a (= GitHub au nombre près : 3 chocs, herbe 319, 23/74/37) : deux des trois chocs de la rivalité « rival devant » ne mettent pas en jeu le rival ni le joueur : des attaques abandonnées au point de freinage du virage lent du technique (« sortie (virage lent) g 5,3 », à 5 m derrière avec 7 m/s de plus), chocs à 7,4 et 13,6 m/s à s 2328-2403. Lever le pied d'1 m/s ne suffisait pas. Pas mesuré dans Chrome avant le push (verrou pris, un passage Chrome tué) : c'est le passage GitHub du commit qui tranche.

PASSAGES GITHUB DE LA REPRISE
| commit | TETE | résultat | rouge |
| 2c1fed6 (fusion de main) | 2 | annulé par le push suivant | courses : rivalité 3 chocs / 0, défense (le joueur passe 1 / 0) ; les 30 courses et ?ailerons=1 verts (la coupe g14 ne revient pas) |
| f8f24e6 (recul, pas d'attaque sur une lente) | 2 | annulé par le push suivant | — |
| 8b7865a (+ garde du rival) | 2 | 16/18 | courses : rivalité 3 chocs / 0 (la défense est verte) ; ecrans-1 : page manette 1280×720, « Start ouvre la pause » (JEU.ecran reste « course »), à confirmer (vert au même moment sur chef-integration 4d0b04b ; mesure locale lancée) |
| dernier commit (+ cession franche en sortie, doc) | 2 | en cours à 20h15 | — |

ÉTAT À LA REPRISE
- Si le dernier passage est vert : fusionner (TETE 2). Sinon : main reste à 1,5 ; les corrections 1 (IA_LENTE_RECUL, IA_ATTAQUE_LENTE) et 2 (garde du rival) valent pour toute valeur de TETE et peuvent être reprises seules (moteur, stands, consignes, meteo, officiels verts à 8b7865a).
- Duel des stands : vert à 598b510 (7 chocs) et à 8b7865a. Chocs restants du duel : des contacts d'une voiture décalée qui croise celle qu'elle double au virage (test, s 1750-1830).
- JavaScriptCore ne reproduit pas les courses de Chrome : mesurer dans Chrome (c1f/chrome.py, sous le verrou) ou sur GitHub.
