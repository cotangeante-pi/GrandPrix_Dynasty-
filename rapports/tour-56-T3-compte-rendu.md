# Tour 56, T3 : le serveur relais (branche enligne-serveur)

- `serveur/relais.py` (Python asyncio + websockets 13+), `serveur/LISEZMOI.md` (lancer en local, protocole, règles et limites).
- Protocole du Chef respecté, plus `reglages` (hôte seul, renvoyé à tous, gardé pour les nouveaux) et un message `erreur` (ignorable) quand un lancer ou des réglages sont refusés.
- `tests/serveur.py` : 59 vérifications avec de vrais clients websockets (créer, rejoindre, 5 refus, prêt, lancer, départ, relais ordonné, émotes, ping, hôte qui part, salle vide, limites de taille et de cadence, noms, salles qui expirent). Branché dans les annexes de `tests/lancer.py` ; `pip install websockets` dans le workflow.
- Rien n'est hébergé ni envoyé. Reste pour T9 : garde-fous contre la triche (pas en avance, commandes hors limites). Pas de retour à la salle après une course dans le protocole : une nouvelle course = une nouvelle salle (à décider avec T7).
