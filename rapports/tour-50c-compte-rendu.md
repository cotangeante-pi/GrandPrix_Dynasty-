TOUR 50c — compte rendu du Codeur 3 (branche perf-touches)
Commit : 15198c7 (GitHub 42315111087 : 18/18 vert) ; puis la fusion de origin/main 50e7c32 (sans conflit), passage en cours à l'arrêt.
Ordres : 1 fait / 2 fait / 3 fait.
1. Images/s de Spaa et Singapura (decor.js, donnees.js) : faces jamais vues retirées (immeubles 72 → 26 triangles, tribunes 96 → 70,
   spectateurs 24 → 20), le public en plaque au-delà de 108 m (DECOR_PUBLIC_DETAIL 0,6). Caméra de course, 20 voitures, au pire :
   spaa 107 008 → 88 712 triangles (moyenne 84 358 → 75 934) ; singapura 147 286 → 96 344 (132 307 → 85 290). Appels de dessin
   inchangés (43, 44 : ce sont surtout les voitures). Plafonds d'ecrans.py baissés (spaa 98 000, singapura 106 000). Captures
   avant/après de Singapura identiques à l'œil. La piste et ce qui sert à piloter ne changent pas ; l'Auto de qualite.js inchangée.
2. « ⌨ Touches » sur l'écran titre et dans le menu pause : depuis la pause, JEU.ecran reste « pause » (la course reste arrêtée),
   Échap annule le choix sans fermer la pause, puis ramène au menu pause ; pause(false) refusé pendant le choix. Le menu pause et
   l'écran des touches serrés sous 420 px de haut. Tests clavier-titre et clavier-pause en 640×360 : verts.
3. Tests instables : « sensations » (la mesure vide gardait les traces de pneus du robot : +1 appel), « à toi » du tournoi (une image
   très longue après le chargement mangeait le compte à rebours de 3 s : TOURNOI_COMPTE_DT_MAX 0,1 s par image), la route à deux
   (lecture avant que les caméras lissées soient en place : on attend deux images identiques). Tous verts sur 42315111087.
Ce que je n'ai pas pu vérifier : les vraies images/s (Mac trop chargé, charge 50 à 170) ; à mesurer par le propriétaire
(python3 tests/perf.py --fois 3). Le passage GitHub de la fusion avec main n'était pas fini à l'arrêt.
Prochaine étape : vérifier le passage GitHub de la tête de perf-touches (fusion de main) ; si vert, fusionner. Ensuite, pour gagner
des appels de dessin : les voitures (environ 6 appels par voiture détaillée), pas le décor.
Réévalue.
