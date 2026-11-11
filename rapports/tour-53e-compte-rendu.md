# Tour 53e, compte rendu du Codeur 6

- ui-course : fusionnée (page Course en deux lignes).
- ui-apprendre : fusionnée (prochaine leçon en grand, écran opaque).
- ui-saison (d8a374c, 18/18) : une ligne « Saison N · i courses sur n faites · place », trois tuiles (Calendrier, Album, Arbre), titres de classements en doré. Texte saisonEtat en fr et en en.
- ui-coherence (a4f19f2, 18/18) : pages du paddock depuis le haut, icône du menu devant chaque titre, bouton principal rouge de la Boutique, liste Apprendre en 640x360, bulle d'aide en bas et sans clic en 640x360.
- Entre amis : non touchée (Codeur 5). Les titres de pages (24 px) sont cohérents ; la page Course a son titre de Grand Prix en 32 px.

- ui-course (835c35f, 18/18) : page Course du paddock en deux lignes. Le prochain Grand Prix en grand (titre 32 px), « Course suivante » en pleine largeur dessous, classement des pilotes et messages en dessous, duel et messages plus discrets. Vérifié en fr et en en 640x360, 960x600, 1280x720. Aucune règle ni nom changé.
- ui-apprendre (428f497, 18/18) : liste « Apprendre à piloter ». La prochaine leçon à faire est en grand (cadre doré, gros bouton rouge « Commencer ▶ »), les leçons faites sont atténuées, l'écran est opaque, textes plus grands (16/13 px, 14/12 px en petit écran). interface.js (classes tutoSuivant, tutoFaite) et style.css.
- À savoir : en 640x360 le titre de la liste est coupé en haut (c'était déjà le cas avant).

## Chasse aux bugs (branche chasse-53, 18/18)

Le nouveau joueur joué de bout en bout (titre, découverte, podium, pilote, paddock, Grand Prix 1 en 3 tours, après-course, Grand Prix 2) par tests/chasse53.py : au clavier en 1280x720 fr (rien trouvé, 17/17), au doigt en 640x360 en (tactile émulé). Pas de manette : aucun test de la chaîne entière ne le permet. `python3 tests/chasse53.py hud` ne lance que la vérification des éléments qui se marchent dessus en course.

Bugs corrigés (tous au doigt en 640x360, style.css) :
1. Réglages : « Nouvelle carrière » sortait de l'écran (bas à 369 px), puis, avec la section Volant arrivée de main, à 379 px. Six colonnes, boutons de 40 px, la page défile au besoin.
2. Course : « Ouvrir les messages » sortait de l'écran (373 px) ; marges serrées.
3. Course en direct : « Tiens GAZ » passait sous les boutons 🔊 ⏸ ↩ ; il est descendu sous eux et plus petit.
4. Course en direct : les écarts de la tour de classement (« +0,3 s ») revenaient à la ligne (« s » seul sur la ligne suivante) ; ils tiennent sur une ligne.
5. Course en direct : la prime recouvrait le message de course de 7 px ; remontée de 12 px.
Vérifications ajoutées : tests/chasse53.py (boutons dans l'écran et sans recouvrement à chaque écran du parcours, aucun chevauchement en course, écarts sur une ligne).

Pas des bugs, à savoir : le rétroviseur passe brièvement sur le chronomètre quand la ligne « Tour précédent » apparaît (relu toutes les 0,5 s) ; tests/chasse53.py n'est pas dans le workflow (13 minutes sur GitHub si on l'y met).
Gros défauts : aucun trouvé.
