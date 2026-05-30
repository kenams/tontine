export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://tontineapp-web.vercel.app";
export const API_TIMEOUT = 15000;
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const APP_NAME = "Kotizy";
export const APP_VERSION = "2.0.0";

export const THEME = {
  // Kotizy — dark premium
  PRIMARY: "#22c55e",      // emerald-500
  PRIMARY_DARK: "#16a34a", // emerald-600
  GOLD: "#d4a843",         // gold
  DARK: "#080b07",         // ink
  SURFACE: "#111a10",      // surface dark
  SURFACE_CARD: "#1a2419", // glass card
  BACKGROUND: "#080b07",   // bg
  TEXT: "#f0ede8",         // ivory
  MUTED: "#6b7a69",        // smoke
  SUCCESS: "#22c55e",
  ERROR: "#ef4444",
  WARNING: "#f59e0b",
  GREY: "#6b7a69"
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
