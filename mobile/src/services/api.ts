import axios, { AxiosError } from "axios";

import { API_TIMEOUT, API_URL } from "../config/constants";
import { getToken, removeToken } from "./storage";
import { devLog } from "../utils/logger";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

let unauthorizedHandler: (() => Promise<void> | void) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (__DEV__) devLog(`HTTP ${String(config.method).toUpperCase()} ${config.url ?? ""}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<{ error?: string }>) => {
    const status = error.response?.status;

    if (status === 401) {
      await removeToken().catch(() => undefined);
      if (unauthorizedHandler) await unauthorizedHandler();
    }

    if (!error.response) throw new Error("Impossible de joindre le serveur");

    const msg = error.response.data?.error ?? `Erreur ${status ?? "inconnue"}`;
    throw new Error(msg);
  }
);

// Appel direct — retourne le body complet
export async function apiCall<T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
): Promise<T> {
  return apiClient.request({ method, url, data }) as unknown as T;
}
