TOUR 9 — compte rendu du Codeur (session-dd)
Commits : 37196cd (ordres 1 à 4), bc85623 (ordre 5, ?ia=N)

Ordres : 1 fait / 2 fait / 3 fait / 4 fait / 5 fait

1. Contacts entre voitures — fait. `contactsVoitures(voitures, circuit)` (physique.js), après le pas de chaque voiture.
   - Chaque voiture est un rectangle de 5,5 × 2 m (LONGUEUR_VOITURE, LARGEUR_VOITURE).
   - Deux rectangles qui se chevauchent sont écartés de moitié chacun, le long de l'axe où ils se chevauchent le moins.
   - S'ils se rapprochaient, il y a un choc mou (REBOND_VOITURE 0,2). Masses égales : la quantité de mouvement est conservée.
   - Les voitures poussées repassent par contactPiste (herbe, barrières).
   - Un contact est compté par rencontre : un frottement qui dure compte pour un. Pour chacun, la vitesse de choc la plus forte est gardée (v.chocs, v.chocMax).
   Tests :
   - choc par l'arrière à 30 et 90 m/s : jamais traversé, la lente repart à 17,5 et 50,7 m/s ;
   - quantité de mouvement conservée à 1e-9 près ;
   - choc latéral : la voiture touchée est poussée de côté, sans chevauchement ; après le choc de 2,2 m/s, seulement des frôlements à 0,14 et 0,02 m/s ;
   - deux voitures posées l'une dans l'autre sont séparées dès le premier pas.
   Coût : contacts de 20 voitures × 120 pas, meilleur 0,2 à 0,3 ms.

2. simulation.js — fait.
   - `placesGrille` : deux files à ±3 m, une place tous les 8 m.
   - `voitureDevant` : la plus proche devant, dans le cône (±0,6 rad, 120 m) ou dans le couloir (moins de 4,5 m de son axe). Rend la distance de centre à centre et sa vitesse dans le sens de la voiture.
   - `creerCourseIA`, `pasCourseIA` : ce que chaque IA voit est pris avant que quiconque bouge.
   - `simulerCourse(circuit, nb, nbTours, graine)`.
   - Une voiture arrivée quitte la piste.
   Le couloir a été ajouté parce qu'au départ, quand les deux files se rabattent, une voiture presque à côté n'était pas dans le cône. Résultat : des frottements de plus de 100 pas (à moins de 3 m/s). Avec le couloir, plus aucun contact sur les 10 courses.
   Tests : même graine = résultats identiques (JSON) ; une autre graine donne d'autres rythmes.

3. Rythmes — fait. IA_RYTHME entre 0,94 et 1,00, tiré avec la graine, multiplie la vitesse conseillée (dernier argument de piloteIA). Il est affiché dans chaque tableau.
   Test : un rapide (1,00) part 60 m derrière un lent (0,94) sur le technique. Il revient à 10,9 m le long de la piste (13,2 m de centre à centre), puis reste derrière : 0 contact, il arrive 2e.

4. Critère 4b — fait. test.html affiche un tableau par course (place, n°, rythme, temps, meilleur tour, contacts, barrière, herbe, coupes).
   - 10 voitures, 5 tours, graines 1 à 5, sur les deux circuits : 10/10 arrivées à chaque course, 0 contact, 0 barrière, 0 coupe, 0 herbe. Environ 0,6 s de calcul par course.
   - 20 voitures, graine 1 : 20/20 arrivées. Test : 0 contact, 1,3 s. Technique : 1 contact, une touchette à 3,0 m/s au départ entre les n° 10 et 11, 1,5 s. 0 barrière, 0 coupe.
   - Les meilleurs tours se resserrent derrière les lents (pas de dépassement voulu) : sur le test, graine 1, presque toute la file tourne en 50,5–50,7 s.
   - Remarque : au départ, la voiture de la 2e file passe parfois devant celle de la 1re (n° 2 devant n° 1 au test). Ce n'est pas voulu : c'est le rabattement des deux files.

