TOUR 25c — étapes 6 et 9 — Codeur 3 : la voiture du joueur suit son écurie, les sponsors, la fiche des rivaux — rapport du Chef
Chef : session-5b. Base : main (ton tour 24c fusionné). Note : 80/100 (championnat 13/15).
Commit vérifié : 33f57a3 (GitHub 40046798046, TOUT PASSE). Diff relu : aucun fichier du moteur, aucun test retiré, saisons.js sans Math.pow. Captures champion.png, contrats.png, duel-saison.png, garage.png (boutons alignés) relues : propres.
Ta question, tranchée par le Chef : **OUI, la qualité de la F1 du joueur suit son écurie.** C'est la règle de CLAUDE.md (« La carrière du joueur ») et toute la carrière repose dessus (on commence dans une voiture faible, on monte par les contrats). Un réglage NIVEAU_JOUEUR_ACTIF (true) permet de le couper si le propriétaire n'aime pas la sensation ; c'est noté « à essayer par le propriétaire ».
Ce qui manque ou ne va pas :
- la qualité de la F1 du joueur (ci-dessus) ;
- les sponsors (étape 9 : « le joueur choisit et il est choisi, avec des objectifs ») n'existent pas ;
- la fiche de chaque rival (étape 6, CLAUDE.md « L'interface » : caractère, saison, historique, duels contre le joueur) n'existe pas : les rivaux sont des noms dans un classement.

ORDRES

1. LA VOITURE DU JOUEUR SUIT SON ÉCURIE : GARAGE.appliquer multiplie moteur, aéro et freins par le niveau de l'écurie du joueur (le même nombre que appliquerNiveaux pour les IA), si NIVEAU_JOUEUR_ACTIF ; la course de découverte et les pages de test hors championnat restent à 1. Le niveau apparaît au garage (« Voiture de l'écurie : 96 / 100 · tes améliorations : +0,5 % »).
   Fini quand : tests moteur (niveau 0,96 → facteurs 0,96 × améliorations ; réglage à false → 1 ; hors championnat → 1 ; changer d'écurie change la voiture dès la course suivante) ; GitHub vert.

2. LES SPONSORS (sponsors.js, calcul pur ; CLAUDE.md « Le championnat et les saisons », « L'interview » pour la jauge plus tard) :
   - entre deux saisons (après les contrats), 2 à 4 offres de sponsors inventés (noms dans textes.js, jamais une vraie marque), chacune avec un montant fixe par saison et un ou deux objectifs (« finir dans les 5 premiers à <circuit> », « 3 podiums dans la saison », « battre ton coéquipier 8 fois », « finir une course sans pénalité »…), avec une prime par objectif ; les offres dépendent de la note du joueur (les gros sponsors pour les bons pilotes) ; le joueur en choisit UN (SPONSORS_MAX = 1 pour l'instant, réglage) ;
   - l'objectif spécial du Grand Prix à domicile (CLAUDE.md « Le Grand Prix à domicile » : « podium à domicile : prime doublée », montant et plafond dans donnees.js), si le joueur a un domicile ou une course de cœur (pilote.js) ;
   - le suivi des objectifs pendant la saison (calcul pur, après chaque Grand Prix), les primes créditées par ARGENT.crediter avec leur raison, la ligne « sponsor » dans le détail des gains des résultats ;
   - l'écran des sponsors (après les contrats) : les offres, « Choisir » ; au paddock, un rappel du sponsor et de ses objectifs (fait / en cours) ; textes + fr.
   Fini quand : tests moteur (offres selon la note, un seul choisi, chaque objectif détecté sur une saison simulée, primes créditées une fois, plafonds, l'objectif à domicile seulement pour ce circuit, sauvegarde) ; ecrans.py choisit un sponsor et voit le rappel au paddock ; capture sponsors.png ; 960×600 ; GitHub vert.

3. LA FICHE DU RIVAL (étape 6) : sur l'écran du championnat, cliquer un nom ouvre sa fiche : son numéro, son écurie (couleur), son âge, son caractère en mots (rapide / régulier / agressif / fautif, d'après son caractère chiffré, seuils dans donnees.js), sa saison (points, victoires, podiums, poles), son historique (saisons, titres, meilleur classement), et ses duels contre le joueur (fois devant / derrière en course, score contre lui comme coéquipier s'il l'a été) ; la place de la « photo stylisée » laissée vide pour l'instant (le casque viendra du Codeur 2) ; « Retour ». Calcul pur dans championnat.js ou fiche.js (les mots du caractère, les duels), l'écran dans interface.js.
   Fini quand : tests moteur (les mots du caractère aux seuils, les duels comptés sur une saison simulée) ; ecrans.py ouvre une fiche et vérifie ses chiffres ; captures fiche.png, fiche-960.png ; GitHub vert.

RÈGLES : les mêmes (tes fichiers + blocs ; le Codeur 2 est sur le casque : voiture3d.js, pilote.js, interface.js en blocs ; `git merge origin/main` avant chaque push ; vert = 0 échec ; CLAUDE.md pas touché). Horaires : jusqu'à nouvel ordre du propriétaire. Un push + un message au Chef par ordre vert ; compte rendu rapports/tour-25c-compte-rendu.md à la fin.
Questions pour le propriétaire (le Codeur n'y répond pas) : la sensation de la voiture d'une petite écurie (−4 %) ; l'équilibre des contrats et des sponsors.
