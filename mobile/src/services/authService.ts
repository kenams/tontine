import type { UserProfile } from "../types/entities";
import { apiCall } from "./api";
import { clearAll, getToken, getUser, saveToken, saveUser } from "./storage";

type KotizUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: string;
};

type LoginResponse = {
  ok: boolean;
  token: string;
  user: KotizUser;
  role: string;
};

type MeResponse = {
  user: {
    userId: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  };
};

export type AuthResponse = {
  user: UserProfile;
  token: string;
};

function mapKotizUser(u: KotizUser): UserProfile {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone ?? undefined,
    avatarUrl: undefined,
    createdAt: new Date().toISOString(),
  };
}

export async function login(data: { email: string; password: string }): Promise<AuthResponse> {
  const res = await apiCall<LoginResponse>("post", "/api/auth/login", data);
  const user = mapKotizUser(res.user);
  await saveToken(res.token);
  await saveUser(user);
  return { user, token: res.token };
}

export async function register(data: { fullName: string; email: string; password: string; phone?: string }): Promise<AuthResponse> {
  const res = await apiCall<LoginResponse>("post", "/api/auth/register", {
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    phone: data.phone ?? "",
    currency: "EUR",
  });
  const user = mapKotizUser(res.user);
  await saveToken(res.token);
  await saveUser(user);
  return { user, token: res.token };
}

export async function logout(): Promise<void> {
  try {
    await apiCall<void>("post", "/api/auth/logout");
  } catch {
    // Silencieux
  }
  await clearAll();
}

export async function getMe(): Promise<UserProfile> {
  const res = await apiCall<MeResponse>("get", "/api/auth/me");
  const u = res.user;
  const user: UserProfile = {
    id: u.userId,
    email: u.email,
    fullName: u.fullName,
    avatarUrl: undefined,
    createdAt: new Date().toISOString(),
  };
  await saveUser(user);
  return user;
}

export async function refreshSession(): Promise<UserProfile | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    return await getMe();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Impossible de joindre le serveur") return await getUser();
    await clearAll();
    return null;
  }
}
