// Les tracés de 6 des 12 circuits officiels (étape 10) : seulement les données, sans décor.
// NOMS ET TRACÉS PROPOSÉS, à approuver par le propriétaire. Chaque tracé est seulement INSPIRÉ du vrai circuit
// (son caractère : lent, rapide, longues droites…), jamais copié virage par virage.
// Même format que CIRCUITS (donnees.js) : ['droite', L], ['virage', rayon, angle], ['chicane', rayon, angle]
// (angle en degrés, > 0 = à droite). Les deux longueurs à 3 décimales de chaque circuit referment le tour.
// Vérifié par tests/circuits-a.html ; vue de dessus : tests/circuits-a.svg
const CIRCUITS_OFFICIELS_A = {
  // lent et serré, dans les rues : beaucoup de virages lents, une épingle très lente, le tunnel, presque pas de dépassement
  monoco: {
    nom: 'Monoco',
    largeur: 11,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 413.9],                    // la ligne des stands
      ['virage', 18, 70],                   // le premier virage, serré
      ['droite', 250], ['virage', 300, -28], ['droite', 250],   // la montée
      ['virage', 160, -38], ['virage', 35, 76],   // la place du casino
      ['droite', 120],
      ['virage', 25, -64],
      ['droite', 120],
      ['virage', 10, 140],                  // l'épingle, très lente
      ['droite', 80],
      ['virage', 18, -70],
      ['droite', 120],
      ['virage', 20, 95],                   // vers le bord de mer
      ['droite', 68],
      ['virage', 380, 49],                  // le tunnel, une longue courbe à fond
      ['droite', 304.442],                  // la sortie du tunnel…
      ['chicane', 14, 35],                  // … et le gros freinage dans la chicane du port
      ['droite', 200],
      ['virage', 40, -12],
      ['droite', 120],
      ['chicane', 22, -30],                 // les deux chicanes de la piscine
      ['droite', 100],
      ['chicane', 18, 30],
      ['droite', 120],
      ['virage', 14, 85],                   // un virage très lent
      ['droite', 70],
      ['virage', 16, -28],
      ['droite', 70],
      ['virage', 20, 85],                   // retour sur la ligne
    ],
  },
  // très rapide : de grandes courbes, un enchaînement rapide gauche-droite, un seul virage vraiment lent par moitié de tour
  silverstoun: {
    nom: 'Silverstoun',
    largeur: 15,
    secteurs: [0, 0.34, 0.67],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 663.6],                    // la ligne des stands
      ['virage', 220, 59], ['virage', 160, -30],   // deux courbes rapides
      ['droite', 356],
      ['virage', 30, 95], ['virage', 45, -45],    // le seul coin lent de ce côté
      ['droite', 884],                      // la longue droite…
      ['virage', 32, 96],                   // … et le gros freinage (le point de dépassement)
      ['droite', 332],
      ['virage', 500, -20],                 // un pli à fond
      ['droite', 300],
      ['virage', 280, 55],                  // la grande courbe rapide
      ['droite', 151],
      ['virage', 170, -40], ['virage', 150, 53], ['virage', 160, -29], ['virage', 130, 45],   // l'enchaînement rapide
      ['droite', 655.569],                  // la droite du hangar
      ['virage', 150, 80],                  // une courbe rapide au bout
      ['droite', 229],
      ['virage', 600, -14],
      ['droite', 221],
      ['chicane', 40, 25],
      ['virage', 70, 55],                   // retour sur la ligne
    ],
  },
  // de très longues droites, des chicanes où l'on freine très fort, et la grande courbe du retour
  monzo: {
    nom: 'Monzo',
    largeur: 14,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 1165],                     // la ligne des stands, très longue…
      ['chicane', 16, 50],                  // … et la première chicane (le gros freinage)
      ['droite', 217],
      ['virage', 300, 81],                  // la grande courbe, à fond
      ['droite', 662.918],
      ['chicane', 22, -40],                 // la deuxième chicane
      ['droite', 221],
      ['virage', 60, 57],                   // deux droites moyennes
      ['droite', 125],
      ['virage', 55, 57],
      ['droite', 1204.255],                 // la longue droite du retour
      ['virage', 90, -18], ['virage', 70, 59],    // un pli rapide
      ['droite', 983],
      ['virage', 110, 124],                 // la grande courbe qui ramène sur la ligne
    ],
  },
  // long et raide : l'épingle du départ, la descente puis la grande courbe rapide en montée, la très longue droite
  spaa: {
    nom: 'Spaa',
    largeur: 14,
    secteurs: [0, 0.32, 0.68],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 569.514],                  // la ligne des stands
      ['virage', 18, 140],                  // l'épingle du départ
      ['droite', 353],                      // la descente…
      ['virage', 120, -54], ['virage', 160, 56],  // … et la grande courbe rapide, en montée
      ['droite', 1036],                     // la très longue droite…
      ['virage', 30, 76], ['virage', 35, -54],    // … et le gros freinage (le point de dépassement)
      ['droite', 240],
      ['virage', 40, -70],                  // on redescend
      ['droite', 253],
      ['virage', 130, 100],                 // la longue courbe
      ['droite', 200],
      ['virage', 60, 56], ['virage', 70, -38],
      ['droite', 330],
      ['virage', 50, 66],
      ['droite', 510.279],
      ['virage', 500, 60],                  // une courbe très rapide
      ['droite', 786],
      ['virage', 400, 18],
      ['droite', 400],
      ['chicane', 20, 40],                  // la chicane avant la ligne
      ['virage', 50, 4],
    ],
  },
  // technique : un enchaînement de S en montée, une épingle, des courbes rapides ; sans le croisement en huit du vrai
  suzuko: {
    nom: 'Suzuko',
    largeur: 13,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 875.185],                  // la ligne des stands
      ['virage', 120, 63], ['virage', 45, 45],    // les deux premiers virages
      ['virage', 90, -50], ['virage', 90, 44], ['virage', 90, -56], ['virage', 110, 35],   // les S
      ['droite', 224],
      ['virage', 60, -48],
      ['droite', 591],
      ['virage', 40, 44],                   // deux virages à droite
      ['droite', 116],
      ['virage', 30, 53],
      ['droite', 550],                      // la droite…
      ['virage', 15, 142],                  // … et l'épingle (le point de dépassement)
      ['droite', 208],
      ['virage', 50, -78],
      ['droite', 398],
      ['virage', 250, -46],                 // une longue courbe à gauche
      ['droite', 289],
      ['virage', 45, 60], ['virage', 70, 36],     // la double droite
      ['droite', 1073.437],                 // la droite du retour
      ['virage', 130, 47],                  // la courbe rapide
      ['droite', 218],
      ['chicane', 18, 40],                  // la chicane avant la ligne
      ['virage', 40, 69],
    ],
  },
  // court, dans l'autre sens (à gauche) : le S en descente après la ligne, la longue droite opposée
  interlagas: {
    nom: 'Interlagas',
    largeur: 14,
    secteurs: [0, 0.35, 0.68],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 804.659],                  // la ligne des stands
      ['virage', 28, -94], ['virage', 35, 70],    // le S en descente (gros freinage)
      ['virage', 250, -68],                 // la courbe rapide…
      ['droite', 700],                      // … vers la droite opposée
      ['virage', 30, -88],                  // le freinage en bas (le point de dépassement)
      ['droite', 259],
      ['virage', 80, -40],
      ['droite', 275],
      ['virage', 30, -94], ['virage', 40, 86],    // la partie lente, au milieu
      ['droite', 405.246],
      ['virage', 25, 102],
      ['droite', 250],
      ['virage', 20, -105],
      ['droite', 248],
      ['virage', 60, -56],
      ['droite', 299],
      ['virage', 150, -73],                 // la longue courbe en montée, vers la ligne
    ],
  },
};
