TOUR 60 — relecture du code (Codeur 6) — compte rendu
Branche : relecture-60 (depuis origin/main 4f710c4)
Début : 2026-11-20, 03h54 (heure du Mac). Fin : 05h56.
Commits : 0cdcc53 (lot 1), e1651d6 (lot 2, vert 18/18 : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44712616752), 23b9199 (lot 3), 47fb7fc (lot 4, vert 18/18 : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44716914058), bd8a521 (lot 5) ; ce compte rendu vient par-dessus avec [skip ci].
Passage GitHub vert du dernier code (bd8a521, 18/18) : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44719532307

Ordres : 1 fait / 2 fait / 3 fait / 4 fait / 5 fait / relecture : faite (voir plus bas)

## Les 5 points connus du Chef

### 1. La marge des tests d'écran sur GitHub
- Ce qui se passait : `tests/ecrans-durees.json` datait du tour 51m. Des pages avaient beaucoup grossi (`test=tactile-decouverte`
  300 → 357 à 410 s, `test=manette` 143 → 221 s, `test=tactile` en 960 75 → 170 s). Le glouton les croyait courtes : la tranche 1
  (et la 2) recevait trop. Mesuré sur 4 passages (44647222768, 44650769380, 44660259168, 44662324950) : ecrans-1 841 à 845 s,
  ecrans-2 815 à 859 s, quand ecrans-3/4/5 tournaient à 393-550 s. Au total, environ 3 900 s de pages : à 6 tranches, même bien
  réparties, c'est 650 s chacune, et jusqu'à 730 s sur une machine lente. 25 % de marge sur 900 s demande 675 s au plus.
- Correction : `tests/ecrans-durees.json` refait avec la plus longue durée de chaque page sur ces 4 passages (198 pages) ;
  **8 tranches** au lieu de 6 (`.github/workflows/tests.yml`) : ecrans-1 à ecrans-6 = 1/8 à 6/8, et **les tranches 7/8 et 8/8
  tournent dans les travaux `meteo` et `stands`** (les plus courts : 256 à 460 s), donc toujours **18 travaux**. Aucun test retiré.
- Mesuré sur le passage 44709257749 (lot 1) : ecrans.py prend 588, 566, 528, 458, 435, 564, 412 (dans meteo) et 460 s (dans stands)
  pour 548 s prévues chacune ; sur 44716914058 (lot 4) : 598, 420, 456, 583, 425, 460, 355 et 410 s. Le pire, 598 s, laisse **33 % de
  marge** sur 900 s. Les travaux meteo et stands durent 676 et 856 s
  au total (limite de GitHub : 30 min) ; le passage n'est pas plus long : annexes reste le travail le plus long (837 s).
- CLAUDE.md (« Aller plus vite ») et le commentaire de tests/lancer.py le disent.

### 2. Le test intermittent de la qualité
- Cause trouvée en jouant la page sous le verrou (un relevé de chaque image où `SCENE3D.joueurSimplifie` est vrai) : pendant le
  **survol de la grille avant les feux**, la caméra est à 45-62 m de la voiture du joueur. `scene3d.js` (`lointaines`) dessine
  alors la voiture du joueur en forme simple, **par la distance, avec `VOITURE_LOIN`, quelle que soit la qualité** (c'est voulu :
  l'Auto ne touche jamais au seuil du joueur). Or les menus d'avant ont déjà simplifié l'Auto (niveau 13 à 15 sous swiftshader) et le
  test comptait **toutes** les images depuis le chargement, avant même de remettre l'Auto au plus beau. Une image de survol (selon le
  moment où la carte des IA est prête) suffisait : `joueur: 1`. Ce n'est pas un défaut du jeu : rien dans qualite.js, l'Auto fine ou
  les pas `ombresContact` / `reflets` ne simplifie la voiture du joueur.
- Correction (tests/ecrans.py, `qualite_ecran`) : une image ne compte que si la voiture du joueur est **plus près de la caméra que
  `VOITURE_LOIN`** (le seuil du joueur) et quand même simplifiée. Vert sur le Mac (10/10) et sur GitHub.

