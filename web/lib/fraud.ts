export type FraudScoreInput = {
  amountCents: number;
  currency: string;
  provider: string;
  trustScore?: number;
  failedTransactions?: number;
  pendingTransactions?: number;
  lateMemberships?: number;
  velocityCount?: number;
  crossBorder?: boolean;
  newDevice?: boolean;
};

export type FraudScoreResult = {
  riskScore: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  signals: string[];
  recommendation: string;
};

export function scoreFraudRisk(input: FraudScoreInput): FraudScoreResult {
  const signals: string[] = [];
  let riskScore = 8;

  if (input.amountCents >= 500_000) {
    riskScore += 18;
    signals.push("montant eleve");
  }

  if ((input.failedTransactions ?? 0) >= 2) {
    riskScore += 16;
    signals.push("echecs paiement repetes");
  }

  if ((input.pendingTransactions ?? 0) >= 3) {
    riskScore += 10;
    signals.push("file attente paiement dense");
  }

  if ((input.lateMemberships ?? 0) > 0) {
    riskScore += Math.min(18, (input.lateMemberships ?? 0) * 6);
    signals.push("retards cotisation");
  }

  if ((input.velocityCount ?? 0) >= 5) {
    riskScore += 12;
    signals.push("frequence transactionnelle inhabituelle");
  }

  if (input.crossBorder) {
    riskScore += 8;
    signals.push("transaction internationale");
  }

  if (input.newDevice) {
    riskScore += 9;
    signals.push("nouvel appareil");
  }

  if ((input.trustScore ?? 75) < 60) {
    riskScore += 18;
    signals.push("score confiance faible");
  }

  if (["CARD_GLOBAL", "BANK_TRANSFER"].includes(input.provider)) {
    riskScore += 4;
  }

  riskScore = Math.max(1, Math.min(99, riskScore));
  const level = riskScore >= 75 ? "CRITICAL" : riskScore >= 55 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW";

  return {
    riskScore,
    level,
    signals: signals.length ? signals : ["aucun signal critique"],
    recommendation:
      level === "CRITICAL"
        ? "Bloquer la transaction et ouvrir une revue admin."
        : level === "HIGH"
          ? "Demander une verification supplementaire avant validation."
          : level === "MEDIUM"
            ? "Appliquer une surveillance renforcee sur le cycle."
            : "Valider automatiquement avec audit trail standard."
  };
}
