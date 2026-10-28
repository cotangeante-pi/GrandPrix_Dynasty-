TOUR 33 — compte rendu du Codeur 1 (2026-10-27, 17h20 → 23h55)

Commit : pneus **0f3c601** (avec origin/main) — GitHub **40620528280 : vert** (13 travaux) ; fusionné sur main par le Chef (6a2967b).
Avant : météo 6be8475 (40592583878, vert, fusionné) ; pneus du joueur 055975b (40595275885, vert, fusionné) ; pont de Suzuko 2c98465 (40598448936, vert, fusionné).
Ordres : A fait (météo, choix des pneus) / pont de Suzuko fait / B1 (IA plus rapides) fait en expert et légende / techniques selon le virage faites en expert et légende, pas en normal (garde-fous) / B2 duel pas tenu / disposition faite.

## A — la météo (meteo.js), le choix des pneus par le joueur
- Voir les deux passages verts plus haut. Seuil « ordre d'arrivée différent » 20 → 15 sur 30 (décision du Chef : jamais au-dessus de 17).
- Le joueur choisit ses pneus au garage avant les qualifications (la prévision de meteo3d.js, « au choix de l'équipe » par défaut), et pendant l'arrêt (← →) ; METEO.etat donne aussi eauTrajectoire.

## Le pont de Suzuko dans la physique plate
- Risque réel : contactsVoitures, voituresVues et aspirationVoitures ne regardaient que x, z (témoin : deux voitures posées au croisement sur le circuit sans croisement se touchent). positionSurPiste ne basculait pas dans sa fenêtre (±8 échantillons) ; seule la recherche complète de secours pouvait sauter.
- `branchesOpposees` (circuits.js) : l'une à moins de `CROISEMENT_ZONE` (200 m) de s1, l'autre de s2 → ni contact, ni vue, ni aspiration ; la recherche complète garde la branche de l'indice connu. Rien ailleurs (circuit.croisement null).
- officiels.html : passages à 0,97 m l'un de l'autre ; 20 IA 3 tours : 0 contact / 0 vue / 0 aspiration / 0 saut, 20/20 (mais aucune paire à moins de 8 m au croisement pendant ces 3 tours : c'est le test fabriqué qui prouve) ; deux voitures posées l'une sur l'autre : 0 contact, 0 vue, chacune garde sa branche.

## B1 — les IA plus rapides (le niveau change la façon de piloter ; la voiture et la physique restent les mêmes)
Ce qui coûtait (mesuré sur le circuit test, IA seule) :
- la corde du style (`IA_STYLE_CORDE` [0 ; 2,5] m de largeur non utilisée) : ~5 s au tour ;
- la carte à 1,5 m du bord : la même carte recalculée à 0,5 m fait Spaa 103 s au lieu de 109 s (l'élargir par le style ne suffit pas) ;
- le piège « continuer » au freinage : la pénalité IA_PENALITE_FREIN fait choisir la ligne qui reste à l'extérieur dans les virages de 40 m (29 m/s au lieu de 35) ;
- et la limite d'adhérence : la voiture accroche un peu plus que `vitesseVirage` ne le dit (l'arrière accroche ×1,25).
Réglages par niveau (NIVEAUX, donnees.js ; absents au niveau normal → la course d'avant au bit près) : `margeCarte` (la carte du niveau : ia.js margeCarte, une carte par marge dans carteDe et dans la clé du cache, cache-carte.js), `corde` (×), `marge` (+, sur la marge du style), `bordMin`, `limite` (×), `penaliteFrein` (×), `precision` (le manque à 1 du rythme et du freinage × ça : l'ordre entre pilotes est gardé). Expert : 1,1 m / 0,5 / −0,7 / 0,8 / 1,01 / 0,5 / 0,6. Légende : 0,7 m / 0 / −1,4 / 0,5 / 1,02 / 0 / 0,3.

Meilleur tour d'une IA seule (3 tours, 3 graines : min / médiane), en JavaScriptCore (osascript, l'écran bloqué ; ± 1 s d'écart avec Chrome) :

| circuit | débutant | normal | expert | légende |
|---|---|---|---|---|
| test | 54,8 / 55,3 | 53,3 / 53,4 | 51,9 / 52,5 | **46,7 / 47,1** |
| Bahrayn | 98,5 / 99,7 | 95,1 / 97,3 | 93,4 / 95,9 | 88,7 / 90,2 |
| Melbourn | 79,6 / 81,2 | 78,3 / 79,4 | 75,7 / 76,6 | 71,1 / 72,5 |
| Suzuko | 107,0 / 109,0 | 102,7 / 104,8 | 97,9 / 98,9 | 92,7 / 92,9 |
| Montréol | 77,7 / 78,7 | 75,2 / 76,5 | 73,3 / 73,7 | 69,6 / 69,7 |
| Monoco | 77,9 / 79,0 | 75,3 / 76,1 | 69,1 / 70,4 | 64,9 / 66,2 |
| Barcelana | 83,4 / 84,1 | 81,5 / 82,1 | 76,9 / 78,6 | 72,4 / 72,5 |
| Silverstoun | 94,6 / 96,2 | 92,7 / 93,9 | 89,5 / 91,1 | 82,8 / 83,1 |
| Spaa | 119,8 / 120,0 | 116,5 / 117,1 | 111,5 / 112,3 | 105,2 / 106,1 |
| Monzo | 85,0 / 86,8 | 83,4 / 84,2 | 81,9 / 82,2 | 75,7 / 76,5 |
| Singapura | 110,6 / 111,0 | 108,4 / 108,4 | 103,5 / 106,3 | 100,3 / 100,7 |
| Interlagas | 81,9 / 82,7 | 78,3 / 79,6 | 77,0 / 77,2 | 74,6 / 74,7 |
| Yas Marino | 86,0 / 86,7 | 84,5 / 86,0 | 81,8 / 83,3 | 80,0 / 80,5 |

**Pour le propriétaire : la meilleure IA en légende fait 46,7 s sur le circuit d'essai (il fait 45 s) ; avant ce tour, 54,0 s.** Avant le tour 33, la meilleure IA légende sur le test : 54,0 s (10 graines, médiane 56,5) ; le pilote neutre au rythme 1 : 49,1 s. Herbe : 0 partout sauf Interlagas légende (21 pas). 45–46 s : pas tout à fait (46,7 s) ; le pilote neutre de la carte à 0,5 m fait 45,7 s : c'est à peu près la limite de la carte d'aujourd'hui.

## Les techniques selon le virage (CLAUDE.md « Des techniques de pilote selon le virage »)
- `typerVirages` (ia.js, à la construction de la carte) : autour du sommet, la partie qui tourne, sa longueur, son angle, son rayon, la droite qui suit → `rapide` (rayon > 100 m), `enchainement` (le suivant, de l'autre côté, à moins de 90 m), `avantDroite` (≥ 300 m de droite après), `court` (épingle < 30 m ou < 50 m de long), `long` (≥ 120 m), `moyen`.
- `techniquesPilote` : pour chaque virage, la corde déplacée (apex, m) et la place vers l'intérieur (m), × le goût du pilote (`IA_STYLE_TECHNIQUE` [0,5 ; 1,5], tiré à part : `GRAINE_TECHNIQUE`), × la technique du niveau. Ce ne sont que des décalages de sa ligne rapide : il choisit toujours sa ligne, sa vitesse vient de la forme de la ligne. IA_TECHNIQUES : court corde +2 m ; long +0,5 m à l'intérieur ; enchaînement +0,5 m ; avant une droite corde +1 m.
- Mesuré (balayage en JavaScriptCore, légende, 5 circuits) : sacrifier le premier virage d'un S (vers l'extérieur) coûtait du temps (test +0,35 s), un peu plus à la corde en gagnait ; la corde tardive des virages courts gagnait sur le test, perdait un peu à Monoco. Tous ces écarts sont de l'ordre du bruit d'une IA seule : sur GitHub (V8), légende sur le test, avec 48,22 s, sans 47,28 s ; en JavaScriptCore, avec 47,05 s, sans 47,87 s. Le test exige donc « plus rapide qu'avant le tour » (< 49,4 s) et affiche les deux.
- Positions vers l'intérieur (entrée / corde / sortie, ±30 m du sommet, technique 1 contre le pilote neutre) : test, court : −2,13 / 2,40 / −4,92 m contre −1,69 / 2,19 / −4,97 m, corde 2,0 m plus tard ; Monoco, enchaînement : −0,98 / −0,30 / −2,45 contre −1,26 / −0,80 / −2,64 ; Spaa, avant une droite : −2,99 / −2,00 / −3,45 contre −2,76 / −2,84 / −3,38, corde 1,0 m plus tard. Deux goûts (0,5 et 1,5) : lignes différentes ; goût 0 = la ligne neutre en chaque point.
- **En normal et en débutant : pas branchées.** Essayé sur GitHub : normal 0,5 + débutant 0,2 (9a6ba17, 40617297008) ; corde tardive seule (codeur1-essai-b, 40618420123) → chocs > 5 m/s 9 et 10 sur 30 courses (au plus 6), une coupe (4b test graine 8), la leçon « dépassement » du tutoriel ratée (pasDevant), et 1 choc de plus en pneus IA 12 tours. Normal 0,3 + débutant 0,1 (codeur1-essai-a, 40618417071) : chocs 9, une coupe (graine 2), rivalité 8 chocs contre 6 ; corde courte +1 m (codeur1-essai-c, 40618422550) : chocs 9, une coupe (graine 9), pneus IA 12 tours +1 choc. Le repli (expert et légende seulement) est celui qui est poussé. Les branches d'essai sont effacées.
- Empreintes de trajectoire : **inchangées** (Σécart test −5591.154986164103, technique −8626.812883967046) : les techniques sont dans la ligne du pilote (ligneRapide), pas dans la carte (calculerTrajectoire) ; la carte d'un niveau (margeCarte) n'est calculée qu'à ce niveau. Le pilote neutre fait toujours 55,42 s sur le technique.
- Pas fait : la bataille (plonger, fermer, croiser) et la pluie (quitter la trajectoire mouillée avec eauTrajectoire).

## B2 — le duel : pas tenu
- `IA_CARACTERE.qualif` (tiré avec GRAINE_QUALIF_TRAIT, lu par qualifier, le même à tous les niveaux) : à [0 ; 0] pour l'instant (× (1 + 0) : la grille d'avant au bit près).
- Mesuré (courses.html, 30 courses) : à ±1,5 % et à ±3 %, avec l'entrée côte à côte (IA_LENT_COTE_A_COTE = 1) et l'IA qui profite d'une erreur : **vainqueur ≠ poleman 0 / 30**. À ±3 %, la meilleure IA part souvent 3e à 7e et finit à la même place : 41 dépassements en 30 courses. Sur 2585 attaques (16 courses), 2069 finissent en « échappée » (la voiture devant reprend plus d'1 s), 379 « pas à hauteur » ; avec IA_ATTAQUE_ECART_TEMPS à 2 ou 3 s, l'échappée disparaît mais devient « pas à hauteur » (700) et les dépassements baissent (17–18). Le blocage n'est pas la grille, c'est que la plus rapide ne se met jamais à côté.
- Ce qui reste branché, éteint : IA_LENT_COTE_A_COTE 0, IA_PROFITER_ERREUR false, SIMULATION_FEUX 0.

