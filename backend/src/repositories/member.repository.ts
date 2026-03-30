import { BaseRepository } from "./base.repository";

type MemberRecord = {
  id: string;
  tontine_id: string;
  user_id: string;
  order_position: number;
  join_date: string;
  status: string;
};

type MemberWithUserRecord = MemberRecord & {
  user?: {
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

export type RepositoryMember = {
  id: string;
  tontineId: string;
  userId: string;
  orderPosition: number;
  joinDate: string;
  status: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;
  } | null;
};

function mapMember(record: MemberWithUserRecord): RepositoryMember {
  const linkedUser = Array.isArray(record.user) ? (record.user[0] ?? null) : (record.user ?? null);

  return {
    id: record.id,
    tontineId: record.tontine_id,
    userId: record.user_id,
    orderPosition: record.order_position,
    joinDate: record.join_date,
    status: record.status.toUpperCase(),
    user: linkedUser
      ? {
          id: linkedUser.id,
          email: linkedUser.email,
          fullName: linkedUser.full_name,
          phone: linkedUser.phone ?? undefined,
          avatarUrl: linkedUser.avatar_url ?? undefined,
          createdAt: linkedUser.created_at
        }
      : null
  };
}

class MemberRepository extends BaseRepository<MemberRecord> {
  protected tableName = "tontine_members";

  async findByTontineId(tontineId: string): Promise<RepositoryMember[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        "id, tontine_id, user_id, order_position, join_date, status, user:users(id, email, full_name, phone, avatar_url, created_at)"
      )
      .eq("tontine_id", tontineId)
      .order("order_position", { ascending: true });

    if (error) {
      this.handleError(error, "de lecture des membres");
    }

    return (((data as unknown) as MemberWithUserRecord[] | null) ?? []).map(mapMember);
  }

  async addMember(tontineId: string, userId: string, position: number): Promise<RepositoryMember> {
    const created = await this.create({
      tontine_id: tontineId,
      user_id: userId,
      order_position: position,
      status: "active"
    });

    const members = await this.findByTontineId(tontineId);
    return members.find((member) => member.id === created.id) ?? mapMember(created);
  }

  async removeMember(tontineId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: "removed" })
      .eq("tontine_id", tontineId)
      .eq("user_id", userId);

    if (error) {
      this.handleError(error, "de retrait du membre");
    }
  }

  async isMember(tontineId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("id")
      .eq("tontine_id", tontineId)
      .eq("user_id", userId)
      .neq("status", "removed")
      .maybeSingle();

    if (error) {
      this.handleError(error, "de vérification du membre");
    }

    return Boolean(data);
  }

  async getMemberCount(tontineId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("tontine_id", tontineId)
      .neq("status", "removed");

    if (error) {
      this.handleError(error, "de comptage des membres");
    }

    return count ?? 0;
  }
}

export const memberRepository = new MemberRepository();
