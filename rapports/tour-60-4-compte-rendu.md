TOUR 60 — compte rendu du Codeur 4 (l'auto-guidage du téléphone, branche `guidage-60`)
Commit : 0b4067b (dernier code, 18/18) ; avant la revue du Chef : a62069d (18/18) ; ce compte rendu complété ensuite en [skip ci]
Ordres : 1 fait / 2 fait / 3 fait / 4 fait / 5 fait (lien du passage plus bas)

## Le principe

Le zigzag au téléphone vient d'une boucle trop forte et en retard : le volant (l'inclinaison) est imprécis, le joueur voit tard,
sur-corrige, la voiture répond 0,25 s après (STABILITE_LACET), il corrige encore plus fort de l'autre côté. Freiner ne sert à rien :
il faut casser la boucle. Donc (tout dans `assistance.js` : `guider`, `secours`, `relancer`, `droiture` ; branché dans `principal.js` :
`guiderJoueur` dans `aiderJoueur`, `secoursJoueur` là où Espace est traité) :

1. **Reconnaître** : le volant du joueur change franchement de côté (|direction| ≥ 0,25) 2 fois à moins de 2 s ; ou 1 fois avec le nez
   qui part à plus de 8° de la piste (cap + rotation prévue sur 0,4 s, la rotation du moment et celle que demande le volant) ; ou d'emblée
   si le nez part à plus de 15° (rotation du moment seule : un coup de volant qui jette la voiture dehors) ; ou la voiture glisse de plus
   de 6°. Un changement de file (un coup d'un côté, un de l'autre pour se redresser) ne déclenche rien.
2. **Remède** : en 0,15 s, la direction passe à un pilote qui tient le cap de la piste (écart de cap refermé en 0,3 s, rotation amortie
   × 0,7 ; le braquage vient du modèle de la physique, rotation = u·tan(braquage)/empattement). Il garde la file où est la voiture.
   **Jamais de gaz ni de frein.** Guidé, le volant du joueur ne braque plus : **tenu** plus de 0,4 s d'un côté, il demande un cap qui
   grandit jusqu'à 12° en 1,5 s. C'est ce qui rend la boucle stable : les coups alternés du zigzag ne demandent rien, un volant tenu
   (revenir de l'herbe, changer de file) passe, en douceur. (Essayé et écarté : laisser le volant braquer avec un cap borné à 4° → petit
   zigzag qui dure ; moyenner le volant sur 0,5 s → pire, le retard en plus déstabilise.)
3. **Seulement en ligne droite** : courbure devant (60 m ou 2,5 s) : 1 sous 1/1500, 0 à 1/600 ; rien de 200 m avant l'entrée des stands
   jusqu'à leur sortie (on y tourne exprès).
