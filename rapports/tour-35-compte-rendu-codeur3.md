TOUR 35 — compte rendu du Codeur 3 (branche codeur3)
Commit : 84cc7ac — passage GitHub 40609903666 : tous les travaux verts.
Ordres : le détail « Salut Toi » corrigé / 1 fait / 2 fait / 3 fait / 4 fait.

## Le détail du courrier
- Quand le joueur n'a pas de nom, `DISCUSSION.sansNom` enlève « {nom} » des phrases : « Salut, on partage le garage… », « Hi, we share… », « Bien essayé. ». La majuscule de début de phrase est gardée.
- C'est appliqué au courrier, aux réponses des pilotes et à celles des patrons. C'est testé.

## 1. Ton patron, toute l'année (`patrons.js`, « 💼 Direction » dans ta carte du paddock)
- **La confiance** : la réponse dépend de la jauge (haute ≥ 65, basse ≤ 35). Il ajoute ses raisons :
  - tes résultats contre ce qu'on attend de la voiture (« Tu es P7, mieux que ce que vaut notre voiture ») ;
  - les consignes de la saison, suivies ou ignorées. Elles sont notées par `PATRONS.noterConsigne`, appelé dans `principal.js` juste après `appliquerConsigne`.
- **Premier pilote** : accordé si tu mènes le duel d'au moins 3 points et que la confiance atteint 55. Sinon il refuse, avec sa raison. Le statut est gardé dans `ch.statut` pour la saison.
- **Le budget de la voiture** : une fois par saison, si tu fais mieux que prévu et que la confiance atteint 55. Il verse 25 000 au solde, pour le garage.
- **Les consignes** : il explique, il rappelle une consigne ignorée, et en premier pilote, les consignes jouent pour toi. C'est seulement un texte : la course ne change pas.
- **L'insulte** : la confiance baisse de 3.

## 2. Les autres patrons, à la période des contrats seulement
- **Chaque offre a maintenant un salaire**, de 20 000 (la plus faible écurie) à 150 000 (la meilleure), et un statut. Il est versé à la signature. `CONTRAT_SALAIRES_ACTIFS` dans `donnees.js` le coupe.
- **« 💬 Négocier »** sur chaque offre ouvre la discussion avec son patron.
- **Le salaire** :
  - Le bonus que le patron peut accepter vient de son envie de t'avoir : ta note moins son exigence, plus un peu de réputation auprès des sponsors et de relation, fois 0,6. Il ne dépasse jamais +25 %.
  - Une demande dans ce qu'il peut est acceptée.
  - Une demande trop forte, ou sans chiffre, devient une contre-offre. Oui : marché conclu. Non : la contre-offre est refusée.
  - Plus de 2 fois ce qu'il peut : il refuse net. Au 3e refus, il ferme la négociation.
  - Une insulte ferme aussi l'offre, au salaire de base.
- **Le statut** : premier pilote si tu as plus de points que celui qui resterait ton coéquipier.
- Hors des contrats, un autre patron ne répond pas : `dire` renvoie null.

## 3. Les anciens rivaux devenus patrons
- `PATRONS.nom` reprend `SAISONS.signataire`. Ce n'est qu'un nom dans les textes, sinon « La direction de {écurie} ». C'est testé.

## 4. Le courrier
- **« patronVeut »** : à partir du 6e Grand Prix, une meilleure écurie dont tu approches l'exigence (à 0,05 près) t'écrit.
- **« patronDecu »** : ton patron t'écrit après une consigne ignorée, ou quand tes résultats sont nettement sous l'attente.
- Chacun écrit une fois par saison au plus. « Répondre » ouvre la discussion avec le patron. Pour les autres écuries, ça ne marche qu'aux contrats.

## Les tests
- **Le banc** (`tests/banc-parle.html`) : 31 sur 31 (20 avant).
  - Le banc de phrases passe de 101 à 116 phrases en + fr : budget, consignes, statut, salaire (« je veux 80000 »), confiance.
  - 11 tests de patrons : confiance et résultats, premier pilote, budget, consignes, salaire (accepté, contre-offre, oui, refusé, refus répétés, insulte), statut aux contrats, signer (salaire versé, statut, réglage coupé), les noms, le courrier, les textes et le composeur, sans nom, et rien qui touche aux pilotes.
- **Les écrans** (`?test=patron`, en 960 et 1280, en fr et en en) : 72 sur 72 sur le Mac.
  - « 💼 Direction », la confiance tapée, « Premier pilote » au clic, rien hors de l'écran.
  - Les contrats : chaque offre avec son salaire et « 💬 Négocier », la négociation, puis l'offre redessinée avec le salaire négocié.
- **Trois tests existants changés, aucun retiré** :
  - `tests/test.html`, deux tests de `signer` : le solde attendu compte maintenant le salaire. Ils passent aussi sans `patrons.js`, que `test.html` ne charge pas : le salaire vaut alors 0.
  - `tests/ecrans.py`, la fin de saison : le solde attendu compte aussi le salaire. Le clic vise maintenant `button.signer`, puisque chaque offre a aussi un bouton « Négocier ».
- **Un échec corrigé** : sur GitHub, la 3e petite touche de ta carte du paddock faisait descendre la rangée de boutons sur « Revoir les aides » (960, Linux). Le paddock est maintenant calé en haut. Sur le Mac, en 960, il reste 36 px sous la rangée, au lieu de 4.

## Captures
`rapports/captures-tour35/` : patron et contrats-patron, en fr et en en, en 960 et 1280.

## Les lignes de JS changées hors de mes fichiers
- `principal.js` : `montrerDiscussionPatron`, le patron dans `envoyerDiscussion`, `remplirDiscussion`, `quitterDiscussion` (le retour aux contrats) et le courrier, le branchement des deux boutons, et la ligne `PATRONS.noterConsigne` après `appliquerConsigne`.
- `saisons.js` : le salaire et le statut dans `offres`, leur versement dans `signer`.
- `parle.js` et `discussion.js` : seulement des ajouts, sans rien déplacer.
  - `parle.js` : les jetons budget9 et consigne9, les actes BUDGET et CONSIGNE, un montant seul lu comme une demande de salaire, « confiance » et « trust ».
  - `discussion.js` : `sansNom`, et 'contrats' parmi les écrans permis.
- Rien dans `ia.js` ni dans la physique.

Réévalue.
