// La boîte de vitesses : 8 rapports automatiques, tirés de la vitesse. Seulement pour l'affichage et le son :
// la physique ne la lit jamais.

// le rapport engagé (1 à 8) pour une vitesse u (m/s)
function rapportPourVitesse(u) {
  const kmh = Math.abs(u) * 3.6, hauts = REGLAGES.RAPPORTS_HAUT_KMH;
  for (let g = 0; g < hauts.length - 1; g++) if (kmh < hauts[g]) return g + 1;
  return hauts.length;
}

// le régime du moteur (tr/min) : il monte avec la vitesse dans un rapport, et retombe quand le rapport change
function regimeMoteur(u) {
  const R = REGLAGES, g = rapportPourVitesse(u);
  const kmh = Math.abs(u) * 3.6;
  return Math.max(R.REGIME_RALENTI, Math.min(R.REGIME_MAX, R.REGIME_MAX * kmh / R.RAPPORTS_HAUT_KMH[g - 1]));
}
