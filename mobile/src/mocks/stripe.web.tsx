// Web stub for @stripe/stripe-react-native
import type { ReactNode } from "react";

export function StripeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useStripe() {
  return {
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
    confirmPayment: async () => ({ error: null, paymentIntent: null }),
    createToken: async () => ({ error: null, token: null }),
  };
}
