import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID ?? "";
const PREMIUM_MONTHLY_CENTS = 499;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const sub = await (prisma.subscription as never).findUnique({ where: { userId: session.userId } }) as {
    plan: string; status: string; currentPeriodEnd: Date | null; cancelAtPeriodEnd: boolean
  } | null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { plan: true } as never }) as { plan: string } | null;

  return NextResponse.json({
    plan: user?.plan ?? "FREE",
    subscription: sub ?? null,
    features: {
      maxTontines: user?.plan === "PREMIUM" ? 999 : 1,
      maxMembers: user?.plan === "PREMIUM" ? 30 : 6,
      advancedStats: user?.plan === "PREMIUM",
      verifiedBadge: user?.plan === "PREMIUM",
      prioritySupport: user?.plan === "PREMIUM",
    },
    priceCents: PREMIUM_MONTHLY_CENTS,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isStripeConfigured()) return NextResponse.json({ error: "Paiement non disponible." }, { status: 503 });

  const body = await request.json() as { action: "subscribe" | "cancel" | "portal" };

  const stripe = getStripe()!;

  if (body.action === "subscribe") {
    const existingSub = await (prisma.subscription as never).findUnique({ where: { userId: session.userId } }) as { plan: string } | null;
    if (existingSub?.plan === "PREMIUM") return NextResponse.json({ error: "Déjà Premium." }, { status: 409 });

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, fullName: true, stripeCustomerId: true } as never }) as { email: string; fullName: string; stripeCustomerId: string | null };
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.fullName, metadata: { userId: session.userId } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: session.userId }, data: { stripeCustomerId: customerId } as never });
    }

    const origin = new URL(request.url).origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: PREMIUM_PRICE_ID ? [{ price: PREMIUM_PRICE_ID, quantity: 1 }] : [{
        quantity: 1,
        price_data: {
          currency: "eur",
          recurring: { interval: "month" },
          unit_amount: PREMIUM_MONTHLY_CENTS,
          product_data: { name: "Kotizy Premium", description: "Tontines illimitées, stats avancées, badge vérifié" },
        },
      }],
      success_url: `${origin}/settings?premium=success`,
      cancel_url: `${origin}/settings?premium=cancelled`,
      metadata: { userId: session.userId, plan: "PREMIUM" },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  }

  if (body.action === "cancel") {
    const sub = await (prisma.subscription as never).findUnique({ where: { userId: session.userId } }) as { stripeSubscriptionId: string | null } | null;
    if (!sub?.stripeSubscriptionId) return NextResponse.json({ error: "Aucun abonnement actif." }, { status: 404 });
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    await (prisma.subscription as never).update({ where: { userId: session.userId }, data: { cancelAtPeriodEnd: true } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "portal") {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { stripeCustomerId: true } as never }) as { stripeCustomerId: string | null };
    if (!user?.stripeCustomerId) return NextResponse.json({ error: "Aucun compte Stripe." }, { status: 404 });
    const origin = new URL(request.url).origin;
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/settings`,
    });
    return NextResponse.json({ portalUrl: portal.url });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
