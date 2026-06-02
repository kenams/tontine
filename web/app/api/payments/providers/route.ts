import { NextResponse } from "next/server";
import { isFlutterwaveConfigured } from "@/lib/flutterwave";
import { isStripeConfigured } from "@/lib/stripe";
import { isCinetpayConfigured } from "@/lib/cinetpay";

export async function GET() {
  return NextResponse.json({
    stripeCheckoutEnabled: isStripeConfigured(),
    flutterwaveEnabled: isFlutterwaveConfigured(),
    cinetpayEnabled: isCinetpayConfigured(),
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
      {
        code: "CINETPAY",
        name: "CinetPay — Orange Money / MTN / Wave / Moov",
        status: isCinetpayConfigured() ? "CONFIGURED" : "NOT_CONFIGURED",
        methods: ["orange_money", "mtn_momo", "wave", "moov"],
        currencies: ["XOF", "XAF", "CDF", "GNF"],
      },
      { code: "WALLET", name: "Wallet Kotizy", status: "CONFIGURED", methods: ["wallet"], currencies: ["*"] },
    ],
  });
}
