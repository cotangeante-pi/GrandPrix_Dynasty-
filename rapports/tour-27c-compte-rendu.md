# TOUR 27c — compte rendu du Codeur 3 (les rumeurs de transfert du journal)

Commit : `2f7d692` sur la branche `codeur3` (origin/main `a0c1f19` déjà dedans, fusion sans conflit).
GitHub Actions : passage `40056096443` : **TOUT PASSE** (`completed success` ; moteur 224/224, courses 38/38, ecrans 481/481, sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 50/50 + 45/45, textes 412/412).

Ordres : 1 fait.

## Ordre 1 — les intentions de transfert et les rumeurs (fait)

- **`saisons.js` : `intentions(ch)`** : au début de chaque saison, avec la graine (`ch.graine + GRAINE_SAISONS + 11 + saison × 101`), `TRANSFERTS_PAR_SAISON` paires de pilotes IA d'écuries différentes (jamais le joueur, jamais un pilote dans deux paires ; jusqu'à 20 tirages pour trouver une paire valable, donc presque jamais vide). Rangées dans `ch.transferts = { saison, liste: [[a, b]] }` (des indices de pilotes), donc dans la sauvegarde unique. Posées par `nouvelleSaison` ; `completer` les calcule pour une ancienne sauvegarde ou une saison qui n'en a pas (une sauvegarde de test sans pilotes IA : liste vide).
- **`evoluer`** applique ces intentions à la fin de la saison, à la place du tirage d'avant : un transfert tombe si l'un des deux pilotes vient de prendre sa retraite (`partis`) ou si leurs écuries sont devenues les mêmes. **Une carrière déjà sauvegardée** : les retraites, les rythmes et les niveaux d'écurie ne changent pas (le tirage des transferts venait après eux dans le flux de hasard) ; seuls les transferts de fin de saison seront d'autres paires que celles que l'ancien code aurait tirées. Le résumé d'un retraité garde maintenant son `id` (compact, sert aux tests).
- **`journal.js` : la brève `breveRumeur`**, en tête des brèves à partir du Grand Prix `JOURNAL_RUMEUR_DES_GP` (7, la seconde moitié) : vraie (une intention, le pilote vers l'écurie de l'autre ; paramètres `{ pilote, ecurie, vraie: 1 }`) ou fausse (`JOURNAL_RUMEUR_FAUSSE` = 0,35 : un pilote qui n'est dans aucune intention vers une autre écurie que la sienne, `vraie: 0`) ; **la première rumeur de la saison est toujours vraie** (jamais toutes fausses). Tirée dans le flux de hasard de `composer` (la graine du journal). Rien de caché sur la prochaine course : seulement un pilote et une écurie.
- **Textes** (`textes.js`, en + fr) : `breveRumeur`, 3 variantes (« {pilote} vers {ecurie} ? Les paddocks bruissent. », « Rumeur : {pilote} pourrait signer chez {ecurie} pour la saison prochaine. », « Bruits de transfert : {ecurie} voudrait {pilote}. »). `JOURNAL.cles()` la liste.
- **Réglages** : `JOURNAL_RUMEUR_DES_GP`, `JOURNAL_RUMEUR_FAUSSE` (`donnees.js`).
- **Tests moteur** (3, `tests/test.html`) : les intentions (paires valables, jamais le joueur, les mêmes avec la même graine, d'autres avec une autre, une ancienne sauvegarde les reçoit au chargement) ; sur 10 saisons simulées (`SAISONS.avancer`), les écuries après `nouvelleSaison` sont exactement celles d'avant avec les échanges annoncés (sauf retraite) ; sur 10 saisons, aucune rumeur avant le GP 7, une rumeur en tête des brèves à chaque GP ≥ 7, une vraie = une intention, une fausse n'en est pas une, jamais toutes fausses sur une saison, la part de fausses proche du taux. `tests/ecrans.py` : au 12e Grand Prix (`?gp=12`, 1280), la première brève de la une est une rumeur rendue avec un nom de pilote et d'écurie, capture `une-rumeur.png`.

## Sortie des tests

- Mac, sous le verrou : `moteur` 224/224 (71 s) ; `ecrans` 481/481 (443 s), console vide ; `annexes` : sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 50/50 + 45/45, textes 412/412.
- GitHub (`2f7d692`, passage 40056096443) : TOUT PASSE — 224/224, 38/38, 481/481, 19/19, 28/28, 28/28, 50/50, 45/45, 412/412 (suite complète en 6 min).

## Mesures

- 10 saisons simulées (graine 82) : 17 transferts annoncés puis faits, 3 tombés avec une retraite.
- 10 saisons (graine 83) : 60 rumeurs, 40 vraies et 20 fausses, part 0,33 pour un taux de 0,35 (la première de chaque saison est forcée vraie : la part attendue est 0,35 × 5/6 ≈ 0,29 ± la marge).
- `une-rumeur.png` : « Rumeur : Pilote 2 pourrait signer chez Écurie 10 pour la saison prochaine. » en première brève du 12e Grand Prix.

## Pour CLAUDE.md (le Chef décide)

- `saisons.js` : « transferts » → « intentions de transfert décidées en début de saison (`ch.transferts`, graine), appliquées à la fin par `evoluer` » ; `journal.js` : les rumeurs (`breveRumeur`, `JOURNAL_RUMEUR_*`) viennent de ces intentions, vraies ou fausses selon le taux, la première de la saison toujours vraie.
- La note du test de 15 saisons (saisons.js) : 48 transferts sur 15 saisons avec les intentions (contre un tirage libre avant).

## Ce que je n'ai pas pu vérifier

- Le rendu de la rumeur en anglais dans la page (le test d'écran est en français ; les clés et les trous sont vérifiés par textes.html).
- Les textes des rumeurs et le taux de fausses (0,35) sont à juger par le propriétaire.

Réévalue.
