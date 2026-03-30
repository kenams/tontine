import type { ErrorRequestHandler, RequestHandler } from "express";

import { notFound, serverError } from "../utils/response";

/**
 * Gère les erreurs remontées par Express.
 */
export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[api-error]", err);

  if (typeof err?.status === "number") {
    return res.status(err.status).json({
      success: false,
      data: null,
      error: err.message || "Erreur inconnue",
      code: err.code || "ERROR"
    });
  }

  return serverError(res, err instanceof Error ? err.message : "Erreur interne du serveur");
};

/**
 * Gère les routes introuvables.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  return notFound(res, `Route ${req.method} ${req.path} introuvable`);
};

