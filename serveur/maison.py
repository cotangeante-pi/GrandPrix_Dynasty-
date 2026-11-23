#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Jouer en ligne À LA MAISON (tour 61) : un seul lanceur qui sert les fichiers du jeu ET le relais des batailles en ligne.

    python3 serveur/maison.py

Il affiche l'adresse à taper sur l'autre appareil (téléphone, autre ordinateur du même Wi-Fi). Un seul port (8765 par défaut) pour la page et pour le relais :
la page trouve donc le relais toute seule (même adresse que la page). Ctrl+C arrête tout proprement.

Rien n'est ouvert sur Internet : seuls les appareils du réseau local (adresses privées : 192.168.x.x, 10.x.x.x, 172.16 à 31.x.x, ou cet ordinateur) sont servis ;
toute autre adresse est refusée (403), et une page d'un autre site ne peut pas ouvrir le relais. Pas de pip : Python 3.9 ou plus et le paquet websockets (déjà là).
Voir serveur/LISEZMOI.md."""
from __future__ import annotations
import argparse, asyncio, ipaddress, logging, mimetypes, os, re, socket, sys
from http import HTTPStatus
from urllib.parse import unquote, urlsplit

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import relais as R
from websockets.datastructures import Headers
from websockets.http11 import Response

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # le dossier du jeu (index.html)
PORT = 8765
# ce que le serveur donne : les fichiers du jeu, rien d'autre (jamais serveur/, tests/, rapports/, .git, les notes)
TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
         '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
         '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8'}
DOSSIERS_INTERDITS = {'serveur', 'tests', 'rapports', 'dist', 'poki', 'node_modules', '__pycache__'}
MARQUE = b'<meta name="gpd-relais" content="maison">'   # ajoutée à index.html : « le relais est ici » (reseau.js, RESEAU.urlRelais)

def adresse_locale():
    """L'adresse du Mac sur le réseau local (aucun paquet n'est envoyé : on demande seulement par où partirait un envoi vers le réseau)."""
    for cible in ('10.255.255.255', '192.168.255.255', '172.31.255.255'):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect((cible, 9))
            ip = s.getsockname()[0]
            if ip and not ip.startswith('127.') and not ip.startswith('0.'): return ip
        except OSError: pass
        finally: s.close()
    try:
        ip = socket.gethostbyname(socket.gethostname())
        if not ip.startswith('127.'): return ip
    except OSError: pass
    return None

def adresse_permise(texte):
    """Vrai pour une adresse de ce réseau local ou de cet ordinateur (privée, locale, loopback) ; faux pour une adresse d'Internet."""
    try:
        ip = ipaddress.ip_address(texte.split('%')[0])
    except ValueError:
        return False
    if getattr(ip, 'ipv4_mapped', None): ip = ip.ipv4_mapped
    return not ip.is_global and not ip.is_multicast and not ip.is_unspecified

def chemin_du_fichier(chemin_url):
    """Le fichier du jeu pour un chemin d'adresse, ou None (hors du dossier, interdit, absent)."""
    chemin = unquote(urlsplit(chemin_url).path)
    if '\x00' in chemin or '\\' in chemin: return None
    morceaux = [m for m in chemin.split('/') if m != '']
    if not morceaux: morceaux = ['index.html']
    if any(m in ('.', '..') or m.startswith('.') for m in morceaux): return None
    if morceaux[0] in DOSSIERS_INTERDITS and len(morceaux) > 1: return None
    if len(morceaux) == 1 and morceaux[0] in DOSSIERS_INTERDITS: return None
    ext = os.path.splitext(morceaux[-1])[1].lower()
    if ext not in TYPES: return None
    complet = os.path.realpath(os.path.join(RACINE, *morceaux))
    if os.path.commonpath([complet, os.path.realpath(RACINE)]) != os.path.realpath(RACINE): return None
    return complet if os.path.isfile(complet) else None

