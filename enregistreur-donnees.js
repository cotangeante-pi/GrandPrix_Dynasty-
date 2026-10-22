// Les réglages de l'enregistreur de course (enregistreur.js), pour le résumé vidéo (étape 13).
// À fusionner plus tard dans donnees.js (REGLAGES.ENREGISTREUR, par exemple). Unités : secondes, mètres, m/s.
const REGLAGES_ENREGISTREUR = {
  // l'enregistrement
  IMAGES_PAR_SECONDE: 10,       // on garde 10 images par seconde (la physique en fait 120) ; lire(t) interpole entre elles
  IMAGES_PAR_BLOC: 600,         // la mémoire est prise par blocs de 600 images (60 s à 10 images/s), jamais recopiée
  CAP_PAS: Math.PI / 32767,     // rad : le cap est rangé dans un entier 16 bits (précision 0,0001 rad)
  VITESSE_PAS: 0.01,            // m/s : la vitesse est rangée dans un entier 16 bits (±327 m/s)

  // les dépassements : un changement de place ne compte que s'il tient au moins ce temps (deux voitures côte à côte)
  DEPASSEMENT_TENU: 1,          // s

  // les sorties de piste
  SORTIE_PERTE_MIN: 15,         // m/s : une sortie (herbe ou hors piste) n'est un moment fort que si elle coûte au moins ça
  SORTIE_RETOUR: 0.5,           // s : la sortie est finie quand la voiture est revenue sur la piste depuis ce temps
  // sans indicateur d'herbe ni d'écart à la piste : une décélération plus forte qu'un freinage (m/s²), mesurée sur une fenêtre
  SORTIE_DECELERATION: 60,
  SORTIE_FENETRE: 0.3,          // s
  SORTIE_ESPACEMENT: 5,         // s : au plus une sortie par voiture pendant ce temps

  // la durée de chaque moment fort : un peu avant, un peu après
  DEPART_AVANT: 2, DEPART_APRES: 8,
  DEPASSEMENT_AVANT: 3, DEPASSEMENT_APRES: 2,
  SORTIE_AVANT: 2, SORTIE_APRES: 3, SORTIE_DUREE_MAX: 10,
  ARRIVEE_AVANT: 5, ARRIVEE_APRES: 3,

  // l'importance de chaque moment (le résumé prend les plus importants d'abord)
  IMPORTANCE_DEPART: 1000,      // le départ et l'arrivée passent toujours avant le reste
  IMPORTANCE_ARRIVEE: 1000,
  IMPORTANCE_DEPASSEMENT: 40,
  IMPORTANCE_PAR_PLACE: 2,      // + 2 par place gagnée près de la tête (un dépassement pour la 1re place vaut plus que pour la 15e)
  IMPORTANCE_TETE: 30,          // + 30 pour un dépassement pour la tête
  IMPORTANCE_JOUEUR: 40,        // + 40 si le joueur est dedans
  IMPORTANCE_SORTIE: 30,
  IMPORTANCE_PAR_MS_PERDU: 1,   // + 1 par m/s perdu dans la sortie
};
