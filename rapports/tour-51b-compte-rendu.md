TOUR 51b — compte rendu du Codeur 2 (branche defi-patrons, depuis origin/main ef8972f)

1. Le défi après une course seule (fait)
- principal.js : noterFantomeSeul (à chaque pas de la course seule) enregistre chaque tour avec le même enregistreur que le fantôme (FANTOME.commencer / noter / compacter), sans rien d'affiché. Ne sont jamais gardés : le premier tour (départ arrêté), un tour coupé, un tour passé par la voie des stands. On garde le plus rapide de la course.
- À l'arrivée (finDeCourse) : le meilleur tour propre devient le fantôme du circuit s'il bat le record (SAUVEGARDE.proposerFantome), et « 📋 Défier un ami » (index.html : boutonFinDefi, finCode) donne le lien et le code (DEFI_ECRAN.montrerCode, comme la qualification).
- Rien ne touche la physique ni la course (calcul seulement) ; pas de fantôme rejoué en course.
- Test : tests/ecrans.py défi_seul, page « index.html?course=3&robot=1&circuit=test&test=seuldefi » (ajoutée à tests/ecrans-durees.json) : le meilleur tour propre est gardé (pas le premier), c'est le record du circuit, le bouton est là, le lien et le code se décodent au bon temps. Vert en local.

2. Les divisions : patrons d'en haut et salaires (fait)
- patrons.js : sur(ch) ramène le championnat à DIVISIONS.vueContrats(ch) quand le joueur est monté (vue.reel = le vrai championnat, divisions.js) ; toutes les fonctions (peutParler, dire, intentions, nom, conditions, raisonner…) marchent sur cette vue. Le promu peut « 💬 Négocier » avec les patrons d'en haut qui lui font une offre (salaire avec plafond +25 %, contre-offre, refus, parler de tout), la mémoire est celle du plateau d'en haut (ch.plateaux[d].patrons), l'envie vient de la note × DIVISION_NOTE_MONTEE. Un promu n'est pas premier pilote d'emblée (statut_refuse, raison « promu », textes fr/en). L'ancien bouton caché pour les patrons d'en haut est rendu (interface.js).
- Salaires : salaireBase × DIVISIONS[d].argent (0,6 / 1 / 1,5 / 2,2), arrondi à 1 000 ; D3, vieille sauvegarde, divisions coupées = la formule d'avant, au bit près (testé). Meilleure écurie : D4 90 000, D3 150 000, D2 225 000, D1 330 000. Le budget du patron (25 000) ne change pas.
- Tests : banc-parle-tests.js (annexe banc-parle.html, qui charge maintenant divisions.js, en D3 sur un seul plateau comme test.html) : 2 nouveaux, 65/65 en local ; tests/ecrans.py (patron_ecran) : le même parcours pour un promu (contrats d'en haut, Négocier, salaire, statut refusé, retour) — pas pu le faire tourner en local (le Mac saturé : les pages dépassent 30 s), à vérifier sur GitHub.
- CLAUDE.md mis à jour (divisions, défi).

Local : moteur (test.html) 370/373 avant le déplacement des tests de patrons : 1 échec « championnat : 3 Grands Prix » = limite de temps sous la charge (24 s), les 2 autres étaient mes tests mal placés (corrigés).
