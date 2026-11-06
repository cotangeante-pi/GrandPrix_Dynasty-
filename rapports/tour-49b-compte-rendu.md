TOUR 49b — étape 13b (puis 11e, les touches) — compte rendu du Codeur 2 (branche defi-fantome)
Commits : 8610f39 (le défi), 4ada130 (le défi au tournoi chrono), de8b862 (les touches au choix), puis ce compte rendu
Passages GitHub : 42141622340 (8610f39), 42143691655 (4ada130), 42146857012 (de8b862) : verts, 18/18
Ordres : 1 (le défi du fantôme) fait / 2 (les touches au choix, si fini avant 23h) fait

## 1. Le défi du fantôme entre amis (étape 13b)
- `defi.js`, en calcul pur :
  - `DEFI.coder` et `DEFI.decoder` ; le code a la forme `GPD-SPAA-2:06.170-1-<données>-<somme>` ;
  - le circuit et le temps sont en clair, puis la version (`DEFI_VERSION`) ;
  - les données : le nom, le casque, l'aileron, les aides, puis le fantôme compact de fantome.js en entiers, chaque valeur écrite comme l'écart à la précédente, avec 64 signes (5 bits par signe, un bit pour dire « la suite ») ;
  - la somme de contrôle est un FNV-1a sur 32 bits ;
  - le fantôme décodé est le même au bit près.
- Ce qui est refusé, avec une raison affichée :
  - vide, ou pas la bonne forme ;
  - une autre version ;
  - un code abîmé (la somme) ;
  - un circuit inconnu ;
  - un tour impossible : nombre d'images incohérent avec le temps, une image à plus de `DEFI_VITESSE_MAX` de la précédente, ou une distance différente de la longueur du circuit à 5 % près.
- Réglages `DEFI_*` dans donnees.js.
- À l'écran :
  - « 📋 Défier un ami » après un tour de qualification valide (et au tournoi chrono, sous le classement de la manche, pour un tour sans virage coupé) : le code dans un champ, avec « Copier » ;
  - « 🎯 Relever un défi » dans « Entre amis », donc depuis le titre et le paddock : on colle le code, il est vérifié puis gardé ;
  - la page `?defi=1` : le tour de qualification seul, contre le fantôme de l'ami (seulement dessiné, aucun contact), avec l'écart en direct ;
  - à l'arrivée : « Défi relevé ! −0,312 » ou « Encore 0,450 », le défi (nom, temps, circuit, aides), « Recommencer », « 📋 Renvoyer mon code », « Retour » ;
  - Échap pendant le tour abandonne (pas de temps).
- Sauvegarde : `defis` à la racine (`enCours`, la liste des défis reçus avec leur meilleur écart, `DEFI_LISTE_MAX` au plus). Une ancienne sauvegarde se charge sans défi.
- Tests (test.html) :
  - codé puis décodé, c'est le même fantôme et les mêmes positions ;
  - un caractère abîmé, à 300 places, est toujours refusé ;
  - la version, le vide, la forme, un circuit inconnu ;
  - trois tours trafiqués avec une bonne somme sont refusés ;
  - Spaa tient en 10 713 caractères, sous 30 000 ;
  - contre soi-même : écart final 0 ;
  - la liste des défis reçus.
- Tests (ecrans.py) :
  - `test=defi` : tout le parcours dans la vraie page, code abîmé refusé, écart 0 avec le même robot ;
  - `test=tournoi` : le bouton après un tour, absent après un abandon.
- Mesures :
  - code du circuit test 4 995 caractères ; technique 5 303 ; Spaa 10 713.
  - Écart en direct contre soi-même : au plus 34 ms sur le technique. Il vient de l'interpolation du fantôme entre ses images toutes les 0,1 s ; il est identique au bit près avec le fantôme d'origine.

## 2. Les touches au choix (étape 11e, troisième point)
- `clavier.js`, en calcul pur :
  - les touches de la course seule (gaz, frein, gauche, droite, retour en piste, caméra, pause) et des deux joueurs (gaz, frein, gauche, droite, retour) ;
  - celles de départ sont `TOUCHES_SEUL` et `TOUCHES_DEUX`, les touches d'aujourd'hui ;
  - une touche déjà prise est refusée, avec le nom de la commande qui l'a ; à deux, une touche ne peut jamais servir aux deux joueurs ;
  - Échap ouvre toujours la pause et ne sert à rien d'autre ;
  - gardées à la racine de la sauvegarde (null = celles de départ).
- L'écran « ⌨ Touches » s'ouvre depuis la page Réglages du paddock : trois colonnes, un clic sur une commande puis la touche voulue, Échap annule, « Par défaut », « Retour ».
- La conduite lit les touches choisies : `TOUCHES`, la caméra, le retour en piste, la pause choisie en plus d'Échap, et `REGLAGES.TOUCHES_DEUX` pour l'écran partagé.
- Tests :
  - test.html : les touches de départ, une ancienne sauvegarde, changer, prise, Échap, à deux, par défaut, et la conduite (I accélère, ↑ et W ne font plus rien ; à deux, I seulement pour le joueur 1) ;
  - ecrans.py `test=clavier` : l'écran tient en 960×600, I sur le gaz, I refusé pour le frein, Échap annule, dans une course I accélère, « Par défaut ».

## Ce que je n'ai pas pu vérifier
- Sur le Mac, la page `test=defi` n'a pas pu tourner (charge du Mac 30 à 40, délais dépassés). Tout est vérifié sur GitHub.
- Le test du bouton au tournoi n'est pas strict : il vérifie que le bouton suit l'état du tour. Si le robot coupe un virage sur le circuit tiré au sort, le bouton est caché et le test passe sans montrer de code. Je ne sais pas si le code a été montré dans ce passage.
- Le défi n'est pas proposé après une course seule : elle n'enregistre pas de fantôme aujourd'hui.
- « ⌨ Touches » n'est que dans les Réglages du paddock : ni au titre, ni dans le menu pause.
- Une touche choisie remplace les deux touches de départ d'une commande (par exemple ↑ et W pour le gaz) ; « Par défaut » les rend.
- Le vrai presse-papiers n'est pas testé (Copier essaie `navigator.clipboard`, puis la sélection du champ).

Réévalue.
