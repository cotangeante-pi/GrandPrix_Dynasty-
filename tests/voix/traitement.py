"""Le traitement « énergie » des voix fabriquées (CLAUDE.md, « De vraies voix enregistrées ») : plus vite et un peu plus haut,
la présence (2 à 4 kHz) qui ressort, compressé et plus fort, un écho de stade et la foule en dessous (faite par le code, aucun
son extérieur). Calcul pur en numpy : ni ffmpeg ni sox (absents du Mac) ; l'encodage final passe par afconvert (macOS), en AAC
mono dans un .m4a, que lisent Chrome, Firefox et Safari. Ce dossier n'est pas dans le zip Poki (tests/paquet.py ne prend que ce
que index.html charge)."""
import math, wave, subprocess
import numpy as np

def lire_wav(chemin):
    with wave.open(chemin, 'rb') as w:
        sr, n, can = w.getframerate(), w.getnframes(), w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768.0
    if can > 1: x = x.reshape(-1, can).mean(axis=1)
    return x, sr

def ecrire_wav(chemin, x, sr):
    y = np.clip(x, -1, 1)
    with wave.open(chemin, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((y * 32767).astype(np.int16).tobytes())

def reechantillonner(x, facteur):
    """Lit le son `facteur` fois plus vite : plus court ET plus haut (comme une bande qui tourne plus vite)."""
    n = int(len(x) / facteur)
    return np.interp(np.arange(n) * facteur, np.arange(len(x)), x)

def vers_frequence(x, sr, sr2):
    n = int(len(x) * sr2 / sr)
    return np.interp(np.arange(n) * sr / sr2, np.arange(len(x)), x)

def biquad(x, b, a):
    """Filtre du 2e ordre (forme directe I), en boucle : les sons font une à deux secondes."""
    b0, b1, b2 = b[0] / a[0], b[1] / a[0], b[2] / a[0]; a1, a2 = a[1] / a[0], a[2] / a[0]
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i, v in enumerate(x):
        r = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, v, y1, r; y[i] = r
    return y

def passe_haut(x, sr, f, q=0.707):
    w = 2 * math.pi * f / sr; al = math.sin(w) / (2 * q); c = math.cos(w)
    return biquad(x, [(1 + c) / 2, -(1 + c), (1 + c) / 2], [1 + al, -2 * c, 1 - al])

def passe_bas(x, sr, f, q=0.707):
    w = 2 * math.pi * f / sr; al = math.sin(w) / (2 * q); c = math.cos(w)
    return biquad(x, [(1 - c) / 2, 1 - c, (1 - c) / 2], [1 + al, -2 * c, 1 - al])

def cloche(x, sr, f, gain_db, q=1.0):
    A = 10 ** (gain_db / 40); w = 2 * math.pi * f / sr; al = math.sin(w) / (2 * q); c = math.cos(w)
    return biquad(x, [1 + al * A, -2 * c, 1 - al * A], [1 + al / A, -2 * c, 1 - al / A])

def compresser(x, sr, seuil_db=-22, ratio=4.0, attaque=0.004, relache=0.08, gain_db=10):
    """Compresseur simple : suiveur d'enveloppe, puis le gain qui baisse au-dessus du seuil ; ensuite le gain de remontée."""
    ea, er = math.exp(-1 / (attaque * sr)), math.exp(-1 / (relache * sr))
    env = np.zeros_like(x); e = 0.0
    for i, v in enumerate(np.abs(x)):
        e = ea * e + (1 - ea) * v if v > e else er * e + (1 - er) * v
        env[i] = e
    niv = 20 * np.log10(np.maximum(env, 1e-6))
    reduc = np.where(niv > seuil_db, (niv - seuil_db) * (1 - 1 / ratio), 0.0)
    return x * 10 ** ((gain_db - reduc) / 20)

def saturer(x, pousse=1.6):
    """Un peu de saturation douce (tanh) : la voix « crie » plus, sans craquer."""
    return np.tanh(x * pousse) / np.tanh(pousse)

def echo_stade(x, sr, retards=(0.071, 0.123, 0.197, 0.29), gains=(0.22, 0.15, 0.10, 0.06)):
    y = np.concatenate([x, np.zeros(int(0.45 * sr))])
    sombre = passe_bas(x, sr, 2500)
    for r, g in zip(retards, gains):
        d = int(r * sr); y[d:d + len(x)] += g * sombre
    return y

def foule(n, sr, niveau=0.05, graine=7):
    """La foule faite par le code : du bruit filtré (500 Hz – 3 kHz), qui ondule lentement, avec une montée et une descente."""
    rng = np.random.default_rng(graine)
    b = passe_bas(passe_haut(rng.standard_normal(n), sr, 500), sr, 3000)
    t = np.arange(n) / sr
    ondule = 0.75 + 0.25 * np.sin(2 * math.pi * 0.9 * t + 1.3) * np.sin(2 * math.pi * 0.37 * t)
    fondu = np.minimum(1, np.minimum(t / 0.25, (n / sr - t) / 0.35))
    b = b / (np.max(np.abs(b)) + 1e-9)
    return niveau * b * ondule * np.maximum(fondu, 0)

def normaliser(x, crete_db=-1.0):
    return x * (10 ** (crete_db / 20) / (np.max(np.abs(x)) + 1e-9))

def rogner(x, sr, seuil=0.03):
    """Coupe le silence avant et après la parole (garde 40 ms devant, 120 ms derrière)."""
    n = int(0.01 * sr); e = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x), n)])
    fort = np.where(e > seuil * e.max())[0]
    if not len(fort): return x
    return x[max(0, fort[0] * n - int(0.04 * sr)): min(len(x), (fort[-1] + 1) * n + int(0.12 * sr))]

