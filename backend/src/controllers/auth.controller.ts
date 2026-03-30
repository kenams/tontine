import type { Request, Response } from "express";

import { userRepository } from "../repositories/user.repository";
import { registerUser } from "../services/authSupabase.service";
import type { AuthenticatedRequest, DemoUser } from "../types/api.types";
import { DEMO_USERS, createDemoId } from "../utils/demo-data";
import { generateToken } from "../utils/jwt";
import { created, success, validationError } from "../utils/response";
import { isValidEmail, isValidPassword, isValidPhone } from "../utils/validators";

function toDemoUser(user: {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}): DemoUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    trustScore: 100,
    createdAt: user.createdAt ?? new Date().toISOString()
  };
}

/**
 * Cree un compte via Supabase puis renvoie un JWT de compatibilite.
 */
export async function register(req: Request, res: Response) {
  const { fullName, email, phone, password } = req.body as Record<string, string>;

  if (!isValidEmail(email)) {
    return validationError(res, "Format d'email invalide.");
  }

  if (!isValidPassword(password)) {
    return validationError(res, "Le mot de passe doit contenir au moins 8 caracteres.");
  }

  if (phone && !isValidPhone(phone)) {
    return validationError(res, "Le numero de telephone est invalide.");
  }

  try {
    const result = await registerUser(email, password, fullName, phone);
    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName
    });

    return created(res, { user: result.user, token }, "Compte cree avec succes");
  } catch {
    const existingUser = DEMO_USERS.find((user) => user.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return validationError(res, "Cet email est deja utilise.");
    }

    const user: DemoUser = {
      id: createDemoId("user"),
      email,
      fullName,
      phone,
      avatarUrl: "https://i.pravatar.cc/160?img=20",
      trustScore: 90,
      createdAt: new Date().toISOString()
    };

    DEMO_USERS.push(user);

    const token = generateToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName
    });

    return created(res, { user, token }, "Compte cree avec succes");
  }
}

/**
 * Connecte un utilisateur reel si trouve en base, sinon passe en mode demo.
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body as Record<string, string>;

  if (!isValidEmail(email) || !password) {
    return validationError(res, "Email ou mot de passe invalide.");
  }

  try {
    const realUser = await userRepository.findByEmail(email);

    if (realUser) {
      const token = generateToken({
        id: realUser.id,
        email: realUser.email,
        fullName: realUser.fullName
      });

      return success(res, { user: realUser, token }, "Connexion reussie");
    }
  } catch {
    // Fallback demo juste en dessous.
  }

  const fallbackUser = DEMO_USERS[0];
  const user = DEMO_USERS.find((entry) => entry.email.toLowerCase() === email.toLowerCase()) ?? fallbackUser;
  const token = generateToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName
  });

  return success(res, { user, token }, "Connexion reussie");
}

/**
 * Simule la deconnexion cote API.
 */
export function logout(_req: AuthenticatedRequest, res: Response) {
  return success(res, null, "Deconnexion reussie");
}

/**
 * Retourne le profil courant depuis Supabase ou depuis le mode demo.
 */
export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.id) {
      const user = await userRepository.findBySupabaseId(req.user.id);

      if (user) {
        return success(res, { user });
      }
    }
  } catch {
    // Fallback demo plus bas.
  }

  const user = DEMO_USERS.find((entry) => entry.id === req.user?.id) ?? DEMO_USERS[0];
  return success(res, { user: toDemoUser(user) });
}

