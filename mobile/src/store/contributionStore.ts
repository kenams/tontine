import { create } from "zustand";

import { getContributions as getContributionsService, makeContribution as makeContributionService } from "../services/contributionService";
import type { TontineContribution } from "../types/entities";

type ContributionStore = {
  contributions: TontineContribution[];
  contributionsByTontine: Record<string, TontineContribution[]>;
  nextDueDate: string | null;
  totalSaved: number;
  isLoading: boolean;
  errorMessage: string | null;
  fetchContributions: (tontineId: string) => Promise<TontineContribution[]>;
  makeContribution: (tontineId: string, amount: number) => Promise<TontineContribution>;
};

export const useContributionStore = create<ContributionStore>((set, get) => ({
  contributions: [],
  contributionsByTontine: {},
  nextDueDate: null,
  totalSaved: 0,
  isLoading: false,
  errorMessage: null,

  fetchContributions: async (tontineId) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const payload = await getContributionsService(tontineId);
      set((s) => ({
        contributions: payload.contributions,
        contributionsByTontine: { ...s.contributionsByTontine, [tontineId]: payload.contributions },
        nextDueDate: payload.stats.nextDueDate,
        totalSaved: payload.stats.totalPaid,
        isLoading: false,
        errorMessage: null,
      }));
      return payload.contributions;
    } catch {
      set({ contributions: [], isLoading: false, errorMessage: null });
      return [];
    }
  },

  makeContribution: async (tontineId, amount) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const contribution = await makeContributionService(tontineId, amount);
      const current = get().contributionsByTontine[tontineId] ?? [];
      const list = [contribution, ...current];
      set((s) => ({
        contributionsByTontine: { ...s.contributionsByTontine, [tontineId]: list },
        contributions: list,
        isLoading: false,
      }));
      return contribution;
    } catch (err) {
      set({ isLoading: false, errorMessage: err instanceof Error ? err.message : "Erreur" });
      throw err;
    }
  },
}));
