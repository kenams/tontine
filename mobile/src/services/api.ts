import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import { API_TIMEOUT, API_URL } from "../config/constants";
import { getToken, removeToken } from "./storage";
import { devLog } from "../utils/logger";

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
  code?: string;
};

type HttpMethod = "get" | "post" | "put" | "delete";

let unauthorizedHandler: (() => Promise<void> | void) | null = null;

/**
 * Permet d'enregistrer un callback global en cas de 401.
 */
export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) {
    devLog(`HTTP ${String(config.method).toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status;

    if (status === 401) {
      await removeToken().catch(() => undefined);

      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }

    if (!error.response) {
      throw new Error("Impossible de joindre le serveur");
    }

    if (status === 422) {
      throw new Error(error.response.data?.error ?? "Donnees invalides");
    }

    throw new Error(error.response.data?.error ?? "Erreur inconnue");
  }
);

/**
 * Helper central pour appeler l'API et ne retourner que la charge utile.
 */
export async function apiCall<T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = (await apiClient.request({
    method,
    url,
    data,
    ...config
  })) as unknown as ApiEnvelope<T>;

  if (!response.success) {
    throw new Error(response.error ?? "Erreur inconnue");
  }

  return (response.data ?? null) as T;
}
