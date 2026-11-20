// Les thèmes de tous les jours (tour 60, Codeur 1, BAVARDAGE_THEMES ; le propriétaire : « il faut que les IA comprennent tous les
// thèmes (mais elles doivent quand même essayer de rester sur la F1) ») : chaque thème reconnu sous 3 tournures d'enfant (la 3e avec
// des fautes ou en langage SMS) et une réponse qui en parle ; le pont doux vers la course (environ 1 réponse sur 2 ou 3, jamais deux
// ponts identiques de suite) ; il reste un peu sur un thème relancé ; une phrase inconnue est reprise par un de ses mots, jamais
// « je ne comprends pas » ; BAVARDAGE_THEMES faux = les réponses d'avant au mot près (empreinte prise sur main avant le tour 60).
// Chargé par tests/banc-parle.html et tests/banc-bavardage-en.html après banc-bavardage.js (il reprend nouveau, rival, gpCouru, t, v, L).
const TH_PHRASES = {
  harcelement: { fr: ['à l’école on se moque de moi', 'il y a des grands qui me tapent à la récré', 'jsuis harcelé au colege'], en: ['kids at school make fun of me', 'i get bullied every day', 'they laugh at me evry day at scool'] },
  deuil: { fr: ['mon chat est mort hier', 'ma grand mère est décédée', 'mon poisson est mort ce matin'], en: ['my dog died yesterday', 'my grandad passed away', 'my hamster is dead :('] },
  triste: { fr: ['je suis triste aujourd’hui', 'j’ai pleuré ce matin', 'jsui tro trist'], en: ['i feel sad today', 'i was crying this morning', 'im so sad rn'] },
  seul: { fr: ['personne ne veut jouer avec moi', 'j’ai pas d’amis', 'je sui tout seul a la recre'], en: ['i have no friends', 'nobody plays with me', 'i feel so lonely'] },
  malade: { fr: ['je suis malade', 'j’ai de la fièvre', 'jai mal au ventre'], en: ['i am sick today', 'i have a fever', 'i got the flu'] },
  blessure: { fr: ['je suis tombé de vélo', 'je me suis fait mal au genou', 'jai le bras dans le platre'], en: ['i fell off my bike', 'i hurt myself at football', 'i broke my arm lol'] },
  colere: { fr: ['je suis trop énervé', 'je suis en colère contre mon frère', 'jsuis vener'], en: ['i am so angry', 'im really annoyed today', 'im furious rn'] },
  cauchemar: { fr: ['j’ai fait un cauchemar', 'j’ai peur du noir', 'jai fai un cochemar de monstre'], en: ['i had a nightmare', 'i am scared of the dark', 'there are monsters under my bed'] },
  joie: { fr: ['je suis trop content', 'je suis heureuse aujourd’hui', 'jsui tro contente'], en: ['i am so happy today', 'i am super excited', 'im soooo happy'] },
  ennui: { fr: ['je m’ennuie', 'j’ai rien à faire', 'jmenui a mourir'], en: ['i am bored', 'i have nothing to do', 'so boring here'] },
  dents: { fr: ['j’ai perdu une dent', 'je vais chez le dentiste demain', 'la petite souri est passé'], en: ['i lost a tooth', 'i have to go to the dentist', 'i got braces lol'] },
  sommeil: { fr: ['j’ai trop sommeil', 'je suis fatigué', 'jai pas dormi de la nuit'], en: ['i am so tired', 'i don’t want to go to bed', 'i need a nap'] },
  puni: { fr: ['je suis puni', 'ma mère m’a grondé', 'jsui privé de tablete'], en: ['i got grounded', 'i was punished today', 'im in trouble with my mum'] },
  demenagement: { fr: ['on déménage la semaine prochaine', 'je vais aller dans une nouvelle école', 'on a demenager'], en: ['we are moving house', 'i am going to a new school', 'we moved last week'] },
  petitfrere: { fr: ['mon petit frère m’embête', 'ma grande sœur est méchante', 'jai une petite soeur bebe'], en: ['my little brother is annoying', 'my big sister took my toy', 'we have a new baby'] },
  grandsparents: { fr: ['je vais chez ma mamie', 'mon papi fait des gâteaux', 'mes grand parents habitent loin'], en: ['i am going to my grandma', 'my grandpa makes pancakes', 'my granny is so nice'] },
  copains: { fr: ['ma meilleure amie s’appelle Léa', 'je joue avec mes copains', 'mon meilleur pote est trop fort au foot'], en: ['my best friend is called Sam', 'i play with my friends after school', 'my bff is coming over'] },
  argentpoche: { fr: ['j’ai de l’argent de poche', 'je mets mes sous dans ma tirelire', 'jai 10 euros dargent de poche'], en: ['i get pocket money', 'i put coins in my piggy bank', 'i got allowance today'] },
  metier: { fr: ['quand je serai grand je serai pompier', 'plus tard je veux être vétérinaire', 'quel metier tu conseille'], en: ['when i grow up i want to be a vet', 'what job should i do', 'my dream job is chef'] },
  devoirs: { fr: ['j’ai plein de devoirs', 'je dois finir mes exercices', 'jai des devoir de francais'], en: ['i have so much homework', 'i need to finish my homework', 'my hw is too hard'] },
  notes: { fr: ['j’ai un contrôle demain', 'j’ai eu une mauvaise note', 'jai eu 18 sur 20 en dictée'], en: ['i have a test tomorrow', 'i got good grades', 'i failed my spelling test'] },
  maths: { fr: ['je déteste les maths', 'j’apprends mes tables de multiplication', 'les fraction cest dur'], en: ['i hate maths', 'i am learning my times tables', 'fractions r so hard'] },
  prof: { fr: ['ma maîtresse est gentille', 'mon prof est trop sévère', 'la maitress a crié'], en: ['my teacher is nice', 'my teacher gave us a test', 'our teacher yelled at us'] },
  recre: { fr: ['à la récré on joue au loup', 'la récréation est trop courte', 'a la recre jai gagné'], en: ['at recess we play football', 'break time is too short', 'i won at the playground'] },
  cantine: { fr: ['à la cantine il y avait des frites', 'la cantine c’est pas bon', 'a la cantoche ya des epinard'], en: ['school lunch was gross today', 'we had chips at the canteen', 'the cafeteria food is yuck'] },
  lecture: { fr: ['je lis un livre de dragons', 'j’adore les mangas', 'je li une bd'], en: ['i am reading a book', 'i love comics', 'i read a book about wolves'] },
  sciences: { fr: ['on a fait une expérience de sciences', 'j’adore la chimie', 'en svt on a vu les plantes'], en: ['we did a science experiment', 'i love science', 'i want to be a scientist'] },
  art: { fr: ['j’aime dessiner', 'j’ai fait une peinture', 'je desine des chevaux'], en: ['i like to draw', 'i did a painting today', 'i love colouring'] },
  youtube: { fr: ['je regarde des vidéos YouTube', 'je veux devenir youtubeur', 'je regarde des streamers sur twitch'], en: ['i watch youtube every day', 'i want to be a youtuber', 'my fav streamer is so funny'] },
  telephone: { fr: ['j’ai eu un téléphone', 'ma tablette est cassée', 'jai un nouveau telefone'], en: ['i got a new phone', 'my tablet is broken', 'can i get a iphone'] },
  tele: { fr: ['je regarde la télé', 'il y a rien à la télévision', 'jregarde la tv'], en: ['i am watching tv', 'nothing good on the telly', 'i watch tv all day'] },
  console: { fr: ['j’ai eu une switch', 'je joue à la ps5', 'jai une xbox'], en: ['i got a switch', 'i play on my ps5', 'my xbox is broken'] },
  jeuvideo: { fr: ['tu connais minecraft', 'je joue a fortnite tout le temps', 'jadore roblox'], en: ['do u know minecraft', 'i play fortnite every day', 'roblox is so fun'] },
  jeucourse: { fr: ['je joue à mario kart', 'j’adore les jeux de course', 'je joue a des jeu de voiture'], en: ['i play mario kart', 'i love racing games', 'i play car games all day'] },
  pokemon: { fr: ['j’adore les pokémon', 'j’ai une carte pikachu', 'jai plein de carte pokemon'], en: ['i love pokemon', 'i got a charizard card', 'pikachu is my fav'] },
  superpouvoir: { fr: ['si j’avais un super pouvoir', 'j’adore spiderman', 'les super heros cest trop bien'], en: ['if i had a superpower', 'i love spiderman', 'batman is the best'] },
  magie: { fr: ['j’adore la magie', 'les licornes c’est trop beau', 'je veu etre un sorcier'], en: ['i love magic', 'unicorns are the best', 'i want to be a wizzard like harry potter'] },
  chevaliers: { fr: ['j’aime les chevaliers', 'je veux être une princesse', 'jai construit un chateau fort'], en: ['i love knights', 'i want to be a princess', 'i saw a big castle'] },
  dinosaures: { fr: ['j’adore les dinosaures', 'le t-rex c’est le plus fort', 'les dinausores sont trop bien'], en: ['i love dinosaurs', 't rex is the best', 'dinos are sooo cool'] },
  espace: { fr: ['j’adore l’espace', 'je veux aller sur la lune', 'les planete c trop bien'], en: ['i love space', 'i want to be an astronaut', 'aliens r real?'] },
  lego: { fr: ['je construis des lego', 'j’ai fait un vaisseau en lego', 'jadore les playmobil'], en: ['i build lego', 'i made a lego car', 'i love building bricks'] },
  jouets: { fr: ['j’ai un doudou lapin', 'j’ai eu des nouveaux jouets', 'ma peluche sapelle nounours'], en: ['i have a teddy bear', 'i got new toys', 'i sleep with my plushie'] },
  trottinette: { fr: ['j’ai une trottinette', 'je fais du roller', 'jai fait de la trotinete'], en: ['i got a scooter', 'i go rollerblading', 'i can do tricks on my skateboard'] },
  velo: { fr: ['j’ai un nouveau vélo', 'j’ai enlevé les petites roues', 'je fai du velo'], en: ['i got a new bike', 'i rode my bicycle', 'i learnt to ride a bike'] },
  piscine: { fr: ['je vais à la piscine', 'j’ai sauté du plongeoir', 'jsui allé a la picine'], en: ['i went to the pool', 'i jumped off the diving board', 'water slides r the best'] },
  plage: { fr: ['je vais à la plage', 'j’ai fait un château de sable', 'on va a la mer'], en: ['i went to the beach', 'i made a sandcastle', 'the sea was so cold'] },
  neige: { fr: ['il neige', 'j’ai fait un bonhomme de neige', 'on a fait de la luge'], en: ['it is snowing', 'i made a snowman', 'we went sledging'] },
  chaleur: { fr: ['il fait trop chaud', 'c’est la canicule', 'il fai tro chaud'], en: ['it is so hot today', 'there is a heatwave', 'its too hot'] },
  froid: { fr: ['il fait trop froid', 'je gèle', 'il fai froid ojourdui'], en: ['it is so cold', 'i am freezing', 'its too cold outside'] },
  orage: { fr: ['il y a de l’orage', 'j’ai peur du tonnerre', 'ya une tempete'], en: ['there is a storm', 'i heard thunder', 'there was lightning last night'] },
  glace: { fr: ['j’ai mangé une glace', 'j’adore les glaces au chocolat', 'jveu une glasse'], en: ['i had ice cream', 'i love ice cream', 'i want icecream'] },
  petitdej: { fr: ['j’ai mangé des céréales', 'c’est l’heure du goûter', 'au petit dej jai mangé des tartine'], en: ['i had cereal for breakfast', 'i love breakfast', 'i ate toast this morning'] },
  boisson: { fr: ['j’ai bu un coca', 'j’ai soif', 'je bois du jus dorange'], en: ['i drank a coke', 'i am thirsty', 'i love hot chocolate'] },
  halloween: { fr: ['bientôt halloween', 'je me déguise en vampire', 'jai creusé une citrouille'], en: ['halloween is coming', 'my costume is a ghost', 'we carved pumpkins'] },
  bonbons: { fr: ['j’adore les bonbons', 'j’ai mangé du chocolat', 'jai plein de bombons'], en: ['i love candy', 'i ate chocolate', 'i got sweets from my nan'] },
  legumes: { fr: ['je déteste les légumes', 'j’aime pas les épinards', 'jaime les fraise'], en: ['i hate vegetables', 'i don’t like broccoli', 'i love strawberries'] },
  fastfood: { fr: ['on va au mcdo', 'j’ai mangé au restaurant', 'jadore le macdo'], en: ['we went to mcdonalds', 'i love fast food', 'we ate at a restaurant'] },
  anniversaire: { fr: ['c’est mon anniversaire', 'j’ai eu plein de cadeaux', 'cest mon aniversaire demain'], en: ['it is my birthday', 'i got lots of presents', 'my bday is tomorrow'] },
  noel: { fr: ['vivement noël', 'j’ai écrit au père noël', 'on a fait le sapin'], en: ['i love christmas', 'i wrote to santa', 'xmas is coming'] },
  zoo: { fr: ['je suis allé au zoo', 'j’adore les lions', 'jai vu des girafe'], en: ['i went to the zoo', 'i love sharks', 'i saw a pandas'] },
  insectes: { fr: ['j’ai peur des araignées', 'j’ai trouvé une coccinelle', 'ya des fourmis partout'], en: ['i am scared of spiders', 'i found a ladybird', 'i saw a butterfly'] },
  camping: { fr: ['on part en camping', 'on a fait une cabane dans la forêt', 'on dort dans une tente'], en: ['we are going camping', 'we built a treehouse', 'we went hiking in the mountains'] },
  ville: { fr: ['j’habite en ville', 'je suis allé à Paris', 'on habite dans un immeuble'], en: ['i live in a big city', 'i went to London', 'we live in an apartment'] },
  transports: { fr: ['j’ai pris le train', 'on a pris le bateau', 'je prend le bus pour l’école'], en: ['i took the train', 'we went on a boat', 'i take the bus to school'] },
  avion: { fr: ['j’ai pris l’avion', 'on va à l’aéroport', 'jai vu un elicoptere et un avion'], en: ['i went on a plane', 'we are at the airport', 'i saw a helicopter'] },
  voiturejour: { fr: ['la voiture de mon père est rouge', 'j’ai vu un gros camion', 'mon tonton a une moto'], en: ['my dad’s car is red', 'i saw a big truck', 'my uncle has a motorbike'] },
  pompiers: { fr: ['j’ai vu les pompiers', 'la police est passée', 'yavait une ambulance'], en: ['i saw a fire truck', 'the police came to school', 'i heard a siren'] },
  voyage: { fr: ['on part en voyage', 'j’ai fait ma valise', 'je vais a letranger'], en: ['we are going on a trip', 'i packed my suitcase', 'we travel abroad'] },
  tech: { fr: ['j’apprends à coder', 'j’ai un ordinateur', 'je fai de la programmation sur scratch'], en: ['i am learning to code', 'i got a new laptop', 'i love coding'] },
  danse: { fr: ['je fais de la danse', 'j’adore chanter', 'je dans le hip hop'], en: ['i do ballet', 'i love singing', 'i love dancing'] },
  instruments: { fr: ['je fais du piano', 'j’apprends le violon', 'je joue de la flute a lecole'], en: ['i play the piano', 'i am learning violin', 'i play the recorder at school'] },
  footstar: { fr: ['mbappé est trop fort', 'j’ai regardé la coupe du monde', 'jai marqué un penalty'], en: ['messi is the goat of football', 'i watched the world cup', 'i scored a penalty'] },
  toilettes: { fr: ['caca boudin', 'j’ai fait un prout', 'pipi caca lol'], en: ['poop', 'i farted', 'pee pee poo poo'] },
  jeuxsociete: { fr: ['on a joué au monopoly', 'j’adore les jeux de société', 'on a fait un uno'], en: ['we played monopoly', 'i love board games', 'we played uno last night'] },
  jeuxrecre: { fr: ['on a joué à cache-cache', 'je joue aux billes', 'on a fait un 1 2 3 soleil'], en: ['we played hide and seek', 'i play marbles', 'we did jump rope'] },
};
const THTXT = c => TEXTES[LANGUE][c] || [];
// une réponse qui vient d'un modèle à trous (« {x} ! J'y joue… ») : chaque morceau fixe s'y retrouve, dans l'ordre
const selonModele = (texte, m) => { let i = 0; for (const b of m.split(/\{\w+\}/)) { if (!b) continue; const j = texte.indexOf(b, i); if (j < 0) return false; i = j + b.length; } return true; };
const parleDe = (texte, id) => ['bav_th_' + id, 'bav_moi_' + id, 'bav_th_dur', 'bav_note_basse', 'bav_note_moyenne', 'bav_note_haute'].some(c => THTXT(c).some(m => selonModele(texte, m)));
const thDe = r => r && r.sujet && r.sujet.startsWith('th_') ? r.sujet.slice(3) : null;
t('thèmes : au moins 60 thèmes de tous les jours, chacun avec 3 réactions et (s’il n’est pas sensible) 2 ponts vers la course, dans les deux langues', () => {
  const ids = BAVARDAGE.THEMES;
  v(ids.length >= 60, ids.length + ' thèmes');
  const mal = ids.filter(id => THTXT('bav_th_' + id).length < 3 || (!BAVARDAGE.SENSIBLES.includes(id) && THTXT('bav_pont_' + id).length < 2) || !TH_PHRASES[id]);
  v(!mal.length, mal.join(', '));
  L.push('  (' + ids.length + ' thèmes, dont ' + BAVARDAGE.SENSIBLES.length + ' sensibles sans pont : ' + BAVARDAGE.SENSIBLES.join(', ') + ')');
});
t('thèmes : chaque thème est reconnu sous ses 3 tournures d’enfant (' + LANGUE + ', fautes et SMS compris) et la réponse en parle', () => {
  const mal = [];
  let n = 0;
  for (const id of BAVARDAGE.THEMES) for (const ph of TH_PHRASES[id][LANGUE]) {
    n++;
    const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
    const r = DISCUSSION.dire(ch, k, ph);
    const parle = r && parleDe(r.texte, id);
    if (!r || r.reaction !== 'bavardage' || thDe(r) !== id || !parle || TROU.test(r.texte)) mal.push('« ' + ph + ' » (' + id + ') → ' + (r ? r.reaction + '/' + r.sujet + ' : ' + r.texte : 'rien'));
  }
  v(!mal.length, mal.length + ' / ' + n + ' : ' + mal.join(' ; '));
});
t('thèmes : un thème sensible (tristesse, harcèlement, deuil…) ne fait jamais de pont vers la course, et invite à parler à un adulte quand il le faut', () => {
  for (const id of BAVARDAGE.SENSIBLES) for (const ph of TH_PHRASES[id][LANGUE]) {
    const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
    for (let i = 0; i < 3; i++) { const r = DISCUSSION.dire(ch, k, ph); v(!r.pont, ph + ' → ' + r.texte); }
  }
  v(THTXT('bav_th_harcelement').every(x => /adulte|adult|grown-up/.test(x)), 'harcèlement : un adulte');
});
// une longue conversation hors course : des thèmes variés, parfois relancés
const LONGUE = {
  fr: ['slt', 'jadore les dinosaures', 'le t-rex cest le meilleur', 'jai un controle de maths demain', 'il neige chez moi', 'on a fait un bonhomme de neige', 'jai mangé une glace', 'je regarde des videos youtube', 'jai une nouvelle trottinette',
    'ma maitresse est gentille', 'on part en camping', 'jadore les pokemon', 'je fais du piano', 'mon petit frere mennerve', 'il fait trop chaud', 'je joue a mario kart', 'jai un doudou', 'on va a la plage', 'je lis un manga', 'jai pris lavion',
    'jadore la magie', 'les licornes cest trop beau', 'je fais de la danse', 'jai des devoirs', 'ma mamie fait des gateaux', 'on a fait un uno', 'jai vu les pompiers', 'je construis des lego', 'cest bientot noel', 'jai perdu une dent',
    'je suis trop content', 'jai vu un lion au zoo', 'jai soif', 'je mennuie', 'mbappe est trop fort', 'jai une switch', 'on a joué a cache cache', 'jai fait un dessin', 'jai un nouveau velo', 'il y a de lorage'],
  en: ['hi', 'i love dinosaurs', 't rex is the best', 'i have a maths test tomorrow', 'its snowing here', 'i made a snowman', 'i had ice cream', 'i watch youtube', 'i got a new scooter',
    'my teacher is nice', 'we are going camping', 'i love pokemon', 'i play the piano', 'my little brother is annoying', 'its so hot today', 'i play mario kart', 'i have a teddy', 'we went to the beach', 'i am reading a comic', 'i went on a plane',
    'i love magic', 'unicorns are so pretty', 'i love dancing', 'i have homework', 'my grandma makes cakes', 'we played uno', 'i saw a fire truck', 'i build lego', 'christmas is coming', 'i lost a tooth',
    'i am so happy', 'i saw a lion at the zoo', 'i am thirsty', 'i am bored', 'messi is the goat', 'i got a switch', 'we played hide and seek', 'i did a painting', 'i got a new bike', 'there is a storm'],
};
t('thèmes : une longue conversation hors course (' + LONGUE[LANGUE].length + ' messages) : environ 1 réponse sur 2 ou 3 fait un pont vers la course, jamais deux ponts identiques de suite, jamais deux réponses de suite identiques', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const rs = LONGUE[LANGUE].map(ph => [ph, DISCUSSION.dire(ch, k, ph)]);
  const themes = rs.filter(([, r]) => thDe(r)), ponts = themes.filter(([, r]) => r.pont).map(([, r]) => r.pont);
  const part = ponts.length / themes.length;
  L.push('  (longue conversation ' + LANGUE + ' : ' + ponts.length + ' ponts sur ' + themes.length + ' réponses de thème, ' + Math.round(part * 100) + ' % ; ex. « ' + rs[1][0] + ' » → « ' + rs[1][1].texte + ' »)');
  v(themes.length >= rs.length - 3, 'réponses de thème : ' + themes.length + ' / ' + rs.length + ' : ' + rs.filter(([, r]) => !thDe(r)).map(([ph, r]) => ph + ' → ' + r.reaction + '/' + r.sujet).join(' ; '));
  v(part >= 0.28 && part <= 0.55, 'part des ponts : ' + part.toFixed(2));
  const dbl = ponts.filter((p, i) => i && p === ponts[i - 1]);
  v(!dbl.length, 'deux ponts identiques de suite : ' + dbl.join(' | '));
  const suite = rs.filter(([, r], i) => i && r.pont && rs[i - 1][1].pont).map(([ph]) => ph);
  v(!suite.length, 'deux réponses de suite avec un pont : ' + suite.join(' ; '));
  const rep = rs.filter(([, r], i) => i && r.texte === rs[i - 1][1].texte).map(([ph]) => ph);
  v(!rep.length && rs.every(([, r]) => r.texte && !TROU.test(r.texte)), 'répétée ou trou : ' + rep.join(' ; '));
});
t('thèmes : relancé sur le même thème, il y reste (une autre réaction), puis il finit par ramener à la course', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const fil = LANGUE === 'fr' ? ['jadore les dinosaures', 'surtout le t-rex', 'et les diplodocus aussi', 'les dinos cest ma passion'] : ['i love dinosaurs', 'especially t rex', 'and the triceratops', 'dinos are my thing'];
  const rs = fil.map(ph => DISCUSSION.dire(ch, k, ph));
  v(rs.every(r => thDe(r) === 'dinosaures'), rs.map(r => r.sujet).join(', '));
  const debuts = rs.map(r => r.texte.slice(0, 24));
  v(new Set(debuts).size === debuts.length, 'des réactions différentes : ' + rs.map(r => r.texte).join(' | '));
  v(rs.some(r => r.pont), 'un pont vers la course sur 4 messages : ' + rs.map(r => r.texte).join(' | '));
  L.push('  (relancé : ' + fil.map((ph, i) => '« ' + ph + ' » → « ' + rs[i].texte + ' »').join(' ; ') + ')');
});
t('thèmes : après un pont, sa question sur la course attend la réponse (oui, non, ou un mot repris)', () => {
  let vu = 0;
  for (let s = 0; s < 12 && vu < 3; s++) {
    const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch); ch.graine = (ch.graine || 0) + s * 977;
    const r = DISCUSSION.dire(ch, k, LANGUE === 'fr' ? 'jadore les dinosaures' : 'i love dinosaurs');
    if (!r.pont || ch.pilotes[k].memoire.bav.attente !== 'f1') continue;
    vu++;
    const rep = [LANGUE === 'fr' ? 'oui' : 'yes', LANGUE === 'fr' ? 'non' : 'no', LANGUE === 'fr' ? 'la pluie' : 'the rain'][vu - 1];
    const r2 = DISCUSSION.dire(ch, k, rep);
    const cles = ['bav_j_f1_oui', 'bav_j_f1_non', 'bav_j_f1_x'][vu - 1];
    v(r2.reaction === 'bavardage' && THTXT(cles).some(x => r2.texte.startsWith(x.split('{x}')[0]) || r2.texte.includes(x.split('{x}')[1] || '§')), rep + ' → ' + r2.texte);
  }
  v(vu >= 2, 'questions sur la course vues : ' + vu);
});
// 30 phrases au hasard, que rien ne range : aucune réponse vide, aucune répétée, un mot repris quand il y en a un
const HASARD = {
  fr: ['zorglub patate', 'ma tante a un trampoline', 'le chat de ma tante est bleu', 'banane volante', 'asdfghjk', 'tu connais Gégé ?', 'hier jai vu un truc bizarre', 'la tour eiffel', 'mon voisin fait du bruit', 'qwerty', 'cest quoi un ornithorynque',
    'jai trouvé un caillou', 'les chaussettes sentent mauvais', 'mon cousin habite à Marseille', 'blabla', 'les escargots ça bave', 'tu connais le yoyo ?', 'ma lampe clignote', 'jai un parapluie jaune', 'le frigo fait du bruit',
    'jai perdu ma gomme', 'les nuages ressemblent à des moutons', 'xptdrrr', 'mon tonton a une barbe', 'cest quoi la photosynthèse ?', 'jai mis mes baskets', 'la boulangère est sympa', 'patati patata', 'tu aimes les cornichons ?', 'jai vu un arc en ciel'],
  en: ['zorglub potato', 'my aunt has a trampoline', 'my aunt’s cat is blue', 'flying banana', 'asdfghjk', 'do you know Kevin?', 'yesterday i saw something weird', 'the eiffel tower', 'my neighbour is noisy', 'qwerty', 'what is a platypus',
    'i found a pebble', 'socks smell bad', 'my cousin lives in Manchester', 'blabla', 'snails are slimy', 'do you know the yoyo?', 'my lamp keeps flickering', 'i have a yellow umbrella', 'the fridge is making noise',
    'i lost my rubber', 'clouds look like sheep', 'xptdrrr', 'my uncle has a beard', 'what is photosynthesis?', 'i put my trainers on', 'the baker is nice', 'blah blah blah', 'do you like pickles?', 'i saw a rainbow'],
};
t('thèmes : 30 phrases au hasard (' + LANGUE + ') : aucune réponse vide ni répétée, jamais « je ne comprends pas », un mot de la phrase repris le plus souvent', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const inc = TEXTES[LANGUE].dis_incompris.concat(TEXTES[LANGUE].dis_incompris_encore || [], TEXTES[LANGUE].dis_question || []);
  const rs = HASARD[LANGUE].map(ph => [ph, DISCUSSION.dire(ch, k, ph)]);
  const vides = rs.filter(([, r]) => !r || !r.texte || TROU.test(r.texte)).map(([ph]) => ph);
  v(!vides.length, 'vide : ' + vides.join(' ; '));
  const textes = rs.map(([, r]) => r.texte), dbl = textes.filter((x, i) => textes.indexOf(x) !== i);
  v(!dbl.length, 'répétée : ' + dbl.join(' | '));
  const robot = rs.filter(([, r]) => inc.some(i => r.texte.startsWith(i.replace(/\{\w+\}/g, '').slice(0, 14)))).map(([ph, r]) => ph + ' → ' + r.texte);
  v(!robot.length, 'je ne comprends pas : ' + robot.join(' ; '));
  const repris = rs.filter(([ph, r]) => { const m = BAVARDAGE.motRepris(ph); return m && r.texte.toLowerCase().includes(m.toLowerCase()); }).length;
  v(repris >= 18, 'mots repris : ' + repris + ' / 30');
  L.push('  (30 phrases au hasard ' + LANGUE + ', ' + repris + ' mots repris ; ex. ' + rs.map(([ph, r]) => '« ' + ph + ' » → « ' + r.texte + ' »').join(' ; ') + ')');
});
t('thèmes : ce qui touche la course et les sujets précis d’avant ne changent pas de main (contact, insulte, laisser passer ; l’âge, l’animal, le circuit)', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  for (const [ph, acte] of [['pourquoi tu m’as percuté ?', 'CONTACT'], ['laisse moi passer stp', 'PASSER'], ['t es nul', 'INSULTE']]) {
    const r = DISCUSSION.dire(ch, k, ph); v(r.reaction !== 'bavardage' && r.analyse.acte === acte, ph + ' → ' + r.reaction);
  }
  for (const [ph, s] of LANGUE === 'fr' ? [['t’as quel âge ?', 'age'], ['t’as un animal ?', 'animal'], ['c’est quoi ton circuit préféré ?', 'circuitfav'], ['tu aimes le foot ?', 'sport']] : [['how old are you?', 'age'], ['do you have a pet?', 'animal'], ['favourite track?', 'circuitfav'], ['do you like football?', 'sport']]) {
    const c2 = nouveau(), k2 = rival(c2, 0.4); gpCouru(c2);
    const r = DISCUSSION.dire(c2, k2, ph); v(r.sujet === s, ph + ' → ' + r.sujet);
  }
});
// trois conversations d'enfant hors course (tour 60), imprimées dans la sortie et relues à la main
const TH_ENFANTS = {
  fr: [
    ['slt', 'jai eu un controle de math', 'jai eu 7', 'cest dur les fraction', 'oui', 'et toi t etais fort a lecole ?', 'jaime pas la maitresse', 'elle crie tout le temps', 'a la recre on joue au foot', 'mdr',
      'demain cest mercredi jvai a la piscine', 'jsais sauter du plongeoir', 'tu sais nager ?', 'trop bien', 'ok bye'],
    ['coucou', 'tu aimes les dinosaures ?', 'moi mon prefere cest le t rex', 'parce que il est trop fort', 'tu as vu jurassic park', 'jai peur des fois la nuit', 'jai fai un cochemar de monstre', 'ma maman ma fait un calin', 'cest quoi ton doudou',
      'jai un lapin en peluche', 'il sappelle pompon', 'jai trop sommeil', 'bonne nuit'],
    ['yo', 'il neige trop chez moi', 'jai fait un bonhomme de neige', 'avec une carotte', 'apres on a bu un chocolat chaud', 'tu fais quoi a noel', 'jai demandé une switch au pere noel', 'jsui tro contente', 'et toi tu veux quoi comme cadeau',
      'zorglub', 'mdrrr cest un mot inventé', 'tu connais minecraft', 'jai construit une maison', 'a plus'],
  ],
  en: [
    ['hey', 'i had a maths test today', 'i got 7 out of 10', 'fractions r so hard', 'yes', 'were u good at school?', 'my teacher is mean', 'she yells all the time', 'at break we play football', 'lol',
      'tomorrow i go to the pool', 'i can jump off the diving board', 'can u swim?', 'cool', 'ok bye'],
    ['hi', 'do u like dinosaurs?', 'my fav is t rex', 'because hes so strong', 'have u seen jurassic park', 'i get scared at night sometimes', 'i had a nightmare about monsters', 'my mum gave me a hug', 'do u have a teddy',
      'i have a bunny plushie', 'its called fluffy', 'im so tired', 'good night'],
    ['yo', 'its snowing so much here', 'i made a snowman', 'with a carrot nose', 'then we had hot chocolate', 'what do u do for christmas', 'i asked santa for a switch', 'im so happy', 'what do u want for a present',
      'zorglub', 'lmao its a made up word', 'do u know minecraft', 'i built a house', 'see ya'],
  ],
};
TH_ENFANTS[LANGUE].forEach((fil, n) => t('thèmes : conversation d’enfant hors course ' + (n + 1) + ' (' + LANGUE + ', ' + fil.length + ' messages) : jamais « je ne comprends pas », jamais deux fois de suite la même réponse, pas de trou', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const rs = fil.map(ph => [ph, DISCUSSION.dire(ch, k, ph)]);
  L.push('  TRANSCRIPTION hors course ' + (n + 1) + ' (' + LANGUE + ') :'); for (const [ph, r] of rs) L.push('    — ' + ph + '\n      → ' + r.texte + '   [' + r.reaction + (r.sujet ? '/' + r.sujet : '') + (r.pont ? ', pont' : '') + ']');
  const inc = TEXTES[LANGUE].dis_incompris.concat(TEXTES[LANGUE].dis_incompris_encore || [], TEXTES[LANGUE].dis_question || []);
  const mal = rs.filter(([, r]) => !r || !r.texte || TROU.test(r.texte) || inc.some(i => r.texte.startsWith(i.replace(/\{\w+\}/g, '').slice(0, 14)))).map(([ph, r]) => '« ' + ph + ' » → ' + (r && r.texte));
  v(!mal.length, mal.join(' ; '));
  const dbl = rs.filter(([, r], i) => i && r.texte === rs[i - 1][1].texte).map(([ph]) => ph);
  v(!dbl.length, dbl.join(' ; '));
}));

