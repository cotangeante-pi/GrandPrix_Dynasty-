# Tour 60 — des idées pour faire revenir, partager et sortir du lot (Codeur 5)

Date : 2026-11-19. Branche `idees-60` (depuis origin/main 2cd512d). **Rien n'est codé** : c'est un rapport d'idées pour le Chef et le propriétaire.

## Ce que j'ai regardé

- CLAUDE.md en entier (les sections du jeu, les refus, les règles Poki), SUIVI.md (« À essayer », « Décisions en attente », « Retours du propriétaire »), `rapports/tour-60-rapport.md` (les 4 autres Codeurs : conversation sur tous les thèmes, réalisme voitures/route, ciel/public/Auto, auto-guidage au téléphone), `rapports/plan-premiere-minute.md`, et le code là où une idée en dépend (`simulation.js`, `defi.js`, `photo.js`, `sauvegarde.js`, `donnees.js`, `tests/debout.py`).
- Ce que Poki dit lui-même (blog et documentation, 2026), en sources à la fin.

## Le diagnostic en trois phrases

1. **Le jeu est très riche, mais presque tout est rangé dans une seule longue boucle** : la carrière (12 Grands Prix, paddock, garage, interview, une…). Un enfant qui a 5 minutes n'a pas de « petit morceau » à mordre, et **rien ne change d'un jour à l'autre** s'il ne joue pas sa carrière : il n'a aucune raison précise de revenir *demain*.
2. **Le partage existe (le lien de défi du fantôme), mais il demande un effort** (faire un tour propre, copier un lien, que le copain ait envie d'un contre-la-montre) : il n'y a pas encore de chose qu'un enfant a *envie* de montrer en deux secondes.
3. **Face aux autres jeux de course Poki** (niveaux courts à étoiles, cascades, dérapage à un bouton), notre force unique est **le monde vivant** (19 rivaux qui ont un nom, une mémoire, une voix, un journal). Les meilleures idées ci-dessous s'appuient sur cette force au lieu d'imiter les autres.

Ce que Poki dit compter (sources à la fin) : les toutes premières secondes, des **sessions courtes**, peu de lecture, une interface lisible, des pubs récompensées plutôt que des coupures ; **les sauvegardes sont synchronisées par Poki pour un joueur connecté** (localStorage surveillé, plafond 1 Mo gzippé : notre sauvegarde unique de 85 à 261 Ko passe).

## Ce que j'ai vu en ouvrant le jeu (main 2cd512d, Chrome sans carte graphique, 1280×720 et 844×390 au doigt)

- **Le titre** : un fond très sombre (la grille de nuit, voilée), le nom en plaque blanche, « Jouer » en rouge. Propre, mais **rien ne bouge et rien ne brille**. Poki écrit que les visuels vifs et colorés marchent mieux que les palettes sombres ; le titre est la première image de chaque visite. Ce n'est pas une idée de ce rapport (les Codeurs 2 et 3 refont ciel, voitures et public), mais **je recommande de refaire les captures du titre et du paddock après leur fusion** et de regarder si le titre peut montrer la scène **de jour**, voitures en mouvement, avec moins de voile.
- **Le paddock** : clair et bien rangé, mais « Pilote 1, Pilote 2, Pilote 3, Pilote 19 » partout : **un monde vivant sans noms**, c'est notre plus grande force qui reste éteinte (voir « Préalables »).
- **Le titre au doigt** : trois boutons (Jouer, Entre amis, Aides). La place existe pour un 4e gros bouton « 🗓 Grand Prix du jour » (idée 1) sans rien serrer.

## Les 3 que je ferais en premier

1. **Le Grand Prix du jour** (idée 1) : la raison de revenir *demain*, et un résultat à comparer avec les copains.
2. **Ton copain dans ta saison** (idée 2) : la raison de *partager*, et un moment que seul notre jeu peut offrir (le monde vivant + le copain dedans).
3. **Les défis-éclair à 3 étoiles** (idée 3) : la session de 2 minutes qui manque, et le moteur qui nourrit l'idée 1 tous les jours.

Pourquoi cet ordre : 1 est moyen et touche tous les joueurs (le retour du lendemain) ; 2 est moyen et c'est le seul qui fait venir de **nouveaux** joueurs ; 3 est le plus gros, mais il multiplie le contenu avec ce qui existe déjà (drapeaux, pluie, dégâts, départ, aspiration, consignes).

### Le tableau (mes notes, de 0 à 3)

| # | Idée | Revenir demain | Partager | Différence Poki | Émotion | Coût | Réglage |
|---|---|---|---|---|---|---|---|
| 1 | Grand Prix du jour | 3 | 3 | 2 | 2 | petit à moyen | `JOUR_ACTIF` |
| 2 | Ton copain dans ta saison | 2 | 3 | 3 | 3 | moyen | `COPAINS_ACTIF` |
| 3 | Défis-éclair à 3 étoiles | 2 | 1 | 2 | 3 | gros (plan B moyen) | `DEFIS_ECLAIR_ACTIF` |
| 4 | Médailles des circuits | 2 | 1 | 1 | 2 | petit à moyen | `MEDAILLES_ACTIF` |
| 5 | Course à élimination | 1 | 1 | 1 | 3 | petit | `ELIMINATION_ACTIF` |
| 6 | Ralenti du photo-finish | 0 | 1 | 1 | 3 | moyen | `PHOTO_FINISH_ACTIF` |
| 7 | Niveau de pilote | 2 | 0 | 0 | 1 | moyen | `NIVEAU_PILOTE_ACTIF` |
| 8 | Championnat à deux | 1 | 2 | 3 | 2 | moyen | `DEUX_CHAMPIONNAT_ACTIF` |
| 9 | Cartes des pilotes | 2 | 1 | 2 | 2 | moyen | `CARTES_ACTIF` |
| 10 | Le jeu debout | 0 | 0 | 1 | 0 | gros | `PORTRAIT_JEU` |
| 11 | Week-ends à thème | 2 | 1 | 1 | 1 | petit à moyen | `EVENEMENTS_ACTIF` |
| 12 | Le champion de la division | 1 | 0 | 1 | 2 | petit | `CHAMPION_COURONNE` |

Le 10 a des zéros mais un enjeu à part (la **conversion** au premier lancement sur téléphone, et les pubs du portrait) : c'est une question à poser à Poki avant d'être une idée à coder.

---

## Les idées, de la meilleure à la moins bonne

### 1. Le Grand Prix du jour 🗓 (et sa série de jours)

**Le moment.** Léo ouvre le jeu après l'école. Sur le titre et en haut du paddock : « **Grand Prix du jour — Spaa sous la pluie, tu pars 14e, 3 tours** ». Il le joue (2 à 3 minutes). Il finit 4e : 🥈 « Argent — encore 1 place pour l'or ! ». Il le rejoue deux fois, gagne : 🥇 et « 🔥 Série : 3 jours ». En bas : « 📋 Montre ton résultat » copie :
`Grand Prix Dynasty · Jour 42 · Spaa 🌧 · 14e → 1er 🥇 · +13 places` et le lien du jeu. Le lendemain, c'est Monoco de nuit avec 2 tours, départ dernier. À la récré, tout le monde a eu **le même** Grand Prix : « t'as eu l'or ? ».

**Pourquoi c'est fort.**
- **Rétention** : c'est la mécanique la plus éprouvée pour le retour du lendemain (le « jeu du jour » à la Wordle, les défis quotidiens des jeux mobiles). Notre jeu n'a aujourd'hui **aucune** raison datée de revenir.
- **Partage** : le résultat tient en une ligne de texte avec des émojis, qu'un enfant colle partout ; le même Grand Prix pour tout le monde rend la comparaison juste.
- **Poki** : une session courte et complète (ce que Poki demande), jouable dès la 2e visite sans passer par la carrière.
- **Pas besoin de serveur** : le Grand Prix est tiré de la **date** (une graine = `AAAAMMJJ`), donc tout le monde a les mêmes IA, la même météo, la même grille, au bit près (notre simulation est déjà déterministe, c'est justement ce qui permet le jeu en ligne).

**Le contenu d'un jour** (calcul pur, `jour.js`, tiré de la graine de la date) : un circuit parmi les 12, une météo (`METEO` existante), une longueur de 2 ou 3 tours, une place de départ (souvent loin : remonter, c'est le plaisir), le niveau des IA (celui du joueur, ou « normal » pour tous ? voir la critique), parfois un « piment » (départ sous VSC, aileron déjà abîmé, pneus usés). Les médailles : 🥉 gagner au moins N places, 🥈 podium, 🥇 victoire. Pas de chrono à battre : la place, un enfant la comprend.

**Deux détails qui comptent beaucoup.**
- **« Demain : … »** : comme le jour vient de la date, on connaît déjà celui de demain. Après la course du jour, une ligne : « Demain : 🌙 Singapura de nuit, départ dernier ». L'enfant part avec un rendez-vous (on montre le circuit et le piment, pas le niveau ni les médailles).
- **Le lien partagé ouvre directement la course du jour** (`?jour=AAAAMMJJ`, par `SDK.lienPartage` comme le défi) : le copain qui clique, même nouveau venu, est **sur la grille en un clic**, exactement comme la découverte (« en piste en 10 secondes ») : le partage devient aussi un premier lancement réussi. Un lien d'un jour passé ouvre ce jour-là, marqué « Grand Prix du 12 novembre » (sans médaille ni série : seul le jour même compte).

**Coût : petit à moyen.** Un prototype tient déjà **dans une adresse** : `index.html?course=3&ia=9&joueur=1&circuit=spaa&meteo=averse&niveau=normal&graine=20261119` (tous ces paramètres existent). Il manque la place de départ imposée, les médailles, la série, « demain » et le texte à partager. Pour la vraie version : `jour.js` (date → paramètres, médailles, série ; testé sans écran), une entrée sur le titre et sur la page Course du paddock (`interface.js`, `index.html`), le texte à partager (`textes.js` fr/en), la série et les médailles dans la sauvegarde (quelques octets), `SDK.lienPartage` déjà là pour le lien. La course est une **course rapide** existante avec des réglages imposés (`creerCourseIA` prend déjà le circuit, le nombre d'IA, les tours, la graine). Jour de la carrière : rien ne change.

**Risques.**
- *La date* : prise **hors de la simulation** (seulement pour choisir la graine) : la règle « pas de `Date` dans la simulation » tient. Un enfant qui avance l'heure de sa tablette « triche » contre lui-même : sans enjeu (pas de classement mondial).
- *« Le même Grand Prix pour tout le monde », vraiment ?* Mêmes paramètres et même graine, oui. Mais `Math.sin`, `cos`, `atan2`… peuvent différer d'un bit entre Chrome, Safari et Firefox (c'est pourquoi le jeu en ligne a ses propres fonctions, `EN_LIGNE_MATHS`) : deux copains sur deux navigateurs peuvent voir une IA freiner un poil différemment. Pour la comparaison entre copains, ça suffit ; si l'on veut le « au bit près » partout, la course du jour peut emprunter `EN_LIGNE_MATHS` (déjà écrit et testé).
- *La carte des IA* : seule celle du circuit `test` est livrée dans le paquet ; un autre circuit la calcule au lancement (« Préparation de la course… », 2 à 3 s sur une vraie carte graphique, bien plus sur un ordinateur lent). Pour le jour : la calculer **en fond dès l'écran titre** (on sait quel circuit ce sera), ou livrer les 12 cartes si leur poids le permet (à mesurer).
- *Fuseau horaire* : prendre la date locale (le jour change à minuit chez l'enfant, comme Wordle).
- *Le niveau des IA* : s'il dépend du joueur, deux copains n'ont plus le même Grand Prix. **Choix proposé** : le jour a son niveau à lui (« normal » le plus souvent, « débutant » le lundi…), écrit dans le texte partagé ; les aides restent au choix (et affichées, comme au tournoi).
- *La série* : ne pas la rendre culpabilisante pour un enfant (pas de « tu vas tout perdre ! ») : une série qui casse revient à 1 sans message triste, et on garde le total « 27 jours joués ».
- *Poki* : aucun lien externe (le lien est celui de Poki via `shareableURL`), pas de pub avant la course du jour ; un bouton 📺 « Rejouer avec une place de mieux sur la grille » serait possible mais je le **déconseille** (ça casse la comparaison juste).
- *Jamais de triche* : mêmes règles, même physique, mêmes IA pour tous.

**Comment savoir qu'elle marche.** Test : la même date donne exactement les mêmes paramètres et la même course (empreinte au bit près) ; deux dates donnent deux jours différents ; 365 jours tirés : chaque circuit revient, jamais deux jours pareils de suite. Mesure : dans les chiffres que Poki donne au développeur, le temps de jeu et les retours avant/après ; sur le Mac, le robot d'essai doit pouvoir gagner le jour en « normal » depuis la place de départ tirée (sinon le tirage est trop dur).

**Comment la couper.** `JOUR_ACTIF` (faux = rien sur le titre ni le paddock, le jeu d'avant) ; `JOUR_TOURS`, `JOUR_MEDAILLES`, `JOUR_PIMENTS` (liste vide = pas de piment).

**Un argument de plus, propre aux enfants de Poki** : beaucoup jouent sur des ordinateurs d'école partagés, où la sauvegarde disparaît (et la synchronisation de Poki demande d'être connecté). La carrière perd alors tout ; **le Grand Prix du jour, lui, marche sans sauvegarde** : le même pour tous, à jouer de n'importe quel ordinateur. Seule la série se perd.

**Critique de moi-même.** La version simple risque d'être « une course rapide avec une date ». Ce qui la rend forte, c'est (a) **le texte à partager** et (b) **le « piment »** qui fait de chaque jour un petit événement. Si on n'a le temps que d'une chose : le texte à partager.

---

### 2. Ton copain dans ta saison 🤝

**Le moment.** Inès envoie son lien à Hugo : « mets-moi dans ton jeu ». Hugo clique : « **Inès (n° 7) veut rejoindre ton championnat. Comment s'appelle ton amie ?** » [Inès] → « Elle prendra la place de Pilote 14 chez Écurie 6 ». Au Grand Prix suivant, sur la grille, il y a le casque et la livrée d'Inès, le commentateur crie « Inès plonge à l'intérieur ! », la une titre « Hugo et Inès, la guerre est déclarée », et Hugo peut aller lui « parler » au paddock. Le lendemain, Hugo raconte : « je t'ai battue à Monzo ! ». Inès veut sa revanche… et met Hugo dans **son** jeu.

**Pourquoi c'est fort.**
- **Partage et acquisition** : c'est la seule idée qui fait **venir de nouveaux joueurs** (le lien ouvre le jeu sur Poki), et c'est un partage qui a du sens pour un enfant (« je suis dans ton jeu »).
- **Différence** : aucun jeu de course Poki ne met ton copain *dans ton monde*, avec un journal et un commentateur qui parlent de lui. C'est exactement notre force (le monde vivant) mise au service du partage.
- **Émotion** : le rival le plus motivant, c'est quelqu'un qu'on connaît.

**Et si celui qui reçoit est un nouveau joueur ?** C'est le cas le plus précieux (le lien fait venir quelqu'un). Sans carrière, le lien l'emmène directement sur la grille de la **course de découverte**, avec la voiture et le casque de son copain parmi les 6 rivaux (« Ton ami est sur la grille ! ») ; à la création de son pilote, le copain entre dans son plateau. Le premier lancement reste « en piste en 10 secondes ».

**Comment.** « 📋 Invite-toi chez un copain » (paddock, Entre amis) donne un lien `?pilote=<code>` : numéro, casque, livrée, pays, et **un rythme mesuré** (voir plus bas). Chez celui qui reçoit : il **tape lui-même** le prénom de son ami (rien d'écrit par un autre enfant n'arrive sur son écran), on choisit le pilote remplacé (le plus faible du plateau, ou au choix), le copain devient un rival comme les autres (caractère tiré, fiche, mémoire, discussions). Au plus 3 copains par plateau (`COPAINS_MAX`).

**Le rythme du copain, juste** : un enfant rapide doit être un rival rapide. Le code porte le **meilleur temps propre** du copain sur un circuit (un nombre, pas le tour entier : le lien reste court ; le défi du fantôme garde, lui, le tour entier), comparé au tour du poleman simulé sur ce circuit (`fantome-pole.js`), et on en tire un rythme **borné aux limites de la division** (`IA_RYTHME`, comme tout rival). Un temps trafiqué ne sert à rien : il est ramené aux bornes. Pas de temps : un rythme moyen.

**Coût : moyen.** Un code de pilote (`copain.js` : coder / décoder / vérifier, somme de contrôle comme `defi.js`), l'insertion dans le plateau (`championnat.js` : remplacer un pilote en gardant 20 pilotes et 10 écuries, comme la relève remplace un retraité), l'écran d'accueil du lien (`interface.js`), quelques titres de une et phrases de commentaire (`textes.js` : « {qui}, ton copain… » n'est pas nécessaire, son prénom suffit), la sauvegarde (quelques dizaines d'octets).

**Risques.**
- *Public d'enfants* : **aucun texte libre ne voyage** (le prénom est tapé par celui qui reçoit ; le code ne porte que des nombres et des choix de listes). C'est la même prudence que `EN_LIGNE_NOMS_LIBRES` faux.
- *Jamais de triche* : le copain est une IA comme les autres, mêmes règles ; seul son rythme est tiré de son vrai tour, et borné.
- *Code trafiqué* : refusé par la somme de contrôle ; un rythme hors bornes est ramené aux bornes.
- *Le monde* : les tests de `tests/carriere-longue.html` (20 pilotes, numéros uniques, sauvegarde relue) doivent rester verts avec des copains dedans (le numéro du copain déjà pris : on lui en donne un libre et on le dit).

**Comment savoir qu'elle marche.** Test : un code → un pilote identique après décodage ; plateau toujours à 20 pilotes / 10 écuries, numéros uniques ; un code abîmé d'un caractère refusé ; le rythme toujours dans les bornes ; 15 saisons avec 3 copains sans erreur. Mesure : la part des liens `?pilote=` à l'arrivée (un compteur dans la sauvegarde, et les visites venues d'un lien dans les chiffres Poki si disponibles).

