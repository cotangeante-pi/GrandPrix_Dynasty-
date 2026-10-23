#!/usr/bin/env python3
"""L'outil des tracés officiels (données seulement) : python3 tests/circuits-outil.py [a|b] [--fermer] [--svg]
- lit circuits-officiels-a.js / -b.js (le format de CIRCUITS : ['droite', L], ['virage', rayon, angle], ['chicane', rayon, angle]) ;
- --fermer : recalcule les deux droites marquées « (referme le tour) » pour que la boucle se referme exactement (2 inconnues, 2 équations,
  linéaires : les caps ne dépendent que des virages), et les écrit dans le fichier, à 3 décimales ;
- affiche pour chaque circuit ce que vérifient tests/circuits-a.html et -b.html : longueur (et la vraie, VRAIES), fermeture, tour complet,
  rayon le plus serré, écart le plus petit entre deux parties éloignées (croisement), point de dépassement ;
- --svg : redessine tests/circuits-a.svg / -b.svg : les 6 tracés vus de dessus, la ligne de départ (rouge), le sens (flèche), et le nom de
  chaque virage célèbre (reperes : [indice du morceau, 'nom'] dans les données).
La géométrie est celle de circuits.js (pointsDepuisMorceaux), sans la spline : assez précis pour juger un tracé."""
import math, os, re, sys
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAS = 4.0            # m entre deux points (PAS_POINTS_MORCEAUX)
BARRIERE = 14        # DISTANCE_BARRIERE (donnees.js) : le seuil de croisement = largeur + 2 × 14
# la longueur réelle (m) du circuit dont chaque tracé s'inspire (CLAUDE.md : « longueur proche ») ; le test de longueur veut ±10 %
VRAIES = {'monoco': 3337, 'silverstoun': 5891, 'monzo': 5793, 'spaa': 7004, 'suzuko': 5807, 'interlagas': 4309,
          'montreol': 4361, 'melbourn': 5278, 'barcelana': 4657, 'bahrayn': 5412, 'singapura': 4940, 'yasmarino': 5281}

MORCEAU = re.compile(r"\['(droite|virage|chicane)',\s*(-?[\d.]+)(?:,\s*(-?[\d.]+))?\]")

def lire(fichier):
    """les circuits du fichier : { cle: { nom, largeur, morceaux: [[type, a, b, ligne, position]], reperes, croisement } }"""
    src = open(fichier, encoding='utf-8').read()
    circuits, cle, c = {}, None, None
    for num, ligne in enumerate(src.split('\n')):
        m = re.match(r'  (\w+): \{', ligne)
        if m: cle = m.group(1); c = circuits[cle] = {'nom': cle, 'largeur': 12, 'morceaux': [], 'reperes': [], 'croisement': None}; continue
        if c is None: continue
        m = re.search(r"nom: '([^']+)'", ligne)
        if m and 'reperes' not in ligne: c['nom'] = m.group(1)
        m = re.search(r'largeur: (\d+)', ligne)
        if m: c['largeur'] = int(m.group(1))
        if 'reperes:' in ligne: c['reperes'] = re.findall(r"\[(\d+), '([^']+)'\]", ligne)
        m = re.search(r'croisement: \[([\d.]+), ([\d.]+)\]', ligne)
        if m: c['croisement'] = (float(m.group(1)), float(m.group(2)))
        if 'morceaux:' in ligne or ligne.strip().startswith('//'): continue
        code = ligne.split('//')[0]
        for mm in MORCEAU.finditer(code):
            c['morceaux'].append([mm.group(1), float(mm.group(2)), float(mm.group(3)) if mm.group(3) else None, num, 'referme' in ligne])
    return circuits, src

def arcs(m):
    """un morceau → [[longueur, courbure]] comme circuits.js"""
    t, a, b = m[0], m[1], m[2]
    if t == 'droite': return [[a, 0.0]]
    if t == 'virage': return [[a * abs(b) * math.pi / 180, math.copysign(1, b) / a]]
    return [[a * abs(x) * math.pi / 180, math.copysign(1, x) / a] for x in (b, -2 * b, b)]

def tracer(morceaux, longueurs=None):
    """les points (x, z, s) tous les PAS m, la fin (x, z, cap), et [debut, fin] de chaque morceau ; longueurs : des droites remplacées"""
    x = z = cap = 0.0; s = 0.0; pts = []; bornes = []
    for i, m in enumerate(morceaux):
        mm = m if longueurs is None or i not in longueurs else ['droite', longueurs[i], None]
        debut = s
        for lg, k in arcs(mm):
            nb = max(1, math.ceil(lg / PAS)) if lg > 0 else 0; ds = lg / nb if nb else 0
            for _ in range(nb):
                pts.append((x, z, s))
                if k == 0: x += math.cos(cap) * ds; z += math.sin(cap) * ds
                else:
                    r = 1 / k; cap2 = cap + k * ds
                    x += r * (math.sin(cap2) - math.sin(cap)); z += r * (math.cos(cap) - math.cos(cap2)); cap = cap2
                s += ds
        bornes.append((debut, s))
    return pts, (x, z, cap), bornes

