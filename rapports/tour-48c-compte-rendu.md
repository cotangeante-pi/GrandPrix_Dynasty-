TOUR 48c — compte rendu du Codeur 3 (branche personnalisation)
Commits : ab99949 (livrée, célébration, boutique), 05385af (tests des listes de motifs ; GitHub 42119740574 : 16/16 vert), puis le motif par joueur à deux.
Ordres : 1 livrée fait / 2 célébration fait / 3 boutique fait (écran à part, accès provisoire depuis le garage) / réglages : pas codés (liste ci-dessous, pour le propriétaire).
Sortie des tests : tests/personnalisation.html 17/17 (annexes) ; ecrans.py test=livree 87/87 (fr, en, 1280, 960, appels de dessin), test=essai 11/11, test=deux 20/20.
Mesures : même image, 10 voitures : 23 appels de dessin avec livrées, 23 sans (?livree=0) ; 6 appels par voiture ; la voiture du joueur 1288 triangles (1276 avant : la plaque du numéro).
Ce que je n'ai pas pu vérifier : l'aperçu 3D de « Ma voiture » est un second rendu WebGL (comme celui du casque) ; sous swiftshader il ralentit la page et fige les captures prises après : il est libéré en quittant l'écran. À regarder sur un vrai ordinateur et un téléphone.
Réglages de la voiture proposés au propriétaire (à choisir avant de coder) : équilibre des freins (avant = freine plus court mais bloque plus en virage) ; boîte courte / longue (accélère mieux / vitesse de pointe plus haute) ; dureté des suspensions (vibreurs et rapides / bosses et lents) ; pression des pneus (adhérence / usure) ; bouton « Réglage conseillé » qui remet tout au milieu (la voiture d'aujourd'hui au bit près). Les IA règlent avec la même règle ; tableau des temps sur les 12 tracés pour vérifier qu'aucun cran ne gagne partout.
Réévalue.
