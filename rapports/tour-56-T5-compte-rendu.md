TOUR 56 — compte rendu du Codeur 5 — T5 : les écrans des batailles en ligne
Branche : enligne-ecrans, commit aecc910 (GitHub : run 43524546493, à lire)
Ordres : T5 fait (écrans, faux transport, réglages de l'hôte visibles par les invités)

Ce qui est fait (tout derrière EN_LIGNE, faux d'office ; ?enligne=1 l'ouvre) :
- « 🌐 En ligne » au titre et au menu du paddock.
- Menu (créer / rejoindre, 8 couleurs : le nom est « Pilote » + la couleur, aucun texte libre), rejoindre par code (4 lettres sans voyelle, clavier ou gros boutons), salle d'attente (joueurs, prêt / hôte, 8 émotes préréglées espacées de 1,5 s, réglages de l'hôte envoyés par {t:'reglages'} et lus par les invités).
- Refus inconnue / pleine / commencee / version / nom, en fr et en en ; Échap ou B = un pas en arrière.
- Faux transport en mémoire (enligne-faux.js) : salles BCDF, GHJK (pleine), LMNP (commencée).

Pour reseau.js : fournir un transport { envoyer(msg), sur(f), fermer() } et l'assigner à ENLIGNE_ECRAN.fabrique ; une connexion perdue peut livrer { t: 'coupure' } ; le message depart arrive dans JEU.enligneDepart (la course : T7).

Tests : ECRANS_PAGES="test=enligne" python3 tests/ecrans.py sur le Mac : 254/254 (fr / en, 640×360 au doigt, 960, 1280, paddock).
Corrigé en route : boutons 40 px au doigt, menu du paddock qui défile en 640×360 (voulu), page paddock prise pour une page championnat générique.

Ce que je n'ai pas pu vérifier : le passage GitHub des 18 travaux ; l'usage avec un vrai réseau ; la salle en 640×360 avec 8 joueurs au doigt réel.
