import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "../config/constants";
import type { UserProfile } from "../types/entities";

/**
 * Sauvegarde le token JWT localement.
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch {
    throw new Error("Impossible de sauvegarder la session.");
  }
}

/**
 * Retourne le token JWT localement persiste.
 */
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

/**
 * Supprime le token JWT du stockage local.
 */
export async function removeToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch {
    throw new Error("Impossible de supprimer le token local.");
  }
}

/**
 * Sauvegarde le profil utilisateur en cache local.
 */
export async function saveUser(user: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {
    throw new Error("Impossible de sauvegarder l'utilisateur.");
  }
}

/**
 * Retourne le profil utilisateur cache.
 */
export async function getUser(): Promise<UserProfile | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Supprime l'utilisateur du cache local.
 */
export async function removeUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch {
    throw new Error("Impossible de supprimer l'utilisateur local.");
  }
}

/**
 * Vide l'ensemble du stockage local utilise par l'app.
 */
export async function clearAll(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER)
    ]);
  } catch {
    throw new Error("Impossible de reinitialiser les donnees locales.");
  }
}
