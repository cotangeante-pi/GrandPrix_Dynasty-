// Tous les réglages du jeu. Aucun chiffre de réglage ne doit traîner ailleurs dans le code.
// Unité : 1 = 1 mètre ; les angles sont en radians.
const REGLAGES = {
  // la boucle
  PAS_PHYSIQUE: 1 / 120,        // la physique avance toujours de 1/120 s
  PAS_MAX_PAR_IMAGE: 12,        // au plus 0,1 s de physique par image : si l'onglet rame, on ralentit au lieu de s'emballer

  // la courbe des circuits
  PAS_ECHANTILLON: 2,           // un échantillon de piste tous les 2 m
  PAS_SPLINE_FIN: 0.25,         // pour mesurer la longueur de la spline, on la découpe en morceaux de 25 cm
  PAS_POINTS_MORCEAUX: 4,       // un circuit décrit par morceaux est d'abord converti en points tous les 4 m
  FENETRE_RECHERCHE: 8,         // positionSurPiste cherche à ±8 échantillons (±16 m) de l'indice connu ; une voiture fait < 1 m par pas
  // positionSurPiste repart d'une recherche complète si le point est à plus de ce nombre de largeurs de piste du centre
  ECART_RECHERCHE_COMPLETE: 1.5,

  // la voiture (une F1 ; le joueur et les IA ont exactement les mêmes chiffres)
  MASSE: 800,                   // kg, pilote compris
  GRAVITE: 9.81,
  EMPATTEMENT: 3.6,             // m, entre les deux essieux
  CG_AVANT: 1.6,                // m, du centre de gravité à l'essieu avant (l'arrière est à EMPATTEMENT - CG_AVANT)
  INERTIE_LACET: 1300,          // kg·m²
  FORCE_MOTEUR_MAX: 8800,       // N : ce qui donne le 0–100 en 2,6 s
  PUISSANCE: 700000,            // W : ce qui donne les 330 km/h avec la traînée
  TRAINEE: 0.9,                 // N par (m/s)²
  APPUI: 1.4,                   // N d'appui par (m/s)² : 2,5 fois le poids à 330 km/h
  ROULEMENT: 150,               // N
  ADHERENCE: 1.7,               // coefficient des pneus en virage
  ADHERENCE_FREIN: 1.8,         // coefficient au freinage
  RIGIDITE_PNEU: 18,            // N de force latérale par N de charge et par radian de glissement
  BRAQUAGE_MAX: 0.35,           // rad, à l'arrêt
  BRAQUAGE_VITESSE: 25,         // m/s : le braquage max est divisé par (1 + v / BRAQUAGE_VITESSE)
  VITESSE_CINEMATIQUE: 3,       // m/s : en dessous, la voiture tourne sans glisser (évite les à-coups à l'arrêt)
  MARCHE_ARRIERE_MAX: 2.5,      // m/s (sous VITESSE_CINEMATIQUE : en marche arrière, la voiture ne glisse pas)
  FORCE_MARCHE_ARRIERE: 3000,   // N
  ADHERENCE_HERBE: 0.5,         // l'adhérence est multipliée par ce nombre sur l'herbe
  FROTTEMENT_HERBE: 160,        // N par m/s, en plus, sur l'herbe
  MARGE_HERBE: 1,               // m au-delà du bord de la piste avant d'être dans l'herbe (les vibreurs)
  DEMI_LARGEUR_VOITURE: 1,      // m : la voiture touche la barrière à cette distance
  REBOND_BARRIERE: 0.3,         // part de la vitesse vers la barrière qui repart dans l'autre sens
  FROTTEMENT_BARRIERE: 0.3,     // part de la vitesse le long de la barrière perdue au choc
  RAYON_ROUE: 0.33,
  // les commandes au clavier montent et descendent progressivement (par seconde)
  RAMPE_GAZ: 4, RAMPE_FREIN: 8, RAMPE_DIRECTION: 3, RETOUR_DIRECTION: 5,

  // le robot d'essai (préparation des IA)
  ROBOT_VISEE_MIN: 12,          // m : il vise un point au moins à cette distance devant lui
  ROBOT_VISEE_TEMPS: 0.55,      // s : … ou à la distance parcourue en ce temps
  ROBOT_MARGE_VIRAGE: 0.85,     // il prend les virages à cette part de la vitesse limite
  ROBOT_DECELERATION: 22,       // m/s² : le freinage qu'il prévoit (prudent)
  ROBOT_REGARD: 400,            // m : il regarde la courbure jusque-là

  // le dessin du circuit
  LARGEUR_BORD: 0.35,           // la ligne blanche de chaque bord
  LARGEUR_VIBREUR: 1.4,
  LONGUEUR_BANDE_VIBREUR: 3,    // une bande rouge, une bande blanche
  SEUIL_COURBURE_VIBREUR: 1 / 150,   // des vibreurs là où le rayon du virage est sous 150 m
  DISTANCE_BARRIERE: 14,        // du bord de la piste à la barrière
  HAUTEUR_BARRIERE: 1.1,
  TAILLE_SOL: 4000,             // le carré d'herbe sous le circuit
  CASES_DAMIER: 12,             // cases de la ligne d'arrivée, en travers de la piste
  PROFONDEUR_DAMIER: 2,
  LARGEUR_REPERE_SECTEUR: 0.6,

  COULEUR_CIEL: 0x87c5ea,
  COULEUR_SOL: 0x4f7d3a,
  COULEUR_ROUTE: 0x3b3d42,
  COULEUR_BORD: 0xf2f2f2,
  COULEUR_VIBREUR_A: 0xd8262e,
  COULEUR_VIBREUR_B: 0xf2f2f2,
  COULEUR_BARRIERE: 0x9aa3ad,
  COULEUR_JOUEUR: 0x1f6fe0,     // provisoire : la couleur viendra de l'écurie (étape 6)
  COULEURS_SECTEURS: [0xe03a3a, 0x2f7de1, 0xf2c230],   // secteurs 1, 2, 3
  BROUILLARD: [1500, 5000],     // début et fin du brouillard (m)

  // les caméras
  CAMERA_LOIN: 8000,
  CAMERA_AUTO_HAUTEUR: 650,     // la caméra qui fait le tour du circuit
  CAMERA_AUTO_RECUL: 1.1,       // son rayon = la demi-taille du circuit × ce nombre
  CAMERA_AUTO_VITESSE: 0.06,    // radians par seconde
  CAMERA_LIBRE_VITESSE: 1.2,    // déplacement, en hauteurs par seconde (plus on est haut, plus on va vite)
  CAMERA_LIBRE_VITESSE_MIN: 20, // m/s
  CAMERA_LIBRE_SOURIS: 0.005,   // radians par pixel de souris
  CAMERA_LIBRE_MOLETTE: 0.0015, // part de la hauteur par cran de molette
  CAMERA_LIBRE_HAUTEUR: [3, 2000],
  CAMERA_VIRAGE_HAUTEUR: 3,     // ?camera=virage : vue basse, au bord du virage le plus serré
  // les caméras de course (C passe de l'une à l'autre)
  CAMERA_DERRIERE: [7.5, 2.4],  // recul et hauteur derrière la voiture (m)
  CAMERA_RESSORT: 9,            // raideur du ressort amorti qui suit la voiture (1/s)
  CAMERA_CHAMP: [60, 15],       // champ de vision derrière : de base, plus ce nombre à pleine vitesse (degrés)
  CAMERA_COCKPIT: [0.2, 0.88],  // l'œil du pilote, à la place du casque (caché en vue cockpit) : avant, hauteur (m)
  CAMERA_COCKPIT_CHAMP: 72,
  TELE_ESPACEMENT: 250,         // une caméra télé tous les 250 m le long de la piste
  TELE_RECUL: 8,                // à cette distance derrière la barrière (m)
  TELE_HAUTEUR: 7,
  TELE_CADRAGE: 9,              // la voiture et ce qui l'entoure, en mètres, remplissent l'image

  // le mode ?debug=1
  DEBUG_PERIODE_IPS: 0.5,       // secondes entre deux mises à jour du compteur d'images
};

// Les circuits, décrits par morceaux dans l'ordre de la course, la ligne d'arrivée au début du premier :
//   ['droite', longueur]  ['virage', rayon, angle en degrés (> 0 = à droite)]
//   ['chicane', rayon, angle] : trois virages de même rayon (angle, -2 × angle, angle) ; on ressort sur la même ligne
// depart : la position et le cap (radians, 0 = vers +x) du début du premier morceau.
// secteurs : là où chaque secteur commence, en part de la longueur du tour.
// (Un circuit peut aussi être donné par des points : points: [[x, z], ...], passés tels quels à la spline.)
const CIRCUITS = {
  test: {
    nom: 'Test',
    largeur: 13,
    secteurs: [0, 0.34, 0.67],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 200], ['droite', 250],     // la ligne des stands, vers +x
      ['chicane', 40, -35],
      ['droite', 150],
      ['virage', 160, 180],                 // le grand virage
      ['droite', 650],                      // la ligne opposée, vers -x
      ['chicane', 40, -35],
      ['droite', 410],
      ['virage', 40, 90],                   // deux virages serrés et la petite droite entre eux
      ['droite', 240],
      ['virage', 40, 90],
      ['droite', 460],                      // retour sur la ligne
    ],
  },
};