**Comment la couper.** `COPAINS_ACTIF` (faux = pas de bouton, un lien `?pilote=` est ignoré), `COPAINS_MAX`, `COPAINS_RYTHME_MESURE` (faux = rythme moyen pour tous).

**Critique de moi-même.** Le risque est que le copain « disparaisse » dans la masse des 19. Il faut qu'il **se voie** : une couleur à lui dans la tour de classement (comme le coéquipier), une ligne au paddock (« Toi 3 – 1 Inès »), et la une qui parle de lui au moins une fois par saison. Sans ça, l'idée tombe à plat. Et il ne faut pas que le copain gagne tout (rythme borné, caractère normal).

---

### 3. Les défis-éclair à 3 étoiles ⭐⭐⭐

**Le moment.** Nina a 3 minutes avant le dîner. Elle ouvre « ⚡ Défis » : une carte de 40 cases, comme un niveau de jeu de plateforme. Défi 12 : « **Dernier tour à Monzo. Tu es 2e, à 0,8 s de Rossi. Gagne !** » — elle est lâchée directement dans le dernier tour, l'aspiration, le freinage, elle passe au dernier virage : ⭐⭐ (« ⭐ de plus : passe-le avant la Parabolica »). Elle recommence tout de suite (5 secondes de chargement). Défi 13 : « La pluie tombe, tu es en pneus secs : rentre au stand et finis dans les 5 ». Défi 14 : « Ton aileron est cassé, 2 tours : ne perds pas plus de 2 places ».

