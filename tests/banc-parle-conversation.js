// La conversation longue (tour 36, Codeur 3) : 10 échanges avec un rival, en français et en anglais, avec un pilote calme et un
// fougueux, après une course où vous vous êtes touchés. Il ne doit pas sentir le robot : chaque phrase comprise, aucune réponse
// répétée, pas deux fois de suite la même réaction, au moins un fait de la course et un souvenir de la conversation cités, et jamais
// de contradiction avec ce qui a été dit (des excuses acceptées ne sont pas oubliées trois messages plus tard).
// Chargé par tests/banc-parle.html après banc-parle-tests.js (il en reprend nouveau, rival, gpCouru, contactAvec, t, v, L).
const DIALOGUES = {
  fr: [['slt', 'SALUT'], ['pourquoi tu m’as percuté au départ ?', 'CONTACT'], ['c’était quoi ce contact ?', 'CONTACT'], ['dsl quand même', 'EXCUSE'],
    ['et ta saison, ça va ?', 'ETAT'], ['que penses-tu de moi ?', 'AVIS'], ['laisse moi passer la prochaine fois stp', 'PASSER'], ['je te rendrai la pareille', 'PROMESSE'],
    ['bien joué pour ta course', 'COMPLIMENT'], ['a plus', 'ADIEU']],
  en: [['hey', 'SALUT'], ['why did you hit me at the start?', 'CONTACT'], ['what was that crash?', 'CONTACT'], ['sorry anyway', 'EXCUSE'],
    ['how is your season?', 'ETAT'], ['what do you think of me?', 'AVIS'], ['let me pass next time please', 'PASSER'], ['i owe you one', 'PROMESSE'],
    ['nice race', 'COMPLIMENT'], ['see ya', 'ADIEU']],
};
const SOUVENIRS = /^(deja_|incompris_encore)|^(contradiction_|excuse_recue|souvenir_|derniere_fois_|conversation_)/, FAITS = /^(fait_|contact$|contact_regle$|depasse$|sujet_|tour_inconnu)/;
const HOSTILES = ['avis_mauvais', 'salut_froid', 'adieu_froid', 'riposte', 'defi'];
// la conversation, avec les textes de la langue L (la page tourne dans la langue du navigateur : on lit ses phrases comme le joueur les écrirait)
function converser(agressivite, L_) {
  const ch = nouveau(), k = rival(ch, agressivite); gpCouru(ch); contactAvec(ch, k);
  return { ch, k, echanges: DIALOGUES[L_].map(([ph, acte]) => Object.assign({ ph, attendu: acte }, DISCUSSION.dire(ch, k, ph))) };
}
for (const L_ of ['fr', 'en']) for (const [genre, ag] of [['calme', 0.3], ['fougueux', 0.9]]) {
  t('conversation de 10 échanges (' + L_ + ', pilote ' + genre + ') : chaque phrase comprise, aucune réponse répétée, pas deux fois de suite la même réaction', () => {
    const { echanges } = converser(ag, L_);
    const mal = echanges.filter(e => e.analyse.acte !== e.attendu).map(e => '« ' + e.ph + ' » → ' + e.analyse.acte + ' (attendu ' + e.attendu + ')');
    v(!mal.length, mal.join(' ; '));
    const textes = echanges.map(e => e.texte);
    v(textes.every(x => x && x.trim().length > 3) && new Set(textes).size === textes.length, 'répétée : ' + textes.join(' | '));
    const memes = echanges.filter((e, i) => i && e.reaction === echanges[i - 1].reaction).map(e => e.reaction);
    v(!memes.length, 'deux fois de suite : ' + memes.join(', '));
    // un circuit n'est jamais nommé deux fois dans la même réponse (les variantes courtes des raisons, quand elles existent)
    if (TEXTES[LANGUE].dis_raison_fait_course_devant_court) for (const e of echanges) for (const c of ['bahrayn', 'melbourn']) { const n = texte('circuit_' + c); if (n) v(e.texte.split(n).length <= 2, 'circuit deux fois : ' + e.texte); }
    L.push('  (' + L_ + ', ' + genre + ' : ' + echanges.map(e => '« ' + e.ph + ' » → ' + e.texte).join(' / ') + ')');
  });
  t('conversation de 10 échanges (' + L_ + ', pilote ' + genre + ') : au moins un fait de la course et un souvenir de la conversation cités ; jamais de contradiction avec ce qui a été dit', () => {
    const { echanges } = converser(ag, L_);
    const raisons = [].concat(...echanges.map(e => e.raisons)), reactions = echanges.map(e => e.reaction);
    v(raisons.some(x => FAITS.test(x)), 'aucun fait de la course : ' + raisons.join(', '));
    v(raisons.some(x => SOUVENIRS.test(x)) || reactions.some(x => SOUVENIRS.test(x)), 'aucun souvenir de la conversation : ' + reactions.join(', ') + ' / ' + raisons.join(', '));
    // la question reposée : il le remarque
    v(echanges[2].reaction === 'deja_contact', 'la question reposée : ' + echanges[2].reaction);
    // après des excuses acceptées : plus d'hostilité, et le contact n'est plus ressorti
    const i = reactions.indexOf('excuse_acceptee');
    if (i >= 0) {
      const apres = echanges.slice(i + 1);
      v(!apres.some(e => HOSTILES.includes(e.reaction)) && !apres.some(e => e.raisons.includes('contact')), 'contradiction après les excuses : ' + apres.map(e => e.reaction + '[' + e.raisons + ']').join(', '));
    }
    // le fougueux refuse les excuses tout de suite après un contact ; le calme les accepte (c'est son caractère qui décide, pas un tirage)
    v(ag >= REGLAGES.DISCUSSION_RANCUNE ? reactions[3] === 'excuse_refusee' : reactions[3] === 'excuse_acceptee', 'les excuses : ' + reactions[3]);
    // une longue conversation : l'au revoir dit comment elle s'est passée
    v(echanges[9].raisons.some(x => x.startsWith('conversation_')), 'au revoir : ' + echanges[9].raisons.join(', '));
  });
}
t('la conversation se souvient d’une contradiction : un compliment puis une insulte, une insulte puis des excuses ; elle ne redit pas la même raison', () => {
  const ch = nouveau(), k = rival(ch, 0.3); gpCouru(ch);
  DISCUSSION.dire(ch, k, 'bien joué');
  const r = DISCUSSION.dire(ch, k, 't nul');
  v(r.raisons[0] === 'contradiction_gentil', JSON.stringify(r.raisons));
  const ch2 = nouveau(), k2 = rival(ch2, 0.3); gpCouru(ch2);
  DISCUSSION.dire(ch2, k2, 'tocard');
  const r2 = DISCUSSION.dire(ch2, k2, 'gg');
  v(r2.raisons[0] === 'contradiction_mechant' && r2.reaction === 'flatte_mefiant', JSON.stringify([r2.reaction, r2.raisons]));
  // une raison dite une fois : pas deux fois dans la même conversation
  const ch3 = nouveau(), k3 = rival(ch3, 0.3); gpCouru(ch3); contactAvec(ch3, k3);
  const a = DISCUSSION.dire(ch3, k3, 'que penses tu de moi ?'), b = DISCUSSION.dire(ch3, k3, 'tu me trouves comment ?');
  v(a.raisons.includes('contact') && b.reaction === 'deja_avis' && !b.raisons.includes('contact'), JSON.stringify([a.raisons, b.reaction, b.raisons]));
});
t('d’un Grand Prix à l’autre : il se souvient du ton de votre dernière conversation, avec son circuit (bonne ou mauvaise)', () => {
  const ch = nouveau(), k = rival(ch, 0.3); gpCouru(ch); contactAvec(ch, k);
  for (const ph of ['salut', 'dsl pour le contact', 'bien joué', 'merci']) DISCUSSION.dire(ch, k, ph);
  const circuit = texte('circuit_' + ch.calendrier[0].circuit);
  gpCouru(ch);
  const r = DISCUSSION.dire(ch, k, 'salut');
  v(r.raisons.includes('derniere_fois_bon') && r.texte.includes(circuit), JSON.stringify(r.raisons) + ' ' + r.texte);
  const ch2 = nouveau(), k2 = rival(ch2, 0.3); gpCouru(ch2);
  for (const ph of ['t nul', 'tocard', 'fais gaffe']) DISCUSSION.dire(ch2, k2, ph);
  gpCouru(ch2);
  v(DISCUSSION.dire(ch2, k2, 'salut').raisons.includes('derniere_fois_mauvais'), 'mauvaise');
  L.push('  (« ' + r.texte + ' »)');
});
t('le moment nommé : « au départ » (sujet), « au tour 3 » (il ne connaît pas le tour exact et le dit) ; textes en fr et en en', () => {
  const ch = nouveau(), k = rival(ch, 0.3); gpCouru(ch); contactAvec(ch, k);
  const a = PARLE.comprendre('tu m’as percuté au départ', []), r = DISCUSSION.dire(ch, k, 'tu m’as percuté au départ');
  if (a.sujet !== undefined) v(r.raisons.includes('sujet_depart'), JSON.stringify([a.sujet, r.raisons]));
  const ch2 = nouveau(), k2 = rival(ch2, 0.3); gpCouru(ch2); contactAvec(ch2, k2);
  const b = PARLE.comprendre('tu m’as percuté au tour 3', []), r2 = DISCUSSION.dire(ch2, k2, 'tu m’as percuté au tour 3');
  if (b.tour !== undefined) v(b.tour === 3 && r2.raisons.includes('tour_inconnu') && r2.texte.includes('3'), JSON.stringify([b.tour, r2.raisons, r2.texte]));
  const cles = ['deja_salut', 'deja_avis', 'deja_etat', 'deja_duel', 'deja_contact', 'incompris_encore', 'raison_contradiction_gentil', 'raison_contradiction_mechant', 'raison_excuse_recue', 'raison_derniere_fois_bon',
    'raison_derniere_fois_mauvais', 'raison_tour_inconnu', 'raison_sujet_depart', 'raison_sujet_stands', 'raison_sujet_pluie', 'raison_sujet_qualif', 'raison_sujet_virage', 'raison_sujet_aspiration',
    'raison_conversation_bonne', 'raison_conversation_mauvaise', 'raison_conversation_neutre', 'raison_contact_regle'].map(c => 'dis_' + c);
  const manque = cles.filter(c => !TEXTES.fr[c] || !TEXTES.en[c]);
  v(!manque.length, manque.join(', '));
});
t('une mémoire de course d’un Grand Prix à l’autre : un deuxième contact avec le même pilote, il rappelle le premier (son circuit) ; un dépassement d’avant aussi', () => {
  const ch = nouveau(), k = rival(ch, 0.5);
  gpCouru(ch); contactAvec(ch, k); DISCUSSION.apresGrandPrix(ch);
  const premier = texte('circuit_' + ch.calendrier[0].circuit);
  gpCouru(ch); contactAvec(ch, k); DISCUSSION.apresGrandPrix(ch);
  const r = DISCUSSION.dire(ch, k, 'pourquoi tu m’as percuté ?');
  v(r.raisons.includes('recidive_contact') && r.texte.includes(premier), JSON.stringify(r.raisons) + ' ' + r.texte);
  // un dépassement à un Grand Prix d'avant : son avis s'en souvient
  const ch2 = nouveau(), k2 = rival(ch2, 0.5);
  gpCouru(ch2); ch2.interview.derniere = { gp: 1, saison: ch2.saison, fait: 'depassement', ton: null, rival: k2, faitsGP: { contact: null, depasse: k2 } }; DISCUSSION.apresGrandPrix(ch2);
  gpCouru(ch2);
  const r2 = DISCUSSION.dire(ch2, k2, 'que penses tu de moi ?');
  v(r2.raisons.includes('souvenir_depasse') && r2.texte.includes(texte('circuit_' + ch2.calendrier[0].circuit)), JSON.stringify(r2.raisons) + ' ' + r2.texte);
  v(ch2.pilotes[k2].memoire.courses.length === 1 && ch2.pilotes[k2].memoire.courses.length <= REGLAGES.DISCUSSION_COURSES, 'mémoire de course');
  L.push('  (« ' + r.texte + ' »)');
});
t('« t’as fini combien ? » : il donne sa place et la tienne à la dernière course ; ses réponses ne commencent jamais comme ses 3 dernières', () => {
  const ch = nouveau(), k = rival(ch, 0.5); gpCouru(ch);
  const a = PARLE.comprendre('t’as fini combien ?', []);
  const r = DISCUSSION.dire(ch, k, 't’as fini combien ?'), f = r.faits && r.faits.course;
  if (a.acte === 'ETAT') v(r.reaction === 'etat_place' && f && r.texte.includes('P' + f.a) && r.texte.includes('P' + f.b), JSON.stringify([r.reaction, r.texte]));
  const ch2 = nouveau(), k2 = rival(ch2, 0.5); gpCouru(ch2); const dits = [];
  for (const ph of ['gg', 'bien joué', 'bravo', 'belle course', 'well done', 'nice race']) dits.push(DISCUSSION.dire(ch2, k2, ph).texte);
  for (let i = 1; i < dits.length; i++) for (let j = Math.max(0, i - REGLAGES.DISCUSSION_OUVERTURES); j < i; j++) v(dits[i].slice(0, 14) !== dits[j].slice(0, 14) || dits[i].includes(texte('dis_encore')), 'même ouverture : ' + dits[j] + ' / ' + dits[i]);
});
ecrire();
