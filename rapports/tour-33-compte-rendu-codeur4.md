TOUR 33d — compte rendu du Codeur 4 (les aides au premier usage, étape 11b ; puis le tutoriel guidé, étape 11d)

Commit : d6b79dd (branche codeur4, fusionnée avec main e9a2bb2). Passage GitHub 40600081242 : les 12 travaux sont verts.

Ordres :
1. aides.js en calcul pur : fait.
   - 11 aides : premiers feux, première qualification, fantôme, arrêt obligatoire, pluie, consigne d'équipe, garage, aileron, duel au paddock, contrats, interview.
   - Chaque aide a sa condition, lue dans l'état du jeu (AIDES.situation), et ce qui la ferme quand l'action est faite.
   - Une aide n'est vue qu'une fois. Les aides vues sont gardées à la racine de la sauvegarde (`aides`, un champ ajouté s'il manque, sans changer de version).
   - « Revoir les aides » les remet toutes. Le réglage AIDES_ACTIVES les coupe toutes.
   - Les réglages sont dans un bloc de donnees.js (AIDES_*).
   - Les aides de course ne s'affichent qu'à l'arrêt, ou si la piste reste droite sur 140 m devant la voiture, sans freinage et sans volant tourné. Si un virage arrive, la bulle se cache et le temps d'affichage ne compte pas.
   - En course, une bulle se ferme seule après 7 s. Sur un écran, elle reste jusqu'au clic ou jusqu'à ce qu'on quitte l'écran.
   - Aucune aide ne s'affiche pendant le premier tour de la découverte (elle a déjà ses aides ↑ ← → ↓). L'aide des feux vient donc à la première course de la carrière.
2. L'affichage : fait. C'est le bloc AIDES_ECRAN, à la fin de interface.js.
   - La bulle est faite avec le thème télé (--tv-*).
   - En course, elle est à gauche, sous le bandeau des stands (top: max(36 %, 226 px)), avec 3 lignes au plus.
   - Sur les écrans, elle est en haut à gauche, à gauche du titre (38vw, 2 lignes).
   - Un clic la ferme.
   - « Revoir les aides » est dans le coin en bas à droite du paddock et dans le menu pause.
3. Les textes en anglais et en français : faits. Ils sont dans un bloc Object.assign de textes.js, jamais genrés (c'est testé).

Le tutoriel guidé (demande du Chef dans la soirée) : fait.
- tutoriel.js en calcul pur, avec les 7 leçons de CLAUDE.md. Chaque leçon a son but, sa mise en place (une page `index.html?tutoriel=<id>&…` qui utilise les modes existants) et sa réussite mesurée sur l'état du moteur.
- Leçon 1 : un tour sans sortir.
- Leçon 2 : la zone du virage le plus serré, entre des plots orange (une InstancedMesh, un seul appel de dessin), en moins de TUTO_ZONE_OBJECTIF = 9 s, avec 3 essais.
- Leçon 3 : un départ parfait ou bon.
- Leçon 4 : passer une IA lente (TUTO_IA_RYTHME 0,8, un réglage de son pilote, pas la physique) et rester devant 2 s.
- Leçon 5 : un arrêt au stand sans excès de vitesse.
- Leçon 6 : l'averse (?meteo=averse), puis un arrêt pour des pneus pluie ou intermédiaires.
- Leçon 7 : la visite paddock → garage → aileron → paddock.
- Une leçon de course est ratée si rien n'est fait pendant TUTO_TEMPS_MAX = 240 s. Chaque leçon peut se passer (« Passer ⏭ ») ou se recommencer. Une étoile par leçon réussie, gardée à la racine de la sauvegarde (`tutoriel`).
- L'écran est le bloc TUTORIEL_ECRAN de interface.js : la liste des leçons avec les étoiles, la consigne à gauche (en haut à gauche pendant la visite), et le résultat. Derrière le résultat, la course est arrêtée et gameplayStop est envoyé.
- « Apprendre à piloter » est sur l'écran titre (petit, sous « Entre amis »), dans le menu pause, sur « Bravo ! » (« D'abord apprendre ») et au paddock.
- Au paddock, le bouton est dans le coin en bas à gauche, et non dans la rangée Course comme le dit CLAUDE.md : le test du paddock fixe le contenu des 4 rangées, et en 960×600 en anglais la rangée débordait (vu au passage 40595571314). Si la rangée Course est voulue, il faut d'abord changer ce test.
- Pendant une leçon, aucune bulle d'aide ne s'affiche.

Sortie des tests (GitHub 40600081242) :
- moteur, courses, stands, consignes, officiels, meteo, paquet : verts.
- annexes : vert, avec tests/aides.html 20/20 et tests/tutoriel.html 17/17.
- ecrans en 4 tranches : 340/340, 313/313, 301/301, 374/374. Durées de ecrans.py par tranche : 279, 337, 228 et 313 s (la limite est de 600 s).
- Les pages ajoutées à ecrans.py :
  - ?test=aides-course (960 et 1280) : la qualification, puis les feux, puis l'arrêt obligatoire suivi image par image sur un tour ; le menu pause et « Revoir » ; AIDES_ACTIVES coupé.
  - ?test=aides-menus (960 et 1280) : le duel, le garage, l'aileron, le rechargement, « Revoir » au paddock, une ancienne sauvegarde.
  - ?test=tuto-menu (960 et 1280).
  - Les 7 leçons jouées par le robot, plus une page ?test=tuto-rien.
- Sur le Mac, le verrou était pris presque tout le temps par les autres Codeurs : j'ai tout vérifié sur GitHub. Les deux pages de calcul pur passent aussi dans JavaScriptCore, avec osascript -l JavaScript et une petite cale (sans Chrome ni verrou ; scratchpad codeur4/jxa.py).

Mesures :
- Rien ne recouvre la piste devant la voiture. Les 135 points du couloir de la voiture (±2 m, de 6 à 140 m devant) sont projetés à l'écran par la caméra : 99 à 100 % sont gris de route, et 0 est sous la bulle, sur la grille comme en roulant, en 960×600 et en 1280×720. Les bulles sont en [16, 226, 334, 295] en 960 et [16, 259, 334, 328] en 1280.
- La course de découverte n'est pas ralentie. Clic → premier feu : 0,2 s (de 0,1 à 0,6 s sur main). Clic → feux éteints : 11,7 s sur ce passage, et 17,9 s sur le passage 40597932135. Sous swiftshader, ce chiffre dépend de la machine GitHub : il varie de 8,8 à 17,9 s sur les passages de main de ce soir. Pendant la découverte, aucune aide ne s'affiche (le calcul de la situation est une boucle de 70 échantillons par image).
- Sur le circuit test, 51 % du tour est en ligne droite au sens des aides.
- Leçon du freinage : le robot passe la zone (360 → 578 m) en 6,80 s, pour un objectif de 9 s.
- Leçon du départ : le robot fait un départ « parfait », réaction 0,2 s.
- Captures (artefacts du passage) : aide-stand.png, aide-stand-960.png, aide-garage.png, aide-garage-960.png, tuto-menu(-960).png, tuto-plots.png, tuto-<leçon>.png, tuto-reussie-stand-960.png, tuto-rate-960.png, tuto-visite.png.

Changements hors de mes blocs :
- principal.js, 1 ligne : une leçon du tutoriel saute la qualification.
- tests/ecrans.py, 1 ligne : le test course_ia ignore les pages ?tutoriel= (elles ont ia=1).
- tests/lancer.py, 1 ligne : ANNEXES.extend.
- index.html : de nouvelles lignes seulement.
- style.css : un conflit à la fusion (le bloc des pneus du garage, Codeur 1). J'ai gardé les deux blocs.

Pour CLAUDE.md (au Chef) :
- La liste des fichiers : `aides.js` (les aides au premier usage) et `tutoriel.js` (le tutoriel guidé), plus leurs pages tests/aides.html et tests/tutoriel.html dans les annexes.
- « Apprendre à piloter » est dans un coin du paddock et non dans la rangée Course (voir plus haut).
- Une page de calcul pur peut se jouer sans Chrome, avec `osascript -l JavaScript` (JavaScriptCore) : c'est utile quand le verrou est pris.

Ce que je n'ai pas pu vérifier :
- Le ressenti en vrai : la bulle est-elle lisible et vient-elle au bon moment ? L'objectif de 9 s de la leçon 2 est-il juste pour un humain (le robot fait 6,80 s) ? L'IA à 0,8 de la leçon 4 est-elle trop lente ? À essayer par le propriétaire.
- L'aide de la consigne d'équipe et celle des contrats ne sont testées qu'en calcul pur, pas dans la page.
- La leçon 7 utilise le championnat de la sauvegarde. Si on y touche l'aileron, le cran est gardé dans la carrière.

Réévalue.

---

TOUR 33e — le petit ordre du Chef (branche codeur4, partie de main 700eab9)

Commit : ce5d278. Passage GitHub 40602729981 : les 12 travaux sont verts (ecrans 375/375, 326/326, 314/314, 357/357).

Ordres :
1. La visite (leçon 7) ne laisse rien dans la carrière : fait.
   - TUTORIEL_ECRAN copie le championnat de la sauvegarde avant que la page ne démarre : interface.js se charge avant principal.js, la copie est donc prise avant toute écriture.
   - Elle le remet à la fin de la leçon réussie, avant l'étoile (qui est à la racine, à côté du championnat), et au `pagehide` : leçon passée, quittée ou rechargée. Elle le remet aussi en mémoire (JEU.championnat).
   - Une sauvegarde sans carrière reste sans carrière.
   - Tests (?tutoriel=visite) : on pose une carrière (graine 7), on change les pneus du départ et l'aileron, puis :
     - leçon réussie (1280) : la sauvegarde et la mémoire sont exactement comme avant ;
     - page quittée en cours de route (960) : la sauvegarde est exactement comme avant, sans étoile.
2. Les aides de la consigne d'équipe et des contrats testées dans la page : fait, avec ?test=aides-consigne en 960 et 1280.
   - Contrats : l'écran est ouvert par montrerContrats. La bulle a son texte, tient en 2 lignes et ne touche ni les boutons, ni les offres, ni le titre. Un clic la ferme, l'aide est vue, et elle ne revient pas.
   - Consigne : une vraie course du championnat, avec la consigne posée comme dans consigne_ecran. Le robot a été suivi image par image : la bulle s'affiche en ligne droite (42 images), attend dans les virages et n'est jamais affichée hors d'une ligne droite.
   - Aucun point du couloir devant la voiture n'est sous la bulle : 0 sur 135 (93 % des points gris de route en 960, 96 % en 1280).
   - Quand la consigne a sa réponse, la bulle se ferme et l'aide est vue.
   - Captures : aide-contrats.png, aide-consigne.png, aide-consigne-960.png.

Aucun test retiré. Rien n'a changé hors de mes blocs.

---

TOUR 35d — compte rendu du Codeur 4 (la chasse aux bugs sur une carrière entière, branche codeur4 partie de main 0d36ac6)

Commit : 9548446. Passage GitHub 40610040146 : vert, 13 travaux sur 13. Le nouveau travail « saison » fait 52/52 en 413 s.

Ordres :
1. Une carrière entière jouée de bout en bout : fait.
   - Le script est tests/saison.py. C'est une partie de lancer.py et un travail à lui dans tests.yml (« saison »), hors des tranches d'ecrans.
   - En français, 960×600, depuis la page nue sans sauvegarde : titre → découverte → Bravo → création du pilote → les 12 Grands Prix → cérémonie, classement, duel de la saison, contrats, sponsors → paddock de la saison 2.
     - Chaque Grand Prix : qualification passée, course d'un tour jouée par le robot, « passer », podium, résultats, interview, une.
     - Avant chaque Grand Prix, au paddock : le garage, le courrier, et une phrase écrite au coéquipier (sa réponse est vérifiée).
   - En anglais, 960×600 : le premier lancement et le Grand Prix 1, puis une fin de saison à partir d'un Grand Prix 12 fabriqué (?gp=12) jusqu'à la saison 2.
2. Ce que le script relève à chaque écran : fait.
   - Les erreurs et avertissements de la console.
   - Les textes « undefined », « NaN », « null », « [object », ou un {repère} non remplacé.
   - Les boutons et titres vides.
   - Les boutons hors de l'écran ou dont le texte déborde. Dans une liste qui défile, on regarde la liste.
   - Les boutons qui se recouvrent, et le défilement de la page.
   - Les clés de textes.js qui manquent : entre fr et en, et parmi les clés demandées à texte() pendant la carrière.
   - Les clics refusés, avec leur cause.
   - Les écrans où l'on reste bloqué (40 pas sans progrès).
   - Une capture de chaque nouveau problème.
3. Bugs trouvés et corrigés (petits et sûrs, interface seulement) :
   - **Le paddock ne tenait pas en 960×600.** En français, la rangée des boutons débordait des deux côtés (−41 → 1001 px). Après un Grand Prix, en anglais, le paddock dépassait en haut et en bas : la rangée des boutons allait jusqu'à 604 px. Les boutons du coin passaient alors sur « Next race » et « Play together » : la carrière restait bloquée au Grand Prix 2, car le clic sur « Course suivante » était pris par « Apprendre à piloter ». Remède dans style.css : un bloc @media qui serre les boutons (max-width 1100 px) et la hauteur (max-height 680 px). Rien ne change en 1280×720. Les 4 tranches d'ecrans restent vertes.
   - **Le titre du paddock gardait le circuit qu'on venait de courir.** Après le Grand Prix 1, il disait « Grand Prix 2 / 12 — Bahrayn » avec la carte de Melbourn Park. Remède, une ligne dans principal.js (montrerChampionnat) : le titre prend le prochain circuit, comme la carte.
   - Le reste ne venait pas du jeu, mais de mon script. « Passer » est caché pendant l'accéléré, c'est voulu. Le bandeau et la bulle ne s'affichent qu'à l'image dessinée suivante. Le script attend maintenant que l'élément soit visible.
4. Rien d'autre trouvé.
   - Console vide, aucun texte cassé, aucune clé manquante dans les deux langues, aucun écran bloqué.
   - Rien à signaler dans physique.js, ia.js, meteo.js, regie.js ni discussion.js : je n'y ai pas touché. Les réponses du coéquipier arrivent à chaque fois, par exemple « Merci, ça compte. » et « Kind of you. You drive well too. ».
   - À noter, mais je l'ai laissé tel quel :
     - Au début de la saison 2, le courrier montre « Courrier (20) », soit 20 messages non lus pour une saison. C'est dans la règle (3 au plus par Grand Prix), mais c'est beaucoup à lire.
     - Avec la réponse « provocante » à chaque interview, les jauges Écurie et Sponsors finissent à 14 : c'est l'effet voulu.

Sortie des tests : passage 40610040146 vert (moteur, courses, stands, consignes, officiels, meteo, ecrans 1 à 4, annexes, paquet, saison). Aucun test retiré.

Mesures : la carrière entière dure 413 s sur GitHub (Grand Prix 1 joué après 67 s, puis 35 à 40 s par Grand Prix). Capture du paddock de la saison 2 en 960×600 : saison-2.png, dans l'artefact « captures-saison ».

Ce que je n'ai pas pu vérifier :
- En 960×600 anglais, la fin de saison part d'un Grand Prix 12 fabriqué, pas d'une saison anglaise jouée en entier.
- La fiche des rivaux, le calendrier, l'album et l'arbre ne sont pas visités par le script : ils ne sont pas dans l'ordre. Ils restent vérifiés par ecrans.py.

---

TOUR 36d — compte rendu du Codeur 4 (améliorer l'IA de discussion, avec le Codeur 3 ; branche codeur4 partie de main f44378c)

Commits : 15f153f (passage 40613922417, vert, fusionné sur main 9bf380e), puis 79ce6e9 (passage 40616340804 : 13 travaux sur 13 verts).

Le partage avec le Codeur 3 (validé par le Chef) :
- à moi : parle.js, les bancs de phrases, les variantes dis_* et le rangement du courrier ;
- à lui : discussion.js (la conversation, la mémoire, les faits), à partir de 15f153f. Avant, j'y avais mis la base : RECLAMATION, faits(), les souvenirs, le plafond par Grand Prix, le ton, la variété, les deux idées.
- Il a fusionné mes commits, j'ai fusionné les siens (24e82f2, les patrons ; 4394a98, la conversation). On s'est prévenus avant chaque push.

Ordres :
1. **Comprendre plus** (parle.js) : fait.
   - 175 phrases de joueurs de 10 à 16 ans ajoutées au banc (291 en tout), en anglais et en français, dans tests/banc-parle-36d.js :
     - les plaintes de course (un nouvel acte RECLAMATION : « pk tu m'as bloqué », « tu m'as fermé la porte », « you brake checked me ») ;
     - les contacts (« why did you crash me », « tu m'as fumé ») ;
     - les moqueries de jeu (« ez », « cheh », « skill issue », « t'es éclaté ») ;
     - les compliments d'ados (« t'es chaud », « masterclass », « you're cracked ») ;
     - les nouvelles de la course (« t'as fini combien ») ;
     - « tkt », « pk », « jsp », « pas mal », « t'es pas nul » ;
     - les lettres répétées (« merciii ») et les émojis (👍 🙏 🔥 😡).
   - Deux idées dans une phrase : l'analyse donne `second`. L'idée forte est celle après « mais », et l'autre reçoit aussi sa réponse.
   - L'analyse donne aussi `sujet` (départ, stands, pluie, qualif, virage, aspiration) et `tour` (le tour nommé), que lit discussion.js.
   - Une phrase incomprise reçoit une demande de reformuler. Contre les faux sens, PARLE_FLOU passe de 0,66 à 0,8 : avant, « monkey » était lu comme « money », donc un salaire.
2. **Répondre de façon plus variée** : fait.
   - Au moins deux tournures par réaction, dans les deux langues (c'est testé).
   - Des variantes _vif pour les pilotes fougueux et _doux pour les calmes : chacun garde son ton, et ne prend jamais celui de l'autre.
   - Les choix sont faits avec une graine fixe. Jamais deux fois la même réponse d'affilée sur 36 messages, avec au moins 15 réponses différentes.
3. **Plus lié à la course** : fait.
   - Les raisons fait_* citent seulement des faits vrais : places au championnat, points d'écart, places à la dernière course et son circuit, duel.
   - Le test vérifie que chaque nombre d'une réponse existe vraiment dans le championnat.
   - Les variantes _court (sans le circuit) servent quand le circuit est déjà cité dans la réponse.
4. **Une mémoire plus forte** : fait.
   - Les souvenirs (insulte, menace, compliment, excuse, paix) sont gardés sur plusieurs Grands Prix et rappelés avec leur circuit, une fois par Grand Prix.
   - La relation ne bouge pas de plus de DISCUSSION_PAS_GP = 12 par Grand Prix.
   - Le Codeur 3 a ensuite ajouté la conversation : une question reposée, les contradictions, la dernière conversation d'un Grand Prix à l'autre, l'au revoir.
5. **Le courrier** : fait, avec l'accord du Codeur 3.
   - ranger(ch, finGP) : les messages lus s'effacent au Grand Prix suivant ; les messages de plus de COURRIER_AGE_MAX = 3 Grands Prix s'effacent ; il reste au plus COURRIER_NON_LUS_MAX = 6 non lus.
   - Une ancienne sauvegarde à 20 messages est rangée dès qu'on l'ouvre.

Autres corrections, vues par la carrière entière (saison.py) :
- les trois boutons de la carte du paddock (Courrier, Coéquipier, Direction) débordaient en 960 ;
- une variante de ton manquante était lue comme une clé absente ;
- le script cliquait « Négocier » au lieu de « Signer » (c'était le script, pas le jeu).

Sortie des tests : passage 40616340804, 13 travaux verts. Le banc de phrases fait 56/56 avec osascript sur le Mac (pas de Chrome sur le Mac après 21 h). Aucun test retiré. Un test du Codeur 3, « le courrier sans redite », compte maintenant les messages écrits et non ceux qui restent dans la boîte, avec son accord.

Mesures : 291 phrases au banc. Sur un pilote, 36 messages donnent au moins 15 réponses différentes, et deux réponses de suite ne sont jamais les mêmes. Les 4 conversations de 10 échanges (fr / en, calme / fougueux) sont lues sans erreur.

Ce que je n'ai pas pu vérifier :
- Le ressenti d'un vrai joueur.
- Les réponses en anglais sont testées dans une page en français, donc les réponses y sortent en français ; les textes anglais ne sont vérifiés que par leurs clés et leurs repères.

Les deux conversations demandées par le Chef. Elles sont copiées telles quelles depuis la sortie du banc (tests/banc-parle.html, osascript, avec le codeur3 eeef707 fusionné). Le passage GitHub les imprime aussi dans le travail annexes. Entre crochets : l acte lu → la réaction.

```
  CONVERSATION en français, rival fougueux, après un contact :
    — slt
      → Hé ! Ça faisait longtemps.   [SALUT → salut]
    — pk tu m’as percuté au départ ?
      → Tu étais sur ma ligne. Point. Pas après ce qui s’est passé à Bahrayn. J’ai fini P1, toi P20. Au départ, tout le monde se bat pour le même trou.   [CONTACT → contact_assume]
    — c’était quoi ce contact sérieux
      → On a déjà parlé de ce contact.   [CONTACT → deja_contact]
    — dsl quand même
      → Trop facile. Des excuses ne suffiront pas. Je ne laisse jamais passer ça.   [EXCUSE → excuse_refusee]
    — t’as fini combien ?
      → P1 pour moi, P20 pour toi, à Bahrayn. On a exactement les mêmes points au championnat.   [ETAT → etat_place]
    — tu penses quoi de moi frérot
      → Pas mal. Mais pas encore à mon niveau.   [AVIS → avis_neutre]
    — gg mais tu m’as fermé la porte au virage
      → Ça, c’est sympa. Merci. C’est la course. Je ne vais pas t’ouvrir la porte. Dans ce virage, il y avait la place pour une voiture.   [RECLAMATION + COMPLIMENT → flatte + reclamation_assume]
    — laisse moi passer la prochaine fois stp
      → Tu rêves un peu, là.   [PASSER → passer_rit]
    — t’es chaud quand même
      → Venant de toi, ça compte. Je suis dans le coup en ce moment.   [COMPLIMENT → flatte]
    — a+
      → À plus. Bonne discussion.   [ADIEU → adieu]
  CONVERSATION en anglais, coéquipier calme :
    — hey mate
      → Hey.   [SALUT → salut]
    — how was your race?
      → Do not ask. We have exactly the same points in the championship.   [ETAT → etat_mal]
    — what about our duel?
      → All square between us. Every race counts. Our duel is at 0 – 0 this season (you first).   [DUEL → duel_egal]
    — you were faster today, well played
      → Thanks, that’s kind. At Bahrayn, I finished P19, you P20.   [COMPLIMENT → flatte]
    — what do you think of me?
      → Still watching you. Nothing decided yet.   [AVIS → avis_neutre]
    — let me pass next time if I’m faster pls
      → If you’re faster, I’ll let you by. For the team.   [PASSER → passer_accepte]
    — i owe you one
      → Noted. A promise is a promise.   [PROMESSE → promesse_notee]
    — nice pit stop btw
      → Thanks, that means something.   [COMPLIMENT → flatte]
    — why did you block me in turn 1
      → It was tight, but I stayed on my line. At the start, everyone is fighting for the same gap.   [RECLAMATION → reclamation_explique]
    — see ya
      → Right, take care. Good talk.   [ADIEU → adieu]
```

Ce qui sent encore le robot, à mon avis :
- les points au championnat sont égaux à 0 dans ces bancs, car le Grand Prix est fabriqué sans points : « On a exactement les mêmes points » arrive donc souvent ;
- « Ça, c est sympa. Merci. » ouvre deux réponses de suite au même compliment (avant la correction des ouvertures du Codeur 3, eeef707) ; dans la version imprimée ci-dessus, la 2e réponse ouvre bien sur une autre tournure ;
- le coéquipier calme ne parle pas encore de la consigne ni du duel de lui-même : il ne fait que répondre.

Ajouts de fin de soirée (tour 36d) :
- **L'anglais parlé est contracté** (demande du Chef, 22h30) : dans les en.dis_* d'origine, dans mon bloc et dans les en.courrier_* des pilotes, « I am », « Do not », « It is », « will not »… deviennent « I’m », « Don’t », « It’s », « won’t ». Les cinq « I’ll not » produits par la règle sont devenus « I won’t ». « (you first) » est reformulé en « you X, me Y », et en français « toi X, moi Y ». Un test du banc le vérifie. Il n'exclut qu'une clé, l'insistance d'un patron : « That cannot happen again. ». Le Codeur 3 contracte lui-même les clés de son bloc.
- **La place demandée** : `demandePlace` dans parle.js (« t'as fini combien », « what place did you get »). Le Codeur 3 y répond par la place (etat_place).
- Une correction à ma note sur les conversations plus haut : les deux réponses « flatte » qui ouvraient pareil étaient aux échanges 7 et 9, pas à la suite. Avec eeef707 (les 3 dernières ouvertures évitées), l'échange 9 ouvre sur « Venant de toi, ça compte. ».

Les deux conversations, version finale (avec dcc0908 du Codeur 3 : les 4 défauts du Chef corrigés). Copiées telles quelles depuis la sortie du banc (osascript, 61/61) :

```
  CONVERSATION en français, rival fougueux, après un contact :
    — slt
      → Hé ! Qu’est-ce qui t’amène ?   [SALUT → salut]
    — pk tu m’as percuté au départ ?
      → Tu étais sur ma ligne. Point. À Bahrayn, je finis devant toi : P1 contre P20. Au départ, tout le monde se bat pour le même trou.   [CONTACT → contact_assume]
    — c’était quoi ce contact sérieux
      → On a déjà parlé de ce contact.   [CONTACT → deja_contact]
    — dsl quand même
      → Trop facile. Des excuses ne suffiront pas. Pas après ce qui s’est passé à Bahrayn. Je ne laisse jamais passer ça.   [EXCUSE → excuse_refusee]
    — t’as fini combien ?
      → P1 pour moi, P20 pour toi, à Bahrayn.   [ETAT → etat_place]
    — tu penses quoi de moi frérot
      → Pas mal. Mais pas encore à mon niveau.   [AVIS → avis_neutre]
    — gg mais tu m’as fermé la porte au virage
      → C’est la course. Je ne vais pas t’ouvrir la porte. Dans ce virage, il y avait la place pour une voiture. Ça, c’est sympa. Merci.   [RECLAMATION + COMPLIMENT → reclamation_assume + flatte]
    — laisse moi passer la prochaine fois stp
      → Tu rêves un peu, là.   [PASSER → passer_rit]
    — t’es chaud quand même
      → Ça, c’est sympa. Merci. Je suis dans le coup en ce moment.   [COMPLIMENT → flatte]
    — a+
      → Salut. Pas ma conversation préférée.   [ADIEU → adieu_froid]
  CONVERSATION en anglais, coéquipier calme :
    — hey mate
      → Hey.   [SALUT → salut]
    — how was your race?
      → Don’t ask. We have exactly the same points in the championship.   [ETAT → etat_mal]
    — what about our duel?
      → All square between us. Every race counts. Our duel this season: you 0, me 0.   [DUEL → duel_egal]
    — you were faster today, well played
      → Thanks, that’s kind. At Bahrayn, I finished P19, you P20.   [COMPLIMENT → flatte]
    — what do you think of me?
      → Still watching you. Nothing decided yet.   [AVIS → avis_neutre]
    — let me pass next time if I’m faster pls
      → If you’re faster, I’ll let you by. For the team.   [PASSER → passer_accepte]
    — i owe you one
      → Noted. A promise is a promise.   [PROMESSE → promesse_notee]
    — nice pit stop btw
      → Thanks, that means something.   [COMPLIMENT → flatte]
    — why did you block me in turn 1
      → It was tight, but I stayed on my line. At the start, everyone is fighting for the same gap.   [RECLAMATION → reclamation_explique]
    — see ya
      → Right, take care. Good talk.   [ADIEU → adieu]
```

Il reste un défaut : « Ça, c’est sympa. Merci. » revient aux échanges 7 (en seconde partie de réponse) et 9. L’évitement des ouvertures ne regarde que le début des réponses.

Dernier commit vert du tour 36d : d0a1303, passage 40622371590 : 13 travaux sur 13 verts. Il contient codeur3 dcc0908.

TOUR 37d — compte rendu du Codeur 4 (en piste en 10 secondes, étape 15 ; branche codeur4 partie de main fd4d07e)
Commit : 88bf1f5 — passage GitHub 40765229091 vert, 14 travaux sur 14 (le nouveau : « premier »)
Ordres : 1 fait (mesures ci-dessous) / 2 fait autrement (la vraie cause n'était pas le chargement) / 3 fait (tests/premier.py)

1. La mesure, avant (main fd4d07e)
  - Sur le Mac (swiftshader, clic tout de suite) : page prête en 1586 ms ; clic → premier feu 0,19 s ; clic → feux éteints 20,8 s pour
    7,55 s de feux en temps de jeu. 3,5 images/s, image médiane 254 ms, la plus longue 1276 ms. La carte des IA finit 1,1 s après le clic.
    Même mesure avec la carte déjà finie avant le clic : 20,6 s. La carte n'est donc pas la cause.
  - La cause : la boucle avance au plus 12 pas par image (PAS_MAX_PAR_IMAGE, 0,1 s de jeu). À 3,5 images/s, 7,55 s de feux prennent
    donc environ 21 s réelles, et sur GitHub (environ 6 images/s) de 9 à 18 s.
  - Les scripts (analyse + exécution, entre deux évènements « load ») :
    principal.js 460–486 ms (le démarrage du jeu compris), three.min.js 210–250 ms, interface.js environ 47 ms, textes.js et circuits.js
    environ 20 ms, tous les autres au plus 16 ms. Les scripts qui ne servent pas à la première course coûtent tous ensemble environ
    15 ms : discussion.js 2 ms, parle.js 1,4 ms, et patrons, courrier, tournoi, deux-joueurs, journal chacun sous 2 ms.
  - Le code jamais exécuté avant les feux : 720 Ko sur 1824 Ko.
    | fichier | jamais exécuté / taille |
    |---|---|
    | three.min.js | 328 / 618 Ko |
    | interface.js | 76 / 117 |
    | principal.js | 50 / 120 |
    | ia.js | 48 / 76 |
    | discussion.js | 29 / 36 |
    | journal.js | 14 / 20 |
    | patrons.js | 12 / 16 |
    | carriere.js | 11 / 18 |
    | saisons.js | 11 / 17 |
    | decor.js | 10 / 48 |
    | courrier-pilotes.js | 8 / 12 |
    | parle.js | 7 / 31 |
    | interview.js | 7 / 11 |
    | tutoriel.js | 6 / 9 |
    | deux-joueurs.js | 5 / 9 |
  - Le paquet : 69 fichiers, 1927 Ko, zip 574 Ko (three.min.js 618 Ko, textes.js 139, principal.js 119, interface.js 117,
    donnees.js 99).

2. Le remède : les feux durent leurs vraies secondes
  - boucle.js : `BOUCLE.reglerPlafond(f)`. Le plafond de pas par image peut dépendre du moment ; il est relu à chaque pas.
  - donnees.js : `PAS_MAX_FEUX: 120`.
  - principal.js : pendant les feux d'une course (état « compte », la carte prête), la boucle rattrape le temps réel, jusqu'à 1 s par
    image. Dès l'extinction, le plafond revient à 12 pas par image. Pendant les feux les voitures sont tenues, donc ces pas coûtent
    peu. La course, la physique et les tests au pas près (BOUCLE.simuler) ne changent pas.
  - Le chargement différé n'est pas fait, et la mesure le justifie : il ferait gagner environ 15 ms sur 7,6 s. Il ferait aussi courir
    deux risques : un script chargé par JS manque au zip de paquet.py, et ces modules sont appelés dès le paddock, un « Continuer »
    pouvant y mener au démarrage. La carte était déjà calculée en fond, et un clic → premier feu de 0,2 s n'attend rien.

3. Le test : tests/premier.py (partie « premier » de lancer.py, travail « premier » de tests.yml)
  - 3 premiers lancements dans des contextes neufs, 960×600, swiftshader, puis la médiane.
  - Il vérifie :
    - la console vide ;
    - clic → premier feu < 1 s ;
    - clic → feux éteints sous la référence d'avant, 16,95 s (la médiane de 10 passages de main sur GitHub) ;
    - la durée des feux à 1,5 s près de leur temps de jeu ;
    - clic → feux éteints ≤ 10 s.
  - Il imprime aussi le tableau des scripts, la couverture et la taille du paquet.

Après (88bf1f5) :
  | | clic → premier feu | clic → feux éteints | images/s |
  |---|---|---|---|
  | Mac, avant | 0,19 s | 20,8 s | 3,5 |
  | Mac, après (médiane de 3) | 0,34 s | 7,71 s (8,02 / 7,71 / 7,68) | 2,7–3,5 |
  | GitHub, avant (10 passages) | 0,1–0,6 s | 8,8–17,9 s, médiane 16,95 | — |
  | GitHub, après (médiane de 3) | 0,05 s | 7,57 s (7,57 / 7,55 / 7,63) | 10–11 |
  ecrans.py sur GitHub : 7,7 s au premier lancement, 7,4 s au deuxième (carte en cache). Les feux tirent un délai de 0,8 à 2,6 s : le
  clic → feux éteints va donc de 5,8 à 7,6 s plus le clic → premier feu. Paquet et saison (fr et en) restent verts.
Ce que je n'ai pas pu vérifier : une vraie carte graphique (il faut l'essai du propriétaire) ; la sensation du départ quand une image dure
0,3 s (la réaction est mesurée en temps de jeu, comme avant).
Réévalue.

TOUR 38d — compte rendu du Codeur 4 (la chasse aux bugs dans les recoins ; branche codeur4 partie de main caca6d2)
Commit : 97f978a — passage GitHub 40771012637 vert, 16 travaux sur 16 (2 nouveaux : recoins-1 et recoins-2)
Ordres : 1 à 5 faits

tests/recoins.py (en 960×600, en français puis en anglais, joué par le robot ; outils communs avec saison.py dans tests/chasse.py, saison.py
inchangé dans ce qu'il vérifie) :
  - deux : titre → Entre amis → réglages (noms, 3 IA, 3 tours) → course à deux ; W et ↑ tenus ensemble : les deux voitures accélèrent ;
    la course jusqu'au podium, les résultats et le score de la rivalité (1 puis 2 courses), « Revanche », « Menu » → Entre amis ;
  - tournoi : 3 joueurs, ⚡ Éclair (1 manche) → podium → classement final → « Nouveaux joueurs », puis 🏆 Tournoi (3 manches, la page de
    chaque manche) → podium → classement final. Les égalités sont fabriquées sur l'écran final : en Éclair, deux temps égaux → le premier à
    l'avoir fait devant (Sarah > Tom > Léo) ; en Tournoi, 58 points chacun → le meilleur temps d'une manche (Tom > Sarah > Léo) ;
  - fin : Grand Prix 12 → cérémonie, classement, duel, contrats → retraite anticipée (deux clics) → bilan, temple, arbre → relève
    (sans prénom : le message ; Léa, fille) → paddock de l'héritière, arbre à 2 générations → sa 15e saison jouée d'avance → retraite par
    l'âge → temple (2 carrières) → « Nouvelle dynastie » (deux clics) → paddock d'un monde neuf ;
  - ecrans : calendrier, album feuilleté (boutons permis seulement), fiche d'un rival → Discuter, arbre, Mon casque, sponsors, courrier ;
    une course seule : qualification passée, Échap → menu pause, chaque réglage (fantôme ×2, commentateur ×3, revoir les aides), liste des
    leçons, Reprendre ;
  - tuto : les 7 leçons à la suite par « Leçon suivante » (le robot, la voie des stands, l'averse, la visite garage → aileron → retour),
    toutes réussies, puis la liste des leçons.
  Relevé à chaque écran : console, textes cassés, clés manquantes (gardées avant chaque navigation, ce que saison.py ne faisait pas),
  boutons vides / hors de l'écran / qui débordent / qui se recouvrent, défilement, clics impossibles, endroits où l'on reste bloqué.
  Sur GitHub : recoins-1 (deux, tournoi) 62/62 en 3,5 min, recoins-2 (fin, ecrans, tuto) 82/82 en 2 min.

Ce que la chasse a trouvé :
  - les pastilles de couleur des réglages à deux étaient des boutons sans aucun nom : corrigé, chacune a un aria-label (« Voiture 1 »…,
    texte('deuxCouleur')) ; l'inspection accepte un bouton nommé par aria-label ;
  - un faux positif de l'outil : les boutons du paddock sous la liste des leçons (posée par-dessus, presque opaque) comptaient comme
    « recouverts ». L'inspection ignore maintenant un bouton dont le milieu touche un autre bloc de la page ; deux boutons d'un même écran
    qui se chevauchent restent signalés ;
  - rien d'autre : aucune erreur de console, aucun texte cassé, aucune clé manquante, aucun débordement ni blocage, en fr comme en en.
À noter (pas un bug du jeu) : la retraite par l'âge fabriquée dit « après 1 saison », parce que le test saute à la 15e saison sans jouer les
autres (le bilan compte les saisons vraiment jouées).
Ce que je n'ai pas vérifié : 1280×720 (seulement 960×600, comme saison.py).
Réévalue.

TOUR 39d — compte rendu du Codeur 4 (les grandes tailles, 1280×720 et 1920×1080 ; branche codeur4 partie de main 7739942)
Commit : 067ff06 — passage GitHub 40774317298 vert, 16 travaux sur 16 (aucun travail de plus)
Ordres : 1 fait / 2 fait (rien à corriger) / 3 fait

1. tests/recoins.py a deux parties de plus, jouées en 1280×720 et en 1920×1080, en fr et en en (la machinerie de saison.py, Carriere.jouer) :
   - tailles-carriere : le premier lancement (titre → découverte → Bravo → création), le Grand Prix 1 joué par le robot (qualification,
     course, podium, résultats, interview, une ; au paddock garage, courrier, discussion) jusqu'au départ du Grand Prix 2, puis le paddock
     et tous ses écrans (calendrier, album, fiche → discussion, arbre, Mon casque, sponsors, courrier) et le menu pause avec ses réglages ;
   - tailles-jeux : une course à deux (réglages, deux claviers, podium, rivalité, Menu) et un tournoi ⚡ Éclair (inscription, 3 passages,
     podium, classement final, égalité départagée).
2. Le relevé (console, textes cassés, clés manquantes, boutons vides / hors de l'écran / qui débordent / qui se recouvrent, défilement,
   clics impossibles, blocages) : rien en 1280×720 ni en 1920×1080, en fr comme en en. Aucune correction de l'interface ni du CSS n'a été
   nécessaire.
3. Les durées (avant : recoins-2 à 546 s avec les grandes tailles) : découpé en trois tranches dans les 16 travaux. recoins-1 = deux,
   tournoi, tailles-jeux (409 s) ; recoins-2 = fin, tailles-carriere (431 s) ; le travail « premier » fait aussi ecrans et tuto
   (`partie: premier recoins`, 113 s). Le plus long travail du passage est saison (450 s). Tous restent sous 8 minutes.
Ce que je n'ai pas vérifié : la carrière entière aux grandes tailles (pas demandé) ; la fin de carrière en 1280 et 1920.
Réévalue.
