import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";

import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";
import type { RootStackParamList } from "../types/navigation";

type AuthActionResult = {
  success: boolean;
  message?: string;
};

/**
 * Hook de confort pour consommer l'authentification avec gestion d'erreurs uniforme.
 */
export function useAuth() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const loginAction = useAuthStore((state) => state.login);
  const registerAction = useAuthStore((state) => state.register);
  const logoutAction = useAuthStore((state) => state.logout);
  const isOnline = useAppStore((state) => state.isBackendAvailable);

  async function login(email: string, password: string): Promise<AuthActionResult> {
    try {
      const success = await loginAction(email, password);
      return success ? { success: true } : { success: false, message: "Connexion impossible." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur de connexion."
      };
    }
  }

  async function register(
    data: { email: string; password: string; fullName: string; phone?: string }
  ): Promise<AuthActionResult> {
    try {
      const success = await registerAction(data.email, data.password, data.fullName, data.phone);
      return success ? { success: true } : { success: false, message: "Inscription impossible." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur d'inscription."
      };
    }
  }

  async function logout() {
    await logoutAction();
  }

  function requireAuth() {
    if (!isAuthenticated) {
      navigation.navigate("AuthStack", { screen: "Login" });
      return false;
    }

    return true;
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isOnline,
    login,
    register,
    logout,
    requireAuth
  };
}
