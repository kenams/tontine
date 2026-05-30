import { create } from "zustand";

import { getNotifications as getNotificationsService, markAllAsRead as markAllAsReadService, markAsRead as markAsReadService } from "../services/notificationService";
import type { AppNotification } from "../types/entities";

type NotificationStore = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  errorMessage: string | null;
  fetchNotifications: () => Promise<AppNotification[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

function countUnread(list: AppNotification[]) {
  return list.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  errorMessage: null,

  fetchNotifications: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const payload = await getNotificationsService();
      set({ notifications: payload.notifications, unreadCount: payload.unreadCount, isLoading: false, errorMessage: null });
      return payload.notifications;
    } catch {
      set({ isLoading: false, errorMessage: null });
      return [];
    }
  },

  markAsRead: async (id) => {
    try { await markAsReadService(id); } catch {}
    const list = get().notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    set({ notifications: list, unreadCount: countUnread(list) });
  },

  markAllAsRead: async () => {
    try { await markAllAsReadService(); } catch {}
    const list = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: list, unreadCount: 0, isLoading: false });
  },
}));
