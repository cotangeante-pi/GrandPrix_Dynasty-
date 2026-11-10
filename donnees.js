// Tous les réglages du jeu. Aucun chiffre de réglage ne doit traîner ailleurs dans le code.
// Unité : 1 = 1 mètre ; les angles sont en radians.
const REGLAGES = {
  // la boucle
  PAS_PHYSIQUE: 1 / 120,        // la physique avance toujours de 1/120 s
  PAS_MAX_PAR_IMAGE: 12,        // au plus 0,1 s de physique par image : si l'onglet rame, on ralentit au lieu de s'emballer
  PAS_MAX_FEUX: 120,            // (tour 37d) pendant les feux (voitures tenues sur place) : jusqu'à 1 s rattrapée par image, les feux durent leurs vraies secondes
                                //   même sur un ordinateur lent ; dès l'extinction, on revient à PAS_MAX_PAR_IMAGE (le plafond est relu à chaque pas)

  // la courbe des circuits
  PAS_ECHANTILLON: 2,           // un échantillon de piste tous les 2 m
  PAS_SPLINE_FIN: 0.25,         // pour mesurer la longueur de la spline, on la découpe en morceaux de 25 cm
  PAS_POINTS_MORCEAUX: 4,       // un circuit décrit par morceaux est d'abord converti en points tous les 4 m
  FENETRE_RECHERCHE: 8,         // positionSurPiste cherche à ±8 échantillons (±16 m) de l'indice connu ; une voiture fait < 1 m par pas
  // positionSurPiste repart d'une recherche complète si le point est à plus de ce nombre de largeurs de piste du centre
  ECART_RECHERCHE_COMPLETE: 1.5,
  CROISEMENT_ZONE: 200,         // m : le croisement (le pont de Suzuko, circuit.croisement) : à moins de ça de ses deux passages, deux voitures sont l'une sur le pont, l'autre dessous

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
  // la voiture vivante = le pneu drift (physique.js pasPneusVivant, voitureVivante) : en adhérant (slick), la voiture d'aujourd'hui au bit près
  // (tour 48b, décision du propriétaire du 2026-11-04 : « cache-le, on garde la glisse pour personne ») le pneu drift caché : false = ni choix
  // Grip / Drift (garage, ← → à l'arrêt, bulles), ni 8e leçon, ni voiture vivante pour personne (un pneu 'drift' roule en adhérant, au bit
  // près), une sauvegarde en drift repasse en adhérant ; true rallume tout (une version arcade un jour ; ?drift=1 pour les tests)
  PNEU_DRIFT: false,
  VOITURE_VIVANTE: 1,           // le curseur (&reglages=1) : le pneu drift va de 0 (= l'adhérant) à 1 (la voiture vivante)
  DRIFT_VITESSE: 40,            // m/s : le pneu drift adhère comme l'adhérant à cette vitesse…
  DRIFT_LENT: 0.04,             // … mieux en dessous (jusqu'à + ça à l'arrêt : les virages lents)…
  DRIFT_RAPIDE: 0.06,           // … moins au-dessus (jusqu'à − ça à 2 × DRIFT_VITESSE : les virages rapides)
  VIVANTE_IA: 0,                // 1 = les IA roulent aussi en voiture vivante ; 0 = le joueur seul (les IA ne savent pas encore la piloter : tour 41, en légende, 47 s → plus de 180 s au tour)
  VIVANTE_HAUTEUR_CG: 0.3,      // m : la hauteur du centre de gravité (le transfert de charge : masse × accélération × hauteur / empattement)
  VIVANTE_ADHERENCE_ARRIERE: 1.15, // l'arrière n'accroche plus que ça de plus que l'avant (au lieu d'ADHERENCE_ARRIERE)
  VIVANTE_REPARTITION_FREIN: 0.6,  // part du freinage sur l'avant
  VIVANTE_CERCLE_ARRIERE: 0.4,  // … et à l'arrière (le patinage, le frein arrière)
  VIVANTE_CERCLE: 0.75,         // l'adhérence prise en long (frein, moteur) enlève ça × sa part au carré de l'adhérence de côté
  VIVANTE_AIDES: 0.4,           // les aides arcade (STABILITE_LACET, ANTI_DERIVE) baissent de cette part
  VIVANTE_CHARGE_MIN: 0.15,     // aucun essieu ne porte moins que cette part de la charge
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
    commentaire: [[784, 988], 0.06, 0.4],   // le petit signal du commentateur à chaque phrase (tour 44), à 40 % des autres
  },
  // le mélange (son.js, tour 44) : un volume par famille (menu pause et paddock, sauvegardé), puis un compresseur et un plafond
  SON_FAMILLES: { effets: 1, ambiance: 1, commentateur: 1 },   // de 0 à 1 : moteur et effets, ambiance (pluie, feux, arrivée), commentateur
  SON_FAMILLES_PAS: 0.25,          // les boutons vont de 100 % à 0 par quarts
  SON_COMPRESSEUR: [-10, 6, 12, 0.003, 0.25],   // seuil (dB), genou (dB), rapport, attaque et relâche (s) : le mélange ne sature pas
  SON_PLAFOND: 0.8,                // le gain après le compresseur : il reprend son gain de rattrapage (le même volume qu'avant, à 1 dB près) et laisse une marge sous 1
  SON_VOLUME_SIGNAL: 0.25,
  SON_LISSAGE: 0.03,            // s : le son rejoint sa nouvelle valeur en ce temps (pas de clics)
  // les sensations de conduite (tour 37, sensations.js, son.js, effets3d.js, camera.js) : le son et l'image seulement,
  // rien ne change dans la physique ; tout se coupe dans le menu pause (« Effets de conduite », sauvegardé)
  SENSATIONS_VITESSE_MIN: 3,       // m/s : en dessous, ni vibreur ni herbe (la voiture roule au pas)
  SENSATIONS_DEMI_VOIE: 0.8,       // m : du milieu de la voiture à ses roues (une roue sur le vibreur suffit)
  SENSATIONS_VIBREUR_PLEIN: 0.3,   // m de roue sur le vibreur pour la pleine vibration
  SENSATIONS_GLISSE: [0.08, 0.2],  // rad : la dérive où la glisse commence et celle où elle est pleine
  SENSATIONS_ARRIERE: [0.07, 0.2],   // rad : l'angle de glissement de l'arrière où il commence à partir, et où il est parti (tour 42)
  SENSATIONS_PATINAGE: 0.5,        // le surplus de poussée (part de l'adhérence de l'arrière) pour le patinage plein
  // la glissade rattrapée (sensations.js suivreGlissade, tour 43 : le commentateur et le résumé)
  GLISSADE_HAUT: 0.6,              // l'arrière (ou le patinage) au-delà : une glissade commence…
  GLISSADE_BAS: 0.1,               // … elle est finie quand il repasse sous ça…
  GLISSADE_CALME: 0.4,             // … depuis tant de secondes
  GLISSADE_DUREE_MIN: 0.25,        // s : plus courte, ce n'est qu'un frisson
  GLISSADE_SPIN: 0.9,              // rad : l'arrière au-delà, c'est un tête-à-queue, pas une glissade rattrapée
  GLISSADE_VITESSE_MIN: 5,         // m/s : presque arrêtée, elle n'a rien rattrapé
  SENSATIONS_BLOCAGE_FREIN: 0.85,  // le frein au-delà duquel les roues avant sont au bord du blocage…
  SENSATIONS_BLOCAGE_VITESSE: 14,  // … au-dessus de cette vitesse (m/s)
  SENSATIONS_BLOCAGE_DROIT: 0.35,  // … à moitié en ligne droite (0 à 1), plein en braquant de…
  SENSATIONS_BLOCAGE_BRAQUAGE: 0.5,   // … cette part du volant
  SON_PASSAGE_DUREE: 0.06,         // s : la coupure du passage d'un rapport (puis la note tombe d'elle-même : boite.js)
  SON_PASSAGE_CHUTE: 0.25,         // le volume du moteur pendant la coupure (1 = rien ne change)
  SON_VOLUME_VIBREUR: 0.35,        // le grondement des vibreurs…
  SON_VIBREUR_FREQUENCE: [35, 140],   // … Hz : ses bornes (il suit les bandes qui passent sous les roues)
  SON_VOLUME_HERBE: 0.18,          // le grondement sourd de l'herbe
  SON_VOLUME_BLOCAGE: 0.3,         // le crissement d'un freinage au blocage
  SON_VOLUME_ARRIERE: 0.32,        // le crissement de l'arrière qui glisse ou patine (la voiture vivante, tour 42)…
  SON_ARRIERE_FREQUENCE: 2100,     // … Hz
  SON_BLOCAGE_FREQUENCE: 1700,     // Hz : plus grave que la dérive
  SON_VOLUME_ASPIRATION: 0.22,     // le souffle de l'aspiration, derrière une voiture
  SON_VOISIN_DISTANCE: 60,         // m : on entend la voiture la plus proche à moins de ça…
  SON_VOLUME_VOISIN: 0.3,          // … à ce volume tout près
  SON_VITESSE_SON: 343,            // m/s : l'effet Doppler (la note monte quand elle approche, descend quand elle part)
  SON_VOLUME_PLUIE: 0.12,          // la pluie sur la carrosserie, pluie pleine
  SECOUSSE_VIBREUR: 0.02,          // m : la secousse de la caméra sur le vibreur (très légère)…
  SECOUSSE_CHOC: 0.09,             // … et au choc…
  SECOUSSE_CHOC_DUREE: 0.18,       // … qui s'éteint en ce temps (s)
  CHAMP_HAUTE_VITESSE: [75, 90, 3],   // le champ de vision s'ouvre de 0° à 75 m/s (270 km/h) jusqu'à 3° de plus à 90 m/s (324 km/h)
  FUMEE_MAX: 160,                  // les fumées (blocage, herbe) : au plus tant de bouffées à la fois (un seul appel de dessin)
  FUMEE_PAR_SECONDE: 45,           // bouffées par seconde et par voiture, effet plein
  FUMEE_VIE: [0.7, 1.4],           // s : la vie d'une bouffée (blocage, herbe)
  FUMEE_DISTANCE: 150,             // m : pas de fumée pour une voiture plus loin de la caméra
  COULEUR_FUMEE: 0xd9d9d9,
  COULEUR_POUSSIERE: 0x9a8a5c,     // l'herbe et la terre soulevées
  ETINCELLES_MAX: 120,             // les étincelles des contacts (un seul appel de dessin)
  ETINCELLES_PAR_CONTACT: 18,
  ETINCELLE_VIE: 0.35,             // s
  COULEUR_ETINCELLE: 0xffc04a,
  // les traces de pneus (effets3d.js, tour 42) : un anneau de bandes sombres sur la piste, un seul appel de dessin
  TRACES_MAX: 600,                 // bandes au plus (les plus vieilles cèdent la place)
  TRACES_VIE: 8,                   // s : elles s'effacent en tant de temps
  TRACES_LARGEUR: 0.32,            // m : la largeur d'un pneu
  TRACES_HAUTEUR: 0.026,           // m au-dessus du sol (sur la route, sous les vibreurs)
  TRACES_OPACITE: 0.55,
  TRACES_ARRIERE: 0.3,             // l'arrière marque (et fume) au-delà de cette part de sa glissade
  TRACES_GLISSE: 0.5,              // … ou quand la voiture dérive au-delà de cette part
  TRACES_SAUT: 6,                  // m : au-delà, pas de bande (une remise en piste, une image sautée)
  COULEUR_TRACES: 0x141414,

  // la manette (manette.js, tour 38) : les mêmes cibles que le clavier, la physique ne change pas
  MANETTE_ZONE_STICK: 0.15,        // la zone morte du stick (0 à 1)…
  MANETTE_ZONE_GACHETTE: 0.05,     // … et des gâchettes
  MANETTE_SEUIL_BOUTON: 0.5,       // un bouton compte comme enfoncé au-delà
  MANETTE_SEUIL_MENU: 0.6,         // le stick au-delà de ça choisit le bouton voisin dans les menus…
  MANETTE_REPETITION: [0.4, 0.15], // … et, tenu, il répète après 0,4 s, puis toutes les 0,15 s
  MANETTE_VIBRATION_GLISSE: 0.8,   // la vibration (tour 42) : le gros moteur à l'arrière qui part, au patinage, au blocage, au choc…
  MANETTE_VIBRATION_VIBREUR: 0.5,  // … le petit sur les vibreurs et l'herbe
  MANETTE_VIBRATION_PAS: 0.1,      // s entre deux impulsions…
  MANETTE_VIBRATION_DUREE: 140,    // … ms d'une impulsion (elles se recouvrent un peu : pas de trou)

  // le téléphone (tactile.js, tour 51k, CLAUDE.md « Le téléphone : le volant ») : les mêmes cibles que le clavier, la physique ne change pas
  TACTILE_ACTIF: true,             // faux : rien, même sur un écran tactile (le clavier seul, au bit près) ; sans écran tactile, rien ne change
  VOLANT_PLEIN: 25,                // ° d'inclinaison depuis le neutre = braquage à fond
  VOLANT_ZONE_MORTE: 2,            // ° autour du neutre où l'on ne braque pas
  VOLANT_LISSAGE: 0.06,            // s : le temps que met l'angle lissé à rejoindre la mesure (0 : aucun lissage)
  VOLANT_ATTENTE: 2.5,             // s sans mesure d'orientation après l'activation : pas de capteur, les boutons ◀ ▶
  VOLANT_INVERSE: false,           // vrai : le sens du volant retourné (si un téléphone le prend à l'envers)

  // les aides au pilotage du joueur (assistance.js, tour 41) : seulement ses cibles, avant la physique ; toutes en débutant
  ASSIST_VITESSE_MIN: 5,           // m/s : en dessous, aucune aide
  ASSIST_REGARD: 250,              // m : le freinage assisté regarde jusque-là
  ASSIST_FREIN_PART: 0.75,         // … et compte sur cette part du freinage possible (une marge : il freine un peu tôt)
  ASSIST_MARGE: 0.9,               // … pour passer les virages à cette part de leur vitesse possible (un débutant n'est pas mené au bord)
  ASSIST_FREIN_PENTE: 3,           // m/s de trop pour le frein à fond (moins : un frein partiel)
  ASSIST_ABS_BRAQUAGE: 0.3,        // l'anti-blocage : à partir de cette part du volant…
  ASSIST_ABS_PART: 0.98,           // … le frein reste à cette part du seuil du blocage
  ASSIST_ANTIPATINAGE: [0.85, 1],  // part de l'adhérence latérale prise : les gaz baissent à partir de la 1re et sont nuls à la 2e
  ASSIST_DIRECTION: [0.08, 0.15],  // direction assistée : part du volant par m d'écart à la trajectoire, et au plus
  ASSIST_DIRECTION_VISEE: 12,      // m devant : le point de la trajectoire visé
  // (tour 42d, Codeur 4) avec la voiture vivante (voitureVivante() > 0 ; à 0, rien de ceci n'est lu) : l'arrière se déleste au freinage,
  ASSIST_VIVANTE_FREIN: 0.8,       // le freinage assisté compte sur cette part de plus du freinage possible (il finit de freiner avant le virage)…
  ASSIST_VIVANTE_LEVER: 0.02,      // … l'antipatinage ne lève le pied que de ça par pas de physique au plus (un lever brusque fait partir l'arrière)…
  ASSIST_VIVANTE_DIRECTION: 0.5,   // … la direction assistée corrige × ça (à 1, elle envoyait le brutal dans l'herbe ; tour 43d)
  ASSIST_VIVANTE_ABS_PART: 0.98,   // … et l'anti-blocage, en braquant, garde le frein à cette part du seuil du blocage (comme ASSIST_ABS_PART : 0,6 ou 0,4 faisaient entrer trop vite, glissades et barrières ; tour 42d)
  // le bonus sans aide (le propriétaire, 2026-10-30) : une part des gains d'un Grand Prix par aide coupée, selon ce qu'elle fait vraiment ;
  // seulement l'argent (ni points, ni records), dans le plafond par course (ARGENT_PLAFOND_COURSE) ; +28 % au plus
  ASSIST_BONUS: { direction: 0.15, freinage: 0.10, antiblocage: 0.03, antipatinage: 0 },
  ASSIST_BONUS_ARRONDI: 100,      // le bonus arrondi à cette somme
  // la trajectoire conseillée (conseil.js, tour 39) : dessin seulement, la physique et les IA ne la voient pas
  CONSEIL_LONGUEUR: 300,           // m devant la voiture
  CONSEIL_LARGEUR: 0.7,            // m
  CONSEIL_HAUTEUR: 0.05,           // m au-dessus du sol (au-dessus de la route et des vibreurs)
  CONSEIL_OPACITE: 0.75,
  CONSEIL_TOLERANCE: 0.5,          // m/s : sous la vitesse conseillée moins ça, on peut accélérer (vert)
  CONSEIL_BAISSE: 0.15,            // m/s sur CONSEIL_REGARD points (2 m chacun) : la vitesse conseillée baisse, il faut freiner (rouge)
  CONSEIL_REGARD: 3,
  COULEUR_CONSEIL_VERT: 0x2ecc40, COULEUR_CONSEIL_JAUNE: 0xffd400, COULEUR_CONSEIL_ROUGE: 0xff2a2a,

  // la course seule (étape 3)
  LONGUEURS_COURSE: { tresCourte: 5, moyenne: 12, longue: 18 },   // nombre de tours ; 0 = essai libre
  COMPTE_A_REBOURS: 3,          // s : 3, 2, 1, GO (les vrais feux viendront à l'étape 5)
  DEPART_RECUL: 6,              // m : la voiture part arrêtée juste derrière la ligne
  MARGE_COUPE: 1,               // m au-delà du bord : à partir de là, on est sorti de la piste
  SEUIL_COUPE: 2,               // m : virage coupé si la sortie fait gagner plus que ça le long de la piste
  PENALITE_COUPE: 5,            // s ajoutées au temps total
  // les feux de départ (?ia=N&joueur=1) : à la place du 3-2-1-GO
  FEUX_NB: 5,                   // cinq feux rouges…
  FEUX_INTERVALLE: 1,           // s : … qui s'allument un par un, un par seconde
  FEUX_DELAI: [0.8, 2.6],       // s : puis tous éteints après ce délai, tiré avec la graine : c'est le départ
  FEUX_REACTION_IA: [0.15, 0.45], // s : les bornes humaines du temps de réaction d'une IA à l'extinction (depart.js, tirerIA)
  // le départ parfait (depart.js, étape 5) : le régime de départ (0 à 1, pas celui de boite.js), tenu avec l'accélérateur pendant
  // les feux ; à l'extinction, on lâche puis on réappuie. La sensation (montée, zone verte, sévérité) est à juger par le propriétaire (?reglages=1)
  DEPART_MONTEE: 0.9,           // par seconde : la montée de l'aiguille quand on tient la touche (0 → 1 en 1,1 s)
  DEPART_DESCENTE: 0.6,         // par seconde : sa descente quand on la lâche
  DEPART_VERT: [0.55, 0.75],    // la zone verte de la jauge…
  DEPART_BORD: 0.06,            // … et la marge autour, où le départ est seulement « bon »
  DEPART_REACTION_PARFAITE: 0.3, // s : réaction au plus égale à ça, régime dans le vert = départ parfait ; plus lente = bon
  DEPART_ANTICIPATION: 0.1,     // s : un appui moins de ça après l'extinction (ou dans ce délai avant) est un faux départ
  // les effets, [facteur sur la force du moteur, durée en s] : parfait et faux = la voiture normale (jamais un bonus)
  DEPART_BON: [0.85, 1],
  DEPART_PATINAGE: [0.5, 1.5],
  DEPART_CALE: [0.3, 1.5],
  DEPART_TENIR_PART: true,      // la touche tenue à l'extinction des feux fait partir la voiture (« bon départ » si le régime est dans le vert) ; faux = lâcher puis réappuyer obligatoire (avant le tour 52d)
  DEPART_DECOUVERTE_DOUX: true, // à la découverte : jamais de patinage ni de calé au départ du joueur (au pire « bon ») ; faux = comme avant
  GRILLE_DECOUVERTE_NUE: true,  // la grille de la découverte, pendant les feux : ni jauge, ni chrono, ni radar, ni barre des touches, une seule aide « Tiens ↑ » (plan première minute n° 2) ; faux = l'écran d'avant
  DEPART_AFFICHAGE: 1.5,        // s : le résultat et le temps de réaction restent affichés ce temps
  DEPART_ROBOT_REACTION: 0.2,   // s : le robot d'essai (tests) fait toujours un départ parfait, après ce temps
  // les IA (tirerIA) : la part de la plage FEUX_REACTION_IA qu'un pilote parfaitement régulier garde (le reste vient de son irrégularité)
  DEPART_IA_REACTION_BASE: 0.35,
  DEPART_IA_RATE: [0.04, 0.35], // la probabilité de sortir du vert (patinage ou calé), du pilote qui fait le moins d'erreurs à celui qui en fait le plus
  DEPART_IA_FAUX: 0.01,         // la probabilité d'un faux départ (anticipation), rare
  FAUX_DEPART_VITESSE: 0.5,     // m/s : le joueur qui roule plus vite avant l'extinction fait un faux départ
  PENALITE_FAUX_DEPART: 5,      // s ajoutées au temps total (comme le virage coupé)
  // après l'arrivée du joueur (arrivee.js) : la vue télé sur les autres, puis le podium
  ARRIVEE_ATTENTE_MAX: 90,      // s : le podium vient au plus tard là ; les voitures pas arrivées sont classées dans l'ordre de course
  ARRIVEE_ACCELERE: 100,        // « passer » la vue télé : le reste de la course joué 100 fois plus vite (les mêmes pas de physique, sans les dessiner)…
  ARRIVEE_TRANCHE_MS: 40,       // … au plus ce temps de calcul par image (la page n'est jamais bloquée), l'horloge relue tous les…
  ARRIVEE_PAS_CONTROLE: 12,     // … ce nombre de pas
  // en accéléré, le podium attend que tout le monde ait fini (pas ARRIVEE_ATTENTE_MAX, qui reste pour la vue télé regardée) ; seule une voiture
  // vraiment bloquée (moins de ARRIVEE_BLOQUEE_DISTANCE m en ARRIVEE_BLOQUEE s de course) est classée dans l'ordre de course, et un plafond
  // de temps réel protège la page
  ARRIVEE_BLOQUEE: 20,          // s de course
  ARRIVEE_BLOQUEE_DISTANCE: 5,  // m
  ARRIVEE_ACCELERE_MAX_REEL: 30, // s réelles : au-delà, la fin de la course est jouée aussi vite que possible (ARRIVEE_TRANCHE_FIN_MS par image), sans dessin, jusqu'à la vraie arrivée
  ARRIVEE_TRANCHE_FIN_MS: 200,  // ms de calcul par image après le plafond (tour 46)
  ARRIVEE_IMAGE_TOUS: 10,       // pendant « passer », la scène n'est dessinée qu'une image sur ça (tour 46)
  ARRIVEE_BAGARRE: 15,          // m : deux voitures plus proches que ça se bagarrent (la caméra télé les préfère)
  ARRET_APRES_ARRIVEE: 0.3,     // m/s : après l'arrivée, la voiture freine seule jusque-là, puis roule jusqu'à l'arrêt

  // le championnat (étape 6, championnat.js) : la partie calcul seulement, les écrans viendront après
  POINTS: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],   // les points des 10 premiers d'un Grand Prix
  NB_GRANDS_PRIX: 12,
  // les 12 Grands Prix d'une saison, dans l'ordre (les tracés de circuits-officiels-a.js et -b.js ; tour 32)
  CALENDRIER_CIRCUITS: ['bahrayn', 'melbourn', 'suzuko', 'montreol', 'monoco', 'barcelana', 'silverstoun', 'spaa', 'monzo', 'singapura', 'interlagas', 'yasmarino'],
  // les circuits d'essai, jamais au calendrier d'une saison : une vieille sauvegarde qui les a encore (le calendrier d'avant le tour 32)
  // repasse sur les 12 tracés au chargement (championnat.js : remettreCalendrier, tour 48b)
  CIRCUITS_ESSAI: ['test', 'technique'],
  GRAINE_CHAMPIONNAT: 5000,     // les caractères des 19 pilotes IA sont tirés avec la graine du championnat + ce nombre
  ECURIE_JOUEUR: 9,             // le joueur est le 2e pilote de cette écurie (une des plus faibles)
  NOM_JOUEUR: null,             // null : le nom par défaut, texte('nomJoueur') (« You » / « Toi ») ; la création du pilote (étape 6) le remplira
  // les 10 écuries, de la plus forte à la plus faible ; niveau : la qualité de la voiture (1 = la meilleure).
  // nom : pas encore (les noms inventés, à approuver par le propriétaire, viendront ici) ; sans nom, l'écran affiche
  // texte('ecurie') avec son numéro (« Team 3 » / « Écurie 3 »)
  // niveau : la qualité de la voiture, un facteur sur le rythme des IA de l'écurie (1 = la meilleure, 0,955 = 4,5 % plus lente)
  // couleur : celle des deux voitures de l'écurie (provisoire, les mêmes que COULEURS_IA)
  ECURIES: [
    { niveau: 1, couleur: 0xd8262e }, { niveau: 0.995, couleur: 0xf2c230 }, { niveau: 0.99, couleur: 0x2fa84f },
    { niveau: 0.985, couleur: 0xf07d1a }, { niveau: 0.98, couleur: 0x8e44ad }, { niveau: 0.975, couleur: 0x1abc9c },
    { niveau: 0.97, couleur: 0xecf0f1 }, { niveau: 0.965, couleur: 0x34495e }, { niveau: 0.96, couleur: 0xe84393 },
    { niveau: 0.955, couleur: 0x1f6fe0 },
  ],
  FACTEUR_VOITURE_JOUEUR: 1,    // la qualité de la voiture du joueur : 1 pour l'instant (sa conduite, c'est le propriétaire qui la valide) ; plus tard celle de son écurie, dans ±3 %
  CHAMPIONNAT_TOURS: 5,         // ?championnat=1 : la longueur des Grands Prix, fixe pour l'instant (?tours=1 pour les tests)
  CHAMPIONNAT_TOURS_PREMIER: 3, // (tour 52f, décision du propriétaire) le tout premier Grand Prix de la carrière : 3 tours ; les suivants : CHAMPIONNAT_TOURS (le mettre à la même valeur = le jeu d'avant)
  QUALIF_PASSER_PREMIER_MILIEU: true, // (tour 52f) au tout premier Grand Prix de la carrière seulement, « Passer » la qualification = milieu de grille (decouverte.js : tempsMilieu) ; false = dernier, comme avant
  PADDOCK_COURT_TETE: 3,        // le paddock (tour 48a) : le classement réduit de la page Course montre les 3 premiers,
  PADDOCK_COURT_VOISINS: 1,     // … le joueur avec 1 voisin de chaque côté, et le coéquipier ; « Voir tout » ouvre la page Saison
  // l'argent (étape 8, argent.js, Codeur 3) : les gains d'un Grand Prix, plafonnés par course ; les sponsors viendront à l'étape 9
  ARGENT_PLACE: [50000, 40000, 32000, 26000, 22000, 18000, 15000, 12500, 10000, 8000, 6500, 5500, 4500, 4000, 3500, 3000, 2500, 2000, 1500, 1000],   // du 1er au 20e
  ARGENT_MEILLEUR_TOUR: 5000,   // le meilleur tour de la course
  ARGENT_PLACE_GAGNEE: 1000,    // par place gagnée entre la grille et l'arrivée (jamais négatif)
  DUEL_BONUS: 5000,             // CLAUDE.md « Le duel » : quand le joueur finit devant son coéquipier
  ARGENT_PLAFOND_COURSE: 70000, // au plus, par Grand Prix, tout compris
  // le garage (garage.js) : 4 améliorations de GARAGE_NIVEAUX niveaux ; prix de chaque niveau ; effet par niveau (une fraction :
  // × (1 + niveau × effet) dans physique.js). La qualité de la voiture (moteur + aero + freins) vaut au plus GARAGE_PLAFOND au total
  // (la règle d'or : les améliorations aident un peu, c'est le pilotage qui fait gagner). LISTE À APPROUVER PAR LE PROPRIÉTAIRE.
  GARAGE: {
    roues: { prix: [20000, 40000, 70000, 110000, 160000], effet: 0 },        // les changeurs de roues : l'arrêt au stand plus court (étape 7) ; seul le niveau est gardé pour l'instant
    moteur: { prix: [25000, 50000, 85000, 130000, 190000], effet: 0.005 },   // la vitesse de pointe (la force du moteur), +2,5 % au niveau 5
    aero: { prix: [25000, 50000, 85000, 130000, 190000], effet: 0.005 },     // l'adhérence, +2,5 % au niveau 5
    freins: { prix: [20000, 40000, 70000, 110000, 160000], effet: 0.004 },   // le freinage, +2 % au niveau 5
  },
  GARAGE_NIVEAUX: 5,
  GARAGE_PLAFOND: 0.07,         // +7 % au plus (moteur + aero + freins), quelle que soit la combinaison
  // le réglage de l'aileron (aileron.js, Codeur 3) : un échange, jamais un bonus, hors du plafond du garage ; le cran du milieu = rien
  AILERON_CRANS: 5,
  AILERON_ADHERENCE_PAR_CRAN: 0.015,  // l'adhérence en virage : × (1 + écart au milieu × ce nombre), lue par physique.js (v.aileronAdherence)
  AILERON_TRAINEE_PAR_CRAN: 0.045,    // la traînée : × (1 + écart au milieu × ce nombre), lue par physique.js (v.aileronTrainee)
  AILERON_MARGE: 0.01,          // test : sur le circuit test, aucun cran n'est plus rapide que le cran du milieu de plus de cette part du tour
  AILERON_VIRAGE_LENT: 0.5,     // un virage est « lent » quand sa vitesse limite est sous cette part de la vitesse de pointe (le profil du circuit, pour les IA)
  AILERON_IA_REFERENCE: -0.35,  // le choix des IA : un circuit mixte (le test : −0,33 ; le technique : −0,40, en part du temps) donne le cran du milieu…
  AILERON_IA_CIRCUIT: 6,        // … puis des crans de plus par point de (part de virages lents − part de lignes droites − la référence)…
  AILERON_IA_REGULARITE: 1.2,   // … par point de régularité au-dessus de 0,5 (régulier → plus haut)…
  AILERON_IA_AGRESSIVITE: 1.2,  // … et en moins par point d'agressivité au-dessus de 0,5 (pour doubler en ligne droite)…
  AILERON_IA_HASARD: 1.5,       // … et une part de hasard (en crans, de part et d'autre)
  AILERON_IA_ECART: 1,          // une IA choisit au plus à ce nombre de crans du milieu
  // l'effet de l'aileron sur les voitures des IA (même code que le joueur : physique.js, ia.js le sait). Coupé au tour 29c (avec les crans
  // tirés, tests/courses.html?ailerons=1 dépassait les garde-fous) ; remis quand les IA ont prévu le freinage d'une voiture qui n'a pas le
  // même aileron (ia.js, freinsVus, IA_FREIN_PREVU ; Codeur 1). Les IA choisissent et gardent leur cran ; vrai = elles le portent
  AILERON_IA_ACTIF: true,
  GRAINE_AILERON: 12000,        // les crans des IA sont tirés avec la graine du championnat + ce nombre + la saison et le Grand Prix
  // les réglages de la voiture (reglages-voiture.js, tour 50b ; liste approuvée par le propriétaire le 2026-11-06) : quatre curseurs de
  // RV_CRANS crans, chacun un échange, jamais un bonus (hors du plafond du garage) ; le cran du milieu = le réglage conseillé = la voiture
  // d'aujourd'hui au bit près (aucun champ posé). « écart » = cran − milieu (−2 à +2)
  RV_CRANS: 5,
  // (la « pente » d'un réglage selon la vitesse u : de −1 sous VITESSE − PLAGE à +1 au-dessus de VITESSE + PLAGE ; physique.js penteVitesse)
  RV_FREINS_FORCE: 0.03,        // l'équilibre des freins (écart > 0 : vers l'avant) : la force de freinage × (1 + écart × ça × la pente) …
  RV_FREINS_VITESSE: 63,        // … (plus fort depuis les grandes vitesses, moins à basse vitesse)…
  RV_FREINS_PLAGE: 25,
  RV_FREINS_BLOCAGE: 0.05,      // … et l'adhérence de côté × (1 − écart × ça × frein × |direction|) : les roues avant bloquent en virage
  RV_BOITE: 0.03,               // la boîte (écart > 0 : courte) : la force du moteur × (1 − écart × ça × la pente) : plus en bas, moins en haut
  RV_BOITE_VITESSE: 45,
  RV_BOITE_PLAGE: 20,
  RV_SUSPENSION: 0.015,         // les suspensions (écart > 0 : dures) : l'adhérence × (1 + écart × ça × la pente)
  RV_SUSPENSION_VITESSE: 40,
  RV_SUSPENSION_PLAGE: 20,
  RV_PRESSION_ADHERENCE: 0.008, // la pression des pneus (écart > 0 : haute) : l'adhérence × (1 − écart × ça)…
  RV_PRESSION_ROULEMENT: 0.024, // … le frottement (la traînée et le roulement) × (1 − écart × ça)…
  RV_PRESSION_USURE: 0.1,       // … et l'usure × (1 − écart × ça)
  RV_MARGE: 0.01,               // test : sur le circuit test, aucun cran n'est plus rapide que le milieu de plus de cette part du tour
  // le choix des IA (comme l'aileron) : le milieu + le circuit (AILERON.profil : part de virages lents − part de lignes droites − AILERON_IA_REFERENCE)
  // × RV_IA_CIRCUIT[réglage] + (agressivité − 0,5) × RV_IA_AGRESSIVITE[réglage] + une part de hasard ; au plus RV_IA_ECART crans du milieu
  RV_IA_CIRCUIT: { freins: -4, boite: 5, suspensions: -5, pression: -4 },
  RV_IA_AGRESSIVITE: { freins: 1.2, boite: -1, suspensions: 0.8, pression: -0.8 },
  RV_IA_HASARD: 1.5,
  RV_IA_ECART: 1,
  RV_IA_ACTIF: true,            // false : les IA choisissent et gardent leurs crans, sans les porter (comme AILERON_IA_ACTIF)
  GRAINE_REGLAGES_VOITURE: 13000,   // les crans des IA : la graine du championnat + ce nombre + la saison et le Grand Prix
  // les saisons (étape 9, saisons.js, Codeur 3)
  SAISONS_MAX: 15,              // la retraite par l'âge : la carrière s'arrête après ce nombre de saisons
  GRAINE_SAISONS: 7000,         // l'évolution des rivaux est tirée avec la graine du championnat + ce nombre + la saison
  // les contrats : la note du joueur (0 à 1) = son classement, son duel (poids) et la confiance de l'écurie (poids) ; chaque
  // écurie exige une note selon son niveau, de CONTRAT_EXIGENCE_MAX (la meilleure) à 0 (la plus faible accepte toujours)
  CONTRAT_POIDS_DUEL: 0.3,
  CONTRAT_POIDS_CONFIANCE: 0.1,
  CONTRAT_EXIGENCE_MAX: 0.85,
  // les salaires et la négociation des contrats avec les patrons (patrons.js, tour 35) ; CONTRAT_SALAIRES_ACTIFS faux : aucun salaire
  CONTRAT_SALAIRES_ACTIFS: true,
  CONTRAT_SALAIRE_MIN: 20000,       // le salaire d'une saison (versé à la signature) dans la plus faible écurie…
  CONTRAT_SALAIRE_MAX: 150000,      // … et dans la meilleure (entre les deux : selon le rang de l'écurie)
  CONTRAT_NEGO_FACTEUR: 0.6,        // le bonus de salaire qu'un patron peut accepter = ce facteur × son envie de t'avoir (ta note − son exigence…)…
  CONTRAT_NEGO_MAX: 0.25,           // … jamais plus de +25 % du salaire de base
  CONTRAT_NEGO_EXCES: 2,            // une demande de plus de 2 fois ce qu'il peut : refusée net (sinon, une contre-offre)
  CONTRAT_NEGO_REFUS_MAX: 3,        // au 3e refus, il ferme la négociation (l'offre reste, au salaire de base)
  PATRON_POIDS_REPUTATION: 0.2,     // ta réputation auprès des sponsors pèse ça dans son envie (−0,1 à +0,1)…
  PATRON_POIDS_RELATION: 0.1,       // … et votre relation, ça
  PATRON_ENVIE_FORTE: 0.2,          // au-dessus : il te veut vraiment (il le dit)
  PATRON_ECART_RESULTATS: 2,        // ton patron : tu es « au-dessus » de ce qu'on attend si tu es 2 places mieux que le rang de l'écurie (ou en dessous)
  PATRON_CONFIANCE_HAUTE: 65,       // la confiance de l'écurie (0 à 100) : haute au-dessus…
  PATRON_CONFIANCE_BASSE: 35,       // … basse en dessous
  PATRON_CONFIANCE_INSULTE: 3,      // insulter ton patron : la confiance baisse de ça
  PATRON_CONFIANCE_EXPLOIT: 2,      // (tour 37i) ton patron remarque ton exploit sans aide (ou en légende), une fois : la confiance monte de ça ; jamais un moins pour qui garde ses aides
  PATRON_STATUT_ECART: 3,           // premier pilote : il faut mener le duel contre ton coéquipier d'au moins 3 points…
  PATRON_STATUT_CONFIANCE: 55,      // … et une confiance d'au moins ça
  PATRON_BUDGET_CONFIANCE: 55,      // un coup de pouce pour la voiture, une fois par saison, si tu fais mieux que prévu et avec cette confiance…
  PATRON_BUDGET_MONTANT: 25000,     // … de ce montant (crédité au solde : à dépenser au garage)
  CONFIANCE_DEPART: 50,         // la confiance de l'écurie (0 à 100), fixe tant que les consignes d'équipe n'existent pas
  // les rivaux qui évoluent, entre deux saisons
  AGE_DEPART: [21, 36],         // l'âge des 19 pilotes à la création (tiré)
  AGE_ARRIVEE: [19, 23],        // l'âge d'un nouveau pilote
  AGE_JEUNE: 26,                // jusqu'à cet âge, le rythme progresse de RYTHME_PROGRESSION (× 0,5 à 1,5) par saison
  AGE_DECLIN: 33,               // à partir de cet âge, il baisse de RYTHME_DECLIN (× 0,5 à 1,5) par saison
  AGE_RETRAITE: 36,             // à partir de cet âge, la retraite chaque saison avec la probabilité RETRAITE_PROBABILITE…
  AGE_RETRAITE_MAX: 39,         // … et sûrement à cet âge
  RETRAITE_PROBABILITE: 0.4,
  RYTHME_PROGRESSION: 0.004,
  RYTHME_DECLIN: 0.004,
  RYTHME_MIN: 0.96, RYTHME_MAX: 1.03,   // le facteur de rythme d'un pilote (1 = la base de son caractère)
  RYTHME_ARRIVEE: [0.97, 1.0],  // celui d'un nouveau pilote
  TRANSFERTS_PAR_SAISON: 2,     // des échanges de place entre deux pilotes IA d'écuries différentes
  NIVEAU_MONTENT: 3,            // les écuries les mieux classées montent de NIVEAU_EVOLUTION, les plus mal classées baissent d'autant
  NIVEAU_EVOLUTION: 0.005,
  NIVEAU_MIN: 0.94, NIVEAU_MAX: 1.0,
  // la voiture du joueur suit le niveau de son écurie (CLAUDE.md « La carrière du joueur » ; décision du Chef, tour 25c) : GARAGE.appliquer
  // multiplie moteur, aéro et freins par ce niveau (le même nombre que appliquerNiveaux pour les IA) ; false pour couper (à essayer par le propriétaire)
  NIVEAU_JOUEUR_ACTIF: true,
  // les sponsors (sponsors.js) : au début d'une saison, entre SPONSORS_OFFRES[0] et [1] offres parmi SPONSORS (ceux dont l'exigence ≤ la
  // note du joueur, les petits complètent) ; le joueur en choisit SPONSORS_MAX ; noms dans textes.js (sponsor_<cle>), jamais une vraie marque
  GRAINE_SPONSORS: 9000,
  SPONSORS_MAX: 1,
  SPONSORS_OFFRES: [2, 4],
  SPONSORS: [
    { cle: 'brio', montant: 10000, exigence: 0, objectifs: [{ type: 'sansPenalite', n: 1, prime: 5000 }] },
    { cle: 'montclair', montant: 15000, exigence: 0.1, objectifs: [{ type: 'points', n: 20, prime: 10000 }] },
    { cle: 'zephyr', montant: 20000, exigence: 0.25, objectifs: [{ type: 'duel', n: 8, prime: 15000 }, { type: 'top5Circuit', n: 1, prime: 10000 }] },
    { cle: 'helios', montant: 30000, exigence: 0.4, objectifs: [{ type: 'podiums', n: 3, prime: 20000 }] },
    { cle: 'kestrel', montant: 45000, exigence: 0.6, objectifs: [{ type: 'victoire', n: 1, prime: 25000 }, { type: 'points', n: 120, prime: 20000 }] },
    { cle: 'orbis', montant: 70000, exigence: 0.8, objectifs: [{ type: 'podiums', n: 6, prime: 40000 }, { type: 'duel', n: 10, prime: 20000 }] },
  ],
  SPONSOR_DOMICILE_PRIME: 20000,    // l'objectif spécial du Grand Prix à domicile (podium chez soi : « prime doublée »)…
  SPONSOR_DOMICILE_PLAFOND: 30000,  // … et son plafond
  // la fiche d'un rival (fiche.js) : les mots du caractère, d'après ses nombres
  FICHE_SEUILS: { rapide: 1.01, regulier: 0.006, agressif: 0.65, fautif: 0.6 },   // rythme ≥, régularité ≤, agressivité ≥, erreurs ≥
  // l'interview d'après course (interview.js, Codeur 3) : la réputation (trois jauges 0 à 100 : public, écurie, sponsors)
  REPUTATION_DEPART: 50,
  // les faits, du plus marquant au moins marquant : au plus une question par Grand Prix
  INTERVIEW_PRIORITES: ['domicileFete', 'domicileDecu', 'legende', 'sansAide', 'victoire', 'podium', 'contact', 'depassement', 'penalite', 'duelGagne', 'duelPerdu', 'serie', 'moyen'],
  INTERVIEW_EFFETS: { provocant: { public: 4, ecurie: -3, sponsors: -3 }, calme: { ecurie: 3, sponsors: 2 }, malin: { public: 2, sponsors: 3 } },   // le pas de chaque jauge, par ton
  INTERVIEW_PAS: 5,                 // le plafond d'un pas (une réponse ne bouge jamais une jauge de plus)
  INTERVIEW_CHOC: 5,                // m/s : un gros contact (v.chocMax du moteur)
  INTERVIEW_DEPASSEMENT_PLACES: 3,  // places gagnées entre la grille et l'arrivée pour parler d'un dépassement décisif
  INTERVIEW_SERIE: 3,               // Grands Prix de suite sans point : une série
  INTERVIEW_DUEL_NET: 2,            // le duel contre le coéquipier fait question quand l'écart de la saison (cette course comprise) atteint ce score
  INTERVIEW_RIVALITE_COURSES: 3,    // une réponse provocante contre un pilote nommé : sa rivalité dure ce nombre de courses
  // l'effet de la rivalité en piste (ia.js, Codeur 1) : contre le JOUEUR seulement, le rival est un peu plus agressif, en attaque et en
  // défense ; jamais de triche (même physique, mêmes informations) : un petit décalage de ses réglages, plafonné
  INTERVIEW_RIVALITE_DECALAGE: 0.3, // ajouté à son agressivité (0 à 1) quand il attaque le joueur…
  INTERVIEW_RIVALITE_PLAFOND: 0.3,  // … jamais plus que ça (le décalage de ses réglages, au plus)
  INTERVIEW_RIVALITE_DEFENSE: 5,    // m par point de décalage : le joueur le suit de près avant un freinage, il couvre l'intérieur du virage (0,3 → 1,5 m)…
  // la disposition promise en discussion (discussion.js, Codeur 3 ; ia.js) : pour le Grand Prix suivant seulement, un effet petit et plafonné
  DISPOSITION_LAISSER: 0.5,     // « laisser passer » : il laisse la place au joueur à côté de lui dès IA_HAUTEUR_LAISSER × (1 − ça) de chevauchement
  DISPOSITION_DEFENSE: 1,       // m : « bloquer X » : il couvre l'intérieur du prochain virage de ça quand X le suit de près
  DISPOSITION_PLAFOND: 0.5,     // jamais plus : DISPOSITION_LAISSER ≤ ça, DISPOSITION_DEFENSE ≤ ça × INTERVIEW_RIVALITE_DEFENSE (2,5 m)
  INTERVIEW_RIVALITE_DISTANCE: 8,   // m : … le joueur derrière lui à moins de ça (dans ses rétroviseurs : pas plus que IA_VISION_COTE[0])…
  INTERVIEW_RIVALITE_RAMPE: 40,     // m : … il s'y décale sur cette distance ; et, à côté du joueur, il lui laisse moins de place (IA_ESPACE_LAISSE × (1 − décalage))
  INTERVIEW_EFFET_SPONSORS: 0.1,    // le plafond (±) de ce que la jauge des sponsors ajoute à la note et aux montants des sponsors
  GRAINE_INTERVIEW: 11000,          // la graine des formulations
  // les noms des 20 pilotes, deux par écurie dans l'ordre (le 20e est remplacé par le joueur) : pas encore (les noms
  // inventés, à approuver par le propriétaire, viendront ici) ; sans nom, l'écran affiche texte('pilote') avec son numéro (« Driver 7 » / « Pilote 7 »)
  NOMS_PILOTES: [],
  // les pneus (étape 7, pneus.js) : branchés dans la page mais désactivés tant que le propriétaire n'a pas jugé la sensation ;
  // ?pneus=1 les active (l'usure de la voiture du joueur baisse son adhérence) ; sans ça, la course est identique au bit près
  PNEUS_ACTIFS: true,   // tour 32 (décision du Chef, le propriétaire : on avance sans attendre ses essais) : les pneus et l'arrêt au stand par défaut ; ?pneus=0 les coupe

  // la une du journal après chaque Grand Prix (journal.js, Codeur 3) ; les titres et les brèves sont dans textes.js (uneTitre_…, uneTexte_…, breve…)
  JOURNAL_PRIORITES: ['titreChampion', 'releve_fils', 'releve_fille', 'releve_protege', 'releve_protegee', 'domicileFete', 'domicileDecu', 'legendeVictoire', 'sansAideVictoire', 'premiereVictoire', 'victoire', 'sansAidePodium', 'premierPodium', 'podium', 'record', 'sansAidePremiere', 'duelGagne', 'duelPerdu', 'interview',
    'penalite', 'serie', 'leader', 'vainqueur'],   // le grand titre : le premier fait vrai de cette liste (« vainqueur » est toujours vrai)
  JOURNAL_DUEL_NET: 3,          // le duel contre le coéquipier fait le titre quand l'écart de la saison est d'au moins ce nombre de points
  JOURNAL_SERIE: 3,             // … une série de ce nombre de Grands Prix sans point
  JOURNAL_ECART_LEADER: 25,     // … le leader (pas le joueur) s'envole : au moins ces points d'avance, et l'avance a grandi
  JOURNAL_FORME_COURSES: 3,     // brève « en grande forme » : un rival qui a fait au moins JOURNAL_FORME_PODIUMS podiums sur ces derniers Grands Prix
  JOURNAL_FORME_PODIUMS: 2,
  JOURNAL_BREVES_MAX: 3,        // les brèves sur le côté, au plus
  JOURNAL_CLASSEMENT: 5,        // en bas : les premiers du championnat (et le joueur s'il n'y est pas)
  JOURNAL_RUMEUR_DES_GP: 7,     // brève « rumeur de transfert » à partir de ce Grand Prix de la saison (les intentions de saisons.js)
  JOURNAL_RUMEUR_FAUSSE: 0.35,  // la part des rumeurs fausses (un pilote et une écurie tirés au hasard) ; la première rumeur de la saison est toujours vraie
  JOURNAL_GRAINE: 6000,         // les variantes des titres sont tirées avec la graine du championnat + ce nombre + le Grand Prix
  // la cérémonie du champion à la fin de la saison (podium3d.js, principal.js, Codeur 3) : le champion seul sur la plus haute marche
  // et des confettis faits par le code (UN objet THREE.Points : un seul appel de dessin, quel que soit leur nombre)
  CEREMONIE_CONFETTIS: 700,     // le nombre de confettis
  CEREMONIE_CONFETTI_TAILLE: 0.32,   // m : la taille d'un confetti
  CEREMONIE_CONFETTI_ZONE: [24, 14, 16],   // m : la largeur, la hauteur et la profondeur de la zone où ils tombent, autour du podium
  CEREMONIE_CONFETTI_VITESSE: [1.1, 2.6],   // m/s : leur vitesse de chute (tirée entre ces bornes)
  CEREMONIE_CONFETTI_BALANCE: 0.6,   // m : ils se balancent de part et d'autre en tombant
  CEREMONIE_COULEURS: [0xffd23f, 0xff5a5f, 0x3ddc97, 0x2f80ed, 0xffffff],
  // la fin de carrière (carriere.js, Codeur 3) : le temple de la renommée garde au plus ce nombre de carrières finies (les meilleures)
  TEMPLE_MAX: 30,
  DOMICILE_FETE_PLACE: 3,       // le Grand Prix à domicile (interview, une du journal) : une fête jusqu'à cette place, une déception au-delà
  // la relève (carriere.js) : l'héritier repart d'une petite écurie, il hérite seulement de peu, toujours plafonné
  HERITAGE_REPUTATION_PAR_TITRE: 2,   // ses jauges de réputation partent de REPUTATION_DEPART + ce nombre par titre de la famille…
  HERITAGE_REPUTATION_MAX: 8,         // … et jamais plus de ce bonus
  ROLE_PATRON: 0.4,             // la part des rivaux retraités qui deviennent patrons d'une écurie (les autres : consultants) ; seulement des noms dans les textes
  GRAINE_ROLES: 13000,
  HERITAGE_ATTENTION: 0.08,           // à la fin de sa première saison, ce bonus de note pour les offres des écuries moyennes et faibles (jamais une grande)

  // la course de découverte du premier lancement (decouverte.js, CLAUDE.md « En piste en 10 secondes »)
  DECOUVERTE_TOURS: 3,          // une longueur à part, seulement pour elle
  DECOUVERTE_IA: 6,             // quelques IA seulement…
  DECOUVERTE_NIVEAU: 'debutant',   // … au niveau débutant (NIVEAUX)
  DECOUVERTE_CIRCUIT: 'test',   // sur un circuit facile (le circuit test tant que les 12 circuits n'existent pas)
  DECOUVERTE_PILOTES: [0, 3, 6, 9, 12, 15],   // les pilotes du monde (ids dans championnat.pilotes) qui courent la découverte : un par écurie
  DECOUVERTE_ARGENT: [1000, 800, 600, 400, 300, 200, 100],   // la prime d'argent de départ selon la place (1er, 2e, …)
  DECOUVERTE_ARGENT_MAX: 1000,  // … et son plafond
  PODIUM_DECOUVERTE_DUREE: 8,   // s : le podium de la découverte passe tout seul à la création du pilote après ce temps (0 : jamais ; tour 52e)
  PODIUM_DECOUVERTE_ENCORE: true, // « Encore une course ? » sur ce podium (la 2e fois sans prime) ; faux : le bouton n'y est pas
  PILOTE_PROPOSITIONS: 3,       // la création du pilote après la découverte : tant de pilotes prêts en grosses cartes (0 : le formulaire seul, comme avant le tour 52e)
  PILOTE_PRENOMS: ['Alex', 'Sam', 'Noa', 'Lou', 'Kim', 'Robin', 'Sacha', 'Mika', 'Dani', 'Jo', 'Ilan', 'Mae', 'Tim', 'Zoe', 'Lea', 'Eden'],   // les prénoms tirés pour ces cartes : génériques, sans accent (l'audit anglais prend une lettre accentuée pour du français), jamais un vrai pilote
  PILOTE_LANGUE_PAYS: { fr: 'fr', en: 'gb', es: 'es', de: 'de', it: 'it', pt: 'pt', nl: 'nl', ja: 'jp', zh: 'cn', sv: 'se', fi: 'fi', da: 'dk', no: 'no', nb: 'no', pl: 'pl', ar: 'ae' },   // le pays d'une carte : la région du navigateur (fr-CA → ca) sinon sa langue
  // le mode 2 joueurs (deux-joueurs.js, CLAUDE.md « Le mode 2 joueurs (écran partagé) ») : ?deux=1 ; les touches par leur place
  // sur le clavier (e.code : W A S D = Z Q S D en AZERTY) ; Échap met en pause pour les deux ; Espace et C ne font rien
  // (tour 49b) les touches au choix (clavier.js) : celles de départ de la course seule (par e.code, la place de la touche : ZQSD en AZERTY
  // = WASD en QWERTY) ; Échap ouvre toujours la pause, quoi qu'on choisisse, et ne peut pas servir à autre chose
  TOUCHES_SEUL: { gaz: ['ArrowUp', 'KeyW'], frein: ['ArrowDown', 'KeyS'], gauche: ['ArrowLeft', 'KeyA'], droite: ['ArrowRight', 'KeyD'], remise: ['Space'], camera: ['KeyC'], pause: ['Escape'] },
  TOUCHES_DEUX: {
    1: { gaz: ['KeyW'], frein: ['KeyS'], gauche: ['KeyA'], droite: ['KeyD'], remise: ['KeyE'] },
    2: { gaz: ['ArrowUp'], frein: ['ArrowDown'], gauche: ['ArrowLeft'], droite: ['ArrowRight'], remise: ['Enter', 'ShiftRight'] },
  },
  DEUX_RAPPEL_DUREE: 10,       // s : le rappel des touches de chaque joueur s'efface au plus tard ce temps après l'extinction des feux (touches.js)
  DEUX_TOURS_CHOIX: [3, 5],     // les longueurs de course permises (la première par défaut)
  DEUX_IA_CHOIX: [0, 3, 5],     // les nombres d'IA permis (la première valeur par défaut)
  DEUX_VOITURES_MAX: 7,         // jamais plus de voitures en piste (2 joueurs + 5 IA) : la 3D est dessinée deux fois
  DEUX_COULEURS: [0x1f6fe0, 0xd8262e],   // la couleur des voitures du joueur 1 🔵 et du joueur 2 🔴 (en attendant leur choix, ordre 3)
  // l'écran avant la course à deux (tour 25b, ordre 3) : les couleurs de voiture proposées (les deux premières = celles par défaut
  // du joueur 1 et du joueur 2, DEUX_COULEURS ; deux joueurs n'ont jamais la même) ; les casques par défaut ; le niveau par défaut des IA
  // l'écran partagé (décision du propriétaire, 2026-10-24) : 'cote' = gauche (joueur 1) / droite (joueur 2), 'haut' = l'ancien haut / bas ;
  // en côte à côte, chaque moitié est étroite et haute : son champ de vision vertical de base (degrés, + CAMERA_CHAMP[1] à pleine vitesse)
  DEUX_PARTAGE: 'cote',
  DEUX_FOV_COTE: 70,
  DEUX_COULEURS_CHOIX: [0x1f6fe0, 0xd8262e, 0xf2c230, 0x2fa84f, 0xf07d1a, 0x8e44ad, 0x1abc9c, 0xe84393],
  DEUX_CASQUES: [{ motif: 'bandes', couleurs: [0x1f6fe0, 0xffffff, 0x111111] }, { motif: 'flammes', couleurs: [0xd8262e, 0xf2c230, 0x111111] }],
  DEUX_NIVEAU: 'normal',
  DEUX_IA_DEFAUT: 3,            // le nombre d'IA proposé la première fois (DEUX_IA_CHOIX)
  // le tournoi chrono entre copains (tournoi.js, CLAUDE.md « Le tournoi chrono entre copains ») : de 2 à 8 joueurs, chacun son tour
  TOURNOI_JOUEURS_MIN: 2, TOURNOI_JOUEURS_MAX: 8,
  TOURNOI_MANCHES: 3,           // 🏆 Tournoi : trois manches (⚡ Éclair : une)
  TOURNOI_POINTS: [25, 18, 15, 12, 10, 8, 6, 4],   // les points d'une manche selon la place (aucun sans temps)
  TOURNOI_COMPTE: 3,            // s : « À toi, Sarah ! » et le compte à rebours, le temps de prendre le clavier
  TOURNOI_COMPTE_DT_MAX: 0.1,   // s : une image plus longue (le chargement, un ordinateur lent) ne compte que ça : le compte à rebours ne saute pas (tour 50c)
  GRAINE_TOURNOI: 8000,
  TOURNOI_PRES: 0.2,            // s : à moins de ça du meilleur temps, la phrase « À 0,03 s du record ! »         // les circuits tirés au sort : la graine + ce nombre
  TOURNOI_CASQUES: [            // les casques par défaut des joueurs (dans l'ordre d'inscription)
    { motif: 'bandes', couleurs: [0x1f6fe0, 0xffffff, 0x111111] }, { motif: 'flammes', couleurs: [0xd8262e, 0xf2c230, 0x111111] },
    { motif: 'etoile', couleurs: [0xf2c230, 0x111111, 0xffffff] }, { motif: 'damier', couleurs: [0x2fa84f, 0xffffff, 0x111111] },
    { motif: 'eclair', couleurs: [0xf07d1a, 0x111111, 0xffffff] }, { motif: 'uni', couleurs: [0x8e44ad, 0xecf0f1, 0x111111] },
    { motif: 'bandes', couleurs: [0x1abc9c, 0x111111, 0xffffff] }, { motif: 'etoile', couleurs: [0xe84393, 0xffffff, 0x111111] },
  ],
  PISTE_GRIS_ECART_MAX: 16,     // tests d'écran : un pixel de piste est gris (ses trois composantes à moins de cet écart), l'herbe est verte
  AIDE_CLIGNOTE_APRES: 3,       // s : sur la grille, sans aucune touche pendant ce temps, l'aide « ↑ » clignote
  // --- les aides au premier usage (aides.js, étape 11b, Codeur 4) : une bulle courte la première fois qu'on rencontre chaque système
  AIDES_ACTIVES: true,          // faux : aucune aide ne s'affiche (le réglage pour les couper toutes)
  AIDES_DUREE_COURSE: 7,        // s : en course, une aide se ferme d'elle-même après ce temps affiché (elle compte alors comme vue)
  AIDES_VUE_APRES: 0.6,         // s : une aide dont le moment passe (on quitte l'écran, la consigne se termine) n'est vue que si elle a été affichée au moins ce temps
  AIDES_ARRET_VITESSE: 1,       // m/s : en dessous, la voiture est à l'arrêt (une aide de course peut s'afficher même dans un virage)
  AIDES_DROITE_DEVANT: 140,     // m : en course, une aide ne s'affiche que si la piste reste droite sur cette distance devant la voiture…
  AIDES_COURBURE_MAX: 1 / 600,  // … c'est-à-dire si sa courbure n'y dépasse jamais ça (1/m : un rayon de 600 m au moins)
  AIDES_FREIN_MAX: 0.05,        // et jamais pendant un freinage (frein de la voiture au-dessus de ça)…
  AIDES_DIRECTION_MAX: 0.3,     // … ni volant tourné (|direction| au-dessus de ça)
  AIDES_PLUIE_EAU: 0.2,         // l'aide de la pluie : dès que la piste a au moins ce niveau d'eau (ou qu'il pleut autant)
  // --- la sauvegarde abîmée ou impossible (tour 41d, Codeur 4) : le bandeau qui le dit, en haut de l'écran
  AVIS_SAUVEGARDE_DUREE: 9,     // s : le bandeau reste ce temps (il ne prend jamais un clic : rien en dessous n'est bloqué)
  // --- le tutoriel guidé (tutoriel.js, étape 11d, Codeur 4) : 7 leçons courtes sur le circuit d'essai, proposées, jamais imposées
  TUTO_TEMPS_MAX: 240,          // s : une leçon de course pas réussie dans ce temps est ratée (« échoue si l'on ne fait rien »)
  TUTO_ZONE_AVANT: 90,          // m : la leçon du freinage : les plots du point de freinage, avant le virage le plus serré…
  TUTO_ZONE_APRES: 30,          // … et la fin de la zone chronométrée, après sa sortie
  TUTO_ZONE_OBJECTIF: 9,        // s : le temps à battre dans la zone (sans sortir) ; mesuré avec le robot d'essai (tests/ecrans.py)
  TUTO_ZONE_ESSAIS: 3,          // passages dans la zone avant que la leçon soit ratée
  TUTO_DEPART_ATTENTE: 3,       // s : la leçon du départ est ratée si on n'est pas parti ce temps après l'extinction des feux
  TUTO_DEVANT_DUREE: 2,         // s : la leçon du dépassement est réussie quand on est devant l'IA depuis ce temps
  TUTO_IA_RYTHME: 0.8,          // le rythme de l'IA lente de la leçon du dépassement (part de la vitesse que sa carte permet)
  TUTO_PLOTS_COULEUR: 0xff7a1a, // les plots de la leçon du freinage
  TUTO_PLUIE_EAU: 0.2,          // la leçon de la pluie : la piste compte comme mouillée à partir de ce niveau d'eau
  TUTO_DRIFT_ARRIERE: 0.6,      // (tour 37l) la leçon du drift : l'arrière glisse au moins jusque-là (SENSATIONS.glisseArriere, 0 à 1)…
  TUTO_DRIFT_TENUE: 0.3,        // … pendant ce temps (s) dans l'épingle, pour que la glissade compte
  TUTO_TETE_A_QUEUE: 1.2,       // rad : l'angle de l'arrière au-delà duquel c'est un tête-à-queue (la leçon est ratée)
  // le casque du pilote (casque.js) : un motif et trois couleurs ; les rivaux tirent le leur avec la graine du championnat
  CASQUE_MOTIFS: ['uni', 'bandes', 'etoile', 'flammes', 'damier', 'eclair'],
  // les motifs à débloquer par des exploits de carrière (casque.js : conditions) ; jamais de la vitesse, seulement un dessin ; gardés à
  // la racine de la sauvegarde (SAUVEGARDE.motifs) : ils survivent à une nouvelle carrière. Le motif → sa condition :
  // victoire (une victoire), titre (un titre), podiums (CASQUE_PODIUMS_DEBLOCAGE podiums), duel (une saison gagnée contre son coéquipier),
  // domicile (gagner son Grand Prix à domicile ou sa course de cœur)
  CASQUE_DEBLOCAGES: { chevrons: 'victoire', couronne: 'titre', zigzag: 'podiums', diagonale: 'duel', coeur: 'domicile' },
  CASQUE_PODIUMS_DEBLOCAGE: 10,
  ANNONCE_MOTIF_DUREE: 6,       // s : l'annonce d'un motif gagné reste à l'écran (ou un clic la ferme)
  CASQUE_PALETTE: [0xd8262e, 0xf2c230, 0x2fa84f, 0xf07d1a, 0x8e44ad, 0x1abc9c, 0xecf0f1, 0x34495e, 0xe84393, 0x1f6fe0, 0x111111, 0xffffff],
  CASQUE_NEUTRE: { motif: 'uni', couleurs: [0xdfe3ea, 0xdfe3ea, 0x34495e] },   // « Toi » avant la création, les voitures sans pilote
  CASQUE_ESSAIS_MAX: 200,       // tirages pour trouver un casque que personne n'a
  GRAINE_CASQUES: 6000,         // les casques des rivaux sont tirés avec la graine du championnat + ce nombre
  GRAINE_GRILLE_DEUX: 7000,     // la grille tirée au sort du mode 2 joueurs (deux-joueurs.js) : la graine de la course + ce nombre
  CASQUE_ATLAS_CASE: 64,        // pixels : la case de chaque casque dans l'atlas (une petite texture partagée, un seul matériau)
  CASQUE_ICONE: 14,             // pixels : l'icône du casque dans la tour, les résultats, le championnat
  CASQUE_APERCU_VITESSE: 1.2,   // rad/s : le casque tourne dans l'éditeur
  // --- la personnalisation (CLAUDE.md « La personnalisation », tour 48c) : la livrée (livree.js), la célébration (celebration.js),
  // la boutique de skins (boutique.js). Un skin ne change que le look, jamais la vitesse
  LIVREE_ACTIVE: true,          // false : la voiture d'avant, d'une seule couleur (sans texture)
  // les motifs de départ (libres) ; les motifs des skins viennent de SKINS (type livree)
  LIVREE_MOTIFS: ['uni', 'bandes', 'fleche', 'degrade', 'damier', 'flammes'],
  LIVREE_DEFAUT: { motif: 'bandes', couleur2: 0xffffff },   // le joueur avant d'avoir choisi, une ancienne sauvegarde
  // la livrée de chaque écurie (dans l'ordre de ECURIES) : son motif et sa couleur secondaire ; la couleur principale reste celle de l'écurie
  LIVREE_ECURIES: [
    { motif: 'fleche', couleur2: 0xffffff }, { motif: 'bandes', couleur2: 0x111111 }, { motif: 'degrade', couleur2: 0xf2c230 },
    { motif: 'flammes', couleur2: 0x111111 }, { motif: 'bandes', couleur2: 0xf2c230 }, { motif: 'fleche', couleur2: 0x34495e },
    { motif: 'damier', couleur2: 0xd8262e }, { motif: 'degrade', couleur2: 0x1abc9c }, { motif: 'uni', couleur2: 0xffffff },
    { motif: 'bandes', couleur2: 0xffffff },
  ],
  LIVREE_DEUX: ['bandes', 'fleche'],   // le mode 2 joueurs : le motif de chaque joueur (sur sa couleur choisie, la 2e couleur de son casque)
  LIVREE_ATLAS_CASE: 128,       // pixels : la case de chaque voiture dans l'atlas des livrées (une texture partagée, un seul matériau)
  LIVREE_APERCU_VITESSE: 0.7,   // rad/s : la voiture tourne dans l'éditeur « Ma voiture »
  // la célébration (celebration.js) : jouée à l'arrivée quand le joueur gagne, et sur le podium quand il est premier
  CELEBRATIONS: ['poing', 'drapeau'],   // celles de départ
  // celles à débloquer par un exploit de carrière (les mêmes conditions que les motifs de casque, casque.js) : célébration → condition
  CELEBRATION_DEBLOCAGES: { donuts: 'victoire', saut: 'podiums', confettis: 'titre' },
  CELEBRATION_DEFAUT: 'poing',
  CELEBRATION_DUREE: 4,         // s : une célébration tourne en boucle, une période dure ce temps
  // la boutique (boutique.js) : chaque skin s'obtient d'UNE façon : argent (le prix, en € du jeu), pub (📺 rewardedBreak, pour toujours)
  // ou recompense (une condition de carrière, il ne s'achète pas). type : livree (un motif de livrée), casque (un motif de casque),
  // celebration ; les skins obtenus sont à la racine de la sauvegarde (ils survivent à une nouvelle carrière)
  SKINS: [
    { id: 'livree_carbone', type: 'livree', motif: 'carbone', obtention: 'argent', prix: 60000 },
    { id: 'livree_eclairs', type: 'livree', motif: 'eclairs', obtention: 'argent', prix: 120000 },
    { id: 'livree_galaxie', type: 'livree', motif: 'galaxie', obtention: 'pub' },
    { id: 'livree_or', type: 'livree', motif: 'or', obtention: 'recompense', condition: 'titre' },
    { id: 'livree_drapeau', type: 'livree', motif: 'drapeau', obtention: 'recompense', condition: 'premiereCourse' },
    { id: 'casque_tigre', type: 'casque', motif: 'tigre', obtention: 'argent', prix: 40000 },
    { id: 'casque_galaxie', type: 'casque', motif: 'galaxie', obtention: 'pub' },
    { id: 'casque_or', type: 'casque', motif: 'or', obtention: 'recompense', condition: 'victoires5' },
    { id: 'celebration_feux', type: 'celebration', motif: 'feux', obtention: 'argent', prix: 80000 },
    { id: 'celebration_toupie', type: 'celebration', motif: 'toupie', obtention: 'pub' },
    { id: 'celebration_trophee', type: 'celebration', motif: 'trophee', obtention: 'recompense', condition: 'legende' },
  ],
  SKIN_VICTOIRES: 5,            // la condition victoires5 : ce nombre de victoires en carrière
  SKIN_LEGENDE_TITRES: 3,       // la condition legende : ce nombre de titres
  ESSAI_TOURS: 2,               // l'essai avant l'achat : ce nombre de tours seul sur le circuit de test, hors championnat (rien n'est compté)
  CACHE_CARTE_TAILLE_MAX: 150000,   // octets : la carte des IA d'un circuit en cache dans la sauvegarde (cache-carte.js) ne doit pas peser plus (test)

  // la création du pilote (pilote.js, étape 6) : le nom, le numéro, le pays, la course de cœur
  NOM_LONGUEUR_MAX: 12,         // caractères du nom du pilote
  NUMERO_MIN: 1, NUMERO_MAX: 99, // le numéro du pilote (jamais celui d'un rival)
  // les pays proposés (codes ; le nom par texte('pays_<code>')), de vrais pays
  PAYS: ['fr', 'be', 'ch', 'ca', 'gb', 'it', 'es', 'de', 'nl', 'at', 'pt', 'mc', 'se', 'fi', 'dk', 'no', 'pl', 'us', 'mx', 'br', 'ar', 'jp', 'cn', 'au', 'nz', 'sg', 'ae', 'bh', 'za', 'in', 'ma'],
  // le pays de chaque circuit (celui du vrai circuit dont il s'inspire, CLAUDE.md « Le Grand Prix à domicile ») : si le joueur
  // vient d'un de ces pays, ce circuit est son Grand Prix à domicile ; sinon il choisit sa course de cœur parmi les 12
  CIRCUITS_PAYS: { monoco: 'mc', silverstoun: 'gb', monzo: 'it', spaa: 'be', suzuko: 'jp', interlagas: 'br', montreol: 'ca', melbourn: 'au', barcelana: 'es', bahrayn: 'bh', singapura: 'sg', yasmarino: 'ae' },
  // les couleurs du drapeau de chaque pays de PAYS (decor-public.js, étape 10) : le public à domicile les porte
  PAYS_COULEURS: {
    fr: [0x0055a4, 0xffffff, 0xef4135], be: [0x111111, 0xfdda24, 0xef3340], ch: [0xda291c, 0xffffff], ca: [0xd80621, 0xffffff],
    gb: [0x012169, 0xffffff, 0xc8102e], it: [0x009246, 0xffffff, 0xce2b37], es: [0xaa151b, 0xf1bf00], de: [0x111111, 0xdd0000, 0xffce00],
    nl: [0xae1c28, 0xffffff, 0x21468b], at: [0xc8102e, 0xffffff], pt: [0x046a38, 0xda291c, 0xffe900], mc: [0xce1126, 0xffffff],
    se: [0x006aa7, 0xfecc00], fi: [0xffffff, 0x002f6c], dk: [0xc8102e, 0xffffff], no: [0xba0c2f, 0xffffff, 0x00205b],
    pl: [0xffffff, 0xdc143c], us: [0xb22234, 0xffffff, 0x3c3b6e], mx: [0x006847, 0xffffff, 0xce1126], br: [0x009c3b, 0xffdf00, 0x002776],
    ar: [0x74acdf, 0xffffff, 0xf6b40e], jp: [0xffffff, 0xbc002d], cn: [0xde2910, 0xffde00], au: [0x00008b, 0xffffff, 0xff0000],
    nz: [0x00247d, 0xffffff, 0xcc142b], sg: [0xef3340, 0xffffff], ae: [0x00732f, 0xffffff, 0x111111, 0xff0000], bh: [0xce1126, 0xffffff],
    za: [0x007749, 0xffb612, 0xde3831, 0x001489], in: [0xff9933, 0xffffff, 0x138808], ma: [0xc1272d, 0x006233],
  },
  // le public des tribunes (decor-public.js, CLAUDE.md « Le Grand Prix à domicile ») : au Grand Prix à domicile du joueur (sa course
  // de cœur), cette part des spectateurs porte les couleurs de son pays ; les autres, et tout le public ailleurs, celles des écuries
  PUBLIC_DOMICILE_PART: 0.4,
  PUBLIC_BANDEROLES: 6,         // les banderoles à domicile (« ALLEZ 27 ! » et le nom du joueur, une sur deux)
  GRAINE_PUBLIC: 14000,         // le public est tiré avec la graine du championnat + ce nombre + le numéro du circuit (une suite à part)
  // les discussions avec les pilotes (discussion.js, parle.js, étape 12b) : de petits effets, tous plafonnés, jamais de triche
  DISCUSSION_RELATION_MAX: 50,      // la relation d'un pilote avec le joueur va de −50 à +50 (0 au départ)…
  DISCUSSION_PAS: 8,                // … et ne bouge jamais de plus de ça en un message
  DISCUSSION_AMI: 20,               // au-dessus : il te parle comme à un ami ; …
  DISCUSSION_ENNEMI: 15,            // … sous −15 : comme à quelqu'un qu'il n'aime pas
  DISCUSSION_FOUGUEUX: 0.6,         // une agressivité (0 à 1) d'au moins ça : il riposte aux insultes et aux menaces (une rivalité)
  DISCUSSION_RANCUNE: 0.8,          // une agressivité d'au moins ça : il refuse les excuses tout de suite après un contact
  DISCUSSION_RIVALITE_COURSES: 2,   // une rivalité née d'une discussion dure ce nombre de courses (comme l'interview : INTERVIEW_RIVALITE_COURSES)
  DISCUSSION_CONFIANCE: 2,          // insulter son coéquipier : la confiance de l'écurie baisse de ça au plus
  DISCUSSION_SEUIL_PASSER: 0.6,     // « laisse-moi passer » : accepté si sa note (relation, prudence, coéquipier, promesse) atteint ça
  DISCUSSION_POIDS_PROMESSE: 0.4,   // … et « je te rendrai la pareille » ajoute ça à la note
  DISCUSSION_PAS_GP: 12,            // (tour 36d) … et ne bouge pas de plus de ça sur un même Grand Prix, tous messages compris (la relation change lentement)
  DISCUSSION_SOUVENIRS: 6,          // (tour 36d) il garde ses 6 derniers moments marquants (insulte, menace, compliment, excuse, paix), sur plusieurs Grands Prix
  PARLE_FLOU: 0.8,                  // (tour 36d) parle.js : un mot inconnu n'est lu comme un mot du lexique que s'il lui ressemble à ce point (avant : 0,66 ; « monkey » devenait « money », un salaire)
  DISCUSSION_DOUX: 0.35,            // (tour 36d) une agressivité d'au plus ça : il parle doux (les variantes _doux) ; au moins DISCUSSION_FOUGUEUX : sec (_vif)
  DISCUSSION_PAR_GP: 14,             // au plus ce nombre de messages à un même pilote par Grand Prix (ensuite il est occupé)
  DISCUSSION_CONV_MAX: 16,          // (tour 36, Codeur 3) la conversation d'un Grand Prix gardée : ses 16 derniers messages (acte, réaction, raisons)…
  DISCUSSION_CONV_LONGUE: 4,        // … après 4 messages, son « au revoir » dit comment s'est passée la conversation…
  DISCUSSION_BILAN: 4,              // … bonne si la relation y a gagné au moins 4, mauvaise si elle en a perdu 4 (et il s'en souvient au Grand Prix suivant)
  DISCUSSION_COURSES: 6,            // (tour 36, Codeur 3) il se souvient des 6 derniers faits de course avec toi (un contact, un dépassement), d'un Grand Prix à l'autre
  DISCUSSION_OUVERTURES: 3,         // (tour 36, Codeur 3) une réponse ne commence comme aucune de ses 3 dernières
  DISCUSSION_MEMOIRE: 12,           // il se souvient des 12 derniers messages (compact : l'acte, la saison, le Grand Prix)
  DISCUSSION_MENACE_COURSES: 2,     // une menace sans suite pendant ce nombre de courses : du crédit perdu (il te le dira)…
  DISCUSSION_CREDIT_MAX: 3,         // … au plus ce nombre de fois
  GRAINE_DISCUSSION: 15000,         // les variantes des réponses : la graine du championnat + ce nombre (une suite à part, ALEATOIRE.suite)
  // le courrier des pilotes (courrier-pilotes.js) : ils écrivent d'eux-mêmes après les faits
  COURRIER_PAR_GP: 3,               // au plus 3 messages par Grand Prix (les plus urgents)
  COURRIER_OUBLI: 4,                // un même sujet ne revient pas chez le même pilote avant 4 Grands Prix
  COURRIER_AGE_MAX: 3,              // (tour 36d) un message de plus de 3 Grands Prix s'efface (les messages lus s'effacent au Grand Prix suivant)
  COURRIER_NON_LUS_MAX: 6,          // (tour 36d) jamais plus de 6 messages non lus dans la boîte (les plus récents restent)
  COURRIER_MAX: 20,                 // la boîte garde les 20 derniers messages
  COURRIER_DUEL_NET: 3,             // ton coéquipier t'écrit quand le duel de la saison penche d'au moins ça
  COURRIER_LEADER_DES: 3,           // le leader du championnat te nargue à partir du 3e Grand Prix
  COURRIER_AGE_VIEUX: 36,           // un pilote de cet âge (AGE_RETRAITE) qui t'aime bien t'écrit un mot, une fois
  COURRIER_PATRON_DES: 6,           // les patrons t'écrivent à partir du 6e Grand Prix de la saison (une meilleure écurie qui te veut ; ton patron déçu)…
  COURRIER_PATRON_MARGE: 0.05,      // … une meilleure écurie t'écrit si ta note est à moins de ça de son exigence
  // les décors des 12 circuits (decors-officiels.js) : rien à moins de cette distance du bord de la voie des stands (m), sauf le bâtiment
  // des stands lui-même, qui reste derrière la voie ; le reste du décor est au-delà de la barrière (DISTANCE_BARRIERE)
  DECOR_MARGE_STANDS: 2,

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
  IA_RAYON_SERRE: 20,           // m : sous ce rayon de piste (une épingle), la courbure d'une ligne est aussi mesurée sur ses points voisins
  IA_LIGNE_DEMI_BASE: 2,        // la courbure d'une ligne est mesurée sur ±2 points (±8 m)
  IA_TRANSITION_MIN: 20,        // m : de là où il est jusqu'à la ligne voulue, au moins cette distance…
  IA_TRANSITION_TEMPS: 0.7,     // s : … ou la distance parcourue en ce temps
  IA_ECART_REPLANIF: 1.5,       // m : une nouvelle ligne part de l'ancienne (là où il en est), sauf s'il en est plus loin que ça
  IA_MARGE_BORD_MIN: 1,         // m : aucune ligne ne passe plus près du bord (le niveau peut l'abaisser pour ses pilotes : NIVEAUX[…].bordMin)
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
  // une voiture lente ou arrêtée (décision du propriétaire, tour 22) : on la contourne, n'importe où, dès qu'il y a la place
  IA_LENTE_PART: 0.45,          // une voiture vue sous cette part de la vitesse de la carte à son endroit…
  IA_LENTE_DUREE: 6,            // s : … depuis plus de ce temps est « lente » (une voiture en erreur qui se remet, ou le peloton groupé du départ, ne l'est pas)…
  IA_LENTE_PLUS_RAPIDE: 2,      // m/s : … et pas plus rapide que lui de plus de ça (une voiture qui repart devant lui n'est pas un obstacle)…
  IA_ARRET_VITESSE: 5,          // m/s : … et une voiture sous ça (arrêtée ou presque)…
  IA_ARRET_DUREE: 1,            // s : … depuis plus de ce temps l'est aussi (un bouchon à l'épingle descend sous 5 m/s une seconde, pas plus)
  IA_LENTE_ECART: 5,            // m : la ligne « éviter » passe à ça d'elle (plus que IA_REFLEXE_COTE : le réflexe ne le freine pas)
  IA_LENTE_CONTACT: 4,          // m : une ligne qui passe à moins de ça d'elle compte comme un contact (moins que IA_LENTE_ECART : près du bord, la ligne est bornée)
  IA_LENTE_NB: 2,               // il contourne les 2 voitures lentes les plus proches devant lui (une ligne « éviter » de chaque côté pour chacune)
  IA_PENALITE_LENTE: 30,        // s ajoutées à la note d'une ligne qui touche une voiture lente ou arrêtée (on ne passe pas à travers)
  IA_LENTE_SUR: 2.5,            // m : au pas, il ne se retient derrière elle que si sa ligne passe à moins de ça d'elle (il la frôle)
  IA_LENTE_VITESSE_FROLE: 5,    // m/s (18 km/h) : « au pas », c'est en dessous de ça
  IA_LENTE_PROCHE: 15,          // m : plus vite, une voiture lente à moins de ça devant lui et de côté à moins de l'écart sûr le retient
  IA_LENTE_AVANT: 40,           // m : il se porte à côté d'elle sur cette distance avant elle…
  IA_LENTE_TEMPS: 1,            // s : … ou ce qu'il parcourt en ce temps, si c'est plus
  IA_LENTE_APRES: 15,           // m : il reste à côté jusque-là derrière elle, puis revient sur sa ligne
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
  // les erreurs des pilotes (étape 4d) : seulement de mauvaises commandes, la même physique
  IA_ERREUR_TYPES: ['freinage', 'blocage', 'large'],   // freinage trop tard, roues bloquées, sortie large
  IA_ERREUR_TOURS: 5,           // le taux d'erreurs du caractère compte les erreurs par course de ce nombre de tours
  IA_ERREUR_DUREES: { freinage: 1.5, blocage: 1, large: 1.2 },   // s : combien de temps dure chaque erreur
  IA_ERREUR_FREINAGE: 0.3,      // freinage trop tard : il vise 30 % trop vite (15 % restait dans sa marge de freinage)
  IA_ERREUR_BLOCAGE: 0.45,      // roues bloquées : il ne freine qu'à cette part
  IA_ERREUR_LARGE: 0.6,         // sortie large : il ne braque qu'à cette part
  IA_ERREUR_AVANT_SOMMET: 25,   // m : la sortie large commence là avant le sommet du virage
  IA_ERREUR_FENETRE: 15,        // m : une erreur se déclenche dans cette fenêtre après son endroit
  IA_DISTANCE_ERREUR: 25,       // m : jamais d'erreur avec une voiture à côté ou derrière lui à moins de ça
  IA_ERREUR_TEMPS_DEVANT: 2,    // s : ni freinage raté avec une voiture devant lui à moins de ça de route (il la percuterait)
  IA_ERREUR_SUITE: 2.5,         // s : après une erreur, il se remet (plus lent), il cède encore la place ; l'herbe et les chocs comptent encore pour elle (3 s : herbe hors erreurs 4027)
  IA_ERREUR_RECUPERATION: 0.5,  // pendant ces secondes, il roule à cette part de sa vitesse visée : le coût de l'erreur (≈ 1 s en moyenne, seul à l'épingle)
  IA_AGRESSIVITE_DROITE: 0.4,   // le plus agressif attaque après une droite 40 % plus courte que IA_DROITE_ATTAQUE
  IA_DEPASSEMENT: true,         // les IA attaquent (voir majAttaque)
  IA_ATTENTE_ATTAQUE: 1.5,      // s : retenue depuis ce temps par la voiture devant, elle l'attaque
  IA_RETENUE_ECART: 1,          // m/s : retenue = elle voudrait aller au moins ça plus vite
  IA_ATTAQUE_ECART_TEMPS: 1,    // s : la voiture attaquée s'échappe à plus de ça devant : l'attaque s'arrête
  DUEL_CHOCS_MAX: 11,           // stands.html (le critère du duel, 50 courses de 12 tours avec un arrêt) : chocs > 5 m/s au plus (mesuré au tour 37)
  IA_PREPARER_LIBRE: 1,         // duel-2 : 1 = en préparant son attaque, retenu seulement à IA_DISTANCE_MIN de la voiture visée, et seulement quand elle freine (ia.js)
  IA_PREPARER_FREIN: 1,         // … et quand elle freine : la distance de l'attaque (IA_DISTANCE_ATTAQUE), sa décélération vue prévue
  IA_PREPARER_FREINE_TARD: 1,   // duel-2 : 1 = en préparant son attaque, à moins de IA_DECALAGE_ECART d'elle, il freine déjà comme en attaque (IA_ATTAQUE_FREIN)
  IA_PREPARER_APRES: 1000,      // m depuis le départ : avant, ni l'un ni l'autre (le premier tour reste celui d'avant)
  IA_FREIN_VU: 0.5,              // m/s² : une voiture qui ralentit plus que ça freine (IA_PREPARER_LIBRE)
  IA_DISTANCE_ATTAQUE: 7,       // m : en préparant son attaque, elle se cale à ça derrière (dans le sillage)
  IA_DECALAGE_ECART: 20,        // m : elle ne se décale que si elle est à moins de ça derrière
  IA_DECALAGE_DISTANCE: 60,     // m avant le point de freinage, au moins, elle se décale à côté…
  IA_DECALAGE_TEMPS: 1.2,       // s : … ou la distance parcourue en ce temps
  IA_RAPPROCHEMENT: 5,          // m/s : … ou s'il arrive au moins ça plus vite qu'elle (au freinage)
  IA_FREIN_VU_DISTANCE: 35,     // m : … à moins de ça devant lui
  IA_RIVAL_VUE_ARRIERE: 20,     // m : duel-court : le rival du joueur le voit derrière lui jusque-là et défend dès qu'il arrive plus vite (au plus IA_DECALAGE_ECART) ; 0 = ses rétroviseurs seulement
  IA_FREIN_VU_TOUS: 1,          // duel-court : 1 = il prévoit le freinage de toute voiture qu'il voit ralentir devant lui (IA_FREIN_PREVU), pas seulement d'un autre aileron
  IA_ATTAQUE_LIGNE_PREVUE: 1,   // duel-court : 1 = la ligne d'attaque suit la place prévue de la voiture attaquée le long du virage (dPrevu) ; 0 = la course d'avant
  IA_RECHANGE_DISTANCE: 0,      // duel-court : > 0 = les lignes de rechange (intérieur, extérieur) seulement avec une voiture à moins de ça (m) ; 0 = dès qu'il en voit une
  IA_SUIVI_CARTE: 0,            // duel-court : > 0 = une voiture vue devant qui roule au moins à cette part de la vitesse de la carte en son point est suivie comme si elle y allait à la vitesse de la carte (ia.js) ; 0 = la course d'avant
  IA_SUIVI_CARTE_LOIN: 20,      // m : … seulement plus loin que ça devant lui (plus près, sa vitesse vue)
  // les techniques en bataille et sous la pluie (tour 45, ia.js) ; 0 = la course d'avant
  IA_BATAILLE_DEFENSE: 1.5,      // m : une voiture plus rapide dans ses rétroviseurs avant un freinage : il ferme la corde de ça (× 0,5 + son agressivité)
  // l'attaque de la voiture de tête (tour 50a, Codeur 1 ; ia.js) : en 5 tours, une IA rattrapait la voiture devant mais ne la doublait jamais
  // (29-30 courses sur 30, l'arrivée = la grille). > 0 : collé derrière elle, il sort du sillage jusqu'à ce nombre de secondes avant le
  // freinage ; dans le sillage, il prend la vitesse de pointe que l'aspiration lui donne ; décalé, à 4,5 m d'elle, elle ne le retient plus
  // (le réflexe revient sous l'écart sûr) ; à l'intérieur, il rejoint sa propre corde au lieu de longer le bord ; elle ne se rabat pas sur
  // lui quand il est déjà à côté ; il ne la perd pas de vue à côté de lui. 0 : la course d'avant, au bit près
  IA_ATTAQUE_TETE: 1.5,   // (3 donnait trois fois plus de chocs dans le duel des stands, 1,5 garde l'essentiel des dépassements)
  IA_BATAILLE_PLONGER: 0,       // 1 : l'attaque se joue à l'intérieur ou pas du tout
  IA_PLUIE_LIGNE: 1,            // 1 : sur le mouillé, il connaît l'adhérence de la trajectoire (plus sèche) et du reste de la piste
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
  // ses techniques selon le virage (tour 33, ia.js typerVirages et techniquesPilote) : le type de chaque virage, puis pour chaque type le
  // point de corde (apex, m : > 0 = plus tard) et la place (interieur, m : > 0 = vers l'intérieur), × son goût pour la technique
  IA_TECHNIQUES_ACTIVES: true,
  IA_TECHNIQUES: {
    courbure: 1 / 150,          // la partie d'un virage qui tourne : plus serré que ça autour du sommet…
    portee: 150,                // m : … cherchée à ± ça au plus
    enchainement: 90,           // m : le virage suivant, de l'autre côté, à moins de ça : un enchaînement (S, chicane)
    droite: 300,                // m de ligne droite après lui : « avant une longue ligne droite »
    rayonRapide: 100,           // m : plus large que ça : un virage rapide (pas de technique, la carte telle quelle)
    rayonEpingle: 30,           // m : plus serré que ça : une épingle (court)
    longueurCourt: 50,          // m : plus court que ça : un virage court
    longueurLong: 120,          // m : plus long que ça : un long virage
    types: {                    // pour chaque type : { apex (m), interieur (m) }
      court: { apex: 2, interieur: 0 },          // entrer par l'extérieur, couper à la corde tard, ressortir large
      long: { apex: 0, interieur: 0.5 },         // rester près de l'intérieur
      enchainement: { apex: 0, interieur: 0.5 }, // le premier virage d'un S : le sacrifier (< 0, vers l'extérieur) coûtait du temps (tour 33 : test +0,3 s en légende) ; un peu plus à la corde, il en gagne
      avantDroite: { apex: 1, interieur: 0 },    // soigner la sortie : corde tardive
      moyen: { apex: 0, interieur: 0 },
      rapide: { apex: 0, interieur: 0 },
    },
  },
  // (tour 51f, ia.js techModifier : la technique selon la situation ; 0 = interrupteur coupé, la technique de toujours au bit près)
  IA_TECH_PLUIE: 1,             // 1 : sous la pluie, sa technique s'adoucit (selon l'eau sur la piste, 0 à 1) …
  IA_TECH_PLUIE_APEX: 0.3,      // … la corde tardive × (1 − ça × eau) …
  IA_TECH_PLUIE_COTE: 0.3,      // … sa place à l'intérieur × (1 − ça × eau) (les vibreurs mouillés) …
  IA_TECH_PLUIE_ENTREE: 0.4,      // m : … entrée plus large (vers l'extérieur, avant la corde) × eau …
  IA_TECH_PLUIE_FREIN: 0.98,    // … et il freine plus tôt : × ça
  IA_TECH_BATAILLE: 1,          // 1 : en bataille (une voiture à moins de IA_TECH_BATAILLE_DIST m devant ou derrière, à moins de IA_TECH_BATAILLE_LARGEUR m de côté) …
  IA_TECH_BATAILLE_DIST: 30,
  IA_TECH_BATAILLE_LARGEUR: 4,
  IA_TECH_DEFENSE_APEX: 0.5,    // … le défenseur (une voiture plus rapide derrière lui) : sa corde × (1 − ça) …
  IA_TECH_DEFENSE_COTE: 0.5,    // … et sa place à l'intérieur × (1 + ça) : il ferme la porte …
  IA_TECH_ATTAQUE_APEX: 0.5,    // … l'attaquant qui se prépare (derrière la voiture visée) : corde × (1 + ça) …
  IA_TECH_ATTAQUE_ENTREE: 1,    // m : … et entrée plus large (croisement : il ressort plus vite par l'extérieur)
  IA_STYLE_TECHNIQUE: [0.5, 1.5], // son goût pour la technique (× les décalages ci-dessus), tiré avec GRAINE_TECHNIQUE
  IA_VARIATION_APEX: 2,         // m : d'un tour à l'autre, le point de corde varie de ±2 m…
  IA_VARIATION_COTE: 0.4,       // m : … et sa place sur la piste de ±0,4 m
  IA_RYTHME: [0.94, 1],         // le rythme de chaque IA (part de la vitesse conseillée), tiré entre ces deux nombres
  // les niveaux de difficulté (étape 4d) : un niveau change tous les caractères ensemble, en gardant les écarts entre
  // pilotes : rythme ajouté au rythme tiré (jamais au-dessus de 1 : au-delà, il dépasserait l'adhérence de la carte,
  // donc les niveaux durs ne gagnent pas en rythme, ils font moins d'erreurs et attaquent plus), erreurs : le taux
  // multiplié, agressivite ajoutée (bornée entre 0 et 1), regularite multipliée
  // les divisions (CLAUDE.md « Les divisions (4, 3, 2, 1) », tour 49d ; choix du Chef, réversibles) : en carrière, la division donne le
  // niveau des IA (NIVEAUX) et la force de TOUTES les voitures, joueur compris (× PUISSANCE et FORCE_MOTEUR_MAX, × ADHERENCE : la
  // carte des IA est calculée avec, donc elles en profitent autant que le joueur). La division 3 = le jeu d'avant (une vieille
  // sauvegarde y est rangée sans rien perdre). DIVISIONS_ACTIVES false : la carrière comme avant (niveau normal, voitures de base)
  DIVISIONS_ACTIVES: true,
  DIVISIONS: {
    4: { niveau: 'debutant', puissance: 0.85, adherence: 0.98, argent: 0.6, garage: 0.6 },   // bots débutants, voitures lentes
    3: { niveau: 'normal', puissance: 1, adherence: 1, argent: 1, garage: 1 },           // bots moyens, voitures moyennes (le jeu d'avant)
    2: { niveau: 'expert', puissance: 1.07, adherence: 1.01, argent: 1.5, garage: 1.5 },     // bots forts, voitures fortes
    1: { niveau: 'legende', puissance: 1.14, adherence: 1.03, argent: 2.2, garage: 2.2 },    // bots légendaires, voitures surpuissantes
  },
  // (tour 49d-2) argent : × les gains d'un Grand Prix (place, meilleur tour, places gagnées, duel, le plafond) et les sponsors (montant
  // de la saison, primes des objectifs) ; garage : × les prix du garage ; arrondis à 100 € (× 1 en division 3 : les mêmes nombres)
  DIVISION_DEPART: 4,           // une carrière neuve commence ici
  DIVISION_VIEILLE: 3,          // une sauvegarde d'avant les divisions (le niveau normal, les voitures de base) est rangée ici
  DIVISION_MONTEE_PLACE: 3,     // on monte d'une division en finissant dans les DIVISION_MONTEE_PLACE premiers du championnat pilotes
  DIVISION_DESCENTE: false,     // on ne descend jamais (le jeu reste agréable pour un enfant)
  // (tour 50d) chaque division a son plateau (ses 10 écuries et ses 20 pilotes, divisions.js) ; choix du Codeur 4, réversibles.
  // DIVISION_PLATEAUX false : le joueur monte avec le même plateau, qui prend le niveau de la nouvelle division (le tour 49d)
  DIVISION_PLATEAUX: true,
  // à la montée, les rivaux classés dans les DIVISION_MONTEE_PLACE premiers montent aussi (ils prennent la place des plus faibles du
  // plateau d'en haut, qui descendent) ; false : le joueur monte seul
  DIVISION_MONTEE_RIVAUX: true,
  // les offres de contrat d'une division au-dessus : la note du joueur × ça (un promu est attendu dans le milieu ou le bas de grille)
  DIVISION_NOTE_MONTEE: 0.5,
  GRAINE_PLATEAUX: 21000,       // les pilotes d'un plateau neuf sont tirés avec la graine du championnat + ça + 101 × la division
  NIVEAU: 'normal',             // le niveau en cours (?niveau=…, principal.js) ; normal = les réglages tels quels
  NIVEAUX: {
    debutant: { rythme: -0.05, erreurs: 2, agressivite: -0.3, regularite: 1.5, gestionPneus: -0.2, bataille: 0, technique: 0.1 },
    normal: { rythme: 0, erreurs: 1, agressivite: 0, regularite: 1, gestionPneus: 0, technique: 0.28 },
    expert: { rythme: 0, erreurs: 0.5, agressivite: 0.2, regularite: 0.7, gestionPneus: 0.1, corde: 0.5, marge: -0.7, limite: 1.01, penaliteFrein: 0.5, precision: 0.6, bordMin: 0.8, margeCarte: 1.1, technique: 0.7 },
    legende: { rythme: 0, erreurs: 0.25, agressivite: 0.4, regularite: 0.5, gestionPneus: 0.2, corde: 0, marge: -1.4, limite: 1.02, penaliteFrein: 0, precision: 0.3, bordMin: 0.5, margeCarte: 0.7, technique: 1 },
  },
  // le caractère de chaque IA (étape 4d), tiré avec la graine entre ces bornes :
  IA_CARACTERE: {
    regularite: [0.002, 0.015], // d'un tour à l'autre, son rythme varie de ± cette part autour de sa moyenne, sans jamais dépasser le sien
    agressivite: [0, 1],        // 0 : prudent ; 1 : attaque plus tôt
    erreurs: [0.1, 1],          // erreurs par course de 5 tours
    consigneRefus: [0, 1],      // les consignes d'équipe : au-dessus de CONSIGNE_REFUS_SEUIL, il refuse de laisser passer le joueur (tiré à part, GRAINE_CONSIGNES)
    qualif: [0, 0],              // le niveau en qualifications (simulation.js, qualifier) : son temps de qualification × (1 + ça) ; tiré à part (GRAINE_QUALIF_TRAIT), le niveau n'y touche pas
    gestionPneus: [0, 1],       // la gestion des pneus (pneus.js : 1 = use 30 % moins vite) ; tirée avec sa propre graine (GRAINE_PNEUS), le niveau la décale
  },
  IA_VISION_ANGLE: 0.6,         // rad : elle voit les voitures devant elle à ±0,6 rad (±34°) de son axe…
  IA_VISION_DISTANCE: 120,      // m : … et à moins de cette distance
  IA_VISION_COULOIR: 4.5,       // m : … et aussi toute voiture devant elle à moins de ça de son axe (même tout près, sur le côté)
  IA_VISION_COTE: [8, 7],       // m : … et celles à côté d'elle (dans les rétroviseurs) : à moins de 8 m devant ou derrière, 7 m de côté

  // la qualification du joueur (qualification.js) : un tour lancé, seul
  QUALIF_LANCEMENT: 250,        // m avant la ligne : la voiture part de là, à l'arrêt ; le chrono part à la ligne
  // la grille de départ : deux files décalées
  GRILLE_ESPACEMENT: 8,         // m entre deux places qui se suivent (une file sur deux)
  GRILLE_ECART: 3,              // m : chaque file est à cette distance du milieu de la piste
  SIMULATION_MARGE_DEVANT: 6,   // m : une voiture est devant une autre à partir de cet écart (un dépassement compte quand ça change)
  SIMULATION_TEMPS_MAX: 150,    // s par tour : une course simulée s'arrête là, même si des voitures n'ont pas fini
  RADAR_RAYON: 150,             // m : le radar montre la piste et les voitures jusque-là autour du joueur
  // le fantôme du meilleur tour (fantome.js, étape 5) : le tour de qualification enregistré avec l'enregistreur
  FANTOME_PAS: 0.1,             // s entre deux images du fantôme (un nombre entier de pas de physique : 12) ; le rejeu interpole entre elles
  FANTOME_DECIMALES: 2,         // les positions et distances sont arrondies au cm dans la sauvegarde (compact)
  FANTOME_COULEUR: 0xdfe3ea,    // une couleur neutre, claire…
  FANTOME_OPACITE: 0.55,        // … et légèrement transparente (toute la voiture d'une seule couleur, sans ses pièces sombres : on le reconnaît comme un fantôme)
  FANTOME_PIXELS_MIN: 400,      // tests : au moins ce nombre de pixels changent dans la moitié basse de l'image quand le fantôme est caché (il est visible)
  // le défi du fantôme entre amis (defi.js, tour 49b) : un code à copier qui contient le tour (le fantôme), sans serveur
  DEFI_VERSION: 1,              // la version du code : un code d'une autre version est refusé proprement
  DEFI_LONGUEUR_MAX: 30000,     // caractères au plus (le plus long tracé tient dessous : test)
  DEFI_VITESSE_MAX: 120,        // m/s : entre deux images du tour, plus vite que ça est impossible (un code trafiqué)
  DEFI_DISTANCE_TOLERANCE: 0.05, // la distance du tour enregistré : la longueur du circuit à 5 % près
  DEFI_LISTE_MAX: 20,           // les défis reçus gardés dans la sauvegarde (le plus ancien part)
  DEFI_REFUS_DUREE: 8,          // s : un lien de défi abîmé, le message reste ce temps en haut de l'écran
  DEFI_CODES_MAX: 5,            // (le lien de défi, tour 50b) les derniers défis reçus gardent leur code (« Relever » depuis Messages)
  // le podium 3D (podium3d.js)
  PODIUM_DISTANCE: 30,          // m : à cette distance du bord gauche de la piste, en face de la ligne
  PODIUM_LARGEUR: 6.5,          // m : la largeur d'une marche…
  PODIUM_PROFONDEUR: 7,         // … sa profondeur
  PODIUM_HAUTEURS: [2.4, 1.6, 1], // m : la hauteur des marches du 1er, du 2e, du 3e
  PODIUM_COULEUR: 0xe9ebf0,
  PODIUM_COULEUR_SOL: 0x2a2f3a,
  PODIUM_COULEURS: [0xd4af37, 0xc0c4cc, 0xcd7f32],   // or, argent, bronze
  PODIUM_CAMERA: [26, 8],       // m : la caméra du podium, à cette distance et à cette hauteur…
  PODIUM_ROTATION: 0.25,        // … et elle se balance doucement de part et d'autre (rad/s de la phase)
  CLASSEMENT_PAS: 2,            // m : pour les écarts du classement, on note quand chaque voiture passe tous les 2 m
  GRAINE_STYLES: 1000,          // les façons de piloter sont tirées avec la graine de la course + ce nombre
  GRAINE_CARACTERE: 3000,       // … et le caractère des pilotes avec la graine + ce nombre
  // la forme du jour (tour 49c, parti du tour 47a) : après la qualification, le rythme de course de chaque IA × (1 − IA_FORME × (son tirage −
  // le plus petit tirage)) ; le pilote le plus en forme garde son rythme (une IA seule ne change pas). Le poleman n'est plus toujours le plus
  // rapide en course, comme en vraie F1. 0 = la course d'avant au bit près
  IA_FORME: 0.02,
  GRAINE_FORME: 17000,          // … tirée avec la graine de la course + ce nombre (les autres tirages ne bougent pas)
  GRAINE_QUALIF: 2000,          // … et la qualification avec la graine + ce nombre
  GRAINE_TECHNIQUE: 16000,      // … et son goût pour les techniques selon le virage (IA_STYLE_TECHNIQUE) avec la graine + ce nombre
  GRAINE_QUALIF_TRAIT: 15000,   // … et le niveau en qualifications de chaque IA (IA_CARACTERE.qualif) avec la graine + ce nombre
  GRAINE_PNEUS: 8000,           // … et la gestion des pneus de chaque IA avec la graine + ce nombre (à part : les autres tirages ne bougent pas)
  GRAINE_FEUX: 4000,            // … et le délai des feux et les réactions des IA avec la graine + ce nombre
  IA_QUALIF_HASARD: 0.005,      // le temps de qualification d'une IA varie de ±0,5 % autour de son meilleur tour estimé
  IA_PAGE_MAX: 20,              // ?ia=N : au plus ce nombre d'IA dans la page
  // ?ia=N : la couleur de chaque IA (provisoire : les écuries viendront à l'étape 6)
  COULEURS_IA: [0x1f6fe0, 0xd8262e, 0xf2c230, 0x2fa84f, 0xf07d1a, 0x8e44ad, 0x1abc9c, 0xecf0f1, 0x34495e, 0xe84393],
  // derrière une voiture plus lente (sans la dépasser, étape 4a) ; distances d'un centre de voiture à l'autre
  IA_DISTANCE_MIN: 8,           // m : jamais plus près
  // les consignes d'équipe (CLAUDE.md « Le duel contre le coéquipier », simulation.js majConsignes, Codeur 1) : au plus une par course ;
  // les deux pilotes d'une écurie à moins de CONSIGNE_DISTANCE m l'un de l'autre, celui de derrière plus rapide d'au moins CONSIGNE_RYTHME s
  // au tour (moyenne des CONSIGNE_TOURS derniers tours), personne entre eux ni à moins de CONSIGNE_DERRIERE m derrière (ça ne coûte rien),
  // pas au dernier tour ; celui de devant ralentit dans une droite (CONSIGNE_RALENTI m/s sous la vitesse de l'autre) ; CONSIGNE_DELAI s pour le faire
  CONSIGNES_ACTIVES: true,
  CONSIGNE_DISTANCE: 40,
  CONSIGNE_RYTHME: 0.4,
  CONSIGNE_TOURS: 2,
  CONSIGNE_DERRIERE: 150,
  CONSIGNE_RALENTI: 10,
  CONSIGNE_DELAI: 40,
  CONSIGNE_DELAI_IA: 75,        // s : entre deux IA (ou le coéquipier du joueur devant lui), le temps d'un tour au moins : il laisse passer dès qu'il le peut
  CONSIGNE_RECENT: 0.3,         // s : … et ses derniers tours pas plus lents que ceux de celui de devant de plus de ça
  CONSIGNE_LEVER: 0.4,          // celui de devant, tant qu'il ne voit pas l'autre dans ses rétroviseurs : dans les droites, il roule à (1 − ça) de sa vitesse
  CONSIGNE_DROITE: 150,         // m : celui de devant ne s'écarte que si la piste est droite sur ça devant lui…
  CONSIGNE_BORD: 2,             // m : … jusqu'à ça du bord, côté opposé à son coéquipier…
  CONSIGNE_RAMPE: 60,           // m : … en s'y décalant sur cette distance
  CONSIGNE_REFUS_SEUIL: 0.8,    // le coéquipier du joueur refuse si son trait consigneRefus est au moins à ça
  CONSIGNE_CONFIANCE: 5,        // le joueur suit la consigne : la confiance de l'écurie (la jauge « écurie ») monte de ça ; il l'ignore : elle baisse de ça
  CONSIGNE_PERIODE: 0.5,        // s : l'écurie regarde la course à ce rythme
  GRAINE_CONSIGNES: 13000,
  // la météo (étape 12, meteo.js ; tour 33) : par lieu, la chance qu'il pleuve au départ (pluie), celle d'un changement pendant la course
  // (change : une averse, ou la pluie qui s'arrête), l'intensité de la pluie ; un lieu absent (les circuits d'essai) : toujours sec
  METEO_LIEUX: {
    bahrayn: { pluie: 0.02, change: 0.03, intensite: [0.3, 0.6] }, melbourn: { pluie: 0.15, change: 0.2, intensite: [0.4, 0.8] },
    suzuko: { pluie: 0.25, change: 0.25, intensite: [0.4, 0.9] }, montreol: { pluie: 0.2, change: 0.25, intensite: [0.4, 0.9] },
    monoco: { pluie: 0.15, change: 0.2, intensite: [0.4, 0.8] }, barcelana: { pluie: 0.1, change: 0.15, intensite: [0.3, 0.7] },
    silverstoun: { pluie: 0.3, change: 0.3, intensite: [0.4, 0.9] }, spaa: { pluie: 0.4, change: 0.35, intensite: [0.5, 1] },
    monzo: { pluie: 0.15, change: 0.2, intensite: [0.4, 0.8] }, singapura: { pluie: 0.25, change: 0.35, intensite: [0.6, 1] },
    interlagas: { pluie: 0.35, change: 0.35, intensite: [0.5, 1] }, yasmarino: { pluie: 0.02, change: 0.03, intensite: [0.3, 0.6] },
  },
  METEO_ACTIVE: true,           // la météo dans les courses de la page (principal.js) ; faux : toujours sec
  METEO_VITESSE_MOYENNE: 50,    // m/s : pour estimer la durée d'une course (le moment d'un changement de temps)
  GRAINE_METEO: 14000,          // la météo d'une course : la graine du Grand Prix + ce nombre
  METEO_CHANGE_PART: [0.25, 0.7],   // un changement arrive entre ces parts de la durée estimée de la course
  METEO_RISQUE: 30,             // % : à partir de ça, la prévision dit « risque de pluie » (en dessous, « nuageux » ; 0 : « sec »)
  METEO_EAU_DEPART: 0.7,        // l'eau sur la piste quand il pleut déjà au départ
  METEO_MONTEE: 0.02,           // par seconde, sous une pluie d'intensité 1 (50 s pour une piste détrempée)
  METEO_BAISSE: 0.006,          // par seconde, sans pluie (près de 3 minutes pour sécher)
  METEO_SECHE_LIGNE: 0.01,      // par seconde sans pluie : la trajectoire sèche plus vite (jusqu'à 1)…
  METEO_LIGNE_SECHE: 0.6,       // … jusqu'à ça d'eau en moins sur elle…
  METEO_LIGNE: 2.5,             // m : … à moins de ça de la ligne idéale de la carte
  METEO_GERBE: 0.6,             // la gerbe d'eau : l'aspiration × (1 − ça × l'eau)
  METEO_ANTICIPE: 0.15,
  METEO_ARRET_TOURS: 2,
  METEO_COURSES_DIFFERENTES: 15,  // tests/meteo.html : sur 30 courses avec une averse, l'ordre d'arrivée diffère du sec dans au moins ce nombre (la moitié ; 20 au premier essai, jamais passé : 17)         // une IA ne change de pneus qu'au moins ce nombre de tours après son arrêt précédent         // le choix des pneus regarde ça d'eau en plus (sous la pluie) ou en moins (sans elle), × (0,5 + prudence)
  // les pneus selon l'eau, aux niveaux 0 ; 0,5 ; 1 : l'adhérence (le slick au sec = 1, la voiture d'aujourd'hui) et l'usure (× l'usure normale)
  METEO_PNEUS: {
    slick: { adherence: [1, 0.72, 0.5], usure: [1, 1, 1] },
    drift: { adherence: [1, 0.65, 0.45], usure: [1, 1, 1] },   // le drift (sec seulement) : sur le mouillé, pire que le slick
    inter: { adherence: [0.95, 0.88, 0.7], usure: [2.5, 1, 1] },
    pluie: { adherence: [0.9, 0.84, 0.8], usure: [4, 1.5, 1] },
  },
  IA_LENT_COTE_A_COTE: 0,       // le duel (tour 32) : 1 = dans un virage lent aussi, l'attaque se joue à l'entrée (à moitié à hauteur, IA_ATTAQUE_HAUTEUR), plus le nez devant au freinage
  SIMULATION_FEUX: 0,           // 1 : simulerCourse part avec les feux et le départ de chaque IA (depart.js), comme la page
  IA_PROFITER_ERREUR: false,    // une IA profite de l'erreur de la voiture devant elle (elle la passe comme une voiture lente)
  IA_FREIN_PREVU: 0.7,          // s : derrière une voiture qui freine, il prévoit sa vitesse dans ce temps (sa décélération vue × ça)
  IA_DISTANCE_SUIVI: 14,        // m : la distance où elle se cale derrière
  IA_DEPART_LANCEMENT: 100,     // m : au départ, sur cette distance, elle suit à IA_DISTANCE_MIN (tout le monde part ensemble)
  IA_GAIN_DISTANCE: 1,          // m/s de vitesse en plus par m d'écart en trop, près d'elle…
  IA_GAIN_DISTANCE_LOIN: 1.5,   // … et loin d'elle (au-delà de deux fois la distance de suivi)

  // le dessin du circuit
  LARGEUR_BORD: 0.35,           // la ligne blanche de chaque bord
  LARGEUR_VIBREUR: 1.4,
  LONGUEUR_BANDE_VIBREUR: 3,    // une bande rouge, une bande blanche
  SEUIL_COURBURE_VIBREUR: 1 / 150,   // des vibreurs là où le rayon du virage est sous 150 m
  DISTANCE_BARRIERE: 14,        // du bord de la piste à la barrière
  // la voie des stands (étape 7, circuits.js : circuit.stands, calculée depuis les morceaux ; la physique ne s'en sert que
  // derrière PNEUS_ACTIFS) : une voie parallèle à la ligne droite de départ, du côté opposé à la trajectoire (le côté du
  // premier virage), entre le bord de la piste et la barrière, séparée de la piste par un muret sauf à l'entrée et à la sortie
  STAND_MUR: 1.5,               // m au-delà du bord de la piste : le muret entre la piste et la voie
  STAND_LARGEUR: 7,             // m : la largeur de la voie, au-delà du muret
  STAND_RAMPE: 60,              // m : l'entrée et la sortie, où la voie est ouverte sur la piste (pas de muret)
  // le panneau « 80 » et la ligne de la voie des stands (scene3d.js, tour 45b2) : le dessin seulement
  PANNEAU_STANDS_RECUL: 25,      // m avant l'entrée de la voie (avant sa rampe)…
  PANNEAU_STANDS_ECART: 1.5,     // … à tant de m au-delà du bord extérieur de la voie
  PANNEAU_STANDS_HAUTEUR: 2.4,   // m : le centre du panneau
  PANNEAU_STANDS_TAILLE: 1.8,    // m : son diamètre
  PANNEAU_STANDS_LIGNE: 4,       // m après l'entrée : la ligne peinte en travers de la voie…
  PANNEAU_STANDS_LIGNE_LARGEUR: 0.5,   // … et sa largeur
  STAND_ENTREE_MAX: 300,        // m avant la ligne, au plus, où la voie commence (dans la dernière ligne droite)…
  STAND_SORTIE_MAX: 250,        // m après la ligne, au plus, où elle rejoint la piste (dans la première ligne droite)
  STAND_MARGE_DROITE: 60,       // m : la voie s'arrête au moins à ça de la fin d'une ligne droite
  STAND_APRES_LIGNE: 20,        // m : si la dernière droite est trop courte (ou un virage ramène sur la ligne), la voie commence là, après la ligne
  STAND_LONGUEUR_MIN: 150,      // m : en dessous, pas de voie des stands sur ce circuit (test)
  STAND_ARRET_DEMI: 20,         // m : la zone d'arrêt, de part et d'autre de circuit.stands.arret (la ligne si la voie la traverse, sinon le milieu de la voie)
  STAND_VITESSE_MAX: 80 / 3.6,  // m/s : la limite dans la voie ; la physique y ramène la voiture qui la dépasse…
  STAND_PENALITE_VITESSE: 0,    // s : … et ça coûte ça, une fois par passage (tour 45a, décision du Chef : 0, le limiteur suffit ; 5 avant)
  STAND_LIMITEUR: 15,           // m/s² : le limiteur du joueur, dès la rampe d'entrée (ralentit en douceur jusqu'à STAND_VITESSE_MAX ; 0 : le saut d'avant)
  // l'arrêt au stand (étape 7, tour 26 ordre 3 ; derrière PNEUS_ACTIFS) : la durée de l'arrêt, le gain des changeurs de roues et la
  // pénalité sans arrêt (30 s, en course de 12 et 18 tours) sont dans REGLAGES_PNEUS (pneus-donnees.js : ARRET_DUREE_BASE, CHANGEURS_GAIN_*,
  // PENALITE_SANS_ARRET, TOURS_ARRET_OBLIGATOIRE), testés seuls par tests/pneus.html
  STAND_VITESSE_ARRET: 3,       // m/s : une voiture dans la zone d'arrêt sous cette vitesse s'arrête (pneus neufs après la durée de l'arrêt)
  STAND_CHANGEURS_IA: 0,        // le niveau des changeurs de roues des IA (le joueur : celui de son garage, v.changeurs)
  STAND_VITESSE_VISEE: 76 / 3.6,  // m/s : la vitesse que vise une IA dans la voie (sous la limite STAND_VITESSE_MAX)
  STAND_APPROCHE: 350,          // m avant l'entrée : l'IA qui va s'arrêter passe en mode « stands » (ni attaque ni erreur)…
  STAND_RANGER: [160, 40],      // m avant l'entrée : … elle se range de ce côté de la piste entre ces deux points…
  STAND_DECEL: 12,              // m/s² : … et freine jusqu'à STAND_VITESSE_VISEE avant l'entrée
  STAND_DECEL_ARRET: 4,         // m/s² : elle ralentit ainsi jusqu'à sa place d'arrêt…
  STAND_VITESSE_APPROCHE: 2.5,  // m/s : … où elle arrive au pas
  STAND_BORD: 2,                // m : avant l'entrée et après la sortie, elle roule à ça du bord de la piste, côté voie
  STAND_REJOINDRE: 200,         // m après la sortie : elle rejoint sa ligne (ensuite, elle décide comme d'habitude)
  // à la sortie : une voiture de la piste qui arrive derrière (à moins de STAND_CEDER_DISTANCE m, plus vite de STAND_CEDER_VITESSE m/s, à moins de
  // STAND_CEDER_COTE m du bord côté voie) : l'IA reste dans la voie et la laisse passer (dès STAND_CEDER_AVANT m avant la rampe de sortie)
  STAND_CEDER_DISTANCE: 150,
  STAND_CEDER_VITESSE: 3,
  STAND_CEDER_COTE: 5,
  STAND_CEDER_AVANT: 30,
  // la stratégie des IA : un seul arrêt, au tour round(nbTours × part), part = STAND_PART + STAND_PART_GESTION × (gestionPneus − 0,5)
  // + STAND_PART_HASARD × (2 hasard − 1) (le meilleur gestionnaire roule plus longtemps sur ses premiers pneus), entre le tour
  // STAND_TOUR_MIN et l'avant-dernier tour moins un (jamais au dernier) ; deux pilotes de la même écurie (2 par écurie, dans l'ordre) pas au même tour
  STAND_PART: 0.5,
  STAND_PART_GESTION: 0.2,
  STAND_PART_HASARD: 0.15,
  STAND_TOUR_MIN: 2,
  GRAINE_STANDS: 9000,          // la stratégie est tirée avec la graine de la course + ce nombre (à part : les autres tirages ne bougent pas)
  STAND_TOUR_CONSEILLE: 0.5,    // le joueur : « Arrêt au stand : tour X conseillé », X = round(nbTours × ça)
  // le critère de l'étape 7 (« l'arrêt change vraiment le classement », tests/stands.html) : sur 30 courses de 12 tours, l'ordre
  // d'arrivée diffère de celui de la même course sans pneus dans au moins ce nombre de courses
  STAND_COURSES_DIFFERENTES: 20,
  COULEUR_STANDS: 0x5a5a5a,     // la voie en 3D
  COULEUR_MUR_STANDS: 0xdddddd, // le muret
  HAUTEUR_MUR_STANDS: 0.8,
  HAUTEUR_BARRIERE: 1.1,
  TAILLE_SOL: 4000,             // le carré d'herbe sous le circuit
  CASES_DAMIER: 12,             // cases de la ligne d'arrivée, en travers de la piste
  PROFONDEUR_DAMIER: 2,
  LARGEUR_REPERE_SECTEUR: 0.6,

  COULEUR_CIEL: 0x87c5ea,
  COULEUR_SOL: 0x4f7d3a,
  SOL_RECUL_PROFONDEUR: 8,      // scene3d.js : l'herbe est repoussée de ce facteur dans le tampon de profondeur (polygonOffset), la route passe toujours devant
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
  // la minicarte (minicarte.js) : la marge et le trait du tracé, la taille des points (pixels)
  MINICARTE_MARGE: 10, MINICARTE_TRAIT: 4, MINICARTE_POINT: 3,
  // les messages de course (messages.js) : chacun reste MESSAGES_DUREE s ; la file en garde au plus MESSAGES_FILE_MAX
  MESSAGES_DUREE: 3, MESSAGES_FILE_MAX: 4,
  // le commentateur (commentaire.js, CLAUDE.md « Le commentateur ») : ses phrases passent dans le bandeau des messages de course
  COMMENTAIRE_DECOUVERTE_MODE: 'joueur', // (tour 52f, décision du propriétaire) pendant la course de découverte seulement, un commentateur réglé sur 'tout' ne parle que du joueur ('joueur' ; '' = le réglage du joueur, comme avant) ; la voix (synthèse et voix-sons) aussi ; dès la carrière, le réglage sauvegardé revient
  COMMENTAIRE_MODE: 'tout',       // 'tout', 'joueur' (seulement les faits du joueur, et l'arrivée) ou 'non' (coupé)
  COMMENTAIRE_INTERVALLE: 2.5,    // s : au plus une phrase tous les tant (tour 45c, le propriétaire 2026-11-02 : « presque en tout temps » ; c'était 5)
  COMMENTAIRE_LONGUEUR_MAX: 60,   // caractères d'une phrase au plus (les noms comptés à 7 lettres) : court, pour ne pas lire en pilotant
  COMMENTAIRE_PEREMPTION: 8,      // s : un fait plus vieux n'est plus dit
  COMMENTAIRE_FILE_MAX: 6,
  COMMENTAIRE_PRIORITES: { arrivee: 10, podium: 9, arret: 6, depart: 9, depassementTete: 9, dernierTour: 8, joueurArrivee: 8, contact: 7, depassementJoueur: 6, pluie: 6, coteACote: 5, erreur: 5, penalite: 5, depassement: 4, stands: 3, meilleurTour: 3, joueurTete: 2, joueurPlace: 2, glissade: 6,
    combleTete: 0, combleBagarre: 0, combleTours: 0, combleJoueur: 0, combleMeteo: 0, combleSec: 0, combleChamp: 0, combleChampTete: 0, combleChampProjection: 0 },   // (tour 45c : ce qu'il dit entre deux faits, jamais devant un fait)
  COMMENTAIRE_BONUS_JOUEUR: 2,    // un fait du joueur passe devant (plus de phrases quand le joueur est concerné)
  COMMENTAIRE_GLISSADE_INTERVALLE: 60,   // s : une glissade rattrapée du joueur n'est redite qu'après ça (tour 43)
  COMMENTAIRE_PLACE_MAX: 10,      // les dépassements, erreurs et côte à côte des voitures plus loin ne sont pas commentés (sauf le joueur)
  COMMENTAIRE_REPETITION: 15,     // s : un contact ou un côte à côte entre les deux mêmes voitures n'est redit qu'après ça
  COMMENTAIRE_CONTACT_DISTANCE: 8, // m
  COMMENTAIRE_COTE: [4, 1.6, 0.8], // m le long, m en travers, s : deux voitures côte à côte
  COMMENTAIRE_JOUEUR_PERIODE: 25, // s : la place du joueur, de temps en temps
  COMMENTAIRE_ARRET_VITESSE: 2, COMMENTAIRE_ARRET_DUREE: 4,   // m/s, s : une voiture arrêtée en piste
  COMMENTAIRE_VIRAGE_COURBURE: 1 / 60,  // le joueur dans un virage plus serré (rayon < 60 m) : le commentateur attend…
  COMMENTAIRE_VIRAGE_ATTENTE: 1.5,      // … les premières secondes du virage
  // (tour 45c, le propriétaire 2026-11-02) il comble les silences : entre deux faits, une phrase sur ce que la course montre déjà, à tour de rôle
  COMMENTAIRE_COMBLE: ['combleTete', 'combleBagarre', 'combleTours', 'combleJoueur', 'combleChampionnat', 'combleMeteo'],   // (combleChampionnat : en carrière seulement, tour 45c2)
  COMMENTAIRE_COMBLE_APRES_DEPART: 2,   // s après le départ avant de combler
  COMMENTAIRE_IMPORTANT: 7,       // la priorité à partir de laquelle une phrase passe devant les autres à la voix (dépassement du joueur, erreur, arrivée…)
  VOIX_VOLUME: 0.7,               // la voix, sous le moteur : × le volume du commentateur (son.js)
  VOIX_SONS: false,               // (tour 51c) les voix enregistrées (voix-sons.js, sons/voix/) : éteintes par défaut, ?voixsons=1 ou ⚙ Réglages les allument ; provisoires
  VOIX_SONS_VOLUME: 0.9,          // leur volume, × le volume du commentateur (son.js)
  VOIX_DEBIT: 1.1,                // la vitesse de la voix
  GRAINE_COMMENTAIRE: 15000,      // sa suite de hasard à lui (ALEATOIRE.suite) : la course ne change pas
  MESSAGES_PLUIE_SEUIL: 0.15, MESSAGES_SECHE_SEUIL: 0.15,   // la météo : « La pluie arrive » au-dessus de ce qui tombe, « La piste sèche » sous cette eau
  // le dessin de la météo (meteo3d.js ; l'état vient de meteo.js) : la pluie autour de la caméra, les gerbes, la piste mouillée, le ciel couvert
  PLUIE_GOUTTES: 2400, PLUIE_BOITE: [45, 30], PLUIE_VITESSE: 22, PLUIE_LONGUEUR: 0.9, PLUIE_VENT: 0.12,   // m, m/s
  PLUIE_COULEUR: 0xc8d4e4, PLUIE_OPACITE: 0.55,
  GERBE_COULEUR: 0xe6ecf2, GERBE_OPACITE: 0.26, GERBE_CAMERA_MIN: 12, GERBE_VITESSE_MIN: 8, GERBE_VITESSE_PLEINE: 70, GERBE_RECUL: 3.4, GERBE_HAUTEUR: 0.7, GERBE_TAILLE: [3.2, 1.1, 1.3],
  COULEUR_ROUTE_MOUILLEE: 0x24262b, ROUTE_MOUILLEE_REFLET: 0.35, ROUTE_MOUILLEE_BRILLANCE: 40,
  CIEL_COUVERT: 0x9aa2ab, CIEL_COUVERT_COUPOLE: 0x8e959d, CIEL_COUVERT_PART: 0.85, CIEL_COUVERT_CLARTE: 1.4, CIEL_COUVERT_AMBIANCE: 0.25, CIEL_COUVERT_SOLEIL: 0.6,
  METEO_ICONE_PLUIE: 0.1, METEO_ICONE_NUAGES: 0.3, GOUTTES_OPACITE: 1.2,
  CIEL_VOILE: 0.15,             // un ciel voilé jusque-là, sans pluie ni eau : c'est le sec (rien n'est dessiné)
  LIGNE_SECHE_LARGEUR: 3, LIGNE_SECHE_HAUTEUR: 0.025, LIGNE_SECHE_ECART: 0.05,   // la trajectoire plus sèche : sa largeur (m), quand on la montre
  // le décor (étape 10, decor.js) : les briques, faites par le code, un InstancedMesh par type ; leur placement vient de DECORS (plus bas)
  DECOR_ACTIF: true,
  DECOR_GRAINE: 4242,           // le hasard du décor, à part (il ne tire jamais dans hasard() : la course ne change pas)
  DECOR_MARGE: 8,               // m au-delà du bord de la piste : aucun objet du décor plus près, sur tout le tracé (test)
  DECOR_CASE: 100,               // m : la grille qui range les échantillons de la piste pour vérifier une place (plus grand que demi-largeur + marge + l'objet le plus large)        // m au-delà de la voie des stands
  DECOR_MARGE_TELE: 10,         // m autour d'un poste de caméra télé (rien ne cache ce qu'il filme)
  DECOR_PODIUM_RAYON: 16,       // m : la place du podium (podium3d.js), en face de la ligne, reste libre
  DECOR_DETAIL_LOIN: 180,       // m : au-delà, le public et les arbres passent à leur forme simple… (tour 35 : 250 → 180, la mesure des images par seconde)
  DECOR_PUBLIC_DETAIL: 0.6,     // part de la distance de détail pour le public : au-delà (108 m), un spectateur est une plaque (tour 50c : il fait moins de 10 pixels de haut ; 1 = comme les arbres)
  DECOR_RIEN_LOIN: 1600,        // m : … et au-delà, ils ne sont plus dessinés
  DECOR_MAJ_DEPLACEMENT: 20,    // m : le tri proche / loin est refait quand une caméra a bougé de ça (tour 35 : 10 → 20)
  DECOR_APPELS_MAX: 26,
  DECOR_APPELS_TOTAL_MAX: 80,   // appels de dessin de toute l'image au plus, avec 20 voitures et le décor (tests/ecrans.py ; mesure du tour 31 dans SUIVI.md)         // appels de dessin du décor au plus (tests/ecrans.py : un par type et par niveau de détail)
  DECOR_PUBLIC_REMPLI: 0.85,    // la part des places occupées dans les tribunes
  TRIBUNE_MODULE: 12,           // m : une tribune est faite de modules de cette longueur, qui suivent la piste
  TRIBUNE_RANGS: 6,
  TRIBUNE_MARCHE: [0.8, 0.45],  // m : la profondeur d'un rang de gradin et sa hauteur (en vrai : ~0,8 m et ~0,4 m)
  TRIBUNE_TOIT: 3,              // m au-dessus de la dernière marche
  PUBLIC_HAUTEUR_ASSIS: 1.25,   // m : un spectateur assis dans une tribune…
  PUBLIC_HAUTEUR_DEBOUT: 1.7,   // m : … et debout (une F1 fait ~1 m de haut et 5,5 m de long)
  PUBLIC_HAUTEUR_ECART: 0.1,    // m : de plus ou de moins, tiré pour chacun
  PUBLIC_PAS: 1.2,               // m entre deux spectateurs
  PUBLIC_RANGS: 3,              // le public debout : ses rangs…
  PUBLIC_RANG: 0.9,             // … à ça l'un de l'autre
  STANDS_MODULE: 14, STANDS_PROFONDEUR: 16, STANDS_HAUTEUR: 7,   // m : le bâtiment des stands
  STANDS_GARAGE: 8, STANDS_GARAGE_HAUTEUR: 4.2,                 // m : la porte du garage de chaque écurie, à ses couleurs
  ARBRE_TAILLE: [0.8, 1.4],     // l'échelle d'un arbre, tirée entre ces deux nombres
  ARBRE_RAYON: 3,               // m : l'emprise d'un arbre à l'échelle 1
  PANNEAU_PAS: 10, PANNEAU_LONGUEUR: 8, PANNEAU_HAUTEUR: 1.2,  // m : les panneaux le long de la barrière (des couleurs, aucun logo)
  PNEUS_PILE_PAS: 0.7, PNEUS_PILE_RAYON: 0.33, PNEUS_PILE_HAUTEUR: 0.26, PNEUS_PILE_NOMBRE: 3,   // les piles de pneus
  PNEUS_PILE_REPERE: 5,         // une pile sur 5 a la couleur repère
  DECOR_COULEUR_PNEU: 0x1c1c1f, DECOR_COULEUR_PNEU_REPERE: 0xd8262e,
  DECOR_COULEURS_PANNEAUX: [0xf2f2f2, 0x1f4fa0, 0xf2c230, 0xd8262e, 0x2fa84f],
  DECOR_COULEURS_PUBLIC: [0xffffff, 0x222222, 0x3b6fd8, 0xe0e0e0, 0x8a5a3a],
  DECOR_COULEURS: { gradinA: 0xb9bec7, gradinB: 0x9aa1ad, mur: 0x6d7480, toit: 0xf2f2f2, tete: 0xe8c4a0, batiment: 0xdfe3ea, vitres: 0x3a5a7a,
    tronc: 0x6b4a2b, sapin: 0x2e5e2a, feuillu: 0x3f7a2e, fenetres: 0x5a6a7c, toitImmeuble: 0x8a8d92, pont: 0xc9b48a, cabine: 0xf4f6f8,
    roue: 0xe8eaee, cabineRoue: 0x3a7bd5, resille: 0xd8dde5, lampe: 0xfff6d8, eau: 0x2f6f9a, dune: 0xd8b27a, colline: 0x6f8f55 },
  // les briques des 12 décors (decors-officiels.js, Codeur 3 ; decor.js les place et les dessine)
  DECOR_EMPRISE_MAX: 80,        // m : l'emprise du plus grand objet (la grille des places prises regarde jusque-là)
  ARBRE_SURFACE: 260,           // m² par arbre dans une zone d'arbres de densité 1…
  ARBRES_ZONE_MAX: 450,         // … et au plus ça d'arbres par zone
  IMMEUBLE_HAUTEUR: [12, 34], IMMEUBLE_LARGEUR: [12, 22], IMMEUBLE_PROFONDEUR: [12, 20], IMMEUBLE_RANG: 24, IMMEUBLE_JOINT: 0.94,   // m
  IMMEUBLE_BANDES: 4,           // les bandes de fenêtres d'un immeuble
  IMMEUBLE_PENTE_COLLINE: 0.25, // m de plus par m au loin : la ville en gradins sur la colline (Monoco)
  IMMEUBLE_COULEURS: [0xe9e4da, 0xd9d2c4, 0xc8cdd3, 0xf0ead8, 0xbfc4c9, 0xe2d6c0],
  DECOR_FACADES: { monoco: true }, // les façades le long des rues, tout contre les rails
  FACADE_RETRAIT: 2, FACADE_HAUTEUR: [12, 24], FACADE_LARGEUR: [9, 15], FACADE_PROFONDEUR: [10, 14],   // m
  FACADE_COULEURS: [0xe8c9a0, 0xf0d9b5, 0xe3b79a, 0xf2e6cf, 0xd99f7e, 0xf3e1a6, 0xe7cfc5],   // les couleurs de la Riviera
  EAU_CASE: 20, EAU_HAUTEUR: 0.05,   // m : une dalle d'eau, à peine au-dessus du sol
  PORT_BANDE: 60,               // m : les bateaux sont amarrés dans les premiers mètres du port…
  PORT_DENSITE: 0.55,           // … sur cette part des dalles
  BATEAU_LONGUEUR: [10, 38], BATEAU_TRAVERS: 0.6,   // m ; la part des bateaux amarrés de travers (la poupe au quai)
  BATEAU_COULEURS: [0xffffff, 0xf4f4f0, 0xeef2f6, 0x1f2a44, 0xd8d0c0],
  CHAMP_CASE: 40, CHAMP_HAUTEUR: 0.03, CHAMP_COULEURS: [0x7fa04a, 0x9cab4e, 0xb8ad5c, 0x6f9a45, 0x8fb35a],
  COLLINE_SURFACE: 9000, DUNE_SURFACE: 2500, COLLINES_ZONE_MAX: 120,   // m² par colline (ou dune) à densité 1, et au plus par zone
  COLLINE_RAYON: [30, 70], COLLINE_PENTE: [0.25, 0.5], DUNE_RAYON: [12, 32], DUNE_PENTE: [0.15, 0.3],
  GRANDE_ROUE_RAYON: 28, GRANDE_ROUE_EMPRISE: 32, HOTEL_LONGUEUR: 110, HOTEL_EMPRISE: 57,   // m
  HOTEL_TRAVERS: 14, DECOR_MARGE_HOTEL: 4,   // m : la demi-largeur de l'hôtel en travers de la piste ; son recul dans sa zone
  STANDS_LONGUEUR_MIN: 100,     // m : un bâtiment des stands plus court longe toute la voie (rampes comprises)
  TRIBUNE_PROFONDEUR_REF: 12, TRIBUNE_ECHELLE: [0.7, 1.6],   // m : une tribune de 12 m de profondeur garde ses marches ; l'échelle bornée
  TRIBUNE_ECHELLE_LIEU: { monoco: 0.75, silverstoun: 1.2, monzo: 1.1, spaa: 0.9, suzuko: 1.05, interlagas: 1.15, montreol: 0.95, melbourn: 1, barcelana: 1.1, bahrayn: 1.3, singapura: 0.9, yasmarino: 1.25 },
  PROJECTEUR_PAS: 70, PROJECTEUR_HAUTEUR: 22, PROJECTEUR_RECUL: 3,   // m : les mâts d'éclairage la nuit (des deux côtés en alternance)
  BANDEROLE_PAS: 22, BANDEROLE_LONGUEUR: 12, BANDEROLE_HAUTEUR: 1.2, BANDEROLE_HAUTEUR_PLAQUE: 1.5,   // m : les banderoles du domicile, sur la barrière
  PNEUS_VIRAGE_LONGUEUR: 70,    // m de piles de pneus devant la barrière, au virage de chaque tribune
  PUBLIC_RANGS_MAX: 5,          // le public debout : au plus ces rangs
  PANNEAUX_LIGNE: 220,          // m : des panneaux le long de la ligne droite des stands, de part et d'autre de la ligne
  HORIZON_RECUL: 600, HORIZON_PROFONDEUR: 500, HORIZON_NOMBRE: 70,   // le paysage au loin : un anneau d'objets au-delà du circuit
  HORIZON_COLLINE_RAYON: [180, 380], HORIZON_VILLE: [20, 60], HORIZON_TOURS: [80, 260],
  CIEL_RAYON: 6500,             // m : la coupole du ciel (dans CAMERA_LOIN)
  NUAGES_MAX: 40, NUAGES_ETENDUE: 3500, NUAGES_HAUTEUR: [450, 800], NUAGES_OPACITE: 0.85, NUAGES_NUIT: 0.25,   // (la nuit, leur clarté × ça)
  // la lumière d'un lieu (scene3d.js, avec decors-officiels.js) : l'ambiance (hémisphère) et, la nuit, la lumière des projecteurs
  LIEU_AMBIANCE: 0.65, LIEU_PROJECTEURS: 0.9,
  // la nuit (Singapura) ; le soir (Bahrayn au crépuscule, Yas Marino au couchant) en prend la part NUIT_SOIR
  NUIT_AMBIANCE: 0.22, NUIT_PROJECTEURS: 0.42, NUIT_BROUILLARD: [140, 950], NUIT_SOIR: 0.45,
  FENETRES_NUIT: 0xffc870,       // les fenêtres allumées des immeubles (couleur émissive)
  NUIT_CIEL_MAX: 60,             // tests/ecrans.py : la nuit, la luminosité moyenne (0–255) du haut de l'image (le ciel) reste en dessous…
  NUIT_IMAGE_MAX: 70,            // … et celle de toute l'image aussi ; le jour (Monzo), toute l'image est au-dessus de JOUR_IMAGE_MIN
  JOUR_IMAGE_MIN: 100,
  VOITURE_LOIN: 45,             // m : au-delà (pour un champ de vision de VOITURE_LOIN_CHAMP degrés ; plus loin quand la caméra zoome),
  VOITURE_LOIN_CHAMP: 55,       //     une voiture est dessinée en forme simple, toutes en un seul appel de dessin (scene3d.js)
  VOITURES_LOINTAINES_MAX: 32,
  VOITURES_DETAILLEES_MAX: 8,   // … et au plus ces voitures détaillées (les plus proches), les autres en forme simple
  // le pont de Suzuko (le seul croisement, scene3d.js et decor.js ; l'affichage seulement, la physique reste plate)
  PONT_ACTIF: true,             // le pont de Suzuko (tour 34) : la route, le talus, le tablier, la voiture et la caméra qui montent ; faux : tout à plat
  PONT_HAUTEUR: 7.5, PONT_PLAT: 40, PONT_RAMPE: 200, PONT_OUVERTURE: 34, PONT_EPAISSEUR: 1.2,   // m
  COULEUR_PONT: 0xb8bcc2, COULEUR_TALUS: 0x5d7a45, COULEUR_TERRE_PLEIN: 0x5f8a42,
  LIEU_CHAMP: 50,               // tests/lieu.html : le champ de vision de la vue d'un décor (degrés)
  LIEU_APPELS_MAX: 90,          // appels de dessin au plus sur un circuit officiel décoré avec 20 voitures (tests/ecrans.py)
  PNEUS_PERTE_AFFICHEE: 0.001, // ?pneus=1 : la perte d'adhérence n'est écrite qu'à partir de 0,1 %
  // avant les feux : la grille vue d'en haut (camera.js poseGrille ; principal.js), quelques secondes, passable d'une touche ou d'un
  // clic ; jamais à deux ni au tournoi ; GRILLE_DECOUVERTE : aussi à la course de découverte (le clic aux feux : au plus +3 s)
  GRILLE_DUREE: 2.5,            // s
  GRILLE_HAUTEUR: 38, GRILLE_RECUL: 18, GRILLE_VISEE: 10, GRILLE_CHAMP: 55,   // m, m, m, degrés
  GRILLE_TRIBUNE_DUREE: 3, GRILLE_TRIBUNE_RECUL: 14, GRILLE_TRIBUNE_HAUTEUR: 4, GRILLE_TRIBUNE_VISEE: 3, GRILLE_TRIBUNE_VISEE_Y: 3,   // au Grand Prix à domicile : d'abord la tribune des supporters (s, m)
  GRILLE_DECOUVERTE: false,    // (décision du Chef, 2026-10-26 : « En piste en 10 secondes » passe avant ; au premier lancement, on roule tout de suite)
  // le résumé vidéo de la course (resume.js, étape 13) : la durée totale des moments forts rejoués, et la vitesse du rejeu
  RESUME_DUREE_MAX: 45,         // s de course au plus
  RESUME_VITESSE: 1,            // le rejeu à la vitesse de la course
  // le volant en vue cockpit (voiture3d.js creerVolant, CLAUDE.md « Le casque du pilote ») : fait par le code, accroché à la caméra,
  // en bas de l'image ; il tourne avec les roues avant × VOLANT_FACTEUR ; jamais dans la moitié haute de l'image (VOLANT_MARGE_HAUT :
  // son plus haut point reste au moins à cette part de la demi-hauteur sous le milieu)
  VOLANT_FACTEUR: 4,            // l'angle du volant = l'angle des roues avant × ce nombre
  VOLANT_DISTANCE: 0.5,         // m devant l'œil
  VOLANT_RAYON: 0.13,           // m
  VOLANT_DEPASSE: 0.62,         // la part du rayon au-dessus du bas de l'image (le reste est coupé par le bord)
  VOLANT_MARGE_HAUT: 0.25,
  VOLANT_COULEUR: 0x1b1d22, VOLANT_ECRAN: 0x0b1a10,
  TELE_ESPACEMENT: 250,         // une caméra télé tous les 250 m le long de la piste
  TELE_RECUL: 8,                // à cette distance derrière la barrière (m)
  TELE_HAUTEUR: 7,
  TELE_CADRAGE: 9,
  // la réalisation télé (regie.js, CLAUDE.md « La réalisation télé ») : de vrais postes au bord de la piste, la régie, l'hélicoptère
  TELE_POSTE_HAUTEUR: 12, TELE_POSTE_RECUL: 6,   // m : la caméra sur son mât, derrière la barrière
  TELE_POSTE_ECART_MIN: 70,     // m : deux postes au moins à ça l'un de l'autre
  TELE_SORTIE_STANDS: 40,       // m après la sortie des stands
  TELE_DROITE_MIN: 300, TELE_DROITE_PAS: 260,   // m : des postes le long des lignes droites plus longues que ça, tous les tant
  TELE_PORTEE: 330, TELE_PORTEE_BONNE: 240,     // m : un poste ne filme pas plus loin ; au-delà de la seconde, on change de plan
  TELE_PLAN_MIN: 2.5,           // s : un plan dure au moins ça
  TELE_PREVISION_PAS: 0.5,      // s : la régie vérifie que le poste voit la voiture tout au long du plan, à ce pas
  TELE_VISEE: 0.6,              // m : la hauteur visée (la voiture)
  TELE_CHAMP: [4, 50],          // degrés : le zoom le plus serré et le plus large
  TELE_CASE: 60,                // m : la grille des obstacles (les plus grands que la moitié sont à part)
  TELE_HELICO_HAUTEUR: [80, 150], TELE_HELICO_RECUL: 120, TELE_HELICO_COTE: 60, TELE_HELICO_DOUCEUR: 0.8, TELE_HELICO_CADRAGE: 40,
  TELE_HELICO_DROITE: 700,
  // le drone : la grille vue d'en haut au départ (GRILLE_*), et à l'arrivée il tourne autour de la voiture en montant
  DRONE_ARRIVEE_DUREE: 5, DRONE_RAYON: 22, DRONE_HAUTEUR: [6, 26], DRONE_VITESSE: 0.35, DRONE_CHAMP: 50,      // m : sur une ligne droite plus longue, l'hélicoptère              // la voiture et ce qui l'entoure, en mètres, remplissent l'image

  MESURE_DUREE: 30,             // s : la mesure des images par seconde du propriétaire (mesure.js, ?mesure=1 : 20 voitures, la caméra de course)
  COUTS_POINTS: 12,             // la mesure des coûts par circuit (tests/lieu.html, tour 40) : la caméra de course en tant d'endroits du tour (12 : un sur deux des 24 de la mesure du tour 40, plus court sur GitHub)
  PIXEL_RATIO_MAX: 1.5,         // au plus 1,5 pixel dessiné par pixel CSS (un écran Retina en demande 2)
  // la qualité de l'image (qualite.js ; tour 40 les crans, tour 49a l'Auto continu) : le dessin seulement ; le plus beau = l'image d'avant
  // (PIXEL_RATIO_MAX, DECOR_DETAIL_LOIN, DECOR_RIEN_LOIN, VOITURE_LOIN, VOITURES_DETAILLEES_MAX, toute la densité, tous les effets)
  QUALITE_IPS_MIN: 55,          // images par seconde : en dessous (moyenne sur QUALITE_MOYENNE s), les simplifications commencent…
  QUALITE_IPS_VISEE: 58,        // … un pas à la fois, jusqu'à revenir à tant ou plus
  QUALITE_MOYENNE: 1,           // s : la moyenne des images par seconde
  QUALITE_PAS_DESCENTE: 0.5,    // s : au plus un pas de simplification tous les tant
  QUALITE_PAS_RETOUR: 3,        // s : au plus un pas de détail rendu tous les tant
  QUALITE_MARGE: 0.7,           // le détail revient seulement si une image se calcule en moins de cette part du temps permis…
  QUALITE_TEMPS_PERMIS: 1 / 60, // … (s : une image à 60 Hz ; 0,7 × 16,7 ms = 11,7 ms)
  QUALITE_BLOCAGE: 90,          // s de jeu : un pas rendu puis repris n'est plus rendu avant tant (doublé à chaque nouvel échec)
  QUALITE_DT_MAX: 0.25,         // s : une image plus longue (un chargement, l'onglet caché) ne compte pas
  // les pas de l'Auto, dans l'ordre, du moins visible au plus visible (chacun change ce qu'il donne, le reste suit le pas d'avant) ;
  // le détail revient dans l'ordre inverse. Jamais : la piste, les vibreurs, les repères, la trajectoire conseillée, la voiture du joueur
  QUALITE_PAS: [
    { voitureLoin: 35, voituresDetaillees: 6 }, { voitureLoin: 25, voituresDetaillees: 4 }, { voitureLoin: 15, voituresDetaillees: 2 },   // 1) les voitures lointaines (m, nombre)
    { densite: 0.75 }, { densite: 0.5 }, { densite: 0.3 },                                // 2) la part du public, des arbres et des piles de pneus dessinés
    { detail: 150, rien: 1350 }, { detail: 120, rien: 1100 }, { detail: 90, rien: 900 },  // 3) la distance de dessin du décor (m)
    { effets: 0.5 }, { effets: 0.25 },                                                    // 4) la part de fumée, d'étincelles, de gerbes, de gouttes
    // 5) les ombres : le jeu n'en dessine pas aujourd'hui (shadowMap éteint) ; leur pas viendra avec elles. À leur place : le rétroviseur
    { retro: false },
    { pixelRatio: 1.35 }, { pixelRatio: 1.2 }, { pixelRatio: 1.05 }, { pixelRatio: 0.9 }, { pixelRatio: 0.75 }, { pixelRatio: 0.6 },   // 6) les pixels par pixel CSS
  ],
  // l'arrière-plan du paddock et des menus (stand3d.js, tour 49a-2) : la voiture du joueur garée devant le garage de son écurie, la
  // caméra qui tourne autour, des mécaniciens ; STAND3D_ACTIF faux : l'arrière-plan d'avant (la grille)
  STAND3D_ACTIF: true,
  STAND3D_DEVANT: 6,            // m devant la porte du garage, vers la piste
  STAND3D_RAYON: 6.5, STAND3D_HAUTEUR: 2.2, STAND3D_VISEE_Y: 0.5,   // m : la caméra autour de la voiture
  STAND3D_VITESSE: 0.12,        // rad/s (un tour en 52 s)
  STAND3D_CHAMP: 50,            // degrés
  STAND3D_DEPART: 2.4,          // rad : là où la caméra commence (de trois quarts avant)
  STAND3D_TAILLE: 1.75,         // m : un mécanicien
  STAND3D_CASQUE: 0xf2f2f2, STAND3D_PANTALON: 0x22252c,
  STAND3D_MECANICIENS: [[2.6, 1.3, 2.6], [2.6, -1.3, -2.6], [-2.6, 1.4, 1.2], [0.2, -2.2, -1.6]],   // [m devant, m à droite, regard (rad)]
  // le rétroviseur (scene3d.js dessinerRetro, principal.js majRetro ; tour 49a) : en haut au milieu, sous le chrono, en vue derrière et
  // cockpit, en course avec d'autres voitures ; jamais à deux (RETRO_DEUX : choix du Codeur, réversible) ; coupé en qualité basse et par l'Auto
  RETRO_ACTIF: true,            // affiché par défaut (le menu pause et ⚙ Réglages : « Rétroviseur : oui / non », sauvegardé)
  RETRO_DEUX: false,
  RETRO_LARGEUR: 0.24, RETRO_LARGEUR_MAX: 340, RETRO_RAPPORT: 4,   // la part de la largeur de l'écran, au plus tant de pixels CSS ; largeur / hauteur
  RETRO_ECART: 6,               // pixels CSS sous le chrono (#hudCourse) ; sans lui, à RETRO_HAUT de la hauteur
  RETRO_HAUT: 0.2,
  RETRO_BAS_MAX: 170,           // pixels CSS : le bas du rétroviseur reste au-dessus des messages de course (#messageCourse, à 176 px du haut)
  RETRO_HAUTEUR_MIN: 24,
  RETRO_RESOLUTION: 0.5,        // pixels dessinés par pixel CSS (une petite image)
  RETRO_CHAMP: 55, RETRO_PRES: 0.5, RETRO_LOIN: 400,   // degrés de gauche à droite ; m (rien au-delà : moins à dessiner)
  RETRO_RECUL: 1.6, RETRO_HAUTEUR: 1.1,                // m : la caméra à l'arrière de la voiture, à hauteur de casque…
  RETRO_VISEE: 40, RETRO_VISEE_Y: 0.4,                 // … qui regarde à tant de mètres derrière, à cette hauteur
  RETRO_MAJ_ZONE: 0.5,          // s : la place du chrono est relue tous les tant
  // les réglages fixes du menu (haute = l'image d'avant) ; les voitures, la densité et les effets y restent ceux du plus beau
  QUALITE_CRANS: [
    { pixelRatio: 1.5, detail: 180, rien: 1600 },   // haute
    { pixelRatio: 1, detail: 130, rien: 1200 },     // moyenne
    { pixelRatio: 0.75, detail: 90, rien: 900, retro: false },    // basse (sans rétroviseur)
  ],

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

