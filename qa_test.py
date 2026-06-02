import urllib.request, json, ssl, sys

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
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            text = r.read().decode()
            try: return r.status, json.loads(text)
            except: return r.status, text
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}

def p(name, status, cond=True, detail=''):
    icon = 'OK' if (status in [200,201] and cond) else 'FAIL'
    print(f"{name}: {icon} [{status}] {detail}")

# ── AUTH ────────────────────────────────────────────────────────
print("=== AUTH ===")
s,r = api('POST','/api/auth/login',{'email':'kenams42@gmail.com','password':'Kotizy@2026!'})
AT = r.get('token','') if isinstance(r,dict) else ''
p('LOGIN_ADMIN', s, bool(AT))

s,r = api('POST','/api/auth/register',{'email':'testqa1@kotizy.app','password':'TestQA1234!','fullName':'Alice Diallo','currency':'EUR'})
UT = r.get('token','') if isinstance(r,dict) else ''
if not UT:
    s,r = api('POST','/api/auth/login',{'email':'testqa1@kotizy.app','password':'TestQA1234!'})
    UT = r.get('token','') if isinstance(r,dict) else ''
p('REGISTER+LOGIN_USER1', s, bool(UT))

s,r = api('POST','/api/auth/register',{'email':'testqa2@kotizy.app','password':'TestQA1234!','fullName':'Bob Kone','currency':'EUR'})
UT2 = r.get('token','') if isinstance(r,dict) else ''
if not UT2:
    s,r = api('POST','/api/auth/login',{'email':'testqa2@kotizy.app','password':'TestQA1234!'})
    UT2 = r.get('token','') if isinstance(r,dict) else ''
p('REGISTER+LOGIN_USER2', s, bool(UT2))

s,r = api('POST','/api/auth/register',{'email':'testqa3@kotizy.app','password':'TestQA1234!','fullName':'Clara Mensah','currency':'EUR'})
UT3 = r.get('token','') if isinstance(r,dict) else ''
if not UT3:
    s,r = api('POST','/api/auth/login',{'email':'testqa3@kotizy.app','password':'TestQA1234!'})
    UT3 = r.get('token','') if isinstance(r,dict) else ''
p('REGISTER+LOGIN_USER3', s, bool(UT3))

s,r = api('POST','/api/auth/forgot-password',{'email':'testqa1@kotizy.app'})
p('FORGOT_PASSWORD', s)

# ── DASHBOARD ──────────────────────────────────────────────────
print("\n=== DASHBOARD ===")
s,r = api('GET','/api/user/dashboard',token=UT)
wallet = r.get('user',{}).get('wallet',{}).get('balanceCents',0) if isinstance(r,dict) else 0
p('DASHBOARD', s, detail=f'wallet={wallet/100}EUR')

s,r = api('GET','/api/user/dashboard',token=UT2)
p('DASHBOARD_USER2', s)

# ── TONTINES ──────────────────────────────────────────────────
print("\n=== TONTINES ===")
s,r = api('POST','/api/tontines',{
    'name':'Cercle QA Test','description':'Simulation QA complète - 50EUR/mois - 5 membres',
    'contributionAmount':50,'currency':'EUR','frequency':'MONTHLY','maxMembers':5,
    'rules':'Payer avant le 5 du mois. Exclusion apres 30j de retard.'
}, token=UT)
TID = r.get('group',{}).get('id','') if isinstance(r,dict) else ''
TCODE = r.get('group',{}).get('joinCode','') if isinstance(r,dict) else ''
err = r.get('error','') if isinstance(r,dict) else str(r)[:40]
p('CREATE_TONTINE', s, bool(TID), f'id={TID[:10]} code={TCODE} err={err[:40]}')

s,r = api('GET','/api/tontines',token=UT)
tlist = r if isinstance(r,list) else r.get('tontines',[]) if isinstance(r,dict) else []
p('LIST_TONTINES', s, detail=f'count={len(tlist)}')

