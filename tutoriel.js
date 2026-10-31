// Le tutoriel guidé (CLAUDE.md « Le tutoriel guidé », étape 11d, Codeur 4), en calcul pur, sans écran : les 8 leçons (la 8e, la voiture vivante : tour 37j), leur mise en
// place (l'adresse de la page : les mêmes modes que le jeu, la même physique et les mêmes IA) et leur réussite, mesurée sur l'état du
// moteur sans rien y changer (sauf la mise en place : l'IA lente de la leçon du dépassement). Proposé, jamais imposé : aucun écran de
// plus au premier lancement. Les leçons réussies sont gardées à la racine de la sauvegarde (sauvegarde.js : tutoriel, reussirLecon).
// - LECONS : { id, adresse } ; situation(jeu, circuit, ordre) : ce que la réussite lit ; creerSuivi(id, circuit), pas(suivi, s, dt) :
//   'encours' | 'reussie' | 'ratee' (suivi.raison dit pourquoi) ; zoneFreinage(circuit) : le virage de la leçon 2, entre ses plots.
// Tous les textes dans textes.js (tuto_*), l'affichage dans interface.js (TUTORIEL_ECRAN).
const TUTORIEL = (function () {
  const R = REGLAGES;
  const LECONS = [
    { id: 'conduite', adresse: 'course=1' },                                                  // seul, un tour : accélérer, tourner, freiner
    { id: 'freinage', adresse: 'course=0' },                                                  // essai libre : le virage entre les plots
    { id: 'depart', adresse: 'course=1&ia=1&joueur=1&niveau=debutant' },                      // les feux, une IA à côté
    { id: 'depassement', adresse: 'course=3&ia=1&joueur=1&niveau=debutant' },                 // une IA lente devant
    { id: 'stand', adresse: 'course=2' },                                                     // seul : l'arrêt, sans excès de vitesse
    { id: 'pluie', adresse: 'course=3&ia=1&joueur=1&niveau=debutant&meteo=averse' },    // l'averse arrive : changer de pneus
    { id: 'visite', adresse: 'championnat=1' },                                               // le paddock, le garage, l'aileron
    { id: 'vivante', adresse: 'course=0&circuit=technique&niveau=expert' },                  // (tour 37j) la voiture vivante, à l'épingle du technique
  ];
  const PAR_ID = {};
  LECONS.forEach((l, i) => { l.numero = i + 1; PAR_ID[l.id] = l; });

  // le virage de la leçon du freinage : le plus serré du circuit ; la zone chronométrée va de TUTO_ZONE_AVANT m avant lui (les plots
  // du point de freinage) à TUTO_ZONE_APRES m après sa sortie ; { debut, fin, virage: [debut, fin] } en m le long de la piste
  function zoneFreinage(c) {
    let pire = null, k = 0;
    for (const m of c.morceaux || []) {
      if (m.type === 'droite') continue;
      let x = 0;
      for (let i = 0; i < c.nb; i++) if (c.s[i] >= m.debut && c.s[i] <= m.fin) x = Math.max(x, Math.abs(c.courbure[i]));
      if (x > k) { k = x; pire = m; }
    }
    if (!pire) return null;
    const L = c.longueur, mod = s => ((s % L) + L) % L;
    return { debut: mod(pire.debut - R.TUTO_ZONE_AVANT), fin: mod(pire.fin + R.TUTO_ZONE_APRES), virage: [pire.debut, pire.fin] };
  }

  // la distance parcourue de a à b le long de la piste (0 à la longueur), dans le sens de la course
  const avance = (a, b, L) => ((b - a) % L + L) % L;

  // ce que la réussite lit, tiré de l'état du jeu sans rien y changer ; ordre : le classement de la course (classementCourse), ou null
  function situation(J, circuit, ordre) {
    const c = J.course, v = J.joueur, d = c && c.depart;
    return {
      ecran: J.ecran, etat: c ? c.etat : null, tours: c && c.tours ? c.tours.length : 0, temps: c ? c.temps || 0 : 0,
      herbe: !!(v && v.surHerbe), s: v && v.piste ? v.piste.s : null, vitesse: v ? Math.abs(v.u) : 0,
      depart: d ? { lance: d.lance, resultat: d.resultat || null, extinction: d.extinction, t: d.t } : null,
      arrets: c && c.arrets ? c.arrets.length : 0, arretEnCours: !!(c && c.arretEnCours), penalitesStands: v ? v.penalitesStands || 0 : 0,
      pneus: v ? v.typePneus || 'slick' : 'slick', eau: J.plateau && J.plateau.meteo ? J.plateau.meteo.eau : 0,
      devant: !!(ordre && J.plateau && ordre.length > 1 && ordre[0].k === J.suivie),
      longueur: circuit ? circuit.longueur : 0,
      // (tour 37j) l'arrière qui glisse (0 à 1, sensations.js glisseArriere : la voiture vivante), lu sans rien changer
      arriere: v && typeof SENSATIONS !== 'undefined' && SENSATIONS.glisseArriere ? SENSATIONS.glisseArriere(v).arriere : 0,
    };
  }

  function creerSuivi(id, circuit) {
    return { id, t: 0, resultat: 'encours', raison: null, zone: (id === 'freinage' || id === 'vivante') && circuit ? zoneFreinage(circuit) : null,
      dans: null, essais: 0, meilleur: null, dernier: null, devantDepuis: 0, visites: {}, sAvant: null, pluieVue: false };
  }

  const fini = (su, resultat, raison) => { su.resultat = resultat; su.raison = raison || null; return resultat; };

  // une image : 'encours', 'reussie' ou 'ratee' (une fois fini, ça ne change plus)
  function pas(su, s, dt) {
    if (su.resultat !== 'encours') return su.resultat;
    su.t += dt;
    const enCourse = s.etat === 'course';
    switch (su.id) {
      case 'conduite':
        if (enCourse && s.herbe) return fini(su, 'ratee', 'sortie');
        if (s.etat === 'finie') return fini(su, 'reussie');
        break;
      case 'freinage': {
        const z = su.zone;
        if (!z || s.s === null || !enCourse) break;
        const L = s.longueur, longueurZone = avance(z.debut, z.fin, L), ici = avance(z.debut, s.s, L);
        const dedans = ici < longueurZone;
        if (dedans && su.dans === null && su.sAvant !== null && avance(z.debut, su.sAvant, L) > longueurZone) su.dans = { t: su.t, herbe: false };   // on passe les plots du freinage
        if (su.dans && s.herbe) su.dans.herbe = true;
        if (su.dans && !dedans) {   // la sortie de la zone : un essai
          const temps = su.t - su.dans.t, propre = !su.dans.herbe;
          su.essais++; su.dernier = { temps, propre }; su.dans = null;
          if (propre && (su.meilleur === null || temps < su.meilleur)) su.meilleur = temps;
          if (propre && temps <= R.TUTO_ZONE_OBJECTIF) { su.sAvant = s.s; return fini(su, 'reussie'); }
          if (su.essais >= R.TUTO_ZONE_ESSAIS) { su.sAvant = s.s; return fini(su, 'ratee', 'essais'); }
        }
        su.sAvant = s.s;
        break;
      }
      case 'vivante': {
        // (tour 37j) la voiture vivante, à l'épingle (la même zone que le freinage, sur le circuit technique) : freiner droit, tourner,
        // puis remettre les gaz doucement ; un passage est réussi sans sortir et sans que l'arrière glisse au-delà de TUTO_VIVANTE_ARRIERE
        const z = su.zone;
        if (!z || s.s === null || !enCourse) break;
        const L = s.longueur, longueurZone = avance(z.debut, z.fin, L), ici = avance(z.debut, s.s, L);
        const dedans = ici < longueurZone;
        if (dedans && su.dans === null && su.sAvant !== null && avance(z.debut, su.sAvant, L) > longueurZone) su.dans = { t: su.t, herbe: false, arriere: 0 };
        if (su.dans) { if (s.herbe) su.dans.herbe = true; su.dans.arriere = Math.max(su.dans.arriere, s.arriere || 0); }
        if (su.dans && !dedans) {
          const glisse = su.dans.arriere >= R.TUTO_VIVANTE_ARRIERE, propre = !su.dans.herbe && !glisse;
          su.essais++; su.dernier = { arriere: su.dans.arriere, herbe: su.dans.herbe }; su.dans = null; su.sAvant = s.s;
          if (propre) return fini(su, 'reussie');
          if (su.essais >= R.TUTO_ZONE_ESSAIS) return fini(su, 'ratee', glisse ? 'glisse' : 'sortie');
        }
        su.sAvant = s.s;
        break;
      }
      case 'depart': {
        const d = s.depart;
        if (!d) break;
        if (d.lance !== null && d.lance !== undefined && d.resultat) return d.resultat === 'parfait' || d.resultat === 'bon' ? fini(su, 'reussie', d.resultat) : fini(su, 'ratee', d.resultat);
        if (d.extinction !== null && d.extinction !== undefined && d.t - d.extinction > R.TUTO_DEPART_ATTENTE) return fini(su, 'ratee', 'attente');
        break;
      }
      case 'depassement':
        if (enCourse && s.devant) { su.devantDepuis += dt; if (su.devantDepuis >= R.TUTO_DEVANT_DUREE) return fini(su, 'reussie'); }
        else su.devantDepuis = 0;
        if (s.etat === 'finie') return fini(su, 'ratee', 'pasDevant');
        break;
      case 'stand':
        if (s.penalitesStands > 0) return fini(su, 'ratee', 'vitesse');
        if (s.arrets >= 1 && !s.arretEnCours) return fini(su, 'reussie');
        if (s.etat === 'finie') return fini(su, 'ratee', 'pasArret');
        break;
      case 'pluie':
        if (s.eau >= R.TUTO_PLUIE_EAU) su.pluieVue = true;
        if (s.penalitesStands > 0) return fini(su, 'ratee', 'vitesse');
        if (su.pluieVue && s.arrets >= 1 && !s.arretEnCours) return s.pneus !== 'slick' ? fini(su, 'reussie') : fini(su, 'ratee', 'pneus');
        if (s.etat === 'finie') return fini(su, 'ratee', 'pasArret');
        break;
      case 'visite':
        if (s.ecran === 'garage' || s.ecran === 'aileron') su.visites[s.ecran] = true;
        if (su.visites.garage && su.visites.aileron && s.ecran === 'championnat') return fini(su, 'reussie');
        return 'encours';   // une visite n'a pas de temps limite
    }
    if (su.t > R.TUTO_TEMPS_MAX && !((su.id === 'freinage' || su.id === 'vivante') && su.essais > 0)) return fini(su, 'ratee', 'temps');   // (le freinage : ses essais comptent, pas le temps)
    return 'encours';
  }

  // l'étape de la visite (la consigne à montrer) : selon l'écran et ce qui a déjà été vu
  function etapeVisite(su, ecran) {
    if (ecran === 'garage') return su.visites.aileron ? 'retour' : 'garage';
    if (ecran === 'aileron') return 'aileron';
    return su.visites.garage && su.visites.aileron ? 'fin' : 'paddock';
  }

  // la mise en place, à chaque image tant qu'elle n'est pas faite (renvoie vrai quand c'est fait) : la leçon du dépassement a une IA
  // lente (son rythme, TUTO_IA_RYTHME : un réglage de pilote, jamais la physique), posée dès que la carte lui a donné son pilote
  function preparer(id, J) {
    if (id !== 'depassement') return true;
    const P = J.plateau && J.plateau.pilotes;
    if (!P || !P.some(p => !p.humain && p.pilote)) return false;
    for (const p of P) if (!p.humain && p.pilote) p.pilote.rythme = R.TUTO_IA_RYTHME;
    return true;
  }

  // la leçon qui suit (ou null après la dernière)
  function suivante(id) {
    const l = PAR_ID[id];
    return l && l.numero < LECONS.length ? LECONS[l.numero].id : null;
  }

  return { LECONS, PAR_ID, zoneFreinage, situation, creerSuivi, pas, etapeVisite, preparer, suivante };
})();
