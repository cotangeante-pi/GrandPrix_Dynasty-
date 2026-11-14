# Le serveur relais des batailles en ligne

Un petit programme Python (`relais.py`, un seul fichier) qui fabrique des salles et fait suivre les messages entre les joueurs.
Il ne simule rien : chaque jeu calcule toute la course (lockstep), seules les commandes voyagent.
Rien n'est écrit sur le disque, rien n'est gardé quand la salle disparaît, aucune adresse n'est journalisée.
Rien n'est hébergé : c'est une décision du propriétaire (voir `rapports/en-ligne-poki-hebergement.md`).

## Lancer en local

```
pip install websockets          # version 13 ou plus ; Python 3.9 ou plus
python3 serveur/relais.py       # écoute sur ws://127.0.0.1:8765, cet ordinateur seulement
python3 serveur/relais.py --hote 0.0.0.0 --port 9000      # tout le réseau local (pour essayer avec un téléphone)
```

Options : `--version` (la version que les clients doivent annoncer, « 1 » par défaut), `--noms-libres` (noms tapés librement,
interdit au public d'enfants), `--max-par-ip` (0 derrière un proxy). Variables : `PORT`, `RELAIS_HOTE`, `RELAIS_VERSION`.
Tous les autres réglages (taille, cadence, délais, nombre de joueurs) sont dans la classe `Config` du fichier.

Test : `python3 tests/serveur.py` (vrais clients websockets, une trentaine de secondes) ; il est aussi dans les annexes de `tests/lancer.py`.

## Le protocole (messages JSON, une trame texte chacun)

Client vers serveur :

| message | sens |
|---|---|
| `{t:'creer', nom, version}` | crée une salle, on en est l'hôte |
| `{t:'rejoindre', code, nom, version, jeton?}` | le code se tape en majuscules ou minuscules ; avec le `jeton` d'avant, dans les 20 s (`grace`) qui suivent une coupure avant le départ : même id, même rôle d'hôte |
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

Serveur vers client : `{t:'salle', code, toi, hote, jeton}` (jeton aléatoire, à garder pour recharger la page), `{t:'refus', raison}` (`inconnue`, `pleine`, `commencee`, `version`, `nom`),
`{t:'joueurs', liste:[{id, nom, pret, hote, circuit, recharge}]}`, `{t:'depart', reglages, graine, ordre:[ids]}` (graine entière de 32 bits tirée par le serveur ;
`ordre` = les ids mélangés par le serveur), `{t:'cmd', de, n, c}`, `{t:'controle', de, n, h}`, `{t:'emote', de, i}`, `{t:'parti', id}`,
`{t:'nouvel-hote', id}`, `{t:'pong', h}`, `{t:'reglages', reglages}`, `{t:'retour'}`.

Un ajout du relais, hors du protocole du Chef (un client peut l'ignorer) : `{t:'erreur', raison}` quand un `lancer` est ignoré
(`hote` : pas l'hôte, `commencee`, `pas-commencee` pour un retour trop tôt, `reglages` : réglages faux, `seul`, `charge` : un joueur n'a pas annoncé le circuit des réglages, ou recharge encore).

## Les règles

- Code de salle : 4 lettres sans voyelle ni Y (donc aucun mot), tiré au hasard. 2 à 8 joueurs (`id` de 1 à 8 dans l'ordre d'arrivée, jamais réutilisé dans la salle).
- L'hôte est le premier ; s'il part, le suivant devient hôte (`parti` puis `nouvel-hote`, puis `joueurs` si la course n'a pas commencé).
  Une salle vide disparaît. Une salle commencée refuse les nouveaux (`commencee`) jusqu'au `retour` de l'hôte.
- Noms (mêmes règles que `reseau.js`, mêmes listes que `donnees.js`) : un nom de EN_LIGNE_NOMS ou « Pilote N » (1 à 99), suivi au plus d'une couleur de EN_LIGNE_COULEURS, 20 signes au plus, espaces autour retirés ; sinon `refus nom`. Deux joueurs d'une salle ne portent pas le même nom (sans tenir compte des majuscules). `--noms-libres` accepte lettres, chiffres, espaces, tirets.
- Limites : 4096 octets par message (au-delà la connexion est coupée, code 1009) ; 150 messages par seconde et par client avec une réserve de 300
  (le surplus est jeté) ; 200 messages invalides (JSON faux, trame binaire, type inconnu, hors salle) et la connexion est coupée (1008) ;
  12 refus et coupé (1008) ; 10 s pour créer ou rejoindre une salle sinon coupé (1008) ; 24 connexions par adresse (1013) ; 500 salles ;
  un client trop lent (2000 messages en attente) est coupé (1013).
- Grâce (changer de circuit = recharger la page) : avant le départ, un joueur dont la connexion tombe reste 20 s dans la salle, marqué `recharge: true`, sans `parti` ni nouvel hôte ; il revient avec son jeton (même id, même rôle, `circuit` à `null` jusqu'à son `charge`). Passé ce délai : `parti` (et `nouvel-hote` si c'était l'hôte). Après le départ, pas de grâce : `parti` tout de suite. `{t:'quitter'}` part sans grâce. Une salle dont tous les joueurs attendent leur retour disparaît à la fin de la grâce.
- Expiration : une salle en attente muette 30 minutes, ou commencée muette 2 heures, expire : ses joueurs sont coupés (1001).
- Les commandes ne sont relayées qu'après le départ ; les clients n'ont pas de droit sur les autres (le serveur remplit `de`).
  Les garde-fous contre la triche simple (commandes hors limites, pas en avance) viennent avec T9.
