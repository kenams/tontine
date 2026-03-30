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
 * Vérifie si Supabase répond correctement avec la configuration courante.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseAdminConfigured) {
    console.log("⚠️ Supabase indisponible, mode démo actif");
    return false;
  }

  try {
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);

    if (error) {
      console.log("⚠️ Supabase indisponible, mode démo actif");
      return false;
    }

    console.log("✅ Supabase connecté");
    return true;
  } catch {
    console.log("⚠️ Supabase indisponible, mode démo actif");
    return false;
  }
}
