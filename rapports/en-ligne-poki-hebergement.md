# Les batailles en ligne : ce que Poki permet, où héberger le relais, ce que ça coûte

Tour 56, T6 (Codeur 4, 2026-11-13). Rapport sans code : le propriétaire décide. Toutes les pages citées ont été lues le 2026-11-13 ; les chiffres de prix changent souvent, **à revérifier le jour de la commande**. Ce qui est une estimation de ma part (pas dans une source) est marqué « estimation ».

## 1. Ce que Poki permet

### Les règles qui comptent pour nous

| Sujet | Ce que dit Poki | Conséquence pour le jeu |
|---|---|---|
| Serveur externe | « Poki bloque toutes les requêtes externes par défaut » ; un jeu multijoueur sur un serveur hébergé ailleurs est « acceptable une fois approuvé par Poki ». Il faut demander l'adresse dans Poki for Developers (réglages CSP : les liens exacts et leur usage) et fournir une politique de confidentialité publique, liée dans le jeu, qui explique comment le service traite les données des joueurs ([external resources](https://developers.poki.com/guide/external-resources-policy)). | Le relais WebSocket doit être **approuvé** avant l'envoi du jeu. Sans approbation, le jeu en ligne ne marche pas sur Poki (il marche sur le dépôt). Il faut une page de confidentialité (hébergée, pas un Google Doc : [requirements](https://developers.poki.com/guide/requirements-quality)). |
| Chat | « Les systèmes de chat dans le jeu ne sont pas autorisés » ; la page recommande **un système d'émojis** pour l'expression des joueurs ([external resources](https://developers.poki.com/guide/external-resources-policy)). Une API de chat existe, mais « seulement pour les intégrations de chat approuvées par Poki » ([chat](https://developers.poki.com/guide/chat)). | Notre choix (émotes préréglées, **jamais de texte libre**) colle exactement à la recommandation. Pas de chat, pas de modération à faire. |
| Pseudos | Pour les jeux multijoueurs avec saisie de pseudo : filtrage strict des gros mots avec leur liste, à compléter ([requirements](https://developers.poki.com/guide/requirements-quality)). | `EN_LIGNE_NOMS_LIBRES` faux : nom tiré d'une liste ou « Pilote N » + couleur. Aucun filtre à maintenir, et aucun risque. |
| Liens et publicités | Les liens externes passent par `PokiSDK.openExternalLink` ; pas de lien sortant ([requirements](https://developers.poki.com/guide/requirements-quality)). Les pubs (`commercialBreak`) sont gérées par `sdk.js`. | Aucun lien « inviter un ami par adresse » : le code de salle de 4 lettres se dicte. Jamais de pub pendant une course en ligne (T8). |
| Public d'enfants | Poki dit travailler avec des jeux « sûrs et inclusifs » ([quality guidelines](https://sdk.poki.com/poki-quality-guidelines)) ; je n'ai pas pu lire la page « sécurité des joueurs » elle-même (hors de ma lecture) : **à lire par le propriétaire ou à demander au support Poki**. | Aucun texte libre, aucun nom libre, aucune adresse échangée entre joueurs. |
| Bibliothèque Poki | Netlib : bibliothèque pair à pair (WebRTC) de Poki, avec salons, reconnexion, relais TURN de secours ; signalisation et STUN/TURN hébergés **gratuitement** par Poki, ou auto-hébergés ([GitHub poki/netlib](https://github.com/poki/netlib)). | Possibilité de ne pas héberger de serveur du tout (voir option C). |
| Accès | Poki for Developers est décrit comme en bêta fermée / accès limité ([Poki for Developers](https://developers.poki.com/guide/game-dev-tools)). | La demande d'approbation passe par un compte Poki : à vérifier que le propriétaire y a accès. |

### Ce que je n'ai pas pu confirmer

- Si Poki **accepte vraiment** un relais sur un petit hébergement : la page dit « fine once approved » mais ne donne pas de critères (latence, pays, fournisseur). Seule la demande le dira.
- La page « Poki Guardian » (modération du chat, déployée à quelques jeux) : introuvable dans les pages lues ; sans objet pour nous tant qu'il n'y a pas de chat.
- Le nombre maximal de joueurs de Netlib : non indiqué.

## 2. Ce que le jeu envoie (pour dimensionner)

Le protocole fixé par le Chef est un **relais lockstep** : le serveur ne calcule rien, il recopie les commandes. Chaque joueur envoie un paquet de commandes (`cmd`) ; il le reçoit des autres.

Estimation (pas une mesure) : 30 paquets par seconde et par joueur (un paquet tous les 4 pas de physique), environ 60 octets chacun, soit 2 Ko/s par joueur.

| Salle | Messages reçus par le serveur | Messages envoyés par le serveur | Débit sortant |
|---|---|---|---|
| 2 joueurs | 60 /s | 60 /s | environ 4 Ko/s |
| 8 joueurs | 240 /s | 1 680 /s | environ 100 Ko/s (0,8 Mbit/s) |

Une course de 5 minutes à 8 joueurs : environ 30 Mo sortants. Mille courses de ce genre par mois : environ 30 Go. Aucun hébergeur ci-dessous ne s'en inquiète : la limite est le nombre de connexions et le processeur, pas le débit.

Latence (estimation) : un aller-retour Europe – Amérique du Nord fait de l'ordre de 80 à 120 ms. Le lockstep attend les commandes de tous : le délai d'entrée `EN_LIGNE_DELAI` devra couvrir le pire joueur de la salle (100 ms = 12 pas à 120 pas/s). Une salle avec un Européen et un Américain reste jouable, un peu mollement ; un relais placé au milieu (côte est des États-Unis ou un point d'accès mondial) aide peu : le plus lent compte.

## 3. Où héberger le relais : trois options

### A. Le relais Python de T3 sur un petit serveur (VPS)

- **Quoi** : `serveur/relais.py` tel quel, sur un serveur virtuel Linux à quelques euros par mois, derrière un proxy qui fait du TLS (le jeu est servi en https, donc `wss://` obligatoire).
- **Prix** : Hetzner Cloud, la plus petite offre CX23 : environ **5,49 € par mois hors TVA** depuis le 15 juin 2026 (3,99 € avant), sources contradictoires sur la disponibilité et sur les emplacements aux États-Unis et à Singapour, plus chers ([Northflank](https://northflank.com/blog/hetzner-cloud-server-price-increases), [Hetzner price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)). Fly.io : une petite machine (1 cœur partagé, 256 Mo) à environ **2,19 $ par mois**, plus l'adresse IP ; plus d'offre gratuite pour les nouveaux comptes ([Fly.io pricing](https://fly.io/docs/pricing/)). Oracle Cloud « Always Free » : 4 cœurs ARM et 24 Go gratuits, 10 To de sortie par mois ([Oracle](https://docs.oracle.com/iaas/Content/FreeTier/resourceref.htm)) ; **une source annonce une baisse à 2 cœurs / 12 Go en juin 2026, non confirmée** ([selfhost](https://fullmetalbrackets.com/blog/oci-free-tier-breakdown)) ; il faut une carte bancaire et être majeur, et le compte peut être fermé si l'offre est dépassée.
- **Pour** : aucun code à réécrire, on voit les journaux, un seul endroit à surveiller.
- **Contre** : un seul pays (la latence de l'autre continent est celle du paragraphe 2), il faut mettre à jour et surveiller le serveur, une panne = plus de jeu en ligne. Il faut aussi un nom de domaine (quelques euros par an) pour le certificat TLS (estimation).
- **Coût mensuel** : 2 à 6 € (ou 0 € chez Oracle).

### B. Cloudflare Workers + Durable Objects (un relais sans serveur)

- **Quoi** : réécrire le relais (petit : le relais JS de `reseau.js` fait environ 150 lignes de règles) en JavaScript pour Cloudflare : chaque salle est un « Durable Object » qui tient les WebSockets. Les joueurs sont reliés au point d'accès le plus proche, et la salle vit à un endroit du monde, près de son premier joueur.
- **Prix** (plan gratuit, SQLite) : 100 000 requêtes par jour, 13 000 Go-secondes par jour ; **les messages WebSocket reçus comptent pour une requête sur 20** ; au-delà, les opérations échouent jusqu'à minuit UTC (pas de facture surprise) ([Cloudflare, tarifs](https://developers.cloudflare.com/durable-objects/platform/pricing)). Une salle de 8 joueurs envoie 240 messages par seconde : 12 requêtes par seconde facturées, soit environ 3 600 pour une course de 5 minutes : **une trentaine de courses à 8 par jour gratuites, une centaine à 2 joueurs** (estimation d'après les tarifs). Au plan payant : 1 million de requêtes par mois incluses, puis 0,15 $ le million (même page ; le forfait de base du plan payant, que je crois être de 5 $ par mois, n'est pas dans la page lue : à vérifier). Limite douce : 1 000 requêtes par seconde par salle, très au-dessus de nos 240 ([limites](https://developers.cloudflare.com/durable-objects/platform/limits)).
- **Pour** : rien à administrer ni à mettre à jour, TLS compris, des points d'accès dans le monde entier, un coût qui suit l'usage.
- **Contre** : il faut **réécrire le relais** (T3 l'a écrit en Python : les deux versions devraient rester identiques ; les tests de `reseau.js` sont déjà là pour le relais JS), dépendance à un fournisseur ; il faudra vérifier que Poki accepte ce domaine.
- **Coût mensuel** : 0 € au début, quelques dollars si le jeu a du succès.

### C. Netlib, la bibliothèque pair à pair de Poki (pas de serveur à nous)

- **Quoi** : les joueurs se connectent directement par WebRTC ; Poki fournit le serveur de rencontre et les relais de secours gratuitement ([netlib](https://github.com/poki/netlib)).
- **Pour** : 0 € et rien à héberger ; l'outil est celui de Poki, donc probablement le plus facile à faire approuver.
- **Contre** : il faut remplacer le transport de `reseau.js` (bien contenu : une seule interface, trois transports, un quatrième à écrire) et abandonner la salle « arbitre » : plus de graine tirée par un serveur (l'hôte la tirerait), plus de limites de cadence faites par le relais, plus de refus propres de noms, donc **la triche est plus facile** (un joueur peut envoyer ce qu'il veut aux autres, sans filtre) ; les adresses réseau des joueurs sont visibles entre eux (WebRTC), ce qui est une question de vie privée pour un public d'enfants. Netlib n'annonce pas de nombre maximal de joueurs ni de verrou de départ.
- **Coût mensuel** : 0 €.

## 4. Recommandation

1. **Garder le protocole actuel** (relais qui recopie les commandes, graine tirée par le relais) : il garde la triche et la vie privée sous contrôle, et une salle n'a que des noms de liste.
2. **Commencer par l'option A** (relais Python de T3 sur un petit serveur européen, 2 à 6 € par mois) : c'est ce qui est déjà écrit et testé, et ça sert à demander l'approbation de l'adresse à Poki. Mettre un nom de domaine et un certificat.
3. **Prévoir l'option B** si Poki accepte les connexions mais que la latence entre continents pose problème : le relais est assez petit pour être porté sur Cloudflare sans toucher au jeu (même protocole, mêmes tests).
4. **Écarter l'option C** pour un public d'enfants, sauf si Poki la demande : moins de contrôle, adresses visibles.
5. **Avant tout achat** : demander à Poki (support, ou le réglage CSP de Poki for Developers) si un relais à une adresse précise est acceptable, quelles conditions de latence ou de pays, et leur page de sécurité des joueurs. Ce sont les deux seules vraies inconnues.

## 5. Ce qu'il reste à décider par le propriétaire

- Quel hébergement (A pour commencer, selon moi) et qui paie (2 à 6 € par mois, une carte bancaire).
- Le nom de domaine du relais, et une **page de confidentialité** publique (ce que le relais garde : un code de salle, un nom de liste, des commandes de conduite ; rien d'autre ; rien de gardé après la course).
- Quand ouvrir `EN_LIGNE` (aujourd'hui faux, ouvrable par `?enligne=1`) et quand demander l'approbation à Poki (le jeu est prévu pour Poki en 2027).
