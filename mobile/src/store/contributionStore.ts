import { create } from "zustand";

import { cloneDemoContributions } from "../data/demo-data";
import { getContributions as getContributionsService, makeContribution as makeContributionService } from "../services/contributionService";
import { useAppStore } from "./appStore";
import type { TontineContribution } from "../types/entities";
import { createDemoId } from "./store-utils";
import { devLog } from "../utils/logger";

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

function computeContributionSummary(contributions: TontineContribution[]) {
  const sortedDueDates = contributions
    .map((contribution) => contribution.dueDate)
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

  const nextDueDate = sortedDueDates.find((dueDate) => new Date(dueDate).getTime() >= Date.now()) ?? null;
  const totalSaved = contributions
    .filter((contribution) => contribution.status === "paid")
    .reduce((total, contribution) => total + contribution.amount, 0);

  return { nextDueDate, totalSaved };
}

const initialContributions = cloneDemoContributions();

export const useContributionStore = create<ContributionStore>((set, get) => ({
  contributions: [],
  contributionsByTontine: initialContributions,
  nextDueDate: null,
  totalSaved: 0,
  isLoading: false,
  errorMessage: null,

  fetchContributions: async (tontineId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const payload = await getContributionsService(tontineId);

      set((state) => ({
        contributions: payload.contributions,
        contributionsByTontine: {
          ...state.contributionsByTontine,
          [tontineId]: payload.contributions
        },
        nextDueDate: payload.stats.nextDueDate,
        totalSaved: payload.stats.totalPaid,
        isLoading: false,
        errorMessage: null
      }));
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return payload.contributions;
    } catch {
      const contributions = get().contributionsByTontine[tontineId]?.map((item) => ({ ...item })) ?? [];
      const summary = computeContributionSummary(contributions);
      devLog("Mode demo active pour les cotisations");

      set({
        contributions,
        nextDueDate: summary.nextDueDate,
        totalSaved: summary.totalSaved,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return contributions;
    }
  },

  makeContribution: async (tontineId, amount) => {
    set({ isLoading: true, errorMessage: null });

    const optimisticContribution: TontineContribution = {
      id: createDemoId("contribution"),
      tontineId,
      memberId: "user-001",
      amount,
      dueDate: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      status: "paid"
    };

    try {
      const contribution = await makeContributionService(tontineId, amount);
      const currentEntries = get().contributionsByTontine[tontineId] ?? [];
      const contributionsByTontine = {
        ...get().contributionsByTontine,
        [tontineId]: [contribution, ...currentEntries]
      };
      const contributions = contributionsByTontine[tontineId];
      const summary = computeContributionSummary(contributions);

      set({
        contributionsByTontine,
        contributions,
        nextDueDate: summary.nextDueDate,
        totalSaved: summary.totalSaved,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return contribution;
    } catch {
      const currentEntries = get().contributionsByTontine[tontineId] ?? [];
      const contributionsByTontine = {
        ...get().contributionsByTontine,
        [tontineId]: [optimisticContribution, ...currentEntries]
      };
      const contributions = contributionsByTontine[tontineId];
      const summary = computeContributionSummary(contributions);
      devLog("Mode demo active pour l'enregistrement d'une cotisation");

      set({
        contributionsByTontine,
        contributions,
        nextDueDate: summary.nextDueDate,
        totalSaved: summary.totalSaved,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return optimisticContribution;
    }
  }
}));
