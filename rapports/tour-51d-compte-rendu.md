TOUR 51d : compte rendu du Codeur 4 (branche voix-liste)
Ordre : la liste complète des exclamations, en français d'abord.

1. La liste proposée (tests/voix/liste.json) : 40 exclamations, 17 moments de course, 2 à 3 variantes chacune, sans noms propres,
   tournures neutres (jamais « il/elle » sur un pilote), un mot fort en majuscules, que des exclamations.
   Départ : « Et c'est PARTI ! » / « C'est le DÉPART ! » / « Feux éteints, ça PART ! »
   Dépassement : « Ça PASSE ! » / « Quel DÉPASSEMENT ! » / « Dehors, et ça PASSE ! »
   Prise de la tête : « On change de LEADER ! » / « La TÊTE est prise ! »
   Bataille : « Quelle BAGARRE ! » / « Roues contre ROUES ! » / « Côte à CÔTE ! »
   Erreur, herbe : « Oh ! Dans l'HERBE ! » / « Quelle ERREUR ! » / « Ça glisse, c'est la SORTIE ! »
   Glissade rattrapée : « Quel RATTRAPAGE ! » / « SAUVÉ de justesse ! »
   Contact : « Aïe, CONTACT ! » / « Ça TOUCHE ! »
   Voiture arrêtée : « Voiture ARRÊTÉE en piste ! » / « Ça s'ARRÊTE là ! »
   Arrêt au stand : « Direction les STANDS ! » / « Arrêt au STAND ! »
   Pluie : « La PLUIE arrive ! » / « Attention, il PLEUT ! »
   Meilleur tour : « MEILLEUR tour ! » / « Quel CHRONO ! » / « Record du TOUR ! »
   Dernier tour : « DERNIER tour ! » / « Plus qu'un TOUR ! »
   Arrivée, victoire : « VICTOIRE ! » / « Quelle VICTOIRE ! » / « Le DRAPEAU à damiers ! »
   Podium : « Quel PODIUM ! » / « Voilà le PODIUM ! »
   Arrivée du joueur : « Belle ARRIVÉE ! » / « Course TERMINÉE ! »
   Remontée : « Quelle REMONTÉE ! » / « Ça REMONTE ! »
   Pénalité : « PÉNALITÉ ! » / « Ça va coûter des SECONDES ! »
   (Les ids de moment suivent les faits de commentaire.js ; « remontee » n'y existe pas encore. L'anglais viendra après le choix de la voix.)
2. Bark (tests/voix/bark_liste.py) : voix fr 7 puis fr 4 (provisoires), 4 prises par phrase au plus, jusqu'à 20h15, nice 19.
3. Tri et page (tests/voix/liste_page.py, avec transcrire.py) : Whisper, intonation2 >= 0,7 (de préférence 0,75 à 0,9), pas de question,
   pas de mot en trop, niveau « vif » (+9 %), 3 prises au plus par phrase.
Rien n'est branché dans le jeu.

Résultat (20h20) : 150 prises Bark (voix fr 7 et fr 4, 1 à 2 prises par phrase : la machine était très chargée, 5 à 15 min par prise
avant 17h). Whisper en comprend 36 (24 %), 5 finissent en question, 12 passent la note de 0,7. 30 phrases sur 40 n'ont aucune prise gardée.
Notes des 36 prises comprises : 0,12 à 0,95, la moitié sous 0,7. Page d'écoute hors du dépôt. Pour combler : plus de prises (bark_liste.py saute
déjà les phrases qui ont 2 prises comprises), ou des textes plus longs pour les phrases très courtes, ou baisser NOTE_MIN à 0,6.
bark_liste.py : option BONNES (saute une phrase déjà comprise 2 fois).
