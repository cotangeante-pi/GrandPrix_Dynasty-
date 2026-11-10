"""Tour 52c : la part de prises comprises par Whisper (transcrire.juger), par voix et par variante de texte (bark_liste.py --variantes).
Lancement : OUTILS/venv-bark/bin/python tests/voix/stats_variantes.py SORTIE"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import transcrire as TR
S = sys.argv[1]
prises, notes = json.load(open(os.path.join(S, 'prises.json'))), json.load(open(os.path.join(S, 'notes.json')))
T = {}
for nom, n in notes.items():
    p = prises[nom]; k = ('voix %d' % p['voix'], p.get('variante', 'plain'))
    ok = not TR.juger(p['texte'], n['texte_entendu'], n['parole'])['rejet']
    a = T.setdefault(k, [0, 0, 0]); a[1] += 1; a[0] += ok; a[2] += ok and n.get('intonation', {}).get('note', 0) >= 0.7
for k, (ok, n, bon) in sorted(T.items()): print('%-8s %-10s %3d/%3d comprises (%2d %%)' % (k + (ok, n, round(100 * ok / n))))
