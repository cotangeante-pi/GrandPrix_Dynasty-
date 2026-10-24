CIRCUITS RESSEMBLANTS — compte rendu du Codeur 3 (2026-10-23, 18h35 → 19h10 ; Chef : session-5b)
Commit : 97ac321 (branche circuits, à jour d'origin/main c0e4cb3), poussé. Passage GitHub 40037738133 : « completed success », TOUT PASSE
(test.html 157/157, courses 38/38, ecrans 320/320, sdk 19/19, pneus 28/28, enregistreur 28/28, circuits-a 49/49, circuits-b 45/45, textes 168/168).
Mac (sous le verrou) : annexes, 0 Chrome --headless restant. Aucun Math.pow ni ** dans les données.

Ordres : 1 fait (les 12 tracés refaits, données seulement) / 2 fait (Suzuko en huit, croisement marqué, test adapté ; le pont 3D PAS FAIT : étape 10) / 3 fait (aucun test retiré ; deux adaptés, voir plus bas) / 4 fait (les deux .svg refaits, avec les noms des virages, la ligne de départ et le sens).

LA MÉTHODE (tests/circuits-outil.py, nouveau, Python sans dépendance) :
- il relit les deux fichiers de données, refait la géométrie des morceaux comme circuits.js (droite, virage, chicane = 3 arcs), et affiche pour chaque circuit ce que vérifient les tests : longueur (et la vraie), fermeture, somme des angles, rayon le plus serré, écart le plus petit entre deux parties éloignées (croisement), point de dépassement ;
- `--fermer` : les deux droites marquées « (referme le tour) » sont recalculées pour que la boucle se referme exactement (2 inconnues, 2 équations linéaires : les caps ne dépendent que des virages) ; il n'écrit jamais une longueur négative ;
- `--svg` : redessine tests/circuits-a.svg et -b.svg (2 colonnes × 3 lignes) : le tracé, la ligne de départ en rouge, une flèche pour le sens, un point et le nom de chaque virage célèbre (`reperes` dans les données : [indice du morceau, nom]), le pont du huit ;
- les tracés eux-mêmes ont été dessinés comme des POLYGONES (des points en mètres d'après la forme du vrai circuit, un rayon par sommet, des chicanes posées sur une arête), convertis en morceaux par un script de travail (pas dans le dépôt) ; Monzo et Spaa ont été écrits directement en morceaux. Les données du dépôt sont le format du jeu, rien d'autre.

LES 12 TRACÉS (longueur du tracé / la vraie) et les éléments qu'on doit reconnaître (tous présents, nommés dans le .svg) :
- Monoco 3,262 km / 3,337 : Sainte-Dévote, Beau Rivage, Massenet, Casino, Mirabeau, l'épingle, Portier, le tunnel, la chicane du port, Tabac, la Piscine (deux chicanes), la Rascasse, Anthony Noghès. À RESSERRER : l'épingle n'est qu'un virage de 108° (rayon 10 m), pas un vrai demi-tour ; la forme polygonale ne donne pas un 180° sans recroiser le tracé à cet endroit (seuil de 39 m entre deux parties). Largeur 11 m.
- Silverstoun 5,574 km / 5,891 : Abbey, Farm, Village, The Loop, Aintree, la droite de Wellington (876 m), Brooklands, Luffield, Woodcote, Copse, Maggotts-Becketts-Chapel, la Hangar Straight (852 m), Stowe, Vale, Club.
- Monzo 5,506 km / 5,793 : la droite des stands (1 100 m), la première chicane, Curva Grande, la deuxième chicane, Lesmo 1 et 2, le Serraglio, Ascari, la Parabolica.
- Spaa 6,879 km / 7,004 : La Source, Eau Rouge / Raidillon, Kemmel (900 m), Les Combes, Malmedy, Rivage, Pouhon, Fagnes, Stavelot, Paul Frère, Blanchimont, l'arrêt de bus.
- Suzuko 6,200 km / 5,807 (+6,8 %) : UN HUIT : virages 1-2, les S, Dunlop, Degner 1 et 2, l'épingle, 200R, Spoon, le pont, 130R, la chicane. Le croisement est marqué dans les données (`croisement: [1560, 4140]`, m le long du tour) ; les deux passages se coupent à 77° ; la somme des angles est 0°.
- Interlagas 4,387 km / 4,309, sens inverse : S do Senna, Curva do Sol, la Reta Oposta, Descida do Lago, Ferradura, Laranja, Pinheirinho, Bico de Pato, Mergulho, Junção, la montée vers la ligne.
- Montréol 4,359 km / 4,361 : l'île longue et étroite, deux chicanes, l'épingle au bout, la grande droite du retour (2 028 m), la chicane finale et le « mur des champions ». Attention : écart le plus petit entre deux parties 41,8 m pour un seuil de 41 m (serré : à élargir si la spline le rapproche).
- Melbourn Park 5,262 km / 5,278 : le tour du lac, 16 virages, rapide et fluide (forme générique : le vrai est un peu plus « cabossé »).
- Barcelana 4,671 km / 4,657 : la longue droite des stands, le premier droite-gauche, la longue courbe rapide du virage 3, les virages 4-5, 7-9, 10, 12-13, la chicane, le virage 16.
- Bahrayn 5,241 km / 5,412 : le virage 1 en épingle, de longues droites et des freinages forts (virages 4, 8, 10, 11, 13, 14) ; la forme reste simple, moins fidèle que les autres (le vrai a une partie intérieure plus tortueuse).
- Singapura 4,942 km / 4,940, sens inverse : des angles droits dans les rues, une seule vraie droite.
- Yas Marino 5,311 km / 5,281, sens inverse : le virage 1, les courbes 2-4, l'épingle, les deux longues droites (956 et 804 m), le virage 9, le secteur sinueux autour de l'hôtel. Note : le test « Yas Marino est le plus long des 6 » de circuits-b.html reste vrai (5,311 contre 5,241 pour Bahrayn), alors que les vrais Bahreïn (5,412) et Abou Dabi (5,281) sont dans l'autre ordre : j'ai gardé Bahrayn un peu court (−3,2 %) pour ne retirer aucun test ; à trancher par le Chef.

ORIENTATION : le départ part toujours vers +x (depart [0, 0, 0], exigé par le test) : chaque vue de dessus est donc le vrai circuit TOURNÉ (et pour Monoco à peu près à l'envers) par rapport aux cartes habituelles, pas déformé. Si le propriétaire veut les cartes dans le sens habituel, une rotation par circuit (donnée `carte: angle`, seulement pour le .svg et la carte du garage) suffit.

LES TESTS (aucun retiré) :
- circuits-a.html : la plage de longueur devient la vraie longueur (vraieLongueur, dans les données) à ±10 % (bornes globales 3 à 7,1 km : Monaco 3,337, Spa 7,004) ; « tour complet » admet 0° pour Suzuko (SENS.suzuko = 0) ; « aucun croisement » reste partout, sauf pour un circuit avec `croisement` : alors exactement un croisement, tous les points proches à moins de 80 m de l'endroit marqué, et les deux passages à 60–90° ;
- circuits-b.html : la longueur doit aussi être à ±10 % de vraieLongueur ; le reste inchangé (refermé < 1 m, pas de croisement, largeur, rayon, point de dépassement, Yas Marino le plus long).

Pour CLAUDE.md (à ajouter par le Chef) :
- liste des fichiers : « circuits-officiels-a.js, -b.js : les 12 tracés officiels (données seulement, pas branchés), d'après la forme des vrais circuits : vraieLongueur, reperes (virages célèbres), croisement (Suzuko, un huit : le pont en 3D à l'étape 10) » ;
- tests : « tests/circuits-outil.py : --fermer referme un tracé par ses deux droites « (referme le tour) », --svg redessine les vues de dessus ; tests/circuits-a.html admet le huit de Suzuko » ;
- « Le championnat et les saisons » : « Suzuko se croise (le seul croisement permis) : le tracé passe deux fois au même endroit, le pont est pour l'étape 10 ».

Ce que je n'ai pas pu vérifier : la ressemblance « au premier coup d'œil » : c'est le propriétaire qui juge, dans Chrome, sur tests/circuits-a.svg et -b.svg ; le comportement des IA sur ces tracés (rien n'est branché : ?circuit= ne les connaît pas) ; le pont de Suzuko en 3D (étape 10) ; l'effet de la spline (PAS_ECHANTILLON) sur l'écart de Montréol (41,8 m). À faire ensuite, si le Chef le veut : l'épingle de Monoco, Bahrayn et Melbourn plus fidèles, la rotation des cartes.
Réévalue.
