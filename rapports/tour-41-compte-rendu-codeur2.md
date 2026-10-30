# TOUR 41 — compte rendu du Codeur 2 : les aides au pilotage du joueur

Branche `codeur2`, commits 97c2c39 puis c4143bd (les tranches de ecrans.py rééquilibrées : la 1re dépassait 600 s ; la mesure des coûts sur 12 endroits du tour), main fusionné en 3bcb738. Passage GitHub 40972891523 : **vert, 16 travaux sur 16**.

## Ce qui est fait (`assistance.js`, réglages `ASSIST_*` dans `donnees.js`)

**Le principe.** Les aides ne corrigent que les cibles `{ gaz, frein, direction }` du joueur, avant `lisserCommandes`. Elles agissent dans trois endroits de principal.js : la course seule, la course à plusieurs (`conduireJoueur`, pour les deux joueurs à deux) et le tour de qualification. Le robot et les IA ne passent jamais par elles. **physique.js n'est pas modifié** : j'y appelle seulement `charge` et `vitesseVirage`, et `freinagePossible` dans ia.js, en lecture. Toutes coupées, la fonction rend l'objet des cibles tel quel.

**Un constat à te remonter : la physique ne bloque jamais les roues et ne fait jamais patiner.** Le frein donne toujours sa pleine force, et les gaz n'ôtent rien à l'adhérence latérale. Un anti-blocage qui plafonne le frein, seul, n'éviterait donc aucune faute ; il ferait seulement freiner moins. J'ai donc fait le **freinage assisté des jeux de F1** : la voiture freine d'elle-même quand elle arrive trop vite.

- **Freinage assisté.**
  - La vitesse sûre est calculée sur les 250 m devant : `vitesseVirage` de la physique, avec l'adhérence du moment (pluie, pneus), sur la plus serrée des deux courbures, celle du milieu de la piste ou celle de la trajectoire de la carte. Elle est prise à 90 %, avec le freinage possible à 75 %.
  - Si la voiture est trop rapide, le frein monte (à fond à 3 m/s de trop) et les gaz sont coupés. Le joueur peut toujours freiner plus.
  - **Avec un anti-blocage** : en braquant (plus de 30 % du volant), le frein reste juste sous le seuil du blocage du jeu (`SENSATIONS_BLOCAGE_FREIN`), donc sans fumée ni crissement.
- **Antipatinage.** En virage, dès que l'accélération latérale prend 85 % de l'adhérence, les gaz baissent ; ils sont nuls à 100 %.
- **Direction assistée** (débutant seulement). Un léger retour vers la trajectoire de la carte, visée 12 m devant : 0,08 de volant par mètre d'écart, 0,15 au plus.

**Quand elles sont allumées.**
- D'office : les trois en débutant (la course de découverte comprise), aucune en normal, expert et légende.
- Menu pause : une rangée « Freinage assisté / Antipatinage / Direction assistée : oui / non », sauvegardée (`option('aides_pilotage')`). La direction assistée n'est proposée qu'en débutant.
- Coupées au tournoi chrono, pour que ce soit le même tour pour tous.
- La carte des IA est déjà calculée en essai libre quand le niveau est débutant (tour 39) : la direction assistée l'a donc aussi.

## Ce que chaque aide fait au tour du robot (circuit test, 2e tour lancé ; « sous la pluie » = adhérence 0,7)

Trois pilotes d'essai :
- **bon** : le robot d'essai ;
- **pressé** : à fond dès qu'il ne freine pas ;
- **fou** : le robot réglé à 75 m/s partout. Il tourne, mais il ne freine jamais.

« Blocages » = les secondes avec la fumée de blocage (le blocage de sensations.js au-dessus de 0,5).

| Pilote | Aides | Sec : temps, herbe, chocs, blocages | Pluie : temps, herbe, chocs, blocages |
|---|---|---|---|
| bon | aucune | 62,35 s, 0, 0, 2,3 s | 68,42 s, 0, 0, 4,4 s |
| bon | freinage | 62,66 s, 0, 0, 0,8 s | 70,58 s, 0, 0, 0,9 s |
| bon | toutes | 62,73 s, 0, 0, 0,8 s | 70,66 s, 0, 0, 1,4 s |
| pressé | aucune | 60,83 s, 0, 0, 2,3 s | 66,73 s, 0, 0, 4,6 s |
| pressé | antipatinage | 60,89 s, 0, 0, 2,3 s | 66,81 s, 0, 0, 4,6 s |
| fou | aucune | 139 s, 92 s dans l'herbe, 10 028 contacts | pas fini (90 s dans l'herbe) |
| fou | toutes | **60,65 s, 0, 0, 1,3 s** | **68,74 s, 0, 0, 1,4 s** |

**Lecture.**
- Le freinage assisté fait d'un pilote qui ne freine jamais un pilote sans faute, au sec comme sous la pluie.
- Il ne le rend pas plus rapide que le meilleur tour de l'IA (test), et il ne rend jamais un bon pilote plus rapide. Il le ralentit de 0,3 s au sec et de 2,2 s sous la pluie, parce qu'il freine un peu tôt (c'est sa marge).
- L'anti-blocage ôte les deux tiers des blocages.
- **L'antipatinage ne change presque rien** dans cette physique : le robot pressé ne sort pas de toute façon, puisque les gaz ne font pas glisser. Je l'ai gardé (il ne coûte rien), mais il est surtout là pour la forme. Une vraie motricité dans physique.js serait une décision à toi, et elle changerait la course des IA.

## Tests

**tests/test.html** (moteur : 321 ✔, 0 ✘ sur le Mac) :
- les aides de départ par niveau et le choix sauvegardé ; toutes coupées, les cibles rendues telles quelles ;
- l'antipatinage (gaz < 0,2 à 99 % de l'adhérence, rien à 50 %, 0 au-delà) ;
- la direction assistée (dans le bon sens, plafonnée) ;
- **toutes coupées, la course au bit près** : 4 IA et un joueur conduit par le robot à travers les aides coupées, 20 s. Ni les IA ni la physique ne lisent les aides ;
- le tableau ci-dessus en garde-fou : le fou aidé finit sans sortie ni choc mais pas plus vite que l'IA, le bon aidé ne va pas plus vite et ne sort pas, et l'anti-blocage fait baisser les blocages.

**tests/ecrans.py**, course seule, un joueur qui ne freine jamais (le robot à 75 m/s posé dans `JEU.cibles`, 40 s simulées) :
- en débutant (1280), les trois aides sont allumées d'office ; la voiture freine d'elle-même (jusqu'à 1,00), 0 s dans l'herbe et 0 contact ; un clic coupe le freinage assisté (sauvegardé) ;
- en normal (960), les aides sont coupées, la direction n'est pas proposée, et ce joueur sort (3 s dans l'herbe, 156 contacts).

## Ce que je n'ai pas pu vérifier

**La sensation.** Le freinage qui tombe tout seul peut surprendre. `ASSIST_MARGE` (0,9) et `ASSIST_FREIN_PART` (0,75) le règlent, à essayer par le propriétaire.

**La place du menu pause.** Il a une rangée de plus. Le passage GitHub dira si le menu tient en 960×600 (le travail « recoins » le vérifie).

Réévalue.
