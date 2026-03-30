import { useNotificationStore } from "../store/notificationStore";

/**
 * Hook utilitaire pour les notifications et le badge global.
 */
export function useNotifications() {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllAsReadAction = useNotificationStore((state) => state.markAllAsRead);

  async function markAllAsRead() {
    await markAllAsReadAction();
  }

  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
    markAllAsRead
  };
}
