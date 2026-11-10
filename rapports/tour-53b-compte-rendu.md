# Compte rendu du Codeur 2, tour 53b

- ui-messages (c6a3f24) : fusion de origin/main, captures fr/en à 640, 960 et 1280 relues, rien ne déborde, GitHub 18/18.
- menus-doigt : sur écran tactile (body.tactile), aucun bouton du menu du paddock (Équipe, Boutique, Messages, Réglages), du garage, de la boutique,
  des sponsors, du pilote, de la livrée, du courrier, de la discussion et de la qualification n'a moins de 40 px de haut en 640×360 ; le garage et la
  discussion tiennent dans 360 px (phrases en une rangée défilante). Tous réagissent au toucher (tap émulé).
- Pas touchés, à faire par leur Codeur (encore < 40 px au doigt) : Course (boutonVoirTout 24, boutonVoirMessages 24, lignes du classement 15, boutonCourseSuivante 37),
  Saison (boutonCalendrier/Album/Arbre 31, lignes de classement 15, boutonCalendrierRetour), Entre amis (boutonAmisRetour 29), Apprendre (leçons).
  Aucune règle ni nom changé ; sans écran tactile rien ne change.
