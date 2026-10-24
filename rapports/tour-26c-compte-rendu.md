# TOUR 26c — compte rendu du Codeur 3 (l'interview d'après course)

Commit : `bb04b7d` sur la branche `codeur3` (origin/main `117374e` fusionné ; les trois commits du tour : `dbea606` ordre 1, `d1cf1e4` ordre 2, `bb04b7d` fusion).
GitHub Actions : passage `40054416259` : **TOUT PASSE** (`completed success` ; moteur 218/218, courses 38/38, ecrans 480/480, sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 50/50 + 45/45, textes 410/410).

Ordres : 1 fait / 2 fait.

## Ordre 1 — `interview.js`, en calcul pur (fait)

- **Les faits de la course** (`INTERVIEW.faits(ch, lignes)`, sur le classement final AVANT l'enregistrement du Grand Prix, `ch.prochain` = le Grand Prix qui vient de finir) : `victoire`, `podium` (place), `contact` (le joueur a un choc ≥ `INTERVIEW_CHOC` m/s ; le rival nommé = le pilote au plus gros choc de la course, puisque le moteur garde `v.chocMax` par voiture et pas la paire ; `chocMax` ajouté aux lignes de `CHAMPIONNAT.lignesDepuisCourse`), `depassement` (≥ `INTERVIEW_DEPASSEMENT_PLACES` places gagnées entre la grille et l'arrivée ; le rival = celui qui finit juste derrière), `penalite`, `duelGagne` / `duelPerdu` (quand l'écart du duel de la saison, cette course comprise, atteint `INTERVIEW_DUEL_NET` = 2 ; sinon le duel ferait question à chaque course et le « résultat moyen » ne viendrait jamais), `serie` (`INTERVIEW_SERIE` courses sans point, celle-ci comprise), `moyen` (toujours).
- **La question** (`question(ch, lignes)`) : au plus une par Grand Prix, le premier fait de `INTERVIEW_PRIORITES` ; la formulation tirée avec la graine (`GRAINE_INTERVIEW`, saison, Grand Prix), jamais la même deux fois de suite pour le même fait (`ch.interview.variantes`) ; trois réponses `{ ton, cle }` (provocant, calme, malin ; l'icône est l'affaire de l'écran).
- **La réponse** (`repondre(ch, q, ton)`) : les trois jauges `ch.reputation = { public, ecurie, sponsors }` bougent selon `INTERVIEW_EFFETS[ton]` (provocant : public +4, écurie −3, sponsors −3 ; calme : écurie +3, sponsors +2 ; malin : public +2, sponsors +3), chaque pas plafonné à ±`INTERVIEW_PAS` (5), les jauges bornées 0–100, `ch.confiance` = la jauge écurie (saisons.js la lit déjà pour les contrats, poids `CONTRAT_POIDS_CONFIANCE`) ; `ton = null` = « pas de commentaire » : rien ne bouge (la question est juste notée). Renvoie `{ effets, rivalite: 'nouvelle' | 'apaisee' | null, ligne: { cle, params } }` (la ligne d'effet de l'écran).
- **La rivalité** : provocant contre un pilote nommé → `ch.pilotes[k].rivalite = { courses: INTERVIEW_RIVALITE_COURSES (3), gp, saison, cle, params, circuit }` ; calme → effacée ; `INTERVIEW.suivre(ch)` (appelé par `finirGrandPrix` après `enregistrerCourse`) use d'une course à chaque Grand Prix suivant (pas celui où elle est posée) et l'efface à 0 ; elle survit au changement de saison. **L'effet sur le pilotage est au Codeur 1** : `ia.js` n'a qu'à lire `pilote.rivalite` (présente = bête noire).
- **Les sponsors** : `INTERVIEW.effetSponsors(ch)` = (jauge − 50) / 50 × `INTERVIEW_EFFET_SPONSORS` (0,1), borné ±0,1 ; `sponsors.js` l'ajoute à la note du joueur (plus de sponsors ouverts) et multiplie les montants par (1 + effet). À 50 : rien ne change.
- **Le journal** : le fait `interview` (la réponse provocante contre un pilote nommé, donnée à ce Grand Prix-là) dans `JOURNAL_PRIORITES` après `duelPerdu`, avant `penalite` ; 3 titres et 2 textes (`uneTitre_interview`, `uneTexte_interview`) ; `{rival}` rendu par son nom.
- **La fiche** : `FICHE.fiche(ch, k).rivalite` = `{ courses, cle, variante, params, circuit, saison }` ou `null`.
- **Ancienne sauvegarde** : `INTERVIEW.completer` (appelé par `CHAMPIONNAT.completer`) : jauges à `REPUTATION_DEPART` (50), `ch.interview = { derniere: null, variantes: {} }`, une jauge hors bornes remise entre 0 et 100.
- **Textes** (`textes.js`, en et fr) : `interviewTitre`, `interviewJournaliste` (Nina Castel, inventée), `interviewPasCommentaire`, `ton*`, `effet*` (5 lignes d'effet), `reputation*`, `ficheRivalite`, et pour les 9 faits : `interview_<fait>_q` (3 formulations) + `interview_<fait>_<ton>` (3 réponses) ; `INTERVIEW.phrase(cle, variante, params, ch, noms)` rend une phrase avec les noms de l'affichage.
- **Réglages** (`donnees.js`) : `REPUTATION_DEPART`, `INTERVIEW_PRIORITES`, `INTERVIEW_EFFETS`, `INTERVIEW_PAS`, `INTERVIEW_CHOC`, `INTERVIEW_DEPASSEMENT_PLACES`, `INTERVIEW_SERIE`, `INTERVIEW_DUEL_NET`, `INTERVIEW_RIVALITE_COURSES`, `INTERVIEW_EFFET_SPONSORS`, `GRAINE_INTERVIEW`.
- **Tests moteur** (8 nouveaux, `tests/test.html`) : la bonne question pour chaque fait et la priorité ; les formulations (jamais la même deux fois de suite, les mêmes avec la même graine, ≥ 2 par question dans les deux langues) ; chaque réponse a l'effet prévu, pas de commentaire sans effet, bornes 0–100, plafond du pas, sauvegarde abîmée ; la rivalité (posée, usée, éteinte, apaisée, malin ne la touche pas, sans rival rien, survit au changement de saison) ; les sponsors (±10 % des montants, 0 à 50) ; les clés en + fr ; une ancienne sauvegarde → 50 partout, et une sauvegarde avec réputation rechargée ; la une « interview » du journal (titre et texte nomment le pilote et le rival ; pas pour calme ni pas de commentaire ; la victoire passe devant).

## Ordre 2 — l'écran (fait)

- **L'enchaînement** (`principal.js`) : résultats → « Continuer » → `montrerInterview(INTERVIEW.question(...))` (les lignes du classement gardées dans `JEU.lignesGP`, le Grand Prix PAS encore enregistré) → un bouton de réponse → `repondreInterview(ton)` : la ligne d'effet (« Pilote 8 n'a pas aimé. ») et « Continuer » → `finirInterview()` : `finirGrandPrix`, puis la une ; « Pas de commentaire » : aucune ligne, la une tout de suite. Le podium 3D reste derrière la carte. Poki : l'interview est un écran hors course, donc `gameplayStop` (le `gameplayStart` ne vient qu'en course et en qualification) ; l'écran est dans la liste `apres` (vitesse et aides cachées).
- **L'écran** (`interface.js`, `index.html`, `style.css`) : `#interview` : le titre, « Nina Castel — La Gazette du Paddock », la question, trois boutons pleine largeur avec l'icône du ton (😤 🤝 😏, le nom du ton en info-bulle), « Pas de commentaire » en petit ; après le choix la ligne d'effet en jaune et « Continuer ».
- **Les jauges au paddock** : `#championnatReputation` sous le rappel du sponsor : trois petites barres « Public · Écurie · Sponsors » avec la valeur, rafraîchies par `montrerChampionnat`.
- **La fiche du rival** : `#ficheRivalite` : « « Pilote 4 conduit comme un danger. Les rétroviseurs, ça existe. » — Circuit d'essai, saison 1 · rivalité : encore 3 courses ».
- **`tests/ecrans.py`** : `interview_ecran(pg, titre, ton, capture)` (la question rendue avec les noms, les 3 tons et icônes, le Grand Prix pas enregistré, tout dans l'écran ; la réponse : la ligne d'effet attendue, les jauges bougées d'un pas, la confiance ; provocant avec rival : « n'a pas aimé » et la rivalité ; « Continuer » → la une ; pas de commentaire : aucun effet, la une tout de suite), `reputation_paddock`, `fiche_rivalite`. Dans `championnat()` : GP 1 répond provocant (capture `interview.png`), puis la une, les jauges [54, 47, 47] au paddock et la fiche du rival ; GP 2 : pas de commentaire, les jauges inchangées après le rechargement ; en 960×600 : une interview fabriquée (contact avec le pilote 3), provocant, capture `interview-960.png`, la une « interview » (`une-interview-960.png`), les jauges, la fiche du 3. `championnat_en` : l'interview en anglais sans un mot français, réponse calme. `fin_saison` : le 12e, pas de commentaire. Le test de Codeur 2 (« la une nomme Léo ») : une ligne ajoutée, `passer_interview(pg)` (pas de commentaire), parce que la une vient maintenant après l'interview.

## Sortie des tests

- Mac, sous le verrou : `moteur` 218/218 (74 s, après la fusion de main avec `deux-joueurs.js`) ; `ecrans` 480/480 (455 s), console vide ; `annexes` : sdk 19/19, pneus 28/28, enregistreur 28/28, circuits 50/50 + 45/45, textes 410/410.
- GitHub (`bb04b7d`, passage 40054416259) : TOUT PASSE — 218/218, 38/38, 480/480, 19/19, 28/28, 28/28, 50/50, 45/45, 410/410 (suite complète en 5 min 40).

## Mesures

- Les formulations tirées sur 12 Grands Prix « moyens » (graine 64) : 2 0 1 0 1 0 1 2 0 2 0 2 — jamais deux fois la même de suite, les trois servies.
- Les sponsors d'une saison à la 8e place (note 0,729) : montants à 50 / 100 / 0 de jauge : 45 000 + 20 000 + 15 000 + 10 000 / 77 000 + 33 000 + 22 000 + 11 000 (un sponsor plus gros s'ouvre) / 40 500 + 18 000 + 13 500 + 9 000.
- Dans la page (robot, 1 tour) : la question du GP 1, du GP 2 et du 12e est « contact » (le robot se fait toucher à chaque course) ; le rival nommé au GP 1 : Pilote 8.

## Pour CLAUDE.md (le Chef décide)

- La liste des fichiers : `interview.js` : l'interview d'après course en calcul pur (faits de la course par priorité `INTERVIEW_PRIORITES`, formulations tirées avec la graine, trois tons, la réputation `ch.reputation` {public, écurie, sponsors} 0–100 avec `ch.confiance` = la jauge écurie, la rivalité `ch.pilotes[k].rivalite` pendant `INTERVIEW_RIVALITE_COURSES` courses, `phrase()` pour l'affichage) ; l'écran dans `interface.js` entre les résultats et la une.
- Dans « L'interview d'après course » : fait au tour 26c, sauf l'effet de la rivalité sur le pilotage (Codeur 1, `ia.js` lit `pilote.rivalite`) et la question « consigne d'équipe ignorée » (les consignes n'existent pas encore) ; « gros contact avec un pilote nommé » : le moteur garde la plus forte vitesse de choc par voiture, pas la paire ; le rival nommé est le pilote au plus gros choc de la course.
- `saisons.js` : « la confiance reste à 50 » n'est plus vrai : elle suit la jauge écurie de l'interview.
- Les trois commits sont séparés (ordre 1, ordre 2, fusion) si le Chef veut fusionner l'ordre 1 seul.

## Ce que je n'ai pas pu vérifier

- Le rendu des émojis des tons sur Linux (GitHub) : les captures `interview.png` du passage GitHub le diront ; le test ne regarde que le texte des icônes.
- La sensation : les textes (ton des questions et des réponses), les valeurs des pas (±3 à ±4 par réponse, 3 courses de rivalité) et la place des jauges au paddock sont à juger par le propriétaire.
- `gameplayStop` pendant l'interview n'est pas vérifié avec le faux SDK (`?test=sdk` ne passe pas par le championnat) ; c'est le même mécanisme que pour la une et le podium.

Réévalue.
