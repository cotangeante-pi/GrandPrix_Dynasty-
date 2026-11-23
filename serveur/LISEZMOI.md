# Jouer en ligne à la maison (le plus simple)

Tu veux jouer contre un copain ou un frère, **sur le même Wi-Fi** (le Mac et un téléphone, ou deux ordinateurs) ? Il n'y a rien à installer.

**Sur le Mac (celui qui garde le jeu) :**

1. Ouvre l'application **Terminal**.
2. Écris ceci, puis appuie sur Entrée (le dossier du jeu est celui qui contient `index.html`) :
   ```
   cd "…/Grand Prix Dynasty"
   python3 serveur/maison.py
   ```
3. Le Terminal écrit deux adresses. Garde la fenêtre ouverte : c'est elle qui fait marcher le jeu. Si le Mac demande « Autoriser les connexions entrantes ? », réponds **Autoriser**.

**Sur le Mac :** ouvre un navigateur et tape la première adresse, par exemple `http://localhost:8765/?enligne=1`.

**Sur le téléphone (ou l'autre ordinateur), connecté au MÊME Wi-Fi :** tape la deuxième adresse, celle qui ressemble à `http://192.168.1.23:8765/?enligne=1` (les chiffres sont ceux de ton Terminal), dans le navigateur.

**Puis, sur les deux appareils :**

1. Appuie sur **🌐 En ligne**.
2. Sur le premier appareil : **Créer une salle**. Un code de 4 lettres s'affiche.
3. Sur l'autre : **Rejoindre**, tape le code, puis **Go**.
4. Le premier choisit la course (circuit, tours). L'autre appuie sur **Prêt**, puis le premier appuie sur **Lancer**.
5. À la fin de la course, le premier appuie sur **Résultats** puis sur le bouton qui revient à la salle : on peut refaire une course.

À côté de chaque nom, un petit **● 12 ms** dit si la connexion est bonne (vert, jusqu'à 80 ms), moyenne (orange, jusqu'à 200 ms) ou lente (rouge). Plus le nombre est petit, mieux c'est.

**Et si le Wi-Fi saute pendant la course ?** Pas de panique : le jeu essaie tout seul de se reconnecter, pendant une dizaine de secondes. Les autres joueurs voient « … a perdu la connexion : on l'attend… » et la course les attend. Quand le Wi-Fi revient, tu reprends **la même course, à la même place**. Si ça dure plus de 12 secondes, ta voiture s'arrête et tu retournes au début, comme quand on quitte.

**Pour arrêter :** dans le Terminal, appuie sur **Ctrl et C** en même temps. Fermer la fenêtre arrête aussi tout.

**Est-ce sans danger ?** Oui : rien n'est ouvert sur Internet. Le lanceur ne répond qu'aux appareils de **ta maison** (adresses `192.168.x.x`, `10.x.x.x`, `172.16` à `172.31`, ou ce Mac) ; tout autre est refusé. Il ne donne que les fichiers du jeu (pas les tests, ni les notes, ni ce dossier `serveur`). Une page d'un autre site ne peut pas non plus s'en servir. Rien n'est écrit sur le disque.

**Ça ne marche pas ?**
- Les deux appareils sont-ils sur le **même Wi-Fi** ? (Pas la 4G du téléphone.)
- L'adresse commence-t-elle par `http://` et finit-elle par `/?enligne=1` ? Le port (`:8765`) est-il là ?
- Le port est déjà pris ? Lance `python3 serveur/maison.py --port 8766` (et tape 8766 dans les adresses).
- Pour tester seul sur le Mac, sans téléphone : `python3 serveur/maison.py --cet-ordinateur` (alors seul le Mac peut jouer).
- Un Wi-Fi « invités » ou d'hôtel sépare souvent les appareils : cela ne marchera pas.

*Comment ça marche, pour les grands :* `serveur/maison.py` lance le relais de `relais.py` ET sert les fichiers du jeu sur un seul port (8765 par défaut). La page vient avec un repère (`<meta name="gpd-relais">`) : elle trouve le relais à sa propre adresse (`ws://` + l'adresse de la page), sans rien régler (`EN_LIGNE_MAISON`, `reseau.js` : `RESEAU.urlRelais()`). Options : `--port`, `--cet-ordinateur`, `--version`, `--tout-le-monde` (accepte aussi les adresses d'Internet : **à ne jamais faire** sur un Mac relié à Internet sans pare-feu, seulement pour des essais). Test : `python3 tests/maison.py` (deux pages, dont un téléphone émulé, par le vrai WebSocket ; lent : sous le verrou des tests).

# Le serveur relais des batailles en ligne

Un petit programme Python (`relais.py`, un seul fichier) qui fabrique des salles et fait suivre les messages entre les joueurs.
Il ne simule rien : chaque jeu calcule toute la course (lockstep), seules les commandes voyagent.
Rien n'est écrit sur le disque, rien n'est gardé quand la salle disparaît, aucune adresse n'est journalisée.
Rien n'est hébergé : c'est une décision du propriétaire (voir `rapports/en-ligne-poki-hebergement.md`).

## Lancer en local

```
pip install websockets          # version 13 ou plus ; Python 3.9 ou plus
python3 serveur/relais.py       # écoute sur ws://127.0.0.1:8765, cet ordinateur seulement
python3 serveur/relais.py --hote 0.0.0.0 --port 9000      # tout le réseau local (le relais seul, sans les fichiers du jeu ; pour jouer à la maison, voir plus haut : serveur/maison.py)
```

Options : `--version` (facultatif : impose la version que le créateur d'une salle doit annoncer ; sans cela, la version d'une salle est celle de son créateur et seuls les clients de la même version la rejoignent), `--noms-libres` (noms tapés librement,
interdit au public d'enfants), `--max-par-ip` (0 derrière un proxy), `--origines` (tour 59 : les pages permises, séparées par des virgules, par exemple `https://jeu.exemple` ; une page d'un autre site, ou un script sans en-tête Origin, est refusé en 403 ; sans cette option, toute page peut se connecter : à régler quand l'adresse publique du jeu est connue). Variables : `PORT`, `RELAIS_HOTE`, `RELAIS_VERSION`, `RELAIS_ORIGINES`.
Tous les autres réglages (taille, cadence, délais, nombre de joueurs) sont dans la classe `Config` du fichier.

Test : `python3 tests/serveur.py` (vrais clients websockets, une trentaine de secondes) ; il est aussi dans les annexes de `tests/lancer.py`.

## Le protocole (messages JSON, une trame texte chacun)

Client vers serveur :

| message | sens |
|---|---|
| `{t:'creer', nom, version}` | crée une salle, on en est l'hôte |
| `{t:'rejoindre', code, nom, version, jeton?, vu?, partis?}` | le code se tape en majuscules ou minuscules ; avec le `jeton` d'avant, dans les 20 s (`grace`) qui suivent une coupure avant le départ : même id, même rôle d'hôte. **Tour 61 : aussi en pleine course** (voir « La coupure en course ») : `vu` = `{id: le pas qui suit la dernière commande reçue de cet id}`, `partis` = les ids déjà vus partis |
| `{t:'charge', circuit}` | à chaque arrivée en salle (la page vient de charger ce circuit) ; la liste des joueurs le porte |
| `{t:'pret', pret:bool}` | |
| `{t:'reglages', reglages}` | hôte seul, avant le lancement : renvoyé à tous (hôte compris) et gardé pour qui rejoint ensuite |
| `{t:'lancer', reglages:{circuit, tours, meteo, nbIA}}` | hôte seul ; 2 joueurs au moins ; « prêt » est informatif (ne bloque pas) ; réglages : circuit (texte ≤ 40), tours 1 à 20, meteo (texte ≤ 20), nbIA 0 à 20, rien d'autre |
| `{t:'retour'}` | hôte seul, après le départ : renvoyé à tous, la salle redevient ouverte, les « prêt » repassent à faux (suivi d'un `joueurs`) |
| `{t:'cmd', n, c}` | commandes du pas `n` (ou d'un paquet de pas), relayées aux autres, jamais à l'expéditeur |
| `{t:'controle', n, h}` | empreinte de l'état au pas `n` (entier ou texte court) |
| `{t:'emote', i}` | indice d'une émote préréglée (0 à 7), 1 toutes les 0,5 s ; jamais de texte |
| `{t:'quitter'}` | quitte la salle, la connexion reste utilisable |
| `{t:'ping', h}` | |

Serveur vers client : `{t:'salle', code, toi, hote, jeton, nom}` (jeton aléatoire, à garder pour recharger la page), `{t:'refus', raison}` (`inconnue`, `pleine`, `commencee`, `version`, `nom`),
`{t:'joueurs', liste:[{id, nom, pret, hote, circuit?, absent?}]}`, `{t:'depart', reglages, graine, ordre:[ids]}` (graine entière de 32 bits tirée par le serveur ;
`ordre` = les ids mélangés par le serveur), `{t:'cmd', de, n, c}`, `{t:'controle', de, n, h}`, `{t:'emote', de, i}`, `{t:'parti', id}`,
`{t:'nouvel-hote', id}`, `{t:'pong', h}`, `{t:'reglages', reglages}`, `{t:'retour'}`.

Tour 61 (ajouts que l'ancien client ignore) : `{t:'qualite', id, ms}` (le ping de ce joueur mesuré par le relais, toutes les 2 s, à toute la salle), `{t:'coupe', id}` / `{t:'revenu', id}` (en course : un autre joueur a perdu sa connexion / est revenu), `{t:'reprise', fin}` (à qui revient en course : le prochain pas de commande que le relais attend de lui).

Un ajout du relais, hors du protocole du Chef (un client peut l'ignorer) : `{t:'erreur', raison}` quand un `lancer` est ignoré
(`hote` : pas l'hôte, `commencee`, `pas-commencee` pour un retour trop tôt, `reglages` : réglages faux, `seul`, `charge` : un joueur n'a pas annoncé le circuit des réglages, ou recharge encore).

## Les règles

- Code de salle : 4 lettres sans voyelle ni Y (donc aucun mot), tiré au hasard. 2 à 8 joueurs (`id` de 1 à 8 dans l'ordre d'arrivée, jamais réutilisé dans la salle).
- L'hôte est le premier ; s'il part, le suivant devient hôte (`parti` puis `nouvel-hote`, puis `joueurs` si la course n'a pas commencé).
  Une salle vide disparaît. Une salle commencée refuse les nouveaux (`commencee`) jusqu'au `retour` de l'hôte.
- Noms (décision D1 du Chef, mêmes règles que `reseau.js`) : le nom sur le fil ne dépend d'aucune langue : l'id d'une couleur de EN_LIGNE_COULEURS (`bleu`, `rouge`, `jaune`, `vert`, `orange`, `violet`, `turquoise`, `rose`), suivi de `-2` à `-8` si la couleur est déjà prise dans la salle ; chaque client affiche le nom traduit (« Pilote rouge » / « Red driver »). Tout autre nom : `refus nom`. Deux joueurs d'une salle ne portent pas le même nom. `--noms-libres` accepte lettres, chiffres, espaces, tirets.
- Version (D4) : `version` = `EN_LIGNE_VERSION + '-' + EN_LIGNE.version().h` (l'empreinte des réglages de course), par exemple `1-3735928559` ; une version mal formée est refusée à la création ; qui rejoint doit annoncer celle du créateur de la salle (`refus version`).
- Réglages (D3, les nombres du cœur : donnees.js) : 1 à 30 tours (`EN_LIGNE_TOURS_MAX`), 0 à 8 IA (`EN_LIGNE_IA_MAX`), humains + IA au plus 16 (`EN_LIGNE_VOITURES_MAX`), météo dans `auto sec pluie averse eclaircie` (`EN_LIGNE_METEOS`) ; sinon `{t:'erreur', raison:'reglages'}` (réglages ou lancer).
- Limites : 4096 octets par message (au-delà la connexion est coupée, code 1009) ; 150 messages par seconde et par client avec une réserve de 300
  (le surplus est jeté) ; 200 messages invalides (JSON faux, trame binaire, type inconnu, hors salle) et la connexion est coupée (1008) ;
  12 refus et coupé (1008) ; 10 s pour créer ou rejoindre une salle sinon coupé (1008) ; 24 connexions par adresse (1013) ; 500 salles ;
  un client trop lent (2000 messages en attente) est coupé (1013).
- Grâce (changer de circuit = recharger la page) : avant le départ, un joueur dont la connexion tombe reste 20 s dans la salle, marqué `absent: true`, sans `parti` ni nouvel hôte ; il revient avec son jeton (même id, même rôle, `circuit` absent jusqu'à son `charge`). Passé ce délai : `parti` (et `nouvel-hote` si c'était l'hôte). Après le départ, pas de grâce : `parti` tout de suite. `{t:'quitter'}` part sans grâce. Une salle dont tous les joueurs attendent leur retour disparaît à la fin de la grâce.
- **La coupure en course (tour 61, `grace_course`, 12 s)** : un joueur dont la connexion tombe EN PLEINE COURSE (le Wi-Fi) garde sa place : pas de `parti`, les autres reçoivent `coupe` (leur course attend ses commandes). Il revient avec son `jeton` (`rejoindre` avec `vu` et `partis`) : même id, même rôle ; si l'ancienne connexion n'est pas encore vue comme morte, la nouvelle la remplace (le jeton est secret). Le relais lui rejoue, dans l'ordre, les `cmd` des autres qu'il n'a pas reçues (et les `parti` qu'il n'a pas vus), puis envoie `reprise {fin}` ; le client renvoie alors ses propres commandes depuis `fin` (le cœur les garde : `partie.rejouer`) ; les autres reçoivent `revenu`. Passé 12 s : `parti` (la règle d'avant : voiture neutre). Pour cela le relais garde les commandes diffusées pendant la course (`journal`, 150 000 au plus, effacé au `retour` ; plein : plus de grâce en course, `parti` tout de suite). `grace_course` = 0 : comme avant le tour 61.
- Expiration : une salle en attente muette 30 minutes, ou commencée muette 2 heures, expire : ses joueurs sont coupés (1001).
- Les commandes ne sont relayées qu'après le départ ; les clients n'ont pas de droit sur les autres (le serveur remplit `de`).
- Garde-fous contre la triche simple (T9, D5) : `cmd` = `{n, c}` avec `c` un tableau de 1 à 128 entiers de 0 à 16383 (14 bits) et `n` un entier qui ne revient jamais en arrière (un paquet qui recouvre le précédent est jeté) ; personne ne peut avoir envoyé plus de 240 pas (2 s) au-delà du plus en retard des autres (le lockstep attend le plus lent) ; un joueur parti ne compte plus. `controle` = `{n, h}` avec `h` une chaîne de 64 signes au plus et `n` croissant. NaN et Infinity sont refusés. Un message jeté compte comme une faute (200 fautes : connexion coupée, 1008).
- Test du vrai réseau : `python3 tests/reseau-ws.py` lance ce relais et fait courir deux pages du jeu par WebSocket (lockstep réel, mêmes empreintes, désynchro vue).
