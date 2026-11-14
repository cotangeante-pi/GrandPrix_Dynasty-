# Tour 56, T1 : limites de piste moins sévères (branche `limites-piste`)

Vert 18/18 sur GitHub (dernier commit de la branche, après un premier passage à 16/18 corrigé).

**Cause mesurée.** Le gain d'une sortie était compté contre la ligne du milieu. À l'intérieur d'un long virage l'arc est plus court que celui du milieu : à 60 m/s, rester 4 s à l'intérieur (1,6 m au-delà de la marge) coûtait +5 s sur 4 circuits sur 11, alors que le gain contre le bord était négatif (jusqu'à -4,5 m). Aucun raccourci réel.

**Changement** (réglages dans `donnees.js`) :
- `COUPE_MESURE_BORD` (vrai) : le gain se mesure contre le bord du côté de la sortie (`ratioBord` dans `course.js`, calculé une fois par circuit).
- `SEUIL_COUPE_GRAVE` (1 m) : un vrai raccourci (chicane coupée tout droit : gain au bord 1,6 à 8,6 m) = +5 s tout de suite. Les débordements de virage restent à 0,5 m ou moins. Un seuil de 3 laissait 3 chicanes gratuites (monoco x2, montreol).
- `LIMITES_AVERTISSEMENTS` (3) : un autre débordement = avertissement « Limites de piste (n/3) » (bandeau 3 s, commentateur fr/en), le 4e = +5 s puis le compte repart. 0 = comme avant.
- Valeurs d'avant (`COUPE_MESURE_BORD` faux, `LIMITES_AVERTISSEMENTS` 0) = jeu d'avant (testé).
- Un tour avec avertissement n'est pas un record du joueur ni son fantôme (drapeau `tour.limites`, ⚠ dans la liste des tours) ; ce n'est pas un « tour coupé » : la validité des qualifications et les tests d'IA « sans couper » sont inchangés ; une IA garde son meilleur tour.
- Même code pour joueur, IA, mode à deux, tournoi chrono (`majCourse`) ; CLAUDE.md mis à jour.

**Tests** : `tests/limites.html` (annexe de `lancer.py`) : 0,5 / 2 / 4 s à l'intérieur sur tous les circuits = 0 s de pénalité ; chicanes de tous les circuits ; 4 débordements = 1/3 2/3 3/3 puis +5 s puis le compte repart ; réglages d'avant ; stands ; textes.

**Empreintes** : les courses d'IA ne changent que si une IA déborde sans raccourci (avant : +5 s possible selon la mesure du milieu ; maintenant 0 s) : ses pénalités peuvent baisser.

**Non vérifié sur le Mac** : le verrou était tenu par un autre Codeur plus de 10 min ; GitHub a tranché.