def reponse(statut, corps=b'', type_='text/plain; charset=utf-8', plus=None):
    h = Headers({'Content-Type': type_, 'Content-Length': str(len(corps)), 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Connection': 'close'})
    for k, v in (plus or {}).items(): h[k] = v
    return Response(statut.value, statut.phrase, h, corps)

def lire(chemin):
    with open(chemin, 'rb') as f: return f.read()

class Maison:
    """Le relais (relais.py) et les fichiers du jeu sur le même port."""
    def __init__(self, relais, reseau_local_seulement=True):
        self.relais = relais
        self.filtre = reseau_local_seulement
        self.servis = 0

    async def demande(self, connexion, requete):
        """Appelé par websockets pour chaque requête (page ou WebSocket) : None = poursuivre la poignée de main du WebSocket."""
        pair = connexion.remote_address[0] if connexion.remote_address else ''
        if self.filtre and not adresse_permise(pair):
            return reponse(HTTPStatus.FORBIDDEN, 'Réseau local seulement.\n'.encode('utf-8'))
        if requete.headers.get('Upgrade', '').lower() == 'websocket':
            # une page d'un autre site (ou une autre adresse) ne peut pas utiliser le relais de la maison : l'origine doit être l'adresse même de ce serveur
            origine, hote = requete.headers.get('Origin'), requete.headers.get('Host', '')
            if origine is not None and urlsplit(origine).netloc.lower() != hote.lower():
                return reponse(HTTPStatus.FORBIDDEN, 'Origine refusée.\n'.encode('utf-8'))
            return None
        return await self.fichier(requete)

    async def fichier(self, requete):
        if requete.path.split('?')[0] == '/relais.json':   # (les essais) le serveur est là
            return reponse(HTTPStatus.OK, b'{"maison":true}', 'application/json')
        chemin = chemin_du_fichier(requete.path)
        if chemin is None: return reponse(HTTPStatus.NOT_FOUND, 'Introuvable.\n'.encode('utf-8'))
        octets = await asyncio.get_running_loop().run_in_executor(None, lire, chemin)
        if os.path.basename(chemin) == 'index.html' and os.path.dirname(chemin) == os.path.realpath(RACINE) and b'</head>' in octets:
            octets = octets.replace(b'</head>', MARQUE + b'\n</head>', 1)
        type_ = TYPES[os.path.splitext(chemin)[1].lower()]
        self.servis += 1
        plus = {'Accept-Ranges': 'bytes'}
        plage = requete.headers.get('Range')
        m = re.fullmatch(r'bytes=(\d*)-(\d*)', plage.strip()) if plage else None
        if m and (m.group(1) or m.group(2)):   # (Safari demande ses sons par morceaux)
            n = len(octets)
            if m.group(1): debut, fin = int(m.group(1)), (int(m.group(2)) if m.group(2) else n - 1)
            else: debut, fin = max(0, n - int(m.group(2))), n - 1
            fin = min(fin, n - 1)
            if debut > fin: return reponse(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE, b'', type_, {'Content-Range': 'bytes */%d' % n})
            plus['Content-Range'] = 'bytes %d-%d/%d' % (debut, fin, n)
            return reponse(HTTPStatus.PARTIAL_CONTENT, octets[debut:fin + 1], type_, plus)
        return reponse(HTTPStatus.OK, octets, type_, plus)

async def principal(args):
    cfg = R.Config(version=args.version, max_par_ip=0)
    relais = R.Relais(cfg)
    maison = Maison(relais, reseau_local_seulement=not args.tout_le_monde)
    hote = '127.0.0.1' if args.cet_ordinateur else '0.0.0.0'
    try:
        lance = await relais.servir(hote, args.port, process_request=maison.demande)
        async with lance as s:
            ip = adresse_locale()
            print()
            print('  Grand Prix Dynasty en ligne, à la maison')
            print('  ----------------------------------------')
            print('  Sur CET ordinateur :        http://localhost:%d/?enligne=1' % s.port)
            if not args.cet_ordinateur:
                if ip: print('  Sur un TÉLÉPHONE ou un autre ordinateur du même Wi-Fi, tape :   http://%s:%d/?enligne=1' % (ip, s.port))
                else: print('  (adresse du réseau introuvable : regarde dans Réglages > Wi-Fi, puis tape http://ADRESSE:%d/?enligne=1)' % s.port)
            print('  Puis : « En ligne », « Créer une salle » sur un appareil, et « Rejoindre » avec le code sur l\'autre.')
            print('  Seuls les appareils de ta maison peuvent se connecter (rien n\'est ouvert sur Internet).')
            print('  Pour arrêter : Ctrl+C')
            print(flush=True)
            await asyncio.Future()
    except OSError as e:
        print('Impossible de démarrer sur le port %d : %s\n(un autre programme l\'utilise peut-être : essaie --port %d)' % (args.port, e.strerror or e, args.port + 1), file=sys.stderr)
        return 1

if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Jouer en ligne à la maison : les fichiers du jeu et le relais, sur le réseau local')
    p.add_argument('--port', type=int, default=int(os.environ.get('PORT', PORT)), help='le port, le même pour la page et le relais (8765)')
    p.add_argument('--cet-ordinateur', action='store_true', help='seulement cet ordinateur (pas de téléphone)')
    p.add_argument('--tout-le-monde', action='store_true', help='NE PAS FAIRE sur Internet : accepte aussi les adresses publiques (pour des essais)')
    p.add_argument('--version', default=None, help='imposer la version annoncée par le créateur d\'une salle (facultatif)')
    logging.basicConfig(level=logging.WARNING, format='%(asctime)s %(message)s')
    try: sys.exit(asyncio.run(principal(p.parse_args())) or 0)
    except KeyboardInterrupt: print('\n  Arrêté. À bientôt !')
