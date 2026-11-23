# Tour 61, Codeur b : une vraie course en ligne

Branche `enligne-course-61`. Détail et réglages : CLAUDE.md, « Les batailles en ligne », « Une vraie course en ligne (tour 61) ».

- **Drapeaux** (`9307b41`) : état de bandeau par humain dans `drapeaux.js`, `EN_LIGNE_DRAPEAUX`, empreinte étendue. Test : 4 joueurs, latences variables, un humain arrêté + une IA arrêtée (jaune, VSC, vert) = référence sans réseau au bit près.
- **Pneus à l'arrêt** (`3461769`) : ← → dans la direction de la commande, bouton au doigt en appuis. GitHub (passage court) : vert.
- **Qualification** (`7cfc497`) : réglage de l'hôte (`sort` / `fantomes` / `seul`), même lockstep, grille d'après les temps ; relais Python et JS mis à jour.
- **Classement de salle + record personnel** (`7cfc497`) : calcul pur testé (2 courses de suite, 3 humains), affichage sur les résultats.
- **Aides au pilotage** : non faites (voir CLAUDE.md : un choix propre à chaque joueur, il faudrait diffuser les aides de chacun).
- `EN_LIGNE_VERSION` 1 → 2.

**Non vérifié** (Mac saturé, consigne du Chef) : la page en navigateur avec la qualification, la ligne « Grille » des écrans de salle en 640×360, `tests/relais-pareils.py`, les tests complets sur GitHub (seul le passage court tourne sur une branche `enligne-*`).
**À essayer par le propriétaire** : deux ordinateurs, l'hôte choisit « Grille : Qualif, fantômes », chacun fait son tour, puis la course ; deux courses de suite et le classement de la salle ; un arrêt au stand avec ← →.
