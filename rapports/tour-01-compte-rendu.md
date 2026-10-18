```
TOUR 1 — compte rendu du Codeur
Commit : a4f5bdd « Tour 1 : fondations » (ce compte rendu est dans le commit suivant)

Ordres :
  1 fait — git init, .gitignore (.DS_Store, dist/, tests/captures/, __pycache__/). Premier commit a4f5bdd.
    J'ai mis CLAUDE.md, SUIVI.md et rapports/ dans ce premier commit pour que `git status` soit propre.
    SUIVI.md n'a pas été modifié.
  2 fait — index.html (plein cadre, overflow caché, sans sélection de texte ; le menu contextuel, la molette
    et le défilement par les flèches/Espace/Page sont bloqués dans principal.js), style.css (variables CSS),
    lib/three.min.js (r152 UMD copié de ../jeu poki/lib, avertissement déjà retiré), des scripts classiques.
    Fichiers : donnees.js (REGLAGES, PAS_PHYSIQUE = 1/120), aleatoire.js, boucle.js, scene3d.js,
    et principal.js en plus (le démarrage : il branche la physique et l'affichage sur la boucle,
    pour que scene3d.js ne fasse que dessiner).
    Le titre de la page est « NOM_DU_JEU » (le nom n'est pas approuvé). Favicon vide (data:,) : pas de requête manquante.
    Version r152 et liste des fichiers notées dans CLAUDE.md, « La technique ».
  3 fait — boucle.js : accumulateur, pas fixe 1/120 s, plafond PAS_MAX_PAR_IMAGE = 12 (0,1 s), le retard
    au-delà est oublié (pas de spirale). Arrêt quand l'onglet est caché (visibilitychange), et reprise sans
    rattraper le temps perdu. BOUCLE.simuler(secondes) avance la physique sans appeler l'affichage.
    Un EPSILON de 1e-9 évite de perdre un pas quand une somme de flottants (30 × 1/30) tombe juste sous 1.
  4 fait — aleatoire.js : mulberry32. hasard() est la seule fonction de hasard ; ALEATOIRE.semer(n) fixe la
    graine, ALEATOIRE.semer() revient à Math.random.
  5 fait — tests/lancer.py (adapté de ../jeu poki : Chrome --headless=new, swiftshader, groupe de processus
    tué avec killpg, plafonds en time.monotonic, caffeinate pendant la suite).
    Deux séries : tests/test.html (moteur, --dump-dom) et tests/ecrans.py (Playwright, la vraie index.html).
    ecrans.py échoue (code 1) s'il y a une erreur, un avertissement, une erreur de page ou un fichier manquant
    dans la console, et aussi si Playwright est absent (la console ne serait pas vérifiée).
    Erreurs volontaires essayées puis enlevées :
      a) console.warn('erreur volontaire') à la fin de principal.js → ÉCHECS, code 1 :
         ✘ index.html 960×600 : console vide — warning: erreur volontaire  (et les 3 autres pages)
      b) fonctionQuiNExistePas(); à la fin de aleatoire.js → ÉCHECS, code 1 :
         ✘ aucune erreur JavaScript — Uncaught ReferenceError: fonctionQuiNExistePas is not defined (test.html)
         ✘ index.html … : console vide — PAGEERROR fonctionQuiNExistePas is not defined (×4)
  6 fait — scene3d.js : ciel, brouillard, sol, lumière (hémisphère et soleil), un cube rouge. Son angle
    (DEMO.angleCube) est changé seulement par la physique (pasDemo dans principal.js) ; l'affichage le lit.
    ?debug=1 affiche « NN i/s » en haut à gauche (mis à jour toutes les 0,5 s, réglage dans donnees.js).
    Captures : tests/captures/large.png, large-debug.png (1280×720), poki.png, poki-debug.png (960×600).

Sortie des tests (python3 tests/lancer.py, réelle, code de sortie 0) :
⏱ tests/test.html : 11 s
RESULTAT 23/23
✔ la physique avance par pas de 1/120 s
✔ 1 s affichée à 30 images/s = exactement 120 pas
✔ 1 s affichée à 60 images/s = exactement 120 pas
✔ 1 s affichée à 144 images/s = exactement 120 pas
✔ 1 s affichée à 24 images/s = exactement 120 pas
✔ 1 s affichée à 75 images/s = exactement 120 pas
✔ 1 s affichée à 120 images/s = exactement 120 pas
✔ 1 s affichée à 165 images/s = exactement 120 pas
✔ 1 s affichée à 240 images/s = exactement 120 pas
✔ 10 s à 144 images/s = exactement 1200 pas (pas de dérive)
✔ des images irrégulières donnent quand même 120 pas par seconde
✔ plafond : une image de 5 s ne fait que 12 pas, et le retard est oublié
✔ simuler(1) = 120 pas, sans affichage
✔ simuler(60) = 7200 pas
✔ l’onglet caché arrête la boucle, revenu il la relance
✔ arrêtée, la boucle ne repart pas quand l’onglet revient
✔ le cube tourne de VITESSE_CUBE radians par seconde de physique
✔ même angle à 30 et à 144 images/s
✔ même graine, même suite
✔ deux graines, deux suites
✔ les nombres sont dans [0, 1[ et bien répartis
✔ sans graine, le hasard vient de Math.random
✔ aucune erreur JavaScript
RESULTAT 24/24
✔ index.html 960×600 : console vide
✔ index.html 960×600 : pas de défilement
✔ index.html 960×600 : la scène 3D a démarré
✔ index.html 960×600 : le cube tourne
✔ index.html 960×600 : le cube rouge est au centre
✔ index.html 960×600 : sans debug, pas de compteur
✔ index.html?debug=1 960×600 : console vide
✔ index.html?debug=1 960×600 : pas de défilement
✔ index.html?debug=1 960×600 : la scène 3D a démarré
✔ index.html?debug=1 960×600 : le cube tourne
✔ index.html?debug=1 960×600 : le cube rouge est au centre
✔ index.html?debug=1 960×600 : les images par seconde s’affichent
✔ index.html 1280×720 : console vide
✔ index.html 1280×720 : pas de défilement
✔ index.html 1280×720 : la scène 3D a démarré
✔ index.html 1280×720 : le cube tourne
✔ index.html 1280×720 : le cube rouge est au centre
✔ index.html 1280×720 : sans debug, pas de compteur
✔ index.html?debug=1 1280×720 : console vide
✔ index.html?debug=1 1280×720 : pas de défilement
✔ index.html?debug=1 1280×720 : la scène 3D a démarré
✔ index.html?debug=1 1280×720 : le cube tourne
✔ index.html?debug=1 1280×720 : le cube rouge est au centre
✔ index.html?debug=1 1280×720 : les images par seconde s’affichent
⏱ tests/ecrans.py : 49 s
TOUT PASSE
(lancée deux fois de suite après la dernière modification : deux fois TOUT PASSE, ~60 s chacune)

Mesures :
  - poids : lib/three.min.js 633 Ko ; tout le reste < 25 Ko.
  - images par seconde : PAS MESURÉES pour de vrai. La capture ?debug=1 montre « 1 i/s », mais c'est Chrome
    sans fenêtre avec swiftshader (rendu logiciel) pendant que Playwright fait la capture : ça ne dit rien
    d'un vrai ordinateur.
  - « le cube rouge est au centre » : la couleur du pixel du milieu, lue avec readPixels juste après un rendu.

Ce que je n'ai pas pu vérifier :
  - index.html dans un vrai Chrome avec fenêtre (console et images par seconde réelles) : à faire par le propriétaire
    ou par le Chef, en ouvrant index.html?debug=1.
  - pas de `node` sur ce Mac : la syntaxe JS est vérifiée seulement par le chargement dans Chrome (test
    « aucune erreur JavaScript » et console vide de ecrans.py).
  - un premier essai a montré un test fragile : « le cube tourne » attendait 300 ms, et sous swiftshader une
    image a pris plus longtemps. Corrigé avant le commit : on attend jusqu'à 5 s que l'angle change.
  - je n'ai pas vérifié l'arrêt de la boucle avec un vrai onglet caché (seulement par
    BOUCLE.changerVisibilite(true/false), la fonction qu'appelle visibilitychange).

Réévalue.
```
