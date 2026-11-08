TOUR 51k — compte rendu du Codeur 5 (le téléphone : tactile.js, première journée)
Branche : tactile (locale tactile-local), depuis main 4fba7cf
Commits : be3b0c2 (le code et les tests), 142e880 (corrections des tests)
Passage GitHub : 42427995775 (142e880) — résultat : voir plus bas

Ordres : 1 (GAZ / FREIN, ◀ ▶) fait · 2 (le volant, le neutre, « Recentrer », l'autorisation iPhone, le repli ◀ ▶) fait · 3 (menus au doigt, « Tourne ton téléphone ») fait en partie (le message portrait et les boutons ⏸ / ↩ sont là ; les menus réagissent déjà au clic, pas de vérification faite écran par écran).

Ce qui est fait
- `tactile.js` (nouveau) : calcul pur (`angle`, `braquage`, `lisser`, `sensEcran`, `fusionner`, `portrait`) + la page (`brancher`, `maj`, `cibles`, `recentrer`, `activer`).
  - Sur un écran tactile seulement (`navigator.maxTouchPoints > 0` ou `ontouchstart`), et si `TACTILE_ACTIF` : deux gros boutons GAZ (vert) et FREIN (rouge) en bas à droite, ◀ ▶ en bas à gauche, ⏸ et ↩ (retour en piste) en haut au milieu. Multi-touch par évènements pointer (un doigt = un pointerId, plusieurs doigts à la fois). Visibles pendant la conduite seulement (course, survol, tour de qualification), jamais à deux.
  - Les commandes rejoignent `JEU.cibles` à chaque image (`majTactile` dans principal.js, juste après `majManettes`) : le plus fort du clavier / manette / tactile pour gaz et frein, la somme bornée pour la direction (comme la manette). Sans écran tactile : `majTactile` sort à la première ligne, rien ne change (clavier au bit près).
  - Le volant : `beta` de `deviceorientation` ; l'angle = asin(sin β) (la part de la gravité le long du grand côté du téléphone : la même mesure que le téléphone soit dressé ou presque à plat), le neutre = la première mesure, repris au début de chaque conduite, et « Recentrer le volant » dans la pause ; `VOLANT_PLEIN` 25° = à fond, zone morte 2° sans saut, lissage 0,35 par image ; le sens suit `screen.orientation.type` (landscape-secondary → inversé) et `VOLANT_INVERSE` retourne tout.
  - Sans capteur : aucune mesure pendant `VOLANT_ATTENTE` (2,5 s) → mode « boutons », ◀ ▶ apparaissent. Si une mesure arrive plus tard, le volant reprend. Dans la pause, « Direction : incliner le téléphone / boutons ◀ ▶ » laisse le joueur choisir les boutons même avec un capteur.
  - iPhone : si `DeviceOrientationEvent.requestPermission` existe, le bouton « 🎮 Activer le volant » est affiché hors conduite tant qu'on n'a pas répondu ; accordé → on écoute ; refusé → mode « boutons ».
  - Téléphone debout : « Tourne ton téléphone » par-dessus tout (resize).
- `donnees.js` : `TACTILE_ACTIF`, `VOLANT_PLEIN`, `VOLANT_ZONE_MORTE`, `VOLANT_LISSAGE`, `VOLANT_ATTENTE`, `VOLANT_INVERSE`.
- `textes.js` : `tac_*` en fr et en en (GAZ / FREIN, Activer le volant, Recentrer, les deux modes, Tourne ton téléphone, Pause, Retour en piste).
- `index.html` : `#tactile` (des div, pas des boutons : la manette ne les choisit pas dans les menus), `#tactileActiver`, `#tactilePortrait`, deux boutons dans la pause (`boutonVolantPause`, `boutonRecentrerPause`, cachés sans tactile) ; `<script src="tactile.js">` après manette.js. `style.css` : bloc à la fin, tailles réduites sous 420 px de haut (640×360).
- Tests (`tests/ecrans.py`) : 3 pages nouvelles avec un écran tactile émulé (`has_touch`, CDP), de faux doigts (PointerEvent touch) et de fausses mesures (`DeviceOrientationEvent`) : `index.html?course=3&circuit=test&test=tactile` en 640×360 (fr) et 960×600 (en) : GAZ / FREIN à leur place et en gros ; sans capteur → ◀ ▶ après 2,5 s ; un doigt, trois doigts à la fois, tout lâché ; le neutre = la première mesure ; 25° à droite = direction 1 ; 1° = 0 ; −12,5° = −0,457 ; « Recentrer » → 0 ; le choix boutons / volant dans la pause ; **un tour entier sans clavier ni robot** (le robot d'essai dicte, mais tout passe par les doigts et le volant) ; captures `tactile-640.png`, `tactile-960.png` ; ⏸ ouvre la pause, Reprendre rend les boutons. `index.html?test=tactile-iphone` (960) : le bouton « Activer », accordé → attente → volant ; portrait → le message ; refusé → boutons. Sur **toutes** les autres pages : rien de tactile n'est affiché ni branché. `ECRANS_PAGES=<texte>` filtre les pages sur le Mac (nouveau). Durées ajoutées dans `tests/ecrans-durees.json` (75, 75, 20 s : les tranches se rééquilibrent toutes seules).

Sortie des tests : (local) …
Mesures : pas de mesure d'images par seconde (le Mac est très chargé, aucune mesure ne vaudrait).

Pas fait / à reprendre demain
- Pas essayé sur un vrai téléphone : le sens du volant (landscape-primary / secondary) est déduit du W3C, à vérifier sur Android et iPhone ; `VOLANT_INVERSE` en secours.
- Le verrouillage de l'orientation en plein écran (`screen.orientation.lock('landscape')`) : pas fait.
- Les menus au doigt : pas de vérification écran par écran (survol, champs de texte, l'aide « ↑ ↓ ← → » de la conduite qui parle du clavier sur un téléphone).
- La course « du titre au podium » sans clavier (CLAUDE.md) : le test fait un tour complet d'une course seule ; pas encore la découverte entière.
- 60 images/s en 640×360 avec 9 IA : pas mesuré.
- Les boutons GAZ / FREIN peuvent chevaucher la tour de classement en bas à droite à 640×360 : à regarder sur les captures.
- Une bulle d'aide pour le téléphone (aides.js) : « tiens GAZ, incline pour tourner ».

Ce que je n'ai pas pu vérifier : un vrai capteur, un vrai écran tactile.
Réévalue.
