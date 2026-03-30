import { Router } from "express";

import { getMe, login, logout, register } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, ...validateBody(["fullName", "email", "password"]), register);
authRoutes.post("/login", authLimiter, ...validateBody(["email", "password"]), login);
authRoutes.post("/logout", authMiddleware, logout);
authRoutes.get("/me", authMiddleware, getMe);

