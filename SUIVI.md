# Suivi

Le carnet de bord, tenu par **le Chef** et mis à jour à chaque tour (voir `CLAUDE.md`). Les rapports et comptes rendus complets sont dans `rapports/`.

## Sessions

- 2026-10-23 17h35 : **Chef = session-5b** (le propriétaire : « tu vas être un chef de codeurs » ; les sessions session-76, dd, 9e et a7 étaient fermées). À 17h55, le propriétaire : « fais 3 codeurs avec des tâches précises et différentes » → le Chef lance lui-même les 3 Codeurs (sessions filles de session-5b, sur le Mac) : Codeur 1 dans « Grand Prix Dynasty - codeur 1 » (worktree neuf, branche determinisme) pour le tour 22 ; Codeur 2 dans « - codeur 2 » (codeur2) pour le tour 22b ; Codeur 3 dans « - codeur 3 » (remis sur codeur3) pour les ordres 2–4 du tour 21c puis les circuits. Fichiers disjoints : IA/physique/simulation au 1 ; fantôme/départ/course/qualification/3D au 2 ; journal/championnat au 3 ; dans les fichiers partagés (interface, textes, donnees, principal, index, style, tests), chacun ajoute ses blocs sans reformater. Les ordres des tours 21c (Codeur 3) et 22b (Codeur 2) restent valables ; le Codeur 1 reçoit le tour 22 (rapports/tour-22-rapport.md : la cause du non-déterminisme, trouvée par le Chef, puis le duel).
- 2026-10-18 : Chef session-2d, Codeur session-0e
- 2026-10-19 : Chef **session-76**, Codeur **session-dd** (donné par le propriétaire)
- 2026-10-21 ~19h10 : session-dd (Codeur 1, les IA) passe sur le modèle **Fable 5.1**, effort **high** (choix du propriétaire, conseil du Chef) ; session-9e et le Chef restent sur Opus 5.5.
- 2026-10-22 17h40 : le propriétaire : « tu les feras travailler jusqu'à nouvel ordre » → les agents du cloud reçoivent une nouvelle tâche dès qu'ils finissent, sans heure de fin, jusqu'à ce que le propriétaire dise stop. File d'attente des tâches cloud : argent et garage en calcul (étape 8, liste à approuver) ; contrats, sponsors et évolution des rivaux en calcul (étape 9) ; décor généré par le code pour un circuit d'essai (tribunes, arbres, panneaux en instancing, étape 10) ; usure des pneus chez les IA (stratégie d'arrêt) ; météo en calcul (étape 12, si le propriétaire la veut) ; écran de création du pilote (étape 6, sans noms définitifs) ; bilan de carrière et records en calcul (étape 14).
- 2026-10-22 17h35 : **6 agents dans le cloud** (demande du propriétaire : « plein d'agents sur cloud, chacun une tâche précise », pas sur le Mac) : sdk.js (Poki), pneus.js (étape 7, calcul), enregistreur.js (étape 13, calcul), tracés des 12 circuits (deux agents, 6 chacun, à approuver par le propriétaire), audit des textes. Chacun crée de NOUVEAUX fichiers sur une branche cloud/…, sans toucher aux fichiers existants ; le Chef vérifie sur le Mac (sous le verrou) et fusionne plus tard.
- 2026-10-21 18h20 : **Codeur 2 = session-9e** (donné par le propriétaire, « ça ne va pas très vite »). Il travaille dans « Grand Prix Dynasty - codeur 2 » (git worktree, branche codeur2) sur ce qui se voit (caméra, voiture 3D, feux) ; le Chef vérifie et fusionne. Un seul passage de tests à la fois (verrou /tmp/gpd-tests.lock). Rapport : rapports/tour-18b-rapport.md.

## Règles de tests (2026-10-21, accord du propriétaire)

- Le Mac est un Mac mini 2014 (i5 2 cœurs / 4 fils, 8 Go) : charge 6–15 avec 2 Codeurs qui testent.
- Depuis le 2026-10-22 (CLAUDE.md, « Aller plus vite ») : la suite complète tourne sur GitHub Actions à chaque push ; sur le Mac, seulement la partie concernée (`tests/lancer.py moteur|courses|ecrans|annexes`), toujours sous le verrou /tmp/gpd-tests.lock ; au plus 3 Codeurs, plus le Chef. Le Chef vérifie les branches dans une copie à lui (git worktree dans son dossier de travail), jamais dans les dossiers des Codeurs.

## Horaires

- 2026-10-23 22h10 : le propriétaire : « finit à 24h » → **fin à minuit** : rien de nouveau après 23h40, dernier push 23h50, comptes rendus avant 23h55 ; à minuit le Chef fige main sur le dernier commit vert, écrit rapports/fin-2026-10-23.md et arrête le blocage de la veille.
- 2026-10-23 18h45 : le propriétaire : « jusqu'à nouvel ordre » → **plus d'heure de fin** ; les 3 Codeurs continuent leurs ordres, le Chef redonne un ordre à chacun dès qu'il finit, jusqu'à ce que le propriétaire dise stop. Le Mac est gardé éveillé sans limite (`caffeinate -i -s`, lancé par le Chef ; à arrêter à la fin). Avant : boucle jusqu'à 21h (20h40 / 20h50 / 20h55).

- 2026-10-21 : boucle relancée à 17h (« recommence la boucle »), fin à 21h comme la veille. Mac gardé éveillé jusqu'à 21h10.

- 2026-10-20 : boucle jusqu'à **21h**, Chef 100 % autonome (le propriétaire : « tu as tous mes droits, ne me demande rien et n'exige rien de moi »). À 21h, on fige sur le dernier commit vert.