**Pourquoi c'est fort.**
- **C'est la formule des succès Poki** (niveaux courts, étoiles, « encore un ») appliquée à **notre** course, pas une copie : les défis sont des **moments de course** (dernier tour, remontée, pluie, VSC, défense, départ), pas des cascades.
- **Ça apprend en jouant** (Poki : « l'apprentissage doit ressembler à du jeu, pas à des consignes ») : chaque système qu'on a construit (drapeaux, pneus, aspiration, consignes, dégâts) devient un défi au lieu d'une page d'aide.
- **Le contenu sans fin** : un défi = une ligne de données ; et le **Grand Prix du jour** (idée 1) peut, plus tard, tirer un défi du jour avec la même mécanique.

**Comment.** Un défi = { circuit, météo, tour de départ, voitures placées (distance, écart, vitesse), état du joueur (pneus, aileron, place), but (place, écart, « ne pas perdre de place », temps), étoiles }. La difficulté technique est **le départ lancé** : `creerCourseIA` part toujours de la grille ; il faut une fonction qui pose les voitures en mouvement sur la piste (`s`, `d`, vitesse, tour en cours) puis laisse 1 à 2 s de « mise en route » aux IA avant de compter. 40 défis au début, rangés en 4 groupes (départ, attaque, défense, conditions), débloqués par les étoiles.

**Ce qui existe déjà** : `placerSurPiste(v, circuit, s, d)` pose une voiture n'importe où sur la piste (la leçon des drapeaux s'en sert pour garer une IA, `TUTORIEL.scene`) ; ce qui manque, c'est de donner à chaque voiture sa vitesse, son tour en cours et ses passages de secteurs (le classement en direct en dépend : `passages`, `classementCourse`).

