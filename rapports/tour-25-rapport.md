TOUR 25 — étape 4 (fin) — Codeur 1 : le contournement sans casser les courses, puis les trois options du duel chiffrées — rapport du Chef
Chef : session-5b. Base : main (6843bc0 ou plus récent). Note : 78/100 (course et IA 18/20 : il manque le duel).
Commits vérifiés : determinisme 4dd5066 (fusionné) ; contournement ed08045 (passage GitHub en cours au moment du rapport ; sur 003deae : courses.html 34/38, chocs 12, herbe 4547) ; duel 722b144 (rouge, pas tenu). Compte rendu du tour 22 relu : clair et honnête, les 7 verrous levés et le bug du jeu corrigé (r signé) sont de bonnes prises.
Ce qui manque ou ne va pas :
- le contournement « lente = sous 45–60 % de la carte » attrape les voitures en erreur qui se remettent, et les contourner à pleine vitesse donne 12 chocs et 5143 pas d'herbe sur 30 courses (référence main : 5 et 2530). Ce n'est pas ce que le propriétaire a demandé : lui parle d'une voiture BLOQUÉE ;
- le duel : verrou physique chiffré (11–19 m derrière au freinage, même vitesse de pointe, aspiration qui ne rend que 10 m sur 680 m). Il faut une décision de jeu : elle est au propriétaire, pas à nous. En attendant, on lui donne des chiffres pour choisir.

ORDRES

1. LE CONTOURNEMENT, resserré (branche contournement, puis fusion) : une voiture se contourne si elle est ARRÊTÉE OU PRESQUE (vitesse absolue < IA_ARRET_VITESSE, ~5 m/s, réglage) OU lente (< IA_LENTE_PART de la carte) DEPUIS PLUS DE IA_LENTE_DUREE secondes (~2 s, suivi d'un pas à l'autre, comme pilote.retro). Une voiture en erreur qui se remet n'est donc plus contournée tant qu'elle n'a pas duré ; une voiture bloquée l'est toujours. Garde tout le reste (lignes « éviter » des deux côtés, pas pendant le lancement, r signé).
   Fini quand : les 3 tests de l'ordre 3 du tour 22 restent verts (droite < 15 s, épingle < 25 s, robot à 40 % : personne derrière lui plus de 20 s, 0 choc) ET courses.html vert avec ses garde-fous d'origine (chocs ≤ 6, herbe ≤ 4000, ≥ 25 dépassements, coupes), ET tout le reste vert ; passage GitHub de contournement vert ; message au Chef (commit, id, la ligne de courses.html). Si une des deux conditions ne tient pas : les chiffres, et le Chef tranche.

2. LES TROIS OPTIONS DU DUEL, CHIFFRÉES, sur la branche duel (aucune fusion ; c'est un rapport pour le propriétaire) : pour chacune, 30 courses de courses.html (graines habituelles) + le duel (rapide 1,00 derrière lent 0,94, technique, 5 tours), avec : dépassements, chocs > 5 m/s, herbe, vainqueur ≠ poleman, et pour le duel : tour du dépassement ou « non ».
   A. L'aspiration plus forte et plus longue (physique.js : ASPIRATION_MAX 0,35 → 0,5 et ASPIRATION_DISTANCE 50 → 80 m ; le joueur l'a aussi) ;
   B. L'entrée côte à côte dans les virages lents (IA_NEZ_DEVANT 0,5 → 0,2, avec les garde-fous de « céder » : c'est l'essai des tours 13 et 16 qui faisait des chocs, dis combien aujourd'hui) ;
   C. Plus d'écart de rythme entre pilotes (IA_CARACTERE : la plage de rythme élargie vers le bas, les faibles plus lents, les meilleurs inchangés : le duel 1,00 contre 0,90).
   Un tableau à trois lignes dans rapports/tour-25-compte-rendu.md, avec ta recommandation argumentée en 3 lignes. Les réglages d'origine remis sur la branche à la fin (ou une branche par option, comme tu veux) : rien ne part sur main sans la décision du propriétaire.
   Fini quand : le tableau existe avec les 3 lignes complètes ; message au Chef.

3. Si le temps le permet : le compte rendu du tour 22 dit que pneus.js (Codeur 2) garde un Math.pow (ligne 35) : ne le touche pas, je le signale au Codeur 2.

RÈGLES : les mêmes (tes fichiers : ia.js, simulation.js, physique.js pour l'option A seulement et sur la branche duel, tests ; `git merge origin/main` avant chaque push, main a bougé : fantôme, départ, découverte, pilote, argent, garage ; vert = 0 échec ; CLAUDE.md pas touché). Horaires : jusqu'à nouvel ordre du propriétaire.
Questions pour le propriétaire (le Codeur n'y répond pas) : le choix entre A, B et C pour le duel, avec le tableau.
