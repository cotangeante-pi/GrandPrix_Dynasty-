// sdk.js — le SEUL point de passage vers le SDK Poki (window.PokiSDK).
// Aucun autre fichier du jeu n'appelle PokiSDK directement.
// Hors Poki (ou dans les tests), window.PokiSDK n'existe pas : chaque fonction
// appelle alors son rappel tout de suite, sans erreur ni avertissement.
// Aucune dépendance vers les autres fichiers du jeu.

const SDK = (function () {
  'use strict';

  let pret = false;            // init() terminé (réussi ou non)
  let chargementSignale = false; // gameLoadingFinished déjà envoyé
  let enJeu = false;           // dernier état envoyé : gameplayStart (vrai) ou gameplayStop (faux)
  let enJeuVoulu = false;      // état demandé par le jeu pendant une pub, appliqué après
  let pubEnCours = false;      // une pub est affichée : le jeu ne doit laisser passer aucun clic

  // le SDK Poki, ou null s'il n'est pas là
  function poki() {
    return (typeof window !== 'undefined' && window.PokiSDK) ? window.PokiSDK : null;
  }

  // appelle une fonction du SDK sans jamais laisser passer d'exception
  function appeler(nom, ...args) {
    const p = poki();
    if (!p || typeof p[nom] !== 'function') return undefined;
    try { return p[nom](...args); } catch (e) { return undefined; }
  }

  // appelle un rappel s'il existe, sans jamais laisser passer d'exception
  function rappeler(rappel, ...args) {
    if (typeof rappel !== 'function') return;
    try { rappel(...args); } catch (e) { /* une erreur du jeu ne doit pas bloquer le SDK */ }
  }

  // attend une valeur qui peut être une promesse ; rappel(valeur) ou rappel(undefined) si elle échoue
  function attendre(valeur, rappel) {
    if (valeur && typeof valeur.then === 'function') {
      valeur.then(r => rappel(r), () => rappel(undefined));
    } else {
      rappel(valeur);
    }
  }

  // envoie gameplayStart / gameplayStop, jamais deux fois de suite le même
  function envoyerEtat(voulu) {
    if (voulu === enJeu) return;
    enJeu = voulu;
    appeler(voulu ? 'gameplayStart' : 'gameplayStop');
  }

  // démarre le SDK ; rappel() quand c'est fini (même si un bloqueur de pub l'empêche)
  function init(rappel) {
    if (pret || !poki()) { pret = true; rappeler(rappel); return; }
    attendre(appeler('init'), () => { pret = true; rappeler(rappel); });
  }

  // le jeu est chargé : gameLoadingFinished, une seule fois
  function chargementFini() {
    if (chargementSignale) return;
    chargementSignale = true;
    appeler('gameLoadingFinished');
  }

  // la voiture roule (qualifications, course)
  function jeuCommence() {
    enJeuVoulu = true;
    if (!pubEnCours) envoyerEtat(true);
  }

  // pause, menus, podium, paddock
  function jeuArrete() {
    enJeuVoulu = false;
    if (!pubEnCours) envoyerEtat(false);
  }

  // déroulement commun aux deux pubs :
  // gameplayStop d'abord, son coupé, la pub, puis son rendu et l'état de jeu d'avant
  function pub(nomPoki, couperSon, fin) {
    if (pubEnCours) { fin(undefined); return; }
    if (!poki()) { fin(undefined); return; }
    pubEnCours = true;
    enJeuVoulu = enJeu;
    envoyerEtat(false);
    rappeler(couperSon, true);
    attendre(appeler(nomPoki), resultat => {
      pubEnCours = false;
      rappeler(couperSon, false);
      envoyerEtat(enJeuVoulu);
      fin(resultat);
    });
  }

  // pub entre deux Grands Prix (jamais pendant une course).
  // couperSon(vrai) avant la pub, couperSon(faux) après ; rappel() quand le jeu peut reprendre.
  function pubEntreCourses(rappel, couperSon) {
    pub('commercialBreak', couperSon, () => rappeler(rappel));
  }

  // pub récompensée (bouton 📺 qui dit ce qu'il gagne).
  // rappel(gagne) : vrai seulement si le joueur a regardé la pub jusqu'au bout.
  // Hors Poki, pas de pub donc pas de récompense : rappel(faux).
  function pubRecompense(rappel, couperSon) {
    pub('rewardedBreak', couperSon, resultat => rappeler(rappel, resultat === true));
  }

  return {
    init, chargementFini, jeuCommence, jeuArrete, pubEntreCourses, pubRecompense,
    get present() { return !!poki(); },   // le SDK Poki est-il là ?
    get pubEnCours() { return pubEnCours; }, // vrai pendant une pub : bloquer les clics
    get enJeu() { return enJeu; },
  };
})();
