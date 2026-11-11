# Tour 53e, compte rendu du Codeur 6

- ui-course : fusionnée (page Course en deux lignes).
- ui-apprendre : fusionnée (prochaine leçon en grand, écran opaque).
- ui-saison (d8a374c, 18/18) : une ligne « Saison N · i courses sur n faites · place », trois tuiles (Calendrier, Album, Arbre), titres de classements en doré. Texte saisonEtat en fr et en en.
- ui-coherence (a4f19f2, 18/18) : pages du paddock depuis le haut, icône du menu devant chaque titre, bouton principal rouge de la Boutique, liste Apprendre en 640x360, bulle d'aide en bas et sans clic en 640x360.
- Entre amis : non touchée (Codeur 5). Les titres de pages (24 px) sont cohérents ; la page Course a son titre de Grand Prix en 32 px.

- ui-course (835c35f, 18/18) : page Course du paddock en deux lignes. Le prochain Grand Prix en grand (titre 32 px), « Course suivante » en pleine largeur dessous, classement des pilotes et messages en dessous, duel et messages plus discrets. Vérifié en fr et en en 640x360, 960x600, 1280x720. Aucune règle ni nom changé.
- ui-apprendre (428f497, 18/18) : liste « Apprendre à piloter ». La prochaine leçon à faire est en grand (cadre doré, gros bouton rouge « Commencer ▶ »), les leçons faites sont atténuées, l'écran est opaque, textes plus grands (16/13 px, 14/12 px en petit écran). interface.js (classes tutoSuivant, tutoFaite) et style.css.
- À savoir : en 640x360 le titre de la liste est coupé en haut (c'était déjà le cas avant).
