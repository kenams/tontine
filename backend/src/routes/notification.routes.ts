import { Router } from "express";

import {
  getNotifications,
  markAllAsRead,
  markAsRead
} from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth";

export const notificationRoutes = Router();

notificationRoutes.get("/notifications", authMiddleware, getNotifications);
notificationRoutes.put("/notifications/:id/read", authMiddleware, markAsRead);
notificationRoutes.put("/notifications/read-all", authMiddleware, markAllAsRead);

