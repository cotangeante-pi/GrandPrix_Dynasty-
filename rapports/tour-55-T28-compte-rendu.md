# Tour 55, T28 : l'équilibre de la qualification après T15 (Codeur 4, branche qualif-equilibre)

Question (T27) : le joueur prend-il « beaucoup plus souvent » la pole depuis T15 ? Mesure : tests/qualif-equilibre.html (outil, 14 circuits, 4 niveaux d'IA, le robot d'essai × une lenteur de 0,9 à 1,5 comme « joueur ») ; place moyenne sur la grille de 20, avant → après T15 :

debutant : ×0.9 16.0→1.4 | ×0.95 19.8→7.0 | ×1 20.0→12.6 | ×1.05 20.0→18.6 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0
normal : ×0.9 19.8→6.6 | ×0.95 20.0→12.5 | ×1 20.0→19.0 | ×1.05 20.0→20.0 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0
expert : ×0.9 20.0→12.6 | ×0.95 20.0→19.4 | ×1 20.0→20.0 | ×1.05 20.0→20.0 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0
legende : ×0.9 20.0→19.6 | ×0.95 20.0→20.0 | ×1 20.0→20.0 | ×1.05 20.0→20.0 | ×1.1 20.0→20.0 | ×1.25 20.0→20.0 | ×1.5 20.0→20.0

Rapport robot / meilleure IA (14 circuits) : avant 1,13 à 1,31 ; après 0,96 à 1,30 (débutant 0,96–1,11, normal 1,01–1,17, expert 1,07–1,23, légende 1,12–1,30).

Conclusion : rien à régler. Un joueur qui n'est pas plus rapide que le robot (×1,1 à ×1,5 : le joueur moyen ou débutant) reste dernier à tous les niveaux avant comme après. Seul un joueur plus rapide que le robot de 5 % (débutant) ou 10 % (normal) peut maintenant se qualifier devant des IA : avant, il lui aurait fallu 22 à 30 % de mieux (temps impossibles). `qualifEchelle` n'est pas touché. L'outil reste pour refaire le tableau.
