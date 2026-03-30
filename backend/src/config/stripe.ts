import Stripe from "stripe";

import { config } from "./index";

export const isStripeConfigured = Boolean(config.stripe.secretKey);

export const stripe = new Stripe(config.stripe.secretKey || "sk_test_placeholder", {
  appInfo: {
    name: "TontineApp"
  }
});

/**
 * Vérifie si Stripe est joignable avec la clé courante.
 */
export async function checkStripeConnection(): Promise<boolean> {
  if (!isStripeConfigured) {
    console.log("⚠️ Stripe indisponible");
    return false;
  }

  try {
    await stripe.balance.retrieve();
    console.log("✅ Stripe connecté (mode test)");
    return true;
  } catch {
    console.log("⚠️ Stripe indisponible");
    return false;
  }
}