**Coût : gros** (le départ lancé touche `simulation.js` et `course.js` ; l'écran de la carte des défis ; 40 défis à régler et à vérifier avec le robot d'essai). Fichiers : `defis-eclair.js` (données et réussite, calcul pur), `simulation.js` (départ lancé), `interface.js`, `textes.js`, `donnees.js`.

**Risques.**
- *Le départ lancé* : les IA ne doivent pas faire n'importe quoi la première seconde (freinage brusque, choc). À tester sur chaque défi avec le test des chocs de `tests/courses.html`.
- *Le déterminisme* : un défi a sa graine, la même course à chaque essai (sinon une étoile serait de la chance).
- *Confusion avec le tutoriel* (8 leçons à étoiles) : le tutoriel apprend les gestes seul en piste ; les défis sont des **situations de course contre des rivaux nommés**. Les leçons pourraient devenir les 8 premières cases de la carte (un seul endroit au lieu de deux).
- *Poki* : `gameplayStart` / `gameplayStop` à chaque défi ; une pub (`commercialBreak`) au plus toutes les quelques défis, jamais entre un échec et le « Réessayer » (c'est là que l'enfant part).
- *Jamais de triche* : les IA d'un défi ont leurs règles habituelles ; un défi n'est pas « arrangé » en cours de route.

