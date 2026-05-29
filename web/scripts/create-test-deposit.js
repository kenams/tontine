// Script utilisé par fulltest.py pour créer une transaction WALLET_DEPOSIT de test
// Usage: node create-test-deposit.js <userEmail>
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) { console.log(JSON.stringify({ error: "no email" })); return; }

  const user = await p.user.findUnique({ where: { email } });
  if (!user) { console.log(JSON.stringify({ error: "user not found" })); return; }

  let wallet = await p.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await p.wallet.create({
      data: { userId: user.id, balanceCents: 0, currency: "EUR", status: "ACTIVE" }
    });
  }

  const ref = "DEP-TEST-" + Date.now();
  const tx = await p.transaction.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents: 2500,
      currency: "EUR",
      provider: "STRIPE",
      reference: ref,
      riskScore: 10,
      metadata: "{}"
    }
  });

  console.log(JSON.stringify({ txId: tx.id, walletId: wallet.id, userId: user.id }));
}

main().catch(e => console.log(JSON.stringify({ error: e.message }))).finally(() => p.$disconnect());
