TOUR 49c — compte rendu du Codeur 3 (branche duel-forme)
Commit : celui qui porte ce fichier (voir le message final au Chef) ; avant : fc80816, 4aa242f, 315e4fe, cd149f8 (vert 18/18), dc88c36
Ordres : 1 fait en partie : la forme du jour est en place et réglable, mais elle NE fait PAS gagner un autre que le poleman (mesuré, ci-dessous) / 2 (images par seconde de spaa et singapura) pas commencé : pas fini avant 23h

Ce qui est fait
- donnees.js : IA_FORME 0,02 et GRAINE_FORME 17000. simulation.js : formeDuJour(e), appelée dans donnerCarte juste après la qualification.
  Chaque IA tire sa forme avec sa propre graine ; p.forme = 1 − IA_FORME × (son tirage − le plus petit) : la plus en forme garde son rythme,
  une IA seule ne change pas. La forme multiplie le rythme que reçoit son pilote (creerPilote) ; p.rythme reste le rythme de base
  (les tests « niveaux » et « championnat » le lisent : avec le patch du tour 47a, qui changeait p.rythme, ils tombaient).
  La grille, les styles, les caractères, les pneus, les consignes ne bougent pas. Tirée de nouveau à l'identique si donnerCarte revient.
- IA_FORME 0 : le code ne s'exécute pas, la course (du joueur comme des IA) est celle d'avant au bit près.
- tests/test.html : un test « forme du jour » (grille et tirages identiques, une seule IA à 1, toutes entre 1 − IA_FORME et 1,
  le pilote reçoit rythme × forme, deux donnerCarte = même résultat, une IA seule et IA_FORME 0 inchangées) ; le test du championnat lit
  désormais le rythme du pilote × la forme.

Mesures (GitHub, Chrome ; une page de mesure temporaire, retirée depuis ; 10 IA, test + technique)
Référence de main (passage 42133271264) : courses.html 5 tours : vainqueur ≠ poleman 1/30 (et 0/30 avec ?ailerons=1), chocs > 5 m/s 0 et 2 ;
stands.html DUEL 50 courses de 12 tours avec un arrêt : 21/50, chocs 10. (Le « 22/50 » du rapport du 2026-11-02 : c'est bien autour de 21-22.)

| réglage | 5 tours : vainqueur ≠ poleman /30 | chocs | herbe | 12 tours avec arrêt : ≠ poleman |
|---|---|---|---|---|
| forme 0 (main) | 1 (0 ailerons) | 0 (2) | 0 (52) | DUEL 21/50, chocs 10 ; 13/30 sur les graines 1-15 |
| forme 0,02 | 0 (1 ailerons) | 1 (2) | 174 (169) | DUEL 21/50, chocs 5 |
| forme 0,05 | 0 (0 ailerons) | 4 (3) | 0 (491) | DUEL 22/50, chocs 9 ; 14/30 ; **« rivalité » tombe (96 / 103)** |
| forme 0,10 | 0 | 4 | 125 | 12/30 |
| forme 0,15 | 1 | 4 | 213 | — |
| forme 0,10 + IA_PROFITER_ERREUR | 1 | 5 | 21 | — |
| forme 0 + IA_LENT_COTE_A_COTE 1 | 1 | 1 | 1831 | — |
| feux du départ simulés (SIMULATION_FEUX 1), forme 0 / 0,02 / 0,05 | 1 / 0 / 0 | 0 / 0 / 2 | 449 / 0 / 241 (et 2 barrières+coupes) | 9/30 et 12/30 (forme 0 / 0,02) |

Conclusion honnête : en 5 tours, l'arrivée est la grille (29 ou 30 fois sur 30, quel que soit le réglage). Même une forme de 15 %
(le poleman jusqu'à 15 % moins rapide) ne change pas le vainqueur : le blocage n'est pas le rythme, c'est qu'une IA ne double pas la
voiture de tête (elle la rattrape et reste derrière). Les départs simulés (les feux et le départ raté de chacun) ne le changent pas
non plus. En 12 tours, c'est le cycle des arrêts qui fait 40-45 % de vainqueurs ≠ poleman, et la forme n'y ajoute rien de mesurable
(12 à 14 sur 30 dans le bruit). Choix réversible : IA_FORME 0,02 (vert, effet faible : les IA perdent en moyenne ~0,8 % de rythme) ;
0,05 et plus cassent « rivalité » sans rien gagner. Si le Chef préfère une main au bit près d'avant : IA_FORME 0.
La piste suivante, à mon avis, est l'attaque de la voiture de tête (préparer l'attaque plus tôt quand l'attaquant est nettement plus
rapide, IA_BATAILLE_PLONGER réglé plus doucement), pas le rythme ; c'est un travail de plusieurs tours, avec les garde-fous des chocs.

Sortie des tests : cd149f8 (IA_FORME 0,02, plus la page de mesure) : GitHub 18/18 vert. dc88c36 (0,05) : rouge (courses : rivalité
96 / 103 ; ecrans-1 : le test « manette » du menu pause, sans lien apparent). Le commit final (0,02, page de mesure retirée, main fusionné) :
le passage est donné dans le message final au Chef.
Ce que je n'ai pas pu vérifier : la course du joueur dans la page (pas de test Chrome sur le Mac) ; ecrans-6 « sensations » est tombé une
fois (fc80816, 26 contre 25 appels) puis passé sur les 3 passages suivants : il semble instable.
Réévalue.
