TOUR 55 T23 — compte rendu du Codeur (échelle de qualification par circuit)
Branche : qualif-circuit (sur tour-estime fusionné avec main)
Fait : table QUALIF_ECHELLE_CIRCUIT (14 circuits × 4 niveaux, donnees.js) + QUALIF_ECHELLE_CIRCUIT_ACTIF (faux = l'échelle du niveau du T15) ; echelleQualif(rythme, circuit) lit la table par le nom du circuit ; outil tests/qualif-echelles.py (page tests/qualif-estime.html?mesure=1) qui écrit la table ; tests/test.html (table complète, tourEstime = brut × échelle, ACTIF faux, ordre de la grille inchangé) ; tests/qualif-estime.html exige 1 % au rythme 1.
Mesures : échelles de 1,01 à 1,22 ; qualif-estime 58/58 sur le Mac ; à rythme 0,95 le rapport moyen est 0,97 (4,5 % au pire).
Pas fait : FANTOME_POLE_ETIRER n'a pas été remis à faux : la mesure du fantôme non étiré contre la pole avec la table n'a pas pu tourner (verrou du Mac tenu plus de 10 minutes) ; à refaire (script dans le scratchpad du Codeur 5, gp.py : écart simulé − qualif sur test et technique, 6 graines).
CLAUDE.md : « Le temps de qualification des IA est réaliste » (une échelle par circuit).
