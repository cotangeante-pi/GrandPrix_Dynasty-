# Grand Prix Dynasty — un championnat de Formule 1 pour Poki

Un jeu de Formule 1 en 3D pour navigateur, publié sur Poki, **sur ordinateur seulement**.
Il part de l'idée de *Super Star Car* (Poki, Barnzmu) : on conduit une F1, on gagne de l'argent, on améliore son équipe.
Ce qu'on ajoute, c'est **un vrai championnat** : des saisons de 12 Grands Prix, toujours les mêmes rivaux, des points, des podiums, des écuries et des sponsors qui changent d'une saison à l'autre.

**On reprend l'idée, pas le jeu.** Aucun code, image, son, modèle 3D, nom ni texte de *Super Star Car*. Pas de vraies écuries, de vrais pilotes ni de vraies marques de F1 non plus : tout est inventé.

## Le nom

**Grand Prix Dynasty** (approuvé par le propriétaire le 2026-10-18). Le même nom en anglais et en français.
- « Grand Prix » fait penser à la F1 sans utiliser de marque : **jamais « F1 » ni « Formula 1 » dans le nom**, le titre ou les textes de présentation.
- « Dynasty » : la carrière de 15 saisons, le palmarès, la légende.
- Il est dans le fichier de traduction (une seule clé), dans le `<title>` et sur l'écran d'accueil ; nulle part ailleurs en dur.

## Le jeu en une phrase

« Je suis pilote dans une écurie, je dispute une saison de 12 Grands Prix contre 19 rivaux qui ont chacun un nom et un caractère, et chaque place compte pour le titre. »

## La course

- **Trois longueurs**, à choisir avant chaque Grand Prix : **très courte (5 tours)**, **moyenne (12 tours)**, **longue (18 tours)**. Les points ne changent pas selon la longueur.
- **20 voitures sur la grille** : 10 écuries de 2 pilotes, le joueur compris. Si les mesures montrent que 20 voitures, c'est trop lourd (voir « Performance »), on descend à 16. Jamais moins de 10.
- **Les qualifications** : un seul tour chronométré, qu'on peut passer. Si on le passe, on part dernier. Les IA ont un temps de qualification calculé à partir de leur rythme, sans qu'on simule leur tour.
- **Le départ** : cinq feux rouges qui s'allument puis s'éteignent. Partir trop tôt, c'est une pénalité de 5 secondes.
- **Les règles de course sont volontairement simples**, pour ne pas avoir besoin d'un long tutoriel :
  - usure des pneus simple : une seule jauge, la voiture perd un peu d'adhérence quand elle s'use ;
  - **un arrêt au stand obligatoire** en course moyenne et longue, aucun en très courte. C'est là que les améliorations des changeurs de roues comptent ;
  - couper un virage, c'est une pénalité de temps qui s'affiche à l'écran ;
  - Espace remet la voiture sur la piste, avec quelques secondes de perte ;
  - **ni météo, ni dégâts, ni drapeaux au début**. Ces règles pourront venir plus tard, chacune comme une étape à part, seulement si le propriétaire le décide.
- **La conduite** : flèches ou WASD/ZQSD, Espace pour revenir sur la piste, C pour la caméra (derrière la voiture, cockpit, télé), Échap pour la pause.
- **La physique est arcade mais crédible** : freinage, adhérence, aspiration derrière une voiture. Elle est écrite par nous, sans moteur physique externe. **Le joueur et les IA ont exactement la même physique.**

## La carrière du joueur

- **Le début** : le joueur choisit **son nom, son numéro et son pays**. Il commence dans **une petite écurie faible** : sa voiture est parmi les moins bonnes de la grille, et il monte grâce aux contrats.
- **Les changements d'écurie** : les **améliorations de l'équipe** (changeurs de roues, etc.) **suivent le joueur**. La **qualité de la F1** appartient à l'écurie : le joueur prend celle de sa nouvelle écurie.
- **La fin** : la carrière s'arrête de deux façons :
  - **la retraite anticipée** : le joueur la prend quand il veut, entre deux saisons ;
  - **la retraite par l'âge** : au bout de **15 saisons**, le pilote est trop vieux. Ce nombre est un réglage dans `donnees.js`.

  Dans les deux cas, on passe au bilan de carrière (étape 14), puis on peut en recommencer une.

