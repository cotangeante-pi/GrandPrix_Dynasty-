# TOUR 40 — compte rendu du Codeur 2 : la marge des 60 images par seconde (étape 10)

Branche `codeur2`, commit 522e582, avec main fusionné.
Passage GitHub 40961447368 sur 522e582 : **vert, 16 travaux sur 16** ; les 12 garde-fous de coûts y sont passés (ecrans-1 à ecrans-4).

## 1. Ce qui coûte, par circuit (mesuré, avec un garde-fou)

**Comment c'est mesuré.** `tests/lieu.html` a maintenant `window.__couts()` :
- la caméra de course est derrière la voiture de tête, avec le champ le plus ouvert (60 + 6 + 3°) ;
- elle est posée en 24 endroits du tour (`COUTS_POINTS`), les 19 autres voitures devant elle en file serrée : le pire trafic ;
- au dernier endroit, on mesure en plus les effets pleins et la ligne de conseil.

Les compteurs viennent de `renderer.info`, en 1280×720 sous swiftshader. Ce sont des nombres d'appels et de triangles : ils ne dépendent pas de la machine.

| Circuit | Appels moy. / pire | Triangles moy. / pire | Vue télé (grille) : appels / triangles | Matériaux | Programmes | Plafond testé (appels / triangles) |
|---|---|---|---|---|---|---|
| Monoco | 41 / 43 | 126 381 / 153 568 | 71 / 131 466 | 38 | 14 | 47 / 169 000 |
| Silverstoun | 38 / 40 | 84 485 / 121 478 | 63 / 84 040 | 38 | 12 | 44 / 134 000 |
| Monzo | 39 / 42 | 64 088 / 80 168 | 61 / 65 288 | 38 | 12 | 46 / 89 000 |
| Spaa | 39 / 41 | 83 706 / 107 008 | 71 / 86 418 | 38 | 12 | 45 / 118 000 |
| Suzuko | 41 / 44 | 85 658 / 129 928 | 64 / 86 948 | 39 | 13 | 48 / 143 000 |
| Interlagas | 39 / 41 | 117 561 / 136 732 | 63 / 133 242 | 38 | 13 | 45 / 151 000 |
| Montréol | 42 / 47 | 75 284 / 106 202 | 65 / 73 452 | 38 | 13 | 51 / 117 000 |
| Melbourn Park | 42 / 44 | 78 496 / 89 810 | 74 / 92 382 | 38 | 13 | 48 / 99 000 |
| Barcelana | 39 / 40 | 73 527 / 97 940 | 69 / 75 368 | 38 | 13 | 44 / 108 000 |
| Bahrayn | 39 / 41 | 67 351 / 85 028 | 64 / 74 536 | 37 | 13 | 45 / 94 000 |
| Singapura | 40 / 42 | 131 687 / 155 912 | 70 / 150 160 | 37 | 14 | 46 / 172 000 |
| Yas Marino | 42 / 44 | 61 286 / 87 522 | 68 / 72 362 | 37 | 14 | 48 / 97 000 |

**Ce qui vaut sur tous les circuits.**
- **Ombres** : aucune (`shadowMap` coupé). Elles ne coûtent rien et il n'y a rien à baisser.
- **Effets de conduite** : fumée et étincelles +2 appels, trajectoire conseillée +1, mesuré sur chaque circuit.
- **Pluie** (`pluie_ecran`, Monzo, 20 voitures) : son coût en appels et en triangles est maintenant écrit dans la sortie de `ecrans.py`, au sec contre mouillé sur la même image.
- **Les plus gros triangles** (Monoco, Singapura, mesurés objet par objet) :
  - les immeubles : 720 à 858, 72 triangles chacun, soit 52 000 à 62 000 ;
  - le public proche : environ 1 000 × 24 = 24 000 ;
  - le public lointain : environ 5 500 × 2 = 11 000 ;
  - les rubans de la route : environ 3 300 chacun.

**Le garde-fou.** `PLAFONDS_IMAGE` dans `tests/ecrans.py` donne, pour chaque circuit, le pire mesuré + 4 appels et + 10 % de triangles. Il est vérifié sur chacune des 12 pages `tests/lieu.html?circuit=…`, c'est-à-dire dans les travaux ecrans-1 à ecrans-4. Les effets doivent rester à 3 appels au plus, et sans ombres.

## 2. Baisser les plus chers sans changer l'image : rien d'utile à faire