// Le décor de chaque circuit (decor.js) : une liste de { type, s, longueur, cote, distance, … } le long de la piste.
// type : tribune (avec son public ; rangs), public (debout ; rangs), stands (le bâtiment et un garage par écurie), arbres (nombre,
// profondeur : la bande où ils sont tirés), panneaux, pneus. s, longueur : en mètres depuis la ligne (s < 0 : avant la ligne) ;
// cote : 1 à droite du pilote, -1 à gauche ; distance : du centre de la piste au bord de l'objet côté piste (m). Une place qui n'est
// pas libre (piste, voie des stands, podium, poste télé) est laissée vide : decor.js le vérifie pour chaque objet.
const DECORS = {
  test: [
    { type: 'tribune', s: -150, longueur: 300, cote: 1, distance: 28 },     // la grande tribune, en face des stands (7,5 m derrière la barrière)
    { type: 'stands', s: -160, longueur: 140, cote: -1, distance: 22, ecuries: [0, 5] },     // les stands, de part et d'autre du podium
    { type: 'stands', s: 20, longueur: 140, cote: -1, distance: 22, ecuries: [5, 10] },
    { type: 'panneaux', s: -400, longueur: 230, cote: 1, distance: 21 },
    { type: 'panneaux', s: 170, longueur: 260, cote: 1, distance: 21 },
    { type: 'pneus', s: 440, longueur: 90, cote: 1, distance: 19.8 },          // la première chicane
    { type: 'pneus', s: 440, longueur: 90, cote: -1, distance: 19.8 },
    { type: 'tribune', s: 760, longueur: 300, cote: -1, distance: 28 },     // à l'extérieur du grand virage
    { type: 'public', s: 700, longueur: 420, cote: 1, distance: 25 },
    { type: 'panneaux', s: 1250, longueur: 550, cote: -1, distance: 21 },
    { type: 'pneus', s: 2290, longueur: 100, cote: -1, distance: 19.8 },      // les deux virages serrés
    { type: 'tribune', s: 2240, longueur: 144, cote: -1, distance: 28 },
    { type: 'pneus', s: 2600, longueur: 100, cote: -1, distance: 19.8 },
    { type: 'public', s: 2560, longueur: 160, cote: -1, distance: 25 },
    { type: 'arbres', s: 0, longueur: 4000, cote: -1, distance: 45, profondeur: 140, nombre: 380 },
    { type: 'arbres', s: 0, longueur: 4000, cote: 1, distance: 45, profondeur: 90, nombre: 260 },
  ],
};
