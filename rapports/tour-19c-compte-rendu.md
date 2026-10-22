TOUR 19c — compte rendu du Codeur 2 (session-9e), 2026-10-22 : la grande fusion
Branche : codeur2 (worktree « Grand Prix Dynasty - codeur 2 »).
Commits :
- 92a8236 : merge de main 7ff02c5 (le coût des erreurs, les niveaux de difficulté d'session-dd ; origin/main n'était qu'à 591a32e, main local contient 7ff02c5 et origin/main) — sans conflit
- 6edd8b2 : merge des 6 branches origin/cloud/sdk, pneus, enregistreur, circuits-a, circuits-b, textes (pieuvre, sans conflit) : seulement des fichiers nouveaux (sdk.js ; pneus.js, pneus-donnees.js ; enregistreur.js, enregistreur-donnees.js ; circuits-officiels-a.js, -b.js ; rapports/audit-textes.md ; tests/sdk.html, pneus.html, enregistreur.html, circuits-a.html (+ .svg), circuits-b.html (+ .svg), textes.html). Rien de branché dans index.html ni dans le jeu
- le commit suivant : le niveau de difficulté dans ?championnat=1, la partie « annexes » de tests/lancer.py, ce compte rendu

Ordres : 1 fait / 2 fait / 3 fait

1. Niveaux (?niveau=) et niveau des écuries ensemble : le rythme d'une IA = min(1, rythme tiré + niveau.rythme) (simulation.js, session-dd) × niveau de son écurie (championnat.js : appliquerNiveaux, avant la carte) ; rien à changer, les deux se composent. Le point signalé par session-dd : principal.js, appliquerCaracteres (?championnat=1) écrasait le caractère tiré (déjà au niveau par donnerCarte) avec celui du pilote du championnat, brut. Maintenant il passe ce caractère par appliquerNiveau (simulation.js, intact ; tours: [] pour ne pas re-mettre les tours au niveau, ils restent ceux tirés pour la course, déjà au niveau), puis re-tire les erreurs du pilote avec ce taux (tirerErreurs, même graine que donnerCarte : graine + GRAINE_CARACTERE ; avant, les erreurs tirées par donnerCarte restaient celles du caractère de la course, le taux du pilote du championnat ne servait à rien). Donc au niveau légende dans le championnat : erreurs × 0,25, agressivité + 0,4 (bornée à 1), régularité × 0,5, rythme + 0 et × écurie.
   Test (test.html, 137/137) : appliquerCaracteres au niveau légende sur une course de 19 IA + joueur : chaque IA a le caractère de son pilote du championnat au niveau, ses erreurs re-tirées (liste neuve, aucune faite), ses tours inchangés ; au niveau normal, le caractère tel quel. Le test ecrans.py du championnat (régularité des IA = celle du championnat, niveau normal) passe toujours.
2. Les 6 branches : fusionnées telles quelles (voir 6edd8b2). Les pages de test donnent toutes « RESULTAT n/n » dans <pre id="res"> comme test.html.
3. tests/lancer.py : partie « annexes » (ANNEXES, annexes()), comprise dans « tout » et dans PARTIES (python3 tests/lancer.py annexes) ; serie() prend des options Chrome : sdk.html tourne avec --virtual-time-budget=5000 (ses rappels viennent par promesses et minuteurs). Délai 120 s par page (chacune fait 3 à 5 s).

Pour CLAUDE.md (à ajouter par le Chef) :
  - tests/lancer.py : « partie annexes : les pages de test des modules écrits d'avance et pas branchés (sdk, pneus, enregistreur, circuits officiels a/b, textes) ; sdk.html avec --virtual-time-budget=5000 » ;
  - principal.js, appliquerCaracteres : « le caractère du pilote du championnat passe par appliquerNiveau (?niveau=) et ses erreurs sont re-tirées avec son taux ».

Sortie des tests : partie moteur + annexes (19h35) : test.html 137/137 (40 s), sdk 19/19, pneus 28/28, enregistreur 28/28, circuits-a 49/49, circuits-b 45/45, textes 85/85, 0 Chrome restant. Suite complète (19h38–19h46) : test.html 137/137 (39 s), courses.html 38/38 (82 s), ecrans.py 257/257 (309 s, le Mac chargé), annexes 19/19, 28/28, 28/28, 49/49, 45/45, 85/85, TOUT PASSE, 0 Chrome --headless restant.
Jamais touchés : ia.js, simulation.js, podium3d.js, CLAUDE.md, index.html.
Réévalue.
