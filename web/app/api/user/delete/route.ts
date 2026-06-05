import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookie, getSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";

// RGPD Article 17 — droit à l'effacement
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  try {
    const body = await safeJson(request) as { password?: string } | null;
    if (!body?.password) {
      return NextResponse.json({ error: "Confirmation du mot de passe requise." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });

    // Vérifier qu'il n'y a pas de solde wallet non nul
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
    if (wallet && wallet.balanceCents > 0) {
      return NextResponse.json({
        error: "Votre wallet contient un solde. Veuillez le retirer avant de supprimer votre compte.",
        balanceCents: wallet.balanceCents,
      }, { status: 400 });
    }

    // Cascade delete — Prisma gère via onDelete: Cascade sur les relations
    await prisma.user.delete({ where: { id: session.userId } });

    revalidateTag(`user-${session.userId}`);

    const response = NextResponse.json({ ok: true, message: "Compte et données supprimés conformément au RGPD." });
    clearSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression du compte. Réessayez." }, { status: 500 });
  }
}

// RGPD Article 20 — portabilité des données
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      wallet: true,
      trustScore: true,
      memberships: { include: { tontineGroup: { select: { id: true, name: true } } } },
      transactions: { orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const exportData = {
    exportDate: new Date().toISOString(),
    rgpd: "Export conforme RGPD Article 20",
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    wallet: user.wallet ? { balanceCents: user.wallet.balanceCents, currency: user.wallet.currency } : null,
    trustScore: user.trustScore ? { score: user.trustScore.score } : null,
    tontines: user.memberships.map((m) => ({ id: m.tontineGroup.id, name: m.tontineGroup.name, joinedAt: m.joinedAt, status: m.status })),
    transactions: user.transactions.map((t) => ({ id: t.id, type: t.type, status: t.status, amountCents: t.amountCents, currency: t.currency, createdAt: t.createdAt })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kotizy-data-export-${session.userId}.json"`,
    },
  });
}
