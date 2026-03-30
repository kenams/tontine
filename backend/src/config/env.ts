import { config } from "./index";

export const env = {
  port: config.port,
  supabaseUrl: config.supabase.url,
  supabaseAnonKey: config.supabase.anonKey,
  supabaseServiceRoleKey: config.supabase.serviceKey,
  stripeSecretKey: config.stripe.secretKey,
  stripeWebhookSecret: config.stripe.webhookSecret
};
