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
    const ici = m.dits.filter(d => d[1] === ch.saison && d[2] === ch.resultats.length).length;
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
    return { reaction, raisons, effets };
  }

  // applique les effets d'un raisonnement, chacun avec son plafond : la relation entre ±DISCUSSION_RELATION_MAX (jamais plus de
  // DISCUSSION_PAS par message), la rivalité (posée pour DISCUSSION_RIVALITE_COURSES courses, ou effacée), la confiance de l'écurie
  // (la jauge « écurie » de l'interview, ±DISCUSSION_CONFIANCE), la disposition pour la prochaine course, la promesse, la menace
  function appliquer(ch, k, r, acte) {
    const p = ch.pilotes[k], m = memoire(p), e = r.effets, g = gpActuel(ch);
    if (e.relation) m.relation = borne(m.relation + borne(e.relation, -R.DISCUSSION_PAS, R.DISCUSSION_PAS), -R.DISCUSSION_RELATION_MAX, R.DISCUSSION_RELATION_MAX);
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
  }

  // la phrase de la réponse : la réaction (une variante tirée), puis ses raisons, avec les noms et le circuit
  function composerReponse(ch, k, r) {
    const p = ch.pilotes[k], m = memoire(p), dc = derniereCourse(ch, k);
    const alea = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_DISCUSSION + k * 101 + m.dits.length * 7 + ch.resultats.length * 1009);
    const choisir = cle => { const v = texte(cle); return Array.isArray(v) ? v[Math.floor(alea() * v.length)] : v || ''; };
    const circuit = dc.circuit ? (texte('circuit_' + dc.circuit) || dc.circuit) : '';
    const promesse = m.promesse && m.promesse.gp ? (ch.calendrier[m.promesse.gp - 1] ? texte('circuit_' + ch.calendrier[m.promesse.gp - 1].circuit) || '' : '') : '';
    const vals = { nom: nomDe(joueur(ch)), lui: nomDe(p), circuit, promesse,
      cible: r.effets.cible !== undefined && ch.pilotes[r.effets.cible] ? nomDe(ch.pilotes[r.effets.cible]) : '' };
    const anonyme = !joueur(ch).nom;
    const remplir = t => (anonyme ? sansNom(t) : t).replace(/\{(\w+)\}/g, (x, c) => vals[c] !== undefined ? vals[c] : x);
    const morceaux = [remplir(choisir('dis_' + r.reaction))];
    for (const raison of r.raisons) { const t = choisir('dis_raison_' + raison); if (t) morceaux.push(remplir(t)); }
    return typeof elider === 'function' ? elider(morceaux.join(' ')) : morceaux.join(' ');
  }

  // dire(ch, k, txt) : le joueur écrit à un pilote ; renvoie { analyse, reaction, raisons, effets, texte } et applique les effets
  function dire(ch, k, txt, ecran) {
    if (ecran !== undefined && !peutDiscuter(ecran)) return null;   // jamais pendant une course
    const p = ch.pilotes[k];
    if (!p || p.humain) return null;
    const analyse = PARLE.comprendre(txt, noms(ch)), r = raisonner(ch, k, analyse);
    appliquer(ch, k, r, analyse.acte);
    return { analyse, reaction: r.reaction, raisons: r.raisons, effets: r.effets, texte: composerReponse(ch, k, r) };
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

  return { sansNom, dire, raisonner, appliquer, composerReponse, composer, intentions, apresGrandPrix, demanderPromesse, peutDiscuter, memoire, noms, INTENTIONS };
})();
