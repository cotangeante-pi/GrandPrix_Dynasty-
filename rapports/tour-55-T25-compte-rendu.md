# Tour 55, T25 : voix des nouveautés (Codeur 6, branche voix-nouveautes)

- Phrases (tests/voix hors dépôt, liste scripts-n55/liste.json) : 11 phrases pour 5 faits. Bark (MIT) voix fr 7 seule, 62 prises jusqu'à 8 h 45, tri Whisper + note >= 0,7.
- Gardées au tri : drapeau jaune 3, VSC 2, drapeau vert 2, domicile 2 = 9 prises ; DANS LE JEU : 4 (une par groupe, les plus courtes : 9 dépassaient le plafond de 8 Mo de mémoire, 9,02 Mo) (fr-<groupe>-<n>.m4a, copiées telles quelles du tri). Rien pour « aileron abîmé » : la synthèse le dit.
- Code : voix-sons.js (4 groupes), commentaire.js (nouveau fait degats, com_degats fr/en, priorité 6), tests/test.html (20 groupes, test du fait degats), tests/paquet.py (47 sons).
- Aucune voix de vidéo, aucune imitation, jamais la voix du propriétaire ; poids : environ 140 Ko de plus.
