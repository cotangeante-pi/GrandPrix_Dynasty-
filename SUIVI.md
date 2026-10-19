# Suivi

Le carnet de bord, tenu par **le Chef** et mis à jour à chaque tour (voir `CLAUDE.md`). Les rapports et comptes rendus complets sont dans `rapports/`.

## Sessions

- 2026-10-18 : Chef session-2d, Codeur session-0e
- 2026-10-19 : Chef **session-76**, Codeur **session-dd** (donné par le propriétaire)

## Horaires

- 2026-10-18 : boucle jusqu'à 21h (demandée par le propriétaire). À 21h, on fige sur le dernier commit vert.

## Tour en cours

**Tour 9 — étape 4b** (lancé à 19h, le propriétaire : « continuez à travailler ») : contacts entre voitures, simulation.js, rythmes, 10 courses de 10 IA, ?ia=N. Rapport : rapports/tour-09-rapport.md. Étape 4a : critère atteint (tours 7–8), le propriétaire n'a pas encore regardé ?ia=1.

Découpage de l'étape 4 : 4a (tours 7–8 : circuit technique, une IA seule ≤ 50 s sur Test) → 4b (plusieurs IA sans se toucher) → 4c (dépasser, défendre) → 4d (caractères, niveaux, page des 50 courses).

## Notes du Chef

| Tour | Commit | Note /100 | Conduite /20 | Course et IA /20 | Championnat /15 | Interface /15 | 3D et perf /15 | Code /10 | Poki /5 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | a4f5bdd | 10 | 0 | 0 | 0 | 0 | 1 | 8 | 1 |
| 2 | 16de5dc | 15 | 0 | 0 | 0 | 0 | 5 | 9 | 1 |
| 3 | 43a3fa8 | 27 | 7 | 1 | 0 | 2 | 7 | 9 | 1 |
| 4 | 09ae548 | 35 | 11 | 1 | 0 | 4 | 8 | 9 | 2 |
| 5 | 44b3624 | 42 | 12 | 5 | 1 | 6 | 8 | 9 | 1 |
| 6 | e59f5a2 | 44 | 12 | 5 | 1 | 8 | 8 | 9 | 1 |
| 7 | fbbf844 | 47 | 12 | 8 | 1 | 8 | 8 | 9 | 1 |
| 8 | 7cd8ce5 | 48 | 12 | 9 | 1 | 8 | 8 | 9 | 1 |

## À essayer par le propriétaire

- Étape 1 : survol `index.html?camera=libre`.
- Étape 4a : regarder l'IA rouler : `index.html?ia=1` et `index.html?ia=1&circuit=technique`. Le circuit technique : assez technique ?

## Étape en cours

