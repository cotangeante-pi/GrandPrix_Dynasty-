TOUR 5 — étape 3 (une course seule, avec le chrono) — rapport du Chef
Commit vérifié : 3f3bbc1 (code 09ae548), poussé sur GitHub (140696f)
Note : 35/100 — conduite 11/20, course et IA 1/20, championnat 0/15, interface 4/15, 3D et perf 8/15, code et tests 9/10, Poki 2/5
Tests : relancés par le Chef → TOUT PASSE (test.html 74/74, ecrans.py 94/94, 212 s ; charge du Mac 8–12).
Mesures : voiture 6 appels de dessin, 796 triangles ; image entière 15 appels. Robot 66,46 s, 0 contact.

**Étape 2 FINIE** : le propriétaire a conduit la version du tour 4 et dit « oui la conduite me va ». Ne touche plus aux réglages de conduite sans retour du propriétaire.

Ce qui marche : reglages.png et derriere.png sont propres, le son et les rapports marchent, et la cause du tête-à-queue a été bien trouvée (l'arrière qui décrochait).

Petits défauts (pas des ordres pour ce tour) : le panneau ?reglages=1 coupe le texte « Copier » en bas ; les noms des curseurs sont ceux du code (ADHERENCE_HERBE…). C'est un outil de réglage, pas grave.

ORDRES — l'étape 3. Le temps est court : il faut être vert AVANT 20h40. Si ce n'est pas possible, commite à 20h35 ce qui est vert, dans l'ordre 1 → 4, et dis ce qui reste.

1. Le chrono et les tours (`course.js`, calcul pur) : la voiture part arrêtée juste derrière la ligne. Le chrono démarre au premier mouvement après « GO » (simple compte 3-2-1 pour l'instant, les vrais feux viendront à l'étape 5). Un tour ne compte que si la voiture a passé les secteurs 1 → 2 → 3 dans l'ordre puis la ligne (reculer sur la ligne ne compte pas). On garde : le temps de chaque tour, chaque temps de secteur, le meilleur tour, le temps total.
   Fini quand : des tests avec le robot (BOUCLE.simuler) : une course de 5 tours est finie, le total = la somme des tours, la somme des 3 secteurs = le tour ; reculer sur la ligne ne compte pas de tour ; repasser la ligne sans faire le tour non plus.

2. La pénalité pour virage coupé : pendant une sortie de piste (|d| > demi-largeur + marge réglable), on compare la distance gagnée le long de la piste (Δs) à la distance vraiment roulée. Si Δs > distance roulée + un seuil réglable, le virage est coupé : +5 s au temps total (réglable), le tour est marqué ✂ et le meilleur tour ne peut pas venir d'un tour marqué. Une simple sortie dans l'herbe, sans raccourci, n'est PAS pénalisée.
   Fini quand : des tests vérifient qu'un raccourci à travers une chicane donne +5 s, et qu'une sortie large dans un virage (sans raccourci) ne donne rien.

3. L'interface de course (provisoire, propre et lisible ; la grande passe de style sera à l'étape 11) : avant la course, un petit écran de choix « Très courte 5 tours / Moyenne 12 tours / Longue 18 tours » + « Essai libre » (tours sans fin, chrono et meilleur tour). En course : Tour n/N, le chrono du tour, le meilleur tour, les 3 secteurs du tour en couleurs (violet = meilleur secteur, vert = mieux que ton tour précédent, jaune = plus lent), « +5 s ✂ » quand il y a une pénalité. Tous les textes dans textes.js, en anglais et en français. Échap = pause (la physique s'arrête), avec « Reprendre » et « Recommencer ».
   Fini quand : captures choix.png, course.png (pendant une course, secteurs visibles) ; un test vérifie que la pause arrête la physique.

4. L'écran de fin : temps total, meilleur tour, la liste des tours (avec ✂ et pénalités), boutons « Rejouer » et « Changer de longueur ». Le meilleur tour de chaque longueur est gardé dans localStorage (dans un seul module `sauvegarde.js` avec un numéro de version, comme le dit CLAUDE.md ; en try/catch).
   Fini quand : capture fin.png ; un test fait finir une course au robot et vérifie l'écran de fin et le record gardé après rechargement.

Écris `rapports/tour-05-compte-rendu.md`, commite « Tour 5 : le chrono » si tout est vert, puis « Réévalue. ». Ne pousse pas sur GitHub (c'est moi qui le fais).

Questions pour le propriétaire : remesurer `index.html?debug=1` (images par seconde, sans test qui tourne).
