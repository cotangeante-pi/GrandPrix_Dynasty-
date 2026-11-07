"""Le tri des prises Bark par calcul (tour 48e) : chaque prise est transcrite par Whisper (openai-whisper, licence MIT pour le code et
les poids ; installé hors du dépôt : OUTILS/venv-bark/bin/pip install openai-whisper ; les poids dans OUTILS/cache), puis comparée
au texte voulu. Une prise est REJETÉE si :
  - la transcription contient un mot parasite (um, uh, euh, I guess, you know…), toujours ;
  - la transcription a des mots en trop (« I guess », « uh », un mot inventé) ou en moins : ressemblance des mots < SEUIL ;
  - la parole dure plus que prévu pour la phrase (hésitations, mots ajoutés) : > 1,7 × la durée attendue (0,075 s par lettre + 0,35 s).
Les autres sont classées par INTONATION d'abord (le propriétaire : « c'est surtout l'intonation » ; traitement.intonation, sur la
prise brute : étendue de la hauteur, fin qui monte, dernière syllabe forte), puis par ressemblance. Pas de ffmpeg : le son est lu en
numpy (traitement.lire_wav) et rééchantillonné à 16 kHz.
Lancement : OUTILS/venv-bark/bin/python tests/voix/transcrire.py OUTILS SORTIE [modele]   (modele : small par défaut)
Écrit SORTIE/notes.json : { prise: { texte_entendu, ressemblance, en_trop, parole, attendu, rejet, raison } }."""
import os, sys, json, re, difflib, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SEUIL = 0.75
# les mots que Bark ajoute (le propriétaire : « des petits "I guess" ») : toujours rejetés
PARASITES = re.compile(r' (um+|uh+|hm+|euh+|bah|ben|i guess|you know|like|professional|okay|ok) ')

# (essai n° 3) les mots qui se prononcent pareil : « Quel bagarre ! » entendu pour « Quelle BAGARRE ! » n'est pas une erreur de Bark
# (à l'essai n° 2, presque toutes les prises de la bataille en français étaient rejetées pour ça)
HOMOPHONES = {'quelle': 'quel', 'quels': 'quel', 'quelles': 'quel', 'parti': 'partie', 'partis': 'partie'}

def mots(s):
    s = unicodedata.normalize('NFKD', s.lower().replace('’', "'")); s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9' ]+", ' ', s).replace("'", ' ')
    return [HOMOPHONES.get(m, m) for m in s.split() if m]

def attendu(texte):
    return 0.35 + 0.075 * len(re.sub(r'[^A-Za-zÀ-ÿ]', '', texte))

def juger(texte, ent, parole):
    """(essai n° 3, aussi pour relire les notes de l'essai n° 2 sans retranscrire) : { ressemblance, en_trop, attendu, rejet, raison }"""
    A, B = mots(texte), mots(ent)
    sm = difflib.SequenceMatcher(None, A, B)
    en_trop = sum(j2 - j1 for op, i1, i2, j1, j2 in sm.get_opcodes() if op in ('insert', 'replace'))
    att = attendu(texte)
    rejet, raison = False, ''
    parasite = PARASITES.search(' ' + ' '.join(B) + ' ')
    if parasite: rejet, raison = True, 'hésitation ou mot ajouté (' + parasite.group(0).strip() + ')'
    elif sm.ratio() < SEUIL: rejet, raison = True, 'mots différents'
    elif parole > 1.7 * att: rejet, raison = True, 'trop longue'
    return dict(ressemblance=round(sm.ratio(), 2), en_trop=en_trop, attendu=round(att, 2), rejet=rejet, raison=raison)

def main():
    OUTILS, SORTIE = sys.argv[1], sys.argv[2]
    MODELE = sys.argv[3] if len(sys.argv) > 3 else 'small'
    os.environ.setdefault('XDG_CACHE_HOME', os.path.join(OUTILS, 'cache'))
    import numpy as np
    import traitement as T
    import whisper
    prises = json.load(open(os.path.join(SORTIE, 'prises.json')))
    chemin = os.path.join(SORTIE, 'notes.json')
    notes = json.load(open(chemin)) if os.path.exists(chemin) else {}
    m = whisper.load_model(MODELE, download_root=os.path.join(OUTILS, 'cache', 'whisper'))
    for nom, p in prises.items():
        if nom in notes: continue
        x, sr = T.lire_wav(os.path.join(SORTIE, nom + '-clair.wav'))   # la version claire : silences raccourcis, pas d'écho
        a = np.interp(np.arange(int(len(x) * 16000 / sr)) * sr / 16000, np.arange(len(x)), x).astype(np.float32)
        r = m.transcribe(a, language=p['langue'], temperature=0.0, condition_on_previous_text=False, fp16=False)
        ent = r['text'].strip(); parole = T.duree_parole(x, sr)
        xb, srb = T.lire_wav(os.path.join(SORTIE, nom + '-brut.wav'))
        notes[nom] = dict(intonation=T.intonation(xb, srb), texte_entendu=ent, parole=round(parole, 2), **juger(p['texte'], ent, parole))
        json.dump(notes, open(chemin, 'w'), indent=1, ensure_ascii=False)
        print(nom, '|', ent, '|', notes[nom]['ressemblance'], notes[nom]['intonation']['note'], notes[nom]['raison'], flush=True)

if __name__ == '__main__':
    main()
