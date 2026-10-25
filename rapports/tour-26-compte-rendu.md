TOUR 26 — compte rendu du Codeur 1 (2026-10-23, 22h05 → 23h50)

Commit : pneus 08c8a3a (ordre 1, VERT sur GitHub 40053343302, fusionné sur main par le Chef) ; pneus 0b77e2f (ordre 2 = 1972b62 + origin/main a0c1f19 ; passage GitHub : voir « Sortie des tests ») ; ce compte rendu sur pneus. Boucle figée à minuit par le Chef (main 4fefa72) : rien d'autre n'a été lancé après.
Ordres : 1 fait / 2 fait (sous réserve du passage GitHub de 0b77e2f) / 3 pas fait (pas commencé : le Chef l'a reporté à demain, « ne commence pas un ordre que tu ne peux pas rendre vert avant 23h40 »).

Tout est derrière PNEUS_ACTIFS (faux par défaut, ?pneus=1) : sans lui, courses.html est identique au bit près à main à chaque passage (41 dépassements, vainqueur ≠ poleman 1, chocs 4, herbe 2450, 0 coupe).

Ordre 1 — les pneus chez les IA :
- `gestionPneus` est un trait du caractère (IA_CARACTERE.gestionPneus [0 ; 1]), tiré avec sa propre graine (GRAINE_PNEUS 8000 : les tirages des styles, caractères et erreurs ne bougent pas d'un bit), décalé par le niveau (NIVEAUX : débutant −0,2, normal 0, expert +0,1, légende +0,2, borné à 0–1).
- creerCourseIA pose des pneus (creerPneus) à chaque IA si PNEUS_ACTIFS ; pasCourseIA use les pneus à chaque pas (pasPneus, avec la gestion du pilote) et pose v.adherence = facteurAdherence(usure) ; la physique la lit déjà (mu × v.adherence). Le joueur reste géré par principal.js.
- L'IA tient compte de son adhérence réelle dans ses lignes : noterLigne, mu × (v.adherence || 1) dans vitesseVirage, et la vitesse d'arrivée au bout de la ligne (la carte, calculée pneus neufs) × √adhérence. Sans pneus : × 1 et √1 = 1, le même nombre au bit près.
- Tests (moteur) : le trait (6 IA, graine 5 : 0,17 / 0,79 / 0,41 / 0,13 / 0,62 / 0,82 ; légende ≥ normal) ; IA seule, 12 tours sur le technique : usure par tour 0,07 → 0,83, adhérence finale × 0,9446, tours 2–4 61,00 s → 3 derniers 61,65 s, 0 barrière, 0 herbe ; 10 IA, 12 tours (graine 1) : toutes arrivent, usures finales 0,73–1,00, 0 choc avec comme sans pneus (herbe 156 contre 146).
- simulerCourse rend `usure` et `arrets` par voiture, et `caractere.gestionPneus`.

Ordre 2 — la voie des stands (circuits.js, calcul pur) :
- `circuit.stands` = { entree, sortie, cote, dMur, dExt, arret, longueur, traverse }, calculé depuis les morceaux (standsDepuisMorceaux) : parallèle à la ligne droite de départ, du côté du premier virage (la trajectoire est de l'autre côté) ; elle commence dans la dernière ligne droite (STAND_ENTREE_MAX 300 m avant la ligne au plus) ou, si cette droite est trop courte ou finit par un virage, STAND_APRES_LIGNE 20 m après la ligne ; elle rejoint la piste dans la première droite (STAND_SORTIE_MAX 250 m après la ligne au plus), à STAND_MARGE_DROITE 60 m de la fin de la droite ; sous STAND_LONGUEUR_MIN 150 m, pas de voie. Un circuit peut imposer `stands: { entree, sortie, cote }` (Montréol : 10 → 160 m, sa droite de départ fait 194 m). Entre le bord de la piste et la barrière (DISTANCE_BARRIERE 14 m) : le muret à STAND_MUR 1,5 m du bord, la voie sur STAND_LARGEUR 7 m derrière ; l'entrée et la sortie sont ouvertes sur STAND_RAMPE 60 m. La zone d'arrêt (± STAND_ARRET_DEMI 20 m) est à la ligne si la voie la traverse (test, Silverstoun, Spaa), sinon au milieu de la voie.
- `zoneStands(circuit, s, d)` → { rampe, voie, dansVoie, arret, cote, dMur, dExt } ; `positionSurPiste(...).stands` dit si une voiture est sur la voie.
- Physique (derrière PNEUS_ACTIFS) : hors des rampes, le muret retient une voiture de chaque côté (contacts comptés à part dans v.contactsMurStands, pas dans contactsBarriere) ; sur la voie, pas d'herbe, et la limite STAND_VITESSE_MAX (80 km/h) : la physique y ramène la voiture et compte STAND_PENALITE_VITESSE (5 s) une fois par passage (v.penalitesStands), que course.js (majCourse, deux lignes) ajoute aux pénalités de la course. La ligne d'arrivée se passe aussi par la voie : le tour compte (positionSurPiste projette sur la piste).
- 3D (scene3d.js, un bloc) : la bande de la voie et le muret hors rampes (COULEUR_STANDS, COULEUR_MUR_STANDS, HAUTEUR_MUR_STANDS 0,8 m) ; dessinés toujours (c'est le décor), la physique seulement avec PNEUS_ACTIFS. `mur(c, d, hauteur, garder)` a gagné un filtre.
- Tests (moteur) : test → voie de s = 2884 à 250 (550 m, côté −1, arrêt à la ligne) ; technique → 20 à 250 (230 m, côté +1, arrêt à 135) ; aucun virage sur la longueur ; zoneStands au milieu / dans la rampe / sur la piste / après la sortie ; positionSurPiste.stands ; une voiture qui entre à 108 km/h est ramenée à 80,0 km/h avec 5 s de pénalité une fois, 24,6 s dans la voie, tour compté en passant la ligne par la voie, sortie à s = 250, 0 muret, 0 barrière, revenue sur la piste ; le muret est étanche dans les deux sens (depuis la voie : au plus près à 9,00 m = muret 8 + demi-voiture ; depuis la piste : au plus loin à 7,00 m) ; sans PNEUS_ACTIFS, au même endroit la voiture roule dans l'herbe (11,30 m, 373 pas), sans limite ni pénalité.
- Annexes : circuits-a 56/56 et circuits-b 51/51 : chaque tracé officiel a sa voie (Monoco 20 → 250, Silverstoun 5494 → 250 traverse la ligne, Monzo 20 → 250, Spaa 6789 → 190, Suzuko 20 → 250, Interlagas 20 → 250 côté −1, Montréol 10 → 160 à la main, et les 5 de B), droite sur toute sa longueur, zone d'arrêt dedans.
- ecrans.py : capture `stands.png` (index.html?camera=dessus&circuit=test, 1280×720).

Ordre 3 — l'arrêt au stand : rien de fait (ce qui existe : pneus.js a déjà arretAuStand, dureeArret, penaliteSansArret, arretObligatoire, testés dans tests/pneus.html ; la zone d'arrêt est dans circuit.stands.arret et zoneStands(...).arret). Ce qu'il reste pour demain : la voiture immobile dans la zone reçoit des pneus neufs après dureeArret(niveau des changeurs du garage) ; la pénalité sans arrêt dans classementFinal (course moyenne et longue) ; la stratégie des IA (tour d'arrêt par usure prévue × gestion + hasard, jamais au dernier tour, pas deux de la même écurie au même tour) et leur conduite vers la voie (une ligne « stands » dans deciderLigne, la vitesse vers 80 km/h avant l'entrée, l'arrêt dans la zone, la sortie) ; le message au joueur (textes.js), « STAND » dans la tour et le tour d'arrêt dans les résultats (interface.js, Codeur 2) ; le robot qui entre aux stands pour la capture stand.png ; la mesure « l'arrêt change le classement » sur 30 courses de 12 tours.

Sortie des tests : Mac (sous le verrou, jamais la suite complète, 0 Chrome après chaque passage) : moteur ×5 (208/208 puis 211/211), courses ×2 (38/38, inchangées), annexes ×3 (dernier : 19, 28, 28, 56, 51, 346, tout vert). GitHub : pneus 08c8a3a TOUT PASSE (40053343302) ; pneus 0b77e2f : passage GitHub lancé (push à 22h39), résultat pas lu avant minuit : à lire par le Chef (branche pneus, commit 0b77e2f).

Pour CLAUDE.md (par le Chef) : circuits.js : `circuit.stands`, `standsDepuisMorceaux`, `zoneStands`, `positionSurPiste(...).stands` ; physique.js : le muret, la limite de vitesse et sa pénalité (v.penalitesStands → course.penalites), derrière PNEUS_ACTIFS ; ia.js / simulation.js : gestionPneus dans le caractère (GRAINE_PNEUS), l'usure des IA dans pasCourseIA, l'adhérence réelle dans noterLigne ; réglages STAND_* ; tests/circuits-a/b : la voie de chaque tracé ; capture stands.png.

Ce que je n'ai pas pu vérifier : ecrans.py sur le Mac (GitHub seulement) ; la voie en 3D à l'œil (capture stands.png sur GitHub) ; la sensation des pneus chez les IA en jouant (?pneus=1&ia=9&joueur=1 : à essayer par le propriétaire).

Réévalue.

---

TOUR 26 (suite, 2026-10-24) — compte rendu du Codeur 1 (sous-agent de session-5b)

Commit : pneus 08295f0 (911c004 + 30ea8d0 + 08295f0, avec origin/main fbb8efa) — GitHub 40134629502 : TOUT PASSE. Avant : la voie des stands a126135, GitHub 40119895463 vert, fusionnée par le Chef.
Ordres : 1 (finir la voie des stands) fait / 2 (l'arrêt au stand) fait / 3 (l'effet de la rivalité) fait.

Tout est derrière PNEUS_ACTIFS (faux par défaut, ?pneus=1) pour l'arrêt ; la rivalité ne joue que si un pilote a `rivalite` ET que la voiture visée est celle du joueur. Sans ?pneus : courses.html identique au bit près (41 dépassements, vainqueur ≠ poleman 1, chocs 4, herbe 2450).

Ordre 1 — la voie des stands : rien à refaire (Montréol réglé à la main par mon prédécesseur, 10 → 160 m) ; passage GitHub de 22637b4 et de a126135 verts. Trouvé ensuite : sur un circuit dont la voie est à gauche (test), la bande n'était pas dessinée (triangles tournés vers le bas) ; corrigé dans scene3d.js (capture stand.png).

Ordre 2 — l'arrêt au stand :
- course.js (mon bloc) : `pasArretStand` : dans la zone d'arrêt, sous STAND_VITESSE_ARRET (3 m/s), la voiture est tenue sur place pendant dureeArret(v.changeurs) (4 s ; 3 s avec les changeurs au niveau 5), le chrono tourne, puis pneus neufs (arretAuStand) ; un arrêt par passage ; `c.arrets` [{tour, duree}], `c.arretEnCours`, `c.arretConseille` (STAND_TOUR_CONSEILLE). `penaliserSansArret` : PENALITE_SANS_ARRET (30 s) à l'arrivée en 12 et 18 tours, rien en 5. Le même code pour le joueur et les IA. garage.js : `v.changeurs` = niveau « roues » du garage (une ligne).
- simulation.js : `strategieStands` (GRAINE_STANDS 9000 : les autres tirages ne bougent pas) : tour = round(nbTours × (0,5 + 0,2 × (gestionPneus − 0,5) + 0,15 × hasard)), entre 2 et nbTours − 2, deux équipiers à deux tours d'écart au moins (à la ligne, l'arrêt peut tomber au tour suivant : 4 doublons vus sur GitHub avec un seul tour d'écart) ; `majStandsIA` (mode stands à 350 m de l'entrée, à son tour, jamais au dernier ; réessaie au tour suivant si la zone est manquée) ; `voituresVues` : on ne voit pas une voiture de l'autre côté du muret ; `classementCourse(...).stand`, `classementFinal(...).arrets` ; simulerCourse rend toursArrets, standTour, final, etc.
- ia.js : la ligne « stands » (`cibleStands`) : se ranger côté voie (160 → 40 m avant), freiner à 76 km/h (STAND_DECEL), passer au milieu de la voie dans la rampe, ralentir au pas jusqu'à la place d'arrêt, ressortir au bord puis rejoindre sa ligne ; ni attaque ni erreur en route ; `cederSortieStands` : à la sortie, elle reste dans la voie tant qu'une voiture plus rapide arrive du côté voie (vu sur la graine 2 du test : un choc à 15 m/s à la sortie avant ça) ; une voiture qui entre ou sort est contournée tout de suite (estLente : `manoeuvreStands`, `rampeStands`).
- physique.js : les rampes sont goudronnées du bord de la piste au bord de la voie (avant : 300 pas d'herbe par course à l'entrée et à la sortie) ; `campStands`, `rampeStands`.
- robot.js : `v.versStands` (tests) : le robot entre, s'arrête, ressort.
- interface.js / textes.js (en + fr) / index.html / style.css : #hudStand (« Arrêt au stand obligatoire : tour 6 conseillé (+30 s sans arrêt) » au départ et à partir du tour d'avant ; « Arrêt au stand… 2,7 s » ; « Pneus neufs ! Arrêt 4,0 s ») ; « STAND » dans la tour (principal.js : `stand: x.stand`) ; le tour d'arrêt aux résultats (« stand T6 », principal.js : `arrets: x.arrets`).

Ordre 3 — l'effet de la rivalité (CLAUDE.md « Les rivaux se souviennent ») :
- `poserRivalites(e, rivalites)` (simulation.js), appelé par principal.js avec `ch.pilotes[k].rivalite` (une ligne) ; la voiture du joueur a `v.joueur`.
- ia.js : `agressivite(pilote, contre)` : + decalageRivalite() (INTERVIEW_RIVALITE_DECALAGE 0,3, plafond INTERVIEW_RIVALITE_PLAFOND 0,3) seulement contre la voiture du joueur (attente avant l'attaque, droite exigée, retenue) ; `defendreContreJoueur` : le joueur dans ses rétroviseurs (≤ 8 m derrière ou à côté, IA_VISION_COTE : il ne voit rien de plus) avant un freinage → sa ligne rapide couvre l'intérieur du virage (5 m × 0,3 = 1,5 m) ; à côté du joueur, il laisse IA_ESPACE_LAISSE × 0,7. Même physique, mêmes informations.

Sortie des tests :
- GitHub 40134629502 (08295f0) : TOUT PASSE — test.html 253/253, courses.html 43/43, stands.html 9/9, ecrans.py 637/637, sdk 19, pneus 28, enregistreur 28, circuits-a 56, circuits-b 51, textes 532.
- Mac (sous le verrou, jamais la suite complète) : moteur ×3, stands.html à 1 puis 4 graines, courses.html à 1 graine, ecrans.py sur la seule page test=stand (10/10), pages de diagnostic (dans le scratchpad, pas commitées). « championnat : 3 GP… < 20 s » rouge sur le Mac chargé (31 s) mais vert sur GitHub (3,9 s) : la charge, pas le code.

Mesures :
- tests/stands.html, 30 courses de 12 tours (10 IA, test + technique) : chaque IA s'arrête une fois, à son tour prévu ou au suivant, jamais au dernier ; ordre d'arrivée ≠ même course sans pneus dans 30/30 (seuil STAND_COURSES_DIFFERENTES 20) ; chocs > 5 m/s 10 (16 sans pneus) ; herbe 6795 (6320 sans ; garde-fou × 12/5 : 9600) ; barrières + coupes 1 ; muret 0 ; pénalité de vitesse 0 ; sans arrêt 0 ; équipiers au même tour 0. Calcul 137 s sur GitHub.
- IA seule, technique, 12 tours : arrêt au tour 8 (prévu 8), tour d'arrêt 78,0 s contre ~61 s : perte ≈ 16,9 s ; usure 0,49 → 0 ; 0 muret, 0 barrière, 0 herbe.
- Joueur (robot) : arrêt au tour 3, 4 s, pneus neufs, « STAND » dans la tour, jamais vu par les IA derrière le muret.
- Rivalité (courses.html, 8 courses de 5 tours sur le technique, l'IA « joueur » 5e ou 6e sur la grille) : rival derrière : il attaque le joueur 81 fois contre 76 sans rivalité ; rival devant : 6 défenses (0 sans), le joueur le passe 0 fois (0 sans : les attaques réussissent rarement, voir le duel) ; chocs 4 contre 4 ; sans voiture du joueur, course identique au bit près ; décalage demandé 5 → même course qu'au plafond.

Pour CLAUDE.md (par le Chef) : course.js : pasArretStand, penaliserSansArret ; simulation.js : strategieStands, majStandsIA, poserRivalites, voituresVues et le muret ; ia.js : cibleStands, cederSortieStands, agressivite(pilote, contre), defendreContreJoueur ; physique.js : rampes goudronnées ; robot.js : v.versStands ; réglages STAND_* (arrêt, stratégie, sortie) et INTERVIEW_RIVALITE_DECALAGE/PLAFOND/DEFENSE/DISTANCE/RAMPE ; la durée de l'arrêt et la pénalité restent dans REGLAGES_PNEUS (pneus-donnees.js : ARRET_DUREE_BASE, CHANGEURS_GAIN_*, PENALITE_SANS_ARRET) parce que tests/pneus.html ne charge pas donnees.js ; tests/stands.html (partie « courses » de lancer.py, délai 1200 s) ; ecrans.py : stand.png ; l'étape 7 : « interview.js : l'effet de la rivalité sur le pilotage reste à faire » n'est plus vrai.

Ce que je n'ai pas pu vérifier : la sensation (durée de l'arrêt, la voie à 80 km/h, le message) en jouant : à essayer par le propriétaire (`index.html?course=12&ia=9&joueur=1&pneus=1&circuit=technique`) ; les 12 tracés officiels avec l'arrêt (pas encore branchés) ; la rivalité en vrai championnat (?championnat=1 après une réponse provocante) : seulement en simulation ; la défense reste rare (6 sur 8 courses) parce que le joueur n'est dans les rétroviseurs (8 m) qu'un instant avant les freinages.

Réévalue.

---

APRÈS LE TOUR 26 (2026-10-24, 18h05 → 19h20) — Codeur 1 : la fusion avec le tournoi, puis l'aileron chez les IA

- Fusion de main (le tournoi du Codeur 2) dans pneus : e301277, GitHub 40137000389 TOUT PASSE (conflit d'ecrans.py : tournoi() et stand_ecran() gardés) ; fusionné par le Chef.
- Branche **ailerons-ia** (pneus + origin/codeur3 b52b9b0 + main), commit **d1e32f4**, GitHub **40140821956 : TOUT PASSE** (260/260, 43/43, ailerons 38/38, stands 9/9, ecrans 685/685).
  - Cause des chocs avec ?ailerons=1 (diagnostic sur 6 courses) : au freinage, une IA collée à une voiture qui n'a pas le même aileron (elle freine plus tôt ou plus fort) suivait sa vitesse du moment et freinait trop tard (choc à 4 m, 33 contre 20 m/s).
  - Remède (ia.js, `freinsVus`, `autreAileron`, `IA_FREIN_PREVU` 0,6 s) : derrière une voiture qui n'a pas le même aileron, quand elle ralentit, l'IA vise la vitesse qu'elle aura dans 0,6 s. Même aileron ou sans aileron : rien ne change, au bit près. (Une version pour toutes les voitures cassait courses.html : 31 dépassements, 1 coupe.)
  - courses.html : 41 / 4 / 2450 inchangé ; courses.html?ailerons=1 : 38 dépassements, 5 chocs, herbe 2876, 0 coupe, 20 voitures 0 choc (avant : 49 / 12 / 4059 / 2 coupes ; avec 0,3 s : 8 chocs).
  - AILERON_IA_ACTIF = true ; courses.html?ailerons=1 dans la partie « courses » de lancer.py (sans la rivalité, mesurée dans la page normale).
- Pas vérifié : la sensation contre des IA aux ailerons différents (à essayer par le propriétaire) ; origin/codeur3 a avancé depuis b52b9b0 (5aac920) : la fusion des deux branches est à faire par le Chef.

---

REPRISE (2026-10-24, 20h28 → 21h10) — Codeur 1 : les consignes d'équipe

Commit : pneus **7a9e117** (bc74a4d + origin/main), GitHub **40148576912 : TOUT PASSE** (265/265, 43/43, ailerons 38/38, stands 9/9, ecrans 708/708, textes 578).
- simulation.js : `majConsignes` (toutes les 0,5 s, au plus une par course) : deux pilotes d'une écurie (`e.ecuries`, posé par principal.js depuis le championnat ; sinon 2 par écurie dans l'ordre) à moins de CONSIGNE_DISTANCE (40 m), celui de derrière plus rapide d'au moins CONSIGNE_RYTHME (0,4 s : son meilleur tour contre la moyenne des 2 derniers tours de l'autre, puisque bloqué derrière, ses derniers tours sont ceux de l'autre), personne entre eux ni à moins de 150 m derrière, pas au dernier tour, pas pendant un arrêt, une erreur ou une attaque. Entre deux IA : celle de devant laisse passer. Le coéquipier du joueur (le joueur derrière) obéit sauf si son trait `consigneRefus` (IA_CARACTERE, tiré avec GRAINE_CONSIGNES) ≥ CONSIGNE_REFUS_SEUIL (0,8). Le joueur devant : sa course porte la consigne (le message). `suivreConsigne` : suivie (celui de derrière est passé), ignorée (CONSIGNE_DELAI 40 s) ou refusée. `appliquerConsigne(ch, consigne)` : ± CONSIGNE_CONFIANCE (5) sur ch.reputation.ecurie = ch.confiance, seulement si la consigne visait le joueur ; appelé par principal.js avant finirGrandPrix. Un point du duel n'est jamais rendu (le duel lit le classement final).
- ia.js : `pilote.laisser` : dans une droite, il roule CONSIGNE_RALENTI (10 m/s) sous l'autre (ou sous sa ligne s'il ne le voit pas encore) ; `pilote.passer` : il passe son coéquipier comme une voiture lente et n'attaque pas.
- interface.js / textes.js : « Consigne de l'écurie : laisse passer ton coéquipier n°7 (plus rapide). L'ignorer fait baisser la confiance de l'écurie. », puis « Merci ! La confiance… monte » ou « Consigne ignorée : … baisse » (3 s).
- Mesures : entre IA (le technique, celle de devant moteur × 0,85) : suivie en 33 s, une seule consigne ; coéquipier du joueur : refus 0 → il lève le pied, refus 1 → refusée ; courses.html inchangé (41 / 4 / 2450) ; stands.html (12 tours) : chocs 11 (16 sans pneus), herbe 6630.
- Pas vérifié : le joueur devant, dans la page (message, détection) ; la sensation (à essayer par le propriétaire, ?championnat=1) ; en 12 tours, combien de courses ont une consigne.
