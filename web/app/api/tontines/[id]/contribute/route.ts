import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendContributionConfirmEmail } from "@/lib/email";
import { money } from "@/lib/format";
import { emitEvent } from "@/lib/realtime-server";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { createContributionCheckoutSession, isStripeCheckoutProvider, isStripeConfigured } from "@/lib/stripe";
import { contributionSchema } from "@/lib/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const limit = await rateLimit(request, "contribution", 16, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Paiements temporairement limites." }, { status: 429 });

  const { id } = await params;
  const parsed = contributionSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Provider invalide." }, { status: 400 });

  const [group, membership, wallet] = await Promise.all([
    prisma.tontineGroup.findUnique({ where: { id } }),
    prisma.membership.findFirst({ where: { userId: session.userId, tontineGroupId: id } }),
    prisma.wallet.findUnique({ where: { userId: session.userId } })
  ]);
  if (!group || !membership) return NextResponse.json({ error: "Tontine introuvable." }, { status: 404 });

  const reference = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const amount = group.contributionCents;
  const stripeProvider = isStripeCheckoutProvider(parsed.data.provider);
  const walletCanPay = wallet && wallet.currency === group.currency && wallet.balanceCents >= amount;
  const status = stripeProvider ? "PENDING" : walletCanPay || parsed.data.provider !== "WALLET" ? "PAID" : "PENDING";

  const created = await prisma.$transaction(async (tx) => {
    if (wallet && walletCanPay) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceCents: { decrement: amount } }
      });
    }
    const contribution = await tx.contribution.create({
      data: {
        userId: session.userId,
        tontineGroupId: id,
        amountCents: amount,
        currency: group.currency,
        status,
        dueAt: group.nextDueAt,
        paidAt: status === "PAID" ? new Date() : null,
        paymentProvider: parsed.data.provider,
        reference: `C-${reference}`
      }
    });
    const transaction = await tx.transaction.create({
      data: {
        userId: session.userId,
        walletId: wallet?.id,
        tontineGroupId: id,
        type: "CONTRIBUTION",
        status,
        amountCents: amount,
        currency: group.currency,
        provider: parsed.data.provider,
        reference,
        riskScore: stripeProvider ? 18 : status === "PAID" ? 9 : 48,
        metadata: JSON.stringify({
          mode: stripeProvider ? "stripe_checkout" : "test",
          provider: parsed.data.provider,
          checkoutStatus: stripeProvider ? "CREATED_PENDING_SESSION" : undefined
        })
      }
    });
    await tx.membership.update({
      where: { id: membership.id },
      data: { paidThisRound: status === "PAID", status: status === "PAID" ? "ACTIVE" : "LATE" }
    });
    return { contribution, transaction };
  });

  if (stripeProvider) {
    if (!isStripeConfigured()) {
      await auditLog({
        actorId: session.userId,
        action: "STRIPE_CHECKOUT_NOT_CONFIGURED",
        targetType: "Transaction",
        targetId: created.transaction.id,
        ipAddress: clientIp(request),
        metadata: { provider: parsed.data.provider, status: "PENDING" }
      });
      return NextResponse.json({
        ok: true,
        status: "PENDING",
        mode: "stripe-not-configured",
        message: "Stripe n'est pas configure sur cet environnement."
      });
    }

    try {
      const checkout = await createContributionCheckoutSession({
        request,
        group,
        user: { id: session.userId, email: session.email, fullName: session.fullName },
        provider: parsed.data.provider,
        transactionId: created.transaction.id,
        contributionId: created.contribution.id
      });

      await prisma.transaction.update({
        where: { id: created.transaction.id },
        data: {
          metadata: JSON.stringify({
            mode: "stripe_checkout",
            provider: parsed.data.provider,
            checkoutSessionId: checkout.id,
            checkoutStatus: checkout.status,
            paymentStatus: checkout.payment_status
          })
        }
      });

      await auditLog({
        actorId: session.userId,
        action: "STRIPE_CHECKOUT_CREATED",
        targetType: "Transaction",
        targetId: created.transaction.id,
        ipAddress: clientIp(request),
        metadata: { provider: parsed.data.provider, sessionId: checkout.id, status: "PENDING" }
      });

      return NextResponse.json({
        ok: true,
        status: "PENDING",
        mode: "stripe_checkout",
        checkoutUrl: checkout.url,
        sessionId: checkout.id
      });
    } catch (error) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: created.transaction.id },
          data: {
            status: "FAILED",
            riskScore: 55,
            metadata: JSON.stringify({
              mode: "stripe_checkout",
              provider: parsed.data.provider,
              error: error instanceof Error ? error.message : "Stripe checkout failed"
            })
          }
        }),
        prisma.contribution.update({
          where: { id: created.contribution.id },
          data: { status: "FAILED" }
        })
      ]);

      await auditLog({
        actorId: session.userId,
        action: "STRIPE_CHECKOUT_FAILED",
        targetType: "Transaction",
        targetId: created.transaction.id,
        ipAddress: clientIp(request),
        metadata: { provider: parsed.data.provider, status: "FAILED" }
      });

      return NextResponse.json({ error: "Creation du paiement Stripe impossible.", status: "FAILED" }, { status: 502 });
    }
  }

  await auditLog({
    actorId: session.userId,
    action: "CONTRIBUTION_CREATED",
    targetType: "TontineGroup",
    targetId: id,
    ipAddress: clientIp(request),
    metadata: { provider: parsed.data.provider, status }
  });

  if (status === "PAID") {
    revalidateTag("admin");
    void sendContributionConfirmEmail(session.email, session.fullName, group.name, money(group.contributionCents, group.currency));
    void emitEvent({
      type: "activity:new",
      title: `Cotisation confirmée — ${group.name}`,
      region: session.fullName,
      currency: group.currency,
      amount: group.contributionCents,
      room: `tontine:${id}`
    });
    void emitEvent({
      type: "activity:new",
      title: `${session.fullName} a cotisé dans ${group.name}`,
      region: "Live",
      currency: group.currency,
      amount: group.contributionCents
    });
  }

  return NextResponse.json({ ok: true, status });
}
