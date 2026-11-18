// Les icônes dessinées du nouveau style « télé » (tour 59, Codeur 2 ; REGLAGES.STYLE_TELE dans donnees.js).
// De vrais dessins SVG, à plat, d'une seule couleur (celle du texte), à la place des émojis des menus (paddock, titre, pause).
// Tout est dans ce fichier : aucune image, aucune police ; les dessins sont rangés dans des variables CSS (--ico-<nom>, un masque)
// que style.css pose devant le texte (button[data-ico]::before) : la taille des boutons ne change pas, et une icône suit la couleur du texte.
// Avec STYLE_TELE faux (ou ?tele=0 dans l'adresse), rien n'est posé : le jeu d'avant, au pixel près.
// Le calcul pur (les dessins, les adresses) est séparé de la page (installer) pour être testé sans écran.
const ICONES = (() => {
  // un damier de n × m cases à plat (le drapeau à damier)
  const damier = (x, y, c, n, m) => {
    let d = '';
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if ((i + j) % 2 === 0) d += `M${x + i * c} ${y + j * c}h${c}v${c}h-${c}z`;
    return `<path d="${d}"/>`;
  };
  // les dessins : 24 × 24, un seul trait plein ; les « trous » en fill-rule evenodd
  const T = 'fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"';
  const DESSINS = {
    course: '<path d="M4 2h2.4v20H4z"/>' + damier(8, 3.5, 3.4, 4, 3),
    equipe: '<path fill-rule="evenodd" d="M15.2 2.5A6 6 0 0 0 9.4 10.4L2.6 17.2l4.2 4.2 6.8-6.8A6 6 0 0 0 21.5 8.8l-3.7 3.7-3.3-.7-.7-3.3 3.7-3.7a6 6 0 0 0-2.3-2.3z"/>',
    boutique: '<path fill-rule="evenodd" d="M3 8h18l-1.4 13H4.4zM8 8V7a4 4 0 0 1 8 0v1h-2.2V7a1.8 1.8 0 0 0-3.6 0v1z"/>',
    saison: '<path fill-rule="evenodd" d="M3 4h18v17H3zM5.2 10v8.8h13.6V10z"/><path d="M7 2h2.2v4H7zM14.8 2H17v4h-2.2z"/><path d="M7.5 12h3v2.5h-3zM13 12h3v2.5h-3z"/>',
    messages: '<path fill-rule="evenodd" d="M2.5 5h19v14h-19zM5 7.4l7 5.6 7-5.6V9.9l-7 5.6-7-5.6z"/>',
    amis: '<circle cx="8.5" cy="7.5" r="3.6"/><path d="M1.5 20c0-4.2 3-6.8 7-6.8s7 2.6 7 6.8z"/><circle cx="17" cy="8.5" r="3"/><path d="M17 13.6c3.4 0 5.5 2.2 5.5 6.4h-4.7c0-2.6-.7-4.7-2.4-6.1.5-.2 1-.3 1.6-.3z"/>',
    enligne: `<circle cx="12" cy="12" r="9" ${T}/><ellipse cx="12" cy="12" rx="4" ry="9" ${T}/><path d="M3 12h18" ${T}/>`,
    reglages: '<path d="M2 6h20v2.4H2zM2 10.8h20v2.4H2zM2 15.6h20V18H2z"/><path d="M14.5 3.5h4v7h-4zM5.5 8.5h4v7h-4zM11 13.5h4v7h-4z"/>',
    apprendre: '<path d="M2.5 4.5c3.2-1 6.3-.8 9.5 1.2v15c-3.200-2-6.300-2.200-9.500-1.200zM21.500 4.500c-3.200-1-6.300-.8-9.500 1.200v15c3.200-2 6.300-2.200 9.500-1.200z"/>',
    jouer: '<path d="M5 2.500 21.500 12 5 21.500z"/>',
    reprendre: '<path d="M5 2.500 21.500 12 5 21.500z"/>',
    recommencer: `<path d="M20 12a8 8 0 1 1-2.600-5.900" ${T}/><path d="M21 2.500v7h-7z"/>`,
    voiture: '<path d="M10.800 1.500h2.400v4.500h-2.400z"/><path d="M5.500 3.500h13v2.200h-13z"/><path d="M3.500 7h4v5h-4zM16.500 7h4v5h-4z"/><path d="M9.500 7h5l1.300 4v5.500H8.200V11z"/><path d="M3.500 14.500h4.500v6H3.500zM16 14.500h4.500v6H16z"/><path d="M6.500 20.500h11v2h-11z"/>',
    sponsors: '<path d="m12 1.800 3.100 6.700 7.200.8-5.400 4.900 1.500 7.200L12 17.800l-6.400 3.600 1.500-7.200L1.700 9.300l7.200-.8z"/>',
    casque: '<path fill-rule="evenodd" d="M2.500 17v-4.500A9.500 9.500 0 0 1 12 3a9.500 9.500 0 0 1 9.500 9.500V17a2.500 2.500 0 0 1-2.500 2.500H8.500A6 6 0 0 1 2.500 17zM12.500 9.500v4h8v-4z"/>',
    aides: `<circle cx="12" cy="12" r="9.200" ${T}/><path d="M2.800 12.500h6.200l3 3.200 3-3.200h6.200" ${T}/>`,
    touches: '<path fill-rule="evenodd" d="M1.500 5.500h21v13h-21zM3.700 7.700v8.600h16.600V7.700z"/><path d="M5.800 9.500h2.400v2.200H5.800zM10.800 9.500h2.400v2.200h-2.400zM15.800 9.500h2.400v2.200h-2.400zM7.500 13.300h9v1.700h-9z"/>',
    son: `<path d="M2.500 9h4l5.500-4.500v15L6.500 15h-4z"/><path d="M15.500 8.500a5 5 0 0 1 0 7M18.500 5.500a9 9 0 0 1 0 13" ${T}/>`,
    sonOff: '<path d="M2.500 9h4l5.500-4.500v15L6.500 15h-4z"/><path d="M15 9l6 6M21 9l-6 6" ' + T + '/>',
    jeu: '<path fill-rule="evenodd" d="M6.500 7h11a4.500 4.500 0 0 1 4.400 3.600l.9 5a2.800 2.800 0 0 1-5 2L15.500 15.500h-7L6.200 17.600a2.800 2.800 0 0 1-5-2l.9-5A4.500 4.500 0 0 1 6.500 7zM6.700 10v1.700H5v1.800h1.700v1.700h1.800v-1.700h1.700v-1.800H8.500V10zM15.800 10.500v2h2v-2zM18.500 12.500v2h2v-2z"/>',
    carriere: '<path d="M4.500 2h2.400v20H4.500z"/><path d="M8 3h13l-3.200 4.500L21 12H8z"/>',
    meteo: '<path d="M7 19a5 5 0 0 1-.700-9.900A6.500 6.500 0 0 1 18.700 10.500 4.300 4.300 0 0 1 18 19z"/>',
    fantome: '<path fill-rule="evenodd" d="M4.500 22V11a7.500 7.500 0 0 1 15 0v11l-3.200-2.800L14 22l-2-2.800L10 22l-2.300-2.800zM8.800 10.500a1.400 1.400 0 1 0 2.800 0 1.400 1.400 0 1 0-2.800 0zM12.800 10.500a1.400 1.400 0 1 0 2.800 0 1.400 1.400 0 1 0-2.800 0z"/>',
    trajectoire: `<path d="M2.500 19.500C9 19.500 6 4.500 12 4.500s3 15 9.500 15" ${T}/>`,
    commentaire: `<path d="M8.800 2.500h6.400v10.500a3.200 3.200 0 0 1-6.400 0z"/><path d="M5 11.500a7 7 0 0 0 14 0M12 18.500v3.500" ${T}/>`,
    effets: '<path d="m12 1.500 2.800 7.700L22.500 12l-7.700 2.800L12 22.500l-2.800-7.700L1.500 12l7.700-2.800z"/>',
    voix: '<path d="M2.500 3.500h19v12.500H10.500l-5.500 4.500V16H2.500z"/>',
    qualite: '<path fill-rule="evenodd" d="M1.500 3.500h21V17h-21zM3.800 5.800v8.900h16.400V5.800z"/><path d="M8.500 19h7v2.200h-7z"/>',
    retro: '<path d="M2.500 5.500h19l-1.600 8.500H4.100z"/><path d="M10.800 14h2.400v7h-2.400z"/>',
    carte: '<path d="M2.500 4.500 9 2.500l6 2.200 6.500-2.200v17l-6.500 2-6-2.200-6.500 2.200z"/>',
    tournoi: '<path d="M6 2.500h12V8a6 6 0 0 1-12 0zM3 4h3v2.500a2.500 2.500 0 0 1-3-.5zM18 4h3v2a2.500 2.500 0 0 1-3 .5z"/><path d="M10.800 13h2.400v4h-2.400zM7 19.500h10v2H7z"/>',
    defi: '<path d="M13.500 1.500 4 13.500h6.500L9.500 22.500l10.500-12.500h-6.800z"/>',
    arbre: '<path d="M8.500 2h7v5.500h-7zM11 7.500h2V10h-2zM4 10h16v2H4zM4 12h2.200v3H4zM17.800 12H20v3h-2.200zM1.500 15h7v5.500h-7zM15.500 15h7v5.500h-7z"/>',
    journal: '<path fill-rule="evenodd" d="M2.500 4h15v16H5a2.500 2.500 0 0 1-2.500-2.500zM5.500 7v4.500h9V7zM5.500 13.500v1.800h9v-1.800zM5.500 17v1.500h9V17z"/><path d="M18.500 8h3v9.500a2.500 2.500 0 0 1-2.500 2.500h-.5z"/>',
    mallette: `<path d="M2 7h20v13H2z"/><path d="M8.500 7V3.800h7V7" ${T}/>`,
    aileron: '<path d="M1 5.500h3.200v9H1zM19.800 5.500H23v9h-3.200z"/><path d="M4 8.500h16v3.500H4z"/><path d="M10.800 12h2.400v5.500h-2.400zM7 17.500h10V20H7z"/>',
    point: '<circle cx="12" cy="12" r="6"/>'
  };
  const MARQUES = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"';
  const svg = nom => DESSINS[nom] ? `<svg ${MARQUES}>${DESSINS[nom]}</svg>` : '';
  // l'adresse à poser dans une variable CSS : un masque (la forme compte, pas la couleur)
  const uri = nom => `url("data:image/svg+xml,${encodeURIComponent(svg(nom))}")`;
  // quel bouton (ou titre) prend quelle icône : le menu du paddock, les pages, les tuiles, l'écran titre, la pause, les Réglages
  const PAR_ID = {
    menuCourse: 'course', menuEquipe: 'equipe', menuBoutique: 'boutique', menuSaison: 'saison', menuMessages: 'messages',
    boutonAmisPaddock: 'amis', boutonEnlignePaddock: 'enligne', menuReglages: 'reglages', boutonTutorielPaddock: 'apprendre',
    pageEquipeTitre: 'equipe', pageBoutiqueTitre: 'boutique', pageSaisonTitre: 'saison', pageMessagesTitre: 'messages', pageReglagesTitre: 'reglages',
    boutonGarage: 'equipe', boutonMaVoiture: 'voiture', boutonSponsors: 'sponsors', boutonMonCasque: 'casque',
    sonTitre: 'son', reglagesJeuTitre: 'jeu', reglagesCarriereTitre: 'carriere',
    boutonJouer: 'jouer', boutonAmis: 'amis', boutonEnligneTitre: 'enligne', boutonTutorielTitre: 'apprendre', boutonAidesTitre: 'aides', boutonTouchesTitre: 'touches',
    boutonReprendre: 'reprendre', boutonRecommencer: 'recommencer', boutonFantomePause: 'fantome', boutonTrajectoirePause: 'trajectoire',
    boutonCommentairePause: 'commentaire', boutonEffetsPause: 'effets', boutonVoixPause: 'voix', boutonQualitePause: 'qualite', boutonRetroPause: 'retro',
    boutonRevoirAidesPause: 'aides', boutonTutorielPause: 'apprendre', boutonTouchesPause: 'touches',
    boutonAmisDeux: 'amis', boutonBoutique: 'boutique', boutonCalendrier: 'saison', boutonAlbum: 'journal', boutonArbre: 'arbre', boutonArbreBilan: 'arbre',
    boutonCourrier: 'messages', boutonParlerCoequipier: 'voix', boutonParlerPatron: 'mallette', boutonFicheDiscuter: 'voix', boutonMuetPaddock: 'son',
    boutonAidesPaddock: 'aides', boutonAidesChoix: 'aides', boutonAidesTuto: 'aides', boutonRevoirAides: 'recommencer', boutonTouchesPaddock: 'touches',
    boutonAileron: 'aileron', boutonReglagesVoiture: 'reglages', boutonTutoRecommencer: 'recommencer', boutonResume: 'jouer', boutonAmisTournoi: 'tournoi', boutonAmisDefi: 'defi', prevision: 'meteo'
  };
  // au début d'un texte : un émoji, un symbole ou une flèche qui servait d'icône (jamais une lettre ni un chiffre)
  const DEBUT_SYMBOLE = /^(?:[←-⯿\u{1F000}-\u{1FFFF}️‍]|\s)+/u;
  const sansSymbole = texte => texte.replace(DEBUT_SYMBOLE, '');
  // le symbole du début d'un texte est rangé dans un <span class="symbole"> caché par le CSS : le texte du bouton (textContent) ne change pas d'un caractère
  // (les tests, les lecteurs d'écran et les textes de textes.js le retrouvent tel quel), seul l'œil ne le voit plus
  function habiller(el) {
    const n = el.firstChild;
    if (!n || n.nodeType !== 3) return false;
    const m = DEBUT_SYMBOLE.exec(n.nodeValue);
    if (!m || !m[0].trim()) return false;   // des espaces seuls : rien à cacher
    const sp = document.createElement('span'); sp.className = 'symbole'; sp.textContent = m[0];
    n.nodeValue = n.nodeValue.slice(m[0].length);
    el.insertBefore(sp, n);
    return true;
  }

  const actif = () => {
    if (typeof REGLAGES === 'undefined' || !REGLAGES.STYLE_TELE) return false;
    const a = (typeof location !== 'undefined' && location.search || '');
    return !/[?&](tele=0|style=ancien)\b/.test(a);
  };

  // la page : pose la classe, les variables, et l'icône de chaque bouton ; cache le symbole du début des textes (ils sont réécrits par les écrans)
  function installer() {
    if (!actif()) return false;
    document.body.classList.add('styleTele');
    for (const nom in DESSINS) document.documentElement.style.setProperty('--ico-' + nom, uri(nom));
    const nettoyer = habiller;
    for (const id in PAR_ID) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.setAttribute('data-ico', PAR_ID[id]);
      el.style.setProperty('--ico', 'var(--ico-' + PAR_ID[id] + ')');
      if (el.classList.contains('menuEntree')) continue;   // l'icône du menu est un cadre à part (.menuIcone : son émoji reste dans la page, invisible, style.css)
      nettoyer(el);
      new MutationObserver(() => nettoyer(el)).observe(el, { childList: true, characterData: true, subtree: true });
    }
    // 🔊 / 🔇 : le texte reste (les tests et le son le lisent), il est caché et l'icône est dessinée à sa place
    const son = document.getElementById('boutonSon');
    if (son) {
      const maj = () => { const n = /🔇/.test(son.textContent) ? 'sonOff' : 'son'; if (son.getAttribute('data-ico') !== n) { son.setAttribute('data-ico', n); son.style.setProperty('--ico', 'var(--ico-' + n + ')'); } };
      maj();
      new MutationObserver(maj).observe(son, { childList: true, characterData: true, subtree: true });
    }
    return true;
  }
  return { DESSINS, PAR_ID, svg, uri, sansSymbole, habiller, installer, actif };
})();
if (typeof document !== 'undefined' && document.body) ICONES.installer();
