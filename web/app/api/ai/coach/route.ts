import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const dashboard = await getUserDashboard(session.userId);
  const score = dashboard.user.trustScore?.score ?? 70;
  const next = dashboard.nextMembership?.name ?? "votre prochaine tontine";

  return NextResponse.json({
    mode: process.env.OPENAI_API_KEY ? "openai-ready" : "local-test",
    advice:
      score >= 85
        ? `Votre profil est solide. Gardez le paiement automatique actif pour ${next} et augmentez le fonds urgence.`
        : `Priorite: stabiliser vos cotisations. Activez un rappel 48h avant ${next} et gardez 2 cotisations en reserve.`,
    fraudSignals: score < 70 ? ["retards recurrents", "solde faible"] : ["aucun signal critique"]
  });
}
