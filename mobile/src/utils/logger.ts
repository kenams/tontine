/**
 * Journalise un message uniquement en environnement de développement.
 */
export function devLog(message: string, payload?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (typeof payload === "undefined") {
    console.info(`[TontineApp] ${message}`);
    return;
  }

  console.info(`[TontineApp] ${message}`, payload);
}

/**
 * Journalise un avertissement uniquement en développement.
 */
export function devWarn(message: string, payload?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (typeof payload === "undefined") {
    console.warn(`[TontineApp] ${message}`);
    return;
  }

  console.warn(`[TontineApp] ${message}`, payload);
}
