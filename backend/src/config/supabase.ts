import { createClient } from "@supabase/supabase-js";

import { config } from "./index";

const fallbackUrl = "https://placeholder.supabase.co";
const fallbackAnonKey = "placeholder-anon-key";
const fallbackServiceKey = "placeholder-service-role-key";

export const isSupabaseAnonConfigured = Boolean(config.supabase.url && config.supabase.anonKey);
export const isSupabaseAdminConfigured = Boolean(config.supabase.url && config.supabase.serviceKey);

export const supabaseAnon = createClient(
  config.supabase.url || fallbackUrl,
  config.supabase.anonKey || fallbackAnonKey
);

export const supabaseAdmin = createClient(
  config.supabase.url || fallbackUrl,
  config.supabase.serviceKey || fallbackServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Vérifie si Supabase répond correctement (anon key suffit pour le ping).
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseAnonConfigured) {
    console.log("⚠️ Supabase indisponible, mode démo actif");
    return false;
  }

  try {
    const { error } = await supabaseAnon.from("users").select("id").limit(1);
    // RLS peut bloquer (PGRST116/42501) mais signifie que Supabase répond
    if (error) {
      const isRlsBlock = error.code === "PGRST116" || error.code === "42501" || error.message.includes("row-level");
      const isNetworkErr = error.message.includes("fetch failed") || error.message.includes("ENOTFOUND");
      if (isRlsBlock) {
        console.log("✅ Supabase connecté (RLS actif — anon key)");
        return true;
      }
      if (isNetworkErr) {
        console.log("⚠️ Supabase configuré mais réseau local bloqué — mode démo actif (OK en production)");
        return false;
      }
      console.log("⚠️ Supabase erreur:", error.message);
      return false;
    }
    console.log("✅ Supabase connecté (anon key)");
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("fetch failed") || msg.includes("ENOTFOUND")) {
      console.log("⚠️ Supabase configuré mais réseau local bloqué — mode démo actif (OK en production)");
    } else {
      console.log("⚠️ Supabase indisponible:", msg.slice(0, 80));
    }
    return false;
  }
}
