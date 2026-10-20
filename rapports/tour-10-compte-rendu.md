TOUR 10 — compte rendu du Codeur (session-dd)
Commit : 7b2b1bf (« Tour 10 : des pilotes qui choisissent leur ligne »)

Ordres : 1 fait / 2 fait / 3 PAS FAIT (préparé, mais coupé : voir plus bas) / 4 fait

1. Le pilote qui choisit sa ligne — fait (ia.js).
   - La trajectoire idéale n'est plus suivie. Elle devient la carte du circuit (`carteDepuis`) : où sont les virages (8 sur le technique, 6 sur le test), à quel écart on peut passer, à quelle vitesse.
   - Toutes les IA_PERIODE_DECISION (0,15 s), `deciderLigne` construit des lignes sur IA_HORIZON (200 m), tous les 4 m :
     - sa ligne rapide (la carte, à sa façon : son style et la variation de ce tour) ;
     - continuer à sa place (puis la rejoindre) ;
     - intérieur et extérieur du prochain virage (±2 m) ;
     - à gauche ou à droite de la voiture devant (codé mais coupé, voir 3).
   - Chaque ligne part de là où il est, sans saut. Elle part de sa ligne d'avant à l'endroit où il en est. S'il en est à plus de 1,5 m (poussé, sorti, au départ), elle part de la voiture : sa place et son cap. L'écart s'éteint doucement (Hermite), ce qui garde la forme de la cible.
   - Note d'une ligne = temps calculé avec la physique (courbure → vitesse possible, rythme compris ; passe arrière de freinage ; passe avant depuis sa vitesse), plus des pénalités :
     - bords ;
     - voitures vues : prévues à vitesse et place constantes ; sur une ligne qui passe derrière l'une d'elles, il est bloqué à sa vitesse ; s'il la touche, +5 s ;
     - freinage impossible ;
     - vitesse qui manque en bout de ligne (elle se paierait plus loin) ;
     - changer d'idée.
   - Il suit la meilleure avec la poursuite (qui vise maintenant par rapport à la direction où la voiture va vraiment, glissade comprise) et le réglage gaz/frein.
   - Il ne voit que `voituresVues` (simulation.js) : le cône devant (±0,6 rad, 120 m), le couloir (4,5 m), et à côté de lui (rétroviseurs : ±8 m, 7 m de côté). Pour chacune : sa place sur la piste et sa vitesse.
   Résultats, seul, 5 tours (pilote neutre) :
   - test : 53,67 / 48,93 / 48,92 / 48,92 / 48,92 s (le rail faisait 47,88) ;
   - technique : 57,78 / 55,10 / 55,10 / 55,10 / 55,10 s (le rail : 54,43) ;
   - 0 barrière, 0 coupe, 0 herbe.
   Coût : 20 pilotes en course, 0,25 à 0,53 ms par pas en moyenne (décisions, vision, physique et contacts compris).
   Ce qu'il a fallu corriger en route (mesuré, pas deviné) :
   - repartir de la voiture à chaque décision faisait reculer la cible : la voiture glissait 1,5 m à l'extérieur de la courbe rapide pendant 400 m ;
   - une transition cubique écrasait le S : 127 km/h au lieu de 183 ;
   - sans la pénalité de vitesse en bout de ligne, il préférait des lignes plus courtes mais lentes en sortie.

2. Chaque pilote a sa façon de piloter — fait. `tirerStyle` (avec hasard() et la graine de la course + GRAINE_STYLES) :
   - point de corde : IA_STYLE_APEX, de −5 m (tôt) à +5 m (tard) ;
   - corde : IA_STYLE_CORDE, de 0 à 1,5 m de largeur qu'il n'utilise pas près des virages ;
   - marge au bord : 1,1 à 2 m ;
   - freinage : 0,92 à 1 ;
   - pour chaque tour et chaque virage : ±2 m de point de corde et ±0,4 m de place.
   Test, 10 IA seules sur le technique :
   - écart-type des places à l'apex : 0,77 / 0,55 / 1,76 / 2,37 / 1,76 / 0,79 / 1,86 / 1,88 m (les 8 virages) ;
   - plus grand changement de place à un apex d'un tour à l'autre, pour chaque IA : de 3,27 à 6,18 m.
   Un style coûte de 0,1 à 2 s au tour sur le technique.

