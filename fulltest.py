import sys, json
import urllib.request, urllib.error

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://localhost:3021"
results = []
user_cookie = ""
admin_cookie = ""

def req(method, path, body=None, cookie=""):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie
    try:
        r = urllib.request.Request(url, data=data, headers=headers, method=method)
        resp = urllib.request.urlopen(r, timeout=8)
        return resp.status, resp.read().decode("utf-8", errors="replace"), resp.headers.get("Set-Cookie","")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace"), ""
    except Exception as ex:
        return 0, str(ex), ""

def check(label, status, body, expected, fn=None):
    ok = (status == expected)
    if ok and fn:
        try:
            ok = fn(json.loads(body))
        except:
            ok = False
    icon = "PASS" if ok else "FAIL"
    note = f"HTTP {status}" if status == expected else f"HTTP {status} (attendu {expected})"
    results.append((icon, label, note, body[:120] if not ok else ""))

# ── AUTH ──────────────────────────────────────────────
s,b,c = req("POST","/api/auth/login",{"email":"user@kotizy.app","password":"User123!"})
if "tontine_session" in c:
    user_cookie = "tontine_session=" + c.split("tontine_session=")[1].split(";")[0]
check("Auth | Login user valide", s,b, 200, lambda d: d.get("ok") and d.get("redirectTo")=="/dashboard")

s,b,c = req("POST","/api/auth/login",{"email":"admin@kotizy.app","password":"Admin123!"})
if "tontine_session" in c:
    admin_cookie = "tontine_session=" + c.split("tontine_session=")[1].split(";")[0]
check("Auth | Login admin valide", s,b, 200, lambda d: d.get("ok") and d.get("role")=="ADMIN")

s,b,_ = req("POST","/api/auth/login",{"email":"user@kotizy.app","password":"mauvaismdp"})
check("Auth | Mauvais mdp -> 401", s,b, 401)

s,b,_ = req("POST","/api/auth/login",{"email":"inconnu@test.com","password":"Test123!"})
check("Auth | Email inconnu -> 401", s,b, 401)

s,b,_ = req("POST","/api/auth/login",{"email":"notemail","password":"x"})
check("Auth | Email invalide -> 400", s,b, 400)

s,b,_ = req("GET","/api/auth/me", cookie=user_cookie)
check("Auth | /me avec session -> 200", s,b, 200)

s,b,_ = req("GET","/api/auth/me")
check("Auth | /me sans session -> 401", s,b, 401)

s,b,_ = req("POST","/api/auth/forgot-password",{"email":"user@kotizy.app"})
check("Auth | Forgot-password valide -> 200", s,b, 200, lambda d: d.get("ok"))

s,b,_ = req("POST","/api/auth/forgot-password",{"email":"ghost@nowhere.com"})
check("Auth | Forgot-password inconnu -> 200 silencieux", s,b, 200, lambda d: d.get("ok"))

s,b,_ = req("POST","/api/auth/reset-password",{"token":"faketoken123456789012345678901234","password":"NewPass1!"})
check("Auth | Reset faux token -> 400", s,b, 400)

# ── USER / DASHBOARD ──────────────────────────────────
s,b,_ = req("GET","/api/user/dashboard", cookie=user_cookie)
check("User | Dashboard autentifie -> 200", s,b, 200)

s,b,_ = req("GET","/api/user/dashboard")
check("User | Dashboard sans auth -> 401", s,b, 401)

# ── TONTINES ──────────────────────────────────────────
s,b,_ = req("GET","/api/tontines", cookie=user_cookie)
check("Tontines | GET liste -> 200 + tontines[]", s,b, 200, lambda d: "tontines" in d)

s,b,_ = req("GET","/api/tontines")
check("Tontines | GET sans auth -> 401", s,b, 401)

s,b,_ = req("POST","/api/tontines",{
    "name":"Fulltest Circle","description":"Tontine automatisee de test fulltest",
    "contributionAmount":15000,"currency":"XOF","frequency":"MONTHLY",
    "maxMembers":5,"rules":"Regles test : payer avant le 5. Pas de retard tolere pour ce groupe."
}, cookie=user_cookie)
tontine_id_holder = [""]
def grab_id(d):
    tid = d.get("group",{}).get("id","")
    tontine_id_holder[0] = tid
    return bool(tid)
check("Tontines | POST creer -> 201", s,b, 201, grab_id)

tontine_id = tontine_id_holder[0]
if tontine_id:
    s,b,_ = req("GET",f"/api/tontines/{tontine_id}", cookie=user_cookie)
    check("Tontines | GET detail membre -> 200", s,b, 200)
    s,b,_ = req("GET",f"/api/tontines/{tontine_id}")
    check("Tontines | GET detail sans auth -> 401", s,b, 401)

