TOUR 55 — compte rendu du Codeur (Codeur 3, tâche T26 : téléphones émulés avec les nouveautés, branche telephones-55)
Commit : voir la branche telephones-55 (origin/main + chasse-en fusionnés dedans)
Fait : tests/telephones.py joue, en fin de course de carrière, un bandeau VSC (vrai chemin : etatJoueur forcé), sa bulle d'aide, un aileron abîmé (message et bulle), la voix (chargée), et mesure le recouvrement de tout le HUD de course ; un profil à la fois, plafond de 18 min.
Résultat : les 4 profils (iPhone SE, iPhone 13, Pixel 7, Galaxy S9+) : 105/105 avant la mesure de recouvrement du HUD ; avec elle, un défaut trouvé : l'eau de la météo recouvrait la tour de classement en 640×360 (déplacée, compacte) et recouvrait le bandeau du drapeau (bandeau limité à 38 vw).
Ce que je n'ai pas pu vérifier : un vrai téléphone ; la voix à l'oreille ; tests/telephones.py n'est pas dans le workflow GitHub (plusieurs minutes par appareil) : le défaut de l'eau est gardé par un test de recouvrement qui n'existe que dans ce script.
Réévalue.
