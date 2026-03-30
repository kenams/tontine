import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config";
import { apiRouter } from "./routes";
import { paymentWebhookRouter } from "./routes/payment.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: "*" }));
  app.use("/api", paymentWebhookRouter);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: config.app.version
    });
  });

  app.use("/api", apiRouter);

  return app;
}

