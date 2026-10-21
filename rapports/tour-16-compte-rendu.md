TOUR 16 — compte rendu du Codeur (session-dd)
Commit sur main : 3a33150 (« Tour 16 : le caractère et la régularité des pilotes »), vert.
Branche tour-16 : a9a378a = les erreurs et l'agressivité (ordres 3 et 4), PAS vert, pas sur main.

Ordres : 1 fait / 2 fait, mais son test n'est pas tenu (affiché) / 3 fait sur la branche, pas vert / 4 fait sur la branche, pas mesurable seul / critère final : pas tenu

1. Caractère chiffré — fait (main).
   - tirerCaractere (ia.js) : régularité, agressivité, taux d'erreurs, tirés avec la graine de la course + GRAINE_CARACTERE (3000), entre les bornes de IA_CARACTERE (donnees.js) : régularité [0,002 ; 0,015], agressivité [0 ; 1], erreurs [0,1 ; 1] par course de 5 tours. Le rythme reste IA_RYTHME. Pas de noms.
   - courses.html affiche le caractère de chaque voiture, course par course (« n°3 r0.972 rég ±0.8% agr 0.41 err 0.66 »).
   - test.html : même graine = même caractère, et tous les caractères sont entre les bornes.

2. Régularité — faite (main), mais le « fini quand » n'est PAS tenu.
   - À chaque tour, le pilote perd entre 0 et 2 × sa régularité de rythme, soit ± sa régularité autour de sa moyenne. Il ne va jamais au-delà de son rythme : au-dessus, il dépasserait la limite d'adhérence de la carte.
   - Cette variation ne joue que sur les vitesses visées. Le freinage garde le rythme moyen : appliquée aussi au freinage, elle donnait 9 chocs au lieu de 6 sur les 30 courses, tous au freinage (celui qui suit est surpris).
   - Test (affiché, pas exigé) : seuls sur le technique, 7 tours, écart-type 0,274 s pour le régulier contre 0,102 s pour l'irrégulier. Il faudrait l'inverse, 3 ×.
   - Pourquoi, mesuré avec un pilote seul et un facteur fixe :
     | facteur | temps au tour |
     |---|---|
     | 1 | 55,10 s |
     | 0,985 | 55,42 s |
     | 0,97 | 55,65 s |
     Perdre 3 % de rythme ne coûte donc que 0,55 s. En revanche, un petit changement de rythme fait parfois basculer le pilote seul vers une autre ligne, et ce basculement coûte jusqu'à 0,7 s : le régulier fait 55,14 s puis 55,85 s. Ce bruit des lignes est plus fort que l'effet de la régularité.
   - Piste pour le tenir : quand il est seul, garder sa ligne d'un tour à l'autre. J'ai déjà essayé « seul → ligne rapide seulement » : le test passait (0,021 contre 0,139 s), mais le test des styles tombait, et il fallait élargir les styles.
   - Trouvé en cours de route : un tirage de style en plus (IA_STYLE_COTE) décalait toute la suite du hasard des styles, ce qui faisait passer les chocs de 4 à 14–33. Je l'ai retiré : avec la régularité à 0, on retrouve exactement les chiffres du tour 15.

