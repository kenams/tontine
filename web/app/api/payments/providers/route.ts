import { NextResponse } from "next/server";

import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  const stripeStatus = isStripeConfigured() ? "CONFIGURED" : "TEST_STUB";

  return NextResponse.json({
    mode: "test",
    stripeCheckoutEnabled: isStripeConfigured(),
    stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    providers: [
      { code: "STRIPE", name: "Stripe Checkout", status: stripeStatus, checkout: true },
      { code: "ORANGE_MONEY", name: "Orange Money", status: "TEST_STUB" },
      { code: "MTN_MOMO", name: "MTN MoMo", status: "TEST_STUB" },
      { code: "WAVE", name: "Wave", status: "TEST_STUB" },
      { code: "FLUTTERWAVE", name: "Flutterwave", status: process.env.FLUTTERWAVE_SECRET_KEY ? "CONFIGURED" : "TEST_STUB" },
      { code: "CARD_GLOBAL", name: "Carte bancaire internationale / Apple Pay / Google Pay", status: stripeStatus, checkout: true },
      { code: "BANK_TRANSFER", name: "Virement SEPA / ACH / SWIFT", status: "TEST_STUB" }
    ]
  });
}
