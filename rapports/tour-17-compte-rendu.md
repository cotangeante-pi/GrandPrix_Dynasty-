TOUR 17 — compte rendu du Codeur (session-dd)
Commit sur main : fa19fdb (« Tour 17 : une ligne choisie se garde ; la régularité se voit »), vert.

Ordres : 1 fait / 2 fait

1. Une ligne choisie se garde — fait.
   - La note de la ligne actuelle reçoit un bonus de IA_GAIN_CHANGEMENT (0,05 s), sauf si elle touche une voiture, le bord ou l'herbe (variable `danger` dans noterLigne). Ce bonus remplace IA_PENALITE_CHANGEMENT (0,03 s).
   - Ça ne suffisait pas : la régularité restait à 0,278 / 0,110. J'ai mesuré un pilote seul avec un facteur de rythme fixe :
     | facteur | temps au tour | décisions « extérieur » |
     |---|---|---|
     | 1 à 0,999 | 55,10 s | 171 ou moins |
     | 0,998 | 55,89 s | 703 |
     Cette ligne de rechange semble meilleure sur l'horizon de 200 m, mais elle coûte 0,8 s au tour. La garde de ligne n'y change rien, car le pilote y passe pour de bon.
   - Donc : seul, sans aucune voiture en vue, il n'a plus les lignes de rechange (intérieur, extérieur). Il garde rapide et continuer. Avec des voitures en vue, rien ne change. Le temps suit alors le rythme sans saut : 55,10 s jusqu'à 0,996, puis 55,26 s à 0,99.
   - Les styles se ressemblaient alors trop (3 sommets sur 8 à moins de 0,5 m d'écart-type) : IA_STYLE_CORDE passe de [0 ; 1,5] à [0 ; 2,5]. Le test des styles passe.
   - Fini quand :
     - régularité : tenue et redevenue exigée dans test.html, avec 0,024 s pour le régulier contre 0,101 s pour l'irrégulier (4,2 ×) ;
     - garde-fous des 30 courses : tenus, détail ci-dessous ;
     - pilote seul pas plus lent : 55,08 s sur le technique (avant 55,10 s ; ecrans.py mis à jour) et 48,87–48,89 s sur le test (avant 48,92 s).
   | 30 courses | garde-fou | tour 16 | tour 17 |
   |---|---|---|---|
   | dépassements | ≥ 25 | 29 | 31 |
   | chocs > 5 m/s | ≤ 6 | 6 | 5 |
   | herbe | ≤ 4000 | 3957 | 2589 |
   | barrières + coupes | ≤ 6 | 0 | 0 |
   | 20 voitures | ≤ 1 choc | 0 et 1 | 0 et 1 |
   Toujours pas tenus : vainqueur ≠ poleman 0 (≥ 4 demandé), meilleur rythme top 3 30 (18 à 28 demandé).

2. ecrans.py, « console vide » — fait. Seul le message exact est ignoré (motif LECTURE_PIXELS) :
   « [.WebGL-0x…]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels »
   L'adresse entre crochets change ; le reste doit être identique, et le motif doit couvrir tout le message. J'ai vérifié qu'un autre texte du même genre reste une erreur.

Sortie des tests (fa19fdb), lancer.py : test.html 118/118, courses.html 37/37, ecrans.py 159/159, TOUT PASSE, 0 Chrome restant (20h27). Un seul passage complet : ecrans.py et test.html ont aussi été lancés seuls juste avant.

Ce que je n'ai pas pu vérifier : un deuxième passage complet. La branche tour-16 (erreurs, agressivité) n'est pas refaite sur ce nouveau main.

Aucun essai ne tourne, 0 Chrome --headless. Je ne lance plus rien ce soir.

Réévalue.
