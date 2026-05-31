export type GemTier = {
  name: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  minCents: number;
  maxCents: number;
  origin: string;
  tagline: string;
};

export const GEM_TIERS: GemTier[] = [
  {
    name: "Quartz",
    emoji: "🪨",
    color: "#cbd5e1",
    bg: "rgba(203,213,225,0.08)",
    border: "rgba(203,213,225,0.2)",
    glow: "rgba(203,213,225,0.15)",
    minCents: 1000,
    maxCents: 2999,
    origin: "Universel",
    tagline: "Pour commencer ensemble",
  },
  {
    name: "Améthyste",
    emoji: "💜",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
    border: "rgba(192,132,252,0.2)",
    glow: "rgba(192,132,252,0.2)",
    minCents: 3000,
    maxCents: 7499,
    origin: "Madagascar",
    tagline: "L'épargne prend forme",
  },
  {
    name: "Topaze",
    emoji: "💛",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.2)",
    glow: "rgba(251,191,36,0.2)",
    minCents: 7500,
    maxCents: 14999,
    origin: "Nigeria",
    tagline: "Des projets qui se concrétisent",
  },
  {
    name: "Émeraude",
    emoji: "💚",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    glow: "rgba(34,197,94,0.25)",
    minCents: 15000,
    maxCents: 49999,
    origin: "Zambie",
    tagline: "Le cercle de confiance",
  },
  {
    name: "Saphir",
    emoji: "💙",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.2)",
    glow: "rgba(96,165,250,0.25)",
    minCents: 50000,
    maxCents: 149999,
    origin: "Madagascar",
    tagline: "Pour ceux qui voient grand",
  },
  {
    name: "Rubis",
    emoji: "❤️",
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.2)",
    glow: "rgba(248,113,113,0.25)",
    minCents: 150000,
    maxCents: 299999,
    origin: "Mozambique",
    tagline: "L'élite de la diaspora",
  },
  {
    name: "Tanzanite",
    emoji: "🔵",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.1)",
    border: "rgba(129,140,248,0.3)",
    glow: "rgba(129,140,248,0.3)",
    minCents: 300000,
    maxCents: 699999,
    origin: "Tanzanie (unique au monde)",
    tagline: "Rare. Exclusif. Africain.",
  },
  {
    name: "Diamant Noir",
    emoji: "🖤",
    color: "#e2e8f0",
    bg: "rgba(226,232,240,0.06)",
    border: "rgba(226,232,240,0.25)",
    glow: "rgba(226,232,240,0.2)",
    minCents: 700000,
    maxCents: Infinity,
    origin: "Afrique du Sud · RDC",
    tagline: "Le sommet de l'épargne collective",
  },
];

export function getTierFromCents(amountCents: number): GemTier {
  return (
    GEM_TIERS.find((t) => amountCents >= t.minCents && amountCents <= t.maxCents)
    ?? GEM_TIERS[0]!
  );
}

export function getTierFromEuros(euros: number): GemTier {
  return getTierFromCents(Math.round(euros * 100));
}
