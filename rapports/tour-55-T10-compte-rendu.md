# Tour 55, T10 : les exclamations dans le jeu (Codeur 4, branche voix-jeu-55)

- 38 prises Bark (voix fr 7 : 34, voix fr 4 : 4) remplacent les sons provisoires : sons/voix/fr-<groupe>-<n>.m4a, 16 groupes.
- VOIX_SONS vrai par défaut (réversible : faux = le jeu d'avant), VOIX_SONS_LANGUES = ['fr'] : en anglais, la synthèse comme avant ; les anciens sons en- sont retirés (ils restent dans l'historique git).
- Poids : 560 Ko de sons (425 Ko compressés), zip entier 1,25 Mo.
- Non fait : « remontée » (pas un fait du commentateur).
- Non testé sur le Mac (pas de Node ici, le verrou des tests occupé) : tests/test.html et tests/paquet.py à lire sur GitHub.
- Règles des voix respectées : Bark (MIT) seulement, aucune voix de vidéo, aucune imitation, jamais la voix du propriétaire.
