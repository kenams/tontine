import type { Response } from "express";

import { memberRepository } from "../repositories/member.repository";
import { tontineRepository } from "../repositories/tontine.repository";
import type { AuthenticatedRequest, DemoTontine } from "../types/api.types";
import { ContributionStatus, Frequency, TontineStatus } from "../types/api.types";
import {
  DEMO_CONTRIBUTIONS,
  DEMO_DISTRIBUTIONS,
  DEMO_MEMBERS,
  DEMO_TONTINES,
  createDemoId,
  findDemoUser
} from "../utils/demo-data";
import { created, forbidden, notFound, success, validationError } from "../utils/response";
import { isPositiveNumber, isValidDate, validateRequired } from "../utils/validators";

/**
 * Retourne les tontines de l'utilisateur depuis Supabase ou en mode demo.
 */
export async function getMyTontines(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.id) {
      const tontines = await tontineRepository.findByUserId(req.user.id);
      return success(res, { tontines });
    }
  } catch {
    // Fallback demo plus bas.
  }

  const userId = req.user?.id;
  const tontines = DEMO_TONTINES.filter(
    (tontine) =>
      tontine.createdBy === userId ||
      DEMO_MEMBERS.some((member) => member.tontineId === tontine.id && member.userId === userId)
  ).map((tontine) => {
    const members = DEMO_MEMBERS.filter((member) => member.tontineId === tontine.id);
    const paidMembers = DEMO_CONTRIBUTIONS.filter(
      (contribution) =>
        contribution.tontineId === tontine.id && contribution.status === ContributionStatus.PAID
    ).length;

    return {
      ...tontine,
      membersCount: members.length,
      progression: {
        paidMembers,
        totalMembers: tontine.maxMembers
      }
    };
  });

  return success(res, { tontines });
}

/**
 * Cree une tontine via Supabase ou en demo.
 */
export async function createTontine(req: AuthenticatedRequest, res: Response) {
  const { name, amount, frequency, maxMembers, startDate, description } = req.body as Record<string, string | number>;
  const missingFields = validateRequired({ name, amount, frequency, maxMembers, startDate });

  if (missingFields.length > 0) {
    return validationError(res, `Champs requis: ${missingFields.join(", ")}`);
  }

  if (!isPositiveNumber(amount) || !isPositiveNumber(maxMembers) || !isValidDate(String(startDate))) {
    return validationError(res, "Les donnees de creation sont invalides.");
  }

  const allowedFrequencies = Object.values(Frequency);
  const normalizedFrequency = String(frequency).toUpperCase() as Frequency;

  if (!allowedFrequencies.includes(normalizedFrequency)) {
    return validationError(res, "Frequence invalide.");
  }

  try {
    if (req.user?.id) {
      const tontine = await tontineRepository.createTontine({
        name: String(name),
        description: String(description || "Nouvelle tontine en preparation."),
        amount: Number(amount),
        frequency: normalizedFrequency,
        startDate: String(startDate),
        endDate: new Date(new Date(String(startDate)).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxMembers: Number(maxMembers),
        status: TontineStatus.PENDING,
        createdBy: req.user.id
      });

      await memberRepository.addMember(tontine.id, req.user.id, 1);
      return created(res, { tontine }, "Tontine creee avec succes");
    }
  } catch {
    // Fallback demo plus bas.
  }

  const createdAt = new Date().toISOString();
  const tontine: DemoTontine = {
    id: createDemoId("tontine"),
    name: String(name),
    description: String(description || "Nouvelle tontine en preparation."),
    amount: Number(amount),
    frequency: normalizedFrequency,
    startDate: String(startDate),
    endDate: new Date(new Date(String(startDate)).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    maxMembers: Number(maxMembers),
    status: TontineStatus.PENDING,
    createdBy: req.user?.id ?? "user-001",
    createdAt
  };

  DEMO_TONTINES.unshift(tontine);
  DEMO_MEMBERS.push({
    id: createDemoId("member"),
    tontineId: tontine.id,
    userId: req.user?.id ?? "user-001",
    orderPosition: 1,
    joinDate: createdAt,
    status: ContributionStatus.PAID
  });

  return created(res, { tontine }, "Tontine creee avec succes");
}

/**
 * Retourne le detail d'une tontine.
 */
export async function getTontineById(req: AuthenticatedRequest, res: Response) {
  try {
    const tontineId = String(req.params.id);
    const tontine = await tontineRepository.findWithDetails(tontineId);

    if (tontine) {
      return success(res, { tontine });
    }
  } catch {
    // Fallback demo plus bas.
  }

  const tontine = DEMO_TONTINES.find((entry) => entry.id === req.params.id);

  if (!tontine) {
    return notFound(res);
  }

  const members = DEMO_MEMBERS.filter((member) => member.tontineId === tontine.id).map((member) => ({
    ...member,
    user: findDemoUser(member.userId)
  }));
  const contributions = DEMO_CONTRIBUTIONS.filter((contribution) => contribution.tontineId === tontine.id);
  const distributions = DEMO_DISTRIBUTIONS.filter((distribution) => distribution.tontineId === tontine.id).map(
    (distribution) => ({
      ...distribution,
      beneficiary: findDemoUser(distribution.beneficiaryId)
    })
  );

  return success(res, { tontine: { ...tontine, members, contributions, distributions } });
}

/**
 * Met a jour une tontine.
 */
export async function updateTontine(req: AuthenticatedRequest, res: Response) {
  try {
    const tontineId = String(req.params.id);
    const existing = await tontineRepository.findWithDetails(tontineId);

    if (!existing) {
      return notFound(res);
    }

    if (existing.createdBy !== req.user?.id) {
      return forbidden(res);
    }

    const tontine = await tontineRepository.updateTontine(tontineId, {
      name: req.body.name as string | undefined,
      description: req.body.description as string | undefined
    });

    return success(res, { tontine }, "Tontine mise a jour");
  } catch {
    const tontine = DEMO_TONTINES.find((entry) => entry.id === req.params.id);

    if (!tontine) {
      return notFound(res);
    }

    if (tontine.createdBy !== req.user?.id) {
      return forbidden(res);
    }

    const { name, description } = req.body as Record<string, string>;

    if (name) {
      tontine.name = name;
    }

    if (description) {
      tontine.description = description;
    }

    return success(res, { tontine }, "Tontine mise a jour");
  }
}

/**
 * Supprime une tontine si elle est encore en attente.
 */
export async function deleteTontine(req: AuthenticatedRequest, res: Response) {
  try {
    const tontineId = String(req.params.id);
    const tontine = await tontineRepository.findWithDetails(tontineId);

    if (!tontine) {
      return notFound(res);
    }

    if (tontine.createdBy !== req.user?.id) {
      return forbidden(res);
    }

    if (tontine.status !== TontineStatus.PENDING) {
      return validationError(res, "Seules les tontines en attente peuvent etre supprimees.");
    }

    await tontineRepository.deleteTontine(tontineId);
    return success(res, null, "Tontine supprimee");
  } catch {
    const tontine = DEMO_TONTINES.find((entry) => entry.id === req.params.id);

    if (!tontine) {
      return notFound(res);
    }

    if (tontine.createdBy !== req.user?.id) {
      return forbidden(res);
    }

    if (tontine.status !== TontineStatus.PENDING) {
      return validationError(res, "Seules les tontines en attente peuvent etre supprimees.");
    }

    return success(res, null, "Tontine supprimee");
  }
}
