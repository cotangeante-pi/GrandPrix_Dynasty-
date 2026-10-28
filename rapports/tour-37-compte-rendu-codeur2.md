# TOUR 37 — compte rendu du Codeur 2 : les sensations de conduite

Branche `codeur2`, partie de main fd4d07e, main caca6d2 fusionné.
Commit : 25fddf1 (+ fusion f9d2e9b) — passage GitHub 40767096567 sur f9d2e9b : **vert, 14 travaux sur 14**

## Ordres

**Aucun changement de physique.** On lit la voiture, on ne l'écrit jamais. `physique.js`, `ia.js` et `simulation.js` ne sont pas touchés. Un test le prouve : la même course de 6 IA sur le technique (dont le pilote neutre, `creerPilote(carte)`), 25 s. Elle est jouée une fois sans rien, et une fois avec, à chaque pas, les faits, `SON.maj`, `SON.mixage` et les effets (1228 faits vus). Tous les états des voitures sont identiques au bit près (JSON complet). Les empreintes de trajectoire épinglées passent toujours.

**Tout se coupe** avec le bouton « Effets de conduite : oui / non » du menu pause, sauvegardé (`SAUVEGARDE.option('effets')`). Une fois coupé :
- plus aucun fait ;
- ni secousse ni champ en plus ;
- ni fumée ni étincelles ;
- plus aucun son de sensation.

Le moteur et la dérive d'avant restent. M coupe tout le son, comme avant.

### Nouveau : `sensations.js` (calcul pur)

`SENSATIONS.faits(v, circuit, memo)` lit la voiture et donne :
- **vibreur**, de 0 à 1 : une roue est sur le vibreur d'un virage. C'est la même règle que le dessin (`SEUIL_COURBURE_VIBREUR`, `LARGEUR_VIBREUR`).
- **herbe**.
- **glisse** : la dérive.
- **blocage** : les roues avant au bord du blocage, c'est-à-dire frein ≥ 0,85 au-dessus de 14 m/s. C'est plus fort en braquant. La physique n'a pas de blocage, donc c'est le gros freinage qui le joue.
- **contact** et **choc** : un nouveau contact avec une voiture ou la barrière. Ils ne comptent qu'une fois.

`observer` est appelé une fois par image dans principal.js. Le son, la caméra et les effets lisent ensuite `de(v)`. Une voiture absente de l'image, au podium ou dans le résumé, n'a plus de faits.

### 1. Le son (`son.js`)

`SON.mixage(v, faits, monde, memo)` est pur et testé. `maj` ne fait que l'appliquer.
- **Passage de rapport** : en montant, une coupure de 60 ms (le moteur à 25 %), puis la note tombe d'elle-même avec le régime (boite.js). En descendant, aucune coupure.
- **Vibreurs** : un carré grave qui suit les bandes (4 × u / 3 m, de 35 à 140 Hz).
- **Herbe** : un bruit sourd.
- **Pneus** : la dérive comme avant. Au blocage, un crissement plus grave (1700 Hz).
- **Aspiration** : un souffle qui suit `v.aspiration`.
- **Voiture d'à côté** : la plus proche à moins de 60 m. Le volume suit la distance et la note suit son régime, avec l'effet Doppler (0,93 quand elle part devant, 1,40 quand elle arrive en face, bornes 0,7 à 1,4).
- **Pluie sur la carrosserie** : `METEO3D.etat().pluie`.

Les nouvelles voix ne sont créées qu'au premier geste. Il n'y a aucun fichier. Tous les réglages `SON_*` et `SENSATIONS_*` sont dans `donnees.js`.

### 2. L'image

**Secousse de la caméra** (`camera.js`, vues derrière et cockpit, et la seconde caméra à deux joueurs).
- Elle bouge la caméra, pas le point visé.
- Au plus 2 cm sur le vibreur et environ 8 cm au choc, éteinte en 0,2 s environ.
- Elle est faite de sinus, sans hasard.

**Champ de vision** : +0° jusqu'à 270 km/h, puis jusqu'à +3° à 324 km/h, au plus (`CHAMP_HAUTE_VITESSE`). C'est en plus du champ réglé par le propriétaire (60 → 66°). `poseDerriere` n'est pas changée et son test non plus.

**Fumée** au blocage et **poussière** dans l'herbe (`effets3d.js`).
- Un `InstancedMesh` de 160 bouffées au plus, couleur par bouffée.
- Seulement pour les voitures à moins de 150 m de la caméra.

**Étincelles** au contact (voiture ou barrière) : un `InstancedMesh` de 120 au plus.

Les effets ont leur propre tirage (Park et Miller), sans toucher à `hasard()`. Chaque effet fait un seul appel de dessin, et aucun quand il est vide.

### 3. Les tests

**tests/test.html** : 8 tests nouveaux, tous verts sur le Mac (moteur : 308 ✔, 0 ✘).
- le vibreur (bord d'un virage oui ; milieu, ligne droite, loin, au pas non), l'herbe, la glisse ;
- le blocage (droit, braqué, léger, lent), un contact et un choc comptés une fois, les faits oubliés hors de l'image ;
- tout coupé : rien ;
- chaque son sur son fait : passage monte et descend, vibreur qui suit la vitesse, blocage, herbe, aspiration, pluie ;
- la voiture d'à côté : distance, plus proche, Doppler dans les deux sens ;
- les effets : fumée, poussière, étincelles, rien sans fait, plafonds, mort, même tirage deux fois ;
- la secousse et le champ (bornes) ;
- la physique au bit près, et aucun AudioContext sans geste.

**tests/ecrans.py** : une nouvelle page, `index.html?course=3&ia=9&joueur=1&robot=1&circuit=test&test=sensations` (10/10 sur le Mac). Les boutons sont cliqués par le DOM, sans geste. Elle vérifie :
- toute une mise en route de course roulée sans AudioContext ;
- la fumée et les étincelles : 25 → 27 appels de dessin (+2, au plus 3), et effets vides ou coupés, la même chose qu'avant ;
- le bouton du menu pause (oui → non sauvegardé → oui) ;
- au premier geste (une touche J), le son démarre et la course continue sans erreur.

Capture : `tests/captures/sensations.png`.

## Ce que je n'ai pas pu vérifier

**L'écoute.** Personne n'a entendu les sons : le Chrome des tests n'a pas de sortie audio. Les volumes et les fréquences sont des premiers réglages, **à essayer par le propriétaire** : la coupure du passage, le grondement du vibreur, le Doppler.

**La secousse et le champ** sont à juger en conduisant, eux aussi : `SECOUSSE_*` et `CHAMP_HAUTE_VITESSE` sont dans `donnees.js`.

**La fumée** est en bouffées simples, faites par le code (icosaèdres gris translucides). Elle est à regarder en vrai.

Réévalue.
