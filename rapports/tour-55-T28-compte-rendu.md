# Tour 55, T28 : l'équilibre de la qualification après T15 (Codeur 4, branche qualif-equilibre)

Question (T27) : le joueur prend-il « beaucoup plus souvent » la pole depuis T15 ? Mesure : tests/qualif-equilibre.html (outil, 14 circuits, 4 niveaux d'IA, le robot d'essai × une lenteur de 0,9 à 1,5 comme « joueur ») ; place moyenne sur la grille de 20, avant T15 → maintenant (T15 + l'échelle par circuit du T23, sur main) :

debutant : ×0.9 16.0→1.0 | ×0.95 19.8→3.7 | ×1 20.0→14.3 | ×1.05 20.0→19.7 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0
normal : ×0.9 19.8→4.0 | ×0.95 20.0→15.1 | ×1 20.0→20.0 | ×1.05 20.0→20.0 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0
expert : ×0.9 20.0→14.4 | ×0.95 20.0→19.2 | ×1 20.0→20.0 | ×1.05 20.0→20.0 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0
legende : ×0.9 20.0→19.8 | ×0.95 20.0→20.0 | ×1 20.0→20.0 | ×1.05 20.0→20.0 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0

Rapport tour du robot / meilleure IA (14 circuits) : avant 1,10–1,35 ; maintenant 1,00–1,30 (débutant 1,00–1,11, normal 1,06–1,17, expert 1,06–1,21, légende 1,13–1,30).

Conclusion : rien à régler. Un joueur qui n'est pas plus rapide que le robot (×1,1 à ×1,5 : le joueur moyen ou débutant) reste dernier à tous les niveaux avant comme maintenant (au niveau normal, le robot lui-même est dernier). Seul un joueur plus rapide que le robot de 5 % (débutant) ou 10 % (normal) peut maintenant se qualifier devant des IA : avant, il lui aurait fallu 10 à 35 % de mieux (temps impossibles). `qualifEchelle` et la table du T23 ne sont pas touchés. L'outil reste pour refaire le tableau. (Mesuré une première fois avec T15 seul : mêmes conclusions, places à ±2.)
