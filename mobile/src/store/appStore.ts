import { create } from "zustand";

import { APP_VERSION, API_URL } from "../config/constants";

type AppStore = {
  isBackendAvailable: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  appVersion: string;
  checkBackendHealth: () => Promise<void>;
  setGlobalLoading: (value: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isBackendAvailable: true,
  isDemoMode: false,
  isLoading: false,
  appVersion: APP_VERSION,

  checkBackendHealth: async () => {
    set({ isLoading: true });
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
      clearTimeout(timeout);
      set({ isBackendAvailable: response.ok, isDemoMode: false, isLoading: false });
    } catch {
      // Vrai problème réseau — pas de mode démo en prod
      set({ isBackendAvailable: false, isDemoMode: false, isLoading: false });
    }
  },

  setGlobalLoading: (value) => set({ isLoading: value })
}));
