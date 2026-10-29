TOUR 37 — compte rendu du Codeur 1 (2026-10-28, 16h15 → 21h45)

Commits :
- duel-2 **42a6707** — GitHub 40773282326 : vert (16 travaux ; recoins-1 vert à la relance, #boutonPasser instable, rien à voir) ; fusionné sur main (e31857d).
- techniques-normal **c7b10ee** (avec main) — GitHub **40796270577 : vert** (16 travaux sur 16).

Ordres : 1 (duel) : les 3 tests de 0e265b8 verts, le critère du duel mesuré et tenu sur les courses avec arrêt (stands.html) / 2 (techniques en normal) : fait à × 0,28.

## 1. Le duel (duel-2, fusionné)
- Les 3 tests rouges de 0e265b8, verts sans les affaiblir (Chrome sur le Mac, les mêmes nombres que GitHub) : technique 20 voitures graine 1 : 1 choc ; pneus IA 12 tours : 0 avec, 0 sans ; rivalité : le rival attaque le joueur 147 fois, 110 sans rivalité.
- Ce qui change (ia.js, donnees.js) : quand la voiture visée freine (vue : sa vitesse baisse de plus de IA_FREIN_VU = 0,5 m/s² d'un pas à l'autre), l'attaquant reprend la distance de l'attaque et prévoit sa décélération vue (IA_PREPARER_FREIN) ; tout près d'elle (IA_DECALAGE_ECART), il freine déjà comme en attaque (IA_PREPARER_FREINE_TARD) ; rien de tout ça avant 1000 m (IA_PREPARER_APRES : le premier virage reste celui d'avant, le résumé du circuit test garde ses 2 dépassements du tour 1).
- courses.html (30 courses de 5 tours, sans pneus) : vainqueur ≠ poleman 0 → 1, dépassements 35 → 33, chocs 2 → 1. Ce n'est pas là que le duel se joue.
- Le diagnostic (Chrome) : les rythmes réels sont trop proches. Meilleurs tours en course à 0,4–1 s les uns des autres sur 57 s, le style (la corde) brouillant le rythme ; le poleman est souvent vraiment le plus rapide (la qualification suit le rythme). Exemple : rythme 1,000 derrière un poleman à 0,970, seulement 0,4 s au tour plus rapide, il reste 10 à 60 m derrière pendant 5 tours (16 attaques finies en « échappée »). Le trait IA_CARACTERE.qualif à ±1,5 % ou ±3 % ne change rien sans arrêt (0/30, et 9 chocs à ±3 %) : il reste à 0.

## Le critère du duel sur les courses avec arrêt (décision du Chef)
stands.html, nouveau bloc (50 courses de 12 tours, 10 IA, test et technique, pneus et un arrêt : les 30 de la page et 10 de plus par circuit), mesuré dans Chrome :

| | |
|---|---|
| vainqueur ≠ poleman | **22 / 50 (44 %)** — exigé entre 20 et 60 % |
| le pilote au meilleur rythme gagne | 26 / 50 (52 %) — exigé plus que la moyenne (10 %) |
| arrivées | 100 % |
| chocs > 5 m/s | 11 (DUEL_CHOCS_MAX = 11, la mesure d'aujourd'hui) |
| dépassements en piste | **61** |
| dépassements du cycle des arrêts | 1934 |

- Les « dépassements » de simulation.js comptent chaque changement d'ordre entre deux voitures ; ils sont maintenant marqués `stand` quand l'une des deux est dans la voie des stands ou en route vers elle (pilote.stand, piste.stands, campStands). Les 1151 d'hier étaient presque tous des changements d'ordre du cycle des arrêts (chaque voiture qui entre dans la voie « est passée » par toutes celles qui restent en piste, puis les repasse) ; en piste, il y en a 61 sur 50 courses.
- Sans pneus, les mêmes 12 tours : vainqueur ≠ poleman 1/30. C'est la stratégie (les tours d'arrêt différents, l'usure selon gestionPneus) qui sépare les pilotes, pas le rythme pur.
- Durée du travail stands sur GitHub : 343 s (5 min 43 s ; au plus 8 minutes demandé), donc 50 courses gardées.

## 2. Les techniques selon le virage en normal (branche techniques-normal)
- 90 courses (Chrome) à 0 et à 0,5 : chocs > 5 m/s 10 et 11, coupes 1 et 1, herbe 2815 et 3129, dépassements 108 et 117 : la différence est du bruit (à 0, le 4b « aucune coupe » tombe déjà sur 90 courses, graine 20).
- L'écart Mac / GitHub d'hier n'existait pas : le travail courses lance courses.html deux fois, la seconde avec ?ailerons=1, et c'est elle qui tombait. Les nombres du Mac (Chrome) et de GitHub sont les mêmes.
- Le facteur, essayé page par page (courses.html, ?ailerons=1, meteo.html) :

| normal × | courses | ?ailerons=1 | météo (chocs, au plus 9) |
|---|---|---|---|
| 0,5 | ✔ (4 chocs) | ✘ 7 chocs, 2 coupes | — |
| 0,4 | ✘ rivalité 4 / 2 chocs | ✔ | ✔ 5 |
| 0,35 | ✘ coupe, rivalité | ✘ coupe | ✔ 7 |
| 0,32 | ✔ | ✘ 7 chocs | ✔ 8 |
| 0,3 | ✔ | ✔ | ✘ 11 |
| **0,28** | **✔ 44/44** | **✔ 39/39** | **✔ 7** |
| 0,25 | ✘ coupe | ✔ | ✔ 4 |
| 0,15 | ✘ coupe | ✔ | ✔ 7 |
| 0,1 | ✘ rivalité (2) | ✔ | ✔ 8 |

  Aucune tendance : chaque facteur change quelles courses ont un choc ou une coupe ; un seul passe tout, 0,28. Débutant × 0,1 (à 0,2, la leçon « dépassement » du tutoriel ratait ; à 0,1, réussie dans Chrome).
- Empreintes de trajectoire : **inchangées** (Σécart test −5591.154986164103, technique −8626.812883967046) : les techniques déplacent la ligne du pilote (ligneRapide), pas la carte. Le pilote neutre fait toujours 55,42 s.
- Pour demain : la prévision du freinage dans la file des virages courts (les chocs sont 40 à 100 m après le point de freinage, que les techniques soient là ou pas) ; et des garde-fous sur plus de courses (sur 30, un seul choc fait basculer le test).

## Pour CLAUDE.md
- NIVEAUX.normal.technique 0,28, debutant 0,1.
- Le critère du duel se lit dans stands.html (ligne « DUEL sur 50 courses »), et les dépassements y sont séparés : en piste / au stand.
- IA_PREPARER_* et IA_FREIN_VU (duel-2).

## Ce que je n'ai pas pu vérifier
- Le duel dans une vraie course de la page (avec le joueur), seulement en simulation.
- Les techniques en bataille et sous la pluie (pas faites).

Réévalue.
