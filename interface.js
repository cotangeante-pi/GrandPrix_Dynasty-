// L'interface de la course (provisoire : la grande passe de style viendra à l'étape 11).
// Elle lit l'état de la course et l'affiche ; elle ne change jamais l'état du jeu.
const INTERFACE = (function () {
  const $ = id => document.getElementById(id);
  // les longueurs proposées, dans l'ordre de l'écran de choix ; 0 = essai libre
  const CHOIX = [['tresCourte', 'tresCourte'], ['moyenne', 'moyenne'], ['longue', 'longue'], ['essaiLibre', null]];

  // 62.345 → « 1:02.345 » (« 1:02,345 » en français : texte('virgule'), comme les écarts)
  function formatTemps(t) {
    if (t === null || t === undefined) return '–:––.–––';
    const m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3).replace('.', texte('virgule'));
  }

  // 5 → « 5 s » (texte('secondes')) ; 0.812 → « 0,812 s » en français
  const secondes = s => texte('secondes').replace('{s}', String(s).replace('.', texte('virgule')));

  function nbToursDe(cle) {
    return cle ? REGLAGES.LONGUEURS_COURSE[cle] : 0;
  }

  // l'écran de choix ; choisir(nbTours) lance la course ; circuit : son nom, pour ses records
  function preparerChoix(choisir, circuit) {
    $('choixTitre').textContent = texte('choixTitre');
    const liste = $('choixListe');
    liste.textContent = '';
    for (const [cle, longueur] of CHOIX) {
      const nb = nbToursDe(longueur);
      const b = document.createElement('button');
      b.id = 'choix' + nb;
      b.tabIndex = -1;
      const nom = document.createElement('strong');
      nom.textContent = texte(cle);
      const detail = document.createElement('span');
      detail.textContent = nb ? nb + ' ' + texte('tours') : texte('toursSansFin');
      const rec = document.createElement('em');
      rec.id = 'record' + nb;
      const r = SAUVEGARDE.record(nb, circuit);
      rec.textContent = r === null ? '' : texte('record') + ' ' + formatTemps(r);
      b.append(nom, detail, rec);
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => choisir(nb));
      liste.appendChild(b);
    }
  }

  function montrer(ecran) {
    for (const id of ['choix', 'pause', 'fin', 'podium', 'resultats', 'championnat', 'qualif', 'une', 'garage', 'saison', 'duelSaison', 'contrats', 'retraite', 'titre', 'amis', 'bravo', 'pilote', 'sponsors', 'fiche', 'interview', 'deuxReglages', 'ceremonie']) $(id).classList.toggle('cache', id !== ecran);
    // le bandeau de course n'est là que pendant la course et la pause (pas sous l'écran de fin)
    const course = ecran === 'course' || ecran === 'pause';
    for (const id of ['hudCourse', 'hudPenalite', 'compte', 'feux', 'classement', 'radar', 'jauge', 'departResultat', 'aides', 'feux2', 'jauge2', 'departResultat2', 'deuxHaut', 'deuxBas', 'deuxSeparation']) if (!course) $(id).classList.add('cache');
    if (course) $('hudCourse').classList.remove('cache');
  }

  // à chaque image, pendant la course
  function majCourse(c, ecran) {
    if (!c || (ecran !== 'course' && ecran !== 'pause')) return;
    $('compte').classList.toggle('cache', !!c.feux || !(c.etat === 'compte' || (c.etat === 'attente' && c.compte === 0 && c.temps === 0)));
    // les feux : visibles pendant le départ, et un instant après l'extinction (tous éteints)
    // (pas avant que le compte ait commencé : tant que la carte des IA se calcule, « Préparation… » est affiché à la place)
    $('feux').classList.toggle('cache', !c.feux || !((c.etat === 'compte' && c.compte < c.feux.total) || (c.etat !== 'finie' && c.temps < 1)));
    if (c.feux) { const n = feuxAllumes(c); $('feux').querySelectorAll('span').forEach((f, i) => f.classList.toggle('allume', i < n)); }
    $('compte').textContent = c.etat === 'compte' ? Math.ceil(c.compte) : texte('go');
    const numero = Math.min(c.tours.length + 1, c.nbTours || Infinity);
    $('hudTour').textContent = texte('tour') + ' ' + numero + (c.nbTours ? ' / ' + c.nbTours : '');
    $('hudChrono').textContent = formatTemps(c.etat === 'finie' ? c.tours[c.tours.length - 1].temps : c.temps - c.debutTour);
    $('hudMeilleur').textContent = texte('meilleurTour') + ' ' + formatTemps(c.meilleurTour);
    // les secteurs du tour EN COURS seulement : une case reste grise tant que son secteur n'est pas fini dans ce tour
    // (à l'arrivée, ceux du dernier tour) ; le tour d'avant est rappelé en petit
    const finie = c.etat === 'finie';
    const secteurs = finie ? c.tours[c.tours.length - 1].secteurs : c.secteursTour;
    const avant = c.tours[c.tours.length - (finie ? 2 : 1)];
    const precedent = c.tours[c.tours.length - 1];
    $('hudPrecedent').classList.toggle('cache', !precedent || finie);
    if (precedent) $('hudPrecedent').textContent = texte('tourPrecedent') + ' ' + formatTemps(precedent.temps) + (precedent.coupe ? ' ✂' : '');
    for (let i = 0; i < 3; i++) {
      const el = $('hudS' + (i + 1)), t = secteurs[i];
      el.textContent = texte('secteur') + (i + 1) + ' ' + (t === undefined || t === null ? '–' : t.toFixed(3).replace('.', texte('virgule')));
      el.className = 'secteur' + (t === undefined || t === null ? '' : ' ' + couleurSecteur(c, i, t, avant));
    }
    const recente = c.derniereCoupe !== undefined && c.temps - c.derniereCoupe < 3;
    const faux = c.fauxDepart && (c.etat === 'compte' || c.temps < 4);   // le faux départ, affiché jusqu'à 4 s après le départ
    $('hudPenalite').classList.toggle('cache', !recente && !faux);
    $('hudPenalite').textContent = recente ? texte('penalite').replace('{s}', REGLAGES.PENALITE_COUPE) : texte('fauxDepart').replace('{s}', REGLAGES.PENALITE_FAUX_DEPART);
  }

  // l'écart au pilote devant : « +0,8 s », ou « +1 tour » s'il a un tour de retard ; rien pour le premier
  function formatEcart(l) {
    if (l.ecart === null) return '';
    if (l.tours > 0) return '+' + l.tours + ' ' + texte(l.tours > 1 ? 'toursRetard' : 'tourRetard');
    return '+' + secondes(l.ecart.toFixed(1));
  }

  // la tour de classement : lignes = [{ numero, couleur (0xrrggbb), ecart, tours, penalites, moi }] dans l'ordre (classementCourse),
  // ou null pour la cacher. Une ligne par voiture, gardée d'une image à l'autre : quand l'ordre change, elle glisse
  // à sa nouvelle place (transition CSS sur --rang)
  const lignesClassement = new Map();
  function majClassement(lignes) {
    $('classement').classList.toggle('cache', !lignes);
    if (!lignes) return;
    const liste = $('classementListe');
    $('classementPlace').textContent = texte('placeCourse').replace('{p}', lignes.findIndex(l => l.moi) + 1).replace('{n}', lignes.length);
    liste.style.setProperty('--nb', lignes.length);
    lignes.forEach((l, i) => {
      let li = lignesClassement.get(l.numero);
      if (!li) {
        li = document.createElement('li');
        li.dataset.numero = l.numero;
        for (const classe of ['place', 'pastille', 'numero', 'penalite', 'ecart']) {
          const span = document.createElement('span');
          span.className = classe;
          li.appendChild(span);
        }
        li.children[1].style.background = '#' + l.couleur.toString(16).padStart(6, '0');
        li.children[2].textContent = l.numero;
        // l'icône du casque (casque.js) : sa propre colonne, ajoutée en dernier (les indices 0 à 4 ne bougent pas) et placée avant le numéro par CSS (order)
        if (l.casque) { const c = document.createElement('span'); c.className = 'casque'; c.appendChild(CASQUE.icone(l.casque, REGLAGES.CASQUE_ICONE)); li.appendChild(c); }
        liste.appendChild(li);
        lignesClassement.set(l.numero, li);
      }
      li.style.setProperty('--rang', i);
      li.classList.toggle('moi', l.moi);
      li.classList.toggle('arrive', !!l.arrive);   // arrivé : 🏁 devant son écart
      li.children[0].textContent = i + 1;
      // une voiture pénalisée porte ses pénalités (« ✂ +15 s ») : elles sont déjà comptées dans sa place et son écart
      li.children[3].textContent = l.penalites > 0 ? '✂ +' + secondes(l.penalites) : '';
      li.children[4].textContent = formatEcart(l);
      marquerCoequipier(li, l);
    });
  }

  // --- le duel contre le coéquipier (Codeur 3) ---
  // ?championnat=1 : la ligne du coéquipier (l.coequipier) porte la couleur de l'écurie et, à la place de son écart,
  // l'écart en temps avec le joueur (l.ecartDuel, s : > 0 = il est derrière le joueur ▼, < 0 = devant ▲ ; null : inconnu)
  function marquerCoequipier(li, l) {
    li.classList.toggle('coequipier', !!l.coequipier);
    if (!l.coequipier) return;
    li.style.setProperty('--ecurie', couleurCss(l.couleur));
    li.title = texte('duelTour');
    if (l.ecartDuel !== null && l.ecartDuel !== undefined)
      li.children[4].textContent = (l.ecartDuel > 0 ? '▼ ' : '▲ ') + secondes(Math.abs(l.ecartDuel).toFixed(1));
  }

  // remplace {cle} par valeurs[cle] dans un texte
  function avec(t, valeurs) {
    return t.replace(/\{(\w+)\}/g, (m, cle) => valeurs[cle] !== undefined ? valeurs[cle] : m);
  }

  // l'écran entre les courses : le score de la saison contre le coéquipier (CHAMPIONNAT.scoreDuel ; ch : le championnat,
  // pour son nom), ou rien (null)
  function remplirDuel(s, ch) {
    const p = $('championnatDuel');
    p.textContent = s ? '⚔ ' + texte('duelTitre') + ' : ' + avec(texte('duelScore'), { a: s.total[0], b: s.total[1], nom: nomPilote(ch.pilotes[s.k]) }) + ' '
      + avec(texte('duelDetail'), { qa: s.qualifs[0], qb: s.qualifs[1], ca: s.courses[0], cb: s.courses[1] }) : '';
  }

  // --- la une du journal (Codeur 3) : r = JOURNAL.rendre(une, ch, { pilote: nomPilote, ecurie: nomEcurie }), déjà en phrases
  function remplirUne(r) {
    const sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.append(String(contenu)); return e; };
    $('unePage').classList.toggle('speciale', !!r.speciale);   // la une spéciale du champion (« CHAMPION ! »)
    $('uneNom').textContent = r.nom;
    $('uneEdition').textContent = avec(texte('uneEdition'), { n: r.grandPrix, circuit: r.circuit });
    $('uneTitre').textContent = r.titre;
    $('uneTexte').textContent = r.texte;
    $('uneBrevesTitre').textContent = texte('uneBreves');
    const ul = $('uneBreves');
    ul.textContent = '';
    for (const b of r.breves) { const li = document.createElement('li'); li.textContent = b; ul.appendChild(li); }
    $('uneClassementTitre').textContent = texte('uneClassement');
    const ol = $('uneClassement');
    ol.textContent = '';
    for (const x of r.classement) {
      const li = document.createElement('li');
      if (x.moi) li.className = 'moi';
      li.append(sp('place', x.place), sp('nom', x.nom), sp('points', x.points + ' ' + texte('pts')));
      ol.appendChild(li);
    }
    $('unePasser').textContent = texte('unePasser');
  }

  // un clic n'importe où sur la une la passe (les touches : principal.js)
  function preparerUne(passer) {
    $('une').addEventListener('mousedown', e => e.preventDefault());
    $('une').addEventListener('click', passer);
  }

  const couleurCss = c => '#' + c.toString(16).padStart(6, '0');
  const pastille = c => { const e = document.createElement('span'); e.className = 'pastille'; e.style.background = couleurCss(c); return e; };
  const penalite = p => p > 0 ? '+' + secondes(p) + ' ✂' : '';

  // les boutons du podium (passer aux résultats) et des résultats (rejouer, changer de longueur)
  function preparerResultats(passer, rejouer, changer) {
    $('podiumTitre').textContent = texte('podium');
    $('resultatsTitre').textContent = texte('resultats');
    $('boutonResultats').textContent = texte('voirResultats');
    $('boutonRejouerResultats').textContent = texte('rejouer');
    $('boutonChangerResultats').textContent = texte('changerLongueur');
    const entete = $('resultatsEntete');
    entete.textContent = '';
    for (const nom of texte('colonnesResultats')) { const th = document.createElement('th'); th.textContent = nom; entete.appendChild(th); }
    for (const [id, f] of [['boutonResultats', passer], ['boutonRejouerResultats', rejouer], ['boutonChangerResultats', changer]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // le podium : trois = [{ numero, couleur, total, penalites }] du 1er au 3e ; affichés 2e, 1er, 3e (comme les marches)
  function remplirPodium(trois) {
    const marches = $('podiumMarches');
    marches.textContent = '';
    for (const place of [2, 1, 3]) {
      const x = trois[place - 1];
      if (!x) continue;
      const carte = document.createElement('div');
      carte.className = 'marche marche' + place + (x.joueur ? ' joueur' + x.joueur : '');   // (le mode 2 joueurs : les joueurs mis en valeur)
      const titre = document.createElement('strong');
      titre.append(String(place) + ' ', pastille(x.couleur), ' ');
      if (x.casque) titre.append(CASQUE.icone(x.casque, REGLAGES.CASQUE_ICONE + 4));
      titre.append(x.nom ? x.nom : texte('numero').replace('{n}', x.numero));
      const temps = document.createElement('span');
      temps.textContent = formatTemps(x.total) + (x.penalites > 0 ? ' (' + penalite(x.penalites) + ')' : '');
      carte.append(titre, temps);
      marches.appendChild(carte);
    }
  }

  // les résultats : lignes = [{ place, numero, couleur, total (null : encore en course), penalites, ecart, grille, moi }]
  function remplirResultats(lignes) {
    const corps = $('resultatsLignes');
    corps.textContent = '';
    for (const l of lignes) {
      const tr = document.createElement('tr');
      if (l.moi) tr.className = 'moi';
      const numero = document.createElement('span');
      numero.append(pastille(l.couleur), ' ');
      if (l.casque) numero.append(CASQUE.icone(l.casque, REGLAGES.CASQUE_ICONE));
      numero.append(l.nom ? l.nom : String(l.numero));   // (le mode 2 joueurs : le nom de chaque joueur)
      const ecart = l.ecart === null || l.place === 1 ? '' : '+' + secondes(l.ecart.toFixed(3));
      // sa place sur la grille, et les places gagnées (▲) ou perdues (▼) depuis
      const gagne = l.grille - l.place, grille = l.grille + ' ' + (gagne > 0 ? '▲' + gagne : gagne < 0 ? '▼' + -gagne : '=');
      for (const contenu of [String(l.place), numero, l.total === null ? texte('enCourse') : formatTemps(l.total), penalite(l.penalites), ecart, grille]) {
        const td = document.createElement('td');
        td.append(contenu);
        tr.appendChild(td);
      }
      if (gagne) tr.lastChild.className = gagne > 0 ? 'gagne' : 'perd';
      corps.appendChild(tr);
    }
  }

  // tant que la carte des IA se calcule, la course attend : « Préparation de la course… » à la place du compte à rebours
  function majPreparation(oui) {
    $('compte').classList.toggle('preparation', oui);
    if (!oui) return;
    $('compte').classList.remove('cache');
    $('compte').textContent = texte('preparation');
  }

  // le premier lancement (decouverte.js) : l'écran titre (jouer, entre amis → « bientôt », retour) et « Prêt pour ta carrière ? »
  function preparerTitre(jouer, amis, retour, carriere) {
    $('titreNom').textContent = texte('nomDuJeu');
    $('boutonJouer').textContent = texte('titreJouer');
    $('boutonAmis').textContent = texte('titreAmis');
    $('amisTitre').textContent = texte('amisTitre');
    $('boutonAmisRetour').textContent = texte('retour');
    $('bravoTitre').textContent = texte('bravoTitre');
    $('bravoQuestion').textContent = texte('bravoQuestion');
    $('boutonCarriere').textContent = texte('bravoBouton');
    for (const [id, f] of [['boutonJouer', jouer], ['boutonAmis', amis], ['boutonAmisRetour', retour], ['boutonCarriere', carriere]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // « Bravo ! » : la place du joueur (place, nb) et sa prime
  function remplirBravo(place, nb, prime) {
    $('bravoPlace').textContent = texte('bravoPlace').replace('{p}', place).replace('{n}', nb);
    $('bravoArgent').textContent = texte('bravoArgent').replace('{n}', typeof ARGENT !== 'undefined' ? ARGENT.formater(prime) : String(prime));   // la seule monnaie du jeu (argent.js)
  }

  // les aides en surimpression de la découverte : a = { gaz, direction, frein (vrais quand la touche a servi), clignote } ou null (cachées)
  function majAides(a) {
    $('aides').classList.toggle('cache', !a);
    if (!a) return;
    for (const [id, cle, servi] of [['aideGaz', 'aideGaz', a.gaz], ['aideDirection', 'aideDirection', a.direction], ['aideFrein', 'aideFrein', a.frein]]) {
      $(id).textContent = texte(cle);
      $(id).classList.toggle('cache', !!servi);
    }
    $('aideGaz').classList.toggle('clignote', !!a.clignote);
  }

  // la création du pilote (pilote.js) : l'écran et ses champs. remplirPilote(ch) : les listes (pays par nom traduit, les 12
  // circuits), les valeurs de départ (nom par défaut, premier numéro libre) ; lirePilote() : les choix tapés ; montrerErreursPilote
  const nomCircuit = c => texte('circuit_' + c) || c;
  function remplirPilote(ch) {
    const R = REGLAGES;
    $('piloteTitre').textContent = texte('piloteTitre');
    $('piloteNomTexte').textContent = texte('piloteNom');
    $('piloteNumeroTexte').textContent = texte('piloteNumero').replace('{min}', R.NUMERO_MIN).replace('{max}', R.NUMERO_MAX);
    $('pilotePaysTexte').textContent = texte('pilotePays');
    $('piloteCoeurTexte').textContent = texte('piloteCoeur');
    $('boutonPiloteValider').textContent = texte('piloteValider');
    const nom = $('piloteNom'), numero = $('piloteNumero');
    nom.maxLength = R.NOM_LONGUEUR_MAX; nom.placeholder = texte('nomJoueur'); nom.value = '';
    numero.min = R.NUMERO_MIN; numero.max = R.NUMERO_MAX;
    let libre = R.NUMERO_MIN; while (!PILOTE.numeroLibre(ch, libre) && libre < R.NUMERO_MAX) libre++;
    numero.value = libre;
    const pays = $('pilotePays'), coeur = $('piloteCoeur');
    pays.textContent = ''; coeur.textContent = '';
    for (const code of R.PAYS.slice().sort((a, b) => texte('pays_' + a).localeCompare(texte('pays_' + b), LANGUE))) { const o = document.createElement('option'); o.value = code; o.textContent = texte('pays_' + code); pays.appendChild(o); }
    for (const c of Object.keys(R.CIRCUITS_PAYS)) { const o = document.createElement('option'); o.value = c; o.textContent = nomCircuit(c); coeur.appendChild(o); }
    pays.value = R.PAYS[0];
    $('piloteErreur').textContent = '';
    majDomicilePilote();
    remplirCasque(PILOTE.joueur(ch) && PILOTE.joueur(ch).casque);
  }

  // l'éditeur du casque (casque.js) : le motif et les trois couleurs du casque donné (sinon le neutre)
  function remplirCasque(casque) {
    const c = CASQUE.valide(casque) ? casque : CASQUE.neutre();
    $('casqueTitre').textContent = texte('casqueTitre');
    $('casqueMotifTexte').textContent = texte('casqueMotif');
    $('casqueCouleursTexte').textContent = texte('casqueCouleurs');
    const motif = $('casqueMotif');
    motif.textContent = '';
    for (const m of REGLAGES.CASQUE_MOTIFS) { const o = document.createElement('option'); o.value = m; o.textContent = texte('motif_' + m); motif.appendChild(o); }
    motif.value = c.motif;
    for (let i = 0; i < 3; i++) $('casqueC' + (i + 1)).value = '#' + c.couleurs[i].toString(16).padStart(6, '0');
  }

  function lireCasque() {
    return CASQUE.creer($('casqueMotif').value, [1, 2, 3].map(i => parseInt($('casqueC' + i).value.slice(1), 16)));
  }

  // casqueSeul : l'écran ne montre que le casque (« Mon casque » depuis le paddock)
  function modePilote(casqueSeul) {
    $('pilote').classList.toggle('casqueSeul', !!casqueSeul);
    $('piloteTitre').textContent = texte(casqueSeul ? 'casqueTitre' : 'piloteTitre');
    $('boutonPiloteValider').textContent = texte(casqueSeul ? 'casqueValider' : 'piloteValider');
  }

  // changement(casque) : appelé à chaque changement de motif ou de couleur (l'aperçu 3D suit)
  function preparerCasque(changement) {
    for (const id of ['casqueMotif', 'casqueC1', 'casqueC2', 'casqueC3']) $(id).addEventListener('input', () => changement(lireCasque()));
    $('casqueMotif').addEventListener('change', () => changement(lireCasque()));
  }

  // le pays choisi a-t-il un circuit ? alors la course de cœur est imposée et montrée 🏠
  function majDomicilePilote() {
    const maison = PILOTE.domicile($('pilotePays').value);
    $('piloteCoeur').disabled = !!maison;
    if (maison) $('piloteCoeur').value = maison;
    $('piloteDomicile').textContent = maison ? texte('piloteDomicile').replace('{circuit}', nomCircuit(maison)) : '';
  }

  function lirePilote() {
    return { nom: $('piloteNom').value, numero: $('piloteNumero').value, pays: $('pilotePays').value, coeur: $('piloteCoeur').value, casque: lireCasque() };
  }

  function montrerErreursPilote(erreurs) {
    const R = REGLAGES;
    $('piloteErreur').textContent = erreurs.includes('numero') ? texte('piloteErreurNumero').replace('{min}', R.NUMERO_MIN).replace('{max}', R.NUMERO_MAX) : erreurs.includes('coeur') ? texte('piloteErreurCoeur') : '';
  }

  function preparerPilote(valider) {
    $('pilotePays').addEventListener('change', majDomicilePilote);
    $('boutonPiloteValider').addEventListener('mousedown', e => e.preventDefault());
    $('boutonPiloteValider').addEventListener('click', valider);
    $('piloteNom').addEventListener('keydown', e => e.stopPropagation());     // taper son nom ne conduit pas la voiture
    $('piloteNumero').addEventListener('keydown', e => e.stopPropagation());
  }

  // le départ parfait (depart.js) : pendant les feux, la jauge du régime de départ avec sa zone verte (DEPART_VERT), jusqu'au
  // lancement ; après, le résultat et le temps de réaction pendant DEPART_AFFICHAGE s (record : « ★ record de réaction ! »)
  // n : '' pour le joueur (ou le joueur 1 à deux), '2' pour le joueur 2 de l'écran partagé (ses éléments ont ce suffixe)
  function majDepart(c, ecran, record, n = '') {
    const d = c && c.depart, jauge = $('jauge' + n), res = $('departResultat' + n);
    const tenue = !!d && d.humain && d.lance === null && ecran === 'course' && c.etat !== 'finie' && (c.etat !== 'compte' || c.compte < c.feux.total);
    jauge.classList.toggle('cache', !tenue);
    if (tenue) {
      const [bas, haut] = REGLAGES.DEPART_VERT;
      $('jaugeVert' + n).style.left = (bas * 100) + '%';
      $('jaugeVert' + n).style.width = ((haut - bas) * 100) + '%';
      $('jaugeAiguille' + n).style.left = (d.regime * 100) + '%';
      $('jaugeAide' + n).textContent = texte('departAide');
    }
    const montre = !!d && d.humain && d.lance !== null && ecran === 'course' && d.t - d.lance < REGLAGES.DEPART_AFFICHAGE;
    res.classList.toggle('cache', !montre);
    if (montre) {
      const cle = { parfait: 'departParfait', bon: 'departBon', patinage: 'departPatinage', cale: 'departCale', faux: 'departFaux' }[d.resultat];
      res.textContent = texte(cle) + ' · ' + secondes(Math.max(0, d.reaction).toFixed(2)) + (record ? ' ★ ' + texte('departRecord') : '');
      res.className = d.resultat;
    }
  }

  // le mode 2 joueurs (écran partagé) : l'affichage de chaque moitié ; j = [{ place, tour, nbTours, vitesse (m/s), ecart (s, < 0 : ce joueur
  // est devant l'autre, null : inconnu) }, …] (joueur 1, joueur 2), ou null pour tout cacher ; les feux du joueur 2 copient ceux du joueur 1
  function majDeux(j) {
    const visible = !!j;
    for (const id of ['deuxHaut', 'deuxBas', 'deuxSeparation']) $(id).classList.toggle('cache', !visible);
    const f1 = $('feux'), f2 = $('feux2');
    f2.classList.toggle('cache', !visible || f1.classList.contains('cache'));
    if (!visible) return;
    const allumes = f1.querySelectorAll('span');
    f2.querySelectorAll('span').forEach((f, i) => f.classList.toggle('allume', allumes[i].classList.contains('allume')));
    ['deuxHaut', 'deuxBas'].forEach((id, i) => {
      const el = $(id), x = j[i];
      el.querySelector('.deuxNom').textContent = (i ? '🔴 ' : '🔵 ') + (x.nom || texte(i ? 'joueur2' : 'joueur1'));
      el.querySelector('.deuxPlace').textContent = x.place ? 'P' + x.place : '';
      el.querySelector('.deuxTour').textContent = texte('tour') + ' ' + x.tour + ' / ' + x.nbTours;
      el.querySelector('.deuxVitesse').textContent = Math.round(x.vitesse * 3.6) + ' ' + texte('kmh');
      el.querySelector('.deuxEcart').textContent = x.ecart === null ? '' : (x.ecart > 0 ? '+' : '−') + secondes(Math.abs(x.ecart).toFixed(1));
    });
  }

  // l'écart en direct avec le fantôme du meilleur tour (fantome.js), sous le chrono : « −0,34 » en vert (le joueur est
  // devant), « +0,12 » en rouge (derrière), « 0,00 » neutre ; null : caché
  function majEcartFantome(e) {
    const el = $('hudEcart');
    el.classList.toggle('cache', e === null || e === undefined);
    if (e === null || e === undefined) return;
    const r = Math.round(e * 100) / 100, classe = r < 0 ? 'vert' : r > 0 ? 'rouge' : 'egal';
    el.textContent = (r < 0 ? '−' : r > 0 ? '+' : '') + Math.abs(r).toFixed(2).replace('.', texte('virgule'));
    if (!el.classList.contains(classe)) el.className = classe;
  }

  // le bouton « Fantôme : affiché / masqué » (écran de qualification et menu pause) ; bascule() change le réglage
  function preparerFantome(bascule) {
    for (const id of ['boutonFantomeQualif', 'boutonFantomePause']) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', bascule);
    }
  }
  function majBoutonsFantome(visible) {
    for (const id of ['boutonFantomeQualif', 'boutonFantomePause']) $(id).textContent = texte(visible ? 'fantomeOui' : 'fantomeNon');
  }

  // la qualification du joueur : etat = 'choix' (deux boutons), 'attente' (la carte des IA se calcule encore),
  // 'resultat' ({ place, nb, temps, valide, passe, ecart, fantome } ; bouton vers la course). fantome (facultatif, le tour
  // fait) : { record (nouveau record du circuit), gagne (s de mieux que l'ancien, null s'il n'y en avait pas), ecart (s de
  // plus que le record, sinon) }
  function remplirQualif(etat, r) {
    $('qualifTitre').textContent = texte('qualifTitre');
    $('boutonQualifTour').textContent = texte('qualifTour');
    $('boutonQualifPasser').textContent = texte('qualifPasser');
    $('boutonQualifCourse').textContent = texte('qualifCourse');
    $('boutonQualifTour').classList.toggle('cache', etat !== 'choix');
    $('boutonQualifPasser').classList.toggle('cache', etat !== 'choix');
    $('boutonQualifCourse').classList.toggle('cache', etat !== 'resultat');
    let t = texte('qualifExplication');
    if (etat === 'attente') t = texte('preparation');
    else if (etat === 'resultat') {
      if (r.passe) t = texte('qualifPasse');
      else if (!r.valide) t = texte('qualifInvalide');
      else t = texte('qualifResultat').replace('{p}', r.place).replace('{n}', r.nb).replace('{t}', formatTemps(r.temps))
        + ' · ' + (r.ecart > 0 ? texte('qualifEcart').replace('{s}', r.ecart.toFixed(3).replace('.', texte('virgule'))) : texte('qualifPole'));
    }
    $('qualifTexte').textContent = t;
    const f = etat === 'resultat' && r.fantome, s = x => x.toFixed(2).replace('.', texte('virgule'));
    $('qualifFantome').textContent = !f ? '' : f.record ? (f.gagne === null ? texte('nouveauRecord') : texte('fantomeRecord').replace('{s}', s(f.gagne)))
      : f.ecart !== null ? texte('fantomeEcart').replace('{s}', s(f.ecart)) : '';
    $('boutonFantomeQualif').classList.toggle('cache', etat !== 'choix');
  }

  function preparerQualif(tour, passer, course) {
    for (const [id, f] of [['boutonQualifTour', tour], ['boutonQualifPasser', passer], ['boutonQualifCourse', course]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // le nom affiché d'un pilote et d'une écurie du championnat : le sien, sinon le nom par défaut de textes.js
  // (« You » / « Toi » pour le joueur, « Driver 7 » / « Pilote 7 », « Team 3 » / « Écurie 3 »)
  const nomPilote = p => p.nom || (p.humain ? texte('nomJoueur') : texte('pilote').replace('{n}', p.numero));
  const nomEcurie = e => e.nom || texte('ecurie').replace('{n}', e.id + 1);

  // ?championnat=1 : l'écran entre les courses. ch : le championnat ; gagne : les points du joueur à la course qui
  // vient de finir (null au démarrage) ; nomCircuit : celui du prochain Grand Prix (déjà traduit) ; suivante : le bouton
  function remplirChampionnat(ch, gagne, nomCircuit) {
    const fini = ch.prochain >= ch.calendrier.length;
    $('championnatTitre').textContent = fini ? texte('finChampionnat') : texte('titreGrandPrix').replace('{i}', ch.prochain + 1).replace('{n}', ch.calendrier.length).replace('{circuit}', nomCircuit);
    $('championnatGagne').textContent = gagne === null ? '' : texte('pointsGagnes').replace('{n}', gagne);
    $('championnatPilotesTitre').textContent = texte('classementPilotes');
    $('championnatEcuriesTitre').textContent = texte('classementEcuries');
    $('boutonCourseSuivante').textContent = texte('courseSuivante');
    $('boutonCourseSuivante').classList.toggle('cache', fini);
    const ligne = (place, couleur, nom, points, moi, k, casque) => {
      const li = document.createElement('li');
      if (moi) li.className = 'moi';
      const sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.append(contenu); return e; };
      const spNom = sp('nom', nom);
      if (casque) spNom.prepend(CASQUE.icone(casque, REGLAGES.CASQUE_ICONE));   // l'icône du casque (casque.js)
      li.append(sp('place', String(place)), pastille(couleur), spNom, sp('points', points + ' ' + texte('pts')));
      // un rival : sa fiche au clic (fiche.js, Codeur 3)
      if (k !== undefined && !moi) { li.dataset.k = k; li.classList.add('rival'); li.addEventListener('click', () => { if (ouvertureFiche) ouvertureFiche(k); }); }
      return li;
    };
    const pilotes = $('championnatPilotes'), ecuries = $('championnatEcuries');
    pilotes.textContent = ''; ecuries.textContent = '';
    CHAMPIONNAT.classementPilotes(ch).forEach((x, i) => { const p = ch.pilotes[x.k]; pilotes.appendChild(ligne(i + 1, ch.ecuries[p.ecurie].couleur, nomPilote(p), x.points, p.humain, x.k, p.casque)); });
    CHAMPIONNAT.classementEcuries(ch).forEach((x, i) => { const e = ch.ecuries[x.id]; ecuries.appendChild(ligne(i + 1, e.couleur, nomEcurie(e), x.points, e.id === REGLAGES.ECURIE_JOUEUR)); });
  }

  function preparerChampionnat(suivante, garage) {
    $('boutonCourseSuivante').addEventListener('mousedown', e => e.preventDefault());
    $('boutonCourseSuivante').addEventListener('click', suivante);
    $('boutonGarage').textContent = texte('garage');
    $('boutonGarage').addEventListener('mousedown', e => e.preventDefault());
    if (garage) $('boutonGarage').addEventListener('click', garage);
  }

  // --- l'argent et le garage (Codeur 3, argent.js et garage.js) ---
  // les résultats : les gains du Grand Prix (ARGENT.gains, avec placeNumero : la place), avec le détail ; g null : rien
  function remplirArgent(g) {
    const p = $('resultatsArgent'), F = ARGENT.formater;
    if (!g) { p.textContent = ''; return; }
    const detail = [];
    if (g.place) detail.push(avec(texte('argentPlace'), { p: g.placeNumero, n: F(g.place) }));
    if (g.meilleurTour) detail.push(avec(texte('argentMeilleurTour'), { n: F(g.meilleurTour) }));
    if (g.placesGagnees) detail.push(avec(texte('argentPlacesGagnees'), { p: g.nbPlacesGagnees, n: F(g.placesGagnees) }));
    if (g.duel) detail.push(avec(texte('argentDuel'), { n: F(g.duel) }));
    if (g.plafonne) detail.push(avec(texte('argentPlafond'), { n: F(g.total) }));
    if (g.sponsor) detail.push(avec(texte('argentSponsor'), { n: F(g.sponsor) }));   // les primes du sponsor (hors plafond de la course)
    p.textContent = avec(texte('argentGagne'), { n: F(g.total) }) + (detail.length ? ' (' + detail.join(' · ') + ')' : '');
  }

  // l'écran du championnat : le solde
  function remplirSolde(ch) {
    $('championnatArgent').textContent = avec(texte('solde'), { n: ARGENT.formater(ARGENT.solde(ch)) });
  }

  // l'écran du garage : les 4 améliorations (niveau, prix du suivant, « Acheter » grisé si impossible), le solde, le bonus
  let achatGarage = null;
  function remplirGarage(ch) {
    const R = REGLAGES, F = ARGENT.formater, g = GARAGE.completer(ch);
    $('garageTitre').textContent = texte('garageTitre');
    $('garageSolde').textContent = avec(texte('solde'), { n: F(ARGENT.solde(ch)) });
    const niveau = ch.ecuries[ch.pilotes.find(p => p.humain).ecurie].niveau;   // la voiture de l'écurie (garage.js appliquer)
    $('garageBonus').textContent = avec(texte('garageVoiture'), { n: Math.round(niveau * 100), a: (GARAGE.bonus(g) * 100).toFixed(1).replace('.', texte('virgule')), b: Math.round(R.GARAGE_PLAFOND * 100) });
    $('boutonGarageRetour').textContent = texte('garageRetour');
    const liste = $('garageListe');
    liste.textContent = '';
    for (const nom of GARAGE.NOMS) {
      const li = document.createElement('li'), prix = GARAGE.prix(ch, nom), refus = GARAGE.refus(ch, nom);
      li.dataset.nom = nom;
      const sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.textContent = contenu; return e; };
      li.append(sp('nom', texte('garage_' + nom)), sp('effet', texte('garageEffet_' + nom)),
        sp('niveau', avec(texte('garageNiveau'), { a: g[nom], b: R.GARAGE_NIVEAUX })), sp('prix', prix === null ? texte('garageMax') : F(prix)));
      const b = document.createElement('button');
      b.className = 'acheter';
      b.tabIndex = -1;
      b.textContent = texte('garageAcheter');
      b.disabled = refus !== null;
      b.title = refus === 'argent' ? texte('garageRefusArgent') : '';
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => { if (achatGarage) achatGarage(nom); });
      li.appendChild(b);
      liste.appendChild(li);
    }
  }

  // --- la fin de saison (Codeur 3, saisons.js) ---
  // le classement final de la saison et le champion (b = SAISONS.bilan ou terminerSaison)
  function remplirSaison(ch, b) {
    $('saisonTitre').textContent = avec(texte('saisonTitre'), { n: b.saison });
    const champion = ch.pilotes[b.champion];
    $('saisonChampion').textContent = champion.humain ? texte('saisonChampionToi') : avec(texte('saisonChampion'), { pilote: nomPilote(champion) });
    $('saisonChampion').classList.toggle('toi', !!champion.humain);
    $('saisonEcurie').textContent = avec(texte('saisonChampionEcurie'), { ecurie: nomEcurie(ch.ecuries[b.championEcurie]) });
    $('saisonPilotesTitre').textContent = texte('saisonClassement');
    $('boutonSaisonSuite').textContent = texte('suite');
    const ol = $('saisonPilotes');
    ol.textContent = '';
    b.pilotes.forEach((x, i) => {
      const p = ch.pilotes[x.k], li = document.createElement('li');
      if (p.humain) li.className = 'moi';
      if (i === 0) li.classList.add('champion');
      const sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.append(contenu); return e; };
      li.append(sp('place', String(i + 1)), pastille(ch.ecuries[p.ecurie].couleur), sp('nom', nomPilote(p)), sp('points', x.points + ' ' + texte('pts')));
      ol.appendChild(li);
    });
  }

  // le duel de la saison : « Tu as battu X 9 à 3 » (s = CHAMPIONNAT.scoreDuel), avec le détail et le total de carrière
  function remplirDuelSaison(ch, s) {
    $('duelSaisonTitre').textContent = texte('duelSaisonTitre');
    $('boutonDuelSaisonSuite').textContent = texte('suite');
    if (!s) { $('duelSaisonScore').textContent = ''; $('duelSaisonDetail').textContent = ''; return; }
    const nom = nomPilote(ch.pilotes[s.k]), a = s.total[0], b = s.total[1];
    $('duelSaisonScore').textContent = avec(texte(a > b ? 'duelSaisonGagne' : a < b ? 'duelSaisonPerdu' : 'duelSaisonEgal'), { nom, a, b });
    $('duelSaisonDetail').textContent = avec(texte('duelSaisonDetail'), { nom, qa: s.qualifs[0], qb: s.qualifs[1], ca: s.courses[0], cb: s.courses[1],
      ta: s.carriere.qualifs[0] + s.carriere.courses[0], tb: s.carriere.qualifs[1] + s.carriere.courses[1] });
  }

  // les contrats : la note, une ligne par offre (écurie, voiture, coéquipier, un mot, « Signer »), « Prendre ma retraite »
  let signatureContrat = null, retraiteDemandee = false;
  function remplirContrats(ch, offres, note) {
    $('contratsTitre').textContent = avec(texte('contratsTitre'), { n: ch.saison + 1 });
    $('contratsNote').textContent = avec(texte('contratsNote'), { n: Math.round(note * 100) });
    $('boutonRetraite').textContent = texte(retraiteDemandee ? 'retraiteConfirmer' : 'retraite');
    const ul = $('contratsListe'), n = ch.ecuries.length;
    ul.textContent = '';
    for (const o of offres) {
      const e = ch.ecuries[o.ecurie], li = document.createElement('li'), rang = SAISONS.rangEcurie(ch, o.ecurie);
      li.dataset.ecurie = o.ecurie;
      if (o.actuelle) li.classList.add('actuelle');
      const sp = (classe, contenu) => { const el = document.createElement('span'); el.className = classe; el.append(contenu); return el; };
      li.append(pastille(e.couleur), sp('nom', nomEcurie(e)), sp('mot', texte(rang < n / 3 ? 'contratMot_fort' : rang < 2 * n / 3 ? 'contratMot_moyen' : 'contratMot_faible') + (o.actuelle ? ' · ' + texte('contratActuelle') : '')),
        sp('niveau', avec(texte('contratNiveau'), { n: Math.round(e.niveau * 100) })),
        sp('coequipier', avec(texte('contratCoequipier'), { nom: o.coequipier === null ? '—' : nomPilote(ch.pilotes[o.coequipier]) })));
      const b = document.createElement('button');
      b.className = 'signer';
      b.tabIndex = -1;
      b.textContent = texte('contratSigner');
      b.addEventListener('mousedown', ev => ev.preventDefault());
      b.addEventListener('click', () => { if (signatureContrat) signatureContrat(o.ecurie); });
      li.appendChild(b);
      ul.appendChild(li);
    }
  }

  // la retraite : « Carrière terminée », la raison, le bilan simple (le vrai bilan est l'étape 14)
  function remplirRetraite(r) {
    $('retraiteTitre').textContent = texte('retraiteTitre');
    $('retraiteRaison').textContent = avec(texte(r.raison === 'age' ? 'retraiteAge' : 'retraiteChoix'), { n: r.saison });
    $('retraiteBilan').textContent = avec(texte('retraiteBilan'), { s: r.saisons, v: r.victoires, p: r.podiums, t: r.titres });
  }

  // la cérémonie du champion (b = SAISONS.terminerSaison) : le joueur champion → « CHAMPION DU MONDE », son nom, ses points ;
  // un rival → l'écran court « <nom> est champion du monde » et la place du joueur
  function remplirCeremonie(ch, b) {
    const p = ch.pilotes[b.champion], toi = !!p.humain, e = ch.ecuries[p.ecurie];
    $('ceremonie').classList.toggle('court', !toi);
    $('ceremonieSaison').textContent = avec(texte('ceremonieSaison'), { n: b.saison });
    $('ceremonieTitre').textContent = toi ? texte('ceremonieTitre') : avec(texte('ceremonieRival'), { pilote: nomPilote(p) });
    $('ceremonieNom').textContent = toi ? nomPilote(p) : '';
    const victoires = p.places.filter(x => x === 1).length, points = b.pilotes[0].points;
    $('ceremonieDetail').textContent = toi ? avec(texte('ceremonieDetail'), { points, v: victoires, ecurie: nomEcurie(e) })
      : avec(texte('ceremonieRivalDetail'), { points, ecurie: nomEcurie(e), place: b.joueurPlace });
    $('boutonCeremonieSuite').textContent = texte('suite');
  }

  function preparerCeremonie(suite) {
    $('boutonCeremonieSuite').addEventListener('mousedown', e => e.preventDefault());
    $('boutonCeremonieSuite').addEventListener('click', suite);
  }

  // suite : après le classement, puis après le duel ; signer(ecurie) ; retraite() : le premier clic demande une confirmation
  function preparerSaison(suiteClassement, suiteDuel, signer, retraite) {
    signatureContrat = signer;
    for (const [id, f] of [['boutonSaisonSuite', suiteClassement], ['boutonDuelSaisonSuite', suiteDuel]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
    $('boutonRetraite').addEventListener('mousedown', e => e.preventDefault());
    $('boutonRetraite').addEventListener('click', () => {
      if (!retraiteDemandee) { retraiteDemandee = true; $('boutonRetraite').textContent = texte('retraiteConfirmer'); return; }
      retraiteDemandee = false;
      retraite();
    });
  }
  const retraiteEnAttente = () => retraiteDemandee;

  // --- les sponsors (Codeur 3, sponsors.js) ---
  // les objectifs d'un sponsor en texte : « 3 podiums dans la saison · prime 20 000 € · 1 / 3 » (l'avancement si l'offre est signée)
  function texteObjectif(o, signe) {
    const nom = avec(texte('objectif_' + o.type), { n: o.n, circuit: o.circuit ? (texte('circuit_' + o.circuit) || (CIRCUITS[o.circuit] ? CIRCUITS[o.circuit].nom : o.circuit)) : '' });
    const etat = !signe ? '' : o.fait ? ' · ' + texte('objectifFait') : ' · ' + avec(texte('objectifEnCours'), { p: o.progres, n: o.n });
    return nom + ' · ' + avec(texte('objectifPrime'), { n: ARGENT.formater(o.prime) }) + etat;
  }

  // l'écran : les offres (aChoisir) avec « Choisir », ou le sponsor signé avec l'avancement de ses objectifs ; « Retour »
  let choixSponsor = null;
  function remplirSponsors(ch, offres) {
    $('sponsorsTitre').textContent = avec(texte('sponsorsTitre'), { n: ch.saison });
    $('boutonSponsorsRetour').textContent = texte('sponsorsRetour');
    const ul = $('sponsorsListe');
    ul.textContent = '';
    const signe = !SPONSORS.aChoisir(ch);
    for (const o of signe ? [ch.sponsor] : offres) {
      const li = document.createElement('li');
      li.dataset.sponsor = o.cle;
      const sp = (classe, contenu) => { const e = document.createElement(classe === 'objectifs' ? 'ul' : 'span'); e.className = classe; if (typeof contenu === 'string') e.textContent = contenu; return e; };
      const objectifs = sp('objectifs');
      for (const ob of o.objectifs) { const x = document.createElement('li'); x.textContent = texteObjectif(ob, signe); objectifs.appendChild(x); }
      li.append(sp('nom', texte('sponsor_' + o.cle)), sp('montant', avec(texte('sponsorMontant'), { n: ARGENT.formater(o.montant) })), objectifs);
      if (!signe) {
        const b = document.createElement('button');
        b.className = 'choisir';
        b.tabIndex = -1;
        b.textContent = texte('sponsorsChoisir');
        b.addEventListener('mousedown', e => e.preventDefault());
        b.addEventListener('click', () => { if (choixSponsor) choixSponsor(o.cle); });
        li.appendChild(b);
      }
      ul.appendChild(li);
    }
  }

  // le rappel au paddock (l'écran du championnat) : « Sponsor : Brio Café · objectif 1 / 3 · … » ou « Pas encore de sponsor »
  function remplirRappelSponsor(ch) {
    const s = ch.sponsor && ch.sponsor.saison === ch.saison ? ch.sponsor : null;
    $('championnatSponsor').textContent = s ? avec(texte('sponsorRappel'), { nom: texte('sponsor_' + s.cle) }) + ' · ' + s.objectifs.map(o => texteObjectif(o, true)).join(' · ') : texte('sponsorAucun');
  }

  function preparerSponsors(ouvrir, choisir, retour) {
    choixSponsor = choisir;
    $('boutonSponsors').textContent = texte('sponsors');
    for (const [id, f] of [['boutonSponsors', ouvrir], ['boutonSponsorsRetour', retour]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // --- la fiche d'un rival (Codeur 3, fiche.js) : f = FICHE.fiche(ch, k) ---
  let ouvertureFiche = null;
  function remplirFiche(ch, f) {
    const p = f.pilote, e = ch.ecuries[p.ecurie];
    $('ficheNom').textContent = nomPilote(p);
    $('ficheInfos').textContent = '';
    $('ficheInfos').append(texte('numero').replace('{n}', p.numero) + ' · ', pastille(e.couleur), ' ' + avec(texte('ficheEcurie'), { ecurie: nomEcurie(e) }) + (typeof p.age === 'number' ? ' · ' + avec(texte('ficheAge'), { n: p.age }) : ''));
    $('ficheCaractere').textContent = f.mots.length ? avec(texte('ficheCaractere'), { mots: f.mots.map(m => texte('caractere_' + m)).join(', ') }) : '';
    $('ficheSaison').textContent = avec(texte('ficheSaison'), { place: f.saison.place, points: f.saison.points, v: f.saison.victoires, p: f.saison.podiums, c: f.saison.courses });
    $('ficheHistorique').textContent = avec(texte('ficheHistorique'), { s: f.historique.saisons, t: f.historique.titres, v: f.historique.victoires, p: f.historique.podiums, q: f.historique.poles, m: f.historique.meilleur === null ? '–' : f.historique.meilleur });
    $('ficheDuels').textContent = avec(texte('ficheDuels'), { a: f.duels.devant, b: f.duels.derriere });
    $('ficheCoequipier').textContent = f.duels.coequipier ? avec(texte('ficheCoequipier'), { a: f.duels.coequipier[0], b: f.duels.coequipier[1] }) : '';
    // la rivalité posée par l'interview (interview.js) : « “phrase” — circuit, saison N · rivalité : encore n courses »
    const rv = f.rivalite;
    $('ficheRivalite').textContent = rv ? avec(texte('ficheRivalite'), { phrase: INTERVIEW.phrase(rv.cle, rv.variante, rv.params, ch, { pilote: nomPilote }),
      circuit: rv.circuit ? (texte('circuit_' + rv.circuit) || (CIRCUITS[rv.circuit] ? CIRCUITS[rv.circuit].nom : rv.circuit)) : '–', saison: rv.saison, n: rv.courses }) : '';
    $('fichePhoto').title = texte('fichePhoto');   // la photo stylisée (le casque) viendra ; la place est gardée
    $('fichePhoto').style.setProperty('--ecurie', couleurCss(e.couleur));
    $('boutonFicheRetour').textContent = texte('ficheRetour');
  }

  // l'interview d'après course (interview.js, Codeur 3) : le journaliste (inventé, textes.js) et le journal, la question, les trois
  // réponses avec l'icône de leur ton, « Pas de commentaire » ; après le choix : la ligne d'effet et « Continuer »
  const ICONES_TON = { provocant: '😤', calme: '🤝', malin: '😏' };
  const majuscule = s => s[0].toUpperCase() + s.slice(1);
  function remplirInterview(ch, q) {
    const noms = { pilote: nomPilote };
    $('interviewTitre').textContent = texte('interviewTitre');
    $('interviewJournaliste').textContent = texte('interviewJournaliste') + ' — ' + texte('journalNom');
    $('interviewQuestion').textContent = INTERVIEW.phrase('interview_' + q.fait + '_q', q.variante, q.params, ch, noms);
    const ul = $('interviewReponses');
    ul.textContent = '';
    for (const r of q.reponses) {
      const li = document.createElement('li'), b = document.createElement('button'), ic = document.createElement('span'), tx = document.createElement('span');
      b.dataset.ton = r.ton; b.tabIndex = -1; b.title = texte('ton' + majuscule(r.ton));
      ic.className = 'icone'; ic.textContent = ICONES_TON[r.ton];
      tx.className = 'reponse'; tx.textContent = INTERVIEW.phrase(r.cle, 0, q.params, ch, noms);
      b.append(ic, tx); li.appendChild(b); ul.appendChild(li);
    }
    $('boutonPasCommentaire').textContent = texte('interviewPasCommentaire');
    $('boutonInterviewSuite').textContent = texte('continuer');
    $('interviewEffet').textContent = '';
    $('interviewChoix').classList.remove('cache');
    $('interviewSuite').classList.add('cache');
  }

  function montrerEffetInterview(ch, r) {
    $('interviewEffet').textContent = r.ligne ? INTERVIEW.phrase(r.ligne.cle, 0, r.ligne.params, ch, { pilote: nomPilote }) : '';
    $('interviewChoix').classList.add('cache');
    $('interviewSuite').classList.remove('cache');
  }

  function preparerInterview(repondre, suite) {
    for (const id of ['interviewReponses', 'boutonPasCommentaire', 'boutonInterviewSuite']) $(id).addEventListener('mousedown', e => e.preventDefault());
    $('interviewReponses').addEventListener('click', e => { const b = e.target.closest('button[data-ton]'); if (b) repondre(b.dataset.ton); });
    $('boutonPasCommentaire').addEventListener('click', () => repondre(null));
    $('boutonInterviewSuite').addEventListener('click', suite);
  }

  // les trois jauges de réputation (public, écurie, sponsors ; 0 à 100) au paddock : trois petites barres
  function remplirReputation(ch) {
    const div = $('championnatReputation');
    div.textContent = '';
    for (const j of INTERVIEW.JAUGES) {
      const x = ch.reputation && typeof ch.reputation[j] === 'number' ? Math.round(ch.reputation[j]) : REGLAGES.REPUTATION_DEPART;
      const s = document.createElement('span'), nom = document.createElement('span'), barre = document.createElement('span'), plein = document.createElement('span'), val = document.createElement('span');
      s.className = 'jauge'; s.dataset.jauge = j; s.title = texte('reputation' + majuscule(j)) + ' : ' + x + ' / 100';
      nom.className = 'nom'; nom.textContent = texte('reputation' + majuscule(j));
      barre.className = 'barre'; plein.className = 'plein'; plein.style.width = x + '%'; barre.appendChild(plein);
      val.className = 'valeur'; val.textContent = x;
      s.append(nom, barre, val); div.appendChild(s);
    }
  }

  function preparerFiche(ouvrir, retour) {
    ouvertureFiche = ouvrir;
    $('boutonFicheRetour').addEventListener('mousedown', e => e.preventDefault());
    $('boutonFicheRetour').addEventListener('click', retour);
  }

  function preparerGarage(acheter, retour) {
    achatGarage = acheter;
    $('boutonGarageRetour').addEventListener('mousedown', e => e.preventDefault());
    $('boutonGarageRetour').addEventListener('click', retour);
  }

  function preparerPause(reprendre, recommencer) {
    $('pauseTitre').textContent = texte('pause');
    $('boutonReprendre').textContent = texte('reprendre');
    $('boutonRecommencer').textContent = texte('recommencer');
    for (const [id, f] of [['boutonReprendre', reprendre], ['boutonRecommencer', recommencer]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  function preparerFin(rejouer, changer) {
    $('boutonRejouer').textContent = texte('rejouer');
    $('boutonChanger').textContent = texte('changerLongueur');
    for (const [id, f] of [['boutonRejouer', rejouer], ['boutonChanger', changer]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // l'écran de fin : temps total, meilleur tour, les tours (✂ = virage coupé), le record
  function remplirFin(c, nouveauRecord) {
    $('finTitre').textContent = texte('fin');
    $('finTotal').textContent = texte('tempsTotal') + ' ' + formatTemps(tempsTotal(c));
    $('finMeilleur').textContent = texte('meilleurTour') + ' ' + formatTemps(c.meilleurTour);
    $('finPenalites').textContent = c.penalites ? texte('penalites') + ' +' + secondes(c.penalites) : '';
    $('finRecord').textContent = nouveauRecord ? texte('nouveauRecord') : '';
    const liste = $('finTours');
    liste.textContent = '';
    c.tours.forEach((t, i) => {
      const li = document.createElement('li');
      li.textContent = texte('tour') + ' ' + (i + 1) + ' · ' + formatTemps(t.temps) + (t.coupe ? ' ✂' : '') + (t.temps === c.meilleurTour ? ' ★' : '');
      liste.appendChild(li);
    });
  }

  // --- le mode 2 joueurs (deux-joueurs.js, tour 25b ordre 3) : le menu « Entre amis », l'écran avant la course, le podium à deux,
  // la rivalité. preparerAmis(deux, tournoi, paddock) : les boutons du menu (tournoi = null : « bientôt », grisé) et « Entre amis » au paddock
  function preparerAmis(deux, tournoi, paddock) {
    $('boutonAmisDeux').textContent = texte('amisDeux');
    $('boutonAmisTournoi').textContent = texte('amisTournoi') + (tournoi ? '' : ' — ' + texte('bientot'));
    $('boutonAmisTournoi').disabled = !tournoi;
    $('boutonAmisRetour').textContent = texte('retour');
    $('boutonAmisPaddock').textContent = texte('titreAmis');
    for (const [id, f] of [['boutonAmisDeux', deux], ['boutonAmisTournoi', tournoi]]) {
      if (!f) continue;
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
    $('boutonAmisPaddock').addEventListener('mousedown', e => e.preventDefault());
    $('boutonAmisPaddock').addEventListener('click', paddock);
  }

  // l'écran avant la course : r = les réglages (DEUX_JOUEURS.completer) ; les listes, puis les valeurs
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  function majIconeDeux(i) {
    const el = $('deuxIcone' + i);
    el.textContent = '';
    el.append(CASQUE.icone(lireCasqueDeux(i), REGLAGES.CASQUE_ICONE + 8));
  }
  function lireCasqueDeux(i) {
    return CASQUE.creer($('deuxMotif' + i).value, ['a', 'b', 'c'].map(x => parseInt($('deuxCasque' + i + x).value.slice(1), 16)));
  }
  function choisirCouleurDeux(i, c) {
    $('deuxCouleurs' + i).dataset.couleur = String(c);
    for (const b of $('deuxCouleurs' + i).children) b.classList.toggle('choisie', Number(b.dataset.couleur) === c);
  }
  function remplirDeux(r) {
    const R = REGLAGES;
    $('deuxTitre').textContent = texte('deuxTitre');
    for (const cl of ['deuxNomTexte', 'deuxCouleurTexte', 'deuxCasqueTexte']) for (const e of document.getElementsByClassName(cl)) e.textContent = texte(cl.replace('Texte', ''));
    for (const [id, cle] of [['deuxCircuitTexte', 'deuxCircuit'], ['deuxToursTexte', 'deuxTours'], ['deuxIATexte', 'deuxIA'], ['deuxNiveauTexte', 'deuxNiveau']]) $(id).textContent = texte(cle);
    $('boutonDeuxPartir').textContent = texte('deuxPartir');
    $('boutonDeuxRetour').textContent = texte('retour');
    $('deuxErreur').textContent = '';
    const options = (id, liste, nom) => { const s = $(id); s.textContent = ''; for (const v of liste) { const o = document.createElement('option'); o.value = String(v); o.textContent = nom(v); s.appendChild(o); } };
    options('deuxCircuit', Object.keys(CIRCUITS), c => nomCircuit(c));
    options('deuxTours', R.DEUX_TOURS_CHOIX, n => n + ' ' + texte('tours'));
    options('deuxIA', R.DEUX_IA_CHOIX.filter(n => n <= R.DEUX_VOITURES_MAX - 2), n => String(n));
    options('deuxNiveau', Object.keys(R.NIVEAUX), n => texte('niveau_' + n));
    $('deuxCircuit').value = r.circuit; $('deuxTours').value = String(r.tours); $('deuxIA').value = String(r.ia); $('deuxNiveau').value = r.niveau;
    [1, 2].forEach(i => {
      const j = r.joueurs[i - 1], bloc = $('deuxJoueur' + i);
      bloc.querySelector('h2').textContent = (i === 1 ? '🔵 ' : '🔴 ') + texte('joueur' + i);
      bloc.querySelector('.deuxTouches').textContent = texte('deuxTouches' + i);
      const nom = $('deuxNom' + i);
      nom.maxLength = R.NOM_LONGUEUR_MAX; nom.placeholder = texte('joueur' + i); nom.value = j.nom;
      const couleurs = $('deuxCouleurs' + i);
      couleurs.textContent = '';
      for (const c of R.DEUX_COULEURS_CHOIX) {
        const b = document.createElement('button');
        b.tabIndex = -1; b.className = 'deuxPastille'; b.dataset.couleur = String(c); b.style.background = hex(c);
        b.addEventListener('mousedown', e => e.preventDefault());
        b.addEventListener('click', () => choisirCouleurDeux(i, c));
        couleurs.appendChild(b);
      }
      choisirCouleurDeux(i, j.couleur);
      options('deuxMotif' + i, R.CASQUE_MOTIFS, m => texte('motif_' + m));
      $('deuxMotif' + i).value = j.casque.motif;
      ['a', 'b', 'c'].forEach((x, k) => { $('deuxCasque' + i + x).value = hex(j.casque.couleurs[k]); });
      majIconeDeux(i);
    });
  }

  // les choix tapés : { joueurs: [{ nom, couleur, casque }, …], circuit, tours, ia, niveau }
  function lireDeux() {
    return {
      joueurs: [1, 2].map(i => ({ nom: $('deuxNom' + i).value, couleur: Number($('deuxCouleurs' + i).dataset.couleur), casque: lireCasqueDeux(i) })),
      circuit: $('deuxCircuit').value, tours: Number($('deuxTours').value), ia: Number($('deuxIA').value), niveau: $('deuxNiveau').value,
    };
  }

  function montrerErreursDeux(erreurs) {
    $('deuxErreur').textContent = erreurs.includes('nom') ? texte('deuxErreurNom') : erreurs.includes('couleur') ? texte('deuxErreurCouleur') : '';
  }

  function preparerDeux(partir, retour) {
    for (const [id, f] of [['boutonDeuxPartir', partir], ['boutonDeuxRetour', retour]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
    for (const i of [1, 2]) {
      $('deuxNom' + i).addEventListener('keydown', e => e.stopPropagation());   // taper son nom ne conduit pas la voiture
      for (const id of ['deuxMotif' + i, 'deuxCasque' + i + 'a', 'deuxCasque' + i + 'b', 'deuxCasque' + i + 'c']) $(id).addEventListener('input', () => majIconeDeux(i));
      $('deuxMotif' + i).addEventListener('change', () => majIconeDeux(i));
    }
  }

  // le podium à deux : la place de chaque joueur, même hors du podium ; j = [{ nom, place, couleur }, …] ou null (caché)
  function remplirPodiumDeux(j) {
    $('podiumDeux').classList.toggle('cache', !j);
    if (!j) return;
    $('podiumDeux').textContent = j.map((x, i) => (i ? '🔴 ' : '🔵 ') + avec(texte('deuxPlace'), { nom: x.nom, p: x.place })).join('   ');
  }

  // le score de la rivalité : r = { noms: [a, b], score: [x, y] } ou null (caché) ; « Léo 3 – 2 Sarah »
  function remplirRivalite(r) {
    $('resultatsRivalite').classList.toggle('cache', !r);
    if (!r) return;
    $('resultatsRivalite').textContent = texte('rivaliteTitre') + ' : ' + avec(texte('rivalite'), { a: r.noms[0], x: r.score[0], y: r.score[1], b: r.noms[1] });
  }

  return { preparerAmis, remplirDeux, lireDeux, montrerErreursDeux, preparerDeux, remplirPodiumDeux, remplirRivalite, formatTemps, formatEcart, nomPilote, nomEcurie, preparerChoix, montrer, majCourse, majClassement, preparerPause, preparerFin, remplirFin, preparerResultats, remplirPodium, remplirResultats, majPreparation, remplirChampionnat, preparerChampionnat, remplirQualif, preparerQualif,
    remplirDuel, avec, remplirUne, preparerUne, remplirArgent, remplirSolde, remplirGarage, preparerGarage,
    remplirSaison, remplirDuelSaison, remplirContrats, remplirRetraite, preparerSaison, retraiteEnAttente, remplirCeremonie, preparerCeremonie,
    remplirSponsors, remplirRappelSponsor, preparerSponsors, remplirFiche, preparerFiche, remplirInterview, montrerEffetInterview, preparerInterview, remplirReputation,
    majEcartFantome, preparerFantome, majBoutonsFantome, majDepart, majDeux, preparerTitre, remplirBravo, majAides, remplirPilote, lirePilote, montrerErreursPilote, preparerPilote, nomCircuit, remplirCasque, lireCasque, modePilote, preparerCasque };
})();
