TOUR 56 — compte rendu du Codeur 5 — T12 : l'anglais et les aides « en ligne »
Branche : enligne-aide (construite sur enligne-ecrans), commit 867f10e, GitHub 18/18 (run 43568616875)

Fait :
- Deux bulles d'aide, une fois chacune (aides.js) : `enligne` (au menu En ligne : créer une salle et envoyer ses 4 lettres, ou taper celles d'un ami) et `enligneSalle` (dans la salle : « C'est bon pour moi », l'hôte choisit et lance, les réactions). En 640×360 la bulle de la salle est cachée (la salle est pleine ; la ligne d'état dit déjà quoi faire).
- « ❓ Comment jouer en ligne » / « How to play online » : un bouton du menu En ligne affiche quatre étapes à la place du menu ; un second appui ou Échap revient.
- Textes fr et en naturels et courts, sans genrer le joueur (le test de textes l'a fait remplacer « Je suis prêt » par « C'est bon pour moi » ; en anglais « I'm ready »).
- Tests : tests/aides.html (30/30 : bulles en ligne, textes fr/en), tests/textes.html (1795/1795), tests/ecrans.py (pages test=enligne : « Comment jouer » dans l'écran, Échap).

Trouvé en route : `.boutons:first-of-type` visait le mauvais élément (premier div de la section) : la rangée Créer / Rejoindre a maintenant un id.
Pas vérifié : la bulle d'aide de la salle en 960×600 sur de vrais écrans (captures seulement sur GitHub).
