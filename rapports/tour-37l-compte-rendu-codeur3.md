# Tour 37l — compte rendu du Codeur 3 (2026-10-31) : la partie écran du pneu drift

Branche codeur3, main fusionné avec le pneu drift du Codeur 1 (`PNEUS_CHOIX`, la leçon 8 en `&pneus=drift`). Je n'ai touché ni pneus.js, ni physique.js, ni ia.js.

1. **La 8e leçon, « Le drift »**, refaite comme le propriétaire la décrit (tutoriel.js) :
   - essai libre sur le technique, à l'épingle marquée par les plots ;
   - **phase drift** (le pneu drift monté sur la voiture du joueur par `TUTORIEL.appliquerPneu`) : faire glisser l'arrière, au moins `TUTO_DRIFT_ARRIERE` (0,6) pendant `TUTO_DRIFT_TENUE` (0,3 s), et le rattraper ;
   - **phase adhérant** : le même virage, proprement, en pneus adhérant ;
   - **réussie** après les deux ;
   - **ratée** tout de suite en cas d'herbe (« sortie ») ou de tête-à-queue (l'angle de l'arrière au-delà de `TUTO_TETE_A_QUEUE`, 1,2 rad) ;
   - **ratée** aussi après 3 passages sans vraie glissade (« pasGlisse »), ou si l'on ne fait rien (« temps »).

   Une consigne par phase, en fr et en en.
   - Tests (tests/tutoriel.html, 19/19) :
     - réussie ; ratée par l'herbe, par un tête-à-queue, sans glissade et sans rien faire ;
     - le pneu monté à chaque phase ;
     - **un pilote scripté (le robot d'essai) la réussit** : glissade à 1,0 tenue 0,93 s et rattrapée en drift, puis l'épingle à 0,08 en adhérant.
2. **Les bulles** (aides.js) :
   - `vivante` parle maintenant du pneu drift et s'affiche à la première course avec ce pneu ;
   - `pneus`, nouvelle, s'affiche au premier clic sur un pneu au garage (la bulle du garage d'abord, comme avant) et explique l'adhérant et le drift.

   Test : aides.html, 20/20.
3. **L'écran** :
   - le drift est dans la liste du garage (fait par le Codeur 1). Le slick s'appelle maintenant « Grip / Adhérant » à l'écran ;
   - à l'arrêt, ← → passent par la même liste (`METEO.TYPES`, avec le drift) ;
   - **une icône du pneu monté** (une lettre de couleur, le nom en bulle) à côté de la jauge d'usure.

   Les captures, prises avant 21h, sont dans poki/captures/ :
   - pneus-drift-fr / en (le garage, le drift choisi, la bulle des pneus) ;
   - pneus-drift-course-fr / en (l'icône D près de la jauge) ;
   - 6-glissade refaite en pneus drift.

   Le script : `poki/capture-pneus.py`.
4. **La fiche Poki** : le drift est un pneu, choisi au garage et à chaque arrêt, et la 8e leçon apprend le drift.

**Pas vérifié** : la leçon jouée dans la vraie page, de bout en bout (seul son calcul et le pilote scripté sont testés). À noter aussi : la rangée des pneus du garage n'est pas centrée en 1280×720 ; cette mise en page date d'avant ce tour.
