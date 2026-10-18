# Suivi

Le carnet de bord, tenu par **le Chef** et mis à jour à chaque tour (voir `CLAUDE.md`). Les rapports et comptes rendus complets sont dans `rapports/`.

## Sessions

- Chef : session-2d (la session qui a écrit CLAUDE.md avec le propriétaire)
- Codeur : session-0e (« instructions claude.md améliorées », confirmé par le propriétaire)

## Horaires

- 2026-10-18 : boucle jusqu'à 21h (demandée par le propriétaire). À 21h, on fige sur le dernier commit vert.

## Tour en cours

**Tour 5 — étape 3 (le chrono)** : ordres envoyés (`rapports/tour-05-rapport.md`), à finir avant 20h40.

## Notes du Chef

| Tour | Commit | Note /100 | Conduite /20 | Course et IA /20 | Championnat /15 | Interface /15 | 3D et perf /15 | Code /10 | Poki /5 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | a4f5bdd | 10 | 0 | 0 | 0 | 0 | 1 | 8 | 1 |
| 2 | 16de5dc | 15 | 0 | 0 | 0 | 0 | 5 | 9 | 1 |
| 3 | 43a3fa8 | 27 | 7 | 1 | 0 | 2 | 7 | 9 | 1 |
| 4 | 09ae548 | 35 | 11 | 1 | 0 | 4 | 8 | 9 | 2 |

## À essayer par le propriétaire

- Étape 1 : survol `index.html?camera=libre`.

## Étape en cours

**Étape 1 — Le circuit** : finie (tours 2–3). **Étape 2 — La voiture** : **finie** (tours 3–4 ; le propriétaire, 19h45 : « oui la conduite me va »). **Étape 3 — Une course seule** : en cours (tour 5).

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

- Aucun. (Ondulations du circuit corrigées au tour 3 : circuit décrit par morceaux.)

## Mesures

| Date | Étape | Images par seconde | Poids du jeu | Notes |
|---|---|---|---|---|
| 2026-10-18 | 0 | **100 i/s** sur le Mac du propriétaire (Chrome, index.html?debug=1) | three.min.js 633 Ko + < 25 Ko | scène du cube ; Chrome sans fenêtre = rendu logiciel, sans valeur |
| 2026-10-18 | 1 (en cours) | **100 i/s** (le propriétaire) | — | circuit de test, version pas encore finie |
| 2026-10-18 | 2 (tour 3) | **70 i/s** (le propriétaire) | — | 1 voiture ; charge du Mac 12–13 à ce moment ; pixelRatio 2 + beaucoup d'appels de dessin par voiture → tour 4, ordre 7 |
| 2026-10-18 | 2 (tour 4) | **> 90 i/s** en général (le propriétaire) | — | 1 voiture, 6 appels de dessin, pixelRatio 1,5 |

## Retours du propriétaire

- 2026-10-18, tour 2 en cours : il voit la piste, « elle est longue un peu comme je voulais », la forme n'est pas encore avancée. → Garder des circuits longs ; la forme viendra avec les vrais tracés (étape 10).

- 2026-10-18 19h15, conduite (tour 3) : « la voiture tourne trop quand tu appuies un peu longtemps sur tourner et la caméra est trop loin quand on accélère trop ». → Tour 4, ordres 5 (caméra : retard du ressort 2v/w ≈ 20 m à pleine vitesse, + champ de vision) et 6 (direction au clavier en deux temps, braquage plus réduit à haute vitesse).
- 2026-10-18 19h35, conduite (ordres 5–6) : « quand tu appuies sur tourner pendant 1 sec il ne doit pas rester braqué » ; « hors piste c'est juste la vitesse qui diminue (bcp), pas les manettes qui bloquent ». → Tour 4, ordres 8 (la voiture continue de tourner après le lâcher : à mesurer) et 9 (herbe : garder l'adhérence, freiner fort).
- le propriétaire veut le projet sur GitHub (voir « Décisions en attente »).

## Décisions en attente (pour le propriétaire)


- La liste des 12 circuits.
- La liste exacte des améliorations du garage.
- La météo à l'étape 12 : oui ou non.

## Journal des sessions

| Date | Étape | Ce qui a été fait |
|---|---|---|
| 2026-10-18 | — | `CLAUDE.md` écrit avec le propriétaire |
| 2026-10-18 | 0 | Tour 1 : fondations, 47/47 tests, a4f5bdd, vérifié par le Chef |
| 2026-10-18 | 1 | Tour 2 : le circuit, 82/82 tests, 16de5dc, vérifié par le Chef ; ondulations à corriger |
| 2026-10-18 | 1–2 | Tour 3 : la voiture roule, 121/121 tests, 43a3fa8, robot 66,55 s, nom Grand Prix Dynasty dans le jeu |
| 2026-10-18 | 3 | Tour 5 : ordres envoyés (chrono, pénalité de virage coupé, interface de course, écran de fin) |
| 2026-10-18 | 2 | Tour 4 : son, 8 rapports, ?reglages=1 (22 curseurs), caméra fixe, direction en deux temps, tête-à-queue corrigé, herbe, voiture 28 → 6 appels ; 168/168, 09ae548 |
