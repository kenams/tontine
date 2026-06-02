import "server-only";

const CINETPAY_API = "https://api-checkout.cinetpay.com/v2";

export function isCinetpayConfigured() {
  return Boolean(process.env.CINETPAY_API_KEY?.trim() && process.env.CINETPAY_SITE_ID?.trim());
}

export type CinetpayInitParams = {
  txRef: string;
  amountCents: number;
  currency: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhone?: string;
  notifyUrl: string;
  returnUrl: string;
  description: string;
};

export type CinetpayInitResult =
  | { ok: true; paymentUrl: string; txRef: string }
  | { ok: false; error: string };

const SUPPORTED_CURRENCIES = ["XOF", "XAF", "CDF", "GNF"];

export function isCinetpayCurrencySupported(currency: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
}

export async function initCinetpayPayment(params: CinetpayInitParams): Promise<CinetpayInitResult> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) return { ok: false, error: "CinetPay non configuré." };

  const currency = params.currency.toUpperCase();
  const amount = Math.round(params.amountCents / 100);

  const payload = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: params.txRef,
    amount,
    currency,
    alternative_currency: "",
    description: params.description,
    customer_id: params.customerEmail,
    customer_name: params.customerName,
    customer_surname: params.customerSurname,
    customer_email: params.customerEmail,
    customer_phone_number: params.customerPhone ?? "",
    customer_address: "",
    customer_city: "",
    customer_country: "CI",
    customer_state: "CI",
    customer_zip_code: "",
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    channels: "ALL",
    metadata: "",
    lang: "fr",
    invoice_data: {},
  };

  try {
    const res = await fetch(`${CINETPAY_API}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as {
      code: string;
      message: string;
      data?: { payment_url: string };
      description?: string;
    };

    if (data.code !== "201" || !data.data?.payment_url) {
      return { ok: false, error: data.message ?? data.description ?? "Erreur CinetPay." };
    }
    return { ok: true, paymentUrl: data.data.payment_url, txRef: params.txRef };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function verifyCinetpayTransaction(txRef: string): Promise<{
  ok: boolean;
  status?: "ACCEPTED" | "REFUSED" | "PENDING";
  amountCents?: number;
  currency?: string;
  error?: string;
}> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) return { ok: false, error: "CinetPay non configuré." };

  try {
    const res = await fetch(`${CINETPAY_API}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: txRef }),
    });
    const data = await res.json() as {
      code: string;
      message: string;
      data?: { status: string; amount: number; currency: string };
    };

    if (data.code !== "00" || !data.data) {
      return { ok: false, error: data.message ?? "Vérification impossible." };
    }

    const status = data.data.status === "ACCEPTED"
      ? "ACCEPTED"
      : data.data.status === "REFUSED"
        ? "REFUSED"
        : "PENDING";

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
