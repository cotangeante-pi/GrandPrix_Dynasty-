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
    for (const id of ['choix', 'pause', 'fin', 'podium', 'resultats', 'championnat', 'qualif', 'une', 'garage', 'saison', 'duelSaison', 'contrats', 'retraite', 'titre', 'amis', 'bravo', 'pilote', 'sponsors', 'fiche', 'interview', 'ceremonie', 'temple', 'heritier', 'calendrier', 'deuxReglages', 'resume', 'grille', 'tournoiInscription', 'tournoiAToi', 'tournoiPause', 'tournoiManche', 'tournoiFin', 'aileron', 'arbre', 'discussion']) $(id).classList.toggle('cache', id !== ecran);
    // l'album des unes (Codeur 3) : la page de la une, avec la barre pour feuilleter
    if (ecran === 'album') $('une').classList.remove('cache');
    $('une').classList.toggle('album', ecran === 'album');
    // le bandeau de course n'est là que pendant la course et la pause (pas sous l'écran de fin)
    const course = ecran === 'course' || ecran === 'pause';
    for (const id of ['hudCourse', 'hudPenalite', 'hudStand', 'compte', 'feux', 'classement', 'radar', 'jauge', 'departResultat', 'aides', 'feux2', 'jauge2', 'departResultat2', 'deuxHaut', 'deuxBas', 'deuxSeparation']) if (!course) $(id).classList.add('cache');
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
    majStand(c);
  }

  // l'arrêt au stand (étape 7, course.js : c.arrets, c.arretEnCours, c.arretConseille) : pendant l'arrêt, le temps qui reste ;
  // juste après, « pneus neufs » ; avant son arrêt obligatoire, le tour conseillé (au départ, puis à partir du tour d'avant)
  function messageStand(c) {
    // la consigne d'équipe (simulation.js, majConsignes) qui vise le joueur, devant son coéquipier : la demande, puis le résultat 3 s
    const k = c.consigne;
    if (k && k.joueur && c.etat === 'course') {
      if (!k.resultat) return texte('consigneJoueur').replace('{n}', k.numero);
      if (c.temps - k.finCourse < 3) return texte(k.resultat === 'suivie' ? 'consigneSuivie' : 'consigneIgnoree');
    }
    if (!c.arrets || c.etat !== 'course') return null;
    const v = n => secondes(n.toFixed(1));
    if (c.arretEnCours) return texte('standEnCours').replace('{s}', v(Math.max(0, c.arretEnCours.reste)));
    const dernier = c.arrets[c.arrets.length - 1];
    if (dernier && c.temps - c.arretFin < 3) return texte('standFait').replace('{s}', v(dernier.duree));
    if (c.arretConseille && !c.arrets.length && (c.temps < 6 || c.tours.length + 2 >= c.arretConseille))
      return texte('standConseille').replace('{t}', c.arretConseille).replace('{s}', REGLAGES_PNEUS.PENALITE_SANS_ARRET);
    return null;
  }
  function majStand(c) {
    const m = messageStand(c);
    $('hudStand').classList.toggle('cache', !m);
    if (m) $('hudStand').textContent = m;
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
      if (l.stand) li.children[3].textContent = texte('standTour');   // dans la voie des stands (étape 7)
      li.children[3].classList.toggle('stand', !!l.stand);
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
    return elider(t.replace(/\{(\w+)\}/g, (m, cle) => valeurs[cle] !== undefined ? valeurs[cle] : m));   // (« d’Alex » : textes.js, elider)
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
    // la photo (photo.js) : dessinée par le code depuis la une compacte (JOURNAL.photo), jamais une image enregistrée
    let cv = $('unePhoto').querySelector('canvas');
    if (!cv) { cv = document.createElement('canvas'); cv.width = 600; cv.height = 330; cv.getContext('2d', { willReadFrequently: true }); $('unePhoto').appendChild(cv); }   // (dessiné par le processeur : la même image partout, même une fois affiché)
    PHOTO.dessiner(cv.getContext('2d'), cv.width, cv.height, r.photo);
    cv.dataset.desc = JSON.stringify(r.photo);   // (ce que la photo montre : les tests le comparent à la une compacte)
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

  // l'album : où on en est (« Saison 2 · Grand Prix 5 · 17 / 36 ») ; les boutons de saison grisés au bout de l'album
  function remplirAlbum(ch, i) {
    const u = ch.album[i], S = JOURNAL.saisonsAlbum(ch), k = S.findIndex(x => x.saison === u.s);
    $('albumPage').textContent = avec(texte('albumPage'), { s: u.s, g: u.g, i: i + 1, n: ch.album.length });
    $('boutonAlbumAvant').disabled = i === 0;
    $('boutonAlbumApres').disabled = i === ch.album.length - 1;
    $('boutonAlbumSaisonAvant').disabled = k <= 0 && i === 0;
    $('boutonAlbumSaisonApres').disabled = k === S.length - 1;
    $('boutonAlbumFermer').textContent = texte('albumFermer');
  }

  // ouvrir (le bouton du paddock) ; feuilleter(±1) ; saison(±1) ; fermer. Un clic sur la barre ne compte pas comme un clic sur la page
  function preparerAlbum(ouvrir, feuilleter, saison, fermer) {
    $('boutonAlbum').textContent = texte('album');
    $('boutonAlbum').title = texte('albumAide');
    const brancher = (id, f) => {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', e => { e.stopPropagation(); f(); });
    };
    brancher('boutonAlbum', ouvrir);
    brancher('boutonAlbumAvant', () => feuilleter(-1));
    brancher('boutonAlbumApres', () => feuilleter(1));
    brancher('boutonAlbumSaisonAvant', () => saison(-1));
    brancher('boutonAlbumSaisonApres', () => saison(1));
    brancher('boutonAlbumFermer', fermer);
    $('albumBarre').addEventListener('click', e => e.stopPropagation());
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
      tr.style.setProperty('--i', corps.children.length);   // (le thème télé : les lignes arrivent une à une, style.css)
      const numero = document.createElement('span');
      numero.append(pastille(l.couleur), ' ');
      if (l.casque) numero.append(CASQUE.icone(l.casque, REGLAGES.CASQUE_ICONE));
      numero.append(l.nom ? l.nom : String(l.numero));   // (le mode 2 joueurs : le nom de chaque joueur)
      const ecart = l.ecart === null || l.place === 1 ? '' : '+' + secondes(l.ecart.toFixed(3));
      // sa place sur la grille, et les places gagnées (▲) ou perdues (▼) depuis
      const gagne = l.grille - l.place, grille = l.grille + ' ' + (gagne > 0 ? '▲' + gagne : gagne < 0 ? '▼' + -gagne : '=');
      // (le tour de ses arrêts au stand, étape 7, à côté des pénalités)
      const arrets = l.arrets && l.arrets.length ? ' · ' + l.arrets.map(t => texte('resultatArret').replace('{t}', t)).join(' · ') : '';
      for (const contenu of [String(l.place), numero, l.total === null ? texte('enCourse') : formatTemps(l.total), penalite(l.penalites) + arrets, ecart, grille]) {
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
    optionsMotifs(motif);
    motif.value = c.motif;
    for (let i = 0; i < 3; i++) $('casqueC' + (i + 1)).value = '#' + c.couleurs[i].toString(16).padStart(6, '0');
  }

  function lireCasque() {
    return CASQUE.creer($('casqueMotif').value, [1, 2, 3].map(i => parseInt($('casqueC' + i).value.slice(1), 16)));
  }

  // la liste des motifs d'un éditeur de casque : ceux de départ, puis ceux à débloquer (casque.js) ; un motif pas encore débloqué est
  // grisé, avec sa condition (« Couronne — 🔒 un titre »)
  function optionsMotifs(select) {
    const debloques = SAUVEGARDE.motifs();
    select.textContent = '';
    for (const m of CASQUE.tousLesMotifs()) {
      const o = document.createElement('option'), ok = CASQUE.permis(m, debloques);
      o.value = m; o.disabled = !ok;
      o.textContent = texte('motif_' + m) + (ok ? '' : ' — 🔒 ' + texte('deblocage_' + REGLAGES.CASQUE_DEBLOCAGES[m]).replace('{n}', REGLAGES.CASQUE_PODIUMS_DEBLOCAGE));
      select.appendChild(o);
    }
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
    $('championnatGagne').textContent = gagne === null ? '' : elider(texte('pointsGagnes').replace('{n}', gagne));   // (« 1 point » : accorder)
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
      li.append(sp('place', ch.resultats.length ? String(place) : '–'), pastille(couleur), spNom, sp('points', points + ' ' + texte('pts')));   // (avant la première course : pas de place)
      // (le thème télé : après une course, la ligne arrive à son rang et ses points montent jusqu'à --tv-fin, style.css ; le texte ne change pas)
      li.style.setProperty('--i', place - 1); li.lastChild.style.setProperty('--tv-fin', points); li.lastChild.dataset.suffixe = ' ' + texte('pts');
      // un rival : sa fiche au clic (fiche.js, Codeur 3)
      if (k !== undefined && !moi) { li.dataset.k = k; li.classList.add('rival'); li.addEventListener('click', () => { if (ouvertureFiche) ouvertureFiche(k); }); }
      return li;
    };
    const pilotes = $('championnatPilotes'), ecuries = $('championnatEcuries');
    pilotes.textContent = ''; ecuries.textContent = '';
    $('championnatTableaux').classList.toggle('tvMonte', gagne !== null);   // les points qui montent, seulement au retour d'une course
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
      li.append(pastille(e.couleur), sp('nom', nomEcurie(e)), sp('mot', texte(rang < n / 3 ? 'contratMot_fort' : rang < 2 * n / 3 ? 'contratMot_moyen' : 'contratMot_faible') + (o.actuelle ? ' · ' + texte('contratActuelle') : '')
          + (SAISONS.signataire(ch, o.ecurie) ? ' · ' + avec(texte('contratSigne'), { nom: nomPilote(Object.assign({ humain: false }, SAISONS.signataire(ch, o.ecurie))) }) : '')),   // la relève : l'offre signée d'un ancien rival du parent
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
    $('retraiteRaison').textContent = avec(texte(r.raison === 'age' ? 'retraiteAge' : 'retraiteChoix'), { n: r.raison === 'age' ? r.saisons : r.saison });   // (l'âge : les saisons de la carrière, la relève compte les siennes)
    $('retraiteBilan').textContent = avec(texte('retraiteBilan'), { s: nombre(r.saisons, 'saison'), v: nombre(r.victoires, 'victoire'), p: nombre(r.podiums, 'podium'), t: nombre(r.titres, 'titre') });
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
    $('ceremonieDetail').textContent = toi ? avec(texte('ceremonieDetail'), { points: nombre(points, 'point'), v: nombre(victoires, 'victoire'), ecurie: nomEcurie(e) })
      : avec(texte('ceremonieRivalDetail'), { points: nombre(points, 'point'), ecurie: nomEcurie(e), place: b.joueurPlace });
    $('boutonCeremonieSuite').textContent = texte('suite');
  }

  function preparerCeremonie(suite) {
    $('boutonCeremonieSuite').addEventListener('mousedown', e => e.preventDefault());
    $('boutonCeremonieSuite').addEventListener('click', suite);
  }

  // --- le bilan de carrière et le temple de la renommée (Codeur 3, carriere.js) ---
  // b = CARRIERE.bilan ; une = la une préférée rendue (JOURNAL.rendreAlbum) ou null ; place, n : sa place au temple et sa taille
  function remplirBilan(ch, b, une, place, n) {
    // le casque du pilote qui s'arrête, devant le titre (son motif, débloqué ou non, tel qu'il l'a porté)
    if (CASQUE.valide(b.casque)) { const c = CASQUE.icone(b.casque, 34); c.id = 'bilanCasque'; $('retraiteTitre').prepend(c, ' '); }
    const E = texte('bilanEtiquettes'), tiret = '—';
    const valeurs = [b.saisons, b.titres, b.victoires, b.podiums, b.poles, b.meilleursTours, b.meilleurePlace ? 'P' + b.meilleurePlace : tiret,
      b.domicile ? 'P' + b.domicile : tiret, b.reaction ? secondes(Math.round(b.reaction * 1000) / 1000) : tiret];
    const ul = $('bilanStats');
    ul.textContent = '';
    valeurs.forEach((x, i) => {
      const li = document.createElement('li'), e = document.createElement('span'), v = document.createElement('span');
      e.className = 'etiquette'; e.textContent = E[i]; v.className = 'valeur'; v.textContent = String(x);
      li.append(e, v); ul.appendChild(li);
    });
    const duels = b.duels.slice(0, 3).map(d => avec(texte('bilanDuel'), { nom: nomPilote(Object.assign({ humain: false }, d.pilote)), a: d.total[0], b: d.total[1] }));
    $('bilanDuels').textContent = duels.length ? avec(texte('bilanDuels'), { liste: duels.join(' · ') }) : texte('bilanAucunDuel');
    $('bilanUne').textContent = une ? avec(texte('bilanUne'), { titre: une.titre, s: une.saison, g: une.grandPrix }) : texte('bilanAucuneUne');
    $('bilanTemple').textContent = place ? avec(texte('bilanTemple'), { p: place, n }) : avec(texte('bilanHorsTemple'), { n: REGLAGES.TEMPLE_MAX });
    $('boutonTemple').textContent = texte('temple');
    // la relève : les records de la famille, et les deux suites (« Continuer la dynastie », « Nouvelle dynastie » avec confirmation)
    const f = CARRIERE.recordsFamille(ch);
    $('bilanFamille').textContent = avec(texte('bilanFamille'), { g: nombre(f.generations, 'generation'), t: nombre(f.titres, 'titre'), v: nombre(f.victoires, 'victoire'), c: nombre(f.championnes, 'championne') });
    $('boutonContinuerDynastie').textContent = texte('continuerDynastie');
    nouvelleDemandee = false;
    $('boutonNouvelleDynastie').textContent = texte('nouvelleDynastie');
  }
  let nouvelleDemandee = false;

  // le calendrier de la saison (CHAMPIONNAT.calendrierSaison) : chaque Grand Prix, son circuit, fait (vainqueur, ta place) ou à venir,
  // le prochain mis en valeur, le Grand Prix à domicile marqué d'une petite maison dessinée en CSS
  function remplirCalendrier(ch, liste) {
    $('calendrierTitre').textContent = avec(texte('calendrierTitre'), { n: ch.saison });
    $('boutonCalendrierRetour').textContent = texte('calendrierRetour');
    const ol = $('calendrierListe'), sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.append(contenu); return e; };
    ol.textContent = '';
    for (const g of liste) {
      const li = document.createElement('li');
      if (g.fait) li.classList.add('fait');
      if (g.prochain) li.classList.add('prochain');
      if (g.domicile) li.classList.add('domicile');
      const nom = sp('circuit', nomCircuit(g.circuit));
      if (g.domicile) { const m = document.createElement('i'); m.className = 'maison'; m.title = texte('calendrierDomicile'); nom.prepend(m); }
      const etat = g.fait ? (g.place === 1 ? texte('calendrierVictoire') : avec(texte('calendrierFait'), { vainqueur: nomPilote(ch.pilotes[g.vainqueur]), place: g.place })) : texte(g.prochain ? 'calendrierProchain' : 'calendrierAVenir');   // (le joueur a gagné : « ta victoire », jamais son nom comme vainqueur)
      li.append(sp('numero', String(g.numero)), nom, sp('etat', etat + (g.domicile ? ' · ' + texte('calendrierDomicile') : '')));
      ol.appendChild(li);
    }
  }

  function preparerCalendrier(ouvrir, retour) {
    $('boutonCalendrier').textContent = texte('calendrier');
    for (const [id, f] of [['boutonCalendrier', ouvrir], ['boutonCalendrierRetour', retour]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // l'arbre de la dynastie : chaque génération (son casque, son nom, saisons, titres, victoires, podiums, meilleur résultat à
  // domicile), la génération d'aujourd'hui marquée (en piste, ou qui vient de s'arrêter), puis les records de famille
  function remplirArbre(ch) {
    const gens = ch.dynastie.generations.concat([Object.assign(CARRIERE.resume(ch), { actuel: !ch.retraite })]);
    $('arbreEcranTitre').textContent = texte('arbreTitre');
    $('boutonArbreRetour').textContent = texte('arbreRetour');
    const ol = $('arbreGenerations'), sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.append(contenu); return e; };
    ol.textContent = '';
    gens.forEach((g, i) => {
      const li = document.createElement('li');
      if (i === gens.length - 1) li.classList.add('actuel');
      const casque = CASQUE.valide(g.casque) ? CASQUE.icone(g.casque, 26) : document.createElement('span');
      const chiffres = avec(texte('arbreLigne'), { s: nombre(g.saisons, 'saison'), t: nombre(g.titres, 'titre'), v: nombre(g.victoires, 'victoire'), p: nombre(g.podiums, 'podium'), dom: g.domicile ? 'P' + g.domicile : '—' });
      li.append(sp('rang', String(i + 1)), sp('casque', casque), sp('nom', nomPilote({ nom: g.nom, numero: g.numero, humain: true }) + (g.actuel ? ' · ' + texte('arbreActuel') : '')), sp('chiffres', chiffres));
      ol.appendChild(li);
    });
    const f = CARRIERE.recordsFamille(ch);
    $('arbreFamille').textContent = avec(texte('bilanFamille'), { g: nombre(f.generations, 'generation'), t: nombre(f.titres, 'titre'), v: nombre(f.victoires, 'victoire'), c: nombre(f.championnes, 'championne') });
    const circuits = Object.entries(f.circuits).sort((a, b) => b[1] - a[1]).map(([c, n]) => nomCircuit(c) + ' ' + n);
    $('arbreCircuits').textContent = circuits.length ? avec(texte('arbreCircuits'), { liste: circuits.join(' · ') }) : texte('arbreAucuneVictoire');
  }

  function preparerArbre(ouvrir, retour) {
    $('boutonArbre').textContent = texte('arbre');
    $('boutonArbreBilan').textContent = texte('arbre');
    for (const [id, f] of [['boutonArbre', ouvrir], ['boutonArbreBilan', ouvrir], ['boutonArbreRetour', retour]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // continuer() : l'écran de l'héritier ; nouvelle() : un monde neuf (le premier clic demande une confirmation)
  function preparerReleve(continuer, nouvelle, valider) {
    for (const id of ['boutonContinuerDynastie', 'boutonNouvelleDynastie', 'boutonHeritierValider']) $(id).addEventListener('mousedown', e => e.preventDefault());
    $('boutonContinuerDynastie').addEventListener('click', continuer);
    $('boutonNouvelleDynastie').addEventListener('click', () => {
      if (!nouvelleDemandee) { nouvelleDemandee = true; $('boutonNouvelleDynastie').textContent = texte('nouvelleConfirmer'); return; }
      nouvelleDemandee = false;
      nouvelle();
    });
    $('boutonHeritierValider').addEventListener('click', valider);
    $('heritierPays').addEventListener('change', majDomicileHeritier);
    for (const id of ['heritierPrenom', 'heritierNumero']) $(id).addEventListener('input', () => montrerErreurHeritier(false));   // le message part dès qu'on corrige
  }

  // la course de cœur suit le pays (un pays qui a un circuit : son Grand Prix à domicile, d'office)
  function majDomicileHeritier() {
    const maison = PILOTE.domicile($('heritierPays').value);
    $('heritierCoeur').disabled = !!maison;
    if (maison) $('heritierCoeur').value = maison;
  }

  // l'écran de l'héritier : le parent nommé (jamais genré), le nom de famille gardé, un numéro libre, les quatre liens, le pays et
  // la course de cœur du parent par défaut, le motif du casque (les couleurs du parent) ; l'arbre de la dynastie
  function remplirHeritier(ch) {
    const R = REGLAGES, j = PILOTE.joueur(ch), parent = nomPilote(j), fam = ch.dynastie.generations.length ? ch.dynastie.famille : CARRIERE.famille(j.nom);
    $('heritierTitre').textContent = texte('heritierTitre');
    $('heritierParent').textContent = avec(texte('heritierParent'), { parent });
    for (const [id, cle] of [['heritierPrenomTexte', 'heritierPrenom'], ['heritierNumeroTexte', 'heritierNumero'], ['heritierLienTexte', 'heritierLien'], ['heritierPaysTexte', 'heritierPays'], ['heritierCoeurTexte', 'heritierCoeur']]) $(id).textContent = texte(cle);
    $('heritierMotifTexte').textContent = avec(texte('heritierMotif'), { parent });
    $('heritierFamille').textContent = fam ? avec(texte('heritierFamille'), { famille: fam }) : '';
    $('heritierPrenom').maxLength = R.NOM_LONGUEUR_MAX; $('heritierPrenom').value = '';
    const numero = $('heritierNumero');
    numero.min = R.NUMERO_MIN; numero.max = R.NUMERO_MAX;
    let libre = R.NUMERO_MIN; while ((!PILOTE.numeroLibre(ch, libre) || libre === j.numero) && libre < R.NUMERO_MAX) libre++;
    numero.value = libre;
    const options = (id, liste, nom) => { const s = $(id); s.textContent = ''; for (const x of liste) { const o = document.createElement('option'); o.value = x; o.textContent = nom(x); s.appendChild(o); } };
    options('heritierLien', CARRIERE.LIENS, l => avec(texte('heritierLien_' + l), { parent }));
    options('heritierPays', R.PAYS.slice().sort((a, b) => texte('pays_' + a).localeCompare(texte('pays_' + b), LANGUE)), c => texte('pays_' + c));
    options('heritierCoeur', Object.keys(R.CIRCUITS_PAYS), nomCircuit);
    optionsMotifs($('heritierMotif'));   // tous les motifs : ceux de départ et ceux débloqués (SAUVEGARDE.motifs) ; les autres grisés, avec leur condition
    $('heritierPays').value = j.pays || R.PAYS[0];
    $('heritierCoeur').value = j.coeur || Object.keys(R.CIRCUITS_PAYS)[0];
    majDomicileHeritier();
    $('heritierMotif').value = CARRIERE.casqueParent(ch).motif;
    $('heritierErreur').textContent = '';
    $('boutonHeritierValider').textContent = texte('heritierValider');
    // l'arbre : chaque génération finie, puis le pilote qui s'arrête
    $('arbreTitre').textContent = texte('arbreTitre');
    const ol = $('arbreListe');
    ol.textContent = '';
    for (const g of ch.dynastie.generations.concat([CARRIERE.resume(ch)])) {
      const li = document.createElement('li');
      li.textContent = avec(texte('releveParent'), { parent: nomPilote({ nom: g.nom, numero: g.numero, humain: true }), s: nombre(g.saisons, 'saison'), t: nombre(g.titres, 'titre'), v: nombre(g.victoires, 'victoire'), p: nombre(g.podiums, 'podium') });
      ol.appendChild(li);
    }
  }

  // les choix de l'écran de l'héritier (le casque : les couleurs du parent, le motif choisi)
  function lireHeritier(ch) {
    const c = CARRIERE.casqueParent(ch);
    return { prenom: $('heritierPrenom').value, numero: $('heritierNumero').value, lien: $('heritierLien').value, pays: $('heritierPays').value, coeur: $('heritierCoeur').value,
      casque: CASQUE.creer($('heritierMotif').value, c.couleurs), debloques: SAUVEGARDE.motifs() };
  }

  function montrerErreurHeritier(oui) {
    $('heritierErreur').textContent = oui ? texte('heritierErreur') : '';
  }

  // le temple : les carrières finies classées (titres, puis victoires) ; moi : le numéro d'entrée (n) de la carrière qui vient de finir
  function remplirTemple(liste, records, moi) {
    $('templeTitre').textContent = texte('templeTitre');
    $('templeRecordsTitre').textContent = texte('templeRecordsTitre');
    $('boutonTempleRetour').textContent = texte('templeRetour');
    const ol = $('templeListe'), sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.textContent = contenu; return e; };
    ol.textContent = '';
    if (!liste.length) ol.appendChild(sp('vide', texte('templeVide')));
    liste.forEach((c, i) => {
      const li = document.createElement('li');
      if (c.n === moi) li.className = 'moi';
      li.dataset.n = c.n;
      li.append(sp('place', String(i + 1)), sp('nom', nomPilote({ nom: c.nom, numero: c.numero, humain: true }) + ' #' + c.numero), sp('ligne', avec(texte('templeLigne'), { t: nombre(c.titres, 'titre'), v: nombre(c.victoires, 'victoire'), p: nombre(c.podiums, 'podium'), s: nombre(c.saisons, 'saison') })));
      ol.appendChild(li);
    });
    const ul = $('templeRecords');
    ul.textContent = '';
    for (const cle of CARRIERE.RECORDS.concat(['reaction'])) {
      const r = records[cle];
      if (!r) continue;
      const li = document.createElement('li');
      li.dataset.record = cle;
      li.textContent = avec(texte('recordLigne'), { quoi: texte('record_' + cle), valeur: cle === 'reaction' ? secondes(Math.round(r.valeur * 1000) / 1000) : r.valeur, nom: nomPilote({ nom: r.nom, numero: r.numero, humain: true }) });
      ul.appendChild(li);
    }
  }

  function preparerTemple(ouvrir, retour) {
    for (const [id, f] of [['boutonTemple', ouvrir], ['boutonTempleRetour', retour]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
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
    // la relève : « J'ai couru contre Alex Rossi. Alex Rossi ne lâchait jamais rien. » (jamais genré sur le pilote précédent)
    const g = f.famille === null || f.famille === undefined ? null : ch.dynastie.generations[f.famille];
    $('ficheFamille').textContent = g ? avec(texte('ficheFamille'), { parent: nomPilote({ nom: g.nom, numero: g.numero, humain: true }) }) : '';
    $('ficheInfos').textContent = '';
    $('ficheInfos').append(texte('numero').replace('{n}', p.numero) + ' · ', pastille(e.couleur), ' ' + avec(texte('ficheEcurie'), { ecurie: nomEcurie(e) }) + (typeof p.age === 'number' ? ' · ' + avec(texte('ficheAge'), { n: p.age }) : ''));
    $('ficheCaractere').textContent = f.mots.length ? avec(texte('ficheCaractere'), { mots: f.mots.map(m => texte('caractere_' + m)).join(', ') }) : '';
    // avant sa première course de la saison : pas de place (« pas encore de classement »)
    $('ficheSaison').textContent = f.saison.courses ? avec(texte('ficheSaison'), { place: f.saison.place, points: f.saison.points, v: f.saison.victoires, p: f.saison.podiums, c: f.saison.courses }) : texte('ficheSaisonAucune');
    $('ficheHistorique').textContent = avec(texte('ficheHistorique'), { s: f.historique.saisons, t: f.historique.titres, v: f.historique.victoires, p: f.historique.podiums, q: f.historique.poles, m: f.historique.meilleur === null ? '–' : f.historique.meilleur });
    $('ficheDuels').textContent = avec(texte('ficheDuels'), { a: f.duels.devant, b: f.duels.derriere });
    $('ficheCoequipier').textContent = f.duels.coequipier ? avec(texte('ficheCoequipier'), { a: f.duels.coequipier[0], b: f.duels.coequipier[1] }) : '';
    // la rivalité posée par l'interview (interview.js) : « “phrase” — circuit, saison N · rivalité : encore n courses »
    const rv = f.rivalite;
    $('ficheRivalite').textContent = rv ? avec(texte('ficheRivalite'), { phrase: INTERVIEW.phrase(rv.cle, rv.variante, rv.params, ch, { pilote: nomPilote }),
      circuit: rv.circuit ? (texte('circuit_' + rv.circuit) || (CIRCUITS[rv.circuit] ? CIRCUITS[rv.circuit].nom : rv.circuit)) : '–', saison: rv.saison, n: rv.courses }) : '';
    $('fichePhoto').title = texte('fichePhoto');
    $('fichePhoto').style.setProperty('--ecurie', couleurCss(e.couleur));
    // la photo stylisée (photo.js) : son casque en grand, sa voiture aux couleurs de son écurie
    let pc = $('fichePhoto').querySelector('canvas');
    if (!pc) { pc = document.createElement('canvas'); pc.width = 220; pc.height = 260; pc.getContext('2d', { willReadFrequently: true }); $('fichePhoto').appendChild(pc); }
    PHOTO.portrait(pc.getContext('2d'), pc.width, pc.height, { couleur: e.couleur, casque: p.casque });
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

  // --- l'aileron (Codeur 3, aileron.js, carte2d.js) : circuit = construireCircuit de la prochaine course, nom = son nom ;
  // cran = le cran du joueur sur ce circuit. Aucun conseil : la carte, le curseur, la voiture, deux barres
  function remplirAileron(circuit, nom, cran) {
    $('aileronTitre').textContent = avec(texte('aileronTitre'), { circuit: nom });
    $('aileronBas').textContent = texte('aileronBas'); $('aileronHaut').textContent = texte('aileronHaut');
    $('aileronVirages').textContent = texte('aileronVirages'); $('aileronVitesse').textContent = texte('aileronVitesse');
    $('boutonAileronRetour').textContent = texte('garageRetour');
    const km = (Math.round(circuit.longueur / 10) / 100).toFixed(2).replace('.', texte('virgule'));
    CARTE2D.dessiner($('aileronCarte').getContext('2d'), circuit, $('aileronCarte').width, $('aileronCarte').height, nom, avec(texte('aileronLongueur'), { km }));
    $('aileronCurseur').max = REGLAGES.AILERON_CRANS - 1;
    majAileron(cran);
  }

  // le curseur, la voiture (son aileron arrière monte avec le cran) et les deux barres
  function majAileron(cran) {
    $('aileronCurseur').value = cran;
    $('aileronCran').textContent = avec(texte('aileronCran'), { n: cran + 1, max: REGLAGES.AILERON_CRANS });
    const b = AILERON.barres(cran);
    $('barreVirages').style.width = Math.round(b.virages * 100) + '%';
    $('barreVitesse').style.width = Math.round(b.vitesse * 100) + '%';
    const c = $('aileronVoiture').getContext('2d'), x = cran / (REGLAGES.AILERON_CRANS - 1);
    c.clearRect(0, 0, 220, 90);
    c.fillStyle = '#d8dbe3';
    c.beginPath(); c.moveTo(14, 64); c.lineTo(60, 52); c.lineTo(150, 46); c.lineTo(178, 34); c.lineTo(186, 64); c.closePath(); c.fill();   // le corps, vu de côté
    c.fillStyle = '#222'; for (const rx of [48, 168]) { c.beginPath(); c.arc(rx, 66, 13, 0, 6.283); c.fill(); }   // les roues
    // l'aileron arrière : son volet s'incline plus quand le cran monte (de presque plat à très incliné)
    c.save(); c.translate(196, 24); c.rotate(-0.08 - x * 0.6); c.fillStyle = '#ffd666'; c.fillRect(-18, -3, 36, 6); c.restore();
    c.fillStyle = '#888'; c.fillRect(188, 26, 4, 22);
  }

  function preparerAileron(ouvrir, changer, retour) {
    $('boutonAileron').textContent = texte('aileron');
    for (const [id, f] of [['boutonAileron', ouvrir], ['boutonAileronRetour', retour]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
    $('aileronCurseur').addEventListener('input', () => changer(Number($('aileronCurseur').value)));
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
    $('deuxErreur').textContent = '';   // un choix changé : l'ancien message d'erreur part (il revient au prochain « C'est parti ! » s'il le faut)
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
      optionsMotifs($('deuxMotif' + i));
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
      $('deuxNom' + i).addEventListener('input', () => { $('deuxErreur').textContent = ''; });
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

  // --- le tournoi chrono entre copains (tournoi.js, tour 26b) : l'inscription, « À toi, Sarah ! », le classement de la manche (le
  // nouveau temps glisse à sa place, une phrase), le classement général avec les points, le classement final
  function ligneInscription(i, j) {
    const li = document.createElement('li');
    li.className = 'tournoiJoueur';
    const nom = document.createElement('input');
    nom.type = 'text'; nom.maxLength = REGLAGES.NOM_LONGUEUR_MAX; nom.placeholder = texte('joueurN').replace('{n}', i + 1); nom.value = j.prenom || '';
    nom.className = 'tournoiPrenom'; nom.autocomplete = 'off'; nom.spellcheck = false;
    nom.addEventListener('keydown', e => e.stopPropagation());   // taper son prénom ne conduit pas la voiture
    nom.addEventListener('input', () => { $('tournoiErreur').textContent = ''; });
    const icone = document.createElement('span'); icone.className = 'tournoiIcone';
    const motif = document.createElement('select'); motif.className = 'tournoiMotif';
    optionsMotifs(motif);
    motif.value = j.casque.motif;
    const couleurs = [0, 1, 2].map(k => { const c = document.createElement('input'); c.type = 'color'; c.className = 'tournoiCouleur'; c.value = hex(j.casque.couleurs[k]); return c; });
    const maj = () => { icone.textContent = ''; icone.append(CASQUE.icone(casqueLigne(li), REGLAGES.CASQUE_ICONE + 6)); };
    for (const e of [motif, ...couleurs]) e.addEventListener('input', maj);
    motif.addEventListener('change', maj);
    const enlever = document.createElement('button');
    enlever.tabIndex = -1; enlever.className = 'tournoiEnlever'; enlever.textContent = '✕'; enlever.title = texte('tournoiEnlever');
    enlever.addEventListener('mousedown', e => e.preventDefault());
    enlever.addEventListener('click', () => { if ($('tournoiListe').children.length > REGLAGES.TOURNOI_JOUEURS_MIN) { li.remove(); majInscription(); } });
    li.append(icone, nom, motif, ...couleurs, enlever);
    maj();
    return li;
  }
  function casqueLigne(li) {
    return CASQUE.creer(li.querySelector('.tournoiMotif').value, [...li.querySelectorAll('.tournoiCouleur')].map(c => parseInt(c.value.slice(1), 16)));
  }
  // les numéros d'attente (« Joueur 3 ») et les boutons + / ✕ suivent le nombre de joueurs
  function majInscription() {
    const ls = [...$('tournoiListe').children], R = REGLAGES;
    ls.forEach((li, i) => { li.querySelector('.tournoiPrenom').placeholder = texte('joueurN').replace('{n}', i + 1); li.querySelector('.tournoiEnlever').disabled = ls.length <= R.TOURNOI_JOUEURS_MIN; });
    $('boutonTournoiAjouter').disabled = ls.length >= R.TOURNOI_JOUEURS_MAX;
    $('tournoiErreur').textContent = '';
  }
  function choisirFormuleTournoi(f) {
    $('tournoiInscription').dataset.formule = f;
    $('boutonFormuleEclair').classList.toggle('choisie', f === 'eclair');
    $('boutonFormuleTournoi').classList.toggle('choisie', f === 'tournoi');
    for (let m = 1; m < REGLAGES.TOURNOI_MANCHES; m++) $('tournoiCircuit' + m).classList.toggle('cache', f !== 'tournoi');
  }
  // r = { joueurs: [{ prenom, casque }], formule, circuits: [nom ou '' (au hasard), …] }
  function remplirInscription(r) {
    const R = REGLAGES;
    $('tournoiTitre').textContent = texte('tournoiTitre');
    $('boutonTournoiAjouter').textContent = texte('tournoiAjouter');
    $('boutonFormuleEclair').textContent = texte('formuleEclair');
    $('boutonFormuleTournoi').textContent = texte('formuleTournoi');
    $('tournoiCircuitsTexte').textContent = texte('tournoiCircuits');
    $('boutonTournoiPartir').textContent = texte('deuxPartir');
    $('boutonTournoiRetour').textContent = texte('retour');
    const liste = $('tournoiListe');
    liste.textContent = '';
    r.joueurs.forEach((j, i) => liste.appendChild(ligneInscription(i, j)));
    for (let m = 0; m < R.TOURNOI_MANCHES; m++) {
      const s = $('tournoiCircuit' + m);
      s.textContent = '';
      for (const c of [''].concat(Object.keys(CIRCUITS))) { const o = document.createElement('option'); o.value = c; o.textContent = c ? nomCircuit(c) : texte('auHasard'); s.appendChild(o); }
      s.value = r.circuits[m] || '';
    }
    choisirFormuleTournoi(r.formule);
    majInscription();
  }
  function lireInscription() {
    const f = $('tournoiInscription').dataset.formule;
    return {
      joueurs: [...$('tournoiListe').children].map(li => ({ prenom: li.querySelector('.tournoiPrenom').value, casque: casqueLigne(li) })),
      formule: f, circuits: [...Array(REGLAGES.TOURNOI_MANCHES)].map((x, m) => $('tournoiCircuit' + m).value),
    };
  }
  function montrerErreursTournoi(erreurs) {
    $('tournoiErreur').textContent = erreurs.includes('nombre') ? avec(texte('tournoiErreurNombre'), { min: REGLAGES.TOURNOI_JOUEURS_MIN, max: REGLAGES.TOURNOI_JOUEURS_MAX }) : erreurs.includes('prenom') ? texte('tournoiErreurPrenom') : '';
  }
  // partir, retour : les boutons ; ajouter un joueur (son casque par défaut)
  function preparerInscription(partir, retour) {
    for (const [id, f] of [['boutonTournoiPartir', partir], ['boutonTournoiRetour', retour], ['boutonTournoiAjouter', () => {
      const n = $('tournoiListe').children.length;
      if (n >= REGLAGES.TOURNOI_JOUEURS_MAX) return;
      $('tournoiListe').appendChild(ligneInscription(n, { prenom: '', casque: TOURNOI.casqueDefaut(n) }));
      majInscription();
    }], ['boutonFormuleEclair', () => choisirFormuleTournoi('eclair')], ['boutonFormuleTournoi', () => choisirFormuleTournoi('tournoi')]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // « À toi, Sarah ! » : j = { prenom, casque }, manche (0…), nbManches, circuit (son nom affiché), reste (s du compte à rebours)
  function remplirAToi(j, manche, nbManches, circuit) {
    $('atoiTitre').textContent = texte('aToi').replace('{prenom}', j.prenom);
    $('atoiIcone').textContent = '';
    $('atoiIcone').append(CASQUE.icone(j.casque, 64));
    $('atoiManche').textContent = (nbManches > 1 ? avec(texte('tournoiManche'), { m: manche + 1, n: nbManches }) + ' · ' : '') + circuit;
    $('atoiAide').textContent = texte('aToiAide');
  }
  function majCompteTournoi(reste) {
    $('atoiCompte').textContent = reste > 0 ? String(Math.ceil(reste)) : texte('go');
  }

  // la pause pendant un tour du tournoi : reprendre ou abandonner (pas de temps)
  function preparerPauseTournoi(reprendre, abandonner) {
    $('tournoiPauseTitre').textContent = texte('pause');
    $('boutonTournoiReprendre').textContent = texte('reprendre');
    $('boutonTournoiAbandon').textContent = texte('tournoiAbandon');
    for (const [id, f] of [['boutonTournoiReprendre', reprendre], ['boutonTournoiAbandon', abandonner]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // le tableau d'un classement : lignes = [{ prenom, casque, temps (null : pas de temps), penalites, points, nouveau }]
  function tableauTournoi(id, lignes, avecPoints) {
    const ol = $(id);
    ol.textContent = '';
    for (const l of lignes) {
      const li = document.createElement('li');
      if (l.nouveau) li.className = 'nouveau';
      const nom = document.createElement('span'); nom.className = 'nom'; nom.append(CASQUE.icone(l.casque, REGLAGES.CASQUE_ICONE), ' ' + l.prenom);
      const temps = document.createElement('span'); temps.className = 'temps';
      temps.textContent = l.temps === null ? texte('pasDeTemps') : formatTemps(l.temps) + (l.penalites > 0 ? ' (' + penalite(l.penalites) + ')' : '');
      li.append(nom, temps);
      if (avecPoints) { const p = document.createElement('span'); p.className = 'points'; p.textContent = l.points + ' ' + texte('pts'); li.append(p); }
      ol.appendChild(li);
    }
  }
  // après un passage : le classement de la manche (le nouveau temps glisse à sa place), la phrase, et en 🏆 à la fin de la manche le
  // général ; bouton : { texte, f }
  function remplirMancheTournoi(titre, phrase, lignes, general, bouton) {
    $('tournoiMancheTitre').textContent = titre;
    $('tournoiPhrase').textContent = phrase;
    tableauTournoi('tournoiMancheListe', lignes, false);
    $('tournoiGeneral').classList.toggle('cache', !general);
    if (general) { $('tournoiGeneralTitre').textContent = texte('tournoiGeneral'); tableauTournoi('tournoiGeneralListe', general, true); }
    $('boutonTournoiSuite').textContent = bouton;
  }
  function preparerMancheTournoi(suite) {
    $('boutonTournoiSuite').addEventListener('mousedown', e => e.preventDefault());
    $('boutonTournoiSuite').addEventListener('click', suite);
  }
  // le classement final et ses boutons
  function remplirFinTournoi(lignes, avecPoints) {
    $('tournoiFinTitre').textContent = texte('tournoiFin');
    tableauTournoi('tournoiFinListe', lignes, avecPoints);
    $('boutonTournoiRejouer').textContent = texte('tournoiRejouer');
    $('boutonTournoiNouveaux').textContent = texte('tournoiNouveaux');
  }
  function preparerFinTournoi(rejouer, nouveaux) {
    for (const [id, f] of [['boutonTournoiRejouer', rejouer], ['boutonTournoiNouveaux', nouveaux]]) {
      $(id).addEventListener('mousedown', e => e.preventDefault());
      $(id).addEventListener('click', f);
    }
  }

  // --- le résumé vidéo de la course (resume.js) : le bouton « ▶ Résumé » des résultats, le bandeau du moment, la sortie (clic)
  function preparerResume(ouvrir, sortir) {
    $('annonceMotif').addEventListener('click', () => $('annonceMotif').classList.add('cache'));   // (l'annonce d'un motif se ferme d'un clic)
    $('boutonResume').textContent = texte('resume');
    $('resumeTitre').textContent = texte('resumeTitre');
    $('resumeSortir').textContent = texte('resumeSortir');
    $('boutonResume').addEventListener('mousedown', e => e.preventDefault());
    $('boutonResume').addEventListener('click', ouvrir);
    $('resume').addEventListener('mousedown', e => e.preventDefault());
    $('resume').addEventListener('click', sortir);
  }
  // ?pneus=1 : p = { reste (0–1), perte (0–1) } ou null (caché)
  function majPneus(p) {
    $('pneusHud').classList.toggle('cache', !p);
    if (!p) return;
    $('pneusTexte').textContent = texte('pneus') + ' ' + Math.round(p.reste * 100) + ' %';
    $('pneusPlein').style.width = Math.round(Math.max(0, Math.min(1, p.reste)) * 100) + '%';
    $('pneusPlein').className = p.reste < 0.3 ? 'use' : p.reste < 0.6 ? 'moyen' : '';
    // la perte d'adhérence, seulement quand elle se voit (à partir de PNEUS_PERTE_AFFICHEE : jamais « −0,0 % »)
    const visible = p.perte >= REGLAGES.PNEUS_PERTE_AFFICHEE;
    $('pneusAdherence').classList.toggle('cache', !visible);
    $('pneusAdherence').textContent = visible ? texte('pneusAdherence').replace('{p}', (p.perte * 100).toFixed(1).replace('.', texte('virgule'))) : '';
  }
  // le message de course du moment (ou null : caché)
  function majMessage(t) {
    $('messageCourse').classList.toggle('cache', !t);
    if (t && $('messageCourse').textContent !== t) $('messageCourse').textContent = t;
  }
  function preparerGrille(passer) {
    $('grilleAide').textContent = texte('grillePasser');
    $('grille').addEventListener('mousedown', e => e.preventDefault());
    $('grille').addEventListener('click', passer);
  }
  function montrerBoutonResume(oui) { $('boutonResume').classList.toggle('cache', !oui); }
  function majResume(moment) { $('resumeMoment').textContent = moment || ''; }

  // l'annonce d'un motif de casque gagné (au paddock, une fois) : le motif sur les couleurs du casque du joueur ; un clic ou
  // ANNONCE_MOTIF_DUREE la ferment
  let minuterieAnnonce = null;
  function annoncerMotifs(motifs, casque) {
    const el = $('annonceMotif');
    clearTimeout(minuterieAnnonce);
    el.classList.toggle('cache', !motifs.length);
    if (!motifs.length) return;
    el.textContent = '';
    for (const m of motifs) {
      const ligne = document.createElement('div');
      const c = casque.couleurs, couleurs = [c[0], c[1] === c[0] ? REGLAGES.CASQUE_PALETTE[1] : c[1], c[2]];   // (le casque neutre : deux fois la même couleur, le motif ne se verrait pas)
      ligne.append(CASQUE.icone({ motif: m, couleurs }, 40), ' ' + texte('motifGagne').replace('{motif}', texte('motif_' + m)));
      el.appendChild(ligne);
    }
    minuterieAnnonce = setTimeout(() => el.classList.add('cache'), REGLAGES.ANNONCE_MOTIF_DUREE * 1000);
  }

  // --- le paddock, l'écran d'accueil (tour 32, Codeur 3) : le prochain Grand Prix en grand (surtitre, carte 2D du circuit,
  // domicile), ta place au championnat et l'écart au leader, les noms des groupes de boutons. circuit : le circuit construit
  // du prochain Grand Prix (null : pas de carte) ; nom : son nom affiché (remplirChampionnat garde le titre et les classements)
  function remplirPaddock(ch, circuit, nom) {
    const fini = ch.prochain >= ch.calendrier.length, cal = CHAMPIONNAT.calendrierSaison(ch), gp = fini ? null : cal[ch.prochain];
    $('paddockSurtitre').textContent = texte(fini ? 'paddockFini' : 'paddockProchain');
    $('paddockDomicile').classList.toggle('cache', !(gp && gp.domicile));
    $('paddockDomicileTexte').textContent = texte('paddockDomicile');
    const cv = $('paddockCarte');
    cv.classList.toggle('cache', !circuit || fini);
    if (circuit && !fini) {
      const km = (Math.round(circuit.longueur / 10) / 100).toFixed(2).replace('.', texte('virgule'));
      CARTE2D.dessiner(cv.getContext('2d'), circuit, cv.width, cv.height, nom, avec(texte('aileronLongueur'), { km }));
    }
    // ta place : « P7 · 74 pts · à 109 pts du leader » (« en tête » si tu l'es) ; avant la première course, rien de classé
    const cl = CHAMPIONNAT.classementPilotes(ch), j = ch.pilotes.findIndex(p => p.humain), i = cl.findIndex(x => x.k === j);
    const moi = cl[i], ecart = moi ? cl[0].points - moi.points : 0;
    $('paddockPlace').textContent = !ch.resultats.length || !moi ? texte('paddockPasClasse')
      : avec(texte('paddockPlace'), { p: i + 1, n: moi.points }) + ' · ' + (i === 0 ? texte('paddockLeader') : elider(avec(texte('paddockEcart'), { n: ecart })));
    for (const g of ['Course', 'Equipe', 'Saison', 'Amis']) $('paddockGroupe' + g).textContent = texte('paddockGroupe' + g);
  }

  // --- les discussions (Codeur 3, étape 12b, discussion.js) : l'en-tête (son portrait, son nom, l'humeur de sa relation avec toi),
  // le fil de la conversation (fil = [{ de: 'moi' | 'lui', texte }]), le composeur (une intention par bouton ; « bloquer » prend le
  // pilote choisi dans la liste) et la saisie libre
  let envoiDiscussion = null, compositionDiscussion = null;
  function remplirDiscussion(ch, k, fil, intentions) {
    const p = ch.pilotes[k], e = ch.ecuries[p.ecurie], m = p.memoire || { relation: 0 };
    const co = CHAMPIONNAT.coequipierDe(ch);
    $('discussionSurtitre').textContent = texte(co && co.id === k ? 'discussionCoequipier' : 'discussionRival');
    $('discussionNom').textContent = nomPilote(p);
    const humeur = m.relation >= REGLAGES.DISCUSSION_AMI ? 'bonne' : m.relation <= -REGLAGES.DISCUSSION_ENNEMI ? 'tendue' : 'neutre';
    $('discussionHumeur').textContent = texte('discussionHumeur_' + humeur) + (p.rivalite ? ' · ' + texte('discussionRivalite') : '');
    $('discussionHumeur').className = humeur;
    let pc = $('discussionPortrait').querySelector('canvas');
    if (!pc) { pc = document.createElement('canvas'); pc.width = 110; pc.height = 130; $('discussionPortrait').appendChild(pc); }
    PHOTO.portrait(pc.getContext('2d'), pc.width, pc.height, { couleur: e.couleur, casque: p.casque });
    const ol = $('discussionFil');
    ol.textContent = '';
    if (!fil.length) { const li = document.createElement('li'); li.className = 'aide'; li.textContent = texte('discussionAide'); ol.appendChild(li); }
    for (const l of fil) { const li = document.createElement('li'); li.className = l.de; li.textContent = l.texte; ol.appendChild(li); }
    ol.scrollTop = ol.scrollHeight;
    // le composeur : les intentions proposées pour ce pilote, et la liste des pilotes pour « bloquer »
    const zone = $('discussionComposeur'), cible = $('discussionCible');
    for (const b of [...zone.querySelectorAll('button')]) b.remove();
    for (const i of intentions) {
      const b = document.createElement('button'); b.className = 'intention' + (['provoquer', 'menacer'].includes(i) ? ' danger' : ''); b.dataset.intention = i; b.tabIndex = -1;
      b.textContent = texte('intention_' + i);
      b.addEventListener('mousedown', ev => ev.preventDefault());
      b.addEventListener('click', () => { if (compositionDiscussion) compositionDiscussion(i, Number(cible.value)); });
      zone.insertBefore(b, cible);
    }
    cible.textContent = '';
    for (const x of ch.pilotes) if (!x.humain && x.id !== k) { const o = document.createElement('option'); o.value = x.id; o.textContent = nomPilote(x); cible.appendChild(o); }
    cible.title = texte('discussionCibleAide');
    $('discussionTexte').placeholder = texte('discussionPlaceholder');
    $('boutonDiscussionEnvoyer').textContent = texte('discussionEnvoyer');
    $('boutonDiscussionRetour').textContent = texte('discussionRetour');
  }
  function preparerDiscussion(envoyer, composer, retour) {
    envoiDiscussion = envoyer; compositionDiscussion = composer;
    const envoi = () => { const t = $('discussionTexte').value; $('discussionTexte').value = ''; if (envoiDiscussion) envoiDiscussion(t); };
    $('boutonDiscussionEnvoyer').addEventListener('mousedown', e => e.preventDefault());
    $('boutonDiscussionEnvoyer').addEventListener('click', envoi);
    $('discussionTexte').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); envoi(); } });
    $('boutonDiscussionRetour').addEventListener('mousedown', e => e.preventDefault());
    $('boutonDiscussionRetour').addEventListener('click', retour);
    $('boutonFicheDiscuter').textContent = texte('ficheDiscuter');
    $('boutonParlerCoequipier').textContent = texte('parlerCoequipier');
  }

  return { majPneus, majMessage, preparerGrille, annoncerMotifs, preparerResume, montrerBoutonResume, majResume, remplirInscription, lireInscription, montrerErreursTournoi, preparerInscription, remplirAToi, majCompteTournoi, preparerPauseTournoi, remplirMancheTournoi, preparerMancheTournoi, remplirFinTournoi, preparerFinTournoi, preparerAmis, remplirDeux, lireDeux, montrerErreursDeux, preparerDeux, remplirPodiumDeux, remplirRivalite, formatTemps, formatEcart, nomPilote, nomEcurie, preparerChoix, montrer, majCourse, majClassement, preparerPause, preparerFin, remplirFin, preparerResultats, remplirPodium, remplirResultats, majPreparation, remplirChampionnat, remplirPaddock, remplirDiscussion, preparerDiscussion, preparerChampionnat, remplirQualif, preparerQualif,
    remplirDuel, avec, remplirUne, preparerUne, remplirArgent, remplirSolde, remplirGarage, preparerGarage,
    remplirSaison, remplirDuelSaison, remplirContrats, remplirRetraite, preparerSaison, retraiteEnAttente, remplirCeremonie, preparerCeremonie, remplirAlbum, preparerAlbum, remplirBilan, remplirTemple, preparerTemple, preparerReleve, remplirHeritier, lireHeritier, montrerErreurHeritier, remplirAileron, majAileron, preparerAileron, remplirArbre, preparerArbre, remplirCalendrier, preparerCalendrier,
    remplirSponsors, remplirRappelSponsor, preparerSponsors, remplirFiche, preparerFiche, remplirInterview, montrerEffetInterview, preparerInterview, remplirReputation,
    majEcartFantome, preparerFantome, majBoutonsFantome, majDepart, majDeux, preparerTitre, remplirBravo, majAides, remplirPilote, lirePilote, montrerErreursPilote, preparerPilote, nomCircuit, remplirCasque, lireCasque, modePilote, preparerCasque };
})();