# (tour 48e) deux niveaux, pour garder la clarté (le propriétaire, 2026-11-05 : seul « Bark retravaillé » se comprend en français) :
# « clair » : presque pas d'écho, foule très basse, aucune saturation (elle mangeait les consonnes), compression douce ;
# « fort »  : plus d'élan (un peu plus vite et plus haut, la fin qui monte d'un demi-ton… d'un ton, compression plus forte, une pointe
#             de saturation), écho et foule toujours bas.
# « ancien » : le réglage de l'essai du 2026-11-05 (pour comparer).
NIVEAUX = {
    'clair':  dict(plus_haut=1.0,  presence=3, seuil=-20, ratio=2.5, gain=6,  pousse=0,   echo=((0.06,), (0.07,)),            foule=0.012),
    'fort':   dict(plus_haut=1.04, presence=4, seuil=-22, ratio=4.0, gain=9,  pousse=1.15, echo=((0.071, 0.123), (0.10, 0.06)), foule=0.022),
    'ancien': dict(plus_haut=1.03, presence=5, seuil=-22, ratio=4.0, gain=10, pousse=1.6, echo=((0.071, 0.123, 0.197, 0.29), (0.22, 0.15, 0.10, 0.06)), foule=0.05),
}

def raccourcir_silences(x, sr, garde=0.09, seuil=0.06):
    """(tour 48e, le propriétaire : « de trop grosses hésitations ») : tout silence AU MILIEU de la phrase plus long que `garde` s est
    ramené à `garde` s (trames de 10 ms sous `seuil` × la trame la plus forte), avec un fondu de 5 ms à chaque coupure."""
    n = int(0.01 * sr); nb = len(x) // n
    if nb < 3: return x
    e = np.array([np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2)) for i in range(nb)])
    calme = e < seuil * e.max(); g = max(1, int(round(garde / 0.01)))
    garder = np.ones(nb, dtype=bool); i = 0
    while i < nb:
        if calme[i]:
            j = i
            while j < nb and calme[j]: j += 1
            if j - i > g: garder[i + g // 2: j - (g - g // 2)] = False
            i = j
        else: i += 1
    morceaux, f = [], int(0.005 * sr)
    i = 0
    while i < nb:
        if not garder[i]: i += 1; continue
        j = i
        while j < nb and garder[j]: j += 1
        m = x[i * n: j * n].copy()
        if len(m) > 2 * f: m[:f] *= np.linspace(0, 1, f); m[-f:] *= np.linspace(1, 0, f)
        morceaux.append(m); i = j
    morceaux.append(x[nb * n:])
    return np.concatenate(morceaux)

def duree_parole(x, sr, seuil=0.06):
    """La durée (s) des trames qui sonnent : pour rejeter une prise trop longue (des mots ajoutés, des hésitations)."""
    n = int(0.01 * sr); nb = len(x) // n
    if nb == 0: return 0.0
    e = np.array([np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2)) for i in range(nb)])
    return float(np.sum(e >= seuil * e.max()) * 0.01)

def monter_fin(x, sr, demi_tons=1.0, duree=0.25, seuil=0.06):
    """(tour 48e, le propriétaire : « c'est surtout l'intonation ») : la fin de la parole monte un peu, au lieu de retomber comme une
    lecture : sur les `duree` dernières secondes qui sonnent, la lecture accélère progressivement jusqu'à +`demi_tons` (la hauteur
    monte d'autant, la fin raccourcit un peu)."""
    n = int(0.01 * sr); nb = len(x) // n
    if nb < 5: return x
    e = np.array([np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2)) for i in range(nb)])
    fin = (np.where(e >= seuil * e.max())[0][-1] + 1) * n; debut = max(0, fin - int(duree * sr))
    vitesse = 2 ** (demi_tons / 12)
    pos, sortie = float(debut), []
    while pos < fin - 1:
        sortie.append(pos); pos += 1 + (vitesse - 1) * min(1.0, (pos - debut) / max(1, fin - debut))
    milieu = np.interp(np.array(sortie), np.arange(len(x)), x)
    return np.concatenate([x[:debut], milieu, x[fin:]])

