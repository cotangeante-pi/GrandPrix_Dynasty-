TOUR 53d — compte rendu du Codeur 5
Branches : ui-amis (0059304, GitHub 18/18), tactile-suite
Ordres : écran Entre amis / à deux en 640×360 fait ; téléphone (a) (b) (c) faits

ui-amis : origin/main fusionné ; captures après, fr et en, 640×360 / 960×600 / 1280×720, relues et mesurées (aucun élément hors écran, aucun défilement). À 960, la rangée du casque (liste + 3 couleurs) sortait de la carte : `.deuxCasque select { width: 120px }`. Aucune règle ni nom changé.

tactile-suite :
(a) La bulle du premier départ de carrière (aide « depart », déjà en tac_*) dit maintenant comment tourner : « Tiens GAZ dans le vert et tu pars. Incline le téléphone pour tourner. » (ou « Appuie sur ◀ ▶ pour tourner. » en mode boutons) ; le départ parfait reste dans la ligne de la jauge (tac_departAide). Texte {d} résolu par texteDoigt. La découverte avait déjà « Tiens GAZ » / « Incline le téléphone » / « FREIN » (Codeur 2, tac_*) : inchangée.
(b) Images par seconde, 640×360, 9 IA + joueur robot, swiftshader, Mac chargé (relatif seulement) : clavier 2,28 et 2,11 ; tactile boutons affichés 2,25 et 2,35 ; tactile boutons cachés 2,36 et 2,34. Les boutons tactiles ne coûtent rien de mesurable (écart < bruit).
(c) Captures tactiles 640 et 960 de la découverte relues : en mode ◀ ▶, le radar passait derrière les boutons et l'aide « ◀ ▶ » de la découverte doublonnait les boutons, partiellement cachée sous la rangée 🔊 ⏸ ↩. Corrigé (body.tactileBoutons, posée par tactile.js) : l'aide ◀ ▶ est cachée ; le radar se pose au-dessus des boutons à 960 (120 px) et disparaît à 640 de haut (le rétroviseur montre l'arrière). Mode volant : rien ne change.

Limites : la bulle du départ en carrière n'a pas pu être capturée (qualification puis grille, Mac saturé) ; le texte est vérifié par évaluation dans la page (fr/en, boutons/volant). Tests : GitHub seulement.
Réévalue.
