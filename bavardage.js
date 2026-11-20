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
    v.vacances = Math.floor(a() * (liste('bav_l_vacances').length || 1));
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
    ['animal', /\b(animal|animaux|chiens?|chats?|hamster|lapin|poissons?|tortue|tortoises?|turtles?|parrots?|perroquet|pets?|dogs?|cats?|rabbit|hamster|goldfish)\b/],
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
    ['musique', /\b(musique|chansons?|tu ecoutes quoi|chanteur|chanteuse|rap|rock|jazz|reggae|electro|pop|metal|music|songs?|singer|listen to|playlist)\b/],
    ['film', /\b(films?|series?|netflix|dessins? animes?|cinema|movies?|tv shows?|anime|cartoons?|comedies|comedie|comedy|documentaires?|documentaries|superhero|super heros|pirates?|horreur|horror)\b/],
    ['plat', /\b(manger|tu manges?|tu bouffes?|plat prefere|nourriture|bouffe|repas|dessert|pizza|burgers?|pates|frites|gateau|tacos?|sushis?|lasagnes?|couscous|raclette|crepes?|spaghetti|pancakes|chips|food|eat|meal|dish|dessert|snack)\b/],
    ['couleur', /\b(couleur|colou?r)\b/],
    ['sport', /\b(sports?|foot|football|basket|basketball|tennis|rugby|natation|soccer|swimming|gym|muscu|escalade|ski|skate|boxe|boxing|climbing|skiing|skateboard|skateboarding)\b/],
    ['hobby', /\b(guitare|echecs|chess|peche|fishing|cuisine|cooking|dessin|drawing|velo|cycling|surf|surfing|photographie|photography|puzzles?|jardinage|gardening|batterie|drums|maquettes?|model planes|hobby|hobbies|passions?|loisirs?|a part la course|en dehors de la course|en dehors des courses|quand tu cours pas|temps libre|tu aimes faire quoi|free time|for fun|outside (of )?racing|besides racing|when you re not racing)\b/],
    ['vacances', /\b(vacances|holidays?|vacation|on holiday|en vacances)\b/],
    ['weekend', /\b(week ?end|ce soir|demain|tonight|tomorrow)\b/],
    ['faire', /\b(tu fais quoi|tu fais koi|tfq|qu est ce que tu fais|tu fais quoi la|what are you doing|what r u doing|whatcha doing|wyd)\b/],
  ];
  // (tour 60, BAVARDAGE_THEMES) les thèmes de tous les jours d'un enfant, en français et en anglais, langage SMS et fautes compris :
  // [thème, motif sur la phrase mise à plat, sensible]. Un thème sensible (tristesse, harcèlement, deuil…) ne fait jamais de pont vers
  // la course. L'ordre compte : le plus précis d'abord (« chocolat chaud » est une boisson, « bonbons ou… » Halloween).
  const THEMES = [
    ['harcelement', /\b(harcel\w*|on se moque de moi|(ils|elles|on) se moquen?t? de moi|se moquent de moi|on m embete|(ils|elles) m embetent|on me tape|me tapent|me frappen?t?|on me frappe|bully\w*|bulli\w*|picked on|pick on me|make fun of me|making fun of me|laugh(ing)? at me)\b/, 1],
    ['deuil', /\b(est mort|est morte|sont morts|decede\w*|enterrement|died|passed away|funeral|is dead)\b/, 1],
    ['triste', /\b(triste\w*|trist|tristesse|je pleure|j ai pleure|pleurer|pleure|chagrin|pas le moral|deprim\w*|malheureu\w*|sad|crying|cried|i cry|unhappy|feel bad|feeling down|feel down|upset)\b/, 1],
    ['seul', /\b(pas d amis?|pas de copains?|pas de copines?|personne (ne )?(veut )?jou\w* avec moi|tout seul|toute seule|je suis seule?|lonely|no friends|nobody (wants to )?plays? with me|all alone|i m alone)\b/, 1],
    ['malade', /\b(malade\w*|rhume|grippe|fievre|mal a la tete|mal au ventre|mal a la gorge|vomi\w*|toux|tousse|i m sick|i am sick|got sick|feel sick|flu|fever|headache|stomach ?ache|tummy ?ache|sore throat|a cold|covid)\b/, 1],
    ['blessure', /\b(je suis tombe\w*|suis tombe\w*|je me suis fait mal|bobo|blesse\w*|blessure|platre|bras casse|jambe cassee|casse le bras|casse la jambe|pansements?|hurt myself|i fell|fell off|broke my (arm|leg|wrist)|a cast|injur\w*|bruise)\b/, 1],
    ['halloween', /\b(halloween|hallowen|deguis\w*|citrouilles?|bonbons ou|costumes?|trick or treat|pumpkins?|dress up)\b/, 0],
    ['jeuxrecre', /\b(cache ?cache|chat perche|1 2 3 soleil|un deux trois soleil|corde a sauter|billes|elastique|hide (and|n) seek|jump rope|skipping rope|marbles|playing tag)\b/, 0],
    ['metier', /\b(quand je serai grande?|quand je serais grande?|plus tard je (veux|voudrais|serai|serais)|metier|when i grow up|dream job|what job)\b/, 0],
    ['pompiers', /\b(pompiers?|policiers?|police|gendarmes?|ambulances?|sirenes?|firefighters?|fire ?fighters?|fire ?men|fireman|fire trucks?|cops?|sirens?)\b/, 0],
    ['colere', /\b(enerv\w*|en colere|colere|vener|venere|pas content\w*|furieu\w*|angry|so mad|i m mad|annoyed|furious)\b/, 0],
    ['cauchemar', /\b(cauchemar\w*|cochemar\w*|peur du noir|peur (\w+ )?(\w+ )?la nuit|dans le noir|scared (\w+ )?at night|afraid (\w+ )?at night|monstres?|zombies?|vampires?|nightmares?|bad dreams?|afraid of the dark|scared of the dark|monsters?)\b/, 0],
    ['joie', /\b(content\w*|heureu\w*|joie|joyeu\w*|happy|so excited|excited|glad)\b/, 0],
    ['ennui', /\b(m ennui\w*|jm ?enn?ui\w*|ennui\w*|enui\w*|je m embete|rien a faire|bored|boring|nothing to do)\b/, 0],
    ['petitfrere', /\b(petit frere|petite s(oe)? ?ur|grand frere|grande s(oe)? ?ur|mon frere|ma s(oe)? ?ur|bebe|little brother|little sister|big brother|big sister|my brother|my sister|baby)\b/, 0],
    ['grandsparents', /\b(papi|papy|mamie|mami|grand pere|grand mere|grands? parents|grandpa|grandma|granny|grandparents|grandad|granddad)\b/, 0],
    ['jouets', /\b(doudous?|peluches?|jouets?|poupees?|barbies?|toys?|teddy|teddy bear|stuffed animals?|plush\w*|dolls?|action figures?)\b/, 0],
    ['dents', /\b(dents?|dentiste|appareil dentaire|petite souri\w*|teeth|tooth|dentist|braces|tooth fairy)\b/, 0],
    ['sommeil', /\b(dormir|dormi|dors|dodo|sommeil|fatigu\w*|sieste|me coucher|au lit|nuit blanche|sleep\w*|tired|bedtime|nap|go to bed)\b/, 0],
    ['puni', /\b(puni\w*|prive de|privee de|grond\w*|engueul\w*|grounded|punished|in trouble|told (me )?off)\b/, 0],
    ['demenagement', /\b(demenag\w*|nouvelle maison|nouvelle ecole|moving house|new house|new school|we re moving|we moved|moving to)\b/, 0],
    ['copains', /\b(meilleure? ami\w*|meilleure? pote|meilleure? copine|meilleur copain|bff|best friends?|best mate|mes potes|mes copains|mes copines|mes amis|my friends|my mates|my buddies)\b/, 0],
    ['argentpoche', /\b((d |l )?argent de poche|dargent de poche|tirelire|mes economies|mes sous|pocket money|allowance|piggy bank|my savings)\b/, 0],
    ['devoirs', /\b(devoirs?|devoire?s?|dvr|exos?|exercices?|homework|hw|home work)\b/, 0],
    ['notes', /\b(controles?|interros?|evals?|evaluations?|bulletin|(bonne|mauvaise|sale|super|bonnes|mauvaises) notes?|eu \d+ sur|eu \d+(?! ?ans)|i got (a |an )?\d{1,2}(?! ?(years|yo))|\d+ sur (10|20)|\d+ out of \d+|exams?|tests? (today|tomorrow|at school)|school tests?|grades?|report card|spelling test|quiz)\b/, 0],
    ['maths', /\b(maths?|matematique\w*|mathematique\w*|calculs?|calcul mental|multiplications?|tables? de multiplication|additions?|soustractions?|fractions?|geometrie|algebra|times tables?|equations?)\b/, 0],
    ['prof', /\b(maitresse|maitre|maicresse|maitress|prof|profs|professeure?s?|instit\w*|teachers?)\b/, 0],
    ['recre', /\b(recre\w*|recreation|recess|playground|break ?time|at break)\b/, 0],
    ['cantine', /\b(cantine|cantoche|school lunch|school dinner|cafeteria|canteen|lunch lady|dinner lady)\b/, 0],
    ['lecture', /\b(livres?|lire|lis|lu un|lecture|bd|bds|bande dessinee|mangas?|romans?|bouquins?|books?|reading|read a|comics?|novels?|library|bibliotheque)\b/, 0],
    ['sciences', /\b(sciences?|svt|experiences? de|physique chimie|chimie|scientifique|science|experiments?|chemistry|biology|scientist)\b/, 0],
    ['art', /\b(dessiner|dessine|desine|dessins?|peindre|peinture|coloriages?|colorier|crayons?|feutres?|pastels?|draw|draws|drew|paint|painting|colou?ring|art class|sketch\w*)\b/, 0],
    ['youtube', /\b(youtu\w*|youtoub\w*|yt|ytb|you tube|tiktok\w*|tik tok|insta|instagram|snap|snapchat|twitch|streamers?|streams?|streaming|influenceu\w*|abonnes|followers|subscribers|vlogs?|reseaux sociaux|social media)\b/, 0],
    ['telephone', /\b(telephone|telefone|telephon\w*|portable|tel|smartphone|iphone|tablette|tablete|phone|tablet|ipad|mobile)\b/, 0],
    ['tele', /\b(tele|television|tv|telly|zapping|watch tv|watching tv)\b/, 0],
    ['console', /\b(ps4|ps5|playstation|play station|xbox|switch|nintendo|game ?boy|wii)\b/, 0],
    ['jeuvideo', /\b(minecraft|mincraft|maincraft|minecraf|fortnite|fortnight|fornite|fortnit|roblox|robloxe|zelda|super mario|mario bros|mario(?! ?kart)|fifa|fc ?2[4-7]|among us|amongus|brawl ?stars?|clash royale|clash of clans|sonic|animal crossing|splatoon|rocket league|subway surf\w*|candy crush|stumble guys|geometry dash|kirby|tetris|pac ?man)\b/, 0],
    ['jeucourse', /\b(mario ?kart|jeux? de (course|voiture)s?|racing games?|car games?|gran turismo|need for speed|forza)\b/, 0],
    ['pokemon', /\b(pokemon\w*|pikachu|dracaufeu|charizard|pokedex|poke mon)\b/, 0],
    ['superpouvoir', /\b(super ?pouvoirs?|pouvoirs? magiques?|super ?heros?|super ?heroes|spider ?man|batman|superman|iron ?man|hulk|marvel|avengers|super ?powers?|invisible)\b/, 0],
    ['magie', /\b(magie|magique|magicien\w*|sorcier\w*|sorciere|fees?|licornes?|dragons?|baguette magique|harry potter|magic|wizards?|witch\w*|fairy|fairies|unicorns?|spells?)\b/, 0],
    ['chevaliers', /\b(chevaliers?|chateau fort|chateaux forts|princesses?|princes?|rois?|reines?|knights?|castles?|princess\w*|kings?|queens?)\b/, 0],
    ['dinosaures', /\b(dino\w*|dinau\w*|t ?rex|tyran+osaure\w*|triceratops|velociraptor\w*|diplodocus|pterodactyl\w*|brachiosaure\w*|jurassic)\b/, 0],
    ['espace', /\b(l ?espace|planetes?|etoiles? filantes?|lune|fusees?|astronaute\w*|galaxie\w*|extra ?terrestres?|aliens?|ovnis?|cosmos|univers|space|planets?|moon|rockets?|astronauts?|galax\w*|ufos?|universe|shooting stars?)\b/, 0],
    ['lego', /\b(legos?|playmobils?|kapla|briques|building blocks|bricks)\b/, 0],
    ['trottinette', /\b(trottinettes?|trotinettes?|trotinete|trott|rollers?|patins? a roulettes|skateboards?|skate|hoverboards?|scooters?|roller ?skates?|rollerblad\w*)\b/, 0],
    ['velo', /\b(velos?|vtt|bmx|bicyclette|petites roues|bikes?|bicycles?|biking|cycling|training wheels)\b/, 0],
    ['piscine', /\b(piscines?|nager|nage|swim|picine|piscinne|plongeoir|toboggans?|parc aquatique|swimming pool|pool|diving board|water ?slides?|water ?park)\b/, 0],
    ['plage', /\b(plages?|la mer|a la mer|chateaux? de sable|sable|vagues?|coquillages?|beach\w*|the sea|seaside|ocean|sandcastles?|waves|seashells?)\b/, 0],
    ['neige', /\b(neige\w*|bonhomme de neige|boules? de neige|luge|snow\w*|sledg\w*|sled\w*)\b/, 0],
    ['chaleur', /\b(il (fait|fai|fe) (trop |tro |tellement |super |tres )?chaud|tro?p? chaud|canicule|chaleur|soleil|it s (so |too |really )?hot|so hot|too hot|heatwave|sunny|sunshine|the sun)\b/, 0],
    ['froid', /\b(il (fait|fai|fe) (trop |tro |tellement |super |tres )?froid|tro?p? froid|je gele|ca caille|froid|it s (so |too |really )?cold|so cold|too cold|freezing|frost\w*)\b/, 0],
    ['orage', /\b(l ?orages?|tonnerre|eclairs?|tempetes?|vent|tornades?|ouragans?|storms?|stormy|thunder\w*|lightning|windy|tornado\w*|hurricanes?)\b/, 0],
    ['glace', /\b(glaces?|glass?es?|glase|sorbets?|cornets?|ice ?creams?|gelato|popsicles?)\b/, 0],
    ['petitdej', /\b(petit dej\w*|ptit dej|p tit dej|gouter|cereales|tartines?|croissants?|pain au chocolat|chocolatine|breakfast|cereal|toast)\b/, 0],
    ['boisson', /\b(sodas?|coca|jus|limonade|sirop|milkshakes?|chocolat chaud|smoothies?|juice|lemonade|milk|coke|hot chocolate|drinks?|boire|soif|thirsty)\b/, 0],
    ['bonbons', /\b(bonbons?|bombons?|chocolats?|sucettes?|sucreries|confiseries|caramels?|candy|candies|sweets|chocolates?|lollipops?|gumm(y|ies))\b/, 0],
    ['legumes', /\b(legumes?|brocolis?|epinards?|carottes?|haricots?|choux|salade|fruits?|pommes?|bananes?|fraises?|vegetables?|veggies|broccoli|spinach|carrots?|apples?|bananas?|strawberr\w*|salad)\b/, 0],
    ['fastfood', /\b(mcdo|mc do|macdo|mcdonald\w*|burger king|kfc|fast ?food|restos?|restaurants?|happy meal|takeaway)\b/, 0],
    ['anniversaire', /\b(anniv\w*|annif|aniversaire|anniversair|fete|ma fete|cadeaux?|birthday|bday|b day|party|parties|presents?|gifts?)\b/, 0],
    ['noel', /\b(noel|pere noel|sapin|christmas|xmas|santa|reindeer)\b/, 0],
    ['zoo', /\b(zoo|lions?|tigres?|elephants?|girafes?|singes?|requins?|dauphins?|ours|loups?|serpents?|crocodiles?|pandas?|baleines?|pingouins?|tigers?|giraffes?|monkeys?|sharks?|dolphins?|bears?|wolf|wolves|snakes?|whales?|penguins?|koalas?)\b/, 0],
    ['insectes', /\b(insectes?|araignees?|abeilles?|fourmis?|moustiques?|papillons?|coccinelles?|mouches?|guepes?|insects?|spiders?|bees?|ants|mosquito\w*|butterfl\w*|ladybugs?|ladybirds?|wasps?)\b/, 0],
    ['camping', /\b(camping|campe|tentes?|forets?|montagnes?|randonnee|rando|cabanes?|feu de camp|tents?|forest|woods|mountains?|hik\w*|treehouse|campfire)\b/, 0],
    ['ville', /\b(villes?|immeubles?|appartement|appart|quartier|paris|london|londres|new york|city|town|apartment|neighbou?rhood|downtown)\b/, 0],
    ['transports', /\b(bus|metro|tram|trams|tramway|(?<!en )trains?|tgv|bateaux?|boats?|subway|ships?|ferry)\b/, 0],
    ['avion', /\b(avions?|aeroport|planes?|airplanes?|aeroplanes?|airport|jets?|helicopteres?|helicopters?)\b/, 0],
    ['voiturejour', /\b((voiture|caisse|auto) (de|a) (mon|ma|mes) \w+|notre voiture|la voiture de (mon|ma|papa|maman)|permis|camions?|tracteurs?|motos?|quads?|trucks?|tractors?|motorbikes?|motorcycles?|our car|my (dad|mom|mum|mother|father|parents) s car|driving licen[cs]e|driving test)\b/, 0],
    ['voyage', /\b(voyages?|voyager|a l etranger|l ?etranger|passeport|valises?|travel\w*|trips?|abroad|passport|suitcases?)\b/, 0],
    ['tech', /\b(ordis?|ordinateurs?|coder|code|coding|programm\w*|scratch|codage|computers?|laptops?|pc)\b/, 0],
    ['danse', /\b(danse\w*|danser|dances?|dancing|dancer|ballet|hip ?hop|zumba|chorales?|chanter|chante|karaoke|sing|singing|choir)\b/, 0],
    ['instruments', /\b(piano|violon|flutes?|trompette|saxo\w*|ukulele|solfege|conservatoire|violin|trumpet|recorder|cello|instruments?)\b/, 0],
    ['footstar', /\b(mbappe|messi|ronaldo|neymar|haaland|zidane|griezmann|psg|real madrid|barca|coupe du monde|ligue des champions|penaltys?|penalties|penalty|world cup|champions league|premier league|ballon d or)\b/, 0],
    ['toilettes', /\b(caca|pipi|prout\w*|crottes?|toilettes?|wc|poop\w*|fart\w*|pee|poo|toilets?|burp\w*)\b/, 0],
    ['jeuxsociete', /\b(jeux? de societe|monopoly|uno|jeux? de cartes|dominos?|dames|board ?games?|card games?|dominoes|checkers|cluedo|scrabble)\b/, 0],
  ];
  // le nom d'un jeu vidéo, écrit proprement (« mincraft » → « Minecraft ») : il le redit dans sa réponse
  const JEUX = [[/minecra|mincraft|maincraft/, 'Minecraft'], [/fortni|fornite/, 'Fortnite'], [/roblox/, 'Roblox'], [/zelda/, 'Zelda'], [/mario/, 'Mario'], [/fifa|fc ?2\d/, 'FIFA'],
    [/among ?us/, 'Among Us'], [/brawl/, 'Brawl Stars'], [/clash/, 'Clash Royale'], [/sonic/, 'Sonic'], [/animal crossing/, 'Animal Crossing'], [/splatoon/, 'Splatoon'],
    [/rocket league/, 'Rocket League'], [/subway/, 'Subway Surfers'], [/candy/, 'Candy Crush'], [/stumble/, 'Stumble Guys'], [/geometry/, 'Geometry Dash'], [/kirby/, 'Kirby'], [/tetris/, 'Tetris'], [/pac ?man/, 'Pac-Man']];
  const nomJeu = t => { for (const [re, n] of JEUX) if (re.test(t)) return n; return null; };
  // les thèmes qui répondent même à une question sur ses goûts (« tu connais Minecraft ? » n'est pas « tu joues aux jeux vidéo ? »)
  const THEMES_FORTS = ['jeuvideo', 'jeucourse', 'pokemon', 'console', 'bonbons', 'glace', 'legumes', 'fastfood', 'boisson', 'petitdej'];   // (« tu manges des bonbons ? » n'est pas « ton plat préféré »)
  // les thèmes où « c'est dur » appelle un encouragement, pas une question
  const DUR_THEMES = ['devoirs', 'notes', 'maths', 'prof', 'lecture', 'sciences', 'instruments', 'art', 'velo', 'trottinette', 'piscine', 'danse', 'tech', 'jeuvideo'];
  const DUR = /\b(dur|dure|durs|difficile|difficiles|complique|compliquee|galere|j y arrive pas|j arrive pas|nul en|nulle en|hard|difficult|tough|can t do|cant do|struggle|struggling)\b/;
  // une réponse qui parle de lui (pour « et toi ? »)
  const PERSO_RE = /^(Moi|Ma |Mon |Mes |J’|Je |Si j’|I |I’|My |Mine |As a kid|For me|At school, I|When I)/;
  const APPRECIE = /\b(c ?etait (trop |tro |super |vraiment )?(bien|cool|genial|drole|top)|cetait \w+|trop bien|tro bien|trop cool|genial|it was (so |really )?(fun|good|great|cool|awesome)|so fun|awesome|amazing)\b/;
  const FAVORI = /\b(prefere|preferee|prefer|fav|favou?rite|le meilleur|la meilleure|the best)\b/;
  const themeDe = t => { for (const [id, re] of THEMES) if (re.test(t)) return id; return null; };
  const SENSIBLES = THEMES.filter(x => x[2]).map(x => x[0]);
  // les sujets « larges » qu'un thème plus précis remplace quand l'enfant parle de lui (« j'ai un contrôle de maths » n'est pas
  // « tu aimais l'école ? ») ; une question au pilote sur un de ses goûts reste à son sujet (sa fiche répond oui ou non)
  const LARGES = ['animal', 'ecole', 'hobby', 'sport', 'plat', 'film', 'jeu', 'musique', 'weekend', 'faire', 'famille', 'argent', 'peur', 'pluie', 'vacances'];
  // les mots qu'on ne reprend pas d'une phrase inconnue (les petits mots du français, de l'anglais et du langage SMS)
  const MOTS_COURANTS = new Set(('alors aussi avant apres avec avoir beaucoup bien bonjour cela celle celui cest chez comme comment dans depuis deux donc dont elle elles encore entre etre fait faire faut il ils jamais jsuis juste leur leurs mais meme mieux moins mon moi nous parce pendant peut peux plus pour pourquoi quand quel quelle quelque quoi rien sans sera sont sous suis sur tout toute tous toutes tres trop truc vais veut veux voila vous vraiment ' +
    'about after again also always another anything because been before being could does doing done dont down from going gonna have here into just know like maybe more much never nothing only other really should some something still than that their them then there these they thing think this those very want wanna what when where which while will with would your youre yours ' +
    'koi kwa ptdr mdrr tkt jsp stp svp bcp vrmt grave cmt pcq psk wesh frero frerot ouais ouai lol lmao haha hihi hehe ahah okay daccord merci thanks salut coucou hello genre trucs choses chose tellement ' +
    'temps fois jour jours toujours hier demain aujourd time times always yesterday today tomorrow tonight whats wats fav favorite favourite prefere preferee ' +
    'connais connait connu sais savais pense penses crois croit aime aimes adore adores deteste regarde regardes joue joues mange manges vois voit dois doit sait voulais pouvais avais etais etait allais disais dire dit dis ' +
    'knew known likes loved liked thinks thought watch watched plays played seen saw does said says tell told feel felt look looks looked went came make made take took give gave').split(' '));
  // le mot à reprendre : un nom propre écrit avec sa capitale (« Max ») d'abord, sinon le plus long des mots pleins (pas un verbe conjugué
  // en -ez, -ons, -ait…), jamais une suite de touches (« asdfghjk ») ni une insulte
  const DETERMINANTS = new Set('le la les l un une des du de mon ma mes ton ta tes son sa ses notre nos leur leurs ce cette ces the a an my your his her our their this that these those some'.split(' '));
  function motRepris(txt) {
    const mots = String(txt).split(/[^A-Za-zÀ-ÿ0-9’'-]+/).map(m => m.replace(/^[a-zA-Z][’']/, '').replace(/^[’'-]+|[’'-]+$/g, '')).filter(Boolean);
    let best = null, propre = null, nom = null;
    mots.forEach((m, i) => {
      const f = plat(m).trim();
      if (f.length < 3 || f.length > 16 || f.includes(' ') || /\d/.test(f) || MOTS_COURANTS.has(f) || MOTS_VIDES.has(f)) return;
      if (!/[aeiouy]/.test(f) || /[^aeiouy]{5,}/.test(f) || /(.)\1\1/.test(f)) return;   // (« asdfghjk », « qwerty » : pas un mot)
      if (typeof PARLE !== 'undefined' && ['INSULTE', 'MENACE'].includes(PARLE.comprendre(m, []).acte)) return;
      if (i > 0 && /^[A-ZÀ-Ý][a-zà-ÿ]/.test(m) && !propre) { propre = m; return; }
      if (f.length < 4 || /(ez|ons|ait|ais|aient|iez)$/.test(f)) return;
      if (i > 0 && DETERMINANTS.has(plat(mots[i - 1]).trim()) && (!nom || f.length > plat(nom).trim().length)) nom = m;   // (un nom après « le », « ma », « the »… plutôt qu'un verbe)
      if (!best || f.length >= plat(best).trim().length) best = m;
    });
    return propre || nom || best;
  }
  // les petits mots qui suivent une réponse : ils ne veulent rien dire seuls, ils répondent au fil de la conversation
  const PETITS = [
    ['etoi', /\b(et toi|et vous|toi aussi|et de ton cote|and (you|u)|what about (you|u)|wbu|hbu|how about (you|u))\b/],
    ['pourquoi', /^\s*(pk|pq|pkoi|pourquoi|mais pourquoi|pourquoi ca|ah pourquoi|why|why not|how come|pourquoi pas)\s*\??\s*$/],
    ['moinonplus', /\b(moi non plus|moi pas|me neither|me either|neither do i|nor me)\b/],
    ['moiaussi', /\b(moi aussi|moi pareil|pareil|pareil pour moi|me too|same|same here|so do i)\b/],
    ['vraiment', /^\s*(ah bon|ah ouais|vraiment|serieux|serieusement|c est vrai|sans blague|wow|waouh|really|for real|no way|seriously|is that true)\s*[?!]*\s*$/],
    ['rire', /^\s*(lol|mdr|ptdr|xd|jpp|haha|ahah|hihi|hehe|lmao|rofl|trop drole|so funny)( lol| mdr)?\s*[!?]*\s*$/],
    ['oui', /^\s*(moi )?(i do|i did|oui|cool|super|genial|nice|trop bien|great|ouais|ouai|yes|yeah|yep|yup|ok|okay|d accord|bien sur|grave|carrement|exact|exactement|of course|sure|totally|absolutely|si)\b/],
    ['non', /^\s*(moi )?(non|rien|nothing|nan|nope|no|pas du tout|pas trop|pas vraiment|pas tellement|jamais|not really|not much|never|nah)\b/],
  ];
  // qui la phrase vise : le pilote (« tu », « ton », « you ») ou le joueur qui parle de lui (« je », « mon », « I », « my »)
  const VERS_LUI = /\b(tu|t|te|ton|ta|tes|toi|vous|votre|you|your|u|ur|yours)\b/;
  const DE_MOI = /\b(je|j|moi|mon|ma|mes|i|my|me|im|i m)\b/;

  // le nom de l'animal du joueur, sous toutes ses formes : « il s'appelle Mimi », « il sappel Mimi », « son nom c'est Mimi », « appelé Mimi »,
  // « his name is Mimi », « it's called Mimi », « named Mimi »
  const BETES = 'chien|chienne|chat|chatte|lapin|hamster|poisson|tortue|perroquet|chiot|chaton|dog|puppy|cat|kitten|rabbit|fish|turtle|tortoise|parrot|pet';
  const PAS_UN_NOM = ['le', 'la', 'les', 'un', 'une', 'mon', 'ma', 'the', 'a', 'my', 'trop', 'tres', 'super', 'gentil', 'gentille', 'mignon', 'mignonne', 'so', 'very'];
  const RE_NOM_1 = new RegExp('\\b(?:' + BETES + ')s?(?: rouge)?\\s*(?:,|et|and)?\\s*(?:il|elle|it|he|she)?\\s*(?:s appelle|s appel|se nomme|c est|est appele|est appelee|appele|appelee|is called|is named|called|named|s called|s named|name is|s name is)\\s+(\\w+)');
  const RE_NOM_2 = /\b(?:son nom (?:c est|est)|(?:his|her|its|their) name(?: is)?|il s appelle|elle s appelle|il s appel|elle s appel|(?:he|she|it) s (?:called|named))\s+(\w+)/;
  function nomAnimal(t) {
    for (const re of [RE_NOM_2, RE_NOM_1]) { const m = t.match(re); if (m && !PAS_UN_NOM.includes(m[1]) && m[1].length > 1) return m[1]; }
    return null;
  }
  // « j'en ai 2 » : le nombre dit par le joueur (frères et sœurs, enfants…)
  const NOMBRES = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, one: 1, two: 2, three: 3, four: 4, five: 5 };
  function nombreDit(t) {
    const m = t.match(/\b(?:j en ai|i have|i got|i ve got|i ve|il y en a|ya)\s+(\d{1,2}|un|une|deux|trois|quatre|cinq|six|one|two|three|four|five|six)\b/)
      || t.match(/\b(\d{1,2}|deux|trois|quatre|cinq|two|three|four|five) (?:freres|soeurs|freres et soeurs|brothers|sisters|siblings)\b/);
    if (!m) return null; const n = /^\d/.test(m[1]) ? +m[1] : NOMBRES[m[1]]; return n >= 1 && n <= 20 ? n : null;
  }
  function lire(txt) {
    // l'écriture des enfants : « jai », « jaime », « tadore », « sappel », « ta quel age », « cest »
    const t = plat(txt).replace(/\bj(ai|aime|adore|suis|veux|vais|habite|joue|connais|deteste|prefere)\b/g, 'j $1').replace(/\bjen\b/g, 'j en').replace(/\bt(adore|aime)\b/g, 't $1')
      .replace(/\bsappel+e?s?\b/g, 's appelle').replace(/\bcest\b/g, 'c est').replace(/\bta (quel|un|une|des|peur|quelle)\b/g, 't as $1').replace(/\bjtm\b/g, 'je t aime');
    let sujet = null;
    for (const [s, re] of SUJETS) if (re.test(t)) { sujet = s; break; }
    let petit = null;
    for (const [s, re] of PETITS) if (re.test(t)) { petit = s; break; }
    const question = /\?/.test(t) || /^\s*(est ce que|est ce qu|do|does|did|are|is|can|what|whats|wat|who|whos|how|hows|where|wheres|when|which|quel|quelle|quels|quelles|qui|comment|ou|quand|combien|pourquoi|c est quoi|tu)\b/.test(t);
    const versLui = VERS_LUI.test(t), deMoi = DE_MOI.test(t);
    // ce que le joueur dit de lui : son âge, le nom de son animal, ce qu'il aime
    const age = (t.match(/\b(?:j ai|j a|moi|i m|im|i am|i ve got)\s+(\d{1,2})\s*(?:ans|an|years?|yo)?\b/) || t.match(/\b(\d{1,2})\s*(?:ans|years old|yo)\b/) || [])[1];
    const animalNom = nomAnimal(t);
    const animal = (t.match(/\b(?:j ai|moi j ai|i have|i ve got|i got|mon|ma|my) (?:un |une |a |an )?(chien|chat|chienne|chatte|lapin|hamster|poisson|tortue|perroquet|dog|cat|rabbit|hamster|fish|turtle|parrot)\b/) || [])[1];
    const adieu = !/\?/.test(t) && /^\s*(a demain|see (you|ya) (tomorrow|tmrw)|cya (tmrw|tomorrow)|a bientot|a tout a l heure|a la prochaine)\s*$/.test(t);
    const r = { nombre: nombreDit(t), adieu, t, sujet, petit, question, versLui, deMoi, age: age ? +age : null, animalNom: animalNom || null, animal: animal || null };
    if (R.BAVARDAGE_THEMES) {
      r.theme = themeDe(t);   // (tour 60) le thème de tous les jours (l'école, les dinosaures, la neige…)
      // les au revoir du moment : « bonne nuit » (il te souhaite de bien dormir), « bonne journée », « à demain »
      const adieuT = /^\s*(bonne nuit|bne nuit|bonne nuit a toi|good ?night|night night|nighty night|gn|sweet dreams)\s*!*\s*$/.test(t) ? 'nuit'
        : /^\s*(bonne journee|bonne soiree|bonne aprem|bonne apres midi|have a (good|nice|great) (day|evening|afternoon)|good day)\s*!*\s*$/.test(t) ? 'jour'
        : /^\s*(a demain|a 2main|see (you|u|ya) (tomorrow|tmrw)|cya (tmrw|tomorrow)|bye see (you|u|ya) tomorrow)\s*!*\s*$/.test(t) ? 'demain' : null;
      if (adieuT) { r.adieu = true; r.adieuType = adieuT; }
      if (r.theme === 'jeuvideo') r.jeu = nomJeu(t);
      if (r.theme === 'notes' || /\b\d{1,2}\s*\/\s*(10|20)\b/.test(String(txt))) {   // (une note : sur 20 ou sur 10)
        const m = String(txt).match(/\b(\d{1,2})\s*(?:\/|sur|out of|on)\s*(10|20)\b/i) || t.match(/\b(?:eu|got|have|ai)\s+(?:a |an |un |une )?(\d{1,2})\b(?! ?(?:ans|an|years?|yo)\b)/);
        if (m) { const n = +m[1], base = m[2] ? +m[2] : n > 10 || LANGUE === 'fr' ? 20 : 10; if (n <= base) { r.note = { n, base }; r.theme = 'notes'; } }
      }
      if (!r.animalNom) { const m = t.match(/\b(?:its|it is|hes|shes|he is|she is) (?:called|named) (\w+)/); if (m && !PAS_UN_NOM.includes(m[1]) && m[1].length > 1) r.animalNom = m[1]; }
      if (r.age !== null && new RegExp('\\b' + r.age + '\\s+(?!ans?\\b|years?\\b|yo\\b|et\\b|and\\b|moi\\b|toi\\b|you\\b|u\\b|vous\\b)[a-z]').test(t)) r.age = null;   // (« j'ai 10 euros » n'est pas un âge)
    }
    return r;
  }

  // la chose que le joueur aime ou nomme, prise dans SA phrase (pour la lui redire) : 3 mots au plus, jamais une insulte
  function chose(txt) {
    let s = String(txt).trim().replace(/[?!.…]+$/g, '').trim();
    s = s.replace(/^(moi,?\s*|bah\s*|ben\s*|euh\s*|hmm\s*|alors\s*)/i, '')
      .replace(/^(j[’']?aime (bien |beaucoup |trop )?|j[’']?adore |je préfère |je prefere |mon (préféré|prefere) c[’']?est |ma (préférée|preferee) c[’']?est |c[’']?est |je dirais |je fais (du |de la |de l[’']|des )?|i (like|love|prefer) |i play |i do |probably |maybe |my favou?rite is |mine is |mine[’']?s |it[’']?s )/i, '')
      .trim();
    if (/\?/.test(txt) || VERS_LUI.test(plat(s)) || /^(est ce|do|does|did|are|is|can|what|who|how|where|quel|quelle|qui|comment|ou|quand|combien|pourquoi)\b/.test(plat(s).trim())) return null;
    if (/^(i do|i did|i am|me|moi|yes|yeah|oui|ouais|non|no|nope)\b[ ,.!]*$/i.test(s)) return null;
    if (!s || s.length > 28 || s.split(/\s+/).length > 3 || /\d{3,}/.test(s)) return null;
    if (R.BAVARDAGE_THEMES && !/\s/.test(s) && (!/[aeiouy]/i.test(plat(s)) || /[^aeiouy\s]{4,}/.test(plat(s)))) return null;   // (tour 60 : « asdfghjk » n'est pas une réponse)
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
  const PERSO = ['age', 'famille', 'animal', 'hobby', 'sport', 'plat', 'couleur', 'musique', 'film', 'jeu', 'ecole', 'origine', 'debut', 'reve', 'peur', 'idole', 'superstition', 'secret', 'weekend', 'vacances', 'faire'];

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
    const nb = l.nombre !== null && !fort && !l.question && (l.sujet === 'famille' || b.dernierSujet === 'famille');   // « oui j'en ai 2 » après les frères et sœurs
    if (nb) quoi = 'fratrie'; else
    if (b.attente && l.sujet && !l.question && !l.versLui && !l.deMoi && !fort) quoi = 'attente';   // « oui un chien », « le basket » : la réponse à sa question, pas une nouvelle question
    else if (l.sujet && !fort) quoi = 'sujet';
    else if (b.attente && !fort && (l.petit || l.age !== null || l.animalNom || l.animal || ['INCONNU', 'QUESTION', 'ACCORD', 'REFUS', 'AVIS', 'ETAT'].includes(a.acte))) quoi = 'attente';
    else if (l.petit && b.dernier && !fort && ['etoi', 'pourquoi', 'moiaussi', 'moinonplus', 'vraiment', 'rire', 'oui', 'non'].includes(l.petit)) quoi = 'petit';
    else if ((l.age !== null || l.animalNom || l.animal) && !fort) quoi = 'confie';
    // une vraie phrase qu'il ne sait pas ranger (« vous connaissez Max ? ») : il l'avoue en riant et relance, sans « je ne comprends pas »
    else if (!b.attente && b.dernier && ATTENTES.includes(b.dernierSujet) && !l.question && !l.versLui && a.acte === 'INCONNU' && chose(txt)) { b.attente = b.dernierSujet; quoi = 'attente'; }   // « le bleu » après une couleur
    // (tour 60, BAVARDAGE_THEMES) un thème de tous les jours (« j'ai un contrôle de maths », « t'aimes les dinos ? ») passe devant un
    // sujet large ou un petit mot ; jamais devant ce qui touche vraiment la course, un sujet précis, sa question en attente ou ce que
    // le joueur confie de lui. La réponse d'après à sa petite question sur le thème est reprise (« le T-rex ! »). Une phrase que rien
    // ne range : il en reprend un mot, sinon il relance sur la course.
    const TH = R.BAVARDAGE_THEMES, thQ = TH && b.thQ, choixAvant = TH && b.choix, redit = TH && b.dernierJ === l.t;
    if (TH) { b.thQ = false; b.choix = false; b.dernierJ = l.t; }
    const sensible = TH && SENSIBLES.includes(l.theme), mots = l.t.trim().split(/\s+/).length;
    if (TH && l.theme && !l.adieu && !(fort && l.versLui && !COURSE_DOUX.includes(a.acte))   // (« j'adore les glaces » n'est pas un contact)
      && (sensible || (!(l.sujet && (!LARGES.includes(l.sujet) || (l.question && l.versLui && !l.deMoi && !THEMES_FORTS.includes(l.theme) && (GOUT_DE[l.sujet] || l.sujet === 'animal'))))
      && !['fratrie', 'confie'].includes(quoi) && !(quoi === 'attente' && mots < 3)))) quoi = 'theme';
    else if (TH && !quoi && thQ && !fort && !l.question && !l.versLui && l.t.trim().split(/\s+/).length <= 4 && !APPRECIE.test(l.t) && chose(txt)) quoi = 'threp';
    // après un thème sensible (la tristesse…), ce que l'enfant raconte reste sur ce thème ; « avec une piscine dedans » continue le thème d'avant
    if (TH && quoi === 'theme' && b.theme && b.dernier && b.dernierSujet === 'th_' + b.theme && !l.question && !sensible
      && (SENSIBLES.includes(b.theme) || (/^\s*(avec|with|et|and)\b/.test(l.t) && mots <= 6))) quoi = 'thsuite';
    if (l.adieu && !fort) quoi = 'adieu';
    if (TH && l.adieuType && (!fort || a.acte === 'ADIEU')) quoi = 'adieu';
    // « oui » à une question « A ou B ? » : il le relève (« Les deux, alors ? »)
    if (TH && choixAvant && ['oui', 'non'].includes(l.petit) && mots <= 3 && !fort) quoi = 'choix';
    // la même phrase redite mot pour mot : il le remarque gentiment
    if (TH && redit && mots >= 3 && !(fort && l.versLui) && quoi !== 'adieu') quoi = 'redit';
    // (la suite d'un thème : « elle crie tout le temps » après la maîtresse, « il est trop fort » après le T-rex : il reste sur le thème)
    if (TH && (!quoi || quoi === 'flou' || (quoi === 'attente' && b.attente === 'f1')) && b.theme && b.dernier && b.dernierSujet === 'th_' + b.theme && !l.question && !l.adieu && mots >= 3 && !l.sujet
      && !(fort && (l.versLui || !COURSE_DOUX.includes(a.acte)))) quoi = 'thsuite';
    if (TH && !quoi && !fort && (FLOU.includes(a.acte) || (a.acte === 'AVIS' && !l.versLui && mots >= 3))) quoi = 'inconnu';   // (« j'ai trouvé un caillou » n'est pas « tu me trouves comment ? »)
    if (!quoi && !fort && FLOU.includes(a.acte) && (l.question || l.versLui || l.deMoi) && l.t.trim().split(/\s+/).length >= 2) quoi = 'flou';
    if (!quoi) { b.dernier = false; if (TH) b.pontDernier = false; return null; }
    b.n++; b.ici = (b.ici || 0) + 1;
    const alea = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_BAVARDAGE + 5003 + k * 131 + b.n * 17 + ch.resultats.length * 1009);
    const ctx = contexte(ch, k, p, b);
    ctx._t = l.t; ctx._q = l.question; ctx._vers = l.versLui;
    const dire = makeDire(ctx, b, alea);
    if (b.ici > R.BAVARDAGE_PAR_GP) { b.attente = null; b.dernier = true; return fin({ texte: dire('bav_fin'), sujet: 'fin' }, b); }
    if (quoi === 'adieu') { b.attente = null; b.dernier = false; return fin({ texte: dire(TH && l.adieuType ? 'bav_adieu_' + l.adieuType : 'bav_fin'), sujet: 'fin' }, b); }
    if (quoi === 'choix') { b.attente = null; b.dernier = true; return fin({ texte: dire(l.petit === 'oui' ? 'bav_choix_oui' : 'bav_choix_non'), sujet: b.dernierSujet || 'petit' }, b); }
    if (quoi === 'redit') { b.dernier = true; return fin({ texte: dire('bav_redit'), sujet: b.dernierSujet || 'petit' }, b); }
    if (quoi === 'theme') return fin(repTheme(l.theme, ctx, b, dire, alea, l), b);
    if (quoi === 'threp') { b.attente = null; ctx.x = chose(txt); return fin(avecPont(dire('bav_th_rep'), b.theme, ctx, b, dire, alea, 'th_' + b.theme), b); }
    if (quoi === 'thsuite') return fin(repTheme(b.theme, ctx, b, dire, alea, l, true), b);
    if (quoi === 'inconnu') { b.attente = null; return fin(repInconnu(txt, l, ctx, b, dire, alea), b); }
    const morceaux = [];
    let sujet = null;
    const attente = b.attente; b.attente = null;
    // ce que le joueur confie de lui, d'abord (on le garde)
    if (l.age !== null && l.age >= 4 && l.age <= 99) { b.j.age = l.age; ctx.x = l.age; morceaux.push(dire(l.age < 13 ? 'bav_j_age_jeune' : l.age < 18 ? 'bav_j_age_ado' : 'bav_j_age_grand')); sujet = 'age'; }
    if (quoi === 'fratrie') { b.j.fratrie = l.nombre; ctx.x = l.nombre; morceaux.push(dire(l.nombre === 1 ? 'bav_j_fratrie_un' : l.nombre === 2 ? 'bav_j_fratrie_deux' : 'bav_j_fratrie_plus')); sujet = 'famille'; }
    if (l.animalNom) { b.j.animal = 1; b.j.animalNom = l.animalNom.charAt(0).toUpperCase() + l.animalNom.slice(1); ctx.x = b.j.animalNom; morceaux.push(dire('bav_j_animalnom')); sujet = 'animal'; }
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
    if (TH && !morceaux.length && !fort && FLOU.includes(a.acte)) return fin(repInconnu(txt, l, ctx, b, dire, alea), b);
    if (!morceaux.length && !fort && FLOU.includes(a.acte) && (l.question || l.versLui || l.deMoi) && l.t.trim().split(/\s+/).length >= 2) quoi = 'flou';
    if (quoi === 'flou') { morceaux.push(dire('bav_flou')); const r = relance(ctx, b, dire, alea); if (r) morceaux.push(r); sujet = null; }
    if (!morceaux.length) { b.dernier = false; return null; }
    // une question en retour (seulement s'il n'en attend pas déjà une, pas deux fois la même, et jamais s'il t'en veut)
    if (!b.attente && sujet && RETOUR[sujet] && ctx.humeur !== 'froid' && !b.demandes.includes(RETOUR[sujet]) && !b.j[RETOUR[sujet]] && alea() < R.BAVARDAGE_RETOUR) {
      const q = liste('bav_q_' + RETOUR[sujet]);
      if (q.length) { morceaux.push(dire('bav_q_' + RETOUR[sujet])); b.attente = RETOUR[sujet]; b.demandes = b.demandes.concat([RETOUR[sujet]]).slice(-12); }
    } else if (!b.attente && ctx.humeur !== 'froid' && ((b.ici >= 3 && alea() < R.BAVARDAGE_RELANCE) || (['petit', 'attente'].includes(quoi) && ['oui', 'non'].includes(l.petit)))) {   // (un « cool » seul : il relance)
      const r = relance(ctx, b, dire, alea); if (r) morceaux.push(r);
    }
    b.dernier = true; b.dernierSujet = sujet || b.dernierSujet;
    if (TH) { b.pontDernier = false; b.theme = null; }
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
        blague: de('blague', v.blague), secret: de('secret', v.secret), faire: de('faire', v.faire), weekend: de('weekend', v.weekend), vacances: de('vacances', v.vacances),
        circuit_fav: cir(v.circuitFav), circuit_dur: cir(v.circuitDur), prochain: cir(prochain && prochain.circuit), place,
        place_joueur: placeJ, leader: leader ? (leader.humain ? texte('bav_toi') : nomDe(leader)) : '', points: s.points || 0, victoires: s.victoires || 0,
        podiums: s.podiums || 0, ecurie: nomEcurie(ch.ecuries[p.ecurie]), coequipier: co ? nomDe(co) : '', saison: ch.saison,
        j_age: b.j.age || '', j_animal: b.j.animalNom || '', x: '' } };
  }
  // dire(cle) : une variante pas dite récemment, ses trous remplis
  function makeDire(ctx, b, alea) {
    return function dire(cle, extra, eviter, filtre) {
      const ton = ctx.humeur === 'froid' ? '_froid' : (ctx.p.caractere && ctx.p.caractere.agressivite >= R.DISCUSSION_FOUGUEUX) ? '_vif' : '';
      const TH = R.BAVARDAGE_THEMES;
      let v = TH && liste(cle + '_th').length ? liste(cle + '_th') : liste(cle);   // (tour 60 : des variantes refaites, seulement avec les thèmes)
      if (ton && liste(cle + ton).length) v = v.concat(liste(cle + ton), liste(cle + ton));
      if (filtre) v = v.filter(x => filtre.test(x));
      if (!v.length) return '';
      const vals = Object.assign({}, ctx.vals, { x: ctx.x !== undefined ? ctx.x : '' }, extra || {});
      const remplir = t => {
        let r = t;
        if (ctx.anonyme) r = r.replace(/,\s*\{nom\}/g, '').replace(/\s+\{nom\}/g, '').replace(/\{nom\},\s*/g, '').replace(/\{nom\}/g, '');
        if (TH) {   // (tour 60) « en la géographie » → « en géographie », « à le » → « au » ; une capitale après « ? », « ! », « . »
          r = r.replace(/(^|\s)(en|à|de) \{(\w+)\}/g, (m, e, prep, c) => {
            const x = vals[c]; if (x === undefined || typeof x !== 'string') return m;
            const y = prep === 'en' ? x.replace(/^(la |le |les |l’)/, '') : prep === 'à' ? x.replace(/^le /, 'au ').replace(/^les /, 'aux ') : x.replace(/^le /, 'du ').replace(/^les /, 'des ');
            return e + (/^(au|aux|du|des) /.test(y) && prep !== 'en' ? y : prep + ' ' + y);
          });
        }
        r = r.replace(/\{(\w+)\}/g, (m, c) => vals[c] !== undefined ? vals[c] : m);
        if (TH) r = r.replace(/([?!.]) ([a-zàâäéèêëîïôöûüç])/g, (m, p, c) => p + ' ' + c.toUpperCase()).replace(/\bJ’ai ni /g, 'Je n’ai ni ').replace(/\bil y a ni /g, 'il n’y a ni ');
        return r.charAt(0).toUpperCase() + r.slice(1);
      };
      const i0 = Math.floor(alea() * v.length);
      for (let n = 0; n < v.length; n++) { const t = remplir(v[(i0 + n) % v.length]); if (!b.recents.includes(t.slice(0, 24)) && !(eviter && eviter.includes(t))) return t; }
      return remplir(v[i0]);
    };
  }

  // une question oui / non sur ses goûts (« tu aimes le foot ? », « t'as un chien ? ») : il répond d'abord oui ou non, d'après sa vraie fiche
  const TYPES_BETES = [/\b(chiens?|chiots?|dogs?|puppy)\b/, /\b(chats?|chatons?|cats?|kitten)\b/, /\b(poissons?( rouge)?|fish|goldfish)\b/, /\b(lapins?|rabbits?)\b/, /\b(tortues?|tortoise|turtle)\b/, /\b(perroquets?|parrots?)\b/];
  const MOTS_VIDES = new Set(('tu t as es fais fait aimes aime joues joue mange manges regardes ecoutes ecoute pratiques vous du de des le la les un une et toi est ce que qu au aux en dans avec aussi deja vraiment comme chez ta ton tes pour sur par ' +
    'do does you your ur u r like likes love play plays eat watch listen to the an any have got also too really with and are is favourite favorite fav sport sports musique music film films movie movies jeu jeux video games game gaming food plat couleur color colour ' +
    'ecole school hobby hobbies passion passions loisirs animal animaux pets pet bouffe manger repas series serie cinema tele fan est ce faire fais').split(' '));
  const QUESTION_OUVERTE = /\b(quoi|quel|quelle|quels|quelles|qui|comment|combien|pourquoi|what|which|who|how|why|whats|wat|wats|where|when|quand|ou)\b/;
  const GOUT_DE = { sport: ['sport'], hobby: ['hobby1', 'hobby2'], plat: ['plat'], couleur: ['couleur'], musique: ['musique'], film: ['film'], jeu: ['jeu'] };
  function ouiNon(s, ctx, dire) {
    const t = ' ' + (ctx._t || '') + ' ';
    if (!ctx._q || QUESTION_OUVERTE.test(t) || !ctx._vers) return null;
    if (s === 'animal') {
      const i = TYPES_BETES.findIndex(re => re.test(t)); if (i < 0) return null;
      if (i === ctx.v.animal) return dire('bav_yn_oui') + ' ' + dire('bav_animal');
      ctx.x = t.match(TYPES_BETES[i])[1].replace(/s$/, '');
      return dire('bav_animal_non') + ' ' + dire('bav_animal_ou');
    }
    if (!GOUT_DE[s]) return null;
    const mots = t.split(/\s+/).filter(m => m.length >= 3 && !MOTS_VIDES.has(m));
    if (!mots.length) return null;
    const fiche = GOUT_DE[s].map(c => plat(ctx.vals[c] || '')).join(' ');
    const oui = mots.some(m => fiche.includes(m.slice(0, Math.min(m.length, 4))));
    return dire(oui ? 'bav_yn_oui' : 'bav_yn_non') + ' ' + dire('bav_' + s);
  }

  // ce qu'il dit de lui sur un sujet
  function sujetLui(s, ctx, b, dire, alea, a) {
    const { p, v } = ctx;
    if (ctx.humeur === 'froid' && PERSO.includes(s) && alea() < 0.6) return dire('bav_froid');
    const yn = ouiNon(s, ctx, dire); if (yn) return yn;
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
    if (att === 'f1') {   // (tour 60) la réponse à sa question sur la course, après un pont
      if (oui || non) return { texte: dire(oui ? 'bav_j_f1_oui' : 'bav_j_f1_non'), sujet: 'f1' };
      const c = chose(txt); if (c && !/\d/.test(c) && !/^(j|je|jai|jsuis|i|im|on|we|il|elle|he|she|they|ils|elles)\b/.test(plat(c).trim())) { ctx.x = c; return { texte: dire('bav_j_f1_x'), sujet: 'f1' }; }
      return null;
    }
    if (att === 'animalnom') {
      const c = chose(txt);
      if (c && !oui && !non) { b.j.animalNom = c.charAt(0).toUpperCase() + c.slice(1); ctx.x = b.j.animalNom; ctx.vals.j_animal = b.j.animalNom; return { texte: dire('bav_j_animalnom'), sujet: 'animal' }; }
      return null;
    }
    if (att === 'pronostic') {
      const ch = ctx.ch, n = typeof PARLE !== 'undefined' ? PARLE.comprendre(txt, ch.pilotes.filter(x => !x.humain).map(x => ({ k: x.id, nom: nomDe(x) }))) : null;
      if (n && n.cible !== null && n.cible !== undefined) { ctx.x = nomDe(ch.pilotes[n.cible]); return { texte: dire(n.cible === ctx.k ? 'bav_j_pronostic_moi' : 'bav_j_pronostic'), sujet: 'pronostic' }; }
      if (/\b(moi|me|myself|i will|i ll)\b/.test(l.t)) return { texte: dire('bav_j_pronostic_toi'), sujet: 'pronostic' };
      if (!l.question && /\b(toi|you|u)\b/.test(l.t)) return { texte: dire('bav_j_pronostic_moi'), sujet: 'pronostic' };
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
  // --- (tour 60, BAVARDAGE_THEMES) un thème de tous les jours : il en parle (sa réaction, jamais deux fois la même), il y reste un peu
  // si l'enfant y revient, et il ramène doucement à la course : un pont du thème vers la course (une fois sur deux ou trois, jamais
  // deux réponses de suite, jamais le même pont deux fois de suite), parfois suivi d'une question sur la course (attendue).
  function repTheme(id, ctx, b, dire, alea, l, suite) {
    b.attente = null;
    const meme = b.theme === id;
    b.themeN = meme ? (b.themeN || 0) + 1 : 0; b.theme = id;
    if (id === 'jeuvideo' && l && l.jeu) { if (meme && b.thX && b.thX !== l.jeu) b.themeN = 0; b.thX = l.jeu; }   // (un autre jeu nommé : un sujet neuf)
    ctx.x = id === 'jeuvideo' ? (b.thX || (LANGUE === 'fr' ? 'ce jeu' : 'that game')) : ctx.x;
    const sensible = SENSIBLES.includes(id);
    const q = l && l.versLui && !l.deMoi && !suite && (l.question || /\b(et toi|et vous|and (you|u)|quoi|what|which|quel|quelle|tu veux|tu aimes|t aimes)\b/.test(l.t) || /^\s*(have|has|did|do|does|can|are|is|tu as|t as|as tu|tu connais|tu sais|t es|tu es)\b/.test(l.t));   // (« et toi tu veux quoi comme cadeau » est une question)
    let t;
    if (ctx.humeur === 'froid' && !sensible && alea() < 0.5) t = dire('bav_froid');
    else if (id === 'notes' && l && l.note) {   // (une note : le réconfort si elle est basse, les félicitations si elle est haute)
      const r = l.note.n / l.note.base;
      ctx.x = l.note.n + '/' + l.note.base;
      t = dire(r < 0.5 ? 'bav_note_basse' : r >= 0.75 ? 'bav_note_haute' : 'bav_note_moyenne');
    }
    else if (l && !q && !sensible && DUR_THEMES.includes(id) && DUR.test(l.t)) t = dire('bav_th_dur');   // (« c'est dur les fractions » : un encouragement)
    else if (suite && !sensible && l && APPRECIE.test(l.t)) t = dire('bav_th_content');   // (« c'était trop bien » : il partage sa joie)
    else if (suite && (b.suites || []).filter(x => x === id).length < liste('bav_suite_' + id).length) { b.suites = (b.suites || []).concat([id]).slice(-8); t = dire('bav_suite_' + id); }
    else if (q && !sensible && (liste('bav_th_' + id).some(x => PERSO_RE.test(x)) || liste('bav_moi_' + id).length)) {   // (« et toi ? » : d'abord sa réponse à lui)
      t = liste('bav_moi_' + id).length ? dire('bav_moi_' + id) : dire('bav_th_' + id, null, null, PERSO_RE);
    }
    else {
      // l'enfant a déjà dit l'essentiel (« mon préféré c'est le T-rex », une phrase de 4 mots ou plus) : pas de question qui le lui redemande
      const dejaDit = suite || (l && !l.question && (FAVORI.test(l.t) || l.t.trim().split(/\s+/).length >= 4));   // (la suite d'une histoire : il écoute, il ne redemande pas)
      const SANS_Q = /[^?]\s*$/;
      const assez = suite ? 'bav_th_ecoute' : 'bav_th_encore';   // (ses réactions toutes dites : il écoute la suite, ou il aime en parler)
      t = b.themeN >= liste('bav_th_' + id).length ? dire(assez)
        : dejaDit ? (liste('bav_th_' + id).some(x => SANS_Q.test(x) && !b.recents.includes(x.slice(0, 24))) ? dire('bav_th_' + id, null, null, SANS_Q) : dire(assez))
        : dire('bav_th_' + id);   // (ses réactions toutes dites : il aime en parler)
    }
    b.thQ = /\?\s*$/.test(t);
    b.choix = b.thQ && / (ou|or) [^?]*\?\s*$/.test(t);
    return avecPont(t, id, ctx, b, dire, alea, 'th_' + id);
  }
  function avecPont(t, id, ctx, b, dire, alea, sujet) {
    const sensible = SENSIBLES.includes(id);
    const p = b.themeN >= 2 ? 0.9 : b.themeN === 1 ? R.BAVARDAGE_PONT_RESTE : R.BAVARDAGE_PONT;
    let pont = null;
    if (!sensible && !b.pontDernier && !b.thQ && ctx.humeur !== 'froid' && liste('bav_pont_' + id).length && alea() < p) {   // (sa petite question sur le thème attend sa réponse : pas de pont)
      if (!Array.isArray(b.ponts)) b.ponts = [];
      pont = dire('bav_pont_' + id, null, b.ponts);
      b.ponts = b.ponts.concat([pont]).slice(-4);
      if (alea() < 0.7) { const qf = dire('bav_q_f1', null, b.ponts); pont += ' ' + qf; b.attente = 'f1'; b.choix = / (ou|or) [^?]*\?\s*$/.test(qf); }
    }
    b.pontDernier = !!pont;
    b.dernier = true; b.dernierSujet = sujet;
    return { texte: pont ? t + ' ' + pont : t, sujet, pont: pont || null };
  }
  // une phrase que rien ne range : il reprend un de ses mots (« Zorglub ? Raconte-moi ! »), sinon il relance sur la course
  function repInconnu(txt, l, ctx, b, dire) {
    const m = motRepris(txt);
    let t;
    if (/^\s*(mdr|lol|ptdr|xd|haha|ahah|hihi|lmao|rofl|jpp)\b/.test(l.t)) t = dire('bav_rire');   // (« mdr c'est un mot inventé » : il rit avec toi)
    else if (m) { ctx.x = m.charAt(0).toUpperCase() + m.slice(1); t = dire(l.question ? 'bav_inc_q' : 'bav_inc'); }
    else { const qf = dire('bav_q_f1', null, b.ponts || []); t = dire('bav_inc_sans') + ' ' + qf; b.attente = 'f1'; b.choix = / (ou|or) [^?]*\?\s*$/.test(qf); }
    b.pontDernier = false; b.dernier = true; b.theme = null; b.dernierSujet = 'inconnu';
    return { texte: t, sujet: 'inconnu' };
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
  return { persona, lire, chose, repondre, relanceIncompris, rappelSalut, motRepris, SUJETS: SUJETS.map(s => s[0]), THEMES: THEMES.map(x => x[0]), SENSIBLES };
})();
