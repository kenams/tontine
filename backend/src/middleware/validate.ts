import type { RequestHandler } from "express";
import { body, validationResult } from "express-validator";

import { validationError } from "../utils/response";

/**
 * Vérifie la présence des champs obligatoires dans le body.
 */
export function validateBody(requiredFields: string[]): RequestHandler[] {
  return [
    ...requiredFields.map((field) =>
      body(field).exists({ values: "falsy" }).withMessage(`${field} est requis`)
    ),
    (req, res, next) => {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        const messages = result.array().map((entry) => entry.msg).join(", ");
        return validationError(res, `Champs requis: ${messages}`);
      }

      return next();
    }
  ];
}

