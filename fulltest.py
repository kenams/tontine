import sys, json, time, re
import urllib.request, urllib.error

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://localhost:3021"
results = []

# ── Sessions ──────────────────────────────────────────────────────────────────
admin_cookie = ""
user_cookie  = ""
user2_cookie = ""
user_blocked_cookie = ""
new_user_email = f"testfull_{int(time.time())}@kotizy.app"
blocked_email  = f"blocked_{int(time.time())}@kotizy.app"
tontine_id = ""
join_code  = ""

def req(method, path, body=None, cookie=""):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if cookie: headers["Cookie"] = cookie
    try:
        r = urllib.request.Request(url, data=data, headers=headers, method=method)
        resp = urllib.request.urlopen(r, timeout=12)
        raw = resp.read().decode("utf-8", errors="replace")
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
    icon = "PASS" if ok else "FAIL"
    note = f"HTTP {status}" if status == expected else f"HTTP {status} (attendu {expected})"
    extra = ""
    if not ok:
        try:
            d = json.loads(body)
            extra = d.get("error", body[:80])
        except: extra = body[:80]
    results.append((icon, label, note, extra))
    return ok

def get_cookie(c): return "tontine_session=" + c.split("tontine_session=")[1].split(";")[0] if "tontine_session" in c else ""

# ══════════════════════════════════════════════════════════════
print("\n>>> Demarrage Fulltest Kotizy\n")

# Purge les rate limit buckets locaux avant le test (via Prisma direct)
try:
    import subprocess
    subprocess.run(
        ["node", "-e",
         "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();"
         "p.rateLimitBucket.deleteMany().then(r=>console.log('buckets purged:',r.count)).finally(()=>p.$disconnect())"],
        cwd=r"C:\Users\kenam\Application-Projet-K\tontine\web",
        capture_output=True, timeout=10
    )
    print("  > Rate limit buckets purges\n")
except: pass

# ── 1. AUTH — Login ────────────────────────────────────────────────────────────
print("[1/10] Auth & Connexion...")

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

# Brute force simulé (rate limit)
for i in range(8):
    s,b,_ = req("POST", "/api/auth/login", {"email":f"bf{i}@test.com","password":"Test123!"})
# Doit être bloqué après plusieurs tentatives
check("Auth | Rate limit login -> 429", s, b, 429)

# ── 2. INSCRIPTION NOUVEAU UTILISATEUR ─────────────────────────────────────────
print("[2/10] Inscription & Nouveau utilisateur...")

s,b,c = req("POST", "/api/auth/register", {
    "fullName": "Test Fulltest",
    "email": new_user_email,
    "password": "TestFull2026!",
    "currency": "XOF"
})
user_cookie = get_cookie(c)
check("Register | Nouveau compte -> 201 + session", s, b, 201 if s==201 else 200, lambda d: d.get("ok") or d.get("redirectTo"))
if s not in [200, 201]:
    user_cookie = ""

s,b,_ = req("GET", "/api/auth/me", cookie=user_cookie) if user_cookie else (401, "{}", "")
check("Register | Session active apres inscription", s, b, 200)

s,b,_ = req("POST", "/api/auth/register", {
    "fullName": "Test Fulltest",
    "email": new_user_email,
    "password": "TestFull2026!",
    "currency": "XOF"
})
check("Register | Email déjà existant -> 409", s, b, 409)

s,b,_ = req("POST", "/api/auth/register", {"fullName":"x","email":"bademail","password":"weak"})
check("Register | Données invalides -> 400", s, b, 400)

# Vérifier solde = 0
s,b,_ = req("GET", "/api/user/dashboard", cookie=user_cookie) if user_cookie else (401, "{}", "")
def check_zero_balance(d):
    wallet = d.get("user", {}).get("wallet", {})
    score  = d.get("user", {}).get("trustScore", {})
    return wallet.get("balanceCents", -1) == 0 and score.get("score", -1) == 50
check("Register | Solde 0 + score 50 apres inscription", s, b, 200, check_zero_balance)

# ── 3. RESET MOT DE PASSE ──────────────────────────────────────────────────────
print("[3/10] Reset mot de passe...")

s,b,_ = req("POST", "/api/auth/forgot-password", {"email": new_user_email})
check("Reset | Forgot-password email valide -> 200", s, b, 200, lambda d: d.get("ok"))

s,b,_ = req("POST", "/api/auth/forgot-password", {"email": "ghost@nowhere.com"})
check("Reset | Forgot-password inexistant -> 200 silencieux", s, b, 200, lambda d: d.get("ok"))

