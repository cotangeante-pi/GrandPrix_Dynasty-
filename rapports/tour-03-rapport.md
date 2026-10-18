TOUR 3 — fin de l'étape 1 + étape 2a (la voiture roule) — rapport du Chef
Commit vérifié : 0f741f1 (code 16de5dc)
Note : 15/100 — conduite 0/20, course et IA 0/20, championnat 0/15, interface 0/15, 3D et perf 5/15, code et tests 9/10, Poki 1/5
Tests : relancés par le Chef → TOUT PASSE (test.html 40/40, ecrans.py 42/42 ; ecrans.py a pris 372 s : la charge du Mac était à 14–16).
Mesures : 2956,3 m, 1478 échantillons, 16 014 triangles. Le propriétaire, sur son Mac, dans Chrome, pendant le tour 2 : **100 images/s** (le maximum de son écran).
Retour du propriétaire : « je vois la piste… elle est longue un peu comme je voulais ».

Ce qui marche (vérifié par le Chef) :
- dessus.png : tout le tour, damier, chicanes ; virage.png : vibreurs nets, barrière, bon rendu. Le moteur reste sans THREE. Bon tour.

Ce qui ne va pas :
- Les ondulations, je les vois aussi sur dessus.png : la droite de gauche est cassée en deux endroits (elle rentre vers l'intérieur), la droite du bas ondule entre la chicane et le virage de droite, et il y a une bosse après la chicane du haut. Avec une voiture, ce seront des « faux virages » sur des droites, et la trajectoire des IA en souffrira. C'est l'ordre 1.
- Test de vitesse : j'accepte « la meilleure de 15 » ; ajoute seulement un garde-fou : médiane < 10 ms (attrape une vraie régression, pas la charge du Mac).

ORDRES :

1. Plus d'ondulations. Au choix (explique ton choix) : des points de contrôle plus réguliers, ou un circuit décrit par morceaux (droite de L m, virage de rayon R sur A degrés) puis converti en points. La description par morceaux est probablement plus sûre pour les 12 vrais circuits. Teste-le avec des chiffres : sur les portions marquées « droite », |courbure| < 1/3000 par mètre ; dans un virage, la courbure ne change pas de signe ; dans une chicane, elle change de signe le bon nombre de fois.
   Fini quand : ces tests passent et que dessus.png montre des droites droites.

2. La physique de la voiture (`physique.js`, calcul pur, sans THREE) : un modèle « vélo » simplifié. État : x, z, cap, vitesse avant, vitesse latérale, vitesse de lacet. Entrées : gaz 0–1, frein 0–1, direction −1…1 (au clavier, la direction et les gaz montent et descendent progressivement, réglable). Arcade mais crédible, comme une F1 : vitesse max ≈ 330 km/h, 0–100 en ≈ 2,6 s, freinage très fort, appui aérodynamique (plus d'adhérence à haute vitesse), direction moins sensible à haute vitesse, dérapage si on entre trop vite. Sur l'herbe : moins d'adhérence, plus de frottement. Barrières : la voiture s'arrête ou rebondit contre elles, sans jamais les traverser. Tous les chiffres dans `donnees.js`. Le joueur et les IA utiliseront EXACTEMENT ce code.
   Fini quand : des tests vérifient le 0–100, la vitesse max, la distance de freinage de 300 à 80 km/h, la vitesse stable dans un virage de rayon R, l'herbe qui ralentit, une barrière jamais traversée (même à 330 km/h de face), et que les mêmes entrées donnent exactement la même trajectoire, à 30 comme à 144 images/s.

3. La F1 en 3D (`voiture3d.js`) : faite par le code, peu de triangles, mais qu'on reconnaisse une F1 : nez, ailerons avant et arrière, pontons, halo, 4 roues qui tournent selon la vitesse ; les roues avant braquent. Une couleur d'écurie en paramètre (préparation des 20 voitures). L'affichage interpole avec `alpha` entre l'état d'avant et l'état d'après, sinon ça saccade.
   Fini quand : une capture de près (voiture.png) montre une F1 reconnaissable, et un test vérifie que la position dessinée est bien entre l'état d'avant et l'état d'après.

4. Conduire : flèches / WASD / ZQSD (e.code). La voiture part sur la ligne de départ. C passe d'une caméra à l'autre : derrière (qui suit avec un ressort amorti, le champ de vision s'élargit un peu avec la vitesse), cockpit, télé (caméras fixes au bord de la piste qui suivent la voiture). Espace remet la voiture sur la piste au point le plus proche, au centre, dans le bon sens, à l'arrêt. Un petit affichage provisoire : vitesse en km/h, « hors piste ». `?camera=libre` marche toujours.
   Fini quand : des tests simulent des touches et vérifient que la voiture avance, tourne, freine, et qu'Espace la remet sur la piste ; captures : derriere.png, cockpit.png, tele.png.

5. Le robot d'essai (préparation des IA, ce n'est PAS encore l'IA) : un pilote automatique naïf qui vise un point un peu plus loin sur la ligne du milieu et freine selon la courbure devant lui, avec les mêmes entrées qu'un joueur. Il sert à prouver que la physique permet de faire un tour.
   Fini quand : `BOUCLE.simuler` fait faire un tour complet au robot, sans toucher de barrière ; le temps au tour est affiché dans la sortie des tests (je m'attends à 45–75 s pour 2,96 km) ; ce test tourne en moins de 5 s.

Le son du moteur sera pour le tour 4. Écris `rapports/tour-03-compte-rendu.md`, commite « Tour 3 : la voiture roule » si tout est vert, et envoie-moi le compte rendu avec « Réévalue. ». Si ce tour est trop gros pour être vert avant 20h40, fais 1, 2 et 4 d'abord (avec une boîte à la place de la F1), commite-les, et dis-moi ce qui reste.

Questions pour le propriétaire :
- essayer `index.html?camera=libre` (glisser la souris, molette, flèches) ;
- après ce tour : conduire la voiture et dire ce qu'il ressent.
