# TOUR 31 — compte rendu du Codeur 3 (la photo de la une, l'éditeur de l'héritier, les casques)

Commit : `841289c` sur `codeur3` (main fusionné). Passage GitHub 40404214792 : les 9 travaux sont verts.

Ordres : 1 fait / 2 fait / 3 fait.

## 1. La photo de la une (`photo.js`, `journal.js` : `photo`)
- Elle est dessinée par le code en canvas 2D, sans aucun hasard :
  - le podium du Grand Prix : les trois voitures aux couleurs de leur écurie de ce jour-là, sur les marches 2, 1, 3, avec les casques de leurs pilotes pour cette saison ;
  - ou la voiture du joueur seule, pour un fait qui le concerne (record, duel, interview, pénalité, série, relève).
- La silhouette, refaite après la remarque du Chef : une F1 de profil, avec le nez long et bas, l'aileron avant, le cockpit bas d'où le casque dépasse à peine, la prise d'air, l'aileron arrière haut et deux roues à l'échelle.
- La une compacte ne garde que des indices : `ph` (les trois premiers), `pe` (leurs écuries) et `je` (l'écurie du joueur), soit 368 octets par une avec le reste.
  - Les casques sont retrouvés par saison : un retraité garde maintenant son casque dans son résumé, et une génération d'avant le sien.
  - L'album redessine donc la même image.
  - Une une d'avant ce tour (sans ces indices) montre la voiture du joueur.
- Le canvas est dessiné par le processeur (`willReadFrequently`). Un canvas affiché à l'écran était sinon dessiné par le GPU, avec des dégradés un peu différents de ceux d'un canvas neuf. C'est vu en test, et réglé.
- **Tests moteur** :
  - la photo se dessine, avec des pixels de plus de 8 couleurs (214 relevées) ;
  - deux dessins de la même une donnent la même image au pixel près ;
  - podium pour une victoire, voiture du joueur pour un record ;
  - une ancienne une montre la voiture du joueur ;
  - aucune image dans la sauvegarde.
- **ecrans** : la photo de chaque une est celle de la une compacte (au pixel près), et elle est redessinée à l'identique dans l'album. Captures `une-photo.png`, `album-photo.png`.

## 2. L'éditeur de l'héritier et les motifs débloqués
- Il propose tous les motifs (`optionsMotifs`, `SAUVEGARDE.motifs()` en lecture) : ceux de départ et ceux débloqués sont permis, les autres sont grisés avec leur condition.
- `CARRIERE.validerHeritier` refuse un motif encore bloqué : le casque du parent reste.
- Tests : moteur (bloqué, débloqué, de départ) et ecrans (les options et leurs états).

## 3. Les casques dans l'arbre et le bilan
- L'arbre montre déjà le casque de chaque génération, avec son motif, et ecrans le vérifie (2 casques).
- Le bilan montre maintenant le casque du pilote qui s'arrête devant son titre (ecrans le vérifie).

## Ce que je n'ai pas pu vérifier
- La beauté de la photo, à juger par le propriétaire (captures `une-photo.png` et `album-photo.png`).

Réévalue.

## Dernier ordre du tour 31 (le calendrier, le Grand Prix à domicile, la photo du rival) — commit `422a7c3`, passage 40407159271 : les 9 travaux sont verts
1. **« 📅 Calendrier » au paddock** (`CHAMPIONNAT.calendrierSaison`) :
   - les 12 Grands Prix, avec leur numéro et leur circuit ;
   - ceux qui sont faits : « vainqueur X · toi PN », ou « ta victoire ! » quand le joueur a gagné (jamais son nom comme vainqueur, testé) ;
   - le prochain mis en valeur ;
   - le Grand Prix à domicile marqué d'une petite maison dessinée en CSS.
   - Les tests utilisent un calendrier fabriqué (moteur) et une course de cœur passée en mémoire sur un circuit du calendrier (ecrans). Captures `calendrier.png` et `calendrier-960.png`.
2. **Le Grand Prix à domicile dans l'interview et la une** :
   - deux faits, `domicileFete` (jusqu'à `DOMICILE_FETE_PLACE` = 3) et `domicileDecu`, en tête de `INTERVIEW_PRIORITES`, et juste après le titre de champion et la relève dans `JOURNAL_PRIORITES` ;
   - leurs titres, textes, questions et réponses, en + fr, sans genre sur le pilote ;
   - la photo : le podium pour la fête, la voiture du joueur pour la déception.
   - Tests moteur : une victoire à domicile donne la fête, une P12 la déception, ailleurs la victoire ordinaire revient ; le titre de champion passe devant ; aucun mot genré.
3. **La photo stylisée de la fiche du rival** (`PHOTO.portrait`) : son casque en grand sur un fond à la couleur de son écurie, et sa voiture dessous. Tests moteur (deux dessins identiques, plusieurs couleurs) et ecrans.
- Fusion de main (la grille vue d'en haut et le résumé du Codeur 2) : un conflit dans la liste des écrans d'`interface.js`, réglé en gardant les deux côtés.

## Suite du tour 31 (les textes) — commit `3ac4bf9`, passage 40410013834 : les 10 travaux sont verts
1. **Le singulier devant 0 et 1** : `accorder(t)` dans `textes.js`, appliqué avec `elider()`, donc partout où l'on remplit une phrase (`avec`, `JOURNAL.remplir`, `INTERVIEW.phrase`, « Tu marques n points »).
   - En français, le singulier est à 0 et à 1 : « 0 victoire », « 1 point », « 1 place gagnée ». En anglais, seulement à 1 : « 1 win », « 0 wins ».
   - Une liste de mots par langue : victoires, podiums, points, titres, saisons, courses, poles, générations, secondes, tours, Grands Prix, places (gagnées), ans.
   - Jamais 10, 21 ni 1,5.
   - Test moteur dans les deux langues. Les tests « Tu marques / You scored n points? » acceptent le singulier.
2. **Pas de place avant la première course** :
   - la fiche du rival dit « Cette saison : pas encore de course, pas encore de classement » ;
   - au classement du paddock, chaque place affiche « – » tant qu'aucune course n'est courue.
   - Tests ecrans mis à jour.
3. **L'audit anglais** : une page `?championnat=1&gp=12&lang=en` en 960×600 ouvre 19 écrans.
   - Les écrans : paddock, Entre amis, garage, aileron, sponsors, fiche, album, calendrier, arbre, interview, une, cérémonie, fin de saison, duel de la saison, contrats, bilan, temple, arbre au bilan, relève.
   - Pour chacun, le test vérifie : aucun mot français témoin (une liste de mots, et les accents ; les noms propres inventés des circuits et des sponsors sont écartés), aucun texte hors de l'écran, pas de défilement. Une capture `<écran>-en.png` par écran.
   - **Résultat : aucun texte français oublié.** Les deux seules alertes venaient de noms propres inventés (« Brio Café », « Montréol »).
   - Aucun texte en dur trouvé hors de `textes.js` dans mes fichiers (recherche des `textContent`, `title` et `placeholder` écrits en dur).
   - Pas audités ici : le tournoi, le résumé et les consignes. Ce ne sont pas des écrans du championnat, et ils ont leurs propres pages et tests chez les Codeurs 1 et 2.

## L'audit anglais, suite (le dernier ordre) — commit `d5357cd`, passage 40411945744 : les 10 travaux sont verts
- **Sept pages de test en anglais, en 960×600** (`test=audit-…` dans `tests/ecrans.py`). Pour chaque page, le texte VISIBLE (`body.innerText`) est vérifié : aucun mot français témoin, rien hors de l'écran, pas de défilement. Une capture `<nom>-en.png` par écran.
  - **Découverte** : l'écran titre, Entre amis, les réglages de l'écran partagé, la course de découverte avec ses aides, le podium, Bravo, la création du pilote.
  - **Tournoi** : l'inscription, « Your turn », le tour, la pause, le classement de la manche, puis le podium et le classement final (les autres passages joués d'avance avec des temps fabriqués).
  - **Écran partagé** : la course à deux.
  - **Résumé vidéo** : les résultats de qualification, la course, les résultats, le résumé.
  - **Stands** (`?pneus=1`) : la course, puis l'arrêt.
  - **Consigne d'équipe** : la qualification, et le message de la consigne en course.
  - **Volant** : la vue cockpit.
- **Résultat : aucun texte français trouvé dans ces écrans.** Aucun texte n'a eu besoin d'aller dans `textes.js`.
- **Textes en dur hors de `textes.js`**, dans les fichiers des Codeurs 1 et 2 (pas corrigés, comme demandé) : `principal.js:1505`, la ligne du compteur `?debug=1` (« i/s · triangles · appels », puis `mesuresConduite()` avec « dérive », « voiture … appels »). C'est un affichage de mise au point, hors du jeu. Rien d'autre trouvé (recherche des `textContent`, `title`, `placeholder`, `fillText` écrits en dur).
- Ce que je n'ai pas audité : la vue « télé » et le menu pause d'une course ordinaire. Ils utilisent les mêmes textes que les écrans vérifiés.

## Fin du tour 31 : le public à domicile et les décors des 12 tracés (calcul pur, rien de 3D) — commit `COMMIT`, passage PASSAGE
1. **Le public à domicile** (`decor-public.js`, `DECOR_PUBLIC`) :
   - `DECOR_PUBLIC.tirer({ graine, circuit, joueur }, nombre)` donne une couleur par spectateur (`couleurs`, à lire par instance), et `supporters` (true = aux couleurs du joueur) ;
   - à son Grand Prix à domicile (sa course de cœur), exactement `PUBLIC_DOMICILE_PART` (0,4) des spectateurs portent les couleurs de son pays, mélangés dans le public ; les autres, et tout le public ailleurs, portent les couleurs des 10 écuries ;
   - `PUBLIC_BANDEROLES` (6) banderoles à domicile, une sur deux « ALLEZ 27 ! » / « GO 27! », l'autre « ALLEZ ALEX ! » / « GO ALEX! », aux couleurs du pays (textes `banderoleNumero` et `banderoleNom` dans `textes.js`) ; aucune ailleurs ;
   - `DECOR_PUBLIC.pourGrandPrix(ch, circuit, nombre)` fait la même chose pour un championnat (le joueur est le pilote humain) ;
   - dans `donnees.js`, à côté de `PAYS` : `PAYS_COULEURS` (les couleurs du drapeau des 31 pays), `PUBLIC_DOMICILE_PART`, `PUBLIC_BANDEROLES`, `GRAINE_PUBLIC` ;
   - la même graine donne le même public. Le tirage a sa propre suite (`ALEATOIRE.suite(graine)`, ajoutée à `aleatoire.js`) : construire le public pendant une course semée ne change pas son hasard (testé).
   - 6 tests moteur.
2. **Les décors des 12 tracés** (`decors-officiels.js`, `DECORS_OFFICIELS`, des données seulement, rien de branché) :
   - pour chaque tracé : le lieu en une phrase, l'horizon, le ciel (heure, couleurs, nuages), la lumière (soleil, hauteur, ambiance, projecteurs), le brouillard, le sol ;
   - la tribune principale face aux stands, sur la ligne ; le bâtiment des stands derrière la voie des stands ;
   - une tribune à chaque virage célèbre des `reperes` (côté extérieur du virage quand c'est possible) ; sauf le tunnel de Monoco ;
   - du public debout en face ; les zones de paysage : immeubles, arbres, sapins, champs, collines, dunes, port, lac, eau, grande roue, hôtel ;
   - Singapura de nuit sous les projecteurs, Monoco avec son port, Spaa dans les sapins et la brume, Monzo dans le parc, Bahrayn au crépuscule dans le désert, Yas Marino au couchant avec la marina et l'hôtel, Melbourn Park autour de son lac, Montréol avec le bassin, Suzuko avec la grande roue ;
   - `DECOR_PUBLIC.placer(circuit, decor)` donne la place de chaque objet : `s` (son milieu, le long de la piste), `longueur`, `d0` et `d1` (signés, en travers) ;
   - les positions ont été cherchées par un outil (scratchpad), puis écrites telles quelles dans le fichier.
   - **Le test** (`tests/decors.html`, ajouté aux annexes) : sur chaque circuit, chaque objet est découpé en points (tous les 4 m le long, tous les 3 m en travers). Aucun point n'est sur la piste ni dans la voie des stands, et chacun est au-delà de la barrière (`DISTANCE_BARRIERE`) par rapport à TOUT le tracé, pas seulement à son virage. Le bâtiment des stands reste à `DECOR_MARGE_STANDS` derrière la voie, sur sa longueur.
