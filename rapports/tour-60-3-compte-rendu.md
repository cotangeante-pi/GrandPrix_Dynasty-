TOUR 60 — compte rendu du Codeur 3 (le ciel, le public, l'Auto plus intelligente)
Branche : ciel-public-60 (depuis origin/main e5516e2)
Commit : c6b9ced (le code ; ce compte rendu est un commit [skip ci] de plus, après le passage vert)
Passage GitHub : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44642201901 — vert, 18/18 (le travail « annexes » a été relancé une fois : « connexion lente » des batailles en ligne, un test de temps de tests/enligne-incidents.py qui n'a rien à voir avec ce tour, vert au premier passage 44640284868 avec le même code)
Ordres : 1 fait / 2 fait / 3 fait (sauf la mesure sur un vrai téléphone, impossible ici) / 4 fait / 5 fait (voir le passage)

## Le principe (pour tout ce qui suit)
Calculé UNE fois (une texture de bruit 128×128 faite au chargement pour les nuages, l'ombre cuite dans les couleurs des sommets du
public), des shaders bon marché, AUCUN appel de dessin en plus (un de MOINS sur les circuits à nuages), pas de post-traitement.
Trois réglages dans donnees.js, chacun faux = le jeu d'avant :
- `REALISME_CIEL`, `REALISME_PUBLIC` : vérifié **au pixel près** : la copie de main d'avant et la branche avec les deux à faux
  (`tests/lieu.html?…&realisme=0`) donnent la même image (empreinte md5 du canvas) en 4 endroits de Monoco, Singapura, Spaa et du
  circuit d'essai.
- `QUALITE_FINE` : faux = l'Auto du tour 49a (les 9 tests d'avant tournent avec lui, `tQ` dans tests/test.html).

## 1. Le ciel (decor.js `cielRealiste`, scene3d.js)
- Le dôme est dessiné par un shader : dégradé horizon → haut, lueur de l'horizon du côté du soleil quand il est bas (Bahrayn, Yas
  Marino), halo + disque du soleil (dans la direction de la vraie lumière), nuages qui glissent avec le vent (2 lectures de la texture
  de bruit ; couverture = nuages du lieu, au moins `CIEL_NUAGES_MIN`, plus le ciel couvert de la météo), la nuit étoiles qui
  scintillent et lune (Singapura), et en bas un fondu dans la couleur du brouillard (le fond aussi) : le loin et le ciel se rejoignent
  sans trait. L'ambiance prend 20 % de la couleur du haut du ciel (`CIEL_AMBIANCE_TEINTE`).
- Les nuages d'avant (un InstancedMesh d'icosaèdres) ne sont plus faits : −1 appel de dessin.
- Le dôme est dessiné APRÈS les opaques (`renderOrder` 1000, test de profondeur) : le shader ne tourne que sur les pixels de ciel
  visibles (avant : toute l'image).
- La météo marche toujours (material.color = le ciel couvert de meteo3d.js ; il ajoute aussi de la couverture) ; la nuit reste sous
  `NUIT_CIEL_MAX` (test=jeudecor singapura vert).
- Le circuit d'essai (le premier circuit du joueur, sans lieu) reçoit le ciel `CIEL_TEST` : **+1 appel de dessin, sur ce circuit
  seulement** (caméra de course, 20 voitures : 40 → 41 au pire, 38 → 39 en moyenne ; triangles 58 796 → 60 398 au pire). C'est le seul ajout ; à trancher par le Chef (le mettre à faux = `REALISME_CIEL` pour ce circuit
  seulement demanderait un réglage de plus).
