TOUR 59 — « fais tout » — rapport du Chef
Date : 2026-11-17 20h20 (le propriétaire : « fais tout, avec les codeurs, tu es le chef, modèles moyens, jusqu'à ce que tout soit fini, caffeinate, GitHub Actions »)
Commit vérifié : main 4b17633 (code de a579974, GitHub 18/18)
Note : 96/100 (inchangée depuis le 2026-11-06 ; voir SUIVI)
Pas d'heure de fin : jusqu'à ce que la liste « Ce qui reste » de CLAUDE.md (La reprise, tour 58) soit faite. Mac gardé éveillé (caffeinate -i -s -d, à arrêter à la fin).

Règles (celles du tour 57/58) : Codeurs sur Sonnet ; un Codeur ne pousse jamais sur main ; 18/18 sur GitHub avant chaque fusion (le Chef fusionne) ; aucune info personnelle (git grep -i avant de pousser) ; jamais `git stash` ; tests sur le Mac seulement la partie concernée, sous le verrou /tmp/gpd-tests.lock ; la suite complète sur GitHub (pousser sa branche, lire le passage par l'API, voir CLAUDE.md « Aller plus vite ») ; choix réversibles (un réglage dans donnees.js) ; rien d'hébergé ni d'envoyé à Poki ; EN_LIGNE faux.
GitHub ne donne que 20 travaux à la fois et un passage complet en prend 18 : **ne poussez que quand vous pensez avoir fini** (ou pour lire un échec qui ne se voit que sur Linux).
Fichiers partagés (textes.js, donnees.js, index.html, style.css, principal.js) : chacun ajoute ses blocs, sans reformater ni déplacer ceux des autres.

ORDRES

Codeur 1 — dossier « Grand Prix Dynasty - codeur 1 », branche `idees-58` (déjà sur GitHub, reprendre où le Chef s'est arrêté : 50c6aa5) — la conversation avec les pilotes
  1. Faire tourner `tests/banc-bavardage.js` (dans tests/banc-parle.html) et le compléter : chaque sujet en fr et en en, les questions en retour et leurs suites (oui, non, et toi, pourquoi, lol, un prénom, un âge), la mémoire (âge, animal et son nom, goûts, ressortis plus tard), une longue conversation (≥ 40 messages variés) sans répétition de la même phrase deux fois de suite ni « je ne comprends pas », un pilote fâché qui ne raconte pas sa vie, les actes de course inchangés, BAVARDAGE_ACTIF faux = les discussions d'avant au mot près — fini quand le banc est vert.
  2. `tests/textes.html` vert (pas de genre, pas de mot de l'autre langue, listes bav_l_* de même longueur fr/en) — fini quand vert.
  3. Corriger les défauts vus en jouant soi-même 3 conversations « d'enfant » (« t'as quel âge », « ta couleur préférée », « tu fais quoi ce week-end », « lol », « t'as un chien ? », fautes et langage SMS) en fr et en en — fini quand les 3 transcriptions sont dans le compte rendu, sans réponse à côté.
  4. Pousser `idees-58`, passage GitHub 18/18 — fini quand le lien du passage vert est dans le compte rendu.

Codeur 2 — dossier « Grand Prix Dynasty - codeur 2 », branche neuve `style-59` depuis origin/main — le nouveau style (CLAUDE.md, « La reprise », idée 2)
  1. Une direction artistique d'habillage télé de course, derrière un réglage (STYLE_TELE dans donnees.js + classe sur body ; faux = l'ancien style au pixel près) : formes taillées en biais, à plat, sans coins arrondis ni lueurs ni dégradés brillants, chiffres en grand, plus de liseré rouge à gauche de chaque bouton, titre sans l'italique et le petit trait — fini quand le titre, le paddock (toutes ses pages), le garage, la pause, les résultats et le podium ont le nouveau style.
  2. De vraies icônes dessinées (SVG en ligne, monochromes, dans un seul fichier icones.js) à la place des émojis du menu du paddock, des boutons du titre et de la pause — fini quand plus aucun émoji ne sert d'icône dans ces menus (les émojis dans les phrases restent).
  3. Les tailles ne changent pas (les tests d'écran mesurent les boutons ; ≥ 40 px au doigt) ; tests d'écran concernés verts sur le Mac — fini quand `ECRANS_PAGES=<page>` des pages touchées passe.
  4. Captures avant / après (titre, paddock, garage, pause, résultats ; 1280×720 et 640×360) dans rapports/captures-tour59/ — fini quand elles y sont et que tu les as relues toi-même.
  5. Pousser, 18/18 — lien dans le compte rendu.

Codeur 3 — dossier « Grand Prix Dynasty - codeur 3 », branche neuve `bugs-59` depuis origin/main — les bugs connus de SUIVI.md
  1. La saison 2 courue sur test/technique avec une vieille sauvegarde (SUIVI, « Bugs connus ») : au chargement, chaque Grand Prix pas encore couru dont le circuit n'est pas dans CALENDRIER_CIRCUITS reprend le circuit de sa place dans le calendrier actuel (les résultats courus intacts) ; vérifier aussi qu'une saison 2 neuve tire bien les 12 tracés — fini quand un test « vieille sauvegarde test/technique » passe.
  2. Le panneau ?reglages=1 : « Copier » coupé en bas, noms des curseurs = noms du code (vérifier d'abord : peut-être déjà corrigé ; sinon : bouton entier, noms en français et en anglais par textes.js) — fini quand une capture le montre.
  3. Chercher d'autres bugs dans « Bugs connus » et « Décisions en attente » de SUIVI.md qui se règlent sans décision du propriétaire, les régler ou dire pourquoi pas.
  4. Pousser, 18/18 — lien dans le compte rendu.

Codeur 4 — dossier « Grand Prix Dynasty - codeur 4 », branche neuve `relecture-59` depuis origin/main — la relecture finale du jeu en ligne (il n'a pas écrit ce code)
  1. Relire tout le jeu en ligne tel qu'il est dans main (enligne*.js, le relais, les tests reseau/enligne), avec rapports/tour-56-T11-relecture.md : ce qui y était signalé est-il réglé ? Nouveaux défauts (désynchronisation, triche facile, erreurs non attrapées, fuite de mémoire, textes manquants fr/en, comportement quand EN_LIGNE est faux) — fini quand rapports/tour-59-relecture-enligne.md liste chaque point (réglé / pas réglé / nouveau, avec fichier:ligne).
  2. Corriger les défauts simples et sûrs trouvés (sans toucher aux règles du jeu), avec un test chacun ; les gros, les décrire seulement.
  3. Mettre à jour la section « Les batailles en ligne » de CLAUDE.md pour qu'elle dise vrai (le code a raison).
  4. Pousser, 18/18 — lien dans le compte rendu.

Chaque Codeur écrit son compte rendu dans rapports/tour-59-<N>-compte-rendu.md (format de CLAUDE.md), le commite sur sa branche, et le renvoie au Chef en fin de tâche.

Questions pour le propriétaire : aucune nouvelle (voir SUIVI, « Décisions en attente »).
