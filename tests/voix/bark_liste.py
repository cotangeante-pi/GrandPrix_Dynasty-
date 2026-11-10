"""La liste complète des exclamations (tour 51d) avec Bark : lit liste.json (un id, un moment, un texte par phrase) et fabrique
3 à 4 prises par phrase et par voix (voix fr 7 puis fr 4, provisoires : le propriétaire n'a pas encore choisi). Même réglages que
bark_essai.py (petits modèles, températures, plafond de durée). Les prises déjà faites sont gardées ; à l'heure --jusqua, il finit
la prise en cours et s'arrête. Rien n'est branché dans le jeu.
Lancement : OUTILS/venv-bark/bin/python tests/voix/bark_liste.py OUTILS SORTIE [--prises N] [--de N] [--voix 7,4] [--jusqua HH:MM]
Sortie par prise : <id>-v<voix>-p<prise>-brut.wav et -clair.wav (pour la transcription), journal prises.json (même forme que l'essai
n° 3 : langue, voix, cle = id, texte), pour transcrire.py puis liste_page.py."""
import os, sys, time, json
OUTILS, SORTIE = sys.argv[1], sys.argv[2]
def option(nom, defaut):
    return sys.argv[sys.argv.index(nom) + 1] if nom in sys.argv else defaut
PRISES, DE, JUSQUA = int(option('--prises', '3')), int(option('--de', '1')), option('--jusqua', None)
# (tour 52c) --variantes tiret,points,plain : la forme du texte envoyé à Bark change à chaque prise (en tournant) ; le texte comparé par Whisper reste l'original.
# Chaque prise note sa variante dans prises.json : on mesure ainsi, sur la vraie liste, laquelle est le plus souvent comprise (stats_variantes.py).
FORMES = {'plain': '%s', 'tiret': '— %s', 'points': '%s...', 'guillemets': '« %s »'}
VARIANTES = option('--variantes', 'plain').split(',')
VOIX = [int(v) for v in option('--voix', '7,4').split(',')]
os.environ.setdefault('XDG_CACHE_HOME', os.path.join(OUTILS, 'cache'))
os.environ['SUNO_USE_SMALL_MODELS'] = '1'
os.environ['SUNO_OFFLOAD_CPU'] = '0'
ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import numpy as np
import traitement as T
from bark.generation import SAMPLE_RATE, preload_models, generate_text_semantic, generate_coarse, generate_fine, codec_decode
import torch, random
TEMPS_TEXTE, TEMP_SON = [0.65, 0.78], 0.7
BONNES = int(option('--bonnes', '2'))  # une phrase qui a déjà BONNES prises comprises par Whisper (notes.json, relu à chaque prise) ne reçoit plus de prise

def comprises(cle):
    """Le nombre de prises de cette phrase que Whisper a comprises (notes.json, écrit par transcrire.py ; 0 s'il n'existe pas)."""
    try:
        import transcrire as TR
        notes, prises = json.load(open(os.path.join(SORTIE, 'notes.json'))), json.load(open(os.path.join(SORTIE, 'prises.json')))
        return sum(1 for nom, n in notes.items() if prises[nom]['cle'] == cle and not TR.juger(prises[nom]['texte'], n['texte_entendu'], n['parole'])['rejet'])
    except Exception:
        return 0

def duree_max(texte):
    return max(2.4, min(4.5, 1.2 + 0.12 * len(texte.replace(' ', ''))))

def heure_passee():
    if not JUSQUA: return False
    h, m = map(int, JUSQUA.split(':')); lt = time.localtime()
    return lt.tm_hour * 60 + lt.tm_min >= h * 60 + m

def main():
    liste = json.load(open(os.path.join(ICI, 'liste.json')))
    os.makedirs(SORTIE, exist_ok=True)
    journal = os.path.join(SORTIE, 'prises.json')
    faites = json.load(open(journal)) if os.path.exists(journal) else {}
    preload_models()
    for prise in range(DE, DE + PRISES):
        for voix in VOIX:
            for ph in liste:
                nom = 'bark-fr-v%d-%s-p%d' % (voix, ph['id'], prise)
                if nom in faites: continue
                if comprises(ph['id']) >= BONNES: continue
                if heure_passee(): print('heure atteinte, arrêt', flush=True); return
                t1, texte = time.time(), ph['texte']; var = VARIANTES[(prise - DE) % len(VARIANTES)]; envoye = FORMES[var] % texte
                g = 1000 * prise + 10 * voix + sum(map(ord, ph['id'])) % 997; torch.manual_seed(g); np.random.seed(g); random.seed(g)
                hp = 'v2/fr_speaker_%d' % voix
                sem = generate_text_semantic(envoye, history_prompt=hp, temp=TEMPS_TEXTE[prise % 2], silent=True, use_kv_caching=True, max_gen_duration_s=duree_max(envoye))
                coarse = generate_coarse(sem, history_prompt=hp, temp=TEMP_SON, silent=True, use_kv_caching=True)
                x = np.asarray(codec_decode(generate_fine(coarse, history_prompt=hp, temp=0.5)), dtype=np.float64)
                base = os.path.join(SORTIE, nom)
                T.ecrire_wav(base + '-brut.wav', T.normaliser(x, -1), SAMPLE_RATE)
                y, sr2 = T.energie(x, SAMPLE_RATE, niveau='clair'); T.ecrire_wav(base + '-clair.wav', y, sr2)
                faites[nom] = dict(langue='fr', voix=voix, cle=ph['id'], moment=ph['moment'], prise=prise, texte=texte, variante=var, calcul=time.time() - t1)
                json.dump(faites, open(journal, 'w'), indent=1, ensure_ascii=False)
                print(nom, '(%.0f s)' % faites[nom]['calcul'], flush=True)

if __name__ == '__main__':
    main()
