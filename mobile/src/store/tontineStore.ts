import { create } from "zustand";

import {
  contribute as contributeService,
  createTontine as createTontineService,
  getMyTontines as getMyTontinesService,
  getTontineById as getTontineByIdService,
  inviteMember as inviteMemberService,
  joinTontine as joinTontineService,
  toggleAutoPay as toggleAutoPayService,
} from "../services/tontineService";
import type { Tontine, TontineMember } from "../types/entities";

type TontineStore = {
  tontines: Tontine[];
  currentTontine: Tontine | null;
  isLoading: boolean;
  errorMessage: string | null;
  fetchMyTontines: () => Promise<Tontine[]>;
  fetchTontineById: (id: string) => Promise<Tontine | null>;
  createTontine: (data: {
    name: string;
    description: string;
    contributionAmount: number;
    currency: string;
    frequency: string;
    maxMembers: number;
    rules: string;
  }) => Promise<Tontine>;
  joinTontine: (code: string) => Promise<{ groupId: string }>;
  contribute: (tontineId: string, provider?: string) => Promise<{ ok: boolean; status: string; checkoutUrl?: string }>;
  toggleAutoPay: (tontineId: string, enabled: boolean) => Promise<void>;
  inviteMember: (tontineId: string, email: string) => Promise<void>;
  clearCurrentTontine: () => void;
};

export const useTontineStore = create<TontineStore>((set, get) => ({
  tontines: [],
  currentTontine: null,
  isLoading: false,
  errorMessage: null,

  fetchMyTontines: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const tontines = await getMyTontinesService();
      set({ tontines, isLoading: false });
      return tontines;
    } catch (err) {
      set({ isLoading: false, errorMessage: err instanceof Error ? err.message : "Erreur" });
      return get().tontines;
    }
  },

  fetchTontineById: async (id) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const tontine = await getTontineByIdService(id);
      set({ currentTontine: tontine, isLoading: false });
      return tontine;
    } catch (err) {
      set({ isLoading: false, errorMessage: err instanceof Error ? err.message : "Erreur" });
      return null;
    }
  },

  createTontine: async (data) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const tontine = await createTontineService(data);
      set({ tontines: [tontine, ...get().tontines], currentTontine: tontine, isLoading: false });
      return tontine;
    } catch (err) {
      set({ isLoading: false, errorMessage: err instanceof Error ? err.message : "Erreur" });
      throw err;
    }
  },

  joinTontine: async (code) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await joinTontineService(code);
      // Refresh la liste
      void get().fetchMyTontines();
      set({ isLoading: false });
      return res;
    } catch (err) {
      set({ isLoading: false, errorMessage: err instanceof Error ? err.message : "Code invalide" });
      throw err;
    }
  },

  contribute: async (tontineId, provider = "WALLET") => {
    return contributeService(tontineId, provider);
  },

  toggleAutoPay: async (tontineId, enabled) => {
    await toggleAutoPayService(tontineId, enabled);
    // Refresh si c'est la tontine courante
    if (get().currentTontine?.id === tontineId) {
      await get().fetchTontineById(tontineId);
    }
  },

  inviteMember: async (tontineId, email) => {
    await inviteMemberService(tontineId, email);
  },

  clearCurrentTontine: () => set({ currentTontine: null }),
}));
