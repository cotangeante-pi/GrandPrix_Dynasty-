# Tour 59, Codeur 4 : relecture finale du jeu en ligne (main 8c4f5d6, code de a579974)

Relu en entier : `enligne.js`, `reseau.js`, `enligne-page.js`, `enligne-ecran.js`, `enligne-faux.js`, `serveur/relais.py`, les crochets de `principal.js` / `sdk.js` / `index.html`, les textes fr/en, et la liste des tests (`tests/test.html` « en ligne : », `tests/serveur.py`, `tests/reseau.html` + `reseau.py`, `tests/reseau-ws.py`, `tests/relais-pareils.py`, `tests/enligne-course.py`, `tests/enligne-incidents.py`, `tests/enligne-cache.py`). Les numéros de ligne sont ceux de main avant mes corrections (les fichiers touchés par mes corrections sont dits).

## 1. Les points de la relecture T11 (`rapports/tour-56-T11-relecture.md`)

| T11 | État | Où |
|---|---|---|
| 1 nom refusé par les relais | **réglé** | nom neutre de langue : `reseau.js:22-27`, `relais.py:65-80`, traduit à l'affichage `enligne-ecran.js:25-29`, `enligne-page.js:163-167` ; une seule forme d'`EN_LIGNE_COULEURS` (objets `{id, hex}`) |
| 2 météo « nuageux » | **réglé** | l'écran lit `EN_LIGNE_METEOS` (`enligne-ecran.js:167`, textes `enligneMeteo_*` fr et en). Reste une branche morte `nuageux` dans `enligne.js:217` (jamais atteinte : `reglagesValides` la refuse), inoffensive |
| 3 bornes différentes | **réglé** | relais Python 30 / 8 / 16 (`relais.py:23`) = cœur ; `reseau.js:34-42` passe par le cœur ; le relais JS répond maintenant `erreur` (`reseau.js:173,180`) |
| 4 version | **réglé** (+ défaut nouveau N1) | `enligne.js:170-177`, `reseau.js:44-47`, `relais.py:71-72,326-329,388-391` (version du créateur de la salle) |
| 5 circuit et carte du navigateur | **réglé** | `enligne-page.js:314` ne passe rien, `preparerCircuit` dès `reglages` (`:101,115-118`), `enligne.js:204-211` |
| 6 `terminer()` jamais appelé | **réglé** | `enligne-page.js:121,285-287,297`, `enligne.js:438` (idempotent) |
| 7 branchement écran / page / réseau | **réglé** | `fabrique` `enligne-page.js:147-159`, `retour` `:102,120-125`, `retourSalle` `:294-307` |
| 8 mémoire d'un tricheur | **réglé** | `enligne.js:39,398-411`, test « (relecture) » |
| 9 validation de `cmd` / `controle` par le relais | **réglé** | `relais.py:302-316,273-278`, `reseau.js:48-50,198-204`. Détail : le relais Python laisse passer toute chaîne de 64 signes pour `h` (le client, lui, n'accepte que 1 à 10 chiffres, `enligne.js:409`) : sans conséquence |
| 10 « pas en avance » | **réglé** côté Python (`relais.py:309-314`, test garde-fous) ; **pas réglé** côté relais JS (`reseau.js:198` refuse un pas qui recule, pas un pas trop loin) : le relais JS ne sert qu'aux onglets d'un même navigateur, sans réseau |
| 11 salle commencée muette 2 h | **pas réglé, voulu** | `relais.py:43,482` |
| 12 mélange de l'ordre / ping / Origin | ordre : écart voulu, normalisé dans `relais-pareils` (`relais.py:431`) ; `ping` ne compte pas comme activité (`relais.py:250`) : voulu ; **Origin : réglé aujourd'hui** (N2) |
| 13 bornes dans `reseau.js`, `this` | **réglé** | `reseau.js:36-42,515-534` ; `transportDiffusion.ouvrir` (`:309-317`) n'utilise plus `this` |
| 14 minuteries et écouteurs | **pas réglé, sans effet** | `enligne-ecran.js:135,259,265` testent `ecran` avant d'agir ; `enligne-page.js:91-111` ajoute des écouteurs jamais retirés, mais `brancher` n'est appelé qu'une fois par client (`fabrique` `:151`). `ENLIGNE_PAGE.lancer` (`:74-78`, qui rappellerait `brancher`) n'est appelé nulle part : code mort |
| 15 podium décidé au même pas | **réglé** | `enligne.js:367-374` (`partie.fin`), `enligne-page.js:379-382` |
| 16 | **réglé** (voir 5, 6, 15) | |
| 17 `h` nombre / chaîne | **réglé** | `enligne.js:380,409`, `relais.py:275` |
| 18 `avance_max` fixe | **réglé** | `relais.py:314` (`max(avance_max, 2 × délai + 16)`) |
| 19 l'hôte qui abandonne rouvre la salle | **réglé** | `enligne-page.js:291-298` : `retour` seulement une fois `partie.fin` atteint et au podium, sinon `quitter` |
| 20 onglet caché | **fait, pas vérifié** | Worker `enligne-page.js:185-223` (`EN_LIGNE_FOND_WORKER`) ; jamais exercé par un vrai onglet caché (`rapports/tour-58-D-compte-rendu.md` : Playwright garde la page « visible ») |
| 21 `ENLIGNE_ECRANS` / noms du fil | **réglé** | `enligne-page.js:299`, `nomAffiche` `:106,163-167` |
| 22 délai adaptatif cru sur parole | **réglé** | le relais mesure lui-même (`relais.py:194-209`), test « mesure » |
| 23 | **réglé** | |

## 2. Défauts nouveaux

**Corrigés (un test chacun, règles du jeu inchangées)**

- **N1. Un joueur pouvait être refusé « version » pour un réglage qui lui est propre.** `EN_LIGNE.version().h` (`enligne.js:170-177`) mélange *tout* `REGLAGES`. Or trois réglages changent selon les options sauvegardées du joueur : `COMMENTAIRE_MODE` (le commentateur, `principal.js:2893`, pure interface), `DEGATS_ACTIF` et `DRAPEAUX_ACTIFS` (« Dégâts : non » et « Drapeaux : non » du paddock, `principal.js:75-76`). Un enfant qui avait coupé le commentateur ou les dégâts n'aurait jamais pu rejoindre ses amis (« Ton jeu n'est pas de la même version »). Corrigé : `EN_LIGNE_HORS_EMPREINTE: ['COMMENTAIRE_MODE']` (`donnees.js`, ignoré par `version()`, qui prend un `neuf` pour les tests) ; la page en ligne (`EN_LIGNE_COURSE`) n'applique plus les options dégâts / drapeaux sauvegardées (tout le monde a la même course). Test : « en ligne : (tour 59) la version ne dépend pas du commentateur… ». Choix à connaître : en ligne, les dégâts sont ceux de `donnees.js` (oui), quelle que soit l'option du joueur.
- **N2. Le relais ne regardait pas l'en-tête `Origin`** (T11 n° 12) : n'importe quelle page web pouvait ouvrir un WebSocket. Corrigé : `Config.origines` / `--origines` / `RELAIS_ORIGINES` (`relais.py`, défaut aucune restriction : rien ne change), documenté dans `serveur/LISEZMOI.md`. Test « origines » dans `tests/serveur.py` (page permise, autre site, script sans Origin : 403).
- **N3. `EN_LIGNE` faux n'était pas une vraie porte fermée.** `?enligne=1` et `?enlignecourse=…` ouvraient le jeu en ligne (boutons, salles par BroadcastChannel) même dans la version publiée (`principal.js:4,36-37`). Ajouté : `EN_LIGNE_ADRESSE` (`donnees.js`, **vrai par défaut : les essais et les tests marchent comme avant**), `EN_LIGNE.adresseAutorisee()` ; **à mettre à faux quand le jeu part chez Poki** (décision du Chef / du propriétaire). Tant que `EN_LIGNE` est faux, l'adresse ne fait alors plus rien (`PAGE_NUE` ignore aussi `enlignecourse`) ; `EN_LIGNE` vrai : les adresses des écrans marchent toujours. Test « EN_LIGNE_ADRESSE faux ferme la porte… ».

