/**
 * Vérifie qu'un email respecte un format simple.
 */
export function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

/**
 * Vérifie qu'un numéro de téléphone reste exploitable.
 */
export function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return (phone.startsWith("+") || phone.startsWith("0")) && digits.length >= 10;
}

/**
 * Vérifie qu'un mot de passe est suffisamment long.
 */
export function isValidPassword(password: string) {
  return password.trim().length >= 8;
}

/**
 * Vérifie qu'une date est parseable.
 */
export function isValidDate(date: string) {
  return !Number.isNaN(new Date(date).getTime());
}

/**
 * Vérifie qu'une valeur est un nombre strictement positif.
 */
export function isPositiveNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0;
  }

  return false;
}

/**
 * Retourne les champs requis absents ou vides.
 */
export function validateRequired(fields: Record<string, unknown>) {
  return Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || value === "")
    .map(([field]) => field);
}

