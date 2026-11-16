#!/usr/bin/env python3
"""(tour 57) tests/reseau.html en temps réel : python3 tests/reseau.py
Les cas BroadcastChannel dépendent de messages entre « onglets » et de minuteurs : sous --virtual-time-budget le minuteur d'attente passe avant la
réponse du relais (« inconnue » au lieu de « version »). La page tourne donc dans un vrai Chrome, en temps réel, et on lit son résultat.
Plafond dur : 400 s (tour 58 : la page dure ~180 s sur GitHub ; l ancien plafond de 180 s coupait le processus, code 2)."""
import os, sys, threading
from playwright.sync_api import sync_playwright
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
threading.Timer(400, lambda: os._exit(2)).start()
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(); pg.set_default_timeout(30000)
    pg.goto('file://' + RACINE + '/tests/reseau.html', wait_until='domcontentloaded')
    try: pg.wait_for_function('() => /^RESULTAT/.test(document.getElementById("res").textContent)', timeout=360000)
    except Exception: pass
    texte = pg.inner_text('#res'); b.close()
print(texte)
import re
r = re.search(r'RESULTAT (\d+)/(\d+)', texte)
sys.exit(0 if texte.startswith('RESULTAT') and r and r.group(1) == r.group(2) else 1)