// ---- la revue du Chef (tour 60) : chaque défaut relevé dans les transcriptions a son test
const FR = LANGUE === 'fr';
const neuf = () => { const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch); return [ch, k]; };
t('revue 1 : les phrases à trou s’accordent (« en géographie », jamais « en la géographie » ; une capitale après « ? »), pour chaque pilote', () => {
  const mal = [], RE = FR ? /\b(en (la|le|les) |en l’|à (le|les) |de (le|les) |J’ai ni |il y a ni )/ : /\b(a (an?|the) )/;
  const ch = nouveau(); gpCouru(ch);
  for (const p of ch.pilotes.filter(x => !x.humain)) for (const [ph] of SUJETS_PHRASES) {
    const r = DISCUSSION.dire(ch, p.id, ph); if (!r) continue;
    if (RE.test(r.texte) || /[?!.] [a-zàâéèêîôûç]/.test(r.texte)) mal.push('« ' + ph + ' » → ' + r.texte);
  }
  v(!mal.length, mal.length + ' : ' + mal.slice(0, 6).join(' ; '));
  const [c2, k2] = neuf();
  const r = DISCUSSION.dire(c2, k2, FR ? 'et toi t etais fort a lecole ?' : 'were u good at school?');
  L.push('  (revue 1 : « ' + (FR ? 'et toi t etais fort a lecole ?' : 'were u good at school?') + ' » → « ' + r.texte + ' »)');
});
t('revue 2 : les jeux vidéo nommés (Minecraft, Fortnite, Roblox, Mario, Zelda, FIFA, Among Us…) sont reconnus, avec une vraie réponse qui les nomme', () => {
  const mal = [];
  for (const [jeu, nom] of [['minecraft', 'Minecraft'], ['mincraft', 'Minecraft'], ['fortnite', 'Fortnite'], ['roblox', 'Roblox'], ['mario', 'Mario'], ['zelda', 'Zelda'], ['fifa', 'FIFA'], ['among us', 'Among Us'], ['brawl stars', 'Brawl Stars']]) {
    const [ch, k] = neuf();
    const r = DISCUSSION.dire(ch, k, (FR ? 'tu connais ' : 'do you know ') + jeu);
    if (thDe(r) !== 'jeuvideo' || !r.texte.includes(nom) || /combien de temps|how much\./.test(r.texte)) mal.push(jeu + ' → ' + r.sujet + ' : ' + r.texte);
  }
  v(!mal.length, mal.join(' ; '));
  const [ch, k] = neuf();
  const r = DISCUSSION.dire(ch, k, FR ? 'tu joue a fortnite' : 'do u play fortnite');
  v(r.texte.includes('Fortnite'), r.texte);
});
t('revue 3 : après un jeu vidéo, « j’ai construit une maison » reste sur le jeu (« Dans Minecraft ? Moi, je construirais un circuit ! »)', () => {
  const [ch, k] = neuf();
  DISCUSSION.dire(ch, k, FR ? 'tu connais minecraft' : 'do u know minecraft');
  const r = DISCUSSION.dire(ch, k, FR ? 'jai construit une maison' : 'i built a house');
  v(thDe(r) === 'jeuvideo' && r.texte.includes('Minecraft'), r.sujet + ' : ' + r.texte);
  L.push('  (revue 3 : « ' + (FR ? 'jai construit une maison' : 'i built a house') + ' » après Minecraft → « ' + r.texte + ' »)');
});
t('revue 4 : « c’est dur les fractions » reçoit un encouragement ; « oui » à une question « A ou B ? » est relevé', () => {
  const [ch, k] = neuf();
  const r = DISCUSSION.dire(ch, k, FR ? 'cest dur les fraction' : 'fractions r so hard');
  v(THTXT('bav_th_dur').some(m => r.texte.startsWith(m)), r.texte);
  let vu = 0;
  for (let s2 = 0; s2 < 30 && vu < 2; s2++) {
    const [c2, k2] = neuf(); c2.graine = (c2.graine || 0) + s2 * 131;
    const r1 = DISCUSSION.dire(c2, k2, FR ? 'jaime les maths' : 'i like maths');
    if (!c2.pilotes[k2].memoire.bav.choix) continue;
    vu++;
    const rep = vu === 1 ? (FR ? 'oui' : 'yes') : (FR ? 'non' : 'no');
    const r2 = DISCUSSION.dire(c2, k2, rep);
    v(THTXT(vu === 1 ? 'bav_choix_oui' : 'bav_choix_non').includes(r2.texte), r1.texte + ' / ' + rep + ' → ' + r2.texte);
  }
  v(vu >= 1, 'questions « A ou B ? » vues : ' + vu);
});
t('revue 5 : une question au pilote sur un thème (« et toi, tu veux quoi comme cadeau ? ») reçoit d’abord sa réponse à lui', () => {
  const mal = [];
  for (const ph of FR ? ['et toi tu veux quoi comme cadeau', 'et toi tu aimes la neige ?', 'tu aimes les dinosaures ?', 'tu as peur des monstres ?', 'tu manges des bonbons ?', 'tu aimes la plage ?']
    : ['what do u want for a present', 'do you like snow?', 'do u like dinosaurs?', 'are you scared of monsters?', 'do you eat sweets?', 'do you like the beach?']) {
    const [ch, k] = neuf();
    const r = DISCUSSION.dire(ch, k, ph), id = thDe(r);
    const perso = id && (THTXT('bav_moi_' + id).some(m => selonModele(r.texte, m)) || THTXT('bav_th_' + id).some(m => r.texte.startsWith(m) && /^(Moi|Ma |Mon |Mes |J’|Je |Si j’|I |I’|My |Mine |As a kid|For me|At school, I|When I)/.test(m)));
    if (!perso) mal.push(ph + ' → ' + (r && r.texte));
  }
  v(!mal.length, mal.join(' ; '));
});
t('revue 6 : rester sur un thème ne fait jamais dire « Encore ? » ; seule une phrase redite mot pour mot le relève', () => {
  v(!THTXT('bav_th_encore').some(x => /^(Encore|Again)/.test(x)), 'bav_th_encore');
  const [ch, k] = neuf();
  const fil = FR ? ['jadore les dinosaures', 'surtout le t-rex', 'tu as vu jurassic park', 'les dinos cest ma passion', 'les dinos cest ma passion'] : ['i love dinosaurs', 'especially t rex', 'have u seen jurassic park', 'dinos are my thing', 'dinos are my thing'];
  const rs = fil.map(ph => DISCUSSION.dire(ch, k, ph));
  v(rs.slice(0, 4).every(r => !/^(Encore|Again)/.test(r.texte)), rs.map(r => r.texte).join(' | '));
  v(THTXT('bav_redit').includes(rs[4].texte), 'redite : ' + rs[4].texte);
});
t('revue 7 : « bonne nuit », « bonne journée », « à demain » reçoivent le bon au revoir', () => {
  for (const [ph, c] of FR ? [['bonne nuit', 'nuit'], ['bonne journée', 'jour'], ['à demain', 'demain'], ['bonne soirée !', 'jour']] : [['good night', 'nuit'], ['have a nice day', 'jour'], ['see you tomorrow', 'demain']]) {
    const [ch, k] = neuf(); DISCUSSION.dire(ch, k, FR ? 'jadore la neige' : 'i love snow');
    const r = DISCUSSION.dire(ch, k, ph);
    v(THTXT('bav_adieu_' + c).includes(r.texte), ph + ' → ' + r.texte);
  }
});
t('revue 8 : une note est comprise sur 20 ou sur 10 : réconfort si elle est basse, bravo si elle est haute', () => {
  for (const [ph, c, x] of FR ? [['jai eu 7', 'basse', '7/20'], ['j’ai eu 18 sur 20', 'haute', '18/20'], ['jai eu 12 en dictée', 'moyenne', '12/20'], ['jai eu 3/10 en maths', 'basse', '3/10'], ['jai eu 9 sur 10', 'haute', '9/10']]
    : [['i got 3 out of 10', 'basse', '3/10'], ['i got 9/10 on my test', 'haute', '9/10'], ['i got 7', 'moyenne', '7/10'], ['i got 16/20', 'haute', '16/20']]) {
    const [ch, k] = neuf();
    const r = DISCUSSION.dire(ch, k, ph);
    v(THTXT('bav_note_' + c).some(m => selonModele(r.texte, m)) && r.texte.includes(x), ph + ' → ' + r.texte);
  }
});

