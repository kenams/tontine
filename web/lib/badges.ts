import "server-only";
import { prisma } from "@/lib/db";

type BadgeCode = "founder" | "on-time" | "consistent" | "high-trust" | "elite" | "social" | "veteran";

const BADGE_DEFS: Record<BadgeCode, { name: string; description: string; color: string }> = {
  "founder":    { name: "Fondateur",        description: "A créé sa première tontine",                  color: "gold" },
  "on-time":    { name: "Ponctuel",          description: "Premier paiement effectué à l'heure",         color: "emerald" },
  "consistent": { name: "Régulier",          description: "5 paiements consécutifs sans retard",          color: "emerald" },
  "high-trust": { name: "Confiance Gold",    description: "Score de confiance ≥ 85",                    color: "gold" },
  "elite":      { name: "Élite Kotizy",      description: "Score de confiance ≥ 95 — membre exemplaire", color: "emerald" },
  "social":     { name: "Connecté",          description: "Membre actif dans 3 groupes ou plus",         color: "ivory" },
  "veteran":    { name: "Vétéran",           description: "10 cotisations complétées",                   color: "gold" },
};

async function ensureBadge(code: BadgeCode) {
  const def = BADGE_DEFS[code];
  return prisma.badge.upsert({
    where: { code },
    create: { code, ...def },
    update: { name: def.name, description: def.description, color: def.color }
  });
}

async function awardIfMissing(userId: string, code: BadgeCode) {
  const badge = await ensureBadge(code);
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } }
  });
  if (existing) return false;
  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  await prisma.notification.create({
    data: {
      userId,
      title: `Badge obtenu : ${badge.name}`,
      body: badge.description,
      type: "BADGE"
    }
  });
  return true;
}

export async function checkBadgesAfterPayment(userId: string) {
  const [paidCount, lateCount, groupCount, trustScore] = await Promise.all([
    prisma.contribution.count({ where: { userId, status: "PAID" } }),
    prisma.membership.count({ where: { userId, status: "LATE" } }),
    prisma.membership.count({ where: { userId, status: "ACTIVE" } }),
    prisma.trustScore.findUnique({ where: { userId } })
  ]);

  const score = trustScore?.score ?? 0;

  // Premier paiement à l'heure
  if (paidCount === 1) await awardIfMissing(userId, "on-time");
  // 5 paiements sans retard actif
  if (paidCount >= 5 && lateCount === 0) await awardIfMissing(userId, "consistent");
  // 10 cotisations
  if (paidCount >= 10) await awardIfMissing(userId, "veteran");
  // 3 groupes actifs
  if (groupCount >= 3) await awardIfMissing(userId, "social");
  // Score gold
  if (score >= 85) await awardIfMissing(userId, "high-trust");
  // Score elite
  if (score >= 95) await awardIfMissing(userId, "elite");
}

export async function awardFounder(userId: string) {
  await awardIfMissing(userId, "founder");
}
