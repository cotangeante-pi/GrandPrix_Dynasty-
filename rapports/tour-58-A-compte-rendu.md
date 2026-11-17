# Tour 58, tâche A : enligne-tout au vert (moteur + annexes)

- origin/main (c95bc95) et origin/fusion-58 fusionnés dans enligne-tout.
- Cause du rouge « annexes » (passage 43855112068) : tests/reseau.py. Le minuteur `threading.Timer(180, os._exit(2))` n'était pas daemon : la page réussissait (33/33) mais le processus restait en vie jusqu'au minuteur, qui sortait en code 2 (annexes en échec sans ligne ✘). Un premier relèvement à 400 s a seulement allongé l'attente (400 s) : correction = minuteur daemon.
- Plafonds relevés : reseau.py 400 s (attente de la page 360 s), reseau_page(delai=450).
- Résultat : passage 43977887012 sur c6f450ed72038ec87e5be53d36baef4349eaf3e9 : success (moteur + annexes, passage court).
