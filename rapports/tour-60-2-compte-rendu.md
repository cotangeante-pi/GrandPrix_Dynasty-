TOUR 60 — compte rendu du Codeur 2 (le réalisme des voitures et de la route)
Commit : 2577b6b (branche `realisme-60`, depuis main e5516e2)
Passage GitHub : PASSAGE_A_REMPLIR

Ordres : 1 fait / 2 fait / 3 fait (images/s : dans le bruit d'un Mac chargé, voir plus bas) / 4 fait / 5 fait

Le principe (celui du Chef) : **calculer une fois, dessiner bon marché**. Tout ce qui coûte est fait au chargement ; le dessin
reste une passe, avec des shaders à peine plus longs ; **+1 appel de dessin en tout** (aucun par voiture) ; chaque ajout se retire
par un uniform (aucun shader recompilé) dans les pas de l'Auto, avant les pixels. `REALISME_VOITURES` et `REALISME_ROUTE` faux
= l'image d'avant **au pixel près** (vérifié : les images de lieu.html, derrière, cockpit, de près et télé, à Monzo et Singapura,
ont la même empreinte md5 que celles de main avec les deux réglages faux, et `__couts` donne les mêmes appels, triangles,
matériaux et programmes).

1. Les voitures (voiture3d.js)
   - **Les formes** : les mêmes boîtes, effilées (`VOITURE_FORMES`) : nez plus fin et relevé dessous, capot moteur qui descend
     vers l'arrière, pontons en « bouteille de coca », coque plus étroite devant. Les mêmes triangles, des sommets déplacés.
   - **La lumière cuite** dans les couleurs des sommets (`VOITURE_AO`) : le bas de la voiture et les faces tournées vers le sol
     plus sombres ; la voiture ne flotte plus.
   - **Peinture brillante, carbone mat** : la brillance de chaque matière dans un attribut des sommets (`VOITURE_BRILLANCE`),
     lue par un Phong (la tache du soleil) et par **le reflet d'une carte d'environnement figée** : 6 faces de 32² pixels
     dessinées une fois par circuit d'après son ciel (`refletsDuLieu` : le dégradé du ciel, une ligne d'arbres et de tribunes
     sur l'horizon, au loin le sol, sous la voiture l'asphalte ; la nuit, des lumières sur l'horizon), avec l'effet de Fresnel
     (faible de face, fort en rasant, `REFLET_FORCE`). Trouvé en route : l'`envMap` de Three.js r152 assombrissait tout le
     Phong/Lambert ; la carte est donc un `samplerCube` à nous.
   - **Les pneus et les jantes** : une texture de 256×128 faite une fois (flanc, bande jaune, marques, jante à 10 rayons,
     écrou), un cylindre de 20 côtés au lieu de 14 ; la jante tourne avec la roue.
   - **Halo** plus rond (8×18), **ailerons détaillés** pour toutes les voitures (2e volet avant, volet arrière, lame basse,
     aileron de requin, bouches des pontons, rétroviseurs : la voiture du joueur avait déjà les siens).
   - **L'ombre de contact** : une tache douce (un canvas de 64², dessinée une fois) sous chaque voiture, toutes les voitures en
     **un seul InstancedMesh = +1 appel de dessin** (`OMBRE_CONTACT`).
2. La route (route3d.js, nouveau fichier ; scene3d.js, meteo3d.js)
   - **L'asphalte** : une texture de 128² (64 Ko) faite une fois et répétée : grain fin (2,5 m), taches d'usure (50 m),
     stries (filtrage anisotrope possible, `ROUTE_GRAIN_ANISOTROPIE`, laissé à 1 : à 4, +25 % de temps d'image sous swiftshader ; les captures ont été prises à 4).
   - **La gomme** : la ligne idéale calculée une fois (lissage élastique de la ligne du milieu, calcul pur, sans rapport avec
     les IA ni la course) ; la trajectoire est 40 % plus sombre, fondue sur 2,6 m.
   - **Les traces de freinage** : la vitesse de passage estimée des virages, puis la décélération en remontant la piste, donne
     les zones de freinage (12 à 35 % du tour selon le circuit) : deux traces striées à la voie des roues avant les virages.
   - **Les bords** poussiéreux hors trajectoire ; **les bas-côtés** (herbe usée, terre ; en ville, le sol assombri) et **les
     bacs à gravier** à l'extérieur des virages serrés, fondus dans l'herbe ; **l'herbe** du sol a un grain doux (même calcul
     sous les bas-côtés : aucune couture). Les bas-côtés sont **dans le maillage de la route** (aucun appel de plus), un
     morceau tous les 4 m, jamais dans la voie des stands.
   - **La pluie** : la route plus sombre qui reflète le ciel du moment (Fresnel), la trajectoire plus sèche dans le shader
     (meteo3d.js ne change plus de matériau et ne crée plus son ruban sous `REALISME_ROUTE` ; faux = comme avant).
   - Les lignes blanches et les vibreurs ne changent pas (géométrie nette, déjà).
3. L'Auto (qualite.js, donnees.js) : deux pas ajoutés dans l'ordre, après le rétroviseur et avant les pixels :
   `{ ombresContact: false }` puis `{ reflets: false }` (les reflets des voitures et le détail de la route : taches, traces,
   bords). Un pas dont le réalisme est éteint n'existe pas (`realisme: [...]` dans le pas, filtré par `niveaux`). 21 niveaux
   au lieu de 19. Le test de l'ordre des pas connaît les deux nouvelles clés (famille 5, celle des ombres).
4. Captures avant/après dans `rapports/captures-tour60/` (préfixe `voitures-route-`, JPEG) : Monzo, Monoco, Singapura (nuit),
   derrière la voiture, cockpit, télé en 1280×720 et 844×390, de près en 1280 ; Monzo dans le jeu sous la pluie et au sec
   (`index.html`, 8 IA) ; la chicane de Monzo vue du dessus (gomme, freinages, gravier). Relues : les voitures ont du volume
   (dessous sombre, reflet du ciel sur le dessus, pneus et jantes vrais), la route n'est plus un aplat (gomme et traces très
   visibles à Monoco, plus discrètes sur les longues lignes droites), les bords se fondent. Limites vues : les voitures restent
   des boîtes (effilées) ; le grain fin se voit peu en rasant ; sous la pluie, la route reflète un ciel gris uni (plus de tache
   de soleil comme avant).

