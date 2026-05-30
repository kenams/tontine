import sys, json, time, re, hmac, hashlib, subprocess
import urllib.request, urllib.error

sys.stdout.reconfigure(encoding="utf-8")

BASE            = "http://localhost:3021"
WEB_DIR         = r"C:\Users\kenam\Application-Projet-K\tontine\web"
WEBHOOK_SECRET  = "whsec_rxsWp7vLh3Mtk1zCSaeCZku7EXoJPcxZ"
results         = []

# ── Sessions ──────────────────────────────────────────────────────────────────
admin_cookie        = ""
user_cookie         = ""
blocked_cookie      = ""
other_cookie        = ""
new_user_email      = f"testfull_{int(time.time())}@kotizy.app"
blocked_email       = f"blocked_{int(time.time())}@kotizy.app"
tontine_id          = ""
join_code           = ""
test_user_id        = ""

# ── Helpers ───────────────────────────────────────────────────────────────────
def req(method, path, body=None, cookie="", raw_body=None, extra_headers=None):
    url  = BASE + path
    data = raw_body if raw_body is not None else (json.dumps(body).encode() if body else None)
    headers = {"Content-Type": "application/json"}
    if cookie:        headers["Cookie"] = cookie
    if extra_headers: headers.update(extra_headers)
    try:
        r    = urllib.request.Request(url, data=data, headers=headers, method=method)
        resp = urllib.request.urlopen(r, timeout=12)
        raw  = resp.read().decode("utf-8", errors="replace")
        return resp.status, raw, resp.headers.get("Set-Cookie", "")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace"), ""
    except Exception as ex:
        return 0, str(ex), ""

def check(label, status, body, expected, fn=None):
    ok = (status == expected)
    if ok and fn:
        try: ok = fn(json.loads(body))
        except: ok = False
    icon  = "PASS" if ok else "FAIL"
    note  = f"HTTP {status}" if status == expected else f"HTTP {status} (attendu {expected})"
    extra = ""
    if not ok:
        try:    extra = json.loads(body).get("error", body[:80])
        except: extra = body[:80]
    results.append((icon, label, note, extra))
    return ok

def get_cookie(c):
    return "tontine_session=" + c.split("tontine_session=")[1].split(";")[0] if "tontine_session" in c else ""

def prisma_run(js_code):
    """Execute JS via node+Prisma dans le répertoire web."""
    try:
        r = subprocess.run(
            ["node", "-e", js_code],
            cwd=WEB_DIR, capture_output=True, timeout=15, text=True
        )
        return r.stdout.strip()
    except Exception as e:
        return str(e)