**Comment savoir qu'elle marche.** Test : chaque défi est réussi par le robot d'essai (au moins 1 étoile) et raté si l'on ne fait rien ; le même défi rejoué = la même course ; aucun choc > 5 m/s dans la première seconde. Mesure : le nombre de « Réessayer » par défi (un défi jamais rejoué est trop facile ou ennuyeux, un défi rejoué 20 fois sans réussite est trop dur).

**Comment la couper.** `DEFIS_ECLAIR_ACTIF` (faux = pas d'entrée, le jeu d'avant) ; `DEFIS_ECLAIR` (la liste) ; `DEFIS_PUB_TOUS` (une pub tous les N défis).

**Critique de moi-même.** C'est le plus cher. Si le départ lancé est trop dur à rendre propre, un **plan B** garde 70 % de l'idée : des défis qui partent de la **grille** (courses de 1 à 3 tours avec un état imposé : « pars dernier, 2 tours, finis 5e », « averse au 2e tour », « aileron cassé »), sans toucher à la simulation. Exemple : « Course d'un tour à Monzo, tu pars 2e, Rossi en pole : bats-le » donne presque la même émotion que « dernier tour, 0,8 s derrière ».

---

### 4. Les médailles des circuits (le « temps du créateur ») 🥉🥈🥇💎

**Le moment.** Sur chaque circuit, en essai libre ou en qualification, quatre temps sont affichés : bronze, argent, or et **💎 « le temps de Gaston »** (un pilote du jeu, en fantôme). Théo bat l'or à Suzuko après 20 essais, et voit le fantôme de Gaston encore 0,4 s devant lui. Il revient le lendemain pour le diamant. Sur l'écran des circuits, une rangée de médailles : 9 or sur 12.