Sortie des tests (sur le Mac, sous le verrou, seulement la partie concernée) :
- tests/test.html?filtre=qualit : RESULTAT 11/11 (Auto : ordinateur lent niveau 8/20, téléphones 4× 14/20, 6× 18/20, 8× 20/20,
  la course identique au bit près au plus beau et au plus simple).
- tests/test.html?filtre=route r : RESULTAT 3/3 (nouveau test « route réaliste » : 14 circuits, ligne dans la piste, freinages
  avant le virage le plus serré, bacs à gravier, même calcul deux fois, pas de l'Auto absents quand le réalisme est éteint).
- tests/ecrans.py : le test de la pluie accepte la route réaliste (`ROUTE3D.eau` au lieu du Phong et du ruban de meteo3d.js).
- La course : aucune ligne de physique, d'IA ou de course touchée (le dessin seulement) ; la suite entière sur GitHub.

Mesures :
- `__couts` (tests/lieu.html, 20 voitures, caméra de course, pire / plafond `PLAFONDS_IMAGE`), avant → après :
  monoco 45 / 95 770 → 46 / 99 770 (plafond 47 / 169 000) ; silverstoun 42 / 96 688 → 43 / 103 000 (44 / 134 000) ;
  monzo 44 / 74 252 → 45 / 80 496 (46 / 89 000) ; spaa 43 / 88 712 → 44 / 96 328 ; suzuko 46 / 102 840 → 47 / 109 776 ;
  interlagas 43 / 92 654 → 44 / 97 778 ; montreol 46 / 77 678 → 47 / 82 774 ; melbourn 46 / 76 636 → 47 / 82 636 ;
  barcelana 42 / 74 920 → 43 / 80 328 ; bahrayn 43 / 68 780 → 44 / 74 968 ; singapura 44 / 96 344 → 45 / 102 024
  (plafond 106 000) ; yasmarino 46 / 65 574 → 47 / 71 622. **+1 appel partout, +5 à +7 % de triangles** (les bas-côtés, environ
  2 × n triangles, et ~250 par voiture détaillée). Programmes (shaders) : 15 → 20 à Monzo, 17 → 22 à Monoco (compilés une fois au chargement).
- Mémoire ajoutée : la texture du grain 64 Ko, la carte d'environnement 24 Ko, la texture des pneus 128 Ko (+ mipmaps), un
  attribut de 4 flottants par sommet de route et d'un flottant par sommet de voiture.
- Images/s (`tests/perf.py`, 20 IA, vue derrière, vraie carte graphique Intel Iris, Mac chargé : charge 5 à 13 ; deux passages
  alternés avant / après) : Monoco 55,9 et 66,7 avant, 65,2 et 61,3 après (dessin seul 64,5 / 72,0 avant, 69,6 / 63,4 après) ;
  Bahrayn 67,1 et 69,2 avant, 66,3 et 67,4 après (dessin seul 73,5 / 71,6 avant, 70,1 / 71,3 après) ; pire 1 % 17 à 25 des deux
  côtés. **L'écart avant / après est plus petit que l'écart entre deux passages du même code.**

Ce que je n'ai pas pu vérifier :
- Un vrai téléphone et un ordinateur d'école (le Mac n'a qu'une Intel Iris chargée par les autres Codeurs ; swiftshader pour les
  captures). Sur un GPU très lent, le coût est surtout dans le shader de la route (3 lectures de texture par pixel au lieu de 0) :
  le pas « reflets » de l'Auto le ramène à une seule lecture.
- Le mode 2 joueurs et le rétroviseur (l'ombre y est dessinée aussi : +1 appel dans le rétroviseur) n'ont pas eu de capture à part.
- Le circuit `test` (la découverte) n'a pas de lieu : reflets du ciel par défaut ; pas de capture.
- Fichiers partagés touchés (blocs ajoutés seulement) : donnees.js (un bloc après COULEUR_JOUEUR, deux pas dans QUALITE_PAS),
  qualite.js (2 clés dans plusBeau, 3 lignes dans niveaux), scene3d.js, index.html (route3d.js), tests/lieu.html, tests/test.html,
  tests/ecrans.py (le test de la pluie), meteo3d.js, CLAUDE.md (« Le monde 3D » et la liste des fichiers). Le Codeur 3 touche
  aussi QUALITE_PAS : conflit probable sur ces lignes à la fusion (mes deux pas vont juste après `{ retro: false }`).

Réévalue.
