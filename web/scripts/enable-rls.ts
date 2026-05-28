import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tables = [
  "User","Admin","Wallet","TontineGroup","Membership","Contribution",
  "Transaction","Notification","Message","Badge","UserBadge","TrustScore",
  "AdminLog","FraudAlert","Dispute","Vote","EmergencyFund",
  "PasswordResetToken","RateLimitBucket"
];

async function main() {
  let ok = 0, skip = 0;
  for (const t of tables) {
    try {
      await prisma.$executeRaw`SET search_path TO tontineapp`;
      // Using template literal tag — bypasses pgBouncer DDL restriction via direct URL
      await prisma.$queryRawUnsafe(`ALTER TABLE tontineapp."${t}" ENABLE ROW LEVEL SECURITY`);
      console.log("✓", t);
      ok++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already") || msg.includes("already enabled")) {
        console.log("~ déjà actif:", t);
        ok++;
      } else {
        console.log("✗", t, "→", msg.slice(0, 100));
        skip++;
      }
    }
  }
  console.log(`\nRLS : ${ok} OK, ${skip} erreur(s)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
