TOUR 55 — compte rendu du Codeur (Codeur 3, tâche T7 : les drapeaux, branche drapeaux)
Commit : voir la branche drapeaux
Ordres : 1 fait (drapeaux jaunes : zone autour d'une voiture arrêtée ou sortie, les IA lèvent le pied et n'attaquent pas, un dépassement dans la zone = 5 s) / 2 fait (drapeaux bleus : le retardataire laisse passer, le joueur voit le drapeau sans pénalité) / 3 fait (VSC : tout le monde ralentit, joueur plafonné à 151 km/h, pas de dépassement, drapeau vert ensuite) / 4 fait (bandeau de couleur avec texte, commentateur, textes fr et en) / 5 fait (section « Les drapeaux » dans CLAUDE.md)
Réglages (donnees.js) : DRAPEAUX_ACTIFS (faux = la course d'avant au bit près), DRAPEAUX_JAUNE, DRAPEAUX_BLEU, DRAPEAUX_VSC, et une quinzaine de DRAPEAUX_* (zones, facteurs, pénalité, durées)
Bug trouvé par mon propre test : la règle « un tour de retard » du bleu comparait mal les distances (le meneur est derrière le retardataire sur la piste) ; corrigée
Sortie des tests : tests/drapeaux.html 8/8 sur le Mac (mini-page ciblée) ; courses.html charge maintenant drapeaux.js (30 courses avec drapeaux) ; GitHub : voir le compte rendu au Chef
Mesures : IA 23,6 m/s sous VSC contre 36,5 sans drapeaux ; joueur 42,1 m/s au plus sous VSC (limite 42), 85,9 hors VSC
Ce que je n'ai pas pu vérifier : le bandeau à l'écran (aucune capture prise : le Mac est trop chargé), le ressenti des 5 s et du plafond de la VSC, une vraie course où une IA reste arrêtée
Réévalue.
