# Tour 37 (étape 15, préparer Poki) — compte rendu du Codeur 3 (2026-10-29)

Branche codeur3, commit 4f536f4 (fusionné avec origin/main : 054b25d). Je n'ai touché ni à ia.js, ni à simulation.js, ni au rendu 3D.

## 1. La traduction anglaise
- Le test est dans **tests/textes.html** (calcul pur, il tourne aussi avec osascript). Il ajoute 4 vérifications aux tests de parité qui existaient déjà (mêmes clés, rien de vide, mêmes trous {…}, même longueur des listes) :
  - aucun mot français dans un texte anglais ;
  - aucun mot anglais dans un texte français ;
  - aucun texte de 3 mots ou plus laissé identique dans les deux langues ;
  - aucune liste de variantes vide d'un côté.
- Ce qui est mis à part : les noms propres (circuit_, sponsor_, lieu_, pays_, journal, une_nom), les trous {…}, « protégé(e) » et Montréol, Brio Café, Melbourn Park et Yas Marino.
- Le test parcourt toutes les clés, y compris les listes et les objets. Il couvre donc les écrans, le commentateur, les discussions, les aides, le tutoriel, la manette, la trajectoire conseillée, le courrier et les patrons.
- Résultat : 1227/1227 avec osascript. J'ai vérifié qu'il attrape les fautes : une phrase française injectée en anglais, une anglaise en français et une phrase copiée telle quelle donnent bien les 3 échecs attendus.
- Rien ne manquait ; aucun texte en dur hors de textes.js, sauf le compteur de debug.
- La relecture de l'anglais : 66 formes sans contraction (« do not », « let us », « I am », « That is », « Can not »…) passées en anglais parlé (don't, let's, I'm, that's, can't…), dans les discussions, les patrons, les interviews, la une, le courrier et le tutoriel. On garde volontairement « That cannot happen again » (le patron insiste).

## 2. Le SDK
Le journal du faux SDK note, à chaque appel, l'écran, l'état de la course, les feux et le tour de qualif. Une règle est vérifiée sur tout le parcours :
- jamais deux start ou deux stop de suite ;
- gameplayStart seulement quand la voiture roule (feux éteints) ou pendant le tour de qualification ;
- aucune pub (commercialBreak ou rewardedBreak) en course, en pause, sur la grille, pendant les feux ou pendant un tour ;
- gameLoadingFinished une seule fois.

Les parcours de **tests/paquet.py** (lancés depuis le zip) :
- championnat : qualif (start pendant le tour, stop au résultat), course, pause (stop) puis reprise (start), résumé vidéo (stop), interview, une, puis la pub entre deux Grands Prix ;
- 2 joueurs : course, pause, podium, puis « Revanche », avec la pub sur les résultats ;
- tutoriel : la leçon démarre, la pause envoie stop ;
- découverte (960 et 1280).

Le tournoi est déjà couvert par ecrans.py test=tournoi, et la pause et le départ par ecrans.py test=sdk. Résultat sur le Mac : paquet.py à 56/56.

## 3. Le paquet zip
- dist/grand-prix-dynasty.zip : **0,58 Mo** (73 fichiers, 1,9 Mo décompressés). Un test échoue au-delà de 8 Mo (PAQUET_MAX_MO).
- Rien d'inutile dedans : aucun test, rapport, .md, .github ni capture, et le test le vérifie.
- Le zip ne contient que index.html et les fichiers que la page charge. index.html est à la racine.
- Hors ligne : le parcours « paquet sans réseau » coupe le script du SDK Poki, et le jeu marche quand même.

## Ce que l'inspecteur Poki vérifie, et ce qui est tenu (testé dans paquet.py depuis le zip)
| Vérification de l'inspecteur | État |
|---|---|
| Le SDK chargé, init, puis gameLoadingFinished une seule fois | tenu |
| gameplayStart / gameplayStop autour du vrai jeu (course, qualif, tutoriel, 2 joueurs, tournoi), stop en pause et pendant le résumé | tenu |
| commercialBreak seulement entre deux écrans (Grand Prix suivant, revanche, tournoi), jamais pendant les feux ni en course, avec le son coupé pendant la pub | tenu |
| rewardedBreak seulement sur un bouton 📺 choisi par le joueur | tenu (sdk.js, ecrans.py) |
| Aucun son avant le premier geste ; le son coupé quand l'onglet est caché | tenu |
| La page ne défile pas (flèches, Espace, Page suivante, Fin, molette), sur chaque écran | tenu |
| Pas de menu contextuel, pas de sélection de texte (sauf les champs du pilote) | tenu |
| Aucun lien externe, aucun fichier chargé hors du jeu | tenu |
| Une console vide sur tout le parcours | tenu |
| index.html à la racine, un zip léger, sans fichiers de travail | tenu (0,58 Mo) |
| Le jeu marche si le SDK ne charge pas (bloqueur de pub, hors ligne) | tenu |
| L'anglais complet (le public Poki est surtout anglophone) | tenu (test de textes.html) |
| **Le test sur inspector.poki.dev** | **reste au propriétaire** (déposer dist/grand-prix-dynasty.zip) |

## Une remarque
La variante du Codeur 4 dans dis_paix_deja, « on n'était pas fâchés », est genrée. Je ne l'ai pas changée : elle est à lui.
