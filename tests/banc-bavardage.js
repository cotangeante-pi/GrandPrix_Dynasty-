// Le bavardage avec les pilotes (tour 58, bavardage.js) : la vie de chaque pilote, les sujets de tous les jours en français et en
// anglais, les questions en retour et leurs suites, la mémoire de ce que le joueur dit de lui, une longue conversation sans
// « je ne comprends pas » ni répétition, et ce qui touche la course qui reste à discussion.js comme avant.
// Chargé par tests/banc-parle.html après banc-parle-conversation.js (il reprend nouveau, rival, gpCouru, t, v, L).
const TROU = /\{\w+\}|undefined|null|NaN/;
const dire = (ch, k, ph) => DISCUSSION.dire(ch, k, ph);
t('bavardage : chaque pilote a sa vie, la même à chaque fois, et deux pilotes ne se ressemblent pas tous', () => {
  const ch = nouveau(), vies = ch.pilotes.filter(p => !p.humain).map(p => JSON.stringify(BAVARDAGE.persona(ch, p)));
  v(JSON.stringify(BAVARDAGE.persona(ch, ch.pilotes[1])) === vies[0] || vies.includes(JSON.stringify(BAVARDAGE.persona(ch, ch.pilotes[1]))), 'la même vie');
  v(new Set(vies).size >= vies.length - 2, 'des vies différentes : ' + new Set(vies).size + ' / ' + vies.length);
  const p = BAVARDAGE.persona(ch, ch.pilotes[1]);
  v(p.hobby !== p.hobby2 && p.circuitFav !== p.circuitDur && R.CALENDRIER_CIRCUITS.includes(p.circuitFav), JSON.stringify(p));
});
t('bavardage : les listes de la vie ont la même longueur en français et en anglais', () => {
  const m = Object.keys(TEXTES.fr).filter(c => c.startsWith('bav_l_') && (TEXTES.fr[c].length !== TEXTES.en[c].length));
  v(!m.length, m.join(', '));
});
// chaque sujet, en français et en anglais : la question au pilote reçoit une réponse de bavardage, sans trou
const SUJETS_PHRASES = [
  ['t’as quel âge ?', 'age'], ['how old are you?', 'age'], ['tu as des frères et sœurs ?', 'famille'], ['do you have siblings?', 'famille'],
  ['t’as un animal ?', 'animal'], ['do you have a pet?', 'animal'], ['tu fais quoi à part la course ?', 'hobby'], ['what do you do for fun?', 'hobby'],
  ['tu fais du sport ?', 'sport'], ['do you play any sport?', 'sport'], ['c’est quoi ton plat préféré ?', 'plat'], ['what’s your favourite food?', 'plat'],
  ['ta couleur préférée ?', 'couleur'], ['favorite color?', 'couleur'], ['tu écoutes quoi comme musique ?', 'musique'], ['what music do you listen to?', 'musique'],
  ['tu regardes quels films ?', 'film'], ['what movies do you like?', 'film'], ['tu joues aux jeux vidéo ?', 'jeu'], ['do you play video games?', 'jeu'],
  ['tu aimais l’école ?', 'ecole'], ['did you like school?', 'ecole'], ['tu viens d’où ?', 'origine'], ['where are you from?', 'origine'],
  ['comment tu as commencé ?', 'debut'], ['how did you start?', 'debut'], ['c’est quoi ton rêve ?', 'reve'], ['what’s your dream?', 'reve'],
  ['t’as peur de quoi ?', 'peur'], ['what are you afraid of?', 'peur'], ['c’est qui ton idole ?', 'idole'], ['who is your idol?', 'idole'],
  ['t’es superstitieux ?', 'superstition'], ['any lucky charm?', 'superstition'], ['raconte-moi une blague', 'blague'], ['tell me a joke', 'blague'],
  ['dis-moi un secret', 'secret'], ['tell me a secret', 'secret'], ['tu fais quoi là ?', 'faire'], ['what are you doing?', 'faire'],
  ['tu fais quoi ce week-end ?', 'weekend'], ['plans for the weekend?', 'weekend'], ['c’est quoi ton circuit préféré ?', 'circuitfav'], ['favourite track?', 'circuitfav'],
  ['ta meilleure course ?', 'souvenir'], ['your best race?', 'souvenir'], ['ton pire souvenir ?', 'pire'], ['worst race ever?', 'pire'],
  ['tu penses gagner la prochaine course ?', 'pronostic'], ['will you win the next race?', 'pronostic'], ['qui est premier au championnat ?', 'champion'], ['who is leading the championship?', 'champion'],
  ['tu aimes ton écurie ?', 'ecurie'], ['do you like your team?', 'ecurie'], ['elle est bien ta voiture ?', 'voiture'], ['is your car good?', 'voiture'],
  ['un conseil pour freiner ?', 'conseil'], ['any tips to overtake?', 'conseil'], ['t’aimes la pluie ?', 'pluie'], ['do you like the rain?', 'pluie'],
  ['t’es un robot ?', 'bot'], ['are you a bot?', 'bot'], ['comment tu t’appelles ?', 'nom'], ['what’s your name?', 'nom'],
  ['tu as une copine ?', 'amour'], ['do you have a girlfriend?', 'amour'], ['tu gagnes combien ?', 'argent'], ['are you rich?', 'argent'],
  ['on est amis ?', 'ami'], ['are we friends?', 'ami'],
];
t('bavardage : chaque sujet de tous les jours (' + SUJETS_PHRASES.length + ' phrases, fr et en) est compris et reçoit une vraie réponse, sans trou', () => {
  const mal = [];
  for (const [ph, s] of SUJETS_PHRASES) {
    const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
    const r = dire(ch, k, ph);
    if (!r || r.reaction !== 'bavardage' || r.sujet !== s || !r.texte || TROU.test(r.texte)) mal.push('« ' + ph + ' » → ' + (r ? r.reaction + '/' + r.sujet + ' : ' + r.texte : 'rien'));
  }
  v(!mal.length, mal.join(' ; '));
});
t('bavardage : il pose une question en retour et comprend la suite (oui → le nom de l’animal → il s’en souvient au Grand Prix suivant)', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const b = () => ch.pilotes[k].memoire.bav;
  dire(ch, k, 'tu as un animal ?');
  b().attente = 'animal';   // (la question en retour est tirée au hasard : on la pose ici)
  const r1 = dire(ch, k, 'oui');
  v(r1.reaction === 'bavardage' && b().attente === 'animalnom', JSON.stringify(r1));
  const r2 = dire(ch, k, 'Rex');
  v(r2.texte.includes('Rex') && b().j.animalNom === 'Rex', r2.texte);
  gpCouru(ch);
  const r3 = dire(ch, k, 'salut');
  v(r3.texte.includes('Rex'), 'le rappel au salut : ' + r3.texte);
  const r4 = dire(ch, k, 'mon chat s’appelle Mimi');
  v(b().j.animalNom === 'Mimi' && r4.texte.includes('Mimi'), r4.texte);
});
t('bavardage : « et toi ? », « pourquoi ? », « ah bon ? », « lol » suivent le fil (jamais « je ne comprends pas »)', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const incompris = TEXTES[LANGUE].dis_incompris.concat(TEXTES[LANGUE].dis_question || []);
  const fil = ['c’est quoi ta couleur préférée ?', 'pourquoi ?', 'moi c’est le bleu', 'ah bon', 'lol', 'j’ai 11 ans, et toi ?', 'tu fais du sport ?', 'non', 'et toi ?'];
  const r = fil.map(ph => [ph, dire(ch, k, ph)]);
  const mal = r.filter(([ph, x]) => x.reaction !== 'bavardage' || incompris.some(i => x.texte.startsWith(i.slice(0, 12)))).map(([ph, x]) => '« ' + ph + ' » → ' + x.reaction + ' : ' + x.texte);
  v(!mal.length, mal.join(' ; '));
  v(ch.pilotes[k].memoire.bav.j.age === 11, 'l’âge retenu');
  v(r[5][1].texte.includes(String(ch.pilotes[k].age)), 'il dit son âge après « et toi ? » : ' + r[5][1].texte);
});
t('bavardage : une conversation de 25 messages, en français puis en anglais, sans réponse répétée ni trou', () => {
  for (const fil of [
    ['salut', 'ça va ?', 'tu fais quoi ce week-end ?', 't’as quel âge ?', 'j’ai 12 ans', 'tu as un animal ?', 'oui j’ai un chien', 'Rex', 'tu fais quoi à part la course ?', 'moi j’adore le foot', 'tu penses gagner à la prochaine course ?',
      'un conseil pour le départ ?', 'raconte une blague', 'lol', 'ton plat préféré ?', 'miam', 'tu viens d’où ?', 'c’est qui ton idole ?', 'ah bon', 't’as peur de quoi ?', 'pourquoi ?', 'qui est premier au championnat ?', 'tu aimes ton écurie ?', 'ta voiture est bien ?', 'à plus'],
    ['hi', 'how are you?', 'plans for the weekend?', 'how old are you?', 'i am 14', 'do you have a pet?', 'yes i have a cat', 'Luna', 'what do you do for fun?', 'i love basketball', 'will you win the next race?',
      'any tips for the start?', 'tell me a joke', 'lol', 'favourite food?', 'yum', 'where are you from?', 'who is your idol?', 'really?', 'what are you afraid of?', 'why?', 'who is leading the championship?', 'do you like your team?', 'is your car good?', 'bye']]) {
    const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
    const textes = fil.map(ph => dire(ch, k, ph).texte);
    v(textes.every(x => x && !TROU.test(x)), 'un trou : ' + textes.filter(x => !x || TROU.test(x)).join(' | '));
    const doubles = textes.filter((x, i) => textes.indexOf(x) !== i);
    v(!doubles.length, 'répétée : ' + doubles.join(' | '));
    if (fil[0] === 'salut') L.push('  (exemple : ' + fil.slice(0, 8).map((ph, i) => '« ' + ph + ' » → « ' + textes[i] + ' »').join(' ; ') + ')');
  }
});
t('bavardage : ce qui touche la course reste à discussion.js (contact, excuse, laisser passer, insulte), avec ses effets', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  for (const [ph, acte] of [['pourquoi tu m’as percuté ?', 'CONTACT'], ['désolé pour le contact', 'EXCUSE'], ['laisse moi passer stp', 'PASSER'], ['t es nul', 'INSULTE']]) {
    const r = dire(ch, k, ph);
    v(r.reaction !== 'bavardage' && r.analyse.acte === acte, ph + ' → ' + r.reaction + ' / ' + r.analyse.acte);
  }
});
t('bavardage : un pilote qui en veut au joueur ne raconte pas sa vie ; le bavardage ne change ni la relation ni la course', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  ch.pilotes[k].memoire = { relation: -R.DISCUSSION_ENNEMI - 5 };
  const froids = TEXTES[LANGUE].bav_froid;
  let n = 0; for (const ph of ['t’as quel âge ?', 'ta couleur préférée ?', 'tu as un animal ?', 'ton plat préféré ?', 'tu fais du sport ?']) if (froids.includes(dire(ch, k, ph).texte)) n++;
  v(n >= 2, 'refus : ' + n);
  const ch2 = nouveau(), k2 = rival(ch2, 0.4); gpCouru(ch2);
  const rel = () => (ch2.pilotes[k2].memoire && ch2.pilotes[k2].memoire.relation) || 0, avant = [rel(), ch2.pilotes[k2].disposition, ch2.pilotes[k2].rivalite, ch2.confiance];
  const course = []; for (const ph of SUJETS_PHRASES.map(x => x[0])) { const r = dire(ch2, k2, ph); if (r.reaction !== 'bavardage') course.push(ph + ' → ' + r.reaction); }
  v(!course.length, 'pas du bavardage : ' + course.join(' ; '));
  v(JSON.stringify([rel(), ch2.pilotes[k2].disposition, ch2.pilotes[k2].rivalite, ch2.confiance]) === JSON.stringify(avant), 'relation : ' + rel() + ' au lieu de ' + avant[0]);
});
t('bavardage : BAVARDAGE_ACTIF faux = les discussions d’avant (aucune réponse de bavardage)', () => {
  const avant = R.BAVARDAGE_ACTIF; R.BAVARDAGE_ACTIF = false;
  try {
    const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
    const r = ['t’as quel âge ?', 'ta couleur préférée ?', 'zorglub patate'].map(ph => dire(ch, k, ph));
    v(r.every(x => x.reaction !== 'bavardage') && !ch.pilotes[k].memoire.bav, JSON.stringify(r.map(x => x.reaction)));
  } finally { R.BAVARDAGE_ACTIF = avant; }
});
t('bavardage : ce que le joueur écrit n’est jamais redit s’il est long ou insultant', () => {
  v(BAVARDAGE.chose('le foot') === 'le foot' && BAVARDAGE.chose('j’adore le basket !') === 'le basket', BAVARDAGE.chose('j’adore le basket !'));
  v(BAVARDAGE.chose('t es nul') === null && BAVARDAGE.chose('une phrase beaucoup trop longue pour être redite telle quelle') === null, 'filtre');
});
t('bavardage : le hasard d’une course n’est pas touché (son propre hasard)', () => {
  ALEATOIRE.semer(42); const a = [hasard(), hasard()];
  ALEATOIRE.semer(42); const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  ALEATOIRE.semer(42); dire(ch, k, 't’as quel âge ?'); dire(ch, k, 'raconte une blague'); const b = [hasard(), hasard()];
  v(a[0] === b[0] && a[1] === b[1], JSON.stringify([a, b]));
});

