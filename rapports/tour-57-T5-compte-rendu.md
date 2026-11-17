# Tour 57, T5 : la course en ligne au doigt, couché et debout (branche enligne-doigt, partie de enligne-tout)

Fait : tests/enligne-course.py (tactile) tourne maintenant deux fois, téléphone couché (640x360) et téléphone debout (iPhone SE, jeu tourné, html.tourne) : FREIN, ◀, ▶ au doigt (cibles du téléphone), pas de bouton pause, GAZ tenu fait rouler la voiture (9.3 / 8.8 m/s), aucune désynchro, pas d'aide de pilotage, console vide. Vert sur GitHub (run 43795808777, sortie de enligne-course.py).
Leçons du test : noms D1 (bleu / rouge), les deux pages sont pompées à la main (la page cachée n'a pas de requestAnimationFrame et l'autre abandonnerait), abandon et silence du relais coupés pendant ce test seulement, page du téléphone mise au premier plan.
Au même run, deux échecs hérités de enligne-tout (reseau.html, incident_parti), pas de la tâche 5 ; corrigés depuis par le Codeur 1 (23c0324).
Pas fait : salle et écrans au doigt debout dans la même suite (tests/tourne.py les couvre déjà).
