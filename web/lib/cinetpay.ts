import "server-only";

const CINETPAY_BASE = process.env.CINETPAY_BASE_URL ?? "https://api.cinetpay.net";

export function isCinetpayConfigured() {
  return Boolean(process.env.CINETPAY_API_KEY?.trim() && process.env.CINETPAY_API_PASSWORD?.trim());
}

async function getAccessToken(): Promise<string | null> {
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
    return data.code === 200 && data.access_token ? data.access_token : null;
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
