// Les tracés de 6 des 12 circuits officiels (étape 10), seulement les données, sans décor.
// Même format que CIRCUITS dans donnees.js : ['droite', L], ['virage', rayon, angle], ['chicane', rayon, angle]
// (angle > 0 = à droite), depart = [x, z, cap], secteurs = parts du tour où commencent les secteurs 1, 2 et 3.
// NOMS ET TRACÉS PROPOSÉS, à approuver par le propriétaire. Chaque tracé est seulement INSPIRÉ du vrai circuit (son caractère),
// jamais copié virage par virage. Les deux longueurs suivies de « referme le tour » sont calculées pour que la boucle se ferme.
// Vérifié par tests/circuits-b.html ; vus de dessus dans tests/circuits-b.svg.
const CIRCUITS_OFFICIELS_B = {
  // Montréal : une île longue et étroite, des droites coupées de chicanes, une épingle au bout,
  // et la grande droite du retour qui finit dans la dernière chicane (le « mur » en sortie)
  montreol: {
    nom: 'Montréol',
    largeur: 13,
    secteurs: [0, 0.3, 0.62],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 209.949],                  // la ligne des stands (referme le tour)
      ['virage', 35, 85], ['virage', 30, -75],   // le premier gauche-droite, serré
      ['droite', 450],
      ['chicane', 30, 35],
      ['droite', 500],
      ['virage', 150, -10],
      ['droite', 350],
      ['chicane', 28, -35],
      ['droite', 200],
      ['virage', 18, 140], ['virage', 90, 40],   // l'épingle au bout de l'île
      ['droite', 1650],                     // la grande droite du retour, le point de dépassement…
      ['chicane', 26, 40],                  // … et le gros freinage dans la dernière chicane : le « mur » est en sortie
      ['droite', 150],
      ['virage', 60, 90],
      ['droite', 170.921],                  // (referme le tour)
      ['virage', 60, 90],                   // retour sur la ligne
    ],
  },
  // Melbourne : autour d'un lac, rapide et fluide, de grandes courbes qui s'enchaînent
  melbourn: {
    nom: 'Melbourn Park',
    largeur: 14,
    secteurs: [0, 0.33, 0.68],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 766.235],                  // la ligne des stands (referme le tour)
      ['virage', 500, -12], ['droite', 250], ['virage', 500, 12],   // le léger coude, à fond
      ['droite', 300],
      ['virage', 30, 85], ['virage', 50, -35],   // freinage et droite-gauche du premier virage
      ['droite', 300],
      ['virage', 200, 40],
      ['droite', 350],
      ['virage', 45, 95], ['virage', 120, -35],
      ['droite', 450],
      ['virage', 300, 45], ['virage', 220, -30], ['virage', 250, 50],   // les courbes rapides au bord du lac
      ['virage', 400, -20], ['droite', 250], ['virage', 400, 20],   // un léger coude, à fond
      ['droite', 762.074],                  // la droite du lac, le point de dépassement (referme le tour)…
      ['virage', 40, 85],                   // … et le freinage du virage lent
      ['virage', 350, 25],
      ['droite', 300],
      ['virage', 70, 35],                   // retour sur la ligne
    ],
  },
  // Barcelone : technique ; une longue ligne des stands, puis la longue courbe rapide à droite,
  // et une dernière partie lente et sinueuse qui finit par une chicane
  barcelana: {
    nom: 'Barcelana',
    largeur: 14,
    secteurs: [0, 0.35, 0.7],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 991.68],                   // la ligne des stands, le point de dépassement (referme le tour)
      ['virage', 35, 75], ['virage', 40, -45],   // le gros freinage du premier droite-gauche
      ['droite', 150],
      ['virage', 300, 150],                 // la longue courbe rapide à droite
      ['droite', 450],
      ['virage', 60, -45], ['virage', 60, 45],
      ['droite', 450],
      ['virage', 35, -60], ['virage', 45, 90],
      ['droite', 200],
      ['virage', 60, 70],
      ['droite', 202.761],                  // (referme le tour)
      ['virage', 45, -60], ['virage', 50, 80],
      ['droite', 200],
      ['chicane', 25, 30],                  // la chicane lente avant la dernière courbe
      ['virage', 140, 60],                  // retour sur la ligne
    ],
  },
  // Bahreïn : dans le désert ; de longues droites et de gros freinages dans des virages lents
  bahrayn: {
    nom: 'Bahrayn',
    largeur: 15,
    secteurs: [0, 0.3, 0.64],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 1024.774],                 // la ligne des stands (referme le tour)…
      ['virage', 18, 95], ['virage', 50, -30],   // … et le gros freinage du premier virage
      ['droite', 350],
      ['virage', 40, 55],
      ['droite', 1415.547],                 // la grande droite du désert (referme le tour)…
      ['virage', 20, 110],                  // … et encore un gros freinage
      ['droite', 450],
      ['virage', 70, -60], ['virage', 60, 100],
      ['droite', 500],
      ['virage', 35, -70], ['virage', 45, 70],
      ['droite', 600],
      ['virage', 25, 90],                   // retour sur la ligne
    ],
  },
  // Singapour : de nuit, dans les rues ; lent, presque que des angles droits, une seule vraie droite
  singapura: {
    nom: 'Singapura',
    largeur: 12,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 242],                      // la ligne des stands (referme le tour)
      ['virage', 25, 90], ['droite', 400], ['virage', 25, -90], ['droite', 450], ['virage', 30, 90],
      ['droite', 900],                      // la seule grande droite, le point de dépassement…
      ['virage', 22, 90],                   // … et le gros freinage au bout
      ['droite', 450], ['virage', 25, 90], ['droite', 200], ['virage', 25, -90], ['droite', 250], ['virage', 30, 90],
      ['droite', 342],                      // (referme le tour)
      ['virage', 25, -90], ['droite', 200], ['virage', 25, 90], ['droite', 150], ['virage', 25, 90],
      ['droite', 200], ['virage', 25, -90], ['droite', 250],
      ['chicane', 25, 30],
      ['droite', 200],
      ['virage', 30, 90],                   // retour sur la ligne
    ],
  },
  // Abou Dabi : le « giant loop » du propriétaire, le plus long du calendrier ; une grande boucle de courbes rapides,
  // une très longue droite qui finit dans une épingle, et une partie lente sous l'hôtel avant la ligne
  yasmarino: {
    nom: 'Yas Marino',
    largeur: 15,
    secteurs: [0, 0.36, 0.7],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 1490.77],                  // la ligne des stands (referme le tour)
      ['virage', 40, 90],                   // le freinage du premier virage
      ['virage', 400, -30], ['virage', 500, 70],   // la grande boucle commence…
      ['droite', 662.831],                  // (referme le tour)
      ['virage', 450, 50],
      ['droite', 800],
      ['chicane', 30, 35],
      ['virage', 200, 90],                  // … et se termine
      ['droite', 1500],                     // la très longue droite, le point de dépassement…
      ['virage', 18, 150],                  // … et l'épingle
      ['droite', 100],
      ['virage', 25, -60], ['droite', 150], ['virage', 25, 90], ['droite', 80], ['virage', 25, -90],   // la partie lente sous l'hôtel
    ],
  },
};
