TOUR 59 — compte rendu du Codeur 3 (bugs-59)
Commit : ac4d625 (code identique à main 4b17633 ; seuls SUIVI.md et une capture changent)
Ordres : 1 déjà fait avant (tour 48b), vérifié / 2 déjà fait avant (tour 49b), vérifié / 3 rien d'autre à régler seul / 4 fait
1. Saison 2 sur test/technique : championnat.js `remettreCalendrier` (appelé par `completer`) reprend le tracé de la place pour chaque GP à venir sur un circuit d'essai, courus/points/argent intacts, objectif de sponsor suivi. Le test « vieille sauvegarde test/technique » existe déjà (tests/test.html:1080) et couvre aussi la saison 2 neuve (calendrierNeuf = les 12 tracés) ; il passe sur GitHub (travail moteur).
2. ?reglages=1 : déjà corrigé (e75588a, tour 49b). Mesuré en 960×600 (fr) : bouton « Copier les valeurs changées » entier (bas à 473 px), panneau fini à 520 px sur 600, noms lisibles par textes.js (reglage_<clé>). Capture : rapports/captures-tour59-3/reglages-960-fr.png. La version en anglais a timeout au Mac (chargement lent) ; elle est couverte par tests/ecrans.py (reglages-960-en.png), vert sur GitHub.
3. Autres bugs de SUIVI : tous demandent le jeu ou une décision du propriétaire (départ impossible 10 s contre la barrière, caméra en virage rapide, GPU stall déjà ignoré, mesures de i/s, visée des IA à l'épingle). Rien changé.
SUIVI.md : les deux bugs réglés marqués RÉGLÉ.
Tests : aucun code changé ; passage GitHub de ac4d625 : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44215265973 (id 44215265973) = completed success, 18/18 travaux.
Pas vérifié : la capture en anglais sur le Mac ; jeu sur vrai appareil.
Réévalue.
