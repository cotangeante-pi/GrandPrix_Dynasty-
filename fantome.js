// Le fantôme du meilleur tour (étape 5, CLAUDE.md « Le fantôme du meilleur tour »), en calcul pur, sans Three.js.
// Pendant le tour chronométré de qualification, le tour du joueur est enregistré avec l'enregistreur du résumé vidéo
// (enregistreur.js : le même code, pour une seule voiture) ; s'il bat le record du circuit, il le remplace dans la
// sauvegarde (compact : nombres arrondis). Au tour suivant, le record est rejoué (une voiture transparente, seulement
// dessinée : principal.js et voiture3d.js) et l'écart en direct se calcule ici, à distance égale : à une même distance
// depuis la ligne, la différence de temps entre le joueur et l'enregistrement. Un tour avec un virage coupé n'est
// jamais gardé (bat). Réglages : FANTOME_* (donnees.js).
//
//   const tour = FANTOME.commencer();            // à la ligne (le chrono du tour part à 0)
//   FANTOME.noter(tour, t, v, s);                 // à chaque pas du tour : t = chrono du tour, v = la voiture, s = distance depuis la ligne
//   const f = FANTOME.compacter(tour, temps, fin);   // le tour fini : son temps, la distance à l'arrivée → le fantôme compact (sauvegarde)
//   const rejeu = FANTOME.charger(f);             // au tour suivant
//   FANTOME.position(rejeu, t)                    → { x, z, cap, vitesse } du fantôme au chrono t
//   FANTOME.ecart(rejeu, t, s)                    → l'écart en direct (s) ; < 0 : le joueur est devant le fantôme
//   FANTOME.ecartFinal(rejeu, temps)              → l'écart final : le temps du tour moins celui du fantôme
const FANTOME = (function () {
  const R = REGLAGES;

  // un enregistrement neuf : une seule voiture, une image toutes les FANTOME_PAS secondes du chrono du tour.
  // FANTOME_PAS est un nombre entier de pas de physique : les images tombent exactement sur des pas, et le rejeu à
  // « i × pas » redonne les positions enregistrées
  function commencer() {
    return { enr: creerEnregistreur(1, { reglages: { IMAGES_PAR_SECONDE: 1 / R.FANTOME_PAS } }), s: [] };
  }

  // à chaque pas du tour lancé : t = le chrono du tour (0 à la ligne), v = la voiture, s = la distance depuis la ligne
  function noter(tour, t, v, s) {
    tour.enr.enregistrer(t, [v], null);
    while (tour.s.length < tour.enr.nbImages) tour.s.push(s);   // l'image écrite à ce pas prend la distance de ce pas
  }

  // le tour fini : le fantôme compact à sauvegarder. temps : le temps du tour ; fin : la distance depuis la ligne à
  // l'arrivée. Les nombres sont arrondis (FANTOME_DECIMALES : position et distance au cm, cap au millième de radian,
  // temps au millième de seconde)
  function compacter(tour, temps, fin) {
    const enr = tour.enr, n = enr.nbImages;
    let d = 1;   // 10 ^ FANTOME_DECIMALES, par multiplications (pas de Math.pow : CLAUDE.md, déterminisme Mac / Linux)
    for (let i = 0; i < R.FANTOME_DECIMALES; i++) d *= 10;
    const arrondi = x => Math.round(x * d) / d, milli = x => Math.round(x * 1000) / 1000;
    const f = { temps: milli(temps), fin: arrondi(fin), pas: R.FANTOME_PAS, x: [], z: [], cap: [], s: [] };
    for (let i = 0; i < n; i++) {
      const p = enr.lire(enr.temps(i))[0];   // à l'instant exact d'une image, lire en redonne les valeurs
      f.x.push(arrondi(p.x)); f.z.push(arrondi(p.z)); f.cap.push(milli(p.cap)); f.s.push(arrondi(tour.s[i]));
    }
    return f;
  }

  // un fantôme compact est-il lisible ? (une sauvegarde abîmée ne doit pas planter le jeu)
  function valide(f) {
    return !!f && typeof f === 'object' && typeof f.temps === 'number' && f.pas > 0 && [f.x, f.z, f.cap, f.s].every(a => Array.isArray(a) && a.length === f.x.length) && f.x.length > 0;
  }

  // le rejeu d'un fantôme compact : le même enregistreur, rempli image par image (lire(t) interpole entre elles) ;
  // null si le fantôme est absent ou illisible
  function charger(f) {
    if (!valide(f)) return null;
    const enr = creerEnregistreur(1, { reglages: { IMAGES_PAR_SECONDE: 1 / f.pas } });
    const v = { x: 0, z: 0, cap: 0 };   // sans vitesse : l'enregistreur la tire du déplacement entre deux images
    for (let i = 0; i < f.x.length; i++) { v.x = f.x[i]; v.z = f.z[i]; v.cap = f.cap[i]; enr.enregistrer(i * f.pas, [v], null); }
    return { f, enr, nb: f.x.length, duree: (f.x.length - 1) * f.pas };
  }

  // la position du fantôme au chrono t du tour : { x, z, cap, vitesse } (après son dernier point, il y reste)
  function position(rejeu, t) {
    return rejeu.enr.lire(t)[0];
  }

  // le temps que le fantôme a mis pour atteindre la distance s depuis la ligne (entre deux images : au prorata ;
  // après la dernière image, au prorata jusqu'à la ligne d'arrivée, atteinte à f.temps)
  function tempsA(rejeu, s) {
    const f = rejeu.f, n = f.s.length, dernier = (n - 1) * f.pas;
    if (s <= f.s[0]) return 0;
    if (s >= f.fin) return f.temps;
    if (s >= f.s[n - 1]) return f.fin > f.s[n - 1] ? dernier + (f.temps - dernier) * (s - f.s[n - 1]) / (f.fin - f.s[n - 1]) : dernier;
    let a = 0, b = n - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (f.s[m] <= s) a = m; else b = m; }
    const part = f.s[b] > f.s[a] ? (s - f.s[a]) / (f.s[b] - f.s[a]) : 0;
    return (a + part) * f.pas;
  }

  // l'écart en direct : le joueur est à la distance s au chrono t ; négatif = il est devant le fantôme
  function ecart(rejeu, t, s) {
    return t - tempsA(rejeu, s);
  }

  // l'écart final : le temps du tour fini moins celui du fantôme (négatif = le record est battu)
  function ecartFinal(rejeu, temps) {
    return temps - rejeu.f.temps;
  }

  // le record du circuit est-il battu par ce tour ? Jamais par un tour coupé (✂), ni par un temps égal ou plus lent ;
  // ancien : le fantôme compact sauvegardé (null ou illisible : tout tour valide le remplace)
  function bat(ancien, temps, coupe) {
    if (coupe || typeof temps !== 'number' || !(temps > 0)) return false;
    return !valide(ancien) || temps < ancien.temps;
  }

  // la taille d'un fantôme compact une fois dans la sauvegarde (octets du JSON ; mesurée et notée dans SUIVI.md)
  function taille(f) {
    return JSON.stringify(f).length;
  }

  return { commencer, noter, compacter, valide, charger, position, tempsA, ecart, ecartFinal, bat, taille };
})();
