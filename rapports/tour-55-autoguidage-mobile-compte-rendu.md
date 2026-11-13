# Tour 55 : couper l'auto-guidage sur téléphone (Codeur 4, branche autoguidage-mobile)

Demande du propriétaire (2026-11-12) : « dans mobile, il faut pouvoir désactiver l'auto-guidage ».

Cause : aucune aide n'est forcée en tactile. Le titre simple (tour 53c) cachait « Aides » au doigt, et le premier lancement (découverte, niveau débutant, toutes les aides allumées) n'a pas de paddock. L'écran de choix, lui, débordait en 640×360 (le bouton OK à 405 px sur 360).

Fait : « Aides » reste au titre simple (44 px) ; le choix des aides tient en 640×360 sans défilement (2 × 2 boutons de 44 px) ; test tactile `index.html?test=tactile-aides` (tests/ecrans.py) ; CLAUDE.md mis à jour. Non testé sur le Mac (verrou /tmp/gpd-tests.lock tenu plus de 40 minutes par un autre Codeur) : à lire sur GitHub.
