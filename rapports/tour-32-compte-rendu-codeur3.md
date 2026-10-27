TOUR 32 — compte rendu du Codeur 3 (branche codeur3)
Commit : f9f9c47 — passage GitHub 40577838880 : les 10 travaux verts.
Ordres : 1 fait / 2 fait.

## 1. La grande passe interface, première partie (étape 11)
- **Le thème télé**, défini une fois en variables CSS (`--tv-*`), dans un bloc à la fin de `style.css` :
  - les polices : texte, et titres serrés ;
  - les couleurs : le rouge de la chaîne, l'or, le bleu du joueur ;
  - le voile des écrans, les panneaux, les boutons, la ligne du joueur ;
  - les coins, les ombres, le halo de survol et les durées.
- **Ce qui change sur tous les écrans** (`.ecran`) :
  - le voile en dégradé ;
  - les titres en capitales italiques serrées, avec le bandeau rouge dessous ;
  - les boutons en plaques sombres avec un liseré rouge, et le bouton principal en rouge plein ;
  - les cartes et les lignes de liste sur le même panneau : garage, contrats, sponsors, fiche, interview, calendrier, arbre, Entre amis, classement de fin de saison.
  - La une garde sa police de journal. La cérémonie garde le podium 3D visible (pas de voile), avec la police des titres.
- **Les transitions** :
  - chaque écran arrive en fondu (180 ms) et son titre glisse (230 ms) ;
  - c'est de l'opacité, plus un glissement du titre seulement : rien ne bouge sous un clic ;
  - tout est coupé avec prefers-reduced-motion.
- **Les résultats animés** :
  - les lignes des résultats arrivent une à une (`--i` posé par `interface.js`, 35 ms d'écart) ;
  - au paddock, au retour d'une course, les lignes du classement arrivent à leur rang et les points montent de 0 à leur valeur.
  - Le vrai nombre reste dans la page : un compteur CSS (`@property --tv-n`) compte par-dessus. Le texte lu par les tests ne change jamais.
- **Tests** (`tests/ecrans.py`) :
  - chaque écran de l'audit anglais vérifie le thème télé : le voile, la police des titres, une arrivée de moins de 250 ms ;
  - l'audit tourne maintenant aussi en 1280×720, en plus de 960×600 : aucun débordement, sans défilement ;
  - la montée des points, les lignes animées, et plus aucune animation avec prefers-reduced-motion.
- **Un test changé** : les mots français témoins sont cherchés sans tenir compte des capitales. `innerText` rend les titres en capitales, et « Post-race interview » devenait « POST-RACE INTERVIEW ». Le test n'est pas affaibli : il trouve maintenant aussi les mots français écrits en capitales.
- **Captures avant/après** (1280×720 et 960×600) dans `rapports/captures-tour32/` : paddock, garage, calendrier, fiche, album, fin de saison. Les « avant » sont sur le circuit Technique, les « après » sur Yas Marino : les 12 tracés sont arrivés sur main entre les deux.

## 2. Le paddock en vrai écran d'accueil
- **À gauche, le prochain Grand Prix en grand** : le surtitre « Prochain Grand Prix », le titre (le même texte qu'avant), la carte 2D du circuit (`CARTE2D`, le même dessin que l'aileron), la maison du Grand Prix à domicile, et les points gagnés.
- **En dessous, toi** :
  - ta place au championnat et l'écart au leader (« Championnat : P7 · 74 pts · à 109 pts du leader », « en tête » si tu l'es) ;
  - le duel, le solde, le sponsor et la réputation.
- **À droite, les classements** pilotes et écuries ; un clic ouvre toujours la fiche.
- **En bas, les boutons rangés par usage** :
  - Course : Course suivante ;
  - Équipe : Garage, Sponsors, Mon casque ;
  - Saison : Calendrier, Album, Arbre ;
  - À plusieurs : Entre amis.
  - Tous les identifiants sont gardés.
- `INTERFACE.remplirPaddock` est dans `interface.js`. `circuitPaddock()` est dans `principal.js` : il construit le circuit comme `montrerAileron` et le garde une fois construit. Les textes sont dans `textes.js` (en + fr).
- **Tests** :
  - le surtitre, le titre, la carte dessinée (pixels), la place et l'écart, les quatre groupes et leurs boutons dans l'ordre ;
  - tout tient dans l'écran en 960×600 et en 1280×720 ;
  - la maison seulement si le prochain Grand Prix est chez toi.

## Sortie des tests
- GitHub 40577838880 : moteur, courses, stands, consignes, ecrans ×4, annexes et paquet, tous verts.
- Sur le Mac, sous le verrou :
  - ecrans filtrés `gp=12&lang=en` (960 et 1280) : 102/102 après correction ;
  - `championnat=1&tours=1&robot=1 1280` : 70/70 ;
  - `robot=1&lang=en 1280` : 22/22 ;
  - textes 643/643.
- Le premier passage (40576413378) avait 1 échec, le « POST-RACE INTERVIEW » ci-dessus, corrigé dans f9f9c47.

## Ce que je n'ai pas pu vérifier
- Le rendu sur une vraie machine. La police des titres (« Arial Narrow », « Roboto Condensed ») dépend du système : sur le Mac c'est Arial Narrow, sur Linux une autre ; les tests de débordement passent sur les deux.
- La beauté : à juger par le propriétaire sur les captures.

Réévalue.
