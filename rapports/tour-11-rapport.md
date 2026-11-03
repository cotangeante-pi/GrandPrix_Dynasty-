TOUR 11 — étape 4c (doubler pour de vrai) — rapport du Chef
Commit vérifié : cd9658d (code 7b2b1bf)
Note : 50/100 — conduite 12/20, course et IA 11/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5
Tests : relancés par le Chef → TOUT PASSE (test.html 126/126, ecrans.py 148/148, 274 s ; Mac chargé).
Mesures : pilote seul : test 48,92 s, technique 55,10 s, 0 faute. Styles : écart-type à l'apex 0,55–2,37 m, chaque IA change de 3,3–6,2 m d'un tour à l'autre. 20 pilotes : 0,25–0,53 ms par pas. Calcul d'une course : 2,2 s (test, 10 voitures) mais 15,0 s (technique, 10 voitures) et 5,4–5,7 s à 20 voitures.

Ce qui marche (vérifié) : plus de rail, chaque IA choisit sa ligne, ne voit que voituresVues ; ia.js et simulation.js n'écrivent aucune variable d'état. Pas plus lent que le rail. Départ propre (file gardée puis rabattement). 4b reste vert.

Ce qui ne va pas (du plus grave au moins grave) :
- Toujours une procession : arrivée = grille 10/10 avec IA_DEPASSEMENT = false. Le rapide coincé derrière perd tout son avantage (55,1 → 57 s).
- L'aspiration a été ajoutée à la physique : prévue par CLAUDE.md et identique pour tous, mais c'est un changement de conduite ; le Chef le signale au propriétaire (il le sentira en roulant derrière une IA, pas avant l'étape 5).
- Le calcul d'une course de 10 IA sur le technique a pris 15 s chez moi : à 50 courses (critère de l'étape 4), la page de test durerait trop longtemps. Peut-être la charge du Mac : à mesurer.

Le diagnostic du Codeur est accepté : il faut une DÉCISION d'attaque à part, pas seulement une note de ligne.

ORDRES :
1. L'attaque, en étapes, pour chaque IA : suivre → se préparer (dans le sillage, l'aspiration la rapproche dans la droite) → se décaler avant le point de freinage, du côté de l'intérieur du virage suivant → freiner plus tard à l'intérieur → si elle n'est pas au moins à moitié à hauteur au point de freinage, abandonner et revenir derrière. Elle déclenche l'attaque seulement si elle est plus rapide (rythme, ou retenue depuis IA_ATTENTE_ATTAQUE s) ; les chiffres dans donnees.js.
   Fini quand : un test de duel (rythme 1,00 contre 0,94, le rapide part 30 m derrière, technique, 5 tours) : le rapide passe devant avant la fin du 3e tour, sans choc à plus de 5 m/s, et le dépassement est affiché (tour, endroit).
2. La voiture attaquée laisse la place (pas encore de défense) : si une voiture est à côté d'elle, à au moins un tiers de longueur, elle ne se rabat pas dessus et lui laisse une largeur de voiture jusqu'à la sortie du virage. C'est ce qui évite les 11 à 18 chocs du tour 10.
   Fini quand : un test met deux voitures côte à côte à l'entrée de l'épingle : 0 choc à plus de 5 m/s, aucune ne sort de la piste.
3. IA_DEPASSEMENT = true, et le critère du tour 10 : 10 courses de 10 IA (graines 1–5, deux circuits) : ≥ 15 dépassements au total, arrivée ≠ grille dans ≥ 7 courses sur 10, meilleur rythme dans le top 3 dans ≥ 5 sur 10, chocs > 5 m/s ≤ 3 au total, barrières + coupes ≤ 3 au total, tout affiché. Tu peux élargir IA_RYTHME jusqu'à 0,90–1,00 si c'est nécessaire (dis-le).
4. Le temps de calcul : afficher le meilleur de 3 mesures pour une course de 10 IA sur chaque circuit ; si le meilleur dépasse 3 s, trouver d'où vient le coût (décision toutes les 0,15 s ? voituresVues ?) et le réduire sans changer les résultats.
   Fini quand : le meilleur des 3 est ≤ 3 s sur les deux circuits, ou tu expliques précisément pourquoi ce n'est pas possible.

Commit « Tour 11 : les IA doublent » seulement si `python3 tests/lancer.py` passe. Si 3 n'est pas atteint, commite 1, 2 et 4 verts, laisse IA_DEPASSEMENT à false, et donne les chiffres. Compte rendu dans rapports/tour-11-compte-rendu.md, puis « Réévalue. » à session-76.

Pour le propriétaire : l'aspiration est maintenant dans la physique (35 % de traînée en moins collé derrière une voiture, jusqu'à 50 m). Il la sentira à l'étape 5.

AJOUT (20h20, demande du propriétaire : « le problème c'est que je me commande pas ») — ordre 0, à faire EN PREMIER :
0. `?ia=N&joueur=1` : le joueur conduit au clavier au milieu de N IA (il part dernier), caméra et bandeau sur lui, les IA le voient et le touchent comme les autres. Pas de feux, de classement ni de podium (étape 5).
   Fini quand : ecrans.py ?course=5&ia=9&joueur=1&circuit=technique, ↑ quelques secondes : console vide, joueur et IA avancent, capture joueur-ia.png ; test moteur : une IA évite ou s'arrête derrière une voiture joueur arrêtée, sans choc > 5 m/s. Commit à part « Tour 11 : jouer contre les IA ».
