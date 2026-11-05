"""L'essai du commentateur en voix fabriquée avec Bark (Suno, licence MIT pour le code ET les poids : usage commercial permis,
github.com/suno-ai/bark). Bark sait crier et s'exciter, mais il est lent sur le Mac de 2014 (processeur seul) : on prend les
petits modèles (SUNO_USE_SMALL_MODELS) et une seule prise par phrase.
Les outils restent HORS du dépôt, dans OUTILS (donné en argument) :
  OUTILS/venv-bark       python3 -m venv venv-bark ; pip install torch==2.2.2 "numpy<2" git+https://github.com/suno-ai/bark
  les poids              téléchargés par Bark lui-même dans XDG_CACHE_HOME=OUTILS/cache (huggingface.co/suno/bark, MIT)
Lancement : OUTILS/venv-bark/bin/python tests/voix/bark_essai.py OUTILS SORTIE [fr|en]
Voix : les « speaker presets » fournis avec Bark (v2/fr_speaker_N, v2/en_speaker_N), des voix synthétiques de Suno, pas des
personnes réelles enregistrées pour l'occasion ; aucune imitation d'un commentateur réel, jamais la voix du propriétaire.
Les sons vont dans SORTIE (hors du dépôt), en .wav brut et en .m4a retravaillé (traitement.py) ; ils ne sont PAS branchés."""
import os, sys, time
OUTILS, SORTIE = sys.argv[1], sys.argv[2]
LANGUES = [a for a in sys.argv[3:] if a in ('fr', 'en')] or ['fr']
os.environ.setdefault('XDG_CACHE_HOME', os.path.join(OUTILS, 'cache'))
os.environ['SUNO_USE_SMALL_MODELS'] = '1'
os.environ['SUNO_OFFLOAD_CPU'] = '0'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import traitement as T
from bark import SAMPLE_RATE, generate_audio, preload_models

# en majuscules et avec « ! » : Bark crie plus ; « — » et « ... » : il prend son élan
PHRASES = {
    'fr': [('depart', "Et c'est PARTI !"), ('depassement', 'Il passe ! IL PASSE !'), ('bataille', 'Quelle BAGARRE !'),
           ('erreur', "Oh ! Il est dans l'herbe !"), ('victoire', 'VICTOIRE !')],
    'en': [('depart', "And they're OFF!"), ('depassement', 'What a MOVE!'), ('bataille', 'What a BATTLE!'),
           ('erreur', 'Oh! Off into the grass!'), ('victoire', 'VICTORY!')],
}
VOIX = {'fr': 'v2/fr_speaker_2', 'en': 'v2/en_speaker_6'}

def main():
    os.makedirs(SORTIE, exist_ok=True)
    t0 = time.time(); preload_models(); print('modèles chargés en %.0f s' % (time.time() - t0), flush=True)
    for langue in LANGUES:
        for cle, texte in PHRASES[langue]:
            t0 = time.time()
            x = generate_audio(texte, history_prompt=VOIX[langue], text_temp=0.7, waveform_temp=0.7, silent=True)
            x = np.asarray(x, dtype=np.float64)
            # Bark ajoute souvent du silence ou un souffle à la fin : on coupe ce qui suit la dernière parole
            env = np.convolve(np.abs(x), np.ones(1200) / 1200, 'same'); fort = np.where(env > 0.04 * env.max())[0]
            if len(fort): x = x[max(0, fort[0] - 800): fort[-1] + 2400]
            base = os.path.join(SORTIE, 'bark-%s-%s' % (langue, cle))
            T.ecrire_wav(base + '-brut.wav', T.normaliser(x, -1), SAMPLE_RATE)
            y, sr2 = T.energie(x, SAMPLE_RATE, plus_haut=1.03)
            T.ecrire_wav(base + '.wav', y, sr2); T.encoder_m4a(base + '.wav', base + '.m4a')
            print(base, '%.2f s' % (len(y) / sr2), os.path.getsize(base + '.m4a'), 'octets', '(%.0f s de calcul)' % (time.time() - t0), flush=True)

if __name__ == '__main__':
    main()