## Le championnat et les saisons

- **Une saison = 12 Grands Prix.** Ce nombre est un réglage dans le fichier de données, pour pouvoir le changer facilement.
- **Les points** : 25, 18, 15, 12, 10, 8, 6, 4, 2 et 1 pour les dix premiers. Il y a un classement des pilotes et un classement des écuries.
- **Le podium** : après chaque course, les trois premiers montent sur le podium en 3D. À la fin de la saison, le champion a droit à une vraie cérémonie.
- **Les rivaux sont toujours les mêmes.** Les 19 pilotes IA sont **un groupe fixe, sauvegardé**. Chaque pilote revient à chaque course de la saison avec son nom, son numéro, sa nationalité inventée, son écurie, son caractère, ses points et son historique (victoires, podiums, titres, et ses duels contre le joueur).
- **On reste toujours en Formule 1.** Entre deux saisons :
  - **les écuries** proposent des contrats au joueur selon ses résultats, et il peut changer d'écurie ;
  - **les sponsors** proposent des objectifs (par exemple « finir dans les 5 premiers à Monoco ») qui rapportent de l'argent ;
  - **les rivaux évoluent** : les jeunes progressent, les anciens baissent puis prennent leur retraite, de nouveaux pilotes arrivent, et certains changent d'écurie ;
  - **les écuries montent ou baissent** en performance selon leur saison.
- **Les circuits** ressemblent à de vrais circuits célèbres, mais ce ne sont **pas des copies exactes**, et leurs noms sont un peu changés. Par exemple, **Monoco Grand Prix**. Voici les 12 propositions, à approuver par le propriétaire :
  Monoco (Monaco), Silverstoun (Silverstone), Monzo (Monza), Spaa (Spa), Suzuko (Suzuka), Interlagas (Interlagos), Montréol (Montréal), Melbourn Park (Melbourne), Barcelana (Barcelone), Bahrayn (Bahreïn), Singapura (Singapour, de nuit), Yas Marino (Abou Dabi).

## L'argent et les améliorations

- Chaque course rapporte de l'argent : selon la place, le meilleur tour, les objectifs de sponsors et les places gagnées.
- L'argent sert à améliorer **l'équipe**, par exemple :
  - **les changeurs de roues** : l'arrêt au stand est plus court ;
  - **la qualité de la F1** : vitesse, adhérence et freins, avec **un maximum de +7 % au total**.
  La liste exacte sera décidée avec le propriétaire.
- **La règle d'or : c'est le pilotage qui fait gagner.** Les améliorations aident un peu, elles ne gagnent pas la course à la place du joueur. Elles ont toutes un plafond, et ces plafonds sont dans le fichier de données.

## Les IA des adversaires (la plus grosse étape)

- Elles conduisent **avec la même physique et les mêmes règles que le joueur**. Elles suivent une trajectoire idéale propre à chaque circuit, freinent, dépassent, défendent leur place et s'arrêtent au stand.
- **Chaque pilote a son caractère**, avec des réglages chiffrés dans le fichier de données :
  - le rythme (sa vitesse pure) ;
  - la régularité ;
  - l'agressivité en attaque ;
  - la défense ;
  - le taux d'erreurs (blocage de roues, tout droit dans un virage, petite sortie de piste) ;
  - la gestion des pneus ;
  - le niveau en qualifications.

  On doit **sentir la différence** : le rapide qui fait des fautes, le régulier, le dur à doubler.
