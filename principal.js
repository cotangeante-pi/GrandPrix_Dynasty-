// Le démarrage : il branche la physique et l'affichage sur la boucle.
// La voiture du joueur roule sur le circuit de test, ou sur celui de ?circuit=… (un nom de CIRCUITS, donnees.js).
const PARAMETRES = new URLSearchParams(location.search);
// ?championnat=1 : le championnat sauvegardé, ou un nouveau ; son prochain Grand Prix choisit le circuit de la page
const CHAMPIONNAT_EN_COURS = PARAMETRES.get('championnat') === '1' ? (SAUVEGARDE.championnat() || CHAMPIONNAT.creer(Number(PARAMETRES.get('graine')) || 1)) : null;
const NOM_CIRCUIT = CHAMPIONNAT_EN_COURS && CHAMPIONNAT_EN_COURS.prochain < CHAMPIONNAT_EN_COURS.calendrier.length ? CHAMPIONNAT_EN_COURS.calendrier[CHAMPIONNAT_EN_COURS.prochain].circuit
  : Object.prototype.hasOwnProperty.call(CIRCUITS, PARAMETRES.get('circuit')) ? PARAMETRES.get('circuit') : 'test';
const CIRCUIT = NOM_CIRCUIT === 'test' ? CIRCUIT_TEST : construireCircuit(CIRCUITS[NOM_CIRCUIT]);
// ?niveau=debutant|normal|expert|legende : le niveau de difficulté des IA (normal par défaut)
if (Object.prototype.hasOwnProperty.call(REGLAGES.NIVEAUX, PARAMETRES.get('niveau'))) REGLAGES.NIVEAU = PARAMETRES.get('niveau');
// ?pneus=1 : les pneus du joueur (pneus.js), désactivés par défaut (PNEUS_ACTIFS) tant que le propriétaire n'a pas jugé la sensation
if (PARAMETRES.get('pneus') === '1') REGLAGES.PNEUS_ACTIFS = true;

// l'état du jeu, lisible par les tests
const JEU = {
  joueur: null,         // la voiture (physique.js)
  modele: null,         // son modèle 3D
  alpha: 0,             // l'alpha de la dernière image
  cibles: { gaz: 0, frein: 0, direction: 0 },   // ce que demandent les touches
  remettre: false,      // Espace : traité au prochain pas de physique
  course: null,         // la course en cours (course.js), ou null
  ecran: 'choix',       // choix, course, pause, fin, survol (les caméras ?camera=… sans course)
  robot: false,         // ?robot=1 : le robot d'essai conduit la voiture du joueur (tests, démonstration)
  ia: 0,                // ?ia=1 : l'IA conduit la voiture du joueur ; ?ia=N (N ≥ 2) : une course de N IA (simulation.js)
  plateau: null,        // avec ?ia=N : la course entre IA (creerCourseIA) ; JEU.joueur et JEU.course sont ceux de la voiture suivie
  contre: false,        // ?ia=N&joueur=1 : le joueur conduit sa voiture au clavier, au milieu des N IA
  modeles: [],          // avec ?ia=N : le modèle 3D de chaque voiture de la course (celle du joueur en dernier)
  couleurs: [],         // … et sa couleur (0xrrggbb), pour la tour de classement et le radar
  suivie: 0,            // avec ?ia=N : la voiture que suit la caméra (Tab : la suivante)
  trajectoire: null,    // la trajectoire idéale de ce circuit (ia.js), calculée seulement avec ?ia=…, en fond
  carte: null,          // la carte du circuit pour les pilotes IA (carteDepuis), quand la trajectoire est prête
  pilote: null,         // ?ia=1 : le pilote IA qui conduit la voiture du joueur (ia.js)
  calculTrajectoire: null,   // le suivi de ce calcul (calculerEnFond)
  pas: 0,               // le nombre de pas de physique faits (pour vérifier la pause)
  apresArrivee: 0,      // s depuis l'arrivée
  arretApres: null,     // s entre l'arrivée et l'arrêt de la voiture
  signal: null,         // le dernier signal de course joué (3, 2, 1, go)
  final: null,          // le classement final d'une course à plusieurs (classementFinal), une fois le podium connu
  tempsPodium: 0,       // s depuis le début du podium (la caméra qui tourne)
  championnat: null,    // ?championnat=1 : le championnat en cours (championnat.js)
  grandPrixFini: false, // … et le Grand Prix de cette page est joué et enregistré : « Course suivante » recharge la page (le circuit change)
  gagne: null,          // … les points du joueur au Grand Prix qui vient de finir, montrés sur l'écran du championnat après la une du journal
  qualif: null,         // contre les IA, avant la course : la qualification du joueur { etat (choix, tour, attente, resultat), q (qualification.js), v (sa voiture du tour), passe }
  attente: null,        // contre les IA, après l'arrivée du joueur : { tele (la voiture suivie par la caméra télé), camera (celle d'avant), passer }
  sdkPret: false,       // SDK.init fini (sdk.js) : à partir de là, gameplayStart / gameplayStop suivent l'écran
  enregistreur: null,   // l'enregistrement de la course en cours (enregistreur.js, étape 13), voir creerEnregistreur
  // le fantôme du meilleur tour (fantome.js), pendant le tour de qualification seulement : { rejeu (le record du circuit chargé,
  // ou null s'il n'y en a pas), tour (l'enregistrement du tour en cours), ecart (en direct, s), visible (l'option), roues (rad) }
  fantome: null,
  modeleFantome: null,  // sa voiture 3D transparente (voiture3d.js), créée une fois, visible seulement pendant le tour
  departRecord: false,  // le départ parfait (depart.js) : le lancement du joueur a battu son record de temps de réaction (sauvegardé)
};

// les caméras de survol n'ont pas de course
const SURVOL = ['auto', 'libre', 'dessus', 'virage', 'vitrine'];

// ?ia=N : la caméra, le tableau et le bandeau de course suivent la voiture k
function suivre(k) {
  JEU.suivie = k;
  const p = JEU.plateau.pilotes[k];
  JEU.joueur = p.v;
  JEU.course = p.course;
  JEU.modele = JEU.modeles[k];
}

