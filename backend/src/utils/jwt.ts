import jwt from "jsonwebtoken";

import type { AuthenticatedUser, JwtPayloadData } from "../types/api.types";

const JWT_SECRET = process.env.JWT_SECRET || "tontineapp_secret_key_super_secure_2025";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Génère un token JWT signé pour l'utilisateur.
 */
export function generateToken(payload: AuthenticatedUser) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

/**
 * Vérifie un token JWT et retourne sa charge utile.
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayloadData;
  } catch {
    return null;
  }
}

/**
 * Extrait le token depuis l'en-tête Authorization.
 */
export function extractTokenFromHeader(authHeader: string | undefined) {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token ? token : null;
}
