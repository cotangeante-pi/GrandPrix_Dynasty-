// La F1 en 3D, faite par le code avec peu de triangles. Toutes les voitures ont ce modèle, avec la couleur de leur écurie.
// Repère du modèle : x vers l'avant, y vers le haut, z vers la droite (comme la voiture de physique.js).
const VOITURE3D = (function () {
  const R = REGLAGES;

  function boite(l, h, p, couleur, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), new THREE.MeshLambertMaterial({ color: couleur }));
    m.position.set(x, y, z);
    return m;
  }

  // une roue dans deux groupes : le pivot (braquage) et la roue qui tourne sur son axe
  function roue(rayon, largeur, x, z, avant, materiaux) {
    const pivot = new THREE.Group();
    pivot.position.set(x, rayon, z);
    const tourne = new THREE.Group();
    const pneu = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, largeur, 14), materiaux.pneu);
    pneu.rotation.x = Math.PI / 2;
    // un rayon de jante clair : on voit la roue tourner
    const jante = new THREE.Mesh(new THREE.BoxGeometry(rayon * 1.3, rayon * 0.25, largeur + 0.02), materiaux.jante);
    tourne.add(pneu, jante);
    pivot.add(tourne);
    return { pivot, tourne, avant };
  }

  // couleur : la couleur de l'écurie ; renvoie { groupe, roues, tete }
  function creer(couleur) {
    const groupe = new THREE.Group();
    const noir = 0x18191c, carbone = 0x2a2c31, casque = 0xf2c230;
    const materiaux = { pneu: new THREE.MeshLambertMaterial({ color: noir }), jante: new THREE.MeshLambertMaterial({ color: 0xb8bcc4 }) };

    // la coque, le nez, le capot moteur et la prise d'air au-dessus du pilote
    groupe.add(boite(2.6, 0.5, 0.8, couleur, 0.1, 0.45, 0));
    const nez = boite(1.7, 0.26, 0.36, couleur, 2.2, 0.33, 0);
    nez.rotation.z = -0.08;
    groupe.add(nez);
    groupe.add(boite(1.8, 0.42, 0.55, couleur, -1.3, 0.62, 0));
    groupe.add(boite(0.5, 0.35, 0.3, couleur, -0.35, 1.0, 0));
    // les pontons
    groupe.add(boite(1.7, 0.4, 0.45, couleur, -0.4, 0.38, 0.62));
    groupe.add(boite(1.7, 0.4, 0.45, couleur, -0.4, 0.38, -0.62));
    // le fond plat
    groupe.add(boite(3.6, 0.05, 1.5, carbone, -0.4, 0.12, 0));
    // l'aileron avant et ses dérives
    groupe.add(boite(0.5, 0.05, 1.95, carbone, 3.0, 0.14, 0));
    groupe.add(boite(0.55, 0.22, 0.04, carbone, 3.0, 0.22, 0.97));
    groupe.add(boite(0.55, 0.22, 0.04, carbone, 3.0, 0.22, -0.97));
    // l'aileron arrière, ses dérives et son support
    groupe.add(boite(0.45, 0.06, 1.0, carbone, -2.45, 0.98, 0));
    groupe.add(boite(0.4, 0.06, 1.0, couleur, -2.4, 0.84, 0));
    groupe.add(boite(0.6, 0.65, 0.04, carbone, -2.4, 0.75, 0.52));
    groupe.add(boite(0.6, 0.65, 0.04, carbone, -2.4, 0.75, -0.52));
    groupe.add(boite(0.12, 0.45, 0.06, carbone, -2.3, 0.62, 0));
    // le pilote et le halo (un arceau devant et au-dessus de la tête, posé sur un pilier)
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshLambertMaterial({ color: casque }));
    tete.position.set(0.2, 0.85, 0);
    groupe.add(tete);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 14, Math.PI), new THREE.MeshLambertMaterial({ color: carbone }));
    halo.rotation.x = -Math.PI / 2;
    halo.rotation.z = -Math.PI / 2;
    halo.position.set(0.25, 1.02, 0);
    groupe.add(halo);
    groupe.add(boite(0.04, 0.3, 0.035, carbone, 0.6, 0.86, 0));

    // les roues : l'avant à CG_AVANT devant le centre, l'arrière à l'empattement derrière
    const xa = R.CG_AVANT, xr = R.CG_AVANT - R.EMPATTEMENT;
    const roues = [
      roue(0.33, 0.36, xa, 0.85, true, materiaux), roue(0.33, 0.36, xa, -0.85, true, materiaux),
      roue(0.35, 0.42, xr, 0.8, false, materiaux), roue(0.35, 0.42, xr, -0.8, false, materiaux),
    ];
    for (const r of roues) groupe.add(r.pivot);
    // les bras de suspension, de la coque aux roues
    groupe.add(boite(0.08, 0.04, 1.5, carbone, xa, 0.36, 0));
    groupe.add(boite(0.08, 0.04, 1.4, carbone, xr, 0.4, 0));
    return { groupe, roues, tete };
  }

  // place le modèle à l'état affiché (x, z, cap) ; v : la voiture de physique.js (braquage et roues)
  function placer(modele, etat, v) {
    modele.groupe.position.set(etat.x, 0, etat.z);
    modele.groupe.rotation.y = -etat.cap;   // rotation.y > 0 tourne +x vers -z ; notre cap > 0 tourne vers +z
    for (const r of modele.roues) {
      if (r.avant) r.pivot.rotation.y = -v.braquage;
      r.tourne.rotation.z = -v.rotationRoues;
    }
  }

  return { creer, placer };
})();
