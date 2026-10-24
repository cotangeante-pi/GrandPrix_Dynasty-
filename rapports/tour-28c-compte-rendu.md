# TOUR 28c — compte rendu du Codeur 3 (cérémonie, album, bilan et temple, relève)

Commit : le dernier de la branche `codeur3` (ce compte rendu et deux retouches de la relève ; voir « Sortie des tests »). Les ordres verts :
- ordre 1 : `72f5c73`, passage GitHub `40120898575`, TOUT PASSE (fusionné par le Chef) ;
- ordre 2 : `234f9c8` (`3bf2c1b` + main), passage `40122358844`, TOUT PASSE (fusionné) ;
- ordre 3 : `c098f01` (`852bde6` + main), passage `40123528682`, TOUT PASSE (fusionné, `3fbcfef`) ;
- ordre 4 : `ab6706d` (`e34d04e` + `7fa58e4` corrections + main), passage `40125129037`, TOUT PASSE : moteur 236/236, courses 38/38, ecrans 565/565, sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 56/56 + 51/51, textes 499/499.

Ordres : 1 fait / 2 fait / 3 fait / 4 fait.

## Ordre 1 — la cérémonie du champion
- À la fin de la saison (une fois : `ch.saisons[…].ceremonie`, pas deux fois au rechargement), avant le classement final. Joueur champion : le podium 3D existant, le champion **seul** sur la plus haute marche, « CHAMPION DU MONDE », son nom, ses points et ses victoires de la saison, des confettis (`podium3d.js` : un seul `THREE.Points`, 700 particules, positions mises à jour dans le tableau de la géométrie, un générateur à lui, jamais `hasard()`). Rival champion : l'écran court « <nom> est champion du monde » et la place du joueur, sans confettis. Poki : un menu (gameplayStop, vérifié par `SDK.enJeu`).
- La une spéciale : quand le fait est `titreChampion`, le titre est toujours « CHAMPION ! … » (la variante est tirée quand même, le reste du tirage ne bouge pas), page marquée `speciale` (titre en or).
- Mesure : avec les confettis, **un appel de dessin de plus**, exactement (mesuré à chaque passage : appels avec / sans).
- Remarque du Chef corrigée : la cérémonie des tests est jouée sur un championnat fabriqué **cohérent** (de vraies places à chaque Grand Prix) : « 239 points · 5 victoires » (1280), « 258 points · 6 victoires » (960) ; un test vérifie que l'écran dit les chiffres de la saison.
- Captures : `ceremonie.png`, `ceremonie-960.png`, `ceremonie-rival-960.png`.

## Ordre 2 — l'album des unes
- Bouton « 📰 Album » au paddock (grisé sans une). La page de la une, avec une barre : ⏮ ◀ « Saison 2 · Grand Prix 5 · 17 / 36 » ▶ ⏭ « Fermer » ; ← → feuillettent, un clic sur la page tourne la page, Échap ferme.
- Chaque une porte sa saison (`s`) ; une sauvegarde d'avant la retrouve (`JOURNAL.completer`). **Redessinée à l'identique** : `JOURNAL.rendreAlbum` rend la une avec les noms **de sa saison** (un rival parti à la retraite reprend son nom et son numéro depuis `ch.retraites`, un joueur d'une génération d'avant depuis `ch.dynastie.generations`).
- Test moteur : 6 saisons, 72 unes, toutes identiques au rendu du jour même (49 auraient changé de nom sans `rendreAlbum`, 5 retraites), aussi après rechargement. ecrans : après 3 Grands Prix, l'album s'ouvre, ← ←, un clic, ▶, Échap ; capture `album.png`.

