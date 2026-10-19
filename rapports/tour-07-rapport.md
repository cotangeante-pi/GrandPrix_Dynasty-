TOUR 7 — étape 4a (une IA fait le tour seule) — rapport du Chef
Chef : session-76. Codeur : session-dd.
Commit vérifié : 039457d (code e59f5a2)
Note : 44/100 — conduite 12/20, course et IA 5/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5 (rien n'a changé depuis le tour 6)
Tests : relancés par le Chef le 2026-10-19 → TOUT PASSE (ecrans.py 136 s ; Mac chargé, charge ~11).
Mesures : robot naïf 62,05 s par tour lancé sur CIRCUIT_TEST ; le propriétaire ≈ 45 s.

Ce qui marche : étapes 1, 2 et 3 acceptées par le propriétaire. La physique est en calcul pur, le robot prouve qu'on peut piloter avec { gaz, frein, direction }.

Ce qui manque (du plus grave au moins grave) :
- Aucune IA : le robot suit le milieu de la piste à 85 % de la vitesse limite, 17 s plus lent que le propriétaire.
- Un seul circuit, presque que des lignes droites : impossible de juger une IA sur de vrais virages (retour du propriétaire du 2026-10-18).

RÈGLES DE L'ÉTAPE 4 (à respecter dans tous les tours) :
- L'IA conduit avec EXACTEMENT la même physique : elle donne { gaz, frein, direction } via appliquerCommandes, rien d'autre. Elle ne touche jamais à x, z, u, v, r, cap.
- Elle ne voit que la piste (la courbe) et sa propre voiture. Aucun bonus caché.
- Tous les chiffres de l'IA dans donnees.js (IA_…). robot.js reste tel quel (les anciens tests l'utilisent).
- Pas de push : c'est le Chef qui pousse.

ORDRES :
1. Un 2e circuit d'essai, technique : CIRCUITS.technique dans donnees.js, décrit par morceaux, 3 à 4,5 km, largeur 13, avec au moins : une épingle (rayon 15–20 m, ~180°), un enchaînement en S (2–3 virages rayon 40–70 m, sens alternés), une courbe rapide (rayon 200–300 m, 60–100°), une longue droite (≥ 700 m) suivie d'un freinage fort dans un virage serré. `?circuit=technique` le charge (par défaut : test).
   Fini quand : un test vérifie fermeture < 1 m, aucun croisement (deux points de la piste éloignés de plus de 100 m le long du tour sont à plus de largeur + 2 × DISTANCE_BARRIERE l'un de l'autre), et la présence d'un rayon < 25 m ; une capture vue de dessus (tests/captures/technique.png).
2. ia.js : la trajectoire idéale et la vitesse conseillée, tirées de la courbe, une fois par circuit (calcul pur) :
   - trajectoire : un écart latéral par échantillon, dans ±(largeur/2 − IA_MARGE_BORD), lissé pour réduire la courbure (extérieur–corde–extérieur) ;
   - vitesse : vitesseVirage(courbure de la trajectoire) × IA_MARGE_VIRAGE, puis une passe arrière (freinage atteignable) et une passe avant (accélération atteignable), tirées des chiffres de la physique.
   Fini quand : des tests vérifient que la trajectoire reste dans la piste, que sa courbure max est nettement plus petite que celle du milieu (au moins 20 % de moins sur les deux circuits), et que la vitesse conseillée ne descend jamais plus vite que le freinage possible.
3. piloteIA(v, circuit, trajectoire) : suit la trajectoire (visée devant soi) et la vitesse conseillée, en sortant des commandes { gaz, frein, direction }.
   Fini quand : dans test.html, sans affichage, graine fixe, 5 tours sur chaque circuit : 0 contact de barrière, 0 virage coupé, 0 passage dans l'herbe ; tour lancé sur CIRCUIT_TEST ≤ 50 s (cible : approcher les 45 s du propriétaire) ; le technique fait ses 5 tours. Les temps des deux circuits sont AFFICHÉS dans la sortie des tests (je les relève).
4. `?ia=1` : la voiture du joueur est conduite par l'IA dans la vraie page (comme ?robot=1), pour que le propriétaire la regarde ; marche avec ?circuit=technique.
   Fini quand : un test ecrans.py lance index.html?course=5&ia=1&circuit=technique, la course avance sans erreur dans la console, et la capture tests/captures/ia.png est prise.
5. CLAUDE.md : ajouter ia.js et ?circuit= / ?ia=1 dans la liste des fichiers.
   Fini quand : c'est écrit.

Commit « Tour 7 : une IA fait le tour seule » seulement si `python3 tests/lancer.py` passe ; sinon, dis ce qui ne passe pas. Puis compte rendu dans rapports/tour-07-compte-rendu.md (commit à part) et « Réévalue. » par SendMessage à session-76.

Questions pour le propriétaire (le Codeur n'y répond pas) : aucune pour l'instant ; il regardera ?ia=1 à la fin de l'étape 4a.
