"""L'essai du commentateur en voix fabriquée avec Piper (CLAUDE.md, « De vraies voix enregistrées », « D'abord un essai »).
Les outils et les modèles restent HORS du dépôt, dans un dossier de travail OUTILS (donné en argument) :
  OUTILS/venv            python3 -m venv venv ; venv/bin/pip install piper-tts        (piper-tts 1.8, GPL-3 : l'outil seulement,
                         il ne part pas dans le jeu ; les sons qu'il fabrique ne sont pas couverts par la GPL)
  OUTILS/modeles         les modèles .onnx + .onnx.json + MODEL_CARD de huggingface.co/rhasspy/piper-voices
Lancement : OUTILS/venv/bin/python tests/voix/piper_essai.py OUTILS SORTIE [--locuteurs]
  --locuteurs : fait dire une phrase à chacun des 125 locuteurs de fr_FR-mls-medium et classe par hauteur moyenne (pour choisir)
Les sons de l'essai vont dans SORTIE (hors du dépôt), en .wav brut et en .m4a retravaillé ; ils ne sont PAS branchés dans le jeu.

Les voix, et pourquoi elles (seulement des licences qui permettent un jeu publié et vendu) :
  fr_FR-mls-medium     données Multilingual LibriSpeech (openslr.org/94, CC BY 4.0 : citer « MLS, Pratap et al. 2020 » dans les
                       crédits), entraîné DE ZÉRO (model card) ; 125 locuteurs (livres audio LibriVox, domaine public).
  en_US-norman-medium  données LibriVox, domaine public, entraîné de zéro (model card).
  Écartées : fr siwis, upmc, tom, gilles et en joe, libritts_r, alan (affinés depuis lessac ou ryan, dont les licences
  interdisent l'usage commercial, ou AGPL / licence floue) ; en ryan, hfc_male (CC BY-NC-SA, pas commercial).
  Aucune voix tirée d'une vidéo, aucune imitation d'un commentateur réel, jamais la voix du propriétaire.
"""
import os, sys, json, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import traitement as T
from piper import PiperVoice, SynthesisConfig

PHRASES = {
    'fr': [('depart', 'Et c\'est parti !'), ('depassement', 'Il passe ! Il passe !'), ('bataille', 'Quelle bagarre !'),
           ('erreur', 'Oh ! Il est dans l\'herbe !'), ('victoire', 'Victoire !')],
    'en': [('depart', 'And they\'re off!'), ('depassement', 'What a move!'), ('bataille', 'What a battle!'),
           ('erreur', 'Oh! Off into the grass!'), ('victoire', 'Victory!')],
}
# une diction rapide et vivante : length_scale < 1 = plus vite ; noise un peu au-dessus du modèle (0,333) = une intonation moins
# plate. Pas plus : avec noise_w 0,9, « Victoire ! » durait 3,4 s (des pauses et des syllabes étirées au hasard)
CONFIG = dict(length_scale=0.8, noise_scale=0.5, noise_w_scale=0.4)

def dire(voix, texte, chemin, locuteur=None, **reglages):
    c = dict(CONFIG); c.update(reglages)
    with wave.open(chemin, 'wb') as w:
        voix.synthesize_wav(texte, w, syn_config=SynthesisConfig(speaker_id=locuteur, **c))

def hauteur(x, sr):
    """Hauteur moyenne (Hz) par autocorrélation sur les trames qui sonnent : basse = voix grave."""
    n = int(0.04 * sr); f = []
    for i in range(0, len(x) - n, n // 2):
        t = x[i:i + n]
        if np.sqrt(np.mean(t * t)) < 0.03: continue
        a = np.correlate(t, t, 'full')[n - 1:]
        lo, hi = int(sr / 400), int(sr / 70)
        k = lo + int(np.argmax(a[lo:hi]))
        if a[k] > 0.4 * a[0]: f.append(sr / k)
    return float(np.median(f)) if f else 0.0

def main():
    outils, sortie = sys.argv[1], sys.argv[2]
    os.makedirs(sortie, exist_ok=True)
    m = lambda n: os.path.join(outils, 'modeles', n + '.onnx')
    fr = PiperVoice.load(m('fr_FR-mls-medium'))
    if '--locuteurs' in sys.argv:
        res = []
        for nom, idx in fr.config.speaker_id_map.items():
            p = os.path.join(sortie, 'loc.wav'); dire(fr, 'Et c\'est parti pour le Grand Prix !', p, idx)
            x, sr = T.lire_wav(p); res.append((hauteur(x, sr), idx, nom))
        res.sort(); json.dump(res, open(os.path.join(sortie, 'locuteurs.json'), 'w'), indent=0)
        for r in res[:20]: print('%.0f Hz  id %d  (MLS %s)' % r)
        return
    choix = json.load(open(os.path.join(sortie, 'choix.json')))   # {"fr": [id, …], "en": [null]}
    voix = {'fr': fr, 'en': PiperVoice.load(m('en_US-norman-medium'))}
    for langue, locs in choix.items():
        for loc in locs:
            for cle, texte in PHRASES[langue]:
                base = os.path.join(sortie, 'piper-%s-%s-%s' % (langue, 'n' if loc is None else loc, cle))
                dire(voix[langue], texte, base + '-brut.wav', loc)
                x, sr = T.lire_wav(base + '-brut.wav')
                y, sr2 = T.energie(x, sr)
                T.ecrire_wav(base + '.wav', y, sr2); T.encoder_m4a(base + '.wav', base + '.m4a')
                print(base, '%.2f s' % (len(y) / sr2), os.path.getsize(base + '.m4a'), 'octets')

if __name__ == '__main__':
    main()
