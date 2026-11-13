TOUR 55 — compte rendu du Codeur (Codeur 3, tâche T19 : coût des drapeaux, branche perf-drapeaux)
Commit : voir la branche perf-drapeaux
Fait : tests/cout-drapeaux.html (annexes de tests/lancer.py) mesure le calcul de 20 IA par pas sur les 12 circuits, sans drapeaux / avec / avec une VSC en cours, médiane de 5 passages alternés ; aucun appel de dessin ni triangle en plus (bandeau HTML), plafonds par circuit de tests/ecrans.py sur GitHub.
Mesures : 0,26 à 0,42 ms par pas sans drapeaux, 0,27 à 0,34 avec, 0,22 à 0,33 sous VSC (l'écart est du bruit) ; une analyse des drapeaux 0,03 ms, une tous les 0,2 s. Aucune hausse à corriger, aucun code du jeu changé.
Sortie des tests : cout-drapeaux.html 14/14 sur le Mac ; GitHub : voir le compte rendu au Chef
Ce que je n'ai pas pu vérifier : les images par seconde réelles d'une course avec drapeaux sur une vraie carte graphique (tests/perf.py : le Mac est partagé) ; un vrai téléphone.
Réévalue.
