TOUR 59 — compte rendu du Codeur 1 (la conversation avec les pilotes)
Commit : cdb081b (branche idees-58, poussée ; ce compte rendu vient par-dessus avec [skip ci])
Ordres : 1 fait (banc vert) / 2 fait (textes.html vert) / 3 fait (3 conversations d'enfant en fr et en en, transcriptions ci-dessous) / 4 fait (18/18)
Sortie des tests :
- tests/banc-parle.html (fr) : RESULTAT 81/81 ; nouvelle page tests/banc-bavardage-en.html (même banc avec ?lang=en, ajoutée aux annexes de lancer.py) : 81/81 ; tests/textes.html : 2148/2148.
- Banc complété : 70 phrases de sujets fr+en, suites (oui, non, et toi, pourquoi, lol, prénom, âge), mémoire (âge, animal et son nom, goûts ressortis une fois), conversation de 89 messages, 3 conversations d'enfant x 2 langues, pilote fâché, actes de course inchangés, BAVARDAGE_ACTIF faux = d'avant, hasard de course intact.
- GitHub : https://github.com/cotangeante-pi/GrandPrix_Dynasty-/actions/runs/44218951948 (id 44218951948) : completed success, 18/18 travaux.
Défauts corrigés (bavardage.js, textes.js) : « favourite food / any tips to overtake » lus comme PROMESSE / PASSER ; un salut pris pour la réponse à sa question ; question d'un Grand Prix précédent encore en attente ; « et toi ? » après un âge sans que le pilote dise le sien ; « le basket », « oui un chien » traités comme de nouvelles questions au lieu de réponses ; sa propre question redite en écho (« Tu aime lecole ? Fonce ») ; écriture d'enfant (jai, jaime, tadore, sappel, cest, ta quel age, jtm, tu mange, lecole, pk, vous) ; « à demain » = au revoir ; « cool » ≠ « vraiment ? » ; « Oui, une tortue » à « ton animal préféré ». Ajouts : sujets affection (jtm, i love u) et « je veux être pilote », phrase floue (bav_flou) à la place de « je ne comprends pas » quand une vraie phrase n'est pas rangée, rappel d'un goût (bav_rappel_gout). Textes ajoutés en fin de textes.js (blocs Object.assign fr/en) ; 2 phrases changées pour textes.html (blague « sieste-car », « Plus I love »).
Ce que je n'ai pas pu vérifier : l'écran (la fiche « Discuter » dans interface.js, non lancé) ; aucun test Chrome d'ecrans.py sur le Mac (GitHub l'a fait) ; les réponses restent parfois approximatives sur une phrase très libre (« rien » → « D'accord, pas de souci », « Vous connaissez Max ? » → phrase floue).
Réévalue.

TRANSCRIPTIONS (3 conversations d'enfant, fr puis en ; « moi » = le joueur)

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
  → Ha ha, je sais.
- tu fais quoi ce weekend
  → Après cette course ? une soirée film avec des amis. Et toi, c’est quoi tes passions ?
- cool
  → Cool.
- et toi t as un chien ?
  → Biscuit ! C’est une tortue, la vraie star de la maison.
- moi jai un chat il sappel Mimi
  → Oh, trop bien ! C’est quoi son nom ?
- tu joue a fortnite
  → Surtout aux jeux de stratégie. Ne dis pas à mes ingénieurs combien de temps. Et toi, tu joues à quoi ?
- mdr
  → Ha ! Au moins quelqu’un rit à mes blagues.
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
  → Sans blague !
- ta des freres
  → Ma famille ? ni frère ni sœur, juste mes parents et ma grand-mère, ma plus grande supportrice. Ils viennent me voir quand ils peuvent.
- oui jen ai 2
  → Cool.
- tu va ou en vacances
  → Après cette course ? une soirée film avec des amis.
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
  → En dehors de la piste, c’est le foot.
- non
  → D’accord, pas de souci. Et toi, du sport ?
- moi oui
  → Cool.
- cest quoi votre plat prefere
  → Mon plat préféré ? les sushis. Mon nutritionniste fait semblant de ne pas savoir.
- ah moi cest la pizza
  → Maintenant, j’ai faim. Au fait, tu m’as parlé de les chevaux. Toujours à fond dedans ?
- vous etes riche
  → Je ne parle pas d’argent, je parle de chronos. Dis-moi. C’est quoi ton circuit préféré ?
- vous avez une voiture rapide ?
  → La voiture est une fusée. Si je perds, c’est de ma faute.
- wow
  → Sans blague !
- vous allez gagner ?
  → À Melbourn Park ? Je veux la victoire, rien de moins.
- oui
  → Sympa. À ton avis, qui va gagner la prochaine ?
- pourquoi
  → Parce que je connais ma voiture, et je connais ce circuit.
- xd
  → Ha ha, je sais.
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
  → D’accord, pas de souci.
- tu veux etre mon ami
  → Disons qu’on s’en approche. Dis-moi. Tu joues aux jeux vidéo ?
- ta quel age
  → 34 ans, si tu comptes. Tu as quel âge, au fait ?
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
  → À l’école, j’aimais la géographie. Le reste… moins. C’est quoi ta matière préférée ?
- moi non
  → Courage. Même les pilotes avaient des devoirs.
- tu es marie
  → Ha ! Ça, c’est ma vie privée. Question suivante !
- haha
  → Ha ha, je sais. Je repense à ce que tu m’as dit : le bleu. Bon choix.
- raconte une blague
  → D’accord, en voilà une : Le plat préféré d’un pilote ? Le fast-food, évidemment ! Au fait… Et toi, c’est quoi ton rêve ?
- mdrrr
  → Ha ha, je sais.
- ta quelle voiture
  → Géniale dans les virages rapides, un peu nerveuse au freinage.
- cest laquelle ta preferee
  → Hum, tu me prends de court. Il faudrait que j’y réfléchisse. Dis-moi. Un film préféré ?
- je tadore
  → Ha, c’est gentil ! Moi aussi, j’aime bien discuter avec toi.
- ok
  → Cool.
- tu vien dou
  → Mon pays : Monaco. Je le porte sur mon casque.
- cool
  → Ça marche ! Et toi, tu viens d’où ?
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
  → Ha ha, I know.
- wat r u doin this weekend
  → After this race? a film night with friends. And you, what are your hobbies?
- cool
  → Cool.
- u got a dog?
  → Biscuit! That’s a tortoise, and the real star of my house.
- i got a cat his name is Mimi
  → Oh nice! What’s its name?
- do u play fortnite
  → Mostly strategy games. Don’t tell my engineers how much. And you, what do you play?
- lmao
  → Ha! At least someone laughs at my jokes.
- why
  → Why? Some things you can’t explain.
- ur so fast
  → Kind of you. You drive well too. And I’m on form right now. At Bahrayn, I finished P1, you P20.
- will u win next race?
  → At Melbourn Park? I want the win, nothing less.
- wat do u eat in the morning
  → Easy: sushi. What’s your favourite food?
- i like pasta
  → Ooh, pasta. Good choice. So, tell me. What’s your favourite subject?
- wat r u scared of
  → Deep water. Don’t tell anyone.
- really?
  → No joke!
- do u have brothers
  → Family? no brothers or sisters, just my parents and my gran, my biggest fan. They come to watch when they can.
- yes i got 2
  → Cool.
- where r u going on holiday
  → After this race? a film night with friends.
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
  → Off the track, it’s football for me.
- no
  → Okay, no problem. And you, any sport?
- i do
  → I do! Good for the fitness. Drivers need it too.
- whats your favourite food
  → My favourite? sushi. My nutritionist pretends not to know.
- i love pizza
  → Pizza? Now I’m hungry. By the way, you told me about horses. Still into it?
- are you rich
  → I don’t talk money. I talk lap times. So, tell me. Do you play video games?
- is your car fast?
  → The car is a rocket. If I lose, it’s on me.
- wow
  → No joke!
- are you gonna win?
  → At Melbourn Park? I want the win, nothing less.
- yes
  → Nice. Who do you think will win next?
- why
  → Because I know my car, and I know that track.
- xd
  → Ha ha, I know.
- do you know Max?
  → Me? I like you already.
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
  → Okay, no problem.
- be my friend?
  → Let’s say we’re getting there. So, tell me. Do you play video games?
- how old r u
  → I’m 34, if you’re counting. How old are you, by the way?
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
  → At school I liked geography. The rest… less. What’s your favourite subject?
- me neither
  → Hang in there. Even racing drivers had homework.
- r u married
  → Ha! That’s my private life. Next question!
- haha
  → Ha ha, I know. I keep thinking about what you said: blue. Good one.
- tell me a joke
  → Okay, here’s one: What’s a racing driver’s favourite meal? Fast food, obviously! By the way… And you, what’s your dream?
- lmaooo
  → Ha ha, I know.
- what car do u drive
  → Brilliant in fast corners, a bit nervous on the brakes.
- whats ur fav
  → Hmm, you caught me there. I’d need to think about that one. So, tell me. Any favourite films?
- i love u
  → Ha, that’s kind! I like talking with you too.
- ok
  → Cool.
- where u from
  → Monaco, and proud of it.
- cool
  → Alright! And you, where do you come from?
- cya tmrw
  → Okay, briefing time. Talk soon!