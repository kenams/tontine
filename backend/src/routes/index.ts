import { Router } from "express";

import { authRoutes } from "./auth.routes";
import { chatRoutes } from "./chat.routes";
import { contributionRoutes } from "./contribution.routes";
import { memberRoutes } from "./member.routes";
import { notificationRoutes } from "./notification.routes";
import { paymentRoutes } from "./payment.routes";
import { tontineRoutes } from "./tontine.routes";
import { userRoutes } from "./user.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/tontines", tontineRoutes);
apiRouter.use("/", memberRoutes);
apiRouter.use("/", contributionRoutes);
apiRouter.use("/", chatRoutes);
apiRouter.use("/", notificationRoutes);
apiRouter.use("/", userRoutes);
apiRouter.use("/", paymentRoutes);

export { apiRouter };
