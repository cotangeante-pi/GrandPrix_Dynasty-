"""La page d'écoute de la liste complète (tour 51d). Lancement :
  OUTILS/venv-bark/bin/python tests/voix/liste_page.py PRISES PAGE
  PRISES : le dossier de bark_liste.py, déjà transcrit (transcrire.py OUTILS PRISES) ;
  PAGE   : ecoute.html + les .mp4 gardés + fichiers.json (la liste des fichiers).
Tri (comme essai3.py) : une prise est écartée si Whisper n'entend pas le texte (mot en trop, mot différent, trop longue) ou si elle
finit en question (traitement.intonation2). On garde au plus GARDEES prises par phrase, d'abord celles dont la note est entre 0,75 et 0,9
(la cible du propriétaire est 0,8), seulement si la note est au moins NOTE_MIN (0,7). Chaque prise gardée passe par le niveau « vif »
(parole +9 %). La page est rangée par moment de course, avec la phrase, la note et ce que Whisper a entendu."""
import os, sys, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import traitement as T
import transcrire as TR

PRISES, PAGE = sys.argv[1], sys.argv[2]
NOTE_MIN, CIBLE, BAS, HAUT, GARDEES = 0.7, 0.8, 0.75, 0.9, 3
NOTE_MIN_SECOURS = 0.6  # (tour 54c) une phrase sans aucune prise à 0,7 accepte les prises comprises dès 0,6 (notée dans la page)

def main():
    liste = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'liste.json')))
    prises, notes = json.load(open(os.path.join(PRISES, 'prises.json'))), json.load(open(os.path.join(PRISES, 'notes.json')))
    os.makedirs(PAGE, exist_ok=True)
    cand, secours = {}, {}
    for nom, n in notes.items():
        p = prises[nom]
        j = TR.juger(p['texte'], n['texte_entendu'], n['parole'])
        if not os.path.exists(os.path.join(PRISES, nom + '-brut.wav')): continue  # (tour 55c) prise dont le son a été effacé
        xb, sr = T.lire_wav(os.path.join(PRISES, nom + '-brut.wav'))
        i2 = T.intonation2(xb, sr)
        if j['rejet'] or i2['question'] or i2['note'] < NOTE_MIN_SECOURS: continue
        (cand if i2['note'] >= NOTE_MIN else secours).setdefault(p['cle'], []).append(dict(nom=nom, voix=p['voix'], prise=p['prise'], entendu=n['texte_entendu'], note=i2['note'], into=i2))
    for cle, v in secours.items():
        if cle not in cand: cand[cle] = v; print('secours 0,6 :', cle, flush=True)
    # (tour 55c) les sons de vieilles prises ont été effacés : une phrase sans candidat garde sa prise déjà présente dans la page
    anciennes = {}
    try:
        h = open(os.path.join(PAGE, 'ecoute.html')).read(); anciennes = {e['id']: e for e in json.loads(h.split('const D=', 1)[1].split(';const z=', 1)[0])}
    except Exception:
        pass
    sortie, fichiers = [], []
    for ph in liste:
        cs = sorted(cand.get(ph['id'], []), key=lambda x: (not BAS <= x['note'] <= HAUT, abs(x['note'] - CIBLE)))[:GARDEES]
        pris = []
        for i, x in enumerate(cs):
            xb, sr = T.lire_wav(os.path.join(PRISES, x['nom'] + '-brut.wav'))
            y, sr2 = T.energie(xb, sr, niveau='vif')
            f = '%s-%d.mp4' % (ph['id'], i + 1)
            with tempfile.TemporaryDirectory() as tmp:
                w = os.path.join(tmp, 'vif.wav'); T.ecrire_wav(w, y, sr2); T.encoder_mp4(w, os.path.join(PAGE, f))
            pris.append(dict(fichier=f, voix=x['voix'], prise=x['prise'], entendu=x['entendu'], note=x['note'], duree=round(len(y) / sr2, 2)))
            fichiers.append(f)
        if not pris and anciennes.get(ph['id'], {}).get('prises'):
            pris = [x for x in anciennes[ph['id']]['prises'] if os.path.exists(os.path.join(PAGE, x['fichier']))]; fichiers += [x['fichier'] for x in pris]
        sortie.append(dict(id=ph['id'], moment=ph['moment'], texte=ph['texte'], prises=pris))
    json.dump([{'path': f} for f in fichiers + ['ecoute.html']], open(os.path.join(PAGE, 'fichiers.json'), 'w'), indent=1)
    open(os.path.join(PAGE, 'ecoute.html'), 'w').write(PAGE_HTML.replace('__DONNEES__', json.dumps(sortie, ensure_ascii=False)))
    vides = [s['id'] for s in sortie if not s['prises']]
    print(len(fichiers), 'prises gardées ;', len(vides), 'phrases sans prise :', ', '.join(vides))

PAGE_HTML = r'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Liste des exclamations</title>
<style>
:root{--fond:#f6f5f1;--carte:#fff;--texte:#1d1d1b;--doux:#6b6a65;--trait:#e2e0d8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fond:#16171a;--carte:#202226;--texte:#ecebe6;--doux:#9a9992;--trait:#33353a}}
:root[data-theme="dark"]{--fond:#16171a;--carte:#202226;--texte:#ecebe6;--doux:#9a9992;--trait:#33353a}
body{margin:0;background:var(--fond);color:var(--texte);font:15px/1.45 system-ui,-apple-system,sans-serif}
main{max-width:900px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}p{color:var(--doux);margin:4px 0 14px}
h2{font-size:18px;margin:26px 0 6px}h3{font-size:15px;margin:14px 0 4px}
.l{overflow-x:auto}table{width:100%;border-collapse:collapse;background:var(--carte);border:1px solid var(--trait)}
th,td{padding:6px 8px;border-bottom:1px solid var(--trait);text-align:left;font-size:13px}th{background:var(--fond)}audio{width:170px;height:30px}.n{font-weight:600}
</style></head><body><main>
<h1>La liste des exclamations (français)</h1>
<p>Rangée par moment de course. Les voix 7 et 4 sont provisoires. Par phrase : les meilleures prises (note d'intonation d'au moins 0,7, cible 0,8, sans ton de question).</p>
<div id="z"></div></main>
<script>
const D=__DONNEES__;const z=document.getElementById("z");let m=null;
for(const s of D){if(s.moment!==m){m=s.moment;const h=document.createElement("h2");h.textContent=m;z.appendChild(h)}
 const h3=document.createElement("h3");h3.textContent="« "+s.texte+" »";z.appendChild(h3);
 if(!s.prises.length){const p=document.createElement("p");p.textContent="Aucune prise assez bonne.";z.appendChild(p);continue}
 const w=document.createElement("div");w.className="l";const t=document.createElement("table");
 t.innerHTML="<tr><th>#</th><th>Note</th><th>Voix</th><th>Entendu</th><th>Écouter</th></tr>";
 s.prises.forEach((r,i)=>{const tr=document.createElement("tr");
  for(const v of [String(i+1),r.note.toFixed(2),"voix "+r.voix,r.entendu]){const c=document.createElement("td");c.textContent=v;tr.appendChild(c)}
  const c=document.createElement("td"),a=document.createElement("audio");a.controls=true;a.preload="none";a.src=r.fichier;c.appendChild(a);tr.appendChild(c);t.appendChild(tr)});
 w.appendChild(t);z.appendChild(w)}
</script></body></html>'''

if __name__ == '__main__':
    main()