- **Plusieurs niveaux de difficulté** pour tout le jeu : débutant, normal, expert et légende. Le niveau change tous les caractères ensemble, mais garde les différences entre pilotes.
- **Les IA ne trichent pas** : aucune voiture n'accélère toute seule pour rattraper le joueur, et aucun pilote IA ne voit plus que ce qu'un pilote verrait.
- **Pas de voitures fantômes** : les IA s'évitent, et une IA évite le joueur. Elles ne passent pas à travers les autres voitures.
- Les IA sont **testées sans écran** : on simule des courses entre IA seulement, avec une graine fixe, et on vérifie que les meilleurs pilotes gagnent plus souvent, sans gagner toujours.

## L'interface

Le but : une interface qui a l'air d'une **vraie retransmission de F1**, claire et animée, jamais encombrée.

- **En course** :
  - la tour de classement avec les écarts (au leader ou au pilote devant), qui monte et descend en direct ;
  - le tour actuel sur le total ;
  - le chrono du tour, le meilleur tour et les temps de secteur en couleurs ;
  - une minicarte avec toutes les voitures ;
  - la vitesse et le rapport ;
  - l'état des pneus ;
  - les messages de course (« Rossi : meilleur tour », « pénalité 5 s »).
- **Le départ** : les feux, et la grille vue d'en haut avant le départ.
- **Après la course** : le podium en 3D, puis les résultats animés avec les points gagnés, les places gagnées ou perdues, et l'argent gagné.
- **Entre les courses** :
  - le paddock (le menu principal) ;
  - le calendrier de la saison ;
  - les classements pilotes et écuries ;
  - la **fiche de chaque rival** (photo stylisée, caractère, saison, historique, duels contre le joueur) ;
  - le garage pour les améliorations ;
  - les sponsors, et les contrats en fin de saison.
- L'interface est en HTML et CSS, par-dessus la 3D. Elle a son propre style (police, couleurs, animations), défini une seule fois dans des variables CSS.

## Le monde 3D

**Les circuits doivent être extrêmement détaillés** : tribunes avec du public, stands, bâtiments, arbres, panneaux, vibreurs, barrières, ciel et lumière propres à chaque lieu. Monoco doit avoir des rues, un port et des bateaux, et Singapura est de nuit avec des projecteurs. C'est une **grosse étape**, faite circuit par circuit.

Pour que ce soit beau **et** léger :
- les décors sont faits par le code (de la géométrie générée, des objets répétés en *instancing*), plutôt qu'avec de gros fichiers de modèles ;
- les objets lointains sont plus simples (niveaux de détail), et ceux qu'on ne voit pas ne sont pas dessinés ;
- les textures sont peu nombreuses et petites ; on préfère les couleurs et les formes ;
- les voitures sont toutes faites sur le même modèle, avec les couleurs de chaque écurie.

## La technique

