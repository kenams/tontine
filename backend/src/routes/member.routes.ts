import { Router } from "express";

import { getMembers, inviteMember, removeMember } from "../controllers/member.controller";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const memberRoutes = Router();

memberRoutes.get("/tontines/:id/members", authMiddleware, getMembers);
memberRoutes.post("/tontines/:id/members/invite", authMiddleware, ...validateBody(["email"]), inviteMember);
memberRoutes.delete("/tontines/:id/members/:uid", authMiddleware, removeMember);

