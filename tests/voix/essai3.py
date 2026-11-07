"""L'essai n° 3 des voix Bark (tour 50d), la page d'écoute pour le propriétaire, qui disait de l'essai n° 2 : « plus d'intonation et
plus rapide à parler ». Rien n'est branché dans le jeu.
Lancement : OUTILS/venv-bark/bin/python tests/voix/essai3.py ESSAI2 ESSAI3 PAGE
  ESSAI2 : les prises de l'essai n° 2 (prises.json, notes.json, <prise>-brut.wav) ; leurs notes sont RELUES avec le tri d'aujourd'hui
           (transcrire.juger : « Quel bagarre » entendu pour « Quelle BAGARRE » n'est plus une erreur), sans retranscrire ;
  ESSAI3 : les nouvelles prises (bark_essai.py --de …, puis transcrire.py) ;
  PAGE   : la page légère, SEULEMENT les prises gardées, en .mp4 (AAC mono) + ecoute.html + fichiers.json (la liste des fichiers).
On garde : les meilleures voix (VOIX, jamais en 6), les prises comprises (pas rejetées), avec une note d'intonation haute
(≥ NOTE_MIN ; traitement.intonation, sur la prise brute) ; au plus GARDEES par phrase, les meilleures d'abord. Une phrase sans
aucune prise assez haute garde sa meilleure, marquée « faible ». Chaque prise gardée passe par le traitement « vif »
(traitement.energie : parole 9 % plus rapide à la même hauteur, silences de 40 ms au plus, un léger accent sur le mot fort, PAS de fin
qui monte). La note est traitement.intonation2 (une exclamation, pas une question : les prises qui finissent en montant sont écartées),
et le propriétaire vise environ 0,8 (CIBLE) : d'abord les prises entre 0,75 et 0,9."""
import os, sys, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import traitement as T
import transcrire as TR

ESSAI2, ESSAI3, PAGE = sys.argv[1], sys.argv[2], sys.argv[3]
VOIX = {'fr': [7, 4, 6, 1], 'en': [0, 3, 9, 2]}   # les meilleures de l'essai n° 2 (le Chef) ; jamais en 6
NOTE_MIN, NOTE_MOYENNE, GARDEES = 0.6, 0.5, 4
CIBLE, CIBLE_BAS, CIBLE_HAUT = 0.8, 0.75, 0.9
CLES = ['depart', 'depassement', 'bataille', 'erreur', 'victoire']

def lire(dossier, essai):
    if not os.path.exists(os.path.join(dossier, 'notes.json')): return []
    prises, notes = json.load(open(os.path.join(dossier, 'prises.json'))), json.load(open(os.path.join(dossier, 'notes.json')))
    r = []
    for nom, n in notes.items():
        p = prises[nom]
        if p['voix'] not in VOIX[p['langue']]: continue
        j = TR.juger(p['texte'], n['texte_entendu'], n['parole'])
        xb, sr = T.lire_wav(os.path.join(dossier, nom + '-brut.wav'))
        n = dict(n, intonation=T.intonation2(xb, sr))   # (la note d'exclamation, sans question : traitement.intonation2)
        r.append(dict(nom=nom, essai=essai, dossier=dossier, langue=p['langue'], cle=p['cle'], voix=p['voix'], prise=p['prise'], texte=p['texte'],
                      entendu=n['texte_entendu'], note=n['intonation']['note'], into=n['intonation'], rejet=j['rejet'] or n['intonation']['question'], raison=j['raison'] or 'question'))
    return r

