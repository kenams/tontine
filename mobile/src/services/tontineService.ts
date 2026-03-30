import type { CreateTontinePayload, Tontine, TontineMember } from "../types/entities";
import { PAGINATION } from "../config/constants";
import { apiCall } from "./api";
import { mapMember, mapTontine } from "./mappers";
import { getUser } from "./storage";

type BackendTontinePayload = {
  tontine: {
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
    membersCount?: number;
    progression?: {
      paidMembers: number;
      totalMembers: number;
    };
    members?: Array<{
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
        createdAt?: string;
      } | null;
    }>;
    contributions?: Array<{
      id: string;
      tontineId: string;
      userId: string;
      amount: number;
      dueDate: string;
      paidDate?: string | null;
      status: string;
    }>;
    distributions?: Array<{
      id: string;
      tontineId: string;
      beneficiaryId: string;
      amount: number;
      scheduledDate: string;
      paidDate?: string | null;
      status: string;
      beneficiary?: {
        id: string;
        email: string;
        fullName: string;
        phone?: string;
        avatarUrl?: string;
        createdAt?: string;
      } | null;
    }>;
  };
};

type BackendTontinesPayload = {
  tontines: BackendTontinePayload["tontine"][];
};

type MembersPayload = {
  members: Array<{
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
      createdAt?: string;
    } | null;
  }>;
};

export type CreateTontineRequest = {
  name: string;
  amount: number;
  frequency: "MONTHLY" | "BIWEEKLY" | "WEEKLY";
  maxMembers: number;
  startDate: string;
  description?: string;
};

export type TontineFilters = {
  status?: string;
  page?: number;
  limit?: number;
};

function mapFrequencyToApi(frequency: CreateTontinePayload["frequency"]): CreateTontineRequest["frequency"] {
  switch (frequency) {
    case "weekly":
      return "WEEKLY";
    case "biweekly":
      return "BIWEEKLY";
    default:
      return "MONTHLY";
  }
}

/**
 * Retourne les tontines de l'utilisateur connecte.
 */
export async function getMyTontines(filters?: TontineFilters): Promise<Tontine[]> {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set("status", filters.status);
  }

  params.set("page", String(filters?.page ?? PAGINATION.DEFAULT_PAGE));
  params.set("limit", String(filters?.limit ?? PAGINATION.DEFAULT_LIMIT));

  const payload = await apiCall<BackendTontinesPayload>(
    "get",
    `/api/tontines${params.toString() ? `?${params.toString()}` : ""}`
  );
  const user = await getUser();

  return payload.tontines.map((tontine) => mapTontine(tontine, user?.id));
}

/**
 * Cree une nouvelle tontine sur le backend.
 */
export async function createTontine(data: CreateTontinePayload): Promise<Tontine> {
  const user = await getUser();
  const payload = await apiCall<BackendTontinePayload>("post", "/api/tontines", {
    name: data.name,
    amount: data.contributionAmount,
    frequency: mapFrequencyToApi(data.frequency),
    maxMembers: data.membersCount,
    startDate: data.startDate,
    description: data.description
  });

  return mapTontine(payload.tontine, user?.id);
}

/**
 * Recupere le detail complet d'une tontine.
 */
export async function getTontineById(id: string): Promise<Tontine> {
  const user = await getUser();
  const payload = await apiCall<BackendTontinePayload>("get", `/api/tontines/${id}`);

  return mapTontine(payload.tontine, user?.id);
}

/**
 * Met a jour une tontine existante.
 */
export async function updateTontine(id: string, data: Partial<CreateTontineRequest>): Promise<Tontine> {
  const user = await getUser();
  const payload = await apiCall<BackendTontinePayload>("put", `/api/tontines/${id}`, data);

  return mapTontine(payload.tontine, user?.id);
}

/**
 * Supprime une tontine cote backend.
 */
export async function deleteTontine(id: string): Promise<void> {
  await apiCall<null>("delete", `/api/tontines/${id}`);
}

/**
 * Retourne les membres d'une tontine.
 */
export async function getMembers(tontineId: string): Promise<TontineMember[]> {
  const payload = await apiCall<MembersPayload>("get", `/api/tontines/${tontineId}/members`);

  return payload.members.map(mapMember);
}

/**
 * Invite un membre par email.
 */
export async function inviteMember(tontineId: string, email: string): Promise<TontineMember> {
  const payload = await apiCall<{ member: MembersPayload["members"][number] }>(
    "post",
    `/api/tontines/${tontineId}/members/invite`,
    { email }
  );

  return mapMember(payload.member);
}

/**
 * Retire un membre d'une tontine.
 */
export async function removeMember(tontineId: string, userId: string): Promise<void> {
  await apiCall<null>("delete", `/api/tontines/${tontineId}/members/${userId}`);
}
