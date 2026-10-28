// Les tests des discussions (Codeur 3, étape 12b, CLAUDE.md « Les discussions avec les pilotes et les écuries ») : le banc de phrases
// (saisie libre et langage parlé, dans les deux langues), le composeur au clic, le raisonnement de chaque interlocuteur et ses effets
// plafonnés, la mémoire (promesses, menaces), jamais pendant une course, une ancienne sauvegarde, rien qui change sans discussion.
const L = []; let ok = 0, ko = 0;
function t(n, f) { try { f(); ok++; L.push('✔ ' + n); } catch (e) { ko++; L.push('✘ ' + n + ' — ' + e.message); } }
const v = (c, m) => { if (!c) throw new Error(m || 'faux'); };
function ecrire() { const r = 'RESULTAT ' + ok + '/' + (ok + ko) + '\n' + L.join('\n'); if (typeof document !== 'undefined' && document.getElementById('res')) document.getElementById('res').textContent = r; return r; }
const R = REGLAGES;

// --- 1. le banc de phrases
const NOMS = [{ k: 3, nom: 'Rossi' }, { k: 7, nom: 'Léa Moreau' }];
t('le banc : chaque phrase (' + BANC_PHRASES.length + ', français et anglais, langage parlé, fautes de frappe) donne l’acte attendu', () => {
  const ratees = BANC_PHRASES.filter(([p, a]) => PARLE.comprendre(p, NOMS).acte !== a).map(([p, a]) => '« ' + p + ' » → ' + PARLE.comprendre(p, NOMS).acte + ' (attendu ' + a + ')');
  v(!ratees.length, ratees.join(' ; '));
  const actes = new Set(BANC_PHRASES.map(x => x[1]));
  v(PARLE.ACTES.filter(a => a !== 'QUESTION').every(a => actes.has(a)), 'un acte sans phrase au banc : ' + PARLE.ACTES.filter(a => !actes.has(a)).join(', '));
  L.push('  (' + BANC_PHRASES.length + ' phrases, ' + actes.size + ' actes)');
});
t('la lecture fine : la négation, l’ironie, le pilote nommé, l’acte fort devant le salut, la promesse dans la demande', () => {
  const c = p => PARLE.comprendre(p, NOMS);
  v(c('je ne m’excuse pas').acte === 'REFUS', 'négation de l’excuse : ' + c('je ne m’excuse pas').acte);
  v(c('je ne te laisserai pas passer').acte === 'REFUS', 'négation du passage : ' + c('je ne te laisserai pas passer').acte);
  v(c('t es pas fort').acte === 'INSULTE', 'compliment nié : ' + c('t es pas fort').acte);
  v(c('lol t nul').ironie && c('lol t nul').acte === 'INSULTE', 'ironie');
  v(c('bloque Rossi pour moi').acte === 'BLOQUER' && c('bloque Rossi pour moi').cible === 3, 'cible Rossi : ' + JSON.stringify(c('bloque Rossi pour moi')));
  v(c('block moreau for me').cible === 7 && c('retiens léa moreau').cible === 7, 'cible par le nom de famille, sans accents');
  v(c('slt, laisse moi passer stp').acte === 'PASSER', 'le salut ne cache pas la demande');
  v(c('laisse moi passer et je te rendrai la pareille').jetons.includes('rendre9'), 'la promesse dans la demande');
  v(c('pas de souci').acte === 'ACCORD', '« pas de souci » est un accord');
  v(c('blabla truc machin').acte === 'INCONNU' && c('blabla ?').acte === 'QUESTION', 'l’inconnu et la question');
  v(JSON.stringify(c('Merci !')) === JSON.stringify(c('Merci !')), 'même phrase, même lecture');
});

// --- 2. le composeur au clic : chaque intention, en français et en anglais, repart dans la même lecture
const ATTENDU = { saluer: 'SALUT', feliciter: 'COMPLIMENT', excuser: 'EXCUSE', paix: 'PAIX', contact: 'CONTACT', passer: 'PASSER', promettre: 'PROMESSE', bloquer: 'BLOQUER',
  avis: 'AVIS', etat: 'ETAT', duel: 'DUEL', provoquer: 'INSULTE', menacer: 'MENACE', oui: 'ACCORD', non: 'REFUS', adieu: 'ADIEU' };
function nouveau() {
  const ch = CHAMPIONNAT.creer(5); INTERVIEW.completer(ch);
  return ch;
}
t('le composeur : chaque intention (' + DISCUSSION.INTENTIONS.length + ') donne une phrase en français et en anglais, lue comme l’intention', () => {
  const ch = nouveau(), fautes = [];
  v(DISCUSSION.INTENTIONS.every(i => ATTENDU[i]), 'une intention sans acte attendu');
  for (const L_ of ['fr', 'en']) for (const i of DISCUSSION.INTENTIONS) {
    const ph = DISCUSSION.composer(ch, i, { cible: 3, promesse: false }, L_), a = PARLE.comprendre(ph, DISCUSSION.noms(ch));
    if (!ph || a.acte !== ATTENDU[i]) fautes.push(L_ + ' ' + i + ' : « ' + ph + ' » → ' + a.acte);
    if (i === 'bloquer' && a.cible !== 3) fautes.push(L_ + ' bloquer : cible ' + a.cible);
  }
  v(!fautes.length, fautes.join(' ; '));
  const avec = DISCUSSION.composer(ch, 'passer', { promesse: true }, 'fr');
  v(PARLE.comprendre(avec, []).acte === 'PASSER' && PARLE.comprendre(avec, []).jetons.includes('rendre9'), 'passer + promesse : ' + avec);
});
t('les intentions proposées : le duel seulement avec le coéquipier, oui / non seulement quand il attend une réponse', () => {
  const ch = nouveau(), co = CHAMPIONNAT.coequipierDe(ch), autre = ch.pilotes.find(p => !p.humain && p.id !== co.id);
  v(DISCUSSION.intentions(ch, co.id).includes('duel') && !DISCUSSION.intentions(ch, autre.id).includes('duel'), 'duel');
  v(!DISCUSSION.intentions(ch, autre.id).includes('oui'), 'oui sans demande');
  DISCUSSION.memoire(ch.pilotes[autre.id]).demande = { type: 'rendre', saison: 1, gp: 0 };
  v(DISCUSSION.intentions(ch, autre.id).includes('oui') && DISCUSSION.intentions(ch, autre.id).includes('non'), 'oui et non avec une demande');
});

