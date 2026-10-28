// Les patrons d'écurie (Codeur 3, tour 35, étape 12b, CLAUDE.md « Les discussions avec les pilotes et les écuries ») : calcul pur.
// La même lecture que les pilotes (PARLE.comprendre), un autre interlocuteur :
//  - le patron de TON écurie, toute l'année : la confiance (la jauge « écurie »), ton statut (premier ou second pilote), le budget
//    de la voiture, les consignes d'équipe ; il réagit à tes résultats (ta place au championnat contre ce qu'on attend de l'écurie)
//    et aux consignes suivies ou ignorées (noterConsigne) ;
//  - les patrons des AUTRES écuries, à la période des contrats seulement (ch.enFinDeSaison) : on négocie le salaire et le statut de
//    l'offre qu'ils te font (SAISONS.offres). Leur réponse vient de l'état vrai : à quel point ils te veulent (ta note contre leur
//    exigence), ta réputation auprès des sponsors, la relation ; une demande trop forte devient une contre-offre, qu'on peut refuser.
// Le nom : un ancien rival du parent devenu patron (SAISONS.signataire, « La relève ») sinon « le patron de {ecurie} » ; ce n'est
// qu'un nom dans les textes. Les effets sont plafonnés (PATRON_*, CONTRAT_* dans donnees.js) ; la physique ne change jamais.
const PATRONS = (function () {
  const R = REGLAGES;
  const borne = (x, a, b) => Math.max(a, Math.min(b, x));
  const joueur = ch => ch.pilotes.find(p => p.humain);
  const confiance = ch => typeof ch.confiance === 'number' ? ch.confiance : R.CONFIANCE_DEPART;

  // la mémoire de chaque patron (par écurie), créée à la première discussion : la relation, les derniers actes, la négociation de
  // la saison (le bonus de salaire obtenu, le statut, une contre-offre en attente, les refus), le budget déjà donné cette saison
  function memoire(ch, e) {
    if (!ch.patrons || typeof ch.patrons !== 'object') ch.patrons = {};
    const m = ch.patrons[e] || (ch.patrons[e] = {});
    if (typeof m.relation !== 'number') m.relation = 0;
    if (!Array.isArray(m.dits)) m.dits = [];
    if (!m.nego || m.nego.saison !== ch.saison) m.nego = { saison: ch.saison, salaire: 0, statut: null, contre: null, refus: 0, ferme: false };
    if (m.budget === undefined) m.budget = null;
    return m;
  }
  function memoireConsignes(ch) {
    if (!ch.consignesJoueur || ch.consignesJoueur.saison !== ch.saison) ch.consignesJoueur = { saison: ch.saison, suivies: 0, ignorees: 0, derniere: null };
    return ch.consignesJoueur;
  }
  // après une course : la consigne qui visait le joueur, suivie ou ignorée (simulation.js la pose ; principal.js l'appelle avec
  // appliquerConsigne). Le patron s'en souvient pour la saison
  function noterConsigne(ch, consigne) {
    if (!ch || !consigne || !consigne.joueur || !consigne.resultat) return;
    const c = memoireConsignes(ch);
    if (consigne.resultat === 'suivie') c.suivies++; else c.ignorees++;
    c.derniere = { gp: ch.resultats.length + 1, resultat: consigne.resultat };
  }

  // le statut du joueur pour une saison : 'premier' ou 'second' (par défaut) ; posé par son patron, ou signé avec un contrat
  const statut = ch => ch.statut && ch.statut.saison === ch.saison ? ch.statut.valeur : 'second';

  // ce qu'on attend de toi : la place que vaut l'écurie (son rang par niveau, deux pilotes par écurie), et ta place réelle
  function attente(ch) {
    const j = joueur(ch), rang = SAISONS.rangEcurie(ch, j.ecurie), cl = CHAMPIONNAT.classementPilotes(ch);
    const place = cl.findIndex(x => x.k === j.id) + 1, attendue = rang * 2 + 1.5;
    return { place, attendue, ecart: ch.resultats.length ? attendue - place : 0 };   // > 0 : mieux que prévu
  }

  // à quel point une écurie te veut (de −1 à 1) : ta note contre son exigence, plus un peu de réputation (sponsors) et de relation
  function envie(ch, e) {
    const ex = SAISONS.exigences(ch)[e], n = SAISONS.note(ch), m = memoire(ch, e), rep = ch.reputation ? ch.reputation.sponsors : R.REPUTATION_DEPART;
    return borne(n - ex + (rep - R.REPUTATION_DEPART) / 100 * R.PATRON_POIDS_REPUTATION + m.relation / R.DISCUSSION_RELATION_MAX * R.PATRON_POIDS_RELATION, -1, 1);
  }
  // le bonus de salaire le plus fort qu'il peut accepter (une part du salaire de base, plafonnée à CONTRAT_NEGO_MAX)
  const bonusMax = (ch, e) => borne(envie(ch, e) * R.CONTRAT_NEGO_FACTEUR, 0, R.CONTRAT_NEGO_MAX);

  // le salaire de base d'une offre : de CONTRAT_SALAIRE_MIN (la plus faible écurie) à CONTRAT_SALAIRE_MAX (la meilleure)
  function salaireBase(ch, e) {
    const n = ch.ecuries.length, rang = SAISONS.rangEcurie(ch, e);
    return Math.round((R.CONTRAT_SALAIRE_MIN + (R.CONTRAT_SALAIRE_MAX - R.CONTRAT_SALAIRE_MIN) * (1 - rang / Math.max(1, n - 1))) / 1000) * 1000;
  }
  // l'offre telle que la négociation l'a faite : { salaire, statut }
  function conditions(ch, e) {
    const m = ch.patrons && ch.patrons[e] && ch.patrons[e].nego && ch.patrons[e].nego.saison === ch.saison ? ch.patrons[e].nego : null;
    return { salaire: Math.round(salaireBase(ch, e) * (1 + (m ? m.salaire : 0)) / 1000) * 1000, statut: m && m.statut ? m.statut : 'second', bonus: m ? m.salaire : 0 };
  }

  // à qui l'on peut parler : ton patron toute l'année ; les autres, à la période des contrats seulement, et seulement s'ils te font une offre
  function peutParler(ch, e, ecran) {
    if (ecran !== undefined && !DISCUSSION.peutDiscuter(ecran) && ecran !== 'contrats') return false;
    if (!ch.ecuries[e]) return false;
    if (e === joueur(ch).ecurie) return true;
    return !!ch.enFinDeSaison && SAISONS.offres(ch).some(o => o.ecurie === e);
  }

  // --- le raisonnement : { reaction, raisons, effets } (rien n'est appliqué ici)
  function raisonner(ch, e, a) {
    const m = ch.patrons && ch.patrons[e] ? memoire(ch, e) : memoire({ saison: ch.saison }, e), j = joueur(ch), mien = e === j.ecurie, conf = confiance(ch);
    const raisons = [], effets = {}, garde = x => raisons.push(x), at = mien ? attente(ch) : null, cs = memoireConsignes({ saison: ch.saison, consignesJoueur: ch.consignesJoueur });
    const contrats = !!ch.enFinDeSaison, offre = contrats ? SAISONS.offres(ch).find(o => o.ecurie === e) : null, P = R.DISCUSSION_PAS;
    // ce qu'il garde en tête : tes résultats (ton patron) et les consignes de la saison
    const resultats = () => { if (at && ch.resultats.length) garde(at.ecart >= R.PATRON_ECART_RESULTATS ? 'au_dessus' : at.ecart <= -R.PATRON_ECART_RESULTATS ? 'en_dessous' : 'comme_prevu'); };
    const consignes = () => { if (mien && cs.ignorees) garde('consigne_ignoree'); else if (mien && cs.suivies) garde('consigne_suivie'); };
    let reaction;
    switch (a.acte) {
      case 'SALUT': reaction = mien ? 'salut' : contrats ? 'salut_contrat' : 'salut'; break;
      case 'ADIEU': reaction = 'adieu'; break;
      case 'MERCI': case 'COMPLIMENT': reaction = 'merci'; effets.relation = 2; break;
      case 'INSULTE': case 'MENACE':
        reaction = 'vexe'; effets.relation = -P;
        if (mien) { effets.confiance = -R.PATRON_CONFIANCE_INSULTE; garde('confiance'); }
        else if (offre) { effets.fermer = true; garde('offre_fermee'); }
        break;
      case 'AVIS': case 'ETAT': case 'QUESTION':
        if (mien) { reaction = conf >= R.PATRON_CONFIANCE_HAUTE ? 'confiance_haute' : conf <= R.PATRON_CONFIANCE_BASSE ? 'confiance_basse' : 'confiance_moyenne'; resultats(); consignes(); }
        else reaction = offre ? 'interesse' : 'pas_interesse';
        break;
      case 'STATUT': {
        if (contrats) {   // négocier le statut de l'offre : premier pilote si tu as plus de points que celui qui resterait ton coéquipier
          if (!offre) { reaction = 'pas_offre'; break; }
          const c = offre.coequipier !== null ? ch.pilotes[offre.coequipier] : null;
          if (m.nego.ferme) { reaction = 'ferme'; break; }
          if (!c || j.stats.points > c.stats.points) { reaction = 'statut_accepte'; effets.statutOffre = 'premier'; garde('points'); }
          else { reaction = 'statut_refuse'; garde('coequipier_meilleur'); }
          break;
        }
        if (!mien) { reaction = 'pas_offre'; break; }
        if (statut(ch) === 'premier') { reaction = 'statut_deja'; break; }
        const sd = CHAMPIONNAT.scoreDuel(ch), ecartDuel = sd ? sd.total[0] - sd.total[1] : 0;
        if (ecartDuel >= R.PATRON_STATUT_ECART && conf >= R.PATRON_STATUT_CONFIANCE) { reaction = 'statut_accepte'; effets.statut = 'premier'; garde('duel_gagne'); }
        else { reaction = 'statut_refuse'; garde(ecartDuel < R.PATRON_STATUT_ECART ? 'duel_pas_assez' : 'confiance'); }
        break;
      }
      case 'BUDGET':
        if (!mien) { reaction = 'pas_offre'; break; }
        if (m.budget === ch.saison) { reaction = 'budget_deja'; break; }
        // un coup de pouce, une fois par saison : si tu fais mieux que prévu et que l'écurie te fait confiance
        if (at.ecart >= R.PATRON_ECART_RESULTATS && conf >= R.PATRON_BUDGET_CONFIANCE) { reaction = 'budget_accepte'; effets.budget = R.PATRON_BUDGET_MONTANT; garde('au_dessus'); }
        else { reaction = 'budget_refuse'; garde(at.ecart < R.PATRON_ECART_RESULTATS ? (ch.resultats.length ? 'en_dessous_budget' : 'trop_tot') : 'confiance'); }
        break;
      case 'CONSIGNE':
        if (!mien) { reaction = 'pas_offre'; break; }
        reaction = statut(ch) === 'premier' ? 'consigne_premier' : cs.ignorees ? 'consigne_rappel' : 'consigne_explique';
        break;
      case 'SALAIRE':
        if (!contrats) { reaction = 'salaire_plus_tard'; break; }
        if (!offre) { reaction = 'pas_offre'; break; }
        if (m.nego.ferme) { reaction = 'ferme'; break; }
        {
          const max = bonusMax(ch, e), base = salaireBase(ch, e);
          // un montant écrit : un salaire (s'il dépasse la base) ou un bonus (sinon) ; sans montant : il propose la moitié de ce qu'il peut
          const demande = a.montant ? (a.montant >= base ? a.montant / base - 1 : a.montant / base) : null;
          if (max <= 0) { reaction = 'salaire_refuse'; garde('pas_assez_envie'); effets.refus = true; break; }
          if (demande !== null && demande <= max + 1e-9) { reaction = 'salaire_accepte'; effets.salaire = demande; break; }
          const contre = Math.round((demande === null ? max / 2 : max) * 100) / 100;
          if (demande !== null && demande > max * R.CONTRAT_NEGO_EXCES) { reaction = 'salaire_refuse'; garde('trop'); effets.refus = true; break; }
          reaction = 'contre_offre'; effets.contre = contre;
        }
        break;
      case 'ACCORD':
        if (m.nego.contre !== null && !m.nego.ferme) { reaction = 'marche_conclu'; effets.salaire = m.nego.contre; effets.contre = null; }
        else reaction = 'accord_vague';
        break;
      case 'REFUS':
        if (m.nego.contre !== null) { reaction = 'contre_refusee'; effets.contre = null; effets.relation = -2; }
        else reaction = 'refus_vague';
        break;
      case 'PASSER': case 'BLOQUER': case 'DUEL': case 'CONTACT': reaction = 'pas_mon_role'; break;
      default: reaction = 'incompris';
    }
    if (reaction === 'contre_offre' || reaction === 'salaire_accepte' || reaction === 'marche_conclu') garde(envie(ch, e) >= R.PATRON_ENVIE_FORTE ? 'veut_beaucoup' : 'veut_un_peu');
    return { reaction, raisons, effets };
  }

  // les effets, plafonnés : la relation (±DISCUSSION_PAS, ±DISCUSSION_RELATION_MAX), la confiance (−PATRON_CONFIANCE_INSULTE), le statut
  // de la saison, le budget (une fois par saison, PATRON_BUDGET_MONTANT, crédité au solde), le salaire négocié (≤ CONTRAT_NEGO_MAX),
  // la contre-offre, les refus (au CONTRAT_NEGO_REFUS_MAX-ième, il ferme la négociation : l'offre reste, au salaire de base)
  function appliquer(ch, e, r, acte) {
    const m = memoire(ch, e), x = r.effets;
    if (x.relation) m.relation = borne(m.relation + borne(x.relation, -R.DISCUSSION_PAS, R.DISCUSSION_PAS), -R.DISCUSSION_RELATION_MAX, R.DISCUSSION_RELATION_MAX);
    if (x.confiance && ch.reputation) { ch.reputation.ecurie = borne(ch.reputation.ecurie + borne(x.confiance, -R.PATRON_CONFIANCE_INSULTE, 0), 0, 100); ch.confiance = ch.reputation.ecurie; }
    if (x.statut) ch.statut = { saison: ch.saison, valeur: x.statut };
    if (x.statutOffre) m.nego.statut = x.statutOffre;
    if (x.budget) { m.budget = ch.saison; ARGENT.crediter(ch, Math.min(x.budget, R.PATRON_BUDGET_MONTANT), 'patron'); }
    if (x.salaire !== undefined) m.nego.salaire = borne(x.salaire, 0, R.CONTRAT_NEGO_MAX);
    if (x.contre !== undefined) m.nego.contre = x.contre === null ? null : borne(x.contre, 0, R.CONTRAT_NEGO_MAX);
    if (x.refus) { m.nego.refus++; if (m.nego.refus >= R.CONTRAT_NEGO_REFUS_MAX) { m.nego.ferme = true; m.nego.contre = null; } }
    if (x.fermer) { m.nego.ferme = true; m.nego.contre = null; m.nego.salaire = 0; }
    m.dits.push([acte, ch.saison, ch.resultats.length]);
    if (m.dits.length > R.DISCUSSION_MEMOIRE) m.dits.splice(0, m.dits.length - R.DISCUSSION_MEMOIRE);
  }

  // le nom du patron : l'ancien rival devenu patron de cette écurie (la relève), sinon « le patron de {ecurie} »
  function nom(ch, e, noms) {
    const s = SAISONS.signataire(ch, e);
    return s ? noms.pilote(Object.assign({ humain: false }, s)) : texte('patronDe').replace('{ecurie}', noms.ecurie(ch.ecuries[e]));
  }

  function composerReponse(ch, e, r, noms) {
    const m = memoire(ch, e), alea = ALEATOIRE.suite((ch.graine || 0) + R.GRAINE_DISCUSSION + 7777 + e * 53 + m.dits.length * 11 + ch.resultats.length * 1009);
    const choisir = cle => { const v = texte(cle); return Array.isArray(v) ? v[Math.floor(alea() * v.length)] : v || ''; };
    const F = typeof ARGENT !== 'undefined' ? ARGENT.formater : String, cd = conditions(ch, e), at = e === joueur(ch).ecurie ? attente(ch) : null;
    const vals = { nom: noms.pilote(joueur(ch)), ecurie: noms.ecurie(ch.ecuries[e]), salaire: F(cd.salaire), contre: F(Math.round(salaireBase(ch, e) * (1 + (m.nego.contre || 0)) / 1000) * 1000),
      budget: F(R.PATRON_BUDGET_MONTANT), place: at ? at.place : '', attendue: at ? Math.round(at.attendue) : '' };
    const anonyme = !joueur(ch).nom;
    const remplir = t => (anonyme ? DISCUSSION.sansNom(t) : t).replace(/\{(\w+)\}/g, (x, c) => vals[c] !== undefined ? vals[c] : x);
    const morceaux = [remplir(choisir('pat_' + r.reaction))];
    for (const raison of r.raisons) { const t = choisir('pat_raison_' + raison); if (t) morceaux.push(remplir(t)); }
    return typeof elider === 'function' ? elider(morceaux.join(' ')) : morceaux.join(' ');
  }

  // dire(ch, e, txt, ecran, noms) : le joueur écrit au patron de l'écurie e ; { analyse, reaction, raisons, effets, texte }, ou null
  function dire(ch, e, txt, ecran, noms) {
    if (!peutParler(ch, e, ecran)) return null;
    noms = noms || { pilote: p => p.nom || (p.humain ? texte('nomJoueur') : texte('pilote').replace('{n}', p.numero)), ecurie: x => x.nom || texte('ecurie').replace('{n}', x.id + 1) };
    const analyse = PARLE.comprendre(txt, DISCUSSION.noms(ch)), r = raisonner(ch, e, analyse);
    appliquer(ch, e, r, analyse.acte);
    return { analyse, reaction: r.reaction, raisons: r.raisons, effets: r.effets, texte: composerReponse(ch, e, r, noms) };
  }

  // les intentions au clic avec ce patron : le tien (confiance, statut, budget, consignes), les autres aux contrats (salaire, statut)
  function intentions(ch, e) {
    const mien = e === joueur(ch).ecurie, m = ch.patrons && ch.patrons[e] ? memoire(ch, e) : null, contre = !!(m && m.nego.contre !== null);
    const liste = ['saluer'];
    if (mien) liste.push('confiance', 'statut', 'budget', 'consigne');
    if (ch.enFinDeSaison) liste.push('salaire', ...(mien ? [] : ['statut', 'confiance']));
    if (contre) liste.push('oui', 'non');
    liste.push('adieu');
    return [...new Set(liste)];
  }

  return { memoire, noterConsigne, statut, attente, envie, bonusMax, salaireBase, conditions, peutParler, raisonner, appliquer, nom, dire, intentions };
})();
