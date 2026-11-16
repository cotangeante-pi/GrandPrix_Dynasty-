# Tour 56, T4 : le client réseau reseau.js : compte rendu du Codeur 4

Branche `enligne-reseau`. Le client réseau des batailles en ligne : une seule interface, trois transports, le même protocole (celui de `LISTE.txt`, avec les ajouts `reglages` et `retour` du Chef). Tout est derrière `EN_LIGNE` (faux par défaut) : le jeu d'avant est inchangé (`reseau.js` ne fait rien tout seul).

## Ce qui est fait
- `reseau.js` (global `RESEAU`) :
  - `RESEAU.client({transport: 'memoire' | 'diffusion' | 'websocket', ...})` : `ouvrir`, `creer`, `rejoindre`, `pret`, `reglages`, `lancer`, `retour`, `cmd`, `controle`, `emote`, `quitter`, `ping`, `fermer` ; `envoyer(msg)` et `sur(f)` (tous les messages, y compris `{t:'coupure'}`) pour les écrans ; `sur(type, f)` pour un type ; propriétés `code`, `moi`, `hote`, `joueurs`, `depart`, `reglagesSalle`, `latence`, `etat`.
  - **WebSocket** : adresse `EN_LIGNE_URL`, délai d'ouverture, messages trop gros jetés (reçus) ou jamais envoyés, reconnexion courte (`EN_LIGNE_RECONNEXIONS` essais) qui rejoint la même salle tant que la course n'a pas commencé, coupure définitive en pleine course, détection d'une connexion muette (`EN_LIGNE_SILENCE_MS`), ping et latence lissée.
  - **BroadcastChannel** : l'onglet qui crée la salle fait le relais (la salle meurt avec lui : les autres reçoivent `perdu`) ; un code que personne ne connaît donne `inconnue` après `EN_LIGNE_ATTENTE_MS` ; un onglet fermé sans prévenir est retiré de la salle (silence de `EN_LIGNE_SILENCE_MS`).
  - **Mémoire** : un `RESEAU.monde()` avec une file de messages vidée à la main (ou toute seule).
  - Un petit relais en JS (`RESEAU.creerRelais`) : les mêmes règles de salle que le serveur (code de 4 consonnes, 2 à 8 joueurs, hôte = le premier, hôte suivant quand il part, salle vide supprimée, salle commencée fermée, version, noms de liste, réglages bornés, retour à la salle).
- Réglages `EN_LIGNE_*` à la fin de `donnees.js` (les doublons avec ceux de T2 retirés à la fusion dans `enligne-course`).
- Tests : `tests/test.html` (« réseau : … », 20 tests, mémoire) et `tests/reseau.html` (WebSocket simulé, BroadcastChannel ; ajouté aux annexes de `tests/lancer.py` avec `--virtual-time-budget`).

## Choix confirmés par le Chef
Le champ `hote` du message `salle` est l'id de l'hôte ; il faut 2 joueurs pour lancer ; « prêt » est informatif ; les noms viennent d'une liste (`EN_LIGNE_NOMS`, `EN_LIGNE_COULEURS`) ou « Pilote N » + couleur, vérifiés par le client et par le relais ; les codes de salle n'ont pas de voyelle.

## Limites
- BroadcastChannel : la salle vit tant que l'onglet de l'hôte reste ouvert.
- Le relais en JS ne limite pas la cadence des messages (c'est le travail de T3 côté serveur).
- La reconnexion WebSocket redonne un nouvel id (le relais ne connaît pas la reprise d'un joueur) : seulement avant le départ.
- Empreintes des courses d'IA : aucune simulation n'est touchée.

## Tests
- Partie synchrone de `tests/test.html` : 20/20 jouée sous JavaScriptCore (osascript), le verrou du Mac étant pris.
- `tests/reseau.html` : jamais lancée sur le Mac ; passage GitHub 43523306267 (commit 66f09c7) en cours à la rédaction.
