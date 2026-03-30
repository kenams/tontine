import { create } from "zustand";

import { cloneDemoNotifications } from "../data/demo-data";
import { getNotifications as getNotificationsService, markAllAsRead as markAllAsReadService, markAsRead as markAsReadService } from "../services/notificationService";
import { useAppStore } from "./appStore";
import type { AppNotification } from "../types/entities";
import { devLog } from "../utils/logger";

type NotificationStore = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  errorMessage: string | null;
  fetchNotifications: () => Promise<AppNotification[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

function computeUnreadCount(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.read).length;
}

const initialNotifications = cloneDemoNotifications();

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: initialNotifications,
  unreadCount: computeUnreadCount(initialNotifications),
  isLoading: false,
  errorMessage: null,

  fetchNotifications: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const payload = await getNotificationsService();

      set({
        notifications: payload.notifications,
        unreadCount: payload.unreadCount,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return payload.notifications;
    } catch {
      const notifications = cloneDemoNotifications();
      devLog("Mode demo active pour les notifications");

      set({
        notifications,
        unreadCount: computeUnreadCount(notifications),
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return notifications;
    }
  },

  markAsRead: async (id) => {
    set({ isLoading: true, errorMessage: null });

    try {
      await markAsReadService(id);
      const notifications = get().notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );

      set({
        notifications,
        unreadCount: computeUnreadCount(notifications),
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });
    } catch {
      const notifications = get().notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      devLog("Mode demo active pour le marquage d'une notification");

      set({
        notifications,
        unreadCount: computeUnreadCount(notifications),
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });
    }
  },

  markAllAsRead: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      await markAllAsReadService();
    } catch {
      devLog("Mode demo active pour le marquage global des notifications");
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });
    }

    const notifications = get().notifications.map((notification) => ({ ...notification, read: true }));

    set({
      notifications,
      unreadCount: 0,
      isLoading: false,
      errorMessage: null
    });
  }
}));
