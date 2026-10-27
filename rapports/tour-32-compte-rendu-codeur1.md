TOUR 32 — compte rendu du Codeur 1 (2026-10-27, 15h50 → 17h20)

Commit : pneus **b0b1ef9** (ordres 1 et 2, avec origin/main) — GitHub **40578353480 : vert** (11 travaux, 4 min 55 s). Ordre 1 seul : 414650d, passage 40575033288 vert.
Ordres : 1 fait / 2 fait / 3 pas tenu (rien de poussé ; les essais sont décrits plus bas).

## Ordre 1 — les 12 tracés dans le jeu
- `CALENDRIER_CIRCUITS` = bahrayn, melbourn, suzuko, montreol, monoco, barcelana, silverstoun, spaa, monzo, singapura, interlagas, yasmarino.
- circuits.js : les tracés officiels (circuits-officiels-a/b.js, chargés par index.html avant circuits.js) rejoignent `CIRCUITS` : ?circuit=<nom>, le cache des cartes (cache-carte.js, par nom) et le Grand Prix à domicile marchent pour les 12.
- Tests : test.html simule un championnat de 12 GP sur les 12 (19 IA et le robot, 1 tour ; 34 s sur GitHub) et vérifie Japon → Suzuko 🏠 au GP 3 ; les anciens tests du championnat gardent leur calendrier d'essai (test / technique, fixé en tête de test.html). ecrans.py ouvre Monoco, Spaa, Singapura en course (le bon tracé, la carte calculée en fond, les IA sur la piste, 0 barrière ; captures circuit-monoco/spaa/singapura.png).
- Adapté au vrai calendrier : le titre anglais « Grand Prix 1 / 12 — Bahrayn » ; l'écran à deux liste les 14 circuits ; après la découverte (sur « test »), la carte du 1er GP (Bahrayn) n'est pas en cache : le test vérifie que celle de la découverte est gardée et que celle du GP se calcule en fond.
- Bug réel révélé : la question d'interview du dépassement montrait « P{place} » (interview.js, Codeur 3 : le fait n'avait pas sa place ; une ligne).

## Ordre 2 — l'usure sur les vrais tracés, les pneus par défaut
- L'usure est comptée au mètre ; `USURE_ECHELLE` = 0,4 (pneus-donnees.js) la règle sur le plus long tracé (Spaa) : un relais de ~13 tours en 18 tours reste sous 1.
- officiels.html (un travail GitHub à lui) EXIGE sur les 12 : 5 tours sans arrêt, pneus jamais morts ; 12 et 18 tours avec un arrêt chacune, pneus jamais morts ni à l'arrêt ni à l'arrivée. course.js garde l'usure des pneus enlevés (`c.arrets[].usure`).

| usure maximale (10 IA) | 5 tours | 12 tours | 18 tours |
|---|---|---|---|
| Monoco | 0,19 | 0,37 | 0,52 |
| Silverstoun | 0,29 | 0,52 | 0,74 |
| Monzo | 0,29 | 0,56 | 0,78 |
| Spaa | 0,35 | 0,62 | 0,91 |
| Suzuko | 0,31 | 0,65 | 0,89 |
| Interlagas | 0,25 | 0,49 | 0,67 |
| Montréol | 0,19 | 0,40 | 0,55 |
| Melbourn Park | 0,27 | 0,51 | 0,72 |
| Barcelana | 0,26 | 0,46 | 0,67 |
| Bahrayn | 0,28 | 0,50 | 0,74 |
| Singapura | 0,24 | 0,47 | 0,70 |
| Yas Marino | 0,22 | 0,41 | 0,62 |

(10 arrêts sur 10 en 12 et 18 tours partout ; 0 muret, 0 pénalité de vitesse.)
- `PNEUS_ACTIFS` vrai (?pneus=0 les coupe). test.html tourne sans pneus (fixé en tête) ; les deux tests du mécanisme de l'usure se font au calibrage d'origine (`avecPneusCalibrage`, USURE_ECHELLE = 1 : sinon l'effet est trop petit sur le technique) ; la rivalité de courses.html se mesure sans pneus.
- Garde-fous (GitHub 40578353480) : courses.html, maintenant avec les pneus : 35 dépassements, 2 chocs, 41 pas d'herbe (sans pneus : 47 / 4 / 1086) ; ?ailerons=1 33 / 3 / 480 ; stands 4 chocs (9 sans pneus) ; consignes 10, 9 suivies, 4 chocs avec / 5 sans, 0 pendant.
- Conséquence de jeu : sur les circuits courts, les pneus pèsent peu (Monoco 0,37 en 12 tours).

## Ordre 3 — le duel : PAS TENU (vainqueur ≠ poleman reste à 0–1 sur 30)
Mesures sur le Mac (30 courses de courses.html, 5 tours, avec les pneus ; le duel : rapide 1,00 derrière lent 0,94 ou 0,97 sur le technique) :

| essai | duel (rapide passe ?) | 30 courses : dépassements / vainqueur ≠ poleman / chocs / herbe / coupes |
|---|---|---|
| base (b0b1ef9) | non (17 attaques) | 35 / 0 / 2 / 41 / 0 |
| IA_NEZ_DEVANT −2, IA_ATTAQUE_HAUTEUR 1,5 | 0,94 : oui (tour 3) ; 0,97 : non | 39 / 0 / 3 / 2963 / 0 |
| profiter de l'erreur de celle de devant (estLente) | — | 39 / 1 / 3 / 0 / 0 |
| + NEZ −2, HAUTEUR 1,5, IA_QUALIF_HASARD 1 % | — | 42 / 1 / 6 / 3163 / 1 (4b rouge) |
| virage lent joué comme un rapide (entrée côte à côte, contrôle « à moitié à hauteur ») + erreurs | oui, tours 3 et 4 (0 choc) | 41 / 1 / 5 / 703 / 1 (4b rouge) |
| + qualif 1 % | — | 40 / 1 / 3 / 1482 / 1 (4b rouge) |
| + les feux et le départ des IA dans simulerCourse | — | 43 / 0 / 4 / 2245 / 3 (4b rouge) |

Où ça bloque : le duel arrangé se gagne maintenant (l'entrée côte à côte dans les virages lents fait passer le rapide sans choc), mais dans les 30 courses le poleman est presque toujours la voiture la plus rapide (la qualification suit le rythme à ±0,5 %), et le 2e, plus lent ou d'un rythme très proche (~0,6 %), n'a jamais assez d'avance pour se mettre à côté ; plus de hasard en qualification (1 %) ne change rien, et chaque essai qui relâche le contrôle ajoute des coupes (le critère 4b rougit). Rien n'est poussé ; le diff des essais est gardé dans scratchpad/codeur1/duel-essais.diff. Piste pour la suite (décision de jeu) : un vrai trait « niveau en qualifications » par pilote (CLAUDE.md le prévoit), plus large que le hasard d'aujourd'hui, pour que le poleman ne soit pas toujours le plus rapide en course, avec l'entrée côte à côte ci-dessus.

## Sortie des tests
- GitHub 40578353480 (b0b1ef9) : moteur, courses, stands, consignes, officiels, ecrans en 4 tranches, annexes, paquet : tous verts.
- Mac : moteur, ecrans (pages test=officiel), officiels (2 tracés), courses / duel en essais (scratchpad).

## Ce que je n'ai pas pu vérifier
- La sensation des pneus par défaut en jouant ; le duel dans une vraie course contre le joueur.

Réévalue.
