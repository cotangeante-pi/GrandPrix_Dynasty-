TOUR 51c — compte rendu du Codeur 3
Ordre : brancher de vraies voix enregistrées (provisoires, éteintes par défaut)

- `voix-sons.js` : 5 faits (départ, dépassement, bataille, erreur, victoire) -> 3 prises par langue, jamais la même deux fois de suite (hasard à lui, la course est identique au bit près) ; la synthèse (`voix.js`) ne parle que si aucun son n'est parti ; le bandeau texte reste.
- Sons : meilleures prises de l'essai n° 3 (notes de 0,76 à 0,9, prises mal comprises par Whisper écartées), `sons/voix/<langue>-<fait>-<n>.m4a`, 30 fichiers, 393 826 octets.
- Chargement : XHR + decodeAudioData, seulement la langue du jeu, seulement quand l'AudioContext existe, pas pendant la découverte (`JEU.decouverte`), lancé au premier pas de course ensuite ou au réglage. Passe par la famille « commentateur » de `son.js` (nouvel accesseur `SON.contexte`) ; `taire()` en pause, hors course, onglet caché.
- Réglage : `VOIX_SONS` faux (donnees.js) ; `?voixsons=1` ; bouton « Voix enregistrées : oui / non » dans ⚙ Réglages (sauvegardé, option `voixsons`).
- Paquet Poki : `tests/paquet.py` inclut `sons/voix/` ; zip 1,0 Mo (< 8 Mo).
- Tests : tests/test.html (éteint par défaut, chaque fait a un groupe, pas deux fois la même prise, trois prises servent, muet si son coupé, sans tampon = faux sans erreur, course au bit près, textes fr/en) vert sur le Mac ; tests/paquet.py : 30 sons dans le zip < 400 Ko, rien demandé avant geste ni pendant la découverte, 15 sons chargés et décodés par Chrome depuis le zip, un fait joue, M coupe, console vide (bloc exécuté seul sur le Mac, vert).
- Pas vérifié : l'écoute réelle (haut-parleur), le type MIME servi par le CDN Poki (Python dit audio/mp4a-latm pour .m4a ; le décodage Web Audio ne dépend pas du type) ; un fichier absent donne l'erreur de chargement que le navigateur écrit tout seul, sans exception du jeu.
- Mac chargé : tests/test.html a un échec de durée (championnat, 26 s) et paquet.py complet expire sur l'onglet caché ; sans lien avec ce tour, GitHub tranche.
