import type { Response } from "express";

import { ErrorCode } from "../types/api.types";

/**
 * Retourne une reponse standard de succes.
 */
export function success<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {})
  });
}

/**
 * Retourne une reponse standard de creation.
 */
export function created<T>(res: Response, data: T, message?: string) {
  return res.status(201).json({
    success: true,
    data,
    ...(message ? { message } : {})
  });
}

/**
 * Retourne une reponse standard d'erreur.
 */
export function error(
  res: Response,
  message: string,
  code?: ErrorCode | string,
  statusCode = 400
) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
    ...(code ? { code } : {})
  });
}

export function notFound(res: Response, message = "Ressource introuvable") {
  return error(res, message, ErrorCode.NOT_FOUND, 404);
}

export function unauthorized(res: Response, message = "Non autorisé") {
  return error(res, message, ErrorCode.UNAUTHORIZED, 401);
}

export function forbidden(res: Response, message = "Accès interdit") {
  return error(res, message, ErrorCode.FORBIDDEN, 403);
}

export function validationError(res: Response, message: string) {
  return error(res, message, ErrorCode.VALIDATION_ERROR, 422);
}

export function serverError(res: Response, message = "Erreur interne du serveur") {
  return error(res, message, ErrorCode.INTERNAL_ERROR, 500);
}

