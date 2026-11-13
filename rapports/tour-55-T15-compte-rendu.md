# Tour 55, T15 : temps de qualification des IA réalistes (Codeur 6, branche tour-estime)

- Mesure (tests/qualif-estime.html, 14 circuits x 4 niveaux x rythmes 0,95 et 1) : un vrai tour lancé simulé dure 1,07 à 1,22 fois `tourEstime` (normal et débutant, moyenne 1,14), 1,09 en expert, 1,04 en légende.
- Correction : `echelleQualif` (ia.js), réglages `QUALIF_REALISTE` (vrai ; faux = avant au bit près), `QUALIF_ECHELLE_PENTE` 0,6, `NIVEAUX[...].qualifEchelle`. Après : rapport moyen 1,00, pire cas 0,93 à 1,07 (le test exige 8 %).
- Le joueur : le robot (62,5 s sur le circuit d'essai) part dernier avant (IA 47 à 50 s) comme après (54 à 56 s) : même zone.
- Tests : tests/qualif-estime.html (ajouté à la partie officiels de lancer.py), un test dans tests/test.html.
- Reste : une échelle par circuit réduirait l'écart résiduel de 7 %.
- Après la fusion de T11, `FANTOME_POLE_ETIRER` peut être mis à faux.
