# Tour 56, T9 : le vrai réseau (branche `enligne-vrai-reseau`)

**Fait**
- Garde-fous du relais (`serveur/relais.py`) contre la triche simple : `cmd` = tableau de 1 à 128 entiers de 0 à 16383, `n` jamais en arrière (un paquet qui recouvre le précédent est jeté), jamais plus de `max(240, 2 × délai + 16)` pas au-delà du plus en retard des autres (le délai vient des réglages de la salle, 12 par défaut ; un joueur parti ne compte plus ; remis à 0 à chaque départ), NaN et Infinity refusés ; `controle` = `n` croissant et `h` chaîne de 64 signes au plus ou entier de 32 bits. Un message jeté compte comme une faute (200 : connexion coupée).
- Décisions du Chef : D1 (nom = id de couleur, « -2 » à « -8 »), D3 (bornes du cœur : 30 tours, 8 IA, 16 voitures, météos du cœur ; sinon `erreur reglages`), D4 (version `1-<empreinte>`, comparée à celle du créateur de la salle), D5 (cmd et controle mal formés refusés).
- `tests/serveur.py` : 112 tests (dont les parties « garde-fous » et « décisions », et celles de T3b converties aux nouvelles règles), tous verts sur le Mac.
- `tests/reseau-ws.py` + `tests/reseau-ws.html` (annexe de `lancer.py`) : le vrai relais (processus) et deux pages du jeu par WebSocket, avec reseau.js et le vrai lockstep d'enligne.js : mêmes empreintes au bit près après 700 pas, commandes et empreintes relayées, code inconnu refusé, une désynchro d'un millimètre vue. Passé sur le Mac avant les décisions D1/D5 (reste à confirmer avec le reseau.js du Codeur 4).
- `donnees.js` : les réglages EN_LIGNE que reseau.js (T4) avait ajoutés en double écrasaient ceux du cœur (EN_LIGNE_COULEURS redevenait une liste de textes, TOURS_MAX 20, IA_MAX 20) : cause du rouge d'ecrans (« #enligneCouleurs button » introuvable). Les doublons sont retirés.
- LISEZMOI du relais à jour.

**Pas fait / à surveiller**
- `reseau-ws.html` met `EN_LIGNE_NOMS_LIBRES` et lance le relais avec `--noms-libres` : provisoire, tant que reseau.js n'a pas D1 (noms = id de couleur) ; à retirer ensuite. Même chose pour D3/D4 côté reseau.js et le relais JS (Codeur 4).
- Le test d'écrans ciblé (`ECRANS_PAGES="test=enligne"`) n'était pas fini sur le Mac au moment de pousser (verrou pris, machine chargée) ; GitHub tranche.
- La course de bout en bout via principal.js (enligne-course) n'est pas branchée : le test pilote enligne.js directement.
