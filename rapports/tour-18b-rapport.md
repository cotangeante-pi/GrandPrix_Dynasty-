TOUR 18b — Codeur 2 (session-9e) : ce qui se voit à l'écran — rapport du Chef
Chef : session-76. Codeur 1 : session-dd (les IA, et le podium déjà commencé). Codeur 2 : session-9e (nouveau, donné par le propriétaire le 2026-10-21 à 18h20).
Base : main a33c54d. Note actuelle : 55/100.

COMMENT ON TRAVAILLE À TROIS
- Codeur 2 travaille UNIQUEMENT dans sa copie : …/jeu/jeux poki/Grand Prix Dynasty - codeur 2 (git worktree, branche codeur2). Il ne touche jamais au dossier « Grand Prix Dynasty » (celui du Codeur 1).
- Il commite sur la branche codeur2 quand `python3 tests/lancer.py` passe. Il ne fusionne pas sur main et ne pousse pas : c'est le Chef qui vérifie et fusionne.
- Fichiers : Codeur 2 s'occupe de camera.js, voiture3d.js, scene3d.js et de ce qu'il crée. Il ne modifie PAS ia.js, simulation.js, podium3d.js ni l'écran de résultats (Codeur 1). S'il doit toucher interface.js, style.css, index.html, textes.js, donnees.js ou les tests, il ajoute ses lignes sans réorganiser le reste (pour que la fusion soit simple).
- CLAUDE.md : une autre session y écrit des idées ; ne pas toucher à ses changements. Ses propres lignes de documentation : dans son compte rendu, le Chef les ajoutera.
- UN SEUL passage de tests à la fois sur le Mac (sinon les tests de vitesse échouent pour rien). Toujours lancer les tests ainsi :
    while ! mkdir /tmp/gpd-tests.lock 2>/dev/null; do sleep 10; done; python3 tests/lancer.py; rmdir /tmp/gpd-tests.lock
  (si le verrou a plus de 15 minutes et qu'aucun test ne tourne, on peut l'enlever). Après chaque passage : 0 Chrome --headless restant.
- Horaires : jusqu'à 21h. Rien de nouveau après 20h40, dernier commit à 20h50 seulement si vert, compte rendu avant 20h55.

ORDRES (demandes du propriétaire, AJOUT 3 du tour 18) :
1. La vue cockpit (2e vue de la touche C) : sur tests/captures/cockpit.png, le pilier central du halo coupe l'image en deux et l'arceau prend le haut. Le propriétaire : « la caméra ne doit pas être bloquée par l'espèce de barre noire, elle doit être devant ». La caméra passe DEVANT le halo (au-dessus et en avant du pilote, comme une caméra embarquée) : ni pilier ni arceau devant la piste. On voit encore un peu la voiture (nez, roues avant qui braquent) pour sentir la vitesse.
   Fini quand : cockpit.png sans pilier ni arceau au milieu de l'image, un test vérifie que la caméra est devant le halo, les autres vues ne changent pas.
2. Le propriétaire : « essaie de faire ça plus détaillé mais avec moins de difficultés fps ». Plus de détails, visibles surtout dans cette vue : aileron avant, suspensions, rétroviseurs, volant avec un petit écran s'il est visible. Tout fait par le code et FUSIONNÉ dans les géométries existantes : au plus 7 appels de dessin par voiture (6 aujourd'hui), moins de 1500 triangles. Les détails fins seulement pour la voiture du joueur ; les autres gardent le modèle léger.
   Fini quand : ?debug=1 affiche appels et triangles sous les limites (testé), capture cockpit.png et derriere.png.
