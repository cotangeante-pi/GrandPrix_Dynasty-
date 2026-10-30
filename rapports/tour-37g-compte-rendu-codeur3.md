# Tour 37g — compte rendu du Codeur 3 (2026-10-30) : les bulles d'aide des aides au pilotage

Branche codeur3, partie de d0a484c.

1. **La première ouverture du choix des aides** : l'aide au premier usage `choixAides` (aides.js, genre « menu »). Elle s'affiche par-dessus le choix des aides et dit, en une ligne :
   > « La direction te guide, le freinage ralentit avant les virages, les autres évitent les glissades. Aide coupée : bonus ! »

   Chaque bouton du choix dit aussi, en une phrase simple, ce que fait son aide (`aidesQuoi_*`), par exemple « Freine à ta place quand un virage arrive trop vite ». L'aide `duel` du paddock laisse la place à celle-ci pendant que le choix est ouvert.
2. **La voiture vivante** : l'aide `vivante` (genre « course »), à la première course en expert ou en légende, en ligne droite, jamais à deux ni au tournoi :
   > « Voiture vivante : si tu freines en tournant, l'arrière peut glisser. Freine droit, puis tourne. »
3. **La leçon du freinage** : son but dit maintenant « Les aides au pilotage se choisissent avant la course (🛞) », avec le bouton 🛞 juste à côté dans le menu des leçons.

**Tests**
- tests/aides.html : 13 aides au lieu de 11 ; chaque nouvelle aide a son moment, son texte en fr et en en (moins de 130 caractères, jamais genré) et sa condition (pas hors d'expert ou de légende, pas à deux, seulement quand le choix est ouvert). Résultat : 20/20.
- tests/paquet.py : la bulle apparaît bien à la première ouverture du choix, et les quatre phrases sont là. Résultat : 68/68 sur le Mac.
- tests/textes.html : 1267/1267.