// Tab : la voiture suivante encore en course
function suivreSuivante() {
  const pilotes = JEU.plateau.pilotes;
  for (let i = 1; i <= pilotes.length; i++) {
    const k = (JEU.suivie + i) % pilotes.length;
    if (pilotes[k].arrivee === null) { suivre(k); return; }
  }
}

function lancerCourse(nbTours) {
  if (JEU.ia >= 2 || JEU.contre) {
    // ?championnat=1 : le niveau de l'écurie sur le rythme de chaque IA, avant que la carte leur donne un pilote
    JEU.plateau = creerCourseIA(CIRCUIT, JEU.ia, nbTours, Number(PARAMETRES.get('graine')) || 1, JEU.championnat ? null : JEU.carte, JEU.contre);
    if (JEU.championnat) { CHAMPIONNAT.appliquerNiveaux(JEU.championnat, JEU.plateau); if (JEU.carte) donnerCarte(JEU.plateau, JEU.carte); }
    suivre(JEU.contre ? JEU.ia : 0);   // contre les IA : la caméra suit le joueur
    appliquerCaracteres();
    if (JEU.contre) armerFeux(JEU.plateau.pilotes, Number(PARAMETRES.get('graine')) || 1);   // les feux de départ
  } else {
    JEU.course = creerCourse(CIRCUIT, nbTours);
    placerAuDepart(JEU.joueur, CIRCUIT);
    if (JEU.carte) JEU.pilote = creerPilote(JEU.carte);
  }
  JEU.apresArrivee = 0;
  JEU.arretApres = null;
  JEU.signal = null;
  JEU.final = null;
  // ?pneus=1 : des pneus neufs à chaque course, seulement sur la voiture que le joueur conduit (jamais sur une IA suivie)
  JEU.joueur.pneus = REGLAGES.PNEUS_ACTIFS && (JEU.contre || !JEU.plateau) ? creerPneus() : null;
  JEU.joueur.adherence = 1;
  GARAGE.appliquer(JEU.joueur, JEU.championnat ? JEU.championnat.garage : null);   // ?championnat=1 : les améliorations du garage sur la voiture du joueur (1 = rien sans championnat)
  JEU.enregistreur = creerEnregistrement();
  JEU.fantome = null;   // le fantôme ne vit que pendant le tour de qualification (commencerFantome)
  JEU.departRecord = false;
  finirAttente();
  PODIUM3D.cacher();
  // contre les IA : d'abord la qualification du joueur (un tour, ou passer) ; la course attend
  if (JEU.contre) { commencerQualif(); return; }
  JEU.ecran = 'course';
  INTERFACE.montrer('course');
}

// la qualification du joueur (qualification.js) : l'écran de choix, le tour seul sur la piste (sa voiture du tour est
// à part : les IA restent sur la grille, et la carte peut finir de se calculer pendant ce temps), puis la grille
function commencerQualif() {
  JEU.qualif = { etat: 'choix', q: null, v: null, passe: false };
  INTERFACE.remplirQualif('choix');
  JEU.ecran = 'qualif';
  INTERFACE.montrer('qualif');
}

function faireMonTour() {
  if (!JEU.qualif || JEU.qualif.etat !== 'choix') return;
  const v = creerVoiture(CIRCUIT, 0);
  GARAGE.appliquer(v, JEU.championnat ? JEU.championnat.garage : null);   // la même voiture qu'en course (garage)
  JEU.qualif.v = v;
  JEU.qualif.q = QUALIFICATION.creer(CIRCUIT, v);
  JEU.qualif.etat = 'tour';
  JEU.joueur = v;                     // la caméra, le tableau et le chrono suivent la voiture du tour
  JEU.course = JEU.qualif.q.course;
  JEU.signal = null;
  commencerFantome();
  INTERFACE.montrer('course');        // le bandeau de course (chrono, secteurs), sans la tour ni le radar
}

// le fantôme du meilleur tour (fantome.js) : le record du circuit est chargé pour être rejoué pendant le tour, et le tour
// qui commence est enregistré (le même enregistreur que la course, pour une voiture)
function commencerFantome() {
  JEU.fantome = { rejeu: FANTOME.charger(SAUVEGARDE.fantome(NOM_CIRCUIT)), tour: FANTOME.commencer(), ecart: null, visible: SAUVEGARDE.option('fantome', true), roues: 0 };
  if (JEU.fantome.rejeu && !JEU.modeleFantome) {
    JEU.modeleFantome = VOITURE3D.creerFantome(REGLAGES.FANTOME_COULEUR, REGLAGES.FANTOME_OPACITE);
    SCENE3D.ajouter(JEU.modeleFantome.groupe);
  }
}

// à chaque pas du tour lancé : la position du joueur est notée (fini : le pas de l'arrivée, avec le temps et la distance du tour)
// et l'écart en direct avec le fantôme est calculé à distance égale
function noterFantome(q, v, fini) {
  const f = JEU.fantome;
  if (!f) return;
  const t = fini ? q.temps : QUALIFICATION.chrono(q), s = fini ? q.fin : QUALIFICATION.distance(q);
  if (t !== null) FANTOME.noter(f.tour, t, v, s);
  if (f.rejeu) f.ecart = fini ? (q.temps === null ? null : FANTOME.ecartFinal(f.rejeu, q.temps)) : FANTOME.ecart(f.rejeu, t, s);
}

// le tour fini : s'il est valide et bat le record du circuit, son fantôme compact le remplace dans la sauvegarde ;
// le résultat pour l'écran : { record, gagne, ecart } (remplirQualif)
function finirFantome(q) {
  const f = JEU.fantome;
  if (!f || q.temps === null) return null;
  const compact = FANTOME.compacter(f.tour, q.temps, q.fin);
  const record = SAUVEGARDE.proposerFantome(NOM_CIRCUIT, compact, !q.valide);
  const ecart = f.rejeu ? FANTOME.ecartFinal(f.rejeu, q.temps) : null;
  return { record, gagne: record && ecart !== null ? -ecart : null, ecart: !record && ecart !== null ? ecart : null, taille: FANTOME.taille(compact) };
}

// le bouton « Fantôme : affiché / masqué » : l'option est sauvegardée, et le fantôme en cours la suit
function basculerFantome() {
  const visible = !SAUVEGARDE.option('fantome', true);
  SAUVEGARDE.ecrireOption('fantome', visible);
  if (JEU.fantome) JEU.fantome.visible = visible;
  INTERFACE.majBoutonsFantome(visible);
}

