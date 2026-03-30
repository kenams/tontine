import { Router } from "express";

import { getContributions, makeContribution } from "../controllers/contribution.controller";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const contributionRoutes = Router();

contributionRoutes.get("/tontines/:id/contributions", authMiddleware, getContributions);
contributionRoutes.post("/tontines/:id/contributions", authMiddleware, ...validateBody(["amount"]), makeContribution);

