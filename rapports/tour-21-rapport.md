TOUR 21 — Codeur 1 (session-dd) : la même graine, la même course, partout ; puis le duel — rapport du Chef
Chef : session-76. Base : main eb312c5. Note actuelle : 62/100. Date : 2026-10-23, à partir de 16h40.

NOUVELLE RÈGLE (CLAUDE.md, « Aller plus vite : les tests sur GitHub ») — à relire avant de commencer :
- Pendant le travail : seulement la partie concernée sur le Mac, sous le verrou :
    while ! mkdir /tmp/gpd-tests.lock 2>/dev/null; do sleep 10; done; python3 tests/lancer.py moteur; rmdir /tmp/gpd-tests.lock
  (moteur | courses | ecrans | annexes). Plus de suite complète sur le Mac.
- Quand c'est prêt : commit sur ta branche, `git push origin <branche>`, puis attendre le passage GitHub (commandes de CLAUDE.md, avec le jeton, sans jamais l'afficher ; une vérification toutes les 30 s au plus). Le compte rendu donne l'id du passage et sa ligne RESULTAT/ÉCHECS.
- Tu ne fusionnes pas sur main : c'est le Chef, seulement sur un passage GitHub vert.
- CLAUDE.md : une autre session (session-0b) y écrit des idées. Ne touche pas à ses lignes et ne les commite pas.

ORDRES

1. PRIORITÉ : main est ROUGE sur GitHub (passage du commit eb312c5), avec les 6 tests listés dans CLAUDE.md (« État au 2026-10-22 ») :
   test.html « styles », « régularité », « erreurs » ; courses.html « au moins 25 dépassements » (18), « au plus 4000 pas dans l'herbe » (14 661) ; ecrans.py « la carte calculée en fond est la même » (55,25 s au lieu de 55,08 s).
   Ils sont verts sur le Mac. Donc une même graine ne donne pas la même course sur deux machines, ce qui va contre la règle de « La technique ». Il faut trouver ce qui dépend de la machine et le supprimer, SANS élargir aucun seuil.
   Pistes, dans l'ordre :
   a) le temps réel : principal.js:411-422 découpe le calcul de la carte en tranches de CALCUL_TRANCHE_MS mesurées avec performance.now(). Le RÉSULTAT ne doit dépendre ni de la taille ni du nombre de tranches (un état gardé entre les tranches ? un hasard() appelé une fois par tranche ? quelque chose qui avance pendant l'attente ?). Regarde aussi tout ce qui lit performance.now(), Date ou requestAnimationFrame et nourrit le calcul (simulation.js:274 sert seulement à mesurer ? à vérifier).
   b) l'ordre d'une itération qui dépend de la machine (sort sans départage complet, objets parcourus) ;
   c) les mathématiques : Math.pow, exp, sin, atan2… sont les mêmes à version égale de V8, mais GitHub a Chrome 155 (essai fait avec Chrome 150 : toujours rouge, donc ce n'est probablement pas ça).
   Méthode conseillée : un test moteur qui calcule la carte deux fois, avec des tranches très petites (1 ms ou 1 étape par tranche) puis en une seule fois, et qui exige un résultat IDENTIQUE au bit près (temps du tour + quelques points de la trajectoire). Puis une course entière rejouée deux fois avec la même graine : positions identiques au bit près.
   Fini quand :
   - le test « tranches » existe et passe sur le Mac ;
   - sur GitHub, le passage de ta branche (`determinisme`, partie de main eb312c5) n'a PLUS AUCUN des 6 échecs, sans seuil élargi (le Chef fera le diff des seuils) ;
   - le compte rendu dit la cause trouvée, en une phrase compréhensible par le propriétaire.
   Si la cause n'est pas trouvée à 18h30 : compte rendu de ce qui est éliminé, et passe à l'ordre 2.

2. LE DUEL (branche duel = ef6dd16, mais fusionne d'abord main + la correction de l'ordre 1 dedans). Repars de la piste écrite dans rapports/fin-2026-10-22.md : le rapide suit à 14 m dans les virages, et l'attaque meurt en « échappée » ; il n'arrive jamais à côté AVANT le freinage. Il faut :
   - suivre plus près hors freinage (un écart en temps, borné en mètres au freinage) ;
   - préparer l'attaque dans la droite qui précède (aspiration, sortie de virage) pour être à côté au point de freinage.
   Fini quand : tests/courses.html (30 courses) donne vainqueur ≠ poleman au moins 3/30 sans casser le reste (chocs, herbe, régularité : les tests existants verts), et que le passage GitHub de la branche duel est vert (à part les 6 échecs connus si l'ordre 1 n'est pas fini).
   Le tableau des essais va dans rapports/tour-21-compte-rendu.md (comme celui du tour 20).

HORAIRES : jusqu'à 21h. Rien de nouveau après 20h40, dernier push à 20h50 au plus tard, compte rendu complet dans rapports/tour-21-compte-rendu.md avant 20h55.
Après chaque ordre vert (passage GitHub vert), un message court à session-76 par SendMessage : branche, commit, id du passage GitHub, cause/chiffres.
