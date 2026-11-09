# Tour 51n — La première minute d'un nouveau joueur (de la seconde 0 à la fin de sa 2e course)

Codeur 3, 2026-11-07, analyse sans code. Lu : `index.html`, `principal.js`, `decouverte.js`, `depart.js`, `interface.js`, `aides.js`, `tutoriel.js`, `textes.js`, `donnees.js`, `course.js`, `assistance.js`, `voix.js`, `tactile.js` (branche du Codeur 5, `../Grand Prix Dynasty - codeur 5`) ; captures existantes de `tests/captures/` (titre, decouverte, decouverte-aides-en, feux, podium, bravo, pilote, qualif), `poki/captures/1-depart-feux-fr.jpg`, et `tactile-640.png` / `tactile-960.png` du Codeur 5. Aucun Chrome lancé.

Point de départ : l'estimation du Chef (environ 70 joueurs sur 100 partis dans la première minute, public jeune, plus de la moitié sur téléphone, décision en 10 à 30 s). Je n'ai aucune mesure réelle Poki ; ce qui suit est ce que le code **fait vivre** au joueur, seconde par seconde, et où il peut lâcher.

## 1. En trois lignes

- **Le jeu est en piste vite** (un clic, 6 à 10 s jusqu'aux feux éteints), mais **la première chose qu'on lui demande est un mini-jeu à deux temps non expliqué** (tenir ↑ dans le vert, puis **lâcher et réappuyer**). Un joueur qui tient ↑, comme l'aide « ↑ accélérer » le lui dit, **ne part pas** (`principal.js:2141-2144`, `depart.js` `commande()`), et voit les 6 IA s'en aller. C'est, à mon avis, le premier levier, et il est testable.
- La première minute montre **une douzaine d'éléments d'interface** d'un coup (chrono, 3 secteurs, meilleur tour, tour de classement, radar, trajectoire conseillée, 3 aides, jauge + 2 lignes de texte, barre des touches, bandeau commentateur, voix de synthèse). Un enfant sur téléphone lit zéro texte : tout ce qui est écrit est perdu, et tout ce qui est écrit pour le **clavier** est faux sur téléphone.
- Après la course : **podium → bouton « Résultats » (qui mène à « Bravo ») → « Commencer ma carrière » → formulaire à 6 champs → rechargement de la page → paddock → qualification seul (1 tour) → grille → 5 tours contre 19 IA (≈ 9 min) → télé → podium → résultats → interview → une**. La 2e course finit environ 20 minutes après la première arrivée. Sur Poki, c'est long ; la première **vraie** récompense (argent visible qui sert à quelque chose) arrive seulement au paddock, après le formulaire.

## 2. Chronologie, seconde par seconde (ordinateur, premier lancement, navigateur en français)

Les durées « réelles » sont estimées à partir des mesures de `tests/premier.py` (swiftshader : page 0,7 s, clic → feux éteints 7,6 s médiane) et des réglages de `donnees.js`. Sur une vraie carte graphique, la carte des IA se calcule en 2–3 s (CLAUDE.md), pas plus.

| t (s) | Ce qu'il voit | Texte à lire | Ce qu'il fait | Ce qu'il comprend / risque |
|---|---|---|---|---|
| 0 → 1–2 | Chargement (zip 730 Ko, three.min 618 Ko), fond 3D (ligne d'arrivée, voiture bleue) | — | attend | ok ; `gameLoadingFinished` au titre |
| 1–2 | **Titre** : nom, « ▶ Jouer », « Entre amis », puis 3 petits boutons « 🎓 Apprendre à piloter / 🛞 Aides au pilotage / ⌨ Touches » (`index.html:58-60`), 🔊 en haut à droite ; sur iPhone **un 6e bouton « 🎮 Activer le volant »** (tactile.js) | 5 à 6 libellés | 1 clic sur Jouer | ok : le gros bouton est évident. Le titre n'est plus « rien d'autre à choisir » : 5 boutons + 🔊 (+1 sur iPhone) |
| 2 → 4–7 | **La grille, vue de derrière sa voiture**, voitures immobiles ; « Préparation de la course… » à la place du compte tant que la carte des IA se calcule (premier lancement : jamais en cache, `cache-carte.js`) | 1 ligne | rien à faire | 2–5 s de rien (swiftshader : jusqu'à 5 s). Il ne sait pas qu'il attend quelque chose |
| 4–7 → 10–14 | **Les 5 feux**, un par seconde, puis extinction 0,8–2,6 s après (`FEUX_DELAI`). À l'écran en même temps : chrono « Tour 1/3 », 3 secteurs, « Meilleur tour », tour **P4 / 7**, radar, 3 aides « ↑ accélérer / ← → tourner / ↓ freiner », la **jauge** avec « Tiens ↑ pour garder l'aiguille dans le vert · feux éteints : lâche, puis réappuie ↑ », la barre « ↑ ↓ ← → conduire · C caméra · Espace retour en piste · M son · Échap pause », la trajectoire conseillée peinte (débutant) | **≈ 60 mots** | Il tient ↑ (l'aide clignote s'il ne fait rien 3 s, `AIDE_CLIGNOTE_APRES`) | **L'aiguille monte à 1,0 en 1,1 s** (`DEPART_MONTEE` 0,9) : au-dessus du vert [0,55–0,75]+0,06. Il ne lit pas la 2e ligne |
| extinction | Les 6 IA partent (réaction 0,15–0,45 s) | « GO » | il tient toujours ↑ | **Sa voiture ne bouge pas** : `principal.js:2141-2144` met `cibles = AUCUNE` tant que `d.lance === null`, et `depart.js` `commande()` ne lance que sur `pression = appui && !d.appui`. Aucune aide ne dit « lâche ↑ » à ce moment (l'aide ↑ ne clignote que si aucune touche n'a servi, `principal.js:847`). **C'est le moment où il croit que le jeu est cassé.** S'il lâche et réappuie vite : régime ≈ 0,9 → **« Patinage ! »** en rouge 1,5 s (`DEPART_AFFICHAGE`). S'il attend 2 s puis réappuie : régime redescendu (0,6/s) → « Bon départ » ou « Calé ». Première émotion : rouge, ou rien |
| 15 → 40 | Il roule enfin, dernier ou avant-dernier ; direction assistée et freinage assisté **allumés** (`assistance.js:20-21`, découverte en débutant) : la voiture suit la piste, bien. Commentateur : bandeau + **voix de synthèse** toutes les 2,5 s (`COMMENTAIRE_MODE` 'tout', `voix.js:11` option 'voix' vrai par défaut) | bandeau 60 caractères toutes les 2,5 s | ↑ tenue, un peu ← → | La voix de synthèse d'un ordinateur d'école ou d'un téléphone est souvent robotique ; sur iOS elle peut ne pas parler. Elle ajoute du bruit à un moment où il cherche encore ce qu'il doit faire |
| 40 → 60 | Fin du 1er tour (IA débutant ≈ 50 s/tour sur `test` ; lui plus) ; les aides ↑ ← → ↓ disparaissent au plus tard là | — | il rattrape les IA lentes (rythme −5 %) | **Premier dépassement possible vers 45–90 s** (3 IA devant). C'est la première récompense : la tour qui monte, « Toi passe Pilote 4, P3 ! ». Elle est petite (une ligne) et tardive par rapport à Poki |
| 60 → 150–200 | Tours 2 et 3 | — | — | S'il est resté, il reste : la conduite est fluide, le podium est à portée (P2 dans la capture du robot) |
| arrivée | Drone 5 s autour de sa voiture, puis **vue télé** en attendant les IA derrière (jusqu'à 3 voitures, bouton « passer », 90 s au plus) | « Arrivée — en attendant les autres pilotes », « passer » | regarde, ou clique « passer » | 5 à 30 s passifs |
| podium | **Podium 3D** (caméra qui se balance), 3 cartes avec temps, **bouton « Résultats »** (`texte('voirResultats')`, `interface.js:280`) ; pas d'auto-enchaînement (`tempsPodium` ne sert qu'à la caméra) | 1 bouton | 1 clic | Le bouton s'appelle « Résultats » mais mène à « Bravo ! » (test `decouverte()` : `pg.click('#boutonResultats')` → bravo). Pas de prime visible ici |
| bravo | « Bravo ! Tu finis P2 / 7 · Ta prime : 800 €, ton premier argent de carrière · On lance ta carrière ? » + « Commencer ma carrière » + « D'abord apprendre » | 4 lignes | 1 clic | Première récompense **chiffrée** : vers 3,5–5 min. L'argent n'achète rien tout de suite |
| pilote | **Formulaire** : Nom (champ texte), Numéro, Pays (liste), Course de cœur (liste), casque : motif (liste) + 3 couleurs (`index.html:124-146`) ; en fond, le compteur affiche « 7 288 km/h » (`pilote.png`, résidu du tableau de bord) | 7 libellés + 1 message d'erreur possible (« Ce numéro est celui d'un rival… ») | tape, choisit, 1 clic « C'est parti ! » | 30 s à 2 min. **Sur téléphone couché (640×360), le clavier virtuel couvre le formulaire.** |
| reload | `validerPilote()` → `location.reload()` (`principal.js:918`) | — | attend | 1–2 s de page blanche, le SDK se réinitialise |
| paddock | Nouveau paddock (menu à gauche, page Course, « COURSE SUIVANTE » rouge), 20 pilotes à 0 pt, solde 800 € | beaucoup | 1 clic | ok, le bouton rouge est clair |
| qualif | « Qualification : un tour chronométré » : « Faire mon tour » / « Passer (départ dernier) » ; bulle d'aide 'qualif' (première fois) | 2 boutons + 1 bulle | 1 clic | S'il fait le tour : **1 tour seul ≈ 1:45 sur Bahrayn** (5,4 km, D4 puissance 0,85) ; résultat P20/20 probable ; « Départ de la course » |
| grille | **Survol de la grille 2,5 s** (`GRILLE_DUREE`), « La grille — une touche pour passer » | 1 ligne | — | ok |
| feux | Même jauge ; **première bulle 'depart' d'aides.js** (elle est exclue à la découverte, `aides.js` ligne `!s.decouverte`) ; 19 IA, tour de 20 lignes, minicarte, pneus 100 % | plus de texte qu'à la découverte | même piège qu'au départ 1 | Même risque de « ma voiture ne part pas » (il a peut-être appris, peut-être pas) |
| course 2 | **5 tours × ≈ 1:45 ≈ 9 min** (`CHAMPIONNAT_TOURS` 5, fixe ; les trois longueurs ne sont pas offertes) contre 19 IA débutantes, parti dernier | commentateur | — | Aucun arrêt obligatoire en 5 tours. C'est long pour une 2e course Poki ; la plupart des jeux de voiture Poki ont des manches de 30 s à 2 min |
| après | télé → podium → Résultats (gains, bonus sans aide) → Continuer → **interview** (question + 3 réponses) → **une du journal** (clic pour passer) → paddock (annonce du skin drapeau) → au prochain « Course suivante », **première pause pub** | 3 écrans de texte | 3–4 clics | Les récompenses sont là (argent, skin, une), mais à ≈ 20 min du début |

**Totaux estimés** : découverte 4–5 min ; bravo + création + rechargement 1–2 min ; 2e course (qualif, grille, 5 tours, télé, 3 écrans) 12–15 min. **Première émotion forte possible** : un dépassement vers 45–90 s, si le départ n'a pas été raté. **Première récompense chiffrée** : « 800 € » vers 4 min. **Première chose à acheter** : au garage, bien plus tard.

## 3. Ce que ça donne face aux règles Poki et aux jeux de voiture qui marchent

Règles Poki (celles que le jeu suit déjà dans CLAUDE.md : en piste en 10 s, pas de texte à lire, récompense rapide, pas de pub avant le jeu, console vide) :

| Règle | Où en est le jeu | Verdict |
|---|---|---|
| En piste en 10 s | 1 clic, 6–10 s jusqu'aux feux éteints (7,6 s en swiftshader) ; mais **la voiture ne roule vraiment que si le joueur réussit le lâcher-réappuyer** | tenu sur le papier, **pas tenu pour un joueur qui tient ↑** |
| Pas de texte à lire | ≈ 60 mots à l'écran pendant les feux, dont 2 lignes nécessaires pour partir | **pas tenu** |
| Récompense rapide | tour de classement (P4/7) dès la grille, dépassement possible à 45–90 s, argent à 4 min, achat à 20 min | **tardif** |
| Rejouer en un clic | après la découverte : 6 écrans et un formulaire avant la 2e course | **pas tenu** |
| Téléphone | textes des aides et de la jauge écrits pour le clavier ; formulaire avec champ texte en paysage | **pas tenu** (voir § 5) |

Ce qui marche dans les jeux de voiture les plus joués sur Poki (Super Star Car, Drift Hunters, Madalin Stunt Cars, Moto X3M, Rocket Soccer Derby… ; je parle de leurs schémas connus, sans mesure de ma part) : **un seul geste** pour rouler dès la première seconde (tenir = avancer, jamais « lâche puis réappuie ») ; **aucune mécanique de départ** à apprendre ; manche de **30 s à 2 min** ; le **premier gain visible** (pièces, +100, boost) dans les **30 premières secondes** et **quelque chose à acheter dès la 2e manche** ; « Rejouer » ou « Suivant » en un bouton ; sur téléphone, deux pouces et zéro mot. Notre découverte a la bonne durée (3 tours, 6 IA lentes, direction assistée : un enfant finit la course), mais elle commence par la mécanique la plus exigeante du jeu, et la boucle « encore une » n'existe pas avant 20 minutes.

## 4. Où partent les 70 (hypothèse, pas une mesure)

1. **Seconde 10 à 20 : « ma voiture ne part pas » / « Patinage ! »** — le plus gros, parce qu'il touche tous les joueurs qui font le geste naturel (tenir ↑ ou GAZ). Je mettrais la moitié des départs là.
2. **Seconde 4 à 10 : la grille immobile** avec une préparation sans explication et 60 mots : les joueurs de 10–30 s sont déjà en train de juger, et ils voient un écran de texte et une voiture qui ne bouge pas.
3. **Minute 1 à 3 : rien ne récompense** avant le premier dépassement ; sur téléphone, les textes clavier et la voix de synthèse donnent l'impression d'un jeu « pas fait pour moi ».
4. **Minute 4 à 6 : podium (clic) → bravo (clic) → formulaire (6 champs, clavier sur téléphone) → rechargement** : tout joueur qui voulait « rejouer » tombe sur un formulaire.
5. **Minute 6 à 20 : la 2e course** : qualification seul, dernier sur la grille, 9 minutes, 19 voitures — l'inverse d'une 2e manche Poki.

## 5. Ce que le tactile (tactile.js, Codeur 5, tour 51k) change à cette première minute

Lu dans `../Grand Prix Dynasty - codeur 5` (branche `tactile-local`, `f72b613`), captures `tactile-640.png` et `tactile-960.png`.

- **Un écran et une autorisation de plus avant de rouler, sur iPhone** : le bouton « 🎮 Activer le volant » est affiché hors conduite tant qu'on n'a pas répondu (`rafraichir()` : `!conduite && permissionADemander() && V.permission === null`), donc **sur l'écran titre, avant « ▶ Jouer »** ; un appui ouvre la boîte système « Utiliser le mouvement ? ». Un enfant qui tape « Jouer » sans « Activer » part avec le volant en attente : `VOLANT_ATTENTE` 2,5 s sans mesure → mode « boutons », les ◀ ▶ **apparaissent en bas à gauche pendant les feux**, sans un mot. Sur Android, écoute immédiate, le neutre est pris au début de la conduite (`maj()`), c'est bien.
- **Le piège du départ est pire au doigt** : tenir GAZ est le seul geste naturel sur un téléphone (il n'y a pas de « touche à relâcher » dans la tête d'un joueur tactile). `majTactile()` fusionne GAZ dans `JEU.cibles` (`principal.js` du Codeur 5, lignes 2097-2108), donc le même `d.lance === null` tient la voiture tant qu'on ne lâche pas et ne reposes pas le pouce. **Le changement n° 1 ci-dessous doit être fait pour le tactile en même temps.**
- **Tous les textes de la première minute parlent du clavier** : « ↑ accélérer », « ← → tourner », « ↓ freiner » (`textes.js:484`, lus par `majAides`, `interface.js:370-377`), « Tiens ↑ pour garder l'aiguille… réappuie ↑ » (`textes.js:479`, `interface.js:486`), la barre « ↑ ↓ ← → conduire · C caméra · Espace… » (`#aide`, cachée par `body.tactile #aide { display: none }` dans le dernier commit du Codeur 5 ; **elle est encore visible dans `tactile-640.png`**, prise avant ce commit : à revérifier sur la prochaine capture). Le Codeur 5 le note lui-même dans « pas fait » (« une bulle d'aide pour le téléphone : tiens GAZ, incline pour tourner »). Il n'y a pas encore de `tac_aideGaz` / `tac_aideDirection` dans `textes.js`.
- **Le 640×360 est chargé** : dans `tactile-640.png`, ⏸ et ↩ recouvrent le haut du cadre du chrono (« TOUR 1 »), FREIN recouvre la jauge des pneus et le compteur, GAZ est collé au bord ; le Codeur 5 a depuis écarté la vitesse et les pneus (`body.tactile #tableau { right: 282px }`) et déplacé ⏸/↩ sous le son (`f72b613`), à revérifier en capture. Reste : la jauge de départ au centre bas + ses 2 lignes de texte entre FREIN/GAZ et ◀ ▶ ; sur 360 px de haut, ça couvre la piste devant la voiture.
- **Le formulaire du pilote au doigt** : un champ texte (« Nom ») en paysage 640×360 fait monter le clavier virtuel sur plus de la moitié de l'écran ; les listes déroulantes vont, le `<input type="color">` ouvre un sélecteur système. Argument fort pour le changement n° 6.
- **Ce qui aide déjà** : direction assistée allumée en débutant → « il tient GAZ, la voiture suit la piste » (CLAUDE.md) ; les menus réagissent au clic ; « Tourne ton téléphone » en portrait ; pas de survol nécessaire.

## 6. Le plan : 10 changements, classés par effet attendu / coût

Classement : effet sur la première minute d'abord, coût ensuite (P = petit, M = moyen, G = gros). « Accord » : qui tranche (le propriétaire pour une règle de jeu ; le Chef pour un choix réversible dans `donnees.js`).

### 1. Tenir ↑ (ou GAZ) = partir. Jamais une voiture immobile à l'extinction des feux. — effet très fort, coût P

- **Problème** : `depart.js` `commande()` ne lance que sur une nouvelle pression ; `principal.js:2141-2144` met les cibles à zéro tant que `d.lance === null`. Un joueur qui tient ↑ à l'extinction reste à l'arrêt, sans message, et les IA partent. Sur tactile, tenir GAZ est le seul geste possible.
- **Changement** : dans `depart.js`, un réglage `DEPART_TENIR_PART` (vrai par défaut) : si la touche est **tenue** au moment de l'extinction, c'est le lancement, à l'extinction même, avec le résultat `resultat(regime, DEPART_REACTION_PARFAITE + ε)` : « Bon départ » si le régime est dans le vert, sinon patinage/calé comme aujourd'hui. Le lâcher-réappuyer reste la façon d'obtenir le **parfait** (réaction courte). Le faux départ ne change pas. À la découverte en plus : `DEPART_DECOUVERTE_DOUX` (vrai) : jamais de patinage ni de calé (résultat au pire « bon »), pour que la première image soit la voiture qui part avec les autres. Les IA ne changent pas (`tirerIA` intact) : leurs empreintes restent.
- **Mesure (test auto)** : `tests/test.html` : départ tenu à l'extinction → `d.lance === d.extinction`, résultat 'bon' ; régime trop haut tenu → 'patinage' hors découverte, 'bon' en découverte ; lâcher-réappuyer en 0,2 s → toujours 'parfait' (inchangé) ; `DEPART_TENIR_PART` faux = le comportement d'avant au bit près. `tests/ecrans.py` `decouverte()` : un faux joueur qui **tient ↑ dès la grille** (à la place du robot) roule à plus de 5 m/s moins de 1 s après l'extinction. Même scénario dans le test tactile du Codeur 5 (un doigt posé sur GAZ dès la grille).
- **Accord** : **le propriétaire** (c'est sa règle du départ parfait du 2026-10-21 : « si on tenait la touche au moment de l'extinction, il faut d'abord la lâcher »). Réversible par le réglage. À lui proposer en premier.

### 2. La grille de la découverte sans texte : une seule consigne, pas de jauge — effet fort, coût P

- **Problème** : pendant les feux de la découverte : jauge + 2 lignes (`interface.js:479-486`), 3 aides, barre clavier, chrono, secteurs, meilleur tour, radar : ≈ 60 mots, pour un joueur qui n'en lira aucun.
- **Changement** : à la découverte (`JEU.decouverte`), cacher la jauge et son texte (`majDepart` : `tenue && !decouverte`), le chrono/secteurs/meilleur tour (`#hudCourse`), le radar et la barre `#aide` ; garder la tour P4/7, les feux, et **une seule aide** grosse et centrée sous les feux : « Tiens ↑ » (tactile : « Tiens GAZ »), qui devient « ← → pour tourner » après le départ, puis disparaît. Le départ parfait (jauge) reste pour toutes les autres courses, où la bulle 'depart' d'`aides.js` l'explique déjà la première fois.
- **Mesure** : test de capture en découverte, aux deux tailles Poki + 640×360 : nombre d'éléments visibles pendant les feux ≤ 5, aucun mot de plus de 3 lettres hors « Tiens ↑ » et la tour ; le test en pixels existant « rien ne cache la piste devant la voiture ».
- **Accord** : le Chef (interface, réversible ; CLAUDE.md « En piste en 10 secondes » dit « et au départ celle du départ » pour les aides : à amender).

### 3. La carte des IA du circuit `test` livrée dans le zip : plus de « Préparation de la course… » au premier lancement — effet moyen, coût P

- **Problème** : au premier lancement la carte n'est jamais en cache (`cache-carte.js`, `principal.js:2497-2502`) : 2–5 s de « Préparation de la course… » sur la grille avant le premier feu, sur la machine la plus lente (celle d'un enfant à l'école).
- **Changement** : un fichier `cache-carte-test.js` (≈ 34 Ko, l'encodage existant `CACHE_CARTE.encoder`, déterministe depuis le tour 22) chargé par `index.html`, pris par `decoder` comme un cache valide (même clé d'empreinte) ; si la clé ne correspond plus, on calcule en fond comme aujourd'hui. Le test épingle que le fichier est à jour (sinon rouge, et on le régénère par un script dans `tests/`).
- **Mesure** : `tests/premier.py` : `JEU.carteDuCache` vrai au premier lancement, clic → premier feu < 1 s, médiane clic → feux éteints ≈ 6–8 s ; un test moteur : la carte livrée = la carte calculée au bit près.
- **Accord** : personne (technique) ; +34 Ko dans le zip.

### 4. Une récompense visible dans les 60 premières secondes : places gagnées et prime en direct — effet fort, coût M

- **Problème** : la prime n'apparaît qu'à « Bravo » (4 min) ; un dépassement n'est qu'une ligne de commentateur. Rien ne « tombe » à l'écran.
- **Changement** : à la découverte, un compteur **« Prime : 400 € »** près de la tour, qui suit la place en direct (`DECOUVERTE.prime(place)` existe déjà) et **monte** à chaque place gagnée avec une petite animation (+200 €, vert) ; au dépassement du joueur, un gros « P3 ! » au centre pendant 1 s (par `messages.js`). L'argent crédité à la fin ne change pas (même `DECOUVERTE_ARGENT`).
- **Mesure** : `ecrans.py` `decouverte()` : quand le robot gagne une place, l'élément « P3 ! » apparaît moins de 0,5 s après, et le compteur affiche `DECOUVERTE.prime(place)` ; aucune pénalité ni point de championnat n'est touché (tests existants).
- **Accord** : le Chef (affichage ; les montants restent ceux de `donnees.js`).

### 5. Du podium à la carrière en un clic : « Bravo » fusionné dans le podium, bouton bien nommé, enchaînement automatique — effet moyen, coût P

- **Problème** : podium (clic sur « Résultats », qui ne mène pas aux résultats à la découverte, `interface.js:280`) → écran « Bravo » (clic) : deux écrans passifs ; le podium n'avance jamais seul.
- **Changement** : à la découverte, le podium affiche « Tu finis P2 / 7 · +800 € » sous les trois cartes, avec **un seul bouton « Continuer »** (et « D'abord apprendre » en petit) ; sans clic, il passe tout seul après `PODIUM_DECOUVERTE_DUREE` (8 s) ; la section `#bravo` ne sert plus qu'au texte. Partout ailleurs, le bouton du podium s'appelle « Résultats » (inchangé).
- **Mesure** : `decouverte()` : après le podium, sans clic, l'écran suivant arrive en moins de 9 s ; avec un clic, tout de suite ; `SAUVEGARDE.decouverteFaite()` toujours faux avant la création (tests existants).
- **Accord** : le Chef (réversible).

### 6. La création du pilote en un clic, tout facultatif, sans rechargement — effet fort (surtout téléphone), coût M

- **Problème** : 6 champs (`index.html:124-146`), un champ texte (clavier virtuel en paysage), un message d'erreur possible sur le numéro, puis `location.reload()` (`principal.js:918`). C'est l'écran qui suit le moment « j'ai envie de rejouer ».
- **Changement** : l'écran propose **trois pilotes prêts** (nom « Toi » ou un prénom tiré, numéro libre, pays = langue du navigateur, course de cœur tirée, casque tiré parmi les motifs) en grosses cartes, un clic = « C'est parti ! » ; un petit « Personnaliser » ouvre le formulaire d'aujourd'hui. Tout reste modifiable au paddock (« Mon casque » existe ; ajouter nom/numéro/pays dans Réglages → « Mon pilote »). Et remplacer `location.reload()` par `montrerChampionnat()` après `SAUVEGARDE.finirDecouverte()` si l'état le permet (le plateau de la découverte est déjà construit ; sinon garder le rechargement mais **après** avoir affiché le paddock une première fois).
- **Mesure** : `decouverte()` : depuis le podium, **2 clics** mènent au paddock avec un pilote valide (numéro libre, pays dans `PAYS`, course de cœur cohérente avec le pays) ; `tests/recoins.py` : « Mon pilote » change le nom et il est sauvegardé ; en 640×360 tactile, aucun champ texte n'a le focus sans clic du joueur.
- **Accord** : **le propriétaire** pour « trois pilotes prêts » (la création nom/numéro/pays/casque est sa règle de l'étape 6 ; on ne l'enlève pas, on la rend facultative à ce moment). Le rechargement : le Chef.

### 7. La 2e course courte : le premier Grand Prix de carrière en 3 tours, qualification proposée mais pas punie — effet fort, coût P (règle) / M (tests)

- **Problème** : `CHAMPIONNAT_TOURS` 5, fixe ; première course ≈ 9 min contre 19 IA, parti dernier si on passe la qualif (`qualification.js`), sur Bahrayn 5,4 km. Les trois longueurs de CLAUDE.md ne sont pas offertes.
- **Changement** : `DIVISIONS[4].tours = 3` (et 5/12/18 ensuite selon la longueur choisie, quand le choix existera) ; au **premier** Grand Prix seulement, « Passer » place le joueur **au milieu de la grille** comme à la découverte (`DECOUVERTE.tempsMilieu` existe) au lieu de dernier ; la bulle 'qualif' dit « Fais ton tour pour partir plus haut » (texte existant à ajuster).
- **Mesure** : `tests/saison.py` : le GP 1 du robot dure moins de 4 min de jeu ; `tests/test.html` : « Passer » au GP 1 = place médiane, au GP 2 = dernier ; les points et l'argent inchangés par la longueur (test existant).
- **Accord** : **le propriétaire** (longueur « très courte = 5 tours », et la règle « passer = dernier » sont ses règles). Réversible par `donnees.js`.

### 8. Les textes de la première minute écrits pour le doigt quand l'écran est tactile — effet fort sur téléphone, coût P

- **Problème** : `aideGaz/aideDirection/aideFrein` (`textes.js:87, 484`), `departAide` (`textes.js:479`), `aideConduite` parlent de ↑ ← → ↓, Espace, Échap. Sur téléphone, faux à 100 %.
- **Changement** : `tac_aideGaz` « Tiens GAZ », `tac_aideDirection` « Incline le téléphone » (ou « ◀ ▶ » en mode boutons), `tac_aideFrein` « FREIN » ; `majAides` et `majDepart` lisent `TACTILE.estPresent()` (et `TACTILE.etat.mode` pour volant/boutons) pour choisir la clé ; `#aide` reste caché sur tactile. Toutes les bulles d'`aides.js` qui citent une touche (stand « ← → », départ) ont leur variante tactile. À coordonner avec le Codeur 5 (fichiers `textes.js` et `interface.js` : lui a `tactile.js`, `index.html`, `style.css`).
- **Mesure** : le test tactile du Codeur 5 (`test=tactile`, `has_touch`) : sur la grille, `#aideGaz` contient « GAZ », aucun « ↑ » ni « Espace » ni « Échap » visible sur tout l'écran ; `tests/textes.html` : chaque clé `tac_*` existe en fr et en en.
- **Accord** : le Chef (textes, réversible).

### 9. La voix de synthèse réduite tant que la vraie voix n'est pas là : « tes faits » par défaut à la découverte — effet moyen, coût P

- **Problème** : `COMMENTAIRE_MODE` 'tout' et `voix.js` actif par défaut : une voix de synthèse toutes les 2,5 s dès la première minute (robotique sur beaucoup de machines ; le propriétaire lui-même la trouve « plate et casse-oreille »). À la découverte, c'est du bruit par-dessus un joueur qui apprend.
- **Changement** : pendant la découverte seulement, `COMMENTAIRE_MODE` forcé à 'joueur' et la voix de synthèse limitée aux faits du joueur (dépassement, arrivée) ; dès la carrière, le réglage du joueur (par défaut 'tout') revient. Quand les voix enregistrées (`voix-sons.js`) seront choisies, elles pourront parler à la découverte (elles sont courtes et ont de l'énergie).
- **Mesure** : `decouverte()` : `VOIX.parle` (ou le journal de `voix.js`) n'est appelé que pour des faits du joueur ; en carrière, le mode est celui de la sauvegarde.
- **Accord** : **le propriétaire** (il a demandé « presque tout le temps », 2026-11-02) ; je lui propose « presque tout le temps à partir de la carrière, pas pendant les 3 tours de découverte ».

### 10. Un test « première minute » qui joue le nouveau joueur maladroit, pas le robot — effet durable, coût M

- **Problème** : tous les tests du premier lancement utilisent `?robot=1` (départ parfait automatique, trajectoire parfaite) : ils ne peuvent pas voir le piège du n° 1 ni mesurer la première récompense. `tests/premier.py` mesure seulement clic → feux.
- **Changement** : `tests/premier.py` (ou une page `test=novice` d'`ecrans.py`) joue un **novice scripté** : il tient ↑ dès la grille sans jamais lâcher, braque tard, ne lit rien ; on mesure et on épingle : temps clic → voiture à plus de 5 m/s (budget 12 s), temps jusqu'au premier dépassement (budget 90 s), nombre d'éléments visibles pendant les feux (budget du n° 2), nombre de clics podium → paddock (budget 2), temps de jeu du GP 1 (budget 4 min, n° 7), mots visibles sur tactile sans flèche ni touche (n° 8). Chaque budget est un réglage de `donnees.js` ou du test, et un dépassement est rouge.
- **Mesure** : c'est la mesure.
- **Accord** : personne.

### En plus, si le temps le permet (coût P chacun, accord du Chef)

- **11. « Encore une course ? »** sur le podium de la découverte, à côté de « Continuer » : rejoue la découverte (sans prime la 2e fois) ; c'est le « play again » de Poki. Mesure : le 2e passage ne crédite rien et `decouverteFaite` reste faux jusqu'à la création.
- **12. L'écran titre à deux boutons** sur un écran tactile ou sous 700 px de large : « ▶ Jouer » et « Entre amis » ; « Apprendre / Aides / Touches » passent dans ⚙ Réglages du paddock (ils y sont déjà) ; le bouton « 🎮 Activer le volant » d'iPhone se déplace **sur la grille, pendant les feux** (le neutre est repris au départ de toute façon). Mesure : capture du titre en 640×360 tactile : 2 boutons + 🔊.

## 7. Ordre proposé pour le prochain jour de code

1. n° 1 (départ tenu = départ) + n° 10 (le test novice qui le prouve) : un Codeur, `depart.js`, `principal.js`, `tests/premier.py` — à soumettre au propriétaire le matin, coder en réversible sans attendre.
2. n° 2 + n° 8 (la grille sans texte, textes tactiles) : un Codeur, avec le Codeur 5 pour `interface.js` / `textes.js`.
3. n° 5 + n° 6 (podium → carrière en 2 clics, pilotes prêts) : un Codeur, `interface.js`, `index.html`, `principal.js`, `pilote.js`.
4. n° 3, n° 4, n° 7, n° 9 : un Codeur, `donnees.js`, `cache-carte.js`, `messages.js`, `qualification.js`, `voix.js`.

Questions pour le propriétaire (à poser par le Chef) : n° 1 (tenir = partir, « bon départ »), n° 6 (trois pilotes prêts, création facultative à ce moment), n° 7 (premier Grand Prix en 3 tours, « passer » = milieu de grille au GP 1), n° 9 (voix de synthèse réduite pendant la découverte seulement).

Ce que je n'ai pas pu vérifier : aucune mesure réelle d'abandon ; les durées de tour en division 4 (puissance 0,85) sont estimées depuis le tour IA « normal » de 47,9 s sur `test` ; les captures tactiles datent d'avant le dernier commit du Codeur 5 (barre clavier, ⏸/↩).
