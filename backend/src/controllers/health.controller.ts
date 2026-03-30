import type { Request, Response } from "express";

import { env } from "../config/env";
import { isSupabaseAdminConfigured } from "../config/supabase";

export function getHealth(_request: Request, response: Response) {
  response.json({
    ok: true,
    service: "TontineApp API",
    env: env.port,
    supabaseConfigured: isSupabaseAdminConfigured,
    timestamp: new Date().toISOString()
  });
}
