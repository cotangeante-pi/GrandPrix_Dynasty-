TOUR 52e — compte rendu du Codeur 3
Branche : premiere-pilote (39a18e2 + ce rapport) ; ui-boutique (bf918da) à part.
Ordres : 1 (n° 6, pilotes prêts) fait / 2 (n° 5, podium de la découverte) fait / 3 (n° 11, Encore une course ?) fait.
- n° 6 : après la découverte, 3 cartes (la 1re « Toi », prénoms génériques tirés, numéro libre, pays du navigateur, course de cœur du pays sinon tirée, casque tiré) ; un clic = c'est parti ; « Personnaliser » ouvre le formulaire d'avant. « Mon pilote » (nom, numéro, pays) dans ⚙ Réglages, sans rechargement. Réglages : PILOTE_PROPOSITIONS (0 = comme avant), PILOTE_PRENOMS, PILOTE_LANGUE_PAYS.
- location.reload() de validerPilote gardé : la page est construite pour la découverte (circuit d'essai, niveau débutant, JEU.decouverte, constantes fixées au chargement), le paddock et le 1er Grand Prix demandent le championnat ; l'afficher sans recharger mélangerait les états.
- n° 5 : le podium dit « Tu finis P2 / 7 · +800 € », « Continuer », « D'abord apprendre » ; passe seul après PODIUM_DECOUVERTE_DUREE (8 s, 0 = jamais ; arrêté par la liste du tutoriel). L'écran Bravo n'existe plus.
- n° 11 : « Encore une course ? » (PODIUM_DECOUVERTE_ENCORE) recharge sur la grille ; la prime de la première course est gardée (sessionStorage) et créditée une fois à la création ; les courses suivantes n'affichent aucune prime ; decouverteFaite reste faux.
Tests Mac (sous verrou, délais Playwright élargis, Mac saturé) : test=decouverte et audit-decouverte verts (bilan du podium, passage tout seul, 3 cartes valides, 2 clics podium→paddock avec pilote valide) ; recoins « Mon pilote » ok (nom Zed, n° 88 sauvegardés) ; tests/chasse.py adapté (Continuer, Personnaliser).
Pas pu vérifier : saison-en a eu un échec d'album (clic 30 s) sous charge 100, à confirmer sur GitHub ; focus du clavier sur tactile : aucun autofocus dans le code (non testé en tactile).
Incident : un rmdir du verrou par erreur vers 17h20 (commande enchaînée après un échec).
Suite : ui-boutique (tour 52f, rapports/tour-52f-ui-boutique.md).
Réévalue.
