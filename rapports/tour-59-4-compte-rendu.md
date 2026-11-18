TOUR 59 — compte rendu du Codeur 4 (relecture finale du jeu en ligne)
Commit du code : 4b86727 (branche relecture-59, poussée ; main non touchée)
Ordres : 1 fait (rapports/tour-59-relecture-enligne.md : les 23 points T11 réglés / pas réglés avec fichier:ligne, 11 défauts nouveaux) / 2 fait pour 3 défauts simples, un test chacun (N1 version polluée par le commentateur et les options dégâts/drapeaux ; N2 Origin du relais ; N3 porte des adresses `EN_LIGNE_ADRESSE`), les autres décrits (N4 NIVEAU épinglé seulement à la création, N5 fausse empreinte qui fait tomber tous, N6 erreurs d'écouteur avalées, N7-N11) / 3 fait (section « Les batailles en ligne » de CLAUDE.md réécrite d'après le code) / 4 fait (18/18).
Sortie des tests : Mac, sous verrou : tests/test.html?filtre=en ligne 23/23 (dont les 2 nouveaux) ; tests/serveur.py 123/123 (4 nouveaux « origines »). GitHub : passage 44216159158 sur 4b86727, 18 travaux success : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44216159158
Mesures : textes fr/en : les 98 clés enl*/enligne* existent des deux côtés.
Ce que je n'ai pas pu vérifier : Safari, Firefox, un vrai onglet caché, une vraie connexion entre deux machines, 8 joueurs, une 2e course dans la même page (aucun test ne la joue), un téléphone.
À décider par le Chef : mettre EN_LIGNE_ADRESSE à faux dans la version publiée (vrai par défaut : rien ne change pour les essais) ; relais : `--origines` à régler avec l'adresse publique.
Réévalue.
