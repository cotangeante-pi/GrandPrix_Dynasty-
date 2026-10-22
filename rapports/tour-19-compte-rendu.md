TOUR 19 — compte rendu du Codeur 1 (session-dd)
main = fe19e07 : 0d0f6f2 « Tour 19 : le coût d'une erreur », db244fd « Tour 19 : les niveaux de difficulté », puis fe19e07 (l'affichage des tours par niveau dans test.html). Tous verts (suite complète avant chaque avance de main). CLAUDE.md de l'autre session intouché.

Ordres : 0 fait / 1 fait / 2 PAS tenu (mesuré, 7 essais) / 3 fait

0. Mise à jour — fait. main à 73fdbc9 puis 591a32e (avance rapide), erreurs-cout rebasée dessus ; suite complète verte sur la branche (132/132, 38/38, 240/240).

1. Le coût des erreurs — fait (0d0f6f2).
   - IA_ERREUR_RECUPERATION = 0,5 pendant IA_ERREUR_SUITE = 2,5 s : après une erreur, le pilote se remet en roulant à la moitié de sa vitesse visée. C'est là qu'une erreur coûte : l'erreur seule ne coûtait presque rien (à l'épingle, l'herbe ne ralentit guère et l'arc plus large compense).
   - Seul à l'épingle, une erreur coûte en moyenne +0,89 s (freinage +0,65, blocage +0,26, large +1,75) ; le test du moteur exige une moyenne entre 0,5 et 1,5 s. Avec 3 s de récupération (+1,13 s), l'herbe hors erreurs dépassait le garde-fou (4027) ; 2,5 s la ramène à 2982.
   - Piège trouvé : pilote.tour passe à 1 dès que le pilote franchit la ligne juste après le départ (la grille est derrière la ligne), donc « tour 1 » du pilote = premier tour de course ; mes premières mesures comparaient deux tours propres.
   | garde-fou (30 courses) | demandé | mesuré |
   |---|---|---|
   | dépassements | ≥ 25 | 33 |
   | chocs > 5 m/s | ≤ 6 | 3 |
   | chocs pendant une erreur | 0 | 0 |
   | herbe hors erreurs | ≤ 4000 | 2982 |
   | 20 voitures | ≤ 1 choc | 0 (test) et 0 (technique) |
   | vainqueur ≠ poleman (affiché) | — | 0 |
   | meilleur rythme top 3 (affiché) | — | 30 |

