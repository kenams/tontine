import "server-only";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";

export async function rewardPayment(userId: string) {
  const current = await prisma.trustScore.findUnique({ where: { userId } });
  if (!current) return;
  const score = Math.min(100, current.score + 2);
  const reliability = Math.min(100, current.paymentReliability + 3);
  const risk = Math.max(0, current.fraudRisk - 1);
  const streak = current.paymentStreak + 1;
  await prisma.trustScore.update({
    where: { userId },
    data: {
      score,
      paymentReliability: reliability,
      fraudRisk: risk,
      paymentStreak: streak,
      streakUpdatedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  revalidateTag("admin");
}

export async function penalizeLate(userId: string) {
  const current = await prisma.trustScore.findUnique({ where: { userId } });
  if (!current) return;
  const score = Math.max(0, current.score - 5);
  const reliability = Math.max(0, current.paymentReliability - 5);
  const risk = Math.min(100, current.fraudRisk + 8);
  await prisma.trustScore.update({
    where: { userId },
    data: { score, paymentReliability: reliability, fraudRisk: risk, paymentStreak: 0, updatedAt: new Date() },
  });
}

export function trustLevel(score: number): { label: string; labelEn: string; color: string; next: number | null } {
  if (score >= 95) return { label: "Élite",          labelEn: "Elite",        color: "text-emerald-400", next: null };
  if (score >= 85) return { label: "Gold",            labelEn: "Gold",         color: "text-gold",        next: 95 };
  if (score >= 70) return { label: "Avancé",          labelEn: "Advanced",     color: "text-emerald-400", next: 85 };
  if (score >= 50) return { label: "Intermédiaire",   labelEn: "Intermediate", color: "text-smoke",       next: 70 };
  if (score >= 30) return { label: "Bronze",          labelEn: "Bronze",       color: "text-orange-400",  next: 50 };
  return              { label: "Débutant",         labelEn: "Beginner",     color: "text-smoke",       next: 30 };
}

export function streakLabel(streak: number, lang: "fr" | "en" = "fr"): string {
  if (streak === 0) return "";
  if (lang === "en") return `🔥 ${streak} month${streak > 1 ? "s" : ""} streak`;
  return `🔥 ${streak} mois consécutif${streak > 1 ? "s" : ""}`;
}
