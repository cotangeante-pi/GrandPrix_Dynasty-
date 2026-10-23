// Les tracés de 6 des 12 circuits officiels (étape 10) : seulement les données, sans décor, rien de branché dans la page.
// Décision du propriétaire (2026-10-23) : les tracés RESSEMBLENT BEAUCOUP aux vrais circuits (on doit les reconnaître au premier coup
// d'œil : proportions, virages célèbres à leur place, longueur à moins de 10 % de la vraie) ; les noms restent changés, aucun logo.
// Même format que CIRCUITS (donnees.js) : ['droite', L], ['virage', rayon, angle], ['chicane', rayon, angle] (angle en degrés,
// > 0 = à droite) ; depart = [0, 0, 0] ; les deux droites « (referme le tour) » sont calculées pour que la boucle se ferme
// (tests/circuits-outil.py --fermer) ; reperes et vraieLongueur servent aux tests et à la vue de dessus (tests/circuits-a.svg), pas au jeu.
// Vérifié par tests/circuits-a.html.
const CIRCUITS_OFFICIELS_A = {
  // monaco (3,337 km, dans le sens des aiguilles d’une montre) : Sainte-Dévote, la montée de Beau Rivage, Massenet et le Casino, Mirabeau, l’épingle très lente, Portier, le tunnel, la chicane du port, Tabac, la Piscine, la Rascasse, Anthony Noghès
  monoco: {
    nom: 'Monoco',
    largeur: 11,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    vraieLongueur: 3337,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'Sainte-Dévote'], [3, 'Beau Rivage'], [5, 'Massenet'], [7, 'Casino'], [9, 'Mirabeau'], [11, 'épingle'], [13, 'Portier'], [15, 'Portier 2'], [17, 'tunnel'], [19, 'chicane'], [21, 'Tabac'], [23, 'Piscine'], [25, 'chicane'], [27, 'Rascasse'], [29, 'Anthony Noghès']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 345.097],                  // (referme le tour)
      ['virage', 25, 95.2],                 // Sainte-Dévote
      ['droite', 312.241],                  // (referme le tour)
      ['virage', 350, 20.2],                // Beau Rivage
      ['droite', 139.1],
      ['virage', 110, 49.7],                // Massenet
      ['droite', 114.4],
      ['virage', 40, 51.8],                 // Casino
      ['droite', 151.5],
      ['virage', 20, 8.1],                  // Mirabeau
      ['droite', 113.7],
      ['virage', 10, 108.5],                // épingle
      ['droite', 51.2],
      ['virage', 30, -100.3],               // Portier
      ['droite', 69.8],
      ['virage', 25, -36.3],                // Portier 2
      ['droite', 285.9],
      ['virage', 260, 45.5],                // tunnel
      ['droite', 95.2],
      ['chicane', 15, 45],                  // chicane
      ['droite', 30],
      ['virage', 45, 82.1],                 // Tabac
      ['droite', 144.8],
      ['virage', 30, 26.1],                 // Piscine
      ['droite', 126.3],
      ['chicane', 28, -32],                 // chicane
      ['droite', 126.3],
      ['virage', 14, 83.9],                 // Rascasse
      ['droite', 196.2],
      ['virage', 22, -74.5],                // Anthony Noghès
      ['droite', 130.2],
    ],
  },
  // silverstone (5,891 km) : Abbey, Village et The Loop, la droite de Wellington, Brooklands et Luffield, Woodcote, Copse, le S rapide de Maggotts-Becketts-Chapel, la Hangar Straight, Stowe, Vale et Club
  silverstoun: {
    nom: 'Silverstoun',
    largeur: 15,
    secteurs: [0, 0.34, 0.67],
    depart: [0, 0, 0],
    vraieLongueur: 5891,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'Abbey'], [3, 'Farm'], [5, 'Village'], [7, 'The Loop'], [9, 'Aintree'], [11, 'Brooklands'], [13, 'Luffield'], [15, 'Woodcote'], [17, 'Copse'], [19, 'Maggotts'], [21, 'Becketts'], [23, 'Chapel'], [25, 'Stowe'], [27, 'Vale'], [29, 'Club']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 399.5],
      ['virage', 150, 40.5],                // Abbey
      ['droite', 69.8],
      ['virage', 300, 19.7],                // Farm
      ['droite', 49.7],
      ['virage', 25, -88.3],                // Village
      ['droite', 69.6],
      ['virage', 20, -53.3],                // The Loop
      ['droite', 85.9],
      ['virage', 150, -16.2],               // Aintree
      ['droite', 876.236],                  // (referme le tour)
      ['virage', 50, 41.2],                 // Brooklands
      ['droite', 85.7],
      ['virage', 41, 83.7],                 // Luffield
      ['droite', 30],
      ['virage', 163, 50.2],                // Woodcote
      ['droite', 851.7],
      ['virage', 110, 37.4],                // Copse
      ['droite', 85.7],
      ['virage', 95, -67.2],                // Maggotts
      ['droite', 30],
      ['virage', 59, 61.9],                 // Becketts
      ['droite', 35.4],
      ['virage', 111, 44.8],                // Chapel
      ['droite', 819.336],                  // (referme le tour)
      ['virage', 90, 46.5],                 // Stowe
      ['droite', 166.8],
      ['virage', 45, 50.2],                 // Vale
      ['droite', 633.2],
      ['virage', 80, 108.9],                // Club
      ['droite', 139.4],
    ],
  },
  // monza (5,793 km) : la longue droite des stands, la première chicane, Curva Grande, la deuxième chicane, les deux Lesmo, le Serraglio, Ascari, la Parabolica
  monzo: {
    nom: 'Monzo',
    largeur: 14,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    vraieLongueur: 5793,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'première chicane'], [3, 'Curva Grande'], [5, 'deuxième chicane'], [7, 'Lesmo 1'], [9, 'Lesmo 2'], [11, 'Serraglio'], [13, 'Ascari'], [15, 'Parabolica']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 1100],
      ['chicane', 16, 55],                  // première chicane
      ['droite', 120],
      ['virage', 330, 40],                  // Curva Grande
      ['droite', 700],
      ['chicane', 22, -45],                 // deuxième chicane
      ['droite', 110],
      ['virage', 70, 55],                   // Lesmo 1
      ['droite', 217.808],                  // (referme le tour)
      ['virage', 45, 85],                   // Lesmo 2
      ['droite', 500],
      ['virage', 500, 22],                  // Serraglio
      ['droite', 357.255],                  // (referme le tour)
      ['chicane', 60, 38],                  // Ascari
      ['droite', 1100],
      ['virage', 165, 158],                 // Parabolica
    ],
  },
  // spa (7,004 km) : La Source (épingle), Eau Rouge et le Raidillon, la droite de Kemmel, Les Combes, Rivage, Pouhon, Fagnes, Stavelot, Blanchimont, la chicane de l’arrêt de bus
  spaa: {
    nom: 'Spaa',
    largeur: 14,
    secteurs: [0, 0.32, 0.68],
    depart: [0, 0, 0],
    vraieLongueur: 7004,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'La Source'], [3, 'Eau Rouge'], [4, 'Raidillon'], [6, 'Kemmel'], [7, 'Les Combes'], [10, 'Malmedy'], [12, 'Rivage'], [15, 'Pouhon'], [17, 'Fagnes'], [20, 'Stavelot'], [22, 'Paul Frère'], [24, 'Blanchimont'], [26, 'arrêt de bus']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 250],
      ['virage', 18, 160],                  // La Source
      ['droite', 1236.059],                 // (referme le tour)
      ['virage', 80, -30],                  // Eau Rouge
      ['virage', 90, 60],                   // Raidillon
      ['virage', 120, -30],
      ['droite', 900],                      // Kemmel
      ['virage', 40, 70],                   // Les Combes
      ['virage', 45, -60],
      ['virage', 60, 50],
      ['virage', 60, 60],                   // Malmedy
      ['droite', 1041.464],                 // (referme le tour)
      ['virage', 30, 140],                  // Rivage
      ['droite', 200],
      ['virage', 150, -40],
      ['virage', 120, -110],                // Pouhon
      ['droite', 300],
      ['virage', 60, 60],                   // Fagnes
      ['virage', 60, -50],
      ['droite', 150],
      ['virage', 50, 110],                  // Stavelot
      ['droite', 200],
      ['virage', 200, 30],                  // Paul Frère
      ['droite', 500],
      ['virage', 300, -60],                 // Blanchimont
      ['droite', 400],
      ['chicane', 15, 50],                  // arrêt de bus
      ['droite', 150],
    ],
  },
  // suzuka (5,807 km) : un HUIT (le tracé se croise, un pont en 3D à l’étape 10), les S du premier secteur, Dunlop, Degner, l’épingle, 200R, Spoon, le pont, 130R, la chicane
  suzuko: {
    nom: 'Suzuko',
    largeur: 13,
    secteurs: [0, 0.33, 0.66],
    depart: [0, 0, 0],
    vraieLongueur: 5807,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'virage 1'], [3, 'virage 2'], [5, 'les S'], [13, 'Dunlop'], [15, 'Degner 1'], [17, 'Degner 2'], [19, 'épingle'], [21, '200R'], [23, 'Spoon'], [27, '130R'], [29, 'chicane'], [31, 'dernier virage']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    croisement: [1560, 4140],   // le huit : le tracé se croise une fois (m le long du tour, le pont passe au-dessus du second passage)
    morceaux: [
      ['droite', 333.2],
      ['virage', 150, 44.8],                // virage 1
      ['droite', 56.1],
      ['virage', 60, 74.3],                 // virage 2
      ['droite', 33.5],
      ['virage', 80, -62.3],                // les S
      ['droite', 30.1],
      ['virage', 70, 64.6],
      ['droite', 33.2],
      ['virage', 70, -62.6],
      ['droite', 39.2],
      ['virage', 80, 49.8],
      ['droite', 65.8],
      ['virage', 120, 29.9],                // Dunlop
      ['droite', 87.9],
      ['virage', 70, 20.2],                 // Degner 1
      ['droite', 70.7],
      ['virage', 30, -31.7],                // Degner 2
      ['droite', 489.7],
      ['virage', 20, -122.2],               // épingle
      ['droite', 467.5],
      ['virage', 200, 20.8],                // 200R
      ['droite', 517.9],
      ['virage', 53, -101.8],               // Spoon
      ['droite', 30],
      ['virage', 71, -79.4],
      ['droite', 1721.128],                 // (referme le tour)
      ['virage', 130, -2.5],                // 130R
      ['droite', 120.6],
      ['chicane', 20, 45],                  // chicane
      ['droite', 51.7],
      ['virage', 100, 130.3],               // dernier virage
      ['droite', 739.799],                  // (referme le tour)
      ['virage', 200, 27.8],
    ],
  },
  // interlagos (4,309 km, sens inverse) : le S do Senna, Curva do Sol, la Reta Oposta, Descida do Lago, Ferradura, Laranja, Pinheirinho, Bico de Pato, Mergulho, Junção et la montée vers la ligne
  interlagas: {
    nom: 'Interlagas',
    largeur: 14,
    secteurs: [0, 0.35, 0.68],
    depart: [0, 0, 0],
    vraieLongueur: 4309,   // m, celle du vrai circuit : le tracé en reste à moins de 10 %
    reperes: [[1, 'S do Senna'], [5, 'Curva do Sol'], [7, 'Descida do Lago'], [11, 'Ferradura'], [13, 'Laranja'], [15, 'Pinheirinho'], [17, 'Bico de Pato'], [19, 'Mergulho'], [21, 'Junção'], [23, 'Subida dos Boxes'], [25, 'ligne']],   // les virages célèbres (indice du morceau), pour la vue de dessus
    morceaux: [
      ['droite', 655.1],
      ['virage', 40, -116.6],               // S do Senna
      ['droite', 55.6],
      ['virage', 50, -12.5],
      ['droite', 148.9],
      ['virage', 180, -46.8],               // Curva do Sol
      ['droite', 984.537],                  // (referme le tour)
      ['virage', 49, -55.5],                // Descida do Lago
      ['droite', 30],
      ['virage', 98, -92.8],
      ['droite', 120.2],
      ['virage', 80, 34.5],                 // Ferradura
      ['droite', 97.2],
      ['virage', 45, 87.9],                 // Laranja
      ['droite', 124.8],
      ['virage', 30, -43.2],                // Pinheirinho
      ['droite', 152.7],
      ['virage', 25, 73.7],                 // Bico de Pato
      ['droite', 111.9],
      ['virage', 20, -79.7],                // Mergulho
      ['droite', 190.9],
      ['virage', 45, -142.7],               // Junção
      ['droite', 469.919],                  // (referme le tour)
      ['virage', 300, -2.6],                // Subida dos Boxes
      ['droite', 347.9],
      ['virage', 200, 36.3],                // ligne
    ],
  },
};