// à chaque image : la voiture transparente du fantôme à sa position au chrono du tour (interpolée entre deux pas comme la
// voiture du joueur), seulement pendant le tour lancé de la qualification ; jamais en course
function majFantome(dt) {
  const m = JEU.modeleFantome, f = JEU.fantome, q = JEU.qualif && JEU.qualif.q;
  if (!m) return;
  const visible = !!(f && f.rejeu && f.visible && enTourQualif() && q && q.lance && !q.fini);
  m.groupe.visible = visible;
  if (!visible) return;
  const p = FANTOME.position(f.rejeu, QUALIFICATION.chrono(q) - (1 - JEU.alpha) * REGLAGES.PAS_PHYSIQUE);
  f.roues = (f.roues + p.vitesse * dt / REGLAGES.RAYON_ROUE) % (2 * Math.PI);
  VOITURE3D.placer(m, p, { braquage: 0, rotationRoues: f.roues });
}

function passerQualif() {
  if (!JEU.qualif || JEU.qualif.etat !== 'choix') return;
  JEU.qualif.passe = true;
  finirQualif();
}

// un pas de physique du tour de qualification : sa voiture seule, conduite au clavier ou par le robot
function pasTourQualif(pas) {
  const q = JEU.qualif.q, v = JEU.qualif.v, c = q.course;
  const permis = courseAutorise(c);
  if (JEU.remettre) { if (permis) remettreSurPiste(v, CIRCUIT); JEU.remettre = false; }
  if (c.etat === 'finie') appliquerCommandes(v, { gaz: 0, frein: v.u > REGLAGES.ARRET_APRES_ARRIVEE ? 1 : 0, direction: 0 });
  else if (JEU.robot && permis) appliquerCommandes(v, piloteRobot(v, CIRCUIT));
  else lisserCommandes(v, permis ? JEU.cibles : AUCUNE, pas);
  pasVoiture(v, CIRCUIT, pas);
  const finiAvant = q.fini, fini = QUALIFICATION.pas(q, v, pas);
  if (q.lance && !finiAvant) noterFantome(q, v, fini);   // le fantôme : le tour lancé, jusqu'au pas de l'arrivée
  if (fini) { JEU.qualif.fantome = finirFantome(q); finirQualif(); }
}

// le tour est fini (ou passé) : la grille avec tous les temps, dès que les IA ont le leur (la carte), puis le résultat
function finirQualif() {
  const e = JEU.plateau;
  if (!e.carte) { JEU.qualif.etat = 'attente'; INTERFACE.remplirQualif('attente'); INTERFACE.montrer('qualif'); return; }
  const temps = JEU.qualif.passe ? null : JEU.qualif.q.temps;
  const place = QUALIFICATION.grille(e, temps);
  suivre(JEU.suivie);   // JEU.joueur et JEU.course : de nouveau sa voiture de course, sur la grille
  JEU.qualif.etat = 'resultat';
  INTERFACE.remplirQualif('resultat', { place, nb: e.pilotes.length, temps, valide: temps !== null, passe: JEU.qualif.passe, ecart: QUALIFICATION.ecartPole(e), fantome: JEU.qualif.fantome || null });
  JEU.ecran = 'qualif';
  INTERFACE.montrer('qualif');
}

function partirEnCourse() {
  if (!JEU.qualif || JEU.qualif.etat !== 'resultat') return;
  JEU.qualif = null;
  JEU.fantome = null;   // jamais de fantôme en course
  JEU.ecran = 'course';
  INTERFACE.montrer('course');
}

// l'enregistrement de la course qui commence (enregistreur.js, étape 13) : toutes les voitures de la course (le plateau,
// ou le joueur seul), à chaque pas de physique (enregistrerPas) ; rien n'est affiché encore (le résumé viendra).
// Le classement, qui coûte cher, ne lui est donné qu'un pas sur CLASSEMENT_PAS (une image sur dix par seconde)
function creerEnregistrement() {
  const voitures = JEU.plateau ? JEU.plateau.pilotes.map(p => p.v) : [JEU.joueur];
  const joueur = JEU.plateau ? (JEU.contre ? JEU.ia : null) : 0;
  return { enr: creerEnregistreur(voitures.length, { joueur }), voitures, parti: false, arrivees: new Set(), pas: 0, ms: 0 };
}

// après chaque pas de physique de la course : l'instant du GO (depart), l'image, les arrivées ; ms : le temps passé (?debug=1, tests)
function enregistrerPas() {
  const r = JEU.enregistreur, e = JEU.plateau, c = JEU.course;
  if (!r || !c) return;
  const t0 = performance.now(), temps = e ? e.temps : c.temps;
  if (!r.parti && courseAutorise(c)) { r.parti = true; r.enr.depart(temps); }
  r.enr.enregistrer(temps, r.voitures, e && r.pas % REGLAGES_ENREGISTREUR.CLASSEMENT_PAS === 0 ? classementCourse(e) : null);
  if (e) e.pilotes.forEach((p, k) => { if (p.arrivee !== null && !r.arrivees.has(k)) { r.arrivees.add(k); r.enr.arrivee(p.arrivee, k); } });
  r.pas++;
  r.ms += performance.now() - t0;
}

// ?pneus=1 : l'usure des pneus du joueur à chaque pas (pneus.js) et son effet sur l'adhérence de sa voiture
function pasPneusJoueur(v, dt) {
  if (!v.pneus) return;
  pasPneus(v.pneus, v, dt, REGLAGES_PNEUS.GESTION_MOYENNE);
  v.adherence = facteurAdherence(v.pneus.usure);
}

