import { stripe } from "../config/stripe";
import { contributionRepository } from "../repositories/contribution.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { userRepository } from "../repositories/user.repository";

/**
 * Cree un client Stripe et sauvegarde son identifiant si un userId est fourni.
 */
export async function createCustomer(email: string, name: string, userId?: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name
  });

  if (userId) {
    await userRepository.updateStripeCustomerId(userId, customer.id);
  }

  return customer.id;
}

/**
 * Cree un PaymentIntent pour une cotisation.
 */
export async function createPaymentIntent(amount: number, customerId: string, tontineId: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "eur",
    customer: customerId,
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      tontineId,
      type: "contribution"
    }
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
}

/**
 * Confirme qu'un PaymentIntent est bien reussi.
 */
export async function confirmContribution(paymentIntentId: string): Promise<boolean> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent.status === "succeeded";
}

/**
 * Cree un transfert Stripe vers le beneficiaire.
 */
export async function createTransfer(amount: number, beneficiaryStripeId: string, tontineId: string) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: "eur",
    destination: beneficiaryStripeId,
    metadata: {
      tontineId,
      type: "distribution"
    }
  });

  return transfer.id;
}

/**
 * Enregistre une contribution validee et cree une notification associee.
 */
export async function registerConfirmedContribution(
  userId: string,
  tontineId: string,
  amount: number,
  paymentIntentId: string
) {
  const contribution = await contributionRepository.createContribution({
    tontineId,
    userId,
    amount,
    dueDate: new Date().toISOString(),
    paidDate: new Date().toISOString(),
    stripePaymentId: paymentIntentId,
    status: "PAID"
  });

  await notificationRepository.createNotification({
    userId,
    title: "Paiement confirme",
    body: `Votre cotisation de ${amount} EUR a ete enregistree.`,
    type: "payment_confirmed",
    read: false
  });

  return contribution;
}

/**
 * Construit l'evenement Stripe recu via webhook.
 */
export function handleWebhook(payload: Buffer, signature: string, webhookSecret: string) {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

