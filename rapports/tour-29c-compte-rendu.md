# TOUR 29c — compte rendu du Codeur 3 (l'aileron, l'arbre de la dynastie, l'élision)

Commit : `b52b9b0` sur la branche `codeur3` (main fusionné). Passage GitHub 40135709826 : TOUT PASSE (moteur 255/255, courses 38/38, ecrans 636/636, sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 56/56 + 51/51, textes 541/541).

Ordres : 1 fait, sauf un point : l'effet sur les voitures des IA est coupé (`AILERON_IA_ACTIF = false`), voir plus bas / 2 fait.

## Ordre 1 — le réglage de l'aileron
- **`aileron.js`** (calcul pur) : `AILERON_CRANS` = 5. Les facteurs d'un cran valent `1 + (cran − milieu) × effet`, donc **exactement 1 au milieu**. Effets : adhérence +1,5 % par cran (`AILERON_ADHERENCE_PAR_CRAN`), traînée +4,5 % par cran (`AILERON_TRAINEE_PAR_CRAN`).
  - `appliquer(v, cran)` pose `v.aileronAdherence` et `v.aileronTrainee`.
  - Le cran du joueur est gardé par circuit dans `ch.ailerons` (sauvegarde unique). Une ancienne sauvegarde se charge au milieu.
  - `barres` (virages, vitesse) pour l'écran.
  - `profil(circuit)` : la part du **temps** d'un tour dans des virages lents et en lignes droites, chaque échantillon roulé à sa vitesse limite.
  - `choisirIA` : selon le profil (centré sur un circuit mixte, `AILERON_IA_REFERENCE`), la régularité (plus haut), l'agressivité (plus bas) et `hasard()`, à au plus `AILERON_IA_ECART` cran du milieu.
  - `cransIA(ch, circuit)` : avec la graine du championnat, la saison et le Grand Prix.
  - Ce n'est pas dans le plafond du garage.
- **Le bloc dans `physique.js`** (fichier du Codeur 1, marqué « aileron, Codeur 3 ») :
  - ligne du `mu` : `… * (v.aileronAdherence || 1) * …` ;
  - ligne de la résistance : `R.TRAINEE * (v.aileronTrainee || 1) * …` ;
  - la fonction `racineCubique(x)` : Newton, 8 tours, seulement des additions, multiplications et divisions ; `racineCubique(1) = 1` exactement.
- **Le bloc dans `ia.js`** (fichier du Codeur 1, marqué) :
  - (a) `noterLigne` : `mu × (v.aileronAdherence || 1)` ;
  - (b) la vitesse de fin de ligne : `× Math.sqrt(v.aileronAdherence || 1)` ;
  - (c) la pointe : `pilote.carte.pointe / racineCubique(v.aileronTrainee || 1)`, puisque la pointe varie comme traînée^(−1/3) quand la puissance l'emporte.
  - Au milieu, tout vaut × 1 ou ÷ 1 au bit près.
- **`robot.js`** : `vitesseVirage(…, ADHERENCE × aero × aileronAdherence)`.
- **L'écran**, depuis le garage (« 🪽 Aileron ») :
  - la carte de la prochaine course (`carte2d.js`, canvas 2D) : le tracé, la ligne de départ, une flèche pour le sens, le nom, la longueur ;
  - le curseur « Bas … Haut », « Cran n / 5 » ;
  - une petite voiture de profil, dont l'aileron arrière s'incline avec le cran ;
  - deux barres, « Virages » et « Vitesse » ;
  - aucun conseil.
  - Chaque changement est sauvegardé. Le cran s'applique aux qualifications et à la course (`lancerCourse`, `faireMonTour`).
- **Mesures** (GitHub) :
  - vitesse de pointe, du cran bas au cran haut : 337 → 321 km/h avec les effets d'avant (1,2 % / 3,6 %) ; avec 1,5 % / 4,5 % : 339 / 334 / 329 / 324 / 320 km/h, virage de 80 m : 147,7 / 149,2 / 150,6 / 152,1 / 153,6 km/h ;
  - tours moyens : test, robot 62,32 / 62,18 / 62,05 / 61,92 / 61,80 s (le cran haut gagne 0,4 %, sous la marge de 1 %) ; test, IA seule 55,01 / 55,00 / 54,98 / 54,90 / 54,97 ; technique, robot 64,51 → 64,64 (le bas gagne un peu) ; technique, IA 60,54 / 60,60 / 60,55 / 60,73 / 60,64 ; choix des IA : moyenne 1,0 sur l'ovale, 3,0 sur les virages lents ;
  - profils en part du temps : test lents 0,25 / droites 0,58 ; technique 0,30 / 0,70. **Le test passe un peu plus de temps dans des virages lents que le technique** : le choix des IA est donc testé sur deux circuits d'essai faits pour ça, un circuit de virages lents et un grand ovale.