s,b,_ = req("POST","/api/tontines",{"name":"x"}, cookie=user_cookie)
check("Tontines | POST donnees invalides -> 400", s,b, 400)

# ── JOIN ──────────────────────────────────────────────
s,b,_ = req("POST","/api/tontines/join",{"joinCode":"XXXXXXXXX"}, cookie=user_cookie)
check("Join | Code inexistant -> 404", s,b, 404)

s,b,_ = req("POST","/api/tontines/join",{"joinCode":""}, cookie=user_cookie)
check("Join | Code vide -> 400", s,b, 400)

s,b,_ = req("POST","/api/tontines/join",{"joinCode":"TEST"})
check("Join | Sans auth -> 401", s,b, 401)

# ── ADMIN ─────────────────────────────────────────────
s,b,_ = req("GET","/api/admin/stats", cookie=admin_cookie)
check("Admin | Stats ADMIN -> 200", s,b, 200, lambda d: "totalUsers" in d)

s,b,_ = req("GET","/api/admin/stats", cookie=user_cookie)
check("Admin | Stats USER -> 403", s,b, 403)

s,b,_ = req("GET","/api/admin/stats")
check("Admin | Stats sans auth -> 403", s,b, 403)

s,b,_ = req("GET","/api/admin/users", cookie=admin_cookie)
check("Admin | Users ADMIN -> 200", s,b, 200, lambda d: "users" in d)

s,b,_ = req("GET","/api/admin/users", cookie=user_cookie)
check("Admin | Users USER -> 403", s,b, 403)

s,b,_ = req("GET","/api/admin/transactions", cookie=admin_cookie)
check("Admin | Transactions ADMIN -> 200", s,b, 200)

s,b,_ = req("GET","/api/admin/tontines", cookie=admin_cookie)
check("Admin | Tontines ADMIN -> 200", s,b, 200)

# ── TRANSACTIONS / NOTIFS ─────────────────────────────
s,b,_ = req("GET","/api/transactions", cookie=user_cookie)
check("Transactions | GET auth -> 200", s,b, 200)

s,b,_ = req("GET","/api/notifications", cookie=user_cookie)
check("Notifications | GET auth -> 200", s,b, 200, lambda d: "notifications" in d)

s,b,_ = req("GET","/api/notifications")
check("Notifications | Sans auth -> 401", s,b, 401)

# ── PAYMENTS ──────────────────────────────────────────
s,b,_ = req("GET","/api/payments/providers")
check("Payments | GET providers -> 200", s,b, 200)

s,b,_ = req("POST","/api/payments/stripe/webhook",{"test":True})
check("Payments | Webhook sans signature -> 400", s,b, 400)

# ── REALTIME ──────────────────────────────────────────
s,b,_ = req("GET","/api/pulse")
check("Realtime | Pulse endpoint (/api/pulse) -> 200", s,b, 200)

# ── CRON ──────────────────────────────────────────────
s,b,_ = req("GET","/api/cron/advance-rounds")
check("Cron | advance-rounds -> 200", s,b, 200, lambda d: d.get("ok") is True)

# ── SECURITE ──────────────────────────────────────────
s,b,_ = req("POST","/api/auth/login",{})
check("Securite | Login body vide -> 400", s,b, 400)

s,b,_ = req("POST","/api/auth/register",{"email":"<script>@xss.com","fullName":"X","password":"X"})
check("Securite | XSS email -> 400 (Zod)", s,b, 400)

s,b,_ = req("POST","/api/tontines",{}, cookie=user_cookie)
check("Securite | Tontine body vide -> 400", s,b, 400)

s,b,_ = req("GET","/api/admin/logs")
check("Securite | Admin logs sans auth -> 403", s,b, 403)

s,b,_ = req("GET","/api/admin/alerts")
check("Securite | Admin alerts sans auth -> 403", s,b, 403)

# ── RAPPORT ───────────────────────────────────────────
passed = [r for r in results if r[0]=="PASS"]
failed = [r for r in results if r[0]=="FAIL"]

print("\n" + "="*62)
print("  FULLTEST KOTIZY")
print("="*62)

cats = {}
for r in results:
    cat = r[1].split("|")[0].strip()
    cats.setdefault(cat, []).append(r)

for cat, items in cats.items():
    p = sum(1 for i in items if i[0]=="PASS")
    print(f"\n  [{p}/{len(items)}] {cat}")
    for icon, label, note, body in items:
        name = label.split("|")[1].strip() if "|" in label else label
        mark = "[OK]" if icon=="PASS" else "[KO]"
        print(f"    {mark}  {name}")
        if icon == "FAIL":
            print(f"         => {note}")
            if body.strip():
                print(f"         => {body[:100]}")

print("\n" + "="*62)
print(f"  Score : {len(passed)}/{len(results)} PASS   |   {len(failed)} FAIL")
print("="*62 + "\n")
