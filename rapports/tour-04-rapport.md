TOUR 4 — étape 2b (le son et les outils de réglage pour le pilote d'essai) — rapport du Chef
Commit vérifié : f2573ed (code 43a3fa8)
Note : 27/100 — conduite 7/20, course et IA 1/20, championnat 0/15, interface 2/15, 3D et perf 7/15, code et tests 9/10, Poki 1/5
Tests : relancés par le Chef → TOUT PASSE (test.html 58/58, ecrans.py 63/63, 73 s ; charge du Mac 7–9).
Mesures : CIRCUIT_TEST 3100,0 m. Robot : 66,55 s, 0 contact. 0–100 en 2,64 s, 329 km/h, 300→80 en 101 m.

Ce qui marche (vérifié par le Chef) :
- dessus.png : les ondulations ont disparu, les droites sont droites. Circuit par morceaux : bon choix.
- voiture.png : on reconnaît une F1 (nez, ailerons, halo, casque, roues). derriere.png : propre.
- la physique est testée avec des chiffres, et elle est déterministe à 30, 60 et 144 images/s. Très bon tour.

Ce qui ne va pas (à confirmer par le propriétaire, PAS d'ordre de réglage avant son essai) :
- cockpit.png : le halo prend tout le haut de l'écran et son pilier coupe la route en deux. Le capot bleu prend un tiers de l'image. C'est probablement trop pour un jeu : on attend l'avis du propriétaire.
- la caméra derrière est loin : la voiture est petite à l'écran. Pareil, on attend l'avis du propriétaire.

Le propriétaire conduit pendant ce tour. Ce tour ne doit PAS changer la sensation de conduite (ni les réglages de physique, ni les caméras), pour qu'il juge une version stable. Ses retours viendront dans le tour 5.

ORDRES :

1. Le son (`son.js`, Web Audio, synthétisé, sans fichier) : le moteur (le régime suit la vitesse et le rapport, il monte en accélérant et retombe à chaque changement de rapport), le crissement des pneus quand la voiture glisse (angle de dérive au-dessus d'un seuil), un choc contre une barrière. Aucun son avant le premier geste ; son coupé quand l'onglet est caché ; touche M et un petit bouton 🔊 pour couper ou remettre. Tous les chiffres dans `donnees.js`.
   Fini quand : des tests vérifient (sans écouter) que le régime calculé monte avec la vitesse, retombe au changement de rapport, que rien ne joue avant un geste, et que M coupe ; console vide.

2. Les rapports de boîte, juste pour l'affichage et le son : 8 rapports automatiques calculés à partir de la vitesse. Ils ne changent PAS la physique. L'affichage montre le rapport à côté des km/h.
   Fini quand : un test vérifie que la physique donne exactement la même trajectoire qu'au tour 3 (même entrée → mêmes positions), et que le rapport passe de 1 à 8 sur une accélération à fond.

3. Le panneau de réglage pour le pilote d'essai : `?reglages=1` ouvre un petit panneau avec des curseurs pour les réglages qui comptent pour la sensation (adhérence, appui, braquage maximum, braquage réduit avec la vitesse, vitesse de la direction au clavier, freinage, puissance, distance et hauteur de la caméra derrière, épaisseur du halo en cockpit). Les changements s'appliquent tout de suite, en roulant. Un bouton « copier » met les valeurs changées dans le presse-papiers, prêtes à recopier dans `donnees.js`. Sans `?reglages=1`, le panneau n'existe pas.
   Fini quand : un test change un curseur et vérifie que la valeur dans REGLAGES change ; capture reglages.png.

4. Les mesures pour le réglage : `?debug=1` affiche en plus l'angle de dérive, les g latéraux et les triangles de la voiture seule. Écris dans le compte rendu le nombre de triangles d'une voiture (pour prévoir 20 voitures).
   Fini quand : les valeurs s'affichent ; un test les vérifie à l'arrêt (0 g, 0° de dérive).

Écris `rapports/tour-04-compte-rendu.md`, commite « Tour 4 : le son et le panneau de réglage » si tout est vert, puis envoie-moi le compte rendu avec « Réévalue. ». À 20h40, je te dirai de terminer ; si le tour ne peut pas être vert avant 20h40, commite ce qui est vert et dis-moi ce qui reste.

Questions pour le propriétaire (pendant ce tour) : conduire `index.html`. Est-ce que la voiture tourne trop ou pas assez ? Le freinage est-il trop fort ou trop mou ? Trop facile ou trop dur de rester sur la piste ? Les caméras (C) : derrière trop loin ? Le cockpit, trop chargé ?

AJOUT (19h15, retours du propriétaire après sa conduite) : ORDRE 5 — caméra derrière à distance fixe (cause : retard du ressort = 2v/w ≈ 20 m à 90 m/s), champ de vision +6° au maximum. ORDRE 6 — direction au clavier en deux temps (rapide jusqu'à ~35 %, puis lente jusqu'à 100 %), BRAQUAGE_VITESSE ≈ 18. À faire en premier. Détail dans le message envoyé au Codeur.