// ?championnat=1 : chaque IA de la course prend le caractère de son pilote du championnat (la voiture k = le pilote k ;
// le joueur, dernier, n'en a pas), au niveau de difficulté en cours (?niveau=, simulation.js : appliquerNiveau, comme
// pour un caractère tiré par donnerCarte). Les variations par tour (tours) restent celles tirées pour la course, déjà au
// niveau ; ses erreurs sont re-tirées avec son taux (même graine que donnerCarte : le même hasard pour la même course)
function appliquerCaracteres() {
  const e = JEU.plateau;
  if (!JEU.championnat || !e || !e.carte) return;
  ALEATOIRE.semer(e.graine + REGLAGES.GRAINE_CARACTERE);
  e.pilotes.forEach((p, k) => {
    const c = JEU.championnat.pilotes[k] && JEU.championnat.pilotes[k].caractere;
    if (!c || !p.pilote || !p.pilote.caractere) return;
    const { regularite, agressivite, erreurs } = appliquerNiveau({ regularite: c.regularite, agressivite: c.agressivite, erreurs: c.erreurs, tours: [] });
    Object.assign(p.pilote.caractere, { regularite, agressivite, erreurs });
    p.pilote.erreurs = tirerErreurs(e.carte, p.pilote.caractere, e.nbTours + 1);
  });
  ALEATOIRE.semer();
}

// ?championnat=1 : l'écran entre les courses ; gagne : les points du Grand Prix qui vient de finir (null au démarrage)
function montrerChampionnat(gagne) {
  PODIUM3D.cacher();
  INTERFACE.remplirChampionnat(JEU.championnat, gagne, texte('circuit_' + NOM_CIRCUIT) || CIRCUIT.nom);   // les circuits d'essai ont leur texte ; les autres gardent leur nom
  INTERFACE.remplirDuel(CHAMPIONNAT.scoreDuel(JEU.championnat), JEU.championnat);
  INTERFACE.remplirSolde(JEU.championnat);
  JEU.ecran = 'championnat';
  INTERFACE.montrer('championnat');
}

// « Course suivante » : la course de ce Grand Prix ; s'il est déjà joué, la page se recharge sur le suivant
function courseSuivante() {
  if (JEU.ecran !== 'championnat') return;
  if (JEU.grandPrixFini) { location.reload(); return; }
  lancerCourse(Number(PARAMETRES.get('tours')) || REGLAGES.CHAMPIONNAT_TOURS);
}

// après les résultats : les points, la une du journal et la sauvegarde (finirGrandPrix), puis la une à l'écran
function apresGrandPrix() {
  if (JEU.ecran !== 'resultats' || JEU.grandPrixFini) return;
  const lignes = CHAMPIONNAT.lignesDepuisCourse(JEU.plateau);
  const moi = lignes.find(l => l.k === JEU.ia);
  CHAMPIONNAT.finirGrandPrix(JEU.championnat, lignes);
  JEU.grandPrixFini = true;
  JEU.gagne = CHAMPIONNAT.pointsPour(moi.place);
  montrerUne(JEU.championnat.album[JEU.championnat.album.length - 1]);
}

// ?championnat=1 : la une du journal (journal.js) du Grand Prix qui vient de finir, entre les résultats et l'écran du
// championnat ; un clic (interface.js) ou une touche (brancherClavier) la passe
function montrerUne(une) {
  PODIUM3D.cacher();
  INTERFACE.remplirUne(JOURNAL.rendre(une, JEU.championnat, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie }));
  JEU.ecran = 'une';
  INTERFACE.montrer('une');
}

function passerUne() {
  if (JEU.ecran !== 'une') return;
  montrerChampionnat(JEU.gagne);
}

// ?championnat=1 : le garage (garage.js, argent.js), depuis l'écran du championnat ; un achat est sauvegardé tout de suite
function montrerGarage() {
  if (JEU.ecran !== 'championnat') return;
  INTERFACE.remplirGarage(JEU.championnat);
  JEU.ecran = 'garage';
  INTERFACE.montrer('garage');
}

function acheterAmelioration(nom) {
  if (JEU.ecran !== 'garage') return null;
  const r = GARAGE.acheter(JEU.championnat, nom);
  if (r.ok) SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  INTERFACE.remplirGarage(JEU.championnat);
  return r;
}

function quitterGarage() {
  if (JEU.ecran !== 'garage') return;
  montrerChampionnat(JEU.gagne);
}

function pause(oui) {
  if (oui && JEU.ecran === 'course') { JEU.ecran = 'pause'; INTERFACE.montrer('pause'); }
  else if (!oui && JEU.ecran === 'pause') { JEU.ecran = 'course'; INTERFACE.montrer('course'); }
}

function allerAuChoix() {
  JEU.course = null;
  PODIUM3D.cacher();
  JEU.ecran = 'choix';
  placerAuDepart(JEU.joueur, CIRCUIT);
  INTERFACE.preparerChoix(lancerCourse, NOM_CIRCUIT);
  INTERFACE.montrer('choix');
}

// les bips du compte à rebours (3, 2, 1) et le GO, joués une fois chacun
function signauxCourse(c) {
  if (!c || JEU.ecran !== 'course') return;
  // avec les feux : un bip à chaque feu qui s'allume, le GO à l'extinction
  const s = c.etat === 'compte' ? (c.feux ? 'feu' + feuxAllumes(c) : String(Math.ceil(c.compte))) : (c.etat === 'attente' || c.etat === 'course' ? 'go' : null);
  if (s && s !== JEU.signal) {
    JEU.signal = s;
    if (s !== 'feu0') SON.signal(s === 'go' ? 'go' : 'compte');
  }
}

// une course à plusieurs : les trois premiers du classement final (pénalités comprises) sont connus. Les trois
// voitures montent sur le podium 3D ; les résultats sont prêts derrière (bouton pour passer le podium)
function montrerPodium() {
  const e = JEU.plateau, P = e.pilotes;
  JEU.final = classementFinal(e);
  const trois = JEU.final.slice(0, 3);
  for (const m of JEU.modeles) m.groupe.visible = false;
  PODIUM3D.montrer(trois.map(x => JEU.modeles[x.k]));
  INTERFACE.remplirPodium(trois.map(x => ({ numero: P[x.k].numero, couleur: JEU.couleurs[x.k], total: x.total, penalites: x.penalites })));
  INTERFACE.remplirResultats(JEU.final.map(x => ({
    place: x.place, numero: P[x.k].numero, couleur: JEU.couleurs[x.k], total: x.total, penalites: x.penalites,
    ecart: x.ecart, grille: x.grille, moi: x.k === JEU.suivie,
  })));
  // ?championnat=1 : les gains du joueur (argent.js), calculés sur le classement final de cet instant (encaissés à « Continuer »)
  if (JEU.championnat) {
    const lignes = CHAMPIONNAT.lignesDepuisCourse(e), g = ARGENT.gains(JEU.championnat, lignes), moi = lignes.find(l => l.k === JEU.ia);
    if (g) g.placeNumero = moi.place;
    INTERFACE.remplirArgent(g);
  } else INTERFACE.remplirArgent(null);
  JEU.tempsPodium = 0;
  SON.signal('arrivee');
  JEU.ecran = 'podium';
  INTERFACE.montrer('podium');
}

