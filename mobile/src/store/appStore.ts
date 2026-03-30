import { create } from "zustand";

import { APP_VERSION, API_URL } from "../config/constants";
import { devLog } from "../utils/logger";

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
      const response = await fetch(`${API_URL}/health`);

      if (!response.ok) {
        throw new Error("Backend indisponible");
      }

      set({
        isBackendAvailable: true,
        isDemoMode: false,
        isLoading: false
      });
      devLog("Backend disponible");
    } catch {
      set({
        isBackendAvailable: false,
        isDemoMode: true,
        isLoading: false
      });
      devLog("Backend indisponible, mode demo active");
    }
  },

  setGlobalLoading: (value) => set({ isLoading: value })
}));
