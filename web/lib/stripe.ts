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
  stripeClient ??= new Stripe(stripeSecretKey, { timeout: 10_000, maxNetworkRetries: 1 });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (stripe.checkout.sessions.create as any)({
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
    locale: "fr",
  }) as ReturnType<typeof stripe.checkout.sessions.create>;
}

// Résultat retourné à l'utilisateur pour le virement SEPA
export type SepaTransferInstructions = {
  iban: string;
  bic: string;
  accountHolderName: string;
  reference: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  hostedInstructionsUrl?: string;
};

export async function createSepaBankTransferPaymentIntent(input: {
  user: { id: string; email: string; fullName: string; stripeCustomerId?: string | null };
  walletId: string;
  transactionId: string;
  amountCents: number;
}): Promise<SepaTransferInstructions> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  // Créer ou récupérer le Stripe Customer
  let customerId = input.user.stripeCustomerId ?? "";
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.user.email,
      name: input.user.fullName,
      metadata: { kotizUserId: input.user.id },
    });
    customerId = customer.id;
    // Sauvegarder l'ID Stripe sur le user (caller)
    const { prisma } = await import("@/lib/db");
    await prisma.user.update({ where: { id: input.user.id }, data: { stripeCustomerId: customerId } as never });
  }

  const metadata = {
    type: "WALLET_DEPOSIT_SEPA",
    transactionId: input.transactionId,
    walletId: input.walletId,
    userId: input.user.id,
    currency: "eur",
  };

  const pi = await stripe.paymentIntents.create({
    amount: input.amountCents,
    currency: "eur",
    customer: customerId,
    payment_method_types: ["customer_balance"],
    payment_method_data: { type: "customer_balance" },
    payment_method_options: {
      customer_balance: {
        funding_type: "bank_transfer",
        bank_transfer: {
          type: "eu_bank_transfer",
          eu_bank_transfer: { country: "FR" },
        },
      },
    },
    confirm: true,
    metadata,
  });

  const instructions = (pi.next_action as { display_bank_transfer_instructions?: {
    financial_addresses?: Array<{ iban?: { iban: string; bic: string; account_holder_name: string }; type: string }>;
    reference?: string;
    hosted_instructions_url?: string;
  } })?.display_bank_transfer_instructions;

  const ibanAddress = instructions?.financial_addresses?.find((a) => a.type === "iban")?.iban;
  if (!ibanAddress) throw new Error("IBAN virtuel non disponible — activez bank_transfer sur votre compte Stripe.");

  return {
    iban: ibanAddress.iban,
    bic: ibanAddress.bic,
    accountHolderName: ibanAddress.account_holder_name,
    reference: instructions?.reference ?? input.transactionId.slice(0, 12).toUpperCase(),
    amount: input.amountCents / 100,
    currency: "EUR",
    paymentIntentId: pi.id,
    hostedInstructionsUrl: instructions?.hosted_instructions_url,
  };
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (stripe.checkout.sessions.create as any)({
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
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    locale: "fr",
  }) as ReturnType<typeof stripe.checkout.sessions.create>;
}
