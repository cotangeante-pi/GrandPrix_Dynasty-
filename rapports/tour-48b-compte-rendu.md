TOUR 48b — compte rendu du Codeur 2 (branche saison2-drift)
Commits : 379edb9 (saison 2), 3d50d50 + 85cc5ba (drift caché ; fusionnés sur main, passage GitHub 42111610222 vert 16/16) ; puis le commit de ce compte rendu (textes de la légende, test du fantôme)
Ordres : 1 fait / 2 fait / suite du Chef : 1 fait / 2 fait / 3 fait (ce fichier)

## 1. La saison 2 sur test/technique (379edb9, passage 42107652539 vert 16/16)
- Cause du Chef confirmée : 13bbb85 (2026-10-27) a changé `CALENDRIER_CIRCUITS` de ['test','technique'] aux 12 tracés ; le calendrier est gardé dans la sauvegarde et `CHAMPIONNAT.completer` ne le refaisait pas (nouvelleSaison le reconstruisait déjà). Une carrière commencée avant le 27 gardait donc l'ancien calendrier.
- championnat.js : `remettreCalendrier(ch)` en tête de `completer` (chargement et nouvelle saison) : chaque Grand Prix pas encore couru (indice ≥ prochain) sur un circuit d'essai (`CIRCUITS_ESSAI: ['test','technique']`, donnees.js) reprend le tracé de sa place dans le calendrier actuel. Courus, points, résultats, argent intacts ; l'objectif de sponsor « dans les 5 premiers à … » sur un circuit remplacé suit le premier Grand Prix à venir qui était dessus. Saisons neuves : `CHAMPIONNAT.calendrierNeuf()` (creer et nouvelleSaison).
- Choix réversible : les Grands Prix déjà courus gardent leur vrai circuit (test/technique), pour ne pas réécrire l'histoire.
- Test (test.html) : une vieille sauvegarde v4 fabriquée sur test/technique (3 GP courus, solde 123456, sponsor sur « technique ») → au chargement, les 3 courus restent, les 9 à venir sur les 12 tracés, tout le reste identique, sponsor sur un vrai tracé ; la saison 2 sur les 12 ; une saison 2 déjà commencée sur test/technique repasse entièrement sur les 12.

## 2. Le pneu drift caché (3d50d50, 85cc5ba)
- Un seul réglage : `PNEU_DRIFT: false` (donnees.js). `METEO.TYPES` devient un getter sans 'drift' (garage, ← → à l'arrêt, bulle « pneus ») ; `PNEUS_CHOIX.secs()/tous()` filtrés (choisirDepart / choisirArret refusent le drift) ; physique.js : un pneu 'drift' passe en 'slick' au pas de physique et `voitureVivante` = 0 (la glisse pour personne, au bit près) ; tutoriel.js : `LECONS` / `PAR_ID` en getters, 7 leçons ; reglages.js : le curseur VOITURE_VIVANTE caché ; `CHAMPIONNAT.completer` : un `pneusDepart` 'drift' devient 'slick'.
- `?drift=1` met ce même réglage à vrai (tests de page) ; `?pneus=drift` n'agit que rallumé. Le code drift est gardé, éteint.
- Tests : test.html « drift caché » et « drift rallumé » ; tutoriel.html 7 leçons / 8 rallumées ; recoins.py : un pneu drift posé roule comme l'adhérant au bit près (page) ; ecrans.py : garage à 4 boutons sans texte drift, liste de 7 leçons sans texte drift. Les tests qui mesurent le drift lui-même le rallument (réglage ou `&drift=1`) ; le tableau des pneus d'officiels reste bon (écart max ≤ 0,72 %).

## Suite du Chef
1. Les textes de la victoire en légende (une `legendeVictoire`, interview `legende`, et par l'exploit les discussions et les patrons) parlent de la voiture qui glisse : avec `PNEU_DRIFT` faux, ces faits ne sont plus produits (journal.js, interview.js) ; une victoire en légende est une victoire ; un vieil exploit `legendeVictoire` sauvegardé est oublié au chargement (championnat.js). Rallumé, tout revient. Test « drift caché : la victoire en légende… » (test.html). Pas touché : une ancienne une déjà rangée dans l'album reste telle quelle (c'est le passé).
2. Le test du fantôme « −0,34 en vert » : l'écart est maintenant posé et lu dans le même appel (aucune image du jeu entre les deux) ; ce qu'il vérifie ne change pas.

Sortie des tests : 85cc5ba, GitHub 42111610222 vert 16/16 (moteur 349/349, officiels 70/70, recoins 142 + 144, annexes dont tutoriel 20/20, aides 20/20). Le passage de ce commit : voir le message au Chef.
Mesures : aucune (rien ne touche l'affichage ; la voiture adhérant est la même au bit près).
Ce que je n'ai pas pu vérifier : le moteur sur le Mac (plus de 300 s, Mac chargé) : GitHub seulement ; tutoriel.html et aides.html passés sur le Mac sans Chrome (JavaScriptCore). La vraie sauvegarde du propriétaire n'est pas vue (carrière commencée avant le 27 ? à lui demander).
Réévalue.
