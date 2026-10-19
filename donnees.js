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
  BRAQUAGE_VITESSE: 18,         // m/s : le braquage max est divisé par (1 + v / BRAQUAGE_VITESSE)
  VITESSE_CINEMATIQUE: 3,       // m/s : en dessous, la voiture tourne sans glisser (évite les à-coups à l'arrêt)
  MARCHE_ARRIERE_MAX: 2.5,      // m/s (sous VITESSE_CINEMATIQUE : en marche arrière, la voiture ne glisse pas)
  FORCE_MARCHE_ARRIERE: 3000,   // N
  ADHERENCE_ARRIERE: 1.25,      // l'arrière accroche plus que l'avant : c'est l'avant qui glisse d'abord, pas de tête-à-queue
  STABILITE_LACET: 4,           // 1/s : la rotation de la voiture rejoint ce que demande le volant (aide arcade)
  ANTI_DERIVE: 2.5,             // 1/s : la glissade de côté s'amortit (aide arcade)
  // l'herbe ne fait que ralentir, et fort : la direction et l'adhérence restent presque celles de la piste
  ADHERENCE_HERBE: 0.9,         // l'adhérence est multipliée par ce nombre sur l'herbe (au moins 0,85)
  FROTTEMENT_HERBE: 0,          // N par m/s, en plus, sur l'herbe
  FROTTEMENT_HERBE_CARRE: 11,   // N par (m/s)², en plus : on freine fort à haute vitesse, et on plafonne vers 80 km/h
  GAZ_HERBE: 0.7,               // sur l'herbe, le moteur pousse à cette part de sa force
  MARGE_HERBE: 1,               // m au-delà du bord de la piste avant d'être dans l'herbe (les vibreurs)
  DEMI_LARGEUR_VOITURE: 1,      // m : la voiture touche la barrière à cette distance
  REBOND_BARRIERE: 0.3,         // part de la vitesse vers la barrière qui repart dans l'autre sens
  FROTTEMENT_BARRIERE: 0.3,     // part de la vitesse le long de la barrière perdue au choc
  RAYON_ROUE: 0.33,
  // les commandes au clavier montent et descendent progressivement (par seconde)
  RAMPE_GAZ: 4, RAMPE_FREIN: 8,
  // la direction au clavier monte en deux temps : vite jusqu'au palier (un appui court = une petite correction),
  // puis lentement jusqu'au bout si on garde la touche ; elle revient vite au centre quand on lâche
  DIRECTION_PALIER: 0.35,
  RAMPE_DIRECTION_RAPIDE: 3.5,  // jusqu'au palier en 0,1 s
  RAMPE_DIRECTION_LENTE: 0.65,  // du palier au bout en 1 s
  RETOUR_DIRECTION: 5,          // du bout au centre en 0,2 s

  // la boîte de vitesses : seulement pour l'affichage et le son, elle ne change pas la physique
  RAPPORTS_HAUT_KMH: [95, 130, 165, 200, 235, 268, 300, 345],   // la vitesse où chaque rapport est au régime max
  REGIME_RALENTI: 4000,         // tr/min
  REGIME_MAX: 12000,

  // le son (Web Audio, synthétisé)
  SON_VOLUME: 0.35,
  SON_EXPLOSIONS_PAR_TOUR: 3,   // un V6 à 4 temps : 3 explosions par tour de vilebrequin → la note du moteur
  SON_FILTRE_MOTEUR: [900, 3200],   // le filtre du moteur s'ouvre de ces Hz (pied levé) à ceux-ci (plein gaz)
  SON_DERIVE_CRISSEMENT: 0.08,  // rad : au-dessus de cet angle de dérive, les pneus crissent
  SON_VOLUME_PNEUS: 0.25,
  SON_VOLUME_CHOC: 0.6,
  SON_MOTEUR_PIED_LEVE: 0.35,   // le volume du moteur sans gaz (1 = plein gaz)
  SON_PNEUS_FREQUENCE: 2500,    // Hz, le centre du bruit des pneus
  SON_CHOC_DUREE: 0.35,         // s
  SON_SIGNAUX: {                // les signaux de course : [fréquences (Hz) jouées l'une après l'autre, durée de chaque note (s)]
    compte: [[440], 0.15],      // 3, 2, 1
    go: [[880], 0.45],
    arrivee: [[523, 659, 784, 1047], 0.16],
  },
  SON_VOLUME_SIGNAL: 0.25,
  SON_LISSAGE: 0.03,            // s : le son rejoint sa nouvelle valeur en ce temps (pas de clics)

  // la course seule (étape 3)
  LONGUEURS_COURSE: { tresCourte: 5, moyenne: 12, longue: 18 },   // nombre de tours ; 0 = essai libre
  COMPTE_A_REBOURS: 3,          // s : 3, 2, 1, GO (les vrais feux viendront à l'étape 5)
  DEPART_RECUL: 6,              // m : la voiture part arrêtée juste derrière la ligne
  MARGE_COUPE: 1,               // m au-delà du bord : à partir de là, on est sorti de la piste
  SEUIL_COUPE: 2,               // m : virage coupé si la sortie fait gagner plus que ça le long de la piste
  PENALITE_COUPE: 5,            // s ajoutées au temps total
  ARRET_APRES_ARRIVEE: 0.3,     // m/s : après l'arrivée, la voiture freine seule jusque-là, puis roule jusqu'à l'arrêt

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
  HALO_EPAISSEUR: 0.035,        // m, le rayon du tube du halo (on le voit en vue cockpit)
  // les caméras de course (C passe de l'une à l'autre)
  CAMERA_DERRIERE: [7.5, 2.4],  // recul et hauteur derrière la voiture (m) : fixes, la caméra ne traîne pas derrière
  CAMERA_RECUL_VITESSE: 0.5,    // m de recul en plus à pleine vitesse (90 m/s)
  CAMERA_SUIVI_CAP: 6,          // 1/s : la caméra tourne autour de la voiture avec un léger retard dans les virages
  CAMERA_SUIVI_HAUTEUR: 4,      // 1/s : la hauteur est un peu lissée
  CAMERA_CHAMP: [60, 6],        // champ de vision derrière : de base, plus ce nombre à pleine vitesse (degrés)
  CAMERA_COCKPIT: [0.2, 0.88],  // l'œil du pilote, à la place du casque (caché en vue cockpit) : avant, hauteur (m)
  CAMERA_COCKPIT_CHAMP: 72,
  TELE_ESPACEMENT: 250,         // une caméra télé tous les 250 m le long de la piste
  TELE_RECUL: 8,                // à cette distance derrière la barrière (m)
  TELE_HAUTEUR: 7,
  TELE_CADRAGE: 9,              // la voiture et ce qui l'entoure, en mètres, remplissent l'image

  PIXEL_RATIO_MAX: 1.5,         // au plus 1,5 pixel dessiné par pixel CSS (un écran Retina en demande 2)

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
