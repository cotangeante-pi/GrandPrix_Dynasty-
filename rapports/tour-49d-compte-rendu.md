TOUR 49d — compte rendu du Codeur 4 (les divisions, étape 10)
Commit : 1dd4b8d (branche divisions), GitHub 42146146232 : completed success (18 travaux)
Ordres : les divisions 4, 3, 2, 1 fait (niveau des IA, force des voitures, montée, écran qui l'annonce) / écuries et pilotes par division pas fait (noté plus bas)

Ce qui est fait :
- divisions.js (calcul pur) : DIVISIONS.de(ch), completer, appliquer(division), retablir(), finSaison(ch, entree, place).
- donnees.js : DIVISIONS_ACTIVES (false = la carrière comme avant), DIVISIONS { 4: débutant, puissance ×0,85, adhérence ×0,98 ;
  3: normal, ×1, ×1 (le jeu d'avant) ; 2: expert, ×1,07, ×1,01 ; 1: légende, ×1,14, ×1,03 }, DIVISION_DEPART 4, DIVISION_VIEILLE 3,
  DIVISION_MONTEE_PLACE 3, DIVISION_DESCENTE false. Choix du Chef, réversibles.
- La division s'applique au chargement de la page de carrière (principal.js), avant la carte et la course : REGLAGES.NIVEAU, et
  PUISSANCE, FORCE_MOTEUR_MAX, ADHERENCE pour toutes les voitures (joueur compris). La clé du cache de la carte des IA contient ces
  réglages : la carte est recalculée par division, les IA profitent de leur voiture autant que le joueur. ?niveau= passe toujours devant
  (tests) ; ?division=1..4 essaie une division sur une page, sans rien sauvegarder.
- Une carrière neuve : division 4 (CHAMPIONNAT.creer). Une sauvegarde d'avant : division 3 (completer), rien d'autre ne change.
- La montée : SAISONS.terminerSaison (une fois par saison) : dans les 3 premiers du championnat pilotes, division − 1 ; jamais de descente ;
  gardée dans l'historique de la saison (division, montee).
- À l'écran : fin de saison « ⬆ Montée : la saison prochaine en division N ! » (ou « Division N : finis dans les 3 premiers pour
  monter. », « Division 1 : le sommet. ») ; au paddock « Classement des pilotes · Division N ». Textes en + fr.

Sortie des tests :
- Mac, sous le verrou, tests/lancer.py moteur : RESULTAT 353/353 (PARTIE OK : moteur), dont les 3 nouveaux tests des divisions
  (carrière neuve en 4, vieille sauvegarde en 3 sans rien perdre, montée/jamais de descente, niveau et vitesse par division, division 3
  au bit près, une carte par division, une course IA en D4 et en D1 où tout le monde finit).
- GitHub 42146146232 : vert. Le passage d'avant (17e9ab2) avait 2 tests d'écrans à adapter : le titre des pilotes devient
  « Drivers · Division 4 » ; le caractère des IA est comparé × le niveau (débutant : régularité × 1,5).

Mesures : vitesse max D4 311, D3 329, D2 336, D1 344 km/h ; meilleur tour des IA sur le technique (1 tour, 4 IA) D4 64,64 s, D1 55,37 s.

Pas fait / ce que je n'ai pas pu vérifier :
- Des écuries et des pilotes propres à chaque division (les meilleurs qui montent aussi) : pas fait ce soir ; aujourd'hui le joueur
  monte avec le même plateau, qui change de niveau et de voitures.
- La sensation en D1 (voitures surpuissantes) et en D4 : à essayer par le propriétaire (?division=1, ?division=4).
- Une nouvelle carrière en D4 allume les aides du débutant par défaut (comme le niveau débutant d'avant).
Réévalue.

---

TOUR 49d-2 — compte rendu du Codeur 4 (l'argent selon la division)
Commit : d0ed4f3 (branche divisions, repartie de main 804faf7 par une fusion), GitHub 42153432081 : completed success (18 travaux)
Ordres : gains, sponsors, prix du garage selon la division fait / écuries et pilotes propres à chaque division pas fait (pourquoi plus bas)

Ce qui est fait :
- DIVISIONS[d].argent et .garage (donnees.js) : D4 0,6 ; D3 1 (le jeu d'avant, au bit près) ; D2 1,5 ; D1 2,2. DIVISIONS.facteur(ch, cle) et
  DIVISIONS.echelle(x, ch, cle) (× le facteur, arrondi à 100 € ; x tel quel quand le facteur vaut 1).
- argent.js (gains) : la place, le meilleur tour, les places gagnées, le duel et le plafond de la course × argent (le bonus sans aide suit).
- sponsors.js (offres) : le montant de la saison et les primes des objectifs (domicile compris) × argent.
- garage.js (prix) : chaque niveau × garage.
- Mesures : une 3e place rapporte D4 25 200 €, D3 42 000 €, D2 63 000 €, D1 92 400 € ; le moteur niveau 1 coûte 15 000 / 25 000 / 37 500 / 55 000 €.

Sortie des tests :
- test.html : un test de plus (les trois montants croissent de D4 à D1 ; D3 = une sauvegarde d'avant ; arrondis à 100 € ; coupées : le jeu
  d'avant). Les championnats de test.html sont mis en division 3 (le jeu d'avant : les montants exacts des tests de l'argent, du garage et
  des sponsors restent vrais) ; les tests des divisions remettent DIVISION_DEPART (4) le temps de leur essai. Mac, sous le verrou :
  358/359 au premier passage (mon test comparait au réglage remis à 3, corrigé) ; la page dépasse les 300 s de lancer.py sur le Mac
  chargé (294 à 301 s), elle a été relancée avec 600 s ; GitHub : vert.
- ecrans.py : les deux tests du garage (le solde baisse du prix, le solde = gains − achats) lisent GARAGE.prix et DIVISIONS.echelle au
  lieu des prix de base (une carrière neuve est en division 4).

Pas fait :
- Des écuries et pilotes propres à chaque division (les meilleurs qui montent avec le joueur) : il faudrait 4 plateaux dans la sauvegarde
  et toucher le championnat, les saisons, les fiches, le journal et les contrats ; trop risqué avant 23h30. Aujourd'hui, le joueur monte
  avec les mêmes 19 rivaux, qui prennent le niveau et les voitures de la nouvelle division.
- Les salaires des patrons (patrons.js) ne changent pas avec la division.
Réévalue.
