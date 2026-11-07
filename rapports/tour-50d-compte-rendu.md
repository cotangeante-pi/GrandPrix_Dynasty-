TOUR 50d — compte rendu du Codeur 4 (arrêté à 19h26 à la demande du Chef ; un nouveau Codeur reprend)
Commit : 6b83281 (branche voix3-divisions). Le dernier commit vert est ee7fd6d : GitHub 42312902236, 18/18.
Ordres : B (un plateau par division) fait et vert / A (essai de voix n° 3) : page v1 publiée ; la mise à jour (note sans ton de question, cible 0,8) est en cours (WIP)

B. Le plateau de chaque division (divisions.js ; saisons, fiche, journal, patrons, interface, principal) :
- ch.plateau : le plateau où court le joueur ; ch.plateaux[d] : les autres ; ch.parcours. Un plateau neuf est tiré avec la graine
  à la montée : écuries numérotées 11-20 (D3), 21-30 (D2), 31-40 (D1) ; pilotes « Pilote N » avec des numéros uniques sur tous
  les plateaux. Les écuries et pilotes existants ne changent pas.
- Monté, le joueur reçoit les offres de la division d'en haut, avec sa note × DIVISION_NOTE_MONTEE (0,5). Pas de négociation
  avec ces patrons-là. Il change de plateau à la saison suivante et reste la dernière voiture (k = 19, comme le veut creerCourseIA).
- Les rivaux classés dans les 3 premiers montent avec lui (DIVISION_MONTEE_RIVAUX : choix réversible, à confirmer par le
  propriétaire) ; les plus faibles d'en haut descendent.
- Le plateau quitté est gardé : les noms du dernier jour pour l'album, ses compteurs.
- Une vieille sauvegarde garde son plateau unique en D3. DIVISION_PLATEAUX faux : le comportement du tour 49d.
- Tests : 3 nouveaux dans test.html (créer, monter jusqu'en D1, recharger, album, fiches, transferts, vieille sauvegarde,
  réglages coupés, taille). Les tests d'avant tournent sur un seul plateau (DIVISION_PLATEAUX faux en haut de la page).
- Taille : 68,9 Ko après 7 saisons et 4 plateaux (dont 28,9 Ko pour les plateaux gardés), contre 43,2 Ko sur un seul plateau.
- L'héritier de la relève reste dans la division du parent (pas touché).

A. Les voix :
- Scripts (tests/voix) :
  - traitement.py : accelerer (WSOLA), accentuer, intonation2, le niveau « vif » ;
  - bark_essai.py : --de, --phrases, --niveaux, variantes de texte ;
  - transcrire.py : juger() et les homophones (« Quel bagarre » compte comme juste) ;
  - essai3.py : la page légère.
- Page v1 (19h05) : 28 prises en .mp4 (339 Ko), avec un fichier fichiers.json.
- Avis du propriétaire : viser une note d'environ 0,8, parler un tout petit peu plus lentement, et pas de ton de question.
  Déjà fait dans le code (WIP, non vérifié) :
  - vif = parole +9 % (au lieu de +15 %) à la même hauteur, sans fin qui monte, +2,5 dB sur le mot fort ;
  - intonation2 = 0,40 × étendue + 0,35 × chute depuis le sommet + 0,15 × claquement + 0,10 × sommet avant la fin ;
  - une question (pente > +1,5 demi-ton sur les 180 dernières ms, ou une fin au sommet) donne une note × 0,4 et la prise est écartée ;
  - essai3.py garde d'abord les prises entre 0,75 et 0,9, les plus proches de 0,8.
  À CALIBRER : sur 3 prises d'essai, la pente mesurée est grosse (+11,7) et 2 prises sur 3 sont classées « question ».
  Le seuil est sans doute trop sévère, ou la mesure de la pente trop bruitée : à écouter et régler avant de refaire la page.
- Bark tourne en arrière-plan jusqu'à 22h55 : 12 nouvelles prises à 19h26 (bataille fr, puis bataille en, puis les autres).
Ce que je n'ai pas pu vérifier : l'écoute (le propriétaire) ; la calibration de intonation2.
Réévalue.
