# Tour 55, T11 : fantôme du poleman lancé (Codeur 6, branche fantome-pole-lance)

- fantome-pole.js : `FANTOME_POLE_LANCE` (donnees.js, vrai) : un tour d'élan puis le tour chronométré lancé (course de 2 tours, le fantôme n'enregistre que le second). Faux = le tour parti de l'arrêt de T6.
- Mesure : le tour lancé simulé dure 62,1 s (pole 53,6 s) sur technique et 54,8 s (47,5 s) sur test ; rythme du poleman x1,2 : 57,8 s au mieux. La voiture ne sait pas faire le temps estimé de la grille (tourEstime ignore accélérations et freinages, environ 16 %).
- Donc `FANTOME_POLE_ETIRER` est maintenant vrai par défaut : le tour simulé est étiré au temps de la pole, écart 0 s (cible < 0,5 s). Faux = le vrai tour simulé.
- Test chiffré : tests/test.html « fantôme du poleman » (lancé, écart à la pole < 0,5 s, non étiré, LANCE faux, déterminisme, course non touchée). tests/ecrans.py test=qualif inchangé.
- Piste pour la suite : corriger l'estimation de la grille si l'on veut une pole atteignable (change tous les temps de qualification).
