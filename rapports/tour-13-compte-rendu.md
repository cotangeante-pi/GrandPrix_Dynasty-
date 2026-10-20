TOUR 13 — compte rendu du Codeur (session-dd)
Rien de fusionné sur main : ce n'est pas vert. Branche tour-13 (cb6faae), partie de main et reprenant tour-12-attaque.

Ordres : 2 fait (sur la branche) / 1 fait en partie (le duel ne passe plus) / 3 PAS tenu

2. tests/courses.html — fait (branche).
   - Ce que fait la page : 30 courses (graines 1–15 sur chaque circuit, 10 IA, 5 tours ; réglable par ?graines=, ?voitures=, ?tours=), puis la course de 20 voitures de chaque circuit.
   - Pour chaque course, elle affiche :
     - la grille, puis l'arrivée ;
     - les dépassements, rangés par endroit (zone de freinage, sortie de virage, autre) ;
     - le poleman et le vainqueur ;
     - la place du meilleur rythme ;
     - les chocs à plus de 5 m/s, avec leur endroit et leur vitesse (la physique note maintenant où commence chaque contact, v.lieuxChocs) ;
     - les barrières, les coupes, l'herbe et le temps de calcul.
   - Elle écrit un RESULTAT que lancer.py lit (lancer.py lance maintenant test.html, courses.html, puis ecrans.py).
   - Les 10 courses et les 20 voitures de test.html y sont passées (retirées de test.html).
   - Durée : 87 à 92 s chez moi (moins de 3 min).

1. Zones d'attaque, marge des virages rapides, herbe — codé (branche).
   - La carte mesure la ligne droite avant chaque point de freinage (virage.droite) ; une attaque ne passe au décalage que si cette droite fait au moins IA_DROITE_ATTAQUE (150 m).
   - Au-dessus de IA_VITESSE_RAPIDE (180 km/h), l'écart sûr côte à côte est largeur + IA_MARGE_LAT_RAPIDE (2,5 m) au lieu de 1,5 m (ecartSur(u), partout où l'écart sert).
   - Pendant un dépassement (il attaque, ou une voiture est à côté), chaque point de ligne dans l'herbe coûte IA_PENALITE_HERBE (1 s).
   - Les dépassements sont rangés par endroit (endroitSur).
   - En plus : la règle « coincé, il cède ». Si sa ligne rapide empiète de plus de 1 m sur la place à laisser à une voiture à hauteur, il roule 4 m/s moins vite qu'elle tant qu'elle est à côté (IA_CEDER_ECART, IA_CEDER_FORT, IA_CEDER_DUREE_MAX).
   - PROBLÈME : le duel ne passe plus (pas de dépassement en 5 tours). Il passait au tour 12, à la sortie de l'épingle.

3. Critère sur les 30 courses — PAS tenu.
   | | dépassements | vainqueur ≠ poleman | meilleur rythme top 3 | chocs > 5 m/s | barrières + coupes | herbe |
   |---|---|---|---|---|---|---|
   | critère | ≥ 45 | ≥ 4 | ≥ 20 | ≤ 6 | ≤ 6 | affichée |
   | zones d'attaque | 96 (freinage 22, sortie 67, autre 7) | 4 | 29 | 16 | 0 | 44 943 pas |
   | + céder | 88 (freinage 22, sortie 60, autre 6) | 4 | 29 | 11 | 0 | 40 513 pas |
   Course de 20 voitures : 0 choc sur le circuit test, 3 sur le technique.
   Où sont les chocs (premier passage) :
   - circuit test : 1830–1875 m (le deuxième grand virage après la longue droite), 6,6 à 10 m/s ;
   - technique : 1230–1235 m et 1292–1297 m (milieu et sortie du S), 7,4 à 12,9 m/s ; 2455–2459 m (épingle), 7,6 à 9,1 m/s ; 1575, 1664, 1173 m.
   Où est l'herbe : presque toute dans l'épingle du technique (2450–2550 m). Une voiture à l'extérieur d'une autre, à 50 km/h, finit à −9 à −12 m (dans l'herbe), pendant un dépassement. Le circuit test n'a presque pas d'herbe.
   Ce que j'en comprends :
   - La plupart des dépassements ne sont pas des attaques : ce sont des sorties de virage (60–67 sur 88–96). Les voitures se retrouvent à côté parce que l'une sort mieux que l'autre, souvent dans le S et à la sortie de l'épingle. Les zones d'attaque ne limitent que les attaques, pas ces dépassements-là.
   - Dans l'épingle, à deux de front, celle de l'extérieur n'a pas la place. Céder ne l'a pas réglé. Ma piste, pas encore vérifiée : elle est poussée dehors par des frottements doux contre celle de l'intérieur (sous 5 m/s, donc non comptés).
   Ce que je proposerais :
   (a) Une seule façon de dépasser, l'attaque : hors attaque, une voiture qui arrive sur une autre reste à la file (en ligne derrière elle), même si elle sort mieux du virage. Les dépassements « en sortie » qui causent les chocs disparaîtraient ; il resterait les 22 au freinage (sur 30 courses, il en faudrait au moins 45 : il faudrait donc des attaques plus fréquentes).
   (b) Dans un virage lent (épingle), interdire d'être à deux de front : l'attaque doit être devant à l'entrée, sinon elle abandonne plus tôt.
   (c) Revoir pourquoi le duel ne passe plus : les zones l'autorisent à l'épingle ; la marge rapide (4,5 m entre centres) ou la pénalité d'herbe empêchent peut-être le décalage.

Sortie des tests : main est inchangé depuis 0d978f6 (vert au tour 12). Sur la branche, courses.html : RESULTAT 7/9 (les deux échecs : chocs sur 30 courses, chocs dans la course de 20 voitures du technique). Je n'ai pas lancé lancer.py en entier sur la branche, puisque ce n'est pas vert. 0 Chrome --headless restant après chaque passage.

Réévalue.
