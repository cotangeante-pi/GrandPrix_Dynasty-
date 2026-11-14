#!/usr/bin/env python3
"""Le jeu tourné de 90° (tour 56, T15) : python3 tests/tourne-css.py [--verifier]
Téléphone tenu debout, le jeu s'affiche tourné (html.tourne, tactile.js) : la page fait alors 640×360 pour le jeu, mais le navigateur
évalue encore les @media avec la vraie fenêtre (360×640). Ce script recopie, juste après chaque @media de style.css qui parle de
largeur ou de hauteur, une copie aux dimensions échangées (max-height <-> max-width, min-height <-> min-width), ses sélecteurs préfixés
par « :where(html.tourne) » (pas de spécificité en plus : l'ordre du fichier garde son sens). Les copies sont entre les marques
« tourne:debut » et « tourne:fin » : le script les refait à chaque passage ; --verifier : sort en erreur si style.css n'est pas à jour."""
import os, re, sys
CHEMIN = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'style.css')
DEBUT, FIN = '/* tourne:debut */', '/* tourne:fin */'

def accolade_fermante(s, i):
    """i : position de « { » ; renvoie la position de la « } » qui la ferme (commentaires et chaînes ignorés)."""
    prof, n = 0, len(s)
    while i < n:
        c = s[i]
        if s.startswith('/*', i): i = s.index('*/', i) + 2; continue
        if c in '"\'':
            j = i + 1
            while s[j] != c: j += 2 if s[j] == '\\' else 1
            i = j + 1; continue
        if c == '{': prof += 1
        elif c == '}':
            prof -= 1
            if prof == 0: return i
        i += 1
    raise ValueError('accolade jamais fermée')

def echanger(requete):
    return re.sub(r'\b(max|min)-(width|height)\b', lambda m: m.group(1) + '-' + ('height' if m.group(2) == 'width' else 'width'), requete)

def prefixer(corps):
    """Les règles d'un @media (profondeur 1) : chaque sélecteur reçoit le préfixe ; une règle @ interne est laissée de côté."""
    sortie, i, n = [], 0, len(corps)
    while i < n:
        if corps.startswith('/*', i):
            j = corps.index('*/', i) + 2; sortie.append(corps[i:j]); i = j; continue
        if corps[i].isspace(): sortie.append(corps[i]); i += 1; continue
        a = corps.index('{', i); b = accolade_fermante(corps, a)
        sel = corps[i:a]
        sel_sans = re.sub(r'/\*.*?\*/', '', sel, flags=re.S).strip()
        if sel_sans.startswith('@'): i = b + 1; continue    # (@keyframes, @supports… : pas recopiés)
        # les commentaires du sélecteur restent devant ; les virgules séparent les sélecteurs
        coms = ''.join(re.findall(r'/\*.*?\*/', sel, flags=re.S))
        parts = [p.strip() for p in sel_sans.split(',') if p.strip()]
        sortie.append((coms + ' ' if coms else '') + ', '.join(':where(html.tourne) ' + p for p in parts) + ' ' + corps[a:b + 1])
        i = b + 1
    return ''.join(sortie)

def generer(css):
    css = re.sub(re.escape(DEBUT) + r'.*?' + re.escape(FIN) + r'\n?', '', css, flags=re.S)
    sortie, i = [], 0
    for m in re.finditer(r'^@media\s*([^{]*?)\s*\{', css, flags=re.M):
        if m.start() < i: continue
        if not re.search(r'\b(max|min)-(width|height)\b', m.group(1)): continue
        a = m.end() - 1; b = accolade_fermante(css, a)
        copie = prefixer(css[a + 1:b])
        if not copie.strip(): continue
        sortie.append(css[i:b + 1]); i = b + 1
        fin_ligne = css.find('\n', i); fin_ligne = len(css) if fin_ligne < 0 else fin_ligne
        sortie.append(css[i:fin_ligne]); i = fin_ligne    # (un commentaire après l'accolade reste sur sa ligne)
        sortie.append('\n' + DEBUT + '@media ' + echanger(m.group(1)) + ' {' + copie + '}' + FIN)
    sortie.append(css[i:])
    return ''.join(sortie)

if __name__ == '__main__':
    css = open(CHEMIN, encoding='utf-8').read(); neuf = generer(css)
    if '--verifier' in sys.argv:
        if neuf != css: print('✘ style.css : les copies « tourne » ne sont pas à jour (python3 tests/tourne-css.py)'); sys.exit(1)
        print('✔ style.css : les copies « tourne » sont à jour'); sys.exit(0)
    open(CHEMIN, 'w', encoding='utf-8').write(neuf)
    print(f'style.css : {neuf.count(DEBUT)} copies « tourne »')
