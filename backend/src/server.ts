import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config";
import { checkStripeConnection } from "./config/stripe";
import { checkSupabaseConnection } from "./config/supabase";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";
import { paymentWebhookRouter } from "./routes/payment.routes";

const app = express();
let supabaseConnected = false;
let stripeConnected = false;

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use("/api", paymentWebhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: config.app.version,
    supabaseConnected,
    stripeConnected
  });
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = config.port;
const NODE_ENV = config.nodeEnv;

async function onStartup() {
  console.log(`🚀 ${config.app.name} Backend v${config.app.version}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environnement: ${NODE_ENV}`);

  supabaseConnected = await checkSupabaseConnection();
  if (!supabaseConnected) {
    console.log("⚠️  Mode démo actif (Supabase non configuré)");
  }

  stripeConnected = await checkStripeConnection();
  if (!stripeConnected) {
    console.log("⚠️  Paiements désactivés (Stripe non configuré)");
  }

  console.log("✅ Serveur prêt");
}

app.listen(PORT, () => {
  void onStartup();
});

