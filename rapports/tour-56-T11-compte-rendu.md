# Tour 56, compte rendu du Codeur 2 (T2, T11, T13)

- **T2 (cœur du lockstep)** : fait, fusionné dans main. Branche enligne-coeur, 130e1b8, 18/18 (passage 43525376168).
- **T11 (relecture)** : fait. Branche enligne-relecture, dernier commit 0653f80. Passage 43610464335 (f6465f4) 18/18 vert ; passage 43653109828 (0653f80) : 17 travaux verts sur 18 au moment de l'arrêt, ecrans-6 encore en cours.
  - Rapport : rapports/tour-56-T11-relecture.md (23 points, 3 passes : reseau.js, relais.py, écrans, enligne-page.js, T8, T9).
  - Corrigé dans le code : bornes des messages reçus (mémoire d'un tricheur), `EN_LIGNE.preparerCircuit`, `partie.fin` (fin de course décidée au même pas chez tous), `controle.h` envoyé en chaîne (D5), bulle d'aide de course sur téléphone couché (style.css : finit à 216 px au lieu de 250, mesuré sur iPhone SE, Galaxy S9+ et Pixel 7).
  - Tests : `tests/test.html?filtre=en ligne` 18/18 sur le Mac.
  - À faire par les auteurs (transmis au Chef) : T7 (partie.fin pour le podium, terminer(), ne pas passer circuit/carte), T8 (retour seulement au podium, onglet caché, ENLIGNE_ECRAN), T9 (avance_max selon le délai, ping mesuré par le relais).
- **T13 (CLAUDE.md)** : fait. Branche enligne-claude, 7b28977 (`[skip ci]`) : section « Les batailles en ligne », ligne 16 du tableau des étapes, liste des fichiers. À remettre à jour quand les branches en ligne seront fusionnées.
- **Pas fait** : T8 (je l'avais réservé puis rendu au Chef), le passage Safari/Firefox des Math à nous (jamais essayé), la fusion des correctifs de relecture dans les branches des autres.
