# Tour 55, T29 : la mémoire des voix (Codeur 4, branche voix-memoire)

- Mesure : 41 prises, 54 s de son, mono, AAC 32 kHz. Décodées au contexte du jeu (48 kHz) : environ 10,4 Mo (le « 25 Mo » du T27 était une surestimation).
- Correction : décodage à 24 kHz (la fréquence de Bark) par un OfflineAudioContext : environ 5,2 Mo (objectif < 8 Mo atteint). Même qualité (les prises viennent de Bark à 24 kHz), aucun retard au jeu (le décodage reste au chargement, après la découverte, jamais au moment de la voix ; le son joué est le même AudioBuffer). VOIX_SONS_FREQUENCE = 0 rend le comportement d'avant.
- Pas fait : décodage à la demande (inutile sous 8 Mo ; il aurait mis la voix en retard).
- Tests : tests/test.html (memoire()), tests/paquet.py (moins de 8 Mo en vrai Chrome depuis le zip). Non mesuré sur le Mac : à lire sur GitHub.
