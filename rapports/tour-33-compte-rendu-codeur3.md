TOUR 33, partie C (les discussions) — compte rendu du Codeur 3 (branche codeur3)
Commit : e0f7a1b — passage GitHub 40600870628 : les 12 travaux verts. Le commit suivant ajoute la page anglaise en 1280 et les captures.
Ordres : C1 fait (le moteur et le banc) / C2 fait (l'écran) / C3 fait (le courrier).

## C1. Le moteur, en calcul pur
- **`parle.js` (PARLE.comprendre)** : la phrase écrite librement, en français ou en anglais. Inspiré du jeu de gestion de pays, refait pour la course.
  - La phrase est mise à plat : minuscules, sans accents.
  - Le langage parlé et les expressions deviennent des jetons : slt, wesh, stp, dsl, t nul, gg, mdr, u r, thx, my bad, « laisse moi passer », « je te rendrai la pareille », « bloque le », « sans rancune », « you crashed into me »…
  - Les mots sont reliés à des concepts par un lexique (avec les racines, les fautes de frappe et deux lettres inversées).
  - L'acte retenu est le plus proche des 20 actes possibles (similarité cosinus).
  - Elle relève aussi la négation (« je ne m'excuse pas » est un refus), l'ironie (lol, mdr), la question, le pilote nommé (par le nom ou le nom de famille, sans accents) et un montant.
  - Aucun hasard : la même phrase donne toujours la même lecture.
- **`discussion.js` (DISCUSSION)** :
  - **Le raisonnement** (`raisonner`) part du vrai état du pilote : son caractère (fougueux si agressivité ≥ 0,6, rancunier si ≥ 0,8), sa relation avec toi (−50..+50), sa rivalité, la dernière course (contact, dépassement), le duel s'il est ton coéquipier, son intérêt au championnat (pour « bloque-le »), et sa mémoire (promesse ouverte, tenue ou trahie ; menace ; crédit).
  - **La réponse** est composée depuis ce calcul : une réaction (53 réactions, avec des variantes), suivie de ses raisons (12, par exemple « Après Monzo, tu ne manques pas de culot », « la promesse faite à Bahrayn, jamais tenue »). Les textes sont dans `textes.js` en + fr, jamais genrés.
  - **Les effets** sont tous plafonnés (`DISCUSSION_*` dans `donnees.js`) : la relation (±8 par message, ±50 au total), la rivalité (2 courses, comme l'interview ; effacée par des excuses acceptées ou la paix), la confiance de l'écurie (insulter son coéquipier : −2), la disposition « laisser passer » ou « bloquer X », la promesse, la menace.
  - La disposition vaut pour le prochain Grand Prix seulement ; elle est gardée dans `p.disposition`, mais **le pilotage ne la lit pas encore** (voir plus bas).
  - **La mémoire** est compacte, dans la sauvegarde : relation, les 12 derniers actes, la promesse, la menace, la demande en attente, le crédit.
    - Une menace sans suite pendant 2 courses fait perdre du crédit, et il te le dit.
    - Une promesse non tenue est rappelée dans les discussions suivantes.
    - Au plus 8 messages à un même pilote par Grand Prix.
  - **Le composeur au clic** (`composer`) : 16 intentions, chacune une phrase de la langue du jeu, qui repart dans la même lecture. « Bloquer » prend un pilote dans une liste. Le duel n'est proposé qu'avec le coéquipier, oui et non que s'il attend une réponse.
  - **Jamais pendant une course** : `dire(…, écran)` refuse sur la course, la pause, la qualification, la grille et le podium.
  - Les variantes ont leur propre suite de hasard (`ALEATOIRE.suite`).
- **Le banc** (`tests/banc-parle.html`, ajouté aux annexes) : 20 tests sur 20.
  - Le banc de phrases (`tests/banc-parle.js`) : 101 phrases en + fr, langage parlé et fautes de frappe compris, qui couvrent 19 actes. S'y ajoutent la lecture fine et le composeur dans les deux langues.
  - Le raisonnement : insulte au pilote fougueux ou calme, excuses (acceptées, refusées, sans objet), laisser passer, la promesse rappelée, la menace sans suite, bloquer selon l'intérêt, le duel et la confiance.
  - Les plafonds, le refus pendant une course, et les textes de chaque réaction et de chaque raison dans les deux langues.
  - Une même situation donne la même phrase, et le hasard d'une course n'est pas touché.
  - Une ancienne sauvegarde se charge, et `apresGrandPrix` ne change rien sans discussion.
  - Le courrier : 4 tests.

## C2. L'écran
- **« 💬 Discuter »** sur la fiche d'un rival. **« 💬 Coéquipier »** et **« ✉ Courrier (n) »** dans ta carte du paddock (pas dans la rangée de boutons : elle débordait en 960 sur Linux).
- **L'écran `#discussion`** : son portrait, son nom, l'humeur de la relation (et la rivalité), le fil en bulles, le composeur (boutons d'intention, la liste des pilotes pour « Bloquer… »), la saisie libre (Entrée envoie, 140 caractères) et « Retour » (vers la fiche, le paddock ou le courrier).
- Chaque message est sauvegardé.
- **Les tests d'écran** (`?test=discussion`, en 960 et 1280, en fr et en en) : depuis la fiche, la saisie prête, on tape avec des espaces, Entrée envoie, la réponse arrive dans le fil, le composeur « S'excuser », la mémoire sauvegardée, rien hors de l'écran, le coéquipier et le duel, le courrier, « Répondre », et le retour.

## C3. Le courrier des pilotes (`courrier-pilotes.js`)
- Après chaque Grand Prix, les pilotes écrivent d'eux-mêmes, sur **15 sujets** classés par urgence : contact (furieux ou calme selon le caractère), promesse à rendre (il te demande la pareille ; ton oui ou ton non dans la discussion la tient ou la trahit), rivalité, duel perdu ou gagné, dépassement, menace sans suite, bravo, Grand Prix à domicile, courage, jalousie, leader, vieux pilote, bienvenue du coéquipier.
- Au plus 3 messages par Grand Prix, pas de redite avant 4 Grands Prix, 20 messages gardés.
- « Répondre » ouvre la discussion avec son message en tête du fil.

## Captures
`rapports/captures-tour33/` : discussion et courrier, en fr et en en, en 1280 et 960.

## Les lignes changées hors de mes fichiers
- **`principal.js`** :
  - les fonctions de la discussion et du courrier (nouvelles) ;
  - `JEU.ficheK = k` dans `montrerFiche` ;
  - le branchement des deux écrans ;
  - **deux gardes au clavier** : le `preventDefault` des flèches et de l'espace, et la touche M (son), ne s'appliquent plus quand on tape dans un champ de texte. Sans elles, on ne pouvait pas taper d'espace.
- **`championnat.js`** : deux lignes dans `finirGrandPrix`, `DISCUSSION.apresGrandPrix` et `COURRIER_PILOTES.apresGrandPrix`.
- **`interview.js`** : `faitsGP` (qui t'a touché, qui tu as dépassé) gardé dans `ch.interview.derniere`.
- **`interface.js`** : 'discussion' et 'courrier' dans `montrer`, le bouton du courrier dans `remplirPaddock`, et les deux écrans (nouveaux).

## Ce qui reste, et ce que je n'ai pas fait
- **La disposition « laisser passer » ou « bloquer X » n'est pas lue par le pilotage.** C'est `ia.js`, le fichier du Codeur 1, à brancher avec ses garde-fous. Jusque-là, la discussion change la relation, la rivalité (déjà lue par `ia.js`), la confiance, la mémoire et le courrier, mais pas la conduite au-delà de la rivalité.
- **Les patrons d'écurie** (négocier salaire et statut) : pas faits. Un pilote répond « l'argent, c'est avec le patron ».
- Un piège trouvé en test : quand la page calcule beaucoup, l'arrivée en fondu d'un écran peut démarrer tard, et une capture prise trop tôt le montre vide. Les captures attendent maintenant 800 ms. Ça ne change rien au clic.

Réévalue.
