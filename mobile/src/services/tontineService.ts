import type { Tontine, TontineMember } from "../types/entities";
import { apiCall } from "./api";

// Types Kotizy API
type KotizGroup = {
  id: string;
  name: string;
  description: string;
  contributionCents: number;
  currency: string;
  frequency: string;
  maxMembers: number;
  status: string;
  joinCode: string;
  currentRound: number;
  nextDueAt: string;
  createdAt: string;
  memberships?: KotizMembership[];
  contributions?: KotizContribution[];
};

type KotizMembership = {
  id: string;
  userId: string;
  tontineGroupId: string;
  payoutOrder: number;
  status: string;
  paidThisRound: boolean;
  autoPayEnabled: boolean;
  joinedAt: string;
  user?: { id: string; fullName: string; email: string; avatarUrl?: string | null; trustScore?: { score: number } | null };
};

type KotizContribution = {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  status: string;
  dueAt: string;
  paidAt?: string | null;
};

function mapStatus(s: string): Tontine["status"] {
  if (s === "ACTIVE") return "active";
  if (s === "COMPLETED") return "completed";
  if (s === "PAUSED") return "cancelled";
  return "open";
}

function mapFreq(f: string): Tontine["frequency"] {
  if (f === "WEEKLY") return "weekly";
  if (f === "BIWEEKLY") return "biweekly";
  return "monthly";
}

export function mapKotizGroup(g: KotizGroup, myUserId?: string): Tontine {
  const paid = g.contributions?.filter((c) => c.status === "PAID").length ?? 0;
  const total = g.memberships?.length ?? g.maxMembers;
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    contributionAmount: g.contributionCents / 100,
    currency: g.currency as "EUR",
    frequency: mapFreq(g.frequency),
    membersCount: total,
    currentRound: g.currentRound,
    totalRounds: g.maxMembers,
    nextPayoutDate: g.nextDueAt,
    status: mapStatus(g.status),
    isPrivate: false,
    maxMembers: g.maxMembers,
    totalPot: (g.contributionCents * total) / 100,
    joinCode: g.joinCode,
    members: g.memberships?.map((m) => mapKotizMembership(m, g.id)),
    progression: { paidMembers: paid, totalMembers: total },
    myTurn: g.memberships?.find((m) => m.userId === myUserId)?.payoutOrder,
  };
}

function mapKotizMembership(m: KotizMembership, groupId: string): TontineMember {
  return {
    id: m.id,
    tontineId: groupId,
    userId: m.userId,
    fullName: m.user?.fullName ?? "Membre",
    avatarUrl: m.user?.avatarUrl ?? undefined,
    role: "member",
    payoutOrder: m.payoutOrder,
    paymentStatus: m.paidThisRound ? "paid" : (m.status === "LATE" ? "late" : "pending"),
    joinedAt: m.joinedAt,
  };
}

export async function getMyTontines(): Promise<Tontine[]> {
  const res = await apiCall<{ tontines: KotizGroup[] }>("get", "/api/tontines");
  return res.tontines.map((g) => mapKotizGroup(g));
}

export async function getTontineById(id: string): Promise<Tontine> {
  const res = await apiCall<{ group: KotizGroup }>("get", `/api/tontines/${id}`);
  return mapKotizGroup(res.group);
}

export async function createTontine(data: {
  name: string;
  description: string;
  contributionAmount: number;
  currency: string;
  frequency: string;
  maxMembers: number;
  rules: string;
}): Promise<Tontine> {
  const res = await apiCall<{ group: KotizGroup }>("post", "/api/tontines", {
    name: data.name,
    description: data.description,
    contributionAmount: data.contributionAmount,
    currency: data.currency,
    frequency: data.frequency.toUpperCase(),
    maxMembers: data.maxMembers,
    rules: data.rules,
  });
  return mapKotizGroup(res.group);
}

export async function joinTontine(joinCode: string): Promise<{ groupId: string; alreadyMember: boolean }> {
  const res = await apiCall<{ groupId: string; alreadyMember?: boolean }>("post", "/api/tontines/join", { joinCode });
  return { groupId: res.groupId, alreadyMember: !!res.alreadyMember };
}

export async function contribute(tontineId: string, provider = "WALLET"): Promise<{ ok: boolean; status: string; checkoutUrl?: string }> {
  return apiCall("post", `/api/tontines/${tontineId}/contribute`, { provider });
}

export async function toggleAutoPay(tontineId: string, enabled: boolean): Promise<void> {
  await apiCall("patch", `/api/tontines/${tontineId}/autopay`, { enabled });
}

export async function inviteMember(tontineId: string, email: string): Promise<void> {
  await apiCall("post", `/api/tontines/${tontineId}/invite`, { email });
}
