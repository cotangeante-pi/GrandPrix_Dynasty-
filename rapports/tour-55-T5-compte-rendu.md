TOUR 55 — compte rendu du Codeur (Codeur 3, tâche T5 : le Grand Prix à domicile des rivaux, branche domicile-rivaux)
Commit : voir la branche domicile-rivaux
Ordres : 1 fait (nationalité des rivaux reliée aux pays des circuits, sans changer leurs noms) / 2 fait (bonus de rythme DOMICILE_RIVAL_BONUS = 0,4 %, réglable) / 3 fait (phrase du commentateur au départ, brève du journal sur le podium, pays dans la fiche du rival ; textes fr et en)
Réglages (donnees.js) : DOMICILE_RIVAUX_ACTIF (faux = le jeu d'avant au bit près), DOMICILE_RIVAL_BONUS, GRAINE_PAYS_RIVAUX, COMMENTAIRE_PRIORITES.domicileRival
Sortie des tests : 5 nouveaux tests dans tests/test.html (mini-page ciblée sur le Mac) ; GitHub : voir le compte rendu au Chef
Ce que je n'ai pas pu vérifier : l'effet du bonus sur de vraies courses (0,4 % choisi au jugé) ; l'affichage de la ligne « Pays » dans la fiche sur un écran (texte court, ajouté à la ligne d'infos)
Réévalue.