- 2026-10-18 : boucle jusqu'à 21h (demandée par le propriétaire). À 21h, on fige sur le dernier commit vert.

## Tour en cours

Trois tours ouverts le 2026-10-23, main = c0e4cb3 (72/100), Chef session-5b :
- **Tour 22, Codeur 1** : **ordre 1 fait et fusionné** (determinisme 4dd5066 → main, ~19h00 ; GitHub 40035940484 : TOUT PASSE, 157/157, 38/38, 320/320 + annexes) : puissanceEntiere à la place de Math.pow, empreintes épinglées, tests « styles » et « suivi » refaits selon la décision du Chef, tour du pilote neutre 55,2583 s. **Main est vert sur GitHub pour la première fois depuis le 2026-10-22 : « vert » = 0 échec.** Compte rendu du tour 22 rendu à 20h30 (rapports/tour-22-compte-rendu.md, sur la branche contournement) : **ordre 3 presque** (voiture arrêtée passée par les 10 IA en 12,6 s dans la droite, 9,9 s à l'épingle, robot à 40 % jamais suivi plus de 9,8 s ; MAIS courses.html rouge : 12 chocs, 5143 pas d'herbe, parce que « lente » attrape les voitures en erreur qui se remettent) ; **ordre 2 (duel) pas tenu** : verrou physique chiffré (le rapide arrive au freinage 11–19 m derrière, même vitesse de pointe, l'aspiration ne rend que 10 m sur 680 m) → décision de jeu pour le propriétaire. Un bug du jeu corrigé en chemin (r signé : la vitesse « libre » lue au bout de la ligne quand une voiture poussée reculait). **Tour 25, ordre 1 fait et fusionné** (contournement 1113916 → main, 21h25 ; GitHub 40049094111 : TOUT PASSE, 200/200, 38/38, 438/438) : une voiture arrêtée ou très lente est contournée (droite 7,9 s, épingle 7,8 s, joueur à 40 % jamais suivi plus de 16 s, 0 choc) sans dégrader les courses (4 chocs, herbe 2450, 41 dépassements). Ordre 2 fait : le tableau des 4 cas (rapports/tour-25-compte-rendu.md) : aucune option ne tient seule ; question pour le propriétaire (« Décisions en attente »). Suite : tour 26 (rapports/tour-26-rapport.md) : l'étape 7 (pneus chez les IA, voie des stands, arrêt obligatoire), derrière PNEUS_ACTIFS.
- **Tour 22b, Codeur 2** : **fait et fusionné** (6d150d0 → main 5bb3484, ~19h10 ; GitHub 40037491667 : TOUT PASSE, 169/169, 38/38, 345/345 ; captures depart.png, fantome.png, qualif.png relues) : le fantôme du meilleur tour (16 043 octets par circuit, +6 appels de dessin, écart contre soi-même ≤ 1,7 ms) et le départ parfait (50 courses × 20 IA : réguliers ratés 22/500, fautifs 188/500, faux départs 7/1000, aucune réaction sous 0,15 s hors faux départ ; parfait = la voiture normale au bit près). physique.js : 2 lignes (× 1). **Tour 23b fait et fusionné** (ad3d050 → main, 20h25 ; GitHub 40043748042 : TOUT PASSE, 182/182, 38/38, 403/403) : fantôme visible (pixels), faux départ par la touche, écran titre, course de découverte (3 tours, 6 pilotes du monde, aides), « Bravo ! », prime, création du pilote (pilote.js), la page nue = le vrai jeu. Mesure clic → feux : 14,3 s sous swiftshader (> 10 s, dit tel quel ; à mesurer par le propriétaire). **Tour 24b, ordre 1 fait et fusionné** (fd94279 → main, 20h45 ; GitHub 40045338882 : TOUT PASSE) : prime en €, boutons sans emoji, **la carte des IA en cache** (cache-carte.js, 34 Ko par circuit, identique au bit près, clé de validité) : clic → premier feu 0,1–0,5 s sur GitHub, clic → feux éteints 7,9–8,0 s (sous swiftshader la physique des 20 voitures ralentit les feux eux-mêmes). **Ordre 2 (casque) fait et fusionné** (bd3a08d → main, 21h15 ; GitHub 40048114635 : TOUT PASSE, 197/197, 38/38, 438/438) : casque.js, atlas + un seul matériau (6 appels par voiture, inchangé), éditeur 3D à la création, « Mon casque » au paddock, icônes dans la tour (corrigées : l'icône chevauchait le numéro, test ajouté). Suite : tour 25b (rapports/tour-25b-rapport.md) : le mode 2 joueurs.
- **Tour 21c, Codeur 3** : **fait et fusionné** (4a8e731 → main 5d548d6, ~18h35 ; GitHub 40033832212 : seulement les 6 échecs connus ; captures une.png, une-en.png, une-960.png, duel.png, duel-tour.png relues par le Chef) : score du duel contre le coéquipier (qualifs + courses, saison et carrière), sa ligne marquée dans la tour avec l'écart, « Toi 2 – 2 Pilote 19 » sur l'écran du championnat, journal.js (La Gazette du Paddock / The Paddock Gazette : titre par priorité, texte, brèves, classement, album compact : 180 unes = 59 843 octets, 332 par une), la une affichée après les résultats. Puis **les 12 circuits ressemblants, faits et fusionnés** (circuits 97ac321 → main ae20ae6, ~19h20 ; GitHub 40037738133 : TOUT PASSE) : données seules, longueurs à ±10 % des vraies, Suzuko en huit (croisement 77°), outil tests/circuits-outil.py, vues tests/circuits-a.svg et -b.svg **à faire voir à le propriétaire**. La ligne 14 de la tour (duel-tour.png) : capture prise pendant le glissement des lignes (transition CSS), rien dans le jeu ; ecrans.py attendra la fin du glissement (tour 23c). **Tour 23c fait et fusionné** (e1b008b → main, 20h10 ; GitHub 40042696042 : TOUT PASSE, 178/178, 38/38, 361/361) : argent.js (gains : place, meilleur tour, places gagnées, bonus duel ; solde), garage.js (4 améliorations × 5 niveaux, +7 % max, le robot gagne 1,38 % au tour avec +7 %), écran Garage, tour stable avant la capture, test des longueurs corrigé. **Tour 24c fait et fusionné** (33f57a3 → main, 21h00 ; GitHub 40046798046 : TOUT PASSE, 194/194, 38/38, 434/434) : saisons.js : fin de saison (champion, classement final), écran du duel de la saison, contrats (note du joueur, poids du duel, offres, changement d'écurie), retraite (choix ou 15 saisons), rivaux qui évoluent (âge, rythme, retraites, arrivées, transferts, niveaux) ; 15 saisons simulées : 12 retraites, 46 transferts, sauvegarde 77 Ko. **Tour 25c fait et fusionné** (1ab073d → main, 21h55 ; GitHub 40051042290 : TOUT PASSE, 202/202, 38/38, 453/453) : la voiture du joueur suit le niveau de son écurie (NIVEAU_JOUEUR_ACTIF), sponsors.js (offres, objectifs, primes, domicile, écran + rappel), fiche.js (la fiche du rival). Suite : tour 26c (rapports/tour-26c-rapport.md) : l'interview d'après course.

Découpage de l'étape 4 : 4a (tours 7–8 : circuit technique, une IA seule ≤ 50 s sur Test) → 4b (plusieurs IA sans se toucher) → 4c (dépasser, défendre) → 4d (caractères, niveaux, page des 50 courses).

## Notes du Chef

| Tour | Commit | Note /100 | Conduite /20 | Course et IA /20 | Championnat /15 | Interface /15 | 3D et perf /15 | Code /10 | Poki /5 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | a4f5bdd | 10 | 0 | 0 | 0 | 0 | 1 | 8 | 1 |
| 2 | 16de5dc | 15 | 0 | 0 | 0 | 0 | 5 | 9 | 1 |
| 3 | 43a3fa8 | 27 | 7 | 1 | 0 | 2 | 7 | 9 | 1 |
| 4 | 09ae548 | 35 | 11 | 1 | 0 | 4 | 8 | 9 | 2 |
| 5 | 44b3624 | 42 | 12 | 5 | 1 | 6 | 8 | 9 | 1 |
| 6 | e59f5a2 | 44 | 12 | 5 | 1 | 8 | 8 | 9 | 1 |
| 7 | fbbf844 | 47 | 12 | 8 | 1 | 8 | 8 | 9 | 1 |
| 8 | 7cd8ce5 | 48 | 12 | 9 | 1 | 8 | 8 | 9 | 1 |
| 9 | bc85623 | 49 | 12 | 10 | 1 | 8 | 8 | 9 | 1 |
| 10 | 7b2b1bf | 50 | 12 | 11 | 1 | 8 | 8 | 9 | 1 |
| 11 | eebcb25 | 51 | 12 | 12 | 1 | 8 | 8 | 9 | 1 |
| 12 | 2c13e30 | 52 | 12 | 13 | 1 | 8 | 8 | 9 | 1 |
| 13 | — | 52 | — | — | — | — | — | — | — |
| 14 | d840007 | 53 | 12 | 13 | 1 | 8 | 8 | 10 | 1 |
| 15 | bde5dd6 | 54 | 12 | 14 | 1 | 8 | 8 | 10 | 1 |
| 16 | 3a33150 | 54 | 12 | 14 | 1 | 8 | 8 | 10 | 1 |
| 17 | fa19fdb | 55 | 12 | 15 | 1 | 8 | 8 | 10 | 1 |
| 18 + 18b | 3962493 | 60 | 12 | 16 | 4 | 11 | 9 | 10 | 1 |
| 19 + 19b | f2ff5ee | 62 | 12 | 16 | 6 | 12 | 9 | 10 | 2 |
| 21b | 81c254d | 68 | 12 | 16 | 6 | 12 | 9 | 10 | 3 |
| 21c | 5d548d6 | 71 | 12 | 16 | 8 | 13 | 9 | 10 | 3 |
| 22 (ordre 1) | c0e4cb3 | 72 | 12 | 17 | 8 | 13 | 9 | 10 | 3 |
| 22b | 5bb3484 | 74 | 12 | 18 | 8 | 14 | 9 | 10 | 3 |
| 23b-1 + 23c | fusion codeur3 59f87d1 | 76 | 12 | 18 | 10 | 14 | 9 | 10 | 3 |
| 23b | fusion codeur2 5b21631 | 78 | 12 | 18 | 11 | 15 | 9 | 10 | 3 |
| 24b-1 + 24c | fusion codeur3 3997afb | 80 | 12 | 18 | 13 | 15 | 9 | 10 | 3 |
| 24b | fusion codeur2 d201d88 | 82 | 12 | 18 | 13 | 16 | 10 | 10 | 3 |
| 25 (ordre 1) | fusion contournement 1113916 | 83 | 12 | 19 | 13 | 16 | 10 | 10 | 3 |
| 25c | fusion codeur3 1ab073d | 84 | 12 | 19 | 14 | 16 | 10 | 10 | 3 |

Note du Chef session-5b (2026-10-23) : les lignes 18 à 19b ne s'additionnaient pas (19 + 19b : 12 + 16 + 6 + 12 + 9 + 10 + 2 = 67, noté 62 ; 18 : 63 noté 60). Les axes sont justes, c'est le total qui était faux ; depuis la ligne 21b, le total est la somme des axes. Le saut de 62 à 68 vient de cette correction, pas d'un progrès.

## À essayer par le propriétaire

- **La voiture de ta petite écurie** (tour 25c, décision du Chef) : en championnat, ta voiture est celle de ton écurie (écurie 10 : −4,5 %). Dire : ça se sent ? trop ? (NIVEAU_JOUEUR_ACTIF dans donnees.js pour couper). Aussi : les sponsors après les contrats (`?championnat=1&gp=12`) et la fiche d'un rival (clic sur un nom au championnat).
- **Le contournement** (tour 25, ta demande de 18h50) : `index.html?course=5&ia=9&joueur=1` : arrête-toi en piste, les IA te contournent au lieu de faire la queue. Dire : elles passent proprement ? assez vite ?
- **Le casque** (tour 24b) : à la création du pilote (ou « Mon casque » au paddock) : motif et trois couleurs, l'aperçu tourne ; en course, les casques des rivaux sur les voitures et les icônes dans la tour. Dire : les motifs se voient assez en course ? l'icône est lisible ?
- **Une saison entière** (tour 24c) : `index.html?championnat=1&gp=12` saute au 12e Grand Prix : la fin de saison, le duel de la saison, les contrats (signer ailleurs change la voiture et le coéquipier), la saison 2. Dire : les écrans te parlent ? les offres te semblent justes ?
- **Le vrai jeu, du début** (tour 23b) : ouvre `index.html` sans rien derrière (efface d'abord la sauvegarde si tu veux revoir le début : console → `localStorage.removeItem('grand-prix-dynasty')`) : titre → « ▶ Jouer » → la course de découverte → « Bravo ! » → ton pilote → le paddock. **Chronomètre le clic → feux éteints** sur ta machine (but : 10 s ; la mesure exacte est dans la console : `JEU.clicAuxFeux`). Dire : les aides à l'écran gênent ? la découverte est trop longue (3 tours) ?
- **L'argent et le garage** (tour 23c) : `index.html?championnat=1` : après un Grand Prix, la ligne « Gains » sur les résultats ; au championnat, le bouton « Garage » : acheter un niveau, puis sentir la voiture (+0,5 % par niveau, 7 % au plus). Dire : les montants et les prix te semblent justes ? la liste des 4 améliorations te va ?
- **Le départ parfait** (tour 22b) : `index.html?course=5&ia=9&joueur=1` : pendant les feux, tiens ↑ pour garder l'aiguille dans le vert, lâche, et réappuie dès que les feux s'éteignent. Dire : l'aiguille monte trop vite ou trop lentement ? le vert est trop étroit ? le patinage est trop sévère ? (`&reglages=1` : 13 curseurs DEPART_*). Lisible en 960×600 ?
- **Le fantôme** (tour 22b) : deux qualifications de suite sur le même circuit (`index.html?course=5&ia=9&joueur=1`, « Faire mon tour ») : au 2e tour, la voiture transparente et l'écart sous le chrono. Dire : on la voit assez ? elle gêne ? le bouton « Fantôme : masqué » suffit ?
- **Le duel et la une du journal** (tour 21c) : `index.html?championnat=1` : en course, la ligne de ton coéquipier est marquée dans la tour avec l'écart ; après les résultats, la une du journal (clic ou touche pour passer) ; sur l'écran entre les courses, le score du duel. Dire : le ton des titres te plaît ? la place de la « photo » (vide pour l'instant) ?
- **Le championnat** : `index.html?championnat=1` (écran entre les courses, points, sauvegarde ; fermer et revenir).
- Vue cockpit (touche C), feux de départ, vue télé après l'arrivée, podium : `index.html?course=5&ia=9&joueur=1&circuit=technique`.

- **Jouer contre les IA** : `index.html?course=5&ia=9&joueur=1&circuit=technique` (ou sans `&circuit=…`). Tu pars dernier ; depuis le tour 15, elles doublent (peu, au freinage). Dire : trop rapides ou trop lentes ? Bizarres ?

- Regarder `index.html?ia=10&circuit=technique` (Tab change de voiture) : les IA ne passent plus au même endroit. L'aspiration est dans la physique (traînée −35 % collé derrière) : à sentir à l'étape 5.

- Étape 1 : survol `index.html?camera=libre`.

## Étape en cours

**Étape 1 — Le circuit** : finie (tours 2–3). **Étape 2 — La voiture** : **finie** (tours 3–4 ; le propriétaire, 19h45 : « oui la conduite me va »). **Étape 3 — Une course seule** : **finie** (tours 5–6 ; le propriétaire : « oui tout me va, l'étape 3 est finie »).

## Fini

- Étapes 0, 1, 2, 3 (acceptées par le propriétaire). L'étape 4 (IA) est presque là : il manque le duel (vainqueur ≠ poleman 0/30). Des morceaux des étapes 5 (feux, qualification, podium), 6 (championnat, sauvegarde), 7 (pneus désactivés), 13 (enregistreur) et 15 (sdk.js) sont posés.

## Décidé

- 2026-10-23 ~18h45 (Chef session-5b) : le Codeur 1 a réglé le déterminisme (determinisme 5865b0f, GitHub 40031444023 : les 6 échecs connus ont disparu ; empreintes identiques au bit près Mac/GitHub : trajectoire test Σécart −5591.154986164103, technique −8626.812883967046, épinglées en dur). Deux tests sont devenus rouges sur les deux machines, avec les mêmes chiffres : **le Chef a tranché : on corrige la mesure, pas les seuils, pas le jeu.** « styles » mesurait l'écart-type pile à l'apex, où les lignes « apex tôt / apex tard » se croisent (0,26 m à l'épingle) : on mesure maintenant le max à l'apex, 30 m avant et 30 m après, seuil 0,5 m inchangé. **Styles, suite (~19h) :** l'essai de réglage (IA_STYLE_CORDE 3,5 / MARGE_BORD 2,6) laisse l'épingle à 0,40 m et casse courses.html (7 chocs, herbe 4183) : remis d'origine. Les lignes prévues diffèrent, mais les lignes roulées convergent à l'épingle (la visée coupe vers l'intérieur). **Décision du Chef :** on ne touche pas à la conduite ; le test dit ce que la règle dit : moyenne des max sur les virages > 0,5 m (les styles se voient), chaque virage > 0,2 m (jamais au même endroit), chacune passe ailleurs d'un tour à l'autre. Le « 0,5 m à chaque virage » était un chiffre du Chef. « suivi seul » supposait que l'IA resterait 2 tours derrière une voiture à 60 % ; par la règle de la file elle-même (IA_FILE_COTE 6 m), à 8,7 m de côté elle n'est plus à la file et contourne : le test vérifie désormais la distance de sécurité tant qu'elle est à la file, un contournement propre (écart latéral ≥ largeur + marge), 0 contact, 0 herbe.

- 2026-10-19 19h15 : **Le propriétaire ne veut pas d'IA sur un rail** (« tous les ia suivent une trajectoire précise définie ; je ne veux pas ça, je veux une INTELLIGENCE artificielle »). Choix : **des pilotes qui décident** (chaque IA choisit sa ligne en roulant, selon la piste et les voitures autour), pas un réseau de neurones. Cause : c'était le plan de CLAUDE.md (4a « trajectoire idéale ») et les ordres du Chef aux tours 7–8. Le tour 9 finit (contacts, simulation), l'IA change au tour 10.

- 2026-10-19 : le propriétaire trouve que l'IA de 4a (`?ia=1`) roule comme une vraie F1. Le circuit technique lui va comme circuit d'essai ; **pour un circuit officiel, il préfère « un giant loop »** (à préciser à l'étape 10). Le Chef peut compléter CLAUDE.md (« c'est pour ça que c'est en auto mode ») : liste des fichiers mise à jour (ia.js, ?ia=1, ?circuit=).

- 2026-10-18 : le nom du jeu est **Grand Prix Dynasty** (remplacer `NOM_DU_JEU` au tour 4).

- 2026-10-18 : dépôt GitHub **public** https://github.com/cotangeante-pi/Grand-Prix-Dynasty (choix du propriétaire, pour GitHub Pages). Le Chef pousse `main` après chaque tour vérifié ; le Codeur ne pousse pas.

## Bugs connus

- **Non-déterminisme Mac / Linux (trouvé le 2026-10-23 par le Chef session-5b, correction au tour 22)** : sur le même commit (determinisme 7ad2d50), toutes les empreintes sont identiques au bit près entre le Mac et GitHub (Math sur 2000 entrées, physique, circuits, les 300 passes du lissage), sauf l'aplatissement : `Math.pow(|u|, 7)` et `Math.pow(|u|, 6)` (ia.js:117-118) donnent Σpow7 102066.19181642555 sur Mac et 102066.19181642302 sur Linux. La trajectoire diverge (Σécart test −5161 contre −4935), d'où les 6 tests rouges. Remède : des multiplications à la place de Math.pow.
- Git n'a plus d'identité (le nom réseau du Mac a changé) : les commits utilisent `-c user.name=le propriétaire -c user.email=266356357+cotangeante-pi@users.noreply.github.com`. À régler par le propriétaire s'il veut (`git config --global`).
- « console vide » échoue parfois sur « GPU stall due to ReadPixels » quand le Mac est chargé : causé par les captures de Playwright (le jeu ne lit jamais les pixels). Tour 17 : ignoré dans le test.
- À surveiller en 4b : départ impossible (épingle à 60 m/s, nez vers l'extérieur) = 1288 pas (≈ 10 s) contre la barrière avant de repartir. Une IA collée au mur 10 s se verra.
- Sous swiftshader, le premier dessin 3D bloque la page 0,3–2 s même sans IA (critère 3 du tour 8 adapté : seule la plus longue tranche du calcul de l'IA est < 300 ms, 67 ms mesurés).
- À voir : en grand virage rapide, la caméra derrière montre surtout l'herbe (CAMERA_SUIVI_CAP 6/s). Seulement si le propriétaire le remarque.
- Panneau ?reglages=1 : le texte « Copier » est coupé en bas, noms des curseurs = noms du code. (Ondulations du circuit corrigées au tour 3 : circuit décrit par morceaux.)

## Mesures

| Date | Étape | Images par seconde | Poids du jeu | Notes |
|---|---|---|---|---|
| 2026-10-18 | 0 | **100 i/s** sur le Mac du propriétaire (Chrome, index.html?debug=1) | three.min.js 633 Ko + < 25 Ko | scène du cube ; Chrome sans fenêtre = rendu logiciel, sans valeur |
| 2026-10-18 | 1 (en cours) | **100 i/s** (le propriétaire) | — | circuit de test, version pas encore finie |
| 2026-10-18 | 2 (tour 3) | **70 i/s** (le propriétaire) | — | 1 voiture ; charge du Mac 12–13 à ce moment ; pixelRatio 2 + beaucoup d'appels de dessin par voiture → tour 4, ordre 7 |
| 2026-10-20 | 4d (tour 17) | — | code 174 Ko + three 618 Ko ≈ 792 Ko | 30 courses de 10 IA : 69 s de calcul ; 20 voitures × 120 pas : < 1 ms |
| 2026-10-19 | 4a (tour 7) | — | three 618 Ko + code 111 Ko ≈ 729 Ko (zip ≈ 195 Ko) | IA : Test 47,88 s, Technique 54,43 s par tour lancé ; trajectoire 0,3–4,6 s de calcul (Mac chargé) |
| 2026-10-18 | 2 (tour 4) | **> 90 i/s** en général (le propriétaire) | — | 1 voiture, 6 appels de dessin, pixelRatio 1,5 |

## Retours du propriétaire

- 2026-10-23 ~18h50 : « c'est normal que si on bloque une formule 1 tout un trafic à la queue leu leu attend ? ils sont censés doubler » → **décision du propriétaire** : une voiture bloquée ou très lente se contourne, partout, sans attendre une zone d'attaque (écrit dans CLAUDE.md, « Les IA des adversaires »). Cause : la règle de la file (IA_FILE_DISTANCE 30 m, IA_FILE_COTE 6 m) et l'attaque seulement avant un virage précédé de 150 m de droite. Ordre 3 du tour 22 au Codeur 1. Ça tranche aussi la question « contournement sans attaque » : voulu.
- 2026-10-23 ~17h05 : « c'est possible de faire plus ressemblant au vrai ? » (les 12 tracés) → **décision du propriétaire** : circuits très ressemblants (reconnaissables au premier coup d'œil), noms changés, aucun logo. CLAUDE.md mis à jour ; ordre dans rapports/circuits-ressemblants-rapport.md, pour le premier Codeur libre (branche `circuits`). Codeur 3 = session-a7 (branche codeur3), donné par le propriétaire le même jour.

- 2026-10-21 ~18h10 : « un autre Claude fait des changements dans le CLAUDE.md, il fait des idées, laisse-le ». → Le Chef et le Codeur ne touchent pas à ses changements de CLAUDE.md et ne les commitent pas avec leur travail (`git add -p` pour leurs propres lignes).

- 2026-10-21 ~17h45 : « j'ai fait une course avec 15 s de pénalités et je ne suis pas descendu de la place normale ». → **Décision du propriétaire** (elle remplace celle du Chef) : en course, la place est celle de la piste, la pénalité est seulement affichée (« ✂ +15 s ») ; elle s'applique à l'arrivée (classement final, podium, résultats). Même règle pour tous.
- 2026-10-21 ~17h20 : « pendant la course je veux un radar en bas à gauche et le positionnement en haut à droite » (fait : 2a500e5), puis « aussi un podium (qui prend en compte les pénalités) » (en cours).

- 2026-10-19 ~19h50 (au Codeur) : « session-76 a mon accord pour faire ce qu'il veut dans le dossier super star car amélioré (renommé « Grand Prix Dynasty » le 2026-10-21) ».

- 2026-10-18, tour 2 en cours : il voit la piste, « elle est longue un peu comme je voulais », la forme n'est pas encore avancée. → Garder des circuits longs ; la forme viendra avec les vrais tracés (étape 10).

- 2026-10-18 19h15, conduite (tour 3) : « la voiture tourne trop quand tu appuies un peu longtemps sur tourner et la caméra est trop loin quand on accélère trop ». → Tour 4, ordres 5 (caméra : retard du ressort 2v/w ≈ 20 m à pleine vitesse, + champ de vision) et 6 (direction au clavier en deux temps, braquage plus réduit à haute vitesse).
- 2026-10-18 19h35, conduite (ordres 5–6) : « quand tu appuies sur tourner pendant 1 sec il ne doit pas rester braqué » ; « hors piste c'est juste la vitesse qui diminue (bcp), pas les manettes qui bloquent ». → Tour 4, ordres 8 (la voiture continue de tourner après le lâcher : à mesurer) et 9 (herbe : garder l'adhérence, freiner fort).
- le propriétaire veut le projet sur GitHub (voir « Décisions en attente »).
- 2026-10-18 20h25, étape 3 : meilleur tour du propriétaire ≈ **45 s** en course très courte (le robot fait 1:02) ; pénalité de chicane et herbe sans pénalité : « oui oui » ; « j'espère que c'est une arène de test parce qu'elle a beaucoup trop de lignes droites ». → Oui, c'est un circuit de test. **Au début de l'étape 4 : un 2e circuit d'essai, technique (épingle, enchaînement en S, courbe rapide, freinage fort après une longue droite), pour entraîner et tester les IA sur de vrais virages.** Les IA devront approcher 45 s sur CIRCUIT_TEST (le robot naïf, à 1:02, est bien trop lent).

## Décisions en attente (pour le propriétaire)

- **Le duel (étape 4, le dernier critère)** : sur le circuit technique, un pilote 6 % plus rapide ne double jamais un plus lent (il arrive au freinage 11–19 m derrière, même vitesse de pointe). **Les 3 options ont été mesurées par le Codeur 1 (tour 25, 30 courses chacune) et aucune ne tient seule** : A (aspiration 0,5 / 80 m) → 11 chocs au lieu de 4 et toujours pas de dépassement ; B (nez devant 0,2) → aucun effet, il n'arrive jamais à côté ; C (rythmes 0,90–1) → plateau plus lent, pas de dépassement. La cause : 14 m de suivi en virage = 29 m à la sortie, et un virage lent exige le nez devant au freinage. Le seul chemin est un tour d'IA dédié : suivre plus près en virage sans quitter sa ligne, remontée dans le sillage, et **l'attaqué qui laisse la place à une entrée côte à côte dans les virages lents** (donc des chocs à régler sur un tour). **Question pour le propriétaire : on accepte des entrées côte à côte dans les virages lents (plus de risque, plus de spectacle), ou on garde l'état actuel (41 dépassements par 30 courses, presque tous au freinage sur erreur, vainqueur ≠ poleman 1/30) ?** Avis du Chef : oui, côte à côte, c'est la F1 ; mais c'est un tour d'IA à part, pas ce soir.
- À l'épingle du circuit technique, toutes les IA roulent à la corde (écart 0,40 m entre elles) même quand leur style prévoit une ligne plus large : la visée coupe vers l'intérieur dans les virages lents. Réaliste, ou veux-tu une visée plus courte dans les virages lents (ça change le pilotage des IA, à ressentir) ?
- **Les 12 tracés refaits d'après les vrais** (ouvrir tests/circuits-a.svg et tests/circuits-b.svg dans Chrome ; les cartes sont tournées, le départ part vers la droite) : reconnaissables ? Points faibles connus : l'épingle de Monoco (108°), Bahrayn et Melbourn Park génériques. Ton accord = on les branche dans le jeu (?circuit=monoco…).
- La liste des améliorations du garage proposée au tour 23c (changeurs de roues, moteur, aéro, freins ; +7 % au plus) : à approuver.
- Les IA, même en légende, font 49,4 s seules sur le circuit test (le propriétaire ≈ 45 s) : les rendre plus rapides ?

- Rendre l'herbe plus pénalisante (pour que les erreurs des IA coûtent, et donc des surprises) : ça change aussi la conduite du joueur.
- Les noms des 20 pilotes et des 10 écuries (provisoires dans donnees.js).


- La liste des 12 circuits.
- La liste exacte des améliorations du garage.
- La météo à l'étape 12 : oui ou non.

## Journal des sessions

| Date | Étape | Ce qui a été fait |
|---|---|---|
| 2026-10-18 | — | `CLAUDE.md` écrit avec le propriétaire |
| 2026-10-18 | 0 | Tour 1 : fondations, 47/47 tests, a4f5bdd, vérifié par le Chef |
| 2026-10-18 | 1 | Tour 2 : le circuit, 82/82 tests, 16de5dc, vérifié par le Chef ; ondulations à corriger |
| 2026-10-18 | 1–2 | Tour 3 : la voiture roule, 121/121 tests, 43a3fa8, robot 66,55 s, nom Grand Prix Dynasty dans le jeu |
| 2026-10-18 | 3 | Tour 5 : chrono, tours, secteurs, ✂ +5 s, écran de choix, pause, écran de fin, records ; 194/194, 44b3624 |
| 2026-10-18 | 3 | Tour 6 : secteurs du tour en cours, arrêt après l'arrivée, sons 3-2-1-GO et arrivée ; 200/200, e59f5a2. Fin de session (20h20). |
| 2026-10-22 | 4d–5–6–7–13–15 | Grande fusion f2ff5ee vérifiée par le Chef (137/137, 38/38, 257/257 + annexes sdk 19, pneus 28, enregistreur 28, circuits-a 49, circuits-b 45, textes 85) : coût des erreurs (+0,89 s), niveaux de difficulté (?niveau=), qualification du joueur, niveau des écuries ; fichiers des 6 agents (sdk.js, pneus.js, enregistreur.js, 12 tracés de circuits à approuver, audit des textes), pas encore branchés. Le « cloud » n'était pas disponible : les agents ont tourné sur le Mac ; le propriétaire : plus d'agents. Encore : vainqueur ≠ poleman 0/30 (le duel, en cours chez session-dd) |
| 2026-10-21 | 4d–5–6 | Reprise dans « Grand Prix Dynasty ». Demandes du propriétaire faites et vérifiées par le Chef : radar + tour de classement (2a500e5), podium 3D + résultats avec pénalités à l'arrivée (3077e74), course qui attend la carte des IA (9f29dbf, défaut réel du départ), tests par partie (16165f5) ; Codeur 2 (session-9e) : vue cockpit devant le halo et voiture du joueur détaillée (6 appels, 1276 triangles), 5 feux et faux départ +5 s, vue télé après l'arrivée jusqu'à la dernière voiture ; main = bf3b57d (125/125, 37/37, 211/211). En cours : erreurs des IA (dd, Fable 5.1), moteur du championnat (9e) |
| 2026-10-20 | 4d | Tour 17 : une ligne choisie se garde (régularité 4,2 ×, 31 dépassements, 5 chocs), « GPU stall » ignoré ; 118/118 + 37/37 + 159/159 chez le Chef, 55/100. Fin de la boucle à 20h35 |
| 2026-10-20 | 4d | Tour 16 : caractère chiffré (régularité, agressivité, erreurs) et régularité sur main, 117/117 + 37/37 + 159/159 chez le Chef, 54/100 ; régularité à l'envers (0,274 contre 0,102 s) ; erreurs sur la branche tour-16 (149 erreurs, mais chocs) ; vainqueur ≠ poleman 0/30 |
| 2026-10-20 | 4c | Tour 15 : IA_DEPASSEMENT = true sur main (fusion de repli : 28 dépassements, 4 chocs > 5 m/s, herbe 3666 pas, 20 voitures 0 choc) ; suivi en temps essayé et abandonné ; 116/116 + 37/37 + 159/159 chez le Chef, 54/100 |
| 2026-10-20 | 4c | Tour 14 : tests/courses.html sur main (30 courses, critère de l'étape 4) ; 115/115 + 33/33 + 159/159 chez le Chef, d840007, 53/100. Branche tour-14 : 28 dépassements, 4 chocs, duel bloqué par le suivi à 14 m |
| 2026-10-20 | 4c | Tour 13 : pas vert (branche tour-13) : tests/courses.html (30 courses), zones d'attaque ; 88–96 dépassements, 11–16 chocs > 5 m/s, duel cassé. Main inchangé |
| 2026-10-20 | 4c | Tour 12 (interrompu par la veille du Mac jusqu'à 18h) : grille qualifiée, tests moins pressés, 4b « au plus 1 choc > 5 m/s par course » ; 129/129 + ecrans vert chez le Chef, 2c13e30, 52/100. Dépassements sur la branche tour-12-attaque : duel OK, 2–4 chocs sur 10 courses |
| 2026-10-19/20 | 4c | Tour 11 : ?ia=N&joueur=1 (le propriétaire conduit au milieu des IA), calcul 2–3 s ; attaque sur une branche à part (44–65 dépassements mais 7–28 chocs) ; main 128/128, ecrans 157/159 chez le Chef (2 tests trop pressés), 159/159 chez le Codeur ; 51/100. Un Chrome de test orphelin (5 h 38) tué à 2h34 |
| 2026-10-19 | 4 | Tour 10 : plus de rail, chaque IA choisit sa ligne (styles, variation), aspiration dans la physique ; 126/126 + 148/148, 7b2b1bf, vérifié (50/100). Dépassements pas encore en marche |
| 2026-10-19 | 4b | Tour 9 : contacts entre voitures, simulation.js, rythmes, ?ia=N ; 124/124 + 147/147, 37196cd + bc85623, vérifié (49/100). 10 courses propres mais procession : l'ordre d'arrivée = la grille |
| 2026-10-19 | 4a | Tour 8 : IA robuste (18 départs, voiture lente devant, calcul en fond) ; 103/103 + 135/135, 7cd8ce5, vérifié par le Chef (48/100). 4a atteinte, attend le propriétaire |
| 2026-10-19 | 4a | Tour 7 : circuit technique, ia.js, piloteIA, ?ia=1 ; 99/99 + 133/133, fbbf844, vérifié par le Chef (47/100). Ordre 5 (CLAUDE.md) refusé par le Codeur : question à le propriétaire |
| 2026-10-18 | 2 | Tour 4 : son, 8 rapports, ?reglages=1 (22 curseurs), caméra fixe, direction en deux temps, tête-à-queue corrigé, herbe, voiture 28 → 6 appels ; 168/168, 09ae548 |
