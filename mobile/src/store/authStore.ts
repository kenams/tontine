import { create } from "zustand";

import { login as loginService, logout as logoutService, refreshSession, register as registerService } from "../services/authService";
import { updateProfile as updateProfileService } from "../services/userService";
import { setUnauthorizedHandler } from "../services/api";
import { useAppStore } from "./appStore";
import { devWarn } from "../utils/logger";
import type { UpdateProfilePayload, UserProfile } from "../types/entities";

type AuthStore = {
  initialized: boolean;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  setInitialized: (value: boolean) => void;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<void>;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (fullName: string, email: string, password: string, phone?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};


export const useAuthStore = create<AuthStore>((set, get) => ({
  initialized: false,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  errorMessage: null,

  setInitialized: (value) => set({ initialized: value }),

  /**
   * Restaure la session depuis le stockage local ou passe en mode deconnecte.
   */
  initializeAuth: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const user = await refreshSession();

      if (user) {
        set({
          initialized: true,
          user,
          isAuthenticated: true,
          isLoading: false,
          errorMessage: null
        });
        return;
      }

      set({
        initialized: true,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        errorMessage: null
      });
    } catch (error) {
      devWarn("Impossible d'initialiser la session, passage en mode deconnecte.", error);
      set({
        initialized: true,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        errorMessage: null
      });
    }
  },

  /**
   * Connecte l'utilisateur via le backend, ou bascule en mode demo en fallback.
   */
  login: async (email, password) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const response = await loginService({ email, password });
      set({ initialized: true, user: response.user, isAuthenticated: true, isLoading: false, errorMessage: null });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Connexion impossible.";
      set({ initialized: true, isAuthenticated: false, isLoading: false, errorMessage: msg });
      return false;
    }
  },

  /**
   * Inscrit l'utilisateur via le backend ou simule l'inscription en demo.
   */
  register: async (email, password, fullName, phone) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const response = await registerService({ email, password, fullName, phone });
      set({ initialized: true, user: response.user, isAuthenticated: true, isLoading: false, errorMessage: null });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Inscription impossible.";
      set({ initialized: true, isAuthenticated: false, isLoading: false, errorMessage: msg });
      return false;
    }
  },

  /**
   * Termine la session locale et distante.
   */
  logout: async () => {
    set({ isLoading: true });

    try {
      await logoutService();
    } catch {
      // La deconnexion distante ne doit pas bloquer la sortie locale.
    }

    set({
      initialized: true,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      errorMessage: null
    });
  },

  /**
   * Met a jour le profil utilisateur, avec fallback local si le backend est indisponible.
   */
  updateProfile: async (data) => {
    const currentUser = get().user;

    if (!currentUser) {
      set({ errorMessage: "Aucun utilisateur connecte." });
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const nextUser = await updateProfileService({
        fullName: data.fullName,
        phone: data.phone ?? data.phoneNumber,
        avatarUrl: data.avatarUrl
      });
      set({ user: nextUser, isLoading: false, errorMessage: null });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Impossible de mettre à jour le profil.";
      set({ isLoading: false, errorMessage: msg });
    }
  },

  clearError: () => set({ errorMessage: null }),

  signIn: async (email, password) => get().login(email, password),
  signUp: async (fullName, email, password, phone) => get().register(email, password, fullName, phone),
  signOut: async () => get().logout()
}));

setUnauthorizedHandler(async () => {
  await useAuthStore.getState().logout();
});
