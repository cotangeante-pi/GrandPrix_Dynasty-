# Les batailles en ligne : comment tout s'emboîte (tour 56, T2)

Cœur du lockstep : `enligne.js` (calcul pur), réglages `EN_LIGNE_*` dans `donnees.js` (`EN_LIGNE` faux = le jeu d'avant). Protocole : voir `LISTE.txt` du tour 56 (messages JSON) ; ce rapport dit comment le client s'en sert.

## Le principe
Chaque client simule TOUTE la course (celle du mode 2 joueurs, `creerCourseIA` + `pasCourseIA`), même graine, même circuit, mêmes réglages : la physique est identique au bit près. Seules les commandes voyagent. Un pas n n'avance que si les commandes de tous pour ce pas sont là.

## Le cycle d'un pas (`partie.avancer`)
1. Pour chaque joueur de `ordre`, la commande du pas n : neutre si n < délai ; sinon celle reçue ; s'il est parti et n > son dernier pas : neutre ; sinon **on attend** (`partie.attente` = les ids qui manquent).
2. `pasCourseIA(e, PAS, conduire)` : `EN_LIGNE.conduire` fait ce que fait `conduireJoueur` de `principal.js` (départ parfait, remise en piste, rampes, pneus) mais sans la page : ni touches, ni aides au pilotage, ni choix des pneus à l'arrêt (à faire si on les veut).
3. La commande LOCALE (`partie.local`, que la page met à jour) est prise au pas n et agira au pas **n + délai** (`EN_LIGNE_DELAI`, 12 pas = 0,1 s) ; elle est quantifiée (gaz et frein 4 bits, direction 5 bits, remise 1 bit : 14 bits) et la voiture locale utilise la valeur quantifiée comme les autres.
4. Les commandes partent par paquets de `EN_LIGNE_PAQUET` (4) pas : `{t:'cmd', n:<premier pas>, c:[entiers]}`. Un paquet n'est jamais plus grand que le délai : sinon deux joueurs pourraient s'attendre l'un l'autre. Si la partie attend, ce qui est prêt part tout de suite.
5. Tous les `EN_LIGNE_CONTROLE` (120) pas : `{t:'controle', n, h}` ; h = empreinte (FNV-1a sur les bits de tous les champs des voitures, de la course) ; si une empreinte reçue diffère de la nôtre au même pas : `partie.desynchro = {n, de, miens, siens}` et la partie s'arrête (la page décide : message, retour à la salle).
6. Pas de blocage mutuel : au départ, les pas 0 à délai-1 sont neutres chez tous sans rien échanger ; les commandes du pas n sont produites au pas n - délai.

## Départ et sortie d'un joueur
- Le serveur envoie `depart {reglages, graine, ordre}` ; `EN_LIGNE.demarrer(depart, moi, envoyer, options)` construit la partie. `EN_LIGNE.reglagesValides` corrige les réglages de l'hôte de la même façon chez tous. L'hôte peut ajouter `reglages.delai` (le délai doit être le même chez tous ; sinon désynchro dès le début).
- `{t:'parti', id}` : le dernier pas du joueur = la plus grande commande reçue de lui ; ensuite ses commandes sont neutres (la voiture roule sur son erreur puis s'arrête). **Condition sur le serveur** : relayer les `cmd` d'un joueur dans l'ordre et envoyer `parti` après la dernière. T8 : remplacer ce neutre par une IA (déterministe : tirée de la graine) ou une voiture garée.
- La grille est tirée au sort (graine + `GRAINE_GRILLE_LIGNE`) : joueurs et IA mélangés ; `ordre[i]` conduit la voiture `nbIA + i`.

## Ce qui doit être déterministe (et ce qu'on a fait)
- **Math.random, Date, performance.now** : jamais dans la simulation (test : ils lèvent une erreur pendant une course en ligne). Le hasard passe par `ALEATOIRE` avec la graine du serveur.
- **Le niveau des IA** : `EN_LIGNE_NIVEAU` est imposé le temps de créer la course (le niveau de la carrière de chacun ne compte pas). À faire côté page : ne pas lancer `DIVISIONS.appliquer`, les aides, le garage, l'aileron, les réglages de voiture du joueur, la livrée de performance : tout ce qui change la physique d'UN client. Les humains en ligne ont la voiture neutre (`v.moteur = v.aero = 1`...).
- **La version** : `EN_LIGNE.version()` = `{v: EN_LIGNE_VERSION, h: empreinte de tous les réglages}` ; à envoyer dans `creer` / `rejoindre`, refuser si différente. Si le code change sans qu'un réglage change, monter `EN_LIGNE_VERSION`.
- **Les fonctions Math (le gros risque)** : la spécification n'impose pas le dernier bit de `sin`, `cos`, `tan`, `atan`, `atan2`, `exp`, `cbrt`, `hypot`, `pow`. Chrome (V8), Safari/iPhone (JavaScriptCore) et Firefox peuvent différer d'un bit : la course divergerait en quelques secondes. Déjà vu : `Math.pow` différait entre macOS et Linux (tour 22). Le code de la course utilise sin, cos, atan2, exp, tan, atan, cbrt, hypot. Remède prévu : `EN_LIGNE_MATHS` (remplacer ces fonctions par des calculs à nous pendant une course en ligne). L'empreinte de contrôle est le filet de sécurité.
- **L'onglet caché** : le navigateur coupe `requestAnimationFrame` ; la boucle ne tourne plus ; les autres attendent. T8 : en ligne, continuer à appeler `partie.avancer` depuis un minuteur (setInterval, ralenti à 1 s par le navigateur : donc rattraper plusieurs pas par appel, `avancer(max)`), et ne jamais mettre en pause.
- **La pub Poki** : jamais pendant une course en ligne ; avant, le son et le jeu s'arrêtent seulement hors course.
- **Les drapeaux** (`e.sansDrapeaux = true`) : drapeaux.js ne gère qu'un joueur ; coupés en ligne pour l'instant. **Les consignes d'équipe** : actives (calcul pur, lit les humains par `p.humain`).
- **Ce que la page peut lire sans risque** : tout ; ce qu'elle ne doit jamais faire : écrire dans `partie.e` hors de `avancer`.

## L'interface pour T7 (la page)
```
const partie = EN_LIGNE.demarrer(msgDepart, monId, msg => reseau.envoyer(msg), { carte, circuit? })
reseau.surMessage(m => partie.recevoir(m))          // cmd, controle, parti
à chaque pas de BOUCLE : partie.local = commandesDuJoueur(); partie.avancer(1)   // ou plus pour rattraper
partie.e (la course, à dessiner), partie.moi (mon pilote), partie.pilotes (Map id → pilote)
partie.attente (qui on attend), partie.desynchro, partie.finie()
```
`EN_LIGNE.banc(ids, options)` est un faux réseau en mémoire (latences réglables) pour les tests.

## Tests (`tests/test.html`, « en ligne : … »)
Codage ; réglages ; 2 joueurs sans délai = la référence sans réseau ; 4 joueurs à latences variables ; un lien coupé 90 ticks (on attend, puis tout reprend) ; désynchro provoquée (un bit) signalée des deux côtés au premier contrôle ; un joueur qui part ; aucun Math.random / Date ; messages du protocole et messages abîmés ignorés ; attente sans blocage.
