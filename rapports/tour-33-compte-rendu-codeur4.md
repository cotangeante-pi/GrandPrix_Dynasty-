TOUR 33d — compte rendu du Codeur 4 (les aides au premier usage, étape 11b ; puis le tutoriel guidé, étape 11d)

Commit : d6b79dd (branche codeur4, fusionnée avec main e9a2bb2). Passage GitHub 40600081242 : les 12 travaux sont verts.

Ordres :
1. aides.js en calcul pur : fait.
   - 11 aides : premiers feux, première qualification, fantôme, arrêt obligatoire, pluie, consigne d'équipe, garage, aileron, duel au paddock, contrats, interview.
   - Chaque aide a sa condition, lue dans l'état du jeu (AIDES.situation), et ce qui la ferme quand l'action est faite.
   - Une aide n'est vue qu'une fois. Les aides vues sont gardées à la racine de la sauvegarde (`aides`, un champ ajouté s'il manque, sans changer de version).
   - « Revoir les aides » les remet toutes. Le réglage AIDES_ACTIVES les coupe toutes.
   - Les réglages sont dans un bloc de donnees.js (AIDES_*).
   - Les aides de course ne s'affichent qu'à l'arrêt, ou si la piste reste droite sur 140 m devant la voiture, sans freinage et sans volant tourné. Si un virage arrive, la bulle se cache et le temps d'affichage ne compte pas.
   - En course, une bulle se ferme seule après 7 s. Sur un écran, elle reste jusqu'au clic ou jusqu'à ce qu'on quitte l'écran.
   - Aucune aide ne s'affiche pendant le premier tour de la découverte (elle a déjà ses aides ↑ ← → ↓). L'aide des feux vient donc à la première course de la carrière.
2. L'affichage : fait. C'est le bloc AIDES_ECRAN, à la fin de interface.js.
   - La bulle est faite avec le thème télé (--tv-*).
   - En course, elle est à gauche, sous le bandeau des stands (top: max(36 %, 226 px)), avec 3 lignes au plus.
   - Sur les écrans, elle est en haut à gauche, à gauche du titre (38vw, 2 lignes).
   - Un clic la ferme.
   - « Revoir les aides » est dans le coin en bas à droite du paddock et dans le menu pause.
3. Les textes en anglais et en français : faits. Ils sont dans un bloc Object.assign de textes.js, jamais genrés (c'est testé).

Le tutoriel guidé (demande du Chef dans la soirée) : fait.
- tutoriel.js en calcul pur, avec les 7 leçons de CLAUDE.md. Chaque leçon a son but, sa mise en place (une page `index.html?tutoriel=<id>&…` qui utilise les modes existants) et sa réussite mesurée sur l'état du moteur.
- Leçon 1 : un tour sans sortir.
- Leçon 2 : la zone du virage le plus serré, entre des plots orange (une InstancedMesh, un seul appel de dessin), en moins de TUTO_ZONE_OBJECTIF = 9 s, avec 3 essais.
- Leçon 3 : un départ parfait ou bon.
- Leçon 4 : passer une IA lente (TUTO_IA_RYTHME 0,8, un réglage de son pilote, pas la physique) et rester devant 2 s.
- Leçon 5 : un arrêt au stand sans excès de vitesse.
- Leçon 6 : l'averse (?meteo=averse), puis un arrêt pour des pneus pluie ou intermédiaires.
- Leçon 7 : la visite paddock → garage → aileron → paddock.
- Une leçon de course est ratée si rien n'est fait pendant TUTO_TEMPS_MAX = 240 s. Chaque leçon peut se passer (« Passer ⏭ ») ou se recommencer. Une étoile par leçon réussie, gardée à la racine de la sauvegarde (`tutoriel`).
- L'écran est le bloc TUTORIEL_ECRAN de interface.js : la liste des leçons avec les étoiles, la consigne à gauche (en haut à gauche pendant la visite), et le résultat. Derrière le résultat, la course est arrêtée et gameplayStop est envoyé.
- « Apprendre à piloter » est sur l'écran titre (petit, sous « Entre amis »), dans le menu pause, sur « Bravo ! » (« D'abord apprendre ») et au paddock.
- Au paddock, le bouton est dans le coin en bas à gauche, et non dans la rangée Course comme le dit CLAUDE.md : le test du paddock fixe le contenu des 4 rangées, et en 960×600 en anglais la rangée débordait (vu au passage 40595571314). Si la rangée Course est voulue, il faut d'abord changer ce test.
- Pendant une leçon, aucune bulle d'aide ne s'affiche.

Sortie des tests (GitHub 40600081242) :
- moteur, courses, stands, consignes, officiels, meteo, paquet : verts.
- annexes : vert, avec tests/aides.html 20/20 et tests/tutoriel.html 17/17.
- ecrans en 4 tranches : 340/340, 313/313, 301/301, 374/374. Durées de ecrans.py par tranche : 279, 337, 228 et 313 s (la limite est de 600 s).
- Les pages ajoutées à ecrans.py :
  - ?test=aides-course (960 et 1280) : la qualification, puis les feux, puis l'arrêt obligatoire suivi image par image sur un tour ; le menu pause et « Revoir » ; AIDES_ACTIVES coupé.
  - ?test=aides-menus (960 et 1280) : le duel, le garage, l'aileron, le rechargement, « Revoir » au paddock, une ancienne sauvegarde.
  - ?test=tuto-menu (960 et 1280).
  - Les 7 leçons jouées par le robot, plus une page ?test=tuto-rien.
- Sur le Mac, le verrou était pris presque tout le temps par les autres Codeurs : j'ai tout vérifié sur GitHub. Les deux pages de calcul pur passent aussi dans JavaScriptCore, avec osascript -l JavaScript et une petite cale (sans Chrome ni verrou ; scratchpad codeur4/jxa.py).

Mesures :
- Rien ne recouvre la piste devant la voiture. Les 135 points du couloir de la voiture (±2 m, de 6 à 140 m devant) sont projetés à l'écran par la caméra : 99 à 100 % sont gris de route, et 0 est sous la bulle, sur la grille comme en roulant, en 960×600 et en 1280×720. Les bulles sont en [16, 226, 334, 295] en 960 et [16, 259, 334, 328] en 1280.
- La course de découverte n'est pas ralentie. Clic → premier feu : 0,2 s (de 0,1 à 0,6 s sur main). Clic → feux éteints : 11,7 s sur ce passage, et 17,9 s sur le passage 40597932135. Sous swiftshader, ce chiffre dépend de la machine GitHub : il varie de 8,8 à 17,9 s sur les passages de main de ce soir. Pendant la découverte, aucune aide ne s'affiche (le calcul de la situation est une boucle de 70 échantillons par image).
- Sur le circuit test, 51 % du tour est en ligne droite au sens des aides.
- Leçon du freinage : le robot passe la zone (360 → 578 m) en 6,80 s, pour un objectif de 9 s.
- Leçon du départ : le robot fait un départ « parfait », réaction 0,2 s.
- Captures (artefacts du passage) : aide-stand.png, aide-stand-960.png, aide-garage.png, aide-garage-960.png, tuto-menu(-960).png, tuto-plots.png, tuto-<leçon>.png, tuto-reussie-stand-960.png, tuto-rate-960.png, tuto-visite.png.

Changements hors de mes blocs :
- principal.js, 1 ligne : une leçon du tutoriel saute la qualification.
- tests/ecrans.py, 1 ligne : le test course_ia ignore les pages ?tutoriel= (elles ont ia=1).
- tests/lancer.py, 1 ligne : ANNEXES.extend.
- index.html : de nouvelles lignes seulement.
- style.css : un conflit à la fusion (le bloc des pneus du garage, Codeur 1). J'ai gardé les deux blocs.

Pour CLAUDE.md (au Chef) :
- La liste des fichiers : `aides.js` (les aides au premier usage) et `tutoriel.js` (le tutoriel guidé), plus leurs pages tests/aides.html et tests/tutoriel.html dans les annexes.
- « Apprendre à piloter » est dans un coin du paddock et non dans la rangée Course (voir plus haut).
- Une page de calcul pur peut se jouer sans Chrome, avec `osascript -l JavaScript` (JavaScriptCore) : c'est utile quand le verrou est pris.

Ce que je n'ai pas pu vérifier :
- Le ressenti en vrai : la bulle est-elle lisible et vient-elle au bon moment ? L'objectif de 9 s de la leçon 2 est-il juste pour un humain (le robot fait 6,80 s) ? L'IA à 0,8 de la leçon 4 est-elle trop lente ? À essayer par le propriétaire.
- L'aide de la consigne d'équipe et celle des contrats ne sont testées qu'en calcul pur, pas dans la page.
- La leçon 7 utilise le championnat de la sauvegarde. Si on y touche l'aileron, le cran est gardé dans la carrière.

Réévalue.
