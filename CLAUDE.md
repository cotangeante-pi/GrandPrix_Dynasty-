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
- **Le départ** : cinq feux rouges qui s'allument puis s'éteignent. Partir trop tôt, c'est une pénalité de 5 secondes. Le départ se dose et demande du réflexe : voir « Le départ parfait ».
- **Les règles de course sont volontairement simples**, pour ne pas avoir besoin d'un long tutoriel :
  - usure des pneus simple : une seule jauge, la voiture perd un peu d'adhérence quand elle s'use ;
  - **un arrêt au stand obligatoire** en course moyenne et longue, aucun en très courte. C'est là que les améliorations des changeurs de roues comptent ;
  - couper un virage, c'est une pénalité de temps qui s'affiche à l'écran. **Pendant la course, la place est celle de la piste** (la pénalité est seulement affichée à côté) ; **les pénalités s'appliquent à l'arrivée**, au classement final et au podium (décision du propriétaire, 2026-10-21) ;
  - Espace remet la voiture sur la piste, avec quelques secondes de perte ;
  - **après l'arrivée du joueur, « passer » la vue télé finit la course en accéléré** (décision du propriétaire, 2026-10-24) : le reste de la course est vraiment joué, à ×100 (réglage `ARRIVEE_ACCELERE` dans `donnees.js`), sans dessiner chaque pas, de sorte qu'au moment où le podium s'affiche tout le monde a fini. Les places et les temps sont **exactement** ceux qu'on aurait eus en regardant (même graine, mêmes pas de physique : test au bit près). En accéléré, le filet n'est plus `ARRIVEE_ATTENTE_MAX` (90 s, qui couperait une course où les IA ont encore plusieurs tours à faire) : une voiture n'est classée dans l'ordre de course que si elle n'a plus avancé depuis `ARRIVEE_BLOQUEE` secondes de jeu (voiture bloquée), et un plafond de temps réel `ARRIVEE_ACCELERE_MAX_REEL` protège la page (décision du Chef, 2026-10-24) ;
  - **ni météo, ni dégâts, ni drapeaux au début**. Ces règles pourront venir plus tard, chacune comme une étape à part, seulement si le propriétaire le décide.
- **La conduite** : flèches ou WASD/ZQSD, Espace pour revenir sur la piste, C pour la caméra (derrière la voiture, cockpit, télé), Échap pour la pause. En mode 2 joueurs, les touches sont partagées entre les deux joueurs : voir « Le mode 2 joueurs ».
- **La physique est arcade mais crédible** : freinage, adhérence, aspiration derrière une voiture. Elle est écrite par nous, sans moteur physique externe. **Le joueur et les IA ont exactement la même physique.**

## La carrière du joueur

- **Le début** : le joueur choisit **son nom, son numéro et son pays**. Il commence dans **une petite écurie faible** : sa voiture est parmi les moins bonnes de la grille, et il monte grâce aux contrats.
- **Les changements d'écurie** : les **améliorations de l'équipe** (changeurs de roues, etc.) **suivent le joueur**. La **qualité de la F1** appartient à l'écurie : le joueur prend celle de sa nouvelle écurie (le niveau de l'écurie multiplie moteur, aéro et freins de sa voiture, comme le rythme des IA ; `NIVEAU_JOUEUR_ACTIF` dans `donnees.js` pour le couper si la sensation ne va pas ; décision du Chef, 2026-10-23, à essayer par le propriétaire).
- **La fin** : la carrière s'arrête de deux façons :
  - **la retraite anticipée** : le joueur la prend quand il veut, entre deux saisons ;
  - **la retraite par l'âge** : au bout de **15 saisons**, le pilote est trop vieux. Ce nombre est un réglage dans `donnees.js`.

  Dans les deux cas, on passe au bilan de carrière (étape 14), puis on continue la dynastie avec un héritier, ou on en commence une nouvelle (voir « La relève : une vraie dynastie »).

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
- **Les circuits** ressemblent **beaucoup** à de vrais circuits célèbres : on doit les reconnaître au premier coup d'œil (proportions, virages célèbres à leur place, longueur proche ; décision du propriétaire, 2026-10-23, « c'est possible de faire plus ressemblant au vrai ? »). **Les noms restent un peu changés** et il n'y a **aucun logo ni aucune marque**. Par exemple, **Monoco Grand Prix**. Voici les 12 propositions, à approuver par le propriétaire :
  Monoco (Monaco), Silverstoun (Silverstone), Monzo (Monza), Spaa (Spa), Suzuko (Suzuka), Interlagas (Interlagos), Montréol (Montréal), Melbourn Park (Melbourne), Barcelana (Barcelone), Bahrayn (Bahreïn), Singapura (Singapour, de nuit), Yas Marino (Abou Dabi).
  Les 12 tracés refaits d'après la forme des vrais sont dans `circuits-officiels-a.js` et `-b.js` (données seules, pas encore branchés : `vraieLongueur`, `reperes` = les virages célèbres, longueur à ±10 % de la vraie), avec leurs vues de dessus `tests/circuits-a.svg` et `-b.svg` (noms des virages, départ, sens) et l'outil `tests/circuits-outil.py`. **Suzuko se croise (un huit) : c'est le seul croisement permis**, marqué dans les données (`croisement`) ; le pont en 3D vient à l'étape 10. Points faibles connus : l'épingle de Monoco n'est qu'un virage de 108°, Bahrayn et Melbourn Park restent génériques. **Branchés dans le jeu le 2026-10-27** (décision du Chef, le propriétaire ne voulant plus qu'on attende ses accords) : `CALENDRIER_CIRCUITS` = les 12 (Bahrayn, Melbourn Park, Suzuko, Montréol, Monoco, Barcelana, Silverstoun, Spaa, Monzo, Singapura, Interlagas, Yas Marino) ; `?circuit=<nom>` pour chacun ; la course de découverte reste sur `test`.

## Le duel contre le coéquipier

Décidé par le propriétaire le 2026-10-21. **But** : que chaque course compte, même dans une voiture faible. Au début de la carrière, le joueur finit loin (sa voiture est parmi les moins bonnes) ; le coéquipier a **la même voiture**, c'est donc le seul combat à armes égales. On en fait un deuxième championnat, toujours visible.

