"""Le tri des prises Bark par calcul (tour 48e) : chaque prise est transcrite par Whisper (openai-whisper, licence MIT pour le code et
les poids ; installé hors du dépôt : OUTILS/venv-bark/bin/pip install openai-whisper ; les poids dans OUTILS/cache), puis comparée
au texte voulu. Une prise est REJETÉE si :
  - la transcription a des mots en trop (« I guess », « uh », un mot inventé) ou en moins : ressemblance des mots < SEUIL ;
  - la parole dure plus que prévu pour la phrase (hésitations, mots ajoutés) : > 1,7 × la durée attendue (0,075 s par lettre + 0,35 s).
Les autres sont classées par INTONATION d'abord (le propriétaire : « c'est surtout l'intonation » ; traitement.intonation, sur la
prise brute : étendue de la hauteur, fin qui monte, dernière syllabe forte), puis par ressemblance. Pas de ffmpeg : le son est lu en
numpy (traitement.lire_wav) et rééchantillonné à 16 kHz.
Lancement : OUTILS/venv-bark/bin/python tests/voix/transcrire.py OUTILS SORTIE [modele]   (modele : small par défaut)
Écrit SORTIE/notes.json : { prise: { texte_entendu, ressemblance, en_trop, parole, attendu, rejet, raison } }."""
import os, sys, json, re, difflib, unicodedata
OUTILS, SORTIE = sys.argv[1], sys.argv[2]
MODELE = sys.argv[3] if len(sys.argv) > 3 else 'small'
os.environ.setdefault('XDG_CACHE_HOME', os.path.join(OUTILS, 'cache'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import traitement as T
import whisper

SEUIL = 0.75

def mots(s):
    s = unicodedata.normalize('NFKD', s.lower().replace('’', "'")); s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9' ]+", ' ', s).replace("'", ' ')
    return [m for m in s.split() if m]

def attendu(texte):
    return 0.35 + 0.075 * len(re.sub(r'[^A-Za-zÀ-ÿ]', '', texte))

def main():
    prises = json.load(open(os.path.join(SORTIE, 'prises.json')))
    chemin = os.path.join(SORTIE, 'notes.json')
    notes = json.load(open(chemin)) if os.path.exists(chemin) else {}
    m = whisper.load_model(MODELE, download_root=os.path.join(OUTILS, 'cache', 'whisper'))
    for nom, p in prises.items():
        if nom in notes: continue
        x, sr = T.lire_wav(os.path.join(SORTIE, nom + '-clair.wav'))   # la version claire : silences raccourcis, pas d'écho
        a = np.interp(np.arange(int(len(x) * 16000 / sr)) * sr / 16000, np.arange(len(x)), x).astype(np.float32)
        r = m.transcribe(a, language=p['langue'], temperature=0.0, condition_on_previous_text=False, fp16=False)
        ent = r['text'].strip(); A, B = mots(p['texte']), mots(ent)
        sm = difflib.SequenceMatcher(None, A, B)
        en_trop = sum(j2 - j1 for op, i1, i2, j1, j2 in sm.get_opcodes() if op in ('insert', 'replace'))
        parole, att = T.duree_parole(x, sr), attendu(p['texte'])
        rejet, raison = False, ''
        if sm.ratio() < SEUIL: rejet, raison = True, 'mots différents'
        elif parole > 1.7 * att: rejet, raison = True, 'trop longue'
        xb, srb = T.lire_wav(os.path.join(SORTIE, nom + '-brut.wav'))
        notes[nom] = dict(intonation=T.intonation(xb, srb), texte_entendu=ent, ressemblance=round(sm.ratio(), 2), en_trop=en_trop, parole=round(parole, 2), attendu=round(att, 2), rejet=rejet, raison=raison)
        json.dump(notes, open(chemin, 'w'), indent=1, ensure_ascii=False)
        print(nom, '|', ent, '|', notes[nom]['ressemblance'], notes[nom]['intonation']['note'], raison, flush=True)

if __name__ == '__main__':
    main()