t('revue (suite) : pas de question sur ce que l’enfant vient de dire ; « c’était trop bien » partagé ; une histoire triste reste triste ; « avec… » continue le thème', () => {
  let [ch, k] = neuf();
  for (const ph of FR ? ['mon prefere cest le t rex', 'on a fait une bataille de boules de neige', 'le t rex il fait peur'] : ['my fav is t rex', 'we had a snowball fight', 'the t rex is scary']) {
    [ch, k] = neuf(); const r = DISCUSSION.dire(ch, k, ph); v(!/\?\s*$/.test(r.texte.split(/[.!] /)[0] + '') || r.pont, ph + ' → ' + r.texte);
    v(!/(préféré \?|favourite\?|bataille de boules \?|snowball fight\?)/.test(r.texte), ph + ' → ' + r.texte);
  }
  [ch, k] = neuf(); DISCUSSION.dire(ch, k, FR ? 'il neige trop' : 'its snowing so much');
  const r1 = DISCUSSION.dire(ch, k, FR ? 'cetait trop bien' : 'it was so fun');
  v(THTXT('bav_th_content').includes(r1.texte.split(/(?<=[.!]) (?=[A-ZÀ-Ý])/)[0]) || THTXT('bav_th_content').some(x => r1.texte.startsWith(x)), r1.texte);
  [ch, k] = neuf(); DISCUSSION.dire(ch, k, FR ? 'jsui triste' : 'im so sad');
  const r2 = DISCUSSION.dire(ch, k, FR ? 'il a cassé mon chateau' : 'he broke my castle');
  v(thDe(r2) === 'triste' && !r2.pont, r2.sujet + ' : ' + r2.texte);
  [ch, k] = neuf(); DISCUSSION.dire(ch, k, FR ? 'tu connais minecraft' : 'do u know minecraft'); DISCUSSION.dire(ch, k, FR ? 'jai construit une maison' : 'i built a house');
  const r3 = DISCUSSION.dire(ch, k, FR ? 'avec une piscine dedans' : 'with a pool inside');
  v(thDe(r3) === 'jeuvideo', r3.sujet + ' : ' + r3.texte);
  [ch, k] = neuf(); const r4 = DISCUSSION.dire(ch, k, FR ? 'ma mere ma grondé' : 'my mum told me off');
  v(thDe(r4) === 'puni', r4.sujet + ' : ' + r4.texte);
});
// trois nouvelles conversations d'enfant, jouées après la revue du Chef (imprimées et relues)
const TH_ENFANTS2 = {
  fr: [
    ['salut', 'tu connais minecraft', 'jai construit une maison', 'avec une piscine dedans', 'tu joues a fortnite toi ?', 'et zelda ?', 'jai eu 7 en maths', 'cest dur les fraction', 'tu prefere les maths ou le francais', 'oui', 'bonne nuit'],
    ['coucou', 'jai eu 18 sur 20 en dictée', 'merci', 'et toi tu veux quoi comme cadeau', 'moi un velo', 'tu as vu jurassic park', 'le t rex il fait peur', 'jadore les dinosaures', 'jadore les dinosaures', 'il fait trop froid', 'bonne journée'],
    ['yo', 'mon petit frere ma piqué mes legos', 'ma mere ma grondé', 'jsui triste', 'il a cassé mon chateau', 'tu as des freres toi ?', 'tu aimes la neige ?', 'on a fait une bataille de boules de neige', 'cetait trop bien', 'a demain'],
  ],
  en: [
    ['hi', 'do u know minecraft', 'i built a house', 'with a pool inside', 'do u play fortnite?', 'what about zelda?', 'i got 3 out of 10 in maths', 'fractions r so hard', 'do u prefer maths or english', 'yes', 'good night'],
    ['hey', 'i got 9/10 on my spelling test', 'thanks', 'what do u want for a present', 'i want a bike', 'have u seen jurassic park', 'the t rex is scary', 'i love dinosaurs', 'i love dinosaurs', 'its so cold', 'have a nice day'],
    ['yo', 'my little brother took my lego', 'my mum told me off', 'im so sad', 'he broke my castle', 'do u have brothers?', 'do u like snow?', 'we had a snowball fight', 'it was so fun', 'see you tomorrow'],
  ],
};
TH_ENFANTS2[LANGUE].forEach((fil, n) => t('revue : nouvelle conversation d’enfant ' + (n + 1) + ' (' + LANGUE + ', ' + fil.length + ' messages) : pas de réponse à côté connue, jamais deux fois de suite la même, pas de trou', () => {
  const [ch, k] = neuf();
  const rs = fil.map(ph => [ph, DISCUSSION.dire(ch, k, ph)]);
  L.push('  TRANSCRIPTION après revue ' + (n + 1) + ' (' + LANGUE + ') :'); for (const [ph, r] of rs) L.push('    — ' + ph + '\n      → ' + r.texte + '   [' + r.reaction + (r.sujet ? '/' + r.sujet : '') + (r.pont ? ', pont' : '') + ']');
  const mal = rs.filter(([, r]) => !r || !r.texte || TROU.test(r.texte) || /\ben (la|le|les) |^Encore \?|^Again\?|combien de temps\.|[?!.] [a-zàâéèêîôûç]/.test(r.texte)).map(([ph, r]) => ph + ' → ' + (r && r.texte));
  v(!mal.length, mal.join(' ; '));
  const dbl = rs.filter(([, r], i) => i && r.texte === rs[i - 1][1].texte).map(([ph]) => ph);
  v(!dbl.length, dbl.join(' ; '));
}));
// l'empreinte des réponses d'avant (BAVARDAGE_THEMES faux) : les 3 conversations d'enfant, les sujets, les phrases au hasard, les phrases
// de thèmes ; elle a été prise sur le code de main avant le tour 60 (2cd512d), avec les mêmes phrases
const TH_EMPREINTE = { fr: 'ffc4fe41:211', en: '982108b6:211' };
function thEmpreinte() {
  const fils = (typeof ENFANTS !== 'undefined' ? ENFANTS[LANGUE] : []).concat([SUJETS_PHRASES.map(x => x[0]), HASARD[LANGUE], LONGUE[LANGUE]]);
  let h = 5381; const tout = [];
  for (const fil of fils) {
    const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
    for (const ph of fil) { const r = DISCUSSION.dire(ch, k, ph); const s = (r ? r.reaction + '|' + r.texte : '-'); tout.push(s); }
  }
  const s = tout.join('\n'); for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16) + ':' + tout.length;
}
t('thèmes : BAVARDAGE_THEMES faux = les réponses d’avant au mot près (empreinte de ' + LANGUE + ' prise sur main avant le tour 60)', () => {
  const avant = R.BAVARDAGE_THEMES; R.BAVARDAGE_THEMES = false;
  let e; try { e = thEmpreinte(); } finally { R.BAVARDAGE_THEMES = avant; }
  L.push('  (empreinte sans les thèmes, ' + LANGUE + ' : ' + e + ')');
  v(e === TH_EMPREINTE[LANGUE], e + ' au lieu de ' + TH_EMPREINTE[LANGUE]);
});
ecrire();