if TID:
    s,r = api('GET',f'/api/tontines/{TID}',token=UT)
    name = r.get('group',{}).get('name','?') if isinstance(r,dict) else '?'
    p('TONTINE_DETAIL', s, detail=f'name={name}')

if UT2 and TCODE:
    s,r = api('POST','/api/tontines/join',{'joinCode':TCODE},token=UT2)
    p('JOIN_TONTINE_USER2', s, detail=str(r)[:50] if s!=200 else 'joined')

if UT3 and TCODE:
    s,r = api('POST','/api/tontines/join',{'joinCode':TCODE},token=UT3)
    p('JOIN_TONTINE_USER3', s, detail=str(r)[:50] if s!=200 else 'joined')

if TID:
    s,r = api('PATCH',f'/api/tontines/{TID}/settings',{
        'minTrustScore':0,'requireFullPayment':False,'autoExcludeDays':30,
        'latePenaltyCents':0,'emergencyFundBps':500
    }, token=UT)
    p('TONTINE_SETTINGS', s, detail=str(r)[:50] if s!=200 else 'ok')

if TID:
    s,r = api('PATCH',f'/api/tontines/{TID}/autopay',{'enabled':True},token=UT)
    p('AUTOPAY_TOGGLE', s, detail=str(r)[:50] if s!=200 else 'enabled')

if TID:
    s,r = api('POST',f'/api/tontines/{TID}/invite',{'email':'testqa4@kotizy.app'},token=UT)
    p('INVITE_MEMBER', s, detail=str(r)[:50] if s!=200 else 'invited')

# ── WALLET ────────────────────────────────────────────────────
print("\n=== WALLET ===")
s,r = api('POST','/api/wallet/deposit',{'amountCents':5000},token=UT)
hasUrl = bool(r.get('checkoutUrl')) if isinstance(r,dict) else False
p('WALLET_DEPOSIT_STRIPE', s, hasUrl, f'url={hasUrl}')

s,r = api('POST','/api/wallet/deposit/cinetpay',{'amountCents':5000,'phoneNumber':'+2250700000001'},token=UT)
p('WALLET_DEPOSIT_MOBILE_MONEY', s, detail=str(r)[:60])

# Withdraw without funds (should fail with meaningful error)
s,r = api('POST','/api/wallet/withdraw',{'amountCents':1000,'iban':'FR7630006000011234567890189','beneficiary':'Alice Diallo'},token=UT)
err = r.get('error','') if isinstance(r,dict) else ''
p('WALLET_WITHDRAW_NO_FUNDS', s, detail=f'err={err[:50]}' if s!=200 else 'OK-unexpected')

# ── CONTRIBUTE ───────────────────────────────────────────────
print("\n=== CONTRIBUTE ===")
if TID:
    s,r = api('POST',f'/api/tontines/{TID}/contribute',{'provider':'WALLET'},token=UT)
    err = r.get('error','') if isinstance(r,dict) else ''
    p('CONTRIBUTE_WALLET', s, detail=f'{err[:50]}' if s!=200 else 'ok')

if TID:
    s,r = api('POST',f'/api/tontines/{TID}/contribute',{'provider':'STRIPE'},token=UT2)
    hasUrl = bool(r.get('checkoutUrl')) if isinstance(r,dict) else False
    p('CONTRIBUTE_STRIPE_USER2', s, detail=f'url={hasUrl}')

# ── NOTIFICATIONS ──────────────────────────────────────────
print("\n=== NOTIFICATIONS ===")
s,r = api('GET','/api/notifications',token=UT)
notifs = r.get('notifications',[]) if isinstance(r,dict) else []
p('GET_NOTIFICATIONS', s, detail=f'count={len(notifs)}')

s,r = api('POST','/api/notifications/read',{},token=UT)
p('MARK_ALL_READ', s)

# ── PUSH NOTIFICATIONS ────────────────────────────────────
print("\n=== PUSH ===")
s,r = api('POST','/api/push/expo',{'token':'ExponentPushToken[QATestToken123456789]'},token=UT)
err = r.get('error','') if isinstance(r,dict) else ''
p('PUSH_EXPO_REGISTER', s, detail=f'err={err[:50]}' if s!=200 else 'registered')

