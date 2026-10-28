# TOUR 35 — la mesure des images par seconde (étape 10), Codeur 2

**Machine** : le Mac mini du propriétaire (Intel Iris, ANGLE / OpenGL 4.1, vrai processeur graphique), Chrome **avec fenêtre**, 1280×720, `?debug=1&course=3&ia=20&circuit=<nom>` (20 IA, la vue derrière la voiture suivie). Outil : `python3 tests/perf.py [circuits] [--fois N] [--secondes N] [--pluie] [--tele] [--sans-limite] [--racine DOSSIER]` (hors de la suite et de GitHub ; sous le verrou). Il donne les images par seconde moyennes, le pire 1 % (l'image la plus lente sur cent), le dessin seul (la course en pause : la physique et les IA arrêtées, la 3D continue), les appels de dessin et les triangles.

## Avertissement : le Mac n'était pas au repos
Pendant toutes les mesures (19h30–21h), la charge du Mac est restée entre **3 et 15** (Spotlight réindexe les dossiers déplacés à 17h41 : plusieurs `mdworker` ; le propriétaire se servait du Mac ; d'autres sessions). Le même circuit a donné de 29 à 69 images par seconde d'un passage à l'autre, sans rien changer au jeu. **Ces chiffres sont des minimums, pas la vraie capacité** : à refaire par le propriétaire sur un Mac au calme (`python3 tests/perf.py --fois 3`). Deux pièges trouvés et corrigés dans l'outil : un seul navigateur pour tous les circuits faisait tomber une page sur deux vers 35 (un navigateur neuf par circuit maintenant) ; une fenêtre cachée par une autre est ralentie par Chrome (`--disable-backgrounding-occluded-windows`). `--sans-limite` (sans synchronisation verticale) affame le calcul de la carte des IA en fond : à n'utiliser qu'avec une carte déjà en cache.

## Ce que coûte une image (Monzo, 20 voitures, mesuré dans la page)
- la physique et les 20 IA : **1,5 ms** par image ; le dessin (CPU, appels Three.js) : **1,35 ms** ; le tri proche / loin du décor : 0,07 ms. Le processeur a donc une grande marge : ce qui limite, c'est la carte graphique et la charge du Mac.

## Le moment le plus calme (charge 3,2) : avant et après les allègements
| circuit | avant (images/s) | après (images/s) | dessin seul après | appels avant → après | triangles avant → après |
|---|---|---|---|---|---|
| monzo | 85,9 | 95,5 | 98,6 | 41 → 27 | 64 922 → 52 784 |
| spaa | 77,0 | 83,9 | 96,6 | 31 → 37 | 83 818 → 71 802 |
| suzuko | 93,8 | 84,3 | 92,2 | 37 → 36 | 119 406 → 110 578 |
| singapura | 85,7 | 46,3 (charge 7,7) | 44,9 | 34 → 34 | 143 162 → 140 078 |
(Au-dessus de 60 : la fenêtre n'était pas synchronisée sur l'écran à ce moment-là ; c'est ce que la machine peut faire.)

## Les 12 circuits (après les allègements ; charge 4,8 au début, 14 à la fin ; médiane de 2 mesures de 5 s)
| circuit | images/s | pire 1 % | dessin seul | appels | triangles |
|---|---|---|---|---|---|
| monoco | 66,7 | 32,6 | 66,4 | 36 | 116 882 |
| silverstoun | 40,3 | 16,7 | 42,8 | 33 | 96 656 |
| monzo | 69,0 | 32,8 | 67,8 | 33 | 52 448 |
| spaa | 28,5 | 10,1 | 33,3 | 41 | 77 724 |
| suzuko | 62,3 | 25,0 | 64,8 | 36 | 110 756 |
| interlagas | 35,0 | 10,0 | 35,1 | 33 | 98 746 |
| montreol | 56,2 | 20,1 | 39,2 | 37 | 79 380 |
| melbourn | 39,5 | 7,7 | 38,0 | 37 | 85 756 |
| barcelana | 42,1 | 16,8 | 43,7 | 31 | 52 478 |
| bahrayn | 36,3 | 8,3 | 54,7 | 34 | 67 456 |
| singapura | 29,1 | 8,3 | 35,8 | 34 | 130 484 |
| yasmarino | 33,7 | 9,1 | 39,9 | 35 | 50 782 |
Lus avec la charge du Mac : les mêmes circuits ont fait plus de 60 dans d'autres passages (silverstoun 58,5, montreol 58,5, bahrayn 62,2, yasmarino 61,6, singapura 60,0, barcelana 66,3 ; monzo 95,5 et spaa 83,9 au calme). Aucun circuit n'est sous 60 à cause du jeu lui-même de façon prouvée ; le critère n'est pas encore vérifié proprement.

## Ce qui compte le plus
- **Les triangles ne décident pas** : Monzo (52 000) et Singapura (140 000) font les mêmes images par seconde au même moment.
- **Les à-coups (pire 1 %)** viennent surtout de la charge du Mac ; le tri du décor ne coûte que 0,07 ms par image.
- La pluie (une ligne, des gerbes, un matériau) : +3 appels ; la nuit : aucun appel de plus (fenêtres par le matériau) ; la vue télé : +1 appel (les mâts).

## Les allègements faits (rien ne change de près)
- `DECOR_DETAIL_LOIN` 250 → 180 m (le public et les arbres plus loin passent en forme simple).
- `DECOR_MAJ_DEPLACEMENT` 10 → 20 m (le tri proche / loin deux fois moins souvent).
- Le tri n'envoie plus à la carte graphique que les instances utilisées (`updateRange`), pas tout le tableau.
- (Déjà faits aux tours 32–34 : 8 voitures détaillées au plus, les autres en un appel ; fenêtres de nuit sans appel de plus ; aucune ombre portée dans le jeu.)

**À faire par le propriétaire** : `python3 tests/perf.py --fois 3`, le Mac au calme (Spotlight fini), et noter le tableau dans SUIVI.md.
