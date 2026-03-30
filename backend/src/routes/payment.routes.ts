import express from "express";

import { confirmPayment, createIntent, paymentHistory, paymentWebhook } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth";

export const paymentRoutes = express.Router();
export const paymentWebhookRouter = express.Router();

paymentRoutes.post("/payments/create-intent", authMiddleware, createIntent);
paymentRoutes.post("/payments/confirm", authMiddleware, confirmPayment);
paymentRoutes.get("/payments/history", authMiddleware, paymentHistory);

paymentWebhookRouter.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook
);

