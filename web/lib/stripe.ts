import "server-only";

import type { NextRequest } from "next/server";
import Stripe from "stripe";

type CheckoutGroup = {
  id: string;
  name: string;
  description: string;
  contributionCents: number;
  currency: string;
};

type CheckoutUser = {
  id: string;
  email: string;
  fullName: string;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(stripeSecretKey);
}

export function getStripe() {
  if (!stripeSecretKey) return null;
  stripeClient ??= new Stripe(stripeSecretKey);
  return stripeClient;
}

export function isStripeCheckoutProvider(provider: string) {
  return provider === "STRIPE" || provider === "CARD_GLOBAL";
}

function requestOrigin(request: NextRequest) {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return `${protocol}://${host}`;
}

export async function createContributionCheckoutSession(input: {
  request: NextRequest;
  group: CheckoutGroup;
  user: CheckoutUser;
  provider: string;
  transactionId: string;
  contributionId: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const origin = requestOrigin(input.request);
  const successUrl = `${origin}/tontines/${input.group.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/tontines/${input.group.id}?payment=cancelled`;
  const metadata = {
    transactionId: input.transactionId,
    contributionId: input.contributionId,
    tontineGroupId: input.group.id,
    userId: input.user.id,
    provider: input.provider,
    currency: input.group.currency
  };

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.user.email,
    client_reference_id: input.transactionId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.group.currency.toLowerCase(),
          unit_amount: input.group.contributionCents,
          product_data: {
            name: `Cotisation ${input.group.name}`,
            description: input.group.description.slice(0, 500),
            metadata: {
              tontineGroupId: input.group.id,
              product: "tontine_contribution"
            }
          }
        }
      }
    ],
    metadata,
    payment_intent_data: { metadata }
  });
}
