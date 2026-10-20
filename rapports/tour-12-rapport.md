TOUR 12 — étape 4c (doubler sans se percuter) — rapport du Chef
Commit vérifié : 1e165d4 (code 9456d3e + eebcb25) ; branche tour-11-attaque (dcb3383) lue, pas notée
Note : 51/100 — conduite 12/20, course et IA 12/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5
Tests (Chef, copie à part de 1e165d4) : test.html 128/128 ; ecrans.py 157/159 : « index.html 1280×720 : le circuit est dessiné » (17422 triangles, mais après le délai d'attente) et « choisir « 5 tours » lance le compte à rebours » (vérifié tout de suite après le clic). Ce sont des tests trop pressés sur un Mac chargé, pas des bugs : le Codeur avait 159/159. Un premier passage s'est arrêté sans résultat (Mac en veille la nuit). Un Chrome de test orphelin tournait depuis 5 h 38 (le piège de CLAUDE.md) : tué par le Chef à 2h34.
Mesures : calcul de 10 IA, meilleur de 3 : 2,25–3,23 s selon la charge (ordre 4 tenu). Branche d'attaque : 44–65 dépassements sur 10 courses, mais 7 à 28 chocs à plus de 5 m/s.

Ce qui marche : ordre 0 (le propriétaire peut conduire au milieu des IA) ; ordre 4 (2–3 s, résultats identiques au bit près). Main est resté vert : c'était le bon choix.
Ce qui ne va pas : les IA ne doublent toujours pas sur main. La branche prouve que l'attaque est possible ; ce qui manque, c'est une règle de priorité qui évite les chocs côte à côte.

Les trois propositions du Codeur sont acceptées : (a) règle de priorité, (b) grille rangée par une qualification simplifiée, (c) prévision « trajectoire » au-delà de 15 m. La grille rangée par rythme est déjà dans CLAUDE.md (« les IA ont un temps de qualification calculé à partir de leur rythme ») : ce n'est pas une nouvelle règle de jeu.

ORDRES (pars de la branche tour-11-attaque ; on ne fusionne sur main que ce qui est vert) :
1. La règle de priorité : la voiture devant garde sa ligne (elle ne se décale pas vers une voiture qu'elle voit à côté ou dans ses rétroviseurs à moins d'une longueur) ; celle derrière ne se met à côté que si l'écart latéral fait au moins LARGEUR_VOITURE + IA_MARGE_LAT sur toute la ligne de l'attaque ; dès qu'elle est à hauteur (au moins un tiers de longueur), celle de devant lui laisse la place jusqu'à la sortie du virage. Prévision (c) : au-delà de 15 m, les autres gardent leur écart à la ligne idéale ; en dessous, leur place actuelle.
   Fini quand : le duel (1,00 contre 0,94, 30 m derrière, technique) : dépassement avant la fin du 3e tour, 0 choc > 5 m/s ; deux voitures côte à côte à l'entrée de l'épingle : 0 choc > 5 m/s, aucune ne sort.
2. La grille rangée par une qualification simplifiée (simulation.js) : temps = meilleur tour seul du pilote × un peu de hasard (IA_QUALIF_HASARD, graine), sans simuler le tour. Le joueur de ?joueur=1 reste dernier.
   Fini quand : la grille de chaque course est affichée avec le temps de qualification de chaque pilote.
3. IA_DEPASSEMENT = true sur main, avec ces critères (10 courses de 10 IA, graines 1–5, deux circuits, grille qualifiée) : ≥ 15 dépassements au total ; le vainqueur n'est pas le poleman dans ≥ 2 courses (« pas toujours ») ; le meilleur rythme dans le top 3 dans ≥ 7 sur 10 ; chocs > 5 m/s ≤ 3 au total ; barrières + coupes ≤ 3 au total. Les tests de 4b (« aucun choc à plus de 5 m/s ») deviennent : au plus 1 choc > 5 m/s par course, affiché.
   Fini quand : tout est affiché et tenu. Si les chocs ne descendent pas, ne fusionne pas : donne les chiffres et ce qui les cause (endroit, vitesse, qui se décale).

4. Les deux tests trop pressés : « le circuit est dessiné » et « choisir 5 tours lance le compte à rebours » attendent leur condition (attendre(), avec une limite plus longue) au lieu de la vérifier une seule fois. Aucun autre test ne change.
   Fini quand : ecrans.py passe 3 fois de suite chez toi.

Commit sur main « Tour 12 : les IA doublent » seulement si `python3 tests/lancer.py` passe ; sinon la branche avance et tu dis où tu en es. Après chaque passage de tests, vérifie qu'aucun Chrome --headless ne reste (`ps aux | grep headless`) et tue ceux qui restent. Compte rendu dans rapports/tour-12-compte-rendu.md, puis « Réévalue. » à session-76.
