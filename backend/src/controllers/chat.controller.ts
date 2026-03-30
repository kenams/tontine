import type { Response } from "express";

import { messageRepository } from "../repositories/message.repository";
import type { AuthenticatedRequest, PaginationMeta } from "../types/api.types";
import { DEMO_MESSAGES, createDemoId, findDemoUser } from "../utils/demo-data";
import { created, success, validationError } from "../utils/response";

/**
 * Retourne les messages d'une tontine avec pagination.
 */
export async function getMessages(req: AuthenticatedRequest, res: Response) {
  const tontineId = String(req.params.id);
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);

  try {
    const messages = await messageRepository.findByTontineId(tontineId, page, limit);
    const pagination: PaginationMeta = {
      page,
      limit,
      total: messages.length,
      totalPages: Math.max(1, Math.ceil(messages.length / limit))
    };

    return success(res, { messages, pagination });
  } catch {
    const allMessages = DEMO_MESSAGES.filter((entry) => entry.tontineId === tontineId)
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
      .map((message) => ({
        ...message,
        sender: findDemoUser(message.senderId)
      }));

    const startIndex = (page - 1) * limit;
    const messages = allMessages.slice(startIndex, startIndex + limit);
    const pagination: PaginationMeta = {
      page,
      limit,
      total: allMessages.length,
      totalPages: Math.max(1, Math.ceil(allMessages.length / limit))
    };

    return success(res, { messages, pagination });
  }
}

/**
 * Cree un message dans la conversation.
 */
export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  const tontineId = String(req.params.id);
  const { content } = req.body as Record<string, string>;

  if (!content || !content.trim() || content.trim().length > 500) {
    return validationError(res, "Le message est vide ou trop long.");
  }

  try {
    const message = await messageRepository.createMessage({
      tontineId,
      senderId: req.user?.id ?? "user-001",
      content: content.trim()
    });

    return created(res, { message }, "Message envoye");
  } catch {
    const message = {
      id: createDemoId("message"),
      tontineId,
      senderId: req.user?.id ?? "user-001",
      content: content.trim(),
      createdAt: new Date().toISOString(),
      sender: findDemoUser(req.user?.id ?? "user-001")
    };

    DEMO_MESSAGES.push({
      id: message.id,
      tontineId: message.tontineId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt
    });

    return created(res, { message }, "Message envoye");
  }
}

