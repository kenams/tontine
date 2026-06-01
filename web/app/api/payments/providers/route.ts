import { NextResponse } from "next/server";
import { isFlutterwaveConfigured } from "@/lib/flutterwave";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  return NextResponse.json({
    stripeCheckoutEnabled: isStripeConfigured(),
    flutterwaveEnabled: isFlutterwaveConfigured(),
    providers: [
      {
        code: "STRIPE",
        name: "Stripe — Carte / Apple Pay / Google Pay",
        status: isStripeConfigured() ? "CONFIGURED" : "TEST_STUB",
        methods: ["card", "apple_pay", "google_pay"],
        currencies: ["EUR", "GBP", "USD"],
      },
      {
        code: "FLUTTERWAVE",
        name: "Flutterwave — Wave / Orange Money / MTN MoMo / M-Pesa",
        status: isFlutterwaveConfigured() ? "CONFIGURED" : "NOT_CONFIGURED",
        methods: ["wave", "orange_money", "mtn_momo", "mpesa"],
        currencies: ["XOF", "GHS", "KES", "UGX", "NGN", "XAF"],
      },
      { code: "WALLET", name: "Wallet Kotizy", status: "CONFIGURED", methods: ["wallet"], currencies: ["*"] },
      { code: "BANK_TRANSFER", name: "Virement SEPA", status: "CONFIGURED", methods: ["sepa"], currencies: ["EUR"] },
    ],
  });
}
