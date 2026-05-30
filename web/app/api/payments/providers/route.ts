import { NextResponse } from "next/server";
import { isCinetPayConfigured } from "@/lib/cinetpay";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  const stripeStatus = isStripeConfigured() ? "CONFIGURED" : "TEST_STUB";
  const cinetpayStatus = isCinetPayConfigured() ? "CONFIGURED" : "NOT_CONFIGURED";
  return NextResponse.json({
    stripeCheckoutEnabled: isStripeConfigured(),
    cinetpayEnabled: isCinetPayConfigured(),
    providers: [
      { code: "STRIPE",        name: "Stripe — Carte / Apple Pay / Google Pay", status: stripeStatus, native: true },
      { code: "CINETPAY",      name: "CinetPay — Wave / Orange Money / MTN MoMo", status: cinetpayStatus },
      { code: "WALLET",        name: "Wallet Kotizy",    status: "CONFIGURED" },
      { code: "BANK_TRANSFER", name: "Virement SEPA",    status: "CONFIGURED" },
    ]
  });
}
