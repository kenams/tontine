import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;

  if (!webhookSecret) return NextResponse.json({ error: "Webhook secret manquant." }, { status: 500 });

  let event: Stripe.Event;
  try {
    event = getStripe()!.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "identity.verification_session.verified") {
    const vs = event.data.object as Stripe.Identity.VerificationSession;
    const userId = vs.metadata?.userId;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "VERIFIED", kycVerifiedAt: new Date(), kycSessionId: vs.id },
      });
    }
  }

  if (event.type === "identity.verification_session.requires_input") {
    const vs = event.data.object as Stripe.Identity.VerificationSession;
    const userId = vs.metadata?.userId;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "REJECTED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
