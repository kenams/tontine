import type { NextFunction, Response } from "express";

import { userRepository } from "../repositories/user.repository";
import { verifySupabaseToken } from "../services/authSupabase.service";
import type { AuthenticatedRequest } from "../types/api.types";
import { extractTokenFromHeader, verifyToken } from "../utils/jwt";
import { unauthorized } from "../utils/response";

async function resolveAuthenticatedUser(token: string) {
  const supabaseUser = await verifySupabaseToken(token);

  if (supabaseUser) {
    const profile = await userRepository.findBySupabaseId(supabaseUser.id);

    return {
      user: {
        id: supabaseUser.id,
        email: profile?.email ?? supabaseUser.email ?? "",
        fullName: profile?.fullName ?? String(supabaseUser.user_metadata.full_name ?? "Utilisateur")
      },
      mode: "supabase" as const
    };
  }

  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return null;
  }

  return {
    user: {
      id: decodedToken.id,
      email: decodedToken.email,
      fullName: decodedToken.fullName
    },
    mode: "demo" as const
  };
}

/**
 * Verifie un token Supabase puis tente le JWT de demonstration en fallback.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return unauthorized(res);
  }

  const resolvedUser = await resolveAuthenticatedUser(token);

  if (!resolvedUser) {
    return unauthorized(res, "Token invalide");
  }

  req.user = resolvedUser.user;
  console.log(resolvedUser.mode === "supabase" ? "Auth via Supabase" : "Auth via JWT demo");

  return next();
}

/**
 * Authentifie si un token existe, sinon continue sans bloquer.
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return next();
  }

  const resolvedUser = await resolveAuthenticatedUser(token);

  if (resolvedUser) {
    req.user = resolvedUser.user;
  }

  return next();
}

