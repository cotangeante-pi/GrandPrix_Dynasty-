# Tour 37e — compte rendu du Codeur 3 (2026-10-30)

Branche codeur3, 45b1bd1. Le passage GitHub 41138140818 est **vert, 16 parties sur 16**.

## 1. Les deux défauts
- « Gaston Virage : » en anglais : principal.js passe par `deuxPoints` aux deux endroits, la course et le résumé.
- « 1 pts » : `accorder` connaît maintenant pts → pt, en anglais et en français. Les points du paddock, des résultats, du championnat et du tournoi, ainsi que le nombre de tours, passent par `accorder`. Le compteur animé du paddock finit lui aussi sur « pt ».

## 2. Les aides au pilotage choisies avant la course (le propriétaire, 2026-10-30)
- **Quatre aides, une par une, à tous les niveaux** : direction assistée, freinage assisté, anti-blocage (une aide à part, avant comprise dans le freinage) et antipatinage. Le niveau ne donne que le réglage proposé : tout allumé en débutant, tout coupé ailleurs. L'« auto-guidage » du propriétaire, c'est la direction assistée et le freinage assisté.
  - Fichier assistance.js. Toutes les aides allumées, il se comporte comme au tour 41.
- **On choisit avant la course** : l'écran « 🛞 Aides au pilotage » s'ouvre par-dessus l'écran du moment, depuis le titre (donc avant la course de découverte), le paddock (en bas au milieu), la course rapide et le menu des leçons. Il montre une aide par bouton, avec sa part de bonus, et le bonus total annoncé.
- **Pendant la course, les aides sont figées** : le menu pause montre les quatre, et aucun clic ne les change. Le choix lui-même refuse tout changement en qualification, en course, en pause et sur la grille.
- **Le bonus** : `ASSIST_BONUS` dans donnees.js (direction 15 %, freinage 10 %, anti-blocage 3 %, antipatinage 0 %, soit 28 % au plus). La part s'applique aux gains de la course, arrondie à la centaine, dans `ARGENT_PLAFOND_COURSE`. L'écran des gains affiche « bonus pilotage sans aide : +N € ». Seul l'argent change : ni les points, ni les records.
- **Entre amis**, il n'y a pas d'argent : chaque joueur a un bouton « 🛞 Aides : oui / non » (toutes les aides ou aucune). Il est sur l'écran à deux et sur chaque ligne de l'inscription au tournoi, gardé dans la sauvegarde (par joueur à deux, par prénom au tournoi). La marque 🛞 suit le nom dans les moitiés d'écran, au podium à deux, dans « À toi ! » et dans les classements du tournoi. Le choix des aides dit qu'il n'y a pas de bonus dans ce mode.
- **Ancienne sauvegarde** : elle se charge avec les aides de son niveau. Une sauvegarde du tour 41, qui n'avait pas d'anti-blocage à part, le reprend de son freinage assisté.

## Tests
- **tests/test.html** :
  - le bonus est exact pour les 16 combinaisons d'aides, et vaut 28 % au plus ;
  - toutes les aides allumées donnent les gains d'avant, à l'identique ;
  - le plafond tient ;
  - l'anti-blocage est à part, et une sauvegarde du tour 41 le reprend de son freinage.
- **tests/paquet.py** :
  - le choix au paddock (deux clics, sauvegardé, bonus annoncé) ;
  - le bonus sur l'écran des gains, et aucun bonus quand toutes les aides sont allumées ;
  - le choix gardé après rechargement ;
  - les boutons sur les quatre écrans ;
  - la marque à côté du nom au tournoi et à deux, sans bonus à deux ;
  - les accords en anglais et en français (aucun « 1 pts », « 0 victoires »…).
- **tests/ecrans.py**, des tests mis à jour pour suivre la règle du propriétaire :
  - le menu pause montre les quatre aides, figées : un clic ne change rien ;
  - la direction est proposée à tous les niveaux ;
  - les gains attendus comptent les aides ;
  - le nom est suivi de la marque 🛞 ;
  - « 0 pt ».

## Ce que je n'ai pas vérifié
- Un vrai Grand Prix joué sans aide jusqu'à l'écran des gains : le bonus est vérifié par le calcul, et par l'écran rempli avec un classement inventé.
- Le balayage complet des pluriels sur tous les écrans : seuls le paddock, le calendrier, une fiche, l'album et l'arbre sont lus en anglais et en français.
