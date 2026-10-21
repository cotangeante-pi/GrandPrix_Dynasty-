TOUR 18 — étape 4d (des surprises : les erreurs sur main) — rapport du Chef
Reprise du 2026-10-21, 17h. Le dossier s'appelle maintenant « Grand Prix Dynasty » (renommé par le propriétaire) : …/jeu/jeux poki/Grand Prix Dynasty.
Commit vérifié : ae35577 (code fa19fdb) ; tests relancés par le Chef dans le dossier renommé : test.html 118/118, courses.html 37/37, ecrans.py 158/159. ÉCHEC : « index.html?course=5&ia=9&joueur=1&circuit=technique : la voiture du joueur et les 9 IA ont avancé » — une IA n'a avancé que de 20 m, une autre (30 m) et le joueur (41 m) ont 8 chocs chacun : le joueur, qui ne fait qu'accélérer tout droit dans ce test, est rentré dans une IA au départ.
Note : 55/100 — conduite 12/20, course et IA 15/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 10/10, Poki 1/5
Mesures (tour 17) : 30 courses : 31 dépassements, 5 chocs > 5 m/s, herbe 2589, vainqueur ≠ poleman 0, meilleur rythme top 3 30/30. Duel : pas de dépassement.

Ce qui ne va pas (du plus grave au moins grave) :
- Le poleman gagne 30 fois sur 30 : aucune surprise. Le critère de l'étape 4 dit « les meilleurs gagnent souvent, mais pas toujours, avec quelques erreurs ».
- Le duel ne double pas.
- Les erreurs existent sur la branche tour-16, mais elles ont été faites avant les lignes stables du tour 17.

Horaires : comme hier, boucle jusqu'à 21h (rien de nouveau après 20h40, dernier commit sur main à 20h50 si vert, compte rendu avant 20h55, 0 Chrome à 21h). Le Mac est gardé éveillé jusqu'à 21h10.

ORDRES :
0. Le test du joueur au milieu des IA : comprendre l'échec (le joueur qui fonce tout droit au départ dans la voiture devant ; des IA qui partent trop lentement ?). Si les IA démarrent anormalement lentement devant le joueur, c'est un bug à corriger ; sinon, le test doit faire conduire le joueur sans percuter (par exemple, laisser 2 s aux IA avant d'appuyer sur ↑), sans affaiblir ce qu'il vérifie.
   Fini quand : la cause est dite dans le compte rendu, et ecrans.py passe 3 fois de suite.
1. Refaire les erreurs de la branche tour-16 sur main (freinage trop tard, blocage de roues, sortie large ; fréquence selon le taux d'erreurs du caractère ; jamais avec une voiture à moins de IA_DISTANCE_ERREUR à côté ou derrière). Une erreur ne doit jamais finir en choc : pendant une erreur et 2 s après, la voiture fautive cède la place.
   Fini quand : courses.html compte les erreurs par type ; 0 choc > 5 m/s pendant une erreur ; chocs > 5 m/s ≤ 6 au total ; 20 voitures ≤ 1 choc ; herbe hors erreurs ≤ 4000.
2. Des surprises : si les erreurs ne suffisent pas, augmente leur coût (une erreur doit coûter en moyenne 0,5 à 2 s) ou leur fréquence pour les pilotes peu fiables, en gardant les bornes dans IA_CARACTERE.
   Fini quand : sur 30 courses, deux passages de suite : vainqueur ≠ poleman ≥ 4 ; meilleur rythme top 3 entre 18 et 28 ; ≥ 30 dépassements.
3. Le duel (seulement si 1 et 2 sont verts avant 20h) : trouver pourquoi le rapide ne double pas avec les règles actuelles, et le corriger sans rouvrir les chocs.
   Fini quand : dépassement avant la fin du 3e tour, 0 choc > 5 m/s.
Chaque ordre vert est commité sur main (« Tour 18 : … ») seulement si `python3 tests/lancer.py` passe ; sinon sur une branche, avec les chiffres. Compte rendu dans rapports/tour-18-compte-rendu.md, puis « Réévalue. » à session-76.
