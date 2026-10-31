# le propriétaire : publier sur Poki, dans l'ordre (À VALIDER)

1. Choisis les noms des 19 rivaux et des 10 écuries dans `poki/noms-a-valider.md`, et dis-les au Chef : un Codeur les met dans le jeu.
2. Relis et corrige `poki/fiche-poki.md` : le titre, les deux descriptions et les commandes, en anglais et en français.
3. Mesure les images par seconde sur ton Mac, l'écran ouvert : `python3 tests/perf.py --fois 3`. Il en faut 60 avec 20 voitures ; donne le résultat au Chef.
4. Fais le paquet : `python3 tests/paquet.py`. Il crée `dist/grand-prix-dynasty.zip`.
5. Ouvre inspector.poki.dev, dépose ce zip et joue : le titre, une course, la pause, une pub entre deux Grands Prix. Note ce qui est en rouge.
6. Choisis les captures dans `poki/captures/` (16:9, en anglais pour Poki) et envoie le tout à Poki avec la fiche.
