# Compte rendu du Codeur 2, tour 53b (suite)

- classement-doigt : au doigt (body.tactile), un appui sur un classement de pilotes (page Course, page Saison) ouvre la liste entière, des lignes de 40 px qui
  défilent ; un appui sur une ligne ouvre la fiche du rival ; « Retour » referme. Rien ne change au clavier ni à la souris (interface.js preparerClassementPlein, style.css).
- Audit de l'anglais en 640×360, 960×600 et 1280×720 (titre, Entre amis, découverte, podium, création du pilote, sections du paddock, Apprendre, qualification et course du
  Grand Prix 1) : aucun mot français ni texte coupé ; corrigés : « team-mate » devenu « teammate » partout (cohérence), les 20 lignes du classement en course et les 7 leçons
  d'Apprendre tiennent maintenant en 640×360 à la souris. L'écran « Tourne ton téléphone » n'a pas de texte (seulement une icône).
- tests/ecrans.py : nouvelles pages audit-paddock (640, 960, 1280) et audit-decouverte en 640 et 1280.
