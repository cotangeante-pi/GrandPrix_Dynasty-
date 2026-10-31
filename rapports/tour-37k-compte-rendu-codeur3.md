# Tour 37k — compte rendu du Codeur 3 (2026-10-31) : la page Poki à jour

Branche codeur3, partie de b489e3b. Rien n'a changé dans le jeu : seulement le dossier poki/ et ce compte rendu.

1. **poki/fiche-poki.md** (toujours « à valider ») : les points forts et les commandes, en anglais et en français, parlent maintenant de :
   - la voiture vivante en expert et en légende (l'arrière qui part, la glissade à rattraper) ;
   - les aides au pilotage choisies une par une avant la course, avec le bonus jusqu'à +28 % ;
   - la manette qui vibre ;
   - le réglage du son (moteur, ambiance, commentateur) ;
   - la 8e leçon.
2. **poki/captures.py** fait deux scènes de plus :
   - 6-glissade : légende, l'épingle du technique, le robot qui freine en tournant, avec les traces de pneus et la fumée ;
   - 7-aides : l'écran « Aides au pilotage » avec le bonus annoncé.

   J'ai refait les 14 captures (7 scènes, en fr et en en), en 1920×1080, avant 21h, sans erreur de page. À regarder : sur la glissade, la fumée prend beaucoup de place.
3. **poki/A-LIRE.md** : ce que le propriétaire doit faire pour publier, dans l'ordre, en 6 étapes :
   1. choisir les noms ;
   2. relire la fiche ;
   3. mesurer les images par seconde (`python3 tests/perf.py --fois 3`) ;
   4. faire le paquet (`python3 tests/paquet.py`) ;
   5. le passer sur inspector.poki.dev ;
   6. choisir les captures et envoyer le tout.

À signaler : CLAUDE.md décrit maintenant la voiture vivante comme un **pneu drift** choisi par le joueur, et non plus comme un niveau. La fiche suit l'ordre du Chef (expert et légende), c'est-à-dire le jeu d'aujourd'hui ; elle sera à revoir quand les pneus drift existeront.
