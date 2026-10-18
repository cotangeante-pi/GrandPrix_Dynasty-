TOUR 1 — étape 0 (Fondations) — rapport du Chef
Commit vérifié : aucun (le dossier n'est pas encore un dépôt git)
Note : 0/100 (rien n'existe encore, c'est normal)
Tests : aucun
Mesures : aucune

Ce qui existe : CLAUDE.md, SUIVI.md, rapports/. Pas de code.

ORDRES (lis d'abord CLAUDE.md en entier, puis SUIVI.md) :

1. git — `git init`, et un `.gitignore` (.DS_Store, dist/, tests/captures/).
   Fini quand : le premier commit « Tour 1 : fondations » existe et que `git status` est propre.

2. La page — `index.html` (plein cadre, sans défilement, sans menu contextuel ni sélection de texte), `style.css`, et `lib/three.min.js` copié depuis `../jeu poki/lib/` (r152 UMD, avertissement déjà retiré : version fixée, la noter dans CLAUDE.md « La technique »). Des scripts classiques, pas de modules ES (file:// les bloque). Fichiers de départ : `donnees.js` (réglages, ex. PAS_PHYSIQUE = 1/120), `aleatoire.js`, `boucle.js`, `scene3d.js`.
   Fini quand : `index.html` ouvert en file:// ne laisse rien dans la console (ni erreur, ni avertissement).

3. La boucle à rythme fixe (`boucle.js`) — physique à 120 pas par seconde avec un accumulateur, séparée de l'affichage (requestAnimationFrame) ; un plafond de pas par image (pas de spirale si l'onglet rame) ; arrêt quand l'onglet est caché ; une fonction `simuler(secondes)` qui avance la physique SANS affichage (elle servira aux simulations d'IA).
   Fini quand : un test montre que 1 s simulée = exactement 120 pas, quelle que soit la cadence d'affichage (ex. 30, 60, 144 images/s simulées).

4. Le hasard (`aleatoire.js`) — une seule fonction de hasard avec graine (ex. mulberry32) ; sans graine, elle peut utiliser Math.random.
   Fini quand : un test montre que la même graine donne la même suite, et deux graines différentes des suites différentes.

5. Les tests — `tests/lancer.py` adapté de `../jeu poki/tests/lancer.py` (Chrome sans fenêtre, swiftshader pour WebGL, le groupe de processus entier tué à la fin, plafond de temps en time.monotonic), `tests/test.html` qui lance les tests et affiche le total. Le test doit aussi ÉCHOUER s'il y a une erreur ou un avertissement dans la console de `index.html`.
   Fini quand : `python3 tests/lancer.py` affiche tous les tests verts, et qu'une erreur volontaire (essaie-la, puis enlève-la) le fait échouer.

6. La preuve du rendu — dans `scene3d.js`, une scène minimale : ciel, sol, lumière, un cube qui tourne avec la physique (pas avec l'affichage). `index.html?debug=1` affiche les images par seconde dans un coin.
   Fini quand : une capture (Chrome sans fenêtre, 1280×720) montre le cube, et `?debug=1` affiche un nombre d'images par seconde.

Ne fais rien de l'étape 1 (le circuit). Écris ton compte rendu dans `rapports/tour-01-compte-rendu.md` (format dans CLAUDE.md) et envoie-le-moi par SendMessage, avec « Réévalue. » à la fin. Ne touche pas à SUIVI.md : c'est moi qui le tiens.

Questions pour le propriétaire : aucune pour ce tour.
