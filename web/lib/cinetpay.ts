// CinetPay v2 — Agrégateur Mobile Money Afrique (Wave, Orange Money, MTN, etc.)
// Docs: https://docs.cinetpay.com | Inscription: https://cinetpay.com

const CINETPAY_URL = "https://api-checkout.cinetpay.com/v2/payment";
const CINETPAY_VERIFY_URL = "https://api-checkout.cinetpay.com/v2/payment/verify";

export function isCinetPayConfigured() {
  return Boolean(process.env.CINETPAY_API_KEY?.trim() && process.env.CINETPAY_SITE_ID?.trim());
}

export type CinetPayInitParams = {
  transactionId: string;
  amountCents: number;
  currency: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhone?: string;
  metadata?: string;
};

export type CinetPayResponse = {
  ok: boolean;
  paymentUrl?: string;
  paymentToken?: string;
  error?: string;
};

// Devises supportées par CinetPay
const CINETPAY_CURRENCIES = ["XOF", "XAF", "GNF", "CDF", "KMF", "HTG", "EUR"] as const;

export async function initCinetPayPayment(params: CinetPayInitParams): Promise<CinetPayResponse> {
  const apiKey = process.env.CINETPAY_API_KEY!;
  const siteId = process.env.CINETPAY_SITE_ID!;

  // CinetPay ne supporte pas tous les montants en EUR — minimum 1 EUR
  const amount = Math.round(params.amountCents / 100);
  const currency = CINETPAY_CURRENCIES.includes(params.currency as typeof CINETPAY_CURRENCIES[number])
    ? params.currency
    : "XOF";

  const body = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: params.transactionId,
    amount,
    currency,
    description: params.description,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    customer_name: params.customerName,
    customer_surname: params.customerSurname,
    customer_email: params.customerEmail,
    customer_phone_number: params.customerPhone ?? "",
    customer_city: "N/A",
    customer_country: "CI",
    channels: "MOBILE_MONEY",
    metadata: params.metadata ?? "",
    lang: "fr",
  };

  try {
    const res = await fetch(CINETPAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { code: string; message: string; data?: { payment_url: string; payment_token: string }; description?: string };

    if (data.code === "201" && data.data?.payment_url) {
      return { ok: true, paymentUrl: data.data.payment_url, paymentToken: data.data.payment_token };
    }
    return { ok: false, error: data.description ?? data.message ?? "Erreur CinetPay" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Impossible de contacter CinetPay" };
  }
}

export async function verifyCinetPayPayment(transactionId: string): Promise<{ success: boolean; amount?: number; currency?: string }> {
  const apiKey = process.env.CINETPAY_API_KEY!;
  const siteId = process.env.CINETPAY_SITE_ID!;

  try {
    const res = await fetch(CINETPAY_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: transactionId }),
    });
    const data = await res.json() as { code: string; data?: { status: string; amount: number; currency: string } };
    return {
      success: data.code === "00" && data.data?.status === "ACCEPTED",
      amount: data.data?.amount,
      currency: data.data?.currency,
    };
  } catch {
    return { success: false };
  }
}
