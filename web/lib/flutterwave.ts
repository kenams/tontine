import "server-only";

const FLW_API = "https://api.flutterwave.com/v3";

export function isFlutterwaveConfigured() {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY?.trim());
}

export type FlwInitParams = {
  txRef: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  redirectUrl: string;
  description: string;
  meta?: Record<string, string>;
};

export type FlwInitResult =
  | { ok: true; paymentLink: string; txRef: string }
  | { ok: false; error: string };

// Currencies supportées par Flutterwave Mobile Money (hors EUR/USD géré par Stripe)
const MOBILE_MONEY_CURRENCIES = ["XOF", "GHS", "UGX", "RWF", "ZMW", "TZS", "KES", "NGN", "XAF"];

export function flwMobileMoneyType(currency: string): string {
  const map: Record<string, string> = {
    XOF: "mobilemoneyfrancoabophone", // Wave, Orange Money, MTN (CI, SN, ML, BF, TG, BJ)
    XAF: "mobilemoneyfrancoabophone", // Orange Money, MTN (CM, CG, GA)
    GHS: "mobilemoneyghana",          // MTN GH, Vodafone GH, AirtelTigo
    UGX: "mobilemoneyuganda",         // MTN UG, Airtel UG
    RWF: "mobilemoneyrwanda",         // MTN RW
    ZMW: "mobilemoneyzambia",         // MTN ZM, Airtel ZM
    TZS: "mobilemoneytanzania",       // Airtel TZ, Tigo TZ
    KES: "mpesa",                     // M-Pesa Kenya
    NGN: "ussd",                      // USSD Nigeria
  };
  return map[currency] ?? "card";
}

export function isMobileMoneySupported(currency: string): boolean {
  return MOBILE_MONEY_CURRENCIES.includes(currency);
}

// Initialiser un paiement Flutterwave (hosted checkout)
export async function initFlutterwavePayment(params: FlwInitParams): Promise<FlwInitResult> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return { ok: false, error: "Flutterwave non configuré." };

  const currency = params.currency.toUpperCase();
  const amount = params.amountCents / 100;

  const payload: Record<string, unknown> = {
    tx_ref: params.txRef,
    amount,
    currency,
    redirect_url: params.redirectUrl,
    customer: {
      email: params.customerEmail,
      name: params.customerName,
      ...(params.customerPhone ? { phonenumber: params.customerPhone } : {}),
    },
    customizations: {
      title: "Kotizy Wallet",
      description: params.description,
      logo: "https://tontineapp-web.vercel.app/icon-512.png",
    },
    meta: params.meta ?? {},
  };

  // Pour les devises Mobile Money, préselectionner le type
  if (isMobileMoneySupported(currency)) {
    payload.payment_options = flwMobileMoneyType(currency);
  }

  try {
    const res = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as { status: string; data?: { link: string }; message?: string };
    if (data.status !== "success" || !data.data?.link) {
      return { ok: false, error: data.message ?? "Erreur Flutterwave." };
    }
    return { ok: true, paymentLink: data.data.link, txRef: params.txRef };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Vérifier une transaction après redirection
export async function verifyFlutterwaveTransaction(transactionId: string): Promise<{
  ok: boolean;
  status?: "successful" | "failed" | "pending";
  amountCents?: number;
  currency?: string;
  txRef?: string;
  error?: string;
}> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return { ok: false, error: "Flutterwave non configuré." };

  try {
    const res = await fetch(`${FLW_API}/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await res.json() as {
      status: string;
      data?: { status: string; amount: number; currency: string; tx_ref: string; charged_amount: number };
      message?: string;
    };
    if (data.status !== "success" || !data.data) {
      return { ok: false, error: data.message ?? "Vérification impossible." };
    }
    return {
      ok: true,
      status: data.data.status as "successful" | "failed" | "pending",
      amountCents: Math.round(data.data.charged_amount * 100),
      currency: data.data.currency,
      txRef: data.data.tx_ref,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Vérifier la signature webhook Flutterwave
export function verifyFlwWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secret) return false;
  // Flutterwave envoie le secret en clair dans verif-hash
  return signature === secret;
}