s,b,_ = req("POST", "/api/auth/reset-password", {"token":"fauxtoken12345678901234567890123","password":"NewPass1!"})
check("Reset | Token invalide -> 400", s, b, 400)

s,b,_ = req("POST", "/api/auth/reset-password", {"token":"fauxtoken","password":"weak"})
check("Reset | Mdp trop faible -> 400", s, b, 400)

# ── 4. TONTINES ────────────────────────────────────────────────────────────────
print("[4/10] Tontines & Groupes...")

# Creer une tontine en tant qu'admin
s,b,_ = req("POST", "/api/tontines", {
    "name": "Fulltest Circle",
    "description": "Groupe de test automatisé Fulltest pour valider toutes les fonctionnalités",
    "contributionAmount": 5000,
    "currency": "XOF",
    "frequency": "MONTHLY",
    "maxMembers": 10,
    "rules": "Cotisation avant le 5. Pénalité après 48h. Ce groupe est uniquement pour les tests automatisés."
}, cookie=admin_cookie)
def grab_tontine(d):
    global tontine_id, join_code
    g = d.get("group", {})
    tontine_id = g.get("id", "")
    join_code  = g.get("joinCode", "")
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

# ── 5. REJOINDRE UN GROUPE ─────────────────────────────────────────────────────
print("[5/10] Join & Securité groupes...")

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

# ── 6. PAIEMENTS ───────────────────────────────────────────────────────────────
print("[6/10] Paiements & Transactions...")

s,b,_ = req("GET", "/api/payments/providers")
check("Payments | GET providers -> 200", s, b, 200)

# Webhook sans signature
s,b,_ = req("POST", "/api/payments/stripe/webhook", {"type":"test"})
check("Payments | Webhook sans signature -> 400", s, b, 400)

# Cotisation sans auth
if tontine_id:
    s,b,_ = req("POST", f"/api/tontines/{tontine_id}/contribute", {"provider":"WALLET"})
    check("Payments | Cotisation sans auth -> 401", s, b, 401)

    # Cotisation wallet (user membre)
    if user_cookie:
        s,b,_ = req("POST", f"/api/tontines/{tontine_id}/contribute", {"provider":"WALLET"}, cookie=user_cookie)
        check("Payments | Cotisation wallet -> ok (PAID ou PENDING)", s, b, 200,
              lambda d: d.get("ok") and d.get("status") in ["PAID","PENDING"])

    # Cotisation Stripe — accepte 200 (ok) ou 502 (Stripe key locale invalide, normal en dev)
    if user_cookie:
        s,b,_ = req("POST", f"/api/tontines/{tontine_id}/contribute", {"provider":"STRIPE"}, cookie=user_cookie)
        stripe_ok = s == 200 or (s == 502 and "Stripe" in b)
        check("Payments | Cotisation Stripe -> 200 ou 502 (clé locale)", 200 if stripe_ok else s, b, 200)

s,b,_ = req("GET", "/api/transactions", cookie=admin_cookie)
check("Transactions | GET historique admin -> 200", s, b, 200)

# ── 7. UTILISATEUR BLOQUÉ ─────────────────────────────────────────────────────
print("[7/10] Utilisateur bloqué / suspendu...")

# Créer user à bloquer
s,b,c = req("POST", "/api/auth/register", {
    "fullName": "User Bloqué",
    "email": blocked_email,
    "password": "Blocked2026!",
    "currency": "XOF"
})
blocked_cookie = get_cookie(c)
check("Blocked | Créer compte à bloquer -> ok", s, b, 200 if s==200 else 201)

# Admin bloque le user
blocked_id = ""
if blocked_cookie:
    s,b,_ = req("GET", "/api/auth/me", cookie=blocked_cookie)
    try:
        blocked_id = json.loads(b).get("user",{}).get("userId","")
    except: pass

if blocked_id and admin_cookie:
    s,b,_ = req("PATCH", f"/api/admin/users/{blocked_id}", {"status":"BANNED"}, cookie=admin_cookie)
    check("Blocked | Admin bannit user -> 200", s, b, 200)

    # Connexion refusée pour user banni
    s,b,_ = req("POST", "/api/auth/login", {"email":blocked_email,"password":"Blocked2026!"})
    check("Blocked | Login user banni -> 403", s, b, 403)

    # Session existante invalidée
    s,b,_ = req("GET", "/api/auth/me", cookie=blocked_cookie)
    check("Blocked | Session user banni -> null (401 ou user null)", s, b, 401 if s==401 else 200,
          lambda d: d.get("session") is None or "user" not in d)

    # Tentative join groupe par user banni
    if join_code:
        s,b,_ = req("POST", "/api/tontines/join", {"joinCode": join_code}, cookie=blocked_cookie)
        check("Blocked | User banni ne peut pas rejoindre -> 401/403", s, b, s if s in [401,403] else 403)

