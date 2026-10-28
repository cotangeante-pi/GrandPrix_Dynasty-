// Le démarrage : il branche la physique et l'affichage sur la boucle.
// La voiture du joueur roule sur le circuit de test, ou sur celui de ?circuit=… (un nom de CIRCUITS, donnees.js).
const PARAMETRES = new URLSearchParams(location.search);
// la page nue (index.html sans paramètre de développement) est le vrai jeu (CLAUDE.md « En piste en 10 secondes ») : au
// premier lancement, l'écran titre puis la course de découverte ; ensuite (découverte faite), le championnat = le paddock.
// Les paramètres ?course=, ?ia=, ?camera=, ?seul=1 (l'écran de choix d'une course seule), ?joueur=1 et ?championnat=1 restent
// les chemins des tests et du développement. (La page de test charge ce fichier sans scène : rien n'est décidé ni sauvegardé)
const EST_PAGE = !!document.getElementById('scene3d');
const PAGE_NUE = !['course', 'ia', 'camera', 'seul', 'joueur', 'championnat', 'deux', 'tournoi'].some(k => PARAMETRES.has(k));
const DECOUVERTE_EN_COURS = EST_PAGE && PAGE_NUE && !SAUVEGARDE.decouverteFaite();
if (DECOUVERTE_EN_COURS) REGLAGES.NIVEAU = REGLAGES.DECOUVERTE_NIVEAU;   // les IA de la découverte sont au niveau débutant
// ?championnat=1 (ou la page nue après la découverte) : le championnat sauvegardé, ou un nouveau ; son prochain Grand Prix choisit le circuit de la page
const CHAMPIONNAT_EN_COURS = PARAMETRES.get('championnat') === '1' || (EST_PAGE && PAGE_NUE && !DECOUVERTE_EN_COURS) ? (SAUVEGARDE.championnat() || CHAMPIONNAT.creer(Number(PARAMETRES.get('graine')) || 1)) : null;
// ?gp=N (tests) : un championnat NEUF arrive au N-ième Grand Prix, les N − 1 premiers joués d'avance sans physique (SAISONS.avancer)
if (CHAMPIONNAT_EN_COURS && !SAUVEGARDE.championnat() && Number(PARAMETRES.get('gp')) > 1) SAISONS.avancer(CHAMPIONNAT_EN_COURS, Number(PARAMETRES.get('gp')) - 1);
// ?deux=1 : le mode 2 joueurs lit ses réglages sauvegardés (l'écran avant la course, deux-joueurs.js, tour 25b) ; les paramètres de
// l'adresse (&circuit, &ia, &tours, &niveau : tests et développement) passent devant
const DEUX_SAUVE = EST_PAGE && PARAMETRES.get('deux') === '1' ? DEUX_JOUEURS.completer(SAUVEGARDE.deux()) : null;
if (DEUX_SAUVE) for (const [k, v] of [['circuit', DEUX_SAUVE.circuit], ['ia', DEUX_SAUVE.ia], ['tours', DEUX_SAUVE.tours], ['niveau', DEUX_SAUVE.niveau]]) if (!PARAMETRES.has(k)) PARAMETRES.set(k, String(v));
// ?tournoi=1 : le tournoi chrono en cours (tournoi.js, sauvegardé à part de la carrière) ; le circuit est celui de sa manche en cours
const TOURNOI_SAUVE = EST_PAGE && PARAMETRES.get('tournoi') === '1' ? (s => s && s.enCours && Array.isArray(s.enCours.passages) && s.enCours.joueurs && s.enCours.joueurs.length ? s.enCours : null)(SAUVEGARDE.tournoi()) : null;
if (TOURNOI_SAUVE && !PARAMETRES.has('circuit')) PARAMETRES.set('circuit', TOURNOI_SAUVE.circuits[TOURNOI_SAUVE.manche]);
const NOM_CIRCUIT = DECOUVERTE_EN_COURS ? REGLAGES.DECOUVERTE_CIRCUIT
  : CHAMPIONNAT_EN_COURS && CHAMPIONNAT_EN_COURS.prochain < CHAMPIONNAT_EN_COURS.calendrier.length ? CHAMPIONNAT_EN_COURS.calendrier[CHAMPIONNAT_EN_COURS.prochain].circuit
  : Object.prototype.hasOwnProperty.call(CIRCUITS, PARAMETRES.get('circuit')) ? PARAMETRES.get('circuit') : 'test';
const CIRCUIT = NOM_CIRCUIT === 'test' ? CIRCUIT_TEST : construireCircuit(CIRCUITS[NOM_CIRCUIT]);
// ?niveau=debutant|normal|expert|legende : le niveau de difficulté des IA (normal par défaut)
if (Object.prototype.hasOwnProperty.call(REGLAGES.NIVEAUX, PARAMETRES.get('niveau'))) REGLAGES.NIVEAU = PARAMETRES.get('niveau');
// ?deux=1 : le mode 2 joueurs (deux-joueurs.js, CLAUDE.md « Le mode 2 joueurs ») : &ia=0|3|5 IA, &tours=3|5, &niveau=… ; un mode à part de
// la carrière (rien n'est écrit dans la sauvegarde) ; ses réglages gardés et son écran viendront avec l'ordre 3
const DEUX_EN_COURS = EST_PAGE && PARAMETRES.get('deux') === '1';
// ?pneus=1 : les pneus du joueur (pneus.js), désactivés par défaut (PNEUS_ACTIFS) tant que le propriétaire n'a pas jugé la sensation
if (PARAMETRES.get('pneus') === '1') REGLAGES.PNEUS_ACTIFS = true;
if (PARAMETRES.get('pneus') === '0') REGLAGES.PNEUS_ACTIFS = false;   // (tour 32 : les pneus sont là par défaut ; ?pneus=0 les coupe)

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
  // le premier lancement (decouverte.js) : la course de découverte, dans le monde du championnat créé à ce moment (monde : ses
  // pilotes et écuries ; indices : pour chaque voiture IA k de la course, l'id de son pilote dans monde.pilotes) ; aides : les
  // touches déjà utilisées pendant le premier tour ; depuisClic : l'instant du clic sur « Jouer » (la mesure du clic aux feux, ms)
  decouverte: false, monde: null, indices: null, aides: null, depuisClic: null, clicAuxFeux: null, clicAuPremierFeu: null,
  carteDuCache: false,  // la carte des IA est venue du cache de la sauvegarde (cache-carte.js) : pas de calcul en fond
  casqueSeul: false,    // l'écran du pilote ouvert depuis le paddock pour le casque seulement (« Mon casque »)
  // le mode 2 joueurs (deux-joueurs.js) : ses réglages { nbIA, nbTours }, ou null ; les commandes de chaque joueur (1, 2), lues
  // de ses touches à lui (TOUCHES_DEUX) : cibles comme JEU.cibles, remettre comme JEU.remettre
  deux: null, deuxCommandes: { 1: { cibles: { gaz: 0, frein: 0, direction: 0 }, remettre: false }, 2: { cibles: { gaz: 0, frein: 0, direction: 0 }, remettre: false } },
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
  if (JEU.deux) {
    // le mode 2 joueurs : la même course, deux humains (p.joueur = 1, 2) après les IA, la grille tirée au sort (dès la carte)
    const graine = graineDeux();
    JEU.plateau = DEUX_JOUEURS.creer(CIRCUIT, JEU.deux.nbIA, JEU.deux.nbTours, graine, JEU.carte);
    suivre(JEU.ia);   // la caméra suit le joueur 1 (l'écran partagé : ordre 2)
    appliquerCaracteres();
    armerFeux(JEU.plateau.pilotes, graine);
    JEU.deux.rivaliteNotee = false;
  } else if (JEU.ia >= 2 || JEU.contre) {
    // ?championnat=1 : le niveau de l'écurie sur le rythme de chaque IA, avant que la carte leur donne un pilote
    JEU.plateau = creerCourseIA(CIRCUIT, JEU.ia, nbTours, Number(PARAMETRES.get('graine')) || 1, JEU.championnat ? null : JEU.carte, JEU.contre);
    if (JEU.championnat) { CHAMPIONNAT.appliquerNiveaux(JEU.championnat, JEU.plateau); if (JEU.carte) donnerCarte(JEU.plateau, JEU.carte); }
    if (JEU.championnat) poserRivalites(JEU.plateau, JEU.championnat.pilotes.map(q => !!(q && q.rivalite)));   // les rivaux de l'interview (ia.js, Codeur 1)
    if (JEU.championnat) JEU.plateau.ecuries = JEU.championnat.pilotes.map(q => q ? q.ecurie : null);   // les écuries, pour les consignes d'équipe (simulation.js, Codeur 1)
    // la météo (meteo.js, étape 12, Codeur 1) : tirée avec la graine du Grand Prix selon le lieu ; ?meteo=sec|pluie|averse|eclaircie la force (tests)
    // (les pneus du départ choisis au garage, une fois : ensuite l'équipe choisit de nouveau)
    if (JEU.championnat && JEU.championnat.pneusDepart) { const h = JEU.plateau.pilotes.find(q => q.humain); if (h) h.v.typePneus = JEU.championnat.pneusDepart; JEU.championnat.pneusDepart = null; }
    if (REGLAGES.METEO_ACTIVE) poserMeteo(JEU.plateau, planMeteo(nbTours));
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
  if (JEU.deux) { const v2 = DEUX_JOUEURS.joueurs(JEU.plateau)[1].v; v2.pneus = JEU.joueur.pneus ? creerPneus() : null; v2.adherence = 1; }   // le joueur 2 : la même voiture
  AILERON.appliquer(JEU.joueur, JEU.championnat ? AILERON.cranDe(JEU.championnat, NOM_CIRCUIT) : null);   // l'aileron du joueur sur ce circuit (aileron.js ; le milieu = rien)
  GARAGE.appliquer(JEU.joueur, JEU.championnat ? JEU.championnat.garage : null, niveauEcurieJoueur());   // ?championnat=1 : les améliorations du garage × le niveau de l'écurie, sur la voiture du joueur (1 = rien sans championnat)
  JEU.enregistreur = creerEnregistrement();
  JEU.fantome = null;   // le fantôme ne vit que pendant le tour de qualification (commencerFantome)
  JEU.departRecord = false;
  finirAttente();
  PODIUM3D.cacher();
  // la découverte : pas de qualification, le joueur au milieu de la grille (dès que la carte des IA a donné leurs temps)
  if (JEU.decouverte) { JEU.aides = { gaz: false, direction: false, frein: false, clignote: false }; placerDecouverte(); entrerGrille(); return; }
  // le mode 2 joueurs : pas de qualification (la grille est tirée au sort), les feux tout de suite
  if (JEU.deux) { JEU.ecran = 'course'; INTERFACE.montrer('course'); return; }
  // contre les IA : d'abord la qualification du joueur (un tour, ou passer) ; la course attend
  if (JEU.contre && !(typeof TUTORIEL_ECRAN !== 'undefined' && TUTORIEL_ECRAN.lecon())) { commencerQualif(); return; }   // (une leçon du tutoriel : pas de qualification, tutoriel.js)
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
  GARAGE.appliquer(v, JEU.championnat ? JEU.championnat.garage : null, niveauEcurieJoueur());   // la même voiture qu'en course (garage, niveau de l'écurie)
  AILERON.appliquer(v, JEU.championnat ? AILERON.cranDe(JEU.championnat, NOM_CIRCUIT) : null);   // … et le même aileron
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
  if (fini && JEU.tournoi) { finirTourTournoi(q, false); return; }   // le tournoi chrono : son classement, jamais le fantôme de carrière
  if (fini) { JEU.qualif.fantome = finirFantome(q); finirQualif(); }
}

// --- le tournoi chrono entre copains (tournoi.js, tour 26b, CLAUDE.md « Le tournoi chrono entre copains ») : l'inscription (depuis
// « Entre amis »), puis la page ?tournoi=1 (le circuit de la manche en cours) : « À toi, Sarah ! » et 3 s, le tour de qualification
// (le même code : qualification.js), avec le fantôme du leader du moment (fantome.js, en mémoire seulement), le classement de la
// manche, le général ; entre deux manches (🏆) : une pub, puis la page de la manche suivante ; à la fin : le podium 3D des trois
// premiers casques, le classement, « Rejouer » ou « Nouveaux joueurs » (une pub avant). Jamais de pub entre deux joueurs.
function ouvrirTournoi() {
  if (JEU.ecran !== 'amis') return;
  const s = SAUVEGARDE.tournoi(), R = REGLAGES;
  const v = TOURNOI.valider(s && Array.isArray(s.joueurs) && s.joueurs.length >= R.TOURNOI_JOUEURS_MIN ? s.joueurs : [{}, {}, {}], i => '');
  INTERFACE.remplirInscription({ joueurs: v.joueurs.slice(0, R.TOURNOI_JOUEURS_MAX).map((j, i) => ({ prenom: s && s.joueurs ? j.prenom : '', casque: j.casque })), formule: s && s.formule === 'eclair' ? 'eclair' : 'tournoi', circuits: s && Array.isArray(s.circuits) ? s.circuits : [] });
  JEU.ecran = 'tournoiInscription';
  INTERFACE.montrer('tournoiInscription');
}

const nomParDefaut = i => texte('joueurN').replace('{n}', i + 1);

// « C'est parti ! » : la liste vérifiée (2 à 8, prénoms différents), les circuits (choisis, ou tirés au sort), le tournoi créé et
// sauvegardé (à part de la carrière), puis la page de la première manche
function partirTournoi() {
  if (JEU.ecran !== 'tournoiInscription') return false;
  const choix = INTERFACE.lireInscription(), r = TOURNOI.valider(choix.joueurs, nomParDefaut);
  INTERFACE.montrerErreursTournoi(r.erreurs);
  if (!r.ok) return false;
  const nb = choix.formule === 'tournoi' ? REGLAGES.TOURNOI_MANCHES : 1, ancien = SAUVEGARDE.tournoi() || {};
  const graine = (ancien.tournois || 0) + 1;
  const tires = TOURNOI.tirerCircuits(Object.keys(CIRCUITS), nb, graine);
  const circuits = choix.circuits.slice(0, nb).map((c, m) => Object.prototype.hasOwnProperty.call(CIRCUITS, c) ? c : tires[m]);
  SAUVEGARDE.ecrireTournoi({ joueurs: r.joueurs, formule: choix.formule, circuits: choix.circuits, tournois: graine, enCours: TOURNOI.creer(r.joueurs, choix.formule, circuits) });
  location.href = adresseAvec({ tournoi: '1' });
  return true;
}

