TOUR 56 — compte rendu du Codeur 5 — T10 : le téléphone en ligne (course)
Branche : enligne-tactile (enligne-course + main + enligne-ecrans-2), PAS VERT, pas testé sur GitHub

Fait :
- body.enligneCourse (posée par principal.js quand la page est une course en ligne) cache le bouton ⏸ du téléphone : il n'y a pas de pause en ligne.
- Pas d'aide de pilotage en ligne : le pas de course en ligne (enligne-page.js) lit JEU.cibles brut, sans passer par les aides (choix par construction, réversible).
- tests/enligne-course.py : une fonction tactile() (téléphone émulé : un vrai doigt tenu sur GAZ fait rouler SA voiture contre un robot, aucune désynchro, pas de pause, pas d'aide), lancée dans la suite 'court'. Pas encore passée : la salle de l'hôte (page tactile 640×360) ne s'ouvrait pas en 30 s sur le Mac chargé ; un diagnostic est ajouté (attente 90 s, état de la page imprimé). À relire au premier passage GitHub : si elle échoue, le détail est dans la sortie.
Déjà vert (branche enligne-ecrans-2, run 43621497559) : D1, D2, manette en salle, écrans En ligne dans le jeu tourné.
