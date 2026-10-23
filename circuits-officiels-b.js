// Les tracés de 6 des 12 circuits officiels (étape 10) : seulement les données, sans décor, rien de branché dans la page.
// Décision du propriétaire (2026-10-23) : les tracés RESSEMBLENT BEAUCOUP aux vrais circuits (on doit les reconnaître au premier coup
// d'œil : proportions, virages célèbres à leur place, longueur à moins de 10 % de la vraie) ; les noms restent changés, aucun logo.
// Même format que CIRCUITS (donnees.js) : ['droite', L], ['virage', rayon, angle], ['chicane', rayon, angle] (angle en degrés,
// > 0 = à droite) ; depart = [0, 0, 0] ; les deux droites « (referme le tour) » sont calculées pour que la boucle se ferme
// (tests/circuits-outil.py --fermer) ; reperes et vraieLongueur servent aux tests et à la vue de dessus (tests/circuits-b.svg), pas au jeu.
// Vérifié par tests/circuits-b.html.
const CIRCUITS_OFFICIELS_B = {
  // montréal (4,361 km) : une île longue et étroite, des chicanes, l’épingle au bout, la grande droite du retour et le « mur des champions » à la sortie de la dernière chicane
  montreol: {
    nom: 'Montréol',
    largeur: 13,
    secteurs: [0, 0.3, 0.62],
    depart: [0, 0, 0],
    vraieLongueur: 4361,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'virage 1'], [3, 'virage 2'], [5, 'virage 5'], [7, 'chicane'], [9, 'virage 6'], [11, 'virage 7'], [13, 'virage 9'], [15, 'chicane'], [17, 'épingle'], [19, 'chicane finale'], [21, 'mur des champions']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 194.1],
      ['virage', 35, -58],                  // virage 1
      ['droite', 50.6],
      ['virage', 30, 43.8],                 // virage 2
      ['droite', 719.2],
      ['virage', 300, 4.7],                 // virage 5
      ['droite', 111.2],
      ['chicane', 30, 35],                  // chicane
      ['droite', 111.2],
      ['virage', 25, 65.8],                 // virage 6
      ['droite', 57.6],
      ['virage', 30, -46],                  // virage 7
      ['droite', 338.301],                  // (referme le tour)
      ['virage', 200, -4.6],                // virage 9
      ['droite', 37.5],
      ['chicane', 28, -35],                 // chicane
      ['droite', 56.2],
      ['virage', 18, 166.2],                // épingle
      ['droite', 2028.362],                 // (referme le tour)
      ['virage', 26, 71.5],                 // chicane finale
      ['droite', 35],
      ['virage', 26, 88],                   // mur des champions
      ['droite', 171.8],
      ['virage', 60, 28.6],
    ],
  },
  // melbourne (5,278 km) : le tour du lac, rapide et fluide
  melbourn: {
    nom: 'Melbourn Park',
    largeur: 14,
    secteurs: [0, 0.33, 0.68],
    depart: [0, 0, 0],
    vraieLongueur: 5278,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'virage 1'], [3, 'virage 2'], [5, 'virage 3'], [7, 'virage 4'], [11, 'virage 6'], [13, 'virage 8'], [15, 'virage 9-10'], [17, 'virage 11-12'], [19, 'virage 13'], [21, 'virage 14'], [23, 'virage 16']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 457.084],                  // (referme le tour)
      ['virage', 30, -95.2],                // virage 1
      ['droite', 94.3],
      ['virage', 50, 33.5],                 // virage 2
      ['droite', 455.7],
      ['virage', 200, -9.9],                // virage 3
      ['droite', 320.5],
      ['virage', 45, -36.9],                // virage 4
      ['droite', 143.9],
      ['virage', 120, -18.4],
      ['droite', 507.6],
      ['virage', 100, -45],                 // virage 6
      ['droite', 295.9],
      ['virage', 300, -14.5],               // virage 8
      ['droite', 414.3],
      ['virage', 60, -31.5],                // virage 9-10
      ['droite', 425.2],
      ['virage', 250, -46.9],               // virage 11-12
      ['droite', 368.4],
      ['virage', 40, -44.5],                // virage 13
      ['droite', 554.056],                  // (referme le tour)
      ['virage', 350, -15.2],               // virage 14
      ['droite', 315.8],
      ['virage', 70, -35.5],                // virage 16
      ['droite', 168.8],
    ],
  },
  // barcelone (4,657 km) : le long premier virage à droite, la longue courbe rapide du virage 3, la chicane finale
  barcelana: {
    nom: 'Barcelana',
    largeur: 14,
    secteurs: [0, 0.35, 0.7],
    depart: [0, 0, 0],
    vraieLongueur: 4657,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'virage 1'], [3, 'virage 2'], [5, 'virage 3'], [7, 'virage 4'], [9, 'virage 5'], [11, 'virage 7'], [13, 'virage 8'], [15, 'virage 9'], [17, 'virage 10'], [19, 'virage 12'], [21, 'virage 13'], [23, 'chicane'], [25, 'virage 16']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 859.818],                  // (referme le tour)
      ['virage', 35, -58],                  // virage 1
      ['droite', 87.2],
      ['virage', 40, -23.1],                // virage 2
      ['droite', 284.2],
      ['virage', 300, -47.5],               // virage 3
      ['droite', 288.9],
      ['virage', 60, -65.4],                // virage 4
      ['droite', 219.9],
      ['virage', 60, 73.1],                 // virage 5
      ['droite', 346.3],
      ['virage', 40, -112.4],               // virage 7
      ['droite', 71.9],
      ['virage', 45, 82.9],                 // virage 8
      ['droite', 183],
      ['virage', 70, -64.4],                // virage 9
      ['droite', 439.542],                  // (referme le tour)
      ['virage', 45, -63.4],                // virage 10
      ['droite', 333],
      ['virage', 60, -7.1],                 // virage 12
      ['droite', 270.4],
      ['virage', 50, -22.6],                // virage 13
      ['droite', 98.4],
      ['chicane', 25, 30],                  // chicane
      ['droite', 98.4],
      ['virage', 140, -52.1],               // virage 16
      ['droite', 165.4],
    ],
  },
  // bahreïn (5,412 km) : de longues droites et des freinages forts, le virage 1 en épingle
  bahrayn: {
    nom: 'Bahrayn',
    largeur: 15,
    secteurs: [0, 0.3, 0.64],
    depart: [0, 0, 0],
    vraieLongueur: 5412,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'virage 1'], [3, 'virage 2'], [5, 'virage 4'], [7, 'virage 5-6'], [9, 'virage 8'], [11, 'virage 9'], [13, 'virage 10'], [15, 'virage 11'], [17, 'virage 12'], [19, 'virage 13'], [21, 'virage 14']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 639.001],                  // (referme le tour)
      ['virage', 18, -58],                  // virage 1
      ['droite', 93.8],
      ['virage', 50, 15.6],                 // virage 2
      ['droite', 415.7],
      ['virage', 40, -92.6],                // virage 4
      ['droite', 549.1],
      ['virage', 60, 26.6],                 // virage 5-6
      ['droite', 563.8],
      ['virage', 20, -45],                  // virage 8
      ['droite', 461.3],
      ['virage', 40, -90],                  // virage 9
      ['droite', 320.6],
      ['virage', 45, 40.2],                 // virage 10
      ['droite', 516.4],
      ['virage', 35, -108.4],               // virage 11
      ['droite', 310.5],
      ['virage', 60, -4.8],                 // virage 12
      ['droite', 250.9],
      ['virage', 40, 38.5],                 // virage 13
      ['droite', 568.380],                  // (referme le tour)
      ['virage', 25, -82.1],                // virage 14
      ['droite', 182.8],
    ],
  },
  // singapour (4,940 km, de nuit, sens inverse) : beaucoup de virages à 90° dans les rues
  singapura: {
    nom: 'Singapura',
    largeur: 12,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    vraieLongueur: 4940,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'virage 1'], [3, 'virage 2'], [5, 'virage 3'], [7, 'virage 5'], [9, 'virage 7'], [11, 'virage 8'], [13, 'virage 10'], [15, 'virage 13'], [17, 'virage 14'], [19, 'virage 16'], [21, 'virage 18'], [23, 'virage 22']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 426.7],
      ['virage', 25, -80.5],                // virage 1
      ['droite', 184.1],
      ['virage', 25, -96.4],                // virage 2
      ['droite', 433.7],
      ['virage', 30, 80.6],                 // virage 3
      ['droite', 535.521],                  // (referme le tour)
      ['virage', 22, -77.9],                // virage 5
      ['droite', 603.863],                  // (referme le tour)
      ['virage', 25, -81.7],                // virage 7
      ['droite', 224.4],
      ['virage', 25, 72.1],                 // virage 8
      ['droite', 342.7],
      ['virage', 30, -77.6],                // virage 10
      ['droite', 378.5],
      ['virage', 25, -90.5],                // virage 13
      ['droite', 410.5],
      ['virage', 25, 67.8],                 // virage 14
      ['droite', 230.2],
      ['virage', 25, -68.8],                // virage 16
      ['droite', 475.8],
      ['virage', 28, -78.7],                // virage 18
      ['droite', 157.6],
      ['virage', 30, 71.6],                 // virage 22
      ['droite', 106.3],
    ],
  },
  // abou dabi (5,281 km, sens inverse) : l’épingle, les deux longues droites, le secteur final sinueux autour de l’hôtel
  yasmarino: {
    nom: 'Yas Marino',
    largeur: 15,
    secteurs: [0, 0.36, 0.7],
    depart: [0, 0, 0],
    vraieLongueur: 5281,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'virage 1'], [3, 'virages 2-4'], [7, 'épingle'], [9, 'virage 9'], [11, 'virage 11'], [13, 'hôtel'], [19, 'dernier virage']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 772.5],
      ['virage', 40, -84.3],                // virage 1
      ['droite', 313],
      ['virage', 250, -47.7],               // virages 2-4
      ['droite', 212.5],
      ['virage', 120, -9.4],
      ['droite', 1308.046],                 // (referme le tour)
      ['virage', 18, -135.8],               // épingle
      ['droite', 1111.912],                 // (referme le tour)
      ['virage', 25, 78.7],                 // virage 9
      ['droite', 95.3],
      ['virage', 60, -8.1],                 // virage 11
      ['droite', 185.2],
      ['virage', 40, -22.8],                // hôtel
      ['droite', 145.1],
      ['virage', 30, -85.6],
      ['droite', 191.9],
      ['virage', 25, -52.1],
      ['droite', 314.4],
      ['virage', 35, 7.1],                  // dernier virage
      ['droite', 201.3],
    ],
  },
};