- **Le coéquipier** est l'autre pilote IA de l'écurie du joueur. Il change si le joueur change d'écurie (ou si le coéquipier part, voir « les rivaux évoluent »). C'est un pilote du groupe fixe des 19 : il garde son nom, son caractère et son historique.
- **Le score du duel**, par saison : **qualifications** (+1 à celui qui part devant) et **course** (+1 à celui qui finit devant, au classement final, pénalités comprises). Un pilote qui n'est pas classé à l'arrivée perd le point de la course. Le score repart de 0 à chaque saison ; le total de carrière contre chaque coéquipier est gardé dans les statistiques (pour l'étape 14).
- **À l'écran** :
  - en course, la ligne du coéquipier est marquée dans la tour de classement (couleur de l'écurie), avec l'écart en temps entre le joueur et lui ;
  - au paddock et après chaque course, le score de la saison : « Toi 4 – 2 Moreau » (qualifs et courses séparées si la place le permet) ;
  - à la fin de la saison, un écran du duel (« Tu as battu Moreau 9 à 3 »), avant les contrats.
- **Ce que ça rapporte** :
  - un **bonus d'argent** quand le joueur finit devant son coéquipier (montant dans `donnees.js`, comme tous les gains) ;
  - **les contrats** (étape 9) : les écuries regardent les points du joueur **et** son duel contre le coéquipier. Battre nettement son coéquipier dans une petite écurie doit pouvoir valoir une offre d'une écurie plus forte, même sans podium. Le poids du duel dans la note du joueur est un réglage de `donnees.js`.
- **Les consignes d'équipe** (par radio, un message de course) :
  - quand les deux pilotes de l'écurie se suivent de près, que celui de derrière est nettement plus rapide (rythme mesuré sur les derniers tours, pas une triche) et que ça ne coûte rien à l'écurie, l'écurie peut demander à celui de devant de laisser passer. Au plus **une consigne par course** ;
  - **si la consigne vise le joueur** : il a quelques secondes pour la suivre (laisser passer) ou l'ignorer. La suivre : sa **confiance** dans l'écurie monte ; l'ignorer : elle baisse. La confiance pèse un peu sur les contrats et elle est sauvegardée. Le message dit clairement ce qui est demandé et ce qu'on risque, avec les mêmes touches que la conduite (aucune touche nouvelle à apprendre) ;
  - **si la consigne vise le coéquipier** (le joueur est derrière et plus rapide) : le coéquipier laisse passer, sauf si son caractère le pousse à refuser (réglage par pilote dans `donnees.js`, à côté des autres traits) ;
  - un point du duel n'est jamais rendu : la place à l'arrivée compte, consigne ou pas.
- **Le caractère du coéquipier réagit** : s'il perd souvent le duel, il devient un peu plus agressif contre le joueur en piste (plus dur à doubler, défense plus serrée), et il se souvient des consignes refusées par le joueur. Ce n'est **jamais** de la triche : même physique, mêmes règles, mêmes informations (voir « Les IA des adversaires »). Le changement est un petit décalage de ses réglages, avec un plafond dans `donnees.js`.
- **Code** : le duel est du calcul pur, sans écran (règle « le moteur ne touche pas à l'écran »), dans le module du championnat ; il passe par la sauvegarde unique. Tous les textes dans `textes.js`, en anglais et en français.
- **Tests** : le score (qualifs, course, non classé, pénalités qui inversent l'ordre), la remise à 0 en début de saison, le bonus d'argent, l'effet du duel sur les contrats, au plus une consigne par course, le coéquipier qui obéit ou refuse selon son caractère, le plafond du changement de caractère, et la sauvegarde.
- **Quand** : le score et son affichage arrivent avec **l'étape 6** (championnat) ; le bonus d'argent avec **l'étape 8** ; l'effet sur les contrats et l'écran de fin de saison avec **l'étape 9** ; les consignes d'équipe et la réaction du caractère en dernier, après l'étape 9, comme un tour à part.

## Le fantôme du meilleur tour

Décidé par le propriétaire le 2026-10-21. **But** : que les qualifications apprennent à piloter. Seul sur la piste, le joueur ne sait pas où il perd du temps ; le fantôme le lui montre, virage par virage. C'est la règle d'or (« c'est le pilotage qui fait gagner ») rendue visible.

- **Ce que c'est** : pendant le tour chronométré des qualifications, une voiture transparente rejoue **le meilleur tour du joueur sur ce circuit** (toutes saisons confondues, toutes longueurs de course confondues, puisque c'est un tour seul).
- **Seulement en qualifications** (et dans les courses seules de l'étape 3, s'il n'y a pas d'autre voiture). **Jamais en course** : la règle « pas de voitures fantômes » des IA reste entière. Le fantôme n'a **aucun contact**, aucune aspiration, et les IA ne le voient pas (il n'entre pas dans `voituresVues`). Il ne change rien au chrono ni à la physique : il est seulement dessiné.
- **L'enregistrement** : pendant chaque tour chronométré du joueur, on note sa position et son cap à pas réguliers (par exemple tous les 0,05 s ; le pas est un réglage de `donnees.js`). Si le tour bat le record du circuit, l'enregistrement remplace l'ancien. Un tour avec un virage coupé ne devient **jamais** le record ni le fantôme.
- **Le rejeu** : le fantôme part avec le joueur sur la ligne et avance au même chrono ; entre deux points enregistrés, on interpole la position et le cap. Il est légèrement transparent, dans une couleur neutre, et on peut le masquer (réglage dans le menu pause, sauvegardé).
- **L'écart en direct** : sous le chrono, l'écart avec le fantôme (« −0,34 » en vert si le joueur est plus rapide, « +0,12 » en rouge sinon), mis à jour **en continu**, pas seulement aux secteurs. Il se calcule en calcul pur : à une même distance parcourue sur la piste, la différence de temps entre le joueur et l'enregistrement.
- **Après le tour** : « nouveau record ! » et le temps gagné, ou l'écart final avec le record.
- **Plus tard (pas maintenant)** : le fantôme du poleman (rejouer contre le tour de qualification du pilote IA en pole). Ça demanderait de simuler son tour, ce qui n'est pas fait aujourd'hui (voir « Les qualifications »), donc c'est à décider par le propriétaire.
- **Code** : l'enregistrement, le rejeu et l'écart sont du calcul pur, sans Three.js, testés seuls ; seul l'affichage de la voiture transparente est dans la 3D. **L'enregistrement des positions est le même code que celui du résumé vidéo (étape 13)** : on l'écrit une fois, dans un fichier à lui, et il sert aux deux. Le fantôme passe par la sauvegarde unique : un enregistrement par circuit, compact (nombres arrondis), et la taille d'un fantôme est mesurée et notée dans `SUIVI.md` pour ne pas remplir le localStorage. Tous les textes dans `textes.js`.
- **Tests** : un tour enregistré puis rejoué repasse aux mêmes positions ; l'écart vaut 0 quand on rejoue contre soi-même ; un tour plus lent ne remplace pas le record ; un tour avec virage coupé n'est jamais gardé ; le fantôme n'apparaît pas en course et n'est vu par aucune IA ; la sauvegarde garde le fantôme et une ancienne sauvegarde sans fantôme se charge sans erreur.
- **Quand** : avec **l'étape 5** (les qualifications). Si l'étape 5 est déjà finie quand on y arrive, c'est un tour à part, juste après.

## L'interview d'après course

Décidé par le propriétaire le 2026-10-21. **But** : donner une voix au joueur et une mémoire aux rivaux. Les 19 pilotes ont un nom et un caractère, mais le joueur ne leur « parle » jamais ; l'interview crée des histoires entre deux courses, sans toucher à la conduite.

- **Quand elle a lieu** : après le podium et les résultats, avant le retour au paddock. **Une question par Grand Prix**, au plus. On peut la passer (bouton « pas de commentaire », sans effet). Elle n'a jamais lieu pendant une course.
- **La forme** : un journaliste (inventé), une question, **trois réponses** sous forme de boutons, chacune avec un ton visible par une icône (😤 provocant, 🤝 calme, 😏 malin). Pas de texte à taper. Après le choix, une ligne dit l'effet principal (« Garcia n'a pas aimé »).
- **Les questions viennent de la course** : on choisit la plus marquante parmi les faits que le moteur connaît déjà, dans cet ordre de priorité (réglable dans `donnees.js`) : victoire ou podium, gros contact avec un pilote nommé, dépassement décisif, pénalité, duel gagné ou perdu contre le coéquipier, consigne d'équipe ignorée, série de mauvais résultats, résultat moyen (question générale). Chaque question a plusieurs formulations, tirées par `hasard()`, pour ne pas lire deux fois la même phrase de suite.
- **La réputation** : trois jauges sauvegardées, de 0 à 100, qui partent de 50 : **le public**, **l'écurie**, **les sponsors**. Chaque réponse fait bouger une ou deux jauges d'un petit pas (valeurs dans `donnees.js`). Elles pèsent un peu :
  - **les sponsors** : sur les offres et les montants (étape 9) ;
  - **l'écurie** : sur la confiance de l'écurie (la même que pour les consignes d'équipe, voir « Le duel contre le coéquipier ») et sur les contrats ;
  - **le public** : il est affiché (et pourra servir plus tard, par exemple au temple de la renommée de l'étape 14).

  Elles aident un peu, jamais beaucoup : **c'est toujours le pilotage qui fait gagner**. Chaque effet a un plafond dans `donnees.js`.
- **Les rivaux se souviennent** : une réponse provocante contre un pilote nommé en fait ta **bête noire** pendant quelques courses (nombre dans `donnees.js`). Pendant ce temps, il est un peu plus agressif contre le joueur (attaque et défense, petit décalage de ses réglages, avec un plafond), **jamais de triche** : même physique, mêmes règles, mêmes informations (voir « Les IA des adversaires »). Une réponse calme peut au contraire apaiser une rivalité en cours. La **fiche du rival** montre la rivalité et la dernière phrase dite sur lui (« “Il conduit comme un dangereux.” — Monzo, saison 2 »).
- **Code** : le choix de la question, les effets des réponses, la réputation et les rivalités sont du calcul pur, dans un fichier à lui, sans écran, testés seuls. L'écran est dans `interface.js`. Tout passe par la sauvegarde unique. **Toutes les questions et réponses sont dans `textes.js`**, en anglais et en français ; les phrases utilisent le nom du pilote et du circuit (`texte(cle, {pilote, circuit})`).
- **Poki** : l'interview est un menu (`gameplayStop`). Une pause pub entre deux Grands Prix (`commercialBreak`) se place **après** l'interview et la une du journal (voir « La une du journal »), jamais au milieu.
- **Tests** : la bonne question est choisie pour chaque fait (et la priorité est respectée quand il y en a plusieurs) ; chaque réponse a l'effet prévu ; les jauges restent entre 0 et 100 ; les plafonds tiennent ; une rivalité s'arrête après le bon nombre de courses ; « pas de commentaire » ne change rien ; toutes les clés existent dans les deux langues ; une ancienne sauvegarde sans réputation se charge sans erreur (jauges à 50).
- **Quand** : un tour à part **après l'étape 6** (il faut les rivaux fixes, leurs fiches et la sauvegarde) ; les effets sur l'argent et les sponsors arrivent avec **l'étape 8** et **l'étape 9**.

## Le réglage de l'aileron

Décidé par le propriétaire le 2026-10-21. **But** : que chaque circuit se pilote différemment, pas seulement qu'il soit différent à regarder. Une seule décision avant chaque Grand Prix, sans tutoriel.

- **Un seul curseur : l'aileron**, de « bas » à « haut » (5 crans ; le nombre de crans est un réglage de `donnees.js`).
  - **haut** : plus d'adhérence dans les virages, mais plus de traînée, donc moins de vitesse de pointe en ligne droite ;
  - **bas** : moins de traînée, plus de vitesse de pointe, mais moins d'adhérence dans les virages.
  - Le cran du milieu est le réglage neutre : la voiture d'aujourd'hui, sans aucun changement.
- **C'est un échange, jamais un bonus** : ce qu'un cran donne d'un côté, il le reprend de l'autre. Le réglage ne compte **pas** dans le plafond de +7 % des améliorations, parce qu'il ne rend pas la voiture meilleure, seulement différente. Les effets par cran (adhérence, traînée) sont dans `donnees.js`, et un test vérifie que, sur le circuit `test`, aucun cran n'est plus rapide que les autres de plus d'une petite marge (réglage dans `donnees.js`) avec le robot d'essai : il n'y a pas de « bon réglage pour tout ».
- **Où on le règle** : dans le garage, avant chaque Grand Prix (avant les qualifications). Le réglage est gardé pour les qualifications et la course ; on ne le change pas au stand. Il est sauvegardé par circuit : en revenant sur un circuit la saison suivante, on retrouve son dernier réglage.
- **L'écran** :
  - le curseur, une petite vue de la voiture dont l'aileron monte ou descend, et deux barres qui bougent : « virages » et « vitesse » ;
  - **la carte de la prochaine course** : le tracé du circuit vu d'en haut (dessiné depuis les échantillons de `circuits.js`, en canvas 2D comme `radar.js`, pas en Three.js), avec la ligne de départ, le sens de la course, le nom du circuit et sa longueur. C'est au joueur de lire la carte et de décider (beaucoup de virages serrés ou de longues lignes droites) ;
  - **aucun conseil** : ni ingénieur, ni réglage recommandé, ni texte qui dit quoi choisir (décision du propriétaire).
- **Les IA règlent aussi leur voiture**, avant chaque Grand Prix, avec la même règle et les mêmes effets. Chaque pilote choisit selon le circuit (ce qu'il sait de la piste : la part de virages lents et de lignes droites, calculée depuis la carte de `ia.js`) et selon son caractère (un pilote agressif en attaque penche vers l'aileron bas pour doubler en ligne droite ; un pilote régulier vers l'aileron haut). Une part de `hasard()` évite que tous choisissent pareil. Ce n'est **jamais** de la triche : mêmes effets que le joueur.
- **Code** : les effets du réglage sont dans `physique.js` (un facteur d'adhérence et un facteur de traînée lus dans l'état de la voiture), le même code pour le joueur et les IA. Le choix des IA est du calcul pur, testé sans écran. Tous les textes dans `textes.js`.
- **Tests** : le cran du milieu donne exactement la physique d'avant ; un cran haut a plus d'adhérence et moins de vitesse de pointe, un cran bas l'inverse ; aucun cran ne domine (voir plus haut) ; les IA choisissent un aileron plus haut sur un circuit de virages que sur un circuit de lignes droites, en moyenne sur plusieurs graines ; le réglage par circuit est sauvegardé ; une ancienne sauvegarde sans réglage se charge au cran du milieu ; la carte se dessine pour chaque circuit sans erreur.
- **Quand** : avec **l'étape 8** (le garage). Les choix des IA selon leur caractère peuvent venir dans le même tour ou juste après.

## La une du journal

Décidé par le propriétaire le 2026-10-21. **But** : donner une histoire à la carrière (le jeu s'appelle *Dynasty*). Les points et les places disent ce qui s'est passé ; la une le **raconte**, pour qu'on s'attache à son pilote. Elle ne touche jamais à la course ni à l'équilibre.

- **Quand** : après chaque Grand Prix, dans cet ordre : podium → résultats → interview d'après course → **une du journal** → (pause pub éventuelle) → paddock. On peut la passer d'un clic.
- **La page** : un journal sportif inventé (nom inventé, dans `textes.js`, jamais un vrai journal), avec :
  - **un grand titre** et **un petit texte de deux lignes** sur le fait le plus marquant de la course pour le joueur ;
  - **une « photo »** : une image dessinée par le code au moment de l'afficher (le podium 3D de la course avec les couleurs des écuries, ou la voiture du joueur), jamais une capture enregistrée ;
  - **deux ou trois brèves** sur les rivaux, sur le côté ;
  - en bas, le haut du classement du championnat (les 5 premiers et le joueur).
- **Le grand titre vient des faits** que le moteur connaît déjà, choisi par priorité (réglable dans `donnees.js`) : titre de champion, première victoire, victoire, premier podium, podium, record (meilleur résultat de carrière), duel contre le coéquipier gagné ou perdu nettement, phrase de l'interview (la réponse provocante devient un titre, et le rival « répond »), gros contact, pénalité qui coûte une place, série de mauvais résultats, le leader du championnat qui s'envole. Quand le joueur n'a rien fait de marquant, le titre parle du vainqueur de la course ou du championnat. **Chaque fait a plusieurs titres possibles**, tirés par `hasard()`, et on ne reprend pas le même titre deux courses de suite.
- **Le ton** : celui d'un vrai journal sportif, enthousiaste ou piquant, jamais méchant ni moqueur envers le joueur. Les titres utilisent les noms des pilotes, des écuries et des circuits (`texte(cle, {pilote, ecurie, circuit, place})`).
- **Les brèves** parlent des rivaux, à partir des faits du moteur : un rival en grande forme, un pilote âgé proche de la retraite, une écurie qui progresse, et des **rumeurs de transfert** pour la fin de saison. Les rumeurs viennent des intentions calculées par le module des saisons (étape 9) ; une rumeur peut se révéler fausse, avec un taux dans `donnees.js`, mais jamais toutes. Une brève ne donne **aucune information cachée de course** (rien sur les réglages ni la stratégie des IA pour la prochaine course).
- **La fin de saison** : une une spéciale, celle du champion (« CHAMPION ! » si c'est le joueur), avant les contrats.
- **L'album de carrière** : chaque une est gardée, sous forme **compacte** (la clé du titre, ses paramètres et de quoi redessiner la photo, jamais le texte ni l'image eux-mêmes), dans la sauvegarde unique. On le feuillette depuis le paddock, saison par saison. La taille de l'album après une carrière de 15 saisons est mesurée et notée dans `SUIVI.md`, pour ne pas remplir le localStorage.
- **Code** : le choix du titre, des brèves et ce qui est rangé dans l'album sont du calcul pur, dans un fichier à lui, sans écran, testés seuls. L'affichage est dans `interface.js` (la page en HTML et CSS, avec son propre style de journal). **Tous les titres et toutes les brèves sont dans `textes.js`**, en anglais et en français.
- **Poki** : la une est un menu (`gameplayStop`). La pause pub entre deux Grands Prix (`commercialBreak`) vient **après** la une, jamais au milieu.
- **Tests** : le bon titre pour chaque fait, et la priorité quand il y en a plusieurs ; pas deux fois le même titre de suite ; une rumeur fausse ne l'est pas toujours (taux respecté sur plusieurs saisons simulées) ; l'album garde chaque une et se redessine pareil après rechargement ; toutes les clés existent dans les deux langues ; une ancienne sauvegarde sans album se charge sans erreur.
- **Quand** : un tour à part **après l'étape 6** (il faut les rivaux, les classements et la sauvegarde) ; les titres sur l'interview et le coéquipier quand ces parties existent ; les rumeurs de transfert avec **l'étape 9** ; l'album complet dans le bilan de carrière de **l'étape 14**.

## Le casque du pilote (et le volant en vue cockpit)

Décidé par le propriétaire le 2026-10-21. **But** : que le joueur soit **reconnaissable** et s'attache à son pilote. La voiture a les couleurs de l'écurie (la même que celle du coéquipier, et elle change avec l'écurie) ; le casque, lui, appartient au pilote et le suit toute sa carrière. Les rivaux aussi deviennent reconnaissables d'un coup d'œil.

- **L'éditeur** : à la création du pilote (étape 6), après le nom, le numéro et le pays. Un **motif** (bandes, étoile, flammes, damier, éclair… la liste est dans `donnees.js`) et **trois couleurs**. Le casque tourne en 3D pendant qu'on le modifie. On peut le changer plus tard depuis le paddock, entre deux courses.
- **Les rivaux** ont chacun leur casque, tiré une fois pour toutes par `hasard()` à la création du groupe des 19 pilotes, et sauvegardé avec eux. Deux pilotes n'ont jamais le même casque (motif et couleurs). Un nouveau pilote qui arrive entre deux saisons reçoit le sien.
- **Où on le voit** :
  - **en course**, sur la tête du pilote, dans la vue **derrière** (le haut et l'arrière du casque dépassent du cockpit) et dans la vue **télé** ;
  - les casques des rivaux, dans toutes les vues, sur les voitures autour ;
  - **en petite icône** à côté de chaque nom dans la tour de classement, dans les résultats et sur la fiche des rivaux ;
  - sur le **podium 3D**, sur la photo de **la une du journal** et dans l'**album**.
- **La vue cockpit : le volant.** En vue cockpit, on ne voit pas son propre casque (il est déjà caché aujourd'hui dans `voiture3d.js`). À la place, on voit :
  - **un volant** fait par le code, en bas de l'image, qui **tourne avec la direction** (le même angle que les roues avant, avec un facteur d'affichage dans `donnees.js`) ;
  - **les deux gants** du pilote posés dessus, **aux couleurs et au motif du casque** : c'est ainsi que l'identité du joueur se voit même en cockpit ;
  - **un petit écran au milieu du volant** avec le rapport et la vitesse (lus dans `boite.js`, comme l'affichage d'aujourd'hui). En vue cockpit, le rapport et la vitesse quittent l'interface HTML et ne sont plus que sur le volant ; dans les autres vues, rien ne change.
  - Le volant reste **assez bas pour ne jamais cacher la piste** ni le virage qui arrive : un test de capture vérifie que la moitié haute de l'image n'a aucun pixel du volant, aux deux tailles Poki (960×600 et 1280×720).
- **Les déblocages** : de nouveaux motifs se gagnent par des exploits de carrière (première victoire, premier titre, 10 podiums, une saison gagnée contre son coéquipier… la liste et les conditions sont dans `donnees.js`). Un motif bloqué est montré grisé avec sa condition. **Ce sont des motifs, jamais de la vitesse** : un casque ne change rien à la physique. Les déblocages sont sauvegardés et **survivent à une nouvelle carrière**.
- **Performance** (20 voitures) : le casque reste une forme simple faite par le code (la sphère d'aujourd'hui, avec une visière). Les motifs sont dessinés **une seule fois** par le code dans **une petite texture partagée** (un atlas en canvas, tous les motifs dedans), avec **un seul matériau** pour tous les casques ; chaque pilote a ses couleurs et sa case de l'atlas, sans créer un matériau par voiture. On mesure les appels de dessin avant et après (`?debug=1`) et on note la mesure dans `SUIVI.md`.
- **Code** : la description d'un casque (motif + trois couleurs) et les déblocages sont du calcul pur, dans `donnees.js` et le module du championnat, testés sans écran ; le dessin est dans `voiture3d.js` (casque, volant, gants) et `camera.js` (ce qui est montré ou caché selon la vue). L'icône 2D de la tour est dessinée depuis la même description. Tout passe par la sauvegarde unique. Les noms des motifs et les textes des déblocages sont dans `textes.js`.
- **Tests** : deux pilotes n'ont jamais le même casque ; le casque du joueur et ceux des rivaux sont gardés après rechargement ; une ancienne sauvegarde sans casque se charge avec un casque tiré pour chacun ; un motif se débloque exactement à sa condition et reste débloqué dans une nouvelle carrière ; le volant tourne dans le bon sens et revient au centre ; le volant ne monte jamais dans la moitié haute de l'image ; en vue cockpit, rapport et vitesse ne sont affichés qu'une fois.
- **Quand** : l'éditeur et les casques des rivaux avec **l'étape 6** (création du pilote) ; le volant en vue cockpit dans un tour à part, quand le propriétaire veut (il peut l'essayer seul) ; les déblocages quand les statistiques de carrière existent (étape 6), et l'affichage final soigné avec **l'étape 11**.

## Le Grand Prix à domicile

Décidé par le propriétaire le 2026-10-21. **But** : donner un sens au choix du pays et un moment fort à chaque saison. Les 12 Grands Prix valent les mêmes points ; un seul est « chez soi », et c'est celui qu'on attend.

- **Quel circuit** : chaque circuit est lié à un pays (le pays du vrai circuit dont il s'inspire : Monoco → Monaco, Silverstoun → Royaume-Uni, Monzo → Italie, Spaa → Belgique, Suzuko → Japon, Interlagas → Brésil, Montréol → Canada, Melbourn Park → Australie, Barcelana → Espagne, Bahrayn → Bahreïn, Singapura → Singapour, Yas Marino → Émirats arabes unis). Ce lien est dans `donnees.js`, à côté de chaque circuit.
  - Si le pays du joueur a un circuit, c'est **son Grand Prix à domicile**.
  - Sinon (la France, par exemple, n'en a pas), le joueur choisit à la création sa **course de cœur** parmi les 12, juste après son pays. Elle se comporte exactement comme un Grand Prix à domicile.
  - Le choix est gardé pour toute la carrière, dans la sauvegarde unique.
- **Les points ne changent pas** : le Grand Prix à domicile vaut les mêmes points que les autres. La physique, les IA et les règles sont **exactement les mêmes**. Rien ne rend le joueur plus rapide chez lui : c'est toujours le pilotage qui fait gagner.
- **Ce qui change** :
  - **le calendrier** marque ce Grand Prix d'un 🏠, toute la saison ;
  - **le public** : dans les tribunes (étape 10), une part des spectateurs porte les **couleurs du pays du joueur** (drapeaux), et quelques **banderoles** affichent son nom et son numéro (« ALLEZ 27 ! »). C'est un changement de couleurs sur le public déjà prévu, fait par le code, sans nouveau modèle et sans coût de performance mesurable (mesuré et noté dans `SUIVI.md`) ;
  - **avant le départ**, la caméra de la grille passe une fois devant une tribune de supporters du joueur ;
  - **les sponsors** proposent un objectif spécial pour cette course (par exemple « podium à domicile : prime doublée »), avec son montant et son plafond dans `donnees.js` (étapes 8 et 9) ;
  - **l'interview d'après course et la une du journal** ont leurs propres questions et titres pour cette course (« Tout un pays derrière lui », « Déception à domicile »), prioritaires sur les faits ordinaires, mais pas sur un titre de champion. Tous les textes dans `textes.js`.
- **Le palmarès** : un record à part, « meilleur résultat à domicile », dans les statistiques de carrière (étape 6, pour l'étape 14). **Gagner à domicile** est un exploit de carrière qui débloque un motif de casque (voir « Le casque du pilote »).
- **Plus tard, si le propriétaire le veut** : un Grand Prix à domicile pour les rivaux aussi (leurs nationalités sont inventées, il faudrait d'abord les relier aux pays des circuits).
- **Code** : le lien circuit ↔ pays, le choix de la course de cœur, l'objectif spécial et le record sont du calcul pur, testés sans écran ; le public et la caméra de la grille sont dans la 3D, qui lit seulement l'état.
- **Tests** : un joueur d'un pays qui a un circuit a ce circuit comme Grand Prix à domicile ; un joueur d'un pays sans circuit doit choisir sa course de cœur ; le choix est gardé après rechargement ; une ancienne sauvegarde sans ce choix se charge sans erreur (et la course de cœur est demandée une fois) ; les points et la physique sont identiques à domicile et ailleurs ; l'objectif spécial n'apparaît que pour cette course ; le record à domicile et le déblocage du motif marchent.
- **Quand** : le lien circuit ↔ pays, la course de cœur, le 🏠 du calendrier et le record avec **l'étape 6** ; l'objectif des sponsors avec **les étapes 8 et 9** ; le public et la caméra avec **l'étape 10**, circuit par circuit ; les titres et questions quand l'interview et la une existent.

## Le départ parfait

Décidé par le propriétaire le 2026-10-21. **But** : faire du départ un moment de tension et de pilotage, à chaque course, quelle que soit sa longueur. Aujourd'hui (la règle de « La course »), il n'y a que « à l'heure » ou « trop tôt » ; ici, le départ demande du **dosage** et du **réflexe**, et il peut faire gagner ou perdre plusieurs places au premier virage.

- **Les commandes** (aucune touche nouvelle, la même touche que l'accélérateur : ↑, W ou Z) :
  1. **Pendant que les feux s'allument**, la voiture est tenue sur place. La touche d'accélérateur fait monter le **régime** (l'aiguille du compte-tours) quand on la tient, et le fait redescendre quand on la lâche. Une **zone verte** est marquée sur la jauge : il faut y garder l'aiguille, en dosant (tenir, lâcher, reprendre).
  2. **Quand les feux s'éteignent**, on **lâche puis on réappuie** l'accélérateur le plus vite possible : le moment où on réappuie, c'est le moment où on « lâche l'embrayage ». Si on tenait la touche au moment de l'extinction, il faut d'abord la lâcher ; si on ne la tenait pas, il suffit d'appuyer.
- **Le résultat** dépend de deux choses, calculées au moment où on réappuie :
  - **le régime** à cet instant : dans la zone verte, trop haut (au-dessus) ou trop bas (en dessous) ;
  - **le temps de réaction** : le temps entre l'extinction des feux et l'appui.

  | Résultat | Quand | Effet (valeurs dans `donnees.js`) |
  |---|---|---|
  | 🟢 **Départ parfait** | régime dans le vert et réaction rapide | l'accélération normale de la voiture, sans perte |
  | 🟡 **Bon départ** | régime dans le vert mais réaction moyenne, ou régime juste au bord du vert | une petite perte |
  | 🔴 **Patinage** | régime trop haut | les roues patinent : moins d'accélération pendant un court moment |
  | 🔴 **Calé** | régime trop bas | la voiture part au ralenti pendant un court moment |
  | ⛔ **Faux départ** | appui **avant** l'extinction des feux, ou réaction plus rapide qu'un humain (anticipation, seuil dans `donnees.js`, par exemple 0,1 s) | la voiture part, mais la pénalité de 5 secondes de « La course » s'applique (à l'arrivée, comme toutes les pénalités) |

  **Un départ parfait n'est pas un bonus** : c'est la voiture normale. Les autres résultats font **perdre** du temps. Rien ne rend la voiture plus rapide que ce qu'elle est.
- **L'affichage** : pendant les feux, la jauge du régime avec sa zone verte, au centre bas de l'écran (assez grande pour être lue sans quitter les feux des yeux) ; après l'appui, le résultat pendant une seconde (« Départ parfait ! ») et le temps de réaction (« 0,21 s »). Le meilleur temps de réaction de la carrière est un record (statistiques de l'étape 6). En vue cockpit, la jauge peut être sur l'écran du volant (voir « Le casque du pilote »), si ça reste lisible.
- **Les IA font aussi leur départ**, avec **la même règle et les mêmes effets** : chaque IA a un régime au moment de partir et un temps de réaction, tirés par `hasard()` selon son caractère (la régularité et le taux d'erreurs : le régulier part presque toujours bien, le rapide qui fait des fautes rate parfois, et peut caler). Le temps de réaction d'une IA est toujours dans des bornes humaines (minimum et maximum dans `donnees.js`), jamais plus rapide que le seuil d'anticipation, sauf un faux départ volontairement rare (taux dans `donnees.js`). **Aucune IA ne voit les feux plus tôt** que le joueur.
- **Code** : le départ est du calcul pur, dans `course.js` (ou un fichier à lui s'il grossit) : le régime de départ, la zone verte, le temps de réaction, le résultat, et l'effet sur l'accélération pendant les premières secondes (lu par `physique.js`, le même pour le joueur et les IA). **Ce régime n'est pas celui de `boite.js`**, qui reste un affichage ; la jauge de départ lit le régime de départ du moteur. Tous les textes dans `textes.js`.
- **La sensation est à essayer par le propriétaire** (comme la conduite, étape 2) : la vitesse de montée de l'aiguille, la largeur de la zone verte et la sévérité du patinage se règlent dans `donnees.js` (et dans `?reglages=1`) après ses retours. Le Chef ne les juge pas seul.
- **Tests** : régime dans le vert + réaction rapide = départ parfait, et une accélération identique à la voiture normale ; régime trop haut = patinage ; trop bas = calé ; appui avant l'extinction ou trop rapide = faux départ et pénalité de 5 s à l'arrivée ; tenir la touche pendant l'extinction ne lance pas la voiture tant qu'on ne l'a pas lâchée ; sur 50 courses simulées, les IA régulières ratent moins de départs que les IA qui font des fautes ; aucune IA ne réagit sous le minimum humain hors faux départ ; le record du temps de réaction est sauvegardé.
- **Quand** : avec **l'étape 5** (la grille, les feux et le faux départ). Si l'étape 5 est déjà finie, c'est un tour à part, juste après.

## La relève : une vraie dynastie

Décidé par le propriétaire le 2026-10-21. **But** : donner son sens au nom du jeu. Aujourd'hui, une carrière finie, on recommence à zéro, comme si rien ne s'était passé. Avec la relève, la fin d'une carrière est **le début de la génération suivante**, dans le même monde, et on s'attache à une famille, pas seulement à un pilote.

- **Le choix à la fin d'une carrière** (après le bilan de l'étape 14) :
  - **« Continuer la dynastie »** : on joue l'héritier du pilote, **dans le même monde** (mêmes écuries, mêmes rivaux encore en activité, l'histoire continue à la saison suivante) ;
  - **« Nouvelle dynastie »** : un nouveau monde, comme aujourd'hui. L'ancienne dynastie reste dans le temple de la renommée.
- **L'héritier** : le joueur choisit son **prénom** (le **nom de famille est gardé**), son **numéro**, son **lien** avec le pilote précédent (**fils**, **fille**, **protégé** ou **protégée** ; ce choix sert seulement aux textes) et son **casque** (voir « Le casque du pilote »). L'éditeur propose de partir du casque du parent (mêmes couleurs, motif à changer), sans l'imposer. Le pays est gardé par défaut, et on peut le changer (avec, si besoin, une nouvelle course de cœur : voir « Le Grand Prix à domicile »).
- **L'héritier ne va pas plus vite** : il repart d'**une petite écurie faible**, comme tout premier pilote. **C'est toujours le pilotage qui fait gagner.** Il hérite seulement de petites choses, toutes avec un plafond dans `donnees.js` :
  - **la réputation** : ses jauges de départ (voir « L'interview d'après course ») partent un peu plus haut si la famille a gagné des titres ;
  - **les motifs de casque** déjà débloqués (ils le sont déjà pour toutes les carrières) ;
  - **un peu plus d'attention** : une écurie moyenne peut lui faire une offre un peu plus tôt (poids dans `donnees.js`), jamais une grande écurie dès la première saison.
- **Le monde se souvient** :
  - **les rivaux** qui ont couru contre le parent le disent (dans l'interview, la une, la fiche du rival : « J'ai couru contre Marco Rossi. Il ne lâchait jamais rien. ») ; leur historique contre la famille est gardé ;
  - **la une du journal** a ses titres de relève : « Le fils de Rossi débarque », « Elle égale les 3 titres de la famille ! », « Trois générations de champions » ;
  - **les anciens rivaux** retraités du parent deviennent des **patrons d'écurie** ou des **consultants** : seulement des **noms** dans les textes (offres de contrats signées de leur nom, phrases dans le journal), **aucune règle nouvelle**.
- **Les textes et le genre** : le jeu ne demande pas le genre du pilote. Les textes qui parlent **du pilote précédent** l'appellent par son nom et sont écrits pour ne pas avoir besoin de son genre (pas de « ton père », « ta mère », « il », « elle » à son sujet). Les textes qui parlent **de l'héritier** utilisent le lien choisi par le joueur (« le fils de… », « la protégée de… »). Tous dans `textes.js`, en anglais et en français, avec les accords pour chaque lien.
- **L'arbre de la dynastie** : un écran (depuis le paddock et dans le bilan de carrière) qui montre chaque génération : prénom, casque, saisons, titres, victoires, podiums, meilleur résultat à domicile. **Les records de famille** : titres de la dynastie, victoires de la famille par circuit, nombre de générations championnes. Le **temple de la renommée** (étape 14) classe les dynasties entre elles.
- **La sauvegarde** : un monde qui continue sur plusieurs générations doit rester léger. Les pilotes retraités (rivaux et membres de la famille) ne gardent qu'un **résumé compact** (nom, casque, totaux, titres par saison), et non plus leur historique course par course. Le nombre de générations n'est pas limité, mais la taille de la sauvegarde après 3 générations de 15 saisons est mesurée et notée dans `SUIVI.md`. Le numéro de version de la sauvegarde change, et une ancienne sauvegarde sans dynastie devient une dynastie d'une génération.
- **Code** : la dynastie, l'héritage et ses plafonds, les records de famille sont du calcul pur, dans le module du championnat (ou un fichier à lui), testés sans écran.
- **Tests** : continuer la dynastie garde le monde (rivaux encore en activité, écuries, saison suivante) et le nom de famille ; une nouvelle dynastie repart d'un monde neuf et garde l'ancienne au temple ; l'héritier part bien d'une petite écurie et sa voiture n'est pas meilleure ; l'héritage respecte ses plafonds ; aucun texte sur le pilote précédent n'utilise de mot genré (vérifié sur toutes les clés concernées, dans les deux langues) ; les textes sur l'héritier s'accordent avec chacun des quatre liens ; les records de famille s'additionnent sur les générations ; une ancienne sauvegarde se charge sans erreur ; la taille après 3 générations est mesurée.
- **Quand** : avec **l'étape 14** (la fin de carrière), quand la retraite, le bilan et le temple existent. Les textes du journal et de l'interview pour la relève arrivent quand ces parties existent.

## En piste en 10 secondes (le premier lancement)

Décidé par le propriétaire le 2026-10-21. **But** : garder les joueurs à leur première visite. Sur Poki, beaucoup décident dans les 30 premières secondes s'ils restent, et Poki demande que le temps avant de jouer soit le plus court possible. Le jeu prévoit beaucoup d'écrans avant la première course (création du pilote, casque, course de cœur, écurie, calendrier, garage, aileron, qualifications) : au **tout premier lancement**, on les met **après** une première course, pas avant.

- **Le premier lancement** (aucune sauvegarde) :
  1. un écran titre très court (le nom du jeu, un bouton **« ▶ Jouer »**), rien d'autre à choisir, sauf le petit bouton **« 👥 Entre amis »** (voir « Le mode 2 joueurs » et « Le tournoi chrono entre copains ») ;
  2. un clic, et le joueur est **directement sur la grille** de la **course de découverte** : feux, départ, course ;
  3. **pas de qualifications, pas de garage, pas d'aileron** (cran du milieu), pas d'interview ni de une du journal pour cette course.
- **La course de découverte** :
  - **3 tours** (une longueur à part, seulement pour elle ; réglage dans `donnees.js`) ;
  - **quelques IA** seulement (6 par défaut, réglage dans `donnees.js`), au niveau **débutant** ;
  - sur un circuit **facile**, choisi dans `donnees.js` (le circuit `test` tant que les 12 circuits n'existent pas) ;
  - le joueur part **au milieu de la grille**, pour avoir des voitures à doubler et une vraie chance de podium ;
  - le joueur s'appelle « Toi » / « You » et porte un casque neutre ;
  - les rivaux sont **de vrais pilotes du monde** : le monde de la future carrière (les 19 rivaux fixes) est créé au premier lancement, et les IA de la découverte en font partie. On les retrouvera dans la carrière.
- **Les commandes à l'écran** : pendant les premiers virages, des aides en surimpression (« ↑ accélérer », « ← → tourner », « ↓ freiner », et au départ celle du départ : voir « Le départ parfait »). Chaque aide disparaît quand le joueur a utilisé sa touche, et toutes au plus tard à la fin du premier tour. Elles ne cachent jamais la piste devant la voiture. Si le joueur ne touche à rien pendant quelques secondes sur la grille, l'aide « ↑ » clignote doucement.
- **À l'arrivée** : le podium 3D (comme toujours), puis un écran : « Bravo ! Prêt pour ta carrière ? ». **C'est là seulement** que commencent la création du pilote (nom, numéro, pays, casque, course de cœur), puis le reste de la carrière (étape 6).
- **Cette course compte un peu** : sa place donne un peu d'**argent de départ** pour la carrière (montants et plafond dans `donnees.js`), pour qu'elle ne soit pas jouée pour rien. Il n'y a **qu'un seul argent** dans le jeu : la prime est créditée au solde du championnat (`ARGENT.crediter`), la sauvegarde garde seulement sa trace. Elle n'entre **pas** dans le championnat (aucun point) ni dans les records de carrière.
- **Les lancements suivants** : on arrive directement au **paddock** avec **« Continuer »** (ou à la création du pilote, si le joueur a quitté le jeu entre la découverte et la création). La course de découverte ne revient plus. Une ancienne sauvegarde qui a déjà une carrière compte comme « découverte faite ».
- **Le temps** : du clic sur « ▶ Jouer » à l'extinction des feux, **10 secondes au plus** sur un ordinateur moyen, chargement de la course compris. Mesure du 2026-10-23 (tour 23b, Chrome sans carte graphique sur le Mac chargé) : page chargée en 0,7 s, clic → feux 14,3 s, parce que les feux attendent la carte des IA calculée en fond ; sur une vraie carte graphique la carte prend 2–3 s. À remesurer par le propriétaire sur sa machine ; piste : garder la carte en cache dans la sauvegarde (elle est déterministe depuis le tour 22). Si le chargement de tout le jeu est plus long, on charge **d'abord ce qu'il faut pour la course de découverte** (un seul circuit, les voitures), et le reste pendant qu'on roule. La mesure (temps de chargement de la page, temps du clic aux feux) est prise par `tests/ecrans.py` et notée dans `SUIVI.md` à chaque étape.
- **Poki** : `gameLoadingFinished` une fois, quand l'écran titre est prêt ; `gameplayStart` quand la voiture peut rouler (avec des feux : à leur extinction, pour toutes les courses ; décision du Chef, 2026-10-23) ; `gameplayStop` au podium et dans les menus (règles Poki ci-dessous). **Aucune pause pub (`commercialBreak`) avant ni juste après la course de découverte** : la première ne peut venir qu'entre deux Grands Prix de la carrière.
- **Code** : l'enchaînement des écrans au premier lancement est dans `principal.js` ; la course de découverte est une course normale (le même code de course, d'IA et de physique), avec ses réglages à elle dans `donnees.js`. Le drapeau « découverte faite » et l'argent de départ passent par la sauvegarde unique. Tous les textes dans `textes.js`.
- **Tests** : sans sauvegarde, « ▶ Jouer » mène à la grille sans aucun autre écran ; le temps du clic aux feux est mesuré et sous la limite ; les aides disparaissent quand on a utilisé les touches ; la course fait 3 tours, avec le bon nombre d'IA au niveau débutant ; l'arrivée mène à la création du pilote ; l'argent de départ correspond à la place et respecte le plafond ; aucun point de championnat n'est donné ; au lancement suivant, on arrive au paddock et la découverte ne revient pas ; une sauvegarde arrêtée entre la découverte et la création reprend à la création ; aucun `commercialBreak` avant la première course de carrière (avec le faux SDK des tests).
- **Quand** : avec **l'étape 6** (il faut la création du pilote et la sauvegarde ; la course de l'étape 5 sert de base). La mesure du temps est revérifiée à **l'étape 15** (Poki), et après **l'étape 10** (les circuits détaillés pèsent plus lourd).

## Le mode 2 joueurs (écran partagé)

Décidé par le propriétaire le 2026-10-21 (« l'idée la plus excellente »). **But** : ouvrir le jeu à la catégorie **« 2 joueurs »** de Poki, une des plus visitées (frères, sœurs, amis sur le même ordinateur). Jouer contre quelqu'un à côté de soi est plus fort que contre une IA, et peu de jeux de F1 sur navigateur ont un vrai mode à deux.

- **Ce que c'est** : une **course rapide à deux, sur le même clavier**, l'écran coupé en deux. C'est un mode **à part de la carrière** : il ne touche ni au championnat, ni à l'argent, ni aux records de carrière, ni au tableau des améliorations.
- **Où on le lance** : un bouton **« 👥 Entre amis »** au paddock (il ouvre un petit menu : l'écran partagé à deux, ou le tournoi chrono, voir « Le tournoi chrono entre copains »), et un **second bouton, plus petit, sur l'écran titre du premier lancement**, à côté de « ▶ Jouer » (voir « En piste en 10 secondes ») : un joueur qui arrive de la catégorie « 2 joueurs » de Poki doit le trouver tout de suite. C'est la seule exception au « rien d'autre à choisir » de l'écran titre.
- **Les commandes** (lues par la **place des touches**, `e.code`, comme aujourd'hui dans `principal.js` : ça marche en AZERTY et en QWERTY) :

  | | Joueur 1 🔵 (en haut) | Joueur 2 🔴 (en bas) |
  |---|---|---|
  | Accélérer, freiner, tourner | **W A S D** (= Z Q S D en AZERTY) | **les flèches** |
  | Revenir sur la piste | **E** | **Entrée** (ou **Maj droite**) |
  | Pause (pour les deux) | **Échap** | **Échap** |

  En mode 2 joueurs, **Espace** (remise en piste) et **C** (caméra) ne font rien : chaque joueur a sa touche de remise en piste, et la caméra est toujours **derrière la voiture**. Les touches choisies et leur affichage sont dans `donnees.js` et `textes.js`. Certains claviers ne prennent pas beaucoup de touches en même temps : **à essayer par le propriétaire** avec deux joueurs qui appuient en même temps (accélérer + tourner chacun).
- **Avant la course** : un seul écran, rapide. Chaque joueur choisit son **nom**, sa **couleur** de voiture et son **casque** (voir « Le casque du pilote » ; les motifs débloqués en carrière sont disponibles). Puis, pour les deux : le **circuit**, le **nombre de tours** (**3 ou 5**), et le **nombre d'IA** (**0, 3 ou 5**, au niveau choisi). Les derniers choix sont gardés pour la fois suivante.
- **La course** : **exactement le même jeu** : les feux, le départ parfait (chacun avec sa touche d'accélérateur, voir « Le départ parfait »), la même physique, les contacts entre les deux joueurs, les pénalités, les IA (les mêmes rivaux que la carrière, au niveau choisi). Pas de qualifications : la grille est tirée au sort, les deux joueurs côte à côte. Pas d'arrêt au stand, pas d'aileron (cran du milieu), pas de fantôme, pas d'interview ni de une du journal.
- **L'écran partagé** : **gauche et droite** (décision du propriétaire, 2026-10-24 : le joueur 1, W A S D / Z Q S D, à gauche ; le joueur 2, les flèches, à droite, chacun du côté de ses touches ; haut/bas reste possible par le réglage `DEUX_PARTAGE` de `donnees.js`), chaque moitié avec sa caméra derrière sa voiture et un petit affichage à elle : place, tour, vitesse, et l'écart avec l'autre joueur. **Une seule tour de classement**, partagée, au milieu à droite. Le radar et la minicarte de la course seule ne sont **pas** affichés (trop chargés en demi-écran). Aux deux tailles Poki (960×600 et 1280×720), chaque moitié reste lisible, sans défilement, et rien ne déborde (vérifié par `tests/ecrans.py`). 
- **Après la course** : le podium (les deux joueurs mis en valeur, même hors du podium), puis le **score de la rivalité**, qui reste d'une course à l'autre tant que les deux noms sont les mêmes (« Léo 3 – 2 Sarah »), et un bouton **« 🔁 Revanche »** qui relance la même course en un clic (grille retirée au sort). Le score est gardé dans la sauvegarde unique, à part de la carrière.
- **Performance** (le point délicat) : la 3D est dessinée **deux fois** à chaque image. On utilise **un seul moteur de rendu** et **une seule scène**, avec deux zones de dessin (`setViewport` / `setScissor` de Three.js), deux caméras, et pas de seconde copie des décors. Dans ce mode : **7 voitures au plus** (2 joueurs + 5 IA), et des décors simplifiés si la mesure le demande (niveau de détail plus bas, moins de public ; réglages dans `donnees.js`). **But : 60 images par seconde** sur un ordinateur moyen ; la mesure (images par seconde, appels de dessin, triangles, en 2 joueurs avec 5 IA, sur chaque circuit) est prise avec `?debug=1` et notée dans `SUIVI.md`. Si 60 ne tient pas sur un circuit, on simplifie ses décors en 2 joueurs, jamais la physique.
- **Poki** : `gameplayStart` quand les voitures peuvent rouler, `gameplayStop` en pause, au podium et dans les menus (règles Poki ci-dessous). Une pause pub (`commercialBreak`) peut venir **entre deux courses à deux** (au clic sur « Revanche » ou au retour au menu), jamais pendant une course. Pendant une pub, les deux joueurs sont arrêtés et le son est coupé.
- **Code** : le moteur gère **deux voitures pilotées par des joueurs**, chacune avec ses commandes (`{ gaz, frein, direction }`, comme les IA) ; les touches sont lues dans `principal.js` et rangées par joueur. La course à deux est une course normale (le même code de course, d'IA et de physique). L'écran partagé est dans `scene3d.js` et `camera.js` (deux caméras derrière) et `interface.js` (les deux affichages et la tour partagée). Tous les textes dans `textes.js`.
- **Tests** : les touches du joueur 1 ne bougent jamais la voiture du joueur 2, et inversement (en AZERTY et en QWERTY, par `e.code`) ; Espace et C ne font rien en mode 2 joueurs ; chaque joueur a son départ (un faux départ de l'un ne pénalise pas l'autre) ; les deux joueurs et les IA finissent la course et sont classés ; « Revanche » relance la même course ; le score de la rivalité s'additionne et se garde après rechargement ; le mode 2 joueurs ne change rien à la sauvegarde de la carrière ; aucune moitié ne déborde aux deux tailles Poki ; jamais plus de 7 voitures ; les appels Poki sont dans le bon ordre (faux SDK).
- **Quand** : un tour à part **après l'étape 5** (il faut une vraie course avec les IA, les feux et le podium). Le choix du casque arrive avec l'étape 6 (en attendant, la couleur seulement). La performance est **remesurée après chaque circuit de l'étape 10**.

## Le tournoi chrono entre copains

Décidé par le propriétaire le 2026-10-21. **But** : faire jouer **un groupe** (de 2 à 8 joueurs) sur un seul ordinateur : une soirée, la récré, la salle info, la famille. L'écran partagé ne marche qu'à deux ; ici, on se passe le clavier, chacun son tour, et ceux qui attendent regardent, comparent et crient.

- **Où on le lance** : le bouton **« 👥 Entre amis »** (au paddock et sur l'écran titre) ouvre un petit menu avec deux choix : **« Écran partagé (2 joueurs) »** (voir « Le mode 2 joueurs ») et **« Tournoi chrono (2 à 8 joueurs) »**. C'est un mode **à part de la carrière** : il ne touche ni au championnat, ni à l'argent, ni aux records de carrière, ni au fantôme de carrière.
- **L'inscription** : de **2 à 8 joueurs** (le maximum est un réglage de `donnees.js`). Chacun tape son **prénom** et choisit son **casque** (voir « Le casque du pilote » ; les motifs débloqués en carrière sont disponibles). Deux joueurs ne peuvent pas avoir le même prénom. La dernière liste de joueurs est gardée pour la fois suivante.
- **Les deux formules** :
  - ⚡ **Éclair** : un circuit, **un tour chronométré** chacun ; le meilleur temps gagne.
  - 🏆 **Tournoi** : **3 manches sur 3 circuits** (choisis, ou tirés au sort), un tour chronométré chacun par manche ; à chaque manche, des **points** selon la place (25, 18, 15, 12, 10, 8, 6, 4, comme le championnat ; dans `donnees.js`). Le plus de points gagne ; en cas d'égalité, le meilleur temps sur une manche.
- **Le tour** : **le même tour chronométré que les qualifications** de la carrière (même départ, même chrono, mêmes secteurs, même physique), seul sur la piste, sans IA. L'aileron est au cran du milieu pour tout le monde. Les touches sont les touches normales (flèches ou WASD/ZQSD), et C change la caméra.
  - **Virage coupé** : +5 s ajoutées au temps, comme en course (la règle de `course.js`), affichées tout de suite.
  - **Espace** remet sur la piste, avec la perte de temps habituelle.
  - **Pas de deuxième essai** : un tour commencé compte. Échap met en pause ; « abandonner » donne « pas de temps » (dernier de la manche). C'est la même règle pour tous.
- **Chacun son tour** : un écran **« À toi, Sarah ! »** avec son casque et un compte à rebours de 3 secondes (le temps de prendre le clavier), puis le tour. **L'ordre de passage** : l'ordre d'inscription à la première manche ; aux manches suivantes, **l'ordre inverse du classement** (le leader passe en dernier, pour le suspense).
- **Le fantôme du leader** : pendant chaque tour, la voiture transparente du **meilleur temps du moment** dans la manche roule avec le joueur, avec **l'écart en direct** (« −0,21 » en vert, « +0,40 » en rouge). C'est le même code que le fantôme du meilleur tour (voir « Le fantôme du meilleur tour ») : même enregistrement, même rejeu, même calcul de l'écart, mêmes règles (aucun contact, seulement dessiné). Le premier joueur de chaque manche roule sans fantôme. Ici, le fantôme est celui du meilleur temps **pénalités comprises**, même si son tour avait un virage coupé (la règle « un tour coupé n'est jamais le fantôme » reste vraie en carrière). Les fantômes du tournoi ne sont **pas** gardés après le tournoi.
- **Après chaque passage** : le classement de la manche s'anime (le nouveau temps glisse à sa place) avec une phrase (« Sarah prend la tête ! », « À 0,03 s du record ! »). En 🏆 Tournoi, à la fin de chaque manche, le classement général avec les points.
- **À la fin** : le **podium 3D** avec les trois premiers casques et prénoms, puis le classement complet, et **« 🔁 Rejouer »** avec les mêmes joueurs (et la même formule), ou « Nouveaux joueurs ».
- **Performance** : une seule voiture et une seule vue (comme une course seule), plus un fantôme. Aucune mesure nouvelle à faire en dehors de celles des circuits.
- **Poki** : `gameplayStart` quand la voiture peut rouler, `gameplayStop` entre deux passages, en pause et dans les écrans du tournoi (règles Poki ci-dessous). Une pause pub (`commercialBreak`) peut venir **entre deux manches** du 🏆 Tournoi et **à la fin** (au clic sur « Rejouer » ou au retour au menu), **jamais entre deux joueurs d'une même manche**.
- **Code** : le tournoi (inscription, ordre de passage, temps, points, égalités, classement) est du calcul pur, dans un fichier à lui, sans écran, testé seul. Le tour est celui des qualifications (le même code). Les écrans sont dans `interface.js`. La liste des joueurs passe par la sauvegarde unique, à part de la carrière. Tous les textes dans `textes.js`.
- **Tests** : de 2 à 8 joueurs, jamais 1 ni 9 ; deux prénoms identiques refusés ; l'ordre de passage (inscription, puis inverse du classement) ; un virage coupé ajoute 5 s ; « abandonner » donne « pas de temps » ; les points et l'égalité au tournoi ; le fantôme est bien celui du meilleur temps du moment, et absent pour le premier joueur ; aucune pub entre deux joueurs d'une même manche (faux SDK) ; le tournoi ne change rien à la sauvegarde de la carrière ; la liste des joueurs est gardée après rechargement.
- **Quand** : un tour à part **après l'étape 5** et **après le fantôme** (il faut le tour chronométré des qualifications et le fantôme). Les casques arrivent avec l'étape 6 (en attendant, la couleur seulement).

## La météo

Décidée par le propriétaire le 2026-10-27 (« oui fais la météo »). **But** : que la stratégie change d'une course à l'autre, et que le pilotage compte encore plus sous la pluie. Toujours la règle d'or : la même météo pour tous, les mêmes effets pour le joueur et les IA.

- **La prévision** : avant chaque Grand Prix, le paddock montre le temps prévu (sec, nuageux, risque de pluie avec un pourcentage, pluie). La météo de la course est tirée avec la graine du Grand Prix, selon le lieu (`METEO_LIEUX` dans `donnees.js` : Spaa pluvieux, Bahrayn presque jamais ; Singapura orageux de nuit) ; elle peut changer pendant la course (une averse qui arrive, une piste qui sèche), à un moment tiré d'avance.
- **La piste mouillée** : un niveau d'eau de 0 à 1, qui monte sous la pluie et baisse quand elle s'arrête, plus vite sur la trajectoire (là où les voitures passent). L'adhérence baisse avec l'eau (`METEO_*`), l'aspiration aussi (la gerbe d'eau) ; rien d'autre ne change dans la physique.
- **Les pneus** : trois sortes, **slicks**, **intermédiaires**, **pluie**, chacun avec son adhérence selon le niveau d'eau (le slick est le meilleur au sec et le pire sous la pluie ; le pneu pluie l'inverse ; l'intermédiaire entre les deux) et son usure (un pneu pluie sur piste sèche s'use très vite). On choisit ses pneus au départ (au garage, avant les qualifications) et à chaque arrêt au stand ; un arrêt pour changer de pneus compte comme l'arrêt obligatoire.
- **Les IA** choisissent leurs pneus et le moment de s'arrêter avec la même information que le joueur (ce qu'elles voient de la piste et la prévision, jamais l'avenir exact), selon leur caractère (un prudent passe aux intermédiaires plus tôt) ; elles freinent plus tôt sur piste mouillée, comme leur carte le leur dit.
- **À l'écran** : la pluie qui tombe (particules en un seul appel de dessin), les gerbes derrière les voitures, la piste plus sombre et brillante là où elle est mouillée, le ciel couvert ; une icône météo et le niveau d'eau près des pneus ; un message de course (« La pluie arrive », « La piste sèche ») ; dans la vue cockpit, des gouttes. Tout est fait par le code. Les performances sont mesurées avec 20 voitures sous la pluie.
- **Code** : la météo en calcul pur (`meteo.js` : prévision, niveau d'eau, adhérence des pneus) ; `physique.js` lit un facteur d'adhérence (1 = sec, au bit près) ; le dessin dans `decor.js` / `scene3d.js`. Tous les textes dans `textes.js`.
- **Tests** : au sec, la course est identique au bit près à aujourd'hui ; un slick sous la pluie va moins vite qu'un pneu pluie, et l'inverse au sec ; la même graine donne la même météo ; sur 30 courses avec pluie, l'arrêt pour changer de pneus change le classement ; les IA ne connaissent jamais l'avenir de la météo ; une ancienne sauvegarde se charge (temps sec).

## Les discussions avec les pilotes et les écuries

Décidées par le propriétaire le 2026-10-27 (« fais qu'on puisse discuter avec eux, des discussions comme dans gestion de pays »). **But** : que les 19 rivaux, ton coéquipier et les patrons d'écurie soient des gens à qui l'on parle, pas seulement des noms. **Le modèle est celui du jeu de gestion de pays** (`../../../gestion de pays`, `diplomatie.js`, `ia-oral.js`, `composeur.js`, `courrier.js`) : on **écrit librement** (avec le langage parlé : « slt », « t nul », « stp »), ou on **compose au clic** (une intention, ses paramètres, en une phrase française qui repart dans le même moteur) ; l'interlocuteur **répond depuis son raisonnement réel** (son caractère, sa mémoire, ses intérêts), pas depuis une liste ; et il **écrit de lui-même** quand quelque chose change.

- **Qui** : chaque rival (sa fiche a un bouton « Discuter »), ton coéquipier, le patron de ton écurie et des autres écuries (à la période des contrats), plus tard les sponsors.
- **Quand** : au paddock, entre deux Grands Prix ; jamais pendant une course (Poki : c'est un menu, `gameplayStop`). Une course ne s'arrête pas pour une discussion.
- **De quoi l'on parle** : de la dernière course (un contact, un dépassement, une consigne, un résultat), de la rivalité (provoquer, s'excuser, apaiser), du duel avec le coéquipier, des consignes à venir (« laisse-moi passer s'il le faut, je te rendrai la pareille »), et avec les patrons des contrats (négocier : salaire, statut de premier pilote, durée), avec un rival d'une alliance d'un jour (« bloque-le pour moi »), avec n'importe qui de tout et de rien.
- **Ce que ça change** (petits effets, tous avec un plafond dans `donnees.js`, et **jamais de triche** : même physique, mêmes règles, mêmes informations) : la rivalité et la bête noire (comme l'interview), la confiance de l'écurie, la réputation, la note du joueur pour les contrats, la disposition d'un pilote à laisser passer ou à défendre plus dur contre le joueur, l'humeur du coéquipier face aux consignes, et le montant d'un contrat négocié. **C'est toujours le pilotage qui fait gagner.**
- **Ils écrivent d'eux-mêmes** (une boîte de messages au paddock) : un rival après un gros contact, ton coéquipier après une consigne ou un duel perdu, un patron qui te veut, un ancien rival devenu patron ; une quinzaine de sujets, choisis par urgence, avec une mémoire qui évite les redites ; au plus quelques messages par Grand Prix.
- **La mémoire** : chaque pilote se souvient de ce qu'on lui a dit et de ce qu'on a fait (une promesse tenue ou non, une menace sans suite = crédit perdu, et il le dira) ; résumé compact dans la sauvegarde unique.
- **Code** : la compréhension (lexique, langage parlé, intentions) et le raisonnement en calcul pur dans des fichiers à eux (`discussion.js`, `parle.js`, `courrier-pilotes.js`), testés sans écran avec un **banc** de phrases (comme `tests/banc-ia.html` du jeu de pays) ; l'écran dans `interface.js` ; tous les textes en anglais et en français dans `textes.js` (les réponses sont composées depuis le raisonnement, avec des variantes tirées par `hasard()`), jamais genrées sur un pilote dont on ne connaît pas le genre.
- **Tests** : le banc de phrases (chaque intention reconnue en saisie libre et au clic, dans les deux langues, langage parlé compris) ; chaque réponse justifiée par le vrai calcul ; les plafonds tiennent ; une promesse non tenue est rappelée ; aucune discussion pendant une course ; une ancienne sauvegarde se charge ; la course sans discussion est identique au bit près.

## Les aides au premier usage (le tutoriel)

Idée du propriétaire, 2026-10-27 (« tutoriel »), écrite par le Chef sous cette forme : **pas de tutoriel au début** (ça irait contre « En piste en 10 secondes » et contre des règles « simples, pour ne pas avoir besoin d'un long tutoriel »), mais **une aide courte la première fois qu'on rencontre chaque système**, au moment où il sert. Le jeu en a beaucoup maintenant (départ parfait, qualification et fantôme, arrêt au stand, pneus et pluie, aileron, consignes d'équipe, duel, garage, contrats, interview, discussions).

- **Quand** : juste avant ou pendant la première fois (les premiers feux : la jauge du départ, déjà là ; le premier arrêt obligatoire : « Entre dans la voie des stands, à 80 km/h au plus » ; le premier garage : à quoi sert chaque amélioration ; la première consigne ; la première pluie : « Passe aux pneus pluie au prochain arrêt ? »), **une seule fois par système**, jamais pendant un freinage ou un virage (en course, seulement dans une ligne droite ou à l'arrêt).
- **La forme** : une bulle courte (une ou deux lignes), avec la touche ou le bouton à utiliser, qui se ferme d'un clic ou quand l'action est faite ; elle ne cache jamais la piste devant la voiture ; un bouton « Revoir les aides » au paddock (menu pause aussi) remet le compteur à zéro ; un réglage pour les couper toutes.
- **Code** : la liste des aides et leurs conditions en calcul pur (`aides.js`), ce qui a été vu dans la sauvegarde unique (à la racine : ça survit à une nouvelle carrière) ; l'affichage dans `interface.js` ; tous les textes dans `textes.js`, en anglais et en français.
- **Tests** : chaque aide apparaît une fois, au bon moment, puis plus jamais ; jamais pendant un virage ; « Revoir les aides » les remet ; le réglage les coupe ; aucune aide ne recouvre la piste devant la voiture (le test en pixels existant) ; une ancienne sauvegarde se charge (aucune aide vue).

## Le commentateur

Idée du propriétaire, 2026-10-27 (« commentateur »). **À faire en tout dernier**, après tout le reste de ce fichier (le propriétaire : « sauf commentateur qui sera fait à la fin fin fin »). **But** : la « vraie retransmission de F1 » de « L'interface », avec une voix qui raconte la course. **En texte**, dans le bandeau télé des messages de course (`messages.js`), pas en voix enregistrée (aucun fichier de son) ni en synthèse vocale (elle change trop d'un ordinateur à l'autre).

- **Ce qu'il dit** : les faits que le moteur connaît déjà (départ, dépassements, attaques côte à côte, erreurs, contacts, pénalités, arrêts au stand, meilleur tour, pluie qui arrive, dernier tour, arrivée), avec les noms, les écuries et les places (« Rossi plonge à l'intérieur de Moreau ! », « Toi, 3e, à 1,2 s du podium », « Dernier tour à Monoco ! ») ; plus de phrases quand le joueur est concerné ; un ton de télé, enthousiaste, jamais moqueur envers le joueur.
- **La mesure** : au plus une phrase toutes les quelques secondes (`COMMENTAIRE_INTERVALLE`), une file avec des priorités (un dépassement pour la tête passe devant un meilleur tour), jamais la même phrase deux fois de suite (plusieurs variantes par fait, tirées par `hasard()`), rien pendant les premières secondes d'un virage serré ; un réglage pour le couper ou le réduire aux faits du joueur.
- **Le nom** : un commentateur inventé (nom dans `textes.js`, jamais une vraie personne), le même que la chaîne de La Gazette du Paddock si ça aide.
- **Code** : le choix des phrases en calcul pur (`commentaire.js`, il lit seulement le moteur), l'affichage dans le bandeau existant ; en anglais et en français, jamais genré sur un pilote dont on ne connaît pas le genre.
- **Tests** : chaque fait donne sa phrase ; la priorité et l'intervalle tiennent ; pas deux fois la même de suite ; rien quand c'est coupé ; la course est identique au bit près avec ou sans commentaire ; toutes les clés dans les deux langues.

## La réalisation télé (de vraies caméras)

Décidée par le propriétaire le 2026-10-27 (« pour la télé, ce ne doit pas être un calcul d'angles pour la F1 mais réellement une caméra dans les airs »). Aujourd'hui, la vue télé prend un point invisible au bord de la piste, tous les `TELE_ESPACEMENT` mètres, et calcule l'angle et le zoom vers la voiture. **À la place : de vraies caméras, placées dans le monde comme sur un vrai circuit, et une régie qui passe de l'une à l'autre.**

- **Les caméras** sont des objets du décor, visibles (une petite caméra sur un mât, une grue, le toit d'une tribune, un pont), en hauteur, aux endroits où la télé les met : à la sortie des stands et à la ligne, à chaque virage célèbre (les `reperes` des tracés), le long des grandes lignes droites ; décrites par circuit dans `decors-officiels.js` (et `DECORS.test`), avec leur hauteur et leur zoom maximal. Plus **l'hélicoptère** (une caméra dans les airs, 80 à 150 m, qui suit la tête de course de loin, en douceur) et un **drone** au départ et à l'arrivée.
- **La régie** choisit la caméra qui **voit vraiment** la voiture suivie (aucun immeuble, tribune ou relief entre les deux : un test de visée contre les boîtes du décor), garde un plan au moins `TELE_PLAN_MIN` secondes, coupe franchement d'un plan à l'autre (pas de travelling d'un poste à l'autre), et passe à l'hélicoptère sur les longues lignes droites ou quand aucune caméra ne voit la voiture. Une caméra reste à sa place : elle **tourne et zoome** pour suivre, comme un caméraman.
- **Où** : la vue télé de course (touche C), la vue après l'arrivée, le résumé vidéo, la grille vue d'en haut (le drone) ; le mode 2 joueurs garde ses caméras derrière.
- **Code** : la régie (le choix du plan, la visée, la durée) en calcul pur dans `camera.js` ou un fichier à elle (`regie.js`), testée sans écran ; les caméras dessinées par `decor.js` (en `InstancedMesh`, un appel de dessin pour toutes) ; leurs places en données.
- **Tests** : sur un tour du circuit test et de Monoco, la voiture suivie est toujours visible depuis la caméra choisie (aucun objet du décor sur la ligne de visée) ; un plan dure au moins `TELE_PLAN_MIN` ; une caméra ne se déplace jamais (seuls l'angle et le zoom changent), sauf l'hélicoptère et le drone ; l'hélicoptère reste dans ses hauteurs ; les appels de dessin n'augmentent pas de plus de 1.

## L'argent et les améliorations

- Chaque course rapporte de l'argent : selon la place, le meilleur tour, les objectifs de sponsors et les places gagnées.
- L'argent sert à améliorer **l'équipe**, par exemple :
  - **les changeurs de roues** : l'arrêt au stand est plus court ;
  - **la qualité de la F1** : vitesse, adhérence et freins, avec **un maximum de +7 % au total**.
  **Liste proposée au tour 23c (2026-10-23), à approuver par le propriétaire**, codée telle quelle dans `GARAGE` (`donnees.js`) : changeurs de roues (effet à l'étape 7, le niveau est gardé), moteur (+0,5 % par niveau), aéro (+0,5 %), freins (+0,4 %) ; 5 niveaux chacune ; au maximum exactement +7 % ; tout acheter coûte 1 400 000, soit 5 à 10 saisons. Mesure : le robot avec +7 % gagne 1,38 % au tour sur le circuit test.
  **Les gains** (`argent.js`, `ARGENT_*`) : selon la place, le meilleur tour, les places gagnées entre la grille et l'arrivée (jamais négatif), le bonus du duel (`DUEL_BONUS`) ; un plafond par course ; le solde et l'historique dans la sauvegarde unique ; affichés sur l'écran des résultats et au championnat. Les objectifs de sponsors viendront à l'étape 9.
- **La règle d'or : c'est le pilotage qui fait gagner.** Les améliorations aident un peu, elles ne gagnent pas la course à la place du joueur. Elles ont toutes un plafond, et ces plafonds sont dans le fichier de données.

## Les IA des adversaires (la plus grosse étape)

- Elles conduisent **avec la même physique et les mêmes règles que le joueur**. Elles freinent, dépassent, défendent leur place et s'arrêtent au stand.
- **Ce sont des pilotes qui décident, pas des voitures sur un rail** (décision du propriétaire, 2026-10-19). Aucune trajectoire calculée d'avance que toutes les IA suivent. Chaque IA regarde la piste devant elle et les voitures autour, comme un pilote, et **choisit sa ligne en roulant**, à chaque virage : la ligne idéale quand elle est seule, l'intérieur pour attaquer, une ligne pour défendre ou pour éviter, et parfois une erreur. Deux IA ne passent jamais exactement au même endroit. Ce qu'une IA sait du circuit (où sont les virages, à quelle vitesse on peut les prendre) peut être calculé d'avance, comme un pilote qui connaît la piste ; la ligne qu'elle suit, non.
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
- **Une voiture bloquée ou très lente se contourne, elle ne s'attend pas** (décision du propriétaire, 2026-10-23 : « si on bloque une F1, tout un trafic à la queue leu leu attend, ils sont censés doubler »). Dès qu'il y a la place, une IA passe une voiture arrêtée ou nettement plus lente, n'importe où sur le circuit, sans attendre une zone d'attaque. La file (suivre à distance) est pour une voiture qui roule à peu près au même rythme. Fait au tour 25 (2026-10-23) : « lente » = arrêtée ou presque (< `IA_ARRET_VITESSE`) depuis `IA_ARRET_DUREE`, ou sous `IA_LENTE_PART` de la vitesse de la carte depuis `IA_LENTE_DUREE`, et pas plus rapide que moi ; jamais pendant le lancement ; suivi par voiture vue (`pilote.lentesVues`). Tests : une voiture arrêtée dans la droite est passée par les 10 IA en 7,9 s, à l'entrée de l'épingle en 7,8 s, le joueur à 40 % n'est jamais suivi plus de 16 s ; 0 choc ; les garde-fous de courses.html inchangés (4 chocs, herbe 2450 sur 30 courses).
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
- L'interface est en HTML et CSS, par-dessus la 3D. Elle a son propre style (police, couleurs, animations), défini une seule fois dans des variables CSS. Depuis le 2026-10-27 (tour 32, étape 11 commencée) : le thème télé `--tv-*` à la fin de `style.css`, appliqué à tous les écrans `.ecran` (voile en dégradé, titres en capitales italiques avec un bandeau rouge, boutons en plaques), des transitions de 180 à 230 ms (opacité et titre seulement, rien ne bouge sous un clic), les résultats animés, tout coupé par `prefers-reduced-motion` ; le paddock est un écran d'accueil (le prochain Grand Prix avec sa carte, ta situation, les classements, les boutons en 4 groupes).

## Le monde 3D

**Les circuits doivent être extrêmement détaillés** : tribunes avec du public, stands, bâtiments, arbres, panneaux, vibreurs, barrières, ciel et lumière propres à chaque lieu. Monoco doit avoir des rues, un port et des bateaux, et Singapura est de nuit avec des projecteurs. C'est une **grosse étape**, faite circuit par circuit.

Pour que ce soit beau **et** léger :
- les décors sont faits par le code (de la géométrie générée, des objets répétés en *instancing*), plutôt qu'avec de gros fichiers de modèles ;
- les objets lointains sont plus simples (niveaux de détail), et ceux qu'on ne voit pas ne sont pas dessinés ;
- les textures sont peu nombreuses et petites ; on préfère les couleurs et les formes ;
- les voitures sont toutes faites sur le même modèle, avec les couleurs de chaque écurie.

## La technique

- **JavaScript pur + Three.js** (`lib/three.min.js` en local, **version fixée : r152, build UMD**, copiée de `../../jeu poki/lib/`, avec l'avertissement de dépréciation déjà retiré pour garder la console vide), comme `../../jeu poki`. Pas de build, pas de framework. Ouvrir `index.html` suffit pour jouer.
- La physique et les IA sont faites par nous. Pas de moteur physique externe.
- **Unité : 1 = 1 mètre**, les angles en radians. Le sol est le plan x, z ; y monte. Sur la piste, `d > 0` veut dire à droite du pilote.
- **Le moteur ne touche pas à l'écran.** Les règles, la physique, les IA, le championnat et l'argent marchent sans 3D, pour être testés seuls.
- Le hasard passe par une seule fonction qui peut prendre une graine, pour rejouer exactement une course pendant les tests.
- La sauvegarde (saison, rivaux, argent, améliorations, réglages) passe par **un seul module**. Elle a un numéro de version, pour pouvoir transformer les anciennes sauvegardes quand le jeu change. On sauvegarde **après chaque course**.
- Il y aura plus de fichiers que dans `../../jeu poki`. La liste est notée ici au fur et à mesure :
  - `index.html`, `style.css` : la page (plein cadre, sans défilement) ;
  - `donnees.js` : tous les réglages (`REGLAGES`) ;
  - `aleatoire.js` : le seul hasard, `hasard()`, avec une graine par `ALEATOIRE.semer(n)` ;
  - `boucle.js` : la boucle (`BOUCLE`), physique à 120 pas par seconde, et `BOUCLE.simuler(secondes)` sans affichage ;
  - `circuits.js` : les circuits en calcul pur, sans Three.js : la spline (Catmull-Rom centripète), les échantillons tous les 2 m, et `positionSurPiste(circuit, x, z, indiceDepart)` ; les points de chaque circuit sont dans `CIRCUITS` (`donnees.js`) ; deux circuits d'essai pour l'instant : `test` (le premier, beaucoup de lignes droites) et `technique` (épingle, S, courbe rapide, longue droite, pour entraîner les IA) ;
  - `scene3d.js` : l'affichage Three.js (`SCENE3D`), qui lit l'état sans le changer ;
  - `physique.js` : la physique des voitures en calcul pur (modèle « vélo », herbe, barrières) et `contactsVoitures` (les voitures sont des rectangles qui se poussent, choc mou, jamais traversées) et `aspirationVoitures` (dans le sillage d'une voiture, moins de traînée) ; le joueur et les IA utilisent le même code ;
  - `robot.js` : le robot d'essai (suit la ligne du milieu) ; ce n'est pas l'IA ;
  - `ia.js` : l'IA des adversaires en calcul pur. La carte d'un circuit (`carteDepuis` : la trajectoire idéale, calculée une fois et découpée en tranches par `etapesTrajectoire`, ses virages et les vitesses possibles) est ce que le pilote sait de la piste, pas une ligne à suivre. `piloterIA(pilote, v, vues, dt)` : toutes les 0,15 s, le pilote compare quelques lignes sur 200 m qui partent de là où il est, les note avec la physique et les voitures qu'il voit, suit la meilleure et ne sort que `{ gaz, frein, direction }` ; chaque pilote a sa façon de piloter (`tirerStyle`, avec la graine) ;
  - `simulation.js` : une course entre IA en calcul pur : la grille (deux files), ce que chaque IA voit (`voituresVues` : cône devant, couloir, rétroviseurs), `creerCourseIA` / `pasCourseIA` (aussi utilisés par la page), `classementCourse` (le classement en direct : ordre, écart en temps au pilote devant, tours de retard), `classementFinal` (temps de course + pénalités, la même règle pour tous ; ordre de passage et ordre final) et `podiumConnu`, et `simulerCourse(circuit, nbVoitures, nbTours, graine)` pour les tests ;
  - `course.js` : une course seule en calcul pur : compte à rebours, chrono, tours (secteurs 1 → 2 → 3 puis la ligne), secteurs, meilleur tour, virage coupé (+5 s, tour ✂) ;
  - `sauvegarde.js` : la seule sauvegarde (localStorage, une clé, un numéro de version, en try/catch ; v3 : les noms provisoires deviennent null, le nom par défaut vient de `textes.js`) ; les records par circuit et par longueur, le championnat (avec le duel et l'album du journal), les fantômes (un par circuit), les options (fantôme affiché), le record de réaction au départ ; un champ qui manque est ajouté au chargement, sans changer de version ;
  - `interface.js` : les écrans (choix de la longueur, pause, fin) et l'affichage de course (tour, chrono, secteurs en couleurs, tour de classement en haut à droite) ;
  - `decor.js` : les briques du décor faites par le code, une `InstancedMesh` par type (tribunes avec public assis, public debout, stands avec une porte par écurie, sapins et feuillus, panneaux, piles de pneus), niveaux de détail (forme simple au-delà de 250 m, rien après 1600 m) ; placées depuis une description en données (`DECORS.test` dans `donnees.js` ; `decors-officiels.js` pour les 12 tracés, **branchés depuis le 2026-10-27** : `DECOR.pour(NOM_CIRCUIT)` pose le lieu, le ciel, la lumière, le brouillard et le paysage de chaque circuit ; les voitures à plus de 45 m sont dessinées en forme simple, toutes en un appel, `VOITURE3D.formeLointaine` ; 60 à 78 appels de dessin avec 20 voitures selon le circuit, plafond testé à 90), jamais à moins de largeur/2 + 8 m du tracé ni dans la voie des stands ; les couleurs du public viennent de `decor-public.js` (`DECOR_PUBLIC`, le public à domicile aux couleurs du pays du joueur, `ALEATOIRE.suite` pour ne pas toucher au hasard de la course) ; mesure : 40 appels de dessin et 71 272 triangles avec 20 voitures sur le test décoré (31 et 20 766 sans), plafond testé à 80 ;
  - `minicarte.js` : la minicarte du circuit entier en haut à gauche (toutes les voitures, le joueur cerclé, la voie des stands avec ?pneus), jamais à deux ni au tournoi ; `messages.js` : les messages de course en bandeau télé (meilleur tour, pénalité, stands ; une file, un message à la fois) ; l'état des pneus au-dessus du compteur avec ?pneus=1 ;
  - `radar.js` : le radar en bas à gauche (canvas 2D, pas Three.js) : la piste proche et les voitures autour du joueur, tourné avec lui ;
  - `podium3d.js` : le podium 3D fait par le code (2e, 1er, 3e), à côté de la ligne, avec sa caméra qui se balance ; après une course à plusieurs, `interface.js` montre le podium puis les résultats (place, temps, pénalités, écart, grille) ;
  - `boite.js` : les 8 rapports et le régime, tirés de la vitesse, pour l'affichage et le son seulement (la physique ne les lit pas) ;
  - `son.js` : le son synthétisé en Web Audio (moteur, pneus, chocs), rien avant le premier geste, M et 🔊 pour couper ;
  - `reglages.js` : `?reglages=1`, le panneau de curseurs du pilote d'essai, avec « copier » pour `donnees.js` ;
  - `voiture3d.js` : la F1 en 3D, faite par le code, avec la couleur de son écurie ;
  - `textes.js` : tous les textes, en anglais et en français (`texte(cle)`), y compris les noms par défaut (`nomJoueur`, `pilote`, `ecurie`), `numero`, `placeCourse`, `secondes`, `titreGrandPrix`, `circuit_<nom>` ; les temps utilisent aussi `texte('virgule')` ;
  - `sdk.js` : le seul passage vers le SDK Poki (le jeu marche sans) ; `principal.js` appelle `SDK.init` puis `chargementFini`, `gameplayStart` quand la voiture roule et `gameplayStop` sinon ;
  - `pneus-donnees.js` + `pneus.js` : l'usure des pneus en calcul pur, pour le joueur et les IA (trait `gestionPneus`), **active par défaut depuis le 2026-10-27** (`PNEUS_ACTIFS` vrai ; `?pneus=0` la coupe ; l'usure se compte au mètre, `USURE_ECHELLE` réglée sur le plus long tracé : un arrêt suffit en 12 et 18 tours, aucun en 5 ; `tests/officiels.html` l'exige sur les 12 tracés ; `tests/test.html` tourne sans pneus pour garder ses références) ; avec elle : la voie des stands sur chaque circuit (`circuits.js`, muret, 80 km/h), l'arrêt au stand (`course.js` : `pasArretStand`, 4 s moins les changeurs de roues ; `penaliserSansArret` : +30 s en 12 et 18 tours), la stratégie des IA (`simulation.js` : `strategieStands`, un arrêt, jamais au dernier tour, équipiers à 2 tours d'écart), leur conduite vers les stands (`ia.js` : `cibleStands`, `cederSortieStands`) ; `tests/stands.html` ;
  - `enregistreur-donnees.js` + `enregistreur.js` : l'enregistrement des positions de la course (`creerEnregistrement`, `enregistrerPas`, `enr.temps(i)`), branché sans affichage (pour le fantôme et le résumé vidéo) ;
  - `fantome.js` : le fantôme du meilleur tour en calcul pur (le tour de qualification enregistré avec `creerEnregistreur`, compact dans la sauvegarde par circuit, rejeu, écart à distance égale ; `FANTOME_*`) ; la voiture transparente est `creerFantome` dans `voiture3d.js` ; le bouton « Fantôme : affiché / masqué » est sur l'écran de qualification **et** dans le menu pause (il n'y a pas de pause pendant le tour de qualification) ;
  - `depart.js` : le départ parfait en calcul pur (régime de départ, zone verte, réaction, résultat, effet lu par `physique.js` via `v.facteurDepart`, 1 = rien ; les IA par `tirerIA` selon leur caractère ; `DEPART_*`, `FEUX_REACTION_IA` = bornes humaines) ; `course.js` arme le départ de chaque voiture avec les feux et l'avance à chaque pas (`pasDepart`) ; `?robot=1` fait un départ parfait automatique ;
  - `deux-joueurs.js` : le mode 2 joueurs en calcul pur (commandes par joueur depuis `e.code`, course à deux humains, grille côte à côte tirée au sort, 0/3/5 IA, 3/5 tours, 7 voitures au plus) ; `?deux=1&ia=…&tours=…` ; l'écran partagé haut/bas dans `scene3d.js` (un rendu, une scène, deux zones `setViewport`/`setScissor`, `camera2`), `camera.js` (`majSeconde`), `interface.js` (`majDeux` : un affichage par moitié, une tour partagée) ; **le menu « Entre amis », les réglages, le podium à deux, le score de la rivalité et « Revanche » restent à faire** (ordre 3 du tour 25b). L'herbe est repoussée dans le tampon de profondeur (`polygonOffset`, `SOL_RECUL_PROFONDEUR`) : sans ça, elle gagnait sur la route près de la caméra selon la taille de l'image (vu au tour 25b, un test en pixels le garde) ;
  - `resume.js` : le résumé vidéo de la course (étape 13) en calcul pur : les moments forts lus dans l'enregistrement (départ, arrivée, dépassements surtout ceux du joueur, sorties de piste), durée bornée `RESUME_DUREE_MAX` ; le bouton « ▶ Résumé » aux résultats rejoue les positions enregistrées avec la caméra télé (la physique ne bouge pas), un bandeau dit le moment ; **pas encore** : l'arrêt au stand comme moment fort ;
  - `casque.js` : le casque de chaque pilote (motif `CASQUE_MOTIFS` + trois couleurs), les 19 casques des rivaux tirés avec la graine (tous différents), le joueur neutre tant qu'il n'a pas choisi, `completer` pour une ancienne sauvegarde ; le rendu = un atlas en canvas, une texture, **un seul matériau pour toutes les têtes** (aucun appel de dessin en plus) ; l'éditeur à la création du pilote et « Mon casque » au paddock ; l'icône 2D devant le numéro dans la tour, les résultats, le podium, le championnat ; le volant en vue cockpit (`VOITURE3D.creerVolant`, gants aux couleurs du casque, rapport et vitesse sur le volant, jamais dans la moitié haute) ; les déblocages de motifs (`CASQUE_DEBLOCAGES` : victoire, titre, 10 podiums, saison gagnée contre son coéquipier, gagner à domicile ; gardés à la racine de la sauvegarde, ils survivent à une nouvelle carrière ; grisés avec leur condition dans les éditeurs) ; l'annonce « Nouveau motif de casque » au paddock, une fois ; l'éditeur de l'héritier propose les motifs débloqués ;
  - `cache-carte.js` : la carte des IA d'un circuit gardée dans la sauvegarde (ecart et vitesse en Float64 encodés base64, le reste recalculé : identique au bit près, test) avec une clé de validité (empreinte des réglages IA_*, de la physique, de l'échantillonnage et du tracé) ; au lancement, si le cache est valide, les feux n'attendent plus la carte (~34 Ko par circuit) ;
  - `decouverte.js` + `pilote.js` : la course de découverte du premier lancement (ses pilotes, la grille au milieu, la prime) et la création du pilote (nom, numéro libre, pays, course de cœur ou Grand Prix à domicile 🏠 d'office) ; **la page nue (`index.html` sans paramètre) est le vrai jeu** : écran titre → découverte → création → paddock, puis directement le paddock ; `?seul=1` donne l'ancien écran de choix d'une course seule ;
  - `saisons.js` : la fin de saison (champion, titres, historique compact `ch.saisons`), les contrats (note du joueur = classement + duel `CONTRAT_POIDS_DUEL` + confiance, exigences par niveau d'écurie, offres, signer = échange de pilotes, les améliorations suivent), la retraite (choix ou `SAISONS_MAX`), les rivaux qui évoluent (âge, facteur de rythme, retraites et arrivées, transferts décidés en début de saison (`intentions`, `ch.transferts`) et appliqués à la fin, niveaux des écuries ; `ch.retraites` garde un résumé compact) ; les rumeurs du journal viennent de ces intentions (`JOURNAL_RUMEUR_DES_GP`, `JOURNAL_RUMEUR_FAUSSE`, la première de la saison toujours vraie), `nouvelleSaison` ; `?gp=N` pour les tests ; les consignes d'équipe sont faites (une par course au plus, entre deux IA ou avec le joueur, `CONSIGNE_*`, `consigneRefus` par pilote ; suivie +5 / ignorée −5 sur la confiance de l'écurie, qui est aussi la jauge écurie de l'interview) ;
  - `aileron.js` + `carte2d.js` : le réglage de l'aileron en calcul pur (5 crans `AILERON_CRANS`, ±1,5 % d'adhérence et ±4,5 % de traînée par cran, le milieu = 1 au bit près ; gardé par circuit ; le choix des IA selon la part de virages lents et de lignes droites et leur caractère) et la carte 2D de la prochaine course (écran « Aileron » depuis le garage, aucun conseil) ; les facteurs `v.aileronAdherence`, `v.aileronTrainee` sont lus par `physique.js`, `ia.js` et `robot.js` ; l'effet s'applique au joueur ET aux IA (`AILERON_IA_ACTIF` vrai depuis le 2026-10-24 : derrière une voiture qui n'a pas le même aileron, une IA prévoit son freinage `IA_FREIN_PREVU` ; `tests/courses.html?ailerons=1` dans la suite, 5 chocs sur 30 courses) ;
  - `carriere.js` : le bilan de carrière (à la retraite), le temple de la renommée (à la racine de la sauvegarde, `TEMPLE_MAX`, classé par titres, victoires, podiums), les records qui survivent à une nouvelle carrière, et la relève (héritier : prénom, nom gardé, lien fils/fille/protégé/protégée, même monde, petite écurie, héritage plafonné ; ou nouvelle dynastie) ; sauvegarde v4 ; `nombre(n, cle)` dans `textes.js` accorde les mots au nombre ; la cérémonie du champion est dans `podium3d.js` (confettis en un appel de dessin) ; l'album des unes au paddock (`JOURNAL.rendreAlbum`, les noms de sa saison) ; l'arbre de la dynastie au paddock et au bilan ; `elider()` (« d'Alex ») ; les anciens rivaux du parent deviennent patrons ou consultants (`roles`, `anciensDuParent`, seulement des noms dans les textes) ; la photo de la une est dessinée par le code (`photo.js`, canvas 2D sans hasard : le podium ou la voiture du joueur selon le fait ; la une compacte garde des indices, pas d image) ;
  - `interview.js` : l'interview d'après course en calcul pur (les faits par priorité `INTERVIEW_PRIORITES`, formulations tirées avec la graine, trois tons, les trois jauges de réputation `ch.reputation` 0–100 avec plafond, la confiance de l'écurie = la jauge écurie, l'effet sur les sponsors, la rivalité `ch.pilotes[k].rivalite` pendant `INTERVIEW_RIVALITE_COURSES`, le fait « interview » du journal) ; l'écran après les résultats, avant la une ; les jauges au paddock, la rivalité sur la fiche ; l'effet de la rivalité sur le pilotage est dans `ia.js` (contre le joueur seulement : agressivité + `INTERVIEW_RIVALITE_PLAFOND`, il couvre l'intérieur quand le joueur est dans ses rétroviseurs, il lui laisse moins de place ; jamais de triche) ; la question « consigne ignorée » attend les consignes d'équipe ;
  - l'écran « Calendrier » au paddock (`CHAMPIONNAT.calendrierSaison` : les 12 Grands Prix, fait ou à venir, vainqueur et ta place, le domicile marqué d'une maison en CSS) ; le Grand Prix à domicile a ses propres faits dans l'interview et la une (`domicileFete`, `domicileDecu`, juste après le titre de champion) ; la fiche du rival a sa photo stylisée (`PHOTO.portrait`) ; **le domicile n'arrive en jeu que quand les 12 tracés seront dans `CALENDRIER_CIRCUITS`** (accord du propriétaire) ;
  - `sponsors.js` : les sponsors (inventés, `textes.js`) : 2 à 4 offres entre deux saisons selon la note du joueur, un seul choisi (`SPONSORS_MAX`), un montant par saison et des objectifs suivis après chaque Grand Prix, primes créditées une fois par `ARGENT.crediter`, l'objectif spécial du Grand Prix à domicile ; l'écran après les contrats et le rappel au paddock ; `fiche.js` : la fiche d'un rival (caractère en mots d'après ses chiffres, saison, carrière, duels contre le joueur), ouverte d'un clic sur son nom au championnat ;
  - `argent.js` : les gains d'un Grand Prix et le solde, en calcul pur (`crediter`, `debiter`, jamais de dette) ; `garage.js` : les améliorations du joueur (prix, niveaux, plafond de 7 %, `appliquer(v, g)` pose `v.moteur`, `v.aero`, `v.freins`, 1 = rien, lus par `physique.js` et `robot.js`) ; les niveaux suivent le joueur (dans le championnat, pas dans l'écurie) ; l'écran « Garage » depuis l'écran du championnat ;
  - `journal.js` : la une du journal en calcul pur (les faits par priorité `JOURNAL_PRIORITES`, 3 titres par fait tirés avec la graine, jamais le même deux fois de suite, 2–3 brèves jamais sur le joueur ; l'album compact = des indices de pilotes et d'écuries, jamais des noms ; `rendre()` remet les phrases avec les noms de l'affichage) ; l'écran est `remplirUne` dans `interface.js`, dans l'ordre résultats → une → championnat ; le duel contre le coéquipier (score par saison et par carrière, `scoreDuel`, `completer` pour une ancienne sauvegarde) est dans `championnat.js`, affiché par `remplirDuel` ;
  - `camera.js` : les caméras de course (`derriere` par défaut, `cockpit`, `tele` ; touche C) et de survol (`?camera=auto`, `libre`, `dessus`, `virage`, `vitrine`) ;
  - `principal.js` : le démarrage, qui branche la physique et l'affichage sur la boucle, et enchaîne les écrans ; `?course=5|12|18|0` lance une course tout de suite, `?robot=1` fait conduire le robot ; `?ia=1` fait conduire l'IA ; `?ia=N` (2 à 20) montre une course de N IA, Tab change la voiture suivie ; `?circuit=test|technique` choisit le circuit (par défaut : test) ; `?debug=1` affiche les images par seconde, les triangles et les appels de dessin, la dérive, les g latéraux, et ce que coûte une voiture ;
  - `tests/lancer.py` : tous les tests (`tests/test.html` pour le moteur, `tests/ecrans.py` pour la vraie page avec Playwright, captures dans `tests/captures/` : `?test=fantome` (deux qualifications de suite), le départ parfait et le patinage joués dans la page `joueur=1`, `?championnat=1&tours=1` (duel, une du journal), `?test=sdk` (faux SDK)).

**Performance** : 60 images par seconde visées sur un ordinateur moyen, avec 20 voitures et un circuit détaillé. Le chargement doit être court. On mesure les images par seconde et le poids du jeu à chaque étape, et on note les mesures dans `SUIVI.md`.

## Règles de code

- **Tout en français** : variables, fonctions, fichiers, commentaires, commits (`moteur.js`, `donnees.js`, `pilotes.js`…).
- Un fichier = un rôle.
- **Tous les réglages sont dans les fichiers de données** : points, nombre de courses, caractères des pilotes, prix et plafonds des améliorations, circuits. Aucun réglage n'est un chiffre perdu dans le code.
- **Ni `Math.pow` ni `**` dans le calcul de la course** (`puissanceEntiere` à la place) : leur arrondi change selon la machine, et une graine doit rejouer exactement la même course partout (vu au tour 22).
- Chaque règle importante a un test : les points, le classement, les pénalités, les plafonds, la sauvegarde, et les IA en course simulée. Les tests passent avant de dire qu'une chose est finie.
- Les textes du jeu sont en anglais par défaut et en français si le navigateur est en français. Toutes les chaînes sont dans un seul fichier de traduction.

## Règles Poki

- Le jeu est déclaré **ordinateur seulement**. Il doit marcher en 960×600 et en 1280×720, sans défilement.
- Le script du SDK Poki est ajouté à l'`index.html` **du paquet** par `tests/paquet.py` (pas dans celui du dépôt : les tests en `file://` restent sans réseau ; décision du Chef, 2026-10-24). Tous les appels passent par `sdk.js`, et le jeu marche aussi sans le SDK. `python3 tests/paquet.py` fabrique `dist/grand-prix-dynasty.zip` (index.html à la racine, seulement les fichiers que la page charge) ; la partie « paquet » de `tests/lancer.py` ouvre le jeu depuis le zip et vérifie les règles Poki automatisables.
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
5. **Quand le critère de l'étape semble atteint**, le Chef **s'arrête et prévient le propriétaire** : ce qu'il faut essayer et comment. Rien ne passe à l'étape suivante sans l'accord du propriétaire. **Exception décidée par le propriétaire le 2026-10-27** (« n'attends pas les tests pour pouvoir passer à une autre étape ») : le Chef peut passer à l'étape suivante sans attendre ses essais ni ses accords, avec des choix réversibles (un réglage dans `donnees.js` pour revenir en arrière) ; tout ce qui attend son essai reste listé dans `SUIVI.md`, et ses retours priment dès qu'ils arrivent. Le passage GitHub vert avant chaque fusion reste obligatoire.

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

### Aller plus vite : les tests sur GitHub, plus de Codeurs ailleurs

Ajouté le 2026-10-22, à la demande du propriétaire (« le travail avance lentement du côté des codeurs »). **Le frein n'est pas le nombre de Claude, c'est l'ordinateur qui lance les tests.**

**La machine du propriétaire** : un Mac mini de 2014 (Intel i5, 2 cœurs / 4 fils, 8 Go). Une session Claude y prend environ 450 Mo et presque pas de processeur (elle réfléchit sur les serveurs d'Anthropic) ; ce qui coûte, c'est **un passage de tests** (Chrome sans fenêtre, 3D en logiciel, 30 courses entre IA), qui prend presque tout le processeur pendant plusieurs minutes. Les tests passent un par un (verrou `/tmp/gpd-tests.lock`, voir `SUIVI.md`). Avant GitHub Actions, la limite était **2 Codeurs qui testent** (un 3e attendait le verrou). Depuis que la suite complète tourne sur GitHub (voir plus bas) et que le Mac ne lance plus que des tests partiels : **au plus 3 Codeurs, plus le Chef** (4 Codeurs au grand maximum). Au-delà, ce n'est plus le processeur qui limite mais la mémoire (8 Go), le quota de l'abonnement Claude partagé par toutes les sessions, le temps du Chef pour relire et fusionner, et les conflits : deux Codeurs ne travaillent jamais en même temps sur le même fichier (le Chef leur donne des tâches sur des fichiers différents).

**1. La suite complète tourne sur GitHub Actions** (fichier `.github/workflows/tests.yml`). Le Chrome de GitHub est réglé en français (`LANG=fr_FR.UTF-8`), comme le Mac : sinon le jeu s'affiche en anglais et les tests qui lisent les textes échouent. Le dépôt `cotangeante-pi/Grand-Prix-Dynasty` est **public** : c'est gratuit et sans limite.
- À **chaque `git push`, sur n'importe quelle branche**, une machine de GitHub (Linux, Chrome déjà installé) lance `python3 tests/lancer.py` en entier et garde les captures de `tests/ecrans.py` (à télécharger depuis la page du passage, même en cas d'échec). Un nouvel envoi sur la même branche arrête le passage précédent.
- **Le résultat** : dans l'onglet « Actions » du dépôt sur GitHub, ou depuis le terminal (`gh` n'est pas installé sur le Mac ; on passe par l'API de GitHub avec le jeton que git a déjà dans le trousseau, **sans jamais l'afficher**) :
  ```
  T=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill | sed -n 's/^password=//p')
  A=https://api.github.com/repos/cotangeante-pi/Grand-Prix-Dynasty
  # l'état du passage du commit actuel
  curl -s -H "Authorization: Bearer $T" "$A/actions/workflows/tests.yml/runs?per_page=1&head_sha=$(git rev-parse HEAD)" | python3 -c "import sys,json;r=json.loads(sys.stdin.read(),strict=False)['workflow_runs'];print(*(r[0]['status'],r[0]['conclusion'],r[0]['id']) if r else ['aucun passage'])"
  # la sortie de lancer.py (remplacer RUN par l'id ci-dessus)
  J=$(curl -s -H "Authorization: Bearer $T" "$A/actions/runs/RUN/jobs" | python3 -c "import sys,json;print(json.loads(sys.stdin.read(),strict=False)['jobs'][0]['id'])")
  curl -sL -H "Authorization: Bearer $T" "$A/actions/jobs/$J/logs" | grep -E "✘|RESULTAT|⏱|ÉCHECS|TOUT PASSE"
  ```
  Depuis le 2026-10-26, **la suite tourne en 9 travaux parallèles** (une « matrix » dans tests.yml : moteur, courses, stands, ecrans en 4 tranches `ECRANS_TRANCHE=k/n`, annexes, paquet ; environ **5 minutes** au total). L'état du passage reste le même appel ; le détail de chaque travail :
  ```
  curl -s -H "Authorization: Bearer $T" "$A/actions/runs/RUN/jobs?per_page=50" | python3 -c "import sys,json;[print(j['id'],j['name'],j['conclusion']) for j in json.loads(sys.stdin.read(),strict=False)['jobs']]"
  curl -sL -H "Authorization: Bearer $T" "$A/actions/jobs/ID/logs" | grep -E "✘|RESULTAT|PARTIE OK|ÉCHECS"
  ```
  Chaque travail finit par « PARTIE OK : x » ou « ÉCHECS » ; le passage est vert seulement si les 9 le sont. Les captures : un artefact par travail.
  `completed success` = vert ; `completed failure` = rouge ; `in_progress` = pas fini. Pièges vécus : `json.loads(..., strict=False)` (les messages de commit ont des retours à la ligne) ; **toujours le jeton** (sans lui, GitHub coupe après 60 demandes par heure, et les journaux demandent d'être propriétaire) ; attendre en vérifiant toutes les 30 s au plus, pas plus souvent.
- **La nouvelle façon de travailler** :
  - **Le Codeur, pendant le travail** : seulement la partie concernée, sur le Mac, sous le verrou (`tests/lancer.py moteur|courses|ecrans|annexes`). **Il ne lance plus la suite complète sur le Mac** : il pousse sa branche et attend le vert de GitHub. Son compte rendu donne le lien du passage et son résultat.
  - **Le Chef** fusionne sur main **seulement si le passage GitHub de ce commit est vert**. Il relit la sortie du passage (il ne croit pas le compte rendu sur parole, comme toujours) et regarde les captures si c'est un tour qui se voit. Il relance lui-même une partie sur le Mac seulement s'il a un doute.
  - Après une fusion sur main, le passage de main doit être vert aussi. S'il est rouge, c'est la première chose à réparer.
  - « Toujours vert sur main » veut maintenant dire : **le passage GitHub de main est vert**.
- **Attention, Linux n'est pas macOS** : les polices ne sont pas les mêmes, donc les tests d'écran qui mesurent le texte (débordements, ellipses) peuvent donner un autre résultat sur GitHub que sur le Mac. Si un test échoue seulement sur GitHub, on regarde la capture : un vrai débordement se corrige dans le jeu ; un écart de police se corrige dans le test (marge), jamais en désactivant le test.
- **Le verrou** reste pour les tests sur le Mac. GitHub n'en a pas besoin : chaque passage a sa machine.
- **Réglé le 2026-10-23 (tour 22)** : main était rouge sur GitHub avec 6 tests verts sur le Mac (styles, régularité, erreurs, 25 dépassements, herbe, carte calculée en fond). Le Chef a comparé les empreintes au bit près : tout était identique entre le Mac et GitHub (fonctions Math sur 2000 entrées, physique, circuits, lissage) sauf `Math.pow(x, 7)` et `Math.pow(x, 6)` dans l'aplatissement de `ia.js` : **la fonction puissance de Chrome n'arrondit pas pareil sur macOS et sur Linux**. Remède : `puissanceEntiere(x, n)` (des multiplications, identiques partout) ; les `** 2` du moteur sont devenus `x * x`. **Règle : ni `Math.pow` ni `**` dans le calcul de la course** (trajectoire, physique, contacts, position sur piste). Un test épingle en dur les empreintes des trajectoires (Σécart test −5591.154986164103, technique −8626.812883967046) : si elles changent, c'est voulu (changement de réglage) ou c'est une dérive de machine à trouver. Depuis, **« vert » veut dire 0 échec**, sur toute branche.

**2. Plus de Codeurs, ailleurs que sur le Mac** (seulement quand le propriétaire le décide, pas encore en place au 2026-10-22) :
- **Le cloud d'Anthropic** : `claude --cloud "Tu es le Codeur 3. Lis CLAUDE.md et SUIVI.md. …"` lance une session sur une machine d'Anthropic, qui récupère le dépôt **depuis GitHub** (pousser avant !) et pousse sa branche. Suite : `claude -p "…" --cloud <session>` ; récupérer localement : `claude --teleport`. Elle utilise le même forfait Claude que le propriétaire. Elle **ne peut pas répondre au Chef par `SendMessage`** : son travail arrive par sa branche, ses comptes rendus dans `rapports/` et le passage GitHub Actions de sa branche. Chrome n'y est pas installé (à faire par un script d'installation de l'environnement, pas encore essayé).
- **GitHub Codespaces** : environ 60 h gratuites par mois sur 2 cœurs ; un Codeur y tourne comme sur le Mac (Claude Code à installer, `/login` par le propriétaire).
- **Oracle Cloud « Always Free »** : 4 cœurs et 24 Go gratuits, mais il faut une carte bancaire et être majeur ; à décider par le propriétaire.
- Dans tous les cas : **une branche par Codeur**, le passage GitHub de la branche doit être vert, et le Chef vérifie et fusionne, comme pour le Codeur 2.

**3. Des tours plus gros pour ce qui se vérifie avec des chiffres** (règles, points, sauvegarde, classements, journal, interview, tournoi) : jusqu'à 6 ordres par tour, puisque la vérification est automatique. Les tours qui demandent de jouer (conduite, sensation, beauté) restent petits et attendent le propriétaire.

### Pièges connus (déjà vécus sur `../../jeu poki`)

- **Le Mac doit rester éveillé**, branché, capot ouvert. Sinon, les tests « ne finissent jamais » à cause de la veille.
- **Tuer tous les processus de Chrome** après chaque test (le groupe entier, comme `../../jeu poki/tests/lancer.py`). Des processus GPU orphelins ralentissent tout et remplissent la mémoire.
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
- **La beauté : circuits détaillés et interface (étapes 10 et 11).** Les Claude ne voient le jeu qu'en captures d'écran. Le Chef prend des captures à chaque tour (comme `../../jeu poki/tests/ecrans.py`), les montre à le propriétaire et lui demande des retours précis (« plus de public », « couleurs ternes »).

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
| 0 | **Fondations** : dossier, `git init`, `index.html`, Three.js en local, boucle avec la physique à rythme fixe (120 fois par seconde, séparée de l'affichage), tests lancés par Python dans Chrome sans fenêtre (comme `../../jeu poki/tests/lancer.py`) | la page s'ouvre sans aucune erreur dans la console et `python3 tests/lancer.py` passe |
| 1 | **Un circuit simple, fait à partir de sa courbe** (des points au milieu de la piste) : route, vibreurs, murs, ligne d'arrivée, secteurs. Le même code servira aux 12 circuits | on survole le circuit avec une caméra libre |
| 2 | **La voiture** : sa forme, sa physique (accélération, freinage, adhérence, dérapage, aspiration), 3 caméras (derrière, cockpit, télé), un son de moteur, Espace pour revenir sur la piste | **Le propriétaire l'a conduite** et elle lui plaît |
| 3 | **Une course seule** : tours, chrono, temps de secteur, meilleur tour, choix 5/12/18 tours, pénalité pour virage coupé, écran de fin | on finit une course chronométrée de chaque longueur |
| 4 | **Les IA**, en quatre parties : **4a** une IA fait le tour seule (faite aux tours 7–8 avec une trajectoire calculée d'avance, à remplacer : l'IA choisit sa ligne en roulant) ; **4b** plusieurs IA sans se percuter ; **4c** elles dépassent et défendent leur place ; **4d** caractères des pilotes et niveaux de difficulté | une page de test simule 50 courses entre IA sans affichage et montre des résultats crédibles : les meilleurs gagnent souvent, mais pas toujours, avec des dépassements et quelques erreurs |
| 5 | **Une vraie course** : grille, feux de départ, faux départ, départ parfait (voir « Le départ parfait »), qualifications d'un tour (qu'on peut passer) avec le fantôme du meilleur tour (voir « Le fantôme du meilleur tour »), tour de classement en direct, minicarte, résultats, podium 3D | une course complète contre 19 IA, du départ au podium |
| 5b | **Le mode 2 joueurs** : écran partagé gauche/droite, deux joueurs sur le même clavier (WASD/ZQSD et flèches), 3 ou 5 tours, 0, 3 ou 5 IA, score de la rivalité, revanche (voir « Le mode 2 joueurs ») | deux joueurs finissent une course à deux sur le même clavier, sans qu'une touche de l'un bouge la voiture de l'autre, à 60 images par seconde mesurées avec 5 IA, et **Le propriétaire l'a essayé à deux** |
| 5c | **Le tournoi chrono entre copains** : de 2 à 8 joueurs chacun son tour, formules ⚡ Éclair et 🏆 Tournoi (3 manches, points), fantôme du leader, podium (voir « Le tournoi chrono entre copains ») | un tournoi de 3 manches à 4 joueurs se joue du début au podium, avec le bon classement, et **Le propriétaire l'a essayé avec d'autres joueurs** |
| 6 | **Le championnat** : création du pilote (nom, numéro, pays, casque : voir « Le casque du pilote » ; Grand Prix à domicile ou course de cœur : voir « Le Grand Prix à domicile »), après la course de découverte du premier lancement (voir « En piste en 10 secondes »), dans une petite écurie, les casques des rivaux, les 20 pilotes fixes, 10 écuries, calendrier de 12 Grands Prix, points, classements pilotes et écuries, fiches des rivaux, sauvegarde après chaque course, le score du duel contre le coéquipier (voir « Le duel contre le coéquipier »). **Les statistiques de carrière sont enregistrées dès cette étape** (pour l'étape 14) | on joue 3 Grands Prix, on ferme le navigateur, on revient, et tout est là |
| 7 | **Pneus et arrêt au stand** : une jauge d'usure, l'arrêt obligatoire en course de 12 et 18 tours, la voie des stands, les IA qui s'arrêtent aussi | l'arrêt change vraiment le classement de la course |
| 8 | **L'argent et le garage** : gains, achats (changeurs de roues, qualité de la F1 +7 % au maximum…), plafonds dans `donnees.js`, bonus quand le joueur bat son coéquipier, le réglage de l'aileron avec la carte de la prochaine course (voir « Le réglage de l'aileron ») | les améliorations se sentent, sans gagner la course à la place du joueur |
| 9 | **Les saisons** : contrats des écuries, sponsors (le joueur choisit et il est choisi, avec des objectifs), rivaux qui progressent, baissent, prennent leur retraite ou changent d'écurie, écuries qui montent ou baissent, le duel contre le coéquipier qui pèse sur les contrats et son écran de fin de saison, la réputation de l'interview d'après course qui pèse sur les sponsors et les contrats | on termine une saison et la suivante commence avec des changements visibles |
| 10 | **Les 12 circuits détaillés**, un circuit à la fois (décor, public, stands, lumière). Le tracé ressemble beaucoup au vrai circuit (reconnaissable au premier coup d'œil), avec un nom changé et sans logo | chaque circuit tient 60 images par seconde avec 20 voitures, et la mesure est notée dans `SUIVI.md` |
| 11 | **La grande passe sur l'interface** : style retransmission télé, animations, transitions, paddock, garage | Le propriétaire trouve que ça a l'air pro |
| 12 | **La météo** (décidée par le propriétaire le 2026-10-27, voir « La météo ») : prévision, pluie qui change en course, piste mouillée, pneus slicks / intermédiaires / pluie, choix au stand, les IA avec la même information | la pluie change la stratégie |
| 12b | **Les discussions** (décidées par le propriétaire le 2026-10-27, voir « Les discussions avec les pilotes et les écuries ») : parler aux rivaux, au coéquipier et aux patrons, en saisie libre ou au clic, des réponses depuis leur raisonnement, des messages qu'ils écrivent d'eux-mêmes | on discute avec un rival et sa réponse change ce qui suit |
| 11c | **La réalisation télé** (le propriétaire, 2026-10-27, voir « La réalisation télé ») : de vraies caméras dans le décor, l'hélicoptère, une régie qui ne coupe que sur une caméra qui voit la voiture | sur chaque circuit, la vue télé ne montre jamais un mur ni un immeuble à la place de la voiture |
| 11b | **Les aides au premier usage et le commentateur** (idées du propriétaire du 2026-10-27, voir les deux sections) | chaque système a son aide la première fois, et une course est commentée sans jamais gêner le pilotage |
| 13 | **Le résumé vidéo de la course** : les positions de toutes les voitures sont enregistrées pendant la course (même code que le fantôme du meilleur tour) ; on rejoue les moments forts (départ, dépassements, sorties de piste, arrivée) avec les caméras télé | après une course, on regarde son résumé |
| 14 | **La fin de carrière et les records** : retraite anticipée ou par l'âge (15 saisons), palmarès, records, temple de la renommée (avec les statistiques de l'étape 6), l'album des unes du journal, la relève (héritier, arbre de la dynastie, records de famille : voir « La relève : une vraie dynastie ») ou nouvelle dynastie | une carrière terminée affiche son bilan |
| 15 | **Poki** : SDK, pubs, traduction anglais/français complète, paquet zip, test sur inspector.poki.dev, temps du clic aux feux revérifié (voir « En piste en 10 secondes ») | le jeu passe l'inspecteur sans erreur, et un nouveau joueur est en piste en 10 secondes au plus |

## Façon de travailler avec le propriétaire

- Parler en français, simplement.
- Avant un gros changement, expliquer le plan en quelques lignes. Pour une décision de jeu (règle, équilibrage, nom, circuit, style), proposer, puis laisser le propriétaire choisir.
- Avancer par petits pas : un changement, on vérifie qu'il marche (tests, puis lancer le jeu), puis le suivant.
- Dire franchement ce qui ne marche pas ou ce qui n'a pas été vérifié.
- Si ce fichier ou le README disent autre chose que le code, c'est le code qui a raison : on corrige le texte.
- Commits : dans la boucle, le Codeur commite à chaque tour vert (le propriétaire l'autorise en lançant la boucle). En dehors de la boucle, ne commiter que quand le propriétaire le demande.
- Quand une décision est prise, la noter dans ce fichier, et enlever le « à approuver » correspondant.
- Seul le Chef parle de l'avancement à le propriétaire. Le Codeur lui répond s'il lui parle directement.
