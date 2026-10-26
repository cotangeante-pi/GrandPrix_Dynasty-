TOUR 31 — compte rendu du Codeur 1 (2026-10-26, 16h47 → 17h40)

Commit : pneus **e8c6f7d** (avec origin/main) — GitHub **40404990865 : vert** (9 travaux, 4 min 52 s). Avant : 19413b8 (ordre 1), passage 40398942545 vert en 4 min 49 s.
Ordres : 1 fait / 2 fait.

## Ordre 1 — la suite GitHub en parallèle
- `.github/workflows/tests.yml` : une matrix de 9 travaux (`fail-fast: false`) : moteur, courses (courses.html + ?ailerons=1), stands, ecrans-1 à ecrans-4 (`ECRANS_TRANCHE=k/4` : une page sur 4, chacune a son propre contexte de navigateur), annexes, paquet. Même Chrome, `LANG=fr_FR.UTF-8`. Les captures : un artefact par travail (`captures-<nom>`). Le passage n'est vert que si les 9 le sont.
- `tests/lancer.py` : « stands » devient une partie à elle (`python3 tests/lancer.py stands`) ; « courses » = courses.html + courses.html?ailerons=1. `tests/ecrans.py` : `ECRANS_TRANCHE=k/n`.
- Durées (passage 40404990865) : moteur 91 s, courses 166 s, stands 289 s (la page 279 s : sous 5 min, pas découpée), ecrans 141 / 239 / 117 / 123 s, annexes 83 s, paquet 47 s ; le passage entier 4 min 52 s (contre ~19 min en un seul travail). Un passage précédent : 4 min 49 s.

### Pour CLAUDE.md « Aller plus vite » (à reporter par le Chef)
L'état du passage se lit toujours avec `runs?head_sha=…` (status, conclusion : `success` seulement si les 9 travaux le sont). Ensuite, les travaux et le journal de chacun :
```
# les travaux du passage RUN : nom, conclusion, durée, id
curl -s -H "Authorization: Bearer $T" "$A/actions/runs/RUN/jobs?per_page=50" | python3 -c "import sys,json,datetime as D;f=lambda s:D.datetime.strptime(s,'%Y-%m-%dT%H:%M:%SZ');[print(x['name'],x['conclusion'],int((f(x['completed_at'])-f(x['started_at'])).total_seconds()) if x['completed_at'] else '-',x['id']) for x in json.loads(sys.stdin.read(),strict=False)['jobs']]"
# le journal d'un travail (JOB = son id) : « PARTIE OK : x » s'il est vert, « ÉCHECS » sinon (plus de « TOUT PASSE » : chaque travail lance une partie)
curl -sL -H "Authorization: Bearer $T" "$A/actions/jobs/JOB/logs" | grep -E "✘|RESULTAT|⏱|PARTIE OK|ÉCHECS"
```
Sur le Mac, rien ne change : `tests/lancer.py moteur|courses|stands|ecrans|annexes|paquet`, sous le verrou ; `ECRANS_TRANCHE=1/4 python3 tests/ecrans.py` pour une tranche.

## Ordre 2 — les IA sur les 12 tracés (simulation seulement, rien de branché)
`tests/officiels.html` (dans les annexes, 64 s sur GitHub) : pour chaque tracé de circuits-officiels-a/b.js, la carte des IA (EXIGÉ), une IA seule 2 tours sans barrière ni herbe (EXIGÉ), 10 IA 3 tours sans pneus et 10 IA 4 tours avec les pneus et un arrêt chacune au tour 2 ou 3 (mesurés, affichés). `?circuits=monoco,spaa` pour quelques-uns. Résultat : 25/25.

