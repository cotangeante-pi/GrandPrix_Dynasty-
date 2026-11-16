# Tour 57, tâche 1 : la course en ligne complète (Codeur 4)

Branche `enligne-complet` (partie de `enligne-course`, avec `enligne-tout` fusionnée).

## Cause de « l'invité ne revient pas dans la salle »
Ce n'était pas le jeu, c'était le test : `tests/enligne-course.py ecrans` attendait `window.ENLIGNE_ECRAN`, or `ENLIGNE_ECRAN` est une `const` de page (pas une propriété de `window`) : la condition ne devenait jamais vraie, alors que l'invité était bien revenu dans la salle (même place, circuit « technique », 2 joueurs). Le test utilise maintenant `attendre()` (boucle d'`evaluate`, tolère le rechargement de la page).

## Autres corrections du test
- `EN_LIGNE_ATTENTE_MAX_MS = 0` dans les pages du test : il fait avancer une page puis l'autre à la main, sans cela l'hôte abandonnait l'invité « connexion trop lente » (T8, 15 s) et la page repartait au titre (« JEU is not defined »).
- Le test tactile utilisait « Pilote 1/2 » (refusés par D1) : `bleu` / `rouge`.
- Diagnostic en cas de page quittée (URL, état gardé avant le rechargement).

## Résultats
- Mac : `ecrans` 16/16 (salle, rechargement de l'invité, course, podium, retour, 2e course).
- GitHub (0d5916a) : `enligne-course.py court` (0 IA, tactile, scénario complet des écrans) OK en 99 s, donc dans les annexes.
- Le passage `annexes` reste rouge pour deux causes hors de cette tâche : `enligne-incidents.py` (6 incidents en Timeout, tâche 2) et `tests/reseau.html` (corrigé depuis par Codeur 1, 23c0324).

## Reste
- La course à 2 IA (`enligne-course.py ia`) : jamais lancée jusqu'au bout sur le Mac (verrou occupé) ; non mesurée sur GitHub (pas dans `court`).