def fermer(c):
    """les deux droites « referme le tour » : leurs longueurs pour que la fin revienne en (0, 0)"""
    idx = [i for i, m in enumerate(c['morceaux']) if m[4] and m[0] == 'droite']
    if len(idx) != 2: return None, f'il faut exactement 2 droites marquées « referme », il y en a {len(idx)}'
    # le cap de chaque droite inconnue, et la fin quand elles valent 0
    caps = {}
    cap = 0.0
    for i, m in enumerate(c['morceaux']):
        if i in idx: caps[i] = cap
        for lg, k in arcs(m): cap += k * lg
    _, (x0, z0, _), _ = tracer(c['morceaux'], {idx[0]: 0.0, idx[1]: 0.0})
    a, b = idx
    da, db = (math.cos(caps[a]), math.sin(caps[a])), (math.cos(caps[b]), math.sin(caps[b]))
    det = da[0] * db[1] - da[1] * db[0]
    if abs(det) < 1e-6: return None, 'les deux droites « referme » sont parallèles'
    rx, rz = -x0, -z0
    la = (rx * db[1] - rz * db[0]) / det; lb = (da[0] * rz - da[1] * rx) / det
    return {a: round(la, 3), b: round(lb, 3)}, None

def analyser(cle, c):
    pts, (x, z, cap), bornes = tracer(c['morceaux'])
    longueur = bornes[-1][1]; ferm = math.hypot(x, z)
    tour = sum(m[2] for m in c['morceaux'] if m[0] == 'virage')
    rmin = min((m[1] for m in c['morceaux'] if m[0] != 'droite'), default=1e9)
    # le croisement : deux points à plus de 100 m le long du tour
    seuil = c['largeur'] + 2 * BARRIERE; pire = (1e9, 0, 0)
    n = len(pts)
    for i in range(0, n, 2):
        xi, zi, si = pts[i]
        for j in range(i + 1, n, 2):
            xj, zj, sj = pts[j]
            ds = min(sj - si, longueur - (sj - si))
            if ds <= 100: continue
            d = math.hypot(xi - xj, zi - zj)
            if d < pire[0]: pire = (d, si, sj)
    # le point de dépassement : une droite ≥ 400 m (droites qui se suivent ensemble) suivie d'un rayon ≤ 50
    ms = c['morceaux']; nm = len(ms); lg = 0; depassement = None
    for k in range(2 * nm):
        m = ms[k % nm]
        if m[0] == 'droite': lg += m[1]; continue
        if lg >= 400 and m[1] <= 50: depassement = (lg, m[1])
        lg = 0
    vraie = VRAIES.get(cle)
    ecart = (longueur / vraie - 1) * 100 if vraie else None
    print(f"{c['nom']:14s} {longueur / 1000:6.3f} km" + (f" (vrai {vraie / 1000:.3f}, {ecart:+.1f} %)" if vraie else '') +
          f" · fermeture {ferm:7.3f} m · tour {tour:6.1f}° · rayon min {rmin:4.0f} m · écart min {pire[0]:6.1f} m (s {pire[1]:.0f}/{pire[2]:.0f}, seuil {seuil})" +
          f" · dépassement {'%.0f m → r%.0f' % depassement if depassement else 'AUCUN'}" + (' · CROISEMENT marqué %s' % (c['croisement'],) if c['croisement'] else ''))
    pb = []
    if ferm >= 1: pb.append('fermeture')
    if abs(abs(tour) - (0 if c['croisement'] else 360)) > 1e-6: pb.append('tour')   # un huit (Suzuko) : les virages se compensent
    if rmin < c['largeur'] / 2: pb.append('rayon')
    if pire[0] <= seuil and not c['croisement']: pb.append('croisement')
    if vraie and abs(ecart) > 10: pb.append('longueur')
    if not depassement and cle != 'monoco': pb.append('dépassement')
    if pb: print('   ✘ ' + ', '.join(pb))
    return pts, bornes, longueur

