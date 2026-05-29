import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function reset() {
  await prisma.adminLog.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.rateLimitBucket.deleteMany();
  await prisma.emergencyFund.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
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

  const password = process.env.ADMIN_PASSWORD ?? "Kotizy@2026!";
  const hash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email: "kenams42@gmail.com",
      passwordHash: hash,
      fullName: "Kenams",
      phone: null,
      role: "ADMIN",
      status: "ACTIVE",
      kycStatus: "VERIFIED",
      adminProfile: { create: { permissions: "SUPER_ADMIN" } },
      trustScore: { create: { score: 0, paymentReliability: 0, communityRating: 0, fraudRisk: 100 } },
      wallet: { create: { balanceCents: 0, currency: "XOF" } },
      notifications: {
        create: {
          title: "Bienvenue sur Kotizy Admin",
          body: "Votre compte administrateur KAH Digital est prêt. Toutes les transactions, utilisateurs et alertes sont visibles ici.",
          type: "WELCOME"
        }
      }
    }
  });

  console.log("\nSeed OK — base propre");
  console.log("Admin : kenams42@gmail.com");
  console.log("Mdp   :", password);
  console.log("\nChanger le mot de passe via /forgot-password après connexion.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
