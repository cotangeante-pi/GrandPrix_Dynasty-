# Tour 37i — compte rendu du Codeur 3 (2026-10-30)

Branche codeur3, partie de 0407e46, avec main fusionné.

1. **Le patron** (patrons.js) : ton patron (seulement le tien) remarque ton dernier exploit sans aide ou en légende (`ch.exploitAides`, le vrai fait de course), une seule fois (`m.exploitVu`). Il le fait à n'importe quelle phrase comprise, sauf une insulte, une menace ou un au revoir. Exemples, dans son ton :
   - « P1 à Monzo avec toutes les aides coupées. C'est ce genre de pilotage que l'écurie veut voir. »
   - « Tenir une voiture vivante et gagner à Spaa : ça donne confiance. »

   La confiance de l'écurie monte alors de `PATRON_CONFIANCE_EXPLOIT` (2, dans donnees.js), jamais plus. Ce n'est jamais un moins : celui qui garde ses aides n'a pas d'exploit, donc rien ne bouge.
   - Test (banc-parle-tests.js) : rien sans exploit ; une seule fois, avec le circuit et la place vrais ; la confiance +2 ; pas un autre patron. Résultat : 63/63.
2. **La relecture de l'anglais** des textes d'aujourd'hui :
   - le choix des aides : « stay locked until the finish », « +15% if off », « standard prize money », « no-aids bonus » ;
   - les bulles : « Switch one off: bonus cash! », « the rear can step out » ;
   - ce que fait chaque aide : « Nudges the wheel to keep you on the racing line », « Brakes for you when you arrive too fast for a corner » ;
   - le journal : « Bare hands », « goes it alone », « A milestone », « did it the hard way », « didn't give an inch » ;
   - l'interview.

   En anglais, plus d'espace avant le %. En français, j'ai neutralisé une réponse de l'interview qui genrait le joueur (« ne m'a pas aidé » devient « ne m'a fait aucun cadeau »).
   - Tests : textes.html 1304/1304, aides.html 20/20.
