import { BaseRepository } from "./base.repository";

type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  data?: Record<string, unknown> | null;
  created_at: string;
};

export type RepositoryNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
};

function mapNotification(record: NotificationRecord): RepositoryNotification {
  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    body: record.body,
    type: record.type,
    read: record.read,
    createdAt: record.created_at,
    data: record.data ?? null
  };
}

class NotificationRepository extends BaseRepository<NotificationRecord> {
  protected tableName = "notifications";

  async findByUserId(userId: string): Promise<RepositoryNotification[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      this.handleError(error, "de lecture des notifications");
    }

    return ((data as NotificationRecord[] | null) ?? []).map(mapNotification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      this.handleError(error, "de comptage des notifications non lues");
    }

    return count ?? 0;
  }

  async markAsRead(id: string): Promise<void> {
    await this.update(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase.from(this.tableName).update({ read: true }).eq("user_id", userId);

    if (error) {
      this.handleError(error, "de lecture globale des notifications");
    }
  }

  async createNotification(data: Partial<RepositoryNotification>): Promise<RepositoryNotification> {
    const created = await this.create({
      user_id: data.userId,
      title: data.title,
      body: data.body,
      type: data.type ?? "general",
      read: data.read ?? false,
      data: data.data ?? null
    });

    return mapNotification(created);
  }

  async createBulkNotifications(notifications: Partial<RepositoryNotification>[]): Promise<void> {
    if (notifications.length === 0) {
      return;
    }

    const { error } = await this.supabase.from(this.tableName).insert(
      notifications.map((notification) => ({
        user_id: notification.userId,
        title: notification.title,
        body: notification.body,
        type: notification.type ?? "general",
        read: notification.read ?? false,
        data: notification.data ?? null
      }))
    );

    if (error) {
      this.handleError(error, "de création multiple des notifications");
    }
  }
}

export const notificationRepository = new NotificationRepository();

