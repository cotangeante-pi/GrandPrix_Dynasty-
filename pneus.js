// Les pneus et l'arrêt au stand, en calcul pur (sans Three.js ni DOM). Pas encore branché sur la course (étape 7).
// Une seule jauge par voiture : l'usure, de 0 (neufs) à 1 (morts). Elle avance avec la distance et surtout avec le
// travail des pneus (glissade de côté, freinages forts, herbe) ; la gestion des pneus du pilote la ralentit.
// Réglages : REGLAGES_PNEUS (pneus-donnees.js).

// l'état des pneus d'une voiture
function creerPneus() {
  return { usure: 0, arrets: 0 };
}

// la vitesse d'usure (par seconde) d'une voiture, à partir de son état physique (les champs de creerVoiture :
// u = vitesse vers l'avant, v = vitesse de côté, frein 0–1, surHerbe). gestionPneus : 0 à 1 (1 = le plus doux).
function tauxUsure(voiture, gestionPneus = REGLAGES_PNEUS.GESTION_MOYENNE) {
  const P = REGLAGES_PNEUS;
  const vitesse = Math.abs(voiture.u), glisse = Math.abs(voiture.v);
  const freinFort = Math.max(0, voiture.frein - P.SEUIL_FREIN_FORT) / (1 - P.SEUIL_FREIN_FORT);
  const brut = vitesse * P.USURE_PAR_KM / 1000
    + glisse * P.USURE_PAR_M_GLISSE
    + freinFort * vitesse * P.USURE_PAR_M_FREIN_FORT
    + (voiture.surHerbe ? vitesse * P.USURE_PAR_M_HERBE : 0);
  const gestion = Math.max(0, Math.min(1, gestionPneus));
  return brut * (1 - P.GESTION_EFFET_MAX * gestion) * (P.USURE_ECHELLE || 1) * (voiture.usureMeteo || 1);   // (usureMeteo : un pneu de pluie sur le sec, meteo.js ; 1 au sec)
}

// un pas de dt secondes : l'usure avance, sans dépasser USURE_MAX. Renvoie l'usure.
function pasPneus(etat, voiture, dt, gestionPneus) {
  etat.usure = Math.min(REGLAGES_PNEUS.USURE_MAX, etat.usure + tauxUsure(voiture, gestionPneus) * dt);
  return etat.usure;
}

// ce par quoi multiplier l'adhérence : 1 à neuf, puis une baisse douce jusqu'à 1 - PERTE_ADHERENCE_MAX à usure 1
function facteurAdherence(usure) {
  const P = REGLAGES_PNEUS;
  const u = Math.max(0, Math.min(1, usure));
  // usure ^ EXPOSANT_ADHERENCE par des multiplications (exposant entier, sans la fonction puissance du navigateur : CLAUDE.md, déterminisme Mac / Linux)
  let puissance = 1;
  for (let k = 0; k < P.EXPOSANT_ADHERENCE; k++) puissance *= u;
  return 1 - P.PERTE_ADHERENCE_MAX * puissance;
}

// la durée de l'arrêt (s, voiture immobile) selon le niveau des changeurs de roues, avec le gain plafonné
function dureeArret(niveauChangeurs = 0) {
  const P = REGLAGES_PNEUS;
  const gain = Math.min(P.CHANGEURS_GAIN_MAX, Math.max(0, niveauChangeurs) * P.CHANGEURS_GAIN_PAR_NIVEAU);
  return P.ARRET_DUREE_BASE * (1 - gain);
}

// l'arrêt au stand : des pneus neufs (usure 0), l'arrêt est compté ; renvoie sa durée (s)
function arretAuStand(etat, niveauChangeurs = 0) {
  etat.usure = 0;
  etat.arrets++;
  return dureeArret(niveauChangeurs);
}

// la règle : un arrêt obligatoire en course moyenne (12 tours) et longue (18), aucun en très courte (5) ni en essai libre (0)
function arretObligatoire(nbTours) {
  return nbTours >= REGLAGES_PNEUS.TOURS_ARRET_OBLIGATOIRE;
}

// à l'arrivée : la pénalité (s) de celui qui ne s'est pas arrêté alors que c'était obligatoire, sinon 0
function penaliteSansArret(etat, nbTours) {
  return arretObligatoire(nbTours) && etat.arrets === 0 ? REGLAGES_PNEUS.PENALITE_SANS_ARRET : 0;
}
