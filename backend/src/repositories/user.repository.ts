import { BaseRepository } from "./base.repository";

type UserRecord = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  trust_score: number | null;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at?: string;
};

export type RepositoryUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  trustScore?: number;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt?: string;
};

function mapUser(record: UserRecord): RepositoryUser {
  return {
    id: record.id,
    email: record.email,
    fullName: record.full_name,
    phone: record.phone ?? undefined,
    avatarUrl: record.avatar_url ?? undefined,
    trustScore: record.trust_score ?? undefined,
    stripeCustomerId: record.stripe_customer_id ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

class UserRepository extends BaseRepository<UserRecord> {
  protected tableName = "users";

  async findByEmail(email: string): Promise<RepositoryUser | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      this.handleError(error, "de recherche utilisateur par email");
    }

    return data ? mapUser(data as UserRecord) : null;
  }

  async findBySupabaseId(supabaseId: string): Promise<RepositoryUser | null> {
    const user = await this.findById(supabaseId);
    return user ? mapUser(user) : null;
  }

  async createOrUpdate(data: Partial<RepositoryUser> & { id: string; email: string }): Promise<RepositoryUser> {
    const existing = await this.findBySupabaseId(data.id);

    if (existing) {
      const updated = await this.update(data.id, {
        email: data.email,
        full_name: data.fullName ?? existing.fullName,
        phone: data.phone ?? null,
        avatar_url: data.avatarUrl ?? null,
        trust_score: data.trustScore ?? existing.trustScore ?? 100,
        stripe_customer_id: data.stripeCustomerId ?? existing.stripeCustomerId ?? null
      });

      return mapUser(updated);
    }

    const created = await this.create({
      id: data.id,
      email: data.email,
      full_name: data.fullName ?? "Utilisateur",
      phone: data.phone ?? null,
      avatar_url: data.avatarUrl ?? null,
      trust_score: data.trustScore ?? 100,
      stripe_customer_id: data.stripeCustomerId ?? null
    });

    return mapUser(created);
  }

  async updateTrustScore(userId: string, score: number): Promise<void> {
    await this.update(userId, { trust_score: score });
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await this.update(userId, { stripe_customer_id: stripeCustomerId });
  }
}

export const userRepository = new UserRepository();