### 3. L'ombre sous la pluie (REALISME_ROUTE)
- Ce qui se passait : l'ombre de contact (scene3d.js `creerOmbres`) est noire et transparente : seule, elle ne peut qu'assombrir.
  La tache claire venait de **la gerbe** (meteo3d.js) : une sphère claire (0xe6ecf2, 26 %) de 3,2 m de rayon, posée 3,4 m derrière
  la voiture, dont le bas passait **sous** la route : (a) elle recouvrait l'arrière de l'ombre (les deux sont transparentes ; l'ombre,
  `renderOrder` −1, était dessinée **avant** la gerbe, qui l'éclaircissait) ; (b) la route la coupait d'une ellipse nette, qu'on lit
  comme une ombre claire. La capture « avant » du Codeur 2 montre déjà la même tache : la route plus sombre du réalisme la fait ressortir.
- Correction, derrière `GERBE_OMBRE` (donnees.js, vrai ; faux = l'image d'avant) : les gerbes sont dessinées **avant** l'ombre
  (`renderOrder` −2 contre −1) : l'ombre passe par-dessus et assombrit toujours (au lot 1, c'était l'ombre qui passait à 1 ; corrigé au
  lot 3 : elle serait passée aussi après le fantôme transparent de la qualification, qui n'écrit pas la profondeur, et l'aurait assombri) ; la gerbe est **posée sur la route** (son bas touche le sol, plus d'ellipse coupée) et
  **douce sur ses bords** (son opacité baisse vers les bords vus de biais, dans son shader : même appel de dessin).
- Capture : `rapports/captures-tour60/relecture-gerbe-douce-monzo-pluie-1280.jpg` (à comparer à `voitures-route-apres-monzo-pluie-1280.jpg`).
- Test : `tests/ecrans.py` `test=pluie` (1280) : l'ombre après les gerbes, le bas des gerbes au-dessus du sol, la gerbe douce. 22/22 sur le Mac (avec le test de `GERBE_CAMERA2`).

### 4. Le secours de l'auto-guidage et les records
- Ce que faisait « Espace » : rien de spécial pour les records ; il coûte du temps (la voiture repart de l'arrêt), donc le tour est
  lent. Le secours, lui, relance à la vitesse d'avant : un tour avec un secours pouvait devenir le record du circuit et le fantôme
  (qualification, course seule), le code « Défier un ami » et le temps d'un défi.
- Trouvé en route : **un tour avec un avertissement de limites de piste devenait quand même le record et le fantôme en qualification
  et en course seule**, alors que CLAUDE.md (tour 56) dit le contraire. Causes : `qualification.js` ne regardait que `t.coupe` ;
  `course.js finirTour` n'écarte `tour.limites` que pour la voiture « surveillée » (celle des feux), ce qui n'est pas le cas en course
  seule ; et le drapeau `limitesTour` d'un débordement **avant** la ligne (le tour de lancement) restait sur le tour chronométré.
- Correction, derrière `RECORD_PROPRE` (vrai ; faux = avant) :
  - principal.js `secoursJoueur` marque le tour (`c.secoursTour`) quand la voiture est vraiment relancée ; course.js le range dans le
    tour (`tour.secours`), qui n'est jamais le meilleur tour ;
  - qualification.js : `q.propre` (ni coupé, ni limites, ni secours) ; le temps reste valable pour la grille (`q.valide`) ; le
    drapeau des limites et du secours est remis à zéro au passage de la ligne ;
  - le record et le fantôme du circuit (`finirFantome`), le lien « Défier un ami » de la qualification et du tournoi ne partent que
    d'un tour propre ; la course seule propose au record `meilleurTourPropre(c)` ; le défi de la course seule (`noterFantomeSeul`)
    écarte aussi `t.secours` ;
  - au défi du fantôme, un tour relancé par le secours n'a pas de temps : « L'auto-guidage t'a remis en piste : pas de temps. »
    (`defiSecours`, fr et en) ; les limites y comptent comme avant.
  - `JEU.secoursGuidage` (le compteur) reste ; il n'est toujours lu par rien d'autre.
- Le fantôme du poleman (fantome-pole.js, qui passe aussi par `QUALIFICATION.pas`) ne change pas : il ne lit que `coupe`.
- Tests : `tests/limites.html` (15/15) : un tour de qualification avec un avertissement, avec un secours, avec un avertissement
  avant la ligne, `RECORD_PROPRE` faux ; un tour relancé n'est jamais le meilleur tour ; la course seule ne propose pas un tour
  avec un avertissement ; `tests/textes.html` 2584/2584.

### 5. Les écarts de doc de CLAUDE.md
- Le téléphone debout : `PORTRAIT_TOURNER` (vrai) tourne le jeu, sans message ni pause ; l'ancien message est décrit comme le « faux ».
- `FANTOME_POLE.tour(e)` (e : la course), au lieu de `tour(plateau)`.
- Le paragraphe du fantôme du poleman en double : le premier (sans le T11) est enlevé.
- Une ligne sur `BAVARDAGE_THEMES` dans « Les discussions avec les pilotes et les écuries ».
- En plus : les 8 tranches (« Aller plus vite »), `RECORD_PROPRE` (« Le fantôme du meilleur tour »), `GUIDAGE_STANDS_RAMPES` (le téléphone),
  `GERBE_OMBRE` et `GERBE_CAMERA2` (« La météo »).

## Les erreurs trouvées en relisant et en jouant

1. **assistance.js:107 (`droiture`) : l'auto-guidage ne marchait jamais sur la ligne droite des stands.** La zone « rien près des
   stands » allait de 200 m avant l'entrée de la voie **jusqu'à sa sortie** : toute la ligne droite des stands, souvent la plus longue
   du circuit, celle où l'on zigzague le plus. Vu en jouant au doigt dans la vraie page (faux volant, faux doigts) : zigzag de ±22° à
   165 km/h sur la ligne de départ du circuit d'essai, `droiture` 0, aucun guidage. Entre les deux rampes, un muret sépare la piste de
   la voie (physique.js) : on n'y tourne pas pour entrer ni sortir. Correction derrière `GUIDAGE_STANDS_RAMPES` (vrai ; faux = avant) :
   rien de 200 m avant l'entrée jusqu'au bout de la rampe d'entrée (`STAND_RAMPE`), ni dans la rampe de sortie ; entre les deux, le
   guidage marche. Rejoué : `droiture` 1, guidage allumé (`allume` 1), la bulle d'aide vue, console vide. Test : `tests/guidage.html`
   21/21 (au milieu de la voie : droiture 1, comme sans stands ; faux : 0). Le clavier n'est pas touché (le guidage est seulement au
   volant d'un écran tactile).
2. **Le record en qualification et en course seule prenait un tour avec un avertissement de limites** (voir le point 4).
3. **tests/recoins.py:370 (manette à deux) : un test qui échouait au hasard** sur le passage 44709257749 (`[[1, 1], [0, 1], [0, 0]]` :
   la manette est lue à chaque image, et à deux sous swiftshader une image peut dépasser les 500 ms attendues). Il attend maintenant
   l'état voulu (8 s au plus), comme son voisin du tour 49b. Rien à corriger dans le jeu.
4. **Mon propre lot 1 (scene3d.js, l'ombre à `renderOrder` 1)** : l'ombre passait après **tous** les objets transparents, dont le
   fantôme de la qualification (transparent, sans écriture de profondeur) : elle l'aurait assombri là où il passe devant. Corrigé au
   lot 3 : l'ombre reste à −1, ce sont les gerbes qui passent avant (−2).
5. **meteo3d.js:150 (les gerbes, à deux) : la gerbe de la voiture du joueur 2 remplissait le bas de sa moitié d'écran.** Une gerbe
   n'est pas dessinée à moins de `GERBE_CAMERA_MIN` (12 m) de la caméra, pour ne pas passer devant l'objectif ; mais seule la caméra
   du joueur 1 était regardée (`METEO3D.maj` ne recevait qu'elle). Dès que les deux joueurs sont à plus de 12 m l'un de l'autre, la
   gerbe du joueur 2 (3,2 m de rayon, 3,4 m derrière sa voiture) était juste devant sa caméra (7,5 m derrière). Correction derrière
   `GERBE_CAMERA2` (vrai ; faux = avant) : `METEO3D.maj` reçoit aussi la caméra 2 à l'écran partagé et l'écarte de même. Test :
   `tests/ecrans.py` `test=pluie` (une caméra 2 posée derrière une voiture loin de la caméra 1 : 17 gerbes dont 3 près d'elle, puis 14 et 0).
   Pas corrigé (noté) : les gouttes de pluie ne tombent qu'autour de la caméra 1 (`PLUIE_BOITE`, 45 m) ; le joueur 2 loin du joueur 1
   ne voit pas de gouttes. Les doubler coûterait un appel de dessin et 2 400 gouttes de plus : à décider.
6. **principal.js `finirFantome` / interface.js `remplirQualif` (suite de mon point 4)** : avec `RECORD_PROPRE`, un tour plus rapide que
   le record mais pas propre n'est pas le record ; l'écran aurait écrit l'écart négatif « +-0,42 s du record ». Il dit maintenant
   « Plus vite, mais pas de record : limites de piste ou auto-guidage. » (`fantomeHorsRecord`, fr et en). Test : `tests/limites.html` 15/15.

## Ce que j'ai relu ou joué sans rien trouver
- **Le code neuf du tour 60** : bavardage.js (le choix du thème, les ponts, les thèmes sensibles, la mémoire `dernierJ` : 140
  caractères au plus par pilote), discussion.js, route3d.js (ligne idéale, freinages, graviers, shaders, la pluie), voiture3d.js
  (formes, lumière cuite, reflets, roues ; `majDegats` et `majHalo` libèrent l'ancienne géométrie), decor.js (ciel, public, `animer`,
  `majDetail` avec la densité), scene3d.js (ombres, Auto fine, `essaiDessin`, temps de la carte graphique), qualite.js (les deux
  Autos, `depart`), assistance.js (`guider`, `secours`, `relancer`, `placeLibre` : le recul derrière la ligne ne donne ni tour ni
  avance), tactile.js, principal.js (branchements).
- **Les réglages « faux = avant »** du tour 60 et les miens : `REALISME_*`, `QUALITE_FINE`, `TACTILE_GUIDAGE*`, `BAVARDAGE_THEMES`,
  `GERBE_OMBRE`, `GERBE_CAMERA2`, `RECORD_PROPRE`, `GUIDAGE_STANDS_RAMPES` : chaque nouveau chemin est sous son réglage ; `course.js` ne crée
  `secoursTour` que si un secours a eu lieu (les objets de course d'avant restent identiques). La physique et les courses entre IA ne
  changent pas (aucun de mes changements n'est dans la physique, les IA ou la simulation ; moteur et courses verts sur GitHub).
- **Écouteurs ajoutés deux fois** : un relevé de chaque `addEventListener` (élément, type, endroit du code) en parcourant le paddock
  trois fois (les 6 pages, puis les boutons de chaque page) : aucun doublon.
- **Mémoire** : `renderer.info.memory` en rejouant 4 fois la même course dans la même page (circuit d'essai ; Singapura de nuit sous la
  pluie) : 34 géométries / 7 textures / 16 programmes, puis 35 / 7 / 19, **stables** d'une course à l'autre. Les Grands Prix de la
  carrière rechargent la page : rien ne s'accumule entre eux.
- **Le secours dans la vraie page** (au doigt, faux volant, circuit d'essai, course seule d'un tour) : la voiture mise de travers à
  164 km/h sur la ligne droite est relancée sur la piste à 165 km/h, sa vitesse d'avant (`JEU.secoursGuidage` 1), le tour est marqué `secours`, le robot
  finit le tour : `meilleurTour` null, aucun record écrit ; console vide.
- **Le départ de l'Auto fine hors automate** (le premier lancement d'un vrai joueur : `navigator.webdriver` faux, jamais joué par les
  tests) : en 1280×720 l'essai mesure 415 ms par image (swiftshader) et part au plus simple (niveau 15, pixels 0,6), gardé dans la
  sauvegarde ; rechargé, plus d'essai ; la course de découverte démarre ; en 640×360 pareil (230 ms) ; console vide. L'essai coûte
  environ 2 s au premier chargement sous swiftshader (5 images de 415 ms ; le titre est venu en 4,9 s) : voir « Ce qui reste ».
- **Console** : toutes les pages jouées : pluie à Monzo (1280, 960), qualité auto, le paddock trois fois, la course au doigt et au
  volant (circuit d'essai), Singapura de nuit sous la pluie avec 20 voitures en anglais, Monoco en vue cockpit, Suzuko au téléphone
  (844×390, anglais), Spaa sous une averse en qualité basse, à deux à Interlagas sous la pluie, la course rejouée 4 fois : console vide.

## Ce qui reste ou n'a pas été vérifié
- Le **tournoi chrono** : un tour relancé par le secours y garde son temps (seul le lien « Défier un ami » est retenu). Entre copains,
  un joueur au téléphone peut donc éviter la perte de temps d'une sortie. À trancher par le Chef ou le propriétaire.
- `SCENE3D.essaiDessin` (Auto fine, premier lancement seulement) dessine 5 images au chargement (environ 2 s sous swiftshader,
  mesuré ci-dessus) et laisse la dernière (la vue d'essai de la grille) sur le canvas jusqu'à l'image suivante. Pas un défaut, mais
  « En piste en 10 secondes » ne le mesure pas (premier.py tourne sous automate, sans essai) : à mesurer sur une vraie machine lente.
- Le secours sous la VSC relance à la vitesse d'avant (bornée par la voiture de devant) : le limiteur de la VSC freine ensuite, sans
  pénalité ; pas testé dans la vraie page.
- Jamais sur un vrai téléphone ni une vraie carte graphique faible.

Fin : 2026-11-20, 05h56. Réévalue.