// contre les IA, le joueur a passé la ligne : sa voiture freine seule, la caméra télé suit les voitures encore en
// course (arrivee.js), et le podium attend la dernière voiture, la limite ARRIVEE_ATTENTE_MAX, ou le bouton « passer »
function attendreLesAutres() {
  const e = JEU.plateau, moi = e.pilotes[JEU.suivie];
  if (moi.arrivee === null) return;   // sa course est finie, la simulation note son arrivée au pas suivant
  if (!JEU.attente) {
    JEU.attente = { tele: null, camera: CAMERA.mode, passer: false };
    CAMERA.forcer('tele');
  }
  JEU.attente.tele = ARRIVEE.voitureTele(e, JEU.attente.tele);
  if (JEU.attente.passer || ARRIVEE.podiumPret(e, e.temps - moi.arrivee)) {
    finirAttente();
    montrerPodium();
  }
}

// la fin de l'attente (podium, nouvelle course) : la caméra d'avant revient, le bandeau part
function finirAttente() {
  if (JEU.attente) CAMERA.forcer(JEU.attente.camera);
  JEU.attente = null;
  document.getElementById('attenteArrivee').classList.add('cache');
}

function passerAuPodium() {
  if (JEU.attente && JEU.ecran === 'course') JEU.attente.passer = true;
}

function voirResultats() {
  if (JEU.ecran !== 'podium') return;
  JEU.ecran = 'resultats';
  INTERFACE.montrer('resultats');
}

// la course est finie : le record, puis l'écran de fin
function finDeCourse() {
  const c = JEU.course;
  // une course entre IA ne bat pas les records du joueur
  const nouveau = JEU.plateau ? false : SAUVEGARDE.proposerRecord(c.nbTours, c.meilleurTour, NOM_CIRCUIT);
  INTERFACE.remplirFin(c, nouveau);
  SON.signal('arrivee');
  JEU.ecran = 'fin';
  INTERFACE.montrer('fin');
}

// les touches de conduite, par leur place (e.code) : ZQSD en AZERTY = WASD en QWERTY
const TOUCHES = {
  gaz: ['ArrowUp', 'KeyW'], frein: ['ArrowDown', 'KeyS'], gauche: ['ArrowLeft', 'KeyA'], droite: ['ArrowRight', 'KeyD'],
};
const enfoncees = new Set();

function majCibles() {
  const appui = liste => liste.some(c => enfoncees.has(c));
  JEU.cibles.gaz = appui(TOUCHES.gaz) ? 1 : 0;
  JEU.cibles.frein = appui(TOUCHES.frein) ? 1 : 0;
  JEU.cibles.direction = (appui(TOUCHES.droite) ? 1 : 0) - (appui(TOUCHES.gauche) ? 1 : 0);
}

function brancherClavier() {
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyC' && !e.repeat) CAMERA.suivante();
    if (e.code === 'Space' && !e.repeat) JEU.remettre = true;
    if (e.code === 'Escape' && !e.repeat) pause(JEU.ecran === 'course');
    if (e.code === 'Enter' && !e.repeat) passerAuPodium();
    if (JEU.ecran === 'une' && !e.repeat) passerUne();   // n'importe quelle touche passe la une du journal
    if (e.code === 'Tab') { e.preventDefault(); if (JEU.plateau && !JEU.contre && !e.repeat) suivreSuivante(); }
    enfoncees.add(e.code);
    majCibles();
  });
  window.addEventListener('keyup', e => { enfoncees.delete(e.code); majCibles(); });
  window.addEventListener('blur', () => { enfoncees.clear(); majCibles(); });
  // une touche lâchée pendant que l'onglet est caché n'envoie jamais son keyup : on remet tout à zéro
  document.addEventListener('visibilitychange', () => { enfoncees.clear(); majCibles(); });
}

const AUCUNE = { gaz: 0, frein: 0, direction: 0 }, FREIN_SEUL = { gaz: 0, frein: 1, direction: 0 };

// ?ia=N&joueur=1 : les commandes du joueur pour sa voiture dans la course entre IA (comme seul : rampes, Espace)
function conduireJoueur(p, pas) {
  if (JEU.remettre && courseAutorise(p.course)) remettreSurPiste(p.v, CIRCUIT);
  JEU.remettre = false;
  // après l'arrivée, sa voiture freine seule jusqu'à l'arrêt (les autres finissent leur course)
  // ?robot=1 : le robot d'essai conduit sa voiture (tests) ; il fait toujours un départ parfait, DEPART_ROBOT_REACTION après l'extinction
  let cibles = JEU.robot ? (courseAutorise(p.course) ? piloteRobot(p.v, CIRCUIT) : AUCUNE) : JEU.cibles;
  // le départ parfait (depart.js) : tant que la voiture n'est pas lancée, elle est tenue sur place ; la touche d'accélérateur
  // règle le régime de départ, et la pression qui suit l'extinction est le lancement (ou un faux départ : anticipation)
  const d = p.course.depart;
  if (d && d.lance === null) {
    if (JEU.robot) { if (d.extinction !== null && d.t - d.extinction >= REGLAGES.DEPART_ROBOT_REACTION) DEPART.lancer(d, 'parfait', REGLAGES.DEPART_ROBOT_REACTION); }
    else DEPART.commande(d, JEU.cibles.gaz > 0, p.course.compte);
    if (d.lance === null) cibles = AUCUNE;
    else if (!JEU.robot && d.resultat !== 'faux') JEU.departRecord = SAUVEGARDE.proposerReaction(d.reaction);   // le record du temps de réaction (pas celui du robot)
  }
  lisserCommandes(p.v, commandesPermises(p.course) ? cibles : p.course.etat === 'finie' ? FREIN_SEUL : AUCUNE, pas);
  pasPneusJoueur(p.v, pas);
}

