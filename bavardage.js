// Le bavardage avec les pilotes (tour 58, le propriétaire : « les IA de communication : tu n'arrives pas du tout à leur tenir
// conversation » ; CLAUDE.md « Les discussions avec les pilotes et les écuries ») : calcul pur, sans écran. discussion.js répond à ce
// qui touche la course (un contact, une excuse, laisser passer…) ; ici, tout le reste, comme entre deux personnes au paddock :
//  1. chaque pilote a une petite vie à lui (persona), tirée une fois de sa graine : sa famille, un animal, ses passions, ce qu'il
//     aime manger ou écouter, comment il a commencé, son rêve, sa peur, son circuit préféré… (des indices dans les listes bav_l_* de
//     textes.js : la même vie dans les deux langues) ;
//  2. la phrase du joueur est lue par sujets (SUJETS : l'âge, la famille, les passions, un conseil de pilotage, un pronostic…), et l'on
//     sait si elle parle du pilote (« tu as un chien ? ») ou du joueur (« moi j'ai un chat ») ;
//  3. il répond depuis sa vie et la vraie saison (classement, prochain circuit, caractère des autres), pose une question en retour, et
//     comprend la réponse qui suit (« oui », « non », « et toi ? », « pourquoi ? », un prénom, un âge) ;
//  4. il se souvient de ce que le joueur lui a dit (son âge, son animal et son nom, ce qu'il aime) et le ressort plus tard.
// Aucun effet sur la course ni sur la relation : seulement des mots. Son propre hasard (ALEATOIRE.suite) : rien ne dérange une course.
// Jamais genré : ni le joueur, ni le pilote qui parle (on ne connaît pas leur genre).
const BAVARDAGE = (function () {
  const R = REGLAGES;
  const plat = t => (typeof PARLE !== 'undefined' ? PARLE.aplatir(t) : ' ' + String(t).toLowerCase() + ' ');
  const liste = cle => { const v = texte(cle); return Array.isArray(v) ? v : v ? [v] : []; };
  const nomDe = p => p.nom || (p.humain ? texte('nomJoueur') : texte('pilote').replace('{n}', p.numero));
  const nomEcurie = e => e ? (e.nom || texte('ecurie').replace('{n}', e.numero || e.id + 1)) : '';
  const joueur = ch => ch.pilotes.find(p => p.humain);

  // --- 1. la vie du pilote : des indices dans les listes de textes.js, tirés de sa graine (le même pilote a toujours la même vie)
  const LISTES = ['famille', 'animal', 'animalnom', 'hobby', 'sport', 'plat', 'couleur', 'musique', 'film', 'jeu', 'matiere', 'debut',
    'reve', 'peur', 'idole', 'superstition', 'blague', 'secret', 'faire', 'weekend'];
  function persona(ch, p) {
    const a = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_BAVARDAGE + p.id * 7919 + (p.numero || 0) * 31);
    const v = {};
    for (const l of LISTES) { const n = liste('bav_l_' + l).length || 1; v[l] = Math.floor(a() * n); }
    const n = liste('bav_l_hobby').length || 1; v.hobby2 = (v.hobby + 1 + Math.floor(a() * (n - 1))) % n;
    v.debutAge = 5 + Math.floor(a() * 6);
    const cal = R.CALENDRIER_CIRCUITS;
    v.circuitFav = cal[Math.floor(a() * cal.length)];
    v.circuitDur = cal[(cal.indexOf(v.circuitFav) + 1 + Math.floor(a() * (cal.length - 1))) % cal.length];
    return v;
  }
  const de = (cle, i) => { const l = liste('bav_l_' + cle); return l.length ? l[i % l.length] : ''; };

  // --- la mémoire du bavardage, dans celle du pilote (discussion.js) : ce que le joueur a dit de lui, la question en attente, les
  // sujets déjà parlés, les dernières réponses (pour ne pas se répéter). Compacte (elle va dans la sauvegarde).
  function memoire(p) {
    if (!p.memoire || typeof p.memoire !== 'object') p.memoire = {};
    const m = p.memoire;
    if (!m.bav || typeof m.bav !== 'object') m.bav = {};
    const b = m.bav;
    if (!b.j || typeof b.j !== 'object') b.j = {};
    if (!Array.isArray(b.sujets)) b.sujets = [];
    if (!Array.isArray(b.recents)) b.recents = [];
    if (!Array.isArray(b.demandes)) b.demandes = [];
    if (typeof b.n !== 'number') b.n = 0;
    return b;
  }
  const cleGP = ch => ch.saison + '-' + ch.resultats.length;

  // --- 2. les sujets. Chaque entrée : [sujet, motif sur la phrase mise à plat]. L'ordre compte : le plus précis d'abord.
  const SUJETS = [
    ['blague', /\b(blague|une blague|fais moi rire|raconte (moi )?un truc drole|joke|make me laugh|tell me something funny)\b/],
    ['bot', /\b(t es|tu es|es tu|are you|r u|you re|ur) (un |une |a |an )?(robot|bot|ia|ai|machine|ordi|ordinateur|computer|real|reel|vrai|vraie)\b/],
    ['nom', /\b(comment tu t appelles|tu t appelles comment|c est quoi ton (nom|prenom)|ton (vrai )?(nom|prenom)|what s your name|whats your name|your name|ur name)\b/],
    ['age', /\b(quel age|t as quel age|tu as quel age|ton age|how old|your age|ur age|tu as combien d annees)\b/],
    ['amour', /\b(amoureux|amoureuse|copine|copain|petit ami|petite amie|girlfriend|boyfriend|crush|marie|mariee|married|en couple|single|celibataire)\b/],
    ['argent', /\b(salaire|tu gagnes combien|t es riche|tu es riche|vous etes riche|etes vous riche|vous gagnez combien|combien tu gagnes|ton argent|money|salary|how much do you (make|earn)|are you rich|r u rich)\b/],
    ['ami', /\b(on est amis|on est potes|tu veux etre mon ami|tu es mon ami|t es mon pote|amis\s*\?|be friends|are we friends|be my friend|my friend\s*\?|friends\s*\?)\b/],
    ['affection', /\b(je t aime|je t adore|jtm|jtd|j t aime|i love you|i luv you|love you|luv u|love u|i love u|t es mon prefere|you re the best|t es le meilleur)\b/],
    ['veuxpilote', /\b((je|j) veux (etre|devenir|faire) (pilote|comme toi|champion|pilote de course)|je serai pilote|i (want|wanna) (to )?(be|become) (a )?(driver|racer|champion|like you)|i m gonna be a (driver|racer))\b/],
    ['secret', /\b(secret|confidence|personne ne sait|nobody knows)\b/],
    ['famille', /\b(freres?|soeurs?|famille|tes parents|ta mere|ton pere|ta maman|ton papa|brothers?|sisters?|siblings|family|your (mom|mum|dad|parents)|ur (mom|mum|dad|parents))\b/],
    ['animal', /\b(animal|animaux|chiens?|chats?|hamster|lapin|poisson rouge|tortue|perroquet|pets?|dogs?|cats?|rabbit|hamster|goldfish)\b/],
    ['debut', /\b(comment (tu as|t as|as tu) commence|depuis quand tu (cours|pilotes|fais de la course)|ton premier kart|t as commence comment|tu as commence comment|karting|how did (you|u) (start|begin|get into)|first kart|when did (you|u) start)\b/],
    ['reve', /\b(ton reve|tu reves|ton plus grand reve|ton but dans la vie|your dream|ur dream|dream of|your goal|ur goal)\b/],
    ['peur', /\b(peur|stresses?|stresse|angoisse|trac|scared|afraid|fear|nervous|anxious)\b/],
    ['idole', /\b(idole|ton modele|ton heros|ton pilote prefere|idol|hero|role model|favou?rite driver)\b/],
    ['superstition', /\b(superstition|superstitieux|superstitieuse|porte bonheur|grigri|lucky charm|superstitious|ritual|rituel)\b/],
    ['conseil', /\b(conseils?|astuces?|comment (on |tu |je )?(freine|freiner|double|doubler|depasse|depasser|pars|partir|prends? les virages|vais plus vite|aller plus vite|gagne|gagner)|apprends? moi|tu m apprends|tips?|advice|how (do|can|to) (you |i |u )?(brake|overtake|pass|start|go faster|win|drive)|teach me|help me)\b/],
    ['pronostic', /\b(tu (penses|crois|vas) (gagner|que tu vas|finir)|qui va gagner|tu vas gagner|pronostic|la prochaine course|prochain grand prix|next race|who (will|s gonna|is gonna|is going to) win|vous (allez|pensez|croyez) (gagner|que)|vous gagnez|tu gagnes?|will (you|u) win|gonna win|tes chances|your chances)\b/],
    ['champion', /\b(championnat|qui est (premier|devant|en tete)|qui mene|le leader|title|championship|who s (leading|first|ahead)|who is (leading|first|ahead))\b/],
    ['coequipier', /\b(ton coequipier|ta coequipiere|ton equipier|your teammate|ur teammate|your team mate)\b/],
    ['ecurie', /\b(ton ecurie|ton equipe|ta team|ton patron|tes mecanos|tes mecaniciens|tes ingenieurs|your team|ur team|your boss|your engineers|your mechanics)\b/],
    ['voiture', /\b(ta voiture|votre voiture|ta quelle voiture|quelle voiture|une voiture rapide|ta bagnole|ta caisse|ta f1|ton bolide|ta monoplace|your car|ur car|what car|which car)\b/],
    ['pluie', /\b(pluie|pleut|mouille|mouillee|averse|rain|raining|wet)\b/],
    ['circuitfav', /\b(circuit prefere|ton circuit|ta piste|piste preferee|quel circuit|le circuit que tu|favou?rite (track|circuit)|best track|which track|worst track|circuit que tu detestes)\b/],
    ['souvenir', /\b(meilleure course|meilleur souvenir|plus belle course|plus beau souvenir|ta plus belle|best race|best memory|proudest|favou?rite memory)\b/],
    ['pire', /\b(pire (course|souvenir|moment|jour)|plus mauvais souvenir|worst (race|memory|moment|day))\b/],
    ['origine', /\b(tu viens? d ?ou|vous venez d ou|d ou tu viens|tu es d ou|t es d ou|ton pays|ou tu habites|tu habites ou|tu vis ou|where are you from|where r u from|where you from|where (do )?(you|u|r u) (live|from)|where r u from|where do you live|your country|ur country)\b/],
    ['ecole', /\b(l ?ecole|ecole|college|lycee|etudes|devoirs|maitresse|prof|matiere|school|homework|teacher|subject|maths?)\b/],
    ['jeu', /\b(jeux? video|console|manette de jeu|fortnite|minecraft|roblox|video ?games?|gaming|gamer|play games)\b/],
    ['musique', /\b(musique|chansons?|tu ecoutes quoi|chanteur|chanteuse|rap|rock|music|songs?|singer|listen to|playlist)\b/],
    ['film', /\b(films?|series?|netflix|dessins? animes?|cinema|movies?|tv shows?|anime|cartoons?)\b/],
    ['plat', /\b(manger|tu manges?|tu bouffes?|plat prefere|nourriture|bouffe|repas|dessert|pizza|burger|pates|frites|gateau|food|eat|meal|dish|dessert|snack)\b/],
    ['couleur', /\b(couleur|colou?r)\b/],
    ['sport', /\b(sports?|foot|football|basket|tennis|rugby|natation|soccer|swimming|gym|muscu)\b/],
    ['hobby', /\b(hobby|hobbies|passions?|loisirs?|a part la course|en dehors de la course|en dehors des courses|quand tu cours pas|temps libre|tu aimes faire quoi|free time|for fun|outside (of )?racing|besides racing|when you re not racing)\b/],
    ['weekend', /\b(week ?end|vacances|ce soir|demain|holidays?|vacation|tonight|tomorrow)\b/],
    ['faire', /\b(tu fais quoi|tu fais koi|tfq|qu est ce que tu fais|tu fais quoi la|what are you doing|what r u doing|whatcha doing|wyd)\b/],
  ];
  // les petits mots qui suivent une réponse : ils ne veulent rien dire seuls, ils répondent au fil de la conversation
  const PETITS = [
    ['etoi', /\b(et toi|et vous|toi aussi|et de ton cote|and (you|u)|what about (you|u)|wbu|hbu|how about (you|u))\b/],
    ['pourquoi', /^\s*(pk|pq|pkoi|pourquoi|mais pourquoi|pourquoi ca|ah pourquoi|why|why not|how come|pourquoi pas)\s*\??\s*$/],
    ['moinonplus', /\b(moi non plus|moi pas|me neither|me either|neither do i|nor me)\b/],
    ['moiaussi', /\b(moi aussi|moi pareil|pareil|pareil pour moi|me too|same|same here|so do i)\b/],
    ['vraiment', /^\s*(ah bon|ah ouais|vraiment|serieux|serieusement|c est vrai|sans blague|wow|waouh|really|for real|no way|seriously|is that true)\s*[?!]*\s*$/],
    ['rire', /^\s*(lol|mdr|ptdr|xd|jpp|haha|ahah|hihi|hehe|lmao|rofl|trop drole|so funny)( lol| mdr)?\s*[!?]*\s*$/],
    ['oui', /^\s*(moi )?(oui|cool|super|genial|nice|trop bien|great|ouais|ouai|yes|yeah|yep|yup|ok|okay|d accord|bien sur|grave|carrement|exact|exactement|of course|sure|totally|absolutely|si)\b/],
    ['non', /^\s*(moi )?(non|rien|nothing|nan|nope|no|pas du tout|pas trop|pas vraiment|pas tellement|jamais|not really|not much|never|nah)\b/],
  ];
  // qui la phrase vise : le pilote (« tu », « ton », « you ») ou le joueur qui parle de lui (« je », « mon », « I », « my »)
  const VERS_LUI = /\b(tu|t|te|ton|ta|tes|toi|vous|votre|you|your|u|ur|yours)\b/;
  const DE_MOI = /\b(je|j|moi|mon|ma|mes|i|my|me|im|i m)\b/;

  function lire(txt) {
    // l'écriture des enfants : « jai », « jaime », « tadore », « sappel », « ta quel age », « cest »
    const t = plat(txt).replace(/\bj(ai|aime|adore|suis|veux|vais|habite|joue|connais|deteste|prefere)\b/g, 'j $1').replace(/\bt(adore|aime)\b/g, 't $1')
      .replace(/\bsappel+e?s?\b/g, 's appelle').replace(/\bcest\b/g, 'c est').replace(/\bta (quel|un|une|des|peur|quelle)\b/g, 't as $1').replace(/\bjtm\b/g, 'je t aime');
    let sujet = null;
    for (const [s, re] of SUJETS) if (re.test(t)) { sujet = s; break; }
    let petit = null;
    for (const [s, re] of PETITS) if (re.test(t)) { petit = s; break; }
    const question = /\?/.test(t) || /^\s*(est ce que|est ce qu|do|does|did|are|is|can|what|whats|wat|who|whos|how|hows|where|wheres|when|which|quel|quelle|quels|quelles|qui|comment|ou|quand|combien|pourquoi|c est quoi|tu)\b/.test(t);
    const versLui = VERS_LUI.test(t), deMoi = DE_MOI.test(t);
    // ce que le joueur dit de lui : son âge, le nom de son animal, ce qu'il aime
    const age = (t.match(/\b(?:j ai|j a|moi|i m|im|i am|i ve got)\s+(\d{1,2})\s*(?:ans|an|years?|yo)?\b/) || t.match(/\b(\d{1,2})\s*(?:ans|years old|yo)\b/) || [])[1];
    const animalNom = (t.match(/\b(?:mon|ma) (?:chien|chat|chienne|chatte|lapin|hamster|poisson|tortue|perroquet) (?:s appelle|c est|il s appelle|elle s appelle) (\w+)/) || t.match(/\bmy (?:dog|cat|rabbit|hamster|fish|turtle|parrot)(?: s name)? (?:is|s) (?:called |named )?(\w+)/) || [])[1];
    const animal = (t.match(/\b(?:j ai|moi j ai|i have|i ve got|i got|mon|ma|my) (?:un |une |a |an )?(chien|chat|chienne|chatte|lapin|hamster|poisson|tortue|perroquet|dog|cat|rabbit|hamster|fish|turtle|parrot)\b/) || [])[1];
    const adieu = !/\?/.test(t) && /^\s*(a demain|see (you|ya) (tomorrow|tmrw)|cya (tmrw|tomorrow)|a bientot|a tout a l heure|a la prochaine)\s*$/.test(t);
    return { adieu, t, sujet, petit, question, versLui, deMoi, age: age ? +age : null, animalNom: animalNom || null, animal: animal || null };
  }

  // la chose que le joueur aime ou nomme, prise dans SA phrase (pour la lui redire) : 3 mots au plus, jamais une insulte
  function chose(txt) {
    let s = String(txt).trim().replace(/[?!.…]+$/g, '').trim();
    s = s.replace(/^(moi,?\s*|bah\s*|ben\s*|euh\s*|hmm\s*|alors\s*)/i, '')
      .replace(/^(j[’']?aime (bien |beaucoup |trop )?|j[’']?adore |je préfère |je prefere |mon (préféré|prefere) c[’']?est |ma (préférée|preferee) c[’']?est |c[’']?est |je dirais |je fais (du |de la |de l[’']|des )?|i (like|love|prefer) |i play |i do |probably |maybe |my favou?rite is |mine is |mine[’']?s |it[’']?s )/i, '')
      .trim();
    if (/\?/.test(txt) || VERS_LUI.test(plat(s)) || /^(est ce|do|does|did|are|is|can|what|who|how|where|quel|quelle|qui|comment|ou|quand|combien|pourquoi)\b/.test(plat(s).trim())) return null;
    if (!s || s.length > 28 || s.split(/\s+/).length > 3 || /\d{3,}/.test(s)) return null;
    if (typeof PARLE !== 'undefined' && ['INSULTE', 'MENACE'].includes(PARLE.comprendre(s, []).acte)) return null;
    return s;
  }

  // --- 3. répondre. repondre(ch, k, txt, analyse) : la réponse { texte, sujet } si c'est du bavardage, sinon null (discussion.js
  // répond alors à la course comme avant).
  const COURSE = ['CONTACT', 'RECLAMATION', 'PASSER', 'PROMESSE', 'BLOQUER', 'MENACE', 'INSULTE', 'EXCUSE', 'PAIX', 'DUEL', 'MERCI', 'COMPLIMENT', 'ADIEU', 'CONTRAT'];
  // ceux-là cèdent à une vraie question de tous les jours (« qui est premier au championnat ? » n'est pas un compliment)
  const COURSE_DOUX = ['MERCI', 'COMPLIMENT', 'ADIEU', 'DUEL', 'PROMESSE', 'PASSER'];   // (« favourite food? » lit « favour », « tips to overtake? » lit « passer »)
  const ATTENTES = ['age', 'animal', 'animalnom', 'hobby', 'sport', 'plat', 'musique', 'film', 'jeu', 'ecole', 'circuitfav', 'reve', 'couleur', 'pronostic', 'origine'];
  // les sujets où il pose une question en retour (bav_q_<sujet>), et l'attente qu'elle crée
  const RETOUR = { age: 'age', animal: 'animal', hobby: 'hobby', sport: 'sport', plat: 'plat', musique: 'musique', film: 'film', jeu: 'jeu', ecole: 'ecole',
    circuitfav: 'circuitfav', reve: 'reve', couleur: 'couleur', famille: 'hobby', debut: 'reve', origine: 'origine', faire: 'hobby', weekend: 'hobby', pronostic: 'pronostic' };
  // les sujets personnels : un pilote qui t'en veut n'a pas envie d'en parler
  const PERSO = ['age', 'famille', 'animal', 'hobby', 'sport', 'plat', 'couleur', 'musique', 'film', 'jeu', 'ecole', 'origine', 'debut', 'reve', 'peur', 'idole', 'superstition', 'secret', 'weekend', 'faire'];

  const FLOU = ['INCONNU', 'QUESTION'];
  function repondre(ch, k, txt, analyse) {
    if (!R.BAVARDAGE_ACTIF) return null;
    const p = ch.pilotes[k];
    if (!p || p.humain) return null;
    const b = memoire(p), l = lire(txt), a = analyse || { acte: 'INCONNU' };
    if (b.gp !== cleGP(ch)) { b.gp = cleGP(ch); b.ici = 0; b.attente = null; }   // (une question d'un autre Grand Prix ne reste pas en attente)
    if (l.adieu) l.sujet = null;   // « à demain » dit au revoir (et ne parle pas du week-end)
    const fort = COURSE.includes(a.acte) && (a.score === undefined || a.score >= 0.5) && !(l.sujet && l.question && COURSE_DOUX.includes(a.acte));
    // un autre pilote nommé avec « tu penses quoi de… » : son avis sur lui (d'après le vrai caractère de l'autre)
    if (a.cible !== undefined && a.cible !== null && a.cible !== k && ch.pilotes[a.cible] && /\b(pense|penses|avis|think|opinion|aimes|like|connais|know|parle moi de|tell me about)\b/.test(l.t)) l.sujet = 'avispilote';
    // ce qui revient au bavardage : un sujet de la vie (sauf si la phrase dit d'abord quelque chose de la course), une réponse à sa
    // question en attente, un petit mot juste après du bavardage, ce que le joueur dit de lui
    let quoi = null;
    if (b.attente && l.sujet && !l.question && !l.versLui && !l.deMoi && !fort) quoi = 'attente';   // « oui un chien », « le basket » : la réponse à sa question, pas une nouvelle question
    else if (l.sujet && !fort) quoi = 'sujet';
    else if (b.attente && !fort && (l.petit || l.age !== null || l.animalNom || l.animal || ['INCONNU', 'QUESTION', 'ACCORD', 'REFUS', 'AVIS', 'ETAT'].includes(a.acte))) quoi = 'attente';
    else if (l.petit && b.dernier && !fort && ['etoi', 'pourquoi', 'moiaussi', 'moinonplus', 'vraiment', 'rire', 'oui', 'non'].includes(l.petit)) quoi = 'petit';
    else if ((l.age !== null || l.animalNom || l.animal) && !fort) quoi = 'confie';
    // une vraie phrase qu'il ne sait pas ranger (« vous connaissez Max ? ») : il l'avoue en riant et relance, sans « je ne comprends pas »
    else if (!b.attente && b.dernier && ATTENTES.includes(b.dernierSujet) && !l.question && !l.versLui && a.acte === 'INCONNU' && chose(txt)) { b.attente = b.dernierSujet; quoi = 'attente'; }   // « le bleu » après une couleur
    if (l.adieu && !fort) quoi = 'adieu';
    if (!quoi && !fort && FLOU.includes(a.acte) && (l.question || l.versLui || l.deMoi) && l.t.trim().split(/\s+/).length >= 2) quoi = 'flou';
    if (!quoi) { b.dernier = false; return null; }
    b.n++; b.ici = (b.ici || 0) + 1;
    const alea = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_BAVARDAGE + 5003 + k * 131 + b.n * 17 + ch.resultats.length * 1009);
    const ctx = contexte(ch, k, p, b);
    ctx._t = l.t;
    const dire = makeDire(ctx, b, alea);
    if (b.ici > R.BAVARDAGE_PAR_GP) { b.attente = null; b.dernier = true; return fin({ texte: dire('bav_fin'), sujet: 'fin' }, b); }
    if (quoi === 'adieu') { b.attente = null; b.dernier = false; return fin({ texte: dire('bav_fin'), sujet: 'fin' }, b); }
    const morceaux = [];
    let sujet = null;
    const attente = b.attente; b.attente = null;
    // ce que le joueur confie de lui, d'abord (on le garde)
    if (l.age !== null && l.age >= 4 && l.age <= 99) { b.j.age = l.age; ctx.x = l.age; morceaux.push(dire(l.age < 13 ? 'bav_j_age_jeune' : l.age < 18 ? 'bav_j_age_ado' : 'bav_j_age_grand')); sujet = 'age'; }
    if (l.animalNom) { b.j.animalNom = l.animalNom.charAt(0).toUpperCase() + l.animalNom.slice(1); ctx.x = b.j.animalNom; morceaux.push(dire('bav_j_animalnom')); sujet = 'animal'; }
    else if (l.animal && l.deMoi && !l.versLui) { b.j.animal = 1; morceaux.push(dire('bav_j_animal')); b.attente = 'animalnom'; sujet = 'animal'; }
    if (quoi === 'attente' && !morceaux.length) {
      const r = suiteAttente(attente, l, txt, ctx, b, dire, alea, a);
      if (r) { morceaux.push(r.texte); sujet = r.sujet; }
    }
    if (quoi === 'petit' || (quoi === 'attente' && !morceaux.length && l.petit)) {
      const r = petitMot(l.petit, ctx, b, dire, alea);
      if (r) { morceaux.push(r.texte); sujet = r.sujet; }
    }
    // « j'ai 11 ans, et toi ? » : il confie son âge à son tour
    if (l.petit === 'etoi' && !l.sujet && l.age !== null && sujet === 'age') morceaux.push(sujetLui('age', ctx, b, dire, alea, a));
    if (l.sujet && l.sujet !== sujet && (quoi === 'sujet' || (quoi !== 'petit' && !morceaux.length) || (l.petit === 'etoi'))) {
      // le joueur parle de lui sur ce sujet (« moi j'adore le foot ») ou demande au pilote (« tu fais du sport ? »)
      const deLui = l.deMoi && !l.versLui && !l.question;
      if (deLui && liste('bav_j_' + l.sujet).length) {
        const c = chose(txt);
        ctx.x = c || '';
        b.j[l.sujet] = c || b.j[l.sujet] || 1;
        morceaux.push(dire(c && liste('bav_j_' + l.sujet + '_x').length ? 'bav_j_' + l.sujet + '_x' : 'bav_j_' + l.sujet));
        if (alea() < 0.6 && liste('bav_' + l.sujet).length) morceaux.push(dire('bav_moi_aussi_dire') + ' ' + minuscule(dire('bav_' + l.sujet)));
      } else if (!morceaux.length || l.petit === 'etoi') {
        morceaux.push(sujetLui(l.sujet, ctx, b, dire, alea, a));
      }
      sujet = l.sujet;
    }
    if (!morceaux.length && !fort && FLOU.includes(a.acte) && (l.question || l.versLui || l.deMoi) && l.t.trim().split(/\s+/).length >= 2) quoi = 'flou';
    if (quoi === 'flou') { morceaux.push(dire('bav_flou')); const r = relance(ctx, b, dire, alea); if (r) morceaux.push(r); sujet = null; }
    if (!morceaux.length) { b.dernier = false; return null; }
    // une question en retour (seulement s'il n'en attend pas déjà une, pas deux fois la même, et jamais s'il t'en veut)
    if (!b.attente && sujet && RETOUR[sujet] && ctx.humeur !== 'froid' && !b.demandes.includes(RETOUR[sujet]) && !b.j[RETOUR[sujet]] && alea() < R.BAVARDAGE_RETOUR) {
      const q = liste('bav_q_' + RETOUR[sujet]);
      if (q.length) { morceaux.push(dire('bav_q_' + RETOUR[sujet])); b.attente = RETOUR[sujet]; b.demandes = b.demandes.concat([RETOUR[sujet]]).slice(-12); }
    } else if (!b.attente && ctx.humeur !== 'froid' && b.ici >= 3 && alea() < R.BAVARDAGE_RELANCE) {
      const r = relance(ctx, b, dire, alea); if (r) morceaux.push(r);
    }
    b.dernier = true; b.dernierSujet = sujet || b.dernierSujet;
    if (sujet) b.sujets = b.sujets.filter(x => x !== sujet).concat([sujet]).slice(-10);
    return fin({ texte: morceaux.filter(Boolean).join(' '), sujet: sujet || 'petit' }, b);
  }
  function fin(r, b) { b.recents = b.recents.concat([r.texte.slice(0, 24)]).slice(-R.BAVARDAGE_MEMOIRE); return r; }
  // (« I » reste en capitale en anglais)
  const minuscule = s => s && !/^I\b|^I[’']/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;

  // le contexte de la réponse : sa vie, la saison, son humeur envers le joueur
  function contexte(ch, k, p, b) {
    const v = persona(ch, p), j = joueur(ch), cl = CHAMPIONNAT.classementPilotes(ch);
    const place = cl.findIndex(x => x.k === k) + 1, placeJ = cl.findIndex(x => x.k === j.id) + 1, leader = cl[0] ? ch.pilotes[cl[0].k] : null;
    const prochain = ch.calendrier[ch.resultats.length] || ch.calendrier[ch.calendrier.length - 1];
    const co = ch.pilotes.find(x => x.id !== k && x.ecurie === p.ecurie);
    const rel = p.memoire && typeof p.memoire.relation === 'number' ? p.memoire.relation : 0;
    const humeur = rel <= -R.DISCUSSION_ENNEMI ? 'froid' : rel >= R.DISCUSSION_AMI ? 'ami' : 'neutre';
    const der = ch.resultats[ch.resultats.length - 1], placeDer = der && Array.isArray(der.ordre) ? der.ordre.indexOf(k) + 1 : 0;
    const cir = c => c ? (texte('circuit_' + c) || c) : '';
    const s = p.stats || {};
    const nEcuries = ch.ecuries.length, rangE = CHAMPIONNAT.classementEcuries ? CHAMPIONNAT.classementEcuries(ch).findIndex(x => x.id === p.ecurie) + 1 : 0;
    return { ch, k, p, v, b, place, placeJ, n: cl.length, leader, leaderK: cl[0] ? cl[0].k : -1, humeur, placeDer, s, rangE, nEcuries,
      co, jid: j.id, anonyme: !j.nom,
      vals: { nom: j.nom || '', lui: nomDe(p), age: p.age || 25, pays: p.pays ? texte('pays_' + p.pays) || '' : '', famille: de('famille', v.famille),
        animal: de('animal', v.animal), animal_nom: de('animalnom', v.animalnom), hobby1: de('hobby', v.hobby), hobby2: de('hobby', v.hobby2),
        sport: de('sport', v.sport), plat: de('plat', v.plat), couleur: de('couleur', v.couleur), musique: de('musique', v.musique),
        film: de('film', v.film), jeu: de('jeu', v.jeu), matiere: de('matiere', v.matiere), debut: de('debut', v.debut), debut_age: v.debutAge,
        reve: de('reve', v.reve), peur: de('peur', v.peur), idole: de('idole', v.idole), superstition: de('superstition', v.superstition),
        blague: de('blague', v.blague), secret: de('secret', v.secret), faire: de('faire', v.faire), weekend: de('weekend', v.weekend),
        circuit_fav: cir(v.circuitFav), circuit_dur: cir(v.circuitDur), prochain: cir(prochain && prochain.circuit), place,
        place_joueur: placeJ, leader: leader ? (leader.humain ? texte('bav_toi') : nomDe(leader)) : '', points: s.points || 0, victoires: s.victoires || 0,
        podiums: s.podiums || 0, ecurie: nomEcurie(ch.ecuries[p.ecurie]), coequipier: co ? nomDe(co) : '', saison: ch.saison,
        j_age: b.j.age || '', j_animal: b.j.animalNom || '', x: '' } };
  }
  // dire(cle) : une variante pas dite récemment, ses trous remplis
  function makeDire(ctx, b, alea) {
    return function dire(cle, extra) {
      const ton = ctx.humeur === 'froid' ? '_froid' : (ctx.p.caractere && ctx.p.caractere.agressivite >= R.DISCUSSION_FOUGUEUX) ? '_vif' : '';
      let v = liste(cle);
      if (ton && liste(cle + ton).length) v = v.concat(liste(cle + ton), liste(cle + ton));
      if (!v.length) return '';
      const vals = Object.assign({}, ctx.vals, { x: ctx.x !== undefined ? ctx.x : '' }, extra || {});
      const remplir = t => {
        let r = t;
        if (ctx.anonyme) r = r.replace(/,\s*\{nom\}/g, '').replace(/\s+\{nom\}/g, '').replace(/\{nom\},\s*/g, '').replace(/\{nom\}/g, '');
        r = r.replace(/\{(\w+)\}/g, (m, c) => vals[c] !== undefined ? vals[c] : m);
        return r.charAt(0).toUpperCase() + r.slice(1);
      };
      const i0 = Math.floor(alea() * v.length);
      for (let n = 0; n < v.length; n++) { const t = remplir(v[(i0 + n) % v.length]); if (!b.recents.includes(t.slice(0, 24))) return t; }
      return remplir(v[i0]);
    };
  }

  // ce qu'il dit de lui sur un sujet
  function sujetLui(s, ctx, b, dire, alea, a) {
    const { p, v } = ctx;
    if (ctx.humeur === 'froid' && PERSO.includes(s) && alea() < 0.6) return dire('bav_froid');
    switch (s) {
      case 'pronostic': {
        if (a && a.cible !== undefined && a.cible !== null && ctx.ch.pilotes[a.cible] && a.cible !== ctx.k) return avisPilote(ctx, a.cible, dire);
        const cle = ctx.place && ctx.place <= 3 ? 'bav_pronostic_haut' : ctx.place && ctx.place <= ctx.n / 2 ? 'bav_pronostic_milieu' : 'bav_pronostic_bas';
        return dire(cle) + (ctx.vals.prochain === ctx.vals.circuit_fav ? ' ' + dire('bav_pronostic_fav') : ctx.vals.prochain === ctx.vals.circuit_dur ? ' ' + dire('bav_pronostic_dur') : '');
      }
      case 'champion': return dire(ctx.leaderK === ctx.k ? 'bav_champion_moi' : ctx.leaderK === ctx.jid ? 'bav_champion_toi' : 'bav_champion_autre');
      case 'ecurie': return dire(ctx.rangE && ctx.rangE <= ctx.nEcuries / 3 ? 'bav_ecurie_forte' : ctx.rangE && ctx.rangE > 2 * ctx.nEcuries / 3 ? 'bav_ecurie_faible' : 'bav_ecurie_moyenne');
      case 'voiture': return dire(ctx.rangE && ctx.rangE <= ctx.nEcuries / 3 ? 'bav_voiture_forte' : ctx.rangE && ctx.rangE > 2 * ctx.nEcuries / 3 ? 'bav_voiture_faible' : 'bav_voiture_moyenne');
      case 'coequipier': return ctx.co ? (ctx.co.humain ? dire('bav_coequipier_toi') : dire('bav_coequipier')) : dire('bav_coequipier');
      case 'souvenir': return dire(ctx.s.victoires ? 'bav_souvenir_victoire' : ctx.s.podiums ? 'bav_souvenir_podium' : 'bav_souvenir');
      case 'conseil': return conseil(ctx, dire, a);
      case 'avispilote': return a && a.cible !== undefined && a.cible !== null ? avisPilote(ctx, a.cible, dire) : dire('bav_vague');
      case 'circuitfav': return dire('bav_circuitfav');
      default: {
        const cle = 'bav_' + s;
        if (s === 'age' && ctx.b.j.age) return dire('bav_age') + ' ' + dire(ctx.b.j.age < p.age ? 'bav_age_plus' : 'bav_age_moins');
        return liste(cle).length ? dire(cle) : dire('bav_vague');
      }
    }
  }
  // l'avis sur un autre pilote : d'après son vrai caractère, sa place, et s'il est dans la même écurie
  function avisPilote(ctx, k2, dire) {
    const q = ctx.ch.pilotes[k2];
    if (q.humain) return dire('bav_avis_toi');
    const c = q.caractere || {}, x = { autre: nomDe(q) };
    const memeEcurie = q.ecurie === ctx.p.ecurie;
    const trait = (c.erreurs || 0) > 0.6 ? 'bav_avis_fautes' : (c.agressivite || 0) > 0.6 ? 'bav_avis_dur' : (c.regularite || 0) > 0.6 ? 'bav_avis_regulier' : 'bav_avis_rapide';
    return dire('bav_avis_intro', x) + ' ' + dire(trait, x) + (memeEcurie ? ' ' + dire('bav_avis_meme_ecurie', x) : '');
  }
  // un conseil de pilotage, selon ce qui est demandé (le départ, le freinage, doubler, la pluie, les stands, la trajectoire)
  function conseil(ctx, dire) {
    const t = ' ' + (ctx._t || '') + ' ';
    const quoi = /depart|feux|start|launch/.test(t) ? 'depart' : /frein|brak/.test(t) ? 'freinage' : /doubl|depass|overtak|pass\b/.test(t) ? 'doubler'
      : /pluie|mouill|rain|wet/.test(t) ? 'pluie' : /stand|pit|pneu|tyre|tire/.test(t) ? 'stands' : /virage|corner|trajectoire|line/.test(t) ? 'virage' : 'general';
    return dire('bav_conseil_' + quoi);
  }
  // la suite d'une question qu'il a posée
  function suiteAttente(att, l, txt, ctx, b, dire, alea) {
    if (!att) return null;
    // « pourquoi ? », « ah bon ? », « lol » ne répondent pas à la question : elle reste en attente
    if (['pourquoi', 'vraiment', 'rire'].includes(l.petit)) { b.attente = att; return null; }
    const oui = l.petit === 'oui' || l.petit === 'moiaussi', non = l.petit === 'non' || l.petit === 'moinonplus';
    if (l.petit === 'etoi') return { texte: sujetLui(att === 'animalnom' ? 'animal' : att, ctx, b, dire, alea), sujet: att };
    if (att === 'animal') {
      if (oui) { b.j.animal = 1; b.attente = 'animalnom'; return { texte: dire('bav_j_animal'), sujet: 'animal' }; }
      if (non) { b.j.animal = -1; return { texte: dire('bav_j_animal_non'), sujet: 'animal' }; }
    }
    if (att === 'age' && non) return { texte: dire('bav_j_secret'), sujet: 'age' };
    if (att === 'animalnom') {
      const c = chose(txt);
      if (c && !oui && !non) { b.j.animalNom = c.charAt(0).toUpperCase() + c.slice(1); ctx.x = b.j.animalNom; ctx.vals.j_animal = b.j.animalNom; return { texte: dire('bav_j_animalnom'), sujet: 'animal' }; }
      return null;
    }
    if (att === 'pronostic') {
      const ch = ctx.ch, n = typeof PARLE !== 'undefined' ? PARLE.comprendre(txt, ch.pilotes.filter(x => !x.humain).map(x => ({ k: x.id, nom: nomDe(x) }))) : null;
      if (n && n.cible !== null && n.cible !== undefined) { ctx.x = nomDe(ch.pilotes[n.cible]); return { texte: dire(n.cible === ctx.k ? 'bav_j_pronostic_moi' : 'bav_j_pronostic'), sujet: 'pronostic' }; }
      if (/\b(moi|me|myself|i will|i ll)\b/.test(l.t)) return { texte: dire('bav_j_pronostic_toi'), sujet: 'pronostic' };
      if (/\b(toi|you|u)\b/.test(l.t)) return { texte: dire('bav_j_pronostic_moi'), sujet: 'pronostic' };
    }
    if (oui && liste('bav_j_' + att + '_oui').length) return { texte: dire('bav_j_' + att + '_oui'), sujet: att };
    if (non && liste('bav_j_' + att + '_non').length) { b.j[att] = -1; return { texte: dire('bav_j_' + att + '_non'), sujet: att }; }
    if (oui || non) return { texte: dire(oui ? 'bav_ok' : 'bav_j_non'), sujet: att };
    // une réponse ouverte (« le foot », « des pâtes », « du rap ») : il la reprend
    const c = chose(txt);
    if (c) {
      ctx.x = c; b.j[att] = c;
      const pareil = plat(c).trim() === plat(ctx.vals[{ hobby: 'hobby1', circuitfav: 'circuit_fav' }[att] || att] || '').trim();
      return { texte: dire(pareil ? 'bav_j_pareil' : liste('bav_j_' + att + '_x').length ? 'bav_j_' + att + '_x' : 'bav_j_x'), sujet: att };
    }
    return null;
  }
  // les petits mots (« et toi ? », « pourquoi ? », « ah bon ? », « lol »…), selon le dernier sujet
  function petitMot(pm, ctx, b, dire, alea) {
    const s = b.dernierSujet;
    switch (pm) {
      case 'etoi': return s ? { texte: sujetLui(s, ctx, b, dire, alea), sujet: s } : { texte: dire('bav_etoi_vague'), sujet: null };
      case 'pourquoi': return { texte: s && liste('bav_pq_' + s).length ? dire('bav_pq_' + s) : dire('bav_pq'), sujet: s };
      case 'vraiment': return { texte: dire('bav_vraiment'), sujet: s };
      case 'rire': return { texte: dire('bav_rire'), sujet: s };
      case 'moiaussi': if (s) b.j[s] = b.j[s] || 1; return { texte: dire('bav_moiaussi'), sujet: s };
      case 'moinonplus': return { texte: dire('bav_moinonplus'), sujet: s };
      case 'oui': return { texte: dire('bav_ok'), sujet: s };
      case 'non': return { texte: dire('bav_j_non'), sujet: s };
    }
    return null;
  }
  // relancer la conversation : une question sur un sujet pas encore parlé, ou un souvenir de ce que le joueur a dit
  function relance(ctx, b, dire, alea) {
    if (b.j.animalNom && b.rappel !== cleGP(ctx.ch) && alea() < 0.35) { b.rappel = cleGP(ctx.ch); return dire('bav_rappel_animal'); }
    // un goût que le joueur a dit (« le foot », « le bleu ») : il le ressort, une fois chacun
    const gouts = Object.keys(b.j).filter(g => typeof b.j[g] === 'string' && g !== 'animalNom' && !(b.rappeles || []).includes(g));
    if (gouts.length && alea() < 0.5) { const g = gouts[0]; b.rappeles = (b.rappeles || []).concat([g]).slice(-12); ctx.x = b.j[g]; return dire('bav_rappel_gout'); }
    const libres = Object.keys(RETOUR).map(s => RETOUR[s]).filter((s, i, t) => t.indexOf(s) === i && !b.demandes.includes(s) && !b.j[s] && liste('bav_q_' + s).length);
    if (!libres.length) return '';
    const s = libres[Math.floor(alea() * libres.length)];
    b.attente = s; b.demandes = b.demandes.concat([s]).slice(-12);
    return dire('bav_relance') + ' ' + dire('bav_q_' + s);
  }
  // une phrase à ajouter quand discussion.js ne comprend pas : il propose un sujet (et attend la réponse)
  function relanceIncompris(ch, k) {
    if (!R.BAVARDAGE_ACTIF) return '';
    const p = ch.pilotes[k]; if (!p || p.humain) return '';
    const b = memoire(p);
    if (b.attente) return '';
    const ctx = contexte(ch, k, p, b);
    if (ctx.humeur === 'froid') return '';
    const alea = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_BAVARDAGE + 9001 + k * 131 + b.n * 17);
    b.n++;
    return relance(ctx, b, makeDire(ctx, b, alea), alea);
  }
  // une phrase de rappel au salut (« Et Rex, il va bien ? ») quand le joueur lui a parlé de son animal, une fois par Grand Prix
  function rappelSalut(ch, k) {
    if (!R.BAVARDAGE_ACTIF) return '';
    const p = ch.pilotes[k]; if (!p || p.humain) return '';
    const b = memoire(p);
    if (!b.j.animalNom || b.rappel === cleGP(ch)) return '';
    b.rappel = cleGP(ch);
    const ctx = contexte(ch, k, p, b);
    if (ctx.humeur === 'froid') return '';
    const alea = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_BAVARDAGE + 7001 + k * 131 + b.n * 17);
    return makeDire(ctx, b, alea)('bav_rappel_animal');
  }
  return { persona, lire, chose, repondre, relanceIncompris, rappelSalut, SUJETS: SUJETS.map(s => s[0]) };
})();
