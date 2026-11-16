# Tour 57, T4 (onglet caché) et T2 (incidents), Codeur 3

Branche `enligne-cache` (partie de enligne-abandon, enligne-tout et enligne-complet fusionnées).

## T4 : l'onglet caché
- `enligne-page.js` : le « tic » du minuteur de fond vient d'un Worker dédié (créé depuis un Blob, aucun fichier de plus) ; Chrome ralentit `setInterval` d'un onglet caché (1 par seconde, puis 1 par minute) mais pas celui d'un Worker. Repli sur `setInterval` si le Worker est absent ou refusé (CSP, erreur de chargement). `arreterFond()` termine le Worker au retour de l'onglet.
- Réglage : `EN_LIGNE_FOND_WORKER` (donnees.js, vrai) ; faux = le comportement d'avant (setInterval seul).
- Tests (`tests/enligne-incidents.py`) : `incident_cache` (minuteur de fond) et `incident_cache_worker` (Worker, réglage à faux, Worker refusé). Limite : Playwright ne sait pas fabriquer un onglet vraiment caché (document.hidden reste faux, même avec fenêtre) ; on vérifie donc le chemin (Worker utilisé, repli), pas le ralentissement de Chrome. À regarder avec un vrai navigateur : deux onglets, celui de l'invité caché plus d'une minute.

## T2 : les incidents
- Le message `{t:'erreur'}` du relais (hote, commencee, pas-commencee, reglages, seul, charge) s'affiche en fr/en (`enligneErreur_*` dans textes.js, `ENLIGNE_ECRAN.erreur` dans la salle, `ENLIGNE_PAGE.erreurRelais` en course) ; une raison sans texte n'affiche rien.
- `tests/enligne-incidents.py` : plus de « or True » (le nom du joueur parti est vérifié, « Pilote Rouge » / « Red driver »), noms D1 (bleu, rouge), plus de `wait_for_function` (il repose sur requestAnimationFrame, qui ne tourne pas dans un onglet non visible) mais une boucle d'`evaluate`, pages « patientes » (EN_LIGNE_ATTENTE_MAX_MS = 0) sauf `incident_lent`, nouveau cas `incident_erreur_relais`, filtre `INCIDENTS_FILTRE=cache`.
- `tests/lancer.py` : les annexes tournent toutes (plus de court-circuit : un rouge cachait les suivantes, dont les incidents).
- GitHub (annexes, 37f3aa7) : `tests/enligne-incidents.py` tout vert en 124 s (le cas « pub au podium » demandait que la boucle du navigateur reste allumée : c'est elle qui montre le podium ; les autres cas l'arrêtent et pilotent à la main). Les rouges restants de ce passage ne sont pas à ce travail : reseau.html (silence EN_LIGNE_SILENCE_MS) et reseau-ws.py (délai de 420 s), corrigés par le Codeur 1 sur enligne-tout.
- Pas essayé sur le Mac (verrou occupé, machine trop lente : les chargements de page dépassaient 120 s) : tout a été vu par GitHub.