- Captures (relues) : `rapports/captures-tour60/ciel-<circuit>-derriere-avant|apres.jpg` (Monoco, Singapura, circuit d'essai) et
  `ciel-<circuit>-soleil-avant|apres.jpg` (Yas Marino au couchant, Spaa couvert, Monoco), caméra tournée vers le soleil.
  Ce que je vois : Yas Marino est le plus beau (soleil bas, halo orange, voiles éclairés) ; Singapura a ses étoiles et des nuages sombres ;
  Spaa est un vrai ciel couvert en lambeaux ; Monoco et le circuit d'essai ont quelques cumulus. Défaut connu : le disque du soleil est
  un peu ovale quand la caméra est très ouverte (déformation de la perspective, comme toute chose au bord de l'image).

## 2. Le public (decor.js `publicRealiste`, `animerPublic`, `animer`)
- Un spectateur : jambes (pantalon tiré dans `PUBLIC_PANTALONS`), torse (les couleurs d'avant : écuries, et le pays au Grand Prix à
  domicile, inchangées), deux bras, tête (peau, `PUBLIC_PEAUX`), cheveux ou casquette ; 7 % agitent un drapeau, 5 % tiennent une
  pancarte. ~44 triangles (avant 20), seulement les faces vues de la piste.
- Tout bouge dans le SHADER DES SOMMETS (instancing ; chacun tire ses traits de sa place, aucun calcul par spectateur en JS) : bras
  levés et sauts quand une des 4 voitures les plus proches de la caméra passe à moins de 14–55 m, la ola toutes les 45 s (16 s), le
  drapeau qui flotte. Par image, le JS n'écrit que 6 nombres (temps, ola, 4 voitures).
- De loin (au-delà de 45 m, `PUBLIC_DETAIL_REALISTE`) : un imposteur = la carte plate d'avant, dont le shader des fragments dessine la
  silhouette (tête, torse, jambes, bras levés, drapeau, pancarte). Toujours 2 maillages pour tout le public : 0 appel de plus (testé).
- Le temps des shaders n'avance que par la boucle (`SCENE3D.avancer(dt)` dans principal.js) : deux dessins sans image entre eux
  restent identiques au pixel près (le test « au sec, pas un pixel ne change » de la météo en dépend ; vert).
- Captures : `public-<circuit>-tribune-avant|apres.jpg` (Monoco, Singapura, Yas Marino ; voitures tout près : bras levés, sauts) et
  `public-monoco-tribune-calme-apres.jpg` (voitures loin : le public calme). Défaut : la hampe du drapeau est fine, de loin on voit
  surtout le carré de couleur.

## 3. L'Auto plus intelligente (qualite.js, `QUALITE_FINE`)
Le principe d'avant est gardé (sous 55 images/s, un pas toutes les 0,5 s jusqu'à 58 ; retour lent, 3 s, repris aussitôt s'il fait
rechuter et bloqué 90 s doublé ; rien pendant les feux ; niveau gardé). Ce qui change :
- **Deux axes** : le contenu (`QUALITE_PAS_FIN`, les pas d'avant sans les pixels, + le pas `{ ciel: 0 }`) et les pixels
  (`QUALITE_RESOLUTIONS` 1,5 → 0,6 par 0,1 : la résolution dynamique fine).
- **Selon ce qui coûte vraiment** : le temps de la carte graphique est MESURÉ quand le navigateur le permet
  (`EXT_disjoint_timer_query_webgl2`, scene3d.js, une requête autour du dessin, lue quelques images plus tard : `SCENE3D.tempsGpu`), sinon
  déduit (le calcul JS prend moins de 80 % de l'image → la carte graphique limite). Carte graphique : d'abord les pixels « doux »
  (≥ 1, à peine visibles sur un écran dense de téléphone), puis le contenu, puis les pixels sous 1. Calcul : le contenu d'abord (baisser
  les pixels n'y ferait rien). Le retour : le plus visible d'abord (pixels sous 1, contenu, pixels doux), seulement si le calcul ET la
  carte graphique ont de la marge (avant : le calcul seul, d'où des essais ratés sur une carte graphique lente).
- **Départ mesuré** : la première fois (aucun niveau gardé), `SCENE3D.essaiDessin` dessine et attend 4 images de la grille au
  chargement (après une image qui compile les shaders), `QUALITE.depart` choisit le niveau de départ dans l'ordre de la descente ; gardé
  (`qualite_niveau`, `qualite_res`). Jamais sous un automate sans ?qualite=auto (les tests et premier.py ne bougent pas).
- **Ajouter un pas (pour le Codeur 2)** : une ligne `{ cle: valeur }` dans `QUALITE_PAS_FIN` (donnees.js), à sa place du moins
  visible au plus visible (par exemple après `{ effets: 0.25 }`), sa valeur du plus beau dans `QUALITE_PLUS_BEAU_FIN` (ex.
  `{ ciel: 1, route: 1 }`), et le dessin lit `SCENE3D.qualite.<cle>` (null = le plus beau ; voir `DECOR.animer` pour `ciel`). Le test
  « qualité fine : les niveaux… » vérifie que chaque pas simplifie (valeur plus petite) et ne touche pas aux pixels. S'il veut aussi
  l'Auto d'avant, la même ligne dans `QUALITE_PAS` et sa clé dans `FAM` du test « l'ordre des pas ».

## Sortie des tests (Mac, sous le verrou, seulement la partie concernée)
- `tests/test.html?filtre=qualité` (Chrome) : 18/18 (dont « la course ne bouge pas d'un bit » en Auto fine) ; `filtre=décor` 6/6 ; aussi par osascript : 14/14 (les 9 d'avant en `QUALITE_FINE` faux + 5 fins ; le
  test « course au bit près » fin tourne seulement dans Chrome).
- `ECRANS_PAGES=tests/lieu.html` : 187/187 (les 12 décors, plafonds `PLAFONDS_IMAGE` tenus, + 2 pages nouvelles : `test=realisme`
  et `realisme=0`) ; `test=jeudecor` 20/20 (la nuit de Singapura reste sombre) ; `test=pluie` 20/20 (au sec, pas un pixel ne change) ;
  `test=qualite` 19/19 (l'Auto fine va au plus simple sous swiftshader, jamais pendant les feux) ; `test=retro` 36/36.
- Course identique au bit près : test « qualité fine : la course ne bouge pas d'un bit » (le dessin ne touche à rien d'autre).
- Un test de pixels cassé parce que l'image a changé exprès : aucun (il n'y a pas de référence d'image ; les seuils de nuit tiennent).
- Un test changé exprès : `test=decor` « à l'échelle : un spectateur fait entre 1,1 et 1,9 m » mesurait la boîte de la géométrie,
  qui contient maintenant le drapeau et la pancarte tenus au-dessus de la tête (2,0 à 2,4 m) : il mesure le corps (parties 0 à 5).
  Vu au premier passage GitHub (44640284868, ecrans-5 : 565/566), corrigé, 13/13 sur le Mac.

## Mesures
Coûts (`tests/lieu.html` → `__couts`, caméra de course, 20 voitures, 12 endroits du tour, swiftshader 1280×720), avant → après :
| circuit | appels au pire | appels moy. | triangles au pire | triangles moy. | plafond triangles |
|---|---|---|---|---|---|
| Monoco | 45 → 44 | 42 → 41 | 95 770 → 99 946 | 81 592 → 80 026 | 169 000 |
| Spaa | 43 → 42 | 39 → 38 | 88 712 → 85 058 | 75 934 → 71 047 | 98 000 |
| Singapura | 44 → 44 | 41 → 41 | 96 344 → 102 056 | 85 290 → 83 736 | 106 000 |
| Yas Marino | 46 → 45 | 42 → 42 | 65 574 → 66 874 | 57 604 → 56 282 | 97 000 |
| circuit d'essai | 40 → 41 | 38 → 39 | 58 796 → 60 398 | 49 217 → 49 311 | (aucun) |
Les 12 tracés sont sous leurs plafonds (Singapura est le plus près : 102 056 / 106 000 ; une première version à 54 m de détail
dépassait, 107 226 : j'ai rapproché les imposteurs à 45 m et retiré des faces cachées). Programmes : 17–18 (comme avant, +1 à
Singapura et Yas : le ciel). Mémoire : une texture de 64 Ko (128×128 RGBA) + mipmaps ; la géométrie d'un spectateur 132 sommets.
Images par seconde (`tests/perf.py`, vraie carte graphique Intel Iris du Mac, 20 IA, Mac très chargé par les 4 Codeurs : charge 4 à 12,
donc relatif) : Monoco 65,6 → 67,1 ; Bahrayn 68,2 / 58,7 / 66,0 avant contre 51,5 / 64,8 / 67,7 après ; Singapura 56,8 / 68,3 avant
contre 66,4 / 68,1 après. Le dessin seul (course en pause) : Monoco 68,6 → 70,3 ; Bahrayn 70,1 / 76,0 → 76,2 / 76,0. Pas d'écart au-delà
du bruit (un passage à 51,5 avec une charge de 5,9 ; refait deux fois : 64,8 et 67,7).
Téléphone lent simulé (le modèle de tests/test.html, deux coûts : calcul 2,5 ms × 4/6/8 et carte graphique de téléphone 26 ms au plus
beau, écran 2,75 pixels par pixel CSS, le temps de la carte graphique mesuré) — Auto d'avant / Auto fine, au niveau où chacune se pose :
- 4× : avant 100 % du contenu retiré, pixels 1,35, 60 i/s ; fine 0 % retiré, pixels 1,2, 60 i/s ;
- 6× : avant 100 %, 1,35, 60 i/s ; fine 0 %, 1,2, 60 i/s ;
- 8× : avant 100 %, 1,35, 60 i/s ; fine 46 %, 1,3, 59,4 i/s.
Sans mesure de la carte graphique (déduite), 4× et 6× gardent aussi tout le contenu (pixels 1,2 ; à 4× un essai de retour toutes les
90 s, le mécanisme d'avant). Le modèle est un modèle : seul un vrai téléphone dira les vrais chiffres.

## Ce que je n'ai pas pu vérifier
- Un vrai téléphone (les images/s, le temps de la carte graphique : `EXT_disjoint_timer_query_webgl2` n'existe pas sous swiftshader ;
  le code s'en passe). `tests/telephone-lent.py` n'a pas été relancé : sur le Mac, il ne prouve rien (CLAUDE.md, tour 55).
- Le départ mesuré dans un vrai premier lancement (il ne tourne pas sous un automate) ; sous swiftshader il choisirait le plus simple.
- La beauté en mouvement (la ola, les sauts) : vue seulement en captures à deux instants ; à essayer par le propriétaire.
- La fusion avec la branche du Codeur 2 (realisme-60) : nos blocs de donnees.js sont à des endroits différents ; ses pas de l'Auto
  vont dans `QUALITE_PAS_FIN` (voir 3).

Réévalue.
