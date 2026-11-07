# Tour 51f : les techniques de virage des IA en bataille et sous la pluie (Codeur 3, branche techniques-pluie)

Ce qui existait déjà : `defendreBataille` (le défenseur ferme la corde), `IA_PLUIE_LIGNE` (adhérence de la trajectoire sèche). Ce qui manquait : les décalages de technique (corde tardive, place à l'intérieur) ne tenaient compte ni de la pluie ni de la bataille.

## Fait
- `techModifier` (ia.js) pose `pilote.techMod` avant de tracer la ligne rapide ; `ligneRapide` l'applique aux seuls décalages de technique. Fonctions touchées : `ligneRapide`, `deciderLigne` (une ligne), `noterLigne` (le facteur de freinage) ; rien dans l'attaque (Codeur 1).
- Sous la pluie (`IA_TECH_PLUIE`, selon l'eau 0 à 1) : corde tardive et place à l'intérieur × (1 − 0,3 × eau), entrée plus large de 0,4 m × eau (vers l'extérieur, avant la corde), freinage × 0,98. Les vibreurs et zones mouillées ne sont pas modélisés ; la place à l'intérieur réduite est ce qui s'en approche.
- En bataille (`IA_TECH_BATAILLE`, voiture à moins de 30 m, à moins de 4 m de côté) : défenseur (le voisin derrière est plus rapide) : corde × 0,5, place à l'intérieur × 1,5 ; attaquant qui se prépare : corde × 1,5, entrée plus large de 1 m (croisement).
- Interrupteurs à 1 dans donnees.js ; à 0, comportement d'avant au bit près (signature des classements identique, mesurée).

## Mesure (JavaScriptCore, 12 courses de 10 IA, 5 tours, test + technique, 6 graines par circuit)
| | dépassements | chocs > 5 m/s | herbe (pas) | meilleur tour moyen |
|---|---|---|---|---|
| sec, avant | 11 | 1 | 0 | 59,050 s |
| sec, après (bataille) | 12 | 1 | 0 | 59,058 s |
| averse, avant | 73 | 2 | 0 | 64,691 s |
| averse, après (pluie + bataille) | 73 | 2 | 140 | 64,780 s |

Honnêtement : les gains sont petits (+1 dépassement au sec, les chocs ne montent pas) ; sous la pluie les IA sont un peu plus lentes (+0,09 s) et mordent un peu l'herbe (140 pas contre 0, très loin du plafond de 4000 par 30 courses de meteo.html) : la ligne est plus douce, pas plus rapide. Un premier réglage plus fort (entrée 1 m, corde et place × 0,5) donnait 270 pas d'herbe : abandonné.
Les empreintes de trajectoire (test.html) ne changent pas : elles portent sur la carte, pas sur les IA.

## Test modifié
tests/test.html, « résumé » : la graine 2 n'a plus de dépassement tenu avec les techniques en bataille dans Chrome ; le test prend la première graine de 2, 1 à 8 qui en a un (il vérifie le résumé, pas les IA).

## GitHub
Voir le message final du Codeur (commit, passage).
