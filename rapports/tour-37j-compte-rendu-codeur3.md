# Tour 37j — compte rendu du Codeur 3 (2026-10-30) : la 8e leçon, « La voiture vivante »

Branche codeur3, partie de 6afb8d9.

- **La leçon** (tutoriel.js) : `vivante`, la 8e, après la visite.
  - Elle se joue en essai libre sur le circuit technique, en expert, donc avec la voiture vivante (`course=0&circuit=technique&niveau=expert`).
  - La zone est celle de l'épingle, avec les mêmes plots que la leçon du freinage. La consigne : « Freine droit avant les plots, tourne, puis remets les gaz doucement (n / max) ».
  - **Réussie** au premier passage de l'épingle sans sortie de piste et sans que l'arrière glisse jusqu'à `TUTO_VIVANTE_ARRIERE` (0,5, dans donnees.js), mesuré par `SENSATIONS.glisseArriere`. Le passage est lu sans rien changer.
  - **Ratée** (« glisse », « sortie ») au bout de `TUTO_ZONE_ESSAIS` passages, ou (« temps ») si l'on ne fait rien.
  - Elle est proposée dans la liste, jamais imposée. Les 7 autres leçons ne changent pas ; seule la visite mène maintenant à la 8e.
- **Le robot** (tests/tutoriel.html, calcul pur) : le robot d'essai, réglé pour freiner droit (`ROBOT_DECELERATION` × 0,7, `ROBOT_MARGE_VIRAGE` × 0,7, le temps du test), la réussit : l'arrière monte à 0,12 au plus. Le robot d'origine, qui freine tard en tournant, fait partir l'arrière (1,0) et ne la réussit pas. C'est exactement ce que la leçon apprend.
- **Les tests** :
  - tutoriel.html : 19/19 (la 8e leçon, son adresse, la zone, réussie, ratée « glisse », ratée « temps », jouée par le robot ; les textes en fr et en en, jamais genrés) ;
  - textes.html : 1308/1308 ;
  - ecrans.py : la liste des leçons compte 8 étoiles.
  - Huit leçons ne tenaient plus en 960×600 : la liste est un peu plus serrée sous 680 px de haut (style.css).
- **Pas vérifié sur le Mac** (écran bloqué) : la liste en 960×600 et la leçon jouée dans la vraie page. Le passage GitHub vérifie la liste (ecrans.py et recoins.py).
