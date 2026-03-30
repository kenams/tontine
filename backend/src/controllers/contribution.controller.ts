import type { Response } from "express";

import { contributionRepository } from "../repositories/contribution.repository";
import type { AuthenticatedRequest } from "../types/api.types";
import { ContributionStatus } from "../types/api.types";
import { DEMO_CONTRIBUTIONS, createDemoId } from "../utils/demo-data";
import { created, success, validationError } from "../utils/response";
import { isPositiveNumber } from "../utils/validators";

/**
 * Retourne les cotisations d'une tontine avec statistiques.
 */
export async function getContributions(req: AuthenticatedRequest, res: Response) {
  const tontineId = String(req.params.id);

  try {
    const contributions = await contributionRepository.findByTontineId(tontineId);
    const stats = await contributionRepository.getMonthlyStats(tontineId);
    return success(res, { contributions, stats });
  } catch {
    const contributions = DEMO_CONTRIBUTIONS.filter((entry) => entry.tontineId === tontineId);
    const totalPaid = contributions
      .filter((entry) => entry.status === ContributionStatus.PAID)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalPending = contributions
      .filter((entry) => entry.status === ContributionStatus.PENDING)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const nextDueDate =
      contributions
        .map((entry) => entry.dueDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

    return success(res, {
      contributions,
      stats: {
        totalPaid,
        totalPending,
        nextDueDate
      }
    });
  }
}

/**
 * Enregistre une cotisation.
 */
export async function makeContribution(req: AuthenticatedRequest, res: Response) {
  const tontineId = String(req.params.id);
  const { amount } = req.body as Record<string, string | number>;

  if (!isPositiveNumber(amount)) {
    return validationError(res, "Le montant de la cotisation est invalide.");
  }

  try {
    const alreadyPaid = req.user?.id
      ? await contributionRepository.hasUserPaidThisMonth(req.user.id, tontineId)
      : false;

    if (alreadyPaid) {
      return validationError(res, "Vous avez deja cotise pour ce mois.");
    }

    const contribution = await contributionRepository.createContribution({
      tontineId,
      userId: req.user?.id ?? "user-001",
      amount: Number(amount),
      dueDate: new Date().toISOString(),
      paidDate: new Date().toISOString(),
      stripePaymentId: "pi_backend_demo",
      status: "PAID"
    });

    return created(res, { contribution }, "Cotisation enregistree");
  } catch {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const alreadyPaid = DEMO_CONTRIBUTIONS.some(
      (entry) =>
        entry.tontineId === tontineId &&
        entry.userId === req.user?.id &&
        entry.status === ContributionStatus.PAID &&
        entry.paidDate?.startsWith(currentMonth)
    );

    if (alreadyPaid) {
      return validationError(res, "Vous avez deja cotise pour ce mois.");
    }

    const contribution = {
      id: createDemoId("contribution"),
      tontineId,
      userId: req.user?.id ?? "user-001",
      amount: Number(amount),
      dueDate: new Date().toISOString(),
      paidDate: new Date().toISOString(),
      stripePaymentId: "pi_demo_new",
      status: ContributionStatus.PAID
    };

    DEMO_CONTRIBUTIONS.unshift(contribution);
    return created(res, { contribution }, "Cotisation enregistree");
  }
}

