import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { sendAutoPayConfirmEmail, sendAutoPayFailEmail, sendDueReminderEmail, sendPayoutEmail } from "@/lib/email";
import { money } from "@/lib/format";
import { sendPushToUser } from "@/lib/push";
import { emitEvent } from "@/lib/realtime-server";
import { checkBadgesAfterPayment } from "@/lib/badges";
import { penalizeLate, rewardPayment } from "@/lib/trust";
import { coverByEmergencyFund, excludeMember } from "@/lib/defaults";
import { blacklistIfDebt, releaseCollateral, seizeCollateral } from "@/lib/antiFraud";

const dueDays: Record<string, number> = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };

export async function GET(request: NextRequest) {
  try {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const report = { advanced: 0, autopaid: 0, autofailed: 0, payouts: 0, reminders: 0, late: 0, covered: 0, excluded: 0, debtAlerts: 0 };

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
    const activeMs = group.memberships.filter((m) => !["LEFT", "EXCLUDED"].includes(m.status));
    const totalMembers = activeMs.length || 1;
    const payoutIdx = (group.currentRound - 1) % totalMembers;
    const payoutMembership = activeMs[payoutIdx];

    // Si requireFullPayment activé et membres actifs non payés → bloquer l'avancement
    const requireFull = (group as unknown as { requireFullPayment?: boolean }).requireFullPayment ?? false;
    if (requireFull) {
      const unpaid = activeMs.filter((m) => !m.paidThisRound).length;
      if (unpaid > 0) {
        // Notifier l'admin et sauter ce round
        await prisma.notification.create({
          data: {
            userId: group.memberships.find((m) => m.role === "ORGANIZER")?.userId ?? group.memberships[0].userId,
            tontineGroupId: group.id,
            title: `⏸️ Round bloqué — ${group.name}`,
            body: `${unpaid} membre${unpaid > 1 ? "s" : ""} n'ont pas cotisé. "Paiement complet requis" est activé. Le round avancera quand tous auront payé.`,
            type: "ROUND_BLOCKED",
          },
        });
        continue;
      }
    }

    // Calculer le pot = contributions PAID de ce round
    const paidContributions = await prisma.contribution.aggregate({
      where: { tontineGroupId: group.id, status: "PAID", dueAt: group.nextDueAt },
      _sum: { amountCents: true },
    });
    const potCents = paidContributions._sum.amountCents ?? 0;

    // Payout automatique sur wallet du bénéficiaire
    if (payoutMembership && potCents > 0) {
      const feeCents = Math.round(potCents * group.platformFeeBps / 10_000);
      const netPayout = potCents - feeCents;
      const payoutRef = `PAYOUT-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const feeRef = `FEE-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      await prisma.$transaction(async (tx) => {
        // Vérifier que le wallet existant est dans la même devise, sinon créer un wallet dédié
        const existingWallet = await tx.wallet.findUnique({ where: { userId: payoutMembership.userId } });
        if (existingWallet && existingWallet.currency !== group.currency) {
          // Ne pas mélanger les devises — signaler l'admin et sauter
          await tx.notification.create({
            data: {
              userId: group.memberships[0].userId,
              tontineGroupId: group.id,
              title: "⚠️ Payout bloqué — conflit de devise",
              body: `Le wallet de ${payoutMembership.user.fullName} est en ${existingWallet.currency} mais la tontine est en ${group.currency}. Contactez le support.`,
              type: "PAYOUT",
            },
          });
          return;
        }
        await tx.wallet.upsert({
          where: { userId: payoutMembership.userId },
          create: { userId: payoutMembership.userId, balanceCents: netPayout, currency: group.currency, status: "ACTIVE" },
          update: { balanceCents: { increment: netPayout } },
        });
        await tx.transaction.create({
          data: {
            userId: payoutMembership.userId,
            tontineGroupId: group.id,
            type: "PAYOUT",
            status: "PAID",
            amountCents: netPayout,
            currency: group.currency,
            provider: "WALLET",
            reference: payoutRef,
            riskScore: 3,
            metadata: JSON.stringify({ round: group.currentRound, mode: "auto_payout", grossPot: potCents, feeCents }),
          },
        });
        // Enregistrement des frais KAH Digital (1.25% du pot)
        if (feeCents > 0) {
          await tx.transaction.create({
            data: {
              userId: payoutMembership.userId,
              tontineGroupId: group.id,
              type: "PLATFORM_FEE",
              status: "PAID",
              amountCents: feeCents,
              currency: group.currency,
              provider: "WALLET",
              reference: feeRef,
              riskScore: 0,
              metadata: JSON.stringify({ round: group.currentRound, bps: group.platformFeeBps }),
            },
          });
        }
        await tx.notification.create({
          data: {
            userId: payoutMembership.userId,
            tontineGroupId: group.id,
            title: "🎉 Vous avez reçu le pot !",
            body: `${money(netPayout, group.currency)} crédités sur votre wallet depuis ${group.name} (Round ${group.currentRound}).`,
            type: "PAYOUT",
          },
        });
        // Marquer le pot reçu sur le membership (pour calcul dette si départ)
        await tx.membership.update({
          where: { id: payoutMembership.id },
          data: { potReceivedAt: now, potReceivedCents: potCents } as never,
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

    // Si tontine terminée → libérer tous les collatéraux
    if (nextRound > totalMembers) {
      for (const m of activeMs) {
        void releaseCollateral(m.userId, group.id);
      }
    }

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

  // ── 4. PÉNALISER LES RETARDATAIRES (J+0) ────────────────────────────────────
  const newLateMembers = await prisma.membership.findMany({
    where: { status: "ACTIVE", paidThisRound: false, tontineGroup: { status: "ACTIVE", nextDueAt: { lt: now } } },
    select: { userId: true, id: true },
  });
  if (newLateMembers.length > 0) {
    await prisma.membership.updateMany({
      where: { id: { in: newLateMembers.map((m) => m.id) } },
      data: { status: "LATE", lateStreak: 1 } as never,
    });
    for (const { userId } of newLateMembers) {
      void penalizeLate(userId);
      void sendPushToUser(userId, {
        title: "⚠️ Cotisation en retard",
        body: "Votre cotisation n'a pas été payée. Votre score de confiance est impacté. Payez dès que possible.",
        url: "/tontines",
      });
    }
    report.late = newLateMembers.length;
  }

  // ── 5. ESCALADE RETARDS PERSISTANTS ─────────────────────────────────────────
  // J+7 → fonds urgence couvre + alerte admin
  // J+14 → alerte finale avant exclusion
  // J+30 (ou autoExcludeDays) → exclusion automatique

  const in7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const in14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const lateMembers = (await prisma.membership.findMany({
    where: { status: "LATE" },
    include: {
      tontineGroup: {
        select: { id: true, name: true, currency: true, contributionCents: true, createdById: true, autoExcludeDays: true },
      },
      user: { select: { email: true, fullName: true } },
    },
  } as never)) as unknown as Array<{
    id: string; userId: string; lateStreak: number; lateAlertSentAt: Date | null;
    tontineGroup: { id: string; name: string; currency: string; contributionCents: number; createdById: string; autoExcludeDays: number };
    user: { email: string; fullName: string };
  }>;

  for (const m of lateMembers) {
    const lateStreak = m.lateStreak ?? 1;
    const alertSent = m.lateAlertSentAt;
    const group = m.tontineGroup;
    const autoExcludeDays = group.autoExcludeDays ?? 30;

    // J+7 : tenter couverture fonds urgence
    if (lateStreak >= 7 && !alertSent) {
      const coverResult = await coverByEmergencyFund(m.id, group.id, m.userId);
      if (coverResult.covered) {
        report.covered++;
        // Notifier l'admin
        await prisma.notification.create({
          data: {
            userId: group.createdById,
            tontineGroupId: group.id,
            title: `🛟 Fonds urgence utilisé — ${group.name}`,
            body: `${m.user.fullName} est en retard. Le fonds commun a couvert ${money(coverResult.amountCents, group.currency)}. Remboursement attendu sous 30 jours.`,
            type: "EMERGENCY",
          },
        });
      } else {
        // Fonds insuffisant → alerte admin
        await prisma.notification.create({
          data: {
            userId: group.createdById,
            tontineGroupId: group.id,
            title: `⚠️ Retard non couvert — ${group.name}`,
            body: `${m.user.fullName} n'a pas payé depuis 7 jours. Fonds insuffisant. Intervenez ou attendez l'exclusion automatique sous ${autoExcludeDays - 7}j.`,
            type: "LATE_ALERT",
          },
        });
      }
      await prisma.membership.update({
        where: { id: m.id },
        data: { lateAlertSentAt: now, lateStreak: 7 } as never,
      });
      report.debtAlerts++;
    }

    // J+14 : rappel final avant exclusion
    if (lateStreak >= 14 && alertSent && new Date(alertSent).getTime() < in7Days.getTime()) {
      void sendPushToUser(m.userId, {
        title: "🚨 Dernier avertissement",
        body: `Vous avez ${autoExcludeDays - 14} jours avant exclusion automatique du groupe "${group.name}". Payez maintenant.`,
        url: `/tontines/${group.id}`,
      });
      await prisma.notification.create({
        data: {
          userId: m.userId,
          tontineGroupId: group.id,
          title: "🚨 Dernier avertissement avant exclusion",
          body: `Votre cotisation est en retard depuis 14 jours. Sans paiement sous ${autoExcludeDays - 14} jours, vous serez automatiquement exclu(e) du groupe.`,
          type: "EXCLUSION_WARNING",
        },
      });
    }

    // J+autoExcludeDays → exclusion automatique + saisie collatéral + blacklist si dette
    if (lateStreak >= autoExcludeDays) {
      const result = await excludeMember(group.createdById, m.id, `Exclusion automatique — ${autoExcludeDays} jours sans paiement`);
      if (result.ok) {
        report.excluded++;
        // Saisir le collatéral si existant
        await seizeCollateral(m.userId, group.id);
        // Blacklister si dette restante
        void blacklistIfDebt(m.userId);
      }
    } else {
      // Incrémenter le streak de retard
      await prisma.membership.update({
        where: { id: m.id },
        data: { lateStreak: { increment: 1 } } as never,
      }).catch(() => {});
    }
  }

  // ── 6. ALERTES PRÊTS D'URGENCE EN RETARD ────────────────────────────────────
  const overdueLoans = (await prisma.emergencyLoan.findMany({
    where: { status: "PENDING", dueAt: { lt: now } },
    include: { membership: { include: { user: true } } },
  } as never)) as unknown as Array<{ id: string; userId: string; tontineGroupId: string; amountCents: number; currency: string; membership: { user: { email: string; fullName: string } } }>;

  for (const loan of overdueLoans) {
    void sendPushToUser(loan.userId, {
      title: "⚠️ Remboursement fonds urgence en retard",
      body: `Vous devez ${money(loan.amountCents, loan.currency)} au fonds commun. Réglez depuis votre wallet.`,
      url: `/tontines/${loan.tontineGroupId}`,
    });
    await prisma.notification.create({
      data: {
        userId: loan.userId,
        tontineGroupId: loan.tontineGroupId,
        title: "⚠️ Remboursement en retard",
        body: `Le remboursement de votre avance (${money(loan.amountCents, loan.currency)}) au fonds commun est en retard.`,
        type: "DEBT_OVERDUE",
      },
    });
  }

  return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/advance-rounds]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
