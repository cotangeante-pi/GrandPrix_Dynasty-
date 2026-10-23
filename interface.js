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
    for (const id of ['choix', 'pause', 'fin', 'podium', 'resultats', 'championnat', 'qualif', 'une', 'titre', 'amis', 'bravo']) $(id).classList.toggle('cache', id !== ecran);
    // le bandeau de course n'est là que pendant la course et la pause (pas sous l'écran de fin)
    const course = ecran === 'course' || ecran === 'pause';
    for (const id of ['hudCourse', 'hudPenalite', 'compte', 'feux', 'classement', 'radar', 'jauge', 'departResultat', 'aides']) if (!course) $(id).classList.add('cache');
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
      carte.className = 'marche marche' + place;
      const titre = document.createElement('strong');
      titre.append(String(place) + ' ', pastille(x.couleur), ' ' + texte('numero').replace('{n}', x.numero));
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
      numero.append(pastille(l.couleur), ' ' + l.numero);
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
    $('amisTexte').textContent = texte('amisBientot');
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
    $('bravoArgent').textContent = texte('bravoArgent').replace('{n}', prime);
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

  // le départ parfait (depart.js) : pendant les feux, la jauge du régime de départ avec sa zone verte (DEPART_VERT), jusqu'au
  // lancement ; après, le résultat et le temps de réaction pendant DEPART_AFFICHAGE s (record : « ★ record de réaction ! »)
  function majDepart(c, ecran, record) {
    const d = c && c.depart, jauge = $('jauge'), res = $('departResultat');
    const tenue = !!d && d.humain && d.lance === null && ecran === 'course' && c.etat !== 'finie' && (c.etat !== 'compte' || c.compte < c.feux.total);
    jauge.classList.toggle('cache', !tenue);
    if (tenue) {
      const [bas, haut] = REGLAGES.DEPART_VERT;
      $('jaugeVert').style.left = (bas * 100) + '%';
      $('jaugeVert').style.width = ((haut - bas) * 100) + '%';
      $('jaugeAiguille').style.left = (d.regime * 100) + '%';
      $('jaugeAide').textContent = texte('departAide');
    }
    const montre = !!d && d.humain && d.lance !== null && ecran === 'course' && d.t - d.lance < REGLAGES.DEPART_AFFICHAGE;
    res.classList.toggle('cache', !montre);
    if (montre) {
      const cle = { parfait: 'departParfait', bon: 'departBon', patinage: 'departPatinage', cale: 'departCale', faux: 'departFaux' }[d.resultat];
      res.textContent = texte(cle) + ' · ' + secondes(Math.max(0, d.reaction).toFixed(2)) + (record ? ' ★ ' + texte('departRecord') : '');
      res.className = d.resultat;
    }
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
    const ligne = (place, couleur, nom, points, moi) => {
      const li = document.createElement('li');
      if (moi) li.className = 'moi';
      const sp = (classe, contenu) => { const e = document.createElement('span'); e.className = classe; e.append(contenu); return e; };
      li.append(sp('place', String(place)), pastille(couleur), sp('nom', nom), sp('points', points + ' ' + texte('pts')));
      return li;
    };
    const pilotes = $('championnatPilotes'), ecuries = $('championnatEcuries');
    pilotes.textContent = ''; ecuries.textContent = '';
    CHAMPIONNAT.classementPilotes(ch).forEach((x, i) => { const p = ch.pilotes[x.k]; pilotes.appendChild(ligne(i + 1, ch.ecuries[p.ecurie].couleur, nomPilote(p), x.points, p.humain)); });
    CHAMPIONNAT.classementEcuries(ch).forEach((x, i) => { const e = ch.ecuries[x.id]; ecuries.appendChild(ligne(i + 1, e.couleur, nomEcurie(e), x.points, e.id === REGLAGES.ECURIE_JOUEUR)); });
  }

  function preparerChampionnat(suivante) {
    $('boutonCourseSuivante').addEventListener('mousedown', e => e.preventDefault());
    $('boutonCourseSuivante').addEventListener('click', suivante);
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

  return { formatTemps, formatEcart, nomPilote, nomEcurie, preparerChoix, montrer, majCourse, majClassement, preparerPause, preparerFin, remplirFin, preparerResultats, remplirPodium, remplirResultats, majPreparation, remplirChampionnat, preparerChampionnat, remplirQualif, preparerQualif,
    remplirDuel, avec, remplirUne, preparerUne,
    majEcartFantome, preparerFantome, majBoutonsFantome, majDepart, preparerTitre, remplirBravo, majAides };
})();
