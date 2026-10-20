TOUR 12 — compte rendu du Codeur (session-dd)
Sur main : 2c13e30 (« Tour 12 : grille qualifiée, tests moins pressés ») = ordres 4 et 2, verts.
Sur la branche tour-12-attaque : 5b85713 = ordres 1 et 3, PAS verts (critères à la limite, voir les chiffres).

Ordres : 4 fait / 2 fait / 1 fait sur la branche (duel et épingle OK) / 3 PAS tenu à chaque passage (chocs)

4. Tests trop pressés — fait (main). « le circuit est dessiné » et « choisir 5 tours lance le compte à rebours » attendent leur condition (attendre(), 30 s au plus). Pour le second, la condition accepte aussi le GO, si le compte à rebours a déjà fini sur un Mac lent. Rien d'autre ne change.
   ecrans.py, trois passages de suite sur main : 159/159, 159/159, 159/159. Après chaque passage : 0 Chrome --headless restant.

2. Grille qualifiée — fait (main). `qualifier(e)` (simulation.js) :
   - temps = `tourEstime(carte, rythme)` (le tour de la carte au rythme du pilote, sans le simuler) × (1 ± IA_QUALIF_HASARD = 0,5 %), tiré avec la graine + GRAINE_QUALIF ;
   - la grille suit ces temps ; le joueur de ?joueur=1 reste dernier ;
   - `simulerCourse` rend `grille` ; test.html affiche la grille de chaque course avec les temps.
   Exemple, technique, graine 3 : 1. n°5 54,002 s · 2. n°1 54,342 · 3. n°10 55,017 · … · 10. n°2 57,026 · 11. joueur.
   Les tests de 4b passent à la règle du tour 12, « au plus 1 choc à plus de 5 m/s par course », affichée. Je l'ai appliquée dès maintenant sur main : avec la nouvelle grille, la course de 20 voitures du circuit test a 1 choc fort (sans attaque) ; les 10 autres courses n'en ont aucun.

1. Priorité — fait sur la branche.
   - (c) Prévision : une voiture à moins de 15 m garde sa place actuelle ; plus loin, elle garde son écart à la ligne idéale de la carte. Une seule hypothèse, plus de mélange.
   - Celle de devant garde sa ligne : avec une voiture à côté ou dans ses rétroviseurs à moins d'une longueur, ses lignes ne s'approchent pas d'elle (au mieux jusqu'à largeur + IA_MARGE_LAT). À hauteur (au moins un tiers de longueur), elle lui laisse largeur + IA_ESPACE_LAISSE (1,5 m) jusqu'à la sortie du virage.
   - Celle de derrière n'attaque que si l'écart largeur + IA_MARGE_LAT tient sur toute la ligne d'attaque (sinon : « pas la place », elle renonce pour ce virage). La ligne d'attaque se cale sur la place actuelle de la voiture attaquée.
   Ce qu'il a fallu en plus pour que le duel passe :
   - le rythme joue aussi sur le freinage (un pilote plus rapide freine plus près de la limite) ; en attaque, il ose 1,05 de sa marge (IA_ATTAQUE_FREIN) ;
   - la préparation (collé dans le sillage) a sa propre limite, IA_PREPARER_DUREE_MAX = 30 s ; avant, elle s'arrêtait au bout de 10 s, au milieu de la ligne droite de 800 m ;
   - de loin (au-delà de 2 × la distance de suivi), il se rapproche franchement (IA_GAIN_DISTANCE_LOIN = 1,5). Avant, une voiture qui freinait 100 m devant le faisait freiner trop tôt ;
   - collé à IA_DISTANCE_ATTAQUE (7 m) seulement s'il est bien aligné dans le sillage (moins de 2,5 m de côté) ;
   - plus de lignes de rechange (intérieur, extérieur, garder sa place) quand une voiture est tout près : elles faisaient des écarts imprévus (5 des 6 chocs forts du relevé précédent).
   Résultats sur la branche :
   - duel 1,00 contre 0,94 (30 m derrière, technique) : dépassement au 2e tour (2497 ou 2550 m, sortie de l'épingle), 0 choc à plus de 5 m/s ; ensuite le rapide tourne en 55,1 s ;
   - côte à côte à l'entrée de l'épingle (150 km/h, 3,5 m d'écart) : 0 choc, 0 barrière, 0 herbe, 1 dépassement propre.

3. Critère 4c — PAS tenu à chaque passage (branche, grille qualifiée, IA_DEPASSEMENT = true). Sur plusieurs passages, au fil des réglages :
   | | dépassements | vainqueur ≠ poleman | meilleur rythme top 3 | chocs > 5 m/s | barrières + coupes |
   |---|---|---|---|---|---|
   | critère | ≥ 15 | ≥ 2 | ≥ 7 | ≤ 3 | ≤ 3 |
   | meilleur passage | 43 | 2/10 | 10/10 | 2 | 0 |
   | dernier passage | 23 | 2/10 | 10/10 | 4 | 0 |
   Les tests de 4b : 1 à 2 chocs forts dans la course de 20 voitures, selon le réglage ; et une fois, une course de 10 avec 2 chocs.
   Les chocs qui restent (dernier relevé, toutes les IA sur leur ligne rapide) :
   - test, graine 4, 492 m et 536 m (sortie de la 1re chicane) : n°3 et n°4, 106–116 km/h, 1,2 m de côté, l'une 5,7 m derrière l'autre ; puis 64/84 km/h, l'une hors piste (−7,6 m) qui revient ;
   - technique, graine 2, 740 m (courbe rapide) : n°7 à 157 km/h et n°8 à 182 km/h, 1,9 m de côté, 3,8 m derrière ;
   - technique, graine 3, 1290 m et 20 voitures, 1296 m (sortie du S) : 120–140 km/h, 2,6 m de côté, 2,5–4,4 m d'écart.
   En résumé : ce sont des voitures en biais, presque à hauteur, dans les enchaînements (chicane, sortie du S) ou dans la courbe rapide, quand la plus rapide passe à moins de largeur + IA_MARGE_LAT. Les deux suivent leur ligne rapide ; c'est le tracé du S qui les rapproche.
   À noter aussi : beaucoup de pas dans l'herbe sur le technique pendant les dépassements (jusqu'à 3600 sur une course), sans barrière ni coupe.
   Ce que je ferais ensuite :
   (a) Dans les enchaînements (S, chicane), on n'attaque pas et on reste à la file : interdire l'attaque si le virage suivant est à moins de X m du précédent.
   (b) Le contrôle « à hauteur » à l'entrée du virage avec une marge latérale plus grande dans les virages rapides.
   (c) Mesurer sur 3 jeux de graines pour ne pas régler sur le bruit : aujourd'hui, un réglage qui passe sur les graines 1–5 peut échouer au passage suivant après un petit changement.

Sortie des tests sur main (2c13e30) : TOUT PASSE — test.html 129/129 (192 s, Mac chargé), ecrans.py 159/159 (276 s), 0 Chrome restant.

Réévalue.
