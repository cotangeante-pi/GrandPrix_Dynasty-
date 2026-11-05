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

def energie(x, sr, plus_haut=1.06, sortie_sr=32000, avec_foule=True, avec_echo=True):
    """La chaîne complète : vitesse + hauteur, nettoyage, présence, compression, saturation, écho, foule, normalisation."""
    x = rogner(x, sr)
    x = reechantillonner(x, plus_haut)
    x = vers_frequence(x, sr, sortie_sr); sr = sortie_sr
    x = passe_haut(x, sr, 110)
    x = cloche(x, sr, 250, -3, 0.8)          # moins de « carton »
    x = cloche(x, sr, 3000, 5, 0.9)          # la présence : la voix passe devant le moteur
    x = normaliser(x, -3)
    x = compresser(x, sr)
    x = saturer(normaliser(x, -1), 1.6)
    if avec_echo: x = echo_stade(x, sr)
    if avec_foule: x = x + foule(len(x), sr)
    return normaliser(x, -1.0), sr

def encoder_m4a(wav, m4a, debit=48000):
    """AAC mono (lu par Chrome, Firefox, Safari) avec afconvert, l'outil de macOS."""
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', str(debit), wav, m4a], check=True)
