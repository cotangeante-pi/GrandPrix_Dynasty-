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

## La nuit (défaut vu par le Chef) — et la grille vue de la télé

Commit : 8bec5e1 (branche codeur2) — GitHub 40586129886 : 11 travaux verts.

- La vraie nuit : à Singapura, l'ambiance baisse (`NUIT_AMBIANCE` 0,22), les projecteurs éclairent moins fort (`NUIT_PROJECTEURS` 0,42), et un brouillard sombre et court (`NUIT_BROUILLARD` 140–950 m) laisse clairs seulement la piste et ses abords ; les mâts restent allumés. Les fenêtres des immeubles sont allumées par une couleur émissive (`FENETRES_NUIT`) posée par le matériau des immeubles (un attribut `lumiere` sur les fenêtres) : aucun appel de dessin en plus. Bahrayn au crépuscule et Yas Marino au couchant en prennent la part `NUIT_SOIR` (0,45).
- Test (le vrai jeu, derrière la voiture, l'image 3D seule) : la nuit à Singapura, ciel 50 et image 60 sur 255 (plafonds `NUIT_CIEL_MAX` 60, `NUIT_IMAGE_MAX` 70) ; le jour à Monzo, ciel 180 et image 135 (`JOUR_IMAGE_MIN` 100). Captures jeu-singapura.png, jeu-singapura-derriere.png, jeu-monzo*.png, lieu-singapura.png.
- Sur GitHub, la grille de Monzo vue de la télé atteignait 90 appels (la télé zoome : toutes les voitures y étaient « proches »). Maintenant, au plus `VOITURES_DETAILLEES_MAX` (8) voitures détaillées, les plus proches, et les autres en forme simple : 46 appels à Monzo, 43 à Singapura (vue télé, 20 voitures).
- Le pont de Suzuko est commencé (la route qui monte, le terre-plein, les flancs, le tablier, les culées ; la voiture et la caméra suivent la hauteur de la route) mais il n'est ni fini ni essayé : il est coupé (`PONT_ACTIF` faux).
- Un échec de hasard vu une fois sur le Mac (le fantôme du 2e tour pas encore visible au bout de 10 s, la machine chargée) : la même page relancée seule passe (20/20), et GitHub est vert.
