import "server-only";
import { prisma } from "@/lib/db";

type BadgeCode =
  | "founder"
  | "on-time"
  | "consistent"
  | "high-trust"
  | "elite"
  | "social"
  | "veteran"
  | "streak-3"
  | "streak-6"
  | "streak-12";

const BADGE_DEFS: Record<BadgeCode, { name: string; nameEn: string; description: string; descriptionEn: string; color: string }> = {
  "founder":   { name: "Fondateur",       nameEn: "Founder",        description: "A créé sa première tontine",                   descriptionEn: "Created their first tontine",              color: "gold" },
  "on-time":   { name: "Ponctuel",         nameEn: "On Time",        description: "Premier paiement effectué à l'heure",          descriptionEn: "First on-time payment made",               color: "emerald" },
  "consistent":{ name: "Régulier",         nameEn: "Consistent",     description: "5 paiements consécutifs sans retard",           descriptionEn: "5 consecutive on-time payments",           color: "emerald" },
  "high-trust":{ name: "Confiance Gold",   nameEn: "Gold Trust",     description: "Score de confiance ≥ 85",                     descriptionEn: "Trust score ≥ 85",                         color: "gold" },
  "elite":     { name: "Élite Kotizy",     nameEn: "Kotizy Elite",   description: "Score de confiance ≥ 95 — membre exemplaire",  descriptionEn: "Trust score ≥ 95 — exemplary member",     color: "emerald" },
  "social":    { name: "Connecté",         nameEn: "Social",         description: "Membre actif dans 3 groupes ou plus",          descriptionEn: "Active member in 3+ groups",               color: "ivory" },
  "veteran":   { name: "Vétéran",          nameEn: "Veteran",        description: "10 cotisations complétées",                    descriptionEn: "10 contributions completed",               color: "gold" },
  "streak-3":  { name: "Ponctuel ×3",      nameEn: "Punctual ×3",    description: "3 mois consécutifs de paiements à l'heure",    descriptionEn: "3 consecutive months of on-time payments", color: "emerald" },
  "streak-6":  { name: "Fiable",           nameEn: "Reliable",       description: "6 mois consécutifs de paiements à l'heure",    descriptionEn: "6 consecutive months of on-time payments", color: "gold" },
  "streak-12": { name: "Pilier",           nameEn: "Pillar",         description: "12 mois consécutifs — le sommet de la confiance", descriptionEn: "12 consecutive months — the peak of trust", color: "gold" },
};

async function ensureBadge(code: BadgeCode) {
  const def = BADGE_DEFS[code];
  return prisma.badge.upsert({
    where: { code },
    create: { code, name: def.name, description: def.description, color: def.color },
    update: { name: def.name, description: def.description, color: def.color },
  });
}

async function awardIfMissing(userId: string, code: BadgeCode) {
  const badge = await ensureBadge(code);
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return false;
  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  await prisma.notification.create({
    data: {
      userId,
      title: `Badge obtenu : ${badge.name}`,
      body: badge.description,
      type: "BADGE",
    },
  });
  return true;
}

export async function checkBadgesAfterPayment(userId: string) {
  const [paidCount, lateCount, groupCount, trustScore] = await Promise.all([
    prisma.contribution.count({ where: { userId, status: "PAID" } }),
    prisma.membership.count({ where: { userId, status: "LATE" } }),
    prisma.membership.count({ where: { userId, status: "ACTIVE" } }),
    prisma.trustScore.findUnique({ where: { userId } }),
  ]);

  const score = trustScore?.score ?? 0;
  const streak = trustScore?.paymentStreak ?? 0;

  if (paidCount === 1) await awardIfMissing(userId, "on-time");
  if (paidCount >= 5 && lateCount === 0) await awardIfMissing(userId, "consistent");
  if (paidCount >= 10) await awardIfMissing(userId, "veteran");
  if (groupCount >= 3) await awardIfMissing(userId, "social");
  if (score >= 85) await awardIfMissing(userId, "high-trust");
  if (score >= 95) await awardIfMissing(userId, "elite");
  if (streak >= 3)  await awardIfMissing(userId, "streak-3");
  if (streak >= 6)  await awardIfMissing(userId, "streak-6");
  if (streak >= 12) await awardIfMissing(userId, "streak-12");
}

export async function awardFounder(userId: string) {
  await awardIfMissing(userId, "founder");
}

export function badgeMeta(code: string, lang: "fr" | "en" = "fr") {
  const def = BADGE_DEFS[code as BadgeCode];
  if (!def) return { name: code, description: "" };
  return lang === "en"
    ? { name: def.nameEn, description: def.descriptionEn }
    : { name: def.name, description: def.description };
}