| Circuit | km | virages | carte | IA seule, 2e tour | seule barr./herbe/coupes | 10 IA sans pneus : chocs | herbe | coupes | dépass. | avec pneus + arrêt : chocs | herbe | coupes | arrêts | muret | pén. vitesse |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Monoco | 3.262 | 15 | 0.7 s | 75.26 s | 0/0/0 | 0 | 673 | 0 | 3 | 0 | 934 | 0 | 10/10 | 0 | 0 s |
| Silverstoun | 5.574 | 13 | 0.9 s | 93.77 s | 0/0/0 | 1 | 0 | 0 | 3 | 0 | 0 | 0 | 10/10 | 0 | 0 s |
| Monzo | 5.506 | 9 | 0.9 s | 85.98 s | 0/0/0 | 0 | 42 | 0 | 2 | 0 | 69 | 2 | 10/10 | 0 | 0 s |
| Spaa | 6.879 | 14 | 1.0 s | 118.23 s | 0/0/0 | 2 | 0 | 0 | 3 | 0 | 95 | 0 | 10/10 | 0 | 0 s |
| Suzuko | 6.200 | 17 | 0.9 s | 103.52 s | 0/0/0 | 1 | 477 | 0 | 1 | 0 | 172 | 0 | 10/10 | 0 | 0 s |
| Interlagas | 4.387 | 13 | 0.7 s | 79.58 s | 0/0/0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 10/10 | 0 | 0 s |
| Montréol | 4.359 | 9 | 0.6 s | 78.83 s | 0/0/0 | 0 | 403 | 0 | 1 | 0 | 0 | 0 | 10/10 | 0 | 0 s |
| Melbourn Park | 5.262 | 8 | 0.8 s | 81.42 s | 0/0/0 | 0 | 43 | 0 | 2 | 0 | 0 | 0 | 10/10 | 0 | 0 s |
| Barcelana | 4.670 | 12 | 0.7 s | 81.53 s | 0/0/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10/10 | 0 | 0 s |
| Bahrayn | 5.451 | 12 | 0.8 s | 100.80 s | 0/0/0 | 0 | 148 | 0 | 0 | 0 | 0 | 0 | 10/10 | 0 | 0 s |
| Singapura | 4.942 | 14 | 0.7 s | 107.94 s | 0/0/0 | 0 | 32 | 0 | 0 | 0 | 0 | 0 | 10/10 | 0 | 0 s |
| Yas Marino | 5.311 | 8 | 0.8 s | 83.34 s | 0/0/0 | 0 | 69 | 0 | 0 | 0 | 431 | 0 | 10/10 | 0 | 0 s |

(GitHub, e8c6f7d ; « carte » = temps de calcul sur la machine de GitHub, 1 à 4 s sur le Mac.)

Ce qui ressort :
- Rien ne casse : chaque carte se calcule, chaque IA seule fait ses tours proprement, les 10 IA arrivent partout, 0 barrière, 0 muret, 0 pénalité de vitesse dans la voie.
- L'herbe : Monoco (673 sans pneus, 934 avec), Suzuko (477), Montréol (403), Yas Marino (431 avec pneus), Bahrayn (148) : des virages lents où les IA en peloton élargissent (rien dans une course seule). Monzo : 2 coupes avec les pneus. À regarder quand les tracés seront approuvés ; pas corrigé (ce n'est pas un défaut général : courses.html et stands.html restent dans leurs garde-fous).
- Deux défauts GÉNÉRAUX de l'IA trouvés par la page, corrigés :
  1. Quand l'entrée des stands suit de près la ligne (20 m : la plupart des tracés officiels, et le technique), l'IA ne passait en mode stands qu'après avoir passé la ligne (le tour compte à la ligne) : elle freinait trop tard et prenait la pénalité de vitesse (les 10 IA, 45 à 50 s, à Monoco, Monzo, Suzuko, Interlagas ; 25 s à Singapura, 10 s à Montréol). → simulation.js `majStandsIA` : le tour où elle arrivera à l'entrée (le suivant si elle doit passer la ligne avant).
  2. Conséquence vue sur le technique (stands.html : 18 chocs contre 16, et un choc de plus dans le test « 10 IA, 12 tours ») : elle se rangeait côté voie dans le dernier virage. → ia.js `droiteAvantStands` : elle ne se range que dans la ligne droite avant l'entrée. Et `autreAileron` compte aussi l'adhérence des pneus : derrière une voiture aux pneus plus ou moins usés, elle prévoit son freinage (le choc restant était un freinage, pas les stands).
- stands.html après ça : chocs 9 (16 sans pneus), herbe 1679 (6566 sans), 0 pénalité, ordre différent 30/30.
- Aucun tracé n'a été touché.

## Sortie des tests
- GitHub 40404990865 (e8c6f7d) : moteur 270/270, courses 43/43 + 38/38, stands 9/9, ecrans 157 + 180 + 201 + 206, annexes (sdk 19, pneus 28, enregistreur 28, circuits-a 56, circuits-b 51, textes 596, officiels 25), paquet 42/42.
- Mac, sous le verrou : moteur ×2, stands.html ×1, officiels.html ×4 ; pages de diagnostic dans scratchpad/codeur1/.

## Ce que je n'ai pas pu vérifier
- Les tracés officiels dans le jeu (pas branchés) ; 12 et 18 tours sur eux (seulement 3 et 4 tours ici) ; le pont de Suzuko (rien en 3D : la simulation passe le croisement sans le voir).

Réévalue.
