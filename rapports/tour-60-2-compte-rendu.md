TOUR 60 — compte rendu du Codeur 2 (le réalisme des voitures et de la route)
Commit : 1dc4eb1 (branche `realisme-60`, origin/main 5686b89 fusionné dedans : ciel, public, Auto fine du Codeur 3)
Passage GitHub : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44660259168 — vert 18/18 (1dc4eb1)

Ordres : 1 fait / 2 fait / 3 fait (images/s : dans le bruit sur la vraie carte ; sous SwiftShader +8 %, voir plus bas) / 4 fait / 5 fait

Le principe (celui du Chef) : **calculer une fois, dessiner bon marché**. Tout ce qui coûte est fait au chargement ; le dessin
reste une passe ; **+1 appel de dessin en tout** (aucun par voiture) ; chaque ajout se retire par un uniform (aucun shader
recompilé) dans les pas de l'Auto, avant les pixels. `REALISME_VOITURES` et `REALISME_ROUTE` faux = l'image d'avant **au pixel
près** (vérifié avant la fusion : les images de lieu.html, derrière, cockpit, de près et télé, à Monzo et Singapura, ont la même
empreinte md5 que celles de main avec les deux réglages faux, et `__couts` donne les mêmes appels, triangles, matériaux et
programmes).

1. Les voitures (voiture3d.js)
   - **Les formes** : les mêmes boîtes, effilées (`VOITURE_FORMES`) : nez fin et relevé dessous, capot moteur qui descend vers
     l'arrière, pontons en « bouteille de coca », coque plus étroite devant. Les mêmes triangles, des sommets déplacés.
   - **La lumière cuite** dans les couleurs des sommets (`VOITURE_AO`) : le bas et les faces vers le sol plus sombres.
   - **Peinture brillante, carbone mat** : la brillance de chaque matière dans un attribut des sommets (`VOITURE_BRILLANCE`), lue
     par un Phong (la tache du soleil) et par **le reflet d'une carte d'environnement figée** : 6 faces de 32² pixels dessinées
     une fois par circuit d'après son ciel (`refletsDuLieu` : dégradé du ciel, ligne d'arbres et de tribunes sur l'horizon, sol au
     loin, asphalte dessous ; la nuit, des lumières sur l'horizon), avec l'effet de Fresnel (`REFLET_FORCE`). Trouvé en route :
     l'`envMap` de Three.js r152 assombrissait tout le Phong ; la carte est un `samplerCube` à nous.
   - **Pneus et jantes** : une texture de 256×128 faite une fois (flanc, bande jaune, marques, jante à 10 rayons, écrou), un
     cylindre de 18 côtés (14 avant) ; la jante tourne avec la roue.
   - **Halo** plus rond, **ailerons détaillés** pour toutes (2e volet avant, volet arrière, lame basse, aileron de requin, bouches
     des pontons, rétroviseurs).
   - **L'ombre de contact** : une tache douce (canvas 64²) sous chaque voiture, toutes en **un InstancedMesh = +1 appel**.
