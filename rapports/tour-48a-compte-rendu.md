TOUR 48a — compte rendu du Codeur 1 (le nouveau paddock)
Commit : 8b6c730 (branche paddock, origin/main 96714f9 fusionné dedans) — GitHub 42122834960 : vert, 16/16
Ordres :
  1. Le menu à gauche + la page Course — fait (c44770b) : Course, Mon équipe, Boutique, Saison, Messages ●, Entre amis, ⚙ Réglages, ? Apprendre ;
     la page Course : le prochain Grand Prix (numéro, circuit, météo, domicile, carte), ta place et ton duel, le classement réduit (3 premiers,
     toi ± 1, le coéquipier, « … » entre les trous, « Voir tout » → Saison), la carte des messages, un seul gros bouton rouge « Course suivante ».
     Petits écrans : sous 1100 px de large, le menu devient une colonne d'icônes (nom en bulle) ; 640×360 serré.
  2. Les autres pages — fait : les anciens boutons gardent leur id et sont rangés (Mon équipe : garage, Ma voiture, sponsors, casque, argent,
     sponsor, réputation ; Saison : calendrier, album, arbre, classements complets ; Messages : courrier, coéquipier, direction ; Réglages : son
     (« Son : oui / coupé » + les 3 volumes), aides au pilotage, revoir les aides, qualité). Plus rien dans les coins ; 🔊 caché au paddock.
     Après la fusion de main : « Ma voiture » du Codeur 3 est dans Mon équipe, sa boutique s'ouvre depuis la page Boutique (« 🛒 Ouvrir la
     boutique », avec deux lignes d'explication) ; le garage n'a plus ces deux boutons ; le retour de l'essai d'un skin revient sur la page Boutique.
  3. « Nouvelle carrière » et « Nouvelle carrière à 0 » — fait : dans Réglages, deux temps chacune (« Tout recommencer ? … » puis « Oui,
     recommencer » ; à 0 en rouge avec la liste de ce qui part) ; « Annuler » ne change rien. Nouvelle carrière : monde neuf, argent et garage à 0,
     création du pilote sans découverte ; temple, records, motifs, skins, célébrations, leçons, aides vues, réglages gardés ; la carrière
     abandonnée entre au temple si la saison en cours est après celle du début. À 0 : sauvegarde vierge sauf son_volumes et qualite, page nue →
     écran titre → « ▶ Jouer » → découverte.
Sortie des tests : GitHub 42122834960 vert 16/16. Nouvelle page de tests tests/ecrans.py test=paddock (fr, en ; 1280×720, 960×600, 640×360) :
  menu et noms, chaque bouton dans sa page, chaque page dans l'écran sans défilement ni bouton coupé, pas de mot français en anglais, « Course
  suivante » visible, classement réduit, page gardée au retour du garage, confirmation qui tient en 640×360, les deux nouvelles carrières.
  Mis à jour : paddock_ecran, aides-menus, la visite du tutoriel, la personnalisation (Codeur 3), paquet.py (chaque page lue), chasse.py
  (saison.py, recoins.py : la page d'un bouton ouverte par le menu, chaque page inspectée). lancer.py : ecrans.py à 900 s au lieu de 600.
Mesures : captures tests/captures/paddock-<page>-<fr|en>-<1280|960|640>.png, paddock-confirmation-…, paddock-zero-… (artefacts GitHub).
Choix réversibles pris (le propriétaire ne répondant pas) : la page choisie reste au retour d'un écran (une page rechargée repart de Course) ;
  à 0, seuls le son et la qualité restent (la langue n'est pas sauvegardée) ; pendant la confirmation, seule la carte « La carrière » reste ;
  « Entre amis » et « ? Apprendre » ouvrent directement leur écran (pas de page).
Ce que je n'ai pas pu vérifier : la manette dans le menu (pas de vraie manette) ; un vrai téléphone ; le garage lui-même ne tient pas en
  640×360 (son « Retour » sort de l'écran, écran existant pas réécrit : à reprendre à part).
Réévalue.