def main():
    os.makedirs(PAGE, exist_ok=True)
    toutes = lire(ESSAI2, 2) + lire(ESSAI3, 3)
    gardees, fichiers = [], []
    for l in ('fr', 'en'):
        for cle in CLES:
            # (le propriétaire : « intonation 0,8 serait idéal ») d'abord les prises entre CIBLE_BAS et CIBLE_HAUT, les plus proches de
            # CIBLE ; puis les autres au-dessus de NOTE_MIN, les plus proches de CIBLE
            bonnes = sorted([x for x in toutes if x['langue'] == l and x['cle'] == cle and not x['rejet']], key=lambda x: (not CIBLE_BAS <= x['note'] <= CIBLE_HAUT, abs(x['note'] - CIBLE)))
            hautes = [x for x in bonnes if x['note'] >= NOTE_MIN][:GARDEES]
            bonnes.sort(key=lambda x: -x['note'])
            # une phrase avec moins de 2 prises hautes : les meilleures suivantes au-dessus de NOTE_MOYENNE, marquées « moyenne » (pour
            # que le propriétaire ait au moins le choix entre deux) ; aucune : la meilleure, marquée « faible »
            if len(hautes) < 2: hautes += [dict(x, moyenne=True) for x in bonnes if NOTE_MOYENNE <= x['note'] < NOTE_MIN][:2 - len(hautes)]
            if not hautes and bonnes: hautes = [dict(bonnes[0], faible=True)]
            for i, x in enumerate(hautes):
                xb, sr = T.lire_wav(os.path.join(x['dossier'], x['nom'] + '-brut.wav'))
                y, sr2 = T.energie(xb, sr, niveau='vif')
                f = '%s-%s-%d.mp4' % (l, cle, i + 1)
                with tempfile.TemporaryDirectory() as tmp:
                    w = os.path.join(tmp, 'vif.wav'); T.ecrire_wav(w, y, sr2); T.encoder_mp4(w, os.path.join(PAGE, f))
                x.update(fichier=f, duree=round(len(y) / sr2, 2), duree_avant=round(T.duree_parole(T.rogner(xb, sr), sr), 2))
                gardees.append({k: x[k] for k in ('fichier', 'langue', 'cle', 'voix', 'essai', 'prise', 'texte', 'entendu', 'note', 'into', 'duree') if k in x} | {'faible': bool(x.get('faible')), 'moyenne': bool(x.get('moyenne'))})
                fichiers.append(f)
    json.dump([{'path': f} for f in fichiers + ['ecoute.html']], open(os.path.join(PAGE, 'fichiers.json'), 'w'), indent=1)
    open(os.path.join(PAGE, 'ecoute.html'), 'w').write(PAGE_HTML.replace('__DONNEES__', json.dumps(gardees, ensure_ascii=False)))
    poids = sum(os.path.getsize(os.path.join(PAGE, f)) for f in fichiers)
    print('page', PAGE, len(gardees), 'prises gardées,', '%.0f Ko de sons' % (poids / 1024))

