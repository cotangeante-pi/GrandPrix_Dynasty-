// Le seul hasard du jeu. Avec une graine, la suite est toujours la même (pour rejouer une course dans les tests).
const ALEATOIRE = (function () {
  // mulberry32 : petit générateur 32 bits, rapide et assez bon pour un jeu
  function mulberry32(graine) {
    let a = graine >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let generateur = Math.random;

  // semer(n) : suite fixe à partir de n ; semer() : retour au hasard du navigateur
  function semer(graine) {
    generateur = graine === undefined || graine === null ? Math.random : mulberry32(graine);
  }

  // un nombre dans [0, 1[
  function hasard() {
    return generateur();
  }

  // suite(n) : une suite fixe à part, qui ne touche pas à celle de semer/hasard (le public des tribunes, decor-public.js : on le
  // tire pendant la construction de la scène sans déranger le hasard d'une course semée)
  function suite(graine) {
    return mulberry32(graine);
  }

  return { semer, hasard, suite };
})();

const hasard = ALEATOIRE.hasard;