function pasJoueur(pas) {
  if (JEU.ecran === 'pause') return;   // la pause arrête la physique
  JEU.pas++;
  // ?ia=N : toutes les IA, leurs contacts, leurs courses (la voiture suivie comprise) ; avec &joueur=1, la voiture du
  // joueur est dans la même course et il la conduit au clavier
  if (JEU.plateau) {
    // la qualification : seule la voiture du tour roule
    if (JEU.ecran === 'qualif' && JEU.qualif && JEU.qualif.etat === 'tour') { pasTourQualif(pas); return; }
    // tant que la carte se calcule, la course attend (le compte à rebours ne part pas) : sur un ordinateur lent,
    // les IA resteraient sinon plantées sur la grille après le GO
    if (JEU.ecran === 'course' && JEU.plateau.carte) { pasCourseIA(JEU.plateau, pas, conduireJoueur); enregistrerPas(); }
    JEU.remettre = false;
    return;
  }
  const v = JEU.joueur, c = JEU.course;
  // on conduit en survol, en essai, et en course une fois le GO donné (pas pendant le compte à rebours ni après l'arrivée)
  const permis = JEU.ecran === 'survol' ? CAMERA.conduite : (JEU.ecran === 'course' && c && courseAutorise(c));
  if (JEU.remettre) { if (permis) remettreSurPiste(v, CIRCUIT); JEU.remettre = false; }
  if (c && c.etat === 'finie') {
    // après l'arrivée : les commandes sont coupées et la voiture freine seule jusqu'à l'arrêt
    appliquerCommandes(v, { gaz: 0, frein: v.u > REGLAGES.ARRET_APRES_ARRIVEE ? 1 : 0, direction: 0 });
    JEU.apresArrivee += pas;
    if (v.u === 0 && JEU.arretApres === null) JEU.arretApres = JEU.apresArrivee;
  } else if (JEU.ia && permis) appliquerCommandes(v, JEU.pilote ? piloterIA(JEU.pilote, v, [], pas) : AUCUNE);   // tant que la carte se calcule, il attend
  else if (JEU.robot && permis) appliquerCommandes(v, piloteRobot(v, CIRCUIT));
  else lisserCommandes(v, permis ? JEU.cibles : AUCUNE, pas);
  pasVoiture(v, CIRCUIT, pas);
  pasPneusJoueur(v, pas);
  if (c && JEU.ecran === 'course' && !(JEU.ia && !JEU.carte)) { majCourse(c, v, pas); enregistrerPas(); }   // ?ia=1 : pareil, la course attend la carte
}

// le joueur fait son tour de qualification (le chrono s'affiche, « hors piste » aussi)
function enTourQualif() {
  return JEU.ecran === 'qualif' && !!JEU.qualif && JEU.qualif.etat === 'tour';
}

// la tour de classement (course à plusieurs) et le radar, pendant la course et la pause ; la voiture suivie est « moi »
function majClassementRadar() {
  const enCourse = JEU.course && (JEU.ecran === 'course' || JEU.ecran === 'pause');
  const radar = document.getElementById('radar');
  radar.classList.toggle('cache', !enCourse);
  if (!enCourse) { INTERFACE.majClassement(null); return; }
  const P = JEU.plateau ? JEU.plateau.pilotes : [];
  const ordre = JEU.plateau ? classementCourse(JEU.plateau) : null;
  // ?championnat=1 : le coéquipier du joueur (la voiture k = le pilote k du championnat), et l'écart entre eux
  const kc = JEU.championnat && JEU.contre ? (CHAMPIONNAT.coequipierDe(JEU.championnat) || { id: null }).id : null;
  const duel = kc !== null && ordre ? ecartCoequipier(ordre, kc) : null;
  INTERFACE.majClassement(ordre ? ordre.map(x => ({
    numero: P[x.k].numero, couleur: JEU.couleurs[x.k], ecart: x.ecart, tours: x.tours, penalites: x.penalites, moi: x.k === JEU.suivie,
    arrive: P[x.k].arrivee !== null, coequipier: x.k === kc, ecartDuel: x.k === kc ? duel : null,
  })) : null);
  const autres = [];
  P.forEach((p, k) => { if (k !== JEU.suivie && p.arrivee === null) autres.push({ x: p.v.x, z: p.v.z, couleur: JEU.couleurs[k] }); });
  RADAR.dessiner(CIRCUIT, JEU.joueur, autres);
}

// ?championnat=1 : l'écart en temps entre le joueur et son coéquipier kc dans le classement en direct (classementCourse) :
// la somme des écarts entre eux ; > 0 : le coéquipier est derrière. null s'il n'est pas connu (pas encore passé la ligne,
// ou un tour d'écart)
function ecartCoequipier(ordre, kc) {
  const ij = ordre.findIndex(x => x.k === JEU.suivie), ic = ordre.findIndex(x => x.k === kc);
  if (ij < 0 || ic < 0) return null;
  let s = 0;
  for (let i = Math.min(ij, ic) + 1; i <= Math.max(ij, ic); i++) {
    if (ordre[i].ecart === null || ordre[i].tours > 0) return null;
    s += ordre[i].ecart;
  }
  return ij < ic ? s : -s;
}

// l'affichage provisoire : la vitesse et « hors piste »
function majTableau() {
  const v = JEU.joueur;
  document.getElementById('vitesse').textContent = Math.round(Math.abs(v.u) * 3.6);
  document.getElementById('rapport').textContent = rapportPourVitesse(v.u);
  const roule = JEU.ecran === 'course' || JEU.ecran === 'survol' || enTourQualif();
  // sur le podium et les résultats, ni vitesse ni aide des touches
  const apres = JEU.ecran === 'podium' || JEU.ecran === 'resultats' || JEU.ecran === 'championnat' || JEU.ecran === 'une' || JEU.ecran === 'garage';
  document.getElementById('tableau').classList.toggle('cache', apres);
  document.getElementById('aide').classList.toggle('cache', apres);
  // après l'arrivée du joueur (en attendant les autres), il ne court plus : pas de « hors piste »
  document.getElementById('horsPiste').classList.toggle('cache', !(v.surHerbe && roule) || !!JEU.attente);
}