3. Si 1 et 2 sont verts avant 20h : les feux de départ (étape 5, CLAUDE.md) : cinq feux rouges qui s'allument un par un (1 par seconde), puis s'éteignent tous après un délai un peu aléatoire (graine) : c'est le départ. Partir avant l'extinction = faux départ, +5 s de pénalité (même règle des pénalités : affichée en course, appliquée à l'arrivée). Remplace le 3-2-1-GO dans les courses avec IA (?ia=N&joueur=1) ; les bips du son suivent les feux. Les IA partent à l'extinction, avec un petit temps de réaction tiré de la graine (pas de faux départ pour elles pour l'instant).
   Fini quand : test moteur (faux départ = +5 s, départ à l'extinction = 0) ; ecrans.py : les 5 feux visibles, capture feux.png ; console vide.

Compte rendu à session-76 par SendMessage après chaque ordre vert (court), et un compte rendu complet dans rapports/tour-18b-compte-rendu.md avant 20h55, puis « Réévalue. ».

AJOUT (2026-10-21, ~18h50) — DEMANDE D'LE PROPRIÉTAIRE, priorité juste après l'ordre en cours : « quand on est arrivé à la fin, on a une vue de télé sur la course jusqu'à ce que tout le monde ait fini ».
4. Après l'arrivée du joueur : sa voiture ralentit seule (comme aujourd'hui), l'interface de course reste (tour de classement, avec les pilotes arrivés marqués 🏁), et la caméra passe en vue télé (les caméras le long de la piste, CAMERA tele) sur les voitures encore en course : d'abord le groupe le plus proche de l'arrivée ou la bagarre la plus serrée, et elle change de voiture quand celle qu'elle suit passe la ligne. Un bandeau « Arrivée — en attendant les autres pilotes » et un bouton/touche pour passer directement au podium.
   Le podium (et les résultats) n'arrivent que quand TOUTES les voitures ont fini (une voiture à un tour ou plus finit à son prochain passage de ligne, comme en vraie course), ou au plus tard après ARRIVEE_ATTENTE_MAX secondes (donnees.js, par exemple 90 s) ; les voitures pas arrivées sont alors classées dans l'ordre de course.
   Avant de commencer : fusionne dans codeur2 le commit fc178b3 (main avec le podium d'session-dd + ta vue cockpit, que je vérifie) : `git merge fc178b3`. Le podium est dans podium3d.js / interface.js (Codeur 1) : tu changes seulement QUAND il se déclenche, pas le podium lui-même.
   Fini quand : test moteur (le podium attend la dernière voiture, ou la limite) ; ecrans.py : après l'arrivée du joueur, la caméra est en vue télé sur une voiture encore en course, le bouton « passer » mène au podium ; capture apres-arrivee.png ; console vide.

AJOUT 2 (2026-10-21, ~19h05) — ÉTAPE 6 COMMENCÉE EN PARALLÈLE (accord du propriétaire : « fais commencer l'étape 6 à session-9e quand il aura fini ce qu'il fait »). Seulement la partie calcul pur, sans écrans ; les noms, écuries et circuits définitifs attendent le propriétaire.
5. championnat.js (nouveau fichier, calcul pur, sans Three.js ni DOM) :
   - les points : REGLAGES.POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] ; NB_GRANDS_PRIX = 12 (donnees.js) ;
   - 10 écuries de 2 pilotes, 20 pilotes fixes dont le joueur. Noms PROVISOIRES et neutres, marqués « à approuver par le propriétaire » dans donnees.js (« Écurie 1 »…, « Pilote 2 »…), un niveau de voiture par écurie ; le joueur dans une des écuries les plus faibles (CLAUDE.md). Chaque pilote IA garde son caractère (celui d'ia.js, tiré avec une graine fixe de championnat) ;
   - le calendrier : 12 Grands Prix, pour l'instant sur les deux circuits d'essai en alternance (les 12 vrais circuits viendront à l'étape 10) ;
   - enregistrerCourse(championnat, resultatFinal) : prend le classement final (pénalités comprises, classementFinal) et met à jour les points, les classements pilotes et écuries (égalités départagées par le nombre de victoires, puis de 2es places…), et les statistiques de carrière de chaque pilote (courses, victoires, podiums, poles, meilleurs tours, points) — CLAUDE.md : enregistrées dès l'étape 6 ;
   - la sauvegarde passe par sauvegarde.js (le seul module) : numéro de version augmenté, ancienne sauvegarde (records) transformée sans rien perdre, sauvegarde après chaque course.
   Fini quand : tests moteur : points d'une course, classement pilotes et écuries avec égalités, 3 Grands Prix simulés (simulerCourse) puis sauvegarde → rechargement → tout est identique (points, classements, stats, n° du prochain Grand Prix) ; ancienne sauvegarde v1 transformée ; aucun réglage en dur. Commit sur codeur2 (suite complète verte), message au Chef.
   Pas d'écran de championnat, pas de création du pilote, pas de branchement dans la page : ce sera au tour suivant, après les retours du propriétaire sur les noms.
