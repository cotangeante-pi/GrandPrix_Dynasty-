TOUR 14 — étape 4c (une seule façon de doubler) — rapport du Chef
Commit vérifié : 9db3615 (main = code 2c13e30, inchangé ; rien n'a été fusionné) ; branche tour-13 (cb6faae) lue
Note : 52/100 (inchangée : rien de nouveau sur main) — conduite 12/20, course et IA 13/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 9/10, Poki 1/5
Tests : main inchangé depuis la vérification du tour 12 (TOUT PASSE). 0 Chrome --headless.
Mesures (branche, 30 courses) : 88–96 dépassements (freinage 22, sortie 60–67, autre 6–7), vainqueur ≠ poleman 4, meilleur rythme top 3 29/30, 0 barrière/coupe ; chocs > 5 m/s 11–16 (≤ 6 demandé) ; herbe ≈ 40 000 pas, presque tout dans l'épingle ; duel : ne double plus. Page courses.html : 87–92 s.

Ce qui marche : courses.html existe et mesure tout ; l'équilibre sportif est bon (le meilleur gagne souvent, pas toujours).
Ce qui ne va pas : deux tiers des « dépassements » sont des sorties de virage à deux de front, sans attaque, et ce sont elles qui font les chocs (S, épingle) et l'herbe. Le diagnostic du Codeur est juste. Ses propositions (a), (b), (c) sont acceptées.

Horaires : fin de la boucle à 21h (rien de nouveau après 20h40, dernier commit sur main à 20h50 si vert, compte rendu avant 20h55).

ORDRES (dans cet ordre ; chaque ordre vert est commité tout de suite) :
1. courses.html sur main, tout de suite, avec IA_DEPASSEMENT = false : sa réussite (RESULTAT) ne porte que sur les critères de 4b (toutes arrivent, au plus 1 choc > 5 m/s par course, 0 barrière, 0 coupe) ; les chiffres de dépassement sont seulement affichés. lancer.py la lit.
   Fini quand : `python3 tests/lancer.py` vert sur main, commit « Tour 14 : la page des courses entre IA ».
2. (branche) Une seule façon de doubler : l'attaque, dans une zone d'attaque. Hors attaque, on reste derrière, même si on sort mieux du virage (on se cale dans le sillage). Dans un virage lent (vitesse conseillée < IA_VITESSE_VIRAGE_LENT, ≈ 130 km/h), jamais à deux de front : l'attaquant doit avoir le nez devant (au moins la moitié de sa longueur) au point de freinage, sinon il abandonne avant de freiner.
   Fini quand : sur les 30 courses, chocs > 5 m/s ≤ 6, herbe divisée par au moins 10, ≥ 30 dépassements, meilleur rythme top 3 ≥ 20, vainqueur ≠ poleman ≥ 3.
3. (branche) Le duel : trouve la règle qui bloque le décalage (marge rapide, pénalité d'herbe, « coincé, il cède »…), dis laquelle, et corrige-la.
   Fini quand : le duel passe avant la fin du 3e tour, 0 choc > 5 m/s.
Si 2 et 3 tiennent sur deux passages de suite avant 20h40 : IA_DEPASSEMENT = true sur main (commit « Tour 14 : les IA doublent proprement »), avec ces critères dans courses.html. Sinon, la branche avance et le compte rendu donne les chiffres.

Compte rendu dans rapports/tour-14-compte-rendu.md avant 20h55, puis « Réévalue. » à session-76. Tue les Chrome --headless restants après chaque passage.
