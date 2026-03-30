import type { Request, Response } from "express";

import { config } from "../config";
import { isStripeConfigured } from "../config/stripe";
import { contributionRepository } from "../repositories/contribution.repository";
import { userRepository } from "../repositories/user.repository";
import {
  confirmContribution,
  createCustomer,
  createPaymentIntent,
  handleWebhook,
  registerConfirmedContribution
} from "../services/stripe.service";
import type { AuthenticatedRequest } from "../types/api.types";
import { ContributionStatus } from "../types/api.types";
import { DEMO_CONTRIBUTIONS, createDemoId } from "../utils/demo-data";
import { created, error, success, validationError } from "../utils/response";

/**
 * Initialise un paiement Stripe ou renvoie un secret de demo.
 */
export async function createIntent(req: AuthenticatedRequest, res: Response) {
  const { tontineId, amount } = req.body as { tontineId?: string; amount?: number };

  if (!tontineId || !amount || amount <= 0) {
    return validationError(res, "Le tontineId et le montant sont requis.");
  }

  if (!isStripeConfigured) {
    return success(
      res,
      {
        clientSecret: "demo_client_secret",
        paymentIntentId: `pi_demo_${Date.now()}`,
        demo: true
      },
      "Mode demo Stripe actif"
    );
  }

  try {
    const user = req.user ? await userRepository.findBySupabaseId(req.user.id) : null;

    if (!user) {
      return error(res, "Utilisateur introuvable pour le paiement.", "NOT_FOUND", 404);
    }

    const customerId =
      user.stripeCustomerId ?? (await createCustomer(user.email, user.fullName, user.id));
    const payment = await createPaymentIntent(amount, customerId, tontineId);

    return success(res, payment, "Intent de paiement cree");
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Erreur Stripe";
    return error(res, message, "STRIPE_ERROR", 500);
  }
}

/**
 * Confirme le paiement et enregistre la cotisation.
 */
export async function confirmPayment(req: AuthenticatedRequest, res: Response) {
  const { paymentIntentId, tontineId, amount } = req.body as {
    paymentIntentId?: string;
    tontineId?: string;
    amount?: number;
  };

  if (!paymentIntentId || !tontineId || !amount) {
    return validationError(res, "paymentIntentId, tontineId et amount sont requis.");
  }

  try {
    if (!isStripeConfigured) {
      const contribution = {
        id: createDemoId("contribution"),
        tontineId,
        userId: req.user?.id ?? "user-001",
        amount,
        dueDate: new Date().toISOString(),
        paidDate: new Date().toISOString(),
        stripePaymentId: paymentIntentId,
        status: ContributionStatus.PAID
      };

      DEMO_CONTRIBUTIONS.unshift(contribution);

      return created(res, { contribution, demo: true }, "Paiement simule confirme");
    }

    const confirmed = await confirmContribution(paymentIntentId);

    if (!confirmed) {
      return error(res, "Le paiement n'a pas encore ete confirme.", "PAYMENT_PENDING", 409);
    }

    const contribution = await registerConfirmedContribution(
      req.user?.id ?? "user-001",
      tontineId,
      amount,
      paymentIntentId
    );

    return created(res, { contribution }, "Paiement confirme");
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Erreur de confirmation";
    return error(res, message, "PAYMENT_ERROR", 500);
  }
}

/**
 * Recoit les webhooks Stripe.
 */
export async function paymentWebhook(req: Request, res: Response) {
  if (!isStripeConfigured || !config.stripe.webhookSecret) {
    return success(res, null, "Webhook ignore en mode demo");
  }

  const signature = req.headers["stripe-signature"];

  if (!signature || Array.isArray(signature)) {
    return validationError(res, "Signature Stripe manquante.");
  }

  try {
    const event = handleWebhook(req.body as Buffer, signature, config.stripe.webhookSecret);
    return success(res, { received: true, eventType: event.type }, "Webhook traite");
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Webhook invalide";
    return error(res, message, "WEBHOOK_ERROR", 400);
  }
}

/**
 * Retourne l'historique des paiements de l'utilisateur.
 */
export async function paymentHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const contributions = req.user
      ? await contributionRepository.findByUserId(req.user.id)
      : [];

    return success(res, { contributions });
  } catch {
    const contributions = DEMO_CONTRIBUTIONS.filter(
      (contribution) => contribution.userId === (req.user?.id ?? "user-001")
    );

    return success(res, { contributions });
  }
}
