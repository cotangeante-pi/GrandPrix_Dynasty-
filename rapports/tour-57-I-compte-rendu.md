# Tour 57, tâche I : enligne-tout

Branche `enligne-tout` : origin/main + enligne-course, enligne-abandon, enligne-vrai-reseau, enligne-tactile, puis enligne-complet, enligne-cache, enligne-doigt (fusions du Chef).

Fait : noms D1 partout (nomAutorise du Codeur 4), un seul jeu de EN_LIGNE_* dans donnees.js, enligne-page.js refait à la main (écrans de salle + incidents), les pages de test `?test=` gardent les écrans dans la page (faux transport), test météo sur EN_LIGNE_METEOS, tests/serveur.py en noms D1, `reseau.js` : un rattachement refusé après une coupure = « perdu », `tests/reseau.html` tourne en temps réel (tests/reseau.py : sous --virtual-time-budget le minuteur « inconnue » passait avant la réponse du relais).

Restes (décision du Chef, réversible) :
- `tests/reseau-ws.py` retiré des annexes de lancer.py (dépasse 420 s ; il ne tournait jamais avant à cause du court-circuit « and ») ; à lancer à la main.
- cas « un onglet fermé sans prévenir (EN_LIGNE_SILENCE_MS) quitte la salle » de tests/reseau.html passé en reste (l'onglet muet reste « absent » sans « parti » ; règles couvertes par tests/serveur.py).
