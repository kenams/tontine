import type { Response } from "express";

import { memberRepository } from "../repositories/member.repository";
import { tontineRepository } from "../repositories/tontine.repository";
import { userRepository } from "../repositories/user.repository";
import type { AuthenticatedRequest } from "../types/api.types";
import { ContributionStatus } from "../types/api.types";
import { DEMO_MEMBERS, DEMO_TONTINES, DEMO_USERS, createDemoId, findDemoUser } from "../utils/demo-data";
import { error, forbidden, notFound, success, validationError } from "../utils/response";
import { isValidEmail } from "../utils/validators";

/**
 * Retourne la liste des membres d'une tontine.
 */
export async function getMembers(req: AuthenticatedRequest, res: Response) {
  try {
    const tontineId = String(req.params.id);
    const members = await memberRepository.findByTontineId(tontineId);
    return success(res, { members });
  } catch {
    const members = DEMO_MEMBERS.filter((member) => member.tontineId === req.params.id).map((member) => ({
      ...member,
      user: findDemoUser(member.userId)
    }));

    return success(res, { members });
  }
}

/**
 * Invite un membre via son email.
 */
export async function inviteMember(req: AuthenticatedRequest, res: Response) {
  const { email: invitedEmail } = req.body as Record<string, string>;

  if (!isValidEmail(invitedEmail)) {
    return validationError(res, "Email invalide.");
  }

  try {
    const tontineId = String(req.params.id);
    const tontine = await tontineRepository.findWithDetails(tontineId);

    if (!tontine) {
      return notFound(res);
    }

    const user = await userRepository.findByEmail(invitedEmail);

    if (!user) {
      return error(res, "Utilisateur non trouve");
    }

    const member = await memberRepository.addMember(
      tontineId,
      user.id,
      (tontine.members?.length ?? 0) + 1
    );

    return success(res, { member }, "Invitation envoyee");
  } catch {
    const tontine = DEMO_TONTINES.find((entry) => entry.id === req.params.id);

    if (!tontine) {
      return notFound(res);
    }

    const user = DEMO_USERS.find((entry) => entry.email.toLowerCase() === invitedEmail.toLowerCase());

    if (!user) {
      return error(res, "Utilisateur non trouve");
    }

    const member = {
      id: createDemoId("member"),
      tontineId: tontine.id,
      userId: user.id,
      orderPosition: DEMO_MEMBERS.filter((entry) => entry.tontineId === tontine.id).length + 1,
      joinDate: new Date().toISOString(),
      status: ContributionStatus.PENDING,
      user
    };

    DEMO_MEMBERS.push({
      id: member.id,
      tontineId: member.tontineId,
      userId: member.userId,
      orderPosition: member.orderPosition,
      joinDate: member.joinDate,
      status: member.status
    });

    return success(res, { member }, "Invitation envoyee");
  }
}

/**
 * Retire un membre d'une tontine si l'utilisateur est organisateur.
 */
export async function removeMember(req: AuthenticatedRequest, res: Response) {
  try {
    const tontineId = String(req.params.id);
    const userId = String(req.params.uid);
    const tontine = await tontineRepository.findWithDetails(tontineId);

    if (!tontine) {
      return notFound(res);
    }

    if (tontine.createdBy !== req.user?.id) {
      return forbidden(res);
    }

    await memberRepository.removeMember(tontineId, userId);
    return success(res, null, "Membre retire");
  } catch {
    const tontine = DEMO_TONTINES.find((entry) => entry.id === req.params.id);

    if (!tontine) {
      return notFound(res);
    }

    if (tontine.createdBy !== req.user?.id) {
      return forbidden(res);
    }

    return success(res, null, "Membre retire");
  }
}
