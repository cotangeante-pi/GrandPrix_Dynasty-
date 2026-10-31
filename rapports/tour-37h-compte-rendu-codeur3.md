# Tour 37h — compte rendu du Codeur 3 (2026-10-30) : le monde réagit au choix des aides

Branche codeur3, partie de 99a6c5f.

**Les faits viennent de la course.** `CHAMPIONNAT.finirGrandPrix` reçoit les aides de la course, déjà passées pour le bonus. Il note dans le résultat du Grand Prix `sa: 1` (couru sans aucune aide) et `lg: 1` (couru en légende, la voiture vivante), seulement quand c'est vrai. Il garde ensuite le dernier exploit dans `ch.exploitAides` : `{ f, gp, saison, circuit, place }`. Rien n'est inventé. Pour qui garde ses aides, il n'existe aucun fait, donc aucune moquerie possible.

1. **Le journal** (journal.js, `faitsAides`) : quatre faits nouveaux dans `JOURNAL_PRIORITES`, chacun une seule fois par carrière. Chacun a trois titres et deux textes, en anglais et en français.
   - `sansAidePremiere` : la première course sans aide, avec la photo de la voiture.
   - `sansAidePodium` : le premier podium sans aide.
   - `sansAideVictoire` : la première victoire sans aide (« SANS LES PETITES ROUES ! »).
   - `legendeVictoire` : la première victoire en légende (« La bête domptée ! »).
2. **L'interview** (interview.js) : deux questions dans `INTERVIEW_PRIORITES`, juste après le domicile, avec les trois tons comme les autres.
   - `sansAide` : la première course sans aide, ou le premier podium sans aide.
   - `legende` : la première victoire en légende.

   La question reçoit les aides de la course (principal.js) ; sans elles, aucune question sur les aides.
3. **Les discussions** (discussion.js) : un rival remarque le dernier exploit à une question ordinaire (salut, avis, état, compliment, question, duel), une seule fois (`m.exploitVu`). Il cite le vrai circuit et la vraie place : « P3 à Monzo avec toutes les aides coupées. J'ai vu ça. Respect. » En légende : « À Spaa, la voiture glissait partout et tu as gagné quand même. » Le patron n'en parle pas : j'ai fait le rival seulement.

**Tests**
- tests/test.html :
  - la une fait chaque fait une seule fois ;
  - avec les aides, aucune une sur les aides ;
  - en légende, `legendeVictoire` ;
  - l'interview pose sa question seulement la première fois, avec les trois tons dans les deux langues.
- tests/banc-parle-tests.js : le rival le remarque une fois, avec le circuit et la place vrais ; sans exploit, rien (62/62 sur le Mac).
- tests/textes.html : 1297/1297 (parité, aucun genre, aucune langue mélangée).
- Les deux tests de test.html n'ont pas pu tourner sur le Mac (le verrou était pris jusqu'à l'écran bloqué) : c'est le passage GitHub qui les vérifie.
