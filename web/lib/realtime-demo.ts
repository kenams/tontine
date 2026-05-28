const activityFeed = [
  { type: "payment", title: "Cotisation confirmee", region: "Dakar", currency: "XOF" },
  { type: "payment", title: "Versement Apple Pay valide", region: "Paris", currency: "EUR" },
  { type: "join", title: "Nouveau membre approuve", region: "Montreal", currency: "CAD" },
  { type: "risk", title: "Score risque recalcule", region: "Abidjan", currency: "XOF" },
  { type: "wallet", title: "Wallet USD recharge", region: "New York", currency: "USD" },
  { type: "mobile-money", title: "MTN MoMo en attente", region: "Accra", currency: "GHS" },
  { type: "fraud", title: "Alerte comportementale faible", region: "Lagos", currency: "NGN" },
  { type: "wave", title: "Paiement Wave synchronise", region: "Bamako", currency: "XOF" }
];

export function realtimeMetrics() {
  const tick = Math.floor(Date.now() / 4500);
  return {
    onlineUsers: 27 + (tick % 9),
    onlineAdmins: 1 + (tick % 2),
    paymentsPerMinute: 8 + (tick % 6),
    fraudRiskAverage: 14 + (tick % 7),
    pendingPayments: 4 + (tick % 5),
    failedPayments: 1 + (tick % 3),
    activeGroups: 11 + (tick % 4),
    latencyMs: 34 + (tick % 18),
    generatedAt: new Date().toISOString()
  };
}

export function realtimeActivity() {
  const tick = Math.floor(Date.now() / 6500);
  const template = activityFeed[tick % activityFeed.length];
  return {
    ...template,
    id: `evt_${Date.now()}_${tick}`,
    amount: 15000 + ((tick * 7250) % 185000),
    generatedAt: new Date().toISOString()
  };
}
