"""L'essai du commentateur en voix fabriquée avec Bark (Suno, licence MIT pour le code ET les poids : usage commercial permis,
github.com/suno-ai/bark). Tour 48e : le propriétaire garde Bark retravaillé (« la seule qu'on comprend c'est bark fr retravaillé ;
en anglais … bark retravaillé est le mieux ») mais : « de trop grosses hésitations et des petits "I guess" parfois ». Donc :
plusieurs prises et plusieurs voix, des températures plus basses, une durée de génération plafonnée par phrase, les silences
internes raccourcis au traitement (traitement.raccourcir_silences), et le tri des prises par transcription (transcrire.py).
Bark est lent sur le Mac de 2014 (processeur seul) : les petits modèles (SUNO_USE_SMALL_MODELS), le cache des clés (kv caching).
Les outils restent HORS du dépôt, dans OUTILS (donné en argument) :
  OUTILS/venv-bark       python3 -m venv venv-bark ; pip install torch==2.2.2 "numpy<2" git+https://github.com/suno-ai/bark
  les poids              téléchargés par Bark lui-même dans XDG_CACHE_HOME=OUTILS/cache (huggingface.co/suno/bark, MIT)
Lancement : OUTILS/venv-bark/bin/python tests/voix/bark_essai.py OUTILS SORTIE [--prises N] [--jusqua HH:MM] [--langues fr,en]
  Les prises déjà faites sont gardées (on peut relancer) ; à l'heure --jusqua, il finit la prise en cours et s'arrête.
Voix : les « speaker presets » fournis avec Bark (v2/fr_speaker_N, v2/en_speaker_N), des voix synthétiques de Suno (MIT), pas des
personnes enregistrées pour l'occasion ; aucune imitation d'un commentateur réel, jamais la voix du propriétaire.
Sortie (hors du dépôt), par prise : <base>-brut.wav (Bark tel quel), <base>-clair.wav/.mp4 et <base>-fort.wav/.mp4 (traitement.py).
Rien n'est branché dans le jeu."""
import os, sys, time, json
OUTILS, SORTIE = sys.argv[1], sys.argv[2]
def option(nom, defaut):
    return sys.argv[sys.argv.index(nom) + 1] if nom in sys.argv else defaut
PRISES = int(option('--prises', '3'))
JUSQUA = option('--jusqua', None)
LANGUES = option('--langues', 'fr,en').split(',')
os.environ.setdefault('XDG_CACHE_HOME', os.path.join(OUTILS, 'cache'))
os.environ['SUNO_USE_SMALL_MODELS'] = '1'
os.environ['SUNO_OFFLOAD_CPU'] = '0'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import traitement as T
from bark.generation import SAMPLE_RATE, preload_models, generate_text_semantic, generate_coarse, generate_fine, codec_decode
import torch, random

# des textes très courts, ponctuation forte, MAJUSCULES sur le mot fort (Bark crie plus, l'accent tombe dessus) ; pas de « … »
# (des hésitations). Les prises paires essaient un « — » pour l'élan (le Chef) : le tri dira si ça aide l'intonation ou si ça hésite
PHRASES = {
    'fr': [('depart', "Et c'est PARTI !", "Et c'est — PARTI !"), ('depassement', 'Il passe ! IL PASSE !', 'Il passe — IL PASSE !'),
           ('bataille', 'Quelle BAGARRE !', 'Quelle — BAGARRE !'), ('erreur', "Oh ! Il est dans l'HERBE !", "Oh ! Il est — dans l'HERBE !"),
           ('victoire', 'VICTOIRE !', 'Et — VICTOIRE !')],
    'en': [('depart', "And they're OFF!", "And they're — OFF!"), ('depassement', 'What a MOVE!', 'What a — MOVE!'),
           ('bataille', 'What a BATTLE!', 'What a — BATTLE!'), ('erreur', 'Oh! Off into the GRASS!', 'Oh! Off — into the GRASS!'),
           ('victoire', 'VICTORY!', 'And — VICTORY!')],
}
# la voix du premier essai d'abord (fr 2, en 6), puis d'autres voix fournies avec Bark
VOIX = {'fr': [2, 0, 3, 6], 'en': [6, 0, 3, 9]}
TEMP_TEXTE, TEMP_SON = 0.6, 0.6      # plus bas que 0,7 : moins de mots inventés et d'hésitations

def duree_max(texte):
    """Le plafond de génération (s) : ~0,09 s par lettre + 0,8 s, entre 1,6 et 3,6 s ; au-delà, Bark ajoute des mots."""
    return max(1.6, min(3.6, 0.8 + 0.09 * len(texte.replace(' ', ''))))

def heure_passee():
    if not JUSQUA: return False
    h, m = map(int, JUSQUA.split(':')); lt = time.localtime()
    return lt.tm_hour * 60 + lt.tm_min >= h * 60 + m

def main():
    os.makedirs(SORTIE, exist_ok=True)
    journal = os.path.join(SORTIE, 'prises.json')
    faites = json.load(open(journal)) if os.path.exists(journal) else {}
    t0 = time.time(); preload_models(); print('modèles chargés en %.0f s' % (time.time() - t0), flush=True)
    for prise in range(1, PRISES + 1):
        for langue in LANGUES:
            for voix in VOIX[langue]:
                for cle, simple, elan in PHRASES[langue]:
                    texte = elan if prise % 2 == 0 else simple
                    nom = 'bark-%s-v%d-%s-p%d' % (langue, voix, cle, prise)
                    if nom in faites: continue
                    if heure_passee(): print('heure atteinte, arrêt'); return
                    t1 = time.time()
                    g = 1000 * prise + 10 * voix + len(cle); torch.manual_seed(g); np.random.seed(g); random.seed(g)   # une graine par prise : les prises diffèrent, on peut refaire
                    hp = 'v2/%s_speaker_%d' % (langue, voix)
                    sem = generate_text_semantic(texte, history_prompt=hp, temp=TEMP_TEXTE, silent=True, use_kv_caching=True,
                                                 max_gen_duration_s=duree_max(texte))
                    coarse = generate_coarse(sem, history_prompt=hp, temp=TEMP_SON, silent=True, use_kv_caching=True)
                    x = np.asarray(codec_decode(generate_fine(coarse, history_prompt=hp, temp=0.5)), dtype=np.float64)
                    base = os.path.join(SORTIE, nom)
                    T.ecrire_wav(base + '-brut.wav', T.normaliser(x, -1), SAMPLE_RATE)
                    for niveau in ('clair', 'fort'):
                        y, sr2 = T.energie(x, SAMPLE_RATE, niveau=niveau)
                        T.ecrire_wav(base + '-' + niveau + '.wav', y, sr2); T.encoder_mp4(base + '-' + niveau + '.wav', base + '-' + niveau + '.mp4')
                    faites[nom] = dict(langue=langue, voix=voix, cle=cle, prise=prise, texte=texte, duree_brute=len(x) / SAMPLE_RATE,
                                       parole=T.duree_parole(T.rogner(x, SAMPLE_RATE), SAMPLE_RATE), calcul=time.time() - t1)
                    json.dump(faites, open(journal, 'w'), indent=1, ensure_ascii=False)
                    print(nom, '%.2f s de parole' % faites[nom]['parole'], '(%.0f s de calcul)' % faites[nom]['calcul'], flush=True)

if __name__ == '__main__':
    main()
