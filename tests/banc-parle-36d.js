// Le banc des discussions, suite (tour 36d, Codeur 4) : de vraies phrases de joueurs de 10 à 16 ans, en français et en anglais
// (langage SMS, insultes légères, compliments, questions sur la course, deux idées dans une phrase). Ajoutées au banc de
// tests/banc-parle.js (BANC_PHRASES) : le test du banc les lit toutes. BANC_DEUX : les phrases à deux idées (l'acte, puis le second).
const BANC_36D = [
  // les plaintes de course (RECLAMATION) : bloqué, porte fermée, freiné trop tôt, zigzag
  ['pk tu m as bloqué', 'RECLAMATION'], ['pk tu m’as bloqué au virage ?', 'RECLAMATION'], ['pourquoi tu m as bloque', 'RECLAMATION'], ['tu m’as fermé la porte', 'RECLAMATION'],
  ['tu m as coupé la route au premier virage', 'RECLAMATION'], ['t’as freiné trop tôt', 'RECLAMATION'], ['t as zigzagué dans la ligne droite', 'RECLAMATION'], ['arrête de me bloquer', 'RECLAMATION'],
  ['tu me bouchais tout le temps', 'RECLAMATION'], ['tu m’as tassé contre le mur', 'RECLAMATION'], ['pq tu m as serré', 'RECLAMATION'], ['tu m as mis dans l’herbe', 'RECLAMATION'],
  ['why did you block me', 'RECLAMATION'], ['why u block me', 'RECLAMATION'], ['you cut me off', 'RECLAMATION'], ['you closed the door on me', 'RECLAMATION'],
  ['you brake checked me!', 'RECLAMATION'], ['stop blocking me', 'RECLAMATION'], ['you kept weaving', 'RECLAMATION'], ['you pushed me onto the grass', 'RECLAMATION'],
  // les contacts (CONTACT)
  ['why did you crash me', 'CONTACT'], ['why did u hit me', 'CONTACT'], ['you wrecked me', 'CONTACT'], ['u clipped me', 'CONTACT'], ['pk tu m’as fumé', 'CONTACT'],
  ['t’as tapé ma roue', 'CONTACT'], ['tu m’as défoncé', 'CONTACT'], ['tu m as rentré dedans', 'CONTACT'], ['pourquoi tu m’as touché ?', 'CONTACT'], ['you punted me', 'CONTACT'],
  // les insultes légères et les moqueries de jeu (INSULTE)
  ['t’es éclaté au sol', 'INSULTE'], ['t es claqué', 'INSULTE'], ['t’es une tanche', 'INSULTE'], ['bouffon', 'INSULTE'], ['t es un bot', 'INSULTE'], ['ez', 'INSULTE'],
  ['cheh', 'INSULTE'], ['dans tes dents', 'INSULTE'], ['t’es trop mauvais', 'INSULTE'], ['t es pas au niveau', 'INSULTE'], ['boloss va', 'INSULTE'], ['t’es nul à chier', 'INSULTE'],
  ['you suck', 'INSULTE'], ['u suck lol', 'INSULTE'], ['ur trash', 'INSULTE'], ['you are a bot', 'INSULTE'], ['skill issue', 'INSULTE'], ['get rekt', 'INSULTE'], ['what a noob', 'INSULTE'], ['worst driver ever', 'INSULTE'],
  // les compliments (COMPLIMENT)
  ['t’es chaud', 'COMPLIMENT'], ['t es trop chaud frérot', 'COMPLIMENT'], ['t’es une machine', 'COMPLIMENT'], ['t es un monstre', 'COMPLIMENT'], ['masterclass', 'COMPLIMENT'], ['t’es le goat', 'COMPLIMENT'],
  ['t’as géré', 'COMPLIMENT'], ['tu gères', 'COMPLIMENT'], ['joli dépassement', 'COMPLIMENT'], ['c’était ouf', 'COMPLIMENT'], ['gg à toi', 'COMPLIMENT'], ['ggwp', 'COMPLIMENT'], ['big up', 'COMPLIMENT'],
  ['you’re cracked', 'COMPLIMENT'], ['ur insane bro', 'COMPLIMENT'], ['sick move', 'COMPLIMENT'], ['what a pass', 'COMPLIMENT'], ['well played', 'COMPLIMENT'], ['wp', 'COMPLIMENT'], ['you are a beast', 'COMPLIMENT'], ['that was insane', 'COMPLIMENT'], ['gg', 'COMPLIMENT'],
  // les nouvelles de la course (ETAT)
  ['t’as fini combien ?', 'ETAT'], ['tu as fini à quelle place', 'ETAT'], ['c’était comment la course ?', 'ETAT'], ['bien ou quoi', 'ETAT'], ['ça dit quoi', 'ETAT'], ['quoi de neuf ?', 'ETAT'],
  ['how did you do?', 'ETAT'], ['what place did you get', 'ETAT'], ['how was your race?', 'ETAT'], ['you good?', 'ETAT'], ['whats up', 'ETAT'],
  // la paix et l'apaisement (PAIX)
  ['tkt', 'PAIX'], ['c’est pas grave', 'PAIX'], ['pas grave', 'PAIX'], ['c’est oublié', 'PAIX'], ['no worries', 'PAIX'], ['all good mate', 'PAIX'], ['water under the bridge', 'PAIX'],
  // saluer, remercier, s'excuser en langage parlé
  ['wsh bien ?', 'SALUT'], ['yo bro', 'SALUT'], ['sup', 'SALUT'], ['cimer', 'MERCI'], ['merci frérot', 'MERCI'], ['ty', 'MERCI'], ['dsl frère', 'EXCUSE'], ['soz', 'EXCUSE'], ['my bad bro', 'EXCUSE'],
  // demander, promettre, bloquer, menacer, avis, duel, oui / non
  ['laisse moi passer frérot', 'PASSER'], ['let me pass bro', 'PASSER'], ['bloque le stp', 'BLOQUER'], ['je vais te sortir', 'MENACE'], ['tu vas voir à la prochaine', 'MENACE'], ['next time i’ll take you out', 'MENACE'],
  ['tu penses quoi de moi frérot', 'AVIS'], ['our duel?', 'DUEL'], ['ouais grave', 'ACCORD'], ['nope', 'REFUS'],
  // la question (QUESTION) : une question sans autre acte
  ['tu fais quoi ce week end ?', 'QUESTION'], ['what do you do after the race?', 'QUESTION'],
  // les phrases à deux idées (l'acte le plus fort : voir aussi BANC_DEUX)
  ['gg mais pk tu m’as bloqué', 'RECLAMATION'], ['sorry for the crash but you blocked me first', 'RECLAMATION'], ['t’es chaud mais tu m’as fermé la porte', 'RECLAMATION'],
];
// [phrase, acte, second] : deux idées, deux réponses
const BANC_DEUX = [
  ['gg mais pk tu m’as bloqué', 'RECLAMATION', 'COMPLIMENT'], ['sorry for the crash but you blocked me first', 'RECLAMATION', 'EXCUSE'], ['t’es chaud mais tu m’as fermé la porte', 'RECLAMATION', 'COMPLIMENT'],
  ['salut, dsl pour le contact', 'EXCUSE', null], ['bien joué, mais la prochaine fois je te sors', 'MENACE', 'COMPLIMENT'], ['merci, et laisse moi passer stp', 'PASSER', null],
];
for (const x of BANC_36D) BANC_PHRASES.push(x);
