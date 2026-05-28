import { supabaseAnon } from "../config/supabase";
import { userRepository, type RepositoryUser } from "../repositories/user.repository";

type RegisterUserResult = {
  user: RepositoryUser;
  session: null;
};

/**
 * Cree un utilisateur via Supabase Auth (anon key — pas besoin de service_role).
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  phone?: string
): Promise<RegisterUserResult> {
  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone }
    }
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Impossible de creer l'utilisateur Supabase.");
  }

  const profile =
    (await userRepository.findBySupabaseId(data.user.id)) ??
    (await userRepository.createOrUpdate({
      id: data.user.id,
      email,
      fullName,
      phone
    }));

  return { user: profile, session: null };
}

/**
 * Verifie un access token Supabase (anon key suffit).
 */
export async function verifySupabaseToken(token: string) {
  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/**
 * Authentifie un utilisateur via Supabase avec email + mot de passe.
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ user: RepositoryUser; supabaseSession: unknown }> {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    throw new Error(error?.message || "Email ou mot de passe incorrect.");
  }

  const profile =
    (await userRepository.findBySupabaseId(data.user.id)) ??
    (await userRepository.createOrUpdate({
      id: data.user.id,
      email,
      fullName: String(data.user.user_metadata?.full_name ?? "Utilisateur")
    }));

  return { user: profile, supabaseSession: data.session };
}

/**
 * Resolve le profil public a partir d'un token Supabase.
 */
export async function loginUser(token: string): Promise<RepositoryUser | null> {
  const authUser = await verifySupabaseToken(token);

  if (!authUser) {
    return null;
  }

  return userRepository.findBySupabaseId(authUser.id);
}

