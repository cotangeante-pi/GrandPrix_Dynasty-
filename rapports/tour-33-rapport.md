TOUR 33 (2026-10-27, la suite du soir) — les ordres qui attendent le premier Codeur libre
Chef : session-5b. Le propriétaire : « fais la météo quand un aura fini sa part ; si tout est fini améliore les voitures IA et fais qu'on puisse discuter avec eux, comme dans gestion de pays » ; il ne fera pas d'essais avant longtemps. CLAUDE.md : « La météo », « Les discussions avec les pilotes et les écuries », étapes 12 et 12b : relis-les entières.
Horaires : rien de nouveau après 23h40, dernier push 23h50, compte rendu avant 23h55. Mêmes règles que le tour 32.

A. LA MÉTÉO (au premier Codeur qui finit sa part du tour 32)
1. meteo.js en calcul pur : la prévision par lieu (METEO_LIEUX), la météo de la course tirée avec la graine du GP et ses changements tirés d'avance, le niveau d'eau de la piste (monte, baisse, plus vite sur la trajectoire), l'adhérence de chaque pneu (slick, intermédiaire, pluie) selon l'eau, l'usure des pneus de pluie sur le sec ; physique.js lit UN facteur d'adhérence (1 = sec, au bit près ; dis-le au Codeur 1 s'il n'est pas toi) et l'aspiration réduite par la gerbe.
2. Les choix de pneus : au garage avant les qualifications, et à chaque arrêt (l'arrêt pour changer de pneus compte comme l'arrêt obligatoire) ; les IA choisissent avec la même information que le joueur (la piste qu'elles voient, la prévision ; jamais l'avenir), selon leur caractère.
3. À l'écran : la prévision au paddock, la pluie (particules en un appel), les gerbes, la piste mouillée plus sombre, le ciel couvert, l'icône météo et le niveau d'eau près des pneus, les messages « La pluie arrive » / « La piste sèche ».
   Fini quand : les tests de CLAUDE.md « La météo » ; une page tests/meteo.html (30 courses avec pluie : l'arrêt change le classement, chocs et herbe dans des garde-fous à l'échelle) ; au sec tout est identique au bit près ; captures pluie.png, pluie-960.png, prevision.png ; appels de dessin avec 20 voitures sous la pluie ; GitHub vert.

B. LES IA AMÉLIORÉES (quand A est pris et qu'un Codeur est libre ; en priorité le Codeur 1)
1. Leur rythme : seules sur le circuit test, en légende, elles font 49,4 s quand le propriétaire fait 45 s : rapproche le rythme du meilleur niveau du sien (le pilote IA le plus fort en légende vers 45–46 s, les niveaux plus bas plus lents, les écarts entre pilotes gardés), sans toucher la physique ni la voiture (la même pour tous) : c'est la façon de piloter (marges, freinage) qui change. Mesure sur les 12 tracés aussi.
2. Le duel (étape 4, s'il n'est pas tenu au tour 32).
   Fini quand : le tableau des tours seuls par niveau sur test et sur 3 tracés ; courses.html dans ses garde-fous ; GitHub vert.

C. LES DISCUSSIONS (quand le reste est fini ; en priorité le Codeur 3, qui a fait l'interview, le journal et la fiche)
1. Le moteur en calcul pur (discussion.js, parle.js) : le lexique et le langage parlé (s'inspirer de ../../gestion de pays/ia-oral.js et diplomatie.js : lis-les, ne les copie pas tels quels : un autre jeu, d'autres intentions), les intentions de CLAUDE.md, le raisonnement de chaque interlocuteur (caractère, rivalité, mémoire, intérêts), les réponses composées depuis ce raisonnement en + fr ; un banc de phrases tests/banc-parle.html (saisie libre et langage parlé, dans les deux langues).
2. L'écran : « Discuter » sur la fiche d'un rival, au paddock avec le coéquipier et le patron ; la saisie libre et le composeur au clic ; l'historique de la conversation.
3. Le courrier des pilotes (courrier-pilotes.js) : ils écrivent d'eux-mêmes après les faits, une boîte de messages au paddock.
   Fini quand : les tests de CLAUDE.md « Les discussions » ; captures discussion.png, courrier.png, en + fr, 960 et 1280 ; GitHub vert.