2. Des surprises — PAS tenu. Le poleman gagne 30 courses sur 30. Sept essais sur 30 courses (page de mesure à part, même code que courses.html), tous en normal :
   | essai | dépassements | chocs | herbe hors erreurs | vainqueur ≠ poleman | top 3 |
   |---|---|---|---|---|---|
   | main (référence) | 33 | 3 | 2982 | 0 | 30 |
   | A. erreurs des peu fiables ×3 (bornes [0,1 ; 3]) | 40 | 6 | 4686 | 0 | 30 |
   | B. A + qualification ±2 % (IA_QUALIF_HASARD) | 37 | 12 | 4003 | 0 | 24 |
   | C. erreurs [0,5 ; 4] + qualification ±2 % | 41 | 12 | 5400 | 0 | 24 |
   | D. la fautive se range pendant sa récupération (sans voir derrière) | 33 | 3 | 2982 | 0 | 30 |
   | E. D + rétroviseur arrière (40 m) pour tous + « je ne suis pas une voiture rangée au bord et plus lente » | 64 | 5 | 12 473 | 2 | 30 |
   | E + qualification ±2 % | 83 | 13 | 16 579 | 3 | 23 |
   | F. E resserré (rangée = tout au bord et < 60 % de la vitesse libre) | 63 | 12 | 12 764 | 1 | 30 |
   | G. F avec le rétroviseur à part (vues.derriere, lu seulement par la fautive) | 42 | 7 | 4238 | 0 | 30 |
   Ce que ça dit :
   - Les erreurs, même trois fois plus fréquentes, ne changent pas l'ordre d'arrivée : celui qui part devant n'est jamais repassé. 194 erreurs sur 255 sont évitées dans le trafic (règle « jamais près d'une autre voiture »), et les erreurs du leader (seul devant) coûtent ~1 s, moins que son avance.
   - Le hasard en qualification (±2 %) suffit à sortir le meilleur rythme du top 3 (24, dans la fourchette 18–28), mais le poleman gagne toujours, et les chocs doublent (12) : des voitures plus rapides coincées derrière attaquent plus.
   - D n'a aucun effet parce qu'une IA ne voit pas derrière elle au-delà de 8 m (rétroviseurs = à côté seulement) : la règle « jamais d'erreur avec une voiture derrière à moins de 25 m » ne jouait donc que de côté.
   - Un rétroviseur arrière pour tous (E, F) donne 2 à 3 victoires surprises, mais par le chaos (herbe × 4, chocs jusqu'à 14) : d'autres règles réagissent aux voitures derrière. À part (G), le bénéfice disparaît et la règle « rangée » seule coûte encore (fausses détections à l'entrée des virages, où la trajectoire idéale est au bord et plus lente).
   - Conclusion : vainqueur ≠ poleman passe par le duel (un rapide derrière un lent doit pouvoir le passer), pas par la fréquence des erreurs. Rien de commité pour l'ordre 2 ; main garde les erreurs telles qu'en 1.

3. Les niveaux de difficulté — fait (db244fd, puis fe19e07 pour l'affichage).
   - NIVEAUX dans donnees.js : débutant, normal, expert, légende ; ?niveau=… (normal par défaut, pas d'écran). Un niveau change tous les caractères ensemble en gardant les écarts : rythme ajouté (débutant −0,05 ; jamais au-dessus de 1, sinon le pilote dépasse l'adhérence de la carte, donc expert et légende ne gagnent pas en rythme : ils font 2 à 4 fois moins d'erreurs, attaquent plus tôt et sont plus réguliers), taux d'erreurs multiplié (2 ; 1 ; 0,5 ; 0,25), agressivité ajoutée (−0,3 ; 0 ; +0,2 ; +0,4), régularité multipliée (1,5 ; 1 ; 0,7 ; 0,5). Appliqué dans simulation.js (creerCourseIA, donnerCarte).
   - Test : même ordre des rythmes et des taux d'erreurs à chaque niveau, rythme ≤ 1, agressivité entre 0 et 1, meilleur tour moyen des IA plus lent en débutant qu'en légende. Sur le circuit test : meilleur tour moyen des 10 IA en course de 3 tours : débutant 59,18 s, normal 58,02 s, expert 57,64 s, légende 57,58 s ; seul, au rythme moyen du niveau : débutant 50,75 s, normal / expert / légende 49,43 s ; le propriétaire ≈ 45 s.
   - Donc même en légende, une IA seule reste 4 s derrière le propriétaire : la rendre plus rapide demande de relever la vitesse conseillée de la carte (IA_MARGE_VIRAGE, IA_MARGE_FREIN), c'est un réglage de la carte, pas un niveau.
   - courses.html inchangé en normal (33 dépassements, 3 chocs, herbe 2982).
   - Limite : ?championnat=1 réécrit le caractère de chaque IA avec celui du championnat (appliquerCaracteres, principal.js, Codeur 2), donc le niveau ne s'y applique qu'au rythme ; à brancher dans championnat.js plus tard.

Sortie des tests : suite complète sur main avant ce dernier commit (18h28–18h32, sous le verrou) : test.html 133/133, courses.html 38/38, ecrans.py 240/240, TOUT PASSE, 0 Chrome. Avant la fusion de 0d0f6f2 et db244fd (sur la branche rebasée) : 133/133, 38/38, 240/240.

Ce que je n'ai pas pu vérifier : un deuxième passage complet ; l'effet du niveau en ?championnat=1.

Règles respectées : une partie pendant le travail, la suite complète avant chaque avance de main, sous /tmp/gpd-tests.lock ; pas de git stash ; branche erreurs-cout supprimée après fusion.

Aucun essai ne tourne, 0 Chrome --headless.

Réévalue.