PAGE_HTML = r'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Essai voix 3</title>
<style>
:root{--fond:#f6f5f1;--carte:#fff;--texte:#1d1d1b;--doux:#6b6a65;--trait:#e2e0d8;--bon:#1f7a3a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fond:#16171a;--carte:#202226;--texte:#ecebe6;--doux:#9a9992;--trait:#33353a;--bon:#5fd07f}}
:root[data-theme="dark"]{--fond:#16171a;--carte:#202226;--texte:#ecebe6;--doux:#9a9992;--trait:#33353a;--bon:#5fd07f}
body{margin:0;background:var(--fond);color:var(--texte);font:15px/1.45 system-ui,-apple-system,sans-serif}
main{max-width:900px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}p{color:var(--doux);margin:4px 0 14px}
h2{font-size:18px;margin:26px 0 6px}h3{font-size:15px;margin:16px 0 6px}
.l{overflow-x:auto}table{width:100%;border-collapse:collapse;background:var(--carte);border:1px solid var(--trait)}
th,td{padding:6px 8px;border-bottom:1px solid var(--trait);text-align:left;vertical-align:middle;font-size:13px}th{background:var(--fond)}
audio{width:170px;height:30px}.mq{color:var(--doux);font-size:12px}.n{font-variant-numeric:tabular-nums;font-weight:600}
button{font:inherit;padding:4px 9px;border-radius:6px;border:1px solid var(--trait);background:var(--carte);color:var(--texte);cursor:pointer}
tr.top td{background:color-mix(in srgb,var(--bon) 8%,var(--carte))}
</style></head><body><main>
<h1>Essai voix n° 3 : plus d'intonation, plus rapide</h1>
<p>Seulement les meilleures prises (les voix gardées de l'essai n° 2, plus de nouvelles prises surtout pour « Quelle BAGARRE ! »), rangées de la plus proche de 0,8 à la plus loin (0,6 au moins ; une phrase qui en a moins de deux montre aussi sa meilleure prise « moyenne », entre 0,5 et 0,6). Mise à jour après ton avis : la note d'intonation récompense maintenant une exclamation (le mot fort haut, puis la voix qui retombe ou claque net) et écarte les prises qui finissent en montant comme une question ; on garde d'abord les prises autour de 0,8. Toutes passent par le même traitement « vif » : la parole 9 % plus rapide (au lieu de 15 %) sans changer la hauteur de la voix, les silences plus courts, un léger accent sur le mot fort, et plus de fin qui monte.</p>
<p>Pour chaque phrase : la voix d'aujourd'hui (la synthèse du navigateur) pour comparer, puis les prises, de la meilleure intonation à la moins bonne.</p>
<div id="z"></div></main>
<script>
const D=__DONNEES__;
const NOMS={depart:"Départ",depassement:"Dépassement",bataille:"Bataille",erreur:"Erreur",victoire:"Victoire"};
const SYN={fr:{depart:"Et c'est parti !",depassement:"Il passe ! Il passe !",bataille:"Quelle bagarre !",erreur:"Oh ! Il est dans l'herbe !",victoire:"Victoire !"},en:{depart:"And they're off!",depassement:"What a move!",bataille:"What a battle!",erreur:"Oh! Off into the grass!",victoire:"Victory!"}};
function dire(t,l){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang=l==="fr"?"fr-FR":"en-US";speechSynthesis.speak(u)}catch(e){}}
function son(src){const a=document.createElement("audio");a.controls=true;a.preload="none";a.src=src;a.onerror=()=>a.replaceWith(Object.assign(document.createElement("span"),{className:"mq",textContent:"absent"}));return a}
function td(tr,x){const c=document.createElement("td");if(x instanceof Node)c.appendChild(x);else c.textContent=x;tr.appendChild(c);return c}
const z=document.getElementById("z");
for(const l of ["fr","en"]){const h=document.createElement("h2");h.textContent=l==="fr"?"Français":"Anglais";z.appendChild(h);
 for(const cle of Object.keys(NOMS)){const rs=D.filter(r=>r.langue===l&&r.cle===cle);
  const h3=document.createElement("h3");h3.textContent=NOMS[cle]+" — « "+SYN[l][cle]+" »";z.appendChild(h3);
  const b=document.createElement("button");b.textContent="▶ la voix d'aujourd'hui (synthèse)";b.onclick=()=>dire(SYN[l][cle],l);z.appendChild(b);
  if(!rs.length){const s=document.createElement("p");s.textContent="Aucune prise comprise pour cette phrase.";z.appendChild(s);continue}
  const w=document.createElement("div");w.className="l";const t=document.createElement("table");let tr=document.createElement("tr");
  for(const c of ["#","Intonation (cible 0,8)","Voix","Texte donné","Entendu (transcription)","Écouter"]){const th=document.createElement("th");th.textContent=c;tr.appendChild(th)}t.appendChild(tr);
  rs.forEach((r,i)=>{tr=document.createElement("tr");if(i===0)tr.className="top";
   td(tr,String(i+1));const n=td(tr,r.note.toFixed(2)+(r.faible?" (faible)":r.moyenne?" (moyenne)":""));n.className="n";
   if(r.into)n.title="étendue "+r.into.etendue+" demi-tons, chute après le sommet "+r.into.chute+", pente de fin "+r.into.pente+", claque : "+(r.into.claque?"oui":"non");
   td(tr,"voix "+r.voix+" · essai "+r.essai);td(tr,r.texte);td(tr,r.entendu||"–");td(tr,son(r.fichier));t.appendChild(tr)});
  w.appendChild(t);z.appendChild(w)}}
</script></body></html>'''

if __name__ == '__main__':
    main()
