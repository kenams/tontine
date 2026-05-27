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
 * Resolve le profil public a partir d'un token Supabase.
 */
export async function loginUser(token: string): Promise<RepositoryUser | null> {
  const authUser = await verifySupabaseToken(token);

  if (!authUser) {
    return null;
  }

  return userRepository.findBySupabaseId(authUser.id);
}

