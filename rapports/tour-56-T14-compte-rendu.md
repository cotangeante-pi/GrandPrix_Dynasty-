# Tour 56, T14 : compte rendu (branche tactile-tout)

Vert sur GitHub au commit 2344aca (origin/main de fusion-56b fusionné dedans, `tests/tourne-css.py --verifier` vert).

- Pneus pendant l'arrêt au stand : rangée de boutons (`#tactilePneus`, 44 px), le pneu monté est surligné, un toucher le choisit ; la vitesse et les pneus du HUD s'effacent pendant l'arrêt (rien ne se recouvre).
- Bouton caméra 🎥 (40 px), comme la touche C.
- Textes sans touche au doigt (grille, résumé, une, podium, pneus, leçons) : clés `tac_*` lues par `texteDoigt`.
- Inventaire complet : `rapports/tour-56-T14-inventaire.md`. Tab (spectateur) et la caméra libre restent des outils de test sans bouton.
- Test : page `test=tactile-pneus` (640×360, toucher) : pneus, caméra, ↩, ⏸, rétroviseur, textes.
- Pas lancé sur le Mac (verrou tenu plus d'une heure) : un premier passage GitHub a trouvé le chevauchement de la rangée avec FREIN et le HUD, corrigé.
