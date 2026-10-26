// Le résumé vidéo de la course (étape 13, CLAUDE.md « Le résumé vidéo de la course »), en calcul pur (ni Three.js ni page) :
// les moments forts viennent de l'enregistrement de la course (enregistreur.js : le départ, les dépassements, surtout ceux du
// joueur, les sorties de piste, l'arrivée), choisis par importance dans une durée totale bornée (RESUME_DUREE_MAX) ; le rejeu
// avance dans ces plages et redonne les positions de l'enregistrement (enr.lire), jamais celles de la physique.
//
//   RESUME.creer(enr, dureeMax)  → le rejeu { plages, i, t, fini, duree } (null s'il n'y a rien à rejouer)
//   RESUME.avancer(r, dt)        → avance de dt secondes (× RESUME_VITESSE) ; passe à la plage suivante ; r.fini à la fin
//   RESUME.moment(r)             → le moment fort en cours (le plus important de ceux qui contiennent r.t)
//   RESUME.positions(r, enr)     → les voitures à r.t : [{ x, z, cap, vitesse, place, horsPiste }]
//   RESUME.suivie(r, enr)        → la voiture que la caméra télé suit (celui qui dépasse, qui sort, le vainqueur, le leader au départ)
//   RESUME.bandeau(m)            → { cle, valeurs } : le texte du moment (textes.js : resume_<type>), avec qui et sur qui
const RESUME = (function () {
  const R = REGLAGES;

  function creer(enr, dureeMax) {
    if (!enr || !enr.nbImages) return null;
    const plages = enr.resume(dureeMax === undefined ? R.RESUME_DUREE_MAX : dureeMax).filter(p => p.fin > p.debut);
    if (!plages.length) return null;
    return { plages, i: 0, t: plages[0].debut, fini: false, duree: enr.dureePlages(plages), joue: 0 };
  }

  function avancer(r, dt) {
    if (!r || r.fini) return r;
    let reste = dt * R.RESUME_VITESSE;
    r.joue += reste;
    while (reste > 0 && !r.fini) {
      const p = r.plages[r.i], dispo = p.fin - r.t;
      if (reste < dispo) { r.t += reste; reste = 0; }
      else {
        reste -= dispo;
        if (r.i + 1 < r.plages.length) { r.i++; r.t = r.plages[r.i].debut; }
        else { r.t = p.fin; r.fini = true; }
      }
    }
    return r;
  }

  function moment(r) {
    if (!r) return null;
    const p = r.plages[r.i], dedans = p.moments.filter(m => m.debut <= r.t && r.t <= m.fin);
    const liste = dedans.length ? dedans : p.moments;
    return liste.slice().sort((a, b) => b.importance - a.importance || a.temps - b.temps)[0];
  }

  function positions(r, enr) {
    return enr.lire(r.t);
  }

  function suivie(r, enr) {
    const m = moment(r);
    if (m && typeof m.qui === 'number') return m.qui;
    const pos = positions(r, enr);
    let k = pos.findIndex(x => x.place === 1);
    return k < 0 ? 0 : k;
  }

  function bandeau(m) {
    if (!m) return null;
    return { cle: 'resume_' + m.type, valeurs: { qui: m.qui, sur: m.sur, place: m.place } };
  }

  return { creer, avancer, moment, positions, suivie, bandeau };
})();