// la page ?tournoi=1 : au démarrage, ou après un passage : « À toi, Sarah ! » et le compte à rebours (puis le tour)
function montrerAToi() {
  const t = JEU.tournoi, j = TOURNOI.joueurActuel(t);
  if (j === null) return;
  PODIUM3D.cacher();
  JEU.tournoiCompte = REGLAGES.TOURNOI_COMPTE;
  // la voiture du tour attend sur la ligne de lancement, son casque est celui du joueur
  const v = creerVoiture(CIRCUIT, 0);
  JEU.qualif = { etat: 'atoi', q: QUALIFICATION.creer(CIRCUIT, v), v, passe: false };
  JEU.joueur = v; JEU.course = JEU.qualif.q.course;
  VOITURE3D.majCasque(JEU.tournoi.joueurs.length, t.joueurs[j].casque);
  INTERFACE.remplirAToi(t.joueurs[j], t.manche, TOURNOI.nbManches(t), texte('circuit_' + NOM_CIRCUIT) || CIRCUIT.nom);
  INTERFACE.majCompteTournoi(JEU.tournoiCompte);
  JEU.ecran = 'tournoiAToi';
  INTERFACE.montrer('tournoiAToi');
}

// à chaque image de « À toi » : le compte à rebours (temps réel) ; à 0, le tour commence, avec le fantôme du leader du moment
function majAToi(dt) {
  if (JEU.ecran !== 'tournoiAToi') return;
  JEU.tournoiCompte -= dt;
  INTERFACE.majCompteTournoi(JEU.tournoiCompte);
  if (JEU.tournoiCompte <= 0) commencerTourTournoi();
}

function commencerTourTournoi() {
  const t = JEU.tournoi, chef = TOURNOI.leader(t, t.manche);
  JEU.qualif.etat = 'tour';
  JEU.qualif.q.course.compte = 0;   // (le compte à rebours de « À toi » vient d'avoir lieu : pas un second 3-2-1)
  JEU.signal = null;
  // le fantôme du meilleur temps du moment dans la manche (pénalités comprises, même un tour coupé) ; aucun pour le premier joueur
  JEU.fantome = { rejeu: chef === null ? null : FANTOME.charger(JEU.tournoiFantomes[chef]), tour: FANTOME.commencer(), ecart: null, visible: SAUVEGARDE.option('fantome', true), roues: 0 };
  if (JEU.fantome.rejeu && !JEU.modeleFantome) {
    JEU.modeleFantome = VOITURE3D.creerFantome(REGLAGES.FANTOME_COULEUR, REGLAGES.FANTOME_OPACITE);
    SCENE3D.ajouter(JEU.modeleFantome.groupe);
  }
  JEU.ecran = 'qualif';
  INTERFACE.montrer('course');   // le bandeau du tour (chrono, secteurs), comme en qualification
}

// le tour fini (ou abandonné) : le temps (le tour + ses pénalités), le fantôme gardé en mémoire pour la suite de la manche,
// le classement de la manche
function finirTourTournoi(q, abandon) {
  const t = JEU.tournoi, j = TOURNOI.joueurActuel(t), f = JEU.fantome;
  if (j === null) return;
  const avant = TOURNOI.classementManche(t, t.manche), recordAvant = avant.length && avant[0].temps !== null ? avant[0].temps : null;
  if (!abandon && f) JEU.tournoiFantomes[j] = FANTOME.compacter(f.tour, q.tour, q.fin);
  TOURNOI.enregistrer(t, j, abandon ? { abandon: true } : { tour: q.tour, penalites: q.penalites });
  JEU.fantome = null;
  JEU.qualif = null;
  sauverTournoi();
  montrerMancheTournoi(j, recordAvant);
}

function sauverTournoi() {
  const s = SAUVEGARDE.tournoi() || {};
  s.enCours = JEU.tournoi;
  SAUVEGARDE.ecrireTournoi(s);
}

// la phrase après un passage : « Sarah prend la tête ! », « À 0,03 s du record ! », « Sarah : 3e », « pas de temps »
function phraseTournoi(t, j, recordAvant) {
  const c = TOURNOI.classementManche(t, t.manche), x = c.find(y => y.j === j), p = t.joueurs[j].prenom;
  if (x.temps === null) return texte('tournoiPhraseAbandon').replace('{prenom}', p);
  if (x.place === 1) return texte('tournoiPhraseTete').replace('{prenom}', p);
  if (recordAvant !== null && x.temps - c[0].temps < REGLAGES.TOURNOI_PRES) return texte('tournoiPhrasePres').replace('{s}', (x.temps - c[0].temps).toFixed(2).replace('.', texte('virgule')));
  return texte('tournoiPhrasePlace').replace('{prenom}', p).replace('{p}', x.place);
}

const lignesTournoi = (t, liste, nouveau) => liste.map(x => ({ prenom: t.joueurs[x.j].prenom, casque: t.joueurs[x.j].casque, temps: x.temps === undefined ? x.meilleur : x.temps, penalites: x.penalites || 0, points: x.points, nouveau: x.j === nouveau }));

function montrerMancheTournoi(j, recordAvant) {
  const t = JEU.tournoi, finie = TOURNOI.mancheFinie(t, t.manche), suivant = TOURNOI.joueurActuel(t);
  const titre = TOURNOI.nbManches(t) > 1 ? avecTexte('tournoiManche', { m: t.manche + 1, n: TOURNOI.nbManches(t) }) : texte('formuleEclair');
  const general = finie && t.formule === 'tournoi' ? lignesTournoi(t, TOURNOI.classementGeneral(t), null) : null;
  const bouton = !finie ? texte('tournoiSuivant').replace('{prenom}', t.joueurs[suivant].prenom) : TOURNOI.fini(t) ? texte('tournoiPodium') : texte('tournoiMancheSuivante');
  INTERFACE.remplirMancheTournoi(titre, phraseTournoi(t, j, recordAvant), lignesTournoi(t, TOURNOI.classementManche(t, t.manche), j), general, bouton);
  JEU.ecran = 'tournoiManche';
  INTERFACE.montrer('tournoiManche');
}

const avecTexte = (cle, v) => texte(cle).replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);

// le bouton sous le classement : le joueur suivant (sans pub), la manche suivante (une pub, puis sa page), ou le podium
function suiteTournoi() {
  if (JEU.ecran !== 'tournoiManche' || SDK.pubEnCours) return;
  const t = JEU.tournoi;
  if (!TOURNOI.mancheFinie(t, t.manche)) { montrerAToi(); return; }
  if (TOURNOI.fini(t)) { montrerPodiumTournoi(); return; }
  SDK.pubEntreCourses(() => { TOURNOI.mancheSuivante(t); sauverTournoi(); location.reload(); }, couperSonPub);
}

// le podium 3D : les trois premiers casques (une voiture chacun, à la couleur de son casque) et leurs prénoms
function montrerPodiumTournoi() {
  const t = JEU.tournoi, trois = TOURNOI.podium(t);
  if (JEU.modele) JEU.modele.groupe.visible = false;
  if (JEU.modeleFantome) JEU.modeleFantome.groupe.visible = false;
  PODIUM3D.montrer(trois.map(x => JEU.tournoiPodium[x.j]));
  INTERFACE.remplirPodium(trois.map(x => ({ numero: '', nom: t.joueurs[x.j].prenom, couleur: t.joueurs[x.j].casque.couleurs[0], total: x.meilleur, penalites: 0, casque: t.joueurs[x.j].casque })));
  INTERFACE.remplirPodiumDeux(null);
  JEU.tempsPodium = 0;
  SON.signal('arrivee');
  JEU.ecran = 'podium';
  INTERFACE.montrer('podium');
}

function montrerFinTournoi() {
  if (JEU.ecran !== 'podium' || !JEU.tournoi) return;
  const t = JEU.tournoi;
  INTERFACE.remplirFinTournoi(lignesTournoi(t, TOURNOI.classementGeneral(t), null), t.formule === 'tournoi');
  JEU.ecran = 'tournoiFin';
  INTERFACE.montrer('tournoiFin');
}

// « Rejouer » : les mêmes joueurs et la même formule (les circuits au hasard retirés) ; « Nouveaux joueurs » : l'inscription
function rejouerTournoi() {
  if (JEU.ecran !== 'tournoiFin' || SDK.pubEnCours) return;
  SDK.pubEntreCourses(() => {
    const s = SAUVEGARDE.tournoi(), t = JEU.tournoi, nb = TOURNOI.nbManches(t), graine = (s.tournois || 0) + 1, tires = TOURNOI.tirerCircuits(Object.keys(CIRCUITS), nb, graine);
    const circuits = [...Array(nb)].map((x, m) => Object.prototype.hasOwnProperty.call(CIRCUITS, (s.circuits || [])[m]) ? s.circuits[m] : tires[m]);
    s.tournois = graine;
    s.enCours = TOURNOI.creer(t.joueurs, t.formule, circuits);
    SAUVEGARDE.ecrireTournoi(s);
    location.reload();
  }, couperSonPub);
}

function nouveauxJoueursTournoi() {
  if (JEU.ecran !== 'tournoiFin' || SDK.pubEnCours) return;
  SDK.pubEntreCourses(() => {
    const s = SAUVEGARDE.tournoi();
    s.enCours = null;
    SAUVEGARDE.ecrireTournoi(s);
    location.href = adresseAvec({ menu: 'tournoi' });
  }, couperSonPub);
}

// Échap pendant un tour : la pause du tournoi (reprendre, ou abandonner : pas de temps)
function pauseTournoi(oui) {
  if (oui && enTourQualif() && JEU.tournoi) { JEU.ecran = 'tournoiPause'; INTERFACE.montrer('tournoiPause'); }
  else if (!oui && JEU.ecran === 'tournoiPause') { JEU.ecran = 'qualif'; INTERFACE.montrer('course'); }
}

function abandonnerTournoi() {
  if (JEU.ecran !== 'tournoiPause') return;
  finirTourTournoi(JEU.qualif.q, true);
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
  entrerGrille();
}

// --- la grille vue d'en haut, avant les feux (CLAUDE.md « L'interface » : « le départ : les feux, et la grille vue d'en haut »)
// : GRILLE_DUREE s de survol, puis la course (les feux) ; une touche ou un clic la passe ; jamais à deux ni au tournoi ; pendant le
// survol, la physique attend (JEU.ecran n'est pas « course » : les feux ne sont pas encore allumés)
function entrerGrille() {
  const oui = JEU.plateau && JEU.contre && !JEU.deux && !JEU.tournoi && (!JEU.decouverte || REGLAGES.GRILLE_DECOUVERTE);
  if (!oui) { JEU.ecran = 'course'; INTERFACE.montrer('course'); return; }
  JEU.grille = { t: 0, tribune: tribuneSupporters() };   // (au Grand Prix à domicile : d'abord la tribune des supporters)
  JEU.ecran = 'grille';
  INTERFACE.montrer('grille');
}

function majGrille(dt) {
  if (JEU.ecran !== 'grille' || !JEU.grille) return;
  JEU.grille.t += dt;
  const avant = JEU.grille.tribune ? REGLAGES.GRILLE_TRIBUNE_DUREE : 0;
  if (JEU.grille.t < avant) CAMERA.tribune(JEU.grille.tribune, JEU.grille.t / avant);
  else CAMERA.grille(JEU.plateau.pilotes.map(p => p.v), (JEU.grille.t - avant) / REGLAGES.GRILLE_DUREE);
  if (JEU.grille.t >= avant + REGLAGES.GRILLE_DUREE) finirGrille();
}

// le Grand Prix à domicile du joueur (sa course de cœur, decor-public.js) : la tribune principale du décor, là où sont ses supporters
// (ses premiers et derniers modules) ; null ailleurs
function tribuneSupporters() {
  const ch = championnatDecor(), joueur = ch && ch.pilotes ? ch.pilotes.find(p => p && p.humain) : null;
  if (!joueur || typeof DECOR_PUBLIC === 'undefined' || !DECOR_PUBLIC.domicile(joueur, NOM_CIRCUIT) || !SCENE3D.decor) return null;
  const mods = SCENE3D.decor.objets.tribune.filter(o => o.entree === 1);
  return mods.length >= 2 ? { a: mods[0], b: mods[mods.length - 1] } : null;
}

// le championnat que voit le décor (le public, les banderoles) : celui de la carrière ; ?domicile=1 (tests) : un joueur fictif à domicile
function championnatDecor() {
  if (CHAMPIONNAT_EN_COURS) return CHAMPIONNAT_EN_COURS;
  if (PARAMETRES.get('domicile') !== '1') return null;
  return { graine: 1, pilotes: [{ humain: true, nom: texte('nomJoueur'), numero: 27, pays: REGLAGES.CIRCUITS_PAYS[NOM_CIRCUIT], coeur: NOM_CIRCUIT }] };
}

function finirGrille() {
  if (JEU.ecran !== 'grille') return;
  JEU.grille = null;
  CAMERA.forcer(CAMERA.mode);   // la caméra de course repart de derrière la voiture
  JEU.ecran = 'course';
  INTERFACE.montrer('course');
}

// l'enregistrement de la course qui commence (enregistreur.js, étape 13) : toutes les voitures de la course (le plateau,
// ou le joueur seul), à chaque pas de physique (enregistrerPas) ; rien n'est affiché encore (le résumé viendra).
// Le classement, qui coûte cher, ne lui est donné qu'un pas sur CLASSEMENT_PAS (une image sur dix par seconde)
function creerEnregistrement() {
  const voitures = JEU.plateau ? JEU.plateau.pilotes.map(p => p.v) : [JEU.joueur];
  const joueur = JEU.plateau ? (JEU.contre ? JEU.ia : null) : 0;
  return { enr: creerEnregistreur(voitures.length, { joueur }), voitures, parti: false, arrivees: new Set(), arrets: [], pas: 0, ms: 0 };
}

