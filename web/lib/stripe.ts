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

const STRIPE_SUPPORTED_CURRENCIES = new Set([
  "usd","eur","gbp","cad","aud","jpy","chf","sek","nok","dkk","nzd","sgd","hkd","mxn",
  "brl","inr","pln","czk","ron","huf","bgn","hrk","mad","aed","zar","ngn","ghs","kes"
]);

export function stripeDepositCurrency(walletCurrency: string): string {
  const c = walletCurrency.toLowerCase();
  return STRIPE_SUPPORTED_CURRENCIES.has(c) ? c : "eur";
}

export async function createWalletDepositCheckoutSession(input: {
  request: NextRequest;
  user: CheckoutUser;
  walletId: string;
  transactionId: string;
  amountCents: number;
  currency: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const origin = requestOrigin(input.request);
  const successUrl = `${origin}/wallet?deposit=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/wallet/deposit?cancelled=1`;
  const metadata = {
    type: "WALLET_DEPOSIT",
    transactionId: input.transactionId,
    walletId: input.walletId,
    userId: input.user.id,
    currency: input.currency,
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
          currency: input.currency,
          unit_amount: input.amountCents,
          product_data: {
            name: "Recharge Kotizy Wallet",
            description: `Crédit de ${(input.amountCents / 100).toFixed(2)} ${input.currency.toUpperCase()} sur votre wallet Kotizy`,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
  });
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
