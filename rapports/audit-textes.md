# Audit des textes — 2026-10-22

Commit audité : `73fdbc9` (main). Règle (CLAUDE.md) : toutes les chaînes visibles passent par `textes.js`, anglais par défaut, français si le navigateur est en français ; le nom « Grand Prix Dynasty » seulement par sa clé (et dans `<title>`), jamais « F1 » ni « Formula 1 ».

Aucun fichier du jeu n'a été modifié. Test : `tests/textes.html` (75/75).

## 1. `textes.js`

- 52 clés en anglais, 52 en français, les mêmes. Aucune valeur vide. `colonnesResultats` : 6 éléments dans les deux langues. Les trous `{s}` / `{n}` sont les mêmes.
- Aucune valeur ne contient « F1 », « Formula 1 » ou « Formule 1 ». « Dynasty » n'apparaît que dans `nomDuJeu`.
- Toutes les clés demandées par le code existent.
- Clés jamais utilisées par le code : `chrono`, `nomDuJeu` (le `<title>` est écrit en dur dans `index.html`, ce que CLAUDE.md permet, mais `document.title` n'est jamais rempli depuis la clé).
- `texte()` : anglais par défaut, français dès que `navigator.language` commence par `fr` (fr, fr-FR, fr-CA, FR-be), `?lang=en|fr` force la langue, une langue inconnue est ignorée. Une clé absente de la langue retombe sur l'anglais ; une clé inconnue donne `undefined` (sans erreur, mais le joueur verrait « undefined »).

## 2. Textes visibles écrits en dur

Classés du plus important au moins important. « Clé proposée » : à ajouter dans `textes.js`.

| # | Fichier:ligne | Texte en dur | Clé proposée | Anglais | Français |
|---|---|---|---|---|---|
| 1 | `donnees.js:112` | `'Pilote joueur'` (nom du joueur, affiché au classement du championnat) — **français affiché aussi en anglais** | `nomJoueur` | `You` | `Toi` |
| 2 | `donnees.js:124` | `'Pilote 1'` … `'Pilote 19'` (noms provisoires des rivaux, classement du championnat) — **français en anglais** | `pilote` (avec `{n}`) | `Driver {n}` | `Pilote {n}` |
| 3 | `donnees.js:117-120` | `'Écurie 1'` … `'Écurie 10'` (classement des écuries) — **français en anglais** | `ecurie` (avec `{n}`) | `Team {n}` | `Écurie {n}` |
| 4 | `interface.js:156` | `' n°' + x.numero` (cartes du podium) — **« n° » affiché en anglais** | `numero` (avec `{n}`) | `No. {n}` | `n°{n}` |
| 5 | `donnees.js:338`, `donnees.js:358` | noms de circuits `'Test'`, `'Technique'`, affichés dans le titre du championnat (`interface.js:198` via `principal.js:96`) | `circuitTest`, `circuitTechnique` (ou `nomCircuit_<id>`) | `Test track`, `Technical` | `Circuit d’essai`, `Technique` |
| 6 | `interface.js:198` | le titre `Grand Prix 3 / 12 — Test` assemblé en dur (`' / '`, `' — '`, l'ordre des mots) | `titreGrandPrix` (avec `{i}`, `{n}`, `{circuit}`) | `Grand Prix {i} / {n} — {circuit}` | `Grand Prix {i} / {n} — {circuit}` |
| 7 | `interface.js:99` | `'P' + place + ' / ' + total` (place du joueur dans la tour) | `placeCourse` (avec `{p}`, `{n}`) | `P{p} / {n}` | `P{p} / {n}` |
| 8 | `interface.js:88`, `121`, `173`, `246` | l'unité `' s'` collée aux écarts et pénalités (`+0,8 s`, `✂ +5 s`, `Penalties +5 s`) ; aussi `const penalite` vers la ligne 128 (`'+' + p + ' s ✂'`) | `secondes` (avec `{s}`) | `{s} s` | `{s} s` |
| 9 | `interface.js:12`, `75` | les temps (`1:02.345`) et les secteurs (`S1 23.456`) gardent toujours le point, alors que les écarts utilisent `texte('virgule')` (`+0,8 s`) : en français, le même écran mélange `1:02.345` et `+0,812 s` | réutiliser `virgule` | `.` | `,` |
| 10 | `index.html:2` | `<html lang="en">` jamais changé en français | — (`document.documentElement.lang = LANGUE` au démarrage) | `en` | `fr` |
| 11 | `index.html:7` | `<title>Grand Prix Dynasty</title>` — permis par CLAUDE.md ; proposition : `document.title = texte('nomDuJeu')` au démarrage pour que la clé serve | `nomDuJeu` (existe) | — | — |
| 12 | `principal.js:311`, `principal.js:323` | affichage `?debug=1` : `'dérive '`, `' g · voiture '`, `' triangles, '`, `' appels'`, `' i/s · '` — en français seulement | aucune : outil de développement, à laisser hors traduction (à décider par le Chef) | — | — |
| 13 | `reglages.js:78` | noms des curseurs de `?reglages=1` = noms des clés de `REGLAGES` | aucune : outil de développement | — | — |

**Total : 11 textes en dur visibles par le joueur** (lignes 1 à 11 ; la ligne 8 compte 5 endroits), plus 2 dans les outils de développement (lignes 12-13).

Les symboles seuls ne sont pas comptés (ils ne se traduisent pas) : `🔊`/`🔇` (`principal.js:416`, `index.html:16`), `✂`, `★`, `▲`/`▼`, `–:––.–––`, `·`, `🏁` (`style.css:241`), le `1` initial de `#rapport` (`index.html:14`).

## 3. Le nom du jeu

- Dans `textes.js` : seulement `nomDuJeu` = `Grand Prix Dynasty` (en et fr).
- Ailleurs : seulement `<title>` de `index.html` (permis).
- « F1 » n'apparaît dans aucun texte visible : seulement dans des commentaires (`donnees.js:16`, `voiture3d.js:1`, `index.html:6`), ce qui est permis.

## 4. Ce qui n'a pas été vérifié

- L'écran d'accueil n'existe pas encore : on ne peut pas vérifier que le nom y passe par sa clé.
- Les captures en français (`?lang=fr`) n'ont pas été regardées : la longueur des textes français dans les boutons à 960×600 reste à voir.
