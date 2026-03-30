import type { AppNotification } from "../types/entities";
import { apiCall } from "./api";
import { mapNotification } from "./mappers";

type BackendNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  tontineId?: string;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};

type BackendNotificationsPayload = {
  notifications: BackendNotification[];
  unreadCount: number;
};

/**
 * Recupere les notifications de l'utilisateur.
 */
export async function getNotifications(): Promise<NotificationsResponse> {
  const payload = await apiCall<BackendNotificationsPayload>("get", "/api/notifications");

  return {
    notifications: payload.notifications.map(mapNotification),
    unreadCount: payload.unreadCount
  };
}

/**
 * Marque une notification comme lue.
 */
export async function markAsRead(id: string): Promise<void> {
  await apiCall<null>("put", `/api/notifications/${id}/read`);
}

/**
 * Marque toutes les notifications comme lues.
 */
export async function markAllAsRead(): Promise<void> {
  await apiCall<null>("put", "/api/notifications/read-all");
}
