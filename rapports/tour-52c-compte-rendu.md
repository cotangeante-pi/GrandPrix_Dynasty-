TOUR 52c : compte rendu du Codeur 4 (branche voix-liste), exclamations Bark
Rien n'est branché dans le jeu. Voix : Bark (MIT), voix fr intégrées seulement.
1. Taux de réussite (part des prises que Whisper comprend), mesuré sur la vraie liste (stats_variantes.py) :
   voix fr 7 : 27/86 (31 %) ; voix fr 4 : 10/73 (14 %) -> la voix 7 seule désormais.
   Texte envoyé avec « — » devant : 5/17 (29 %), pas mieux. Avec « ... » derrière : 0/12, pire. Une prise sur 3 environ reste le plafond de Bark petit modèle.
   (essai_taux.py, 4 phrases courtes en voix 3/6/9/0, températures : abandonné, une prise coûtait 5 à 10 min quand le Mac était saturé.)
2. Bark voix 7, variantes en rotation (bark_liste.py --variantes, --bonnes), Whisper, liste_page.py : peu de prises neuves (la machine était saturée de 17h à 20h, puis le suivi a été interrompu trop tôt).
   Résultat : 15 prises gardées (note >= 0,7), 13 phrases sur 40 couvertes, 27 sans prise gardée. Objectif « 1 bonne prise par phrase » NON atteint.
3. Page d'écoute hors dépôt : scratchpad/voix/liste/ecoute.html, 17 fichiers (15 .mp4 AAC + ecoute.html + fichiers.json), environ 248 Ko.
4. Pour la suite : lancer bark_liste.py en voix 7, plain,tiret, sur une machine libre (60 s la prise), puis transcrire.py et liste_page.py ; envisager de baisser NOTE_MIN à 0,6.
