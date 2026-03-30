import rateLimit from "express-rate-limit";

import { ErrorCode } from "../types/api.types";

const limitMessage = {
  success: false,
  data: null,
  error: "Trop de requêtes, veuillez réessayer plus tard.",
  code: ErrorCode.FORBIDDEN
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage
});