// --- 3. le raisonnement : chaque réponse vient du vrai calcul (caractère, relation, rivalité, course, mémoire)
function rival(ch, agressivite) { const p = ch.pilotes.find(x => !x.humain && x.id !== CHAMPIONNAT.coequipierDe(ch).id); p.caractere = { regularite: 0.008, agressivite, erreurs: 0.5 }; return p.id; }
function contactAvec(ch, k) { ch.interview.derniere = { gp: ch.resultats.length, saison: ch.saison, fait: 'contact', ton: null, rival: k, faitsGP: { contact: k, depasse: null } }; }
t('une insulte : le pilote fougueux riposte (une rivalité, pour DISCUSSION_RIVALITE_COURSES courses), le calme laisse glisser ; la relation baisse de DISCUSSION_PAS', () => {
  const ch = nouveau(), k = rival(ch, 0.9), r = DISCUSSION.dire(ch, k, 't nul');
  v(r.reaction === 'riposte' && r.raisons.includes('fougueux') && ch.pilotes[k].rivalite && ch.pilotes[k].rivalite.courses === R.DISCUSSION_RIVALITE_COURSES, JSON.stringify(r));
  v(ch.pilotes[k].memoire.relation === -R.DISCUSSION_PAS, 'relation ' + ch.pilotes[k].memoire.relation);
  const ch2 = nouveau(), k2 = rival(ch2, 0.1), r2 = DISCUSSION.dire(ch2, k2, 'tu es nul');
  v(r2.reaction === 'ignore' && !ch2.pilotes[k2].rivalite && ch2.pilotes[k2].memoire.relation === -R.DISCUSSION_PAS, JSON.stringify(r2));
  v(DISCUSSION.dire(ch2, k2, 'lol t nul').reaction === 'rit', 'l’ironie fait rire');
  L.push('  (« t nul » → « ' + r.texte + ' » / « ' + r2.texte + ' »)');
});
t('des excuses après un contact : acceptées par un pilote qui ne t’en veut pas trop (la rivalité s’apaise), refusées par un pilote rancunier ; sans contact, « des excuses pour quoi ? »', () => {
  const ch = nouveau(), k = rival(ch, 0.3); contactAvec(ch, k); ch.pilotes[k].rivalite = { courses: 2, gp: 0, saison: 1 };
  const r = DISCUSSION.dire(ch, k, 'dsl pour le contact');
  v(r.reaction === 'excuse_acceptee' && r.raisons.includes('contact') && !ch.pilotes[k].rivalite, JSON.stringify(r));
  const ch2 = nouveau(), k2 = rival(ch2, 0.95); contactAvec(ch2, k2);
  v(DISCUSSION.dire(ch2, k2, 'sorry about the crash').reaction === 'excuse_refusee', 'rancunier');
  const ch3 = nouveau(), k3 = rival(ch3, 0.3);
  v(DISCUSSION.dire(ch3, k3, 'pardon').reaction === 'excuse_sans_objet', 'sans contact');
  v(DISCUSSION.dire(ch3, k3, 'pourquoi tu m as percuté ?').reaction === 'contact_inconnu', 'pas de contact à reprocher');
});
t('« laisse-moi passer » : le coéquipier accepte (une disposition pour le prochain Grand Prix seulement) et demande la pareille ; un rival avec qui ça va mal refuse', () => {
  const ch = nouveau(), co = CHAMPIONNAT.coequipierDe(ch); co.caractere = { regularite: 0.008, agressivite: 0.2, erreurs: 0.5 };
  const r = DISCUSSION.dire(ch, co.id, 'laisse moi passer stp');
  v(r.reaction === 'passer_accepte' && co.disposition && co.disposition.type === 'laisser' && co.disposition.gp === ch.resultats.length + 1, JSON.stringify(r) + ' ' + JSON.stringify(co.disposition));
  v(co.memoire.demande && co.memoire.demande.type === 'rendre', 'il demande la pareille');
  v(DISCUSSION.intentions(ch, co.id).includes('oui'), 'oui proposé');
  const r2 = DISCUSSION.dire(ch, co.id, 'ok');
  v(r2.reaction === 'promesse_notee' && co.memoire.promesse && co.memoire.promesse.etat === 'ouverte' && co.memoire.demande === null, JSON.stringify(r2));
  // la disposition ne vaut que pour le prochain Grand Prix
  ch.resultats.push({ grandPrix: 1, ordre: [], duel: null }); DISCUSSION.apresGrandPrix(ch);
  v(!co.disposition, 'disposition oubliée après le Grand Prix');
  const ch2 = nouveau(), k = rival(ch2, 0.9); ch2.pilotes[k].rivalite = { courses: 2, gp: 0, saison: 1 };
  v(DISCUSSION.dire(ch2, k, 'let me pass please').reaction === 'passer_rit' && !ch2.pilotes[k].disposition, 'le rival refuse');
});
t('une promesse non tenue est rappelée : il te demande la pareille, tu refuses, et il te le reproche ensuite (raison promesse_trahie, avec le circuit)', () => {
  const ch = nouveau(), co = CHAMPIONNAT.coequipierDe(ch); co.caractere = { regularite: 0.008, agressivite: 0.2, erreurs: 0.5 };
  ch.resultats.push({ grandPrix: 1, ordre: [], duel: null });
  DISCUSSION.dire(ch, co.id, 'laisse moi passer, je te rendrai la pareille');
  v(co.memoire.promesse && co.memoire.promesse.etat === 'ouverte' && co.memoire.promesse.gp === 1, JSON.stringify(co.memoire));
  v(DISCUSSION.demanderPromesse(ch, co.id) && co.memoire.demande.type === 'tenir', 'la demande');
  const r = DISCUSSION.dire(ch, co.id, 'non');
  v(r.reaction === 'promesse_trahie' && co.memoire.promesse.etat === 'trahie', JSON.stringify(r));
  const r2 = DISCUSSION.dire(ch, co.id, 'salut');
  const circuit = texte('circuit_' + ch.calendrier[0].circuit);
  v(r2.raisons.includes('promesse_trahie') && r2.texte.includes(circuit), r2.texte + ' / ' + circuit);
  // tenue, elle est saluée
  const ch2 = nouveau(), c2 = CHAMPIONNAT.coequipierDe(ch2); c2.caractere = { regularite: 0.008, agressivite: 0.2, erreurs: 0.5 };
  DISCUSSION.dire(ch2, c2.id, 'je te rendrai la pareille'); DISCUSSION.demanderPromesse(ch2, c2.id);
  v(DISCUSSION.dire(ch2, c2.id, 'oui').reaction === 'promesse_tenue' && c2.memoire.promesse.etat === 'tenue', 'tenue');
  L.push('  (rappel : « ' + r2.texte + ' »)');
});
t('une menace sans suite fait perdre du crédit : après DISCUSSION_MENACE_COURSES courses, la menace suivante fait rire', () => {
  const ch = nouveau(), k = rival(ch, 0.3);
  v(DISCUSSION.dire(ch, k, 'fais gaffe à toi').reaction === 'mefiant', 'la menace');
  for (let i = 0; i < R.DISCUSSION_MENACE_COURSES; i++) { ch.resultats.push({ grandPrix: i + 1, ordre: [], duel: null }); DISCUSSION.apresGrandPrix(ch); }
  v(ch.pilotes[k].memoire.credit === -1 && ch.pilotes[k].memoire.menace === null, JSON.stringify(ch.pilotes[k].memoire));
  const r = DISCUSSION.dire(ch, k, 'watch your back');
  v(r.reaction === 'menace_moquee' && r.raisons.includes('menace_vide'), JSON.stringify(r));
});
t('« bloque-le pour moi » : il accepte si c’est son intérêt (le pilote visé est devant lui au championnat), sinon il refuse ; sans cible, il demande qui', () => {
  const ch = nouveau(), cl = () => CHAMPIONNAT.classementPilotes(ch);
  // des points pour ordonner le championnat : le pilote 3 devant le pilote 5
  ch.pilotes[3].stats.points = 50; ch.pilotes[5].stats.points = 10;
  const nomDe = p => p.nom || texte('pilote').replace('{n}', p.numero);
  ch.pilotes[5].caractere = { regularite: 0.008, agressivite: 0.3, erreurs: 0.5 };
  const pts = cl(), lui = pts.findIndex(x => x.k === 5), vise = pts.findIndex(x => x.k === 3);
  const r = DISCUSSION.dire(ch, 5, 'bloque ' + nomDe(ch.pilotes[3]) + ' pour moi');
  v((vise < lui) === (r.reaction === 'bloquer_accepte'), 'intérêt : ' + vise + ' < ' + lui + ' → ' + r.reaction);
  if (r.reaction === 'bloquer_accepte') v(ch.pilotes[5].disposition.type === 'bloquer' && ch.pilotes[5].disposition.cible === 3 && r.texte.includes(nomDe(ch.pilotes[3])), JSON.stringify(ch.pilotes[5].disposition));
  v(DISCUSSION.dire(ch, 5, 'bloque le pour moi').reaction === 'bloquer_qui', 'sans cible');
  v(DISCUSSION.dire(ch, 5, 'bloque ' + nomDe(ch.pilotes[5])).reaction === 'bloquer_absurde', 'lui-même');
});
t('le coéquipier et le duel ; l’insulte au coéquipier coûte de la confiance à l’écurie (DISCUSSION_CONFIANCE au plus) ; les autres ne parlent pas de duel ni de salaire', () => {
  const ch = nouveau(), co = CHAMPIONNAT.coequipierDe(ch), avant = ch.reputation.ecurie;
  v(['duel_egal', 'duel_devant', 'duel_derriere'].includes(DISCUSSION.dire(ch, co.id, 'et notre duel ?').reaction), 'duel');
  DISCUSSION.dire(ch, co.id, 'tocard');
  v(ch.reputation.ecurie === avant - R.DISCUSSION_CONFIANCE && ch.confiance === ch.reputation.ecurie, avant + ' → ' + ch.reputation.ecurie);
  const k = rival(ch, 0.5);
  v(DISCUSSION.dire(ch, k, 'what about our duel?').reaction === 'duel_pas_coequipier' && DISCUSSION.dire(ch, k, 'je veux une augmentation').reaction === 'contrat_pas_moi', 'pas son rôle');
});
t('les plafonds : la relation reste entre ±DISCUSSION_RELATION_MAX, un message ne la bouge jamais de plus de DISCUSSION_PAS, au plus DISCUSSION_PAR_GP messages par Grand Prix, la mémoire garde DISCUSSION_MEMOIRE messages', () => {
  const ch = nouveau(), k = rival(ch, 0.1), m = () => ch.pilotes[k].memoire;
  let pire = 0, avant = 0, occupe = false;
  for (let gp = 0; gp < 12; gp++) {
    for (let i = 0; i < R.DISCUSSION_PAR_GP + 2; i++) { const r = DISCUSSION.dire(ch, k, gp % 2 ? 'bien joué' : 't nul'); pire = Math.max(pire, Math.abs(m().relation - avant)); avant = m().relation; if (r.reaction === 'occupe') occupe = true;
      v(Math.abs(m().relation) <= R.DISCUSSION_RELATION_MAX, 'relation ' + m().relation); }
    ch.resultats.push({ grandPrix: gp + 1, ordre: [], duel: null }); DISCUSSION.apresGrandPrix(ch);
  }
  v(pire <= R.DISCUSSION_PAS && occupe && m().dits.length === R.DISCUSSION_MEMOIRE, 'pas ' + pire + ', occupé ' + occupe + ', mémoire ' + m().dits.length);
});
t('jamais pendant une course : dire() refuse sur les écrans de course (course, pause, qualif, grille) et répond au paddock', () => {
  const ch = nouveau(), k = rival(ch, 0.5);
  for (const e of ['course', 'pause', 'qualif', 'grille', 'podium']) v(DISCUSSION.dire(ch, k, 'salut', e) === null && !DISCUSSION.peutDiscuter(e), e);
  v(DISCUSSION.dire(ch, k, 'salut', 'championnat') !== null && DISCUSSION.dire(ch, k, 'salut', 'fiche') !== null, 'paddock');
  v(DISCUSSION.dire(ch, ch.pilotes.find(p => p.humain).id, 'salut') === null, 'pas à soi-même');
});
t('les réponses : chaque réaction et chaque raison a son texte en français et en anglais ; la même situation donne la même phrase ; le hasard d’une course n’est pas touché', () => {
  const src = (typeof DISCUSSION_SOURCE !== 'undefined') ? DISCUSSION_SOURCE : '';
  const reactions = ['salut', 'salut_chaud', 'salut_froid', 'adieu', 'adieu_froid', 'merci', 'rit', 'riposte', 'ignore', 'defi', 'mefiant', 'menace_moquee', 'excuse_acceptee', 'excuse_refusee', 'excuse_sans_objet',
    'paix_refusee', 'paix_acceptee', 'paix_deja', 'flatte', 'flatte_mefiant', 'contact_inconnu', 'contact_assume', 'contact_regrette', 'passer_accepte', 'passer_accepte_rival', 'passer_refuse', 'passer_rit',
    'promesse_notee', 'promesse_refusee', 'promesse_tenue', 'promesse_trahie', 'bloquer_qui', 'bloquer_absurde', 'bloquer_accepte', 'bloquer_refuse', 'avis_bon', 'avis_mauvais', 'avis_neutre',
    'etat_debut', 'etat_bien', 'etat_moyen', 'etat_mal', 'duel_pas_coequipier', 'duel_devant', 'duel_derriere', 'duel_egal', 'contrat_pas_moi', 'accord_vague', 'refus_vague', 'question', 'incompris', 'occupe'];
  const raisons = ['promesse_trahie', 'menace_vide', 'rivalite', 'fougueux', 'equipe', 'contact', 'relation_mauvaise', 'en_forme', 'devant_toi', 'interet', 'pas_interet', 'depasse'];
  const manque = reactions.map(r => 'dis_' + r).concat(raisons.map(r => 'dis_raison_' + r)).filter(c => !TEXTES.fr[c] || !TEXTES.en[c]);
  v(!manque.length, 'manquent : ' + manque.join(', '));
  const a = nouveau(), b = nouveau(), ka = rival(a, 0.5), kb = rival(b, 0.5);
  v(DISCUSSION.dire(a, ka, 'salut').texte === DISCUSSION.dire(b, kb, 'salut').texte, 'même situation, même phrase');
  ALEATOIRE.semer(42); hasard(); const x = hasard(); ALEATOIRE.semer(42); hasard(); DISCUSSION.dire(a, ka, 'bien joué'); const y = hasard(); ALEATOIRE.semer();
  v(x === y, 'le hasard de la course a bougé');
});
t('une ancienne sauvegarde (aucune mémoire de discussion) se charge et discute ; sans discussion, rien ne change (apresGrandPrix ne touche à rien)', () => {
  const ch = nouveau(); ch.interview = undefined;
  const avant = JSON.stringify(ch); DISCUSSION.apresGrandPrix(ch);
  v(JSON.stringify(ch) === avant, 'apresGrandPrix a changé un championnat sans discussion');
  INTERVIEW.completer(ch);
  const k = rival(ch, 0.5), r = DISCUSSION.dire(ch, k, 'salut');
  v(r && r.reaction === 'salut' && ch.pilotes[k].memoire.relation === 0, JSON.stringify(r));
  const ch2 = nouveau(), k2 = rival(ch2, 0.5), a = JSON.stringify(ch2); PARLE.comprendre('t nul', DISCUSSION.noms(ch2)); DISCUSSION.raisonner(ch2, k2, PARLE.comprendre('t nul', []));
  v(JSON.stringify(ch2) === a, 'comprendre et raisonner ne changent rien (seul dire applique)');
});
// --- 4. le courrier des pilotes (courrier-pilotes.js)
function gpCouru(ch, ordre) { ch.resultats.push({ grandPrix: ch.resultats.length + 1, ordre: ordre || ch.pilotes.map(p => p.id), duel: null }); }
t('le courrier : après un contact, le pilote touché t’écrit (furieux s’il est fougueux, sinon pour en parler) ; COURRIER_PAR_GP messages au plus, les plus urgents d’abord', () => {
  const ch = nouveau(), k = rival(ch, 0.9); gpCouru(ch); contactAvec(ch, k);
  const sujets = COURRIER_PILOTES.apresGrandPrix(ch), m = ch.courrier.messages;
  v(sujets[0] === 'contact' && m[0].k === k && m[0].cle === 'courrier_contact_colere' && !m[0].lu, JSON.stringify(m));
  const ch2 = nouveau(), k2 = rival(ch2, 0.1); gpCouru(ch2); contactAvec(ch2, k2); COURRIER_PILOTES.apresGrandPrix(ch2);
  v(ch2.courrier.messages[0].cle === 'courrier_contact_calme', 'calme');
  // beaucoup de sujets à la fois : seulement les plus urgents
  const ch3 = nouveau(); gpCouru(ch3); contactAvec(ch3, 2);
  for (const p of ch3.pilotes) if (!p.humain && p.id !== 2) p.rivalite = { courses: 2, gp: 1, saison: 1 };
  const s3 = COURRIER_PILOTES.apresGrandPrix(ch3);
  v(s3.length === R.COURRIER_PAR_GP && s3[0] === 'contact' && s3.slice(1).every(x => x === 'rivalite'), JSON.stringify(s3));
  v(COURRIER_PILOTES.nonLus(ch3) === R.COURRIER_PAR_GP, 'non lus');
  L.push('  (« ' + COURRIER_PILOTES.texteDe(ch, m[0], { pilote: p => p.nom || texte('pilote').replace('{n}', p.numero) }) + ' »)');
});
t('le courrier sans redite : le même sujet ne revient pas chez le même pilote avant COURRIER_OUBLI Grands Prix ; la boîte garde COURRIER_MAX messages', () => {
  const ch = nouveau(), k = rival(ch, 0.5), compte = () => ch.courrier.messages.filter(m => m.k === k && m.sujet === 'contact').length;
  for (let i = 0; i < R.COURRIER_OUBLI; i++) { gpCouru(ch); contactAvec(ch, k); COURRIER_PILOTES.apresGrandPrix(ch); }
  v(compte() === 1, 'redite : ' + compte());
  gpCouru(ch); contactAvec(ch, k); COURRIER_PILOTES.apresGrandPrix(ch);
  v(compte() === 2, 'après l’oubli : ' + compte());
  for (let i = 0; i < 40; i++) { gpCouru(ch); for (const p of ch.pilotes) if (!p.humain) p.rivalite = { courses: 2, gp: ch.resultats.length, saison: 1 }; COURRIER_PILOTES.apresGrandPrix(ch); }
  v(ch.courrier.messages.length <= R.COURRIER_MAX, 'boîte : ' + ch.courrier.messages.length);
});
t('le courrier et la promesse : il te demande la pareille promise (la discussion attend ton oui ou ton non) ; une menace sans suite, il s’en moque une fois', () => {
  const ch = nouveau(), co = CHAMPIONNAT.coequipierDe(ch); co.caractere = { regularite: 0.008, agressivite: 0.2, erreurs: 0.5 };
  gpCouru(ch); DISCUSSION.dire(ch, co.id, 'je te rendrai la pareille'); gpCouru(ch);
  const s = COURRIER_PILOTES.apresGrandPrix(ch);
  v(s.includes('promesse') && co.memoire.demande && co.memoire.demande.type === 'tenir', JSON.stringify(s) + ' ' + JSON.stringify(co.memoire));
  v(DISCUSSION.intentions(ch, co.id).includes('oui'), 'oui proposé');
  v(DISCUSSION.dire(ch, co.id, 'nan').reaction === 'promesse_trahie', 'trahie');
  const ch2 = nouveau(), k = rival(ch2, 0.3); gpCouru(ch2); DISCUSSION.dire(ch2, k, 'fais gaffe');
  for (let i = 0; i < R.DISCUSSION_MENACE_COURSES; i++) { gpCouru(ch2); DISCUSSION.apresGrandPrix(ch2); }
  const s2 = COURRIER_PILOTES.apresGrandPrix(ch2); gpCouru(ch2); const s3 = COURRIER_PILOTES.apresGrandPrix(ch2);
  v(s2.includes('menaceVide') && !s3.includes('menaceVide'), JSON.stringify([s2, s3]));
});
t('le courrier : chaque sujet a ses textes en français et en anglais ; une ancienne sauvegarde sans courrier se charge', () => {
  const cles = ['contact_colere', 'contact_calme', 'promesse', 'rivalite', 'duelPerdu', 'duelGagne', 'depasse_colere', 'depasse_calme', 'menaceVide', 'bravo', 'domicile', 'courage', 'jaloux', 'leader', 'vieux', 'bienvenue'];
  const manque = cles.filter(c => !TEXTES.fr['courrier_' + c] || !TEXTES.en['courrier_' + c]);
  v(!manque.length && COURRIER_PILOTES.SUJETS.length >= 14, 'manquent : ' + manque.join(', ') + ' / ' + COURRIER_PILOTES.SUJETS.length + ' sujets');
  const ch = nouveau(); delete ch.courrier; v(COURRIER_PILOTES.nonLus(ch) === 0, 'non lus');
  gpCouru(ch); COURRIER_PILOTES.apresGrandPrix(ch); v(Array.isArray(ch.courrier.messages), 'complété');
});
// --- 5. les patrons d'écurie (patrons.js, tour 35)
const NOMS_E = { pilote: p => p.nom || (p.humain ? texte('nomJoueur') : texte('pilote').replace('{n}', p.numero)), ecurie: e => e.nom || texte('ecurie').replace('{n}', e.id + 1) };
const moi = ch => ch.pilotes.find(p => p.humain);
const finDeSaison = ch => { SAISONS.avancer(ch, R.NB_GRANDS_PRIX); SAISONS.terminerSaison(ch); return ch; };
t('ton patron, toute l’année : la confiance de l’écurie (haute, moyenne, basse) et tes résultats contre ce qu’on attend de la voiture ; les autres patrons ne te parlent pas hors des contrats', () => {
  const ch = nouveau(), e = moi(ch).ecurie;
  ch.confiance = ch.reputation.ecurie = 75; v(PATRONS.dire(ch, e, 'tu me fais confiance ?', 'championnat').reaction === 'confiance_haute', 'haute');
  ch.confiance = ch.reputation.ecurie = 25; v(PATRONS.dire(ch, e, 'does the team trust me?', 'championnat').reaction === 'confiance_basse', 'basse');
  // des résultats : le joueur très au-dessus de ce que vaut sa petite écurie
  ch.confiance = ch.reputation.ecurie = 50; SAISONS.avancer(ch, 4); moi(ch).stats.points = 999;
  const r = PATRONS.dire(ch, e, 'ton avis ?', 'championnat');
  v(r.reaction === 'confiance_moyenne' && r.raisons.includes('au_dessus') && r.texte.includes('P1'), JSON.stringify(r));
  const autre = (e + 1) % ch.ecuries.length;
  v(PATRONS.dire(ch, autre, 'salut', 'championnat') === null && !PATRONS.peutParler(ch, autre), 'un autre patron, hors des contrats');
  v(PATRONS.dire(ch, e, 'salut', 'course') === null, 'jamais pendant une course');
  L.push('  (« ' + r.texte + ' »)');
});
t('premier pilote : accordé si tu mènes nettement le duel (PATRON_STATUT_ECART) avec la confiance (PATRON_STATUT_CONFIANCE), sinon refusé avec la raison ; une fois accordé, « déjà »', () => {
  const ch = nouveau(), e = moi(ch).ecurie;
  const r0 = PATRONS.dire(ch, e, 'je veux être premier pilote', 'championnat');
  v(r0.reaction === 'statut_refuse' && r0.raisons.includes('duel_pas_assez') && PATRONS.statut(ch) === 'second', JSON.stringify(r0));
  CHAMPIONNAT.scoreDuel(ch); ch.duel.qualifs = [R.PATRON_STATUT_ECART, 0];   // (le duel fabriqué : le joueur mène)
  ch.confiance = ch.reputation.ecurie = R.PATRON_STATUT_CONFIANCE;
  const r1 = PATRONS.dire(ch, e, 'i want to be first driver', 'championnat');
  v(r1.reaction === 'statut_accepte' && PATRONS.statut(ch) === 'premier', JSON.stringify(r1) + ' ' + JSON.stringify(CHAMPIONNAT.scoreDuel(ch)));
  v(PATRONS.dire(ch, e, 'premier pilote stp', 'championnat').reaction === 'statut_deja', 'déjà');
  v(PATRONS.dire(ch, e, 'parlons des consignes d’équipe', 'championnat').reaction === 'consigne_premier', 'les consignes jouent pour toi');
});
t('le budget de la voiture : une fois par saison, si tu fais mieux que prévu et que l’écurie te fait confiance ; PATRON_BUDGET_MONTANT crédité, pas plus', () => {
  const ch = nouveau(), e = moi(ch).ecurie;
  v(PATRONS.dire(ch, e, 'plus de budget', 'championnat').reaction === 'budget_refuse', 'trop tôt');
  SAISONS.avancer(ch, 3); moi(ch).stats.points = 999; ch.confiance = ch.reputation.ecurie = 60;
  const avant = ARGENT.solde(ch), r = PATRONS.dire(ch, e, 'i need more budget', 'championnat');
  v(r.reaction === 'budget_accepte' && ARGENT.solde(ch) === avant + R.PATRON_BUDGET_MONTANT, JSON.stringify(r) + ' ' + (ARGENT.solde(ch) - avant));
  v(PATRONS.dire(ch, e, 'encore du budget', 'championnat').reaction === 'budget_deja' && ARGENT.solde(ch) === avant + R.PATRON_BUDGET_MONTANT, 'une fois');
});
t('les consignes : une consigne ignorée, ton patron te la rappelle (dans son avis et sur les consignes) ; suivie, il le compte', () => {
  const ch = nouveau(), e = moi(ch).ecurie;
  PATRONS.noterConsigne(ch, { joueur: true, resultat: 'ignoree' });
  v(PATRONS.dire(ch, e, 'pourquoi cette consigne ?', 'championnat').reaction === 'consigne_rappel', 'rappel');
  v(PATRONS.dire(ch, e, 'ton avis ?', 'championnat').raisons.includes('consigne_ignoree'), 'raison');
  const ch2 = nouveau(); PATRONS.noterConsigne(ch2, { joueur: true, resultat: 'suivie' });
  v(PATRONS.dire(ch2, moi(ch2).ecurie, 'ton avis ?', 'championnat').raisons.includes('consigne_suivie'), 'suivie');
});
t('aux contrats : chaque offre a son salaire (selon le rang de l’écurie) ; une demande dans ce qu’il peut est acceptée, trop forte devient une contre-offre (oui → marché conclu), beaucoup trop est refusée ; jamais plus de CONTRAT_NEGO_MAX', () => {
  const ch = finDeSaison(nouveau()), o = SAISONS.offres(ch), e = o[0].ecurie, base = PATRONS.salaireBase(ch, e), max = PATRONS.bonusMax(ch, e);
  v(o.every(x => x.salaire >= R.CONTRAT_SALAIRE_MIN && x.salaire <= R.CONTRAT_SALAIRE_MAX && x.statut === 'second'), JSON.stringify(o.map(x => x.salaire)));
  v(PATRONS.peutParler(ch, e), 'on peut lui parler');
  L.push('  (offre de ' + e + ' : ' + base + ' de base, il peut monter de ' + Math.round(max * 100) + ' %)');
  v(max > 0 && max <= R.CONTRAT_NEGO_MAX, 'max ' + max);
  const petit = base + Math.floor(base * max / 2 / 1000) * 1000, r1 = PATRONS.dire(ch, e, 'je veux ' + petit, 'contrats');
  v(r1.reaction === 'salaire_accepte' && PATRONS.conditions(ch, e).salaire === petit, JSON.stringify(r1) + ' ' + PATRONS.conditions(ch, e).salaire);
  const ch2 = finDeSaison(nouveau()), e2 = SAISONS.offres(ch2)[0].ecurie, b2 = PATRONS.salaireBase(ch2, e2), m2 = PATRONS.bonusMax(ch2, e2);
  const r2 = PATRONS.dire(ch2, e2, 'je veux ' + Math.round(b2 * (1 + m2 * 1.5)), 'contrats');
  v(r2.reaction === 'contre_offre' && Math.abs(r2.effets.contre - Math.round(m2 * 100) / 100) < 1e-9, JSON.stringify(r2));
  v(PATRONS.intentions(ch2, e2).includes('oui'), 'oui proposé');
  const r3 = PATRONS.dire(ch2, e2, 'ok', 'contrats');
  v(r3.reaction === 'marche_conclu' && PATRONS.conditions(ch2, e2).salaire === Math.round(b2 * (1 + Math.round(m2 * 100) / 100) / 1000) * 1000, JSON.stringify(r3));
  const ch3 = finDeSaison(nouveau()), e3 = SAISONS.offres(ch3)[0].ecurie, b3 = PATRONS.salaireBase(ch3, e3);
  v(PATRONS.dire(ch3, e3, 'je veux ' + b3 * 3, 'contrats').reaction === 'salaire_refuse' && PATRONS.conditions(ch3, e3).bonus === 0, 'beaucoup trop');
  v(PATRONS.dire(ch3, e3, 'i want more money', 'contrats').reaction === 'contre_offre' && PATRONS.dire(ch3, e3, 'non', 'contrats').reaction === 'contre_refusee' && PATRONS.conditions(ch3, e3).bonus === 0, 'contre-offre refusée');
});
t('aux contrats : au CONTRAT_NEGO_REFUS_MAX-ième refus, il ferme la négociation ; une insulte à un autre patron ferme aussi son offre (au salaire de base) ; le statut se négocie sur les points', () => {
  const ch = finDeSaison(nouveau()), e = SAISONS.offres(ch)[0].ecurie, b = PATRONS.salaireBase(ch, e);
  for (let i = 0; i < R.CONTRAT_NEGO_REFUS_MAX; i++) PATRONS.dire(ch, e, 'je veux ' + b * 5, 'contrats');
  v(PATRONS.dire(ch, e, 'je veux un meilleur salaire', 'contrats').reaction === 'ferme', 'fermée');
  const ch2 = finDeSaison(nouveau()), o2 = SAISONS.offres(ch2).find(x => !x.actuelle) || SAISONS.offres(ch2)[0];
  v(PATRONS.dire(ch2, o2.ecurie, 'tocard', 'contrats').reaction === 'vexe' && PATRONS.dire(ch2, o2.ecurie, 'je veux plus d argent', 'contrats').reaction === 'ferme', 'insulte');
  const ch3 = finDeSaison(nouveau()), o3 = SAISONS.offres(ch3)[0], c = o3.coequipier !== null ? ch3.pilotes[o3.coequipier] : null;
  const r = PATRONS.dire(ch3, o3.ecurie, 'je veux être premier pilote', 'contrats'), plus = !c || moi(ch3).stats.points > c.stats.points;
  v(r.reaction === (plus ? 'statut_accepte' : 'statut_refuse') && SAISONS.offres(ch3)[0].statut === (plus ? 'premier' : 'second'), JSON.stringify(r));
});
t('signer : le salaire négocié est versé à la signature et le statut vaut pour la saison suivante ; CONTRAT_SALAIRES_ACTIFS faux : aucun salaire', () => {
  const ch = finDeSaison(nouveau()), o = SAISONS.offres(ch)[0], e = o.ecurie;
  PATRONS.dire(ch, e, 'je veux être premier pilote', 'contrats');
  const cond = PATRONS.conditions(ch, e), avant = ARGENT.solde(ch);
  v(SAISONS.signer(ch, e) && ARGENT.solde(ch) === avant + cond.salaire && ch.saison === 2 && PATRONS.statut(ch) === cond.statut, avant + ' → ' + ARGENT.solde(ch) + ' ' + JSON.stringify(cond) + ' ' + PATRONS.statut(ch));
  R.CONTRAT_SALAIRES_ACTIFS = false;
  try { const ch2 = finDeSaison(nouveau()), a2 = ARGENT.solde(ch2); SAISONS.signer(ch2, SAISONS.offres(ch2)[0].ecurie); v(ARGENT.solde(ch2) === a2 && SAISONS.offres(ch2).every(x => x.salaire === undefined), 'coupé'); }
  finally { R.CONTRAT_SALAIRES_ACTIFS = true; }
});
t('les noms : un ancien rival du parent qui dirige l’écurie (la relève) parle en son nom, sinon « la direction de … » ; jamais de règle nouvelle', () => {
  const ch = nouveau();
  v(PATRONS.nom(ch, 4, NOMS_E) === texte('patronDe').replace('{ecurie}', NOMS_E.ecurie(ch.ecuries[4])), PATRONS.nom(ch, 4, NOMS_E));
  ch.dynastie = { generations: [{ debut: 1, fin: 5 }] }; ch.retraites = [{ id: 99, nom: 'Marco Rossi', numero: 77, saison: 3, role: 'patron', ecurieDirigee: 4 }];
  v(PATRONS.nom(ch, 4, NOMS_E) === 'Marco Rossi' && PATRONS.nom(ch, 5, NOMS_E) !== 'Marco Rossi', PATRONS.nom(ch, 4, NOMS_E));
});
t('le courrier des patrons : une meilleure écurie qui te veut, ton patron déçu après une consigne ignorée ; une fois par saison chacun', () => {
  const ch = nouveau(); SAISONS.avancer(ch, R.COURRIER_PATRON_DES); moi(ch).stats.points = 999;
  COURRIER_PILOTES.apresGrandPrix(ch);
  const veut = ch.courrier.messages.find(m => m.sujet === 'patronVeut');
  v(veut && veut.patron !== moi(ch).ecurie && SAISONS.rangEcurie(ch, veut.patron) < SAISONS.rangEcurie(ch, moi(ch).ecurie), JSON.stringify(ch.courrier.messages));
  PATRONS.noterConsigne(ch, { joueur: true, resultat: 'ignoree' }); ch.resultats.push({ grandPrix: ch.resultats.length + 1, ordre: ch.pilotes.map(p => p.id), duel: null });
  COURRIER_PILOTES.apresGrandPrix(ch);
  const decu = ch.courrier.messages.find(m => m.sujet === 'patronDecu');
  v(decu && decu.patron === moi(ch).ecurie && decu.cle === 'courrier_patronDecu_consigne', JSON.stringify(ch.courrier.messages.slice(-3)));
  v(COURRIER_PILOTES.texteDe(ch, decu, NOMS_E).length > 10 && COURRIER_PILOTES.texteDe(ch, veut, NOMS_E).includes(NOMS_E.ecurie(ch.ecuries[veut.patron])), 'textes');
  const n = ch.courrier.messages.filter(m => m.sujet === 'patronVeut').length;
  ch.resultats.push({ grandPrix: ch.resultats.length + 1, ordre: ch.pilotes.map(p => p.id), duel: null }); COURRIER_PILOTES.apresGrandPrix(ch);
  v(ch.courrier.messages.filter(m => m.sujet === 'patronVeut').length === n, 'une fois par saison');
});
t('les patrons : chaque réaction et chaque raison a son texte en fr et en en ; le composeur (confiance, statut, budget, consignes, salaire) repart dans la même lecture ; sans nom, « Toi » n’est jamais écrit comme un prénom', () => {
  const reactions = ['salut', 'salut_contrat', 'adieu', 'merci', 'vexe', 'confiance_haute', 'confiance_moyenne', 'confiance_basse', 'interesse', 'pas_interesse', 'pas_offre', 'ferme', 'statut_accepte', 'statut_refuse', 'statut_deja',
    'budget_deja', 'budget_accepte', 'budget_refuse', 'consigne_premier', 'consigne_rappel', 'consigne_explique', 'salaire_plus_tard', 'salaire_refuse', 'salaire_accepte', 'contre_offre', 'marche_conclu', 'contre_refusee', 'accord_vague', 'refus_vague', 'pas_mon_role', 'incompris'];
  const raisons = ['au_dessus', 'en_dessous', 'comme_prevu', 'consigne_ignoree', 'consigne_suivie', 'confiance', 'offre_fermee', 'points', 'coequipier_meilleur', 'duel_gagne', 'duel_pas_assez', 'en_dessous_budget', 'trop_tot', 'pas_assez_envie', 'trop', 'veut_beaucoup', 'veut_un_peu'];
  const manque = reactions.map(r => 'pat_' + r).concat(raisons.map(r => 'pat_raison_' + r)).filter(c => !TEXTES.fr[c] || !TEXTES.en[c]);
  v(!manque.length, 'manquent : ' + manque.join(', '));
  const ch = nouveau(), att = { confiance: ['AVIS', 'QUESTION'], statut: ['STATUT'], budget: ['BUDGET'], consigne: ['CONSIGNE'], salaire: ['SALAIRE'] }, fautes = [];
  for (const L_ of ['fr', 'en']) for (const [i, a] of Object.entries(att)) { const ph = DISCUSSION.composer(ch, i, {}, L_), x = PARLE.comprendre(ph, []).acte; if (!a.includes(x)) fautes.push(L_ + ' ' + i + ' « ' + ph + ' » → ' + x); }
  v(!fautes.length, fautes.join(' ; '));
  v(PATRONS.intentions(ch, moi(ch).ecurie).join() === 'saluer,confiance,statut,budget,consigne,adieu', PATRONS.intentions(ch, moi(ch).ecurie).join());
  // sans nom : « Salut, on partage… » (le courrier) et « Bonjour. Ma porte… » (le patron), jamais « Salut Toi »
  moi(ch).nom = null;
  const m = { k: CHAMPIONNAT.coequipierDe(ch).id, sujet: 'bienvenue', cle: 'courrier_bienvenue', saison: 1, gp: 1, lu: false };
  const tx = COURRIER_PILOTES.texteDe(ch, m, NOMS_E), salut = PATRONS.dire(ch, moi(ch).ecurie, 'salut', 'championnat', NOMS_E).texte;
  v(!tx.includes(texte('nomJoueur')) && !salut.includes(texte('nomJoueur')) && /^[A-ZÀ-Ý]/.test(tx), tx + ' / ' + salut);
});
t('les patrons ne touchent ni aux pilotes ni à la course : une discussion ne change que leur mémoire, ton statut, la confiance et le solde', () => {
  const ch = nouveau(), e = moi(ch).ecurie, avant = JSON.stringify(ch.pilotes);
  for (const ph of ['salut', 'tocard', 'premier pilote', 'plus de budget', 'les consignes', 'ton avis']) PATRONS.dire(ch, e, ph, 'championnat');
  v(JSON.stringify(ch.pilotes) === avant, 'les pilotes ont changé');
});
t('la console reste vide', () => { v(typeof __err === 'undefined' || !__err.length, typeof __err !== 'undefined' ? __err.join(' | ') : ''); });
ecrire();
