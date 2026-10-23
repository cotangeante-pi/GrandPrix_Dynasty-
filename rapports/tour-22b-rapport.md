TOUR 22b — Codeur 2 (session-9e) : finir l'étape 5 (le fantôme du meilleur tour, le départ parfait) — rapport du Chef
Commit vérifié : 3dbc3dd (tour 21b), fusionné sur main 81c254d (+ CLAUDE.md 99f80e4). GitHub 40023458254 relu par le Chef : seulement les 6 échecs connus ; diff relu (aucun seuil élargi, le calcul de la carte pas touché, physique × 1 au bit près). Capture championnat-en.png : aucun mot français. Bien.
Mêmes règles qu'au tour 21b (GitHub Actions, verrou, fichiers d'session-dd, CLAUDE.md pas touché). Avant tout : `git merge origin/main` dans codeur2.

ORDRES
1. LE FANTÔME DU MEILLEUR TOUR (CLAUDE.md, « Le fantôme du meilleur tour ») avec l'enregistreur déjà branché (le même code, pas un deuxième) :
   - enregistrement du tour chronométré du joueur en qualification ; un tour qui bat le record du circuit le remplace ; un tour coupé (✂) ne devient jamais le fantôme ;
   - rejeu en qualification seulement : voiture transparente, couleur neutre, aucun contact ni aspiration, absente de voituresVues ; masquable dans le menu pause (sauvegardé) ;
   - l'écart en direct sous le chrono (« −0,34 » vert / « +0,12 » rouge), calcul pur à distance égale ; après le tour : « nouveau record ! » ou l'écart final ;
   - dans la sauvegarde unique, compact (nombres arrondis) ; taille d'un fantôme mesurée (compte rendu) ; une sauvegarde sans fantôme se charge.
   Fini quand : les tests de CLAUDE.md pour le fantôme (rejoué contre soi-même = écart 0, plus lent ne remplace pas, coupé jamais gardé, absent en course et des voituresVues, sauvegarde) ; ecrans.py : 2 qualifications de suite, la 2e montre le fantôme et l'écart ; capture fantome.png ; console vide.
2. LE DÉPART PARFAIT (CLAUDE.md, « Le départ parfait ») : régime de départ tenu avec l'accélérateur pendant les feux, zone verte, lâcher puis réappuyer à l'extinction ; résultats parfait / bon / patinage / calé / faux départ, avec leurs effets (jamais un bonus : parfait = la voiture normale) ; jauge au centre bas, résultat et temps de réaction affichés 1 s ; record du temps de réaction ; les IA font leur départ avec la même règle (régime et réaction tirés selon leur caractère, bornes humaines). Calcul pur dans course.js (ou départ.js), l'effet lu par physique.js (petit ajout, × 1 quand il n'y a rien : même nombre au bit près — préviens session-dd par SendMessage avant de toucher physique.js). Réglages dans donnees.js et ?reglages=1.
   Fini quand : les tests de CLAUDE.md pour le départ (dont les 50 courses : les réguliers ratent moins que les fautifs ; aucune IA sous le minimum humain hors faux départ) ; ecrans.py : un départ parfait et un patinage joués par le test ; capture depart.png ; console vide. La sensation est à juger par le propriétaire.

HORAIRES : jusqu'à 21h. Rien de nouveau après 20h40, dernier push à 20h50, compte rendu dans rapports/tour-22b-compte-rendu.md avant 20h55. Message à session-76 après chaque ordre vert sur GitHub.
