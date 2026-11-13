TOUR 55 T6 — compte rendu du Codeur (le fantôme du poleman)
Branche : fantome-poleman
Fait : fantome-pole.js (FANTOME_POLE.tour) simule le tour du pilote en pole (une IA seule, régulière, départ arrêté 250 m avant la ligne, son rythme et son style), déterministe, la course et la grille ne bougent pas ; bouton « Fantôme : ton record / la pole » à l'écran de qualification (option fantome_pole, défaut « ton record » = jeu d'avant) ; après le tour, l'écart au fantôme de la pole ; FANTOME_POLEMAN (faux = avant), FANTOME_POLE_ETIRER (faux), FANTOME_POLE_DUREE_MAX. Textes fr/en.
Mesuré : technique 437 ms, 620 images, 17 Ko, tour simulé 61,9 s pour une grille à 53,5 s (+16 %, parce que le tour simulé part de l'arrêt et que l'estimation de la grille n'en tient pas compte) : pas étiré par défaut.
Tests : tests/test.html « fantôme du poleman » 3/3 en local ; tests/ecrans.py test=qualif (le bouton, le tour de la pole) : GitHub tranche (verrou du Mac occupé).
CLAUDE.md : « Le fantôme du poleman ».