**Pas corrigés (décrits)**

- **N4 (moyen). `R.NIVEAU` n'est épinglé qu'à la création de la course** (`enligne.js:246-267`), alors que `ia.js:87,276,983` et `simulation.js:395` le relisent à chaque pas. Aujourd'hui sans effet : la page en ligne n'a ni division ni découverte, donc `NIVEAU` vaut le défaut chez tous, et la version refuse un `?niveau=` différent. Mais si le défaut de `donnees.js` n'était plus `EN_LIGNE_NIVEAU`, les IA en ligne ne seraient pas au niveau voulu (pas de désynchro : tous pareils). Remède : épingler `NIVEAU` pour toute la partie et le rendre dans `terminer()`.
- **N5 (moyen). Une fausse empreinte fait tomber la course de tous.** Un client modifié qui envoie un mauvais `controle` déclenche « désynchro » chez tous les autres (`enligne.js:340-345`). Inhérent au lockstep ; le relais pourrait comparer les empreintes des joueurs et sortir le minoritaire. Il ne peut pas tricher sur la course elle-même (commandes de 14 bits, le même nombre pour tous, un pas ne part que si tous les autres sont là) ; il peut seulement jouer des commandes parfaites ou retarder les siennes (les autres attendent 15 s au plus, `EN_LIGNE_ATTENTE_MAX_MS`).
- **N6 (faible). Les erreurs d'un écouteur sont avalées** : `reseau.js:409-413` les transforme en `erreur {raison:'ecouteur'}` que `enligne-page.js:85` ignore ; une exception dans un gestionnaire (par exemple `recevoirDepart` sans `reglages`) laisse la page muette, sans trace. À journaliser en console une fois les tests prêts à tolérer un message.
- **N7 (faible). La salle d'attente d'un relais de plus de 30 min silencieux expire** même si les joueurs pinguent (`relais.py:250` : le ping ne compte pas) ; le relais JS est plus souple (`vu` mis à jour à chaque message). Voulu, à décider avec l'hébergement.
- **N8 (faible). Relais Python : `reglages_valides` accepte `delai` jusqu'à 240** (`relais.py:98`) alors que le cœur n'en accepte que 120 (`enligne.js:189`) : le délai demandé par l'hôte est ignoré par les clients mais élargit la limite d'avance du relais. Sans effet réel (l'hôte légitime n'envoie pas de `delai`).
- **N9. Une 2e course dans la même page n'est pas testée de bout en bout** (`tests/enligne-course.py` s'arrête au retour à la salle et au « prêt » de nouveau). Le code la prévoit (`enligne-page.js:299-303`, `demarrerCourse` masque les anciens modèles `:327-328`, `terminer` comptés dans `enligne.js:163-164`), et le relais remet les compteurs à zéro au lancer (`relais.py:429`, `reseau.js:185,193`) ; rien ne le prouve par un test.
- **N10. Pas de test à 8 joueurs sur le vrai réseau** (les tests vont jusqu'à 4 joueurs en mémoire, 2 pages en vrai réseau).
- **N11. Le message `lancer` d'un hôte qui a mis plus d'IA qu'il n'y a de place** (les joueurs arrivent après le choix) est refusé `reglages` sans que l'écran le dise autrement que par `enligneErreur_reglages` : cohérent, pas un défaut.

## 3. Désynchro, triche, fuites, textes, `EN_LIGNE` faux

- **Désynchro** : aucun `Math.random`, `Date`, `performance.now`, `Math.pow`, `**` dans les chemins de la course en ligne (`enligne.js`, test « rien ne lit le hasard… »). Les `Date` / `performance.now` des fichiers en ligne servent aux horloges réseau et aux émotes. Ce qui reste hors de l'empreinte de contrôle (`enligne.js:84-97`) : `p.remisePrec`, la météo des pistes, `v.pneus` si l'objet n'a pas de clé numérique en tête : compensé par l'empreinte des voitures (profondeur 2). La désynchro éventuelle vient d'un réglage propre à un client : le seul filet est la version (N1 corrigé le rend juste).
- **Triche facile** : voir N5 et le tableau T11 n° 8-10, 18, 22 (garde-fous du relais, mémoire bornée côté client). Un joueur peut arriver par `?enligne=1` sur une version publiée : N3.
- **Fuites** : voir T11 n° 14 ; `etat.tampon` (`enligne-page.js:105`) ne se remplit que par des messages d'une course et se vide au démarrage ; `codes`, `miens`, `siens` sont nettoyés (`enligne.js:376,382`) ; le Worker du fond est terminé (`enligne-page.js:199-205`).
- **Textes fr / en** : les 98 clés `enl*` / `enligne*` existent des deux côtés (script de contrôle de cette relecture), y compris les clés fabriquées (`enl_refus_*`, `enligneRefus_*`, `enligneErreur_*`, `enligneMeteo_*`, `enligneCouleur_*`, `enligneEmote_*`, `enligneComment1-4`) ; `texte()` retombe sur l'anglais si une clé manque. Une erreur sans texte (`ferme`, `type`, `pas-hote`, `emote`…, côté client) est silencieuse : voulu (`enligne-ecran.js:281`).
- **`EN_LIGNE` faux** : aucun bouton (`enligne-ecran.js:316`), `JEU.enligne` nul, les fichiers se chargent mais ne s'exécutent pas (`visibilitychange` branché une fois, sans effet sans partie ; `sdk.js:80` ne change rien hors course en ligne). La seule porte était l'adresse : N3.

## 4. Les tests (ce qui couvre quoi)

`tests/test.html` « en ligne : » (18 tests de calcul pur, dont 2 nouveaux), `tests/serveur.py` (123 avec les 4 nouveaux : vrais clients, tous les refus, limites, grâce, délai, mesure, origines), `tests/reseau.html` + `reseau.py` (client réseau, 3 transports ; lent, plafond 400 s), `tests/reseau-ws.py` (deux pages contre `relais.py`), `tests/relais-pareils.py` (les deux relais répondent pareil), `tests/enligne-course.py` (court dans les annexes ; `ia` : 2 clients conduits par l'IA, 3 tours), `tests/enligne-incidents.py` (joueur parti, onglet caché simulé, Échap, pub, lenteur, désynchro, connexion perdue, erreur du relais). `tests/enligne-cache.py` échoue exprès (pas de vrai onglet caché sous Playwright), hors GitHub.

## 5. Ce que cette relecture n'a pas pu vérifier

Safari, Firefox (nos Math sont seulement comparées à celles de Chrome), un vrai onglet caché, une vraie connexion entre deux machines, la latence réelle, 8 joueurs, un téléphone, une 2e course dans la même page.
