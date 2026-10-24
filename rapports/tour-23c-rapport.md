TOUR 23c — étape 8 (en calcul pur) — Codeur 3 : l'argent et le garage, plus deux finitions — rapport du Chef
Chef : session-5b. Base : main (tes tours 21c et circuits fusionnés). Note : 74/100.
Commits vérifiés : 4a8e731 (21c, GitHub 40033832212), 97ac321 (circuits, GitHub 40037738133 TOUT PASSE) ; tests circuits : 49 et 45 comme avant, plages = vraie ±10 %, le huit de Suzuko admis ; aucun seuil élargi ailleurs. Bien.
Ce qui manque ou ne va pas :
- la capture duel-tour.png prise pendant le glissement des lignes (ta réponse) : la tour doit être stable avant la capture ;
- le test « Yas Marino le plus long » affirme une chose fausse (le vrai Spa est le plus long, Bahreïn plus long qu'Abou Dabi) ;
- CLAUDE.md « L'argent et les améliorations » : rien n'existe encore (étape 8). C'est ton gros morceau : du calcul pur qui se vérifie avec des chiffres, dans tes fichiers (championnat.js, sauvegarde.js, interface.js en blocs).

ORDRES

1. Finitions (petit) : (a) ecrans.py attend la fin du glissement des lignes de la tour (ORDRE_TOUR ou l'absence de transition en cours) avant duel-tour.png, et vérifie que les 20 rangs sont présents dans l'ordre ; (b) le test « le plus long » dit le vrai : Spaa le plus long, Monoco le plus court (à partir de vraieLongueur), rien d'autre retiré. Fini quand : vert sur GitHub.

2. L'ARGENT (CLAUDE.md « L'argent et les améliorations », calcul pur, nouveau fichier argent.js, sans écran) :
   - les gains d'un Grand Prix : selon la place (ARGENT_PLACE[20], du 1er au 20e), le meilleur tour (ARGENT_MEILLEUR_TOUR), les places gagnées entre la grille et l'arrivée (ARGENT_PLACE_GAGNEE par place, jamais négatif), et le bonus du duel quand le joueur finit devant son coéquipier (DUEL_BONUS, CLAUDE.md « Le duel ») ; les objectifs de sponsors viendront à l'étape 9 ;
   - tout dans donnees.js, avec un plafond par course (ARGENT_PLAFOND_COURSE) ;
   - le solde dans la sauvegarde unique (champ argent ; la course de découverte du Codeur 2 y versera un argent de départ : laisse un champ et une fonction crediter(montant, raison)) ; l'historique des gains par Grand Prix (compact) ;
   - l'écran des résultats montre l'argent gagné (ligne « + 12 500 € » avec le détail : place, meilleur tour, places gagnées, duel) ; l'écran du championnat montre le solde. Textes en + fr, nombres formatés par texte (séparateur de milliers selon la langue).
   Fini quand : tests moteur (gains pour chaque place, meilleur tour, places gagnées jamais négatives, bonus duel seulement si devant, plafond, solde après 3 GP, sauvegarde → rechargement identique, ancienne sauvegarde sans argent se charge à 0) ; ecrans.py voit l'argent gagné sur les résultats et le solde au championnat ; capture argent.png ; GitHub vert.

3. LE GARAGE (calcul pur, garage.js, sans écran ; la liste est À APPROUVER par le propriétaire, propose-la telle quelle dans le compte rendu) :
   - 4 améliorations, 5 niveaux chacune, prix croissants dans donnees.js (GARAGE) : changeurs de roues (arrêt au stand plus court : l'effet attend l'étape 7, on garde seulement le niveau), moteur (vitesse de pointe), aéro (adhérence), freins ;
   - la règle d'or : la qualité de la F1 (moteur + aéro + freins) vaut au plus +7 % au total (GARAGE_PLAFOND = 0,07), chaque amélioration a son plafond, et le facteur résultant est appliqué comme FACTEUR_VOITURE_JOUEUR l'est aujourd'hui (regarde où ce facteur agit ; si tu dois toucher physique.js, c'est une ligne × facteur avec 1 = rien, au bit près, et tu le dis) ;
   - les améliorations SUIVENT le joueur (CLAUDE.md « La carrière ») : elles sont à lui, pas à l'écurie ; dans la sauvegarde unique ;
   - acheter(amelioration) : refuse si pas assez d'argent ou niveau max ; jamais de dette ;
   - l'écran du garage : un bouton « Garage » sur l'écran du championnat ; la liste avec niveau, prix du prochain niveau, « Acheter » (grisé si impossible), le solde, et la somme des bonus (« voiture : +3,2 % / 7 % max ») ; retour au championnat. Textes + fr.
   Fini quand : tests moteur (prix, niveaux, refus sans argent, niveau max, plafond 7 % jamais dépassé quelle que soit la combinaison, le facteur résultant exact, sauvegarde) ; un test moteur « les améliorations aident un peu » : le robot avec +7 % sur le circuit test gagne entre 1 et 4 % de temps au tour, pas plus (ça vérifie la règle d'or avec un chiffre) ; ecrans.py achète une amélioration et voit le solde baisser ; capture garage.png ; 960×600 ; GitHub vert.

RÈGLES : les mêmes (tes fichiers + blocs ; ni ia.js, ni simulation.js, ni circuits.js, ni fantome.js/depart.js/course.js (Codeur 2 travaille sur l'écran titre, la course de découverte et la création du pilote dans principal.js/interface.js : ajoute tes blocs, ne réorganise rien) ; `git merge origin/main` avant chaque push ; vert = 0 échec ; CLAUDE.md pas touché). Horaires : jusqu'à nouvel ordre du propriétaire. Un push + un message au Chef par ordre vert ; compte rendu rapports/tour-23c-compte-rendu.md à la fin.
Questions pour le propriétaire (le Codeur n'y répond pas) : les 12 tracés ; la liste des améliorations.
