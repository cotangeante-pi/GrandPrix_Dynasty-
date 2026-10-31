# TOUR 45 — compte rendu du Codeur 2 : la mesure des 60 images par seconde, en un clic

Branche `codeur2`, commit a6c966d (main b489e3b). Passage GitHub : PASSAGE

## Pour le propriétaire, sur son Mac (Chrome, l'écran ouvert)

1. Ouvrir `index.html?reglages=1`, puis cliquer sur **« ⏱ Mesurer les images par seconde (30 s) »** en bas du panneau. On peut aussi ouvrir directement `index.html?ia=20&course=1&mesure=1&circuit=monoco` (ou un autre circuit).
2. Une course de démonstration à **20 voitures** démarre sur ce circuit, avec la caméra de course derrière la voiture suivie. Après les feux, la page mesure **30 s** (`MESURE_DUREE`).
3. Le panneau en haut affiche le résultat, avec un bouton **« Copier »** pour le coller au Chef. Le résultat donne :
   - la moyenne des images par seconde ;
   - le 1 % le plus lent et la pire image ;
   - les appels de dessin (moyenne et pire) et les triangles ;
   - la qualité (le réglage et le cran ; ajouter `&qualite=haute` pour la mesurer sans baisse automatique) ;
   - la taille de l'image.

Le **compteur discret** s'obtient avec `?ips=1` sur n'importe quelle page du jeu. Il est en bas à droite et donne la moyenne et la pire image de la dernière seconde.

## Ce qui est fait (`mesure.js`)

- `MESURE.stats` est un calcul pur : moyenne, pire image, 1 % le plus lent.
- `texteResultat` est en français et en anglais (textes `mesure_*`, dans mon bloc).
- Sans `?ips`, `?mesure` ni `?reglages`, **rien n'est créé ni branché** : aucun coût. La physique, `ia.js`, `assistance.js` et les autres textes ne sont pas touchés.

## Tests

**tests/test.html** (moteur : 337 ✔, 0 ✘ sur le Mac) : la moyenne, la pire image et le 1 % le plus lent (une ou deux images lentes) ; le texte rempli et les mêmes trous en fr et en en ; l'adresse de la mesure.

**tests/ecrans.py**, page `index.html?ia=20&course=1&circuit=test&mesure=1&ips=1` (mesure raccourcie à 4 s, 8/8 sur le Mac, 48 s) :
- 20 voitures, la caméra derrière, un résultat complet sans trou à remplir ;
- le compteur affiche des i/s ;
- « Copier » répond ;
- capture `mesure.png`.

Sur les autres pages de course, il n'y a ni compteur ni panneau.

**Sous swiftshader**, la mesure donne évidemment peu (2,9 i/s) : seule celle du propriétaire compte.

Réévalue.