def energie(x, sr, plus_haut=None, sortie_sr=32000, avec_foule=True, avec_echo=True, niveau='ancien'):
    """La chaîne complète : vitesse + hauteur, nettoyage, présence, compression, saturation, écho, foule, normalisation."""
    N = NIVEAUX[niveau]
    x = rogner(x, sr)
    if niveau != 'ancien': x = raccourcir_silences(x, sr)
    if niveau == 'fort': x = monter_fin(x, sr)
    x = reechantillonner(x, N['plus_haut'] if plus_haut is None else plus_haut)
    x = vers_frequence(x, sr, sortie_sr); sr = sortie_sr
    x = passe_haut(x, sr, 90 if niveau == 'clair' else 110)
    x = cloche(x, sr, 250, -3, 0.8)          # moins de « carton »
    x = cloche(x, sr, 3000, N['presence'], 0.9)   # la présence : la voix passe devant le moteur
    x = normaliser(x, -3)
    x = compresser(x, sr, seuil_db=N['seuil'], ratio=N['ratio'], gain_db=N['gain'])
    x = normaliser(x, -1)
    if N['pousse'] > 0: x = saturer(x, N['pousse'])
    if avec_echo: x = echo_stade(x, sr, *N['echo'])
    if avec_foule: x = x + foule(len(x), sr, N['foule'])
    return normaliser(x, -1.0), sr

def encoder_m4a(wav, m4a, debit=48000):
    """AAC mono (lu par Chrome, Firefox, Safari) avec afconvert, l'outil de macOS."""
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', str(debit), wav, m4a], check=True)

def encoder_mp4(wav, mp4, debit=48000):
    """La même chose dans un .mp4 (AAC mono) : afconvert, type de fichier MPEG-4."""
    subprocess.run(['afconvert', '-f', 'mp4f', '-d', 'aac', '-b', str(debit), wav, mp4], check=True)

def hauteurs(x, sr, seuil=0.06):
    """La courbe de hauteur (Hz, None si la trame ne sonne pas) : trames de 30 ms tous les 10 ms, autocorrélation entre 70 et 450 Hz."""
    n, pas = int(0.03 * sr), int(0.01 * sr)
    rms = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n, pas)])
    if not len(rms): return []
    lo, hi, f = int(sr / 450), int(sr / 70), []
    for j, i in enumerate(range(0, len(x) - n, pas)):
        t = x[i:i + n] - np.mean(x[i:i + n])
        if rms[j] < seuil * rms.max(): f.append(None); continue
        a = np.correlate(t, t, 'full')[n - 1:]
        k = lo + int(np.argmax(a[lo:hi]))
        f.append(sr / k if a[0] > 0 and a[k] > 0.45 * a[0] else None)
    return f

def intonation(x, sr):
    """(tour 48e) La note d'intonation (0 à 1, plus haut = plus « commentateur ») d'une prise, sur sa courbe de hauteur en demi-tons :
    - l'étendue : l'écart entre les 10 % les plus bas et les 10 % les plus hauts (10 demi-tons ou plus = 1) ;
    - la fin : la hauteur du dernier tiers de la parole moins celle du début (+4 demi-tons ou plus = 1, −3 ou moins = 0 :
      une fin qui retombe, comme une lecture) ;
    - le claquement : la dernière syllabe encore forte (au moins la moitié du plus fort).
    note = 0,45 × étendue + 0,45 × fin + 0,10 × claquement."""
    x = rogner(x, sr); f = hauteurs(x, sr)
    v = [(i, 12 * np.log2(h)) for i, h in enumerate(f) if h]
    if len(v) < 6: return dict(note=0.0, etendue=0.0, fin=0.0, claque=False, voisees=len(v))
    st = np.array([s for i, s in v]); idx = np.array([i for i, s in v])
    med = np.median(st)                       # les sauts d'octave de la mesure (une trame lue au double ou à la moitié) ramenés
    st = np.where(st - med > 9, st - 12, np.where(med - st > 9, st + 12, st))
    etendue = float(np.percentile(st, 90) - np.percentile(st, 10))
    coupe = idx[0] + (idx[-1] - idx[0]) * 2 / 3
    debut, finale = st[idx < coupe], st[idx >= coupe]
    fin = float(np.median(finale) - np.median(debut)) if len(debut) and len(finale) else 0.0
    n = int(0.01 * sr); e = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n, n)])
    fortes = np.where(e >= 0.06 * e.max())[0]
    claque = bool(len(fortes) and e[max(0, fortes[-1] - 15):fortes[-1] + 1].max() >= 0.5 * e.max())
    note = 0.45 * min(etendue / 10, 1) + 0.45 * min(1, max(0, (fin + 3) / 7)) + 0.10 * claque
    return dict(note=round(note, 3), etendue=round(etendue, 1), fin=round(fin, 1), claque=claque, voisees=len(v))