**Pourquoi c'est fort.** C'est le moteur de rejeu des jeux de chrono qui durent des années (des médailles par piste et un temps « de l'auteur » à battre). Nous avons déjà tout : le fantôme, l'écart en direct, le fantôme du poleman simulé. Il manque **un but clair et une collection**. Pour un enfant, « bats le fantôme doré » se comprend tout de suite.

**Coût : petit à moyen.** Les seuils : à partir du tour du poleman simulé (`fantome-pole.js`), × 1,10 / 1,05 / 1,02 pour bronze / argent / or, et le diamant = un tour plus rapide que le poleman, **enregistré par nous** (le robot d'essai bien réglé, ou nos meilleurs tours, livré dans le paquet comme `cache-carte-test.js` : environ 16 Ko par circuit, 12 circuits ≈ 200 Ko, ou chargé à la demande). Les médailles dans la sauvegarde ; une rangée de médailles sur la page des circuits (`interface.js`).

**Risques.** Les seuils dépendent de la physique : à régénérer si la physique change (comme les cartes des IA ; un test le vérifie). Le poids des fantômes 💎 (charger seulement celui du circuit choisi). Les aides : une médaille gagnée avec l'auto-guidage est affichée avec un petit signe (comme au tournoi), jamais refusée.

**Comment savoir qu'elle marche.** Test : le robot d'essai obtient le bronze partout et pas le diamant ; le fantôme 💎 rejoue au bit près. Mesure : la part des joueurs qui retournent sur un circuit déjà fait.

**Comment la couper.** `MEDAILLES_ACTIF`, `MEDAILLES_SEUILS`, `MEDAILLES_DIAMANT` (faux = pas de fantôme livré).

**Critique de moi-même.** Ça parle surtout aux enfants qui aiment le chrono (pas aux plus petits). C'est pourquoi elle passe derrière les trois premières. Mais elle est peu chère et donne aux 12 circuits une vie hors carrière.

---

### 5. La course à élimination 🚩

**Le moment.** En course rapide ou à deux : « Élimination — à la fin de chaque tour, le dernier sort ». 8 voitures, 7 tours. Au 5e tour, Sam est 4e sur 4, il voit sur la minicarte la voiture devant lui à 1 s, il prend l'aspiration et passe sur la ligne : « **Moreau ÉLIMINÉ !** ». À deux, sur l'écran partagé, les deux frères hurlent.

**Pourquoi c'est fort.** Chaque tour a un enjeu (pas de milieu de course mou), la tension monte jusqu'au dernier duel, les parties sont courtes, et **c'est génial à deux** (le mode écran partagé gagne une deuxième formule). Tout se comprend sans texte.

**Coût : petit.** Dans `course.js` : à chaque passage de ligne du meneur sur un nouveau tour, le dernier classé est retiré (classé à sa place, la voiture rentre au stand ou devient transparente puis disparaît). Une option dans « Choisis ta course » et l'écran « À deux ». Une phrase du commentateur et un bandeau.

**Risques.** Ce n'est pas une règle de vraie F1 : **hors carrière** seulement (course rapide, à deux, jour possible). Le joueur éliminé tôt : ne pas le laisser regarder 5 minutes, proposer « Regarder la fin » (accéléré déjà fait) ou « Rejouer ». Déterminisme : la règle ne tire aucun hasard.

**Comment savoir qu'elle marche.** Test : avec N voitures, il en reste 1 après N−1 tours ; le joueur éliminé voit le bon écran ; à deux, l'élimination d'un joueur ne coupe pas l'autre moitié. Mesure : la part des courses rapides jouées dans cette formule.

**Comment la couper.** `ELIMINATION_ACTIF` (faux = l'option n'existe pas).

**Critique de moi-même.** Idée connue (beaucoup de jeux de course l'ont), donc ce n'est pas elle qui fait la différence ; mais elle coûte peu et rend la course rapide et le mode à deux bien plus vivants. À faire « en passant ».

---

### 6. Le ralenti du photo-finish et du dépassement décisif 📸

**Le moment.** Dernier virage, Léa et Rossi côte à côte. Ligne. L'image se fige une demi-seconde, **ralenti** de 3 s sous la caméra de la ligne, puis la bande du photo-finish : « **Léa gagne de 0,004 s !** ». Ou au dernier tour, le dépassement qui donne la victoire est rejoué tout de suite au ralenti avant le podium.

**Pourquoi c'est fort.** C'est le moment dont l'enfant parle le lendemain (« j'ai gagné de 4 millièmes ! »). Le résumé vidéo existe, mais il vient **après**, quand l'émotion est passée ; ici c'est **dans** l'instant, 3 secondes, seulement quand c'est serré.

**Coût : moyen.** L'enregistreur des positions et la régie télé existent (`enregistreur.js`, `regie.js`, `resume.js`) ; il faut un rejeu court au ralenti juste après l'arrivée (le jeu continue en dessous, ou la course est déjà finie pour le joueur) et la « bande » du photo-finish (un dessin 2D, comme `photo.js`). Gardée dans l'album (la une a déjà la photo).

**Risques.** Ne jamais couper le pilotage : seulement après la ligne du joueur (ou dans le dernier tour pour un dépassement, après coup). Images/s : le rejeu dessine la même scène (aucun coût en plus). Le seuil (0,1 s ?) dans `donnees.js`.

**Comment savoir qu'elle marche.** Test : une arrivée à moins du seuil déclenche le ralenti, une arrivée à 2 s non ; « passer » marche. Mesure : à l'œil, avec le propriétaire.

**Comment la couper.** `PHOTO_FINISH_ACTIF`, `PHOTO_FINISH_SEUIL`.

**Critique de moi-même.** Elle n'a lieu que dans quelques courses : c'est voulu (rare = précieux), mais ça veut dire que son effet sur la rétention est faible. Une émotion forte, pas une raison de revenir.

---

### 7. Le niveau de pilote (une barre pour tous les modes) ⬆

**Le moment.** Après chaque course, quelle qu'elle soit (carrière, course rapide, jour, défi, à deux, tournoi), une barre se remplit : « +120 · Niveau 13 ». Au niveau 14 : « 🎁 Nouveau motif de casque : Éclair ». Toutes les 5 niveaux, un plus gros cadeau (une livrée, une célébration).

**Pourquoi c'est fort.** Aujourd'hui, seuls la carrière (argent) et des exploits rares débloquent des choses ; une course rapide ou à deux « ne compte pour rien ». Une barre commune donne de la valeur à **chaque** partie, et le « encore une pour le niveau 14 » est le plus vieux moteur de « encore une » des jeux pour enfants.

**Coût : moyen.** `niveau-pilote.js` (points par course, courbe, récompenses), un écran de gain (on peut le poser sur le podium existant), la liste des récompenses dans `donnees.js` (les motifs, livrées, célébrations existent ; il en faut plus : des variantes de couleurs coûtent peu).

**Risques.** Faire doublon avec l'argent de la carrière (deux monnaies) : les points de niveau ne s'achètent pas et ne servent qu'aux cosmétiques. **Jamais de vitesse** (comme les skins). Les points ne dépendent pas des aides (sinon on punirait l'enfant qui garde l'auto-guidage).

**Comment savoir qu'elle marche.** Test : chaque mode donne des points, les récompenses tombent aux bons niveaux, rien ne change à la physique. Mesure : le nombre de courses par visite.

**Comment la couper.** `NIVEAU_PILOTE_ACTIF`, `NIVEAU_PILOTE_COURBE`, `NIVEAU_PILOTE_RECOMPENSES`.

**Critique de moi-même.** Efficace mais **pas original** : c'est un multiplicateur des autres idées, pas une idée qui fait parler. Elle vaut surtout si les idées 1, 3 et 5 existent (sinon, il n'y a pas grand-chose de court à jouer pour la remplir).

---

### 8. Le championnat à deux (frères, sœurs, copains) 🏁🏁

**Le moment.** Deux enfants sur le même ordinateur : « Championnat à deux — 4 Grands Prix ». Écran partagé, quelques rivaux du monde autour (le mode à deux en permet 5 au plus : `DEUX_VOITURES_MAX` 7), et **un tableau de points à deux** entre les courses : « Lucas 43 – Emma 40 ». Au 4e Grand Prix, tout se joue. Un podium final avec les deux casques.

**Pourquoi c'est fort.** Le mode à deux existe, mais chaque course est isolée (un score de « rivalité », une revanche) ; un **petit championnat** donne une histoire à la soirée et un vainqueur. Aucun jeu de course Poki ne propose une saison à deux.

**Coût : moyen.** Le mode à deux (`deux-joueurs.js`) et les points du championnat (`championnat.js`) existent ; il faut l'enchaînement de 3 ou 4 courses, le tableau à deux, le podium final (le podium 3D sait déjà afficher des casques). Pas d'argent, pas de garage (comme le mode à deux aujourd'hui).

**Risques.** Performance du mode à deux avec plus d'IA (mesuré à 5 IA aujourd'hui) : garder le même nombre d'IA. Une pub entre deux Grands Prix (comme aujourd'hui entre deux courses à deux).

