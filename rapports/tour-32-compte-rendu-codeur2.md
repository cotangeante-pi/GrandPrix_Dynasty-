# TOUR 32 — compte rendu du Codeur 2

## Ordres 1 et 2 : les décors des 12 tracés dans le jeu, Monoco en détail

Commit : ba7755a (branche codeur2, main 3f451ba/544b23f fusionnée) — GitHub 40579577525 : 11 travaux verts.

**Ce qui est fait**
- `decor.js` lit `decors-officiels.js` (Codeur 3) par `DECOR_PUBLIC.placer` pour le circuit de la course (`DECOR.pour(circuit, nom, gp)`, appelé par `SCENE3D.init` avec `NOM_CIRCUIT`) : tribune principale, tribunes des virages célèbres (avec des piles de pneus devant la barrière de leur virage), public debout, bâtiment des stands avec un garage par écurie, panneaux le long de la ligne droite, et les zones de paysage, faites par le code en InstancedMesh : immeubles (bandes de fenêtres, couleurs), eau, port (l'eau et des bateaux amarrés de travers ou le long du quai), champs, collines, dunes, sapins et feuillus, la grande roue (Suzuko), l'hôtel (Yas Marino : refusé faute de place libre, à revoir avec le Codeur 3) ; l'horizon (collines, ville, gratte-ciel) en anneau au loin.
- Le lieu : la coupole du ciel en dégradé (`ciel.haut` → `ciel.horizon`, sans brouillard), des nuages (`ciel.nuages`), le brouillard, la couleur du sol, la lumière (ambiance, soleil : couleur, force, hauteur). La nuit et au couchant (`projecteurs`) : des mâts d'éclairage des deux côtés (la tête allumée, sans lumière ni brouillard) et une lumière blanche de plus sur la piste.
- Le Grand Prix à domicile : les couleurs du public viennent de `DECOR_PUBLIC.pourGrandPrix` (la part aux couleurs du pays) et les banderoles (« ALLEZ 27 ! », le nom) sont dessinées : une texture en canvas, une plaque par banderole sur la barrière devant la tribune principale, un seul maillage.
- Monoco : les façades le long des rues, tout contre les rails (`DECOR_FACADES`, couleurs de la Riviera), la ville en gradins (les immeubles montent avec la distance, `IMMEUBLE_PENTE_COLLINE`), le port et ses 64 bateaux, le sol gris (pas d'herbe entre la piste et les rails).
- Placement : rien à moins de largeur/2 + `DECOR_MARGE` du tracé ni dans la voie des stands (pour un long objet qui longe la piste, sa demi-largeur en travers) ; les objets solides ne se recouvrent plus (tribunes, immeubles, eau, collines) ; ce qui est contre la barrière (panneaux, pneus, banderoles, mâts) est seulement tenu loin de la piste.
- **Les voitures lointaines** (pour tenir le plafond) : au-delà de `VOITURE_LOIN` (45 m pour 55° de champ, plus loin quand la télé zoome), une voiture est dessinée en forme simple (`VOITURE3D.formeLointaine`), toutes en UN InstancedMesh ; le jeu ne voit pas la différence (le groupe est rendu visible juste après le dessin).

**Mesures** (`tests/lieu.html?circuit=<nom>`, 20 voitures sur la grille, vue d'un poste télé, 1280×720, swiftshader sur le Mac ; appels de dessin avec / sans le décor, triangles avec le décor) :

| circuit | appels | sans décor | triangles |
|---|---|---|---|
| monoco | 75 | 64 | 133 426 |
| silverstoun | 62 | 54 | 97 050 |
| monzo | 60 | 50 | 77 186 |
| spaa | 75 | 66 | 92 264 |
| suzuko | 62 | 52 | 88 452 |
| interlagas | 61 | 52 | 132 642 |
| montreol | 64 | 52 | 108 428 |
| melbourn | 78 | 66 | 104 572 |
| barcelana | 74 | 66 | 86 644 |
| bahrayn | 63 | 54 | 87 442 |
| singapura | 74 | 64 | 157 674 |
| yasmarino | 65 | 54 | 85 168 |

Dans le vrai jeu (`index.html?course=3&ia=20&circuit=singapura`, vue télé) : 34 appels, 151 022 triangles. Les images par seconde sous swiftshader ne valent rien : à mesurer par le propriétaire (`?debug=1&circuit=<nom>`).

**Tests** : `tests/test.html` : les 12 décors placés (tribunes, public, stands, ciel, mâts la nuit, aucun objet trop près du tracé ni dans la voie, types connus) ; `tests/ecrans.py` : les 12 pages `tests/lieu.html` (plafond `LIEU_APPELS_MAX` 90, décor ≤ `DECOR_APPELS_MAX` 26, coupole du ciel, mâts la nuit), Monoco vu du port (eau, bateaux, façades), le domicile (banderoles, part du public aux couleurs du pays), le vrai jeu à Singapura. Captures `lieu-<nom>.png` (12), `monoco.png`, `banderoles.png`, `jeu-singapura.png`.

**Pas fait / à revoir** : l'hôtel de Yas Marino n'a pas de place libre ; Montréol n'a que 2 modules de stands (voie courte) ; les tribunes ont toutes 6 rangs (la profondeur de decors-officiels.js n'est pas suivie) ; le pont de Suzuko (ordre 3) pas encore.
