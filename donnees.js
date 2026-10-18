// Tous les réglages du jeu. Aucun chiffre de réglage ne doit traîner ailleurs dans le code.
// Unité : 1 = 1 mètre ; les angles sont en radians.
const REGLAGES = {
  // la boucle
  PAS_PHYSIQUE: 1 / 120,        // la physique avance toujours de 1/120 s
  PAS_MAX_PAR_IMAGE: 12,        // au plus 0,1 s de physique par image : si l'onglet rame, on ralentit au lieu de s'emballer

  // la courbe des circuits
  PAS_ECHANTILLON: 2,           // un échantillon de piste tous les 2 m
  PAS_SPLINE_FIN: 0.25,         // pour mesurer la longueur de la spline, on la découpe en morceaux de 25 cm
  FENETRE_RECHERCHE: 8,         // positionSurPiste cherche à ±8 échantillons (±16 m) de l'indice connu ; une voiture fait < 1 m par pas
  // positionSurPiste repart d'une recherche complète si le point est à plus de ce nombre de largeurs de piste du centre
  ECART_RECHERCHE_COMPLETE: 1.5,

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

  // le mode ?debug=1
  DEBUG_PERIODE_IPS: 0.5,       // secondes entre deux mises à jour du compteur d'images
};

// Les circuits : des points au milieu de la piste (x, z), dans l'ordre de la course, la ligne d'arrivée au premier.
// secteurs : là où chaque secteur commence, en part de la longueur du tour.
const CIRCUITS = {
  test: {
    nom: 'Test',
    largeur: 13,
    secteurs: [0, 0.34, 0.67],
    points: [
      // la ligne droite des stands, vers +x, avec une chicane
      [0, 0], [150, 0], [300, 0], [340, 0], [370, -12], [400, -12], [430, 0], [500, 0], [560, 0],
      // le grand virage de 160 m de rayon
      [618, 4.9], [693, 47], [740, 160], [693, 273], [618, 315.1],
      // la ligne droite opposée, vers -x, avec une chicane
      [560, 320], [400, 320], [200, 320], [60, 320], [30, 333], [-10, 333], [-40, 320], [-200, 320], [-380, 320], [-430, 320],
      // deux virages serrés de 40 m de rayon, et la petite droite entre eux
      [-460, 320], [-488.3, 308.3], [-500, 280], [-500, 230], [-500, 160], [-500, 90], [-500, 40], [-488.3, 11.7], [-460, 0],
      [-430, 0], [-300, 0], [-150, 0],
    ],
  },
};