- **JavaScript pur + Three.js** (`lib/three.min.js` en local, **version fixée : r152, build UMD**, copiée de `../jeu poki/lib/`, avec l'avertissement de dépréciation déjà retiré pour garder la console vide), comme `../jeu poki`. Pas de build, pas de framework. Ouvrir `index.html` suffit pour jouer.
- La physique et les IA sont faites par nous. Pas de moteur physique externe.
- **Unité : 1 = 1 mètre**, les angles en radians. Le sol est le plan x, z ; y monte. Sur la piste, `d > 0` veut dire à droite du pilote.
- **Le moteur ne touche pas à l'écran.** Les règles, la physique, les IA, le championnat et l'argent marchent sans 3D, pour être testés seuls.
- Le hasard passe par une seule fonction qui peut prendre une graine, pour rejouer exactement une course pendant les tests.
- La sauvegarde (saison, rivaux, argent, améliorations, réglages) passe par **un seul module**. Elle a un numéro de version, pour pouvoir transformer les anciennes sauvegardes quand le jeu change. On sauvegarde **après chaque course**.
- Il y aura plus de fichiers que dans `../jeu poki`. La liste est notée ici au fur et à mesure :
  - `index.html`, `style.css` : la page (plein cadre, sans défilement) ;
  - `donnees.js` : tous les réglages (`REGLAGES`) ;
  - `aleatoire.js` : le seul hasard, `hasard()`, avec une graine par `ALEATOIRE.semer(n)` ;
  - `boucle.js` : la boucle (`BOUCLE`), physique à 120 pas par seconde, et `BOUCLE.simuler(secondes)` sans affichage ;
  - `circuits.js` : les circuits en calcul pur, sans Three.js : la spline (Catmull-Rom centripète), les échantillons tous les 2 m, et `positionSurPiste(circuit, x, z, indiceDepart)` ; les points de chaque circuit sont dans `CIRCUITS` (`donnees.js`) ; deux circuits d'essai pour l'instant : `test` (le premier, beaucoup de lignes droites) et `technique` (épingle, S, courbe rapide, longue droite, pour entraîner les IA) ;
  - `scene3d.js` : l'affichage Three.js (`SCENE3D`), qui lit l'état sans le changer ;
  - `physique.js` : la physique des voitures en calcul pur (modèle « vélo », herbe, barrières) ; le joueur et les IA utilisent le même code ;
  - `robot.js` : le robot d'essai (suit la ligne du milieu) ; ce n'est pas l'IA ;
  - `ia.js` : l'IA des adversaires en calcul pur : la trajectoire idéale et la vitesse conseillée, calculées une fois par circuit (`etapesTrajectoire`, découpé en tranches pour ne pas bloquer la page), puis `piloteIA(v, circuit, trajectoire, devant)` qui ne sort que `{ gaz, frein, direction }` ;
  - `course.js` : une course seule en calcul pur : compte à rebours, chrono, tours (secteurs 1 → 2 → 3 puis la ligne), secteurs, meilleur tour, virage coupé (+5 s, tour ✂) ;
  - `sauvegarde.js` : la seule sauvegarde (localStorage, une clé, un numéro de version, en try/catch) ; pour l'instant, les records, séparés par circuit et par longueur ;
  - `interface.js` : les écrans (choix de la longueur, pause, fin) et l'affichage de course (tour, chrono, secteurs en couleurs) ;
  - `boite.js` : les 8 rapports et le régime, tirés de la vitesse, pour l'affichage et le son seulement (la physique ne les lit pas) ;
  - `son.js` : le son synthétisé en Web Audio (moteur, pneus, chocs), rien avant le premier geste, M et 🔊 pour couper ;
  - `reglages.js` : `?reglages=1`, le panneau de curseurs du pilote d'essai, avec « copier » pour `donnees.js` ;
  - `voiture3d.js` : la F1 en 3D, faite par le code, avec la couleur de son écurie ;
  - `textes.js` : tous les textes, en anglais et en français (`texte(cle)`) ;
  - `camera.js` : les caméras de course (`derriere` par défaut, `cockpit`, `tele` ; touche C) et de survol (`?camera=auto`, `libre`, `dessus`, `virage`, `vitrine`) ;
  - `principal.js` : le démarrage, qui branche la physique et l'affichage sur la boucle, et enchaîne les écrans ; `?course=5|12|18|0` lance une course tout de suite, `?robot=1` fait conduire le robot ; `?ia=1` fait conduire l'IA ; `?circuit=test|technique` choisit le circuit (par défaut : test) ; `?debug=1` affiche les images par seconde, les triangles et les appels de dessin, la dérive, les g latéraux, et ce que coûte une voiture ;
  - `tests/lancer.py` : tous les tests (`tests/test.html` pour le moteur, `tests/ecrans.py` pour la vraie page avec Playwright, captures dans `tests/captures/`).

**Performance** : 60 images par seconde visées sur un ordinateur moyen, avec 20 voitures et un circuit détaillé. Le chargement doit être court. On mesure les images par seconde et le poids du jeu à chaque étape, et on note les mesures dans `SUIVI.md`.

## Règles de code

- **Tout en français** : variables, fonctions, fichiers, commentaires, commits (`moteur.js`, `donnees.js`, `pilotes.js`…).
- Un fichier = un rôle.
- **Tous les réglages sont dans les fichiers de données** : points, nombre de courses, caractères des pilotes, prix et plafonds des améliorations, circuits. Aucun réglage n'est un chiffre perdu dans le code.
- Chaque règle importante a un test : les points, le classement, les pénalités, les plafonds, la sauvegarde, et les IA en course simulée. Les tests passent avant de dire qu'une chose est finie.
- Les textes du jeu sont en anglais par défaut et en français si le navigateur est en français. Toutes les chaînes sont dans un seul fichier de traduction.

## Règles Poki

- Le jeu est déclaré **ordinateur seulement**. Il doit marcher en 960×600 et en 1280×720, sans défilement.
- Le script du SDK est dans `index.html`. Tous les appels passent par `sdk.js`, et le jeu marche aussi sans le SDK.
- `gameLoadingFinished` est appelé une seule fois.
- `gameplayStart` quand la voiture roule (qualifications et course). `gameplayStop` en pause, dans les menus, au podium et dans le paddock. Jamais deux fois de suite le même.
- `commercialBreak` seulement entre deux Grands Prix, jamais pendant une course.
- `rewardedBreak` seulement quand le joueur clique sur un bouton 📺 qui dit ce qu'il gagne (par exemple « argent doublé pour cette course »).
- Pendant une pub : `gameplayStop` d'abord, le son coupé, aucun clic qui passe, puis le jeu reprend là où il était.
- Un jeu, pas une page : les flèches, Espace et la molette ne font rien défiler. Pas de menu contextuel, pas de sélection de texte, pas de lien externe. Aucun son avant le premier geste. Le son est coupé quand l'onglet est caché, et il y a un bouton 🔊.
- La console reste vide (ni erreur, ni avertissement).
- Pour l'envoi : un zip avec `index.html` à la racine et seulement les fichiers du jeu, testé sur **inspector.poki.dev**.

## Comment on travaille : deux Claude, le Chef et le Codeur

Le jeu est fait par **deux sessions Claude** qui travaillent ensemble, sous la direction d'**Le propriétaire**.

| Qui | Son rôle | Il ne fait pas |
|---|---|---|
| **Le propriétaire** | Il décide (nom, circuits, règles, passage à l'étape suivante), il est le **pilote d'essai**, il peut arrêter ou réorienter à tout moment | — |
| **Le Chef** (évaluateur) | Il dit ce qui manque, lance les tests, joue avec les simulations, prend des captures, mesure, note, écrit des **rapports** et donne des **ordres** au Codeur. Il tient `SUIVI.md` | Il ne modifie **jamais** le code du jeu. Il peut écrire ses propres scripts de mesure, dans `tests/chef/` |
| **Le Codeur** | Il exécute les ordres du Chef : il code, écrit les tests, les fait passer, commite, puis envoie un **compte rendu** | Il ne décide pas seul de passer à l'étape suivante et ne change pas les règles du jeu |

**Au démarrage**, chaque session lit `CLAUDE.md` puis `SUIVI.md`, et dit quel rôle elle a. Le propriétaire donne le rôle en lançant la session :
- *« Tu es le Chef. Lis CLAUDE.md et SUIVI.md. Le Codeur est la session <nom>. »*
- *« Tu es le Codeur. Lis CLAUDE.md et SUIVI.md. Le Chef est la session <nom>. »*

### La boucle (un « tour »)

1. **Le Chef évalue** l'état du jeu : il lance les tests, les simulations et les captures, et il compare avec le critère de l'étape en cours.
2. **Le Chef envoie un rapport et des ordres** au Codeur (format ci-dessous).
3. **Le Codeur exécute**, fait passer les tests, commite (`Tour N : …`) et envoie son **compte rendu**.
4. **Le Chef vérifie lui-même** : il ne croit pas le compte rendu sur parole, il relance les tests et regarde. Ensuite, il revient à 1.
5. **Quand le critère de l'étape semble atteint**, le Chef **s'arrête et prévient le propriétaire** : ce qu'il faut essayer et comment. Rien ne passe à l'étape suivante sans l'accord du propriétaire.

Les messages passent d'une session à l'autre avec `SendMessage` (`ListAgents` pour trouver le nom de l'autre session). **Chaque rapport et chaque compte rendu est aussi écrit dans un fichier** de `rapports/` (`tour-07-rapport.md`, `tour-07-compte-rendu.md`), pour qu'on puisse reprendre si une session est fermée.

### Le rapport du Chef (format)

```
TOUR N — étape X — rapport du Chef
Commit vérifié : <hash>
Note : NN/100 (détail par axe ci-dessous)
Tests : <ce qui passe / ce qui échoue, avec la sortie>
Mesures : images par seconde, poids, résultats des simulations d'IA
Ce qui marche : …
Ce qui manque ou ne va pas (du plus grave au moins grave) :
ORDRES (3 à 6 au maximum, numérotés, chacun avec « fini quand… ») :
  1. … — fini quand …
  2. …
Questions pour le propriétaire (le Codeur n'y répond pas) : …
```

### Le compte rendu du Codeur (format)

```
TOUR N — compte rendu du Codeur
Commit : <hash>
Ordres : 1 fait / 2 fait / 3 pas fait (pourquoi)
Sortie des tests : …
Mesures : …
Ce que je n'ai pas pu vérifier : …
Réévalue.
```

### La note du Chef (/100)

Le Chef garde **les mêmes axes d'un tour à l'autre**, pour que la note soit comparable :
- conduite : 20 ;
- course et IA : 20 ;
- championnat et progression : 15 ;
- interface : 15 ;
- monde 3D et performance : 15 ;
- code et tests : 10 ;
- Poki : 5.

Il note **brutalement honnête**. Une étape qui n'existe pas encore vaut 0 sur son axe, c'est normal. La note sert à voir si on progresse, pas à faire plaisir.

### Les règles de la boucle

- **Peu d'ordres à la fois** (3 à 6), du plus grave au moins grave. Mieux vaut un tour court et vert qu'un gros tour cassé.
- **Toujours vert sur main** : le Codeur ne commite que si les tests passent. Sinon, il le dit dans son compte rendu.
- **Le Chef ne code pas, le Codeur ne décide pas.** Si le Codeur n'est pas d'accord avec un ordre, il l'explique dans son compte rendu, et le Chef tranche. Si c'est une décision de jeu, c'est **Le propriétaire** qui tranche.
- **Ce qui demande de jouer** (sensation de conduite, beauté) : le Chef ne peut pas le juger seul. Il le marque « à essayer par le propriétaire » dans `SUIVI.md`, et il attend ses retours avant de donner des ordres là-dessus.
- **Le Chef met `SUIVI.md` à jour à chaque tour** : étape, note, ordres en cours, ce qui attend le propriétaire, mesures.
- **Horaires** : si le propriétaire fixe une plage (par exemple 17h–21h), on la respecte. À l'heure de fin, on fige le jeu sur le dernier commit vert et on ne lance plus rien.

### Pièges connus (déjà vécus sur `../jeu poki`)

- **Le Mac doit rester éveillé**, branché, capot ouvert. Sinon, les tests « ne finissent jamais » à cause de la veille.
- **Tuer tous les processus de Chrome** après chaque test (le groupe entier, comme `../jeu poki/tests/lancer.py`). Des processus GPU orphelins ralentissent tout et remplissent la mémoire.
- **Ne jamais insérer un commentaire `//` au milieu d'une ligne de JS**, parce qu'il commente tout le reste de la ligne. Vérifier la syntaxe après chaque modification.
- **Les modules ES ne se chargent pas depuis `file://`** : utiliser des scripts classiques.
- **Les animations de bouton** se font avec des halos (box-shadow), pas avec `scale`. Sinon, l'outil de test juge le bouton instable et le clic échoue.

### Ce que les Claude font bien seuls, et ce qui a besoin du propriétaire

**Ils peuvent le faire et le vérifier seuls :**
- la structure, les fichiers, les tests ;
- les règles qui se vérifient avec des chiffres : points, classements, sauvegarde, plafonds, pénalités ;
- les étapes 0, 1 et 3.

**Il faut les retours du propriétaire** (prévoir plusieurs allers-retours et ne pas promettre que la première version sera la bonne) :
- **La sensation de conduite (étape 2).** Personne ne peut jouer à part le propriétaire. Le Chef lui demande ce qu'il ressent (« ça tourne trop ? le freinage est mou ? »), puis il donne au Codeur des ordres de réglage dans `donnees.js`.
- **Les IA (étape 4).** C'est le plus dur du projet. Les premières versions taperont les murs, se bloqueront ou rouleront à la file. On avance par petits morceaux (4a à 4d), et le Chef juge avec les simulations de 50 courses : des chiffres, pas des impressions.
- **La beauté : circuits détaillés et interface (étapes 10 et 11).** Les Claude ne voient le jeu qu'en captures d'écran. Le Chef prend des captures à chaque tour (comme `../jeu poki/tests/ecrans.py`), les montre à le propriétaire et lui demande des retours précis (« plus de public », « couleurs ternes »).

### Si on demande « fais le jeu »

**Personne ne fait tout le jeu d'un coup.** Le Chef découpe l'étape en cours en tours, et le Codeur fait un tour à la fois. À la fin d'une étape, le Chef s'arrête et explique à le propriétaire ce qui a été fait, comment l'essayer et ce qu'il attend de son essai. Le jeu se construit en des dizaines de tours.

### Une étape est finie seulement quand

1. son critère (colonne de droite du tableau) est vérifié **par le Chef** ;
2. les tests passent ;
3. **Le propriétaire l'a essayée** et l'a acceptée ;
4. le commit est fait.

Avant tout ça, ne jamais écrire « fini ». Pour une grosse étape (2, 4, 10, 11), le Chef propose d'abord son découpage en tours à le propriétaire.

## Les étapes (dans l'ordre)

| # | Étape | Finie quand… |
|---|---|---|
| 0 | **Fondations** : dossier, `git init`, `index.html`, Three.js en local, boucle avec la physique à rythme fixe (120 fois par seconde, séparée de l'affichage), tests lancés par Python dans Chrome sans fenêtre (comme `../jeu poki/tests/lancer.py`) | la page s'ouvre sans aucune erreur dans la console et `python3 tests/lancer.py` passe |
| 1 | **Un circuit simple, fait à partir de sa courbe** (des points au milieu de la piste) : route, vibreurs, murs, ligne d'arrivée, secteurs. Le même code servira aux 12 circuits | on survole le circuit avec une caméra libre |
| 2 | **La voiture** : sa forme, sa physique (accélération, freinage, adhérence, dérapage, aspiration), 3 caméras (derrière, cockpit, télé), un son de moteur, Espace pour revenir sur la piste | **Le propriétaire l'a conduite** et elle lui plaît |
| 3 | **Une course seule** : tours, chrono, temps de secteur, meilleur tour, choix 5/12/18 tours, pénalité pour virage coupé, écran de fin | on finit une course chronométrée de chaque longueur |
| 4 | **Les IA**, en quatre parties : **4a** une IA fait le tour seule (trajectoire idéale et vitesse conseillée tirées de la courbe) ; **4b** plusieurs IA sans se percuter ; **4c** elles dépassent et défendent leur place ; **4d** caractères des pilotes et niveaux de difficulté | une page de test simule 50 courses entre IA sans affichage et montre des résultats crédibles : les meilleurs gagnent souvent, mais pas toujours, avec des dépassements et quelques erreurs |
| 5 | **Une vraie course** : grille, feux de départ, faux départ, qualifications d'un tour (qu'on peut passer), tour de classement en direct, minicarte, résultats, podium 3D | une course complète contre 19 IA, du départ au podium |
| 6 | **Le championnat** : création du pilote (nom, numéro, pays) dans une petite écurie, les 20 pilotes fixes, 10 écuries, calendrier de 12 Grands Prix, points, classements pilotes et écuries, fiches des rivaux, sauvegarde après chaque course. **Les statistiques de carrière sont enregistrées dès cette étape** (pour l'étape 14) | on joue 3 Grands Prix, on ferme le navigateur, on revient, et tout est là |
| 7 | **Pneus et arrêt au stand** : une jauge d'usure, l'arrêt obligatoire en course de 12 et 18 tours, la voie des stands, les IA qui s'arrêtent aussi | l'arrêt change vraiment le classement de la course |
| 8 | **L'argent et le garage** : gains, achats (changeurs de roues, qualité de la F1 +7 % au maximum…), plafonds dans `donnees.js` | les améliorations se sentent, sans gagner la course à la place du joueur |
| 9 | **Les saisons** : contrats des écuries, sponsors (le joueur choisit et il est choisi, avec des objectifs), rivaux qui progressent, baissent, prennent leur retraite ou changent d'écurie, écuries qui montent ou baissent | on termine une saison et la suivante commence avec des changements visibles |
| 10 | **Les 12 circuits détaillés**, un circuit à la fois (décor, public, stands, lumière). Le tracé est seulement inspiré du vrai circuit, jamais copié virage par virage | chaque circuit tient 60 images par seconde avec 20 voitures, et la mesure est notée dans `SUIVI.md` |
| 11 | **La grande passe sur l'interface** : style retransmission télé, animations, transitions, paddock, garage | Le propriétaire trouve que ça a l'air pro |
| 12 | **La météo** (seulement si le propriétaire la veut toujours) : pluie, pneus pluie, choix au stand | la pluie change la stratégie |
| 13 | **Le résumé vidéo de la course** : les positions de toutes les voitures sont enregistrées pendant la course ; on rejoue les moments forts (départ, dépassements, sorties de piste, arrivée) avec les caméras télé | après une course, on regarde son résumé |
| 14 | **La fin de carrière et les records** : retraite anticipée ou par l'âge (15 saisons), palmarès, records, temple de la renommée (avec les statistiques de l'étape 6), nouvelle carrière | une carrière terminée affiche son bilan |
| 15 | **Poki** : SDK, pubs, traduction anglais/français complète, paquet zip, test sur inspector.poki.dev | le jeu passe l'inspecteur sans erreur |

## Façon de travailler avec le propriétaire

- Parler en français, simplement.
- Avant un gros changement, expliquer le plan en quelques lignes. Pour une décision de jeu (règle, équilibrage, nom, circuit, style), proposer, puis laisser le propriétaire choisir.
- Avancer par petits pas : un changement, on vérifie qu'il marche (tests, puis lancer le jeu), puis le suivant.
- Dire franchement ce qui ne marche pas ou ce qui n'a pas été vérifié.
- Si ce fichier ou le README disent autre chose que le code, c'est le code qui a raison : on corrige le texte.
- Commits : dans la boucle, le Codeur commite à chaque tour vert (le propriétaire l'autorise en lançant la boucle). En dehors de la boucle, ne commiter que quand le propriétaire le demande.
- Quand une décision est prise, la noter dans ce fichier, et enlever le « à approuver » correspondant.
- Seul le Chef parle de l'avancement à le propriétaire. Le Codeur lui répond s'il lui parle directement.
