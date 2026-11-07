TOUR 50b — compte rendu du Codeur 2 (arrêt demandé par le Chef, 2026-11-06 ~19h20)

Branche reglages-voiture : dernier commit a17e95a (passage GitHub 42315928860 pas fini à l'arrêt : 11/18 verts, le reste en cours).
Branche lien-defi : dernier commit 76fb7d3 (passage pas regardé ; le précédent, e7fbe57, avait 16/18 : sensations-drift, instable
ailleurs aussi, et le test du tournoi, corrigé dans 76fb7d3).

Réglages de la voiture (fait) :
- reglages-voiture.js (calcul pur), effets dans physique.js (penteVitesse, facteurFreinage, adherenceReglages), pneus.js (usure),
  robot.js et ia.js (ce que le pilote sait) ; conseillé = milieu = aucun champ posé = bit près.
- Modèle : freins (avant : plus fort au-dessus de RV_FREINS_VITESSE, moins en dessous ; blocage en virage 0,05), boîte (courte : plus
  de force sous RV_BOITE_VITESSE 45 m/s, moins au-dessus), suspensions (dures : plus d'adhérence au-dessus de 40 m/s), pression
  (haute : −0,8 % adhérence, −2,4 % frottement, −10 % usure par cran).
- IA : même règle que l'aileron (profil, agressivité, graine GRAINE_REGLAGES_VOITURE) ; courses.html?ailerons=1 les porte (vert).
- Écran mes-reglages.js depuis le garage (« 🔩 Réglages »), « Réglage conseillé », sauvegarde par circuit, vieille sauvegarde = conseillé.
- Tests : tests/reglages-voiture.html (annexes), tableau 12 tracés dans tests/officiels.html, ecrans.py test=reglages-voiture (1280, 640 en).
Mesures (robot, tour lancé, 12 tracés) : boîte bas devant sur 10 / haut sur 2 ; suspensions 7/5 ; pression 5/7 ; écarts ≤ 0,64 %.
Freins : centre 55 m/s → arrière devant sur 1 ; 70 → sur 12 ; 60 poussé dans a17e95a, résultat à lire (officiels).
Reste : lire officiels de a17e95a (si freins hors 2..10, ajuster RV_FREINS_VITESSE entre 55 et 70) ; vérifier que ecrans-2/6 sont
verts (la page test=reglages-voiture repassait par le parcours du championnat : corrigé dans a17e95a) ; ecrans-5 sensations-drift est
un échec vu sur d'autres branches.

Lien de défi (fait, à vérifier) : DEFI.lien, « 🔗 Copier le lien » avant le code, ?defi=<code> ouvre la grille du défi, lien abîmé =
jeu normal + message (#defiLienRefus), « Renvoyer mon lien », défis reçus dans Messages (#paddockDefis) avec « Relever »
(DEFI_CODES_MAX derniers gardent leur code). Tests : test.html, ecrans.py test=defi. Reste : lire le passage de 76fb7d3 ;
l'adresse du lien sur Poki à vérifier au paquet.

Choix réversibles : boîte et freins modélisés par la vitesse (pas de vrais rapports) ; pression = adhérence contre frottement et usure.