# Web push - VAPID
s,r = api('POST','/api/push',{
    'endpoint':'https://fcm.googleapis.com/fcm/send/qa_test_endpoint',
    'p256dh':'BNcRdreALRFXTkOOUHK1EtK2wtBYoREbyaFNg5Jh3hIzqRNNcAHlK8Bom6pDaiqHzqALPYFhqXbv0RdtMz9Pb2I=',
    'auth':'tBHItJI5svbpez7KI4CCXg=='
},token=UT)
err = r.get('error','') if isinstance(r,dict) else ''
p('PUSH_WEB_VAPID', s, detail=f'err={err[:50]}' if s!=200 else 'registered')

s,r = api('DELETE','/api/push',token=UT)
p('PUSH_UNREGISTER', s)

# ── KYC ───────────────────────────────────────────────────
print("\n=== KYC ===")
s,r = api('GET','/api/kyc/status',token=UT)
kstatus = r.get('kycStatus','?') if isinstance(r,dict) else '?'
p('KYC_STATUS', s, detail=f'status={kstatus}')

# ── REFERRAL ───────────────────────────────────────────────
print("\n=== REFERRAL ===")
s,r = api('GET','/api/referral',token=UT)
code = r.get('code','?') if isinstance(r,dict) else '?'
stats = r.get('stats',{}) if isinstance(r,dict) else {}
p('GET_REFERRAL', s, detail=f'code={code} stats={stats}')

# ── MARKETPLACE ────────────────────────────────────────────
print("\n=== MARKETPLACE ===")
s,r = api('GET','/api/tontines/public',token=UT)
p('MARKETPLACE', s)

# ── PROFILE ───────────────────────────────────────────────
print("\n=== PROFILE ===")
s,r = api('PATCH','/api/user/profile',{'fullName':'Alice Diallo QA','phone':'+33612345678'},token=UT)
p('EDIT_PROFILE', s, detail=str(r)[:50] if s!=200 else 'updated')

# RGPD export
s,r = api('GET','/api/user/delete',token=UT)
p('RGPD_EXPORT', s, detail=f'type={type(r).__name__}')

# ── SECURITY CHECKS ───────────────────────────────────────
print("\n=== SECURITY ===")
# passwordHash should NOT appear in API responses
s,r = api('GET','/api/admin/stats',token=AT)
has_pwd = 'passwordHash' in json.dumps(r) if isinstance(r,dict) else False
p('ADMIN_STATS_NO_PWD_LEAK', s, not has_pwd, detail='LEAK!' if has_pwd else 'clean')

# Cron must be blocked
s,r = api('POST','/api/cron/advance-rounds')
p('CRON_BLOCKED_UNAUTH', 401 if s==401 else s, s==401, detail='blocked' if s==401 else f'OPEN! got {s}')

# Webhook must require secret
s,r = api('POST','/api/payments/stripe/webhook',{'test':'data'})
p('WEBHOOK_REQUIRES_SECRET', s, s not in [200,201], detail=f'status={s}')

# ── ADMIN ─────────────────────────────────────────────────
print("\n=== ADMIN ===")
s,r = api('GET','/api/admin/stats',token=AT)
p('ADMIN_STATS', s)

s,r = api('GET','/api/admin/users',token=AT)
p('ADMIN_USERS', s, detail=f'type={type(r).__name__}')

# Leave group cleanup
if UT2 and TID:
    s,r = api('POST',f'/api/tontines/{TID}/leave',{'reason':'QA cleanup'},token=UT2)
    p('LEAVE_GROUP_CLEANUP', s, detail=str(r)[:50] if s!=200 else 'left')

print("\n=== SUMMARY ===")
print(f"TID={TID}")
print(f"TCODE={TCODE}")
print(f"UT={UT[:20] if UT else 'MISSING'}")
