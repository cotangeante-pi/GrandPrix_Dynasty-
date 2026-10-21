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
  LONGUEUR_VOITURE: 5.5,        // m : le rectangle de chaque voiture, pour les contacts entre voitures
  LARGEUR_VOITURE: 2,
  // l'aspiration : derrière une autre voiture, la traînée baisse (jusqu'à ASPIRATION_MAX collé derrière)
  ASPIRATION_MAX: 0.35,
  ASPIRATION_DISTANCE: 50,      // m : le sillage s'étend jusque-là derrière une voiture…
  ASPIRATION_LARGEUR: 2.5,      // m : … à moins de ça de son axe
  REBOND_VOITURE: 0.2,          // choc entre voitures : part de la vitesse de rapprochement qui repart (0 = elles restent ensemble)
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

  // l'IA (étape 4) : la trajectoire idéale et la vitesse conseillée sont calculées une fois par circuit (ia.js)
  CALCUL_TRANCHE_MS: 20,        // ms : dans la page, le calcul de la trajectoire est découpé en tranches de cette durée
  IA_MARGE_BORD: 1.5,           // m : la trajectoire reste à cette distance du bord de la piste
  IA_LISSAGE_PASSES: [[24, 60], [12, 60], [6, 60], [3, 60], [1, 60]],   // [écart entre voisins (échantillons), nombre de passes]
  IA_LISSAGE_FORCE: 0.5,        // à chaque passe, un point fait cette part du chemin vers la courbure moyenne de ses voisins
  IA_PLATEAU_PASSES: [[24, 40], [12, 40], [6, 40], [3, 40], [1, 40]],   // puis l'aplatissement du pic de chaque virage : [voisins à ±k, passes]
  IA_PLATEAU_PUISSANCE: 8,      // plus elle est grande, plus le pic de chaque virage est écrasé
  IA_PLATEAU_FENETRE: 30,       // échantillons : le pic d'un virage est cherché à ±60 m
  IA_COURBURE_DEMI_BASE: 3,     // la courbure de la trajectoire est mesurée sur ±3 échantillons (±6 m)
  IA_MARGE_VIRAGE: 1,           // elle prend les virages à cette part de la vitesse limite (sa marge : la trajectoire reste loin du bord)
  IA_MARGE_BRAQUAGE: 0.95,      // … et sans demander plus que cette part du braquage max
  IA_MARGE_FREIN: 0.95,         // elle prévoit de freiner à cette part du freinage possible
  IA_VISEE_MIN: 8,              // m : elle vise un point de sa trajectoire au moins à cette distance devant elle
  IA_VISEE_TEMPS: 0.35,         // s : … ou à la distance parcourue en ce temps
  IA_ANTICIPATION: 0.15,        // s : elle prend la vitesse conseillée là où elle sera dans ce temps
  IA_GAIN_GAZ: 1,               // gaz par m/s de retard sur la vitesse conseillée
  IA_GAIN_FREIN: 1,             // frein par m/s d'avance
  // le pilote qui choisit sa ligne (ia.js, piloterIA)
  IA_PERIODE_DECISION: 0.15,    // s : il choisit sa ligne à ce rythme
  IA_HORIZON: 200,              // m : la longueur des lignes qu'il compare
  IA_LIGNE_PAS: 4,              // m entre deux points d'une ligne
  IA_LIGNE_DEMI_BASE: 2,        // la courbure d'une ligne est mesurée sur ±2 points (±8 m)
  IA_TRANSITION_MIN: 20,        // m : de là où il est jusqu'à la ligne voulue, au moins cette distance…
  IA_TRANSITION_TEMPS: 0.7,     // s : … ou la distance parcourue en ce temps
  IA_ECART_REPLANIF: 1.5,       // m : une nouvelle ligne part de l'ancienne (là où il en est), sauf s'il en est plus loin que ça
  IA_MARGE_BORD_MIN: 1,         // m : aucune ligne ne passe plus près du bord
  IA_DECALAGE_CANDIDAT: 2,      // m : les lignes « intérieur » et « extérieur » sont décalées d'autant
  IA_CONTINUER: [60, 140],      // m : la ligne « continuer » garde sa place jusque-là, puis rejoint sa ligne rapide
  IA_VIRAGE_COURBURE: 1 / 300,  // la carte : un virage a un sommet plus serré que ça…
  IA_VIRAGE_ECART: 40,          // m : … et c'est le plus serré à ±40 m
  IA_VIRAGE_LARGEUR: 60,        // m : le style d'un pilote change sa ligne à ±60 m du sommet de chaque virage
  IA_PREVISION_PROCHE: 15,      // m : une voiture plus près que ça (devant, à côté) pourrait aussi garder sa place sur la piste
  IA_PREDICTION: 3,             // s : il prévoit où seront les voitures qu'il voit jusque-là
  IA_MARGE_LONG: 4,             // m en plus de la longueur d'une voiture : la ligne passe trop près d'une voiture…
  IA_MARGE_LAT: 1.5,            // m en plus de la largeur d'une voiture : … ou trop à côté
  IA_VITESSE_RAPIDE: 50,        // m/s (180 km/h) : au-dessus, l'écart sûr entre deux voitures côte à côte est plus grand…
  IA_MARGE_LAT_RAPIDE: 2.5,     // m en plus de la largeur d'une voiture (au lieu de IA_MARGE_LAT)
  IA_PENALITE_HERBE: 1,         // s par point de ligne dans l'herbe, pendant un dépassement
  IA_DROITE_COURBURE: 1 / 500,  // la carte : la piste est droite là où elle tourne moins que ça…
  IA_DROITE_ATTAQUE: 150,       // m : une attaque ne démarre qu'avant un virage précédé d'au moins tant de ligne droite
  IA_FILE_DISTANCE: 30,         // m : hors attaque, une voiture devant lui à moins de ça…
  IA_FILE_COTE: 6,              // m : … et à moins de ça de côté, il la suit (il reste à la file)
  IA_VITESSE_VIRAGE_LENT: 36,   // m/s (130 km/h) : un virage lent, la carte y passe moins vite que ça…
  IA_NEZ_DEVANT: 0.5,           // … au point de freinage, l'attaquant doit y avoir le nez devant (son centre au moins cette part de longueur devant)
  IA_REFLEXE_COTE: 4.5,         // m : il ne braque pas vers une voiture à côté de lui plus près que ça
  IA_REFLEXE_TEMPS: 0.6,        // s : … plus ce qu'il gagne sur elle en ce temps, devant lui
  IA_CEDER_ECART: 1,            // m : coincé à côté d'une voiture (sa ligne empiète d'autant sur la place à laisser), il cède…
  IA_CEDER_FORT: 4,             // m/s : … en roulant d'autant moins vite qu'elle, tant qu'elle est à côté…
  IA_CEDER_DUREE_MAX: 4,        // s : … au plus ce temps
  IA_CEDER: 1,                  // m/s : à côté d'une voiture et un peu en retrait, il roule moins vite qu'elle d'autant
  IA_PENALITE_VOITURE: 5,       // s ajoutées à la note d'une ligne qui touche une voiture
  IA_PENALITE_BORD: 0.5,        // s par m² au-delà de IA_MARGE_BORD_MIN
  IA_PENALITE_FREIN: 0.5,       // s par m/s de trop qu'il ne peut plus perdre à temps
  IA_PENALITE_SORTIE: 0.8,      // s par m/s qui lui manque au bout de la ligne (ce qu'il perdra après)
  IA_GAIN_CHANGEMENT: 0.05,     // s : il ne change de ligne que si la nouvelle lui fait gagner plus que ça (sauf danger)
  IA_DEPART: [150, 350],        // m : au départ, il garde sa file jusque-là, puis rejoint sa ligne avant là
  IA_DEPASSEMENT: true,         // les IA attaquent (voir majAttaque)
  IA_ATTENTE_ATTAQUE: 1.5,      // s : retenue depuis ce temps par la voiture devant, elle l'attaque
  IA_RETENUE_ECART: 1,          // m/s : retenue = elle voudrait aller au moins ça plus vite
  IA_ATTAQUE_ECART_TEMPS: 1,    // s : la voiture attaquée s'échappe à plus de ça devant : l'attaque s'arrête
  IA_DISTANCE_ATTAQUE: 7,       // m : en préparant son attaque, elle se cale à ça derrière (dans le sillage)
  IA_DECALAGE_ECART: 20,        // m : elle ne se décale que si elle est à moins de ça derrière
  IA_DECALAGE_DISTANCE: 60,     // m avant le point de freinage, au moins, elle se décale à côté…
  IA_DECALAGE_TEMPS: 1.2,       // s : … ou la distance parcourue en ce temps
  IA_RAPPROCHEMENT: 5,          // m/s : … ou s'il arrive au moins ça plus vite qu'elle (au freinage)
  IA_ATTAQUE_CONTROLE: 40,      // m avant le sommet du virage : l'entrée, où elle doit être à hauteur…
  IA_ATTAQUE_HAUTEUR: 0.5,      // … à moins de cette part de longueur derrière : elle plonge ; sinon elle abandonne
  IA_ATTAQUE_FREIN: 1.05,       // en attaque, elle ose cette part du freinage de la marge habituelle (son style : 0,92 à 1)
  IA_ATTAQUE_APRES_SOMMET: 30,  // m après le sommet du virage, elle revient sur sa ligne
  IA_PREPARER_DUREE_MAX: 30,    // s : collée derrière sans trouver l'occasion de se décaler, elle renonce
  IA_ATTAQUE_DUREE_MAX: 10,     // s : décalée depuis plus longtemps sans passer, elle abandonne
  IA_ATTAQUE_REPOS: 3,          // s avant de réattaquer après une attaque abandonnée
  IA_DEPASSEMENT_RAMPE: 40,     // m pour revenir sur sa ligne
  IA_HAUTEUR_LAISSER: 1 / 3,    // une voiture à côté, à hauteur d'au moins ce tiers de longueur : on lui laisse la place…
  IA_ESPACE_LAISSE: 1.5,        // m : … une largeur de voiture plus ça, jusqu'à la sortie du virage
  // la façon de piloter de chaque IA, tirée avec la graine
  IA_STYLE_APEX: [-5, 5],       // m : point de corde plus tôt (< 0) ou plus tard
  IA_STYLE_CORDE: [0, 2.5],     // m de largeur de piste qu'il n'utilise pas près des virages (0 = il va d'un bord à l'autre)
  IA_STYLE_MARGE_BORD: [1.1, 2],// m : marge au bord (petite = prend des risques)
  IA_STYLE_FREIN: [0.92, 1],    // part du freinage qu'il ose
  IA_VARIATION_APEX: 2,         // m : d'un tour à l'autre, le point de corde varie de ±2 m…
  IA_VARIATION_COTE: 0.4,       // m : … et sa place sur la piste de ±0,4 m
  IA_RYTHME: [0.94, 1],         // le rythme de chaque IA (part de la vitesse conseillée), tiré entre ces deux nombres
  // le caractère de chaque IA (étape 4d), tiré avec la graine entre ces bornes :
  IA_CARACTERE: {
    regularite: [0.002, 0.015], // d'un tour à l'autre, son rythme varie de ± cette part autour de sa moyenne, sans jamais dépasser le sien
    agressivite: [0, 1],        // 0 : prudent ; 1 : attaque plus tôt
    erreurs: [0.1, 1],          // erreurs par course de 5 tours
  },
  IA_VISION_ANGLE: 0.6,         // rad : elle voit les voitures devant elle à ±0,6 rad (±34°) de son axe…
  IA_VISION_DISTANCE: 120,      // m : … et à moins de cette distance
  IA_VISION_COULOIR: 4.5,       // m : … et aussi toute voiture devant elle à moins de ça de son axe (même tout près, sur le côté)
  IA_VISION_COTE: [8, 7],       // m : … et celles à côté d'elle (dans les rétroviseurs) : à moins de 8 m devant ou derrière, 7 m de côté

  // la grille de départ : deux files décalées
  GRILLE_ESPACEMENT: 8,         // m entre deux places qui se suivent (une file sur deux)
  GRILLE_ECART: 3,              // m : chaque file est à cette distance du milieu de la piste
  SIMULATION_MARGE_DEVANT: 6,   // m : une voiture est devant une autre à partir de cet écart (un dépassement compte quand ça change)
  SIMULATION_TEMPS_MAX: 150,    // s par tour : une course simulée s'arrête là, même si des voitures n'ont pas fini
  RADAR_RAYON: 150,             // m : le radar montre la piste et les voitures jusque-là autour du joueur
  CLASSEMENT_PAS: 2,            // m : pour les écarts du classement, on note quand chaque voiture passe tous les 2 m
  GRAINE_STYLES: 1000,          // les façons de piloter sont tirées avec la graine de la course + ce nombre
  GRAINE_CARACTERE: 3000,       // … et le caractère des pilotes avec la graine + ce nombre
  GRAINE_QUALIF: 2000,          // … et la qualification avec la graine + ce nombre
  IA_QUALIF_HASARD: 0.005,      // le temps de qualification d'une IA varie de ±0,5 % autour de son meilleur tour estimé
  IA_PAGE_MAX: 20,              // ?ia=N : au plus ce nombre d'IA dans la page
  // ?ia=N : la couleur de chaque IA (provisoire : les écuries viendront à l'étape 6)
  COULEURS_IA: [0x1f6fe0, 0xd8262e, 0xf2c230, 0x2fa84f, 0xf07d1a, 0x8e44ad, 0x1abc9c, 0xecf0f1, 0x34495e, 0xe84393],
  // derrière une voiture plus lente (sans la dépasser, étape 4a) ; distances d'un centre de voiture à l'autre
  IA_DISTANCE_MIN: 8,           // m : jamais plus près
  IA_DISTANCE_SUIVI: 14,        // m : la distance où elle se cale derrière
  IA_GAIN_DISTANCE: 1,          // m/s de vitesse en plus par m d'écart en trop, près d'elle…
  IA_GAIN_DISTANCE_LOIN: 1.5,   // … et loin d'elle (au-delà de deux fois la distance de suivi)

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
  HALO_EPAISSEUR: 0.035,        // m, le rayon du tube du halo
  HALO: [0.25, 0.34],           // m, le centre de l'arceau du halo (en avant du centre de la voiture) et son rayon ; le pilier est au bout
  // les caméras de course (C passe de l'une à l'autre)
  CAMERA_DERRIERE: [7.5, 2.4],  // recul et hauteur derrière la voiture (m) : fixes, la caméra ne traîne pas derrière
  CAMERA_RECUL_VITESSE: 0.5,    // m de recul en plus à pleine vitesse (90 m/s)
  CAMERA_SUIVI_CAP: 6,          // 1/s : la caméra tourne autour de la voiture avec un léger retard dans les virages
  CAMERA_SUIVI_HAUTEUR: 4,      // 1/s : la hauteur est un peu lissée
  CAMERA_CHAMP: [60, 6],        // champ de vision derrière : de base, plus ce nombre à pleine vitesse (degrés)
  CAMERA_COCKPIT: [0.75, 1.02], // caméra embarquée, devant le halo et au-dessus du pilote : avant, hauteur (m) ; on voit le nez et les roues avant
  CAMERA_COCKPIT_VISEE: 0.45,   // m : la caméra vise à 30 m devant, plus bas d'autant (le nez reste dans l'image)
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
  // un circuit d'essai technique, pour entraîner et tester les IA sur de vrais virages
  technique: {
    nom: 'Technique',
    largeur: 13,
    secteurs: [0, 0.3, 0.62],
    depart: [0, 0, 0],
    morceaux: [
      ['droite', 628.086],                  // la ligne des stands
      ['virage', 250, 80],                  // la courbe rapide
      ['droite', 150],
      ['virage', 50, 55], ['virage', 45, -75], ['virage', 55, 60],   // l'enchaînement en S
      ['droite', 300],
      ['virage', 70, 60],
      ['droite', 800],                      // la longue droite…
      ['virage', 16, 155],                  // … et le gros freinage dans l'épingle
      ['droite', 70],
      ['virage', 60, -65],
      ['droite', 648.012],                  // les deux longueurs droites referment le tour
      ['virage', 40, 90],                   // retour sur la ligne
    ],
  },
};
