import { Router } from "express";

import { getProfile, updateProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth";

export const userRoutes = Router();

userRoutes.get("/users/me", authMiddleware, getProfile);
userRoutes.put("/users/me", authMiddleware, updateProfile);