// les mesures pour régler la conduite : la dérive (l'angle entre l'avant et la trajectoire), les g latéraux,
// et les triangles et appels de dessin d'une voiture
function mesuresConduite() {
  const v = JEU.joueur;
  const derive = Math.abs(v.u) > 1 ? Math.atan2(v.v, Math.abs(v.u)) * 180 / Math.PI : 0;
  const gLateraux = v.u * v.r / REGLAGES.GRAVITE;   // l'accélération vers le centre du virage, en g
  return 'dérive ' + derive.toFixed(1) + '° · ' + Math.abs(gLateraux).toFixed(2) + ' g · voiture ' + VOITURE3D.triangles(JEU.modele) + ' triangles, ' + VOITURE3D.appels(JEU.modele) + ' appels'
    + (v.pneus ? ' · pneus ' + Math.round(v.pneus.usure * 100) + ' %' : '');   // ?pneus=1 : l'usure
}

// ?debug=1 : les images par seconde et les triangles dessinés, dans un coin
function brancherDebug() {
  const boite = document.getElementById('ips');
  boite.classList.remove('cache');
  let images = 0, temps = 0;
  BOUCLE.surAffichage((alpha, dt) => {
    images++;
    temps += dt;
    if (temps >= REGLAGES.DEBUG_PERIODE_IPS) {
      boite.textContent = Math.round(images / temps) + ' i/s · ' + SCENE3D.trianglesDessines + ' triangles · ' + SCENE3D.appelsDessin + ' appels\n' + mesuresConduite();
      images = 0;
      temps = 0;
    }
  });
}

// un calcul long (un générateur, voir etapesTrajectoire) découpé en tranches d'environ CALCUL_TRANCHE_MS,
// entre lesquelles la page dessine et répond : elle n'est jamais bloquée. fini(résultat) à la fin.
// Renvoie son suivi : { tranches, plusLongue (ms), debut, fin } (pour les tests et ?debug=1).
function calculerEnFond(etapes, fini) {
  const suivi = { tranches: 0, plusLongue: 0, debut: performance.now(), fin: null };
  const tranche = () => {
    const debut = performance.now();
    let r;
    do r = etapes.next(); while (!r.done && performance.now() - debut < REGLAGES.CALCUL_TRANCHE_MS);
    suivi.tranches++;
    suivi.plusLongue = Math.max(suivi.plusLongue, performance.now() - debut);
    if (r.done) { suivi.fin = performance.now(); fini(r.value); }
    else setTimeout(tranche, 0);
  };
  setTimeout(tranche, 0);
  return suivi;
}

