TOUR 42 — compte rendu court du Codeur 1 (2026-10-30, 19h → 23h45) : le duel court

Commit : duel-court **62b01d3** (en cours) — GitHub 41160294983 : rouge (2 tests de rivalité seulement).

## 1. Pourquoi IA_ATTAQUE_LIGNE_PREVUE = 1 cassait stands.html et la rivalité (diagnostic chiffré, Chrome, 30 courses de 12 tours avec pneus)
- Chocs > 5 m/s : 5 sans le réglage, 16 avec. Sur les 16, 2 seulement ont lieu pendant une attaque (decaler, preparer) et 2 à la sortie des stands (camp1) ; les 12 autres sont des chocs dans la file, sans attaque : au freinage du virage court (technique 2390–2460 m, test 455–467 m) et en sortie (test 1925–1932 m), la voiture de derrière dans celle de devant, à 5–14 m/s.
- La cause : avec la ligne d'attaque prévue, une attaque ratée ne coûte plus 250 m (circuit test, premier tour) ; les voitures restent plus près les unes des autres, et la file au freinage, qui ne prévoit le freinage de la voiture de devant que si elle n'a pas le même aileron, se rentre dedans.
- La défense du rival (0) : elle ne se déclenche que si le joueur est à moins de 8 m derrière (ses rétroviseurs) ; tout ce qui fait suivre de plus loin la supprime.

## 2. Les corrections (derrière des réglages ; 0 = la course d'avant)
- IA_FREIN_VU_TOUS : il voit freiner toute voiture à moins de IA_FREIN_VU_DISTANCE (25 m) devant lui et prévoit sa décélération (IA_FREIN_PREVU) ; ni ça ni la ligne prévue avant IA_PREPARER_APRES (1000 m : le premier virage reste celui d'avant, le résumé garde ses dépassements).
- IA_FREIN_PREVU, essayé sur GitHub :

| IA_FREIN_PREVU | stands (chocs avec / sans pneus ; duel ≤ 11) | courses.html | autres |
|---|---|---|---|
| 0,6 (aujourd'hui) | ✘ 16 / 12 ; duel 20 | ✘ rivalité, casse 8 / 6 | |
| **0,7** | **✔** | ✘ rivalité : défenses 0 ; casse 3 / 0 | ✔ tout le reste |
| 0,8 | ✔ (Mac : 5 / 3 → seul le relatif tombait avant les derniers réglages) | ✘ rivalité : attaques 77 / 93, défenses 0 | ✘ disposition (défenses 0) |
| 1 | ✘ 4 / 2 (relatif) ; duel 4 | ✘ rivalité, résumé | ✘ disposition |

- Le conflit : plus il prévoit le freinage de la voiture de devant, moins il y a de chocs dans la file (stands : de 16 à 4), mais plus il suit de loin, et la défense du rival (à moins de 8 m, les rétroviseurs) et la disposition « bloquer » ne se déclenchent plus.

## Pour demain
- Faire que la défense du rival ne dépende pas d'une voiture à moins de 8 m (la vision de côté, IA_VISION_COTE[0]) : ou qu'elle voie le joueur arriver plus loin derrière (une vraie vue arrière, plus large), ou que le suiveur se colle de nouveau près dans les droites (la prévision du freinage seulement près des points de freinage).
- Puis courses.html sur 90 courses et stands.html avec IA_FREIN_PREVU 0,7.

Réévalue.
