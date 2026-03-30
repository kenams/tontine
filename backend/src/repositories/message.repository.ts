import { BaseRepository } from "./base.repository";

type MessageRecord = {
  id: string;
  tontine_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  }[] | {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
};

export type RepositoryMessage = {
  id: string;
  tontineId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;
  } | null;
};

function mapMessage(record: MessageRecord): RepositoryMessage {
  const linkedSender = Array.isArray(record.sender)
    ? (record.sender[0] ?? null)
    : (record.sender ?? null);

  return {
    id: record.id,
    tontineId: record.tontine_id,
    senderId: record.sender_id,
    content: record.content,
    createdAt: record.created_at,
    sender: linkedSender
      ? {
          id: linkedSender.id,
          email: linkedSender.email,
          fullName: linkedSender.full_name,
          phone: linkedSender.phone ?? undefined,
          avatarUrl: linkedSender.avatar_url ?? undefined,
          createdAt: linkedSender.created_at
        }
      : null
  };
}

class MessageRepository extends BaseRepository<MessageRecord> {
  protected tableName = "messages";

  async findByTontineId(tontineId: string, page: number, limit: number): Promise<RepositoryMessage[]> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        "id, tontine_id, sender_id, content, created_at, sender:users(id, email, full_name, phone, avatar_url, created_at)"
      )
      .eq("tontine_id", tontineId)
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error) {
      this.handleError(error, "de lecture des messages");
    }

    return (((data as unknown) as MessageRecord[] | null) ?? []).map(mapMessage);
  }

  async createMessage(data: Partial<RepositoryMessage>): Promise<RepositoryMessage> {
    const created = await this.create({
      tontine_id: data.tontineId,
      sender_id: data.senderId,
      content: data.content
    });

    const messages = await this.findByTontineId(created.tontine_id, 1, 1);
    return messages[0] ?? mapMessage(created);
  }

  async getLastMessage(tontineId: string): Promise<RepositoryMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        "id, tontine_id, sender_id, content, created_at, sender:users(id, email, full_name, phone, avatar_url, created_at)"
      )
      .eq("tontine_id", tontineId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.handleError(error, "de lecture du dernier message");
    }

    return data ? mapMessage((data as unknown) as MessageRecord) : null;
  }
}

export const messageRepository = new MessageRepository();