5. ?ia=N — fait.
   - De 2 à 20 IA (IA_PAGE_MAX) dans la page, chacune de sa couleur (COULEURS_IA), avec le même modèle.
   - La caméra, le tableau et le bandeau de course suivent une voiture ; Tab passe à la suivante encore en course.
   - Une IA arrivée n'est plus dessinée. Une course entre IA ne touche pas aux records.
   - La trajectoire se calcule en fond comme avant ; les IA attendent sur la grille tant qu'elle n'est pas prête.
   ecrans.py lance index.html?course=5&ia=10&circuit=technique&debug=1 :
   - console vide ;
   - 10 modèles de 10 couleurs ;
   - en 30 s, les 10 avancent de 1650 à 1872 m, 0 contact, 0 barrière ;
   - Tab change bien de voiture ;
   - capture tests/captures/ia10.png ;
   - 5 à 6 i/s sous swiftshader : sans valeur, il faut une mesure par le propriétaire sur son Mac.
   ?ia=1 garde son ancien comportement (l'IA conduit la voiture du joueur).

Sortie des tests (python3 tests/lancer.py) : TOUT PASSE
- tests/test.html : RESULTAT 124/124
- tests/ecrans.py : RESULTAT 147/147 (93 s)

À noter :
- Le commit bc85623 n'a pas pu se faire normalement : git n'a aucune identité configurée et la devinait jusqu'ici à partir du nom réseau du Mac, qui a changé. Je l'ai faite avec la même identité que les commits précédents (le propriétaire <266356357+cotangeante-pi@users.noreply.github.com>), par variables d'environnement. Je n'ai rien changé à la configuration git. Il faudra peut-être le dire au propriétaire (`git config user.name` / `user.email`).
- CLAUDE.md : je n'y ai pas touché. Texte à ajouter dans la liste des fichiers :
  - `simulation.js` : une course entre IA en calcul pur : la grille (deux files), ce que chaque IA voit devant elle (`voitureDevant`, cône + couloir), `creerCourseIA` / `pasCourseIA` (aussi utilisés par la page) et `simulerCourse(circuit, nbVoitures, nbTours, graine)` pour les tests ;
  - dans `physique.js` : `contactsVoitures`, les contacts entre voitures (rectangles, choc mou), le même pour tous ;
  - dans `principal.js` : `?ia=N` (2 à 20) montre une course de N IA ; Tab change la voiture suivie.

Ce que je n'ai pas pu vérifier :
- Les images par seconde avec 10 ou 20 voitures sur un vrai Mac.
- Le calcul de la trajectoire reste à 2 s en fond (plus longue tranche 69 à 101 ms).

Pour le tour 10 (un pilote qui choisit sa ligne en roulant), ce que je ferais avec le code actuel :
- On garde : la physique et les contacts, simulation.js (grille, vision, boucle), les fonctions de vitesse de ia.js (vitesseVirage, freinagePossible, accelerationPossible, vitesseBraquage, les passes avant/arrière), la poursuite et le réglage gaz/frein de piloteIA, et le rattrapage.
- On jette : l'écart latéral unique par circuit comme ligne à suivre. Le lissage et l'aplatissement deviennent au plus une carte de ce que le circuit permet (virages, côtés, vitesse max du milieu), pas une ligne.
- Le pilote, toutes les 0,1 à 0,2 s, choisit sa ligne sur les 150 à 250 m devant lui : quelques lignes possibles, par exemple la sienne, plus à l'intérieur, plus à l'extérieur, ou à côté de la voiture de devant. Ce sont des écarts latéraux lissés qui partent de sa position et de son cap actuels.
- Chaque ligne a une note : le temps qu'elle donne (courbure → vitesse → passes avant/arrière sur ce petit bout), moins des pénalités (bords, voitures autour, contact). Le pilote garde la meilleure, puis la suit avec la poursuite actuelle.
- Le caractère et le hasard (graine) jouent sur la façon de noter et de prendre une ligne : point de corde, marge de freinage, goût du risque, petites erreurs. Deux IA ne passent alors jamais au même endroit. Coût estimé : 20 voitures × 5 lignes × 100 points toutes les 0,15 s, faisable.

Réévalue.
