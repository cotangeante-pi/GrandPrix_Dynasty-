TOUR 13 — étape 4c (doubler proprement) — rapport du Chef
Commit vérifié : 0d978f6 (code 2c13e30) ; branche tour-12-attaque (5b85713) lue, pas notée
Note : 52/100 — conduite 12/20, course et IA 13/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5
Tests : relancés par le Chef sur une copie à part de 0d978f6 → TOUT PASSE (test.html 129/129 en 47 s, ecrans.py vert), 0 Chrome --headless restant.
Mesures : grilles qualifiées affichées (écarts 2,5–3,5 s du 1er au 10e, cohérents avec les rythmes) ; sur main, 0 choc à plus de 5 m/s dans les 10 courses à 10. Branche : duel gagné au 2e tour sans choc ; 10 courses : 23–43 dépassements, vainqueur ≠ poleman 2/10, meilleur rythme top 3 10/10, mais 2 à 4 chocs à plus de 5 m/s selon le passage.

Ce qui marche : grille qualifiée, tests moins pressés (3 fois 159/159 chez le Codeur), et la branche est tout près du but : les dépassements existent et le meilleur rythme finit devant.
Ce qui ne va pas :
- Les chocs restants sont tous au même genre d'endroit : en biais, presque à hauteur, dans un enchaînement (sortie de chicane, courbe rapide, sortie du S). Ce n'est pas le hasard : c'est l'endroit qui est mauvais pour attaquer.
- Les résultats changent d'un passage à l'autre : on règle sur du bruit avec 10 courses.
- Beaucoup d'herbe sur le technique pendant les dépassements.
- Le critère de l'étape 4 parle d'une page de 50 courses : elle n'existe pas encore.

Les propositions du Codeur sont acceptées.

ORDRES (sur la branche tour-12-attaque ; on ne fusionne sur main que du vert) :
1. Des zones d'attaque : une IA ne lance une attaque que dans une zone de freinage après une droite d'au moins IA_DROITE_ATTAQUE m (≈ 150, lue sur la carte), jamais dans un enchaînement. Dans les virages rapides, la marge latérale pour rester à côté est plus grande (IA_MARGE_LAT_RAPIDE). Elle sort de l'herbe : une ligne qui passe dans l'herbe est fortement pénalisée pendant un dépassement.
   Fini quand : le duel passe toujours (avant la fin du 3e tour, 0 choc) ; dépassements comptés par endroit (zone de freinage, sortie de virage, autre).
2. La page des courses entre IA (le critère de l'étape 4) : tests/courses.html simule N courses (30 par défaut : graines 1–15 sur chaque circuit, 10 IA, 5 tours) et affiche un résumé : dépassements, vainqueur ≠ poleman, meilleur rythme top 3, chocs > 5 m/s (endroit, vitesse), barrières, coupes, herbe, temps de calcul. lancer.py la lance avec les autres. Les 10 courses de test.html peuvent y passer pour ne pas compter deux fois.
   Fini quand : la page tourne en moins de 3 minutes chez toi et lancer.py lit son RESULTAT.
3. IA_DEPASSEMENT = true sur main, avec ces critères sur les 30 courses : ≥ 45 dépassements au total ; vainqueur ≠ poleman dans ≥ 4 ; meilleur rythme top 3 dans ≥ 20 ; chocs > 5 m/s ≤ 6 au total ; barrières + coupes ≤ 6 au total ; herbe affichée par course. La course de 20 voitures : au plus 1 choc > 5 m/s.
   Fini quand : tenu sur deux passages de suite ; sinon, ne fusionne pas et donne les chiffres et les endroits.

Commit « Tour 13 : les IA doublent proprement » sur main seulement si `python3 tests/lancer.py` passe. Après chaque passage, tue les Chrome --headless qui restent. Compte rendu dans rapports/tour-13-compte-rendu.md, puis « Réévalue. » à session-76.