**Comment savoir qu'elle marche.** Test : 4 courses enchaînées, les points justes, l'égalité tranchée ; le propriétaire l'essaie à deux.

**Comment la couper.** `DEUX_CHAMPIONNAT_ACTIF`, `DEUX_CHAMPIONNAT_COURSES`.

**Critique de moi-même.** Ne touche que les enfants qui jouent à deux sur un clavier (et pas le téléphone). Mais pour eux, c'est la meilleure soirée possible, et ce sont eux qui en parlent à l'école.

---

### 9. L'album des cartes de pilotes 🃏

**Le moment.** Chaque rival a une **carte** (son casque, sa voiture, son caractère, son pays, une phrase). On la gagne en le battant pour la première fois ; elle devient **brillante** quand on le bat sur une saison entière, **dorée** quand on le bat à **son** Grand Prix à domicile. « Album : 23 cartes sur 60, 4 dorées ».

**Pourquoi c'est fort.** Collectionner des cartes, c'est le plaisir n° 1 des enfants de 8 à 12 ans. Et c'est encore notre force (les rivaux ont un nom, un pays, une mémoire) : chaque carte rappelle une histoire (« celui-là, je l'ai eu à Monoco »).

**Coût : moyen.** Les fiches et les dessins existent (`fiche.js`, `photo.js`, `casque.js`) ; il faut la carte, l'album (`interface.js`), les règles (calcul pur, à partir des résultats déjà gardés), la sauvegarde (un octet par carte).

**Risques.** La relève, les retraites et les plateaux par division font des centaines de pilotes sur une longue carrière : l'album doit garder une carte compacte (comme l'album des unes). Aucun vrai pilote, aucune vraie marque (les noms sont inventés).

**Comment savoir qu'elle marche.** Test : battre un rival donne sa carte une seule fois, les conditions de brillance et d'or, une vieille sauvegarde reconstruit les cartes de son passé. Mesure : à l'œil.

**Comment la couper.** `CARTES_ACTIF`.

**Critique de moi-même.** Ça vit **dans** la carrière : ça ne fait pas revenir l'enfant qui n'a pas accroché à la carrière. Plus fort si les noms des pilotes sont enfin choisis (aujourd'hui « Pilote 14 », ce qui tue une collection : une carte « Pilote 14 » ne fait rêver personne). **Les noms des pilotes sont un préalable** pour 2, 9 et 11.

---

### 10. Le jeu debout, pour de vrai 📱

**Le constat.** Poki écrit en 2026 que « demander de tourner le téléphone tue la conversion » et que les pubs de la barre de jeu (Gamebar) ne viennent qu'en portrait ; sa page des exigences demande seulement que le jeu couvre l'écran dans un sens ou dans l'autre. Aujourd'hui, `PORTRAIT_TOURNER` (tour 56) affiche le jeu **tourné de 90°** sur un téléphone debout : l'image couvre l'écran, mais l'enfant doit quand même tourner son téléphone pour la lire. (Au passage : la ligne de CLAUDE.md « Plein écran et paysage » parle encore du message « Tourne ton téléphone » comme comportement actuel ; le code a raison, la doc est à corriger.)

**Le moment.** Un enfant ouvre le jeu dans le bus, téléphone debout. Il appuie sur « Jouer » et **joue debout** : la caméra est plus haute derrière la voiture (on voit plus loin devant, comme dans les jeux de course en portrait), GAZ et FREIN en bas sous les pouces, il tourne en inclinant ou avec ◀ ▶.

**Pourquoi c'est fort.** La conversion au premier lancement sur téléphone (la part d'enfants qui commence vraiment à jouer), et les pubs du portrait.

**Coût : gros.** Une caméra et une mise en page du HUD pour un écran étroit, tous les menus en 360×640 (le paddock, la boutique…) : des semaines de travail et de tests. **Version minimale** : seulement la **course de découverte et la course rapide** en portrait (la caméra et le HUD), les menus restent tournés.

