/**
 * Simule une latence reseau pour garder un comportement proche du futur backend.
 */
export async function wait(duration = 350) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Genere un identifiant simple suffisant pour le mode demonstration.
 */
export function createDemoId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

