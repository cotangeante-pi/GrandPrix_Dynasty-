TOUR 14 — compte rendu du Codeur (session-dd)
Sur main : d840007 (« Tour 14 : la page des courses entre IA ») = ordre 1, vert sur deux passages.
Branche tour-14 : cc798b3 = ordres 2 et 3, PAS verts. IA_DEPASSEMENT reste absent de main (pas d'attaque).

Ordres : 1 fait / 2 en partie (chocs et herbe tenus, pas les dépassements) / 3 pas fait (le blocage est trouvé, pas corrigé)

1. courses.html sur main — fait, vert.
   - J'ai porté sur main ce qu'il faut pour compter : où commence chaque contact (physique.js), le point de freinage de chaque virage (ia.js), les dépassements rangés par endroit (simulation.js).
   - RESULTAT = le critère de 4b, course par course : toutes arrivent, au plus 1 choc à plus de 5 m/s, 0 barrière, 0 coupe. Les dépassements et le reste sont affichés. Les critères de 4c s'ajoutent tout seuls quand REGLAGES.IA_DEPASSEMENT est vrai.
   - lancer.py lance test.html, courses.html, puis ecrans.py ; les courses ont quitté test.html.
   - Deux passages de suite : test.html 115/115, courses.html 33/33 (78–97 s de calcul), ecrans.py 159/159, TOUT PASSE, 0 Chrome restant.
   - Sur main (sans attaque) : 1 dépassement sur 30 courses, 0 choc à plus de 5 m/s, herbe 72 pas ; course de 20 voitures du circuit test : 1 choc.

2. Une seule façon de doubler (branche tour-14). Ce qui est codé :
   - Hors attaque, à la file : une voiture à moins de 30 m devant (IA_FILE_DISTANCE) et à moins de 6 m de côté (IA_FILE_COTE), il la suit, même s'il sort mieux du virage. Seule exception : celle qu'il attaque, une fois décalé.
   - Virage lent (la carte y passe sous IA_VITESSE_VIRAGE_LENT = 130 km/h ; virage.lent sur la carte) : au point de freinage de la carte, l'attaquant doit avoir le nez devant (son centre au moins une demi-longueur devant, IA_NEZ_DEVANT), sinon il abandonne avant de freiner.
   - Virages lents de chaque circuit : test 2394 et 2712 m (123–125 km/h) ; technique 2483 (l'épingle, 59 km/h) et 3343 m (124 km/h).
   - Virages où l'on peut attaquer (au moins 150 m de droite avant) : test 1898, 2394, 2712 ; technique 1612, 2483, 3343.
   Mesure de l'état gardé (30 courses, deux fois le même résultat) :
   | | critère | branche tour-14 | tour 13 |
   |---|---|---|---|
   | dépassements | ≥ 30 | 28 (freinage 21, sortie 5, autre 2) | 88–96 |
   | vainqueur ≠ poleman | ≥ 3 | 1 | 4 |
   | meilleur rythme top 3 | ≥ 20 | 30 | 29 |
   | chocs > 5 m/s | ≤ 6 | 4 | 11–16 |
   | herbe | ÷ 10 | 3666 pas (÷ 11) | 40 000 |
   | 20 voitures | ≤ 1 choc | 0 et 0 | 3 |
   Les chocs et l'herbe sont réglés ; il manque 2 dépassements et 2 vainqueurs ≠ poleman.
   Essais qui donnent plus de dépassements, mais remettent des chocs ou de l'herbe :
   | réglage | dépassements | vainqueur ≠ poleman | chocs | herbe |
   |---|---|---|---|---|
   | contrôle des virages lents à l'entrée, échappée à 2 s | 57 | 3 | 7 | 36 720 |
   | virage lent sous 108 km/h | 49 | 2 | 9 (+ 4 à 20 voitures) | 5 436 |
   | collé à 7 m même en biais | 54 | 1 | 15 | 8 180 |
   | attaque après 1 s et décalage jusqu'à 25 m | 28 | 1 | 9 (+ 4) | 2 661 |
   | suivi à 9 m | 99 | 6 | 19 | 55 758 |

3. Le duel — la règle qui bloque est trouvée, pas corrigée.
   - Au tour 13, c'était la grande marge des virages rapides : je l'avais appliquée partout au-dessus de 180 km/h. Une voiture à 4 m de côté comptait alors comme « dans sa file », et la ligne d'attaque devait passer à 4,5 m. Elle ne s'applique plus que pour la place à laisser à côté, dans un vrai virage rapide (ecartCoteACote). Ça ne suffit pas.
   - Le vrai blocage, mesuré : en sortie de virage lent, la distance de suivi (IA_DISTANCE_SUIVI, 14 m, donc près d'1 s à 60 km/h) laisse le rapide à environ 1 s du lent. Cet écart se garde ensuite en ligne droite : 80 à 85 m dans la droite de 800 m, hors du sillage (qui s'arrête à 50 m). Son attaque s'est arrêtée (« échappée ») avant cette droite.
   - Au freinage de l'épingle, il est donc 15 à 30 m derrière ; la règle des virages lents (nez devant au point de freinage) l'arrête alors avant même qu'il freine. Le dernier virage (3343 m) est lent aussi, et au 1612 m il n'est pas assez près.
   - Raccourcir la distance de suivi à 9 m débloque les dépassements (99 sur 30 courses), mais fait monter les chocs à 19 et l'herbe à 55 000 pas.
   Ce que je proposerais :
   (a) Une distance de suivi en temps (environ 0,4 s), pas en mètres : près à basse vitesse, loin à haute vitesse. C'est la cause de l'écart d'1 s.
   (b) Garder l'attaque en préparation à travers la sortie de virage tant que l'écart en temps ne grandit pas (aujourd'hui, elle s'arrête à 1 s, juste quand la droite commence).
   (c) Pour l'épingle, une seule vraie façon : sortir collé du virage d'avant, prendre le sillage dans la droite de 800 m, se décaler avant le freinage. Il faut donc (a) et (b) d'abord.

Sortie des tests :
- main (d840007) : TOUT PASSE deux fois (115/115, 33/33, 159/159), 0 Chrome restant.
- branche : courses.html (critères 4c du tour 14) 7/9 dans l'état gardé (échecs : 28 dépassements, vainqueur ≠ poleman 1).
Aucun essai ne tourne, 0 Chrome --headless.

Réévalue.
