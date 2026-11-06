TOUR 49a-2 — étape 11 (le nouveau paddock) — compte rendu du Codeur 1
Branche : paddock-fond (depuis origin/main a2721e4, qui contient la fusion de qualite-auto)
Commit : voir la fin (le dernier commit de la branche ; 9b98e11 = dernier passage GitHub complet vert, 42156030930, 18/18)

Ordre : l'arrière-plan du paddock et des menus : fait.
- stand3d.js (nouveau, un rôle) :
  - la pose de la voiture en calcul pur. Avec une voie des stands : dans la zone d'arrêt du joueur (celle de son écurie, marquée au sol
    à ses couleurs). Sans voie des stands : devant le garage de son écurie (decor.js donne maintenant `ecurie` à chaque garage), le nez
    vers la piste. Sinon : sur la ligne ;
  - la caméra qui tourne autour (6,5 m, 2,2 m de haut, 0,12 rad/s : un tour en 52 s) ;
  - quatre mécaniciens (jambes, buste à la couleur de la voiture du joueur, casque) en trois InstancedMesh.
  Réglages STAND3D_* dans donnees.js ; STAND3D_ACTIF faux rend l'arrière-plan d'avant.
- principal.js majStand : sur tout écran de la carrière qui n'est pas la course (paddock, garage, calendrier, interview, une, contrats,
  courrier…), dans la scène principale (pas de second rendu) : les autres voitures et le fantôme cachés, la voiture du joueur (sa livrée)
  au stand, la caméra du stand. La course, la qualification, la grille, le podium et les résultats gardent leur 3D ; à la sortie, la
  caméra de course repart sans glisser (CAMERA.forcer). Rien ne roule : la physique ne fait déjà rien hors de la course.
- Choix du Codeur (réversible) : la zone d'arrêt plutôt que le garage quand il y a une voie des stands. Sur certains tracés
  (Montréol, Melbourn, Barcelana, Bahrayn, Yas Marino), le décor n'a pas la place du garage de chaque écurie, et sur Monoco, en jeu,
  celui du joueur manquait.
- Tests :
  - tests/test.html : devant le garage de chaque écurie, le nez vers la piste ; sur Monoco et Monzo, dans la zone d'arrêt du joueur ;
    sans stands ni décor, sur la ligne ; la caméra à rayon constant, qui tourne ; les mécaniciens jamais sur la voiture ;
  - tests/ecrans.py test=fond (1280×720, ?championnat=1&gp=5, Monoco) : rien ne bouge en 2,5 s (voitures, joueur), aucune autre
    voiture, la livrée du joueur, la caméra qui tourne à 6,5 m, le coût noté, « Course suivante » mène à la qualification (le stand
    disparaît, les autres voitures reviennent). Captures paddock-fond-1280.png et paddock-fond-seul-1280.png (sans les menus).
  - tests/ecrans-durees.json : test=fond (15 s) et test=retro (5 s).

Sortie des tests : GitHub b5feb73 → 42154001192 vert 18/18 ; 9b98e11 → 42156030930 vert 18/18. Avant : 8c759d9 rouge (ma page
s'appelait test=stand, déjà prise par le test de l'arrêt au stand : nom changé en test=fond), d509ea6 rouge (le garage du joueur
manquait sur Monoco en jeu : la zone d'arrêt passe d'abord).

Mesures (GitHub, swiftshader, Monoco, 1280×720, derrière le paddock) : 34 appels de dessin, 107 664 triangles.

Ce que je n'ai pas pu vérifier :
- Après un Grand Prix, avant « Course suivante » (qui recharge la page sur le suivant), le décor est encore celui du circuit qu'on
  vient de courir : le prochain circuit n'apparaît qu'au rechargement.
- Le paddock couvre presque tout le milieu de l'écran : la voiture se voit surtout entre les cartes (la capture « seul » la montre).
- Rien testé sur le Mac (trop chargé) ; pas de capture en 960 ni en 640×360 ; l'écran titre du premier lancement n'est pas une page
  de carrière : il garde son arrière-plan.

Réévalue.