// après chaque pas de physique de la course : l'instant du GO (depart), l'image, les arrivées ; ms : le temps passé (?debug=1, tests)
function enregistrerPas() {
  const r = JEU.enregistreur, e = JEU.plateau, c = JEU.course;
  if (!r || !c) return;
  const t0 = performance.now(), temps = e ? e.temps : c.temps;
  if (!r.parti && courseAutorise(c)) { r.parti = true; r.enr.depart(temps); }
  r.enr.enregistrer(temps, r.voitures, e && r.pas % REGLAGES_ENREGISTREUR.CLASSEMENT_PAS === 0 ? classementCourse(e) : null);
  if (e) e.pilotes.forEach((p, k) => { if (p.arrivee !== null && !r.arrivees.has(k)) { r.arrivees.add(k); r.enr.arrivee(p.arrivee, k); } });
  // les arrêts au stand (avec les pneus, course.js : c.arrets) : chaque arrêt fini devient un moment du résumé (lu, jamais écrit)
  if (e) e.pilotes.forEach((p, k) => { const a = p.course.arrets; if (a && a.length > (r.arrets[k] || 0)) { for (let i = r.arrets[k] || 0; i < a.length; i++) r.enr.arret(temps, k, a[i].duree); r.arrets[k] = a.length; } });
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
  const e = JEU.plateau, ch = JEU.championnat || JEU.monde;   // la découverte : les pilotes du monde, par JEU.indices
  if (!ch || !e || !e.carte) return;
  ALEATOIRE.semer(e.graine + REGLAGES.GRAINE_CARACTERE);
  e.pilotes.forEach((p, k) => {
    const id = JEU.indices ? JEU.indices[k] : k, c = ch.pilotes[id] && ch.pilotes[id].caractere;
    if (!c || !p.pilote || !p.pilote.caractere) return;
    const { regularite, agressivite, erreurs } = appliquerNiveau({ regularite: c.regularite, agressivite: c.agressivite, erreurs: c.erreurs, tours: [] });
    Object.assign(p.pilote.caractere, { regularite, agressivite, erreurs });
    p.pilote.erreurs = tirerErreurs(e.carte, p.pilote.caractere, e.nbTours + 1);
  });
  ALEATOIRE.semer();
}

// le premier lancement (decouverte.js) : l'écran titre, puis « ▶ Jouer » lance la course de découverte tout de suite
function montrerTitre() {
  PODIUM3D.cacher();
  JEU.ecran = 'titre';
  INTERFACE.montrer('titre');
}

function jouerDecouverte() {
  if (JEU.ecran !== 'titre') return;
  JEU.depuisClic = performance.now();
  lancerCourse(REGLAGES.DECOUVERTE_TOURS);
}

// « Entre amis » (l'écran titre et le paddock) : le petit menu (l'écran partagé à deux, le tournoi chrono) ; « Retour » revient
// là d'où on vient
function montrerAmis() {
  if (JEU.ecran !== 'titre' && JEU.ecran !== 'championnat' && JEU.ecran !== 'deuxReglages' && JEU.ecran !== 'tournoiInscription') return;
  if (JEU.ecran !== 'deuxReglages' && JEU.ecran !== 'tournoiInscription') JEU.amisDepuis = JEU.ecran;
  PODIUM3D.cacher();
  JEU.ecran = 'amis';
  INTERFACE.montrer('amis');
}

function retourTitre() {
  if (JEU.ecran !== 'amis') return;
  if (JEU.amisDepuis === 'championnat' && JEU.championnat) montrerChampionnat(JEU.gagne === undefined ? null : JEU.gagne);
  else montrerTitre();
}

// --- le mode 2 joueurs (deux-joueurs.js, tour 25b ordre 3) : l'écran avant la course (les derniers choix, gardés dans la sauvegarde
// unique à part de la carrière), puis la page ?deux=1 ; après la course, le podium à deux, la rivalité, « Revanche » et le menu
function ouvrirDeux() {
  if (JEU.ecran !== 'amis') return;
  INTERFACE.remplirDeux(DEUX_JOUEURS.completer(SAUVEGARDE.deux()));
  JEU.ecran = 'deuxReglages';
  INTERFACE.montrer('deuxReglages');
}

// « C'est parti ! » : les choix vérifiés (deux noms et deux couleurs différents), écrits (la rivalité et le compte des courses
// gardés), puis la page de la course à deux
function partirDeux() {
  if (JEU.ecran !== 'deuxReglages') return false;
  const r = DEUX_JOUEURS.valider(INTERFACE.lireDeux(), [texte('joueur1'), texte('joueur2')]);
  INTERFACE.montrerErreursDeux(r.erreurs);
  if (!r.ok) return false;
  const ancien = DEUX_JOUEURS.completer(SAUVEGARDE.deux());
  r.reglages.rivalite = ancien.rivalite;
  r.reglages.courses = ancien.courses;
  SAUVEGARDE.ecrireDeux(r.reglages);
  location.href = adresseAvec({ deux: '1' });
  return true;
}

// l'adresse de la page avec ces paramètres (la langue forcée ?lang= est gardée)
function adresseAvec(params) {
  const p = new URLSearchParams(params);
  if (PARAMETRES.get('lang')) p.set('lang', PARAMETRES.get('lang'));
  return location.pathname + '?' + p.toString();
}

// la graine de la course à deux : celle de l'adresse (&graine=, tests) décalée à chaque revanche ; sinon le nombre de courses à deux
// déjà lancées (sauvegardé : chaque course a sa grille)
function graineDeux() {
  const g = Number(PARAMETRES.get('graine'));
  if (g) return g + JEU.deux.revanche;
  const d = DEUX_JOUEURS.completer(SAUVEGARDE.deux());
  d.courses++;
  SAUVEGARDE.ecrireDeux(d);
  return d.courses;
}

// le podium à deux : qui a fini devant (pénalités comprises) marque un point de la rivalité (une fois par course), gardée tant que
// les deux noms sont les mêmes
function noterRivaliteDeux() {
  if (!JEU.deux || JEU.deux.rivaliteNotee || !JEU.final) return null;
  JEU.deux.rivaliteNotee = true;
  const d = DEUX_JOUEURS.completer(SAUVEGARDE.deux()), noms = JEU.deux.reglages.joueurs.map(j => j.nom || '');
  d.rivalite = DEUX_JOUEURS.ajouterRivalite(d.rivalite, noms, DEUX_JOUEURS.gagnant(JEU.plateau, JEU.final));
  SAUVEGARDE.ecrireDeux(d);
  JEU.deux.rivalite = d.rivalite;
  return d.rivalite;
}

// pendant une pub (sdk.js) : le son coupé, puis rendu (seulement s'il était allumé avant)
function couperSonPub(oui) {
  if (oui && !SON.muet) { SON.basculer(); JEU.sonCoupePub = true; }
  else if (!oui && JEU.sonCoupePub) { SON.basculer(); JEU.sonCoupePub = false; }
}

// « Revanche » : une pause pub (Poki : entre deux courses à deux, jamais pendant), puis la même course, la grille retirée au sort
function revancheDeux() {
  if (!JEU.deux || (JEU.ecran !== 'resultats' && JEU.ecran !== 'podium') || SDK.pubEnCours) return;
  SDK.pubEntreCourses(() => { JEU.deux.revanche++; lancerCourse(JEU.deux.nbTours); }, couperSonPub);
}

// « Menu » : une pause pub, puis le menu « Entre amis » de la page nue (l'écran titre ou le paddock derrière)
function menuDeux() {
  if (!JEU.deux || (JEU.ecran !== 'resultats' && JEU.ecran !== 'podium') || SDK.pubEnCours) return;
  SDK.pubEntreCourses(() => { location.href = adresseAvec({ menu: 'amis' }); }, couperSonPub);
}

// la découverte : le joueur au milieu de la grille, avec le temps médian des IA (decouverte.js), une fois leurs temps connus
// (la carte, donnerCarte → qualifier) et tant que personne n'a bougé ; appelée à lancerCourse et quand la carte arrive
function placerDecouverte() {
  const e = JEU.plateau;
  if (!JEU.decouverte || !e || !e.carte || !e.pilotes.every(p => p.v.u === 0)) return;
  QUALIFICATION.grille(e, DECOUVERTE.tempsMilieu(e.pilotes.filter(p => !p.humain).map(p => p.qualif)));
}

// les aides en surimpression du premier tour de la découverte : chacune part quand sa touche a servi, toutes au plus tard à la
// fin du premier tour ; « ↑ » clignote si le joueur ne touche à rien sur la grille pendant AIDE_CLIGNOTE_APRES s
function majAides() {
  const c = JEU.course, a = JEU.aides;
  if (!JEU.decouverte || !a || JEU.ecran !== 'course' || !c || c.etat === 'finie' || c.tours.length >= 1) { INTERFACE.majAides(null); return; }
  if (JEU.cibles.gaz) a.gaz = true;
  if (JEU.cibles.direction) a.direction = true;
  if (JEU.cibles.frein) a.frein = true;
  const d = c.depart;
  a.clignote = !!d && d.lance === null && d.t >= REGLAGES.AIDE_CLIGNOTE_APRES && !a.gaz && !a.direction && !a.frein;
  INTERFACE.majAides(a);
}

// après le podium de la découverte : « Bravo ! Prêt pour ta carrière ? », la place et la prime (decouverte.js)
function montrerBravo() {
  if (JEU.ecran !== 'podium' || !JEU.final) return;
  const moi = JEU.final.find(x => x.k === JEU.suivie);
  JEU.prime = DECOUVERTE.prime(moi.place);
  INTERFACE.remplirBravo(moi.place, JEU.final.length, JEU.prime);
  JEU.ecran = 'bravo';
  INTERFACE.montrer('bravo');
}

// « Commencer ma carrière » : la création du pilote (pilote.js), puis le paddock
function commencerCarriere() {
  if (JEU.ecran !== 'bravo') return;
  montrerPilote();
}

// la création du pilote (pilote.js) : après la découverte (le monde), ou au chargement d'un championnat dont le joueur n'a
// pas encore de pilote (une ancienne sauvegarde : demandée une fois)
function montrerPilote(casqueSeul) {
  PODIUM3D.cacher();
  JEU.casqueSeul = !!casqueSeul;
  INTERFACE.remplirPilote(JEU.monde || JEU.championnat);
  INTERFACE.modePilote(JEU.casqueSeul);
  VOITURE3D.apercuCasque(document.getElementById('casqueApercu'), indiceJoueur());   // le casque qui tourne, sur la case du joueur
  JEU.ecran = 'pilote';
  INTERFACE.montrer('pilote');
}

// la voiture du joueur dans la liste des modèles (sa case dans l'atlas des casques)
function indiceJoueur() {
  return JEU.modeles.length ? (JEU.contre ? JEU.ia : 0) : 0;
}

// l'éditeur : à chaque changement, la case du joueur dans l'atlas est redessinée (l'aperçu et sa voiture suivent)
function changerCasque(casque) {
  if (JEU.ecran !== 'pilote' || !CASQUE.valide(casque)) return;
  VOITURE3D.majCasque(indiceJoueur(), casque);
}

// « Mon casque » depuis le paddock : l'écran du pilote réduit au casque ; « Garder ce casque » l'écrit et revient au paddock
function monCasque() {
  if (JEU.ecran !== 'championnat') return;
  montrerPilote(true);
}

// « C'est parti ! » : les choix vérifiés (numéro libre, pays, course de cœur ou domicile) et écrits dans le championnat ; la
// découverte est faite (sa prime gardée), aucun point n'est donné ; la page se recharge sur le paddock
function validerPilote() {
  if (JEU.ecran !== 'pilote') return;
  const ch = JEU.monde || JEU.championnat, choix = INTERFACE.lirePilote();
  if (JEU.casqueSeul) {   // le casque seulement : écrit, sauvegardé, retour au paddock (sans rechargement)
    const j = PILOTE.joueur(ch);
    if (j && CASQUE.valide(choix.casque)) { j.casque = choix.casque; SAUVEGARDE.ecrireChampionnat(ch); VOITURE3D.majCasque(indiceJoueur(), choix.casque); }
    montrerChampionnat(JEU.gagne === undefined ? null : JEU.gagne);
    return;
  }
  const r = PILOTE.valider(ch, choix);
  INTERFACE.montrerErreursPilote(r.erreurs);
  if (!r.ok) return;
  PILOTE.appliquer(ch, r.choix);
  if (CASQUE.valide(choix.casque)) PILOTE.joueur(ch).casque = choix.casque;   // le casque choisi (casque.js)
  // la prime de la découverte va au solde du championnat (argent.js, Codeur 3) : un seul argent dans le jeu
  if (JEU.decouverte && typeof ARGENT !== 'undefined') ARGENT.crediter(ch, JEU.prime, 'decouverte');
  SAUVEGARDE.ecrireChampionnat(ch);
  if (JEU.decouverte) SAUVEGARDE.finirDecouverte(JEU.prime);
  location.reload();
}

// le pilote du championnat (ou du monde de la découverte) de la voiture k, ou null
function piloteDe(k) {
  const ch = JEU.championnat || JEU.monde;
  if (!ch) return null;
  const id = JEU.indices ? JEU.indices[k] : k;
  return ch.pilotes[id] || null;
}

// le casque (casque.js) de la voiture k : celui de son pilote, sinon le neutre
function casqueDe(k) {
  if (JEU.deux && k >= JEU.ia) return JEU.deux.reglages.joueurs[k - JEU.ia].casque;   // le mode 2 joueurs : le casque choisi par chaque joueur
  const p = piloteDe(k);
  return p && CASQUE.valide(p.casque) ? p.casque : CASQUE.neutre();
}

// le numéro affiché de la voiture k de la course : celui de son pilote du championnat (le joueur a le sien), sinon celui de la course
function numeroDe(k) {
  const ch = JEU.championnat, P = JEU.plateau.pilotes;
  return ch && ch.pilotes[k] ? ch.pilotes[k].numero : P[k].numero;
}

