# Tour 56, T3 : le serveur relais (branche enligne-serveur)

- `serveur/relais.py` (Python asyncio + websockets 13+), `serveur/LISEZMOI.md` (lancer en local, protocole, règles et limites).
- Protocole du Chef respecté, plus `reglages` (hôte seul, renvoyé à tous, gardé pour les nouveaux) et un message `erreur` (ignorable) quand un lancer ou des réglages sont refusés.
- `tests/serveur.py` : 59 vérifications avec de vrais clients websockets (créer, rejoindre, 5 refus, prêt, lancer, départ, relais ordonné, émotes, ping, hôte qui part, salle vide, limites de taille et de cadence, noms, salles qui expirent). Branché dans les annexes de `tests/lancer.py` ; `pip install websockets` dans le workflow.
- Rien n'est hébergé ni envoyé. Reste pour T9 : garde-fous contre la triche (pas en avance, commandes hors limites). Pas de retour à la salle après une course dans le protocole : une nouvelle course = une nouvelle salle (à décider avec T7).

## Alignement sur reseau.js (demande du Chef)
Mêmes règles que `RESEAU.creerRelais` : « prêt » informatif (lancer dès 2 joueurs) ; noms = liste EN_LIGNE_NOMS ou « Pilote N » (1 à 99) + couleur, 20 signes, sinon `refus nom` ; réglages = circuit, tours 1 à 20, meteo, nbIA 0 à 20 (rien d'autre gardé) ; 8 émotes ; `{t:'retour'}` (hôte, après le départ : renvoyé à tous, salle rouverte, prêts à faux, puis `joueurs`) ; `{t:'erreur', raison}` gardé.
Ordre : les `cmd` d'un joueur et le `parti` qui suit passent par la même file d'envoi de chaque destinataire, donc « parti » arrive toujours après sa dernière `cmd` relayée (test : 200 paquets `{t:'cmd', n, c:[4 entiers 14 bits]}` puis coupure brutale). Un paquet de 4 entiers pèse moins de 100 octets et 15 paquets par seconde sont loin des 150 permis : les limites (4096 octets, 150/s) tiennent.
