TOUR 19 (Codeur 1, session-dd) et 19b (Codeur 2, session-9e) — reprise du 2026-10-22, 17h15 — rapport du Chef
Base : origin/main 056cbaf (3962493 vérifié : 132/132, 38/38, 240/240). Note : 60/100.
Horaires : jusqu'à 21h (rien de nouveau après 20h40, dernier commit à 20h50 si vert, compte rendu avant 20h55, 0 Chrome à 21h). Mac éveillé jusqu'à 21h10. Mêmes règles : verrou /tmp/gpd-tests.lock, tests par partie pendant le travail, suite complète avant chaque commit, pas de git stash, ne pas toucher aux changements de CLAUDE.md de l'autre session.

=== CODEUR 1 (session-dd), dossier « Grand Prix Dynasty », branche main ===
0. Mise à jour : `git merge --ff-only origin/main`. Puis rebase de erreurs-cout (3e11e37) sur main, suite complète.
1. Le coût des erreurs (erreurs-cout) : fusion sur main si la suite complète est verte et les garde-fous des 30 courses tiennent (chocs > 5 m/s ≤ 6, 20 voitures ≤ 1, herbe hors erreurs ≤ 4000, ≥ 25 dépassements). Afficher et noter : vainqueur ≠ poleman, meilleur rythme top 3.
   Fini quand : commit sur main ou, si un garde-fou casse, chiffres + cause.
2. Des surprises (critère de l'étape 4) : si après 1 le poleman gagne encore plus de 26 courses sur 30, augmenter la fréquence des erreurs des pilotes peu fiables (bornes IA_CARACTERE), sans toucher à la physique (l'herbe attend la décision du propriétaire).
   Fini quand : vainqueur ≠ poleman ≥ 4, meilleur rythme top 3 entre 18 et 28, garde-fous tenus, deux passages.
3. Les niveaux de difficulté (CLAUDE.md, 4d) : débutant, normal, expert, légende. Un niveau change tous les caractères ensemble (rythme, erreurs, agressivité) mais garde les écarts entre pilotes. Chiffres dans donnees.js (NIVEAUX). `?niveau=debutant|normal|expert|legende` (normal par défaut). Pas d'écran de choix pour l'instant.
   Fini quand : test : à chaque niveau, l'ordre des rythmes des pilotes est le même ; le tour moyen d'une IA est plus lent en débutant qu'en légende (affiché pour les 4 niveaux, sur le circuit test, à comparer aux ≈ 45 s du propriétaire) ; courses.html reste vert en normal.

=== CODEUR 2 (session-9e), dossier « Grand Prix Dynasty - codeur 2 », branche codeur2 ===
0. Mise à jour : `git merge --ff-only origin/main` dans codeur2.
1. La qualification d'un tour pour le joueur (CLAUDE.md, étape 5) : avant une course avec IA (?ia=N&joueur=1 et ?championnat=1), un écran « Qualification : un tour chronométré » avec deux boutons, « Faire mon tour » et « Passer (départ dernier) ». Le tour : départ lancé seul sur la piste (les IA ne roulent pas), un tour chronométré, sans pénalité de faux départ ; un virage coupé invalide le tour. Les IA ont leur temps de qualification simplifié (existant). La grille suit tous les temps ; tour invalide ou passé = dernier. Résultat de la qualification affiché (place, écart à la pole), puis la course.
   Fini quand : test moteur (grille avec le temps du joueur, tour invalide = dernier) ; ecrans.py : le joueur conduit par le robot fait sa qualification et part à la bonne place ; « Passer » le met dernier ; capture qualif.png ; console vide.
2. Le niveau des écuries agit sur le rythme des IA du championnat (dans championnat.js, en calcul pur, sans toucher ia.js ni simulation.js) : rythme du pilote × facteur de son écurie (ECURIES dans donnees.js), le joueur dans une écurie faible. La qualité de la voiture du joueur suit aussi son écurie, mais seulement par un facteur dans donnees.js, plafonné à ±3 %, à faire valider plus tard par le propriétaire (la conduite lui appartient) : en attendant, le joueur garde la voiture actuelle (facteur 1).
   Fini quand : test : sur 6 Grands Prix simulés, les écuries fortes marquent plus de points que les faibles en moyenne (affiché).
Chaque ordre vert : commit sur codeur2 et message court au Chef. Ne touche pas à ia.js ni à simulation.js.
