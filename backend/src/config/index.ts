import "dotenv/config";

type AppConfig = {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  app: {
    name: string;
    version: string;
    frontendUrl: string;
  };
};

function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`La variable d'environnement ${key} est obligatoire.`);
  }

  return value;
}

export const config: AppConfig = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: getRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY || ""
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ""
  },
  app: {
    name: process.env.APP_NAME || "TontineApp",
    version: process.env.APP_VERSION || "1.0.0",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:8082"
  }
};