def svg(fichier, circuits, sortie):
    T, marge, cols = 620, 50, 2
    lignes = math.ceil(len(circuits) / cols)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{T * cols}" height="{T * lignes}" viewBox="0 0 {T * cols} {T * lignes}" font-family="sans-serif">',
           '<rect width="100%" height="100%" fill="#e6eee0"/>']
    for n, (cle, c) in enumerate(circuits.items()):
        pts, bornes, longueur = tracer(c['morceaux'])[0], None, None
        pts, _, bornes = tracer(c['morceaux']); longueur = bornes[-1][1]
        ox, oy = (n % cols) * T, (n // cols) * T
        xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
        mx, Mx, mz, Mz = min(xs), max(xs), min(zs), max(zs)
        e = (T - 2 * marge) / max(Mx - mx, Mz - mz)
        dx = ox + marge + ((T - 2 * marge) - (Mx - mx) * e) / 2; dy = oy + marge + 18 + ((T - 2 * marge - 18) - (Mz - mz) * e) / 2
        P = lambda p: (dx + (p[0] - mx) * e, dy + (p[1] - mz) * e)
        d = 'M' + ' L'.join('%.1f,%.1f' % P(p) for p in pts[::2]) + ' Z'
        w = max(2.5, c['largeur'] * e)
        out.append(f'<path d="{d}" fill="none" stroke="#2b2b2b" stroke-width="{w:.1f}" stroke-linejoin="round"/>')
        # la ligne de départ (rouge) et le sens (une flèche 60 m après)
        x0, y0 = P(pts[0]); x1, y1 = P(pts[min(len(pts) - 1, 15)])
        ang = math.atan2(y1 - y0, x1 - x0)
        out.append(f'<line x1="{x0 - math.sin(ang) * w:.1f}" y1="{y0 + math.cos(ang) * w:.1f}" x2="{x0 + math.sin(ang) * w:.1f}" y2="{y0 - math.cos(ang) * w:.1f}" stroke="#d00" stroke-width="3"/>')
        xa, ya = P(pts[min(len(pts) - 1, 25)])
        out.append(f'<polygon points="{xa + math.cos(ang) * 12:.1f},{ya + math.sin(ang) * 12:.1f} {xa - math.sin(ang) * 6:.1f},{ya + math.cos(ang) * 6:.1f} {xa + math.sin(ang) * 6:.1f},{ya - math.cos(ang) * 6:.1f}" fill="#d00"/>')
        vraie = VRAIES.get(cle)
        out.append(f'<text x="{ox + 16}" y="{oy + 30}" font-size="22" font-weight="bold" fill="#111">{c["nom"]}</text>')
        out.append(f'<text x="{ox + 16}" y="{oy + 50}" font-size="13" fill="#444">{longueur / 1000:.3f} km' + (f' (le vrai : {vraie / 1000:.3f} km)' if vraie else '') + f' · largeur {c["largeur"]} m · départ en rouge, flèche = sens</text>')
        # les virages célèbres : au milieu de leur morceau, un point et le nom
        for idx, nom in c['reperes']:
            i = int(idx)
            if i >= len(bornes): continue
            sm = (bornes[i][0] + bornes[i][1]) / 2
            p = min(pts, key=lambda q: abs(q[2] - sm)); x, y = P(p)
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="#06c"/>')
            out.append(f'<text x="{x + 6:.1f}" y="{y - 5:.1f}" font-size="11" fill="#06c" stroke="#e6eee0" stroke-width="3" paint-order="stroke">{nom}</text>')
        if c['croisement']:
            s1, s2 = c['croisement']; p1 = min(pts, key=lambda q: abs(q[2] - s1)); x, y = P(p1)
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="none" stroke="#d00" stroke-width="2"/><text x="{x + 10:.1f}" y="{y + 14:.1f}" font-size="11" fill="#d00">pont (croisement)</text>')
    out.append('</svg>')
    open(sortie, 'w', encoding='utf-8').write('\n'.join(out))
    print('→', sortie)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    for lettre in (args or ['a', 'b']):
        fichier = os.path.join(RACINE, f'circuits-officiels-{lettre}.js')
        circuits, src = lire(fichier)
        if '--fermer' in sys.argv:
            lignes = src.split('\n')
            for cle, c in circuits.items():
                sol, err = fermer(c)
                if err: print(f'{cle} : {err}'); continue
                if min(sol.values()) <= 0: print(f'{cle} : les droites « referme » seraient de {sol} m : à redessiner (rien n’est écrit)'); continue
                for i, lg in sol.items():
                    m = c['morceaux'][i]; num = m[3]
                    lignes[num] = re.sub(r"\['droite',\s*-?[\d.]+\]", f"['droite', {lg:.3f}]", lignes[num], count=1)
            open(fichier, 'w', encoding='utf-8').write('\n'.join(lignes))
            circuits, src = lire(fichier)
        print(f'--- circuits-officiels-{lettre}.js')
        for cle, c in circuits.items(): analyser(cle, c)
        if '--svg' in sys.argv: svg(fichier, circuits, os.path.join(RACINE, 'tests', f'circuits-{lettre}.svg'))
