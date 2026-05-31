import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { rateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "kyc-session", 3, 3_600_000);
  if (!limit.ok) return NextResponse.json({ error: "Limite atteinte. Réessayez dans 1 heure." }, { status: 429 });

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Vérification d'identité non disponible." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { kycStatus: true, email: true, fullName: true } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  if (user.kycStatus === "VERIFIED") {
    return NextResponse.json({ alreadyVerified: true });
  }

  const stripe = getStripe()!;

  const verificationSession = await stripe.identity.verificationSessions.create({
    type: "document",
    options: {
      document: {
        allowed_types: ["driving_license", "id_card", "passport"],
        require_id_number: false,
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
    metadata: { userId: session.userId },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app"}/profile?kyc=done`,
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { kycStatus: "PENDING", kycSessionId: verificationSession.id },
  });

  return NextResponse.json({ url: verificationSession.url, sessionId: verificationSession.id });
}
