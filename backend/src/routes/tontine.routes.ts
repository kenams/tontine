import { Router } from "express";

import {
  createTontine,
  deleteTontine,
  getMyTontines,
  getTontineById,
  updateTontine
} from "../controllers/tontine.controller";
import { authMiddleware } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";

export const tontineRoutes = Router();

tontineRoutes.get("/", authMiddleware, apiLimiter, getMyTontines);
tontineRoutes.post(
  "/",
  authMiddleware,
  ...validateBody(["name", "amount", "frequency", "maxMembers", "startDate"]),
  createTontine
);
tontineRoutes.get("/:id", authMiddleware, getTontineById);
tontineRoutes.put("/:id", authMiddleware, updateTontine);
tontineRoutes.delete("/:id", authMiddleware, deleteTontine);