- **Le point pas tenu : l'effet sur les IA est coupé.**
  - Avec des crans tirés, `tests/courses.html?ailerons=1` casse ses garde-fous, en 4 passages GitHub. La base fait 41 dépassements, 4 chocs > 5 m/s et 2450 pas d'herbe.
  - 2 % / 6 % : herbe 4508.
  - 1,2 % / 3,6 % : 9 chocs, herbe 4370.
  - Centré : 10 chocs, 2 coupes, herbe 4607.
  - 1 % / 3 % à un cran du milieu au plus : 7 chocs, et 2 chocs dans la course de 20 voitures.
  - Pourquoi : aujourd'hui toutes les IA ont la même vitesse de pointe (le rythme ne joue que dans les virages). Le moindre écart en ligne droite crée des rapprochements que `ia.js` ne gère pas encore aussi bien.
  - D'où `AILERON_IA_ACTIF = false` : les IA choisissent et gardent leur cran (`p.aileron`, testé et montré), et le code de la physique est le même pour tous.
  - `courses.html?ailerons=1` est prêt pour le Codeur 1. Il n'est pas dans `lancer.py` tant qu'il est rouge.
- **Tests moteur** :
  - le milieu au bit près (le robot sur 30 s et une course de 4 IA sur 20 s, pas à pas) ;
  - haut = plus d'adhérence et moins de pointe, bas l'inverse ;
  - aucun cran ne domine sur le test de plus de `AILERON_MARGE` (1 %), avec le robot **et** une IA seule ;
  - les IA plus haut sur les virages lents que sur les lignes droites (6 graines) ;
  - la sauvegarde par circuit, l'ancienne sauvegarde au milieu ;
  - la carte dessinée pour chaque circuit ;
  - les empreintes épinglées sont inchangées.
- **ecrans** : garage → aileron (la carte dessinée, le milieu, les barres, aucun conseil, tout dans l'écran), puis le cran 5 (1280) ou 1 (960), les barres, la sauvegarde, et le cran porté par la voiture du joueur au GP 2. Captures `aileron.png`, `aileron-960.png`.

## Ordre 2 — l'arbre de la dynastie, l'élision
- **« 🌳 Arbre de la dynastie »** au paddock et au bilan. Chaque génération y a son casque, son nom (« en piste » pour celle d'aujourd'hui), ses saisons, titres, victoires et podiums, et son meilleur résultat à domicile. Viennent ensuite les records de famille et les victoires de la famille par circuit. « Retour » ramène là d'où on vient.
  - ecrans : après la relève, au paddock, les deux générations ; capture `arbre.png`.
- **`elider(t)`** dans `textes.js` : « de Alex » → « d'Alex », « que Emma » → « qu'Emma », mais pas devant un h (« de Hugo ») ni en anglais.
  - Appliqué partout où l'on met un nom : `avec` (interface.js), `JOURNAL.remplir`, `INTERVIEW.phrase`.
  - Test : les cas, la une de la relève « La fille d'Alex Rossi », et aucun texte fixe français avec « de » devant une voyelle.

## Sortie des tests
- GitHub, le dernier commit : TOUT PASSE (moteur 255/255, courses 38/38, ecrans 636/636, sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 56/56 + 51/51, textes 541/541).
- Mac : rien de complet ; des pages de mesure dans `scratchpad/codeur3/`, sous le verrou, avec une limite de temps (`perl alarm`) et le verrou rendu par `trap`.
- Ma faute de 15h58 : un Chrome sans limite a gardé le verrou 28 minutes. Et mon `page.sh` avait écrasé celui du Codeur 1 dans le scratchpad partagé (le mien est maintenant dans `codeur3/`).

## Ce que je n'ai pas pu vérifier
- La sensation de l'aileron (pour le propriétaire) et la vraie différence sur les 12 circuits (pas encore branchés).
- L'effet sur les IA, coupé (voir plus haut).

Réévalue.
