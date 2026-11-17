# Tour 58, tâche D : l'onglet vraiment caché (NON FAIT : mesure impossible avec Playwright sur ce Mac)

Nouveau : tests/enligne-cache.py (Chrome non headless, deux onglets d'une course en ligne BroadcastChannel en temps réel, A passé derrière B, visibilityState vérifié, 60 s, pas d'abandon, aucune désynchro). Il n'est PAS dans la suite GitHub.

Mesuré sur le Mac (Chrome 150, Playwright, headless=False) :
- La course en ligne tourne en temps réel sur les deux onglets (environ 60 pas/s, écart entre onglets de quelques pas, console vide, aucune désynchro).
- Mais document.visibilityState reste « visible » sur les deux onglets quoi qu'on fasse : bring_to_front de l'autre, onglet ouvert par window.open dans la même fenêtre, Browser.setWindowBounds minimized, Emulation.setFocusEmulationEnabled(false), connexion à un Chrome lancé à la main (connect_over_cdp + /json/activate), retrait des arguments par défaut de Playwright (--disable-renderer-backgrounding etc.). Playwright (ou ce Mac) garde les pages visibles : le chemin « onglet caché » (visibilitychange, ENLIGNE_PAGE.cacher, Worker EN_LIGNE_FOND_WORKER) n'a donc PAS été exercé par un vrai onglet caché. Le test échoue exprès aux lignes « A est vraiment caché » plutôt que de faire semblant.
- Aucune correction du jeu faite : rien n'a cassé.

Reste (à la main, par le propriétaire ou un script CDP brut sans Playwright) : ouvrir index.html?circuit=test&tours=3&ia=0&canal=x&joueurs=2 dans deux onglets d'un vrai Chrome (enlignecourse=hote&nom=bleu / enlignecourse=<code>&nom=rouge), passer sur l'autre onglet 60 s, revenir : la course doit avoir continué, sans « On attend… » ni abandon. xvfb n'est pas installé sur le Mac ; sur GitHub, même limite Playwright probable : non proposé.