4. **Rend la main** en 0,5 s : droit (< 1,5°) depuis 0,8 s, volant du joueur au milieu, sans nouveau zigzag.
5. **Secours** : voiture perdue quand même (cap > 80° de la piste, ou glisse > 30°, ou 0,5 s d'herbe en ligne droite ; pendant 0,3 s) →
   `remettreSurPiste` (le code d'Espace, inchangé), puis `v.u` = la vitesse d'avant le trouble (dernière vitesse stable), bornée par
   `vitesseSure` (celle du freinage assisté) ; 3 s entre deux secours. Espace au clavier et ↩ au doigt : comme avant (à l'arrêt).

Où : seulement au volant d'un écran tactile (`TACTILE.guidageVoulu`), course, qualification, tournoi, défi ; jamais sur ordinateur, à
deux, en ligne, robot ou IA. `TACTILE_GUIDAGE` et `TACTILE_GUIDAGE_SECOURS` faux = au bit près comme avant (testé). Tous les seuils
`GUIDAGE_*` dans `donnees.js`. Le joueur le coupe : « Auto-guidage : oui / non » dans la pause et dans ⚙ Réglages (carte Volant),
explication en titre, sauvegardé (`tac_guidage`) ; une bulle d'aide la première fois qu'il prend la main (`aide_guidage`). Textes fr/en.

## Sortie des tests (sur le Mac, sous le verrou)

- `tests/guidage.html` (nouvelle page, annexes de lancer.py) : RESULTAT 18/18 (Chrome et JavaScriptCore)
- `tests/test.html?filtre=auto-guidage` : 3/3 (le nouveau test « auto-guidage du téléphone » : sans tactile, réglages faux, à deux, en
  ligne, robot, coupé par le joueur = cibles et voiture d'avant au bit près ; au volant, guidé)
- `tests/aides.html` : 30/30 (la bulle `guidage`) ; `tests/textes.html` : 2170/2170
- `tests/ecrans.py` : `test=tactile` 640 (fr) 23/23, 960 (en) 23/23, `test=tactile-reglages` 58/58 (nouveaux : bouton de la pause et des
  Réglages ≥ 40 px, coupé, gardé après rechargement ; capture `tactile-pause-640.png` relue : la rangée « Auto-guidage : oui » tient)
- GitHub : **18/18 vert** sur a62069d : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44633917192 (annexes : guidage.html 18/18 ; moteur : le test « auto-guidage du téléphone » ✔)

## Mesures (tests/guidage.html)

Un joueur simulé au téléphone, passé par le vrai volant du jeu (TACTILE.braquage : zone morte 10°, plein 30° ; TACTILE.lisser) : il vise
sa file (ramenée sur le goudron), avec 0,3 ou 0,45 s de retard, un gain de 3, 4 ou 6 (il sur-corrige ; il passe la zone morte qu'il
connaît), un tremblement de la main (σ 2,5 à 4°), et un coup de volant de 18 à 24° pendant 0,35 s ; GAZ tenu, 8 s, départ 216 km/h :

- sans guidage : cap jusqu'à 17 à 37° de la piste, 32,4 s d'herbe en tout (18 joueurs), 108 à 268 km/h à la fin ;
- avec : **droit (cap < 2°, rotation calme 0,5 s) 0,30 à 1,44 s après que le guidage a pris la main** (0,85 à 2,16 s après le coup
  de volant), cap max 4,6 à 7,1°, **0 s d'herbe**, 316 km/h à la fin (aucune vitesse perdue : les zigzags, eux, freinent) ;
- 72 zigzags de plus (graines 4 à 9) à 140 km/h : droit en 1,27 s en médiane, 1,96 s au pire ; à 288 km/h : 1,52 s en médiane,
  2,49 s au pire (le braquage y est plus petit ; seuils du test : 1,6 s et 2,6 s) ; herbe 48 → 0 s et 67 → 0 s ;
- 5 changements de file exprès (0,1 à 0,3 de volant, 0,25 à 0,6 s, 1 à 6 m) : jamais allumé, cibles jamais touchées, file identique ;
- volant tenu à fond pendant le guidage : cap 0,7° → 10,3° en 2,1 s (on peut revenir ou tourner) ;
- en virage (200 m de rayon), un zigzag : rien de touché ; à 2,5 s d'un virage : droiture 0 ;
- secours : tête-à-queue en ligne droite (110°) relancé à 230 km/h, sa vitesse d'avant, en 0,30 s, dans le sens de la piste, au milieu ;
  sortie dans l'herbe : relancée à 233 km/h, 0,8 s d'herbe (sans secours : 3,6 s d'herbe, bloquée à 0 km/h) ; borne : devant un virage,
  la vitesse rendue est celle de `vitesseSure`.

## Revue du Chef : la place du secours (commit 0b4067b, GitHub 18/18 : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44638439098)

Demandé : à ~230 km/h, ne jamais poser la voiture sur ou juste devant/derrière une IA, et ne jamais faire gagner place ni temps.
Fait (`assistance.js` : `placeLibre`, `relancer(v, circuit, carte, u, autres)`, `reporter` ; `principal.js` : `secoursJoueur` passe les
voitures du plateau ; `GUIDAGE_POSE_*` dans donnees.js) :
- **la place** : le point d'Espace ou **en arrière, jamais plus loin** ; le milieu, puis les files à ±3 et ±4,5 m (à 1,5 m du bord au
  plus), puis en reculant de 10 m en 10 m jusqu'à 120 m. Libre = aucune autre voiture dans la même bande (3,5 m de côté) à moins de 30 m
  devant ni 30 m derrière (plus si celle de derrière va plus vite : ce qu'elle rattraperait en 2 s). Posée par `placerSurPiste` (le code
  d'Espace), dans le sens de la piste ;
- **la vitesse** : celle d'avant, bornée par `vitesseSure` et par la vitesse de la voiture qui roule devant dans la bande à moins de 120 m ;
- **pas de place du tout** : rien ne bouge, le secours réessaie au pas suivant.

Mesures (tests/guidage.html, 21/21) : IA au point même → posée file −4,5 m, 0 chevauchement en 3 s ; 15 m devant → idem ; 15 m derrière
et plus rapide (270 km/h) → idem ; à côté et au milieu → idem ; trois files prises (5 IA) → posée 30 m en arrière, file +3 m, 216 km/h
(plafonnée par l'IA de devant), 0 chevauchement ; IA 60 m devant à 144 km/h → posée au milieu à 144 km/h ; piste bouchée sur 150 m →
pas posée, faite au premier pas où la place se libère. **Pas de gain** : la même voiture, même départ, même GAZ, avec et sans faute :
après un tête-à-queue relancé (1,29 s), elle n'est jamais devant (au mieux à égalité avant la faute), 34,7 m derrière à 6 s ; après une
sortie dans l'herbe relancée (2,65 s), 39,7 m derrière. La pose n'étant jamais plus loin que le point d'Espace, aucun virage n'est coupé
(pas de pénalité de limites).

## Ce que je n'ai pas pu vérifier

- **Jamais essayé sur un vrai téléphone** : le joueur simulé n'est pas un enfant. La sensation (« le volant repris » est-il gênant ?
  12° tenus suffisent-ils pour revenir de l'herbe ? 15° de nez déclenchent-ils trop tôt pour un joueur vif ?) est à essayer par le
  propriétaire ; tous les seuils sont dans `donnees.js`.
- Le secours remet la voiture au milieu de la piste à pleine vitesse : comme Espace, il peut la poser près d'une IA (pas vu, pas testé
  avec 20 voitures).
- Pas de course entière mesurée au doigt avec et sans guidage sur les 12 tracés (seulement le circuit de test des tests d'écran).
- Fichiers partagés touchés (blocs ajoutés, rien reformaté) : donnees.js, textes.js, principal.js, tests/test.html, tests/ecrans.py,
  tests/lancer.py, aides.js, tests/aides.html, CLAUDE.md.

Réévalue.
