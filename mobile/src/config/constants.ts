export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
export const API_TIMEOUT = 10000;
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const APP_NAME = "TontineApp";
export const APP_VERSION = "1.0.0";

export const THEME = {
  PRIMARY: "#E8500A",
  DARK: "#1A1A2E",
  BACKGROUND: "#FFF3EE",
  SUCCESS: "#1E7E34",
  ERROR: "#DC3545",
  WARNING: "#FFC107",
  GREY: "#888888"
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  CHAT_LIMIT: 50
} as const;

export const STORAGE_KEYS = {
  TOKEN: "@tontine/token",
  USER: "@tontine/user"
} as const;
