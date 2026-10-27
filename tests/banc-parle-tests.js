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
t('la console reste vide', () => { v(typeof __err === 'undefined' || !__err.length, typeof __err !== 'undefined' ? __err.join(' | ') : ''); });
ecrire();
