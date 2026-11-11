TOUR 53d — compte rendu du Codeur (boucle « encore une course »)
Branche : apres-course (depuis origin/main 1a8a5a9)
Mesure d'avant (lue dans le code, écran par écran, du podium au paddock) : podium → « Résultats » (clic 1) → « Continuer » (clic 2) → interview : une réponse (clic 3), puis « Continuer » de l'effet (clic 4) ou « Pas de commentaire » (clic 3) → une du journal (clic 4 ou 5, ou une touche) → paddock : 4 à 5 clics, 4 écrans de texte, les gains vus seulement à l'écran « Résultats ».
Changements, chacun sous un réglage de donnees.js (faux = le jeu d'avant) :
- APRES_PODIUM_DIRECT : en carrière, le podium montre « Gains : 32 400 € · +18 pts » et un gros « Continuer » (#boutonPodiumSuite) qui mène droit à l'interview ; « Résultats » reste, en petit (la même id, les anciens tests passent).
- INTERVIEW_PASSER : « Passer » (gros) à la place du petit « Pas de commentaire » (même effet : aucun).
- UNE_AUTO_DUREE (6 s) : la une passe seule au paddock ; un clic ou une touche la passe tout de suite.
Mesure d'après : du podium au paddock, 2 clics (Continuer, Passer) puis 6 s sans clic ; argent, points et Grand Prix suivant identiques à l'ancien chemin (comparés à finirGrandPrix sur une copie).
Test : ecrans.py, page test=apres-course en 1280×720 et 640×360 (captures apres-podium-*.png, apres-interview-*.png), passée sur le Mac : tout vert. Ajouté à ecrans-durees.json.
Ce qui n'est pas fait / à voir : « même place » du gros bouton à chaque écran non mesurée (podium en bas, « Passer » dans la carte de l'interview) ; en 640×360 les cartes du podium frôlent la ligne des gains (lisible). Durée réelle en secondes non mesurée au-delà des 6 s de la une.
Réévalue.