// la météo de la course (meteo.js) : le plan tiré avec la graine du Grand Prix (en championnat : celle du championnat, la saison et le
// numéro du Grand Prix), ou forcé par ?meteo= (sec, pluie, averse : la pluie arrive au tiers, eclaircie : elle s'arrête au tiers)
function planMeteo(nbTours) {
  const duree = Math.max(1, nbTours) * CIRCUIT.longueur / REGLAGES.METEO_VITESSE_MOYENNE, force = PARAMETRES.get('meteo');
  if (force === 'sec') return { prevision: { type: 'sec', pourcent: 0 }, debut: 0, change: null };
  if (force === 'pluie') return { prevision: { type: 'pluie', pourcent: 100 }, debut: 0.8, change: null };
  if (force === 'averse') return { prevision: { type: 'risque', pourcent: 100 }, debut: 0, change: { t: duree / 3, pluie: 0.8 } };
  if (force === 'eclaircie') return { prevision: { type: 'pluie', pourcent: 100 }, debut: 0.8, change: { t: duree / 3, pluie: 0 } };
  const ch = JEU.championnat, graine = ch ? METEO.graineGP(ch, ch.prochain) : Number(PARAMETRES.get('graine')) || 1;
  return METEO.plan(NOM_CIRCUIT, graine, duree);
}

// ?championnat=1 : le niveau de l'écurie du joueur (la qualité de sa F1, garage.js appliquer) ; 1 hors championnat (découverte, essais)
function niveauEcurieJoueur() {
  if (!JEU.championnat) return 1;
  const j = JEU.championnat.pilotes.find(p => p.humain);
  return j ? JEU.championnat.ecuries[j.ecurie].niveau : 1;
}

// ?championnat=1 : l'écran entre les courses ; gagne : les points du Grand Prix qui vient de finir (null au démarrage)
function montrerChampionnat(gagne) {
  PODIUM3D.cacher();
  INTERFACE.remplirChampionnat(JEU.championnat, gagne, texte('circuit_' + circuitProchain()) || (CIRCUITS[circuitProchain()] || CIRCUIT).nom);   // le prochain Grand Prix (tour 35d : après une course, le titre gardait le circuit qu'on venait de courir) ; les circuits d'essai ont leur texte
  INTERFACE.remplirDuel(CHAMPIONNAT.scoreDuel(JEU.championnat), JEU.championnat);
  INTERFACE.remplirSolde(JEU.championnat);
  INTERFACE.remplirRappelSponsor(JEU.championnat);
  INTERFACE.remplirReputation(JEU.championnat);   // les trois jauges de l'interview (interview.js)
  INTERFACE.remplirPaddock(JEU.championnat, circuitPaddock(), texte('circuit_' + circuitProchain()) || (CIRCUITS[circuitProchain()] || CIRCUIT).nom);   // le paddock en écran d'accueil (tour 32) : la carte du prochain Grand Prix
  // la météo prévue pour le prochain Grand Prix (meteo.js ; meteo3d.js l'écrit), rien sans prévision
  if (typeof METEO3D !== 'undefined') { const t = METEO3D.textePrevision(METEO3D.prevision(JEU.championnat, JEU.championnat.prochain)), el = document.getElementById('prevision'); el.textContent = t || ''; el.classList.toggle('cache', !t); }
  document.getElementById('boutonAlbum').disabled = !JEU.championnat.album.length;   // l'album des unes (Codeur 3) : rien avant la première une
  JEU.ecran = 'championnat';
  INTERFACE.montrer('championnat');
  // un motif de casque gagné depuis la dernière fois : « Nouveau motif : Couronne ! », une seule fois (casque.js, sauvegarde.js)
  const pilote = PILOTE.joueur(JEU.championnat);
  INTERFACE.annoncerMotifs(SAUVEGARDE.prendreAnnonceMotifs(), pilote && CASQUE.valide(pilote.casque) ? pilote.casque : CASQUE.neutre());
}

// « Course suivante » : la course de ce Grand Prix ; s'il est déjà joué, la page se recharge sur le suivant
function courseSuivante() {
  if (JEU.ecran !== 'championnat' || SDK.pubEnCours) return;
  // le Grand Prix d'avant est fini (après l'interview et la une) : la pause pub Poki vient ici, ENTRE deux Grands Prix (commercialBreak,
  // jamais pendant une course), puis la page se recharge sur le suivant (Codeur 3, étape 15)
  if (JEU.grandPrixFini) { SDK.pubEntreCourses(() => location.reload(), couperSonPub); return; }
  lancerCourse(Number(PARAMETRES.get('tours')) || REGLAGES.CHAMPIONNAT_TOURS);
}

// après les résultats : les points, la une du journal et la sauvegarde (finirGrandPrix), puis la une à l'écran
function apresGrandPrix() {
  if (JEU.ecran !== 'resultats' || JEU.grandPrixFini) return;
  JEU.lignesGP = CHAMPIONNAT.lignesDepuisCourse(JEU.plateau);
  montrerInterview(INTERVIEW.question(JEU.championnat, JEU.lignesGP));
}

// ?championnat=1 : l'interview d'après course (interview.js), entre les résultats et la une du journal : la question se
// calcule sur le classement final AVANT d'enregistrer le Grand Prix ; la réponse (un ton, ou « pas de commentaire ») montre
// sa ligne d'effet, puis « Continuer » enregistre le Grand Prix (finirGrandPrix) et montre la une. Le podium 3D reste
// derrière ; l'interview est un menu (pas de gameplayStart hors course : gameplayStop pour Poki)
function montrerInterview(q) {
  JEU.interview = q;
  INTERFACE.remplirInterview(JEU.championnat, q);
  JEU.ecran = 'interview';
  INTERFACE.montrer('interview');
}

function repondreInterview(ton) {
  if (JEU.ecran !== 'interview' || !JEU.interview) return;
  const r = INTERVIEW.repondre(JEU.championnat, JEU.interview, ton);
  if (!r.ligne) { finirInterview(); return; }   // pas de commentaire : rien à dire, la une tout de suite
  INTERFACE.montrerEffetInterview(JEU.championnat, r);
}

function finirInterview() {
  if (JEU.ecran !== 'interview' || !JEU.lignesGP) return;
  const lignes = JEU.lignesGP, moi = lignes.find(l => l.k === JEU.ia);
  if (JEU.plateau) appliquerConsigne(JEU.championnat, JEU.plateau.consigne);   // la consigne d'équipe suivie ou ignorée : la confiance de l'écurie (Codeur 1)
  CHAMPIONNAT.finirGrandPrix(JEU.championnat, lignes);
  SAUVEGARDE.debloquerMotifs(CASQUE.conditionsRemplies(JEU.championnat));   // les motifs de casque gagnés (victoire, podiums, domicile), à la racine de la sauvegarde
  JEU.grandPrixFini = true;
  JEU.interview = null;
  JEU.lignesGP = null;
  JEU.gagne = moi ? CHAMPIONNAT.pointsPour(moi.place) : 0;
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
  if (JEU.ecran === 'album') { feuilleterAlbum(1); return; }   // dans l'album, un clic sur la page tourne la page
  if (JEU.ecran !== 'une') return;
  if (SAISONS.finie(JEU.championnat)) montrerFinSaison();
  else montrerChampionnat(JEU.gagne);
}

// ?championnat=1 : l'album des unes (Codeur 3, journal.js), depuis le paddock : la dernière une d'abord ; ← → (ou les boutons)
// feuillettent, un clic sur la page tourne la page, ⏮ ⏭ sautent d'une saison ; chaque une est redessinée avec les noms de sa
// saison (JOURNAL.rendreAlbum), donc à l'identique ; Échap ou « Fermer » ramène au paddock
function montrerAlbum() {
  if (JEU.ecran !== 'championnat' || !JEU.championnat.album.length) return;
  JEU.album = JEU.championnat.album.length - 1;
  afficherAlbum();
}

function afficherAlbum() {
  const ch = JEU.championnat;
  INTERFACE.remplirUne(JOURNAL.rendreAlbum(ch, JEU.album, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie }));
  INTERFACE.remplirAlbum(ch, JEU.album);
  JEU.ecran = 'album';
  INTERFACE.montrer('album');
}

function feuilleterAlbum(d) {
  if (JEU.ecran !== 'album') return;
  const i = Math.max(0, Math.min(JEU.championnat.album.length - 1, JEU.album + d));
  if (i === JEU.album) return;
  JEU.album = i;
  afficherAlbum();
}

// la saison d'avant (sa première une ; si on n'est pas au début de la sienne, le début de la sienne) ou la suivante
function saisonAlbum(d) {
  if (JEU.ecran !== 'album') return;
  const S = JOURNAL.saisonsAlbum(JEU.championnat), k = S.findIndex(x => x.saison === JEU.championnat.album[JEU.album].s);
  const cible = d < 0 ? (JEU.album > S[k].debut ? S[k] : S[Math.max(0, k - 1)]) : S[Math.min(S.length - 1, k + 1)];
  JEU.album = cible.debut;
  afficherAlbum();
}

function quitterAlbum() {
  if (JEU.ecran !== 'album') return;
  montrerChampionnat(JEU.gagne);
}

// ?championnat=1 : la fin de saison (saisons.js) : le classement final et le champion → le duel de la saison → les contrats
// (ou la retraite par l'âge) → la saison suivante (l'écran du championnat, puis « Course suivante » recharge la page)
function montrerFinSaison() {
  const ch = JEU.championnat;
  if (ch.retraite) { montrerRetraite(); return; }
  const b = SAISONS.terminerSaison(ch);
  SAUVEGARDE.debloquerMotifs(CASQUE.conditionsRemplies(ch));   // les motifs de casque gagnés en fin de saison (titre, duel)
  // la cérémonie du champion (une fois par saison, avant le classement final) : le joueur champion → le podium, « CHAMPION DU
  // MONDE » et les confettis ; un rival → un écran plus court ; gardée dans l'historique de la saison (pas deux fois au rechargement)
  const close = ch.saisons[ch.saisons.length - 1];
  if (close && close.saison === ch.saison && !close.ceremonie) { close.ceremonie = 1; SAUVEGARDE.ecrireChampionnat(ch); montrerCeremonie(b); return; }
  SAUVEGARDE.ecrireChampionnat(ch);
  PODIUM3D.cacher();
  INTERFACE.remplirSaison(ch, b);
  JEU.ecran = 'saison';
  INTERFACE.montrer('saison');
}

// ?championnat=1 : la cérémonie du champion (Codeur 3) : le podium 3D avec le champion seul en haut ; le joueur champion a
// « CHAMPION DU MONDE » et les confettis (podium3d.js : un seul appel de dessin), un rival un écran plus court ; Poki : un menu
// (gameplayStop, comme tout ce qui n'est pas la course) ; « Suite » → le classement final de la saison
function montrerCeremonie(b) {
  const ch = JEU.championnat, k = b.champion, toi = !!ch.pilotes[k].humain;
  for (const m of JEU.modeles) m.groupe.visible = false;
  if (JEU.modeles[k]) { if (toi) PODIUM3D.ceremonie(JEU.modeles[k]); else PODIUM3D.montrer([JEU.modeles[k]]); }
  INTERFACE.remplirCeremonie(ch, b);
  JEU.tempsPodium = 0;
  JEU.ecran = 'ceremonie';
  INTERFACE.montrer('ceremonie');
}

function suiteCeremonie() {
  if (JEU.ecran !== 'ceremonie') return;
  PODIUM3D.cacher();
  montrerFinSaison();
}

function suiteClassementSaison() {
  if (JEU.ecran !== 'saison') return;
  INTERFACE.remplirDuelSaison(JEU.championnat, CHAMPIONNAT.scoreDuel(JEU.championnat));
  JEU.ecran = 'duelSaison';
  INTERFACE.montrer('duelSaison');
}

function suiteDuelSaison() {
  if (JEU.ecran !== 'duelSaison') return;
  if (JEU.championnat.retraite) { montrerRetraite(); return; }
  montrerContrats();
}

function montrerContrats() {
  const ch = JEU.championnat;
  INTERFACE.remplirContrats(ch, SAISONS.offres(ch), SAISONS.note(ch));
  JEU.ecran = 'contrats';
  INTERFACE.montrer('contrats');
}

// le joueur signe : la nouvelle saison commence (saisons.js), la sauvegarde, puis l'écran du championnat (Grand Prix 1)
function signerContrat(id) {
  if (JEU.ecran !== 'contrats') return false;
  if (!SAISONS.signer(JEU.championnat, id)) return false;
  SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  JEU.gagne = null;
  JEU.grandPrixFini = true;   // « Course suivante » recharge la page sur le premier Grand Prix de la nouvelle saison (le circuit change)
  montrerSponsors();   // la nouvelle saison commence par le choix du sponsor
  return true;
}

// ?championnat=1 : les sponsors (sponsors.js) : les offres à choisir au début de la saison (après les contrats, ou par le bouton
// « Sponsors » du paddock tant qu'aucun n'est signé), sinon le sponsor signé et l'avancement de ses objectifs
function montrerSponsors() {
  if (JEU.ecran !== 'championnat' && JEU.ecran !== 'contrats') return;
  const ch = JEU.championnat;
  INTERFACE.remplirSponsors(ch, SPONSORS.aChoisir(ch) ? SPONSORS.offres(ch) : []);
  JEU.ecran = 'sponsors';
  INTERFACE.montrer('sponsors');
}

function choisirSponsor(cle) {
  if (JEU.ecran !== 'sponsors') return false;
  if (!SPONSORS.choisir(JEU.championnat, cle)) return false;
  SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  montrerChampionnat(JEU.gagne);
  return true;
}

function quitterSponsors() {
  if (JEU.ecran !== 'sponsors') return;
  montrerChampionnat(JEU.gagne);
}

// ?championnat=1 : la fiche d'un rival (fiche.js), au clic sur son nom dans le classement du paddock
function montrerFiche(k) {
  if (JEU.ecran !== 'championnat') return;
  const p = JEU.championnat.pilotes[k];
  if (!p || p.humain) return;
  INTERFACE.remplirFiche(JEU.championnat, FICHE.fiche(JEU.championnat, k));
  JEU.ecran = 'fiche';
  JEU.ficheK = k;   // (le bouton « Discuter » de la fiche)
  INTERFACE.montrer('fiche');
}

function quitterFiche() {
  if (JEU.ecran !== 'fiche') return;
  montrerChampionnat(JEU.gagne);
}

