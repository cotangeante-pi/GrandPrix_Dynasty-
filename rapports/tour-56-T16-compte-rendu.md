# Tour 56, T16 : le téléphone debout de bout en bout (branche debout-partout)

Vert 18/18 sur GitHub au commit 415a063 (en fusion vers main).

Fait
- `tests/debout.py` (hors workflow, sur le Mac, sous verrou) : profils iPhone SE, iPhone 13, Pixel 7, Galaxy S9+ tenus debout (jeu tourné). Parcours au doigt : titre, découverte (sauf TEL_COURT=1), qualification, course contre des IA, 🎥 ↩ ⏸ puis la pause, arrêt au stand avec un toucher sur chaque bouton de pneu, arrivée, podium. Audit de mise en page à chaque écran (celui de telephones.py, avec deux corrections pour le jeu tourné : défilement du menu sur l'autre axe, body.scrollWidth).
- Défaut trouvé et corrigé : sur iPhone SE debout le jeu mesure 568×320 et la rangée de pneus (en bas, 44 px) sortait de l'écran. Elle est maintenant en icônes (52×44 px) en bas au centre, le bandeau de l'arrêt monte au-dessus (`body.tactileStand`), la vitesse et les pneus du HUD s'effacent pendant l'arrêt.
- Mesuré sur le Mac : debout.py iPhone SE 34/34 ; ecrans.py tactile-pneus 19/19.

Pas fait
- iPhone 13, Pixel 7 et Galaxy S9+ debout : le script est prêt, mais seul l'iPhone SE a tourné jusqu'au bout (verrou du Mac tenu des heures).
- Rien essayé sur un vrai téléphone.
