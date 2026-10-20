TOUR 16 — étape 4d (les erreurs et la régularité des pilotes) — rapport du Chef
Commit vérifié : f9723e5 (code bde5dd6), vérifié par le Chef sur une copie à part : test.html 116/116, courses.html 37/37, ecrans.py 159/159, TOUT PASSE, 0 Chrome restant. Poussé.
Note : 54/100 — conduite 12/20, course et IA 14/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 10/10, Poki 1/5
Mesures (30 courses) : 28 dépassements (freinage 21, sortie 5, autre 2), vainqueur ≠ poleman 1, meilleur rythme top 3 30, chocs > 5 m/s 4, barrières + coupes 0, herbe 3666 pas, calcul 70 s. Duel : 0 choc, mais pas de dépassement.

Décisions du Chef :
- La fusion de repli est acceptée : les IA doublent sur main, peu mais proprement.
- Les chocs vérifiés sur le total (≤ 6 pour 30 courses) plutôt que course par course : accepté.
- Le suivi en temps est abandonné (branche tour-15 gardée pour mémoire).

Ce qui ne va pas : les courses sont trop prévisibles. Le poleman gagne 29 fois sur 30 et le meilleur rythme finit 30 fois sur 30 dans les 3 premiers. Des pilotes parfaits ne font jamais d'erreurs : c'est ça qui manque, pas d'autres règles de dépassement. CLAUDE.md prévoit déjà la régularité et le taux d'erreurs (étape 4d).

ORDRES :
1. Le caractère chiffré de chaque pilote, tiré avec la graine et rangé dans donnees.js (IA_CARACTERE : bornes de chaque trait) : rythme (déjà là), régularité, agressivité en attaque, taux d'erreurs. Pas de noms ni d'écuries (étape 6). Affiché pour chaque voiture dans courses.html.
   Fini quand : chaque course de courses.html affiche le caractère de chaque pilote.
2. La régularité : à chaque tour, le pilote vise un rythme qui varie un peu autour du sien (plus il est régulier, moins ça varie : de ±0,2 % à ±1,5 %).
   Fini quand : un test montre que l'écart-type des tours d'un pilote irrégulier est au moins 3 fois celui d'un pilote régulier.
3. Les erreurs, avec la même physique (l'IA ne fait que donner de mauvaises commandes) : freiner trop tard (tout droit large, éventuellement l'herbe), un blocage de roues (freinage plus long), une sortie large en sortie de virage. Leur fréquence vient du taux d'erreurs (par exemple de 0,1 à 1 erreur par course de 5 tours). Une erreur ne doit jamais envoyer une voiture dans une autre : pas d'erreur quand une voiture est à moins de IA_DISTANCE_ERREUR à côté ou derrière.
   Fini quand : courses.html compte les erreurs par course et par type ; elles ne causent pas de choc > 5 m/s.
4. L'agressivité joue sur le déclenchement de l'attaque (plus agressif = attaque avec moins d'avance de rythme ou plus tôt après une droite plus courte), sans toucher aux règles de sécurité du tour 14.
   Critère final (30 courses, deux passages) : vainqueur ≠ poleman ≥ 4 ; meilleur rythme top 3 entre 18 et 28 (souvent, pas toujours) ; ≥ 30 dépassements ; chocs > 5 m/s ≤ 6 ; barrières + coupes ≤ 6 ; herbe hors erreurs ≤ 4000 pas ; 20 voitures ≤ 1 choc.

Horaires : rien de nouveau après 20h40 ; commit sur main avant 20h50 seulement si `python3 tests/lancer.py` est vert (sinon branche) ; compte rendu dans rapports/tour-16-compte-rendu.md avant 20h55, puis « Réévalue. » à session-76 ; 0 Chrome --headless à 21h. Si 1 et 2 sont verts avant 3 et 4, commite-les d'abord.
