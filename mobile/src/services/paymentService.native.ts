import { initPaymentSheet, presentPaymentSheet, initStripe } from "@stripe/stripe-react-native";

import { STRIPE_PUBLISHABLE_KEY } from "../config/constants";
import { apiCall } from "./api";

type CreateIntentPayload = {
  clientSecret: string;
  paymentIntentId: string;
  demo?: boolean;
};

type ProcessPaymentResult = {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
};

/**
 * Cree un PaymentIntent via le backend.
 */
export async function initializePayment(tontineId: string, amount: number): Promise<CreateIntentPayload> {
  return apiCall<CreateIntentPayload>("post", "/api/payments/create-intent", {
    tontineId,
    amount
  });
}

/**
 * Lance le flow Stripe natif si la cle est disponible.
 */
export async function processPayment(
  clientSecret: string,
  paymentIntentId: string
): Promise<ProcessPaymentResult> {
  if (!STRIPE_PUBLISHABLE_KEY || clientSecret === "demo_client_secret") {
    return {
      success: true,
      paymentIntentId
    };
  }

  await initStripe({
    publishableKey: STRIPE_PUBLISHABLE_KEY
  });

  const initResult = await initPaymentSheet({
    merchantDisplayName: "TontineApp",
    paymentIntentClientSecret: clientSecret
  });

  if (initResult.error) {
    return {
      success: false,
      error: initResult.error.message
    };
  }

  const presentResult = await presentPaymentSheet();

  if (presentResult.error) {
    return {
      success: false,
      error: presentResult.error.message
    };
  }

  return {
    success: true,
    paymentIntentId
  };
}

/**
 * Confirme le paiement cote backend.
 */
export async function confirmPayment(paymentIntentId: string, tontineId: string, amount: number) {
  return apiCall<{ contribution: unknown; demo?: boolean }>("post", "/api/payments/confirm", {
    paymentIntentId,
    tontineId,
    amount
  });
}

