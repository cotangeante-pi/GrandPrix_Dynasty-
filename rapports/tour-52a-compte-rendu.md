TOUR 52a - compte rendu du Codeur 1 (branche attaque-tete-2)

Cause des 3 chocs de la rivalité « rival devant » (technique, graines 7 et 8, s 2328-2403) : trace dans Chrome (état de l'attaquant toutes les 0,25 s).
Ce n'était pas l'état « sortie » mais l'état « decaler » d'une attaque sur un virage lent : l'attaquant freine tard (IA_ATTAQUE_FREIN) alors que la voiture
devant freine plus tôt (s 2300, point de freinage de la carte 2349) ; l'écart passe de 11 m à 6,6 m en 0,5 s avec 8 m/s de plus, avant le point de freinage,
donc avant que la règle « le nez devant au freinage » ne puisse renoncer. Le choc est à 7 à 13 m/s.

Correction (ia.js, donnees.js), sous IA_LENT_PREVU (1 ; 0 = la course d'avant), IA_LENT_PREVU_DIST (80 m) et IA_LENT_PREVU_MARGE (2 m) : attaque décalée sur un virage lent,
à moins de 80 m du point de freinage, si d'après les vitesses (écart - vitesse relative x distance / vitesse) l'attaquant n'aura pas le nez devant au freinage (IA_NEZ_DEVANT),
il freine comme avant l'attaque (style normal, pas IA_ATTAQUE_FREIN) : l'attaque continue, il ne fonce plus sur la voiture qui freine plus tôt.
Essais écartés : ne pas lancer l'attaque, ou y renoncer à 60 m du freinage : la rivalité passait à 0 choc mais le test « disposition » (moteur) tombait à 0 défense contre X,
parce que l'attaque de X n'existait plus (0 défense en Chrome avec ces essais, 2 avec IA_LENT_PREVU=0).

Mesure Chrome (c1f/rivalite.js, 8 graines, sous le verrou) : avant 3 chocs (avec/sans rivalité 0 sur les mêmes graines) ; après avec 0, sans 0, défense avec 0, défense sans 0,
herbe 180/180/165/180, TEST casse 0/0 OK, TEST attaque 156 > 117 OK. Les autres travaux (stands, 30 courses, moteur...) sont à confirmer sur GitHub.
Le repli (IA_ATTAQUE_TETE 1,5) n'a pas été nécessaire.
