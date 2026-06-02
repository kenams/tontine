import "server-only";

const CINETPAY_BASE = process.env.CINETPAY_BASE_URL ?? "https://api.cinetpay.net";

export function isCinetpayConfigured() {
  return Boolean(process.env.CINETPAY_API_KEY?.trim() && process.env.CINETPAY_API_PASSWORD?.trim());
}

// Cache token en mémoire — expire après 4min (token valide 5min côté CinetPay)
let _tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }
  try {
    const res = await fetch(`${CINETPAY_BASE}/v1/oauth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.CINETPAY_API_KEY,
        api_password: process.env.CINETPAY_API_PASSWORD,
      }),
    });
    const data = await res.json() as { code: number; access_token?: string };
    if (data.code === 200 && data.access_token) {
      _tokenCache = { token: data.access_token, expiresAt: Date.now() + 4 * 60 * 1000 };
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export type CinetpayInitParams = {
  txRef: string;
  amountCents: number;
  currency: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone?: string;
  notifyUrl: string;
  successUrl: string;
  failedUrl: string;
  description: string;
};

export type CinetpayInitResult =
  | { ok: true; paymentUrl: string; txRef: string; mustRedirect: boolean; notifyToken?: string }
  | { ok: false; error: string };

export async function initCinetpayPayment(params: CinetpayInitParams): Promise<CinetpayInitResult> {
  if (!isCinetpayConfigured()) return { ok: false, error: "CinetPay non configuré." };

  const token = await getAccessToken();
  if (!token) return { ok: false, error: "Authentification CinetPay échouée." };

  const amount = Math.round(params.amountCents / 100);
  // merchant_transaction_id max 30 chars
  const txRef = params.txRef.slice(0, 30);

  const payload = {
    currency: params.currency.toUpperCase(),
    merchant_transaction_id: txRef,
    amount,
    lang: "fr",
    designation: params.description,
    client_email: params.clientEmail,
    client_first_name: params.clientFirstName,
    client_last_name: params.clientLastName,
    client_phone_number: params.clientPhone ?? "",
    success_url: params.successUrl,
    failed_url: params.failedUrl,
    notify_url: params.notifyUrl,
    direct_pay: false,
  };

  try {
    const res = await fetch(`${CINETPAY_BASE}/v1/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as {
      code: number;
      status: string;
      payment_url?: string;
      notify_token?: string;
      details?: { must_be_redirected?: boolean; message?: string; status?: string };
      message?: string;
    };

    if (data.code !== 200 || !data.payment_url) {
      return { ok: false, error: data.message ?? data.details?.message ?? "Erreur CinetPay." };
    }

    return {
      ok: true,
      paymentUrl: data.payment_url,
      txRef,
      mustRedirect: data.details?.must_be_redirected ?? true,
      notifyToken: data.notify_token,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function isAutoTransferSupported(currency: string): boolean {
  return ["XOF", "XAF", "CDF", "GNF"].includes(currency.toUpperCase());
}

export async function sendCinetpayTransfer(params: {
  txRef: string;
  amountCents: number;
  currency: string;
  phoneNumber: string;
  beneficiaryName: string;
  reason: string;
}): Promise<{ ok: boolean; transferId?: string; error?: string }> {
  if (!isCinetpayConfigured()) return { ok: false, error: "CinetPay non configuré." };
  const token = await getAccessToken();
  if (!token) return { ok: false, error: "Auth CinetPay échouée." };

  const txRef = params.txRef.slice(0, 30);
  try {
    const res = await fetch(`${CINETPAY_BASE}/v1/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        currency: params.currency.toUpperCase(),
        merchant_transaction_id: txRef,
        phone_number: params.phoneNumber,
        amount: Math.round(params.amountCents / 100),
        payment_method: "OM_CI",
        reason: params.reason,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app"}/api/webhooks/cinetpay`,
      }),
    });
    const data = await res.json() as { code: number; status?: string; data?: { transaction_id: string }; message?: string };
    if (data.code !== 200 && data.code !== 100) {
      return { ok: false, error: data.message ?? "Transfert CinetPay échoué." };
    }
    return { ok: true, transferId: data.data?.transaction_id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function verifyCinetpayTransaction(txRef: string): Promise<{
  ok: boolean;
  status?: "SUCCESS" | "FAILED" | "PENDING" | "INITIATED";
  amountCents?: number;
  currency?: string;
  error?: string;
}> {
  if (!isCinetpayConfigured()) return { ok: false, error: "CinetPay non configuré." };

  const token = await getAccessToken();
  if (!token) return { ok: false, error: "Authentification CinetPay échouée." };

  try {
    const res = await fetch(`${CINETPAY_BASE}/v1/payment/${txRef}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as {
      code: number;
      status?: string;
      data?: { status: string; amount: number; currency: string };
      message?: string;
    };

    if (data.code !== 200 || !data.data) {
      return { ok: false, error: data.message ?? "Vérification impossible." };
    }

    const status = (["SUCCESS", "FAILED", "PENDING", "INITIATED"].includes(data.data.status)
      ? data.data.status
      : "FAILED") as "SUCCESS" | "FAILED" | "PENDING" | "INITIATED";

    return {
      ok: true,
      status,
      amountCents: Math.round(data.data.amount * 100),
      currency: data.data.currency,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
