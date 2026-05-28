import { NextResponse } from "next/server";
import OpenAI from "openai";

import { getSession } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { money } from "@/lib/format";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function fallbackAdvice(score: number, nextGroup: string, lateCount: number, totalSaved: number, currency: string): string {
  if (lateCount > 0) {
    return `Vous avez ${lateCount} retard(s) en cours. Régularisez avant votre prochaine échéance pour préserver votre score de confiance (actuellement ${score}/100). Activez un rappel 48h avant chaque échéance.`;
  }
  if (score < 60) {
    return `Score de confiance faible (${score}/100). Priorité : payer vos cotisations à temps pendant 2 cycles consécutifs pour remonter votre score et accéder aux groupes premium.`;
  }
  if (score >= 85) {
    return `Excellent score (${score}/100). Vous êtes éligible aux groupes à fort volume. Pensez à augmenter votre fonds d'urgence et à diversifier vos devises dans ${nextGroup}.`;
  }
  if (totalSaved > 0) {
    return `Vous avez cotisé ${money(totalSaved, currency)} au total — bonne progression. Pour atteindre le score elite (85+), maintenez 0 retard sur les 3 prochains cycles de ${nextGroup}.`;
  }
  return `Démarrez avec ${nextGroup} pour construire votre historique de paiement. Un score solide dès les premiers cycles vous donnera accès aux cercles premium et aux taux préférentiels.`;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const dashboard = await getUserDashboard(session.userId);
  const score = dashboard.user.trustScore?.score ?? 50;
  const wallet = dashboard.user.wallet;
  const currency = wallet?.currency ?? "XOF";
  const balance = wallet?.balanceCents ?? 0;
  const nextGroup = dashboard.nextMembership?.name ?? "votre prochaine tontine";
  const lateCount = dashboard.memberships.filter((m) => m.status === "LATE").length;
  const groupCount = dashboard.memberships.length;
  const totalSaved = dashboard.totalSaved;
  const unreadNotifs = dashboard.notifications.filter((n) => !n.readAt).length;

  if (!openai) {
    return NextResponse.json({
      mode: "rule-based",
      advice: fallbackAdvice(score, nextGroup, lateCount, totalSaved, currency),
      score,
      signals: lateCount > 0 ? ["retards en cours"] : score < 60 ? ["score faible"] : ["aucun signal critique"]
    });
  }

  try {
    const context = [
      `Utilisateur: ${session.fullName}`,
      `Score de confiance: ${score}/100`,
      `Solde wallet: ${money(balance, currency)}`,
      `Tontines actives: ${groupCount} groupe(s)`,
      `Prochaine échéance: ${nextGroup}`,
      `Total cotisé: ${money(totalSaved, currency)}`,
      `Retards actuels: ${lateCount}`,
      `Notifications non lues: ${unreadNotifs}`
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "Tu es le coach financier de Kotizy, une app de tontine digitale. Donne un conseil personnalisé, concret et court (2-3 phrases max) basé sur le profil ci-dessous. Sois direct, bienveillant et actionnable. Pas de markdown."
        },
        { role: "user", content: context }
      ]
    });

    const advice = completion.choices[0]?.message?.content?.trim() ?? fallbackAdvice(score, nextGroup, lateCount, totalSaved, currency);

    return NextResponse.json({
      mode: "openai",
      advice,
      score,
      signals: lateCount > 0 ? ["retards en cours"] : score < 60 ? ["score faible"] : ["aucun signal critique"]
    });
  } catch {
    return NextResponse.json({
      mode: "rule-based",
      advice: fallbackAdvice(score, nextGroup, lateCount, totalSaved, currency),
      score,
      signals: []
    });
  }
}