// --- les discussions (Codeur 3, étape 12b, discussion.js) : depuis la fiche d'un rival (« Discuter ») ou le paddock (le coéquipier) ;
// jamais pendant une course (DISCUSSION.peutDiscuter). Chaque message est sauvegardé (sa mémoire est dans le championnat)
function montrerDiscussion(k, depuis, premier) {
  if (!DISCUSSION.peutDiscuter(JEU.ecran)) return;
  const p = JEU.championnat.pilotes[k];
  if (!p || p.humain) return;
  JEU.discussion = { k, depuis: depuis || JEU.ecran, fil: premier ? [{ de: 'lui', texte: premier }] : [] };   // (depuis le courrier : son message ouvre le fil)
  JEU.ecran = 'discussion';
  remplirDiscussion();
  INTERFACE.montrer('discussion');
  setTimeout(() => { const t = document.getElementById('discussionTexte'); if (t && JEU.ecran === 'discussion') t.focus(); }, 0);
}
function remplirDiscussion() {
  const d = JEU.discussion;
  INTERFACE.remplirDiscussion(JEU.championnat, d.k, d.fil, DISCUSSION.intentions(JEU.championnat, d.k));
}
function envoyerDiscussion(txt) {
  const d = JEU.discussion;
  if (JEU.ecran !== 'discussion' || !d || !String(txt || '').trim()) return;
  const r = DISCUSSION.dire(JEU.championnat, d.k, String(txt).slice(0, 140), 'discussion');
  if (!r) return;
  d.fil.push({ de: 'moi', texte: String(txt).slice(0, 140) }, { de: 'lui', texte: r.texte });
  JEU.derniereReponse = r;   // (les tests lisent le raisonnement de la dernière réponse)
  SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  remplirDiscussion();
}
function composerDiscussion(intention, cible) {
  if (JEU.ecran !== 'discussion' || !JEU.discussion) return;
  envoyerDiscussion(DISCUSSION.composer(JEU.championnat, intention, { cible }));
}
function quitterDiscussion() {
  if (JEU.ecran !== 'discussion') return;
  const d = JEU.discussion;
  JEU.discussion = null;
  montrerChampionnat(JEU.gagne);
  if (d && d.depuis === 'fiche') montrerFiche(d.k);
  if (d && d.depuis === 'courrier') montrerCourrier();
}

// --- le courrier des pilotes (Codeur 3, courrier-pilotes.js) : depuis le paddock ; « Répondre » ouvre la discussion avec son message
function messagesCourrier() {
  const ch = JEU.championnat, c = COURRIER_PILOTES.completer(ch);
  return c.messages.map((m, i) => ({ i, k: m.k, lu: m.lu, texte: COURRIER_PILOTES.texteDe(ch, m, { pilote: INTERFACE.nomPilote }) })).reverse();
}
function montrerCourrier() {
  if (JEU.ecran !== 'championnat') return;
  INTERFACE.remplirCourrier(JEU.championnat, messagesCourrier());
  JEU.ecran = 'courrier';
  INTERFACE.montrer('courrier');
}
function repondreCourrier(i) {
  if (JEU.ecran !== 'courrier') return;
  const ch = JEU.championnat, m = COURRIER_PILOTES.lire(ch, i);
  if (!m) return;
  SAUVEGARDE.ecrireChampionnat(ch);
  montrerDiscussion(m.k, 'courrier', COURRIER_PILOTES.texteDe(ch, m, { pilote: INTERFACE.nomPilote }));
}
function quitterCourrier() {
  if (JEU.ecran !== 'courrier') return;
  montrerChampionnat(JEU.gagne);
}

function prendreRetraite() {
  if (JEU.ecran !== 'contrats') return;
  SAISONS.prendreRetraite(JEU.championnat, 'choix');
  SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  montrerRetraite();
}

function montrerRetraite() {
  PODIUM3D.cacher();
  const ch = JEU.championnat, place = SAUVEGARDE.entrerAuTemple(ch);   // le temple de la renommée (carriere.js) : une seule fois, sauvegardé
  INTERFACE.remplirRetraite(ch.retraite);
  // le bilan de carrière (étape 14) : les chiffres, les duels, la une préférée (redessinée comme le jour même), la place au temple
  const b = CARRIERE.bilan(ch), une = b.une === null ? null : JOURNAL.rendreAlbum(ch, b.une, { pilote: INTERFACE.nomPilote, ecurie: INTERFACE.nomEcurie });
  INTERFACE.remplirBilan(ch, b, une, place, SAUVEGARDE.temple().carrieres.length);
  JEU.ecran = 'retraite';
  INTERFACE.montrer('retraite');
}

// le temple de la renommée (carriere.js), depuis le bilan : les carrières finies classées, les records ; « Retour » : le bilan
function montrerTemple() {
  if (JEU.ecran !== 'retraite') return;
  const t = SAUVEGARDE.temple();
  INTERFACE.remplirTemple(CARRIERE.classer(t), t.records, JEU.championnat.retraite ? JEU.championnat.retraite.temple : null);
  JEU.ecran = 'temple';
  INTERFACE.montrer('temple');
}

// la relève (carriere.js) : « Continuer la dynastie » → l'écran de l'héritier ; « C'est parti ! » : le même monde passe à la saison
// suivante, l'héritier dans la plus petite écurie, sauvegardé, puis le paddock (« Course suivante » recharge la page sur le nouveau
// circuit) ; « Nouvelle dynastie » : un monde neuf (une autre graine), l'ancienne reste au temple, la page se recharge
function montrerHeritier() {
  if (JEU.ecran !== 'retraite') return;
  INTERFACE.remplirHeritier(JEU.championnat);
  JEU.ecran = 'heritier';
  INTERFACE.montrer('heritier');
}

function validerHeritier() {
  if (JEU.ecran !== 'heritier') return false;
  const ch = JEU.championnat, choix = INTERFACE.lireHeritier(ch);
  if (!CARRIERE.validerHeritier(ch, choix).ok || !CARRIERE.continuer(ch, choix)) { INTERFACE.montrerErreurHeritier(true); return false; }
  SAUVEGARDE.ecrireChampionnat(ch);
  JEU.gagne = null;
  JEU.grandPrixFini = true;   // le circuit du Grand Prix 1 de la nouvelle saison : « Course suivante » recharge la page
  montrerChampionnat(null);
  return true;
}

function nouvelleDynastie() {
  if (JEU.ecran !== 'retraite') return;
  const ancien = JEU.championnat;
  SAUVEGARDE.entrerAuTemple(ancien);   // (déjà fait au bilan : une seule fois)
  SAUVEGARDE.ecrireChampionnat(CARRIERE.nouveauMonde(ancien));
  location.reload();
}

// le calendrier de la saison, depuis le paddock (Codeur 3) ; « Retour » : le paddock
function montrerCalendrier() {
  if (JEU.ecran !== 'championnat') return;
  INTERFACE.remplirCalendrier(JEU.championnat, CHAMPIONNAT.calendrierSaison(JEU.championnat));
  JEU.ecran = 'calendrier';
  INTERFACE.montrer('calendrier');
}

function quitterCalendrier() {
  if (JEU.ecran !== 'calendrier') return;
  montrerChampionnat(JEU.gagne);
}

// l'arbre de la dynastie (carriere.js), depuis le paddock ou le bilan ; « Retour » ramène là d'où on vient
function montrerArbre() {
  if (JEU.ecran !== 'championnat' && JEU.ecran !== 'retraite') return;
  JEU.arbreDepuis = JEU.ecran;
  INTERFACE.remplirArbre(JEU.championnat);
  JEU.ecran = 'arbre';
  INTERFACE.montrer('arbre');
}

function quitterArbre() {
  if (JEU.ecran !== 'arbre') return;
  if (JEU.arbreDepuis === 'retraite') { JEU.ecran = 'retraite'; montrerRetraite(); } else montrerChampionnat(JEU.gagne);
}

function quitterTemple() {
  if (JEU.ecran !== 'temple') return;
  montrerRetraite();
}

// ?championnat=1 : le garage (garage.js, argent.js), depuis l'écran du championnat ; un achat est sauvegardé tout de suite
function montrerGarage() {
  if (JEU.ecran !== 'championnat') return;
  INTERFACE.remplirGarage(JEU.championnat);
  JEU.ecran = 'garage';
  INTERFACE.montrer('garage');
}

// les pneus du départ (la météo, Codeur 1), choisis au garage : gardés dans le championnat jusqu'au départ du prochain Grand Prix
function choisirPneusDepart(type) {
  if (JEU.ecran !== 'garage') return;
  JEU.championnat.pneusDepart = type || null;
  SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  INTERFACE.remplirGarage(JEU.championnat);
}

function acheterAmelioration(nom) {
  if (JEU.ecran !== 'garage') return null;
  const r = GARAGE.acheter(JEU.championnat, nom);
  if (r.ok) SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  INTERFACE.remplirGarage(JEU.championnat);
  return r;
}

// ?championnat=1 : l'aileron (aileron.js), depuis le garage, avant le Grand Prix : la carte de la prochaine course ; le cran est
// gardé par circuit et sauvegardé à chaque changement ; il s'applique aux qualifications et à la course (lancerCourse, faireMonTour)
// le circuit construit du prochain Grand Prix, pour la carte du paddock (tour 32, Codeur 3) : comme montrerAileron, gardé une fois construit
const CIRCUITS_PADDOCK = {};
function circuitPaddock() {
  const nom = circuitProchain();
  if (nom === NOM_CIRCUIT) return CIRCUIT;
  if (!CIRCUITS[nom]) return null;
  return CIRCUITS_PADDOCK[nom] || (CIRCUITS_PADDOCK[nom] = construireCircuit(CIRCUITS[nom]));
}

function circuitProchain() {
  const ch = JEU.championnat, gp = ch.calendrier[Math.min(ch.prochain, ch.calendrier.length - 1)];
  return gp ? gp.circuit : NOM_CIRCUIT;
}

function montrerAileron() {
  if (JEU.ecran !== 'garage') return;
  const nom = circuitProchain();
  INTERFACE.remplirAileron(nom === NOM_CIRCUIT ? CIRCUIT : construireCircuit(CIRCUITS[nom]), texte('circuit_' + nom) || CIRCUITS[nom].nom, AILERON.cranDe(JEU.championnat, nom));
  JEU.ecran = 'aileron';
  INTERFACE.montrer('aileron');
}

function changerAileron(cran) {
  if (JEU.ecran !== 'aileron') return;
  AILERON.regler(JEU.championnat, circuitProchain(), cran);
  SAUVEGARDE.ecrireChampionnat(JEU.championnat);
  INTERFACE.majAileron(AILERON.cranDe(JEU.championnat, circuitProchain()));
}

