import { create } from "zustand";

import {
  cloneDemoTontines,
  demoContributionsByTontine,
  demoMembersByTontine,
  demoPayoutsByTontine
} from "../data/demo-data";
import {
  createTontine as createTontineService,
  getMyTontines as getMyTontinesService,
  getTontineById as getTontineByIdService,
  inviteMember as inviteMemberService
} from "../services/tontineService";
import { useAppStore } from "./appStore";
import type { CreateTontinePayload, Tontine, TontineMember } from "../types/entities";
import { createDemoId } from "./store-utils";
import { devLog } from "../utils/logger";

type TontineStore = {
  tontines: Tontine[];
  currentTontine: Tontine | null;
  isLoading: boolean;
  errorMessage: string | null;
  fetchMyTontines: () => Promise<Tontine[]>;
  createTontine: (data: CreateTontinePayload) => Promise<Tontine>;
  joinTontine: (code: string) => Promise<Tontine>;
  fetchTontineById: (id: string) => Promise<Tontine | null>;
  inviteMember: (tontineId: string, email: string) => Promise<TontineMember>;
  clearCurrentTontine: () => void;
};

const initialTontines = cloneDemoTontines();

function buildDemoDetailTontine(id: string): Tontine | null {
  const tontine = initialTontines.find((item) => item.id === id);

  if (!tontine) {
    return null;
  }

  const members = demoMembersByTontine[id] ?? [];
  const contributions = demoContributionsByTontine[id] ?? [];
  const distributions = demoPayoutsByTontine[id] ?? [];
  const paidMembers = members.filter((member) => member.paymentStatus === "paid").length;

  return {
    ...tontine,
    members: members.map((member) => ({ ...member })),
    contributions: contributions.map((contribution) => ({ ...contribution })),
    distributions: distributions.map((distribution) => ({ ...distribution })),
    progression: {
      paidMembers,
      totalMembers: tontine.membersCount
    }
  };
}

/**
 * Store des tontines avec fallback automatique vers les données de démo.
 */
export const useTontineStore = create<TontineStore>((set, get) => ({
  tontines: initialTontines,
  currentTontine: null,
  isLoading: false,
  errorMessage: null,

  fetchMyTontines: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const tontines = await getMyTontinesService();

      set({
        tontines,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return tontines;
    } catch {
      const tontines = cloneDemoTontines();
      devLog("Mode demo active pour les tontines");

      set({
        tontines,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return tontines;
    }
  },

  createTontine: async (data) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const createdTontine = await createTontineService(data);
      const tontines = [createdTontine, ...get().tontines];

      set({
        tontines,
        currentTontine: createdTontine,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return createdTontine;
    } catch {
      const createdTontine: Tontine = {
        id: createDemoId("t"),
        name: data.name,
        description: data.description?.trim() || "Nouvelle tontine en preparation.",
        contributionAmount: data.contributionAmount,
        currency: "EUR",
        frequency: data.frequency,
        membersCount: data.membersCount,
        currentRound: 1,
        totalRounds: data.membersCount,
        nextPayoutDate: data.startDate ?? new Date().toISOString(),
        status: "draft",
        isPrivate: data.isPrivate ?? true,
        maxMembers: data.membersCount,
        totalPot: data.membersCount * data.contributionAmount,
        currentBeneficiary: "A definir",
        myTurn: 0,
        startDate: data.startDate ?? new Date().toISOString(),
        joinCode: `TONT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        members: [],
        contributions: [],
        distributions: [],
        progression: {
          paidMembers: 0,
          totalMembers: data.membersCount
        }
      };

      const tontines = [createdTontine, ...get().tontines];
      devLog("Mode demo active pour la creation de tontine");

      set({
        tontines,
        currentTontine: createdTontine,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return createdTontine;
    }
  },

  joinTontine: async (code) => {
    set({ isLoading: true, errorMessage: null });

    const existingTontine = get().tontines.find(
      (tontine) => tontine.joinCode?.toUpperCase() === code.trim().toUpperCase()
    );

    if (!existingTontine) {
      set({
        isLoading: false,
        errorMessage: "Aucune tontine ne correspond a ce code."
      });
      throw new Error("Aucune tontine ne correspond a ce code.");
    }

    set({
      currentTontine: existingTontine,
      isLoading: false,
      errorMessage: null
    });

    return { ...existingTontine };
  },

  fetchTontineById: async (id) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const tontine = await getTontineByIdService(id);

      set({
        currentTontine: tontine,
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return tontine;
    } catch {
      const tontine = buildDemoDetailTontine(id);
      devLog("Mode demo active pour le detail de tontine");

      set({
        currentTontine: tontine,
        isLoading: false,
        errorMessage: tontine ? null : "Tontine introuvable."
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return tontine;
    }
  },

  inviteMember: async (tontineId, email) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const member = await inviteMemberService(tontineId, email);
      const currentTontine = get().currentTontine;

      if (currentTontine?.id === tontineId) {
        set({
          currentTontine: {
            ...currentTontine,
            members: [...(currentTontine.members ?? []), member]
          },
          isLoading: false,
          errorMessage: null
        });
      } else {
        set({ isLoading: false, errorMessage: null });
      }

      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });
      return member;
    } catch {
      const fallbackMember: TontineMember = {
        id: createDemoId("member"),
        tontineId,
        userId: createDemoId("user"),
        fullName: email.split("@")[0] || "Nouveau membre",
        role: "member",
        payoutOrder: (get().currentTontine?.members?.length ?? 0) + 1,
        paymentStatus: "pending",
        joinedAt: new Date().toISOString()
      };
      const currentTontine = get().currentTontine;

      if (currentTontine?.id === tontineId) {
        set({
          currentTontine: {
            ...currentTontine,
            members: [...(currentTontine.members ?? []), fallbackMember]
          },
          isLoading: false,
          errorMessage: null
        });
      } else {
        set({ isLoading: false, errorMessage: null });
      }

      devLog("Mode demo active pour l'invitation de membre");
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });
      return fallbackMember;
    }
  },

  clearCurrentTontine: () => set({ currentTontine: null, errorMessage: null })
}));
