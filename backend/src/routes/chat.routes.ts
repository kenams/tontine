import { Router } from "express";

import { getMessages, sendMessage } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const chatRoutes = Router();

chatRoutes.get("/tontines/:id/messages", authMiddleware, getMessages);
chatRoutes.post("/tontines/:id/messages", authMiddleware, ...validateBody(["content"]), sendMessage);