function quitterAileron() {
  if (JEU.ecran !== 'aileron') return;
  INTERFACE.remplirGarage(JEU.championnat);
  JEU.ecran = 'garage';
  INTERFACE.montrer('garage');
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
  // le mode 2 joueurs : les deux joueurs (leur nom, mis en valeur), leur place même hors du podium, et la rivalité
  const joueurDe = k => JEU.deux && P[k].joueur ? P[k].joueur : 0, nomDe = k => joueurDe(k) ? JEU.deux.reglages.joueurs[joueurDe(k) - 1].nom : null;
  INTERFACE.remplirPodium(trois.map(x => ({ numero: numeroDe(x.k), couleur: JEU.couleurs[x.k], total: x.total, penalites: x.penalites, casque: casqueDe(x.k), joueur: joueurDe(x.k), nom: nomDe(x.k) })));
  INTERFACE.remplirResultats(JEU.final.map(x => ({
    place: x.place, numero: numeroDe(x.k), couleur: JEU.couleurs[x.k], total: x.total, penalites: x.penalites,
    ecart: x.ecart, grille: x.grille, moi: x.k === JEU.suivie || !!joueurDe(x.k), casque: casqueDe(x.k), nom: nomDe(x.k),
    arrets: x.arrets,   // les tours de ses arrêts au stand (étape 7, Codeur 1)
  })));
  INTERFACE.remplirPodiumDeux(JEU.deux ? DEUX_JOUEURS.joueurs(e).map(p => { const k = P.indexOf(p); return { nom: nomDe(k), place: JEU.final.find(x => x.k === k).place }; }) : null);
  INTERFACE.remplirRivalite(JEU.deux ? noterRivaliteDeux() : null);
  // ?championnat=1 : les gains du joueur (argent.js), calculés sur le classement final de cet instant (encaissés à « Continuer »)
  if (JEU.championnat) {
    const lignes = CHAMPIONNAT.lignesDepuisCourse(e), g = ARGENT.gains(JEU.championnat, lignes), moi = lignes.find(l => l.k === JEU.ia);
    if (g) { g.placeNumero = moi.place; g.sponsor = SPONSORS.primesPour(JEU.championnat, lignes); }   // les primes du sponsor que ce classement apporterait (sponsors.js)
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
  // le mode 2 joueurs : l'attente commence quand les deux joueurs sont arrivés (le dernier des deux)
  if (JEU.deux && !DEUX_JOUEURS.finie(e)) return;
  const arrivee = JEU.deux ? Math.max(...DEUX_JOUEURS.joueurs(e).map(p => p.arrivee)) : moi.arrivee;
  if (!JEU.attente) {
    JEU.attente = { tele: null, camera: CAMERA.mode, passer: false };
    CAMERA.forcer('tele');
    if (!JEU.deux) CAMERA.drone(moi.v.cap);   // l'arrivée vue du drone (CLAUDE.md « La réalisation télé »), puis la régie
  }
  JEU.attente.tele = ARRIVEE.voitureTele(e, JEU.attente.tele);
  // « passer » (CLAUDE.md « La course ») : le reste de la course est vraiment joué, en accéléré (×ARRIVEE_ACCELERE) : à chaque image,
  // les mêmes pas de physique que la boucle (BOUCLE.simuler d'un pas), sans les dessiner, au plus ARRIVEE_TRANCHE_MS ; les places et
  // les temps sont ceux qu'on aurait eus en regardant ; ARRIVEE_ATTENTE_MAX reste le filet (une voiture bloquée)
  if (JEU.attente.passer && !(JEU.attente.suivi && ARRIVEE.podiumPretAccelere(e, JEU.attente.suivi))) {
    const R = REGLAGES, nb = Math.max(1, Math.round(R.ARRIVEE_ACCELERE * Math.min(JEU.dtImage || 0, R.PAS_MAX_PAR_IMAGE * R.PAS_PHYSIQUE) / R.PAS_PHYSIQUE));
    if (!JEU.attente.suivi) { JEU.attente.suivi = ARRIVEE.creerSuivi(e); JEU.attente.debutReel = performance.now(); }
    const r = ARRIVEE.accelerer(e, () => BOUCLE.simuler(R.PAS_PHYSIQUE), nb, R.ARRIVEE_TRANCHE_MS, arrivee, () => performance.now(), JEU.attente.suivi);
    JEU.attente.accelere = (JEU.attente.accelere || 0) + r.pas;
  }
  majAttente();
  // en accéléré : tout le monde a fini (sauf une voiture bloquée), ou le plafond de temps réel ; en regardant : podiumPret (ARRIVEE_ATTENTE_MAX)
  const a = JEU.attente, pret = a.suivi ? ARRIVEE.podiumPretAccelere(e, a.suivi) || performance.now() - a.debutReel >= REGLAGES.ARRIVEE_ACCELERE_MAX_REEL * 1000 : ARRIVEE.podiumPret(e, e.temps - arrivee);
  if (pret) {
    finirAttente();
    montrerPodium();
  }
}

// le bandeau d'attente : « en attendant les autres » et le bouton pour passer ; en accéléré, « ⏩ » et les voitures encore en course
function majAttente() {
  const a = JEU.attente, n = ARRIVEE.restantes(JEU.plateau);
  document.getElementById('attenteTexte').textContent = a && a.passer ? (n === 1 ? texte('attenteAccelere1') : texte('attenteAccelere').replace('{n}', n)) : texte('attenteArrivee');
  document.getElementById('boutonPasser').classList.toggle('cache', !!(a && a.passer));
}

// la fin de l'attente (podium, nouvelle course) : la caméra d'avant revient, le bandeau part
function finirAttente() {
  if (JEU.attente) CAMERA.forcer(JEU.attente.camera);
  JEU.attente = null;
  document.getElementById('attenteArrivee').classList.add('cache');
  document.getElementById('attenteTexte').textContent = texte('attenteArrivee');
  document.getElementById('boutonPasser').classList.remove('cache');
}

function passerAuPodium() {
  if (JEU.attente && JEU.ecran === 'course') JEU.attente.passer = true;
}

function voirResultats() {
  if (JEU.ecran !== 'podium') return;
  JEU.ecran = 'resultats';
  INTERFACE.montrer('resultats');
  INTERFACE.montrerBoutonResume(resumeDisponible());   // « ▶ Résumé » : seulement après une course à plusieurs enregistrée
}

// --- le résumé vidéo de la course (resume.js, étape 13) : depuis les résultats, la 3D rejoue les moments forts de
// l'enregistrement (enregistreur.js) avec la caméra télé ; les voitures viennent de l'enregistrement, pas de la physique (elle
// est arrêtée : JEU.ecran n'est pas « course ») ; un bandeau dit le moment ; Échap, un clic ou la fin du résumé ramènent aux résultats
function resumeDisponible() {
  return !!(JEU.plateau && JEU.enregistreur && JEU.enregistreur.enr.nbImages > 1);
}

// le nom d'une voiture dans le bandeau : le joueur (son nom à deux), le pilote du championnat, sinon son numéro
function etiquetteVoiture(k) {
  if (typeof k !== 'number') return '';
  const P = JEU.plateau.pilotes;
  if (JEU.deux && P[k] && P[k].joueur) return JEU.deux.reglages.joueurs[P[k].joueur - 1].nom;
  if (JEU.championnat && piloteDe(k)) return INTERFACE.nomPilote(piloteDe(k));
  if (JEU.contre && k === JEU.suivie) return texte('nomJoueur');
  return texte('numero').replace('{n}', numeroDe(k));
}

function montrerResume() {
  if (JEU.ecran !== 'resultats' || !resumeDisponible()) return;
  const r = RESUME.creer(JEU.enregistreur.enr);
  if (!r) return;
  JEU.resume = { r, camera: CAMERA.mode, roues: JEU.modeles.map(() => 0) };
  PODIUM3D.cacher();
  CAMERA.forcer('tele');
  JEU.ecran = 'resume';
  INTERFACE.montrer('resume');
  majResume(0);
}

function majResume(dt) {
  const z = JEU.resume, enr = JEU.enregistreur.enr;
  RESUME.avancer(z.r, dt);
  if (z.r.fini) { quitterResume(); return; }
  const pos = RESUME.positions(z.r, enr);
  pos.forEach((p, k) => {
    const m = JEU.modeles[k];
    if (!m) return;
    m.groupe.visible = true;
    z.roues[k] = (z.roues[k] + p.vitesse * dt / REGLAGES.RAYON_ROUE) % (2 * Math.PI);
    VOITURE3D.placer(m, p, { braquage: 0, rotationRoues: z.roues[k] });
    m.tete.visible = true;
  });
  const s = pos[RESUME.suivie(z.r, enr)] || pos[0];
  CAMERA.maj(dt, s, { u: s.vitesse });
  const b = RESUME.bandeau(RESUME.moment(z.r));
  INTERFACE.majResume(b ? texte(b.cle).replace('{qui}', etiquetteVoiture(b.valeurs.qui)).replace('{sur}', etiquetteVoiture(b.valeurs.sur)).replace('{duree}', typeof b.valeurs.duree === 'number' ? b.valeurs.duree.toFixed(1).replace('.', texte('virgule')) : '') : '');
}

function quitterResume() {
  if (JEU.ecran !== 'resume' || !JEU.resume) return;
  const z = JEU.resume;
  JEU.resume = null;
  CAMERA.forcer(z.camera);
  for (const m of JEU.modeles) m.groupe.visible = false;
  PODIUM3D.montrer(JEU.final.slice(0, 3).map(x => JEU.modeles[x.k]));   // le podium revient derrière les résultats
  JEU.tempsPodium = 0;
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
  // la découverte : une touche qui a servi, même un instant, éteint son aide (majAides)
  if (JEU.aides) { if (JEU.cibles.gaz) JEU.aides.gaz = true; if (JEU.cibles.direction) JEU.aides.direction = true; if (JEU.cibles.frein) JEU.aides.frein = true; }
  // le mode 2 joueurs : les commandes de chacun, de ses touches à lui (TOUCHES_DEUX, par e.code) ; l'autre n'y voit rien
  if (JEU.deux) for (const j of [1, 2]) JEU.deuxCommandes[j].cibles = DEUX_JOUEURS.cibles(enfoncees, j);
}

function brancherClavier() {
  window.addEventListener('keydown', e => {
    // le mode 2 joueurs : ni C (la caméra reste derrière), ni Espace, ni Entrée pour le podium ; chacun sa touche de remise en piste
    if (JEU.deux) { if (!e.repeat) for (const j of [1, 2]) if (DEUX_JOUEURS.remise(new Set([e.code]), j)) JEU.deuxCommandes[j].remettre = true; }
    else {
      if (e.code === 'KeyC' && !e.repeat) CAMERA.suivante();
      if (e.code === 'Space' && !e.repeat) JEU.remettre = true;
      if (e.code === 'Enter' && !e.repeat) passerAuPodium();
    }
    if (e.code === 'Escape' && !e.repeat && JEU.ecran === 'resume') { quitterResume(); return; }
    if (JEU.ecran === 'grille' && !e.repeat) { finirGrille(); }   // la grille vue d'en haut : une touche la passe   // le résumé vidéo : Échap ramène aux résultats
    if (e.code === 'Escape' && !e.repeat) pause(JEU.ecran === 'course');
    if (e.code === 'Escape' && !e.repeat && JEU.tournoi) pauseTournoi(enTourQualif());   // le tournoi : la pause d'un tour (reprendre, abandonner)
    if (JEU.ecran === 'une' && !e.repeat) passerUne();   // n'importe quelle touche passe la une du journal
    else if (JEU.ecran === 'album' && !e.repeat) {   // l'album : ← → feuillettent, Échap ferme
      if (e.code === 'ArrowLeft') feuilleterAlbum(-1);
      else if (e.code === 'ArrowRight') feuilleterAlbum(1);
      else if (e.code === 'Escape') quitterAlbum();
    }
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
// ← ou → pendant l'arrêt : le pneu suivant ou précédent (un appui = un cran) ; le choix du joueur remplace celui de l'équipe
function choisirPneusArret(v, direction) {
  const sens = direction > 0.5 ? 1 : direction < -0.5 ? -1 : 0;
  if (sens && sens !== v.pneusSens) {
    const T = METEO.TYPES, i = T.indexOf(v.pneusProchain || v.typePneus || 'slick');
    v.pneusProchain = T[(i + sens + T.length) % T.length]; v.choixPneus = true;
  }
  v.pneusSens = sens;
}

function conduireJoueur(p, pas) {
  // le mode 2 joueurs : chaque joueur (p.joueur = 1, 2) a ses commandes, lues de ses touches à lui ; sinon celles de la course seule
  const cmd = JEU.deux && p.joueur ? JEU.deuxCommandes[p.joueur] : JEU;
  // la météo (Codeur 1) : pendant son arrêt au stand (la voiture est tenue), ← → choisissent les pneus qu'on lui met (slick, inter, pluie)
  if (p.course.arretEnCours && cmd.cibles) choisirPneusArret(p.v, cmd.cibles.direction);
  if (cmd.remettre && courseAutorise(p.course)) remettreSurPiste(p.v, CIRCUIT);
  cmd.remettre = false;
  // après l'arrivée, sa voiture freine seule jusqu'à l'arrêt (les autres finissent leur course)
  // ?robot=1 : le robot d'essai conduit sa voiture (tests) ; il fait toujours un départ parfait, DEPART_ROBOT_REACTION après l'extinction
  let cibles = JEU.robot ? (courseAutorise(p.course) ? piloteRobot(p.v, CIRCUIT) : AUCUNE) : cmd.cibles;
  // le départ parfait (depart.js) : tant que la voiture n'est pas lancée, elle est tenue sur place ; la touche d'accélérateur
  // règle le régime de départ, et la pression qui suit l'extinction est le lancement (ou un faux départ : anticipation)
  const d = p.course.depart;
  if (d && d.lance === null) {
    if (JEU.robot) { if (d.extinction !== null && d.t - d.extinction >= REGLAGES.DEPART_ROBOT_REACTION) DEPART.lancer(d, 'parfait', REGLAGES.DEPART_ROBOT_REACTION); }
    else DEPART.commande(d, cmd.cibles.gaz > 0, p.course.compte);
    if (d.lance === null) cibles = AUCUNE;
    else if (!JEU.robot && !JEU.deux && d.resultat !== 'faux') {
      JEU.departRecord = SAUVEGARDE.proposerReaction(d.reaction);   // le record du temps de réaction (pas celui du robot, ni à deux)
      if (JEU.championnat && p === JEU.plateau.pilotes[JEU.ia]) CARRIERE.noterReaction(JEU.championnat, d.reaction);   // … et celui de la carrière (carriere.js, sauvegardé avec le Grand Prix)
    }
  }
  lisserCommandes(p.v, commandesPermises(p.course) ? cibles : p.course.etat === 'finie' ? FREIN_SEUL : AUCUNE, pas);
  pasPneusJoueur(p.v, pas);
}

function pasJoueur(pas) {
  if (JEU.ecran === 'pause') return;   // la pause arrête la physique
  JEU.pas++;
  if (JEU.tournoi) { if (enTourQualif()) pasTourQualif(pas); JEU.remettre = false; return; }   // le tournoi chrono : seule la voiture du tour roule
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
  if (!enCourse) { INTERFACE.majClassement(null); document.getElementById('minicarte').classList.add('cache'); return; }
  const P = JEU.plateau ? JEU.plateau.pilotes : [];
  const ordre = JEU.plateau ? classementCourse(JEU.plateau) : null;
  // ?championnat=1 : le coéquipier du joueur (la voiture k = le pilote k du championnat), et l'écart entre eux
  const kc = JEU.championnat && JEU.contre ? (CHAMPIONNAT.coequipierDe(JEU.championnat) || { id: null }).id : null;
  const duel = kc !== null && ordre ? ecartCoequipier(ordre, kc) : null;
  INTERFACE.majClassement(ordre ? ordre.map(x => ({
    numero: numeroDe(x.k), couleur: JEU.couleurs[x.k], ecart: x.ecart, tours: x.tours, penalites: x.penalites, moi: x.k === JEU.suivie || (!!JEU.deux && !!P[x.k].joueur), casque: casqueDe(x.k),
    arrive: P[x.k].arrivee !== null, coequipier: x.k === kc, ecartDuel: x.k === kc ? duel : null,
    stand: x.stand,   // dans la voie des stands (étape 7, Codeur 1)
  })) : null);
  const autres = [];
  P.forEach((p, k) => { if (k !== JEU.suivie && p.arrivee === null) autres.push({ x: p.v.x, z: p.v.z, couleur: JEU.couleurs[k] }); });
  if (!JEU.deux) RADAR.dessiner(CIRCUIT, JEU.joueur, autres);   // (pas de radar à deux : trop chargé en demi-écran)
  // la minicarte : le circuit entier, toutes les voitures, le joueur mis en valeur ; jamais à deux
  const mc = !JEU.deux;
  document.getElementById('minicarte').classList.toggle('cache', !mc);
  if (mc) {
    MINICARTE.preparer(CIRCUIT);
    const voitures = JEU.plateau ? P.map((p, k) => ({ x: p.v.x, z: p.v.z, couleur: JEU.couleurs[k] })) : [{ x: JEU.joueur.x, z: JEU.joueur.z, couleur: REGLAGES.COULEUR_JOUEUR }];
    MINICARTE.dessiner(voitures, JEU.plateau ? (JEU.contre ? JEU.suivie : null) : 0);
  }
}

// le mode 2 joueurs : l'affichage de chaque moitié (place, tour, vitesse, écart avec l'autre joueur), pendant la course et la pause
function majDeuxHud() {
  if (!JEU.deux || !JEU.plateau || !(JEU.ecran === 'course' || JEU.ecran === 'pause')) { INTERFACE.majDeux(null); return; }
  const e = JEU.plateau, ordre = classementCourse(e), [p1, p2] = DEUX_JOUEURS.joueurs(e), k1 = e.pilotes.indexOf(p1), k2 = e.pilotes.indexOf(p2);
  const ecart = ecartEntre(ordre, k1, k2);   // > 0 : le joueur 2 est derrière le joueur 1
  const info = (p, k, signe) => ({ nom: JEU.deux.reglages.joueurs[p.joueur - 1].nom, place: ordre.findIndex(x => x.k === k) + 1, tour: Math.min(p.course.tours.length + 1, p.course.nbTours), nbTours: p.course.nbTours, vitesse: p.v.u, ecart: ecart === null ? null : signe * ecart });
  INTERFACE.majDeux([info(p1, k1, -1), info(p2, k2, 1)]);   // chacun voit « − » quand il est devant l'autre
}

// l'écart en temps entre les voitures a et b dans le classement en direct (classementCourse) : la somme des écarts entre elles ;
// > 0 : b est derrière a ; null s'il n'est pas connu (pas encore passé la ligne, ou un tour d'écart)
function ecartEntre(ordre, a, b) {
  const ia = ordre.findIndex(x => x.k === a), ib = ordre.findIndex(x => x.k === b);
  if (ia < 0 || ib < 0) return null;
  let s = 0;
  for (let i = Math.min(ia, ib) + 1; i <= Math.max(ia, ib); i++) {
    if (ordre[i].ecart === null || ordre[i].tours > 0) return null;
    s += ordre[i].ecart;
  }
  return ia < ib ? s : -s;
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

// le volant en vue cockpit (voiture3d.js creerVolant) : visible seulement en vue cockpit, quand on conduit (course, pause, tour de
// qualification, survol), jamais à deux ; il tourne avec les roues avant, ses gants ont le casque du joueur, son écran le rapport et la vitesse
function volantVisible() {
  return CAMERA.mode === 'cockpit' && !JEU.deux && !JEU.attente && (JEU.ecran === 'course' || JEU.ecran === 'pause' || JEU.ecran === 'survol' || enTourQualif());
}

function majVolant() {
  const oui = volantVisible();
  if (!JEU.volant) { if (!oui) return; JEU.volant = VOITURE3D.creerVolant(casqueDe(indiceJoueur())); SCENE3D.accrocher(JEU.volant.groupe); }
  JEU.volant.groupe.visible = oui;
  if (!oui) return;
  const v = JEU.joueur, p = VOITURE3D.poseVolant(SCENE3D.camera.fov, v.braquage);
  JEU.volant.groupe.position.set(0, p.y, p.z);
  JEU.volant.volant.rotation.z = p.angle;
  JEU.volant.majEcran(rapportPourVitesse(v.u), Math.round(Math.abs(v.u) * 3.6));
}

// ?pneus=1 : l'état des pneus du joueur (pneus.js), pendant qu'il roule : l'usure en jauge et ce que l'adhérence a perdu
function majPneusHud() {
  const v = JEU.joueur, oui = !!(v && v.pneus) && (JEU.ecran === 'course' || JEU.ecran === 'pause' || enTourQualif()) && !JEU.deux;
  INTERFACE.majPneus(oui ? { reste: 1 - v.pneus.usure, perte: 1 - (v.adherence === undefined ? 1 : v.adherence) } : null);
}

// les messages de course (messages.js) : les faits du moteur (meilleur tour, pénalités, stands), lus seulement ; un à la fois
function majMessages() {
  const e = JEU.plateau, oui = !!e && (JEU.ecran === 'course' || JEU.ecran === 'pause') && !JEU.deux;
  if (!oui) { INTERFACE.majMessage(null); return; }
  if (!JEU.messages || JEU.messages.plateau !== e) JEU.messages = { plateau: e, m: MESSAGES.creer() };
  const m = JEU.messages.m;
  MESSAGES.observer(m, e.pilotes.map((p, k) => ({ k, meilleurTour: p.course.meilleurTour, penalites: p.course.penalites, auxStands: !!p.course.arretEnCours })));
  if (typeof METEO3D !== 'undefined') MESSAGES.observerMeteo(m, METEO3D.etat(e));   // « La pluie arrive », « La piste sèche »
  const msg = MESSAGES.afficher(m, e.temps);
  INTERFACE.majMessage(msg ? texte('msg_' + msg.type).replace('{qui}', etiquetteVoiture(msg.k)).replace('{temps}', msg.temps === undefined ? '' : INTERFACE.formatTemps(msg.temps)).replace('{s}', msg.s === undefined ? '' : String(msg.s).replace('.', texte('virgule'))) : null);
}

// l'affichage provisoire : la vitesse et « hors piste »
function majTableau() {
  const v = JEU.joueur;
  document.getElementById('vitesse').textContent = Math.round(Math.abs(v.u) * 3.6);
  document.getElementById('rapport').textContent = rapportPourVitesse(v.u);
  const roule = JEU.ecran === 'course' || JEU.ecran === 'survol' || enTourQualif();
  // sur le podium et les résultats, ni vitesse ni aide des touches
  const apres = ['podium', 'resultats', 'championnat', 'une', 'garage', 'titre', 'amis', 'bravo', 'saison', 'duelSaison', 'contrats', 'retraite', 'sponsors', 'fiche', 'interview', 'ceremonie', 'album', 'temple', 'heritier', 'calendrier', 'deuxReglages', 'tournoiInscription', 'tournoiAToi', 'tournoiPause', 'tournoiManche', 'tournoiFin', 'aileron', 'arbre'].includes(JEU.ecran);
  document.getElementById('tableau').classList.toggle('cache', apres || volantVisible());   // (en vue cockpit, rapport et vitesse sont sur le volant)
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
    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') return;   // (la discussion : on tape des espaces et on déplace le curseur)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
  });
  // la langue de la page et son titre viennent de textes.js (le <title> de index.html est le même texte, pour le chargement)
  document.documentElement.lang = LANGUE;
  document.title = texte('nomDuJeu');
  document.getElementById('unite').textContent = texte('kmh');
  document.getElementById('horsPiste').textContent = texte('horsPiste');
  document.getElementById('aide').textContent = texte('aideConduite');
  RADAR.init(document.getElementById('radar'));
  MINICARTE.init(document.getElementById('minicarte'));   // la minicarte (son tracé est préparé une fois, quand le circuit est construit)

  if (!SCENE3D.init(document.getElementById('scene3d'), CIRCUIT, { championnat: championnatDecor(), circuit: NOM_CIRCUIT })) return;   // (le public du décor : decor-public.js)
  CAMERA.init(SCENE3D.camera, CIRCUIT, PARAMETRES.get('camera'));
  if (DEUX_EN_COURS) { document.body.classList.add('deux'); if (REGLAGES.DEUX_PARTAGE !== 'haut') { document.body.classList.add('cote'); CAMERA.reglerChampBase(REGLAGES.DEUX_FOV_COTE); } SCENE3D.partager(true); }   // (côte à côte : le joueur 1 à gauche, un champ de vision plus ouvert)   // le mode 2 joueurs : l'écran partagé haut / bas (scene3d.js), le CSS du mode
  JEU.joueur = creerVoiture(CIRCUIT, 0);
  JEU.robot = PARAMETRES.get('robot') === '1';
  // ?championnat=1 : le joueur contre les 19 pilotes du championnat, comme ?ia=19&joueur=1
  JEU.championnat = CHAMPIONNAT_EN_COURS;
  if (JEU.championnat) CASQUE.completer(JEU.championnat);   // (un championnat neuf de ?championnat=1 : ses casques)
  // le premier lancement : le monde du championnat est créé et sauvegardé maintenant, et DECOUVERTE_IA de ses pilotes courent la découverte
  JEU.decouverte = DECOUVERTE_EN_COURS;
  if (JEU.decouverte) {
    JEU.monde = SAUVEGARDE.championnat() || CHAMPIONNAT.creer(Number(PARAMETRES.get('graine')) || 1);
    CASQUE.completer(JEU.monde);   // les casques des 19 rivaux, tirés une fois pour toutes
    SAUVEGARDE.ecrireChampionnat(JEU.monde);
    JEU.indices = DECOUVERTE.pilotes(JEU.monde).map(p => p.id);
  }
  // le mode 2 joueurs : ses réglages de la page ; ses IA sont des rivaux du monde sauvegardé (leur caractère), s'il existe
  if (DEUX_EN_COURS) {
    JEU.deux = { nbIA: DEUX_JOUEURS.nbIAValide(Number(PARAMETRES.get('ia'))), nbTours: DEUX_JOUEURS.nbToursValide(Number(PARAMETRES.get('tours'))), reglages: DEUX_SAUVE, revanche: 0, rivaliteNotee: false, rivalite: null };
    JEU.deux.reglages.joueurs.forEach((j, i) => { if (!j.nom) j.nom = texte(i ? 'joueur2' : 'joueur1'); });   // (sans réglages sauvegardés : « Joueur 1 », « Joueur 2 »)
    JEU.monde = SAUVEGARDE.championnat();
    if (JEU.monde) JEU.indices = DECOUVERTE.pilotes(JEU.monde).slice(0, JEU.deux.nbIA).map(p => p.id);
  }
  if (TOURNOI_SAUVE) { JEU.tournoi = TOURNOI_SAUVE; JEU.tournoiFantomes = {}; JEU.tournoiPodium = []; }   // (les fantômes du tournoi : en mémoire, une manche)
  JEU.contre = (PARAMETRES.get('joueur') === '1' && Number(PARAMETRES.get('ia')) >= 1) || !!JEU.championnat || JEU.decouverte || !!JEU.deux;
  JEU.ia = JEU.deux ? JEU.deux.nbIA : JEU.championnat ? JEU.championnat.pilotes.length - 1 : JEU.decouverte ? JEU.indices.length : Math.max(0, Math.min(REGLAGES.IA_PAGE_MAX - (JEU.contre ? 1 : 0), Math.floor(Number(PARAMETRES.get('ia'))) || 0));
  // la carte des IA : lue du cache de la sauvegarde si elle y est et si sa clé est encore valable (cache-carte.js : les mêmes
  // nombres au bit près, les feux n'attendent plus), sinon calculée en fond puis mise en cache
  const carteFinie = t => {
    JEU.trajectoire = t;
    JEU.carte = carteDepuis(CIRCUIT, t);
    if (JEU.plateau) {
      donnerCarte(JEU.plateau, JEU.carte); appliquerCaracteres();
      placerDecouverte();   // la découverte : le joueur au milieu de la grille
      if (JEU.deux) DEUX_JOUEURS.placerGrille(JEU.plateau);   // le mode 2 joueurs : la grille tirée au sort
      if (JEU.qualif && JEU.qualif.etat === 'attente') finirQualif();   // le joueur a fini son tour avant la carte
    } else JEU.pilote = creerPilote(JEU.carte);
  };
  if (JEU.ia || JEU.deux) {   // (à deux sans IA aussi : la course attend la carte, comme les autres)
    const enCache = CACHE_CARTE.decoder(SAUVEGARDE.carte(NOM_CIRCUIT), NOM_CIRCUIT, CIRCUITS[NOM_CIRCUIT], CIRCUIT);
    if (enCache) { JEU.carteDuCache = true; carteFinie(enCache); }
    else JEU.calculTrajectoire = calculerEnFond(etapesTrajectoire(CIRCUIT), t => { SAUVEGARDE.ecrireCarte(NOM_CIRCUIT, CACHE_CARTE.encoder(NOM_CIRCUIT, CIRCUITS[NOM_CIRCUIT], t)); carteFinie(t); });
  }
  // ?ia=N : un modèle par IA, chacune sa couleur (contre le joueur, aucune n'a la sienne), puis celui du joueur ;
  // sinon, seulement la voiture du joueur
  const couleurs = REGLAGES.COULEURS_IA;
  if (JEU.ia >= 2 || JEU.contre) {
    const choix = JEU.contre ? couleurs.filter(x => x !== REGLAGES.COULEUR_JOUEUR) : couleurs;
    // ?championnat=1 : chaque voiture a la couleur de son écurie (le joueur en dernier, comme dans la course)
    if (JEU.championnat) for (const p of JEU.championnat.pilotes) JEU.couleurs.push(JEU.championnat.ecuries[p.ecurie].couleur);
    else if (JEU.decouverte) {   // les pilotes du monde aux couleurs de leur écurie, puis le joueur à celle de la sienne
      for (const p of DECOUVERTE.pilotes(JEU.monde)) JEU.couleurs.push(p.couleur);
      JEU.couleurs.push(JEU.monde.ecuries[REGLAGES.ECURIE_JOUEUR].couleur);
    } else if (JEU.deux) {   // les IA, puis le joueur 1 🔵 et le joueur 2 🔴 (DEUX_COULEURS)
      const choisies = JEU.deux.reglages.joueurs.map(j => j.couleur), libres = couleurs.filter(x => !choisies.includes(x));   // (les couleurs choisies à l'écran avant la course)
      for (let k = 0; k < JEU.ia; k++) JEU.couleurs.push(libres[k % libres.length]);
      JEU.couleurs.push(...choisies);
    } else {
      for (let k = 0; k < JEU.ia; k++) JEU.couleurs.push(choix[k % choix.length]);
      if (JEU.contre) JEU.couleurs.push(REGLAGES.COULEUR_JOUEUR);
    }
    VOITURE3D.preparerCasques(JEU.couleurs.map((c, k) => casqueDe(k)));   // l'atlas des casques (casque.js) : une case par voiture
    JEU.couleurs.forEach((couleur, k) => JEU.modeles.push(VOITURE3D.creer(couleur, JEU.contre && (k === JEU.ia || (JEU.deux && k === JEU.ia + 1)), undefined, k)));   // le joueur (les deux, à deux) : détaillée
    for (const m of JEU.modeles) SCENE3D.ajouter(m.groupe);
  }
  if (JEU.tournoi) {   // le tournoi : les casques des joueurs dans l'atlas (une voiture chacun pour le podium), puis la case de la voiture du tour
    const cs = JEU.tournoi.joueurs.map(j => j.casque);
    VOITURE3D.preparerCasques(cs.concat([cs[0]]));
    cs.forEach((c, j) => { const m = VOITURE3D.creer(c.couleurs[0], false, undefined, j); m.groupe.visible = false; SCENE3D.ajouter(m.groupe); JEU.tournoiPodium.push(m); });
    JEU.modele = VOITURE3D.creer(REGLAGES.COULEUR_JOUEUR, true, undefined, cs.length);
    SCENE3D.ajouter(JEU.modele.groupe);
  } else if (!JEU.modeles.length) {
    VOITURE3D.preparerCasques([CASQUE.neutre()]);
    JEU.modele = VOITURE3D.creer(REGLAGES.COULEUR_JOUEUR, true, undefined, 0);
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
    INTERFACE.preparerCeremonie(suiteCeremonie);
    INTERFACE.preparerAlbum(montrerAlbum, feuilleterAlbum, saisonAlbum, quitterAlbum);
    INTERFACE.preparerTemple(montrerTemple, quitterTemple);
    INTERFACE.preparerAileron(montrerAileron, changerAileron, quitterAileron);
    INTERFACE.preparerArbre(montrerArbre, quitterArbre);
    INTERFACE.preparerCalendrier(montrerCalendrier, quitterCalendrier);
    INTERFACE.preparerReleve(montrerHeritier, nouvelleDynastie, validerHeritier);
    INTERFACE.preparerGarage(acheterAmelioration, quitterGarage);
    INTERFACE.preparerPneusGarage(choisirPneusDepart);   // les pneus du départ (la météo, Codeur 1)
    INTERFACE.preparerSaison(suiteClassementSaison, suiteDuelSaison, signerContrat, prendreRetraite);
    INTERFACE.preparerSponsors(montrerSponsors, choisirSponsor, quitterSponsors);
    INTERFACE.preparerFiche(montrerFiche, quitterFiche);
    // les discussions (Codeur 3) : « Discuter » sur la fiche d'un rival, « 💬 Coéquipier » au paddock
    INTERFACE.preparerDiscussion(envoyerDiscussion, composerDiscussion, quitterDiscussion);
    INTERFACE.preparerCourrier(montrerCourrier, repondreCourrier, quitterCourrier);
    document.getElementById('boutonFicheDiscuter').addEventListener('click', () => { if (JEU.ecran === 'fiche') montrerDiscussion(JEU.ficheK, 'fiche'); });
    document.getElementById('boutonParlerCoequipier').addEventListener('click', () => { const c = CHAMPIONNAT.coequipierDe(JEU.championnat); if (JEU.ecran === 'championnat' && c) montrerDiscussion(c.id, 'championnat'); });
    INTERFACE.preparerInterview(repondreInterview, finirInterview);
  } else if (JEU.decouverte) INTERFACE.preparerResultats(montrerBravo, () => {}, () => {});   // la découverte : après le podium, « Bravo ! »
  else if (JEU.tournoi) INTERFACE.preparerResultats(montrerFinTournoi, () => {}, () => {});   // le tournoi : du podium au classement final
  else if (JEU.deux) {   // le mode 2 joueurs : après les résultats, « Revanche » et « Menu »
    INTERFACE.preparerResultats(voirResultats, revancheDeux, menuDeux);
    document.getElementById('boutonRejouerResultats').textContent = texte('revanche');
    document.getElementById('boutonChangerResultats').textContent = texte('menuAmis');
  } else INTERFACE.preparerResultats(voirResultats, () => lancerCourse(JEU.course.nbTours), allerAuChoix);
  INTERFACE.preparerResume(montrerResume, quitterResume);
  INTERFACE.preparerGrille(finirGrille);
  INTERFACE.preparerAmis(ouvrirDeux, ouvrirTournoi, montrerAmis);
  INTERFACE.preparerInscription(partirTournoi, montrerAmis);
  INTERFACE.preparerPauseTournoi(() => pauseTournoi(false), abandonnerTournoi);
  INTERFACE.preparerMancheTournoi(suiteTournoi);
  INTERFACE.preparerFinTournoi(rejouerTournoi, nouveauxJoueursTournoi);
  INTERFACE.preparerDeux(partirDeux, montrerAmis);
  INTERFACE.preparerTitre(jouerDecouverte, montrerAmis, retourTitre, commencerCarriere);
  INTERFACE.preparerPilote(validerPilote);
  INTERFACE.preparerCasque(changerCasque);
  document.getElementById('boutonMonCasque').textContent = texte('monCasque');
  document.getElementById('boutonMonCasque').addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('boutonMonCasque').addEventListener('click', monCasque);
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
  else if (JEU.decouverte) montrerTitre();   // le premier lancement
  else if (JEU.championnat && PAGE_NUE && PILOTE.manque(JEU.championnat)) montrerPilote();   // le vrai jeu, une sauvegarde sans pilote : la création, une fois (pas les pages ?championnat=1 des tests)
  else if (JEU.championnat && (JEU.championnat.retraite || SAISONS.finie(JEU.championnat))) montrerFinSaison();   // la saison est finie (la page a été rechargée pendant les contrats), ou la carrière
  else if (JEU.championnat) montrerChampionnat(null);
  else if (EST_PAGE && PARAMETRES.get('tournoi') === '1' && !JEU.tournoi) location.replace(adresseAvec({ menu: 'tournoi' }));   // pas de tournoi en cours : l'inscription
  else if (JEU.tournoi) { if (TOURNOI.fini(JEU.tournoi)) montrerPodiumTournoi(); else montrerAToi(); }   // le tournoi : « À toi, … ! » (ou le podium s'il est fini)
  else if (JEU.deux) lancerCourse(JEU.deux.nbTours);   // le mode 2 joueurs : la course tout de suite (son menu et ses réglages : ordre 3)
  else if (demandee !== null && !isNaN(Number(demandee))) lancerCourse(Number(demandee));
  else allerAuChoix();
  if (PARAMETRES.get('menu') === 'amis') montrerAmis();
  if (PARAMETRES.get('menu') === 'tournoi') { montrerAmis(); ouvrirTournoi(); }   // « Nouveaux joueurs » : l'inscription du tournoi   // le retour du mode 2 joueurs : le menu « Entre amis » (sur le titre ou le paddock)
  brancherClavier();
  const boutonSon = document.getElementById('boutonSon');
  boutonSon.title = texte('son');
  const majBoutonSon = () => { boutonSon.textContent = SON.muet ? '🔇' : '🔊'; };
  // pas de focus sur le bouton : Espace ne doit pas le cliquer
  boutonSon.addEventListener('mousedown', e => e.preventDefault());
  boutonSon.addEventListener('click', () => { SON.basculer(); majBoutonSon(); });
  window.addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat && !(e.target && e.target.tagName === 'INPUT' && e.target.type === 'text')) { SON.basculer(); majBoutonSon(); } });
  if (PARAMETRES.get('reglages') === '1') PANNEAU_REGLAGES.creer(cle => { if (cle === 'HALO_EPAISSEUR') VOITURE3D.majHalo(JEU.modele); });

  BOUCLE.surPhysique(pasJoueur);
  BOUCLE.surAffichage((alpha, dt) => {
    JEU.alpha = alpha;
    JEU.dtImage = dt;
    if (JEU.ecran === 'resume') { majResume(dt); if (JEU.sdkPret) SDK.jeuArrete(); if (JEU.ecran === 'resume') { SCENE3D.dessiner(); return; } }   // le résumé vidéo : la 3D rejoue l'enregistrement (Poki : gameplayStop)
    majAToi(dt);   // le tournoi : le compte à rebours de « À toi, … ! »   // (« passer » en accéléré : le nombre de pas de l'image suit sa durée)
    const apres = JEU.ecran === 'podium' || JEU.ecran === 'resultats' || JEU.ecran === 'bravo' || JEU.ecran === 'tournoiFin' || JEU.ecran === 'ceremonie';   // le podium (et la cérémonie du champion) : les voitures n'y bougent plus
    // ?ia=N : chaque IA à sa place ; une IA arrivée quitte la piste (elle n'est plus dessinée)
    if (JEU.plateau && !apres) JEU.plateau.pilotes.forEach((p, k) => {
      const m = JEU.modeles[k];
      m.groupe.visible = p.arrivee === null || k === JEU.suivie || (JEU.deux && !!p.joueur);   // (à deux, les deux joueurs restent visibles après l'arrivée)
      if (m !== JEU.modele) { VOITURE3D.placer(m, etatAffiche(p.v, alpha), p.v); m.tete.visible = true; }
    });
    const etat = etatAffiche(JEU.joueur, alpha);
    if (apres) {
      JEU.tempsPodium += dt;
      PODIUM3D.camera(SCENE3D.camera, JEU.tempsPodium);
      PODIUM3D.majConfettis(dt);   // la cérémonie du champion : les confettis tombent (rien sinon)
    } else {
      VOITURE3D.placer(JEU.modele, etat, JEU.joueur);
      JEU.modele.tete.visible = CAMERA.mode !== 'cockpit';   // en vue cockpit, l'œil est dans le casque
      // après l'arrivée du joueur, la caméra télé suit une voiture encore en course
      const tele = JEU.attente && JEU.attente.tele !== null ? JEU.plateau.pilotes[JEU.attente.tele].v : null;
      CAMERA.maj(dt, tele ? etatAffiche(tele, alpha) : etat, tele || JEU.joueur);
      // le mode 2 joueurs : la seconde caméra, derrière la voiture du joueur 2 (la moitié du bas)
      if (JEU.deux) { const j2 = DEUX_JOUEURS.joueurs(JEU.plateau)[1]; CAMERA.majSeconde(dt, SCENE3D.camera2, etatAffiche(j2.v, alpha), j2.v); }
    }
    if (JEU.deux && SCENE3D.partage === apres) SCENE3D.partager(!apres);   // le podium : une seule vue
    majPneusHud();   // ?pneus=1 : l'usure des pneus du joueur
    majMessages();   // les messages de course, un à la fois
    majGrille(dt);   // avant les feux : la grille vue d'en haut (après la caméra de course, qu'elle remplace)
    majVolant();   // le volant en vue cockpit (après la caméra : il suit son champ de vision)
    majTableau();
    INTERFACE.majCourse(JEU.course, enTourQualif() ? 'course' : JEU.ecran);   // le chrono du tour de qualification
    majFantome(dt);
    INTERFACE.majDepart(JEU.course, JEU.ecran, JEU.departRecord);
    INTERFACE.majDepart(JEU.deux ? DEUX_JOUEURS.joueurs(JEU.plateau)[1].course : null, JEU.ecran, false, '2');   // la jauge et le résultat du joueur 2, dans sa moitié
    majDeuxHud();
    INTERFACE.majEcartFantome(enTourQualif() && JEU.fantome && JEU.fantome.rejeu && JEU.qualif.q.lance ? JEU.fantome.ecart : null);
    INTERFACE.majPreparation(JEU.ecran === 'course' && JEU.ia > 0 && !JEU.carte);
    majAides();
    if (JEU.ecran === 'pilote') VOITURE3D.tournerApercu(dt);   // l'éditeur du casque
    // la mesure du premier lancement : du clic sur « Jouer » à l'extinction des feux (ms)
    if (JEU.depuisClic !== null && JEU.clicAuxFeux === null && JEU.course && JEU.course.feux && JEU.course.etat !== 'compte') JEU.clicAuxFeux = performance.now() - JEU.depuisClic;
    // … et jusqu'au premier feu (la fin de l'attente de la carte des IA)
    if (JEU.depuisClic !== null && JEU.clicAuPremierFeu === null && JEU.course && JEU.course.feux && (JEU.course.etat !== 'compte' || JEU.course.compte < JEU.course.feux.total)) JEU.clicAuPremierFeu = performance.now() - JEU.depuisClic;
    majClassementRadar();
    signauxCourse(JEU.course);
    // Poki (sdk.js) : la voiture roule (course, tour de qualification) = gameplayStart, tout le reste = gameplayStop ;
    // sdk.js n'envoie jamais deux fois le même de suite
    // (avec les feux, la voiture ne roule qu'à leur extinction : gameplayStart à ce moment-là)
    const feuxAllumesEncore = !!(JEU.course && JEU.course.feux && JEU.course.etat === 'compte');
    if (JEU.sdkPret) SDK[(JEU.ecran === 'course' && !feuxAllumesEncore) || enTourQualif() ? 'jeuCommence' : 'jeuArrete']();
    // la voiture suivie a fini : seule, l'écran de fin ; contre les IA, on attend les autres (vue télé) ; entre IA, le
    // podium dès que les trois premiers sont connus
    if (JEU.ecran === 'course' && JEU.course && JEU.course.etat === 'finie') {
      if (!JEU.plateau) finDeCourse();
      else if (JEU.contre) attendreLesAutres();
      else if (podiumConnu(JEU.plateau)) montrerPodium();
    }
    document.getElementById('attenteArrivee').classList.toggle('cache', !(JEU.attente && JEU.ecran === 'course'));
    SON.maj(JEU.joueur);
    // la météo dessinée (meteo3d.js, l'état de meteo.js) : la pluie, les gerbes, la piste mouillée, le ciel couvert ; rien au sec
    if (typeof METEO3D !== 'undefined') METEO3D.maj(METEO3D.etat(JEU.plateau || JEU.course), SCENE3D.camera, JEU.plateau ? JEU.plateau.pilotes.map(p => p.v) : [JEU.joueur], dt, CAMERA.mode === 'cockpit' && JEU.ecran === 'course', CIRCUIT, JEU.carte ? JEU.carte.trajectoire : null);
    SCENE3D.dessiner();
  });
  if (PARAMETRES.get('debug') === '1') brancherDebug();
  // Poki (sdk.js, le seul passage vers le SDK) : init, puis « chargement fini » une seule fois ; hors Poki, le rappel vient tout de suite
  SDK.init(() => { JEU.sdkPret = true; SDK.chargementFini(); });
  BOUCLE.demarrer();
}

// la page de test charge ce fichier sans scène : elle ne démarre pas le jeu
if (document.getElementById('scene3d')) demarrerJeu();
