TOUR 55 — compte rendu du Codeur (Codeur 3, tâche T3 : téléphone lent, branche telephone-lent)
Commit : voir la branche telephone-lent
Ordres : 1 fait (téléphones simulés 4x, 6x, 8x dans tests/test.html : descente rapide, stable 120 s) / 2 fait (trouvé et corrigé : les images de plus de 0,25 s ne comptaient jamais, un appareil à moins de 4 images/s ne se simplifiait pas ; QUALITE_LONGUES_SUITE = 4, 0 = comme avant) / 3 fait (tests/telephone-lent.py, vraie page + CDP setCPUThrottlingRate ; mesures notées dans CLAUDE.md)
Sortie des tests : les 2 nouveaux tests passent sur le Mac (mini-page ciblée) ; GitHub : voir le compte rendu au Chef
Mesures : 4x : niveau 14/18 en 7,7 s, 59 images/s ; 6x : niveau 18/18 en 9,8 s, 58,6 ; 8x : niveau 18/18, 46 images/s (au plus simple, trop lent) ; stable 120 s partout
Ce que je n'ai pas pu vérifier : un vrai téléphone. Sur le Mac, swiftshader dessine en logiciel (1,7 image/s, 10 voitures, 844x390 x2) : le calcul sur le fil principal ne baisse pas avec les niveaux, le ralentissement du processeur ne touche pas le dessin. Les modèles de coût sont donc inventés (9 ms au plus beau, 0,35 ms par pas).
Réévalue.
