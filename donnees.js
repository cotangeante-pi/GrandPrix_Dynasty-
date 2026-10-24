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
  ARRIVEE_BAGARRE: 15,          // m : deux voitures plus proches que ça se bagarrent (la caméra télé les préfère)
  ARRET_APRES_ARRIVEE: 0.3,     // m/s : après l'arrivée, la voiture freine seule jusque-là, puis roule jusqu'à l'arrêt

  // le championnat (étape 6, championnat.js) : la partie calcul seulement, les écrans viendront après
  POINTS: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],   // les points des 10 premiers d'un Grand Prix
  NB_GRANDS_PRIX: 12,
  CALENDRIER_CIRCUITS: ['test', 'technique'],   // en alternance, en attendant les 12 vrais circuits (étape 10)
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
  // les saisons (étape 9, saisons.js, Codeur 3)
  SAISONS_MAX: 15,              // la retraite par l'âge : la carrière s'arrête après ce nombre de saisons
  GRAINE_SAISONS: 7000,         // l'évolution des rivaux est tirée avec la graine du championnat + ce nombre + la saison
  // les contrats : la note du joueur (0 à 1) = son classement, son duel (poids) et la confiance de l'écurie (poids) ; chaque
  // écurie exige une note selon son niveau, de CONTRAT_EXIGENCE_MAX (la meilleure) à 0 (la plus faible accepte toujours)
  CONTRAT_POIDS_DUEL: 0.3,
  CONTRAT_POIDS_CONFIANCE: 0.1,
  CONTRAT_EXIGENCE_MAX: 0.85,
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
  // les noms des 20 pilotes, deux par écurie dans l'ordre (le 20e est remplacé par le joueur) : pas encore (les noms
  // inventés, à approuver par le propriétaire, viendront ici) ; sans nom, l'écran affiche texte('pilote') avec son numéro (« Driver 7 » / « Pilote 7 »)
  NOMS_PILOTES: [],
  // les pneus (étape 7, pneus.js) : branchés dans la page mais désactivés tant que le propriétaire n'a pas jugé la sensation ;
  // ?pneus=1 les active (l'usure de la voiture du joueur baisse son adhérence) ; sans ça, la course est identique au bit près
  PNEUS_ACTIFS: false,

  // la une du journal après chaque Grand Prix (journal.js, Codeur 3) ; les titres et les brèves sont dans textes.js (uneTitre_…, uneTexte_…, breve…)
  JOURNAL_PRIORITES: ['titreChampion', 'premiereVictoire', 'victoire', 'premierPodium', 'podium', 'record', 'duelGagne', 'duelPerdu',
    'penalite', 'serie', 'leader', 'vainqueur'],   // le grand titre : le premier fait vrai de cette liste (« vainqueur » est toujours vrai)
  JOURNAL_DUEL_NET: 3,          // le duel contre le coéquipier fait le titre quand l'écart de la saison est d'au moins ce nombre de points
  JOURNAL_SERIE: 3,             // … une série de ce nombre de Grands Prix sans point
  JOURNAL_ECART_LEADER: 25,     // … le leader (pas le joueur) s'envole : au moins ces points d'avance, et l'avance a grandi
  JOURNAL_FORME_COURSES: 3,     // brève « en grande forme » : un rival qui a fait au moins JOURNAL_FORME_PODIUMS podiums sur ces derniers Grands Prix
  JOURNAL_FORME_PODIUMS: 2,
  JOURNAL_BREVES_MAX: 3,        // les brèves sur le côté, au plus
  JOURNAL_CLASSEMENT: 5,        // en bas : les premiers du championnat (et le joueur s'il n'y est pas)
  JOURNAL_GRAINE: 6000,         // les variantes des titres sont tirées avec la graine du championnat + ce nombre + le Grand Prix

  // la course de découverte du premier lancement (decouverte.js, CLAUDE.md « En piste en 10 secondes »)
  DECOUVERTE_TOURS: 3,          // une longueur à part, seulement pour elle
  DECOUVERTE_IA: 6,             // quelques IA seulement…
  DECOUVERTE_NIVEAU: 'debutant',   // … au niveau débutant (NIVEAUX)
  DECOUVERTE_CIRCUIT: 'test',   // sur un circuit facile (le circuit test tant que les 12 circuits n'existent pas)
  DECOUVERTE_PILOTES: [0, 3, 6, 9, 12, 15],   // les pilotes du monde (ids dans championnat.pilotes) qui courent la découverte : un par écurie
  DECOUVERTE_ARGENT: [1000, 800, 600, 400, 300, 200, 100],   // la prime d'argent de départ selon la place (1er, 2e, …)
  DECOUVERTE_ARGENT_MAX: 1000,  // … et son plafond
  AIDE_CLIGNOTE_APRES: 3,       // s : sur la grille, sans aucune touche pendant ce temps, l'aide « ↑ » clignote
  // le casque du pilote (casque.js) : un motif et trois couleurs ; les rivaux tirent le leur avec la graine du championnat
  CASQUE_MOTIFS: ['uni', 'bandes', 'etoile', 'flammes', 'damier', 'eclair'],
  CASQUE_PALETTE: [0xd8262e, 0xf2c230, 0x2fa84f, 0xf07d1a, 0x8e44ad, 0x1abc9c, 0xecf0f1, 0x34495e, 0xe84393, 0x1f6fe0, 0x111111, 0xffffff],
  CASQUE_NEUTRE: { motif: 'uni', couleurs: [0xdfe3ea, 0xdfe3ea, 0x34495e] },   // « Toi » avant la création, les voitures sans pilote
  CASQUE_ESSAIS_MAX: 200,       // tirages pour trouver un casque que personne n'a
  GRAINE_CASQUES: 6000,         // les casques des rivaux sont tirés avec la graine du championnat + ce nombre
  CASQUE_ATLAS_CASE: 64,        // pixels : la case de chaque casque dans l'atlas (une petite texture partagée, un seul matériau)
  CASQUE_ICONE: 14,             // pixels : l'icône du casque dans la tour, les résultats, le championnat
  CASQUE_APERCU_VITESSE: 1.2,   // rad/s : le casque tourne dans l'éditeur
  CACHE_CARTE_TAILLE_MAX: 150000,   // octets : la carte des IA d'un circuit en cache dans la sauvegarde (cache-carte.js) ne doit pas peser plus (test)

  // la création du pilote (pilote.js, étape 6) : le nom, le numéro, le pays, la course de cœur
  NOM_LONGUEUR_MAX: 12,         // caractères du nom du pilote
  NUMERO_MIN: 1, NUMERO_MAX: 99, // le numéro du pilote (jamais celui d'un rival)
  // les pays proposés (codes ; le nom par texte('pays_<code>')), de vrais pays
  PAYS: ['fr', 'be', 'ch', 'ca', 'gb', 'it', 'es', 'de', 'nl', 'at', 'pt', 'mc', 'se', 'fi', 'dk', 'no', 'pl', 'us', 'mx', 'br', 'ar', 'jp', 'cn', 'au', 'nz', 'sg', 'ae', 'bh', 'za', 'in', 'ma'],
  // le pays de chaque circuit (celui du vrai circuit dont il s'inspire, CLAUDE.md « Le Grand Prix à domicile ») : si le joueur
  // vient d'un de ces pays, ce circuit est son Grand Prix à domicile ; sinon il choisit sa course de cœur parmi les 12
  CIRCUITS_PAYS: { monoco: 'mc', silverstoun: 'gb', monzo: 'it', spaa: 'be', suzuko: 'jp', interlagas: 'br', montreol: 'ca', melbourn: 'au', barcelana: 'es', bahrayn: 'bh', singapura: 'sg', yasmarino: 'ae' },

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
  // les niveaux de difficulté (étape 4d) : un niveau change tous les caractères ensemble, en gardant les écarts entre
  // pilotes : rythme ajouté au rythme tiré (jamais au-dessus de 1 : au-delà, il dépasserait l'adhérence de la carte,
  // donc les niveaux durs ne gagnent pas en rythme, ils font moins d'erreurs et attaquent plus), erreurs : le taux
  // multiplié, agressivite ajoutée (bornée entre 0 et 1), regularite multipliée
  NIVEAU: 'normal',             // le niveau en cours (?niveau=…, principal.js) ; normal = les réglages tels quels
  NIVEAUX: {
    debutant: { rythme: -0.05, erreurs: 2, agressivite: -0.3, regularite: 1.5 },
    normal: { rythme: 0, erreurs: 1, agressivite: 0, regularite: 1 },
    expert: { rythme: 0, erreurs: 0.5, agressivite: 0.2, regularite: 0.7 },
    legende: { rythme: 0, erreurs: 0.25, agressivite: 0.4, regularite: 0.5 },
  },
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
  GRAINE_QUALIF: 2000,          // … et la qualification avec la graine + ce nombre
  GRAINE_FEUX: 4000,            // … et le délai des feux et les réactions des IA avec la graine + ce nombre
  IA_QUALIF_HASARD: 0.005,      // le temps de qualification d'une IA varie de ±0,5 % autour de son meilleur tour estimé
  IA_PAGE_MAX: 20,              // ?ia=N : au plus ce nombre d'IA dans la page
  // ?ia=N : la couleur de chaque IA (provisoire : les écuries viendront à l'étape 6)
  COULEURS_IA: [0x1f6fe0, 0xd8262e, 0xf2c230, 0x2fa84f, 0xf07d1a, 0x8e44ad, 0x1abc9c, 0xecf0f1, 0x34495e, 0xe84393],
  // derrière une voiture plus lente (sans la dépasser, étape 4a) ; distances d'un centre de voiture à l'autre
  IA_DISTANCE_MIN: 8,           // m : jamais plus près
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