### Diagnostic pour demain : pourquoi l'attaquant décroche (mesuré en JavaScriptCore, 12 courses de 10 IA, 5 tours, test et technique, niveau normal)
Chaque pas où une IA prépare une attaque (état « preparer »), l'écart à la voiture visée, classé selon ce que fait l'attaquant :

| où | temps | l'écart (m/s : + = il décroche) | gaz partiel | aspiration moyenne |
|---|---|---|---|---|
| ligne droite | 4495 s | **+1,67** | 15 % | 0,37 |
| virage | 1900 s | **+0,86** | **52 %** | 0,37 |
| freinage | 884 s | −5,54 | 0 % | 0,43 |

- L'attaque commence trop loin : 42,8 m d'écart en moyenne au début de « preparer » (IA_DECALAGE_ECART est à 20 m : il n'est jamais assez près pour se décaler).
- Il perd dans les virages et à leur sortie : la moitié du temps en virage, il ne met pas plein gaz (52 %). C'est la vitesse « derrière une voiture » (vitesseDerriere, IA_DISTANCE_ATTAQUE 7 m, IA_FREIN_PREVU) qui le retient, pas l'adhérence. Le défenseur ressort plus vite, et dans la droite d'après l'attaquant perd encore 1,67 m/s malgré une aspiration de 0,37 (la sortie compte plus que l'aspiration).
- Il gagne au freinage (5,5 m/s), mais trop tôt : pendant 45 226 pas (377 s), il freine pendant que la voiture devant ne freine pas encore, à 22,5 m derrière elle en moyenne. Il freine pour elle (la vitesse prévue derrière une voiture qui ralentit), pas pour le virage.
- Sur 1668 attaques suivies : 1051 « échappée », 252 « pas à hauteur », 203 « pas devant au freinage (virage lent) ».
Ce que je ferais en premier : en « preparer », ne plus le retenir derrière la voiture visée tant qu'il n'est pas à IA_DISTANCE_MIN (il suit sa propre ligne et sa vitesse, plus l'aspiration), pour qu'il arrive au freinage à moins de IA_DECALAGE_ECART. Puis qu'il freine au point de freinage de sa carte, pas sur la prévision de la voiture devant, tant que l'écart le permet. Mesurer « échappée », les dépassements et vainqueur ≠ poleman avant le trait de qualification, qui ne sert à rien tant que personne ne double.

### Les techniques en normal : d'où viennent les chocs > 5 m/s
Mesuré ce soir en JavaScriptCore : les 30 courses de courses.html (10 IA, 5 tours), niveau normal, sans techniques puis avec (× 0,5) :

| | chocs > 5 m/s (30 courses) | où |
|---|---|---|
| sans techniques, JavaScriptCore | **8** | 5 au freinage du virage court du test (480–520 m), 3 au freinage du virage court du technique (2390–2450 m), 2 au virage moyen du test (1833–1876 m) |
| avec × 0,5, JavaScriptCore | **2** | test 482–488 m, technique 2437–2442 m : les mêmes freinages |
| sans techniques, GitHub (V8) | 4 | |
| avec × 0,5, GitHub (V8) | 9 | |

- Le même code donne 4 chocs dans Chrome et 8 en JavaScriptCore. Avec les techniques, c'est 9 contre 2. **Le garde-fou « au plus 6 sur 30 courses » est au niveau du bruit** : un arrondi différent dans un sinus change quelles courses ont un choc. Les techniques n'ajoutent pas de chocs de façon systématique.
- Les chocs ont presque tous lieu au même endroit, avec ou sans techniques : 40 à 100 m après le point de freinage d'un virage court, à 6–17 m/s. C'est la file qui freine : celui de derrière freine sur la prévision de la voiture devant (IA_FREIN_PREVU), qui se trompe quand elle freine plus fort ou plus tard que prévu.
Ce que je ferais en premier : mesurer les garde-fous sur 90 courses (3 × plus) pour que 6 chocs veuillent dire quelque chose, et regarder la prévision du freinage dans les virages courts (dPrevu et IA_FREIN_PREVU, la ligne de l'autre avec sa technique). Ensuite seulement, remettre les techniques en normal (× 0,5).

## La disposition promise en discussion (Codeur 3 → ia.js)
- championnat.js (appliquerNiveaux) : `e.dispositions` = celles du Grand Prix suivant seulement (d.saison = ch.saison, d.gp = ch.resultats.length + 1) ; une passée ne compte pas.
- simulation.js (donnerCarte) : `pilote.disposition = { type, id }` (laisser : la voiture du joueur ; bloquer X : la voiture de X).
- ia.js : « laisser » : il laisse la place au joueur à côté de lui dès IA_HAUTEUR_LAISSER × (1 − DISPOSITION_LAISSER) de chevauchement ; « bloquer » : `defendreDisposition` couvre l'intérieur du prochain virage de DISPOSITION_DEFENSE (1 m) quand X le suit à moins de 8 m. DISPOSITION_PLAFOND 0,5 (≤ 2,5 m). La physique ne change pas ; sans disposition, rien.
- test.html : la disposition arrive au bon pilote (laisser → la voiture du joueur, bloquer → X), une passée ne compte pas ; 10 IA, 3 tours, 3 graines, A bloque X : défenses sans 0, avec > 0.

## Pour CLAUDE.md
- NIVEAUX a maintenant des réglages de pilotage (margeCarte, corde, marge, bordMin, limite, penaliteFrein, precision, technique), absents au normal. La carte des IA dépend du niveau quand il a margeCarte (carteDe, clé du cache).
- Les techniques selon le virage : IA_TECHNIQUES, IA_STYLE_TECHNIQUE, GRAINE_TECHNIQUE ; en expert et légende seulement (décision à prendre pour le normal : les garde-fous ci-dessus).
- Écran bloqué : mes mesures de calcul pur passent par osascript -l JavaScript (scratchpad/codeur1/jxa.py) ; leurs nombres diffèrent de Chrome (JavaScriptCore contre V8) d'environ ±1 s sur un tour d'IA seule.

## Ce que je n'ai pas pu vérifier
- Les mesures du tableau sont en JavaScriptCore, pas dans Chrome (écran bloqué après 21h).
- Les techniques en bataille et sous la pluie.
- Le duel.

Réévalue.

**Duel-2 (23h00–23h30, branche duel-2, 0e265b8, pas fusionnée)** : étape 1 du diagnostic (IA_PREPARER_LIBRE : en préparation d'attaque, retenue seulement à IA_DISTANCE_MIN, et seulement quand la voiture visée freine, IA_FREIN_VU 2 m/s²). Calcul pur (JavaScriptCore, 30 courses) : vainqueur ≠ poleman 0 → 0, dépassements 43 → 54, chocs > 5 m/s 8 → 5, herbe 2410 → 3040, 300/300 arrivées. GitHub 40626339493 ROUGE : 35 dépassements (32 sans rivalité), vainqueur ≠ poleman 1, chocs 3 ; tombent : technique 20 voitures graine 1 (2 chocs pour 1), pneus IA 12 tours (+1 choc), rivalité (le rival attaque le joueur 96 fois contre 108 pour un pilote sans rivalité). Pour demain.
