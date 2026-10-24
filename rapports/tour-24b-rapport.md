TOUR 24b — étape 6 — Codeur 2 : finitions du premier lancement, puis le casque du pilote — rapport du Chef
Chef : session-5b. Base : main (ton tour 23b fusionné). Note : 78/100.
Commit vérifié : ad3d050 (GitHub 40043748042, TOUT PASSE). Diff relu : aucun fichier du Codeur 1, aucun seuil de test touché, 3 conflits de fusion bien réglés. Captures titre.png, decouverte.png, bravo.png, pilote.png, pilote-960.png relues : propres.
Tes trois points, tranchés : (1) un seul argent, la prime créditée au solde par ARGENT.crediter : OUI, écrit dans CLAUDE.md ; (2) gameplayStart à l'extinction des feux pour toutes les courses avec feux : OUI (« quand la voiture roule »), écrit dans CLAUDE.md ; (3) la création du pilote demandée seulement en page nue : OUI, les pages de test gardent « Toi ».
Ce qui manque ou ne va pas :
- bravo.png : « Ta prime : 1000 $ » alors que l'argent du jeu s'écrit « 12 500 € » (argent.js, formater) : une seule monnaie, un seul formateur ;
- titre.png : l'emoji 👥 de « Entre amis » rend un carré sur Linux : un test de capture ne le verra pas, mais mets le texte sans emoji si la police ne l'a pas (ou une icône dessinée en CSS) ; même question pour 🏠 sur l'écran du pilote ;
- clic → feux : 14,3 s sous swiftshader. La mesure est honnête ; le remède est connu (la carte des IA) : ordre 1c.

ORDRES

1. Finitions (petit) :
   a) la prime affichée par ARGENT.formater (€, et « €1,000 » en anglais), partout où un montant apparaît ;
   b) les emojis des boutons remplacés par un rendu sûr (texte ou CSS) là où la police de Linux les rate ; capture titre.png refaite ;
   c) LA CARTE EN CACHE : la carte des IA d'un circuit (la trajectoire : ecart, vitesse, courbure… ce que donnerCarte attend) est déterministe depuis le tour 22. Garde-la dans la sauvegarde unique, compacte (nombres arrondis au cm et au mm/s, ou Float32 en base64 : mesure la taille, elle doit rester sous 150 Ko par circuit, sinon arrondis plus), avec une clé de validité = empreinte des réglages IA_* et des points du circuit (un changement de réglage ou de tracé invalide le cache, un test le prouve) ; au lancement, si le cache est valide, les feux n'attendent plus la carte. Mesure avant/après dans ecrans.py (clic → feux, 1er lancement sans cache, 2e lancement avec cache) : chiffres dans le compte rendu. ATTENTION : la carte lue du cache doit être identique au bit près à la carte calculée (test), sinon le déterminisme est cassé ; si l'arrondi l'interdit, garde les nombres entiers (Float64 en base64) et dis la taille.
   Fini quand : tests verts sur GitHub, chiffres de la mesure et de la taille.

2. LE CASQUE DU PILOTE (CLAUDE.md « Le casque du pilote », sans le volant ni les déblocages) :
   - la description d'un casque = un motif (liste CASQUE_MOTIFS dans donnees.js : bandes, étoile, flammes, damier, éclair, uni) et trois couleurs ; calcul pur dans pilote.js ou casque.js : tirage pour les 19 rivaux à la création du monde (deux pilotes n'ont jamais le même casque), casque neutre pour « Toi » avant la création, sauvegardé avec le championnat ; une ancienne sauvegarde sans casques en reçoit un pour chacun (completer) ;
   - l'éditeur à la création du pilote (après le pays et la course de cœur) : le motif et les trois couleurs, le casque qui tourne en 3D ; modifiable plus tard depuis le paddock (bouton « Mon casque ») ;
   - le rendu : les motifs dessinés UNE fois dans un atlas en canvas (une petite texture partagée), UN seul matériau pour tous les casques, chaque pilote sa case et ses couleurs (couleurs de sommets ou uniforme par instance : ce qui ne crée pas un matériau par voiture) ; visible sur la tête du pilote dans les vues derrière et télé (le casque du joueur reste caché en cockpit, comme aujourd'hui), sur les rivaux dans toutes les vues ;
   - l'icône 2D du casque (canvas, dessinée depuis la même description) à côté de chaque nom dans la tour de classement, les résultats et l'écran du championnat ; sur le podium 3D ;
   - performance : appels de dessin et triangles avant / après avec 20 voitures (?debug=1), dans le compte rendu : le casque ne doit pas ajouter d'appel de dessin par voiture (un seul matériau).
   Fini quand : tests moteur (unicité des casques, sauvegarde, ancienne sauvegarde complétée, le casque du joueur gardé après rechargement) ; ecrans.py : l'éditeur joué (changer de motif et de couleur), la capture casque.png (l'éditeur) et casques-course.png (vue télé avec des casques différents), l'icône dans la tour ; les appels de dessin mesurés ; console vide ; GitHub vert.

RÈGLES : les mêmes (tes fichiers + blocs ; le Codeur 3 travaille sur saisons.js, championnat.js, interface.js (fin de saison, contrats) : tes blocs à toi, `git merge origin/main` avant chaque push ; ni ia.js, ni simulation.js, ni circuits.js ; CLAUDE.md pas touché ; ni Math.pow ni ** dans ce qui touche la course). Horaires : jusqu'à nouvel ordre. Un push + un message au Chef par ordre vert ; compte rendu rapports/tour-24b-compte-rendu.md à la fin.
Questions pour le propriétaire (le Codeur n'y répond pas) : le temps clic → feux sur sa machine ; les aides à l'écran.
