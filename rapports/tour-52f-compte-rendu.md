TOUR 52f — compte rendu du Codeur 6
Branches : premiere-gp1 (n° 7, 9, 3 + revue 51 points 5 et 6), ui-equipe (section « Mon équipe »)
Ordres : n° 7 fait / n° 9 fait / n° 3 fait / ui-equipe fait / revue point 5 (documenté « voulu » dans CLAUDE.md) / point 6 (déjà corrigé au tour 51l : champLien déclaré avant l'appel et rappel ignoré si la boîte est redessinée)

n° 7 : CHAMPIONNAT_TOURS_PREMIER = 3 (premier Grand Prix de la carrière seulement ; = CHAMPIONNAT_TOURS rend le jeu d'avant), QUALIF_PASSER_PREMIER_MILIEU : « Passer » = médiane des IA au GP 1 (CHAMPIONNAT.estPremierGrandPrix, QUALIFICATION.tempsPasse), dernier au GP 2. Bulle 'qualif' « Fais ton tour pour partir plus haut » (fr/en), bouton et texte de résultat adaptés. Test test.html.
n° 9 : COMMENTAIRE_DECOUVERTE_MODE = 'joueur' : à la découverte, un commentateur « tout » ne parle que du joueur, voix et voix-sons comprises ; « non » reste « non » ; '' = comme avant. Test test.html.
n° 3 : cache-carte-test.js (34 Ko, CACHE_CARTE_LIVREE) lu après la sauvegarde ; tests/regenerer-cache-carte.py ; test « carte livrée » au bit près (test.html) ; premier.py vérifie carteDuCache. ecrans.py (page découverte) mis à jour : la carte du circuit test vient du fichier livré, l'écriture en cache du GP 1 (bahrayn) est vérifiée.
ui-equipe : l'argent en grand, quatre tuiles égales avec icône (Garage en rouge, l'action principale), CSS seulement (aucun texte ni id changé). Captures avant/après regardées en fr et en en à 640×360, 960×600, 1280×720.

Sortie des tests (Mac saturé, charge 17 à 100) : test.html 374/378 avant la mise à jour de ecrans.py (échecs : 3 mesures de temps dues à la charge, « textes : nombre » préexistant) ; mes 3 nouveaux tests verts. GitHub : 17/18 sur 79404ca, le rouge (ecrans-4) corrigé dans f9cb4ef, à confirmer.
Ce que je n'ai pas pu vérifier : premier.py clic → premier feu < 1 s (charge du Mac : 1,1 à 4,4 s, la carte vient bien du cache) ; ecrans-4 corrigé ; ui-equipe sur GitHub.
Si un réglage IA_* ou la physique change : régénérer cache-carte-test.js (python3 tests/regenerer-cache-carte.py), le test « carte livrée » le dit.
Réévalue.
