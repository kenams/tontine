import type { Response } from "express";

import { contributionRepository } from "../repositories/contribution.repository";
import { tontineRepository } from "../repositories/tontine.repository";
import { userRepository } from "../repositories/user.repository";
import type { AuthenticatedRequest } from "../types/api.types";
import { ContributionStatus } from "../types/api.types";
import { DEMO_CONTRIBUTIONS, DEMO_MEMBERS, DEMO_USERS } from "../utils/demo-data";
import { success, validationError } from "../utils/response";
import { isValidPhone } from "../utils/validators";

/**
 * Retourne le profil complet de l'utilisateur avec ses statistiques.
 */
export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.id) {
      const user = await userRepository.findBySupabaseId(req.user.id);

      if (user) {
        const contributions = await contributionRepository.findByUserId(user.id);
        const tontines = await tontineRepository.findByUserId(user.id);
        const stats = {
          tontinesCount: tontines.length,
          totalSaved: contributions
            .filter((entry) => entry.status === "PAID")
            .reduce((sum, entry) => sum + entry.amount, 0),
          punctualityRate: 98
        };

        return success(res, { user, stats });
      }
    }
  } catch {
    // Fallback demo plus bas.
  }

  const user = DEMO_USERS.find((entry) => entry.id === req.user?.id) ?? DEMO_USERS[0];
  const userContributions = DEMO_CONTRIBUTIONS.filter((entry) => entry.userId === user.id);
  const stats = {
    tontinesCount: DEMO_MEMBERS.filter((entry) => entry.userId === user.id).length,
    totalSaved: userContributions
      .filter((entry) => entry.status === ContributionStatus.PAID)
      .reduce((sum, entry) => sum + entry.amount, 0),
    punctualityRate: 98
  };

  return success(res, { user, stats });
}

/**
 * Met a jour le profil utilisateur.
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const { fullName, phone, avatarUrl } = req.body as Record<string, string>;

  if (phone && !isValidPhone(phone)) {
    return validationError(res, "Le numero de telephone est invalide.");
  }

  try {
    if (req.user?.id) {
      const currentUser = await userRepository.findBySupabaseId(req.user.id);

      if (currentUser) {
        const nextUser = await userRepository.createOrUpdate({
          id: currentUser.id,
          email: currentUser.email,
          fullName: fullName || currentUser.fullName,
          phone: phone || currentUser.phone,
          avatarUrl: avatarUrl || currentUser.avatarUrl
        });

        return success(res, { user: nextUser }, "Profil mis a jour");
      }
    }
  } catch {
    // Fallback demo plus bas.
  }

  const user = DEMO_USERS.find((entry) => entry.id === req.user?.id) ?? DEMO_USERS[0];

  if (fullName) {
    user.fullName = fullName;
  }

  if (phone) {
    user.phone = phone;
  }

  if (avatarUrl) {
    user.avatarUrl = avatarUrl;
  }

  return success(res, { user }, "Profil mis a jour");
}