function demarrerJeu() {
  // un jeu, pas une page : ni menu contextuel, ni défilement par les touches ou la molette
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
  });
  // la langue de la page et son titre viennent de textes.js (le <title> de index.html est le même texte, pour le chargement)
  document.documentElement.lang = LANGUE;
  document.title = texte('nomDuJeu');
  document.getElementById('unite').textContent = texte('kmh');
  document.getElementById('horsPiste').textContent = texte('horsPiste');
  document.getElementById('aide').textContent = texte('aideConduite');
  RADAR.init(document.getElementById('radar'));

  if (!SCENE3D.init(document.getElementById('scene3d'), CIRCUIT)) return;
  CAMERA.init(SCENE3D.camera, CIRCUIT, PARAMETRES.get('camera'));
  JEU.joueur = creerVoiture(CIRCUIT, 0);
  JEU.robot = PARAMETRES.get('robot') === '1';
  // ?championnat=1 : le joueur contre les 19 pilotes du championnat, comme ?ia=19&joueur=1
  JEU.championnat = CHAMPIONNAT_EN_COURS;
  JEU.contre = (PARAMETRES.get('joueur') === '1' && Number(PARAMETRES.get('ia')) >= 1) || !!JEU.championnat;
  JEU.ia = JEU.championnat ? JEU.championnat.pilotes.length - 1 : Math.max(0, Math.min(REGLAGES.IA_PAGE_MAX - (JEU.contre ? 1 : 0), Math.floor(Number(PARAMETRES.get('ia'))) || 0));
  if (JEU.ia) JEU.calculTrajectoire = calculerEnFond(etapesTrajectoire(CIRCUIT), t => {
    JEU.trajectoire = t;
    JEU.carte = carteDepuis(CIRCUIT, t);
    if (JEU.plateau) {
      donnerCarte(JEU.plateau, JEU.carte); appliquerCaracteres();
      if (JEU.qualif && JEU.qualif.etat === 'attente') finirQualif();   // le joueur a fini son tour avant la carte
    } else JEU.pilote = creerPilote(JEU.carte);
  });
  // ?ia=N : un modèle par IA, chacune sa couleur (contre le joueur, aucune n'a la sienne), puis celui du joueur ;
  // sinon, seulement la voiture du joueur
  const couleurs = REGLAGES.COULEURS_IA;
  if (JEU.ia >= 2 || JEU.contre) {
    const choix = JEU.contre ? couleurs.filter(x => x !== REGLAGES.COULEUR_JOUEUR) : couleurs;
    // ?championnat=1 : chaque voiture a la couleur de son écurie (le joueur en dernier, comme dans la course)
    if (JEU.championnat) for (const p of JEU.championnat.pilotes) JEU.couleurs.push(JEU.championnat.ecuries[p.ecurie].couleur);
    else {
      for (let k = 0; k < JEU.ia; k++) JEU.couleurs.push(choix[k % choix.length]);
      if (JEU.contre) JEU.couleurs.push(REGLAGES.COULEUR_JOUEUR);
    }
    JEU.couleurs.forEach((couleur, k) => JEU.modeles.push(VOITURE3D.creer(couleur, JEU.contre && k === JEU.ia)));   // le joueur : détaillée
    for (const m of JEU.modeles) SCENE3D.ajouter(m.groupe);
  }
  if (!JEU.modeles.length) {
    JEU.modele = VOITURE3D.creer(REGLAGES.COULEUR_JOUEUR, true);
    SCENE3D.ajouter(JEU.modele.groupe);
  } else JEU.modele = JEU.modeles[JEU.contre ? JEU.ia : 0];   // avant la course (écran de choix), sur la ligne
  INTERFACE.preparerPause(() => pause(false), () => lancerCourse(JEU.course.nbTours));
  INTERFACE.preparerFin(() => lancerCourse(JEU.course.nbTours), allerAuChoix);
  if (JEU.championnat) {
    // après les résultats d'un Grand Prix, un seul bouton : « Continuer »
    INTERFACE.preparerResultats(voirResultats, apresGrandPrix, apresGrandPrix);
    document.getElementById('boutonRejouerResultats').classList.add('cache');
    document.getElementById('boutonChangerResultats').textContent = texte('continuer');
    INTERFACE.preparerChampionnat(courseSuivante, montrerGarage);
    INTERFACE.preparerUne(passerUne);
    INTERFACE.preparerGarage(acheterAmelioration, quitterGarage);
  } else INTERFACE.preparerResultats(voirResultats, () => lancerCourse(JEU.course.nbTours), allerAuChoix);
  document.getElementById('attenteTexte').textContent = texte('attenteArrivee');
  const boutonPasser = document.getElementById('boutonPasser');
  boutonPasser.textContent = texte('passerPodium');
  boutonPasser.addEventListener('mousedown', e => e.preventDefault());
  boutonPasser.addEventListener('click', passerAuPodium);
  INTERFACE.preparerQualif(faireMonTour, passerQualif, partirEnCourse);
  INTERFACE.preparerFantome(basculerFantome);
  INTERFACE.majBoutonsFantome(SAUVEGARDE.option('fantome', true));
  PODIUM3D.init(CIRCUIT);
  // ?course=5, 12, 18 ou 0 (essai libre) lance directement une course (tests, développement)
  const demandee = PARAMETRES.get('course');
  if (SURVOL.includes(PARAMETRES.get('camera'))) { JEU.ecran = 'survol'; INTERFACE.montrer('survol'); }
  else if (JEU.championnat) montrerChampionnat(null);
  else if (demandee !== null && !isNaN(Number(demandee))) lancerCourse(Number(demandee));
  else allerAuChoix();
  brancherClavier();
  const boutonSon = document.getElementById('boutonSon');
  boutonSon.title = texte('son');
  const majBoutonSon = () => { boutonSon.textContent = SON.muet ? '🔇' : '🔊'; };
  // pas de focus sur le bouton : Espace ne doit pas le cliquer
  boutonSon.addEventListener('mousedown', e => e.preventDefault());
  boutonSon.addEventListener('click', () => { SON.basculer(); majBoutonSon(); });
  window.addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) { SON.basculer(); majBoutonSon(); } });
  if (PARAMETRES.get('reglages') === '1') PANNEAU_REGLAGES.creer(cle => { if (cle === 'HALO_EPAISSEUR') VOITURE3D.majHalo(JEU.modele); });

  BOUCLE.surPhysique(pasJoueur);
  BOUCLE.surAffichage((alpha, dt) => {
    JEU.alpha = alpha;
    const apres = JEU.ecran === 'podium' || JEU.ecran === 'resultats';   // le podium : les voitures n'y bougent plus
    // ?ia=N : chaque IA à sa place ; une IA arrivée quitte la piste (elle n'est plus dessinée)
    if (JEU.plateau && !apres) JEU.plateau.pilotes.forEach((p, k) => {
      const m = JEU.modeles[k];
      m.groupe.visible = p.arrivee === null || k === JEU.suivie;
      if (m !== JEU.modele) { VOITURE3D.placer(m, etatAffiche(p.v, alpha), p.v); m.tete.visible = true; }
    });
    const etat = etatAffiche(JEU.joueur, alpha);
    if (apres) {
      JEU.tempsPodium += dt;
      PODIUM3D.camera(SCENE3D.camera, JEU.tempsPodium);
    } else {
      VOITURE3D.placer(JEU.modele, etat, JEU.joueur);
      JEU.modele.tete.visible = CAMERA.mode !== 'cockpit';   // en vue cockpit, l'œil est dans le casque
      // après l'arrivée du joueur, la caméra télé suit une voiture encore en course
      const tele = JEU.attente && JEU.attente.tele !== null ? JEU.plateau.pilotes[JEU.attente.tele].v : null;
      CAMERA.maj(dt, tele ? etatAffiche(tele, alpha) : etat, tele || JEU.joueur);
    }
    majTableau();
    INTERFACE.majCourse(JEU.course, enTourQualif() ? 'course' : JEU.ecran);   // le chrono du tour de qualification
    majFantome(dt);
    INTERFACE.majDepart(JEU.course, JEU.ecran, JEU.departRecord);
    INTERFACE.majEcartFantome(enTourQualif() && JEU.fantome && JEU.fantome.rejeu && JEU.qualif.q.lance ? JEU.fantome.ecart : null);
    INTERFACE.majPreparation(JEU.ecran === 'course' && JEU.ia > 0 && !JEU.carte);
    majClassementRadar();
    signauxCourse(JEU.course);
    // Poki (sdk.js) : la voiture roule (course, tour de qualification) = gameplayStart, tout le reste = gameplayStop ;
    // sdk.js n'envoie jamais deux fois le même de suite
    if (JEU.sdkPret) SDK[JEU.ecran === 'course' || enTourQualif() ? 'jeuCommence' : 'jeuArrete']();
    // la voiture suivie a fini : seule, l'écran de fin ; contre les IA, on attend les autres (vue télé) ; entre IA, le
    // podium dès que les trois premiers sont connus
    if (JEU.ecran === 'course' && JEU.course && JEU.course.etat === 'finie') {
      if (!JEU.plateau) finDeCourse();
      else if (JEU.contre) attendreLesAutres();
      else if (podiumConnu(JEU.plateau)) montrerPodium();
    }
    document.getElementById('attenteArrivee').classList.toggle('cache', !(JEU.attente && JEU.ecran === 'course'));
    SON.maj(JEU.joueur);
    SCENE3D.dessiner();
  });
  if (PARAMETRES.get('debug') === '1') brancherDebug();
  // Poki (sdk.js, le seul passage vers le SDK) : init, puis « chargement fini » une seule fois ; hors Poki, le rappel vient tout de suite
  SDK.init(() => { JEU.sdkPret = true; SDK.chargementFini(); });
  BOUCLE.demarrer();
}

// la page de test charge ce fichier sans scène : elle ne démarre pas le jeu
if (document.getElementById('scene3d')) demarrerJeu();
