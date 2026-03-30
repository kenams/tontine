import type { TontineContribution } from "../types/entities";
import { apiCall } from "./api";
import { mapContribution } from "./mappers";

type BackendContribution = {
  id: string;
  tontineId: string;
  userId: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: string;
};

export type ContributionStats = {
  totalPaid: number;
  totalPending: number;
  nextDueDate: string | null;
};

export type ContributionsResponse = {
  contributions: TontineContribution[];
  stats: ContributionStats;
};

type BackendContributionsPayload = {
  contributions: BackendContribution[];
  stats: ContributionStats;
};

/**
 * Recupere l'historique des cotisations d'une tontine.
 */
export async function getContributions(tontineId: string): Promise<ContributionsResponse> {
  const payload = await apiCall<BackendContributionsPayload>("get", `/api/tontines/${tontineId}/contributions`);

  return {
    contributions: payload.contributions.map((contribution) => mapContribution(contribution)),
    stats: payload.stats
  };
}

/**
 * Enregistre une cotisation sur le backend.
 */
export async function makeContribution(tontineId: string, amount: number): Promise<TontineContribution> {
  const payload = await apiCall<{ contribution: BackendContribution }>(
    "post",
    `/api/tontines/${tontineId}/contributions`,
    { amount }
  );

  return mapContribution(payload.contribution);
}
