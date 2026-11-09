# Tour 51m : rééquilibrage des 18 travaux (Codeur 2)

Branche `ecrans-equilibre`, partie de main 9a09eae (touches-deux déjà dans moteur). Toujours 18 travaux, aucun test perdu ni modifié : seulement tests/ecrans-durees.json, tests.yml (les `recoins:`), un commentaire de lancer.py et le paragraphe « Répartition de tests/recoins.py » de CLAUDE.md.

Avant (passage vert 42425442653 sur main) : ecrans-4 597 s (514 s d'ecrans.py pour 384 prévues : tournoi 115 s au lieu de 66, paddock en 1280 57 au lieu de 30…), saison 534, ecrans-1 533, meteo 466, stands 444, paquet 418. Le passage de 4d0b04b (chef-integration, 42430238358) était encore dans la file : pas relu.

Ce qui a été fait :
- tests/ecrans-durees.json refait à partir des durées réelles des 144 pages (« ⏱ N s : page largeur ») dans les 6 journaux ecrans du passage 42425442653, lus par l'API GitHub (`actions/runs/<id>/jobs`, puis `actions/jobs/<id>/logs` : la redirection vers le stockage se suit sans l'en-tête d'autorisation). Même ordre de clés qu'avant, 4 pages nouvelles à la fin (clavier-pause, clavier-titre, reglages=1 fr/en, ~3-8 s) ; les deux valeurs que 4d0b04b change (seuldefi 960 → 45, sdk → 9) gardées telles quelles pour que la fusion reste propre (vérifié par `git merge-tree` : aucun conflit avec chef-integration). Avec ce fichier, le glouton d'ecrans.py prévoit 6 tranches de 359 à 362 s (total 2168 s).
- Les tranches ecrans ne portent plus aucune partie de recoins.py (c'est leur durée qui varie le plus d'une machine à l'autre). pendant → courses, deux → recoins-1, sauvegardes-recentes → consignes (avec sauvegardes-racine), dynastie → recoins-2 ; le reste inchangé.

Estimation (durées du passage 42425442653, + 12 s de mise en place) : saison 531 (saison.py seul), stands 448 (stands.html seul), courses ~424, paquet 419, recoins-2 415, consignes 404, officiels 386, les 6 ecrans ~379, recoins-1 376, premier 371, meteo 359, annexes 350, moteur 344 (touches-deux ~85 s ; 138 s sur la machine lente de 42428415009). Les deux au-dessus de 480 s sont un seul fichier de test chacun : on ne les coupe pas sans toucher au test.

À savoir : les machines de GitHub varient de ±40 % (sur 42428415009, moteur a fait 592 s avec test.html à 179 s au lieu de 104) ; l'équilibre vise donc le maximum le plus bas possible, pas seulement « sous 480 ». Les durées réelles sont à lire sur le prochain passage ; si une tranche dépasse encore 480 s, refaire le json avec le même procédé.
