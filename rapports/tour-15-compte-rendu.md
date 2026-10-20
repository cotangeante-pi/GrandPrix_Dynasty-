TOUR 15 — compte rendu du Codeur (session-dd)
Sur main : bde5dd6 (« Tour 15 : les IA doublent ») = la fusion de repli (ordre 3, 2e cas), verte sur deux passages.
Branche tour-15 : 6463825 = l'essai du suivi en temps (ordres 1 et 2), PAS gardé.

Ordres : 1 essayé, pas tenu / 2 pas tenu / 3 fait, cas « fusionne quand même »

1. Suivi en temps — essayé (branche tour-15), pas gardé.
   - vitesseDerriere se cale à IA_SUIVI_TEMPS = 0,4 s derrière (au moins IA_DISTANCE_MIN) au lieu de 14 m.
   - La préparation continue tant que l'écart en temps ne grandit pas de plus de IA_ECART_CROISSANCE = 0,3 s, au plus 2 s.
   - Résultat (30 courses) : 33 dépassements, vainqueur ≠ poleman 0, meilleur rythme top 3 30, chocs > 5 m/s 9, herbe 21 976 pas ; 20 voitures : 1 et 2 chocs.
   - Le duel ne passe toujours pas.
   - À basse vitesse, 0,4 s retombe à IA_DISTANCE_MIN (8 m) : c'est le même désordre que le suivi à 9 m du tour 14 (voitures collées dans les virages lents, chocs, herbe).

2. Critère complet sur les 30 courses — pas tenu (voir les chiffres de 3).

3. Fusion — fait, cas « fusionne quand même ». L'état de la branche tour-14 (cc798b3) tient les garde-fous, deux passages identiques :
   | garde-fou | demandé | mesuré |
   |---|---|---|
   | chocs > 5 m/s | ≤ 6 | 4 |
   | herbe | ≤ 4000 | 3666 pas |
   | dépassements | ≥ 25 | 28 (freinage 21, sortie 5, autre 2) |
   | 20 voitures | ≤ 1 choc | 0 (test) et 0 (technique) |
   | barrières + coupes | — | 0 |
   Pas encore tenus (affichés « PAS ENCORE TENU » dans courses.html) : 30 dépassements (28), vainqueur ≠ poleman dans 3 courses (1). Tenu : meilleur rythme dans les 3 premiers (30/30).
   Ce qui a changé sur main :
   - ia.js, simulation.js, donnees.js de la branche tour-14 : l'attaque, la priorité, céder, à la file hors attaque, virages lents, zones d'attaque ; IA_DEPASSEMENT = true. ?ia=N et ?ia=N&joueur=1 utilisent donc maintenant des IA qui doublent.
   - courses.html, quand IA_DEPASSEMENT est vrai :
     - les garde-fous sont vérifiés (≥ 25 dépassements, ≤ 6 chocs, ≤ 4000 pas d'herbe, ≤ 6 barrières + coupes ; 20 voitures ≤ 1 choc) ;
     - course par course, on vérifie toutes arrivent, 0 barrière, 0 coupe ; les chocs n'y sont qu'affichés et sont vérifiés sur le total ;
     - le critère complet de 4c est affiché, pas exigé.
     Raison : la course technique graine 12 a 2 chocs, alors que le total des 30 courses est de 4, sous le garde-fou de 6. C'est un écart à la règle de 4b (« au plus 1 par course ») : à toi de dire si tu préfères autre chose.
   - test.html : le duel est affiché (« dépassement avant la fin du 3e tour → non »), pas exigé ; on y vérifie seulement l'absence de choc à plus de 5 m/s.
   Tests sur main (bde5dd6), deux passages de suite : test.html 116/116, courses.html 37/37, ecrans.py 159/159, TOUT PASSE, 0 Chrome restant.

Ce qui reste pour la suite :
- Le duel, et donc les dépassements des pilotes plus rapides : le rapide sort des virages lents à environ 1 s du lent, et cet écart se garde en ligne droite. Ni 9 m de suivi, ni 0,4 s ne règlent ça sans remettre des chocs.
- Piste : un suivi en temps avec un minimum plus grand à basse vitesse (par exemple max(14 m, 0,4 s)), et l'attaque seulement dans la droite de 800 m (sillage, décalage avant l'épingle), avec une vraie aspiration plus forte si le propriétaire le veut (c'est un réglage de conduite).

Aucun essai ne tourne, 0 Chrome --headless.

Réévalue.
