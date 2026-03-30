import { BaseRepository } from "./base.repository";

type ContributionRecord = {
  id: string;
  tontine_id: string;
  user_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  stripe_payment_id: string | null;
  status: string;
  created_at?: string;
};

export type RepositoryContribution = {
  id: string;
  tontineId: string;
  userId: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  stripePaymentId: string | null;
  status: string;
};

export type ContributionStats = {
  totalPaid: number;
  totalPending: number;
  nextDueDate: string | null;
};

function mapContribution(record: ContributionRecord): RepositoryContribution {
  return {
    id: record.id,
    tontineId: record.tontine_id,
    userId: record.user_id,
    amount: Number(record.amount),
    dueDate: record.due_date,
    paidDate: record.paid_date,
    stripePaymentId: record.stripe_payment_id,
    status: record.status.toUpperCase()
  };
}

class ContributionRepository extends BaseRepository<ContributionRecord> {
  protected tableName = "contributions";

  async findByTontineId(tontineId: string): Promise<RepositoryContribution[]> {
    const rows = await this.findAll({ tontine_id: tontineId });
    return rows.map(mapContribution);
  }

  async findByUserAndTontine(userId: string, tontineId: string): Promise<RepositoryContribution[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("tontine_id", tontineId)
      .order("due_date", { ascending: false });

    if (error) {
      this.handleError(error, "de lecture des cotisations utilisateur");
    }

    return ((data as ContributionRecord[] | null) ?? []).map(mapContribution);
  }

  async findByUserId(userId: string): Promise<RepositoryContribution[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: false });

    if (error) {
      this.handleError(error, "de lecture des cotisations d'un utilisateur");
    }

    return ((data as ContributionRecord[] | null) ?? []).map(mapContribution);
  }

  async hasUserPaidThisMonth(userId: string, tontineId: string): Promise<boolean> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("id")
      .eq("user_id", userId)
      .eq("tontine_id", tontineId)
      .eq("status", "paid")
      .gte("paid_date", start)
      .lte("paid_date", end)
      .maybeSingle();

    if (error) {
      this.handleError(error, "de vérification de paiement mensuel");
    }

    return Boolean(data);
  }

  async getMonthlyStats(tontineId: string): Promise<ContributionStats> {
    const contributions = await this.findByTontineId(tontineId);

    return {
      totalPaid: contributions
        .filter((contribution) => contribution.status === "PAID")
        .reduce((sum, contribution) => sum + contribution.amount, 0),
      totalPending: contributions
        .filter((contribution) => contribution.status !== "PAID")
        .reduce((sum, contribution) => sum + contribution.amount, 0),
      nextDueDate:
        contributions
          .map((contribution) => contribution.dueDate)
          .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] ?? null
    };
  }

  async createContribution(data: Partial<RepositoryContribution>): Promise<RepositoryContribution> {
    const created = await this.create({
      tontine_id: data.tontineId,
      user_id: data.userId,
      amount: data.amount,
      due_date: data.dueDate,
      paid_date: data.paidDate ?? null,
      stripe_payment_id: data.stripePaymentId ?? null,
      status: data.status?.toLowerCase() ?? "pending"
    });

    return mapContribution(created);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.update(id, { status: status.toLowerCase() });
  }
}

export const contributionRepository = new ContributionRepository();

