TOUR 53f — compte rendu du Codeur 5
Branche : reglages-volant (depuis origin/main 975e51a)
Ordre : régler le volant sans code, sur écran tactile seulement (Réglages du paddock et pause).

Fait : VOLANT_SENSIBILITE = [1.4, 1, 0.68] (donnees.js : doux, normal, vif ; VOLANT_PLEIN × ce nombre, normal = 1 = le jeu d'avant) ; « Volant : doux / normal / vif », « Inversé : oui / non » (retourne VOLANT_INVERSE), « Direction : volant / ◀ ▶ » (le choix existant de la pause, aussi dans les Réglages), « Recentrer le volant ». Sauvegardés dans les options de la sauvegarde (volant_sensibilite, volant_inverse, volant_choix), relus au démarrage. Gros boutons (min-height 44 px), textes fr/en ≤ 22 caractères. Dans les Réglages : une carte « Volant » (4 boutons) ; dans la pause : « Volant » et « Inversé » s'ajoutent à la rangée tactile (avec les deux boutons déjà là). Sans écran tactile : aucun bouton créé et la carte est display:none.
Test (page championnat=1&test=tactile-reglages, 960×600) : les 4 boutons ≥ 40 px, à 12,5° doux < normal < vif, inversé change le signe, choix ◀ ▶, tout survit à un rechargement ; sans body.tactile, caché ; test sans tactile dans paddock_menu (aucun bouton, carte cachée). ecrans.py ciblé : 56/56 (82 s ; la page championnat déclenche aussi les tests génériques du championnat).
Vu sur capture : à 640×360 la page Réglages défile (elle le faisait déjà : Son, Jeu, Volant, Carrière) ; à 960 tout tient.
Réévalue.
