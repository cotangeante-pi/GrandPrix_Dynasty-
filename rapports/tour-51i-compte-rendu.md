# Tour 51i : rééquilibrage des travaux (Codeur 2)

Branche `recoins-split`. Toujours 18 travaux (n/n = 18/18). Aucun test modifié : seulement tests.yml et les tables PARTIES/TAILLES de tests/recoins.py (tailles-carriere et tailles-jeux coupées par taille : -1280 et -1920).

Avant (passage 42417410695) : recoins-2 578 s, premier 555, stands 536, courses 463, recoins-1 458.
Après (estimation d'après les durées des parties) : annexes ~427, consignes 418, moteur ~414, ecrans-1 ~404, officiels ~405, meteo ~398, recoins-2 ~398, recoins-1 ~394, paquet ~387, courses ~387, premier ~370, ecrans-4 ~400 ; stands ~470 (stands.html seul, 461 s, non coupable sans toucher au test).

Voir CLAUDE.md (section des travaux) pour la répartition. Les durées réelles sont à lire sur le prochain passage.