J'ai essayé sur les immeubles, la plus grosse part : leurs faces cachées (le dessus et le dessous des bandes de fenêtres, le dessus du mur sous le toit). J'ai capturé avant et après sur Monoco, Singapura et Montréol, et comparé pixel à pixel :
- **sans le dessus et le dessous des bandes** : −20 000 triangles sur Monoco, mais 700 à 2 000 pixels changés. C'est un liseré d'un pixel sous chaque bande vue d'en bas, et aux arêtes des immeubles (visible sur la capture de différence) ;
- **sans le seul dessus du mur** : −4 triangles par immeuble, et encore 200 pixels de toit changés.

**J'ai tout retiré** : l'ordre demandait la même image, et le gain ne valait pas un changement visible.

Le reste est déjà fait :
- tout le décor est en `InstancedMesh`, un appel par type ;
- le niveau de détail existe déjà (public et arbres en forme simple au-delà de 180 m, rien après 1 600 m) ;
- les voitures lointaines passent en forme simple, toutes en un appel ;
- il n'y a pas d'ombres.

**Mon diagnostic.** Avec 40 à 47 appels et au plus 156 000 triangles, le dessin ne sature pas la carte graphique. Ce qui coûte, ce sont les pixels : un pixel ratio de 1,5 avec antialias, soit 2,25 fois les pixels de l'écran. C'est donc ce que la qualité automatique baisse en premier.

## 3. La qualité automatique (`qualite.js`, réglages `QUALITE_*`)

**Trois crans, qui ne changent que le dessin :**

| Cran | Pixels par pixel CSS | Détail du décor | Fin du décor |
|---|---|---|---|
| Haute | 1,5 | 180 m | 1 600 m |
| Moyenne | 1 | 130 m | 1 200 m |
| Basse | 0,75 | 90 m | 900 m |

Le cran haut est exactement l'image d'avant : un test le relie à `PIXEL_RATIO_MAX`, `DECOR_DETAIL_LOIN` et `DECOR_RIEN_LOIN`. `DECOR.majDetail` reçoit les distances du cran, et `SCENE3D.reglerQualite` règle le pixel ratio.

**En « auto » (par défaut).** Si la moyenne passe sous 55 images par seconde pendant 3 s, on descend d'un cran, puis on attend une nouvelle fenêtre de 3 s entière. Rien ne se juge ni ne change pendant les feux. On ne remonte pas tout seul : pas de va-et-vient.

**Menu pause** : « Qualité : auto / haute / basse », sauvegardé. On peut aussi la forcer par `?qualite=…`.

**Sous un automate** (`navigator.webdriver`, donc les tests et GitHub), « auto » ne baisse pas seul sans `?qualite=auto`. Sinon, toutes les mesures d'images et d'appels des tests bougeraient d'un passage à l'autre.

**La physique ne change pas.** Aucun fichier de physique ni d'IA n'est touché, et un test compare au bit près une course faite avec et sans cran bas.

## Tests

**tests/test.html** (moteur : 317 ✔, 0 ✘ sur le Mac) :
- l'automate : à 60 images par seconde rien ne bouge ; à 40, un cran à 3 s puis un autre à 6 s ; pas plus bas que « basse » ; rien pendant les feux ni avant 3 s ; une moyenne au-dessus de 55 ne fait rien ; haute et basse restent fixes ; le menu ;
- le cran haut est l'image d'avant, et chaque cran dessine moins ;
- la course est identique au bit près.

**tests/ecrans.py** :
- `?qualite=auto&test=qualite`, 1280 : on retient les feux 8 s et la qualité ne bouge pas pendant ce temps. Après, elle descend jusqu'à « basse » (pixel ratio 0,75, décor à 90 m). Le menu suit auto → haute (l'image d'avant) → basse → auto, sauvegardé. Capture `qualite-basse.png`.
- `test=qualite` sans paramètre, 960 : sous un automate, rien ne bouge.
- Les 3 pages lieu essayées sur le Mac (Monoco, Suzuko, Singapura) : 25/25, garde-fous compris.

## Ce que je n'ai pas pu vérifier

**La vraie mesure des images par seconde.** Elle se fait sur une carte graphique, et elle reste à le propriétaire.

**Le seuil de l'automate.** Sous swiftshader, l'image est toujours sous 55, donc l'automate descend toujours jusqu'à « basse ». Sur un vrai ordinateur, il faudra voir s'il se déclenche trop tôt, par exemple pendant un chargement, et ajuster `QUALITE_FENETRE` ou `QUALITE_IPS_MIN`.

**Le pixel ratio à 0,75.** L'image devient un peu floue. C'est le prix du cran bas, à juger par le propriétaire.

Réévalue.
