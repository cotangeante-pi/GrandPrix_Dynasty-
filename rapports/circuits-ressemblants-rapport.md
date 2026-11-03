CIRCUITS RESSEMBLANTS — ordre du Chef, pour le premier Codeur qui a fini son tour 21
Chef : session-76. Base : main (CLAUDE.md mis à jour le 2026-10-23). Branche : `circuits` (à partir de main), à pousser sur GitHub.

DÉCISION DU PROPRIÉTAIRE (2026-10-23) : « c'est possible de faire plus ressemblant au vrai ? » → oui. Les 12 circuits doivent se RECONNAÎTRE AU PREMIER COUP D'ŒIL, comme les vrais : proportions, virages célèbres à leur place, longueur proche du vrai. Les noms restent changés (Monoco, Silverstoun…), aucun logo, aucune marque, aucun vrai nom dans le jeu. Voir CLAUDE.md, « Le championnat et les saisons » et l'étape 10.

LE TRAVAIL (données seulement, rien de branché dans la page) :
1. Refaire les 12 tracés de circuits-officiels-a.js et circuits-officiels-b.js (même format : ['droite', L], ['virage', rayon, angle], ['chicane', …]) pour qu'ils suivent la forme du vrai circuit, de mémoire et de ce que tu sais des vrais tracés. Pour chacun, les éléments qu'on doit reconnaître, au minimum :
   - Monoco : Sainte-Dévote, la montée, le Casino, l'épingle très lente (Loews), le tunnel, la chicane du port, la Piscine, la Rascasse ;
   - Silverstoun : Copse, Maggotts-Becketts-Chapel (le S rapide), la Hangar Straight, Stowe, Club ;
   - Monzo : la longue ligne droite, la première chicane, Curva Grande, les deux Lesmo, Ascari, la Parabolica ;
   - Spaa : La Source (épingle), Eau Rouge / Raidillon, la longue droite de Kemmel, Les Combes, Pouhon, Blanchimont, la chicane de l'arrêt de bus ;
   - Suzuko : le 8 (le tracé se croise sur un pont), les S du premier secteur, Degner, l'épingle, Spoon, 130R, la chicane finale ;
   - Interlagas : sens inverse des aiguilles d'une montre, le « S do Senna », la droite opposée, Junção et la longue montée vers la ligne ;
   - Montréol : les chicanes, l'épingle, la longue droite et le « mur des champions » ;
   - Melbourn Park : le tour du lac, rapide et fluide ;
   - Barcelana : le long premier virage à droite, la longue courbe rapide (virage 3), la chicane finale ;
   - Bahrayn : longues droites et freinages forts, le virage 1 en épingle ;
   - Singapura : beaucoup de virages à 90°, en ville ;
   - Yas Marino : l'épingle, les deux longues droites, le secteur final sinueux autour de l'hôtel.
   La longueur de chaque tracé à moins de 10 % de la vraie (les plages de PLAGES dans tests/circuits-a.html et -b.html peuvent changer pour suivre la vraie longueur ; donne la vraie longueur dans un commentaire).
2. Suzuko se croise (le 8) : c'est le seul croisement permis. Marque-le dans les données (par exemple `croisement: { s1, s2 }`) et adapte le test « aucun croisement » : il reste vrai partout ailleurs, et Suzuko a exactement un croisement, à l'endroit marqué, presque à angle droit. Le pont en 3D viendra à l'étape 10 (note-le dans ton compte rendu ; ne le fais pas).
3. Les tests de tests/circuits-a.html et tests/circuits-b.html restent (refermé à moins de 1 m, tour complet, largeur, rayon pas trop serré, un vrai point de dépassement sauf Monoco) ; on ne retire aucun test.
4. Les vues de dessus tests/circuits-a.svg et tests/circuits-b.svg refaites, avec le nom de chaque virage célèbre écrit à côté (petits textes), la ligne de départ et le sens de la course. Le propriétaire les regarde dans Chrome pour juger : c'est lui qui dit si c'est ressemblant.

TESTS : sur le Mac, seulement `python3 tests/lancer.py annexes`, sous le verrou /tmp/gpd-tests.lock. Puis `git push origin circuits` et lire le passage GitHub de ton commit (commandes dans CLAUDE.md). « Vert » = aucun échec hors des 6 connus de main, s'ils y sont encore.
Fini quand : les 12 tracés refaits, tests annexes verts sur GitHub, les deux .svg refaits ; message à session-76 avec le commit et l'id du passage GitHub.
Ne touche pas à CLAUDE.md. Pas de branchement dans le jeu (?circuit=) : ce sera après l'accord du propriétaire sur les tracés.