**Étape 1 — Le circuit** : finie (tours 2–3). **Étape 2 — La voiture** : **finie** (tours 3–4 ; le propriétaire, 19h45 : « oui la conduite me va »). **Étape 3 — Une course seule** : **finie** (tours 5–6 ; le propriétaire : « oui tout me va, l'étape 3 est finie »).

## Fini

- Rien encore (le `CLAUDE.md` est écrit, au 2026-10-18).

## À faire dans l'étape en cours

- [ ] `git init`
- [ ] `index.html` et Three.js en local dans `lib/`
- [ ] la boucle avec la physique à rythme fixe
- [ ] `tests/lancer.py` et une première page de test

## Décidé

- 2026-10-18 : le nom du jeu est **Grand Prix Dynasty** (remplacer `NOM_DU_JEU` au tour 4).

- 2026-10-18 : dépôt GitHub **public** https://github.com/cotangeante-pi/Grand-Prix-Dynasty (choix du propriétaire, pour GitHub Pages). Le Chef pousse `main` après chaque tour vérifié ; le Codeur ne pousse pas.

## Bugs connus

- À surveiller en 4b : départ impossible (épingle à 60 m/s, nez vers l'extérieur) = 1288 pas (≈ 10 s) contre la barrière avant de repartir. Une IA collée au mur 10 s se verra.
- Sous swiftshader, le premier dessin 3D bloque la page 0,3–2 s même sans IA (critère 3 du tour 8 adapté : seule la plus longue tranche du calcul de l'IA est < 300 ms, 67 ms mesurés).
- À voir : en grand virage rapide, la caméra derrière montre surtout l'herbe (CAMERA_SUIVI_CAP 6/s). Seulement si le propriétaire le remarque.
- Panneau ?reglages=1 : le texte « Copier » est coupé en bas, noms des curseurs = noms du code. (Ondulations du circuit corrigées au tour 3 : circuit décrit par morceaux.)

## Mesures

| Date | Étape | Images par seconde | Poids du jeu | Notes |
|---|---|---|---|---|
| 2026-10-18 | 0 | **100 i/s** sur le Mac du propriétaire (Chrome, index.html?debug=1) | three.min.js 633 Ko + < 25 Ko | scène du cube ; Chrome sans fenêtre = rendu logiciel, sans valeur |
| 2026-10-18 | 1 (en cours) | **100 i/s** (le propriétaire) | — | circuit de test, version pas encore finie |
| 2026-10-18 | 2 (tour 3) | **70 i/s** (le propriétaire) | — | 1 voiture ; charge du Mac 12–13 à ce moment ; pixelRatio 2 + beaucoup d'appels de dessin par voiture → tour 4, ordre 7 |
| 2026-10-19 | 4a (tour 7) | — | three 618 Ko + code 111 Ko ≈ 729 Ko (zip ≈ 195 Ko) | IA : Test 47,88 s, Technique 54,43 s par tour lancé ; trajectoire 0,3–4,6 s de calcul (Mac chargé) |
| 2026-10-18 | 2 (tour 4) | **> 90 i/s** en général (le propriétaire) | — | 1 voiture, 6 appels de dessin, pixelRatio 1,5 |

## Retours du propriétaire

- 2026-10-18, tour 2 en cours : il voit la piste, « elle est longue un peu comme je voulais », la forme n'est pas encore avancée. → Garder des circuits longs ; la forme viendra avec les vrais tracés (étape 10).

- 2026-10-18 19h15, conduite (tour 3) : « la voiture tourne trop quand tu appuies un peu longtemps sur tourner et la caméra est trop loin quand on accélère trop ». → Tour 4, ordres 5 (caméra : retard du ressort 2v/w ≈ 20 m à pleine vitesse, + champ de vision) et 6 (direction au clavier en deux temps, braquage plus réduit à haute vitesse).
- 2026-10-18 19h35, conduite (ordres 5–6) : « quand tu appuies sur tourner pendant 1 sec il ne doit pas rester braqué » ; « hors piste c'est juste la vitesse qui diminue (bcp), pas les manettes qui bloquent ». → Tour 4, ordres 8 (la voiture continue de tourner après le lâcher : à mesurer) et 9 (herbe : garder l'adhérence, freiner fort).
- le propriétaire veut le projet sur GitHub (voir « Décisions en attente »).
- 2026-10-18 20h25, étape 3 : meilleur tour du propriétaire ≈ **45 s** en course très courte (le robot fait 1:02) ; pénalité de chicane et herbe sans pénalité : « oui oui » ; « j'espère que c'est une arène de test parce qu'elle a beaucoup trop de lignes droites ». → Oui, c'est un circuit de test. **Au début de l'étape 4 : un 2e circuit d'essai, technique (épingle, enchaînement en S, courbe rapide, freinage fort après une longue droite), pour entraîner et tester les IA sur de vrais virages.** Les IA devront approcher 45 s sur CIRCUIT_TEST (le robot naïf, à 1:02, est bien trop lent).

## Décisions en attente (pour le propriétaire)


- La liste des 12 circuits.
- La liste exacte des améliorations du garage.
- La météo à l'étape 12 : oui ou non.
- Le Chef peut-il ajouter ia.js, ?circuit= et ?ia=1 à la liste des fichiers de CLAUDE.md ?

## Journal des sessions

| Date | Étape | Ce qui a été fait |
|---|---|---|
| 2026-10-18 | — | `CLAUDE.md` écrit avec le propriétaire |
| 2026-10-18 | 0 | Tour 1 : fondations, 47/47 tests, a4f5bdd, vérifié par le Chef |
| 2026-10-18 | 1 | Tour 2 : le circuit, 82/82 tests, 16de5dc, vérifié par le Chef ; ondulations à corriger |
| 2026-10-18 | 1–2 | Tour 3 : la voiture roule, 121/121 tests, 43a3fa8, robot 66,55 s, nom Grand Prix Dynasty dans le jeu |
| 2026-10-18 | 3 | Tour 5 : chrono, tours, secteurs, ✂ +5 s, écran de choix, pause, écran de fin, records ; 194/194, 44b3624 |
| 2026-10-18 | 3 | Tour 6 : secteurs du tour en cours, arrêt après l'arrivée, sons 3-2-1-GO et arrivée ; 200/200, e59f5a2. Fin de session (20h20). |
| 2026-10-19 | 4a | Tour 8 : IA robuste (18 départs, voiture lente devant, calcul en fond) ; 103/103 + 135/135, 7cd8ce5, vérifié par le Chef (48/100). 4a atteinte, attend le propriétaire |
| 2026-10-19 | 4a | Tour 7 : circuit technique, ia.js, piloteIA, ?ia=1 ; 99/99 + 133/133, fbbf844, vérifié par le Chef (47/100). Ordre 5 (CLAUDE.md) refusé par le Codeur : question à le propriétaire |
| 2026-10-18 | 2 | Tour 4 : son, 8 rapports, ?reglages=1 (22 curseurs), caméra fixe, direction en deux temps, tête-à-queue corrigé, herbe, voiture 28 → 6 appels ; 168/168, 09ae548 |
