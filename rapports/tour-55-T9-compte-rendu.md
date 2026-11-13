TOUR 55 T9 — compte rendu du Codeur (Poki, revérification)
Branche : poki-55
Ordres : paquet et poids du zip fait / SDK autour des nouveautés (tactile, pause au téléphone debout, après-course en 2 clics) fait / pubs seulement entre deux écrans fait / console vide fait / 10 s du clic aux feux : mesuré sur téléphone émulé (ordinateur : déjà mesuré par ecrans.py et premier.py) ; pas envoyé à Poki.
Fait : tests/paquet.py a deux parcours de plus depuis le zip (iPhone SE couché, toucher) : (1) Jouer, gameplayStart aux feux éteints une seule fois, téléphone debout = pause + gameplayStop, couché de nouveau = pas de reprise, Reprendre = gameplayStart ; (2) podium → Continuer → Passer → une → paddock sans pub, puis une seule commercialBreak à « Course suivante ». Correction : le gros « Continuer » du podium faisait 39 px en 640×360, maintenant 41 px (style.css).
Sortie des tests : paquet.py sur le Mac 95/96 avant la correction (le seul échec : le bouton à 39 px) ; GitHub tranche.
Mesures : zip 1 098 Ko (plafond 8 Mo) ; clic → feux sur téléphone émulé 8,5 s (swiftshader, Mac chargé) ; aucun PokiSDK hors de sdk.js, aucun console.*, window.open, target=_blank dans le jeu.
Ce que je n'ai pas pu vérifier : inspector.poki.dev, un vrai téléphone, les 10 s sur une vraie carte graphique.
CLAUDE.md : « Règles Poki » (revérifié au tour 55).
