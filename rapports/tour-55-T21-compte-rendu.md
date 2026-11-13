# Tour 55, T21 : test de la manette stable (Codeur 6, branche manette-stable)

- Test visé : tests/ecrans.py, test=manette, « Y change la caméra » (échecs rares sur GitHub).
- Cause probable : l'appui de Y était tenu 350 ms de temps de mur ; sur une machine chargée (swiftshader), une image du jeu peut durer plus que cela, et l'appui entier (enfoncé et relâché) tombe entre deux lectures de la manette : le front montant n'est jamais vu.
- Correction du TEST (le jeu et ce qu'il vérifie ne changent pas) : Y est tenu jusqu'à ce que la page ait dessiné 2 images ET 350 ms, puis relâché de même. Pas de répétition de l'appui (la caméra changerait deux fois).
- manette_appui (la croix dans le menu pause) n'est pas touché : essayé avec des attentes par images, le menu pause ne se parcourait plus de la même façon (la croix répète au-delà de 0,4 s, MANETTE_REPETITION) et le test « la croix choisit un bouton » tombait.
- Mesure : test=manette 1280 vert en local (14/14) ; passage GitHub : voir le message au Chef.
