import type { UserProfile } from "../types/entities";
import { apiCall } from "./api";
import { mapUser } from "./mappers";
import { clearAll, getToken, getUser, saveToken, saveUser } from "./storage";

type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

export type AuthResponse = {
  user: UserProfile;
  token: string;
};

type AuthApiPayload = {
  user: BackendUser;
  token: string;
};

type GetMePayload = {
  user: BackendUser;
};

/**
 * Authentifie l'utilisateur et persiste sa session.
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const payload = await apiCall<AuthApiPayload>("post", "/api/auth/login", data);
  const user = mapUser(payload.user);

  await saveToken(payload.token);
  await saveUser(user);

  return { user, token: payload.token };
}

/**
 * Cree un compte puis persiste la session associee.
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const payload = await apiCall<AuthApiPayload>("post", "/api/auth/register", data);
  const user = mapUser(payload.user);

  await saveToken(payload.token);
  await saveUser(user);

  return { user, token: payload.token };
}

/**
 * Termine la session courante et vide le cache local.
 */
export async function logout(): Promise<void> {
  try {
    await apiCall<null>("post", "/api/auth/logout");
  } catch {
    // La deconnexion distante peut echouer silencieusement en mode demo.
  }

  await clearAll();
}

/**
 * Recupere le profil de l'utilisateur connecte depuis le backend.
 */
export async function getMe(): Promise<UserProfile> {
  const payload = await apiCall<GetMePayload>("get", "/api/auth/me");
  const user = mapUser(payload.user);

  await saveUser(user);
  return user;
}

/**
 * Tente de restaurer une session a partir du stockage local.
 */
export async function refreshSession(): Promise<UserProfile | null> {
  const token = await getToken();

  if (!token) {
    return null;
  }

  try {
    return await getMe();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";

    if (message === "Impossible de joindre le serveur") {
      return await getUser();
    }

    await clearAll();
    return null;
  }
}
