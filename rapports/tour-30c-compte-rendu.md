# TOUR 30c — compte rendu du Codeur 3 (étape 15 : la partie qui se vérifie sans Poki)

Commit : `1f4ba0f` sur la branche `codeur3` (main fusionné). Passage GitHub 40147297691 : TOUT PASSE (moteur 261/261, courses 43/43 + 38/38 + 9/9, ecrans 685/685, sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 56/56 + 51/51, textes 575/575, paquet 40/40).

Ordres : (1) fait / (2) fait / (3) fait, sauf les points listés dans « Pas fait ».

## (1) Le paquet : `tests/paquet.py` → `dist/grand-prix-dynasty.zip`
- **Ce qui entre dans le zip** : `index.html` à la racine, plus exactement ce que `index.html` charge (`src="…"` et `href="…"` locaux, relevés dans la page). Il n'y a donc ni test, ni rapport, ni `.md`, ni `.github`, ni capture, ni fichier de travail. Les deux fichiers `circuits-officiels-*.js`, pas encore branchés, ne sont pas chargés et n'y sont pas.
  - Un test le vérifie : index.html est le premier fichier, chaque fichier existe, aucun chemin interdit, aucun fichier externe.
  - `dist/` est dans `.gitignore`.
  - `python3 tests/paquet.py --zip` fabrique seulement le zip.
- **50 fichiers, 1370 Ko non compressés, zip de 400 Ko** :
  - index.html 23 Ko, style.css 41 Ko, lib/three.min.js 618 Ko ;
  - les scripts du jeu : aileron.js 5, aleatoire.js 1, argent.js 4, arrivee.js 4, boite.js 1, boucle.js 3, cache-carte.js 5, camera.js 10, carriere.js 18, carte2d.js 3, casque.js 7, championnat.js 15, circuits.js 12, course.js 11, decouverte.js 2, depart.js 7, deux-joueurs.js 9, donnees.js 60, enregistreur-donnees.js 2, enregistreur.js 16, fantome.js 6, fiche.js 4, garage.js 4, ia.js 65, interface.js 85, interview.js 10, journal.js 18, physique.js 18, pilote.js 3, pneus-donnees.js 3, pneus.js 3, podium3d.js 6, principal.js 94, qualification.js 3, radar.js 3, reglages.js 5, robot.js 4, saisons.js 17, sauvegarde.js 9, scene3d.js 11, sdk.js 4, simulation.js 23, son.js 6, sponsors.js 7, textes.js 60, tournoi.js 9, voiture3d.js 15 (en Ko).

## (2) Le jeu ouvert DEPUIS le zip décompressé (dans un dossier temporaire, Playwright, 960×600 et 1280×720)
- La console est vide, aucun fichier ne manque, et toutes les requêtes partent du dossier du jeu (rien d'externe).
- L'écran titre s'affiche ; « ▶ Jouer » lance la course de découverte, jusqu'aux feux éteints.
- `tests/lancer.py paquet` : une partie de la suite, donc aussi lancée sur GitHub.

## (3) Les vérifications Poki automatisables, en tests (`tests/paquet.py`, depuis le zip)
- **Pas de défilement** sur l'écran titre et la course (aux deux tailles), puis sur le podium, les résultats, l'interview et la une (parcours de championnat). Les autres écrans sont déjà vérifiés aux deux tailles par `ecrans.py`.
- **Flèches, Espace, Page suivante, Fin et molette** : rien ne défile (`scrollX` et `scrollY` restent à 0).
- **Clic droit** : le menu contextuel est bloqué.
- **Sélection de texte** : la page est en `user-select: none` ; les champs de saisie restent sélectionnables.
- **Liens** : aucun lien externe.
- **Son** : aucun avant le premier geste (`SON.actif` faux), il naît au clic. L'onglet caché suspend l'AudioContext, et le son revient quand l'onglet revient.
- **Faux SDK, découverte** : `init` → `gameLoadingFinished` (une seule fois) → `gameplayStart` aux feux. Jamais deux fois de suite le même, aucun `commercialBreak`.
- **Faux SDK, parcours de championnat** (course → podium → résultats → interview → une → paddock → « Course suivante ») :
  - le SDK reçoit `init → gameLoadingFinished → gameplayStart → gameplayStop → commercialBreak` ;
  - aucune pub pendant la course ni avant la une ;
  - la pub vient entre les deux Grands Prix, après `gameplayStop`, avec le son coupé pendant la pub.
- Le parcours titre → découverte → Bravo → création → paddock, avec le faux SDK, est déjà dans `ecrans.py` (`?test=decouverte`).

## Les défauts trouvés
1. **Corrigé : aucune pause pub entre deux Grands Prix.** La carrière n'appelait jamais `commercialBreak`. Maintenant, « Course suivante » sur un Grand Prix fini appelle `SDK.pubEntreCourses` puis recharge la page sur le suivant, avec le son coupé pendant la pub (`principal.js`, `courseSuivante`). Hors Poki, rien ne change.
2. **Pas corrigé, à décider par toi : le script du SDK Poki n'est pas dans `index.html`.** CLAUDE.md dit pourtant « le script du SDK est dans index.html ». Aujourd'hui, `sdk.js` ne fait rien sans `window.PokiSDK` : sur Poki, le jeu n'enverrait aucun appel.
   - Il faut une ligne `<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>` avant `sdk.js`.
   - Je ne l'ai pas ajoutée : un script externe chargé à chaque test, depuis `file://`, ferait échouer « console vide » et « rien d'externe » quand le réseau manque.
   - Pistes : l'ajouter seulement dans le zip (`paquet.py` peut l'insérer), ou la garder dans `index.html` avec des tests qui l'acceptent.

## Pas fait
- Le parcours complet d'une seule traite dans une seule page (titre → découverte → création → championnat → un GP → interview → une → paddock). Il est fait en deux morceaux : découverte → création → paddock dans `ecrans.py`, puis championnat → GP → paddock → pub ici.
- Le test sur inspector.poki.dev : il reste à faire par le propriétaire, avec le zip `dist/grand-prix-dynasty.zip` (fabriqué par `python3 tests/paquet.py --zip`).

Réévalue.

## Suite : le script du SDK Poki dans le zip (décision du Chef)
- `paquet.py` ajoute `<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>` dans l'index.html DU ZIP, juste avant `sdk.js`. Le dépôt reste sans réseau.
- Test : une seule balise, juste avant sdk.js.
- Dans les tests du zip, le script Poki est servi vide : le faux SDK reste et la console est vide.
- Une page « sans réseau » où le script échoue : le jeu reste jouable sans SDK (titre, « Jouer », la découverte, `SDK.present` faux), et la seule trace est l'échec de ce script.
- Commit et passage : voir le message au Chef. Sur le Mac : paquet 42/42.
