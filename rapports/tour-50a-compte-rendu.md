TOUR 50a — compte rendu du Codeur 1 (branche attaque-tete), arrêté en cours (WIP, demande du Chef)

Où j'en suis
- Cause trouvée du blocage en tête (ia.js), plusieurs verrous à la suite :
  1. dans le sillage, la ligne de l'attaquant est plafonnée à SA vitesse de pointe en air libre : l'aspiration ne lui rend rien (+3 m/s) ;
  2. collé derrière, retenu à IA_DISTANCE_MIN : il ne vient jamais à moins de ~10 m ;
  3. décalé à côté, le réflexe (portée L + marge + Δv × 0,6, côté < 4,5 m) le force à rouler 1 m/s MOINS vite que la voiture attaquée : il ne vient jamais à hauteur (il reste pile à la limite de la portée) ;
  4. à l'intérieur, la ligne d'attaque = place prévue de l'autre + 3,5 m : à la corde, hors piste → « pas la place » (440 fois / 30 courses), ou ligne si serrée qu'il freine avant elle ;
  5. « fond » : décalages lancés à 25-80 m, perdus d'avance, et l'attaque ratée lui coûte ~20 m ;
  6. le défenseur ferme la corde sur un attaquant déjà décalé (chocs) ; à 7 m de côté l'attaquant la « perd de vue » et revient sur elle.
- Corrigé sous un seul réglage IA_ATTAQUE_TETE (donnees.js, 3 = sortir du sillage jusqu'à 3 s avant le freinage ; 0 = la course d'avant, vérifié au bit près sur 30 courses) : les 6 points ci-dessus (voir les commentaires « IA_ATTAQUE_TETE » dans ia.js).

Mesures (jsc sur le Mac, 30 courses de 5 tours, 10 IA, test + technique ; les nombres ne sont pas ceux de Chrome, comparer entre eux)
| réglage | poleman à 95 % : vainqueur ≠ poleman | chocs | herbe | normal : ≠ poleman | chocs | herbe | dépassements |
| TETE 0 (main) | 0/30 | 2 | 767 | 0/30 | 3 | 955 | 27 |
| TETE 3 | 5/30 | 2 | 309 | 1/30 | 4 | 12 | 64 |
| TETE 3 + IA_ATTAQUE_FREIN 1,1 | 9/30 | 1 | 2614 | 0/30 | 2 | 495 | — |
| TETE 3 + IA_LENT_COTE_A_COTE 1 | 10/30 | 3 | 4614 | — | | | |
| TETE 3 + freins vus seulement < 40 m (patch non commité) | 7/30 | 7 | 665 | 2/30 | 5 | 391 | |
12 tours avec pneus, 50 courses (jsc) : chocs > 5 m/s 9 avec TETE 3, 7 avec TETE 0.

GitHub, passage 42315310452 (commit abb6182, TETE 3) — pas fini à l'arrêt :
- moteur ROUGE : les 2 tests des consignes (la voiture de derrière passe maintenant seule, avant la consigne). Corrigé dans le commit WIP
  (courseConsigne force IA_ATTAQUE_TETE 0 : le test suppose « à la file, ne la passe pas seule ») — pas encore vérifié.
- stands ROUGE : duel 23/50 ≠ poleman (main 21), mais chocs 12 > DUEL_CHOCS_MAX 11.
- premier, ecrans-4/5, recoins-2, paquet, officiels : verts. courses, annexes (mesure lots 1-2), consignes : pas encore lus.

Ce qui reste / prochaine étape précise
1. Lire courses, consignes et annexes (courses-mesure.html lot 1 = TETE 0/3 avec poleman à 95 %, lot 2 = forme 0,15) du passage 42315310452, puis celui du commit WIP.
2. Baisser les chocs du duel (12 → ≤ 11) : les chocs viennent surtout d'une attaque abandonnée à la corde (« pas à hauteur » à IA_ATTAQUE_CONTROLE) : l'attaquant à l'intérieur revient sur sa ligne et converge avec l'autre au sommet. Piste : à l'abandon, garder la ligne intérieure derrière elle jusqu'au sommet, ou n'autoriser le décalage tôt que si Δv > 2 m/s. (Essayé : pilote.cede à l'abandon : aucun effet, retiré.)
3. Si ça ne tient pas : IA_ATTAQUE_TETE 0 par défaut (main au bit près), le code reste.
4. Avant la fusion : retirer tests/courses-mesure.html et sa ligne dans tests/lancer.py.
Outils de mesure (hors dépôt) : jsc (/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc) charge les fichiers de calcul avec load() ; ~5 s par course de 5 tours quand le Mac est calme.
Réévalue.
