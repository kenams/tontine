export type GemTier = {
  name: string;
  emoji: string;
  color: string;
  bg: string;
  minCents: number;
  maxCents: number;
  tagline: string;
};

export const GEM_TIERS: GemTier[] = [
  { name: "Quartz",        emoji: "🪨", color: "#cbd5e1", bg: "rgba(203,213,225,0.1)", minCents: 1000,   maxCents: 2999,    tagline: "Pour commencer" },
  { name: "Améthyste",     emoji: "💜", color: "#c084fc", bg: "rgba(192,132,252,0.1)", minCents: 3000,   maxCents: 7499,    tagline: "Madagascar" },
  { name: "Topaze",        emoji: "💛", color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  minCents: 7500,   maxCents: 14999,   tagline: "Nigeria" },
  { name: "Émeraude",      emoji: "💚", color: "#22c55e", bg: "rgba(34,197,94,0.1)",   minCents: 15000,  maxCents: 49999,   tagline: "Zambie" },
  { name: "Saphir",        emoji: "💙", color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  minCents: 50000,  maxCents: 149999,  tagline: "Madagascar" },
  { name: "Rubis",         emoji: "❤️", color: "#f87171", bg: "rgba(248,113,113,0.1)", minCents: 150000, maxCents: 299999,  tagline: "Mozambique" },
  { name: "Tanzanite",     emoji: "🔵", color: "#818cf8", bg: "rgba(129,140,248,0.1)", minCents: 300000, maxCents: 699999,  tagline: "Tanzanie" },
  { name: "Diamant Noir",  emoji: "🖤", color: "#e2e8f0", bg: "rgba(226,232,240,0.08)",minCents: 700000, maxCents: Infinity, tagline: "Afrique du Sud" },
];

export function getTierFromCents(amountCents: number): GemTier {
  return GEM_TIERS.find((t) => amountCents >= t.minCents && amountCents <= t.maxCents) ?? GEM_TIERS[0]!;
}
