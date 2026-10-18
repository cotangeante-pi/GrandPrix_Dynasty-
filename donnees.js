// Tous les réglages du jeu. Aucun chiffre de réglage ne doit traîner ailleurs dans le code.
const REGLAGES = {
  // la boucle
  PAS_PHYSIQUE: 1 / 120,        // la physique avance toujours de 1/120 s
  PAS_MAX_PAR_IMAGE: 12,        // au plus 0,1 s de physique par image : si l'onglet rame, on ralentit au lieu de s'emballer

  // la scène de départ (étape 0)
  VITESSE_CUBE: Math.PI / 2,    // radians par seconde de physique
  COULEUR_CIEL: 0x87c5ea,
  COULEUR_SOL: 0x4f7d3a,
  COULEUR_CUBE: 0xd8262e,

  // le mode ?debug=1
  DEBUG_PERIODE_IPS: 0.5,       // secondes entre deux mises à jour du compteur d'images
};