// ---- trois conversations « d'enfant » (tour 59) : fautes, langage SMS, questions courtes ; imprimées dans la sortie, relues à la main
const ENFANTS = {
  fr: [
    ['slt', 'ca va ?', 't as quel age', 'moi jai 9 ans', 'ta couleur preferee', 'moi cest le rouge', 'lol', 'tu fais quoi ce weekend', 'cool', 'et toi t as un chien ?', 'moi jai un chat il sappel Mimi',
      'tu joue a fortnite', 'mdr', 'pk', 'tu es fort', 'tu gagne a la prochaine course ?', 'tu mange quoi le matin', 'jaime les pates', 'ta peur de koi', 'ah bon', 'ta des freres', 'oui jen ai 2', 'tu va ou en vacances', 'jtm bien', 'bye'],
    ['bonjour monsieur', 'vous avez quel age ?', 'jai 11 ans et vous', 'cest quoi votre animal prefere', 'moi cest les chevaux', 'vous faites du foot ?', 'non', 'moi oui', 'cest quoi votre plat prefere', 'ah moi cest la pizza', 'vous etes riche',
      'vous avez une voiture rapide ?', 'wow', 'vous allez gagner ?', 'oui', 'pourquoi', 'xd', 'vous connaissez Max ?', 'jveux etre pilote', 'vous avez des conseils', 'merci', 'a plus'],
    ['coucou', 'tu fais koi', 'rien', 'tu veux etre mon ami', 'ta quel age', 'jai 10 ans', 'ta un animal', 'oui un chien', 'Rex', 'ta couleur preferee', 'le bleu', 'tu aime lecole', 'moi non', 'tu es marie', 'haha', 'raconte une blague',
      'mdrrr', 'ta quelle voiture', 'cest laquelle ta preferee', 'je tadore', 'ok', 'tu vien dou', 'cool', 'a demain'],
  ],
  en: [
    ['hi', 'wassup', 'how old r u', 'im 9', 'ur fav color?', 'mine is red', 'lol', 'wat r u doin this weekend', 'cool', 'u got a dog?', 'i got a cat his name is Mimi',
      'do u play fortnite', 'lmao', 'why', 'ur so fast', 'will u win next race?', 'wat do u eat in the morning', 'i like pasta', 'wat r u scared of', 'really?', 'do u have brothers', 'yes i got 2', 'where r u going on holiday', 'luv u', 'bye'],
    ['hello sir', 'how old are you?', 'im 11, you?', 'whats your favorite animal', 'mine is horses', 'do you play football?', 'no', 'i do', 'whats your favourite food', 'i love pizza', 'are you rich',
      'is your car fast?', 'wow', 'are you gonna win?', 'yes', 'why', 'xd', 'do you know Max?', 'i wanna be a driver', 'any tips?', 'thanks', 'see ya'],
    ['yo', 'wyd', 'nothing', 'be my friend?', 'how old r u', 'im 10', 'do u have a pet', 'yes a dog', 'Rex', 'fav colour?', 'blue', 'do u like school', 'me neither', 'r u married', 'haha', 'tell me a joke',
      'lmaooo', 'what car do u drive', 'whats ur fav', 'i love u', 'ok', 'where u from', 'cool', 'cya tmrw'],
  ],
};
const INCOMPRIS = () => TEXTES[LANGUE].dis_incompris.concat(TEXTES[LANGUE].dis_incompris_encore || [], TEXTES[LANGUE].dis_question || []);
ENFANTS[LANGUE].forEach((fil, n) => t('bavardage : conversation d’enfant ' + (n + 1) + ' (' + LANGUE + ', ' + fil.length + ' messages) : jamais « je ne comprends pas », jamais deux fois de suite la même réponse, pas de trou', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const rs = fil.map(ph => [ph, dire(ch, k, ph)]);
  L.push('  TRANSCRIPTION enfant ' + (n + 1) + ' (' + LANGUE + ') :'); for (const [ph, r] of rs) L.push('    — ' + ph + '\n      → ' + r.texte + '   [' + r.reaction + (r.sujet ? '/' + r.sujet : '') + ']');
  const inc = INCOMPRIS();
  const mal = rs.filter(([ph, r]) => !r || !r.texte || TROU.test(r.texte) || inc.some(i => r.texte.startsWith(i.slice(0, 40)))).map(([ph, r]) => '« ' + ph + ' » → ' + (r && r.reaction) + ' : ' + (r && r.texte));
  v(!mal.length, 'incompris ou trou : ' + mal.join(' ; '));
  const dbl = rs.filter(([ph, r], i) => i && r.texte === rs[i - 1][1].texte).map(([ph]) => ph);
  v(!dbl.length, 'même réponse deux fois de suite : ' + dbl.join(' ; '));
}));