3. Doubler — PAS FAIT. Les critères ne sont pas atteints.
   Ce qui est en place :
   - les lignes « à gauche / à droite de la voiture devant » (codées, coupées par IA_DEPASSEMENT = false) ;
   - l'aspiration dans la physique : derrière une voiture, jusqu'à −35 % de traînée à moins de 50 m (`aspirationVoitures`, la même pour tous ; sans voiture devant, rien ne change).
   Ce que donnent les 10 courses (10 IA, graines 1–5, deux circuits), dépassements coupés :
   - 0 dépassement ; l'arrivée est la grille dans 10 courses sur 10 ; le meilleur rythme n'est jamais dans les 3 premiers (il finit à sa place de grille) ;
   - 0 choc à plus de 5 m/s, 0 barrière, 0 coupe : c'est pour garder ça que j'ai coupé les dépassements.
   Avec les dépassements en marche : 2 à 5 changements de place sur 10 courses, mais 11 à 18 chocs à plus de 5 m/s, surtout au départ.
   Pourquoi ça ne double pas, mesuré sur un duel rapide (1,00) contre lent (0,94) :
   - seul, le rapide fait 55,10 s et le lent 56,94 s ;
   - derrière, le rapide ne fait plus que 56,8–57,1 s : il perd tout son avantage à être retenu dans les virages lents ;
   - dans les lignes droites, ils vont aussi vite l'un que l'autre et il reste à 40–60 m, hors du sillage ;
   - les lignes « à côté » coûtent de 1,6 à 4 s de plus dans l'épingle (s'écarter de 3 m dans un virage serré) ;
   - un bonus d'attaque (0,5 et 1,5 s) n'a rien changé.
   Le rythme ne porte plus sur la vitesse de pointe (c'est la voiture), seulement sur les virages.
   Pistes pour le tour 11 :
   (a) une décision d'attaque à part : retenu depuis X s avec un vrai écart de vitesse → il se décale avant la zone de freinage, sur la droite, dans le sillage, puis plonge à l'intérieur ;
   (b) la voiture doublée voit celle d'à côté dans ses rétroviseurs et lui laisse la place (c'est déjà dans sa note) ;
   (c) un écart de rythme plus grand, ou les caractères de 4d. Avec 0,94–1,00, l'écart n'est que d'environ 1,8 s au tour.

4. Le rail ne conduit plus — fait. ?ia=1 (`JEU.pilote`), ?ia=N et simulerCourse utilisent piloterIA. La page calcule la carte en fond comme avant, puis donne leur pilote aux IA (`donnerCarte`).
   ecrans.py, ?course=5&ia=10&circuit=technique :
   - console vide ;
   - les 10 avancent de 1410 à 1659 m en 30 s, 0 contact ;
   - capture ia10.png.
   ?ia=1 : même meilleur tour que dans test.html (55,10 s).
   Tests du rail remplacés :
   - « 5 tours sans barrière… » (piloteIA) → pilote neutre, avec les limites 50 s et 56 s ;
   - « déterministe » → avec le pilote ;
   - les 18 départs et le départ impossible : « rejointe » se mesure maintenant par rapport à la ligne rapide de la carte ;
   - « voiture lente devant » → il la voit comme une vraie voiture (place, écart, vitesse) ;
   - « vision » (voitureDevant) → voituresVues ;
   - « rapide derrière lent » → pilotes neutres de rythme 0,94 et 1,00 ;
   - ecrans.py : le tour de ?ia=1 passe de 54,43 à 55,10 s.
   Les tests de la carte sont gardés : dans la piste, courbure −20 %, freinage, calcul découpé.
   Supprimés du code : piloteIA, voitureDevant, vitesseConseillee, IA_ECART_RATTRAPAGE.
   Nouveaux tests : la carte (virages), le coût de 20 pilotes, les styles.

Autres changements :
- Départ (IA_DEPART) : chaque voiture garde sa file jusqu'à 150 m puis rejoint sa ligne avant 350 m. Sans ça, les deux files se rabattaient l'une sur l'autre à 5–14 m/s.
- Réflexe : il ne braque pas vers une voiture à côté de lui à moins de 3,5 m (IA_REFLEXE_COTE) ; un peu en retrait, il lui cède (IA_CEDER).
- Les voitures juste derrière (moins de 8 m) comptent dans la note des lignes : il ne se rabat plus sur elles.

Sortie des tests (python3 tests/lancer.py) : TOUT PASSE
- tests/test.html : RESULTAT 126/126 (54 s) ;
- tests/ecrans.py : RESULTAT 148/148 (103 s).
- 4b toujours vert : 10 courses de 10 IA et 20 voitures, toutes arrivées, 0 choc à plus de 5 m/s, 0 barrière, 0 coupe. Avec 20 voitures, 0 choc au-dessus de 3 m/s.
- 18 départs : tous rejoints, tour suivant de 55,4 à 55,7 s, 0 barrière. Départ impossible (début de l'épingle à 60 m/s, nez dehors) : 1035 pas contre la barrière, puis il repart et fait 55,47 s.

CLAUDE.md : je n'y ai pas touché (mes règles : pas de modification de CLAUDE.md sur la demande d'une autre session). Texte proposé pour ia.js :
- `ia.js` : l'IA en calcul pur. La carte d'un circuit (`carteDepuis` : la trajectoire idéale, calculée une fois et découpée en tranches par `etapesTrajectoire`, ses virages et les vitesses possibles) est ce que le pilote sait de la piste, pas une ligne à suivre. `piloterIA(pilote, v, vues, dt)` : toutes les 0,15 s, le pilote compare quelques lignes sur 200 m qui partent de là où il est, les note avec la physique et les voitures qu'il voit, suit la meilleure et ne sort que `{ gaz, frein, direction }`. Chaque pilote a sa façon de piloter (`tirerStyle`).
- dans `physique.js` : `aspirationVoitures` (le sillage, moins de traînée).
- dans `simulation.js` : `voituresVues` remplace `voitureDevant`.

Ce que je n'ai pas pu vérifier :
- ?ia=10 à l'œil sur un vrai Mac (3 i/s sous swiftshader).
- Si l'aspiration change la sensation de conduite pour le propriétaire : pour lui, rien ne change tant qu'il n'y a pas de voiture devant lui.

Réévalue.
