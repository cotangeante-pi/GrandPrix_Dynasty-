# TOUR 42 — compte rendu du Codeur 2 : sentir la voiture vivante

Branche `codeur2`, commit 0995815 (main d0a484c fusionné). Passage GitHub 41146271098 : **vert, 17 travaux sur 17**.

## Ordres

Les trois ordres sont faits, **par le dessin et le son seulement**. `physique.js`, `ia.js` et `assistance.js` ne sont pas touchés. La physique écrit `v.chargeArriere` (voiture vivante) ; je ne fais que relire cette valeur et l'état de la voiture.

**Les faits** (`sensations.js`). Deux faits nouveaux :
- `arriere` (0 à 1) : l'angle de glissement de l'essieu arrière, `atan2(v − b·r, u)`, le même que la physique. Il commence à 0,07 rad et il est plein à 0,2 rad (`SENSATIONS_ARRIERE`).
- `patinage` (0 à 1) : la poussée du moteur au-delà de l'adhérence de l'arrière (`v.chargeArriere` × `VIVANTE_ADHERENCE_ARRIERE`).

Effets de conduite coupés : les deux restent à 0.

1. **Les traces de pneus** (`effets3d.js`). Tant que des roues glissent ou bloquent, chacune laisse une bande sombre de 32 cm :
   - les roues avant au blocage ;
   - les roues arrière quand l'arrière part (`TRACES_ARRIERE` 0,3), qu'elles patinent, ou que la voiture dérive (`TRACES_GLISSE`).

   Ce sont 600 bandes au plus, en anneau : les plus vieilles cèdent la place. Elles s'effacent en 8 s (une transparence par sommet), sans bande sur un saut de plus de 6 m, et à la hauteur du pont de Suzuko. Le tout est **un seul appel de dessin**, caché quand l'anneau est vide.
2. **Le crissement et la fumée suivent l'arrière.**
   - Le crissement de l'arrière qui part ou patine passe devant celui de la dérive : 0,32 de volume, 2100 Hz, plus grave que le blocage.
   - La fumée sort aussi des roues arrière.
3. **La vibration de la manette** (`manette.js`). `MANETTE.vibration(faits)` donne un `{ fort, faible }` :
   - le gros moteur : l'arrière, le patinage, le blocage, un choc ;
   - le petit : les vibreurs, l'herbe.

   `MANETTE.vibrer` envoie un `dual-rumble` de 140 ms toutes les 0,1 s, par `vibrationActuator` s'il existe, sinon rien. C'est seulement en conduite, avec la manette de chaque joueur à deux, et c'est coupé avec les effets de conduite.

## Coûts

**Les effets.** Fumée, étincelles et traces : +3 appels de dessin. Avec la trajectoire conseillée : +4. Le garde-fou de `tests/lieu.html` est passé de 3 à 4 effets, mesurés sur chaque circuit.

**Les plafonds `PLAFONDS_IMAGE` tiennent** : sur Monoco, 43 appels au pire pour 47, et 148 030 triangles pour 169 000. L'anneau de traces fait au plus 600 × 2 triangles.

## Tests

**tests/test.html** (moteur : 329 ✔, 0 ✘ sur le Mac) :
- les faits : l'arrière à mi-chemin, puis plein ; le patinage seulement quand la charge de l'arrière est connue et trop faible ;
- son, fumée, traces, vibration : chacun sur son fait, et rien sans fait. Les traces vont par deux roues, un saut ne trace pas, l'anneau tient à 600, et elles s'effacent ;
- **en voiture vivante (expert), en sortie de l'épingle du technique à plein gaz pendant 6 s** : 117 pas avec l'arrière qui part, 158 avec du patinage, 344 bandes de traces. La même course faite avec et sans faits, son et effets est identique au bit près.

**tests/ecrans.py** :
- `test=sensations` : fumée, étincelles et traces dessinées, +3 appels (au plus 3), aucun quand c'est vide ;
- `test=manette` : de fausses manettes avec un `vibrationActuator` qui note les appels. L'arrière qui part fait vibrer le gros moteur (`dual-rumble`), et le gros moteur s'arrête quand la voiture accroche. J'ai aussi rendu ce test plus solide : sous swiftshader chargé, un appui court de la fausse manette pouvait se perdre, alors il réappuie au besoin.
- les pages lieu avec les effets (Monoco essayé sur le Mac).

## Ce que je n'ai pas pu vérifier

**Avec une vraie manette.** La vibration n'a jamais été essayée sur du matériel. Firefox n'a pas `vibrationActuator` : la manette n'y vibrera pas, sans erreur.

**La lisibilité des traces.** Une bande sombre à 55 % se voit peu sur l'asphalte gris foncé (`TRACES_OPACITE`, `COULEUR_TRACES`), à regarder en conduisant. Sur la capture `sensations.png`, les traces sont en partie sous la fumée.

**Le seuil de l'arrière.** 0,07 rad ; est-ce trop tôt ou trop tard pour sentir que l'arrière part ? À essayer par le propriétaire, en pneus drift.

Réévalue.
