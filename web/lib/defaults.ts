import "server-only";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";
import { penalizeLate } from "@/lib/trust";
import { sendPushToUser } from "@/lib/push";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeaveResult =
  | { ok: true; debtCents: 0; message: string }
  | { ok: false; debtCents: number; message: string }
  | { ok: false; debtCents: 0; blocked: string };

// ─── Calcul de la dette d'un membre ─────────────────────────────────────────

export async function calcMemberDebt(userId: string, groupId: string): Promise<number> {
  const membership = await prisma.membership.findUnique({
    where: { userId_tontineGroupId: { userId, tontineGroupId: groupId } },
    select: { id: true },
  });
  if (!membership) return 0;

  const m = membership as unknown as {
    potReceivedCents: number;
    debtCents: number;
  };

  // Cotisations déjà payées par ce membre dans ce groupe
  const paid = await prisma.contribution.aggregate({
    where: { userId, tontineGroupId: groupId, status: "PAID" },
    _sum: { amountCents: true },
  });
  const paidCents = paid._sum.amountCents ?? 0;
  const potReceived = m.potReceivedCents ?? 0;
  const existingDebt = m.debtCents ?? 0;

  // Dette = pot reçu − cotisations payées (si positif)
  const rawDebt = Math.max(0, potReceived - paidCents);
  return Math.max(rawDebt, existingDebt);
}

// ─── Désistement volontaire ──────────────────────────────────────────────────

export async function processMemberLeave(
  userId: string,
  groupId: string,
  reason = "Désistement volontaire"
): Promise<LeaveResult> {
  const membership = await prisma.membership.findUnique({
    where: { userId_tontineGroupId: { userId, tontineGroupId: groupId } },
    include: { tontineGroup: { select: { name: true, currency: true, contributionCents: true, status: true } } },
  });
  if (!membership) return { ok: false, debtCents: 0, blocked: "Vous n'êtes pas membre de ce groupe." };
  if (membership.status === "LEFT") return { ok: false, debtCents: 0, blocked: "Vous avez déjà quitté ce groupe." };

  const debtCents = await calcMemberDebt(userId, groupId);

  if (debtCents > 0) {
    // Vérifier si le wallet peut couvrir la dette
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const currency = membership.tontineGroup.currency;
    const canAutoSettle = wallet && wallet.currency === currency && wallet.balanceCents >= debtCents;

    if (canAutoSettle && wallet) {
      // Débit automatique de la dette depuis le wallet
      const ref = `DEBT-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      await prisma.$transaction([
        prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: { decrement: debtCents } } }),
        prisma.transaction.create({
          data: {
            userId, tontineGroupId: groupId, type: "DEBT_REPAYMENT", status: "PAID",
            amountCents: debtCents, currency, provider: "WALLET", reference: ref,
            riskScore: 2, metadata: JSON.stringify({ reason: "auto_settle_on_leave" }),
          },
        }),
        prisma.membership.update({
          where: { id: membership.id },
          data: {
            status: "LEFT", leftAt: new Date(), leaveReason: reason,
            debtCents: 0,
          } as never,
        }),
      ]);
      await notifyAdminLeave(userId, groupId, membership.tontineGroup.name, 0);
      return { ok: true, debtCents: 0, message: `Dette de ${money(debtCents, currency)} réglée automatiquement. Vous avez quitté le groupe.` };
    }

    // Impossible de partir sans rembourser
    return {
      ok: false,
      debtCents,
      message: `Vous avez reçu le pot et devez encore ${money(debtCents, membership.tontineGroup.currency)} au groupe. Rechargez votre wallet pour solder la dette et quitter le groupe.`,
    };
  }

  // Pas de dette — sortie immédiate
  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: "LEFT", leftAt: new Date(), leaveReason: reason } as never,
  });
  await notifyAdminLeave(userId, groupId, membership.tontineGroup.name, 0);
  return { ok: true, debtCents: 0, message: `Vous avez quitté le groupe "${membership.tontineGroup.name}".` };
}

// ─── Remboursement de dette ──────────────────────────────────────────────────

export async function repayDebt(userId: string, groupId: string): Promise<{ ok: boolean; message: string }> {
  const debt = await calcMemberDebt(userId, groupId);
  if (debt === 0) return { ok: true, message: "Aucune dette à rembourser." };

  const membership = await prisma.membership.findUnique({
    where: { userId_tontineGroupId: { userId, tontineGroupId: groupId } },
    include: { tontineGroup: { select: { currency: true, name: true } } },
  });
  if (!membership) return { ok: false, message: "Membership introuvable." };

  const currency = membership.tontineGroup.currency;
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.currency !== currency || wallet.balanceCents < debt) {
    return { ok: false, message: `Solde insuffisant. Vous devez ${money(debt, currency)}.` };
  }

  const ref = `DEBT-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  await prisma.$transaction([
    prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: { decrement: debt } } }),
    prisma.transaction.create({
      data: {
        userId, tontineGroupId: groupId, type: "DEBT_REPAYMENT", status: "PAID",
        amountCents: debt, currency, provider: "WALLET", reference: ref,
        riskScore: 2, metadata: JSON.stringify({ reason: "manual_repay" }),
      },
    }),
    prisma.membership.update({
      where: { id: membership.id },
      data: { debtCents: 0 } as never,
    }),
  ]);

  // Rembourser aussi les prêts d'urgence associés
  const loans = await prisma.emergencyLoan.findMany({
    where: { userId, tontineGroupId: groupId, status: "PENDING" },
  } as never);
  if ((loans as unknown[]).length > 0) {
    await prisma.emergencyLoan.updateMany({
      where: { userId, tontineGroupId: groupId, status: "PENDING" },
      data: { status: "REPAID", repaidAt: new Date(), repaidCents: debt },
    } as never);
    // Rembourser le fonds d'urgence
    const fund = await prisma.emergencyFund.findUnique({ where: { tontineGroupId: groupId } });
    if (fund) {
      await prisma.emergencyFund.update({ where: { id: fund.id }, data: { balanceCents: { increment: debt } } });
    }
  }

  return { ok: true, message: `Dette de ${money(debt, currency)} remboursée avec succès.` };
}

