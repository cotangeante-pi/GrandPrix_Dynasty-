// Les discussions avec les pilotes (Codeur 3, étape 12b, CLAUDE.md « Les discussions avec les pilotes et les écuries ») : calcul pur,
// sans écran. Le joueur écrit (PARLE.comprendre lit la phrase) ou compose au clic (composer() en fait une phrase de la langue du jeu,
// qui repart dans la même lecture). L'interlocuteur raisonne (raisonner) depuis ce qu'il est et ce qu'il sait : son caractère
// (agressivité, régularité, erreurs), sa relation avec le joueur, sa rivalité (la bête noire de l'interview), la dernière course
// (un contact, un dépassement), le duel s'il est le coéquipier, et sa mémoire (les promesses, les menaces). La réponse est composée
// depuis ce raisonnement : une réaction (dis_<reaction>) et ses raisons (dis_raison_<raison>), des textes de textes.js en + fr.
// Les effets sont petits et plafonnés (DISCUSSION_* dans donnees.js) : la relation, la rivalité, la confiance de l'écurie (le
// coéquipier), la disposition à laisser passer (gardée pour la prochaine course, lue plus tard par le pilotage) ; jamais de triche.
// Le tirage des variantes a sa suite à lui (ALEATOIRE.suite) : une discussion ne dérange jamais le hasard d'une course.
const DISCUSSION = (function () {
  const R = REGLAGES;
  const borne = (x, a, b) => Math.max(a, Math.min(b, x));
  // où l'on peut discuter : entre deux Grands Prix (le paddock et ses écrans), jamais pendant une course
  const ECRANS_PERMIS = ['championnat', 'fiche', 'discussion', 'courrier', 'contrats'];
  const peutDiscuter = ecran => ECRANS_PERMIS.includes(ecran);

  const joueur = ch => ch.pilotes.find(p => p.humain);
  const nomDe = p => p.nom || (p.humain ? texte('nomJoueur') : texte('pilote').replace('{n}', p.numero));
  // les pilotes qu'on peut nommer dans une phrase (« bloque Rossi pour moi »)
  const noms = ch => ch.pilotes.filter(p => !p.humain).map(p => ({ k: p.id, nom: nomDe(p) }));

  // la mémoire d'un pilote, créée à la première discussion (une ancienne sauvegarde n'en a pas : rien à faire). Compacte :
  // relation (−DISCUSSION_RELATION_MAX..+), les derniers actes ([acte, saison, gp]), une promesse, une menace, une demande en attente
  function memoire(p) {
    if (!p.memoire || typeof p.memoire !== 'object') p.memoire = {};
    const m = p.memoire;
    if (typeof m.relation !== 'number') m.relation = 0;
    if (!Array.isArray(m.dits)) m.dits = [];
    if (m.promesse === undefined) m.promesse = null;
    if (m.menace === undefined) m.menace = null;
    if (m.demande === undefined) m.demande = null;
    if (typeof m.credit !== 'number') m.credit = 0;
    if (!Array.isArray(m.souvenirs)) m.souvenirs = [];   // (tour 36d) les moments marquants, gardés plus longtemps : [acte, saison, gp]
    return m;
  }
  const gpActuel = ch => ({ saison: ch.saison, gp: ch.resultats.length });   // le dernier Grand Prix couru (0 : aucun)

  // ce qu'il sait de la dernière course : le contact et le dépassement (l'interview les a relevés, ch.interview.derniere.faitsGP)
  function derniereCourse(ch, k) {
    const d = ch.interview && ch.interview.derniere, f = d && d.faitsGP;
    const recent = d && d.saison === ch.saison && d.gp === ch.resultats.length;
    const circuit = ch.calendrier[ch.resultats.length - 1] ? ch.calendrier[ch.resultats.length - 1].circuit : null;
    return { contact: !!(recent && f && f.contact === k), depasse: !!(recent && f && f.depasse === k), circuit };
  }
  // sa place au championnat (1 = en tête) et celle du joueur
  function places(ch, k) {
    const cl = CHAMPIONNAT.classementPilotes(ch), j = joueur(ch);
    return { lui: cl.findIndex(x => x.k === k) + 1, joueur: cl.findIndex(x => x.k === j.id) + 1, n: cl.length };
  }
  const caractere = p => p.caractere || { agressivite: 0.5, regularite: 0.5, erreurs: 0.5 };
  // le joueur sans nom (« Toi » / « You ») n'est pas appelé comme un prénom : « Salut {nom}. » devient « Salut. » (et la phrase
  // garde sa majuscule)
  function sansNom(t) {
    const r = t.replace(/,\s*\{nom\}/g, '').replace(/\s+\{nom\}/g, '').replace(/\{nom\},\s*/g, '').replace(/\{nom\}/g, '');
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  // --- tour 36d (Codeur 4) : ce qu'il sait vraiment, pour le dire (jamais un fait inventé) : sa place et la tienne au championnat,
  // les points d'écart, vos places à la dernière course et son circuit, le duel s'il est ton coéquipier
  function faits(ch, k) {
    const j = joueur(ch), pl = places(ch, k), lui = ch.pilotes[k];
    const f = { p_lui: pl.lui, p_joueur: pl.joueur, ecart: Math.abs((lui.stats ? lui.stats.points : 0) - (j.stats ? j.stats.points : 0)),
      devant: (lui.stats ? lui.stats.points : 0) - (j.stats ? j.stats.points : 0), course: null, duel: null };
    const r = ch.resultats[ch.resultats.length - 1], gp = ch.calendrier[ch.resultats.length - 1];
    if (r && Array.isArray(r.ordre) && r.ordre.includes(k) && r.ordre.includes(j.id)) f.course = { a: r.ordre.indexOf(k) + 1, b: r.ordre.indexOf(j.id) + 1, circuit: gp ? gp.circuit : null };
    const co = CHAMPIONNAT.coequipierDe(ch), sd = co && co.id === k ? CHAMPIONNAT.scoreDuel(ch) : null;
    if (sd) f.duel = { moi: sd.total[0], lui: sd.total[1] };
    return f;
  }
  // un souvenir marquant d'un Grand Prix d'avant (pas celui-ci) : la dernière insulte ou menace, le dernier compliment ou excuse
  function souvenir(ch, m, genre) {
    const actes = genre === 'mauvais' ? ['INSULTE', 'MENACE'] : ['COMPLIMENT', 'EXCUSE', 'PAIX', 'MERCI'];
    const g = gpActuel(ch);
    for (let i = m.souvenirs.length - 1; i >= 0; i--) {
      const [a, s, gp] = m.souvenirs[i];
      if (s === g.saison && gp === g.gp) continue;
      if (actes.includes(a)) return { acte: a, saison: s, gp };
    }
    return null;
  }

  // --- (tour 36, Codeur 3) la conversation en cours : ce qui s'est dit à ce Grand Prix ([acte, reaction, raisons]), et le bilan de la
  // conversation du Grand Prix d'avant (somme : ce que la relation y a gagné ou perdu ; circuit ; la dernière réaction). Lecture seule
  const cleGP = ch => ch.saison * 100 + ch.resultats.length;
  function conversation(ch, m) {
    const cle = cleGP(ch), ici = m.convCle === cle && Array.isArray(m.conv) ? m.conv : [];
    const precedente = m.convCle !== undefined && m.convCle !== cle && Array.isArray(m.conv) && m.conv.length ? bilanConv(m) : (m.precedente || null);
    return { ici, precedente, somme: m.gpRel && m.gpRel[0] === cle ? m.gpRel[1] : 0 };
  }
  function bilanConv(m) {
    return { cle: m.convCle, somme: m.gpRel && m.gpRel[0] === m.convCle ? m.gpRel[1] : 0, fin: m.conv.length ? m.conv[m.conv.length - 1][1] : null, circuit: m.convCircuit || null };
  }
  // les actes qu'on ne pose pas deux fois dans la même conversation sans qu'il le remarque, et sa réaction la deuxième fois
  const DEJA = { SALUT: 'deja_salut', AVIS: 'deja_avis', ETAT: 'deja_etat', DUEL: 'deja_duel', CONTACT: 'deja_contact', RECLAMATION: 'deja_contact', INCONNU: 'incompris_encore', QUESTION: 'incompris_encore' };
  const GENTILS = ['EXCUSE', 'PAIX', 'COMPLIMENT', 'MERCI'], MECHANTS = ['INSULTE', 'MENACE'];
  const SUJETS = ['depart', 'stands', 'pluie', 'qualif', 'virage', 'aspiration'];

  // ce que la conversation change au raisonnement de base : il remarque une question déjà posée, il relève une contradiction (une
  // insulte après des excuses, un compliment après une insulte), il ne répète pas une raison déjà dite, il se souvient du ton de votre
  // dernière conversation (un autre Grand Prix), il parle du moment nommé (le départ, les stands…) et dit franchement s'il ne sait pas
  // (un tour précis), et il conclut une longue conversation selon son ton
  function suiteConversation(ch, m, a, r) {
    const cv = conversation(ch, m), ici = cv.ici, actes = ici.map(x => x[0]), dits = new Set([].concat(...ici.map(x => x[2] || [])));
    let { reaction, raisons } = r;
    const effets = Object.assign({}, r.effets);
    if (reaction === 'occupe') return r;
    // une question déjà posée (pas la menace, l'insulte ou l'excuse : celles-là ont leur propre réaction)
    // (seulement si sa réponse de base serait la même que la première fois : si la situation a changé, il répond à nouveau)
    if (DEJA[a.acte] && ici.some(x => x[0] === a.acte && (x[3] || x[1]) === r.reaction) && !(a.acte === 'SALUT' && ici.length > 6)) {
      reaction = DEJA[a.acte]; raisons = [];
      for (const x of ['relation', 'rivalite', 'disposition', 'promesse', 'menace', 'demande', 'souvenir']) delete effets[x];
    }
    // les contradictions de la conversation
    if (MECHANTS.includes(a.acte) && actes.some(x => GENTILS.includes(x))) raisons = ['contradiction_gentil'].concat(raisons);
    if (GENTILS.includes(a.acte) && actes.some(x => MECHANTS.includes(x))) {
      raisons = ['contradiction_mechant'].concat(raisons);
      if (reaction === 'flatte') reaction = 'flatte_mefiant';
    }
    // une réaction conciliante ne s'accompagne pas d'un reproche sur le contact : il le dit réglé
    if (['contact_regrette', 'excuse_acceptee', 'reclamation_ami', 'reclamation_explique', 'paix_acceptee'].includes(reaction)) raisons = raisons.map(x => x === 'contact' ? 'contact_regle' : x);
    // des excuses déjà acceptées dans cette conversation : le contact est réglé, il ne le ressort plus
    if (ici.some(x => x[1] === 'excuse_acceptee' || x[1] === 'paix_acceptee')) {
      raisons = raisons.filter(x => x !== 'contact' && x !== 'contact_regle' && x !== 'rivalite');
      if (['AVIS', 'ADIEU'].includes(a.acte)) raisons.push('excuse_recue');
    }
    // une raison n'est dite qu'une fois par conversation (sauf la promesse trahie : il y tient)
    raisons = raisons.filter(x => x === 'promesse_trahie' || x.startsWith('contradiction_') || !dits.has(x));
    // le premier message de cette conversation : le ton de la dernière (un autre Grand Prix)
    if (!ici.length && cv.precedente && ['SALUT', 'AVIS', 'ETAT', 'QUESTION'].includes(a.acte)) {
      if (cv.precedente.somme <= -R.DISCUSSION_BILAN) raisons.push('derniere_fois_mauvais');
      else if (cv.precedente.somme >= R.DISCUSSION_BILAN) raisons.push('derniere_fois_bon');
    }
    // le moment nommé dans la phrase (parle.js : a.sujet, a.tour) ; il ne connaît pas le tour exact d'un contact (le moteur ne le garde pas)
    if (['CONTACT', 'RECLAMATION'].includes(a.acte) && reaction !== DEJA[a.acte]) {
      if (a.tour) raisons.push('tour_inconnu');
      else if (a.sujet && SUJETS.includes(a.sujet)) raisons.push('sujet_' + a.sujet);
    }
    // conclure une longue conversation
    if (a.acte === 'ADIEU' && ici.length >= R.DISCUSSION_CONV_LONGUE) raisons.push(cv.somme >= R.DISCUSSION_BILAN ? 'conversation_bonne' : cv.somme <= -R.DISCUSSION_BILAN ? 'conversation_mauvaise' : 'conversation_neutre');
    return Object.assign({}, r, { reaction, raisons, effets, base: r.reaction });
  }

  // --- le raisonnement : { reaction, raisons: [cles], effets: { relation, rivalite ('nouvelle' | 'apaisee'), confiance,
  // disposition ('laisser' | 'bloquer'), promesse, menace, demande } }. Aucun effet n'est appliqué ici (appliquer le fait).
  function raisonner(ch, k, a) {
    const p = ch.pilotes[k], m = memoire(p.memoire ? p : {}), c = caractere(p), co = CHAMPIONNAT.coequipierDe(ch), coequipier = !!(co && co.id === k);
    const dc = derniereCourse(ch, k), pl = places(ch, k), rel = m.relation, riv = !!p.rivalite;
    const AMI = R.DISCUSSION_AMI, ENNEMI = -R.DISCUSSION_ENNEMI, P = R.DISCUSSION_PAS, fougueux = c.agressivite >= R.DISCUSSION_FOUGUEUX;
    const raisons = [], effets = {}, garde = x => raisons.push(x);
    // ce qu'il garde en tête avant de répondre : une promesse trahie, une menace restée sans suite, la rivalité, le contact
    if (m.promesse && m.promesse.etat === 'trahie') garde('promesse_trahie');
    if (m.credit < 0) garde('menace_vide');
    let reaction;
    // trop de messages pour ce Grand Prix : il ne répond plus (la mémoire compte ses derniers actes)
    const ici = conversation(ch, m).ici.length;   // (tour 36 : la conversation de ce Grand Prix, gardée en entier jusqu'à DISCUSSION_CONV_MAX)
    if (ici >= R.DISCUSSION_PAR_GP) return { reaction: 'occupe', raisons: [], effets: {} };
    switch (a.acte) {
      case 'SALUT':
        reaction = rel >= AMI ? 'salut_chaud' : rel <= ENNEMI || riv ? 'salut_froid' : 'salut';
        if (riv) garde('rivalite');
        break;
      case 'ADIEU': reaction = rel <= ENNEMI || riv ? 'adieu_froid' : 'adieu'; break;
      case 'MERCI': reaction = 'merci'; effets.relation = Math.min(P, 1); break;
      case 'INSULTE':
        if (a.ironie) { reaction = 'rit'; effets.relation = -Math.round(P / 4); break; }
        // le fougueux riposte et en fait une affaire de piste (la rivalité) ; le calme laisse glisser, mais il s'en souvient
        if (fougueux) { reaction = 'riposte'; effets.rivalite = 'nouvelle'; garde('fougueux'); }
        else reaction = 'ignore';
        effets.relation = -P;
        if (coequipier) { effets.confiance = -R.DISCUSSION_CONFIANCE; garde('equipe'); }
        if (dc.contact) garde('contact');
        break;
      case 'MENACE':
        effets.menace = true; effets.relation = -P;
        if (fougueux) { reaction = 'defi'; effets.rivalite = 'nouvelle'; garde('fougueux'); } else reaction = 'mefiant';
        if (m.credit < 0) reaction = 'menace_moquee';
        break;
      case 'EXCUSE':
        if (dc.contact) {
          // il accepte les excuses s'il ne te déteste pas déjà, et s'il n'est pas trop fougueux pour pardonner tout de suite
          const accepte = rel > ENNEMI && c.agressivite < R.DISCUSSION_RANCUNE;
          reaction = accepte ? 'excuse_acceptee' : 'excuse_refusee'; garde('contact');
          if (accepte) { effets.relation = P; if (riv) effets.rivalite = 'apaisee'; } else { effets.relation = 1; garde(rel <= ENNEMI ? 'relation_mauvaise' : 'fougueux'); }
        } else { reaction = riv ? 'excuse_acceptee' : 'excuse_sans_objet'; effets.relation = riv ? P : 1; if (riv) { effets.rivalite = 'apaisee'; garde('rivalite'); } }
        break;
      case 'PAIX':
        if (rel <= ENNEMI - R.DISCUSSION_ENNEMI) { reaction = 'paix_refusee'; garde('relation_mauvaise'); effets.relation = 1; }
        else { reaction = riv || rel < 0 ? 'paix_acceptee' : 'paix_deja'; effets.relation = Math.round(P / 2); if (riv) { effets.rivalite = 'apaisee'; garde('rivalite'); } }
        break;
      case 'COMPLIMENT':
        reaction = riv || rel <= ENNEMI ? 'flatte_mefiant' : 'flatte'; effets.relation = riv ? 1 : Math.round(P / 2);
        if (pl.lui && pl.lui <= 3) garde('en_forme');
        break;
      case 'CONTACT':
        if (!dc.contact) { reaction = 'contact_inconnu'; break; }
        garde('contact');
        if (fougueux) { reaction = 'contact_assume'; effets.relation = -Math.round(P / 2); } else { reaction = 'contact_regrette'; effets.relation = 1; }
        break;
      case 'RECLAMATION': {
        // (tour 36d) « pk tu m'as bloqué » : le fougueux assume (il défendait sa place), le calme s'explique, un ami s'excuse à moitié
        if (dc.contact) garde('contact');
        if (rel >= AMI) { reaction = 'reclamation_ami'; effets.relation = 1; }
        else if (fougueux || riv) { reaction = 'reclamation_assume'; effets.relation = -1; if (riv) garde('rivalite'); }
        else { reaction = 'reclamation_explique'; }
        break;
      }
      case 'PASSER': {
        // laisser passer le joueur à la prochaine course : le coéquipier l'envisage (même écurie), un rival seulement s'il l'aime bien
        const promet = a.jetons.includes('rendre9');
        let note = rel / R.DISCUSSION_RELATION_MAX + (1 - c.agressivite) * 0.5 + (promet ? R.DISCUSSION_POIDS_PROMESSE : 0) - (riv ? 1 : 0) + (coequipier ? 0.25 : -0.5);
        if (m.promesse && m.promesse.etat === 'trahie') note -= 1;
        if (coequipier && ch.resultats.length && p.stats && joueur(ch).stats && p.stats.points > joueur(ch).stats.points) { note -= 0.3; garde('devant_toi'); }
        if (note >= R.DISCUSSION_SEUIL_PASSER) {
          reaction = coequipier ? 'passer_accepte' : 'passer_accepte_rival'; effets.disposition = 'laisser';
          if (promet) effets.promesse = 'joueur'; else effets.demande = 'rendre';   // sans promesse, il la demande (« tu me rendras la pareille ? »)
        } else { reaction = coequipier ? 'passer_refuse' : 'passer_rit'; if (riv) garde('rivalite'); }
        break;
      }
      case 'PROMESSE': reaction = 'promesse_notee'; effets.promesse = 'joueur'; effets.relation = 1; break;
      case 'BLOQUER': {
        const cible = a.cible;
        if (cible === null || cible === undefined) { reaction = 'bloquer_qui'; break; }
        if (cible === k) { reaction = 'bloquer_absurde'; break; }
        // il retient un pilote pour toi si c'est son intérêt (le pilote visé est devant lui au championnat) et s'il ne te déteste pas
        const plc = places(ch, cible).lui, interet = plc && pl.lui && plc < pl.lui;
        if (interet && rel >= 0 && !riv) { reaction = 'bloquer_accepte'; effets.disposition = 'bloquer'; effets.cible = cible; garde('interet'); }
        else { reaction = 'bloquer_refuse'; garde(interet ? 'relation_mauvaise' : 'pas_interet'); }
        break;
      }
      case 'AVIS':
        reaction = rel >= AMI ? 'avis_bon' : rel <= ENNEMI || riv ? 'avis_mauvais' : 'avis_neutre';
        if (dc.contact) garde('contact'); if (riv) garde('rivalite'); if (dc.depasse) garde('depasse');
        break;
      case 'ETAT': reaction = !ch.resultats.length ? 'etat_debut' : pl.lui <= 5 ? 'etat_bien' : pl.lui <= 12 ? 'etat_moyen' : 'etat_mal'; break;
      case 'DUEL': {
        if (!coequipier) { reaction = 'duel_pas_coequipier'; break; }
        const sd = CHAMPIONNAT.scoreDuel(ch), t = sd ? sd.total : [0, 0];
        reaction = t[1] > t[0] ? 'duel_devant' : t[1] < t[0] ? 'duel_derriere' : 'duel_egal';
        break;
      }
      case 'SALAIRE': case 'STATUT': reaction = 'contrat_pas_moi'; break;
      case 'ACCORD': case 'REFUS': {
        // une réponse à sa demande en attente (« tu me rendras la pareille ? ») : la promesse est faite, ou refusée ; ou à sa
        // demande de te rendre la pareille (la promesse d'avant) : tenue ou trahie
        const d = m.demande;
        if (d && d.type === 'rendre') { reaction = a.acte === 'ACCORD' ? 'promesse_notee' : 'promesse_refusee'; effets.demande = null; if (a.acte === 'ACCORD') effets.promesse = 'joueur'; else effets.relation = -Math.round(P / 2); }
        else if (d && d.type === 'tenir') { reaction = a.acte === 'ACCORD' ? 'promesse_tenue' : 'promesse_trahie'; effets.demande = null; effets.tenir = a.acte === 'ACCORD'; effets.relation = a.acte === 'ACCORD' ? P : -P; }
        else reaction = a.acte === 'ACCORD' ? 'accord_vague' : 'refus_vague';
        break;
      }
      case 'QUESTION': reaction = 'question'; break;
      default: reaction = 'incompris';
    }
    // (tour 36d) ce qu'il ajoute, tiré des faits vrais : sa place et la tienne, les points d'écart, la dernière course, le duel
    const f = faits(ch, k), dejaCourse = ch.resultats.length > 0;
    if (dejaCourse && ['ETAT'].includes(a.acte)) garde(f.devant > 0 ? 'fait_devant' : f.devant < 0 ? 'fait_derriere' : 'fait_egalite');
    if (dejaCourse && f.course && ['AVIS', 'CONTACT', 'RECLAMATION', 'COMPLIMENT'].includes(a.acte)) garde(f.course.a < f.course.b ? 'fait_course_devant' : 'fait_course_derriere');
    if (dejaCourse && a.acte === 'INSULTE' && f.devant > 0 && !a.ironie) garde('fait_devant');
    if (f.duel && a.acte === 'DUEL') garde('fait_duel');
    // (tour 36d) la mémoire sur plusieurs Grands Prix : il rappelle une insulte ancienne quand on revient le voir gentiment, ou un
    // compliment ancien quand on l'insulte ; une fois par Grand Prix au plus
    const g = gpActuel(ch), cleGp = g.saison * 100 + g.gp;
    if (m.rappel !== cleGp) {
      const vieux = ['SALUT', 'COMPLIMENT', 'PASSER', 'AVIS', 'ETAT', 'PAIX'].includes(a.acte) ? souvenir(ch, m, 'mauvais') : ['INSULTE', 'MENACE'].includes(a.acte) ? souvenir(ch, m, 'bon') : null;
      if (vieux) { garde(vieux.acte === 'MENACE' ? 'souvenir_menace' : vieux.acte === 'INSULTE' ? 'souvenir_insulte' : 'souvenir_gentil'); effets.souvenir = vieux; }
    }
    return suiteConversation(ch, m, a, { reaction, raisons, effets, faits: f });
  }

  // applique les effets d'un raisonnement, chacun avec son plafond : la relation entre ±DISCUSSION_RELATION_MAX (jamais plus de
  // DISCUSSION_PAS par message), la rivalité (posée pour DISCUSSION_RIVALITE_COURSES courses, ou effacée), la confiance de l'écurie
  // (la jauge « écurie » de l'interview, ±DISCUSSION_CONFIANCE), la disposition pour la prochaine course, la promesse, la menace
  function appliquer(ch, k, r, acte) {
    const p = ch.pilotes[k], m = memoire(p), e = r.effets, g = gpActuel(ch);
    // (tour 36d) la relation bouge lentement : jamais plus de DISCUSSION_PAS par message, ni plus de DISCUSSION_PAS_GP sur un même
    // Grand Prix (dix compliments d'affilée ne font pas un ami)
    if (e.relation) {
      const cle = g.saison * 100 + g.gp;
      if (!m.gpRel || m.gpRel[0] !== cle) m.gpRel = [cle, 0];
      const voulu = borne(e.relation, -R.DISCUSSION_PAS, R.DISCUSSION_PAS), dispo = R.DISCUSSION_PAS_GP - Math.abs(m.gpRel[1] + voulu) >= 0 ? voulu
        : borne(voulu, -R.DISCUSSION_PAS_GP - m.gpRel[1], R.DISCUSSION_PAS_GP - m.gpRel[1]);
      m.gpRel[1] += dispo;
      m.relation = borne(m.relation + dispo, -R.DISCUSSION_RELATION_MAX, R.DISCUSSION_RELATION_MAX);
    }
    if (['INSULTE', 'MENACE', 'COMPLIMENT', 'EXCUSE', 'PAIX'].includes(acte)) { m.souvenirs.push([acte, g.saison, g.gp]); if (m.souvenirs.length > R.DISCUSSION_SOUVENIRS) m.souvenirs.splice(0, m.souvenirs.length - R.DISCUSSION_SOUVENIRS); }
    if (e.souvenir) m.rappel = g.saison * 100 + g.gp;
    if (e.rivalite === 'nouvelle') p.rivalite = { courses: R.DISCUSSION_RIVALITE_COURSES, gp: g.gp, saison: g.saison, cle: 'discussion_' + r.reaction, params: {}, circuit: derniereCourse(ch, k).circuit };
    if (e.rivalite === 'apaisee') delete p.rivalite;
    if (e.confiance && ch.reputation) { const c = borne(e.confiance, -R.DISCUSSION_CONFIANCE, R.DISCUSSION_CONFIANCE); ch.reputation.ecurie = borne(ch.reputation.ecurie + c, 0, 100); ch.confiance = ch.reputation.ecurie; }
    if (e.disposition) p.disposition = { type: e.disposition, saison: g.saison, gp: g.gp + 1, cible: e.cible !== undefined ? e.cible : null };   // pour le prochain Grand Prix seulement
    if (e.promesse === 'joueur') m.promesse = { saison: g.saison, gp: g.gp, etat: 'ouverte' };
    if (e.tenir !== undefined && m.promesse) m.promesse.etat = e.tenir ? 'tenue' : 'trahie';
    if (e.menace) m.menace = { saison: g.saison, gp: g.gp };
    if (e.demande === 'rendre') m.demande = { type: 'rendre', saison: g.saison, gp: g.gp };
    else if (e.demande === null) m.demande = null;
    m.dits.push([acte, g.saison, g.gp]);
    if (m.dits.length > R.DISCUSSION_MEMOIRE) m.dits.splice(0, m.dits.length - R.DISCUSSION_MEMOIRE);
    // (tour 36, Codeur 3) la conversation de ce Grand Prix ; au premier message d'un nouveau Grand Prix, celle d'avant devient son bilan
    const cle = cleGP(ch);
    if (m.convCle !== cle) {
      if (m.convCle !== undefined && Array.isArray(m.conv) && m.conv.length) m.precedente = bilanConv(m);
      m.conv = []; m.convCle = cle; m.convCircuit = derniereCourse(ch, k).circuit;
    }
    m.conv.push([acte, r.reaction || null, (r.raisons || []).slice(), r.base || r.reaction || null]);
    if (m.conv.length > R.DISCUSSION_CONV_MAX) m.conv.splice(0, m.conv.length - R.DISCUSSION_CONV_MAX);
  }

  // la phrase de la réponse : la réaction (une variante tirée), puis ses raisons, avec les noms et le circuit
  function composerReponse(ch, k, r) {
    const p = ch.pilotes[k], m = memoire(p), dc = derniereCourse(ch, k);
    const alea = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_DISCUSSION + k * 101 + m.dits.length * 7 + ch.resultats.length * 1009);
    // (tour 36d) le ton suit le caractère : une variante « vive » pour le fougueux, « douce » pour le calme, s'il y en a ; jamais deux
    // fois de suite la même réponse au même pilote (m.derniere : la dernière réponse, gardée)
    const ag = caractere(p).agressivite, ton = ag >= R.DISCUSSION_FOUGUEUX ? '_vif' : ag <= R.DISCUSSION_DOUX ? '_doux' : '';
    const existe = cle => TEXTES[LANGUE][cle] !== undefined || TEXTES.en[cle] !== undefined;   // (sans appeler texte() pour une clé de ton absente)
    const liste = cle => { const v = texte(cle), w = ton && existe(cle + ton) ? texte(cle + ton) : null; const a = Array.isArray(v) ? v : v ? [v] : []; return Array.isArray(w) ? a.concat(w, w) : a; };
    const choisir = cle => { const v = liste(cle); return v.length ? v[Math.floor(alea() * v.length)] : ''; };
    const choisirAutre = (cle, eviter) => { const v = liste(cle); if (!v.length) return ''; let i = Math.floor(alea() * v.length); for (let n = 0; n < v.length && eviter && eviter.startsWith(v[i]); n++) i = (i + 1) % v.length; return v[i]; };
    const circuit = dc.circuit ? (texte('circuit_' + dc.circuit) || dc.circuit) : '';
    const promesse = m.promesse && m.promesse.gp ? (ch.calendrier[m.promesse.gp - 1] ? texte('circuit_' + ch.calendrier[m.promesse.gp - 1].circuit) || '' : '') : '';
    const f = r.faits || {}, nomCircuit = c => c ? texte('circuit_' + c) || c : '';
    const sv = r.effets.souvenir, svGp = sv ? (sv.saison === ch.saison ? ch.calendrier[sv.gp - 1] : null) : null;
    const vals = { nom: nomDe(joueur(ch)), lui: nomDe(p), circuit, promesse,
      p_lui: f.p_lui, p_joueur: f.p_joueur, ecart: f.ecart, a: f.course ? f.course.a : '', b: f.course ? f.course.b : '', circuit_course: f.course ? nomCircuit(f.course.circuit) : '',
      duel_moi: f.duel ? f.duel.moi : '', duel_lui: f.duel ? f.duel.lui : '', souvenir_circuit: svGp ? nomCircuit(svGp.circuit) : texte('dis_avant'),
      cible: r.effets.cible !== undefined && ch.pilotes[r.effets.cible] ? nomDe(ch.pilotes[r.effets.cible]) : '',
      // (tour 36, Codeur 3) le circuit de votre dernière conversation, le tour nommé dans la phrase
      circuit_avant: (() => { const pc = conversation(ch, m).precedente; return pc && pc.circuit ? nomCircuit(pc.circuit) : texte('dis_avant'); })(), tour: r.tour !== undefined && r.tour !== null ? r.tour : '' };
    const anonyme = !joueur(ch).nom;
    const remplir = t => (anonyme ? sansNom(t) : t).replace(/\{(\w+)\}/g, (x, c) => vals[c] !== undefined ? vals[c] : x);
    const morceaux = [remplir(choisirAutre('dis_' + r.reaction, m.derniere ? m.derniere.split(' ¦ ')[0] : null))];
    for (const raison of r.raisons) {
      let t = remplir(choisir('dis_raison_' + raison));
      // (tour 36) un circuit déjà nommé dans la réponse n'est pas répété : la variante courte de la raison (sans circuit), s'il y en a une
      const deja = [vals.circuit, vals.circuit_course].filter(x => x && morceaux.some(mo => mo.includes(x)));
      if (t && deja.some(x => t.includes(x)) && existe('dis_raison_' + raison + '_court')) t = remplir(choisir('dis_raison_' + raison + '_court'));
      if (t) morceaux.push(t);
    }
    let phrase = morceaux.join(' ');
    phrase = typeof elider === 'function' ? elider(phrase) : phrase;
    return phrase;
  }

  // dire(ch, k, txt) : le joueur écrit à un pilote ; renvoie { analyse, reaction, raisons, effets, texte } et applique les effets
  function dire(ch, k, txt, ecran) {
    if (ecran !== undefined && !peutDiscuter(ecran)) return null;   // jamais pendant une course
    const p = ch.pilotes[k];
    if (!p || p.humain) return null;
    const analyse = PARLE.comprendre(txt, noms(ch)), r = raisonner(ch, k, analyse);
    if (analyse.tour !== undefined && analyse.tour !== null) r.tour = analyse.tour;
    appliquer(ch, k, r, analyse.acte);
    let rep = composerReponse(ch, k, r), reactions = [r.reaction];
    // (tour 36d) deux idées dans la phrase : il répond aussi à la seconde (une phrase de plus, sans ses raisons) ; ses effets passent
    // par les mêmes plafonds (la relation ne bouge pas plus vite pour autant)
    if (analyse.second && !['occupe'].includes(r.reaction)) {
      const r2 = raisonner(ch, k, Object.assign({}, analyse, { acte: analyse.second, second: null }));
      if (r2.reaction !== r.reaction && r2.reaction !== 'occupe') {
        appliquer(ch, k, { effets: { relation: r2.effets.relation || 0 } }, analyse.second);
        rep = composerReponse(ch, k, Object.assign({}, r2, { raisons: [] })) + ' ' + rep;
        reactions.unshift(r2.reaction);
      }
    }
    const m = memoire(p);
    if (m.derniere && m.derniere === rep) rep = rep + ' ' + texte('dis_encore');   // (jamais tout à fait la même réponse deux fois de suite)
    m.derniere = rep;
    return { analyse, reaction: r.reaction, reactions, raisons: r.raisons, effets: r.effets, faits: r.faits, texte: rep };
  }

  // --- le composeur au clic : une intention et ses paramètres (la cible, la promesse), en une phrase de la langue du jeu ---
  const INTENTIONS = ['saluer', 'feliciter', 'excuser', 'paix', 'contact', 'passer', 'promettre', 'bloquer', 'avis', 'etat', 'duel', 'provoquer', 'menacer', 'oui', 'non', 'adieu'];
  function composer(ch, intention, params, langue) {
    const L = langue || LANGUE, t = TEXTES[L]['compose_' + intention] || TEXTES.en['compose_' + intention];
    if (!t) return '';
    const cible = params && params.cible !== undefined && ch.pilotes[params.cible] ? nomDe(ch.pilotes[params.cible]) : '';
    let phrase = t.replace('{cible}', cible);
    if (intention === 'passer' && params && params.promesse) phrase += ' ' + (TEXTES[L].compose_promettre || TEXTES.en.compose_promettre);
    return phrase;
  }
  // les intentions qu'on peut composer avec ce pilote (le duel avec le coéquipier seulement ; oui / non quand il attend une réponse)
  function intentions(ch, k) {
    const co = CHAMPIONNAT.coequipierDe(ch), m = memoire(ch.pilotes[k]);
    return INTENTIONS.filter(i => (i !== 'duel' || (co && co.id === k)) && ((i !== 'oui' && i !== 'non') || !!m.demande));
  }

  // --- après chaque Grand Prix enregistré (CHAMPIONNAT.finirGrandPrix) : une menace restée sans suite pendant
  // DISCUSSION_MENACE_COURSES courses fait perdre du crédit (il le dira) ; une disposition passée est oubliée
  function apresGrandPrix(ch) {
    const g = gpActuel(ch);
    for (const p of ch.pilotes) {
      if (p.disposition && (p.disposition.saison !== g.saison || p.disposition.gp <= g.gp)) delete p.disposition;
      const m = p.memoire;
      if (!m || !m.menace) continue;
      const ecoule = m.menace.saison === g.saison ? g.gp - m.menace.gp : R.DISCUSSION_MENACE_COURSES;
      if (ecoule >= R.DISCUSSION_MENACE_COURSES) { m.credit = Math.max(-R.DISCUSSION_CREDIT_MAX, m.credit - 1); m.menace = null; }
    }
  }
  // un pilote à qui tu as promis de rendre la pareille te le demande (le courrier le fera) : ta réponse tiendra ou trahira la promesse
  function demanderPromesse(ch, k) {
    const m = memoire(ch.pilotes[k]);
    if (!m.promesse || m.promesse.etat !== 'ouverte') return false;
    m.demande = { type: 'tenir', saison: ch.saison, gp: ch.resultats.length };
    return true;
  }

  return { conversation, sansNom, dire, raisonner, appliquer, composerReponse, composer, intentions, apresGrandPrix, demanderPromesse, peutDiscuter, memoire, noms, INTENTIONS };
})();
