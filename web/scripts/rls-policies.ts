import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tables = [
  "User","Admin","Wallet","TontineGroup","Membership","Contribution",
  "Transaction","Notification","Message","Badge","UserBadge","TrustScore",
  "AdminLog","FraudAlert","Dispute","Vote","EmergencyFund",
  "PasswordResetToken","RateLimitBucket"
];

async function main() {
  for (const t of tables) {
    try {
      await prisma.$queryRawUnsafe(
        `CREATE POLICY backend_full_access ON tontineapp."${t}" FOR ALL TO postgres, service_role USING (true) WITH CHECK (true)`
      );
      console.log("Policy créée :", t);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log("Déjà existante :", t);
      } else {
        console.log("Erreur :", t, "→", msg.slice(0, 80));
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