**Risques.** Une F1 vue dans un écran étroit voit peu de virage : à essayer avant de décider. Le volant (l'inclinaison) change de sens debout. Images/s : moins de pixels, plutôt mieux.

**Comment savoir qu'elle marche.** `tests/debout.py` existe déjà (4 téléphones debout, parcours entier) : il deviendrait le test du vrai portrait. Mesure : la part des parties sur téléphone dans les chiffres Poki, avant/après.

**Comment la couper.** `PORTRAIT_JEU` (faux = `PORTRAIT_TOURNER` comme aujourd'hui).

**Critique de moi-même.** Je la classe 10e parce qu'elle est très chère et que le gain n'est pas sûr pour un jeu de F1 (beaucoup de jeux de course Poki restent en paysage). **À faire avant tout : demander à Poki** si le paysage tourné passe leur contrôle et ce qu'il coûte en conversion.

---

### 11. Les week-ends à thème (une fois par mois) 🎃❄

**Le moment.** Fin octobre, les tribunes sont orange, des citrouilles le long de la piste à Singapura de nuit ; le Grand Prix du jour est « Grand Prix d'Halloween » et sa médaille d'or donne la livrée « Citrouille ». En décembre, Montréol sous la neige (décor seulement, la piste reste sèche).

**Pourquoi c'est fort.** Une raison datée de revenir, une récompense « que tout le monde n'a pas », et un jeu qui a l'air vivant et entretenu (les jeux de course Poki qui durent sortent des éditions saisonnières).

**Coût : petit à moyen** (après l'idée 1) : des couleurs de décor et du public (les Codeurs 2 et 3 refont justement le ciel et le public : y prévoir une « teinte » réglable), une livrée par événement, un calendrier dans `donnees.js`.

**Risques.** Une fête n'est pas universelle (Halloween, Noël) : préférer des thèmes neutres ou plusieurs (hiver, été, nuit des lanternes) ; la livrée de l'événement **revient chaque année** (pas de peur de rater). Aucune marque.

**Comment la couper.** `EVENEMENTS_ACTIF`, `EVENEMENTS` (le calendrier).

**Critique de moi-même.** Seule, elle est faible (une déco) ; avec le Grand Prix du jour, elle donne des pics. À garder pour après l'idée 1.

---

### 12. Le champion de la division (un « boss » à faire tomber) 👑

**Le moment.** En division 4, un pilote porte une couronne dans la tour de classement : **le champion en titre**. Avant la course : « Rossi, champion en titre, part en pole ». Le battre en course : gros titre de la une, une phrase du commentateur, un motif de casque à la première fois. Le battre au championnat : on lui prend la couronne, et on monte.

**Pourquoi c'est fort.** Les enfants comprennent un **boss** mieux qu'un tableau de points ; la montée de division gagne un visage.

**Coût : petit** : le champion de la saison passée existe déjà dans l'historique ; une icône, quelques textes, un déblocage.

**Risques.** Jamais de triche : le champion est seulement le meilleur pilote (même physique, mêmes règles). Recouvre un peu la bête noire et le duel : à garder discret.

**Comment la couper.** `CHAMPION_COURONNE`.

**Critique de moi-même.** Petite idée, petit coût, petit effet. Je la garde parce qu'elle donne un but lisible à un enfant de 8 ans dès sa première saison.

---

## Les idées écartées (et pourquoi)

- **Un arrêt au stand à « taper » soi-même** (toucher les 4 roues vite) : amusant une fois, mais il rend l'arrêt plus long et coupe la course ; et l'arrêt dépend déjà des changeurs du garage.
- **Le commentateur qui dit le prénom du joueur** : la synthèse lit déjà `{qui}` ; les voix enregistrées ne peuvent pas dire un prénom tapé (on pourrait enregistrer une liste de prénoms, mais c'est lourd pour un petit plaisir).
- **Un écran « pendant ton absence »** au retour : il ne sert qu'à ceux qui sont déjà revenus ; ce n'est pas lui qui fait revenir.
- **Créer sa propre écurie** (devenir patron) : de la gestion, loin de ce qui plaît à un enfant sur Poki, et très cher.
- **Un classement mondial** : il faut un serveur et une modération ; le jeu en ligne attend déjà l'accord du propriétaire et de Poki. Le texte à partager (idée 1) donne l'essentiel sans serveur.
- **Des accidents spectaculaires, la casse** : refusé (seulement l'aileron avant, « jamais de casse totale »).
- **Un ingénieur à la radio qui conseille** : refusé pour l'aileron (« aucun conseil ») ; je ne le repropose pas.
- **Des pièces de voiture à débloquer** (jantes, fumée) : non retenu le 2026-11-04.
- **Se connecter avec le compte Poki pour afficher son pseudo** : possible (`getUser`), mais un nom venu d'ailleurs sur l'écran d'un enfant, pour un gain faible ; la synchronisation des sauvegardes, elle, est déjà automatique.

## Ce qu'il faudrait d'abord (préalables, pas des idées)

- **Les noms des pilotes et des écuries** (attendus du propriétaire depuis le 2026-10-29) : « Pilote 14 » affaiblit tout ce qui repose sur les rivaux (idées 2, 9, 12, et le commentateur).
- **Demander à Poki** : le jeu tourné de 90° en portrait passe-t-il leur contrôle, et quels chiffres le développeur reçoit-il (retour du lendemain, temps de jeu) pour mesurer les idées 1 à 3.

## Sources (ce que Poki dit)

- [Poki — What makes a high-quality browser game (2026)](https://poki.com/blog/what-makes-high-quality-browser-game) : sessions courtes, chargement rapide, pubs récompensées plutôt que coupures, couleurs vives.
- [Poki — Building web browser games in 2026](https://poki.com/blog/building-web-browser-games-2026) : le portrait, « tourner le téléphone tue la conversion », un apprentissage qui ressemble à du jeu.
- [Poki for Developers — Accounts et sauvegardes dans le nuage](https://developers.poki.com/guide/accounts) : synchronisation automatique de localStorage pour un joueur connecté, plafond 1 Mo gzippé, préfixe `poki_ignore`.
- [Poki — exigences (sdk.poki.com/requirements)](https://sdk.poki.com/requirements) : couvrir l'écran en portrait ou en paysage, les deux pour la meilleure expérience.
