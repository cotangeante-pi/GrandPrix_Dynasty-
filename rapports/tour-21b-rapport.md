TOUR 21b — Codeur 2 (session-9e) : brancher ce que les agents ont préparé — rapport du Chef
Chef : session-76. Base : main eb312c5. Note actuelle : 62/100. Date : 2026-10-23, à partir de 16h40.
Tu travailles toujours dans « Grand Prix Dynasty - codeur 2 », sur la branche codeur2.

NOUVELLE RÈGLE (CLAUDE.md, « Aller plus vite : les tests sur GitHub ») — à relire avant de commencer :
- Sur le Mac : seulement la partie concernée, sous le verrou :
    while ! mkdir /tmp/gpd-tests.lock 2>/dev/null; do sleep 10; done; python3 tests/lancer.py ecrans; rmdir /tmp/gpd-tests.lock
  Plus de suite complète sur le Mac.
- Quand un ordre est prêt : commit sur codeur2, `git push origin codeur2`, attendre le passage GitHub (commandes de CLAUDE.md, avec le jeton, sans jamais l'afficher). Le compte rendu donne l'id du passage et sa ligne RESULTAT/ÉCHECS.
- Main est rouge sur GitHub à cause de 6 tests connus (liste dans CLAUDE.md : styles, régularité, erreurs, 25 dépassements, herbe, carte calculée en fond). session-dd les corrige. Pour toi, « vert » = aucun échec EN DEHORS de ces 6.
- Tu ne fusionnes pas sur main, tu ne touches ni à ia.js ni à simulation.js ni à principal.js:405-430 (le calcul de la carte, session-dd).
- CLAUDE.md : n'y touche pas (une autre session y écrit). Tes lignes de documentation vont dans ton compte rendu ; le Chef les ajoutera.

AVANT TOUT : `git merge origin/main` dans codeur2 (main = eb312c5 : le workflow GitHub et CLAUDE.md), puis push.

ORDRES (tour plus gros : tout se vérifie avec des chiffres)

1. Les 11 textes en dur de rapports/audit-textes.md (lignes 1 à 11 du tableau), avec les clés proposées, en anglais et en français. Le nom du joueur : « You » / « Toi ». Les temps en français avec la virgule (ligne 9), partout pareil. `document.documentElement.lang` et `document.title` remplis au démarrage.
   Fini quand : tests/textes.html le vérifie (plus aucun des 11) ; ecrans.py avec ?lang=en : le classement du championnat et le podium n'ont plus aucun mot français (capture championnat-en.png).

2. sdk.js branché dans index.html, comme le prévoit CLAUDE.md (étape 15) : seul passage vers Poki, et le jeu marche sans SDK (hors Poki). Les appels au bon moment : chargement fini, début et fin de course (gameplayStart / gameplayStop), pause.
   Fini quand : tests/sdk.html vert, et un test d'écran avec le faux SDK vérifie l'ordre des appels sur une course de 1 tour ; sans SDK, console vide.

3. L'enregistreur branché dans la page (enregistreur.js, étape 13 préparée) : il enregistre la course en cours (joueur + IA), sans rien afficher encore. Mesure : poids en mémoire d'une course de 5 tours avec 20 voitures, et le temps par pas (doit rester négligeable).
   Fini quand : un test d'écran joue 1 tour avec ?ia=5&joueur=1, puis vérifie que l'enregistrement relu redonne les positions de la course à la fin (écart < 1 cm) ; chiffres de mémoire et de temps dans le compte rendu.

4. pneus.js branché MAIS DÉSACTIVÉ PAR DÉFAUT : il change l'adhérence du joueur, et c'est à le propriétaire de juger la sensation. Il s'active seulement avec `?pneus=1` (et un réglage PNEUS_ACTIFS dans donnees.js, false). Sans `?pneus=1`, la course est identique au bit près (même graine = mêmes temps).
   Fini quand : test moteur « sans pneus = identique » ; avec ?pneus=1, l'usure se voit dans ?debug=1 et un tour de 10 tours montre l'usure qui monte ; pas d'affichage de pneus pour l'instant.

HORAIRES : jusqu'à 21h. Rien de nouveau après 20h40, dernier push à 20h50 au plus tard, compte rendu complet dans rapports/tour-21b-compte-rendu.md (dans ta copie, sur codeur2) avant 20h55.
Après chaque ordre poussé et vert sur GitHub : un message court à session-76 par SendMessage (commit, id du passage, chiffres).
