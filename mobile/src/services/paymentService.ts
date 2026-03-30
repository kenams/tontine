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
 * Version web/fallback: simule un paiement reussi.
 */
export async function processPayment(
  _clientSecret: string,
  paymentIntentId: string
): Promise<ProcessPaymentResult> {
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

