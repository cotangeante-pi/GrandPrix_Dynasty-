TOUR 17 — petit tour de fin de soirée (avant 20h50) — rapport du Chef
Commit vérifié : a7f0b97 (code 3a33150), vérifié par le Chef sur une copie à part : test.html 117/117, courses.html 37/37, ecrans.py 159/159, TOUT PASSE, 0 Chrome restant. Poussé.
Note : 54/100 (inchangée : le caractère existe mais ne change encore rien aux courses) — conduite 12/20, course et IA 14/20, championnat 1/15, interface 8/15, 3D et perf 8/15, code et tests 10/10, Poki 1/5
Mesures : 30 courses : 29 dépassements, 6 chocs > 5 m/s (à la limite), herbe 3957, vainqueur ≠ poleman 0, meilleur rythme top 3 30/30. Régularité à l'envers : 0,274 s pour le régulier contre 0,102 s pour l'irrégulier. Branche tour-16 (erreurs) : 149 erreurs, mais 1 choc fort pendant une erreur et 3 chocs à 20 voitures.

Ce qui ne va pas :
- La cause trouvée par le Codeur est la bonne piste : un pilote seul change de ligne pour un tout petit écart, et ça lui coûte jusqu'à 0,7 s. C'est ce bruit qui écrase la régularité, et sans doute aussi les surprises.
- « console vide » échoue parfois avec « GPU stall due to ReadPixels » : ce sont les captures d'écran de Playwright sous swiftshader qui lisent les pixels, pas le jeu (aucun readPixels dans le code du jeu).

ORDRES (petits, finir avant 20h40 ; commit sur main avant 20h50 seulement si lancer.py est vert, sinon branche) :
1. Une ligne choisie se garde : le pilote ne change de ligne que si la nouvelle fait gagner plus de IA_GAIN_CHANGEMENT (par exemple 0,05 s sur l'horizon), sauf pour éviter une voiture ou un bord.
   Fini quand : le test de régularité tient (irrégulier ≥ 3 × régulier) ; les 30 courses restent dans les garde-fous (chocs ≤ 6, herbe ≤ 4000, ≥ 25 dépassements) ; les tours d'un pilote seul ne sont pas plus lents.
2. Dans ecrans.py, « console vide » ignore seulement le message exact « GPU stall due to ReadPixels » (dû aux captures) ; tout autre message reste une erreur.
   Fini quand : c'est fait et lancer.py est vert.
Si 1 n'est pas vert à 20h40 : laisse-le sur une branche et commite seulement 2.

Compte rendu dans rapports/tour-17-compte-rendu.md avant 20h55, puis « Réévalue. » à session-76. À 21h : plus rien ne tourne, 0 Chrome --headless. Ensuite, la boucle s'arrête pour ce soir.
