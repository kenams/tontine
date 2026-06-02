"""
Simulation complète d'une semaine de tontine Kotizy.
Crée 4 users, 1 tontine mensuelle, simule les cotisations et le payout.
"""
import urllib.request, json, ssl, sys, time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
BASE = 'https://tontineapp-web.vercel.app'

def api(method, path, data=None, token=None):
    url = BASE + path
    body = json.dumps(data).encode() if data else None
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
            text = r.read().decode()
            try: return r.status, json.loads(text)
            except: return r.status, text
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}

def ok(s, extra=''):
    icon = 'OK' if s in [200, 201] else 'FAIL'
    print(f"  {icon} [{s}] {extra}")
    return s in [200, 201]

# ══════════════════════════════════════════════════
print("=== PHASE 1: CRÉATION DES COMPTES ===")

users = [
    {'email':'sim.alice@kotizy.app','fullName':'Alice Diallo','pwd':'SimTest123!'},
    {'email':'sim.bob@kotizy.app','fullName':'Bob Koné','pwd':'SimTest123!'},
    {'email':'sim.clara@kotizy.app','fullName':'Clara Mensah','pwd':'SimTest123!'},
    {'email':'sim.david@kotizy.app','fullName':'David Traoré','pwd':'SimTest123!'},
]

tokens = []
for u in users:
    s, r = api('POST', '/api/auth/register', {
        'email': u['email'], 'password': u['pwd'],
        'fullName': u['fullName'], 'currency': 'EUR'
    })
    tok = r.get('token', '') if isinstance(r, dict) else ''
    if not tok:
        s, r = api('POST', '/api/auth/login', {'email': u['email'], 'password': u['pwd']})
        tok = r.get('token', '') if isinstance(r, dict) else ''
    tokens.append(tok)
    ok(s if tok else 500, f"{u['fullName']} → {'ok' if tok else 'FAIL: '+str(r)[:40]}")

# ══════════════════════════════════════════════════
print("\n=== PHASE 2: CRÉATION DE LA TONTINE ===")

s, r = api('POST', '/api/tontines', {
    'name': 'Cercle Émeraude SIM',
    'description': 'Tontine de simulation — 4 membres × 100€/mois = 400€ de pot',
    'contributionAmount': 100,
    'currency': 'EUR',
    'frequency': 'MONTHLY',
    'maxMembers': 4,
    'rules': 'Cotisation avant le 5 du mois. Paiement automatique activé. Exclusion après 30 jours sans paiement.',
}, token=tokens[0])
TID = r.get('group', {}).get('id', '') if isinstance(r, dict) else ''
TCODE = r.get('group', {}).get('joinCode', '') if isinstance(r, dict) else ''
ok(s, f"Tontine créée — id={TID[:12]} code={TCODE}")

# Activer mode public pour tester le marketplace
if TID:
    s, r = api('PATCH', f'/api/tontines/{TID}/settings', {
        'minTrustScore': 0, 'requireFullPayment': False,
        'autoExcludeDays': 30, 'latePenaltyCents': 0, 'emergencyFundBps': 500
    }, token=tokens[0])
    ok(s, f"Settings appliqués")

# ══════════════════════════════════════════════════
print("\n=== PHASE 3: REJOINDRE LA TONTINE ===")

for i, (u, tok) in enumerate(zip(users[1:], tokens[1:]), 1):
    if TCODE and tok:
        s, r = api('POST', '/api/tontines/join', {'joinCode': TCODE}, token=tok)
        ok(s, f"{u['fullName']} rejoint → {str(r)[:50] if s!=200 else 'ok'}")
    time.sleep(0.3)

# ══════════════════════════════════════════════════
print("\n=== PHASE 4: ACTIVATION AUTO-PAY ===")

for u, tok in zip(users, tokens):
    if TID and tok:
        s, r = api('PATCH', f'/api/tontines/{TID}/autopay', {'enabled': True}, token=tok)
        ok(s, f"{u['fullName']} autopay → {str(r)[:40] if s!=200 else 'enabled'}")
    time.sleep(0.2)

# ══════════════════════════════════════════════════
print("\n=== PHASE 5: COTISATIONS (simulation round 1) ===")

# Alice cotise via Stripe (checkout)
if TID and tokens[0]:
    s, r = api('POST', f'/api/tontines/{TID}/contribute', {'provider': 'STRIPE'}, token=tokens[0])
    hasUrl = bool(r.get('checkoutUrl')) if isinstance(r, dict) else False
    ok(s, f"Alice → Stripe checkout url={'ok' if hasUrl else 'missing'}: {r.get('error','') if not hasUrl else r.get('checkoutUrl','')[:60]}")

