import type { UserProfile } from "../types/entities";
import { apiCall } from "./api";
import { mapUser } from "./mappers";
import { saveUser } from "./storage";

type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type UserStats = {
  tontinesCount: number;
  totalSaved: number;
  punctualityRate: number;
};

export type ProfileResponse = {
  user: UserProfile;
  stats: UserStats;
};

export type UpdateProfileRequest = {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
};

type BackendProfilePayload = {
  user: BackendUser;
  stats: UserStats;
};

/**
 * Retourne le profil enrichi de l'utilisateur.
 */
export async function getProfile(): Promise<ProfileResponse> {
  const payload = await apiCall<BackendProfilePayload>("get", "/api/users/me");
  const user = mapUser(payload.user);

  await saveUser(user);

  return {
    user,
    stats: payload.stats
  };
}

/**
 * Met a jour le profil utilisateur.
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const payload = await apiCall<{ user: BackendUser }>("put", "/api/users/me", data);
  const user = mapUser(payload.user);

  await saveUser(user);
  return user;
}
