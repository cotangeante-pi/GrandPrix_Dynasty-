// Les tests des discussions, suite (tour 36d, Codeur 4) : comprendre plus (les phrases des joueurs, deux idées, l'incompris qui demande
// de reformuler), répondre de façon variée (jamais deux fois la même d'affilée, le ton du caractère, une graine fixe), des faits vrais
// (places, points d'écart, dernière course, duel), une mémoire sur plusieurs Grands Prix, la relation qui bouge lentement, le courrier
// rangé (lus et trop vieux effacés, 6 non lus au plus). Après banc-parle-tests.js (ses fonctions : nouveau, rival, contactAvec, gpCouru).
t('36d : au moins 100 phrases de joueurs ajoutées au banc (' + BANC_36D.length + '), dans les deux langues, et toutes comprises (le test du banc les lit)', () => {
  v(BANC_36D.length >= 100, BANC_36D.length + ' phrases');
  const en = BANC_36D.filter(([p]) => /\b(you|u|ur|why|the|my|me|what|how|stop|sick|well|nice|bro)\b/i.test(p)).length;
  v(en >= 30 && BANC_36D.length - en >= 50, en + ' en anglais');
  const r = BANC_36D.filter(([p, a]) => PARLE.comprendre(p, NOMS).acte !== a);
  v(!r.length, r.map(x => x[0]).join(' ; '));
});
t('36d : deux idées dans une phrase : l’idée forte (après « mais ») et la seconde, et il répond aux deux', () => {
  const r = BANC_DEUX.map(([p, a, s]) => { const c = PARLE.comprendre(p, NOMS); return c.acte === a && c.second === s ? null : p + ' → ' + c.acte + ' / ' + c.second; }).filter(x => x);
  v(!r.length, r.join(' ; '));
  const ch = nouveau(), k = rival(ch, 0.3); gpCouru(ch);
  const rep = DISCUSSION.dire(ch, k, 'gg mais pk tu m’as bloqué');
  v(rep.reactions.length === 2 && rep.reactions[0].startsWith('reclamation') && rep.reactions[1].startsWith('flatte'), JSON.stringify(rep.reactions));
  L.push('  (« gg mais pk tu m’as bloqué » → « ' + rep.texte + ' »)');
});
t('36d : une phrase incomprise reçoit une réponse naturelle qui demande de reformuler, jamais un faux sens', () => {
  const hors = ['zorglub patate', 'le chat de ma tante est bleu', 'asdfghjk', 'banane volante', 'my cat likes pizza', 'qwerty uiop', 'la tour eiffel', 'purple monkey dishwasher'];
  const faux = hors.map(p => [p, PARLE.comprendre(p, NOMS).acte]).filter(([p, a]) => a !== 'INCONNU' && a !== 'QUESTION');
  v(!faux.length, 'faux sens : ' + JSON.stringify(faux));
  const ch = nouveau(), k = rival(ch, 0.5), r = DISCUSSION.dire(ch, k, 'zorglub patate');
  const demandes = TEXTES[LANGUE].dis_incompris.concat(TEXTES[LANGUE].dis_incompris_vif || [], TEXTES[LANGUE].dis_incompris_doux || []);
  v(r.reaction === 'incompris' && demandes.some(d => r.texte.startsWith(d.replace(/\{\w+\}/g, '').slice(0, 12))) && !r.effets.relation, JSON.stringify(r));
  v(demandes.filter(d => /\?/.test(d)).length >= 4, 'des demandes de reformuler');
});
t('36d : jamais deux fois la même réponse d’affilée au même pilote (30 messages, sur plusieurs Grands Prix), et la même graine donne les mêmes réponses', () => {
  const jouer = () => { const ch = nouveau(), k = rival(ch, 0.5), dits = []; for (let g = 0; g < 6; g++) { gpCouru(ch); for (const p of ['slt', 'salut', 'ça va ?', 'gg', 'merci', 'yo']) dits.push(DISCUSSION.dire(ch, k, p).texte); } return dits; };
  const a = jouer(), b = jouer();
  for (let i = 1; i < a.length; i++) v(a[i] !== a[i - 1], 'deux fois : « ' + a[i] + ' »');
  v(JSON.stringify(a) === JSON.stringify(b), 'pas déterministe');
  v(new Set(a).size >= 15, new Set(a).size + ' réponses différentes sur ' + a.length);
});
t('36d : chaque réaction a au moins deux tournures, dans les deux langues', () => {
  for (const L_ of ['fr', 'en']) { const peu = Object.keys(TEXTES[L_]).filter(k => /^dis_[a-z_]+$/.test(k) && !/_(vif|doux)$/.test(k) && !/^dis_raison_/.test(k) && !['dis_avant', 'dis_encore'].includes(k) && !(Array.isArray(TEXTES[L_][k]) && TEXTES[L_][k].length >= 2)); v(!peu.length, L_ + ' : ' + peu.join(', ')); }
});
t('36d : le ton suit le caractère : le fougueux a ses tournures sèches, le calme ses tournures douces, jamais celles de l’autre', () => {
  const vus = ag => { const out = new Set(); for (let s = 0; s < 40; s++) { const ch = CHAMPIONNAT.creer(100 + s); INTERVIEW.completer(ch); const k = rival(ch, ag); out.add(DISCUSSION.dire(ch, k, 'slt').texte); } return out; };
  const vif = TEXTES[LANGUE].dis_salut_vif, doux = TEXTES[LANGUE].dis_salut_doux, nom = TEXTES[LANGUE].nomJoueur;
  const a = [...vus(0.9)], b = [...vus(0.1)], de = (l, t) => l.some(x => t.startsWith(x.replace('{nom}', '').split('{')[0].slice(0, 8)));
  v(a.some(x => de(vif, x)) && !a.some(x => de(doux, x)), 'fougueux : ' + a.join(' | '));
  v(b.some(x => de(doux, x)) && !b.some(x => de(vif, x)), 'calme : ' + b.join(' | '));
});
t('36d : la réponse cite des faits vrais : les places et les points d’écart au championnat, la dernière course et son circuit, le duel', () => {
  const ch = nouveau(), k = rival(ch, 0.5), j = ch.pilotes.find(p => p.humain);
  ch.pilotes[k].stats.points = 40; j.stats.points = 25;
  const ordre = [k].concat(ch.pilotes.map(p => p.id).filter(x => x !== k && x !== j.id)).concat([j.id]).slice(0, 20);
  ordre.splice(5, 0, ordre.pop());   // le joueur 6e
  gpCouru(ch, ordre);
  const cl = CHAMPIONNAT.classementPilotes(ch), pl = cl.findIndex(x => x.k === k) + 1, pj = cl.findIndex(x => x.k === j.id) + 1;
  const etat = DISCUSSION.dire(ch, k, 'ça va ?').texte;
  v(etat.includes('15') && (etat.includes('P' + pl) || !/P\d/.test(etat)) && (etat.includes('P' + pj) || !/P\d/.test(etat)), etat);
  const avis = DISCUSSION.dire(ch, k, 'que penses tu de moi ?').texte, circuit = texte('circuit_' + ch.calendrier[0].circuit);
  v(avis.includes(circuit) && avis.includes('P1') && avis.includes('P6'), avis);
  const co = CHAMPIONNAT.coequipierDe(ch), sd = CHAMPIONNAT.scoreDuel(ch), duel = DISCUSSION.dire(ch, co.id, 'et notre duel ?').texte;
  v(duel.includes(sd.total[0] + ' – ' + sd.total[1]) || duel.includes(String(sd.total[0])), duel);
  // aucun repère laissé, aucun nombre inventé : chaque nombre de la réponse est un vrai nombre du championnat
  for (const t_ of [etat, avis, duel]) { v(!/\{\w+\}/.test(t_), 'repère : ' + t_); for (const n of (t_.match(/\d+/g) || [])) v([pl, pj, 15, 1, 6, sd.total[0], sd.total[1], 25, 40].includes(Number(n)), 'nombre ' + n + ' dans « ' + t_ + ' »'); }
  L.push('  (faits : « ' + etat + ' » / « ' + avis + ' » / « ' + duel + ' »)');
});
t('36d : une mémoire sur plusieurs Grands Prix : il rappelle une insulte d’un Grand Prix d’avant (avec son circuit), une seule fois par Grand Prix ; un compliment ancien aussi', () => {
  const ch = nouveau(), k = rival(ch, 0.3);
  gpCouru(ch); DISCUSSION.dire(ch, k, 't nul');
  gpCouru(ch); gpCouru(ch);
  const r = DISCUSSION.dire(ch, k, 'salut'), circuit = texte('circuit_' + ch.calendrier[0].circuit);
  v(r.raisons.includes('souvenir_insulte') && r.texte.includes(circuit), JSON.stringify([r.raisons, r.texte]));
  v(!DISCUSSION.dire(ch, k, 'bien joué').raisons.includes('souvenir_insulte'), 'deux fois dans le même Grand Prix');
  const ch2 = nouveau(), k2 = rival(ch2, 0.3);
  gpCouru(ch2); DISCUSSION.dire(ch2, k2, 'bien joué'); gpCouru(ch2);
  v(DISCUSSION.dire(ch2, k2, 't es nul').raisons.includes('souvenir_gentil'), 'le compliment ancien');
  L.push('  (souvenir : « ' + r.texte + ' »)');
});
t('36d : la relation bouge lentement : jamais plus de DISCUSSION_PAS_GP sur un même Grand Prix, elle remonte sur plusieurs Grands Prix, toujours dans ±DISCUSSION_RELATION_MAX', () => {
  const ch = nouveau(), k = rival(ch, 0.3), m = () => ch.pilotes[k].memoire.relation;
  gpCouru(ch); for (let i = 0; i < 8; i++) DISCUSSION.dire(ch, k, 'bien joué');
  v(m() <= R.DISCUSSION_PAS_GP && m() > 0, 'un Grand Prix : ' + m());
  for (let g = 0; g < 10; g++) { gpCouru(ch); for (let i = 0; i < 8; i++) DISCUSSION.dire(ch, k, 'tu es le meilleur'); }
  v(m() <= R.DISCUSSION_RELATION_MAX && m() > R.DISCUSSION_PAS_GP, 'dix Grands Prix : ' + m());
  for (let g = 0; g < 12; g++) { gpCouru(ch); for (let i = 0; i < 8; i++) DISCUSSION.dire(ch, k, 'tocard'); }
  v(m() >= -R.DISCUSSION_RELATION_MAX, 'plancher : ' + m());
});
t('36d : les plaintes de course (« pk tu m’as bloqué ») : le fougueux assume, le calme s’explique, l’ami s’excuse à moitié ; petits effets', () => {
  const ch = nouveau(); gpCouru(ch);
  const a = rival(ch, 0.9), ra = DISCUSSION.dire(ch, a, 'pk tu m’as bloqué');
  v(ra.reaction === 'reclamation_assume' && Math.abs(ra.effets.relation || 0) <= 1, JSON.stringify(ra));
  const ch2 = nouveau(); gpCouru(ch2); const b = rival(ch2, 0.3), rb = DISCUSSION.dire(ch2, b, 'why did you block me');
  v(rb.reaction === 'reclamation_explique', JSON.stringify(rb));
  DISCUSSION.memoire(ch2.pilotes[b]).relation = R.DISCUSSION_AMI + 1;
  v(DISCUSSION.dire(ch2, b, 'you cut me off').reaction === 'reclamation_ami', 'ami');
});
t('36d : aucune réponse genrée (ni sur le joueur, ni sur le pilote qui parle) ; tous les repères en anglais et en français', () => {
  const fr = /(^|[^\wàâçéèêëîïôûù])(content|contente|désolé|désolée|prêt|prête|seul|seule|resté|restée|prudent|prudente|heureux|heureuse|fier|fière|sûr|sûre)(?![\wàâçéèêëîïôûù])/i, en = /\b(he|she|his|her|him|himself|herself)\b/i;
  const rep = x => (String(x).match(/\{\w+\}/g) || []).sort().join();
  for (const k of Object.keys(TEXTES.fr).filter(k => /^dis_/.test(k))) {
    for (const x of [].concat(TEXTES.fr[k])) v(!fr.test(x), 'fr ' + k + ' : ' + x);
    v(TEXTES.en[k] !== undefined, 'manque en anglais : ' + k);
    for (const x of [].concat(TEXTES.en[k] || [])) v(!en.test(x), 'en ' + k + ' : ' + x);
  }
});
t('36d : le courrier rangé : jamais plus de COURRIER_NON_LUS_MAX non lus, les messages de plus de COURRIER_AGE_MAX Grands Prix effacés, les lus effacés au Grand Prix suivant', () => {
  const ch = nouveau();
  for (let g = 0; g < 10; g++) { gpCouru(ch); for (const p of ch.pilotes) if (!p.humain) p.rivalite = { courses: 2, gp: ch.resultats.length, saison: 1 }; contactAvec(ch, 2 + g % 5); COURRIER_PILOTES.apresGrandPrix(ch);
    v(COURRIER_PILOTES.nonLus(ch) <= R.COURRIER_NON_LUS_MAX, 'non lus : ' + COURRIER_PILOTES.nonLus(ch)); }
  const n = (ch.saison - 1) * R.NB_GRANDS_PRIX + ch.resultats.length;
  v(ch.courrier.messages.every(m => n - ((m.saison - 1) * R.NB_GRANDS_PRIX + m.gp) <= R.COURRIER_AGE_MAX), 'trop vieux : ' + JSON.stringify(ch.courrier.messages.map(m => m.gp)));
  COURRIER_PILOTES.lire(ch, 0); const lu = ch.courrier.messages[0];
  v(ch.courrier.messages.includes(lu), 'lu tout de suite effacé');
  gpCouru(ch); COURRIER_PILOTES.apresGrandPrix(ch); v(!ch.courrier.messages.includes(lu), 'lu pas effacé au Grand Prix suivant');
  // une ancienne sauvegarde à 20 messages non lus (comme vu en début de saison 2) : rangée dès qu'on l'ouvre
  const ch2 = nouveau(); gpCouru(ch2); COURRIER_PILOTES.completer(ch2);
  ch2.courrier.messages = Array.from({ length: 20 }, (_, i) => ({ k: 1 + i % 18, sujet: 'bravo', cle: 'courrier_bravo', saison: 1, gp: 1, lu: false }));
  v(COURRIER_PILOTES.nonLus(ch2) === R.COURRIER_NON_LUS_MAX, 'ancienne boîte : ' + COURRIER_PILOTES.nonLus(ch2));
});
t('36d : le sujet de course et le tour nommés dans la phrase (départ, stands, pluie, qualif, virage, aspiration ; « au tour 3 », « on lap 7 »)', () => {
  const r = BANC_SUJETS.map(([p, s, n]) => { const c = PARLE.comprendre(p, NOMS); return (s === null || c.sujet === s) && c.tour === n ? null : p + ' → ' + c.sujet + ' / ' + c.tour; }).filter(x => x);
  v(!r.length, r.join(' ; '));
  v(PARLE.comprendre('slt', NOMS).sujet === null && PARLE.comprendre('slt', NOMS).tour === null, 'rien sans sujet');
});
t('36d : les lettres répétées (« merciii », « nuuul »), les émojis (👍 🙏 🔥 😡) et « pas mal » sont compris, sans changer les autres lectures', () => {
  const c = p => PARLE.comprendre(p, NOMS).acte;
  v(c('merciii') === 'MERCI' && c('t nuuul') === 'INSULTE' && c('👍') === 'ACCORD' && c('🙏') === 'MERCI' && c('🔥') === 'COMPLIMENT' && c('😡') === 'INSULTE', [c('merciii'), c('t nuuul'), c('👍'), c('🙏'), c('🔥'), c('😡')].join());
  v(c('pas mal') === 'COMPLIMENT' && c('t es pas fort') === 'INSULTE' && c('lol t nul') === 'INSULTE', [c('pas mal'), c('t es pas fort')].join());
});
// --- deux conversations complètes de 10 échanges, imprimées telles quelles dans la sortie du banc (demande du Chef, tour 36d) : en
// français avec un rival fougueux juste après un contact ; en anglais avec un coéquipier calme (la page est en français : pendant cette
// conversation, les textes français pointent sur les textes anglais, puis tout est remis)
const CONVERSATIONS_CHEF = {
  fr: ['slt', 'pk tu m’as percuté au départ ?', 'c’était quoi ce contact sérieux', 'dsl quand même', 't’as fini combien ?', 'tu penses quoi de moi frérot', 'gg mais tu m’as fermé la porte au virage', 'laisse moi passer la prochaine fois stp', 't’es chaud quand même', 'a+'],
  en: ['hey mate', 'how was your race?', 'what about our duel?', 'you were faster today, well played', 'what do you think of me?', 'let me pass next time if I’m faster pls', 'i owe you one', 'nice pit stop btw', 'why did you block me in turn 1', 'see ya'],
};
function conversationChef(L_) {
  const ch = nouveau(), co = CHAMPIONNAT.coequipierDe(ch).id, k = L_ === 'fr' ? rival(ch, 0.9) : co;
  if (L_ === 'en') ch.pilotes[co].caractere = { regularite: 0.008, agressivite: 0.2, erreurs: 0.5 };
  gpCouru(ch); if (L_ === 'fr') contactAvec(ch, k);
  const fr = TEXTES.fr; if (L_ === 'en') TEXTES.fr = TEXTES.en;
  try { return CONVERSATIONS_CHEF[L_].map(ph => ({ ph, r: DISCUSSION.dire(ch, k, ph) })); } finally { TEXTES.fr = fr; }
}
t('36d : les deux conversations pour le Chef (10 échanges chacune, imprimées ci-dessous) : chaque phrase reçoit une réponse, aucune réponse répétée', () => {
  for (const L_ of ['fr', 'en']) {
    const c = conversationChef(L_), textes = c.map(x => x.r && x.r.texte);
    v(textes.every(x => x && x.trim().length > 3) && new Set(textes).size === textes.length, L_ + ' : ' + textes.join(' | '));
    L.push('  CONVERSATION ' + (L_ === 'fr' ? 'en français, rival fougueux, après un contact' : 'en anglais, coéquipier calme') + ' :');
    for (const x of c) L.push('    — ' + x.ph + '\n      → ' + x.r.texte + '   [' + x.r.analyse.acte + (x.r.analyse.second ? ' + ' + x.r.analyse.second : '') + ' → ' + (x.r.reactions || [x.r.reaction]).join(' + ') + ']');
  }
});
ecrire();
