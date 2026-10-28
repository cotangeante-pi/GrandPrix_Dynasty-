// Le banc de phrases des discussions (Codeur 3, étape 12b) : chaque phrase, écrite comme l'écrirait un joueur (en français ou en
// anglais, en langage parlé, avec des fautes), et l'acte que PARLE.comprendre doit y lire. Utilisé par tests/banc-parle.html.
const BANC_PHRASES = [
  // saluer, quitter, remercier
  ['slt', 'SALUT'], ['wesh', 'SALUT'], ['Bonjour !', 'SALUT'], ['coucou toi', 'SALUT'], ['yo', 'SALUT'], ['hey there', 'SALUT'], ['Hello!', 'SALUT'], ['hi', 'SALUT'],
  ['a plus', 'ADIEU'], ['bye', 'ADIEU'], ['see ya', 'ADIEU'], ['au revoir', 'ADIEU'],
  ['merci bcp', 'MERCI'], ['thx', 'MERCI'], ['merci !', 'MERCI'], ['thanks mate', 'MERCI'],
  // provoquer, insulter
  ['t nul', 'INSULTE'], ['t es vraiment trop nul', 'INSULTE'], ['tu pilotes comme un escargot', 'INSULTE'], ['espèce de chauffard', 'INSULTE'], ['ta gueule', 'INSULTE'],
  ['u r so slow', 'INSULTE'], ['you are useless', 'INSULTE'], ['learn to drive', 'INSULTE'], ['you drive like a grandma', 'INSULTE'], ['tocard', 'INSULTE'],
  // menacer
  ['je vais te sortir à la prochaine course', 'MENACE'], ['fais gaffe à toi', 'MENACE'], ['tu vas le regretter', 'MENACE'], ['watch your back', 'MENACE'], ["i'll take you out next race", 'MENACE'], ["you'll pay for this", 'MENACE'],
  // s'excuser, faire la paix
  ['dsl pour tout à l’heure', 'EXCUSE'], ['désolée pour le contact', 'EXCUSE'], ['pardon', 'EXCUSE'], ['je m’excuse', 'EXCUSE'], ['sorry about the crash', 'EXCUSE'], ['my bad', 'EXCUSE'], ['sry', 'EXCUSE'],
  ['sans rancune', 'PAIX'], ['on fait la paix ?', 'PAIX'], ['enterrons la hache de guerre', 'PAIX'], ['no hard feelings', 'PAIX'], ["let's make peace", 'PAIX'], ['on repart à zéro', 'PAIX'],
  // féliciter
  ['bien joué', 'COMPLIMENT'], ['gg', 'COMPLIMENT'], ['belle course !', 'COMPLIMENT'], ['t es trop fort', 'COMPLIMENT'], ['well done', 'COMPLIMENT'], ['nice race mate', 'COMPLIMENT'], ['you are so fast', 'COMPLIMENT'], ['bravo', 'COMPLIMENT'],
  // le contact de la dernière course
  ['pourquoi tu m’as percuté ?', 'CONTACT'], ['tu m as sorti au premier virage', 'CONTACT'], ['c’était quoi cet accrochage ?', 'CONTACT'], ['why did you hit me?', 'CONTACT'], ['you crashed into me', 'CONTACT'], ['what was that crash?', 'CONTACT'],
  // laisser passer, promettre, bloquer
  ['laisse moi passer stp', 'PASSER'], ['tu peux me laisser passer ?', 'PASSER'], ['pousse toi si je suis plus rapide', 'PASSER'], ['let me pass please', 'PASSER'], ['move over next time', 'PASSER'], ['let me through if I am faster', 'PASSER'],
  ['je te rendrai la pareille', 'PROMESSE'], ['je te revaudrai ça', 'PROMESSE'], ["i'll return the favour", 'PROMESSE'], ['i owe you one', 'PROMESSE'],
  ['bloque le pour moi', 'BLOQUER'], ['retiens le un peu', 'BLOQUER'], ['block him for me', 'BLOQUER'], ["don't let him pass", 'BLOQUER'],
  // l'avis, les nouvelles, le duel
  ['que penses tu de moi ?', 'AVIS'], ['tu me trouves comment ?', 'AVIS'], ['what do you think of me?', 'AVIS'], ['ton avis sur moi ?', 'AVIS'],
  ['comment va ta saison ?', 'ETAT'], ['ça va ?', 'ETAT'], ['how are you?', 'ETAT'], ["how's your season?", 'ETAT'],
  ['et notre duel ?', 'DUEL'], ['on en est où dans notre duel ?', 'DUEL'], ['what about our duel?', 'DUEL'],
  // les contrats (le patron, pas le pilote)
  ['je veux une augmentation', 'SALAIRE'], ['i want a pay rise', 'SALAIRE'], ['je veux être premier pilote', 'STATUT'], ['make me number one driver', 'STATUT'],
  // oui, non
  ['ok', 'ACCORD'], ['ouais vas y', 'ACCORD'], ['d’accord', 'ACCORD'], ['deal', 'ACCORD'], ['yes', 'ACCORD'],
  ['nan', 'REFUS'], ['pas question', 'REFUS'], ['no way', 'REFUS'], ['jamais de la vie', 'REFUS'], ['no', 'REFUS'],
  // fautes de frappe
  ['excsue moi', 'EXCUSE'], ['felicitations', 'COMPLIMENT'], ['merrci', 'MERCI'],
];
