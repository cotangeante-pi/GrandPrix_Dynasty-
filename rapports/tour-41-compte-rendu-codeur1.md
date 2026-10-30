TOUR 41 — compte rendu du Codeur 1 (2026-10-29, 19h45 → 21h45) : la voiture vivante

Commit : voiture-vivante **d9dd627** (avec main) — GitHub **40977751168 : vert**. Avant : 17b0746 (40976638636 : vert).
Ordres : 1 fait / 2 fait / 3 fait (tableau des IA seules ; les IA en voiture vivante : pas encore, voir plus bas).

## 1. VOITURE_VIVANTE et les 4 effets (physique.js, pasPneusVivant)
- `VOITURE_VIVANTE` (0 par défaut, le curseur dans ?reglages=1) × `NIVEAUX[…].vivante` (expert 1, légende 1, absent en débutant et normal). À 0, ou en débutant / normal : le pas d'aujourd'hui, au bit près (une branche à part dans pasVoiture).
- Transfert de charge (VIVANTE_HAUTEUR_CG 0,3 m, l'accélération du pas d'avant) ; l'arrière n'accroche plus que × 1,15 l'avant (au lieu de 1,25) ; cercle d'adhérence à chaque essieu (VIVANTE_CERCLE 0,75 devant, 0,4 derrière ; frein réparti 60 % devant) ; patinage (la poussée au-delà de l'adhérence de l'arrière est perdue et lui prend de l'adhérence de côté) ; aides arcade réduites de 40 % (VIVANTE_AIDES).
- Tests en calcul pur (test.html) :
  - 0 en légende et en expert, 1 en normal et en débutant : le tour du robot au bit près ;
  - freinage à 70 m/s : charge avant 9544 N (statique 8171), arrière 3553 N (statique 6537) ;
  - 1 s à 250 km/h, braquage 0,15 : aujourd'hui gaz 0,211 rad, pied levé 0,208 ; vivante gaz 0,176, pied levé 0,275 (+56 %).

## 2. Les robots en légende, voiture vivante
| | meilleur tour avant → vivante | dérive max (rad) avant → vivante |
|---|---|---|
| robot neutre, test | 62,04 → 62,03 s | 0,049 → 0,088 |
| robot neutre, technique | 64,57 → 64,17 s | 0,049 → 0,406 (rattrapé, pas de tête-à-queue) |
| robot brutal, test | 62,33 → 62,37 s | 0,050 → 0,069 |
| robot brutal, technique | 64,85 → 64,87 s | 0,051 → 0,094 (part en glissade et se rattrape) |
Aucun tête-à-queue, aucune barrière. Le test exige la glissade du robot brutal à l'épingle du technique seulement (sur le circuit test, il ne glisse que 1,4 fois plus qu'avant).

## 3. Les IA seules sur le circuit test (calcul pur, 4 graines, meilleur tour min / médiane)
| niveau | avant | voiture vivante, IA comprises |
|---|---|---|
| débutant | 54,84 / 55,51 | (rien ne change) |
| normal | 53,43 / 53,90 | (rien ne change) |
| expert | 51,89 / 52,52 | 139 / 214 (herbe partout, 6 coupes) |
| légende | 46,63 / 47,08 | 189 / 350 (herbe partout, 10 coupes) |
Les IA ne savent pas piloter la voiture vivante (leur carte et leurs lignes supposent la voiture d'aujourd'hui). D'où `VIVANTE_IA` = 0 : la voiture vivante ne touche que la voiture du joueur (v.ia sur les IA, simulation.js) ; les IA roulent comme avant. C'est le repli prévu par CLAUDE.md (« la voiture vivante pour le joueur seul en expert / légende ») : au Chef de l'écrire dans « Décidé ».
Empreintes de trajectoire : inchangées (la carte ne dépend pas de la voiture vivante).

## Pour la suite
- Les IA en voiture vivante : leur apprendre (freiner plus tôt, remettre les gaz progressivement, la carte calculée avec l'arrière qui glisse), puis courses.html et stands.html.
- « À essayer par le propriétaire » : une course en légende avec ?reglages=1, VOITURE_VIVANTE à 1 ; « l'arrière qui glisse, c'est fun ou énervant ? ».

## Ce que je n'ai pas pu vérifier
- La voiture vivante au clavier dans la page (l'écran bloqué après 21h) ; seulement les robots en calcul pur.

Réévalue.
