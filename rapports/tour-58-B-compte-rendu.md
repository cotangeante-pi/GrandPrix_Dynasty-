# Tour 58, tâche B : les deux relais pareils

- Travail non commité repris et commité (relais.py aligné sur reseau.js : nom pris -> « -2 », liste des joueurs sans champs vides, « nom » dans « salle »).
- Nouveau test tests/relais-pareils.py (+ .html) : un même scénario de 36 messages joué contre serveur/relais.py (vrai processus) et RESEAU.creerRelais ; les réponses de chaque client sont comparées. Dans les annexes (lancer.py), ~10 s.
- Écarts trouvés et réglés dans reseau.js : numéros de joueur comptés par salle (comme relais.py), erreurs « hote », « commencee », « seul », « pas-commencee » (avant : silence). Option `exigerCharge` ajoutée au relais JS (relais.py l'exige par défaut) ; la page ne l'active PAS (elle empêchait le lancer des tests en ligne : 1er passage rouge).
- Écarts voulus, normalisés dans le test : « delai » et mélange de la grille (relais.py seulement).
- tests/serveur.py 119/119, tests/reseau-ws.py 14/14, relais-pareils OK ; GitHub (passage court, moteur + annexes) vert sur cbf3add621e7a6f84784e03b6b1d2cd571ad7061.
