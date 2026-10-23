TOUR 21c — Codeur 3 (session-a7) : le duel contre le coéquipier et la une du journal — rapport du Chef
Chef : session-76. Codeur 1 : session-dd (les IA). Codeur 2 : session-9e (textes, SDK, enregistreur, pneus). Codeur 3 : toi, donné par le propriétaire le 2026-10-23 à ~16h50.
Base : main 1ac2b36. Note actuelle : 62/100. Lis CLAUDE.md en entier avant de commencer (surtout « Le duel contre le coéquipier », « La une du journal », « La technique », « Règles de code », « Aller plus vite : les tests sur GitHub »), puis SUIVI.md.

COMMENT ON TRAVAILLE À QUATRE
- Tu travailles UNIQUEMENT dans ta copie : …/jeu/jeux poki/Grand Prix Dynasty - codeur 3 (git worktree, branche codeur3, déjà poussée sur GitHub). Jamais dans « Grand Prix Dynasty » (Codeur 1) ni « Grand Prix Dynasty - codeur 2 ».
- Le Mac est petit (2 cœurs). Sur le Mac, seulement `moteur` (et `ecrans` une fois, à la fin d'un ordre qui se voit), TOUJOURS sous le verrou :
    while ! mkdir /tmp/gpd-tests.lock 2>/dev/null; do sleep 10; done; python3 tests/lancer.py moteur; rmdir /tmp/gpd-tests.lock
  Après chaque passage : 0 Chrome --headless restant.
- GITHUB ACTIONS : la suite complète tourne sur GitHub à chaque push. Quand un ordre est prêt : commit sur codeur3, `git push origin codeur3`, puis lis le passage GitHub de TON commit (commandes dans CLAUDE.md, avec le jeton du trousseau, sans jamais l'afficher ; une vérification toutes les 30 s au plus). Main a aujourd'hui 6 échecs connus sur GitHub (liste dans CLAUDE.md : styles, régularité, erreurs, 25 dépassements, herbe, carte calculée en fond ; session-dd les corrige). Pour toi, « vert » = aucun échec EN DEHORS de ces 6. Ton message au Chef donne l'id du passage et sa ligne RESULTAT/ÉCHECS.
- Tu ne fusionnes pas sur main : c'est le Chef, après lecture du passage GitHub.
- Fichiers : tu ne touches PAS à ia.js, simulation.js, physique.js (Codeur 1), ni à sdk.js, enregistreur.js, pneus.js (Codeur 2). Le Codeur 2 modifie aussi textes.js et interface.js (les textes en dur) : dans textes.js, interface.js, style.css, index.html, donnees.js, championnat.js, sauvegarde.js, tu AJOUTES tes lignes en blocs à toi, sans réorganiser ni reformater le reste, pour que la fusion soit simple.
- CLAUDE.md : n'y touche pas (une autre session y écrit des idées). Tes lignes de documentation vont dans ton compte rendu ; le Chef les ajoutera.
- Tous les noms de pilotes et d'écuries sont provisoires (le propriétaire ne les a pas encore choisis) : utilise ceux de donnees.js tels qu'ils sont.

ORDRES (tour plus gros : tout se vérifie avec des chiffres)

1. LE SCORE DU DUEL CONTRE LE COÉQUIPIER (calcul pur, dans le module du championnat, CLAUDE.md « Le duel contre le coéquipier », partie étape 6) :
   - le coéquipier = l'autre pilote de l'écurie du joueur ;
   - qualifications : +1 à celui qui part devant ; course : +1 à celui qui finit devant au classement FINAL (pénalités comprises, classementFinal) ; non classé = perd le point ;
   - score par saison (repart de 0 au début d'une saison : prévois le champ même si les saisons n'existent pas encore), total de carrière contre chaque coéquipier dans les statistiques ;
   - dans la sauvegarde unique (sauvegarde.js : numéro de version augmenté, une ancienne sauvegarde sans duel se charge sans rien perdre).
   Fini quand : tests moteur : qualif, course, non classé, pénalité qui inverse l'ordre, remise à 0, total de carrière, sauvegarde → rechargement identique, ancienne sauvegarde transformée.

2. LE DUEL À L'ÉCRAN dans ?championnat=1 :
   - en course, la ligne du coéquipier marquée dans la tour de classement (couleur de l'écurie), avec l'écart en temps entre le joueur et lui ;
   - sur l'écran entre les courses : « Toi 4 – 2 <nom> » (qualifs et courses séparées si la place le permet).
   Textes dans textes.js, anglais et français. Fini quand : ecrans.py (2 Grands Prix de 1 tour, ?championnat=1&tours=1) vérifie la ligne marquée et le score affiché, capture duel.png ; console vide ; 960×600 et 1280×720 sans défilement.

3. LA UNE DU JOURNAL, calcul pur (nouveau fichier journal.js, sans Three.js ni DOM, CLAUDE.md « La une du journal ») :
   - le grand titre vient des faits connus aujourd'hui, par priorité réglable dans donnees.js : première victoire, victoire, premier podium, podium, record (meilleur résultat de carrière), duel contre le coéquipier gagné ou perdu nettement, pénalité qui coûte une place, série de mauvais résultats, le leader du championnat qui s'envole ; sinon, le vainqueur de la course ou du championnat ;
   - plusieurs titres par fait, tirés par hasard() (graine), jamais le même titre deux courses de suite ;
   - un petit texte de deux lignes, 2 ou 3 brèves sur les rivaux (rival en grande forme, écurie qui progresse ; PAS de rumeurs de transfert : elles viendront avec l'étape 9) ; aucune information cachée de course ;
   - le nom du journal inventé (jamais un vrai journal) ; ton enthousiaste ou piquant, jamais moqueur envers le joueur ;
   - l'album : chaque une rangée en forme COMPACTE (clé du titre + paramètres), dans la sauvegarde ; une ancienne sauvegarde sans album se charge.
   Fini quand : tests moteur : le bon titre pour chaque fait, la priorité, pas deux fois le même titre de suite, l'album rechargé redonne exactement les mêmes unes, toutes les clés dans les deux langues ; la taille de l'album pour 12 Grands Prix × 15 saisons (simulé) donnée dans le compte rendu.

4. LA UNE À L'ÉCRAN dans ?championnat=1 : après les résultats, avant l'écran entre les courses ; on la passe d'un clic ou d'une touche. Page HTML/CSS avec son propre style de journal : grand titre, petit texte, brèves sur le côté, en bas le haut du classement (5 premiers + le joueur). La « photo » viendra plus tard (laisse sa place, sans image enregistrée).
   Fini quand : ecrans.py voit la une après un Grand Prix, le clic mène à l'écran entre les courses ; captures une.png et une-en.png (?lang=en, aucun mot français) ; console vide ; 960×600 et 1280×720 sans défilement.

Si 1 à 4 sont verts avant 20h : propose (sans le faire) dans ton compte rendu le prochain bloc (titres sur l'interview quand elle existera, photo dessinée par le code).

HORAIRES : jusqu'à 21h. Rien de nouveau après 20h40, dernier push à 20h50 au plus tard, compte rendu complet dans rapports/tour-21c-compte-rendu.md (sur codeur3) avant 20h55.
Après chaque ordre poussé et vert sur GitHub : un message court à session-76 par SendMessage (commit, id du passage, chiffres).
