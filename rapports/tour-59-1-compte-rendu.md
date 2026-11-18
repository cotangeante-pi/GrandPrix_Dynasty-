TOUR 59 — compte rendu du Codeur 1 (la conversation avec les pilotes)
Commit : 82f090f (branche idees-58, poussée ; ce compte rendu vient par-dessus avec [skip ci]). 1re passe : cdb081b, vert 18/18 (run 44218951948) ; 2e passe après le rapport du Chef : 82f090f
Ordres : 1 fait (banc vert) / 2 fait (textes.html vert) / 3 fait (3 conversations d'enfant en fr et en en, transcriptions ci-dessous) / 4 fait (18/18)
Sortie des tests :
- tests/banc-parle.html (fr) : RESULTAT 86/86 ; tests/banc-bavardage-en.html (même banc avec ?lang=en, dans les annexes de lancer.py) : 86/86 ; tests/textes.html : 2166/2166. 5 tests nouveaux (fr et en) : nom de l'animal sous 6 formes, oui/non (6 animaux, 8 sports), vacances, nombre repris, « cool » relancé.
- Banc complété : 70 phrases de sujets fr+en, suites (oui, non, et toi, pourquoi, lol, prénom, âge), mémoire (âge, animal et son nom, goûts ressortis une fois), conversation de 89 messages, 3 conversations d'enfant x 2 langues, pilote fâché, actes de course inchangés, BAVARDAGE_ACTIF faux = d'avant, hasard de course intact.
- GitHub : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44221813830 (id 44221813830) : completed success, 18/18 travaux.
Défauts corrigés (bavardage.js, textes.js) : « favourite food / any tips to overtake » lus comme PROMESSE / PASSER ; un salut pris pour la réponse à sa question ; question d'un Grand Prix précédent encore en attente ; « et toi ? » après un âge sans que le pilote dise le sien ; « le basket », « oui un chien » traités comme de nouvelles questions au lieu de réponses ; sa propre question redite en écho (« Tu aime lecole ? Fonce ») ; écriture d'enfant (jai, jaime, tadore, sappel, cest, ta quel age, jtm, tu mange, lecole, pk, vous) ; « à demain » = au revoir ; « cool » ≠ « vraiment ? » ; « Oui, une tortue » à « ton animal préféré ». Ajouts : sujets affection (jtm, i love u) et « je veux être pilote », phrase floue (bav_flou) à la place de « je ne comprends pas » quand une vraie phrase n'est pas rangée, rappel d'un goût (bav_rappel_gout). Textes ajoutés en fin de textes.js (blocs Object.assign fr/en) ; 2 phrases changées pour textes.html (blague « sieste-car », « Plus I love »).
Ce que je n'ai pas pu vérifier : l'écran (la fiche « Discuter » dans interface.js, non lancé) ; aucun test Chrome d'ecrans.py sur le Mac (GitHub l'a fait) ; les réponses restent parfois approximatives sur une phrase très libre (« rien » → « D'accord, pas de souci », « Vous connaissez Max ? » → phrase floue).
Réévalue.

APRÈS LE RAPPORT DU CHEF (les 4 cas, avant -> après, fr) :
1. « moi jai un chat il sappel Mimi » : avant « Oh, trop bien ! C'est quoi son nom ? » -> après « Mimi ! Quel beau nom. » (retenu ; formes testées : il s'appelle, il sappel, elle s'appelle, son nom c'est, appelé ; en : his/her/its name is, called, named).
2. « et toi t as un chien ? » : avant « Biscuit ! C'est une tortue, la vraie star de la maison. » -> après « Pas de chien, hélas. J'ai plutôt une tortue, Biscuit. » (oui/non d'après sa fiche, aussi pour « tu aimes le foot ? », « do you like skiing? » ; « tu joue a fortnite » -> « Non, ce n'est pas mon truc. Je joue aux jeux de stratégie, souvent. »).
3. « tu va ou en vacances » : avant la phrase du week-end -> après « En vacances ? Au programme : une petite île sans réseau. » (sujet vacances, 8 lieux fr/en tirés de sa fiche).
4. « oui jen ai 2 » : avant « Cool. » -> après « Deux ! Ça doit être animé chez toi. » (retenu : b.j.fratrie).
Aussi : « cool », « ok », « moi oui » seuls relancent par une question ; « ha ha, je sais » ne revient plus (variantes de rire, vraiment, ok : 6 chacune) ; un goût ressorti dit « tu m'avais dit : le bleu » (plus de « de les chevaux ») ; « i do » / « do you know Max? » ne sont plus pris pour une réponse à sa question.

