TOUR 55 — compte rendu du Codeur (Codeur 3, tâche T16 : revue des nouveautés de la nuit, branche revue-55)
Commit : voir la branche revue-55 (origin/main + aides-nouveautes, donc drapeaux, fusionnés dedans)
Relu : drapeaux.js, foule.js, fantome-pole.js, le domicile des rivaux, les dégâts (physique, stands, voiture3d), les aides nouvelles ; cas regardés : pause, revanche, abandon, rechargement, mode à deux, tournoi, tutoriel, météo, sauvegarde ancienne, déterminisme, fuite de son ou d'objets 3D
Défauts trouvés et corrigés (chacun avec son test) :
 1. Le bandeau du drapeau restait affiché au podium et au paddock (majMessages sortait avant de l'éteindre) : test dans tests/test.html.
 2. Sous VSC, le joueur plafonné à 151 km/h rattrapait les IA ralenties et prenait 5 s sans le vouloir : le plafond suit la voiture de devant (DRAPEAUX_VSC_SUIVI, 0 = comme avant) : test dans tests/drapeaux.html.
 3. L'aileron abîmé redevenait droit quand le halo du corps était refait (majHalo) : corrigé, test dans tests/personnalisation.html.
Rien trouvé à redire sur : fuites de nœuds Web Audio de la foule (les sources s'arrêtent seules, taire remet le compteur à 0), tirage de la nationalité des rivaux (flux à part), fantôme du poleman (une seule IA : les drapeaux ne s'y mêlent pas, moins de 2 pilotes), mode à deux et leçons (e.sansDrapeaux), sauvegarde ancienne (rien de nouveau n'est sauvegardé par les drapeaux ; les pays des rivaux sont tirés au chargement).
Sortie des tests : drapeaux.html 9/9, personnalisation.html 18/18, mini-page ciblée du test.html 1/1 sur le Mac ; GitHub : voir le compte rendu au Chef
Ce que je n'ai pas pu vérifier : le ressenti réel de la VSC ; la foule à l'oreille.
Réévalue.
