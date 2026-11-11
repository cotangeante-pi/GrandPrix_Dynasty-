TOUR 53h — compte rendu du Codeur (les trois longueurs en carrière)
Branche : longueurs (depuis origin/main c6bd3d4)
Fait :
1. Page Course du paddock : « Longueur de la course », trois gros boutons 5 / 12 / 18 (très courte, moyenne, longue), au-dessus de « Course suivante ». « Très courte » d'office, le dernier choix est gardé (option `longueurGP` de la sauvegarde). Réglage CHAMPIONNAT_LONGUE_CHOIX (faux = toujours CHAMPIONNAT_TOURS, comme avant).
2. Le tout premier Grand Prix reste à 3 tours, sans boutons (CHAMPIONNAT_TOURS_PREMIER).
3. Points et argent : `pointsPour(place)` et `ARGENT.gains(ch, lignes, aides)` n'ont aucune longueur en entrée (test d'arité). Règles existantes pour 12 et 18 tours, vérifiées dans le code : arrêt obligatoire dès TOURS_ARRET_OBLIGATOIRE = 12 (pneus.js), pénalité sans arrêt PENALITE_SANS_ARRET, stratégie d'arrêt des IA (simulation.js), pneus et pluie (météo) sans condition de longueur. Rien d'inventé ; rien ne manque.
4. Tests : test.html (5 / 12 / 18 = la longueur, GP 1 à 3 tours quel que soit le choix, réglage faux = 5, arité) ; ecrans.py test=longueurs aux 3 tailles (boutons dans l'écran sans recouvrir « Course suivante », choix gardé, et à 1280 la course dure 12 tours avec l'arrêt obligatoire et sa pénalité identique à 18 tours). Captures tests/captures/longueurs-{1280,960,640}.png.
À voir : la longueur n'est pas proposée en course rapide ni au mode 2 joueurs (déjà le cas avant). Pas de test de course complète à 18 tours (trop long sur le Mac ; stands.html couvre 12 tours).
