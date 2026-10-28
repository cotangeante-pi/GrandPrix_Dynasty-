// La compréhension des discussions (Codeur 3, étape 12b, CLAUDE.md « Les discussions avec les pilotes et les écuries ») : calcul pur,
// sans écran. Une phrase écrite librement, en français ou en anglais, avec le langage parlé (« slt », « t nul », « stp », « dsl »,
// « u r », « thx », « gg »…), devient un acte de langage (provoquer, s'excuser, demander de laisser passer…) et ses entités (le
// pilote nommé, un montant). La méthode vient du jeu de gestion de pays (ia.js, ia-oral.js), refaite pour la course :
//  1. la phrase est mise à plat (minuscules, sans accents ni ponctuation, sauf ? et !) ;
//  2. les tournures du langage parlé et les expressions figées deviennent des jetons connus (« laisse moi passer » → passer9) ;
//  3. chaque mot est projeté sur des concepts pondérés (LEXIQUE), un mot inconnu par sa forme la plus proche (fautes de frappe) ;
//  4. l'acte est le prototype le plus proche (similarité cosinus) ; la négation, la question et l'ironie sont relevées à part.
// Aucun hasard ici : la même phrase donne toujours la même lecture.
const PARLE = (function () {
  const sansAccents = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // --- 2. le langage parlé et les expressions (français et anglais), ramenés à des jetons. Les jetons finissent par un chiffre :
  // la coupe des finales (radical) ne les touche pas. L'ordre compte : les tournures longues d'abord.
  const EXPRESSIONS = [
    // --- tour 36d (Codeur 4) : les vraies phrases des joueurs de 10 à 16 ans, d'abord (les tournures longues avant les mots seuls)
    // les plaintes de course : « pk tu m'as bloqué », « tu m'as coupé la route », « why did you block me », « you brake checked me »
    [/\b(pourquoi |pk |pq |prk )?(tu m as|t m as|tu m a|t ma|tu ma|vous m avez) (bloque|bloquee|ferme la porte|coupe la route|coupe la trajectoire|tasse|serre|sere|enferme|gene|bouche|ralenti|freine dessus|pas laisse passer|empeche de passer)\b/g, ' plainte9 '],
    [/\b(t as|tu as|ta) (freine|freinee) (trop tot|comme un \w+|devant moi|n importe comment)\b/g, ' plainte9 '], [/\b(t as|tu as|ta) (zigzague|change de ligne|change de trajectoire|fait des zigzags|bouge au freinage)\b/g, ' plainte9 '],
    [/\b(arrete de me bloquer|arrete de me gener|tu bouchais|tu me bouchais|tu me bloquais|tu m as mis dans l herbe|tu m as pousse dans l herbe|tu m as envoye dans l herbe)\b/g, ' plainte9 '],
    [/\b(why did (you|u) (block|blocked|cut|squeeze|chop|brake check) me|why (u|you) (block|blocking) me|(you|u) (blocked|cut|chopped|squeezed|boxed|brake checked|brake ?tested) me( off| in)?|(you|u) closed the door( on me)?|stop blocking( me)?|(you|u) (moved|swerved|weaved) under braking|(you|u) kept weaving|(you|u) pushed me (onto|into) the grass)\b/g, ' plainte9 '],
    // les contacts dits par un joueur : « why did you crash me », « tu m'as fumé », « t'as tapé ma roue »
    [/\b(why did (you|u) (crash|hit|ram|wreck|bump|smash) (me|into me)|(you|u) (wrecked|smashed|clipped|tapped|punted) me|(you|u) (crash|crashed) me)\b/g, ' contact9 '],
    [/\b(pourquoi |pk |pq |prk )?(tu m as|t m as|tu m a|t ma|tu ma) (fume|defonce|explose|tape|tamponne|fonce dessus|rentre dedans|accroche|percute|touche|pousse|sorti|crashe|crash)\b/g, ' contact9 '],
    [/\b(t as|tu as|ta) (tape|touche|accroche|cogne) (ma|mon) (roue|aileron|voiture|caisse)\b/g, ' contact9 '],
    // les moqueries de jeu vidéo : « ez », « cheh », « dans tes dents », « get rekt », « skill issue » (des provocations)
    [/^\s*(ez|easy|ez win|trop facile|cheh|dans tes dents|dans ta face|get rekt|rekt|skill issue|git gud|get good|cope|cry about it|mdr t es mort|t es mort)\s*[!.]*\s*$/g, ' insulte9 '],
    [/\b(trop facile contre toi|t es eclate( au sol)?|t es claque( au sol)?|t es une tanche|t es mauvais|t es trop mauvais|t es pas bon|bouffon|boloss|tete de noeud|t es un bot|t es une brele|t es un noob|t es nul a chier|t es catastrophique|t es pas au niveau)\b/g, ' insulte9 '],
    [/\b((you|u) suck|ur trash|you re trash|youre trash|you re bad|ur bad|(you|u) (are|r) (a )?bot|bot driver|so bad|trash driver|worst driver|you re a joke|ur a joke|clown driver|what a noob|absolute noob|get off the track)\b/g, ' insulte9 '],
    // les compliments d'ados : « t'es chaud », « t'es une machine », « masterclass », « le goat », « you're cracked », « sick move »
    [/\b(t es|tu es|t etais|tu etais) (trop |vraiment |grave |super )?(chaud|chaude|un monstre|une machine|un boss|une boss|un crack|un genie|une legende|le goat|la goat|un goat|incroyable|ouf|trop chaud|en feu|une bete|un tueur|une tueuse)\b/g, ' bravo9 '],
    [/\b(masterclass|le goat|goat|goated|t as gere|tu geres|t as assure|tu assures|big up|bien vu|joli coup|joli depassement|belle manoeuvre|belle remontee|quelle course|c etait (trop )?(beau|fou|ouf|propre|incroyable)|respect a toi|trop bien pilote|gg a toi|ggwp|ggs|gg wp)\b/g, ' bravo9 '],
    [/\b((you|u) (are|r)|you re|youre|ur) (so |really |actually )?(cracked|insane|cold|a beast|a monster|a machine|goated|the goat|on fire|unreal|nuts|clutch)\b/g, ' bravo9 '],
    [/\b(sick (move|pass|race|overtake)|insane (move|pass|race|overtake)|clean (move|pass|race|overtake)|what a (move|pass|race|drive|save)|well played|wp|nice one|big respect|props to you|that was (sick|insane|amazing|clean|epic))\b/g, ' bravo9 '],
    // les nouvelles de la course : « t'as fini combien », « c'était comment », « how did you do », « what place did you get »
    [/\b(t as fini (combien|ou|a quelle place)|tu as fini (combien|ou|a quelle place)|t as fait combien|c etait comment (la course|ta course)?|ta course c etait comment|t en es ou|tu en es ou|la forme|bien ou quoi|ca dit quoi|quoi de neuf|ca roule)\b/g, ' etat9 '],
    [/\b(how did (you|u) do|what place did (you|u) (get|finish)|where did (you|u) finish|how was (your|ur) race|what s up|whats up|wyd|you good|u good)\b/g, ' etat9 '],
    // tranquille, pas grave : la paix (« tkt », « c'est rien », « pas grave », « no worries », « all good »)
    [/\b(tkt|t inquiete|t inquiete pas|c est rien|c est pas grave|pas grave|c est oublie|on s en fiche|no worries|all good|it s fine|its fine|no biggie|water under the bridge)\b/g, ' paix9 '],
    // les amis (« frérot », « bro », « mon reuf ») et les jurons sans cible (« ptn », « wtf ») : pas des actes
    [/\b(frerot|frere|mon reuf|reuf|bro|bruh|mec|poto|mon pote|dude|mate|ptn|putain|wtf|omg|bordel)\b/g, ' '],
    // « pk », « pq », « prk » : pourquoi ; « pcq », « psk » : parce que ; « jsp » : je sais pas
    [/\b(pk|pq|prk|pourkoi|pourquoa)\b/g, ' pourquoi '], [/\b(pcq|psk|pck|paske)\b/g, ' parce que '], [/\b(jsp|chepa|chais pas)\b/g, ' je sais pas '],
    // la course : laisser passer, rendre la pareille, bloquer un autre, le contact, la paix
    [/\b(laisse|laisses|laissez|laisser) (moi|nous) (passer|doubler|filer)\b/g, ' passer9 '],
    [/\b(tu (peux|pourrais|veux bien|voudrais bien) )?(me |m )?laisser passer\b/g, ' passer9 '],
    [/\b(laisse|laisses) passer\b/g, ' passer9 '], [/\b(pousse toi|ecarte toi|bouge de la|degage de ma trajectoire|cede moi la place)\b/g, ' passer9 '],
    [/\b(let me (pass|through|by)|let me overtake|move over|get out of my way|give me the place|make room)\b/g, ' passer9 '],
    [/\b(je (te |t )?(rendrai|rends|revaudrai|revaudrais) (la pareille|ca|le service)|je te (le )?revaudrai|renvoyer l ascenseur|je (te )?rendrai le service|un service en vaut un autre|a charge de revanche)\b/g, ' rendre9 '],
    [/\b(i (ll|will) (return|repay) the favou?r|i owe you( one)?|i (ll|will) pay you back|you scratch my back)\b/g, ' rendre9 '],
    [/\b(bloque|bloquez|bloquer|retiens|retenez|ralentis|gene|genes|freine) (le|la|les|l)\b/g, ' bloquer9 '], [/\b(defends toi contre|empeche le de passer|ne le laisse pas passer)\b/g, ' bloquer9 '],
    [/\b(block|hold up|slow down|stop|hold back) (him|her|them)\b/g, ' bloquer9 '], [/\b(don t let (him|her|them) (pass|through))\b/g, ' bloquer9 '],
    [/\b(tu m as (percute|touche|tape|pousse|sorti|accroche|envoye dans|rentre dedans|fait sortir|dans le mur)|tu m es rentre dedans|tu (m )?as fait sortir|accrochage|carambolage|tu m as foutu dehors)\b/g, ' contact9 '],
    [/\b(you (hit|crashed into|rammed|pushed|bumped|took) me( out| off)?|you crashed|you ran me off|that crash|the crash|our crash|the collision)\b/g, ' contact9 '],
    [/\b(sans rancune|on fait la paix|faisons la paix|on enterre la hache|enterrons la hache( de guerre)?|on oublie tout|tournons la page|on repart a zero|on est quittes?|plus de rancune)\b/g, ' paix9 '],
    [/\b(no hard feelings|let s make peace|make peace|bury the hatchet|let s move on|clean slate|we re (good|even|cool)|truce)\b/g, ' paix9 '],
    [/\b(que penses tu de moi|tu penses quoi de moi|qu est ce que tu penses de moi|ton avis sur moi|tu me trouves comment|comment tu me trouves)\b/g, ' avis9 '],
    [/\b(what do you (think|make) of me|how do you see me|your opinion of me|what s your opinion)\b/g, ' avis9 '],
    [/\b(comment (ca va|tu vas|vas tu|va ta saison|se passe ta saison)|ca va bien|ta saison|tu te sens comment|la forme)\b/g, ' etat9 '],
    [/\b(how are (you|u)|how s (it going|your season|life)|how do you feel|how r u|hows it going|you ok)\b/g, ' etat9 '],
    // avec le patron : le budget de la voiture (l'aileron, les améliorations) et les consignes d'équipe
    [/\b(plus de budget|du budget|un budget|le budget|budget de developpement|argent pour (la voiture|le garage|l aileron)|ameliorer la voiture|ameliorations?|nouvel aileron|un meilleur aileron|developpement de la voiture|more budget|development budget|upgrade the car|car upgrades?|new (rear )?wing|better wing)\b/g, ' budget9 '],
    [/\b(consignes? d equipe|les consignes|ta consigne|cette consigne|une consigne|ordres? d equipe|ordre de l equipe|team orders?|that order|the order)\b/g, ' consigne9 '],
    [/\b(premier pilote|pilote numero un|numero 1 de l ecurie|statut de leader|first driver|number one driver|lead driver|team leader)\b/g, ' statut9 '],
    [/\b(augmentation|plus d argent|meilleur salaire|mieux paye|payer plus|un meilleur contrat|pay rise|raise|more money|better pay|better contract|higher salary)\b/g, ' salaire9 '],
    [/\b(notre duel|le duel|entre nous deux dans l equipe|our duel|our battle|between us in the team)\b/g, ' duel9 '],
    // politesse, accords, refus
    [/\b(s il (te|vous) plait|stp|svp|stplait|plz|pls|please)\b/g, ' poli9 '],
    [/\b(merci beaucoup|merci bcp|mrc|cimer|thx|thanks|thank you|ty|merci+)\b/g, ' merci9 '],
    [/\b(dsl|desolee?s?|pardon|pardonne moi|excuse moi|je m excuse|mes excuses|my bad|sorry|sry|soz|i apologi[sz]e|forgive me|oups)\b/g, ' excuse9 '],
    [/\b(ca marche|ca me va|pas de souci|pas de probleme|avec plaisir|j accepte|bien sur|evidemment|carrement|volontiers|d accord|daccord|dac|ok|okay|oki|ouais|ouai|oui|deal|sure|of course|yes|yep|yeah|alright|agreed|no problem)\b/g, ' accord9 '],
    [/\b(pas question|jamais de la vie|laisse tomber|tu reves|certainement pas|aucune chance|pas moyen|non merci|no way|never|not a chance|forget it|nope|nan|niet|non)\b/g, ' refus9 '],
    [/^\s*no\s*[!.]*\s*$/g, ' refus9 '],
    // saluer, quitter
    [/\b(a plus( tard)?|a\+|a la prochaine|a bientot|au revoir|bye( bye)?|ciao|tchao|see (you|ya)|later|good ?bye|cya)\s*[!.]*\s*$/g, ' adieu9 '],
    [/\b(slt|salut|salu|wesh|wsh|wech|coucou|cc|bonjour|bjr|bonsoir|yo|hey|hello|hi|hiya|sup|wassup|good (morning|evening|afternoon))\b/g, ' salut9 '],
    // insultes et compliments : « t nul », « t es nul », « u r slow » ; « bien joue », « gg »
    [/\b(t|t es|tu es|t etais|tu etais|vous etes) (vraiment |trop |tellement |qu )?(un |une )?(nul|nulle|nuls|bete|con|conne|debile|idiot|idiote|stupide|naze|nase|nulos|nullos|tocard|guignol|clown|minable|pathetique|lent|lente|escargot|danger public|chauffard|boulet|amateur)\b/g, ' insulte9 '],
    [/\b(espece de|sale|gros|grosse) (nul|nulle|con|conne|tocard|chauffard|amateur|idiot|idiote|clown|naze|boulet)\b/g, ' insulte9 '],
    [/\b(ta gueule|ferme la|tg|va te faire \w+|nul a chier|tu conduis comme (un|une) \w+|tu pilotes comme (un|une) \w+|t as eu ton permis ou)\b/g, ' insulte9 '],
    [/\b((you|u) (are|r)|you re|ur|youre) (so |really |such )?(a |an )?(slow|useless|idiot|stupid|clown|loser|noob|joke|amateur|danger|menace|bad|terrible|awful|dumb)\b/g, ' insulte9 '],
    [/\b(you drive like (a|an) \w+|learn to drive|shut up|stfu|noob|loser|scrub)\b/g, ' insulte9 '],
    [/\b(t|t es|tu es|tu n es|vous etes|vous n etes) (vraiment )?pas (tres |si |assez )?(fort|forte|rapide|bon|bonne|doue|douee|terrible|genial|geniale)\b/g, ' insulte9 '],
    [/\b((you|u) (are|r)|you re|ur) not (very |that |so )?(good|fast|quick|great)\b/g, ' insulte9 '],
    [/\b(t|t es|tu es|vous etes) (vraiment |trop |tellement |tres )*(fort|forte|rapide|bon|bonne|genial|geniale|le meilleur|la meilleure|un champion|une championne|impressionnant|impressionnante|propre|regulier|reguliere|balaise|costaud)\b/g, ' bravo9 '],
    [/\b(bien joue|bien pilote|belle course|beau depassement|bravo|chapeau|felicitations|gg|respect|la classe|trop fort)\b/g, ' bravo9 '],
    [/\b((you|u) (are|r)|you re|ur) (so |really )?(fast|good|great|amazing|quick|clean|the best|a legend|impressive)\b/g, ' bravo9 '],
    [/\b(well done|good job|nice (race|drive|move|pass|one)|great (race|drive|move|pass)|congrats|congratulations|good race|gg wp|respect)\b/g, ' bravo9 '],
    // menaces : « je vais te sortir », « fais gaffe », « you'll pay »
    [/\bje (vais|veux|compte) (te |t )?(sortir|percuter|pousser|envoyer dans le mur|detruire|ecraser|exploser|defoncer|faire payer|faire la peau|mettre dans le mur)\b/g, ' menace9 '],
    [/\b(fais gaffe|attention a toi|gare a toi|tu vas voir|tu vas (le )?payer|tu vas le regretter|tu vas prendre cher|la prochaine fois je te|je t aurai|tu perds rien pour attendre)\b/g, ' menace9 '],
    [/\b(watch (out|your back)|you ll (pay|regret)|i ll (get|crash|hit|take out|wreck|destroy) you|i ll (take|knock|run) you (out|off)|next time i ll|you re (going|gonna) (to )?pay|i m coming for you)\b/g, ' menace9 '],
    // l'ironie (« lol », « mdr », « ben voyons ») : on ne prend pas au pied de la lettre
    [/\b(lol|mdr|ptdr|xd|lmao|ben voyons|mais bien sur|c est ca oui|cause toujours|yeah right|sure buddy)\b/g, ' rire9 '],
  ];

  // --- 3. le lexique : un mot (sa racine) → des concepts pondérés. Les jetons d'abord, puis les mots simples des deux langues.
  // CONCEPTS : salutation adieu gratitude politesse excuse accord refus insulte compliment menace paix contact passage rendre
  // bloquer avis etat course duel contrat argent statut question ironie
  const LEXIQUE = {
    salut9: { salutation: 1 }, adieu9: { adieu: 1 }, merci9: { gratitude: 1, politesse: 0.5 }, poli9: { politesse: 0.6 },
    excuse9: { excuse: 1 }, accord9: { accord: 1 }, refus9: { refus: 1 }, insulte9: { insulte: 1 }, bravo9: { compliment: 1, politesse: 0.3 },
    menace9: { menace: 1 }, paix9: { paix: 1 }, contact9: { contact: 1 }, passer9: { passage: 1 }, rendre9: { rendre: 1 },
    bloquer9: { bloquer: 1 }, avis9: { avis: 1, question: 0.3 }, etat9: { etat: 1, question: 0.3 }, statut9: { statut: 1, contrat: 0.5 },
    salaire9: { argent: 1, contrat: 0.6 }, budget9: { budget: 1 }, consigne9: { consigne: 1 }, duel9: { duel: 1 }, rire9: { ironie: 1 }, plainte9: { plainte: 1 },
    // français
    excus: { excuse: 1 }, pardon: { excuse: 1 }, desol: { excuse: 1 },
    paix: { paix: 0.9 }, rancun: { paix: 0.5, contact: 0.3 }, calm: { paix: 0.6 }, reconcili: { paix: 0.9 }, oubli: { paix: 0.5 },
    choc: { contact: 0.9 }, contact: { contact: 1 }, percut: { contact: 1 }, accroch: { contact: 0.9 }, accident: { contact: 0.9 }, touch: { contact: 0.6 },
    pouss: { contact: 0.6 }, sorti: { contact: 0.5 }, crash: { contact: 1 }, mur: { contact: 0.4 }, aileron: { contact: 0.3 },
    passer: { passage: 0.8 }, doubl: { passage: 0.7, course: 0.3 }, depass: { passage: 0.6, course: 0.3 }, place: { passage: 0.3 }, consign: { passage: 0.7, duel: 0.3 },
    bloqu: { bloquer: 0.9 }, retien: { bloquer: 0.7 }, defend: { bloquer: 0.5 }, gen: { bloquer: 0.4 }, aide: { bloquer: 0.4, rendre: 0.3 }, allie: { bloquer: 0.6 }, ensembl: { bloquer: 0.3 },
    promet: { rendre: 0.8 }, promess: { rendre: 0.8 }, rendr: { rendre: 0.7 }, servic: { rendre: 0.6 }, pareill: { rendre: 0.6 },
    avis: { avis: 1, question: 0.3 }, pens: { avis: 0.6 }, confian: { avis: 0.8 }, trust: { avis: 0.8 }, trouv: { avis: 0.3 },
    saison: { etat: 0.5, course: 0.3 }, form: { etat: 0.5 }, moral: { etat: 0.7 }, va: { etat: 0.3 },
    cours: { course: 0.8 }, grand: { course: 0.2 }, prix: { course: 0.3 }, circuit: { course: 0.5 }, tour: { course: 0.3 }, qualif: { course: 0.5, duel: 0.3 }, podium: { course: 0.6, compliment: 0.2 },
    duel: { duel: 1 }, coequipi: { duel: 0.8 }, equip: { duel: 0.4, contrat: 0.3 },
    budget: { budget: 1 }, aileron: { budget: 0.6, contact: 0.2 }, consign: { consigne: 1 },
    contrat: { contrat: 1 }, salair: { argent: 1, contrat: 0.6 }, argent: { argent: 1 }, prim: { argent: 0.8 }, pay: { argent: 0.6 }, euro: { argent: 0.8 }, signer: { contrat: 0.7, accord: 0.3 }, sign: { contrat: 0.6 },
    statut: { statut: 1 }, chef: { statut: 0.6 }, leader: { statut: 0.8 }, numero: { statut: 0.3 },
    salu: { salutation: 1 }, bonjour: { salutation: 1 }, merci: { gratitude: 1 }, bravo: { compliment: 1 }, felicit: { compliment: 1 }, champion: { compliment: 0.6 }, rapid: { compliment: 0.4 },
    nul: { insulte: 0.9 }, idiot: { insulte: 1 }, chauffard: { insulte: 1 }, tocard: { insulte: 1 }, lent: { insulte: 0.5 }, menac: { menace: 0.9 }, venge: { menace: 0.8 }, regrett: { menace: 0.5 },
    contr: {}, contre: {}, against: {},   // (« contre le mur » : pas un contrat)
    pourquoi: { question: 0.7 }, comment: { question: 0.5 }, quoi: { question: 0.4 }, quel: { question: 0.5 },
    // anglais
    peace: { paix: 0.9 }, sorry: { excuse: 1 }, apolog: { excuse: 1 }, crash: { contact: 1 }, hit: { contact: 0.8 }, collision: { contact: 1 }, rammed: { contact: 1 }, bump: { contact: 0.7 },
    pass: { passage: 0.8 }, overtak: { passage: 0.7, course: 0.3 }, let: { passage: 0.3 }, order: { passage: 0.6, duel: 0.3 }, team: { duel: 0.4, contrat: 0.3 }, teammat: { duel: 0.8 },
    block: { bloquer: 0.9 }, hold: { bloquer: 0.5 }, help: { bloquer: 0.4, rendre: 0.3 }, favour: { rendre: 0.7 }, favor: { rendre: 0.7 }, promis: { rendre: 0.8 }, owe: { rendre: 0.8 },
    opinion: { avis: 1 }, think: { avis: 0.6 }, season: { etat: 0.5, course: 0.3 }, feel: { etat: 0.6 }, race: { course: 0.8 }, lap: { course: 0.3 },
    contract: { contrat: 1 }, salary: { argent: 1, contrat: 0.6 }, money: { argent: 1 }, wage: { argent: 0.9, contrat: 0.5 }, raise: { argent: 0.8 }, status: { statut: 1 },
    thanks: { gratitude: 1 }, hello: { salutation: 1 }, congrats: { compliment: 1 }, great: { compliment: 0.6 }, fast: { compliment: 0.4 },
    idiot: { insulte: 1 }, stupid: { insulte: 1 }, slow: { insulte: 0.5 }, useless: { insulte: 1 }, revenge: { menace: 0.9 }, threat: { menace: 0.8 },
    why: { question: 0.7 }, how: { question: 0.5 }, what: { question: 0.4 },
  };
  // les mots-outils : connus (aucun concept), pour que la correspondance de forme ne les « corrige » pas
  for (const m of ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'a', 'au', 'je', 'tu', 'il', 'elle', 'on', 'me', 'te', 'se', 'mon', 'ma', 'ton', 'ta', 'son', 'sa', 'ce', 'en', 'y', 'ou', 'dans', 'pour', 'sur',
    'avec', 'est', 'es', 'suis', 'ai', 'as', 'pas', 'ne', 'que', 'qui', 'the', 'a', 'an', 'to', 'of', 'and', 'you', 'me', 'my', 'your', 'is', 'are', 'it', 'i', 'in', 'on', 'at', 'for', 'be', 'do', 'not', 'that', 'this'])
    if (!(m in LEXIQUE)) LEXIQUE[m] = {};
  const CLES = Object.keys(LEXIQUE);

  // la racine d'un mot : on coupe une finale courante (français et anglais), en gardant au moins 4 lettres
  const FINALES = ['issements', 'issement', 'erions', 'eriez', 'aient', 'ements', 'ement', 'ations', 'ation', 'ances', 'ance', 'ences', 'ence', 'eurs', 'euse', 'ings', 'ing',
    'ais', 'ait', 'ant', 'ons', 'ont', 'ez', 'er', 'ir', 're', 'es', 'ed', 's', 'e'];
  function radical(m) {
    if (/\d$/.test(m) || m.length <= 4) return m;
    for (const f of FINALES) if (m.length - f.length >= 4 && m.endsWith(f)) return m.slice(0, -f.length);
    return m;
  }
  function bigrammes(m) { const s = ' ' + m + ' ', r = []; for (let i = 0; i < s.length - 1; i++) r.push(s.slice(i, i + 2)); return r; }
  // la ressemblance de forme de deux mots (de 0 à 1 : les fautes de frappe, les variantes)
  function ressemblance(a, b) { const A = bigrammes(a), B = new Set(bigrammes(b)); let c = 0; for (const g of A) if (B.has(g)) c++; return 2 * c / (A.length + B.size); }

  // le lexique d'un mot : sa racine connue, sinon un préfixe connu (« percute » → percut), sinon la forme la plus proche
  function conceptsDe(brut) {
    const m = radical(brut);
    if (LEXIQUE[m]) return LEXIQUE[m];
    if (LEXIQUE[brut]) return LEXIQUE[brut];
    for (let n = Math.min(m.length, 9); n >= 4; n--) if (LEXIQUE[m.slice(0, n)] && Object.keys(LEXIQUE[m.slice(0, n)]).length) return LEXIQUE[m.slice(0, n)];
    if (m.length < 4) return null;
    // deux lettres inversées (« excsue », « merrci ») : les mêmes lettres, la même première lettre, sur une racine connue
    const tri = x => x.split('').sort().join('');
    for (const c of CLES) if (c.length >= 5 && !/\d$/.test(c) && c[0] === brut[0] && (tri(brut.slice(0, c.length)) === tri(c) || tri(m) === tri(c))) return LEXIQUE[c];
    let meilleur = null, s = 0;
    for (const c of CLES) {
      if (Math.abs(c.length - m.length) > 3 || /\d$/.test(c)) continue;
      const r = ressemblance(m, c);
      if (r > s) { s = r; meilleur = c; }
    }
    return s > 0.66 ? Object.fromEntries(Object.entries(LEXIQUE[meilleur]).map(([k, x]) => [k, x * s])) : null;
  }
  function vectoriser(mots) {
    const v = {};
    for (const m of mots) { const c = conceptsDe(m); if (c) for (const [k, x] of Object.entries(c)) v[k] = (v[k] || 0) + x; }
    return v;
  }
  function cosinus(a, b) {
    let d = 0, na = 0, nb = 0;
    for (const k in a) { na += a[k] * a[k]; if (b[k]) d += a[k] * b[k]; }
    for (const k in b) nb += b[k] * b[k];
    return na && nb ? d / Math.sqrt(na * nb) : 0;
  }

  // --- 4. les actes de langage (prototypes de concepts). L'ordre départage les égalités.
  const ACTES = {
    INSULTE: { insulte: 1 }, MENACE: { menace: 1 }, EXCUSE: { excuse: 1 }, PAIX: { paix: 1, excuse: 0.2 }, COMPLIMENT: { compliment: 1, politesse: 0.2 },
    CONTACT: { contact: 1, question: 0.2 }, RECLAMATION: { plainte: 1, question: 0.2 }, PASSER: { passage: 1, politesse: 0.2 }, PROMESSE: { rendre: 1 }, BLOQUER: { bloquer: 1 },
    AVIS: { avis: 1, question: 0.3 }, ETAT: { etat: 1, question: 0.3 }, DUEL: { duel: 1 }, SALAIRE: { argent: 1, contrat: 0.5 }, STATUT: { statut: 1, contrat: 0.4 },
BUDGET: { budget: 1 }, CONSIGNE: { consigne: 1, question: 0.2 },
        MERCI: { gratitude: 1 }, SALUT: { salutation: 1 }, ADIEU: { adieu: 1 }, ACCORD: { accord: 1 }, REFUS: { refus: 1 }, QUESTION: { question: 1 },
  };
  // un acte « fort » l'emporte sur la politesse ou le salut qui l'accompagnent (« slt, laisse moi passer stp » est une demande)
  const SECONDAIRES = ['SALUT', 'MERCI', 'QUESTION', 'ACCORD'];
  const SEUIL = 0.3;

  // la phrase mise à plat : minuscules, sans accents, les apostrophes et la ponctuation en espaces (sauf ? et !)
  function aplatir(txt) { return ' ' + sansAccents(txt).replace(/[’'`]/g, ' ').replace(/[^a-z0-9?!+]+/g, ' ').replace(/([?!])/g, ' $1 ').replace(/\s+/g, ' ') + ' '; }
  function reecrire(p) { for (const [ex, rem] of EXPRESSIONS) p = p.replace(ex, rem); return p.replace(/\s+/g, ' '); }

  // comprendre(txt, noms) : noms = [{ k, nom }] (les pilotes qu'on peut nommer). Renvoie { acte, score, actes (les 3 premiers),
  // negation, question, ironie, cible (k du pilote nommé, ou null), montant (un nombre écrit, ou null), jetons }
  function lire(txt, noms) {
    const plat = aplatir(txt), propre = reecrire(plat);
    const mots = propre.trim().split(' ').filter(m => m && m !== '?' && m !== '!');
    const v = vectoriser(mots);
    const scores = Object.entries(ACTES).map(([a, p]) => ({ acte: a, score: cosinus(v, p) })).sort((x, y) => y.score - x.score);
    let choix = scores[0];
    // un acte fort présent dans la phrase passe devant un acte secondaire (le salut, le merci)
    if (SECONDAIRES.includes(choix.acte)) { const fort = scores.find(s => !SECONDAIRES.includes(s.acte) && s.score >= SEUIL); if (fort) choix = fort; }
    const ironie = (v.ironie || 0) > 0 || /😂|🤣|🙄|😏/.test(String(txt));
    const question = /\?/.test(String(txt)) || /^\s*(pourquoi|comment|est ce|why|how|what|can you|could you|will you|would you|peux tu|tu peux|pourrais tu|veux tu)\b/.test(plat);
    // la négation : « pas », « jamais », « don't » — mais « pas de souci », « ne t'inquiète pas » ne nient rien (ils sont déjà des jetons)
    const negation = /\b(pas|jamais|aucun|aucune|rien|plus jamais|dont|don t|won t|not|never)\b/.test(propre.replace(/\b(pas de souci|pas de probleme)\b/g, ''));
    let acte = choix.score >= SEUIL ? choix.acte : (question ? 'QUESTION' : 'INCONNU');
    // « je veux 80000 », « i want 90000 » : un montant seul est une demande de salaire
    const nb0 = plat.match(/\b\d{4,7}\b/);
    if ((acte === 'INCONNU' || acte === 'QUESTION') && nb0) acte = 'SALAIRE';
    // « je ne te laisserai pas passer » refuse ; « je ne m'excuse pas » n'est pas une excuse
    if (negation && ['EXCUSE', 'PAIX', 'COMPLIMENT', 'ACCORD'].includes(acte) && !/\b(pas de souci|pas de probleme)\b/.test(plat)) acte = acte === 'COMPLIMENT' ? 'INSULTE' : 'REFUS';
    if (negation && acte === 'PASSER' && !question && /\b(je|i)\b/.test(plat)) acte = 'REFUS';
    // « laisse-moi passer, je te rendrai la pareille » : une demande, avec sa promesse (le jeton rendre9 reste dans la lecture)
    if (acte === 'PROMESSE' && (v.passage || 0) > 0) acte = 'PASSER';
    // le pilote nommé (« bloque Rossi pour moi ») : son nom, sans accents, en mot entier
    let cible = null;
    for (const n of noms || []) {
      if (!n || !n.nom) continue;
      const nom = sansAccents(n.nom).replace(/[^a-z0-9]+/g, ' ').trim();
      if (nom && (' ' + plat + ' ').includes(' ' + nom + ' ')) { cible = n.k; break; }
      const famille = nom.split(' ').pop();
      if (famille && famille.length >= 4 && plat.includes(' ' + famille + ' ')) { cible = n.k; break; }
    }
    const nb = plat.match(/\b\d{1,7}\b/);
    return { acte, score: Math.round(choix.score * 1000) / 1000, actes: scores.slice(0, 3).map(s => s.acte), negation, question, ironie, cible,
      montant: nb ? Number(nb[0]) : null, jetons: mots };
  }

  // deux idées dans une phrase (« gg mais pk tu m'as bloqué », « sorry for the crash but you blocked me first ») : chaque morceau
  // (coupé aux « mais », « but », virgules, « et » qui ouvre une nouvelle phrase…) est lu à part. L'idée qui compte est la dernière
  // idée forte (après « mais », c'est elle qu'on veut dire) ; « second » est une autre idée forte d'un autre morceau (ou null)
  const COUPURE = /\s(?:mais|but|par contre|cependant|however|sinon|apres|puis|et puis|and also|en plus|btw|au fait)\s|[,;.]|\s(?:et|and)\s(?=(?:t |tu |toi |you |u |je |i |la prochaine |next ))/;
  function comprendre(txt, noms) {
    const tout = lire(txt, noms);
    const morceaux = aplatir(txt).split(COUPURE).map(x => x.trim()).filter(x => x.length > 1);
    tout.second = null;
    if (morceaux.length < 2) return tout;
    const forts = morceaux.map(m => lire(m, noms)).filter(a => !SECONDAIRES.includes(a.acte) && a.acte !== 'INCONNU' && a.score >= SEUIL);
    if (!forts.length) return tout;
    let principal = forts[forts.length - 1].acte;
    if (principal === 'PROMESSE' && forts.some(a => a.acte === 'PASSER')) principal = 'PASSER';   // « laisse-moi passer et je te rendrai la pareille »
    const autre = forts.slice().reverse().find(a => a.acte !== principal && !(principal === 'PASSER' && a.acte === 'PROMESSE'));
    if (!SECONDAIRES.includes(tout.acte) || forts.length > 1) tout.acte = principal;
    tout.second = autre ? autre.acte : null;
    return tout;
  }

  return { comprendre, aplatir, reecrire, radical, ressemblance, ACTES: Object.keys(ACTES) };
})();