# Bob cotise via wallet (solde 0 — va échouer mais test le flow)
if TID and tokens[1]:
    s, r = api('POST', f'/api/tontines/{TID}/contribute', {'provider': 'WALLET'}, token=tokens[1])
    ok(s, f"Bob → Wallet: {r.get('error','ok') if isinstance(r,dict) else str(r)[:50]}")

# Clara cotise via Stripe
if TID and tokens[2]:
    s, r = api('POST', f'/api/tontines/{TID}/contribute', {'provider': 'STRIPE'}, token=tokens[2])
    hasUrl = bool(r.get('checkoutUrl')) if isinstance(r, dict) else False
    ok(s, f"Clara → Stripe url={'ok' if hasUrl else 'FAIL'}: {r.get('error','') if not hasUrl else ''}")

# ══════════════════════════════════════════════════
print("\n=== PHASE 6: VÉRIFICATION ÉTAT TONTINE ===")

if TID and tokens[0]:
    s, r = api('GET', f'/api/tontines/{TID}', token=tokens[0])
    if s == 200 and isinstance(r, dict):
        group = r.get('group', {})
        memberships = group.get('memberships', [])
        contribs = group.get('contributions', [])
        paid_count = sum(1 for c in contribs if c.get('status') == 'PAID')
        print(f"  Tontine: {group.get('name','?')}")
        print(f"  Round: {group.get('currentRound','?')}")
        print(f"  Membres: {len(memberships)}")
        print(f"  Cotisations payées ce round: {paid_count}/{len(memberships)}")
        print(f"  Fonds urgence: {(group.get('emergencyFund') or {}).get('balanceCents', 0)/100}EUR")
        for m in memberships:
            user_name = m.get('user', {}).get('fullName', '?')
            status = m.get('status', '?')
            paid = m.get('paidThisRound', False)
            score = m.get('user', {}).get('trustScore', {}).get('score', 0)
            print(f"    - {user_name}: status={status} paid={paid} score={score}/100")
    else:
        ok(s, f"detail: {str(r)[:60]}")

# ══════════════════════════════════════════════════
print("\n=== PHASE 7: NOTIFICATIONS ===")

for u, tok in zip(users, tokens):
    if tok:
        s, r = api('GET', '/api/notifications', token=tok)
        notifs = r.get('notifications', []) if isinstance(r, dict) else []
        ok(s, f"{u['fullName']}: {len(notifs)} notif(s)")

# ══════════════════════════════════════════════════
print("\n=== PHASE 8: DASHBOARD & WALLETS ===")

for u, tok in zip(users, tokens):
    if tok:
        s, r = api('GET', '/api/user/dashboard', token=tok)
        if s == 200 and isinstance(r, dict):
            wallet = r.get('user', {}).get('wallet', {})
            bal = (wallet or {}).get('balanceCents', 0) if wallet else 0
            ok(s, f"{u['fullName']}: wallet={bal/100}EUR memberships={len(r.get('memberships',[]))}")
        else:
            ok(s, f"{u['fullName']}: FAIL {str(r)[:40]}")

# ══════════════════════════════════════════════════
print("\n=== PHASE 9: MARKETPLACE (tontines publiques) ===")

s, r = api('GET', '/api/tontines/public')
tlist = r.get('tontines', []) if isinstance(r, dict) else []
ok(s, f"{len(tlist)} tontine(s) publique(s)")

# ══════════════════════════════════════════════════
print("\n=== PHASE 10: REFERRAL & KYC ===")

s, r = api('GET', '/api/referral', token=tokens[0])
ok(s, f"Alice referral code={r.get('code','?') if isinstance(r,dict) else '?'}")

s, r = api('GET', '/api/kyc/status', token=tokens[0])
ok(s, f"Alice KYC={r.get('kycStatus','?') if isinstance(r,dict) else '?'}")

# ══════════════════════════════════════════════════
print("\n=== RÉSUMÉ ===")
print(f"Tontine ID: {TID}")
print(f"Code d'invitation: {TCODE}")
print(f"URL test: https://tontineapp-web.vercel.app/tontines/{TID}")
print(f"Users: {[u['email'] for u in users]}")
print(f"Mot de passe commun: SimTest123!")
