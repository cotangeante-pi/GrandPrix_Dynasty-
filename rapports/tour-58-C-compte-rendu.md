# Tour 58, tâche C : la course à 2 IA en ligne

- `?conduite=ia` (enligne-page.js) : l'IA de la course (pilote neutre d'ia.js, sans hasard) conduit la voiture du client ; seules ses commandes voyagent, comme celles d'un humain.
- `tests/enligne-course.py ia` : deux clients conduits par l'IA, 2 IA, 3 tours : podium atteint (95 s sur le Mac), aucune désynchro, mêmes arrivées, même empreinte de contrôle et même podium des deux côtés, les deux voitures ont fini. Une version à 1 tour est dans les annexes (mode `court`).
- Leçon : la première décision de l'IA est longue sur un Mac chargé ; le test règle EN_LIGNE_ATTENTE_MAX_MS et EN_LIGNE_SILENCE_MS dès DOMContentLoaded, sinon l'autre page abandonne avant que le test ait la main.
- GitHub (passage court) sur f642ea1 : moteur + annexes verts.
