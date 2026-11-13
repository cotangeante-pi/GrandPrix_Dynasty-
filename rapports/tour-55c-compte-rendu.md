# Tour 55c : les 7 dernières exclamations (Codeur 4, lettre c, branche voix-liste)

Résultat : 40 phrases sur 40 couvertes (54 prises gardées dans la page d'écoute). Bark (MIT) seulement, aucune voix tirée de vidéos, rien branché dans le jeu.

Les 7 phrases : nouveaux texte_long (même sens), voix 7 et voix 4 :
- bataille-2 : voix 4, note 0,708
- contact-1 : voix 4, note 0,677, passée au secours 0,6 seulement ; texte_long final « Oh là là, quel CONTACT ! » (sans « aïe », que Whisper ne comprenait pas)
- contact-2 : voix 7 (0,788) et voix 4 (0,85)
- meilleurTour-1 : voix 4, 0,705
- arrivee-2 : voix 7, 0,909
- podium-2 : voix 4, 0,727
- remontee-2 : voix 7 (0,811), voix 4 (0,825 et 0,721)

Seule prise passée à 0,6 dans ce tour : contact-1. (Les secours du tour 54 restent : penalite-1, remontee-1, meilleurTour-2, bataille-1, depart-1.)

Outils : liste_page.py garde maintenant la prise déjà présente dans la page quand le son d'une vieille prise a été effacé (sinon il plantait, puis perdait des phrases).

Leçons de la nuit : (1) à `nice -n 19`, Bark n'avançait plus du tout quand les tests d'autres Codeurs occupaient les 2 cœurs (25 s de calcul en 2 h) : passé à `nice -n 10` pour Bark seul ; (2) une garde « prise trop longue » fondée sur l'heure tuait Bark pour rien : comptée en tours de 20 s ; (3) `--ids` doit recevoir sa valeur (un argument manquant a fait tourner à vide ~3 h).