t('bavardage : une très longue conversation (plus de 60 messages variés) : jamais « je ne comprends pas », jamais deux fois de suite la même réponse, et il ressort ce qu’on lui a dit', () => {
  const debut = LANGUE === 'fr' ? ['salut', 'ça va ?', 'ta couleur préférée ?', 'moi c’est le vert', 'tu fais du sport ?', 'moi j’adore le basket', 'tu penses gagner à la prochaine course ?', 'qui est premier au championnat ?', 'un conseil pour le départ ?', 'raconte une blague', 'lol', 'ton plat préféré ?', 'tu viens d’où ?', 'ah bon', 'c’est qui ton idole ?', 'pourquoi ?', 'tu aimes ton écurie ?', 'ta voiture est bien ?']
    : ['hi', 'how are you?', 'your favourite colour?', 'mine is green', 'do you play any sport?', 'i love basketball', 'will you win the next race?', 'who is leading the championship?', 'any tips for the start?', 'tell me a joke', 'lol', 'favourite food?', 'where are you from?', 'really?', 'who is your idol?', 'why?', 'do you like your team?', 'is your car good?'];
  const fil = debut.concat(ENFANTS[LANGUE][0], ENFANTS[LANGUE][1], ENFANTS[LANGUE][2]);
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const rs = [];
  fil.forEach((ph, i) => { if (i && i % 20 === 0) gpCouru(ch); rs.push([ph, dire(ch, k, ph)]); });
  const inc = INCOMPRIS();
  const mal = rs.filter(([ph, r]) => !r || !r.texte || TROU.test(r.texte) || inc.some(x => r.texte.startsWith(x.slice(0, 40)))).map(([ph, r]) => '« ' + ph + ' » → ' + (r && r.texte));
  v(fil.length >= 60 && !mal.length, fil.length + ' messages ; incompris : ' + mal.join(' ; '));
  const dbl = rs.filter(([ph, r], i) => i && r.texte === rs[i - 1][1].texte).map(([ph]) => ph);
  v(!dbl.length, 'deux fois de suite : ' + dbl.join(' ; '));
});
t('bavardage : un goût dit par le joueur est ressorti plus tard (une fois), jamais genré', () => {
  const ch = nouveau(), k = rival(ch, 0.4); gpCouru(ch);
  const b = () => ch.pilotes[k].memoire.bav;
  dire(ch, k, LANGUE === 'fr' ? 'tu fais du sport ?' : 'do you play any sport?');
  b().attente = 'sport'; dire(ch, k, LANGUE === 'fr' ? 'le basket' : 'basketball');
  v(b().j.sport === (LANGUE === 'fr' ? 'le basket' : 'basketball'), JSON.stringify(b().j));
  const ctx = [LANGUE === 'fr' ? 'salut' : 'hi', LANGUE === 'fr' ? 'ça va ?' : 'how are you?', LANGUE === 'fr' ? 'ta couleur préférée ?' : 'favourite colour?', LANGUE === 'fr' ? 'ton plat préféré ?' : 'favourite food?', LANGUE === 'fr' ? 'tu aimes l’école ?' : 'do you like school?', LANGUE === 'fr' ? 'tu as des frères ?' : 'do you have brothers?'];
  let vu = 0; for (let i = 0; i < 12; i++) { gpCouru(ch); for (const ph of ctx) { b().attente = null; const r = dire(ch, k, ph); if (/basket/i.test(r.texte)) vu++; } }
  v(vu >= 1 && vu <= 1, 'ressorti ' + vu + ' fois');
});
ecrire();