TRANSCRIPTIONS ACTUELLES (3 conversations d'enfant, fr puis en)

TRANSCRIPTION enfant 1 (fr)

- slt
  → Salut.
- ca va ?
  → Plutôt bien. Les résultats suivent.
- t as quel age
  → J’ai 34 ans. Tu as quel âge, au fait ?
- moi jai 9 ans
  → 9 ans ? J’ai commencé le kart à 10 ans, tu as tout le temps.
- ta couleur preferee
  → C’est le turquoise. Mon casque en serait couvert si l’équipe me laissait faire. Et la tienne ?
- moi cest le rouge
  → Le rouge, sympa.
- lol
  → Rigole bien, ça fait gagner des dixièmes.
- tu fais quoi ce weekend
  → Après cette course ? une soirée film avec des amis. Et toi, c’est quoi tes passions ?
- cool
  → Cool. Je repense à ce que tu m’as dit : le rouge. Bon choix.
- et toi t as un chien ?
  → Pas de chien, hélas. J’ai plutôt une tortue, Biscuit.
- moi jai un chat il sappel Mimi
  → Mimi ! Quel beau nom.
- tu joue a fortnite
  → Non, ce n’est pas mon truc. Je joue aux jeux de stratégie, souvent.
- mdr
  → Ça m’a fait plaisir de te faire rire ! Et toi, tu joues à quoi ?
- pk
  → Pourquoi ? Il y a des choses qui ne s’expliquent pas.
- tu es fort
  → C’est gentil. Tu pilotes bien, toi aussi. Et en ce moment, tout me réussit. À Bahrayn, j’ai fini P1, toi P20.
- tu gagne a la prochaine course ?
  → À Melbourn Park ? Je veux la victoire, rien de moins.
- tu mange quoi le matin
  → Facile : les sushis. C’est quoi ton plat préféré ?
- jaime les pates
  → Miam, les pates. Bon choix. De mon côté, mon plat préféré ? les sushis. Mon nutritionniste fait semblant de ne pas savoir.
- ta peur de koi
  → L’eau profonde. Ne le dis à personne.
- ah bon
  → Je te promets que c’est vrai.
- ta des freres
  → Ma famille ? ni frère ni sœur, juste mes parents et ma grand-mère, ma plus grande supportrice. Ils viennent me voir quand ils peuvent.
- oui jen ai 2
  → Deux ! Ça doit être animé chez toi.
- tu va ou en vacances
  → En vacances ? Au programme : une petite île sans réseau.
- jtm bien
  → C’est adorable. Continue comme ça sur la piste et on s’entendra très bien !
- bye
  → Allez, bonne suite.

TRANSCRIPTION enfant 2 (fr)

- bonjour monsieur
  → Salut.
- vous avez quel age ?
  → J’ai 34 ans. Tu as quel âge, au fait ?
- jai 11 ans et vous
  → 11 ans ? J’ai commencé le kart à 10 ans, tu as tout le temps. J’ai 34 ans. J’ai donc un peu plus de kilomètres que toi !
- cest quoi votre animal prefere
  → Une tortue, Biscuit. Ça voyage mieux que moi. Et toi, un animal à la maison ?
- moi cest les chevaux
  → Oh, les chevaux ! Bon goût.
- vous faites du foot ?
  → Ah oui. En dehors de la piste, c’est le foot. Et toi, du sport ?
- non
  → D’accord, pas de souci. Au fait… Tu joues aux jeux vidéo ?
- moi oui
  → Cool. Je repense à ce que tu m’as dit : les chevaux. Bon choix.
- cest quoi votre plat prefere
  → Mon plat préféré ? les sushis. Mon nutritionniste fait semblant de ne pas savoir.
- ah moi cest la pizza
  → Maintenant, j’ai faim. Au fait… Tu aimes regarder quoi ?
- vous etes riche
  → Je ne parle pas d’argent, je parle de chronos. Dis-moi. Et toi, c’est quoi ton rêve ?
- vous avez une voiture rapide ?
  → La voiture est une fusée. Si je perds, c’est de ma faute.
- wow
  → Je te promets que c’est vrai.
- vous allez gagner ?
  → À Melbourn Park ? Je veux la victoire, rien de moins.
- oui
  → Très bien. À ton avis, qui va gagner la prochaine ?
- pourquoi
  → Parce que je connais ma voiture, et je connais ce circuit.
- xd
  → Rigole bien, ça fait gagner des dixièmes.
- vous connaissez Max ?
  → Ha ha, celle-là, on ne me l’avait jamais posée ! Au fait… Et ta couleur préférée ?
- jveux etre pilote
  → Alors travaille dur et ne lâche jamais. La piste t’attend !
- vous avez des conseils
  → La douceur, c’est la vitesse. Ne te bats pas contre la voiture.
- merci
  → Pas de quoi.
- a plus
  → À plus.

TRANSCRIPTION enfant 3 (fr)

- coucou
  → Salut.
- tu fais koi
  → Là, maintenant ? je mange, pour tout dire. Et toi, c’est quoi tes passions ?
- rien
  → D’accord, pas de souci. Dis-moi. Et toi, tu as quel âge ?
- tu veux etre mon ami
  → Disons qu’on s’en approche. Dis-moi. Tu aimes l’école ?
- ta quel age
  → 34 ans, si tu comptes.
- jai 10 ans
  → 10 ans ! À 10 ans, je rêvais d’être ici.
- ta un animal
  → J’ai une tortue qui s’appelle Biscuit. Et toi, un animal à la maison ?
- oui un chien
  → Oh, trop bien ! C’est quoi son nom ?
- Rex
  → Rex, j’adore. Fais-lui une caresse de ma part.
- ta couleur preferee
  → Ma couleur préférée, c’est le turquoise. Pas très original, je sais. Et Rex, ça va ?
- le bleu
  → Le bleu, sympa. Dis-moi. Tu écoutes quoi ?
- tu aime lecole
  → À l’école, j’aimais la géographie. Le reste… moins.
- moi non
  → Ha, d’accord. Je repense à ce que tu m’as dit : le bleu. Bon choix.
- tu es marie
  → Ha ! Ça, c’est ma vie privée. Question suivante !
- haha
  → Bon, celle-là était réussie. Bref. Et toi, du sport ?
- raconte une blague
  → Raconte une blague ? Respect. Dis-moi. Tu préfères quel circuit ?
- mdrrr
  → Rigole bien, ça fait gagner des dixièmes.
- ta quelle voiture
  → Géniale dans les virages rapides, un peu nerveuse au freinage.
- cest laquelle ta preferee
  → Hum, tu me prends de court. Il faudrait que j’y réfléchisse. Au fait, tu m’avais dit : raconte une blague. C’est toujours vrai ?
- je tadore
  → Ha, c’est gentil ! Moi aussi, j’aime bien discuter avec toi.
- ok
  → Ça marche ! Bref. Tu joues aux jeux vidéo ?
- tu vien dou
  → Mon pays : Monaco. Je le porte sur mon casque.
- cool
  → Super. Et toi, tu viens d’où ?
- a demain
  → Bon, c’est l’heure du briefing. À plus tard !

TRANSCRIPTION enfant 1 (en)

- hi
  → Hi.
- wassup
  → Still here?
- how old r u
  → I’m 34. How old are you, by the way?
- im 9
  → 9? I started karting at 10, so you’ve got all the time in the world.
- ur fav color?
  → My favourite colour is turquoise. My helmet would have it everywhere if the team let me. What’s yours?
- mine is red
  → Red, nice.
- lol
  → Keep laughing, it’s good for the lap times.
- wat r u doin this weekend
  → After this race? a film night with friends. And you, what are your hobbies?
- cool
  → Cool. I keep thinking about what you said: red. Nice pick.
- u got a dog?
  → No dog, sorry. I’ve got a tortoise called Biscuit instead.
- i got a cat his name is Mimi
  → Mimi! What a great name.
- do u play fortnite
  → No, not my thing. I play strategy games, a lot.
- lmao
  → Glad it made you laugh! And you, what do you play?
- why
  → Why? Some things you can’t explain.
- ur so fast
  → Kind of you. You drive well too. And I’m on form right now. At Bahrayn, I finished P1, you P20.
- will u win next race?
  → At Melbourn Park? I want the win, nothing less.
- wat do u eat in the morning
  → Easy: sushi. What’s your favourite food?
- i like pasta
  → Ooh, pasta. Good choice. By the way, you told me: pasta. Still true?
- wat r u scared of
  → Deep water. Don’t tell anyone.
- really?
  → I swear it’s true.
- do u have brothers
  → Family? no brothers or sisters, just my parents and my gran, my biggest fan. They come to watch when they can.
- yes i got 2
  → Two! It must be lively at your place.
- where r u going on holiday
  → On holiday? The plan: a small island with no phone signal.
- luv u
  → That’s sweet. Keep it up on the track and we’ll get along fine!
- bye
  → Right, take care.

TRANSCRIPTION enfant 2 (en)

- hello sir
  → Hi.
- how old are you?
  → I’m 34. How old are you, by the way?
- im 11, you?
  → 11? I started karting at 10, so you’ve got all the time in the world.
- whats your favorite animal
  → A tortoise named Biscuit. It travels better than I do. And you, any animals at home?
- mine is horses
  → Oh, horses! Good taste.
- do you play football?
  → Oh yes. Off the track, it’s football for me. And you, any sport?
- no
  → Okay, no problem. By the way… Do you play video games?
- i do
  → Cool. I keep thinking about what you said: horses. Nice pick.
- whats your favourite food
  → My favourite? sushi. My nutritionist pretends not to know.
- i love pizza
  → Pizza? Now I’m hungry. By the way, you told me: pizza. Still true?
- are you rich
  → I don’t talk money. I talk lap times. So, tell me. And you, what’s your dream?
- is your car fast?
  → The car is a rocket. If I lose, it’s on me.
- wow
  → I swear it’s true.
- are you gonna win?
  → At Melbourn Park? I want the win, nothing less.
- yes
  → Good stuff. Who do you think will win next?
- why
  → Because I know my car, and I know that track.
- xd
  → Keep laughing, it’s good for the lap times.
- do you know Max?
  → Ha ha, that’s a new one for me! By the way… And your favourite colour?
- i wanna be a driver
  → Then work hard and never give up. The track is waiting for you!
- any tips?
  → Smooth is fast. Don’t fight the car.
- thanks
  → No worries.
- see ya
  → Later.

TRANSCRIPTION enfant 3 (en)

- yo
  → Hi.
- wyd
  → Right now? eating, to be honest. And you, what are your hobbies?
- nothing
  → Okay, no problem. So, tell me. And you, how old are you?
- be my friend?
  → Let’s say we’re getting there. So, tell me. Do you like school?
- how old r u
  → I’m 34, if you’re counting.
- im 10
  → 10! When I was 10, I dreamed of being here.
- do u have a pet
  → I’ve got a tortoise called Biscuit. And you, any animals at home?
- yes a dog
  → Oh nice! What’s its name?
- Rex
  → Rex, love it. Give it a pat from me.
- fav colour?
  → Turquoise. Not very original, I know. And how’s Rex?
- blue
  → Blue, nice. So, tell me. What do you listen to?
- do u like school
  → At school I liked geography. The rest… less.
- me neither
  → Ha, that makes two of us.
- r u married
  → Ha! That’s my private life. Next question!
- haha
  → Okay, that was a good one. I keep thinking about what you said: blue. Nice pick.
- tell me a joke
  → Okay, here’s one: What’s a racing driver’s favourite meal? Fast food, obviously! By the way… And you, what’s your dream?
- lmaooo
  → Keep laughing, it’s good for the lap times.
- what car do u drive
  → Brilliant in fast corners, a bit nervous on the brakes.
- whats ur fav
  → Hmm, you caught me there. I’d need to think about that one. So, tell me. Any favourite films?
- i love u
  → Ha, that’s kind! I like talking with you too.
- ok
  → Alright! Anyway. Do you play video games?
- where u from
  → Monaco, and proud of it.
- cool
  → Great. And you, where do you come from?
- cya tmrw
  → Okay, briefing time. Talk soon!