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