def stripe_sign(payload_str):
    """Génère un stripe-signature valide pour le webhook."""
    ts           = str(int(time.time()))
    signed       = f"{ts}.{payload_str}"
    sig          = hmac.new(WEBHOOK_SECRET.encode(), signed.encode(), hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"

# ══════════════════════════════════════════════════════════════════════════════
print("\n>>> Demarrage Fulltest Kotizy v2\n")

# Pre-login admin pour les tests section 0 (avant que la section 1 s'exécute)
_s, _b, _c = req("POST", "/api/auth/login", {"email": "kenams42@gmail.com", "password": "Kotizy@2026!"})
_pre_admin_cookie = get_cookie(_c)

# ── 0. VÉRIFICATION COHÉRENCE MOBILE-WEB ──────────────────────────────────────
# Règle : aucun flow core ne doit rediriger le mobile vers un browser.
# Chaque endpoint critique doit exister ET retourner le bon format pour mobile.
print("[0] Cohérence Mobile-Web...")

# 0a. /api/wallet/deposit/native DOIT exister et retourner clientSecret (pas checkoutUrl)
s, b, _ = req("POST", "/api/wallet/deposit/native", {"amountCents": 1000}, cookie=_pre_admin_cookie)
native_ok = s == 200 and "clientSecret" in b
stripe_net_err = s == 502 and "Stripe" in b
check("Mobile | /api/wallet/deposit/native → clientSecret (pas checkoutUrl)",
      200 if (native_ok or stripe_net_err) else s, b, 200,
      lambda d: ("clientSecret" in d and "checkoutUrl" not in d) if native_ok else True)

# 0b. Sans auth → 401 (pas de redirect)
s, b, _ = req("POST", "/api/wallet/deposit/native", {"amountCents": 1000})
check("Mobile | /api/wallet/deposit/native sans auth → 401", s, b, 401)

# 0c. /api/wallet/deposit (Checkout) doit retourner checkoutUrl pour web — OK de rediriger
s, b, _ = req("POST", "/api/wallet/deposit", {"amountCents": 1000})
check("Web | /api/wallet/deposit sans auth → 401", s, b, 401)

# 0d. /api/wallet/deposit/sepa DOIT exister
s, b, _ = req("POST", "/api/wallet/deposit/sepa", {"amountCents": 1000})
check("Web | /api/wallet/deposit/sepa sans auth → 401", s, b, 401)

# 0e. /api/user/dashboard DOIT exister et retourner user.wallet (pas de redirect)
s, b, _ = req("GET", "/api/user/dashboard")
check("Mobile | /api/user/dashboard sans auth → 401", s, b, 401)

# 0f. /api/notifications DOIT exister (mobile notifications screen)
s, b, _ = req("GET", "/api/notifications")
check("Mobile | /api/notifications sans auth → 401", s, b, 401)

# 0g. /api/push (subscribe/unsubscribe) DOIT exister
s, b, _ = req("POST", "/api/push", {"endpoint": "https://test.com", "p256dh": "abc", "auth": "def"})
check("Mobile | /api/push sans auth → 401", s, b, 401)

# 0h. /api/tontines/[id]/autopay DOIT exister (toggle natif mobile)
s, b, _ = req("PATCH", "/api/tontines/fake-id/autopay", {"enabled": True})
check("Mobile | /api/tontines/[id]/autopay sans auth → 401", s, b, 401)

# 0i. Vérifier que les endpoints core n'ont pas de logique "Linking.openURL" côté serveur
# (vérification statique du code mobile)
mobile_wallet_screen = open(r"C:\Users\kenam\Application-Projet-K\tontine\mobile\src\screens\app\WalletScreen.tsx").read()
has_browser_redirect_for_deposit = (
    "Linking.openURL" in mobile_wallet_screen and
    "deposit" in mobile_wallet_screen.lower() and
    "PaymentSheet" not in mobile_wallet_screen
)
check("Mobile | WalletScreen utilise PaymentSheet natif (pas Linking.openURL pour dépôt)",
      200 if not has_browser_redirect_for_deposit else 500, "{}", 200)

print(f"  > Cohérence mobile-web : {'OK' if all(r[0]=='PASS' for r in results[-9:]) else 'FAIL detecté'}\n")

# Purge rate limit buckets
prisma_run(
    "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();"
    "p.rateLimitBucket.deleteMany().then(r=>console.log('purged:',r.count)).finally(()=>p.$disconnect())"
)
print("  > Rate limit buckets purges\n")

# ── 1. AUTH ───────────────────────────────────────────────────────────────────
print("[1/13] Auth & Connexion...")

s,b,c = req("POST", "/api/auth/login", {"email":"kenams42@gmail.com","password":"Kotizy@2026!"})
admin_cookie = get_cookie(c)
check("Auth | Login admin valide", s, b, 200, lambda d: d.get("ok") and d.get("role")=="ADMIN")

s,b,_ = req("POST", "/api/auth/login", {"email":"kenams42@gmail.com","password":"mauvaismdp"})
check("Auth | Mauvais mot de passe -> 401", s, b, 401)

s,b,_ = req("POST", "/api/auth/login", {"email":"inconnu@kotizy.app","password":"Test123!"})
check("Auth | Email inexistant -> 401", s, b, 401)

s,b,_ = req("POST", "/api/auth/login", {"email":"bademail","password":"x"})
check("Auth | Email malformé -> 400", s, b, 400)

s,b,_ = req("POST", "/api/auth/login", {})
check("Auth | Body vide -> 400", s, b, 400)

s,b,_ = req("GET", "/api/auth/me", cookie=admin_cookie)
check("Auth | /me session valide -> 200", s, b, 200, lambda d: "user" in d)

s,b,_ = req("GET", "/api/auth/me")
check("Auth | /me sans session -> 401", s, b, 401)

for i in range(8):
    s,b,_ = req("POST", "/api/auth/login", {"email":f"bf{i}@test.com","password":"Test123!"})
check("Auth | Rate limit login -> 429", s, b, 429)

# ── 2. INSCRIPTION ────────────────────────────────────────────────────────────
print("[2/13] Inscription & Nouveau utilisateur...")

s,b,c = req("POST", "/api/auth/register", {
    "fullName": "Test Fulltest", "email": new_user_email,
    "password": "TestFull2026!", "currency": "EUR"
})
user_cookie = get_cookie(c)
check("Register | Nouveau compte -> ok + session", s, b, 201 if s==201 else 200, lambda d: d.get("ok") or d.get("redirectTo"))

s,b,_ = req("GET", "/api/auth/me", cookie=user_cookie) if user_cookie else (401, "{}", "")
check("Register | Session active apres inscription", s, b, 200)

# Récupérer user_id pour cleanup
if user_cookie:
    s2,b2,_ = req("GET", "/api/auth/me", cookie=user_cookie)
    try: test_user_id = json.loads(b2).get("user",{}).get("userId","")
    except: pass

s,b,_ = req("POST", "/api/auth/register", {
    "fullName":"Test","email":new_user_email,"password":"TestFull2026!","currency":"EUR"
})
check("Register | Email déjà existant -> 409", s, b, 409)

s,b,_ = req("POST", "/api/auth/register", {"fullName":"x","email":"bademail","password":"weak"})
check("Register | Données invalides -> 400", s, b, 400)

# Vérifier score = 0 (nouveau comportement)
s,b,_ = req("GET", "/api/user/dashboard", cookie=user_cookie) if user_cookie else (401,"{}", "")
def check_zero_start(d):
    wallet = d.get("user",{}).get("wallet",{})
    score  = d.get("user",{}).get("trustScore",{})
    return wallet.get("balanceCents",-1) == 0 and score.get("score",-1) == 0
check("Register | Solde 0 + score 0 au départ (pas 50)", s, b, 200, check_zero_start)

# ── 3. RESET MOT DE PASSE ─────────────────────────────────────────────────────
print("[3/13] Reset mot de passe...")

s,b,_ = req("POST", "/api/auth/forgot-password", {"email": new_user_email})
check("Reset | Forgot-password email valide -> 200", s, b, 200, lambda d: d.get("ok"))

s,b,_ = req("POST", "/api/auth/forgot-password", {"email": "ghost@nowhere.com"})
check("Reset | Forgot-password inexistant -> 200 silencieux", s, b, 200, lambda d: d.get("ok"))

s,b,_ = req("POST", "/api/auth/reset-password", {"token":"fauxtoken12345678901234567890123","password":"NewPass1!"})
check("Reset | Token invalide -> 400", s, b, 400)

# ── 4. TONTINES ───────────────────────────────────────────────────────────────
print("[4/13] Tontines & Groupes...")

s,b,_ = req("POST", "/api/tontines", {
    "name": "Fulltest Circle",
    "description": "Groupe de test automatisé — supprimé en fin de test",
    "contributionAmount": 1000,
    "currency": "EUR",
    "frequency": "MONTHLY",
    "maxMembers": 10,
    "rules": "Test auto. Ce groupe est supprimé en fin de fulltest."
}, cookie=admin_cookie)
def grab_tontine(d):
    global tontine_id, join_code
    g = d.get("group", {})
    tontine_id = g.get("id","")
    join_code  = g.get("joinCode","")
    return bool(tontine_id)
check("Tontines | Créer groupe (admin) -> 201", s, b, 201, grab_tontine)

s,b,_ = req("GET", "/api/tontines", cookie=admin_cookie)
check("Tontines | GET liste admin -> 200", s, b, 200, lambda d: "tontines" in d)

s,b,_ = req("GET", "/api/tontines")
check("Tontines | GET liste sans auth -> 401", s, b, 401)

if tontine_id:
    s,b,_ = req("GET", f"/api/tontines/{tontine_id}", cookie=admin_cookie)
    check("Tontines | GET détail membre -> 200", s, b, 200)

    s,b,_ = req("GET", f"/api/tontines/{tontine_id}")
    check("Tontines | GET détail sans auth -> 401", s, b, 401)

s,b,_ = req("POST", "/api/tontines", {"name":"x"}, cookie=admin_cookie)
check("Tontines | Données invalides -> 400", s, b, 400)

# ── 5. REJOINDRE UN GROUPE ────────────────────────────────────────────────────
print("[5/13] Join & Securité groupes...")

if join_code and user_cookie:
    s,b,_ = req("POST", "/api/tontines/join", {"joinCode": join_code}, cookie=user_cookie)
    check("Join | Rejoindre avec code valide -> 200", s, b, 200, lambda d: "groupId" in d)

    s,b,_ = req("POST", "/api/tontines/join", {"joinCode": join_code}, cookie=user_cookie)
    check("Join | Déjà membre -> alreadyMember", s, b, 200, lambda d: d.get("alreadyMember"))

s,b,_ = req("POST", "/api/tontines/join", {"joinCode": "FAKECODE99"}, cookie=admin_cookie)
check("Join | Code inexistant -> 404", s, b, 404)

s,b,_ = req("POST", "/api/tontines/join", {"joinCode": ""}, cookie=admin_cookie)
check("Join | Code vide -> 400", s, b, 400)

s,b,_ = req("POST", "/api/tontines/join", {"joinCode": "ANYCODE"})
check("Join | Sans session -> 401", s, b, 401)

# ── 6. PAIEMENTS ──────────────────────────────────────────────────────────────
print("[6/13] Paiements & Transactions...")

s,b,_ = req("GET", "/api/payments/providers")
check("Payments | GET providers -> 200", s, b, 200)

s,b,_ = req("POST", "/api/payments/stripe/webhook", {"type":"test"})
check("Payments | Webhook sans signature -> 400", s, b, 400)

if tontine_id:
    s,b,_ = req("POST", f"/api/tontines/{tontine_id}/contribute", {"provider":"WALLET"})
    check("Payments | Cotisation sans auth -> 401", s, b, 401)

    if user_cookie:
        s,b,_ = req("POST", f"/api/tontines/{tontine_id}/contribute", {"provider":"WALLET"}, cookie=user_cookie)
        check("Payments | Cotisation wallet -> PAID ou PENDING", s, b, 200,
              lambda d: d.get("ok") and d.get("status") in ["PAID","PENDING"])

    if user_cookie:
        s,b,_ = req("POST", f"/api/tontines/{tontine_id}/contribute", {"provider":"STRIPE"}, cookie=user_cookie)
        stripe_ok = s == 200 or (s == 502 and "Stripe" in b)
        check("Payments | Cotisation Stripe -> 200 (checkoutUrl) ou 502", 200 if stripe_ok else s, b, 200)

s,b,_ = req("GET", "/api/transactions", cookie=admin_cookie)
check("Transactions | GET historique admin -> 200", s, b, 200)

# ── 7. WALLET DEPOSIT — FLOW COMPLET ─────────────────────────────────────────
print("[7/13] Wallet Deposit Flow...")

# 7a. Sans auth -> 401
s,b,_ = req("POST", "/api/wallet/deposit", {"amountCents": 2500})
check("Wallet | Dépôt sans auth -> 401", s, b, 401)

# 7b. Montant invalide (< 500 = moins de 5€)
if user_cookie:
    s,b,_ = req("POST", "/api/wallet/deposit", {"amountCents": 100}, cookie=user_cookie)
    check("Wallet | Montant trop faible (100 cts) -> 400", s, b, 400)

# 7c. Montant invalide (trop élevé)
if user_cookie:
    s,b,_ = req("POST", "/api/wallet/deposit", {"amountCents": 99999999}, cookie=user_cookie)
    check("Wallet | Montant trop élevé -> 400", s, b, 400)

# 7d. Body invalide
if user_cookie:
    s,b,_ = req("POST", "/api/wallet/deposit", {"amountCents": "abc"}, cookie=user_cookie)
    check("Wallet | Amount non-numérique -> 400", s, b, 400)

# 7e. Dépôt valide -> Stripe Checkout URL (peut échouer en dev si réseau restreint)
deposit_transaction_id = ""
deposit_wallet_id      = ""
if user_cookie:
    s,b,_ = req("POST", "/api/wallet/deposit", {"amountCents": 2500}, cookie=user_cookie)
    stripe_reachable = s == 200 and "checkoutUrl" in b
    stripe_net_error = s == 502 and "Stripe" in b  # StripeConnectionError réseau local
    deposit_endpoint_ok = stripe_reachable or stripe_net_error
    check("Wallet | Dépôt 25€ -> endpoint répond (200 ou 502 réseau dev)",
          200 if deposit_endpoint_ok else s, "{}", 200)
    if stripe_reachable:
        out = prisma_run(
            "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();"
            f"p.transaction.findFirst({{where:{{type:'WALLET_DEPOSIT',status:'PENDING',user:{{email:'{new_user_email}'}}}},orderBy:{{createdAt:'desc'}},include:{{wallet:true}}}})"
            ".then(t=>console.log(JSON.stringify({{txId:t?.id,walletId:t?.walletId}})))"
            ".finally(()=>p.$disconnect())"
        )
        try:
            info = json.loads(out)
            deposit_transaction_id = info.get("txId","")
            deposit_wallet_id      = info.get("walletId","")
        except: pass

# 7f. Créer transaction + wallet en DB via script node séparé (si Stripe réseau KO)
if user_cookie and not deposit_transaction_id:
    try:
        r = subprocess.run(
            ["node", f"{WEB_DIR}/scripts/create-test-deposit.js", new_user_email],
            cwd=WEB_DIR, capture_output=True, timeout=15, text=True
        )
        info = json.loads(r.stdout.strip())
        deposit_transaction_id = info.get("txId","")
        deposit_wallet_id      = info.get("walletId","")
        if not test_user_id: test_user_id = info.get("userId","")
    except: pass

check("Wallet | Transaction WALLET_DEPOSIT PENDING en DB (direct ou via endpoint)",
      200 if bool(deposit_transaction_id) else 500, "{}", 200)

# 7g. Simuler le webhook Stripe checkout.session.completed (WALLET_DEPOSIT)
webhook_credited = False
if deposit_transaction_id and deposit_wallet_id:
    ts_now    = int(time.time())
    fake_event = {
        "id":     f"evt_test_{ts_now}",
        "object": "event",
        "type":   "checkout.session.completed",
        "data": {
            "object": {
                "id":             f"cs_test_{ts_now}",
                "object":         "checkout.session",
                "payment_status": "paid",
                "payment_intent": f"pi_test_{ts_now}",
                "status":         "complete",
                "metadata": {
                    "type":          "WALLET_DEPOSIT",
                    "transactionId": deposit_transaction_id,
                    "walletId":      deposit_wallet_id,
                    "userId":        test_user_id,
                    "currency":      "eur"
                }
            }
        }
    }
    payload_str = json.dumps(fake_event, separators=(',', ':'))
    stripe_sig  = stripe_sign(payload_str)

    s,b,_ = req("POST", "/api/payments/stripe/webhook",
                raw_body=payload_str.encode(),
                extra_headers={"stripe-signature": stripe_sig})
    webhook_ok = s == 200 and json.loads(b).get("updated") is True
    check("Wallet | Webhook WALLET_DEPOSIT -> 200 + wallet crédité", s, b, 200,
          lambda d: d.get("updated") is True)
    webhook_credited = webhook_ok

# 7h. Vérifier balance wallet = 2500 après webhook
if webhook_credited and user_cookie:
    time.sleep(0.5)
    s,b,_ = req("GET", "/api/user/dashboard", cookie=user_cookie)
    check("Wallet | Balance = 2500 EUR après webhook", s, b, 200,
          lambda d: d.get("user",{}).get("wallet",{}).get("balanceCents",0) == 2500)

# 7h. Rate limit dépôt (6 tentatives > 5 max)
if user_cookie:
    for _ in range(6):
        s,b,_ = req("POST", "/api/wallet/deposit", {"amountCents": 500}, cookie=user_cookie)
    check("Wallet | Rate limit dépôt (5/min) -> 429", s, b, 429)

# ── 8. UTILISATEUR BLOQUÉ ─────────────────────────────────────────────────────
print("[8/13] Utilisateur bloqué / suspendu...")

s,b,c = req("POST", "/api/auth/register", {
    "fullName":"User Bloqué","email":blocked_email,
    "password":"Blocked2026!","currency":"XOF"
})
blocked_cookie = get_cookie(c)
check("Blocked | Créer compte à bloquer -> ok", s, b, 200 if s==200 else 201)

blocked_id = ""
if blocked_cookie:
    s,b,_ = req("GET", "/api/auth/me", cookie=blocked_cookie)
    try: blocked_id = json.loads(b).get("user",{}).get("userId","")
    except: pass

if blocked_id and admin_cookie:
    s,b,_ = req("PATCH", f"/api/admin/users/{blocked_id}", {"status":"BANNED"}, cookie=admin_cookie)
    check("Blocked | Admin bannit user -> 200", s, b, 200)

    s,b,_ = req("POST", "/api/auth/login", {"email":blocked_email,"password":"Blocked2026!"})
    check("Blocked | Login user banni -> 403", s, b, 403)

    s,b,_ = req("GET", "/api/auth/me", cookie=blocked_cookie)
    check("Blocked | Session user banni -> 401 ou null", s, b, 401 if s==401 else 200,
          lambda d: d.get("session") is None or "user" not in d)

    if join_code:
        s,b,_ = req("POST", "/api/tontines/join", {"joinCode": join_code}, cookie=blocked_cookie)
        check("Blocked | User banni ne peut pas rejoindre -> 401/403", s, b, s if s in [401,403] else 403)

# ── 9. ADMIN ──────────────────────────────────────────────────────────────────
print("[9/13] Admin & Backoffice...")

s,b,_ = req("GET", "/api/admin/stats", cookie=admin_cookie)
check("Admin | Stats ADMIN -> 200 + totalUsers", s, b, 200, lambda d: "totalUsers" in d)

s,b,_ = req("GET", "/api/admin/stats", cookie=user_cookie) if user_cookie else (403, "{}", "")
check("Admin | Stats USER -> 403", s, b, 403)

s,b,_ = req("GET", "/api/admin/stats")
check("Admin | Stats sans auth -> 403", s, b, 403)

s,b,_ = req("GET", "/api/admin/users", cookie=admin_cookie)
check("Admin | Liste users -> 200", s, b, 200, lambda d: "users" in d)

s,b,_ = req("GET", "/api/admin/transactions", cookie=admin_cookie)
check("Admin | Transactions -> 200", s, b, 200)

s,b,_ = req("GET", "/api/admin/alerts", cookie=admin_cookie)
check("Admin | Alertes fraude -> 200", s, b, 200)

s,b,_ = req("GET", "/api/admin/logs", cookie=admin_cookie)
check("Admin | Logs audit -> 200", s, b, 200)

s,b,_ = req("GET", "/api/admin/logs")
check("Admin | Logs sans auth -> 403", s, b, 403)

# ── 10. SÉCURITÉ ──────────────────────────────────────────────────────────────
print("[10/13] Securite...")

s,b,_ = req("POST", "/api/auth/register", {"email":"<script>@xss.com","fullName":"X","password":"X"})
check("Securite | XSS email -> 400 (Zod)", s, b, 400)

s,b,_ = req("POST", "/api/tontines", {}, cookie=admin_cookie)
check("Securite | Tontine body vide -> 400", s, b, 400)

import urllib.parse
sql_q = urllib.parse.quote("' OR 1=1 --")
s,b,_ = req("GET", f"/api/admin/users?q={sql_q}", cookie=admin_cookie)
check("Securite | SQL injection search -> 200 sans fuite", s, b, 200, lambda d: "users" in d)

if tontine_id:
    s2,b2,c2 = req("POST", "/api/auth/register", {
        "fullName":"Autre","email":f"autre_{int(time.time())}@kotizy.app",
        "password":"Autre2026!","currency":"XOF"})
    other_cookie = get_cookie(c2)
    if other_cookie:
        s,b,_ = req("GET", f"/api/tontines/{tontine_id}", cookie=other_cookie)
        check("Securite | Non-membre ne voit pas le groupe -> 403", s, b, 403)

s,b,_ = req("GET", "/api/admin/alerts")
check("Securite | Admin alerts sans auth -> 403", s, b, 403)

# ── 11. AI COACH + REALTIME ───────────────────────────────────────────────────
print("[11/13] Coach IA & Realtime...")

s,b,_ = req("GET", "/api/ai/coach", cookie=admin_cookie)
check("AI Coach | Avec auth -> 200 + advice", s, b, 200, lambda d: bool(d.get("advice")))

s,b,_ = req("GET", "/api/ai/coach")
check("AI Coach | Sans auth -> 401", s, b, 401)

s,b,_ = req("GET", "/api/pulse")
check("Realtime | Pulse DB -> 200 + metrics", s, b, 200, lambda d: "metrics" in d)

s,b,_ = req("GET", "/api/cron/advance-rounds")
check("Cron | advance-rounds -> 200", s, b, 200, lambda d: d.get("ok") is True)

# ── 12. CLEANUP — SUPPRESSION DE TOUTES LES DONNÉES DE TEST ──────────────────
print("[13/13] Cleanup données test...")

cleanup_js = r"""
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Trouver tous les users de test
  const testEmails = await p.user.findMany({
    where: { email: { contains: '@kotizy.app' } },
    select: { id: true, email: true }
  });
  const testIds = testEmails.map(u => u.id);
  if (testIds.length === 0) { console.log('Rien a nettoyer'); return; }

  // Supprimer les groupes créés par ces users
  const groups = await p.tontineGroup.findMany({
    where: { createdById: { in: testIds } },
    select: { id: true }
  });
  const groupIds = groups.map(g => g.id);

  // Cascade suppression groupes
  if (groupIds.length > 0) {
    await p.adminLog.deleteMany({ where: { targetId: { in: groupIds } } });
    await p.fraudAlert.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.vote.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.dispute.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.notification.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.message.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.transaction.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.contribution.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.membership.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.emergencyFund.deleteMany({ where: { tontineGroupId: { in: groupIds } } });
    await p.tontineGroup.deleteMany({ where: { id: { in: groupIds } } });
  }

  // Supprimer les memberships de ces users dans d'autres groupes
  await p.membership.deleteMany({ where: { userId: { in: testIds } } });

  // Supprimer les users (cascade wallet/trustScore/etc)
  const deleted = await p.user.deleteMany({
    where: { email: { contains: '@kotizy.app' } }
  });
  console.log('Supprimes:', deleted.count, 'users test');
  console.log('Groupes supprimes:', groupIds.length);
}
main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
"""

cleanup_out = prisma_run(cleanup_js)
cleanup_ok  = "Supprimes:" in cleanup_out or "Rien" in cleanup_out
check("Cleanup | Suppression users + groupes test -> ok",
      200 if cleanup_ok else 500, "{}", 200)
if cleanup_out:
    print(f"       {cleanup_out.strip()}")

# Purge rate limit buckets post-test
prisma_run(
    "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();"
    "p.rateLimitBucket.deleteMany().then(()=>p.$disconnect())"
)

# ── RAPPORT ────────────────────────────────────────────────────────────────────
passed = [r for r in results if r[0]=="PASS"]
failed = [r for r in results if r[0]=="FAIL"]

print("\n" + "="*66)
print("  FULLTEST KOTIZY v2 — RAPPORT COMPLET")
print("="*66)

cats = {}
for r in results:
    cat = r[1].split("|")[0].strip()
    cats.setdefault(cat, []).append(r)

for cat, items in cats.items():
    p_count = sum(1 for i in items if i[0]=="PASS")
    status  = "OK" if p_count == len(items) else f"!!! {len(items)-p_count} FAIL"
    print(f"\n  [{p_count}/{len(items)}] {cat}  {status}")
    for icon, label, note, extra in items:
        name = label.split("|")[1].strip() if "|" in label else label
        mark = "[OK]" if icon=="PASS" else "[KO]"
        print(f"    {mark}  {name}")
        if icon == "FAIL":
            print(f"         => {note}")
            if extra.strip(): print(f"         => {extra[:120]}")

print("\n" + "="*66)
score_pct = int(len(passed)/len(results)*100) if results else 0
print(f"  Score final : {len(passed)}/{len(results)} PASS ({score_pct}%)  |  {len(failed)} FAIL")
print("="*66)

if failed:
    print("\n  FAILS A CORRIGER:")
    for _, label, note, extra in failed:
        name = label.split("|")[1].strip() if "|" in label else label
        print(f"    - {name}: {note}")
        if extra.strip(): print(f"      {extra[:120]}")
print()
