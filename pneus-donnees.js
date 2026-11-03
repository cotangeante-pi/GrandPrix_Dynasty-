// Les réglages des pneus et de l'arrêt au stand (étape 7). Provisoire : à fusionner dans REGLAGES (donnees.js).
// Calibrage (mesuré sur 10 IA, 3 tours, CIRCUIT_TEST et technique) : par tour, une IA roule ≈ 3 300 m,
// glisse de côté ≈ 54 m (∫ |v| dt, la vitesse latérale), freine fort sur ≈ 280 m (∫ freinFort × vitesse dt),
// et presque jamais dans l'herbe. Pour un pilote moyen (gestionPneus 0,5 → × 0,85), on vise 0,075 d'usure par tour :
//   brut par tour = 3 300 × 0,0067/1000 + 54 × 0,0009 + 280 × 0,000063 ≈ 0,0221 + 0,0486 + 0,0176 = 0,0883
//   × 0,85 ≈ 0,075 par tour → 5 tours ≈ 0,38 ; 12 tours ≈ 0,90 ; 18 tours ≈ 1,35 (la jauge est morte vers le tour 13)
// Le meilleur gestionnaire (1 → × 0,7) : 12 tours ≈ 0,74, 18 tours ≈ 1,11 ; le pire (0 → × 1) : 12 tours ≈ 1,06.
// Vérifié en course entière (10 IA, graine 11, gestion 0,5, sans plafond) : 12 tours = 0,92 (test) et 0,87 (technique),
// 18 tours = 1,34 (test), 5 tours = 0,38 (test).
const REGLAGES_PNEUS = {
  // l'usure (0 = neufs, 1 = morts), qui avance avec :
  USURE_PAR_KM: 0.0067,             // … la distance roulée (le quart de l'usure d'un tour normal)
  USURE_PAR_M_GLISSE: 0.0009,       // … chaque mètre glissé de côté (∫ |vitesse latérale| dt) : surtout ça
  USURE_PAR_M_FREIN_FORT: 0.000063, // … chaque mètre freiné fort, pondéré par la part de frein au-dessus du seuil
  SEUIL_FREIN_FORT: 0.5,            // un freinage compte comme fort au-delà de cette part de frein (0 à 1)
  USURE_PAR_M_HERBE: 0.0002,        // … chaque mètre roulé dans l'herbe (100 m d'herbe ≈ un quart de tour d'usure)
  USURE_MAX: 1,                     // la jauge s'arrête là (pneus morts)
  // tour 32 : l'usure est comptée au mètre (distance, glissade, freinage, herbe), donc un long tracé use plus par tour ; réglée sur le
  // plus long (Spaa, 6,9 km) pour qu'un seul arrêt suffise : en 18 tours, un relais va jusqu'à ~13 tours (la stratégie des IA), soit
  // ~93 km, sous USURE_MAX même pour le pire gestionnaire ; en 5 tours, on finit sans arrêt. Le calibrage ci-dessus (circuits d'essai)
  // est × ce facteur. Vérifié par tests/officiels.html (les 12 tracés, 5, 12 et 18 tours)
  USURE_ECHELLE: 0.4,
  USURE_DRIFT: 1.6,             // le pneu drift s'use plus vite (les pneus fument) : × ça
  GESTION_EFFET_MAX: 0.3,           // gestionPneus = 1 : l'usure avance 30 % moins vite ; 0 : pas de réduction
  GESTION_MOYENNE: 0.5,             // la gestion d'un pilote moyen (et celle du joueur, sans amélioration)

  // l'adhérence : facteur = 1 - PERTE_ADHERENCE_MAX × usure ^ EXPOSANT_ADHERENCE (douce au début)
  PERTE_ADHERENCE_MAX: 0.08,        // au plus −8 % d'adhérence, à usure 1
  EXPOSANT_ADHERENCE: 2,            // 2 : −2 % à mi-usure, −6,5 % à 0,9

  // l'arrêt au stand
  ARRET_DUREE_BASE: 4,              // s, voiture immobile, changeurs de roues de base
  CHANGEURS_GAIN_PAR_NIVEAU: 0.05,  // chaque niveau d'amélioration des changeurs de roues : −5 % de la durée…
  CHANGEURS_GAIN_MAX: 0.25,         // … au plus −25 % (étape 8 : le plafond de l'amélioration)
  TOURS_ARRET_OBLIGATOIRE: 12,      // un arrêt obligatoire à partir de cette longueur de course (12 et 18 tours, pas 5)
  PENALITE_SANS_ARRET: 30,          // s ajoutées au temps total si l'arrêt obligatoire n'a pas été fait
};
