import { Platform } from "react-native";

type StripeHook = {
  initPaymentSheet: (params: object) => Promise<{ error: { message: string } | null }>;
  presentPaymentSheet: () => Promise<{ error: { message: string; code: string } | null }>;
};

const webStub: StripeHook = {
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
};

export function useStripeCompat(): StripeHook {
  if (Platform.OS === "web") return webStub;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useStripe } = require("@stripe/stripe-react-native");
  return useStripe();
}