2. La route (route3d.js, nouveau ; scene3d.js, meteo3d.js)
   - **L'asphalte** : une texture de 128² faite une fois (grain fin répété tous les 2,5 m, stries) ; les taches d'usure sont une
     valeur douce par sommet (aucune lecture de texture).
   - **La gomme** : la ligne idéale calculée une fois (lissage élastique, calcul pur, sans rapport avec les IA ni la course) ; la
     trajectoire 40 % plus sombre, fondue sur 2,6 m.
   - **Les traces de freinage** : vitesse de passage estimée des virages, puis décélération en remontant la piste : 12 à 35 % du
     tour selon le circuit ; deux traces striées à la voie des roues avant les virages (lues seulement là où il y a des traces).
   - **Les bords** poussiéreux hors trajectoire ; **les bas-côtés** (herbe usée, terre ; en ville, le sol assombri) et **les bacs à
     gravier** à l'extérieur des virages serrés, fondus dans le sol ; **dans le maillage de la route** (aucun appel de plus), un
     morceau tous les 6 m, jamais dans la voie des stands. (Un grain sur toute l'herbe du sol est écrit mais éteint,
     `ROUTE_HERBE_GRAIN` : 2 lectures de texture sur tout le sol, trop cher pour ce qu'il montre.)
   - **La pluie** : la route plus sombre qui reflète le ciel du moment (Fresnel), la trajectoire plus sèche dans le shader
     (meteo3d.js ne change plus de matériau et ne crée plus son ruban sous `REALISME_ROUTE` ; faux = comme avant).
3. L'Auto (qualite.js, donnees.js) : deux pas, après le rétroviseur et avant les pixels : `{ ombresContact: false }` puis
   `{ reflets: false }` (reflets des voitures, et la route sans aucune lecture de texture : ni grain, ni taches, ni traces, ni
   bords). Dans `QUALITE_PAS` (Auto d'avant) ET dans `QUALITE_PAS_FIN` (Auto fine du Codeur 3) ; un pas dont le réalisme est éteint
   n'existe pas (`realisme: [...]` filtré dans `niveaux` et `niveauxFin`). Leur valeur du plus beau (vrai) est dans `plusBeau`.
   **Rendu en logiciel** (`REALISME_LOGICIEL_LEGER`, `SCENE3D.rendusLogiciel`, d'après `WEBGL_debug_renderer_info` :
   SwiftShader, llvmpipe) : la carte graphique bloquée par le navigateur (des ordinateurs d'école, et les tests sur GitHub) ;
   réalisme léger d'office : sans reflets ni grain, sans bas-côtés, voitures en Lambert (les formes, la lumière cuite, les pneus,
   la gomme et les ombres restent).
4. Captures avant/après dans `rapports/captures-tour60/` (préfixe `voitures-route-`, JPEG) : Monzo, Monoco, Singapura (nuit),
   derrière, cockpit, télé en 1280×720 et 844×390, de près en 1280 ; Monzo dans le jeu sous la pluie et au sec ; la chicane de Monzo
   vue du dessus. **Prises avant la fusion et avant le mode logiciel**, sous SwiftShader avec le réalisme entier (le réglage
   n'existait pas encore) : c'est ce qu'on voit sur une vraie carte graphique. Relues : les voitures ont du volume (dessous sombre,
   reflet du ciel dessus, pneus et jantes vrais), la route n'est plus un aplat (gomme et traces très visibles à Monoco, plus
   discrètes sur les longues lignes droites), les bords se fondent, des bacs à gravier aux virages. Limites : les voitures restent
   des boîtes effilées ; sous la pluie, la route reflète un ciel gris uni (plus de tache de soleil comme avant).

Sortie des tests (sur le Mac, sous le verrou, la partie concernée) :
- tests/test.html?filtre=qualit : 18/18 après la fusion (Auto d'avant et Auto fine ; téléphones lents, course au bit près).
- tests/test.html?filtre=route r : 3/3 (nouveau test « route réaliste » : 14 circuits, ligne dans la piste, freinages avant le
  virage le plus serré, bacs à gravier, même calcul deux fois, pas de l'Auto absents quand le réalisme est éteint).
- tests/ecrans.py (pages concernées) : `test=tele` à Monoco 11/11 ; la pluie accepte la route réaliste (`ROUTE3D.eau`) ; le test
  des dégâts attend l'image suivante (10 s au plus) au lieu de 0,8 s fixe ; `PLAFONDS_IMAGE` de Singapura relevé 106 000 →
  112 000 triangles (le public du Codeur 3 + les bas-côtés : 105 992 mesuré après la fusion).
- `test=manette` (une fausse manette pilote un tour, une commande par image) échoue sur le Mac **aussi sur main** (259 s, aucun
  tour) : il dépend du temps d'image sous SwiftShader ; sur GitHub il passe sur main.
- Passages GitHub : 2577b6b rouge (ecrans-1 > 900 s, dégâts), 845a378 **vert 18/18** (44646286680, avant la fusion), 64f3e4c
  (fusion) rouge et ab86ae2 rouge (ecrans-2 > 900 s : la tranche de `test=manette`, trop lente avec le réalisme entier sous
  SwiftShader) → d'où le mode logiciel ; 1dc4eb1 : voir le lien en tête.

Mesures :
- `__couts` (tests/lieu.html, 20 voitures, caméra de course, pire), avant (main e5516e2) → après (mon travail seul, réalisme
  entier) : monoco 45 / 95 770 → 46 / 99 770 ; silverstoun 42 / 96 688 → 43 / 103 000 ; monzo 44 / 74 252 → 45 / 80 496 ; spaa
  43 / 88 712 → 44 / 96 328 ; suzuko 46 / 102 840 → 47 / 109 776 ; interlagas 43 / 92 654 → 44 / 97 778 ; montreol 46 / 77 678 →
  47 / 82 774 ; melbourn 46 / 76 636 → 47 / 82 636 ; barcelana 42 / 74 920 → 43 / 80 328 ; bahrayn 43 / 68 780 → 44 / 74 968 ;
  singapura 44 / 96 344 → 45 / 102 024 ; yasmarino 46 / 65 574 → 47 / 71 622 (bas-côtés alors tous les 4 m). **+1 appel partout.**
  Après la fusion (public du Codeur 3 compris, bas-côtés tous les 6 m, pneus à 18 côtés) : silverstoun 42 / 96 582, monzo
  44 / 83 284, spaa 43 / 90 286, suzuko 45 / 103 998, interlagas 43 / 91 890, montreol 46 / 85 250, bahrayn 43 / 72 666, singapura
  45 / 105 992, yasmarino 46 / 71 058 : tous sous leurs plafonds.
- Mémoire ajoutée : grain 64 Ko, carte d'environnement 24 Ko, pneus 128 Ko (+ mipmaps) ; un attribut de 5 flottants par sommet de
  route, d'un flottant par sommet de voiture.
- Images/s, vraie carte graphique (`tests/perf.py`, 20 IA, vue derrière, Intel Iris, Mac chargé à 5–13, deux passages alternés
  avant / après, avant la fusion) : Monoco 55,9 et 66,7 avant, 65,2 et 61,3 après (dessin seul 64,5 / 72,0 avant, 69,6 / 63,4
  après) ; Bahrayn 67,1 et 69,2 avant, 66,3 et 67,4 après (dessin seul 73,5 / 71,6 avant, 70,1 / 71,3 après) ; pire 1 % 17 à 25 des
  deux côtés. **L'écart avant / après est plus petit que l'écart entre deux passages du même code.**
- Temps d'image sous SwiftShader (le pire cas, le rendu en logiciel), lieu.html 960×600 : main e5516e2 210 ms, main 5686b89 (Codeur
  3) 245 ms, la mienne réalisme entier 290 ms (le grain anisotrope coûtait 55 ms de plus : coupé). Dans le jeu (`course=3`, test,
  1280×720) : main 363 ms, la mienne 406 ms avec le réalisme entier, **393 ms en mode logiciel** (+8 %).

Ce que je n'ai pas pu vérifier :
- Un vrai téléphone et un ordinateur d'école avec une vraie carte graphique faible (le Mac n'a qu'une Intel Iris chargée).
- Les images/s sur la vraie carte après la fusion (le verrou était pris ; mesure faite avant).
- Le mode 2 joueurs et le rétroviseur n'ont pas eu de capture à part (l'ombre y est dessinée aussi : +1 appel dans le rétroviseur).
- Les matériaux des voitures sont choisis à leur première création : si une voiture est créée avant `SCENE3D.init` (aperçu du
  garage), le mode logiciel ne s'applique pas aux voitures de cette page.
- Fichiers partagés touchés (blocs ajoutés) : donnees.js, qualite.js, scene3d.js, index.html, meteo3d.js, tests/lieu.html,
  tests/test.html, tests/ecrans.py, CLAUDE.md (« Le monde 3D » et la liste des fichiers).

Réévalue.
