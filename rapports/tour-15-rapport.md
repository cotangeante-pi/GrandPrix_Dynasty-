TOUR 15 — étape 4c (le suivi en temps, puis fusion) — rapport du Chef
Commit vérifié : f531198 (code d840007, vérifié par le Chef à 18h52 : test.html 115/115, courses.html 33/33, ecrans.py 159/159, poussé) ; branche tour-14 (cc798b3) lue
Note : 53/100 — conduite 12/20, course et IA 13/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 10/10, Poki 1/5 (la page des courses entre IA, critère de l'étape 4, existe et passe)
Mesures (branche, deux passages) : 28 dépassements, vainqueur ≠ poleman 1, meilleur rythme top 3 30, chocs > 5 m/s 4, herbe 3666 pas, 20 voitures 0 choc. Main : 1 dépassement en 30 courses.

Ce qui marche : la branche est propre (4 chocs sur 30 courses, l'herbe ÷ 11). Il manque surtout des dépassements et des surprises.
Ce qui ne va pas : un suivi à 14 m fait près d'1 s en sortie de virage lent ; l'écart reste dans la droite de 800 m, hors du sillage, et l'attaque n'a jamais lieu. Le diagnostic est accepté, comme les propositions (a), (b), (c).

Horaires : rien de nouveau après 20h40, dernier commit sur main à 20h50 si vert, compte rendu avant 20h55.

ORDRES (sur la branche tour-14) :
1. Distance de suivi en temps : IA_SUIVI_TEMPS ≈ 0,4 s (au moins IA_DISTANCE_MIN en mètres). En sortie de virage, la préparation de l'attaque continue tant que l'écart en temps ne grandit pas. Dans une droite, l'attaquant se met dans le sillage (aspiration) pour revenir.
   Fini quand : le duel passe avant la fin du 3e tour, 0 choc > 5 m/s.
2. Critère sur les 30 courses (deux passages de suite) : ≥ 30 dépassements, vainqueur ≠ poleman ≥ 3, meilleur rythme top 3 ≥ 20, chocs > 5 m/s ≤ 6, herbe ≤ 4000 pas, 20 voitures ≤ 1 choc.
3. FUSION à 20h30 au plus tard, décision du Chef :
   - si 1 et 2 tiennent : IA_DEPASSEMENT = true sur main avec ces critères dans courses.html ;
   - sinon, si la version de la branche tient au moins : chocs > 5 m/s ≤ 6, herbe ≤ 4000 pas, ≥ 25 dépassements, 20 voitures ≤ 1 choc, sur deux passages : fusionne-la quand même sur main avec IA_DEPASSEMENT = true, et ces chiffres comme garde-fou dans courses.html (les critères complets de 4c restent marqués « pas encore tenus » dans la sortie). Raison : le propriétaire joue avec ?joueur=1 ; des IA qui doublent un peu et proprement valent mieux que pas du tout ;
   - sinon, rien sur main.
   Fini quand : `python3 tests/lancer.py` vert sur main, commit « Tour 15 : les IA doublent » avant 20h50.

Compte rendu dans rapports/tour-15-compte-rendu.md avant 20h55, puis « Réévalue. » à session-76. 0 Chrome --headless à la fin.
