import type { Response } from "express";

import { notificationRepository } from "../repositories/notification.repository";
import type { AuthenticatedRequest } from "../types/api.types";
import { DEMO_NOTIFICATIONS } from "../utils/demo-data";
import { success } from "../utils/response";

/**
 * Retourne les notifications de l'utilisateur connecte.
 */
export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const notifications = req.user?.id ? await notificationRepository.findByUserId(req.user.id) : [];
    const unreadCount = req.user?.id ? await notificationRepository.getUnreadCount(req.user.id) : 0;
    return success(res, { notifications, unreadCount });
  } catch {
    const notifications = DEMO_NOTIFICATIONS.filter((entry) => entry.userId === req.user?.id).sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
    const unreadCount = notifications.filter((entry) => !entry.read).length;
    return success(res, { notifications, unreadCount });
  }
}

/**
 * Marque une notification comme lue.
 */
export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    await notificationRepository.markAsRead(String(req.params.id));
  } catch {
    const notification = DEMO_NOTIFICATIONS.find(
      (entry) => entry.id === req.params.id && entry.userId === req.user?.id
    );

    if (notification) {
      notification.read = true;
    }
  }

  return success(res, null, "Notification lue");
}

/**
 * Marque toutes les notifications comme lues.
 */
export async function markAllAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.id) {
      await notificationRepository.markAllAsRead(req.user.id);
    }
  } catch {
    DEMO_NOTIFICATIONS.forEach((entry) => {
      if (entry.userId === req.user?.id) {
        entry.read = true;
      }
    });
  }

  return success(res, null, "Toutes les notifications lues");
}