## Ordre 3 — le bilan de carrière et le temple (carriere.js, nouveau)
- `carriere.js`, calcul pur : la carrière en cours `ch.carriere` (début, meilleur résultat à domicile, meilleur temps de réaction noté par `principal.js` au départ du joueur, victoires par circuit, duels au début de la carrière) ; `bilan` (saisons, titres, victoires, podiums, poles, meilleurs tours, meilleure place au championnat, domicile, réaction, duels contre chaque coéquipier, y compris ceux partis à la retraite, la une préférée = le fait de plus haute priorité, la première) ; `resume` (compact) ; le temple (`entrer`, `classer` : titres, puis victoires, puis podiums ; `TEMPLE_MAX` = 30) et les records de carrière (titres, victoires, podiums, poles, meilleurs tours, saisons ; réaction la plus courte), **à la racine de la sauvegarde** (`d.temple`) : ils survivent à une nouvelle carrière.
- L'écran « Carrière terminée » devient le bilan : 9 cases, les duels, « Ta une préférée » (redessinée), la place au temple, « 🏛 Temple de la renommée » (classement, la carrière marquée, les records ; « Retour »). Une carrière entre au temple une seule fois (`ch.retraite.temple` = son numéro d'entrée), même au rechargement.
- Tests moteur : bilan juste sur une carrière simulée de 15 saisons (comptée à côté), temple trié et plafonné, records gardés après un nouveau championnat, ancienne sauvegarde (v3) qui se charge. ecrans : retraite → bilan → temple → retour → rechargement ; captures `bilan.png`, `temple.png`.
- **Taille de la sauvegarde après une carrière de 15 saisons, temple compris : 79 883 octets (78 Ko ; l'album 55,7 Ko).**
- Remarques du Chef corrigées : les nombres s'accordent (`nombre(n, cle)` dans `textes.js`, clés `nb_*` [singulier, pluriel], singulier à 0 et 1 en français, à 1 en anglais ; testé) dans le bilan, la cérémonie, le temple, l'arbre, les records de famille : « 1 saison · 6 victoires · 12 podiums · 1 titre » ; « Ta une préférée ».

## Ordre 4 — la relève
- Au bilan : « 👪 Continuer la dynastie » et « ✨ Nouvelle dynastie » (deux clics : « Confirmer : un monde tout neuf »).
- L'écran de l'héritier : « Prendre la suite de Marco Rossi », le prénom, le nom de famille gardé (le dernier mot du nom du parent), un numéro libre, le lien (fils de / fille de / protégé de / protégée de Marco Rossi), le pays et la course de cœur du parent par défaut, le motif du casque (les couleurs du parent sont gardées ; « Mon casque » au paddock pour tout changer) ; l'arbre de la dynastie à droite. `casque.js` seulement lu (`valide`, `creer`, `neutre`).
- `CARRIERE.continuer` : la carrière finie devient une génération (résumé compact), le **même monde** passe à la saison suivante (`SAISONS.nouvelleSaison` : les rivaux évoluent), l'héritier prend la place du joueur dans **l'écurie la plus faible** de la nouvelle saison, repart de zéro (statistiques, places, garage, argent, sponsor), la réputation de départ hérite un peu (`HERITAGE_REPUTATION_PAR_TITRE` = 2 par titre de la famille, plafond `HERITAGE_REPUTATION_MAX` = 8), un peu d'attention à la fin de sa première saison (`HERITAGE_ATTENTION` = 0,08 de note, seulement pour les écuries moyennes et faibles, jamais une grande, dans `SAISONS.offres`). La retraite par l'âge compte les saisons de **cette** carrière. « Nouvelle dynastie » : `CARRIERE.nouveauMonde` (une autre graine), l'ancienne reste au temple.
- Le monde se souvient : la une du premier Grand Prix de l'héritier (`releve_<lien>`, juste après le titre de champion dans `JOURNAL_PRIORITES` : « La fille de Marco Rossi débarque », « Léa Rossi, la fille de Marco Rossi, prend le départ ») ; la fiche d'un rival qui a couru contre le parent : « J'ai couru contre Marco Rossi. Marco Rossi ne lâchait jamais rien. » ; les records de famille au bilan (générations, titres, victoires, générations championnes ; victoires par circuit dans `recordsFamille`).
- Sauvegarde **v4** (une ancienne devient une dynastie d'une génération) ; les retraités et les générations gardent un résumé compact.
- Tests moteur (4) : continuer garde le monde (écuries, rivaux, saison suivante) et le nom de famille, l'héritier repart de la plus petite écurie, sans garage ni argent, voiture × 1, refus sans prénom / mauvais lien / avant la retraite, numéros tous différents ; plafonds de l'héritage et de l'attention ; nouvelle dynastie = monde neuf, l'ancienne au temple ; **aucun texte sur le pilote précédent n'est genré** (`CARRIERE.CLES_PARENT`, en + fr, liste de mots interdits) et les textes de l'héritier s'accordent aux 4 liens (68 textes vérifiés) ; la une de la relève pour chaque lien, seulement au premier Grand Prix, l'album nomme chaque génération ; records de famille additionnés sur 3 générations, ancienne sauvegarde v3. ecrans : bilan → « Continuer la dynastie » → l'écran (refus sans prénom, Léa, fille) → le paddock de la saison 2 dans la plus petite écurie → la une « … la fille de Marco Rossi … » ; captures `releve.png`, `releve-une.png`.
- **Taille après 3 générations de 15 saisons (simulées) : 211 047 octets (206 Ko) ; 540 unes, 52 retraités.**

## Sortie des tests
- GitHub, ordre 4 (`ab6706d`, passage 40125129037) : TOUT PASSE (chiffres plus haut). Le dernier commit de la branche ajoute seulement : le message d'erreur de l'héritier qui part dès qu'on corrige (vu sur `releve.png`, la capture était prise avec le message), le petit bouton « Nouvelle dynastie » centré, et ce compte rendu ; son passage est noté dans le message au Chef.
- Mac : seulement des parties, sous le verrou ; `ECRANS_FILTRE` (nouveau, `tests/ecrans.py`) pour ne lancer que ses pages (« adresse largeur ») ; GitHub lance toujours tout. Le Mac était très chargé (charge 15 à 21) : `test.html` y a dépassé ses 300 s une fois (aucun échec, coupé), d'où le travail jugé sur GitHub.

## Pour CLAUDE.md (le Chef décide)
- `carriere.js` dans la liste des fichiers ; `podium3d.js` : la cérémonie (`ceremonie`, `majConfettis`, un appel de dessin) ; `journal.js` : `s` (la saison) dans chaque une, `rendreAlbum`/`nomsAu`, les unes `releve_<lien>` ; `sauvegarde.js` : v4, `temple` à la racine ; `textes.js` : `nombre(n, cle)` et les clés `nb_*` ; `tests/ecrans.py` : `ECRANS_FILTRE`.
- En anglais, « dynasty » ne peut pas être dans les textes (test : le nom du jeu seulement par sa clé) : les boutons disent « Continue the family legacy » / « A new family ».

## Ce que je n'ai pas pu vérifier
- Les textes en anglais de l'album, du bilan et de la relève dans la page (tests d'écran en français ; clés et trous vérifiés par textes.html).
- « de Alex » (pas d'élision « d'Alex ») dans les textes de la relève : les noms qui commencent par une voyelle se lisent mal en français ; à décider (une règle d'élision dans `nombre`/`avec`, ou des formulations sans « de »).
- Pas fait (pas demandé dans les « Fini quand ») : l'arbre de la dynastie depuis le paddock (il est sur l'écran de l'héritier), les anciens rivaux devenus patrons ou consultants, « Elle égale les 3 titres de la famille ! », la photo de la une.
- La sensation (cérémonie, confettis) est à juger par le propriétaire.

Réévalue.
