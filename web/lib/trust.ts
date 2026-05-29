import "server-only";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";

export async function rewardPayment(userId: string) {
  const current = await prisma.trustScore.findUnique({ where: { userId } });
  if (!current) return;
  const score = Math.min(100, current.score + 2);
  const reliability = Math.min(100, current.paymentReliability + 3);
  const risk = Math.max(0, current.fraudRisk - 1);
  await prisma.trustScore.update({
    where: { userId },
    data: { score, paymentReliability: reliability, fraudRisk: risk, updatedAt: new Date() }
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
    data: { score, paymentReliability: reliability, fraudRisk: risk, updatedAt: new Date() }
  });
}

export function trustLevel(score: number): { label: string; color: string; next: number | null } {
  if (score >= 95) return { label: "Elite", color: "text-emerald-400", next: null };
  if (score >= 85) return { label: "Gold", color: "text-gold", next: 95 };
  if (score >= 70) return { label: "Avancé", color: "text-emerald-400", next: 85 };
  if (score >= 50) return { label: "Intermédiaire", color: "text-smoke", next: 70 };
  if (score >= 30) return { label: "Bronze", color: "text-orange-400", next: 50 };
  return { label: "Débutant", color: "text-smoke", next: 30 };
}