// ─── Couverture par le fonds d'urgence ──────────────────────────────────────

export async function coverByEmergencyFund(
  membershipId: string,
  groupId: string,
  userId: string
): Promise<{ covered: boolean; amountCents: number }> {
  const group = await prisma.tontineGroup.findUnique({
    where: { id: groupId },
    include: { emergencyFund: true },
  });
  if (!group?.emergencyFund) return { covered: false, amountCents: 0 };

  const fund = group.emergencyFund;
  const needed = group.contributionCents;

  if (fund.balanceCents < needed) return { covered: false, amountCents: 0 };

  // Débit du fonds + création du prêt
  const dueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.emergencyFund.update({
      where: { id: fund.id },
      data: { balanceCents: { decrement: needed } },
    }),
    prisma.emergencyLoan.create({
      data: {
        emergencyFundId: fund.id,
        membershipId,
        userId,
        tontineGroupId: groupId,
        amountCents: needed,
        currency: group.currency,
        reason: "MISSED_PAYMENT",
        status: "PENDING",
        dueAt,
      },
    } as never),
    prisma.membership.update({
      where: { id: membershipId },
      data: { debtCents: needed } as never,
    }),
    prisma.notification.create({
      data: {
        userId,
        tontineGroupId: groupId,
        title: "🛟 Fonds de solidarité — avance couverte",
        body: `Le fonds commun du groupe a avancé votre cotisation de ${money(needed, group.currency)}. Vous devez rembourser avant le ${dueAt.toLocaleDateString("fr-FR")}.`,
        type: "EMERGENCY",
      },
    }),
  ]);

  void sendPushToUser(userId, {
    title: "🛟 Cotisation avancée par le fonds commun",
    body: `${money(needed, group.currency)} avancés. Remboursement dû le ${dueAt.toLocaleDateString("fr-FR")}`,
    url: `/tontines/${groupId}`,
  });

  return { covered: true, amountCents: needed };
}

// ─── Exclusion par l'admin ───────────────────────────────────────────────────

