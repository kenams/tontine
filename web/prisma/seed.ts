import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const now = new Date();
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

async function reset() {
  await prisma.adminLog.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.emergencyFund.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.tontineGroup.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.trustScore.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const userPassword = await bcrypt.hash("User123!", 12);
  const sharedPassword = await bcrypt.hash("Demo123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@kotizy.app",
      passwordHash: adminPassword,
      fullName: "Amina Diop",
      phone: "+221770000001",
      role: "ADMIN",
      status: "ACTIVE",
      kycStatus: "VERIFIED",
      adminProfile: { create: { permissions: "SUPER_ADMIN" } },
      trustScore: { create: { score: 98, paymentReliability: 99, communityRating: 96, fraudRisk: 2 } },
      wallet: { create: { balanceCents: 2500000, currency: "XOF" } }
    }
  });

  const user = await prisma.user.create({
    data: {
      email: "user@kotizy.app",
      passwordHash: userPassword,
      fullName: "Moussa Kone",
      phone: "+22507000001",
      role: "USER",
      status: "ACTIVE",
      kycStatus: "VERIFIED",
      trustScore: { create: { score: 86, paymentReliability: 92, communityRating: 88, fraudRisk: 8 } },
      wallet: { create: { balanceCents: 385000, currency: "XOF" } }
    }
  });

  const demoUsers = await Promise.all(
    [
      ["fatou@kotizy.app", "Fatou Sarr", "+221770000002", 680000, "USD", 91],
      ["yann@kotizy.app", "Yann Kouassi", "+22507000002", 214000, "CAD", 78],
      ["mariam@kotizy.app", "Mariam Traore", "+22376000003", 930000, "EUR", 94],
      ["ibrahim@kotizy.app", "Ibrahim Ba", "+221770000004", 12500000, "NGN", 63],
      ["sarah@kotizy.app", "Sarah Ndao", "+442071830001", 440000, "GBP", 82]
    ].map(([email, fullName, phone, balance, currency, score]) =>
      prisma.user.create({
        data: {
          email: String(email),
          passwordHash: sharedPassword,
          fullName: String(fullName),
          phone: String(phone),
          role: "USER",
          status: email === "ibrahim@kotizy.app" ? "REVIEW" : "ACTIVE",
          kycStatus: "VERIFIED",
          trustScore: {
            create: {
              score: Number(score),
              paymentReliability: Math.min(Number(score) + 4, 99),
              communityRating: Number(score),
              fraudRisk: Math.max(4, 100 - Number(score))
            }
          },
          wallet: { create: { balanceCents: Number(balance), currency: String(currency) } }
        }
      })
    )
  );

  const [fatou, yann, mariam, ibrahim, sarah] = demoUsers;

  const badges = await Promise.all(
    [
      ["founder", "Membre fondateur", "A rejoint une tontine pilote", "gold"],
      ["on-time", "Toujours a l'heure", "Aucune cotisation en retard sur 3 cycles", "emerald"],
      ["guardian", "Gardien du groupe", "Aide la communaute a rester a jour", "ivory"],
      ["high-trust", "Confiance elite", "Score de confiance superieur a 85", "emerald"]
    ].map(([code, name, description, color]) =>
      prisma.badge.create({ data: { code, name, description, color } })
    )
  );

  const family = await prisma.tontineGroup.create({
    data: {
      name: "Cercle Emeraude",
      slug: "cercle-emeraude",
      description: "Tontine premium pour objectifs famille, frais transparents et rotation automatique.",
      contributionCents: 50000,
      currency: "XOF",
      frequency: "MONTHLY",
      maxMembers: 8,
      status: "ACTIVE",
      joinCode: "EMERAUDE8",
      rules: "Paiement avant le 5 de chaque mois. Penalite automatique apres 48h. Vote requis pour tout pret.",
      nextDueAt: daysFromNow(4),
      currentRound: 3,
      createdById: user.id,
      latePenaltyCents: 3500,
      emergencyFund: { create: { balanceCents: 245000, targetCents: 500000, loanPoolCents: 160000, currency: "XOF" } }
    }
  });

  const business = await prisma.tontineGroup.create({
    data: {
      name: "Global Founders Circle",
      slug: "global-founders-circle",
      description: "Groupe international de financement communautaire pour entrepreneurs, avec fonds urgence et audit renforces.",
      contributionCents: 150000,
      currency: "USD",
      frequency: "BIWEEKLY",
      maxMembers: 12,
      status: "ACTIVE",
      joinCode: "GLOBAL12",
      rules: "Double validation admin pour les sorties de fonds. KYC obligatoire. Rotation par score de confiance. Paiements Stripe, Flutterwave ou wallet compatible.",
      nextDueAt: daysFromNow(9),
      currentRound: 5,
      createdById: fatou.id,
      latePenaltyCents: 7500,
      emergencyFund: { create: { balanceCents: 1120000, targetCents: 2000000, loanPoolCents: 620000, currency: "USD" } }
    }
  });

  const travel = await prisma.tontineGroup.create({
    data: {
      name: "Voyage 2026",
      slug: "voyage-2026",
      description: "Epargne collective simple pour financer vacances et billets d'avion.",
      contributionCents: 2500,
      currency: "EUR",
      frequency: "WEEKLY",
      maxMembers: 6,
      status: "OPEN",
      joinCode: "VOYAGE26",
      rules: "Cotisation chaque vendredi. Retrait final au vote majoritaire.",
      nextDueAt: daysFromNow(2),
      currentRound: 1,
      createdById: mariam.id,
      latePenaltyCents: 150,
      emergencyFund: { create: { balanceCents: 6500, targetCents: 25000, loanPoolCents: 2500, currency: "EUR" } }
    }
  });

  const groups = [family, business, travel];
  const familyMembers = [user, fatou, yann, mariam, sarah];
  const businessMembers = [fatou, admin, mariam, ibrahim, user];
  const travelMembers = [mariam, sarah, yann, user];

  for (const [group, members] of [
    [family, familyMembers],
    [business, businessMembers],
    [travel, travelMembers]
  ] as const) {
    for (let index = 0; index < members.length; index += 1) {
      await prisma.membership.create({
        data: {
          userId: members[index].id,
          tontineGroupId: group.id,
          role: index === 0 ? "ORGANIZER" : "MEMBER",
          status: members[index].email === "ibrahim@kotizy.app" ? "LATE" : "ACTIVE",
          payoutOrder: index + 1,
          nextPayoutAt: daysFromNow((index + 1) * 28),
          paidThisRound: index !== 3
        }
      });
    }
  }

  const allUsers = [admin, user, ...demoUsers];
  for (const member of allUsers) {
    const score = member.email === "user@kotizy.app" || member.email === "admin@kotizy.app" ? badges[3] : badges[0];
    await prisma.userBadge.create({ data: { userId: member.id, badgeId: score.id } });
  }
  await prisma.userBadge.create({ data: { userId: user.id, badgeId: badges[1].id } });
  await prisma.userBadge.create({ data: { userId: fatou.id, badgeId: badges[2].id } });

  let txCounter = 1000;
  for (const group of groups) {
    const memberships = await prisma.membership.findMany({ where: { tontineGroupId: group.id }, include: { user: true } });
    for (const membership of memberships) {
      const status = membership.status === "LATE" ? "PENDING" : txCounter % 6 === 0 ? "FAILED" : "PAID";
      const paidAt = status === "PAID" ? daysAgo(txCounter % 18) : null;
      await prisma.contribution.create({
        data: {
          userId: membership.userId,
          tontineGroupId: group.id,
          amountCents: group.contributionCents,
          currency: group.currency,
          penaltyCents: status === "PENDING" ? group.latePenaltyCents : 0,
          status,
          dueAt: daysAgo(txCounter % 12),
          paidAt,
          paymentProvider: txCounter % 3 === 0 ? "WAVE" : txCounter % 3 === 1 ? "ORANGE_MONEY" : "WALLET",
          reference: `COT-${txCounter}`
        }
      });

      const wallet = await prisma.wallet.findUnique({ where: { userId: membership.userId } });
      await prisma.transaction.create({
        data: {
          userId: membership.userId,
          walletId: wallet?.id,
          tontineGroupId: group.id,
          type: "CONTRIBUTION",
          status,
          amountCents: group.contributionCents + (status === "PENDING" ? group.latePenaltyCents : 0),
          currency: group.currency,
          provider: txCounter % 3 === 0 ? "WAVE" : txCounter % 3 === 1 ? "ORANGE_MONEY" : "WALLET",
          reference: `TX-${txCounter}`,
          riskScore: membership.status === "LATE" ? 78 : txCounter % 6 === 0 ? 64 : 12,
          metadata: JSON.stringify({ channel: "demo", round: group.currentRound })
        }
      });
      txCounter += 1;
    }
  }

  for (const [group, sender, content] of [
    [family, fatou, "J'ai confirme ma cotisation. Prochaine rotation pour Moussa."],
    [family, user, "Merci, je partage le recu dans le wallet."],
    [business, admin, "Controle anti-fraude OK. Volume global stable cette semaine."],
    [business, ibrahim, "Je regularise mon retard avant vendredi."],
    [travel, sarah, "On garde le montant actuel pour le prochain cycle ?"]
  ] as const) {
    await prisma.message.create({ data: { userId: sender.id, tontineGroupId: group.id, content } });
  }

  for (const member of [user, fatou, mariam, yann, sarah]) {
    await prisma.notification.create({
      data: {
        userId: member.id,
        tontineGroupId: family.id,
        title: "Prochaine cotisation",
        body: "Votre prochaine echeance approche. Paiement en 1 clic disponible.",
        type: "DUE_REMINDER"
      }
    });
  }
  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: "Nouvelle alerte risque",
      body: "Paiement fractionne suspect detecte sur Global Founders Circle.",
      type: "FRAUD_ALERT"
    }
  });

  await prisma.fraudAlert.create({
    data: {
      userId: ibrahim.id,
      tontineGroupId: business.id,
      severity: "HIGH",
      status: "OPEN",
      title: "Pattern de paiement inhabituel",
      description: "Trois tentatives echouees suivies d'un changement de numero mobile money.",
      riskScore: 87
    }
  });
  await prisma.fraudAlert.create({
    data: {
      userId: yann.id,
      tontineGroupId: travel.id,
      severity: "MEDIUM",
      status: "REVIEWING",
      title: "Retard recurrent",
      description: "Deux retards dans le meme cycle et solde wallet insuffisant.",
      riskScore: 61
    }
  });

  await prisma.dispute.create({
    data: {
      userId: yann.id,
      tontineGroupId: family.id,
      title: "Verification contribution Wave",
      status: "OPEN",
      priority: "MEDIUM",
      amountCents: 50000,
      currency: "XOF"
    }
  });

  await prisma.vote.create({
    data: {
      userId: fatou.id,
      tontineGroupId: business.id,
      title: "Autoriser un pret communautaire de 1 200 USD",
      choice: "YES",
      status: "OPEN",
      closesAt: daysFromNow(3)
    }
  });

  for (const [action, targetType, targetId, metadata] of [
    ["USER_LOGIN", "User", user.id, { ip: "127.0.0.1" }],
    ["ADMIN_REVIEW_ALERT", "FraudAlert", "seed-alert", { severity: "HIGH" }],
    ["EXPORT_TRANSACTIONS", "Transaction", "all", { format: "csv" }],
    ["USER_STATUS_UPDATED", "User", ibrahim.id, { status: "REVIEW" }]
  ] as const) {
    await prisma.adminLog.create({
      data: {
        actorId: admin.id,
        action,
        targetType,
        targetId,
        ipAddress: "127.0.0.1",
        metadata: JSON.stringify(metadata)
      }
    });
  }

  console.log("Seed complete");
  console.log("Admin: admin@kotizy.app / Admin123!");
  console.log("User: user@kotizy.app / User123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
