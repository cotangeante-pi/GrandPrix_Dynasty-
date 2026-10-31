# Grand Prix Dynasty — la fiche pour Poki (À VALIDER par le propriétaire)

Ce sont des propositions du Codeur 3 (tour 37b, 2026-10-29 ; mises à jour au tour 37k, 2026-10-31). Rien ici n'entre dans le zip du jeu.
- Aucun nom de vraie marque : pas de « F1 » ni de « Formula 1 », pas de vraie écurie ni de vrai pilote. Les circuits ont des noms inventés (Monzo, Spaa, Suzuko…).
- Les captures 16:9 (1920×1080) sont fabriquées par `python3 poki/captures.py`, dans `poki/captures/` :
  - 1-depart-feux ;
  - 2-bataille ;
  - 3-pluie ;
  - 4-podium ;
  - 5-paddock ;
  - 6-glissade (la voiture vivante en légende : l'arrière qui part, les traces de pneus, la fumée) ;
  - 7-aides (l'écran « Aides au pilotage », avec le bonus annoncé).
- Chaque capture existe en `-fr` et en `-en`.

---

## English (À VALIDER)

**Title:** Grand Prix Dynasty

**Short description (≈ 120 characters):**
Race open-wheel cars, win the championship and build a racing dynasty, from your first Grand Prix to your heirs’ titles.

**Long description:**
Take the wheel and start from the back of the grid. Qualify, nail the start when the five red lights go out, fight wheel to wheel with 19 rivals and decide when to pit for fresh or wet tyres as the rain rolls in.

Every Grand Prix counts. Earn points and prize money, upgrade your car in the garage, beat your teammate in the season-long duel and talk to the other drivers: apologise, make peace, ask them to let you through… or start a rivalry. Team bosses watch your results: sign better contracts, become the team’s lead driver and win the title.

When your career ends, your story goes on: your heir takes over, and the newspaper album keeps every front page of your dynasty.

- A full championship on 12 tracks around the world, with weather, pit stops and team orders
- Short lessons to learn the start, braking, overtaking, the pits and the rain
- Split-screen 2-player mode and a tournament mode on the same keyboard
- Gamepad support with rumble (you feel the kerbs, the slides and the hits), an ideal racing line for beginners, four difficulty levels (Beginner to Legend)
- At Expert and Legend level the car comes alive: brake while turning and the rear steps out. Catch the slide, leave tyre marks… or spin
- Driving aids, one by one (steering, braking, anti-lock, traction), chosen before the race: switch them off and earn a bonus of up to +28% prize money
- Eight short lessons, the last one to tame the living car; a sound mixer for engine, ambience and commentary

**Controls:**
- ↑ accelerate · ↓ brake · ← → steer
- Start: hold ↑ in the green zone, release when the lights go out, then press ↑ again
- Space: back on track · C: camera · Tab: watch another car · M: sound · Esc: pause
- 2 players: player 1 W A S D (E back on track), player 2 the arrows (Enter back on track)
- Gamepad: triggers to accelerate and brake, stick to steer, Start to pause (it rumbles on kerbs, slides and hits)
- Driving aids: the 🛞 button on the title screen, in the paddock, before a quick race or a lesson

---

## Français (À VALIDER)

**Titre :** Grand Prix Dynasty

**Description courte (≈ 120 caractères) :**
Pilote des monoplaces, gagne le championnat et fonde une dynastie de la course, de ton premier Grand Prix aux titres de tes héritiers.

**Description longue :**
Prends le volant et pars du fond de la grille. Qualifie-toi, réussis ton départ quand les cinq feux rouges s’éteignent, bats-toi roue contre roue avec 19 rivaux et choisis le bon moment pour passer au stand, pour des pneus neufs ou des pneus pluie quand l’averse arrive.

Chaque Grand Prix compte. Gagne des points et des primes, améliore ta voiture au garage, bats ton coéquipier dans le duel de la saison et parle aux autres pilotes : excuse-toi, fais la paix, demande-leur de te laisser passer… ou lance une rivalité. Les patrons d’écurie regardent tes résultats : signe de meilleurs contrats, prends la tête de l’écurie et décroche le titre.

Quand ta carrière s’arrête, ton histoire continue : la relève prend le volant, et l’album des journaux garde toutes les unes de ta dynastie.

- Un championnat complet sur 12 circuits du monde, avec la météo, les arrêts au stand et les consignes d’écurie
- De courtes leçons pour apprendre le départ, le freinage, le dépassement, les stands et la pluie
- Un mode 2 joueurs en écran partagé et un mode tournoi sur le même clavier
- La manette qui vibre (on sent les vibreurs, les glissades et les chocs), une trajectoire conseillée pour débuter, quatre niveaux de difficulté (de Débutant à Légende)
- En expert et en légende, la voiture devient vivante : si tu freines en tournant, l'arrière part. Rattrape la glissade, laisse des traces de pneus… ou fais un tête-à-queue
- Les aides au pilotage, une par une (direction, freinage, anti-blocage, motricité), choisies avant la course : coupe-les et gagne jusqu'à +28 % d'argent
- Huit leçons courtes, la dernière pour dompter la voiture vivante ; un réglage du son pour le moteur, l'ambiance et le commentateur

**Commandes :**
- ↑ accélérer · ↓ freiner · ← → tourner
- Départ : tiens ↑ dans la zone verte, lâche quand les feux s’éteignent, puis réappuie sur ↑
- Espace : retour en piste · C : caméra · Tab : suivre une autre voiture · M : son · Échap : pause
- 2 joueurs : joueur 1 Z Q S D (E retour en piste), joueur 2 les flèches (Entrée retour en piste)
- Manette : gâchettes pour accélérer et freiner, stick pour tourner, Start pour la pause (elle vibre sur les vibreurs, les glissades et les chocs)
- Aides au pilotage : le bouton 🛞, sur l'écran titre, au paddock, avant une course rapide ou une leçon

---

## À vérifier par le propriétaire avant l'envoi
- Le nombre de rivaux (19) et de circuits (12), ainsi que les quatre niveaux de difficulté (de Débutant à Légende) : je les ai relevés dans le jeu le 2026-10-29.
- Le genre de jeu chez Poki : « Racing », avec les étiquettes « Car », « 2 Player », « Sports ».
- Le jeu se joue au clavier et à la manette. Le tactile n'est pas prévu : il faut le dire à Poki (« desktop only »).
- **Ce que montrent les captures (2026-10-29), à corriger avant l'envoi** :
  - Les rivaux et les écuries portent encore leurs noms provisoires (« Pilote 2 », « Écurie 1 » ; « Driver 2 », « Team 1 »), parce que `NOMS_PILOTES` est vide dans `donnees.js`. Sur la capture du paddock, des noms inventés feraient bien plus vrai.
  - (Réglé au tour 37c : l'espace avant les deux-points en anglais, et le vide en haut du panneau des classements du paddock. Les captures ont été refaites.)
  - Les noms proposés sont dans `poki/noms-a-valider.md`.
  - Les captures gardent l'interface de course, comme dans le vrai jeu. Seule la bulle des aides est masquée.
