TOUR 24c — étape 9 (en calcul pur), première partie — Codeur 3 : la fin de saison, les contrats, les rivaux qui évoluent — rapport du Chef
Chef : session-5b. Base : main (ton tour 23c fusionné). Note : 76/100 (championnat 10/15).
Commit vérifié : e1b008b (GitHub 40042696042, TOUT PASSE). Diff relu : physique.js = 3 facteurs × 1, robot.js = 2 lignes, le test « le plus long » dit le vrai, aucun seuil élargi. Captures argent.png, garage.png, garage-960.png, duel-tour.png (la tour complète, 1 à 20) relues. Bien.
Ce qui manque ou ne va pas :
- garage.png : sur la ligne « Changeurs de roues », le bouton « Acheter » déborde de sa ligne à droite (le texte de l'effet est plus long) : à aligner (finition) ;
- rien n'existe de l'étape 9 (CLAUDE.md « Le championnat et les saisons », « Le duel » parties étape 9, « La carrière du joueur »). Une saison de 12 GP se termine aujourd'hui sans suite. C'est ton gros morceau, en calcul pur, dans le module du championnat ou un fichier saisons.js.

ORDRES

1. Finition : le bouton « Acheter » aligné sur les 4 lignes du garage, aux deux tailles. Fini quand : capture garage.png refaite, GitHub vert.

2. LA FIN DE SAISON (saisons.js, calcul pur) : quand le 12e Grand Prix est enregistré :
   - le champion des pilotes et des écuries ; les statistiques de carrière (titres, saisons courues) ;
   - l'écran de fin de saison, dans cet ordre : le classement final avec le champion mis en valeur (« CHAMPION ! » si c'est le joueur), puis l'écran du duel (« Tu as battu <coéquipier> 9 à 3 » : qualifs et courses), puis les contrats (ordre 3), puis la saison suivante ; la une spéciale du champion (JOURNAL : fait titreChampion, déjà prévu) ;
   - la remise à 0 du score du duel pour la nouvelle saison, le total de carrière gardé ;
   - la retraite anticipée : un bouton « Prendre ma retraite » sur l'écran des contrats (confirmation), qui mène pour l'instant à un écran simple « Carrière terminée : N saisons, X victoires, Y podiums, Z titres » (le vrai bilan est l'étape 14) ; la retraite par l'âge après SAISONS_MAX = 15 saisons (donnees.js) ;
   - la saison suivante : saison + 1, points à 0, calendrier reconstruit, l'historique de la saison gardé compact (classement final, champion, duel) dans la sauvegarde.
   Fini quand : tests moteur (le 12e GP enregistré déclenche la fin ; champion juste, y compris à égalité par la règle de départage existante ; duel remis à 0 et total gardé ; saison + 1 avec points à 0 ; retraite à 15 saisons ; sauvegarde → rechargement identique ; ancienne sauvegarde se charge) ; ecrans.py joue une saison de 12 GP d'un tour en ?championnat=1&tours=1 (ou un raccourci ?gp=12 pour arriver au 12e, dis lequel) et voit les écrans ; captures champion.png, duel-saison.png ; 960×600 ; GitHub vert.

3. LES CONTRATS (saisons.js, calcul pur ; CLAUDE.md « Le championnat et les saisons », « Le duel » étape 9, « La carrière du joueur ») :
   - entre deux saisons, chaque écurie note le joueur : ses points, son classement, et son duel contre le coéquipier (poids CONTRAT_POIDS_DUEL dans donnees.js), plus la confiance de l'écurie (champ gardé à 50 pour l'instant, les consignes d'équipe viendront) ; les écuries dont la note demandée est atteinte font une offre ; l'écurie actuelle propose toujours de garder le joueur si sa note le permet, sinon elle le laisse partir (au moins une offre existe toujours : la plus faible écurie accepte toujours, règle de donnees.js) ;
   - battre nettement son coéquipier dans une petite écurie doit pouvoir valoir une offre d'une écurie plus forte, même sans podium : un test le vérifie ;
   - le joueur choisit : la qualité de la F1 devient celle de la nouvelle écurie (niveau de l'écurie), ses améliorations du garage le suivent ; le coéquipier change ; la couleur de la voiture aussi ;
   - l'écran des contrats : les offres (écurie, niveau, coéquipier, un mot sur l'écurie), « Signer », et « Prendre ma retraite ».
   Fini quand : tests moteur (note du joueur, offres selon la note, toujours au moins une offre, l'effet du duel sur les contrats, changement d'écurie : niveau et coéquipier changent, les améliorations restent, sauvegarde) ; ecrans.py signe un contrat et voit la nouvelle écurie au championnat ; capture contrats.png ; GitHub vert.

4. LES RIVAUX QUI ÉVOLUENT (saisons.js, calcul pur, avec hasard() et la graine) : entre deux saisons :
   - chaque pilote IA a un âge (tiré à la création, gardé) ; les jeunes progressent (rythme +), les anciens baissent puis prennent leur retraite (AGE_RETRAITE, avec un peu de hasard) ; un nouveau pilote arrive à chaque départ (nom null → texte par défaut avec un numéro libre, caractère tiré, âge jeune) ; le groupe reste à 19 ;
   - quelques pilotes changent d'écurie (TRANSFERTS_PAR_SAISON), jamais le coéquipier du joueur pendant la saison ;
   - les écuries montent ou baissent en niveau selon leur classement (NIVEAU_EVOLUTION, bornes) ;
   - les rivaux retraités gardent un résumé compact (nom, totaux, titres) ; rien n'est perdu pour l'étape 14 ;
   - le journal : des brèves sur ces faits (un pilote proche de la retraite, une écurie qui progresse) ; les rumeurs de transfert viendront après.
   Fini quand : tests moteur sur 15 saisons simulées (simulerGrandPrix existe) : le groupe reste à 19 IA, des retraites et des arrivées ont lieu, les niveaux restent dans les bornes, les meilleurs rythmes ne sont pas toujours les mêmes pilotes d'une saison à l'autre, le coéquipier du joueur ne change pas en cours de saison, sauvegarde ; la taille de la sauvegarde après 15 saisons, dans le compte rendu ; GitHub vert.

RÈGLES : les mêmes. Le Codeur 2 travaille sur l'écran titre, la course de découverte et la création du pilote (principal.js, interface.js, pilote.js, decouverte.js) : tes blocs à toi dans les fichiers partagés, `git merge origin/main` avant chaque push, et si la création du pilote arrive sur main avant tes contrats, le nom du joueur vient de là. Ni ia.js, ni simulation.js, ni physique.js (le niveau d'écurie passe déjà par appliquerNiveaux). CLAUDE.md pas touché. Horaires : jusqu'à nouvel ordre. Un push + un message au Chef par ordre vert ; compte rendu rapports/tour-24c-compte-rendu.md à la fin.
Questions pour le propriétaire (le Codeur n'y répond pas) : la liste du garage et les montants ; les noms des 20 pilotes et des 10 écuries (toujours provisoires).
