"""Tour 52c : comment augmenter la part de prises que Whisper comprend ? Essaie, sur quelques phrases courtes qui échouaient,
des variantes (voix fr intégrée, ponctuation / texte un peu plus long, température) et compte les prises comprises (transcrire.juger).
Lancement : OUTILS/venv-bark/bin/python tests/voix/essai_taux.py OUTILS SORTIE [--graines N]
Écrit SORTIE/taux.json (une ligne par prise) et affiche un tableau par variante."""
import os, sys, json, time
OUTILS, SORTIE = sys.argv[1], sys.argv[2]
G = int(sys.argv[sys.argv.index('--graines') + 1]) if '--graines' in sys.argv else 3
os.environ.setdefault('XDG_CACHE_HOME', os.path.join(OUTILS, 'cache'))
os.environ['SUNO_USE_SMALL_MODELS'] = '1'; os.environ['SUNO_OFFLOAD_CPU'] = '0'
ICI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ICI)
import numpy as np, torch, random, whisper
import traitement as T, transcrire as TR
from bark.generation import SAMPLE_RATE, preload_models, generate_text_semantic, generate_coarse, generate_fine, codec_decode
PH = [("Ça PASSE !", "Ça PASSE"), ("Quel CHRONO !", "Quel CHRONO"), ("Arrêt au STAND !", "Arrêt au STAND"), ("PÉNALITÉ !", "PÉNALITÉ")]
# (nom, voix, modèle de texte -> texte envoyé à Bark, température du texte, température du son)
VAR = [('base v7', 7, '%s', .65, .7), ('base v4', 4, '%s', .65, .7), ('v3', 3, '%s', .65, .7), ('v6', 6, '%s', .65, .7), ('v9', 9, '%s', .65, .7), ('v0', 0, '%s', .65, .7),
       ('v7 tiret', 7, '— %s', .65, .7), ('v7 points', 7, '%s...', .65, .7), ('v7 guillemets', 7, '« %s »', .65, .7),
       ('v7 temp .4', 7, '%s', .4, .6), ('v7 temp .9', 7, '%s', .9, .7), ('v7 temp .5/.5', 7, '%s', .5, .5)]
if '--var' in sys.argv: VAR = [v for v in VAR if v[0] in sys.argv[sys.argv.index('--var') + 1].split(',')]
def duree_max(t): return max(2.4, min(4.5, 1.2 + 0.12 * len(t.replace(' ', ''))))
def main():
    os.makedirs(SORTIE, exist_ok=True); chemin = os.path.join(SORTIE, 'taux.json')
    res = json.load(open(chemin)) if os.path.exists(chemin) else []
    faits = {(r['var'], r['id'], r['g']) for r in res}
    preload_models(); W = whisper.load_model('small', download_root=os.path.join(OUTILS, 'cache', 'whisper'))
    for g in range(1, G + 1):
        for nom, voix, modele, tt, ts in VAR:
            for i, (texte, _) in enumerate(PH):
                if (nom, i, g) in faits: continue
                t1 = time.time(); env = modele % texte
                s = 1000 * g + 10 * voix + i; torch.manual_seed(s); np.random.seed(s); random.seed(s)
                hp = 'v2/fr_speaker_%d' % voix
                sem = generate_text_semantic(env, history_prompt=hp, temp=tt, silent=True, use_kv_caching=True, max_gen_duration_s=duree_max(env))
                co = generate_coarse(sem, history_prompt=hp, temp=ts, silent=True, use_kv_caching=True)
                x = np.asarray(codec_decode(generate_fine(co, history_prompt=hp, temp=0.5)), dtype=np.float64)
                y, sr2 = T.energie(x, SAMPLE_RATE, niveau='clair')
                a = np.interp(np.arange(int(len(y) * 16000 / sr2)) * sr2 / 16000, np.arange(len(y)), y).astype(np.float32)
                ent = W.transcribe(a, language='fr', temperature=0.0, condition_on_previous_text=False, fp16=False)['text'].strip()
                j = TR.juger(texte, ent, T.duree_parole(y, sr2)); note = T.intonation2(T.normaliser(x, -1), SAMPLE_RATE)['note']
                res.append(dict(var=nom, id=i, g=g, texte=texte, entendu=ent, ok=not j['rejet'], note=note, s=round(time.time() - t1)))
                json.dump(res, open(chemin, 'w'), indent=1, ensure_ascii=False)
                print(nom, texte, '|', ent, '|', 'OK' if not j['rejet'] else 'non', round(note, 2), '(%d s)' % (time.time() - t1), flush=True)
    for nom, *_ in VAR:
        r = [x for x in res if x['var'] == nom]
        if r: print('%-16s %2d/%2d comprises, %2d avec note >= 0,7' % (nom, sum(x['ok'] for x in r), len(r), sum(x['ok'] and x['note'] >= .7 for x in r)))
if __name__ == '__main__': main()
