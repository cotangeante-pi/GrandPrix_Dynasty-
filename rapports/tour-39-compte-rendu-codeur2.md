# TOUR 39 — compte rendu du Codeur 2 : la trajectoire conseillée

Branche `codeur2`, commit af2206b, fusion de main c3cd696.
Passage GitHub 40780652241 sur c3cd696 : **vert, 16 travaux sur 16** (dont « premier », le premier lancement).

## Ce qui est fait (`conseil.js`, réglages `CONSEIL_*` dans `donnees.js`)

**La ligne.** C'est un ruban sur la piste, sur 300 m devant la voiture du joueur, le long de la trajectoire de la carte des IA (ia.js en lecture seule) : 0,7 m de large, transparent.
- **Verte** : on peut accélérer. C'est aussi le cas en ligne droite à la vitesse de pointe, et en sortie de virage, là où la vitesse conseillée remonte.
- **Jaune** : lever, au bout de ce que la voiture tient (la vitesse conseillée plate dans un virage).
- **Rouge** : freiner, là où la vitesse conseillée baisse.

**Calculée pour la vitesse réelle.** La vitesse « à fond » part de `v.u` et monte avec `accelerationPossible`. Dès qu'elle touche la vitesse conseillée de la carte, on la suit. Une voiture plus rapide que le conseil voit du rouge tout de suite, jusqu'à le rejoindre au freinage possible (`IA_MARGE_FREIN`) ; une voiture plus lente voit le rouge commencer plus tard.

Exemple mesuré devant l'épingle du technique, depuis 150 m avant le freinage, à la vitesse conseillée : le rouge commence exactement au point de freinage de la carte (2349 m). Il dure jusqu'à la corde, puis vient un peu de jaune, puis du vert en sortie. La baisse se mesure sur 3 points, pour ne pas clignoter à la corde.

**Quand elle se montre.**
- Sans réglage choisi : allumée d'office en débutant seulement (donc aussi dans la course de découverte, qui est en débutant).
- Menu pause, sur la rangée du fantôme : « Trajectoire conseillée : oui → freinages seulement → non », sauvegardé (`option('trajectoire')`). En « freinages seulement », seuls les points rouges se dessinent.
- Jamais en qualification classée, en tournoi chrono, à deux, ni dans une course entre IA qu'on regarde.

**Un appel de dessin**, mesuré : 41 → 42.
- Un `Mesh` à couleurs par sommet, avec `forceSinglePass`. Sans cette option, un objet transparent à deux faces se dessine en deux passes dans r152 : la première mesure donnait +2.
- Il est caché quand il n'y a rien à montrer.

**Dessin seulement.** Rien n'est écrit dans la voiture ni dans la carte.

## Tests

**tests/test.html** (moteur : 315 ✔, 0 ✘ sur le Mac) :
- la couleur avant l'épingle du technique : rouge au point de freinage de la carte et pas 20 m avant, vert dans les 30 m de sortie, plus vite = rouge tout de suite, plus lent = rouge plus tard ;
- quand elle se montre : débutant oui, normal et expert non, le réglage, jamais en tournoi, en qualification classée, à deux, sans joueur, sans carte ou hors course ; la leçon du tutoriel l'allume ;
- la course ne bouge pas d'un bit : 4 IA, 15 s, la ligne calculée à chaque pas pour chaque voiture, ou pas.

Les empreintes de trajectoire n'ont pas bougé (ia.js n'est pas touché).

**tests/ecrans.py** :
- `…&niveau=debutant&test=conseil` (1280×720, 8/8 sur le Mac) : la ligne est là d'office pendant la course, +1 appel de dessin, le bouton dit « oui ». Le réglage passe à « freinages seulement » puis à « non », sauvegardé, et la ligne disparaît. Capture `tests/captures/conseil.png`.
- `…&niveau=normal&test=conseil` (960×600) : aucune ligne.
- La leçon du freinage (`tutoriel=freinage`, 9/9) se réussit toujours : le robot passe la zone en 6,75 s pour un objectif de 9 s.

## Pour le Codeur 4 (le bonus, sans toucher à tutoriel.js)

`principal.js` pose `JEU.conseilForce = 'oui'` quand `?tutoriel=freinage`. La leçon 2 allume donc la trajectoire pendant la leçon, quel que soit le réglage (`CONSEIL.mode({ force })`).

Pour que la ligne ait une carte, la carte des IA est calculée aussi en essai libre, **seulement** quand la ligne peut se montrer : la leçon du freinage, le niveau débutant, ou un réglage « oui / freinages » choisi. Sinon rien ne change. Le premier lancement normal ne change pas : la découverte calculait déjà sa carte, puisqu'elle a des IA ; le travail GitHub « premier » le vérifie.

Si tu préfères l'allumer depuis tutoriel.js (seulement quand la leçon roule, par exemple), pose `JEU.conseilForce = 'oui'` ou `null` et retire ma ligne de principal.js.

## Ce que je n'ai pas pu vérifier

**La lisibilité en vrai.** La ligne passe sous les voitures, et sa largeur et son opacité (`CONSEIL_LARGEUR`, `CONSEIL_OPACITE`) sont à juger par le propriétaire.

**Le jaune dans les courbes rapides.** La courbe rapide du technique, à 86 m/s, est jaune sur toute sa longueur (on y est au bout de ce que la voiture tient). À regarder.

**L'essai libre sans réglage.** En normal, sans réglage choisi, il n'y a pas de carte, donc aucune ligne même si on la met à « oui » en pause pendant la course. Elle viendra au lancement suivant.

Réévalue.
