TOUR 11 — compte rendu du Codeur (session-dd)
Commits sur main : 9456d3e (ordre 0, « Tour 11 : jouer contre les IA »), puis l'ordre 4 (voir le commit qui suit ce compte rendu)
Branche à part, PAS verte : tour-11-attaque (dcb3383) : l'attaque, la place laissée, le comptage des dépassements

Ordres : 0 fait / 1 PAS ATTEINT / 2 codé, pas testé / 3 PAS ATTEINT / 4 fait (avec une réserve sur la charge du Mac)
IA_DEPASSEMENT reste à false sur main, comme prévu dans le rapport.

0. Jouer contre les IA — fait et vérifié par le Chef (9456d3e).

4. Temps de calcul — fait, sans rien changer aux résultats : l'empreinte des résultats de 4 courses (2 graines × 2 circuits) est identique au bit près avant et après.
   D'où vient le coût (10 IA, 5 tours, mesure chronométrée par fonction) :
   - environ 75 % dans les décisions (deciderLigne) : la notation des lignes (55 %) et la ligne rapide (25 %), qui repassait par tous les virages du circuit pour chaque point ;
   - puis la vision (voituresVues, à chaque pas pour chaque voiture) ;
   - puis la physique.
   Les optimisations :
   - la ligne rapide ne regarde que les virages proches de l'horizon (les autres n'ajoutaient rien) ;
   - la vitesse de pointe est calculée une fois par carte (avant : 40 calculs à chaque notation) ;
   - les voitures voisines sont filtrées une fois par décision, et non une fois par ligne ;
   - la vision écarte tout de suite les voitures à plus de 120 m.
   Meilleur de 3 mesures pour 10 IA : 2,31 s au test et 2,25 s au technique (Mac à une charge de 18), puis 3,23 s et 2,57 s plus tard dans la nuit (charge de 6 à 9, mais beaucoup de Chrome ouverts). Le temps dépend surtout de la charge du Mac : tes 15 s ont dû tomber pendant un pic.

1–3. L'attaque — pas atteint. Tout est sur la branche tour-11-attaque.
   Ce qui est codé (branche) :
   - la carte connaît le point de freinage de chaque virage ;
   - la vision donne un repère pour reconnaître une voiture d'un instant à l'autre ;
   - le pilote compte depuis combien de temps une voiture le retient (IA_ATTENTE_ATTAQUE) ;
   - l'attaque a ses étapes : préparer (collé dans le sillage, IA_DISTANCE_ATTAQUE) → se décaler côté intérieur avant le freinage (s'il est à moins de 20 m, ou s'il fond sur elle) → freiner plus tard → à l'entrée du virage, s'il n'est pas à moitié à hauteur, abandonner et attendre IA_ATTAQUE_REPOS ;
   - la voiture attaquée laisse une largeur de voiture à celle qui est à côté d'elle (à hauteur d'au moins un tiers) jusqu'à la sortie du virage ;
   - simulerCourse compte les dépassements (tour, endroit, qui, sur qui), avec une marge de 6 m pour ne pas compter deux voitures côte à côte qui s'échangent.
   Ce que j'ai trouvé en cherchant pourquoi un rapide (1,00) ne passe pas un lent (0,94), mesuré tous les 100 m :
   - Toute la perte (1,3 s au tour) était à l'entrée du S. Le rapide y prévoyait que la voiture de devant garde sa place sur la piste ; or dans un S elle traverse toute la largeur. Sa ligne rapide paraissait donc la heurter, et il choisissait « continuer » à l'extérieur, à 116 km/h au lieu de 180.
   - Correction : prévoir que les autres gardent leur écart à la ligne idéale de la carte. Avec ça, le rapide fait 55,1 s comme seul et double au 2e tour (dernier virage, 3349 m), sans choc.
   - Mais ces mêmes corrections ramènent des chocs dans les courses à 10 : des voitures côte à côte, à 2–3 m l'une de l'autre, avec 20 à 45 km/h d'écart, et l'une se décale sur l'autre. Pour les réduire, j'ai ajouté une méfiance pour les voitures proches (à moins de 15 m, elles peuvent aussi garder leur place). Elle bloque à nouveau le dépassement du duel.
   Chiffres (branche, 10 courses de 10 IA, graines 1–5, deux circuits) :
   | réglage | dépassements | arrivée ≠ grille | meilleur rythme top 3 | chocs > 5 m/s | barrières + coupes |
   |---|---|---|---|---|---|
   | attaque, sans méfiance | 65 | 10/10 | 0/10 | 28 | 0 |
   | attaque, marges plus larges | 64 | 9/10 | 0/10 | 7 | 0 |
   | attaque, rythme 0,90–1,00 | 47 à 64 | 9/10 | 1 à 2/10 | 16 | 0 |
   | attaque, méfiance (dernier état) | 44 | 9/10 | 0/10 | 8 | 0 |
   | sans attaque, méfiance | 3 | 3/10 | 0/10 | 3 | 0 |
   Critère : au moins 15 dépassements, ≠ grille au moins 7/10, top 3 au moins 5/10, chocs au plus 3, barrières + coupes au plus 3. Les dépassements, l'ordre d'arrivée et les barrières sont tenus ; les chocs et le meilleur rythme non.
   Pourquoi le meilleur rythme n'est jamais dans les 3 premiers : la grille suit le numéro, pas le rythme. Le meilleur part souvent 8e à 10e, et en 5 tours il doit passer 6 ou 7 voitures. Les styles (0,1 à 2 s au tour) pèsent aussi lourd que l'écart de rythme (environ 1,8 s au tour pour 0,94–1,00).
   Pourquoi ce n'est pas sur main : sans attaque, il reste 3 chocs à plus de 5 m/s, et les tests de 4b (zéro choc à plus de 5 m/s) échoueraient. main reste donc au comportement du tour 10, avec l'ordre 0 et l'ordre 4.

   Ce que je proposerais pour la suite :
   (a) Une règle de priorité claire au lieu de prévisions : la voiture devant garde sa ligne ; celle derrière n'a le droit de se mettre à côté que si l'écart latéral fait au moins IA_MARGE_LAT de plus qu'une voiture, sur toute la ligne de l'attaque. Sinon, elle reste derrière.
   (b) Pour le critère « meilleur rythme dans le top 3 » : une grille rangée par rythme (des qualifications simplifiées, étape 5), ou un critère sur 12 tours.
   (c) Garder la prévision « les autres suivent la trajectoire » pour les voitures à plus de 15 m : c'est elle qui débloque les rapides dans les enchaînements.

Sortie des tests sur main (ordres 0 + 4) : TOUT PASSE — test.html 128/128 (63 s), ecrans.py 159/159 (275 s). Un premier passage avait eu un faux échec de lenteur sur un Mac très chargé (« le circuit est dessiné » attendu 5 s sous swiftshader, alors que 17 422 triangles étaient dessinés) ; le second est vert.

Réévalue.