# ── 8. ADMIN ───────────────────────────────────────────────────────────────────
print("[8/10] Admin & Backoffice...")

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

# ── 9. SECURITÉ ────────────────────────────────────────────────────────────────
print("[9/10] Securite...")

s,b,_ = req("POST", "/api/auth/register", {"email":"<script>@xss.com","fullName":"X","password":"X"})
check("Securite | XSS email -> 400 (Zod)", s, b, 400)

s,b,_ = req("POST", "/api/tontines", {}, cookie=admin_cookie)
check("Securite | Tontine body vide -> 400", s, b, 400)

# SQL injection basique dans search — URL-encodé correctement
import urllib.parse
sql_q = urllib.parse.quote("' OR 1=1 --")
s,b,_ = req("GET", f"/api/admin/users?q={sql_q}", cookie=admin_cookie)
check("Securite | SQL injection search -> 200 sans fuite", s, b, 200, lambda d: "users" in d)

# Accès tontine non membre
if tontine_id:
    other_cookie = ""
    s2,b2,c2 = req("POST", "/api/auth/register", {
        "fullName":"Autre","email":f"autre_{int(time.time())}@kotizy.app",
        "password":"Autre2026!","currency":"XOF"})
    other_cookie = get_cookie(c2)
    if other_cookie:
        s,b,_ = req("GET", f"/api/tontines/{tontine_id}", cookie=other_cookie)
        check("Securite | Non-membre ne voit pas le groupe -> 403", s, b, 403)

s,b,_ = req("GET", "/api/admin/alerts")
check("Securite | Admin alerts sans auth -> 403", s, b, 403)

# ── 10. AI COACH + REALTIME ────────────────────────────────────────────────────
print("[10/10] Coach IA & Realtime...")

s,b,_ = req("GET", "/api/ai/coach", cookie=admin_cookie)
check("AI Coach | Avec auth -> 200 + advice", s, b, 200, lambda d: bool(d.get("advice")))

s,b,_ = req("GET", "/api/ai/coach")
check("AI Coach | Sans auth -> 401", s, b, 401)

s,b,_ = req("GET", "/api/pulse")
check("Realtime | Pulse DB -> 200 + metrics", s, b, 200, lambda d: "metrics" in d)

s,b,_ = req("GET", "/api/cron/advance-rounds")
check("Cron | advance-rounds -> 200", s, b, 200, lambda d: d.get("ok") is True)

# ── RAPPORT ────────────────────────────────────────────────────────────────────
passed = [r for r in results if r[0]=="PASS"]
failed = [r for r in results if r[0]=="FAIL"]

print("\n" + "="*66)
print("  FULLTEST KOTIZY — RAPPORT COMPLET")
print("="*66)

cats = {}
for r in results:
    cat = r[1].split("|")[0].strip()
    cats.setdefault(cat, []).append(r)

for cat, items in cats.items():
    p = sum(1 for i in items if i[0]=="PASS")
    status = "OK" if p == len(items) else f"!!! {len(items)-p} FAIL"
    print(f"\n  [{p}/{len(items)}] {cat}  {status}")
    for icon, label, note, extra in items:
        name = label.split("|")[1].strip() if "|" in label else label
        mark = "[OK]" if icon=="PASS" else "[KO]"
        print(f"    {mark}  {name}")
        if icon == "FAIL":
            print(f"         => {note}")
            if extra.strip(): print(f"         => {extra[:100]}")

print("\n" + "="*66)
score_pct = int(len(passed)/len(results)*100) if results else 0
print(f"  Score final : {len(passed)}/{len(results)} PASS ({score_pct}%)  |  {len(failed)} FAIL")
print("="*66)

if failed:
    print("\n  FAILS A CORRIGER:")
    for _, label, note, extra in failed:
        name = label.split("|")[1].strip() if "|" in label else label
        print(f"    - {name}: {note}")
        if extra.strip(): print(f"      {extra[:100]}")
print()
