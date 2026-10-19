TOUR 7 — compte rendu du Codeur (session-dd)
Commit : fbbf844 (« Tour 7 : une IA fait le tour seule »)

Ordres : 1 fait / 2 fait / 3 fait / 4 fait / 5 PAS FAIT (voir plus bas)

1. Circuit technique — fait.
   CIRCUITS.technique (donnees.js), par morceaux, largeur 13 : 3357 m, fermeture 0,0006 m.
   - Épingle : rayon 16 m, 155° (pas 180° : à 160–180° la sortie repasse à moins de 41 m de la longue droite).
     Elle est suivie d'une droite de 70 m, puis d'un gauche de 60 m.
   - S : 50 m +55°, 45 m −75°, 55 m +60°.
   - Courbe rapide : 250 m, 80°.
   - Longue droite : 800 m, puis l'épingle.
   Les deux droites des stands (628,086 m et 648,012 m) sont calculées pour refermer le tour.
   `?circuit=technique` le charge. Par défaut, ou si le nom est inconnu : test.
   Tests :
   - fermeture < 1 m ;
   - aucun croisement : écart le plus petit 43,9 m, il faut plus de 41 m ;
   - rayon le plus serré 15,5 m (moins de 25 m) ;
   - présence de l'épingle, du S, de la courbe rapide, et de la droite ≥ 700 m suivie d'un virage serré.
   Capture : tests/captures/technique.png.

2. ia.js, trajectoire et vitesse conseillée — fait. Calcul pur, une fois par circuit (`calculerTrajectoire`).
   - Lissage : chaque point glisse en travers de la piste, dans ±(largeur/2 − IA_MARGE_BORD), jusqu'à ce que sa courbure soit la moyenne de celle de ses voisins. Plusieurs écarts de voisins, du plus large au plus serré.
   - Aplatissement du pic de chaque virage (pas de Newton sur u² + u^8, u = courbure / pic local). Sans lui, l'épingle gardait un pic au point de corde : seulement −5 à −7 %.
   - Vitesse conseillée = min(vitesse de pointe, vitesseVirage(k) × IA_MARGE_VIRAGE, vitesse où le braquage suffit). Ensuite une passe arrière (freinage possible × IA_MARGE_FREIN) et une passe avant (accélération du moteur), toutes tirées des chiffres de physique.js.
   - J'ai ajouté la limite du braquage. Sans elle, l'épingle demandait plus de braquage que braquageMax n'en donne : la voiture élargissait.
   Tests :
   - trajectoire dans la piste (chaque point repassé par positionSurPiste) ;
   - courbure max : test −35,0 % (rayon 37,6 → 57,9 m), technique −24,5 % (15,5 → 20,5 m) ;
   - la vitesse conseillée ne descend jamais plus vite que le freinage prévu.
   Calcul : 0,8 à 1,1 s par circuit sous Chrome sans fenêtre, sur le Mac chargé.

3. piloteIA — fait. Poursuite pure vers un point de la trajectoire, à max(8 m, 0,35 s) devant. La vitesse visée est la vitesse conseillée 0,15 s plus loin, avec gaz et frein proportionnels. Elle ne sort que { gaz, frein, direction } (vérifié à chaque pas dans le test). Elle ne touche jamais x, z, u, v, r ni cap, et ne lit que v.piste, sa position et la courbe.
   Test : 5 tours, graine 7, sans affichage :
   - IA test : 52,62 / **47,88** / 47,88 / 47,89 / 47,88 s ; 0 contact, 0 virage coupé, 0 pas dans l'herbe. Le tour lancé est sous les 50 s ; le propriétaire fait ≈ 45 s, le robot 62,05 s.
   - IA technique : 57,18 / **54,43** / 54,44 / 54,43 / 54,44 s ; 0 contact, 0 coupé, 0 herbe.
   - Déterminisme : même tour au dernier chiffre.
   - En dehors du test (mon banc d'essai) : sur le circuit test, la voiture dépasse le bord de 0,24 m au plus, sur le vibreur. L'herbe commence à 1 m.

4. `?ia=1` — fait. La voiture du joueur est conduite par l'IA (comme ?robot=1). La trajectoire n'est calculée qu'avec ?ia=1.
   ecrans.py lance index.html?course=5&ia=1&circuit=technique :
   - console vide ;
   - un tour fini en 75 s de jeu (57,18 s, départ arrêté), sans barrière ni pénalité ;
   - capture tests/captures/ia.png.

5. CLAUDE.md — PAS FAIT. Mes règles de session m'interdisent de modifier un CLAUDE.md à la demande d'une autre session : il faut l'accord du propriétaire. Le texte est prêt, à coller dans la liste des fichiers :
   - `ia.js` : l'IA en calcul pur : la trajectoire idéale et la vitesse conseillée de chaque circuit (`calculerTrajectoire`, une fois par circuit), et `piloteIA(v, circuit, trajectoire)`, qui donne { gaz, frein, direction } comme un joueur ;
   - dans `principal.js` : `?circuit=technique` charge un autre circuit de `CIRCUITS` (par défaut : test) ; `?ia=1` fait conduire l'IA.
   - dans `sauvegarde.js` : les records sont séparés par circuit (clé « technique-5 » ; le circuit test garde « 5 »).

Autres changements :
- Records séparés par circuit (sauvegarde.js, interface.js). Sinon un tour du circuit technique serait comparé aux records du circuit test. Les anciennes sauvegardes restent valables.
- Nouveaux réglages IA_… dans donnees.js. robot.js n'a pas changé.

Sortie des tests (python3 tests/lancer.py) : TOUT PASSE
- tests/test.html : RESULTAT 99/99 (6 s)
- tests/ecrans.py : RESULTAT 133/133 (92 s)

Mesures :
- IA test : tour lancé 47,88 s (tour théorique de la vitesse conseillée 47,05 s).
- IA technique : 54,43 s (théorique 53,48 s).
- Robot naïf inchangé : 62,05 s.
- Circuit 3D : 16 626 triangles.

Ce que je n'ai pas pu vérifier :
- L'IA dans la vraie page en temps réel, à l'œil : seulement par BOUCLE.simuler et une capture.
- Le temps de calcul de la trajectoire (≈ 1 s) sur un ordinateur normal. Avec 12 circuits, il faudra peut-être le faire pendant le chargement, ou le mettre en cache.
- Les marges choisies sont serrées : IA_MARGE_VIRAGE 1, freinage 0,95, braquage 0,95. La marge de sécurité, c'est la trajectoire à 1,5 m du bord. Avec 20 voitures et des écarts de ligne (4b–4c), il faudra peut-être les baisser.

Réévalue.
