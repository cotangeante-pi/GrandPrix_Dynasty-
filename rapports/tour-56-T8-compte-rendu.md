# Tour 56, T8 : les incidents en ligne (Codeur 3)

Branche `enligne-abandon` (fusion d'`enligne-incidents` et d'`enligne-relecture`) ; `enligne-incidents` (31b19ce) est la partie déjà poussée plus tôt.

## Fait
- **Page (`enligne-page.js`)** : joueur parti annoncé (« X a quitté la course », nom traduit si c'est l'id d'une couleur) ; onglet caché = minuteur de fond (`EN_LIGNE_FOND_MS`) ; connexion lente (« on attend X », abandon à `EN_LIGNE_ATTENTE_MAX_MS` = 15 s) ; désynchro et connexion perdue = message puis retour (`EN_LIGNE_RETOUR_MS`) ; Échap deux fois en 3 s = quitter (pas de pause) ; `retourSalle` : `retour` seulement au podium (`partie.fin`), sinon `quitter`, `partie.terminer()` rend les Math, `ENLIGNE_ECRAN` (nom corrigé).
- **Pub** : `sdk.js` refuse toute pub pendant une course en ligne.
- **Abandon** (`enligne.js`, `simulation.js`) : un joueur parti abandonne au pas dernier + 1 (le même chez tous) : retiré de la piste (plus de collision, plus vu des IA), classé après tout le monde (`abandon`, non classé) ; la page ne le dessine plus (3D, radar, minicarte, caméra suivante). Tests dans `tests/test.html` (« (T8) un joueur parti ABANDONNE… », « n'est plus vu ni touché »).
- **Relais** : délai d'entrée adaptatif calculé par le relais d'après l'aller-retour qu'IL MESURE lui-même (ping websocket toutes les 2 s ; le champ `l` des ping n'est plus cru) ; `tests/serveur.py` 90/90 en local.
- **reseau.js** : correctif minimal de `nomAutorise` (« Pilote 1 » était refusé) ; D1 le remplace.

## Pas fait / à vérifier
- **Rien de nouveau n'a pu être essayé sur le Mac** (verrou occupé) : les tests de l'abandon (`test.html`, `?filtre=T8`), les derniers changements de `enligne-page.js` (retourSalle, noms) et `tests/enligne-incidents.py` n'ont été vus que par GitHub, ou pas du tout pour les derniers commits.
- Onglet caché : Chrome ralentit les minuteurs d'un onglet caché (1 par seconde, 1 par minute après 5 min) : les autres joueurs attendraient plus de 15 s et abandonneraient. Piste : un Worker dédié qui envoie un « tic » à la page (relecture n° 20).
- Relecture n° 5 : `enligne-page.js` passe encore `circuit` et `carte` à `EN_LIGNE.demarrer` (calculés avec les Math du navigateur) : à laisser au cœur (`EN_LIGNE.preparerCircuit`).
- Relecture n° 18 : `avance_max` du relais (240 pas fixe) doit devenir `max(240, 2 × délai + 16)` (T9).
