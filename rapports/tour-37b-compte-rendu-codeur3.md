# Tour 37b — compte rendu du Codeur 3 (2026-10-29)

Branche codeur3. Commits : eb8db9f (le français neutre) et le dossier poki/ (fusionné avec main : a24e4d3). Seuls textes.js et les tests ont été touchés, plus une ligne d'un de mes anciens tests dans ecrans.py (voir plus bas).

## 1. Le français ne genre plus le joueur
J'ai cherché dans textes.js les adjectifs et participes accordés qui visent le joueur (« je suis… », « tu es… », « t'a battu », « m'a poussé », « vous êtes… »).

| Clé | Avant | Après |
|---|---|---|
| dis_paix_deja | Mais on n'était pas fâchés, si ? | Mais il n'y avait pas de dispute entre nous, si ? |
| bravoQuestion | Prêt pour ta carrière ? | On lance ta carrière ? |
| pat_statut_accepte | tu seras notre premier pilote / tu es le numéro un de l'écurie | la première voiture de l'écurie, ce sera la tienne / l'écurie roule d'abord pour toi |
| pat_statut_deja | Tu es déjà notre premier pilote. | La première voiture de l'écurie, c'est déjà la tienne. |
| duelSaisonPerdu | {nom} t'a battu {b} à {a} | {nom} a fini devant toi, {b} à {a} |
| interview_duelPerdu_q | …t'a battu aujourd'hui. Inquiet ? | Même écurie, et {rival} a fini devant toi aujourd'hui. Ça t'inquiète ? |
| interview_contact_q | {rival} et toi vous êtes touchés fort. / {rival} n'avait pas l'air content… | Gros contact entre {rival} et toi. / {rival} n'a pas apprécié votre contact, on dirait. |
| interview_duelGagne_calme | {rival} m'a poussé toute la course | {rival} ne m'a rien laissé de toute la course |

- Le test est dans tests/textes.html : une liste de formes genrées (fâché(e), prêt(e) pour, t'a battu(e), m'a poussé(e), tu es notre premier pilote, tu es le numéro un, vous êtes touché(e)s, Inquiet ?, pas l'air content(e), « tu es / je suis » suivi d'un adjectif accordé). Aucune ne doit revenir dans un texte français. Un second test vérifie que les phrases corrigées ont gardé leur sens.
- Résultat : 1232/1232 avec osascript. J'ai réinjecté trois anciennes formes : le test les attrape.
- tests/ecrans.py, ligne du duel de la saison : le texte attendu passe à « a fini devant toi ». Ce test est à moi (tour 24c).
- Le passage GitHub de eb8db9f est vert (40960521052, 16 parties).

## 2. Le dossier poki/ (hors du zip, propositions À VALIDER par le propriétaire)
- **poki/captures.py** fait les captures promotionnelles 16:9 en 1920×1080, dans un contexte neuf (sans sauvegarde) :
  - 1-depart-feux : les cinq feux rouges, la grille devant ;
  - 2-bataille : le peloton groupé après le départ ;
  - 3-pluie : sous la pluie ;
  - 4-podium ;
  - 5-paddock.
  Chaque scène existe en `-fr.jpg` et en `-en.jpg` dans poki/captures/. Le script tourne en 3 minutes environ sous le verrou, sans erreur de page. Seule la bulle des aides est masquée.
- **poki/fiche-poki.md** donne, en anglais et en français : le titre, une description courte (≈ 120 caractères), une description longue, les points forts et les commandes (clavier, 2 joueurs, manette). Il n'y a aucun nom de vraie marque.
- Le dossier poki/ n'entre pas dans le zip : paquet.py ne prend que les fichiers que charge index.html.

## Ce que les captures ont montré (hors de mes fichiers, pour le Chef)
- Les rivaux et les écuries s'appellent encore « Pilote 2 » et « Écurie 1 » (« Driver 2 », « Team 1 ») : `NOMS_PILOTES` est vide dans donnees.js. C'est le plus gênant pour Poki.
- En anglais, interface.js:185 écrit « Teammate duel : You… », avec une espace française avant les deux-points.