export async function excludeMember(
  adminUserId: string,
  membershipId: string,
  reason = "Exclusion administrative"
): Promise<{ ok: boolean; message: string; debtCents: number }> {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      tontineGroup: {
        select: { id: true, name: true, currency: true, contributionCents: true, currentRound: true, createdById: true },
      },
      user: { select: { email: true, fullName: true } },
    },
  });
  if (!membership) return { ok: false, message: "Membership introuvable.", debtCents: 0 };

  // Seul l'admin du groupe ou un super-admin peut exclure
  const isGroupAdmin = membership.tontineGroup.createdById === adminUserId;
  const admin = await prisma.user.findUnique({ where: { id: adminUserId }, select: { role: true } });
  if (!isGroupAdmin && admin?.role !== "ADMIN") {
    return { ok: false, message: "Permission refusée.", debtCents: 0 };
  }

  const { userId, tontineGroup } = membership;
  const debtCents = await calcMemberDebt(userId, tontineGroup.id);

  await prisma.membership.update({
    where: { id: membershipId },
    data: {
      status: "EXCLUDED",
      leftAt: new Date(),
      leaveReason: reason,
      debtCents,
    } as never,
  });

  // Notifier le membre exclu
  await prisma.notification.create({
    data: {
      userId,
      tontineGroupId: tontineGroup.id,
      title: "⛔ Vous avez été exclu du groupe",
      body: `${reason}. ${debtCents > 0 ? `Vous devez encore ${money(debtCents, tontineGroup.currency)} au groupe.` : ""}`,
      type: "EXCLUSION",
    },
  });

  void sendPushToUser(userId, {
    title: "⛔ Exclu du groupe",
    body: `${tontineGroup.name} — ${reason}`,
    url: "/tontines",
  });

  // Notifier le groupe
  const members = await prisma.membership.findMany({
    where: { tontineGroupId: tontineGroup.id, status: "ACTIVE" },
    select: { userId: true },
  });
  for (const m of members) {
    void sendPushToUser(m.userId, {
      title: `ℹ️ Membre exclu — ${tontineGroup.name}`,
      body: `${membership.user.fullName} a été retiré du groupe. Le cercle continue.`,
      url: `/tontines/${tontineGroup.id}`,
    });
  }

  void penalizeLate(userId);

  return {
    ok: true,
    message: `${membership.user.fullName} exclu. ${debtCents > 0 ? `Dette de ${money(debtCents, tontineGroup.currency)} enregistrée.` : ""}`,
    debtCents,
  };
}

// ─── Alimentation du fonds d'urgence à chaque cotisation ────────────────────

export async function feedEmergencyFund(
  groupId: string,
  contributionCents: number,
  currency: string
): Promise<void> {
  const group = await prisma.tontineGroup.findUnique({
    where: { id: groupId },
    select: { emergencyFundBps: true, emergencyFund: true },
  } as never) as { emergencyFundBps?: number; emergencyFund?: { id: string } | null } | null;

  if (!group) return;
  const bps = (group as { emergencyFundBps?: number }).emergencyFundBps ?? 500;
  const fee = Math.round(contributionCents * bps / 10_000);
  if (fee === 0) return;

  const fund = await prisma.emergencyFund.upsert({
    where: { tontineGroupId: groupId },
    create: { tontineGroupId: groupId, balanceCents: fee, currency },
    update: { balanceCents: { increment: fee } },
  });
  void fund;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function notifyAdminLeave(userId: string, groupId: string, groupName: string, debtCents: number) {
  const group = await prisma.tontineGroup.findUnique({
    where: { id: groupId },
    select: { createdById: true, currency: true },
  });
  if (!group) return;
  const leavingUser = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });

  await prisma.notification.create({
    data: {
      userId: group.createdById,
      tontineGroupId: groupId,
      title: `🚪 Départ — ${groupName}`,
      body: `${leavingUser?.fullName ?? "Un membre"} a quitté le groupe.${debtCents > 0 ? ` Dette : ${money(debtCents, group.currency)}.` : ""}`,
      type: "MEMBER_LEFT",
    },
  });
}
