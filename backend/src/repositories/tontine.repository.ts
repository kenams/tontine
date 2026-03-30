import { BaseRepository } from "./base.repository";
import { contributionRepository } from "./contribution.repository";
import { memberRepository, type RepositoryMember } from "./member.repository";

type TontineRecord = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  max_members: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
};

type DistributionRecord = {
  id: string;
  tontine_id: string;
  beneficiary_id: string;
  amount: number;
  scheduled_date: string;
  paid_date: string | null;
  status: string;
  beneficiary?: {
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

export type RepositoryDistribution = {
  id: string;
  tontineId: string;
  beneficiaryId: string;
  amount: number;
  scheduledDate: string;
  paidDate: string | null;
  status: string;
  beneficiary?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;
  } | null;
};

export type RepositoryTontine = {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string;
  maxMembers: number;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  membersCount?: number;
  progression?: {
    paidMembers: number;
    totalMembers: number;
  };
  currentBeneficiary?: string;
};

export type RepositoryTontineDetails = RepositoryTontine & {
  members: RepositoryMember[];
  contributions: Awaited<ReturnType<typeof contributionRepository.findByTontineId>>;
  distributions: RepositoryDistribution[];
};

function mapDistribution(record: DistributionRecord): RepositoryDistribution {
  const linkedBeneficiary = Array.isArray(record.beneficiary)
    ? (record.beneficiary[0] ?? null)
    : (record.beneficiary ?? null);

  return {
    id: record.id,
    tontineId: record.tontine_id,
    beneficiaryId: record.beneficiary_id,
    amount: Number(record.amount),
    scheduledDate: record.scheduled_date,
    paidDate: record.paid_date,
    status: record.status.toUpperCase(),
    beneficiary: linkedBeneficiary
      ? {
          id: linkedBeneficiary.id,
          email: linkedBeneficiary.email,
          fullName: linkedBeneficiary.full_name,
          phone: linkedBeneficiary.phone ?? undefined,
          avatarUrl: linkedBeneficiary.avatar_url ?? undefined,
          createdAt: linkedBeneficiary.created_at
        }
      : null
  };
}

function mapTontine(record: TontineRecord): RepositoryTontine {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    amount: Number(record.amount),
    frequency: record.frequency.toUpperCase(),
    startDate: record.start_date,
    endDate: record.end_date ?? record.start_date,
    maxMembers: record.max_members,
    status: record.status.toUpperCase(),
    createdBy: record.created_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

class TontineRepository extends BaseRepository<TontineRecord> {
  protected tableName = "tontines";

  async findByUserId(userId: string): Promise<RepositoryTontine[]> {
    const { data: memberRows, error: memberError } = await this.supabase
      .from("tontine_members")
      .select("tontine_id")
      .eq("user_id", userId);

    if (memberError) {
      this.handleError(memberError, "de lecture des adhésions tontine");
    }

    const tontineIds = ((memberRows as Array<{ tontine_id: string }> | null) ?? []).map(
      (row) => row.tontine_id
    );

    let query = this.supabase.from(this.tableName).select("*").order("created_at", { ascending: false });

    if (tontineIds.length > 0) {
      query = query.or(`created_by.eq.${userId},id.in.(${tontineIds.join(",")})`);
    } else {
      query = query.eq("created_by", userId);
    }

    const { data, error } = await query;

    if (error) {
      this.handleError(error, "de lecture des tontines utilisateur");
    }

    const tontines = ((data as TontineRecord[] | null) ?? []).map(mapTontine);

    return Promise.all(
      tontines.map(async (tontine) => {
        const members = await memberRepository.findByTontineId(tontine.id);
        const contributions = await contributionRepository.findByTontineId(tontine.id);
        const paidMembers = contributions.filter((contribution) => contribution.status === "PAID").length;
        const nextMember = members
          .slice()
          .sort((left, right) => left.orderPosition - right.orderPosition)[0];

        return {
          ...tontine,
          membersCount: members.length,
          currentBeneficiary: nextMember?.user?.fullName,
          progression: {
            paidMembers,
            totalMembers: members.length || tontine.maxMembers
          }
        };
      })
    );
  }

  async findWithDetails(id: string): Promise<RepositoryTontineDetails | null> {
    const tontine = await this.findById(id);

    if (!tontine) {
      return null;
    }

    const members = await memberRepository.findByTontineId(id);
    const contributions = await contributionRepository.findByTontineId(id);
    const { data: distributionRows, error } = await this.supabase
      .from("distributions")
      .select(
        "id, tontine_id, beneficiary_id, amount, scheduled_date, paid_date, status, beneficiary:users(id, email, full_name, phone, avatar_url, created_at)"
      )
      .eq("tontine_id", id)
      .order("scheduled_date", { ascending: true });

    if (error) {
      this.handleError(error, "de lecture des distributions");
    }

    const nextMember = members
      .slice()
      .sort((left, right) => left.orderPosition - right.orderPosition)[0];

    return {
      ...mapTontine(tontine),
      membersCount: members.length,
      currentBeneficiary: nextMember?.user?.fullName,
      progression: {
        paidMembers: contributions.filter((contribution) => contribution.status === "PAID").length,
        totalMembers: members.length || tontine.max_members
      },
      members,
      contributions,
      distributions: ((((distributionRows as unknown) as DistributionRecord[] | null) ?? []).map(mapDistribution))
    };
  }

  async createTontine(data: Partial<RepositoryTontine>): Promise<RepositoryTontine> {
    const created = await this.create({
      name: data.name,
      description: data.description ?? "",
      amount: data.amount,
      frequency: data.frequency?.toLowerCase(),
      start_date: data.startDate,
      end_date: data.endDate ?? null,
      max_members: data.maxMembers,
      status: data.status?.toLowerCase() ?? "pending",
      created_by: data.createdBy
    });

    return mapTontine(created);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.update(id, { status: status.toLowerCase() });
  }

  async getActiveTontines(): Promise<RepositoryTontine[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      this.handleError(error, "de lecture des tontines actives");
    }

    return ((data as TontineRecord[] | null) ?? []).map(mapTontine);
  }

  async updateTontine(id: string, data: Partial<RepositoryTontine>): Promise<RepositoryTontine> {
    const updated = await this.update(id, {
      name: data.name,
      description: data.description,
      status: data.status?.toLowerCase()
    });

    return mapTontine(updated);
  }

  async deleteTontine(id: string): Promise<void> {
    await this.delete(id);
  }
}

export const tontineRepository = new TontineRepository();
