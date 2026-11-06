"""La page d'écoute de l'essai Bark (tour 48e), pour le propriétaire : python3 tests/voix/page_ecoute.py SORTIE [ANCIEN]
SORTIE : le dossier de bark_essai.py (prises.json) et de transcrire.py (notes.json) ; ANCIEN : le dossier du premier essai (ses
bark-<langue>-<phrase>.wav retravaillés sont recopiés en ancien-bark-….mp4, pour comparer). Écrit SORTIE/ecoute.html : pour chaque
phrase, les prises rangées de la meilleure intonation à la pire (les rejetées à la fin, avec la raison), chacune en brut (.wav),
« clair » et « fort » (.mp4), à côté de l'ancien Bark retravaillé et de la synthèse du navigateur (la voix d'aujourd'hui)."""
import os, sys, json, subprocess
SORTIE = sys.argv[1]; ANCIEN = sys.argv[2] if len(sys.argv) > 2 else None
prises = json.load(open(os.path.join(SORTIE, 'prises.json')))
chemin = os.path.join(SORTIE, 'notes.json'); notes = json.load(open(chemin)) if os.path.exists(chemin) else {}
anciens = {}
if ANCIEN:
    for nom in sorted(os.listdir(ANCIEN)):
        if nom.startswith('bark-') and nom.endswith('.wav') and not nom.endswith('-brut.wav'):
            l, cle = nom[5:-4].split('-', 1); cible = 'ancien-' + nom[:-4] + '.mp4'
            if not os.path.exists(os.path.join(SORTIE, cible)):
                subprocess.run(['afconvert', '-f', 'mp4f', '-d', 'aac', '-b', '48000', os.path.join(ANCIEN, nom), os.path.join(SORTIE, cible)], check=True)
            anciens[l + '-' + cle] = cible
lignes = []
for nom, p in prises.items():
    n = notes.get(nom, {})
    lignes.append(dict(nom=nom, langue=p['langue'], cle=p['cle'], voix=p['voix'], prise=p['prise'], texte=p['texte'],
                       note=n.get('intonation', {}).get('note'), into=n.get('intonation', {}), entendu=n.get('texte_entendu'),
                       ressemblance=n.get('ressemblance'), rejet=n.get('rejet', False), raison=n.get('raison', ''), parole=n.get('parole', p.get('parole'))))
lignes.sort(key=lambda r: (r['rejet'], -(r['note'] or 0), -(r['ressemblance'] or 0)))
DONNEES = json.dumps(dict(lignes=lignes, anciens=anciens), ensure_ascii=False)
PAGE = r'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Essai Bark 2</title>
<style>
:root{--fond:#f6f5f1;--carte:#fff;--texte:#1d1d1b;--doux:#6b6a65;--trait:#e2e0d8;--bon:#1f7a3a;--mauvais:#b3261e}
@media (prefers-color-scheme:dark){:root{--fond:#16171a;--carte:#202226;--texte:#ecebe6;--doux:#9a9992;--trait:#33353a;--bon:#5fd07f;--mauvais:#ff7b72}}
body{margin:0;background:var(--fond);color:var(--texte);font:15px/1.45 system-ui,-apple-system,sans-serif}
main{max-width:1150px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}p{color:var(--doux);margin:4px 0 14px}
h2{font-size:18px;margin:26px 0 6px}h3{font-size:15px;margin:16px 0 6px}
.l{overflow-x:auto}table{width:100%;border-collapse:collapse;background:var(--carte);border:1px solid var(--trait)}
th,td{padding:6px 8px;border-bottom:1px solid var(--trait);text-align:left;vertical-align:middle;font-size:13px}th{background:var(--fond)}
audio{width:150px;height:30px}.mq{color:var(--doux);font-size:12px}.rej{opacity:.55}.n{font-variant-numeric:tabular-nums;font-weight:600}
button{font:inherit;padding:4px 9px;border-radius:6px;border:1px solid var(--trait);background:var(--carte);color:var(--texte);cursor:pointer}
.top td{background:color-mix(in srgb,var(--bon) 8%,var(--carte))}
</style></head><body><main>
<h1>Essai Bark n° 2 : prises rangées par intonation</h1>
<p>Pour chaque phrase : la synthèse d'aujourd'hui, l'ancien « Bark retravaillé », puis toutes les prises, de la meilleure intonation à la pire (les rejetées à la fin). « clair » : silences raccourcis, presque pas d'écho, foule très basse, aucune saturation. « fort » : plus d'élan, la fin qui monte d'un demi-ton… d'un ton, une pointe de saturation.</p>
<p>Intonation (0 à 1) : étendue de la hauteur sur la phrase, fin qui monte (au lieu de retomber comme une lecture), dernière syllabe encore forte. « Entendu » : ce qu'a compris la transcription automatique (Whisper).</p>
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
 for(const cle of Object.keys(NOMS)){const rs=D.lignes.filter(r=>r.langue===l&&r.cle===cle);if(!rs.length&&!D.anciens[l+"-"+cle])continue;
  const h3=document.createElement("h3");h3.textContent=NOMS[cle]+" — « "+SYN[l][cle]+" »";z.appendChild(h3);
  const b=document.createElement("button");b.textContent="▶ la voix d'aujourd'hui (synthèse)";b.onclick=()=>dire(SYN[l][cle],l);z.appendChild(b);
  if(D.anciens[l+"-"+cle]){const s=document.createElement("span");s.className="mq";s.textContent="  ancien Bark retravaillé : ";z.appendChild(s);z.appendChild(son(D.anciens[l+"-"+cle]))}
  const w=document.createElement("div");w.className="l";const t=document.createElement("table");let tr=document.createElement("tr");
  for(const c of ["#","Intonation","Voix · prise","Texte donné","Entendu","Brut","Clair","Fort"]){const th=document.createElement("th");th.textContent=c;tr.appendChild(th)}t.appendChild(tr);
  rs.forEach((r,i)=>{tr=document.createElement("tr");if(r.rejet)tr.className="rej";else if(i===0)tr.className="top";
   td(tr,String(i+1));const n=td(tr,r.note===null||r.note===undefined?"–":r.note.toFixed(2));n.className="n";
   if(r.into&&r.into.etendue!==undefined)n.title="étendue "+r.into.etendue+" demi-tons, fin "+(r.into.fin>0?"+":"")+r.into.fin+", claque : "+(r.into.claque?"oui":"non");
   td(tr,"voix "+r.voix+" · "+r.prise);td(tr,r.texte);td(tr,(r.entendu||"–")+(r.rejet?" — rejetée : "+r.raison:""));
   td(tr,son(r.nom+"-brut.wav"));td(tr,son(r.nom+"-clair.mp4"));td(tr,son(r.nom+"-fort.mp4"));t.appendChild(tr)});
  w.appendChild(t);z.appendChild(w)}}
</script></body></html>'''
open(os.path.join(SORTIE, 'ecoute.html'), 'w').write(PAGE.replace('__DONNEES__', DONNEES))
print('écrit', os.path.join(SORTIE, 'ecoute.html'), len(lignes), 'prises')
