# Tour 56, T14 : chaque touche du jeu a-t-elle un geste au doigt ?

Demande du propriétaire (2026-11-13) : « tous les boutons à faire sur clavier, traduis-les en mobile (ex : boutons pour changer les roues) ».
Sources lues : `principal.js` (`brancherClavier`, `choisirPneusArret`, `toucheVirtuelle`), `touches.js`, `clavier.js`, `camera.js`, `donnees.js` (`TOUCHES_SEUL`, `TOUCHES_DEUX`), `manette.js`, et tous les textes de `textes.js` qui citent une touche.

## Les touches de la course (une seule personne)

| Touche | Ce qu'elle fait | Au doigt avant | Au doigt après (T14) |
|---|---|---|---|
| ↑ / W (Z) | gaz | bouton GAZ | inchangé |
| ↓ / S | frein | bouton FREIN | inchangé |
| ← → / A D (Q D) | direction | volant (incliner) ou boutons ◀ ▶ | inchangé |
| Espace | retour en piste | bouton ↩ | inchangé |
| Échap | pause | bouton ⏸ (et le téléphone debout) | inchangé |
| M | son | bouton 🔊 | inchangé |
| **C** | **caméra suivante** | **rien** | **nouveau bouton 🎥** (40 px, dans la rangée 🔊 ⏸ ↩, `tactileCamera`) |
| **← → pendant l'arrêt au stand** | **choisir les pneus** (adhérant, intermédiaires, pluie, drift si permis) | **rien** (◀ ▶ n'existent pas quand le volant conduit) | **nouvelle rangée de boutons de pneus** (≥ 44 px) sous le bandeau de l'arrêt ; le pneu monté est surligné ; un toucher le choisit |
| Entrée | passer au podium, après l'arrivée | bouton « Passer au podium » | inchangé (texte sans « (Entrée) » au doigt) |
| une touche | passer la grille vue d'en haut, la une du journal | un toucher (clic sur l'écran) | inchangé (texte « touche pour passer ») |
| Échap / clic | sortir du résumé vidéo | un toucher | inchangé (texte « Touche pour sortir ») |
| ← → (album des unes) | feuilleter | boutons ◀ ▶ ⏮ ⏭ | inchangé |
| consigne d'équipe (« lève le pied ») | frein (↓) | bouton FREIN | inchangé (texte « FREIN » au doigt) |
| rétroviseur oui / non | pas de touche : bouton de la pause et de ⚙ Réglages | bouton ≥ 40 px | inchangé ; touché dans le test (⏸ → rétroviseur → Reprendre) |
| Tab | voiture suivante en course | rien | **laissé tel quel** : n'existe que dans la course vue en spectateur (`?ia=N` sans `joueur=1`, outil de test) ; après son arrivée, le joueur change de voiture en touchant une ligne du classement (déjà fait au tour 53) |
| W A S D / flèches (`?camera=libre`) | caméra libre | rien | **laissé tel quel** : outil de développement |

## Hors course

| Touche | Au doigt |
|---|---|
| Entrée dans les champs de texte (discussion, code de défi) | le clavier du téléphone a sa touche Entrée ; les boutons « Envoyer » / « Courir » existent |
| Touches au choix (page « Touches ») | réglage de clavier : sans objet sur un téléphone (déjà retiré du titre simple) |
| Manette (A, B, Y, Start, croix) | sans objet : une manette n'est pas un doigt |
| Deux joueurs (ZQSD et flèches) | pas au téléphone (décision du tour 51k : une personne, un téléphone) |

## Les textes qui citaient une touche (« appuie sur … »)

Déjà au doigt avant T14 : `tac_aideGaz`, `tac_aideDirection`, `tac_aideFrein`, `tac_departAide`, `tac_aide_depart`, `tac_aide_consigne`, `tac_tourne`.

Ajoutés par T14 (clé `tac_<clé>`, lue par `texteDoigt` seulement sur un écran tactile ; sans écran tactile, les textes du clavier sont ceux d'avant, au caractère près) :
`standPneusChoisi` (« Pneus : X — touche un pneu pour changer » au lieu de « ← → pour changer »), `grillePasser`, `resumeSortir`, `unePasser`, `passerPodium`, `tuto_conduite_consigne`, `tuto_depart_consigne`, `tuto_raison_attente`.
Non touchés parce que jamais vus au téléphone : `aideConduite` (l'aide du clavier est cachée en `body.tactile`), `deuxTouches*` et `aToiAide` (deux joueurs, tournoi chrono à plusieurs sur un même clavier), `touches*` (page des touches).

## Test

`tests/ecrans.py`, page `?course=12&ia=3&joueur=1&robot=1&circuit=test&test=tactile-pneus` (écran tactile émulé, 640×360) :
la rangée de pneus est cachée hors de l'arrêt ; pendant l'arrêt elle a un bouton par pneu, chacun ≥ 40 px, dans l'écran, sans rien recouvrir (🔊 ⏸ ↩ 🎥, bandeau, minicarte, radar, vitesse, GAZ, FREIN) ; un vrai toucher sur chaque pneu le choisit et le surligne ; la voiture repart avec le pneu touché ; la rangée se cache après l'arrêt ; le bouton 🎥 change la vue comme C ; ↩ demande le retour en piste ; ⏸ ouvre la pause, le rétroviseur s'y bascule au doigt, « Reprendre » rend la course ; aucun des textes ci-dessus ne cite une touche.

Téléphone debout (T15, `html.tourne`) : tous ces boutons sont dans `#tactile`, tourné avec la page ; `tests/tourne-css.py --verifier` est vert.
