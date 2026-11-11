TOUR 53e — compte rendu du Codeur 5
Branche : iphone-grille (depuis origin/main)
Ordres : « Activer le volant » sur la grille (fait) ; plein écran refusé dans l'iframe de Poki (fait, testé)

1. TACTILE_IPHONE_GRILLE (donnees.js, vrai) : le bouton « 🎮 Activer le volant » n'est plus sur l'écran titre ; il apparaît sur la grille de la course, pendant les feux (course.etat === 'compte'), gros (20 px, 14×26 px de marge ; 16 px en 640×360), au centre-bas, sous les feux (il couvre un instant la vitesse et la barre des pneus, qui ne servent pas avant le départ). Un appui demande la permission ; le neutre est repris au départ comme avant ; sans réponse à l'extinction des feux, le bouton part et les boutons ◀ ▶ restent. Faux = l'écran titre, comme avant. Captures fr/en 640 et 960 regardées.
Test (page tactile-iphone, 960×600, 58 s sur le Mac) : titre sans le bouton ; grille avec le bouton (taille, centre, bas, feux non recouverts) ; accordée → mode attente puis volant ; refusée → ◀ ▶ ; sans réponse à l'extinction → ◀ ▶ et bouton parti. ecrans.py ciblé : 18/18.
2. Plein écran refusé : le test remplace requestFullscreen par un rejet : demandé une seule fois, sans erreur (console vide), le téléphone debout sur la grille affiche « Tourne ton téléphone » et met la course en pause ; couché, le message part. Le code (premierGeste) gérait déjà le refus : aucun changement de code.
Durée de la page ajoutée dans tests/ecrans-durees.json (20 → 70 s).
Limite : GitHub non encore lu au moment de l'écriture.
Réévalue.
