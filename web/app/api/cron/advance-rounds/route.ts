import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { sendAutoPayConfirmEmail, sendAutoPayFailEmail, sendDueReminderEmail, sendPayoutEmail } from "@/lib/email";
import { money } from "@/lib/format";
import { sendPushToUser } from "@/lib/push";
import { emitEvent } from "@/lib/realtime-server";
import { checkBadgesAfterPayment } from "@/lib/badges";
import { penalizeLate, rewardPayment } from "@/lib/trust";

const dueDays: Record<string, number> = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };

export async function GET(request: NextRequest) {
  try {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const report = { advanced: 0, autopaid: 0, autofailed: 0, payouts: 0, reminders: 0, late: 0 };

  // ── 1. RAPPELS 3 jours avant échéance ────────────────────────────────────────
  const upcomingMembershipsRaw = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      paidThisRound: false,
      tontineGroup: { status: "ACTIVE", nextDueAt: { gte: now, lte: in3Days } },
    },
    include: {
      user: { select: { email: true, fullName: true } },
      tontineGroup: { select: { name: true, contributionCents: true, currency: true, nextDueAt: true } },
    },
  });
  // Filtre JS: reminderSentAt null (champ nouveau, pas encore dans client local)
  const upcomingMemberships = upcomingMembershipsRaw.filter(
    (m) => !(m as unknown as { reminderSentAt: Date | null }).reminderSentAt
  );

  for (const m of upcomingMemberships) {
    const dueStr = m.tontineGroup.nextDueAt.toLocaleDateString("fr-FR");
    const amt = money(m.tontineGroup.contributionCents, m.tontineGroup.currency);
    const autoPayOn = !!(m as unknown as { autoPayEnabled: boolean }).autoPayEnabled;
    void sendDueReminderEmail(m.user.email, m.user.fullName, m.tontineGroup.name, amt, dueStr, autoPayOn);
    void sendPushToUser(m.userId, {
      title: `⏰ Cotisation ${m.tontineGroup.name} dans 3 jours`,
      body: `${amt} à payer avant le ${dueStr}${autoPayOn ? " (auto-pay activé)" : ""}`,
      url: "/tontines",
    });
    await prisma.membership.update({ where: { id: m.id }, data: { reminderSentAt: now } as never });
    report.reminders++;
  }

  // ── 2. AUTO-PAY — prélèvement automatique à l'échéance ───────────────────────
  const autoPayMembershipsRaw = await prisma.membership.findMany({
    where: {
      paidThisRound: false,
      status: "ACTIVE",
      tontineGroup: { status: "ACTIVE", nextDueAt: { lte: now } },
    },
    include: {
      user: { select: { email: true, fullName: true } },
      tontineGroup: { select: { id: true, name: true, contributionCents: true, currency: true, nextDueAt: true } },
    },
  });
  // Filtre JS: autoPayEnabled = true
  const autoPayMemberships = autoPayMembershipsRaw.filter(
    (m) => !!(m as unknown as { autoPayEnabled: boolean }).autoPayEnabled
  );

  for (const m of autoPayMemberships) {
    const group = m.tontineGroup;
    const wallet = await prisma.wallet.findUnique({ where: { userId: m.userId } });
    const canPay = wallet && wallet.currency === group.currency && wallet.balanceCents >= group.contributionCents;

    if (canPay && wallet) {
      const reference = `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      await prisma.$transaction([
        prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: { decrement: group.contributionCents } } }),
        prisma.contribution.create({
          data: {
            userId: m.userId, tontineGroupId: group.id, amountCents: group.contributionCents,
            currency: group.currency, status: "PAID", dueAt: group.nextDueAt, paidAt: now,
            paymentProvider: "WALLET", reference: `C-${reference}`,
          },
        }),
        prisma.transaction.create({
          data: {
            userId: m.userId, walletId: wallet.id, tontineGroupId: group.id,
            type: "CONTRIBUTION", status: "PAID", amountCents: group.contributionCents,
            currency: group.currency, provider: "WALLET", reference, riskScore: 5,
            metadata: JSON.stringify({ mode: "autopay" }),
          },
        }),
        prisma.membership.update({ where: { id: m.id }, data: { paidThisRound: true, status: "ACTIVE" } }),
        prisma.notification.create({
          data: {
            userId: m.userId, tontineGroupId: group.id,
            title: "Auto-paiement effectué ✅",
            body: `${money(group.contributionCents, group.currency)} prélevés depuis votre wallet pour ${group.name}.`,
            type: "PAYMENT",
          },
        }),
      ]);
      void rewardPayment(m.userId);
      void checkBadgesAfterPayment(m.userId);
      void sendAutoPayConfirmEmail(m.user.email, m.user.fullName, group.name, money(group.contributionCents, group.currency));
      void sendPushToUser(m.userId, {
        title: "✅ Auto-paiement effectué",
        body: `${money(group.contributionCents, group.currency)} prélevés pour ${group.name}`,
        url: "/wallet",
      });
      report.autopaid++;
    } else {
      // Solde insuffisant — notifier mais ne pas pénaliser (c'est le cron qui s'en charge)
      void sendAutoPayFailEmail(m.user.email, m.user.fullName, group.name, money(group.contributionCents, group.currency));
      void sendPushToUser(m.userId, {
        title: "⚠️ Auto-paiement échoué",
        body: `Solde insuffisant pour ${group.name}. Rechargez votre wallet.`,
        url: "/wallet/deposit",
      });
      report.autofailed++;
    }
  }

  // ── 3. AVANCEMENT DES ROUNDS + PAYOUT AUTOMATIQUE ───────────────────────────
  const overdueGroups = await prisma.tontineGroup.findMany({
    where: { status: "ACTIVE", nextDueAt: { lt: now } },
    include: {
      memberships: {
        orderBy: { payoutOrder: "asc" },
        include: { user: { select: { email: true, fullName: true } } },
      },
    },
  });

  for (const group of overdueGroups) {
    const days = dueDays[group.frequency] ?? 30;
    const nextDue = new Date(group.nextDueAt.getTime() + days * 24 * 60 * 60 * 1000);
    const nextRound = group.currentRound + 1;
    const totalMembers = group.memberships.length || 1;
    const payoutIdx = (group.currentRound - 1) % totalMembers;
    const payoutMembership = group.memberships[payoutIdx];

    // Calculer le pot = contributions PAID de ce round
    const paidContributions = await prisma.contribution.aggregate({
      where: { tontineGroupId: group.id, status: "PAID", dueAt: group.nextDueAt },
      _sum: { amountCents: true },
    });
    const potCents = paidContributions._sum.amountCents ?? 0;

    // Payout automatique sur wallet du bénéficiaire
    if (payoutMembership && potCents > 0) {
      const payoutRef = `PAYOUT-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      await prisma.$transaction(async (tx) => {
        await tx.wallet.upsert({
          where: { userId: payoutMembership.userId },
          create: { userId: payoutMembership.userId, balanceCents: potCents, currency: group.currency, status: "ACTIVE" },
          update: { balanceCents: { increment: potCents } },
        });
        await tx.transaction.create({
          data: {
            userId: payoutMembership.userId,
            tontineGroupId: group.id,
            type: "PAYOUT",
            status: "PAID",
            amountCents: potCents,
            currency: group.currency,
            provider: "WALLET",
            reference: payoutRef,
            riskScore: 3,
            metadata: JSON.stringify({ round: group.currentRound, mode: "auto_payout" }),
          },
        });
        await tx.notification.create({
          data: {
            userId: payoutMembership.userId,
            tontineGroupId: group.id,
            title: "🎉 Vous avez reçu le pot !",
            body: `${money(potCents, group.currency)} crédités sur votre wallet depuis ${group.name} (Round ${group.currentRound}).`,
            type: "PAYOUT",
          },
        });
      });
      void sendPayoutEmail(
        payoutMembership.user.email,
        payoutMembership.user.fullName,
        group.name,
        money(potCents, group.currency),
        group.currentRound
      );
      void sendPushToUser(payoutMembership.userId, {
        title: "🎉 Vous avez reçu le pot !",
        body: `${money(potCents, group.currency)} crédités sur votre wallet`,
        url: "/wallet",
      });
      report.payouts++;
    }

    // Reset paidThisRound + reminderSentAt + avancer le round
    await prisma.$transaction([
      prisma.tontineGroup.update({
        where: { id: group.id },
        data: {
          currentRound: nextRound,
          nextDueAt: nextDue,
          status: nextRound > totalMembers ? "COMPLETED" : "ACTIVE",
        },
      }),
      prisma.membership.updateMany({
        where: { tontineGroupId: group.id },
        data: { paidThisRound: false, reminderSentAt: null },
      }),
    ]);

    void emitEvent({
      type: "activity:new",
      title: `Nouveau round — ${group.name}`,
      region: `Round ${nextRound}`,
      currency: group.currency,
      amount: group.contributionCents,
      room: `tontine:${group.id}`,
    });

    report.advanced++;
  }

  // ── 4. PÉNALISER LES RETARDATAIRES ──────────────────────────────────────────
  const lateMembers = await prisma.membership.findMany({
    where: { status: "ACTIVE", paidThisRound: false, tontineGroup: { nextDueAt: { lt: now } } },
    select: { userId: true, id: true },
  });
  if (lateMembers.length > 0) {
    await prisma.membership.updateMany({
      where: { id: { in: lateMembers.map((m) => m.id) } },
      data: { status: "LATE" },
    });
    for (const { userId } of lateMembers) {
      void penalizeLate(userId);
      void sendPushToUser(userId, {
        title: "⚠️ Cotisation en retard",
        body: "Votre cotisation n'a pas été payée à temps. Votre score de confiance est impacté.",
        url: "/tontines",
      });
    }
    report.late = lateMembers.length;
  }

  return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/advance-rounds]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