3. Erreurs — faites sur la branche tour-16, pas vertes.
   - tirerErreurs : pour chaque tour, une erreur avec la probabilité taux / 5, à un virage et d'un type tirés au hasard.
   - majErreur : l'erreur se déclenche au point de freinage (freinage trop tard, roues bloquées) ou 25 m avant le sommet (sortie large). Pendant 1 à 1,2 s, il donne seulement de mauvaises commandes : il vise 15 % trop vite, il ne freine qu'à 45 %, ou il ne braque qu'à 60 %. Pas d'erreur avec une voiture à moins de 25 m à côté ou derrière : l'erreur est alors « évitée ».
   - courses.html compte, course par course : les erreurs par type, celles évitées, l'herbe pendant une erreur (et les 3 s d'après), et les chocs forts pendant une erreur. Nouveau test : « aucun choc à plus de 5 m/s causé par une erreur ».
   - Mesure sur 30 courses (branche a9a378a) :
     | mesure | valeur |
     |---|---|
     | erreurs | 149 (freinage 46, blocage 30, large 73), évitées 2 |
     | dépassements | 37 |
     | chocs > 5 m/s | 6 |
     | herbe hors erreurs | 3491 pas |
     | herbe pendant les erreurs | 295 pas |
     | barrières + coupes | 0 |
     ✘ 1 choc fort pendant une erreur. ✘ Course de 20 voitures (technique) : 3 chocs.
   - Autres essais, aucun meilleur :
     | essai | chocs pendant une erreur | 20 voitures |
     |---|---|---|
     | erreurs plus fortes (25 % / 35 % / 50 %) | 3 | 1 choc |
     | 60 m derrière | 3 (rien ne change) | 1 choc |
     | 40 m devant et derrière | 1 | 5 chocs |
     | 50 m devant et derrière | 1 | 6 chocs |
   - Les erreurs ne changent pas les résultats : le meilleur rythme finit dans les 3 premiers dans les 30 courses, même avec les erreurs fortes. Une erreur ne coûte qu'une fraction de seconde, alors que l'écart entre les rythmes (0,94 à 1) fait plusieurs secondes sur 5 tours.

4. Agressivité — faite sur la branche tour-16, avec les erreurs. Les règles de sécurité du tour 14 ne changent pas. Selon son agressivité (0 à 1, 0,5 sans caractère), le pilote :
   - attaque après moins de temps retenu (IA_ATTENTE_ATTAQUE × (1,5 − agressivité)) ;
   - se sent retenu avec moins d'avance de vitesse (IA_RETENUE_ECART × (1,5 − agressivité)) ;
   - se contente d'une droite plus courte, jusqu'à 40 % de moins que IA_DROITE_ATTAQUE.
   Je n'ai pas mesuré son effet à part : les dépassements passent de 29 à 37 avec les erreurs et l'agressivité ensemble.

Critère final (30 courses) — pas tenu :
| critère | demandé | main 3a33150 | branche a9a378a |
|---|---|---|---|
| vainqueur ≠ poleman | ≥ 4 | 0 | 0 |
| meilleur rythme top 3 | 18 à 28 | 30 | 30 |
| dépassements | ≥ 30 | 29 | 37 |
| chocs > 5 m/s | ≤ 6 | 6 | 6 |
| barrières + coupes | ≤ 6 | 0 | 0 |
| herbe | ≤ 4000 | 3957 | 3491 hors erreurs |
| 20 voitures | ≤ 1 choc | 0 et 1 | 0 et 3 ✘ |
Le point dur, c'est que le plus rapide gagne presque toujours et part en tête : la qualification range la grille par rythme, et rien ne coûte assez cher pour défaire cet ordre.

Sortie des tests sur main (3a33150), lancer.py :
- test.html 117/117 (régularité affichée : non, 0,274 / 0,102) ;
- courses.html 37/37 ;
- ecrans.py 159/159 ;
- TOUT PASSE, 0 Chrome restant (20h04).
- Les deux passages d'avant avaient échoué sur un seul test, « console vide », à cause d'un avertissement du pilote graphique, « GPU stall due to ReadPixels » : le Mac était chargé (charge 6,7, Chrome du propriétaire ouvert). ecrans.py seul est passé juste après.

Ce que je n'ai pas pu vérifier :
- un deuxième passage complet de lancer.py sur 3a33150 (le temps) ;
- l'effet de l'agressivité seule ;
- d'où vient le choc fort pendant une erreur (qui percute qui).

Pistes pour la suite :
1. Régularité : garder la ligne quand il est seul (voir 2).
2. Erreurs : qu'elles coûtent du temps (plus longues, ou un vrai tout droit) sans se produire près des autres. Regarder le choc pendant une erreur (sans doute dans les 3 s d'après, quand les autres rattrapent).
3. Vainqueur ≠ poleman : c'est un réglage de jeu, à décider avec le propriétaire. Par exemple, plus de hasard en qualification, des rythmes plus serrés, ou des erreurs qui coûtent cher.

Aucun essai ne tourne, 0 Chrome --headless.

Réévalue.
